"""Folder watcher that auto-imports new CSV files via the AI agent."""

from __future__ import annotations

import logging
import signal
import time
from pathlib import Path

from watchdog.events import FileSystemEventHandler, FileCreatedEvent
from watchdog.observers import Observer

from .agent import process_csv
from .ynab_client import load_settings

logger = logging.getLogger(__name__)


class CSVHandler(FileSystemEventHandler):
    def __init__(self, dry_run: bool = False, settle_time: float = 2.0):
        self.dry_run = dry_run
        self.settle_time = settle_time

    def on_created(self, event: FileCreatedEvent) -> None:
        if event.is_directory:
            return
        path = Path(event.src_path)
        if path.suffix.lower() != ".csv":
            return

        logger.info(f"New CSV detected: {path}")
        time.sleep(self.settle_time)

        try:
            result = process_csv(path, dry_run=self.dry_run)

            if self.dry_run:
                logger.info(f"[DRY RUN] Would import {result['transactions_created']} transactions")
            else:
                logger.info(
                    f"Imported {result['transactions_created']} transactions "
                    f"({result['duplicates_skipped']} duplicates skipped) from {path.name}"
                )
        except Exception:
            logger.exception(f"Error processing {path}")


def watch_folder(
    folder: Path,
    dry_run: bool = False,
) -> None:
    """Watch a folder for new CSV files and import them via the AI agent."""
    settings = load_settings()
    settle_time = settings.get("watcher", {}).get("settle_time_seconds", 2)

    handler = CSVHandler(dry_run=dry_run, settle_time=settle_time)
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
