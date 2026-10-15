#!/usr/bin/env python3
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE = "https://media-os-backend-production.up.railway.app"
FILES = [
    ("Director v2 amendment", "ops/shot05-v2/import/01_director_amendment.json",
     "/api/v1/locked-script/director-amendment"),
    ("SHOT05 v2 HEAR/SEE", "ops/shot05-v2/import/02_hear_see_contract.json",
     "/api/v1/production-contract/import"),
]
V2_SHA = "003ee78105dd0f331a0cd0784374b38e4a4d3778141f784ad072f2944b253d3c"
V1_SHA = "a7d4ddce77e70013b8a9ab384bc2baba5f80440f4a5d911dd0799c34355e58d8"
V1_C01 = "When you press Login, your request reaches the first stop on the server side. Here, a few rules are checked before the password. This stop is called the API Gateway."
V1_C07 = "Those were examples of what can go wrong. Our real request passes every check. Next, the load balancer picks a healthy server."

def sha(items):
    return hashlib.sha256("\n".join(items).encode("utf-8")).hexdigest()

def preflight():
    first = json.load(open(FILES[0][1], encoding="utf-8"))
    second = json.load(open(FILES[1][1], encoding="utf-8"))
    a = [s for s in first["timeline"] if s["shotKey"] == "SHOT 05"]
    b = second["timeline"]
    assert len(first["timeline"]) == 96 and len(a) == len(b) == 7
    assert sha([s["narration"] for s in a]) == V2_SHA
    old = [s["narration"] for s in a]
    old[0], old[6] = V1_C01, V1_C07
    assert sha(old) == V1_SHA, "Unexpected edit to C02-C06; abort"
    assert [(s["startSecond"],s["endSecond"],s["narration"]) for s in a] == [
        (s["startSecond"],s["endSecond"],s["hear"]) for s in b], "HEAR/SEE and Script must match"
    assert first["status"] == "FULLY_LOCKED"
    print("Preflight PASS: exactly two Director-approved voice changes, all 7 times match.")
    return first, second

def post(path, payload, max_attempts):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    endpoint = BASE + path
    for attempt in range(1, max_attempts + 1):
        req = urllib.request.Request(endpoint, data=body,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST")
        try:
            with urllib.request.urlopen(req, timeout=35) as res:
                result = json.load(res)
                if not result.get("ready"):
                    raise ValueError("Backend did not confirm ready=true")
                print(f"Import PASS: {path}, response ready=true, revision={result.get('scriptRevision')}.")
                return result
        except urllib.error.HTTPError as error:
            text = error.read(1200).decode("utf-8", errors="replace")
            print(f"Attempt {attempt}/{max_attempts}: HTTP {error.code}, {text}")
            if error.code not in (409, 502, 503, 504) or attempt == max_attempts:
                raise
        except (urllib.error.URLError, TimeoutError) as error:
            print(f"Attempt {attempt}/{max_attempts}: network/deployment not yet ready: {error}")
            if attempt == max_attempts:
                raise
        time.sleep(20)
    raise RuntimeError("No successful import")

def verify():
    req = urllib.request.Request(BASE + "/api/v1/production-contract", method="GET")
    with urllib.request.urlopen(req, timeout=30) as res:
        current = json.load(res)
    if not current.get("ready"):
        raise RuntimeError("No active Production Contract after import.")
    entries = current.get("payload", {}).get("timeline", [])
    shot = [s for s in entries if s.get("shotKey") == "SHOT 05"]
    if len(shot) != 7 or sha([x["hear"] for x in shot]) != V2_SHA:
        raise RuntimeError("Active Production Contract does not contain the exact v2 narration.")
    print("Post-import verification PASS: 7 active SHOT05 HEAR entries exactly match the v2 checksum.")

def main():
    first, second = preflight()
    post(FILES[0][2], first, max_attempts=18)
    post(FILES[1][2], second, max_attempts=5)
    verify()
    print("EP001 SHOT05 v2 PROMOTED; existing SHOT01–04 Director locks protected.")

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"PROMOTION BLOCKED: {type(error).__name__}: {error}", file=sys.stderr)
        sys.exit(1)
