import {Vector3, type Camera} from 'three';

export const projectWorldToScreen = (
  point: readonly [number, number, number],
  camera: Camera,
  width: number,
  height: number,
) => {
  const projected = new Vector3(...point).project(camera);
  return {
    x: (projected.x * 0.5 + 0.5) * width,
    y: (-projected.y * 0.5 + 0.5) * height,
  };
};
