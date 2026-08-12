import Link from 'next/link';
import { notFound } from 'next/navigation';
import { brandSubParams, resolveBrandSub, subFacetsForBrand, filmsFor } from '../../../../lib/facets';
import { FilmBrowser } from '../../../../components/film-browser';
import { Breadcrumbs } from '../../../../components/breadcrumbs';
import { SITE_URL } from '../../../../lib/data';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateStaticParams() {
  return brandSubParams();
}

export function generateMetadata({ params }) {
  const r = resolveBrandSub(params.slug, params.sub);
  if (!r) return { title: 'Not found' };
  return {
    title: `${cap(r.heading)} — never run out, UK stock & prices`,
    description: `Find ${r.heading} in stock across UK shops and restock before you run out. Live prices per roll, updated daily.`,
    alternates: { canonical: `${SITE_URL}/brand/${params.slug}/${params.sub}` },
  };
}

export default function BrandSubPage({ params }) {
  const r = resolveBrandSub(params.slug, params.sub);
  if (!r) notFound();

  const films = filmsFor(r.match);
  const siblings = subFacetsForBrand(params.slug).filter((s) => s.kind === r.kind && s.slug !== params.sub);

  return (
    <div className="wrap">
      <Breadcrumbs items={[
        { name: 'Home', href: '/' },
        { name: 'Brands', href: '/brands' },
        { name: `${r.brand.label} film`, href: `/brand/${params.slug}` },
        { name: r.facet.label },
      ]} />
      <header className="cat-head">
        <div className="eyebrow">{r.brand.label}</div>
        <h1>{cap(r.heading)}</h1>
        <p className="lede">
          Every {r.heading} we track, in stock across UK shops, with live prices per roll.
          {' '}<strong>{films.length}</strong> stock{films.length === 1 ? '' : 's'} listed.
        </p>
      </header>

      {siblings.length > 0 && (
        <div className="facet-links">
          <span className="facet-links-head">More {r.brand.label}</span>
          <div className="chips">
            <Link className="chip" href={`/brand/${params.slug}`}>All {r.brand.label}</Link>
            <span className="chip current">{r.facet.label}</span>
            {siblings.map((s) => (
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
