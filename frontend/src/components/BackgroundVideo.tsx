import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { VideoSet } from '../lib/media';
import { connectionTier, prefersReducedMotion, prefersSmallMedia } from '../lib/net';
import { allowPosters, heroDownloaded, queueVideo, whenPostersAllowed } from '../lib/mediaQueue';

interface Props {
  video: VideoSet;
  className?: string;
  eager?: boolean;
  label?: string;
}

const fullyBuffered = (v: HTMLVideoElement) =>
  v.duration > 0 && v.buffered.length > 0 && v.buffered.end(v.buffered.length - 1) >= v.duration - 0.25;

// Ambient looping video that never shows a blank frame, a frozen frame or a stutter: an inline
// blur paints instantly, the poster fades in over it, and the video crossfades in only once the
// whole file has downloaded AND it is visibly moving. If its frames stop (the decoder falling
// behind on a busy machine, which the browser doesn't always report), it fades back to the
// poster until it has moved smoothly for a second. (The browser's "can play through" guess was
// not enough on its own: it fails as soon as another download starts.)
// Downloads are ordered by lib/mediaQueue: the hero first, then section posters, then section
// videos one by one in the background, so they are ready before the visitor scrolls to them.
// A clip close to the viewport loads straight away. Clips play only while visible; 2G / Data
// Saver and reduced-motion visitors get the still poster, and 3G skips the background downloads.
export default function BackgroundVideo({ video, className = '', eager = false, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const [small] = useState(prefersSmallMedia);
  const [allowVideo] = useState(() => !prefersReducedMotion() && connectionTier() !== 'none');
  const [near, setNear] = useState(eager);           // close to the viewport (the hero always is)
  const [posterTurn, setPosterTurn] = useState(eager);
  const [videoTurn, setVideoTurn] = useState(false); // its turn in the background queue
  const [posterShown, setPosterShown] = useState(false);
  const [posterSettled, setPosterSettled] = useState(false); // loaded, or failed to load
  const [moving, setMoving] = useState(false);     // playing, and its frames are advancing
  const [complete, setComplete] = useState(false);  // the whole file is downloaded
  const queued = useRef<ReturnType<typeof queueVideo> | null>(null);

  const poster = small ? video.posterSm : video.posterLg;
  const src = small ? video.sm : video.lg;
  const wantPoster = near || posterTurn;
  // The still comes first: a section's video only starts downloading once its poster is in, so
  // the poster is never slowed down by the much larger video
  const wantVideo = allowVideo && (eager || ((near || videoTurn) && posterSettled));

  // A poster that's already cached (e.g. preloaded by index.html) shows at once, with no fade
  useLayoutEffect(() => {
    const img = posterRef.current;
    if (wantPoster && img?.complete && img.naturalWidth) { setPosterShown(true); setPosterSettled(true); }
  }, [wantPoster]);

  // The hero sets the pace: nothing else downloads in the background until it has fully
  // downloaded (anything sooner made its last seconds stall). Without a hero video, or if it is
  // very slow, timers take over.
  useEffect(() => {
    if (!eager) return;
    if (!allowVideo) { heroDownloaded(); return; }
    const p = window.setTimeout(allowPosters, 8000);
    const v = window.setTimeout(heroDownloaded, 12000);
    return () => { window.clearTimeout(p); window.clearTimeout(v); };
  }, [eager, allowVideo]);

  useEffect(() => {
    if (eager) return;
    return whenPostersAllowed(() => setPosterTurn(true));
  }, [eager]);

  // Background download of section videos, on full-speed connections only
  useEffect(() => {
    if (eager || !allowVideo || connectionTier() !== 'full') return;
    const q = queueVideo(() => setVideoTurn(true));
    queued.current = q;
    return () => { q.cancel(); queued.current = null; };
  }, [eager, allowVideo]);

  // Close to the viewport before its turn: load now
  useEffect(() => {
    if (near) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setNear(true); io.disconnect(); }
    }, { rootMargin: '900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  // Play only while on screen and the tab is visible
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !wantVideo) return;
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden) v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.01 });
    io.observe(v);
    document.addEventListener('visibilitychange', sync);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, [wantVideo]);

  // Watchdog: shown only while frames keep advancing. 0.3s of steady motion to fade in; a stop of
  // over 0.4s fades it out; after a stop, a full second of motion before it fades back in.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !wantVideo) return;
    let lastT = v.currentTime, lastMove = 0, movingSince = 0, needed = 300;
    const id = window.setInterval(() => {
      const now = performance.now();
      if (v.paused || document.hidden) { movingSince = 0; setMoving(false); return; }
      if (v.currentTime !== lastT) { lastT = v.currentTime; lastMove = now; if (!movingSince) movingSince = now; }
      if (now - lastMove > 400) {
        if (movingSince) needed = 1000;
        movingSince = 0;
        setMoving(false);
      } else if (movingSince && now - movingSince >= needed) setMoving(true);
    }, 100);
    return () => window.clearInterval(id);
  }, [wantVideo]);

  // Hand the connection on once the whole file is in, or once the browser has deliberately
  // stopped downloading it (it buffers no further while paused). "Can play through" alone is
  // not enough: the rest of the file is still downloading then.
  const onLoadProgress = (e?: { type: string }) => {
    const v = videoRef.current;
    if (!v) return;
    const stopped = e?.type === 'suspend' && v.networkState === HTMLMediaElement.NETWORK_IDLE && v.readyState >= 3;
    const all = fullyBuffered(v);
    if (all) setComplete(true);
    if (!all && !stopped) return;
    if (eager) heroDownloaded();
    else queued.current?.done();
  };

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <img src={video.blur} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <img
        ref={posterRef}
        src={wantPoster ? poster : undefined}
        alt=""
        aria-hidden="true"
        decoding="async"
        // High priority when on screen soon; low when it is only being fetched in the background
        fetchPriority={eager || near ? 'high' : 'low'}
        onLoad={() => { setPosterShown(true); setPosterSettled(true); }}
        onError={() => setPosterSettled(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${posterShown ? 'opacity-100' : 'opacity-0'}`}
      />
      {wantVideo && (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          // The hero starts at once; section clips are started when they come on screen
          autoPlay={eager}
          preload="auto"
          onCanPlayThrough={onLoadProgress}
          onProgress={onLoadProgress}
          onSuspend={onLoadProgress}
          onTimeUpdate={complete ? undefined : onLoadProgress}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${moving && complete ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}
