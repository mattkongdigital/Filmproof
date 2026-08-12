import Link from 'next/link';
import { notFound } from 'next/navigation';
import { brandList, filmsFor, subFacetsForBrand } from '../../../lib/facets';
import { FilmBrowser } from '../../../components/film-browser';
import { Breadcrumbs } from '../../../components/breadcrumbs';
import { SITE_URL, brandLabel } from '../../../lib/data';

export function generateStaticParams() {
  return brandList().map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }) {
  const label = brandLabel(params.slug);
  return {
    title: `${label} film — never run out, UK stock & prices`,
    description: `Find ${label} film in stock across UK shops and restock before you run out. Live prices per roll, updated daily.`,
    alternates: { canonical: `${SITE_URL}/brand/${params.slug}` },
  };
}

export default function BrandPage({ params }) {
  const known = brandList().some((b) => b.slug === params.slug);
  if (!known) notFound();

  const label = brandLabel(params.slug);
  const films = filmsFor((f) => f.brand === params.slug);
  const subFacets = subFacetsForBrand(params.slug);

  return (
    <div className="wrap">
      <Breadcrumbs items={[
        { name: 'Home', href: '/' },
        { name: 'Brands', href: '/brands' },
        { name: `${label} film` },
      ]} />
      <header className="cat-head">
        <div className="eyebrow">By brand</div>
        <h1>{label} film</h1>
        <p className="lede">
          Every {label} stock we track, in stock across UK shops, with live prices per roll.
          {' '}<strong>{films.length}</strong> stock{films.length === 1 ? '' : 's'} listed.
        </p>
      </header>

      {subFacets.length > 0 && (
        <div className="facet-links">
          <span className="facet-links-head">Browse {label} by</span>
          <div className="chips">
            {subFacets.map((s) => (
              <Link key={s.slug} className="chip" href={`/brand/${params.slug}/${s.slug}`}>
                {s.label} <span className="chip-count">{s.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <FilmBrowser films={films} />

    </div>
  );
}
