#!/usr/bin/env python3
"""ClearCare Flask web app."""

import json
import math
import os
import sqlite3

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "static", "data", "prices.db")


def get_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


# --------------------------------------------------------------------------- #
# API routes                                                                   #
# --------------------------------------------------------------------------- #

@app.route("/api/procedures")
def api_procedures():
    """Return procedure categories and codes."""
    con = get_db()
    rows = con.execute(
        "SELECT DISTINCT category, cpt_code FROM procedure_categories ORDER BY category, cpt_code"
    ).fetchall()
    con.close()

    categories = {}
    for r in rows:
        categories.setdefault(r["category"], []).append(r["cpt_code"])
    return jsonify(categories)


@app.route("/api/payers")
def api_payers():
    """Return payers that have data for the given cpt_codes (comma-separated)."""
    codes = [c.strip() for c in request.args.get("codes", "").split(",") if c.strip()]
    if not codes:
        return jsonify([])

    con = get_db()
    placeholders = ",".join("?" * len(codes))
    rows = con.execute(
        f"SELECT DISTINCT payer FROM prices WHERE cpt_code IN ({placeholders}) ORDER BY payer",
        codes,
    ).fetchall()
    con.close()
    return jsonify([r["payer"] for r in rows])


@app.route("/api/prices")
def api_prices():
    """
    Return ranked prices for a procedure + payer combo.

    Query params:
        codes     – comma-separated CPT codes (for the selected category)
        payer     – insurance payer name
        deductible_met  – "yes" | "no"
        deductible_remaining – float (dollars remaining on deductible)
        coinsurance – float 0-100 (% patient owes after deductible, default 20)
    """
    codes = [c.strip() for c in request.args.get("codes", "").split(",") if c.strip()]
    payer = request.args.get("payer", "").strip()
    deductible_met = request.args.get("deductible_met", "no").lower() == "yes"
    try:
        deductible_remaining = float(request.args.get("deductible_remaining", "0") or "0")
    except ValueError:
        deductible_remaining = 0.0
    try:
        coinsurance_pct = float(request.args.get("coinsurance", "20") or "20") / 100.0
    except ValueError:
        coinsurance_pct = 0.20

    if not codes or not payer:
        return jsonify({"error": "codes and payer are required"}), 400

    con = get_db()
    placeholders = ",".join("?" * len(codes))

    # Get the best (lowest) negotiated dollar per hospital for the given payer+codes
    insurer_rows = con.execute(
        f"""
        SELECT hospital, cpt_code, procedure_name, payer, plan,
               negotiated_dollar, discounted_cash, gross_charge
        FROM prices
        WHERE cpt_code IN ({placeholders})
          AND payer = UPPER(?)
          AND negotiated_dollar IS NOT NULL
        ORDER BY negotiated_dollar ASC
        """,
        codes + [payer],
    ).fetchall()

    # Also get cash prices for hospitals that appear
    hospitals_in_result = list({r["hospital"] for r in insurer_rows})
    cash_rows = {}
    if hospitals_in_result:
        hp = ",".join("?" * len(hospitals_in_result))
        for row in con.execute(
            f"""
            SELECT hospital, MIN(discounted_cash) AS best_cash
            FROM prices
            WHERE cpt_code IN ({placeholders}) AND hospital IN ({hp})
              AND discounted_cash IS NOT NULL
            GROUP BY hospital
            """,
            codes + hospitals_in_result,
        ).fetchall():
            cash_rows[row["hospital"]] = row["best_cash"]

    con.close()

    # Build results — one entry per hospital (take the best/lowest row per hospital)
    seen_hospitals = {}
    for r in insurer_rows:
        hosp = r["hospital"]
        if hosp not in seen_hospitals:
            seen_hospitals[hosp] = dict(r)

    results = []
    for hosp, r in seen_hospitals.items():
        negotiated = r["negotiated_dollar"]
        cash = cash_rows.get(hosp)

        # Estimate patient out-of-pocket
        if deductible_met:
            oop = negotiated * coinsurance_pct
        else:
            # Patient pays the full negotiated rate until deductible is met
            oop = min(deductible_remaining, negotiated) if deductible_remaining > 0 else negotiated
            # If deductible_remaining < negotiated, patient also owes coinsurance on remainder
            if deductible_remaining > 0 and negotiated > deductible_remaining:
                oop += (negotiated - deductible_remaining) * coinsurance_pct

        results.append({
            "hospital": hosp,
            "procedure_name": r["procedure_name"],
            "payer": r["payer"],
            "plan": r["plan"],
            "negotiated_dollar": negotiated,
            "discounted_cash": cash,
            "gross_charge": r["gross_charge"],
            "estimated_oop": round(oop, 2),
        })

    # Sort by estimated out-of-pocket
    results.sort(key=lambda x: x["estimated_oop"])
    return jsonify(results)


@app.route("/api/hospitals")
def api_hospitals():
    """Return all hospitals in the database."""
    con = get_db()
    rows = con.execute("SELECT DISTINCT hospital FROM prices ORDER BY hospital").fetchall()
    con.close()
    return jsonify([r["hospital"] for r in rows])


# --------------------------------------------------------------------------- #
# Page routes                                                                  #
# --------------------------------------------------------------------------- #

@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}")
        print("Run parse_prices.py first.")
        exit(1)
    app.run(debug=True, port=5001)
