import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Lock, ArrowRight, UploadCloud, FileText, Sparkles } from "lucide-react";
import { BrandMark, BrandWordmark, BRAND } from "./BrandLogo";
import { Dropzone } from "./ui";
import { useStore } from "../lib/store";

const INK = "#1E242B";
const GOLD = "#D9A441";
const CREAM = "#F3EEE2";
const PAPER = "#FAF7F0";
const MUTED = "#6E6657";

const MOMENTS = [
  { id: "travel", emoji: "\u2708\ufe0f", label: "A trip abroad", note: "Visa packs will watch your passport and photos." },
  { id: "baby", emoji: "\ud83d\udc76", label: "A new baby", note: "Hospital, insurance and certificate packs, ready before the date." },
  { id: "home", emoji: "\ud83c\udfe0", label: "Buying a home", note: "Loan and registration packs will assemble as papers arrive." },
  { id: "wedding", emoji: "\ud83d\udc8d", label: "A wedding", note: "From certificates to name changes, one pack for it all." },
  { id: "parents", emoji: "\ud83e\ude7a", label: "Caring for parents", note: "Health records and policies, findable in the moment it matters." },
  { id: "tax", emoji: "\ud83e\uddfe", label: "Tax season", note: "Form 16, proofs and statements gathered before the deadline." },
  { id: "study", emoji: "\ud83c\udf93", label: "Studying abroad", note: "Marksheets, SOPs and finances, packed for every application." },
  { id: "organize", emoji: "\u2728", label: "Just getting organized", note: "The best reason of all. Everything else follows." },
];

const CONNECTORS = [
  { id: "gmail", name: "Gmail", sub: "Policies, payslips, bills, receipts", dot: "#EA4335" },
  { id: "drive", name: "Google Drive", sub: "Scanned documents and PDFs", dot: "#1FA463" },
  { id: "digilocker", name: "DigiLocker", sub: "Aadhaar, PAN, licence, marksheets", dot: "#0B0E24" },
];

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E7DFCE",
  borderRadius: 18,
};

function Dots({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 26 }}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            width: i === step ? 22 : 7,
            height: 7,
            borderRadius: 99,
            background: i === step ? GOLD : "#E0D7C3",
            transition: "all .3s",
          }}
        />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const { addFiles, setOnboarded } = useStore();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [conn, setConn] = useState<Record<string, boolean>>({});
  const [fileCount, setFileCount] = useState(0);

  const pickedMoments = useMemo(() => MOMENTS.filter((m) => picked.includes(m.id)), [picked]);

  const finish = () => {
    try {
      localStorage.setItem("rn-moments", JSON.stringify(picked));
    } catch {}
    setOnboarded(true);
  };

  return (
    <div
      className="min-h-screen grid place-items-center p-6"
      style={{
        background: `${PAPER} radial-gradient(circle at 15% 0%, rgba(217,164,65,.10), transparent 45%), radial-gradient(circle at 90% 100%, rgba(30,36,43,.06), transparent 45%)`,
      }}
    >
      <AnimatePresence mode="wait">
        {/* ---------------- STEP 0 · WELCOME ---------------- */}
        {step === 0 && (
          <motion.div key="w" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-[520px] text-center">
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 120 }} style={{ display: "inline-block" }}>
              <BrandMark size={72} carve={PAPER} />
            </motion.div>
            <div style={{ marginTop: 14 }}>
              <BrandWordmark size={26} color={INK} />
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: INK, letterSpacing: "-0.5px", margin: "18px 0 10px" }}>
              Be ready for life's <span style={{ color: GOLD }}>important moments</span>
            </h1>
            <p style={{ color: MUTED, fontSize: 15.5, lineHeight: 1.65, maxWidth: 430, margin: "0 auto 26px" }}>
              Weddings, visas, new homes, new babies. Every big moment asks your family for documents. ReadiNes makes
              sure that when the moment comes, you simply say yes.
            </p>
            <div style={{ display: "grid", gap: 10, textAlign: "left", maxWidth: 410, margin: "0 auto 28px" }}>
              {[
                "It knows what a hundred real-life situations require",
                "It shows how ready you already are, before anyone asks",
                "It hands the right pack to the right person in one tap",
              ].map((t, i) => (
                <motion.div key={t} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.12 }} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 99, background: GOLD, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Check size={13} color={INK} strokeWidth={3} />
                  </span>
                  <span style={{ color: INK, fontSize: 14.5, fontWeight: 500 }}>{t}</span>
                </motion.div>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              style={{ background: INK, color: CREAM, border: "none", borderRadius: 12, padding: "14px 26px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px rgba(30,36,43,.25)" }}
            >
              Set me up in 60 seconds <ArrowRight size={16} />
            </button>
            <p style={{ color: "#9A9384", fontSize: 12, marginTop: 14, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
              <Lock size={12} /> Private by design. Encrypted on your device.
            </p>
          </motion.div>
        )}

        {/* ---------------- STEP 1 · MOMENTS ---------------- */}
        {step === 1 && (
          <motion.div key="m" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-[560px]">
            <Dots step={1} />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, letterSpacing: "-0.4px", textAlign: "center", margin: "0 0 8px" }}>
              What's on your horizon?
            </h1>
            <p style={{ color: MUTED, fontSize: 14.5, textAlign: "center", margin: "0 0 22px" }}>
              Pick anything coming up in the next year or two. ReadiNes starts preparing for it today.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {MOMENTS.map((m) => {
                const on = picked.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => setPicked((p) => (on ? p.filter((x) => x !== m.id) : [...p, m.id]))}
                    style={{
                      ...card,
                      textAlign: "left",
                      padding: "13px 14px",
                      cursor: "pointer",
                      borderColor: on ? GOLD : "#E7DFCE",
                      boxShadow: on ? `0 0 0 3px rgba(217,164,65,.22)` : "0 1px 2px rgba(30,36,43,.04)",
                      transition: "all .15s",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{m.emoji}</span>
                    <span style={{ display: "block", fontWeight: 700, color: INK, fontSize: 14.5, marginTop: 6 }}>{m.label}</span>
                    {on && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "block", color: "#8A8272", fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>
                        {m.note}
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep(2)}
              style={{ marginTop: 22, width: "100%", background: INK, color: CREAM, border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
            >
              {picked.length > 0 ? `Prepare me for ${picked.length === 1 ? "this" : `these ${picked.length}`}` : "I'll decide later"} <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ---------------- STEP 2 · FIRST DOCUMENTS ---------------- */}
        {step === 2 && (
          <motion.div key="d" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-[520px]">
            <Dots step={2} />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, letterSpacing: "-0.4px", textAlign: "center", margin: "0 0 8px" }}>
              Give it something to work with
            </h1>
            <p style={{ color: MUTED, fontSize: 14.5, textAlign: "center", margin: "0 0 20px" }}>
              Even one document lights the place up. Or skip this, the vault fills at your pace.
            </p>
            <div style={{ ...card, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: INK, marginBottom: 10 }}>
                <UploadCloud size={16} color={GOLD} /> Drop your first documents
              </div>
              <Dropzone
                compact
                onFiles={(f) => {
                  addFiles(f);
                  setFileCount((n) => n + f.length);
                }}
              />
              {fileCount > 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ margin: "10px 0 0", fontSize: 13, color: "#2E7D5B", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Check size={14} /> {fileCount} document{fileCount > 1 ? "s" : ""} in. Nicely done.
                </motion.p>
              )}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {CONNECTORS.map((c) => {
                const on = !!conn[c.id];
                return (
                  <button
                    key={c.id}
                    onClick={() => setConn((p) => ({ ...p, [c.id]: !on }))}
                    style={{ ...card, display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: "12px 14px", cursor: "pointer", borderColor: on ? GOLD : "#E7DFCE" }}
                  >
                    <span style={{ width: 34, height: 34, borderRadius: 10, background: c.dot, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <FileText size={16} color="#fff" />
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontWeight: 700, color: INK, fontSize: 14 }}>{c.name}</span>
                      <span style={{ display: "block", color: "#9A9384", fontSize: 12.5 }}>{c.sub}</span>
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: on ? "#2E7D5B" : INK, display: "flex", alignItems: "center", gap: 5 }}>
                      {on ? <><Check size={14} /> Will connect</> : <><Plus size={14} /> Connect</>}
                    </span>
                  </button>
                );
              })}
            </div>
            <p style={{ color: "#9A9384", fontSize: 11.5, margin: "10px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={12} /> Connections are read-only and revocable. Files are encrypted before anything else happens.
            </p>
            <button
              onClick={() => setStep(3)}
              style={{ marginTop: 18, width: "100%", background: INK, color: CREAM, border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
            >
              {fileCount > 0 || Object.values(conn).some(Boolean) ? "Continue" : "Skip for now"} <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ---------------- STEP 3 · READY ---------------- */}
        {step === 3 && (
          <motion.div key="r" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-[500px] text-center">
            <Dots step={3} />
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 150, delay: 0.1 }}
              style={{ width: 76, height: 76, borderRadius: 99, background: GOLD, display: "grid", placeItems: "center", margin: "0 auto 18px", boxShadow: "0 10px 30px rgba(217,164,65,.4)" }}>
              <Check size={36} color={INK} strokeWidth={3.5} />
            </motion.div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, letterSpacing: "-0.4px", margin: "0 0 10px" }}>
              Your vault is open
            </h1>
            <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.6, maxWidth: 420, margin: "0 auto 22px" }}>
              {pickedMoments.length > 0
                ? "Here's what ReadiNes is already doing for you:"
                : "From here, every document you add makes your family a little more ready. Here's what happens next:"}
            </p>
            <div style={{ display: "grid", gap: 9, textAlign: "left", maxWidth: 430, margin: "0 auto 26px" }}>
              {(pickedMoments.length > 0
                ? pickedMoments.slice(0, 3).map((m) => `${m.emoji} ${m.note}`)
                : [
                    "\u2728 Every document you add is read once, understood, and encrypted",
                    "\ud83d\udcca Your readiness score fills in as the vault grows",
                    "\ud83d\udd11 When a moment arrives, its pack is already waiting",
                  ]
              ).map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }}
                  style={{ ...card, padding: "11px 14px", fontSize: 13.5, color: INK, lineHeight: 1.5 }}>
                  {t}
                </motion.div>
              ))}
            </div>
            <button
              onClick={finish}
              style={{ background: INK, color: CREAM, border: "none", borderRadius: 12, padding: "14px 30px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px rgba(30,36,43,.25)" }}
            >
              <Sparkles size={16} color={GOLD} /> Enter ReadiNes
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
