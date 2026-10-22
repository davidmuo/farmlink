import { ElementType, Fragment } from 'react';

interface Props {
  as?: ElementType;
  lines: string[];
  className?: string;
}

// A heading split into letters in the markup. GSAP (motion.ts) fades the letters in out of a
// blur, in a scattered order, as the heading scrolls into view. Splitting here rather than with
// SplitText means the browser doesn't have to measure every letter when the page loads.
// Without GSAP (reduced motion, or before it loads) the heading simply shows.
export default function SplitHeading({ as: Tag = 'h2', lines, className = '' }: Props) {
  return (
    <Tag aria-label={lines.join(' ')} data-split="" className={className}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <span aria-hidden="true">
            {line.split(' ').map((word, w) => (
              <Fragment key={w}>
                {w > 0 && ' '}
                <span className="inline-block whitespace-nowrap">
                  {[...word].map((ch, c) => <span key={c} className="split-char inline-block">{ch}</span>)}
                </span>
              </Fragment>
            ))}
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}
