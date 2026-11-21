import {describe,it,expect} from 'vitest';
import {reconcilePaidVoiceState} from './paidVoiceReconciliation';

const known=['already-saved-take'];

describe('paid voice request reconciliation is fail-closed after client disconnect',()=>{
  it('recognizes only a newly persisted Take from a COMPLETED original request',()=>{
    const result=reconcilePaidVoiceState({
      generationStatus:'COMPLETED',revision:2,
      takes:[{id:'already-saved-take',revision:1},{id:'new-take',revision:2}]
    },known);
    expect(result.resolved).toBe(true);
    expect(result.message).toContain('No second generation was sent');
  });

  it('does not clear the hold when COMPLETED has no newly stored Take',()=>{
    const result=reconcilePaidVoiceState({
      generationStatus:'COMPLETED',revision:2,
      takes:[{id:'already-saved-take',revision:1}]
    },known);
    expect(result.resolved).toBe(false);
    expect(result.message).toContain('no newly stored Take');
  });

  it('shows IN_FLIGHT as ongoing instead of inviting a new paid request',()=>{
    const result=reconcilePaidVoiceState({
      generationStatus:'IN_FLIGHT',revision:2,takes:[]
    },known);
    expect(result.resolved).toBe(false);
    expect(result.message).toContain('IN_FLIGHT');
    expect(result.message).toContain('without a paid call');
  });

  it('blocks UNCERTAIN until provider billing can be reconciled',()=>{
    const result=reconcilePaidVoiceState({
      generationStatus:'UNCERTAIN',revision:2,takes:[]
    },known);
    expect(result.resolved).toBe(false);
    expect(result.message).toContain('Verify its ElevenLabs provider and billing outcome');
  });

  it('does not assume NONE means the provider could not have charged',()=>{
    const result=reconcilePaidVoiceState({
      generationStatus:'NONE',revision:2,takes:[]
    },known);
    expect(result.resolved).toBe(false);
    expect(result.message).toContain('Do not retry');
  });

  it('does not claim an old revision Take resolves the current generation',()=>{
    const result=reconcilePaidVoiceState({
      generationStatus:'COMPLETED',revision:3,
      takes:[{id:'unknown-old-take',revision:2}]
    },known);
    expect(result.resolved).toBe(false);
  });
});
