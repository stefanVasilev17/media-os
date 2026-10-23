#!/usr/bin/env python3
"""One-shot, non-locking SHOT07 review render using only previously approved media."""
import json
import math
import os
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

BASE = os.environ.get("MEDIAOS_BASE", "https://media-os-backend-production.up.railway.app").rstrip("/")
FPS = 30
GAPS = (36, 30, 45, 36)
LEGACY_REVIEW_ID = "37a47af3-a8fe-4fc5-b421-398f10380f7b"
REVISION = "TIER2_MINIPHONE_AUTH_LOOKUP_V1"
PHRASES = (
    (
        ("AUTH_ARRIVAL", "Our Login Request has finally reached the Auth Service"),
        ("INSTANCE_B", "The Load Balancer selected Instance B"),
        ("ROUTING_NOT_TRUST", "which server will do the work"),
        ("AUTH_DEFINITION", "Its responsibility is authentication"),
        ("PROOF_QUESTION", "checking whether someone can prove"),
    ),
    (
        ("INBOX_OPEN", "Let's look at what arrived"),
        ("INPUT_FIELDS", "an identifier, such as an email address, and a password"),
        ("IDENTIFIER_ROLE", "which account we want to access"),
        ("SECRET_ROLE", "the secret we are offering as proof"),
        ("NOT_YET_CORRECT", "does not automatically mean they are correct"),
        ("FORMAT_PREP", "a request it can properly process"),
    ),
    (
        ("VALIDATION_NAME", "This first stage is called Request Validation"),
        ("EMPTY_FIELD_EXAMPLE", "the email field is empty"),
        ("FORMAT_EXAMPLE", "information arrives in a format the system doesn't understand"),
        ("REQUIRED_CHECK", "required information exists"),
        ("STRUCTURE_CHECK", "expected structure"),
        ("LIMITS_CHECK", "within acceptable limits"),
        ("VALID_NOT_LOGIN", "A valid request is not the same as a successful login"),
    ),
    (
        ("CHECKS_PASSED", "the request has passed those basic checks"),
        ("PASSWORD_UNKNOWN", "still doesn't know whether the password belongs to that account"),
        ("EMAIL_CLAIM", "Knowing your email doesn't make them you"),
        ("FIND_ACCOUNT", "find the actual account associated with that email"),
        ("GET_FACTS", "retrieve the information required to check the password"),
        ("LOOKUP_BORN", "creates a new internal request called User Lookup"),
    ),
    (
        ("ORIGINAL_STAYS", "Our original Login Request stays inside the Auth Service"),
        ("LOOKUP_TRAVELS", "a second request travels toward the User Database"),
        ("NOT_SECOND_LOGIN", "This second request is not another login attempt"),
        ("SERVICE_QUESTION", "a question from one part of the system to another"),
        ("LOOKUP_ACCOUNT", "do we have an account matching this identifier"),
        ("INFORMATION_FOR_VERIFY", "what information do I need to verify it"),
    ),
)

def api(path, body=None):
    data = None if body is None else json.dumps(body, separators=(",", ":")).encode()
    req = Request(BASE + path, data=data, headers={
        "Accept": "application/json",
        "User-Agent": "MediaOS-Director-SHOT07-OneShot/1.0",
        **({"Content-Type": "application/json"} if data is not None else {})
    }, method="POST" if data is not None else "GET")
    try:
        with urlopen(req, timeout=60) as response:
            return json.loads(response.read())
    except HTTPError as err:
        body = err.read(1500).decode("utf-8", errors="replace")
        raise RuntimeError(f"{path}: HTTP {err.code}, {body}") from err

def tokens(value):
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip().split()

def word_alignment(clip):
    raw = clip["generatedAlignment"]
    a = raw.get("normalized_alignment") or raw.get("alignment")
    if not isinstance(a, dict):
        raise ValueError(f"{clip['clipKey']}: missing approved ElevenLabs alignment")
    chars, times = a.get("characters"), a.get("character_start_times_seconds")
    if not isinstance(chars, list) or not isinstance(times, list) or len(chars) != len(times):
        raise ValueError(f"{clip['clipKey']}: incomplete character alignment")
    words, token, start, audio_tag = [], "", 0, False
    def flush():
        nonlocal token
        if token:
            words.extend((piece, start) for piece in tokens(token))
            token = ""
    for char, timestamp in zip(chars, times):
        char = str(char)
        if char == "[":
            flush()
            audio_tag = True
        elif char == "]" and audio_tag:
            audio_tag = False
        elif not audio_tag and re.fullmatch(r"[a-zA-Z0-9']", char):
            if not token:
                start = float(timestamp)
            token += char
        elif not audio_tag:
            flush()
    flush()
    return words

def phrase_seconds(words, phrase, key, clip_key):
    wanted = tokens(phrase)
    positions = [
        i for i in range(len(words) - len(wanted) + 1)
        if [v for v, _ in words[i:i+len(wanted)]] == wanted
    ]
    if len(positions) != 1:
        raise ValueError(f"{clip_key} anchor {key}: expected exactly one match, found {len(positions)}")
    return float(words[positions[0]][1])

def main():
    voice = api("/api/v1/director-voice-pack")
    contract = api("/api/v1/director-visual-contract/shot-07")
    if not voice.get("ready") or not contract.get("ready"):
        raise ValueError("The immutable voice pack or auto-imported SHOT07 draft is not ready.")
    if contract["payload"].get("source") != "DIRECTOR_TIER2_VISUAL_PASS_V3_2026_10_24":
        raise ValueError("Tier++ visual contract migration V75 is not live: will not render legacy design.")
    draft = contract["payload"]
    if (draft.get("shotKey") != "SHOT 07" or draft.get("status") != "VISUAL_DRAFT"
            or draft.get("scriptRevision") != 3 or len(draft.get("timeline", [])) != 5
            or contract.get("voicePackSha256") != voice.get("sha256")):
        raise ValueError("SHOT07 visual draft does not match the locked voice pack.")
    approved = voice["payload"]["shots"]
    shot = next((x for x in approved if x["shotKey"] == "SHOT 07"), None)
    if not shot or len(shot["clips"]) != 5:
        raise ValueError("Approved C01-C05 voice pack missing.")
    clips = [x for x in api("/api/v1/voice-clips?scriptRevision=3")
             if x.get("shotKey") == "SHOT 07"]
    clips.sort(key=lambda x: x["sequence"])
    if len(clips) != 5:
        raise ValueError("Exactly five real SHOT07 voice recordings are required.")
    storage = api("/api/v1/storage/health")
    if storage.get("status") != "ESTIMATED_OK":
        raise ValueError(f"Storage guard blocks new render: {storage.get('status')}")
    latest = api("/api/v1/remotion/renders/compositions/EP001-Shot07-VoiceSynced/latest?profile=REVIEW")
    if latest.get("status") in ("QUEUED", "RENDERING", "READY") and latest.get("renderId") != LEGACY_REVIEW_ID:
        print("SAFE SKIP: a newer SHOT07 REVIEW render is already present; ID=" +
              str(latest.get("renderId", "")) + " status=" + str(latest.get("status")))
        return

    anchors, audio_clips, holds = {}, [], []
    cursor = 24
    for index, (clip, approved_clip, segment, cues) in enumerate(
            zip(clips, shot["clips"], draft["timeline"], PHRASES)):
        key = f"SHOT 07-C0{index+1}"
        if (clip["clipKey"] != key or approved_clip["clipKey"] != key or
            segment["clipKey"] != key or segment["hear"].strip() != approved_clip["narration"].strip() or
            not clip.get("approved") or not clip.get("generated")):
            raise ValueError(f"{key}: voice differs from immutable Director-approved recording")
        seconds = float(clip["durationSeconds"])
        if not math.isfinite(seconds) or seconds <= 0:
            raise ValueError(f"{key}: invalid recorded audio duration")
        length = math.ceil(seconds * FPS)
        end = cursor + length
        words = word_alignment(clip)
        previous = -1
        for anchor_key, spoken in cues:
            local = phrase_seconds(words, spoken, anchor_key, key)
            at = cursor + round(local * FPS)
            if not (previous < at < end):
                raise ValueError(f"{key}: spoken anchor out of order or duration")
            previous = at
            anchors[anchor_key] = at / FPS
        audio_clips.append({
            "src": BASE + "/api/v1/voice-clips/" + quote(key, safe="") +
                   f"/audio?scriptRevision=3&v={clip['generationRevision']}",
            "fromFrame": cursor,
            "durationInFrames": length,
            "trimBeforeFrames": max(0, round(float(clip.get("leadingTrimSeconds") or 0) * FPS))
        })
        cursor = end
        if index < 4:
            holds.append({"fromFrame": cursor, "toFrame": cursor + GAPS[index],
                          "canonicalFrame": cursor-1})
            cursor += GAPS[index]
    cursor += 54
    input_props = {
        "shotKey": "SHOT 07", "scriptRevision": 3,
        "visualRevision": REVISION,
        "draftVisualContractSha256": contract["sha256"],
        "voicePackSha256": contract["voicePackSha256"],
        "audioUrl": "", "audioClips": audio_clips,
        "durationInFrames": cursor,
        "anchors": anchors,
        "comprehensionHolds": holds
    }
    print(f"Validated {len(clips)} locked clips; {len(anchors)} voice anchors; "
          f"{cursor} frames; storage check OK.")
    render = api("/api/v1/remotion/renders/compositions/EP001-Shot07-VoiceSynced",
                 {"profile": "REVIEW", "inputProps": input_props})
    print("SHOT07 DRAFT QUEUED: " + json.dumps({
        "renderId": render.get("renderId"), "status": render.get("status"),
        "durationInFrames": cursor, "sha256": contract["sha256"]
    }))
    print("Only an isolated review has been requested. No QA, voice, Director LOCK "
          "or cumulative-episode operation was performed.")

if __name__ == "__main__":
    main()
