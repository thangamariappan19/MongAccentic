"""
Seed demo data with VoyageAI embeddings for MongoDB Atlas Vector Search.
Usage:
  python db/seed_data.py           # requires VOYAGE_API_KEY in .env for real embeddings
  python db/seed_data.py --no-emb  # skips embedding generation (zero vectors, no vector search)
"""
import os, sys
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.mongo import get_sync_db

EMBEDDING_DIM = 1024   # voyage-finance-2 dimensions

# ── Policy documents ──────────────────────────────────────────────────────────
# These are stored in MongoDB and searched via Atlas Vector Search.
# The text field is what gets embedded; embedding field is populated at seed time.

POLICIES = [
    {
        "title": "AIG Commercial Motor OD — Clause 4.2",
        "clause": "Own Damage cover for commercial and private vehicles. Covers accidental damage, fire, natural calamities, and third-party liability.",
        "coverage": "Up to declared value of vehicle. Depreciation applied per actuary schedule.",
        "exclusions": ["Drunk driving", "Racing", "Mechanical breakdown", "Wear and tear"],
        "claim_type": "motor",
        "text": "AIG Commercial Motor Own Damage cover for commercial and private vehicles. Covers accidental damage, theft, fire, and natural calamities.",
        "embedding": [0.0] * EMBEDDING_DIM,
    },
    {
        "title": "Global Health Insurance — Comprehensive Cover Section 7.1",
        "clause": "Inpatient hospitalisation cover for illness and accidents. Minimum 24-hour admission required. Daycare procedures covered.",
        "coverage": "Room rent up to 1% of sum insured per day. ICU up to 2%. All daycare procedures covered.",
        "exclusions": ["Pre-existing conditions first 4 years", "Cosmetic surgery", "Self-inflicted injuries"],
        "claim_type": "health",
        "text": "Global Health Insurance inpatient hospitalisation cover for illness and accidents. Daycare procedures. ICU and room rent included.",
        "embedding": [0.0] * EMBEDDING_DIM,
    },
    {
        "title": "Zurich Life Term Assurance — Policy Schedule Clause 2",
        "clause": "Death benefit payable to designated beneficiary on death of life assured during policy term. Accidental death benefit rider available.",
        "coverage": "Sum assured paid to beneficiary. Additional rider benefit for accidental death.",
        "exclusions": ["Suicide within first year", "Death due to war or civil unrest", "Hazardous activities without disclosure"],
        "claim_type": "life",
        "text": "Zurich Life Term Assurance death benefit payable to beneficiary. Accidental death rider. Coverage for illness and accident.",
        "embedding": [0.0] * EMBEDDING_DIM,
    },
    {
        "title": "AIG Auto Theft Coverage — Section 3A",
        "clause": "Total and partial theft cover for insured vehicles. Police report mandatory within 24 hours of discovery.",
        "coverage": "Insured Declared Value minus compulsory deductible. Partial theft components covered at actuary rate.",
        "exclusions": ["Keys left in vehicle", "Vehicle used for unauthorised hire", "Theft by household member"],
        "claim_type": "motor_theft",
        "text": "AIG Auto Theft Coverage for total and partial vehicle theft. Police report required. Insured Declared Value payout.",
        "embedding": [0.0] * EMBEDDING_DIM,
    },
    {
        "title": "AIG CyberEdge Enterprise Liability — Clause 12.1",
        "clause": "Covers first-party and third-party losses from cyber incidents including data breach, ransomware, and business interruption.",
        "coverage": "Up to policy limit per incident. Crisis management and notification costs included. Forensic investigation costs covered.",
        "exclusions": ["Known vulnerabilities not patched", "Intentional acts", "Losses from unencrypted portable devices"],
        "claim_type": "cyber",
        "text": "AIG CyberEdge Enterprise cyber liability for data breach, ransomware, business interruption and crisis management costs.",
        "embedding": [0.0] * EMBEDDING_DIM,
    },
    {
        "title": "AIG Commercial Property — All-Risk Cover Section 5",
        "clause": "All-risk cover for commercial buildings and contents against fire, flood, storm, impact, and malicious damage.",
        "coverage": "Replacement cost value for building. Agreed value for contents. Business interruption up to 12 months.",
        "exclusions": ["Wear and tear", "Faulty design or workmanship", "Gradual deterioration"],
        "claim_type": "commercial_property",
        "text": "AIG Commercial Property all-risk coverage for buildings and contents against fire, flood, storm, malicious damage and business interruption.",
        "embedding": [0.0] * EMBEDDING_DIM,
    },
]

now = datetime.now(timezone.utc)
two_weeks_ago  = now - timedelta(days=14)
three_weeks_ago = now - timedelta(days=21)

DEMO_CLAIMS = [
    # ── Clean — auto approved ─────────────────────────────────────────────────
    {
        "claim_id": "DEMO-A-001",
        "claimant_name": "Michael Chen",
        "claim_type": "motor",
        "description": "Rear-end collision on I-90 highway. Rear bumper and boot lid damaged. Repair quote from certified body shop attached.",
        "amount": 8500, "language": "en",
        "documents_provided": ["vehicle registration", "driver license", "repair estimate"],
        "status": "approved", "agent_trace": [],
        "decision": {
            "verdict": "approved", "confidence": 0.92,
            "reasoning": "Approved under AIG Commercial Motor OD Clause 4.2. Documents complete. No fraud signals detected.",
            "fraud_score": 8, "policy_match": "AIG Commercial Motor OD — Clause 4.2",
            "policy_similarity": 0.91, "risk_level": "LOW",
            "settlement_amount": 8075, "missing_documents": [],
            "ring_detected": False, "ring_id": None, "connected_claims": [],
        },
        "created_at": now, "updated_at": now,
    },
    # ── High fraud score — flagged ────────────────────────────────────────────
    {
        "claim_id": "DEMO-B-001",
        "claimant_name": "Sarah Williams",
        "claim_type": "health",
        "description": "Hospitalisation for fever treatment. Third claim in 31 days at same facility.",
        "amount": 28500, "language": "en",
        "documents_provided": ["hospital bill"],
        "status": "flagged", "agent_trace": [],
        "decision": {
            "verdict": "flagged", "confidence": 0.89,
            "reasoning": "High fraud risk: 3rd claim in 31 days, same facility, amount 67% above benchmark for claim type.",
            "fraud_score": 89, "policy_match": "Global Health Insurance — Comprehensive Cover Section 7.1",
            "policy_similarity": 0.84, "risk_level": "HIGH",
            "settlement_amount": None,
            "missing_documents": ["discharge summary", "physician prescription", "lab reports"],
            "ring_detected": False, "ring_id": None, "connected_claims": [],
        },
        "created_at": now, "updated_at": now,
    },
    # ── Missing docs — pending ────────────────────────────────────────────────
    {
        "claim_id": "DEMO-C-001",
        "claimant_name": "James Rodriguez",
        "claim_type": "motor_theft",
        "description": "Vehicle not found after overnight parking at Westfield Mall, Chicago. Silver Toyota Camry. Police report filed.",
        "amount": 32000, "language": "en",
        "documents_provided": ["vehicle registration"],
        "status": "pending_docs", "agent_trace": [],
        "decision": {
            "verdict": "pending_docs", "confidence": 0.70,
            "reasoning": "Pending: police report copy and driver license required to proceed. Coverage valid once documents received.",
            "fraud_score": 22, "policy_match": "AIG Auto Theft Coverage — Section 3A",
            "policy_similarity": 0.88, "risk_level": "LOW",
            "settlement_amount": None,
            "missing_documents": ["police report", "driver license", "non-traceable certificate"],
            "ring_detected": False, "ring_id": None, "connected_claims": [],
        },
        "created_at": now, "updated_at": now,
    },
    # ── Fraud Ring (motor_theft, Westfield Mall Chicago, same vehicle description) ──
    {
        "claim_id": "RING-001",
        "claimant_name": "Emma Thompson",
        "claim_type": "motor_theft",
        "description": "Car stolen from parking near Westfield Mall Chicago. Silver Toyota Camry. Reported immediately to police.",
        "amount": 31500, "language": "en",
        "documents_provided": ["vehicle registration", "driver license"],
        "status": "flagged", "agent_trace": [],
        "decision": {
            "verdict": "flagged", "confidence": 0.85,
            "reasoning": "Flagged: Part of fraud ring RING-RING-0. 3 linked motor_theft claims with similar amounts near Westfield Mall Chicago.",
            "fraud_score": 78, "policy_match": "AIG Auto Theft Coverage — Section 3A",
            "policy_similarity": 0.88, "risk_level": "HIGH",
            "settlement_amount": None, "missing_documents": ["police report", "non-traceable certificate"],
            "ring_detected": True, "ring_id": "RING-RING-0",
            "connected_claims": ["RING-002", "RING-003"],
        },
        "created_at": three_weeks_ago, "updated_at": three_weeks_ago,
    },
    {
        "claim_id": "RING-002",
        "claimant_name": "Alex Kim",
        "claim_type": "motor_theft",
        "description": "Vehicle missing from parking near Westfield Mall Chicago. Silver Toyota Camry. Not found next morning.",
        "amount": 32800, "language": "en",
        "documents_provided": ["vehicle registration"],
        "status": "flagged", "agent_trace": [],
        "decision": {
            "verdict": "flagged", "confidence": 0.88,
            "reasoning": "Flagged: Part of fraud ring RING-RING-0. Identical pattern — Westfield Mall Chicago, Silver Toyota Camry, similar amount.",
            "fraud_score": 82, "policy_match": "AIG Auto Theft Coverage — Section 3A",
            "policy_similarity": 0.87, "risk_level": "HIGH",
            "settlement_amount": None, "missing_documents": ["police report", "driver license", "non-traceable certificate"],
            "ring_detected": True, "ring_id": "RING-RING-0",
            "connected_claims": ["RING-001", "RING-003"],
        },
        "created_at": two_weeks_ago, "updated_at": two_weeks_ago,
    },
    {
        "claim_id": "RING-003",
        "claimant_name": "David Park",
        "claim_type": "motor_theft",
        "description": "Car not found in parking lot Westfield Mall Chicago. Silver Toyota Camry parked overnight. Theft reported to authorities.",
        "amount": 31200, "language": "en",
        "documents_provided": ["vehicle registration", "driver license"],
        "status": "escalated", "agent_trace": [],
        "decision": {
            "verdict": "escalated", "confidence": 0.80,
            "reasoning": "Escalated for investigation: 3rd motor theft claim linking Westfield Mall Chicago, Silver Toyota Camry — suspected organised ring.",
            "fraud_score": 75, "policy_match": "AIG Auto Theft Coverage — Section 3A",
            "policy_similarity": 0.89, "risk_level": "HIGH",
            "settlement_amount": None, "missing_documents": ["police report", "non-traceable certificate"],
            "ring_detected": True, "ring_id": "RING-RING-0",
            "connected_claims": ["RING-001", "RING-002"],
        },
        "created_at": now, "updated_at": now,
    },
]

FRAUD_RING = {
    "ring_id": "RING-RING-0",
    "claim_ids": ["RING-001", "RING-002", "RING-003"],
    "signals": [
        "3 motor_theft claims with similar amounts ($31.2K-$32.8K) in 60 days",
        "Descriptions share keywords: westfield, mall, chicago, silver, toyota, camry",
    ],
    "detected_at": two_weeks_ago,
    "last_updated": now,
    "risk_score": 85,
    "claim_type": "motor_theft",
}


# ── Embedding generation ───────────────────────────────────────────────────────

def generate_embeddings(texts: list) -> list:
    """
    Generate VoyageAI embeddings for policy documents.
    Uses voyage-finance-2 (1024-dim) — optimised for financial/insurance text.
    Falls back to zero vectors if VOYAGE_API_KEY is not set.
    """
    api_key = os.getenv("VOYAGE_API_KEY")
    if not api_key:
        print("  ⚠  VOYAGE_API_KEY not set — using zero embeddings.")
        print("     Vector Search will not work until real embeddings are generated.")
        print("     Set VOYAGE_API_KEY in .env and re-run seed_data.py.\n")
        return [[0.0] * EMBEDDING_DIM for _ in texts]

    try:
        import voyageai
        client = voyageai.Client(api_key=api_key)
        print(f"  Generating {len(texts)} embeddings via VoyageAI voyage-finance-2…")
        result = client.embed(texts, model="voyage-finance-2", input_type="document")
        print(f"  ✓ Embeddings generated: {len(result.embeddings)} vectors × {EMBEDDING_DIM} dims\n")
        return result.embeddings
    except Exception as e:
        print(f"  ⚠  VoyageAI error ({e}) — falling back to zero embeddings.\n")
        return [[0.0] * EMBEDDING_DIM for _ in texts]


# ── Seed ──────────────────────────────────────────────────────────────────────

def seed():
    db = get_sync_db()
    no_embeddings = "--no-emb" in sys.argv

    print("═" * 55)
    print("  MongAccentic — Seed Data")
    print("═" * 55 + "\n")

    # Policies with embeddings
    policy_texts = [p["text"] for p in POLICIES]
    embeddings = [[0.0] * EMBEDDING_DIM] * len(POLICIES) if no_embeddings else generate_embeddings(policy_texts)

    db["policies"].drop()
    for p, emb in zip(POLICIES, embeddings):
        doc = {**p, "embedding": emb}
        doc.pop("text", None)  # text field only used for embedding; drop from doc
        db["policies"].insert_one(doc)
        print(f"  ✓ Policy: {p['title'][:48]}")

    # Atlas Vector Search index hint
    print()
    if os.getenv("VOYAGE_API_KEY"):
        print("  📋 Next step: Create Atlas Vector Search index")
        print("     Collection : mongaccentic.policies")
        print("     Index name : policy_vector_index")
        print("     Field      : embedding")
        print(f"     Dimensions : {EMBEDDING_DIM}")
        print("     Similarity : cosine")
    print()

    # Claims
    all_ids = [c["claim_id"] for c in DEMO_CLAIMS]
    db["claims"].delete_many({"claim_id": {"$in": all_ids}})
    for c in DEMO_CLAIMS:
        db["claims"].insert_one(c)
        ring = " [RING]" if c.get("decision", {}).get("ring_detected") else ""
        print(f"  ✓ Claim: {c['claim_id']} — {c['claimant_name']} ({c['status']}){ring}")

    db["claims"].create_index("claim_id", unique=True)
    db["claims"].create_index("status")
    db["audit_trail"].create_index("claim_id")

    # Fraud ring
    db["fraud_rings"].drop()
    db["fraud_rings"].insert_one(FRAUD_RING)
    print(f"\n  ✓ Fraud ring: {FRAUD_RING['ring_id']} — {len(FRAUD_RING['claim_ids'])} linked claims")

    print("\n" + "═" * 55)
    print("  Seed complete!")
    print("═" * 55)


if __name__ == "__main__":
    seed()
