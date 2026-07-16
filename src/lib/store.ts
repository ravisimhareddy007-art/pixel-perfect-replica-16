import { useEffect, useState, useCallback } from "react";
import type { Doc, Member, LabLog, Medication, Reminder, Category } from "./types";
import { putBlob, delBlob } from "./idb";
import { classify } from "./classify";

const LS = "lifepack.v2";
const rel = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const iso = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
const id = () => Math.random().toString(36).slice(2, 9);

export interface CareProfile {
  conditions: string[];
  medications: string[];
  allergies: string;
  doctor?: string;
  emergency?: string;
}
interface State {
  onboarded: boolean;
  members: Member[];
  docs: Doc[];
  labs: LabLog[];
  care: Record<string, CareProfile>;
  meds: Medication[];
  reminders: Reminder[];
}

/* ── members (enterprise-neutral) ── */
const seedMembers: Member[] = [
  {
    id: "you",
    name: "Alex Morgan",
    relation: "Self",
    color: "#5B8DEF",
    dob: "1985-06-14",
    bloodGroup: "O+",
    access: "Owner",
  },
  {
    id: "spouse",
    name: "Jordan Morgan",
    relation: "Spouse",
    color: "#9B7BE8",
    dob: "1987-02-09",
    bloodGroup: "A+",
    access: "Full member",
  },
  {
    id: "father",
    name: "Richard Morgan",
    relation: "Father",
    color: "#4FCB95",
    dob: "1954-05-12",
    bloodGroup: "B+",
    access: "Emergency access",
  },
  {
    id: "mother",
    name: "Diane Morgan",
    relation: "Mother",
    color: "#E86A9B",
    dob: "1957-09-02",
    bloodGroup: "O+",
    access: "Emergency access",
  },
  {
    id: "son",
    name: "Ethan Morgan",
    relation: "Son",
    color: "#D9B86A",
    dob: "2015-11-05",
    bloodGroup: "O+",
    access: "View only",
  },
];

/* ── documents (single source for Documents, Packages, Wealth, Health records) ── */
const doc = (name: string, category: Category, docType: string, x: Partial<Doc> = {}): Doc => ({
  id: id(),
  name: name + ".pdf",
  category,
  docType,
  source: "Drive",
  mime: "application/pdf",
  sizeKB: 180,
  addedAt: iso(-30),
  fileKey: "seed",
  memberId: "you",
  ...x,
});
const seedDocs: Doc[] = [
  doc("Passport_AlexMorgan", "Identity", "Passport", { source: "DigiLocker", expiry: rel(264) }),
  doc("National_ID", "Identity", "National ID", { source: "DigiLocker" }),
  doc("Tax_ID", "Identity", "Tax ID", { source: "DigiLocker" }),
  doc("Drivers_License", "Identity", "Driver's License", { source: "DigiLocker", expiry: rel(147) }),
  doc("Employment_Offer", "Employment", "Employment Offer", { source: "Email" }),
  doc("Payslip_current", "Employment", "Payslip", { source: "Email", docDate: iso(-20) }),
  doc("Tax_Return_2025", "Finance", "Tax Return", { source: "Drive" }),
  doc("Bank_Statement_Q1", "Finance", "Bank Statement", { source: "Email" }),
  doc("Investment_Statement", "Finance", "Investment Statement", { source: "Drive", value: 4200000, nominee: true }),
  doc("Health_Insurance", "Insurance", "Health Insurance", { source: "Email", expiry: rel(230), nominee: true }),
  doc("Life_Insurance", "Insurance", "Life Insurance", { source: "Drive", value: 10000000, nominee: false }),
  doc("Auto_Insurance", "Insurance", "Auto Insurance", { source: "Email", expiry: rel(40) }),
  doc("Property_Deed", "Property", "Property Deed", { source: "Drive", value: 18500000, nominee: true }),
  doc("Property_Tax", "Property", "Property Tax", { source: "Upload" }),
  doc("Prescription_Cardio", "Medical", "Prescription", {
    source: "Upload",
    memberId: "father",
    medType: "prescription",
    docDate: iso(-8),
  }),
  doc("LabReport_HbA1c", "Medical", "Lab Report", {
    source: "Upload",
    memberId: "father",
    medType: "lab_report",
    docDate: iso(-8),
  }),
  doc("Prescription_Thyroid", "Medical", "Prescription", {
    source: "Upload",
    memberId: "mother",
    medType: "prescription",
    docDate: iso(-30),
  }),
  doc("LabReport_TSH", "Medical", "Lab Report", {
    source: "Upload",
    memberId: "mother",
    medType: "lab_report",
    docDate: iso(-30),
  }),
];

/* ── health readings ── */
const L = (memberId: string, metric: string, value: number, unit: string, date: string, value2?: number): LabLog => ({
  id: id(),
  memberId,
  metric,
  value,
  value2,
  unit,
  date,
});
const seedLabs: LabLog[] = [
  L("you", "LDL", 118, "mg/dL", "2026-05-02"),
  L("you", "Blood Pressure", 122, "mmHg", "2026-05-02", 80),
  L("you", "HbA1c", 5.5, "%", "2026-05-02"),
  L("spouse", "Blood Pressure", 118, "mmHg", "2026-04-18", 76),
  L("father", "HbA1c", 6.6, "%", "2026-01-08"),
  L("father", "HbA1c", 6.9, "%", "2026-03-12"),
  L("father", "HbA1c", 7.2, "%", "2026-06-10"),
  L("father", "LDL", 132, "mg/dL", "2026-01-08"),
  L("father", "LDL", 124, "mg/dL", "2026-05-02"),
  L("father", "LDL", 119, "mg/dL", "2026-06-10"),
  L("father", "Blood Pressure", 138, "mmHg", "2026-01-08", 86),
  L("father", "Blood Pressure", 132, "mmHg", "2026-03-12", 84),
  L("father", "Blood Pressure", 124, "mmHg", "2026-06-10", 82),
  L("mother", "TSH", 6.2, "mIU/L", "2026-01-15"),
  L("mother", "TSH", 4.8, "mIU/L", "2026-03-20"),
  L("mother", "TSH", 3.9, "mIU/L", "2026-05-20"),
  L("son", "Weight", 28, "kg", "2026-02-01"),
  L("son", "Weight", 30, "kg", "2026-05-01"),
];
const seedMeds: Medication[] = [
  {
    id: id(),
    memberId: "father",
    name: "Metformin",
    dose: "500 mg",
    freq: "Twice daily",
    refillBy: rel(4),
    remaining: 9,
    taken: [rel(-2), rel(-1)],
  },
  {
    id: id(),
    memberId: "father",
    name: "Telmisartan",
    dose: "40 mg",
    freq: "Once daily",
    refillBy: rel(19),
    remaining: 24,
    taken: [rel(-2), rel(0)],
  },
  {
    id: id(),
    memberId: "father",
    name: "Atorvastatin",
    dose: "10 mg",
    freq: "Once at night",
    refillBy: rel(19),
    remaining: 24,
    taken: [rel(-1)],
  },
  {
    id: id(),
    memberId: "mother",
    name: "Levothyroxine",
    dose: "50 mcg",
    freq: "Once, empty stomach",
    refillBy: rel(9),
    remaining: 12,
    taken: [rel(-1), rel(0)],
  },
];
const seedReminders: Reminder[] = [
  { id: id(), memberId: "father", title: "Metformin refill", kind: "refill", due: rel(4), done: false },
  { id: id(), memberId: "father", title: "Endocrinology follow-up", kind: "appointment", due: rel(12), done: false },
  { id: id(), memberId: "father", title: "Health insurance renewal", kind: "insurance", due: rel(21), done: false },
  { id: id(), memberId: "mother", title: "TSH recheck", kind: "appointment", due: rel(40), done: false },
  { id: id(), memberId: "mother", title: "Levothyroxine refill", kind: "refill", due: rel(9), done: false },
  { id: id(), memberId: "you", title: "Annual health checkup", kind: "appointment", due: rel(70), done: false },
  { id: id(), memberId: "son", title: "MMR booster due", kind: "vaccination", due: rel(15), done: false },
  { id: id(), memberId: "son", title: "Pediatric dental checkup", kind: "appointment", due: rel(33), done: false },
];
const seedCare: Record<string, CareProfile> = {
  you: {
    conditions: [],
    medications: [],
    allergies: "Penicillin",
    doctor: "Dr. Reyes, Family Medicine",
    emergency: "Jordan Morgan (spouse)",
  },
  spouse: {
    conditions: [],
    medications: [],
    allergies: "None recorded",
    doctor: "Dr. Osei, Internal Medicine",
    emergency: "Alex Morgan (spouse)",
  },
  father: {
    conditions: ["Type 2 Diabetes", "Hypertension"],
    medications: [],
    allergies: "Sulfonamides",
    doctor: "Dr. Bennett, Endocrinology",
    emergency: "Alex Morgan (son)",
  },
  mother: {
    conditions: ["Hypothyroidism"],
    medications: [],
    allergies: "None recorded",
    doctor: "Dr. Carter, Internal Medicine",
    emergency: "Alex Morgan (son)",
  },
  son: {
    conditions: [],
    medications: [],
    allergies: "Peanuts",
    doctor: "Dr. Lin, Pediatrics",
    emergency: "Alex Morgan (father)",
  },
};

const DEFAULT: State = {
  onboarded: true,
  members: seedMembers,
  docs: seedDocs,
  labs: seedLabs,
  care: seedCare,
  meds: seedMeds,
  reminders: seedReminders,
};

function load(): State {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(LS);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        ...DEFAULT,
        ...p,
        care: p.care ?? DEFAULT.care,
        labs: p.labs ?? DEFAULT.labs,
        meds: p.meds ?? DEFAULT.meds,
        reminders: p.reminders ?? DEFAULT.reminders,
        docs: p.docs ?? DEFAULT.docs,
      };
    }
  } catch {}
  return DEFAULT;
}

let state: State = load();
const subs = new Set<() => void>();
function persist() {
  try {
    if (typeof window !== "undefined") localStorage.setItem(LS, JSON.stringify(state));
  } catch {}
  subs.forEach((f) => f());
}

export function useStore() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);

  const addFiles = useCallback(async (files: FileList | File[], memberId?: string) => {
    for (const file of Array.from(files)) {
      const c = classify(file.name);
      const key = "f_" + Math.random().toString(36).slice(2) + Date.now();
      try {
        await putBlob(key, file);
      } catch {}
      state = {
        ...state,
        docs: [
          {
            id: key,
            name: file.name,
            category: c.category,
            docType: c.docType,
            medType: c.medType,
            source: "Upload",
            mime: file.type || "application/octet-stream",
            sizeKB: Math.max(1, Math.round(file.size / 1024)),
            addedAt: new Date().toISOString(),
            memberId: memberId || (c.category === "Medical" ? undefined : "you"),
            fileKey: key,
          },
          ...state.docs,
        ],
      };
    }
    persist();
  }, []);
  const updateDoc = useCallback((docId: string, patch: Partial<Doc>) => {
    state = { ...state, docs: state.docs.map((d) => (d.id === docId ? { ...d, ...patch } : d)) };
    persist();
  }, []);
  const removeDoc = useCallback(async (docId: string) => {
    const d = state.docs.find((x) => x.id === docId);
    if (d && d.fileKey !== "seed") {
      try {
        await delBlob(d.fileKey);
      } catch {}
    }
    state = { ...state, docs: state.docs.filter((x) => x.id !== docId) };
    persist();
  }, []);
  const addMember = useCallback((mem: Member) => {
    state = { ...state, members: [...state.members, mem] };
    persist();
  }, []);
  const updateMember = useCallback((mid: string, patch: Partial<Member>) => {
    state = { ...state, members: state.members.map((mm) => (mm.id === mid ? { ...mm, ...patch } : mm)) };
    persist();
  }, []);
  const addLab = useCallback((l: LabLog) => {
    state = { ...state, labs: [l, ...state.labs] };
    persist();
  }, []);
  const updateCare = useCallback((mid: string, patch: Partial<CareProfile>) => {
    const cur = state.care[mid] || { conditions: [], medications: [], allergies: "None recorded" };
    state = { ...state, care: { ...state.care, [mid]: { ...cur, ...patch } } };
    persist();
  }, []);
  const addMed = useCallback((mm: Medication) => {
    state = { ...state, meds: [...state.meds, mm] };
    persist();
  }, []);
  const removeMed = useCallback((mid: string) => {
    state = { ...state, meds: state.meds.filter((x) => x.id !== mid) };
    persist();
  }, []);
  const refillMed = useCallback((mid: string, days = 30, count = 30) => {
    state = {
      ...state,
      meds: state.meds.map((x) => (x.id === mid ? { ...x, refillBy: rel(days), remaining: count } : x)),
    };
    persist();
  }, []);
  const markTaken = useCallback((mid: string, date = rel(0)) => {
    state = {
      ...state,
      meds: state.meds.map((x) => {
        if (x.id !== mid) return x;
        const taken = x.taken || [];
        if (taken.includes(date)) return x;
        return {
          ...x,
          taken: [...taken, date],
          remaining: typeof x.remaining === "number" ? Math.max(0, x.remaining - 1) : x.remaining,
        };
      }),
    };
    persist();
  }, []);
  const addReminder = useCallback((r: Reminder) => {
    state = { ...state, reminders: [...state.reminders, r] };
    persist();
  }, []);
  const completeReminder = useCallback((rid: string) => {
    state = { ...state, reminders: state.reminders.map((x) => (x.id === rid ? { ...x, done: true } : x)) };
    persist();
  }, []);
  const removeReminder = useCallback((rid: string) => {
    state = { ...state, reminders: state.reminders.filter((x) => x.id !== rid) };
    persist();
  }, []);
  const setOnboarded = useCallback((v: boolean) => {
    state = { ...state, onboarded: v };
    persist();
  }, []);
  const reset = useCallback(() => {
    state = { ...DEFAULT };
    persist();
  }, []);

  return {
    ...state,
    addFiles,
    updateDoc,
    removeDoc,
    addMember,
    updateMember,
    addLab,
    updateCare,
    addMed,
    removeMed,
    refillMed,
    markTaken,
    addReminder,
    completeReminder,
    removeReminder,
    setOnboarded,
    reset,
  };
}
