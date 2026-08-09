import Link from 'next/link';
import { availableFormats, availableTypes } from '../lib/facets';

// Rendered for any unknown URL. With `output: 'export'` this becomes 404.html,
// which GitHub Pages serves for missing paths. The root layout supplies the nav
// and footer. Links are built from the live facets so a 404 never sends someone
// on to another dead end.
export default function NotFound() {
  const formats = availableFormats().slice(0, 6);
  const types = availableTypes();

  return (
    <div className="wrap doc">
      <div className="nf-code">404</div>
      <h1>This frame came out blank</h1>
      <p className="lead">
        We couldn't find that page — it may have moved, or the link might be slightly off.
        Everything we track is still here, so pick up where you left off below.
      </p>

      <p>
        <Link href="/" className="nf-back">← Back to the homepage</Link>
      </p>

      <h2 className="nf-section">Browse by format</h2>
      <div className="chips">
        {formats.map((f) => (
          <Link key={f.slug} href={`/${f.slug}`} className="chip">{f.label}</Link>
        ))}
      </div>

      <h2 className="nf-section">Browse by type</h2>
      <div className="chips">
        {types.map((t) => (
          <Link key={t.slug} href={`/${t.slug}`} className="chip">{t.label}</Link>
        ))}
      </div>

      <h2 className="nf-section">Or</h2>
      <div className="chips">
        <Link href="/brands" className="chip">All brands</Link>
        <Link href="/how-it-works" className="chip">How it works</Link>
      </div>
    </div>
  );
}
