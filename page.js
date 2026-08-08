import Link from 'next/link';
import { getFilms } from '../lib/data';
import { availableFormats, availableTypes, brandList, filmsFor } from '../lib/facets';
import { FilmCard } from '../components/film-card';

export default function Home() {
  const films = getFilms();
  const formats = availableFormats();
  const types = availableTypes();
  const brands = brandList().slice(0, 12);

  const shops = new Set();
  films.forEach((f) => f.offers.forEach((o) => shops.add(o.retailer)));

  // A few of the cheapest in-stock stocks to feature.
  const featured = filmsFor((f) => f.best != null).slice(0, 6);

  return (
    <div className="wrap">
      <header className="masthead">
        <div className="eyebrow">Film price index — United Kingdom</div>
        <h1>The cheapest<br />roll wins. <em>Always.</em></h1>
        <p className="lede">
          Film prices from UK shops, gathered on one honest page. We check the shelf price
          per roll — multipacks and all — and ring the cheapest in stock.
        </p>
        <div className="meter">
          <b>{films.length}</b> stocks <i>·</i> <b>{shops.size}</b> shops <i>·</i> updated daily
        </div>
      </header>

      <section className="hub">
        <h2 className="hub-head">Browse by format</h2>
        <div className="tiles">
          {formats.map((f) => <Link key={f.slug} href={`/${f.slug}`} className="tile">{f.label}</Link>)}
        </div>

        <h2 className="hub-head">Browse by type</h2>
        <div className="tiles">
          {types.map((t) => <Link key={t.slug} href={`/${t.slug}`} className="tile">{t.label}</Link>)}
        </div>

        <h2 className="hub-head">Browse by brand</h2>
        <div className="tiles">
          {brands.map((b) => <Link key={b.slug} href={`/brand/${b.slug}`} className="tile tile-sm">{b.label}</Link>)}
          <Link href="/brands" className="tile tile-sm tile-more">All brands →</Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="featured">
          <h2 className="hub-head">Cheapest right now</h2>
          <div className="grid">
            {featured.map((f) => <FilmCard key={f.slug} film={f} />)}
          </div>
        </section>
      )}
    </div>
  );
}
