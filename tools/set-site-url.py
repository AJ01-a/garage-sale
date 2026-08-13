#!/usr/bin/env python3
"""
Set the real website address everywhere at once.

Run this AFTER GitHub Pages gives you your public link:

    python3 tools/set-site-url.py https://your-name.github.io/garage-sale/

It updates:
  * index.html  (canonical link + Facebook/Twitter preview tags)
  * script.js   (siteUrl, used by the share + copy-link buttons)
  * site.webmanifest
and then rebuilds the QR code so it points at the real address.
"""

import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# README.md is deliberately left alone so its example links stay readable.
TARGETS = ["index.html", "script.js", "site.webmanifest"]

# Matches any https://<something>.github.io/<something>/ style URL we wrote before,
# plus the original placeholder.
URL_PATTERN = re.compile(r"https://[A-Za-z0-9._-]+\.github\.io/[A-Za-z0-9._/-]*")


def normalise(url):
    url = url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url
    if not url.endswith("/"):
        url += "/"
    return url


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 1

    new_url = normalise(sys.argv[1])
    print("Setting the website address to:", new_url)

    changed_any = False
    for name in TARGETS:
        path = os.path.join(ROOT, name)
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()

        def replace(match):
            old = match.group(0)
            # Keep the file path that follows the site root, e.g. assets/og-image.png
            tail = ""
            marker = ".github.io/"
            idx = old.find(marker)
            if idx != -1:
                rest = old[idx + len(marker):]
                # Drop the repository folder (first path segment) and keep the rest.
                parts = rest.split("/", 1)
                if len(parts) == 2 and parts[1]:
                    tail = parts[1]
            return new_url + tail

        updated = URL_PATTERN.sub(replace, text)
        if updated != text:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(updated)
            print("   updated", name)
            changed_any = True

    if not changed_any:
        print("   (nothing needed changing)")

    print("\nRebuilding the QR code and images...")
    build = os.path.join(ROOT, "tools", "build-assets.py")
    subprocess.call([sys.executable, build])
    return 0


if __name__ == "__main__":
    sys.exit(main())
