'use client';

import { useEffect, useState } from 'react';
import { groupOffers, hasPackChoice, PACK_FILTERS } from '../lib/offer-groups';

// A film's offers, one row per shop per exposure count (see lib/offer-groups).
// The extra listings and the out-of-stock shops are <details>, so they open
// without JS and every offer link is in the exported HTML. The pack toggle is
// the one piece that needs JS, so it only appears once the page has hydrated;
// without it the list shows everything.

// lib/data's gbp, copied: importing lib/data here would ship the whole
// catalogue to the browser.
const gbp = (n) => '£' + Number(n).toFixed(2);

function OfferRow({ o, unit, showListing }) {
  return (
    <div className={`offer${o.inStock ? '' : ' dim'}`}>
      <div className="shop">
        <a className="shop-name" href={o.url} target="_blank" rel="noopener noreferrer">{o.retailer}</a>
        {o.sheets ? <span className="tag">{o.sheets} sheets</span> : o.packSize > 1 && <span className="tag">{o.packSize}-pack</span>}
        {!o.inStock && <span className="oos">out of stock</span>}
        {showListing && o.listing && <span className="offer-listing">{o.listing}</span>}
      </div>
      <div className="price">
        {o.pricePerRoll != null
          ? <><span className="price-val">{gbp(o.pricePerRoll)}</span><span className="per"> / {unit}</span></>
          : <span className="price-val">{gbp(o.price)}</span>}
      </div>
    </div>
  );
}

// A shop's best row, with its other listings folded under it. When a shop has
// more than one listing, every row names its listing, the head included, so
// the folded rows can be told apart from it.
function ShopRows({ shop, unit }) {
  const many = shop.more.length > 0;
  return (
    <div className="shop-rows">
      <OfferRow o={shop.head} unit={unit} showListing={many} />
      {many && (
        <details className="offer-more">
          <summary>
            <span className="more-open">{shop.more.length} more from {shop.head.retailer}</span>
            <span className="more-close">Fewer from {shop.head.retailer}</span>
          </summary>
          {shop.more.map((o, i) => <OfferRow key={o.url + i} o={o} unit={unit} showListing />)}
        </details>
      )}
    </div>
  );
}

export function OfferList({ offers, format, unit }) {
  const [hydrated, setHydrated] = useState(false);
  const [pack, setPack] = useState('all');
  useEffect(() => setHydrated(true), []);

  const choice = hasPackChoice({ format, offers });
  const filter = PACK_FILTERS.find((f) => f.id === pack) || PACK_FILTERS[0];
  const groups = groupOffers(offers.filter(filter.match));
  const multi = groupOffers(offers).length > 1;

  return (
    <>
      {choice && hydrated && (
        <div className="pack-toggle" role="group" aria-label="Pack size">
          {PACK_FILTERS.map((f) => (
            <button key={f.id} type="button" aria-pressed={pack === f.id} onClick={() => setPack(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      )}
      {groups.map((g) => (
        <div className="exp-group" key={g.exp ?? 'x'}>
          {multi && <div className="exp-label">{g.exp ? `${g.exp} exposures` : 'Exposures not stated'}</div>}
          {g.shops.map((s) => <ShopRows key={s.retailer} shop={s} unit={unit} />)}
          {g.out.length > 0 && (
            <details className="offer-more offer-out">
              <summary>
                <span className="more-open">{g.out.length} {g.out.length === 1 ? 'shop' : 'shops'} out of stock</span>
                <span className="more-close">Hide out of stock</span>
              </summary>
              {g.out.flatMap((s) => [s.head, ...s.more]).map((o, i) => (
                <OfferRow key={o.url + i} o={o} unit={unit} showListing />
              ))}
            </details>
          )}
        </div>
      ))}
    </>
  );
}
