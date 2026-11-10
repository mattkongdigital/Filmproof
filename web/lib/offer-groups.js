// How a film page lays out its offers. Pure, so the comparison component can
// stay a thin renderer.
//
// One shop often lists the same film several ways: the Eastman box and the
// older Gold box, each as a single and a 3-pack. Listed flat, a page carried
// one shop four times over in rows that looked identical. So within each
// exposure group a shop gets ONE row, its cheapest in-stock price per roll,
// and its other listings fold under it. Shops with nothing in stock fold
// together at the end of the group, unless nothing in the group is in stock,
// in which case the last-seen prices are the list.

const byPrice = (a, b) => (a.pricePerRoll ?? Infinity) - (b.pricePerRoll ?? Infinity);
// In stock first, then cheapest per roll.
const byStockThenPrice = (a, b) => (b.inStock - a.inStock) || byPrice(a, b);

export const PACK_FILTERS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'single', label: 'Single rolls', match: (o) => !(o.packSize > 1) },
  { id: 'multi', label: 'Multipacks', match: (o) => o.packSize > 1 },
];

// The singles/multipacks toggle only earns its place when the film has both,
// and never for sheet film, where a box is the unit and packs are sheets.
export function hasPackChoice(film) {
  if (film.format === 'sheet' || film.offers.some((o) => o.sheets)) return false;
  return film.offers.some((o) => o.packSize > 1) && film.offers.some((o) => !(o.packSize > 1));
}

// A 24exp and a 36exp roll are different products, so each compares within
// its own group, longest first, with "not stated" last.
export function groupOffers(offers) {
  const byExp = new Map();
  for (const o of offers) {
    const k = o.exp ?? null;
    if (!byExp.has(k)) byExp.set(k, []);
    byExp.get(k).push(o);
  }

  const groups = [...byExp.entries()].map(([exp, offs]) => {
    const byShop = new Map();
    for (const o of offs) {
      if (!byShop.has(o.retailer)) byShop.set(o.retailer, []);
      byShop.get(o.retailer).push(o);
    }
    const shops = [...byShop.entries()].map(([retailer, list]) => {
      const [head, ...more] = [...list].sort(byStockThenPrice);
      return { retailer, head, more };
    }).sort((a, b) => byStockThenPrice(a.head, b.head));

    const live = shops.filter((s) => s.head.inStock);
    const out = shops.filter((s) => !s.head.inStock);
    // Nothing in stock: show the last-seen prices as the list, not folded.
    return live.length ? { exp, shops: live, out } : { exp, shops: out, out: [] };
  });

  groups.sort((a, b) => (a.exp == null ? 1 : b.exp == null ? -1 : b.exp - a.exp));
  return groups;
}
