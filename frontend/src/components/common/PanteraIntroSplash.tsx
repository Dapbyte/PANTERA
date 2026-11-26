import { useCallback, useEffect, useRef, useState } from 'react';
import './PanteraIntroSplash.css';

export const INTRO_SEEN_KEY = 'pantera_intro_seen';

const INTRO_ASSETS = [
  '/intro/PANTERA_blue.png',
  '/intro/PANTERA_white.png',
  '/intro/DJASIPA_blue.png',
  '/intro/DJASIPA_white.png',
] as const;

const TOTAL_DURATION_MS = 5000;
const PRELOAD_TIMEOUT_MS = 350;

export interface PanteraIntroSplashProps {
  onComplete: () => void;
  forcePlay?: boolean;
}

function IntroSceneLayer({ variant }: { variant: 'light' | 'blue' }) {
  const isBlue = variant === 'blue';
  const panteraSrc = isBlue ? '/intro/PANTERA_white.png' : '/intro/PANTERA_blue.png';
  const djasipaSrc = isBlue ? '/intro/DJASIPA_white.png' : '/intro/DJASIPA_blue.png';

  return (
    <div
      className={`pantera-intro-layer pantera-intro-layer--${variant}`}
      aria-hidden={isBlue ? true : undefined}
    >
      <div className="pantera-intro-composition">
        <div className="pantera-upper-block">
          <div className="pantera-lockup-row">
            <div className="pantera-p-scale-wrap">
              <div className="pantera-p-roar-wrap">
                <div className="pantera-p-aura" />
                <img
                  src={panteraSrc}
                  alt={isBlue ? '' : 'PANTERA'}
                  className="pantera-p-img"
                  decoding="sync"
                />

                {/* Kilatan mata pada x=66.5%, y=20.5% */}
                <svg className="pantera-eye-glint" viewBox="0 0 32 32" aria-hidden="true">
                  <path
                    d="M16 1 L18.4 13.6 L31 16 L18.4 18.4 L16 31 L13.6 18.4 L1 16 L13.6 13.6 Z"
                    fill="#FFFFFF"
                  />
                </svg>

                {/* 3 Gelombang kejut auman (-42°..+52°) */}
                <svg className="pantera-roar-arcs" viewBox="0 0 96 96" aria-hidden="true">
                  <path
                    className="pantera-roar-arc pantera-roar-arc--1"
                    d="M 33 34 A 20 20 0 0 1 30 62"
                    strokeWidth="2.6"
                  />
                  <path
                    className="pantera-roar-arc pantera-roar-arc--2"
                    d="M 46 24 A 34 34 0 0 1 40 72"
                    strokeWidth="2.2"
                  />
                  <path
                    className="pantera-roar-arc pantera-roar-arc--3"
                    d="M 59 15 A 48 48 0 0 1 51 82"
                    strokeWidth="1.8"
                  />
                </svg>
              </div>
            </div>

            <span className="pantera-antera-text">ANTERA</span>
          </div>

          <div className="pantera-subtitle-mask">
            <span className="pantera-subtitle-text">Pemantauan Arsip Termin Risiko</span>
          </div>
        </div>

        <div className="pantera-lower-block">
          <div className="pantera-divider" />

          <div className="pantera-powered-mask">
            <span className="pantera-powered-text">POWERED BY</span>
          </div>

          <div className="pantera-dmp-logo-wrap">
            <img
              src={djasipaSrc}
              alt={isBlue ? '' : 'DMP'}
              className="pantera-dmp-img"
              decoding="sync"
            />
          </div>

          <div className="pantera-company-mask">
            <span className="pantera-company-text">PT Djasipa Mitra Perkasa</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Splash intro 5,0 detik PANTERA × DMP berbasis animasi kode murni (CSS Keyframes + SVG + PNG),
 * tanpa file video dan tanpa freeze pada pengaturan reduce-motion OS.
 */
export function PanteraIntroSplash({ onComplete, forcePlay = false }: PanteraIntroSplashProps) {
  const [ready, setReady] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // Abaikan bila storage dibatasi
    }
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    if (forcePlay || typeof window === 'undefined') return;
    try {
      if (window.sessionStorage.getItem(INTRO_SEEN_KEY) === '1') {
        finishIntro();
      }
    } catch {
      // Abaikan bila storage tidak tersedia
    }
  }, [finishIntro, forcePlay]);

  useEffect(() => {
    let settled = false;
    let remaining = INTRO_ASSETS.length;

    const markReady = () => {
      if (settled) return;
      settled = true;
      setReady(true);
    };

    const timeoutId = window.setTimeout(markReady, PRELOAD_TIMEOUT_MS);

    const onAssetDone = () => {
      remaining -= 1;
      if (remaining <= 0) {
        window.clearTimeout(timeoutId);
        markReady();
      }
    };

    INTRO_ASSETS.forEach((src) => {
      const img = new window.Image();
      img.onload = onAssetDone;
      img.onerror = onAssetDone;
      img.src = src;
    });

    return () => {
      settled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timerId = window.setTimeout(finishIntro, TOTAL_DURATION_MS);
    return () => window.clearTimeout(timerId);
  }, [finishIntro, ready]);

  return (
    <div
      className={[
        'pantera-intro-overlay fixed inset-0 z-[90]',
        ready ? 'pantera-intro-overlay--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label="PANTERA Intro"
    >
      <div className="pantera-intro-exit">
        <IntroSceneLayer variant="light" />
        <IntroSceneLayer variant="blue" />

        <button
          type="button"
          onClick={finishIntro}
          className="pantera-skip-btn"
          aria-label="Lewati animasi intro"
        >
          Lewati
        </button>
      </div>
    </div>
  );
}
