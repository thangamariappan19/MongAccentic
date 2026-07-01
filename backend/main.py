import os, uuid, asyncio
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()

from db.mongo import ping_db, get_claims_col, get_fraud_rings_col, get_submissions_col
from models.schemas import (ClaimSubmit, ClaimResponse, ClaimListItem,
                             OverrideSubmit, AnalyticsResponse)
from agents.orchestrator import process_claim
from agents.irdai_agent import get_irdai_benchmark, compute_comparison

@asynccontextmanager
async def lifespan(app: FastAPI):
    await ping_db()
    yield

app = FastAPI(title="MongAccentic", description="Track 2: Agentic AI for FSI", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws) if ws in self.active else None

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "team": "MongAccentic", "track": "Track 2", "version": "2.0",
            "agents": ["fraud_detection", "policy_matching", "ring_detection", "risk_assessment",
                       "financial_advisory", "decision_maker", "audit_writer"]}

# ── Claims ────────────────────────────────────────────────────────────────────
@app.post("/api/claims", response_model=ClaimResponse)
async def submit_claim(claim: ClaimSubmit):
    claim_id = str(uuid.uuid4())[:8].upper()
    now = datetime.now(timezone.utc)
    col = get_claims_col()
    doc = {
        "claim_id": claim_id, "claimant_name": claim.claimant_name,
        "claim_type": claim.claim_type, "description": claim.description,
        "amount": claim.amount, "language": claim.language,
        "documents_provided": claim.documents_provided,
        "status": "processing", "agent_trace": [], "decision": None, "advisory": None,
        "created_at": now, "updated_at": now,
    }
    await col.insert_one(doc)

    await manager.broadcast({
        "type": "claim_processing",
        "claim_id": claim_id, "claimant_name": claim.claimant_name,
        "amount": claim.amount, "claim_type": claim.claim_type,
        "timestamp": now.isoformat(),
    })

    try:
        result = await process_claim(claim_id, claim.model_dump())
        status = result["decision"]["verdict"] if result.get("decision") else "flagged"
        await col.update_one({"claim_id": claim_id}, {"$set": {
            "status": status,
            "agent_trace": result.get("agent_trace", []),
            "decision": result.get("decision"),
            "advisory": result.get("advisory_result"),
            "updated_at": datetime.now(timezone.utc),
        }})
        decision = result.get("decision", {})
        await manager.broadcast({
            "type": "claim_processed",
            "claim_id": claim_id, "claimant_name": claim.claimant_name,
            "amount": claim.amount, "status": status,
            "fraud_score": decision.get("fraud_score"),
            "ring_detected": decision.get("ring_detected", False),
            "ring_id": decision.get("ring_id"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        await col.update_one({"claim_id": claim_id},
            {"$set": {"status": "flagged", "error": str(e), "updated_at": datetime.now(timezone.utc)}})
        raise HTTPException(status_code=500, detail=str(e))

    updated = await col.find_one({"claim_id": claim_id})
    return _to_response(updated)

@app.get("/api/claims/{claim_id}", response_model=ClaimResponse)
async def get_claim(claim_id: str):
    doc = await get_claims_col().find_one({"claim_id": claim_id.upper()})
    if not doc:
        raise HTTPException(status_code=404, detail="Claim not found")
    return _to_response(doc)

@app.get("/api/claims", response_model=list[ClaimListItem])
async def list_claims(status: str = None, limit: int = 50):
    q = {"status": status} if status else {}
    docs = await get_claims_col().find(q).sort("created_at", -1).limit(limit).to_list(limit)
    return [ClaimListItem(
        claim_id=d["claim_id"], claimant_name=d["claimant_name"],
        claim_type=d["claim_type"], amount=d["amount"],
        status=d.get("status", "processing"),
        fraud_score=d.get("decision", {}).get("fraud_score") if d.get("decision") else None,
        created_at=d["created_at"],
    ) for d in docs]

@app.post("/api/claims/{claim_id}/override")
async def override_claim(claim_id: str, override: OverrideSubmit):
    doc = await get_claims_col().find_one({"claim_id": claim_id.upper()})
    if not doc:
        raise HTTPException(status_code=404, detail="Claim not found")
    await get_claims_col().update_one({"claim_id": claim_id.upper()}, {"$set": {
        "status": override.verdict,
        "human_override": {
            "adjuster_id": override.adjuster_id,
            "verdict": override.verdict,
            "reasoning": override.reasoning,
            "overridden_at": datetime.now(timezone.utc).isoformat(),
        },
        "updated_at": datetime.now(timezone.utc),
    }})
    await manager.broadcast({
        "type": "claim_override",
        "claim_id": claim_id, "new_status": override.verdict,
        "adjuster_id": override.adjuster_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return {"claim_id": claim_id, "new_status": override.verdict, "message": "Override recorded"}

# ── Analytics ─────────────────────────────────────────────────────────────────
@app.get("/api/analytics", response_model=AnalyticsResponse)
async def get_analytics():
    col = get_claims_col()
    total = await col.count_documents({})
    agg = await col.aggregate([{"$group": {"_id": None, "avg_fraud": {"$avg": "$decision.fraud_score"}}}]).to_list(1)

    type_agg = await col.aggregate([
        {"$group": {"_id": "$claim_type", "count": {"$sum": 1}}}
    ]).to_list(10)
    by_type = {t["_id"]: t["count"] for t in type_agg if t["_id"]}

    ring_count = await get_fraud_rings_col().count_documents({})
    high_risk = await col.count_documents({"decision.fraud_score": {"$gte": 70}})

    return AnalyticsResponse(
        total_claims=total,
        approved=await col.count_documents({"status": "approved"}),
        flagged=await col.count_documents({"status": "flagged"}),
        escalated=await col.count_documents({"status": "escalated"}),
        pending_docs=await col.count_documents({"status": "pending_docs"}),
        avg_fraud_score=round(agg[0]["avg_fraud"], 1) if agg and agg[0].get("avg_fraud") else 0.0,
        avg_processing_ms=0.0,
        by_type=by_type,
        ring_count=ring_count,
        high_risk_count=high_risk,
    )

# ── Fraud Rings ───────────────────────────────────────────────────────────────
@app.get("/api/fraud-rings")
async def get_fraud_rings():
    rings = await get_fraud_rings_col().find({}).sort("detected_at", -1).limit(20).to_list(20)
    return [_serialize(r) for r in rings]

@app.get("/api/fraud-rings/{ring_id}")
async def get_fraud_ring(ring_id: str):
    ring = await get_fraud_rings_col().find_one({"ring_id": ring_id})
    if not ring:
        raise HTTPException(status_code=404, detail="Ring not found")
    return _serialize(ring)

@app.get("/api/claims/{claim_id}/ring")
async def get_claim_ring(claim_id: str):
    ring = await get_fraud_rings_col().find_one({"claim_ids": claim_id.upper()})
    if not ring:
        return {"ring_detected": False}
    return _serialize(ring)

# ── Financial Advisory ────────────────────────────────────────────────────────
@app.get("/api/advisory")
async def get_portfolio_advisory():
    from agents.advisory_agent import COVERAGE_ADVICE
    col = get_claims_col()

    pipeline = [
        {"$group": {
            "_id": "$claim_type",
            "count": {"$sum": 1},
            "total_value": {"$sum": "$amount"},
            "avg_amount": {"$avg": "$amount"},
            "avg_fraud": {"$avg": "$decision.fraud_score"},
            "approved_count": {"$sum": {"$cond": [{"$eq": ["$status", "approved"]}, 1, 0]}},
            "flagged_count": {"$sum": {"$cond": [{"$eq": ["$status", "flagged"]}, 1, 0]}},
        }},
    ]
    by_type_raw = await col.aggregate(pipeline).to_list(10)
    total_exposure = sum(t.get("total_value", 0) for t in by_type_raw)
    high_risk = await col.count_documents({"decision.fraud_score": {"$gte": 70}})
    ring_count = await get_fraud_rings_col().count_documents({})

    by_type = []
    for t in by_type_raw:
        ct = t["_id"]
        if not ct:
            continue
        advice = COVERAGE_ADVICE.get(ct, {})
        count = t["count"]
        by_type.append({
            "claim_type": ct,
            "count": count,
            "total_value": round(t.get("total_value", 0)),
            "avg_amount": round(t.get("avg_amount") or 0),
            "avg_fraud_score": round(t.get("avg_fraud") or 0, 1),
            "approval_rate": round(t["approved_count"] / count * 100 if count else 0, 1),
            "flagged_count": t["flagged_count"],
            "optimal_coverage": advice.get("optimal_coverage", 0),
            "recommended_add_ons": advice.get("add_ons", []),
            "risk_mitigation": advice.get("mitigation", []),
            "premium_factor": advice.get("premium_factor", 0),
        })

    return {
        "total_exposure": round(total_exposure),
        "high_risk_claims": high_risk,
        "active_rings": ring_count,
        "by_type": by_type,
    }

# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/live")
async def websocket_live(ws: WebSocket):
    await manager.connect(ws)
    try:
        recent = await get_claims_col().find(
            {"status": {"$ne": "processing"}},
            {"claim_id": 1, "claimant_name": 1, "amount": 1, "status": 1, "decision": 1, "updated_at": 1}
        ).sort("updated_at", -1).limit(5).to_list(5)
        for doc in reversed(recent):
            await ws.send_json({
                "type": "claim_processed",
                "claim_id": doc["claim_id"],
                "claimant_name": doc["claimant_name"],
                "amount": doc["amount"],
                "status": doc["status"],
                "fraud_score": doc.get("decision", {}).get("fraud_score") if doc.get("decision") else None,
                "ring_detected": doc.get("decision", {}).get("ring_detected", False) if doc.get("decision") else False,
                "timestamp": doc["updated_at"].isoformat() if hasattr(doc.get("updated_at"), "isoformat") else str(doc.get("updated_at", "")),
            })
        while True:
            await asyncio.sleep(30)
            await ws.send_json({"type": "ping"})
    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception:
        manager.disconnect(ws)

# ── Underwriting Submissions ─────────────────────────────────────────────────
@app.post("/api/submissions")
async def create_submission(body: dict):
    from agents.document_agent import run_document_agent
    from agents.gap_agent import run_gap_agent
    import uuid
    submission_id = "SUB-" + str(uuid.uuid4())[:6].upper()
    now = datetime.now(timezone.utc)

    doc_result = await run_document_agent(submission_id, body)
    gap_result = await run_gap_agent(submission_id, doc_result["extracted_fields"], doc_result["field_definitions"])

    audit = [
        {"timestamp": now.isoformat(), "actor": "Document Intelligence Agent", "action": "Document processing complete",
         "detail": f"{doc_result['documents_processed']} doc(s) processed · {doc_result['high_confidence_count']} high-conf · {doc_result['low_confidence_count']} low-conf · {doc_result.get('missing_required_count', 0)} missing required"},
        {"timestamp": now.isoformat(), "actor": "Gap Analysis Agent", "action": "Field gap analysis complete",
         "detail": f"{gap_result['missing_count']} required fields missing · {gap_result['low_confidence_count']} need verification"},
    ]

    doc = {
        "submission_id": submission_id,
        "insured_name": body.get("insured_name", "Unknown"),
        "broker_name": body.get("broker_name", ""),
        "line_of_business": body.get("line_of_business", "commercial_property"),
        "documents": body.get("documents", []),
        "status": gap_result["recommended_status"],
        "extracted_fields": doc_result["extracted_fields"],
        "field_definitions": doc_result["field_definitions"],
        "gap_analysis": gap_result,
        "rating": None,
        "decision": None,
        "audit_trail": audit,
        "agent_trace": [
            {"agent": "Document Intelligence", "status": "done", "duration_ms": doc_result["duration_ms"]},
            {"agent": "Gap Analysis", "status": "done", "duration_ms": gap_result["duration_ms"]},
        ],
        "created_at": now,
        "updated_at": now,
    }
    await get_submissions_col().insert_one(doc)
    return _serialize(await get_submissions_col().find_one({"submission_id": submission_id}))


@app.get("/api/submissions")
async def list_submissions(status: str = None, limit: int = 50):
    q = {"status": status} if status else {}
    docs = await get_submissions_col().find(q).sort("created_at", -1).limit(limit).to_list(limit)
    return [_serialize(d) for d in docs]


@app.get("/api/submissions/{submission_id}")
async def get_submission(submission_id: str):
    doc = await get_submissions_col().find_one({"submission_id": submission_id.upper()})
    if not doc:
        raise HTTPException(status_code=404, detail="Submission not found")
    return _serialize(doc)


@app.put("/api/submissions/{submission_id}/fields")
async def update_fields(submission_id: str, body: dict):
    """Human underwriter updates missing/low-confidence fields."""
    doc = await get_submissions_col().find_one({"submission_id": submission_id.upper()})
    if not doc:
        raise HTTPException(status_code=404, detail="Submission not found")

    now = datetime.now(timezone.utc)
    fields = doc.get("extracted_fields", {})
    audit_entries = []
    updated_by = body.get("updated_by", "Underwriter")

    for key, new_value in body.get("fields", {}).items():
        old = fields.get(key, {}).get("value")
        if key in fields:
            fields[key]["value"] = new_value
            fields[key]["human_verified"] = True
            fields[key]["confidence"] = 1.0
            fields[key]["source"] = f"Human input — {updated_by}"
        audit_entries.append({
            "timestamp": now.isoformat(),
            "actor": updated_by,
            "action": f"Field updated: {key}",
            "detail": f'"{old}" → "{new_value}"',
        })

    # Re-run gap analysis
    from agents.gap_agent import run_gap_agent
    gap_result = await run_gap_agent(submission_id, fields, doc.get("field_definitions", []))
    new_status = "ready_to_rate" if not gap_result["needs_human_review"] else "needs_review"

    await get_submissions_col().update_one(
        {"submission_id": submission_id.upper()},
        {"$set": {
            "extracted_fields": fields,
            "gap_analysis": gap_result,
            "status": new_status,
            "updated_at": now,
        }, "$push": {"audit_trail": {"$each": audit_entries}}},
    )
    return _serialize(await get_submissions_col().find_one({"submission_id": submission_id.upper()}))


@app.post("/api/submissions/{submission_id}/rate")
async def rate_submission(submission_id: str):
    """Run the rating engine on a ready submission."""
    doc = await get_submissions_col().find_one({"submission_id": submission_id.upper()})
    if not doc:
        raise HTTPException(status_code=404, detail="Submission not found")

    from agents.uw_rating_agent import run_uw_rating_agent
    now = datetime.now(timezone.utc)
    rating = await run_uw_rating_agent(submission_id, doc["extracted_fields"], doc["line_of_business"])
    audit_entry = {
        "timestamp": now.isoformat(),
        "actor": "Rating Engine Agent",
        "action": "Indicative premium computed",
        "detail": f"Risk score: {rating['risk_score']}/100 · Tier: {rating['risk_tier']} · Indicative premium: ${rating['final_premium']:,}",
    }
    await get_submissions_col().update_one(
        {"submission_id": submission_id.upper()},
        {"$set": {"rating": rating, "status": "rating_complete", "updated_at": now},
         "$push": {"audit_trail": audit_entry}},
    )
    return _serialize(await get_submissions_col().find_one({"submission_id": submission_id.upper()}))


@app.post("/api/submissions/{submission_id}/decision")
async def submission_decision(submission_id: str, body: dict):
    """Underwriter makes final decision: approved / declined / pending_info."""
    doc = await get_submissions_col().find_one({"submission_id": submission_id.upper()})
    if not doc:
        raise HTTPException(status_code=404, detail="Submission not found")

    now = datetime.now(timezone.utc)
    action = body.get("action", "approved")
    underwriter = body.get("underwriter", "Underwriter")
    notes = body.get("notes", "")
    status_map = {"approved": "approved", "declined": "declined", "pending_info": "pending_info"}
    new_status = status_map.get(action, "approved")

    audit_entry = {
        "timestamp": now.isoformat(),
        "actor": underwriter,
        "action": f"Underwriter decision: {action.upper()}",
        "detail": notes or f"Submission {action} by {underwriter}",
    }
    await get_submissions_col().update_one(
        {"submission_id": submission_id.upper()},
        {"$set": {
            "status": new_status,
            "decision": {"action": action, "underwriter": underwriter, "notes": notes, "decided_at": now.isoformat()},
            "updated_at": now,
        }, "$push": {"audit_trail": audit_entry}},
    )
    return {"submission_id": submission_id, "status": new_status, "message": f"Decision recorded: {action}"}


@app.get("/api/submissions-analytics")
async def submissions_analytics():
    col = get_submissions_col()
    total = await col.count_documents({})
    lob_agg = await col.aggregate([{"$group": {"_id": "$line_of_business", "count": {"$sum": 1}}}]).to_list(10)
    return {
        "total": total,
        "needs_review": await col.count_documents({"status": "needs_review"}),
        "ready_to_rate": await col.count_documents({"status": "ready_to_rate"}),
        "rating_complete": await col.count_documents({"status": "rating_complete"}),
        "approved": await col.count_documents({"status": "approved"}),
        "declined": await col.count_documents({"status": "declined"}),
        "by_lob": {item["_id"]: item["count"] for item in lob_agg if item["_id"]},
    }


# ── IRDAI Regulatory Benchmark ────────────────────────────────────────────────
@app.get("/api/irdai-benchmark")
async def irdai_benchmark():
    """
    Returns IRDAI industry-wide benchmarks (Annual Report FY 2022-23)
    plus a live comparison against this platform's current performance.
    Attempts connectivity check to irdai.gov.in / data.gov.in on each call.
    Result cached in MongoDB for 6 hours.
    """
    db = get_async_client()[DB_NAME]

    # Fetch IRDAI data (cached + live signal)
    benchmark_doc = await get_irdai_benchmark(db)

    # Fetch our live analytics from MongoDB for comparison
    claims_col = get_claims_col()
    total = await claims_col.count_documents({})
    approved = await claims_col.count_documents({"status": "approved"})
    flagged  = await claims_col.count_documents({"status": "flagged"})
    escalated = await claims_col.count_documents({"status": "escalated"})

    # Compute avg processing time
    pipeline = [
        {"$match": {"agent_trace": {"$exists": True}}},
        {"$project": {"_id": 0, "duration": {"$sum": "$agent_trace.duration_ms"}}},
        {"$group": {"_id": None, "avg_ms": {"$avg": "$duration"}}},
    ]
    agg = await claims_col.aggregate(pipeline).to_list(1)
    avg_ms = agg[0]["avg_ms"] if agg else 1800

    our_analytics = {
        "total_claims": total,
        "approved": approved,
        "flagged": flagged,
        "escalated": escalated,
        "avg_processing_ms": avg_ms,
    }

    comparison = compute_comparison(benchmark_doc["data"], our_analytics)

    # Serialize cached_at
    cached_at = benchmark_doc.get("cached_at")
    if hasattr(cached_at, "isoformat"):
        cached_at = cached_at.isoformat()

    return {
        "irdai": benchmark_doc["data"],
        "our_platform": our_analytics,
        "comparison": comparison,
        "live_signal": benchmark_doc.get("live_signal", {}),
        "cached_at": cached_at,
        "from_cache": benchmark_doc.get("_from_cache", False),
    }


def get_async_client():
    from db.mongo import get_async_client as _get
    return _get()

DB_NAME = "mongaccentic"


# ── Helpers ───────────────────────────────────────────────────────────────────
def _to_response(doc):
    from models.schemas import ClaimResponse
    return ClaimResponse(
        claim_id=doc["claim_id"], status=doc.get("status", "processing"),
        claimant_name=doc["claimant_name"], claim_type=doc["claim_type"],
        amount=doc["amount"], agent_trace=doc.get("agent_trace", []),
        decision=doc.get("decision"),
        advisory=doc.get("advisory"),
        created_at=doc["created_at"], updated_at=doc["updated_at"],
    )

def _serialize(doc):
    doc["_id"] = str(doc["_id"])
    for k, v in doc.items():
        if hasattr(v, "isoformat"):
            doc[k] = v.isoformat()
    return doc
