"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchAnalytics, fetchClaims, fetchFraudRings,
  type Analytics, type ClaimListItem, type FraudRing,
} from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import LiveFeed from "@/components/LiveFeed";
import RoleBar from "@/components/RoleBar";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [claims, setClaims]       = useState<ClaimListItem[]>([]);
  const [rings, setRings]         = useState<FraudRing[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchClaims(), fetchFraudRings()])
      .then(([a, c, r]) => { setAnalytics(a); setClaims(c); setRings(r); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  if (!analytics) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#f8fafc" }}>
      <div className="text-center space-y-3">
        <div className="text-2xl font-bold text-[#223A66]">Connecting to backend…</div>
        <div className="text-sm text-[#64748b]">Make sure the backend is running on port 8000</div>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#6C63FF" }}>Retry</button>
      </div>
    </div>
  );

  const a     = analytics;
  const total = a.total_claims || 1;

  const fraudExposure = claims
    .filter(c => c.status === "flagged" || c.status === "escalated")
    .reduce((s, c) => s + c.amount, 0);

  const donutData = [
    { label: "Approved",  value: a.approved,     color: "#10b981" },
    { label: "Flagged",   value: a.flagged,       color: "#ef4444" },
    { label: "Pending",   value: a.pending_docs,  color: "#f59e0b" },
    { label: "Escalated", value: a.escalated,     color: "#6C63FF" },
  ];

  return (
    <div className="space-y-6">
      <RoleBar />

      {/* ── Chapter 1: The Problem + Our Answer ─────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f0e8ff 100%)", border: "1px solid rgba(108,99,255,0.18)" }}>
        <div className="px-6 py-5">
          {/* Chapter label */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: "#6C63FF12", color: "#6C63FF", border: "1px solid #6C63FF30" }}>
              Chapter 1 · The Problem
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: problem */}
            <div>
              <h1 className="text-lg font-bold text-[#223A66] leading-snug">
                Insurance fraud costs <span style={{ color: "#dc2626" }}>$3.1B/year</span> in India.
                <br />Claims take <span style={{ color: "#d97706" }}>21+ days</span> to settle.
              </h1>
              <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                9.5% of all insurance claims contain fraud signals. Adjusters review each claim manually — slow, expensive, inconsistent.
                IRDAI mandates 30-day settlement but the industry averages 21 days.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { n: "16.2M", label: "claims/year" },
                  { n: "9.5%",  label: "fraud rate" },
                  { n: "21d",   label: "avg settlement" },
                ].map(s => (
                  <div key={s.label} className="px-3 py-1.5 rounded-lg" style={{ background: "rgba(108,99,255,0.06)", border: "1px solid rgba(108,99,255,0.12)" }}>
                    <div className="text-sm font-bold text-[#223A66] tabular-nums">{s.n}</div>
                    <div className="text-[9px] text-[#64748b]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: our answer */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#6C63FF" }}>
                  Our AI Pipeline solves this
                </div>
                <div className="space-y-1.5">
                  {[
                    { icon: "⚡", text: "Processes each claim in under 3 seconds" },
                    { icon: "🔍", text: "5 AI agents analyse policy, fraud, and risk" },
                    { icon: "🔗", text: "Detects fraud rings across unrelated claims" },
                    { icon: "📊", text: "MongoDB Atlas Vector Search for policy matching" },
                  ].map(f => (
                    <div key={f.text} className="flex items-center gap-2 text-xs text-[#475569]">
                      <span className="text-sm">{f.icon}</span>
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/submit"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white self-start transition-colors"
                style={{ background: "#0D6EFD" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#0b5ed7")}
                onMouseLeave={e => (e.currentTarget.style.background = "#0D6EFD")}>
                Watch AI Process a Claim Live
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Pipeline strip */}
        <div className="border-t px-6 py-3 flex items-center gap-0 overflow-x-auto" style={{ borderColor: "rgba(108,99,255,0.15)", background: "rgba(108,99,255,0.04)" }}>
          <span className="text-[9px] font-semibold text-[#64748b] uppercase tracking-wider shrink-0 mr-3">AI Pipeline:</span>
          {["Language Agent", "Policy Match", "Fraud Analysis", "Ring Detection", "Decision + Audit"].map((s, i, arr) => (
            <div key={s} className="flex items-center shrink-0">
              <span className="text-[10px] text-[#475569] font-medium">{s}</span>
              {i < arr.length - 1 && (
                <svg className="w-3 h-3 text-[#c4b5fd] mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
          <span className="ml-auto text-[10px] font-semibold shrink-0" style={{ color: "#6C63FF" }}>⚡ All in &lt;3 seconds</span>
        </div>
      </div>

      {/* ── Fraud ring alert ─────────────────────────────────────────────── */}
      {rings.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/[0.07] border border-red-500/20 text-sm">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-red-400 font-medium">{rings.length} fraud ring{rings.length > 1 ? "s" : ""} detected by AI</span>
          <span className="text-[#64748b]">·</span>
          <span className="text-[#64748b]">{rings.reduce((s, r) => s + r.claim_ids.length, 0)} claims linked</span>
          <Link href="/rings" className="ml-auto text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1">
            Investigate → (Chapter 4)
          </Link>
        </div>
      )}

      {/* ── Impact numbers ─────────────────────────────────────────────────── */}
      <div>
        <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-3">What Our AI Has Done So Far</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Donut chart card */}
          <div className="sm:col-span-2 surface rounded-xl p-5 flex items-center gap-6">
            <DonutChart data={donutData} total={a.total_claims} />
            <div className="flex-1 space-y-2">
              {donutData.map((d) => (
                <div key={d.label} className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-[#475569] flex-1">{d.label}</span>
                  <span className="text-xs font-bold tabular-nums text-[#223A66]">{d.value}</span>
                  <span className="text-[10px] text-[#94a3b8] tabular-nums w-8 text-right">
                    {Math.round(d.value / total * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud prevented */}
          <div className="surface rounded-xl px-5 py-4">
            <div className="flex items-end gap-1 leading-none">
              <span className="text-xl font-bold tabular-nums" style={{ color: "#ef4444" }}>
                ${fraudExposure > 0 ? (fraudExposure / 1000).toFixed(0) + "K" : "0"}
              </span>
            </div>
            <div className="text-xs text-[#475569] mt-2">Fraud Exposure Blocked</div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">{a.flagged + a.escalated} claims flagged or escalated</div>
          </div>

          {/* Speed */}
          <div className="surface rounded-xl px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold tabular-nums leading-none" style={{ color: "#6C63FF" }}>&lt;3s</div>
              <div className="text-[10px] text-[#334155] leading-tight">vs<br/>21 days</div>
            </div>
            <div className="text-xs text-[#475569] mt-2">AI Processing Speed</div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#6C63FF" }} />
              <span className="text-[10px] text-[#94a3b8]">vs 21-day industry avg</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Business Case ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            value: `${Math.round(a.total_claims * 4)}h`,
            label: "Adjuster Hours Saved",
            sub: `${a.total_claims} claims × 4h manual avg`,
            color: "#10b981",
          },
          {
            value: `$${fraudExposure > 0 ? (fraudExposure / 1000).toFixed(0) + "K" : "0"}`,
            label: "Fraud Exposure Blocked",
            sub: `${a.flagged + a.escalated} flagged/escalated claims`,
            color: "#ef4444",
          },
          {
            value: "100%",
            label: "IRDAI Compliant",
            sub: "All claims < 30-day mandate",
            color: "#6C63FF",
          },
        ].map(kpi => (
          <div key={kpi.label} className="surface rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="text-2xl font-bold tabular-nums shrink-0" style={{ color: kpi.color }}>{kpi.value}</div>
            <div>
              <div className="text-xs font-semibold text-[#223A66]">{kpi.label}</div>
              <div className="text-[10px] text-[#94a3b8] mt-0.5">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Demo Journey guide ────────────────────────────────────────────── */}
      <div className="surface rounded-xl p-5">
        <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-4">Follow the Demo — 6 Chapters</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { n: 1, title: "Overview",      sub: "You are here",           href: "/",           active: true  },
            { n: 2, title: "Submit Claim",  sub: "Watch AI pipeline",      href: "/submit",     active: false },
            { n: 3, title: "All Claims",    sub: "See AI decisions",        href: "/claims",     active: false },
            { n: 4, title: "Fraud Rings",   sub: "Rings detected by AI",   href: "/rings",      active: false },
            { n: 5, title: "AI Insights",   sub: "Portfolio intelligence", href: "/advisory",   active: false },
            { n: 6, title: "IRDAI Proof",   sub: "vs industry benchmark",  href: "/benchmark",  active: false },
          ].map((step) => (
            <Link key={step.n} href={step.href}
              className={`flex flex-col gap-1 rounded-xl px-3 py-3 transition-all border ${
                step.active
                  ? "border-[#6C63FF]/30 text-[#223A66]"
                  : "border-[#e2e8f0] text-[#475569] hover:text-[#223A66] hover:border-[#6C63FF]/20 hover:bg-[#faf5ff]"
              }`}
              style={step.active ? { background: "rgba(108,99,255,0.06)" } : {}}>
              <span className="text-[9px] font-bold" style={step.active ? { color: "#6C63FF" } : { color: "#94a3b8" }}>
                STEP {step.n}
              </span>
              <span className="text-[11px] font-semibold leading-tight">{step.title}</span>
              <span className="text-[9px] leading-tight" style={step.active ? { color: "#6C63FF80" } : { color: "#94a3b8" }}>
                {step.sub}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── AI Insight strip ─────────────────────────────────────────────── */}
      <InsightStrip a={a} rings={rings} total={total} />

      {/* ── Evidence: table + live feed ──────────────────────────────────── */}
      <div>
        <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-3">Live Evidence — Most Recent Claims</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[#94a3b8]">Each row = one AI decision made in &lt;3 seconds</p>
              <Link href="/claims" className="text-xs text-[#64748b] hover:text-[#6C63FF] transition-colors">
                All claims (Chapter 3) →
              </Link>
            </div>
            <div className="surface rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f1f5f9]">
                    <Th>Claim ID</Th>
                    <Th>Claimant</Th>
                    <Th>Type</Th>
                    <Th align="right">Amount</Th>
                    <Th align="center">AI Verdict</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {claims.slice(0, 6).map((c) => (
                    <tr key={c.claim_id} className="hover:bg-[#faf5ff] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[#6C63FF] font-medium">{c.claim_id}</td>
                      <td className="px-4 py-3 text-[#223A66] font-medium">{c.claimant_name}</td>
                      <td className="px-4 py-3 text-[#64748b] capitalize text-xs">{c.claim_type.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-right text-[#223A66] font-semibold tabular-nums">${c.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                  {claims.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-[#94a3b8] text-xs">
                        No claims yet.{" "}
                        <Link href="/submit" className="text-[#6C63FF] hover:underline">Submit one to start the demo →</Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-xs text-[#94a3b8] mb-2">Claims processing in real time</p>
            <LiveFeed />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Donut Chart (pure SVG) ─────────────────────────────────────────────────────

function DonutChart({ data, total }: { data: { value: number; color: string }[]; total: number }) {
  const size = 112; const r = 40; const cx = size / 2; const cy = size / 2;
  const sw = 13; const circ = 2 * Math.PI * r;
  const tot = data.reduce((s, d) => s + d.value, 0) || 1;
  let accumulated = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(34,58,102,0.06)" strokeWidth={sw} />
      {data.map((seg, i) => {
        const segLen = (seg.value / tot) * circ;
        const dashOffset = circ - accumulated;
        accumulated += segLen;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={sw}
            strokeDasharray={`${segLen} ${circ - segLen}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
      })}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#223A66">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="#94a3b8">PROCESSED</text>
    </svg>
  );
}

// ── AI Insight Strip ───────────────────────────────────────────────────────────

function InsightStrip({ a, rings, total }: { a: Analytics; rings: FraudRing[]; total: number }) {
  const approvalRate = Math.round(a.approved / total * 100);
  const flagRate     = Math.round(a.flagged  / total * 100);
  let insight: string;
  if (rings.length > 0 && a.flagged > 0) {
    insight = `${flagRate}% of claims flagged · ${rings.length} active fraud ring${rings.length > 1 ? "s" : ""} under investigation · ${approvalRate}% clean approval rate`;
  } else if (a.avg_fraud_score < 20) {
    insight = `Portfolio healthy — avg fraud score ${a.avg_fraud_score.toFixed(1)}/100 · ${approvalRate}% approval rate · no active rings`;
  } else {
    insight = `${approvalRate}% approval rate · ${a.flagged} claim${a.flagged !== 1 ? "s" : ""} flagged · avg risk score ${a.avg_fraud_score.toFixed(1)}/100`;
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl surface border border-[#6C63FF]/10">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: "#6C63FF" }} />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "#6C63FF" }} />
      </span>
      <span className="text-[11px] font-semibold" style={{ color: "#6C63FF" }}>Live AI Insight</span>
      <span className="text-[#475569] text-xs">{insight}</span>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th className={`px-4 py-2.5 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider text-${align}`}>
      {children}
    </th>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 rounded-2xl bg-black/[0.04]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-2 h-28 rounded-xl bg-black/[0.04]" />
        {Array(2).fill(0).map((_, i) => <div key={i} className="h-28 rounded-xl bg-black/[0.04]" />)}
      </div>
      <div className="h-28 rounded-xl bg-black/[0.04]" />
      <div className="h-10 rounded-xl bg-black/[0.03]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 h-64 rounded-xl bg-black/[0.04]" />
        <div className="h-64 rounded-xl bg-black/[0.04]" />
      </div>
    </div>
  );
}
