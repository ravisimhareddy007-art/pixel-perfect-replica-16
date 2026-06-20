import type { Category, MedType } from "./types";

// Deterministic, rule-based classification from filename + mime.
// No AI guessing of *content*; we only map obvious keywords. User can re-tag anything.
const RULES: { kw: string[]; category: Category; docType: string; medType?: MedType }[] = [
  { kw: ["passport"], category: "Identity", docType: "Passport" },
  { kw: ["aadhaar","aadhar","uidai"], category: "Identity", docType: "Aadhaar" },
  { kw: ["pan"], category: "Identity", docType: "PAN" },
  { kw: ["licence","license","dl"], category: "Identity", docType: "Driving Licence" },
  { kw: ["voter"], category: "Identity", docType: "Voter ID" },
  { kw: ["offer"], category: "Employment", docType: "Offer Letter" },
  { kw: ["relieving","relieve"], category: "Employment", docType: "Relieving Letter" },
  { kw: ["experience","exp letter"], category: "Employment", docType: "Experience Letter" },
  { kw: ["payslip","salary slip","payslp"], category: "Employment", docType: "Payslip" },
  { kw: ["form16","form 16","form-16"], category: "Finance", docType: "Form 16" },
  { kw: ["bank","statement","passbook"], category: "Finance", docType: "Bank Statement" },
  { kw: ["itr","tax return"], category: "Finance", docType: "ITR" },
  { kw: ["mutual","mf","folio","demat"], category: "Finance", docType: "Investment Statement" },
  { kw: ["health insurance","mediclaim","star health"], category: "Insurance", docType: "Health Insurance", },
  { kw: ["vehicle insurance","motor insurance","car insurance"], category: "Insurance", docType: "Vehicle Insurance" },
  { kw: ["life insurance","lic","term plan"], category: "Insurance", docType: "Life Insurance" },
  { kw: ["insurance","policy"], category: "Insurance", docType: "Insurance Policy" },
  { kw: ["sale deed","deed","registry"], category: "Property", docType: "Sale Deed" },
  { kw: ["property tax","khata"], category: "Property", docType: "Property Tax Receipt" },
  { kw: ["rent","lease","rental"], category: "Property", docType: "Rental Agreement" },
  { kw: ["prescription","rx","medicine"], category: "Medical", docType: "Prescription", medType: "prescription" },
  { kw: ["lab","report","blood","hba1c","lipid","cbc","test"], category: "Medical", docType: "Lab Report", medType: "lab_report" },
  { kw: ["discharge","summary"], category: "Medical", docType: "Discharge Summary", medType: "discharge" },
  { kw: ["hospital bill","medical bill"], category: "Medical", docType: "Medical Bill", medType: "bill" },
  { kw: ["scan","xray","x-ray","mri","ct ","ultrasound"], category: "Medical", docType: "Scan / Imaging", medType: "scan" },
];

export function classify(filename: string): { category: Category; docType: string; medType?: MedType; confident: boolean } {
  const f = filename.toLowerCase();
  for (const r of RULES) if (r.kw.some((k) => f.includes(k)))
    return { category: r.category, docType: r.docType, medType: r.medType, confident: true };
  return { category: "Identity", docType: "Unsorted", confident: false };
}

export const CATEGORIES: Category[] = ["Identity","Employment","Finance","Insurance","Property","Medical"];
