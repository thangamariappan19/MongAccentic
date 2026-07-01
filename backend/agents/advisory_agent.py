import time
from datetime import datetime, timezone, timedelta

COVERAGE_ADVICE = {
    "motor": {
        "optimal_coverage": 300000,
        "add_ons": ["Zero Depreciation", "Engine Protection", "Roadside Assistance"],
        "premium_factor": 0.030,
        "mitigation": ["Install certified anti-theft device", "Park in covered garage", "Annual vehicle inspection"],
    },
    "health": {
        "optimal_coverage": 1000000,
        "add_ons": ["Critical Illness Rider", "OPD Cover", "Maternity Cover"],
        "premium_factor": 0.025,
        "mitigation": ["Annual preventive health checkup", "Maintain healthy BMI", "Disclose pre-existing conditions"],
    },
    "life": {
        "optimal_coverage": 5000000,
        "add_ons": ["Accidental Death Benefit", "Waiver of Premium Rider", "Income Benefit Rider"],
        "premium_factor": 0.012,
        "mitigation": ["Update nominee annually", "Lifestyle improvement plan", "Regular medical checkup"],
    },
    "motor_theft": {
        "optimal_coverage": 400000,
        "add_ons": ["GPS Tracker Cover", "Return to Invoice", "Key Replacement"],
        "premium_factor": 0.035,
        "mitigation": ["Install GPS tracker", "Use engine immobilizer", "Secure covered parking only"],
    },
}


async def run_advisory_agent(claim_id: str, claim_data: dict, decision: dict) -> dict:
    start = time.time()
    try:
        from db.mongo import get_claims_col

        claim_type = claim_data.get("claim_type", "motor")
        amount = float(claim_data.get("amount", 0))
        fraud_score = decision.get("fraud_score", 50)
        verdict = decision.get("verdict", "flagged")
        ring_detected = decision.get("ring_detected", False)

        advice = COVERAGE_ADVICE.get(claim_type, COVERAGE_ADVICE["motor"])
        optimal = advice["optimal_coverage"]
        coverage_ratio = amount / optimal if optimal else 1

        if coverage_ratio < 0.5:
            adequacy = "severely_underinsured"
        elif coverage_ratio < 0.8:
            adequacy = "underinsured"
        else:
            adequacy = "adequate"

        coverage_gap = max(0, optimal - amount)
        base_premium = round(amount * advice["premium_factor"])

        if ring_detected:
            premium_adjustment = "+60%"
            premium_reason = "Part of detected fraud ring — high-risk classification"
        elif fraud_score >= 70:
            premium_adjustment = "+35%"
            premium_reason = "High fraud risk score — enhanced premium required"
        elif fraud_score >= 40:
            premium_adjustment = "+15%"
            premium_reason = "Moderate risk profile — standard adjustment"
        else:
            premium_adjustment = "Standard"
            premium_reason = "Low-risk profile — standard premium applicable"

        if verdict == "approved":
            settlement_rec = f"Proceed with settlement of Rs.{round(amount * 0.95):,} (95% of claim)"
            settlement_action = "approve"
        elif verdict == "flagged":
            settlement_rec = "Hold settlement — fraud investigation must complete first"
            settlement_action = "hold"
        elif verdict == "pending_docs":
            settlement_rec = "Resume processing once all required documents received"
            settlement_action = "pending"
        else:
            settlement_rec = "Refer to senior adjuster for manual review"
            settlement_action = "escalate"

        col = get_claims_col()
        since = datetime.now(timezone.utc) - timedelta(days=90)
        similar_count = await col.count_documents({"claim_type": claim_type, "created_at": {"$gte": since}})
        avg_agg = await col.aggregate([
            {"$match": {"claim_type": claim_type}},
            {"$group": {"_id": None, "avg": {"$avg": "$amount"}}},
        ]).to_list(1)
        avg_amount = round(avg_agg[0]["avg"]) if avg_agg else amount
        vs_avg = round((amount - avg_amount) / avg_amount * 100, 1) if avg_amount else 0

        return {
            "coverage_adequacy": adequacy,
            "coverage_gap": round(coverage_gap),
            "optimal_coverage": optimal,
            "recommended_add_ons": advice["add_ons"],
            "risk_mitigation": advice["mitigation"],
            "base_premium": base_premium,
            "premium_adjustment": premium_adjustment,
            "premium_reason": premium_reason,
            "settlement_recommendation": settlement_rec,
            "settlement_action": settlement_action,
            "portfolio_context": {
                "similar_claims_90d": similar_count,
                "avg_claim_amount": avg_amount,
                "vs_average_pct": vs_avg,
            },
            "confidence": 0.85,
            "duration_ms": int((time.time() - start) * 1000),
        }
    except Exception as e:
        return {
            "coverage_adequacy": "unknown",
            "error": str(e),
            "duration_ms": int((time.time() - start) * 1000),
        }
