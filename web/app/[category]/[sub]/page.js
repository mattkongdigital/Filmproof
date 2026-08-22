import { notFound } from 'next/navigation';
import { resolveCombo, comboParams, filmsFor, comboHref, otherAxes, SUB_AXES, AXIS_LABEL, MIN_COMBO_FILMS } from '../../../lib/facets';
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

  // Cross-links to switch one axis while holding the other fixed (never a dead
  // link). The parent row swaps the parent and keeps the sub-facet; the sub rows
  // keep the parent and swap the sub. comboHref settles URL direction, so these
  // work the same whether the parent is a format or a type.
  const parentAxis = otherAxes(combo.subKind).find((a) => a.kind === combo.parentKind);
  const parentSiblings = parentAxis.items
    .filter((f) => f.slug !== params.category)
    .map((f) => ({
      href: comboHref(f, combo.sub),
      label: f.label,
      count: getFilms().filter((x) => f.match(x) && combo.sub.match(x)).length,
    }))
    .filter((f) => f.href && f.count >= MIN_COMBO_FILMS);
  // Sub rows cover every sub-axis except the parent's own — on /colour-film/expired
  // the parent is the type, so only condition is left to hang off it.
  const subAxes = SUB_AXES
    .filter((axis) => axis.kind !== combo.parentKind)
    .map((axis) => ({
      kind: axis.kind,
      label: axis.label,
      current: axis.kind === combo.subKind,
      items: axis.items
        .filter((t) => t.short !== params.sub)
        .map((t) => ({ slug: t.short, label: t.label, count: getFilms().filter((x) => combo.parent.match(x) && t.match(x)).length }))
        .filter((t) => t.count >= MIN_COMBO_FILMS),
    }))
    .filter((axis) => axis.current || axis.items.length > 0);
  const parentOnlyCount = getFilms().filter(combo.parent.match).length;
  const subOnlyCount = getFilms().filter(combo.sub.match).length;
  const showChips = parentSiblings.length > 0 || subAxes.some((a) => a.items.length > 0);
  // Both halves of the combo are fixed here, and any axis offered as a chip row
  // is navigation rather than a filter — so the browser keeps only what varies
  // and is not already linked above (ISO, stock, and any axis without chips).
  const hiddenAxes = [combo.parentKind, combo.subKind, ...(showChips ? subAxes.map((a) => a.kind) : [])]
    .map((k) => BROWSER_AXIS[k]);

  return (
    <div className="wrap">
      <Breadcrumbs items={[
        { name: 'Home', href: '/' },
        { name: `${combo.parent.label} film`, href: `/${params.category}` },
        { name: combo.sub.label },
      ]} />
      <header className="cat-head">
        <div className="eyebrow">
          <Link href={`/${params.category}`} className="crumb">{combo.parent.label} film</Link>
          {' › '}{combo.sub.label}
        </div>
        <h1>{cap(combo.heading)}</h1>
        <p className="lede">
          {content ? content.intro : (
            <>
              {cap(combo.sub.label.toLowerCase())} film in {combo.parent.label}, in stock across UK shops, with live prices per roll.
              {' '}<strong>{films.length}</strong> stock{films.length === 1 ? '' : 's'} listed.
            </>
          )}
        </p>
      </header>

      {showChips && (
        <div className="facet-links">
          <span className="facet-links-head">Browse {combo.heading} by</span>
          <div className="facet-axes">
            <div className="axis">
              <span className="axis-label">{AXIS_LABEL[combo.parentKind]}</span>
              <Link className="chip" href={`/${combo.sub.slug}`}>All <span className="chip-count">{subOnlyCount}</span></Link>
              <span className="chip current" aria-current="page">
                {combo.parent.label} <span className="chip-count">{films.length}</span>
              </span>
              {parentSiblings.map((f) => (
                <Link key={f.href} href={f.href} className="chip">
                  {f.label} <span className="chip-count">{f.count}</span>
                </Link>
              ))}
            </div>
            {subAxes.map((axis) => (
              <div className="axis" key={axis.label}>
                <span className="axis-label">{axis.label}</span>
                <Link className="chip" href={`/${params.category}`}>All <span className="chip-count">{parentOnlyCount}</span></Link>
                {axis.current && (
                  <span className="chip current" aria-current="page">
                    {combo.sub.label} <span className="chip-count">{films.length}</span>
                  </span>
                )}
                {axis.items.map((t) => (
                  <Link key={t.slug} href={`/${params.category}/${t.slug}`} className="chip">
                    {t.label} <span className="chip-count">{t.count}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <FilmBrowser films={films} hideAxes={hiddenAxes} />

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

// facet kind -> the FilmBrowser filter axis it corresponds to.
const BROWSER_AXIS = { format: 'fmt', type: 'typ', condition: 'cond' };
