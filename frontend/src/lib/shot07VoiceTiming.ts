import type {VoiceClipState} from '../api/voiceClipApi';

const FPS = 30;
const FIRST_HOLD_FRAMES = 24;
const GAPS = [36, 30, 45, 36];
const FINAL_HOLD_FRAMES = 54;

const CUES: Array<Record<string, string>> = [
  {
    AUTH_ARRIVAL: 'Our Login Request has finally reached the Auth Service',
    INSTANCE_B: 'The Load Balancer selected Instance B',
    ROUTING_NOT_TRUST: 'which server will do the work',
    AUTH_DEFINITION: 'Its responsibility is authentication',
    PROOF_QUESTION: 'checking whether someone can prove',
  },
  {
    INBOX_OPEN: "Let's look at what arrived",
    INPUT_FIELDS: 'an identifier, such as an email address, and a password',
    IDENTIFIER_ROLE: 'which account we want to access',
    SECRET_ROLE: 'the secret we are offering as proof',
    NOT_YET_CORRECT: 'does not automatically mean they are correct',
    FORMAT_PREP: 'a request it can properly process',
  },
  {
    VALIDATION_NAME: 'This first stage is called Request Validation',
    EMPTY_FIELD_EXAMPLE: 'the email field is empty',
    FORMAT_EXAMPLE: "information arrives in a format the system doesn't understand",
    REQUIRED_CHECK: 'required information exists',
    STRUCTURE_CHECK: 'expected structure',
    LIMITS_CHECK: 'within acceptable limits',
    VALID_NOT_LOGIN: 'A valid request is not the same as a successful login',
  },
  {
    CHECKS_PASSED: 'the request has passed those basic checks',
    PASSWORD_UNKNOWN: "still doesn't know whether the password belongs to that account",
    EMAIL_CLAIM: "Knowing your email doesn't make them you",
    FIND_ACCOUNT: 'find the actual account associated with that email',
    GET_FACTS: 'retrieve the information required to check the password',
    LOOKUP_BORN: 'creates a new internal request called User Lookup',
  },
  {
    ORIGINAL_STAYS: 'Our original Login Request stays inside the Auth Service',
    LOOKUP_TRAVELS: 'a second request travels toward the User Database',
    NOT_SECOND_LOGIN: 'This second request is not another login attempt',
    SERVICE_QUESTION: 'a question from one part of the system to another',
    LOOKUP_ACCOUNT: 'do we have an account matching this identifier',
    INFORMATION_FOR_VERIFY: 'what information do I need to verify it',
  },
];

type Word = {text: string; start: number};

const tokenize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);

function elevenLabsWords(clip: VoiceClipState): Word[] {
  const raw = clip.generatedAlignment;
  const normalized = raw.normalized_alignment || raw.alignment;
  if (!normalized || typeof normalized !== 'object') {
    throw new Error(clip.clipKey + ': missing ElevenLabs word alignment. Approved audio was not changed.');
  }
  const alignment = normalized as Record<string, unknown>;
  const chars = alignment.characters;
  const times = alignment.character_start_times_seconds;
  if (!Array.isArray(chars) || !Array.isArray(times) || chars.length !== times.length) {
    throw new Error(clip.clipKey + ': incomplete ElevenLabs timestamp data.');
  }
  const words: Word[] = [];
  let token = '';
  let tokenStart = 0;
  let audioTag = false;
  const flush = () => {
    if (token) {
      words.push({text: token, start: tokenStart});
      token = '';
    }
  };
  for (let index = 0; index < chars.length; index++) {
    const ch = String(chars[index]);
    if (ch === '[') {
      flush();
      audioTag = true;
    } else if (ch === ']' && audioTag) {
      audioTag = false;
    } else if (!audioTag && /^[a-zA-Z0-9']$/.test(ch)) {
      if (!token) tokenStart = Number(times[index]);
      token += ch;
    } else if (!audioTag) {
      flush();
    }
  }
  flush();
  return words.flatMap(word =>
    tokenize(word.text).map(token => ({text: token, start: word.start}))
  );
}

function matchCue(words: Word[], phrase: string, clipKey: string, cue: string): number {
  const expected = tokenize(phrase);
  const matches: number[] = [];
  for (let index = 0; index <= words.length - expected.length; index++) {
    if (expected.every((token, at) => words[index + at].text === token)) matches.push(index);
  }
  if (matches.length !== 1) {
    throw new Error(clipKey + ': semantic cue ' + cue + ' did not match a unique spoken location (' +
      matches.length + ' matches). Review alignment; never alter LOCKED narration.');
  }
  return words[matches[0]].start;
}

export function buildShot07DirectorTiming(clips: VoiceClipState[]) {
  if (clips.length !== 5 ||
      clips.some((clip, index) =>
        clip.clipKey !== 'SHOT 07-C0' + (index + 1) ||
        !clip.approved || !clip.generated ||
        !Number.isFinite(clip.durationSeconds) || clip.durationSeconds <= 0)) {
    throw new Error('SHOT 07 requires the five original Director-approved audio recordings C01–C05.');
  }

  let cursor = FIRST_HOLD_FRAMES;
  const pacedAnchors: Record<string, number> = {};
  const windows = [];
  const comprehensionHolds = [];
  for (let index = 0; index < clips.length; index++) {
    const clip = clips[index];
    const lengthFrames = Math.ceil(clip.durationSeconds * FPS);
    const startFrame = cursor;
    const endFrame = startFrame + lengthFrames;
    windows.push({
      clip,
      rawStart: 0,
      rawEnd: clip.durationSeconds,
      plannedStart: startFrame / FPS,
      plannedEnd: endFrame / FPS
    });

    const spokenWords = elevenLabsWords(clip);
    let lastFrame = -1;
    for (const [key, phrase] of Object.entries(CUES[index])) {
      const local = matchCue(spokenWords, phrase, clip.clipKey, key);
      const globalFrame = startFrame + Math.round(local * FPS);
      if (globalFrame <= lastFrame || globalFrame >= endFrame) {
        throw new Error(clip.clipKey + ': cue ' + key + ' is out of order or outside approved audio.');
      }
      lastFrame = globalFrame;
      pacedAnchors[key] = globalFrame / FPS;
    }

    cursor = endFrame;
    if (index < GAPS.length) {
      comprehensionHolds.push({
        fromFrame: cursor,
        toFrame: cursor + GAPS[index],
        canonicalFrame: cursor - 1
      });
      cursor += GAPS[index];
    }
  }
  cursor += FINAL_HOLD_FRAMES;

  return {windows, pacedAnchors, comprehensionHolds, durationInFrames: cursor};
}
