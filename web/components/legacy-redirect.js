import Link from 'next/link';
import { SITE_URL } from '../lib/data';

// A URL that used to be its own film page and now belongs to another. There is
// no server to send a 301 — the site is a static export on Pages — so the page
// does the next best thing: a canonical pointing at the survivor (set by the
// route's metadata, which is what search engines actually consolidate on), a
// script that replaces the history entry so Back does not bounce, and readable
// copy for anyone who arrives with JS off.
export function LegacyRedirect({ to, label }) {
  const href = `/film/${to}/`;
  return (
    <div className="wrap doc">
      <script
        dangerouslySetInnerHTML={{
          // replace(), not assign(): the old URL should not sit in history for
          // Back to land on and redirect again.
          __html: `window.location.replace(${JSON.stringify(`${SITE_URL}${href}`)});`,
        }}
      />
      <div className="nf-code">Moved</div>
      <h1>This film has one page now</h1>
      <p className="lead">
        {label} was listed twice under slightly different names. Both listings now
        share a single page, and you should be on your way there already.
      </p>
      <p>
        <Link href={href} className="nf-back">Continue to {label} →</Link>
      </p>
    </div>
  );
}
