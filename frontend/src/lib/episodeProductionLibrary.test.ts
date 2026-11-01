import {describe,expect,it} from 'vitest';
import {ep001,ep002,renderVideoUrl} from './episodeProductionLibrary';

describe('read-only production source library', () => {
  it('preserves the later EP001 twelve-shot Director cut and distinct historical contract', () => {
    expect(ep001.approvedShotCount).toBe(12);
    expect(ep001.renderReferences).toHaveLength(4);
    expect(ep001.renderReferences[3].renderId).toBe('5d8c7db2-b34e-4781-af1a-2aa236691ea5');
    expect(ep001.finalReviewRenderId).toBe('08fbfdb5-58a8-40bf-b7ed-cc33742750fe');
    expect(ep001.scope).toContain('failure paths belong to EP002');
    expect(ep001.historicalNotice).toContain('16-shot');
  });

  it('shows eleven unmodified creative-LOCKED EP002 narration shots', () => {
    expect(ep002.shots).toHaveLength(11);
    expect(ep002.shots.map(shot=>shot.shotKey)).toEqual(
      Array.from({length:11},(_,i)=>'SHOT'+String(i+1).padStart(2,'0'))
    );
    expect(ep002.shots.every(shot=>shot.scriptStatus==='DIRECTOR_LOCKED')).toBe(true);
    expect(ep002.shots.reduce((n,shot)=>n+shot.wordCount,0)).toBe(1948);
    expect(ep002.shots.every(shot=>shot.englishNarration.length>30)).toBe(true);
    expect(ep002.shots.every(shot=>shot.audioStatus==='NOT_GENERATED')).toBe(true);
  });

  it('binds eleven visual shot plans to the approved new visual pass without inventing native locks', () => {
    const plan=ep002.visualPlan;
    const shots=plan.shots as Array<{shotKey:string;visualPlanMarkdown:string}>;
    expect(shots).toHaveLength(11);
    expect(plan.visualBeatCount).toBe(59);
    expect(plan.nativeMediaOsStageStatus).toBe('READY_FOR_REVIEW_ONLY');
    expect(plan.containsOriginalMissingV4Choreography).toBe(false);
    for(let i=0;i<shots.length;i++){
      expect(shots[i].shotKey).toBe(ep002.shots[i].shotKey);
      expect(shots[i].visualPlanMarkdown).toContain('**Camera:**');
      expect(shots[i].visualPlanMarkdown).toContain('**Truth/continuity:**');
    }
  });

  it('uses existing media URLs only, without creating new render requests', () => {
    expect(renderVideoUrl(ep001.finalReviewRenderId)).toBe(
      '/api/v1/remotion/renders/08fbfdb5-58a8-40bf-b7ed-cc33742750fe/video'
    );
  });
});
