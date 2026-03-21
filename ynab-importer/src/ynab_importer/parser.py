from __future__ import annotations

import csv
from datetime import datetime
from pathlib import Path

import yaml

from .models import Transaction

BANKS_DIR = Path(__file__).resolve().parent.parent.parent / "config" / "banks"


def load_bank_config(bank_id: str) -> dict:
    """Load a bank config YAML by bank ID (e.g. 'chase')."""
    config_path = BANKS_DIR / f"{bank_id}.yaml"
    if not config_path.exists():
        raise FileNotFoundError(f"No bank config found: {config_path}")
    with open(config_path) as f:
        return yaml.safe_load(f)


def load_all_bank_configs() -> dict[str, dict]:
    """Load all bank configs from the banks directory."""
    configs = {}
    for path in BANKS_DIR.glob("*.yaml"):
        with open(path) as f:
            configs[path.stem] = yaml.safe_load(f)
    return configs


def detect_bank(file_path: Path) -> str | None:
    """Auto-detect bank from CSV header row by matching against bank configs."""
    with open(file_path, encoding="utf-8") as f:
        reader = csv.reader(f)
        try:
            header = next(reader)
        except StopIteration:
            return None

    header_set = {col.strip() for col in header}
    configs = load_all_bank_configs()

    best_match = None
    best_score = 0
    for bank_id, config in configs.items():
        identify = set(config.get("identify_headers", []))
        if not identify:
            continue
        score = len(identify & header_set) / len(identify)
        if score > best_score:
            best_score = score
            best_match = bank_id

    if best_score >= 0.8:
        return best_match
    return None


def parse_csv(file_path: Path, bank_id: str | None = None) -> list[Transaction]:
    """Parse a bank CSV file into a list of Transaction objects."""
    file_path = Path(file_path)

    if bank_id is None or bank_id == "auto":
        bank_id = detect_bank(file_path)
        if bank_id is None:
            raise ValueError(
                f"Could not auto-detect bank for {file_path}. "
                f"Available banks: {list(load_all_bank_configs().keys())}"
            )

    config = load_bank_config(bank_id)
    columns = config["columns"]
    date_format = config["date_format"]
    amount_sign = config.get("amount_sign", "negative_is_outflow")
    encoding = config.get("encoding", "utf-8")
    delimiter = config.get("delimiter", ",")

    transactions = []
    with open(file_path, encoding=encoding, newline="") as f:
        reader = csv.DictReader(f, delimiter=delimiter)
        for row in reader:
            date_str = row.get(columns["date"], "").strip()
            if not date_str:
                continue

            txn_date = datetime.strptime(date_str, date_format).date()
            raw_amount = float(row.get(columns["amount"], "0").strip().replace(",", ""))
            payee = row.get(columns["payee"], "").strip()
            memo = row.get(columns.get("memo", ""), "").strip()

            # Normalize amount: YNAB expects negative = outflow, positive = inflow
            if amount_sign == "positive_is_outflow":
                raw_amount = -raw_amount

            transactions.append(
                Transaction(
                    date=txn_date,
                    amount=raw_amount,
                    payee=payee,
                    memo=memo,
                )
            )

    return transactions
