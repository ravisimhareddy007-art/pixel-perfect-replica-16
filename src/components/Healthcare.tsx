import { useState, useMemo, useRef } from "react";
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
  Activity,
  HeartPulse,
  Camera,
  Image as ImageIcon,
  Upload,
  ClipboardList,
  AlertTriangle,
  Check,
  IdCard,
} from "lucide-react";
import { useStore } from "../lib/store";
import type { Doc, Member, LabLog, Medication, ReminderKind } from "../lib/types";

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
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (s?: string) =>
  s ? new Date(s).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const mon = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", year: "numeric" });
const daysTo = (s: string) => Math.ceil((+new Date(s) - Date.now()) / 86400000);
const age = (dob?: string) => (dob ? Math.floor((Date.now() - +new Date(dob)) / (365.25 * 86400000)) : null);

/* ── reference ranges (standard published values) ── */
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
      ref: "under 130/85 in range",
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
const KIND: Record<string, { icon: any; c: string; label: string }> = {
  reading: { icon: Activity, c: C.cyan, label: "Reading" },
  prescription: { icon: PillIcon, c: C.violet, label: "Prescription" },
  lab_report: { icon: FlaskConical, c: C.pink, label: "Lab report" },
  discharge: { icon: Stethoscope, c: C.emerald, label: "Consultation" },
  scan: { icon: ClipboardList, c: C.gold, label: "Scan" },
  other: { icon: ClipboardList, c: C.faint, label: "Record" },
};
const sortR = (a: LabLog, b: LabLog) => a.date.localeCompare(b.date);
const statusOf = (metric: string, r: LabLog[]): Status => {
  if (!r.length) return "none";
  const l = r[r.length - 1];
  return METRICS[metric].status(l.value, l.value2);
};

/* intent-based record types: people think "I have a blood report", not "upload" */
const RECORD_TYPES: { label: string; short: string; icon: any; c: string; override: Partial<Doc> }[] = [
  {
    label: "Add prescription",
    short: "Prescription",
    icon: PillIcon,
    c: C.violet,
    override: { category: "Medical", docType: "Prescription", medType: "prescription" },
  },
  {
    label: "Add blood report",
    short: "Blood report",
    icon: FlaskConical,
    c: C.pink,
    override: { category: "Medical", docType: "Lab Report", medType: "lab_report" },
  },
  {
    label: "Add scan",
    short: "Scan",
    icon: ClipboardList,
    c: C.gold,
    override: { category: "Medical", docType: "Scan / Imaging", medType: "scan" },
  },
  {
    label: "Add vaccine record",
    short: "Vaccine record",
    icon: Syringe,
    c: C.emerald,
    override: { category: "Medical", docType: "Vaccination Record", medType: "other" },
  },
  {
    label: "Add discharge",
    short: "Discharge summary",
    icon: Stethoscope,
    c: C.cyan,
    override: { category: "Medical", docType: "Discharge Summary", medType: "discharge" },
  },
];

export default function Healthcare({ toast: extToast }: { toast?: (m: string) => void }) {
  const s = useStore();
  const [localToast, setLocalToast] = useState<string | null>(null);
  const toast = (m: string) => {
    if (extToast) extToast(m);
    else {
      setLocalToast(m);
      window.clearTimeout((toast as any)._t);
      (toast as any)._t = window.setTimeout(() => setLocalToast(null), 2200);
    }
  };

  const [sel, setSel] = useState(s.members[0]?.id || "you");
  const [tab, setTab] = useState<"overview" | "timeline" | "meds" | "records">("overview");
  const [modal, setModal] = useState<
    null | "reading" | "member" | "med" | "reminder" | "profile" | "emergency" | "visit"
  >(null);
  const [printHTML, setPrintHTML] = useState("");
  const recRef = useRef<HTMLInputElement>(null);
  const pendingRec = useRef<{ override: Partial<Doc>; label: string } | null>(null);

  const m = s.members.find((x) => x.id === sel) || s.members[0];
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
    Object.values(map).forEach((a) => a.sort(sortR));
    return map;
  }, [s.labs, sel]);

  const timeline = useMemo(() => {
    const ev: { date: string; kind: string; title: string; detail: string }[] = [];
    s.labs
      .filter((l) => l.memberId === sel)
      .forEach((l) =>
        ev.push({
          date: l.date,
          kind: "reading",
          title: `${l.metric} ${METRICS[l.metric]?.bp ? `${l.value}/${l.value2}` : l.value}${METRICS[l.metric] ? " " + METRICS[l.metric].unit : ""}`,
          detail: "Reading logged",
        }),
      );
    records.forEach((d) =>
      ev.push({
        date: (d.docDate || d.addedAt).slice(0, 10),
        kind: d.medType || "other",
        title: d.docType,
        detail: d.name,
      }),
    );
    return ev.sort((a, b) => b.date.localeCompare(a.date));
  }, [s.labs, records, sel]);

  const attentionOf = (mid: string) => {
    let n = 0;
    s.reminders.forEach((r) => {
      if (r.memberId === mid && !r.done && daysTo(r.due) <= 30) n++;
    });
    const byM: Record<string, LabLog[]> = {};
    s.labs.filter((l) => l.memberId === mid && METRICS[l.metric]).forEach((l) => (byM[l.metric] ||= []).push(l));
    Object.keys(byM).forEach((k) => {
      byM[k].sort(sortR);
      if (statusOf(k, byM[k]) === "out") n++;
    });
    return n;
  };
  const totalAttention = s.members.reduce((t, mm) => t + attentionOf(mm.id), 0);
  const familyAttn = s.members
    .map((mm) => {
      const r = s.reminders
        .filter((x) => x.memberId === mm.id && !x.done && daysTo(x.due) <= 30)
        .sort((a, b) => a.due.localeCompare(b.due))[0];
      return r ? { mm, txt: `${r.title} in ${daysTo(r.due)}d` } : null;
    })
    .filter(Boolean) as { mm: Member; txt: string }[];

  const summary = useMemo(() => {
    let visits = 0,
      refills = 0,
      vaccinations = 0,
      renewals = 0,
      outRange = 0;
    const attn = new Set<string>();
    s.reminders.forEach((r) => {
      if (r.done) return;
      const dd = daysTo(r.due);
      if (r.kind === "appointment" && dd <= 45) {
        visits++;
        attn.add(r.memberId);
      } else if (r.kind === "refill" && dd <= 30) {
        refills++;
        attn.add(r.memberId);
      } else if (r.kind === "vaccination" && dd <= 60) {
        vaccinations++;
        attn.add(r.memberId);
      } else if (r.kind === "insurance" && dd <= 45) {
        renewals++;
        attn.add(r.memberId);
      }
    });
    s.members.forEach((mm) => {
      const by: Record<string, LabLog[]> = {};
      s.labs.filter((l) => l.memberId === mm.id && METRICS[l.metric]).forEach((l) => (by[l.metric] ||= []).push(l));
      Object.keys(by).forEach((k) => {
        by[k].sort(sortR);
        if (statusOf(k, by[k]) === "out") {
          outRange++;
          attn.add(mm.id);
        }
      });
    });
    return {
      actions: visits + refills + vaccinations + renewals + outRange,
      visits,
      refills,
      vaccinations,
      renewals,
      outRange,
      upToDate: s.members.length - attn.size,
      count: s.members.length,
    };
  }, [s.reminders, s.labs, s.members]);

  const nextVisit = useMemo(
    () =>
      s.reminders
        .filter((r) => r.memberId === sel && !r.done && r.kind === "appointment")
        .sort((a, b) => a.due.localeCompare(b.due))[0],
    [s.reminders, sel],
  );
  const lastRecord = records[0];
  const changedLine = useMemo(() => {
    const outs: string[] = [];
    Object.keys(vitals).forEach((k) => {
      const arr = vitals[k];
      if (arr.length < 2 || k === "Weight") return;
      const st = statusOf(k, arr);
      const l = arr[arr.length - 1],
        f = arr[0];
      if (st === "out" || st === "watch") {
        const dir = l.value > f.value ? "up" : "down";
        outs.push(`${k} ${dir} to ${METRICS[k].bp ? `${l.value}/${l.value2}` : l.value}`);
      }
    });
    return outs.length ? outs.slice(0, 2).join(", ") : "Readings holding in range";
  }, [vitals]);

  const insight = useMemo(() => {
    const parts: string[] = [];
    Object.keys(vitals).forEach((k) => {
      const arr = vitals[k];
      if (arr.length < 2 || k === "Weight") return;
      const l = arr[arr.length - 1],
        f = arr[0];
      const st = statusOf(k, arr);
      const dir = l.value > f.value ? "risen" : l.value < f.value ? "eased" : "held steady";
      const val = METRICS[k].bp ? `${l.value}/${l.value2}` : `${l.value} ${METRICS[k].unit}`;
      const rng =
        st === "out"
          ? "above the standard reference range"
          : st === "watch"
            ? "near the upper edge of the standard range"
            : "within the standard range";
      parts.push(`${k} has ${dir} across ${m?.name.split(" ")[0]}'s last ${arr.length} readings to ${val}, ${rng}.`);
    });
    if (!parts.length)
      return `No tracked readings yet for ${m?.name.split(" ")[0]}. Use "Log a reading" to build a factual trend.`;
    return parts
      .sort((a) => (a.includes("above") ? -1 : 1))
      .slice(0, 3)
      .join(" ");
  }, [vitals, m]);

  const visitHTML = useMemo(
    () => buildVisitPack(m, care, meds, vitals, records, s.docs),
    [m, care, meds, vitals, records, s.docs],
  );
  const emergHTML = useMemo(() => buildEmergency(m, care, meds, s.docs), [m, care, meds, s.docs]);
  const doExport = (html: string, name: string) => {
    const b = new Blob([html], { type: "text/html" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = name;
    a.click();
    URL.revokeObjectURL(u);
  };
  const doPrint = (html: string) => {
    setPrintHTML(html);
    setTimeout(() => window.print(), 60);
  };

  if (!m)
    return (
      <div className="lh-root">
        <style>{CSS}</style>
        <p style={{ color: C.sub }}>No family members yet.</p>
      </div>
    );

  return (
    <div className="lh-root">
      <style>{CSS}</style>
      <div className="lh-head">
        <h1 className="lh-h1">Health</h1>
        <p style={{ color: C.sub, fontSize: 14.5, marginTop: 4 }}>
          Keep the whole family visit-ready. LifePack organizes and surfaces your records. It never diagnoses.
        </p>
      </div>

      {/* calm family line */}
      <div className="lh-famline">
        <span className="lh-famtitle">
          <Users size={15} color={C.sub} /> Family health
        </span>
        <span className="lh-famsum">
          {summary.actions
            ? `${summary.actions} to handle · ${summary.upToDate} of ${summary.count} up to date`
            : "everyone up to date"}
        </span>
      </div>

      {/* compact member switcher */}
      <div className="lh-switch">
        {s.members.map((mm) => {
          const a = attentionOf(mm.id),
            on = sel === mm.id;
          return (
            <button
              key={mm.id}
              className={"lh-mm" + (on ? " on" : "")}
              onClick={() => {
                setSel(mm.id);
                setTab("overview");
              }}
              title={mm.name}
            >
              <span
                className="lh-av"
                style={{ background: mm.color + "26", color: mm.color, borderColor: on ? mm.color : "transparent" }}
              >
                {mm.name[0]}
                {a > 0 && <span className="lh-dot" style={{ background: C.gold }} />}
              </span>
              <span className="lh-nm" style={{ color: on ? C.text : C.sub }}>
                {mm.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
        <button className="lh-mm lh-addm" onClick={() => setModal("member")}>
          <span className="lh-av" style={{ borderStyle: "dashed", borderColor: C.border }}>
            <UserPlus size={16} color={C.gold} />
          </span>
          <span className="lh-nm" style={{ color: C.sub }}>
            Add
          </span>
        </button>
      </div>
      {familyAttn.length > 0 && (
        <div className="lh-attnrow">
          {familyAttn.slice(0, 4).map((x, i) => (
            <button key={i} className="lh-chip" onClick={() => setSel(x.mm.id)}>
              <span style={{ width: 6, height: 6, borderRadius: 9, background: x.mm.color }} />
              <b style={{ color: C.text }}>{x.mm.name.split(" ")[0]}:</b> {x.txt}
            </button>
          ))}
        </div>
      )}

      {/* selected member — visit companion hero */}
      <div className="lh-hero">
        <div className="lh-herotop">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              className="lh-av lg"
              style={{ background: m.color + "26", color: m.color, borderColor: m.color + "55" }}
            >
              {m.name[0]}
            </span>
            <div>
              <h2 className="lh-h2" style={{ fontSize: 21 }}>
                {m.name}
              </h2>
              <div style={{ fontSize: 13, color: C.sub, display: "flex", gap: 8, flexWrap: "wrap", marginTop: 3 }}>
                <span>{m.relation}</span>
                {age(m.dob) != null && <span>· {age(m.dob)}</span>}
                {m.bloodGroup && <span>· {m.bloodGroup}</span>}
                {care.doctor && <span>· {care.doctor}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <button className="lh-btn" onClick={() => setModal("visit")}>
              <ClipboardList size={16} /> Prepare for visit
            </button>
            <button className="lh-btn-g" onClick={() => setModal("emergency")}>
              <IdCard size={16} /> Emergency card
            </button>
            <button className="lh-btn-g" onClick={() => setModal("reading")}>
              <Plus size={16} /> Log reading
            </button>
          </div>
        </div>
        <div className="lh-heronext">
          <CalendarClock size={15} color={C.gold} />
          <span style={{ fontSize: 14, color: C.text }}>
            <b style={{ fontWeight: 600 }}>
              {nextVisit ? `${nextVisit.title} · in ${daysTo(nextVisit.due)} days` : "No visit scheduled"}
            </b>
            {nextVisit ? ` · ${fmt(nextVisit.due)}` : ""}
          </span>
        </div>
        <div className="lh-herometa">
          Bring {meds.length} medication{meds.length !== 1 ? "s" : ""},{" "}
          {records.filter((r) => r.medType === "lab_report").length} recent report
          {records.filter((r) => r.medType === "lab_report").length !== 1 ? "s" : ""}
          {insuranceOf(m, s.docs) ? ", insurance card" : ""} · {changedLine}
        </div>
      </div>

      {/* tabs */}
      <div className="lh-tabs">
        {(
          [
            ["overview", "Overview", HeartPulse],
            ["timeline", "Timeline", CalendarClock],
            ["meds", "Medications", PillIcon],
            ["records", "Records", Stethoscope],
          ] as const
        ).map(([k, label, Ic]) => (
          <button key={k} className={"lh-tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
            <Ic size={15} /> {label}
            {k === "meds" && meds.length > 0 && <span className="lh-tc">{meds.length}</span>}
            {k === "records" && records.length > 0 && <span className="lh-tc">{records.length}</span>}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="lh-pane">
          <div className="lh-card lh-insight" style={{ padding: 18, marginBottom: 16 }}>
            <div className="lh-eyebrow" style={{ marginBottom: 8 }}>
              Summary of readings
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.6, color: C.text, margin: 0 }}>{insight}</p>
            <p
              style={{
                fontSize: 12.5,
                color: C.faint,
                marginTop: 12,
                display: "flex",
                gap: 7,
                alignItems: "flex-start",
              }}
            >
              <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} /> Restates your own logged numbers against
              standard published reference ranges. Not medical advice or a diagnosis.
            </p>
          </div>
          <div className="lh-grid3" style={{ marginBottom: 16 }}>
            {Object.keys(vitals).length === 0 && (
              <div className="lh-card" style={{ padding: 20, color: C.faint, fontSize: 13.5 }}>
                No readings tracked yet.
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
                <div key={k} className="lh-card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: C.sub }}>{k}</span>
                    <Tr size={15} color={delta === 0 ? C.faint : delta > 0 ? C.red : C.emerald} />
                  </div>
                  <div className="lh-h2" style={{ fontSize: 27, margin: "6px 0 6px" }}>
                    {METRICS[k].bp ? `${l.value}/${l.value2}` : l.value}
                    <span style={{ fontSize: 14, color: C.sub, fontWeight: 500 }}> {METRICS[k].unit}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <Spark arr={arr} c={SM[st].c === C.faint ? C.cyan : SM[st].c} />
                    </div>
                    <StatusPill s={st} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="lh-grid-2-1">
            <div className="lh-card" style={{ padding: 20 }}>
              <div className="lh-sechead">
                <Bell size={16} color={C.sub} /> Reminders{" "}
                <button className="lh-mini" onClick={() => setModal("reminder")}>
                  <Plus size={13} /> Add
                </button>
              </div>
              {reminders.length === 0 ? (
                <Empty t="Nothing due." />
              ) : (
                reminders.map((r) => {
                  const Ic =
                    (
                      {
                        refill: RefreshCw,
                        appointment: CalendarClock,
                        insurance: ShieldCheck,
                        vaccination: Syringe,
                        other: Bell,
                      } as any
                    )[r.kind] || CalendarClock;
                  const dd = daysTo(r.due);
                  return (
                    <div key={r.id} className="lh-row">
                      <span className="lh-ic" style={{ background: C.gold + "1f" }}>
                        <Ic size={15} color={C.gold} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: dd < 7 ? C.gold : C.faint }}>
                          {dd < 0 ? "overdue" : dd === 0 ? "today" : `in ${dd} days`}
                        </div>
                      </div>
                      <button
                        className="lh-ib"
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
            <div className="lh-card" style={{ padding: 20 }}>
              <div className="lh-sechead">
                <ShieldCheck size={16} color={C.sub} /> Care profile{" "}
                <button className="lh-mini" onClick={() => setModal("profile")}>
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              <Info2 label="Conditions" val={care.conditions.length ? care.conditions.join(", ") : "None recorded"} />
              <Info2
                label="Allergies"
                val={care.allergies || "None recorded"}
                warn={!!care.allergies && care.allergies !== "None recorded"}
              />
              <Info2 label="Blood group" val={m.bloodGroup || "—"} />
              <Info2 label="Emergency" val={care.emergency || "—"} />
            </div>
          </div>
        </div>
      )}

      {/* ── TIMELINE ── */}
      {tab === "timeline" && (
        <div className="lh-pane">
          <div className="lh-card" style={{ padding: 22 }}>
            <div className="lh-sechead">
              <CalendarClock size={16} color={C.sub} /> Health timeline
            </div>
            {timeline.length === 0 ? (
              <Empty t="No history yet. Logged readings and uploaded records appear here as a story." />
            ) : (
              <div className="lh-tl">
                {timeline.map((e, i) => {
                  const K = KIND[e.kind] || KIND.other;
                  const Ic = K.icon;
                  const showMon = i === 0 || mon(e.date) !== mon(timeline[i - 1].date);
                  return (
                    <div key={i}>
                      {showMon && <div className="lh-tlmon">{mon(e.date)}</div>}
                      <div className="lh-tlrow">
                        <span className="lh-tldot" style={{ background: K.c, boxShadow: `0 0 7px ${K.c}` }} />
                        <span className="lh-ic" style={{ background: K.c + "22" }}>
                          <Ic size={15} color={K.c} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{e.title}</div>
                          <div style={{ fontSize: 12, color: C.faint }}>
                            {K.label} · {e.detail}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: C.faint, whiteSpace: "nowrap" }}>{fmt(e.date)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MEDICATIONS (adherence) ── */}
      {tab === "meds" && (
        <div className="lh-pane">
          <div className="lh-card" style={{ padding: 20 }}>
            <div className="lh-sechead">
              <PillIcon size={16} color={C.sub} /> Medications{" "}
              <button className="lh-mini" onClick={() => setModal("med")}>
                <Plus size={13} /> Add
              </button>
            </div>
            {meds.length === 0 ? (
              <Empty t="No medications recorded." />
            ) : (
              meds.map((med) => {
                const takenToday = (med.taken || []).includes(today());
                const missedYest =
                  !(med.taken || []).includes(rel(-1)) && /dai|once|twice|morning|night/i.test(med.freq);
                const rf = daysTo(med.refillBy);
                const low = typeof med.remaining === "number" && med.remaining <= 7;
                return (
                  <div key={med.id} className="lh-med">
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <span className="lh-ic" style={{ background: C.violet + "22" }}>
                        <PillIcon size={16} color={C.violet} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: C.text }}>
                          {med.name} <span style={{ color: C.sub, fontWeight: 400 }}>{med.dose}</span>
                        </div>
                        <div style={{ fontSize: 12, color: C.faint }}>
                          {med.freq}
                          {typeof med.remaining === "number" ? ` · ${med.remaining} left` : ""}
                          {" · refill "}
                          {fmt(med.refillBy)}
                        </div>
                      </div>
                      {low && (
                        <span className="lh-tag" style={{ color: C.gold, background: C.gold + "1f" }}>
                          low stock
                        </span>
                      )}
                      {rf < 0 && (
                        <span className="lh-tag" style={{ color: C.red, background: C.red + "1f" }}>
                          refill due
                        </span>
                      )}
                    </div>
                    <div className="lh-adhere">
                      {takenToday ? (
                        <span className="lh-taken">
                          <CheckCircle2 size={15} color={C.emerald} /> Taken today
                        </span>
                      ) : (
                        <button
                          className="lh-take"
                          onClick={() => {
                            s.markTaken(med.id);
                            toast("Logged as taken");
                          }}
                        >
                          <Check size={14} /> Mark taken
                        </button>
                      )}
                      {!takenToday && missedYest && (
                        <span style={{ fontSize: 12, color: C.red }}>missed yesterday</span>
                      )}
                      <button
                        className="lh-lnk"
                        onClick={() => {
                          s.refillMed(med.id, 30, 30);
                          toast("Refill logged");
                        }}
                      >
                        <RefreshCw size={13} /> Refill
                      </button>
                      <button className="lh-ib" style={{ marginLeft: "auto" }} onClick={() => s.removeMed(med.id)}>
                        <Trash2 size={14} color={C.faint} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── RECORDS (upload / scan / gallery) ── */}
      {tab === "records" && (
        <div className="lh-pane">
          <div className="lh-card" style={{ padding: 20 }}>
            <div className="lh-sechead">
              <Stethoscope size={16} color={C.sub} /> Records
            </div>
            <div className="lh-uprow">
              {RECORD_TYPES.map((rt) => (
                <button
                  key={rt.label}
                  className="lh-up"
                  onClick={() => {
                    pendingRec.current = { override: rt.override, label: rt.short };
                    recRef.current?.click();
                  }}
                >
                  <rt.icon size={16} color={rt.c} /> {rt.label}
                </button>
              ))}
              <input
                ref={recRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files?.length) {
                    const pen = pendingRec.current;
                    s.addFiles(e.target.files, sel, pen?.override);
                    toast(`${pen?.label || "Record"} added`);
                  }
                  pendingRec.current = null;
                  e.currentTarget.value = "";
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: C.faint, marginBottom: 6 }}>
              Pick what it is; LifePack files it and drops a copy into Documents. On mobile you can snap a photo or
              choose from gallery.
            </div>
            {records.length === 0 ? (
              <Empty t="No records yet. Upload, scan, or pick from gallery. Each one also lands in Documents." />
            ) : (
              <div style={{ position: "relative", paddingLeft: 18, marginTop: 6 }}>
                <div style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 1, background: C.border }} />
                {records.map((r) => {
                  const K = KIND[r.medType || "other"] || KIND.other;
                  const Ic = K.icon;
                  return (
                    <div key={r.id} className="lh-rec">
                      <span
                        style={{
                          position: "absolute",
                          left: -17,
                          top: 14,
                          width: 9,
                          height: 9,
                          borderRadius: 9,
                          background: K.c,
                          boxShadow: `0 0 7px ${K.c}`,
                        }}
                      />
                      <span className="lh-ic" style={{ background: K.c + "22" }}>
                        <Ic size={15} color={K.c} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: C.faint }}>
                          {r.docType} · {fmt(r.docDate || r.addedAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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
            save={(mm: Member) => {
              s.addMember(mm);
              s.updateCare(mm.id, {
                conditions: [],
                medications: [],
                allergies: "None recorded",
                doctor: "",
                emergency: "",
              });
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
            save={(r: { title: string; kind: ReminderKind; due: string }) => {
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
            save={(cp: any, mp: any) => {
              s.updateCare(sel, cp);
              if (mp) s.updateMember(sel, mp);
              toast("Profile updated");
              setModal(null);
            }}
          />
        )}
        {modal === "emergency" && (
          <SheetModal
            title="Emergency card"
            onClose={() => setModal(null)}
            html={emergHTML}
            onExport={() => {
              doExport(emergHTML, `EmergencyCard_${m.name}.html`);
              toast("Emergency card exported");
            }}
            onPrint={() => doPrint(emergHTML)}
          />
        )}
        {modal === "visit" && (
          <SheetModal
            title="Doctor visit pack"
            onClose={() => setModal(null)}
            html={visitHTML}
            onExport={() => {
              doExport(visitHTML, `VisitPack_${m.name}.html`);
              toast("Visit pack exported");
            }}
            onPrint={() => doPrint(visitHTML)}
            primary
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
const Empty = ({ t }: any) => <div style={{ fontSize: 13, color: C.faint, padding: "10px 0" }}>{t}</div>;
const Stat = ({ n, label, c }: any) => (
  <div className="lh-stat">
    <span className="lh-statn" style={{ color: c }}>
      {n}
    </span>
    <span className="lh-statl">{label}</span>
  </div>
);
const Info2 = ({ label, val, warn }: any) => (
  <div className="lh-info">
    <span style={{ fontSize: 13, color: C.faint }}>{label}</span>
    <span style={{ fontSize: 13.5, color: warn ? C.red : C.text, fontWeight: warn ? 600 : 500, textAlign: "right" }}>
      {val}
    </span>
  </div>
);
function Spark({ arr, c }: { arr: LabLog[]; c: string }) {
  if (!arr || arr.length < 2) return <div style={{ height: 30 }} />;
  const vs = arr.map((x) => x.value),
    max = Math.max(...vs),
    min = Math.min(...vs),
    w = 100,
    h = 30,
    step = w / (arr.length - 1);
  const pts = arr
    .map((x, i) => `${i * step},${h - 3 - (max === min ? h / 2 : ((x.value - min) / (max - min)) * (h - 6))}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 30 }} preserveAspectRatio="none">
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

function SheetModal({ title, onClose, html, onExport, onPrint, primary }: any) {
  return (
    <div className="lh-overlay" onClick={onClose}>
      <motion.div
        className="lh-modal"
        style={{ width: "min(640px,100%)", maxHeight: "88vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div className="lh-eyebrow" style={{ marginBottom: 4 }}>
              One tap · assembled from your archive
            </div>
            <h3 className="lh-h2" style={{ fontSize: 19 }}>
              {title}
            </h3>
          </div>
          <button className="lh-x" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="lh-preview" style={{ flex: 1, overflow: "auto" }} dangerouslySetInnerHTML={{ __html: html }} />
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            className={primary ? "lh-btn" : "lh-btn-g"}
            style={{ flex: 1, justifyContent: "center" }}
            onClick={onPrint}
          >
            <Printer size={16} /> Save as PDF
          </button>
          <button className="lh-btn-g" style={{ flex: 1, justifyContent: "center" }} onClick={onExport}>
            <Download size={16} /> Export
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── forms ── */
function LogReading({ member, vitals, onClose, save }: any) {
  const keys = Object.keys(METRICS);
  const [k, setK] = useState(Object.keys(vitals)[0] || "HbA1c");
  const [v, setV] = useState("");
  const [d, setD] = useState("");
  const [date, setDate] = useState(today());
  const isBP = METRICS[k].bp;
  return (
    <Modal title={`Log a reading for ${member.name.split(" ")[0]}`} onClose={onClose}>
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
      <div style={{ fontSize: 12, color: C.faint, marginTop: 10 }}>Reference: {METRICS[k].ref}.</div>
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
  const colors = [C.cyan, C.emerald, C.pink, C.violet, C.gold];
  return (
    <Modal title="Add a family member" onClose={onClose}>
      <Lbl>Name</Lbl>
      <input
        className="lh-in"
        value={f.name}
        onChange={(e) => setF({ ...f, name: e.target.value })}
        placeholder="e.g. Taylor Morgan"
      />
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <Lbl>Relation</Lbl>
          <select className="lh-in" value={f.relation} onChange={(e) => setF({ ...f, relation: e.target.value })}>
            {["Spouse", "Father", "Mother", "Son", "Daughter", "Sibling", "Parent", "Other"].map((r) => (
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
        onClick={() =>
          save({
            id:
              f.name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "")
                .slice(0, 8) + uid().slice(0, 3),
            name: f.name,
            relation: f.relation,
            color: colors[Math.floor(Math.random() * colors.length)],
            dob: f.dob,
            bloodGroup: f.bloodGroup,
            access: "View only",
          })
        }
      >
        Create profile
      </button>
    </Modal>
  );
}
function AddMed({ onClose, save }: any) {
  const [f, setF] = useState({ name: "", dose: "", freq: "Once daily", refillBy: rel(30), remaining: 30 });
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
          <Lbl>Tablets</Lbl>
          <input
            className="lh-in"
            type="number"
            value={f.remaining}
            onChange={(e) => setF({ ...f, remaining: parseInt(e.target.value) || 0 })}
          />
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
    <Modal title={`Edit ${member.name.split(" ")[0]}'s care profile`} onClose={onClose}>
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
          <Lbl>Blood</Lbl>
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

/* ── printable docs (assembled from the archive) ── */
function insuranceOf(member: Member | undefined, docs: Doc[]) {
  return docs.find((d) => d.docType === "Health Insurance" && (d.memberId === member?.id || d.memberId === "you"));
}
function buildVisitPack(
  m: Member | undefined,
  care: any,
  meds: Medication[],
  vitals: Record<string, LabLog[]>,
  records: Doc[],
  docs: Doc[],
) {
  if (!m) return "";
  const a = age(m.dob);
  const latestRx = records.filter((r) => r.medType === "prescription")[0];
  const last3Labs = records.filter((r) => r.medType === "lab_report").slice(0, 3);
  const notes = records.filter((r) => r.medType === "discharge");
  const scans = records.filter((r) => r.medType === "scan");
  const ins = insuranceOf(m, docs);
  const sec = (t: string, body: string) =>
    `<h3 style="margin:16px 0 6px;font-size:14px;color:#111827">${t}</h3>${body}`;
  const ul = (items: string[]) =>
    items.length
      ? `<ul style="margin:0;padding-left:18px;line-height:1.7;color:#374151;font-size:13px">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`
      : `<div style="color:#9ca3af;font-size:13px">None on file</div>`;
  const vitalRows =
    Object.keys(vitals)
      .map((k) => {
        const arr = vitals[k];
        const l = arr[arr.length - 1];
        const st = METRICS[k].status(l.value, l.value2);
        const val = METRICS[k].bp ? `${l.value}/${l.value2}` : `${l.value} ${METRICS[k].unit}`;
        return `<tr><td style="padding:4px 10px">${k}</td><td style="padding:4px 10px;font-weight:600">${val}</td><td style="padding:4px 10px;color:#6b7280">${fmt(l.date)}</td><td style="padding:4px 10px">${SM[st].label}</td></tr>`;
      })
      .join("") || `<tr><td colspan="4" style="padding:6px 10px;color:#9ca3af">No readings</td></tr>`;
  return `<div style="font-family:Inter,Arial,sans-serif;color:#111827;background:#fff;padding:22px;border-radius:8px">
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #D8B25A;padding-bottom:10px">
    <div><div style="font-weight:800;font-size:17px">LifePack · Doctor Visit Pack</div><div style="color:#6b7280;font-size:12px">Assembled ${new Date().toLocaleString()}</div></div>
    <div style="text-align:right"><div style="font-size:18px;font-weight:800">${m.name}</div><div style="color:#6b7280;font-size:12px">${m.relation}${a != null ? ` · ${a}y` : ""}${m.bloodGroup ? ` · Blood ${m.bloodGroup}` : ""}</div></div>
  </div>
  ${sec("Chronic conditions", ul(care.conditions || []))}
  ${sec("Allergies", `<div style="font-size:13px;color:${care.allergies && care.allergies !== "None recorded" ? "#b91c1c" : "#374151"};font-weight:${care.allergies && care.allergies !== "None recorded" ? 700 : 400}">${care.allergies || "None recorded"}</div>`)}
  ${sec("Current medications", ul(meds.map((x) => `${x.name} ${x.dose} — ${x.freq}`)))}
  ${sec("Latest prescription", latestRx ? `<div style="font-size:13px;color:#374151">${latestRx.name} · ${fmt(latestRx.docDate || latestRx.addedAt)}</div>` : `<div style="color:#9ca3af;font-size:13px">None on file</div>`)}
  ${sec("Last 3 lab reports", ul(last3Labs.map((r) => `${r.name} · ${fmt(r.docDate || r.addedAt)}`)))}
  ${sec("Previous consultation notes", ul(notes.map((r) => `${r.name} · ${fmt(r.docDate || r.addedAt)}`)))}
  ${sec("Relevant scans", ul(scans.map((r) => `${r.name} · ${fmt(r.docDate || r.addedAt)}`)))}
  ${sec("Insurance", ins ? `<div style="font-size:13px;color:#374151">${ins.docType} — ${ins.name}${ins.expiry ? ` (valid to ${fmt(ins.expiry)})` : ""}</div>` : `<div style="color:#9ca3af;font-size:13px">None on file</div>`)}
  ${sec("Recent readings", `<table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="background:#f3f4f6"><th style="text-align:left;padding:4px 10px">Metric</th><th style="text-align:left;padding:4px 10px">Value</th><th style="text-align:left;padding:4px 10px">Date</th><th style="text-align:left;padding:4px 10px">Vs range</th></tr>${vitalRows}</table>`)}
  <p style="margin-top:18px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:8px">Assembled by LifePack from records entered by the family. Not a medical document, diagnosis, or advice. Reference ranges are standard published values.</p>
  </div>`;
}
function buildEmergency(m: Member | undefined, care: any, meds: Medication[], docs: Doc[]) {
  if (!m) return "";
  const ins = insuranceOf(m, docs);
  const row = (a: string, b: string, warn?: boolean) =>
    `<tr><td style="padding:7px 12px;color:#6b7280;font-size:12px;width:130px">${a}</td><td style="padding:7px 12px;font-weight:700;font-size:14px;color:${warn ? "#b91c1c" : "#111827"}">${b}</td></tr>`;
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:460px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:#b91c1c;color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
    <div style="font-weight:800;font-size:15px;letter-spacing:1px">EMERGENCY INFO</div><div style="font-size:12px;opacity:.9">LifePack</div>
  </div>
  <div style="padding:6px 4px"><table style="width:100%;border-collapse:collapse">
    ${row("Name", m.name)}
    ${row("Blood group", m.bloodGroup || "—")}
    ${row("Allergies", care.allergies || "None recorded", care.allergies && care.allergies !== "None recorded")}
    ${row("Conditions", (care.conditions || []).join(", ") || "None recorded")}
    ${row("Current meds", meds.map((x) => `${x.name} ${x.dose}`).join(", ") || "None")}
    ${row("Emergency contact", care.emergency || "—")}
    ${row("Insurance", ins ? ins.name : "—")}
  </table></div>
  <div style="padding:10px 16px;background:#f9fafb;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb">Carry or screenshot this card. Data stays on your device.</div>
  </div>`;
}

/* ── styles ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
.lh-root{font-family:'Inter',system-ui,sans-serif;color:${C.text}}
.lh-root *{box-sizing:border-box}
.lh-head{margin-bottom:18px}
.lh-eyebrow{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${C.gold};margin-bottom:8px}
.lh-h1{font-family:'Space Grotesk';font-weight:700;font-size:27px;letter-spacing:-.5px;margin:0;color:${C.text}}
.lh-h2{font-family:'Space Grotesk';font-weight:700;margin:0;color:${C.text}}
.lh-card{background:${C.panel};border:1px solid ${C.border};border-radius:16px}
.lh-insight{background:linear-gradient(180deg,rgba(216,178,90,.06),${C.panel})}
.lh-switch{display:flex;align-items:center;gap:16px;overflow-x:auto;padding:2px 2px 16px}
.lh-mm{display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:0;cursor:pointer;flex-shrink:0;padding:0}
.lh-av{position:relative;width:42px;height:42px;border-radius:13px;display:grid;place-items:center;font-weight:700;font-size:18px;border:2px solid transparent;font-family:'Space Grotesk';transition:.15s}
.lh-mm.on .lh-av{transform:translateY(-1px)}
.lh-av.lg{width:52px;height:52px;font-size:22px}
.lh-dot{position:absolute;top:-2px;right:-2px;width:11px;height:11px;border-radius:9px;border:2px solid #10131f}
.lh-nm{font-size:12.5px;font-weight:600;white-space:nowrap}
.lh-addm .lh-av{background:${C.panel2}}
.lh-famline{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:0 2px;margin-bottom:2px}
.lh-famtitle{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:${C.text}}
.lh-famsum{font-family:'JetBrains Mono';font-size:12.5px;color:${C.sub};white-space:nowrap}
.lh-hero{background:linear-gradient(180deg,rgba(216,178,90,.05),${C.panel});border:1px solid ${C.border};border-radius:16px;padding:18px;margin-bottom:20px}
.lh-herotop{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.lh-heronext{display:flex;align-items:center;gap:9px;margin-top:16px;padding-top:14px;border-top:1px solid ${C.border}}
.lh-herometa{font-size:13px;color:${C.sub};margin-top:8px;line-height:1.5}
.lh-attnrow{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.lh-chip{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;color:${C.sub};background:${C.panel2};border:1px solid ${C.border};border-radius:20px;padding:6px 12px;cursor:pointer;font-family:inherit}
.lh-chip:hover{background:rgba(255,255,255,.08)}
.lh-mhead{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:16px}
.lh-btn{display:inline-flex;align-items:center;gap:7px;background:${C.gold};color:#0B0E24;font-weight:600;font-size:14px;border:0;border-radius:11px;padding:10px 16px;cursor:pointer;font-family:inherit;transition:.15s}
.lh-btn:hover{filter:brightness(1.06)}.lh-btn:disabled{opacity:.4;cursor:not-allowed}
.lh-btn-g{display:inline-flex;align-items:center;gap:7px;background:${C.panel2};color:${C.text};font-weight:600;font-size:14px;border:1px solid ${C.border};border-radius:11px;padding:10px 14px;cursor:pointer;font-family:inherit}
.lh-btn-g:hover{background:rgba(255,255,255,.09)}
.lh-tabs{display:flex;gap:6px;border-bottom:1px solid ${C.border};margin-bottom:18px;overflow-x:auto}
.lh-tab{display:inline-flex;align-items:center;gap:7px;background:none;border:0;border-bottom:2px solid transparent;color:${C.sub};font-size:14px;font-weight:600;padding:10px 12px;cursor:pointer;font-family:inherit;white-space:nowrap;margin-bottom:-1px}
.lh-tab.on{color:${C.text};border-bottom-color:${C.gold}}
.lh-tc{font-family:'JetBrains Mono';font-size:11px;background:${C.panel2};border-radius:9px;padding:1px 6px;color:${C.sub}}
.lh-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.lh-grid-2-1{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px}
.lh-sechead{display:flex;align-items:center;gap:8px;font-size:14.5px;font-weight:700;color:${C.text};margin-bottom:12px}
.lh-mini{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:600;color:${C.gold};background:${C.gold}18;border:1px solid ${C.gold}33;border-radius:8px;padding:4px 9px;cursor:pointer;font-family:inherit}
.lh-row{display:flex;align-items:center;gap:11px;padding:9px 0;border-top:1px solid ${C.border}}
.lh-row:first-of-type{border-top:0}
.lh-ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}
.lh-ib{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;border:1px solid ${C.border};background:transparent;cursor:pointer;flex-shrink:0}
.lh-ib:hover{background:rgba(255,255,255,.06)}
.lh-tag{font-family:'JetBrains Mono';font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px}
.lh-info{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid ${C.border}}
.lh-info:first-of-type{border-top:0}
.lh-med{padding:12px 0;border-top:1px solid ${C.border}}
.lh-med:first-of-type{border-top:0}
.lh-adhere{display:flex;align-items:center;gap:12px;margin-top:9px;padding-left:43px;flex-wrap:wrap}
.lh-take{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:${C.emerald};background:${C.emerald}18;border:1px solid ${C.emerald}33;border-radius:8px;padding:5px 10px;cursor:pointer;font-family:inherit}
.lh-taken{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:${C.emerald}}
.lh-lnk{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:${C.sub};background:none;border:0;cursor:pointer;font-family:inherit}
.lh-lnk:hover{color:${C.text}}
.lh-uprow{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.lh-up{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:${C.text};background:${C.panel2};border:1px solid ${C.border};border-radius:11px;padding:11px 15px;cursor:pointer;font-family:inherit}
.lh-up:hover{background:rgba(255,255,255,.09);border-color:${C.gold}55}
.lh-rec{position:relative;display:flex;align-items:center;gap:11px;padding:9px 0;border-top:1px solid ${C.border}}
.lh-rec:first-of-type{border-top:0}
.lh-tl{position:relative;padding-left:20px}
.lh-tl:before{content:"";position:absolute;left:5px;top:24px;bottom:8px;width:1px;background:${C.border}}
.lh-tlmon{font-family:'JetBrains Mono';font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${C.gold};margin:14px 0 6px}
.lh-tlrow{position:relative;display:flex;align-items:center;gap:11px;padding:8px 0}
.lh-tldot{position:absolute;left:-15px;top:18px;width:9px;height:9px;border-radius:9px}
.lh-lbl{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:${C.faint};font-family:'JetBrains Mono';margin-bottom:5px}
.lh-in{width:100%;background:${C.panel2};border:1px solid ${C.border};border-radius:10px;padding:9px 11px;color:${C.text};font-size:14px;outline:none;font-family:inherit}
.lh-in:focus{border-color:${C.gold}}
.lh-overlay{position:fixed;inset:0;z-index:60;background:rgba(4,6,15,.62);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:18px}
.lh-modal{background:#111524;border:1px solid ${C.border};border-radius:18px;width:min(460px,100%);padding:22px;max-height:90vh;overflow:auto}
.lh-preview{background:#f3f4f6;border-radius:10px;padding:10px}
.lh-x{width:32px;height:32px;border-radius:9px;border:1px solid ${C.border};background:${C.panel2};color:${C.text};cursor:pointer;display:grid;place-items:center}
.lh-pick{display:flex;flex-wrap:wrap;gap:6px}
.lh-pk{font-size:12.5px;font-weight:600;color:${C.sub};background:${C.panel2};border:1px solid ${C.border};border-radius:8px;padding:6px 10px;cursor:pointer;font-family:inherit}
.lh-pk.on{color:#0B0E24;background:${C.gold};border-color:${C.gold}}
.lh-cond{display:inline-flex;align-items:center;gap:5px;font-size:13px;color:${C.text};background:${C.panel2};border:1px solid ${C.border};border-radius:20px;padding:4px 10px}
.lh-cond button{background:0;border:0;color:${C.faint};cursor:pointer;display:inline-flex}
.lh-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:80;background:#111524;border:1px solid ${C.border};color:${C.text};padding:12px 20px;border-radius:12px;font-size:14px;font-weight:500;display:flex;align-items:center;gap:10px;box-shadow:0 16px 50px rgba(0,0,0,.5)}
#lh-print{display:none}
@media(max-width:900px){.lh-grid3{grid-template-columns:1fr}.lh-grid-2-1{grid-template-columns:1fr}.lh-vgrid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media print{body *{visibility:hidden}#lh-print,#lh-print *{visibility:visible}#lh-print{display:block;position:absolute;inset:0}}
`;
