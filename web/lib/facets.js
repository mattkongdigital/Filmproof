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

const has = (match) => getFilms().some(match);

// Films matching a facet, cheapest-first (films with no live price sink to the end).
export function filmsFor(match) {
  return getFilms()
    .filter(match)
    .sort((a, b) => (a.best ?? Infinity) - (b.best ?? Infinity) || a.display.localeCompare(b.display));
}

export function resolveCategory(slug) {
  const fmt = FORMATS.find((x) => x.slug === slug);
  if (fmt) return { kind: 'format', label: fmt.label, heading: `${fmt.label} film`, match: fmt.match };
  const typ = TYPES.find((x) => x.slug === slug);
  if (typ) return { kind: 'type', label: typ.label, heading: `${typ.label} film`, match: typ.match };
  return null;
}

export function categoryParams() {
  return [...FORMATS, ...TYPES].filter((x) => has(x.match)).map((x) => ({ category: x.slug }));
}

export function resolveCombo(categorySlug, subSlug) {
  const fmt = FORMATS.find((x) => x.slug === categorySlug && x.roll);
  const typ = TYPES.find((x) => x.short === subSlug);
  if (!fmt || !typ) return null;
  return { fmt, typ, heading: `${typ.label} ${fmt.label} film`, match: (f) => fmt.match(f) && typ.match(f) };
}

export function comboParams() {
  const out = [];
  for (const fmt of FORMATS.filter((f) => f.roll)) {
    for (const typ of TYPES) {
      if (has((f) => fmt.match(f) && typ.match(f))) out.push({ category: fmt.slug, sub: typ.short });
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
