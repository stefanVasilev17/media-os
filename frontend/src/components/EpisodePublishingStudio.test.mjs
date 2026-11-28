import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const studio=readFileSync(new URL('./EpisodePublishingStudio.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles/episodePublishingStudio.css',import.meta.url),'utf8');
const page=readFileSync(new URL('../pages/DirectorQuietEpisodePage.tsx',import.meta.url),'utf8');
describe('Publishing Studio integrated into the actual Director workspace',()=>{
  it('uses the existing package and separate Publishing tab without replacing Full Video or SHOT',()=>{
    expect(page).toContain("'SHOT'|'FULL'|'PUBLISHING'");
    expect(page).toContain("setTab('PUBLISHING')");
    expect(page).toContain('<EpisodePublishingStudio key={packageId} packageId={packageId}/>');
    expect(page).toContain('src={fullUrl}');
    expect(page).toContain('src={shotVideoUrl}');
  });
  it('uses protected server persistence, optimistic revisions and explicit approval',()=>{
    expect(studio).toContain("+'/publishing'");
    expect(studio).toContain('expectedRevision:item.revision');
    expect(studio).toContain("method:'POST'");
    expect(studio).toContain('Approve this exact saved revision');
    expect(studio).toContain("'/history'");
    expect(studio).not.toContain('localStorage');
  });
  it('keeps SRT draft and thumbnail archival separate from release approval',()=>{
    expect(studio).toContain("selected==='SUBTITLES_SRT'");
    expect(studio).toContain('Import synchronized SRT');
    expect(studio).toContain('No thumbnail image uploaded yet');
    expect(studio).toContain('readyForDirectorRelease');
    expect(studio).toContain('data.blockers.map');
    expect(studio).toContain('No action here publishes externally');
    expect(studio).toContain('Copy complete description');
  });
});

describe('Director feedback: quiet content-first publishing',()=>{
  it('shows the five practical steps in order, without a nested field menu',()=>{
    const order=['Title & thumbnail','02</span> Description','Tags & pinned comment','Captions & upload settings','Final review</h3>'];
    const positions=order.map(x=>studio.indexOf(x));
    expect(positions.every(x=>x>=0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a,b)=>a-b));
    expect(studio).not.toContain('className="publishing-nav"');
    expect(studio).toContain("useState('')");
    expect(studio).toContain('title?.value');
    expect(studio).toContain('thumbnail.thumbnailUrl');
    expect(studio).toContain('publishing-description');
    expect(studio).toContain('Copy complete description');
  });
  it('opens editing only on demand and retains all protected fields, checks and history',()=>{
    expect(studio).toContain('modal.showModal()');
    expect(studio).toContain('Discard unsaved publishing edits?');
    expect(studio).toContain('Version history');
    expect(studio).toContain('<summary>Review checklist</summary>');
    expect(studio).toContain('<summary>Technical details & master version</summary>');
    expect(studio).toContain("['DESCRIPTION','CHAPTERS','SOURCES','DISCLAIMER','HASHTAGS'].map(row)");
    expect(studio).toContain("['TRANSCRIPT','AUDIO_DIRECTION','UPLOAD_SETTINGS'].map(row)");
    expect(studio).toContain('data.readyForDirectorRelease');
  });
  it('removes the SHOT sidebar only from Publishing and keeps the existing video navigation',()=>{
    expect(page).toContain('director-publishing-body');
    expect(page).toContain('aria-label="Episode workspace"');
    expect(css).toContain('.director-publishing-body>.director-minimal-sidebar{display:none}');
    expect(css).toContain('@media(max-width:700px)');
    expect(page).toContain('src={fullUrl}');
    expect(page).toContain('src={shotVideoUrl}');
  });
});

it('uses fresh audited-session CSRF for each publishing write including multipart thumbnail',()=>{
  expect(studio).toContain("directorMutation(root+'/thumbnail',{method:'POST',body:form})");
  expect(studio).toContain("directorMutation(root+'/items/'+encodeURIComponent(selected)");
  expect(studio).toContain("form.append('expectedRevision',String(item.revision))");
  expect(studio).toContain("form.append('confirm','true')");
});

it('archives original WebP without converting or renaming its extension',()=>{
  expect(studio).toContain('accept="image/png,image/jpeg,image/webp,.webp"');
  expect(studio).toContain("type==='image/webp'?'webp'");
  expect(studio).toContain("form.append('file',file)");
  expect(studio).toContain('thumbnailExtension(thumbnail.objectType)');
  expect(studio).toContain('thumbnailExtension(item.objectType)');
});
