import { SITE_URL } from '../lib/data';

// Product JSON-LD for a film detail page.
//
// The site quotes prices per roll, but a multipack's checkout price is
// packSize × that figure. Handing Google a per-roll number for a listing you
// can only buy as a pack is a price mismatch, so the offers block is built
// only from in-stock single-roll offers, using their real `price`.
export function ProductSchema({ film }) {
  const prices = film.offers
    .filter((o) => (o.packSize || 1) === 1 && o.inStock)
    .map((o) => o.price);

  const round = (n) => Number(n.toFixed(2));

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: film.display,
    url: `${SITE_URL}/film/${film.slug}`,
    ...(film.description ? { description: film.description } : {}),
    ...(film.image ? { image: film.image } : {}),
    ...(film.brandName ? { brand: { '@type': 'Brand', name: film.brandName } } : {}),
    ...(prices.length
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'GBP',
            lowPrice: round(Math.min(...prices)),
            highPrice: round(Math.max(...prices)),
            offerCount: prices.length,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />;
}
