import time
from datetime import datetime, timezone, timedelta
from db.mongo import get_claims_col, get_fraud_rings_col, get_agent_memory_col

RING_WINDOW_DAYS = 60

async def run_fraud_ring_agent(claim_id: str, claim_data: dict) -> dict:
    start = time.time()
    try:
        claim_type = claim_data.get("claim_type", "motor")
        amount = float(claim_data.get("amount", 0))
        description = claim_data.get("description", "").lower()

        since = datetime.now(timezone.utc) - timedelta(days=RING_WINDOW_DAYS)
        col = get_claims_col()

        # Find claims with same type + similar amount (within 25%)
        similar = await col.find({
            "claim_id": {"$ne": claim_id},
            "claim_type": claim_type,
            "amount": {"$gte": amount * 0.75, "$lte": amount * 1.25},
            "created_at": {"$gte": since},
        }, {"claim_id": 1, "claimant_name": 1, "amount": 1, "status": 1}).to_list(10)

        # Find location overlap — extract 3+ letter words from description
        desc_words = set(w for w in description.split() if len(w) >= 4 and w.isalpha())
        location_matches = []
        if desc_words:
            all_recent = await col.find({
                "claim_id": {"$ne": claim_id},
                "claim_type": claim_type,
                "created_at": {"$gte": since},
            }, {"claim_id": 1, "claimant_name": 1, "amount": 1, "description": 1}).to_list(50)
            for c in all_recent:
                other_words = set(w for w in c.get("description", "").lower().split() if len(w) >= 4 and w.isalpha())
                overlap = desc_words & other_words
                if len(overlap) >= 3:
                    location_matches.append(c["claim_id"])

        ring_signals = []
        ring_claims = list({c["claim_id"] for c in similar})
        location_ring = list(set(location_matches))

        if len(similar) >= 2:
            ring_signals.append(f"{len(similar)+1} {claim_type} claims with similar amounts (±25%) in {RING_WINDOW_DAYS} days")

        if len(location_ring) >= 2:
            ring_signals.append(f"Description shares {3}+ keywords with {len(location_ring)} other claims")
            for cid in location_ring:
                if cid not in ring_claims:
                    ring_claims.append(cid)

        ring_detected = len(ring_signals) > 0
        ring_score = 0
        ring_id = None

        if ring_detected:
            ring_score = min(100, 40 + len(ring_claims) * 15)
            ring_id = f"RING-{claim_id[:6]}"
            rings_col = get_fraud_rings_col()
            all_ids = list(set(ring_claims + [claim_id]))
            existing = await rings_col.find_one({"claim_ids": {"$in": ring_claims}})
            if existing:
                ring_id = existing["ring_id"]
                await rings_col.update_one(
                    {"ring_id": ring_id},
                    {"$addToSet": {"claim_ids": claim_id, "signals": {"$each": ring_signals}},
                     "$set": {"last_updated": datetime.now(timezone.utc), "risk_score": ring_score}}
                )
            else:
                await rings_col.insert_one({
                    "ring_id": ring_id,
                    "claim_ids": all_ids,
                    "signals": ring_signals,
                    "detected_at": datetime.now(timezone.utc),
                    "last_updated": datetime.now(timezone.utc),
                    "risk_score": ring_score,
                    "claim_type": claim_type,
                })

            # Store pattern in agent memory
            mem_col = get_agent_memory_col()
            await mem_col.update_one(
                {"pattern_key": f"ring_{claim_type}"},
                {"$inc": {"count": 1}, "$set": {"last_seen": datetime.now(timezone.utc), "avg_amount": amount}},
                upsert=True
            )

        return {
            "ring_detected": ring_detected,
            "ring_id": ring_id,
            "connected_claims": ring_claims[:5],
            "ring_signals": ring_signals,
            "ring_score": ring_score,
            "duration_ms": int((time.time() - start) * 1000),
        }
    except Exception as e:
        return {
            "ring_detected": False, "ring_id": None,
            "connected_claims": [], "ring_signals": [],
            "ring_score": 0, "error": str(e),
            "duration_ms": int((time.time() - start) * 1000),
        }
