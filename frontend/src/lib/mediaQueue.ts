/* Orders the landing page's media downloads on a shared connection:
     1. the hero video, until it can play through without stopping
     2. then every section poster (small stills), so a section never shows the blur placeholder
     3. once the hero video has fully downloaded, each section video in page order, one at a
        time, the next starting when the previous one is fully downloaded, so a clip is
        usually buffered before anyone scrolls to it
   A clip that comes close to the viewport before its turn loads straight away (see
   BackgroundVideo). */

type Fn = () => void;

let postersAllowed = false;
let heroDone = false;
const posterWaiters = new Set<Fn>();
const videoQueue: Fn[] = []; // starters, in the order the sections mounted (= page order)
let current: Fn | null = null;

function startNext() {
  if (!heroDone || current) return;
  current = videoQueue.shift() ?? null;
  current?.();
}

export function allowPosters() {
  if (postersAllowed) return;
  postersAllowed = true;
  posterWaiters.forEach(f => f());
  posterWaiters.clear();
}

// The hero video has fully downloaded (or there isn't one): posters and section videos may go
export function heroDownloaded() {
  allowPosters();
  if (heroDone) return;
  heroDone = true;
  startNext();
}

export function whenPostersAllowed(f: Fn): Fn {
  if (postersAllowed) { f(); return () => {}; }
  posterWaiters.add(f);
  return () => { posterWaiters.delete(f); };
}

// Queues a section video; `start` runs on its turn. Call `done` once it has downloaded (or no
// longer needs the connection) to hand over to the next one; `cancel` when it unmounts.
export function queueVideo(start: Fn): { done: Fn; cancel: Fn } {
  videoQueue.push(start);
  startNext();
  const release = () => {
    const i = videoQueue.indexOf(start);
    if (i >= 0) videoQueue.splice(i, 1);
    if (current === start) { current = null; startNext(); }
  };
  return { done: release, cancel: release };
}
