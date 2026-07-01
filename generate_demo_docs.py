"""
Generate realistic insurance demo documents for hackathon showcase.
Usage: python generate_demo_docs.py
Output: demo_docs/ folder with 4 sets of PDFs
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate

OUT = "demo_docs"
os.makedirs(OUT, exist_ok=True)

# Brand colors
PURPLE = HexColor("#A100FF")
DARK   = HexColor("#1a1a2e")
GRAY   = HexColor("#64748b")
GREEN  = HexColor("#10b981")
RED    = HexColor("#ef4444")
AMBER  = HexColor("#f59e0b")
BLUE   = HexColor("#3b82f6")
LIGHT  = HexColor("#f1f5f9")


# ─────────────────────────── helpers ────────────────────────────

def base_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("BrandTitle",
        fontSize=18, textColor=PURPLE, spaceAfter=2,
        fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle("DocTitle",
        fontSize=13, textColor=DARK, spaceAfter=4,
        fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle("SectionHead",
        fontSize=10, textColor=PURPLE, spaceBefore=10, spaceAfter=3,
        fontName="Helvetica-Bold", borderPad=2))
    styles.add(ParagraphStyle("Body",
        fontSize=9, textColor=DARK, spaceAfter=3, leading=13,
        fontName="Helvetica"))
    styles.add(ParagraphStyle("Small",
        fontSize=7.5, textColor=GRAY, spaceAfter=2, leading=11,
        fontName="Helvetica"))
    styles.add(ParagraphStyle("RightAlign",
        fontSize=9, textColor=GRAY, alignment=TA_RIGHT,
        fontName="Helvetica"))
    styles.add(ParagraphStyle("Center",
        fontSize=9, textColor=DARK, alignment=TA_CENTER,
        fontName="Helvetica"))
    return styles


def make_doc(filename):
    path = os.path.join(OUT, filename)
    doc = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )
    return doc, base_styles()


def header_block(styles, org_name, doc_type, ref_no, date):
    """Branded header: org name + doc type + ref/date"""
    header_data = [
        [Paragraph(org_name, styles["BrandTitle"]),
         Paragraph(f"Ref: {ref_no}<br/>Date: {date}", styles["RightAlign"])]
    ]
    t = Table(header_data, colWidths=[10*cm, 7*cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))
    return [
        t,
        Paragraph(doc_type, styles["DocTitle"]),
        HRFlowable(width="100%", thickness=1.5, color=PURPLE, spaceAfter=8),
    ]


def kv_table(data, col_widths=None):
    """Two-column key-value table."""
    col_widths = col_widths or [5*cm, 12*cm]
    rows = [[Paragraph(f"<b>{k}</b>", ParagraphStyle("kh", fontSize=8.5, fontName="Helvetica-Bold", textColor=GRAY)),
             Paragraph(str(v), ParagraphStyle("kv", fontSize=8.5, fontName="Helvetica", textColor=DARK))]
            for k, v in data]
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [HexColor("#f8fafc"), white]),
        ("GRID", (0,0), (-1,-1), 0.3, HexColor("#e2e8f0")),
        ("TOPPADDING", (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
    ]))
    return t


def section(styles, title):
    return Paragraph(title, styles["SectionHead"])


def body(styles, text):
    return Paragraph(text, styles["Body"])


def small(styles, text):
    return Paragraph(text, styles["Small"])


def spacer(h=6):
    return Spacer(1, h)


def stamp_table(label, color=GREEN):
    t = Table([[Paragraph(f"<b>{label}</b>",
        ParagraphStyle("st", fontSize=10, fontName="Helvetica-Bold",
                       textColor=white, alignment=TA_CENTER))]],
        colWidths=[4*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), color),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("ROUNDEDCORNERS", [4]),
    ]))
    return t


def amount_row(styles, label, amount):
    t = Table(
        [[Paragraph(f"<b>{label}</b>", styles["Body"]),
          Paragraph(f"<b>{amount}</b>",
                    ParagraphStyle("amt", fontSize=11, fontName="Helvetica-Bold",
                                   textColor=PURPLE, alignment=TA_RIGHT))]],
        colWidths=[9*cm, 8*cm]
    )
    t.setStyle(TableStyle([
        ("LINEABOVE", (0,0), (-1,-1), 1, PURPLE),
        ("TOPPADDING", (0,0), (-1,-1), 6),
    ]))
    return t


# ══════════════════════════════════════════════════════════════════
# SET 1 — MOTOR ACCIDENT
# ══════════════════════════════════════════════════════════════════

def gen_repair_estimate():
    doc, s = make_doc("set1_motor_repair_estimate.pdf")
    story = []

    story += header_block(s,
        "SkyLine Auto Workshop Pvt. Ltd.",
        "Vehicle Repair Estimate & Work Order",
        "SAW-2025-08471", "15 June 2025")

    story.append(section(s, "WORKSHOP DETAILS"))
    story.append(kv_table([
        ("Workshop Name",    "SkyLine Auto Workshop Pvt. Ltd."),
        ("License No.",      "MH-WS-2019-004821"),
        ("Address",          "Plot 47, MIDC Industrial Area, Andheri East, Mumbai — 400 093"),
        ("Contact",          "+91 98200 55101  |  repair@skylineauto.in"),
        ("Authorized By",    "Insurance Approved Garage — IRDAI Panel Member"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "VEHICLE INFORMATION"))
    story.append(kv_table([
        ("Owner Name",       "Rajesh Kumar Sharma"),
        ("Policy Number",    "POL-2025-MH-00342"),
        ("Vehicle Make",     "Maruti Suzuki Swift Dzire ZXI"),
        ("Model Year",       "2022"),
        ("Registration No.", "MH 01 AB 4521"),
        ("VIN / Chassis No.","MBLFD62S5N6123456"),
        ("Engine No.",       "K12MN-2301456"),
        ("Odometer Reading", "34,217 km"),
        ("Date of Accident", "12 June 2025"),
        ("Date of Intake",   "13 June 2025"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "DAMAGE ASSESSMENT"))
    story.append(body(s,
        "Vehicle was brought in with significant front-end collision damage. "
        "Assessment conducted by certified surveyor Vikram Nair (Reg. No. IRDAI-SUR-22891). "
        "The following components require replacement or repair:"))
    story.append(spacer(4))

    rows = [
        [Paragraph("<b>#</b>", s["Body"]),
         Paragraph("<b>Part / Labour Description</b>", s["Body"]),
         Paragraph("<b>Part No.</b>", s["Body"]),
         Paragraph("<b>Qty</b>", s["Body"]),
         Paragraph("<b>Unit Rate (₹)</b>", s["Body"]),
         Paragraph("<b>Amount (₹)</b>", s["Body"])],
        ["1", "Front Bumper Assembly (OEM)",          "71711M54P10-ZNC",   "1",  "8,400",   "8,400"],
        ["2", "Radiator Grille",                       "71750M54R10",        "1",  "2,100",   "2,100"],
        ["3", "Bonnet / Hood Panel (dented, cracked)", "57600M54R00",        "1",  "14,800",  "14,800"],
        ["4", "Front Right Headlamp Assembly",         "35100M54R01",        "1",  "7,200",   "7,200"],
        ["5", "Windshield Glass (front, cracked)",     "84511M54R00",        "1",  "9,500",   "9,500"],
        ["6", "Airbag Module Reset + Sensor",          "98200M54R00-KIT",    "1",  "12,000",  "12,000"],
        ["7", "Denting & Painting — Front Zone",       "—",                  "—",  "—",       "18,500"],
        ["8", "Alignment & Wheel Balancing",            "—",                  "—",  "—",       "1,800"],
        ["9", "Labour — Assembly / Disassembly",       "—",                  "—",  "—",       "6,500"],
        ["",  Paragraph("<b>Sub-total</b>", s["Body"]), "", "", "", Paragraph("<b>80,800</b>", s["Body"])],
        ["",  "GST @ 18%", "", "", "", "14,544"],
        ["",  Paragraph("<b>GRAND TOTAL</b>", s["Body"]), "", "", "",
              Paragraph("<b>₹ 95,344</b>", ParagraphStyle("gt", fontSize=10, fontName="Helvetica-Bold", textColor=PURPLE))],
    ]
    t = Table(rows, colWidths=[0.8*cm, 6.5*cm, 3.2*cm, 1*cm, 2.3*cm, 2.5*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), DARK),
        ("TEXTCOLOR",  (0,0), (-1,0), white),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",   (0,0), (-1,0), 8),
        ("ROWBACKGROUNDS", (0,1), (-1,-4), [HexColor("#f8fafc"), white]),
        ("GRID", (0,0), (-1,-1), 0.3, HexColor("#e2e8f0")),
        ("TOPPADDING", (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING", (0,0), (-1,-1), 4),
        ("FONTSIZE", (0,1), (-1,-1), 8),
        ("LINEABOVE", (0,-3), (-1,-3), 1, PURPLE),
    ]))
    story.append(t)

    story.append(spacer(10))
    story.append(section(s, "SURVEYOR CERTIFICATION"))
    story.append(body(s,
        "I, <b>Vikram Nair</b>, Licensed Insurance Surveyor & Loss Assessor (IRDAI Reg. No. IRDAI-SUR-22891), "
        "hereby certify that the above estimate accurately reflects the damage sustained by the vehicle "
        "Registration No. MH 01 AB 4521 as a result of the accident on 12 June 2025. "
        "All parts listed are OEM-grade or equivalent approved by the insurer's panel."))
    story.append(spacer(16))

    sig_data = [
        [Paragraph("____________________________", s["Body"]),
         Paragraph("____________________________", s["Body"]),
         Paragraph("____________________________", s["Body"])],
        [Paragraph("Workshop Manager<br/>SkyLine Auto Workshop", s["Small"]),
         Paragraph("Licensed Surveyor<br/>Vikram Nair — IRDAI-SUR-22891", s["Small"]),
         Paragraph("Customer Acknowledgement<br/>Rajesh Kumar Sharma", s["Small"])],
    ]
    sig_t = Table(sig_data, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
    sig_t.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),3)]))
    story.append(sig_t)

    story.append(spacer(10))
    story.append(small(s,
        "This estimate is valid for 30 days from the date of issue. "
        "SkyLine Auto Workshop Pvt. Ltd. is an IRDAI-empanelled garage. "
        "All work carries a 6-month warranty on parts and labour."))

    doc.build(story)
    print(f"  OK {OUT}/set1_motor_repair_estimate.pdf")


def gen_vehicle_registration():
    doc, s = make_doc("set1_vehicle_registration.pdf")
    story = []

    story += header_block(s,
        "Regional Transport Office — Mumbai Central",
        "Certificate of Registration (Form 23)",
        "RC-MH01-2022-4521", "08 March 2022")

    story.append(body(s,
        "<b>Government of Maharashtra — Ministry of Road Transport &amp; Highways</b>"))
    story.append(spacer(6))
    story.append(section(s, "REGISTERED OWNER DETAILS"))
    story.append(kv_table([
        ("Owner Name",        "RAJESH KUMAR SHARMA"),
        ("Father's Name",     "SURESH PRASAD SHARMA"),
        ("Address",           "14/B, Shanti Nagar, Borivali West, Mumbai — 400 092"),
        ("PAN",               "ABCPS1234F"),
        ("Driving Licence",   "MH-01-20180045231"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "VEHICLE DETAILS"))
    story.append(kv_table([
        ("Registration No.",  "MH 01 AB 4521"),
        ("Class of Vehicle",  "Motor Car (LMV)"),
        ("Maker's Name",      "MARUTI SUZUKI INDIA LTD"),
        ("Model",             "Swift Dzire ZXI AMT"),
        ("Year of Manufacture", "2022"),
        ("Month of First Reg.", "March 2022"),
        ("Chassis No.",       "MBLFD62S5N6123456"),
        ("Engine No.",        "K12MN-2301456"),
        ("Fuel Type",         "Petrol"),
        ("Colour",            "Pearl Arctic White"),
        ("Seating Capacity",  "5 (including driver)"),
        ("Unladen Weight",    "940 kg"),
        ("Gross Vehicle Wt.", "1,395 kg"),
        ("Cubic Capacity",    "1197 cc"),
        ("Horse Power",       "82 HP"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "INSURANCE & FITNESS"))
    story.append(kv_table([
        ("Insurance Co.",     "Accenture Insurance Services Ltd."),
        ("Policy No.",        "POL-2025-MH-00342"),
        ("Insurance Valid Up To", "31 March 2026"),
        ("Fitness Valid Up To",   "07 March 2027"),
        ("Road Tax Paid Up To",   "Lifetime (Maharashtra)"),
        ("Hypothecation",         "NIL — Vehicle owned outright"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "REGISTERING AUTHORITY"))
    story.append(kv_table([
        ("RTO Code",          "MH-01 (Mumbai Central)"),
        ("Issuing Officer",   "Joint RTO — Shri P.R. Desai"),
        ("Date of Issue",     "08 March 2022"),
        ("Valid Until",       "07 March 2037 (15-year cycle)"),
    ]))

    story.append(spacer(14))
    story.append(small(s,
        "This certificate is computer-generated and does not require a physical signature. "
        "Verify authenticity at vahanparivahan.gov.in using registration number MH 01 AB 4521. "
        "Any alteration or tampering will render this document void and may attract legal liability "
        "under the Motor Vehicles Act, 1988."))
    story.append(spacer(8))
    story.append(stamp_table("VERIFIED — RTO MUMBAI CENTRAL", BLUE))

    doc.build(story)
    print(f"  OK {OUT}/set1_vehicle_registration.pdf")


# ══════════════════════════════════════════════════════════════════
# SET 2 — HEALTH CLAIM
# ══════════════════════════════════════════════════════════════════

def gen_hospital_discharge():
    doc, s = make_doc("set2_hospital_discharge_summary.pdf")
    story = []

    story += header_block(s,
        "Apollo Hospitals Enterprise Ltd. — Navi Mumbai",
        "Discharge Summary",
        "APNM-DISCH-2025-10847", "22 June 2025")

    story.append(kv_table([
        ("Patient Name",      "Priya Anand Menon"),
        ("Age / Gender",      "34 Years / Female"),
        ("UHID",              "APNM-PAT-00291847"),
        ("IP Number",         "IP-2025-10847"),
        ("Insurance Policy",  "POL-2025-GRP-CORP-00871 (Accenture Group Health)"),
        ("Ward / Bed",        "General Ward — Room 412-B"),
        ("Admitting Doctor",  "Dr. Kavitha Rajan, MD (Internal Medicine), Reg. No. MH-42891"),
    ]))

    story.append(spacer(6))
    story.append(section(s, "ADMISSION & DISCHARGE"))
    story.append(kv_table([
        ("Date of Admission",  "17 June 2025  (Time: 09:45 hrs)"),
        ("Date of Discharge",  "22 June 2025  (Time: 14:30 hrs)"),
        ("Total Days",         "5 Days"),
        ("Mode of Admission",  "Emergency — referred by Dr. S. Pillai (Cardiac OPD)"),
        ("Condition at Discharge", "Stable — advised home rest for 10 days"),
    ]))

    story.append(spacer(6))
    story.append(section(s, "DIAGNOSIS"))
    story.append(body(s,
        "<b>Primary Diagnosis:</b> Acute Myocarditis (ICD-10: I40.9)<br/>"
        "<b>Secondary Diagnosis:</b> Hypertension Stage II (ICD-10: I10), "
        "Mild Pleural Effusion (ICD-10: J90)"))

    story.append(spacer(6))
    story.append(section(s, "CLINICAL HISTORY"))
    story.append(body(s,
        "Patient presented to Emergency on 17 June 2025 with complaints of chest pain (4/10 scale), "
        "shortness of breath at rest, and fever (38.7°C) for 3 days. "
        "ECG on admission showed ST-segment changes in V3–V5. "
        "Echocardiography revealed mild LV dysfunction (EF 42%). "
        "Troponin-I was elevated at 1.82 ng/mL (normal &lt;0.04). "
        "Patient was started on IV antibiotics, diuretics, and cardiac monitoring. "
        "Serial ECGs showed gradual normalisation over 48 hours."))

    story.append(spacer(6))
    story.append(section(s, "TREATMENT SUMMARY"))
    story.append(body(s,
        "• IV Methylprednisolone 1g/day × 3 days<br/>"
        "• IV Furosemide 40mg BD × 3 days, then oral<br/>"
        "• Oral Ramipril 2.5mg OD (anti-hypertensive)<br/>"
        "• Oral Carvedilol 3.125mg BD<br/>"
        "• Continuous cardiac monitoring — no arrhythmia noted<br/>"
        "• Pleural tap not required — effusion resolved on diuretics"))

    story.append(spacer(6))
    story.append(section(s, "INVESTIGATIONS SUMMARY"))
    inv_rows = [
        [Paragraph("<b>Test</b>", s["Body"]), Paragraph("<b>Result</b>", s["Body"]),
         Paragraph("<b>Reference Range</b>", s["Body"]), Paragraph("<b>Status</b>", s["Body"])],
        ["Troponin-I (Day 1)",     "1.82 ng/mL",  "< 0.04 ng/mL",  Paragraph("<font color='#ef4444'>ELEVATED</font>", s["Body"])],
        ["Troponin-I (Day 3)",     "0.28 ng/mL",  "< 0.04 ng/mL",  Paragraph("<font color='#f59e0b'>TRENDING DOWN</font>", s["Body"])],
        ["Troponin-I (Day 5)",     "0.06 ng/mL",  "< 0.04 ng/mL",  Paragraph("<font color='#10b981'>NEAR NORMAL</font>", s["Body"])],
        ["Echo EF",                "42% → 51%",   "55–70%",         Paragraph("<font color='#10b981'>IMPROVED</font>", s["Body"])],
        ["CRP",                    "88 mg/L",      "< 5 mg/L",       Paragraph("<font color='#ef4444'>HIGH</font>", s["Body"])],
        ["Serum Creatinine",       "0.9 mg/dL",   "0.6–1.2 mg/dL", "Normal"],
    ]
    inv_t = Table(inv_rows, colWidths=[4.5*cm, 3.5*cm, 3.5*cm, 3.5*cm])
    inv_t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), DARK),
        ("TEXTCOLOR",  (0,0), (-1,0), white),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",   (0,0), (-1,- 1), 8),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#f8fafc"), white]),
        ("GRID", (0,0), (-1,-1), 0.3, HexColor("#e2e8f0")),
        ("TOPPADDING", (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(inv_t)

    story.append(spacer(8))
    story.append(section(s, "BILLING SUMMARY"))
    story.append(kv_table([
        ("Room & Board (5 days)",   "₹ 28,500"),
        ("ICU Monitoring Charges",  "₹ 12,000"),
        ("Cardiology Consultation", "₹  6,500"),
        ("Medicines & Consumables", "₹ 18,240"),
        ("Diagnostics / Lab",       "₹  9,100"),
        ("Procedures",              "₹  4,200"),
        ("Nursing & OT Charges",    "₹  3,800"),
        ("Total Bill Amount",       "₹ 82,340"),
        ("Insurance Pre-Auth No.",  "PREAUTH-2025-APNM-00944"),
        ("Amount Pre-Authorized",   "₹ 80,000"),
        ("Balance Payable by Patient", "₹ 2,340"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "DISCHARGE INSTRUCTIONS"))
    story.append(body(s,
        "1. Strict bed rest for 10 days — no physical exertion or stressful activity.<br/>"
        "2. Follow-up with Dr. Kavitha Rajan in 7 days (OPD appointment booked for 29 June 2025).<br/>"
        "3. Repeat Echo and Troponin in 4 weeks.<br/>"
        "4. Continue prescribed medications without interruption.<br/>"
        "5. Report immediately if chest pain, breathlessness, or fever recurs."))

    story.append(spacer(14))
    story.append(small(s,
        "Digitally authenticated by Apollo Hospitals Enterprise Ltd., Navi Mumbai. "
        "NABH Accredited Hospital (Reg. NABH-HOS-2020-01847). "
        "This document is valid for insurance reimbursement purposes."))
    story.append(spacer(8))
    story.append(stamp_table("DISCHARGED — STABLE", GREEN))

    doc.build(story)
    print(f"  OK {OUT}/set2_hospital_discharge_summary.pdf")


def gen_lab_report():
    doc, s = make_doc("set2_lab_report.pdf")
    story = []

    story += header_block(s,
        "SRL Diagnostics Ltd. — Navi Mumbai",
        "Comprehensive Blood Panel Report",
        "SRL-LAB-2025-NM-88412", "17 June 2025")

    story.append(kv_table([
        ("Patient Name",      "Priya Anand Menon"),
        ("Age / Gender",      "34 / Female"),
        ("Referred By",       "Dr. Kavitha Rajan, Apollo Hospitals (IP-2025-10847)"),
        ("Sample Collected",  "17 June 2025 — 10:15 hrs"),
        ("Report Generated",  "17 June 2025 — 14:45 hrs"),
        ("Sample Type",       "Venous Blood (EDTA + Plain)"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "CARDIAC MARKERS"))
    rows = [
        [Paragraph("<b>Test</b>", s["Body"]),
         Paragraph("<b>Result</b>", s["Body"]),
         Paragraph("<b>Unit</b>", s["Body"]),
         Paragraph("<b>Reference Range</b>", s["Body"]),
         Paragraph("<b>Flag</b>", s["Body"])],
        ["Troponin-I (High Sensitivity)", "1.82",   "ng/mL",  "< 0.04",      Paragraph("<font color='#ef4444'><b>HIGH ↑↑</b></font>", s["Body"])],
        ["CK-MB",                          "38.4",   "U/L",    "0–24",        Paragraph("<font color='#ef4444'><b>HIGH ↑</b></font>", s["Body"])],
        ["BNP (Brain Natriuretic Peptide)", "420",   "pg/mL",  "< 100",       Paragraph("<font color='#ef4444'><b>HIGH ↑</b></font>", s["Body"])],
        ["LDH",                            "310",    "U/L",    "140–280",     Paragraph("<font color='#f59e0b'><b>ELEVATED</b></font>", s["Body"])],
        ["D-Dimer",                        "0.42",   "mg/L",   "< 0.50",      "Normal"],
    ]
    cardiac_t = Table(rows, colWidths=[5.5*cm, 2.5*cm, 1.8*cm, 3.2*cm, 2.5*cm])
    cardiac_t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), DARK),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#fff5f5"), white]),
        ("GRID", (0,0), (-1,-1), 0.3, HexColor("#e2e8f0")),
        ("TOPPADDING", (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(cardiac_t)

    story.append(spacer(8))
    story.append(section(s, "INFLAMMATORY MARKERS"))
    rows2 = [
        [Paragraph("<b>Test</b>", s["Body"]),
         Paragraph("<b>Result</b>", s["Body"]),
         Paragraph("<b>Unit</b>", s["Body"]),
         Paragraph("<b>Reference Range</b>", s["Body"]),
         Paragraph("<b>Flag</b>", s["Body"])],
        ["CRP (High Sensitivity)",     "88.0",   "mg/L",   "< 5.0",     Paragraph("<font color='#ef4444'><b>HIGH ↑↑</b></font>", s["Body"])],
        ["ESR",                         "72",     "mm/hr",  "0–20",      Paragraph("<font color='#ef4444'><b>HIGH ↑</b></font>", s["Body"])],
        ["Procalcitonin",               "0.18",   "ng/mL",  "< 0.50",    "Normal"],
        ["Ferritin",                    "218",    "ng/mL",  "12–150",    Paragraph("<font color='#f59e0b'><b>ELEVATED</b></font>", s["Body"])],
        ["IL-6",                        "42.1",   "pg/mL",  "< 7.0",     Paragraph("<font color='#ef4444'><b>HIGH ↑</b></font>", s["Body"])],
    ]
    t2 = Table(rows2, colWidths=[5.5*cm, 2.5*cm, 1.8*cm, 3.2*cm, 2.5*cm])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), DARK),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#f8fafc"), white]),
        ("GRID", (0,0), (-1,-1), 0.3, HexColor("#e2e8f0")),
        ("TOPPADDING", (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(t2)

    story.append(spacer(8))
    story.append(section(s, "HAEMATOLOGY — CBC"))
    story.append(kv_table([
        ("Haemoglobin",       "11.8 g/dL      [Normal: 12.0–16.0]   — Low"),
        ("WBC Count",         "11,400 /µL     [Normal: 4,000–11,000] — Mildly elevated"),
        ("Neutrophils",       "74%            [Normal: 50–70%]       — Mild neutrophilia"),
        ("Platelets",         "2,18,000 /µL   [Normal: 1,50,000–4,00,000] — Normal"),
        ("MCV",               "82 fL          [Normal: 80–100 fL]    — Normal"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "PATHOLOGIST'S COMMENT"))
    story.append(body(s,
        "Markedly elevated Troponin-I and CK-MB strongly suggest active myocardial injury. "
        "Combined with elevated BNP and CRP, findings are consistent with acute myocarditis "
        "or myocardial infarction. Urgent cardiology review advised. "
        "Repeat cardiac markers in 6–12 hours recommended."))

    story.append(spacer(12))
    story.append(kv_table([
        ("Validated By",      "Dr. Meena Subramaniam, MD Pathology (Reg. No. MH-PATH-18821)"),
        ("Digitally Signed",  "17 June 2025, 15:00 hrs — SRL Diagnostics Navi Mumbai"),
    ]))

    story.append(spacer(8))
    story.append(small(s,
        "SRL Diagnostics Ltd. is NABL accredited (Reg. MC-2456). "
        "Results are valid as reported. Clinicians are advised to correlate with patient history. "
        "This report is computer-generated and does not require a wet signature for insurance purposes."))

    doc.build(story)
    print(f"  OK {OUT}/set2_lab_report.pdf")


def gen_prescription():
    doc, s = make_doc("set2_doctor_prescription.pdf")
    story = []

    story += header_block(s,
        "Apollo Hospitals — Cardiology OPD",
        "Medical Prescription",
        "RX-2025-APNM-10847", "22 June 2025")

    story.append(kv_table([
        ("Doctor",         "Dr. Kavitha Rajan, MD (Internal Medicine), DM (Cardiology)"),
        ("Reg. No.",       "MH-42891  |  APNM-CARD-022"),
        ("Patient",        "Priya Anand Menon  |  Age: 34F  |  UHID: APNM-PAT-00291847"),
        ("Diagnosis",      "Post-Myocarditis — Discharge Prescription"),
        ("Date",           "22 June 2025"),
    ]))

    story.append(spacer(10))
    story.append(section(s, "Rx — MEDICATIONS"))

    rx = [
        ("1", "Tab. Ramipril 5mg", "Once daily (morning)", "30 days", "Anti-hypertensive / Cardiac remodelling"),
        ("2", "Tab. Carvedilol 6.25mg", "Twice daily (AM/PM with food)", "30 days", "Beta-blocker — Heart rate control"),
        ("3", "Tab. Furosemide 20mg", "Once daily (morning)", "14 days", "Diuretic — prevent fluid retention"),
        ("4", "Tab. Aspirin 75mg", "Once daily after breakfast", "30 days", "Anti-platelet"),
        ("5", "Cap. Omega-3 (EPA/DHA 1000mg)", "Once daily", "30 days", "Cardioprotective supplement"),
        ("6", "Tab. Pantoprazole 40mg", "Once daily (empty stomach)", "30 days", "GI protection with Aspirin"),
    ]

    for item in rx:
        row_data = [
            [Paragraph(item[0], s["Body"]),
             Paragraph(f"<b>{item[1]}</b>", ParagraphStyle("rxdrug", fontSize=9.5, fontName="Helvetica-Bold", textColor=DARK)),
             Paragraph(item[2], s["Body"]),
             Paragraph(item[3], s["Body"])],
        ]
        rt = Table(row_data, colWidths=[0.8*cm, 5.5*cm, 5*cm, 2.5*cm])
        rt.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), HexColor("#f0f4ff")),
            ("GRID", (0,0), (-1,-1), 0.3, HexColor("#dde4f5")),
            ("TOPPADDING", (0,0), (-1,-1), 5),
            ("BOTTOMPADDING", (0,0), (-1,-1), 5),
            ("LEFTPADDING", (0,0), (-1,-1), 6),
        ]))
        story.append(rt)
        story.append(Paragraph(
            f"   <i>{item[4]}</i>",
            ParagraphStyle("rxnote", fontSize=7.5, fontName="Helvetica-Oblique", textColor=GRAY, leftIndent=12, spaceAfter=5)
        ))

    story.append(spacer(8))
    story.append(section(s, "GENERAL ADVICE"))
    story.append(body(s,
        "• No strenuous activity or exercise for 6 weeks minimum.<br/>"
        "• Follow low-sodium (< 2g/day), low-fat DASH diet.<br/>"
        "• Absolute alcohol abstinence for 3 months.<br/>"
        "• Daily BP and pulse monitoring — log and bring record to follow-up.<br/>"
        "• Return immediately to ER if: chest pain, dizziness, breathlessness, palpitations."))

    story.append(spacer(8))
    story.append(section(s, "FOLLOW-UP"))
    story.append(kv_table([
        ("Next Appointment", "29 June 2025 — Apollo Cardiology OPD (Slot booked — 10:30 AM)"),
        ("Tests Requested",  "Repeat Echo, Troponin-I, CRP, Renal Function Tests"),
    ]))

    story.append(spacer(16))
    story.append(kv_table([
        ("Doctor Signature", "____________________________"),
        ("Facility Stamp",   "[Apollo Hospitals — Navi Mumbai]"),
    ]))

    story.append(spacer(8))
    story.append(small(s,
        "Valid for 30 days from date of issue. "
        "Prescriptions for Schedule H drugs require pharmacist verification. "
        "This prescription is for the named patient only and must not be shared."))

    doc.build(story)
    print(f"  OK {OUT}/set2_doctor_prescription.pdf")


# ══════════════════════════════════════════════════════════════════
# SET 3 — MOTOR THEFT / FRAUD RING
# ══════════════════════════════════════════════════════════════════

def gen_police_fir():
    doc, s = make_doc("set3_police_fir_report.pdf")
    story = []

    story += header_block(s,
        "Mumbai Police — Kurla East Police Station",
        "First Information Report (FIR)",
        "FIR No: KE-PS-2025-0847", "03 June 2025")

    story.append(body(s,
        "<b>State: Maharashtra  |  District: Mumbai Suburban  |  PS Code: MH-MBS-KE-017</b>"))
    story.append(spacer(4))
    story.append(kv_table([
        ("FIR No.",            "KE-PS-2025-0847"),
        ("Date & Time of FIR", "03 June 2025  |  22:15 hrs"),
        ("Investigating Officer", "Sub-Inspector Rajendra More (Badge: 9412)"),
        ("IPC Sections",        "Section 379 (Theft), Section 411 (Dishonestly receiving stolen property)"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "COMPLAINANT DETAILS"))
    story.append(kv_table([
        ("Name",            "Arjun Pradeep Verma"),
        ("Age",             "41 years"),
        ("Address",         "B-12, Vijay Nagar Society, Kurla East, Mumbai — 400 024"),
        ("Mobile",          "+91 98335 77240"),
        ("Occupation",      "Self-Employed — Transport Contractor"),
        ("Relationship",    "Registered Owner of stolen vehicle"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "VEHICLE DETAILS"))
    story.append(kv_table([
        ("Registration No.",  "MH 03 CK 8821"),
        ("Make & Model",      "Toyota Innova Crysta GX 7-Seater"),
        ("Year",              "2021"),
        ("Chassis No.",       "MBJAB8EM3M0123891"),
        ("Engine No.",        "2GDC2291834"),
        ("Colour",            "Silver"),
        ("Insurance Policy",  "POL-2025-THEFT-00218"),
        ("Insured Value",     "₹ 18,40,000"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "INCIDENT NARRATION"))
    story.append(body(s,
        "The complainant states that his vehicle (MH 03 CK 8821) was parked in the designated "
        "parking lot at Platform No. 3, Kurla Railway Station (East) on 03 June 2025 at approximately "
        "18:30 hrs. Upon return at 21:45 hrs, the vehicle was found missing. "
        "Enquiries with parking attendant (Ramesh Tambe, badge K-441) confirmed vehicle left the parking "
        "between 20:00 and 20:30 hrs, but no legitimate token/receipt was presented. "
        "CCTV footage is available and has been preserved by station staff. "
        "The complainant has no knowledge of who may have taken the vehicle."))

    story.append(spacer(6))
    story.append(body(s,
        "NOTE FROM INVESTIGATING OFFICER: Vehicle registration MH 03 CK 8821 was checked on VAHAN portal — "
        "no prior theft reports. However, pattern analysis with Crime Branch indicates similar theft "
        "reports for 3 other Innova vehicles in adjacent precincts (Ghatkopar, Chembur, Mankhurd) "
        "within the last 60 days. Cross-referencing with Insurance Bureau of India (IBI) flag — "
        "POSSIBLE ORGANISED RING. File marked Priority."))

    story.append(spacer(6))
    story.append(section(s, "ACTION TAKEN"))
    story.append(kv_table([
        ("Case No.",         "KE-PS-2025-0847"),
        ("FIR Registered",   "Yes — 03 June 2025, 22:15 hrs"),
        ("CCTV Seized",      "Yes — 8 hours of footage, Kurla Station premises"),
        ("Alert Issued",     "City-wide BOLO (Be On the Look Out) for MH 03 CK 8821"),
        ("IBI Intimation",   "Sent to Insurance Bureau of India — Ref: IBI-2025-THF-00481"),
        ("Status",           "UNDER INVESTIGATION"),
    ]))

    story.append(spacer(14))
    story.append(kv_table([
        ("Complainant Signature", "____________________________  (Arjun Pradeep Verma)"),
        ("IO Signature",          "____________________________  (SI Rajendra More — 9412)"),
        ("SHO Signature",         "____________________________  (Inspector S.K. Patil — KE PS)"),
    ]))

    story.append(spacer(8))
    story.append(stamp_table("FILED — UNDER INVESTIGATION", AMBER))
    story.append(spacer(6))
    story.append(small(s,
        "This is a computer-generated FIR copy issued under Section 154 CrPC. "
        "Verify authenticity at citizenportal.mahapolice.gov.in using FIR No. KE-PS-2025-0847. "
        "Any tampering with this document is a cognisable offence."))

    doc.build(story)
    print(f"  OK {OUT}/set3_police_fir_report.pdf")


def gen_non_traceable_cert():
    doc, s = make_doc("set3_non_traceable_certificate.pdf")
    story = []

    story += header_block(s,
        "Mumbai Police — Kurla East Police Station",
        "Non-Traceable Certificate",
        "NTC-KE-PS-2025-0847", "18 June 2025")

    story.append(body(s,
        "<b>Government of Maharashtra — Maharashtra Police</b><br/>"
        "Issued under: IRDAI Circular IRDA/NL/CIR/MISC/084/04/2012"))
    story.append(spacer(8))

    story.append(section(s, "CERTIFICATE DETAILS"))
    story.append(kv_table([
        ("Certificate No.",  "NTC-KE-PS-2025-0847"),
        ("FIR Reference",    "KE-PS-2025-0847 dated 03 June 2025"),
        ("Issued On",        "18 June 2025"),
        ("Issuing Authority","Sub-Inspector Rajendra More, Kurla East PS (Badge: 9412)"),
        ("Countersigned By", "Inspector S.K. Patil, SHO — Kurla East Police Station"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "VEHICLE & OWNER DETAILS"))
    story.append(kv_table([
        ("Owner Name",        "Arjun Pradeep Verma"),
        ("Registration No.",  "MH 03 CK 8821"),
        ("Make & Model",      "Toyota Innova Crysta GX 7-Seater — 2021"),
        ("Chassis No.",       "MBJAB8EM3M0123891"),
        ("Engine No.",        "2GDC2291834"),
        ("Date Stolen",       "03 June 2025"),
        ("Last Known Location","Kurla Railway Station East Parking Lot, Mumbai — 400 024"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "INVESTIGATION SUMMARY"))
    story.append(body(s,
        "Pursuant to FIR No. KE-PS-2025-0847 filed by Arjun Pradeep Verma on 03 June 2025, "
        "this police station has undertaken the following investigative actions over a 15-day period:"))
    story.append(spacer(4))
    story.append(body(s,
        "1. <b>CCTV Analysis:</b> Footage from Kurla Station and 12 surrounding camera points reviewed. "
        "Vehicle was seen exiting the area at 20:22 hrs on 03 June 2025 in an eastbound direction. "
        "Occupant not clearly identifiable. Vehicle subsequently lost from camera coverage.<br/><br/>"
        "2. <b>VAHAN Check:</b> No transfer of ownership registered on VAHAN portal. Vehicle not found "
        "at any RTO in Maharashtra as on date of this certificate.<br/><br/>"
        "3. <b>Naaka-bandi (Road Block Checks):</b> State-level alerts issued to all checkposts. "
        "Vehicle not recovered at any checkpost as on 18 June 2025.<br/><br/>"
        "4. <b>Informer Network:</b> Police informers in auto-theft and dismantling circles contacted — "
        "no information received regarding this vehicle.<br/><br/>"
        "5. <b>Adjacent Districts:</b> Alerts sent to Thane, Raigad, and Pune police. No sightings reported."))

    story.append(spacer(8))
    story.append(section(s, "CERTIFICATION"))
    story.append(body(s,
        "Based on the above investigation, this police station certifies that vehicle "
        "<b>MH 03 CK 8821</b> (Toyota Innova Crysta, 2021) reported stolen on 03 June 2025 "
        "has NOT been traced or recovered as on 18 June 2025."))
    story.append(spacer(4))
    story.append(body(s,
        "This Non-Traceable Certificate is being issued to enable the complainant / registered owner "
        "to prefer an insurance claim with their insurer in accordance with IRDAI guidelines."))

    story.append(spacer(12))
    story.append(kv_table([
        ("IO Signature",    "____________________________  (SI Rajendra More — Badge 9412)"),
        ("SHO Signature",   "____________________________  (Inspector S.K. Patil, SHO)"),
        ("Date",            "18 June 2025"),
        ("Office Stamp",    "[Kurla East Police Station Seal]"),
    ]))

    story.append(spacer(8))
    story.append(stamp_table("NON-TRACEABLE CERTIFIED", RED))
    story.append(spacer(6))
    story.append(small(s,
        "This certificate is issued for insurance purposes only as mandated by IRDAI Circular "
        "IRDA/NL/CIR/MISC/084/04/2012. Investigation remains open. "
        "If the vehicle is recovered after insurance settlement, the insurer must be informed immediately. "
        "Verify at citizenportal.mahapolice.gov.in — Ref: NTC-KE-PS-2025-0847."))

    doc.build(story)
    print(f"  OK {OUT}/set3_non_traceable_certificate.pdf")


# ══════════════════════════════════════════════════════════════════
# SET 4 — CYBER INSURANCE
# ══════════════════════════════════════════════════════════════════

def gen_cyber_incident_report():
    doc, s = make_doc("set4_cyber_incident_report.pdf")
    story = []

    story += header_block(s,
        "TechNova Solutions Pvt. Ltd. — IT Security",
        "Cyber Incident Report",
        "CIR-TN-2025-00034", "10 June 2025")

    story.append(body(s,
        "<b>Classification: CONFIDENTIAL</b>  |  "
        "<b>Severity: CRITICAL (P1)</b>  |  "
        "<b>Status: CONTAINED &amp; UNDER REMEDIATION</b>"))
    story.append(spacer(6))
    story.append(kv_table([
        ("Organization",      "TechNova Solutions Pvt. Ltd."),
        ("GSTIN",             "27AABCT1234F1Z5"),
        ("Address",           "Level 8, Nesco IT Park, Goregaon East, Mumbai — 400 063"),
        ("CIN",               "U72200MH2018PTC123456"),
        ("Cyber Policy No.",  "POL-2025-CYBER-00041"),
        ("Policy Insurer",    "Accenture Insurance Services Ltd."),
        ("Contact (CISO)",    "Mr. Sanjay Hegde  |  +91 98105 43210  |  ciso@technova.in"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "INCIDENT TIMELINE"))
    tl_rows = [
        [Paragraph("<b>Date/Time (IST)</b>", s["Body"]), Paragraph("<b>Event</b>", s["Body"])],
        ["05 Jun 2025 — 02:14",  "Suspicious login to AWS S3 bucket 'tn-customer-data-prod' from IP 45.134.26.8 (Romania)"],
        ["05 Jun 2025 — 02:17",  "Automated CloudTrail alert triggered — 'GetObject' calls on 847 files"],
        ["05 Jun 2025 — 03:45",  "SIEM alert escalated to on-call engineer — MFA bypass via SIM-swap attack identified"],
        ["05 Jun 2025 — 04:30",  "Compromised IAM credentials rotated; bucket access blocked"],
        ["05 Jun 2025 — 06:00",  "Incident declared P1; CISO, Legal, and DPO informed"],
        ["05 Jun 2025 — 09:00",  "Forensic analysis commenced with external firm (CyberSafe Labs)"],
        ["07 Jun 2025 — 18:00",  "CERT-In notified per IT Act 2000 Amendment 2022 (6-hour rule — delayed notification acknowledged)"],
        ["10 Jun 2025 — 14:00",  "Insurer notified; this report prepared for claim submission"],
    ]
    tl = Table(tl_rows, colWidths=[4.5*cm, 12.5*cm])
    tl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), DARK),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#fff8f0"), white]),
        ("GRID", (0,0), (-1,-1), 0.3, HexColor("#e2e8f0")),
        ("TOPPADDING", (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING", (0,0), (-1,-1), 4),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]))
    story.append(tl)

    story.append(spacer(8))
    story.append(section(s, "ATTACK VECTOR & SCOPE"))
    story.append(body(s,
        "<b>Attack Type:</b> Credential Compromise via SIM-Swap (Social Engineering) → Unauthorized S3 Data Exfiltration<br/><br/>"
        "<b>Entry Point:</b> Employee mobile number (Rahul Tiwari, Cloud Engineer) was SIM-swapped by attacker "
        "who then bypassed OTP-based MFA to access AWS console.<br/><br/>"
        "<b>Data Exfiltrated (Confirmed):</b><br/>"
        "• 12,847 customer records — names, email IDs, phone numbers<br/>"
        "• 3,241 records containing partial payment card data (last 4 digits + expiry only — NO full PAN)<br/>"
        "• 890 records with PAN / Aadhaar numbers (masked in system but unmasked in backup export files)<br/>"
        "• Internal API keys for third-party integrations (Twilio, Razorpay) — all rotated within 4 hours<br/><br/>"
        "<b>Data NOT Exfiltrated:</b> Database dumps, source code, financial records, full card numbers."))

    story.append(spacer(8))
    story.append(section(s, "FINANCIAL IMPACT ESTIMATE"))
    story.append(kv_table([
        ("Incident Response (CyberSafe Labs)", "₹ 18,50,000"),
        ("IT Overtime & Emergency Staffing",   "₹  4,20,000"),
        ("Legal & Compliance Advisory",        "₹  5,80,000"),
        ("Customer Notification Costs",        "₹  2,10,000"),
        ("Credit Monitoring for Affected Customers", "₹  9,60,000"),
        ("PR & Crisis Communication",          "₹  1,50,000"),
        ("Estimated Regulatory Penalties",     "₹ 10,00,000 (estimated — CERT-In / DPDPA)"),
        ("Business Interruption (48 hrs)",     "₹  8,40,000"),
        ("<b>TOTAL CLAIM AMOUNT</b>",          "<b>₹ 60,10,000</b>"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "CONTAINMENT & REMEDIATION"))
    story.append(body(s,
        "1. All compromised IAM credentials rotated within 2 hours of detection.<br/>"
        "2. Affected S3 bucket access restricted to VPC-only (no public internet).<br/>"
        "3. MFA policy upgraded to hardware FIDO2 keys for all privileged accounts.<br/>"
        "4. SIM-swap protection activated on all corporate mobile numbers via carrier.<br/>"
        "5. Affected customers notified via email on 08 June 2025.<br/>"
        "6. Full forensic report by CyberSafe Labs expected by 25 June 2025."))

    story.append(spacer(12))
    story.append(kv_table([
        ("CISO",           "Sanjay Hegde — CIR-TN-2025-00034"),
        ("DPO",            "Neha Kapoor — Data Protection Officer"),
        ("Date Submitted", "10 June 2025"),
    ]))

    story.append(spacer(8))
    story.append(stamp_table("CRITICAL INCIDENT — P1", RED))
    story.append(spacer(6))
    story.append(small(s,
        "This document is CONFIDENTIAL and prepared for insurance claim purposes under Policy "
        "POL-2025-CYBER-00041. Unauthorized disclosure may attract legal liability. "
        "CERT-In Incident Ref: CERT-IN-2025-06-07-00891."))

    doc.build(story)
    print(f"  OK {OUT}/set4_cyber_incident_report.pdf")


def gen_it_security_assessment():
    doc, s = make_doc("set4_it_security_assessment.pdf")
    story = []

    story += header_block(s,
        "CyberSafe Labs LLP — Forensic & Security Services",
        "Post-Incident IT Security Assessment Report",
        "CSL-ASSESS-2025-00034", "20 June 2025")

    story.append(kv_table([
        ("Client",          "TechNova Solutions Pvt. Ltd."),
        ("Assessment Type", "Post-Breach Forensic Review + Security Posture Assessment"),
        ("Reference FIR",   "BKC-PS-2025-1902 (Bandra Kurla Complex Cybercrime PS)"),
        ("Cyber Policy",    "POL-2025-CYBER-00041 — Accenture Insurance Services Ltd."),
        ("Assessment Lead", "Parth Shah, CISSP, CEH — CyberSafe Labs LLP"),
        ("Date",            "20 June 2025"),
    ]))

    story.append(spacer(8))
    story.append(section(s, "EXECUTIVE SUMMARY"))
    story.append(body(s,
        "CyberSafe Labs was engaged on 05 June 2025 to conduct forensic investigation and security "
        "assessment following a data exfiltration event at TechNova Solutions Pvt. Ltd. "
        "The root cause was identified as an SIM-swap-enabled MFA bypass, combined with "
        "over-permissive IAM role assignments. "
        "This report presents findings, risk ratings, and remediation recommendations for "
        "insurance claim documentation and regulatory compliance."))

    story.append(spacer(8))
    story.append(section(s, "VULNERABILITY FINDINGS"))
    vuln_rows = [
        [Paragraph("<b>ID</b>", s["Body"]),
         Paragraph("<b>Finding</b>", s["Body"]),
         Paragraph("<b>Severity</b>", s["Body"]),
         Paragraph("<b>Status</b>", s["Body"])],
        ["V-01", "SMS-OTP used as sole MFA for privileged AWS console access",
         Paragraph("<font color='#ef4444'>CRITICAL</font>", s["Body"]),
         Paragraph("<font color='#10b981'>REMEDIATED</font>", s["Body"])],
        ["V-02", "IAM role 'CloudEngineer' had S3:GetObject on all buckets (wildcard)",
         Paragraph("<font color='#ef4444'>CRITICAL</font>", s["Body"]),
         Paragraph("<font color='#10b981'>REMEDIATED</font>", s["Body"])],
        ["V-03", "S3 bucket 'tn-customer-data-prod' had no versioning or object-lock",
         Paragraph("<font color='#f59e0b'>HIGH</font>", s["Body"]),
         Paragraph("<font color='#f59e0b'>IN PROGRESS</font>", s["Body"])],
        ["V-04", "No Data Loss Prevention (DLP) agent on S3 exfiltration path",
         Paragraph("<font color='#f59e0b'>HIGH</font>", s["Body"]),
         "OPEN"],
        ["V-05", "Backup export files contained unmasked PII (PAN, Aadhaar)",
         Paragraph("<font color='#f59e0b'>HIGH</font>", s["Body"]),
         Paragraph("<font color='#10b981'>REMEDIATED</font>", s["Body"])],
        ["V-06", "CloudTrail log retention was 30 days (insufficient for forensics)",
         Paragraph("<font color='#64748b'>MEDIUM</font>", s["Body"]),
         "OPEN"],
        ["V-07", "No VPC endpoint for S3 — traffic traversed public internet",
         Paragraph("<font color='#64748b'>MEDIUM</font>", s["Body"]),
         Paragraph("<font color='#10b981'>REMEDIATED</font>", s["Body"])],
    ]
    vt = Table(vuln_rows, colWidths=[1.5*cm, 8.5*cm, 2.5*cm, 3*cm])
    vt.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), DARK),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#f8fafc"), white]),
        ("GRID", (0,0), (-1,-1), 0.3, HexColor("#e2e8f0")),
        ("TOPPADDING", (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING", (0,0), (-1,-1), 4),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ]))
    story.append(vt)

    story.append(spacer(8))
    story.append(section(s, "FORENSIC EVIDENCE PRESERVED"))
    story.append(body(s,
        "• AWS CloudTrail logs (30-day retention window): preserved in evidence S3 bucket with object-lock<br/>"
        "• Network Flow Logs (VPC FlowLogs): captured and archived for 90 days<br/>"
        "• Attacker IP addresses: 45.134.26.8 (RO), 91.211.88.4 (NL) — reported to CERT-In<br/>"
        "• SIM-swap telecom records: requisitioned from Airtel via legal order<br/>"
        "• Disk image of compromised EC2 instances: forensic copy maintained"))

    story.append(spacer(8))
    story.append(section(s, "CERTIFICATION FOR INSURANCE"))
    story.append(body(s,
        "CyberSafe Labs LLP certifies that:<br/><br/>"
        "1. The incident described in CIR-TN-2025-00034 is a bona-fide cybersecurity breach "
        "as defined under IRDAI Cyber Insurance guidelines.<br/>"
        "2. The breach was not caused by willful negligence or intentional acts by TechNova employees.<br/>"
        "3. Financial losses claimed in CIR-TN-2025-00034 are reasonable and directly attributable "
        "to this incident.<br/>"
        "4. TechNova Solutions had reasonable security controls in place prior to the incident, "
        "consistent with industry standards for a company of their size and sector."))

    story.append(spacer(12))
    story.append(kv_table([
        ("Lead Assessor",    "Parth Shah, CISSP, CEH — CyberSafe Labs LLP"),
        ("CERT Reg. No.",    "CERT-PANEL-MH-2022-0041"),
        ("Date",             "20 June 2025"),
        ("Report Hash",      "SHA-256: a4f9c2e1...8b3d7f (tamper-evident seal)"),
    ]))

    story.append(spacer(8))
    story.append(stamp_table("FORENSICALLY CERTIFIED", BLUE))
    story.append(spacer(6))
    story.append(small(s,
        "This report is prepared by CyberSafe Labs LLP for the exclusive use of TechNova Solutions Pvt. Ltd. "
        "and their insurer. CyberSafe Labs LLP is an empanelled forensic firm with CERT-In "
        "(Panel Reg. CERT-PANEL-MH-2022-0041). "
        "This report may be submitted to IRDAI, CERT-In, and law enforcement as required."))

    doc.build(story)
    print(f"  OK {OUT}/set4_it_security_assessment.pdf")


# ─────────────────────────── main ────────────────────────────

if __name__ == "__main__":
    print(f"\nGenerating demo documents into ./{OUT}/\n")
    print("-- Set 1: Motor Accident Claim --")
    gen_repair_estimate()
    gen_vehicle_registration()
    print("\n-- Set 2: Health Claim --")
    gen_hospital_discharge()
    gen_lab_report()
    gen_prescription()
    print("\n-- Set 3: Motor Theft / Fraud Ring --")
    gen_police_fir()
    gen_non_traceable_cert()
    print("\n-- Set 4: Cyber Insurance --")
    gen_cyber_incident_report()
    gen_it_security_assessment()
    print(f"\nDone! 9 PDFs written to ./{OUT}/")
    print("\nDemo upload guide:")
    print("  Set 1 (Motor Accident)  -->  repair estimate + vehicle registration")
    print("  Set 2 (Health Claim)    -->  discharge summary + lab report + prescription")
    print("  Set 3 (Fraud Ring Demo) -->  FIR + non-traceable cert  [triggers ring alert!]")
    print("  Set 4 (Cyber Insurance) -->  incident report + security assessment")
