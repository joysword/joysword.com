"""Tests for the AI agent with mocked litellm + YNAB client."""

from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace
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


def _make_tool_call(name, arguments):
    """Build a mock litellm tool call object."""
    return SimpleNamespace(
        id="call_1",
        type="function",
        function=SimpleNamespace(
            name=name,
            arguments=json.dumps(arguments),
        ),
    )


def _make_litellm_response(*, content=None, tool_calls=None, finish_reason="stop"):
    """Build a mock litellm completion response."""
    msg = SimpleNamespace(
        role="assistant",
        content=content,
        tool_calls=tool_calls,
    )
    choice = SimpleNamespace(message=msg, finish_reason=finish_reason)
    usage = SimpleNamespace(prompt_tokens=100, completion_tokens=50)
    return SimpleNamespace(id="resp_1", model="test-model", choices=[choice], usage=usage)


def test_build_system_prompt_includes_guides():
    prompt = _build_system_prompt(MOCK_ACCOUNTS, MOCK_CATEGORIES)
    assert "YNAB transaction import agent" in prompt
    assert "create_transactions" in prompt
    assert "milliunits" in prompt
    assert "acct-chase" in prompt
    assert "Chase Freedom Unlimited" in prompt
    assert "cat-groceries" in prompt
    assert "Groceries" in prompt


def test_build_system_prompt_no_credentials():
    """Actual credential values must NEVER appear in the LLM prompt."""
    prompt = _build_system_prompt(MOCK_ACCOUNTS, MOCK_CATEGORIES)
    assert "YOUR_YNAB_API_TOKEN" not in prompt
    assert "sk-ant-" not in prompt
    assert "NEVER see or need" in prompt


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


def test_execute_tool_event_log():
    """Event log captures the YNAB request/response for create_transactions."""
    ynab = MagicMock()
    ynab.create_transactions.return_value = {
        "dry_run": True,
        "transaction_count": 1,
        "transactions": [MOCK_TRANSACTIONS[0]],
    }

    events: list = []
    _execute_tool(
        "create_transactions",
        {"transactions": [MOCK_TRANSACTIONS[0]]},
        ynab=ynab,
        dry_run=True,
        result={"transactions_created": 0, "duplicates_skipped": 0, "details": None},
        event_log=events,
    )
    assert len(events) == 1
    assert events[0]["service"] == "ynab"
    assert events[0]["label"] == "Create Transactions (dry run)"
    assert "Bearer ****" in events[0]["request"]["headers"]["Authorization"]


def test_process_csv_agent_loop(tmp_path):
    """Full agent loop with mocked litellm and YNAB client."""
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

    # Response 1: LLM calls create_transactions
    tc = _make_tool_call("create_transactions", {"transactions": MOCK_TRANSACTIONS})
    response_1 = _make_litellm_response(tool_calls=[tc], finish_reason="tool_calls")

    # Response 2: LLM is done
    response_2 = _make_litellm_response(content="Done! Imported 2 transactions.")

    with patch("ynab_importer.agent.litellm") as mock_litellm, \
         patch("ynab_importer.agent.YNABClient") as MockYNAB:
        mock_litellm.completion.side_effect = [response_1, response_2]

        mock_ynab = MockYNAB.return_value
        mock_ynab.list_accounts.return_value = MOCK_ACCOUNTS
        mock_ynab.list_categories.return_value = MOCK_CATEGORIES
        mock_ynab.create_transactions.return_value = {
            "data": {
                "transaction_ids": ["t1", "t2"],
                "duplicate_import_ids": [],
            }
        }

        event_log: list = []
        result = process_csv(
            csv_file, dry_run=False, settings_path=settings_file, event_log=event_log,
        )

    assert result["transactions_created"] == 2
    assert result["duplicates_skipped"] == 0
    assert mock_litellm.completion.call_count == 2
    mock_ynab.list_accounts.assert_called_once()
    mock_ynab.list_categories.assert_called_once()

    # Event log: 2 YNAB fetches + LLM turn 1 + YNAB create + LLM turn 2
    assert len(event_log) == 5
    assert event_log[0]["service"] == "ynab"
    assert event_log[0]["label"] == "Fetch Accounts"
    assert event_log[1]["service"] == "ynab"
    assert event_log[1]["label"] == "Fetch Categories"
    assert event_log[2]["service"] == "llm"
    assert event_log[2]["label"] == "LLM Turn 1"
    assert event_log[3]["service"] == "ynab"
    assert "Create Transactions" in event_log[3]["label"]
    assert event_log[4]["service"] == "llm"
    assert event_log[4]["label"] == "LLM Turn 2"


def test_process_csv_credentials_from_kwargs(tmp_path):
    """Credentials passed as kwargs override settings.yaml."""
    csv_file = tmp_path / "test.csv"
    csv_file.write_text("Date,Amount\n2025-01-15,-10.00\n")

    response = _make_litellm_response(content="No account found.")

    with patch("ynab_importer.agent.litellm") as mock_litellm, \
         patch("ynab_importer.agent.YNABClient") as MockYNAB:
        mock_litellm.completion.return_value = response
        mock_ynab = MockYNAB.return_value
        mock_ynab.list_accounts.return_value = MOCK_ACCOUNTS
        mock_ynab.list_categories.return_value = MOCK_CATEGORIES

        # No settings.yaml needed — pass creds as kwargs
        process_csv(
            csv_file,
            dry_run=True,
            ynab_api_token="gui-token",
            ynab_budget_id="gui-budget",
            llm_api_key="sk-gui-key",
            llm_model="gpt-4o",
        )

    # Verify YNAB client was created with GUI creds
    MockYNAB.assert_called_once_with(api_token="gui-token", budget_id="gui-budget")
    # Verify litellm was called with the right model and api_key
    call_kwargs = mock_litellm.completion.call_args
    assert call_kwargs.kwargs["model"] == "gpt-4o"
    assert call_kwargs.kwargs["api_key"] == "sk-gui-key"
