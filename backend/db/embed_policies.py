"""
Embed Policies — standalone script to generate real VoyageAI embeddings
and update them in MongoDB Atlas (without touching claims or other data).

Usage:
  cd backend
  python db/embed_policies.py

Requirements:
  - VOYAGE_API_KEY in .env (get from MongoDB Atlas > AI > Models > API Keys)
  - MONGODB_URI pointing to Atlas (not localhost)

This must be run BEFORE MongoDB Atlas Vector Search will return real results.
Atlas Vector Search index must also exist:
  Collection : mongaccentic.policies
  Index name : policy_vector_index
  Field      : embedding
  Dimensions : 1024
  Similarity : cosine
"""
import os, sys, time
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.mongo import get_sync_db

EMBEDDING_DIM = 1024


def embed_policies():
    api_key = os.getenv("VOYAGE_API_KEY")
    if not api_key:
        print("ERROR: VOYAGE_API_KEY not set in .env")
        print("Get it from: MongoDB Atlas > AI > Models > API Keys > Copy value")
        sys.exit(1)

    print("═" * 55)
    print("  MongAccentic — Policy Embedding Generator")
    print("═" * 55 + "\n")

    db = get_sync_db()
    policies = list(db["policies"].find({}, {"_id": 1, "title": 1, "text": 1, "clause": 1, "claim_type": 1}))

    if not policies:
        print("  ⚠  No policies found in database.")
        print("     Run seed_data.py first to populate policies.\n")
        sys.exit(1)

    print(f"  Found {len(policies)} policies to embed\n")

    # Build text list — use 'text' field if available, else reconstruct from title+clause
    texts = []
    for p in policies:
        text = p.get("text") or f"{p.get('title', '')}. {p.get('clause', '')}"
        texts.append(text)
        print(f"  → {p.get('title', str(p['_id']))[:55]}")

    print(f"\n  Generating {len(texts)} embeddings via VoyageAI voyage-finance-2…")
    t0 = time.time()

    try:
        import voyageai
        client = voyageai.Client(api_key=api_key)
        result = client.embed(texts, model="voyage-finance-2", input_type="document")
        embeddings = result.embeddings
    except ImportError:
        print("  ERROR: voyageai package not installed. Run: pip install voyageai")
        sys.exit(1)
    except Exception as e:
        print(f"  ERROR: VoyageAI call failed: {e}")
        sys.exit(1)

    elapsed = time.time() - t0
    print(f"  ✓ {len(embeddings)} embeddings generated in {elapsed:.1f}s\n")

    print("  Updating MongoDB…")
    updated = 0
    for policy, emb in zip(policies, embeddings):
        db["policies"].update_one(
            {"_id": policy["_id"]},
            {"$set": {"embedding": emb}},
        )
        updated += 1
        print(f"  ✓ Updated: {policy.get('title', str(policy['_id']))[:50]}")

    print(f"\n  {updated} policies updated with real {EMBEDDING_DIM}-dim embeddings")
    print("\n" + "═" * 55)
    print("  Done! MongoDB Atlas Vector Search is now active.")
    print("  Ensure policy_vector_index exists in Atlas before testing.")
    print("═" * 55)


if __name__ == "__main__":
    embed_policies()
