import {describe,it,expect} from 'vitest';
import {matchesApprovedRenderTarget,approvedRenderReceipt}
  from './ep004RenderTargetPolicy';

describe('EP004 Director render target must never silently switch SHOT',()=>{
  const approved={shotKey:'SHOT03',selectedTakeId:'take-shot03'};
  const ready={episodeKey:'EP004',shotKey:'SHOT03',selectedTakeId:'take-shot03'};
  it('accepts only the matching selected SHOT03 and current approved Take',()=>{
    expect(matchesApprovedRenderTarget('EP004','SHOT03',approved,ready)).toBe(true);
  });
  it('rejects a SHOT01 panel with the SHOT03 readiness or stale selected Take',()=>{
    expect(matchesApprovedRenderTarget('EP004','SHOT01',approved,ready)).toBe(false);
    expect(matchesApprovedRenderTarget('EP004','SHOT03',
      {...approved,selectedTakeId:'stale'},ready)).toBe(false);
  });
  it('rejects missing, unauthenticated or mismatched episode context',()=>{
    expect(matchesApprovedRenderTarget('EP004','SHOT03',null,ready)).toBe(false);
    expect(matchesApprovedRenderTarget('EP004','SHOT03',approved,null)).toBe(false);
    expect(matchesApprovedRenderTarget('EP003','SHOT03',approved,ready)).toBe(false);
    expect(matchesApprovedRenderTarget('EP004','SHOT03',approved,
      {...ready,episodeKey:'EP003'})).toBe(false);
  });
});

describe('EP004 render response cannot falsely claim that a new render started',()=>{
  it('reports real QUEUED/RENDERING state only when the backend says so',()=>{
    expect(approvedRenderReceipt('SHOT03','QUEUED')).toContain('QUEUED');
    expect(approvedRenderReceipt('SHOT03','RENDERING')).toContain('RENDERING');
  });
  it('states explicitly that READY reuses a completed candidate',()=>{
    const receipt=approvedRenderReceipt('SHOT01','READY');
    expect(receipt).toContain('existing completed SHOT01');
    expect(receipt).toContain('No new render entered the queue');
    expect(receipt).not.toContain('QUEUED');
  });
  it('does not label an unknown status as queued or successful',()=>{
    const receipt=approvedRenderReceipt('SHOT03','ERROR');
    expect(receipt).toContain('Inspect this render status');
    expect(receipt).not.toContain('QUEUED');
  });
});
