# MongAccentic — Architecture & Summary Report

**Team:** MongAccentic | **Track:** Track 2 — Agentic AI for Financial Services  
**Version:** 2.0.0 | **Generated:** 2026-06-30

---

## 1. High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND  (Next.js 16 / React 19 / TypeScript)       │
│                                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │Dashboard │  │  Submit  │  │  Claims  │  │  Rings   │  │Advisory  │           │
│  │  /       │  │ /submit  │  │/claims   │  │ /rings   │  │/advisory │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│  ┌──────────────────────────┐  ┌────────────────────────┐                        │
│  │  Underwriting            │  │  IRDAI Benchmark        │                        │
│  │  /underwriting/**        │  │  /benchmark             │                        │
│  └──────────────────────────┘  └────────────────────────┘                        │
│                                                                                    │
│  lib/api.ts ─── REST (fetch) ──────────────┐                                     │
│  LiveFeed  ─── WebSocket (/ws/live) ───────┤                                     │
└────────────────────────────────────────────┼─────────────────────────────────────┘
                                             │ HTTP / WS
┌────────────────────────────────────────────▼─────────────────────────────────────┐
│                            BACKEND  (Python FastAPI)                               │
│                                                                                    │
│  REST API Endpoints                                                                │
│  ┌────────────────────────────────────────────────────────────────┐               │
│  │  POST /api/claims          GET  /api/claims/{id}               │               │
│  │  GET  /api/claims          POST /api/claims/{id}/override       │               │
│  │  GET  /api/analytics       GET  /api/fraud-rings               │               │
│  │  GET  /api/advisory        GET  /api/irdai-benchmark           │               │
│  │  POST /api/submissions     GET/PUT /api/submissions/{id}        │               │
│  │  POST /api/submissions/{id}/rate  /decision /fields            │               │
│  │  WS   /ws/live  (live event broadcast)                         │               │
│  └─────────────────────────────┬──────────────────────────────────┘               │
│                                 │                                                  │
│                    ┌────────────▼────────────┐                                    │
│                    │  LangGraph Orchestrator  │                                    │
│                    │  (StateGraph Pipeline)   │                                    │
│                    └────────────┬────────────┘                                    │
│                                 │                                                  │
│           ┌─────────────────────▼─────────────────────┐                          │
│           │           STAGE 1 · Parallel Check          │                          │
│           │  ┌─────────────┐ ┌───────────┐ ┌────────┐  │                          │
│           │  │Fraud Agent  │ │Policy     │ │Ring    │  │                          │
│           │  │(Bedrock/    │ │Agent      │ │Agent   │  │                          │
│           │  │ Rule-based) │ │(VoyageAI/ │ │(Mongo  │  │                          │
│           │  │             │ │Rule-based)│ │pattern)│  │                          │
│           │  └─────────────┘ └───────────┘ └────────┘  │                          │
│           └─────────────────────┬─────────────────────┘                          │
│                                 │                                                  │
│                    ┌────────────▼────────────┐                                    │
│                    │  STAGE 2 · Risk Agent    │                                    │
│                    │  (rule-based scoring)    │                                    │
│                    └────────────┬────────────┘                                    │
│                                 │                                                  │
│                    ┌────────────▼────────────┐                                    │
│                    │  STAGE 3 · Decision Maker│                                    │
│                    │  (verdict engine)        │                                    │
│                    └────────────┬────────────┘                                    │
│                                 │                                                  │
│                    ┌────────────▼────────────┐                                    │
│                    │  STAGE 4 · Advisory Agent│                                    │
│                    │  (financial advisory)    │                                    │
│                    └────────────┬────────────┘                                    │
│                                 │                                                  │
│                    ┌────────────▼────────────┐                                    │
│                    │  STAGE 5 · Audit Agent   │                                    │
│                    │  (immutable audit trail) │                                    │
│                    └────────────┬────────────┘                                    │
│                                 │                                                  │
│  Underwriting Sub-Pipeline (separate from claims):                                 │
│  POST /api/submissions → Document Agent → Gap Agent → [human loop] → Rating Agent │
└─────────────────────────────────┼────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────────────────┐
│                        MONGODB ATLAS  (motor_asyncio / PyMongo)                    │
│                                                                                    │
│  Collections:                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────┐  │
│  │   claims     │  │   policies   │  │ audit_trail │  │    fraud_rings        │  │
│  │              │  │ (+ embedding │  │ (immutable) │  │                      │  │
│  │ claim_id     │  │  vector col) │  │             │  │ ring_id, claim_ids   │  │
│  │ status       │  │              │  │ claim_id    │  │ signals, risk_score  │  │
│  │ agent_trace  │  │ $vectorSearch│  │ agent_results│  │                      │  │
│  │ decision     │  │    index     │  │ final_decision│ └──────────────────────┘  │
│  └──────────────┘  └──────────────┘  └─────────────┘                            │
│  ┌──────────────┐  ┌──────────────┐                                               │
│  │agent_memory  │  │uw_submissions│                                               │
│  │(ring patterns│  │              │                                               │
│  │ learned)     │  │ sub_id, docs │                                               │
│  └──────────────┘  └──────────────┘                                               │
└───────────────────────────────────────────────────────────────────────────────────┘

External Services:
  AWS Bedrock ──→ Claude claude-sonnet-4-6   (fraud analysis — intelligent LLM reasoning)
  VoyageAI    ──→ voyage-finance-2 embeddings (policy semantic search)
  IRDAI       ──→ irdai.gov.in / data.gov.in  (regulatory benchmark, cached 6h)
```

---

## 2. LangGraph Agent Pipeline — Detailed Flow

```
                        ┌──────────────────────────┐
                        │  ClaimSubmit  (REST POST) │
                        └─────────────┬────────────┘
                                      │
                            ┌─────────▼──────────┐
                            │  Orchestrator Init  │
                            │  ClaimState created │
                            └─────────┬──────────┘
                                      │
              ┌───────────────────────▼───────────────────────┐
              │              parallel_check_node               │
              │     (asyncio.gather — all 3 run at once)       │
              │                                                 │
              │  ┌──────────────────────────────────────────┐  │
              │  │ fraud_agent         policy_agent          │  │
              │  │                                          │  │
              │  │ Primary: AWS Bedrock  Primary: VoyageAI  │  │
              │  │  Claude Sonnet 4.6   voyage-finance-2    │  │
              │  │  (LLM reasoning)     + Atlas $vectorSearch│  │
              │  │                                          │  │
              │  │ Fallback: rule-based  Fallback: hardcoded│  │
              │  │  scoring heuristics   policy lookup      │  │
              │  │                                          │  │
              │  │         fraud_ring_agent                  │  │
              │  │  Queries MongoDB claims (60-day window)   │  │
              │  │  Detects: amount similarity (±25%)        │  │
              │  │           description keyword overlap     │  │
              │  │  Writes to fraud_rings collection         │  │
              │  └──────────────────────────────────────────┘  │
              └───────────────────────┬───────────────────────┘
                                      │
                            ┌─────────▼──────────┐
                            │    risk_node        │
                            │                    │
                            │ Inputs: fraud_score │
                            │         amount      │
                            │         claim_type  │
                            │         missing_docs│
                            │                    │
                            │ Outputs: risk_score │
                            │  risk_level (H/M/L) │
                            │  consequence_severity│
                            │  escalate flag      │
                            └─────────┬──────────┘
                                      │
                            ┌─────────▼──────────┐
                            │  decision_node      │
                            │                    │
                            │ Verdict logic:      │
                            │  ring_detected+≥60  │
                            │   → flagged         │
                            │  missing_docs+low   │
                            │   → pending_docs    │
                            │  fraud_score ≥75    │
                            │   → flagged         │
                            │  risk.escalate      │
                            │   → escalated       │
                            │  covered+score<40   │
                            │   → approved        │
                            │  else → flagged     │
                            └─────────┬──────────┘
                                      │
                            ┌─────────▼──────────┐
                            │  advisory_node      │
                            │  Portfolio advice   │
                            │  per claim_type     │
                            └─────────┬──────────┘
                                      │
                            ┌─────────▼──────────┐
                            │  audit_node         │
                            │  Writes immutable   │
                            │  record to MongoDB  │
                            │  audit_trail col    │
                            └─────────┬──────────┘
                                      │
                            ┌─────────▼──────────┐
                            │       END           │
                            │  ClaimResponse      │
                            │  sent to frontend   │
                            └────────────────────┘
```

---

## 3. Underwriting Sub-Pipeline

```
POST /api/submissions
        │
        ├──→ Document Agent  (extracts fields, calculates confidence scores)
        │
        ├──→ Gap Agent  (identifies missing/low-confidence required fields)
        │         │
        │         └──→ status: needs_review | ready_to_rate
        │
[Human Underwriter loop]
        │
        PUT /api/submissions/{id}/fields  (fill missing fields)
        │         └──→ re-runs Gap Agent automatically
        │
POST /api/submissions/{id}/rate
        │
        └──→ UW Rating Agent  (risk score → indicative premium calculation)
        │
POST /api/submissions/{id}/decision
        └──→ approved | declined | pending_info
```

---

## 4. Component Map

### Backend (`/backend/`)

| File | Role |
|------|------|
| `main.py` | FastAPI app, all REST + WebSocket endpoints, ConnectionManager |
| `agents/orchestrator.py` | LangGraph StateGraph, 5-stage pipeline, process_claim() entry |
| `agents/fraud_agent.py` | AWS Bedrock Claude (primary) + rule-based fallback |
| `agents/policy_agent.py` | VoyageAI + Atlas Vector Search (primary) + rule-based fallback |
| `agents/fraud_ring_agent.py` | Cross-claim ring detection, writes to fraud_rings collection |
| `agents/risk_agent.py` | Risk scoring (fraud weight + consequence severity) |
| `agents/advisory_agent.py` | Per-type coverage advice, premium factors |
| `agents/audit_agent.py` | Immutable audit record writer |
| `agents/document_agent.py` | Document extraction + confidence scoring |
| `agents/gap_agent.py` | Field gap analysis for underwriting |
| `agents/uw_rating_agent.py` | Risk-based premium rating engine |
| `agents/irdai_agent.py` | IRDAI regulatory benchmark fetcher (cached 6h) |
| `db/mongo.py` | Motor async client, collection accessors |
| `db/vector_search.py` | Atlas `$vectorSearch` pipeline helper |
| `db/checkpoint.py` | LangGraph checkpoint store (MongoDB-backed) |
| `db/seed_data.py` | Policy seed data |
| `db/embed_policies.py` | VoyageAI embedding generation for policies |
| `models/schemas.py` | Pydantic models: ClaimSubmit, ClaimResponse, Decision, etc. |
| `Dockerfile` | Container build for backend |

### Frontend (`/frontend/app/`)

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — KPI cards, claims table, fraud ring alert, live feed |
| `/submit` | Claim submission form with real-time AI pipeline trace |
| `/claims` | Paginated claims list with status filters |
| `/claims/[id]` | Claim detail — agent trace, decision breakdown, fraud ring link |
| `/rings` | Fraud ring investigation view |
| `/advisory` | Portfolio advisory — by claim type, optimal coverage recommendations |
| `/underwriting` | Underwriting submissions dashboard |
| `/underwriting/new` | New submission form (document upload) |
| `/underwriting/[id]` | Submission detail — field review, rating, decision |
| `/benchmark` | IRDAI regulatory benchmark comparison |

---

## 5. Data Models

### Claim Document (MongoDB `claims`)
```json
{
  "claim_id": "A1B2C3D4",
  "claimant_name": "string",
  "claim_type": "motor | health | life | motor_theft",
  "description": "string",
  "amount": 150000,
  "language": "en",
  "documents_provided": ["list of doc names"],
  "status": "processing | approved | flagged | escalated | pending_docs",
  "agent_trace": [{ "agent_name": "...", "status": "done", "result": {}, "duration_ms": 120 }],
  "decision": {
    "verdict": "approved",
    "confidence": 0.87,
    "reasoning": "...",
    "fraud_score": 22,
    "policy_match": "AIG Motor OD — Clause 4.2",
    "risk_level": "LOW",
    "settlement_amount": 142500,
    "ring_detected": false
  },
  "advisory": { "coverage_type": "...", "recommendations": [] },
  "human_override": { "adjuster_id": "...", "verdict": "...", "reasoning": "..." },
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### Decision Verdicts & Thresholds
| Condition | Verdict |
|-----------|---------|
| Fraud ring detected AND ring_score ≥ 60 | `flagged` |
| fraud_score ≥ 75 | `flagged` |
| Missing required docs AND fraud_score < 60 | `pending_docs` |
| risk.escalate = true | `escalated` |
| Policy covered AND fraud_score < 40 | `approved` (settlement = amount × 0.95) |
| Otherwise | `flagged` (manual review) |

---

## 6. External Integrations

| Service | Purpose | Fallback |
|---------|---------|---------|
| **AWS Bedrock** — `anthropic.claude-sonnet-4-6` | Intelligent fraud reasoning with LLM | Rule-based heuristics (no credentials needed) |
| **VoyageAI** — `voyage-finance-2` | Finance-domain embeddings for policy semantic search | Hardcoded policy lookup by claim type |
| **MongoDB Atlas** — `$vectorSearch` | Semantic nearest-neighbour policy matching | Same fallback as VoyageAI |
| **IRDAI / data.gov.in** | Regulatory benchmark data (FY 2022-23) | Cached MongoDB copy (6-hour TTL) |

---

## 7. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 16.2 + React 19 + TypeScript |
| Frontend styling | Tailwind CSS v4 |
| Backend framework | Python FastAPI (async) |
| Agent orchestration | LangGraph (StateGraph) |
| Database | MongoDB Atlas (Motor async driver) |
| LLM | Claude claude-sonnet-4-6 via AWS Bedrock |
| Embeddings | VoyageAI voyage-finance-2 |
| Vector search | MongoDB Atlas `$vectorSearch` |
| Real-time | WebSocket (`/ws/live`) via FastAPI |
| Containerisation | Docker (backend Dockerfile) |
| Schema validation | Pydantic v2 |

---

## 8. Key Design Decisions

1. **Dual-mode agents** — Every AI-powered agent (fraud, policy) has a rule-based fallback so the system works without cloud credentials, important for hackathon demo resilience.

2. **Parallel execution in Stage 1** — `asyncio.gather()` runs fraud detection, policy matching, and ring detection simultaneously, enabling the <3 second end-to-end target.

3. **LangGraph StateGraph** — Clean separation of pipeline stages with typed `ClaimState`. MongoDB-backed checkpointer enables pause/resume for long-running flows.

4. **Fraud ring memory** — The `agent_memory` collection learns patterns per claim type, and `fraud_rings` persists cross-claim links across requests (stateful, not just per-request).

5. **Immutable audit trail** — Every processed claim writes a tamper-evident record to `audit_trail` with all agent outputs and the final decision, fulfilling IRDAI traceability requirements.

6. **Human-in-the-loop override** — Claims can be overridden by an adjuster via `POST /api/claims/{id}/override`, with override reason stored and broadcast via WebSocket.

7. **Underwriting pipeline** — A separate agentic flow (Document → Gap → Rating → Decision) handles commercial underwriting submissions with a human review step between gap analysis and rating.

---

## 9. Summary

**MongAccentic** is an end-to-end **Agentic AI insurance operations platform** targeting the Indian FSI market. It addresses the industry's core pain points — $3.1B/year fraud losses and 21-day average settlement times — through a 5-stage LangGraph agent pipeline that processes each claim in under 3 seconds.

The platform covers two primary workflows:

- **Claims Processing** — Automated fraud detection (LLM + rules), semantic policy matching (vector search), cross-claim fraud ring detection, risk-weighted decision making, and immutable IRDAI-compliant audit trails.

- **Underwriting** — Document intelligence, field gap analysis, human-in-the-loop review, and risk-based premium rating for commercial submissions.

The architecture is built for demo resilience: every cloud-dependent agent has a rule-based fallback, MongoDB Atlas handles both document storage and vector search, and a WebSocket feed gives real-time visibility into the AI pipeline.
