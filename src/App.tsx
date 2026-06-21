import { useState, useMemo } from "react";
import type { Dispatch, SetStateAction, ReactNode, CSSProperties } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard, Wallet, HeartPulse, Users, ShieldCheck,
  FileText, KeyRound, Search, ArrowUpRight, ArrowDownRight,
  Minus, Download, AlertTriangle, Sparkles, Lock,
  Plus, Clock, Eye, Check, Circle, Trash2, Link2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// LifePack AI - typed reference build for Lovable (strict mode safe).
// Swap every SEAM for a native integration: Supabase auth and social
// login, zero knowledge crypto and key escrow, consented no retention
// AI extraction, DigiLocker and ABHA connect. Stubs are honest, not faked.

const T = {
  bg: "#0B0E14",
  panel: "#131722",
  raised: "#1A2030",
  border: "#232A3A",
  text: "#E6E9EF",
  muted: "#8A93A6",
  faint: "#5B6376",
  indigo: "#4B00FF",
  indigoBright: "#7C4DFF",
  red: "#EF4136",
  green: "#3DD68C",
  amber: "#F2B441"
} as const;

const money = (n: number): string => "\u20B9" + Math.abs(n).toLocaleString("en-IN");

// ---------- types ----------

type AssetClass = "asset" | "liability";

interface WealthItem {
  id: number;
  name: string;
  type: string;
  inst: string;
  value: number;
  cls: AssetClass;
  status: string;
  maturity: string;
  nominee: boolean;
}

interface Point { date: string; value: number; }

interface Marker {
  key: string;
  name: string;
  unit: string;
  low: number;
  high: number;
  series: Point[];
}

interface Totals {
  assets: number;
  liabilities: number;
  net: number;
  noNominee: number;
}

interface Reading {
  latest: number;
  delta: number;
  inRange: boolean;
  direction: "up" | "down" | "flat";
  improving: "better" | "worse" | "flat";
  note: string;
}

type Tone = "good" | "warn" | "bad" | "flat";

// ---------- mock data (replace with extracted data in Lovable) ----------

const WEALTH: WealthItem[] = [
  { id: 1, name: "HDFC Click 2 Protect term cover", type: "Insurance", inst: "HDFC Life", value: 10000000, cls: "asset", status: "active", maturity: "2049-03-01", nominee: true },
  { id: 2, name: "SBI ULIP Smart Wealth", type: "Insurance", inst: "SBI Life", value: 850000, cls: "asset", status: "active", maturity: "2032-07-15", nominee: false },
  { id: 3, name: "Parag Parikh Flexi Cap", type: "Mutual fund", inst: "Zerodha Coin", value: 1240000, cls: "asset", status: "active", maturity: "", nominee: true },
  { id: 4, name: "Nippon Small Cap", type: "Mutual fund", inst: "Groww", value: 560000, cls: "asset", status: "active", maturity: "", nominee: false },
  { id: 5, name: "ICICI 5 year fixed deposit", type: "Fixed deposit", inst: "ICICI Bank", value: 500000, cls: "asset", status: "active", maturity: "2026-09-10", nominee: true },
  { id: 6, name: "Reliance equity holdings", type: "Equity", inst: "Zerodha", value: 980000, cls: "asset", status: "active", maturity: "", nominee: false },
  { id: 7, name: "Whitefield flat", type: "Real estate", inst: "Self", value: 9500000, cls: "asset", status: "active", maturity: "", nominee: true },
  { id: 8, name: "EPF corpus", type: "EPF or pension", inst: "EPFO", value: 1850000, cls: "asset", status: "active", maturity: "", nominee: true },
  { id: 9, name: "Sovereign gold bonds", type: "Gold", inst: "RBI", value: 420000, cls: "asset", status: "active", maturity: "2027-02-20", nominee: false },
  { id: 10, name: "HDFC home loan", type: "Loan or liability", inst: "HDFC Bank", value: 4200000, cls: "liability", status: "active", maturity: "2038-11-01", nominee: false },
  { id: 11, name: "LIC Jeevan Anand (lapsed)", type: "Insurance", inst: "LIC", value: 300000, cls: "asset", status: "lapsed", maturity: "2040-01-01", nominee: true }
];

const HEALTH: Record<string, Marker[]> = {
  Diabetes: [
    { key: "hba1c", name: "HbA1c", unit: "%", low: 4.0, high: 5.7,
      series: [{ date: "Jan 25", value: 6.4 }, { date: "May 25", value: 6.7 }, { date: "Oct 25", value: 6.9 }, { date: "Mar 26", value: 7.2 }] },
    { key: "fbs", name: "Fasting glucose", unit: "mg/dL", low: 70, high: 100,
      series: [{ date: "Jan 25", value: 118 }, { date: "May 25", value: 124 }, { date: "Oct 25", value: 129 }, { date: "Mar 26", value: 134 }] }
  ],
  Heart: [
    { key: "ldl", name: "LDL cholesterol", unit: "mg/dL", low: 0, high: 100,
      series: [{ date: "Jan 25", value: 142 }, { date: "May 25", value: 138 }, { date: "Oct 25", value: 128 }, { date: "Mar 26", value: 119 }] },
    { key: "hdl", name: "HDL cholesterol", unit: "mg/dL", low: 40, high: 60,
      series: [{ date: "Jan 25", value: 38 }, { date: "May 25", value: 41 }, { date: "Oct 25", value: 44 }, { date: "Mar 26", value: 46 }] },
    { key: "bp", name: "Systolic BP", unit: "mmHg", low: 90, high: 120,
      series: [{ date: "Jan 25", value: 128 }, { date: "May 25", value: 132 }, { date: "Oct 25", value: 126 }, { date: "Mar 26", value: 124 }] }
  ],
  Kidney: [
    { key: "creat", name: "Creatinine", unit: "mg/dL", low: 0.7, high: 1.3,
      series: [{ date: "Jan 25", value: 0.9 }, { date: "May 25", value: 0.95 }, { date: "Oct 25", value: 1.0 }, { date: "Mar 26", value: 1.0 }] },
    { key: "egfr", name: "eGFR", unit: "mL/min", low: 90, high: 200,
      series: [{ date: "Jan 25", value: 96 }, { date: "May 25", value: 94 }, { date: "Oct 25", value: 92 }, { date: "Mar 26", value: 91 }] }
  ]
};

// ---------- interpretation helpers (the AI first thesis, mocked) ----------

function interpret(marker: Marker): Reading {
  const s = marker.series;
  const latest = s[s.length - 1].value;
  const prev = s[s.length - 2].value;
  const delta = latest - prev;
  const inRange = latest >= marker.low && latest <= marker.high;
  const higherBetter = marker.key === "hdl" || marker.key === "egfr";
  let direction: Reading["direction"] = "flat";
  if (Math.abs(delta) > 0.001) direction = delta > 0 ? "up" : "down";
  let improving: Reading["improving"] = "flat";
  if (direction !== "flat") {
    const good = higherBetter ? direction === "up" : direction === "down";
    improving = good ? "better" : "worse";
  }
  let note: string;
  if (inRange && improving !== "worse") note = "Within range and holding.";
  else if (inRange && improving === "worse") note = "Still in range but drifting the wrong way.";
  else if (!inRange && improving === "better") note = "Out of range but moving the right way.";
  else note = "Out of range and trending the wrong way. Worth raising with your doctor.";
  return { latest, delta, inRange, direction, improving, note };
}

// ---------- ui atoms ----------

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const map: Record<Tone, { bg: string; fg: string }> = {
    good: { bg: "rgba(61,214,140,0.12)", fg: T.green },
    warn: { bg: "rgba(242,180,65,0.12)", fg: T.amber },
    bad: { bg: "rgba(239,65,54,0.14)", fg: T.red },
    flat: { bg: "rgba(138,147,166,0.12)", fg: T.muted }
  };
  const c = map[tone];
  return (
    <span style={{ background: c.bg, color: c.fg, fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 999, letterSpacing: 0.2 }}>
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

const btnPrimary: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, background: T.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, background: T.raised, color: T.text, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnDanger: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: T.red, border: `1px solid rgba(239,65,54,0.4)`, borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" };

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ color: T.text, fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>{title}</h2>
      <p style={{ color: T.muted, fontSize: 13.5, margin: "5px 0 0" }}>{sub}</p>
    </div>
  );
}

// ---------- overview ----------

function Overview({ totals }: { totals: Totals }) {
  const rows: [string, string, Tone][] = [
    ["Two holdings have no nominee", "If anything happened, your family would have to fight for the SBI ULIP and your Nippon Small Cap units. Assign nominees.", "warn"],
    ["HbA1c is trending up", "Up from 6.4 to 7.2 over a year. Out of range and moving the wrong way. Raise it with your doctor.", "bad"],
    ["ICICI fixed deposit matures in 90 days", "Decide to renew or redeem before 10 Sep 2026.", "warn"]
  ];
  return (
    <div>
      <SectionHead title="Estate overview" sub="Your whole life, read in one place." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
        <Card>
          <div style={{ color: T.muted, fontSize: 12.5, marginBottom: 8 }}>Net position</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.text }}>{money(totals.net)}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{money(totals.assets)} assets, {money(totals.liabilities)} owed</div>
        </Card>
        <Card>
          <div style={{ color: T.muted, fontSize: 12.5, marginBottom: 8 }}>Without a nominee</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.red }}>{totals.noNominee}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>holdings your family could lose</div>
        </Card>
        <Card>
          <div style={{ color: T.muted, fontSize: 12.5, marginBottom: 8 }}>Health, latest read</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.amber }}>2 markers</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>drifting out of range</div>
        </Card>
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Sparkles size={16} color={T.indigoBright} />
          <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>What needs you this week</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: i ? `1px solid ${T.border}` : "none" }}>
            <div style={{ marginTop: 2 }}>
              <AlertTriangle size={16} color={r[2] === "bad" ? T.red : T.amber} />
            </div>
            <div>
              <div style={{ color: T.text, fontWeight: 600, fontSize: 13.5 }}>{r[0]}</div>
              <div style={{ color: T.muted, fontSize: 12.5, marginTop: 3, lineHeight: 1.55 }}>{r[1]}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- wealth ----------

interface SelectProps {
  label: string;
  val: string;
  set: Dispatch<SetStateAction<string>>;
  opts: string[];
}

function FilterSelect({ label, val, set, opts }: SelectProps) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
      <select value={val} onChange={(e) => set(e.target.value)}
        style={{ background: T.raised, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, outline: "none" }}>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Wealth() {
  const types = ["All", ...Array.from(new Set(WEALTH.map((w) => w.type)))];
  const [type, setType] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [nominee, setNominee] = useState<string>("All");
  const [quick, setQuick] = useState<string | null>(null);

  const rows = useMemo<WealthItem[]>(() => {
    return WEALTH.filter((w) => {
      if (type !== "All" && w.type !== type) return false;
      if (status !== "All" && w.status !== status) return false;
      if (nominee === "Assigned" && !w.nominee) return false;
      if (nominee === "Missing" && w.nominee) return false;
      if (quick === "noNominee" && (w.nominee || w.cls === "liability")) return false;
      if (quick === "expiring") {
        if (!w.maturity) return false;
        if (new Date(w.maturity) > new Date("2026-09-20")) return false;
      }
      if (quick === "lapsed" && w.status !== "lapsed") return false;
      return true;
    });
  }, [type, status, nominee, quick]);

  const chips: [string, string][] = [
    ["expiring", "Expiring in 90 days"],
    ["noNominee", "No nominee"],
    ["lapsed", "Lapsed"]
  ];

  return (
    <div>
      <SectionHead title="Personal wealth" sub="Filter by what matters, not by file name." />
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {chips.map(([k, l]) => (
          <button key={k} onClick={() => setQuick(quick === k ? null : k)}
            style={{ background: quick === k ? T.indigo : T.raised, color: quick === k ? "#fff" : T.muted,
              border: `1px solid ${quick === k ? T.indigo : T.border}`, borderRadius: 999, padding: "6px 13px",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <FilterSelect label="Type" val={type} set={setType} opts={types} />
        <FilterSelect label="Status" val={status} set={setStatus} opts={["All", "active", "lapsed", "matured", "claimPending"]} />
        <FilterSelect label="Nominee" val={nominee} set={setNominee} opts={["All", "Assigned", "Missing"]} />
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1.2fr 1fr 0.9fr 0.9fr", padding: "12px 16px",
          fontSize: 11.5, color: T.faint, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${T.border}` }}>
          <div>Holding</div><div>Institution</div><div>Value</div><div>Status</div><div>Nominee</div>
        </div>
        {rows.length === 0 && (
          <div style={{ padding: 36, textAlign: "center", color: T.muted, fontSize: 13.5 }}>
            Nothing matches these filters. Clear one to widen the view.
          </div>
        )}
        {rows.map((w, i) => (
          <div key={w.id} style={{ display: "grid", gridTemplateColumns: "2.4fr 1.2fr 1fr 0.9fr 0.9fr",
            padding: "13px 16px", alignItems: "center", borderTop: i ? `1px solid ${T.border}` : "none", fontSize: 13 }}>
            <div>
              <div style={{ color: T.text, fontWeight: 600 }}>{w.name}</div>
              <div style={{ color: T.faint, fontSize: 11.5, marginTop: 2 }}>{w.type}</div>
            </div>
            <div style={{ color: T.muted }}>{w.inst}</div>
            <div style={{ color: w.cls === "liability" ? T.red : T.text, fontWeight: 600 }}>
              {w.cls === "liability" ? "-" : ""}{money(w.value)}
            </div>
            <div><Pill tone={w.status === "active" ? "good" : "warn"}>{w.status}</Pill></div>
            <div>{w.nominee ? <Pill tone="good">assigned</Pill> : <Pill tone="bad">missing</Pill>}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- health ----------

function Health() {
  const groups = Object.keys(HEALTH);
  const flat: Marker[] = groups.flatMap((g) => HEALTH[g]);
  const [sel, setSel] = useState<string>("hba1c");
  const marker = flat.find((m) => m.key === sel) ?? flat[0];
  const meta = interpret(marker);

  const dirIcon = meta.direction === "flat"
    ? <Minus size={14} />
    : meta.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />;
  const dirColor = meta.improving === "better" ? T.green : meta.improving === "worse" ? T.red : T.muted;

  return (
    <div>
      <SectionHead title="Health" sub="One question: are you okay, and what changed." />

      <Card style={{ marginBottom: 16, borderColor: "rgba(124,77,255,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Sparkles size={16} color={T.indigoBright} />
          <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>Reading your latest reports</span>
        </div>
        <p style={{ color: T.text, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Your cholesterol picture is improving: LDL is down to 119 and HDL has climbed into range. But your
          sugar control is slipping. HbA1c has risen every reading for a year and is now 7.2, above the normal
          ceiling of 5.7, and fasting glucose is climbing with it. Kidney and blood pressure look stable.
        </p>
        <p style={{ color: T.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>
          This is an observation from your reports, not a diagnosis. The trend is worth raising with your doctor.
        </p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>{marker.name}</div>
              <div style={{ color: T.faint, fontSize: 12 }}>normal {marker.low} to {marker.high} {marker.unit}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: meta.inRange ? T.green : T.red }}>
                {meta.latest}<span style={{ fontSize: 12, color: T.muted, marginLeft: 4 }}>{marker.unit}</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, color: dirColor, fontSize: 12, fontWeight: 600 }}>
                {dirIcon}{meta.improving === "better" ? "improving" : meta.improving === "worse" ? "worsening" : "steady"}
              </div>
            </div>
          </div>
          <div style={{ height: 220, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marker.series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke={T.faint} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={T.faint} fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                <ReferenceArea y1={marker.low} y2={marker.high} fill={T.green} fillOpacity={0.1} />
                <Tooltip contentStyle={{ background: T.raised, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke={T.indigoBright} strokeWidth={2.4} dot={{ r: 4, fill: T.indigoBright }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 8, fontSize: 12.5, color: T.muted, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 18, height: 8, background: "rgba(61,214,140,0.25)", borderRadius: 2, display: "inline-block" }} />
            shaded band is the normal range. {meta.note}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 430, overflowY: "auto", paddingRight: 4 }}>
          {groups.map((g) => (
            <div key={g}>
              <div style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: 0.5, margin: "4px 0 6px" }}>{g}</div>
              {HEALTH[g].map((m) => {
                const mi = interpret(m);
                const active = m.key === sel;
                const tone: Tone = mi.inRange ? (mi.improving === "worse" ? "warn" : "good") : "bad";
                return (
                  <button key={m.key} onClick={() => setSel(m.key)}
                    style={{ width: "100%", textAlign: "left", marginBottom: 6, cursor: "pointer",
                      background: active ? T.raised : T.panel, border: `1px solid ${active ? T.indigoBright : T.border}`,
                      borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                      <span style={{ color: mi.inRange ? T.green : T.red, fontWeight: 700, fontSize: 13 }}>{mi.latest} {m.unit}</span>
                    </div>
                    <div style={{ marginTop: 5 }}>
                      <Pill tone={tone}>{mi.inRange ? (mi.improving === "worse" ? "in range, drifting" : "in range") : "out of range"}</Pill>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.indigo, color: "#fff",
          border: "none", borderRadius: 10, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          <Download size={16} /> Export latest prescription
        </button>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.raised, color: T.text,
          border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          <FileText size={16} /> Share report with doctor
        </button>
      </div>
    </div>
  );
}

// ---------- ask bar (AI first thesis, mocked sourced answer) ----------

interface Answer { text: string; src: string; }

function AskBar() {
  const [q, setQ] = useState<string>("");
  const [ans, setAns] = useState<Answer | null>(null);
  const demo = () => {
    // SEAM: in Lovable this runs the consented, no retention query path
    // over decrypted, semantically extracted data and returns a sourced answer.
    setAns({
      text: "You hold a 1 crore term cover with HDFC Life and an 8.5 lakh SBI ULIP. The SBI ULIP has no nominee assigned, so assign one to protect it.",
      src: "HDFC term policy, SBI ULIP statement"
    });
  };
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px" }}>
        <Search size={17} color={T.muted} />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") demo(); }}
          placeholder="Ask across your whole life, for example what insurance do I have"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.text, fontSize: 14 }} />
        <button onClick={demo} style={{ background: T.indigo, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Ask
        </button>
      </div>
      {ans && (
        <div style={{ marginTop: 10, background: T.raised, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Sparkles size={16} color={T.indigoBright} style={{ marginTop: 2 }} />
            <div>
              <div style={{ color: T.text, fontSize: 13.5, lineHeight: 1.6 }}>{ans.text}</div>
              <div style={{ color: T.faint, fontSize: 11.5, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={12} /> from {ans.src}
                <span style={{ marginLeft: 8, color: T.green }}>processed on device, not retained</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- family ----------

interface Member { id: number; name: string; relation: string; role: string; scope: string; lastActive: string; }
interface AccessEntry { who: string; action: string; item: string; when: string; }

const FAMILY: Member[] = [
  { id: 1, name: "Jaya", relation: "Spouse", role: "Adult member", scope: "All categories", lastActive: "Today" },
  { id: 2, name: "Veena", relation: "Sister", role: "Emergency access", scope: "Legacy handoff only", lastActive: "3 days ago" },
  { id: 3, name: "Aarav", relation: "Son", role: "Limited member", scope: "Health and IDs", lastActive: "Yesterday" }
];

const ACCESS: AccessEntry[] = [
  { who: "Jaya", action: "viewed", item: "HDFC term policy", when: "2h ago" },
  { who: "Aarav", action: "downloaded", item: "school records", when: "Yesterday" },
  { who: "Veena", action: "was granted", item: "emergency access", when: "3 days ago" }
];

function Family() {
  const roleTone = (r: string): Tone =>
    r === "Owner" || r === "Adult member" ? "good" : r === "Emergency access" ? "warn" : "flat";
  return (
    <div>
      <SectionHead title="Family" sub="A shared space where each person sees only what they should." />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: T.muted, fontSize: 13 }}>{FAMILY.length} members</span>
        <button style={btnPrimary}><Plus size={15} /> Add member</button>
      </div>
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.3fr 1.2fr 0.8fr", padding: "12px 16px",
          fontSize: 11.5, color: T.faint, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${T.border}` }}>
          <div>Member</div><div>Role</div><div>Can see</div><div style={{ textAlign: "right" }}>Active</div>
        </div>
        {FAMILY.map((m, i) => (
          <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.3fr 1.2fr 0.8fr",
            padding: "14px 16px", alignItems: "center", borderTop: i ? `1px solid ${T.border}` : "none" }}>
            <div>
              <div style={{ color: T.text, fontWeight: 600, fontSize: 13.5 }}>{m.name}</div>
              <div style={{ color: T.faint, fontSize: 11.5, marginTop: 2 }}>{m.relation}</div>
            </div>
            <div><Pill tone={roleTone(m.role)}>{m.role}</Pill></div>
            <div style={{ color: T.muted, fontSize: 12.5 }}>{m.scope}</div>
            <div style={{ color: T.faint, fontSize: 12, textAlign: "right" }}>{m.lastActive}</div>
          </div>
        ))}
      </Card>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Eye size={16} color={T.indigoBright} />
          <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>Access history</span>
        </div>
        {ACCESS.map((a, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderTop: i ? `1px solid ${T.border}` : "none" }}>
            <span style={{ color: T.muted, fontSize: 13 }}>
              <b style={{ color: T.text }}>{a.who}</b> {a.action} {a.item}
            </span>
            <span style={{ color: T.faint, fontSize: 12 }}>{a.when}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- legacy handoff ----------

interface Nominee { id: number; name: string; relation: string; tier: string; tone: Tone; ack: boolean; }

const NOMINEES: Nominee[] = [
  { id: 1, name: "Jaya", relation: "Spouse", tier: "Immediate", tone: "good", ack: true },
  { id: 2, name: "Veena", relation: "Sister", tier: "On verified death", tone: "warn", ack: true },
  { id: 3, name: "Family trust", relation: "Estate", tier: "On verified death", tone: "warn", ack: false }
];

const TIERS: [string, string][] = [
  ["Immediate", "Shared now with the people you trust most."],
  ["On verified death", "Released only after a death certificate and a second confirmation."],
  ["Never release", "Stays with you alone and is destroyed, never handed on."]
];

function Legacy() {
  const [armed, setArmed] = useState<boolean>(false);
  return (
    <div>
      <SectionHead title="Legacy handoff" sub="Make sure nothing is lost if you are gone, without giving it away early." />
      {armed && (
        <div style={{ background: "rgba(239,65,54,0.12)", border: `1px solid rgba(239,65,54,0.4)`,
          borderRadius: 12, padding: "12px 16px", marginBottom: 16, color: T.red, fontSize: 13, fontWeight: 600 }}>
          SOS armed. Your emergency contacts have been notified and the grace period has started.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Clock size={16} color={T.green} />
            <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>Inactivity trigger</span>
            <span style={{ marginLeft: "auto" }}><Pill tone="good">active</Pill></span>
          </div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
            Check in every 30 days. If you miss it, a 14 day grace period starts with reminders before anything is shared.
          </div>
          <div style={{ color: T.faint, fontSize: 12, marginTop: 10 }}>Last check in: today</div>
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} color={T.red} />
            <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>Emergency SOS</span>
          </div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
            Trigger the handoff yourself, right now, if you choose to.
          </div>
          <button onClick={() => setArmed(!armed)}
            style={armed ? btnGhost : { ...btnDanger, padding: "11px 16px" }}>
            {armed ? "Cancel SOS" : "Arm SOS"}
          </button>
        </Card>
      </div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 12 }}>Nominees</div>
        {NOMINEES.map((n, i) => (
          <div key={n.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1fr",
            alignItems: "center", padding: "12px 0", borderTop: i ? `1px solid ${T.border}` : "none" }}>
            <div>
              <div style={{ color: T.text, fontWeight: 600, fontSize: 13.5 }}>{n.name}</div>
              <div style={{ color: T.faint, fontSize: 11.5, marginTop: 2 }}>{n.relation}</div>
            </div>
            <div><Pill tone={n.tone}>{n.tier}</Pill></div>
            <div style={{ textAlign: "right", fontSize: 12, color: n.ack ? T.green : T.amber, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 5 }}>
              {n.ack ? <Check size={13} /> : <Circle size={13} />}{n.ack ? "acknowledged" : "awaiting"}
            </div>
          </div>
        ))}
      </Card>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 12 }}>How release is staged</div>
        {TIERS.map(([name, desc], i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: i ? `1px solid ${T.border}` : "none" }}>
            <KeyRound size={15} color={T.indigoBright} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{name}</div>
              <div style={{ color: T.muted, fontSize: 12.5, marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </Card>
      <div style={{ color: T.faint, fontSize: 12, lineHeight: 1.6 }}>
        This handoff shares information and documents. It is not a will and does not override succession law.
      </div>
    </div>
  );
}

// ---------- documents ----------

interface Source { id: string; name: string; connected: boolean; }
interface Doc { id: number; name: string; type: string; source: string; field: string; version: number; expiry: string; pinned: boolean; }

const DOCS: Doc[] = [
  { id: 1, name: "Aadhaar card", type: "Identity", source: "DigiLocker", field: "XXXX XXXX 4421", version: 1, expiry: "", pinned: true },
  { id: 2, name: "Passport", type: "Identity", source: "DigiLocker", field: "Expires Mar 2027", version: 2, expiry: "2027-03-12", pinned: true },
  { id: 3, name: "HDFC term policy", type: "Insurance", source: "Gmail", field: "Sum assured 1 crore", version: 1, expiry: "2049-03-01", pinned: false },
  { id: 4, name: "Lipid panel report", type: "Health", source: "ABHA", field: "LDL 119, HDL 46", version: 3, expiry: "", pinned: false },
  { id: 5, name: "Latest prescription", type: "Health", source: "Manual", field: "Metformin 500mg", version: 1, expiry: "", pinned: true }
];

function DocumentsScreen() {
  const [sources, setSources] = useState<Source[]>([
    { id: "digilocker", name: "DigiLocker", connected: true },
    { id: "abha", name: "ABHA health", connected: false },
    { id: "gmail", name: "Gmail import", connected: true }
  ]);
  const toggle = (id: string) =>
    setSources((s) => s.map((x) => (x.id === id ? { ...x, connected: !x.connected } : x)));

  return (
    <div>
      <SectionHead title="Documents" sub="Understood, not just stored. One record per thing, wherever it came from." />
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {sources.map((s) => (
          <button key={s.id} onClick={() => toggle(s.id)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8,
              background: s.connected ? "rgba(61,214,140,0.1)" : T.raised,
              color: s.connected ? T.green : T.muted,
              border: `1px solid ${s.connected ? "rgba(61,214,140,0.4)" : T.border}`,
              borderRadius: 10, padding: "9px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {s.connected ? <Check size={14} /> : <Link2 size={14} />}
            {s.name} {s.connected ? "connected" : "connect"}
          </button>
        ))}
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr 1fr 0.7fr", padding: "12px 16px",
          fontSize: 11.5, color: T.faint, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${T.border}` }}>
          <div>Document</div><div>What we read</div><div>Source</div><div style={{ textAlign: "right" }}>Offline</div>
        </div>
        {DOCS.map((d, i) => (
          <div key={d.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr 1fr 0.7fr",
            padding: "13px 16px", alignItems: "center", borderTop: i ? `1px solid ${T.border}` : "none", fontSize: 13 }}>
            <div>
              <div style={{ color: T.text, fontWeight: 600 }}>{d.name}</div>
              <div style={{ color: T.faint, fontSize: 11.5, marginTop: 2 }}>{d.type} {d.version > 1 ? `\u00B7 v${d.version}` : ""}</div>
            </div>
            <div style={{ color: T.muted, fontSize: 12.5 }}>{d.field}</div>
            <div><Pill tone="flat">{d.source}</Pill></div>
            <div style={{ textAlign: "right" }}>
              {d.pinned ? <Download size={15} color={T.green} /> : <span style={{ color: T.faint, fontSize: 12 }}>-</span>}
            </div>
          </div>
        ))}
      </Card>
      <div style={{ color: T.faint, fontSize: 12, marginTop: 12, lineHeight: 1.6 }}>
        The same item from DigiLocker, Gmail and a manual upload collapses into one record by a shared identity key, so you never see duplicates.
      </div>
    </div>
  );
}

// ---------- trust center ----------

interface Posture { label: string; on: boolean; detail: string; }

const POSTURE: Posture[] = [
  { label: "Zero knowledge encryption", on: true, detail: "Your documents are encrypted on your device. We store only ciphertext." },
  { label: "Recovery key set", on: true, detail: "You can regain access if you forget your passphrase." },
  { label: "India data residency", on: true, detail: "Your encrypted vault is stored in region." },
  { label: "Two factor on sensitive actions", on: false, detail: "Turn on for exports and legacy changes." }
];

function TrustCenter() {
  return (
    <div>
      <SectionHead title="Trust center" sub="In plain language: what is protected, and who can reach it." />
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <ShieldCheck size={16} color={T.green} />
          <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>Security posture</span>
        </div>
        {POSTURE.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: i ? `1px solid ${T.border}` : "none" }}>
            <div style={{ marginTop: 1 }}>
              {p.on ? <Check size={16} color={T.green} /> : <Circle size={16} color={T.amber} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.text, fontWeight: 600, fontSize: 13.5 }}>{p.label}</div>
              <div style={{ color: T.muted, fontSize: 12.5, marginTop: 2 }}>{p.detail}</div>
            </div>
            <div>{p.on ? <Pill tone="good">on</Pill> : <Pill tone="warn">off</Pill>}</div>
          </div>
        ))}
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Eye size={16} color={T.indigoBright} />
          <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>Recent access</span>
        </div>
        {ACCESS.map((a, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderTop: i ? `1px solid ${T.border}` : "none" }}>
            <span style={{ color: T.muted, fontSize: 13 }}>
              <b style={{ color: T.text }}>{a.who}</b> {a.action} {a.item}
            </span>
            <span style={{ color: T.faint, fontSize: 12 }}>{a.when}</span>
          </div>
        ))}
      </Card>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={btnGhost}><Download size={16} /> Export everything</button>
        <button style={btnDanger}><Trash2 size={16} /> Delete account and data</button>
      </div>
    </div>
  );
}

// ---------- shell ----------

interface NavItem { key: string; label: string; icon: LucideIcon; }

const NAV: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "wealth", label: "Wealth", icon: Wallet },
  { key: "health", label: "Health", icon: HeartPulse },
  { key: "family", label: "Family", icon: Users },
  { key: "legacy", label: "Legacy handoff", icon: KeyRound },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "trust", label: "Trust center", icon: ShieldCheck }
];

export default function App() {
  const [route, setRoute] = useState<string>("overview");

  const totals = useMemo<Totals>(() => {
    const assets = WEALTH.filter((w) => w.cls === "asset" && w.status === "active").reduce((a, w) => a + w.value, 0);
    const liabilities = WEALTH.filter((w) => w.cls === "liability").reduce((a, w) => a + w.value, 0);
    const noNominee = WEALTH.filter((w) => !w.nominee && w.cls === "asset").length;
    return { assets, liabilities, net: assets - liabilities, noNominee };
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "Inter, system-ui, sans-serif", color: T.text }}>
      <aside style={{ width: 232, background: T.panel, borderRight: `1px solid ${T.border}`, padding: 18, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26, padding: "4px 6px" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${T.indigo}, ${T.red})`, display: "grid", placeItems: "center" }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.2 }}>LifePack</div>
            <div style={{ fontSize: 10, color: T.faint, letterSpacing: 1 }}>AI FIRST, ENCRYPTED</div>
          </div>
        </div>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = route === n.key;
          return (
            <button key={n.key} onClick={() => setRoute(n.key)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, marginBottom: 4,
                background: active ? T.raised : "transparent", color: active ? T.text : T.muted,
                border: `1px solid ${active ? T.border : "transparent"}`, borderRadius: 9, padding: "9px 11px",
                fontSize: 13.5, fontWeight: active ? 600 : 500, cursor: "pointer", textAlign: "left" }}>
              <Icon size={17} color={active ? T.indigoBright : T.muted} /> {n.label}
            </button>
          );
        })}
        <div style={{ marginTop: 18, padding: "10px 11px", borderRadius: 9, background: T.raised, border: `1px solid ${T.border}`,
          fontSize: 11.5, color: T.muted, lineHeight: 1.5, display: "flex", gap: 8 }}>
          <Lock size={26} color={T.green} />
          <span>End to end encrypted. Even we cannot read your vault.</span>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "26px 30px", maxWidth: 1080 }}>
        <AskBar />
        {route === "overview" && <Overview totals={totals} />}
        {route === "wealth" && <Wealth />}
        {route === "health" && <Health />}
        {route === "family" && <Family />}
        {route === "legacy" && <Legacy />}
        {route === "documents" && <DocumentsScreen />}
        {route === "trust" && <TrustCenter />}
      </main>
    </div>
  );
}
