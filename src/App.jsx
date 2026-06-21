import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard, Wallet, HeartPulse, Users, ShieldCheck,
  FileText, KeyRound, Search, ArrowUpRight, ArrowDownRight,
  Minus, Download, AlertTriangle, Sparkles, Lock, Plug
} from "lucide-react";

// LifePack AI - front end reference build.
// This runs as a live preview. In Lovable, swap the seams marked SEAM
// for native integrations (Supabase auth, social login, zero knowledge
// crypto, AI extraction, DigiLocker and ABHA). Nothing here is faked as
// if it were real backend; stubs are honest and labelled.

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
};

const money = (n) =>
  "\u20B9" + Math.abs(n).toLocaleString("en-IN");

// ---------- mock data (replace with extracted data in Lovable) ----------

const WEALTH = [
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

const HEALTH = {
  Diabetes: [
    { key: "hba1c", name: "HbA1c", unit: "%", low: 4.0, high: 5.7,
      series: [
        { date: "Jan 25", value: 6.4 }, { date: "May 25", value: 6.7 },
        { date: "Oct 25", value: 6.9 }, { date: "Mar 26", value: 7.2 }
      ] },
    { key: "fbs", name: "Fasting glucose", unit: "mg/dL", low: 70, high: 100,
      series: [
        { date: "Jan 25", value: 118 }, { date: "May 25", value: 124 },
        { date: "Oct 25", value: 129 }, { date: "Mar 26", value: 134 }
      ] }
  ],
  Heart: [
    { key: "ldl", name: "LDL cholesterol", unit: "mg/dL", low: 0, high: 100,
      series: [
        { date: "Jan 25", value: 142 }, { date: "May 25", value: 138 },
        { date: "Oct 25", value: 128 }, { date: "Mar 26", value: 119 }
      ] },
    { key: "hdl", name: "HDL cholesterol", unit: "mg/dL", low: 40, high: 60,
      series: [
        { date: "Jan 25", value: 38 }, { date: "May 25", value: 41 },
        { date: "Oct 25", value: 44 }, { date: "Mar 26", value: 46 }
      ] },
    { key: "bp", name: "Systolic BP", unit: "mmHg", low: 90, high: 120,
      series: [
        { date: "Jan 25", value: 128 }, { date: "May 25", value: 132 },
        { date: "Oct 25", value: 126 }, { date: "Mar 26", value: 124 }
      ] }
  ],
  Kidney: [
    { key: "creat", name: "Creatinine", unit: "mg/dL", low: 0.7, high: 1.3,
      series: [
        { date: "Jan 25", value: 0.9 }, { date: "May 25", value: 0.95 },
        { date: "Oct 25", value: 1.0 }, { date: "Mar 26", value: 1.0 }
      ] },
    { key: "egfr", name: "eGFR", unit: "mL/min", low: 90, high: 200,
      series: [
        { date: "Jan 25", value: 96 }, { date: "May 25", value: 94 },
        { date: "Oct 25", value: 92 }, { date: "Mar 26", value: 91 }
      ] }
  ]
};

// ---------- interpretation helpers (the AI first thesis, mocked) ----------

function interpret(marker) {
  const s = marker.series;
  const latest = s[s.length - 1].value;
  const prev = s[s.length - 2].value;
  const delta = latest - prev;
  const inRange = latest >= marker.low && latest <= marker.high;
  // "higher is worse" assumption except for HDL and eGFR where higher is better
  const higherBetter = marker.key === "hdl" || marker.key === "egfr";
  let direction = "flat";
  if (Math.abs(delta) > 0.001) direction = delta > 0 ? "up" : "down";
  const improving =
    direction === "flat" ? "flat"
      : (higherBetter ? direction === "up" : direction === "down") ? "better" : "worse";
  let note;
  if (inRange && improving !== "worse") note = "Within range and holding.";
  else if (inRange && improving === "worse") note = "Still in range but drifting the wrong way.";
  else if (!inRange && improving === "better") note = "Out of range but moving the right way.";
  else note = "Out of range and trending the wrong way. Worth raising with your doctor.";
  return { latest, delta, inRange, direction, improving, note };
}

// ---------- small ui atoms ----------

function Pill({ tone, children }) {
  const map = {
    good: { bg: "rgba(61,214,140,0.12)", fg: T.green },
    warn: { bg: "rgba(242,180,65,0.12)", fg: T.amber },
    bad: { bg: "rgba(239,65,54,0.14)", fg: T.red },
    flat: { bg: "rgba(138,147,166,0.12)", fg: T.muted }
  };
  const c = map[tone] || map.flat;
  return (
    <span style={{ background: c.bg, color: c.fg, fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 999, letterSpacing: 0.2 }}>
      {children}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: 18, ...style }}>
      {children}
    </div>
  );
}

function Seam({ icon, title, body }) {
  const Icon = icon;
  return (
    <div style={{ border: `1px dashed ${T.border}`, borderRadius: 16, padding: 40,
      textAlign: "center", background: T.panel }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px",
        display: "grid", placeItems: "center", background: T.raised,
        border: `1px solid ${T.border}` }}>
        <Icon size={24} color={T.indigoBright} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: T.muted, maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>{body}</div>
      <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 12, color: T.faint, border: `1px solid ${T.border}`, borderRadius: 999, padding: "5px 12px" }}>
        <Plug size={13} /> Wire this in Lovable
      </div>
    </div>
  );
}

// ---------- overview ----------

function Overview({ totals }) {
  return (
    <div>
      <SectionHead title="Estate overview" sub="Your whole life, read in one place." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
        <Card>
          <div style={{ color: T.muted, fontSize: 12.5, marginBottom: 8 }}>Net position</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.text }}>{money(totals.net)}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>
            {money(totals.assets)} assets, {money(totals.liabilities)} owed
          </div>
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
        {[
          ["Two holdings have no nominee", "If anything happened, your family would have to fight for the SBI ULIP and your Nippon Small Cap units. Assign nominees.", "warn"],
          ["HbA1c is trending up", "Up from 6.4 to 7.2 over a year. Out of range and moving the wrong way. Raise it with your doctor.", "bad"],
          ["ICICI fixed deposit matures in 90 days", "Decide to renew or redeem before 10 Sep 2026.", "warn"]
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0",
            borderTop: i ? `1px solid ${T.border}` : "none" }}>
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

function Wealth() {
  const types = ["All", ...Array.from(new Set(WEALTH.map((w) => w.type)))];
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [nominee, setNominee] = useState("All");
  const [quick, setQuick] = useState(null);

  const rows = useMemo(() => {
    return WEALTH.filter((w) => {
      if (type !== "All" && w.type !== type) return false;
      if (status !== "All" && w.status !== status) return false;
      if (nominee === "Assigned" && !w.nominee) return false;
      if (nominee === "Missing" && w.nominee) return false;
      if (quick === "noNominee" && (w.nominee || w.cls === "liability")) return false;
      if (quick === "expiring") {
        if (!w.maturity) return false;
        const d = new Date(w.maturity);
        const cut = new Date("2026-09-20");
        if (d > cut) return false;
      }
      if (quick === "lapsed" && w.status !== "lapsed") return false;
      return true;
    });
  }, [type, status, nominee, quick]);

  const Select = ({ label, val, set, opts }) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
      <select value={val} onChange={(e) => set(e.target.value)}
        style={{ background: T.raised, color: T.text, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "7px 10px", fontSize: 13, outline: "none" }}>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );

  const chips = [
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
            style={{ background: quick === k ? T.indigo : T.raised,
              color: quick === k ? "#fff" : T.muted, border: `1px solid ${quick === k ? T.indigo : T.border}`,
              borderRadius: 999, padding: "6px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <Select label="Type" val={type} set={setType} opts={types} />
        <Select label="Status" val={status} set={setStatus} opts={["All", "active", "lapsed", "matured", "claimPending"]} />
        <Select label="Nominee" val={nominee} set={setNominee} opts={["All", "Assigned", "Missing"]} />
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1.2fr 1fr 0.9fr 0.9fr",
          padding: "12px 16px", fontSize: 11.5, color: T.faint, textTransform: "uppercase",
          letterSpacing: 0.4, borderBottom: `1px solid ${T.border}` }}>
          <div>Holding</div><div>Institution</div><div>Value</div><div>Status</div><div>Nominee</div>
        </div>
        {rows.length === 0 && (
          <div style={{ padding: 36, textAlign: "center", color: T.muted, fontSize: 13.5 }}>
            Nothing matches these filters. Clear one to widen the view.
          </div>
        )}
        {rows.map((w, i) => (
          <div key={w.id} style={{ display: "grid",
            gridTemplateColumns: "2.4fr 1.2fr 1fr 0.9fr 0.9fr", padding: "13px 16px",
            alignItems: "center", borderTop: i ? `1px solid ${T.border}` : "none", fontSize: 13 }}>
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
  const flat = groups.flatMap((g) => HEALTH[g].map((m) => ({ ...m, group: g })));
  const [sel, setSel] = useState("hba1c");
  const marker = flat.find((m) => m.key === sel);
  const meta = interpret(marker);

  const dirIcon = meta.direction === "flat"
    ? <Minus size={14} />
    : meta.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />;
  const dirColor = meta.improving === "better" ? T.green : meta.improving === "worse" ? T.red : T.muted;

  return (
    <div>
      <SectionHead title="Health" sub="One question: are you okay, and what changed." />

      {/* plain language summary leads, charts support */}
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
        {/* featured interpreted trend with reference band */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>{marker.name}</div>
              <div style={{ color: T.faint, fontSize: 12 }}>
                normal {marker.low} to {marker.high} {marker.unit}
              </div>
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
                <YAxis stroke={T.faint} fontSize={11} tickLine={false} axisLine={false}
                  domain={["dataMin - 1", "dataMax + 1"]} />
                <ReferenceArea y1={marker.low} y2={marker.high} fill={T.green} fillOpacity={0.1} />
                <Tooltip contentStyle={{ background: T.raised, border: `1px solid ${T.border}`,
                  borderRadius: 8, color: T.text, fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke={T.indigoBright} strokeWidth={2.4}
                  dot={{ r: 4, fill: T.indigoBright }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 8, fontSize: 12.5, color: T.muted, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 18, height: 8, background: "rgba(61,214,140,0.25)", borderRadius: 2, display: "inline-block" }} />
            shaded band is the normal range. {meta.note}
          </div>
        </Card>

        {/* marker cards, grouped, interpreted */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 430, overflowY: "auto", paddingRight: 4 }}>
          {groups.map((g) => (
            <div key={g}>
              <div style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: 0.5, margin: "4px 0 6px" }}>{g}</div>
              {HEALTH[g].map((m) => {
                const mi = interpret(m);
                const active = m.key === sel;
                return (
                  <button key={m.key} onClick={() => setSel(m.key)}
                    style={{ width: "100%", textAlign: "left", marginBottom: 6, cursor: "pointer",
                      background: active ? T.raised : T.panel,
                      border: `1px solid ${active ? T.indigoBright : T.border}`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                      <span style={{ color: mi.inRange ? T.green : T.red, fontWeight: 700, fontSize: 13 }}>
                        {mi.latest} {m.unit}
                      </span>
                    </div>
                    <div style={{ marginTop: 5 }}>
                      <Pill tone={mi.inRange ? (mi.improving === "worse" ? "warn" : "good") : "bad"}>
                        {mi.inRange ? (mi.improving === "worse" ? "in range, drifting" : "in range") : "out of range"}
                      </Pill>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.indigo,
          color: "#fff", border: "none", borderRadius: 10, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          <Download size={16} /> Export latest prescription
        </button>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.raised,
          color: T.text, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          <FileText size={16} /> Share report with doctor
        </button>
      </div>
    </div>
  );
}

// ---------- shared head ----------

function SectionHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ color: T.text, fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>{title}</h2>
      <p style={{ color: T.muted, fontSize: 13.5, margin: "5px 0 0" }}>{sub}</p>
    </div>
  );
}

// ---------- ask bar (AI first thesis, mocked sourced answer) ----------

function AskBar() {
  const [q, setQ] = useState("");
  const [ans, setAns] = useState(null);
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
      <div style={{ display: "flex", gap: 10, alignItems: "center", background: T.panel,
        border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px" }}>
        <Search size={17} color={T.muted} />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && demo()}
          placeholder="Ask across your whole life, for example what insurance do I have"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none",
            color: T.text, fontSize: 14 }} />
        <button onClick={demo}
          style={{ background: T.indigo, color: "#fff", border: "none", borderRadius: 8,
            padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Ask
        </button>
      </div>
      {ans && (
        <div style={{ marginTop: 10, background: T.raised, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: 14 }}>
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

// ---------- shell ----------

const NAV = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "wealth", label: "Wealth", icon: Wallet },
  { key: "health", label: "Health", icon: HeartPulse },
  { key: "family", label: "Family", icon: Users },
  { key: "legacy", label: "Legacy handoff", icon: KeyRound },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "trust", label: "Trust center", icon: ShieldCheck }
];

export default function App() {
  const [route, setRoute] = useState("overview");

  const totals = useMemo(() => {
    const assets = WEALTH.filter((w) => w.cls === "asset" && w.status === "active").reduce((a, w) => a + w.value, 0);
    const liabilities = WEALTH.filter((w) => w.cls === "liability").reduce((a, w) => a + w.value, 0);
    const noNominee = WEALTH.filter((w) => !w.nominee && w.cls === "asset").length;
    return { assets, liabilities, net: assets - liabilities, noNominee };
  }, []);

  const seams = {
    family: <Seam icon={Users} title="Family is a shared, role aware space"
      body="Roles for owner, adult member, limited member and emergency access, with per item sharing, revocation and an access history. Built on the same permission model as the legacy handoff so there is one mental model." />,
    legacy: <Seam icon={KeyRound} title="Staged, verified legacy handoff"
      body="Manual SOS, an inactivity trigger with a grace period, and a nominee claim that requires a death certificate plus a second confirmation. Release is tiered, never all or nothing, and uses key escrow so no usable key sits on the server beforehand." />,
    documents: <Seam icon={FileText} title="Documents, understood not just stored"
      body="DigiLocker and ABHA connect, Gmail import, one identity key so the same item from three sources collapses into one record, versioning, and offline access to your chosen critical files." />,
    trust: <Seam icon={Lock} title="Your data, protected by design"
      body="Zero knowledge client side encryption, a recovery key set at onboarding, India data residency, a full access and audit log, and one tap export and deletion. This screen shows the user, in plain language, exactly what is protected and who can reach it." />
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "Inter, system-ui, sans-serif", color: T.text }}>
      {/* sidebar */}
      <aside style={{ width: 232, background: T.panel, borderRight: `1px solid ${T.border}`, padding: 18, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26, padding: "4px 6px" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8,
            background: `linear-gradient(135deg, ${T.indigo}, ${T.red})`, display: "grid", placeItems: "center" }}>
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
                border: `1px solid ${active ? T.border : "transparent"}`, borderRadius: 9,
                padding: "9px 11px", fontSize: 13.5, fontWeight: active ? 600 : 500, cursor: "pointer", textAlign: "left" }}>
              <Icon size={17} color={active ? T.indigoBright : T.muted} /> {n.label}
            </button>
          );
        })}
        <div style={{ marginTop: 18, padding: "10px 11px", borderRadius: 9, background: T.raised,
          border: `1px solid ${T.border}`, fontSize: 11.5, color: T.muted, lineHeight: 1.5, display: "flex", gap: 8 }}>
          <Lock size={26} color={T.green} />
          <span>End to end encrypted. Even we cannot read your vault.</span>
        </div>
      </aside>

      {/* main */}
      <main style={{ flex: 1, padding: "26px 30px", maxWidth: 1080 }}>
        <AskBar />
        {route === "overview" && <Overview totals={totals} />}
        {route === "wealth" && <Wealth />}
        {route === "health" && <Health />}
        {["family", "legacy", "documents", "trust"].includes(route) && (
          <div>
            <SectionHead title={NAV.find((n) => n.key === route).label}
              sub="Designed and routed. The backend lands in Lovable." />
            {seams[route]}
          </div>
        )}
      </main>
    </div>
  );
}
