"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchSubmissions, fetchSubmissionsAnalytics, type Submission, type SubmissionsAnalytics } from "@/lib/api";

const LOB_LABEL: Record<string, string> = {
  commercial_property: "Commercial Property",
  general_liability:   "General Liability",
  workers_comp:        "Workers Comp",
  cyber:               "Cyber",
};

const STATUS_COLOR: Record<string, string> = {
  needs_review:    "#f59e0b",
  ready_to_rate:   "#3b82f6",
  rating_complete: "#a855f7",
  approved:        "#10b981",
  declined:        "#ef4444",
  pending_info:    "#64748b",
};

const STATUS_LABEL: Record<string, string> = {
  needs_review:    "Needs Review",
  ready_to_rate:   "Ready to Rate",
  rating_complete: "Rating Done",
  approved:        "Approved",
  declined:        "Declined",
  pending_info:    "Pending Info",
};

export default function UnderwritingPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics]     = useState<SubmissionsAnalytics | null>(null);
  const [loading, setLoading]         = useState(true);
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchSubmissions(), fetchSubmissionsAnalytics()])
      .then(([s, a]) => { setSubmissions(s); setAnalytics(a); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">

      {/* Chapter card */}
      <div className="rounded-xl px-5 py-4 mb-2" style={{ background: "#0a0d12", border: "1px solid #a855f720" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: "#a855f715", color: "#a855f7", border: "1px solid #a855f730" }}>
            Chapter 7 · Risk Assessment
          </span>
        </div>
        <h1 className="text-base font-bold text-white">AI-Powered Underwriting Workbench</h1>
        <p className="text-xs text-[#475569] mt-1 leading-relaxed">
          An underwriter receives a broker submission (commercial property, GL, workers comp, cyber). Normally they spend 2–4 hours extracting fields and calculating risk.
          <span className="text-white font-medium"> Our AI extracts all fields automatically via Claude, identifies missing data, and generates a risk-adjusted premium — in seconds.</span>
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Underwriting Submissions</h2>
          <p className="text-sm text-[#64748b] mt-0.5">AI field extraction · rating engine · full traceability</p>
        </div>
        <Link href="/underwriting/new" className="btn-primary">New Submission</Link>
      </div>

      {/* Visual stats bar */}
      {analytics && <StatsBar analytics={analytics} />}

      {/* Accordion submissions */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="surface rounded-xl p-14 text-center">
          <p className="text-sm font-medium text-white mb-1">No submissions yet</p>
          <p className="text-xs text-[#64748b] mb-5">Create a submission to see AI extraction in action</p>
          <Link href="/underwriting/new" className="btn-primary">Create First Submission</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => (
            <SubmissionCard
              key={s.submission_id}
              s={s}
              open={expandedId === s.submission_id}
              onToggle={() => setExpandedId(expandedId === s.submission_id ? null : s.submission_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatsBar({ analytics: a }: { analytics: SubmissionsAnalytics }) {
  const stats = [
    { label: "Total",        value: a.total,           color: "#f1f5f9" },
    { label: "Needs Review", value: a.needs_review,    color: "#f59e0b" },
    { label: "Ready",        value: a.ready_to_rate,   color: "#3b82f6" },
    { label: "Rated",        value: a.rating_complete, color: "#a855f7" },
    { label: "Approved",     value: a.approved,        color: "#10b981" },
    { label: "Declined",     value: a.declined,        color: "#ef4444" },
  ];
  const total = a.total || 1;
  return (
    <div className="surface rounded-xl p-5">
      {/* Bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-4">
        {stats.slice(1).map((s) => (
          <div key={s.label} className="h-full transition-all" title={`${s.label}: ${s.value}`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color, minWidth: s.value > 0 ? '2px' : '0' }} />
        ))}
      </div>
      {/* Labels */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label}>
            <div className="text-xl font-bold tabular-nums" style={{ color }}>{value}</div>
            <div className="text-[10px] text-[#64748b] mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmissionCard({ s, open, onToggle }: { s: Submission; open: boolean; onToggle: () => void }) {
  const totalF   = s.field_definitions?.length ?? 0;
  const complete = s.gap_analysis?.complete_count ?? 0;
  const pct      = totalF > 0 ? Math.round(complete / totalF * 100) : 0;
  const color    = STATUS_COLOR[s.status] ?? "#64748b";
  const label    = STATUS_LABEL[s.status] ?? s.status;

  return (
    <div className={`surface rounded-xl overflow-hidden border transition-all ${open ? "border-[#6C63FF]/20" : "border-transparent"}`}>
      {/* Compact header — always visible, clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        {/* Chevron */}
        <svg className={`w-3.5 h-3.5 shrink-0 text-[#334155] transition-transform ${open ? "rotate-90" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        {/* ID */}
        <span className="font-mono text-xs text-[#6C63FF] font-medium w-32 shrink-0">{s.submission_id}</span>

        {/* Insured */}
        <span className="text-sm text-[#e2e8f0] font-medium flex-1 truncate">{s.insured_name}</span>

        {/* LOB chip */}
        <span className="text-[10px] text-[#64748b] bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded shrink-0 hidden sm:block">
          {LOB_LABEL[s.line_of_business] ?? s.line_of_business}
        </span>

        {/* Fields mini bar */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-[#6C63FF]" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-[#475569] tabular-nums w-7">{pct}%</span>
        </div>

        {/* Status badge */}
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>
          {label}
        </span>
      </button>

      {/* Expanded details */}
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-white/[0.05]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4">
            <div>
              <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-1">Broker</div>
              <div className="text-sm text-[#e2e8f0]">{s.broker_name || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-1">Premium</div>
              <div className="text-sm font-bold text-white">
                {s.rating?.final_premium ? `$${s.rating.final_premium.toLocaleString()}` : "Not rated"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-1">Fields Complete</div>
              <div className="text-sm text-[#e2e8f0]">{complete} / {totalF}</div>
              {s.gap_analysis?.missing_count > 0 && (
                <div className="text-[10px] text-amber-400 mt-0.5">{s.gap_analysis.missing_count} required missing</div>
              )}
            </div>
            <div>
              <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-1">Submitted</div>
              <div className="text-sm text-[#e2e8f0]">
                {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>

          {s.rating && (
            <div className="mt-4 flex items-center gap-4 pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#334155]">Risk tier:</span>
                <span className="text-xs font-semibold text-white">{s.rating.tier_label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#334155]">Risk score:</span>
                <span className="text-xs font-semibold text-white tabular-nums">{s.rating.risk_score}/100</span>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Link href={`/underwriting/${s.submission_id}`}
              className="text-xs font-medium text-[#b84dff] hover:text-[#6C63FF] transition-colors flex items-center gap-1">
              Full review →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
