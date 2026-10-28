#!/usr/bin/env python3
"""Ensure the runtime preflight catalog knows every LOCKED Remotion registry key."""
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[2]
registry = (root / "remotion-engine/src/components/architectural-thinking/registry.ts").read_text()
catalog = "\n".join(p.read_text() for p in sorted((root / "backend/src/main/resources/db/migration").glob("V*__*.sql")))
keys = set(re.findall(r"^\s*(AT[A-Za-z0-9_]+):\s*\{", registry, re.MULTILINE))
seeded = set(re.findall(r"'(AT[A-Za-z0-9_]+)','LOCKED'", catalog))
if not keys or not seeded:
    print("FAIL: empty Remotion component registry or runtime catalog seed.")
    sys.exit(1)
missing = sorted(keys - seeded)
if missing:
    print("FAIL: components missing from the canonical runtime asset catalog:", missing)
    sys.exit(1)
print(f"PASS: {len(keys)} Remotion registry components are present in the runtime preflight catalog.")
