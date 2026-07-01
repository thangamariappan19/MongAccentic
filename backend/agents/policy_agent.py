"""
Policy Matching Agent
Primary:  MongoDB Atlas Vector Search + VoyageAI voyage-finance-2 embeddings
Fallback: Rule-based hardcoded matching (no credentials required)
"""
import os, time

# ── Fallback hardcoded policies (used when VOYAGE_API_KEY not set) ─────────────
POLICIES_FALLBACK = {
    "motor": {
        "title": "AIG Commercial Motor OD — Clause 4.2",
        "clause": "Own Damage cover for commercial and private vehicles. Covers accidental damage, fire, and natural calamities.",
        "coverage": "Up to declared value of vehicle. Depreciation applied per actuary schedule.",
        "exclusions": ["Drunk driving", "Racing", "Mechanical breakdown", "Wear and tear"],
        "similarity_score": 0.91,
    },
    "health": {
        "title": "Global Health Insurance — Comprehensive Cover Section 7.1",
        "clause": "Inpatient hospitalisation cover for illness and accidents. Minimum 24-hour admission required.",
        "coverage": "Room rent up to 1% of sum insured per day. ICU up to 2%. All daycare procedures covered.",
        "exclusions": ["Pre-existing conditions first 4 years", "Cosmetic surgery", "Self-inflicted injuries"],
        "similarity_score": 0.88,
    },
    "life": {
        "title": "Zurich Life Term Assurance — Policy Schedule Clause 2",
        "clause": "Death benefit payable to designated beneficiary on death of life assured during policy term.",
        "coverage": "Sum assured paid to beneficiary. Additional rider benefit for accidental death.",
        "exclusions": ["Suicide within first year", "Death due to war or civil unrest", "Hazardous activities without disclosure"],
        "similarity_score": 0.85,
    },
    "motor_theft": {
        "title": "AIG Auto Theft Coverage — Section 3A",
        "clause": "Total and partial theft cover for insured vehicles. Police report mandatory within 24 hours.",
        "coverage": "Insured Declared Value minus compulsory deductible.",
        "exclusions": ["Keys left in vehicle", "Vehicle used for unauthorised hire", "Theft by household member"],
        "similarity_score": 0.89,
    },
}

COVERAGE_RULES = {
    "motor":       lambda d, a: a < 200000,
    "health":      lambda d, a: a < 300000,
    "life":        lambda d, a: True,
    "motor_theft": lambda d, a: any(k in d.lower() for k in ["stolen", "theft", "missing"]) or a < 400000,
}


# ── MongoDB Atlas Vector Search ────────────────────────────────────────────────

async def _vector_search_match(claim_data: dict) -> dict | None:
    """
    Embed the claim description with VoyageAI voyage-finance-2 and run
    MongoDB Atlas $vectorSearch against the policies collection.
    Returns None if credentials/index not available (triggers fallback).
    """
    api_key = os.getenv("VOYAGE_API_KEY")
    if not api_key:
        return None

    start = time.time()
    try:
        import voyageai
        from db.mongo import get_async_client, DB_NAME

        description = claim_data.get("description", "")
        claim_type  = claim_data.get("claim_type", "motor")
        amount      = claim_data.get("amount", 0)

        # Generate query embedding
        vo = voyageai.AsyncClient(api_key=api_key)
        result = await vo.embed([description], model="voyage-finance-2", input_type="query")
        query_vector = result.embeddings[0]

        # Atlas $vectorSearch — filter by claim_type to keep results relevant
        db = get_async_client()[DB_NAME]
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "policy_vector_index",
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": 20,
                    "limit": 1,
                    "filter": {"claim_type": claim_type},
                }
            },
            {
                "$project": {
                    "title": 1, "clause": 1, "coverage": 1,
                    "exclusions": 1, "claim_type": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]

        docs = await db["policies"].aggregate(pipeline).to_list(1)
        if not docs:
            return None

        policy = docs[0]
        similarity = round(float(policy.get("score", 0.85)), 3)
        exclusions  = policy.get("exclusions", [])
        exclusion_hit = any(ex.lower() in description.lower() for ex in exclusions)
        covered = not exclusion_hit

        return {
            "matched": True,
            "policy_title": policy["title"],
            "policy_clause": policy["clause"],
            "similarity_score": similarity,
            "covered": covered,
            "coverage_detail": policy["coverage"] if covered else f"Possible exclusion: {', '.join(e for e in exclusions if e.lower() in description.lower())}",
            "applicable_exclusions": [e for e in exclusions if e.lower() in description.lower()],
            "recommendation": "Proceed with settlement" if covered else "Review against policy exclusions before settlement",
            "search_method": "mongodb_atlas_vector_search",
            "duration_ms": int((time.time() - start) * 1000),
        }

    except Exception:
        return None  # silently fall through to rule-based


# ── Rule-based fallback ────────────────────────────────────────────────────────

async def _rule_based_match(claim_data: dict) -> dict:
    start = time.time()
    claim_type  = claim_data.get("claim_type", "motor")
    description = claim_data.get("description", "")
    amount      = claim_data.get("amount", 0)

    policy = POLICIES_FALLBACK.get(claim_type)
    if not policy:
        return {
            "matched": False, "policy_title": "No matching policy",
            "similarity_score": 0.0, "covered": False,
            "search_method": "rule_based",
            "duration_ms": int((time.time() - start) * 1000),
        }

    rule = COVERAGE_RULES.get(claim_type, lambda d, a: True)
    covered = rule(description, amount)
    exclusion_hit = any(ex.lower() in description.lower() for ex in policy["exclusions"])
    if exclusion_hit:
        covered = False

    return {
        "matched": True,
        "policy_title": policy["title"],
        "policy_clause": policy["clause"],
        "similarity_score": policy["similarity_score"],
        "covered": covered,
        "coverage_detail": policy["coverage"] if covered else f"Possible exclusion applies",
        "applicable_exclusions": [ex for ex in policy["exclusions"] if ex.lower() in description.lower()],
        "recommendation": "Proceed with settlement" if covered else "Review against policy exclusions before settlement",
        "search_method": "rule_based_fallback",
        "duration_ms": int((time.time() - start) * 1000),
    }


# ── Public entry point ─────────────────────────────────────────────────────────

async def run_policy_agent(claim_data: dict) -> dict:
    """
    Tries MongoDB Atlas Vector Search first (requires VOYAGE_API_KEY + Atlas index).
    Falls back to rule-based matching automatically if credentials not available.
    """
    result = await _vector_search_match(claim_data)
    if result:
        return result
    return await _rule_based_match(claim_data)
