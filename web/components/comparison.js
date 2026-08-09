import Link from 'next/link';
import { gbp } from '../lib/data';

// Chinagraph "keeper" circle on the cheapest in-stock price.
export function KeeperMark() {
  return (
    <svg className="mark" viewBox="0 0 240 74" preserveAspectRatio="none" aria-hidden="true">
      <path d="M22 44 C6 20 70 8 128 10 C196 12 232 20 224 40 C218 56 150 66 92 62 C34 58 8 54 26 30 C30 25 44 20 60 18" />
    </svg>
  );
}

// Group a film's offers by exposure count. A 24exp and a 36exp roll are
// different products, so they compare within their own group, each with its
// own cheapest-in-stock keeper. Single-group films render with no label.
function groupByExp(offers) {
  const map = new Map();
  for (const o of offers) {
    const k = o.exp ?? null;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(o);
  }
  const groups = [...map.entries()].map(([exp, offs]) => {
    const sorted = [...offs].sort((a, b) => a.pricePerRoll - b.pricePerRoll);
    return { exp, offers: sorted, bestIdx: sorted.findIndex((o) => o.inStock) };
  });
  groups.sort((a, b) => (a.exp == null ? 1 : b.exp == null ? -1 : b.exp - a.exp));
  return groups;
}

function OfferRow({ o, best }) {
  return (
    <div>
      <div className={`offer${best ? ' keeper' : ''}${o.inStock ? '' : ' dim'}`}>
        <div className="shop">
          <a className="shop-name" href={o.url} target="_blank" rel="noopener noreferrer">{o.retailer}</a>
          {o.packSize > 1 && <span className="tag">{o.packSize}-pack</span>}
          {!o.inStock && <span className="oos">out of stock</span>}
        </div>
        <div className="price">
          <span className="price-val">{gbp(o.pricePerRoll)}</span>
          <span className="per"> / roll</span>
          {best && <KeeperMark />}
        </div>
      </div>
      {best && <div className="keeper-note">↑ keeper — best in-stock price</div>}
    </div>
  );
}

export function FilmFrame({ film, index, linked = true }) {
  const groups = groupByExp(film.offers);
  const multi = groups.length > 1;

  return (
    <section className="frame">
      <div className="frame-inner">
        <div className="frame-head">
          <span className="frame-no">▸ {String(index + 1).padStart(2, '0')}A</span>
          <span className="frame-name">
            {linked ? <Link href={`/film/${film.slug}`} className="frame-name-link">{film.display}</Link> : film.display}
          </span>
          <span className="frame-spec">{film.format} · ISO {film.iso}</span>
        </div>

        {groups.map((g) => (
          <div className="exp-group" key={g.exp ?? 'x'}>
            {multi && <div className="exp-label">{g.exp ? `${g.exp} exposures` : 'Exposures not stated'}</div>}
            {g.offers.map((o, i) => (
              <OfferRow key={o.retailer + i} o={o} best={i === g.bestIdx} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
