from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class ClaimType(str, Enum):
    motor = "motor"
    health = "health"
    life = "life"
    motor_theft = "motor_theft"

class Verdict(str, Enum):
    approved = "approved"
    flagged = "flagged"
    rejected = "rejected"
    pending_docs = "pending_docs"
    escalated = "escalated"

class RiskLevel(str, Enum):
    low = "LOW"
    medium = "MEDIUM"
    high = "HIGH"

class AgentStatus(str, Enum):
    pending = "pending"
    running = "running"
    done = "done"
    failed = "failed"

class ClaimSubmit(BaseModel):
    claimant_name: str
    claim_type: ClaimType
    description: str
    amount: float
    language: Optional[str] = "en"
    documents_provided: Optional[List[str]] = []

class OverrideSubmit(BaseModel):
    adjuster_id: str
    verdict: Verdict
    reasoning: str

class AgentStep(BaseModel):
    agent_name: str
    status: AgentStatus
    result: Optional[dict] = None
    duration_ms: Optional[int] = None

class Decision(BaseModel):
    verdict: Verdict
    confidence: float
    reasoning: str
    fraud_score: float
    policy_match: Optional[str] = None
    policy_similarity: Optional[float] = None
    risk_level: RiskLevel
    settlement_amount: Optional[float] = None
    missing_documents: Optional[List[str]] = []
    ring_detected: Optional[bool] = False
    ring_id: Optional[str] = None
    connected_claims: Optional[List[str]] = []

class ClaimResponse(BaseModel):
    claim_id: str
    status: Verdict
    claimant_name: str
    claim_type: ClaimType
    amount: float
    agent_trace: List[AgentStep] = []
    decision: Optional[Decision] = None
    advisory: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

class ClaimListItem(BaseModel):
    claim_id: str
    claimant_name: str
    claim_type: ClaimType
    amount: float
    status: Verdict
    fraud_score: Optional[float] = None
    created_at: datetime

class AnalyticsResponse(BaseModel):
    total_claims: int
    approved: int
    flagged: int
    escalated: int
    pending_docs: int
    avg_fraud_score: float
    avg_processing_ms: float
    by_type: Optional[Dict[str, int]] = {}
    ring_count: Optional[int] = 0
    high_risk_count: Optional[int] = 0
