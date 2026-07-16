import { useState, useMemo } from "react";
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
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { Category, Doc, Member, Access } from "@/lib/types";
import Healthcare from "@/components/Healthcare";

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
  const nomineeGaps = store.docs.filter((d: Doc) => d.value && d.nominee === false);
  const attention = [
    ...expiring.map((d: Doc) => ({
      label: `${d.docType} expires in ${daysTo(d.expiry!)} days`,
      to: "documents",
      tone: T.gold,
    })),
    ...nomineeGaps.map((d: Doc) => ({ label: `${d.docType} has no nominee`, to: "wealth", tone: T.coral })),
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
                        background: T.mint + "26",
                      }}
                    >
                      <Check size={12} color={T.mint} />
                    </span>
                    <span style={{ flex: 1, fontSize: 14, color: T.text }}>{r.label}</span>
                    <span
                      style={{
                        fontFamily: "ui-monospace, monospace",
                        fontSize: 11,
                        color: T.muted,
                        maxWidth: 120,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d?.name}
                    </span>
                  </div>
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
    </div>
  );
}

/* ═══════════════ DOCUMENTS ═══════════════ */
function Documents({ store, toast }: any) {
  const cats = Object.keys(EXPECTED) as Category[];
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
          <div
            key={d.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 0.8fr",
              padding: "12px 16px",
              borderTop: `1px solid ${T.border}`,
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
          </div>
        ))}
      </Card>
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
  const holdings = store.docs.filter((d: Doc) => typeof d.value === "number" && d.value > 0);
  const total = holdings.reduce((s: number, d: Doc) => s + (d.value || 0), 0);
  const gaps = holdings.filter((d: Doc) => d.nominee === false);
  return (
    <div>
      <SectionHead title="Wealth" sub="Your money documents, read for what matters: total value and nominee gaps." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 13, color: T.muted }}>Documented value</div>
          <div
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 26,
              fontWeight: 800,
              color: T.white,
              marginTop: 8,
            }}
          >
            {money(total)}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: T.muted }}>Holdings tracked</div>
          <div
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 26,
              fontWeight: 800,
              color: T.white,
              marginTop: 8,
            }}
          >
            {holdings.length}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: T.muted }}>Missing a nominee</div>
          <div
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 26,
              fontWeight: 800,
              color: gaps.length ? T.coral : T.mint,
              marginTop: 8,
            }}
          >
            {gaps.length}
          </div>
        </Card>
      </div>
      <Card style={{ padding: 0 }}>
        {holdings.map((d: Doc, i: number) => (
          <div
            key={d.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 16px",
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
                background: CAT_META[d.category].color + "22",
              }}
            >
              <Wallet size={16} color={CAT_META[d.category].color} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: T.white }}>{d.docType}</div>
              <div style={{ fontSize: 12.5, color: T.muted }}>{d.category}</div>
            </div>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, fontWeight: 700, color: T.text }}>
              {money(d.value || 0)}
            </span>
            {d.nominee === false ? (
              <button
                onClick={() => {
                  store.updateDoc(d.id, { nominee: true });
                  toast("Nominee marked as added");
                }}
                style={{ ...pill(T.coral), cursor: "pointer" }}
              >
                add nominee
              </button>
            ) : (
              <span style={pill(T.mint)}>nominee set</span>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ═══════════════ LEGACY ═══════════════ */
function Legacy({ store, go }: any) {
  const trusted = store.members.filter((m: Member) => m.access === "Full member" || m.access === "Emergency access");
  const gaps = store.docs.filter((d: Doc) => d.value && d.nominee === false);
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
            gaps.map((d: Doc) => (
              <button
                key={d.id}
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
                <span style={{ flex: 1, fontSize: 13.5, color: T.text }}>{d.docType} has no nominee</span>
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
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: T.panel,
            border: `1px solid ${query ? T.gold + "66" : T.border}`,
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 22,
          }}
        >
          <Search size={16} color={T.muted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything: thyroid, passport, insurance, Metformin…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.text, fontSize: 14 }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex" }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        {query.trim() && (
          <SearchResults
            store={store}
            query={query}
            go={(r: string) => {
              setQuery("");
              go(r);
            }}
          />
        )}
        {!query.trim() && (
          <>
            {route === "home" && <Home store={store} go={go} toast={toast} />}
            {route === "packages" && <Packages store={store} toast={toast} />}
            {route === "documents" && <Documents store={store} toast={toast} />}
            {route === "health" && <Healthcare toast={toast} />}
            {route === "wealth" && <Wealth store={store} toast={toast} />}
            {route === "legacy" && <Legacy store={store} go={go} />}
            {route === "trust" && <Trust store={store} toast={toast} />}
          </>
        )}
      </main>

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
