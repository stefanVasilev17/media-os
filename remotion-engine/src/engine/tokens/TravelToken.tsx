import React from 'react';
import {interpolate} from 'remotion';
import {Vector3} from 'three';
import {COLORS} from '../../design-system/tokens';

type TokenKind = 'LOOKUP' | 'RESPONSE';

type Props = {
  kind: TokenKind;
  from: readonly [number, number, number];
  to: readonly [number, number, number];
  progress: number;
  opacity?: number;
};

export const TravelToken: React.FC<Props> = ({kind, from, to, progress, opacity = 1}) => {
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  const p = start.lerp(end, Math.max(0, Math.min(1, progress)));
  const scale = interpolate(opacity, [0, 1], [0.25, 1]);
  const color = kind === 'LOOKUP' ? COLORS.activeCyan : COLORS.databaseAccent;

  return (
    <group position={[p.x, p.y, p.z + 0.16]} scale={scale}>
      <mesh rotation={[0, 0, kind === 'LOOKUP' ? Math.PI / 4 : 0]}>
        <boxGeometry args={kind === 'LOOKUP' ? [0.32, 0.32, 0.16] : [0.42, 0.25, 0.16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.75}
          transparent
          opacity={opacity}
        />
      </mesh>
    </group>
  );
};
