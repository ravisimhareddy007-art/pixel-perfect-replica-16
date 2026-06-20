import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Sparkles, Lock, Loader2, FileText, UploadCloud } from "lucide-react";
import { Brand, Dropzone } from "./ui";
import { useStore } from "../lib/store";
import { classify } from "../lib/classify";

const CONNECTORS = [
  { id: "gmail", name: "Gmail", sub: "Policies, payslips, bills, receipts", dot: "#EA4335" },
  { id: "drive", name: "Google Drive", sub: "Scanned documents and PDFs", dot: "#1FA463" },
  { id: "digilocker", name: "DigiLocker", sub: "Aadhaar, PAN, licence, marksheets", dot: "#5B5BF5" },
];

export default function Onboarding() {
  const { addFiles, setOnboarded } = useStore();
  const [conn, setConn] = useState<Record<string, boolean>>({});
  const [stage, setStage] = useState<"connect" | "scan">("connect");
  const [scanPct, setScanPct] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const ready = Object.values(conn).some(Boolean);

  // Discovery is simulated for connectors (no real integration in MVP).
  useEffect(() => {
    if (stage !== "scan") return;
    const demo = ["Passport.pdf","Aadhaar.pdf","PAN.pdf","Payslip_May.pdf","Form16_FY25.pdf",
      "HDFC_Bank_Statement.pdf","Star_Health_Insurance.pdf","LIC_Life_Insurance.pdf"];
    let i = 0;
    const t = setInterval(() => {
      i++; setScanPct(Math.min(100, Math.round((i / 14) * 100)));
      if (demo[i - 1]) setFound((f) => [demo[i - 1], ...f].slice(0, 6));
      if (i >= 14) { clearInterval(t); setTimeout(() => setOnboarded(true), 600); }
    }, 110);
    return () => clearInterval(t);
  }, [stage, setOnboarded]);

  return (
    <div className="min-h-screen grid place-items-center p-6"
      style={{ backgroundImage: "radial-gradient(circle at 18% 0%,rgba(91,91,245,.06),transparent 42%),radial-gradient(circle at 92% 100%,rgba(138,107,244,.07),transparent 42%)" }}>
      <AnimatePresence mode="wait">
        {stage === "connect" ? (
          <motion.div key="c" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full max-w-[520px]">
            <Brand large />
            <h1 className="text-[30px] font-bold text-ink tracking-tight mt-6 mb-2">Connect your document sources</h1>
            <p className="text-[#69728A] text-[15px] leading-relaxed mb-7">
              LifePack reads only document metadata to build your private graph. Files never leave your control without an action you take.
            </p>
            <div className="grid gap-3">
              {CONNECTORS.map((c) => {
                const on = !!conn[c.id];
                return (
                  <button key={c.id} onClick={() => setConn((p) => ({ ...p, [c.id]: !on }))}
                    className="flex items-center gap-3.5 text-left bg-white rounded-2xl p-4 transition"
                    style={{ border: `1px solid ${on ? "#5B5BF5" : "#E7EAF3"}`, boxShadow: on ? "0 0 0 3px rgba(91,91,245,.1)" : "0 1px 2px rgba(16,21,37,.04)" }}>
                    <span className="grid place-items-center rounded-xl shrink-0" style={{ width: 38, height: 38, background: c.dot }}>
                      <FileText size={18} color="#fff" /></span>
                    <span className="flex-1">
                      <span className="block font-semibold text-ink text-[15px]">{c.name}</span>
                      <span className="block text-[#98A1B5] text-[13px]">{c.sub}</span>
                    </span>
                    <span className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: on ? "#0E9F6E" : "#5B5BF5" }}>
                      {on ? <><Check size={15} /> Connected</> : <><Plus size={15} /> Connect</>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl bg-white border border-[#E7EAF3] p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-ink mb-2"><UploadCloud size={16} className="text-brand" /> Or add documents now</div>
              <Dropzone compact onFiles={(f) => addFiles(f)} />
            </div>

            <button disabled={!ready} onClick={() => setStage("scan")}
              className="mt-6 w-full py-4 rounded-xl text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition disabled:cursor-not-allowed"
              style={{ background: ready ? "linear-gradient(135deg,#5B5BF5,#8A6BF4)" : "#C9CEE0", boxShadow: ready ? "0 8px 24px rgba(91,91,245,.3)" : "none" }}>
              <Sparkles size={17} /> Run AI discovery
            </button>
            <button onClick={() => setOnboarded(true)} className="mt-3 w-full text-[#98A1B5] text-[13px] hover:text-brand">
              Skip and go to my vault
            </button>
            <p className="text-center text-[#98A1B5] text-xs mt-3 flex items-center justify-center gap-1.5">
              <Lock size={12} /> Private by design. Read-only, revoke anytime.
            </p>
          </motion.div>
        ) : (
          <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-[540px] text-center">
            <div className="relative w-24 h-24 mx-auto mb-7">
              <svg width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={48} cy={48} r={45} stroke="#EAEDF6" strokeWidth={6} fill="none" />
                <circle cx={48} cy={48} r={45} stroke="#5B5BF5" strokeWidth={6} fill="none" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - scanPct / 100)} />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <Loader2 size={26} className="text-brand animate-spin" /></div>
            </div>
            <h2 className="text-[22px] font-bold text-ink tracking-tight mb-1.5">Discovering your documents…</h2>
            <p className="text-[#69728A] text-[14px] font-mono mb-6">{scanPct}% · classifying with AI</p>
            <div className="grid gap-2">
              <AnimatePresence>
                {found.map((name) => {
                  const c = classify(name);
                  return (
                    <motion.div key={name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 bg-white border border-[#E7EAF3] rounded-xl px-3.5 py-2.5 shadow-soft">
                      <FileText size={16} className="text-brand" />
                      <span className="flex-1 text-left text-[14px] font-medium text-ink">{name}</span>
                      <span className="font-mono text-[11px] font-semibold text-ok bg-[#E7F7EF] px-2 py-0.5 rounded-full">{c.category}</span>
                      <Check size={16} className="text-ok" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
