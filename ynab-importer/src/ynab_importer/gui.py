"""Flask web GUI for the YNAB importer agent."""

from __future__ import annotations

import json
import logging
import tempfile
from pathlib import Path

from flask import Flask, render_template, request, jsonify

from .agent import process_csv

logger = logging.getLogger(__name__)

app = Flask(__name__, template_folder=Path(__file__).parent / "templates")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/process", methods=["POST"])
def process():
    """Accept a CSV upload, run the agent, return the event log."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename or not file.filename.endswith(".csv"):
        return jsonify({"error": "Please upload a .csv file"}), 400

    dry_run = request.form.get("dry_run", "false").lower() == "true"

    # Save to temp file preserving original name
    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / file.filename
        file.save(csv_path)

        event_log: list[dict] = []
        try:
            result = process_csv(
                csv_path=csv_path,
                dry_run=dry_run,
                event_log=event_log,
            )
        except Exception as e:
            logger.exception("Agent failed")
            return jsonify({
                "error": str(e),
                "event_log": event_log,
            }), 500

    return jsonify({
        "result": result,
        "event_log": event_log,
    })


def run_gui(host: str = "127.0.0.1", port: int = 5050, debug: bool = False):
    """Start the Flask dev server."""
    app.run(host=host, port=port, debug=debug)
