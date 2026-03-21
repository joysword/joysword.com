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
    """Accept a CSV upload + credentials, run the agent, return the event log."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename or not file.filename.endswith(".csv"):
        return jsonify({"error": "Please upload a .csv file"}), 400

    dry_run = request.form.get("dry_run", "false").lower() == "true"

    # Credentials from the form (stay in this process, never reach the LLM)
    ynab_api_token = request.form.get("ynab_api_token", "").strip() or None
    ynab_budget_id = request.form.get("ynab_budget_id", "").strip() or None
    llm_api_key = request.form.get("llm_api_key", "").strip() or None
    llm_model = request.form.get("llm_model", "").strip() or None

    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / file.filename
        file.save(csv_path)

        event_log: list[dict] = []
        try:
            result = process_csv(
                csv_path=csv_path,
                dry_run=dry_run,
                event_log=event_log,
                ynab_api_token=ynab_api_token,
                ynab_budget_id=ynab_budget_id,
                llm_api_key=llm_api_key,
                llm_model=llm_model,
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
