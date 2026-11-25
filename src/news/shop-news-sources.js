// src/news/shop-news-sources.js — the retailers' own blog feeds behind the
// "Shop news" type on /news/. See "News" in CLAUDE.md.
//
// Every shop here is on Shopify, whose blogs publish an Atom feed at
// /blogs/<handle>.atom, except Parallax, which is WordPress (/feed/). Each was
// checked against the shop's robots.txt when it was added; politeFetch checks
// again on every request. `retailer` must match the name in SOURCES and STORES.
//
// `filmOnly` is for a shop whose blog also covers things other than film
// photography (Bass & Bligh sells binoculars and spotting scopes): only posts
// whose title or text mentions film are kept.
//
// Gulabi and PJL Photography had no blog when this list was made. Negative
// Space's blog exists but is empty; it is listed so its first post appears.

export const SHOP_FEEDS = [
  { retailer: 'Analogue Wonderland', feeds: [
    'https://analoguewonderland.co.uk/blogs/store-news.atom',
    'https://analoguewonderland.co.uk/blogs/film-photography-blog.atom',
    'https://analoguewonderland.co.uk/blogs/film-review.atom',
  ] },
  { retailer: 'Take It Easy Lab', feeds: ['https://takeiteasylab.com/blogs/blog.atom'] },
  { retailer: 'Cameras By Max', feeds: [
    'https://camerasbymax.co.uk/blogs/my-ramblings.atom',
    'https://camerasbymax.co.uk/blogs/get-to-know-film.atom',
    'https://camerasbymax.co.uk/blogs/buying-guides.atom',
    'https://camerasbymax.co.uk/blogs/featured-cameras.atom',
    'https://camerasbymax.co.uk/blogs/everything-medium-format.atom',
  ] },
  { retailer: 'Bass & Bligh', filmOnly: true, feeds: ['https://bassandbligh.com/blogs/news.atom'] },
  { retailer: 'Classic Photo Supplies', feeds: ['https://classicphotosupplies.co.uk/blogs/community-blog.atom'] },
  { retailer: 'Chemical Dependency Lab', feeds: ['https://chemicaldependency.co.uk/blogs/the-fix-blog.atom'] },
  { retailer: 'JFR Film', feeds: ['https://jfrfilm.co.uk/blogs/how-to-use-a-film-camera.atom'] },
  { retailer: 'Parallax Photographic', feeds: ['https://parallaxphotographic.coop/feed/'] },
  { retailer: 'Negative Space', feeds: ['https://negativespacefilm.co.uk/blogs/news.atom'] },
];
