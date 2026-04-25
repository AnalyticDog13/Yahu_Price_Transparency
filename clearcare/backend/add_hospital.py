#!/usr/bin/env python3
"""
Add a single hospital to prices.csv without rebuilding from scratch.

Usage:
    python3 add_hospital.py \\
        --file   "232829095_jefferson-methodist-hospital_standardcharges.csv" \\
        --name   "Jefferson Methodist Hospital" \\
        --city   "Philadelphia" \\
        --state  "PA" \\
        --address "2301 S Broad Street"

What it does:
    1. Parses the hospital CSV using the same logic as parse_prices.py
    2. Removes any existing rows for this hospital from prices.csv
       (safe to re-run if you need to refresh one hospital's data)
    3. Appends the new rows
    4. Rebuilds prices.db from the updated CSV

Supported formats:
    CMS v3.x long-format CSV with either lowercase or Title/Pascal case
    column names. Two-row metadata header is expected.
"""

import argparse
import csv
import os
import sys

# Allow importing shared logic from parse_prices
sys.path.insert(0, os.path.dirname(__file__))
from parse_prices import (
    CSV_COLUMNS,
    parse_hospital_csv,
    write_db,
    OUT_CSV,
    OUT_DB,
)


def load_existing_csv() -> list[dict]:
    if not os.path.exists(OUT_CSV):
        return []
    with open(OUT_CSV, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def save_csv(rows: list[dict]):
    os.makedirs(os.path.dirname(OUT_CSV), exist_ok=True)
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    size_kb = os.path.getsize(OUT_CSV) / 1024
    print(f"CSV updated  → {OUT_CSV}  ({size_kb:.0f} KB, {len(rows):,} total rows)")


def main():
    parser = argparse.ArgumentParser(description="Add one hospital to prices.csv")
    parser.add_argument("--file",    required=True, help="CSV/XLSX filename inside hospital-price-data/")
    parser.add_argument("--name",    required=True, help='Display name, e.g. "Jefferson Methodist Hospital"')
    parser.add_argument("--city",    required=True, help='City, e.g. "Philadelphia"')
    parser.add_argument("--state",   required=True, help='State abbreviation, e.g. "PA"')
    parser.add_argument("--address", required=True, help='Street address, e.g. "2301 S Broad Street"')
    parser.add_argument("--format",  default="long", choices=["long", "wide"],
                        help='File format: "long" (one row per payer, default) or "wide" (payers as columns, e.g. HUP)')
    parser.add_argument("--xlsx-sheet", default=None,
                        help='Sheet name for .xlsx files (defaults to first sheet)')
    args = parser.parse_args()

    hospital = {
        "filename":         args.file,
        "hospital_name":    args.name,
        "hospital_city":    args.city,
        "hospital_state":   args.state,
        "hospital_address": args.address,
        "format":           args.format,
    }
    if args.xlsx_sheet:
        hospital["xlsx_sheet"] = args.xlsx_sheet

    # Parse the new hospital
    new_rows = parse_hospital_csv(hospital)
    if not new_rows:
        print("No matching rows found — prices.csv unchanged.")
        sys.exit(1)

    # Load existing data, drop any stale rows for this hospital, append new ones
    existing = load_existing_csv()
    before = len(existing)
    existing = [r for r in existing if r["hospital_name"] != args.name]
    removed = before - len(existing)
    if removed:
        print(f"  Replaced {removed:,} existing rows for '{args.name}'")

    all_rows = existing + new_rows
    save_csv(all_rows)
    write_db(all_rows)

    # Summary for the new hospital only
    from collections import Counter
    by_cat = Counter(r["procedure_category"] for r in new_rows)
    print(f"\n=== {args.name} — {len(new_rows):,} rows added ===")
    for cat, n in sorted(by_cat.items()):
        print(f"  {cat}: {n:,}")


if __name__ == "__main__":
    main()
