"""
Bulk demo data seed for richer dashboard numbers.
Uses upsert on claim_id — safe to run multiple times.
Usage: cd backend && python db/seed_bulk.py
"""
import os, sys
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.mongo import get_sync_db

now = datetime.now(timezone.utc)
def d(n): return now - timedelta(days=n)

def mk(cid, name, ctype, desc, amt, docs, status, fraud, verdict, reasoning, settlement, policy, missing, ring_id=None, connected=None, days_ago=30):
    dt = d(days_ago)
    return {
        "claim_id": cid, "claimant_name": name, "claim_type": ctype,
        "description": desc, "amount": amt, "language": "en",
        "documents_provided": docs, "status": status, "agent_trace": [],
        "created_at": dt, "updated_at": dt,
        "decision": {
            "verdict": verdict, "confidence": round(0.85 + (hash(cid) % 12) / 100, 2),
            "fraud_score": fraud, "risk_level": "HIGH" if fraud > 70 else ("MEDIUM" if fraud > 40 else "LOW"),
            "reasoning": reasoning, "settlement_amount": settlement,
            "policy_match": policy, "policy_similarity": round(0.84 + (hash(cid) % 10) / 100, 2),
            "missing_documents": missing,
            "ring_detected": ring_id is not None, "ring_id": ring_id,
            "connected_claims": connected or [],
        },
    }

MOTOR_POLICY   = "AIG Commercial Motor OD — Clause 4.2"
HEALTH_POLICY  = "Global Health Insurance — Comprehensive Cover Section 7.1"
LIFE_POLICY    = "Zurich Life Term Assurance — Policy Schedule Clause 2"
THEFT_POLICY   = "AIG Auto Theft Coverage — Section 3A"
CYBER_POLICY   = "AIG CyberEdge Enterprise Liability — Clause 12.1"
PROP_POLICY    = "AIG Commercial Property — All-Risk Cover Section 5"

STD_MOTOR = ["vehicle registration", "driver license", "repair estimate"]
STD_HEALTH = ["discharge summary", "hospital bill", "physician report"]
STD_LIFE   = ["death certificate", "medical certificate", "beneficiary ID", "policy schedule"]
STD_THEFT  = ["vehicle registration", "driver license", "police report", "non-traceable certificate"]

APPROVED = [
    mk("BULK-A-001","Liam Patterson","motor","Rear-end collision on M25, wing mirror and boot lid damaged.",12400,STD_MOTOR+["police report"],"approved",6,"approved","Clean claim, documents complete.",11780,MOTOR_POLICY,[],days_ago=82),
    mk("BULK-A-002","Sophia Martinez","motor","Side-swipe in heavy rain, passenger door damaged.",7800,STD_MOTOR,"approved",9,"approved","Weather corroborated by traffic report.",7410,MOTOR_POLICY,[],days_ago=77),
    mk("BULK-A-003","Ethan Nakamura","motor","Car park bollard collision, Heathrow Terminal 5.",5200,STD_MOTOR+["CCTV footage"],"approved",4,"approved","CCTV confirms incident.",4940,MOTOR_POLICY,[],days_ago=71),
    mk("BULK-A-004","Isabella Turner","motor","Hail damage to bonnet and windscreen, Manchester storm.",9600,STD_MOTOR+["weather report"],"approved",7,"approved","Weather event confirmed.",9120,MOTOR_POLICY,[],days_ago=65),
    mk("BULK-A-005","Noah Andersson","motor","Deer collision on rural A9. Bonnet and grille damaged.",6700,STD_MOTOR+["police report"],"approved",11,"approved","Wildlife collision confirmed.",6365,MOTOR_POLICY,[],days_ago=58),
    mk("BULK-A-006","Charlotte Okafor","motor","Vehicle submerged in flash flood, Leeds city centre.",28500,STD_MOTOR+["weather report","flood zone certificate"],"approved",5,"approved","Total flood loss. IDV authorised.",27075,MOTOR_POLICY,[],days_ago=52),
    mk("BULK-A-007","Aiden Walsh","motor","Engine fire on Birmingham ring road. Total loss.",41000,STD_MOTOR+["fire brigade report","IDV certificate"],"approved",14,"approved","Engine fire confirmed. Total loss declared.",38950,MOTOR_POLICY,[],days_ago=47),
    mk("BULK-A-008","Mia Johansson","motor","Minor fender bender at Bluewater Shopping Centre.",3200,STD_MOTOR,"approved",3,"approved","Minor claim, amount reasonable.",3040,MOTOR_POLICY,[],days_ago=41),
    mk("BULK-A-009","Oliver Bennett","health","Emergency appendectomy, Royal London Hospital. 3-day stay.",34500,STD_HEALTH+["lab reports"],"approved",5,"approved","Emergency surgical procedure, complete documentation.",32775,HEALTH_POLICY,[],days_ago=85),
    mk("BULK-A-010","Amelia Clarke","health","Knee replacement surgery, St Thomas Hospital. 5-day stay.",52000,STD_HEALTH+["pre-auth letter"],"approved",8,"approved","Pre-authorised elective surgery, all documents verified.",49400,HEALTH_POLICY,[],days_ago=80),
    mk("BULK-A-011","Henry Osei","health","Cardiac stent, Barts Hospital. ICU overnight observation.",61500,STD_HEALTH+["pre-auth letter","ECG reports"],"approved",4,"approved","Pre-authorised cardiac intervention.",58425,HEALTH_POLICY,[],days_ago=74),
    mk("BULK-A-012","Grace Petrov","health","Laparoscopic cholecystectomy, daycare procedure.",18500,STD_HEALTH,"approved",6,"approved","Daycare procedure covered, documents complete.",17575,HEALTH_POLICY,[],days_ago=68),
    mk("BULK-A-013","Jack Fernandez","health","Cataract surgery left eye, daycare, lens implant.",12000,STD_HEALTH,"approved",7,"approved","Standard daycare cataract covered.",11400,HEALTH_POLICY,[],days_ago=62),
    mk("BULK-A-014","Lily Nakamura","health","Dengue hospitalisation, Apollo Hospital Singapore. 4 days.",9800,STD_HEALTH+["lab reports"],"approved",9,"approved","Dengue confirmed by NS1 antigen test.",9310,HEALTH_POLICY,[],days_ago=55),
    mk("BULK-A-015","William Hassan","health","Hip fracture repair including rehabilitation, 7-day stay.",78000,STD_HEALTH+["X-ray reports","pre-auth letter"],"approved",5,"approved","Major orthopaedic surgery pre-authorised.",74100,HEALTH_POLICY,[],days_ago=49),
    mk("BULK-A-016","Emma Scott","health","Total thyroidectomy, 2-day stay, Manchester Royal Infirmary.",23500,STD_HEALTH+["pathology report"],"approved",8,"approved","Surgical procedure, pathology confirms diagnosis.",22325,HEALTH_POLICY,[],days_ago=43),
    mk("BULK-A-017","Robert Lawson","life","Death from myocardial infarction. All beneficiary docs provided.",250000,STD_LIFE,"approved",3,"approved","Natural cause confirmed. Beneficiary documentation complete.",250000,LIFE_POLICY,[],days_ago=83),
    mk("BULK-A-018","Patricia Nguyen","life","Term life claim — Stage IV cancer. Beneficiary is spouse.",500000,STD_LIFE+["oncologist report"],"approved",4,"approved","Terminal illness confirmed. Full sum assured payable.",500000,LIFE_POLICY,[],days_ago=76),
    mk("BULK-A-019","Thomas O'Brien","life","Accidental death in road accident. Police report attached.",300000,STD_LIFE+["police report","post-mortem report"],"approved",6,"approved","Accidental death rider applicable. Full payout authorised.",300000,LIFE_POLICY,[],days_ago=70),
    mk("BULK-A-020","Jennifer Kowalski","life","Death from stroke, policy in force 8 years.",150000,STD_LIFE,"approved",2,"approved","Natural cause, policy active 8+ years. Approved.",150000,LIFE_POLICY,[],days_ago=63),
    mk("BULK-A-021","Daniel Mbeki","motor_theft","Vehicle stolen from Kings Cross car park, CCTV confirms.",35000,STD_THEFT+["CCTV footage"],"approved",7,"approved","CCTV confirms theft, all documents provided.",33250,THEFT_POLICY,[],days_ago=57),
    mk("BULK-A-022","Rachel Kim","motor_theft","Overnight theft from residential street, Kensington.",42000,STD_THEFT,"approved",12,"approved","Theft confirmed, IDV settlement authorised.",39900,THEFT_POLICY,[],days_ago=50),
    mk("BULK-A-023","FinTech Ltd (A. Fisher)","cyber","Ransomware on payment systems, 48hr BI. Forensics engaged.",185000,["incident report","forensic report","BI log","ransom demand"],"approved",11,"approved","Ransomware confirmed, BI loss within policy limits.",175750,CYBER_POLICY,[],days_ago=44),
    mk("BULK-A-024","TechCorp Solutions","cyber","Data breach, 50K customer records. Notification costs.",95000,["incident report","breach notification","notification invoice"],"approved",9,"approved","Data breach confirmed, notification costs covered.",90250,CYBER_POLICY,[],days_ago=37),
    mk("BULK-A-025","Henderson Retail Group","commercial_property","Fire damage to warehouse roofing and electrical systems.",145000,["fire brigade report","loss adjuster survey","repair estimate"],"approved",7,"approved","Fire confirmed, loss adjuster validates amount.",137750,PROP_POLICY,[],days_ago=30),
    mk("BULK-A-026","Meridian Office Properties","commercial_property","Flood damage from burst water main, ground floor office.",88000,["loss adjuster report","contractor estimate","water board report"],"approved",10,"approved","Water main incident confirmed by utility provider.",83600,PROP_POLICY,[],days_ago=24),
    mk("BULK-A-027","Jessica Hernandez","motor","T-bone collision at junction, Edinburgh. Door and quarter panel.",15600,STD_MOTOR+["police report"],"approved",8,"approved","Police confirms third-party collision.",14820,MOTOR_POLICY,[],days_ago=20),
    mk("BULK-A-028","Chris Bergstrom","motor","Overnight vandalism — keyed paintwork and wing mirrors, Glasgow.",4800,STD_MOTOR+["police incident number"],"approved",13,"approved","Police incident confirmed, repair cost proportionate.",4560,MOTOR_POLICY,[],days_ago=16),
    mk("BULK-A-029","Maria Santos","health","Spinal disc herniation surgery, 3-day Harley Street Clinic.",44000,STD_HEALTH+["MRI reports"],"approved",6,"approved","MRI confirms diagnosis, surgery justified.",41800,HEALTH_POLICY,[],days_ago=12),
    mk("BULK-A-030","Kevin O'Sullivan","health","Bowel resection, emergency admission, 6-day stay.",55000,STD_HEALTH+["pathology report"],"approved",5,"approved","Emergency surgery confirmed, within policy limits.",52250,HEALTH_POLICY,[],days_ago=8),
    mk("BULK-A-031","Laura Bishop","motor","Vehicle rolled on icy A9 north of Perth. Total loss.",22500,STD_MOTOR+["police report","IDV certificate"],"approved",9,"approved","Roll-over confirmed. IDV settlement authorised.",21375,MOTOR_POLICY,[],days_ago=6),
    mk("BULK-A-032","Simon Adeyemi","motor","Side collision with bollard, Bristol multi-storey.",4200,STD_MOTOR,"approved",11,"approved","Minor claim, clean submission.",3990,MOTOR_POLICY,[],days_ago=4),
    mk("BULK-A-033","Nadia Popescu","health","Maternity — delivery and 2-day postnatal care, Whittington Hospital.",14500,["discharge summary","hospital bill","birth certificate"],"approved",3,"approved","Maternity benefit covered.",13775,HEALTH_POLICY,[],days_ago=3),
    mk("BULK-A-034","Patrick Mensah","life","Death from kidney failure, 5-year policy, minor beneficiary.",200000,STD_LIFE+["beneficiary birth certificate"],"approved",2,"approved","Natural death, full sum assured payable to minor.",200000,LIFE_POLICY,[],days_ago=2),
    mk("BULK-A-035","Claire Dubois","health","Breast cancer mastectomy, 4-day stay, Christie NHS Trust.",66000,STD_HEALTH+["biopsy report"],"approved",4,"approved","Oncological surgery confirmed by biopsy.",62700,HEALTH_POLICY,[],days_ago=1),
]

FLAGGED = [
    mk("BULK-F-001","Victor Okonkwo","health","4th hospitalisation in 45 days, same facility, inconsistent diagnoses.",45000,["hospital bill"],"flagged",87,"flagged","4 admissions in 45 days, same facility — high fraud probability.",None,HEALTH_POLICY,["discharge summary","lab reports","treating physician report"],days_ago=79),
    mk("BULK-F-002","Sandra Eriksson","motor","3rd rear-end collision claim in 14 months — staged accident pattern.",18000,["repair estimate"],"flagged",82,"flagged","3 rear-end claims in 14 months — staged accident pattern.",None,MOTOR_POLICY,["police report","driver license","witness statement"],days_ago=72),
    mk("BULK-F-003","Gregory Papadopoulos","health","11-day ICU claim — toxicology inconsistent with billing.",120000,["hospital bill","discharge summary"],"flagged",78,"flagged","ICU billing inconsistent with toxicology findings.",None,HEALTH_POLICY,["toxicology report","treating consultant report"],days_ago=66),
    mk("BULK-F-004","Maria Volkov","motor_theft","Same VIN previously reported stolen 18 months ago, different city.",38000,["vehicle registration","police report"],"flagged",91,"flagged","Duplicate VIN flagged in prior theft claim under different insurer.",None,THEFT_POLICY,["VIN verification","previous insurer letter"],days_ago=60),
    mk("BULK-F-005","Leon Mwangi","commercial_property","Fire, undetermined origin. Business had declining revenue 6 months prior.",280000,["fire brigade report","repair estimate"],"flagged",75,"flagged","Undetermined origin + declining financials — possible arson fraud.",None,PROP_POLICY,["forensic fire investigation","financial statements"],days_ago=53),
    mk("BULK-F-006","Diana Osei-Mensah","health","6 procedures billed same day at different hospitals — impossible.",68000,["hospital bills"],"flagged",95,"flagged","6 simultaneous procedures at different hospitals — billing fraud.",None,HEALTH_POLICY,["each hospital discharge summary"],days_ago=46),
    mk("BULK-F-007","Abdul Rahman Kassim","cyber","Ransomware incident predates policy inception by 3 days.",220000,["incident report"],"flagged",88,"flagged","Incident predates policy inception — coverage does not apply.",None,CYBER_POLICY,["forensic timeline","IT system logs"],days_ago=40),
    mk("BULK-F-008","Helena Christodoulou","motor","Same solicitor filing 5 whiplash claims this month.",14500,["medical report","repair estimate"],"flagged",76,"flagged","Same solicitor for 5 whiplash claims this month — referral fraud.",None,MOTOR_POLICY,["independent medical exam","accident scene evidence"],days_ago=33),
    mk("BULK-F-009","Benjamin Cruz","health","Surgery invoice date is a public holiday — facility was closed.",32000,["hospital bill"],"flagged",93,"flagged","Invoice date is a bank holiday. Hospital confirmed closed. Fraud suspected.",None,HEALTH_POLICY,["hospital operating schedule","admission records"],days_ago=27),
    mk("BULK-F-010","Miriam Goldstein","commercial_property","Inventory list includes items purchased after the alleged theft date.",95000,["theft report","inventory list"],"flagged",84,"flagged","Post-theft purchase receipts on inventory — inflation fraud suspected.",None,PROP_POLICY,["original purchase receipts","CCTV footage"],days_ago=19),
    mk("BULK-F-011","Anthony Mensah-Bonsu","motor","Accident claimed on date GPS shows vehicle was stationary.",11000,["repair estimate","hospital bill"],"flagged",86,"flagged","Telematics contradicts claimed incident location.",None,MOTOR_POLICY,["telematics report","police report"],days_ago=14),
    mk("BULK-F-012","Sara Blomqvist","health","Claim from facility blacklisted for fraudulent billing in 2025.",37000,["hospital bill"],"flagged",81,"flagged","Facility on insurer watchlist. Manual review required.",None,HEALTH_POLICY,["independent clinical review"],days_ago=9),
    mk("BULK-F-013","Kwame Asante","motor_theft","Vehicle 'stolen' in London — ANPR shows it driving in Scotland same week.",29000,["police report"],"flagged",90,"flagged","ANPR records show vehicle active post-theft report. Ghost theft suspected.",None,THEFT_POLICY,["ANPR evidence","VIN verification"],days_ago=5),
    mk("BULK-F-014","Isabelle Moreau","cyber","Social engineering claim 3x over policy sub-limit.",180000,["incident report","bank transfer"],"flagged",72,"flagged","Amount exceeds SE sub-limit. Suspected over-claim.",None,CYBER_POLICY,["board resolution","bank confirmation"],days_ago=2),
]

PENDING = [
    mk("BULK-P-001","Francis Okafor","motor","M6 rear-end collision. Awaiting approved workshop estimate.",11500,["vehicle registration","driver license"],"pending_docs",15,"pending_docs","Pending repair estimate from approved workshop.",None,MOTOR_POLICY,["repair estimate from approved workshop"],days_ago=60),
    mk("BULK-P-002","Alice Fontaine","health","Post-surgical physio claim. Discharge summary not yet received.",8500,["physiotherapy invoices"],"pending_docs",18,"pending_docs","Discharge summary required to confirm surgery date.",None,HEALTH_POLICY,["hospital discharge summary","surgeon referral"],days_ago=55),
    mk("BULK-P-003","George Osei","motor_theft","Police report filed. Non-traceable certificate still pending.",26000,["vehicle registration","driver license","police report"],"pending_docs",20,"pending_docs","Non-traceable certificate required for settlement.",None,THEFT_POLICY,["non-traceable certificate"],days_ago=50),
    mk("BULK-P-004","Vivienne Koch","life","Life claim — beneficiary identity verification pending.",350000,["death certificate","policy schedule"],"pending_docs",10,"pending_docs","Beneficiary ID required for KYC compliance.",None,LIFE_POLICY,["beneficiary government ID","beneficiary bank details"],days_ago=45),
    mk("BULK-P-005","Samuel Okwu","health","Specialist consultation — GP referral letter not submitted.",4200,["hospital bill","lab reports"],"pending_docs",14,"pending_docs","GP referral required to confirm specialist visit.",None,HEALTH_POLICY,["GP referral letter"],days_ago=40),
    mk("BULK-P-006","Fatima Al-Rashid","motor","Fire damage at petrol station. Fire brigade report not shared.",35000,["vehicle registration","driver license"],"pending_docs",22,"pending_docs","Fire brigade report mandatory for fire damage claims.",None,MOTOR_POLICY,["fire brigade report"],days_ago=35),
    mk("BULK-P-007","Marcus Steinberg","cyber","DDoS business interruption. Forensic report in progress.",65000,["IT incident log","BI loss estimate"],"pending_docs",19,"pending_docs","Forensic report required to confirm DDoS and quantify BI loss.",None,CYBER_POLICY,["forensic investigation report"],days_ago=30),
    mk("BULK-P-008","Zara Hussain","health","Dental implant surgery — awaiting pre-authorisation outcome.",6800,["dentist invoice","treatment plan"],"pending_docs",16,"pending_docs","Dental pre-authorisation required for amounts over £5,000.",None,HEALTH_POLICY,["pre-authorisation approval letter"],days_ago=25),
    mk("BULK-P-009","Paul Nkrumah","commercial_property","Storm roof damage. Loss adjuster appointment scheduled.",112000,["weather report","contractor estimate"],"pending_docs",17,"pending_docs","Loss adjuster report required before authorisation.",None,PROP_POLICY,["loss adjuster report"],days_ago=20),
    mk("BULK-P-010","Natalie Sorensen","motor","Third-party collision. Awaiting liability confirmation.",14200,STD_MOTOR+["police report"],"pending_docs",12,"pending_docs","Third-party liability confirmation required.",None,MOTOR_POLICY,["third-party insurer liability letter"],days_ago=15),
    mk("BULK-P-011","Brendan Fitzgerald","life","Death claim abroad. Awaiting apostilled foreign death certificate.",175000,["policy schedule","beneficiary ID"],"pending_docs",15,"pending_docs","Apostilled foreign death certificate required.",None,LIFE_POLICY,["apostilled death certificate","notarised translation"],days_ago=10),
    mk("BULK-P-012","Ingrid Larsson","health","ICU claim post-road accident. Final itemised bill awaited.",88500,["discharge summary","police report"],"pending_docs",11,"pending_docs","Itemised bill required to validate ICU charges.",None,HEALTH_POLICY,["itemised hospital bill"],days_ago=5),
]

ESCALATED = [
    mk("BULK-E-001","Tobias Reinholt","motor","High-value supercar damage — vehicle valuation disputed.",180000,STD_MOTOR+["independent valuation"],"escalated",38,"escalated","Amount dispute above delegated authority. Senior adjuster.",None,MOTOR_POLICY,[],days_ago=78),
    mk("BULK-E-002","Adaeze Eze","life","Accidental death under active police investigation.",450000,["death certificate","police case number","beneficiary ID"],"escalated",42,"escalated","Death under investigation — payout deferred pending outcome.",None,LIFE_POLICY,["police investigation outcome"],days_ago=70),
    mk("BULK-E-003","Pierre Leclerc","commercial_property","Explosion at chemical plant — extent of damage contested.",850000,["incident report","fire brigade report","initial estimate"],"escalated",35,"escalated","Major loss exceeds delegated authority. Legal team engaged.",None,PROP_POLICY,["specialist survey report","liability determination"],days_ago=62),
    mk("BULK-E-004","Mei-Lin Chang","health","Experimental oncology drug not on approved formulary.",95000,["discharge summary","oncologist report","treatment protocol"],"escalated",28,"escalated","Experimental treatment — referred to medical review board.",None,HEALTH_POLICY,["medical review board approval"],days_ago=54),
    mk("BULK-E-005","Carl Hoffmann","cyber","Supply chain cyber attack — multi-entity aggregation question.",1200000,["forensic report","affected entities list","BI calculation"],"escalated",30,"escalated","Multi-entity claim requires treaty team analysis.",None,CYBER_POLICY,["group policy schedule","entity coverage confirmation"],days_ago=46),
    mk("BULK-E-006","Amara Diallo","motor","Fatal road accident — third-party liability contested.",320000,["police report","driver license","vehicle registration","medical reports"],"escalated",33,"escalated","Fatal accident with third-party claims — legal team handling.",None,MOTOR_POLICY,[],days_ago=38),
    mk("BULK-E-007","Oluwaseun Adebayo","commercial_property","Subsidence claim — structural reports inconclusive.",420000,["structural survey","contractor estimate"],"escalated",31,"escalated","Causation unclear — second structural survey commissioned.",None,PROP_POLICY,["independent structural engineer report"],days_ago=30),
]

# ── Fraud Ring 1: Health Insurance Mill ──────────────────────────────────────
RING1 = [
    mk("RING1-001","Femi Adeyemi","health","Hospitalisation at Sunrise Medical Centre, respiratory infection, 3 days.",22500,["hospital bill","discharge summary"],"flagged",81,"flagged","Part of RING-RING-1. 5 claims at Sunrise in 30 days — medical mill.",None,HEALTH_POLICY,["treating physician report","lab reports"],"RING-RING-1",["RING1-002","RING1-003","RING1-004","RING1-005"],50),
    mk("RING1-002","Chidera Eze","health","Inpatient at Sunrise Medical Centre, viral fever, 4 days.",24000,["hospital bill"],"flagged",83,"flagged","Part of RING-RING-1. Same facility, similar diagnoses.",None,HEALTH_POLICY,["discharge summary","treating physician report"],"RING-RING-1",["RING1-001","RING1-003","RING1-004","RING1-005"],44),
    mk("RING1-003","Kelechi Obi","health","Sunrise Medical Centre — chest pain investigation, 2-day stay.",19500,["hospital bill","discharge summary"],"flagged",80,"flagged","Part of RING-RING-1. 3rd claim at Sunrise — pattern confirmed.",None,HEALTH_POLICY,["ECG reports","cardiologist consultation"],"RING-RING-1",["RING1-001","RING1-002","RING1-004","RING1-005"],38),
    mk("RING1-004","Emeka Okonkwo","health","Sunrise Medical Centre — orthopaedic and physio, 3-day inpatient.",26000,["hospital bill"],"escalated",77,"escalated","Part of RING-RING-1. Escalated to SIU for facility investigation.",None,HEALTH_POLICY,["physio session logs","referring GP letter"],"RING-RING-1",["RING1-001","RING1-002","RING1-003","RING1-005"],32),
    mk("RING1-005","Tunde Bakare","health","Sunrise Medical Centre — neurological obs after alleged fall, 5 days.",31000,["hospital bill","discharge summary"],"flagged",85,"flagged","Part of RING-RING-1. 5th claim — SIU investigation active.",None,HEALTH_POLICY,["CT scan report","neurologist report"],"RING-RING-1",["RING1-001","RING1-002","RING1-003","RING1-004"],26),
]

# ── Fraud Ring 2: Range Rover Evoque Theft Ring, Mayfair ──────────────────────
RING2 = [
    mk("RING2-001","Declan Murphy","motor_theft","Range Rover Evoque stolen overnight, Mayfair. Police report filed.",62000,["vehicle registration","driver license","police report"],"flagged",79,"flagged","Part of RING-RING-2. RR Evoque theft Mayfair — 4 linked claims.",None,THEFT_POLICY,["non-traceable certificate"],"RING-RING-2",["RING2-002","RING2-003","RING2-004"],48),
    mk("RING2-002","Connor O'Shea","motor_theft","Range Rover Evoque near Mayfair hotel — identical model/colour/year.",64500,["vehicle registration","police report"],"flagged",82,"flagged","Part of RING-RING-2. Identical vehicle, same area.",None,THEFT_POLICY,["non-traceable certificate","VIN verification"],"RING-RING-2",["RING2-001","RING2-003","RING2-004"],41),
    mk("RING2-003","Sean McAllister","motor_theft","Range Rover Evoque stolen, Mayfair. Blue, 2023. Metropolitan Police.",61000,["vehicle registration","driver license"],"flagged",83,"flagged","Part of RING-RING-2. 3rd identical theft in Mayfair.",None,THEFT_POLICY,["police report","non-traceable certificate"],"RING-RING-2",["RING2-001","RING2-002","RING2-004"],35),
    mk("RING2-004","Ronan Brennan","motor_theft","Range Rover Evoque gone from Mayfair overnight parking. 4th this quarter.",63500,["vehicle registration","driver license","police report"],"escalated",86,"escalated","Part of RING-RING-2. Escalated to SIU — suspected re-plating operation.",None,THEFT_POLICY,["non-traceable certificate"],"RING-RING-2",["RING2-001","RING2-002","RING2-003"],28),
]

# ── Fraud Ring 3: Industrial Estate Arson Ring ────────────────────────────────
RING3 = [
    mk("RING3-001","Grant Electrical Ltd","commercial_property","Fire, Unit 7 Bridgetown Industrial Estate. Electrical fault alleged.",290000,["fire brigade report","repair estimate"],"flagged",76,"flagged","Part of RING-RING-3. 4 fires same estate in 60 days.",None,PROP_POLICY,["independent fire investigation","financial statements"],"RING-RING-3",["RING3-002","RING3-003","RING3-004"],55),
    mk("RING3-002","Apex Fixtures PLC","commercial_property","Fire at Unit 12 Bridgetown Industrial Estate. Sprinklers failed.",315000,["fire brigade report"],"flagged",79,"flagged","Part of RING-RING-3. Same estate, escalating amounts.",None,PROP_POLICY,["arson investigation report","sprinkler maintenance records"],"RING-RING-3",["RING3-001","RING3-003","RING3-004"],46),
    mk("RING3-003","Meridian Textiles Co","commercial_property","Night fire, Unit 3 Bridgetown Industrial Estate. No witnesses. Stock destroyed.",280000,["fire brigade report","stock list"],"flagged",80,"flagged","Part of RING-RING-3. Night fire pattern — arson suspected.",None,PROP_POLICY,["forensic fire report","stock purchase records"],"RING-RING-3",["RING3-001","RING3-002","RING3-004"],37),
    mk("RING3-004","Bridgetown Auto Parts","commercial_property","Fire at Unit 19 Bridgetown Industrial Estate. 4th fire in 2 months.",340000,["fire brigade report","loss estimate"],"escalated",84,"escalated","Part of RING-RING-3. Escalated to SIU — arson investigation with police.",None,PROP_POLICY,["police arson investigation outcome"],"RING-RING-3",["RING3-001","RING3-002","RING3-003"],28),
]

BULK_RINGS = [
    {
        "ring_id": "RING-RING-1",
        "claim_ids": ["RING1-001","RING1-002","RING1-003","RING1-004","RING1-005"],
        "signals": [
            "5 health claims at Sunrise Medical Centre in 30 days",
            "All claimants linked to same GP referral network",
            "Diagnoses vary but billing codes repeat — medical mill pattern",
        ],
        "detected_at": d(26), "last_updated": now,
        "risk_score": 88, "claim_type": "health",
    },
    {
        "ring_id": "RING-RING-2",
        "claim_ids": ["RING2-001","RING2-002","RING2-003","RING2-004"],
        "signals": [
            "4 Range Rover Evoque thefts in Mayfair within 45 days",
            "Identical vehicle model, colour and year across all claims",
            "Non-traceable certificates filed through same broker",
        ],
        "detected_at": d(28), "last_updated": now,
        "risk_score": 86, "claim_type": "motor_theft",
    },
    {
        "ring_id": "RING-RING-3",
        "claim_ids": ["RING3-001","RING3-002","RING3-003","RING3-004"],
        "signals": [
            "4 commercial property fires at Bridgetown Industrial Estate in 60 days",
            "All night fires — no witnesses, undetermined origin",
            "All policyholders reported declining revenue 6 months prior",
        ],
        "detected_at": d(28), "last_updated": now,
        "risk_score": 84, "claim_type": "commercial_property",
    },
]


def seed_bulk():
    db = get_sync_db()
    all_claims = APPROVED + FLAGGED + PENDING + ESCALATED + RING1 + RING2 + RING3

    print("═" * 55)
    print("  MongAccentic — Bulk Seed")
    print("═" * 55 + "\n")

    inserted = 0
    for c in all_claims:
        r = db["claims"].update_one({"claim_id": c["claim_id"]}, {"$set": c}, upsert=True)
        if r.upserted_id:
            inserted += 1

    print(f"  ✓ Claims: {inserted} new, {len(all_claims) - inserted} already existed")
    print(f"    Approved:     {len(APPROVED)}")
    print(f"    Flagged:      {len(FLAGGED)}")
    print(f"    Pending docs: {len(PENDING)}")
    print(f"    Escalated:    {len(ESCALATED)}")
    print(f"    Ring claims:  {len(RING1)+len(RING2)+len(RING3)}")

    ring_ins = 0
    for ring in BULK_RINGS:
        r = db["fraud_rings"].update_one({"ring_id": ring["ring_id"]}, {"$set": ring}, upsert=True)
        if r.upserted_id:
            ring_ins += 1
    print(f"\n  ✓ Fraud rings: {ring_ins} new, {len(BULK_RINGS) - ring_ins} already existed")

    total     = db["claims"].count_documents({})
    approved  = db["claims"].count_documents({"status": "approved"})
    flagged   = db["claims"].count_documents({"status": "flagged"})
    pending   = db["claims"].count_documents({"status": "pending_docs"})
    escalated = db["claims"].count_documents({"status": "escalated"})
    rings     = db["fraud_rings"].count_documents({})

    print(f"\n  ── Dashboard Preview ──────────────────────")
    print(f"  Total claims : {total}")
    print(f"  Approved     : {approved}  ({round(approved/total*100)}%)")
    print(f"  Flagged      : {flagged}  ({round(flagged/total*100)}%)")
    print(f"  Pending docs : {pending}  ({round(pending/total*100)}%)")
    print(f"  Escalated    : {escalated}  ({round(escalated/total*100)}%)")
    print(f"  Fraud rings  : {rings}")
    print("\n" + "═" * 55)
    print("  Bulk seed complete!")
    print("═" * 55)


if __name__ == "__main__":
    seed_bulk()
