// demo.js
// Runs the whole pipeline in memory with NO database and NO dependencies.
//   node demo.js
// It loads both sample feeds, matches every offer against the canonical
// catalogue, and prints the comparison a visitor would see — plus the review
// queue of things a human needs to look at.

import { FILMS, FILM_BY_KEY } from './src/seed-films.js';
import { matchOffer } from './src/match.js';
import { loadWex } from './src/adapters/wex.js';
import { loadNikTrick } from './src/adapters/niktrick.js';

const offers = [
  ...loadWex('./data/wex-sample.xml'),
  ...loadNikTrick('./data/niktrick-sample.csv'),
];

const results = offers.map((o) => matchOffer(o, FILM_BY_KEY));

const byFilm = new Map(FILMS.map((f) => [f.id, []]));
const review = [];
for (const r of results) {
  if (r.status === 'matched') byFilm.get(r.filmId).push(r);
  else review.push(r);
}

const money = (n) => `£${n.toFixed(2)}`;

console.log('\n=== FILM PRICE COMPARISON ===\n');
for (const film of FILMS) {
  const rows = byFilm.get(film.id).sort((a, b) => a.offer.pricePerRoll - b.offer.pricePerRoll);
  console.log(`${film.display}   [${film.key}]`);
  if (!rows.length) { console.log('   (no offers yet)\n'); continue; }

  const bestIdx = rows.findIndex((r) => r.offer.inStock); // cheapest in-stock
  rows.forEach((r, i) => {
    const o = r.offer;
    const flag = i === bestIdx ? '\u2605 best' : '      ';
    const pack = o.packSize > 1 ? `  (${o.packSize}-pack @ ${money(o.price)})` : '';
    const stock = o.inStock ? '' : '  \u2014 OUT OF STOCK';
    console.log(`   ${flag}  ${money(o.pricePerRoll)}/roll   ${o.retailer}${pack}${stock}`);
  });
  console.log('');
}

console.log('=== REVIEW QUEUE (needs a human) ===\n');
if (!review.length) console.log('   (empty)\n');
for (const r of review) {
  console.log(`   \u2022 "${r.offer.title}"  (${r.offer.retailer})`);
  console.log(`     reason: ${r.reason}   parsed key: ${r.parsed.key ?? '\u2014'}\n`);
}
