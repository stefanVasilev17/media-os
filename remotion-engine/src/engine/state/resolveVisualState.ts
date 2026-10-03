import {COLORS} from '../../design-system/tokens';
import type {AttentionState, OperationalState, VisualState} from './types';

const attentionOpacity: Record<AttentionState, number> = {
  HIDDEN: 0,
  DIM: 0.22,
  QUIET: 0.48,
  ACTIVE: 0.82,
  FOCUS: 1,
  RESOLVED: 0.62,
};

const attentionIntensity: Record<AttentionState, number> = {
  HIDDEN: 0,
  DIM: 0.08,
  QUIET: 0.18,
  ACTIVE: 0.55,
  FOCUS: 0.95,
  RESOLVED: 0.25,
};

export const resolveVisualState = (
  attention: AttentionState,
  operational: OperationalState,
): VisualState => {
  const base: VisualState = {
    opacity: attentionOpacity[attention],
    emissiveIntensity: attentionIntensity[attention],
    accentIntensity: attentionIntensity[attention],
    motionScale: 1,
  };

  if (operational === 'WAITING') {
    return {...base, motionScale: 0.22, semanticColor: COLORS.waiting};
  }
  if (operational === 'SLOW') {
    return {...base, motionScale: 0.12, semanticColor: COLORS.waiting};
  }
  if (operational === 'SUCCESS') {
    return {...base, semanticColor: COLORS.success};
  }
  if (operational === 'FAILED' || operational === 'BLOCKED') {
    return {...base, motionScale: 0, semanticColor: COLORS.failure};
  }

  return base;
};
