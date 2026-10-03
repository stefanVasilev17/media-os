import type {AttentionState, OperationalState} from '../state/types';
import type {PathVisualState} from '../paths/ConnectionPath';

export type NodeRuntimeState = {
  attention: AttentionState;
  operational: OperationalState;
};

export type SliceRuntimeState = {
  authService: NodeRuntimeState;
  userDatabase: NodeRuntimeState;
  dependencyPath: PathVisualState;
  showResponse: boolean;
  responseProgress: number;
  responseOpacity: number;
  showLookup: boolean;
  lookupProgress: number;
  lookupOpacity: number;
  phoneVisible: boolean;
  phoneWaiting: boolean;
  phoneReveal: number;
  timeBudget: number;
};

export type SemanticAnchorDefinition = {
  id: string;
  provisionalFrame: number;
  phrase: string;
};

export type ShotSpec = {
  id: string;
  name: string;
  startAnchor: string;
  endAnchor: string;
  semanticAnchors: SemanticAnchorDefinition[];
  reelSafe: boolean;
};
