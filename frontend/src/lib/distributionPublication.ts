// A display-only description. The stored full text is never rewritten.
export function publicationDescription(body:string):string{
  const paragraphs=body.trim().split(/\r?\n\s*\r?\n/).map(p=>p.trim()).filter(Boolean);
  const explicit=paragraphs.slice(0,4).find(p=>/^(?:Subtitle|Description):\s*\S/i.test(p));
  if(explicit)return explicit.replace(/^(?:Subtitle|Description):\s*/i,'').trim();
  return paragraphs.find(p=>!/^#{1,6}\s/.test(p)&&
    !/^(?:Draft developed with AI assistance;|This educational draft was created with AI assistance\.|Draft prepared with AI assistance;)/i.test(p))??'';
}

export function publicationColumns(width:number):number{
  return width>=1000?4:width>=740?3:width>=480?2:1;
}
export function publicationPage<T>(items:readonly T[],page:number,columns:number){
  const size=columns*2;
  const count=Math.max(1,Math.ceil(items.length/size));
  const index=Math.max(0,Math.min(page,count-1));
  return {index,count,items:items.slice(index*size,(index+1)*size)};
}
