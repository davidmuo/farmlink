export const greeting = (d = new Date()) => {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const firstName = (name?: string | null) => {
  if (!name) return '';
  const parts = name.replace(/^(dr|mr|mrs|ms|chief|prof)\.?\s+/i, '').split(/\s+/);
  return parts[0] ?? '';
};
