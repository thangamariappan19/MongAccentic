import time

REQUIRED_DOCS = {
    "motor": ["RC book", "driving license", "repair estimate"],
    "health": ["hospital bill", "discharge summary", "prescription", "lab reports"],
    "life": ["death certificate", "policy document", "nominee ID"],
    "motor_theft": ["FIR", "RC book", "driving license", "non-traceable certificate"],
}
AMOUNT_THRESHOLDS = {"motor": 200000, "health": 500000, "life": 1000000, "motor_theft": 300000}

async def run_risk_agent(claim_data: dict, fraud_result: dict, policy_result: dict) -> dict:
    start = time.time()
    try:
        fraud_score = fraud_result.get("fraud_score", 50)
        amount = claim_data.get("amount", 0)
        claim_type = claim_data.get("claim_type", "motor")
        docs_provided = set(claim_data.get("documents_provided", []))
        threshold = AMOUNT_THRESHOLDS.get(claim_type, 200000)

        consequence = "HIGH" if amount > threshold * 2 else "MEDIUM" if amount > threshold else "LOW"
        missing_docs = list(set(REQUIRED_DOCS.get(claim_type, [])) - docs_provided) if docs_provided else []
        risk_score = min(100, fraud_score * 0.6 + {"LOW": 10, "MEDIUM": 30, "HIGH": 50}.get(consequence, 20))
        escalate = fraud_score > 70 or (fraud_score > 50 and consequence == "HIGH")
        risk_level = "HIGH" if risk_score > 65 else "MEDIUM" if risk_score > 35 else "LOW"

        return {"risk_score": round(risk_score, 1), "risk_level": risk_level,
                "consequence_severity": consequence, "escalate": escalate,
                "needs_docs": len(missing_docs) > 0 and fraud_score < 60,
                "missing_documents": missing_docs,
                "duration_ms": int((time.time() - start) * 1000)}
    except Exception as e:
        return {"risk_score": 50, "risk_level": "MEDIUM", "escalate": True,
                "error": str(e), "duration_ms": int((time.time() - start) * 1000)}
