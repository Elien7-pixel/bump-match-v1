#!/usr/bin/env python3
"""Render PRIVACY_POLICY.md to Bump-Match-Privacy-Policy.pdf.

Purpose-built for this document's markdown subset: h1/h2, bold, bullets,
horizontal rules. Run from the repo root:  python3 scripts/generate_privacy_pdf.py
"""

import re
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "PRIVACY_POLICY.md"
OUTPUT = ROOT / "Bump-Match-Privacy-Policy.pdf"

PURPLE_DEEP = HexColor("#8C7FC9")
PINK_DEEP = HexColor("#E96D89")
TEXT = HexColor("#3A3344")
MUTED = HexColor("#6B6474")

BODY = ParagraphStyle(
    "body", fontName="Helvetica", fontSize=10.5, leading=15.5,
    textColor=TEXT, alignment=TA_LEFT, spaceAfter=7,
)
H1 = ParagraphStyle(
    "h1", parent=BODY, fontName="Helvetica-Bold", fontSize=22, leading=27,
    textColor=PINK_DEEP, spaceAfter=4,
)
H2 = ParagraphStyle(
    "h2", parent=BODY, fontName="Helvetica-Bold", fontSize=14, leading=18,
    textColor=PURPLE_DEEP, spaceBefore=14, spaceAfter=6,
)
META = ParagraphStyle("meta", parent=BODY, textColor=MUTED)
BULLET = ParagraphStyle("bullet", parent=BODY, spaceAfter=3)


def inline(text: str) -> str:
    text = (
        text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    )
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text, flags=re.S)


def blocks(lines):
    """Yield (kind, payload) blocks: h1/h2, hr, list, para."""
    para, items = [], []
    for line in lines + [""]:
        stripped = line.strip()
        if stripped.startswith("- "):
            if para:  # flush a lead-in label so it stays above its list
                yield "para", para
                para = []
            items.append(stripped[2:])
            continue
        if stripped and items:
            items[-1] += " " + stripped  # wrapped continuation of a bullet
            continue
        if stripped and not stripped.startswith(("#", "---")):
            para.append(stripped)
            continue
        if items:
            yield "list", items
            items = []
        if para:
            yield "para", para
            para = []
        if stripped.startswith("## "):
            yield "h2", stripped[3:]
        elif stripped.startswith("# "):
            yield "h1", stripped[2:]
        elif stripped.startswith("---"):
            yield "hr", None


def build():
    lines = SOURCE.read_text().splitlines()
    story = []
    for kind, payload in blocks(lines):
        if kind == "h1":
            story.append(Paragraph(inline(payload), H1))
            story.append(
                HRFlowable(width="100%", thickness=2, color=PINK_DEEP, spaceAfter=10)
            )
        elif kind == "h2":
            story.append(Paragraph(inline(payload), H2))
        elif kind == "hr":
            story.append(Spacer(1, 4))
        elif kind == "list":
            story.append(
                ListFlowable(
                    [ListItem(Paragraph(inline(i), BULLET)) for i in payload],
                    bulletType="bullet", bulletFontSize=8, leftIndent=14,
                    bulletColor=PINK_DEEP,
                )
            )
            story.append(Spacer(1, 5))
        elif kind == "para":
            # Keep short all-bold metadata lines (dates) and the contact block
            # on separate lines instead of flowing into one sentence.
            if all(l.startswith("**") for l in payload) or "Riley Rd" in " ".join(payload):
                story.append(Paragraph("<br/>".join(inline(l) for l in payload), META))
            else:
                story.append(Paragraph(inline(" ".join(payload)), BODY))

    doc = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4,
        leftMargin=22 * mm, rightMargin=22 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
        title="Bump Match — Privacy Policy", author="Sherbet Agency (Pty) Ltd",
    )
    doc.build(story)
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    build()
