#!/usr/bin/env python3
"""ClearCare Flask web app."""

import csv
import os

from flask import Flask, jsonify, render_template, request

app = Flask(
    __name__,
    template_folder=os.path.join(os.path.dirname(__file__), "..", "frontend"),
    static_folder=os.path.join(os.path.dirname(__file__), "..", "frontend", "static"),
)

CSV_PATH = os.path.join(os.path.dirname(__file__), "data", "prices.csv")


def _safe_float(val):
    try:
        f = float(val)
        return f if f > 0 else None
    except (ValueError, TypeError):
        return None


def _load_prices():
    rows = []
    with open(CSV_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            row["negotiated_dollar"] = _safe_float(row["negotiated_dollar"])
            row["discounted_cash"]   = _safe_float(row["discounted_cash"])
            row["gross_charge"]      = _safe_float(row["gross_charge"])
            rows.append(row)
    return rows


# Load once at startup — 32k rows fits easily in memory
PRICES = _load_prices()


# --------------------------------------------------------------------------- #
# API                                                                          #
# --------------------------------------------------------------------------- #

@app.route("/api/procedures")
def api_procedures():
    """Return {category: [cpt_codes]} for the UI dropdown."""
    categories = {}
    for r in PRICES:
        categories.setdefault(r["procedure_category"], set()).add(r["cpt_code"])
    return jsonify({cat: sorted(codes) for cat, codes in sorted(categories.items())})


@app.route("/api/payers")
def api_payers():
    """Return payers that have data for the given cpt_codes (comma-separated)."""
    codes = {c.strip() for c in request.args.get("codes", "").split(",") if c.strip()}
    if not codes:
        return jsonify([])

    state  = request.args.get("state", "").strip().upper()
    payers = sorted({r["payer"] for r in PRICES
                     if r["cpt_code"] in codes and r["payer"]
                     and (not state or r["hospital_state"] == state)})
    return jsonify(payers)


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
    codes = {c.strip() for c in request.args.get("codes", "").split(",") if c.strip()}
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

    state = request.args.get("state", "").strip().upper()

    if not codes or not payer:
        return jsonify({"error": "codes and payer are required"}), 400

    # Rows for this payer with a negotiated rate, cheapest first
    insurer_rows = sorted(
        [r for r in PRICES if r["cpt_code"] in codes and r["payer"] == payer
         and r["negotiated_dollar"] is not None
         and (not state or r["hospital_state"] == state)],
        key=lambda r: r["negotiated_dollar"],
    )

    # Best cash price per hospital across matching CPT codes
    hospitals_in_result = {r["hospital_name"] for r in insurer_rows}
    cash_by_hospital = {}
    for r in PRICES:
        if r["cpt_code"] in codes and r["hospital_name"] in hospitals_in_result and r["discounted_cash"] is not None:
            hosp = r["hospital_name"]
            if hosp not in cash_by_hospital or r["discounted_cash"] < cash_by_hospital[hosp]:
                cash_by_hospital[hosp] = r["discounted_cash"]

    # One result per hospital — keep the cheapest negotiated row
    seen = {}
    for r in insurer_rows:
        if r["hospital_name"] not in seen:
            seen[r["hospital_name"]] = r

    results = []
    for hosp, r in seen.items():
        negotiated = r["negotiated_dollar"]
        cash  = cash_by_hospital.get(hosp)
        gross = r["gross_charge"]

        if deductible_met:
            oop = negotiated * coinsurance_pct
        else:
            oop = min(deductible_remaining, negotiated) if deductible_remaining > 0 else negotiated
            if deductible_remaining > 0 and negotiated > deductible_remaining:
                oop += (negotiated - deductible_remaining) * coinsurance_pct

        results.append({
            "hospital":          f"{r['hospital_name']} — {r['hospital_city']}, {r['hospital_state']}",
            "procedure_name":    r["procedure_name"],
            "payer":             r["payer"],
            "plan":              r["plan"],
            "negotiated_dollar": negotiated,
            "discounted_cash":   cash,
            "gross_charge":      gross,
            "estimated_oop":     round(oop, 2),
        })

    results.sort(key=lambda x: x["estimated_oop"])
    return jsonify(results)


@app.route("/api/hospitals")
def api_hospitals():
    seen = {}
    for r in PRICES:
        if r["hospital_name"] not in seen:
            seen[r["hospital_name"]] = {"name": r["hospital_name"], "city": r["hospital_city"], "state": r["hospital_state"]}
    return jsonify(sorted(seen.values(), key=lambda x: x["name"]))


# --------------------------------------------------------------------------- #
# Pages                                                                        #
# --------------------------------------------------------------------------- #

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/support")
def support():
    return render_template("support.html")


@app.route("/signup")
def signup():
    return render_template("signup.html")


@app.route("/signin")
def signin():
    return render_template("signin.html")


if __name__ == "__main__":
    print(f"Loaded {len(PRICES):,} rows from prices.csv")
    app.run(debug=True, port=5001)
