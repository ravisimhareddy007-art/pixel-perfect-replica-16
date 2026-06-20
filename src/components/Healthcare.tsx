import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  HeartPulse, Printer, Download, Plus, X, Pill as PillIcon, FlaskConical,
  Info, FileText, Stethoscope, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { useStore } from "../lib/store";
import { buildZip } from "../lib/zip";
import { Card, Dropzone, SectionHead, fmtDate } from "./ui";
import Viewer from "./Viewer";
import type { Doc, LabLog } from "../lib/types";

const MED_LABEL: Record<string, string> = {
  prescription: "Prescription", lab_report: "Lab Report", discharge: "Discharge", bill: "Bill", scan: "Scan", other: "Record",
};

export default function Healthcare({ toast }: { toast: (m: string) => void }) {
  const { members, docs, labs, care, addFiles, addLab, updateCare } = useStore();
  const [mid, setMid] = useState(members[0]?.id || "self");
  const [open, setOpen] = useState<Doc | null>(null);
  const profile = care[mid] || { conditions: [], medications: [], allergies: "" };

  const medDocs = useMemo(
    () => docs.filter((d) => d.category === "Medical" && (d.memberId === mid || !d.memberId))
      .sort((a, b) => (b.docDate || b.addedAt).localeCompare(a.docDate || a.addedAt)),
    [docs, mid]
  );
  const memberLabs = labs.filter((l) => l.memberId === mid);

  const visitPack = async () => {
    if (!medDocs.length) { toast("No records yet — upload prescriptions or reports first"); return; }
    await buildZip(`Visit Pack — ${members.find((m) => m.id === mid)?.name}`, medDocs);
    toast("Visit pack downloaded");
  };

  return (
    <>
      <SectionHead title="Healthcare" sub="Keep every prescription and report in one place. Build a visit pack before any appointment." />

      {/* no-hallucination disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl bg-[#EEF2FF] border border-[#DCE3FF] p-3.5 mb-5 text-[13px] text-[#3B4A8C]">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span>LifePack only organizes and displays the records you add. It does not interpret results, diagnose, or give medical advice. Everything below comes from your own files and entries.</span>
      </div>

      {/* member selector */}
      <div className="flex gap-2 flex-wrap mb-5">
        {members.map((m) => (
          <button key={m.id} onClick={() => setMid(m.id)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold transition"
            style={{ border: `1px solid ${mid === m.id ? "#0B0E24" : "#E7EAF3"}`, background: mid === m.id ? "rgba(11,14,36,.06)" : "#fff", color: mid === m.id ? "#0B0E24" : "#69728A" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: m.color }} /> {m.name}
          </button>
        ))}
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
        {/* left: timeline */}
        <div>
          <div className="mb-4"><Dropzone compact onFiles={(f) => addFiles(f, mid)} /></div>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-ink text-[15px]"><Stethoscope size={17} className="text-[#69728A]" /> Records timeline</div>
              <span className="font-mono text-[12px] text-[#98A1B5]">{medDocs.length} records</span>
            </div>
            {medDocs.length === 0 ? (
              <div className="text-center text-[#98A1B5] py-8">
                <HeartPulse size={28} className="mx-auto mb-2 text-[#C9CEE0]" />
                <p className="text-[13px]">No medical records yet. Upload a prescription or lab report above.</p>
              </div>
            ) : (
              <div className="relative pl-5">
                <div className="absolute left-1.5 top-1 bottom-1 w-px bg-[#E7EAF3]" />
                {medDocs.map((d, i) => (
                  <motion.button key={d.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => setOpen(d)} className="relative block w-full text-left mb-3 last:mb-0">
                    <span className="absolute -left-[14px] top-3 w-2.5 h-2.5 rounded-full bg-[#E0508F] ring-4 ring-white" />
                    <div className="rounded-xl border border-[#EEF1F8] hover:border-brand/50 hover:shadow-soft transition p-3 flex items-center gap-3">
                      <span className="grid place-items-center rounded-lg shrink-0" style={{ width: 34, height: 34, background: "#E0508F18" }}>
                        {d.medType === "prescription" ? <PillIcon size={16} color="#E0508F" /> : <FlaskConical size={16} color="#E0508F" />}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-ink text-[14px] truncate">{d.name}</div>
                        <div className="text-[12px] text-[#98A1B5]">{MED_LABEL[d.medType || "other"]} · {fmtDate(d.docDate || d.addedAt)}</div>
                      </div>
                      <FileText size={15} className="text-[#C0C6D8]" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </Card>

          <LabTrends mid={mid} labs={memberLabs} addLab={addLab} />
        </div>

        {/* right: care profile + actions */}
        <div className="grid gap-4 content-start">
          <Card className="p-5">
            <div className="font-bold text-ink text-[15px] mb-3">Care profile</div>
            <Editable label="Conditions" items={profile.conditions} onChange={(v) => updateCare(mid, { conditions: v })} placeholder="e.g. Type 2 Diabetes" />
            <Editable label="Current medications" items={profile.medications} onChange={(v) => updateCare(mid, { medications: v })} placeholder="e.g. Metformin 500mg" />
            <div className="mt-3">
              <div className="text-[12px] font-semibold text-[#98A1B5] uppercase tracking-wide mb-1">Allergies</div>
              <input className="w-full rounded-lg border border-[#E7EAF3] px-3 py-2 text-[14px] outline-none focus:border-brand"
                value={profile.allergies} onChange={(e) => updateCare(mid, { allergies: e.target.value })} placeholder="None recorded" />
            </div>
          </Card>

          <Card className="p-5">
            <div className="font-bold text-ink text-[15px] mb-1">Before your visit</div>
            <p className="text-[13px] text-[#69728A] mb-4">Carry everything in one tap, or print a one-page summary for the doctor.</p>
            <button onClick={visitPack} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-[14px] font-semibold mb-2.5"
              style={{ background: "#0B0E24", boxShadow: "0 8px 20px rgba(11,14,36,.20)" }}>
              <Download size={16} /> Download visit pack
            </button>
            <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-[#E7EAF3] text-ink text-[14px] font-semibold">
              <Printer size={16} /> Print visit summary
            </button>
          </Card>
        </div>
      </div>

      {/* printable summary (hidden on screen, shown only when printing) */}
      <PrintSummary mid={mid} />

      {open && <Viewer doc={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Editable({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [val, setVal] = useState("");
  return (
    <div className="mb-3">
      <div className="text-[12px] font-semibold text-[#98A1B5] uppercase tracking-wide mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-[#F5F2EA] border border-[#E7EAF3] rounded-full px-2.5 py-1 text-[13px] text-ink">
            {it}<button onClick={() => onChange(items.filter((_, j) => j !== i))}><X size={12} className="text-[#98A1B5]" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onChange([...items, val.trim()]); setVal(""); } }}
          placeholder={placeholder} className="flex-1 rounded-lg border border-[#E7EAF3] px-3 py-2 text-[14px] outline-none focus:border-brand" />
        <button onClick={() => { if (val.trim()) { onChange([...items, val.trim()]); setVal(""); } }}
          className="w-10 grid place-items-center rounded-lg bg-[#F5F2EA] border border-[#E7EAF3]"><Plus size={16} className="text-brand" /></button>
      </div>
    </div>
  );
}

function LabTrends({ mid, labs, addLab }: { mid: string; labs: LabLog[]; addLab: (l: LabLog) => void }) {
  const [metric, setMetric] = useState("HbA1c");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("%");
  const groups = useMemo(() => {
    const m: Record<string, LabLog[]> = {};
    labs.forEach((l) => { (m[l.metric] ||= []).push(l); });
    Object.values(m).forEach((a) => a.sort((x, y) => x.date.localeCompare(y.date)));
    return m;
  }, [labs]);

  return (
    <Card className="p-5 mt-4">
      <div className="flex items-center gap-2 font-bold text-ink text-[15px] mb-1"><TrendingUp size={17} className="text-[#69728A]" /> Lab values you track</div>
      <p className="text-[12.5px] text-[#98A1B5] mb-4">Log readings from your reports. LifePack only charts what you enter, it never interprets them.</p>

      <div className="flex gap-1.5 mb-4">
        <input value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="Metric"
          className="w-[34%] rounded-lg border border-[#E7EAF3] px-2.5 py-2 text-[13px] outline-none focus:border-brand" />
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" type="number"
          className="w-[26%] rounded-lg border border-[#E7EAF3] px-2.5 py-2 text-[13px] outline-none focus:border-brand" />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit"
          className="w-[20%] rounded-lg border border-[#E7EAF3] px-2.5 py-2 text-[13px] outline-none focus:border-brand" />
        <button onClick={() => { const v = parseFloat(value); if (!isNaN(v) && metric.trim()) { addLab({ id: Math.random().toString(36).slice(2), memberId: mid, metric: metric.trim(), value: v, unit, date: new Date().toISOString() }); setValue(""); } }}
          className="flex-1 grid place-items-center rounded-lg bg-[#F5F2EA] border border-[#E7EAF3]"><Plus size={16} className="text-brand" /></button>
      </div>

      {Object.keys(groups).length === 0 && <p className="text-[13px] text-[#98A1B5]">No readings logged yet.</p>}
      {Object.entries(groups).map(([name, arr]) => {
        const last = arr[arr.length - 1], prev = arr[arr.length - 2];
        const delta = prev ? last.value - prev.value : 0;
        const Tr = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
        const max = Math.max(...arr.map((a) => a.value)), min = Math.min(...arr.map((a) => a.value));
        return (
          <div key={name} className="mb-3 last:mb-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-semibold text-ink">{name}</span>
              <span className="flex items-center gap-1 text-[12px] font-mono text-[#69728A]">
                {last.value}{last.unit} <Tr size={13} className={delta > 0 ? "text-bad" : delta < 0 ? "text-ok" : "text-[#98A1B5]"} />
              </span>
            </div>
            <div className="flex items-end gap-1 h-10">
              {arr.slice(-12).map((a, i) => {
                const h = max === min ? 50 : 20 + ((a.value - min) / (max - min)) * 80;
                return <div key={i} title={`${a.value}${a.unit} · ${fmtDate(a.date)}`} className="flex-1 rounded-t bg-brand/30" style={{ height: `${h}%`, minWidth: 4 }} />;
              })}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function PrintSummary({ mid }: { mid: string }) {
  const { members, docs, labs, care } = useStore();
  const m = members.find((x) => x.id === mid);
  const profile = care[mid] || { conditions: [], medications: [], allergies: "" };
  const meds = docs.filter((d) => d.category === "Medical" && (d.memberId === mid || !d.memberId));
  const memberLabs = labs.filter((l) => l.memberId === mid);
  return (
    <div id="print-area" style={{ display: "none" }}>
      <h1 style={{ fontSize: 22, margin: 0 }}>Visit Summary — {m?.name}</h1>
      <p style={{ color: "#555", fontSize: 12, marginTop: 4 }}>Prepared with LifePack AI · {new Date().toLocaleString()}</p>
      <hr />
      <h3>Conditions</h3><p>{profile.conditions.join(", ") || "None recorded"}</p>
      <h3>Current medications</h3>
      <ul>{profile.medications.length ? profile.medications.map((x, i) => <li key={i}>{x}</li>) : <li>None recorded</li>}</ul>
      <h3>Allergies</h3><p>{profile.allergies || "None recorded"}</p>
      <h3>Recent lab readings (self-logged)</h3>
      <ul>{memberLabs.slice(0, 8).map((l) => <li key={l.id}>{l.metric}: {l.value}{l.unit} ({fmtDate(l.date)})</li>)}{!memberLabs.length && <li>None</li>}</ul>
      <h3>Attached records ({meds.length})</h3>
      <ol>{meds.map((d) => <li key={d.id}>{d.name} — {MED_LABEL[d.medType || "other"]} ({fmtDate(d.docDate || d.addedAt)})</li>)}</ol>
      <p style={{ fontSize: 11, color: "#888", marginTop: 16 }}>This summary lists information entered by the patient or family. It is not a medical document and does not constitute advice or diagnosis.</p>
    </div>
  );
}
