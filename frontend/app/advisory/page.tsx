"use client";
import { useEffect, useState } from "react";
import { fetchPortfolioAdvisory, type PortfolioAdvisory, type TypeAdvisory } from "@/lib/api";
import RoleBar from "@/components/RoleBar";

const TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  motor:       { label: "Motor",       color: "#3b82f6", icon: "🚗" },
  health:      { label: "Health",      color: "#10b981", icon: "🏥" },
  life:        { label: "Life",        color: "#a855f7", icon: "❤️" },
  motor_theft: { label: "Motor Theft", color: "#ef4444", icon: "🔐" },
  cyber:       { label: "Cyber",       color: "#f59e0b", icon: "🛡️" },
  commercial_property: { label: "Property", color: "#64748b", icon: "🏢" },
};

function getAction(t: TypeAdvisory): { text: string; level: "warn" | "ok" | "alert" } {
  if (t.avg_fraud_score >= 70)
    return { text: "High fraud rate — consider additional verification requirements", level: "alert" };
  if (t.flagged_count >= 3)
    return { text: "Multiple flagged claims — investigate before settling", level: "warn" };
  if (t.approval_rate < 55)
    return { text: "Low approval rate — review rejection criteria for this type", level: "warn" };
  return { text: "Portfolio within normal range — no immediate action required", level: "ok" };
}

export default function AdvisoryPage() {
  const [data, setData] = useState<PortfolioAdvisory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioAdvisory().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-7">
      <RoleBar />

      {/* Chapter card */}
      <div className="rounded-xl px-5 py-4" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f0e8ff 100%)", border: "1px solid rgba(108,99,255,0.18)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: "#6C63FF15", color: "#6C63FF", border: "1px solid #6C63FF30" }}>
            Chapter 5 · Portfolio Insights
          </span>
        </div>
        <h1 className="text-base font-bold text-[#223A66]">What does the data say about your portfolio?</h1>
        <p className="text-xs text-[#475569] mt-1 leading-relaxed">
          After processing all claims, the AI surfaces patterns your team should act on — which claim types have high fraud rates, where money is at risk, and what coverage gaps exist.
          <span className="text-[#223A66] font-medium"> This replaces a monthly analyst report with real-time intelligence.</span>
        </p>
      </div>

      {/* What is this page — context card */}
      <div className="surface rounded-xl p-5 border border-[#6C63FF]/10">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#6C63FF15" }}>
            <svg className="w-4 h-4" style={{ color: "#6C63FF" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-[#223A66] mb-1">How to use this page</div>
            <p className="text-xs text-[#64748b] leading-relaxed">
              This page analyses every claim processed by the AI pipeline and surfaces patterns your team should act on.
              It answers: <span className="text-[#94a3b8]">Where is the most money at risk? Which claim types have high fraud rates? What coverage gaps should underwriters address?</span>
            </p>
            <div className="flex flex-wrap gap-3 mt-2.5">
              {[
                { role: "Insurance Manager", use: "Spot portfolio risks before they escalate" },
                { role: "Underwriter", use: "Use fraud patterns to set coverage limits" },
                { role: "Claims Adjuster", use: "Understand which claim types need extra scrutiny" },
              ].map(r => (
                <div key={r.role} className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-1 h-1 rounded-full bg-[#6C63FF]/50" />
                  <span className="text-[#6C63FF]/80 font-medium">{r.role}</span>
                  <span className="text-[#334155]">{r.use}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!data ? (
        <div className="surface rounded-xl px-5 py-16 text-center">
          <div className="text-3xl mb-3">📊</div>
          <div className="text-sm text-[#64748b]">No claims processed yet</div>
          <div className="text-xs text-[#334155] mt-1">Submit claims and the AI pipeline will generate insights automatically</div>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPI label="Total Exposure" value={`$${(data.total_exposure / 1000).toFixed(0)}K`} sub="across all claim types" color="#6C63FF" />
            <KPI label="High Risk Claims" value={String(data.high_risk_claims)} sub="fraud score ≥ 70" color="#ef4444" />
            <KPI label="Active Fraud Rings" value={String(data.active_rings)} sub="requiring investigation" color="#f59e0b" />
          </div>

          {/* Breakdown by type */}
          {data.by_type.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-[#334155] uppercase tracking-wider">Coverage Intelligence by Claim Type</h2>
                <span className="text-[10px] text-[#334155]">{data.by_type.length} types tracked</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.by_type.map(t => <TypeCard key={t.claim_type} data={t} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KPI({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="surface rounded-xl px-5 py-4">
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</div>
      <div className="text-xs text-[#64748b] mt-1.5 font-medium">{label}</div>
      <div className="text-[10px] text-[#334155] mt-0.5">{sub}</div>
    </div>
  );
}

function TypeCard({ data }: { data: TypeAdvisory }) {
  const meta = TYPE_META[data.claim_type] ?? { label: data.claim_type, color: "#64748b", icon: "📋" };
  const fraudColor = data.avg_fraud_score >= 70 ? "#ef4444" : data.avg_fraud_score >= 40 ? "#f59e0b" : "#10b981";
  const action = getAction(data);

  return (
    <div className="surface rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{meta.icon}</span>
          <div>
            <div className="text-sm font-semibold text-[#223A66]">{meta.label}</div>
            <div className="text-xs text-[#475569]">{data.count} claims processed</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-[#223A66] tabular-nums">${(data.total_value / 1000).toFixed(1)}K</div>
          <div className="text-[10px] text-[#334155]">total value</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <Metric label="Avg Claim"  value={`$${(data.avg_amount / 1000).toFixed(0)}K`} />
        <Metric label="Fraud Score" value={String(data.avg_fraud_score)} color={fraudColor} />
        <Metric label="Approved"   value={`${data.approval_rate}%`} color="#10b981" />
      </div>

      {/* Recommended coverage */}
      <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#f8fafc]">
        <span className="text-xs text-[#475569]">AI recommended coverage</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: meta.color }}>
          ${(data.optimal_coverage / 1000).toFixed(0)}K
        </span>
      </div>

      {/* Add-ons */}
      {data.recommended_add_ons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.recommended_add_ons.slice(0, 3).map((addon, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{ color: meta.color, background: `${meta.color}10`, borderColor: `${meta.color}25` }}>
              + {addon}
            </span>
          ))}
        </div>
      )}

      {/* Action recommendation */}
      <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs ${
        action.level === "alert" ? "bg-red-500/[0.07] border border-red-500/20 text-red-400" :
        action.level === "warn"  ? "bg-amber-500/[0.07] border border-amber-500/20 text-amber-400" :
                                   "bg-emerald-500/[0.07] border border-emerald-500/20 text-emerald-400"
      }`}>
        <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {action.level === "ok" ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          )}
        </svg>
        <span>{action.text}</span>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-[#f8fafc] px-2.5 py-2 text-center">
      <div className="text-sm font-bold text-[#223A66]" style={color ? { color } : {}}>{value}</div>
      <div className="text-[9px] text-[#334155] mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-7 animate-pulse">
      <div className="h-6 w-48 rounded bg-[#f1f5f9]" />
      <div className="h-24 rounded-xl bg-[#f1f5f9]" />
      <div className="grid grid-cols-3 gap-4">
        {Array(3).fill(0).map((_, i) => <div key={i} className="h-20 rounded-xl bg-[#f1f5f9]" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array(4).fill(0).map((_, i) => <div key={i} className="h-52 rounded-xl bg-[#f1f5f9]" />)}
      </div>
    </div>
  );
}
