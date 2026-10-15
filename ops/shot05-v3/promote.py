#!/usr/bin/env python3
"""One-shot, revision-pinned Director v3 C01 promotion. Never bypasses a Director visual lock."""
import hashlib
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://media-os-backend-production.up.railway.app"
SOURCE = "ops/shot05-v3/import/"
V2_HASH = "003ee78105dd0f331a0cd0784374b38e4a4d3778141f784ad072f2944b253d3c"
V3_HASH = "ad757b71e1d2ca418a09f83c81581cf49699220b0c94b8d246a74848c51bc16a"
OLD_OPENING = "Now we know where the request is going. Follow it to the server. Before the password is checked, the request meets its first server-side checkpoint: the API Gateway."
NEW_OPENING = "The API Gateway is the first stop for our login request after it crosses the network. It doesn't check your password. Instead, it checks whether the request can continue and where it should go next. And if something is wrong, the login can stop right here."


def checksum(items):
    return hashlib.sha256("\n".join(items).encode("utf-8")).hexdigest()


def read_files():
    with open(SOURCE+"01_director_amendment.json",encoding="utf-8") as f:
        script = json.load(f)
    with open(SOURCE+"02_hear_see_contract.json",encoding="utf-8") as f:
        contract = json.load(f)
    c = [x for x in script["timeline"] if x["shotKey"] == "SHOT 05"]
    d = contract["timeline"]
    assert len(script["timeline"]) == 96 and len(c) == len(d) == 7
    assert c[0]["narration"] == d[0]["hear"] == NEW_OPENING
    assert checksum([x["narration"] for x in c]) == V3_HASH
    prior = [x["narration"] for x in c]
    prior[0] = OLD_OPENING
    assert checksum(prior) == V2_HASH, "C02-C07 differ from approved Director v2; abort"
    assert [(x["startSecond"],x["endSecond"],x["narration"]) for x in c] == [
        (x["startSecond"],x["endSecond"],x["hear"]) for x in d]
    print("PRECHECK OK: same 130-second seven-clip plan, exactly one C01 narration edit.",flush=True)
    return script,contract


def json_request(path, payload=None, timeout=45):
    data = None if payload is None else json.dumps(payload,ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(BASE+path, data=data, method="GET" if data is None else "POST",
            headers={"Accept":"application/json","Content-Type":"application/json"})
    try:
        with urllib.request.urlopen(req,timeout=timeout) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as error:
        detail = error.read(1400).decode("utf-8",errors="replace")
        raise RuntimeError(f"API {path}: HTTP {error.code}: {detail}") from error


def post_after_deployment(path, payload):
    for attempt in range(50):
        try:
            result = json_request(path,payload,timeout=40)
            if not result.get("ready"):
                raise RuntimeError(f"{path} returned ready!=true")
            return result
        except RuntimeError as error:
            if not any(z in str(error) for z in ["HTTP 409", "HTTP 502", "HTTP 503", "HTTP 504"]):
                raise
            if attempt==49:
                raise
            if attempt % 4 == 0:
                print(f"Waiting for deployed backend / protected migration gate, attempt {attempt+1}: {error}",flush=True)
            time.sleep(20)


def validate_active():
    active = json_request("/api/v1/production-contract")
    segments=[x for x in active.get("payload",{}).get("timeline",[]) if x.get("shotKey")=="SHOT 05"]
    assert len(segments)==7 and checksum([x["hear"] for x in segments])==V3_HASH, "Active contract does not match v3"
    print("PRODUCTION CONTRACT VERIFIED: exactly approved C01 v3 and untouched C02-C07.",flush=True)
    return segments


def synchronize_voice(revision,segments):
    bundle={
        "shotKey":"SHOT 05", "title":"API Gateway",
        "startSecond":segments[0]["startSecond"],"endSecond":segments[-1]["endSecond"],
        "narration":"\n\n".join(x["hear"] for x in segments),
        "voiceDirection":"calm, conversational, confident",
        "clips":[
            {"clipKey":x["clipKey"],"sequence":i+1,"startSecond":x["startSecond"],
             "endSecond":x["endSecond"],"narration":x["hear"],
             "voiceDirection":x["voiceDirection"]}
            for i,x in enumerate(segments)
        ]
    }
    output=json_request("/api/v1/voice-clips/sync",
        {"scriptRevision":revision,"shots":[bundle]})
    shot=sorted([x for x in output if x.get("shotKey")=="SHOT 05"],key=lambda x:x["sequence"])
    assert len(shot)==7
    assert shot[0]["narration"] == NEW_OPENING
    for i in range(1,7):
        if shot[i]["narration"] != segments[i]["hear"]:
            assert shot[i].get("narrationOverridden"), "Unexpected mutation to C02-C07"
    print("VOICE SYNC OK: new C01, original C02-C07 with approved overrides retained.",flush=True)


def generate_c01_draft(revision):
    key="SHOT 05-C01"
    current=json_request(f"/api/v1/voice-clips?scriptRevision={revision}")
    clips={x["clipKey"]:x for x in current if x.get("shotKey")=="SHOT 05"}
    assert len(clips)==7
    c=clips[key]
    assert c["narration"]==NEW_OPENING
    if c.get("approved") or c.get("generated"):
        print("Existing v3 C01 generation/approval preserved; skipped generation.",flush=True)
        return
    draft=json_request("/api/v1/voice-clips/"+urllib.parse.quote(key)+"/generate",
        {"scriptRevision":revision,"voiceSettings":{},
         "performanceDirection":"calm, conversational, confident"},timeout=120)
    assert draft.get("generated") is True and draft.get("narration")==NEW_OPENING
    assert draft.get("approved") is False, "Never auto approve voice"
    print("VOICE DRAFT CREATED: C01 only, creator approval required; C02-C07 untouched.",flush=True)


def main():
    script,contract=read_files()
    applied=post_after_deployment("/api/v1/locked-script/director-amendment",script)
    assert applied.get("amendmentVersion")=="V3",applied
    revision=applied["scriptRevision"]
    print(f"SCRIPT V3 ACTIVE: revision {revision}; V2 archive retained.",flush=True)
    contract["scriptRevision"]=revision
    post_after_deployment("/api/v1/production-contract/import",contract)
    segments=validate_active()
    synchronize_voice(revision,segments)
    generate_c01_draft(revision)
    print("SHOT05 C01 V3 PROMOTED: exact narrator text active, audio draft generated, no Director locks touched.",flush=True)


if __name__=="__main__":
    try:
        main()
    except Exception as ex:
        print(f"PROMOTION BLOCKED: {type(ex).__name__}: {ex}",file=sys.stderr,flush=True)
        sys.exit(1)
