import assert from 'node:assert/strict';
import test from 'node:test';
import {CLIP_PREVIEW_INPUT_KEY, resolveClipPreviewRange} from './clip-preview-range.mjs';

test('full render does not specify a clip range', () => {
  assert.equal(resolveClipPreviewRange('REVIEW', {}, 2160, 30), null);
});
test('short render preserves original frame offsets', () => {
  assert.deepEqual(resolveClipPreviewRange('CLIP_PREVIEW', {
    [CLIP_PREVIEW_INPUT_KEY]: {startFrame: 240, endFrame: 389},
  }, 2160, 30), [240, 389]);
});
test('clip range cannot be sent under REVIEW', () => {
  assert.throws(() => resolveClipPreviewRange('REVIEW', {
    [CLIP_PREVIEW_INPUT_KEY]: {startFrame: 0, endFrame: 30},
  }, 2160, 30));
});
test('invalid, missing and long ranges are rejected', () => {
  assert.throws(() => resolveClipPreviewRange('CLIP_PREVIEW', {}, 2160, 30));
  for (const range of [
    {startFrame: -1, endFrame: 5}, {startFrame: 10, endFrame: 9},
    {startFrame: 0, endFrame: 2160}, {startFrame: 0, endFrame: 900},
    {startFrame: 0.5, endFrame: 50},
  ]) {
    assert.throws(() => resolveClipPreviewRange('CLIP_PREVIEW', {
      [CLIP_PREVIEW_INPUT_KEY]: range,
    }, 2160, 30));
  }
});
test('last frame can be rendered', () => {
  assert.deepEqual(resolveClipPreviewRange('CLIP_PREVIEW', {
    [CLIP_PREVIEW_INPUT_KEY]: {startFrame: 2159, endFrame: 2159},
  }, 2160, 30), [2159, 2159]);
});
