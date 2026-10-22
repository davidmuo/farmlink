export const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'For buyers',   href: '#for-buyers'   },
  { label: 'For farmers',  href: '#for-farmers'  },
  { label: 'Any phone',    href: '#any-phone'    },
];

// Content runs to a small gutter at the screen edges rather than a centred column
export const edge = 'px-5 md:px-8 xl:px-10';

// Scroll to a section without putting #section in the address bar: a hash left there would make
// the next reload jump straight past the hero
export function scrollToSection(hash: string, smooth = true) {
  document.querySelector(hash)?.scrollIntoView({ behavior: smooth ? 'smooth' : ('instant' as ScrollBehavior) });
}

export interface SectionTarget { hash: string; smooth: boolean }
