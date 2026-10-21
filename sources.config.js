// sources.config.js
// The shops the site pulls from — live Shopify stores with a public
// /products.json, and WooCommerce stores with the public Store API at
// /wp-json/wc/store/v1/products. Adding either is just a new entry here; no
// new code needed. A WooCommerce entry names its film `category` (slug or id),
// since those shops' full catalogues are mostly not film.
// Wix shops need the shop's API key (see the Wix entry below).

// Firstcall Photographic and The Flash Centre were removed on request. To
// restore either shop, add its entry back to the array below — nothing else
// needs to change.

const ALL_SOURCES = [
  { retailer: 'Analogue Wonderland',     kind: 'shopify', baseUrl: 'https://analoguewonderland.co.uk', sample: './data/shopify-sample.json' },
  { retailer: 'Take It Easy Lab',        kind: 'shopify', baseUrl: 'https://takeiteasylab.com' },
  { retailer: 'Film Camera Store',       kind: 'shopify', baseUrl: 'https://filmcamerastore.co.uk' },
  { retailer: 'Cameras By Max',          kind: 'shopify', baseUrl: 'https://camerasbymax.co.uk' },
  { retailer: 'Gulabi',                  kind: 'shopify', baseUrl: 'https://store.gulabi.co.uk' },
  { retailer: 'PJL Photography',         kind: 'shopify', baseUrl: 'https://pjlphoto.com' },
  { retailer: 'Bass & Bligh',            kind: 'shopify', baseUrl: 'https://bassandbligh.com' },
  { retailer: 'Classic Photo Supplies',  kind: 'shopify', baseUrl: 'https://classicphotosupplies.co.uk' },
  { retailer: 'Chemical Dependency Lab', kind: 'shopify', baseUrl: 'https://chemicaldependency.co.uk' },
  { retailer: 'JFR Film',                kind: 'shopify', baseUrl: 'https://jfrfilm.co.uk' },
  { retailer: 'Parallax Photographic',   kind: 'woocommerce', baseUrl: 'https://parallaxphotographic.coop', category: 'film' },
  // Wix (src/adapters/wix.js): no public feed, so the shop's own API key, read
  // from the environment variable `keyEnv`. `siteId` is the shop's Wix site
  // id (the "metaSiteId" in its page source) and `collection` its film
  // collection, by name.
  { retailer: 'Not Quite North',         kind: 'wix', baseUrl: 'https://www.not-quite-north.co.uk', siteId: '7472400b-fe82-4eb8-934b-57a6eb1e9a26', collection: 'Film', keyEnv: 'FILMPROOF_WIX_KEY_NOT_QUITE_NORTH' },
];

// A Wix shop can't be pulled without its key, and a shop in SOURCES that
// yields nothing fails the build. So until the key is set, the entry sits out
// of SOURCES altogether: the build carries on without it and says so, rather
// than going red over a shop that was never live.
const keyMissing = (src) => src.kind === 'wix' && !process.env[src.keyEnv];
for (const src of ALL_SOURCES.filter(keyMissing)) {
  console.warn(`  ${src.retailer}: not pulled, ${src.keyEnv} is not set`);
}
export const SOURCES = ALL_SOURCES.filter((src) => !keyMissing(src));
