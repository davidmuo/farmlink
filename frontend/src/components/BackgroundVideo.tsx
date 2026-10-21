import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { VideoSet } from '../lib/media';
import { connectionTier, prefersReducedMotion, prefersSmallMedia } from '../lib/net';

interface Props {
  video: VideoSet;
  className?: string;
  eager?: boolean;
  label?: string;
}

// Ambient looping video that never shows a blank frame: an inline blur paints instantly,
// the poster fades in over it, and the video crossfades in only once it is actually playing.
// Off-screen clips don't download until they're close to the viewport, play only while
// visible, and visitors on 2G / Data Saver or with reduced motion get the still poster.
export default function BackgroundVideo({ video, className = '', eager = false, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const [small] = useState(prefersSmallMedia);
  const [allowVideo] = useState(() => !prefersReducedMotion() && connectionTier() !== 'none');
  const [near, setNear] = useState(eager);
  const [posterShown, setPosterShown] = useState(false);
  const [playing, setPlaying] = useState(false);

  const poster = small ? video.posterSm : video.posterLg;
  const src = small ? video.sm : video.lg;

  // A poster that's already cached (e.g. preloaded by index.html) shows at once, with no fade
  useLayoutEffect(() => {
    const img = posterRef.current;
    if (near && img?.complete && img.naturalWidth) setPosterShown(true);
  }, [near]);

  // Off-screen clips fetch nothing, not even the poster, until they're close to the viewport.
  // (Browsers start lazy images up to ~2500px early, which is too soon on a long page.)
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

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !near) return;
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden) v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.01 });
    io.observe(v);
    document.addEventListener('visibilitychange', sync);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, [near]);

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <img src={video.blur} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <img
        ref={posterRef}
        src={near ? poster : undefined}
        alt=""
        aria-hidden="true"
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        onLoad={() => setPosterShown(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${posterShown ? 'opacity-100' : 'opacity-0'}`}
      />
      {allowVideo && near && (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          autoPlay
          preload={eager ? 'auto' : 'metadata'}
          onPlaying={() => setPlaying(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${playing ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}
