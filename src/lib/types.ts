export type Category = "Identity" | "Employment" | "Finance" | "Insurance" | "Property" | "Medical";
export type MedType = "prescription" | "lab_report" | "discharge" | "bill" | "scan" | "other";

export interface Member {
  id: string;
  name: string;
  relation: string;
  color: string;
  dob?: string; // ISO date (yyyy-mm-dd) — added for Health
  bloodGroup?: string; // e.g. "B+" — added for Health
}

export interface Doc {
  id: string;
  name: string;
  category: Category;
  docType: string; // e.g. "Passport", "Payslip", "Prescription"
  medType?: MedType; // only for Medical
  source: "Upload" | "Gmail" | "Drive" | "DigiLocker";
  mime: string;
  sizeKB: number;
  addedAt: string; // ISO
  docDate?: string; // user-set date on the document (visit date / issue date)
  expiry?: string; // ISO
  memberId?: string; // who it belongs to
  fileKey: string; // IndexedDB blob key
  notes?: string;
}

// Reused for health readings. value2 carries the second number for paired metrics (e.g. BP diastolic).
export interface LabLog {
  id: string;
  memberId: string;
  metric: string;
  value: number;
  value2?: number;
  unit: string;
  date: string;
}

export interface Medication {
  id: string;
  memberId: string;
  name: string;
  dose: string;
  freq: string;
  refillBy: string;
}

export type ReminderKind = "appointment" | "refill" | "vaccination" | "insurance" | "other";
export interface Reminder {
  id: string;
  memberId: string;
  title: string;
  kind: ReminderKind;
  due: string;
  done: boolean;
}
