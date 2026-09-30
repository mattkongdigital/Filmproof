import Link from 'next/link';
import { notFound } from 'next/navigation';
import { brandSubParams, resolveBrandSub, subFacetsForBrand, brandsForFacet, BRAND_CHIP_LIMIT, filmsFor, AXIS_LABEL } from '../../../../lib/facets';
import { getFilms } from '../../../../lib/data';
import { ChipOverflow } from '../../../../components/chip-overflow';
import { FilmBrowser } from '../../../../components/film-browser';
import { Breadcrumbs } from '../../../../components/breadcrumbs';
import { SITE_URL } from '../../../../lib/data';
import { getBrandSubContent } from '../../../../lib/brand-content';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateStaticParams() {
  return brandSubParams();
}

export function generateMetadata({ params }) {
  const r = resolveBrandSub(params.slug, params.sub);
  if (!r) return { title: 'Not found' };
  const content = getBrandSubContent(params.slug, params.sub);
  return {
    title: content?.meta?.title || `${cap(r.heading)} | Never run out, UK stock & prices`,
    description: content?.meta?.description || `Find ${r.heading} in stock across UK shops and restock before you run out. Live prices per roll, updated daily.`,
    alternates: { canonical: `${SITE_URL}/brand/${params.slug}/${params.sub}` },
  };
}

export default function BrandSubPage({ params }) {
  const r = resolveBrandSub(params.slug, params.sub);
  if (!r) notFound();

  const content = getBrandSubContent(params.slug, params.sub);
  const films = filmsFor(r.match);
  const siblings = subFacetsForBrand(params.slug).filter((s) => s.kind === r.kind && s.slug !== params.sub);
  // The other parent: the same facet from every other brand that has a page for
  // it, with "All" going back up to the facet's own page (/35mm-film).
  const otherBrands = brandsForFacet(r.facet).filter((b) => b.slug !== params.slug);
  const facetCount = getFilms().filter(r.facet.match).length;

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
          {content ? content.intro : (
            <>
              Every {r.heading} we track, in stock across UK shops, with live prices per roll.
              {' '}<strong>{films.length}</strong> stock{films.length === 1 ? '' : 's'} listed.
            </>
          )}
        </p>
      </header>

      <div className="facet-links">
        <span className="facet-links-head">Browse {r.brand.label} by</span>
        <div className="facet-axes">
          <div className="axis">
            <span className="axis-label">{AXIS_LABEL[r.kind]}</span>
            <Link className="chip" href={`/brand/${params.slug}`}>All</Link>
            <span className="chip current" aria-current="page">
              {r.facet.label} <span className="chip-count">{films.length}</span>
            </span>
            {siblings.map((s) => (
              <Link key={s.slug} className="chip" href={`/brand/${params.slug}/${s.slug}`}>
                {s.label} <span className="chip-count">{s.count}</span>
              </Link>
            ))}
          </div>
          {otherBrands.length > 0 && (
            <div className="axis">
              <span className="axis-label">Brand</span>
              <Link className="chip" href={`/${params.sub}`}>All <span className="chip-count">{facetCount}</span></Link>
              <span className="chip current" aria-current="page">
                {r.brand.label} <span className="chip-count">{films.length}</span>
              </span>
              <ChipOverflow
                links={otherBrands.map((b) => ({ href: `/brand/${b.slug}/${params.sub}`, label: b.label, count: b.count }))}
                // The current brand's chip takes one of the visible slots.
                limit={BRAND_CHIP_LIMIT - 1}
                noun="more brands"
              />
            </div>
          )}
        </div>
      </div>

      <FilmBrowser films={films} />

      {content && (
        <div className="brand-about">
          <h2 className="store-films-head">About {r.heading}</h2>
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
