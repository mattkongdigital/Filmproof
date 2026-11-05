// expired-note.js
// Some shops say a roll is expired only in its description. Negative Space
// writes "Note on expired film" under each of its expired rolls, including
// "Fujifilm Fujicolor C200", whose title says nothing of the kind and so sat
// on the fresh C200 page. A source's `expiredNote` (a regex, in
// sources.config.js) marks such a product expired by its title, the one place
// the normaliser reads expiry from, so the catalogue and the price step agree.

const text = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

export function markExpired(products, src) {
  if (!src.expiredNote || !products) return products;
  return products.map((p) =>
    !/\bexpired\b/i.test(p.title || '') && src.expiredNote.test(text(p.body_html))
      ? { ...p, title: `${p.title} (Expired)` }
      : p);
}
