import { useState, useMemo } from "react";
import type { ReactNode, CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid, Plane, FolderOpen, HeartPulse, Users, Wallet, KeyRound, ShieldCheck,
  Search, Download, AlertTriangle, Check, X, Plus, Clock, Link2, FileCheck,
  Share2, Mail, ChevronRight, Trash2, Eye, Circle
} from "lucide-react";

const T = {
  ink: "#0E0C09",
  panel: "#17140E",
  raised: "#211C13",
  border: "#332C1E",
  gold: "#C9A227",
  goldBright: "#E8C766",
  parchment: "#EDE6D6",
  muted: "#A39B86",
  faint: "#6E6655",
  ready: "#6FB07E",
  wax: "#C2502E"
} as const;

const money = (n: number): string => "\u20B9" + Math.abs(n).toLocaleString("en-IN");
const NOW = new Date("2026-06-21");
function daysUntil(d: string): number {
  return Math.ceil((new Date(d).getTime() - NOW.getTime()) / 86400000);
}

interface Doc {
  id: number; name: string; docType: string; category: string;
  source: string; updated: string; expiry: string;
}
const DOCS: Doc[] = [
  { id: 1, name: "Passport", docType: "Passport", category: "Identity", source: "DigiLocker", updated: "Apr 2026", expiry: "2027-03-12" },
  { id: 2, name: "Aadhaar", docType: "Aadhaar", category: "Identity", source: "DigiLocker", updated: "Jan 2026", expiry: "" },
  { id: 3, name: "PAN", docType: "PAN", category: "Identity", source: "DigiLocker", updated: "Jan 2026", expiry: "" },
  { id: 4, name: "Driving licence", docType: "Driver License", category: "Identity", source: "DigiLocker", updated: "Feb 2026", expiry: "2026-11-15" },
  { id: 5, name: "Offer letter", docType: "Offer Letter", category: "Employment", source: "Gmail", updated: "Apr 2026", expiry: "" },
  { id: 6, name: "Payslips, 24 months", docType: "Payslip", category: "Employment", source: "Gmail", updated: "Jun 2026", expiry: "" },
  { id: 7, name: "Form 16, FY25-26", docType: "Form 16", category: "Finance", source: "Gmail", updated: "May 2026", expiry: "" },
  { id: 8, name: "Bank statements", docType: "Bank Statement", category: "Finance", source: "Gmail", updated: "Jun 2026", expiry: "" },
  { id: 9, name: "Investment statement", docType: "Investment Statement", category: "Finance", source: "Drive", updated: "May 2026", expiry: "" },
  { id: 10, name: "Health insurance", docType: "Health Insurance", category: "Insurance", source: "Gmail", updated: "Mar 2026", expiry: "2026-08-30" },
  { id: 11, name: "Life insurance, HDFC", docType: "Life Insurance", category: "Insurance", source: "Gmail", updated: "Mar 2026", expiry: "2049-03-01" },
  { id: 12, name: "Prescriptions", docType: "Prescription", category: "Medical", source: "ABHA", updated: "Mar 2026", expiry: "" },
  { id: 13, name: "Lab reports", docType: "Lab Report", category: "Medical", source: "ABHA", updated: "Mar 2026", expiry: "" },
  { id: 14, name: "Sale deed, Whitefield", docType: "Sale Deed", category: "Property", source: "Upload", updated: "2024", expiry: "" },
  { id: 15, name: "Property tax receipt", docType: "Property Tax Receipt", category: "Property", source: "Upload", updated: "Apr 2026", expiry: "" }
];
const HAVE = new Set(DOCS.map((d) => d.docType));

const CATEGORIES: { name: string; complete: number; updated: string }[] = [
  { name: "Identity", complete: 100, updated: "Apr 2026" },
  { name: "Employment", complete: 80, updated: "Jun 2026" },
  { name: "Finance", complete: 90, updated: "Jun 2026" },
  { name: "Insurance", complete: 75, updated: "Mar 2026" },
  { name: "Property", complete: 70, updated: "Apr 2026" },
  { name: "Medical", complete: 85, updated: "Mar 2026" }
];

interface LifeEvent { id: string; name: string; blurb: string; reqs: string[]; }
const EVENTS: LifeEvent[] = [
  { id: "visa", name: "Schengen visa", blurb: "Travel pack", reqs: ["Passport", "Employment Letter", "Payslip", "Bank Statement", "Form 16", "Travel Insurance", "Flight Reservation", "Hotel Booking"] },
  { id: "homeloan", name: "Home loan", blurb: "Application pack", reqs: ["PAN", "Aadhaar", "Form 16", "Bank Statement", "Payslip", "Sale Deed", "Property Tax Receipt"] },
  { id: "hospital", name: "Hospital admission", blurb: "Cashless pack", reqs: ["Aadhaar", "Prescription", "Lab Report", "Discharge Summary", "Pre-Authorization", "Health Insurance"] },
  { id: "tax", name: "Tax filing", blurb: "FY 2025-26", reqs: ["PAN", "Aadhaar", "Form 16", "Bank Statement", "Investment Statement", "Capital Gains Statement"] },
  { id: "property", name: "Property sale", blurb: "Resale pack", reqs: ["Sale Deed", "Property Tax Receipt", "PAN", "Aadhaar", "Encumbrance Certificate"] },
  { id: "bgv", name: "Job switch verification", blurb: "Background check", reqs: ["Aadhaar", "PAN", "Payslip", "Offer Letter", "Experience Letter"] },
  { id: "passport", name: "Passport renewal", blurb: "Tatkal ready", reqs: ["Passport", "Aadhaar", "PAN"] }
];

interface EvalRow { label: string; have: boolean; }
interface EvalResult { rows: EvalRow[]; score: number; haveCount: number; }
function evalEvent(ev: LifeEvent): EvalResult {
  const rows: EvalRow[] = ev.reqs.map((r) => ({ label: r, have: HAVE.has(r) }));
  const haveCount = rows.filter((r) => r.have).length;
  const score = Math.round((haveCount / rows.length) * 100);
  return { rows, score, haveCount };
}

type Tone = "ready" | "warn" | "wax" | "flat";
function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const map: Record<Tone, { bg: string; fg: string }> = {
    ready: { bg: "rgba(111,176,126,0.14)", fg: T.ready },
    warn: { bg: "rgba(201,162,39,0.14)", fg: T.gold },
    wax: { bg: "rgba(194,80,46,0.16)", fg: T.wax },
    flat: { bg: "rgba(163,155,134,0.12)", fg: T.muted }
  };
  const c = map[tone];
  return (
    <span style={{ background: c.bg, color: c.fg, fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 999, letterSpacing: 0.3 }}>
      {children}
    </span>
  );
}

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, ...style }}>
      {children}
    </div>
  );
}

function Stamp() {
  return (
    <div style={{ transform: "rotate(-9deg)", border: `2px solid ${T.wax}`, color: T.wax,
      borderRadius: 7, padding: "3px 10px", fontSize: 12, fontWeight: 800, letterSpacing: 2,
      fontFamily: "ui-monospace, monospace", opacity: 0.92 }}>
      READY
    </div>
  );
}

function Ring({ score }: { score: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const col = score >= 100 ? T.ready : score >= 70 ? T.gold : T.wax;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke={T.border} strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={col} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill={T.parchment}>{score}</text>
    </svg>
  );
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ color: T.parchment, fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>{title}</h2>
      <p style={{ color: T.muted, fontSize: 13.5, margin: "5px 0 0" }}>{sub}</p>
    </div>
  );
}

const btnGold: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, background: T.gold, color: "#1A1505", border: "none", borderRadius: 10, padding: "10px 15px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const btnGhost: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, background: T.raised, color: T.parchment, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnDanger: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: T.wax, border: `1px solid rgba(194,80,46,0.4)`, borderRadius: 10, padding: "10px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer" };

function Home({ go }: { go: (r: string) => void }) {
  const featured = ["visa", "homeloan", "hospital", "tax"];
  const cards = EVENTS.filter((e) => featured.includes(e.id)).map((e) => ({ ev: e, res: evalEvent(e) }));
  const expiring = DOCS.filter((d) => d.expiry && daysUntil(d.expiry) < 200)
    .map((d) => ({ d, days: daysUntil(d.expiry) }))
    .sort((a, b) => a.days - b.days);
  const critical: [string, string, Tone][] = [
    ["Nominee missing", "SBI ULIP and Nippon Small Cap have no nominee", "wax"],
    ["Travel insurance missing", "Needed for your Schengen visa pack", "warn"],
    ["Experience letter missing", "Needed for a job switch verification", "warn"]
  ];
  return (
    <div>
      <SectionHead title="Good evening, Ravi" sub="What do you want to be ready for?" />
      <div style={{ display: "flex", gap: 10, alignItems: "center", background: T.panel, border: `1px solid ${T.border}`,
        borderRadius: 12, padding: "12px 16px", marginBottom: 22, cursor: "pointer" }} onClick={() => go("packages")}>
        <Search size={17} color={T.gold} />
        <span style={{ flex: 1, color: T.muted, fontSize: 14 }}>Prepare a visa, a home loan, a hospital admission, a tax filing</span>
        <span style={btnGold}>Build a pack</span>
      </div>
      <div style={{ color: T.faint, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>READINESS CENTER</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 22 }}>
        {cards.map(({ ev, res }) => (
          <Card key={ev.id} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
            <Ring score={res.score} />
            <div style={{ flex: 1 }}>
              <div style={{ color: T.parchment, fontWeight: 700, fontSize: 14.5 }}>{ev.name}</div>
              <div style={{ color: T.muted, fontSize: 12.5, marginTop: 3 }}>
                {res.score === 100 ? "Everything is in place" : `${res.rows.length - res.haveCount} item${res.rows.length - res.haveCount === 1 ? "" : "s"} missing`}
              </div>
            </div>
            {res.score === 100 ? <Stamp /> : <ChevronRight size={18} color={T.faint} />}
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Clock size={16} color={T.gold} />
            <span style={{ fontWeight: 700, color: T.parchment, fontSize: 14 }}>Expiring soon</span>
          </div>
          {expiring.map(({ d, days }, i) => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "11px 0", borderTop: i ? `1px solid ${T.border}` : "none" }}>
              <span style={{ color: T.parchment, fontSize: 13.5 }}>{d.name}</span>
              <Pill tone={days < 90 ? "wax" : "warn"}>{days} days</Pill>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} color={T.wax} />
            <span style={{ fontWeight: 700, color: T.parchment, fontSize: 14 }}>Missing critical</span>
          </div>
          {critical.map((c, i) => (
            <div key={i} style={{ padding: "11px 0", borderTop: i ? `1px solid ${T.border}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: T.parchment, fontSize: 13.5, fontWeight: 600 }}>{c[0]}</span>
                <Pill tone={c[2]}>{c[2] === "wax" ? "urgent" : "soon"}</Pill>
              </div>
              <div style={{ color: T.muted, fontSize: 12, marginTop: 3 }}>{c[1]}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Packages() {
  const [sel, setSel] = useState<string>("visa");
  const [toast, setToast] = useState<string | null>(null);
  const ev = EVENTS.find((e) => e.id === sel) ?? EVENTS[0];
  const res = evalEvent(ev);
  const fire = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 2600); };
  return (
    <div>
      <SectionHead title="Life-event packages" sub="Pick an event. LifePack assembles the pack from your real vault, flags what is missing, and exports it." />
      {toast && (
        <div style={{ background: "rgba(111,176,126,0.12)", border: `1px solid rgba(111,176,126,0.4)`,
          color: T.ready, borderRadius: 12, padding: "11px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          {toast}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {EVENTS.map((e) => {
            const r = evalEvent(e);
            const active = e.id === sel;
            return (
              <button key={e.id} onClick={() => setSel(e.id)}
                style={{ textAlign: "left", cursor: "pointer", background: active ? T.raised : T.panel,
                  border: `1px solid ${active ? T.gold : T.border}`, borderRadius: 12, padding: "13px 15px",
                  display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.parchment, fontWeight: 600, fontSize: 13.5 }}>{e.name}</div>
                  <div style={{ color: T.faint, fontSize: 11.5, marginTop: 2 }}>{e.blurb}</div>
                </div>
                {r.score === 100 ? <Pill tone="ready">ready</Pill> : <span style={{ color: r.score >= 70 ? T.gold : T.wax, fontWeight: 700, fontSize: 13 }}>{r.score}%</span>}
              </button>
            );
          })}
        </div>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <Ring score={res.score} />
            <div style={{ flex: 1 }}>
              <div style={{ color: T.parchment, fontWeight: 700, fontSize: 17 }}>{ev.name}</div>
              <div style={{ color: T.muted, fontSize: 12.5, marginTop: 3 }}>{res.haveCount} of {res.rows.length} documents ready</div>
            </div>
            {res.score === 100 && <Stamp />}
          </div>
          <div style={{ marginBottom: 16 }}>
            {res.rows.map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0",
                borderTop: i ? `1px solid ${T.border}` : "none" }}>
                {row.have
                  ? <Check size={16} color={T.ready} />
                  : <X size={16} color={T.wax} />}
                <span style={{ color: row.have ? T.parchment : T.muted, fontSize: 13.5 }}>{row.label}</span>
                {!row.have && <span style={{ marginLeft: "auto" }}><Pill tone="wax">missing</Pill></span>}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={btnGold} onClick={() => fire(`${ev.name} kit assembled with ${res.haveCount} documents. ZIP ready to download.`)}>
              <Download size={15} /> Download ZIP kit
            </button>
            <button style={btnGhost} onClick={() => fire("Checklist generated for the missing items.")}>
              <FileCheck size={15} /> Generate checklist
            </button>
            <button style={btnGhost} onClick={() => fire("Secure share link created. Expires in 7 days.")}>
              <Share2 size={15} /> Share link
            </button>
            <button style={btnGhost} onClick={() => fire("Pack emailed to you.")}>
              <Mail size={15} /> Email
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface Source { id: string; name: string; connected: boolean; }
function Documents() {
  const [sources, setSources] = useState<Source[]>([
    { id: "gmail", name: "Gmail", connected: true },
    { id: "drive", name: "Drive", connected: true },
    { id: "digilocker", name: "DigiLocker", connected: true },
    { id: "upload", name: "Upload", connected: true }
  ]);
  const toggle = (id: string) => setSources((s) => s.map((x) => (x.id === id ? { ...x, connected: !x.connected } : x)));
  return (
    <div>
      <SectionHead title="Documents" sub="Everything files itself. Connect a source, LifePack reads and sorts each one." />
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {sources.map((s) => (
          <button key={s.id} onClick={() => toggle(s.id)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8,
              background: s.connected ? "rgba(111,176,126,0.1)" : T.raised,
              color: s.connected ? T.ready : T.muted,
              border: `1px solid ${s.connected ? "rgba(111,176,126,0.4)" : T.border}`,
              borderRadius: 10, padding: "9px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {s.connected ? <Check size={14} /> : <Link2 size={14} />}{s.name}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {CATEGORIES.map((c) => {
          const count = DOCS.filter((d) => d.category === c.name).length;
          return (
            <Card key={c.name}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ color: T.parchment, fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                <span style={{ color: T.gold, fontSize: 13, fontWeight: 700 }}>{c.complete}%</span>
              </div>
              <div style={{ height: 5, background: T.border, borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${c.complete}%`, background: T.gold }} />
              </div>
              <div style={{ color: T.faint, fontSize: 11.5, marginTop: 8 }}>{count} documents, updated {c.updated}</div>
            </Card>
          );
        })}
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", padding: "12px 16px", fontSize: 11.5,
          color: T.faint, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${T.border}` }}>
          <div>Document</div><div>Category</div><div>Source</div><div style={{ textAlign: "right" }}>Expiry</div>
        </div>
        {DOCS.map((d, i) => (
          <div key={d.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", padding: "12px 16px",
            alignItems: "center", borderTop: i ? `1px solid ${T.border}` : "none", fontSize: 13 }}>
            <div style={{ color: T.parchment, fontWeight: 600 }}>{d.name}</div>
            <div style={{ color: T.muted }}>{d.category}</div>
            <div><Pill tone="flat">{d.source}</Pill></div>
            <div style={{ textAlign: "right", color: d.expiry ? T.muted : T.faint, fontSize: 12.5 }}>
              {d.expiry ? `${daysUntil(d.expiry)} days` : "-"}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

interface Reading { label: string; value: string; status: Tone; }
function Health() {
  const readings: Reading[] = [
    { label: "HbA1c", value: "7.2 %", status: "wax" },
    { label: "LDL cholesterol", value: "119 mg/dL", status: "warn" },
    { label: "Blood pressure", value: "124/82", status: "ready" }
  ];
  return (
    <div>
      <SectionHead title="Health" sub="Walk into every appointment ready. LifePack organizes, never diagnoses." />
      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: T.parchment, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Your sugar control is slipping. HbA1c has risen across the last three reports to 7.2, above the normal ceiling.
          Cholesterol is improving and blood pressure is steady. Worth raising the HbA1c trend with your doctor.
        </p>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {readings.map((r, i) => (
          <Card key={i}>
            <div style={{ color: T.muted, fontSize: 12.5 }}>{r.label}</div>
            <div style={{ color: T.parchment, fontSize: 20, fontWeight: 800, margin: "6px 0 8px" }}>{r.value}</div>
            <Pill tone={r.status}>{r.status === "ready" ? "in range" : r.status === "warn" ? "watch" : "out of range"}</Pill>
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={btnGold}><Download size={15} /> Export visit pack</button>
        <button style={btnGhost}><Plus size={15} /> Log a reading</button>
      </div>
    </div>
  );
}

function Family() {
  const members: { name: string; rel: string; role: string; tone: Tone }[] = [
    { name: "Jaya", rel: "Spouse", role: "Full member", tone: "ready" },
    { name: "Veena", rel: "Sister", role: "Emergency access", tone: "warn" },
    { name: "Aarav", rel: "Son", role: "Health and IDs", tone: "flat" }
  ];
  return (
    <div>
      <SectionHead title="Family" sub="A shared archive where each person sees only what they should." />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button style={btnGold}><Plus size={15} /> Add member</button>
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {members.map((m, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 1fr", alignItems: "center",
            padding: "14px 16px", borderTop: i ? `1px solid ${T.border}` : "none" }}>
            <div>
              <div style={{ color: T.parchment, fontWeight: 600, fontSize: 13.5 }}>{m.name}</div>
              <div style={{ color: T.faint, fontSize: 11.5, marginTop: 2 }}>{m.rel}</div>
            </div>
            <div style={{ color: T.muted, fontSize: 12.5 }}>{m.role}</div>
            <div style={{ textAlign: "right" }}><Pill tone={m.tone}>active</Pill></div>
          </div>
        ))}
      </Card>
    </div>
  );
}

interface Asset { name: string; type: string; value: number; cls: "asset" | "liability"; nominee: boolean; }
const WEALTH: Asset[] = [
  { name: "HDFC term cover", type: "Insurance", value: 10000000, cls: "asset", nominee: true },
  { name: "SBI ULIP Smart Wealth", type: "Insurance", value: 850000, cls: "asset", nominee: false },
  { name: "Parag Parikh Flexi Cap", type: "Mutual fund", value: 1240000, cls: "asset", nominee: true },
  { name: "Nippon Small Cap", type: "Mutual fund", value: 560000, cls: "asset", nominee: false },
  { name: "EPF corpus", type: "Pension", value: 1850000, cls: "asset", nominee: true },
  { name: "HDFC home loan", type: "Liability", value: 4200000, cls: "liability", nominee: false }
];
function Wealth() {
  const [onlyNoNominee, setOnly] = useState<boolean>(false);
  const rows = onlyNoNominee ? WEALTH.filter((w) => !w.nominee && w.cls === "asset") : WEALTH;
  return (
    <div>
      <SectionHead title="Wealth" sub="Your money documents, read for what matters: nominees and gaps." />
      <button onClick={() => setOnly(!onlyNoNominee)}
        style={{ ...(onlyNoNominee ? btnGold : btnGhost), marginBottom: 14 }}>
        No nominee assigned
      </button>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {rows.map((w, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr", alignItems: "center",
            padding: "13px 16px", borderTop: i ? `1px solid ${T.border}` : "none", fontSize: 13 }}>
            <div>
              <div style={{ color: T.parchment, fontWeight: 600 }}>{w.name}</div>
              <div style={{ color: T.faint, fontSize: 11.5, marginTop: 2 }}>{w.type}</div>
            </div>
            <div style={{ color: w.cls === "liability" ? T.wax : T.parchment, fontWeight: 600 }}>
              {w.cls === "liability" ? "-" : ""}{money(w.value)}
            </div>
            <div style={{ textAlign: "right" }}>{w.nominee ? <Pill tone="ready">nominee set</Pill> : <Pill tone="wax">no nominee</Pill>}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Legacy() {
  const [armed, setArmed] = useState<boolean>(false);
  return (
    <div>
      <SectionHead title="Legacy handoff" sub="Make sure nothing is lost if you are gone, without giving it away early." />
      {armed && (
        <div style={{ background: "rgba(194,80,46,0.12)", border: `1px solid rgba(194,80,46,0.4)`, color: T.wax,
          borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          SOS armed. Emergency contacts notified and the grace period has started.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Clock size={16} color={T.ready} />
            <span style={{ fontWeight: 700, color: T.parchment, fontSize: 14 }}>Inactivity trigger</span>
            <span style={{ marginLeft: "auto" }}><Pill tone="ready">active</Pill></span>
          </div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>Check in every 30 days, then a 14 day grace period with reminders before anything is shared.</div>
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <KeyRound size={16} color={T.gold} />
            <span style={{ fontWeight: 700, color: T.parchment, fontSize: 14 }}>Emergency SOS</span>
          </div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>Trigger the handoff yourself, right now.</div>
          <button onClick={() => setArmed(!armed)} style={armed ? btnGhost : btnDanger}>{armed ? "Cancel SOS" : "Arm SOS"}</button>
        </Card>
      </div>
      <div style={{ color: T.faint, fontSize: 12, lineHeight: 1.6 }}>This handoff shares documents. It is not a will and does not override succession law.</div>
    </div>
  );
}

function Trust() {
  const posture: { label: string; on: boolean }[] = [
    { label: "Zero knowledge encryption", on: true },
    { label: "Recovery key set", on: true },
    { label: "India data residency", on: true },
    { label: "Two factor on sensitive actions", on: false }
  ];
  return (
    <div>
      <SectionHead title="Trust center" sub="In plain language: what is protected, and who can reach it." />
      <Card style={{ marginBottom: 16 }}>
        {posture.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i ? `1px solid ${T.border}` : "none" }}>
            {p.on ? <Check size={16} color={T.ready} /> : <Circle size={16} color={T.gold} />}
            <span style={{ flex: 1, color: T.parchment, fontSize: 13.5, fontWeight: 600 }}>{p.label}</span>
            {p.on ? <Pill tone="ready">on</Pill> : <Pill tone="warn">off</Pill>}
          </div>
        ))}
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Eye size={16} color={T.gold} />
          <span style={{ fontWeight: 700, color: T.parchment, fontSize: 14 }}>Recent access</span>
        </div>
        <div style={{ color: T.muted, fontSize: 13 }}><b style={{ color: T.parchment }}>Jaya</b> viewed HDFC term policy, 2h ago</div>
      </Card>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={btnGhost}><Download size={16} /> Export everything</button>
        <button style={btnDanger}><Trash2 size={16} /> Delete account and data</button>
      </div>
    </div>
  );
}

interface NavItem { key: string; label: string; icon: LucideIcon; }
const NAV: NavItem[] = [
  { key: "home", label: "Home", icon: LayoutGrid },
  { key: "packages", label: "Packages", icon: Plane },
  { key: "documents", label: "Documents", icon: FolderOpen },
  { key: "health", label: "Health", icon: HeartPulse },
  { key: "family", label: "Family", icon: Users },
  { key: "wealth", label: "Wealth", icon: Wallet },
  { key: "legacy", label: "Legacy handoff", icon: KeyRound },
  { key: "trust", label: "Trust center", icon: ShieldCheck }
];

export default function App() {
  const [route, setRoute] = useState<string>("home");
  const mrz = useMemo(() => "P<INDLIFEPACK<<RAVI<<<<<<<<<<<<<<<<<<<<<<<<<<<<", []);
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.ink, fontFamily: "Inter, system-ui, sans-serif", color: T.parchment }}>
      <aside style={{ width: 230, background: T.panel, borderRight: `1px solid ${T.border}`, padding: 18, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "4px 6px" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${T.goldBright}, ${T.gold})`, display: "grid", placeItems: "center" }}>
            <FileCheck size={16} color="#1A1505" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.2, color: T.parchment }}>LifePack</div>
            <div style={{ fontSize: 10, color: T.gold, letterSpacing: 1.5 }}>LIVING ARCHIVE</div>
          </div>
        </div>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: T.faint, letterSpacing: 1,
          overflow: "hidden", whiteSpace: "nowrap", marginBottom: 18, padding: "0 6px" }}>{mrz}</div>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = route === n.key;
          return (
            <button key={n.key} onClick={() => setRoute(n.key)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, marginBottom: 4,
                background: active ? T.raised : "transparent", color: active ? T.parchment : T.muted,
                border: `1px solid ${active ? T.border : "transparent"}`, borderRadius: 9, padding: "9px 11px",
                fontSize: 13.5, fontWeight: active ? 600 : 500, cursor: "pointer", textAlign: "left" }}>
              <Icon size={17} color={active ? T.gold : T.muted} /> {n.label}
            </button>
          );
        })}
        <div style={{ marginTop: 18, padding: "10px 11px", borderRadius: 9, background: T.raised, border: `1px solid ${T.border}`,
          fontSize: 11.5, color: T.muted, lineHeight: 1.5, display: "flex", gap: 8 }}>
          <ShieldCheck size={24} color={T.ready} />
          <span>Encrypted on your device. Even we cannot read your archive.</span>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "30px 34px", maxWidth: 1060 }}>
        {route === "home" && <Home go={setRoute} />}
        {route === "packages" && <Packages />}
        {route === "documents" && <Documents />}
        {route === "health" && <Health />}
        {route === "family" && <Family />}
        {route === "wealth" && <Wealth />}
        {route === "legacy" && <Legacy />}
        {route === "trust" && <Trust />}
      </main>
    </div>
  );
}
