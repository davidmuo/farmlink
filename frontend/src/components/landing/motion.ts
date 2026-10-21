import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* Scroll-driven motion for the landing page, attached with data attributes:
     data-rise       a block slides up into place
     data-stagger    each child slides up, one after another
     data-parallax   media drifts against the scroll (value = percent of its height)
     data-count      a number counts up from zero
   The hero (outside the scope) eases back as the page scrolls past it. Headings animate on
   their own (SplitHeading).

   This module is loaded and run once the browser is idle after the sections render, so it
   never holds up the first paint. Anything already on screen by then is left as it is, so
   nothing blinks out and back in. Nothing runs for visitors who prefer reduced motion.
   Returns a function that undoes everything. */
export function setupLandingMotion(scope: HTMLElement): () => void {
  const mm = gsap.matchMedia(scope);

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // Read every position first, then write, so the layout is measured once
    const fold = window.innerHeight;
    const below = (els: HTMLElement[]) => els.filter(el => el.getBoundingClientRect().top > fold);
    const rise = below(gsap.utils.toArray<HTMLElement>('[data-rise]'));
    const groups = below(gsap.utils.toArray<HTMLElement>('[data-stagger]'));
    const counts = below(gsap.utils.toArray<HTMLElement>('[data-count]'));
    const drift = gsap.utils.toArray<HTMLElement>('[data-parallax]');
    const once = (trigger: Element, start = 'top 88%') => ({ trigger, start, once: true });

    rise.forEach(el => {
      gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: once(el, 'top 90%') });
    });

    groups.forEach(group => {
      gsap.from(group.children, { y: 56, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12, scrollTrigger: once(group) });
    });

    counts.forEach(el => {
      const value = { n: 0 };
      const end = Number(el.dataset.count);
      el.textContent = '0';
      gsap.to(value, {
        n: end, duration: 1.6, ease: 'power2.out', scrollTrigger: once(el, 'top 92%'),
        onUpdate: () => { el.textContent = Math.round(value.n).toLocaleString(); },
      });
    });

    drift.forEach(el => {
      const amount = Number(el.dataset.parallax) || 8;
      gsap.fromTo(el, { yPercent: -amount }, {
        yPercent: amount, ease: 'none',
        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    const hero = document.querySelector<HTMLElement>('[data-hero]');
    const media = hero?.querySelector('[data-hero-media]');
    const title = hero?.querySelector('[data-hero-title]');
    if (hero && media && title) {
      const leaving = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to(media, { scale: 1.12, ease: 'none', scrollTrigger: leaving });
      gsap.to(title, { yPercent: -35, ease: 'none', scrollTrigger: leaving });
    }
  });

  // Trigger positions depend on fonts and images, so measure again once they have settled
  let live = true;
  document.fonts?.ready.then(() => { if (live) ScrollTrigger.refresh(); });

  return () => {
    live = false;
    mm.revert();
  };
}
