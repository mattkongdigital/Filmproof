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

export function brandSubParams() {
  const out = [];
  for (const b of brandList()) {
    for (const facet of ALL_FACETS) {
      if (countFor(b.slug, facet) >= MIN_COMBO_FILMS) out.push({ slug: b.slug, sub: facet.slug });
    }
  }
  return out;
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
