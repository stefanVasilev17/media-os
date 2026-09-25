import { Application } from '@splinetool/runtime';

const CAMERA_NAME = 'MEDIA_OS_CAMERA';
const CAMERA_X = 'MEDIA_OS_CAM_X';
const CAMERA_Y = 'MEDIA_OS_CAM_Y';
const CAMERA_Z = 'MEDIA_OS_CAM_Z';
const VIRTUAL_CAMERA_UUID = 'MEDIA_OS_VARIABLE_CAMERA';

type VariableValue = string | number | boolean;
type RuntimeObjectLike = {
  uuid?: string;
  name?: string;
  parent?: unknown;
  position?: { x: number; y: number; z: number };
  visible?: boolean;
};

type RuntimeApplicationLike = {
  getAllObjects: () => RuntimeObjectLike[];
  getVariables?: () => Record<string, VariableValue>;
  getVariable?: (name: string) => VariableValue | undefined;
  setVariable?: (name: string, value: VariableValue) => void;
};

type RuntimePrototype = {
  getAllObjects: (this: RuntimeApplicationLike) => RuntimeObjectLike[];
  __mediaOsVariableCameraPatched?: boolean;
};

function hasOwn(record: Record<string, VariableValue>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function readNumber(app: RuntimeApplicationLike, variables: Record<string, VariableValue>, name: string, fallback = 0) {
  const raw = app.getVariable?.(name) ?? variables[name];
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function installVariableBackedCameraBridge() {
  const prototype = Application.prototype as unknown as RuntimePrototype;
  if (prototype.__mediaOsVariableCameraPatched) return;

  const originalGetAllObjects = prototype.getAllObjects;
  prototype.getAllObjects = function patchedGetAllObjects(this: RuntimeApplicationLike) {
    const objects = originalGetAllObjects.call(this) ?? [];
    if (objects.some(object => object.name === CAMERA_NAME)) return objects;

    const variables = this.getVariables?.() ?? {};
    if (!hasOwn(variables, CAMERA_X) || !hasOwn(variables, CAMERA_Y) || !this.setVariable) {
      return objects;
    }

    const position = {} as { x: number; y: number; z: number };
    Object.defineProperties(position, {
      x: {
        enumerable: true,
        get: () => readNumber(this, this.getVariables?.() ?? variables, CAMERA_X),
        set: (value: number) => this.setVariable?.(CAMERA_X, Number(value))
      },
      y: {
        enumerable: true,
        get: () => readNumber(this, this.getVariables?.() ?? variables, CAMERA_Y),
        set: (value: number) => this.setVariable?.(CAMERA_Y, Number(value))
      },
      z: {
        enumerable: true,
        get: () => {
          const current = this.getVariables?.() ?? variables;
          return hasOwn(current, CAMERA_Z) ? readNumber(this, current, CAMERA_Z) : 0;
        },
        set: (value: number) => {
          const current = this.getVariables?.() ?? variables;
          if (hasOwn(current, CAMERA_Z)) this.setVariable?.(CAMERA_Z, Number(value));
        }
      }
    });

    const virtualCamera: RuntimeObjectLike = {
      uuid: VIRTUAL_CAMERA_UUID,
      name: CAMERA_NAME,
      parent: null,
      position,
      visible: false
    };

    return [...objects, virtualCamera];
  };

  prototype.__mediaOsVariableCameraPatched = true;
}

installVariableBackedCameraBridge();

export const MEDIA_OS_CAMERA_VARIABLES = {
  x: CAMERA_X,
  y: CAMERA_Y,
  z: CAMERA_Z
} as const;
