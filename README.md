# ClearCare — Hospital Price Transparency Platform
### GoodRx, but for hospitals

---

## The Problem

The price of an MRI should not depend on which hospital you walk into. Yet across hospitals in the same city, the exact same MRI scan can cost anywhere from $400 to $4,000 — not because the machine is different, or the radiologist is better, but because pricing is completely opaque and patients have no way to compare. Unlike buying a flight or a car, patients show up to a hospital with no idea what they'll pay, and by the time the bill arrives it's too late to shop around.

This hits hardest for the uninsured, underinsured, and anyone with a high-deductible plan who is effectively paying out of pocket until they hit their deductible — which is most people for routine diagnostic procedures.

---

## The Solution

**ClearCare** aggregates publicly available hospital pricing data and pairs it with a user's specific insurance information to show exactly what they would pay — before they walk in the door.

A user enters:
- Their procedure (MRI, CT scan, ultrasound, blood panel, etc.)
- Their insurance provider and plan
- Whether they've hit their deductible and their coinsurance rate

ClearCare returns a ranked list of nearby hospitals showing their estimated out-of-pocket cost at each one. Same care, lowest price, no surprises.

---

## Why This Is Possible Now

Since 2021, the **Hospital Price Transparency Rule** requires every US hospital to publicly publish their negotiated rates with insurers — including what each insurer actually pays for each procedure. This data exists. The problem is it's buried in machine-unreadable spreadsheets, inconsistently formatted, and completely inaccessible to a normal person trying to make a decision.

We clean it, structure it, and make it useful.

---

## Repository Structure

```
Yahu_Price_Transparency/
├── README.md
├── .gitignore
├── hospital-price-data/          # Raw CSVs from hospital price transparency files
│   │                             # (gitignored — too large to commit, up to 1.3 GB each)
│   ├── 510064326_St.-Francis-Hospital-Inc_standardcharges.csv
│   └── 23-1529076_riddle-memorial-hospital_standardcharges.csv
│
└── clearcare/                    # Application code
    ├── parse_prices.py           # Data pipeline: raw CSVs → SQLite database
    ├── app.py                    # Flask web server + API
    ├── templates/
    │   └── index.html            # Single-page frontend UI
    └── static/
        └── data/
            └── prices.db         # Generated SQLite database (gitignored)
```

---

## How to Run

**1. Add hospital CSV files**

Download hospital price transparency files and place them in `hospital-price-data/`. Then register each one in the `hospital_files` dict at the bottom of `parse_prices.py`.

**2. Build the database**

```bash
cd clearcare
python3 parse_prices.py
```

This reads all registered hospital CSVs, extracts imaging/diagnostic procedures, and writes `clearcare/static/data/prices.db`. Takes ~15 seconds per hospital file.

**3. Start the web server**

```bash
python3 app.py
```

Open `http://localhost:5001` in your browser.

---

## Data Pipeline (`parse_prices.py`)

Reads raw hospital price transparency CSVs (CMS standard format, schema v3.x) and produces a normalized SQLite database. For each hospital file it:

1. Skips the two-row hospital metadata header
2. Scans all rows for matching CPT/HCPCS codes from the target procedure list
3. Normalizes payer names to uppercase for consistent cross-hospital matching
4. Writes all matched rows to `prices.db`

**Supported source format:** CMS v3.x long-format CSV (one row per payer per procedure). This covers the majority of hospitals. Wide-format and JSON files require a separate parser.

**Procedures extracted (by CPT code):**

| Category | CPT Codes |
|---|---|
| MRI Brain | 70551, 70552, 70553 |
| MRI Spine (Cervical) | 72141, 72142, 72156 |
| MRI Spine (Thoracic) | 72146, 72147, 72157 |
| MRI Spine (Lumbar) | 72148, 72149, 72158 |
| MRI Knee / Joint | 73721, 73722, 73723 |
| MRI Abdomen | 74181, 74182, 74183 |
| CT Head / Brain | 70450, 70460, 70470 |
| CT Chest | 71250, 71260, 71270 |
| CT Abdomen & Pelvis | 74176, 74177, 74178 |
| Ultrasound Abdomen | 76700, 76705 |
| Ultrasound Pelvis | 76856, 76857 |
| Chest X-Ray | 71045, 71046 |
| CBC Blood Panel | 85025, 85027 |

---

## Database Schema (`prices.db`)

The pipeline produces a single SQLite file with one primary table. This is the contract between the data pipeline and the website — the website only needs to know this schema.

### `prices` table

One row = one price for one procedure at one hospital under one insurance plan.

| Column | Type | Description |
|---|---|---|
| `hospital_name` | TEXT | Display name, e.g. `"St. Francis Hospital"` |
| `hospital_city` | TEXT | e.g. `"Wilmington"` |
| `hospital_state` | TEXT | e.g. `"DE"` |
| `hospital_address` | TEXT | Street address |
| `procedure_category` | TEXT | Canonical group shown in UI dropdown, e.g. `"MRI Brain"` |
| `procedure_name` | TEXT | Specific variant, e.g. `"MRI Brain (w/o contrast)"` |
| `cpt_code` | TEXT | Standard CPT/HCPCS code, e.g. `"70551"` |
| `payer` | TEXT | Insurance company, always uppercase, e.g. `"AETNA"` |
| `plan` | TEXT | Specific plan within payer, e.g. `"AETNA HMO"` — may be blank |
| `negotiated_dollar` | REAL | **Key field.** The rate the insurer has contracted with the hospital. This is what the insurer + patient together owe. |
| `discounted_cash` | REAL | Self-pay / uninsured price |
| `gross_charge` | REAL | Hospital sticker price (rarely what anyone pays) |
| `setting` | TEXT | `"outpatient"`, `"inpatient"`, or `"both"` |
| `billing_class` | TEXT | `"facility"` or `"professional"` |

### `procedure_categories` table

Maps UI dropdown categories to their constituent CPT codes.

| Column | Type | Description |
|---|---|---|
| `category` | TEXT | e.g. `"MRI Brain"` |
| `cpt_code` | TEXT | e.g. `"70551"` |

### Example queries

```sql
-- All insurers that have data for MRI Brain at any hospital
SELECT DISTINCT payer FROM prices WHERE procedure_category = 'MRI Brain' ORDER BY payer;

-- Cheapest hospital for MRI Brain under AETNA
SELECT hospital_name, negotiated_dollar, discounted_cash
FROM prices
WHERE procedure_category = 'MRI Brain' AND payer = 'AETNA'
ORDER BY negotiated_dollar ASC;

-- All procedures available at a specific hospital
SELECT DISTINCT procedure_category FROM prices WHERE hospital_name = 'St. Francis Hospital';
```

---

## Out-of-Pocket Estimation Logic

The website computes estimated patient cost from `negotiated_dollar` plus user-supplied insurance details:

```
# Deductible fully met:
patient_owes = negotiated_dollar × coinsurance_pct

# Deductible not yet met:
patient_owes = min(deductible_remaining, negotiated_dollar)
             + max(0, negotiated_dollar - deductible_remaining) × coinsurance_pct
```

Where `coinsurance_pct` is the patient's share after deductible (default 20% = 0.20).

The three prices shown per hospital on the results page:
- **Your estimated cost** — computed above
- **Negotiated rate** — `negotiated_dollar` (what insurer + patient pay together)
- **Self-pay price** — `discounted_cash` (shown as the uninsured option)

---

## Web App (`app.py`)

Flask server with four API endpoints:

| Endpoint | Description |
|---|---|
| `GET /` | Serves the main UI |
| `GET /api/procedures` | Returns all procedure categories and their CPT codes |
| `GET /api/payers?codes=70551,70552` | Returns all payers with data for given CPT codes |
| `GET /api/prices?codes=...&payer=...&deductible_met=...&deductible_remaining=...&coinsurance=...` | Returns ranked hospital results with estimated out-of-pocket |

---

## Adding a New Hospital

1. Download the hospital's price transparency CSV
2. Place it in `hospital-price-data/`
3. Add an entry to the `hospital_files` dict in `parse_prices.py`:
   ```python
   "Hospital Display Name (City, ST)": "filename_standardcharges.csv",
   ```
4. Re-run `python3 parse_prices.py` — the DB is fully rebuilt each run

> **Note:** The parser handles CMS v3.x long-format CSVs. If a hospital publishes a wide-format file (payers as columns) or a JSON file, a separate parser function will need to be added.

---

## Scope (Pilot)

| | Detail |
|---|---|
| Hospitals | 5–10, manually onboarded |
| Procedures | 13 categories covering MRI, CT, ultrasound, X-ray, CBC |
| Insurers | All payers published in the hospital files (~100+ per hospital) |
| Format | CMS v3.x long-format CSV |

---

## Social Impact

- **High-deductible plan holders** — the fastest growing insurance segment, who pay out of pocket for most routine care
- **Uninsured patients** — who can see the cash-pay rate and use it as a negotiation baseline
- **Low-income patients** — for whom a $400 vs $2,000 MRI is the difference between getting care and avoiding it

Healthcare price opacity is a regressive tax — it falls hardest on people with the least information and the least bargaining power. ClearCare closes that information gap.

---

## One-Line Pitch

> *"We built GoodRx for hospitals — using publicly available pricing data to show patients their true out-of-pocket cost at every hospital in their area, before they walk in the door."*

---

*Built for Cornell Claude Hackathon · Team Yahu · April 2026*
