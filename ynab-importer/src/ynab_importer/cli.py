"""CLI entry point for ynab-importer."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import click

from .cleaner import clean_transactions
from .compile_config import compile_mappings
from .parser import parse_csv
from .watcher import watch_folder
from .ynab_client import YNABClient


@click.group()
def cli():
    """Import bank CSV transactions into YNAB."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )


@cli.command("import")
@click.argument("path", type=click.Path(exists=True))
@click.option("--bank", default="auto", help="Bank ID (chase, bofa, amex) or 'auto' to detect.")
@click.option("--dry-run", is_flag=True, help="Print what would be imported without calling YNAB API.")
def import_cmd(path: str, bank: str, dry_run: bool):
    """Import transactions from a CSV file or all CSVs in a folder."""
    target = Path(path)
    files = list(target.glob("*.csv")) if target.is_dir() else [target]

    if not files:
        click.echo("No CSV files found.")
        return

    bank_id = None if bank == "auto" else bank
    all_transactions = []

    for csv_file in files:
        click.echo(f"Parsing {csv_file.name}...")
        transactions = parse_csv(csv_file, bank_id=bank_id)
        cleaned = clean_transactions(transactions, bank_id=bank_id)
        all_transactions.extend(cleaned)

    click.echo(f"Total: {len(all_transactions)} transactions")

    if dry_run:
        client = YNABClient(api_token="", budget_id="")
        result = client.create_transactions(all_transactions, dry_run=True)
        click.echo(json.dumps(result, indent=2))
    else:
        client = YNABClient.from_settings()
        result = client.create_transactions(all_transactions)
        data = result.get("data", {})
        ids = data.get("transaction_ids", [])
        dupes = data.get("duplicate_import_ids", [])
        click.echo(f"Imported {len(ids)} transactions ({len(dupes)} duplicates skipped)")


@cli.command("watch")
@click.argument("folder", type=click.Path(exists=True, file_okay=False))
@click.option("--bank", default="auto", help="Bank ID or 'auto' to detect.")
@click.option("--dry-run", is_flag=True, help="Print what would be imported without calling YNAB API.")
def watch_cmd(folder: str, bank: str, dry_run: bool):
    """Watch a folder for new CSV files and auto-import them."""
    bank_id = None if bank == "auto" else bank

    if dry_run:
        client = YNABClient(api_token="", budget_id="")
    else:
        client = YNABClient.from_settings()

    watch_folder(
        folder=Path(folder),
        client=client,
        bank_id=bank_id,
        dry_run=dry_run,
    )


@cli.command("compile-config")
@click.option("--input", "input_path", default=None, help="Path to mappings.md")
@click.option("--output", "output_path", default=None, help="Path to output mappings.yaml")
def compile_config_cmd(input_path: str | None, output_path: str | None):
    """Compile mappings.md into mappings.yaml."""
    md_path = Path(input_path) if input_path else None
    out_path = Path(output_path) if output_path else None

    config = compile_mappings(md_path=md_path, output_path=out_path)
    click.echo(f"Compiled {len(config['payee_rules'])} payee rules, "
               f"{len(config['account_map'])} account mappings")


if __name__ == "__main__":
    cli()
