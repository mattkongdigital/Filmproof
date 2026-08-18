import { notFound } from 'next/navigation';
import { resolveCombo, comboParams, filmsFor, TYPES, FORMATS, MIN_COMBO_FILMS } from '../../../lib/facets';
import { FilmBrowser } from '../../../components/film-browser';
import { Breadcrumbs } from '../../../components/breadcrumbs';
import { SITE_URL, getFilms } from '../../../lib/data';
import { getComboContent } from '../../../lib/category-content';
import Link from 'next/link';

export function generateStaticParams() {
  return comboParams();
}

export function generateMetadata({ params }) {
  const combo = resolveCombo(params.category, params.sub);
  if (!combo) return {};
  const content = getComboContent(params.category, params.sub);
  return {
    title: content?.meta?.title || `${cap(combo.heading)} | Never run out, UK stock & prices`,
    description: content?.meta?.description || `Find ${combo.heading} in stock across UK shops and restock before you run out. Live prices per roll, updated daily.`,
    alternates: { canonical: `${SITE_URL}/${params.category}/${params.sub}` },
  };
}

export default function ComboPage({ params }) {
  const combo = resolveCombo(params.category, params.sub);
  if (!combo) notFound();

  const content = getComboContent(params.category, params.sub);
  const films = filmsFor(combo.match);

  // Cross-links to switch either axis while holding the other fixed (never a dead link).
  const formatSiblings = FORMATS.filter((f) => f.roll && f.slug !== params.category)
    .map((f) => ({ slug: f.slug, label: f.label, count: getFilms().filter((x) => f.match(x) && combo.typ.match(x)).length }))
    .filter((f) => f.count >= MIN_COMBO_FILMS);
  const typeSiblings = TYPES.filter((t) => t.short !== params.sub)
    .map((t) => ({ slug: t.short, label: t.label, count: getFilms().filter((x) => combo.fmt.match(x) && t.match(x)).length }))
    .filter((t) => t.count >= MIN_COMBO_FILMS);
  const fmtOnlyCount = getFilms().filter(combo.fmt.match).length;
  const typOnlyCount = getFilms().filter(combo.typ.match).length;

  return (
    <div className="wrap">
      <Breadcrumbs items={[
        { name: 'Home', href: '/' },
        { name: `${combo.fmt.label} film`, href: `/${params.category}` },
        { name: combo.typ.label },
      ]} />
      <header className="cat-head">
        <div className="eyebrow">
          <Link href={`/${params.category}`} className="crumb">{combo.fmt.label} film</Link>
          {' › '}{combo.typ.label}
        </div>
        <h1>{cap(combo.heading)}</h1>
        <p className="lede">
          {content ? content.intro : (
            <>
              {cap(combo.typ.label.toLowerCase())} film in {combo.fmt.label}, in stock across UK shops, with live prices per roll.
              {' '}<strong>{films.length}</strong> stock{films.length === 1 ? '' : 's'} listed.
            </>
          )}
        </p>
      </header>

      {(formatSiblings.length > 0 || typeSiblings.length > 0) && (
        <div className="facet-links">
          <span className="facet-links-head">Browse {combo.heading} by</span>
          <div className="facet-axes">
            <div className="axis">
              <span className="axis-label">Format</span>
              <Link className="chip" href={`/${combo.typ.slug}`}>All <span className="chip-count">{typOnlyCount}</span></Link>
              <span className="chip current" aria-current="page">
                {combo.fmt.label} <span className="chip-count">{films.length}</span>
              </span>
              {formatSiblings.map((f) => (
                <Link key={f.slug} href={`/${f.slug}/${params.sub}`} className="chip">
                  {f.label} <span className="chip-count">{f.count}</span>
                </Link>
              ))}
            </div>
            <div className="axis">
              <span className="axis-label">Type</span>
              <Link className="chip" href={`/${params.category}`}>All <span className="chip-count">{fmtOnlyCount}</span></Link>
              <span className="chip current" aria-current="page">
                {combo.typ.label} <span className="chip-count">{films.length}</span>
              </span>
              {typeSiblings.map((t) => (
                <Link key={t.slug} href={`/${params.category}/${t.slug}`} className="chip">
                  {t.label} <span className="chip-count">{t.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <FilmBrowser films={films} hideAxes={['typ', 'fmt']} />

      {content && (
        <div className="brand-about">
          <h2 className="store-films-head">About {combo.heading}</h2>
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
