"""Core AI agent: reads any CSV, uses LLM to understand it, calls YNAB API.

Uses litellm for multi-provider LLM support (Anthropic, OpenAI, Google, etc.).
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

import litellm

from .models import Transaction
from .ynab_client import BASE_URL, YNABClient, load_settings

logger = logging.getLogger(__name__)

GUIDES_DIR = Path(__file__).resolve().parent.parent.parent / "guides"

# Tool definition in OpenAI function-calling format (litellm normalizes this
# across all providers).
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_transactions",
            "description": (
                "Create transactions in YNAB. The agent will add authentication and "
                "send the payload to the YNAB API on your behalf. Each transaction must have: "
                "account_id (string, from the accounts list provided), date (YYYY-MM-DD), "
                "amount (int, milliunits, negative=outflow), payee_name (string). "
                "Optional: memo, category_id (from the categories list provided), "
                "import_id (for dedup: YNAB:{milliunit_amount}:{iso_date}:{occurrence}), cleared."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "transactions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "account_id": {"type": "string"},
                                "date": {"type": "string"},
                                "amount": {"type": "integer"},
                                "payee_name": {"type": "string"},
                                "memo": {"type": "string"},
                                "category_id": {"type": "string"},
                                "import_id": {"type": "string"},
                                "cleared": {
                                    "type": "string",
                                    "enum": ["cleared", "uncleared", "reconciled"],
                                },
                            },
                            "required": ["account_id", "date", "amount", "payee_name"],
                        },
                    },
                },
                "required": ["transactions"],
            },
        },
    },
]


def _load_guide(name: str) -> str:
    path = GUIDES_DIR / name
    if path.exists():
        return path.read_text()
    return ""


def _build_system_prompt(accounts: list[dict], categories: list[dict]) -> str:
    ynab_api_ref = _load_guide("ynab-api.md")
    mappings = _load_guide("mappings.md")

    accounts_text = json.dumps(accounts, indent=2)
    categories_text = json.dumps(categories, indent=2)

    return f"""You are a YNAB transaction import agent. Your job is to read CSV transaction \
data, understand its format, and create the corresponding transactions in YNAB.

The agent (local code) handles all API authentication and HTTP calls. You NEVER see or need \
API tokens. You just build the transaction payloads and call create_transactions(). The agent \
will add credentials and send the request to YNAB on your behalf.

## Your workflow:
1. Read the CSV data provided. Figure out:
   - What each column means (date, amount, payee, memo, account/card, etc.)
   - The date format used
   - The amount sign convention (negative = charge, or positive = charge)
   - Whether there is a per-row column indicating the card/account used
2. Consult the user's mapping preferences (below) to:
   - Map raw payee strings to clean YNAB payee names
   - Assign categories based on payee
   - Map card/account column values to YNAB account IDs (using the accounts list below)
3. For each CSV row, build a YNAB transaction with:
   - account_id: resolved from the per-row card column + user mappings + accounts list below
   - date: converted to YYYY-MM-DD format
   - amount: converted to milliunits (dollars × 1000), negative for outflows
   - payee_name: cleaned up per user preferences
   - category_id: from user preferences + categories list below (omit if unsure)
   - import_id: YNAB:{{milliunit_amount}}:{{iso_date}}:{{occurrence}} for dedup
   - cleared: "cleared"
4. Call create_transactions() with all the transactions.

## Determining the amount sign convention:
Different CSV sources use DIFFERENT sign conventions. You MUST figure out which one \
before converting amounts. Common patterns:
- **Negative = spending**: Chase, most US banks. Charges show as -45.67, payments as +500.00.
- **Positive = spending**: Amex, some international banks. Charges show as 45.67, refunds as -45.67.
- **Separate columns**: Some CSVs have "Debit" and "Credit" columns instead of a single amount.
- **Transaction type column**: Some CSVs have a "Type" column (e.g., "Sale", "Payment", "Return") \
that indicates direction.

How to determine the convention:
1. Look at column names. "Debit"/"Credit" columns are explicit. A column named "Amount" is ambiguous.
2. Look for payment/refund rows — these are the OPPOSITE of charges. If a row says "PAYMENT" or \
"REFUND" and the amount is positive, then positive = inflow and negative = outflow (standard).
3. Check the user's mapping guide for hints about specific sources.
4. If you truly cannot determine the convention, state your assumption explicitly.

YNAB convention (output): negative = outflow (spending), positive = inflow (income/refund). \
Always convert to this convention regardless of the CSV's convention.

## Important rules:
- A single CSV may contain transactions across MULTIPLE accounts (e.g., Apple Pay export \
with Chase, Amex, and Apple Card transactions). Always check for a per-row account column.
- If the CSV has no per-row account column, try to infer the account from the file name \
or any header metadata. If you truly cannot determine the account, say so.
- Generate import_id for every transaction to enable dedup. For same-day, same-amount \
transactions, increment the occurrence counter.
- Convert amounts to milliunits (integer). $45.67 spent → -45670. $100 received → 100000.
- If you're unsure about a category, omit category_id (leave it uncategorized in YNAB).
- Process ALL rows from the CSV. Do not skip any.

## YNAB Accounts (from the user's budget):
{accounts_text}

## YNAB Categories (from the user's budget):
{categories_text}

## YNAB API Reference:
{ynab_api_ref}

## User's Mapping Preferences:
{mappings}
"""


def _serialize_tool_call(tc) -> dict:
    """Convert a litellm tool call object to a JSON-serializable dict."""
    return {
        "id": tc.id,
        "type": "function",
        "function": {
            "name": tc.function.name,
            "arguments": tc.function.arguments,
        },
    }


def _serialize_message(msg) -> dict:
    """Convert a litellm message object to a JSON-serializable dict."""
    d: dict = {"role": msg.role}
    if msg.content:
        d["content"] = msg.content
    if hasattr(msg, "tool_calls") and msg.tool_calls:
        d["tool_calls"] = [_serialize_tool_call(tc) for tc in msg.tool_calls]
    return d


def process_csv(
    csv_path: Path,
    dry_run: bool = False,
    settings_path: Path | None = None,
    event_log: list | None = None,
    *,
    ynab_api_token: str | None = None,
    ynab_budget_id: str | None = None,
    llm_api_key: str | None = None,
    llm_model: str | None = None,
) -> dict:
    """Read a CSV file and use the LLM agent to import transactions into YNAB.

    Credentials can come from keyword args (GUI) or settings.yaml (CLI).
    If event_log is provided (a list), every network payload is appended.
    """
    # --- Resolve credentials: kwargs override settings.yaml ---
    settings: dict = {}
    try:
        settings = load_settings(settings_path)
    except FileNotFoundError:
        if not (ynab_api_token and ynab_budget_id):
            raise

    ynab_token = ynab_api_token or settings.get("ynab", {}).get("api_token")
    budget_id = ynab_budget_id or settings.get("ynab", {}).get("budget_id")
    model = llm_model or settings.get("llm", {}).get("model", "claude-sonnet-4-20250514")
    api_key = llm_api_key  # None is fine — litellm falls back to env vars

    if not ynab_token or not budget_id:
        raise ValueError("YNAB API token and budget ID are required.")

    ynab = YNABClient(api_token=ynab_token, budget_id=budget_id)

    # Fetch accounts and categories locally — LLM never sees credentials
    logger.info("Fetching YNAB accounts and categories...")
    accounts = ynab.list_accounts()
    categories = ynab.list_categories()
    logger.info(f"  → {len(accounts)} accounts, {len(categories)} categories")

    if event_log is not None:
        event_log.append({
            "label": "Fetch Accounts",
            "service": "ynab",
            "request": {
                "method": "GET",
                "url": f"{BASE_URL}/budgets/{{budget_id}}/accounts",
                "headers": {"Authorization": "Bearer ****", "Content-Type": "application/json"},
            },
            "response": accounts,
        })
        event_log.append({
            "label": "Fetch Categories",
            "service": "ynab",
            "request": {
                "method": "GET",
                "url": f"{BASE_URL}/budgets/{{budget_id}}/categories",
                "headers": {"Authorization": "Bearer ****", "Content-Type": "application/json"},
            },
            "response": categories,
        })

    csv_content = csv_path.read_text()
    system_prompt = _build_system_prompt(accounts, categories)

    user_message = (
        f"Here is a CSV file to import into YNAB.\n\n"
        f"File name: {csv_path.name}\n\n"
        f"```csv\n{csv_content}\n```\n\n"
        f"Please analyze this CSV, figure out the format, and create the transactions in YNAB."
    )

    messages: list[dict] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    # Agent loop: run until the LLM stops calling tools
    result = {"transactions_created": 0, "duplicates_skipped": 0, "details": None}
    turn = 0

    while True:
        turn += 1

        # Build the completion kwargs — only pass api_key if the caller gave one
        completion_kwargs: dict = {
            "model": model,
            "messages": messages,
            "tools": TOOLS,
            "max_tokens": 4096,
        }
        if api_key:
            completion_kwargs["api_key"] = api_key

        # Snapshot for event log (before the call)
        if event_log is not None:
            logged_request = {
                "model": model,
                "max_tokens": 4096,
                "messages": _snapshot_messages(messages),
                "tools": TOOLS,
            }

        response = litellm.completion(**completion_kwargs)

        msg = response.choices[0].message
        finish_reason = response.choices[0].finish_reason

        # Build serializable response for event log
        if event_log is not None:
            logged_response = {
                "id": response.id,
                "model": response.model,
                "finish_reason": finish_reason,
                "message": _serialize_message(msg),
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                },
            }
            event_log.append({
                "label": f"LLM Turn {turn}",
                "service": "llm",
                "request": logged_request,
                "response": logged_response,
            })

        if msg.content:
            logger.info(f"Agent: {msg.content.strip()}")

        if not msg.tool_calls:
            break

        # Add assistant message (with tool_calls) to conversation
        messages.append(_serialize_message(msg))

        # Execute each tool call and feed results back
        for tc in msg.tool_calls:
            fn_name = tc.function.name
            fn_args = json.loads(tc.function.arguments)

            tool_result = _execute_tool(
                fn_name,
                fn_args,
                ynab=ynab,
                dry_run=dry_run,
                result=result,
                event_log=event_log,
            )

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(tool_result),
            })

        if finish_reason == "stop":
            break

    return result


def _snapshot_messages(messages: list[dict]) -> list[dict]:
    """Deep-copy messages for logging (they're already dicts at this point)."""
    return json.loads(json.dumps(messages, default=str))


def _execute_tool(
    name: str,
    inputs: dict,
    ynab: YNABClient,
    dry_run: bool,
    result: dict,
    event_log: list | None = None,
) -> dict | list:
    """Execute a tool call from the agent and return the result."""
    logger.info(f"Tool call: {name}")

    if name == "create_transactions":
        transactions = inputs.get("transactions", [])

        # Validate with Pydantic
        validated = []
        for txn_data in transactions:
            txn = Transaction(**txn_data)
            validated.append(txn.to_api_dict())

        logger.info(f"  → Creating {len(validated)} transactions (dry_run={dry_run})")

        ynab_request = {
            "method": "POST",
            "url": f"{BASE_URL}/budgets/{{budget_id}}/transactions",
            "headers": {"Authorization": "Bearer ****", "Content-Type": "application/json"},
            "body": {"transactions": validated},
        }

        api_result = ynab.create_transactions(validated, dry_run=dry_run)

        if event_log is not None:
            event_log.append({
                "label": "Create Transactions" + (" (dry run)" if dry_run else ""),
                "service": "ynab",
                "request": ynab_request,
                "response": api_result,
            })

        if dry_run:
            result["transactions_created"] = api_result["transaction_count"]
            result["details"] = api_result
        else:
            data = api_result.get("data", {})
            created = data.get("transaction_ids", [])
            dupes = data.get("duplicate_import_ids", [])
            result["transactions_created"] = len(created)
            result["duplicates_skipped"] = len(dupes)
            result["details"] = data

        return {"status": "ok", "created": result["transactions_created"]}

    else:
        return {"error": f"Unknown tool: {name}"}
