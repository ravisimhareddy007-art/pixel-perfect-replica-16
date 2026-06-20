import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ArrowRight, Sparkles, Layers, Plane, HeartPulse, BellRing,
  UploadCloud, FolderTree, FileCheck2, Check, Stamp, Lock,
} from "lucide-react";

/* security-engraving (guilloche) backdrop */
function Guilloche({ color = "#D8B25A" }: { color?: string }) {
  const rings = Array.from({ length: 7 }, (_, i) => 60 + i * 34);
  const waves = Array.from({ length: 3 }, (_, k) => {
    let d = "M0 250 ";
    for (let x = 0; x <= 900; x += 12) d += `L${x} ${250 + Math.sin(x / 60 + k * 1.6) * (30 + k * 8)} `;
    return d;
  });
  return (
    <svg viewBox="0 0 900 500" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <motion.g style={{ transformOrigin: "680px 210px" }}
        animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }}>
        {rings.map((r, i) => (
          <circle key={i} cx={680} cy={210} r={r} fill="none" stroke={color} strokeOpacity={0.13 - i * 0.012} strokeWidth={1} />
        ))}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i / 60) * Math.PI * 2;
          return <line key={i} x1={680 + Math.cos(a) * 250} y1={210 + Math.sin(a) * 250}
            x2={680 + Math.cos(a) * 268} y2={210 + Math.sin(a) * 268} stroke={color} strokeOpacity={0.16} strokeWidth={1} />;
        })}
      </motion.g>
      {waves.map((d, i) => <path key={i} d={d} fill="none" stroke="#6E8BFF" strokeOpacity={0.07 + i * 0.02} strokeWidth={1} />)}
    </svg>
  );
}

const TABS = [
  { id: "discover", label: "Discover & classify", icon: FolderTree,
    head: "Connect once. Everything files itself.",
    body: "Link Gmail, Drive, or DigiLocker, or simply drop files in. LifePack reads each one, sorts it into the right place, and builds a living graph of your documents.",
    points: ["Auto-classified on upload", "Identity, finance, insurance, property, medical", "Re-tag anything in one tap"] },
  { id: "packages", label: "Life-event packages", icon: Plane,
    head: "Prepare for any event in minutes.",
    body: "Ask for a Schengen visa, a home loan, a job switch. LifePack assembles the exact pack, marks what is ready, flags what is missing, and exports a clean ZIP.",
    points: ["Readiness score from your real vault", "Missing items flagged, not guessed", "Download, share, or email the pack"] },
  { id: "health", label: "Healthcare", icon: HeartPulse,
    head: "Walk into every appointment ready.",
    body: "Keep every prescription and report on one timeline. Track your own readings. Print a one-page visit summary or carry the whole pack. LifePack organizes, never diagnoses.",
    points: ["Per-family-member records", "Self-logged lab trends", "One-tap visit pack or printout"] },
  { id: "ready", label: "Readiness & reminders", icon: BellRing,
    head: "Never get caught off guard.",
    body: "See what is expiring, what is missing a nominee, what is ready to go. Quiet nudges before the deadline, not after it.",
    points: ["Expiry tracking across documents", "Gaps surfaced automatically", "Readiness at a glance"] },
];

export default function Landing({ onStart }: { onStart: () => void }) {
  const [tab, setTab] = useState(TABS[0].id);
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="font-sans text-ink">
      {/* nav */}
      <nav className="sticky top-0 z-30 bg-paper/85 backdrop-blur border-b border-black/5 no-print">
        <div className="max-w-[1140px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center rounded-lg" style={{ width: 32, height: 32, background: "#0B0E24" }}>
              <ShieldCheck size={18} color="#D8B25A" /></span>
            <span className="font-display font-bold text-[18px] tracking-tight text-inkdeep">LifePack<span className="text-seal"> AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-[14px] font-medium text-ink/70">
            <a href="#features" className="hover:text-inkdeep">Features</a>
            <a href="#how" className="hover:text-inkdeep">How it works</a>
            <a href="#cta" className="hover:text-inkdeep">Get ready</a>
          </div>
          <button onClick={onStart} className="bg-inkdeep text-white text-[14px] font-semibold rounded-lg px-4 py-2 flex items-center gap-1.5 hover:opacity-90">
            Get started <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* hero */}
      <header className="relative overflow-hidden" style={{ background: "#0B0E24" }}>
        <Guilloche />
        <div className="relative max-w-[1140px] mx-auto px-6 pt-20 pb-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 font-mono text-[12px] tracking-widest uppercase text-seal mb-6">
              <Sparkles size={13} /> The living archive for your life
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}
              className="font-display font-bold text-white leading-[1.05] tracking-tight" style={{ fontSize: "clamp(34px,5vw,54px)" }}>
              Your documents,<br />in order and<br /><span className="text-seal">ready when you need them.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 }}
              className="text-white/65 text-[17px] leading-relaxed mt-6 max-w-[460px]">
              LifePack quietly gathers, classifies, and assembles every passport, policy, payslip, and
              prescription, so any visa, loan, job switch, or hospital visit is a few taps away.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .18 }}
              className="flex flex-wrap items-center gap-3 mt-8">
              <button onClick={onStart} className="bg-seal text-inkdeep font-semibold text-[15px] rounded-xl px-6 py-3.5 flex items-center gap-2 hover:brightness-105">
                Open your LifePack <ArrowRight size={17} />
              </button>
              <span className="flex items-center gap-2 text-white/55 text-[13px] font-mono"><Lock size={13} /> private · on-device · no card</span>
            </motion.div>
          </div>

          {/* hero visual: readiness passport */}
          <motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .2 }} className="relative">
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[11px] tracking-widest text-white/50 uppercase">Readiness</span>
                <motion.span initial={{ rotate: -12, scale: 0, opacity: 0 }} animate={{ rotate: -8, scale: 1, opacity: 1 }} transition={{ delay: .7, type: "spring" }}
                  className="flex items-center gap-1.5 border-2 border-verified text-verified font-mono text-[12px] font-bold uppercase rounded-md px-2.5 py-1">
                  <Stamp size={13} /> Ready
                </motion.span>
              </div>
              {([["Schengen Visa", 82, "#D8B25A"], ["Home Loan", 95, "#2FB68A"], ["Job Switch", 90, "#2FB68A"], ["Hospital visit", 67, "#D8B25A"]] as [string, number, string][]).map(([n, v, c], i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-[13px] mb-1.5"><span className="text-white/80">{n}</span><span className="font-mono text-white/55">{v}%</span></div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ delay: .4 + i * .12, duration: .9 }} className="h-full rounded-full" style={{ background: c }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        {/* MRZ ticker */}
        <div className="relative border-t border-white/10 overflow-hidden py-2.5">
          <div className="font-mono text-[12px] tracking-[.25em] text-white/30 whitespace-nowrap" style={{ animation: "mrz 36s linear infinite" }}>
            {"LIFEPACK<<READY<<VISA<<HOMELOAN<<HEALTH<<TAX<<PROPERTY<<JOBSWITCH<<".repeat(6)}
          </div>
        </div>
      </header>

      {/* feature tabs */}
      <section id="features" className="bg-paper py-20">
        <div className="max-w-[1140px] mx-auto px-6">
          <p className="font-mono text-[12px] tracking-widest uppercase text-seal mb-3">What it does</p>
          <h2 className="font-display font-bold text-inkdeep tracking-tight mb-8" style={{ fontSize: "clamp(26px,3.4vw,38px)" }}>
            One calm place for everything that matters.
          </h2>
          <div className="flex flex-wrap gap-2 mb-8">
            {TABS.map((t) => {
              const on = t.id === tab;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold transition"
                  style={{ background: on ? "#0B0E24" : "#fff", color: on ? "#fff" : "#5A6478", border: `1px solid ${on ? "#0B0E24" : "rgba(0,0,0,.08)"}` }}>
                  <t.icon size={16} color={on ? "#D8B25A" : "#98A1B5"} /> {t.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}
              className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-black/5 p-8 shadow-[0_20px_60px_rgba(11,14,36,.06)]">
              <div>
                <span className="grid place-items-center rounded-xl mb-5" style={{ width: 48, height: 48, background: "#0B0E24" }}>
                  <active.icon size={22} color="#D8B25A" /></span>
                <h3 className="font-display font-bold text-inkdeep text-[26px] tracking-tight mb-3">{active.head}</h3>
                <p className="text-ink/65 text-[16px] leading-relaxed mb-5">{active.body}</p>
                <ul className="grid gap-2.5">
                  {active.points.map((p) => (
                    <li key={p} className="flex items-center gap-2.5 text-[15px] text-ink/80">
                      <span className="grid place-items-center rounded-full shrink-0" style={{ width: 20, height: 20, background: "#E7F7EF" }}><Check size={12} color="#2FB68A" /></span>{p}
                    </li>
                  ))}
                </ul>
              </div>
              <TabVisual id={tab} />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="bg-paper pb-20">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: "01", icon: UploadCloud, t: "Connect or upload", d: "Link your sources or drop files in. Nothing leaves your control." },
              { n: "02", icon: Layers, t: "LifePack organizes", d: "Every document is read, sorted, and tracked for you, automatically." },
              { n: "03", icon: FileCheck2, t: "Prepare any event", d: "Ask for a visa, loan, or visit pack and get it ready in seconds." },
            ].map((s) => (
              <div key={s.n} className="bg-white rounded-2xl border border-black/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="grid place-items-center rounded-xl" style={{ width: 42, height: 42, background: "#F5F2EA" }}><s.icon size={20} color="#0B0E24" /></span>
                  <span className="font-mono text-[13px] text-seal font-semibold">{s.n}</span>
                </div>
                <h4 className="font-display font-bold text-inkdeep text-[18px] mb-1.5">{s.t}</h4>
                <p className="text-ink/60 text-[14.5px] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* closing cta */}
      <section id="cta" className="relative overflow-hidden" style={{ background: "#0B0E24" }}>
        <Guilloche />
        <div className="relative max-w-[1140px] mx-auto px-6 py-20 text-center">
          <motion.span initial={{ rotate: -10, scale: 0 }} whileInView={{ rotate: -6, scale: 1 }} viewport={{ once: true }} transition={{ type: "spring" }}
            className="inline-flex items-center gap-1.5 border-2 border-seal text-seal font-mono text-[12px] font-bold uppercase rounded-md px-3 py-1 mb-6">
            <Stamp size={13} /> Be ready
          </motion.span>
          <h2 className="font-display font-bold text-white tracking-tight mx-auto max-w-[680px]" style={{ fontSize: "clamp(28px,4vw,44px)" }}>
            Stop digging through email at the worst possible moment.
          </h2>
          <p className="text-white/60 text-[17px] mt-5 max-w-[520px] mx-auto">
            Set it up once. The next visa, loan, job, or hospital visit is already packed and waiting.
          </p>
          <button onClick={onStart} className="mt-8 bg-seal text-inkdeep font-semibold text-[15px] rounded-xl px-7 py-4 inline-flex items-center gap-2 hover:brightness-105">
            Open your LifePack <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* footer */}
      <footer className="bg-paper border-t border-black/5">
        <div className="max-w-[1140px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-ink/60 text-[13px]">
            <ShieldCheck size={15} color="#0B0E24" /> LifePack AI · organizes your documents, never interprets them.
          </div>
          <div className="font-mono text-[12px] text-ink/40 tracking-wider">PRIVATE · ON-DEVICE · YOU HOLD THE KEYS</div>
        </div>
      </footer>
    </div>
  );
}

/* stylized panels per tab */
function TabVisual({ id }: { id: string }) {
  const wrap = "rounded-2xl bg-[#0B0E24] p-5 min-h-[260px] relative overflow-hidden";
  if (id === "packages")
    return (
      <div className={wrap}>
        <div className="font-mono text-[11px] tracking-widest text-white/40 uppercase mb-4">Schengen Visa · 82%</div>
        {([["Passport", true], ["Payslips (3 mo)", true], ["Bank statements", true], ["Travel insurance", false], ["Hotel booking", false]] as [string, boolean][]).map(([l, ok], i) => (
          <div key={i} className="flex items-center gap-2.5 py-2 border-t border-white/5 first:border-0">
            <span className="grid place-items-center rounded-md" style={{ width: 20, height: 20, background: ok ? "#1e3a2f" : "#3a2a1e" }}>{ok ? <Check size={12} color="#2FB68A" /> : <span className="text-seal text-[12px]">!</span>}</span>
            <span className="text-white/80 text-[14px]">{l}</span>
          </div>
        ))}
      </div>
    );
  if (id === "health")
    return (
      <div className={wrap}>
        <div className="font-mono text-[11px] tracking-widest text-white/40 uppercase mb-4">Dad · records timeline</div>
        {([["Prescription — Diabetes", "10 Jun"], ["Lab Report — HbA1c", "10 Jun"], ["Prescription — BP", "02 May"]] as [string, string][]).map(([n, d], i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-t border-white/5 first:border-0">
            <span className="w-2 h-2 rounded-full" style={{ background: "#E0508F" }} />
            <span className="text-white/80 text-[14px] flex-1">{n}</span>
            <span className="font-mono text-white/40 text-[12px]">{d}</span>
          </div>
        ))}
        <div className="mt-3 flex items-end gap-1 h-12">
          {[6.8, 7.1, 6.9, 6.5, 6.4].map((v, i) => <div key={i} className="flex-1 rounded-t bg-seal/40" style={{ height: `${(v - 6) * 70}%` }} />)}
        </div>
      </div>
    );
  if (id === "ready")
    return (
      <div className={wrap}>
        <div className="font-mono text-[11px] tracking-widest text-white/40 uppercase mb-4">Expiring soon</div>
        {([["Vehicle insurance", "10d", "#D8B25A"], ["Health insurance", "53d", "#ffffff"], ["Rental agreement", "expired", "#E04A4F"]] as [string, string, string][]).map(([n, d, c], i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-t border-white/5 first:border-0">
            <span className="text-white/80 text-[14px]">{n}</span>
            <span className="font-mono text-[12px]" style={{ color: c }}>{d}</span>
          </div>
        ))}
      </div>
    );
  return (
    <div className={wrap}>
      <div className="font-mono text-[11px] tracking-widest text-white/40 uppercase mb-4">Document graph</div>
      <div className="grid grid-cols-3 gap-2.5">
        {["Identity", "Finance", "Insurance", "Property", "Medical", "Employment"].map((c, i) => (
          <div key={c} className="rounded-xl bg-white/[0.05] border border-white/5 p-3">
            <div className="text-white/80 text-[12.5px] font-semibold">{c}</div>
            <div className="font-mono text-[11px] text-seal mt-1">{[4, 4, 3, 3, 2, 4][i]} docs</div>
          </div>
        ))}
      </div>
    </div>
  );
}
