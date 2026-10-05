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
  const scale = interpolate(opacity, [0, 1], [0.35, 1]);
  const color = kind === 'LOOKUP' ? COLORS.activeCyan : COLORS.databaseAccent;

  return (
    <group position={[p.x, p.y, p.z + 0.46]} scale={scale}>
      <mesh rotation={[0, 0, kind === 'LOOKUP' ? Math.PI / 4 : 0]}>
        <boxGeometry args={kind === 'LOOKUP' ? [0.38, 0.38, 0.16] : [0.54, 0.32, 0.16]} />
        <meshStandardMaterial
          color="#0B1A29"
          emissive={color}
          emissiveIntensity={0.42}
          roughness={0.38}
          metalness={0.32}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, 0, 0.105]} rotation={[0, 0, kind === 'LOOKUP' ? Math.PI / 4 : 0]}>
        <boxGeometry args={kind === 'LOOKUP' ? [0.22, 0.22, 0.035] : [0.34, 0.14, 0.035]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.1}
          transparent
          opacity={opacity}
        />
      </mesh>
      {kind === 'LOOKUP' ? (
        <mesh position={[0.27, -0.27, 0.02]}>
          <sphereGeometry args={[0.065, 12, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} transparent opacity={opacity * 0.86} />
        </mesh>
      ) : (
        <>
          <mesh position={[-0.14, 0, 0.13]}>
            <boxGeometry args={[0.055, 0.12, 0.025]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.02, 0, 0.13]}>
            <boxGeometry args={[0.055, 0.12, 0.025]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.65} transparent opacity={opacity * 0.88} />
          </mesh>
          <mesh position={[0.18, 0, 0.13]}>
            <boxGeometry args={[0.055, 0.12, 0.025]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={opacity * 0.74} />
          </mesh>
        </>
      )}
    </group>
  );
};
