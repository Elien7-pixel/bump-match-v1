#!/usr/bin/env python3
"""Generate BumpMatch Wireframe & Copy PDF using reportlab."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white, Color
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Flowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "WIREFRAME_AND_COPY.pdf")

# Colors
PRIMARY = HexColor("#C8649C")
DARK_BG = HexColor("#1A1A2E")
LIGHT_BG = HexColor("#F8F9FA")
ACCENT_BLUE = HexColor("#3B82F6")
ACCENT_GREEN = HexColor("#10B981")
ACCENT_AMBER = HexColor("#F59E0B")
ACCENT_RED = HexColor("#EF4444")
GREY = HexColor("#6B7280")
DARK_TEXT = HexColor("#1F2937")
WIRE_BG = HexColor("#F3F4F6")
WIRE_BORDER = HexColor("#D1D5DB")
CODE_BG = HexColor("#F0F0F0")

# Build document
doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    topMargin=2*cm,
    bottomMargin=2*cm,
    leftMargin=2*cm,
    rightMargin=2*cm,
)

styles = getSampleStyleSheet()

# Custom styles
styles.add(ParagraphStyle(
    name="DocTitle",
    fontSize=28,
    leading=34,
    textColor=PRIMARY,
    alignment=TA_CENTER,
    spaceAfter=6,
    fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    name="DocSubtitle",
    fontSize=13,
    leading=18,
    textColor=GREY,
    alignment=TA_CENTER,
    spaceAfter=30,
    fontName="Helvetica",
))
styles.add(ParagraphStyle(
    name="H1",
    fontSize=22,
    leading=28,
    textColor=DARK_TEXT,
    spaceBefore=24,
    spaceAfter=12,
    fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    name="H2",
    fontSize=16,
    leading=22,
    textColor=PRIMARY,
    spaceBefore=18,
    spaceAfter=8,
    fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    name="H3",
    fontSize=13,
    leading=18,
    textColor=DARK_TEXT,
    spaceBefore=12,
    spaceAfter=6,
    fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    name="Body",
    fontSize=10,
    leading=15,
    textColor=DARK_TEXT,
    spaceAfter=6,
    fontName="Helvetica",
))
styles.add(ParagraphStyle(
    name="Copy",
    fontSize=10,
    leading=15,
    textColor=HexColor("#374151"),
    spaceAfter=4,
    fontName="Helvetica",
    leftIndent=12,
))
styles.add(ParagraphStyle(
    name="CopyItalic",
    fontSize=10,
    leading=15,
    textColor=GREY,
    spaceAfter=4,
    fontName="Helvetica-Oblique",
    leftIndent=12,
))
styles.add(ParagraphStyle(
    name="Alert",
    fontSize=9,
    leading=14,
    textColor=HexColor("#92400E"),
    spaceAfter=3,
    fontName="Helvetica",
    leftIndent=16,
    backColor=HexColor("#FFFBEB"),
    borderPadding=4,
))
styles.add(ParagraphStyle(
    name="Wire",
    fontSize=9,
    leading=13,
    textColor=HexColor("#4B5563"),
    fontName="Courier",
    spaceAfter=2,
    leftIndent=8,
))
styles.add(ParagraphStyle(
    name="WireLabel",
    fontSize=8,
    leading=11,
    textColor=GREY,
    fontName="Helvetica-Oblique",
    leftIndent=8,
    spaceAfter=2,
))
styles.add(ParagraphStyle(
    name="TableCell",
    fontSize=9,
    leading=13,
    textColor=DARK_TEXT,
    fontName="Helvetica",
))
styles.add(ParagraphStyle(
    name="TableHeader",
    fontSize=9,
    leading=13,
    textColor=white,
    fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    name="BulletItem",
    fontSize=10,
    leading=15,
    textColor=DARK_TEXT,
    fontName="Helvetica",
    leftIndent=24,
    bulletIndent=12,
    spaceAfter=3,
))


class WireframeBox(Flowable):
    """A bordered box with monospace content for wireframe illustrations."""
    def __init__(self, lines, width=None, title=None):
        Flowable.__init__(self)
        self.lines = lines
        self.box_width = width or 440
        self.title = title
        self.line_height = 13
        self.padding = 10

    def wrap(self, availWidth, availHeight):
        title_h = 20 if self.title else 0
        h = len(self.lines) * self.line_height + 2 * self.padding + title_h
        return (min(self.box_width, availWidth), h)

    def draw(self):
        w, h = self.wrap(self.box_width, 0)
        # Background
        self.canv.setFillColor(WIRE_BG)
        self.canv.setStrokeColor(WIRE_BORDER)
        self.canv.setLineWidth(0.5)
        self.canv.roundRect(0, 0, w, h, 6, fill=1, stroke=1)

        # Title bar
        y = h - self.padding
        if self.title:
            self.canv.setFillColor(PRIMARY)
            self.canv.roundRect(0, h - 22, w, 22, 6, fill=1, stroke=0)
            # Cover bottom corners of title bar
            self.canv.rect(0, h - 22, w, 8, fill=1, stroke=0)
            self.canv.setFillColor(white)
            self.canv.setFont("Helvetica-Bold", 9)
            self.canv.drawString(self.padding, h - 16, self.title)
            y -= 18

        # Lines
        self.canv.setFillColor(HexColor("#4B5563"))
        self.canv.setFont("Courier", 8.5)
        for line in self.lines:
            self.canv.drawString(self.padding, y - self.line_height + 3, line)
            y -= self.line_height


class ColorBar(Flowable):
    """A thin colored bar for visual separation."""
    def __init__(self, color=PRIMARY, width=None, height=3):
        Flowable.__init__(self)
        self.color = color
        self.bar_width = width
        self.bar_height = height

    def wrap(self, availWidth, availHeight):
        return (self.bar_width or availWidth, self.bar_height)

    def draw(self):
        w, h = self.wrap(500, 0)
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, w, h, 1.5, fill=1, stroke=0)


def hr():
    return HRFlowable(width="100%", thickness=0.5, color=WIRE_BORDER, spaceAfter=8, spaceBefore=8)

def colored_hr():
    return ColorBar(PRIMARY)

def spacer(h=8):
    return Spacer(1, h)

def p(text, style="Body"):
    return Paragraph(text, styles[style])

def h1(text):
    return Paragraph(text, styles["H1"])

def h2(text):
    return Paragraph(text, styles["H2"])

def h3(text):
    return Paragraph(text, styles["H3"])

def copy(text):
    return Paragraph(text, styles["Copy"])

def italic(text):
    return Paragraph(text, styles["CopyItalic"])

def alert(text):
    return Paragraph(text, styles["Alert"])

def bullet(text):
    return Paragraph(f"&bull; {text}", styles["BulletItem"])

def wire_box(lines, title=None):
    return WireframeBox(lines, title=title)


# ─── BUILD STORY ────────────────────────────────────────────

story = []

# Title page
story.append(Spacer(1, 80))
story.append(colored_hr())
story.append(spacer(16))
story.append(p("BumpMatch", "DocTitle"))
story.append(p("Complete Wireframe &amp; UI Copy", "DocSubtitle"))
story.append(p("All screens, modals, dialogs, alerts, and text content", "DocSubtitle"))
story.append(spacer(8))
story.append(colored_hr())
story.append(spacer(40))

# TOC
story.append(h2("Table of Contents"))
toc_items = [
    "1. Landing Page (Authentication)",
    "2. Onboarding Tutorial",
    "3. App Page (Main Swiping Screen)",
    "4. Menu Drawer",
    "5. Partner Invite Dialog",
    "6. Language Picker Modal",
    "7. Submit Name Modal",
    "8. Profile Screen",
    "9. Settings Screen",
    "10. Partner Screen",
    "11. Match Reveal Animation",
    "12. Pregnancy Tracker",
    "13. Navigation Structure",
]
for item in toc_items:
    story.append(p(item))
story.append(PageBreak())

# ─── 1. LANDING PAGE ────────────────────────────────────────

story.append(h1("1. Landing Page"))
story.append(p("The entry point of the app. Features a background image with animated floating glass name cards, a gradient overlay, and glassmorphism UI elements."))
story.append(spacer(8))

story.append(wire_box([
    "+----------------------------------+",
    "|   [Background Image + Gradient]  |",
    "|                                  |",
    "|  Floating Glass Name Cards:      |",
    "|  [Oliver ♥] [Annelie ♥]         |",
    "|  [Sipho ♥]  [Lerato ♥]          |",
    "|  [Lufuno ♥]                      |",
    "|                                  |",
    "|  +============================+  |",
    "|  |    [BumpMatch Logo]        |  |",
    "|  |                            |  |",
    "|  |  Find the perfect name     |  |",
    "|  |  for your little one,      |  |",
    "|  |  together.                 |  |",
    "|  +============================+  |",
    "|                                  |",
    "|  [========= Sign Up =========]  |",
    "|  [--------- Log In ----------]  |",
    "+----------------------------------+",
], title="Landing Page"))

story.append(spacer(12))
story.append(h2("Landing Page Copy"))
story.append(copy("<b>Tagline:</b> \"Find the perfect name for your little one, together.\""))
story.append(copy("<b>Primary CTA:</b> \"Sign Up\""))
story.append(copy("<b>Secondary CTA:</b> \"Log In\""))

story.append(spacer(12))
story.append(h2("Animated Floating Cards"))
story.append(p("Glass-morphism cards float and animate across the background with baby names from multiple cultures:"))
story.append(bullet("Oliver (English)"))
story.append(bullet("Annelie (Afrikaans)"))
story.append(bullet("Sipho (isiZulu)"))
story.append(bullet("Lerato (Sepedi)"))
story.append(bullet("Lufuno (Tshivenda)"))
story.append(italic("Tablet adds: Riaan (Afrikaans), Lindiwe (isiZulu), Kabelo (Sepedi)"))

# Sign Up Modal
story.append(PageBreak())
story.append(h2("Sign Up Modal"))
story.append(wire_box([
    "+==================================+",
    "|  Create Account            [X]   |",
    "|  Tell us a bit about yourself.   |",
    "|                                  |",
    "|  First Name: [e.g. Naledi     ]  |",
    "|  Last Name:  [e.g. Ndlovu     ]  |",
    "|  DOB:  [Select your date of birth|",
    "|  Email: [naledi@example.com    ]  |",
    "|  Password: [Minimum 8 characters]|",
    "|                                  |",
    "|  I am a...                       |",
    "|  [Mom]  [Dad]  [Partner]         |",
    "|                                  |",
    "|  What are you expecting?         |",
    "|  [Boy]  [Girl]  [Don't Know]     |",
    "|                                  |",
    "|  Status                          |",
    "|  [Expecting soon]                |",
    "|  [Planning ahead]                |",
    "|                                  |",
    "|  (if Expecting soon):            |",
    "|  When are you expecting?         |",
    "|  [Select your due date]          |",
    "|                                  |",
    "|  [Go Back]      [Sign Up]        |",
    "+==================================+",
], title="Sign Up Modal"))

story.append(spacer(8))
story.append(h3("Sign Up Copy"))
story.append(copy("<b>Title:</b> \"Create Account\""))
story.append(copy("<b>Subtitle:</b> \"Tell us a bit about yourself.\""))
story.append(copy("<b>Fields:</b> First Name, Last Name, Date of Birth, Email, Password"))
story.append(copy("<b>Placeholders:</b> \"e.g. Naledi\", \"e.g. Ndlovu\", \"Select your date of birth\", \"naledi@example.com\", \"Minimum 8 characters\""))
story.append(copy("<b>Labels:</b> \"I am a...\", \"What are you expecting?\", \"Status\", \"When are you expecting?\""))
story.append(copy("<b>Options:</b> Mom / Dad / Partner | Boy / Girl / Don't Know | Expecting soon / Planning ahead"))
story.append(copy("<b>Buttons:</b> \"Go Back\" (ghost) / \"Sign Up\" (primary) / \"Creating...\" (loading)"))

# Login Modal
story.append(spacer(12))
story.append(h2("Login Modal"))
story.append(wire_box([
    "+==================================+",
    "|  Welcome Back!             [X]   |",
    "|                                  |",
    "|  Enter your credentials          |",
    "|  to continue                     |",
    "|                                  |",
    "|  Email: [naledi@example.com    ]  |",
    "|  Password: [Enter your password]  |",
    "|                                  |",
    "|  [Log In]                        |",
    "|                                  |",
    "|  Forgot Password?                |",
    "|  Don't have an account? Sign Up  |",
    "+==================================+",
], title="Login Modal"))

story.append(spacer(8))
story.append(h3("Login Copy"))
story.append(copy("<b>Title:</b> \"Welcome Back!\""))
story.append(copy("<b>Subtitle:</b> \"Enter your credentials to continue\""))
story.append(copy("<b>Placeholders:</b> \"naledi@example.com\", \"Enter your password\""))
story.append(copy("<b>CTA:</b> \"Log In\" / \"Logging in...\""))
story.append(copy("<b>Links:</b> \"Forgot Password?\" / \"Don't have an account? <b>Sign Up</b>\""))

# Forgot Password
story.append(spacer(12))
story.append(h2("Forgot Password Flow"))
story.append(h3("Step 1: Request Reset Code"))
story.append(copy("<b>Title:</b> \"Reset Password\""))
story.append(copy("<b>Subtitle:</b> \"Enter your email to receive a reset code\""))
story.append(copy("<b>CTA:</b> \"Send Reset Code\" / \"Sending...\""))
story.append(copy("<b>Link:</b> \"Go Back\""))

story.append(spacer(8))
story.append(h3("Step 2: Enter Code"))
story.append(copy("<b>Title:</b> \"Enter Reset Code\""))
story.append(copy("<b>Subtitle:</b> \"Enter the code sent to your email and your new password\""))
story.append(copy("<b>Fields:</b> Reset Code (\"Enter reset code\"), New Password (\"Minimum 8 characters\")"))
story.append(copy("<b>CTA:</b> \"Reset Password\" / \"Resetting...\""))

# Alerts
story.append(spacer(12))
story.append(h3("Landing Page Alerts"))
story.append(alert("\"Required\" / \"Please fill in all fields including date of birth.\""))
story.append(alert("\"Invalid Password\" / \"Password must be at least 8 characters.\""))
story.append(alert("\"Sign Up Failed\" / \"Please try again.\""))
story.append(alert("\"Required\" / \"Please enter your email and password.\""))
story.append(alert("\"Login Failed\" / \"Invalid email or password.\""))
story.append(alert("\"Error\" / \"Please enter your email address\""))
story.append(alert("\"Code Sent\" / \"Check your email for the reset code.\""))
story.append(alert("\"Success\" / \"Password reset successfully. Please log in.\""))
story.append(alert("\"Connection timed out. Please check your internet connection and try again.\""))

# ─── 2. ONBOARDING ──────────────────────────────────────────

story.append(PageBreak())
story.append(h1("2. Onboarding Tutorial"))
story.append(p("A 4-slide carousel shown after first sign up. Modal overlay with card-based slides."))

slides = [
    ("Slide 1: Swipe to Discover", "heart-outline (pink)", "\"Swipe right on names you love, left on ones you don't. It's that simple!\"", "[Next]"),
    ("Slide 2: Better Together", "people-outline (blue)", "\"Are you doing this solo or with a partner? Link up to discover names you both love!\"", "[Add Partner Now] / [I'll do this solo / Add later]"),
    ("Slide 3: Favorite Your Top Picks", "star-outline (amber)", "\"Star your absolute favorites in the Liked Names list to keep your top choices front and center.\"", "[Next]"),
    ("Slide 4: Filter & Explore", "options-outline (green)", "\"Filter by gender, language, meaning, and popularity. Find names from 20+ cultures.\"", "[Let's Go!]"),
]

for title, icon, desc, buttons in slides:
    story.append(h3(title))
    story.append(copy(f"<b>Icon:</b> {icon}"))
    story.append(copy(f"<b>Description:</b> {desc}"))
    story.append(copy(f"<b>Buttons:</b> {buttons}"))
    story.append(spacer(4))

story.append(copy("<b>Skip button:</b> \"Skip\" (top-right, all slides)"))
story.append(copy("<b>Navigation:</b> Pagination dots + horizontal swipe"))

# ─── 3. APP PAGE ─────────────────────────────────────────────

story.append(PageBreak())
story.append(h1("3. App Page (Main Swiping Screen)"))
story.append(p("The core experience. Users swipe through baby name cards, filter by gender/language/meaning, and track their progress."))
story.append(spacer(8))

story.append(wire_box([
    "+----------------------------------+",
    "| [+person]  [BumpMatch]     [=]   |  <- header",
    "|                                  |",
    "| [emoji] Week 24 - Baby is the   |  <- pregnancy tracker",
    "|   size of a corn on the cob!    |",
    "|   About 30cm long . 16 wks to go|",
    "|                                  |",
    "| [Globe All Languages v]          |  <- filter bar",
    "|          [Boy][Girl][Neutral][All]|",
    "|                                  |",
    "| [Search by meaning...        ]   |",
    "| [* Trending]  [sparkle Celebrity]|",
    "|                                  |",
    "| +============================+   |",
    "| |         Amahle             |   |",
    "| |         Ndlovu             |   |  <- name card",
    "| |         ------             |   |",
    "| |         Girl               |   |",
    "| |  \"Beautiful one\" . Zulu    |   |",
    "| +============================+   |",
    "|                                  |",
    "|       [rew]  [X]  [heart]        |  <- actions",
    "|                                  |",
    "| 24 names explored - 8 liked      |",
    "| Welcome back, Naledi!            |",
    "+----------------------------------+",
], title="App Page - Main Swiping"))

story.append(spacer(12))
story.append(h2("App Page Copy"))
story.append(h3("Header"))
story.append(copy("<b>Left icon:</b> Add partner (person-add-outline) - hidden if partner connected"))
story.append(copy("<b>Center:</b> BumpMatch logo (text)"))
story.append(copy("<b>Right icon:</b> Menu (hamburger)"))

story.append(h3("Filter Bar"))
story.append(copy("<b>Language button:</b> \"All Languages\" (default) / \"{language}\" / \"{N} selected\""))
story.append(copy("<b>Gender pills:</b> \"Boy\" / \"Girl\" / \"Neutral\" / \"All\""))

story.append(h3("Search Bar"))
story.append(copy("<b>Placeholder:</b> \"Search by meaning...\""))
story.append(copy("<b>Toggle buttons:</b> \"Trending\" (star icon) / \"Celebrity\" (sparkles icon)"))

story.append(h3("Empty State"))
story.append(copy("<b>Text:</b> \"No more names!\""))
story.append(copy("<b>CTA:</b> \"Load More\""))

story.append(h3("Footer"))
story.append(copy("<b>Stats:</b> \"{X} names explored - {Y} liked\""))
story.append(copy("<b>Greeting:</b> \"Welcome back, {firstName}!\""))

# ─── 4. MENU DRAWER ─────────────────────────────────────────

story.append(PageBreak())
story.append(h1("4. Menu Drawer"))
story.append(p("Bottom sheet slide-up menu accessible from the hamburger icon on the App page."))
story.append(spacer(8))

story.append(wire_box([
    "+==================================+",
    "|  Menu                      [X]   |",
    "|==================================|",
    "|  [person]   Profile           >  |",
    "|  [heart]    Liked Names       >  |",
    "|  [people]   Partner           >  |",
    "|  [+circle]  Suggest a Name    >  |",
    "|  [gear]     Settings          >  |",
    "|  --------------------------------|",
    "|  [exit]     Log Out              |",
    "+==================================+",
], title="Menu Drawer"))

story.append(spacer(8))
story.append(h3("Menu Items"))
story.append(copy("\"Profile\" / \"Liked Names\" / \"Partner\" / \"Suggest a Name\" / \"Settings\" / \"Log Out\""))
story.append(alert("Log Out alert: \"Log Out\" / \"Are you sure you want to log out?\" [Cancel] [Log Out]"))

# ─── 5. PARTNER INVITE DIALOG ───────────────────────────────

story.append(spacer(16))
story.append(h1("5. Partner Invite Dialog"))
story.append(p("Quick partner invite popup accessible from the App page header."))
story.append(spacer(8))

story.append(wire_box([
    "+==================================+",
    "|                            [X]   |",
    "|       (people icon)              |",
    "|    \"Add a Partner\"               |",
    "|  \"Share this code to sync        |",
    "|   your likes\"                    |",
    "|                                  |",
    "|       +----------+               |",
    "|       | [QR Code]|               |",
    "|       +----------+               |",
    "|                                  |",
    "|  Your Invite Code:               |",
    "|  [NDLOV-AB12]                    |",
    "|                                  |",
    "|  [=== Share Invite Link ===]     |",
    "|                                  |",
    "|  \"Join with partner's code       |",
    "|   instead\"                       |",
    "+==================================+",
], title="Partner Invite Dialog"))

story.append(spacer(8))
story.append(h3("Partner Invite Copy"))
story.append(copy("<b>Title:</b> \"Add a Partner\""))
story.append(copy("<b>Subtitle:</b> \"Share this code to sync your likes\""))
story.append(copy("<b>Label:</b> \"Your Invite Code:\""))
story.append(copy("<b>CTA:</b> \"Share Invite Link\""))
story.append(copy("<b>Link:</b> \"Join with partner's code instead\""))
story.append(copy("<b>Share message:</b> \"Hey! I'm using BumpMatch to find the perfect baby name. Want to swipe together? Join the {surname} family name hunt: Code: {code} {link}\""))
story.append(alert("QR tap: \"Share QR Code\" / \"Your partner can scan this QR code to join you on BumpMatch. If they don't have the app yet, it will take them to the download page.\""))

# ─── 6. LANGUAGE PICKER ─────────────────────────────────────

story.append(PageBreak())
story.append(h1("6. Language Picker Modal"))
story.append(wire_box([
    "+==================================+",
    "|  Select Languages          [X]   |",
    "|  \"Select multiple languages to   |",
    "|   see names from all of them\"    |",
    "|==================================|",
    "|  All                       [v]   |",
    "|  Afrikaans                 [ ]   |",
    "|  English                   [ ]   |",
    "|  German                    [ ]   |",
    "|  Greek                     [ ]   |",
    "|  Irish                     [ ]   |",
    "|  isiNdebele                [ ]   |",
    "|  isiXhosa                  [ ]   |",
    "|  isiZulu                   [ ]   |",
    "|  Italian                   [ ]   |",
    "|  Korean                    [ ]   |",
    "|  Latin                     [ ]   |",
    "|  Portuguese                [ ]   |",
    "|  Sepedi                    [ ]   |",
    "|  Sesotho                   [ ]   |",
    "|  Setswana                  [ ]   |",
    "|  siSwati                   [ ]   |",
    "|  Spanish                   [ ]   |",
    "|  Tshivenda                 [ ]   |",
    "|  Xitsonga                  [ ]   |",
    "|==================================|",
    "|  [Done]                          |",
    "+==================================+",
], title="Language Picker"))

story.append(spacer(8))
story.append(copy("<b>Title:</b> \"Select Languages\""))
story.append(copy("<b>Subtitle:</b> \"Select multiple languages to see names from all of them\""))
story.append(copy("<b>CTA:</b> \"Done\""))
story.append(copy("<b>20 languages:</b> All, Afrikaans, English, German, Greek, Irish, isiNdebele, isiXhosa, isiZulu, Italian, Korean, Latin, Portuguese, Sepedi, Sesotho, Setswana, siSwati, Spanish, Tshivenda, Xitsonga"))

# ─── 7. SUBMIT NAME MODAL ───────────────────────────────────

story.append(spacer(16))
story.append(h1("7. Submit Name Modal"))

story.append(wire_box([
    "+==================================+",
    "|  Suggest a Name            [X]   |",
    "|==================================|",
    "|  \"Know a great baby name?        |",
    "|   Submit it for others to        |",
    "|   discover.\"                     |",
    "|                                  |",
    "|  Name: [e.g. Amahle          ]   |",
    "|  Gender: [Boy] [Girl] [Unisex]   |",
    "|  Origin: [e.g. Zulu, Greek,   ]  |",
    "|          [Hebrew               ] |",
    "|  Meaning: [e.g. Beautiful one ]  |",
    "|                                  |",
    "|  [======= Submit Name =======]   |",
    "+==================================+",
], title="Submit Name Modal"))

story.append(spacer(8))
story.append(h3("Submit Form Copy"))
story.append(copy("<b>Title:</b> \"Suggest a Name\""))
story.append(copy("<b>Subtitle:</b> \"Know a great baby name? Submit it for others to discover.\""))
story.append(copy("<b>Fields:</b> Name (\"e.g. Amahle\"), Gender (Boy/Girl/Unisex), Origin (\"e.g. Zulu, Greek, Hebrew\"), Meaning (\"e.g. Beautiful one\")"))
story.append(copy("<b>Language picker:</b> 17 options (English, Afrikaans, isiZulu, isiXhosa, Sesotho, Setswana, Sepedi, Tshivenda, Xitsonga, siSwati, isiNdebele, Greek, Latin, French, Italian, Spanish, Portuguese, German)"))
story.append(copy("<b>CTA:</b> \"Submit Name\""))

story.append(spacer(8))
story.append(h3("Success State"))
story.append(copy("<b>Icon:</b> Checkmark circle (green)"))
story.append(copy("<b>Title:</b> \"Name Submitted!\""))
story.append(copy("<b>Message:</b> \"Name submitted for review and added to your likes!\""))
story.append(copy("<b>Buttons:</b> \"Done\" (primary) / \"Submit Another Name\" (link)"))

story.append(alert("\"Required\" / \"Please enter a name.\""))
story.append(alert("\"Not Signed In\" / \"Please sign in to suggest a name.\""))

# ─── 8. PROFILE SCREEN ──────────────────────────────────────

story.append(PageBreak())
story.append(h1("8. Profile Screen"))

story.append(h2("View Mode"))
story.append(wire_box([
    "+----------------------------------+",
    "| [<-]      Profile          [pen] |",
    "|                                  |",
    "|         ( avatar icon )          |",
    "|                                  |",
    "|  +------------------------------+|",
    "|  | person  NAME                 ||",
    "|  | Naledi Ndlovu                ||",
    "|  +------------------------------+|",
    "|  | calendar  DATE OF BIRTH      ||",
    "|  | 15 March 1993 (33 yrs)       ||",
    "|  +------------------------------+|",
    "|  | people  ROLE                 ||",
    "|  | Mom                          ||",
    "|  +------------------------------+|",
    "|  | heart  STATUS                ||",
    "|  | Expecting soon               ||",
    "|  | Due: 15 July 2026            ||",
    "|  +------------------------------+|",
    "|  | globe  HERITAGE              ||",
    "|  | [isiZulu] [English]          ||",
    "|  +------------------------------+|",
    "|                                  |",
    "|  [QR] Your Invite Code           |",
    "|       NDLOV-AB12                 |",
    "|                                  |",
    "|  [trash Delete Account]          |",
    "+----------------------------------+",
], title="Profile - View Mode"))

story.append(spacer(8))
story.append(h3("View Mode Copy"))
story.append(copy("<b>Header:</b> \"Profile\""))
story.append(copy("<b>Info labels:</b> \"NAME\", \"DATE OF BIRTH\", \"ROLE\", \"STATUS\", \"HERITAGE\" (all uppercase)"))
story.append(copy("<b>Date format:</b> \"{day} {month} {year} ({N} yrs)\" or \"Not set\""))
story.append(copy("<b>Role values:</b> \"Mom\" / \"Dad\" / \"Partner\" / \"Not set\""))
story.append(copy("<b>Status values:</b> \"Expecting soon\" + \"Due: {date}\" / \"Planning ahead\" / \"Not set\""))
story.append(copy("<b>Invite code label:</b> \"Your Invite Code\""))
story.append(copy("<b>Delete:</b> \"Delete Account\""))
story.append(copy("<b>Empty state:</b> \"No profile data found\""))

story.append(h2("Edit Mode"))
story.append(copy("<b>Avatar hint:</b> \"Tap an icon below to change\""))
story.append(copy("<b>6 avatar options:</b> person (blue), heart (pink), star (amber), flower (green), happy (purple), sunny (orange)"))
story.append(copy("<b>Fields:</b> First Name (\"e.g. Naledi\"), Last Name (\"e.g. Ndlovu\")"))
story.append(copy("<b>DOB:</b> \"Date of Birth\" / \"Select your date of birth\""))
story.append(copy("<b>Gender label:</b> \"I am a...\" with options Mom / Dad / Partner"))
story.append(copy("<b>Status label:</b> \"Status\" with options \"Expecting soon\" / \"Planning ahead\""))
story.append(copy("<b>Due date:</b> \"When are you expecting?\" / \"Select your due date\""))
story.append(copy("<b>Heritage label:</b> \"Cultural Heritage (select multiple)\""))
story.append(copy("<b>19 heritage options:</b> English, Afrikaans, isiZulu, isiXhosa, isiNdebele, Sepedi, Sesotho, Setswana, siSwati, Tshivenda, Xitsonga, Irish, Italian, Korean, Spanish, German, Portuguese, Greek, Latin"))
story.append(copy("<b>Buttons:</b> \"Cancel\" (ghost) / \"Save Changes\" or \"Saving...\" (primary)"))

story.append(spacer(8))
story.append(h3("Profile Alerts"))
story.append(alert("\"Required\" / \"Please enter your last name.\""))
story.append(alert("\"Success\" / \"Profile updated successfully!\""))
story.append(alert("\"Delete Account\" / \"Are you sure you want to permanently delete your account? This will remove all your data including your profile, liked names, and partner connections. This action cannot be undone.\" [Cancel] [Delete Account]"))

story.append(h3("Delete Confirmation Modal"))
story.append(copy("<b>Title:</b> \"Confirm Deletion\""))
story.append(copy("<b>Body:</b> \"Enter your password to permanently delete your account.\""))
story.append(copy("<b>Placeholder:</b> \"Enter your password\""))
story.append(copy("<b>Buttons:</b> \"Cancel\" / \"Delete\" or \"Deleting...\""))
story.append(alert("Post-delete: \"Account Deleted\" / \"Your account and all data have been permanently deleted.\""))

# ─── 9. SETTINGS SCREEN ─────────────────────────────────────

story.append(PageBreak())
story.append(h1("9. Settings Screen"))

story.append(wire_box([
    "+----------------------------------+",
    "| [<-]       Settings              |",
    "|                                  |",
    "| [avatar] Naledi Ndlovu           |",
    "|   naledi@example.com             |",
    "|   Code: NDLOV-AB12               |",
    "|                                  |",
    "| ACCOUNT                          |",
    "| [person] Edit Profile          > |",
    "|   Update your information        |",
    "| [people] Partner Settings      > |",
    "|   Connected / Not connected      |",
    "|                                  |",
    "| PREFERENCES                      |",
    "| [bell] Push Notifications   [sw] |",
    "|   Enabled / Disabled             |",
    "| [moon] Dark Mode            [sw] |",
    "|                                  |",
    "| SUPPORT                          |",
    "| [?] Help & FAQ                 > |",
    "| [mail] Contact Support         > |",
    "| [shield] Privacy Policy        > |",
    "| [doc] Terms of Service         > |",
    "|                                  |",
    "| DATA                             |",
    "| [trash] Clear Local Data       > |",
    "|   Remove cached data from device |",
    "|                                  |",
    "| ABOUT                            |",
    "| [info] Version                   |",
    "|   1.0.0                          |",
    "|                                  |",
    "| [exit Log Out]                   |",
    "+----------------------------------+",
], title="Settings Screen"))

story.append(spacer(8))
story.append(h3("Settings Copy"))
story.append(copy("<b>Header:</b> \"Settings\""))
story.append(copy("<b>User card:</b> {firstName} {surname}, {email}, \"Code: {inviteCode}\""))
story.append(copy("<b>Section headers:</b> \"ACCOUNT\", \"PREFERENCES\", \"SUPPORT\", \"DATA\", \"ABOUT\""))
story.append(copy("<b>Account items:</b> \"Edit Profile\" (\"Update your information\") / \"Partner Settings\" (\"Connected\" or \"Not connected\")"))
story.append(copy("<b>Preference items:</b> \"Push Notifications\" (\"Enabled\" / \"Disabled\") / \"Dark Mode\""))
story.append(copy("<b>Support items:</b> \"Help &amp; FAQ\" / \"Contact Support\" / \"Privacy Policy\" / \"Terms of Service\""))
story.append(copy("<b>Data items:</b> \"Clear Local Data\" (\"Remove cached data from device\")"))
story.append(copy("<b>About:</b> \"Version\" with version number"))
story.append(copy("<b>Logout:</b> \"Log Out\""))
story.append(copy("<b>Contact email:</b> ai@sherbetagency.com"))

story.append(spacer(8))
story.append(h3("Settings Alerts"))
story.append(alert("Clear data: \"Clear All Data\" / \"Are you sure you want to clear all local data? This will delete your profile and liked names from this device. Your account on the server will remain.\" [Cancel] [Clear]"))
story.append(alert("Logout: \"Log Out\" / \"Are you sure you want to log out?\" [Cancel] [Log Out]"))

story.append(h2("Help &amp; FAQ Modal"))
story.append(copy("<b>Q:</b> \"How does BumpMatch work?\""))
story.append(copy("<b>A:</b> \"Swipe right on names you love, left on names you don't. When you and your partner both like the same name, it's a match!\""))
story.append(spacer(4))
story.append(copy("<b>Q:</b> \"How do I connect with my partner?\""))
story.append(copy("<b>A:</b> \"Go to Partner Settings and share your invite code. Your partner enters this code in their app to link your accounts.\""))
story.append(spacer(4))
story.append(copy("<b>Q:</b> \"Can I change my liked names?\""))
story.append(copy("<b>A:</b> \"Yes! Visit your Liked Names list from the menu to review and remove any names you've previously liked.\""))
story.append(spacer(4))
story.append(copy("<b>Q:</b> \"How do I delete my account?\""))
story.append(copy("<b>A:</b> \"Go to your Profile page and tap 'Delete Account' at the bottom to permanently delete your account and all associated data.\""))
story.append(spacer(4))
story.append(copy("<b>Q:</b> \"Need more help?\""))
story.append(copy("<b>A:</b> \"Contact us at ai@sherbetagency.com and we'll get back to you as soon as possible.\""))

# Privacy Policy
story.append(PageBreak())
story.append(h2("Privacy Policy (Full Text)"))
story.append(copy("<b>Last updated:</b> January 2026"))
story.append(spacer(4))
story.append(copy("<b>1. Information We Collect</b>"))
story.append(copy("We collect: Name and email address, Age and parental status, Baby name preferences (likes and dislikes), Partner connection data"))
story.append(spacer(4))
story.append(copy("<b>2. How We Use Your Information</b>"))
story.append(copy("Used to: Provide the name matching service, Connect you with your partner, Save your preferences and liked names, Improve the app experience"))
story.append(spacer(4))
story.append(copy("<b>3. Data Storage &amp; Third-Party Services</b>"))
story.append(copy("Data stored securely using Convex, servers in the United States. We do not sell your personal information to third parties."))
story.append(spacer(4))
story.append(copy("<b>4. Your Rights</b>"))
story.append(copy("Access, request deletion, export data, opt out of communications. Contact: ai@sherbetagency.com"))
story.append(spacer(4))
story.append(copy("<b>5. Data Security</b>"))
story.append(copy("Industry-standard security, encryption in transit and at rest. Passwords hashed, never stored in plain text."))
story.append(spacer(4))
story.append(copy("<b>6. Children's Privacy</b>"))
story.append(copy("Intended for users aged 18+. Do not knowingly collect data from children under 13."))
story.append(spacer(4))
story.append(copy("<b>7. Changes to This Policy</b>"))
story.append(copy("May update from time to time. Will notify by posting new policy within the app."))
story.append(spacer(4))
story.append(copy("<b>8. Contact Us</b>"))
story.append(copy("Questions: ai@sherbetagency.com"))

# Terms of Service
story.append(spacer(12))
story.append(h2("Terms of Service (Full Text)"))
story.append(copy("<b>Last updated:</b> January 2026"))
story.append(spacer(4))
story.append(copy("<b>1. Acceptance of Terms</b> - By using BumpMatch, you agree to these Terms."))
story.append(copy("<b>2. Description of Service</b> - Baby name discovery app for expecting parents and partners to swipe through names and find matches."))
story.append(copy("<b>3. User Accounts</b> - Responsible for maintaining security of credentials. Must provide accurate information."))
story.append(copy("<b>4. Acceptable Use</b> - Agree not to misuse, gain unauthorized access, or use for unlawful purpose."))
story.append(copy("<b>5. Termination</b> - May suspend/terminate for violations. Delete account by contacting ai@sherbetagency.com."))
story.append(copy("<b>6. Limitation of Liability</b> - Provided \"as is\" without warranties. Not liable for damages."))
story.append(copy("<b>7. Changes to Terms</b> - May update. Continued use = acceptance."))
story.append(copy("<b>8. Contact</b> - ai@sherbetagency.com"))

# ─── 10. PARTNER SCREEN ─────────────────────────────────────

story.append(PageBreak())
story.append(h1("10. Partner Screen"))

story.append(h2("Not Connected State"))
story.append(wire_box([
    "+----------------------------------+",
    "| [<-]       Partner               |",
    "|                                  |",
    "|        (people icon)             |",
    "|   \"Swipe Together!\"              |",
    "|   \"Connect with your partner     |",
    "|    to see which baby names       |",
    "|    you both love\"                |",
    "|                                  |",
    "|  +--------------------------+    |",
    "|  |  \"Your Invite Code\"      |    |",
    "|  |      [QR Code]           |    |",
    "|  |  Code: [NDLOV-AB12]      |    |",
    "|  |  [Share Invite]          |    |",
    "|  +--------------------------+    |",
    "|                                  |",
    "|          - OR -                  |",
    "|                                  |",
    "|  [Join with Partner's Code]      |",
    "|                                  |",
    "|  \"What you get with Partner Mode\"|",
    "|  [sync] Synced Likes             |",
    "|   \"See which names you both love\"|",
    "|  [bell] Match Alerts             |",
    "|   \"Get notified when you match   |",
    "|    on a name\"                    |",
    "+----------------------------------+",
], title="Partner - Not Connected"))

story.append(spacer(8))
story.append(h3("Not Connected Copy"))
story.append(copy("<b>Title:</b> \"Swipe Together!\""))
story.append(copy("<b>Subtitle:</b> \"Connect with your partner to see which baby names you both love\""))
story.append(copy("<b>QR section title:</b> \"Your Invite Code\""))
story.append(copy("<b>Code label:</b> \"Code:\" + code value"))
story.append(copy("<b>Share CTA:</b> \"Share Invite\""))
story.append(copy("<b>Divider:</b> \"- OR -\""))
story.append(copy("<b>Join CTA:</b> \"Join with Partner's Code\""))
story.append(copy("<b>Join input placeholder:</b> \"Enter partner's code (e.g. SMITH-AB12)\""))
story.append(copy("<b>Join buttons:</b> \"Cancel\" / \"Join\" or \"Connecting...\""))
story.append(copy("<b>Features title:</b> \"What you get with Partner Mode\""))
story.append(copy("<b>Feature 1:</b> \"Synced Likes\" / \"See which names you both love\""))
story.append(copy("<b>Feature 2:</b> \"Match Alerts\" / \"Get notified when you match on a name\""))

story.append(h2("Connected State"))
story.append(copy("<b>Partner card:</b> \"Connected with {firstName}\" / \"{surname} family\""))
story.append(copy("<b>Disconnect link:</b> \"Disconnect\""))

story.append(h3("Reveal Date States"))
story.append(copy("<b>No date set:</b> \"Set a reveal date for your matches\""))
story.append(copy("<b>Proposed by me (pending):</b> \"Waiting for {name} to confirm\" + \"Proposed date: {date}\" + \"Cancel proposal\""))
story.append(copy("<b>Proposed by partner:</b> \"{name} proposed a reveal date\" + date + [Confirm] / [Suggest Different Date]"))
story.append(copy("<b>Confirmed (not reached):</b> \"{N} match(es) waiting!\" + \"Reveals on {date}\" + \"Reveal now instead\""))
story.append(copy("<b>Date picker CTA:</b> \"Propose Date\" / \"Cancel\""))

story.append(h3("Matched Names (after reveal)"))
story.append(copy("<b>Section title:</b> \"Matched Names\" (with heart icon)"))
story.append(copy("<b>Empty state:</b> \"No matches yet!\" / \"Keep swiping to find names you both love\""))

story.append(spacer(8))
story.append(h3("Partner Screen Alerts"))
story.append(alert("\"Disconnect Partner\" / \"Are you sure you want to disconnect from your partner? Your liked names will be preserved.\" [Cancel] [Disconnect]"))
story.append(alert("\"Disconnected\" / \"You have been disconnected from your partner.\""))
story.append(alert("\"Connected!\" / \"You're now connected with {firstName}!\""))
story.append(alert("\"Required\" / \"Please enter an invite code.\""))
story.append(alert("\"Confirmed!\" / \"The reveal date has been confirmed.\""))
story.append(alert("\"Date Proposed!\" / \"Your partner will need to confirm: {date}\""))
story.append(alert("\"Reveal Now\" / \"This will send a request to your partner. Both of you must agree to reveal early.\" [Keep Waiting] [Request Reveal Now]"))

# ─── 11. MATCH REVEAL ───────────────────────────────────────

story.append(PageBreak())
story.append(h1("11. Match Reveal Animation"))
story.append(p("Full-screen modal overlay with floating heart particles and spring animations. Shown when new matches are detected."))
story.append(spacer(8))

story.append(wire_box([
    "+==================================+",
    "|   (floating heart particles)     |",
    "|     <3   <3   <3   <3   <3      |",
    "|                                  |",
    "|        (heart-circle icon)       |",
    "|      \"It's a Match!\"             |",
    "|  \"You and your partner both      |",
    "|   liked this name!\"              |",
    "|                                  |",
    "|        [heart Amahle]            |",
    "|        [heart Sipho]             |",
    "|        +3 more                   |",
    "|                                  |",
    "|  \"Tap anywhere to dismiss\"       |",
    "+==================================+",
], title="Match Reveal Animation"))

story.append(spacer(8))
story.append(copy("<b>Title:</b> \"It's a Match!\""))
story.append(copy("<b>Subtitle (singular):</b> \"You and your partner both liked this name!\""))
story.append(copy("<b>Subtitle (plural):</b> \"You and your partner both liked these names!\""))
story.append(copy("<b>Overflow:</b> \"+{N} more\" (when &gt; 5 matches)"))
story.append(copy("<b>Dismiss hint:</b> \"Tap anywhere to dismiss\""))

# ─── 12. PREGNANCY TRACKER ──────────────────────────────────

story.append(spacer(16))
story.append(h1("12. Pregnancy Tracker"))
story.append(p("Inline banner on the App page showing pregnancy progress with fruit/veggie size comparisons. Visible when user has a due date set."))
story.append(spacer(8))

story.append(copy("<b>Format:</b> \"{emoji} Week {N} - Baby is the size of a {fruit}! About {size} long . {N} weeks to go\""))
story.append(copy("<b>Final week:</b> \"About {size} long . Any day now!\""))

# Milestone table
story.append(spacer(8))
milestones_data = [
    ["Week", "Fruit/Veggie", "Emoji", "Size"],
    ["4", "Poppy seed", "seed", "2mm"],
    ["7", "Blueberry", "berry", "1cm"],
    ["10", "Strawberry", "berry", "3cm"],
    ["13", "Peach", "fruit", "7cm"],
    ["16", "Avocado", "fruit", "12cm"],
    ["20", "Banana", "fruit", "16cm"],
    ["24", "Corn on the cob", "veg", "30cm"],
    ["28", "Aubergine", "veg", "38cm"],
    ["32", "Squash", "veg", "42cm"],
    ["36", "Romaine lettuce", "veg", "47cm"],
    ["39", "Watermelon", "fruit", "51cm"],
    ["40", "Pumpkin", "veg", "52cm"],
]

table = Table(milestones_data, colWidths=[50, 150, 50, 60])
table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
    ("TEXTCOLOR", (0, 0), (-1, 0), white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("LEADING", (0, 0), (-1, -1), 13),
    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("GRID", (0, 0), (-1, -1), 0.5, WIRE_BORDER),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, WIRE_BG]),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
]))
story.append(table)

# ─── 13. NAVIGATION ─────────────────────────────────────────

story.append(PageBreak())
story.append(h1("13. Navigation Structure"))
story.append(spacer(8))

story.append(wire_box([
    "Landing (auth)                         ",
    "  |                                    ",
    "  +---> App (main, stack root)         ",
    "          |                             ",
    "          +---> Profile                 ",
    "          +---> LikedNames             ",
    "          +---> Settings               ",
    "          +---> Partner                 ",
    "                                        ",
    "Deep link: bumpmatch://join/:code      ",
    "  --> Partner screen with code prefilled",
], title="Navigation Map"))

story.append(spacer(12))
story.append(h2("Screen Inventory"))

screen_data = [
    [Paragraph("Screen", styles["TableHeader"]), Paragraph("Type", styles["TableHeader"]), Paragraph("Access", styles["TableHeader"])],
    ["Landing Page", "Full screen", "Entry point / auth"],
    ["App Page", "Full screen", "Main (post-auth)"],
    ["Profile", "Stack screen", "Menu > Profile"],
    ["Liked Names", "Stack screen", "Menu > Liked Names"],
    ["Settings", "Stack screen", "Menu > Settings"],
    ["Partner", "Stack screen", "Menu > Partner / deep link"],
]
screen_table = Table(screen_data, colWidths=[130, 100, 200])
screen_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("LEADING", (0, 0), (-1, -1), 13),
    ("GRID", (0, 0), (-1, -1), 0.5, WIRE_BORDER),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, WIRE_BG]),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
]))
story.append(screen_table)

story.append(spacer(12))
story.append(h2("Modal/Dialog Inventory"))

modal_data = [
    [Paragraph("Modal", styles["TableHeader"]), Paragraph("Triggered From", styles["TableHeader"]), Paragraph("Type", styles["TableHeader"])],
    ["Sign Up", "Landing page", "Glass card modal"],
    ["Login", "Landing page", "Glass card modal"],
    ["Forgot Password", "Login modal", "Nested flow"],
    ["Onboarding Tutorial", "Post sign-up", "Overlay carousel"],
    ["Menu Drawer", "App page header", "Bottom sheet"],
    ["Partner Invite", "App page header", "Center dialog"],
    ["Language Picker", "App page filter", "Bottom sheet"],
    ["Submit Name", "Menu drawer", "Bottom sheet"],
    ["Delete Account", "Profile screen", "Center dialog"],
    ["Help & FAQ", "Settings screen", "Page sheet"],
    ["Privacy Policy", "Settings screen", "Page sheet"],
    ["Terms of Service", "Settings screen", "Page sheet"],
    ["Match Reveal", "Partner screen (auto)", "Full overlay"],
    ["Date Picker (various)", "Multiple screens", "Native picker"],
]
modal_table = Table(modal_data, colWidths=[120, 130, 120])
modal_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
    ("LEADING", (0, 0), (-1, -1), 12),
    ("GRID", (0, 0), (-1, -1), 0.5, WIRE_BORDER),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, WIRE_BG]),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
]))
story.append(modal_table)

# Summary stats
story.append(spacer(16))
story.append(h2("Summary"))
story.append(bullet("<b>Total Screens:</b> 6"))
story.append(bullet("<b>Total Modals/Dialogs:</b> 14"))
story.append(bullet("<b>Languages Supported:</b> 20"))
story.append(bullet("<b>Heritage Options:</b> 19"))
story.append(bullet("<b>Pregnancy Milestones:</b> 37 (weeks 4-40)"))
story.append(bullet("<b>Avatar Options:</b> 6"))
story.append(bullet("<b>Onboarding Slides:</b> 4"))

# Build PDF
doc.build(story)
print(f"PDF generated: {OUTPUT_PATH}")
