// sources.config.js
// The shops the site pulls from — live Shopify stores with a public
// /products.json, and WooCommerce stores with the public Store API at
// /wp-json/wc/store/v1/products. Adding either is just a new entry here; no
// new code needed. A WooCommerce entry names its film `category` (slug or id),
// since those shops' full catalogues are mostly not film. A shop that says a
// roll is expired only in its description sets `expiredNote`, a regex for the
// words it uses (src/expired-note.js). A shop that states a roll's exposure
// count only on its product page sets `pageExp`, a regex whose first group is
// the count (src/page-exp.js).
// Any source that isn't Shopify (or has no film) logs a warning and contributes
// nothing — it can't break the build.

// Firstcall Photographic, The Flash Centre and Film Camera Store were removed
// on request. To restore one, add its entry back to the array below and its
// store page back to STORES in web/lib/stores.js (git history has both).

export const SOURCES = [
  { retailer: 'Analogue Wonderland',     kind: 'shopify', baseUrl: 'https://analoguewonderland.co.uk', sample: './data/shopify-sample.json' },
  // Take It Easy Lab states a roll's exposure count only as a pill on its
  // product page, so it is read from there (src/page-exp.js).
  { retailer: 'Take It Easy Lab',        kind: 'shopify', baseUrl: 'https://takeiteasylab.com', pageExp: /tie-film-quick-info__pill">\s*(\d{1,2})\s*Exposures?\s*</i },
  { retailer: 'Cameras By Max',          kind: 'shopify', baseUrl: 'https://camerasbymax.co.uk' },
  { retailer: 'Gulabi',                  kind: 'shopify', baseUrl: 'https://store.gulabi.co.uk' },
  { retailer: 'PJL Photography',         kind: 'shopify', baseUrl: 'https://pjlphoto.com' },
  { retailer: 'Bass & Bligh',            kind: 'shopify', baseUrl: 'https://bassandbligh.com' },
  { retailer: 'Classic Photo Supplies',  kind: 'shopify', baseUrl: 'https://classicphotosupplies.co.uk' },
  { retailer: 'Chemical Dependency Lab', kind: 'shopify', baseUrl: 'https://chemicaldependency.co.uk' },
  { retailer: 'JFR Film',                kind: 'shopify', baseUrl: 'https://jfrfilm.co.uk' },
  { retailer: 'Parallax Photographic',   kind: 'woocommerce', baseUrl: 'https://parallaxphotographic.coop', category: 'film' },
  { retailer: 'Negative Space',          kind: 'shopify', baseUrl: 'https://negativespacefilm.co.uk', expiredNote: /note on expired film/i },
];
