import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export type EpisodeShotQaProps = {
  episodeId: string;
  shotKey: string;
  shotTitle: string;
  shotRevision: number;
  scriptRevision: number;
  visualDirection: string;
  durationInFrames: number;
};

export const EpisodeShotQaPreview: React.FC<EpisodeShotQaProps> = ({
  shotKey, shotTitle, shotRevision, scriptRevision, visualDirection,
}) => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [6, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pulse = interpolate(frame % 36, [0, 18, 36], [0.4, 1, 0.4]);
  const nodes = ['REQUEST', 'SERVICE', 'RESPONSE'];

  return (
    <AbsoluteFill style={{backgroundColor: '#080f1b', color: '#e5edf7', fontFamily: 'Arial, sans-serif'}}>
      <div style={{position: 'absolute', top: 76, left: 104, fontSize: 23, letterSpacing: 5, color: '#7f96ae'}}>
        MEDIAOS / ARCHITECTURAL THINKING
      </div>
      <div style={{position: 'absolute', top: 147, left: 104, fontSize: 62, fontWeight: 700}}>
        {String(shotTitle || shotKey).slice(0, 90)}
      </div>
      <div style={{position: 'absolute', top: 234, left: 104, fontSize: 27, color: '#8aa7c2'}}>
        {shotKey} · Shot Revision {shotRevision} · Script Revision {scriptRevision}
      </div>
      <svg viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <line x1="520" y1="551" x2={520 + 420 * line} y2="551"
              stroke="#38bac7" strokeWidth="5" strokeLinecap="round" opacity="0.85"/>
        <line x1="981" y1="551" x2={981 + 420 * line} y2="551"
              stroke="#38bac7" strokeWidth="5" strokeLinecap="round" opacity="0.85"/>
        {nodes.map((label, index) => {
          const x = 205 + 462 * index;
          const active = frame >= 12 + 18 * index;
          return (
            <g key={label}>
              <rect x={x} y="474" width="315" height="154" rx="22"
                    fill={active ? '#122d3b' : '#14202f'}
                    stroke={active ? '#44c8ca' : '#45596d'} strokeWidth="3"/>
              <text x={x + 157} y="563" textAnchor="middle"
                    fontFamily="Arial, sans-serif" fontSize="29" fontWeight="700"
                    letterSpacing="2" fill={active ? '#e5f9ff' : '#9fb4c6'}>{label}</text>
              <circle cx={x + 283} cy="505" r="7"
                      fill="#45e2c2" opacity={active ? pulse : 0.25}/>
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', top: 760, left: 105, width: 1690, fontSize: 29,
        color: '#afc5d8', lineHeight: 1.4}}>
        <div style={{fontSize: 19, letterSpacing: 3, color: '#43b7c0', marginBottom: 20}}>
          DIRECTOR-LOCKED VISUAL DIRECTION
        </div>
        {String(visualDirection || 'Approved visual direction is stored in MediaOS.').slice(0, 220)}
      </div>
      <div style={{position: 'absolute', bottom: 60, right: 100, color: '#e0ae7d',
        fontSize: 22, fontWeight: 700, letterSpacing: 3}}>
        QA STORYBOARD · NOT FINAL VIDEO · NO VOICE MIX
      </div>
    </AbsoluteFill>
  );
};
