import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, FolderOpen, Zap, HeartPulse, Settings as SettingsIcon, Search, Bell,
  Sparkles, ArrowRight, Plane, Landmark, ShieldCheck, FileText, Home, Car, KeyRound,
  BookUser, CarFront, GraduationCap, Baby, Globe, ClipboardPlus, Check, X, Clock,
  AlertTriangle, Download, Share2, Mail, ListChecks, Printer, Plus, Lock,
  Fingerprint, Briefcase, Shield, Pill as PillIcon, FlaskConical, Stethoscope,
  TrendingUp, TrendingDown, Minus, Activity, UploadCloud, CheckCircle2, Trash2, Info, RotateCcw,
} from "lucide-react";

/* ───────────────────────── theme ───────────────────────── */
const T = {
  bg: "#080B1A", bg2: "#0B0E24",
  glass: "rgba(255,255,255,0.045)", border: "rgba(255,255,255,0.09)",
  text: "#EAEDF7", sub: "rgba(234,237,247,0.60)", faint: "rgba(234,237,247,0.40)",
  gold: "#D8B25A", emerald: "#2FB68A", cyan: "#6E8BFF", violet: "#A78BFA",
  rose: "#FB7185", pink: "#F472B6", red: "#F26D6D",
};
const CAT: Record<string, { color: string; icon: any }> = {
  Identity: { color: T.cyan, icon: Fingerprint }, Employment: { color: T.violet, icon: Briefcase },
  Finance: { color: T.emerald, icon: Landmark }, Insurance: { color: T.gold, icon: Shield },
  Property: { color: T.rose, icon: Home }, Medical: { color: T.pink, icon: HeartPulse },
};
const tone = (s: number) => (s >= 90 ? T.emerald : s >= 70 ? T.gold : T.rose);
const fmt = (s?: string) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const daysTo = (s: string) => Math.ceil((+new Date(s) - Date.now()) / 86400000);

/* ───────────────────────── mock data ───────────────────────── */
const MEMBERS = [
  { id: "self", name: "Ravi", relation: "Self", color: T.cyan },
  { id: "dad", name: "Rajeshwar", relation: "Father", color: T.emerald },
  { id: "mom", name: "Lakshmi", relation: "Mother", color: T.pink },
  { id: "jaya", name: "Jaya", relation: "Spouse", color: T.violet },
];
type Doc = { id: string; name: string; cat: string; type: string; member?: string; date: string; expiry?: string; med?: string };
const D = (name: string, cat: string, type: string, date: string, x: { member?: string; expiry?: string; med?: string } = {}): Doc =>
  ({ id: name, name: name + ".pdf", cat, type, date, ...x });
const DOCS: Doc[] = [
  D("Passport_Z1234567", "Identity", "Passport", "2021-04-10", { member: "self", expiry: "2031-04-09" }),
  D("Aadhaar_XXXX8821", "Identity", "Aadhaar", "2014-08-02", { member: "self" }),
  D("PAN_ABCDE1234F", "Identity", "PAN", "2012-06-15", { member: "self" }),
  D("DrivingLicence_KA05", "Identity", "Driving Licence", "2016-06-16", { member: "self", expiry: "2026-06-16" }),
  D("VoterID_Ravi", "Identity", "Voter ID", "2015-01-20", { member: "self" }),
  D("Offer_AppViewX", "Employment", "Offer Letter", "2026-03-28", { member: "self" }),
  D("Relieving_IBM", "Employment", "Relieving Letter", "2026-03-31", { member: "self" }),
  D("Experience_IBM", "Employment", "Experience Letter", "2026-03-31", { member: "self" }),
  D("Payslip_May2026", "Employment", "Payslip", "2026-05-31", { member: "self" }),
  D("Payslip_Apr2026", "Employment", "Payslip", "2026-04-30", { member: "self" }),
  D("Form16_FY2025", "Finance", "Form 16", "2026-05-20", { member: "self" }),
  D("HDFC_Statement_Q1", "Finance", "Bank Statement", "2026-06-01", { member: "self" }),
  D("ITR_FY2024", "Finance", "ITR", "2025-07-18", { member: "self" }),
  D("MutualFund_CAMS", "Finance", "Investment Statement", "2026-06-10", { member: "self" }),
  D("Demat_Holding", "Finance", "Investment Statement", "2026-06-10", { member: "self" }),
  D("SBI_Statement_Q1", "Finance", "Bank Statement", "2026-06-01", { member: "self" }),
  D("Star_Health_Policy", "Insurance", "Health Insurance", "2025-08-08", { expiry: "2026-08-08" }),
  D("ICICI_Lombard_Car", "Insurance", "Vehicle Insurance", "2025-07-03", { member: "self", expiry: "2026-07-03" }),
  D("LIC_TermPlan", "Insurance", "Life Insurance", "2020-02-11", { member: "self" }),
  D("HDFC_Ergo_Home", "Insurance", "Home Insurance", "2025-12-01", { expiry: "2026-12-01" }),
  D("Sale_Deed_Whitefield", "Property", "Sale Deed", "2022-09-14", { member: "self" }),
  D("Property_Tax_2025", "Property", "Property Tax Receipt", "2025-11-30", { member: "self" }),
  D("Rental_Agreement_HSR", "Property", "Rental Agreement", "2025-07-14", { member: "self", expiry: "2026-07-14" }),
  D("Prescription_Diabetes", "Medical", "Prescription", "2026-06-10", { member: "dad", med: "prescription" }),
  D("LabReport_HbA1c", "Medical", "Lab Report", "2026-06-10", { member: "dad", med: "lab_report" }),
  D("Prescription_BP", "Medical", "Prescription", "2026-05-02", { member: "dad", med: "prescription" }),
  D("LabReport_Lipid", "Medical", "Lab Report", "2026-05-02", { member: "dad", med: "lab_report" }),
  D("Discharge_Apollo", "Medical", "Discharge Summary", "2026-03-15", { member: "dad", med: "discharge" }),
  D("Prescription_Thyroid", "Medical", "Prescription", "2026-05-20", { member: "mom", med: "prescription" }),
  D("LabReport_TSH", "Medical", "Lab Report", "2026-05-20", { member: "mom", med: "lab_report" }),
  D("LabReport_FullBody", "Medical", "Lab Report", "2026-04-12", { member: "self", med: "lab_report" }),
];

type Req = [string, boolean, string?];
type Ev = { id: string; name: string; blurb: string; icon: any; accent: string; reqs: Req[] };
const EVENTS: Ev[] = [
  { id: "schengen", name: "Schengen Visa", blurb: "Tourist visa, Europe", icon: Plane, accent: T.cyan, reqs: [["Passport", true, "Passport_Z1234567"], ["Payslips (3 months)", true, "Payslip_May2026"], ["Bank statements (6 mo)", true, "HDFC_Statement_Q1"], ["Income tax returns", true, "ITR_FY2024"], ["Employment letter", true, "Offer_AppViewX"], ["Travel insurance", false], ["Flight reservation", false], ["Hotel booking", false]] },
  { id: "us", name: "US B1/B2 Visa", blurb: "Business / tourist", icon: Plane, accent: T.cyan, reqs: [["Passport", true, "Passport_Z1234567"], ["DS-160 confirmation", false], ["Bank statements", true, "HDFC_Statement_Q1"], ["Payslips", true, "Payslip_May2026"], ["Employment letter", true, "Offer_AppViewX"], ["ITR", true, "ITR_FY2024"], ["Interview appointment", false]] },
  { id: "uk", name: "UK Visa", blurb: "Standard visitor", icon: Plane, accent: T.cyan, reqs: [["Passport", true, "Passport_Z1234567"], ["Bank statements (6 mo)", true, "HDFC_Statement_Q1"], ["Payslips", true, "Payslip_May2026"], ["Employment letter", true, "Offer_AppViewX"], ["Accommodation proof", false], ["Travel itinerary", false], ["TB test certificate", false]] },
  { id: "canada", name: "Canada Visa", blurb: "Visitor visa", icon: Plane, accent: T.cyan, reqs: [["Passport", true, "Passport_Z1234567"], ["Bank statements", true, "HDFC_Statement_Q1"], ["ITR", true, "ITR_FY2024"], ["Employment letter", true, "Offer_AppViewX"], ["Invitation letter", false], ["Travel history", false], ["Biometrics", false]] },
  { id: "homeloan", name: "Home Loan", blurb: "Application pack", icon: Landmark, accent: T.emerald, reqs: [["PAN", true, "PAN_ABCDE1234F"], ["Aadhaar", true, "Aadhaar_XXXX8821"], ["Payslips (6 mo)", true, "Payslip_May2026"], ["Bank statements", true, "HDFC_Statement_Q1"], ["Form 16", true, "Form16_FY2025"], ["Property documents", true, "Sale_Deed_Whitefield"], ["Property valuation", false]] },
  { id: "carloan", name: "Car Loan", blurb: "Vehicle finance", icon: Car, accent: T.emerald, reqs: [["PAN", true, "PAN_ABCDE1234F"], ["Aadhaar", true, "Aadhaar_XXXX8821"], ["Payslips", true, "Payslip_May2026"], ["Bank statements", true, "HDFC_Statement_Q1"], ["Form 16", false], ["Vehicle quotation", false]] },
  { id: "bgv", name: "Background Verification", blurb: "New job onboarding", icon: ShieldCheck, accent: T.violet, reqs: [["PAN", true, "PAN_ABCDE1234F"], ["Offer letter", true, "Offer_AppViewX"], ["Relieving letter", true, "Relieving_IBM"], ["Experience letter", true, "Experience_IBM"], ["Payslips", true, "Payslip_May2026"], ["Form 16", true, "Form16_FY2025"], ["Address proof", true, "Aadhaar_XXXX8821"], ["Education marksheets", false]] },
  { id: "hospital", name: "Hospital Admission", blurb: "Care visit pack", icon: HeartPulse, accent: T.pink, reqs: [["Health insurance card", true, "Star_Health_Policy"], ["ID proof", true, "Aadhaar_XXXX8821"], ["Past prescriptions", true, "Prescription_Diabetes"], ["Lab reports", true, "LabReport_HbA1c"], ["Discharge summaries", true, "Discharge_Apollo"], ["Pre-authorization form", false]] },
  { id: "claim", name: "Health Insurance Claim", blurb: "Reimbursement", icon: ClipboardPlus, accent: T.pink, reqs: [["Policy document", true, "Star_Health_Policy"], ["Hospital bills", false], ["Discharge summary", true, "Discharge_Apollo"], ["Prescriptions", true, "Prescription_Diabetes"], ["Lab reports", true, "LabReport_Lipid"], ["Claim form", false], ["Cancelled cheque", false]] },
  { id: "tax", name: "Tax Filing", blurb: "FY 2025-26", icon: FileText, accent: T.gold, reqs: [["PAN", true, "PAN_ABCDE1234F"], ["Aadhaar", true, "Aadhaar_XXXX8821"], ["Form 16", true, "Form16_FY2025"], ["Bank statements", true, "HDFC_Statement_Q1"], ["Investment proofs", true, "MutualFund_CAMS"], ["Capital gains statement", false]] },
  { id: "property", name: "Property Sale", blurb: "Resale pack", icon: Home, accent: T.rose, reqs: [["Sale deed", true, "Sale_Deed_Whitefield"], ["Property tax receipt", true, "Property_Tax_2025"], ["PAN", true, "PAN_ABCDE1234F"], ["Aadhaar", true, "Aadhaar_XXXX8821"], ["Encumbrance certificate", false], ["Khata certificate", false]] },
  { id: "tenant", name: "Tenant Verification", blurb: "Rental onboarding", icon: KeyRound, accent: T.rose, reqs: [["Aadhaar", true, "Aadhaar_XXXX8821"], ["PAN", true, "PAN_ABCDE1234F"], ["Employment letter", true, "Offer_AppViewX"], ["Payslips", true, "Payslip_May2026"], ["Rental agreement", true, "Rental_Agreement_HSR"]] },
  { id: "passport", name: "Passport Renewal", blurb: "Re-issue", icon: BookUser, accent: T.cyan, reqs: [["Existing passport", true, "Passport_Z1234567"], ["Aadhaar", true, "Aadhaar_XXXX8821"], ["PAN", true, "PAN_ABCDE1234F"], ["Address proof", true, "Rental_Agreement_HSR"]] },
  { id: "licence", name: "Licence Renewal", blurb: "Driving licence", icon: CarFront, accent: T.violet, reqs: [["Existing licence", true, "DrivingLicence_KA05"], ["Aadhaar", true, "Aadhaar_XXXX8821"], ["Address proof", true, "Rental_Agreement_HSR"], ["Medical certificate", false]] },
  { id: "school", name: "School Admission", blurb: "Child admission", icon: GraduationCap, accent: T.emerald, reqs: [["Child birth certificate", false], ["Aadhaar (parent)", true, "Aadhaar_XXXX8821"], ["Address proof", true, "Rental_Agreement_HSR"], ["Income proof", true, "Form16_FY2025"], ["Photographs", false]] },
  { id: "baby", name: "New Baby", blurb: "Newborn paperwork", icon: Baby, accent: T.pink, reqs: [["Birth certificate", false], ["Aadhaar enrolment", false], ["Add to health insurance", true, "Star_Health_Policy"], ["Hospital discharge", false], ["Vaccination record", false]] },
  { id: "nri", name: "NRI Repatriation", blurb: "Moving back to India", icon: Globe, accent: T.gold, reqs: [["Passport", true, "Passport_Z1234567"], ["PAN", true, "PAN_ABCDE1234F"], ["Aadhaar", true, "Aadhaar_XXXX8821"], ["Bank statements", true, "HDFC_Statement_Q1"], ["NRE/NRO closure", false], ["Customs declaration", false]] },
];
const evalEv = (e: Ev) => { const have = e.reqs.filter((r) => r[1]).length; return { score: Math.round((have / e.reqs.length) * 100), have, total: e.reqs.length }; };

const CARE: Record<string, { conditions: string[]; meds: string[]; allergies: string }> = {
  dad: { conditions: ["Type 2 Diabetes", "Hypertension"], meds: ["Metformin 500mg", "Telmisartan 40mg", "Atorvastatin 10mg"], allergies: "Sulfa drugs" },
  mom: { conditions: ["Hypothyroidism"], meds: ["Thyronorm 50mcg"], allergies: "None recorded" },
  self: { conditions: [], meds: [], allergies: "None recorded" },
  jaya: { conditions: [], meds: [], allergies: "None recorded" },
};
const LABS: Record<string, { metric: string; unit: string; points: [string, number][] }[]> = {
  dad: [
    { metric: "HbA1c", unit: "%", points: [["2026-01-08", 7.8], ["2026-03-12", 7.4], ["2026-05-02", 6.9], ["2026-06-10", 6.4]] },
    { metric: "BP (systolic)", unit: "", points: [["2026-01-08", 148], ["2026-03-12", 142], ["2026-05-02", 138], ["2026-06-10", 132]] },
    { metric: "LDL", unit: "mg/dL", points: [["2026-01-08", 132], ["2026-05-02", 118], ["2026-06-10", 104]] },
  ],
  mom: [{ metric: "TSH", unit: "mIU/L", points: [["2026-01-15", 6.2], ["2026-03-20", 4.8], ["2026-05-20", 3.9]] }],
  self: [], jaya: [],
};
const ACTIVITY = [
  ["Classified Payslip_May2026.pdf", "Employment", T.violet, "2h ago"],
  ["Star Health policy expiring in 48 days", "Insurance", T.gold, "5h ago"],
  ["Added HbA1c reading for Dad (6.4%)", "Healthcare", T.pink, "1d ago"],
  ["Assembled Tax Filing package", "Life event", T.emerald, "2d ago"],
  ["Driving Licence has expired", "Identity", T.red, "3d ago"],
];

/* ───────────────────────── primitives ───────────────────────── */
function Ring({ v, size = 54, sw = 5, color }: { v: number; size?: number; sw?: number; color?: string }) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r, off = c - (v / 100) * c, col = color || tone(v);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.1)" strokeWidth={sw} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: off }} transition={{ duration: 1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 5px ${col}99)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: size > 56 ? 15 : 11, color: T.text }}>{v}%</div>
    </div>
  );
}
const Eyebrow = ({ children }: any) => <div className="lp-eyebrow">{children}</div>;
const Pill = ({ children, c = T.faint }: any) => (
  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, color: c, background: c + "1f", border: `1px solid ${c}33`, padding: "3px 8px", borderRadius: 20 }}>{children}</span>
);
const Stamp = ({ label = "Ready", c = T.emerald }: any) => (
  <motion.span initial={{ rotate: -14, scale: 0, opacity: 0 }} animate={{ rotate: -7, scale: 1, opacity: 1 }} transition={{ type: "spring", delay: .3 }}
    style={{ display: "inline-flex", alignItems: "center", gap: 4, border: `2px solid ${c}`, color: c, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", borderRadius: 5, padding: "2px 7px", letterSpacing: ".5px" }}>
    <Stamp_inner /><span>{label}</span></motion.span>
);
const Stamp_inner = () => <Stamp_icon />;
const Stamp_icon = () => <span style={{ display: "inline-flex" }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 12h6M12 2v4M5 22h14M6 18h12v-2a6 6 0 0 0-12 0z" /></svg></span>;

/* ───────────────────────── screens ───────────────────────── */
function Section({ eyebrow, title, sub, children }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="lp-h1">{title}</h1>
      {sub && <p style={{ color: T.sub, fontSize: 15, marginTop: 6, marginBottom: 26 }}>{sub}</p>}
      {children}
    </motion.div>
  );
}

function Dashboard({ docs, go, openEv, toast }: any) {
  const [q, setQ] = useState("");
  const ready = EVENTS.filter((e) => evalEv(e).score >= 90).length;
  const avg = Math.round(EVENTS.reduce((s, e) => s + evalEv(e).score, 0) / EVENTS.length);
  const expiring = docs.filter((d: Doc) => d.expiry).map((d: Doc) => ({ d, n: daysTo(d.expiry!) })).sort((a: any, b: any) => a.n - b.n).slice(0, 5);
  const stats = [
    { label: "Documents", value: docs.length, icon: FolderOpen, c: T.cyan },
    { label: "Overall readiness", value: avg + "%", icon: Activity, c: T.emerald },
    { label: "Expiring soon", value: expiring.filter((e: any) => e.n < 60).length, icon: Clock, c: T.gold },
    { label: "Events ready", value: `${ready}/${EVENTS.length}`, icon: ShieldCheck, c: T.violet },
  ];
  return (
    <Section eyebrow="● Command center" title="Good evening, Ravi" sub="Your document graph, and what needs attention.">
      <div className="lp-grid4" style={{ marginBottom: 22 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label} className="lp-card" style={{ padding: 16 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10, background: s.c + "22" }}><s.icon size={18} color={s.c} /></span>
            </div>
            <div className="lp-mono" style={{ fontSize: 26, fontWeight: 700, color: T.text, marginTop: 12 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: T.sub }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* generator */}
      <div className="lp-card lp-generator" style={{ padding: 24, marginBottom: 28 }}>
        <div className="lp-glow-gold" />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.gold, fontSize: 13, fontWeight: 600, marginBottom: 10 }}><Sparkles size={15} /> Life Event Generator</div>
          <h2 className="lp-h2" style={{ fontSize: 22, marginBottom: 16 }}>What would you like to prepare for?</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(255,255,255,.06)", border: `1px solid ${T.border}`, borderRadius: 12, padding: "6px 6px 6px 16px" }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Prepare my Schengen visa package"
              onKeyDown={(e) => { if (e.key === "Enter") openEv(EVENTS.find((x) => q.toLowerCase().includes(x.name.toLowerCase().split(" ")[0])) || EVENTS[0]); }}
              style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: T.text, fontSize: 15 }} />
            <button className="lp-btn" onClick={() => openEv(EVENTS.find((x) => q.toLowerCase().includes(x.name.toLowerCase().split(" ")[0])) || EVENTS[0])}>Generate <ArrowRight size={15} /></button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {EVENTS.slice(0, 7).map((e) => <button key={e.id} className="lp-chip" onClick={() => openEv(e)}><e.icon size={14} /> {e.name}</button>)}
          </div>
        </div>
      </div>

      <Eyebrow>Readiness center</Eyebrow>
      <div className="lp-grid4" style={{ marginBottom: 28 }}>
        {EVENTS.slice(0, 8).map((e, i) => { const { score } = evalEv(e); return (
          <motion.button key={e.id} className="lp-card lp-hover" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}
            onClick={() => openEv(e)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .03 }}>
            <Ring v={score} size={50} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 6 }}><e.icon size={13} color={e.accent} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span></div>
              <div style={{ fontSize: 12, color: T.faint, marginTop: 2 }}>{score >= 90 ? "Ready to submit" : `${evalEv(e).total - evalEv(e).have} missing`}</div>
            </div>
          </motion.button>
        ); })}
      </div>

      <Eyebrow>Your document graph</Eyebrow>
      <div className="lp-grid3" style={{ marginBottom: 28 }}>
        {Object.keys(CAT).map((cat, i) => {
          const items = docs.filter((d: Doc) => d.cat === cat); const Ic = CAT[cat].icon; const col = CAT[cat].color;
          const comp = Math.min(100, 40 + items.length * 12);
          return (
            <motion.button key={cat} className="lp-card lp-hover" style={{ padding: 18, textAlign: "left" }} onClick={() => go("documents")}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 11, background: col + "22" }}><Ic size={19} color={col} /></span>
                <Ring v={comp} size={42} sw={4} color={col} />
              </div>
              <div className="lp-h2" style={{ fontSize: 16, marginTop: 14 }}>{cat}</div>
              <div style={{ fontSize: 12.5, color: T.faint, marginTop: 4 }} className="lp-mono">{items.length} documents</div>
            </motion.button>
          );
        })}
      </div>

      <div className="lp-grid2">
        <div className="lp-card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><Clock size={16} color={T.sub} /><b style={{ color: T.text, fontSize: 14.5 }}>Expiring soon</b></div>
          {expiring.map((e: any, i: number) => (
            <div key={e.d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i ? `1px solid ${T.border}` : 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{e.d.type}</div><div style={{ fontSize: 12, color: T.faint }}>{fmt(e.d.expiry)}</div></div>
              <Pill c={e.n < 0 ? T.red : e.n < 30 ? T.gold : T.faint}>{e.n < 0 ? "Expired" : `${e.n}d`}</Pill>
            </div>
          ))}
        </div>
        <div className="lp-card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><Activity size={16} color={T.sub} /><b style={{ color: T.text, fontSize: 14.5 }}>Recent activity</b></div>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i ? `1px solid ${T.border}` : 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: 9, background: a[2] as string, boxShadow: `0 0 8px ${a[2]}` }} />
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, color: T.text }}>{a[0]}</div></div>
              <span className="lp-mono" style={{ fontSize: 11, color: T.faint }}>{a[3]}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Documents({ docs, addFiles, openDoc }: any) {
  const cats = ["All", ...Object.keys(CAT)];
  const [active, setActive] = useState("All");
  const ref = useRef<HTMLInputElement>(null);
  const list = active === "All" ? docs : docs.filter((d: Doc) => d.cat === active);
  return (
    <Section eyebrow="● Vault" title="Documents" sub={`${docs.length} documents, classified and ready.`}>
      <div className="lp-card lp-dropzone" onClick={() => ref.current?.click()} style={{ padding: 20, marginBottom: 18, cursor: "pointer", textAlign: "center" }}>
        <input ref={ref} type="file" multiple hidden onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.currentTarget.value = ""; }} />
        <UploadCloud size={26} color={T.gold} />
        <div style={{ fontWeight: 600, color: T.text, marginTop: 8 }}>Drop files or click to upload</div>
        <div style={{ fontSize: 13, color: T.faint, marginTop: 2 }}>Classified automatically on upload</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {cats.map((c) => (
          <button key={c} onClick={() => setActive(c)} className="lp-tab" style={{ borderColor: active === c ? T.gold : T.border, color: active === c ? T.gold : T.sub, background: active === c ? T.gold + "1a" : "transparent" }}>
            {c}{c !== "All" && <span className="lp-mono" style={{ marginLeft: 6, opacity: .7 }}>{docs.filter((d: Doc) => d.cat === c).length}</span>}
          </button>
        ))}
      </div>
      <div className="lp-grid3">
        {list.map((d: Doc, i: number) => { const Ic = CAT[d.cat].icon; const col = CAT[d.cat].color; return (
          <motion.button key={d.id} className="lp-card lp-hover" style={{ padding: 16, textAlign: "left" }} onClick={() => openDoc(d)}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .015 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 10, background: col + "22", flexShrink: 0 }}><Ic size={18} color={col} /></span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                <div style={{ fontSize: 12, color: T.faint, marginTop: 2 }}>{d.type}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
              <Pill c={col}>{d.cat}</Pill>
              {d.expiry && <Pill c={daysTo(d.expiry) < 0 ? T.red : daysTo(d.expiry) < 30 ? T.gold : T.faint}>exp {fmt(d.expiry)}</Pill>}
            </div>
          </motion.button>
        ); })}
      </div>
    </Section>
  );
}

function LifeEvents({ openEv }: any) {
  return (
    <Section eyebrow="● Use cases" title="Life events" sub="Pick an event. LifePack assembles the package from your vault in seconds.">
      <div className="lp-grid3">
        {EVENTS.map((e, i) => { const { score, have, total } = evalEv(e); return (
          <motion.button key={e.id} className="lp-card lp-hover" style={{ padding: 18, textAlign: "left", position: "relative" }} onClick={() => openEv(e)}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .025 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ display: "grid", placeItems: "center", width: 42, height: 42, borderRadius: 12, background: e.accent + "22" }}><e.icon size={20} color={e.accent} /></span>
              <Ring v={score} size={48} sw={4} />
            </div>
            <div className="lp-h2" style={{ fontSize: 16.5, marginTop: 14 }}>{e.name}</div>
            <div style={{ fontSize: 13, color: T.faint, marginTop: 2 }}>{e.blurb}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
              <span className="lp-mono" style={{ fontSize: 12, color: T.sub }}>{have}/{total} ready</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.gold, display: "flex", alignItems: "center", gap: 4 }}>Prepare <ArrowRight size={14} /></span>
            </div>
          </motion.button>
        ); })}
      </div>
    </Section>
  );
}

function Healthcare({ docs, toast }: any) {
  const [mid, setMid] = useState("dad");
  const prof = CARE[mid]; const labs = LABS[mid] || [];
  const recs = docs.filter((d: Doc) => d.cat === "Medical" && d.member === mid).sort((a: Doc, b: Doc) => b.date.localeCompare(a.date));
  return (
    <Section eyebrow="● Care" title="Healthcare" sub="Every prescription and report in one place. Build a visit pack before any appointment.">
      <div className="lp-card" style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 14, marginBottom: 20, background: T.cyan + "12", borderColor: T.cyan + "33" }}>
        <Info size={16} color={T.cyan} style={{ marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: T.sub }}>LifePack only organizes and displays the records you add. It does not interpret results, diagnose, or give medical advice.</span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {MEMBERS.map((m) => (
          <button key={m.id} onClick={() => setMid(m.id)} className="lp-tab" style={{ borderColor: mid === m.id ? m.color : T.border, color: mid === m.id ? m.color : T.sub, background: mid === m.id ? m.color + "1a" : "transparent", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 9, background: m.color }} /> {m.name} <span style={{ fontSize: 11, opacity: .6 }}>{m.relation}</span>
          </button>
        ))}
      </div>
      <div className="lp-grid-2-1">
        <div>
          <div className="lp-card" style={{ padding: 20, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Stethoscope size={17} color={T.sub} /><b style={{ color: T.text, fontSize: 15 }}>Records timeline</b></div>
              <span className="lp-mono" style={{ fontSize: 12, color: T.faint }}>{recs.length} records</span>
            </div>
            {recs.length === 0 ? <div style={{ color: T.faint, fontSize: 13, padding: "16px 0" }}>No records for this member yet.</div> : (
              <div style={{ position: "relative", paddingLeft: 20 }}>
                <div style={{ position: "absolute", left: 5, top: 4, bottom: 4, width: 1, background: T.border }} />
                {recs.map((d: Doc, i: number) => (
                  <motion.div key={d.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }} style={{ position: "relative", marginBottom: 12 }}>
                    <span style={{ position: "absolute", left: -19, top: 14, width: 10, height: 10, borderRadius: 9, background: T.pink, boxShadow: `0 0 8px ${T.pink}` }} />
                    <div className="lp-card lp-hover" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 9, background: T.pink + "22", flexShrink: 0 }}>{d.med === "prescription" ? <PillIcon size={16} color={T.pink} /> : <FlaskConical size={16} color={T.pink} />}</span>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{d.name}</div><div style={{ fontSize: 12, color: T.faint }}>{d.type} · {fmt(d.date)}</div></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          {/* lab trends */}
          <div className="lp-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><TrendingUp size={17} color={T.sub} /><b style={{ color: T.text, fontSize: 15 }}>Lab values you track</b></div>
            <p style={{ fontSize: 12.5, color: T.faint, marginBottom: 18 }}>LifePack only charts what you enter, it never interprets the values.</p>
            {labs.length === 0 && <div style={{ color: T.faint, fontSize: 13 }}>No readings logged for this member.</div>}
            {labs.map((l) => { const vals = l.points.map((p) => p[1]); const last = vals[vals.length - 1], prev = vals[vals.length - 2]; const delta = prev ? last - prev : 0; const max = Math.max(...vals), min = Math.min(...vals); const Tr = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus; const dc = delta > 0 ? T.red : delta < 0 ? T.emerald : T.faint; return (
              <div key={l.metric} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{l.metric}</span>
                  <span className="lp-mono" style={{ fontSize: 12, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}>{last}{l.unit} <Tr size={13} color={dc} /></span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 46 }}>
                  {l.points.map((p, i) => { const h = max === min ? 60 : 24 + ((p[1] - min) / (max - min)) * 76; return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }} title={`${p[1]}${l.unit} · ${fmt(p[0])}`}>
                      <div style={{ width: "100%", height: `${h}%`, minHeight: 6, borderRadius: "4px 4px 0 0", background: `linear-gradient(${T.gold},${T.gold}55)` }} />
                    </div>
                  ); })}
                </div>
              </div>
            ); })}
          </div>
        </div>
        {/* care profile + actions */}
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <div className="lp-card" style={{ padding: 20 }}>
            <b style={{ color: T.text, fontSize: 15 }}>Care profile</b>
            <Field label="Conditions" items={prof.conditions} />
            <Field label="Current medications" items={prof.meds} />
            <div style={{ marginTop: 12 }}><div className="lp-flabel">Allergies</div><div style={{ fontSize: 14, color: T.text, marginTop: 4 }}>{prof.allergies}</div></div>
          </div>
          <div className="lp-card" style={{ padding: 20 }}>
            <b style={{ color: T.text, fontSize: 15 }}>Before your visit</b>
            <p style={{ fontSize: 13, color: T.sub, margin: "6px 0 16px" }}>Carry everything in one tap, or print a one-page summary for the doctor.</p>
            <button className="lp-btn" style={{ width: "100%", justifyContent: "center", marginBottom: 10 }} onClick={() => toast("Visit pack ready · " + recs.length + " records")}><Download size={16} /> Download visit pack</button>
            <button className="lp-btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => toast("Opening print view…")}><Printer size={16} /> Print visit summary</button>
          </div>
        </div>
      </div>
    </Section>
  );
}
const Field = ({ label, items }: any) => (
  <div style={{ marginTop: 12 }}>
    <div className="lp-flabel">{label}</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
      {items.length ? items.map((it: string, i: number) => <span key={i} style={{ fontSize: 13, color: T.text, background: "rgba(255,255,255,.06)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "4px 10px" }}>{it}</span>) : <span style={{ fontSize: 13, color: T.faint }}>None recorded</span>}
    </div>
  </div>
);

function SettingsScreen({ toast }: any) {
  return (
    <Section eyebrow="● Setup" title="Settings" sub="Sources, members, and data.">
      <div className="lp-card" style={{ padding: 20, maxWidth: 560, marginBottom: 16 }}>
        <b style={{ color: T.text, fontSize: 15 }}>Connected sources</b>
        <div style={{ marginTop: 10 }}>
          {["Gmail", "Google Drive", "DigiLocker", "Local Upload"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i ? `1px solid ${T.border}` : 0 }}>
              <FileText size={16} color={T.sub} /><span style={{ flex: 1, fontSize: 14, color: T.text }}>{s}</span><Pill c={T.emerald}>Active</Pill>
            </div>
          ))}
        </div>
      </div>
      <div className="lp-card" style={{ padding: 20, maxWidth: 560 }}>
        <b style={{ color: T.text, fontSize: 15 }}>Family members</b>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {MEMBERS.map((m) => <span key={m.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: T.text, background: "rgba(255,255,255,.06)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "5px 12px" }}><span style={{ width: 8, height: 8, borderRadius: 9, background: m.color }} />{m.name}</span>)}
        </div>
      </div>
    </Section>
  );
}

/* ───────────────────────── modals ───────────────────────── */
function PackageModal({ ev, onClose, toast }: any) {
  const { score, have, total } = evalEv(ev);
  const inc = ev.reqs.filter((r: Req) => r[1]); const miss = ev.reqs.filter((r: Req) => !r[1]);
  const [building, setBuilding] = useState(true);
  React.useEffect(() => { const t = setTimeout(() => setBuilding(false), 850); return () => clearTimeout(t); }, []);
  return (
    <div className="lp-overlay" onClick={onClose}>
      <motion.div className="lp-slideover" onClick={(e) => e.stopPropagation()} initial={{ x: 60, opacity: .3 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }}>
        <div style={{ background: T.bg2, padding: 24, position: "relative", borderBottom: `1px solid ${T.border}` }}>
          <div className="lp-glow-gold" />
          <button className="lp-x" onClick={onClose}><X size={18} /></button>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ display: "grid", placeItems: "center", width: 46, height: 46, borderRadius: 13, background: ev.accent + "22" }}><ev.icon size={22} color={ev.accent} /></span>
            <div><div className="lp-h2" style={{ fontSize: 19 }}>{ev.name}</div><div style={{ fontSize: 13, color: T.sub }}>{ev.blurb}</div></div>
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16, marginTop: 18 }}>
            <Ring v={building ? 0 : score} size={72} sw={6} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>{building ? "Assembling…" : "Readiness"} {!building && score >= 90 && <Stamp />}</div>
              <div className="lp-mono" style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>{building ? "matching your vault" : `${have} of ${total} ready`}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div className="lp-card" style={{ padding: 0, marginBottom: 14 }}>
            <div className="lp-sub-head"><CheckCircle2 size={16} color={T.sub} /> Included ({inc.length})</div>
            {inc.map((r: Req) => (
              <div key={r[0]} className="lp-row">
                <span className="lp-tick" style={{ background: T.emerald + "26" }}><Check size={13} color={T.emerald} /></span>
                <span style={{ fontSize: 14, color: T.text, flex: 1 }}>{r[0]}</span>
                <span className="lp-mono" style={{ fontSize: 11, color: T.faint, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r[2]}</span>
              </div>
            ))}
          </div>
          {miss.length > 0 && (
            <div className="lp-card" style={{ padding: 0, marginBottom: 18 }}>
              <div className="lp-sub-head"><AlertTriangle size={16} color={T.sub} /> Still needed ({miss.length})</div>
              {miss.map((r: Req) => (
                <div key={r[0]} className="lp-row">
                  <span className="lp-tick" style={{ background: T.gold + "26" }}><X size={13} color={T.gold} /></span>
                  <span style={{ fontSize: 14, color: T.text, flex: 1 }}>{r[0]}</span>
                  <span className="lp-mono" style={{ fontSize: 11, color: T.faint }}>add</span>
                </div>
              ))}
            </div>
          )}
          <div className="lp-grid2" style={{ gap: 10 }}>
            <button className="lp-btn" style={{ justifyContent: "center" }} onClick={() => toast(`${ev.name} package downloaded`)}><Download size={16} /> Download ZIP</button>
            <button className="lp-btn-ghost" style={{ justifyContent: "center" }} onClick={() => toast("Secure link copied · expires in 7 days")}><Share2 size={16} /> Share link</button>
            <button className="lp-btn-ghost" style={{ justifyContent: "center" }} onClick={() => toast("Package emailed to you")}><Mail size={16} /> Email</button>
            <button className="lp-btn-ghost" style={{ justifyContent: "center" }} onClick={() => toast(`Checklist created · ${miss.length} to-dos`)}><ListChecks size={16} /> Checklist</button>
          </div>
          <p style={{ fontSize: 12, color: T.faint, textAlign: "center", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Lock size={12} /> Files stay on your device until you export.</p>
        </div>
      </motion.div>
    </div>
  );
}

function Viewer({ doc, onClose, toast }: any) {
  const col = CAT[doc.cat].color; const Ic = CAT[doc.cat].icon;
  return (
    <div className="lp-overlay lp-center" onClick={onClose}>
      <motion.div className="lp-card" onClick={(e) => e.stopPropagation()} initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: "min(820px,100%)", maxHeight: "86vh", overflow: "hidden", display: "flex" }}>
        <div className="lp-doc-preview">
          <div style={{ background: `linear-gradient(135deg,${col}33,${T.bg2})`, border: `1px solid ${T.border}`, borderRadius: 12, width: 240, height: 320, padding: 18, display: "flex", flexDirection: "column" }}>
            <Ic size={26} color={col} />
            <div style={{ marginTop: "auto" }}>
              <div className="lp-mono" style={{ fontSize: 10, color: T.faint, letterSpacing: 1 }}>LIFEPACK · {doc.cat.toUpperCase()}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginTop: 6 }}>{doc.type}</div>
              <div className="lp-mono" style={{ fontSize: 11, color: T.sub, marginTop: 8, wordBreak: "break-all" }}>{doc.name}</div>
            </div>
          </div>
        </div>
        <div style={{ width: 300, padding: 22, borderLeft: `1px solid ${T.border}`, overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{doc.name}</h3>
            <button className="lp-x" style={{ position: "static" }} onClick={onClose}><X size={16} /></button>
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <Meta label="Category" value={doc.cat} c={col} /><Meta label="Type" value={doc.type} />
            <Meta label="Belongs to" value={MEMBERS.find((m) => m.id === doc.member)?.name || "Unassigned"} />
            <Meta label="Document date" value={fmt(doc.date)} />{doc.expiry && <Meta label="Expiry" value={fmt(doc.expiry)} c={daysTo(doc.expiry) < 30 ? T.gold : undefined} />}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
            <button className="lp-btn" style={{ flex: 1, justifyContent: "center" }} onClick={() => toast("Downloading " + doc.name)}><Download size={15} /> Download</button>
            <button className="lp-btn-ghost lp-icon" onClick={() => toast("Removed from vault")}><Trash2 size={16} color={T.red} /></button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
const Meta = ({ label, value, c }: any) => (
  <div><div className="lp-flabel">{label}</div><div style={{ fontSize: 14, color: c || T.text, marginTop: 3, fontWeight: c ? 600 : 400 }}>{value}</div></div>
);

/* ───────────────────────── shell ───────────────────────── */
const NAV: [string, string, any][] = [["dashboard", "Dashboard", LayoutGrid], ["documents", "Documents", FolderOpen], ["events", "Life Events", Zap], ["healthcare", "Healthcare", HeartPulse], ["settings", "Settings", SettingsIcon]];

export default function App() {
  const [view, setView] = useState("dashboard");
  const [docs, setDocs] = useState<Doc[]>(DOCS);
  const [ev, setEv] = useState<Ev | null>(null);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toast = (m: string) => { setToastMsg(m); window.clearTimeout((toast as any)._t); (toast as any)._t = window.setTimeout(() => setToastMsg(null), 2500); };
  const addFiles = (files: FileList) => {
    const add = Array.from(files).map((f) => { const n = f.name.toLowerCase(); const cat = n.includes("passport") || n.includes("aadhaar") || n.includes("pan") ? "Identity" : n.includes("payslip") || n.includes("offer") ? "Employment" : n.includes("bank") || n.includes("form16") || n.includes("itr") ? "Finance" : n.includes("insurance") || n.includes("policy") ? "Insurance" : n.includes("deed") || n.includes("rent") ? "Property" : n.includes("prescription") || n.includes("lab") || n.includes("report") ? "Medical" : "Identity"; return { id: f.name + Date.now(), name: f.name, cat, type: "Uploaded", date: new Date().toISOString() } as Doc; });
    setDocs((d) => [...add, ...d]); toast(`${add.length} document${add.length > 1 ? "s" : ""} classified`);
  };
  const ready = EVENTS.filter((e) => evalEv(e).score >= 90).length;
  const avg = Math.round(EVENTS.reduce((s, e) => s + evalEv(e).score, 0) / EVENTS.length);

  return (
    <div className="lp-root">
      <style>{CSS}</style>
      <div className="lp-shell">
        {/* sidebar */}
        <aside className="lp-side">
          <div className="lp-brand"><span className="lp-logo"><ShieldCheck size={18} color={T.gold} /></span><span>LifePack<span style={{ color: T.gold }}> AI</span></span></div>
          <nav style={{ display: "grid", gap: 4 }}>
            {NAV.map(([id, label, Ic]) => <button key={id} className={"lp-nav" + (view === id ? " active" : "")} onClick={() => setView(id)}><Ic size={18} color={view === id ? T.gold : "currentColor"} /> {label}</button>)}
          </nav>
          <div className="lp-side-foot">
            <div className="lp-card" style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 10 }}>Overall readiness</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Ring v={avg} size={40} sw={4} color={T.emerald} /><span style={{ fontSize: 12.5, color: T.faint }}>Ready for {ready} of {EVENTS.length} life events.</span></div>
            </div>
          </div>
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>
          <header className="lp-top">
            <div className="lp-search"><Search size={16} color={T.faint} /><input placeholder="Search documents…" /></div>
            <div className="lp-tabs-m">{NAV.map(([id, label, Ic]) => <button key={id} className={"lp-tab-m" + (view === id ? " active" : "")} onClick={() => setView(id)}><Ic size={15} /></button>)}</div>
            <button className="lp-icon"><Bell size={18} color={T.sub} /></button>
            <span className="lp-avatar">RS</span>
          </header>
          <main className="lp-main">
            <AnimatePresence mode="wait">
              <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
                {view === "dashboard" && <Dashboard docs={docs} go={setView} openEv={setEv} toast={toast} />}
                {view === "documents" && <Documents docs={docs} addFiles={addFiles} openDoc={setDoc} />}
                {view === "events" && <LifeEvents openEv={setEv} />}
                {view === "healthcare" && <Healthcare docs={docs} toast={toast} />}
                {view === "settings" && <SettingsScreen toast={toast} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <AnimatePresence>{ev && <PackageModal ev={ev} onClose={() => setEv(null)} toast={toast} />}</AnimatePresence>
      <AnimatePresence>{doc && <Viewer doc={doc} onClose={() => setDoc(null)} toast={toast} />}</AnimatePresence>
      <AnimatePresence>{toastMsg && (
        <motion.div className="lp-toast" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}><CheckCircle2 size={17} color={T.emerald} /> {toastMsg}</motion.div>
      )}</AnimatePresence>
    </div>
  );
}

/* ───────────────────────── styles ───────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box}
.lp-root{min-height:100vh;font-family:'Inter',system-ui,sans-serif;color:${T.text};
  background:radial-gradient(1100px 600px at 88% -8%,rgba(216,178,90,.10),transparent 60%),radial-gradient(900px 600px at -5% 108%,rgba(110,139,255,.10),transparent 55%),${T.bg};}
.lp-root *::-webkit-scrollbar{width:9px;height:9px}.lp-root *::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:8px}
.lp-shell{display:flex;min-height:100vh}
.lp-side{width:228px;flex-shrink:0;border-right:1px solid ${T.border};padding:18px 14px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;background:rgba(8,11,26,.55);backdrop-filter:blur(8px)}
.lp-brand{display:flex;align-items:center;gap:10px;font-family:'Space Grotesk';font-weight:700;font-size:18px;padding:4px 8px 22px}
.lp-logo{display:grid;place-items:center;width:32px;height:32px;border-radius:9px;background:${T.bg2};border:1px solid ${T.border}}
.lp-nav{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:11px;font-size:14px;font-weight:600;color:${T.sub};background:transparent;border:0;cursor:pointer;text-align:left;transition:.15s}
.lp-nav:hover{color:${T.text};background:rgba(255,255,255,.04)}
.lp-nav.active{color:${T.text};background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px ${T.border}}
.lp-side-foot{margin-top:auto}
.lp-top{height:60px;display:flex;align-items:center;gap:12px;padding:0 24px;border-bottom:1px solid ${T.border};position:sticky;top:0;z-index:10;background:rgba(8,11,26,.7);backdrop-filter:blur(10px)}
.lp-search{display:flex;align-items:center;gap:8px;flex:1;max-width:420px;background:rgba(255,255,255,.05);border:1px solid ${T.border};border-radius:11px;padding:8px 12px}
.lp-search input{background:transparent;border:0;outline:none;color:${T.text};font-size:14px;width:100%;font-family:inherit}
.lp-search input::placeholder{color:${T.faint}}
.lp-tabs-m{display:none;gap:4px}
.lp-tab-m{width:34px;height:34px;display:grid;place-items:center;border-radius:9px;border:1px solid ${T.border};background:transparent;color:${T.sub};cursor:pointer}
.lp-tab-m.active{color:${T.gold};border-color:${T.gold};background:${T.gold}1a}
.lp-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;border:1px solid ${T.border};background:rgba(255,255,255,.04);cursor:pointer}
.lp-avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:700;color:#0B0E24;background:linear-gradient(135deg,${T.gold},#caa24c)}
.lp-main{padding:28px 28px 60px;max-width:1180px;margin:0 auto}
.lp-h1{font-family:'Space Grotesk';font-weight:700;font-size:26px;letter-spacing:-.5px;color:${T.text};margin:0}
.lp-h2{font-family:'Space Grotesk';font-weight:700;color:${T.text};margin:0}
.lp-mono{font-family:'JetBrains Mono',monospace}
.lp-eyebrow{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${T.gold};margin-bottom:12px}
.lp-card{background:${T.glass};border:1px solid ${T.border};border-radius:18px;backdrop-filter:blur(6px)}
.lp-hover{cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s}
.lp-hover:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.18);box-shadow:0 16px 40px rgba(0,0,0,.35)}
.lp-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.lp-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.lp-grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.lp-grid-2-1{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:20px}
.lp-generator{position:relative;overflow:hidden}
.lp-glow-gold{position:absolute;right:-40px;top:-60px;width:240px;height:240px;background:radial-gradient(circle,rgba(216,178,90,.4),transparent 70%);pointer-events:none}
.lp-btn{display:inline-flex;align-items:center;gap:7px;background:${T.gold};color:#0B0E24;font-weight:600;font-size:14px;border:0;border-radius:11px;padding:11px 18px;cursor:pointer;font-family:inherit;transition:.15s}
.lp-btn:hover{filter:brightness(1.06)}
.lp-btn-ghost{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.05);color:${T.text};font-weight:600;font-size:14px;border:1px solid ${T.border};border-radius:11px;padding:11px 16px;cursor:pointer;font-family:inherit;transition:.15s}
.lp-btn-ghost:hover{background:rgba(255,255,255,.09)}
.lp-chip{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;color:${T.text};background:rgba(255,255,255,.06);border:1px solid ${T.border};border-radius:20px;padding:7px 13px;cursor:pointer;font-family:inherit}
.lp-chip:hover{background:rgba(255,255,255,.1)}
.lp-tab{padding:8px 14px;border-radius:20px;font-size:13px;font-weight:600;border:1px solid ${T.border};cursor:pointer;font-family:inherit;transition:.15s}
.lp-dropzone{border:1.5px dashed rgba(255,255,255,.18)!important}
.lp-dropzone:hover{border-color:${T.gold}!important}
.lp-flabel{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${T.faint};font-family:'JetBrains Mono',monospace}
.lp-overlay{position:fixed;inset:0;z-index:60;background:rgba(4,6,15,.6);backdrop-filter:blur(4px)}
.lp-overlay.lp-center{display:flex;align-items:center;justify-content:center;padding:18px}
.lp-slideover{position:absolute;right:0;top:0;height:100%;width:min(480px,100%);overflow-y:auto;background:${T.bg};border-left:1px solid ${T.border}}
.lp-x{width:34px;height:34px;display:grid;place-items:center;border-radius:9px;border:1px solid ${T.border};background:rgba(255,255,255,.06);color:${T.text};cursor:pointer;position:absolute;top:16px;right:16px}
.lp-sub-head{display:flex;align-items:center;gap:8px;padding:14px 18px;font-size:14.5px;font-weight:700;color:${T.text}}
.lp-row{display:flex;align-items:center;gap:12px;padding:10px 18px;border-top:1px solid ${T.border}}
.lp-tick{width:22px;height:22px;border-radius:6px;display:grid;place-items:center;flex-shrink:0}
.lp-doc-preview{flex:1;display:grid;place-items:center;background:${T.bg2};min-height:360px}
.lp-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:80;background:${T.bg2};border:1px solid ${T.border};color:${T.text};padding:12px 20px;border-radius:12px;font-size:14px;font-weight:500;display:flex;align-items:center;gap:10px;box-shadow:0 16px 50px rgba(0,0,0,.5)}
@media(max-width:920px){
  .lp-side{display:none}.lp-tabs-m{display:flex}.lp-grid4{grid-template-columns:repeat(2,1fr)}
  .lp-grid3{grid-template-columns:1fr 1fr}.lp-grid2{grid-template-columns:1fr}.lp-grid-2-1{grid-template-columns:1fr}.lp-main{padding:20px 16px 60px}
}
@media(max-width:560px){.lp-grid3{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;
