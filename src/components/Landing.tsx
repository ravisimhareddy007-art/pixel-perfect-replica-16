import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ArrowRight, Search, FolderTree, Package, HeartPulse,
  Plane, Landmark, FileCheck2, Hospital, Receipt, Home,
  Lock, EyeOff, RotateCcw, Download, CheckCircle2, Fingerprint, Briefcase, Shield,
} from "lucide-react";

/* ---------- Living Document Graph ---------- */

type Node = { id: string; label: string; x: number; y: number; tone: "indigo" | "violet" | "cyan" | "mint" };
const NODES: Node[] = [
  { id: "passport", label: "Passport",  x: 100, y:  80, tone: "indigo" },
  { id: "aadhaar",  label: "Aadhaar",   x: 360, y:  60, tone: "violet" },
  { id: "pan",      label: "PAN",       x: 540, y: 130, tone: "indigo" },
  { id: "payslip",  label: "Payslip",   x:  70, y: 230, tone: "cyan"   },
  { id: "form16",   label: "Form 16",   x: 460, y: 250, tone: "cyan"   },
  { id: "bank",     label: "Bank stmt", x: 220, y: 320, tone: "violet" },
  { id: "policy",   label: "Insurance", x: 540, y: 360, tone: "mint"   },
  { id: "rx",       label: "Rx",        x:  90, y: 400, tone: "mint"   },
  { id: "lab",      label: "Lab report",x: 360, y: 440, tone: "indigo" },
];
const EDGES: [string, string][] = [
  ["passport","aadhaar"], ["aadhaar","pan"], ["passport","payslip"],
  ["pan","form16"], ["payslip","bank"], ["form16","bank"], ["bank","policy"],
  ["policy","lab"], ["rx","lab"], ["aadhaar","bank"], ["pan","policy"],
];
const TONE: Record<Node["tone"], string> = {
  indigo: "#6366F1", violet: "#A78BFA", cyan: "#22D3EE", mint: "#5BE5A0",
};

function DocumentGraph() {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(0);
  useEffect(() => {
    if (reduce) { setReady(100); return; }
    let raf = 0; const start = performance.now();
    const tick = (t: number) => {
      const pct = Math.min(100, Math.round(((t - start) / 1800) * 100));
      setReady(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const nodeById = useMemo(() => Object.fromEntries(NODES.map(n => [n.id, n])), []);
  const cx = 320, cy = 250, r = 76;
  const C = 2 * Math.PI * r;
  const dash = C - (ready / 100) * C;

  return (
    <div className="relative w-full max-w-[640px] aspect-[640/500] mx-auto">
      <svg viewBox="0 0 640 500" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#A78BFA" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#6366F1" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0A0E1F" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#5BE5A0" />
          </linearGradient>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        <circle cx={cx} cy={cy} r="220" fill="url(#halo)" />

        {/* edges */}
        {EDGES.map(([a, b], i) => {
          const A = nodeById[a], B = nodeById[b];
          return (
            <g key={`${a}-${b}`}>
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="rgba(167,139,250,0.18)" strokeWidth="1" />
              {!reduce && (
                <motion.line
                  x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  stroke={TONE[A.tone]} strokeWidth="1.4" strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: [0, 1, 0], opacity: [0, 0.9, 0] }}
                  transition={{ duration: 3.2, delay: i * 0.18, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </g>
          );
        })}

        {/* central readiness ring */}
        <circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="rgba(10,14,31,0.55)" />
        <motion.circle
          cx={cx} cy={cy} r={r} stroke="url(#ring)" strokeWidth="6" fill="none" strokeLinecap="round"
          style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }}
          strokeDasharray={C} strokeDashoffset={dash}
        />
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-white" style={{ font: "600 30px var(--font-mono)" }}>
          {ready}%
        </text>
        <text x={cx} y={cy + 22} textAnchor="middle" fill="#A78BFA" style={{ font: "500 11px var(--font-mono)", letterSpacing: 2 }}>
          READY
        </text>

        {/* nodes */}
        {NODES.map((n, i) => (
          <g key={n.id}>
            {!reduce && (
              <motion.circle
                cx={n.x} cy={n.y} r="14" fill={TONE[n.tone]} opacity="0.18" filter="url(#soft)"
                animate={{ r: [12, 18, 12], opacity: [0.15, 0.32, 0.15] }}
                transition={{ duration: 3 + (i % 4) * 0.4, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <motion.g
              initial={reduce ? false : { y: 0 }}
              animate={reduce ? undefined : { y: [0, -4, 0] }}
              transition={{ duration: 6 + (i % 5) * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
            >
              <rect x={n.x - 30} y={n.y - 11} width="60" height="22" rx="11"
                fill="rgba(14,20,48,0.85)" stroke={TONE[n.tone]} strokeOpacity="0.55" strokeWidth="1" />
              <circle cx={n.x - 19} cy={n.y} r="2.4" fill={TONE[n.tone]} />
              <text x={n.x - 12} y={n.y + 3.5} fill="#E6E9F5" style={{ font: "500 10px var(--font-sans)" }}>
                {n.label}
              </text>
            </motion.g>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ---------- UI primitives (landing-scoped) ---------- */

function AuroraMesh() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[680px] h-[680px] rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, #6366F1 0%, transparent 60%)", filter: "blur(40px)" }} />
      <div className="absolute top-20 right-[-200px] w-[640px] h-[640px] rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, #A78BFA 0%, transparent 60%)", filter: "blur(50px)" }} />
      <div className="absolute bottom-[-260px] left-1/3 w-[720px] h-[720px] rounded-full opacity-35"
        style={{ background: "radial-gradient(circle, #22D3EE 0%, transparent 60%)", filter: "blur(60px)" }} />
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04), transparent 50%)" }} />
      <div className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }} />
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[11px] tracking-[0.2em] uppercase"
      style={{ background: "rgba(167,139,250,0.10)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.25)" }}>
      {children}
    </span>
  );
}

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet rounded-lg px-1 py-0.5">
      <span className="grid place-items-center rounded-xl"
        style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366F1,#A78BFA)", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}>
        <ShieldCheck size={18} color="#fff" />
      </span>
      <span className="font-display font-bold tracking-tight text-[18px]" style={{ color: light ? "#0E1525" : "#fff" }}>
        LifePack<span style={{ color: "#A78BFA" }}> AI</span>
      </span>
    </Link>
  );
}

/* ---------- Feature tabs ---------- */

type TabId = "discover" | "organize" | "prepare" | "healthcare";
const TABS: { id: TabId; label: string; icon: any; title: string; copy: string }[] = [
  { id: "discover",  label: "Discover",  icon: Search,    title: "Find every document you already have.",
    copy: "Connect Gmail, Drive, or DigiLocker — or drop files in. LifePack classifies on the spot using deterministic rules, never guesswork." },
  { id: "organize",  label: "Organize",  icon: FolderTree, title: "A clean vault that knows what expires.",
    copy: "Auto-grouped by category and family member. Expiry tracking, gaps flagged, re-tag anything in two clicks." },
  { id: "prepare",   label: "Prepare",   icon: Package,   title: "One-tap packs for real life events.",
    copy: "Schengen visa, home loan, BGV, hospital admission, tax filing, property sale — LifePack matches your vault to the checklist and exports a real ZIP." },
  { id: "healthcare",label: "Healthcare",icon: HeartPulse,title: "Walk into any appointment prepared.",
    copy: "Timeline of prescriptions, reports and bills. Chart self-logged lab values. Print a one-page visit pack. We organize — we never interpret." },
];

function TabMockDiscover() {
  const rows = [
    { name: "Passport_Ravi.pdf", cat: "Identity", tone: "#6366F1" },
    { name: "HDFC_Statement_May.pdf", cat: "Finance", tone: "#22D3EE" },
    { name: "Star_Health_Policy.pdf", cat: "Insurance", tone: "#5BE5A0" },
    { name: "Form16_FY25.pdf", cat: "Finance", tone: "#22D3EE" },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E1430]/70 p-4">
      <div className="font-mono text-[10px] tracking-widest text-aurora-violet/80 mb-3">CLASSIFYING · 14 FILES</div>
      <div className="divide-y divide-white/5">
        {rows.map((r, i) => (
          <motion.div key={r.name}
            initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.tone, boxShadow: `0 0 8px ${r.tone}` }} />
              <span className="text-white/90 text-[13px] font-mono truncate max-w-[170px]">{r.name}</span>
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: r.tone }}>{r.cat}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TabMockOrganize() {
  const cats = [
    { n: "Identity",   c: 6, color: "#6366F1" },
    { n: "Finance",    c: 12, color: "#22D3EE" },
    { n: "Insurance",  c: 4, color: "#5BE5A0" },
    { n: "Property",   c: 3, color: "#A78BFA" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {cats.map(c => (
        <div key={c.n} className="rounded-xl border border-white/10 bg-[#0E1430]/70 p-3">
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-[13px] font-medium">{c.n}</span>
            <span className="font-mono text-[11px]" style={{ color: c.color }}>{c.c}</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, c.c * 8)}%`, background: c.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TabMockPrepare() {
  const reqs = [
    { l: "Passport", ok: true }, { l: "Bank statements (6mo)", ok: true },
    { l: "Payslips (3mo)", ok: true }, { l: "ITR / Form 16", ok: true },
    { l: "Travel insurance", ok: false }, { l: "Flight reservation", ok: false },
  ];
  const score = Math.round((reqs.filter(r => r.ok).length / reqs.length) * 100);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E1430]/70 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-white/95 font-display font-semibold">Schengen Visa pack</div>
          <div className="text-white/50 text-[12px]">6 requirements · ZIP ready when 100%</div>
        </div>
        <div className="font-mono text-[20px]" style={{ color: score >= 90 ? "#5BE5A0" : "#A78BFA" }}>{score}%</div>
      </div>
      <div className="grid gap-1.5">
        {reqs.map(r => (
          <div key={r.l} className="flex items-center gap-2 text-[12.5px]">
            <CheckCircle2 size={14} className={r.ok ? "" : "opacity-30"} color={r.ok ? "#5BE5A0" : "#fff"} />
            <span className={r.ok ? "text-white/85" : "text-white/40 line-through"}>{r.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabMockHealthcare() {
  const points = [62, 58, 55, 53, 50, 48, 46];
  const max = 64, min = 44;
  const w = 220, h = 70;
  const d = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E1430]/70 p-4">
      <div className="text-white/60 font-mono text-[10px] tracking-widest mb-1">HbA1c · LAST 7 MONTHS</div>
      <div className="flex items-end gap-3">
        <div className="font-display text-[26px] text-white">5.8</div>
        <div className="text-[11px] font-mono text-ready-mint mb-1">↓ trending down</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full">
        <path d={d} fill="none" stroke="#5BE5A0" strokeWidth="2" />
        {points.map((v, i) => {
          const x = (i / (points.length - 1)) * w;
          const y = h - ((v - min) / (max - min)) * h;
          return <circle key={i} cx={x} cy={y} r="2.4" fill="#5BE5A0" />;
        })}
      </svg>
      <div className="mt-3 text-[11px] text-white/45">LifePack organizes — never interprets or advises.</div>
    </div>
  );
}

const TAB_MOCKS: Record<TabId, () => React.JSX.Element> = {
  discover: TabMockDiscover, organize: TabMockOrganize, prepare: TabMockPrepare, healthcare: TabMockHealthcare,
};

/* ---------- Page ---------- */

const LIFE_EVENTS = [
  { icon: Plane,     name: "Schengen visa" },
  { icon: Landmark,  name: "Home loan" },
  { icon: FileCheck2,name: "Background check" },
  { icon: Hospital,  name: "Hospital admission" },
  { icon: Receipt,   name: "Tax filing" },
  { icon: Home,      name: "Property sale" },
];

const SECURITY = [
  { icon: Lock,    title: "On-device storage", copy: "Your files live in your browser's storage. Nothing is uploaded by default." },
  { icon: EyeOff,  title: "Read-only access", copy: "Connectors only read metadata to build your graph. They never write." },
  { icon: RotateCcw, title: "Revoke anytime", copy: "Disconnect a source in one click. We forget what we saw." },
  { icon: Download,title: "You control exports", copy: "Every pack is a real ZIP you download — nothing leaves without your action." },
];

export default function Landing() {
  const [tab, setTab] = useState<TabId>("discover");
  const navRef = useRef<HTMLElement>(null);

  return (
    <div className="min-h-screen bg-white text-ink font-sans">
      {/* sticky nav */}
      <header ref={navRef} className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-6xl px-4 mt-3">
          <nav className="flex items-center justify-between rounded-2xl px-4 py-2.5 border"
            style={{
              background: "rgba(10,14,31,0.55)",
              borderColor: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(18px) saturate(140%)",
            }}>
            <Wordmark />
            <div className="hidden md:flex items-center gap-7 text-[13.5px] text-white/70">
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#healthcare" className="hover:text-white transition">Healthcare</a>
              <a href="#security" className="hover:text-white transition">Security</a>
            </div>
            <Link to="/app"
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-cyan"
              style={{ background: "linear-gradient(135deg,#6366F1,#A78BFA)", color: "#fff", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}>
              Open app <ArrowRight size={14} />
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg,#0A0E1F 0%,#0E1430 100%)", color: "#fff" }}>
        <AuroraMesh />
        <div className="relative mx-auto max-w-6xl px-4 pt-32 md:pt-40 pb-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Eyebrow><span className="w-1.5 h-1.5 rounded-full bg-ready-mint" /> Personal document intelligence</Eyebrow>
            <h1 className="mt-5 font-display font-bold tracking-tight text-[44px] md:text-[60px] leading-[1.02]">
              Be ready for <br />
              <span style={{ backgroundImage: "linear-gradient(90deg,#22D3EE,#A78BFA,#5BE5A0)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                anything life asks for.
              </span>
            </h1>
            <p className="mt-5 text-white/65 text-[16.5px] max-w-[520px] leading-relaxed">
              LifePack turns scattered, expiring, missing paperwork into a calm graph that knows what you have,
              what's coming due, and what's missing for any life event.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/app"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-cyan"
                style={{ background: "linear-gradient(135deg,#6366F1,#A78BFA)", color: "#fff", boxShadow: "0 16px 40px rgba(99,102,241,0.45)" }}>
                Get started <ArrowRight size={16} />
              </Link>
              <a href="#features"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14.5px] font-semibold text-white/90 border border-white/15 hover:border-white/35 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet">
                See features
              </a>
            </div>
            <div className="mt-6 flex items-center gap-2 text-white/45 text-[12.5px]">
              <ShieldCheck size={14} /> Private by design · Files stay on your device
            </div>
          </div>

          <div className="relative">
            <DocumentGraph />
          </div>
        </div>

        {/* dividing fade into white */}
        <div className="absolute bottom-0 inset-x-0 h-24" style={{ background: "linear-gradient(180deg, transparent, #F3F5FB)" }} />
      </section>

      {/* FEATURE TABS */}
      <section id="features" className="relative bg-[#F3F5FB] py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-aurora-indigo">What LifePack does</div>
            <h2 className="mt-3 font-display font-bold text-[34px] md:text-[42px] tracking-tight text-ink leading-[1.05]">
              Four moves, in order.
            </h2>
            <p className="mt-3 text-[#5b6480] text-[15.5px]">
              Discover what you already have. Organize it so nothing slips. Prepare the exact pack a life event needs. Then a separate, honest module for healthcare.
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-[260px_1fr] gap-6">
            <div role="tablist" aria-orientation="vertical" className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
              {TABS.map(t => {
                const Ic = t.icon, on = tab === t.id;
                return (
                  <button key={t.id} role="tab" aria-selected={on}
                    onClick={() => setTab(t.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[14px] font-semibold border whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-indigo transition"
                    style={{
                      background: on ? "#fff" : "transparent",
                      borderColor: on ? "rgba(99,102,241,0.35)" : "rgba(14,21,37,0.08)",
                      color: on ? "#0E1525" : "#5b6480",
                      boxShadow: on ? "0 12px 30px rgba(99,102,241,0.10)" : "none",
                    }}>
                    <Ic size={16} color={on ? "#6366F1" : "#8a93ab"} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={tab}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="rounded-3xl p-6 md:p-8 grid md:grid-cols-[1.1fr_1fr] gap-8 items-center border border-[#E7EAF3] bg-white">
                <div>
                  <h3 className="font-display font-bold text-ink text-[24px] md:text-[28px] leading-tight tracking-tight">
                    {TABS.find(t => t.id === tab)!.title}
                  </h3>
                  <p className="mt-3 text-[#5b6480] text-[15px] leading-relaxed">
                    {TABS.find(t => t.id === tab)!.copy}
                  </p>
                  <Link to="/app" className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-aurora-indigo hover:gap-2.5 transition-all">
                    Try it in the app <ArrowRight size={14} />
                  </Link>
                </div>
                <div>{(() => { const M = TAB_MOCKS[tab]; return <M />; })()}</div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* LIFE EVENTS STRIP */}
      <section className="bg-white py-20 border-y border-[#E7EAF3]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <h2 className="font-display font-bold text-ink text-[28px] md:text-[34px] tracking-tight">
              Packs LifePack assembles for you.
            </h2>
            <span className="font-mono text-[11px] tracking-widest text-[#8a93ab] uppercase">6 packs · more coming</span>
          </div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {LIFE_EVENTS.map(({ icon: Ic, name }) => (
              <div key={name}
                className="group rounded-2xl border border-[#E7EAF3] bg-[#F8F9FE] p-4 hover:border-aurora-indigo/40 hover:bg-white transition">
                <div className="grid place-items-center w-10 h-10 rounded-xl mb-3"
                  style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(167,139,250,0.18))" }}>
                  <Ic size={18} className="text-aurora-indigo" />
                </div>
                <div className="font-semibold text-ink text-[14px]">{name}</div>
                <div className="font-mono text-[10.5px] text-[#8a93ab] mt-1">Auto-assembled ZIP</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HEALTHCARE BAND */}
      <section id="healthcare" className="relative overflow-hidden text-white" style={{ background: "linear-gradient(180deg,#0E1430 0%,#0A0E1F 100%)" }}>
        <div className="absolute -top-32 right-0 w-[520px] h-[520px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle,#5BE5A0 0%, transparent 60%)", filter: "blur(50px)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Eyebrow><HeartPulse size={12} /> Healthcare, honestly</Eyebrow>
            <h2 className="mt-5 font-display font-bold text-[34px] md:text-[42px] tracking-tight leading-[1.05]">
              Walk into any appointment <span style={{ color: "#5BE5A0" }}>prepared</span>.
            </h2>
            <p className="mt-4 text-white/65 text-[15.5px] max-w-[520px] leading-relaxed">
              Organize prescriptions, reports and bills by member. Chart self-logged lab values over time.
              Print or download a one-page visit pack before the appointment.
            </p>
            <ul className="mt-5 space-y-2 text-[14px] text-white/75">
              <li className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-ready-mint" /> Per-member timelines, deterministic categories</li>
              <li className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-ready-mint" /> Trend charts for the values you choose to log</li>
              <li className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-ready-mint" /> One-page visit pack, ZIP or print</li>
            </ul>
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-[12.5px] text-white/70">
              <Shield size={14} /> LifePack organizes records. It does not interpret medical content or give advice.
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 p-6"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))" }}>
            <TabMockHealthcare />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["Prescription","Lab report","Discharge"].map(t => (
                <div key={t} className="rounded-lg border border-white/10 bg-[#0A0E1F]/60 px-3 py-2 text-[11px] font-mono uppercase tracking-widest text-white/55">{t}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY BAND */}
      <section id="security" className="bg-[#F3F5FB] py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-aurora-indigo">Security & control</div>
            <h2 className="mt-3 font-display font-bold text-ink text-[34px] md:text-[42px] tracking-tight leading-[1.05]">
              Your documents. Your device. Your call.
            </h2>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SECURITY.map(({ icon: Ic, title, copy }) => (
              <div key={title} className="rounded-2xl border border-[#E7EAF3] bg-white p-5">
                <div className="grid place-items-center w-10 h-10 rounded-xl mb-3"
                  style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(91,229,160,0.18))" }}>
                  <Ic size={18} className="text-aurora-indigo" />
                </div>
                <div className="font-display font-semibold text-ink text-[16px]">{title}</div>
                <div className="mt-1.5 text-[#5b6480] text-[13.5px] leading-relaxed">{copy}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg,#0A0E1F 0%,#0E1430 60%,#1a1450 100%)" }}>
        <AuroraMesh />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center">
          <Eyebrow>Ready when you are</Eyebrow>
          <h2 className="mt-5 font-display font-bold text-[36px] md:text-[52px] tracking-tight leading-[1.05]">
            Connect a source. <br />
            <span style={{ backgroundImage: "linear-gradient(90deg,#22D3EE,#A78BFA,#5BE5A0)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              Watch your graph come alive.
            </span>
          </h2>
          <p className="mt-4 text-white/65 max-w-xl mx-auto text-[15.5px]">
            Two minutes to onboard. Your vault is private, exportable, and yours.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/app"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-cyan"
              style={{ background: "linear-gradient(135deg,#6366F1,#A78BFA)", color: "#fff", boxShadow: "0 16px 40px rgba(99,102,241,0.45)" }}>
              Get started <ArrowRight size={16} />
            </Link>
            <a href="#features"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white/90 border border-white/15 hover:border-white/35 transition">
              See features
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0E1F] text-white/55 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-10 flex flex-wrap items-center justify-between gap-4">
          <Wordmark />
          <div className="text-[12.5px] font-mono tracking-wider">© LifePack AI · Private by design</div>
          <div className="flex gap-5 text-[12.5px]">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#healthcare" className="hover:text-white">Healthcare</a>
            <a href="#security" className="hover:text-white">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}