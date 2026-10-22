import { RefObject, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* Scroll-driven motion for the landing page, attached with data attributes:
     data-split      heading letters fade in out of a blur, in a scattered order (the letters
                     are split in the markup by SplitHeading, so nothing is measured on load)
     data-rise       a block slides up into place
     data-stagger    each child slides up, one after another
     data-parallax   media drifts against the scroll (value = percent of its height)
     data-count      a number counts up from zero
   The hero (outside the root) eases back as the page scrolls past it.
   Nothing runs for visitors who prefer reduced motion. */
export function useLandingMotion(root: RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const mm = gsap.matchMedia(scope);

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const once = (trigger: Element, start = 'top 85%') => ({ trigger, start, once: true });

      gsap.utils.toArray<HTMLElement>('[data-split]').forEach(el => {
        gsap.from(el.querySelectorAll('.split-char'), {
          opacity: 0, filter: 'blur(8px)', duration: 0.9, ease: 'power2.out',
          stagger: { each: 0.018, from: 'random' }, scrollTrigger: once(el),
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-rise]').forEach(el => {
        gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: once(el, 'top 90%') });
      });

      gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach(group => {
        gsap.from(group.children, {
          y: 56, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12, scrollTrigger: once(group),
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach(el => {
        const amount = Number(el.dataset.parallax) || 8;
        gsap.fromTo(el, { yPercent: -amount }, {
          yPercent: amount, ease: 'none',
          scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-count]').forEach(el => {
        const end = Number(el.dataset.count);
        const value = { n: 0 };
        el.textContent = '0';
        gsap.to(value, {
          n: end, duration: 1.6, ease: 'power2.out', scrollTrigger: once(el, 'top 92%'),
          onUpdate: () => { el.textContent = Math.round(value.n).toLocaleString(); },
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
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => {
      mm.revert();
      window.removeEventListener('load', refresh);
    };
  }, [root]);
}
