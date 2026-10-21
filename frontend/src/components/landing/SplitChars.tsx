import { Fragment } from 'react';

// Fixed pseudo-random order, so the letters scatter the same way on every visit
const delayFor = (seed: number, i: number, spread: number) =>
  Math.round((((seed * 9301 + i * 49297 + 233) % 233280) / 233280) * spread);

interface Props {
  text: string;
  play: boolean;
  seed?: number;
  spread?: number;
  className?: string;
}

// A line whose letters fade in one at a time in a scattered order. Words stay unbroken, and
// the parent heading carries the readable text in its aria-label.
export default function SplitChars({ text, play, seed = 1, spread = 700, className = '' }: Props) {
  let i = 0;
  return (
    <span aria-hidden="true" className={className}>
      {text.split(' ').map((word, w) => (
        <Fragment key={w}>
          {w > 0 && ' '}
          <span className="inline-block whitespace-nowrap">
            {[...word].map(ch => {
              const n = i++;
              return (
                <span key={n} className={`inline-block ${play ? 'animate-char' : 'opacity-0'}`}
                  style={{ animationDelay: `${delayFor(seed, n, spread)}ms` }}>
                  {ch}
                </span>
              );
            })}
          </span>
        </Fragment>
      ))}
    </span>
  );
}
