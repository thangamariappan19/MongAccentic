"""
Fraud Detection Agent
Primary:  AWS Bedrock (Claude anthropic.claude-sonnet-4-6) — intelligent reasoning
Fallback: Rule-based scoring (no credentials required)
"""
import os, json, time

AMOUNT_BENCHMARKS = {
    "motor":            150000,
    "health":           100000,
    "life":             500000,
    "motor_theft":      250000,
    "cyber":            200000,
    "commercial_property": 500000,
}

FRAUD_KEYWORDS   = ["third claim", "multiple claim", "again", "third time", "second claim"]
MINOR_ILLNESS    = ["fever", "cold", "cough", "flu"]


# ── AWS Bedrock / Claude ───────────────────────────────────────────────────────

async def _bedrock_fraud_analysis(claim_data: dict) -> dict | None:
    """
    Call Claude via AWS Bedrock for intelligent fraud reasoning.
    Returns None if AWS credentials not set (triggers rule-based fallback).
    """
    if not os.getenv("AWS_ACCESS_KEY_ID"):
        return None

    start = time.time()
    try:
        import boto3

        description = claim_data.get("description", "")
        claim_type  = claim_data.get("claim_type", "motor")
        amount      = claim_data.get("amount", 0)
        docs        = claim_data.get("documents_provided", [])
        benchmark   = AMOUNT_BENCHMARKS.get(claim_type, 150000)

        prompt = f"""You are an expert insurance fraud analyst. Analyse the claim below and return ONLY a valid JSON object.

Claim details:
- Type: {claim_type}
- Amount: ${amount:,.0f}  (industry benchmark for this type: ${benchmark:,.0f})
- Documents provided: {docs if docs else 'none'}
- Description: {description}

Respond with this exact JSON structure (no markdown, no explanation, just JSON):
{{
  "fraud_score": <integer 0-100, where 100 = definitely fraudulent>,
  "risk_level": "<HIGH|MEDIUM|LOW>",
  "reasoning": "<2-3 sentence explanation of key fraud indicators or lack thereof>",
  "signals": [<list of specific fraud signal strings, empty list if none>]
}}

Scoring guide:
- 0-29   LOW   — routine claim, all checks pass
- 30-69  MEDIUM — some anomalies, warrant closer review
- 70-100 HIGH  — strong fraud indicators, escalate for investigation"""

        region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
        model  = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-sonnet-4-6")

        client = boto3.client("bedrock-runtime", region_name=region)
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 512,
            "messages": [{"role": "user", "content": prompt}],
        }

        response = client.invoke_model(
            modelId=model,
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json",
        )

        raw = json.loads(response["body"].read())
        text = raw["content"][0]["text"].strip()

        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        result = json.loads(text)
        return {
            "fraud_score": int(result.get("fraud_score", 50)),
            "risk_level":  result.get("risk_level", "MEDIUM"),
            "reasoning":   result.get("reasoning", ""),
            "signals":     result.get("signals", []),
            "analysis_method": "aws_bedrock_claude",
            "duration_ms": int((time.time() - start) * 1000),
        }

    except Exception:
        return None  # silently fall through to rule-based


# ── Rule-based fallback ────────────────────────────────────────────────────────

async def _rule_based_fraud_analysis(claim_data: dict) -> dict:
    start = time.time()
    fraud_score = 0
    signals     = []

    amount      = claim_data.get("amount", 0)
    claim_type  = claim_data.get("claim_type", "motor")
    description = claim_data.get("description", "").lower()
    docs        = claim_data.get("documents_provided", [])
    benchmark   = AMOUNT_BENCHMARKS.get(claim_type, 150000)

    if amount > benchmark * 3:
        fraud_score += 40
        signals.append(f"Amount ${amount:,.0f} is {round(amount/benchmark, 1)}x above benchmark")
    elif amount > benchmark * 1.5:
        fraud_score += 20
        signals.append(f"Amount ${amount:,.0f} is above average for {claim_type}")

    word_count = len(description.split())
    if word_count < 5:
        fraud_score += 25
        signals.append("Very vague description")
    elif word_count < 10:
        fraud_score += 10
        signals.append("Brief description")

    if any(k in description for k in FRAUD_KEYWORDS):
        fraud_score += 30
        signals.append("Possible repeat claim pattern")

    if len(docs) == 0:
        fraud_score += 15
        signals.append("No documents provided")
    elif len(docs) == 1:
        fraud_score += 5
        signals.append("Minimal documentation")

    if any(k in description for k in MINOR_ILLNESS) and amount > 50000:
        fraud_score += 20
        signals.append("High claim amount for minor illness")

    fraud_score = min(fraud_score, 100)

    if fraud_score >= 70:
        risk_level = "HIGH"
    elif fraud_score >= 30:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    reasoning = f"Rule-based analysis: {'; '.join(signals)}" if signals else "No significant fraud signals detected"

    return {
        "fraud_score": fraud_score,
        "risk_level":  risk_level,
        "signals":     signals,
        "reasoning":   reasoning,
        "analysis_method": "rule_based_fallback",
        "duration_ms": int((time.time() - start) * 1000),
    }


# ── Public entry point ─────────────────────────────────────────────────────────

async def run_fraud_agent(claim_data: dict) -> dict:
    """
    Tries AWS Bedrock (Claude) first for intelligent reasoning.
    Falls back to rule-based scoring if credentials not available.
    """
    result = await _bedrock_fraud_analysis(claim_data)
    if result:
        return result
    return await _rule_based_fraud_analysis(claim_data)
