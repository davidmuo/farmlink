import { ElementType, Fragment, useEffect, useRef, useState } from 'react';
import SplitChars from './SplitChars';

interface Props {
  as?: ElementType;
  lines: string[];
  className?: string;
  seed?: number;
}

// A heading whose letters fade in, in a scattered order, the first time it scrolls into view.
// The letters are split in the markup, so the browser has nothing to measure.
export default function SplitHeading({ as: Tag = 'h2', lines, className = '', seed = 1 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setPlay(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} aria-label={lines.join(' ')} className={className}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <SplitChars text={line} play={play} seed={seed + i * 7} spread={600} />
        </Fragment>
      ))}
    </Tag>
  );
}
