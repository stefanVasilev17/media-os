import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {publicationDescription} from '../lib/distributionPublication';
const studio=readFileSync(new URL('./EpisodeDistributionStudio.tsx',import.meta.url),'utf8');
const page=readFileSync(new URL('../pages/DirectorQuietEpisodePage.tsx',import.meta.url),'utf8');
describe('Distribution Studio',()=>{
  it('shows every actual publication inline as platform, title, description and full text',()=>{
    expect(page).toContain('<EpisodeDistributionStudio key={packageId} packageId={packageId}/>');
    expect(page).toContain("setTab('DISTRIBUTION')");
    const reader=studio.slice(studio.indexOf('<div className="distribution-publications"'),studio.indexOf('    </>}\n    <dialog'));
    expect(reader).toContain('[...articles,...posts].map');
    const order=['distribution-publication-platform','>Title</span>','>Description</span>','>Text</span>','{i.body}'];
    const offsets=order.map(x=>reader.indexOf(x));
    expect(offsets.every(x=>x>=0)).toBe(true);
    expect(offsets).toEqual([...offsets].sort((a,b)=>a-b));
    expect(reader).not.toContain('research.map');
    expect(reader).not.toContain('onClick={()=>open(i)}');
    expect(reader).not.toContain('slice(0,');
  });
  it('keeps management closed by default, with existing workflow and safety gates',()=>{
    expect(studio).toContain('<details className="distribution-management">');
    expect(studio).toContain('Launch calendar');
    expect(studio).toContain('Zero-Follower strategy');
    expect(studio).toContain('expectedRevision:selected.revision');
    expect(studio).toContain('Nothing is sent to the platform');
    expect(studio).toContain('Human original authorship required');
    expect(studio).toContain('Research only');
    expect(studio).toContain('Public URL pending');
    expect(studio).toContain('showModal()');
    expect(studio).not.toContain('localStorage');
  });
  it('uses the existing subtitle or explicit description without modifying text',()=>{
    expect(publicationDescription("Draft developed with AI assistance; author review.\n\nSubtitle: Real subtitle.\n\nFull text.")).toBe('Real subtitle.');
    expect(publicationDescription("Description: Saved description.\n\nFull text.")).toBe('Saved description.');
  });
  it('falls back to the existing opening paragraph and never invents descriptions',()=>{
    expect(publicationDescription("This educational draft was created with AI assistance. Review it.\n\nOpening paragraph.\n\n## Heading\n\nMore text.")).toBe('Opening paragraph.');
    expect(publicationDescription("Opening paragraph.\n\nMore text.")).toBe('Opening paragraph.');
    expect(publicationDescription("")).toBe('');
  });
});
