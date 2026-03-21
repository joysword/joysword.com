"""Tests for Transaction model."""

from ynab_importer.models import Transaction


def test_transaction_to_api_dict_minimal():
    txn = Transaction(
        account_id="abc-123",
        date="2025-01-15",
        amount=-45670,
        payee_name="Trader Joe's",
    )
    d = txn.to_api_dict()
    assert d == {
        "account_id": "abc-123",
        "date": "2025-01-15",
        "amount": -45670,
        "payee_name": "Trader Joe's",
        "cleared": "cleared",
    }
    # Optional fields should not appear when empty
    assert "memo" not in d
    assert "category_id" not in d
    assert "import_id" not in d


def test_transaction_to_api_dict_full():
    txn = Transaction(
        account_id="abc-123",
        date="2025-01-15",
        amount=-45670,
        payee_name="Trader Joe's",
        memo="Weekly groceries",
        category_id="cat-456",
        import_id="YNAB:-45670:2025-01-15:1",
        cleared="cleared",
    )
    d = txn.to_api_dict()
    assert d["memo"] == "Weekly groceries"
    assert d["category_id"] == "cat-456"
    assert d["import_id"] == "YNAB:-45670:2025-01-15:1"
