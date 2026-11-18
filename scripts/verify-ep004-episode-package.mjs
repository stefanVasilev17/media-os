import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const localDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(localDir, '..');
const expected = {
  script: '14c61a7d26f2be23ca30fef2280a4b13ad7ab110fadf32018b2ece6d59cb40a6',
  visual: '4f5f6a3c4b03e45f169222bf26fbc00b76dbdb88f6931fc0048153f4b19e3620',
  package: 'a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365',
};

const [packageFile, scriptFile, visualFile] = [
  process.argv[2] || resolve(rootDir,'docs/episode-memory/plans/2026-11-18-ep004-mediaos-episode-package-v1-director-locked.json'),
  process.argv[3] || resolve(rootDir,'docs/episode-memory/plans/2026-11-18-ep004-script-v1-director-locked.md'),
  process.argv[4] || resolve(rootDir,'docs/visual/EP004_VISUAL_STORYTELLING_V1_DIRECTOR_LOCKED_20261118.md'),
];
const text = path => readFileSync(path,'utf8');
const sha = source => createHash('sha256').update(source,'utf8').digest('hex');
const assert = (condition, code) => {if(!condition) throw new Error('EP004_IMPORT_PREFLIGHT_FAIL:' + code);};
const normalize = s => s.toLowerCase().replace(/\s+/g,' ').trim();
const packageText = text(packageFile);
const script = text(scriptFile);
const canonicalVisual = text(visualFile);
const visualAt = canonicalVisual.indexOf('# Architectural Thinking — EP004 Visual Storytelling Pass V1');
assert(visualAt >= 0, 'VISUAL_CANONICAL_BODY_MISSING');
const visual = canonicalVisual.slice(visualAt);
assert(sha(script) === expected.script, 'LOCKED_SCRIPT_DRIFT');
assert(sha(visual) === expected.visual, 'LOCKED_VISUAL_DRIFT');
assert(sha(packageText) === expected.package, 'PACKAGE_DRIFT');
assert(Buffer.byteLength(packageText,'utf8') <= 512*1024, 'IMPORT_512K_LIMIT');
assert(/\.json$/.test(packageFile), 'FILENAME_NOT_JSON');
const pkg = JSON.parse(packageText);
assert(pkg.schemaVersion === 'mediaos.episode-package.v1', 'SCHEMA_VERSION');
assert(pkg.episode.episodeKey === 'EP004', 'EPISODE_KEY');
assert(pkg.episode.language === 'en', 'LANGUAGE');
assert(pkg.sourceApproval.script === 'DIRECTOR_APPROVED' && pkg.sourceApproval.visualStoryline === 'DIRECTOR_APPROVED', 'DIRECTOR_SOURCE_LOCK');
assert(pkg.shots.length === 15, 'SHOT_COUNT');
assert(pkg.episode.targetDurationSeconds === pkg.shots.reduce((n,s)=>n+s.editorialDurationSeconds,0), 'DURATION_SUM');
assert(pkg.shortsCandidates.length === 3, 'SHORTS_COUNT');
assert(pkg.shortsCandidates.map(s=>s.shotKeys[0]).join('|') === 'SHOT07|SHOT10|SHOT13', 'SHORTS_LOCATION');

const heading = /^## SHOT (\d{2}) — (.*)$/gm;
const scriptHeadings = [...script.matchAll(heading)];
const visualHeadings = [...visual.matchAll(heading)];
assert(scriptHeadings.length === 15 && visualHeadings.length === 15, 'SOURCE_SHOT_COUNTS');
let totalSpokenParagraphs = 0;
let totalBeats = 0;
const byShot = [];
for (let si = 0; si < 15; si++) {
  const shot = pkg.shots[si];
  const sn = String(si+1).padStart(2,'0');
  assert(shot.shotKey === 'SHOT'+sn,'SHOT_SEQUENCE_'+sn);
  const scriptBlock = script.slice(scriptHeadings[si].index,scriptHeadings[si+1]?.index || script.length);
  const visualBlock = visual.slice(visualHeadings[si].index,visualHeadings[si+1]?.index || visual.indexOf('## Global transition contract'));
  const narrationBody = scriptBlock.split('**NARRATION**')[1];
  assert(!!narrationBody,'NARRATION_MISSING_'+sn);
  const narrationCleaned = narrationBody.split(/^(?:---|## (?!SHOT)|### )/m)[0]
    .replace(/^\*\*\[REEL[^\n]*\]\*\*\s*\n?/gm,'')
    .replace(/\*\*(.*?)\*\*/gs,'$1')
    .replace(/(?<!\w)\*([^*\n]+)\*/g,'$1')
    .trim();
  assert(narrationCleaned === shot.narration,'NARRATION_VERBATIM_'+sn);
  assert(shot.narration.length<=5000, 'ELEVENLABS_SINGLE_TAKE_CHAR_CAP_'+sn);
  const spokenParagraphs = narrationCleaned.split(/\n\s*\n/).filter(Boolean);
  const visualParagraphBlocks = [...visualBlock.matchAll(/^\*\*P(\d{2}) — ([^\n]*?)\*\*\s*/gm)];
  assert(spokenParagraphs.length === visualParagraphBlocks.length, 'PARAGRAPH_COUNT_'+sn);
  totalSpokenParagraphs += spokenParagraphs.length;
  const cuesByParagraph = new Map();
  let lastCueEnd = 0;
  for (const beat of shot.visualBeats) {
    const m = beat.beatId.match(new RegExp('^SHOT'+sn+'_P(\\d{2})_B(\\d{2})$'));
    assert(!!m,'BEAT_ID_'+beat.beatId);
    const p = Number(m[1]);
    assert(p>=1 && p<=spokenParagraphs.length,'BEAT_PARAGRAPH_'+beat.beatId);
    const list = cuesByParagraph.get(p) || [];
    list.push(beat);
    cuesByParagraph.set(p,list);
    // Repeat Java's whitespace-only/case-only normalization for literal cues.
    assert(normalize(shot.narration).includes(normalize(beat.cueAnchor)), 'SERVER_LITERAL_CUE_'+beat.beatId);
    const cueStart = shot.narration.toLowerCase().indexOf(beat.cueAnchor.toLowerCase(),lastCueEnd);
    assert(cueStart>=lastCueEnd,'HEAR_SEE_UNORDERED_'+beat.beatId);
    lastCueEnd = cueStart + beat.cueAnchor.length;
    assert(beat.direction.length>=10&&beat.direction.length<=3000,'VISUAL_DIRECTION_LIMIT_'+beat.beatId);
  }
  assert(shot.visualBeats.length<=40,'MAX_40_BEATS_'+sn);
  for (let pi=0;pi<spokenParagraphs.length;pi++) {
    const id = pi+1;
    const source = visualParagraphBlocks[pi];
    assert(Number(source[1])===id, 'VISUAL_P_INDEX_'+sn+'_'+id);
    const following = visualParagraphBlocks[pi+1];
    let original = visualBlock.slice(source.index+source[0].length,following?.index || visualBlock.length)
      .split(/^\*\*Transition \d{2}→\d{2}:\*\*/m)[0]
      .split(/^---\s*$/m)[0].trim();
    original=original.replace(/\s+/g,' ').trim();
    const phases = cuesByParagraph.get(id)||[];
    assert(phases.length>0,'VISUAL_PARAGRAPH_NOT_COVERED_'+sn+'_'+id);
    const merged = phases.map((phase,index)=>{
      const prefix = new RegExp('^Paragraph P'+String(id).padStart(2,'0')+'\\. Visual phase '+(index+1)+'/'+phases.length+'\\. ');
      assert(prefix.test(phase.direction),'PHASE_ORDER_'+phase.beatId);
      return phase.direction.replace(prefix,'');
    }).join(' ').replace(/\s+/g,' ').trim();
    assert(merged===original,'VISUAL_TEXT_NOT_COMPLETE_'+sn+'_'+id);
  }
  byShot.push({shotKey:shot.shotKey,paragraphs:spokenParagraphs.length,beats:shot.visualBeats.length,narrationChars:shot.narration.length});
  totalBeats+=shot.visualBeats.length;
}
assert(totalSpokenParagraphs===51,'GLOBAL_PARAGRAPHS');
assert(totalBeats===128,'GLOBAL_BEATS');
for(const candidate of pkg.shortsCandidates){
  const s=pkg.shots.find(z=>z.shotKey===candidate.shotKeys[0]);
  assert(s && s.narration.includes(candidate.hook), 'SHORTS_HOOK_MISSING');
}
const result={status:'PASS',episodeKey:pkg.episode.episodeKey,sha256:sha(packageText),bytes:Buffer.byteLength(packageText),shots:pkg.shots.length,spokenParagraphs:totalSpokenParagraphs,hearSeeBeats:totalBeats,shorts:pkg.shortsCandidates.map(s=>s.shotKeys[0]),durationEditorialSeconds:pkg.episode.targetDurationSeconds,checks:'VERBATIM_SCRIPT_AND_VISUAL_DIRECTION; LITERAL_ORDERED_CUES; SHA256; SOURCE_LIMITS; SHORTS',byShot};
console.log(JSON.stringify(result,null,2));
