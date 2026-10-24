// facets.js — the browse axes. Everything here is derived from the catalogue,
// so pages only exist for facets that actually have films.

import { getFilms, brandLabel } from './data';

export const FORMATS = [
  { slug: '35mm-film', label: '35mm', roll: true, match: (f) => f.format === '135' },
  { slug: '120-film', label: '120', roll: true, match: (f) => f.format === '120' },
  { slug: '110-film', label: '110', roll: true, match: (f) => f.format === '110' },
  { slug: '127-film', label: '127', roll: true, match: (f) => f.format === '127' },
  { slug: 'large-format-film', label: 'Large format', roll: true, match: (f) => f.format === 'sheet' },
  { slug: 'instant-film', label: 'Instant', roll: false, match: (f) => f.format === 'instant' },
  { slug: 'cine-film', label: 'Cine', roll: false, match: (f) => f.format === 'movie' },
];

export const TYPES = [
  { slug: 'colour-film', short: 'colour', label: 'Colour', match: (f) => /colour negative|colour instant/i.test(f.process || '') },
  { slug: 'black-and-white-film', short: 'black-and-white', label: 'Black & white', match: (f) => /black/i.test(f.process || '') },
  { slug: 'slide-film', short: 'slide', label: 'Slide', match: (f) => /slide|e-6/i.test(f.process || '') },
];

// Condition is a third axis, orthogonal to the first two — an expired roll is
// still 35mm and still colour. It reads `f.expired`, set by the matcher (see
// src/normalise.js), which already keys expired stock separately from fresh.
export const CONDITIONS = [
  { slug: 'expired-film', short: 'expired', label: 'Expired', match: (f) => f.expired === true },
];

// The axes that can hang off a parent as a sub-page. Only these carry a `short`
// slug, so a format can never be the child half of a combo.
export const SUB_AXES = [
  { kind: 'type', label: 'Type', items: TYPES },
  { kind: 'condition', label: 'Condition', items: CONDITIONS },
];

const SUBS = [...TYPES, ...CONDITIONS];
const ALL_FACETS = [...FORMATS, ...TYPES, ...CONDITIONS];

// Which half of a pair becomes the URL parent: format outranks type, and a
// condition is never a parent. That keeps one canonical URL per pair —
// /35mm-film/expired and /colour-film/expired, never /expired-film/35mm.
const PARENT_RANK = { format: 0, type: 1, condition: 2 };

// Parents in rank order. Non-roll formats (instant, cine) are excluded: they
// have no meaningful sub-division here.
const COMBO_PARENTS = [...FORMATS.filter((f) => f.roll), ...TYPES];

// Which axis a facet belongs to — pages label their chip rows with this.
export function facetKind(facet) {
  if (FORMATS.includes(facet)) return 'format';
  if (CONDITIONS.includes(facet)) return 'condition';
  return 'type';
}

export const AXIS_LABEL = { format: 'Format', type: 'Type', condition: 'Condition' };

const has = (match) => getFilms().some(match);

// Films matching a facet, cheapest-first (films with no live price sink to the end).
export function filmsFor(match) {
  return getFilms()
    .filter(match)
    .sort((a, b) => (a.best ?? Infinity) - (b.best ?? Infinity) || a.display.localeCompare(b.display));
}

export function resolveCategory(slug) {
  const facet = ALL_FACETS.find((x) => x.slug === slug);
  if (!facet) return null;
  return { kind: facetKind(facet), facet, label: facet.label, heading: `${facet.label} film`, match: facet.match };
}

export function categoryParams() {
  return ALL_FACETS.filter((x) => has(x.match)).map((x) => ({ category: x.slug }));
}

// Type labels are proper nouns on their own ("Colour") but read mid-sentence in
// a combo heading, so they lower-case there. Format labels are names (35mm, 120)
// and stay as they are.
const inHeading = (facet) => (facetKind(facet) === 'type' ? facet.label.toLowerCase() : facet.label);

// A pair only combines across two different axes, and only in the direction
// PARENT_RANK allows — so /colour-film/expired resolves and /colour-film/slide
// (type × type) does not.
export function resolveCombo(categorySlug, subSlug) {
  const parent = COMBO_PARENTS.find((x) => x.slug === categorySlug);
  const sub = SUBS.find((x) => x.short === subSlug);
  if (!parent || !sub) return null;
  const parentKind = facetKind(parent);
  const subKind = facetKind(sub);
  if (parentKind === subKind) return null;
  return {
    parent, sub, parentKind, subKind,
    heading: `${sub.label} ${inHeading(parent)} film`,
    match: (f) => parent.match(f) && sub.match(f),
  };
}

export function comboParams() {
  const out = [];
  for (const parent of COMBO_PARENTS) {
    for (const sub of SUBS) {
      if (facetKind(parent) === facetKind(sub)) continue;
      if (has((f) => parent.match(f) && sub.match(f))) out.push({ category: parent.slug, sub: sub.short });
    }
  }
  return out;
}

// The canonical URL for a pair of facets, or null if they cannot combine.
// Both halves of a cross-link agree on direction because both call this.
export function comboHref(a, b) {
  const [parent, sub] = PARENT_RANK[facetKind(a)] <= PARENT_RANK[facetKind(b)] ? [a, b] : [b, a];
  if (facetKind(parent) === facetKind(sub)) return null;
  if (!COMBO_PARENTS.includes(parent)) return null;
  return `/${parent.slug}/${sub.short}`;
}

// The facets on every axis other than this one — the candidates a category page
// can cross-link into.
export function otherAxes(kind) {
  return [
    { kind: 'format', label: 'Format', items: FORMATS.filter((f) => f.roll) },
    { kind: 'type', label: 'Type', items: TYPES },
    { kind: 'condition', label: 'Condition', items: CONDITIONS },
  ].filter((axis) => axis.kind !== kind);
}

export const MIN_COMBO_FILMS = 3;

const countFor = (brandSlug, facet) =>
  getFilms().filter((f) => f.brand === brandSlug && facet.match(f)).length;

export function subFacetsForBrand(brandSlug) {
  return ALL_FACETS
    .map((facet) => ({ slug: facet.slug, label: facet.label, kind: facetKind(facet), count: countFor(brandSlug, facet) }))
    .filter((x) => x.count >= MIN_COMBO_FILMS);
}

// The brands with a /brand/<slug>/<facet> page for this facet, most films
// first. Same threshold as brandSubParams, so every entry is a page that was
// built — a category page can link to all of them without a dead link.
export function brandsForFacet(facet) {
  return brandList()
    .map((b) => ({ ...b, count: countFor(b.slug, facet) }))
    .filter((b) => b.count >= MIN_COMBO_FILMS)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }));
}

// A format can carry thirty-odd brands. A Brand chip row shows this many and
// folds the rest behind a "+N more brands" chip (components/chip-overflow.js).
export const BRAND_CHIP_LIMIT = 10;

export function resolveBrandSub(brandSlug, subSlug) {
  const brand = brandList().find((b) => b.slug === brandSlug);
  if (!brand) return null;
  const facet = ALL_FACETS.find((x) => x.slug === subSlug);
  if (!facet) return null;
  return {
    brand, facet,
    kind: facetKind(facet),
    heading: `${brand.label} ${facet.label.toLowerCase()} film`,
    match: (f) => f.brand === brandSlug && facet.match(f),
  };
}

// Every /brand/<slug>/<sub> page: the brand's facets, then its ranges. Both
// share the one route, so the sitemap picks up ranges from here too.
export function brandSubParams() {
  const out = [];
  for (const b of brandList()) {
    for (const facet of ALL_FACETS) {
      if (countFor(b.slug, facet) >= MIN_COMBO_FILMS) out.push({ slug: b.slug, sub: facet.slug });
    }
  }
  for (const r of builtRanges()) out.push({ slug: r.brand, sub: r.slug });
  return out;
}

// ---- ranges -----------------------------------------------------------------

// A range is a maker's product line across its speeds and formats: Portra is
// 160, 400 and 800, in 35mm, 120 and sheet. It is hand-listed rather than read
// from the normaliser's `line`, which is an identity key (Ektachrome E100's is
// "e100ektachrome") and never leaves the build.
//
// `match` reads the film's display title, which is the first shop's, so it
// must hold for every spelling a shop uses. Ektacolor Pro excludes Portra
// because shops gloss it with the Portra it replaces ("Ektacolor Pro 800
// (Portra 800)"), and that note can end up in the display.
//
// A range slug lives beside the facet slugs under /brand/<slug>/, so it must
// never end in "-film" like they all do. The check below stops the build.
export const RANGES = [
  { brand: 'kodak', slug: 'portra', label: 'Portra', match: (f) => /\bportra\b/i.test(f.display) && !/\bektacolou?r\b/i.test(f.display) },
  { brand: 'kodak', slug: 'ektacolor-pro', label: 'Ektacolor Pro', match: (f) => /\bektacolou?r\s*pro\b/i.test(f.display) },
  { brand: 'kodak', slug: 'ektar', label: 'Ektar', match: (f) => /\bektar\b/i.test(f.display) },
  { brand: 'kodak', slug: 'gold', label: 'Gold', match: (f) => /\bgold\b/i.test(f.display) },
  { brand: 'kodak', slug: 'ultramax', label: 'UltraMax', match: (f) => /\bultra\s*max\b/i.test(f.display) },
  { brand: 'kodak', slug: 'colorplus', label: 'ColorPlus', match: (f) => /\bcolou?r\s*plus\b/i.test(f.display) },
  { brand: 'kodak', slug: 'ektachrome', label: 'Ektachrome', match: (f) => /\bektachrome\b/i.test(f.display) },
  { brand: 'kodak', slug: 'tri-x', label: 'Tri-X', match: (f) => /\btri[\s-]?x\b/i.test(f.display) },
  { brand: 'kodak', slug: 't-max', label: 'T-Max', match: (f) => /\bt[\s-]?max\b/i.test(f.display) },
  { brand: 'kodak', slug: 'ektapan', label: 'Ektapan', match: (f) => /\bektapan\b/i.test(f.display) },
  // Kodak's current cine colour negatives are all Vision3, and some shops list
  // them by speed alone ("Kodak 500T, 16mm Movie Film").
  { brand: 'kodak', slug: 'vision3', label: 'Vision3', match: (f) => /\bvision\s*3\b/i.test(f.display) || (f.format === 'movie' && /^kodak\s+(?:50d|250d|200t|500t)\b/i.test(f.display)) },
  { brand: 'ilford', slug: 'hp5-plus', label: 'HP5 Plus', match: (f) => /\bhp\s?5\b/i.test(f.display) },
  { brand: 'ilford', slug: 'fp4-plus', label: 'FP4 Plus', match: (f) => /\bfp\s?4\b/i.test(f.display) },
  { brand: 'ilford', slug: 'delta', label: 'Delta', match: (f) => /\bdelta\b/i.test(f.display) },
  { brand: 'ilford', slug: 'pan-f-plus', label: 'Pan F Plus', match: (f) => /\bpan\s?f\b/i.test(f.display) },
  { brand: 'ilford', slug: 'xp2', label: 'XP2', match: (f) => /\bxp\s?2\b/i.test(f.display) },
  { brand: 'ilford', slug: 'ortho-plus', label: 'Ortho Plus', match: (f) => /\bortho\b/i.test(f.display) },
  { brand: 'ilford', slug: 'sfx', label: 'SFX', match: (f) => /\bsfx\b/i.test(f.display) },
  // Instax is three formats that fit three sets of cameras, so each is a range
  // of its own rather than one page a reader has to sort through.
  { brand: 'fujifilm', slug: 'instax-mini', label: 'Instax Mini', match: (f) => /\binstax\s*mini\b/i.test(f.display) },
  { brand: 'fujifilm', slug: 'instax-square', label: 'Instax Square', match: (f) => /\binstax\s*square\b/i.test(f.display) },
  { brand: 'fujifilm', slug: 'instax-wide', label: 'Instax Wide', match: (f) => /\binstax\s*wide\b/i.test(f.display) },
  { brand: 'fujifilm', slug: 'velvia', label: 'Velvia', match: (f) => /\bvelvia\b/i.test(f.display) },
  { brand: 'fujifilm', slug: 'provia', label: 'Provia', match: (f) => /\bprovia\b/i.test(f.display) },
  { brand: 'fujifilm', slug: 'superia', label: 'Superia', match: (f) => /\bsuperia\b/i.test(f.display) },
  { brand: 'fujifilm', slug: 'acros', label: 'Acros', match: (f) => /\bacros\b/i.test(f.display) },
  { brand: 'harman', slug: 'phoenix', label: 'Phoenix', match: (f) => /\bphoenix\b/i.test(f.display) },
  { brand: 'harman', slug: 'red', label: 'Red', match: (f) => /\bred\s*125\b/i.test(f.display) },
  { brand: 'harman', slug: 'switch-azure', label: 'Switch Azure', match: (f) => /\bswitch\b/i.test(f.display) },
];

for (const r of RANGES) {
  if (/-film$/.test(r.slug) || ALL_FACETS.some((x) => x.slug === r.slug)) {
    throw new Error(`Range slug "${r.brand}/${r.slug}" would collide with a facet page under /brand/${r.brand}/.`);
  }
}

const rangeFilms = (r) => getFilms().filter((f) => f.brand === r.brand && r.match(f));

// A range earns a page on its fresh films alone. Expired stock is one-off
// listings that come and go between builds, so a page standing on them would
// flicker in and out of the sitemap; once the page exists it lists them too.
// Gold, at two fresh stocks, waits for a third: two cards would only repeat
// the film pages they link to.
function builtRanges() {
  return RANGES.filter((r) => rangeFilms(r).filter((f) => !f.expired).length >= MIN_COMBO_FILMS);
}

// The brand's ranges that have a page, with how many films each lists, in the
// order RANGES gives them (it reads as the maker's own line-up).
export function rangesForBrand(brandSlug) {
  return builtRanges()
    .filter((r) => r.brand === brandSlug)
    .map((r) => ({ slug: r.slug, label: r.label, count: rangeFilms(r).length }));
}

export function resolveBrandRange(brandSlug, rangeSlug) {
  const range = builtRanges().find((r) => r.brand === brandSlug && r.slug === rangeSlug);
  if (!range) return null;
  return {
    range,
    brand: { slug: brandSlug, label: brandLabel(brandSlug) },
    heading: `${brandLabel(brandSlug)} ${range.label} film`,
    match: (f) => f.brand === brandSlug && range.match(f),
  };
}

// The range page a film belongs to, or null. First match wins, and only a
// range that has a page counts, so a film never links to one that wasn't built.
export function rangeForFilm(film) {
  const r = builtRanges().find((x) => x.brand === film.brand && x.match(film));
  return r ? { slug: r.slug, label: r.label, href: `/brand/${r.brand}/${r.slug}` } : null;
}

export function brandList() {
  const counts = new Map();
  for (const f of getFilms()) { if (f.brand) counts.set(f.brand, (counts.get(f.brand) || 0) + 1); }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count, label: brandLabel(slug) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

// Facets that actually have films — used to build navigation without dead links.
export function availableFormats() { return FORMATS.filter((x) => has(x.match)); }
export function availableTypes() { return TYPES.filter((x) => has(x.match)); }
export function availableConditions() { return CONDITIONS.filter((x) => has(x.match)); }

// ---- the /brands index ----------------------------------------------------

// Brands grouped for the A–Z directory: one entry per letter of the display
// name, case-insensitively, with anything that does not start A–Z (digits, a
// symbol) collected under "#". Each brand carries its film names so the index
// can be searched by film as well as by maker — the whole directory ships in
// the HTML, so this is the same data the page already renders.
export function brandDirectory() {
  const films = getFilms();
  const groups = new Map();
  for (const b of brandList()) {
    const initial = b.label.trim().charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(initial) ? initial : '#';
    const entry = {
      ...b,
      films: films.filter((f) => f.brand === b.slug).map((f) => f.display),
    };
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(entry);
  }
  return [...groups.entries()]
    .map(([letter, brands]) => ({
      letter,
      brands: brands.sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' })),
    }))
    // "#" sorts ahead of A, as it reads in the letter index.
    .sort((a, b) => (a.letter === '#' ? -1 : b.letter === '#' ? 1 : a.letter.localeCompare(b.letter)));
}

// The brands with the most live retailer listings. A listing is one offer from
// one shop, so a film carried by five shops counts five times — that is the
// measure of how widely a maker is stocked, which is what the ranking is for.
//
// Only films a shop currently lists are counted. build-site-data.js already
// drops films no shop returned, but the check is here too: if the catalogue
// ever keeps a tombstone page for a film that has left the shops, it must not
// carry its old brand up this list.
//
// Six, so the cards fill two even rows of three on the /brands page; the
// Browse menu shows the same six.
export const TOP_BRANDS = 6;

export function topBrandsByListings(limit = TOP_BRANDS) {
  const totals = new Map();
  for (const f of getFilms()) {
    if (!f.brand || !f.offers || f.offers.length === 0) continue;
    if (!totals.has(f.brand)) totals.set(f.brand, { listings: 0, shops: new Set() });
    const t = totals.get(f.brand);
    for (const o of f.offers) { t.listings++; t.shops.add(o.retailer); }
  }
  return [...totals.entries()]
    .map(([slug, t]) => ({ slug, label: brandLabel(slug), listings: t.listings, shops: t.shops.size }))
    // Alphabetical on a tie, so the order is stable from one rebuild to the next.
    .sort((a, b) => b.listings - a.listings || a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }))
    .slice(0, limit);
}
