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
  QUIET: {color: COLORS.quietBorder, opacity: 0.42, radius: 0.032},
  ACTIVE: {color: COLORS.activeCyan, opacity: 0.96, radius: 0.052},
  WAITING: {color: COLORS.waiting, opacity: 0.84, radius: 0.047},
  RETURN: {color: COLORS.databaseAccent, opacity: 0.96, radius: 0.052},
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
  const active = state !== 'QUIET';

  return (
    <group position={transform.midpoint} quaternion={transform.quaternion}>
      <mesh>
        <cylinderGeometry args={[0.092, 0.092, transform.length, 16]} />
        <meshStandardMaterial
          color="#0B1827"
          roughness={0.66}
          metalness={0.42}
          transparent
          opacity={state === 'QUIET' ? 0.46 : 0.78}
        />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <cylinderGeometry args={[style.radius, style.radius, transform.length * 0.98, 16]} />
        <meshStandardMaterial
          color={style.color}
          transparent
          opacity={style.opacity}
          emissive={style.color}
          emissiveIntensity={state === 'QUIET' ? 0.04 : 0.62}
        />
      </mesh>
      {[-0.34, 0, 0.34].map((fraction) => (
        <mesh key={fraction} position={[0, transform.length * fraction, 0.08]}>
          <cylinderGeometry args={[0.13, 0.13, 0.055, 16]} />
          <meshStandardMaterial
            color={active ? style.color : COLORS.quietBorder}
            emissive={style.color}
            emissiveIntensity={active ? 0.32 : 0.03}
            transparent
            opacity={active ? 0.76 : 0.32}
          />
        </mesh>
      ))}
    </group>
  );
};
