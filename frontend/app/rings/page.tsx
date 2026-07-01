"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchFraudRings, fetchAnalytics, fetchClaims, type FraudRing, type ClaimListItem } from "@/lib/api";
import RoleBar from "@/components/RoleBar";

// ── Helpers ───────────────────────────────────────────────────────────────────

function schemeTitle(ring: FraudRing): string {
  const map: Record<string, string> = {
    motor_theft: "Motor Theft Scheme", motor: "Motor Damage Scheme",
    health: "Health Insurance Scheme", life: "Life Insurance Scheme",
    cyber: "Cyber Fraud Scheme", commercial_property: "Property Fraud Scheme",
  };
  return map[ring.claim_type] ?? `${ring.claim_type.replace(/_/g, " ")} Scheme`;
}

function humanizeSignal(signal: string): string {
  const s = signal.replace(/Rs\s*/g, "$").replace(/₹/g, "$");
  if (s.toLowerCase().includes("similar amounts") || s.toLowerCase().includes("amount")) {
    const amtMatch   = s.match(/\((\$[^)]+)\)/);
    const daysMatch  = s.match(/(\d+)\s*days/);
    const countMatch = s.match(/^(\d+)/);
    const count = countMatch ? countMatch[1] : "Multiple";
    const amt   = amtMatch  ? amtMatch[1]  : "similar values";
    const days  = daysMatch ? daysMatch[1] : "60";
    return `${count} claims filed with near-identical amounts (${amt}) within ${days} days — statistically improbable without coordination`;
  }
  if (s.toLowerCase().includes("keyword") || s.toLowerCase().includes("description") || s.toLowerCase().includes("share")) {
    return "All claims describe the same location and vehicle using near-identical language — indicates scripted, coordinated submission";
  }
  return s;
}

function ringExposure(ring: FraudRing, claims: ClaimListItem[]): number {
  return claims.filter((c) => ring.claim_ids.includes(c.claim_id)).reduce((sum, c) => sum + c.amount, 0);
}

function riskColors(score: number) {
  if (score >= 70) return { text: "text-red-400",    bg: "bg-red-500/[0.08]",    border: "border-red-500/25",    hex: "#ef4444" };
  if (score >= 40) return { text: "text-amber-400",  bg: "bg-amber-500/[0.08]",  border: "border-amber-500/25",  hex: "#f59e0b" };
  return             { text: "text-emerald-400", bg: "bg-emerald-500/[0.08]", border: "border-emerald-500/25", hex: "#10b981" };
}

function riskLevel(score: number): "HIGH" | "MEDIUM" | "LOW" {
  return score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
}

export default function RingsPage() {
  const [rings, setRings]   = useState<FraudRing[]>([]);
  const [claims, setClaims] = useState<ClaimListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchFraudRings(), fetchAnalytics(), fetchClaims()])
      .then(([r, , c]) => { setRings(r); setClaims(c); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const totalExposure = rings.reduce((s, r) => s + ringExposure(r, claims), 0);
  const totalLinked   = rings.reduce((s, r) => s + r.claim_ids.length, 0);
  const maxScore      = rings.length > 0 ? Math.max(...rings.map((r) => r.risk_score)) : 0;
  const highRiskRings = rings.filter((r) => r.risk_score >= 70).length;

  return (
    <div className="space-y-6">
      <RoleBar />

      {/* Chapter card */}
      <div className="rounded-xl px-5 py-4" style={{ background: "#fff5f5", border: "1px solid rgba(239,68,68,0.18)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: "#ef444410", color: "#dc2626", border: "1px solid #ef444430" }}>
            Chapter 4 · Fraud Caught
          </span>
          {rings.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              <span className="text-red-500 font-medium">AI detection active</span>
            </div>
          )}
        </div>
        <h1 className="text-base font-bold text-[#223A66]">What is a Fraud Ring?</h1>
        <p className="text-xs text-[#475569] mt-1 leading-relaxed max-w-2xl">
          A fraud ring is when multiple people coordinate false insurance claims — same location, same vehicle description, similar claim amounts — to maximize payouts.
          <span className="text-[#223A66] font-medium"> No human flagged these. Our AI detected them automatically</span> by analysing patterns across all claims in real time.
        </p>
        <div className="flex flex-wrap gap-4 mt-3">
          {[
            { icon: "🔍", text: "Analyses all claims for matching patterns" },
            { icon: "📍", text: "Checks location, amount, and description similarity" },
            { icon: "⚡", text: "Flags rings when 3+ claims match within 60 days" },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-1.5 text-[10px] text-[#64748b]">
              <span>{f.icon}</span><span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action-required alert */}
      {highRiskRings > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-red-500/[0.06] border border-red-500/20">
          <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <span className="text-red-600 font-semibold text-sm">Action Required — </span>
            <span className="text-[#475569] text-sm">
              {highRiskRings} high-risk scheme{highRiskRings > 1 ? "s" : ""} detected with{" "}
              <span className="text-[#223A66] font-semibold">${totalExposure.toLocaleString()}</span> at financial risk.
              Escalation to Special Investigation Unit recommended.
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="surface rounded-xl px-5 py-4">
          <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Financial Exposure</div>
          <div className="text-2xl font-bold text-red-400 tabular-nums">${totalExposure.toLocaleString()}</div>
          <div className="text-xs text-[#475569] mt-1">across {totalLinked} linked claims</div>
        </div>
        <div className="surface rounded-xl px-5 py-4">
          <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Active Schemes</div>
          <div className={`text-2xl font-bold tabular-nums ${rings.length > 0 ? "text-amber-400" : "text-emerald-400"}`}>{rings.length}</div>
          <div className="text-xs text-[#475569] mt-1">fraud rings under watch</div>
        </div>
        <div className="surface rounded-xl px-5 py-4">
          <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Claims Linked</div>
          <div className="text-2xl font-bold text-[#223A66] tabular-nums">{totalLinked}</div>
          <div className="text-xs text-[#475569] mt-1">flagged for investigation</div>
        </div>
        <div className="surface rounded-xl px-5 py-4">
          <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Highest Risk</div>
          <div className={`text-2xl font-bold tabular-nums ${riskColors(maxScore).text}`}>
            {maxScore}<span className="text-sm font-normal text-[#64748b]">/100</span>
          </div>
          <div className={`text-xs mt-1 font-semibold ${riskColors(maxScore).text}`}>{riskLevel(maxScore)} SEVERITY</div>
        </div>
      </div>

      {/* Scheme cards / empty state */}
      {rings.length === 0 ? (
        <div className="surface rounded-xl p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-base font-semibold text-[#223A66] mb-2">No fraud schemes detected</div>
          <p className="text-sm text-[#475569] mb-6 max-w-sm mx-auto">
            The AI is continuously monitoring all claims for coordinated fraud patterns.
          </p>
          <Link href="/submit" className="btn-primary">Submit a Claim</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rings.map((ring) => (
            <SchemeCard
              key={ring.ring_id}
              ring={ring}
              exposure={ringExposure(ring, claims)}
              linkedClaims={claims.filter((c) => ring.claim_ids.includes(c.claim_id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Scheme Card ───────────────────────────────────────────────────────────────

function SchemeCard({ ring, exposure, linkedClaims }: {
  ring: FraudRing; exposure: number; linkedClaims: ClaimListItem[];
}) {
  const level   = riskLevel(ring.risk_score);
  const colors  = riskColors(ring.risk_score);
  const title   = schemeTitle(ring);
  const signals = (ring.signals ?? []).slice(0, 2);
  const detectedDate = ring.detected_at
    ? new Date(ring.detected_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="surface rounded-xl overflow-hidden">
      <div className="flex">
        <div className="w-1 shrink-0" style={{ background: colors.hex }} />
        <div className="flex-1 p-6">

          {/* Card header */}
          <div className="flex items-start gap-6 mb-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <h2 className="text-lg font-bold text-[#223A66]">{title}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}>
                  {level} RISK
                </span>
              </div>
              <p className="text-sm text-[#475569] mb-4">
                {ring.claim_ids.length} linked claims · Detected {detectedDate}
                <span className="text-[#64748b] ml-2 font-mono text-[11px]">({ring.ring_id})</span>
              </p>
              {/* Financial exposure highlight */}
              <div className={`inline-flex items-center gap-4 px-4 py-3 rounded-xl border ${colors.bg} ${colors.border}`}>
                <div>
                  <div className="text-[9px] font-semibold text-[#475569] uppercase tracking-wider">Total at Risk</div>
                  <div className={`text-xl font-bold tabular-nums mt-0.5 ${colors.text}`}>${exposure.toLocaleString()}</div>
                </div>
                <div className="w-px h-8 bg-[#e2e8f0]" />
                <div>
                  <div className="text-[9px] font-semibold text-[#475569] uppercase tracking-wider">Claims</div>
                  <div className="text-xl font-bold text-[#223A66] mt-0.5">{ring.claim_ids.length}</div>
                </div>
                <div className="w-px h-8 bg-[#e2e8f0]" />
                <div>
                  <div className="text-[9px] font-semibold text-[#475569] uppercase tracking-wider">Risk Score</div>
                  <div className={`text-xl font-bold tabular-nums mt-0.5 ${colors.text}`}>{ring.risk_score}/100</div>
                </div>
              </div>
            </div>
            {/* Network viz */}
            <div className="shrink-0">
              <div className="text-[9px] font-semibold text-[#64748b] uppercase tracking-wider text-center mb-1.5">Claim Network</div>
              <ClaimNetwork claimIds={ring.claim_ids} score={ring.risk_score} />
            </div>
          </div>

          {/* Timeline */}
          {linkedClaims.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Claim Timeline</div>
              <ClaimTimeline claims={linkedClaims} color={colors.hex} />
            </div>
          )}

          {/* AI Findings */}
          {signals.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">What AI Found</div>
              <div className="space-y-2">
                {signals.map((s, i) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                    <svg className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm text-[#94a3b8] leading-relaxed">{humanizeSignal(s)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-white/[0.05]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider mr-1">Linked Claims:</span>
              {ring.claim_ids.map((id) => (
                <Link key={id} href={`/claims/${id}`}
                  className="font-mono text-[11px] px-2 py-1 rounded border border-white/[0.07] text-[#64748b] bg-white/[0.03] hover:text-[#b84dff] hover:border-[#6C63FF]/30 transition-all">
                  {id}
                </Link>
              ))}
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}>
              {level === "HIGH" ? "→ Escalate to SIU" : level === "MEDIUM" ? "→ Flag for Review" : "→ Monitor"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Claim Network SVG ─────────────────────────────────────────────────────────

function ClaimNetwork({ claimIds, score }: { claimIds: string[]; score: number }) {
  const W = 220, H = 140, cx = W / 2, cy = H / 2, radius = 52;
  const color = riskColors(score).hex;
  const nodes = claimIds.map((id, i) => {
    const angle = (i / claimIds.length) * 2 * Math.PI - Math.PI / 2;
    return { id, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "220px", height: "140px" }}>
      {nodes.map((n) => (
        <line key={n.id} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={color} strokeWidth={1.5} strokeOpacity={0.2} />
      ))}
      {nodes.map((n, i) => {
        const next = nodes[(i + 1) % nodes.length];
        return <line key={`e-${i}`} x1={n.x} y1={n.y} x2={next.x} y2={next.y} stroke={color} strokeWidth={1} strokeOpacity={0.1} />;
      })}
      <circle cx={cx} cy={cy} r={15} fill="none" stroke={color} strokeWidth={0.5} strokeOpacity={0.15}>
        <animate attributeName="r" values="15;26;15" dur="3s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={15} fill={`${color}20`} stroke={color} strokeWidth={1.5} />
      <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="central" fontSize={7} fill={color} fontWeight="bold">RING</text>
      <text x={cx} y={cy + 6} textAnchor="middle" dominantBaseline="central" fontSize={5.5} fill={color} opacity={0.6}>CENTER</text>
      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={11} fill="#223A66" stroke={color} strokeWidth={1.5} strokeOpacity={0.5} />
          <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={5} fill="#94a3b8">
            {n.id.split("-").pop()?.slice(-3)}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Claim Timeline ────────────────────────────────────────────────────────────

function ClaimTimeline({ claims, color }: { claims: ClaimListItem[]; color: string }) {
  const sorted = [...claims].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const times  = sorted.map((c) => new Date(c.created_at).getTime());
  const minT   = times[0], maxT = times[times.length - 1];
  const range  = maxT - minT || 1;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
      <div className="flex-1 relative h-7 flex items-center">
        <div className="absolute left-0 right-0 h-px bg-[#e2e8f0]" />
        {sorted.map((c, i) => {
          const pct = range === 0 ? 50 : ((times[i] - minT) / range) * 100;
          return (
            <div key={c.claim_id} className="absolute flex flex-col items-center"
              style={{ left: `${pct}%`, transform: "translateX(-50%)" }}>
              <div className="w-2.5 h-2.5 rounded-full border-2 bg-[#223A66]" style={{ borderColor: color }} />
              <span className="text-[8px] text-[#475569] mt-1 whitespace-nowrap">
                {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-[#64748b] shrink-0 pl-2">
        {sorted.length > 1
          ? `${Math.round((times[times.length - 1] - times[0]) / (1000 * 60 * 60 * 24))}d span`
          : "Same day"}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-52 rounded bg-white/[0.05]" />
      <div className="h-14 rounded-xl bg-red-500/[0.04]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/[0.04]" />)}
      </div>
      <div className="space-y-4">
        {Array(2).fill(0).map((_, i) => <div key={i} className="h-64 rounded-xl bg-white/[0.04]" />)}
      </div>
    </div>
  );
}
