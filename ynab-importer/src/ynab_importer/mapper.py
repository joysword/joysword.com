"""Apply payee→category and source→account mappings to transactions."""

from __future__ import annotations

import re
from pathlib import Path

import yaml

from .models import Transaction

CONFIG_DIR = Path(__file__).resolve().parent.parent.parent / "config"


def load_mappings(mappings_path: Path | None = None) -> dict:
    """Load compiled mappings.yaml config."""
    if mappings_path is None:
        mappings_path = CONFIG_DIR / "mappings.yaml"
    if not mappings_path.exists():
        return {"payee_rules": [], "account_map": {}}
    with open(mappings_path) as f:
        return yaml.safe_load(f) or {"payee_rules": [], "account_map": {}}


def match_payee(raw_payee: str, payee_rules: list[dict]) -> tuple[str, str]:
    """Match a raw payee string against mapping rules.

    Returns (ynab_payee, category). If no match, returns (raw_payee, "").
    """
    normalized = raw_payee.strip().upper()
    for rule in payee_rules:
        pattern = rule["pattern"]
        if re.fullmatch(pattern, normalized, re.IGNORECASE):
            return rule["payee"], rule["category"]
    return raw_payee, ""


def map_transactions(
    transactions: list[Transaction],
    bank_id: str | None = None,
    mappings_path: Path | None = None,
) -> list[Transaction]:
    """Apply payee and account mappings to a list of transactions."""
    mappings = load_mappings(mappings_path)
    payee_rules = mappings.get("payee_rules", [])
    account_map = mappings.get("account_map", {})

    account_name = account_map.get(bank_id, "") if bank_id else ""

    result = []
    for txn in transactions:
        ynab_payee, category = match_payee(txn.payee, payee_rules)
        result.append(txn.model_copy(update={
            "payee": ynab_payee,
            "category": category,
            "account_name": account_name or txn.account_name,
        }))
    return result
