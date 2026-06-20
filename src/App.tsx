import React, { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutGrid, FolderOpen, Zap, HeartPulse, Settings, Search, Bell, CheckCircle2, FileText, RotateCcw,
} from "lucide-react";
import { useStore } from "./lib/store";
import { EVENTS, evalEvent } from "./lib/events";
import { Brand, Ring, Pill, Card, SectionHead } from "./components/ui";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import Documents from "./components/Documents";
import Events from "./components/Events";
import Healthcare from "./components/Healthcare";

type View = "dashboard" | "documents" | "events" | "healthcare" | "settings";
const NAV: [View, string, any][] = [
  ["dashboard", "Dashboard", LayoutGrid], ["documents", "Documents", FolderOpen],
  ["events", "Life Events", Zap], ["healthcare", "Healthcare", HeartPulse], ["settings", "Settings", Settings],
];

export default function App() {
  const store = useStore();
  const [view, setView] = useState<View>("dashboard");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toast = (m: string) => { setToastMsg(m); window.clearTimeout((toast as any)._t); (toast as any)._t = window.setTimeout(() => setToastMsg(null), 2600); };

  const overall = useMemo(() => {
    const ready = EVENTS.filter((e) => evalEvent(e, store.docs).score >= 90).length;
    const avg = Math.round(EVENTS.reduce((s, e) => s + evalEvent(e, store.docs).score, 0) / EVENTS.length);
    return { ready, avg };
  }, [store.docs]);

  if (!store.onboarded) return <Onboarding />;

  return (
    <div className="flex min-h-screen bg-[#F3F5FB]">
      {/* sidebar */}
      <aside className="w-[230px] border-r border-[#E7EAF3] bg-white p-4 sticky top-0 h-screen shrink-0 hidden md:block no-print">
        <div className="px-2 pb-5"><Brand /></div>
        <nav className="grid gap-1">
          {NAV.map(([id, label, Ic]) => {
            const on = view === id;
            return (
              <button key={id} onClick={() => setView(id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold text-left transition"
                style={{ color: on ? "#5B5BF5" : "#69728A", background: on ? "rgba(91,91,245,.08)" : "transparent" }}>
                <Ic size={18} /> {label}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-[#F3F5FB] rounded-xl p-3.5">
            <p className="text-[12px] text-[#69728A] font-semibold mb-2">Overall readiness</p>
            <div className="flex items-center gap-2.5">
              <Ring value={overall.avg} size={40} stroke={4} color="#0E9F6E" />
              <span className="text-[12.5px] text-[#98A1B5] leading-tight">Ready for {overall.ready} of {EVENTS.length} life events.</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* topbar */}
        <header className="h-[62px] border-b border-[#E7EAF3] sticky top-0 z-10 flex items-center gap-3.5 px-6 no-print" style={{ background: "rgba(255,255,255,.8)", backdropFilter: "blur(8px)" }}>
          {/* mobile nav */}
          <div className="md:hidden"><Brand /></div>
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-[420px] bg-[#F3F5FB] border border-[#E7EAF3] rounded-xl px-3 py-2">
            <Search size={16} className="text-[#98A1B5]" />
            <input placeholder="Search documents…" className="bg-transparent outline-none text-[14px] w-full placeholder:text-[#98A1B5]" />
          </div>
          <div className="flex-1 md:hidden" />
          <button className="w-9 h-9 grid place-items-center rounded-xl border border-[#E7EAF3] bg-white"><Bell size={18} className="text-[#69728A]" /></button>
          <div className="w-9 h-9 rounded-full grid place-items-center text-white text-[13px] font-bold" style={{ background: "linear-gradient(135deg,#5B5BF5,#8A6BF4)" }}>RS</div>
        </header>

        {/* mobile tab bar */}
        <div className="md:hidden flex gap-1 overflow-x-auto px-4 py-2 border-b border-[#E7EAF3] bg-white no-print">
          {NAV.map(([id, label, Ic]) => (
            <button key={id} onClick={() => setView(id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap"
              style={{ color: view === id ? "#5B5BF5" : "#69728A", background: view === id ? "rgba(91,91,245,.08)" : "transparent" }}>
              <Ic size={15} /> {label}
            </button>
          ))}
        </div>

        <main className="px-6 py-7 max-w-[1180px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {view === "dashboard" && <Dashboard toast={toast} />}
              {view === "documents" && <Documents />}
              {view === "events" && <Events toast={toast} />}
              {view === "healthcare" && <Healthcare toast={toast} />}
              {view === "settings" && (
                <>
                  <SectionHead title="Settings" sub="Sources, members and data." />
                  <Card className="p-5 max-w-[560px] mb-4">
                    <div className="font-bold text-ink mb-3">Connected sources</div>
                    {["Gmail", "Google Drive", "DigiLocker", "Local Upload"].map((s, i) => (
                      <div key={s} className="flex items-center gap-3 py-2.5" style={{ borderTop: i ? "1px solid #EEF1F8" : "none" }}>
                        <FileText size={16} className="text-[#69728A]" /><span className="flex-1 text-[14px] text-ink">{s}</span><Pill tone="ok">Active</Pill>
                      </div>
                    ))}
                  </Card>
                  <Card className="p-5 max-w-[560px]">
                    <div className="font-bold text-ink mb-1">Reset demo</div>
                    <p className="text-[13px] text-[#69728A] mb-3">Clears all documents and entries from this device.</p>
                    <button onClick={() => { store.reset(); setView("dashboard"); }} className="flex items-center gap-2 text-bad text-[14px] font-semibold border border-[#FBEBEC] rounded-lg px-4 py-2.5"><RotateCcw size={15} /> Reset everything</button>
                  </Card>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-ink text-white px-5 py-3 rounded-xl text-[14px] font-medium shadow-lg2 flex items-center gap-2.5 no-print">
            <CheckCircle2 size={17} color="#5BE5A0" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
