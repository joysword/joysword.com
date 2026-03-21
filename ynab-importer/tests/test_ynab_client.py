"""Tests for YNAB client tool functions."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from ynab_importer.ynab_client import YNABClient


@pytest.fixture
def client():
    return YNABClient(api_token="test-token", budget_id="test-budget")


def test_list_accounts(client):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "data": {
            "accounts": [
                {"id": "a1", "name": "Checking", "closed": False},
                {"id": "a2", "name": "Old Card", "closed": True},
                {"id": "a3", "name": "Savings", "closed": False},
            ]
        }
    }
    client.session.get = MagicMock(return_value=mock_resp)

    result = client.list_accounts()
    assert len(result) == 2  # closed account excluded
    assert result[0] == {"id": "a1", "name": "Checking"}
    assert result[1] == {"id": "a3", "name": "Savings"}


def test_list_categories(client):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "data": {
            "category_groups": [
                {
                    "name": "Frequent",
                    "hidden": False,
                    "categories": [
                        {"id": "c1", "name": "Groceries", "hidden": False},
                        {"id": "c2", "name": "Hidden Cat", "hidden": True},
                    ],
                },
                {
                    "name": "Hidden Group",
                    "hidden": True,
                    "categories": [
                        {"id": "c3", "name": "Secret", "hidden": False},
                    ],
                },
            ]
        }
    }
    client.session.get = MagicMock(return_value=mock_resp)

    result = client.list_categories()
    assert len(result) == 1  # hidden group and hidden category excluded
    assert result[0] == {"id": "c1", "name": "Groceries", "group": "Frequent"}


def test_create_transactions_dry_run(client):
    txns = [{"account_id": "a1", "date": "2025-01-15", "amount": -10000, "payee_name": "Test"}]
    result = client.create_transactions(txns, dry_run=True)
    assert result["dry_run"] is True
    assert result["transaction_count"] == 1


def test_create_transactions_live(client):
    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_resp.json.return_value = {
        "data": {
            "transaction_ids": ["t1"],
            "duplicate_import_ids": [],
        }
    }
    client.session.post = MagicMock(return_value=mock_resp)

    txns = [{"account_id": "a1", "date": "2025-01-15", "amount": -10000, "payee_name": "Test"}]
    result = client.create_transactions(txns)
    assert result["data"]["transaction_ids"] == ["t1"]


def test_retry_on_429(client):
    resp_429 = MagicMock()
    resp_429.status_code = 429

    resp_ok = MagicMock()
    resp_ok.status_code = 200
    resp_ok.json.return_value = {"data": {"accounts": []}}

    client.session.get = MagicMock(side_effect=[resp_429, resp_ok])

    with patch("ynab_importer.ynab_client.time.sleep"):
        result = client.list_accounts()
    assert result == []
    assert client.session.get.call_count == 2
