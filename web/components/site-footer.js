import Link from 'next/link';
import { CookieSettingsLink } from './cookie-consent';
import { SILOS } from '../lib/posts';
import { liveOpportunities } from '../lib/opportunities';
import { SOCIAL_LINKS } from '../lib/config';
import { SOCIAL_ICONS } from './social-icons';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="foot-note">
        Prices are shop list prices per roll (per pack for instant film, per sheet for sheet
        film), with multipacks divided out. Loyalty points,
        basket and checkout discounts, and delivery are not included. Prices update daily and
        may be out of date, always confirm on the shop's own page before buying.{' '}
        <Link href="/how-it-works">How it works →</Link>
      </div>
      <nav className="foot-links">
        <Link href="/how-it-works">How it works</Link>
        <Link href="/about">About</Link>
        {/* Iterated rather than hard-coded, so a new silo appears here the way it
            already appears in the sitemap — one entry in SILOS, nothing else. */}
        {SILOS.map((silo) => (
          <Link key={silo.slug} href={`/${silo.slug}`}>{silo.label}</Link>
        ))}
        {/* Same rule as the sitemap: linked only while there is something on it. */}
        {liveOpportunities().length > 0 && <Link href="/opportunities">Opportunities</Link>}
        <Link href="/disclosure">Advertising</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <CookieSettingsLink />
      </nav>
      <div className="foot-social">
        {SOCIAL_LINKS.map((s) => (
          <a key={s.id} href={s.href} target="_blank" rel="me noopener">
            {SOCIAL_ICONS[s.id]} {s.label}
          </a>
        ))}
      </div>
      <div className="foot-legal">
        © {year} Filmproof. An independent film stock &amp; price tracker, not affiliated with any retailer or manufacturer.
      </div>
    </footer>
  );
}
