# MongAccentic — Complete Build & Setup Guide

> Copy-paste this file to rebuild the entire app on any VM from scratch.
> All steps are ordered. Do them top to bottom without skipping.

---

## What You're Building

**MongAccentic** — FSI Insurance AI Platform for Accenture Hackathon 2025

| Component | Tech | Port |
|---|---|---|
| Backend API | FastAPI + uvicorn (Python 3.12) | 8000 |
| Frontend | Next.js 16 + React 19 + TypeScript | 3000 |
| Database | MongoDB Atlas (cloud) | Atlas-hosted |
| AI Agents | 10 agents via LangGraph StateGraph | — |
| LLM | AWS Bedrock — Claude Sonnet 4.6 | — |
| Embeddings | VoyageAI voyage-finance-2 (1024-dim) | — |

---

## Prerequisites — Install These First

### 1. Python 3.12+
```bash
# Verify
python --version   # must be 3.12+

# Windows: download from https://python.org/downloads
# Ubuntu/Debian:
sudo apt update && sudo apt install python3.12 python3.12-venv python3-pip -y
```

### 2. Node.js 20 LTS+
```bash
# Verify
node --version   # must be 20+
npm --version

# Windows: https://nodejs.org/en/download
# Ubuntu:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
```

### 3. Git
```bash
git --version
# Ubuntu: sudo apt install git -y
```

### 4. (Optional) Docker — for containerised backend
```bash
docker --version
# Ubuntu: sudo apt install docker.io -y
```

---

## Step 1 — Get the Code

```bash
# If you have the zip/folder, copy it to the VM and skip this step.
# If cloning from git:
git clone <your-repo-url> mongaccentic
cd mongaccentic
```

Your project root must contain:
```
mongaccentic/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── agents/
│   └── db/
├── frontend/
│   ├── package.json
│   └── app/
├── demo_docs/          ← 9 sample PDFs for demo uploads
├── .env.example
├── BUILD.md            ← this file
└── ARCHITECTURE_REPORT.html
```

---

## Step 2 — Create the `.env` File

Copy the template and fill in your credentials:

```bash
# From the project root:
cp .env.example .env
```

Then open `.env` and set every value:

```env
# ─── MongoDB Atlas ────────────────────────────────────────────────────────────
# Get from: MongoDB Atlas → Connect → Drivers → Python connection string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/mongaccentic?retryWrites=true&w=majority&appName=<appName>

# ─── VoyageAI (Embeddings) ───────────────────────────────────────────────────
# Get from: https://www.voyageai.com → API Keys
# Used for: semantic policy matching via MongoDB Atlas $vectorSearch
VOYAGE_API_KEY=pa-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── AWS Bedrock (LLM) ───────────────────────────────────────────────────────
# Get from: AWS Console → IAM → Users → Security credentials
# Required permissions: bedrock:InvokeModel
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_DEFAULT_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-6

# ─── LangSmith (Optional — tracing/debugging only) ───────────────────────────
LANGCHAIN_TRACING_V2=false
LANGCHAIN_PROJECT=mongaccentic
LANGCHAIN_API_KEY=
```

> **If you don't have AWS or VoyageAI credentials:** the app still runs fully.
> All agents have rule-based fallbacks — perfect for demo without cloud credentials.

---

## Step 3 — MongoDB Atlas Setup

### 3a. Create Atlas Cluster (if not already done)
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Create a database user with read/write access
4. Whitelist `0.0.0.0/0` (allow all IPs) under Network Access
5. Copy the connection string into `MONGODB_URI` in `.env`

### 3b. Create the Vector Search Index (REQUIRED for semantic policy search)

In MongoDB Atlas UI:
1. Select your cluster → **Atlas Search** tab
2. Click **Create Search Index** → **JSON Editor**
3. Select database: `mongaccentic`, collection: `policies`
4. Index name: `policy_vector_index`
5. Paste this JSON definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1024,
      "similarity": "cosine"
    }
  ]
}
```

6. Click **Create** and wait ~2 minutes for the index to build.

> **Without this index:** policy matching falls back to rule-based lookup (still works for demo).

---

## Step 4 — Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt
```

This installs (key packages):
| Package | Purpose |
|---|---|
| `fastapi>=0.115` | REST API + WebSocket |
| `uvicorn>=0.30` | ASGI server |
| `motor>=3.7` | Async MongoDB driver |
| `langgraph>=0.2.50` | Multi-agent StateGraph |
| `langchain-anthropic>=0.3` | Anthropic Claude integration |
| `boto3>=1.35` | AWS SDK for Bedrock |
| `voyageai>=0.3` | VoyageAI embeddings |
| `langgraph-checkpoint-mongodb` | Agent state persistence |
| `pydantic>=2.9` | Schema validation |
| `python-dotenv>=1.0` | Load .env file |

---

## Step 5 — Seed the Database

```bash
# Still in backend/ with venv activated
# Make sure .env exists at the project ROOT (one level up from backend/)

python db/seed_data.py
```

This will:
- Create all required MongoDB collections
- Insert demo insurance policies with VoyageAI embeddings (if VOYAGE_API_KEY is set)
- Insert sample claims and fraud rings for the demo dashboard
- Create agent_memory and irdai_benchmarks seed data

Expected output:
```
[seed] Connected to MongoDB
[seed] Inserted 8 policies with embeddings
[seed] Inserted 12 demo claims
[seed] Inserted 3 fraud rings
[seed] Done.
```

> If VOYAGE_API_KEY is not yet set, run with the no-embedding flag:
> ```bash
> python db/seed_data.py --no-emb
> ```
> This skips embedding generation (uses zero vectors) — claims and fraud ring demo data still seeds correctly.

---

## Step 6 — Start the Backend

```bash
# From the backend/ directory, venv activated:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Verify it's running — open in browser or curl:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "team": "MongAccentic",
  "track": "Track 2",
  "version": "2.0",
  "agents": ["fraud_detection", "policy_matching", "ring_detection", "risk_assessment", "financial_advisory", "decision_maker", "audit_writer"]
}
```

Other endpoints to verify:
```bash
curl http://localhost:8000/api/claims        # list claims
curl http://localhost:8000/api/rings         # fraud rings
curl http://localhost:8000/api/advisory      # portfolio advice
curl http://localhost:8000/api/benchmark     # IRDAI benchmarks
```

---

## Step 7 — Frontend Setup

Open a **new terminal** (keep backend running):

```bash
# From the project ROOT (not backend/):
cd frontend

# Install Node dependencies
npm install

# Create the frontend environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

---

## Step 8 — Start the Frontend

```bash
# From frontend/ directory:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the MongAccentic dashboard with:
- Live KPI cards (claims processed, fraud rate, avg settlement)
- Claims table with AI decisions
- Fraud ring alerts
- Navigation sidebar with 7-chapter story flow

---

## Step 9 — Verify Everything Works

Run through this checklist:

```
[ ] http://localhost:8000/health → returns {"status":"ok"}
[ ] http://localhost:3000        → dashboard loads, KPI cards show data
[ ] /submit page                 → form displays with 2-column layout
[ ] /claims                      → claims list with AI decisions visible
[ ] /rings                       → fraud network graph renders
[ ] /advisory                    → AI recommendations visible
[ ] /benchmark                   → IRDAI table renders
[ ] /underwriting                → submission form works
```

---

## Step 10 — Test Claim Submission (Demo Flow)

1. Go to [http://localhost:3000/submit](http://localhost:3000/submit)
2. Fill in:
   - **Claimant:** Any name
   - **Claim Type:** Motor / Health / Theft / Cyber
   - **Amount:** 75000
   - **Description:** "Vehicle collision on highway, total damage"
3. Upload documents from `demo_docs/` folder:
   - `set1_motor_repair_estimate.pdf` + `set1_vehicle_registration.pdf` (normal motor claim)
   - `set3_police_fir_report.pdf` + `set3_non_traceable_certificate.pdf` (triggers fraud ring)
4. Click **Submit Claim**
5. Watch the animated agent pipeline execute in real-time
6. See the AI verdict (approved / flagged / escalated)

---

## Docker Option (Backend Only)

If you prefer running the backend in a container:

```bash
# Build image (from project root)
docker build -t mongaccentic-backend backend/

# Run container — pass all env vars
docker run -d \
  -p 8000:8000 \
  --name mongaccentic-api \
  -e MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/mongaccentic" \
  -e VOYAGE_API_KEY="pa-xxxxxxxx" \
  -e AWS_ACCESS_KEY_ID="AKIAxxxxxxxx" \
  -e AWS_SECRET_ACCESS_KEY="xxxxxxxx" \
  -e AWS_DEFAULT_REGION="us-east-1" \
  -e BEDROCK_MODEL_ID="anthropic.claude-sonnet-4-6" \
  mongaccentic-backend

# Check logs
docker logs mongaccentic-api
```

Then run the frontend with `npm run dev` as normal.

---

## Environment Variables — Complete Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | YES | `mongodb://localhost:27017/mongaccentic` | MongoDB Atlas connection string |
| `VOYAGE_API_KEY` | For vector search | — | VoyageAI embeddings (1024-dim, voyage-finance-2) |
| `AWS_ACCESS_KEY_ID` | For LLM reasoning | — | AWS IAM key for Bedrock |
| `AWS_SECRET_ACCESS_KEY` | For LLM reasoning | — | AWS IAM secret for Bedrock |
| `AWS_DEFAULT_REGION` | No | `us-east-1` | AWS region |
| `BEDROCK_MODEL_ID` | No | `anthropic.claude-sonnet-4-6` | Claude model via Bedrock |
| `LANGCHAIN_TRACING_V2` | No | `false` | LangSmith tracing (debug only) |
| `LANGCHAIN_PROJECT` | No | `mongaccentic` | LangSmith project name |
| `LANGCHAIN_API_KEY` | No | — | LangSmith API key |

---

## Key Files Reference

| File | Purpose |
|---|---|
| `backend/main.py` | FastAPI app entry point, all routes |
| `backend/requirements.txt` | All Python dependencies |
| `backend/Dockerfile` | Docker image (python:3.12-slim, port 8000) |
| `backend/agents/orchestrator.py` | LangGraph StateGraph pipeline |
| `backend/agents/fraud_agent.py` | Fraud detection (Bedrock + fallback) |
| `backend/agents/policy_agent.py` | Policy matching ($vectorSearch + fallback) |
| `backend/agents/document_agent.py` | Document intelligence (Bedrock) |
| `backend/db/mongo.py` | Motor async client + collection accessors |
| `backend/db/checkpoint.py` | LangGraph MongoDB checkpoint store |
| `backend/db/seed_data.py` | Demo data seeding script |
| `frontend/app/page.tsx` | Ch1: Dashboard |
| `frontend/app/submit/page.tsx` | Ch2: Submit Claim |
| `frontend/app/claims/page.tsx` | Ch3: AI Decisions |
| `frontend/app/rings/page.tsx` | Ch4: Fraud Rings |
| `frontend/app/advisory/page.tsx` | Ch5: Portfolio Insights |
| `frontend/app/benchmark/page.tsx` | Ch6: IRDAI Benchmark |
| `frontend/app/underwriting/page.tsx` | Ch7: Underwriting |
| `frontend/components/Sidebar.tsx` | Desktop 7-chapter navigation |
| `frontend/components/MobileNav.tsx` | Mobile hamburger + drawer nav |
| `frontend/lib/api.ts` | Typed frontend API client |
| `demo_docs/` | 9 sample PDFs for upload demos |
| `ARCHITECTURE_REPORT.html` | Open in browser — full architecture diagram |

---

## MongoDB Collections — Quick Setup Check

```bash
# Run from backend/ with venv activated:
python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
load_dotenv('../.env')

async def check():
    client = AsyncIOMotorClient(os.getenv('MONGODB_URI'))
    db = client['mongaccentic']
    colls = await db.list_collection_names()
    print('Collections:', colls)
    count = await db['claims'].count_documents({})
    print('Claims count:', count)
    await client.close()

asyncio.run(check())
"
```

Expected: all 7 collections listed, claims count > 0.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` again inside the venv |
| `Connection refused localhost:8000` | Backend not running — check Step 6 |
| Frontend shows "Failed to fetch" | Check `frontend/.env.local` has correct `NEXT_PUBLIC_API_URL` |
| Claims pipeline returns rule-based only | AWS credentials not set — normal for demo, all fallbacks work |
| Vector search returns no results | Atlas vector index not created or still building — wait 2 min |
| `uvicorn: command not found` | Venv not activated — run `venv\Scripts\activate` (Windows) |
| Port 8000 already in use | `lsof -i:8000` then kill, or change to `--port 8001` (update `.env.local` too) |
| MongoDB auth failed | Re-check MONGODB_URI username/password, ensure IP whitelisted in Atlas |

---

## Quick Start (TL;DR — All Commands)

```bash
# 1. Root setup
cp .env.example .env
# → edit .env with your credentials

# 2. Backend
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python db/seed_data.py
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 3. Frontend (new terminal, from project root)
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev

# 4. Open http://localhost:3000
```

---

*MongAccentic · Accenture Hackathon 2025 · MongoDB Atlas + AWS Bedrock + LangGraph + Next.js 16*
