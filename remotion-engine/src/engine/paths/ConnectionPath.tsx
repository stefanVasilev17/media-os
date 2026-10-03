import React, {useMemo} from 'react';
import {Quaternion, Vector3} from 'three';
import {COLORS} from '../../design-system/tokens';

export type PathVisualState = 'QUIET' | 'ACTIVE' | 'WAITING' | 'RETURN';

type Props = {
  from: readonly [number, number, number];
  to: readonly [number, number, number];
  state: PathVisualState;
};

const STATE_STYLE: Record<PathVisualState, {color: string; opacity: number; radius: number}> = {
  QUIET: {color: COLORS.quietBorder, opacity: 0.42, radius: 0.025},
  ACTIVE: {color: COLORS.activeCyan, opacity: 0.9, radius: 0.045},
  WAITING: {color: COLORS.waiting, opacity: 0.72, radius: 0.04},
  RETURN: {color: COLORS.databaseAccent, opacity: 0.9, radius: 0.045},
};

export const ConnectionPath: React.FC<Props> = ({from, to, state}) => {
  const transform = useMemo(() => {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const direction = end.clone().sub(start);
    const length = direction.length();
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const quaternion = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      direction.clone().normalize(),
    );
    return {length, midpoint, quaternion};
  }, [from, to]);

  const style = STATE_STYLE[state];

  return (
    <mesh position={transform.midpoint} quaternion={transform.quaternion}>
      <cylinderGeometry args={[style.radius, style.radius, transform.length, 12]} />
      <meshStandardMaterial
        color={style.color}
        transparent
        opacity={style.opacity}
        emissive={style.color}
        emissiveIntensity={state === 'QUIET' ? 0.05 : 0.35}
      />
    </mesh>
  );
};
