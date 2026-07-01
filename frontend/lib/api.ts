const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/^http/, "ws");

export type ClaimType = "motor" | "health" | "life" | "motor_theft";
export type Verdict = "approved" | "flagged" | "rejected" | "pending_docs" | "escalated" | "processing";

export interface AgentStep {
  agent_name: string;
  status: "pending" | "running" | "done" | "failed";
  result?: Record<string, unknown>;
  duration_ms?: number;
}

export interface Decision {
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  fraud_score: number;
  policy_match?: string;
  policy_similarity?: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  settlement_amount?: number;
  missing_documents?: string[];
  ring_detected?: boolean;
  ring_id?: string;
  connected_claims?: string[];
}

export interface Advisory {
  coverage_adequacy: "adequate" | "underinsured" | "severely_underinsured" | "unknown";
  coverage_gap: number;
  optimal_coverage: number;
  recommended_add_ons: string[];
  risk_mitigation: string[];
  base_premium: number;
  premium_adjustment: string;
  premium_reason: string;
  settlement_recommendation: string;
  settlement_action: "approve" | "hold" | "pending" | "escalate";
  portfolio_context?: { similar_claims_90d: number; avg_claim_amount: number; vs_average_pct: number };
  confidence: number;
}

export interface Claim {
  claim_id: string;
  status: Verdict;
  claimant_name: string;
  claim_type: ClaimType;
  amount: number;
  agent_trace: AgentStep[];
  decision?: Decision;
  advisory?: Advisory;
  created_at: string;
  updated_at: string;
}

export interface ClaimListItem {
  claim_id: string;
  claimant_name: string;
  claim_type: ClaimType;
  amount: number;
  status: Verdict;
  fraud_score?: number;
  created_at: string;
}

export interface Analytics {
  total_claims: number;
  approved: number;
  flagged: number;
  escalated: number;
  pending_docs: number;
  avg_fraud_score: number;
  avg_processing_ms: number;
  by_type: Record<string, number>;
  ring_count: number;
  high_risk_count: number;
}

export interface FraudRing {
  ring_id: string;
  claim_ids: string[];
  signals: string[];
  detected_at: string;
  last_updated: string;
  risk_score: number;
  claim_type: string;
}

export interface TypeAdvisory {
  claim_type: string;
  count: number;
  total_value: number;
  avg_amount: number;
  avg_fraud_score: number;
  approval_rate: number;
  flagged_count: number;
  optimal_coverage: number;
  recommended_add_ons: string[];
  risk_mitigation: string[];
  premium_factor: number;
}

export interface PortfolioAdvisory {
  total_exposure: number;
  high_risk_claims: number;
  active_rings: number;
  by_type: TypeAdvisory[];
}

export interface ClaimSubmit {
  claimant_name: string;
  claim_type: ClaimType;
  description: string;
  amount: number;
  language?: string;
  documents_provided?: string[];
}

export interface LiveEvent {
  type: "claim_processing" | "claim_processed" | "claim_override" | "ping";
  claim_id?: string;
  claimant_name?: string;
  amount?: number;
  claim_type?: string;
  status?: string;
  fraud_score?: number;
  ring_detected?: boolean;
  ring_id?: string;
  adjuster_id?: string;
  new_status?: string;
  timestamp?: string;
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store", ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `API ${path} failed: ${res.status}`);
  }
  return res.json();
}

export const fetchClaims = (status?: string) =>
  apiFetch<ClaimListItem[]>(`/api/claims${status ? `?status=${status}` : ""}`);

export const fetchClaim = (id: string) => apiFetch<Claim>(`/api/claims/${id}`);

export const fetchAnalytics = () => apiFetch<Analytics>("/api/analytics");

export const fetchFraudRings = () =>
  apiFetch<FraudRing[]>("/api/fraud-rings").catch(() => [] as FraudRing[]);

export const fetchClaimRing = (claimId: string) =>
  apiFetch<FraudRing & { ring_detected: boolean }>(`/api/claims/${claimId}/ring`)
    .then((r) => (r.ring_detected === false ? null : r))
    .catch(() => null);

export const fetchPortfolioAdvisory = () => apiFetch<PortfolioAdvisory>("/api/advisory");

export const submitClaim = (data: ClaimSubmit) =>
  apiFetch<Claim>("/api/claims", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const overrideClaim = (
  claimId: string, adjuster_id: string, verdict: Verdict, reasoning: string
) => apiFetch(`/api/claims/${claimId}/override`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ adjuster_id, verdict, reasoning }),
});

// ── Underwriting Types ────────────────────────────────────────────────────────

export type LOB = "commercial_property" | "general_liability" | "workers_comp" | "cyber";
export type SubmissionStatus =
  | "needs_review" | "ready_to_rate" | "rating_complete"
  | "approved" | "declined" | "pending_info";

export interface ExtractedField {
  value: string | number | null;
  confidence: number;
  source: string;
  human_verified: boolean;
  required: boolean;
}

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  type: "text" | "number" | "select" | "date";
  options?: string[];
}

export interface RatingFactor {
  label: string;
  adjustment: number;
  type: "load" | "credit";
}

export interface UWRating {
  lob: string;
  lob_label: string;
  exposure_base: number;
  base_premium: number;
  factors: RatingFactor[];
  technical_premium: number;
  final_premium: number;
  risk_score: number;
  risk_tier: string;
  tier_label: string;
  coverage_limit: number;
  confidence: number;
  computed_at: string;
}

export interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
}

export interface Submission {
  submission_id: string;
  insured_name: string;
  broker_name: string;
  line_of_business: LOB;
  documents: string[];
  status: SubmissionStatus;
  extracted_fields: Record<string, ExtractedField>;
  field_definitions: FieldDefinition[];
  gap_analysis: {
    missing_required: { key: string; label: string; guidance: string }[];
    low_confidence_fields: { key: string; label: string; value: unknown; confidence: number }[];
    missing_count: number;
    low_confidence_count: number;
    complete_count: number;
    needs_human_review: boolean;
  };
  rating?: UWRating;
  decision?: { action: string; underwriter: string; notes: string; decided_at: string };
  audit_trail: AuditEntry[];
  agent_trace: { agent: string; status: string; duration_ms: number }[];
  created_at: string;
  updated_at: string;
}

export interface SubmissionsAnalytics {
  total: number;
  needs_review: number;
  ready_to_rate: number;
  rating_complete: number;
  approved: number;
  declined: number;
  by_lob: Record<string, number>;
}

export const createSubmission = (data: {
  insured_name: string; line_of_business: LOB;
  broker_name?: string; documents?: string[];
}) => apiFetch<Submission>("/api/submissions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export const fetchSubmissions = (status?: string) =>
  apiFetch<Submission[]>(`/api/submissions${status ? `?status=${status}` : ""}`);

export const fetchSubmission = (id: string) =>
  apiFetch<Submission>(`/api/submissions/${id}`);

export const updateSubmissionFields = (id: string, fields: Record<string, unknown>, updated_by = "Underwriter") =>
  apiFetch<Submission>(`/api/submissions/${id}/fields`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields, updated_by }),
  });

export const rateSubmission = (id: string) =>
  apiFetch<Submission>(`/api/submissions/${id}/rate`, { method: "POST" });

export const submissionDecision = (id: string, action: string, underwriter: string, notes: string) =>
  apiFetch(`/api/submissions/${id}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, underwriter, notes }),
  });

export const fetchSubmissionsAnalytics = () =>
  apiFetch<SubmissionsAnalytics>("/api/submissions-analytics").catch(() => null);

// ── IRDAI Regulatory Benchmark ────────────────────────────────────────────────

export interface IrdaiBenchmark {
  irdai: {
    source: string;
    report_url: string;
    fiscal_year: string;
    prev_fiscal_year?: string;
    market: {
      total_premium_usd_bn: number;
      life_premium_usd_bn: number;
      non_life_premium_usd_bn: number;
      insurance_penetration_gdp_pct: number;
      insurance_density_usd_per_capita: number;
      registered_insurers: number;
      market_growth_pct: number;
      prev_total_premium_usd_bn?: number;
      prev_growth_pct?: number;
      prev_density_usd_per_capita?: number;
    };
    claims: {
      life_settlement_ratio_pct: number;
      non_life_motor_ratio_pct: number;
      non_life_health_ratio_pct: number;
      non_life_overall_ratio_pct: number;
      avg_settlement_days_industry: number;
      avg_settlement_days_mandate: number;
      avg_settlement_days_health_cashless_mandate?: number;
      total_claims_paid_usd_bn: number;
      rejection_rate_pct: number;
    };
    fraud: {
      estimated_fraud_pct_of_claims: number;
      annual_fraud_loss_usd_bn: number;
      motor_fraud_pct: number;
      health_fraud_pct: number;
      life_fraud_pct: number;
      other_fraud_pct: number;
      avg_detection_time_days: number;
      current_detection_method: string;
      prev_annual_fraud_loss_usd_bn?: number;
    };
    grievances: {
      total_complaints_fy23: number;
      resolution_rate_pct: number;
      avg_resolution_days: number;
      yoy_change_pct?: number;
      prev_total_complaints?: number;
    };
    segments: {
      name: string;
      premium_share_pct: number;
      claim_ratio_pct: number;
      yoy_growth_pct: number;
      fraud_risk: string;
    }[];
    year_trend?: {
      year: string;
      total_premium_usd_bn: number;
      penetration_pct: number;
      growth_pct: number;
      estimated?: boolean;
      projected?: boolean;
    }[];
    projections_fy2526?: {
      fiscal_year: string;
      total_premium_usd_bn: number;
      insurance_penetration_gdp_pct: number;
      market_growth_pct: number;
      note: string;
    };
    global_context?: {
      global_market_usd_t: number;
      india_share_pct: number;
      global_penetration_pct: number;
      global_density_usd: number;
      global_fraud_pct: number;
      global_avg_processing_days: number;
      india_rank_by_premium?: number;
      india_target_2030_usd_bn?: number;
    };
    regulatory_updates?: {
      title: string;
      year: number;
      description: string;
      impact: string;
    }[];
  };
  our_platform: {
    total_claims: number;
    approved: number;
    flagged: number;
    avg_processing_ms: number;
  };
  comparison: {
    processing: { industry_label: string; ours_label: string; improvement_label: string; improvement_pct: number };
    settlement: { industry_pct: number; ours_pct: number; gap: number };
    fraud_detection: { industry_method: string; industry_detection_days: number; ours_method: string; our_flagging_rate_pct: number; industry_estimate_pct: number };
    manual_effort: { industry_steps: number; ours_label: string; improvement: string };
    compliance: { irdai_mandate_days: number; ours_seconds: number; mandate_met: boolean; margin_pct: number };
  };
  live_signal: { live_fetch: boolean; portal_reachable: boolean; portal_checked_at?: string; live_records?: Record<string, unknown> | null };
  cached_at: string;
  from_cache: boolean;
}

export const fetchIrdaiBenchmark = () =>
  apiFetch<IrdaiBenchmark>("/api/irdai-benchmark");

export function createLiveSocket(onEvent: (e: LiveEvent) => void): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/live`);
  ws.onmessage = (e) => { try { onEvent(JSON.parse(e.data)); } catch {} };
  return ws;
}
