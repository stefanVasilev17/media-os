import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {shot10TextWidth} from './shot10-content-fit-layout.mjs';
import {SHOT11_LARGE_AMBER_STORY} from './shot11-large-amber-story.mjs';
import {ep003CardIsReadable,ep003CardOpacity,ep003MinReadableCardFrames,
  EP003_CARD_FADE_IN_FRAMES,EP003_CARD_FADE_OUT_FRAMES}
  from './ep003-readable-card-policy.mjs';

const scene=fs.readFileSync(new URL('./src/episodes/ep003/Shot01DirectorReviewV1.tsx',import.meta.url),'utf8');
const script=fs.readFileSync(new URL('../backend/src/main/resources/ep003-director-locked-voice-package-v1.json',import.meta.url),'utf8');
const launcher=fs.readFileSync(new URL('./ep003-shot01-render-once.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(script);
const cards=[
  ['AFTER THE RECOVERY','THE RETRY STORM IS UNDER CONTROL'],
  ['THE USER JOURNEY','SOME LOGINS STILL CANNOT FINISH'],
  ['LOAD SHEDDING','REJECT EXCESS WORK EARLY'],
  ['THE HUMAN CONSEQUENCE','A FAST REJECTION IS STILL A FAILED LOGIN'],
  ['THE NEXT QUESTION','WHAT IF ONE DATABASE IS NOT ENOUGH?'],
];
const rectangles={
  gateway:{left:650-129,top:410,width:258,height:250},
  balancer:{left:927-123,top:410,width:246,height:250},
  auth:{left:1326-175,top:315,width:350,height:348},
  db:{left:1697-126,top:368,width:252,height:280},
};
const intersects=(a,b,margin=0)=>a.left<b.left+b.width+margin
  &&a.left+a.width+margin>b.left&&a.top<b.top+b.height+margin
  &&a.top+a.height+margin>b.top;

test('EP003 source retains all 11 exact v0.4 spoken narration SHOTs',()=>{
  assert.equal(pkg.episode.episodeKey,'EP003');
  assert.equal(pkg.episode.title,'What Happens When One Database Is No Longer Enough?');
  assert.equal(pkg.shots.length,11);
  for(let i=0;i<11;i++){
    const shot=pkg.shots[i];
    assert.equal(shot.shotKey,'SHOT'+String(i+1).padStart(2,'0'));
    assert.ok(shot.narration.length>300);
  }
  let words=0;
  for(const shot of pkg.shots){
    words+=(shot.narration.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)||[]).length;
  }
  assert.equal(words,2917);
  assert.equal(pkg.sourceApproval.script,'DIRECTOR_APPROVED');
  assert.equal(pkg.sourceApproval.visualStoryline,'VOICE_ONLY_DRAFT');
});

test('EP003 reuse EP002 actual living world, shared visible connection geometry and original last frame',()=>{
  assert.match(scene,/Shot07CleanArchitectureWorld/);
  assert.match(scene,/SHOT02_BALANCER_EXIT/);
  assert.match(scene,/SHOT02_AUTH_CARD_LEFT/);
  assert.match(scene,/SHOT02_AUTH_REPLICA_PORTS/);
  assert.match(scene,/shot02CubicPoint\(1-clamp\(t\),entry,c1,c2,end\)/);
  assert.match(scene,/previousLastFrameDataUri/);
  assert.match(scene,/EP003_SHOT01_REQUIRES_REAL_EP002_FINAL_FRAME_AND_SELECTED_TAKE/);
  assert.match(scene,/props\.worldStartFrame\+frame/);
  assert.equal(SHOT11_LARGE_AMBER_STORY.at(-1).headline,'NEXT: MULTIPLE DATABASE INSTANCES.');
});

test('all on-screen EP003 content panels fit exact 1080p negative-space lane',()=>{
  const left=560,top=742,pad=34;
  for(const [eyebrow,line] of cards){
    const width=Math.ceil(Math.max(shot10TextWidth(eyebrow,23),shot10TextWidth(line,29))+pad*2+12);
    const rect={left,top,width,height:131};
    assert.ok(width>=340&&width<=950,eyebrow+' width='+width);
    assert.ok(rect.left>=44&&rect.top>=40);
    assert.ok(left+width<=1794);
    assert.ok(top+131<=1020);
    for(const [name,architecture] of Object.entries(rectangles)){
      assert.ok(!intersects(rect,architecture,20),eyebrow+' collides with '+name);
    }
  }
  assert.match(scene,/const i=cueIndex\(frame,cues\)/);
  assert.match(scene,/if\(i<0\)return null/);
  assert.match(scene,/fontSize:29/);
});

test('render refuses unapproved CPU spend, speculative timing, mismatched source and duplicate render',()=>{
  assert.match(launcher,/EP003_DIRECTOR_SHOT01_RENDER_APPROVED/);
  assert.match(launcher,/RENDER_NOT_AUTHORIZED_BY_DIRECTOR_ENV_GATE/);
  assert.match(launcher,/REAL_ELEVENLABS_ALIGNMENT_MISSING__DO_NOT_USE_GUESSED_CUES_OR_REGENERATE/);
  assert.match(launcher,/EP003_SHOT01_NO_DIRECTOR_APPROVED_TAKE__BLOCK_RENDER/);
  assert.match(launcher,/DIRECTOR_LOCKED_EP003_SCRIPT_MISMATCH/);
  assert.match(launcher,/SELECTED_AUDIO_NOT_VERIFIED_SLOW_NATURAL__NO_AUDIO_REGEN/);
  assert.match(launcher,/ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1/);
  assert.match(launcher,/PINNED_EP002_MEDIA_STREAM_NOT_1920x1080/);
  assert.match(launcher,/EP003_SHOT01_EXISTING_RENDER/);
  assert.match(launcher,/EP003_SHOT01_P0_ACTUAL_PIXEL_QA/);
  assert.match(launcher,/EP003_SHOT01_FIRST_RENDERED_FRAME_NOT_CONTINUOUS_WITH_REAL_EP002_LAST_FRAME/);
  assert.match(launcher,/EP003_SHOT01_REAL_MP4_SAVED/);
  assert.doesNotMatch(launcher,/elevenlabs\.generate|textToSpeech|triggerActions/);
});

test('canonical EP002 source and EP003 render check same 1572 frame source pin',()=>{
  const id='73ec0e6f-d348-4518-a32b-573bf89a8ab5';
  assert.ok(scene.includes(id));
  assert.ok(launcher.includes(id));
  assert.ok(scene.includes('worldLastFrame:10407+1571'));
  assert.ok(launcher.includes('const EXPECTED_FRAMES=1572'));
  assert.ok(launcher.includes("'-frames:v','1'"));
  assert.ok(launcher.includes("'select=eq(n\\\\,1571)'"));
});


test('EP003 panels never overlap the established EP002 Phone reserved lane',()=>{
  const phone={left:55,top:160,width:445,height:800};
  for(const [eyebrow,line] of cards){
    const width=Math.ceil(Math.max(shot10TextWidth(eyebrow,23),
      shot10TextWidth(line,29))+34*2+12);
    assert.equal(intersects({left:560,top:742,width,height:131},phone,24),false);
  }
});


test('P0 unreadable container regression: no subsecond flash and human-readable visibility for all five actual EP003 spoken cue intervals',()=>{
  const cues=[323,688,1231,1937,2217,2514];
  const labels=cards;
  for(let i=0;i<labels.length;i++){
    const [eyebrow,line]=labels[i],from=cues[i],to=cues[i+1];
    const min=ep003MinReadableCardFrames(eyebrow,line,30);
    assert.ok(to-from>=min,eyebrow+' requires '+min+' frames but has '+(to-from));
    assert.equal(ep003CardIsReadable(eyebrow,line,from,to),true);
    const firstStable=from+EP003_CARD_FADE_IN_FRAMES;
    const lastStable=to-EP003_CARD_FADE_OUT_FRAMES;
    assert.equal(ep003CardOpacity(firstStable,from,to),1,
      eyebrow+' must be fully visible after fade in');
    assert.equal(ep003CardOpacity(Math.floor((from+to)/2),from,to),1,
      eyebrow+' must NOT stay hidden between cues');
    assert.equal(ep003CardOpacity(lastStable,from,to),1,
      eyebrow+' must remain visible until the final fade out');
    assert.equal(ep003CardOpacity(from,from,to),0);
    assert.equal(ep003CardOpacity(to,from,to),0);
  }
  assert.match(scene,/ep003CardOpacity\(frame,cues\[entry\.cue\],endFrame\)/);
  assert.match(scene,/ep003CardIsReadable\(entry\.eyebrow,entry\.line,cues\[entry\.cue\],endFrame\)/);
  assert.doesNotMatch(scene,/1-ease\(until,0,21\)/);
});
test('P0 short-lived text must be OMITTED rather than flashing briefly',()=>{
  assert.ok(ep003MinReadableCardFrames('ONE MORE ITEM','A SHORT MESSAGE')>=165);
  assert.equal(ep003CardIsReadable('ONE MORE ITEM','A SHORT MESSAGE',200,270),false);
  assert.equal(ep003CardIsReadable('ONE MORE ITEM','A SHORT MESSAGE',200,400),true);
  assert.equal(ep003CardOpacity(201,200,400)>0,true);
  assert.ok(ep003CardOpacity(203,200,400)<0.1);
  assert.equal(ep003CardOpacity(250,200,400),1);
  assert.ok(ep003CardOpacity(395,200,400)<0.25);
  assert.equal(ep003CardOpacity(400,200,400),0);
});
