import type { SPEObject } from '@splinetool/runtime';

export type RuntimeObject = SPEObject & {
  name: string;
  uuid: string;
  state?: string | number;
  text?: string;
  visible?: boolean;
  color?: string;
  type?: string;
  id?: string;
  intensity?: number;
  parent?: RuntimeObject | null;
  children?: RuntimeObject[];
  material?: {
    alpha?: number;
    layers?: Array<Record<string, unknown>>;
  };
};

export type CatalogNode = {
  name?: string;
  children?: CatalogNode[];
};

export type CloneResult = {
  sourceName: string;
  sourceUuid: string;
  cloneName: string;
  cloneUuid: string;
  createdObjectCount: number;
  createdNames: string[];
  sourceEventRefs: number;
  cloneEventRefs: number;
  sourceUnchanged: boolean;
  freshRootId: boolean;
  cloneDurationMs: number;
  position: { x: number; y: number; z: number };
};

export type StateCandidate = {
  uuid: string;
  name: string;
  originalState: string | number | undefined;
  discoveredStates: Array<string | number>;
};

export type StateProbeResult = {
  candidates: StateCandidate[];
  changedProductionVisualObjects: number;
  durationMs: number;
};

export type StateBehaviorResult = {
  targetName: string;
  targetUuid: string;
  targetState: string | number;
  changedCloneVisualObjects: number;
  changedProductionVisualObjects: number;
  stateAccepted: boolean;
  durationMs: number;
};

export type RuntimeCapabilitySummary = {
  transform: number;
  visibility: number;
  stateCurrentExposed: number;
  color: number;
  runtimeText: number;
  material: number;
  authoredEventReferencedObjects: number;
  uniqueNames: number;
  duplicateNameCount: number;
  runtimeDeepCloneAvailable: true;
  runtimeVariablesAvailable: true;
};

export function countOccurrences(value: string, needle: string) {
  if (!needle) return 0;
  return value.split(needle).length - 1;
}

export function numberValue(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rounded(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value * 1000) / 1000
    : null;
}

function vectorSnapshot(value: unknown) {
  const vector = value as { x?: number; y?: number; z?: number } | null | undefined;
  if (!vector) return null;
  return [rounded(vector.x), rounded(vector.y), rounded(vector.z)];
}

function serializableMaterialValue(value: unknown): unknown {
  if (value == null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return rounded(value);

  if (Array.isArray(value)) {
    if (value.length > 64) return undefined;
    const items = value.map(item => serializableMaterialValue(item));
    return items.some(item => item === undefined) ? undefined : items;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const simpleKeys = ['r', 'g', 'b', 'x', 'y', 'z'];
    const keys = Object.keys(record);
    if (keys.length > 0 && keys.every(key => simpleKeys.includes(key))) {
      const result: Record<string, unknown> = {};
      for (const key of keys) {
        const serialized = serializableMaterialValue(record[key]);
        if (serialized !== undefined) result[key] = serialized;
      }
      return result;
    }
  }

  return undefined;
}

function materialSnapshot(object: RuntimeObject) {
  const material = object.material;
  if (!material) return null;

  const layers = Array.isArray(material.layers)
    ? material.layers.map(layer => {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(layer ?? {})) {
          if (typeof value === 'function' || key === 'texture') continue;
          const serialized = serializableMaterialValue(value);
          if (serialized !== undefined) result[key] = serialized;
        }
        return result;
      })
    : [];

  return {
    alpha: rounded(material.alpha),
    layers
  };
}

export function runtimeObjectSnapshot(object: RuntimeObject, eventDump: string) {
  return {
    uuid: object.uuid,
    id: object.id ?? object.uuid,
    name: object.name,
    type: object.type ?? null,
    parentUuid: object.parent?.uuid ?? null,
    childUuids: Array.isArray(object.children) ? object.children.map(child => child.uuid) : [],
    position: vectorSnapshot(object.position),
    rotation: vectorSnapshot(object.rotation),
    scale: vectorSnapshot(object.scale),
    visible: typeof object.visible === 'boolean' ? object.visible : null,
    currentState: object.state ?? null,
    color: typeof object.color === 'string' ? object.color : null,
    intensity: rounded(object.intensity),
    runtimeText: typeof object.text === 'string' ? object.text : null,
    material: materialSnapshot(object),
    authoredEventRefCount: countOccurrences(eventDump, object.uuid),
    capabilities: {
      transform: Boolean(object.position && object.rotation && object.scale),
      visibility: typeof object.visible === 'boolean',
      stateCurrentExposed: object.state !== undefined,
      color: typeof object.color === 'string',
      runtimeText: typeof object.text === 'string',
      material: Boolean(object.material)
    }
  };
}

export function buildCapabilitySummary(
  objects: RuntimeObject[],
  eventDump: string
): RuntimeCapabilitySummary {
  const names = new Map<string, number>();
  let transform = 0;
  let visibility = 0;
  let stateCurrentExposed = 0;
  let color = 0;
  let runtimeText = 0;
  let material = 0;
  let authoredEventReferencedObjects = 0;

  for (const object of objects) {
    names.set(object.name, (names.get(object.name) ?? 0) + 1);
    if (object.position && object.rotation && object.scale) transform += 1;
    if (typeof object.visible === 'boolean') visibility += 1;
    if (object.state !== undefined) stateCurrentExposed += 1;
    if (typeof object.color === 'string') color += 1;
    if (typeof object.text === 'string') runtimeText += 1;
    if (object.material) material += 1;
    if (countOccurrences(eventDump, object.uuid) > 0) authoredEventReferencedObjects += 1;
  }

  return {
    transform,
    visibility,
    stateCurrentExposed,
    color,
    runtimeText,
    material,
    authoredEventReferencedObjects,
    uniqueNames: names.size,
    duplicateNameCount: [...names.values()].filter(count => count > 1).length,
    runtimeDeepCloneAvailable: true,
    runtimeVariablesAvailable: true
  };
}

export function fullFingerprint(object: RuntimeObject) {
  return JSON.stringify({
    uuid: object.uuid,
    name: object.name,
    state: object.state ?? null,
    visible: object.visible ?? null,
    text: typeof object.text === 'string' ? object.text : null,
    color: object.color ?? null,
    intensity: rounded(object.intensity),
    position: vectorSnapshot(object.position),
    rotation: vectorSnapshot(object.rotation),
    scale: vectorSnapshot(object.scale),
    material: materialSnapshot(object)
  });
}

export function visualFingerprint(object: RuntimeObject) {
  return JSON.stringify({
    visible: object.visible ?? null,
    text: typeof object.text === 'string' ? object.text : null,
    color: object.color ?? null,
    intensity: rounded(object.intensity),
    position: vectorSnapshot(object.position),
    rotation: vectorSnapshot(object.rotation),
    scale: vectorSnapshot(object.scale),
    material: materialSnapshot(object)
  });
}

export function snapshotVisualObjects(objects: RuntimeObject[]) {
  return new Map(objects.map(object => [object.uuid, visualFingerprint(object)]));
}

export function countVisualChanges(objects: RuntimeObject[], before: Map<string, string>) {
  return objects.reduce(
    (count, object) => count + (before.get(object.uuid) !== visualFingerprint(object) ? 1 : 0),
    0
  );
}

export function discoverNumericStates(
  clonedObjects: RuntimeObject[],
  productionObjects: RuntimeObject[],
  maxStateIndex = 8
): StateProbeResult {
  const productionBefore = snapshotVisualObjects(productionObjects);
  const startedAt = performance.now();
  const candidates: StateCandidate[] = [];

  for (const object of clonedObjects) {
    if (object.state === undefined) continue;

    const originalState = object.state;
    const discoveredStates: Array<string | number> = [];
    let consecutiveMisses = 0;

    for (let index = 0; index <= maxStateIndex; index += 1) {
      if (String(index) === String(originalState)) continue;

      try {
        object.state = index;
        const current = object.state;
        const accepted = current !== undefined && String(current) === String(index);

        if (accepted) {
          discoveredStates.push(current);
          consecutiveMisses = 0;
        } else {
          consecutiveMisses += 1;
        }

        if (consecutiveMisses >= 2 && discoveredStates.length > 0) break;
      } catch {
        break;
      }
    }

    try {
      object.state = originalState;
    } catch {
      // Runtime clones are transient; a scene reload remains the hard reset boundary.
    }

    if (discoveredStates.length > 0) {
      candidates.push({
        uuid: object.uuid,
        name: object.name || '(unnamed object)',
        originalState,
        discoveredStates
      });
    }
  }

  return {
    candidates,
    changedProductionVisualObjects: countVisualChanges(productionObjects, productionBefore),
    durationMs: performance.now() - startedAt
  };
}

export function collectCatalogNames(nodes: CatalogNode[] | undefined, names: Set<string>) {
  for (const node of nodes ?? []) {
    if (node.name?.trim()) names.add(node.name.trim());
    collectCatalogNames(node.children, names);
  }
}

export async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}
