import {describe,expect,it} from 'vitest';
import scriptV5 from '../data/EP002_FullScript_v5_0_LOCKED.json';
import visualV5 from '../data/EP002_RecoveryVisualOverrides_v5_0.json';
import {suggestEp002VoiceCueAnchors,uniqueSpokenPhrase} from './ep002VoiceCueAnchors';

const shot03=`Now, all those Login requests are reaching the same User Database. And this is where things start to slow down.
In our example, each Login needs one account lookup. The database can finish about five hundred of these lookups every second.
Engineers call this throughput — how much work a system can complete in a given amount of time.
But six hundred and fifty new Login requests are arriving every second. Then nine hundred.
That’s the arrival rate — how quickly new requests enter the system.
More requests are arriving than the database can handle. So unfinished work starts piling up. Some requests are being processed. Others are waiting.
The database has become the bottleneck — the part slowing down the entire Login process.
It has reached its limit. Engineers call this saturation.
And as requests take longer to get an answer, latency — the time it takes to receive a response — increases.
The database hasn’t stopped working. It just can’t keep up.`;
const beats=[1,2,3,4,5].map(number=>({number,direction:'Approved visual action'}));

describe('EP002 Director voice cue suggestions',()=>{
  it('prefills all five SHOT01 beats from the original Director-locked narration',()=>{
    const source=scriptV5.shots.find(s=>s.shotKey==='SHOT01');
    expect(source).toBeDefined();
    expect(suggestEp002VoiceCueAnchors(
      'SHOT01',source!.englishNarration,beats)).toEqual([
      'tap Login',
      'A few seconds pass. Then ten',
      'server responsible for signing you in is still running',
      'your login is still waiting',
      'go back to nine o’clock',
    ]);
  });
  it('fails closed instead of inventing a missing SHOT01 spoken cue',()=>{
    const original=scriptV5.shots[0].englishNarration;
    const edited=original.replace('A few seconds pass. Then ten','Time passes');
    const suggestions=suggestEp002VoiceCueAnchors('SHOT01',edited,beats);
    expect(suggestions).toHaveLength(5);
    expect(suggestions[1]).toBe('');
    expect(suggestions.filter(Boolean)).toHaveLength(4);
  });
  it('fills five genuinely ordered SHOT03 anchors using unchanged current narration',()=>{
    expect(suggestEp002VoiceCueAnchors('SHOT03',shot03,beats)).toEqual([
      'five hundred',
      'six hundred and fifty new Login requests',
      'That’s the arrival rate',
      'unfinished work starts piling up',
      'bottleneck',
    ]);
  });
  it('accepts apostrophe typography but never guesses an absent phrase',()=>{
    expect(uniqueSpokenPhrase("That's the arrival rate",'That’s the arrival rate')?.text)
      .toBe("That's the arrival rate");
    expect(uniqueSpokenPhrase('The DB is busy','five hundred')).toBeNull();
  });
  it('does not suggest a phrase repeated in the script',()=>{
    expect(uniqueSpokenPhrase('Login request. Another Login request.','Login request')).toBeNull();
    const mutated=shot03+' Bottleneck is repeated; bottleneck.';
    expect(suggestEp002VoiceCueAnchors('SHOT03',mutated,beats)[4]).toBe('');
  });
  it('does not silently reorder beats when approved text was edited',()=>{
    const reordered=shot03.replace('five hundred','TEMP').replace('six hundred and fifty','five hundred')
      .replace('TEMP','six hundred and fifty');
    const resolved=suggestEp002VoiceCueAnchors('SHOT03',reordered,beats);
    expect(resolved[1]).toBe('');
  });
  it('preserves safe historical behavior for other SHOTs',()=>{
    expect(suggestEp002VoiceCueAnchors('SHOT04','On health checks, tests pass.',[
      {number:1,direction:'On `health checks`, show the two probes'},
    ])).toEqual(['health checks']);
  });
});

describe('EP002 v5 recovery HEAR-to-SEE source automation',()=>{
  it('prefills all 24 in-order unique real phrases across SHOT08–11',()=>{
    expect(visualV5.shots.map(s=>s.beats.length)).toEqual([6,7,6,5]);
    let total=0;
    for(const visual of visualV5.shots){
      const shot=scriptV5.shots.find(s=>s.shotKey===visual.shotKey);
      expect(shot).toBeDefined();
      const generated=suggestEp002VoiceCueAnchors(
        visual.shotKey,shot!.englishNarration,visual.beats);
      expect(generated).toHaveLength(visual.beats.length);
      expect(generated.every(x=>x.trim().length>=5)).toBe(true);
      for(let i=0;i<generated.length;i++){
        expect(generated[i].toLowerCase()).toBe(visual.beats[i].spokenAnchor.toLowerCase());
      }
      total+=generated.length;
    }
    expect(total).toBe(24);
  });

  it('does not reuse superseded 3-to-6 scaling spoken markers',()=>{
    expect(scriptV5.shots[7].englishNarration).not.toContain('Three Auth servers become six');
    expect(visualV5.shots[0].beats.some(b=>b.spokenAnchor.includes('become six'))).toBe(false);
    expect(scriptV5.shots[0].directorScriptRevision).toBe('v1.4');
  });
});
