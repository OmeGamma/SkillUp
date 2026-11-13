import io
from typing import Dict, Any, Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_skill_report_pdf(report_data: Dict[str, Any], output_filename: Optional[str] = None) -> bytes:
    """
    Generate an executive SkillUp Career Intelligence PDF report in-memory using ReportLab.
    Zero local disk storage: returns raw PDF bytes for streaming or direct MongoDB storage.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Brand Palette
    brand_primary = colors.HexColor("#4F46E5")   # Indigo 600
    brand_secondary = colors.HexColor("#7C3AED") # Violet 600
    brand_dark = colors.HexColor("#1E293B")      # Slate 800
    brand_gray = colors.HexColor("#64748B")      # Slate 500
    brand_light = colors.HexColor("#F8FAFC")     # Slate 50
    brand_green = colors.HexColor("#10B981")     # Emerald 500
    brand_amber = colors.HexColor("#F59E0B")     # Amber 500
    
    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=brand_primary,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=brand_gray,
        spaceAfter=12
    )
    
    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=brand_dark,
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=brand_dark
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=brand_dark
    )
    
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=brand_gray,
        alignment=1 # Centered
    )

    story = []
    
    # Header Banner
    story.append(Paragraph("SKILLUP — CAREER INTELLIGENCE REPORT", title_style))
    story.append(Paragraph("Build Skills. Predict Readiness. Unlock Opportunities.", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=brand_primary, spaceAfter=12))
    
    # Target and Metadata
    target_role = report_data.get("target_role_or_job", "Software Engineering")
    candidate_name = report_data.get("candidate_name", "Student Candidate")
    overall_score = report_data.get("overall_score", 0.0)
    created_at = report_data.get("created_at", "October 2026")
    
    meta_data = [
        [Paragraph("<b>Target Role / Position:</b>", body_style), Paragraph(str(target_role), body_bold),
         Paragraph("<b>Overall Score:</b>", body_style), Paragraph(f"<b>{overall_score}%</b>", title_style)],
        [Paragraph("<b>Candidate Name:</b>", body_style), Paragraph(str(candidate_name), body_style),
         Paragraph("<b>Date Generated:</b>", body_style), Paragraph(str(created_at)[:19], body_style)]
    ]
    
    meta_table = Table(meta_data, colWidths=[1.5*inch, 2.2*inch, 1.2*inch, 2.1*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), brand_light),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))
    
    # Metric Breakdown Card
    story.append(Paragraph("Score Component Breakdown", h2_style))
    data_payload = report_data.get("data", {})
    req_cov = data_payload.get("required_coverage", 0.0)
    pref_cov = data_payload.get("preferred_coverage", 0.0)
    txt_sim = data_payload.get("text_similarity", 0.0)
    
    breakdown_data = [
        [Paragraph("<b>Evaluation Component</b>", body_bold), Paragraph("<b>Score</b>", body_bold), Paragraph("<b>Weight</b>", body_bold), Paragraph("<b>Methodology</b>", body_bold)],
        [Paragraph("Required Skills Coverage", body_style), Paragraph(f"{req_cov}%", body_style), Paragraph("50%", body_style), Paragraph("Exact & alias taxonomy matching across required skills", body_style)],
        [Paragraph("Preferred Skills Coverage", body_style), Paragraph(f"{pref_cov}%", body_style), Paragraph("25%", body_style), Paragraph("Assessment of preferred competitive skills", body_style)],
        [Paragraph("Resume / JD Text Similarity", body_style), Paragraph(f"{txt_sim}%", body_style), Paragraph("25%", body_style), Paragraph("TF-IDF vectorized cosine text similarity", body_style)],
    ]
    
    bd_table = Table(breakdown_data, colWidths=[2.0*inch, 1.0*inch, 1.0*inch, 3.0*inch])
    bd_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EEF2FF")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    story.append(bd_table)
    story.append(Spacer(1, 10))
    
    # Skills Analysis (Matched vs Missing)
    story.append(Paragraph("Verified Evidence vs Missing Skill Gaps", h2_style))
    matched_req = [m.get("skill") for m in data_payload.get("matched_required", [])]
    missing_req = [m.get("skill") for m in data_payload.get("missing_required", [])]
    
    skills_data = [
        [Paragraph("<b>Matched Skills (With Evidence)</b>", body_bold), Paragraph("<b>Prioritized Skill Gaps (To Acquire)</b>", body_bold)],
        [
            Paragraph(", ".join(matched_req) if matched_req else "None documented in resume", body_style),
            Paragraph(", ".join(missing_req) if missing_req else "All required skills verified!", body_style)
        ]
    ]
    sk_table = Table(skills_data, colWidths=[3.5*inch, 3.5*inch])
    sk_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#ECFDF5")),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor("#FEF2F2")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(sk_table)
    story.append(Spacer(1, 10))
    
    # Learning Recommendations
    recs = data_payload.get("learning_recommendations", [])
    if recs:
        story.append(Paragraph("Targeted Learning Roadmap & Action Items", h2_style))
        rec_data = [
            [Paragraph("<b>Skill Area</b>", body_bold), Paragraph("<b>Target Action</b>", body_bold), Paragraph("<b>Est. Effort</b>", body_bold)]
        ]
        for r in recs[:4]:
            rec_data.append([
                Paragraph(r.get("skill", ""), body_bold),
                Paragraph(r.get("action", ""), body_style),
                Paragraph(r.get("estimated_hours", "8h"), body_style)
            ])
        rec_table = Table(rec_data, colWidths=[1.8*inch, 4.2*inch, 1.0*inch])
        rec_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ]))
        story.append(rec_table)
        story.append(Spacer(1, 10))

    # Transparency and Methodology Notice
    story.append(Paragraph("Scoring Methodology & Transparency Notice", h2_style))
    method_text = (
        "This evaluation is computed dynamically using deterministic skill normalization, "
        "evidence cross-referencing from verified projects, and TF-IDF cosine similarity. "
        "Missing attributes represent absence of explicit resume evidence rather than definitive lack of capability. "
        "SkillUp strictly prevents opaque automated exclusions."
    )
    story.append(Paragraph(method_text, body_style))
    story.append(Spacer(1, 14))
    
    # Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=brand_gray, spaceAfter=8))
    story.append(Paragraph("SkillUp | Developed by OmeGamma — Confidential Career Intelligence Document", footer_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
