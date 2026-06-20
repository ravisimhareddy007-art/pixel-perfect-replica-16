import { useEffect, useState, useCallback } from "react";
import type { Doc, Member, LabLog } from "./types";
import { putBlob, delBlob } from "./idb";
import { classify } from "./classify";

const LS = "lifepack.v1";
export interface CareProfile { conditions: string[]; medications: string[]; allergies: string; }
interface State { onboarded: boolean; members: Member[]; docs: Doc[]; labs: LabLog[]; care: Record<string, CareProfile>; }

const seedMembers: Member[] = [
  { id: "self", name: "Ravi (You)", relation: "Self", color: "#5B5BF5" },
  { id: "dad", name: "Dad", relation: "Father", color: "#0E9F6E" },
];

function load(): State {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { onboarded: false, members: seedMembers, docs: [], labs: [], care: {} };
}

let state: State = load();
const subs = new Set<() => void>();
function persist() { try { localStorage.setItem(LS, JSON.stringify(state)); } catch {} subs.forEach((f) => f()); }

export function useStore() {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);

  const addFiles = useCallback(async (files: FileList | File[], memberId?: string) => {
    const arr = Array.from(files);
    for (const file of arr) {
      const c = classify(file.name);
      const key = "f_" + Math.random().toString(36).slice(2) + Date.now();
      await putBlob(key, file);
      const doc: Doc = {
        id: key, name: file.name, category: c.category, docType: c.docType, medType: c.medType,
        source: "Upload", mime: file.type || "application/octet-stream",
        sizeKB: Math.max(1, Math.round(file.size / 1024)),
        addedAt: new Date().toISOString(),
        memberId: memberId || (c.category === "Medical" ? undefined : "self"),
        fileKey: key,
      };
      state = { ...state, docs: [doc, ...state.docs] };
    }
    persist();
  }, []);

  const updateDoc = useCallback((id: string, patch: Partial<Doc>) => {
    state = { ...state, docs: state.docs.map((d) => (d.id === id ? { ...d, ...patch } : d)) }; persist();
  }, []);
  const removeDoc = useCallback(async (id: string) => {
    const d = state.docs.find((x) => x.id === id); if (d) await delBlob(d.fileKey);
    state = { ...state, docs: state.docs.filter((x) => x.id !== id) }; persist();
  }, []);
  const addMember = useCallback((m: Member) => { state = { ...state, members: [...state.members, m] }; persist(); }, []);
  const addLab = useCallback((l: LabLog) => { state = { ...state, labs: [l, ...state.labs] }; persist(); }, []);
  const setOnboarded = useCallback((v: boolean) => { state = { ...state, onboarded: v }; persist(); }, []);
  const updateCare = useCallback((memberId: string, patch: Partial<CareProfile>) => {
    const cur = state.care[memberId] || { conditions: [], medications: [], allergies: "" };
    state = { ...state, care: { ...state.care, [memberId]: { ...cur, ...patch } } }; persist();
  }, []);
  const reset = useCallback(() => { state = { onboarded: false, members: seedMembers, docs: [], labs: [], care: {} }; persist(); }, []);

  return { ...state, addFiles, updateDoc, removeDoc, addMember, addLab, updateCare, setOnboarded, reset };
}
