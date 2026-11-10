import './globals.css';
import localFont from 'next/font/local';
import { SiteNav } from '../components/site-nav';
import { SiteFooter } from '../components/site-footer';
import { Analytics } from '../components/analytics';
import { CookieConsent } from '../components/cookie-consent';
import { SITE_URL } from '../lib/data';

// Fonts are committed under ./fonts (Latin subset, from Fontsource, SIL OFL)
// rather than loaded with next/font/google, which downloads them from Google
// Fonts during every build: a bad response there failed a deploy outright.
// next/font needs every option written out literally, hence the repetition.
const display = localFont({
  src: [
    { path: './fonts/space-grotesk-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/space-grotesk-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/space-grotesk-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
});
const body = localFont({
  src: [
    { path: './fonts/ibm-plex-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/ibm-plex-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
});
// Fallback metrics are matched against Arial by default, which suits the two
// sans faces but not a monospace one.
const mono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/ibm-plex-mono-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
  adjustFontFallback: false,
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Filmproof | Never run out of film, UK stock & price tracker',
    template: '%s | Filmproof',
  },
  description: 'Track camera film across UK shops, see what\'s in stock, compare prices per roll, and restock before you run out.',
  // Defaults for every page. A page that has a picture worth sharing — a film
  // with a product shot, a field note with a frame — overrides `images` in its
  // own generateMetadata; the rest inherit title and description alone.
  // Deliberately no `url` here: it is not inheritable. A default would make
  // every page that does not set its own claim to be the homepage, which is
  // worse than omitting it — a scraper with no og:url just uses the URL it
  // fetched. Pages that care set their own.
  openGraph: {
    type: 'website',
    siteName: 'Filmproof',
    locale: 'en_GB',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <Analytics />
        <SiteNav />
        {children}
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
