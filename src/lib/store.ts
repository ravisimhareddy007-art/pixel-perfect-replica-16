import { useEffect, useState, useCallback } from "react";
import type { Doc, Member, LabLog, Medication, Reminder } from "./types";
import { putBlob, delBlob } from "./idb";
import { classify } from "./classify";

const LS = "lifepack.v1";

export interface CareProfile {
  conditions: string[];
  medications: string[]; // kept for backward compatibility; structured meds live in state.meds
  allergies: string;
  doctor?: string; // added for Health
  emergency?: string; // added for Health
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

const rel = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const id = () => Math.random().toString(36).slice(2, 9);

const seedMembers: Member[] = [
  { id: "self", name: "Ravi (You)", relation: "Self", color: "#6E8BFF", dob: "1988-03-19", bloodGroup: "B+" },
  { id: "dad", name: "Dad", relation: "Father", color: "#2FB68A", dob: "1959-05-12", bloodGroup: "B+" },
  { id: "mom", name: "Mom", relation: "Mother", color: "#F472B6", dob: "1963-09-02", bloodGroup: "O+" },
  { id: "aarav", name: "Aarav", relation: "Son", color: "#A78BFA", dob: "2018-11-05", bloodGroup: "B+" },
];
const seedCare: Record<string, CareProfile> = {
  dad: {
    conditions: ["Type 2 Diabetes", "Hypertension"],
    medications: [],
    allergies: "Sulfa drugs",
    doctor: "Dr. Menon, Endocrinology",
    emergency: "Ravi (son)",
  },
  mom: {
    conditions: ["Hypothyroidism"],
    medications: [],
    allergies: "None recorded",
    doctor: "Dr. Rao, General Medicine",
    emergency: "Ravi (son)",
  },
  self: {
    conditions: [],
    medications: [],
    allergies: "None recorded",
    doctor: "Dr. Iyer, Family Physician",
    emergency: "Jaya (spouse)",
  },
  aarav: {
    conditions: [],
    medications: [],
    allergies: "Peanuts",
    doctor: "Dr. Shah, Pediatrics",
    emergency: "Ravi (father)",
  },
};
const seedLabs: LabLog[] = [
  { id: id(), memberId: "dad", metric: "HbA1c", value: 6.6, unit: "%", date: "2026-01-08" },
  { id: id(), memberId: "dad", metric: "HbA1c", value: 6.9, unit: "%", date: "2026-03-12" },
  { id: id(), memberId: "dad", metric: "HbA1c", value: 7.2, unit: "%", date: "2026-06-10" },
  { id: id(), memberId: "dad", metric: "LDL", value: 132, unit: "mg/dL", date: "2026-01-08" },
  { id: id(), memberId: "dad", metric: "LDL", value: 124, unit: "mg/dL", date: "2026-05-02" },
  { id: id(), memberId: "dad", metric: "LDL", value: 119, unit: "mg/dL", date: "2026-06-10" },
  { id: id(), memberId: "dad", metric: "Blood Pressure", value: 138, value2: 86, unit: "mmHg", date: "2026-01-08" },
  { id: id(), memberId: "dad", metric: "Blood Pressure", value: 132, value2: 84, unit: "mmHg", date: "2026-03-12" },
  { id: id(), memberId: "dad", metric: "Blood Pressure", value: 124, value2: 82, unit: "mmHg", date: "2026-06-10" },
  { id: id(), memberId: "mom", metric: "TSH", value: 6.2, unit: "mIU/L", date: "2026-01-15" },
  { id: id(), memberId: "mom", metric: "TSH", value: 4.8, unit: "mIU/L", date: "2026-03-20" },
  { id: id(), memberId: "mom", metric: "TSH", value: 3.9, unit: "mIU/L", date: "2026-05-20" },
  { id: id(), memberId: "self", metric: "LDL", value: 108, unit: "mg/dL", date: "2026-04-12" },
  { id: id(), memberId: "self", metric: "Blood Pressure", value: 122, value2: 79, unit: "mmHg", date: "2026-04-12" },
  { id: id(), memberId: "aarav", metric: "Weight", value: 22, unit: "kg", date: "2026-02-01" },
  { id: id(), memberId: "aarav", metric: "Weight", value: 23, unit: "kg", date: "2026-05-01" },
];
const seedMeds: Medication[] = [
  { id: id(), memberId: "dad", name: "Metformin", dose: "500 mg", freq: "Twice daily", refillBy: rel(4) },
  { id: id(), memberId: "dad", name: "Telmisartan", dose: "40 mg", freq: "Once daily", refillBy: rel(19) },
  { id: id(), memberId: "dad", name: "Atorvastatin", dose: "10 mg", freq: "Once at night", refillBy: rel(19) },
  { id: id(), memberId: "mom", name: "Thyronorm", dose: "50 mcg", freq: "Once, empty stomach", refillBy: rel(9) },
];
const seedReminders: Reminder[] = [
  { id: id(), memberId: "dad", title: "Metformin refill", kind: "refill", due: rel(4), done: false },
  { id: id(), memberId: "dad", title: "Endocrinology follow-up", kind: "appointment", due: rel(12), done: false },
  { id: id(), memberId: "dad", title: "Health insurance renewal", kind: "insurance", due: rel(21), done: false },
  { id: id(), memberId: "mom", title: "TSH recheck", kind: "appointment", due: rel(40), done: false },
  { id: id(), memberId: "mom", title: "Thyronorm refill", kind: "refill", due: rel(9), done: false },
  { id: id(), memberId: "self", title: "Annual health checkup", kind: "appointment", due: rel(70), done: false },
  { id: id(), memberId: "aarav", title: "MMR booster due", kind: "vaccination", due: rel(15), done: false },
  { id: id(), memberId: "aarav", title: "Pediatric dental checkup", kind: "appointment", due: rel(33), done: false },
];

const DEFAULT: State = {
  onboarded: false,
  members: seedMembers,
  docs: [],
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
      const parsed = JSON.parse(raw);
      // additive merge: existing saved slices win; new slices fall back to defaults so old saves never crash
      return {
        ...DEFAULT,
        ...parsed,
        care: parsed.care ?? DEFAULT.care,
        labs: parsed.labs ?? DEFAULT.labs,
        meds: parsed.meds ?? DEFAULT.meds,
        reminders: parsed.reminders ?? DEFAULT.reminders,
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
    const arr = Array.from(files);
    for (const file of arr) {
      const c = classify(file.name);
      const key = "f_" + Math.random().toString(36).slice(2) + Date.now();
      await putBlob(key, file);
      const doc: Doc = {
        id: key,
        name: file.name,
        category: c.category,
        docType: c.docType,
        medType: c.medType,
        source: "Upload",
        mime: file.type || "application/octet-stream",
        sizeKB: Math.max(1, Math.round(file.size / 1024)),
        addedAt: new Date().toISOString(),
        memberId: memberId || (c.category === "Medical" ? undefined : "self"),
        fileKey: key,
      };
      state = { ...state, docs: [doc, ...state.docs] };
    }
    persist();
  }, []);

  const updateDoc = useCallback((docId: string, patch: Partial<Doc>) => {
    state = { ...state, docs: state.docs.map((d) => (d.id === docId ? { ...d, ...patch } : d)) };
    persist();
  }, []);
  const removeDoc = useCallback(async (docId: string) => {
    const d = state.docs.find((x) => x.id === docId);
    if (d) await delBlob(d.fileKey);
    state = { ...state, docs: state.docs.filter((x) => x.id !== docId) };
    persist();
  }, []);

  const addMember = useCallback((m: Member) => {
    state = { ...state, members: [...state.members, m] };
    persist();
  }, []);
  const updateMember = useCallback((memberId: string, patch: Partial<Member>) => {
    state = { ...state, members: state.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)) };
    persist();
  }, []);

  const addLab = useCallback((l: LabLog) => {
    state = { ...state, labs: [l, ...state.labs] };
    persist();
  }, []);

  const updateCare = useCallback((memberId: string, patch: Partial<CareProfile>) => {
    const cur = state.care[memberId] || { conditions: [], medications: [], allergies: "None recorded" };
    state = { ...state, care: { ...state.care, [memberId]: { ...cur, ...patch } } };
    persist();
  }, []);

  const addMed = useCallback((m: Medication) => {
    state = { ...state, meds: [...state.meds, m] };
    persist();
  }, []);
  const removeMed = useCallback((medId: string) => {
    state = { ...state, meds: state.meds.filter((m) => m.id !== medId) };
    persist();
  }, []);
  const refillMed = useCallback((medId: string, days = 30) => {
    state = { ...state, meds: state.meds.map((m) => (m.id === medId ? { ...m, refillBy: rel(days) } : m)) };
    persist();
  }, []);

  const addReminder = useCallback((r: Reminder) => {
    state = { ...state, reminders: [...state.reminders, r] };
    persist();
  }, []);
  const completeReminder = useCallback((remId: string) => {
    state = { ...state, reminders: state.reminders.map((r) => (r.id === remId ? { ...r, done: true } : r)) };
    persist();
  }, []);
  const removeReminder = useCallback((remId: string) => {
    state = { ...state, reminders: state.reminders.filter((r) => r.id !== remId) };
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
    addReminder,
    completeReminder,
    removeReminder,
    setOnboarded,
    reset,
  };
}
