# ClearCare — CLAUDE.md

> GoodRx for hospitals. Show patients their true out-of-pocket cost at every nearby hospital, before they walk in.
> Built for Cornell Claude Hackathon · Team Yahu · April 2026

---

## Working Principles

**Conserve context.** Keep responses tight. Do not re-explain what is already in the codebase. Read files before editing them.

**Think like a domain expert.** Reason as a financial analyst, insurance actuary, and healthcare administrator simultaneously. Understand CPT billing, negotiated rate structures, and deductible/coinsurance math.

**Be brutally honest.** If the data is thin, say so. If an approach is wrong, say so. Optimize for a working, defensible product — not a comfortable one.

**Test before shipping.** Confirm the Flask API returns correct JSON and the OOP math is correct after every change.

---

## Project Structure

```
Yahu_Price_Transparency/
│
├── README.md
├── CLAUDE.md                          ← this file
├── .gitignore
│
├── hospital-price-data/               ← raw CSVs (Pete downloads, gitignored)
│   └── <EIN>_<hospital>_standardcharges.csv
│
└── clearcare/
    │
    ├── backend/                       ← Pete's domain
    │   ├── parse_prices.py            full rebuild: all CSVs → prices.csv + prices.db
    │   ├── add_hospital.py            incremental: one hospital → appends to prices.csv
    │   ├── app.py                     Flask API (python3 app.py to start)
    │   └── data/
    │       ├── prices.csv             ✅ committed — handoff artifact
    │       └── prices.db              gitignored — auto-built from prices.csv on app start
    │
    └── frontend/                      ← Will's domain
        ├── index.html                 current working UI (starting reference)
        └── static/                    CSS, JS, assets (Will builds this out)
```

---

## Workflows

### Workflow 1 — Data Pipeline (Pete)

Pete owns everything from raw CSV to `prices.csv`. Will never touches this.

```
1. Download raw CSV from hospital's public price transparency page
   Drop into: hospital-price-data/

2. Run add_hospital.py (incremental) or parse_prices.py (full rebuild)
   cd clearcare/backend
   python3 add_hospital.py --file <filename> --name <name> --city <city> --state <state> --address <address>

3. Output: clearcare/backend/data/prices.csv
   One clean, flat CSV regardless of source hospital format.
   This is the only artifact Will depends on.

4. Commit updated prices.csv to git.
```

**Supported source formats:**
- CMS v3.x long-format CSV, lowercase column names (St. Francis, Riddle)
- CMS v3.x long-format CSV, Title/Pascal case column names (Jefferson Methodist)
- Both handled transparently via column name lowercasing at parse time

**Not yet supported:** wide-format (payers as columns), JSON format.

---

### Workflow 2 — Website (Will)

Will owns `clearcare/frontend/` and the Flask routes that serve it. `prices.csv` (via `prices.db`) is the only input.

```
User flow:
1. Select procedure       → GET /api/procedures
2. Select insurance       → GET /api/payers?codes=...
3. Enter deductible info  → handled on frontend (no API call)
4. Search                 → GET /api/prices?codes=...&payer=...&deductible_met=...
5. See ranked results     → one card per hospital, sorted cheapest → most expensive
```

**OOP calculation (in `app.py:api_prices`):**

```python
if deductible_met:
    oop = negotiated_dollar * coinsurance_pct
else:
    oop = min(deductible_remaining, negotiated_dollar)
    if negotiated_dollar > deductible_remaining:
        oop += (negotiated_dollar - deductible_remaining) * coinsurance_pct
```

---

## The Handoff

**`prices.csv` is the contract between the two workflows.**

- Pete produces it by running `parse_prices.py` or `add_hospital.py`
- Will reads from it via the Flask API (loaded into `prices.db` at app startup)
- Will never modifies the parser or raw CSVs
- Pete never touches `app.py` or the frontend

Schema (14 columns): `hospital_name`, `hospital_city`, `hospital_state`, `hospital_address`, `procedure_category`, `procedure_name`, `cpt_code`, `payer`, `plan`, `negotiated_dollar`, `discounted_cash`, `gross_charge`, `setting`, `billing_class`

---

## Current Status

**Done:**
- `parse_prices.py` — full pipeline, handles multi-million-row CSVs, correct schema
- `add_hospital.py` — incremental single-hospital append, idempotent (safe to re-run)
- `app.py` — all 4 API endpoints functional
- `index.html` — working prototype UI with search form, ranked results, OOP display
- `prices.csv` — committed, 21,501 rows across 3 hospitals
- Format normalization — handles both lowercase and Title/Pascal case CMS column names

**In progress / not done:**
- [ ] Only 3 hospitals (St. Francis, Riddle, Jefferson Methodist) — need 7–10 more in Philly metro
- [ ] Frontend is a prototype — Will needs to build the production website
- [ ] No `requirements.txt`
- [ ] No wide-format or JSON parser
- [ ] No geographic filtering in API
- [ ] No hospital lat/lon in registry

---

## Running the App

```bash
# Install dependencies
pip install flask

# Build prices.csv (Pete's step — requires raw CSVs in hospital-price-data/)
cd clearcare/backend
python3 parse_prices.py

# Start the web server
python3 app.py
# → http://localhost:5001
# prices.db is auto-built from prices.csv if missing
```

---

## Testing Checklist

Run after every backend change:

- [ ] `GET /api/procedures` returns 13 categories with correct CPT codes
- [ ] `GET /api/payers?codes=70551,70552,70553` returns non-empty list
- [ ] `GET /api/prices?codes=70551&payer=AETNA&deductible_met=yes&coinsurance=20` returns results sorted by `estimated_oop`
- [ ] OOP math: negotiated=$1000, deductible_met=yes, coinsurance=20% → oop=$200
- [ ] OOP math: negotiated=$1000, deductible_remaining=$600, coinsurance=20% → oop=$600 + ($400×0.20) = $680
- [ ] OOP math: negotiated=$500, deductible_remaining=$600, coinsurance=20% → oop=$500
- [ ] `add_hospital.py` re-run on same hospital produces same row count (idempotent)
