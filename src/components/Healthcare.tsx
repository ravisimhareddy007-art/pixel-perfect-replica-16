import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Download,
  Printer,
  Users,
  Pill as PillIcon,
  FlaskConical,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Bell,
  ShieldCheck,
  Syringe,
  CalendarClock,
  RefreshCw,
  UserPlus,
  Info,
  Trash2,
  Edit3,
} from "lucide-react";
import { useStore, type CareProfile } from "../lib/store";
import type { Doc, Member, LabLog, Medication, Reminder, ReminderKind } from "../lib/types";

/* ── theme ── */
const C = {
  panel: "rgba(255,255,255,0.035)",
  panel2: "rgba(255,255,255,0.055)",
  border: "rgba(255,255,255,0.08)",
  text: "#EAEDF7",
  sub: "rgba(234,237,247,0.62)",
  faint: "rgba(234,237,247,0.40)",
  gold: "#D8B25A",
  emerald: "#2FB68A",
  red: "#F26D6D",
  violet: "#A78BFA",
  pink: "#F472B6",
  cyan: "#6E8BFF",
};
const rel = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (s?: string) =>
  s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const daysTo = (s: string) => Math.ceil((+new Date(s) - Date.now()) / 86400000);
const age = (dob?: string) => (dob ? Math.floor((Date.now() - +new Date(dob)) / (365.25 * 86400000)) : null);
const today = () => new Date().toISOString().slice(0, 10);

/* ── reference ranges: standard published values (ADA / AHA / common lab). Facts, not proprietary. ── */
type Status = "in" | "watch" | "out" | "none";
const METRICS: Record<string, { unit: string; bp?: boolean; ref: string; status: (a: number, b?: number) => Status }> =
  {
    HbA1c: {
      unit: "%",
      ref: "under 5.7% normal, 6.5%+ high",
      status: (v) => (v < 5.7 ? "in" : v < 6.5 ? "watch" : "out"),
    },
    LDL: {
      unit: "mg/dL",
      ref: "under 100 optimal, 130+ high",
      status: (v) => (v < 100 ? "in" : v < 130 ? "watch" : "out"),
    },
    "Fasting Glucose": {
      unit: "mg/dL",
      ref: "under 100 normal, 126+ high",
      status: (v) => (v < 100 ? "in" : v < 126 ? "watch" : "out"),
    },
    "Blood Pressure": {
      unit: "mmHg",
      bp: true,
      ref: "under 130/85 in range, 140/90+ high",
      status: (s, d = 0) => (s < 130 && d < 85 ? "in" : s < 140 && d < 90 ? "watch" : "out"),
    },
    TSH: {
      unit: "mIU/L",
      ref: "0.4 to 4.0 normal",
      status: (v) => (v >= 0.4 && v <= 4 ? "in" : v <= 6 ? "watch" : "out"),
    },
    Weight: { unit: "kg", ref: "tracked", status: () => "none" },
  };
const SM: Record<Status, { label: string; c: string }> = {
  in: { label: "in range", c: C.emerald },
  watch: { label: "watch", c: C.gold },
  out: { label: "out of range", c: C.red },
  none: { label: "tracked", c: C.faint },
};
const KIND_ICON: Record<string, any> = {
  refill: RefreshCw,
  appointment: CalendarClock,
  insurance: ShieldCheck,
  vaccination: Syringe,
  other: Bell,
};

const sortReadings = (a: LabLog, b: LabLog) => a.date.localeCompare(b.date);
const statusOf = (metric: string, r: LabLog[]): Status => {
  if (!r.length) return "none";
  const l = r[r.length - 1];
  return METRICS[metric].status(l.value, l.value2);
};

/* ── main ── */
export default function Healthcare({ toast: extToast }: { toast?: (m: string) => void }) {
  const s = useStore();
  const [localToast, setLocalToast] = useState<string | null>(null);
  const toast = (m: string) => {
    if (extToast) extToast(m);
    else {
      setLocalToast(m);
      window.clearTimeout((toast as any)._t);
      (toast as any)._t = window.setTimeout(() => setLocalToast(null), 2400);
    }
  };

  const [sel, setSel] = useState(s.members[0]?.id || "self");
  const m = s.members.find((x) => x.id === sel) || s.members[0];
  const [modal, setModal] = useState<null | "reading" | "member" | "med" | "reminder" | "profile">(null);
  const [printHTML, setPrintHTML] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const care = s.care[sel] || {
    conditions: [],
    medications: [],
    allergies: "None recorded",
    doctor: "",
    emergency: "",
  };
  const meds = s.meds.filter((x) => x.memberId === sel);
  const reminders = s.reminders.filter((x) => x.memberId === sel && !x.done).sort((a, b) => a.due.localeCompare(b.due));
  const records = useMemo(
    () =>
      s.docs
        .filter((d) => d.category === "Medical" && d.memberId === sel)
        .sort((a, b) => (b.docDate || b.addedAt).localeCompare(a.docDate || a.addedAt)),
    [s.docs, sel],
  );
  const vitals = useMemo(() => {
    const map: Record<string, LabLog[]> = {};
    s.labs
      .filter((l) => l.memberId === sel && METRICS[l.metric])
      .forEach((l) => {
        (map[l.metric] ||= []).push(l);
      });
    Object.values(map).forEach((a) => a.sort(sortReadings));
    return map;
  }, [s.labs, sel]);

  const attentionOf = (mid: string) => {
    let n = 0;
    s.reminders.forEach((r) => {
      if (r.memberId === mid && !r.done && daysTo(r.due) <= 30) n++;
    });
    const byMetric: Record<string, LabLog[]> = {};
    s.labs.filter((l) => l.memberId === mid && METRICS[l.metric]).forEach((l) => (byMetric[l.metric] ||= []).push(l));
    Object.keys(byMetric).forEach((k) => {
      byMetric[k].sort(sortReadings);
      if (statusOf(k, byMetric[k]) === "out") n++;
    });
    return n;
  };
  const attnItems = (mid: string) => {
    const out: string[] = [];
    s.reminders
      .filter((r) => r.memberId === mid && !r.done && daysTo(r.due) <= 30)
      .sort((a, b) => a.due.localeCompare(b.due))
      .forEach((r) => {
        const dd = daysTo(r.due);
        out.push(`${r.title} ${dd < 0 ? "overdue" : dd === 0 ? "today" : `in ${dd}d`}`);
      });
    return out;
  };
  const totalAttention = s.members.reduce((t, mm) => t + attentionOf(mm.id), 0);
  const familyAttn = s.members.flatMap((mm) =>
    attnItems(mm.id)
      .slice(0, 1)
      .map((it) => ({ mm, it })),
  );

  const insight = useMemo(() => {
    const parts: string[] = [];
    Object.keys(vitals).forEach((k) => {
      const arr = vitals[k];
      if (arr.length < 2 || k === "Weight") return;
      const l = arr[arr.length - 1],
        first = arr[0];
      const st = statusOf(k, arr);
      const dir = l.value > first.value ? "risen" : l.value < first.value ? "eased" : "held steady";
      const val = METRICS[k].bp ? `${l.value}/${l.value2}` : `${l.value} ${METRICS[k].unit}`;
      const range =
        st === "out"
          ? "above the standard reference range"
          : st === "watch"
            ? "near the upper edge of the standard range"
            : "within the standard range";
      parts.push(`${k} has ${dir} across ${m?.name}'s last ${arr.length} readings to ${val}, ${range}.`);
    });
    if (!parts.length) return "No tracked readings yet. Use “Log a reading” to build a factual trend for this person.";
    return parts
      .sort((a) => (a.includes("above") ? -1 : 1))
      .slice(0, 3)
      .join(" ");
  }, [vitals, m]);

  const visitHTML = useMemo(() => buildVisitPack(m, care, meds, vitals, records), [m, care, meds, vitals, records]);
  const doExport = () => {
    const b = new Blob([visitHTML], { type: "text/html" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = `VisitPack_${m?.name}.html`;
    a.click();
    URL.revokeObjectURL(u);
    toast("Visit pack exported");
  };
  const doPrint = () => {
    setPrintHTML(visitHTML);
    setTimeout(() => window.print(), 60);
  };

  if (!m)
    return (
      <div className="lh-root">
        <style>{CSS}</style>
        <p style={{ color: C.sub }}>No family members yet. Add one to begin.</p>
      </div>
    );

  return (
    <div className="lh-root">
      <style>{CSS}</style>

      <div className="lh-head">
        <div className="lh-eyebrow">● Living archive · health</div>
        <h1 className="lh-h1">Health</h1>
        <p style={{ color: C.sub, fontSize: 15, marginTop: 4 }}>
          Keep the whole family visit-ready. LifePack organizes and surfaces your records. It never diagnoses.
        </p>
      </div>

      {/* family overview */}
      <div className="lh-card" style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Users size={17} color={C.gold} />
          <b style={{ color: C.text, fontSize: 15 }}>Family overview</b>
          <span
            className="lh-mono"
            style={{ marginLeft: "auto", fontSize: 12.5, color: totalAttention ? C.gold : C.emerald }}
          >
            {totalAttention ? `${totalAttention} things need attention` : "all clear this week"}
          </span>
        </div>
        <div className="lh-members">
          {s.members.map((mm) => {
            const a = attentionOf(mm.id);
            return (
              <button
                key={mm.id}
                className={"lh-mcard" + (sel === mm.id ? " on" : "")}
                onClick={() => setSel(mm.id)}
                style={sel === mm.id ? { borderColor: mm.color, color: mm.color } : {}}
              >
                <span
                  className="lh-avatar"
                  style={{ background: mm.color + "26", color: mm.color, borderColor: mm.color + "55" }}
                >
                  {mm.name[0]}
                </span>
                <div style={{ textAlign: "left", minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>{mm.name}</div>
                  <div style={{ fontSize: 12, color: C.faint }}>
                    {mm.relation}
                    {age(mm.dob) != null ? ` · ${age(mm.dob)}y` : ""}
                  </div>
                </div>
                <span
                  className="lh-badge"
                  style={{ background: a ? C.gold + "22" : C.emerald + "22", color: a ? C.gold : C.emerald }}
                >
                  {a ? `${a}` : "✓"}
                </span>
              </button>
            );
          })}
          <button className="lh-mcard lh-add" onClick={() => setModal("member")}>
            <UserPlus size={18} color={C.gold} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Add member</span>
          </button>
        </div>
        {familyAttn.length > 0 && (
          <div className="lh-attn">
            {familyAttn.map((x, i) => (
              <button key={x.mm.id + i} className="lh-chip" onClick={() => setSel(x.mm.id)}>
                <span style={{ width: 7, height: 7, borderRadius: 9, background: x.mm.color }} />
                <b style={{ color: C.text }}>{x.mm.name}:</b> {x.it}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* member header */}
      <div className="lh-mhead">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            className="lh-avatar lg"
            style={{ background: m.color + "26", color: m.color, borderColor: m.color + "55" }}
          >
            {m.name[0]}
          </span>
          <div>
            <h2 className="lh-h2" style={{ fontSize: 22 }}>
              {m.name}
            </h2>
            <div style={{ fontSize: 13.5, color: C.sub, display: "flex", gap: 12, flexWrap: "wrap", marginTop: 2 }}>
              <span>{m.relation}</span>
              {age(m.dob) != null && <span>{age(m.dob)} years</span>}
              {m.bloodGroup && <span>Blood {m.bloodGroup}</span>}
              {care.doctor && <span>{care.doctor}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="lh-btn" onClick={doExport}>
            <Download size={16} /> Export visit pack
          </button>
          <button className="lh-btn-g" onClick={doPrint}>
            <Printer size={16} /> Print
          </button>
          <button className="lh-btn-g" onClick={() => setModal("reading")}>
            <Plus size={16} /> Log a reading
          </button>
        </div>
      </div>

      {/* factual summary */}
      <div className="lh-card lh-insight" style={{ padding: 18, marginBottom: 18 }}>
        <div className="lh-eyebrow" style={{ marginBottom: 8 }}>
          Summary of readings
        </div>
        <p style={{ fontSize: 15.5, lineHeight: 1.6, color: C.text, margin: 0 }}>{insight}</p>
        <p style={{ fontSize: 12.5, color: C.faint, marginTop: 12, display: "flex", gap: 7, alignItems: "flex-start" }}>
          <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} /> This restates your own logged numbers against
          standard published reference ranges. It is not medical advice or a diagnosis. Review any change with your
          doctor.
        </p>
      </div>

      {/* vitals */}
      <div className="lh-grid3" style={{ marginBottom: 18 }}>
        {Object.keys(vitals).length === 0 && (
          <div className="lh-card" style={{ padding: 20, color: C.faint, fontSize: 13.5 }}>
            No readings tracked yet. Use “Log a reading”.
          </div>
        )}
        {Object.keys(vitals).map((k) => {
          const arr = vitals[k];
          const l = arr[arr.length - 1];
          const st = statusOf(k, arr);
          const prev = arr.length > 1 ? arr[arr.length - 2] : null;
          const delta = prev ? l.value - prev.value : 0;
          const Tr = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
          return (
            <motion.div
              key={k}
              className="lh-card"
              style={{ padding: 18 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13.5, color: C.sub }}>{k}</span>
                <Tr size={15} color={delta === 0 ? C.faint : delta > 0 ? C.red : C.emerald} />
              </div>
              <div className="lh-h2" style={{ fontSize: 30, margin: "8px 0 6px" }}>
                {METRICS[k].bp ? `${l.value}/${l.value2}` : l.value}
                <span style={{ fontSize: 15, color: C.sub, fontWeight: 500 }}> {METRICS[k].unit}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Spark arr={arr} c={SM[st].c === C.faint ? C.cyan : SM[st].c} />
                </div>
                <StatusPill s={st} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="lh-grid-2-1">
        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          {/* medications */}
          <div className="lh-card" style={{ padding: 20 }}>
            <div className="lh-sechead">
              <PillIcon size={17} color={C.sub} /> Medications{" "}
              <button className="lh-mini" onClick={() => setModal("med")}>
                <Plus size={14} /> Add
              </button>
            </div>
            {meds.length === 0 ? (
              <Empty t="No medications recorded." />
            ) : (
              meds.map((med) => {
                const dd = daysTo(med.refillBy);
                return (
                  <div key={med.id} className="lh-row">
                    <span className="lh-ic" style={{ background: C.violet + "22" }}>
                      <PillIcon size={15} color={C.violet} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {med.name} <span style={{ color: C.sub, fontWeight: 400 }}>{med.dose}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.faint }}>
                        {med.freq} · refill {fmt(med.refillBy)}
                      </div>
                    </div>
                    {dd <= 14 && (
                      <span
                        className="lh-tag"
                        style={{ color: dd < 0 ? C.red : C.gold, background: (dd < 0 ? C.red : C.gold) + "1f" }}
                      >
                        {dd < 0 ? "overdue" : `${dd}d`}
                      </span>
                    )}
                    <button
                      className="lh-ib"
                      title="Mark refilled"
                      onClick={() => {
                        s.refillMed(med.id, 30);
                        toast("Refill logged");
                      }}
                    >
                      <RefreshCw size={14} color={C.sub} />
                    </button>
                    <button className="lh-ib" title="Remove" onClick={() => s.removeMed(med.id)}>
                      <Trash2 size={14} color={C.faint} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* records (from Documents) */}
          <div className="lh-card" style={{ padding: 20 }}>
            <div className="lh-sechead">
              <Stethoscope size={17} color={C.sub} /> Records
              <button className="lh-mini" onClick={() => fileRef.current?.click()}>
                <Plus size={14} /> Add
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files?.length) {
                    s.addFiles(e.target.files, sel);
                    toast("Record added to vault");
                  }
                  e.currentTarget.value = "";
                }}
              />
            </div>
            {records.length === 0 ? (
              <Empty t="No records yet. Upload a prescription or report; it also lands in Documents." />
            ) : (
              <div style={{ position: "relative", paddingLeft: 18, marginTop: 4 }}>
                <div style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 1, background: C.border }} />
                {records.map((r) => (
                  <div key={r.id} className="lh-rec">
                    <span
                      style={{
                        position: "absolute",
                        left: -17,
                        top: 14,
                        width: 9,
                        height: 9,
                        borderRadius: 9,
                        background: C.pink,
                        boxShadow: `0 0 7px ${C.pink}`,
                      }}
                    />
                    <span className="lh-ic" style={{ background: C.pink + "22" }}>
                      {r.medType === "prescription" ? (
                        <PillIcon size={15} color={C.pink} />
                      ) : (
                        <FlaskConical size={15} color={C.pink} />
                      )}
                    </span>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: C.faint }}>
                        {r.docType} · {fmt(r.docDate || r.addedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          {/* reminders */}
          <div className="lh-card" style={{ padding: 20 }}>
            <div className="lh-sechead">
              <Bell size={17} color={C.sub} /> Reminders{" "}
              <button className="lh-mini" onClick={() => setModal("reminder")}>
                <Plus size={14} /> Add
              </button>
            </div>
            {reminders.length === 0 ? (
              <Empty t="Nothing due. Nicely handled." />
            ) : (
              reminders.map((r) => {
                const Ic = KIND_ICON[r.kind] || CalendarClock;
                const dd = daysTo(r.due);
                return (
                  <div key={r.id} className="lh-row">
                    <span className="lh-ic" style={{ background: C.gold + "1f" }}>
                      <Ic size={15} color={C.gold} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: dd < 7 ? C.gold : C.faint }}>
                        {dd < 0 ? "overdue" : dd === 0 ? "today" : `in ${dd} days`} · {fmt(r.due)}
                      </div>
                    </div>
                    <button
                      className="lh-ib"
                      title="Complete"
                      onClick={() => {
                        s.completeReminder(r.id);
                        toast("Marked done");
                      }}
                    >
                      <CheckCircle2 size={16} color={C.emerald} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* care profile */}
          <div className="lh-card" style={{ padding: 20 }}>
            <div className="lh-sechead">
              <ShieldCheck size={17} color={C.sub} /> Care profile{" "}
              <button className="lh-mini" onClick={() => setModal("profile")}>
                <Edit3 size={13} /> Edit
              </button>
            </div>
            <Info2 label="Conditions" val={care.conditions.length ? care.conditions.join(", ") : "None recorded"} />
            <Info2
              label="Allergies"
              val={care.allergies || "None recorded"}
              warn={!!care.allergies && care.allergies !== "None recorded"}
            />
            <Info2 label="Blood group" val={m.bloodGroup || "—"} />
            <Info2 label="Primary doctor" val={care.doctor || "—"} />
            <Info2 label="Emergency contact" val={care.emergency || "—"} />
          </div>

          <div
            className="lh-card"
            style={{
              padding: 16,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              background: C.emerald + "10",
              borderColor: C.emerald + "26",
            }}
          >
            <ShieldCheck size={16} color={C.emerald} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: C.sub }}>
              Encrypted on your device. This profile doubles as an emergency card for {m.name}.
            </span>
          </div>
        </div>
      </div>

      {/* modals */}
      <AnimatePresence>
        {modal === "reading" && (
          <LogReading
            member={m}
            vitals={vitals}
            onClose={() => setModal(null)}
            save={(k: string, r: Omit<LabLog, "id" | "memberId" | "metric">) => {
              s.addLab({ id: uid(), memberId: sel, metric: k, ...r });
              toast("Reading logged");
              setModal(null);
            }}
          />
        )}
        {modal === "member" && (
          <AddMember
            onClose={() => setModal(null)}
            save={(mm: Member, careInit?: Partial<CareProfile>) => {
              s.addMember(mm);
              if (careInit) s.updateCare(mm.id, careInit);
              setSel(mm.id);
              toast("Member added");
              setModal(null);
            }}
          />
        )}
        {modal === "med" && (
          <AddMed
            onClose={() => setModal(null)}
            save={(md: Omit<Medication, "id" | "memberId">) => {
              s.addMed({ id: uid(), memberId: sel, ...md });
              toast("Medication added");
              setModal(null);
            }}
          />
        )}
        {modal === "reminder" && (
          <AddReminder
            onClose={() => setModal(null)}
            save={(r: Omit<Reminder, "id" | "memberId" | "done">) => {
              s.addReminder({ id: uid(), memberId: sel, done: false, ...r });
              toast("Reminder added");
              setModal(null);
            }}
          />
        )}
        {modal === "profile" && (
          <EditProfile
            member={m}
            care={care}
            onClose={() => setModal(null)}
            save={(carePatch: Partial<CareProfile>, memberPatch?: Partial<Member>) => {
              s.updateCare(sel, carePatch);
              if (memberPatch) s.updateMember(sel, memberPatch);
              toast("Profile updated");
              setModal(null);
            }}
          />
        )}
      </AnimatePresence>

      {!extToast && (
        <AnimatePresence>
          {localToast && (
            <motion.div
              className="lh-toast"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <CheckCircle2 size={17} color={C.emerald} /> {localToast}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <div id="lh-print" dangerouslySetInnerHTML={{ __html: printHTML }} />
    </div>
  );
}

/* ── small components ── */
const Empty = ({ t }: any) => <div style={{ fontSize: 13, color: C.faint, padding: "8px 0" }}>{t}</div>;
const Info2 = ({ label, val, warn }: any) => (
  <div className="lh-info">
    <span style={{ fontSize: 13, color: C.faint }}>{label}</span>
    <span style={{ fontSize: 13.5, color: warn ? C.red : C.text, fontWeight: warn ? 600 : 500, textAlign: "right" }}>
      {val}
    </span>
  </div>
);
function Spark({ arr, c }: { arr: LabLog[]; c: string }) {
  if (!arr || arr.length < 2) return <div style={{ height: 34 }} />;
  const vs = arr.map((x) => x.value),
    max = Math.max(...vs),
    min = Math.min(...vs);
  const w = 100,
    h = 34,
    step = w / (arr.length - 1);
  const pts = arr
    .map((x, i) => `${i * step},${h - 4 - (max === min ? h / 2 : ((x.value - min) / (max - min)) * (h - 8))}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 34 }} preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${c}88)` }}
      />
    </svg>
  );
}
const StatusPill = ({ s }: { s: Status }) => (
  <span
    style={{
      fontFamily: "'JetBrains Mono',monospace",
      fontSize: 11,
      fontWeight: 600,
      color: SM[s].c,
      background: SM[s].c + "20",
      border: `1px solid ${SM[s].c}33`,
      padding: "3px 9px",
      borderRadius: 20,
    }}
  >
    {SM[s].label}
  </span>
);
function Modal({ title, onClose, children }: any) {
  return (
    <div className="lh-overlay" onClick={onClose}>
      <motion.div
        className="lh-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 className="lh-h2" style={{ fontSize: 18 }}>
            {title}
          </h3>
          <button className="lh-x" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
const Lbl = ({ children }: any) => <div className="lh-lbl">{children}</div>;

/* ── forms ── */
function LogReading({ member, vitals, onClose, save }: any) {
  const keys = Object.keys(METRICS);
  const [k, setK] = useState(Object.keys(vitals)[0] || "HbA1c");
  const [v, setV] = useState("");
  const [d, setD] = useState("");
  const [date, setDate] = useState(today());
  const isBP = METRICS[k].bp;
  return (
    <Modal title={`Log a reading for ${member.name}`} onClose={onClose}>
      <Lbl>Metric</Lbl>
      <div className="lh-pick">
        {keys.map((kk) => (
          <button key={kk} className={"lh-pk" + (k === kk ? " on" : "")} onClick={() => setK(kk)}>
            {kk}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <div style={{ flex: 1 }}>
          <Lbl>
            {isBP ? "Systolic" : "Value"} ({METRICS[k].unit})
          </Lbl>
          <input className="lh-in" type="number" value={v} onChange={(e) => setV(e.target.value)} placeholder="0" />
        </div>
        {isBP && (
          <div style={{ flex: 1 }}>
            <Lbl>Diastolic</Lbl>
            <input className="lh-in" type="number" value={d} onChange={(e) => setD(e.target.value)} placeholder="0" />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <Lbl>Date</Lbl>
          <input className="lh-in" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: C.faint, marginTop: 10 }}>
        Reference: {METRICS[k].ref}. LifePack only records the number you enter.
      </div>
      <button
        className="lh-btn"
        style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
        disabled={!v}
        onClick={() => {
          const val = parseFloat(v);
          if (isNaN(val)) return;
          save(k, { value: val, unit: METRICS[k].unit, date, ...(isBP ? { value2: parseFloat(d) || 0 } : {}) });
        }}
      >
        Save reading
      </button>
    </Modal>
  );
}
function AddMember({ onClose, save }: any) {
  const [f, setF] = useState({ name: "", relation: "Parent", dob: "1960-01-01", bloodGroup: "O+" });
  const colors = ["#6E8BFF", "#2FB68A", "#F472B6", "#A78BFA", "#D8B25A"];
  return (
    <Modal title="Add a family member" onClose={onClose}>
      <Lbl>Name</Lbl>
      <input
        className="lh-in"
        value={f.name}
        onChange={(e) => setF({ ...f, name: e.target.value })}
        placeholder="e.g. Lakshmi"
      />
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <Lbl>Relation</Lbl>
          <select className="lh-in" value={f.relation} onChange={(e) => setF({ ...f, relation: e.target.value })}>
            {["Self", "Spouse", "Father", "Mother", "Son", "Daughter", "Parent", "Other"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <Lbl>Blood group</Lbl>
          <select className="lh-in" value={f.bloodGroup} onChange={(e) => setF({ ...f, bloodGroup: e.target.value })}>
            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <Lbl>Date of birth</Lbl>
        <input className="lh-in" type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} />
      </div>
      <button
        className="lh-btn"
        style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
        disabled={!f.name}
        onClick={() => {
          const mid =
            f.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .slice(0, 10) + uid().slice(0, 3);
          save(
            {
              id: mid,
              name: f.name,
              relation: f.relation,
              color: colors[Math.floor(Math.random() * colors.length)],
              dob: f.dob,
              bloodGroup: f.bloodGroup,
            } as Member,
            { conditions: [], medications: [], allergies: "None recorded", doctor: "", emergency: "" },
          );
        }}
      >
        Create profile
      </button>
    </Modal>
  );
}
function AddMed({ onClose, save }: any) {
  const [f, setF] = useState({ name: "", dose: "", freq: "Once daily", refillBy: rel(30) });
  return (
    <Modal title="Add medication" onClose={onClose}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 2 }}>
          <Lbl>Name</Lbl>
          <input
            className="lh-in"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            placeholder="e.g. Metformin"
          />
        </div>
        <div style={{ flex: 1 }}>
          <Lbl>Dose</Lbl>
          <input
            className="lh-in"
            value={f.dose}
            onChange={(e) => setF({ ...f, dose: e.target.value })}
            placeholder="500 mg"
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <Lbl>Frequency</Lbl>
          <input className="lh-in" value={f.freq} onChange={(e) => setF({ ...f, freq: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <Lbl>Refill by</Lbl>
          <input
            className="lh-in"
            type="date"
            value={f.refillBy}
            onChange={(e) => setF({ ...f, refillBy: e.target.value })}
          />
        </div>
      </div>
      <button
        className="lh-btn"
        style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
        disabled={!f.name}
        onClick={() => save(f)}
      >
        Add medication
      </button>
    </Modal>
  );
}
function AddReminder({ onClose, save }: any) {
  const [f, setF] = useState<{ title: string; kind: ReminderKind; due: string }>({
    title: "",
    kind: "appointment",
    due: rel(14),
  });
  return (
    <Modal title="Add reminder" onClose={onClose}>
      <Lbl>Title</Lbl>
      <input
        className="lh-in"
        value={f.title}
        onChange={(e) => setF({ ...f, title: e.target.value })}
        placeholder="e.g. Cardiology follow-up"
      />
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <Lbl>Type</Lbl>
          <select
            className="lh-in"
            value={f.kind}
            onChange={(e) => setF({ ...f, kind: e.target.value as ReminderKind })}
          >
            {["appointment", "refill", "vaccination", "insurance", "other"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <Lbl>Due</Lbl>
          <input className="lh-in" type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />
        </div>
      </div>
      <button
        className="lh-btn"
        style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
        disabled={!f.title}
        onClick={() => save(f)}
      >
        Add reminder
      </button>
    </Modal>
  );
}
function EditProfile({ member, care, onClose, save }: any) {
  const [cond, setCond] = useState<string[]>(care.conditions);
  const [ci, setCi] = useState("");
  const [allergies, setAll] = useState(care.allergies || "");
  const [doctor, setDoc] = useState(care.doctor || "");
  const [emergency, setEm] = useState(care.emergency || "");
  const [blood, setBlood] = useState(member.bloodGroup || "");
  return (
    <Modal title={`Edit ${member.name}'s care profile`} onClose={onClose}>
      <Lbl>Conditions</Lbl>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0" }}>
        {cond.map((c, i) => (
          <span key={i} className="lh-cond">
            {c}
            <button onClick={() => setCond(cond.filter((_, j) => j !== i))}>
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="lh-in"
          value={ci}
          onChange={(e) => setCi(e.target.value)}
          placeholder="Add condition"
          onKeyDown={(e) => {
            if (e.key === "Enter" && ci.trim()) {
              setCond([...cond, ci.trim()]);
              setCi("");
            }
          }}
        />
        <button
          className="lh-btn-g"
          onClick={() => {
            if (ci.trim()) {
              setCond([...cond, ci.trim()]);
              setCi("");
            }
          }}
        >
          <Plus size={15} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 2 }}>
          <Lbl>Allergies</Lbl>
          <input className="lh-in" value={allergies} onChange={(e) => setAll(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <Lbl>Blood group</Lbl>
          <select className="lh-in" value={blood} onChange={(e) => setBlood(e.target.value)}>
            <option value="">—</option>
            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <Lbl>Primary doctor</Lbl>
        <input
          className="lh-in"
          value={doctor}
          onChange={(e) => setDoc(e.target.value)}
          placeholder="Dr. name, speciality"
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <Lbl>Emergency contact</Lbl>
        <input
          className="lh-in"
          value={emergency}
          onChange={(e) => setEm(e.target.value)}
          placeholder="Name (relation)"
        />
      </div>
      <button
        className="lh-btn"
        style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
        onClick={() => save({ conditions: cond, allergies, doctor, emergency }, { bloodGroup: blood || undefined })}
      >
        Save profile
      </button>
    </Modal>
  );
}

/* ── printable visit pack ── */
function buildVisitPack(
  m: Member | undefined,
  care: any,
  meds: Medication[],
  vitals: Record<string, LabLog[]>,
  records: Doc[],
) {
  if (!m) return "";
  const row = (a: string, b: string) =>
    `<tr><td style="padding:6px 12px;color:#6b7280;font-size:12px">${a}</td><td style="padding:6px 12px;font-weight:600">${b}</td></tr>`;
  const medList = meds.length
    ? meds.map((x) => `<li>${x.name} ${x.dose} — ${x.freq}</li>`).join("")
    : "<li>None recorded</li>";
  const vitalRows =
    Object.keys(vitals)
      .map((k) => {
        const arr = vitals[k];
        const l = arr[arr.length - 1];
        const st = METRICS[k].status(l.value, l.value2);
        const val = METRICS[k].bp ? `${l.value}/${l.value2}` : `${l.value} ${METRICS[k].unit}`;
        return `<tr><td style="padding:5px 12px">${k}</td><td style="padding:5px 12px;font-weight:600">${val}</td><td style="padding:5px 12px;color:#6b7280">${fmt(l.date)}</td><td style="padding:5px 12px">${SM[st].label}</td></tr>`;
      })
      .join("") || `<tr><td colspan="4" style="padding:8px 12px;color:#6b7280">No readings logged</td></tr>`;
  const recList = records.length
    ? records.map((r) => `<li>${r.name} — ${r.docType} (${fmt(r.docDate || r.addedAt)})</li>`).join("")
    : "<li>None</li>";
  const a = age(m.dob);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Visit Pack — ${m.name}</title></head>
<body style="font-family:Inter,Arial,sans-serif;color:#111827;max-width:720px;margin:24px auto;padding:0 20px">
<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #D8B25A;padding-bottom:12px">
<div><div style="font-weight:800;font-size:20px">LifePack AI · Visit Pack</div><div style="color:#6b7280;font-size:13px">Prepared ${new Date().toLocaleString("en-IN")}</div></div>
<div style="text-align:right"><div style="font-size:22px;font-weight:800">${m.name}</div><div style="color:#6b7280;font-size:13px">${m.relation}${a != null ? ` · ${a}y` : ""}${m.bloodGroup ? ` · Blood ${m.bloodGroup}` : ""}</div></div></div>
<table style="width:100%;margin-top:14px;border-collapse:collapse">${row("Conditions", (care.conditions || []).join(", ") || "None recorded")}${row("Allergies", care.allergies || "None recorded")}${row("Primary doctor", care.doctor || "—")}${row("Emergency contact", care.emergency || "—")}</table>
<h3 style="margin:18px 0 6px">Current medications</h3><ul style="margin:0;padding-left:20px;line-height:1.7">${medList}</ul>
<h3 style="margin:18px 0 6px">Recent readings</h3><table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="background:#f3f4f6"><th style="text-align:left;padding:6px 12px">Metric</th><th style="text-align:left;padding:6px 12px">Value</th><th style="text-align:left;padding:6px 12px">Date</th><th style="text-align:left;padding:6px 12px">Vs range</th></tr>${vitalRows}</table>
<h3 style="margin:18px 0 6px">Records on file</h3><ul style="margin:0;padding-left:20px;line-height:1.7">${recList}</ul>
<p style="margin-top:22px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px">Prepared with LifePack AI. This sheet organizes information entered by the family. It is not a medical document, diagnosis, or advice. Reference ranges are standard published values; confirm all details with your doctor.</p>
</body></html>`;
}

/* ── styles ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
.lh-root{font-family:'Inter',system-ui,sans-serif;color:${C.text}}
.lh-root *{box-sizing:border-box}
.lh-head{margin-bottom:22px}
.lh-eyebrow{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${C.gold};margin-bottom:8px}
.lh-h1{font-family:'Space Grotesk';font-weight:700;font-size:27px;letter-spacing:-.5px;margin:0;color:${C.text}}
.lh-h2{font-family:'Space Grotesk';font-weight:700;margin:0;color:${C.text}}
.lh-mono{font-family:'JetBrains Mono',monospace}
.lh-card{background:${C.panel};border:1px solid ${C.border};border-radius:18px;backdrop-filter:blur(6px)}
.lh-insight{background:linear-gradient(180deg,rgba(216,178,90,.06),${C.panel})}
.lh-members{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px}
.lh-mcard{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;border:1px solid ${C.border};background:${C.panel2};cursor:pointer;flex-shrink:0;transition:.15s}
.lh-mcard:hover{background:rgba(255,255,255,.08)}
.lh-mcard.on{box-shadow:0 0 0 1px currentColor}
.lh-add{border-style:dashed}
.lh-avatar{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;font-weight:700;font-size:16px;border:1px solid;flex-shrink:0;font-family:'Space Grotesk'}
.lh-avatar.lg{width:52px;height:52px;font-size:22px;border-radius:14px}
.lh-badge{margin-left:2px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;display:grid;place-items:center;font-size:12px;font-weight:700;font-family:'JetBrains Mono'}
.lh-attn{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid ${C.border}}
.lh-chip{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;color:${C.sub};background:${C.panel2};border:1px solid ${C.border};border-radius:20px;padding:6px 12px;cursor:pointer;font-family:inherit}
.lh-chip:hover{background:rgba(255,255,255,.08)}
.lh-mhead{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:18px}
.lh-btn{display:inline-flex;align-items:center;gap:7px;background:${C.gold};color:#0B0E24;font-weight:600;font-size:14px;border:0;border-radius:11px;padding:11px 17px;cursor:pointer;font-family:inherit;transition:.15s}
.lh-btn:hover{filter:brightness(1.06)}.lh-btn:disabled{opacity:.4;cursor:not-allowed}
.lh-btn-g{display:inline-flex;align-items:center;gap:7px;background:${C.panel2};color:${C.text};font-weight:600;font-size:14px;border:1px solid ${C.border};border-radius:11px;padding:11px 15px;cursor:pointer;font-family:inherit}
.lh-btn-g:hover{background:rgba(255,255,255,.09)}
.lh-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.lh-grid-2-1{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px}
.lh-sechead{display:flex;align-items:center;gap:8px;font-size:14.5px;font-weight:700;color:${C.text};margin-bottom:12px}
.lh-mini{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:600;color:${C.gold};background:${C.gold}18;border:1px solid ${C.gold}33;border-radius:8px;padding:4px 9px;cursor:pointer;font-family:inherit}
.lh-row{display:flex;align-items:center;gap:11px;padding:9px 0;border-top:1px solid ${C.border}}
.lh-row:first-of-type{border-top:0}
.lh-rec{position:relative;display:flex;align-items:center;gap:11px;padding:9px 0;width:100%;background:0;border:0;border-top:1px solid ${C.border};cursor:pointer;font-family:inherit}
.lh-rec:first-of-type{border-top:0}
.lh-ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}
.lh-ib{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;border:1px solid ${C.border};background:transparent;cursor:pointer;flex-shrink:0}
.lh-ib:hover{background:rgba(255,255,255,.06)}
.lh-tag{font-family:'JetBrains Mono';font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px}
.lh-info{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid ${C.border}}
.lh-info:first-of-type{border-top:0}
.lh-lbl{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:${C.faint};font-family:'JetBrains Mono';margin-bottom:5px}
.lh-in{width:100%;background:${C.panel2};border:1px solid ${C.border};border-radius:10px;padding:9px 11px;color:${C.text};font-size:14px;outline:none;font-family:inherit}
.lh-in:focus{border-color:${C.gold}}
.lh-overlay{position:fixed;inset:0;z-index:60;background:rgba(4,6,15,.62);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:18px}
.lh-modal{background:#111524;border:1px solid ${C.border};border-radius:18px;width:min(460px,100%);padding:22px;max-height:90vh;overflow:auto}
.lh-x{width:32px;height:32px;border-radius:9px;border:1px solid ${C.border};background:${C.panel2};color:${C.text};cursor:pointer;display:grid;place-items:center}
.lh-pick{display:flex;flex-wrap:wrap;gap:6px}
.lh-pk{font-size:12.5px;font-weight:600;color:${C.sub};background:${C.panel2};border:1px solid ${C.border};border-radius:8px;padding:6px 10px;cursor:pointer;font-family:inherit}
.lh-pk.on{color:#0B0E24;background:${C.gold};border-color:${C.gold}}
.lh-cond{display:inline-flex;align-items:center;gap:5px;font-size:13px;color:${C.text};background:${C.panel2};border:1px solid ${C.border};border-radius:20px;padding:4px 10px}
.lh-cond button{background:0;border:0;color:${C.faint};cursor:pointer;display:inline-flex}
.lh-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:80;background:#111524;border:1px solid ${C.border};color:${C.text};padding:12px 20px;border-radius:12px;font-size:14px;font-weight:500;display:flex;align-items:center;gap:10px;box-shadow:0 16px 50px rgba(0,0,0,.5)}
#lh-print{display:none}
@media(max-width:900px){.lh-grid3{grid-template-columns:1fr}.lh-grid-2-1{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media print{body *{visibility:hidden}#lh-print,#lh-print *{visibility:visible}#lh-print{display:block;position:absolute;inset:0}}
`;
