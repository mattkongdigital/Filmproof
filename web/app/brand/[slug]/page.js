import Link from 'next/link';
import { notFound } from 'next/navigation';
import { brandList, filmsFor, subFacetsForBrand } from '../../../lib/facets';
import { FilmBrowser } from '../../../components/film-browser';
import { Breadcrumbs } from '../../../components/breadcrumbs';
import { SITE_URL, brandLabel } from '../../../lib/data';
import { getBrandContent } from '../../../lib/brand-content';

export function generateStaticParams() {
  return brandList().map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }) {
  const label = brandLabel(params.slug);
  const content = getBrandContent(params.slug);
  return {
    title: content?.meta?.title || `${label} film | Never run out, UK stock & prices`,
    description: content?.meta?.description || (content ? content.intro : `Find ${label} film in stock across UK shops and restock before you run out. Live prices per roll, updated daily.`),
    alternates: { canonical: `${SITE_URL}/brand/${params.slug}` },
  };
}

export default function BrandPage({ params }) {
  const known = brandList().some((b) => b.slug === params.slug);
  if (!known) notFound();

  const label = brandLabel(params.slug);
  const content = getBrandContent(params.slug);
  const films = filmsFor((f) => f.brand === params.slug);
  const subFacets = subFacetsForBrand(params.slug);
  const formatFacets = subFacets.filter((s) => s.kind === 'format');
  const typeFacets = subFacets.filter((s) => s.kind === 'type');

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
          {content ? content.intro : (
            <>
              Every {label} stock we track, in stock across UK shops, with live prices per roll.
              {' '}<strong>{films.length}</strong> stock{films.length === 1 ? '' : 's'} listed.
            </>
          )}
        </p>
      </header>

      {subFacets.length > 0 && (
        <div className="facet-links">
          <span className="facet-links-head">Browse {label} by</span>
          <div className="facet-axes">
            {formatFacets.length > 0 && (
              <div className="axis">
                <span className="axis-label">Format</span>
                <span className="chip current" aria-current="page">
                  All <span className="chip-count">{films.length}</span>
                </span>
                {formatFacets.map((s) => (
                  <Link key={s.slug} className="chip" href={`/brand/${params.slug}/${s.slug}`}>
                    {s.label} <span className="chip-count">{s.count}</span>
                  </Link>
                ))}
              </div>
            )}
            {typeFacets.length > 0 && (
              <div className="axis">
                <span className="axis-label">Type</span>
                <span className="chip current" aria-current="page">
                  All <span className="chip-count">{films.length}</span>
                </span>
                {typeFacets.map((s) => (
                  <Link key={s.slug} className="chip" href={`/brand/${params.slug}/${s.slug}`}>
                    {s.label} <span className="chip-count">{s.count}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <FilmBrowser films={films} hideAxes={['typ','fmt']} />

      {content && (
        <div className="brand-about">
          <h2 className="store-films-head">About {label}</h2>
          {content.sections.map((section) => (
            <div key={section.heading}>
              <h3 className="brand-about-heading">{section.heading}</h3>
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="brand-about-p">{paragraph}</p>
              ))}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
