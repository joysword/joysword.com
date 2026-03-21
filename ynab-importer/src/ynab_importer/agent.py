"""Core AI agent: reads any CSV, uses LLM to understand it, calls YNAB API."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import anthropic

from .models import Transaction
from .ynab_client import YNABClient, load_settings

logger = logging.getLogger(__name__)

GUIDES_DIR = Path(__file__).resolve().parent.parent.parent / "guides"

# The only tool the LLM needs — the agent executes it locally with credentials.
TOOLS = [
    {
        "name": "create_transactions",
        "description": (
            "Create transactions in YNAB. The agent will add authentication and "
            "send the payload to the YNAB API on your behalf. Each transaction must have: "
            "account_id (string, from the accounts list provided), date (YYYY-MM-DD), "
            "amount (int, milliunits, negative=outflow), payee_name (string). "
            "Optional: memo, category_id (from the categories list provided), "
            "import_id (for dedup: YNAB:{milliunit_amount}:{iso_date}:{occurrence}), cleared."
        ),
        "input_schema": {
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
                            "cleared": {"type": "string", "enum": ["cleared", "uncleared", "reconciled"]},
                        },
                        "required": ["account_id", "date", "amount", "payee_name"],
                    },
                },
            },
            "required": ["transactions"],
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


def process_csv(
    csv_path: Path,
    dry_run: bool = False,
    settings_path: Path | None = None,
) -> dict:
    """Read a CSV file and use the LLM agent to import transactions into YNAB."""
    settings = load_settings(settings_path)
    ynab_settings = settings["ynab"]
    llm_settings = settings.get("llm", {})
    model = llm_settings.get("model", "claude-sonnet-4-20250514")

    llm_client = anthropic.Anthropic()
    ynab = YNABClient(
        api_token=ynab_settings["api_token"],
        budget_id=ynab_settings["budget_id"],
    )

    # Fetch accounts and categories locally — LLM never sees credentials
    logger.info("Fetching YNAB accounts and categories...")
    accounts = ynab.list_accounts()
    categories = ynab.list_categories()
    logger.info(f"  → {len(accounts)} accounts, {len(categories)} categories")

    csv_content = csv_path.read_text()
    system_prompt = _build_system_prompt(accounts, categories)

    user_message = (
        f"Here is a CSV file to import into YNAB.\n\n"
        f"File name: {csv_path.name}\n\n"
        f"```csv\n{csv_content}\n```\n\n"
        f"Please analyze this CSV, figure out the format, and create the transactions in YNAB."
    )

    messages = [{"role": "user", "content": user_message}]

    # Agent loop: run until the LLM stops calling tools
    result = {"transactions_created": 0, "duplicates_skipped": 0, "details": None}

    while True:
        response = llm_client.messages.create(
            model=model,
            max_tokens=4096,
            system=system_prompt,
            tools=TOOLS,
            messages=messages,
        )

        # Collect text and tool use blocks
        tool_calls = [b for b in response.content if b.type == "tool_use"]
        text_blocks = [b for b in response.content if b.type == "text"]

        for block in text_blocks:
            if block.text.strip():
                logger.info(f"Agent: {block.text.strip()}")

        if not tool_calls:
            break

        # Add assistant response to messages
        messages.append({"role": "assistant", "content": response.content})

        # Process each tool call
        tool_results = []
        for tool_call in tool_calls:
            tool_result = _execute_tool(
                tool_call.name,
                tool_call.input,
                ynab=ynab,
                dry_run=dry_run,
                result=result,
            )
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_call.id,
                "content": json.dumps(tool_result),
            })

        messages.append({"role": "user", "content": tool_results})

        if response.stop_reason == "end_turn":
            break

    return result


def _execute_tool(
    name: str,
    inputs: dict,
    ynab: YNABClient,
    dry_run: bool,
    result: dict,
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

        api_result = ynab.create_transactions(validated, dry_run=dry_run)

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
