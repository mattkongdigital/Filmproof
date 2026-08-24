// sources.config.js
// The shops the site pulls from — all live Shopify stores with a public
// /products.json. Adding a shop is just a new entry here; no new code needed.
// Any source that isn't Shopify (or has no film) logs a warning and contributes
// nothing — it can't break the build.

// Firstcall Photographic and The Flash Centre were removed on request. To
// restore either shop, add its entry back to the array below — nothing else
// needs to change.

export const SOURCES = [
  { retailer: 'Analogue Wonderland',   kind: 'shopify', baseUrl: 'https://analoguewonderland.co.uk', sample: './data/shopify-sample.json' },
  { retailer: 'Take It Easy Lab',       kind: 'shopify', baseUrl: 'https://takeiteasylab.com' },
  { retailer: 'Film Camera Store',      kind: 'shopify', baseUrl: 'https://filmcamerastore.co.uk' },
  { retailer: 'Cameras By Max',         kind: 'shopify', baseUrl: 'https://camerasbymax.co.uk' },
  { retailer: 'Gulabi',                 kind: 'shopify', baseUrl: 'https://store.gulabi.co.uk' },
  { retailer: 'PJL Photography',        kind: 'shopify', baseUrl: 'https://pjlphoto.com' },
  { retailer: 'Bass & Bligh',           kind: 'shopify', baseUrl: 'https://bassandbligh.com' },
];
