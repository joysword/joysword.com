# YNAB CSV Importer — AI Agent Architecture

## Overview

An AI agent that reads **any** transaction CSV file, understands its format
using an LLM, consults local guide files for user preferences (payee mappings,
account names, categories), and generates + executes YNAB API calls. No
bank-specific parsers or configs — the LLM _is_ the parser.

CSV files typically come from **transaction channels** (Apple Pay, PayPal,
Venmo, a bank's export) — not necessarily from the account the money belongs
to. A single CSV may contain transactions across multiple credit cards or bank
accounts. The agent reads per-row data (e.g., a "Card" or "Payment Method"
column) to determine the correct YNAB account for each transaction.

---

## How It Works

```
CSV file (any source: Apple Pay, Chase, PayPal, ...)
       │
       ▼
┌──────────────────────────┐
│  Agent reads CSV          │  ← raw file content (header + rows)
│  + local guides           │  ← mappings.md, settings.yaml
│  + YNAB API ref           │  ← bundled API reference doc
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  LLM understands:         │
│  • column meanings        │  (date, amount, payee, etc.)
│  • date formats           │
│  • amount sign convention │  (negative = charge? positive = charge?)
│  • payee mapping          │  (from guides)
│  • per-row account column │  (card/payment method → YNAB account)
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Agent builds YNAB        │
│  API payload (may span    │
│  multiple accounts) and   │
│  calls the API            │  ← POST /budgets/{id}/transactions
└──────────────────────────┘
```

**Key insight**: The LLM replaces all bank-specific adapters, regex-based payee
matchers, and column mapping configs. The user just maintains a simple Markdown
guide describing their preferences.

---

## Project Structure

```
ynab-importer/
├── pyproject.toml
├── PLAN.md
├── guides/
│   ├── mappings.md          # User's payee→category and account preferences
│   └── ynab-api.md          # YNAB API reference (transactions endpoint)
├── config/
│   └── settings.yaml        # YNAB API token, budget ID, model settings
├── src/
│   └── ynab_importer/
│       ├── __init__.py
│       ├── cli.py            # CLI entry point (click)
│       ├── agent.py          # Core agent: CSV → LLM → YNAB API calls
│       ├── ynab_client.py    # Thin YNAB API client (agent's tool)
│       ├── watcher.py        # Folder watcher (watchdog)
│       └── models.py         # Transaction model (for structured output)
└── tests/
    ├── test_agent.py
    └── fixtures/
        └── sample_chase.csv
```

What's gone vs. the old design:
- ❌ `config/banks/*.yaml` — no bank-specific configs
- ❌ `parser.py` — LLM parses the CSV
- ❌ `cleaner.py` — LLM cleans/normalizes
- ❌ `mapper.py` — LLM maps payees using guides
- ❌ `compile_config.py` — no YAML compilation, guides are plain Markdown
- ❌ `mappings.yaml` — replaced by `guides/mappings.md` read directly

---

## Step-by-step Plan

### Step 1: Restructure project

- Remove old bank-specific modules (`parser.py`, `cleaner.py`, `mapper.py`,
  `compile_config.py`, `config/banks/`)
- Move `config/mappings.md` → `guides/mappings.md` (user's guide, stays Markdown)
- Create `guides/ynab-api.md` — concise YNAB API reference the agent uses
- Update `pyproject.toml`: replace `pyyaml` with `anthropic` SDK, keep `click`,
  `watchdog`, `requests`, `pydantic`
- Update `config/settings.yaml` to include model/LLM settings

### Step 2: YNAB API reference guide (`guides/ynab-api.md`)

Write a concise reference doc the agent includes in its context:
- `POST /budgets/{budget_id}/transactions` request/response format
- Transaction object fields: `account_id`, `date` (ISO), `amount` (milliunits),
  `payee_name`, `memo`, `category_name`, `import_id`, `cleared`
- `import_id` format for dedup: `YNAB:{milliunit_amount}:{iso_date}:{occurrence}`
- Amount convention: negative = outflow, positive = inflow, in milliunits (×1000)
- Bulk create: `{ "transactions": [...] }`

### Step 3: Transaction model (`models.py`)

Keep existing Pydantic model, simplified. This is used for structured LLM output:
- Fields: `date`, `amount` (milliunits), `payee_name`, `memo`,
  `account_id`, `category_name`, `import_id`, `cleared`
- The model matches the YNAB API transaction shape directly — the LLM outputs
  transactions ready to POST.

### Step 4: Core agent (`agent.py`)

The heart of the system. Uses the Anthropic SDK with tool use:

```python
def process_csv(csv_path: Path, dry_run: bool = False) -> dict:
    """Read a CSV, send it to the LLM with guides, get back YNAB transactions."""
```

**Agent prompt construction:**
1. System prompt: "You are a YNAB transaction import agent..."
2. Include contents of `guides/ynab-api.md` (API reference)
3. Include contents of `guides/mappings.md` (user preferences)
4. Include the user's YNAB account list (fetched from API, so the agent knows
   valid account IDs and names)
5. Include the CSV file content (header + all rows)
6. Ask the LLM to output a JSON array of YNAB transaction objects

**Agent tools (function calling):**
- `create_transactions(transactions)` — calls YNAB API to create transactions
- `list_accounts()` — fetches YNAB accounts (for account ID resolution)
- `list_categories()` — fetches YNAB categories (for category matching)

The agent:
1. Reads the CSV and figures out what each column means
2. Reads the user's mapping guide for payee/category/account preferences
3. Calls `list_accounts()` and `list_categories()` to get valid YNAB IDs
4. For each row, determines the correct YNAB account from the per-row
   account/card/payment-method column (one CSV may span multiple accounts)
5. Maps each CSV row to a YNAB transaction, applying the user's preferences
6. Calls `create_transactions()` to POST them to YNAB

### Step 5: YNAB client as agent tools (`ynab_client.py`)

Refactor the existing client into tool functions the agent can call:
- `list_accounts(budget_id)` → returns list of `{id, name}` pairs
- `list_categories(budget_id)` → returns list of `{id, name, group}` pairs
- `create_transactions(budget_id, transactions)` → POSTs to YNAB, returns result
- Keep retry logic for rate limiting
- Keep dry-run mode (returns payload without calling API)

### Step 6: CLI (`cli.py`)

Simplify the CLI — no `--bank` flag needed:
- `ynab-importer import <file_or_folder> [--dry-run]`
- `ynab-importer watch <folder> [--dry-run]`
- On import: read CSV → call agent → print summary of created/skipped transactions
- `--dry-run`: agent still runs but transactions are printed, not POSTed

### Step 7: Folder watcher (`watcher.py`)

Keep mostly as-is:
- Watch directory for new `*.csv` files
- On new file: wait for settle, then run agent pipeline
- Log results

### Step 8: Tests

- Test agent with mocked Anthropic API responses
- Test YNAB client tools with mocked HTTP
- Integration test: sample CSV → agent → verify YNAB payload structure
- Keep sample fixture CSVs

---

## Key Design Decisions

1. **LLM as the parser**: No bank configs. The LLM reads raw CSV and figures
   out the format. Works with any bank, any column layout, any date format.
2. **Guides, not configs**: The user writes plain English/Markdown guides
   describing their preferences. No regex, no YAML compilation.
3. **Tool use pattern**: The agent uses tools (list accounts, list categories,
   create transactions) rather than trying to guess IDs. It fetches real data
   from YNAB to make informed decisions.
4. **Structured output**: The LLM returns structured JSON matching the YNAB
   API shape, validated by Pydantic before POSTing.
5. **YNAB import_id for dedup**: Still stateless — YNAB handles dedup
   server-side via `import_id`.
6. **Dry-run mode**: Agent runs fully but skips the final API call, printing
   what it would send.

---

## Dependencies

- `anthropic` — Claude API SDK (LLM backbone)
- `click` — CLI framework
- `pydantic` — structured output validation
- `requests` — HTTP client for YNAB API
- `watchdog` — filesystem monitoring
- `pyyaml` — settings file parsing

---

## Guides

### `guides/mappings.md` (user-maintained)

Plain Markdown the user edits to express their preferences. No rigid format
required — the LLM reads it as natural language. Example:

```markdown
# My Transaction Mapping Preferences

## Payees & Categories
- Trader Joe's, Whole Foods → category: Groceries
- Spotify → category: Subscriptions: Music
- Netflix → category: Subscriptions: Streaming
- Amazon, AMZN → payee: Amazon, category: Shopping
- Uber Eats → category: Dining Out
- Uber trips, Lyft → category: Transportation

## Account Mapping
CSVs come from transaction channels (Apple Pay, bank exports, PayPal, etc.),
not necessarily from a single account. Each row usually has a column indicating
which card or payment method was used. Map those to my YNAB accounts:

- "Chase Freedom", "Chase Freedom Unlimited" → account: "Chase Freedom Unlimited"
- "BofA Checking", "Bank of America" → account: "BofA Checking"
- "Amex Gold", "American Express Gold" → account: "Amex Gold"
- "Apple Card" → account: "Apple Card"

If the CSV has no per-row account column (e.g., a single-card statement),
use the file name or header info to determine the account.

## Notes
- Charges appear as negative amounts in some CSVs but positive in others
- If you're unsure about a category, leave it blank
- A single CSV from Apple Pay or PayPal may contain transactions across
  multiple cards — always check the per-row card/method column
```

### `guides/ynab-api.md` (bundled, not user-edited)

Concise YNAB API reference so the agent knows the exact payload format.

---

## Out of Scope (future)

- Web UI / dashboard
- Multi-currency support
- Historical sync / reconciliation
- OAuth for YNAB (using personal access token for now)
- Caching LLM responses for identical CSV formats
