"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchClaim, fetchClaimRing, overrideClaim, type Claim, type FraudRing, type Verdict } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import AgentTrace from "@/components/AgentTrace";
import FraudRingGraph from "@/components/FraudRingGraph";

const VERDICT_STYLE: Record<string, { bg: string; text: string }> = {
  approved:     { bg: "#10b98115", text: "#10b981" },
  flagged:      { bg: "#ef444415", text: "#ef4444" },
  escalated:    { bg: "#A100FF15", text: "#A100FF" },
  pending_docs: { bg: "#f59e0b15", text: "#f59e0b" },
  rejected:     { bg: "#ef444415", text: "#ef4444" },
};

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [ring, setRing]   = useState<FraudRing | null>(null);
  const [loading, setLoading]     = useState(true);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideVerdict, setOverrideVerdict] = useState<Verdict>("approved");
  const [overrideReason, setOverrideReason]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchClaim(id), fetchClaimRing(id)])
      .then(([c, r]) => { setClaim(c); setRing(r); })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleOverride() {
    if (!overrideReason.trim() || !claim) return;
    setSubmitting(true);
    try {
      await overrideClaim(id, "ADJ-001", overrideVerdict, overrideReason);
      const updated = await fetchClaim(id);
      setClaim(updated);
      setOverrideOpen(false);
      setOverrideReason("");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-48 rounded bg-white/[0.05]" />
      <div className="h-64 rounded-xl bg-white/[0.04]" />
    </div>
  );

  if (!claim) return (
    <div className="text-center py-20 text-[#475569] text-sm">
      Claim not found.{" "}
      <Link href="/claims" className="text-[#A100FF] hover:underline">← Back to claims</Link>
    </div>
  );

  const d  = claim.decision;
  const vs = VERDICT_STYLE[d?.verdict ?? claim.status] ?? { bg: "#64748b15", text: "#64748b" };
  const totalAgentMs = claim.agent_trace.reduce((s, t) => s + (t.duration_ms ?? 0), 0);

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Breadcrumb + Header ───────────────────────────────────────────── */}
      <div>
        <Link href="/claims" className="text-xs text-[#334155] hover:text-[#64748b] transition-colors flex items-center gap-1 mb-3">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Chapter 3 — All Claims
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white font-mono">{claim.claim_id}</h1>
              <StatusBadge status={claim.status} />
              {totalAgentMs > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#A100FF15", color: "#A100FF", border: "1px solid #A100FF30" }}>
                  ⚡ {totalAgentMs}ms total
                </span>
              )}
            </div>
            <p className="text-sm text-[#475569] mt-1">
              {claim.claimant_name} · <span className="capitalize">{claim.claim_type.replace(/_/g, " ")}</span>
            </p>
          </div>
          <button onClick={() => setOverrideOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[#A100FF]/30 text-[#b84dff] hover:bg-[#A100FF]/10 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Human Override
          </button>
        </div>
      </div>

      {/* ── Human-in-the-Loop banner ─────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl" style={{ background: "#A100FF08", border: "1px solid #A100FF20" }}>
        <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#A100FF" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <div>
          <div className="text-xs font-semibold text-white">Human-in-the-Loop Governance</div>
          <p className="text-[11px] text-[#475569] mt-0.5 leading-relaxed">
            The AI made this decision automatically — but any adjuster can override it. Every override is logged with the adjuster ID, reason, and timestamp in an immutable audit trail. This ensures accountability without slowing down the process.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: decision + agent trace ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Claim basics */}
          <div className="surface rounded-xl p-5">
            <div className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-4">Claim Details</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Field label="Amount"   value={`$${claim.amount.toLocaleString()}`} bold />
              <Field label="Type"     value={claim.claim_type.replace(/_/g, " ")} capitalize />
              <Field label="Filed"    value={new Date(claim.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
              <Field label="Agents"   value={`${claim.agent_trace.length} ran`} />
            </div>
            {claim.agent_trace.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <div className="text-[10px] text-[#334155]">Documents provided:</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {((claim as unknown as Record<string, unknown>)["documents_provided"] as string[] ?? []).length > 0
                    ? ((claim as unknown as Record<string, unknown>)["documents_provided"] as string[]).map(d => (
                        <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#64748b]">{d}</span>
                      ))
                    : <span className="text-[10px] text-[#334155]">None provided</span>
                  }
                </div>
              </div>
            )}
          </div>

          {/* AI Decision */}
          {d && (
            <div className="surface rounded-xl p-5">
              <div className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-4">AI Decision</div>

              {/* Verdict banner */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4" style={{ background: vs.bg, border: `1px solid ${vs.text}25` }}>
                <div className="text-base font-bold capitalize" style={{ color: vs.text }}>{d.verdict.replace(/_/g, " ")}</div>
                <div className="text-xs text-[#64748b]">·</div>
                <div className="text-xs text-[#64748b]">{(d.confidence * 100).toFixed(0)}% confidence</div>
                {d.risk_level && (
                  <>
                    <div className="text-xs text-[#64748b]">·</div>
                    <div className="text-xs font-bold" style={{ color: d.risk_level === "HIGH" ? "#ef4444" : d.risk_level === "MEDIUM" ? "#f59e0b" : "#10b981" }}>
                      {d.risk_level} RISK
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <Field label="Policy Matched" value={d.policy_match ?? "—"} />
                {d.settlement_amount
                  ? <Field label="Settlement Amount" value={`$${d.settlement_amount.toLocaleString()}`} bold />
                  : <Field label="Settlement" value="On hold" />}
                {typeof d.policy_similarity === "number" && (
                  <Field label="Vector Similarity" value={`${(d.policy_similarity * 100).toFixed(0)}% cosine match`} />
                )}
                {d.ring_detected && (
                  <Field label="Fraud Ring" value={d.ring_id ?? "—"} accent="red" />
                )}
              </div>

              {/* Fraud score bar */}
              {d.fraud_score !== undefined && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[10px] text-[#334155] mb-1.5">
                    <span className="uppercase tracking-wider">Fraud Score</span>
                    <span className="font-bold" style={{ color: d.fraud_score >= 70 ? "#ef4444" : d.fraud_score >= 40 ? "#f59e0b" : "#10b981" }}>
                      {d.fraud_score}/100
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${d.fraud_score}%`, background: d.fraud_score >= 70 ? "#ef4444" : d.fraud_score >= 40 ? "#f59e0b" : "#10b981" }} />
                  </div>
                </div>
              )}

              {/* Reasoning */}
              <div>
                <div className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-1.5">AI Reasoning</div>
                <p className="text-xs text-[#94a3b8] leading-relaxed px-3 py-2.5 rounded-lg" style={{ background: "#ffffff05", border: "1px solid #ffffff06" }}>
                  {d.reasoning}
                </p>
              </div>

              {/* Missing docs */}
              {d.missing_documents && d.missing_documents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.04]">
                  <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">Documents Needed to Proceed</div>
                  <div className="flex flex-wrap gap-1.5">
                    {d.missing_documents.map(doc => (
                      <span key={doc} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/[0.07] border border-amber-500/20 text-amber-400">{doc}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Agent Trace */}
          <div className="surface rounded-xl p-5">
            <div className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-1">Agent Pipeline Trace</div>
            <p className="text-[10px] text-[#1e2a3a] mb-4">Step-by-step log of every AI agent that processed this claim</p>
            <AgentTrace steps={claim.agent_trace} />
          </div>
        </div>

        {/* ── Right: fraud score + MongoDB features + ring ─────────────── */}
        <div className="space-y-4">

          {/* MongoDB tech used */}
          <div className="surface rounded-xl p-5">
            <div className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-3">MongoDB Features Used</div>
            <div className="space-y-2">
              {[
                { label: "Atlas Vector Search",        desc: "Policy matched semantically",  color: "#10b981", ok: true },
                { label: "LangGraph Checkpointing",    desc: "Agent state persisted",         color: "#A100FF", ok: true },
                { label: "Immutable Audit Trail",      desc: "Compliance record written",     color: "#3b82f6", ok: true },
                { label: "Agent Memory",               desc: "Ring patterns tracked",         color: "#f59e0b", ok: true },
                { label: "Fraud Ring Linked",          desc: ring ? ring.ring_id : "No ring", color: ring ? "#ef4444" : "#334155", ok: !!ring },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: f.color }} />
                  <div className="flex-1">
                    <div className="text-[11px] font-medium text-white">{f.label}</div>
                    <div className="text-[9px] text-[#334155]">{f.desc}</div>
                  </div>
                  {f.ok && (
                    <svg className="w-3 h-3 shrink-0" style={{ color: f.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fraud Ring */}
          {ring && <FraudRingGraph ring={ring} />}

          {/* Next step CTA */}
          <div className="surface rounded-xl p-4">
            <div className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-3">Continue Demo</div>
            <div className="space-y-2">
              <Link href="/rings" className="flex items-center gap-2 text-xs text-[#64748b] hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/[0.03]">
                <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center" style={{ background: "#ef444415", color: "#ef4444" }}>4</span>
                Fraud Rings → Chapter 4
              </Link>
              <Link href="/advisory" className="flex items-center gap-2 text-xs text-[#64748b] hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/[0.03]">
                <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center" style={{ background: "#A100FF15", color: "#A100FF" }}>5</span>
                AI Intelligence → Chapter 5
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Human Override Modal ─────────────────────────────────────────── */}
      {overrideOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: "#0d0f14", border: "1px solid #A100FF30" }}>
            <div>
              <div className="text-base font-semibold text-white">Human Override</div>
              <p className="text-xs text-[#475569] mt-1">
                Your override will be logged with your adjuster ID, timestamp, and reason — visible in the immutable audit trail.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-1.5 block">New Verdict</label>
              <select value={overrideVerdict} onChange={(e) => setOverrideVerdict(e.target.value as Verdict)}
                className="w-full rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#A100FF]/50 border"
                style={{ background: "#06070a", borderColor: "#ffffff0d" }}>
                <option value="approved">Approved</option>
                <option value="flagged">Flagged for Review</option>
                <option value="rejected">Rejected</option>
                <option value="escalated">Escalated to Senior Adjuster</option>
                <option value="pending_docs">Pending Documents</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-1.5 block">Reason for Override</label>
              <textarea rows={3} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why you are overriding the AI decision…"
                className="w-full rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none border placeholder-[#334155]"
                style={{ background: "#06070a", borderColor: "#ffffff0d" }} />
            </div>

            <div className="flex gap-3">
              <button onClick={handleOverride} disabled={submitting || !overrideReason.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-colors"
                style={{ background: "#A100FF" }}
                onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = "#8900d9"; }}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#A100FF"}>
                {submitting ? "Saving…" : "Confirm Override"}
              </button>
              <button onClick={() => setOverrideOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#64748b] hover:text-white border border-white/[0.06] hover:border-white/10 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, bold, capitalize, accent }: {
  label: string; value: string; bold?: boolean; capitalize?: boolean; accent?: "red";
}) {
  return (
    <div>
      <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-sm ${bold ? "font-bold text-white" : accent === "red" ? "text-red-400 font-mono font-medium" : "text-[#94a3b8]"} ${capitalize ? "capitalize" : ""}`}>
        {value}
      </div>
    </div>
  );
}
