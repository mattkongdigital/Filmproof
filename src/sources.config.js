// sources.config.js
// The shops the site pulls from. Each source is either:
//   - live   (has a baseUrl we can fetch, e.g. a Shopify store), and/or
//   - sample (a local file used offline or if the live fetch fails)
//
// Adding a Shopify shop is just a new entry here — no new code needed.

export const SOURCES = [
  {
    retailer: 'Analogue Wonderland',
    kind: 'shopify',
    baseUrl: 'https://analoguewonderland.co.uk',
    sample: './data/shopify-sample.json',
  },
  {
    retailer: 'Firstcall Photographic',
    kind: 'shopify',
    baseUrl: 'https://firstcall-photographic.co.uk', // migrated to Shopify — public /products.json
  },
  {
    retailer: 'Wex Photo Video',
    kind: 'xml',
    sample: './data/wex-sample.xml', // hand-maintained until they provide a feed
  },
  {
    retailer: 'Nik & Trick',
    kind: 'csv',
    sample: './data/niktrick-sample.csv',
  },
];
