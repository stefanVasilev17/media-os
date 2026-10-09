import {Easing, interpolate} from 'remotion';
import type {ShotSpec, SliceRuntimeState} from '../../../engine/shot/types';
import {ANCHORS} from './timeline';

export const verticalSliceShotSpec: ShotSpec = {
  id: 'ep001_vertical_slice_auth_db_wait',
  name: 'User Database Response → Slow Dependency → Healthy Auth Waiting → Phone Waiting',
  startAnchor: 'database.answer.forms',
  endAnchor: 'phone.waiting.time-budget',
  reelSafe: true,
  semanticAnchors: [
    {
      id: 'database.answer.forms',
      provisionalFrame: ANCHORS.databaseAnswerForms,
      phrase: 'what account state should influence the journey next',
    },
    {
      id: 'auth.healthy.reset',
      provisionalFrame: ANCHORS.authHealthyReset,
      phrase: 'the Auth Service is working normally',
    },
    {
      id: 'database.slow',
      provisionalFrame: ANCHORS.databaseSlow,
      phrase: 'the User Database is slow',
    },
    {
      id: 'auth.healthy.login-broken',
      provisionalFrame: ANCHORS.authHealthyWhileWaiting,
      phrase: 'a service can be completely healthy on its own',
    },
    {
      id: 'phone.waiting.time-budget',
      provisionalFrame: ANCHORS.phoneWaitingReveal,
      phrase: 'the phone still shows a spinner',
    },
  ],
};

const progress = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

export const getVerticalSliceState = (frame: number): SliceRuntimeState => {
  const databaseSlow = frame >= ANCHORS.databaseSlow;
  const phoneVisible = frame >= ANCHORS.phoneWaitingReveal - 18;

  return {
    authService: {
      attention: 'ACTIVE',
      operational: databaseSlow ? 'WAITING' : 'READY',
    },
    userDatabase: {
      attention: databaseSlow ? 'FOCUS' : 'ACTIVE',
      operational: databaseSlow ? 'SLOW' : 'READY',
    },
    dependencyPath: databaseSlow
      ? 'WAITING'
      : frame < ANCHORS.databaseAnswerArrives
        ? 'RETURN'
        : 'ACTIVE',
    showResponse: frame <= ANCHORS.databaseAnswerArrives + 15,
    responseProgress: progress(
      frame,
      ANCHORS.databaseAnswerForms,
      ANCHORS.databaseAnswerArrives,
    ),
    responseOpacity: interpolate(
      frame,
      [
        ANCHORS.databaseAnswerForms,
        ANCHORS.databaseAnswerForms + 12,
        ANCHORS.databaseAnswerArrives,
        ANCHORS.databaseAnswerArrives + 15,
      ],
      [0, 1, 1, 0],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
    ),
    showLookup: frame >= ANCHORS.lookupBegins,
    lookupProgress: progress(frame, ANCHORS.lookupBegins, ANCHORS.lookupArrives),
    lookupOpacity: interpolate(
      frame,
      [ANCHORS.lookupBegins, ANCHORS.lookupBegins + 10, ANCHORS.sliceEnd],
      [0, 1, 1],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
    ),
    phoneVisible,
    phoneWaiting: phoneVisible,
    phoneReveal: progress(
      frame,
      ANCHORS.phoneWaitingReveal - 18,
      ANCHORS.phoneWaitingReveal + 24,
    ),
    timeBudget: interpolate(
      frame,
      [ANCHORS.phoneWaitingReveal, ANCHORS.sliceEnd],
      [1, 0.28],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
    ),
  };
};
