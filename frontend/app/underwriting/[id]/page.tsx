"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchSubmission, updateSubmissionFields, rateSubmission, submissionDecision,
  type Submission, type FieldDefinition, type ExtractedField,
} from "@/lib/api";

type Tab = "fields" | "rating" | "trace";

const LOB_META: Record<string, { icon: string; label: string }> = {
  commercial_property: { icon: "🏢", label: "Commercial Property" },
  general_liability:   { icon: "⚖️", label: "General Liability" },
  workers_comp:        { icon: "👷", label: "Workers Comp" },
  cyber:               { icon: "🔒", label: "Cyber" },
};

const STATUS_META: Record<string, { label: string; badge: string }> = {
  needs_review:    { label: "Needs Review",    badge: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
  ready_to_rate:   { label: "Ready to Rate",   badge: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  rating_complete: { label: "Rating Complete", badge: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
  approved:        { label: "Approved",        badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  declined:        { label: "Declined",        badge: "bg-red-500/10 border-red-500/20 text-red-400" },
  pending_info:    { label: "Pending Info",    badge: "bg-gray-500/10 border-gray-500/20 text-gray-400" },
};

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sub, setSub] = useState<Submission | null>(null);
  const [tab, setTab] = useState<Tab>("fields");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [showDecision, setShowDecision] = useState(false);

  useEffect(() => {
    fetchSubmission(id).then((s) => {
      setSub(s);
      // Pre-fill form with existing values
      const vals: Record<string, string> = {};
      for (const [key, entry] of Object.entries(s.extracted_fields)) {
        if (entry.value !== null && entry.value !== undefined) {
          vals[key] = String(entry.value);
        }
      }
      setFieldValues(vals);
    });
  }, [id]);

  async function handleSaveFields() {
    if (!sub) return;
    setSaving(true);
    try {
      const changed: Record<string, unknown> = {};
      for (const fd of sub.field_definitions) {
        const key = fd.key;
        const current = sub.extracted_fields[key];
        const newVal = fieldValues[key];
        if (!current || current.value === null || !current.human_verified) {
          if (newVal !== undefined && newVal !== "") {
            changed[key] = fd.type === "number" ? parseFloat(newVal) : newVal;
          }
        }
      }
      const updated = await updateSubmissionFields(id, changed, "Underwriter");
      setSub(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleRate() {
    if (!sub) return;
    setRating(true);
    try {
      const updated = await rateSubmission(id);
      setSub(updated);
      setTab("rating");
    } finally {
      setRating(false);
    }
  }

  async function handleDecision(action: string) {
    setDeciding(true);
    try {
      await submissionDecision(id, action, "Sarah Johnson (UW-001)", decisionNotes);
      const updated = await fetchSubmission(id);
      setSub(updated);
      setShowDecision(false);
      setDecisionNotes("");
    } finally {
      setDeciding(false);
    }
  }

  if (!sub) return <LoadingSkeleton />;

  const lob = LOB_META[sub.line_of_business] ?? { icon: "📄", label: sub.line_of_business };
  const st = STATUS_META[sub.status] ?? { label: sub.status, badge: "bg-gray-500/10 border-gray-500/20 text-gray-400" };
  const missing = sub.gap_analysis?.missing_count ?? 0;
  const lowConf = sub.gap_analysis?.low_confidence_count ?? 0;
  const complete = sub.gap_analysis?.complete_count ?? 0;
  const total = sub.field_definitions?.length ?? 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/underwriting" className="text-[#4b5563] hover:text-[#9ca3af] text-xs">← Underwriting</Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl font-bold text-white font-mono">{sub.submission_id}</h1>
            <span className={`text-[11px] font-medium border rounded-full px-2.5 py-1 ${st.badge}`}>{st.label}</span>
          </div>
          <p className="text-[#6b7280] text-sm mt-0.5">
            {lob.icon} {sub.insured_name} · {lob.label}
            {sub.broker_name && <span className="ml-2 text-[#374151]">via {sub.broker_name}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(sub.status === "rating_complete" || sub.status === "approved") && !sub.decision && (
            <button
              onClick={() => setShowDecision(true)}
              className="bg-[#8900d9] hover:bg-[#A100FF] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Make Decision
            </button>
          )}
          {sub.status === "ready_to_rate" && !sub.rating && (
            <button
              onClick={handleRate}
              disabled={rating}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              {rating ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Computing…</> : "💰 Run Rating Engine"}
            </button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        <MiniStat label="Total Fields" value={total} color="gray" />
        <MiniStat label="Extracted" value={complete} color="green" />
        <MiniStat label="Low Confidence" value={lowConf} color="amber" />
        <MiniStat label="Missing Required" value={missing} color="red" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] pb-0">
        {(["fields", "rating", "trace"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-[#A100FF] text-[#b84dff]"
                : "border-transparent text-[#6b7280] hover:text-[#d1d5db]"
            }`}
          >
            {t === "fields" ? "Fields" : t === "rating" ? "Rating" : "Audit Trail"}
          </button>
        ))}
      </div>

      {/* Fields Tab */}
      {tab === "fields" && (
        <div className="space-y-4">
          {missing > 0 && (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
              <span className="text-amber-400 text-lg shrink-0">⚠️</span>
              <div>
                <div className="text-amber-400 font-semibold text-sm">{missing} required field{missing !== 1 ? "s" : ""} need your input</div>
                <div className="text-[#6b7280] text-xs mt-0.5">Fill in the missing fields below and click Save, then run the rating engine.</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sub.field_definitions.map((fd) => {
              const entry = sub.extracted_fields[fd.key];
              return (
                <FieldCard
                  key={fd.key}
                  fd={fd}
                  entry={entry}
                  value={fieldValues[fd.key] ?? ""}
                  onChange={(v) => setFieldValues((prev) => ({ ...prev, [fd.key]: v }))}
                />
              );
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveFields}
              disabled={saving}
              className="flex-1 bg-[#0f1015] hover:bg-white/[0.04] border border-white/[0.07] text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : "💾 Save Changes"}
            </button>
            {(sub.status === "needs_review" || sub.status === "ready_to_rate") && (
              <button
                onClick={handleRate}
                disabled={rating || missing > 0}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {rating ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Computing…</> : "💰 Save & Rate Submission"}
              </button>
            )}
          </div>
          {missing > 0 && (
            <p className="text-[11px] text-[#4b5563] text-center">Complete all required fields to enable rating</p>
          )}
        </div>
      )}

      {/* Rating Tab */}
      {tab === "rating" && (
        <div className="space-y-4">
          {!sub.rating ? (
            <div className="bg-[#0f1015] border border-white/[0.07] rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">💰</div>
              <div className="text-white font-semibold mb-1">No rating yet</div>
              <div className="text-[#4b5563] text-sm mb-4">Complete all required fields, then run the rating engine</div>
              <button
                onClick={handleRate}
                disabled={rating || missing > 0}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Run Rating Engine →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Risk score + premium */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0f1015] border border-white/[0.07] rounded-2xl p-5 text-center">
                  <RiskGauge score={sub.rating.risk_score} />
                  <div className="text-xs text-[#4b5563] mt-2">Risk Score</div>
                </div>
                <div className="bg-[#0f1015] border border-white/[0.07] rounded-2xl p-5 text-center flex flex-col justify-center">
                  <div className="text-3xl font-bold text-white tabular-nums">${sub.rating.final_premium.toLocaleString()}</div>
                  <div className="text-xs text-[#4b5563] mt-1">Indicative Annual Premium</div>
                  <div className="text-[11px] text-[#374151] mt-1">Limit: ${sub.rating.coverage_limit.toLocaleString()}</div>
                </div>
                <div className="bg-[#0f1015] border border-white/[0.07] rounded-2xl p-5 text-center flex flex-col justify-center">
                  <div className="text-4xl font-bold text-white">{sub.rating.risk_tier}</div>
                  <div className="text-xs text-[#4b5563] mt-1">Risk Tier</div>
                  <div className={`text-[11px] mt-1 font-medium ${
                    sub.rating.risk_tier === "A" ? "text-emerald-400" :
                    sub.rating.risk_tier === "B" ? "text-blue-400" :
                    sub.rating.risk_tier === "C" ? "text-amber-400" : "text-red-400"
                  }`}>{sub.rating.tier_label}</div>
                </div>
              </div>

              {/* Premium breakdown */}
              <div className="bg-[#0f1015] border border-white/[0.07] rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4">Premium Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm py-2 border-b border-white/[0.04]">
                    <span className="text-[#9ca3af]">Base premium ({sub.rating.lob_label})</span>
                    <span className="text-white font-semibold tabular-nums">${sub.rating.base_premium.toLocaleString()}</span>
                  </div>
                  {sub.rating.factors.map((f, i) => (
                    <div key={i} className="flex justify-between items-center text-sm py-1.5">
                      <span className={`text-xs flex items-center gap-1.5 ${f.type === "credit" ? "text-emerald-400" : "text-[#9ca3af]"}`}>
                        <span>{f.type === "credit" ? "↓" : "↑"}</span>
                        {f.label}
                      </span>
                      <span className={`font-semibold tabular-nums text-xs ${f.type === "credit" ? "text-emerald-400" : "text-amber-400"}`}>
                        {f.adjustment >= 0 ? "+" : ""}${f.adjustment.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm pt-3 border-t border-white/[0.08] mt-2">
                    <span className="font-bold text-white">Indicative Annual Premium</span>
                    <span className="font-bold text-[#b84dff] text-base tabular-nums">${sub.rating.final_premium.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Decision */}
              {sub.decision ? (
                <div className={`rounded-2xl border p-5 ${
                  sub.decision.action === "approved" ? "bg-emerald-500/8 border-emerald-500/20" :
                  sub.decision.action === "declined" ? "bg-red-500/8 border-red-500/20" :
                  "bg-amber-500/8 border-amber-500/20"
                }`}>
                  <div className="text-sm font-bold text-white capitalize mb-1">
                    Decision: {sub.decision.action}
                  </div>
                  <div className="text-xs text-[#9ca3af]">By {sub.decision.underwriter}</div>
                  {sub.decision.notes && <div className="text-xs text-[#6b7280] mt-2 italic">{sub.decision.notes}</div>}
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => { setShowDecision(true); }} className="flex-1 bg-[#8900d9] hover:bg-[#A100FF] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">Approve →</button>
                  <button onClick={() => handleDecision("pending_info")} className="flex-1 border border-amber-500/30 text-amber-400 hover:bg-amber-500/8 py-2.5 rounded-lg text-sm font-medium transition-colors">Request Info</button>
                  <button onClick={() => handleDecision("declined")} className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/8 py-2.5 rounded-lg text-sm font-medium transition-colors">Decline</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Audit Trail Tab */}
      {tab === "trace" && (
        <div className="space-y-2">
          <div className="text-xs text-[#4b5563] mb-4">
            Complete audit trail of every agent action and human modification — stored in MongoDB for regulatory compliance
          </div>
          {sub.audit_trail.length === 0 ? (
            <div className="text-center py-8 text-[#374151] text-sm">No audit entries yet</div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-white/[0.06]" />
              <div className="space-y-4 pl-10">
                {sub.audit_trail.map((entry, i) => {
                  const isHuman = !entry.actor.includes("Agent") && !entry.actor.includes("Engine");
                  return (
                    <div key={i} className="relative">
                      <div className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 ${
                        isHuman ? "bg-blue-500 border-blue-600" : "bg-[#A100FF] border-[#8900d9]"
                      }`} />
                      <div className="bg-[#0f1015] border border-white/[0.06] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-semibold ${isHuman ? "text-blue-400" : "text-[#b84dff]"}`}>
                            {entry.actor}
                          </span>
                          <span className="text-[10px] text-[#374151] tabular-nums">
                            {new Date(entry.timestamp).toLocaleString("en-US", {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="text-sm text-white font-medium">{entry.action}</div>
                        {entry.detail && <div className="text-xs text-[#6b7280] mt-1">{entry.detail}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decision Modal */}
      {showDecision && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1015] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-white font-bold">Underwriter Decision</h3>
            <div>
              <label className="text-xs text-[#6b7280] block mb-1">Decision Notes (optional)</label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Add any underwriting notes or conditions…"
                className="w-full bg-[#07080b] border border-white/[0.07] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#A100FF]/50 resize-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleDecision("approved")}
                disabled={deciding}
                className="bg-[#8900d9] hover:bg-[#A100FF] disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleDecision("pending_info")}
                disabled={deciding}
                className="border border-amber-500/30 text-amber-400 hover:bg-amber-500/8 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ⏳ Pend
              </button>
              <button
                onClick={() => handleDecision("declined")}
                disabled={deciding}
                className="border border-red-500/30 text-red-400 hover:bg-red-500/8 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ✗ Decline
              </button>
            </div>
            <button
              onClick={() => setShowDecision(false)}
              className="w-full text-[#4b5563] hover:text-[#9ca3af] text-sm py-1 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldCard({ fd, entry, value, onChange }: {
  fd: FieldDefinition;
  entry?: ExtractedField;
  value: string;
  onChange: (v: string) => void;
}) {
  const conf = entry?.confidence ?? 0;
  const hasValue = entry?.value !== null && entry?.value !== undefined;
  const isHumanVerified = entry?.human_verified;

  const confBadge = isHumanVerified
    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
    : conf >= 0.8
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    : conf >= 0.5
    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
    : "bg-red-500/10 border-red-500/20 text-red-400";

  const confLabel = isHumanVerified ? "Human verified" : conf >= 0.8 ? `${Math.round(conf * 100)}% confidence` : conf > 0 ? `${Math.round(conf * 100)}% — verify` : "Missing";

  const borderColor = !hasValue && fd.required
    ? "border-red-500/30 bg-red-500/[0.02]"
    : conf < 0.75 && hasValue
    ? "border-amber-500/20"
    : "border-white/[0.07]";

  return (
    <div className={`bg-[#0f1015] border rounded-xl p-4 space-y-2 ${borderColor}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#d1d5db]">
          {fd.label}
          {fd.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${confBadge}`}>
          {confLabel}
        </span>
      </div>

      {fd.type === "select" && fd.options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#07080b] border border-white/[0.07] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#A100FF]/50"
        >
          <option value="">Select…</option>
          {fd.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={fd.type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={!hasValue ? `Enter ${fd.label.toLowerCase()}…` : undefined}
          className={`w-full bg-[#07080b] border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#A100FF]/50 transition-colors ${
            !hasValue && fd.required
              ? "border-red-500/30 text-[#9ca3af] placeholder-red-400/40"
              : "border-white/[0.07] text-white placeholder-[#374151]"
          }`}
        />
      )}

      {entry?.source && (
        <div className="text-[10px] text-[#374151] flex items-center gap-1">
          <span>📍</span>
          <span className="truncate">{entry.source}</span>
        </div>
      )}
      {!hasValue && fd.required && (
        <div className="text-[10px] text-red-400/70 flex items-center gap-1">
          <span>⚠️</span>
          <span>Required — not found in documents</span>
        </div>
      )}
    </div>
  );
}

function RiskGauge({ score }: { score: number }) {
  const color = score < 40 ? "#10b981" : score < 65 ? "#3b82f6" : score < 80 ? "#f59e0b" : "#ef4444";
  const r = 40;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 60" className="w-32 h-20">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1f2028" strokeWidth="10" strokeLinecap="round" />
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} />
        <text x="50" y="48" textAnchor="middle" fill="white" fontSize="18" fontWeight="700">{score}</text>
      </svg>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  const palette: Record<string, string> = {
    gray:  "text-[#9ca3af] bg-white/[0.03] border-white/[0.06]",
    green: "text-emerald-400 bg-emerald-500/8 border-emerald-500/15",
    amber: "text-amber-400 bg-amber-500/8 border-amber-500/15",
    red:   "text-red-400 bg-red-500/8 border-red-500/15",
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${palette[color]}`}>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] mt-0.5 opacity-70">{label}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-5xl">
      <div className="h-7 w-48 bg-white/[0.06] rounded-lg" />
      <div className="grid grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-white/[0.04] rounded-xl" />)}</div>
      <div className="h-10 bg-white/[0.04] rounded-lg" />
      <div className="grid grid-cols-2 gap-3">{Array(8).fill(0).map((_, i) => <div key={i} className="h-24 bg-white/[0.04] rounded-xl" />)}</div>
    </div>
  );
}
