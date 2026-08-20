#!/usr/bin/env python3
"""
Build the garage sale image assets.

What it does
------------
1. Reads the website address (siteUrl) out of script.js.
2. Creates the QR code   -> assets/garage-sale-qr.png  and  .svg
3. Turns every SVG into a PNG:
       assets/garage-sale-ad.png       1200 x 1200  (Facebook / Messenger, has the QR code)
       assets/garage-sale-poster.png   2550 x 3300  (8.5x11 inch, 300 dpi print)
       assets/og-image.png             1200 x  630  (link preview image, has the QR code)
       assets/favicon-32.png             32 x   32
       assets/apple-touch-icon.png      180 x  180

How to run it
-------------
    python3 tools/build-assets.py

Needs (install once):
    pip3 install --break-system-packages segno cairosvg
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
SCRIPT_JS = os.path.join(ROOT, "script.js")

PLACEHOLDER = "YOUR-USERNAME"


def read_site_url():
    """Pull siteUrl out of script.js so there is only one place to edit it."""
    try:
        with open(SCRIPT_JS, "r", encoding="utf-8") as fh:
            source = fh.read()
    except OSError:
        return None
    match = re.search(r"siteUrl:\s*'([^']+)'", source)
    return match.group(1) if match else None


def build_qr(url):
    try:
        import segno
    except ImportError:
        print("!! segno is not installed - skipping the QR code.")
        print("   Install it with: pip3 install --break-system-packages segno")
        return False

    qr = segno.make(url, error="h")  # 'h' = highest error correction, survives printing
    qr.save(os.path.join(ASSETS, "garage-sale-qr.png"),
            scale=16, border=3, dark="#17363F", light="#FFFFFF")
    qr.save(os.path.join(ASSETS, "garage-sale-qr.svg"),
            scale=16, border=3, dark="#17363F", light="#FFFFFF")
    print("   assets/garage-sale-qr.png   ->", url)
    return True


def qr_data_uri():
    """Read the QR png back as an inline data URI (used by the poster)."""
    import base64
    path = os.path.join(ASSETS, "garage-sale-qr.png")
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as fh:
        encoded = base64.b64encode(fh.read()).decode("ascii")
    return "data:image/png;base64," + encoded


def build_pngs():
    try:
        import cairosvg
    except ImportError:
        print("!! cairosvg is not installed - skipping the PNG files.")
        print("   Install it with: pip3 install --break-system-packages cairosvg")
        return False

    jobs = [
        ("garage-sale-ad.svg",       "garage-sale-ad.png",     1200, 1200),
        ("garage-sale-poster.svg",   "garage-sale-poster.png", 2550, 3300),
        ("og-image.svg",             "og-image.png",           1200,  630),
        ("favicon.svg",              "favicon-32.png",           32,   32),
        ("favicon.svg",              "apple-touch-icon.png",    180,  180),
        ("location-illustration.svg","location-illustration.png", 1200, 600),
    ]

    transparent = ("favicon-32.png", "apple-touch-icon.png")

    for src, dest, width, height in jobs:
        src_path = os.path.join(ASSETS, src)
        if not os.path.exists(src_path):
            print("!! missing", src, "- skipped")
            continue

        kwargs = {"url": src_path}
        # The poster and the two Facebook pictures point at garage-sale-qr.png.
        # The renderer refuses to read local files for security reasons, so
        # paste the QR straight into the drawing as text (a "data URI")
        # before rendering it.
        with open(src_path, "r", encoding="utf-8") as fh:
            markup = fh.read()
        if "garage-sale-qr.png" in markup:
            markup = markup.replace("garage-sale-qr.png", qr_data_uri())
            kwargs = {"bytestring": markup.encode("utf-8")}

        cairosvg.svg2png(
            write_to=os.path.join(ASSETS, dest),
            output_width=width,
            output_height=height,
            background_color=None if dest in transparent else "#FFFFFF",
            **kwargs
        )
        size_kb = os.path.getsize(os.path.join(ASSETS, dest)) / 1024
        print("   assets/%-28s %4d x %-4d  %6.1f KB" % (dest, width, height, size_kb))
    return True


def main():
    url = read_site_url()
    if not url:
        print("!! Could not find siteUrl in script.js - using a placeholder.")
        url = "https://example.github.io/garage-sale/"

    print("Building assets...")
    print("Website address used for the QR code:", url)
    if PLACEHOLDER in url:
        print("   (This is still the placeholder. After GitHub Pages is live, run:")
        print("    python3 tools/set-site-url.py https://your-name.github.io/garage-sale/ )")

    print("\nQR code:")
    build_qr(url)

    print("\nPNG images:")
    build_pngs()

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
