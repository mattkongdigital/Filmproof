import { notFound } from 'next/navigation';
import { resolveCategory, categoryParams, filmsFor, TYPES, FORMATS } from '../../lib/facets';
import { FilmBrowser } from '../../components/film-browser';
import { Breadcrumbs } from '../../components/breadcrumbs';
import { SITE_URL, getFilms } from '../../lib/data';
import Link from 'next/link';

export function generateStaticParams() {
  return categoryParams();
}

export function generateMetadata({ params }) {
  const cat = resolveCategory(params.category);
  if (!cat) return {};
  const title = `${cap(cat.heading)} | Never run out, UK stock & prices`;
  return {
    title,
    description: `Find ${cat.heading} in stock across UK shops and restock before you run out. Live prices per roll, updated daily.`,
    alternates: { canonical: `${SITE_URL}/${params.category}` },
  };
}

export default function CategoryPage({ params }) {
  const cat = resolveCategory(params.category);
  if (!cat) notFound();

  const films = filmsFor(cat.match);

  // Cross-links to combos that actually have films (never a dead link).
  const axisName = cat.kind === 'format' ? 'type' : 'format';
  const crossLinks = (cat.kind === 'format'
    ? TYPES.map((t) => ({ href: `/${params.category}/${t.short}`, label: t.label, match: (f) => cat.match(f) && t.match(f) }))
    : FORMATS.filter((f) => f.roll).map((f) => ({ href: `/${f.slug}/${slugType(params.category)}`, label: f.label, match: (x) => cat.match(x) && f.match(x) }))
  ).map((l) => ({ ...l, count: getFilms().filter(l.match).length })).filter((l) => l.count > 0);

  return (
    <div className="wrap">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: cap(cat.heading) }]} />
      <header className="cat-head">
        <div className="eyebrow">{cat.kind === 'format' ? 'By format' : 'By type'}</div>
        <h1>{cap(cat.heading)}</h1>
        <p className="lede">
          Every {cat.heading} we track, in stock across UK shops, with live prices per roll.
          {' '}<strong>{films.length}</strong> stock{films.length === 1 ? '' : 's'} listed.
        </p>
      </header>

      {crossLinks.length > 0 && (
        <div className="facet-links">
          <span className="facet-links-head">Browse {cat.label} by {axisName}</span>
          <div className="facet-axes">
            <div className="axis">
              <span className="axis-label">{cap(axisName)}</span>
              <span className="chip current" aria-current="page">
                All <span className="chip-count">{films.length}</span>
              </span>
              {crossLinks.map((l) => (
                <Link key={l.href} href={l.href} className="chip">
                  {l.label} <span className="chip-count">{l.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <FilmBrowser films={films} hideAxes={[cat.kind === 'format' ? 'typ' : 'fmt']} />

    </div>
  );
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const slugType = (categorySlug) => (TYPES.find((t) => t.slug === categorySlug) || {}).short;
