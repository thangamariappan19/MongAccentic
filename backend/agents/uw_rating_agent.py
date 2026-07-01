"""
Underwriting Rating Agent
Computes indicative premiums based on extracted/verified underwriting fields.
Uses industry-standard rating methodology (simplified actuarial tables).
"""
import time
from datetime import datetime, timezone

BASE_RATES = {
    "commercial_property": 0.0025,
    "general_liability":   0.0180,
    "workers_comp":        0.0210,
    "cyber":               0.0045,
}

LOB_LABELS = {
    "commercial_property": "Commercial Property",
    "general_liability":   "General Liability",
    "workers_comp":        "Workers Compensation",
    "cyber":               "Cyber Liability",
}


def _val(fields: dict, key: str, default=0):
    entry = fields.get(key, {})
    if isinstance(entry, dict):
        return entry.get("value") or default
    return default


async def run_uw_rating_agent(submission_id: str, fields: dict, lob: str) -> dict:
    start = time.time()
    try:
        factors = []
        risk_score = 30  # base

        if lob == "commercial_property":
            exposure = float(_val(fields, "total_insured_value", 1_000_000))
            base = round(exposure * BASE_RATES["commercial_property"])

            # Construction type loading
            construction = str(_val(fields, "construction_type", "Unknown"))
            c_factor = {"Frame": 1.40, "Masonry": 1.00, "Steel": 0.80, "Mixed": 1.20}.get(construction, 1.15)
            if c_factor != 1.00:
                adj = round(base * (c_factor - 1))
                factors.append({"label": f"Construction type: {construction}", "adjustment": adj, "type": "load" if adj > 0 else "credit"})
                risk_score += 15 if construction == "Frame" else (-5 if construction == "Steel" else 5)

            # Year built loading
            year = int(_val(fields, "year_built", 2000))
            if year < 1970:
                adj = round(base * 0.25)
                factors.append({"label": f"Building age: pre-1970 ({year})", "adjustment": adj, "type": "load"})
                risk_score += 20
            elif year < 1990:
                adj = round(base * 0.10)
                factors.append({"label": f"Building age: 1970s-1980s ({year})", "adjustment": adj, "type": "load"})
                risk_score += 10

            # Prior losses
            losses = float(_val(fields, "prior_losses_5yr", 0))
            if losses > 0:
                l_factor = 1.25 if losses < 3 else 1.55
                adj = round(base * (l_factor - 1))
                factors.append({"label": f"Prior losses: {int(losses)} in 5 years", "adjustment": adj, "type": "load"})
                risk_score += int(losses * 12)

        elif lob == "general_liability":
            exposure = float(_val(fields, "annual_revenue", 1_000_000))
            base = round(exposure * BASE_RATES["general_liability"])

            # Industry loading (restaurant)
            industry = str(_val(fields, "industry_type", "")).lower()
            if "restaurant" in industry or "food" in industry or "bar" in industry:
                adj = round(base * 0.20)
                factors.append({"label": "Industry loading: Food & Beverage", "adjustment": adj, "type": "load"})
                risk_score += 15

            # Prior claims
            claims = float(_val(fields, "prior_claims_5yr", 0))
            if claims > 0:
                adj = round(base * (0.25 * min(claims, 3)))
                factors.append({"label": f"Prior claims: {int(claims)} in 5 years", "adjustment": adj, "type": "load"})
                risk_score += int(claims * 10)

        elif lob == "workers_comp":
            exposure = float(_val(fields, "annual_payroll", 1_000_000))
            base = round(exposure * BASE_RATES["workers_comp"])

            # Experience modifier
            em = float(_val(fields, "experience_modifier", 1.00))
            if em != 1.00:
                adj = round(base * (em - 1))
                label = f"Experience modifier: {em:.2f}"
                factors.append({"label": label, "adjustment": adj, "type": "load" if adj > 0 else "credit"})
                risk_score += int((em - 1) * 50)

            # Safety program credit
            safety = str(_val(fields, "safety_program", "")).lower()
            if "yes" in safety or "iipp" in safety or "documented" in safety:
                adj = -round(base * 0.05)
                factors.append({"label": "Safety program credit: IIPP documented", "adjustment": adj, "type": "credit"})
                risk_score -= 5

            # Prior claims
            claims = float(_val(fields, "prior_claims_5yr", 0))
            if claims > 0:
                adj = round(base * 0.15 * min(claims, 4))
                factors.append({"label": f"Prior WC claims: {int(claims)} in 5 years", "adjustment": adj, "type": "load"})
                risk_score += int(claims * 8)

        elif lob == "cyber":
            exposure = float(_val(fields, "annual_revenue", 1_000_000))
            base = round(exposure * BASE_RATES["cyber"])

            # MFA missing — critical
            mfa = str(_val(fields, "mfa_deployed", "")).lower()
            if not mfa or mfa in ["none", "no", "partial", ""]:
                adj = round(base * 0.40)
                factors.append({"label": "MFA not confirmed enterprise-wide", "adjustment": adj, "type": "load"})
                risk_score += 35

            # Healthcare loading
            industry = str(_val(fields, "industry_type", "")).lower()
            if "health" in industry or "medical" in industry or "hospital" in industry:
                adj = round(base * 0.15)
                factors.append({"label": "Sector loading: Healthcare", "adjustment": adj, "type": "load"})
                risk_score += 12

            # Prior incidents
            incidents = float(_val(fields, "prior_incidents", 0))
            if incidents > 0:
                adj = round(base * 0.50 * min(incidents, 3))
                factors.append({"label": f"Prior cyber incidents: {int(incidents)}", "adjustment": adj, "type": "load"})
                risk_score += int(incidents * 20)

            # EDR credit
            edr = str(_val(fields, "edr_deployed", "")).lower()
            if "yes" in edr or "crowdstrike" in edr or "sentinelone" in edr or "deployed" in edr:
                adj = -round(base * 0.08)
                factors.append({"label": "EDR solution deployed", "adjustment": adj, "type": "credit"})
                risk_score -= 8

            # Large record count loading
            records = float(_val(fields, "number_of_records", 0))
            if records > 100_000:
                adj = round(base * 0.10)
                factors.append({"label": f"Large data footprint: {int(records):,} records", "adjustment": adj, "type": "load"})
                risk_score += 10
        else:
            exposure = 1_000_000
            base = round(exposure * 0.002)

        # Expense and profit loading (+5%)
        total_adjustments = sum(f["adjustment"] for f in factors)
        technical_premium = base + total_adjustments
        expense_load = round(technical_premium * 0.05)
        factors.append({"label": "Expense & profit loading (5%)", "adjustment": expense_load, "type": "load"})
        final_premium = technical_premium + expense_load

        risk_score = max(10, min(100, risk_score))
        tier = "A" if risk_score < 40 else "B" if risk_score < 65 else "C" if risk_score < 80 else "D"
        tier_label = {"A": "Standard", "B": "Preferred Standard", "C": "Non-Standard", "D": "High Risk / Decline"}

        return {
            "lob": lob,
            "lob_label": LOB_LABELS.get(lob, lob),
            "exposure_base": round(exposure),
            "base_premium": base,
            "factors": factors,
            "technical_premium": technical_premium,
            "final_premium": final_premium,
            "risk_score": risk_score,
            "risk_tier": tier,
            "tier_label": tier_label[tier],
            "coverage_limit": float(_val(fields, "requested_limit", exposure)),
            "confidence": 0.88,
            "computed_at": datetime.now(timezone.utc).isoformat(),
            "duration_ms": int((time.time() - start) * 1000),
        }

    except Exception as e:
        return {
            "error": str(e),
            "final_premium": 0,
            "risk_score": 50,
            "risk_tier": "B",
            "duration_ms": int((time.time() - start) * 1000),
        }
