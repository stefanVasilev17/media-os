import React from 'react';
import {COLORS} from '../../design-system/tokens';
import {TechnicalPedestal} from '../../engine/world/TechnicalPedestal';
import {resolveVisualState} from '../../engine/state/resolveVisualState';
import type {AttentionState, OperationalState} from '../../engine/state/types';

type Props = {
  position: readonly [number, number, number];
  attention: AttentionState;
  operational: OperationalState;
};

export const UserDatabase: React.FC<Props> = ({position, attention, operational}) => {
  const visual = resolveVisualState(attention, operational);
  const slow = operational === 'SLOW';
  const accent = slow ? COLORS.waiting : COLORS.databaseAccent;
  const active = attention === 'ACTIVE' || attention === 'FOCUS';

  return (
    <group position={position} scale={1.14}>
      <TechnicalPedestal
        width={2.95}
        depth={1.5}
        accent={accent}
        opacity={visual.opacity}
        active={active}
      />

      <mesh position={[0, 0.02, 0.24]}>
        <boxGeometry args={[2.5, 1.48, 0.42]} />
        <meshStandardMaterial
          color="#081722"
          emissive={accent}
          emissiveIntensity={0.04 + visual.emissiveIntensity * 0.12}
          roughness={0.6}
          metalness={0.3}
          transparent
          opacity={visual.opacity}
        />
      </mesh>

      {[0.48, 0.04, -0.4].map((y, index) => (
        <group key={y} position={[0, y, 0.49 + index * 0.01]}>
          <mesh>
            <boxGeometry args={[2.02, 0.28, 0.13]} />
            <meshStandardMaterial
              color={index === 1 ? '#102338' : COLORS.raisedSurface}
              emissive={accent}
              emissiveIntensity={(slow ? 0.18 : 0.09) + visual.emissiveIntensity * 0.22}
              roughness={0.46}
              metalness={0.24}
              transparent
              opacity={visual.opacity}
            />
          </mesh>
          <mesh position={[-0.78, 0, 0.085]}>
            <boxGeometry args={[0.23, 0.055, 0.025]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={slow ? 0.82 : 0.48}
              transparent
              opacity={visual.opacity * (1 - index * 0.12)}
            />
          </mesh>
        </group>
      ))}

      {[-0.78, 0, 0.78].map((x, index) => (
        <mesh key={x} position={[x, 0.04, 0.59]}>
          <boxGeometry args={[0.075, 1.17, 0.05]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.36 + visual.emissiveIntensity * 0.58}
            transparent
            opacity={visual.opacity * (index === 1 ? 1 : 0.82)}
          />
        </mesh>
      ))}

      {slow ? (
        <group position={[1.03, 0.49, 0.64]}>
          <mesh>
            <boxGeometry args={[0.16, 0.16, 0.045]} />
            <meshStandardMaterial
              color={COLORS.waiting}
              emissive={COLORS.waiting}
              emissiveIntensity={1.0}
            />
          </mesh>
          <mesh position={[0, -0.28, 0]}>
            <boxGeometry args={[0.05, 0.3, 0.03]} />
            <meshStandardMaterial
              color={COLORS.waiting}
              emissive={COLORS.waiting}
              emissiveIntensity={0.55}
              transparent
              opacity={0.72}
            />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};
