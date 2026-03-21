from ynab_importer.compile_config import compile_mappings
from ynab_importer.mapper import match_payee, load_mappings

# Ensure mappings.yaml exists
compile_mappings()


def test_match_payee_trader_joes():
    mappings = load_mappings()
    payee, category = match_payee("TRADER JOE'S #123", mappings["payee_rules"])
    assert payee == "Trader Joe's"
    assert category == "Groceries"


def test_match_payee_amazon_variants():
    mappings = load_mappings()
    payee1, _ = match_payee("AMZN MKTP US*AB1CD", mappings["payee_rules"])
    payee2, _ = match_payee("AMAZON.COM*123", mappings["payee_rules"])
    assert payee1 == "Amazon"
    assert payee2 == "Amazon"


def test_match_payee_no_match():
    mappings = load_mappings()
    payee, category = match_payee("SOME UNKNOWN STORE", mappings["payee_rules"])
    assert payee == "SOME UNKNOWN STORE"
    assert category == ""


def test_match_payee_uber_eats_vs_trip():
    mappings = load_mappings()
    payee_eats, cat_eats = match_payee("UBER EATS DELIVERY", mappings["payee_rules"])
    payee_trip, cat_trip = match_payee("UBER TRIP ABC123", mappings["payee_rules"])
    assert payee_eats == "Uber Eats"
    assert cat_eats == "Dining Out"
    assert payee_trip == "Uber"
    assert cat_trip == "Transportation"
