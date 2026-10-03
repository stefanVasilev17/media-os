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
    <group position={position} rotation={[0, 0, -0.08]}>
      <mesh>
        <boxGeometry args={[1.45, 2.6, 0.24]} />
        <meshStandardMaterial color="#08131F" roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.05, 0.14]}>
        <boxGeometry args={[1.16, 2.18, 0.05]} />
        <meshStandardMaterial color="#0C1B2C" emissive="#102A40" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, -0.62, 0.2]}>
        <boxGeometry args={[0.78, 0.25, 0.05]} />
        <meshStandardMaterial
          color={waiting ? '#15334A' : COLORS.phoneAccent}
          emissive={COLORS.phoneAccent}
          emissiveIntensity={waiting ? 0.1 : 0.55}
        />
      </mesh>
      {waiting ? (
        <group position={[0, 0.16, 0.22]} rotation={[0, 0, spinnerRotation]}>
          <mesh position={[0.18, 0, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color={COLORS.phoneAccent} emissive={COLORS.phoneAccent} emissiveIntensity={0.9} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};
