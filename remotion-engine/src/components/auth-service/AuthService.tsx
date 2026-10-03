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

export const AuthService: React.FC<Props> = ({position, attention, operational}) => {
  const visual = resolveVisualState(attention, operational);
  const healthyWaiting = operational === 'WAITING';
  const failed = operational === 'FAILED' || operational === 'BLOCKED';
  const identityAccent = COLORS.authAccent;
  const bodyAccent = failed ? COLORS.failure : identityAccent;
  const active = attention === 'ACTIVE' || attention === 'FOCUS';

  return (
    <group position={position} scale={1.12}>
      <TechnicalPedestal
        width={2.8}
        depth={1.45}
        accent={identityAccent}
        opacity={visual.opacity}
        active={active}
      />

      <mesh position={[0, 0.03, 0.26]}>
        <boxGeometry args={[2.48, 1.38, 0.42]} />
        <meshStandardMaterial
          color="#091524"
          emissive={bodyAccent}
          emissiveIntensity={0.04 + visual.emissiveIntensity * 0.12}
          roughness={0.56}
          metalness={0.32}
          transparent
          opacity={visual.opacity}
        />
      </mesh>

      <mesh position={[0, 0.05, 0.5]}>
        <boxGeometry args={[1.6, 0.72, 0.12]} />
        <meshStandardMaterial
          color={COLORS.raisedSurface}
          emissive={identityAccent}
          emissiveIntensity={0.12 + visual.emissiveIntensity * 0.38}
          roughness={0.42}
          metalness={0.24}
          transparent
          opacity={visual.opacity}
        />
      </mesh>

      {[-0.92, 0.92].map((x) => (
        <group key={x} position={[x, 0.03, 0.54]}>
          <mesh>
            <boxGeometry args={[0.09, 1.08, 0.08]} />
            <meshStandardMaterial
              color={identityAccent}
              emissive={identityAccent}
              emissiveIntensity={0.32 + visual.emissiveIntensity * 0.76}
              transparent
              opacity={visual.opacity}
            />
          </mesh>
          <mesh position={[x < 0 ? 0.16 : -0.16, 0, -0.01]}>
            <boxGeometry args={[0.18, 0.045, 0.035]} />
            <meshStandardMaterial
              color={COLORS.quietBorder}
              emissive={identityAccent}
              emissiveIntensity={active ? 0.25 : 0.05}
              transparent
              opacity={visual.opacity * 0.9}
            />
          </mesh>
        </group>
      ))}

      {[-0.38, 0, 0.38].map((x, index) => (
        <mesh key={x} position={[x, 0.06, 0.59]}>
          <boxGeometry args={[0.16, 0.16, 0.045]} />
          <meshStandardMaterial
            color={index === 1 && healthyWaiting ? COLORS.success : identityAccent}
            emissive={index === 1 && healthyWaiting ? COLORS.success : identityAccent}
            emissiveIntensity={index === 1 && healthyWaiting ? 0.9 : 0.38}
            transparent
            opacity={visual.opacity * (index === 1 ? 1 : 0.64)}
          />
        </mesh>
      ))}

      <mesh position={[0, -0.49, 0.58]}>
        <boxGeometry args={[1.25, 0.065, 0.04]} />
        <meshStandardMaterial
          color={healthyWaiting ? COLORS.success : bodyAccent}
          emissive={healthyWaiting ? COLORS.success : bodyAccent}
          emissiveIntensity={healthyWaiting ? 0.9 : 0.5 + visual.emissiveIntensity * 0.3}
          transparent
          opacity={visual.opacity}
        />
      </mesh>

      {healthyWaiting ? (
        <mesh position={[0, -0.6, 0.57]}>
          <boxGeometry args={[0.62, 0.025, 0.035]} />
          <meshStandardMaterial
            color={COLORS.waiting}
            emissive={COLORS.waiting}
            emissiveIntensity={0.5}
            transparent
            opacity={visual.opacity * 0.7}
          />
        </mesh>
      ) : null}
    </group>
  );
};
