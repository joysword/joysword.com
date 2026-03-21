from ynab_importer.compile_config import compile_mappings, extract_tables


def test_extract_tables_from_mappings_md():
    md = """\
## Payee → Category

| Payee pattern (regex) | YNAB Payee | YNAB Category |
|-|-|-|
| TRADER JOE.* | Trader Joe's | Groceries |

## Source → Account

| Bank ID | YNAB Account Name |
|-|-|
| chase | Chase Freedom |
"""
    tables = extract_tables(md)
    assert "Payee → Category" in tables
    assert "Source → Account" in tables
    assert len(tables["Payee → Category"]) == 1
    assert tables["Payee → Category"][0]["YNAB Payee"] == "Trader Joe's"


def test_compile_mappings_produces_config():
    config = compile_mappings()
    assert len(config["payee_rules"]) > 0
    assert "chase" in config["account_map"]
