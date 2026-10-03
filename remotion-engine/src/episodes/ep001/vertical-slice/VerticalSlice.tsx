import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
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
  fontSize: 25,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  textShadow: '0 2px 16px rgba(0,0,0,0.65)',
  whiteSpace: 'nowrap',
};

const statePill: React.CSSProperties = {
  marginTop: 7,
  fontSize: 14,
  letterSpacing: '0.12em',
  fontWeight: 600,
};

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
  const spinnerRotation = (frame / 18) * Math.PI * 2;

  const authScreen = projectWorldToScreen(
    [WORLD.authService[0], WORLD.authService[1] - 1.0, 0.6],
    camera,
    width,
    height,
  );
  const dbScreen = projectWorldToScreen(
    [WORLD.userDatabase[0], WORLD.userDatabase[1] - 1.1, 0.6],
    camera,
    width,
    height,
  );
  const phoneScreen = projectWorldToScreen(
    [WORLD.phone[0], WORLD.phone[1] - 1.7, 0.5],
    camera,
    width,
    height,
  );

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.background, overflow: 'hidden'}}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={camera}
        gl={{antialias: true}}
      >
        <color attach="background" args={[COLORS.background]} />
        <ambientLight intensity={0.7} color="#8EB8D6" />
        <directionalLight position={[-6, -4, 12]} intensity={2.4} color="#8ED7FF" />
        <pointLight position={[1, 1, 7]} intensity={14} color="#596BFF" distance={18} />
        <pointLight
          position={[4.5, 2, 5]}
          intensity={databaseSlow ? 18 : 10}
          color={databaseSlow ? COLORS.waiting : COLORS.databaseAccent}
          distance={12}
        />

        <gridHelper
          args={[32, 32, '#15283D', '#102033']}
          position={[0, 0, -0.16]}
          rotation={[Math.PI / 2, 0, 0]}
        />

        <ConnectionPath
          from={WORLD.authService}
          to={WORLD.userDatabase}
          state={runtime.dependencyPath}
        />

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
            ...statePill,
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
            ...statePill,
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
          <div style={{fontSize: 18, color: COLORS.secondaryText}}>Phone</div>
          <div style={{...statePill, color: COLORS.phoneAccent}}>WAITING</div>
        </div>
      ) : null}

      {databaseSlow ? (
        <div
          style={{
            position: 'absolute',
            top: 62,
            right: 72,
            width: 270,
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
            color: COLORS.secondaryText,
            fontSize: 14,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 10}}>
            <span>Login time budget</span>
            <span>{Math.round(runtime.timeBudget * 100)}%</span>
          </div>
          <div style={{height: 4, background: '#172A3F', borderRadius: 99, overflow: 'hidden'}}>
            <div
              style={{
                width: `${runtime.timeBudget * 100}%`,
                height: '100%',
                background: COLORS.waiting,
              }}
            />
          </div>
        </div>
      ) : null}

      {showDebugLabels ? (
        <div
          style={{
            position: 'absolute',
            left: 38,
            bottom: 30,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color: '#526B84',
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          <div>AT VISUAL ENGINE v0.1</div>
          <div>EP001 · 09:09–10:13 PROVISIONAL</div>
          <div>frame {frame}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
