import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {publicationDescription,publicationColumns,publicationPage} from '../lib/distributionPublication';
const studio=readFileSync(new URL('./EpisodeDistributionStudio.tsx',import.meta.url),'utf8');
const page=readFileSync(new URL('../pages/DirectorQuietEpisodePage.tsx',import.meta.url),'utf8');
describe('Distribution Studio',()=>{
  it('shows compact product-like publication cards and opens one complete reader',()=>{
    expect(page).toContain('<EpisodeDistributionStudio key={packageId} packageId={packageId}/>');
    expect(page).toContain("setTab('DISTRIBUTION')");
    const cards=studio.slice(studio.indexOf('<div className="distribution-publications"'),studio.indexOf('    </>}\n    <dialog'));
    expect(studio).toContain('const publications=[...articles,...posts]');
    expect(cards).toContain('visible.items.map');
    expect(cards).toContain('onClick={()=>readPublication(i.id)}');
    expect(cards).toContain('i.title');
    expect(cards).toContain('publicationDescription(i.body)');
    expect(cards).not.toContain('{i.body}');
    expect(cards).not.toContain('research.map');
    const reader=studio.slice(studio.indexOf('<dialog ref={readerDialog}'),studio.indexOf('<dialog ref={dialog}'));
    const order=['distribution-publication-platform','>Title</span>','>Description</span>','>Text</span>','{reader.body}'];
    const offsets=order.map(x=>reader.indexOf(x));
    expect(offsets.every(x=>x>=0)).toBe(true);
    expect(offsets).toEqual([...offsets].sort((a,b)=>a-b));
    expect(reader).toContain('copy(exportText(reader))');
    expect(reader).toContain('onClick={closeReader}');
    expect(reader).not.toContain('Review & publication status');
    expect(studio).toContain('aria-label="Publication pages"');
    const css=readFileSync(new URL('../styles/episodeDistributionStudio.css',import.meta.url),'utf8');
    expect(css).toContain('.distribution-publications{display:grid;');
    expect(css).toContain('max-height:85dvh;overflow-y:auto');
  });
  it('limits the catalog to two rows and makes every publication reachable by pagination',()=>{
    expect([320,480,740,1000].map(publicationColumns)).toEqual([1,2,3,4]);
    const items=Array.from({length:17},(_,i)=>i);
    for(const columns of [1,2,3,4]){
      const first=publicationPage(items,0,columns);
      expect(first.items.length).toBe(columns*2);
      const all=Array.from({length:first.count},(_,i)=>publicationPage(items,i,columns).items).flat();
      expect(all).toEqual(items);
      expect(publicationPage(items,999,columns).index).toBe(first.count-1);
    }
    expect(publicationPage([],2,4)).toEqual({index:0,count:1,items:[]});
    expect(publicationPage(items,0,4).items.length).toBe(8);
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
