#!/usr/bin/env python3
"""Prevent new global-creation memory IDs from silently colliding with older migrations."""
from pathlib import Path
import re
import sys

folder = Path(__file__).resolve().parents[1] / "src/main/resources/db/migration"
pattern = re.compile(r"90000000-0000-4000-8000-0000000091\d\d")
uses = {}
for file in sorted(folder.glob("V*__*.sql")):
    for identifier in set(pattern.findall(file.read_text())):
        uses.setdefault(identifier, []).append(file.name)
expected = {f"90000000-0000-4000-8000-0000000091{n:02d}" for n in range(11, 18)}
missing = sorted(expected - set(uses))
duplicates = {k: v for k, v in uses.items() if len(v) > 1}
if missing or duplicates:
    print("Memory preflight seed IDs invalid. Missing:", missing, "Collisions:", duplicates)
    sys.exit(1)
print(f"PASS: {len(expected)} reserved memory-rule IDs are present with no cross-migration collisions.")
