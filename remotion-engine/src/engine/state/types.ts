export type AttentionState =
  | 'HIDDEN'
  | 'DIM'
  | 'QUIET'
  | 'ACTIVE'
  | 'FOCUS'
  | 'RESOLVED';

export type OperationalState =
  | 'IDLE'
  | 'READY'
  | 'IN_FLIGHT'
  | 'WAITING'
  | 'SLOW'
  | 'SUCCESS'
  | 'FAILED'
  | 'BLOCKED'
  | 'RESTORING';

export type VisualState = {
  opacity: number;
  emissiveIntensity: number;
  accentIntensity: number;
  motionScale: number;
  semanticColor?: string;
};
