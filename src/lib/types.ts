export type Category = "Identity" | "Employment" | "Finance" | "Insurance" | "Property" | "Medical";
export type MedType = "prescription" | "lab_report" | "discharge" | "bill" | "scan" | "other";
export type Access = "Owner" | "Full member" | "Emergency access" | "View only";

export interface Member {
  id: string;
  name: string;
  relation: string;
  color: string;
  dob?: string;
  bloodGroup?: string;
  access?: Access;
}
export interface Doc {
  id: string;
  name: string;
  category: Category;
  docType: string;
  medType?: MedType;
  source: "Upload" | "Email" | "Drive" | "DigiLocker";
  mime: string;
  sizeKB: number;
  addedAt: string;
  docDate?: string;
  expiry?: string;
  memberId?: string;
  fileKey: string;
  notes?: string;
  value?: number; // for Wealth (documented asset value)
  nominee?: boolean; // for Wealth (nominee designated?)
}
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
  remaining?: number;
  taken?: string[];
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
