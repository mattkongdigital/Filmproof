import Link from 'next/link';
import { getFilms, SITE_URL } from '../lib/data';
import { FORMATS, availableFormats, availableTypes, availableConditions, brandList, filmsFor } from '../lib/facets';
import { FilmCard } from '../components/film-card';

export function generateMetadata() {
  return {
    title: 'Filmproof | Never run out of film, UK stock & price tracker',
    description: 'Compare film stock and prices across UK shops in one place. See what\'s in stock right now, find the cheapest price per roll, and restock before you run out.',
    alternates: { canonical: `${SITE_URL}/` },
  };
}

const FEATURED_PER_FORMAT = 4;

export default function Home() {
  const films = getFilms();
  const formats = availableFormats();
  const types = availableTypes();
  const conditions = availableConditions();
  const brands = brandList().slice(0, 12);

  const shops = new Set();
  films.forEach((f) => f.offers.forEach((o) => shops.add(o.retailer)));

  // The cheapest in-stock films in each of the common roll formats, each group
  // linking on to its format page. Expired stock is left out: it has its own
  // page, and a cheap expired roll is not what "cheapest 35mm" means.
  const featured = ['35mm-film', '110-film', '120-film']
    .map((slug) => FORMATS.find((x) => x.slug === slug))
    .map((format) => ({
      format,
      films: filmsFor((f) => format.match(f) && f.best != null && !f.expired).slice(0, FEATURED_PER_FORMAT),
    }))
    .filter((g) => g.films.length > 0);

  return (
    <div className="wrap">
      <header className="masthead">
        <div className="eyebrow">Film stock tracker, United Kingdom</div>
        <h1>Never run out<br />of <em>film.</em></h1>
        <p className="lede">
          Filmproof tracks film across UK shops, so you can see what&apos;s in stock, compare
          prices per roll, and restock in seconds.
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

        {conditions.length > 0 && (
          <>
            <h2 className="hub-head">Browse by condition</h2>
            <div className="tiles">
              {conditions.map((c) => <Link key={c.slug} href={`/${c.slug}`} className="tile">{c.label}</Link>)}
            </div>
          </>
        )}

        <h2 className="hub-head">Browse by brand</h2>
        <div className="tiles">
          {brands.map((b) => <Link key={b.slug} href={`/brand/${b.slug}`} className="tile tile-sm">{b.label}</Link>)}
          <Link href="/brands" className="tile tile-sm tile-more">All brands →</Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="featured">
          <h2 className="hub-head">In stock right now</h2>
          {featured.map(({ format, films: group }) => (
            <div key={format.slug} className="featured-group">
              <div className="featured-group-head">
                <h3>Cheapest {format.label} film</h3>
                <Link href={`/${format.slug}`} className="featured-more">See more {format.label} film →</Link>
              </div>
              <div className="grid">
                {group.map((f) => <FilmCard key={f.slug} film={f} />)}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
