import { notFound } from 'next/navigation';
import { resolveCombo, comboParams, filmsFor } from '../../../lib/facets';
import { FilmBrowser } from '../../../components/film-browser';
import { Breadcrumbs } from '../../../components/breadcrumbs';
import { SITE_URL } from '../../../lib/data';
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
