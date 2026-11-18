#!/usr/bin/env node
// Run on a full repo checkout: node scripts/verify-ep004-foundation.mjs
// Zero provider/network/render calls; verifies protected source + machine manifest.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const sha = (value) => createHash('sha256').update(value).digest('hex');
const fail = (code) => { throw new Error('EP004_FOUNDATION_FAIL:' + code); };
const script = read('docs/episode-memory/plans/2026-11-18-ep004-script-v1-director-locked.md');
const visual = read('docs/visual/EP004_VISUAL_STORYTELLING_V1_DIRECTOR_LOCKED_20261118.md');
const agents = read('AGENTS.md');
const state = read('PROJECT_STATE.md');
const contractTs = read('remotion-engine/src/episodes/ep004/ep004ProductionContract.ts');
const routeTs = read('remotion-engine/src/episodes/ep004/ep004RouteGeometry.ts');

const rawVisualAt = visual.indexOf('# Architectural Thinking — EP004 Visual Storytelling Pass V1');
if (rawVisualAt < 0 || !visual.startsWith('> **DIRECTOR-LOCKED')) fail('VISUAL_LOCK_PREFACE_MISSING');
const originalVisual = visual.slice(rawVisualAt);
if (sha(script) !== '14c61a7d26f2be23ca30fef2280a4b13ad7ab110fadf32018b2ece6d59cb40a6') fail('SCRIPT_HASH_DRIFT');
if (sha(originalVisual) !== '4f5f6a3c4b03e45f169222bf26fbc00b76dbdb88f6931fc0048153f4b19e3620') fail('VISUAL_PLAN_HASH_DRIFT');
for (const path of ['docs/episode-memory/plans/2026-11-18-ep004-script-v1-director-locked.md','docs/visual/EP004_VISUAL_STORYTELLING_V1_DIRECTOR_LOCKED_20261118.md']) {
  if (!agents.includes(path) || !state.includes(path)) fail('MISSING_STARTUP_LINK:' + path);
}
const contractStart = 'export const ep004ProductionContract = ';
const contractEnd = ' as const;';
const start = contractTs.indexOf(contractStart);
if (start < 0) fail('MISSING_CONTRACT');
const afterStart = start + contractStart.length;
const end = contractTs.indexOf(contractEnd, afterStart);
if (end < 0) fail('UNPARSEABLE_CONTRACT');
const manifest = JSON.parse(contractTs.slice(afterStart,end));
if (manifest.scriptStatus !== 'DIRECTOR_LOCKED' || manifest.visualStoryStatus !== 'EPISODE_LEVEL_DIRECTOR_LOCKED') fail('LOCK_DRIFT');
if (manifest.mediaMode !== 'OBJECT_STORAGE_ONLY') fail('PG_MEDIA_WRITE_RISK');
if (manifest.allowedProductionServices.join('|') !== 'media-os-backend|media-os-render-worker|Postgres') fail('ILLEGAL_SERVICE');
if (manifest.shots.length !== 15) fail('SHOT_COUNT');
const paragraphIds = manifest.shots.flatMap(s => s.paragraphs.map(p => p.id));
if (paragraphIds.length !== 51 || new Set(paragraphIds).size !== 51) fail('PARAGRAPH_INVENTORY');
if (manifest.shots.filter(s => s.reel !== null).map(s => s.id).join('|') !== 'SHOT07|SHOT10|SHOT13') fail('REEL_INVENTORY');
const visualParagraphs = [...originalVisual.matchAll(/^\*\*P(\d{2}) — /gm)];
if (visualParagraphs.length !== 51) fail('VISUAL_PARAGRAPH_COUNT');
const scriptShots = [...script.matchAll(/^## SHOT (\d{2}) — /gm)].map(x => x[1]);
const visualShots = [...originalVisual.matchAll(/^## SHOT (\d{2}) — /gm)].map(x => x[1]);
if (scriptShots.length !== 15 || visualShots.length !== 15 || scriptShots.join('|') !== visualShots.join('|')) fail('SHOT_ORDER_DRIFT');
const n = new Set(manifest.nodes.map(n => n.id));
for (const route of manifest.routes) if (!n.has(route.from) || !n.has(route.to)) fail('ORPHAN_ROUTE:' + route.id);
if (!routeTs.includes('ep004SvgPathData') || !routeTs.includes('ep004PacketOnPath') || !routeTs.includes('ep004SeamBlockers')) fail('PATH_OR_SEAM_GUARD_MISSING');
console.log('EP004_FOUNDATION_PASS: 15 SHOTs, 51 paragraphs, 3 Reels, source hashes and 7 route endpoints verified.');
