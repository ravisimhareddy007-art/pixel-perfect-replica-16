export type Category = "Identity" | "Employment" | "Finance" | "Insurance" | "Property" | "Medical";
export type MedType = "prescription" | "lab_report" | "discharge" | "bill" | "scan" | "other";

export interface Member { id: string; name: string; relation: string; color: string; }

export interface Doc {
  id: string;
  name: string;
  category: Category;
  docType: string;          // e.g. "Passport", "Payslip", "Prescription"
  medType?: MedType;        // only for Medical
  source: "Upload" | "Gmail" | "Drive" | "DigiLocker";
  mime: string;
  sizeKB: number;
  addedAt: string;          // ISO
  docDate?: string;         // user-set date on the document (visit date / issue date)
  expiry?: string;          // ISO
  memberId?: string;        // who it belongs to
  fileKey: string;          // IndexedDB blob key
  notes?: string;
}

export interface LabLog { id: string; memberId: string; metric: string; value: number; unit: string; date: string; }
