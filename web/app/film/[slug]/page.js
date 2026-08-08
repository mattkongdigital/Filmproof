import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFilm, getFilms, gbp, formatLabel } from '../../../lib/data';
import { FilmFrame } from '../../../components/comparison';
import { FilmImage } from '../../../components/film-image';
import { Breadcrumbs } from '../../../components/breadcrumbs';

export function generateStaticParams() {
  return getFilms().map((f) => ({ slug: f.slug }));
}

export function generateMetadata({ params }) {
  const film = getFilm(params.slug);
  return { title: film ? `${film.display} — cheapest UK price per roll` : 'Film not found' };
}

export default function FilmPage({ params }) {
  const film = getFilm(params.slug);
  if (!film) notFound();

  const specs = [
    ['Brand', pretty(film.brand)],
    ['Format', formatLabel(film.format)],
    ['Speed', film.iso ? `ISO ${film.iso}` : '—'],
    ['Process', film.process || '—'],
  ];

  const inStock = film.offers.filter((o) => o.inStock).sort((a, b) => a.pricePerRoll - b.pricePerRoll);
  const cheapest = inStock[0];
  const multiExp = new Set(film.offers.map((o) => o.exp).filter(Boolean)).size > 1;

  return (
    <div className="wrap">
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
            ? <>Cheapest in stock right now: <strong>{gbp(cheapest.pricePerRoll)}/roll</strong>{multiExp && cheapest.exp ? ` (${cheapest.exp} exp)` : ''} at {cheapest.retailer}.</>
            : <>Out of stock at every shop we track. Prices below are the last seen.</>}
        </p>
      </header>

      <section className="product">
        <FilmImage src={film.image} alt={film.display} />
        <div className="product-info">
          <table className="specs">
            <tbody>
              {specs.map(([k, v]) => (
                <tr key={k}><th>{k}</th><td>{v}</td></tr>
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
