#!/usr/bin/env python3
"""
ClearCare data pipeline.
Reads hospital price transparency CSVs, extracts imaging/diagnostic procedures
by CPT code, and writes a normalized SQLite database for the web app.

Usage:
    python3 parse_prices.py
"""

import csv
import sqlite3
import os
import re
import time

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "hospital-price-data")
DB_PATH = os.path.join(os.path.dirname(__file__), "static", "data", "prices.db")

# CPT codes for target procedures (code -> canonical procedure name)
PROCEDURE_CODES = {
    # MRI Brain
    "70551": "MRI Brain (w/o contrast)",
    "70552": "MRI Brain (w/ contrast)",
    "70553": "MRI Brain (w/o & w/ contrast)",
    # MRI Spine
    "72141": "MRI Cervical Spine (w/o contrast)",
    "72142": "MRI Cervical Spine (w/ contrast)",
    "72146": "MRI Thoracic Spine (w/o contrast)",
    "72147": "MRI Thoracic Spine (w/ contrast)",
    "72148": "MRI Lumbar Spine (w/o contrast)",
    "72149": "MRI Lumbar Spine (w/ contrast)",
    "72156": "MRI Cervical Spine (w/o & w/ contrast)",
    "72157": "MRI Thoracic Spine (w/o & w/ contrast)",
    "72158": "MRI Lumbar Spine (w/o & w/ contrast)",
    # MRI Knee/Joint
    "73721": "MRI Knee/Joint (w/o contrast)",
    "73722": "MRI Knee/Joint (w/ contrast)",
    "73723": "MRI Knee/Joint (w/o & w/ contrast)",
    # MRI Abdomen
    "74181": "MRI Abdomen (w/o contrast)",
    "74182": "MRI Abdomen (w/ contrast)",
    "74183": "MRI Abdomen (w/o & w/ contrast)",
    # CT Head
    "70450": "CT Head/Brain (w/o contrast)",
    "70460": "CT Head/Brain (w/ contrast)",
    "70470": "CT Head/Brain (w/o & w/ contrast)",
    # CT Chest
    "71250": "CT Chest (w/o contrast)",
    "71260": "CT Chest (w/ contrast)",
    "71270": "CT Chest (w/o & w/ contrast)",
    # CT Abdomen/Pelvis
    "74176": "CT Abdomen & Pelvis (w/o contrast)",
    "74177": "CT Abdomen & Pelvis (w/ contrast)",
    "74178": "CT Abdomen & Pelvis (w/o & w/ contrast)",
    # Ultrasound
    "76700": "Ultrasound Abdomen (complete)",
    "76705": "Ultrasound Abdomen (limited)",
    "76856": "Ultrasound Pelvis (complete)",
    "76857": "Ultrasound Pelvis (limited)",
    # X-Ray
    "71045": "Chest X-Ray (1 view)",
    "71046": "Chest X-Ray (2 views)",
    # CBC
    "85025": "CBC Blood Panel (automated w/ diff)",
    "85027": "CBC Blood Panel (automated)",
}

# Broad category groupings shown in the UI dropdown
PROCEDURE_CATEGORIES = {
    "MRI Brain": ["70551", "70552", "70553"],
    "MRI Spine (Cervical)": ["72141", "72142", "72156"],
    "MRI Spine (Thoracic)": ["72146", "72147", "72157"],
    "MRI Spine (Lumbar)": ["72148", "72149", "72158"],
    "MRI Knee / Joint": ["73721", "73722", "73723"],
    "MRI Abdomen": ["74181", "74182", "74183"],
    "CT Head / Brain": ["70450", "70460", "70470"],
    "CT Chest": ["71250", "71260", "71270"],
    "CT Abdomen & Pelvis": ["74176", "74177", "74178"],
    "Ultrasound Abdomen": ["76700", "76705"],
    "Ultrasound Pelvis": ["76856", "76857"],
    "Chest X-Ray": ["71045", "71046"],
    "CBC Blood Panel": ["85025", "85027"],
}

# Normalise payer name for display (strip excess noise, title-case)
def normalise_payer(name: str) -> str:
    name = name.strip().upper()
    name = re.sub(r"\s+", " ", name)
    return name


def safe_float(val: str):
    try:
        f = float(val)
        return f if f > 0 else None
    except (ValueError, TypeError):
        return None


def parse_hospital_csv(path: str, hospital_name: str):
    rows = []
    t0 = time.time()
    print(f"  Parsing {hospital_name} …")

    with open(path, encoding="utf-8-sig", errors="replace") as f:
        # Skip the two hospital-metadata header rows, then DictReader uses row 3 as header
        next(f)
        next(f)
        reader = csv.DictReader(f)

        for i, row in enumerate(reader):
            # Find any CPT/HCPCS code that matches our target list
            cpt_code = None
            for slot in range(1, 5):
                code = row.get(f"code|{slot}", "").strip()
                ctype = row.get(f"code|{slot}|type", "").strip().upper()
                if ctype in ("CPT", "HCPCS") and code in PROCEDURE_CODES:
                    cpt_code = code
                    break

            if not cpt_code:
                continue

            negotiated = safe_float(row.get("standard_charge|negotiated_dollar"))
            cash = safe_float(row.get("standard_charge|discounted_cash"))
            gross = safe_float(row.get("standard_charge|gross"))

            # Must have at least one dollar amount
            if negotiated is None and cash is None:
                continue

            payer = normalise_payer(row.get("payer_name", ""))
            plan = row.get("plan_name", "").strip()

            rows.append({
                "hospital": hospital_name,
                "cpt_code": cpt_code,
                "procedure_name": PROCEDURE_CODES[cpt_code],
                "description": row.get("description", "").strip(),
                "payer": payer,
                "plan": plan,
                "setting": row.get("setting", "").strip(),
                "billing_class": row.get("billing_class", "").strip(),
                "negotiated_dollar": negotiated,
                "discounted_cash": cash,
                "gross_charge": gross,
            })

            if i % 500_000 == 0 and i > 0:
                print(f"    … {i:,} rows scanned ({len(rows):,} matches so far)")

    print(f"  Done: {len(rows):,} rows in {time.time()-t0:.1f}s")
    return rows


def build_db(rows: list[dict]):
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    cur.execute("""
        CREATE TABLE prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hospital TEXT NOT NULL,
            cpt_code TEXT NOT NULL,
            procedure_name TEXT NOT NULL,
            description TEXT,
            payer TEXT NOT NULL,
            plan TEXT,
            setting TEXT,
            billing_class TEXT,
            negotiated_dollar REAL,
            discounted_cash REAL,
            gross_charge REAL
        )
    """)

    cur.execute("""
        CREATE TABLE procedure_categories (
            category TEXT NOT NULL,
            cpt_code TEXT NOT NULL
        )
    """)

    cur.executemany("""
        INSERT INTO prices
            (hospital, cpt_code, procedure_name, description, payer, plan,
             setting, billing_class, negotiated_dollar, discounted_cash, gross_charge)
        VALUES
            (:hospital, :cpt_code, :procedure_name, :description, :payer, :plan,
             :setting, :billing_class, :negotiated_dollar, :discounted_cash, :gross_charge)
    """, rows)

    for category, codes in PROCEDURE_CATEGORIES.items():
        for code in codes:
            cur.execute("INSERT INTO procedure_categories VALUES (?, ?)", (category, code))

    cur.execute("CREATE INDEX idx_cpt ON prices(cpt_code)")
    cur.execute("CREATE INDEX idx_payer ON prices(payer)")
    cur.execute("CREATE INDEX idx_hospital ON prices(hospital)")

    con.commit()
    con.close()
    print(f"\nDatabase written → {DB_PATH}  ({os.path.getsize(DB_PATH) / 1_048_576:.1f} MB)")


def main():
    hospital_files = {
        "St. Francis Hospital (Wilmington, DE)": "510064326_St.-Francis-Hospital-Inc_standardcharges.csv",
        "Riddle Memorial Hospital": "23-1529076_riddle-memorial-hospital_standardcharges.csv",
    }

    all_rows = []
    for hospital_name, filename in hospital_files.items():
        path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(path):
            print(f"  SKIPPED (not found): {filename}")
            continue
        all_rows.extend(parse_hospital_csv(path, hospital_name))

    print(f"\nTotal rows: {len(all_rows):,}")
    build_db(all_rows)


if __name__ == "__main__":
    main()
