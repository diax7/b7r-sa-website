"""Build the single master BRD from the editable section files.

Usage (from the project root):
    python docs/build-brd.py

Reads docs/brd-sections/*.md in filename order and writes B7R-WEBSITE-MASTER-BRD.md
at the project root. Sections are separated by a horizontal rule. The script also
prints a short report (bytes, words, headings) and fails if a section contains
HTML entities or a leftover TODO marker, which would indicate a copy-paste error.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SECTIONS_DIR = ROOT / "docs" / "brd-sections"
OUTPUT = ROOT / "B7R-WEBSITE-MASTER-BRD.md"
FORBIDDEN = [r"&lt;", r"&gt;", r"&amp;", r"\bTBD\b", r"\bTODO\b(?!\(copy\))", r"lorem ipsum"]


def main() -> int:
    files = sorted(SECTIONS_DIR.glob("*.md"))
    if not files:
        print(f"No section files found in {SECTIONS_DIR}", file=sys.stderr)
        return 1

    parts: list[str] = []
    problems: list[str] = []
    for path in files:
        text = path.read_text(encoding="utf-8").rstrip() + "\n"
        for pattern in FORBIDDEN:
            for match in re.finditer(pattern, text, flags=re.IGNORECASE):
                line = text[: match.start()].count("\n") + 1
                problems.append(f"{path.name}:{line}: forbidden token {match.group(0)!r}")
        parts.append(text)

    if problems:
        print("Build blocked by content problems:", file=sys.stderr)
        for problem in problems:
            print("  " + problem, file=sys.stderr)
        return 1

    master = "\n---\n\n".join(parts)
    OUTPUT.write_text(master, encoding="utf-8", newline="\n")

    words = len(re.findall(r"\S+", master))
    headings = len(re.findall(r"^#{1,6} ", master, flags=re.MULTILINE))
    arabic_chars = len(re.findall(r"[؀-ۿ]", master))
    print(f"Wrote {OUTPUT.name}: {len(master.encode('utf-8')):,} bytes, {words:,} words, "
          f"{headings} headings, {arabic_chars:,} Arabic characters, {len(files)} sections")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
