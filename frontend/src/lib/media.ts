// Imagery for the UI. Photos are served from the Pexels CDN (free to use under the
// Pexels licence); the landing-page videos are trimmed Pexels clips bundled in /public/media.
// `auto=format` lets the CDN answer with AVIF/WebP when the browser supports it.

export const pexels = (id: number, w: number, h?: number, opts = '') =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress,format&cs=tinysrgb&w=${w}${h ? `&h=${h}&fit=crop` : ''}${opts}`;

// Width-based srcset for large editorial photos
export const pexelsSrcSet = (id: number, widths = [640, 960, 1280, 1920]) =>
  widths.map(w => `${pexels(id, w)} ${w}w`).join(', ');

// 1x/2x srcset for fixed-size square images (avatars, crop thumbnails)
const squareSrcSet = (id: number, size: number, opts = '') =>
  `${pexels(id, size, size, opts)} 1x, ${pexels(id, size * 2, size * 2, opts)} 2x`;

/* ─── Profile photos ─────────────────────────────────────────── */

// Seeded demo accounts get a fixed portrait so they look the same everywhere.
const NAMED_PORTRAITS: Record<string, number> = {
  'emeka adeyemi':   36053652,
  'ngozi okonkwo':   29852895,
  'dr. segun bello': 5648100,
  'folake adesanya': 7805053,
  'emeka okafor':    33993456,
  'amaka nwosu':     31817572,
  'tunde adeyemi':   21222664,
  'farmlink admin':  3727508,
};

// Everyone else is assigned one of these deterministically from their name.
const PORTRAIT_POOL = [
  10476512, 12477590, 12898977, 26999324, 30182520, 36551042, 36786033, 5999894,
  7876506, 16001703, 16786653, 5584006, 34107697, 36134322, 39079996, 6077664,
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export function portraitId(name?: string | null): number {
  const key = (name || 'farmlink').trim().toLowerCase();
  return NAMED_PORTRAITS[key] ?? PORTRAIT_POOL[hash(key) % PORTRAIT_POOL.length];
}

export function avatarUrl(name: string | null | undefined, size = 96) {
  return pexels(portraitId(name), Math.round(size), Math.round(size), '&crop=top');
}

export function avatarSrcSet(name: string | null | undefined, size = 96) {
  return squareSrcSet(portraitId(name), Math.round(size), '&crop=top');
}

/* ─── Crop photos ────────────────────────────────────────────── */

const CROP_PHOTOS: Record<string, number> = {
  tomato:     40209261,
  tomatoes:   40209261,
  maize:      9362415,
  corn:       9362415,
  pepper:     17804809,
  peppers:    17804809,
  onion:      16701914,
  onions:     16701914,
  cabbage:    6316537,
  yam:        34143558,
  yams:       34143558,
  cassava:    7543161,
  plantain:   39049842,
  plantains:  39049842,
  okra:       39490207,
  watermelon: 18688799,
  cucumber:   17975573,
  cucumbers:  17975573,
  cowpea:     35553036,
  beans:      35553036,
  spinach:    38571502,
  carrot:     16812115,
  carrots:    16812115,
};

export function cropPhotoId(name?: string | null): number | null {
  if (!name) return null;
  return CROP_PHOTOS[name.trim().toLowerCase()] ?? null;
}

export function cropPhotoUrl(name: string | null | undefined, size = 96) {
  const id = cropPhotoId(name);
  return id ? pexels(id, Math.round(size), Math.round(size)) : null;
}

export function cropPhotoSrcSet(name: string | null | undefined, size = 96) {
  const id = cropPhotoId(name);
  return id ? squareSrcSet(id, Math.round(size)) : undefined;
}

/* ─── Editorial photography & video ──────────────────────────── */

export const PHOTOS = {
  lagosYams:      14881680, // Lagos street, yams on a wheelbarrow
  marketStall:    20432829, // Port Harcourt produce stall
  harvestBasket:  15897037, // Farmer carrying a harvest basket
  tomatoFarmer:   34705724, // Farmer holding fresh tomatoes
  cassavaHarvest: 36846177, // Cassava harvest team, Nigeria
  sacks:          29006128, // Farmer packing harvest sacks, Kaduna
};

// Each clip has a desktop (lg) and phone/slow-connection (sm) rendition, matching posters,
// and a tiny inline blur that shows before anything downloads. Filenames are content-hashed
// so they can be cached forever.
export interface VideoSet { lg: string; sm: string; posterLg: string; posterSm: string; blur: string; }

export const VIDEOS: Record<'hero' | 'supply' | 'farmer', VideoSet> = {
  hero: {
    lg: '/media/hero-lg.d6153472.mp4', sm: '/media/hero-sm.490a9ff1.mp4',
    posterLg: '/media/hero-poster-lg.dc0d7117.webp', posterSm: '/media/hero-poster-sm.31616f18.webp',
    blur: 'data:image/webp;base64,UklGRpQAAABXRUJQVlA4IIgAAADwAwCdASoYAAwAPu1iqU2ppaOiMAgBMB2JYgCsAYt8Zi2DRfuFEMgAAPJR5CWg8a9NUy1100IyNydr7JmAXkAruDwSSeCW6gQScmdKKP2FD2FsyVvFBSazDageN5GIgYoI/4l/DFpsrKohQBsVy43jT6RFqV7zyvXyCmBAZ3pRJdXSyM4fNAAA',
  },
  supply: {
    lg: '/media/supply-lg.e6c4572d.mp4', sm: '/media/supply-sm.35f5fd34.mp4',
    posterLg: '/media/supply-poster-lg.d2b5c25c.webp', posterSm: '/media/supply-poster-sm.90d9365c.webp',
    blur: 'data:image/webp;base64,UklGRsgAAABXRUJQVlA4ILwAAAAQBQCdASoYAB4APu1gq1AppSOisBgIATAdiWMAuwW0QMfKTwbZeNqQGEVTk0z+sWPoAP7axcmSImr5TFNUjvGHMI2mmfQad5jxzAaIp1viNUfb9qkK70BMtLXFlNF6y9zDWpYd8jIWtZt9sdJZvoP8PJb3/q7vddEWYc1LgWsv+S7DNEy4zG8fZMHax5mERjxf3iBuy7nWHGfHgGYsjGk1uuOc5V4kgM769WhMGfR14Ybc4ywCJcMruAAAAA==',
  },
  farmer: {
    lg: '/media/farmer-lg.624bb880.mp4', sm: '/media/farmer-sm.ce500c8a.mp4',
    posterLg: '/media/farmer-poster-lg.5ed4c13f.webp', posterSm: '/media/farmer-poster-sm.013f700c.webp',
    blur: 'data:image/webp;base64,UklGRtYAAABXRUJQVlA4IMoAAACQBQCdASoYAB4APu1qsFAppaSiqAqpMB2JZgC3uDTngRU7kooz8CErdYWoNeCALZR6S99+AAD+9NenPUTRfhmUubebT4ipj6XeXXx1OEzZ3kFDmkU7kD/AQDeYKSCddgW0+HQCx6BPHiWucGHsh7T+kPQ86g+O//CBA3rjikKLE9mR4q/lq6FlyPm7F2CUoWWbsVGR2m2Uv4KYLvVgjOap62ySXLhiw8tZHLPsmTkW+mtP/pCgElXb8uxjUECDEBIeJeSDj9n5rAAA',
  },
};
