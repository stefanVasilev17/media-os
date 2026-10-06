export const AT_COMPONENT_REGISTRY = {
  ATBackground: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATPhone: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATSecondaryStack: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATSecondarySection: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATSemanticPill: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATActiveState: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATConnector: {version: '1.0.0', status: 'LOCKED', source: 'EP001_SHOT01'},
  ATCameraRig: {version: '0.1.0', status: 'DRAFT', source: 'EP001_SHOT02'},
  ATPrimaryNode: {version: '0.1.0', status: 'DRAFT', source: 'EP001_SHOT02'},
  ATMiniWorld: {version: '0.1.0', status: 'DRAFT', source: 'EP001_SHOT02'},
  ATConnectionPath: {version: '0.1.0', status: 'DRAFT', source: 'EP001_SHOT02'},
  ATFlowArrow: {version: '0.1.0', status: 'DRAFT', source: 'EP001_SHOT02'},
} as const;

export type ATComponentId = keyof typeof AT_COMPONENT_REGISTRY;
