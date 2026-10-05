export const AT_COMPONENT_REGISTRY = {
  ATBackground: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATPhone: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATSecondaryStack: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATSecondarySection: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATSemanticPill: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATActiveState: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATConnector: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
} as const;

export type ATComponentId = keyof typeof AT_COMPONENT_REGISTRY;
