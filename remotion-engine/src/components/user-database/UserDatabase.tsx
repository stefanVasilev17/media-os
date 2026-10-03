import React from 'react';
import {COLORS} from '../../design-system/tokens';
import {resolveVisualState} from '../../engine/state/resolveVisualState';
import type {AttentionState, OperationalState} from '../../engine/state/types';

type Props = {
  position: readonly [number, number, number];
  attention: AttentionState;
  operational: OperationalState;
};

export const UserDatabase: React.FC<Props> = ({position, attention, operational}) => {
  const visual = resolveVisualState(attention, operational);
  const accent = visual.semanticColor ?? COLORS.databaseAccent;

  return (
    <group position={position}>
      {[0.42, 0, -0.42].map((y, index) => (
        <mesh key={y} position={[0, y, 0.15 + index * 0.025]}>
          <boxGeometry args={[2.2, 0.32, 0.34]} />
          <meshStandardMaterial
            color={index === 1 ? COLORS.raisedSurface : COLORS.deepSurface}
            emissive={accent}
            emissiveIntensity={0.06 + visual.emissiveIntensity * 0.3}
            transparent
            opacity={visual.opacity}
            roughness={0.62}
            metalness={0.2}
          />
        </mesh>
      ))}

      {[-0.62, 0, 0.62].map((x) => (
        <mesh key={x} position={[x, 0, 0.42]}>
          <boxGeometry args={[0.08, 1.18, 0.05]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.55 + visual.emissiveIntensity * 0.5}
            transparent
            opacity={visual.opacity}
          />
        </mesh>
      ))}
    </group>
  );
};
