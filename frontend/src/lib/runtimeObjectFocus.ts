import type { RuntimeObject } from './runtimeSceneProof';

type Vector3Like = {
  x?: number;
  y?: number;
  z?: number;
};

export type RuntimeFocusPoint = {
  x: number;
  y: number;
  z: number;
};

function rotateXYZ(point: RuntimeFocusPoint, rotation: Vector3Like | null | undefined): RuntimeFocusPoint {
  const rx = Number(rotation?.x) || 0;
  const ry = Number(rotation?.y) || 0;
  const rz = Number(rotation?.z) || 0;

  let x = point.x;
  let y = point.y;
  let z = point.z;

  if (rx !== 0) {
    const cos = Math.cos(rx);
    const sin = Math.sin(rx);
    const nextY = y * cos - z * sin;
    const nextZ = y * sin + z * cos;
    y = nextY;
    z = nextZ;
  }

  if (ry !== 0) {
    const cos = Math.cos(ry);
    const sin = Math.sin(ry);
    const nextX = x * cos + z * sin;
    const nextZ = -x * sin + z * cos;
    x = nextX;
    z = nextZ;
  }

  if (rz !== 0) {
    const cos = Math.cos(rz);
    const sin = Math.sin(rz);
    const nextX = x * cos - y * sin;
    const nextY = x * sin + y * cos;
    x = nextX;
    y = nextY;
  }

  return { x, y, z };
}

export function runtimeWorldPosition(object: RuntimeObject): RuntimeFocusPoint {
  const nativeObject = object as RuntimeObject & {
    getWorldPosition?: (target: { x: number; y: number; z: number }) => { x: number; y: number; z: number };
    updateWorldMatrix?: (updateParents: boolean, updateChildren: boolean) => void;
    updateMatrixWorld?: (force?: boolean) => void;
  };
  const nativePosition = object.position as unknown as {
    x: number;
    y: number;
    z: number;
    clone?: () => { x: number; y: number; z: number };
  };

  if (typeof nativeObject.getWorldPosition === 'function' && typeof nativePosition?.clone === 'function') {
    try {
      nativeObject.updateWorldMatrix?.(true, false);
      nativeObject.updateMatrixWorld?.(true);
      const target = nativePosition.clone();
      const world = nativeObject.getWorldPosition(target) ?? target;
      if (
        Number.isFinite(Number(world.x)) &&
        Number.isFinite(Number(world.y)) &&
        Number.isFinite(Number(world.z))
      ) {
        return {
          x: Number(world.x),
          y: Number(world.y),
          z: Number(world.z)
        };
      }
    } catch {
      void 0;
    }
  }

  let point: RuntimeFocusPoint = {
    x: Number(object.position?.x) || 0,
    y: Number(object.position?.y) || 0,
    z: Number(object.position?.z) || 0
  };

  let parent = object.parent ?? null;
  let depth = 0;
  const visited = new Set<string>();

  while (parent && depth < 64 && !visited.has(parent.uuid)) {
    visited.add(parent.uuid);

    const scale = parent.scale as Vector3Like | undefined;
    point = {
      x: point.x * (Number(scale?.x) || 1),
      y: point.y * (Number(scale?.y) || 1),
      z: point.z * (Number(scale?.z) || 1)
    };

    point = rotateXYZ(point, parent.rotation as Vector3Like | undefined);
    point = {
      x: point.x + (Number(parent.position?.x) || 0),
      y: point.y + (Number(parent.position?.y) || 0),
      z: point.z + (Number(parent.position?.z) || 0)
    };

    parent = parent.parent ?? null;
    depth += 1;
  }

  return point;
}

export function runtimeVisualCenter(object: RuntimeObject): RuntimeFocusPoint {
  const points: RuntimeFocusPoint[] = [];
  const visited = new Set<string>();

  function visit(node: RuntimeObject, depth: number) {
    if (depth > 16 || visited.has(node.uuid)) return;
    visited.add(node.uuid);

    const children = Array.isArray(node.children)
      ? node.children.filter(child => child && child.position && child.visible !== false)
      : [];

    if (children.length === 0) {
      points.push(runtimeWorldPosition(node));
      return;
    }

    children.forEach(child => visit(child, depth + 1));
  }

  visit(object, 0);
  if (points.length === 0) return runtimeWorldPosition(object);

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  let minZ = points[0].z;
  let maxZ = points[0].z;

  for (const point of points.slice(1)) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
    minZ = Math.min(minZ, point.z);
    maxZ = Math.max(maxZ, point.z);
  }

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    z: (minZ + maxZ) / 2
  };
}
