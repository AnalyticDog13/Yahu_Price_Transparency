# ClearCare — Hospital Price Transparency Platform
### GoodRx, but for hospitals

> *"We built GoodRx for hospitals — using publicly available pricing data to show patients their true out-of-pocket cost at every hospital in their area, before they walk in the door."*

---

## The Problem

The price of an MRI should not depend on which hospital you walk into. Yet across hospitals in the same city, the exact same MRI scan can cost anywhere from $400 to $4,000 — not because the machine is different, or the radiologist is better, but because pricing is completely opaque and patients have no way to compare. Unlike buying a flight or a car, patients show up to a hospital with no idea what they'll pay, and by the time the bill arrives it's too late to shop around.

This hits hardest for the uninsured, underinsured, and anyone with a high-deductible plan who is effectively paying out of pocket until they hit their deductible — which is most people for routine diagnostic procedures.

---

## The Solution

**ClearCare** aggregates publicly available hospital pricing data and pairs it with a user's specific insurance information to show exactly what they would pay — before they walk in the door.

A user enters their procedure, insurance provider, and deductible status. ClearCare returns a ranked list of nearby hospitals showing their estimated out-of-pocket cost at each one. Same care, lowest price, no surprises.

---

## Repository Structure

```
Yahu_Price_Transparency/
│
├── README.md
├── .gitignore
│
├── hospital-price-data/                ← raw CSVs (gitignored — up to 1.3 GB each)
│   ├── 510064326_St.-Francis-Hospital-Inc_standardcharges.csv
│   ├── 23-1529076_riddle-memorial-hospital_standardcharges.csv
│   └── 232829095_jefferson-methodist-hospital_standardcharges.csv
│
└── clearcare/
    │
    ├── backend/                        ← Pete's domain (data pipeline + API)
    │   ├── parse_prices.py             full rebuild: all hospital CSVs → prices.csv + prices.db
    │   ├── add_hospital.py             incremental: add one hospital to prices.csv
    │   ├── app.py                      Flask API server (run this to start the backend)
    │   └── data/
    │       ├── prices.csv              ✅ committed — the standardized data handoff file
    │       └── prices.db               gitignored — auto-built from prices.csv on app start
    │
    └── frontend/                       ← Will's domain (website UI)
        ├── index.html                  current working UI (starting reference)
        └── static/                     CSS, JS, images (Will builds this out)
```

---

## Current Data Coverage

All hospitals are in the **Philadelphia metro area (PA)**.

| Hospital | City | State | Rows in prices.csv |
|---|---|---|---|
| Riddle Memorial Hospital | Media | PA | 668 |
| Jefferson Methodist Hospital | Philadelphia | PA | 16,038 |
| Bryn Mawr Hospital | Bryn Mawr | PA | 668 |
| Paoli Hospital | Paoli | PA | 668 |
| Mercy Fitzgerald Hospital | Darby | PA | 6,947 |
| Temple University Hospital | Philadelphia | PA | 1,769 |
| Hospital of the University of Pennsylvania | Philadelphia | PA | 5,450 |

**Total: 32,208 rows** across 13 procedure categories and ~100+ insurance payers per hospital.

---

## To-Do List

### Frontend (Will)

- [ ] **Build the full website** — replace `index.html` placeholder with a production-quality UI
- [ ] **Insurance search/autocomplete** — the payer dropdown currently has 100+ options; needs a searchable typeahead input
- [ ] **Procedure search** — let users type "knee MRI" instead of navigating a dropdown
- [ ] **Results map view** — show hospital locations on a map alongside the ranked list
- [ ] **Mobile-responsive design** — most users will be on their phones in a doctor's office
- [ ] **"No results" handling** — clear messaging when a payer has no data for a procedure at any hospital
- [ ] **Save / share results** — allow users to bookmark or share their price comparison
- [ ] **Cash-pay highlight** — make the uninsured self-pay price prominent for patients without coverage

---

## Post-Pilot: Scaling to Other Regions and Nationwide

The Philadelphia pilot proves feasibility. Scaling to more regions and eventually nationwide is straightforward because the data pipeline is already generalized — adding a new metro area is just downloading files and running `add_hospital.py`.

### Phase 2 — Expand to Additional Metro Areas

Each metro area follows the same playbook: identify 5–10 hospitals, download their CMS-mandated price files, run `add_hospital.py` for each. Suggested next regions:

| Metro Area | Why |
|---|---|
| New York City | Largest market, extreme price variation documented across boroughs |
| Houston | Large uninsured population, high concentration of major health systems |
| Chicago | Strong BCBS/Aetna/UHC market share, good for insurer comparison data |
| Los Angeles | Large Medicaid population, multiple competing health systems |
| Boston | High-cost market, academic medical centers vs community hospitals |

**Estimated effort per new metro:** 2–4 hours to download files and run the parser. No code changes required unless a hospital uses an unsupported file format.

### Phase 3 — Nationwide Coverage

To scale to all ~6,000 US hospitals:

- **Automate file discovery** — CMS publishes a machine-readable index of all hospital price transparency files at `https://www.cms.gov/hospital-price-transparency`. Build a scraper that pulls the file list, downloads new/updated files, and queues them for parsing.
- **Scheduled rebuilds** — hospitals update their price files periodically (usually annually). Set up a cron job to re-download and re-parse on a schedule, keeping `prices.csv` current.
- **Format coverage** — the current parser handles long-format CSV (majority), wide-format CSV (e.g. HUP), and XLSX. A JSON parser would cover the remaining ~15% of hospitals.
- **Cloud storage** — at 6,000 hospitals, `prices.csv` grows to ~500 MB. Move to a hosted database (PostgreSQL on Supabase or similar) rather than a committed CSV file.
- **API performance** — replace the SQLite query layer in `app.py` with indexed queries against the hosted DB. Add caching for common procedure+payer combinations.
- **Geographic filtering** — add `hospital_lat` / `hospital_lon` to the hospital registry and expose a `/api/prices?near=lat,lon&radius=25mi` parameter so the website can show only nearby hospitals.

---

## How to Run

**Prerequisites:** Python 3.10+

```bash
pip install -r requirements.txt
```

`requirements.txt` installs: `flask` (web server) and `openpyxl` (XLSX parsing).

**1. Build the database** (Pete's step — requires raw CSVs in `hospital-price-data/`)

```bash
cd clearcare/backend
python3 parse_prices.py
```

Scans all registered hospital CSVs, extracts imaging/diagnostic procedures by CPT code, and writes `prices.csv` + `prices.db`. Takes ~15 seconds per hospital.

**2. Start the API server**

```bash
cd clearcare/backend
python3 app.py
```

Open `http://localhost:5001`. If `prices.db` is missing, it auto-builds from `prices.csv`.

**Adding a new hospital (incremental — no full rebuild needed):**

```bash
cd clearcare/backend
python3 add_hospital.py \
  --file   "filename_standardcharges.csv" \
  --name   "Hospital Display Name" \
  --city   "City" \
  --state  "PA" \
  --address "123 Main St"
```

Safe to re-run — replaces existing rows for that hospital rather than duplicating.

---

## Data Schema (`prices.csv`)

This is the contract between the backend and the frontend. One row = one price for one procedure at one hospital under one insurance plan.

| Column | Type | Example | Description |
|---|---|---|---|
| `hospital_name` | text | `"St. Francis Hospital"` | Display name |
| `hospital_city` | text | `"Wilmington"` | |
| `hospital_state` | text | `"DE"` | |
| `hospital_address` | text | `"701 N. Clayton St"` | |
| `procedure_category` | text | `"MRI Brain"` | UI dropdown group |
| `procedure_name` | text | `"MRI Brain (w/o contrast)"` | Specific variant |
| `cpt_code` | text | `"70551"` | CPT/HCPCS billing code |
| `payer` | text | `"AETNA"` | Insurance company (always uppercase) |
| `plan` | text | `"AETNA HMO"` | Specific plan — may be blank |
| `negotiated_dollar` | number | `1876.00` | **Key field.** Contracted rate (insurer + patient owe this together) |
| `discounted_cash` | number | `1535.30` | Self-pay / uninsured price |
| `gross_charge` | number | `2362.00` | Sticker price (rarely what anyone pays) |
| `setting` | text | `"outpatient"` | `outpatient`, `inpatient`, or `both` |
| `billing_class` | text | `"facility"` | `facility` or `professional` |

### Procedures covered (35 CPT codes across 13 categories)

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

## Out-of-Pocket Estimation Logic

The API computes estimated patient cost from `negotiated_dollar` plus user-supplied insurance inputs:

```
# Deductible fully met:
patient_owes = negotiated_dollar × coinsurance_pct

# Deductible not yet met:
patient_owes = min(deductible_remaining, negotiated_dollar)
             + max(0, negotiated_dollar - deductible_remaining) × coinsurance_pct
```

`coinsurance_pct` is the patient's share after deductible (e.g. 20% = 0.20).

---

## API Endpoints

The Flask backend (`clearcare/backend/app.py`) exposes four endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Serves the frontend UI |
| GET | `/api/procedures` | Returns all procedure categories and their CPT codes |
| GET | `/api/payers?codes=70551,70552` | Returns all payers with data for the given CPT codes |
| GET | `/api/prices?codes=...&payer=...&deductible_met=...&deductible_remaining=...&coinsurance=...` | Ranked results with estimated out-of-pocket per hospital |
| GET | `/api/hospitals` | Returns all hospitals in the database |

### Example API call

```
GET /api/prices?codes=70551,70552,70553&payer=AETNA&deductible_met=no&deductible_remaining=1500&coinsurance=20
```

Returns hospitals sorted by estimated out-of-pocket, cheapest first.

---

## Why This Is Possible

Since 2021, the **Hospital Price Transparency Rule (45 CFR 180.50)** requires every US hospital to publicly publish their negotiated rates with each insurer for every procedure. This data exists — it's just buried in multi-million-row spreadsheets with inconsistent formatting that no patient can use. ClearCare cleans it, normalizes it, and makes it queryable.

---

## Social Impact

- **High-deductible plan holders** — the fastest-growing insurance segment; they pay out of pocket for most routine care until their deductible is met
- **Uninsured patients** — can see the cash-pay rate and use it as a negotiation baseline
- **Low-income patients** — for whom a $400 vs $2,000 MRI is the difference between getting care and avoiding it

Healthcare price opacity is a regressive tax. ClearCare closes the information gap.

---

*Built for Cornell Claude Hackathon · Team Yahu · April 2026*
