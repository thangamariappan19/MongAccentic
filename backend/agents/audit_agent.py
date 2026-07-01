import time
from datetime import datetime, timezone
from db.mongo import get_audit_col

async def run_audit_agent(claim_id: str, claim_data: dict, agent_results: dict, decision: dict) -> dict:
    start = time.time()
    try:
        col = get_audit_col()
        record = {
            "claim_id": claim_id,
            "timestamp": datetime.now(timezone.utc),
            "claim_data": claim_data,
            "agent_results": agent_results,
            "final_decision": decision,
            "immutable": True,
        }
        result = await col.insert_one(record)
        return {"audit_id": str(result.inserted_id),
                "recorded_at": record["timestamp"].isoformat(),
                "duration_ms": int((time.time() - start) * 1000)}
    except Exception as e:
        return {"audit_id": None, "error": str(e),
                "duration_ms": int((time.time() - start) * 1000)}
