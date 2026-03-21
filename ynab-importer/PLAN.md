# YNAB CSV Importer — Implementation Plan

## Overview

A Python CLI tool that imports bank transaction CSVs into YNAB, with support for
multiple bank formats, configurable payee-to-category and source-to-account
mappings (authored in Markdown, compiled to YAML), and both one-shot and
folder-watching modes. Deduplication uses YNAB's built-in `import_id`.

---

## Project Structure

```
ynab-importer/
├── pyproject.toml
├── README.md
├── config/
│   ├── mappings.md          # Human-authored mapping rules (Markdown)
│   ├── mappings.yaml        # Compiled structured config (generated)
│   ├── banks/
│   │   ├── chase.yaml       # Chase CSV column mapping
│   │   ├── bofa.yaml        # Bank of America CSV column mapping
│   │   └── amex.yaml        # Amex CSV column mapping
│   └── settings.yaml        # YNAB budget ID, default account, etc.
├── src/
│   └── ynab_importer/
│       ├── __init__.py
│       ├── cli.py            # CLI entry point (click)
│       ├── watcher.py        # Folder watcher (watchdog)
│       ├── parser.py         # CSV parsing with bank-specific adapters
│       ├── cleaner.py        # Data cleaning & enrichment pipeline
│       ├── mapper.py         # Payee→category, source→account mapping
│       ├── ynab_client.py    # YNAB API client (create transactions)
│       ├── compile_config.py # Markdown → YAML config compiler
│       └── models.py         # Transaction dataclass / Pydantic models
└── tests/
    ├── test_parser.py
    ├── test_cleaner.py
    ├── test_mapper.py
    └── fixtures/
        └── sample_chase.csv
```

---

## Step-by-step Plan

### Step 1: Project scaffolding
- Create repo with `pyproject.toml` (dependencies: `click`, `pyyaml`,
  `watchdog`, `requests`, `pydantic`)
- Set up `src/ynab_importer/` package layout
- Create `config/settings.yaml` with placeholders for YNAB API token and
  budget ID

### Step 2: Transaction model (`models.py`)
- Pydantic model `Transaction` with fields: `date`, `amount`, `payee`,
  `memo`, `account_name`, `category`, `import_id`
- `import_id` generated as YNAB spec: `YNAB:{milliunit_amount}:{date}:{occurrence}`
  (handles same-day/same-amount dedup)

### Step 3: CSV parser with bank adapters (`parser.py`)
- Bank config YAML files define: column names for date/amount/payee/memo,
  date format, amount sign convention (negative = outflow vs positive = outflow),
  CSV dialect options (delimiter, quoting, encoding)
- `parse_csv(file_path, bank_id) -> list[Transaction]`
- Auto-detect bank from CSV header row if bank_id not provided

### Step 4: Markdown-based mapping config (`compile_config.py`)
- `config/mappings.md` format — human-readable rules in Markdown tables:

  ```markdown
  ## Payee → Category

  | Payee pattern (regex) | YNAB Payee     | YNAB Category              |
  |-----------------------|----------------|-----------------------------|
  | TRADER JOE.*          | Trader Joe's   | Groceries                   |
  | SPOTIFY.*             | Spotify        | Subscriptions: Music        |
  | AMZN.*\|AMAZON.*      | Amazon         | Shopping                    |

  ## Source → Account

  | Bank / Card name       | YNAB Account Name        |
  |------------------------|--------------------------|
  | Chase Freedom          | Chase Freedom Unlimited   |
  | BofA Checking          | BofA Checking             |
  ```

- Compiler parses markdown tables → writes `mappings.yaml`
- CLI command: `ynab-importer compile-config`
- Optionally, an LLM-assisted mode (`--ai`) that takes freeform markdown
  notes and generates the structured tables (future enhancement, not MVP)

### Step 5: Data cleaning & enrichment (`cleaner.py`, `mapper.py`)
- Pipeline: raw Transaction → cleaned Transaction
  1. Normalize payee strings (strip whitespace, uppercase for matching)
  2. Match payee against mapping rules (regex), assign YNAB payee name + category
  3. Map source/bank to YNAB account name
  4. Generate `import_id` for YNAB dedup
  5. Convert amount to YNAB milliunit format (amount × 1000)
- Unmatched payees: keep original name, leave category blank (YNAB will
  prompt the user to categorize)

### Step 6: YNAB API client (`ynab_client.py`)
- Thin wrapper around YNAB API v1 (`api.ynab.com/v1`)
- `POST /budgets/{id}/transactions` with bulk create
- Uses `import_id` on each transaction for server-side dedup
- Handles rate limiting (200 requests/hour) with backoff
- Dry-run mode: print what would be sent without calling API

### Step 7: CLI entry point (`cli.py`)
- Built with `click`:
  - `ynab-importer import <file_or_folder> [--bank chase|bofa|amex|auto] [--dry-run]`
  - `ynab-importer watch <folder> [--bank auto] [--dry-run]`
  - `ynab-importer compile-config`
- Import mode: parse → clean → map → send to YNAB, print summary
- Watch mode: use `watchdog` to monitor folder, process new `.csv` files

### Step 8: Folder watcher (`watcher.py`)
- `watchdog.observers.Observer` watches a directory for `*.csv` creation
- On new file: wait briefly (file may still be writing), then run import pipeline
- Log results to stdout + optional log file
- Graceful shutdown on SIGINT/SIGTERM

### Step 9: Tests
- Unit tests for parser (with fixture CSVs), cleaner, mapper
- Mock YNAB API calls in client tests
- Test markdown config compilation

---

## Key Design Decisions

1. **Markdown mappings**: Author-friendly format, compiled to YAML for fast
   runtime. No LLM dependency at runtime — deterministic regex matching.
2. **Bank adapters as YAML**: Adding a new bank = adding a small YAML file,
   no code changes needed.
3. **YNAB import_id for dedup**: Stateless — no local DB needed. YNAB
   rejects duplicates server-side.
4. **Pydantic models**: Validation at parse time catches bad data early.
5. **Dry-run mode**: Safe testing before hitting the real API.

---

## Dependencies

- `click` — CLI framework
- `pydantic` — data validation
- `pyyaml` — config parsing
- `watchdog` — filesystem monitoring
- `requests` — HTTP client for YNAB API

---

## Out of scope (future)

- Web UI / dashboard
- LLM-assisted mapping authoring (`--ai` flag)
- Multi-currency support
- Historical sync / reconciliation
- OAuth for YNAB (using personal access token for now)
