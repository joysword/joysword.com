"""Transaction model matching YNAB API transaction shape."""

from __future__ import annotations

from pydantic import BaseModel


class Transaction(BaseModel):
    """A transaction ready to POST to the YNAB API."""

    account_id: str
    date: str  # ISO 8601: YYYY-MM-DD
    amount: int  # Milliunits: dollars * 1000, negative = outflow
    payee_name: str = ""
    memo: str = ""
    category_id: str = ""
    import_id: str = ""
    cleared: str = "cleared"

    def to_api_dict(self) -> dict:
        """Convert to the dict shape expected by YNAB API."""
        d: dict = {
            "account_id": self.account_id,
            "date": self.date,
            "amount": self.amount,
            "payee_name": self.payee_name,
            "cleared": self.cleared,
        }
        if self.memo:
            d["memo"] = self.memo
        if self.category_id:
            d["category_id"] = self.category_id
        if self.import_id:
            d["import_id"] = self.import_id
        return d
