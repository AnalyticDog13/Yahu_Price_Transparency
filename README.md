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
- Their location
- Their insurance provider, plan, and whether they've hit their deductible

ClearCare returns a ranked list of nearby hospitals showing their estimated out-of-pocket cost at each one, based on what people with the same insurance actually paid. Same care, lowest price, no surprises.

---

## Why This Is Possible Now

Since 2021, the **Hospital Price Transparency Rule** requires every US hospital to publicly publish their negotiated rates with insurers — including what each insurer actually pays for each procedure. This data exists. The problem is it's buried in machine-unreadable spreadsheets, inconsistently formatted, and completely inaccessible to a normal person trying to make a decision.

We clean it, structure it, and make it useful.

---

## Why Simple Procedures First

We focus on **standardized diagnostic procedures** — MRIs, CT scans, ultrasounds, X-rays, and common lab tests — for three reasons:

1. **They are commodity services.** An MRI is an MRI. Unlike surgery, quality does not meaningfully vary between facilities for diagnostic imaging. Price is the only differentiating factor.
2. **They are elective and plannable.** Patients have time to shop around before booking a scan. This is not an emergency room situation.
3. **The price variation is enormous and unjustifiable.** A chest CT scan in New York City ranges from $500 to $8,000 across hospitals in the same borough. That spread exists purely because of opacity, not quality.

---

## How It Works

```
1. Data collection
   └── Pull publicly mandated hospital price files
       └── Clean, normalize, and structure by procedure + insurer

2. User input
   └── Procedure type → Location → Insurance provider + plan → Deductible status

3. Price estimation
   └── Match user's insurer to published negotiated rates at nearby hospitals
       └── Apply deductible logic (have they hit it? coinsurance rate?)
           └── Output: estimated true out-of-pocket cost per hospital

4. Ranked results
   └── Cheapest to most expensive, same region, same procedure, same insurance
```

---

## Scope for This Competition

We are building this small-scale to prove feasibility:

| Scope | Detail |
|-------|--------|
| Region | One metro area (e.g. New York City or Houston) |
| Hospitals | 10–15 hospitals with published price files |
| Procedures | 5 standardized procedures (MRI, CT scan, ultrasound, X-ray, CBC blood panel) |
| Insurers | 3–4 major insurers (Aetna, UnitedHealth, BCBS, Cigna) |

This is enough to demonstrate real price variation, real out-of-pocket estimation, and a working end-to-end product. The data pipeline scales directly to any metro area in the US without any structural changes.

---

## Social Impact

This directly benefits:
- **High-deductible plan holders** — the fastest growing insurance segment, who pay out of pocket for most routine care
- **Uninsured patients** — who can see the cash-pay rate and use it as a negotiation baseline
- **Low-income patients** — for whom a $400 vs $2,000 MRI is the difference between getting care and avoiding it

Healthcare price opacity is a regressive tax — it falls hardest on people with the least information and the least bargaining power. ClearCare closes that information gap.

---

## Differentiation from GoodRx

| | GoodRx | ClearCare |
|--|--------|-----------|
| Focus | Pharmaceuticals | Hospital procedures |
| Data source | Pharmacy PBM data | Public hospital price files |
| Insurance-aware | Partially | Fully — estimates true out-of-pocket |
| Procedure types | Drugs | Imaging, diagnostics |
| Market | Saturated | Wide open |

GoodRx proved the model works and commands a $4B+ valuation doing it for drugs. Hospital procedures are a larger, less addressed market with the same core problem.

---

## Build Plan

```
Day 1 — Morning
└── Pull and clean price transparency files for target hospitals
└── Build normalization pipeline (procedure codes → readable names)

Day 1 — Midday
└── Build insurance + deductible logic layer
└── Match user insurer to published negotiated rates

Day 1 — Afternoon
└── Build search UI (procedure + location + insurance inputs)
└── Ranked results output with price estimates

Day 1 — Evening
└── Polish demo with real price data showing variation
└── Prepare pitch narrative
```

---

## One-Line Pitch

> *"We built GoodRx for hospitals — using publicly available pricing data to show patients their true out-of-pocket cost at every hospital in their area, before they walk in the door."*

---

*Built for Cornell Claude Hackathon · Team Yahu · April 2026*
