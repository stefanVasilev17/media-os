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

def sync_voice_contract(script_revision):
    req = urllib.request.Request(BASE + "/api/v1/production-contract", method="GET")
    with urllib.request.urlopen(req, timeout=30) as res:
        current = json.load(res)
    parts = [x for x in current["payload"]["timeline"] if x["shotKey"] == "SHOT 05"]
    parts.sort(key=lambda x: x["startSecond"])
    if len(parts) != 7 or sha([x["hear"] for x in parts]) != V2_SHA:
        raise RuntimeError("Refusing voice sync because active SHOT05 script is not exact v2")
    bundle = {
        "shotKey": "SHOT 05",
        "title": "API Gateway",
        "startSecond": parts[0]["startSecond"],
        "endSecond": parts[-1]["endSecond"],
        "narration": "\n\n".join(x["hear"] for x in parts),
        "voiceDirection": "Slow, precise, calm educational storytelling, with pauses between ideas.",
        "clips": [
            {"clipKey": x["clipKey"], "sequence": i+1,
             "startSecond": x["startSecond"], "endSecond": x["endSecond"],
             "narration": x["hear"], "voiceDirection": x["voiceDirection"]}
            for i, x in enumerate(parts)
        ],
    }
    req = urllib.request.Request(BASE + "/api/v1/voice-clips/sync",
        data=json.dumps({"scriptRevision": script_revision, "shots": [bundle]}).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=40) as res:
            result = json.load(res)
    except urllib.error.HTTPError as error:
        raise RuntimeError("Voice clip sync blocked by production approval gate: HTTP " + str(error.code)
            + " " + error.read(1000).decode("utf-8", errors="replace")) from error
    shots = [c for c in result if c.get("shotKey") == "SHOT 05"]
    if len(shots) != 7:
        raise RuntimeError("Voice sync response did not contain 7 SHOT05 clips")
    for i, clip in enumerate(sorted(shots, key=lambda x: x["sequence"])):
        if i in (0, 6) and clip.get("narration") != parts[i]["hear"]:
            raise RuntimeError("Changed voice clip differs from exact Director v2 text: " + clip.get("clipKey", "?"))
        if i not in (0, 6) and clip.get("narration") != parts[i]["hear"]:
            if not clip.get("narrationOverridden"):
                raise RuntimeError("Unexplained divergence in unchanged voice clip: " + clip.get("clipKey", "?"))
            print("Preserved previously approved Director narration override: " + clip.get("clipKey", "?"))
    print("Voice contract PASS: exact C01/C07, unchanged C02-C06 Director overrides and audio preserved.")
    
def main():
    first, second = preflight()
    director = post(FILES[0][2], first, max_attempts=18)
    post(FILES[1][2], second, max_attempts=5)
    verify()
    sync_voice_contract(director["scriptRevision"])
    print("EP001 SHOT05 v2 PROMOTED + VOICE SYNCED; existing SHOT01–04 Director locks protected.")

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"PROMOTION BLOCKED: {type(error).__name__}: {error}", file=sys.stderr)
        sys.exit(1)
