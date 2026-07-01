import asyncio
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from agents.fraud_agent import run_fraud_agent
from agents.policy_agent import run_policy_agent
from agents.risk_agent import run_risk_agent
from agents.audit_agent import run_audit_agent
from agents.fraud_ring_agent import run_fraud_ring_agent
from agents.advisory_agent import run_advisory_agent

class ClaimState(TypedDict):
    claim_id: str
    claim_data: dict
    fraud_result: Optional[dict]
    policy_result: Optional[dict]
    ring_result: Optional[dict]
    risk_result: Optional[dict]
    decision: Optional[dict]
    advisory_result: Optional[dict]
    audit_result: Optional[dict]
    agent_trace: list
    error: Optional[str]

async def parallel_check_node(state: ClaimState) -> ClaimState:
    fraud, policy, ring = await asyncio.gather(
        run_fraud_agent(state["claim_data"]),
        run_policy_agent(state["claim_data"]),
        run_fraud_ring_agent(state["claim_id"], state["claim_data"]),
    )
    trace = state.get("agent_trace", [])
    trace += [
        {"agent_name": "fraud_detection", "status": "done", "result": fraud, "duration_ms": fraud.get("duration_ms")},
        {"agent_name": "policy_matching", "status": "done", "result": policy, "duration_ms": policy.get("duration_ms")},
        {"agent_name": "ring_detection", "status": "done", "result": ring, "duration_ms": ring.get("duration_ms")},
    ]
    return {**state, "fraud_result": fraud, "policy_result": policy, "ring_result": ring, "agent_trace": trace}

async def risk_node(state: ClaimState) -> ClaimState:
    risk = await run_risk_agent(state["claim_data"], state["fraud_result"], state["policy_result"])
    trace = state.get("agent_trace", [])
    trace.append({"agent_name": "risk_assessment", "status": "done", "result": risk, "duration_ms": risk.get("duration_ms")})
    return {**state, "risk_result": risk, "agent_trace": trace}

async def decision_node(state: ClaimState) -> ClaimState:
    fraud = state["fraud_result"]
    policy = state["policy_result"]
    risk = state["risk_result"]
    ring = state.get("ring_result") or {}
    claim = state["claim_data"]

    fraud_score = fraud.get("fraud_score", 50)
    missing_docs = risk.get("missing_documents", [])

    ring_score = ring.get("ring_score", 0)
    if ring.get("ring_detected") and ring_score > fraud_score:
        fraud_score = min(100, int(fraud_score * 0.4 + ring_score * 0.6))
        fraud.setdefault("signals", []).append(f"Fraud ring: {ring.get('ring_id')}")

    if ring.get("ring_detected") and ring_score >= 60:
        verdict, confidence = "flagged", round(min(fraud_score, 99) / 100, 2)
        signals = fraud.get("signals", [])
        reasoning = f"FRAUD RING DETECTED ({ring.get('ring_id')}): {len(ring.get('connected_claims', []))} linked claims with identical pattern. Score: {ring_score}/100."
        if signals:
            reasoning += f" Signals: {', '.join(signals)}"
        settlement = None
    elif missing_docs and fraud_score < 60:
        verdict, confidence = "pending_docs", 0.95
        reasoning = f"Missing required documents: {', '.join(missing_docs)}. Please submit and reapply."
        settlement = None
    elif fraud_score >= 75 or (ring.get("ring_detected") and ring_score >= 70):
        verdict, confidence = "flagged", round(fraud_score / 100, 2)
        signals = fraud.get("signals", [])
        reasoning = f"High fraud risk ({fraud_score}/100). Signals: {', '.join(signals)}"
        if ring.get("ring_detected"):
            reasoning += f" | Part of fraud ring {ring.get('ring_id')} with {len(ring.get('connected_claims', []))} linked claims."
        settlement = None
    elif risk.get("escalate"):
        verdict, confidence = "escalated", 0.70
        reasoning = "Risk profile requires senior adjuster review."
        settlement = None
    elif policy.get("covered") and fraud_score < 40:
        verdict, confidence = "approved", round((100 - fraud_score) / 100, 2)
        reasoning = f"Approved under {policy.get('policy_title', '')}. {policy.get('coverage_detail', '')}"
        settlement = round(claim.get("amount", 0) * 0.95, 2)
    else:
        verdict, confidence = "flagged", 0.60
        reasoning = "Manual review required."
        settlement = None

    decision = {
        "verdict": verdict, "confidence": confidence, "reasoning": reasoning,
        "fraud_score": fraud_score,
        "policy_match": policy.get("policy_title"),
        "policy_similarity": policy.get("similarity_score"),
        "risk_level": risk.get("risk_level", "MEDIUM"),
        "settlement_amount": settlement,
        "missing_documents": missing_docs,
        "ring_detected": ring.get("ring_detected", False),
        "ring_id": ring.get("ring_id"),
        "connected_claims": ring.get("connected_claims", []),
    }
    trace = state.get("agent_trace", [])
    trace.append({"agent_name": "decision_maker", "status": "done", "result": decision, "duration_ms": 0})
    return {**state, "decision": decision, "agent_trace": trace}

async def advisory_node(state: ClaimState) -> ClaimState:
    advisory = await run_advisory_agent(state["claim_id"], state["claim_data"], state.get("decision") or {})
    trace = state.get("agent_trace", [])
    trace.append({"agent_name": "financial_advisory", "status": "done", "result": advisory, "duration_ms": advisory.get("duration_ms")})
    return {**state, "advisory_result": advisory, "agent_trace": trace}

async def audit_node(state: ClaimState) -> ClaimState:
    audit = await run_audit_agent(
        state["claim_id"], state["claim_data"],
        {"fraud": state["fraud_result"], "policy": state["policy_result"],
         "ring": state["ring_result"], "risk": state["risk_result"]},
        state["decision"],
    )
    trace = state.get("agent_trace", [])
    trace.append({"agent_name": "audit_writer", "status": "done", "result": audit, "duration_ms": audit.get("duration_ms")})
    return {**state, "audit_result": audit, "agent_trace": trace}

def build_graph(checkpointer=None):
    g = StateGraph(ClaimState)
    g.add_node("parallel_check", parallel_check_node)
    g.add_node("risk_assessment", risk_node)
    g.add_node("decision_maker", decision_node)
    g.add_node("financial_advisory", advisory_node)
    g.add_node("audit_writer", audit_node)
    g.set_entry_point("parallel_check")
    g.add_edge("parallel_check", "risk_assessment")
    g.add_edge("risk_assessment", "decision_maker")
    g.add_edge("decision_maker", "financial_advisory")
    g.add_edge("financial_advisory", "audit_writer")
    g.add_edge("audit_writer", END)
    return g.compile(checkpointer=checkpointer)

_graph = None

def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph

async def process_claim(claim_id: str, claim_data: dict) -> ClaimState:
    initial: ClaimState = {
        "claim_id": claim_id, "claim_data": claim_data,
        "fraud_result": None, "policy_result": None,
        "ring_result": None, "risk_result": None,
        "decision": None, "advisory_result": None,
        "audit_result": None,
        "agent_trace": [{"agent_name": "orchestrator", "status": "done",
                         "result": {"message": "4-stage agent pipeline started (3-parallel + advisory)"}, "duration_ms": 0}],
        "error": None,
    }
    try:
        from db.checkpoint import get_checkpointer
        checkpointer = await get_checkpointer()
        if checkpointer:
            graph = build_graph(checkpointer=checkpointer)
            config = {"configurable": {"thread_id": claim_id}}
            return await graph.ainvoke(initial, config=config)
    except Exception:
        pass
    return await get_graph().ainvoke(initial)
