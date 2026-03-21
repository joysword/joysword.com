from __future__ import annotations

from datetime import date
from collections import Counter

from pydantic import BaseModel, Field


class Transaction(BaseModel):
    date: date
    amount: float  # Original amount from CSV (positive or negative)
    payee: str
    memo: str = ""
    account_name: str = ""
    category: str = ""
    import_id: str = ""

    def to_ynab_milliunits(self) -> int:
        """Convert amount to YNAB milliunit format (amount * 1000)."""
        return int(self.amount * 1000)

    def generate_import_id(self, occurrence: int = 1) -> str:
        """Generate YNAB import_id: YNAB:{milliunit_amount}:{iso_date}:{occurrence}."""
        milliunits = self.to_ynab_milliunits()
        return f"YNAB:{milliunits}:{self.date.isoformat()}:{occurrence}"


def assign_import_ids(transactions: list[Transaction]) -> list[Transaction]:
    """Assign import_ids to transactions, handling same-day/same-amount duplicates."""
    counter: Counter[str] = Counter()
    result = []
    for txn in transactions:
        key = f"{txn.to_ynab_milliunits()}:{txn.date.isoformat()}"
        counter[key] += 1
        txn.import_id = txn.generate_import_id(occurrence=counter[key])
        result.append(txn)
    return result
