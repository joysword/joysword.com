"""Compile Markdown mapping tables into a structured YAML config."""

from __future__ import annotations

import re
from pathlib import Path

import yaml

CONFIG_DIR = Path(__file__).resolve().parent.parent.parent / "config"


def _split_table_row(line: str) -> list[str]:
    """Split a markdown table row on unescaped pipes, restoring escaped pipes in cells."""
    # Split on | that are NOT preceded by \
    parts = re.split(r'(?<!\\)\|', line.strip())
    # Strip outer empty strings from leading/trailing |
    if parts and not parts[0].strip():
        parts = parts[1:]
    if parts and not parts[-1].strip():
        parts = parts[:-1]
    # Restore escaped pipes in cell content
    return [p.strip().replace("\\|", "|") for p in parts]


def parse_markdown_table(lines: list[str]) -> list[dict[str, str]]:
    """Parse a markdown table into a list of dicts keyed by header names."""
    if len(lines) < 2:
        return []

    # Extract headers from the first line
    headers = _split_table_row(lines[0])

    # Skip the separator line (line index 1), parse data rows
    rows = []
    for line in lines[2:]:
        line = line.strip()
        if not line or not line.startswith("|"):
            break
        cells = _split_table_row(line)
        if len(cells) == len(headers):
            rows.append(dict(zip(headers, cells)))

    return rows


def extract_tables(md_text: str) -> dict[str, list[dict[str, str]]]:
    """Extract named tables from markdown (keyed by preceding ## heading)."""
    tables: dict[str, list[dict[str, str]]] = {}
    current_heading = ""
    table_lines: list[str] = []
    in_table = False

    for line in md_text.splitlines():
        # Detect ## headings
        heading_match = re.match(r"^##\s+(.+)", line)
        if heading_match:
            # Flush previous table
            if in_table and table_lines:
                tables[current_heading] = parse_markdown_table(table_lines)
            current_heading = heading_match.group(1).strip()
            table_lines = []
            in_table = False
            continue

        stripped = line.strip()
        if stripped.startswith("|") and current_heading:
            table_lines.append(stripped)
            in_table = True
        elif in_table and not stripped:
            # End of table
            tables[current_heading] = parse_markdown_table(table_lines)
            table_lines = []
            in_table = False

    # Flush last table
    if in_table and table_lines:
        tables[current_heading] = parse_markdown_table(table_lines)

    return tables


def compile_mappings(md_path: Path | None = None, output_path: Path | None = None) -> dict:
    """Compile mappings.md into mappings.yaml and return the structured config."""
    if md_path is None:
        md_path = CONFIG_DIR / "mappings.md"
    if output_path is None:
        output_path = CONFIG_DIR / "mappings.yaml"

    md_text = md_path.read_text()
    tables = extract_tables(md_text)

    config: dict = {"payee_rules": [], "account_map": {}}

    # Parse payee → category table
    for key, rows in tables.items():
        if "payee" in key.lower() and "category" in key.lower():
            for row in rows:
                pattern = row.get("Payee pattern (regex)", "")
                ynab_payee = row.get("YNAB Payee", "")
                category = row.get("YNAB Category", "")
                if pattern:
                    config["payee_rules"].append({
                        "pattern": pattern,
                        "payee": ynab_payee,
                        "category": category,
                    })

        elif "source" in key.lower() and "account" in key.lower():
            for row in rows:
                bank_id = row.get("Bank ID", "").strip()
                account = row.get("YNAB Account Name", "").strip()
                if bank_id:
                    config["account_map"][bank_id] = account

    with open(output_path, "w") as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False)

    return config
