export type BeatDirection = {number:number;direction:string};

type PhraseMatch = {text:string;start:number;end:number};

function tokens(input:string):Array<{value:string;start:number;end:number}> {
  return [...input.matchAll(/[a-z0-9]+/gi)].map(match=>({
    value:match[0].toLowerCase(),
    start:match.index,
    end:match.index+match[0].length,
  }));
}

export function uniqueSpokenPhrase(narration:string,phrase:string):PhraseMatch|null {
  const source=tokens(narration);
  const needle=tokens(phrase);
  if(needle.length===0||source.length<needle.length)return null;
  let found:PhraseMatch|null=null;
  for(let index=0;index<=source.length-needle.length;index++){
    if(!needle.every((word,offset)=>source[index+offset].value===word.value))continue;
    if(found)return null;
    const start=source[index].start;
    const end=source[index+needle.length-1].end;
    found={text:narration.slice(start,end),start,end};
  }
  return found;
}

const SHOT05_CUE_PHRASES=[
  ['database connection pool'],
  ['up to eight'],
  ['replay the last few moments'],
  ['connection pool exhaustion'],
  ['in-flight requests'],
] as const;

const SHOT03_CUE_PHRASES=[
  ['five hundred'],
  ['six hundred and fifty new Login requests','six hundred and fifty'],
  ["That's the arrival rate",'arrival rate'],
  ['unfinished work starts piling up'],
  ['bottleneck'],
] as const;

function fromDirection(direction:string):string[] {
  const match=direction.match(/(?:At|On|on)\s+[`“"]([^`”"]+)[`”"]/);
  return match?.[1]?.trim()?[match[1].trim()]:[];
}

/** Draft suggestions from the current saved narration; never timestamps or Director approval. */
export function suggestEp002VoiceCueAnchors(
  shotKey:string,narration:string,beats:BeatDirection[],
):string[] {
  let previousEnd=-1;
  return beats.map((beat,index)=>{
    const options=shotKey==='SHOT05'&&beats.length===5
      ? [...SHOT05_CUE_PHRASES[index]]
      :shotKey==='SHOT03'&&beats.length===5
        ? [...SHOT03_CUE_PHRASES[index]] : fromDirection(beat.direction);
    for(const phrase of options){
      const found=uniqueSpokenPhrase(narration,phrase);
      if(found&&found.start>previousEnd){
        previousEnd=found.end;
        return found.text;
      }
    }
    return '';
  });
}
