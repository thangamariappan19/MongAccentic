from db.mongo import get_policies_col

async def search_policy(embedding: list, top_k: int = 1):
    col = get_policies_col()
    pipeline = [
        {
            "$vectorSearch": {
                "index": "policy_vector_index",
                "path": "embedding",
                "queryVector": embedding,
                "numCandidates": 20,
                "limit": top_k,
            }
        },
        {
            "$project": {
                "_id": 0,
                "title": 1,
                "clause": 1,
                "coverage": 1,
                "exclusions": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
    ]
    results = await col.aggregate(pipeline).to_list(top_k)
    return results[0] if results else None
