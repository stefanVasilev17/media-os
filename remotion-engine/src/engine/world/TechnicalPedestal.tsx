import React from 'react';
import {COLORS} from '../../design-system/tokens';

type Props = {
  width: number;
  depth: number;
  accent: string;
  opacity: number;
  active?: boolean;
};

export const TechnicalPedestal: React.FC<Props> = ({
  width,
  depth,
  accent,
  opacity,
  active = false,
}) => {
  return (
    <group position={[0, -0.78, -0.06]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, 0.16, depth]} />
        <meshStandardMaterial
          color={COLORS.deepSurface}
          roughness={0.72}
          metalness={0.32}
          transparent
          opacity={opacity * 0.96}
        />
      </mesh>
      <mesh position={[0, 0.095, 0.035]}>
        <boxGeometry args={[width * 0.88, 0.045, depth * 0.82]} />
        <meshStandardMaterial
          color={COLORS.raisedSurface}
          emissive={accent}
          emissiveIntensity={active ? 0.22 : 0.05}
          roughness={0.56}
          metalness={0.28}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, 0.13, depth * 0.37]}>
        <boxGeometry args={[width * 0.72, 0.025, 0.035]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={active ? 0.72 : 0.18}
          transparent
          opacity={opacity * (active ? 0.92 : 0.48)}
        />
      </mesh>
    </group>
  );
};
