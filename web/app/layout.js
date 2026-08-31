import './globals.css';
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { SiteNav } from '../components/site-nav';
import { SiteFooter } from '../components/site-footer';
import { Analytics } from '../components/analytics';
import { CookieConsent } from '../components/cookie-consent';
import { SITE_URL } from '../lib/data';

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' });

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
