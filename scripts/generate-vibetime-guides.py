from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf"
OUTPUT.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont("VT", r"C:\Windows\Fonts\malgun.ttf"))
pdfmetrics.registerFont(TTFont("VTB", r"C:\Windows\Fonts\malgunbd.ttf"))
pdfmetrics.registerFontFamily("VT", normal="VT", bold="VTB", italic="VT", boldItalic="VTB")

NAVY = colors.HexColor("#0B1020")
VIOLET = colors.HexColor("#7C3AED")
CYAN = colors.HexColor("#06B6D4")
CORAL = colors.HexColor("#FB7185")
PALE = colors.HexColor("#F4F3FF")
MINT = colors.HexColor("#ECFEFF")
INK = colors.HexColor("#182033")
MUTED = colors.HexColor("#5F6B85")
LINE = colors.HexColor("#DDE3F0")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="VTTitle", fontName="VTB", fontSize=28, leading=38, textColor=NAVY, spaceAfter=8))
styles.add(ParagraphStyle(name="VTLead", fontName="VT", fontSize=11, leading=18, textColor=MUTED, spaceAfter=16))
styles.add(ParagraphStyle(name="VTH2", fontName="VTB", fontSize=18, leading=25, textColor=NAVY, spaceBefore=4, spaceAfter=12))
styles.add(ParagraphStyle(name="VTBody", fontName="VT", fontSize=9.5, leading=15, textColor=INK))
styles.add(ParagraphStyle(name="VTCardTitle", fontName="VTB", fontSize=11, leading=16, textColor=VIOLET, spaceAfter=3))
styles.add(ParagraphStyle(name="VTCardBody", fontName="VT", fontSize=8.8, leading=14, textColor=INK))
styles.add(ParagraphStyle(name="VTTag", fontName="VTB", fontSize=8, leading=10, textColor=CYAN, spaceAfter=6))
styles.add(ParagraphStyle(name="VTCover", fontName="VTB", fontSize=34, leading=44, textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="VTCoverSub", fontName="VT", fontSize=12, leading=20, textColor=colors.HexColor("#D8E7FF"), alignment=TA_CENTER))


class CoverMark(Flowable):
    def __init__(self, size=40 * mm):
        super().__init__()
        self.size = size

    def wrap(self, *_):
        return self.size, self.size

    def draw(self):
        c = self.canv
        s = self.size
        c.saveState()
        c.setFillColor(VIOLET)
        p = c.beginPath()
        p.moveTo(s * .16, s * .18)
        p.lineTo(s * .5, s * .82)
        p.lineTo(s * .84, s * .18)
        c.setLineCap(1)
        c.setLineJoin(1)
        c.setLineWidth(s * .11)
        c.drawPath(p, stroke=1, fill=0)
        c.setStrokeColor(CYAN)
        c.setLineWidth(s * .045)
        arc = c.beginPath()
        arc.moveTo(s * .14, s * .65)
        arc.curveTo(s * .38, s * .86, s * .72, s * .75, s * .88, s * .56)
        c.drawPath(arc, stroke=1, fill=0)
        c.setFillColor(CORAL)
        c.circle(s * .82, s * .16, s * .07, stroke=0, fill=1)
        c.restoreState()


def cover(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#151A38"))
    canvas.circle(width * .08, height * .82, 58 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#082D45"))
    canvas.circle(width * .92, height * .15, 68 * mm, stroke=0, fill=1)
    canvas.setStrokeColor(colors.Color(CYAN.red, CYAN.green, CYAN.blue, alpha=.25))
    canvas.setLineWidth(1)
    for i in range(7):
        y = 30 * mm + i * 9 * mm
        canvas.bezier(0, y, width * .35, y + 20 * mm, width * .68, y - 15 * mm, width, y + 5 * mm)
    canvas.restoreState()


def later_page(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 12 * mm, width, 12 * mm, stroke=0, fill=1)
    canvas.setFont("VTB", 8)
    canvas.setFillColor(colors.white)
    canvas.drawString(18 * mm, height - 7.5 * mm, "VIBETIME")
    canvas.setFillColor(MUTED)
    canvas.setFont("VT", 7.5)
    canvas.drawRightString(width - 18 * mm, 10 * mm, f"VIBETIME GUIDE  |  {doc.page}")
    canvas.restoreState()


def card(title, body, accent=VIOLET):
    data = [[Paragraph(title, styles["VTCardTitle"]), Paragraph(body, styles["VTCardBody"])]]
    table = Table(data, colWidths=[48 * mm, 104 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), PALE),
        ("BACKGROUND", (1, 0), (1, 0), colors.white),
        ("BOX", (0, 0), (-1, -1), .7, LINE),
        ("LINEBEFORE", (0, 0), (0, 0), 3, accent),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return table


def checklist(items):
    rows = [[Paragraph(f"<b>{i + 1:02d}</b>", styles["VTCardTitle"]), Paragraph(text, styles["VTBody"])] for i, text in enumerate(items)]
    table = Table(rows, colWidths=[16 * mm, 136 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), MINT),
        ("GRID", (0, 0), (-1, -1), .6, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return table


def build_guide(filename, audience, subtitle, intro, pillars, steps, checklist_items):
    path = OUTPUT / filename
    doc = SimpleDocTemplate(
        str(path), pagesize=A4, rightMargin=22 * mm, leftMargin=22 * mm,
        topMargin=24 * mm, bottomMargin=20 * mm,
        title=f"VIBETIME {audience} 가이드", author="VIBETIME",
    )
    story = [
        Spacer(1, 38 * mm),
        KeepTogether([CoverMark(), Spacer(1, 7 * mm), Paragraph("VIBETIME", styles["VTCover"]), Spacer(1, 5 * mm), Paragraph(audience, styles["VTCover"]), Spacer(1, 5 * mm), Paragraph(subtitle, styles["VTCoverSub"])]),
        PageBreak(),
        Paragraph("START WITH VIBETIME", styles["VTTag"]),
        Paragraph("바이브타임에서 기회를 만드는 방법", styles["VTTitle"]),
        Paragraph(intro, styles["VTLead"]),
    ]
    for idx, (title, body) in enumerate(pillars):
        story += [card(title, body, [VIOLET, CYAN, CORAL][idx % 3]), Spacer(1, 5 * mm)]
    story += [PageBreak(), Paragraph("WORKFLOW", styles["VTTag"]), Paragraph("처음부터 완료까지", styles["VTTitle"]), Paragraph("각 단계의 상태와 안내 메시지를 확인하면서 순서대로 진행하세요.", styles["VTLead"])]
    for idx, (title, body) in enumerate(steps):
        story += [card(f"STEP {idx + 1}  {title}", body, CYAN if idx % 2 else VIOLET), Spacer(1, 4 * mm)]
    story += [PageBreak(), Paragraph("FINAL CHECK", styles["VTTag"]), Paragraph("시작 전 체크리스트", styles["VTTitle"]), Paragraph("아래 항목을 확인하면 더 빠르고 안전하게 서비스를 이용할 수 있습니다.", styles["VTLead"]), checklist(checklist_items), Spacer(1, 10 * mm), card("고객지원", "서비스 화면의 문의 버튼에서 질문을 남기면 운영자가 확인합니다. 계정 비밀번호나 금융 인증정보는 문의 내용에 입력하지 마세요.", CORAL)]
    doc.build(story, onFirstPage=cover, onLaterPages=later_page)
    return path


creator = build_guide(
    "vibetime-guide-creator.pdf",
    "크리에이터 시작 가이드",
    "숏폼 제작, 캠페인 참여, 배포 수익을 한 흐름으로",
    "바이브타임은 크리에이터가 숏폼 콘텐츠를 만들고, 캠페인과 제작 의뢰에 참여하며, 자신의 활동을 수익 기회로 연결하는 플랫폼입니다.",
    [
        ("콘텐츠 제작", "AI 도구와 편집 도구를 활용해 짧고 명확한 영상을 만들고 판매 또는 캠페인 참여에 활용합니다."),
        ("캠페인 참여", "조건과 마감일을 확인한 뒤 참여하고, 안내된 채널에 게시한 증빙을 제출합니다."),
        ("수익 관리", "승인된 활동의 수익과 거래 내역을 대시보드에서 확인하고 출금을 신청합니다."),
    ],
    [
        ("회원가입", "이메일과 기본 정보를 입력하고 크리에이터 역할을 선택합니다."),
        ("프로필과 채널 등록", "활동 분야, 소개, 소셜 채널 URL을 최신 상태로 관리합니다."),
        ("활동 선택", "영상 등록, 제작 의뢰, 광고 캠페인 중 나에게 맞는 활동을 선택합니다."),
        ("제출과 검수", "요구 형식과 기한을 지키고 결과물 또는 게시 증빙을 제출합니다."),
        ("정산 확인", "승인 상태와 수익 내역을 확인한 뒤 출금 정보를 안전하게 등록합니다."),
    ],
    ["사용 권한이 있는 이미지, 음원, 영상만 사용하기", "캠페인 가이드와 광고 표기 의무 확인하기", "마감일 전에 결과물과 링크를 재확인하기", "SNS 계정 비밀번호를 바이브타임에 입력하지 않기", "정산 계좌 정보와 예금주가 일치하는지 확인하기"],
)

advertiser = build_guide(
    "vibetime-guide-advertiser.pdf",
    "광고주 시작 가이드",
    "숏폼 캠페인 기획부터 검수와 정산까지",
    "바이브타임은 광고주가 목표와 예산에 맞춰 캠페인을 만들고, 크리에이터의 콘텐츠 제작과 배포를 한 화면에서 관리하도록 돕습니다.",
    [
        ("캠페인 설계", "목표, 타깃, 채널, 콘텐츠 형식, 일정과 예산을 구체적으로 설정합니다."),
        ("크리에이터 협업", "참여자와 결과물을 확인하고 필요한 피드백을 기록으로 명확하게 전달합니다."),
        ("성과와 비용 관리", "포인트 사용, 캠페인 상태, 제출 링크와 검수 결과를 한 흐름으로 확인합니다."),
    ],
    [
        ("광고주 가입", "사업 및 담당자 정보를 입력하고 광고주 역할로 계정을 만듭니다."),
        ("포인트 준비", "집행 전에 예상 비용을 확인하고 필요한 포인트를 충전합니다."),
        ("캠페인 생성", "필수 메시지, 금지 표현, 제출 형식, 일정과 대상 채널을 입력합니다."),
        ("참여와 제출 검토", "참여자를 확인하고 제출된 콘텐츠와 게시 증빙을 기준에 따라 검수합니다."),
        ("완료와 기록", "승인 이후 집행 내역과 결과 링크를 보관하고 다음 캠페인에 반영합니다."),
    ],
    ["브랜드 가이드와 필수 문구를 명확하게 제공하기", "과장 광고와 금지 표현 여부 검토하기", "수정 가능 횟수와 검수 기준을 사전에 정하기", "개인정보가 포함된 자료는 최소한으로 전달하기", "예산, 일정, 타깃 채널을 최종 확인한 뒤 제출하기"],
)

print(creator)
print(advertiser)
