from datetime import date
from pathlib import Path

from ynab_importer.parser import parse_csv, detect_bank

FIXTURES = Path(__file__).parent / "fixtures"


def test_detect_bank_chase():
    bank = detect_bank(FIXTURES / "sample_chase.csv")
    assert bank == "chase"


def test_parse_chase_csv():
    transactions = parse_csv(FIXTURES / "sample_chase.csv", bank_id="chase")
    assert len(transactions) == 6

    # First transaction
    txn = transactions[0]
    assert txn.date == date(2025, 1, 15)
    assert txn.payee == "TRADER JOE'S #123"
    assert txn.amount == -45.67  # Chase: negative = outflow

    # Payment (positive in Chase = inflow)
    payment = transactions[4]
    assert payment.amount == 500.00


def test_parse_chase_auto_detect():
    transactions = parse_csv(FIXTURES / "sample_chase.csv", bank_id=None)
    assert len(transactions) == 6
