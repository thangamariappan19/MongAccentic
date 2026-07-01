# MongAccentic — Hackathon Day Quick Start

> Track 2: Agentic AI for Financial Services & Insurance
> MongoDB × Accenture Hackathon 2026

---

## 1. VM Setup (Ubuntu EC2)

The hackathon VM has Python pre-installed at `/root/mongodb-ai-hackathon-env`.

```bash
# Activate the pre-installed env
source /root/mongodb-ai-hackathon-env/bin/activate

# Clone or copy the repo
git clone <repo-url> mongaccentic && cd mongaccentic

# Install backend deps
pip install -r backend/requirements.txt
```

---

## 2. Environment Variables

Copy `.env.example` to `.env` and fill in the hackathon-day credentials:

```bash
cp .env.example backend/.env
nano backend/.env
```

Key values to fill in:
- `MONGODB_URI` — Atlas connection string from organiser portal
- `VOYAGE_API_KEY` — VoyageAI key for embeddings (enables Atlas Vector Search)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — AWS credentials for Bedrock/Claude

---

## 3. Seed MongoDB

```bash
cd backend
python db/seed_data.py
```

This inserts demo claims, fraud rings, and policy documents with VoyageAI embeddings.

After seeding, create the Atlas Vector Search index in the MongoDB Atlas UI:

| Field | Value |
|-------|-------|
| Collection | `mongaccentic.policies` |
| Index name | `policy_vector_index` |
| Path | `embedding` |
| Dimensions | `1024` |
| Similarity | `cosine` |

---

## 4. Start Backend

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Health check: `http://localhost:8000/health`

---

## 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

App is available at: **`http://localhost:3000`**

---

## 6. MongoDB Collections

| Collection | Purpose |
|---|---|
| `claims` | All insurance claims with AI decisions |
| `fraud_rings` | Detected fraud ring groups |
| `policies` | Policy documents + VoyageAI embeddings |
| `submissions` | Underwriting submissions |
| `irdai_benchmarks` | Regulatory benchmark cache (6h TTL) |
| `langgraph_checkpoints` | Agent state checkpointing (LangGraph) |

---

## 7. Agent Pipeline

```
Claim Input
   ↓
Language Agent  → normalise + translate
   ↓
Policy Agent    → MongoDB Atlas Vector Search (voyage-finance-2, 1024-dim)
   ↓
Fraud Agent     → AWS Bedrock / Claude
   ↓
Ring Agent      → MongoDB geo/pattern clustering
   ↓
Decision Agent  → final verdict + confidence
   ↓
MongoDB (claims collection)
```

---

## 8. Demo Script

1. Open `http://localhost:3000` — Dashboard with live stats
2. Submit a new claim via **New Claim** button
3. Watch the agent pipeline process in real-time
4. Check **Fraud Rings** page for ring detection
5. Open **Benchmark** page for IRDAI regulatory comparison
6. Try **Underwriting** for document ingestion + risk scoring

---

## 9. Key Tech Stack

- **MongoDB Atlas** — primary store, Vector Search, LangGraph checkpointing
- **VoyageAI** `voyage-finance-2` — 1024-dim insurance-domain embeddings
- **AWS Bedrock** `anthropic.claude-sonnet-4-6` — fraud reasoning
- **LangGraph** — multi-agent state machine with MongoDB checkpointing
- **FastAPI + Motor** — async Python backend
- **Next.js 14** — TypeScript frontend, Tailwind CSS
