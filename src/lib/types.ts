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
  ChevronDown,
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
  Receipt,
  Paperclip,
  Siren,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { Category, Doc, Member, Access, Holding, Transaction, Reminder } from "@/lib/types";
import Healthcare, { METRICS, statusOf, sortR } from "@/components/Healthcare";
import { buildZip } from "@/lib/zip";
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

  type Act = {
    id: string;
    label: string;
    who?: string;
    whoColor?: string;
    when: string;
    tone: string;
    rid?: string;
    txId?: string;
  };
  const docActs: Act[] = expiring
    .sort((a: Doc, b: Doc) => +new Date(a.expiry!) - +new Date(b.expiry!))
    .map((d: Doc) => {
      const n = daysTo(d.expiry!);
      return {
        id: d.id,
        label: `${d.docType} · ${store.members.find((m: Member) => m.id === d.memberId)?.name.split(" ")[0] || ""}`,
        when: n < 0 ? "expired" : `${n}d left`,
        tone: n < 0 ? T.coral : T.gold,
      };
    });
  const healthActs: Act[] = useMemo(() => {
    const acts: (Act & { urgency: number })[] = [];
    store.members.forEach((mm: Member) => {
      const first = mm.name.split(" ")[0];
      store.reminders
        .filter((r: Reminder) => r.memberId === mm.id && !r.done && daysTo(r.due) <= 45)
        .forEach((r: Reminder) => {
          const dd = daysTo(r.due);
          acts.push({
            id: r.id,
            rid: r.id,
            label: r.title,
            who: first,
            whoColor: mm.color,
            when: dd < 0 ? `${-dd}d overdue` : dd === 0 ? "today" : `in ${dd}d`,
            tone: dd < 0 ? T.coral : dd <= 7 ? T.gold : T.muted,
            urgency: dd < 0 ? -1000 + dd : dd,
          });
        });
      const by: Record<string, any[]> = {};
      store.labs
        .filter((l: any) => l.memberId === mm.id && (METRICS as any)[l.metric])
        .forEach((l: any) => (by[l.metric] ||= []).push(l));
      Object.keys(by).forEach((k) => {
        by[k].sort(sortR);
        if (statusOf(k, by[k]) === "out") {
          const last = by[k][by[k].length - 1];
          acts.push({
            id: mm.id + k,
            label: `${k} ${(METRICS as any)[k].bp ? `${last.value}/${last.value2}` : last.value} ${(METRICS as any)[k].unit} · above range`,
            who: first,
            whoColor: mm.color,
            when: "review",
            tone: T.coral,
            urgency: -500,
          });
        }
      });
    });
    return acts.sort((a, b) => a.urgency - b.urgency);
  }, [store.members, store.reminders, store.labs]);
  const txFollowUps = store.transactions.filter(
    (t: Transaction) => !t.followUpDone && t.followUpOn && daysTo(t.followUpOn) <= 45,
  );
  const holdingGaps: Act[] = [];
  store.holdings.forEach((h: Holding) => {
    const guarded = h.kind === "asset" || h.kind === "cover";
    if (guarded && !h.docId)
      holdingGaps.push({ id: h.id + "d", label: `${h.name} · no document on file`, when: "attach", tone: T.gold });
    if (guarded && !h.accessNote)
      holdingGaps.push({ id: h.id + "a", label: `${h.name} · no access instructions`, when: "add", tone: T.gold });
    if (guarded && !h.nominee)
      holdingGaps.push({ id: h.id + "n", label: `${h.name} · no nominee named`, when: "fix", tone: T.coral });
    if (h.maturityDate && daysTo(h.maturityDate) >= 0 && daysTo(h.maturityDate) < 60)
      holdingGaps.push({
        id: h.id + "m",
        label: `${h.name} matures`,
        when: `${daysTo(h.maturityDate)}d`,
        tone: T.gold,
      });
    if (h.kind === "cover" && h.renewalDate && daysTo(h.renewalDate) < 60)
      holdingGaps.push({ id: h.id + "r", label: `${h.name} renews`, when: `${daysTo(h.renewalDate)}d`, tone: T.gold });
  });
  const wealthActs: Act[] = [
    ...txFollowUps.map((t: Transaction) => ({
      id: t.id,
      txId: t.id,
      label: `Follow up: ${t.purpose}${t.followUpNote ? ` · ${t.followUpNote}` : ""}`,
      when: daysTo(t.followUpOn!) <= 0 ? "due" : `in ${daysTo(t.followUpOn!)}d`,
      tone: daysTo(t.followUpOn!) <= 0 ? T.coral : A.blue,
    })),
    ...holdingGaps,
  ];
  const groups: { key: string; label: string; icon: any; color: string; to: string; acts: Act[] }[] = [
    { key: "health", label: "Health", icon: HeartPulse, color: A.green, to: "health", acts: healthActs },
    { key: "documents", label: "Documents", icon: FolderOpen, color: A.blue, to: "documents", acts: docActs },
    { key: "wealth", label: "Wealth", icon: Wallet, color: T.gold, to: "wealth", acts: wealthActs },
  ].filter((g) => g.acts.length > 0);
  const totalActs = groups.reduce((n, g) => n + g.acts.length, 0);
  const stats = [
    { label: "Documents", value: store.docs.length, icon: FolderOpen, c: A.blue, to: "documents" },
    { label: "Overall readiness", value: `${overall}%`, icon: ShieldCheck, c: A.green, to: "packages" },
    { label: "Expiring < 60d", value: expiring.length, icon: Clock, c: A.gold, to: "documents" },
    { label: "Needs attention", value: totalActs, icon: Bell, c: A.pink, to: "health" },
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
        <Card style={{ padding: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px" }}>
            <AlertTriangle size={16} color={totalActs ? T.gold : T.mint} />
            <b style={{ color: T.white, fontSize: 15 }}>Action center</b>
            <span style={{ marginLeft: "auto", ...pill(totalActs ? T.gold : T.mint) }}>{totalActs || "all clear"}</span>
          </div>
          {totalActs === 0 ? (
            <p style={{ color: T.muted, fontSize: 13, padding: "0 16px 16px", margin: 0 }}>
              Nothing pressing across documents, health, or wealth. Nicely handled.
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.key}>
                <button
                  onClick={() => go(g.to)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "10px 16px",
                    borderTop: `1px solid ${T.border}`,
                    background: T.raised + "66",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <g.icon size={14} color={g.color} />
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: T.muted,
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    {g.label}
                  </span>
                  <span style={{ fontSize: 11.5, color: g.color, fontFamily: "ui-monospace, monospace" }}>
                    {g.acts.length}
                  </span>
                  <ChevronRight size={13} color={T.faint} style={{ marginLeft: "auto" }} />
                </button>
                {g.acts.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => go(g.to)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "9px 16px",
                      borderTop: `1px solid ${T.border}`,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 9, background: a.tone, flexShrink: 0 }} />
                    {a.who && (
                      <span
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 66, flexShrink: 0 }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: 9, background: a.whoColor }} />
                        <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{a.who}</span>
                      </span>
                    )}
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13.5,
                        color: T.text,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.label}
                    </span>
                    <span
                      style={{
                        fontSize: 11.5,
                        color: a.tone,
                        fontFamily: "ui-monospace, monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.when}
                    </span>
                    {(a.rid || a.txId) && (
                      <button
                        title="Mark done"
                        onClick={(e) => {
                          e.stopPropagation();
                          a.rid ? store.completeReminder(a.rid) : store.completeFollowUp(a.txId);
                          toast("Marked done");
                        }}
                        style={{ ...btnGhost, padding: 6 }}
                      >
                        <CheckCircle2 size={14} color={T.mint} />
                      </button>
                    )}
                  </div>
                ))}
                {g.acts.length > 4 && (
                  <button
                    onClick={() => go(g.to)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      borderTop: `1px solid ${T.border}`,
                      padding: "8px 16px",
                      cursor: "pointer",
                      fontSize: 12,
                      color: T.muted,
                      textAlign: "center",
                    }}
                  >
                    +{g.acts.length - 4} more in {g.label}
                  </button>
                )}
              </div>
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
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [person, setPerson] = useState<string>("All");
  const [source, setSource] = useState<string>("All");
  const [quick, setQuick] = useState<"all" | "expiring" | "expired" | "recent">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "name" | "expiry">("newest");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Doc | null>(null);
  const [preview, setPreview] = useState<Doc | null>(null);
  const [upMenu, setUpMenu] = useState(false);

  const nameOf = (mid?: string) => store.members.find((m: Member) => m.id === mid)?.name || "Unassigned";
  const colorOf = (mid?: string) => store.members.find((m: Member) => m.id === mid)?.color || T.faint;
  const fdate = (s?: string) =>
    s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—";

  const docs: Doc[] = store.docs;
  const expiring = docs.filter((d) => d.expiry && daysTo(d.expiry) >= 0 && daysTo(d.expiry) < 60);
  const expired = docs.filter((d) => d.expiry && daysTo(d.expiry) < 0);
  const recent = docs.filter((d) => (Date.now() - +new Date(d.addedAt)) / 86400000 <= 7);

  const filtered = useMemo(() => {
    let list = docs;
    if (quick === "expiring") list = list.filter((d) => d.expiry && daysTo(d.expiry) >= 0 && daysTo(d.expiry) < 60);
    if (quick === "expired") list = list.filter((d) => d.expiry && daysTo(d.expiry) < 0);
    if (quick === "recent") list = list.filter((d) => (Date.now() - +new Date(d.addedAt)) / 86400000 <= 7);
    if (cat !== "All") list = list.filter((d) => d.category === cat);
    if (person !== "All") list = list.filter((d) => (d.memberId || "") === person);
    if (source !== "All") list = list.filter((d) => d.source === source);
    const needle = q.trim().toLowerCase();
    if (needle)
      list = list.filter((d) =>
        `${d.docType} ${d.name} ${d.category} ${nameOf(d.memberId)} ${d.source} ${d.notes || ""}`
          .toLowerCase()
          .includes(needle),
      );
    const by: Record<string, (a: Doc, b: Doc) => number> = {
      newest: (a, b) => +new Date(b.addedAt) - +new Date(a.addedAt),
      oldest: (a, b) => +new Date(a.addedAt) - +new Date(b.addedAt),
      name: (a, b) => a.docType.localeCompare(b.docType),
      expiry: (a, b) => (a.expiry ? +new Date(a.expiry) : Infinity) - (b.expiry ? +new Date(b.expiry) : Infinity),
    };
    return [...list].sort(by[sort]);
  }, [docs, quick, cat, person, source, q, sort, store.members]);

  const allSel = filtered.length > 0 && filtered.every((d) => sel.has(d.id));
  const toggleAll = () => setSel(allSel ? new Set() : new Set(filtered.map((d) => d.id)));
  const toggle = (id: string) =>
    setSel((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const clearSel = () => setSel(new Set());
  const bulkDelete = async () => {
    for (const id of sel) await store.removeDoc(id);
    toast(`${sel.size} document(s) removed`);
    clearSel();
  };
  const bulkAssign = (mid: string) => {
    sel.forEach((id) => store.updateDoc(id, { memberId: mid }));
    toast(`${sel.size} document(s) assigned to ${nameOf(mid)}`);
    clearSel();
  };

  const selStyle: CSSProperties = {
    background: T.raised,
    color: T.text,
    border: `1px solid ${T.border}`,
    borderRadius: 9,
    padding: "8px 10px",
    fontSize: 13,
    outline: "none",
  };
  const expiryCell = (d: Doc) => {
    if (!d.expiry) return <span style={{ color: T.faint }}>—</span>;
    const n = daysTo(d.expiry);
    const c = n < 0 ? T.coral : n < 60 ? T.gold : T.muted;
    return <span style={{ color: c, fontWeight: n < 60 ? 700 : 400 }}>{n < 0 ? "expired" : `${n}d`}</span>;
  };
  const quickChips: { k: typeof quick; label: string; n: number; tone?: string }[] = [
    { k: "all", label: "All", n: docs.length },
    { k: "expiring", label: "Expiring soon", n: expiring.length, tone: T.gold },
    { k: "expired", label: "Expired", n: expired.length, tone: T.coral },
    { k: "recent", label: "Added this week", n: recent.length, tone: T.mint },
  ];
  const GRID = "26px 2.1fr 1.15fr 0.95fr 0.85fr 0.75fr 0.65fr 30px";

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          columnGap: 16,
          flexWrap: "wrap",
        }}
      >
        <SectionHead
          title="Documents"
          sub={`${docs.length} records in your archive. Search, filter, and open any row for full context.`}
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setUpMenu((v) => !v)} style={btnGold}>
              <UploadCloud size={15} /> Upload <ChevronDown size={14} />
            </button>
            {upMenu && (
              <>
                <div onClick={() => setUpMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 45 }} />
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    zIndex: 46,
                    width: 190,
                    background: T.panel,
                    border: `1px solid ${T.border}`,
                    borderRadius: 12,
                    padding: 6,
                    boxShadow: "0 20px 60px rgba(0,0,0,.5)",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 11px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: T.text,
                    }}
                  >
                    <FileText size={15} color={T.muted} /> Upload files
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
                        setUpMenu(false);
                      }}
                    />
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 11px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: T.text,
                    }}
                  >
                    <ImageIcon size={15} color={T.muted} /> From gallery
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
                        setUpMenu(false);
                      }}
                    />
                  </label>
                </div>
              </>
            )}
          </div>
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
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {quickChips.map((c) => {
          const on = quick === c.k;
          return (
            <button
              key={c.k}
              onClick={() => setQuick(c.k)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 13px",
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${on ? T.gold + "77" : T.border}`,
                background: on ? T.raised : "transparent",
                color: on ? T.white : T.muted,
              }}
            >
              {c.tone && <span style={{ width: 7, height: 7, borderRadius: 9, background: c.tone }} />}
              {c.label}
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: on ? T.gold : T.faint }}>
                {c.n}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: T.panel,
            border: `1px solid ${q ? T.gold + "66" : T.border}`,
            borderRadius: 10,
            padding: "8px 12px",
            flex: "1 1 220px",
            minWidth: 200,
          }}
        >
          <Search size={15} color={T.muted} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search type, file, person, notes…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.text, fontSize: 13.5 }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <select style={selStyle} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option style={{ color: "#000" }}>All</option>
          {(Object.keys(CAT_META) as Category[]).map((c) => (
            <option key={c} style={{ color: "#000" }}>
              {c}
            </option>
          ))}
        </select>
        <select style={selStyle} value={person} onChange={(e) => setPerson(e.target.value)}>
          <option value="All" style={{ color: "#000" }}>
            Everyone
          </option>
          {store.members.map((m: Member) => (
            <option key={m.id} value={m.id} style={{ color: "#000" }}>
              {m.name}
            </option>
          ))}
        </select>
        <select style={selStyle} value={source} onChange={(e) => setSource(e.target.value)}>
          {["All", "Upload", "Email", "Drive", "DigiLocker"].map((sName) => (
            <option key={sName} style={{ color: "#000" }}>
              {sName}
            </option>
          ))}
        </select>
        <select style={selStyle} value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option value="newest" style={{ color: "#000" }}>
            Newest first
          </option>
          <option value="oldest" style={{ color: "#000" }}>
            Oldest first
          </option>
          <option value="name" style={{ color: "#000" }}>
            Type A–Z
          </option>
          <option value="expiry" style={{ color: "#000" }}>
            Expiry soonest
          </option>
        </select>
      </div>

      {sel.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: T.raised,
            border: `1px solid ${T.gold}55`,
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 12,
          }}
        >
          <b style={{ color: T.white, fontSize: 13.5 }}>{sel.size} selected</b>
          <select style={selStyle} defaultValue="" onChange={(e) => e.target.value && bulkAssign(e.target.value)}>
            <option value="" disabled style={{ color: "#000" }}>
              Assign to…
            </option>
            {store.members.map((m: Member) => (
              <option key={m.id} value={m.id} style={{ color: "#000" }}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            onClick={bulkDelete}
            style={{ ...btnGhost, color: T.coral, borderColor: T.coral + "55", padding: "7px 12px", fontSize: 12.5 }}
          >
            <Trash2 size={13} /> Delete
          </button>
          <button onClick={clearSel} style={{ ...btnGhost, marginLeft: "auto", padding: "7px 12px", fontSize: 12.5 }}>
            Clear
          </button>
        </div>
      )}

      <Card style={{ padding: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID,
            gap: 10,
            alignItems: "center",
            padding: "12px 16px",
            fontSize: 11,
            fontWeight: 700,
            color: T.muted,
            textTransform: "uppercase",
            letterSpacing: 1,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <input
            type="checkbox"
            checked={allSel}
            onChange={toggleAll}
            style={{ accentColor: T.gold, cursor: "pointer" }}
          />
          <span>Document</span>
          <span>Person</span>
          <span>Category</span>
          <span>Source</span>
          <span>Added</span>
          <span>Expiry</span>
          <span />
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center" }}>
            <FolderOpen size={30} color={T.faint} style={{ margin: "0 auto 10px", display: "block" }} />
            <div style={{ color: T.text, fontWeight: 600, fontSize: 14.5 }}>
              {docs.length === 0 ? "Nothing here yet" : "No documents match these filters"}
            </div>
            <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>
              {docs.length === 0
                ? "Upload a file and it files itself."
                : "Try clearing the search or switching a filter."}
            </div>
          </div>
        ) : (
          filtered.map((d) => {
            const Ic = CAT_META[d.category].icon;
            const col = CAT_META[d.category].color;
            const active = open?.id === d.id;
            return (
              <div
                key={d.id}
                onClick={() => setOpen(d)}
                style={{
                  display: "grid",
                  gridTemplateColumns: GRID,
                  gap: 10,
                  alignItems: "center",
                  padding: "11px 16px",
                  borderTop: `1px solid ${T.border}`,
                  cursor: "pointer",
                  background: active ? T.raised : sel.has(d.id) ? T.raised + "88" : "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={sel.has(d.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggle(d.id)}
                  style={{ accentColor: T.gold, cursor: "pointer" }}
                />
                <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: col + "22",
                      flexShrink: 0,
                    }}
                  >
                    <Ic size={14} color={col} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 600,
                        color: T.white,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.docType}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 11.5,
                        color: T.faint,
                        fontFamily: "ui-monospace, monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.name}
                    </span>
                  </span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span
                    style={{ width: 8, height: 8, borderRadius: 9, background: colorOf(d.memberId), flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      color: T.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {nameOf(d.memberId)}
                  </span>
                </span>
                <span>
                  <span style={pill(col)}>{d.category}</span>
                </span>
                <span style={{ fontSize: 12.5, color: T.muted }}>{d.source}</span>
                <span style={{ fontSize: 12.5, color: T.muted, fontFamily: "ui-monospace, monospace" }}>
                  {fdate(d.addedAt)}
                </span>
                <span style={{ fontSize: 12.5, fontFamily: "ui-monospace, monospace" }}>{expiryCell(d)}</span>
                <ChevronRight size={15} color={active ? T.gold : T.faint} />
              </div>
            );
          })
        )}
      </Card>

      {open && (
        <DocContextPanel
          key={open.id}
          d={store.docs.find((x: Doc) => x.id === open.id) || open}
          store={store}
          toast={toast}
          onClose={() => setOpen(null)}
          onPreview={() => setPreview(store.docs.find((x: Doc) => x.id === open.id) || open)}
          onDeleted={() => setOpen(null)}
        />
      )}
      {preview && <DocViewer doc={preview} store={store} onClose={() => setPreview(null)} />}
    </div>
  );
}

/* ── document context drawer ── */
function DocContextPanel({ d, store, toast, onClose, onPreview, onDeleted }: any) {
  const [notes, setNotes] = useState(d.notes || "");
  const Ic = CAT_META[d.category as Category].icon;
  const col = CAT_META[d.category as Category].color;
  const nameOf = (mid?: string) => store.members.find((m: Member) => m.id === mid)?.name || "Unassigned";
  const usedIn = EVENTS.filter((e) => e.reqs.includes(d.docType));
  const holdings = store.holdings.filter((h: Holding) => h.docId === d.id);
  const txs = store.transactions.filter((t: Transaction) => t.docId === d.id);
  const days = d.expiry ? daysTo(d.expiry) : null;

  const lbl: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: T.muted,
    fontFamily: "ui-monospace, monospace",
    margin: "16px 0 7px",
    display: "block",
  };
  const inp: CSSProperties = {
    width: "100%",
    background: T.raised,
    border: `1px solid ${T.border}`,
    borderRadius: 9,
    padding: "8px 10px",
    color: T.text,
    fontSize: 13.5,
    outline: "none",
  };
  const fact = (label: string, value: ReactNode) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        padding: "7px 0",
        borderTop: `1px solid ${T.border}`,
      }}
    >
      <span style={{ fontSize: 12.5, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 12.5, color: T.text, fontFamily: "ui-monospace, monospace", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(4,7,15,.5)" }} />
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(430px, 94vw)",
          zIndex: 65,
          background: T.navy,
          borderLeft: `1px solid ${T.border}`,
          boxShadow: "-30px 0 80px rgba(0,0,0,.55)",
          display: "flex",
          flexDirection: "column",
          animation: "lpSlideIn .22s ease",
        }}
      >
        <style>{`@keyframes lpSlideIn { from { transform: translateX(40px); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "18px 20px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 40,
              height: 40,
              borderRadius: 10,
              background: col + "22",
              flexShrink: 0,
            }}
          >
            <Ic size={18} color={col} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 700, color: T.white }}>{d.docType}</div>
            <div
              style={{
                fontSize: 11.5,
                color: T.faint,
                fontFamily: "ui-monospace, monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {d.name}
            </div>
          </div>
          <button onClick={onClose} style={{ ...btnGhost, padding: 8 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 20px" }}>
          {d.expiry && (
            <div
              style={{
                marginTop: 16,
                borderRadius: 12,
                border: `1px solid ${(days! < 0 ? T.coral : days! < 60 ? T.gold : T.mint) + "55"}`,
                background: (days! < 0 ? T.coral : days! < 60 ? T.gold : T.mint) + "14",
                padding: "11px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Clock size={15} color={days! < 0 ? T.coral : days! < 60 ? T.gold : T.mint} />
              <span style={{ fontSize: 13, color: T.text }}>
                {days! < 0 ? `Expired ${-days!} days ago` : `Valid · expires in ${days} days`}
              </span>
            </div>
          )}

          <span style={lbl}>Details</span>
          <div>
            {fact("Category", d.category)}
            {fact("Source", d.source)}
            {fact(
              "Added",
              new Date(d.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            )}
            {d.docDate &&
              fact(
                "Document date",
                new Date(d.docDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              )}
            {fact("Size", `${d.sizeKB} KB`)}
          </div>

          <span style={lbl}>Belongs to</span>
          <select
            style={inp}
            value={d.memberId || ""}
            onChange={(e) => {
              store.updateDoc(d.id, { memberId: e.target.value || undefined });
              toast(`Assigned to ${nameOf(e.target.value)}`);
            }}
          >
            <option value="" style={{ color: "#000" }}>
              Unassigned
            </option>
            {store.members.map((m: Member) => (
              <option key={m.id} value={m.id} style={{ color: "#000" }}>
                {m.name}
              </option>
            ))}
          </select>

          <span style={lbl}>Expiry</span>
          <input
            style={inp}
            type="date"
            value={d.expiry ? d.expiry.slice(0, 10) : ""}
            onChange={(e) => {
              store.updateDoc(d.id, { expiry: e.target.value || undefined });
              toast(e.target.value ? "Expiry updated" : "Expiry cleared");
            }}
          />

          <span style={lbl}>Used in packages</span>
          {usedIn.length === 0 ? (
            <p style={{ fontSize: 12.5, color: T.faint, margin: 0 }}>No life-event package requires a {d.docType}.</p>
          ) : (
            usedIn.map((e) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderTop: `1px solid ${T.border}`,
                }}
              >
                <e.icon size={14} color={e.accent} />
                <span style={{ flex: 1, fontSize: 13, color: T.text }}>{e.name}</span>
                <span style={pill(T.mint)}>required</span>
              </div>
            ))
          )}

          {(holdings.length > 0 || txs.length > 0) && (
            <>
              <span style={lbl}>Cited as evidence</span>
              {holdings.map((h: Holding) => (
                <div
                  key={h.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderTop: `1px solid ${T.border}`,
                  }}
                >
                  <Coins size={14} color={T.gold} />
                  <span style={{ flex: 1, fontSize: 13, color: T.text }}>{h.name}</span>
                  <span style={{ fontSize: 12, color: T.muted, fontFamily: "ui-monospace, monospace" }}>
                    {money(h.value || 0)}
                  </span>
                </div>
              ))}
              {txs.map((t: Transaction) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderTop: `1px solid ${T.border}`,
                  }}
                >
                  <Receipt size={14} color={t.direction === "paid" ? T.coral : T.mint} />
                  <span style={{ flex: 1, fontSize: 13, color: T.text }}>{t.purpose}</span>
                  <span style={{ fontSize: 12, color: T.muted, fontFamily: "ui-monospace, monospace" }}>
                    {money(t.amount)}
                  </span>
                </div>
              ))}
            </>
          )}

          <span style={lbl}>Notes</span>
          <textarea
            style={{ ...inp, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
            value={notes}
            placeholder="Anything your family should know about this document…"
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if ((d.notes || "") !== notes) {
                store.updateDoc(d.id, { notes: notes || undefined });
                toast("Notes saved");
              }
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, padding: "14px 20px", borderTop: `1px solid ${T.border}` }}>
          <button onClick={onPreview} style={{ ...btnGold, flex: 1, justifyContent: "center" }}>
            <FileText size={15} /> Preview
          </button>
          <button
            onClick={async () => {
              await store.removeDoc(d.id);
              toast("Document removed");
              onDeleted();
            }}
            style={{ ...btnGhost, color: T.coral, borderColor: T.coral + "55" }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </aside>
    </>
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
function Wealth({ store, go, toast }: any) {
  const [viewDoc, setViewDoc] = useState<Doc | null>(null);
  const [edit, setEdit] = useState<Holding | null>(null);
  const [addTx, setAddTx] = useState(false);
  const [sos, setSos] = useState(false);
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
  const readiness = Math.round(
    (sum(guarded.filter((h) => h.nominee && h.docId && h.accessNote)) / (sum(guarded) || 1)) * 100,
  );
  const missNom = guarded.filter((h) => !h.nominee).length;
  const missDoc = guarded.filter((h) => !h.docId).length;
  const missAcc = guarded.filter((h) => !h.accessNote).length;
  const fixMins = missNom * 2 + missDoc * 3 + missAcc * 2;
  const readyColor = readiness >= 80 ? T.mint : readiness >= 50 ? T.gold : T.coral;
  const trusted = store.members.filter((m: Member) => m.access === "Full member" || m.access === "Emergency access");
  const linkedDoc = (h: Holding) => store.docs.find((d: Doc) => d.id === h.docId) || null;

  type Sev = "critical" | "important" | "info";
  const SEVC: Record<Sev, string> = { critical: T.coral, important: T.gold, info: A.blue };
  const gaps: {
    h: Holding;
    kind: "nominee" | "doc" | "renewal" | "maturity" | "access";
    sev: Sev;
    label: string;
    impact: string;
  }[] = [];
  H.forEach((h) => {
    const guardedKind = h.kind === "asset" || h.kind === "cover";
    const v = h.value || 0;
    if (guardedKind && !h.nominee)
      gaps.push({
        h,
        kind: "nominee",
        sev: "critical",
        label: `${h.name} · no nominee named`,
        impact: "legal heir process instead of a claim · typically 6+ months",
      });
    if (guardedKind && !h.docId)
      gaps.push({
        h,
        kind: "doc",
        sev: v >= 1000000 ? "critical" : "important",
        label: `${h.name} · no document on file`,
        impact: `${money(v)} undocumented · claims stall without proof`,
      });
    if (guardedKind && !h.accessNote)
      gaps.push({
        h,
        kind: "access",
        sev: v >= 500000 ? "critical" : "important",
        label: `${h.name} · no access instructions`,
        impact: `${money(v)} effectively locked for the family`,
      });
    if (h.maturityDate && daysTo(h.maturityDate) >= 0 && daysTo(h.maturityDate) < 60)
      gaps.push({
        h,
        kind: "maturity",
        sev: "info",
        label: `${h.name} matures in ${daysTo(h.maturityDate)} days`,
        impact: "decide renewal or reinvestment",
      });
  });
  covers.forEach((c) => {
    if (c.renewalDate && daysTo(c.renewalDate) < 60)
      gaps.push({
        h: c,
        kind: "renewal",
        sev: daysTo(c.renewalDate) < 15 ? "critical" : "important",
        label: `${c.name} renews in ${daysTo(c.renewalDate)} days`,
        impact: "cover lapses if the premium is missed",
      });
  });
  const sevRank: Record<Sev, number> = { critical: 0, important: 1, info: 2 };
  gaps.sort((a, b) => sevRank[a.sev] - sevRank[b.sev]);
  const txs: Transaction[] = store.transactions;

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
  const Chip = ({ ok, label }: { ok: boolean; label: string }) => (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        fontFamily: "ui-monospace, monospace",
        color: ok ? T.mint : T.coral,
        background: (ok ? T.mint : T.coral) + "14",
        border: `1px solid ${ok ? T.mint : T.coral}44`,
        borderRadius: 6,
        padding: "2px 7px",
      }}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
  );
  const Row = ({ h }: { h: Holding }) => {
    const d = linkedDoc(h);
    const accent = h.kind === "liability" ? T.coral : h.kind === "cover" ? A.teal : T.gold;
    const Ic = h.kind === "liability" ? Landmark : h.kind === "cover" ? ShieldCheck : Coins;
    const guardedKind = h.kind === "asset" || h.kind === "cover";
    return (
      <div
        onClick={() => setEdit(h)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "13px 16px",
          borderTop: `1px solid ${T.border}`,
          cursor: "pointer",
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
            {h.institution ? ` · ${h.institution}` : ""}
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
        {guardedKind && (
          <span style={{ display: "inline-flex", gap: 6, flexShrink: 0 }}>
            <span
              onClick={(e) => {
                e.stopPropagation();
                d ? setViewDoc(d) : attach(h);
              }}
              style={{ cursor: "pointer" }}
              title={d ? "View document" : "Attach document"}
            >
              <Chip ok={!!d} label="Doc" />
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (!h.nominee) setNomineeFor(h);
              }}
              style={{ cursor: h.nominee ? "default" : "pointer" }}
              title={h.nominee ? h.nomineeName || "Nominee named" : "Add nominee"}
            >
              <Chip ok={!!h.nominee} label="Nominee" />
            </span>
            <Chip ok={!!h.accessNote} label="Access" />
          </span>
        )}
        <ChevronRight size={14} color={T.faint} />
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
      <SectionHead
        title="Wealth"
        sub="Not a balance sheet: whether your family could access all of it if something happened to you."
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "0 0 28px" }}>
        <button onClick={() => setAddTx(true)} style={btnGhost}>
          <Receipt size={15} /> Capture proof
        </button>
        <button
          onClick={() => setSos(true)}
          style={{ ...btnGhost, color: T.coral, borderColor: T.coral + "66", fontWeight: 700 }}
        >
          <Siren size={15} /> SOS handoff
        </button>
      </div>

      {store.handoff && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            background: T.coral + "14",
            border: `1px solid ${T.coral}66`,
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <Siren size={16} color={T.coral} />
          <span style={{ flex: 1, fontSize: 13.5, color: T.text }}>
            <b style={{ color: T.coral }}>SOS handoff active</b> ({store.handoff.reason}) since{" "}
            {new Date(store.handoff.releasedAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            · shared with{" "}
            {store.handoff.recipients
              .map((id: string) => store.members.find((mm: Member) => mm.id === id)?.name.split(" ")[0])
              .filter(Boolean)
              .join(", ")}
          </span>
          <button
            onClick={() => {
              store.cancelHandoff();
              toast("Handoff cancelled · access revoked");
            }}
            style={{ ...btnGhost, color: T.coral, borderColor: T.coral + "55", padding: "7px 12px", fontSize: 12.5 }}
          >
            Cancel handoff
          </button>
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(250px, 1fr)",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <KeyRound size={15} color={T.muted} />
            <b style={{ color: T.white, fontSize: 14.5 }}>Estate readiness</b>
            <span style={{ marginLeft: "auto", fontSize: 12, color: T.muted }}>{guarded.length} holdings tracked</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 38, fontWeight: 800, color: readyColor }}>
              {readiness}%
            </span>
            <span style={{ fontSize: 13, color: T.muted }}>of documented value your family could actually reach</span>
          </div>
          <div style={{ height: 8, borderRadius: 9, background: T.raised, margin: "12px 0 14px", overflow: "hidden" }}>
            <div style={{ width: `${readiness}%`, height: "100%", borderRadius: 9, background: readyColor }} />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12.5 }}>
            <span style={{ color: missNom ? T.coral : T.mint }}>
              {missNom} missing nominee{missNom === 1 ? "" : "s"}
            </span>
            <span style={{ color: missDoc ? T.coral : T.mint }}>
              {missDoc} missing document{missDoc === 1 ? "" : "s"}
            </span>
            <span style={{ color: missAcc ? T.gold : T.mint }}>
              {missAcc} missing access instruction{missAcc === 1 ? "" : "s"}
            </span>
            {fixMins > 0 && (
              <span style={{ color: T.muted, marginLeft: "auto", fontFamily: "ui-monospace, monospace" }}>
                ~{fixMins} min to fix
              </span>
            )}
          </div>
        </Card>
        <button
          onClick={() => setEstate(true)}
          style={{
            textAlign: "left",
            cursor: "pointer",
            border: `1px solid ${T.gold}66`,
            borderRadius: 14,
            padding: 18,
            background: `linear-gradient(160deg, ${T.gold}1f, ${T.panel})`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={16} color={T.gold} />
              <b style={{ color: T.white, fontSize: 15.5 }}>Estate summary</b>
            </div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
              The one document your family opens first: every holding, nominee, location, and the first steps to take.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, fontWeight: 700, color: readyColor }}>
              {readiness}% ready for family
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 13.5,
                fontWeight: 700,
                color: T.gold,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              Preview <ArrowRight size={14} />
            </span>
          </div>
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 22,
          flexWrap: "wrap",
          alignItems: "center",
          padding: "10px 16px",
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          background: T.panel,
          marginBottom: 24,
          fontFamily: "ui-monospace, monospace",
          fontSize: 13.5,
        }}
      >
        <span style={{ color: T.muted }}>
          Net worth <b style={{ color: T.white }}>{money(net)}</b>
        </span>
        <span style={{ color: T.muted }}>
          Assets <b style={{ color: T.mint }}>{money(totalAssets)}</b>
        </span>
        <span style={{ color: T.muted }}>
          Liabilities <b style={{ color: T.coral }}>{money(totalLiab)}</b>
        </span>
        <span style={{ color: T.muted }}>
          Protection <b style={{ color: A.teal }}>{money(totalCover)}</b>
        </span>
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
              onClick={() =>
                g.kind === "nominee" ? setNomineeFor(g.h) : g.kind === "doc" ? attach(g.h) : setEdit(g.h)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 16px",
                borderTop: `1px solid ${T.border}`,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1,
                  fontFamily: "ui-monospace, monospace",
                  color: SEVC[g.sev],
                  border: `1px solid ${SEVC[g.sev]}55`,
                  background: SEVC[g.sev] + "14",
                  borderRadius: 6,
                  padding: "3px 7px",
                  flexShrink: 0,
                  width: 86,
                  textAlign: "center",
                }}
              >
                {g.sev.toUpperCase()}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, color: T.text, fontWeight: 600 }}>{g.label}</span>
                <span style={{ display: "block", fontSize: 12, color: T.muted, marginTop: 1 }}>{g.impact}</span>
              </span>
              <span style={{ fontSize: 12.5, color: SEVC[g.sev], fontWeight: 700, flexShrink: 0 }}>
                {g.kind === "nominee"
                  ? "Add nominee"
                  : g.kind === "doc"
                    ? "Attach"
                    : g.kind === "access"
                      ? "Add note"
                      : "Review"}
              </span>
              <ChevronRight size={14} color={T.faint} />
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
          <Card style={{ padding: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 16px" }}>
              <Receipt size={16} color={T.muted} />
              <b style={{ color: T.white, fontSize: 14.5 }}>Proof of payments</b>
              <button
                onClick={() => setAddTx(true)}
                style={{ ...btnGhost, marginLeft: "auto", padding: "6px 12px", fontSize: 12.5 }}
              >
                <Plus size={13} /> Add
              </button>
            </div>
            {txs.length === 0 ? (
              <p style={{ color: T.muted, fontSize: 13, padding: "0 16px 14px" }}>
                Record a payment or receipt with its evidence attached, and a follow-up if one is needed.
              </p>
            ) : (
              txs.map((t) => {
                const ev = store.docs.find((d: Doc) => d.id === t.docId);
                const overdueFu = t.followUpOn && !t.followUpDone;
                return (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
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
                        background: (t.direction === "paid" ? T.coral : T.mint) + "22",
                        flexShrink: 0,
                      }}
                    >
                      <Receipt size={15} color={t.direction === "paid" ? T.coral : T.mint} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.white }}>{t.purpose}</div>
                      <div style={{ fontSize: 12.5, color: T.muted }}>
                        {t.counterparty ? `${t.counterparty} · ` : ""}
                        {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {overdueFu
                          ? ` · follow up ${daysTo(t.followUpOn!) <= 0 ? "today" : `in ${daysTo(t.followUpOn!)}d`}${t.followUpNote ? `: ${t.followUpNote}` : ""}`
                          : ""}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: "ui-monospace, monospace",
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: t.direction === "paid" ? T.coral : T.mint,
                      }}
                    >
                      {t.direction === "paid" ? "\u2212" : "+"}
                      {money(t.amount)}
                    </span>
                    {ev ? (
                      <button onClick={() => setViewDoc(ev)} style={{ ...btnGhost, padding: "6px 10px", fontSize: 12 }}>
                        <Paperclip size={12} /> Evidence
                      </button>
                    ) : (
                      <span style={pill(T.gold)}>no evidence</span>
                    )}
                    {overdueFu && (
                      <button
                        onClick={() => {
                          store.completeFollowUp(t.id);
                          toast("Follow-up done");
                        }}
                        style={{ ...btnGhost, padding: "6px 10px", fontSize: 12 }}
                      >
                        <Check size={12} /> Done
                      </button>
                    )}
                    <button
                      onClick={() => {
                        store.removeTransaction(t.id);
                        toast("Transaction removed");
                      }}
                      title="Remove"
                      style={{ ...btnGhost, padding: 7 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </Card>
        </div>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <KeyRound size={16} color={T.muted} />
            <b style={{ color: T.white, fontSize: 15 }}>Legacy handoff</b>
          </div>
          <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 14px" }}>
            Who steps in, and whether nothing is lost if you are gone.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 14 }}>
            <Ring score={readiness} size={54} color={readiness >= 80 ? T.mint : readiness >= 50 ? T.gold : T.coral} />
            <div style={{ fontSize: 13, color: T.muted }}>
              of documented value has a document, a nominee, and access instructions on file
            </div>
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
          <button
            onClick={() => go("trust")}
            style={{ ...btnGhost, width: "100%", justifyContent: "center", marginTop: 8 }}
          >
            Manage trusted people <ArrowRight size={14} />
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
          holding={edit}
          members={store.members}
          onClose={() => setEdit(null)}
          onSave={(h: Holding) => {
            store.updateHolding(h.id, h);
            toast("Holding updated");
            setEdit(null);
          }}
          onDelete={() => {
            store.removeHolding(edit.id);
            toast("Holding removed");
            setEdit(null);
          }}
        />
      )}
      {addTx && (
        <TransactionModal
          members={store.members}
          onClose={() => setAddTx(false)}
          onSave={async (t: Omit<Transaction, "id" | "addedAt" | "docId">, evidence?: File) => {
            await store.addTransaction(t, evidence);
            toast(evidence ? "Transaction saved with evidence" : "Transaction saved");
            setAddTx(false);
          }}
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
      {sos && <SOSHandoffModal store={store} toast={toast} onClose={() => setSos(false)} />}
      {estate && <EstateSheet store={store} onClose={() => setEstate(false)} toast={toast} />}
      {viewDoc && <DocViewer doc={viewDoc} store={store} onClose={() => setViewDoc(null)} />}
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
  ["documents", "Documents", FolderOpen],
  ["packages", "Packages", Plane],
  ["health", "Health", HeartPulse],
  ["wealth", "Wealth", Wallet],
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

function SOSHandoffModal({ store, toast, onClose }: any) {
  const recipients: Member[] = store.members.filter(
    (m: Member) => m.access === "Emergency access" || m.access === "Full member",
  );
  const [chosen, setChosen] = useState<Set<string>>(new Set(recipients.map((m) => m.id)));
  const [reason, setReason] = useState<
    "" | "Medical emergency" | "Travel emergency" | "Death of a family member" | "Temporary incapacity"
  >("");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const wealthDocIds = new Set<string>();
  store.holdings.forEach((h: Holding) => h.docId && wealthDocIds.add(h.docId));
  store.transactions.forEach((t: Transaction) => t.docId && wealthDocIds.add(t.docId));
  const wealthDocs: Doc[] = store.docs.filter(
    (d: Doc) =>
      wealthDocIds.has(d.id) || d.category === "Finance" || d.category === "Insurance" || d.category === "Property",
  );
  const toggle = (id: string) =>
    setChosen((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const release = async () => {
    if (!chosen.size || !reason || !ack || busy) return;
    setBusy(true);
    try {
      const estate = buildEstate(store);
      const b = new Blob([estate], { type: "text/html" });
      const u = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = u;
      a.download = "SOS_Estate_Summary.html";
      a.click();
      URL.revokeObjectURL(u);
      await buildZip("SOS_Handoff_Documents", wealthDocs);
      store.releaseHandoff([...chosen], reason);
      toast("SOS handoff released · pack downloaded");
      onClose();
    } finally {
      setBusy(false);
    }
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
          border: `1px solid ${T.coral}55`,
          borderRadius: 16,
          width: "min(480px,100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 22,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <b style={{ color: T.white, fontSize: 18, display: "inline-flex", alignItems: "center", gap: 9 }}>
            <Siren size={18} color={T.coral} /> SOS handoff
          </b>
          <button onClick={onClose} style={{ ...btnGhost, padding: 8 }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: T.muted, margin: "0 0 14px", lineHeight: 1.55 }}>
          For a real emergency. Releases the estate summary, {wealthDocs.length} wealth documents, and every access
          instruction to the people below, so nothing is locked away when it matters. You can cancel any time and access
          is revoked.
        </p>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: T.muted,
            fontFamily: "ui-monospace, monospace",
            marginBottom: 6,
          }}
        >
          Who steps in
        </div>
        {recipients.length === 0 ? (
          <p style={{ fontSize: 13, color: T.coral }}>
            No one has Emergency or Full access yet. Set that up in Trust center first.
          </p>
        ) : (
          recipients.map((m) => (
            <label
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 0",
                borderTop: `1px solid ${T.border}`,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={chosen.has(m.id)}
                onChange={() => toggle(m.id)}
                style={{ accentColor: T.coral }}
              />
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
              <span style={{ flex: 1, fontSize: 13.5, color: T.text }}>
                {m.name}
                <span style={{ color: T.muted }}> · {m.relation}</span>
              </span>
              <span style={pill(m.access === "Full member" ? T.mint : A.blue)}>{m.access}</span>
            </label>
          ))
        )}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: T.muted,
            fontFamily: "ui-monospace, monospace",
            margin: "16px 0 6px",
          }}
        >
          Why is this being released?
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {(["Medical emergency", "Travel emergency", "Death of a family member", "Temporary incapacity"] as const).map(
            (r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "7px 12px",
                  borderRadius: 9,
                  cursor: "pointer",
                  border: `1px solid ${reason === r ? T.coral : T.border}`,
                  background: reason === r ? T.coral + "1f" : "transparent",
                  color: reason === r ? T.coral : T.muted,
                }}
              >
                {r}
              </button>
            ),
          )}
        </div>
        <div
          style={{
            marginTop: 14,
            borderRadius: 11,
            border: `1px solid ${T.border}`,
            background: T.raised,
            padding: "11px 13px",
            fontSize: 12.5,
            lineHeight: 1.7,
          }}
        >
          <div style={{ color: T.text, fontWeight: 700, marginBottom: 4 }}>They receive</div>
          <div style={{ color: T.mint }}>✓ Estate summary with first steps for the family</div>
          <div style={{ color: T.mint }}>✓ {wealthDocs.length} wealth documents (deeds, policies, statements)</div>
          <div style={{ color: T.mint }}>✓ Access instructions per holding</div>
          <div style={{ color: T.muted, marginTop: 4 }}>
            ✗ Health records · ✗ personal notes · ✗ anything outside Wealth
          </div>
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 9,
            marginTop: 12,
            fontSize: 12.5,
            color: T.muted,
            cursor: "pointer",
            lineHeight: 1.5,
          }}
        >
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            style={{ accentColor: T.coral, marginTop: 2 }}
          />
          I understand this shares my financial documents with the selected people now, and that I can cancel and revoke
          access at any time.
        </label>
        <button
          disabled={!chosen.size || !reason || !ack || busy}
          onClick={release}
          style={{
            ...btnGold,
            width: "100%",
            justifyContent: "center",
            marginTop: 16,
            background: T.coral,
            opacity: chosen.size && reason && ack && !busy ? 1 : 0.4,
          }}
        >
          <Siren size={15} />{" "}
          {busy ? "Releasing…" : `Release handoff to ${chosen.size} ${chosen.size === 1 ? "person" : "people"}`}
        </button>
      </div>
    </div>
  );
}

function TransactionModal({ members, onClose, onSave }: any) {
  const [evidence, setEvidence] = useState<File | null>(null);
  const [more, setMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    purpose: "",
    counterparty: "",
    direction: "paid" as "paid" | "received",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    memberId: "you",
    followUpOn: "",
    followUpNote: "",
  });
  const onProof = (file: File | null) => {
    setEvidence(file);
    if (file && !f.purpose) {
      const guess = file.name
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[_-]+/g, " ")
        .replace(/\b(img|scan|screenshot|receipt|wa|photo)\b/gi, "")
        .replace(/\d{6,}/g, "")
        .trim();
      if (guess) setF((p) => ({ ...p, purpose: guess.charAt(0).toUpperCase() + guess.slice(1) }));
    }
  };
  const valid = f.purpose.trim() && Number(f.amount) > 0;
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
    margin: "12px 0 5px",
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
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 22,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <b style={{ color: T.white, fontSize: 18 }}>Capture proof</b>
          <button onClick={onClose} style={{ ...btnGhost, padding: 8 }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 14px" }}>
          "I paid this." Attach the screenshot or receipt, confirm three details, done.
        </p>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            padding: evidence ? "14px" : "22px 14px",
            borderRadius: 12,
            border: `1.5px dashed ${evidence ? T.mint + "77" : T.border}`,
            background: evidence ? T.mint + "0d" : T.raised + "66",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          {evidence ? (
            <>
              <CheckCircle2 size={20} color={T.mint} />
              <span style={{ fontSize: 13, color: T.text, fontWeight: 600, wordBreak: "break-all" }}>
                {evidence.name}
              </span>
              <span style={{ fontSize: 11.5, color: T.muted }}>Tap to replace</span>
            </>
          ) : (
            <>
              <Paperclip size={20} color={T.gold} />
              <span style={{ fontSize: 13.5, color: T.text, fontWeight: 600 }}>Photo · screenshot · receipt · PDF</span>
              <span style={{ fontSize: 11.5, color: T.muted }}>
                The proof is the record; it files into Documents too
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/*,application/pdf"
            hidden
            onChange={(e) => onProof(e.target.files?.[0] || null)}
          />
        </label>
        <label style={lbl}>What was it</label>
        <input
          style={inp}
          value={f.purpose}
          onChange={(e) => setF({ ...f, purpose: e.target.value })}
          placeholder="e.g. LIC premium, advance to contractor"
        />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1.2 }}>
            <label style={lbl}>Amount</label>
            <input
              style={inp}
              type="number"
              min="0"
              value={f.amount}
              onChange={(e) => setF({ ...f, amount: e.target.value })}
              placeholder="0"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Direction</label>
            <select
              style={inp}
              value={f.direction}
              onChange={(e) => setF({ ...f, direction: e.target.value as "paid" | "received" })}
            >
              <option value="paid" style={{ color: "#000" }}>
                Paid
              </option>
              <option value="received" style={{ color: "#000" }}>
                Received
              </option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Date</label>
            <input style={inp} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </div>
        </div>
        <button
          onClick={() => setMore((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.muted,
            fontSize: 12.5,
            fontWeight: 600,
            padding: 0,
            marginTop: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <ChevronDown size={13} style={{ transform: more ? "rotate(180deg)" : "none", transition: ".15s" }} />
          {more ? "Fewer details" : "More details (who, follow-up)"}
        </button>
        {more && (
          <>
            <div>
              <label style={lbl}>Who (any person or institution)</label>
              <input
                style={inp}
                value={f.counterparty}
                onChange={(e) => setF({ ...f, counterparty: e.target.value })}
                placeholder="e.g. Ramesh (contractor), Aegis Life, landlord"
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Follow up on</label>
                <input
                  style={inp}
                  type="date"
                  value={f.followUpOn}
                  onChange={(e) => setF({ ...f, followUpOn: e.target.value })}
                />
              </div>
              <div style={{ flex: 1.4 }}>
                <label style={lbl}>Follow-up note</label>
                <input
                  style={inp}
                  value={f.followUpNote}
                  onChange={(e) => setF({ ...f, followUpNote: e.target.value })}
                  placeholder="e.g. check if cheque cleared"
                />
              </div>
            </div>
          </>
        )}
        <button
          disabled={!valid || saving}
          onClick={async () => {
            if (!valid) return;
            setSaving(true);
            await onSave(
              {
                purpose: f.purpose.trim(),
                counterparty: f.counterparty.trim() || undefined,
                direction: f.direction,
                amount: Number(f.amount),
                date: f.date,
                memberId: f.memberId,
                followUpOn: f.followUpOn || undefined,
                followUpNote: f.followUpNote.trim() || undefined,
                followUpDone: false,
              },
              evidence || undefined,
            );
          }}
          style={{
            ...btnGold,
            width: "100%",
            justifyContent: "center",
            marginTop: 16,
            opacity: valid && !saving ? 1 : 0.4,
          }}
        >
          {saving ? "Saving…" : "Confirm"}
        </button>
      </div>
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
              placeholder="•4821"
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
        {f.kind === "asset" && (
          <div style={{ marginTop: 12 }}>
            <label style={lbl}>Maturity date (deposits, retirement)</label>
            <input
              type="date"
              style={inp}
              value={f.maturityDate || ""}
              onChange={(e) => set("maturityDate", e.target.value)}
            />
          </div>
        )}
        {canNominee && (
          <div style={{ marginTop: 12 }}>
            <label style={lbl}>Access instructions for the family</label>
            <textarea
              style={{ ...inp, minHeight: 58, resize: "vertical", fontFamily: "inherit" }}
              value={f.accessNote || ""}
              onChange={(e) => set("accessNote", e.target.value)}
              placeholder="Where it is, who to contact, how to claim (locker no., agent, portal)"
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
    `<h3 style="margin:18px 0 6px;font-size:14px;color:#111827">${title}</h3><table style="width:100%;border-collapse:collapse;font-size:12.5px"><tr style="background:#f3f4f6">${th("Holding")}${th("Type")}${th("Where")}${th("Value")}${showNom ? th("Nominee") : ""}${th("Document")}${th("How to access")}</tr>${arr.map((h) => `<tr><td style="padding:6px 10px;font-weight:600">${h.name}</td><td style="padding:6px 10px">${h.type}</td><td style="padding:6px 10px;color:#6b7280">${h.institution || ""} ${h.accountRef || ""}</td><td style="padding:6px 10px">${m2(h.value)}</td>${showNom ? `<td style="padding:6px 10px;color:${h.nominee ? "#111827" : "#b91c1c"};font-weight:${h.nominee ? 400 : 700}">${h.nominee ? h.nomineeName || "named" : "NOT NAMED"}</td>` : ""}<td style="padding:6px 10px;color:#6b7280">${dn(h.docId)}</td><td style="padding:6px 10px;color:#374151">${h.accessNote || "\u2014"}</td></tr>`).join("") || `<tr><td colspan="6" style="padding:6px 10px;color:#9ca3af">None</td></tr>`}</table>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Estate Summary</title></head><body style="font-family:Inter,Arial,sans-serif;color:#111827;max-width:760px;margin:20px auto;padding:0 20px;background:#fff">
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #D8B25A;padding-bottom:12px"><div><div style="font-weight:800;font-size:20px">LifePack · Estate Summary</div><div style="color:#6b7280;font-size:13px">What your family would need to find and claim everything</div></div><div style="text-align:right;color:#6b7280;font-size:12px">Prepared ${new Date().toLocaleString()}</div></div>
  <div style="display:flex;gap:26px;margin-top:16px">
    <div><div style="font-size:12px;color:#6b7280">Net worth (documented)</div><div style="font-size:22px;font-weight:800">${m2(net)}</div></div>
    <div><div style="font-size:12px;color:#6b7280">Assets</div><div style="font-size:18px;font-weight:700">${m2(s(A_))}</div></div>
    <div><div style="font-size:12px;color:#6b7280">Liabilities</div><div style="font-size:18px;font-weight:700">${m2(s(L_))}</div></div>
    <div><div style="font-size:12px;color:#6b7280">Protection</div><div style="font-size:18px;font-weight:700">${m2(s(C_))}</div></div>
  </div>
  ${secTable("Assets", A_, true)}
  ${secTable("Liabilities", L_, false)}
  ${secTable("Insurance & protection", C_, true)}
  <h3 style="margin:18px 0 6px;font-size:14px;color:#111827">If something happens: first steps for the family</h3>
  <ol style="margin:0;padding-left:18px;line-height:1.8;color:#374151;font-size:13px">
    ${C_.map((c) => `<li>File the ${c.type.toLowerCase()} claim with <b>${c.institution || "the insurer"}</b>${c.accessNote ? ` — ${c.accessNote}` : ""}${c.nominee ? ` (nominee: ${c.nomineeName || "named"})` : ` <span style="color:#b91c1c;font-weight:700">(no nominee — expect a legal-heir process)</span>`}</li>`).join("")}
    ${[...new Set(A_.map((h) => h.institution).filter(Boolean))].map((inst) => `<li>Visit or contact <b>${inst}</b> with the death certificate, ID proof, and the account references above</li>`).join("")}
    <li>Documents attached in the handoff pack: ${A_.concat(C_).filter((h) => h.docId).length} of ${A_.concat(C_).length} holdings have proof on file${
      A_.concat(C_).filter((h) => !h.docId).length
        ? ` — <span style="color:#b91c1c;font-weight:700">${A_.concat(C_)
            .filter((h) => !h.docId)
            .map((h) => h.name)
            .join(", ")} missing</span>`
        : ""
    }</li>
    ${L_.length ? `<li>Outstanding liabilities to settle or transfer: ${L_.map((l) => `${l.name} (${l.institution || ""})`).join(", ")}</li>` : ""}
  </ol>
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
          style={{
            display: route === "documents" ? "none" : "flex",
            justifyContent: "flex-end",
            marginBottom: 20,
            position: "relative",
            zIndex: 40,
          }}
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
        {route === "wealth" && <Wealth store={store} go={go} toast={toast} />}
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
