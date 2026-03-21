"""Folder watcher that auto-imports new CSV files."""

from __future__ import annotations

import logging
import signal
import time
from pathlib import Path

from watchdog.events import FileSystemEventHandler, FileCreatedEvent
from watchdog.observers import Observer

from .cleaner import clean_transactions
from .parser import parse_csv
from .ynab_client import YNABClient

logger = logging.getLogger(__name__)


class CSVHandler(FileSystemEventHandler):
    def __init__(
        self,
        client: YNABClient,
        bank_id: str | None = None,
        dry_run: bool = False,
        settle_time: float = 2.0,
    ):
        self.client = client
        self.bank_id = bank_id
        self.dry_run = dry_run
        self.settle_time = settle_time

    def on_created(self, event: FileCreatedEvent) -> None:
        if event.is_directory:
            return
        path = Path(event.src_path)
        if path.suffix.lower() != ".csv":
            return

        logger.info(f"New CSV detected: {path}")

        # Wait for file to finish writing
        time.sleep(self.settle_time)

        try:
            transactions = parse_csv(path, bank_id=self.bank_id)
            cleaned = clean_transactions(transactions, bank_id=self.bank_id)
            result = self.client.create_transactions(cleaned, dry_run=self.dry_run)

            if self.dry_run:
                logger.info(f"[DRY RUN] Would import {result['transaction_count']} transactions")
            else:
                data = result.get("data", {})
                ids = data.get("transaction_ids", [])
                dupes = data.get("duplicate_import_ids", [])
                logger.info(
                    f"Imported {len(ids)} transactions "
                    f"({len(dupes)} duplicates skipped) from {path.name}"
                )
        except Exception:
            logger.exception(f"Error processing {path}")


def watch_folder(
    folder: Path,
    client: YNABClient,
    bank_id: str | None = None,
    dry_run: bool = False,
    settle_time: float = 2.0,
) -> None:
    """Watch a folder for new CSV files and import them to YNAB."""
    handler = CSVHandler(client, bank_id=bank_id, dry_run=dry_run, settle_time=settle_time)
    observer = Observer()
    observer.schedule(handler, str(folder), recursive=False)
    observer.start()

    logger.info(f"Watching {folder} for new CSV files... (Ctrl+C to stop)")

    stop = False

    def _signal_handler(signum, frame):
        nonlocal stop
        stop = True

    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)

    try:
        while not stop:
            time.sleep(1)
    finally:
        observer.stop()
        observer.join()
        logger.info("Watcher stopped.")
