"use client";
import { useState, useEffect } from "react";

export type Role = "manager" | "adjuster" | "fraud_analyst" | "underwriter";

export const ROLE_CONTEXT: Record<Role, Record<string, { who: string; action: string }>> = {
  manager: {
    "/":             { who: "Insurance Manager", action: "Monitor claim volumes, fraud alerts, and portfolio health" },
    "/claims":       { who: "Insurance Manager", action: "Review all claims across the portfolio" },
    "/rings":        { who: "Insurance Manager", action: "Review fraud ring alerts and approve SIU escalations" },
    "/advisory":     { who: "Insurance Manager", action: "Use AI insights to guide underwriting and risk strategy" },
    "/benchmark":    { who: "Insurance Manager", action: "Compare portfolio performance against IRDAI benchmarks" },
    "/underwriting": { who: "Insurance Manager", action: "Review pending submissions awaiting underwriter decision" },
  },
  adjuster: {
    "/":             { who: "Claims Adjuster", action: "See your claim queue and today's processing summary" },
    "/claims":       { who: "Claims Adjuster", action: "Process incoming claims — approve, flag, or request documents" },
    "/submit":       { who: "Claims Adjuster", action: "Submit a new claim — 5 AI agents will process it in seconds" },
    "/advisory":     { who: "Claims Adjuster", action: "Understand fraud patterns before processing complex claims" },
  },
  fraud_analyst: {
    "/":             { who: "Fraud Analyst (SIU)", action: "Monitor live fraud alerts and ring detections" },
    "/claims":       { who: "Fraud Analyst (SIU)", action: "Investigate high-fraud-score claims and ring-linked cases" },
    "/rings":        { who: "Fraud Analyst (SIU)", action: "Investigate active schemes — escalate to police or SIU" },
  },
  underwriter: {
    "/":             { who: "Underwriter", action: "Review your submission queue and approval metrics" },
    "/underwriting": { who: "Underwriter", action: "Evaluate and rate new insurance submissions" },
    "/advisory":     { who: "Underwriter", action: "Use portfolio data to inform your underwriting decisions" },
    "/benchmark":    { who: "Underwriter", action: "Verify your pricing is within IRDAI regulatory bounds" },
  },
};

export const ROLE_COLORS: Record<Role, string> = {
  manager:       "#A100FF",
  adjuster:      "#3b82f6",
  fraud_analyst: "#ef4444",
  underwriter:   "#10b981",
};

export const ROLE_LABELS: Record<Role, string> = {
  manager:       "Insurance Manager",
  adjuster:      "Claims Adjuster",
  fraud_analyst: "Fraud Analyst · SIU",
  underwriter:   "Underwriter",
};

export function useRole(): Role {
  const [role, setRole] = useState<Role>("manager");
  useEffect(() => {
    const saved = localStorage.getItem("demo_role") as Role | null;
    if (saved && ["manager", "adjuster", "fraud_analyst", "underwriter"].includes(saved)) {
      setRole(saved);
    }
  }, []);
  return role;
}
