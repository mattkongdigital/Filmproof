import Link from 'next/link';
import { CookieSettingsLink } from './cookie-consent';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="foot-note">
        Prices are shop list prices per roll, with multipacks divided out. Loyalty points,
        basket and checkout discounts, and delivery are not included. Prices update daily and
        may be out of date, always confirm on the shop's own page before buying.{' '}
        <Link href="/how-it-works">How it works →</Link>
      </div>
      <nav className="foot-links">
        <Link href="/how-it-works">How it works</Link>
        <Link href="/about">About</Link>
        <Link href="/disclosure">Advertising</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <CookieSettingsLink />
      </nav>
      <div className="foot-legal">
        © {year} Filmproof. An independent film stock &amp; price tracker, not affiliated with any retailer or manufacturer.
      </div>
    </footer>
  );
}
