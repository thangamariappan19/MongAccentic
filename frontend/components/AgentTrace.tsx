import type { AgentStep } from "@/lib/api";

const AGENT_META: Record<string, { label: string; color: string; hex: string; step: number }> = {
  orchestrator:       { label: "Orchestrator",       color: "border-[#334155]",      hex: "#475569", step: 0 },
  fraud_detection:    { label: "Fraud Detection",    color: "border-red-500/40",     hex: "#ef4444", step: 2 },
  policy_matching:    { label: "Policy Matching",    color: "border-blue-500/40",    hex: "#3b82f6", step: 2 },
  ring_detection:     { label: "Ring Detection",     color: "border-red-400/40",     hex: "#f87171", step: 2 },
  risk_assessment:    { label: "Risk Assessment",    color: "border-amber-500/40",   hex: "#f59e0b", step: 3 },
  decision_maker:     { label: "Decision Maker",     color: "border-[#A100FF]/40",   hex: "#A100FF", step: 4 },
  financial_advisory: { label: "Financial Advisory", color: "border-emerald-500/40", hex: "#10b981", step: 5 },
  audit_writer:       { label: "Audit Writer",       color: "border-sky-500/40",     hex: "#38bdf8", step: 6 },
};

const METHOD_BADGES: Record<string, { label: string; color: string }> = {
  aws_bedrock_claude:          { label: "AWS Bedrock", color: "#f59e0b" },
  mongodb_atlas_vector_search: { label: "Vector Search", color: "#10b981" },
  rule_based_fallback:         { label: "Rule-based", color: "#475569" },
  simulation_fallback:         { label: "Simulation", color: "#475569" },
};

export default function AgentTrace({ steps }: { steps: AgentStep[] }) {
  if (!steps || steps.length === 0) return null;

  const totalMs = steps.reduce((s, t) => s + (t.duration_ms ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-[#334155]">{steps.length} agents executed</div>
        {totalMs > 0 && (
          <div className="text-[10px] font-semibold" style={{ color: "#A100FF" }}>
            ⚡ {totalMs}ms total · vs 21-day industry average
          </div>
        )}
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => {
          const meta = AGENT_META[step.agent_name] ?? { label: step.agent_name, color: "border-[#334155]", hex: "#475569", step: i };
          const method = (step.result?.["analysis_method"] as string) ?? (step.result?.["search_method"] as string);
          const methodBadge = method ? METHOD_BADGES[method] : null;

          return (
            <div key={i} className={`border-l-2 ${meta.color} rounded-r-xl px-4 py-3`} style={{ background: "#ffffff04" }}>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-white">{meta.label}</span>
                  <StatusDot status={step.status} />
                  {methodBadge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: `${methodBadge.color}15`, color: methodBadge.color, border: `1px solid ${methodBadge.color}25` }}>
                      {methodBadge.label}
                    </span>
                  )}
                </div>
                {step.duration_ms != null && step.duration_ms > 0 && (
                  <span className="text-[9px] text-[#334155] tabular-nums">{step.duration_ms}ms</span>
                )}
              </div>
              {step.result && <ResultDetail agentName={step.agent_name} result={step.result} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    done:    { color: "#10b981", label: "Done" },
    running: { color: "#A100FF", label: "Running" },
    failed:  { color: "#ef4444", label: "Failed" },
    pending: { color: "#334155", label: "Pending" },
  };
  const c = cfg[status] ?? cfg["pending"];
  return (
    <span className="flex items-center gap-1 text-[9px]" style={{ color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

function ResultDetail({ agentName, result }: { agentName: string; result: Record<string, unknown> }) {
  const Row = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div className="flex items-start gap-2 text-[10px]">
      <span className="text-[#334155] shrink-0 w-24">{label}</span>
      <span className="font-medium" style={color ? { color } : { color: "#94a3b8" }}>{value}</span>
    </div>
  );

  if (agentName === "fraud_detection") {
    const score = Number(result.fraud_score ?? 0);
    const scoreColor = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#10b981";
    return (
      <div className="space-y-1">
        <Row label="Fraud Score" value={`${score}/100`} color={scoreColor} />
        {Array.isArray(result.signals) && result.signals.length > 0 && (
          <Row label="Signals" value={(result.signals as string[]).join(" · ")} color="#ef4444" />
        )}
        {result.reasoning && <Row label="Reasoning" value={String(result.reasoning)} />}
      </div>
    );
  }

  if (agentName === "policy_matching") {
    const sim = typeof result.similarity_score === "number" ? `${(result.similarity_score * 100).toFixed(0)}% cosine match` : "";
    return (
      <div className="space-y-1">
        <Row label="Policy" value={String(result.policy_title ?? "—")} color="#3b82f6" />
        <Row label="Covered" value={result.covered ? `Yes${sim ? " · " + sim : ""}` : "No"} color={result.covered ? "#10b981" : "#ef4444"} />
        {result.coverage_detail && <Row label="Detail" value={String(result.coverage_detail)} />}
        {result.search_method && <Row label="Method" value={String(result.search_method).replace(/_/g, " ")} />}
      </div>
    );
  }

  if (agentName === "ring_detection") {
    return (
      <div className="space-y-1">
        <Row label="Ring Detected" value={result.ring_detected ? "YES — Fraud Ring Found" : "No ring linked"} color={result.ring_detected ? "#ef4444" : "#10b981"} />
        {result.ring_detected && <>
          <Row label="Ring ID" value={String(result.ring_id)} color="#f87171" />
          {Array.isArray(result.connected_claims) && result.connected_claims.length > 0 && (
            <Row label="Linked Claims" value={(result.connected_claims as string[]).join(", ")} color="#fca5a5" />
          )}
        </>}
      </div>
    );
  }

  if (agentName === "risk_assessment") {
    const level = String(result.risk_level ?? "MEDIUM");
    const rColor = level === "HIGH" ? "#ef4444" : level === "MEDIUM" ? "#f59e0b" : "#10b981";
    return (
      <div className="space-y-1">
        <Row label="Risk Level" value={level} color={rColor} />
        <Row label="Risk Score" value={`${result.risk_score ?? "—"}/100`} color={rColor} />
        {Array.isArray(result.missing_documents) && result.missing_documents.length > 0 && (
          <Row label="Missing Docs" value={(result.missing_documents as string[]).join(", ")} color="#f59e0b" />
        )}
      </div>
    );
  }

  if (agentName === "decision_maker") {
    const conf = result.confidence ? `${(Number(result.confidence) * 100).toFixed(0)}%` : "—";
    return (
      <div className="space-y-1">
        <Row label="Verdict" value={String(result.verdict ?? "—").replace(/_/g, " ")} color="#A100FF" />
        <Row label="Confidence" value={conf} color="#b84dff" />
        {result.settlement_amount && <Row label="Settlement" value={`$${Number(result.settlement_amount).toLocaleString()}`} color="#10b981" />}
        {result.reasoning && <Row label="Reasoning" value={String(result.reasoning)} />}
      </div>
    );
  }

  if (agentName === "financial_advisory") {
    return (
      <div className="space-y-1">
        <Row label="Coverage" value={String(result.coverage_adequacy ?? "—").replace(/_/g, " ")} color={result.coverage_adequacy === "adequate" ? "#10b981" : "#f59e0b"} />
        <Row label="Premium Adj" value={String(result.premium_adjustment ?? "—")} color="#94a3b8" />
        {result.settlement_action && <Row label="Settlement" value={String(result.settlement_action)} color="#38bdf8" />}
      </div>
    );
  }

  if (agentName === "audit_writer") {
    return (
      <div className="space-y-1">
        <Row label="Audit ID" value={String(result.audit_id ?? "—")} color="#38bdf8" />
        <Row label="Status" value="Immutable record written to MongoDB" color="#10b981" />
      </div>
    );
  }

  return (
    <div className="text-[10px] text-[#475569]">
      {result.message ? String(result.message) : "Completed"}
    </div>
  );
}
