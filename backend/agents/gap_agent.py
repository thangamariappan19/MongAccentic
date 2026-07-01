"""
Gap Analysis Agent
Identifies missing required fields and generates structured guidance for underwriters.
"""
import time

FIELD_GUIDANCE = {
    "construction_type":   "Check the property inspection report, building permit records, or ask the insured directly.",
    "prior_losses_5yr":    "Request a 5-year loss run from the insured's current carrier.",
    "years_in_business":   "Verify from the insured's website, DUNS, or application cover page.",
    "industry_class":      "Look up the NCCI class code using the insured's primary operations description.",
    "mfa_deployed":        "Request IT security attestation — this is required for cyber coverage.",
    "number_of_records":   "Ask the insured to complete the data inventory section of the cyber application.",
    "annual_payroll":      "Request payroll records or the most recent 941 tax filing.",
    "annual_revenue":      "Request the most recent audited financial statement.",
    "total_insured_value": "Request a current appraisal or schedule of values.",
    "prior_claims_5yr":    "Request a 5-year loss run from the insured's current carrier.",
    "prior_incidents":     "Ask the insured to complete the incident history section of the cyber application.",
    "effective_date":      "Confirm the desired inception date with the broker.",
}

DEFAULT_GUIDANCE = "Contact the broker or insured to obtain this information."


async def run_gap_agent(submission_id: str, extracted_fields: dict, field_definitions: list) -> dict:
    start = time.time()
    try:
        missing_required = []
        low_confidence = []
        complete = []

        for fd in field_definitions:
            key = fd["key"]
            entry = extracted_fields.get(key, {})
            value = entry.get("value")
            confidence = entry.get("confidence", 0)
            required = fd.get("required", False)

            if value is None and required:
                missing_required.append({
                    "key": key,
                    "label": fd["label"],
                    "guidance": FIELD_GUIDANCE.get(key, DEFAULT_GUIDANCE),
                    "required": True,
                })
            elif value is not None and confidence < 0.75:
                low_confidence.append({
                    "key": key,
                    "label": fd["label"],
                    "value": value,
                    "confidence": confidence,
                    "guidance": f"Low confidence ({int(confidence * 100)}%) — please verify this value.",
                })
            elif value is not None:
                complete.append(key)

        needs_human = len(missing_required) > 0 or len(low_confidence) > 0
        status = "needs_review" if needs_human else "ready_to_rate"

        return {
            "missing_required": missing_required,
            "low_confidence_fields": low_confidence,
            "complete_fields": complete,
            "missing_count": len(missing_required),
            "low_confidence_count": len(low_confidence),
            "complete_count": len(complete),
            "needs_human_review": needs_human,
            "recommended_status": status,
            "duration_ms": int((time.time() - start) * 1000),
        }
    except Exception as e:
        return {
            "missing_required": [],
            "low_confidence_fields": [],
            "needs_human_review": True,
            "recommended_status": "needs_review",
            "error": str(e),
            "duration_ms": int((time.time() - start) * 1000),
        }
