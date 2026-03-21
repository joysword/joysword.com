"""Tests for the AI agent with mocked Anthropic API."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from ynab_importer.agent import process_csv, _build_system_prompt, _execute_tool


FIXTURES_DIR = Path(__file__).parent / "fixtures"

MOCK_ACCOUNTS = [
    {"id": "acct-chase", "name": "Chase Freedom Unlimited"},
    {"id": "acct-bofa", "name": "BofA Checking"},
]

MOCK_CATEGORIES = [
    {"id": "cat-groceries", "name": "Groceries", "group": "Frequent"},
    {"id": "cat-shopping", "name": "Shopping", "group": "Frequent"},
]

MOCK_TRANSACTIONS = [
    {
        "account_id": "acct-chase",
        "date": "2025-01-15",
        "amount": -45670,
        "payee_name": "Trader Joe's",
        "import_id": "YNAB:-45670:2025-01-15:1",
        "cleared": "cleared",
    },
    {
        "account_id": "acct-chase",
        "date": "2025-01-15",
        "amount": -9990,
        "payee_name": "Spotify",
        "memo": "Monthly subscription",
        "import_id": "YNAB:-9990:2025-01-15:1",
        "cleared": "cleared",
    },
]


def test_build_system_prompt_includes_guides():
    prompt = _build_system_prompt()
    assert "YNAB transaction import agent" in prompt
    assert "list_accounts" in prompt
    assert "milliunits" in prompt


def test_execute_tool_list_accounts():
    ynab = MagicMock()
    ynab.list_accounts.return_value = MOCK_ACCOUNTS

    result = _execute_tool("list_accounts", {}, ynab=ynab, dry_run=False, result={})
    assert result == MOCK_ACCOUNTS
    ynab.list_accounts.assert_called_once()


def test_execute_tool_list_categories():
    ynab = MagicMock()
    ynab.list_categories.return_value = MOCK_CATEGORIES

    result = _execute_tool("list_categories", {}, ynab=ynab, dry_run=False, result={})
    assert result == MOCK_CATEGORIES
    ynab.list_categories.assert_called_once()


def test_execute_tool_create_transactions_dry_run():
    ynab = MagicMock()
    ynab.create_transactions.return_value = {
        "dry_run": True,
        "transaction_count": 2,
        "transactions": MOCK_TRANSACTIONS,
    }

    agg_result = {"transactions_created": 0, "duplicates_skipped": 0, "details": None}
    result = _execute_tool(
        "create_transactions",
        {"transactions": MOCK_TRANSACTIONS},
        ynab=ynab,
        dry_run=True,
        result=agg_result,
    )

    assert result["status"] == "ok"
    assert agg_result["transactions_created"] == 2


def test_execute_tool_create_transactions_live():
    ynab = MagicMock()
    ynab.create_transactions.return_value = {
        "data": {
            "transaction_ids": ["t1", "t2"],
            "duplicate_import_ids": [],
        }
    }

    agg_result = {"transactions_created": 0, "duplicates_skipped": 0, "details": None}
    result = _execute_tool(
        "create_transactions",
        {"transactions": MOCK_TRANSACTIONS},
        ynab=ynab,
        dry_run=False,
        result=agg_result,
    )

    assert result["status"] == "ok"
    assert agg_result["transactions_created"] == 2
    assert agg_result["duplicates_skipped"] == 0


def test_execute_tool_unknown():
    result = _execute_tool("bogus", {}, ynab=MagicMock(), dry_run=False, result={})
    assert "error" in result


def test_process_csv_agent_loop(tmp_path):
    """Test the full agent loop with mocked Anthropic client."""
    csv_file = tmp_path / "test.csv"
    csv_file.write_text(
        "Date,Amount,Description\n"
        "2025-01-15,-45.67,TRADER JOES\n"
    )

    settings_file = tmp_path / "settings.yaml"
    settings_file.write_text(
        "ynab:\n"
        '  api_token: "test-token"\n'
        '  budget_id: "test-budget"\n'
        "llm:\n"
        '  model: "claude-sonnet-4-20250514"\n'
    )

    # Build a mock Anthropic response that first calls list_accounts, then create_transactions
    # Response 1: agent calls list_accounts and list_categories
    tool_use_block_1a = MagicMock()
    tool_use_block_1a.type = "tool_use"
    tool_use_block_1a.name = "list_accounts"
    tool_use_block_1a.input = {}
    tool_use_block_1a.id = "tu_1a"

    tool_use_block_1b = MagicMock()
    tool_use_block_1b.type = "tool_use"
    tool_use_block_1b.name = "list_categories"
    tool_use_block_1b.input = {}
    tool_use_block_1b.id = "tu_1b"

    response_1 = MagicMock()
    response_1.content = [tool_use_block_1a, tool_use_block_1b]
    response_1.stop_reason = "tool_use"

    # Response 2: agent calls create_transactions
    tool_use_block_2 = MagicMock()
    tool_use_block_2.type = "tool_use"
    tool_use_block_2.name = "create_transactions"
    tool_use_block_2.input = {"transactions": MOCK_TRANSACTIONS}
    tool_use_block_2.id = "tu_2"

    response_2 = MagicMock()
    response_2.content = [tool_use_block_2]
    response_2.stop_reason = "tool_use"

    # Response 3: agent is done (text only)
    text_block = MagicMock()
    text_block.type = "text"
    text_block.text = "Done! Imported 2 transactions."

    response_3 = MagicMock()
    response_3.content = [text_block]
    response_3.stop_reason = "end_turn"

    mock_anthropic_client = MagicMock()
    mock_anthropic_client.messages.create.side_effect = [response_1, response_2, response_3]

    with patch("ynab_importer.agent.anthropic.Anthropic", return_value=mock_anthropic_client), \
         patch("ynab_importer.agent.YNABClient") as MockYNAB:
        mock_ynab_instance = MockYNAB.return_value
        mock_ynab_instance.list_accounts.return_value = MOCK_ACCOUNTS
        mock_ynab_instance.list_categories.return_value = MOCK_CATEGORIES
        mock_ynab_instance.create_transactions.return_value = {
            "data": {
                "transaction_ids": ["t1", "t2"],
                "duplicate_import_ids": [],
            }
        }

        result = process_csv(csv_file, dry_run=False, settings_path=settings_file)

    assert result["transactions_created"] == 2
    assert result["duplicates_skipped"] == 0
    assert mock_anthropic_client.messages.create.call_count == 3
