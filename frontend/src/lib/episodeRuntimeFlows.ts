import type { Application } from '@splinetool/runtime';
import type { RuntimeObject } from './runtimeSceneProof';

export type RuntimeFlowStep = {
  atMs: number;
  eventName?: string;
  targetNames?: string[];
  targetTokens?: string[];
  excludedTokens?: string[];
};

export type RuntimeFlowDefinition = {
  name: string;
  durationMs: number;
  steps: RuntimeFlowStep[];
};

type RuntimeLookupApplication = Application & {
  findObjectByName?: (name: string) => unknown;
  getAllObjects?: () => unknown[];
  getSplineEvents?: () => unknown;
};

const FLOWS: Record<string, RuntimeFlowDefinition> = {
  EP001_LOGIN_FLOW: {
    name: 'EP001_LOGIN_FLOW',
    durationMs: 7600,
    steps: [
      {
        atMs: 0,
        eventName: 'mouseDown',
        targetNames: [
          'LOGIN_SUBMIT',
          'Login Submit',
          'Submit',
          'LOGIN',
          'PHONE_DEVICE'
        ],
        targetTokens: ['login', 'submit'],
        excludedTokens: ['text', 'label', 'icon', 'body', 'border']
      }
    ]
  }
};

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function objectParentText(object: RuntimeObject) {
  const names: string[] = [];
  let parent = object.parent ?? null;
  let depth = 0;
  const visited = new Set<string>();

  while (parent && depth < 5 && !visited.has(parent.uuid)) {
    visited.add(parent.uuid);
    if (parent.name?.trim()) names.push(parent.name);
    parent = parent.parent ?? null;
    depth += 1;
  }

  return normalize(names.join(' '));
}

function scoreTarget(object: RuntimeObject, step: RuntimeFlowStep, eventDump: string) {
  const name = normalize(object.name ?? '');
  if (!name) return Number.NEGATIVE_INFINITY;

  const parents = objectParentText(object);
  const combined = `${name} ${parents}`.trim();
  const candidates = (step.targetNames ?? []).map(normalize).filter(Boolean);
  const tokens = (step.targetTokens ?? []).map(normalize).filter(Boolean);
  const excluded = (step.excludedTokens ?? []).map(normalize).filter(Boolean);
  const eventReferenced = Boolean(object.uuid && eventDump.includes(object.uuid));

  let score = eventReferenced ? 12 : 0;
  if (candidates.includes(name)) score += 40;

  for (const candidate of candidates) {
    if (candidate && name.includes(candidate)) score += 18;
  }

  for (const token of tokens) {
    if (name.includes(token)) score += 12;
    else if (parents.includes(token)) score += 5;
  }

  for (const token of excluded) {
    if (combined.includes(token)) score -= 15;
  }

  if (name.startsWith('cam ') || name.startsWith('cam_')) score -= 30;
  return score;
}

function runtimeObjects(app: RuntimeLookupApplication) {
  if (typeof app.getAllObjects !== 'function') return [];
  try {
    return (app.getAllObjects() as RuntimeObject[]).filter(object => Boolean(object?.uuid));
  } catch {
    return [];
  }
}

function runtimeEventDump(app: RuntimeLookupApplication) {
  if (typeof app.getSplineEvents !== 'function') return '';
  try {
    return JSON.stringify(app.getSplineEvents() ?? {});
  } catch {
    return '';
  }
}

function resolveFlowTarget(app: RuntimeLookupApplication, step: RuntimeFlowStep) {
  const eventDump = runtimeEventDump(app);
  const objects = runtimeObjects(app);

  const exactEventTargets = (step.targetNames ?? [])
    .flatMap(name => {
      if (!name.trim() || typeof app.findObjectByName !== 'function') return [];
      const object = app.findObjectByName(name.trim()) as RuntimeObject | undefined;
      return object ? [object] : [];
    })
    .filter(object => !eventDump || eventDump.includes(object.uuid));

  if (exactEventTargets.length > 0) return exactEventTargets[0];

  const ranked = objects
    .map(object => ({ object, score: scoreTarget(object, step, eventDump) }))
    .filter(entry => Number.isFinite(entry.score) && entry.score >= 12)
    .sort((left, right) => right.score - left.score || left.object.name.localeCompare(right.object.name));

  if (ranked.length > 0) return ranked[0].object;

  for (const name of step.targetNames ?? []) {
    if (!name.trim() || typeof app.findObjectByName !== 'function') continue;
    const object = app.findObjectByName(name.trim()) as RuntimeObject | undefined;
    if (object) return object;
  }

  return null;
}

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

  return (
    flow: RuntimeFlowDefinition,
    elapsedMs: number,
    executedSteps: Set<string>,
    executionKey = flow.name
  ) => {
    let dirty = false;

    for (let index = 0; index < flow.steps.length; index += 1) {
      const step = flow.steps[index];
      if (elapsedMs < step.atMs) continue;

      const stepKey = `${executionKey}:${index}`;
      if (executedSteps.has(stepKey)) continue;

      if (step.eventName) {
        const target = resolveFlowTarget(controlledApp, step);
        if (!target?.uuid) {
          const hints = [...(step.targetNames ?? []), ...(step.targetTokens ?? [])].join(', ');
          throw new Error(`Runtime flow “${flow.name}” could not resolve its ${step.eventName} target${hints ? ` (${hints})` : ''}.`);
        }

        app.emitEvent(step.eventName as never, target.uuid);
        dirty = true;
      }

      executedSteps.add(stepKey);
    }

    return dirty;
  };
}
