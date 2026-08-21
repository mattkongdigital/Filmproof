import { notFound } from 'next/navigation';
import { resolveCategory, categoryParams, filmsFor, FORMATS, SUB_AXES, AXIS_LABEL, MIN_COMBO_FILMS } from '../../lib/facets';
import { FilmBrowser } from '../../components/film-browser';
import { Breadcrumbs } from '../../components/breadcrumbs';
import { SITE_URL, getFilms } from '../../lib/data';
import { getFormatContent, getTypeContent, getConditionContent } from '../../lib/category-content';
import Link from 'next/link';

export function generateStaticParams() {
  return categoryParams();
}

function categoryContent(cat, slug) {
  if (cat.kind === 'format') return getFormatContent(slug);
  if (cat.kind === 'condition') return getConditionContent(slug);
  return getTypeContent(slug);
}

// Chip rows for the other axes, so every category page crosses into the combos
// that exist. A format page offers its sub-axes (type, condition); a type or
// condition page offers the formats it appears in. Counts are computed first so
// a combo below MIN_COMBO_FILMS never becomes a dead link.
function crossAxes(cat, categorySlug) {
  const withCounts = (links) =>
    links
      .map((l) => ({ ...l, count: getFilms().filter(l.match).length }))
      .filter((l) => l.count >= MIN_COMBO_FILMS);

  if (cat.kind === 'format') {
    return SUB_AXES
      .map((axis) => ({
        label: axis.label,
        links: withCounts(axis.items.map((sub) => ({
          href: `/${categorySlug}/${sub.short}`,
          label: sub.label,
          match: (f) => cat.match(f) && sub.match(f),
        }))),
      }))
      .filter((axis) => axis.links.length > 0);
  }

  // A type or condition page crosses back into the roll formats.
  const links = withCounts(FORMATS.filter((f) => f.roll).map((f) => ({
    href: `/${f.slug}/${cat.facet.short}`,
    label: f.label,
    match: (x) => cat.match(x) && f.match(x),
  })));
  return links.length > 0 ? [{ label: 'Format', links }] : [];
}

export function generateMetadata({ params }) {
  const cat = resolveCategory(params.category);
  if (!cat) return {};
  const content = categoryContent(cat, params.category);
  return {
    title: content?.meta?.title || `${cap(cat.heading)} | Never run out, UK stock & prices`,
    description: content?.meta?.description || `Find ${cat.heading} in stock across UK shops and restock before you run out. Live prices per roll, updated daily.`,
    alternates: { canonical: `${SITE_URL}/${params.category}` },
  };
}

export default function CategoryPage({ params }) {
  const cat = resolveCategory(params.category);
  if (!cat) notFound();

  const content = categoryContent(cat, params.category);
  const films = filmsFor(cat.match);

  const axes = crossAxes(cat, params.category);

  return (
    <div className="wrap">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: cap(cat.heading) }]} />
      <header className="cat-head">
        <div className="eyebrow">By {AXIS_LABEL[cat.kind].toLowerCase()}</div>
        <h1>{cap(cat.heading)}</h1>
        <p className="lede">
          {content ? content.intro : (
            <>
              Every {cat.heading} we track, in stock across UK shops, with live prices per roll.
              {' '}<strong>{films.length}</strong> stock{films.length === 1 ? '' : 's'} listed.
            </>
          )}
        </p>
      </header>

      {axes.length > 0 && (
        <div className="facet-links">
          <span className="facet-links-head">
            Browse {cat.label} by {axes.map((a) => a.label.toLowerCase()).join(' or ')}
          </span>
          <div className="facet-axes">
            {axes.map((axis) => (
              <div className="axis" key={axis.label}>
                <span className="axis-label">{axis.label}</span>
                <span className="chip current" aria-current="page">
                  All <span className="chip-count">{films.length}</span>
                </span>
                {axis.links.map((l) => (
                  <Link key={l.href} href={l.href} className="chip">
                    {l.label} <span className="chip-count">{l.count}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The axis this page is already filtered by is constant here, so hide it. */}
      <FilmBrowser films={films} hideAxes={[BROWSER_AXIS[cat.kind]]} />

      {content && (
        <div className="brand-about">
          <h2 className="store-films-head">About {cat.heading}</h2>
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

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// facet kind -> the FilmBrowser filter axis it corresponds to.
const BROWSER_AXIS = { format: 'fmt', type: 'typ', condition: 'cond' };
