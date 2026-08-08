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
  const title = `${cap(cat.heading)} — cheapest UK prices compared`;
  return {
    title,
    description: `Compare live prices on ${cat.heading} from UK shops, ranked cheapest per roll. ${cap(cat.heading)} updated daily.`,
    alternates: { canonical: `${SITE_URL}/${params.category}` },
  };
}

export default function CategoryPage({ params }) {
  const cat = resolveCategory(params.category);
  if (!cat) notFound();

  const films = filmsFor(cat.match);

  // Cross-links to combos that actually have films (never a dead link).
  const crossLinks = (cat.kind === 'format'
    ? TYPES.map((t) => ({ href: `/${params.category}/${t.short}`, label: `${t.label} ${cat.label}`, match: (f) => cat.match(f) && t.match(f) }))
    : FORMATS.filter((f) => f.roll).map((f) => ({ href: `/${f.slug}/${slugType(params.category)}`, label: `${cat.label} ${f.label}`, match: (x) => cat.match(x) && f.match(x) }))
  ).filter((l) => getFilms().some(l.match));

  return (
    <div className="wrap">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: cap(cat.heading) }]} />
      <header className="cat-head">
        <div className="eyebrow">{cat.kind === 'format' ? 'By format' : 'By type'}</div>
        <h1>{cap(cat.heading)}</h1>
        <p className="lede">
          Every {cat.heading} we track, ranked by the cheapest price per roll across UK shops.
          {' '}<strong>{films.length}</strong> stock{films.length === 1 ? '' : 's'} listed.
        </p>
        <div className="chips">
          {crossLinks.map((l) => <Link key={l.href} href={l.href} className="chip">{l.label}</Link>)}
        </div>
      </header>

      <FilmBrowser films={films} />

    </div>
  );
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const slugType = (categorySlug) => (TYPES.find((t) => t.slug === categorySlug) || {}).short;
