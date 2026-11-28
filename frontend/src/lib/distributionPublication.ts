// A display-only description. The stored full text is never rewritten.
export function publicationDescription(body:string):string{
  const paragraphs=body.trim().split(/\r?\n\s*\r?\n/).map(p=>p.trim()).filter(Boolean);
  const explicit=paragraphs.slice(0,4).find(p=>/^(?:Subtitle|Description):\s*\S/i.test(p));
  if(explicit)return explicit.replace(/^(?:Subtitle|Description):\s*/i,'').trim();
  return paragraphs.find(p=>!/^#{1,6}\s/.test(p)&&
    !/^(?:Draft developed with AI assistance;|This educational draft was created with AI assistance\.|Draft prepared with AI assistance;)/i.test(p))??'';
}
