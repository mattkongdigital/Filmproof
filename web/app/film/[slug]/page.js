import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFilm, getFilms, gbp, formatLabel } from '../../../lib/data';
import { FORMATS, TYPES } from '../../../lib/facets';
import { FilmFrame } from '../../../components/comparison';
import { FilmImage } from '../../../components/film-image';
import { Breadcrumbs } from '../../../components/breadcrumbs';
import { ProductSchema } from '../../../components/product-schema';

export function generateStaticParams() {
  return getFilms().map((f) => ({ slug: f.slug }));
}

export function generateMetadata({ params }) {
  const film = getFilm(params.slug);
  if (!film) return { title: 'Film not found' };
  return {
    title: `${film.display} | In stock across UK shops`,
    description: `Where to buy ${film.display} in the UK right now, with live prices per roll so you can restock before you run out.`,
  };
}

export default function FilmPage({ params }) {
  const film = getFilm(params.slug);
  if (!film) notFound();

  const formatSlug = (FORMATS.find((x) => x.match(film)) || {}).slug;
  const typeSlug = (TYPES.find((x) => x.match(film)) || {}).slug;
  const specs = [
    ['Brand', pretty(film.brand), film.brand ? `/brand/${film.brand}` : null],
    ['Format', formatLabel(film.format), formatSlug ? `/${formatSlug}` : null],
    ['Process', film.process || '—', typeSlug ? `/${typeSlug}` : null],
    ['Speed', film.iso ? `ISO ${film.iso}` : '—', null],
  ];

  const inStock = film.offers.filter((o) => o.inStock).sort((a, b) => a.pricePerRoll - b.pricePerRoll);
  const cheapest = inStock[0];
  const multiExp = new Set(film.offers.map((o) => o.exp).filter(Boolean)).size > 1;

  return (
    <div className="wrap">
      <ProductSchema film={{ ...film, brandName: pretty(film.brand) }} />
      <Breadcrumbs items={[
        { name: 'Home', href: '/' },
        ...(film.brand ? [{ name: pretty(film.brand), href: `/brand/${film.brand}` }] : []),
        { name: film.display },
      ]} />
      <header className="detail-head">
        <div className="eyebrow">{pretty(film.brand)} · {formatLabel(film.format)}{film.iso ? ` · ISO ${film.iso}` : ''}</div>
        <h1 className="detail-title">{film.display}</h1>
        <p className="lede">
          {cheapest
            ? <>In stock from <strong>{gbp(cheapest.pricePerRoll)}/roll</strong>{multiExp && cheapest.exp ? ` (${cheapest.exp} exp)` : ''} at {cheapest.retailer}.</>
            : <>Out of stock at every shop we track. Prices below are the last seen.</>}
        </p>
      </header>

      <section className="product">
        <FilmImage src={film.image} alt={film.display} />
        <div className="product-info">
          <table className="specs">
            <tbody>
              {specs.map(([k, v, href]) => (
                <tr key={k}><th>{k}</th><td>{href ? <Link href={href} className="spec-link">{v}</Link> : v}</td></tr>
              ))}
            </tbody>
          </table>
          {film.description && <p className="description">{film.description}</p>}
        </div>
      </section>

      <main className="sheet">
        <FilmFrame film={film} index={0} linked={false} />
      </main>
    </div>
  );
}

function pretty(brand) {
  const map = {
    fujifilm: 'Fujifilm', kodak: 'Kodak', ilford: 'Ilford', cinestill: 'CineStill',
    kentmere: 'Kentmere', kosmofoto: 'Kosmo Foto', agfa: 'AgfaPhoto', foma: 'Foma',
    lomography: 'Lomography', jch: 'Japan Camera Hunter', dubblefilm: 'dubblefilm',
    optikoldschool: 'Optik Oldschool', silbersalz: 'SilberSalz', filmneverdie: 'FilmNeverDie',
  };
  return map[brand] || (brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : '');
}
