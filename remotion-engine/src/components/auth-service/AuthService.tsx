import React from 'react';
import {COLORS} from '../../design-system/tokens';
import {resolveVisualState} from '../../engine/state/resolveVisualState';
import type {AttentionState, OperationalState} from '../../engine/state/types';

type Props = {
  position: readonly [number, number, number];
  attention: AttentionState;
  operational: OperationalState;
};

export const AuthService: React.FC<Props> = ({position, attention, operational}) => {
  const visual = resolveVisualState(attention, operational);
  const accent = visual.semanticColor ?? COLORS.authAccent;

  return (
    <group position={position}>
      <mesh position={[0, 0, 0.15]}>
        <boxGeometry args={[2.15, 1.28, 0.34]} />
        <meshStandardMaterial
          color={COLORS.deepSurface}
          transparent
          opacity={visual.opacity}
          roughness={0.58}
          metalness={0.25}
        />
      </mesh>

      <mesh position={[0, 0, 0.36]}>
        <boxGeometry args={[1.45, 0.7, 0.16]} />
        <meshStandardMaterial
          color={COLORS.raisedSurface}
          emissive={accent}
          emissiveIntensity={0.12 + visual.emissiveIntensity * 0.48}
          transparent
          opacity={visual.opacity}
        />
      </mesh>

      {[-0.86, 0.86].map((x) => (
        <mesh key={x} position={[x, 0, 0.38]}>
          <boxGeometry args={[0.08, 1.05, 0.08]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.4 + visual.emissiveIntensity}
            transparent
            opacity={visual.opacity}
          />
        </mesh>
      ))}

      <mesh position={[0, -0.47, 0.42]}>
        <boxGeometry args={[0.9, 0.06, 0.05]} />
        <meshStandardMaterial
          color={operational === 'WAITING' ? COLORS.success : accent}
          emissive={operational === 'WAITING' ? COLORS.success : accent}
          emissiveIntensity={0.8}
          transparent
          opacity={visual.opacity}
        />
      </mesh>
    </group>
  );
};
