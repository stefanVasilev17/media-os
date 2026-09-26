import type { Application } from '@splinetool/runtime';
import type { RuntimeObject } from './runtimeSceneProof';

export type RuntimeFlowStep = {
  atMs: number;
  eventName: string;
  targetName: string;
};

export type RuntimeFlowDefinition = {
  name: string;
  durationMs: number;
  steps: RuntimeFlowStep[];
};

type RuntimeLookupApplication = Application & {
  findObjectByName?: (name: string) => unknown;
};

const FLOWS: Record<string, RuntimeFlowDefinition> = {};

export function registerRuntimeFlow(flow: RuntimeFlowDefinition) {
  FLOWS[flow.name.trim().toUpperCase()] = flow;
}

export function getRuntimeFlow(name: string) {
  return FLOWS[name.trim().toUpperCase()] ?? null;
}

export function listRuntimeFlowNames() {
  return Object.keys(FLOWS);
}

export function createRuntimeFlowExecutor(app: Application) {
  const controlledApp = app as RuntimeLookupApplication;

  const resolve = (name: string) => {
    if (!name.trim() || typeof controlledApp.findObjectByName !== 'function') return null;
    return controlledApp.findObjectByName(name.trim()) as RuntimeObject | undefined ?? null;
  };

  return (flow: RuntimeFlowDefinition, elapsedMs: number, executedSteps: Set<string>) => {
    let dirty = false;
    for (let index = 0; index < flow.steps.length; index += 1) {
      const step = flow.steps[index];
      if (elapsedMs < step.atMs) continue;
      const stepKey = `${flow.name}:${index}`;
      if (executedSteps.has(stepKey)) continue;

      const target = resolve(step.targetName);
      if (!target?.uuid) {
        throw new Error(`Runtime flow “${flow.name}” target “${step.targetName}” is not available in the runtime scene.`);
      }

      app.emitEvent(step.eventName as never, target.uuid);
      executedSteps.add(stepKey);
      dirty = true;
    }
    return dirty;
  };
}
