// Your Google Analytics 4 Measurement ID, e.g. 'G-ABC123XYZ'.
// Find it in GA4 → Admin → Data streams → your stream → Measurement ID.
//
// Leave it empty to disable analytics AND the cookie banner entirely (no cookies,
// no consent needed). The moment you set a real ID, GA4 + the consent banner turn on.
//
// TODO: paste your GA4 ID between the quotes below (or set NEXT_PUBLIC_GA_ID at build time).
export const GA_ID = (process.env.NEXT_PUBLIC_GA_ID || 'G-8C380879BJ').trim();

// Filmproof's own social accounts, linked from the site menu. The Instagram
// share link's `xtok` token is a tracking param, so it is left off.
export const SOCIAL_LINKS = [
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/filmproof.co.uk/' },
  { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61595584082780' },
];
