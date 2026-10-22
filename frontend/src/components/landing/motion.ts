import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* GSAP motion for the landing page:
     data-split      heading letters (pre-split by SplitHeading) fade in out of a blur, in a
                     scattered order, as the heading scrolls into view
     data-parallax   media drifts against the scroll (value = percent of its height)
   and the hero (outside the scope) eases back as the page scrolls past it.
   One-shot slide-ins and counters live in reveal.ts.

   Elements that share a parent drift on one timeline with one trigger, so there are only a
   handful of triggers to measure. This module is loaded once the browser is idle after the
   sections render; headings already on screen by then are left as they are, so nothing
   blinks out. Nothing runs for reduced motion. Returns a function that undoes it all. */
export function setupLandingMotion(scope: HTMLElement): () => void {
  const mm = gsap.matchMedia(scope);

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // Read positions first, then animate, so the layout is measured once
    const fold = window.innerHeight;
    const headings = gsap.utils.toArray<HTMLElement>('[data-split]').filter(el => el.getBoundingClientRect().top > fold);

    headings.forEach(el => {
      gsap.from(el.querySelectorAll('.split-char'), {
        opacity: 0, filter: 'blur(8px)', duration: 0.9, ease: 'power2.out',
        stagger: { each: 0.018, from: 'random' },
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });

    const groups = new Map<Element, HTMLElement[]>();
    gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach(el => {
      const parent = el.parentElement ?? el;
      groups.set(parent, [...(groups.get(parent) ?? []), el]);
    });

    groups.forEach((els, parent) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: parent, start: 'top bottom', end: 'bottom top', scrub: true } });
      els.forEach(el => {
        const amount = Number(el.dataset.parallax) || 8;
        tl.fromTo(el, { yPercent: -amount }, { yPercent: amount, ease: 'none' }, 0);
      });
    });

    const hero = document.querySelector<HTMLElement>('[data-hero]');
    const media = hero?.querySelector('[data-hero-media]');
    const title = hero?.querySelector('[data-hero-title]');
    if (hero && media && title) {
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
        .to(media, { scale: 1.12, ease: 'none' }, 0)
        .to(title, { yPercent: -35, ease: 'none' }, 0);
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
