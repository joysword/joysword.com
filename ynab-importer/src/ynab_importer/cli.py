"""CLI entry point for ynab-importer."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import click

from .agent import process_csv
from .watcher import watch_folder


@click.group()
def cli():
    """AI agent that imports any bank CSV into YNAB."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )


@cli.command("import")
@click.argument("path", type=click.Path(exists=True))
@click.option("--dry-run", is_flag=True, help="Print what would be imported without calling YNAB API.")
def import_cmd(path: str, dry_run: bool):
    """Import transactions from a CSV file or all CSVs in a folder."""
    target = Path(path)
    files = sorted(target.glob("*.csv")) if target.is_dir() else [target]

    if not files:
        click.echo("No CSV files found.")
        return

    for csv_file in files:
        click.echo(f"\nProcessing {csv_file.name}...")
        result = process_csv(csv_file, dry_run=dry_run)

        if dry_run:
            click.echo(f"[DRY RUN] Would import {result['transactions_created']} transactions")
            if result.get("details"):
                click.echo(json.dumps(result["details"], indent=2))
        else:
            click.echo(
                f"Imported {result['transactions_created']} transactions "
                f"({result['duplicates_skipped']} duplicates skipped)"
            )


@cli.command("watch")
@click.argument("folder", type=click.Path(exists=True, file_okay=False))
@click.option("--dry-run", is_flag=True, help="Print what would be imported without calling YNAB API.")
def watch_cmd(folder: str, dry_run: bool):
    """Watch a folder for new CSV files and auto-import them."""
    watch_folder(folder=Path(folder), dry_run=dry_run)


if __name__ == "__main__":
    cli()
