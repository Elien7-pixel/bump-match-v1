#!/usr/bin/env python3
"""Build the Google Play feature graphic (1024x500) in the current pastel brand.

Mirrors the app's landing screen: purple sky, cream hill, rainbow, sticker
confetti and floating name pills, with the Bump Match wordmark centred.

Usage: python3 scripts/make-feature-graphic.py [out.png]
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "assets" / "brand"
FONTS = ROOT / "assets" / "fonts"

W, H = 1024, 500
SS = 3  # supersample factor, downscaled at the end for clean edges

PURPLE = (170, 160, 221)
PURPLE_LIGHT = (190, 182, 232)
CREAM = (254, 250, 246)
PINK = (250, 146, 169)
INK = (74, 68, 89)


def load(name, width=None, angle=None):
    img = Image.open(BRAND / name).convert("RGBA")
    if width:
        h = round(img.height * width / img.width)
        img = img.resize((width, h), Image.LANCZOS)
    if angle:
        img = img.rotate(angle, resample=Image.BICUBIC, expand=True)
    return img


def sky_gradient(size):
    """Vertical purple gradient, lighter at the top."""
    w, h = size
    grad = Image.new("RGB", (1, h))
    px = grad.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        px[0, y] = tuple(
            round(PURPLE_LIGHT[i] + (PURPLE[i] - PURPLE_LIGHT[i]) * t) for i in range(3)
        )
    return grad.resize((w, h), Image.BICUBIC).convert("RGBA")


def hill(size, crest, amp):
    """Cream hill sweeping across the bottom, matching the landing screen."""
    w, h = size
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    pts = []
    for x in range(w + 1):
        t = x / w
        y = crest + amp * math.cos(t * math.pi * 1.15 + 0.35)
        pts.append((x, y))
    pts += [(w, h), (0, h)]
    d.polygon(pts, fill=CREAM)
    return layer


def name_pill(text, font, pad_x=34, pad_y=20, heart=None):
    """White rounded pill with a name and a small pink heart, as on the landing."""
    tmp = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    box = tmp.textbbox((0, 0), text, font=font)
    tw, th = box[2] - box[0], box[3] - box[1]
    hw = round(th * 1.15) if heart else 0
    gap = 16 if heart else 0
    w = tw + hw + gap + pad_x * 2
    h = th + pad_y * 2
    pill = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(pill)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2, fill=(255, 255, 255, 255))
    d.text((pad_x - box[0], pad_y - box[1]), text, font=font, fill=INK)
    if heart:
        hs = heart.resize((hw, hw), Image.LANCZOS)
        pill.alpha_composite(hs, (pad_x + tw + gap, (h - hw) // 2))
    return pill


def soft_shadow(img, blur=18, offset=(0, 10), opacity=52):
    """Drop shadow derived from the image's own alpha."""
    from PIL import ImageFilter

    pad = blur * 3
    canvas = Image.new("RGBA", (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
    alpha = img.split()[3].point(lambda a: a * opacity // 255)
    shadow = Image.new("RGBA", img.size, (120, 100, 150, 0))
    shadow.putalpha(alpha)
    canvas.alpha_composite(shadow, (pad + offset[0], pad + offset[1]))
    canvas = canvas.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(img, (pad, pad))
    return canvas, pad


def build():
    size = (W * SS, H * SS)
    canvas = sky_gradient(size)

    def place(img, cx, cy, shadow=None):
        """Composite img centred on (cx, cy) given in final (1024x500) coords."""
        if shadow:
            img, pad = soft_shadow(img, **shadow)
        canvas.alpha_composite(img, (round(cx * SS - img.width / 2), round(cy * SS - img.height / 2)))

    # --- backdrop decoration -------------------------------------------------
    # Rainbow sits low and right so the hill crops its base, as on the landing.
    place(load("icons/rainbow.png", width=round(232 * SS)), 870, 332)

    place(load("icons/star-2.png", width=round(50 * SS), angle=-14), 300, 66)
    place(load("icons/star-2.png", width=round(34 * SS), angle=18), 742, 72)
    place(load("icons/flower-2.png", width=round(40 * SS), angle=-10), 58, 238)
    place(load("icons/heart-3.png", width=round(34 * SS), angle=12), 966, 168)

    # --- hill ----------------------------------------------------------------
    canvas.alpha_composite(hill(size, crest=round(392 * SS), amp=round(34 * SS)))

    # --- wordmark ------------------------------------------------------------
    logo = load("logo-horizontal-tagline-white.png", width=round(540 * SS))
    place(logo, 512, 196)

    # --- floating name pills (kept clear of the wordmark) --------------------
    pill_font = ImageFont.truetype(str(FONTS / "Poppins-SemiBold.ttf"), round(25 * SS))
    heart_px = load("icons/heart-3.png")
    for text, cx, cy, angle in (
        ("Lerato", 148, 76, -7),
        ("Noah", 878, 80, 6),
        ("Amara", 138, 322, 5),
    ):
        pill = name_pill(text, pill_font, heart=heart_px).rotate(
            angle, resample=Image.BICUBIC, expand=True
        )
        place(pill, cx, cy, shadow=dict(blur=10 * SS, offset=(0, 5 * SS), opacity=46))

    # --- mascots on the hill -------------------------------------------------
    crownie = load("characters/crownie.png", width=round(122 * SS), angle=-6)
    place(crownie, 806, 424)
    starro = load("characters/starro.png", width=round(104 * SS), angle=7)
    place(starro, 196, 432)

    return canvas.convert("RGB").resize((W, H), Image.LANCZOS)


if __name__ == "__main__":
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "assets/store/feature-graphic-1024x500.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    build().save(out, "PNG", optimize=True)
    print(f"wrote {out} ({W}x{H})")
