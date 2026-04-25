# ClearCare — CLAUDE.md

> GoodRx for hospitals. Show patients their true out-of-pocket cost at every nearby hospital, before they walk in.
> Built for Cornell Claude Hackathon · Team Yahu · April 2026

---

## Working Principles

**Conserve context.** We are on Claude Pro plan limits for a single hackathon day. Keep responses tight. Do not re-explain what is already in the codebase. Do not pad. Read files before editing them.

**Think like a domain expert.** Reason as a financial analyst, insurance actuary, spreadsheet power user, healthcare administrator, and statistician simultaneously. That means: understand CPT billing, negotiated rate structures, deductible/coinsurance math, and what makes price variation statistically meaningful.

**Be brutally honest.** Do not say what sounds good. Say what is true and what will work. If the data is thin, say so. If an approach is wrong, say so. Optimize for a working, defensible product — not a comfortable one.

**Test before shipping.** Run tests after every change. Confirm the Flask API returns correct JSON, the OOP math is correct, and the UI renders properly. A bug found at demo time is a failure.

---

## Project Goal

Aggregate publicly mandated hospital price transparency data and pair it with a user's insurance details to show exactly what they would pay at each nearby hospital — ranked cheapest to most expensive — before they walk in.

**Scope for this competition:**

| Scope | Target |
|-------|--------|
| Region | One metro area (NYC or Houston preferred) |
| Hospitals | 10–15 with published price files |
| Procedures | 13 categories: MRI (brain/spine/knee/abdomen), CT (head/chest/abdomen-pelvis), Ultrasound (abdomen/pelvis), Chest X-Ray, CBC blood panel |
| Insurers | Aetna, UnitedHealthcare, BCBS, Cigna |

---

## Project Structure

```
Yahu_Price_Transparency/
├── CLAUDE.md                  ← this file
├── README.md
├── hospital-price-data/       ← raw CSVs (Pete downloads, never committed to git)
│   └── <EIN>_<hospital>_standardcharges.csv
├── clearcare/
│   ├── app.py                 ← Flask web app (Will's domain)
│   ├── parse_prices.py        ← data pipeline (Pete's domain)
│   ├── static/
│   │   └── data/
│   │       └── prices.csv     ← normalized CSV (the handoff artifact)
│   └── templates/
│       └── index.html         ← frontend UI (Will's domain)
```

---

## Workflows

### Workflow 1 — Data Pipeline (Pete's Job)

Pete owns everything from raw CSV to `prices.csv`. Will never touches this.

```
For each hospital:

1. Download raw CSV
   └── From the hospital's public price transparency page
       Naming convention: <EIN>_<hospital-name>_standardcharges.csv
       Drop into: hospital-price-data/

2. Register it in parse_prices.py
   └── Add one entry to the hospital_files dict in main():
       "Hospital Name (City, ST)": "filename.csv"

3. Run the parser
   └── python3 clearcare/parse_prices.py
       Scans millions of rows, matches 35 CPT codes, normalizes payer names
       Takes ~15 seconds per hospital file

4. Output: clearcare/static/data/prices.csv
   └── One clean, flat CSV regardless of source hospital format
       Columns: hospital, cpt_code, procedure_name, description, payer, plan,
                setting, billing_class, negotiated_dollar, discounted_cash, gross_charge
       This is the only artifact Will depends on
```

**CPT codes tracked** (35 total across 13 categories — defined in `parse_prices.py:PROCEDURE_CODES`):
MRI Brain (70551–70553), MRI Cervical/Thoracic/Lumbar Spine, MRI Knee/Joint (73721–73723), MRI Abdomen (74181–74183), CT Head (70450–70470), CT Chest (71250–71270), CT Abdomen & Pelvis (74176–74178), Ultrasound Abdomen (76700/76705), Ultrasound Pelvis (76856/76857), Chest X-Ray (71045/71046), CBC Blood Panel (85025/85027).

**Parser notes:**
- Input CSV format: 2 metadata header rows, then a DictReader-compatible header on row 3
- CPT code columns: `code|1` through `code|4`, with `code|N|type` = "CPT" or "HCPCS"
- Price columns: `standard_charge|negotiated_dollar`, `standard_charge|discounted_cash`, `standard_charge|gross`
- Payer column: `payer_name` (normalized to UPPER, stripped)
- Rows with neither negotiated nor cash price are dropped

---

### Workflow 2 — Website (Will's Job)

Will owns the Flask app and frontend. Pete's `prices.csv` is the only input.

```
User flow:

1. Select procedure
   └── GET /api/procedures
       Returns 13 categories mapped to their CPT codes

2. Select insurance provider
   └── GET /api/payers?codes=70551,70552,70553
       Returns all payers with data for those codes
       Grouped in UI: Aetna / BCBS / Cigna / UnitedHealthcare / Medicaid / Medicare / Other

3. Enter deductible info
   └── Three inputs: deductible met (yes/no) · remaining amount ($) · coinsurance (%)
       Handled on frontend — no API call

4. Search
   └── GET /api/prices?codes=...&payer=...&deductible_met=...&deductible_remaining=...&coinsurance=...
       Computes estimated out-of-pocket per hospital
       Returns sorted cheapest → most expensive

5. Results
   └── One card per hospital:
       · Estimated out-of-pocket (large, prominent)
       · Negotiated rate (insurer-contracted price)
       · Cash/self-pay price (for uninsured)
       · Lowest cost flagged in green
```

**OOP calculation logic** (in `app.py:api_prices`):

```
if deductible_met:
    oop = negotiated_rate × coinsurance_pct

else:
    oop = min(deductible_remaining, negotiated_rate)
    if negotiated_rate > deductible_remaining:
        oop += (negotiated_rate - deductible_remaining) × coinsurance_pct
```

This is the core financial logic. It must be correct. Test it with known inputs.

---

## The Handoff

**`prices.csv` is the contract between the two workflows.**

- Pete produces it by running `parse_prices.py`
- Will reads from it via the Flask API (loaded into memory at request time, or cached at startup)
- Will never modifies the raw CSVs or the parser
- Pete never touches `app.py` or `index.html`

If `prices.csv` doesn't exist, the Flask app fails on startup with a clear error message — that's intentional.

---

## Current Status (as of project start)

**Done:**
- `parse_prices.py` — full pipeline, handles multi-million-row CSVs, correct schema
- `app.py` — all 4 API endpoints functional (`/api/procedures`, `/api/payers`, `/api/prices`, `/api/hospitals`)
- `index.html` — complete UI with search form, ranked results, OOP display, cash-pay fallback

**Not done / needs work:**
- Only 2 hospitals registered (St. Francis Wilmington DE + Riddle Memorial) — need 10–15
- No geographic concentration yet — need hospitals in a single metro area for the demo to be compelling
- No `requirements.txt` — needs Flask and pandas at minimum
- No `prices.csv` in repo (correct — it's generated locally from raw CSVs)
- No tests written

**Honest assessment:** The pipeline and UI are functionally complete. The bottleneck is data volume. Two hospitals in Delaware is not a compelling demo. The work remaining is almost entirely Pete downloading CSVs and registering hospitals — not engineering. Will's job is mostly done unless new features are needed.

---

## Running the App

```bash
# 1. Install dependencies
pip install flask

# 2. Build prices.csv (Pete's step — requires raw CSVs in hospital-price-data/)
python3 clearcare/parse_prices.py

# 3. Start the web app
python3 clearcare/app.py
# → http://localhost:5001
```

---

## Testing Checklist

Run after every change:

- [ ] `GET /api/procedures` returns 13 categories with correct CPT codes
- [ ] `GET /api/payers?codes=70551,70552,70553` returns non-empty list when prices.csv has data
- [ ] `GET /api/prices?codes=70551&payer=AETNA&deductible_met=yes&coinsurance=20` returns results sorted by `estimated_oop`
- [ ] OOP math: negotiated=$1000, deductible_met=yes, coinsurance=20% → oop=$200
- [ ] OOP math: negotiated=$1000, deductible_remaining=$600, coinsurance=20% → oop=$600 + ($400×0.20) = $680
- [ ] OOP math: negotiated=$500, deductible_remaining=$600, coinsurance=20% → oop=$500 (deductible not fully met)
- [ ] UI: procedure dropdown populates on load
- [ ] UI: payer dropdown enables only after procedure is selected
- [ ] UI: deductible remaining field hides when "Yes, fully met" is selected
- [ ] UI: results render with correct hospital names, prices, and ranking

---

## Key Data Facts

- Hospital price files are required by 45 CFR 180.50 (Hospital Price Transparency Rule, effective 2021)
- Files must include negotiated rates per payer per CPT code
- Payer names are unstandardized — normalization to UPPER is intentional
- Gross charge is the sticker price; negotiated rate is what the insurer actually pays; cash/discounted rate is for uninsured
- For high-deductible plans, patients pay the full negotiated rate until their deductible is met, then coinsurance kicks in
- Price variation for the same CPT code at hospitals in the same city routinely exceeds 5–10x — that's the demo
