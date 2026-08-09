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
    default: 'Filmproof — compare film stock & prices across UK shops',
    template: '%s | Filmproof',
  },
  description: 'Track camera film across UK shops — see what’s in stock and compare prices per roll, so you never run out.',
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
