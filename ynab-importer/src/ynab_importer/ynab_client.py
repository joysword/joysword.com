"""YNAB API v1 client for creating transactions."""

from __future__ import annotations

import time
from pathlib import Path

import requests
import yaml

from .models import Transaction

CONFIG_DIR = Path(__file__).resolve().parent.parent.parent / "config"
BASE_URL = "https://api.ynab.com/v1"


def load_settings(settings_path: Path | None = None) -> dict:
    if settings_path is None:
        settings_path = CONFIG_DIR / "settings.yaml"
    with open(settings_path) as f:
        return yaml.safe_load(f)


class YNABClient:
    def __init__(self, api_token: str, budget_id: str):
        self.api_token = api_token
        self.budget_id = budget_id
        self.session = requests.Session()
        self.session.headers["Authorization"] = f"Bearer {api_token}"
        self.session.headers["Content-Type"] = "application/json"

    @classmethod
    def from_settings(cls, settings_path: Path | None = None) -> YNABClient:
        settings = load_settings(settings_path)
        ynab = settings["ynab"]
        return cls(api_token=ynab["api_token"], budget_id=ynab["budget_id"])

    def _get_account_id(self, account_name: str) -> str | None:
        """Look up YNAB account ID by name."""
        url = f"{BASE_URL}/budgets/{self.budget_id}/accounts"
        resp = self.session.get(url)
        resp.raise_for_status()
        accounts = resp.json()["data"]["accounts"]
        for acct in accounts:
            if acct["name"].lower() == account_name.lower():
                return acct["id"]
        return None

    def create_transactions(
        self,
        transactions: list[Transaction],
        dry_run: bool = False,
    ) -> dict:
        """Send transactions to YNAB. Returns the API response or dry-run summary."""
        if dry_run:
            return self._dry_run_summary(transactions)

        # Resolve account names to IDs
        account_cache: dict[str, str | None] = {}
        ynab_txns = []
        for txn in transactions:
            if txn.account_name and txn.account_name not in account_cache:
                account_cache[txn.account_name] = self._get_account_id(txn.account_name)

            account_id = account_cache.get(txn.account_name)
            if not account_id:
                raise ValueError(
                    f"Could not find YNAB account '{txn.account_name}'. "
                    f"Check your mappings config."
                )

            ynab_txn: dict = {
                "account_id": account_id,
                "date": txn.date.isoformat(),
                "amount": txn.to_ynab_milliunits(),
                "payee_name": txn.payee,
                "memo": txn.memo or None,
                "import_id": txn.import_id,
                "cleared": "cleared",
            }
            ynab_txns.append(ynab_txn)

        url = f"{BASE_URL}/budgets/{self.budget_id}/transactions"
        resp = self._post_with_retry(url, {"transactions": ynab_txns})
        resp.raise_for_status()
        return resp.json()

    def _post_with_retry(
        self, url: str, payload: dict, max_retries: int = 3
    ) -> requests.Response:
        """POST with exponential backoff for rate limiting."""
        for attempt in range(max_retries + 1):
            resp = self.session.post(url, json=payload)
            if resp.status_code == 429:
                wait = 2 ** attempt
                time.sleep(wait)
                continue
            return resp
        return resp  # Return last response even if rate limited

    @staticmethod
    def _dry_run_summary(transactions: list[Transaction]) -> dict:
        summary = {
            "dry_run": True,
            "transaction_count": len(transactions),
            "transactions": [],
        }
        for txn in transactions:
            summary["transactions"].append({
                "date": txn.date.isoformat(),
                "payee": txn.payee,
                "amount": txn.to_ynab_milliunits(),
                "account": txn.account_name,
                "category": txn.category,
                "import_id": txn.import_id,
            })
        return summary
