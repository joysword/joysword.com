"""YNAB API v1 client — exposes tool functions for the agent."""

from __future__ import annotations

import time
from pathlib import Path

import requests
import yaml

BASE_URL = "https://api.ynab.com/v1"
CONFIG_DIR = Path(__file__).resolve().parent.parent.parent / "config"


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

    # ------------------------------------------------------------------
    # Tool functions the agent can call
    # ------------------------------------------------------------------

    def list_accounts(self) -> list[dict]:
        """Fetch all accounts. Returns [{"id": ..., "name": ...}, ...]."""
        url = f"{BASE_URL}/budgets/{self.budget_id}/accounts"
        resp = self._get_with_retry(url)
        resp.raise_for_status()
        return [
            {"id": a["id"], "name": a["name"]}
            for a in resp.json()["data"]["accounts"]
            if not a.get("closed", False)
        ]

    def list_categories(self) -> list[dict]:
        """Fetch all categories. Returns [{"id": ..., "name": ..., "group": ...}, ...]."""
        url = f"{BASE_URL}/budgets/{self.budget_id}/categories"
        resp = self._get_with_retry(url)
        resp.raise_for_status()
        result = []
        for group in resp.json()["data"]["category_groups"]:
            if group.get("hidden", False):
                continue
            for cat in group.get("categories", []):
                if cat.get("hidden", False):
                    continue
                result.append({
                    "id": cat["id"],
                    "name": cat["name"],
                    "group": group["name"],
                })
        return result

    def create_transactions(
        self,
        transactions: list[dict],
        dry_run: bool = False,
    ) -> dict:
        """Send transactions to YNAB. Each item should be a YNAB API transaction dict."""
        if dry_run:
            return {
                "dry_run": True,
                "transaction_count": len(transactions),
                "transactions": transactions,
            }

        url = f"{BASE_URL}/budgets/{self.budget_id}/transactions"
        resp = self._post_with_retry(url, {"transactions": transactions})
        resp.raise_for_status()
        return resp.json()

    # ------------------------------------------------------------------
    # HTTP helpers
    # ------------------------------------------------------------------

    def _get_with_retry(self, url: str, max_retries: int = 3) -> requests.Response:
        for attempt in range(max_retries + 1):
            resp = self.session.get(url)
            if resp.status_code == 429:
                time.sleep(2 ** attempt)
                continue
            return resp
        return resp

    def _post_with_retry(self, url: str, payload: dict, max_retries: int = 3) -> requests.Response:
        for attempt in range(max_retries + 1):
            resp = self.session.post(url, json=payload)
            if resp.status_code == 429:
                time.sleep(2 ** attempt)
                continue
            return resp
        return resp
