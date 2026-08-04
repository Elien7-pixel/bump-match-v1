#!/usr/bin/env python3
"""Collect raw simulator/emulator captures into store-ready screenshot sets.

Reads the raw captures listed in SETS, verifies each is the exact pixel size
the store expects, strips OS window chrome (the iPadOS 26 windowed-app resize
handle in the bottom-right corner) and writes numbered files into
assets/store/screenshots/<platform>/.

Usage: python3 scripts/export-store-screenshots.py <raw_capture_dir>
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "store" / "screenshots"

# platform -> (expected size, [(order, label, raw filename)])
SETS = {
    "ios-iphone-6.9": (
        (1320, 2868),
        [
            ("01", "landing", "ios-after-seed.png"),
            ("02", "swipe", "ios-auth.png"),
            ("03", "liked-names", "shot-liked.png"),
            ("04", "partner", "shot-partner.png"),
            ("05", "profile", "shot-profile.png"),
        ],
    ),
    "ios-ipad-13": (
        (2064, 2752),
        [
            ("01", "landing", "ipad-landing.png"),
            ("02", "swipe", "ipad-swipe3.png"),
            ("03", "liked-names", "ipad-liked2.png"),
            ("04", "partner", "ipad-partner.png"),
            ("05", "profile", "ipad-profile.png"),
        ],
    ),
    "android-phone": (
        (1080, 2400),
        [
            ("01", "landing", "android-landing.png"),
            ("02", "swipe", "android-swipe.png"),
            ("03", "liked-names", "android-liked.png"),
            ("04", "partner", "android-partner.png"),
            ("05", "profile", "android-profile.png"),
        ],
    ),
}

# iPadOS 26 draws a resize handle in the bottom-right corner of windowed apps.
# It always lands on flat background, so flatten that corner to the local
# background colour rather than trying to inpaint.
CHROME_BOX = (150, 130)  # width, height of the corner region to clean


def strip_corner_chrome(img):
    w, h = img.size
    bw, bh = CHROME_BOX
    box = (w - bw, h - bh, w, h)
    corner = img.crop(box).convert("RGB")

    # Modal colour of the corner is the background it sits on.
    colours = {}
    for px in corner.getdata():
        colours[px] = colours.get(px, 0) + 1
    bg = max(colours.items(), key=lambda kv: kv[1])[0]

    cleaned = corner.copy()
    px = cleaned.load()
    changed = 0
    for y in range(cleaned.height):
        for x in range(cleaned.width):
            c = px[x, y]
            if sum(abs(a - b) for a, b in zip(c, bg)) > 30:
                px[x, y] = bg
                changed += 1
    img = img.convert("RGB")
    img.paste(cleaned, box[:2])
    return img, changed


def main(raw_dir):
    raw = Path(raw_dir)
    total = missing = 0
    for platform, (size, shots) in SETS.items():
        dest = OUT / platform
        dest.mkdir(parents=True, exist_ok=True)
        for order, label, fname in shots:
            src = raw / fname
            if not src.exists():
                print(f"  MISSING  {platform}/{order}-{label}  (expected {fname})")
                missing += 1
                continue
            img = Image.open(src)
            if img.size != size:
                print(f"  SIZE ERR {platform}/{order}-{label}: {img.size} != {size}")
                missing += 1
                continue
            note = ""
            if platform.startswith("ios-ipad"):
                img, changed = strip_corner_chrome(img)
                note = f"  (cleaned {changed}px of window chrome)"
            else:
                img = img.convert("RGB")
            out = dest / f"{order}-{label}.png"
            img.save(out, "PNG", optimize=True)
            print(f"  ok       {platform}/{out.name}  {size[0]}x{size[1]}{note}")
            total += 1
    print(f"\n{total} written, {missing} missing/invalid -> {OUT}")
    return 1 if missing else 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1]))
