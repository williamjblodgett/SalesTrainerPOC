from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "suadence-capabilities.pdf"
LOGO = ROOT / "public" / "brand" / "suadence-logo-v2.png"

NAVY = HexColor("#071E41")
TEAL = HexColor("#06AE9B")
GREEN = HexColor("#40C86A")
CYAN = HexColor("#0AA9D8")
PAPER = HexColor("#F4F8FC")
MUTED = HexColor("#66768A")
LINE = HexColor("#DCE6EF")


def register_fonts() -> tuple[str, str]:
    regular = Path("C:/Windows/Fonts/arial.ttf")
    bold = Path("C:/Windows/Fonts/arialbd.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("Suadence", str(regular)))
        pdfmetrics.registerFont(TTFont("Suadence-Bold", str(bold)))
        return "Suadence", "Suadence-Bold"
    return "Helvetica", "Helvetica-Bold"


def paragraph(canvas: Canvas, text: str, x: float, y: float, width: float, style: ParagraphStyle) -> float:
    p = Paragraph(text, style)
    _, height = p.wrap(width, 1000)
    p.drawOn(canvas, x, y - height)
    return height


def card(canvas: Canvas, x: float, y: float, width: float, height: float, number: str, title: str, body: str, regular: str, bold: str) -> None:
    canvas.setFillColor(white)
    canvas.setStrokeColor(LINE)
    canvas.roundRect(x, y, width, height, 10, fill=1, stroke=1)
    canvas.setFillColor(TEAL)
    canvas.circle(x + 22, y + height - 23, 11, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont(bold, 9)
    canvas.drawCentredString(x + 22, y + height - 26, number)
    canvas.setFillColor(NAVY)
    canvas.setFont(bold, 11)
    canvas.drawString(x + 42, y + height - 27, title)
    body_style = ParagraphStyle("body", fontName=regular, fontSize=8.4, leading=11.2, textColor=MUTED, alignment=TA_LEFT)
    paragraph(canvas, body, x + 15, y + height - 44, width - 30, body_style)


def build() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    regular, bold = register_fonts()
    canvas = Canvas(str(OUTPUT), pagesize=letter)
    page_w, page_h = letter

    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, page_w, page_h, fill=1, stroke=0)
    canvas.setFillColor(NAVY)
    canvas.rect(0, page_h - 174, page_w, 174, fill=1, stroke=0)
    canvas.setFillColor(CYAN)
    canvas.rect(0, page_h - 8, page_w * 0.45, 8, fill=1, stroke=0)
    canvas.setFillColor(GREEN)
    canvas.rect(page_w * 0.45, page_h - 8, page_w * 0.55, 8, fill=1, stroke=0)

    canvas.setFillColor(white)
    canvas.roundRect(38, page_h - 91, 238, 58, 8, fill=1, stroke=0)
    canvas.drawImage(ImageReader(str(LOGO)), 47, page_h - 83, width=220, height=42, preserveAspectRatio=True, mask="auto", anchor="c")
    canvas.setFillColor(white)
    canvas.setFont(bold, 22)
    canvas.drawString(38, page_h - 126, "Practice before the conversation counts.")
    canvas.setFillColor(HexColor("#B9CCE0"))
    canvas.setFont(regular, 9.5)
    canvas.drawString(38, page_h - 146, "AI buyer simulation, evidence-based coaching, and manager-led readiness in one workspace.")

    canvas.setFillColor(TEAL)
    canvas.setFont(bold, 8)
    canvas.drawString(38, page_h - 203, "THE COMPLETE PRACTICE-TO-COACHING LOOP")

    gap = 12
    card_w = (page_w - 76 - gap) / 2
    card_h = 91
    left = 38
    right = left + card_w + gap
    rows = [page_h - 310, page_h - 413, page_h - 516]
    cards = [
        ("01", "Persona Lab", "Build realistic buyers from structured role, KPI, pain, objection, decision-process, and communication metrics."),
        ("02", "Transcript intelligence", "Paste or upload customer conversations, redact sensitive details, extract patterns, review evidence, and approve reusable personas."),
        ("03", "Adaptive AI buyers", "Practice against guarded, skeptical, time-conscious buyers that reveal information only after relevant discovery."),
        ("04", "Text and voice practice", "Run persistent text sessions or low-latency WebRTC voice calls with captions, interruption, mute, timer, and saved transcripts."),
        ("05", "Evidence-first scoring", "Use manager-owned 0-4 anchors, weights totaling 100, transcript citations, deterministic math, and insufficient-evidence safeguards."),
        ("06", "Manager coaching OS", "Prioritize review moments, assign focused drills, track readiness by role, calibrate AI judgment, and identify team-wide skill gaps."),
    ]
    for index, details in enumerate(cards):
        x = left if index % 2 == 0 else right
        y = rows[index // 2]
        card(canvas, x, y, card_w, card_h, *details, regular, bold)

    canvas.setFillColor(NAVY)
    canvas.roundRect(38, 92, page_w - 76, 72, 12, fill=1, stroke=0)
    canvas.setFillColor(GREEN)
    canvas.setFont(bold, 9)
    canvas.drawString(54, 141, "BUILT FOR SALES LEADERS")
    canvas.setFillColor(white)
    canvas.setFont(bold, 11.5)
    canvas.drawString(54, 119, "Less manager administration. More targeted practice. Clear proof of behavior change.")
    canvas.setFillColor(HexColor("#B9CCE0"))
    canvas.setFont(regular, 8.4)
    canvas.drawString(54, 102, "Secure multi-tenant architecture, immutable versions, role-aware access, cost controls, and deterministic mock mode.")

    canvas.setFillColor(MUTED)
    canvas.setFont(regular, 7.2)
    canvas.drawString(38, 58, "Product capability brief - July 2026")
    canvas.setFillColor(TEAL)
    canvas.setFont(bold, 7.2)
    canvas.drawRightString(page_w - 38, 58, "SUADENCE  |  Practice the conversation before it counts.")

    canvas.showPage()
    canvas.save()


if __name__ == "__main__":
    build()
