import { useState, useMemo, useRef } from "react";
import type { ReactNode, CSSProperties } from "react";
import {
  LayoutGrid,
  Plane,
  FolderOpen,
  HeartPulse,
  Users,
  Wallet,
  KeyRound,
  ShieldCheck,
  Landmark,
  Car,
  FileText,
  Home as HomeIcon,
  Fingerprint,
  Briefcase,
  Shield,
  Search,
  Download,
  Plus,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  UploadCloud,
  Lock,
  Bell,
  RotateCcw,
  Camera,
  Image as ImageIcon,
  Stethoscope,
  Printer,
  Pencil,
  Coins,
  Trash2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { Category, Doc, Member, Access, Holding } from "@/lib/types";
import Healthcare from "@/components/Healthcare";
import DocViewer from "@/components/DocViewer";

/* ── theme ── */
const T = {
  navy: "#0B1220",
  panel: "#131C2E",
  raised: "#1B2740",
  border: "#27324A",
  gold: "#D9B86A",
  goldBright: "#ECCB82",
  mint: "#4FCB95",
  coral: "#E8736A",
  text: "#E6EBF5",
  muted: "#8A97AE",
  faint: "#5C6B80",
  white: "#FFFFFF",
};
const A = { blue: "#5B8DEF", purple: "#9B7BE8", teal: "#3FB9C7", pink: "#E86A9B", green: "#4FCB95", gold: "#D9B86A" };

/* ── helpers ── */
const fmtDays = (expiry?: string) => {
  if (!expiry) return "-";
  const d = Math.ceil((+new Date(expiry) - Date.now()) / 86400000);
  return d < 0 ? "expired" : `${d} days`;
};
const daysTo = (s: string) => Math.ceil((+new Date(s) - Date.now()) / 86400000);
const money = (v: number) =>
  v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v}`;
const toneFor = (n: number) => (n >= 90 ? T.mint : n >= 70 ? T.gold : T.coral);

/* ── expected key documents per category (the denominator) ── */
const EXPECTED: Record<Category, string[]> = {
  Identity: ["Passport", "National ID", "Tax ID", "Driver's License"],
  Employment: ["Employment Offer", "Payslip", "Relieving Letter"],
  Finance: ["Tax Return", "Bank Statement", "Investment Statement"],
  Insurance: ["Health Insurance", "Life Insurance", "Auto Insurance"],
  Property: ["Property Deed", "Property Tax", "Lease Agreement"],
  Medical: ["Prescription", "Lab Report"],
};
const CAT_META: Record<Category, { icon: any; color: string }> = {
  Identity: { icon: Fingerprint, color: A.blue },
  Employment: { icon: Briefcase, color: A.purple },
  Finance: { icon: Landmark, color: A.gold },
  Insurance: { icon: Shield, color: A.teal },
  Property: { icon: HomeIcon, color: A.pink },
  Medical: { icon: HeartPulse, color: A.green },
};

/* ── life-event packages ── */
const EVENTS: { id: string; name: string; blurb: string; accent: string; icon: any; reqs: string[] }[] = [
  {
    id: "schengen",
    name: "Schengen visa",
    blurb: "Tourist visa, Europe",
    accent: A.blue,
    icon: Plane,
    reqs: [
      "Passport",
      "Payslip",
      "Bank Statement",
      "Tax Return",
      "Employment Offer",
      "Travel Insurance",
      "Flight Reservation",
      "Hotel Booking",
    ],
  },
  {
    id: "us",
    name: "US B1/B2 visa",
    blurb: "Business or tourist",
    accent: A.blue,
    icon: Plane,
    reqs: ["Passport", "Bank Statement", "Payslip", "Employment Offer", "Tax Return", "DS-160 Confirmation"],
  },
  {
    id: "uk",
    name: "UK visa",
    blurb: "Standard visitor",
    accent: A.blue,
    icon: Plane,
    reqs: ["Passport", "Bank Statement", "Payslip", "Employment Offer", "Accommodation Proof", "Travel Itinerary"],
  },
  {
    id: "canada",
    name: "Canada visa",
    blurb: "Visitor visa",
    accent: A.blue,
    icon: Plane,
    reqs: ["Passport", "Bank Statement", "Tax Return", "Employment Offer", "Invitation Letter", "Biometrics"],
  },
  {
    id: "homeloan",
    name: "Home loan",
    blurb: "Application pack",
    accent: A.green,
    icon: Landmark,
    reqs: ["National ID", "Tax ID", "Payslip", "Bank Statement", "Tax Return", "Property Deed", "Property Valuation"],
  },
  {
    id: "carloan",
    name: "Car loan",
    blurb: "Vehicle finance",
    accent: A.green,
    icon: Car,
    reqs: ["National ID", "Tax ID", "Payslip", "Bank Statement", "Auto Quotation"],
  },
  {
    id: "bgv",
    name: "Background verification",
    blurb: "New job onboarding",
    accent: A.purple,
    icon: ShieldCheck,
    reqs: ["National ID", "Employment Offer", "Relieving Letter", "Payslip", "Tax Return", "Education Certificate"],
  },
  {
    id: "hospital",
    name: "Hospital admission",
    blurb: "Cashless pack",
    accent: A.pink,
    icon: HeartPulse,
    reqs: ["Health Insurance", "National ID", "Prescription", "Lab Report", "Discharge Summary"],
  },
  {
    id: "tax",
    name: "Tax filing",
    blurb: "Annual return",
    accent: A.gold,
    icon: FileText,
    reqs: ["Tax ID", "Tax Return", "Bank Statement", "Investment Statement", "Payslip"],
  },
  {
    id: "property",
    name: "Property sale",
    blurb: "Resale pack",
    accent: A.pink,
    icon: HomeIcon,
    reqs: ["Property Deed", "Property Tax", "National ID", "Tax ID", "Encumbrance Certificate"],
  },
];
const evalEvent = (ev: (typeof EVENTS)[number], have: Set<string>) => {
  const rows = ev.reqs.map((r) => ({ label: r, have: have.has(r) }));
  const got = rows.filter((r) => r.have).length;
  return { rows, got, total: rows.length, score: Math.round((got / rows.length) * 100) };
};

/* ── primitives ── */
function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, ...style }}>
      {children}
    </div>
  );
}
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "ui-monospace, monospace",
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: T.gold,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}
function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: T.white, margin: 0, letterSpacing: -0.5 }}>{title}</h1>
      <p style={{ color: T.muted, fontSize: 14.5, marginTop: 6 }}>{sub}</p>
    </div>
  );
}
function Ring({ score, size = 56, color }: { score: number; size?: number; color?: string }) {
  const sw = size >= 56 ? 5 : 4,
    r = (size - sw) / 2,
    c = 2 * Math.PI * r,
    off = c - (score / 100) * c,
    col = color || toneFor(score);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={T.raised} strokeWidth={sw} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={col}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontFamily: "ui-monospace, monospace",
          fontWeight: 700,
          fontSize: size >= 56 ? 15 : 12,
          color: T.white,
        }}
      >
        {score}
      </div>
    </div>
  );
}
function Stamp() {
  return (
    <div
      style={{
        transform: "rotate(-9deg)",
        border: `2px solid ${T.mint}`,
        color: T.mint,
        borderRadius: 7,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 2,
        fontFamily: "ui-monospace, monospace",
      }}
    >
      READY
    </div>
  );
}
const btnGold: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: T.gold,
  color: "#10182A",
  border: "none",
  borderRadius: 10,
  padding: "10px 15px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};
const btnGhost: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: T.raised,
  color: T.text,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: "10px 15px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const pill = (color: string): CSSProperties => ({
  fontFamily: "ui-monospace, monospace",
  fontSize: 11,
  fontWeight: 700,
  color,
  background: color + "22",
  border: `1px solid ${color}44`,
  padding: "3px 9px",
  borderRadius: 20,
});

/* ═══════════════ HOME (dashboard, not the package grid) ═══════════════ */
function Home({ store, go, toast }: any) {
  const have: Set<string> = useMemo(() => new Set(store.docs.map((d: Doc) => d.docType)), [store.docs]);
  const scored = EVENTS.map((e) => ({ e, ...evalEvent(e, have) }));
  const overall = Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length);
  const best = [...scored].sort((a, b) => b.score - a.score)[0];
  const worst = [...scored].sort((a, b) => a.score - b.score)[0];
  const expiring = store.docs.filter((d: Doc) => d.expiry && daysTo(d.expiry) < 60);
  const dueReminders = store.reminders.filter((r: any) => !r.done && daysTo(r.due) <= 30);
  const nomineeGaps = store.holdings.filter((h: Holding) => (h.kind === "asset" || h.kind === "cover") && !h.nominee);
  const attention = [
    ...expiring.map((d: Doc) => ({
      label: `${d.docType} expires in ${daysTo(d.expiry!)} days`,
      to: "documents",
      tone: T.gold,
    })),
    ...nomineeGaps.map((h: Holding) => ({ label: `${h.name} has no nominee`, to: "wealth", tone: T.coral })),
    ...dueReminders
      .slice(0, 3)
      .map((r: any) => ({
        label: `${store.members.find((m: Member) => m.id === r.memberId)?.name.split(" ")[0]}: ${r.title} in ${daysTo(r.due)}d`,
        to: "health",
        tone: T.mint,
      })),
  ].slice(0, 6);
  const stats = [
    { label: "Documents", value: store.docs.length, icon: FolderOpen, c: A.blue, to: "documents" },
    { label: "Overall readiness", value: `${overall}%`, icon: ShieldCheck, c: A.green, to: "packages" },
    { label: "Expiring < 60d", value: expiring.length, icon: Clock, c: A.gold, to: "documents" },
    { label: "Needs attention", value: attention.length, icon: Bell, c: A.pink, to: "health" },
  ];
  return (
    <div>
      <Eyebrow>Ready when you need them . private . on-device</Eyebrow>
      <SectionHead
        title={`Good evening, ${(store.members[0]?.name || "there").split(" ")[0]}`}
        sub="Your archive at a glance, and what needs attention today."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => go(s.to)}
            style={{
              textAlign: "left",
              cursor: "pointer",
              background: T.panel,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              padding: 16,
            }}
          >
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 34,
                height: 34,
                borderRadius: 9,
                background: s.c + "22",
              }}
            >
              <s.icon size={17} color={s.c} />
            </span>
            <div
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 24,
                fontWeight: 800,
                color: T.white,
                marginTop: 12,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: T.muted }}>{s.label}</div>
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={16} color={T.muted} />
            <b style={{ color: T.white, fontSize: 15 }}>Needs attention</b>
          </div>
          {attention.length === 0 ? (
            <p style={{ color: T.muted, fontSize: 13 }}>Nothing pressing. Nicely handled.</p>
          ) : (
            attention.map((a, i) => (
              <button
                key={i}
                onClick={() => go(a.to)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderTop: i ? `1px solid ${T.border}` : "none",
                  background: "none",
                  border: "none",
                  borderRadius: 0,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 9, background: a.tone }} />
                <span style={{ flex: 1, fontSize: 14, color: T.text }}>{a.label}</span>
                <ChevronRight size={15} color={T.muted} />
              </button>
            ))
          )}
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <ShieldCheck size={16} color={T.muted} />
            <b style={{ color: T.white, fontSize: 15 }}>Where you stand</b>
          </div>
          {[
            { x: best, lbl: "Most ready" },
            { x: worst, lbl: "Needs work" },
          ].map(({ x, lbl }) => (
            <button
              key={lbl}
              onClick={() => go("packages")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderTop: lbl === "Needs work" ? `1px solid ${T.border}` : "none",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Ring score={x.score} size={46} />
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontSize: 11,
                    color: T.muted,
                    fontFamily: "ui-monospace, monospace",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {lbl}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{x.e.name}</div>
              </div>
            </button>
          ))}
          <button
            onClick={() => go("packages")}
            style={{ ...btnGhost, width: "100%", justifyContent: "center", marginTop: 12 }}
          >
            See all packages <ArrowRight size={14} />
          </button>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════ PACKAGES ═══════════════ */
function Packages({ store, toast }: any) {
  const have: Set<string> = useMemo(() => new Set(store.docs.map((d: Doc) => d.docType)), [store.docs]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<(typeof EVENTS)[number] | null>(null);
  const list = EVENTS.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <SectionHead
        title="Packages"
        sub="Pick a life event. LifePack assembles the pack from your documents and flags what is missing."
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: T.panel,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 18,
        }}
      >
        <Search size={16} color={T.muted} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Prepare a visa, a home loan, a hospital admission, a tax filing"
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.text, fontSize: 14 }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {list.map((e) => {
          const { score, got, total } = evalEvent(e, have);
          return (
            <button
              key={e.id}
              onClick={() => setOpen(e)}
              style={{
                textAlign: "left",
                cursor: "pointer",
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <Ring score={score} size={54} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <e.icon size={16} color={e.accent} />
                  <b style={{ color: T.white, fontSize: 15.5 }}>{e.name}</b>
                </div>
                <div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>
                  {score === 100 ? "Everything in place" : `${total - got} missing · ${got} of ${total} ready`}
                </div>
              </div>
              {score === 100 ? <Stamp /> : <ChevronRight size={18} color={T.muted} />}
            </button>
          );
        })}
      </div>
      {open && <PackageDetail ev={open} store={store} onClose={() => setOpen(null)} toast={toast} />}
    </div>
  );
}
function PackageDetail({ ev, store, onClose, toast }: any) {
  const have: Set<string> = new Set(store.docs.map((d: Doc) => d.docType));
  const [view, setView] = useState<Doc | null>(null);
  const { rows, got, total, score } = evalEvent(ev, have);
  const included = store.docs.filter((d: Doc) => ev.reqs.includes(d.docType));
  const exportPack = () => {
    const body =
      `LifePack . ${ev.name}\nGenerated ${new Date().toLocaleString()}\nReadiness ${score}% (${got} of ${total})\n\nINCLUDED:\n` +
      included.map((d: Doc, i: number) => `${i + 1}. ${d.name} [${d.docType}]`).join("\n") +
      `\n\nSTILL NEEDED:\n` +
      rows
        .filter((r) => !r.have)
        .map((r) => `- ${r.label}`)
        .join("\n");
    const b = new Blob([body], { type: "text/plain" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = `${ev.id}_pack.txt`;
    a.click();
    URL.revokeObjectURL(u);
    toast("Pack exported");
  };
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(4,7,15,.6)",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(460px,100%)",
          height: "100%",
          overflowY: "auto",
          background: T.navy,
          borderLeft: `1px solid ${T.border}`,
        }}
      >
        <div style={{ background: T.panel, padding: 22, borderBottom: `1px solid ${T.border}`, position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, ...btnGhost, padding: 8 }}>
            <X size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 44,
                height: 44,
                borderRadius: 12,
                background: ev.accent + "22",
              }}
            >
              <ev.icon size={21} color={ev.accent} />
            </span>
            <div>
              <div style={{ color: T.white, fontSize: 18, fontWeight: 800 }}>{ev.name}</div>
              <div style={{ color: T.muted, fontSize: 13 }}>{ev.blurb}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
            <Ring score={score} size={64} />
            {score === 100 ? (
              <Stamp />
            ) : (
              <div style={{ color: T.muted, fontSize: 13, fontFamily: "ui-monospace, monospace" }}>
                {got} of {total} ready
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: 18 }}>
          <Card style={{ padding: 0, marginBottom: 12 }}>
            <div
              style={{
                padding: "13px 16px",
                fontWeight: 700,
                color: T.white,
                fontSize: 14.5,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} color={T.muted} /> Included ({rows.filter((r) => r.have).length})
            </div>
            {rows
              .filter((r) => r.have)
              .map((r) => {
                const d = included.find((x: Doc) => x.docType === r.label);
                return (
                  <button
                    key={r.label}
                    onClick={() => d && setView(d)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      cursor: d ? "pointer" : "default",
                      background: "none",
                      border: "none",
                      borderTop: `1px solid ${T.border}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "9px 16px",
                    }}
                  >
                    <span
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: T.mint + "26",
                      }}
                    >
                      <Check size={12} color={T.mint} />
                    </span>
                    <span style={{ flex: 1, fontSize: 14, color: T.text }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: T.muted }}>View</span>
                    <ChevronRight size={13} color={T.muted} />
                  </button>
                );
              })}
          </Card>
          {rows.some((r) => !r.have) && (
            <Card style={{ padding: 0, marginBottom: 16 }}>
              <div
                style={{
                  padding: "13px 16px",
                  fontWeight: 700,
                  color: T.white,
                  fontSize: 14.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertTriangle size={16} color={T.muted} /> Still needed ({rows.filter((r) => !r.have).length})
              </div>
              {rows
                .filter((r) => !r.have)
                .map((r) => (
                  <div
                    key={r.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "9px 16px",
                      borderTop: `1px solid ${T.border}`,
                    }}
                  >
                    <span
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: T.gold + "26",
                      }}
                    >
                      <X size={12} color={T.gold} />
                    </span>
                    <span style={{ flex: 1, fontSize: 14, color: T.text }}>{r.label}</span>
                  </div>
                ))}
            </Card>
          )}
          <button onClick={exportPack} style={{ ...btnGold, width: "100%", justifyContent: "center" }}>
            <Download size={16} /> Export pack
          </button>
          <p
            style={{
              fontSize: 12,
              color: T.muted,
              textAlign: "center",
              marginTop: 14,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Lock size={12} /> Files stay on your device until you export.
          </p>
        </div>
      </div>
      {view && <DocViewer doc={view} store={store} onClose={() => setView(null)} />}
    </div>
  );
}

/* ═══════════════ DOCUMENTS ═══════════════ */
function Documents({ store, toast }: any) {
  const cats = Object.keys(EXPECTED) as Category[];
  const [view, setView] = useState<Doc | null>(null);
  return (
    <div>
      <SectionHead
        title="Documents"
        sub="Everything files itself. Connect a source, LifePack reads and sorts each one."
      />
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {["Email", "Drive", "DigiLocker"].map((c) => (
          <span
            key={c}
            style={{
              ...pill(T.mint),
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              fontSize: 13,
            }}
          >
            <Check size={13} /> {c}
          </span>
        ))}
        <label style={{ ...btnGhost, cursor: "pointer" }}>
          <UploadCloud size={15} /> Upload
          <input
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) {
                store.addFiles(e.target.files);
                toast(`${e.target.files.length} document(s) classified`);
              }
              e.currentTarget.value = "";
            }}
          />
        </label>
        <label style={{ ...btnGhost, cursor: "pointer" }}>
          <Camera size={15} /> Scan
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              if (e.target.files?.length) {
                store.addFiles(e.target.files);
                toast("Scan captured and classified");
              }
              e.currentTarget.value = "";
            }}
          />
        </label>
        <label style={{ ...btnGhost, cursor: "pointer" }}>
          <ImageIcon size={15} /> Gallery
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) {
                store.addFiles(e.target.files);
                toast(`${e.target.files.length} image(s) added`);
              }
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      <Eyebrow>Your document graph</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 22 }}>
        {cats.map((cat) => {
          const items = store.docs.filter((d: Doc) => d.category === cat);
          const present = EXPECTED[cat].filter((t) => items.some((d: Doc) => d.docType === t)).length;
          const pct = Math.round((present / EXPECTED[cat].length) * 100);
          const Ic = CAT_META[cat].icon,
            col = CAT_META[cat].color;
          return (
            <Card key={cat} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: col + "22",
                  }}
                >
                  <Ic size={18} color={col} />
                </span>
                <Ring score={pct} size={44} color={col} />
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: T.white, marginTop: 10 }}>{cat}</div>
              <div style={{ fontSize: 12.5, color: T.muted, fontFamily: "ui-monospace, monospace" }}>
                {present} of {EXPECTED[cat].length} key documents · {items.length} on file
              </div>
            </Card>
          );
        })}
      </div>
      <Card style={{ padding: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 0.8fr",
            padding: "12px 16px",
            fontSize: 11.5,
            fontWeight: 700,
            color: T.muted,
            textTransform: "uppercase",
            letterSpacing: 1,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <span>Document</span>
          <span>Category</span>
          <span>Source</span>
          <span style={{ textAlign: "right" }}>Expiry</span>
        </div>
        {store.docs.map((d: Doc) => (
          <button
            key={d.id}
            onClick={() => setView(d)}
            style={{
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              background: "none",
              border: "none",
              borderTop: `1px solid ${T.border}`,
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 0.8fr",
              padding: "12px 16px",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{d.docType}</span>
            <span style={{ fontSize: 13, color: T.muted }}>{d.category}</span>
            <span>
              <span style={pill(A.blue)}>{d.source}</span>
            </span>
            <span
              style={{
                textAlign: "right",
                fontSize: 13,
                color: d.expiry && daysTo(d.expiry) < 60 ? T.gold : T.muted,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {fmtDays(d.expiry)}
            </span>
          </button>
        ))}
      </Card>
      {view && <DocViewer doc={view} store={store} onClose={() => setView(null)} />}
    </div>
  );
}

function AddMember({ onClose, save }: any) {
  const [f, setF] = useState({
    name: "",
    relation: "Parent",
    access: "View only" as Access,
    blood: "O+",
    dob: "1960-01-01",
  });
  const colors = [A.blue, A.purple, A.green, A.pink, A.gold, A.teal];
  const inp: CSSProperties = {
    width: "100%",
    background: T.raised,
    border: `1px solid ${T.border}`,
    borderRadius: 9,
    padding: "9px 11px",
    color: T.text,
    fontSize: 14,
    outline: "none",
  };
  const lbl: CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: T.muted,
    fontFamily: "ui-monospace, monospace",
    marginBottom: 5,
    display: "block",
  };
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "rgba(4,7,15,.62)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.panel,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          width: "min(440px,100%)",
          padding: 22,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <b style={{ color: T.white, fontSize: 18 }}>Add a family member</b>
          <button onClick={onClose} style={{ ...btnGhost, padding: 8 }}>
            <X size={16} />
          </button>
        </div>
        <label style={lbl}>Name</label>
        <input
          style={inp}
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          placeholder="e.g. Taylor Morgan"
        />
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Relation</label>
            <select style={inp} value={f.relation} onChange={(e) => setF({ ...f, relation: e.target.value })}>
              {["Spouse", "Father", "Mother", "Son", "Daughter", "Sibling", "Parent", "Other"].map((r) => (
                <option key={r} style={{ color: "#000" }}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Access</label>
            <select style={inp} value={f.access} onChange={(e) => setF({ ...f, access: e.target.value as Access })}>
              {(["Full member", "Emergency access", "View only"] as Access[]).map((a) => (
                <option key={a} style={{ color: "#000" }}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Date of birth</label>
            <input type="date" style={inp} value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Blood group</label>
            <select style={inp} value={f.blood} onChange={(e) => setF({ ...f, blood: e.target.value })}>
              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => (
                <option key={b} style={{ color: "#000" }}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          disabled={!f.name}
          onClick={() =>
            save(
              {
                id:
                  f.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "")
                    .slice(0, 8) + Math.random().toString(36).slice(2, 5),
                name: f.name,
                relation: f.relation,
                color: colors[Math.floor(Math.random() * colors.length)],
                dob: f.dob,
                bloodGroup: f.blood,
                access: f.access,
              },
              { conditions: [], medications: [], allergies: "None recorded", doctor: "", emergency: "" },
            )
          }
          style={{ ...btnGold, width: "100%", justifyContent: "center", marginTop: 18, opacity: f.name ? 1 : 0.4 }}
        >
          Create profile
        </button>
      </div>
    </div>
  );
}

/* ═══════════════ WEALTH (derived from documents with value) ═══════════════ */
function Wealth({ store, toast }: any) {
  const [viewDoc, setViewDoc] = useState<Doc | null>(null);
  const [edit, setEdit] = useState<Holding | "new" | null>(null);
  const [nomineeFor, setNomineeFor] = useState<Holding | null>(null);
  const [estate, setEstate] = useState(false);
  const attachRef = useRef<HTMLInputElement>(null);
  const pending = useRef<Holding | null>(null);

  const H: Holding[] = store.holdings;
  const assets = H.filter((h) => h.kind === "asset");
  const liabilities = H.filter((h) => h.kind === "liability");
  const covers = H.filter((h) => h.kind === "cover");
  const sum = (a: Holding[]) => a.reduce((s, h) => s + (h.value || 0), 0);
  const totalAssets = sum(assets),
    totalLiab = sum(liabilities),
    net = totalAssets - totalLiab,
    totalCover = sum(covers);
  const guarded = H.filter((h) => h.kind === "asset" || h.kind === "cover");
  const readiness = Math.round((sum(guarded.filter((h) => h.nominee && h.docId)) / (sum(guarded) || 1)) * 100);
  const trusted = store.members.filter((m: Member) => m.access === "Full member" || m.access === "Emergency access");
  const linkedDoc = (h: Holding) => store.docs.find((d: Doc) => d.id === h.docId) || null;

  const gaps: { h: Holding; kind: "nominee" | "doc" | "renewal"; label: string }[] = [];
  H.forEach((h) => {
    if ((h.kind === "asset" || h.kind === "cover") && !h.nominee)
      gaps.push({ h, kind: "nominee", label: `${h.name} \u00B7 no nominee named` });
  });
  H.forEach((h) => {
    if ((h.kind === "asset" || h.kind === "cover") && !h.docId)
      gaps.push({ h, kind: "doc", label: `${h.name} \u00B7 no document attached` });
  });
  covers.forEach((c) => {
    if (c.renewalDate && daysTo(c.renewalDate) < 60)
      gaps.push({ h: c, kind: "renewal", label: `${c.name} renews in ${daysTo(c.renewalDate)} days` });
  });

  const attach = (h: Holding) => {
    pending.current = h;
    attachRef.current?.click();
  };
  const onAttachFiles = (files: FileList) => {
    const h = pending.current;
    if (!h || !files.length) return;
    const cat: Category = h.kind === "cover" ? "Insurance" : h.type === "Property" ? "Property" : "Finance";
    store.attachDocToHolding(h.id, files, { category: cat, docType: h.type, memberId: h.memberId || "you" });
    toast("Document attached");
    pending.current = null;
  };

  const stat = (label: string, val: string, color: string) => (
    <Card>
      <div style={{ fontSize: 13, color: T.muted }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 24, fontWeight: 800, color, marginTop: 8 }}>
        {val}
      </div>
    </Card>
  );
  const Row = ({ h }: { h: Holding }) => {
    const d = linkedDoc(h);
    const accent = h.kind === "liability" ? T.coral : h.kind === "cover" ? A.teal : T.gold;
    const Ic = h.kind === "liability" ? Landmark : h.kind === "cover" ? ShieldCheck : Coins;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "13px 16px",
          borderTop: `1px solid ${T.border}`,
        }}
      >
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 36,
            height: 36,
            borderRadius: 9,
            background: accent + "22",
          }}
        >
          <Ic size={16} color={accent} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: T.white }}>{h.name}</div>
          <div style={{ fontSize: 12.5, color: T.muted }}>
            {h.type}
            {h.institution ? ` \u00B7 ${h.institution}` : ""}
            {h.accountRef ? ` ${h.accountRef}` : ""}
          </div>
        </div>
        <span
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 15,
            fontWeight: 700,
            color: h.kind === "liability" ? T.coral : T.text,
          }}
        >
          {h.kind === "liability" ? "\u2212" : ""}
          {money(h.value || 0)}
        </span>
        {(h.kind === "asset" || h.kind === "cover") &&
          (h.nominee ? (
            <span style={pill(T.mint)} title={h.nomineeName || ""}>
              nominee
            </span>
          ) : (
            <button onClick={() => setNomineeFor(h)} style={{ ...pill(T.coral), cursor: "pointer" }}>
              add nominee
            </button>
          ))}
        {d ? (
          <button onClick={() => setViewDoc(d)} style={{ ...btnGhost, padding: "6px 10px", fontSize: 12 }}>
            View
          </button>
        ) : h.kind !== "liability" ? (
          <button onClick={() => attach(h)} style={{ ...btnGhost, padding: "6px 10px", fontSize: 12 }}>
            Attach
          </button>
        ) : null}
        <button onClick={() => setEdit(h)} title="Edit" style={{ ...btnGhost, padding: 7 }}>
          <Pencil size={14} />
        </button>
      </div>
    );
  };
  const groups: [string, Holding[]][] = [
    ["Assets", assets],
    ["Liabilities", liabilities],
    ["Protection", covers],
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <SectionHead title="Wealth" sub="Everything you own and owe, read from your documents and ready to hand on." />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setEstate(true)} style={btnGold}>
            <FileText size={15} /> Estate summary
          </button>
          <button onClick={() => setEdit("new")} style={btnGhost}>
            <Plus size={15} /> Add holding
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {stat("Net worth", money(net), T.white)}
        {stat("Assets", money(totalAssets), T.mint)}
        {stat("Liabilities", money(totalLiab), T.coral)}
        {stat("Protection", money(totalCover), A.teal)}
      </div>

      {gaps.length > 0 && (
        <Card style={{ padding: 0, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 16px" }}>
            <AlertTriangle size={16} color={T.gold} />
            <b style={{ color: T.white, fontSize: 14.5 }}>Needs attention</b>
            <span style={{ marginLeft: "auto", ...pill(T.gold) }}>{gaps.length}</span>
          </div>
          {gaps.map((g, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 16px",
                borderTop: `1px solid ${T.border}`,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9,
                  background: g.kind === "renewal" ? T.gold : T.coral,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontSize: 14, color: T.text }}>{g.label}</span>
              {g.kind === "nominee" && (
                <button onClick={() => setNomineeFor(g.h)} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12.5 }}>
                  Add nominee
                </button>
              )}
              {g.kind === "doc" && (
                <button onClick={() => attach(g.h)} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12.5 }}>
                  Attach
                </button>
              )}
              {g.kind === "renewal" &&
                (linkedDoc(g.h) ? (
                  <button
                    onClick={() => setViewDoc(linkedDoc(g.h)!)}
                    style={{ ...btnGhost, padding: "6px 12px", fontSize: 12.5 }}
                  >
                    View
                  </button>
                ) : (
                  <button onClick={() => setEdit(g.h)} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12.5 }}>
                    Update
                  </button>
                ))}
            </div>
          ))}
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 16 }}>
          {groups.map(([label, arr]) =>
            arr.length > 0 ? (
              <Card key={label} style={{ padding: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "13px 16px",
                  }}
                >
                  <b style={{ color: T.white, fontSize: 14.5 }}>{label}</b>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color: T.muted }}>
                    {money(sum(arr))}
                  </span>
                </div>
                {arr.map((h) => (
                  <Row key={h.id} h={h} />
                ))}
              </Card>
            ) : null,
          )}
        </div>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <KeyRound size={16} color={T.muted} />
            <b style={{ color: T.white, fontSize: 15 }}>Ready to hand on</b>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 14 }}>
            <Ring score={readiness} size={54} color={readiness >= 80 ? T.mint : readiness >= 50 ? T.gold : T.coral} />
            <div style={{ fontSize: 13, color: T.muted }}>of documented value has a nominee and a document on file</div>
          </div>
          {trusted.map((m: Member) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderTop: `1px solid ${T.border}`,
              }}
            >
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: m.color + "26",
                  color: m.color,
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                {m.name[0]}
              </span>
              <span style={{ flex: 1, fontSize: 13.5, color: T.text }}>{m.name}</span>
              <span style={pill(m.access === "Full member" ? T.mint : A.blue)}>{m.access}</span>
            </div>
          ))}
          <button
            onClick={() => setEstate(true)}
            style={{ ...btnGold, width: "100%", justifyContent: "center", marginTop: 14 }}
          >
            <FileText size={15} /> Prepare estate summary
          </button>
        </Card>
      </div>

      <input
        ref={attachRef}
        type="file"
        hidden
        onChange={(e) => {
          if (e.target.files) onAttachFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />
      {edit && (
        <HoldingModal
          holding={edit === "new" ? null : edit}
          members={store.members}
          onClose={() => setEdit(null)}
          onSave={(h: Holding) => {
            edit === "new" ? store.addHolding(h) : store.updateHolding(h.id, h);
            toast(edit === "new" ? "Holding added" : "Holding updated");
            setEdit(null);
          }}
          onDelete={
            edit !== "new"
              ? () => {
                  store.removeHolding((edit as Holding).id);
                  toast("Holding removed");
                  setEdit(null);
                }
              : undefined
          }
        />
      )}
      {nomineeFor && (
        <NomineeModal
          holding={nomineeFor}
          onClose={() => setNomineeFor(null)}
          onSave={(name: string) => {
            store.updateHolding(nomineeFor.id, { nominee: true, nomineeName: name });
            toast("Nominee added");
            setNomineeFor(null);
          }}
        />
      )}
      {estate && <EstateSheet store={store} onClose={() => setEstate(false)} toast={toast} />}
      {viewDoc && <DocViewer doc={viewDoc} store={store} onClose={() => setViewDoc(null)} />}
    </div>
  );
}

/* ═══════════════ LEGACY ═══════════════ */
function Legacy({ store, go }: any) {
  const trusted = store.members.filter((m: Member) => m.access === "Full member" || m.access === "Emergency access");
  const gaps = store.holdings.filter((h: Holding) => (h.kind === "asset" || h.kind === "cover") && !h.nominee);
  return (
    <div>
      <SectionHead
        title="Legacy handoff"
        sub="Make sure nothing is lost if you are gone, without giving it away early."
      />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Users size={16} color={T.muted} />
            <b style={{ color: T.white, fontSize: 15 }}>Who steps in</b>
          </div>
          {trusted.map((m: Member, i: number) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 0",
                borderTop: i ? `1px solid ${T.border}` : "none",
              }}
            >
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: m.color + "26",
                  color: m.color,
                  fontWeight: 800,
                }}
              >
                {m.name[0]}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: T.white }}>{m.name}</div>
                <div style={{ fontSize: 12.5, color: T.muted }}>{m.relation}</div>
              </div>
              <span style={pill(m.access === "Full member" ? T.mint : A.blue)}>{m.access}</span>
            </div>
          ))}
          <button
            onClick={() => go("trust")}
            style={{ ...btnGhost, width: "100%", justifyContent: "center", marginTop: 12 }}
          >
            Manage trusted people <ArrowRight size={14} />
          </button>
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} color={T.muted} />
            <b style={{ color: T.white, fontSize: 15 }}>Before handoff</b>
          </div>
          {gaps.length === 0 ? (
            <p style={{ color: T.muted, fontSize: 13 }}>Every valued holding has a nominee. You are covered.</p>
          ) : (
            gaps.map((h: Holding) => (
              <button
                key={h.id}
                onClick={() => go("wealth")}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 0",
                  borderTop: `1px solid ${T.border}`,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 9, background: T.coral }} />
                <span style={{ flex: 1, fontSize: 13.5, color: T.text }}>{h.name} has no nominee</span>
                <ChevronRight size={14} color={T.muted} />
              </button>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════ TRUST ═══════════════ */
function Trust({ store, toast }: any) {
  const withAccess = store.members.filter((m: Member) => m.access);
  const [add, setAdd] = useState(false);
  const accessColor: Record<Access, string> = {
    Owner: T.gold,
    "Full member": T.mint,
    "Emergency access": A.blue,
    "View only": T.muted,
  };
  return (
    <div>
      <SectionHead
        title="Trust center"
        sub="In plain language: what is protected, who is in your archive, and what each person can reach."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { icon: Lock, t: "Encrypted on device", s: "Your archive is encrypted locally. Even we cannot read it." },
          { icon: FolderOpen, t: `${store.docs.length} documents`, s: "All stored in one private, searchable graph." },
          { icon: Users, t: `${withAccess.length} people`, s: "Have some level of access, set by you." },
        ].map((x) => (
          <Card key={x.t}>
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 34,
                height: 34,
                borderRadius: 9,
                background: T.mint + "22",
              }}
            >
              <x.icon size={17} color={T.mint} />
            </span>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: T.white, marginTop: 12 }}>{x.t}</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>{x.s}</div>
          </Card>
        ))}
      </div>
      <Card style={{ padding: 0, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px" }}>
          <span style={{ fontWeight: 700, color: T.white, fontSize: 14.5 }}>Family &amp; access</span>
          <button onClick={() => setAdd(true)} style={btnGold}>
            <Plus size={15} /> Add member
          </button>
        </div>
        {store.members.map((m: Member) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 16px",
              borderTop: `1px solid ${T.border}`,
            }}
          >
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 34,
                height: 34,
                borderRadius: 9,
                background: m.color + "26",
                color: m.color,
                fontWeight: 800,
              }}
            >
              {m.name[0]}
            </span>
            <span style={{ flex: 1, fontSize: 14, color: T.white }}>
              {m.name}
              <span style={{ color: T.muted, fontWeight: 400 }}> · {m.relation}</span>
            </span>
            <select
              value={m.access || "View only"}
              onChange={(e) => {
                store.updateMember(m.id, { access: e.target.value as Access });
                toast("Access updated");
              }}
              style={{
                background: T.raised,
                color: accessColor[(m.access || "View only") as Access],
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12.5,
                fontWeight: 600,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {(["Owner", "Full member", "Emergency access", "View only"] as Access[]).map((a) => (
                <option key={a} style={{ color: "#000" }}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        ))}
      </Card>
      {add && (
        <AddMember
          onClose={() => setAdd(false)}
          save={(mm: Member, care: any) => {
            store.addMember(mm);
            store.updateCare(mm.id, care);
            toast("Member added");
            setAdd(false);
          }}
        />
      )}
      <Card>
        <b style={{ color: T.white, fontSize: 15 }}>Reset demo data</b>
        <p style={{ fontSize: 13, color: T.muted, margin: "6px 0 12px" }}>
          Restore the sample family and documents on this device.
        </p>
        <button
          onClick={() => {
            store.reset();
            toast("Demo data restored");
          }}
          style={{ ...btnGhost, color: T.coral, borderColor: T.coral + "55" }}
        >
          <RotateCcw size={15} /> Reset everything
        </button>
      </Card>
    </div>
  );
}

/* ═══════════════ SHELL ═══════════════ */
const NAV: [string, string, any][] = [
  ["home", "Home", LayoutGrid],
  ["packages", "Packages", Plane],
  ["documents", "Documents", FolderOpen],
  ["health", "Health", HeartPulse],
  ["wealth", "Wealth", Wallet],
  ["legacy", "Legacy handoff", KeyRound],
  ["trust", "Trust center", ShieldCheck],
];

/* ═══════════════ GLOBAL SEARCH ═══════════════ */
function SearchResults({ store, query, go }: any) {
  const q = query.trim().toLowerCase();
  const nameOf = (id?: string) => store.members.find((m: Member) => m.id === id)?.name || "";
  const monthOf = (s?: string) =>
    s ? new Date(s).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";
  const docs = store.docs.filter((d: Doc) =>
    `${d.docType} ${d.name} ${d.category} ${nameOf(d.memberId)} ${d.source} ${monthOf(d.docDate || d.addedAt)}`
      .toLowerCase()
      .includes(q),
  );
  const meds = store.meds.filter((m: any) => m.name.toLowerCase().includes(q));
  const conds: { m: Member; c: string }[] = [];
  store.members.forEach((m: Member) =>
    (store.care[m.id]?.conditions || []).forEach((c: string) => {
      if (c.toLowerCase().includes(q)) conds.push({ m, c });
    }),
  );
  const doctors = store.members.filter((m: Member) => (store.care[m.id]?.doctor || "").toLowerCase().includes(q));
  const rems = store.reminders.filter((r: any) => !r.done && r.title.toLowerCase().includes(q));
  const total = docs.length + meds.length + conds.length + doctors.length + rems.length;
  const Row = ({ icon: Ic, color, title, sub, onClick }: any) => (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 14px",
        background: "none",
        border: "none",
        borderTop: `1px solid ${T.border}`,
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          background: color + "22",
        }}
      >
        <Ic size={15} color={color} />
      </span>
      <span style={{ flex: 1, fontSize: 14, color: T.text }}>
        {title}
        <span style={{ color: T.muted }}> · {sub}</span>
      </span>
      <ChevronRight size={15} color={T.muted} />
    </button>
  );
  const Group = ({ label, count, children }: any) =>
    count === 0 ? null : (
      <Card style={{ padding: 0, marginBottom: 12 }}>
        <div
          style={{
            padding: "11px 14px",
            fontSize: 11.5,
            fontWeight: 700,
            color: T.muted,
            textTransform: "uppercase",
            letterSpacing: 1,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {label} · {count}
        </div>
        {children}
      </Card>
    );
  return (
    <div>
      <div style={{ fontSize: 13.5, color: T.muted, marginBottom: 14 }}>
        {total === 0 ? `No matches for "${query}"` : `${total} result${total > 1 ? "s" : ""} for "${query}"`}
      </div>
      <Group label="Documents" count={docs.length}>
        {docs.map((d: Doc) => (
          <Row
            key={d.id}
            icon={CAT_META[d.category].icon}
            color={CAT_META[d.category].color}
            title={d.docType}
            sub={`${d.category}${d.memberId && nameOf(d.memberId) ? " · " + nameOf(d.memberId).split(" ")[0] : ""}`}
            onClick={() => go("documents")}
          />
        ))}
      </Group>
      <Group label="Doctors" count={doctors.length}>
        {doctors.map((m: Member) => (
          <Row
            key={m.id}
            icon={Stethoscope}
            color={A.teal}
            title={store.care[m.id]?.doctor}
            sub={nameOf(m.id).split(" ")[0]}
            onClick={() => go("health")}
          />
        ))}
      </Group>
      <Group label="Medications" count={meds.length}>
        {meds.map((m: any) => (
          <Row
            key={m.id}
            icon={HeartPulse}
            color={A.purple}
            title={`${m.name} ${m.dose}`}
            sub={`${nameOf(m.memberId).split(" ")[0]} · ${m.freq}`}
            onClick={() => go("health")}
          />
        ))}
      </Group>
      <Group label="Conditions" count={conds.length}>
        {conds.map((x, i) => (
          <Row
            key={i}
            icon={HeartPulse}
            color={A.green}
            title={x.c}
            sub={nameOf(x.m.id).split(" ")[0]}
            onClick={() => go("health")}
          />
        ))}
      </Group>
      <Group label="Reminders" count={rems.length}>
        {rems.map((r: any) => (
          <Row
            key={r.id}
            icon={Bell}
            color={T.gold}
            title={r.title}
            sub={`${nameOf(r.memberId).split(" ")[0]} · in ${daysTo(r.due)}d`}
            onClick={() => go("health")}
          />
        ))}
      </Group>
    </div>
  );
}

function HoldingModal({ holding, members, onClose, onSave, onDelete }: any) {
  const [f, setF] = useState<any>(
    holding || {
      name: "",
      kind: "asset",
      type: "",
      institution: "",
      accountRef: "",
      value: 0,
      nominee: false,
      nomineeName: "",
      renewalDate: "",
      memberId: members[0]?.id || "you",
    },
  );
  const inp: CSSProperties = {
    width: "100%",
    background: T.raised,
    border: `1px solid ${T.border}`,
    borderRadius: 9,
    padding: "9px 11px",
    color: T.text,
    fontSize: 14,
    outline: "none",
  };
  const lbl: CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: T.muted,
    fontFamily: "ui-monospace, monospace",
    marginBottom: 5,
    display: "block",
  };
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const canNominee = f.kind === "asset" || f.kind === "cover";
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 75,
        background: "rgba(4,7,15,.62)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.panel,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          width: "min(500px,100%)",
          padding: 22,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <b style={{ color: T.white, fontSize: 18 }}>{holding ? "Edit holding" : "Add holding"}</b>
          <button onClick={onClose} style={{ ...btnGhost, padding: 8 }}>
            <X size={16} />
          </button>
        </div>
        <label style={lbl}>Name</label>
        <input
          style={inp}
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Investment portfolio"
        />
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Kind</label>
            <select style={inp} value={f.kind} onChange={(e) => set("kind", e.target.value)}>
              {["asset", "liability", "cover"].map((k) => (
                <option key={k} style={{ color: "#000" }}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Type</label>
            <input
              style={inp}
              value={f.type}
              onChange={(e) => set("type", e.target.value)}
              placeholder="Mutual funds / Mortgage"
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <div style={{ flex: 2 }}>
            <label style={lbl}>Institution</label>
            <input
              style={inp}
              value={f.institution}
              onChange={(e) => set("institution", e.target.value)}
              placeholder="Bank / insurer"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Account</label>
            <input
              style={inp}
              value={f.accountRef}
              onChange={(e) => set("accountRef", e.target.value)}
              placeholder="\u20224821"
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>{f.kind === "liability" ? "Outstanding" : f.kind === "cover" ? "Cover" : "Value"}</label>
            <input
              type="number"
              style={inp}
              value={f.value}
              onChange={(e) => set("value", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Owner</label>
            <select style={inp} value={f.memberId} onChange={(e) => set("memberId", e.target.value)}>
              {members.map((m: Member) => (
                <option key={m.id} value={m.id} style={{ color: "#000" }}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {f.kind === "cover" && (
          <div style={{ marginTop: 12 }}>
            <label style={lbl}>Renewal date</label>
            <input
              type="date"
              style={inp}
              value={f.renewalDate || ""}
              onChange={(e) => set("renewalDate", e.target.value)}
            />
          </div>
        )}
        {canNominee && (
          <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
            <label
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: T.text }}
            >
              <input type="checkbox" checked={!!f.nominee} onChange={(e) => set("nominee", e.target.checked)} /> Nominee
              named
            </label>
            {f.nominee && (
              <input
                style={{ ...inp, flex: 1 }}
                value={f.nomineeName}
                onChange={(e) => set("nomineeName", e.target.value)}
                placeholder="Nominee name"
              />
            )}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            disabled={!f.name}
            onClick={() => onSave({ ...f, id: f.id || Math.random().toString(36).slice(2, 9) })}
            style={{ ...btnGold, flex: 1, justifyContent: "center", opacity: f.name ? 1 : 0.4 }}
          >
            {holding ? "Save" : "Add holding"}
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              title="Remove"
              style={{ ...btnGhost, color: T.coral, borderColor: T.coral + "55", padding: "10px 14px" }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NomineeModal({ holding, onClose, onSave }: any) {
  const [name, setName] = useState(holding.nomineeName || "");
  const inp: CSSProperties = {
    width: "100%",
    background: T.raised,
    border: `1px solid ${T.border}`,
    borderRadius: 9,
    padding: "9px 11px",
    color: T.text,
    fontSize: 14,
    outline: "none",
  };
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 75,
        background: "rgba(4,7,15,.62)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.panel,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          width: "min(420px,100%)",
          padding: 22,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <b style={{ color: T.white, fontSize: 17 }}>Name a nominee</b>
          <button onClick={onClose} style={{ ...btnGhost, padding: 8 }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
          Who should receive {holding.name} ({holding.institution || holding.type})?
        </p>
        <input
          style={inp}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jordan Morgan (spouse)"
          autoFocus
        />
        <button
          disabled={!name.trim()}
          onClick={() => onSave(name.trim())}
          style={{ ...btnGold, width: "100%", justifyContent: "center", marginTop: 16, opacity: name.trim() ? 1 : 0.4 }}
        >
          Save nominee
        </button>
      </div>
    </div>
  );
}

function EstateSheet({ store, onClose, toast }: any) {
  const html = buildEstate(store);
  const exportH = () => {
    const b = new Blob([html], { type: "text/html" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = "Estate_Summary.html";
    a.click();
    URL.revokeObjectURL(u);
    toast("Estate summary exported");
  };
  const printH = () => {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 250);
    }
  };
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 75,
        background: "rgba(4,7,15,.62)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.panel,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          width: "min(680px,100%)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          padding: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: T.gold,
                marginBottom: 4,
              }}
            >
              What your family would need
            </div>
            <b style={{ color: T.white, fontSize: 19 }}>Estate summary</b>
          </div>
          <button onClick={onClose} style={{ ...btnGhost, padding: 8 }}>
            <X size={16} />
          </button>
        </div>
        <div
          style={{ flex: 1, overflow: "auto", background: "#eef0f3", borderRadius: 10, padding: 12 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={printH} style={{ ...btnGold, flex: 1, justifyContent: "center" }}>
            <Printer size={16} /> Save as PDF
          </button>
          <button onClick={exportH} style={{ ...btnGhost, flex: 1, justifyContent: "center" }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>
    </div>
  );
}

function buildEstate(store: any): string {
  const H: Holding[] = store.holdings;
  const m2 = (v?: number) => `$${(v || 0).toLocaleString("en-US")}`;
  const A_ = H.filter((h) => h.kind === "asset"),
    L_ = H.filter((h) => h.kind === "liability"),
    C_ = H.filter((h) => h.kind === "cover");
  const s = (a: Holding[]) => a.reduce((x, h) => x + (h.value || 0), 0);
  const net = s(A_) - s(L_);
  const dn = (id?: string) => store.docs.find((d: Doc) => d.id === id)?.name || "\u2014 not attached \u2014";
  const trusted = store.members.filter((mm: Member) => mm.access === "Full member" || mm.access === "Emergency access");
  const th = (t: string) => `<th style="text-align:left;padding:6px 10px;font-size:11px;color:#6b7280">${t}</th>`;
  const secTable = (title: string, arr: Holding[], showNom: boolean) =>
    `<h3 style="margin:18px 0 6px;font-size:14px;color:#111827">${title}</h3><table style="width:100%;border-collapse:collapse;font-size:12.5px"><tr style="background:#f3f4f6">${th("Holding")}${th("Type")}${th("Where")}${th("Value")}${showNom ? th("Nominee") : ""}${th("Document")}</tr>${arr.map((h) => `<tr><td style="padding:6px 10px;font-weight:600">${h.name}</td><td style="padding:6px 10px">${h.type}</td><td style="padding:6px 10px;color:#6b7280">${h.institution || ""} ${h.accountRef || ""}</td><td style="padding:6px 10px">${m2(h.value)}</td>${showNom ? `<td style="padding:6px 10px;color:${h.nominee ? "#111827" : "#b91c1c"};font-weight:${h.nominee ? 400 : 700}">${h.nominee ? h.nomineeName || "named" : "NOT NAMED"}</td>` : ""}<td style="padding:6px 10px;color:#6b7280">${dn(h.docId)}</td></tr>`).join("") || `<tr><td colspan="6" style="padding:6px 10px;color:#9ca3af">None</td></tr>`}</table>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Estate Summary</title></head><body style="font-family:Inter,Arial,sans-serif;color:#111827;max-width:760px;margin:20px auto;padding:0 20px;background:#fff">
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #D8B25A;padding-bottom:12px"><div><div style="font-weight:800;font-size:20px">LifePack \u00B7 Estate Summary</div><div style="color:#6b7280;font-size:13px">What your family would need to find and claim everything</div></div><div style="text-align:right;color:#6b7280;font-size:12px">Prepared ${new Date().toLocaleString()}</div></div>
  <div style="display:flex;gap:26px;margin-top:16px">
    <div><div style="font-size:12px;color:#6b7280">Net worth (documented)</div><div style="font-size:22px;font-weight:800">${m2(net)}</div></div>
    <div><div style="font-size:12px;color:#6b7280">Assets</div><div style="font-size:18px;font-weight:700">${m2(s(A_))}</div></div>
    <div><div style="font-size:12px;color:#6b7280">Liabilities</div><div style="font-size:18px;font-weight:700">${m2(s(L_))}</div></div>
    <div><div style="font-size:12px;color:#6b7280">Protection</div><div style="font-size:18px;font-weight:700">${m2(s(C_))}</div></div>
  </div>
  ${secTable("Assets", A_, true)}
  ${secTable("Liabilities", L_, false)}
  ${secTable("Insurance & protection", C_, true)}
  <h3 style="margin:18px 0 6px;font-size:14px;color:#111827">Who can help</h3><ul style="margin:0;padding-left:18px;line-height:1.7;color:#374151;font-size:13px">${trusted.map((mm: Member) => `<li>${mm.name} \u2014 ${mm.relation} (${mm.access})</li>`).join("") || "<li>No trusted contacts set</li>"}</ul>
  <p style="margin-top:22px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px">Prepared by LifePack from your own records. Account references are masked. This is an organizational summary \u2014 not a will, and not legal, tax, or financial advice. Confirm nominee and succession details with each institution and a professional.</p>
  </body></html>`;
}

export default function App() {
  const store = useStore();
  const [route, setRoute] = useState("home");
  const [query, setQuery] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toast = (m: string) => {
    setToastMsg(m);
    window.clearTimeout((toast as any)._t);
    (toast as any)._t = window.setTimeout(() => setToastMsg(null), 2400);
  };
  const go = (r: string) => setRoute(r);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: T.navy,
        fontFamily: "Inter, system-ui, sans-serif",
        color: T.text,
      }}
    >
      <aside
        style={{
          width: 232,
          flexShrink: 0,
          borderRight: `1px solid ${T.border}`,
          padding: 16,
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 8px 22px" }}>
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 40,
              height: 40,
              borderRadius: 11,
              background: `linear-gradient(135deg, ${T.gold}, ${T.goldBright})`,
            }}
          >
            <FileText size={20} color="#10182A" />
          </span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: T.white }}>
              LifePack <span style={{ color: T.gold }}>AI</span>
            </div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: T.muted, fontFamily: "ui-monospace, monospace" }}>
              LIVING ARCHIVE
            </div>
          </div>
        </div>
        <nav style={{ display: "grid", gap: 3 }}>
          {NAV.map(([key, label, Ic]) => {
            const on = route === key;
            return (
              <button
                key={key}
                onClick={() => setRoute(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: "left",
                  cursor: "pointer",
                  border: on ? `1px solid ${T.border}` : "1px solid transparent",
                  background: on ? T.raised : "transparent",
                  color: on ? T.white : T.muted,
                }}
              >
                <Ic size={18} color={on ? T.gold : T.muted} /> {label}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto" }}>
          <div
            style={{
              background: T.panel,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 12,
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
            }}
          >
            <ShieldCheck size={15} color={T.mint} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
              Encrypted on your device. Even we cannot read your archive.
            </span>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: "24px 34px 40px", maxWidth: 1160, margin: "0 auto" }}>
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20, position: "relative", zIndex: 40 }}
        >
          <div style={{ position: "relative", width: 300, maxWidth: "100%" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: T.panel,
                border: `1px solid ${query ? T.gold + "66" : T.border}`,
                borderRadius: 10,
                padding: "8px 12px",
              }}
            >
              <Search size={15} color={T.muted} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.text, fontSize: 13.5 }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex" }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            {query.trim() && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 440,
                  maxWidth: "88vw",
                  maxHeight: 460,
                  overflowY: "auto",
                  background: T.navy,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: 12,
                  boxShadow: "0 24px 70px rgba(0,0,0,.55)",
                }}
              >
                <SearchResults
                  store={store}
                  query={query}
                  go={(r: string) => {
                    setQuery("");
                    go(r);
                  }}
                />
              </div>
            )}
          </div>
        </div>
        {route === "home" && <Home store={store} go={go} toast={toast} />}
        {route === "packages" && <Packages store={store} toast={toast} />}
        {route === "documents" && <Documents store={store} toast={toast} />}
        {route === "health" && <Healthcare toast={toast} />}
        {route === "wealth" && <Wealth store={store} toast={toast} />}
        {route === "legacy" && <Legacy store={store} go={go} />}
        {route === "trust" && <Trust store={store} toast={toast} />}
      </main>
      {query.trim() && <div onClick={() => setQuery("")} style={{ position: "fixed", inset: 0, zIndex: 30 }} />}

      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 90,
            background: T.panel,
            border: `1px solid ${T.border}`,
            color: T.text,
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 16px 50px rgba(0,0,0,.5)",
          }}
        >
          <CheckCircle2 size={17} color={T.mint} /> {toastMsg}
        </div>
      )}
    </div>
  );
}
