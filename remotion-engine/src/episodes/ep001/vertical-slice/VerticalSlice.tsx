import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {OrthographicCamera} from 'three';
import {z} from 'zod';
import {PhoneShell} from '../../../components/phone/PhoneShell';
import {AuthService} from '../../../components/auth-service/AuthService';
import {UserDatabase} from '../../../components/user-database/UserDatabase';
import {COLORS, WORLD} from '../../../design-system/tokens';
import {getVerticalSliceCameraPose} from '../../../engine/camera/cameraTimeline';
import {ConnectionPath} from '../../../engine/paths/ConnectionPath';
import {TravelToken} from '../../../engine/tokens/TravelToken';
import {getVerticalSliceState} from './shotSpec';
import {projectWorldToScreen} from './project';

export const verticalSliceSchema = z.object({
  showDebugLabels: z.boolean(),
});

type Props = z.infer<typeof verticalSliceSchema>;

const labelStyle: React.CSSProperties = {
  position: 'absolute',
  transform: 'translate(-50%, -50%)',
  color: COLORS.primaryText,
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  fontSize: 21,
  fontWeight: 600,
  letterSpacing: '0.045em',
  textTransform: 'uppercase',
  textShadow: '0 3px 18px rgba(0,0,0,0.78)',
  whiteSpace: 'nowrap',
};

const stateLabel: React.CSSProperties = {
  marginTop: 7,
  fontSize: 11,
  letterSpacing: '0.15em',
  fontWeight: 600,
};

const FocusGlow: React.FC<{
  x: number;
  y: number;
  color: string;
  opacity: number;
  size: number;
}> = ({x, y, color, opacity, size}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      transform: 'translate(-50%, -50%)',
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0')} 0%, transparent 68%)`,
      filter: 'blur(10px)',
      pointerEvents: 'none',
    }}
  />
);

export const VerticalSlice: React.FC<Props> = ({showDebugLabels}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const pose = getVerticalSliceCameraPose(frame);

  const camera = useMemo(() => {
    const aspect = width / height;
    return new OrthographicCamera(-aspect * 7, aspect * 7, 7, -7, 0.1, 100);
  }, [height, width]);

  camera.position.set(...pose.position);
  camera.lookAt(...pose.target);
  camera.zoom = pose.zoom;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  const runtime = getVerticalSliceState(frame);
  const databaseSlow = runtime.userDatabase.operational === 'SLOW';
  const spinnerRotation = (frame / 22) * Math.PI * 2;

  const authScreen = projectWorldToScreen(
    [WORLD.authService[0], WORLD.authService[1] - 1.15, 0.68],
    camera,
    width,
    height,
  );
  const dbScreen = projectWorldToScreen(
    [WORLD.userDatabase[0], WORLD.userDatabase[1] - 1.2, 0.68],
    camera,
    width,
    height,
  );
  const phoneScreen = projectWorldToScreen(
    [WORLD.phone[0], WORLD.phone[1] - 1.9, 0.55],
    camera,
    width,
    height,
  );
  const authGlow = projectWorldToScreen(
    [WORLD.authService[0], WORLD.authService[1], 0],
    camera,
    width,
    height,
  );
  const dbGlow = projectWorldToScreen(
    [WORLD.userDatabase[0], WORLD.userDatabase[1], 0],
    camera,
    width,
    height,
  );

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 56% 43%, #0B1B2D 0%, #07111F 46%, #050C16 100%)',
        overflow: 'hidden',
      }}
    >
      <FocusGlow
        x={authGlow.x}
        y={authGlow.y}
        color={COLORS.authAccent}
        opacity={databaseSlow ? 0.07 : 0.11}
        size={430}
      />
      <FocusGlow
        x={dbGlow.x}
        y={dbGlow.y}
        color={databaseSlow ? COLORS.waiting : COLORS.databaseAccent}
        opacity={databaseSlow ? 0.11 : 0.08}
        size={460}
      />

      <ThreeCanvas width={width} height={height} camera={camera} gl={{antialias: true, alpha: true}}>
        <ambientLight intensity={0.42} color="#87AFCB" />
        <directionalLight position={[-5, -5, 13]} intensity={2.8} color="#8ED7FF" />
        <pointLight position={[-0.6, -0.2, 6]} intensity={11} color={COLORS.authAccent} distance={13} />
        <pointLight
          position={[4.0, 1.8, 5.5]}
          intensity={databaseSlow ? 16 : 9}
          color={databaseSlow ? COLORS.waiting : COLORS.databaseAccent}
          distance={12}
        />

        <gridHelper
          args={[30, 30, '#102236', '#0C1A2A']}
          position={[0, 0, -0.24]}
          rotation={[Math.PI / 2, 0, 0]}
        />

        <ConnectionPath from={WORLD.authService} to={WORLD.userDatabase} state={runtime.dependencyPath} />

        <AuthService
          position={WORLD.authService}
          attention={runtime.authService.attention}
          operational={runtime.authService.operational}
        />
        <UserDatabase
          position={WORLD.userDatabase}
          attention={runtime.userDatabase.attention}
          operational={runtime.userDatabase.operational}
        />
        <PhoneShell
          position={WORLD.phone}
          visible={runtime.phoneVisible}
          waiting={runtime.phoneWaiting}
          spinnerRotation={spinnerRotation}
        />

        {runtime.showResponse ? (
          <TravelToken
            kind="RESPONSE"
            from={WORLD.userDatabase}
            to={WORLD.authService}
            progress={runtime.responseProgress}
            opacity={runtime.responseOpacity}
          />
        ) : null}

        {runtime.showLookup ? (
          <TravelToken
            kind="LOOKUP"
            from={WORLD.authService}
            to={WORLD.userDatabase}
            progress={runtime.lookupProgress}
            opacity={runtime.lookupOpacity}
          />
        ) : null}
      </ThreeCanvas>

      <div style={{...labelStyle, left: authScreen.x, top: authScreen.y}}>
        <div>Auth Service</div>
        <div
          style={{
            ...stateLabel,
            color: databaseSlow ? COLORS.success : COLORS.secondaryText,
          }}
        >
          {databaseSlow ? 'HEALTHY · WAITING' : 'READY'}
        </div>
      </div>

      <div style={{...labelStyle, left: dbScreen.x, top: dbScreen.y}}>
        <div>User Database</div>
        <div
          style={{
            ...stateLabel,
            color: databaseSlow ? COLORS.waiting : COLORS.secondaryText,
          }}
        >
          {databaseSlow ? 'SLOW DEPENDENCY' : 'AVAILABLE'}
        </div>
      </div>

      {runtime.phoneVisible ? (
        <div
          style={{
            ...labelStyle,
            left: phoneScreen.x,
            top: phoneScreen.y,
            opacity: runtime.phoneReveal,
          }}
        >
          <div style={{fontSize: 15, color: COLORS.secondaryText}}>Phone</div>
          <div style={{...stateLabel, color: COLORS.phoneAccent}}>WAITING</div>
        </div>
      ) : null}

      {databaseSlow ? (
        <div
          style={{
            position: 'absolute',
            top: 52,
            right: 62,
            width: 230,
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
            color: COLORS.secondaryText,
            fontSize: 11,
            letterSpacing: '0.11em',
            textTransform: 'uppercase',
            opacity: 0.82,
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 9}}>
            <span>Login time budget</span>
            <span>{Math.round(runtime.timeBudget * 100)}%</span>
          </div>
          <div style={{height: 3, background: '#14263A', borderRadius: 99, overflow: 'hidden'}}>
            <div
              style={{
                width: `${runtime.timeBudget * 100}%`,
                height: '100%',
                background: COLORS.waiting,
                boxShadow: `0 0 10px ${COLORS.waiting}55`,
              }}
            />
          </div>
        </div>
      ) : null}

      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 190px rgba(1, 5, 10, 0.58)',
        }}
      />

      {showDebugLabels ? (
        <div
          style={{
            position: 'absolute',
            left: 32,
            bottom: 26,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color: '#3C566F',
            fontSize: 11,
            lineHeight: 1.45,
          }}
        >
          <div>AT VISUAL ENGINE v0.2</div>
          <div>EP001 · 09:09–10:13 PROVISIONAL</div>
          <div>frame {frame}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
