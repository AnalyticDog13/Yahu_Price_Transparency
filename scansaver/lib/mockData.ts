export type Procedure =
  | "MRI Knee"
  | "MRI Brain"
  | "CT Abdomen"
  | "CT Head"
  | "Ultrasound Abdomen"
  | "Ultrasound Pelvis";

export type Insurance =
  | "Aetna"
  | "Cigna"
  | "UnitedHealthcare"
  | "Blue Cross"
  | "Self-pay";

export interface Provider {
  id: string;
  name: string;
  address: string;
  distance: number; // miles
  procedure: Procedure;
  insurancePrice: Record<Insurance, number | null>;
  cashPrice: number;
  confidenceScore: number; // 0-100
  notes: string;
  phone: string;
  type: "Hospital" | "Imaging Center" | "Outpatient Clinic";
}

export const providers: Provider[] = [
  {
    id: "1",
    name: "Radiology Associates of Manhattan",
    address: "220 E 34th St, New York, NY",
    distance: 0.8,
    procedure: "MRI Knee",
    insurancePrice: {
      Aetna: 850,
      Cigna: 920,
      UnitedHealthcare: 780,
      "Blue Cross": 810,
      "Self-pay": 650,
    },
    cashPrice: 650,
    confidenceScore: 95,
    notes: "Same-day appointments available. Open weekends.",
    phone: "(212) 555-0101",
    type: "Imaging Center",
  },
  {
    id: "2",
    name: "NYU Langone Orthopedic Hospital",
    address: "301 E 17th St, New York, NY",
    distance: 1.4,
    procedure: "MRI Knee",
    insurancePrice: {
      Aetna: 2100,
      Cigna: 2350,
      UnitedHealthcare: 1980,
      "Blue Cross": 2050,
      "Self-pay": 1450,
    },
    cashPrice: 1450,
    confidenceScore: 88,
    notes: "Academic medical center. Specialist MRI team.",
    phone: "(212) 555-0202",
    type: "Hospital",
  },
  {
    id: "3",
    name: "CityMD Imaging – Midtown",
    address: "150 W 42nd St, New York, NY",
    distance: 1.1,
    procedure: "MRI Knee",
    insurancePrice: {
      Aetna: 790,
      Cigna: 840,
      UnitedHealthcare: 760,
      "Blue Cross": 775,
      "Self-pay": 590,
    },
    cashPrice: 590,
    confidenceScore: 91,
    notes: "Walk-ins welcome. Upfront pricing guarantee.",
    phone: "(212) 555-0303",
    type: "Outpatient Clinic",
  },
  {
    id: "4",
    name: "Lenox Hill Radiology",
    address: "61 E 77th St, New York, NY",
    distance: 3.2,
    procedure: "MRI Knee",
    insurancePrice: {
      Aetna: 950,
      Cigna: 1010,
      UnitedHealthcare: 890,
      "Blue Cross": 915,
      "Self-pay": 720,
    },
    cashPrice: 720,
    confidenceScore: 93,
    notes: "Board-certified radiologists. Results in 24 hrs.",
    phone: "(212) 555-0404",
    type: "Imaging Center",
  },
  {
    id: "5",
    name: "Mount Sinai West Radiology",
    address: "1000 10th Ave, New York, NY",
    distance: 2.6,
    procedure: "MRI Brain",
    insurancePrice: {
      Aetna: 1800,
      Cigna: 1950,
      UnitedHealthcare: 1700,
      "Blue Cross": 1750,
      "Self-pay": 1200,
    },
    cashPrice: 1200,
    confidenceScore: 87,
    notes: "No referral needed. Contrast and non-contrast available.",
    phone: "(212) 555-0505",
    type: "Hospital",
  },
  {
    id: "6",
    name: "ProScan Imaging – Chelsea",
    address: "270 W 25th St, New York, NY",
    distance: 1.9,
    procedure: "MRI Brain",
    insurancePrice: {
      Aetna: 980,
      Cigna: 1050,
      UnitedHealthcare: 920,
      "Blue Cross": 960,
      "Self-pay": 750,
    },
    cashPrice: 750,
    confidenceScore: 96,
    notes: "3T MRI scanner. Fast turnaround on reports.",
    phone: "(212) 555-0606",
    type: "Imaging Center",
  },
  {
    id: "7",
    name: "Weill Cornell Imaging",
    address: "520 E 70th St, New York, NY",
    distance: 4.1,
    procedure: "MRI Brain",
    insurancePrice: {
      Aetna: 2300,
      Cigna: 2500,
      UnitedHealthcare: 2150,
      "Blue Cross": 2200,
      "Self-pay": 1650,
    },
    cashPrice: 1650,
    confidenceScore: 82,
    notes: "Academic hospital. Advanced neuro imaging.",
    phone: "(212) 555-0707",
    type: "Hospital",
  },
  {
    id: "8",
    name: "Bright Health Imaging",
    address: "88 University Pl, New York, NY",
    distance: 0.5,
    procedure: "CT Abdomen",
    insurancePrice: {
      Aetna: 1200,
      Cigna: 1350,
      UnitedHealthcare: 1100,
      "Blue Cross": 1150,
      "Self-pay": 850,
    },
    cashPrice: 850,
    confidenceScore: 94,
    notes: "Low-dose CT protocol. Results same day.",
    phone: "(212) 555-0808",
    type: "Imaging Center",
  },
  {
    id: "9",
    name: "Bellevue Hospital Radiology",
    address: "462 1st Ave, New York, NY",
    distance: 2.3,
    procedure: "CT Abdomen",
    insurancePrice: {
      Aetna: 3200,
      Cigna: 3500,
      UnitedHealthcare: 2900,
      "Blue Cross": 3100,
      "Self-pay": 2000,
    },
    cashPrice: 2000,
    confidenceScore: 79,
    notes: "Level I trauma center. 24/7 availability.",
    phone: "(212) 555-0909",
    type: "Hospital",
  },
  {
    id: "10",
    name: "HealthFirst Scan Center",
    address: "33 Fulton St, New York, NY",
    distance: 3.8,
    procedure: "CT Abdomen",
    insurancePrice: {
      Aetna: 1050,
      Cigna: 1120,
      UnitedHealthcare: 990,
      "Blue Cross": 1010,
      "Self-pay": 780,
    },
    cashPrice: 780,
    confidenceScore: 90,
    notes: "Competitive cash pricing. Insurance billing support.",
    phone: "(212) 555-1010",
    type: "Outpatient Clinic",
  },
  {
    id: "11",
    name: "NewYork-Presbyterian Radiology",
    address: "525 E 68th St, New York, NY",
    distance: 3.5,
    procedure: "CT Head",
    insurancePrice: {
      Aetna: 1900,
      Cigna: 2100,
      UnitedHealthcare: 1800,
      "Blue Cross": 1850,
      "Self-pay": 1300,
    },
    cashPrice: 1300,
    confidenceScore: 85,
    notes: "Top-ranked radiology department. Neuro subspecialists.",
    phone: "(212) 555-1111",
    type: "Hospital",
  },
  {
    id: "12",
    name: "SoHo Radiology Group",
    address: "200 Lafayette St, New York, NY",
    distance: 2.0,
    procedure: "CT Head",
    insurancePrice: {
      Aetna: 820,
      Cigna: 900,
      UnitedHealthcare: 780,
      "Blue Cross": 800,
      "Self-pay": 620,
    },
    cashPrice: 620,
    confidenceScore: 92,
    notes: "Modern equipment. Evening hours available.",
    phone: "(212) 555-1212",
    type: "Imaging Center",
  },
  {
    id: "13",
    name: "Clarity Ultrasound – Flatiron",
    address: "19 W 24th St, New York, NY",
    distance: 1.6,
    procedure: "Ultrasound Abdomen",
    insurancePrice: {
      Aetna: 380,
      Cigna: 420,
      UnitedHealthcare: 350,
      "Blue Cross": 365,
      "Self-pay": 250,
    },
    cashPrice: 250,
    confidenceScore: 97,
    notes: "Specialist sonographers. Report within 2 hours.",
    phone: "(212) 555-1313",
    type: "Imaging Center",
  },
  {
    id: "14",
    name: "Columbia University Medical Center",
    address: "622 W 168th St, New York, NY",
    distance: 7.2,
    procedure: "Ultrasound Abdomen",
    insurancePrice: {
      Aetna: 1100,
      Cigna: 1200,
      UnitedHealthcare: 1050,
      "Blue Cross": 1075,
      "Self-pay": 750,
    },
    cashPrice: 750,
    confidenceScore: 80,
    notes: "Teaching hospital. Research-grade equipment.",
    phone: "(212) 555-1414",
    type: "Hospital",
  },
  {
    id: "15",
    name: "QuickScan Imaging – UES",
    address: "1407 Lexington Ave, New York, NY",
    distance: 4.4,
    procedure: "Ultrasound Pelvis",
    insurancePrice: {
      Aetna: 420,
      Cigna: 460,
      UnitedHealthcare: 395,
      "Blue Cross": 410,
      "Self-pay": 299,
    },
    cashPrice: 299,
    confidenceScore: 89,
    notes: "Online scheduling. Translabdominal and transvaginal.",
    phone: "(212) 555-1515",
    type: "Imaging Center",
  },
  {
    id: "16",
    name: "NYU Langone Women's Imaging",
    address: "240 E 38th St, New York, NY",
    distance: 1.3,
    procedure: "Ultrasound Pelvis",
    insurancePrice: {
      Aetna: 890,
      Cigna: 970,
      UnitedHealthcare: 840,
      "Blue Cross": 860,
      "Self-pay": 620,
    },
    cashPrice: 620,
    confidenceScore: 91,
    notes: "Women's health specialists. Private suites.",
    phone: "(212) 555-1616",
    type: "Hospital",
  },
];

export const procedures: Procedure[] = [
  "MRI Knee",
  "MRI Brain",
  "CT Abdomen",
  "CT Head",
  "Ultrasound Abdomen",
  "Ultrasound Pelvis",
];

export const insurances: Insurance[] = [
  "Aetna",
  "Cigna",
  "UnitedHealthcare",
  "Blue Cross",
  "Self-pay",
];

export function getResults(
  procedure: string,
  insurance: Insurance
): Provider[] {
  return providers.filter(
    (p) => p.procedure.toLowerCase() === procedure.toLowerCase()
  );
}
