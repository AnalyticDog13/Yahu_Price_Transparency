#!/usr/bin/env python3
"""ClearCare Flask web app."""

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
# API                                                                          #
# --------------------------------------------------------------------------- #

@app.route("/api/procedures")
def api_procedures():
    """Return {category: [cpt_codes]} for the UI dropdown."""
    con = get_db()
    rows = con.execute(
        "SELECT DISTINCT procedure_category, cpt_code FROM prices ORDER BY procedure_category, cpt_code"
    ).fetchall()
    con.close()

    categories = {}
    for r in rows:
        categories.setdefault(r["procedure_category"], []).append(r["cpt_code"])
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
        codes                – comma-separated CPT codes
        payer                – insurance payer name
        deductible_met       – "yes" | "no"
        deductible_remaining – dollars remaining on deductible
        coinsurance          – patient % after deductible (default 20)
    """
    codes = [c.strip() for c in request.args.get("codes", "").split(",") if c.strip()]
    payer = request.args.get("payer", "").strip().upper()
    deductible_met = request.args.get("deductible_met", "no").lower() == "yes"
    try:
        deductible_remaining = float(request.args.get("deductible_remaining") or 0)
    except ValueError:
        deductible_remaining = 0.0
    try:
        coinsurance_pct = float(request.args.get("coinsurance") or 20) / 100.0
    except ValueError:
        coinsurance_pct = 0.20

    if not codes or not payer:
        return jsonify({"error": "codes and payer are required"}), 400

    con = get_db()
    placeholders = ",".join("?" * len(codes))

    insurer_rows = con.execute(
        f"""
        SELECT hospital_name, hospital_city, hospital_state,
               cpt_code, procedure_name, procedure_category,
               payer, plan, negotiated_dollar, discounted_cash, gross_charge
        FROM prices
        WHERE cpt_code IN ({placeholders})
          AND payer = ?
          AND negotiated_dollar IS NOT NULL
          AND negotiated_dollar != ''
        ORDER BY CAST(negotiated_dollar AS REAL) ASC
        """,
        codes + [payer],
    ).fetchall()

    # Best cash price per hospital (across all matching CPT codes)
    hospitals_in_result = list({r["hospital_name"] for r in insurer_rows})
    cash_by_hospital = {}
    if hospitals_in_result:
        hp = ",".join("?" * len(hospitals_in_result))
        for row in con.execute(
            f"""
            SELECT hospital_name, MIN(CAST(discounted_cash AS REAL)) AS best_cash
            FROM prices
            WHERE cpt_code IN ({placeholders}) AND hospital_name IN ({hp})
              AND discounted_cash IS NOT NULL AND discounted_cash != ''
            GROUP BY hospital_name
            """,
            codes + hospitals_in_result,
        ).fetchall():
            cash_by_hospital[row["hospital_name"]] = row["best_cash"]

    con.close()

    # One result per hospital — keep the cheapest negotiated row
    seen = {}
    for r in insurer_rows:
        if r["hospital_name"] not in seen:
            seen[r["hospital_name"]] = dict(r)

    results = []
    for hosp, r in seen.items():
        negotiated = float(r["negotiated_dollar"])
        cash = cash_by_hospital.get(hosp)
        gross = float(r["gross_charge"]) if r["gross_charge"] else None

        if deductible_met:
            oop = negotiated * coinsurance_pct
        else:
            oop = min(deductible_remaining, negotiated) if deductible_remaining > 0 else negotiated
            if deductible_remaining > 0 and negotiated > deductible_remaining:
                oop += (negotiated - deductible_remaining) * coinsurance_pct

        results.append({
            "hospital": f"{r['hospital_name']} — {r['hospital_city']}, {r['hospital_state']}",
            "procedure_name": r["procedure_name"],
            "payer": r["payer"],
            "plan": r["plan"],
            "negotiated_dollar": negotiated,
            "discounted_cash": cash,
            "gross_charge": gross,
            "estimated_oop": round(oop, 2),
        })

    results.sort(key=lambda x: x["estimated_oop"])
    return jsonify(results)


@app.route("/api/hospitals")
def api_hospitals():
    con = get_db()
    rows = con.execute(
        "SELECT DISTINCT hospital_name, hospital_city, hospital_state FROM prices ORDER BY hospital_name"
    ).fetchall()
    con.close()
    return jsonify([{"name": r["hospital_name"], "city": r["hospital_city"], "state": r["hospital_state"]} for r in rows])


# --------------------------------------------------------------------------- #
# Pages                                                                        #
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
