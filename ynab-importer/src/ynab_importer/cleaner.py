"""Data cleaning and enrichment pipeline."""

from __future__ import annotations

from .mapper import map_transactions
from .models import Transaction, assign_import_ids


def clean_transactions(
    transactions: list[Transaction],
    bank_id: str | None = None,
) -> list[Transaction]:
    """Run the full cleaning pipeline on parsed transactions.

    Steps:
    1. Normalize payee strings
    2. Apply payee→category and source→account mappings
    3. Generate YNAB import_ids for dedup
    """
    # Step 1: Normalize payees (strip whitespace, collapse internal spaces)
    normalized = []
    for txn in transactions:
        normalized.append(txn.model_copy(update={
            "payee": " ".join(txn.payee.split()),
            "memo": " ".join(txn.memo.split()),
        }))

    # Step 2: Apply mappings
    mapped = map_transactions(normalized, bank_id=bank_id)

    # Step 3: Assign import_ids
    return assign_import_ids(mapped)
