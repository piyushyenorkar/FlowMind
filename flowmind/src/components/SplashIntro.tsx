import React, { useEffect, useState } from 'react';
import flowmindLogo from '../assets/flowmind.png';
import styles from './SplashIntro.module.css';

export default function SplashIntro({ onFinish, flyToCorner = true }: { onFinish: () => void, flyToCorner?: boolean }) {
  const [phase, setPhase] = useState<'loading' | 'center' | 'moving' | 'done'>('loading');
  const [targetCorner] = useState(flyToCorner);

  useEffect(() => {
    if (phase === 'center') {
      // 1. Wait in the center while reveal animation plays
      const t1 = setTimeout(() => {
        setPhase('moving');
      }, 1300);
      return () => clearTimeout(t1);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'moving') {
      // 2. Finish animation and unmount (0.8s transition + 0.1s buffer)
      const t2 = setTimeout(() => {
        setPhase('done');
        onFinish();
      }, 900);
      return () => clearTimeout(t2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Fallback in case onLoad fails or image is instantly cached but event missed
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (phase === 'loading') setPhase('center');
    }, 2500);
    return () => clearTimeout(fallbackTimer);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <>
      {targetCorner && (
        <style>{`
          #main-nav-logo {
            opacity: 0 !important;
          }
        `}</style>
      )}
      <div className={`${styles.overlay} ${phase === 'moving' ? (targetCorner ? styles.fadeOutBackground : styles.fadeOutAll) : ''}`}>
        <div className={`${styles.logoContainer} ${phase === 'moving' && targetCorner ? styles.flyToCorner : ''}`}>
          <svg
            className={`${styles.waveSvg} ${phase === 'moving' ? styles.fadeOutWave : ''}`}
            viewBox="0 0 600 150"
            preserveAspectRatio="none"
            style={{ overflow: 'visible', opacity: phase === 'loading' ? 0 : undefined }}
          >
            <defs>
              <linearGradient id="gapGradient" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="31%" stopColor="white" />
                <stop offset="33%" stopColor="black" />
                <stop offset="67%" stopColor="black" />
                <stop offset="69%" stopColor="white" />
              </linearGradient>
              <mask id="gapMask">
                <rect x="-300" y="-100" width="1200" height="350" fill="url(#gapGradient)" />
              </mask>
            </defs>
            <g mask="url(#gapMask)">
              <path className={styles.wavePath1} d="M-150,75 C-50,0 50,150 150,75 C250,0 350,150 450,75 C550,0 650,150 750,75" fill="none" stroke="rgba(20, 184, 166, 0.9)" strokeWidth="4" />
              <path className={styles.wavePath2} d="M-150,75 C-50,150 50,0 150,75 C250,150 350,0 450,75 C550,150 650,0 750,75" fill="none" stroke="rgba(20, 184, 166, 0.7)" strokeWidth="3" />
              <path className={styles.wavePath3} d="M-150,75 C0,20 100,130 200,75 C300,20 400,130 500,75 C600,20 700,130 800,75" fill="none" stroke="rgba(20, 184, 166, 0.5)" strokeWidth="2" />
            </g>
          </svg>
          <img
            src={flowmindLogo}
            alt="FlowMind"
            className={phase === 'loading' ? '' : styles.logo}
            style={phase === 'loading' ? { opacity: 0, height: '100px', width: 'auto' } : undefined}
            onLoad={() => {
              if (phase === 'loading') setPhase('center');
            }}
          />
        </div>
      </div>
    </>
  );
}
