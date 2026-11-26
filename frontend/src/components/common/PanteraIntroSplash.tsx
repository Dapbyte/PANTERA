import { useCallback, useEffect, useRef, useState } from 'react';
import './PanteraIntroSplash.css';

export const INTRO_SEEN_KEY = 'pantera_intro_seen';

const INTRO_VIDEO_SRC = '/intro/PANTERA_DMP_intro_v5.mp4';
const BLUE_PHASE_TIME_S = 3.35;
const EXIT_FADE_MS = 400;
const AUTOPLAY_CHECK_MS = 2500;
const SAFETY_MAX_MS = 6500;

export interface PanteraIntroSplashProps {
  onComplete: () => void;
  forcePlay?: boolean;
}

/**
 * Splash intro 5 detik berbasis video 60fps PANTERA × DMP dengan radial blue wipe
 * untuk safe-zone mobile, fallback bila autoplay terblokir, dan tombol Lewati.
 */
export function PanteraIntroSplash({ onComplete, forcePlay = false }: PanteraIntroSplashProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef(false);
  const exitingRef = useRef(false);
  const playbackStartedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  const [isBluePhase, setIsBluePhase] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finishImmediate = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // Abaikan jika sessionStorage dibatasi
    }
    onCompleteRef.current();
  }, []);

  const triggerExit = useCallback(() => {
    if (completedRef.current || exitingRef.current) return;
    exitingRef.current = true;
    setIsExiting(true);
    window.setTimeout(finishImmediate, EXIT_FADE_MS);
  }, [finishImmediate]);

  // Lewati otomatis jika sudah pernah diputar pada tab/sesi ini
  useEffect(() => {
    if (forcePlay || typeof window === 'undefined') return;
    try {
      if (window.sessionStorage.getItem(INTRO_SEEN_KEY) === '1') {
        finishImmediate();
      }
    } catch {
      // Lanjut putar jika storage tidak tersedia
    }
  }, [finishImmediate, forcePlay]);

  // Pastikan tombol Lewati muncul setelah ~0.6 detik
  useEffect(() => {
    const skipTimer = window.setTimeout(() => setShowSkip(true), 600);
    return () => window.clearTimeout(skipTimer);
  }, []);

  // Pastikan autoplay muted berjalan di semua browser, atau fallback jika genuinely diblokir
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      const playPromise = video.play?.();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          setUseFallback(true);
        });
      }
    }

    const autoplayWatchdog = window.setTimeout(() => {
      if (!playbackStartedRef.current && !exitingRef.current) {
        setUseFallback(true);
      }
    }, AUTOPLAY_CHECK_MS);

    const safetyCeiling = window.setTimeout(triggerExit, SAFETY_MAX_MS);

    return () => {
      window.clearTimeout(autoplayWatchdog);
      window.clearTimeout(safetyCeiling);
    };
  }, [triggerExit]);

  // Bila masuk mode fallback (autoplay gagal / environment tanpa video decoder), selesaikan elegan
  useEffect(() => {
    if (!useFallback) return;
    const blueTimer = window.setTimeout(() => setIsBluePhase(true), 700);
    const exitTimer = window.setTimeout(triggerExit, 2000);
    return () => {
      window.clearTimeout(blueTimer);
      window.clearTimeout(exitTimer);
    };
  }, [triggerExit, useFallback]);

  const handlePlaying = () => {
    playbackStartedRef.current = true;
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime > 0.05) {
      playbackStartedRef.current = true;
    }
    if (v.currentTime >= BLUE_PHASE_TIME_S && !isBluePhase) {
      setIsBluePhase(true);
    }
  };

  return (
    <div
      className={[
        'pantera-intro-overlay fixed inset-0 z-[90]',
        isBluePhase ? 'pantera-intro-overlay--blue' : '',
        isExiting ? 'pantera-intro-overlay--exiting' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label="PANTERA Intro"
    >
      <div className="pantera-intro-blue-bg" aria-hidden="true" />

      <div className="pantera-intro-stage">
        {!useFallback ? (
          <video
            ref={videoRef}
            src={INTRO_VIDEO_SRC}
            poster="/intro/PANTERA_blue.png"
            autoPlay
            muted
            playsInline
            preload="auto"
            onPlaying={handlePlaying}
            onTimeUpdate={handleTimeUpdate}
            onEnded={triggerExit}
            onError={() => setUseFallback(true)}
            className="pantera-intro-video"
          />
        ) : (
          <div className="pantera-intro-fallback">
            <div className="flex items-center justify-center gap-1.5">
              <img
                src={isBluePhase ? '/intro/PANTERA_white.png' : '/intro/PANTERA_blue.png'}
                alt="PANTERA"
                className="h-14 w-auto object-contain sm:h-16"
              />
              <span className="-translate-y-0.5 text-4xl font-black uppercase tracking-[0.035em] sm:text-5xl">
                ANTERA
              </span>
            </div>
            <p
              className={`mt-2.5 text-xs font-semibold tracking-[0.04em] sm:text-sm ${
                isBluePhase ? 'text-white/90' : 'text-slate-600'
              }`}
            >
              Pemantauan Arsip Termin Risiko
            </p>
            <div
              className={`my-4 h-0.5 w-32 rounded-full ${
                isBluePhase
                  ? 'bg-gradient-to-r from-transparent via-white/80 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-[#1877F2]/50 to-transparent'
              }`}
            />
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.35em] ${
                isBluePhase ? 'text-white/75' : 'text-slate-500'
              }`}
            >
              POWERED BY
            </span>
            <img
              src={isBluePhase ? '/intro/DJASIPA_white.png' : '/intro/DJASIPA_blue.png'}
              alt="DMP"
              className="mt-2 h-7 w-auto object-contain sm:h-8"
            />
            <p
              className={`mt-1.5 text-xs font-semibold sm:text-sm ${
                isBluePhase ? 'text-white/95' : 'text-slate-800'
              }`}
            >
              PT Djasipa Mitra Perkasa
            </p>
          </div>
        )}

        {/* Teks brand tersembunyi untuk pembaca layar saat video aktif */}
        {!useFallback && (
          <div className="sr-only">
            <span>PANTERA</span>
            <span>ANTERA</span>
            <span>Pemantauan Arsip Termin Risiko</span>
            <span>POWERED BY</span>
            <span>PT Djasipa Mitra Perkasa</span>
          </div>
        )}

        <button
          type="button"
          onClick={finishImmediate}
          className={`pantera-skip-btn ${showSkip ? 'pantera-skip-btn--visible' : ''}`}
          aria-label="Lewati animasi intro"
        >
          Lewati
        </button>
      </div>
    </div>
  );
}
