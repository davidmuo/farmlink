/* One-shot reveals for the landing page, without GSAP:
     data-rise       a block slides up into place
     data-stagger    each child slides up, one after another
     data-count      a number counts up from zero
   Only elements still below the fold are prepared, so nothing on screen blinks out and back.
   The movement itself is a CSS transition (.reveal in index.css), which the browser runs off
   the main thread. Nothing runs for visitors who prefer reduced motion. Returns a cleanup. */
export function setupReveals(scope: HTMLElement): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const items: { el: HTMLElement; delay: number }[] = [];
  scope.querySelectorAll<HTMLElement>('[data-rise]').forEach(el => items.push({ el, delay: 0 }));
  scope.querySelectorAll<HTMLElement>('[data-stagger]').forEach(group => {
    Array.from(group.children).forEach((child, i) => items.push({ el: child as HTMLElement, delay: i * 120 }));
  });
  const counters = Array.from(scope.querySelectorAll<HTMLElement>('[data-count]'));

  // Read every position first, then write, so the layout is measured once
  const fold = window.innerHeight;
  const pending = items.filter(({ el }) => el.getBoundingClientRect().top > fold);
  const pendingCounters = counters.filter(el => el.getBoundingClientRect().top > fold);

  pending.forEach(({ el, delay }) => {
    el.classList.add('reveal');
    if (delay) el.style.transitionDelay = `${delay}ms`;
  });
  pendingCounters.forEach(el => { el.textContent = '0'; });

  const frames: number[] = [];
  const countUp = (el: HTMLElement) => {
    const end = Number(el.dataset.count), start = performance.now(), duration = 1600;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(end * (1 - (1 - k) * (1 - k))).toLocaleString();
      if (k < 1) frames.push(requestAnimationFrame(tick));
    };
    frames.push(requestAnimationFrame(tick));
  };

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target as HTMLElement;
    if (el.dataset.count) countUp(el); else el.classList.add('revealed');
    io.unobserve(el);
  }), { rootMargin: '0px 0px -10% 0px' });
  pending.forEach(({ el }) => io.observe(el));
  pendingCounters.forEach(el => io.observe(el));

  return () => {
    io.disconnect();
    frames.forEach(cancelAnimationFrame);
  };
}
