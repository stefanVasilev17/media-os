import test from 'node:test';
import assert from 'node:assert/strict';
import {SHOT06_BEATS,SHOT06_FLEET,SHOT06_OUTPUTS,validateShot06PreviewTimeline,shot06PreviewState} from './src/components/architectural-thinking/EP004Shot06FleetPreview.mjs';

const duration=2460;
const starts=[90,270,480,660,870,1190,1450,1690,1950,2180];
const cues=SHOT06_BEATS.map((beatId,i)=>({beatId,startFrame:starts[i],endFrame:starts[i]+80}));

const state=f=>shot06PreviewState(f,cues,duration);
const cases=[
 ['valid exact beat mapping',()=>validateShot06PreviewTimeline(cues,duration)],
 ['rejects wrong beat ID',()=>{let bad=false;try{validateShot06PreviewTimeline(cues.map((c,i)=>i===3?{...c,beatId:'WRONG'}:c),duration)}catch{bad=true}assert(bad,'accepted wrong beat')}],
 ['rejects missing cues',()=>{let bad=false;try{validateShot06PreviewTimeline(cues.slice(0,-1),duration)}catch{bad=true}assert(bad,'accepted missing cue')}],
 ['route endpoints exactly meet nodes',()=>{for(let i=0;i<3;i++){let p=SHOT06_OUTPUTS[i].at(-1);assert(p[0]===SHOT06_FLEET[i].x&&p[1]===SHOT06_FLEET[i].portY,'unanchored route')}}],
 ['same offered interval across all frames',()=>{for(let f=0;f<duration;f+=11)assert(state(f).offeredInterval===18,'rate changed')}],
 ['wait accumulation and failure follow semantic cues',()=>{assert(state(270).waitingCount===0,'premature wait');assert(state(1100).waitingCount>state(600).waitingCount,'wait did not grow');assert(!state(1189).failed&&state(1190).failed,'wrong failure frame')}],
 ['no response packets after failure',()=>{for(let f=1190;f<duration;f+=7)assert(!state(f).local.some(p=>p.phase==='OUT'),'failed response')}],
 ['new destinations B/C only after comparison',()=>{for(let f=1710;f<duration;f+=7){const s=state(f);assert(!s.packets.some(p=>p.destination===0),'new A assignment');assert(s.serverStates[0].status==='Unresponsive','A not failed')}}],
 ['fixed route assignment during packet lifetime',()=>{const seen=new Map();for(let f=0;f<duration;f+=3)for(const p of state(f).packets){if(p.destination===undefined)continue;assert(!seen.has(p.id)||seen.get(p.id)===p.destination,'route changed in flight');seen.set(p.id,p.destination)}}],
 ['deterministic seek and camera return',()=>{assert(JSON.stringify(state(899))===JSON.stringify(state(899)),'non deterministic');assert(state(800).interior===1,'no closeup');assert(state(2100).interior===0&&state(2100).close===0,'no pullback')}],
 ['final handoff one failed two surviving',()=>{const s=state(duration-1);assert(s.serverStates[0].status==='Unresponsive'&&s.serverStates.slice(1).every(v=>v.status==='Higher load'),'bad handoff')}]
];
for(const [name,run] of cases)test(name,run);
