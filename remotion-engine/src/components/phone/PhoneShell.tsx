import React from 'react';
import {COLORS} from '../../design-system/tokens';

type Props = {
  position: readonly [number, number, number];
  visible: boolean;
  waiting: boolean;
  spinnerRotation: number;
};

export const PhoneShell: React.FC<Props> = ({position, visible, waiting, spinnerRotation}) => {
  if (!visible) return null;

  return (
    <group position={position} rotation={[0.03, -0.08, -0.08]} scale={1.06}>
      <mesh position={[0, -0.12, -0.08]}>
        <boxGeometry args={[1.68, 2.98, 0.3]} />
        <meshStandardMaterial
          color="#050B13"
          roughness={0.4}
          metalness={0.58}
          emissive="#081827"
          emissiveIntensity={0.12}
        />
      </mesh>

      <mesh position={[0, -0.08, 0.09]}>
        <boxGeometry args={[1.42, 2.6, 0.055]} />
        <meshStandardMaterial
          color="#0A1726"
          emissive="#0E2A41"
          emissiveIntensity={0.24}
          roughness={0.54}
        />
      </mesh>

      <mesh position={[0, 1.05, 0.15]}>
        <boxGeometry args={[0.42, 0.055, 0.035]} />
        <meshStandardMaterial color="#1C3448" emissive="#244B68" emissiveIntensity={0.22} />
      </mesh>

      <group position={[0, 0.24, 0.17]}>
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[0.92, 0.085, 0.035]} />
          <meshStandardMaterial color="#20374A" emissive="#274B66" emissiveIntensity={0.18} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.92, 0.085, 0.035]} />
          <meshStandardMaterial color="#20374A" emissive="#274B66" emissiveIntensity={0.14} />
        </mesh>
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[0.95, 0.28, 0.045]} />
          <meshStandardMaterial
            color={waiting ? '#10283A' : '#0C4B70'}
            emissive={COLORS.phoneAccent}
            emissiveIntensity={waiting ? 0.08 : 0.5}
          />
        </mesh>
      </group>

      {waiting ? (
        <group position={[0, -0.02, 0.23]} rotation={[0, 0, spinnerRotation]}>
          {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, index) => (
            <mesh
              key={angle}
              position={[Math.cos(angle) * 0.2, Math.sin(angle) * 0.2, 0]}
              scale={1 - index * 0.14}
            >
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial
                color={COLORS.phoneAccent}
                emissive={COLORS.phoneAccent}
                emissiveIntensity={0.95 - index * 0.14}
                transparent
                opacity={0.95 - index * 0.13}
              />
            </mesh>
          ))}
        </group>
      ) : null}

      <mesh position={[0, -1.4, 0.02]}>
        <boxGeometry args={[1.25, 0.055, 0.12]} />
        <meshStandardMaterial
          color="#0B1A28"
          emissive={COLORS.phoneAccent}
          emissiveIntensity={waiting ? 0.22 : 0.08}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
};
