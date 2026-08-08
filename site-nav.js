import Link from 'next/link';
import { availableFormats, availableTypes } from '../lib/facets';
import { SearchBox } from './search-box';

export function SiteNav() {
  const formats = availableFormats();
  const types = availableTypes();

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">Filmproof</Link>
      <SearchBox />
      <div className="nav-groups">
        <div className="nav-group">
          <span className="nav-head">Format</span>
          {formats.map((f) => <Link key={f.slug} href={`/${f.slug}`}>{f.label}</Link>)}
        </div>
        <div className="nav-group">
          <span className="nav-head">Type</span>
          {types.map((t) => <Link key={t.slug} href={`/${t.slug}`}>{t.label}</Link>)}
        </div>
        <div className="nav-group">
          <span className="nav-head"><Link href="/brands">Brands</Link></span>
        </div>
      </div>
    </nav>
  );
}
