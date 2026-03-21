from datetime import date

from ynab_importer.cleaner import clean_transactions
from ynab_importer.compile_config import compile_mappings
from ynab_importer.models import Transaction

# Ensure mappings.yaml exists before tests that depend on it
compile_mappings()


def test_clean_assigns_import_ids():
    txns = [
        Transaction(date=date(2025, 1, 15), amount=-45.67, payee="TRADER JOE'S #123"),
        Transaction(date=date(2025, 1, 15), amount=-9.99, payee="SPOTIFY USA"),
    ]
    cleaned = clean_transactions(txns, bank_id="chase")
    assert all(t.import_id.startswith("YNAB:") for t in cleaned)


def test_clean_maps_payee_and_category():
    txns = [
        Transaction(date=date(2025, 1, 15), amount=-45.67, payee="TRADER JOE'S #123"),
    ]
    cleaned = clean_transactions(txns, bank_id="chase")
    assert cleaned[0].payee == "Trader Joe's"
    assert cleaned[0].category == "Groceries"


def test_clean_maps_account():
    txns = [
        Transaction(date=date(2025, 1, 15), amount=-10.00, payee="TEST"),
    ]
    cleaned = clean_transactions(txns, bank_id="chase")
    assert cleaned[0].account_name == "Chase Freedom Unlimited"


def test_clean_same_amount_same_day_different_import_ids():
    txns = [
        Transaction(date=date(2025, 1, 15), amount=-45.67, payee="TRADER JOE'S #123"),
        Transaction(date=date(2025, 1, 15), amount=-45.67, payee="TRADER JOE'S #456"),
    ]
    cleaned = clean_transactions(txns, bank_id="chase")
    assert cleaned[0].import_id != cleaned[1].import_id
    assert cleaned[0].import_id.endswith(":1")
    assert cleaned[1].import_id.endswith(":2")
