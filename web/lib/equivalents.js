import { RANGES } from './facets';
import { getFilms } from './data';

// Films Kodak sells under two names. When Eastman Kodak took over distribution
// of its still films from Kodak Alaris in late 2025, most kept their names
// (Gold, UltraMax, Tri-X, Ektar, Ektachrome), and those share one page: the
// normaliser strips "Eastman" (src/normalise.js). Two ranges came back renamed
// instead, and stay separate pages because they are sold as separate products:
// Portra as Ektacolor Pro, and T-Max as Ektapan. Each pair of ranges is listed
// here, and a film page links to its counterpart in the other range, matched
// on format, speed, sheet size and bulk roll or not.
//
// Kodacolor is deliberately absent. Whether it is Pro Image 100 and ColorPlus
// 200 renamed is not confirmed, so it gets no link until it is.
//
// Each entry is [brand, range, range], using the range slugs in RANGES.
export const EQUIVALENT_RANGES = [
  ['kodak', 'portra', 'ektacolor-pro'],
  ['kodak', 't-max', 'ektapan'],
];

// A sheet film's size, read the same either way round ("5x4" is 4x5).
function sheetSize(film) {
  const m = `${film.slug} ${film.display}`.match(/\b(\d{1,2})\s*x\s*(\d{1,2})\b/i);
  return m ? [Number(m[1]), Number(m[2])].sort((a, b) => a - b).join('x') : null;
}

// A 30.5m bulk roll is format 35mm like a single roll, so the two would both
// match a 35mm film and the pair would be skipped as ambiguous.
const isBulk = (film) => /\bbulk\b|\b\d{1,3}(?:[.-]\d)?\s*-?m\b/i.test(`${film.slug.replace(/-/g, ' ')} ${film.display}`);

const rangeBySlug = (brand, slug) => RANGES.find((r) => r.brand === brand && r.slug === slug);

// The film in the paired range with the same format, speed and (for sheet
// film) size. Only a single, unambiguous match is linked: a guess between two
// candidates would point a reader at the wrong film. Expired stock is never
// linked either way, since it comes and goes between builds.
export function equivalentFilm(film) {
  if (!film || film.expired) return null;
  for (const [brand, a, b] of EQUIVALENT_RANGES) {
    if (film.brand !== brand) continue;
    const ra = rangeBySlug(brand, a);
    const rb = rangeBySlug(brand, b);
    if (!ra || !rb) continue;
    const other = ra.match(film) ? rb : rb.match(film) ? ra : null;
    if (!other) continue;
    const size = film.format === 'sheet' ? sheetSize(film) : null;
    const candidates = getFilms().filter((g) =>
      g.brand === brand && !g.expired && other.match(g) &&
      g.format === film.format && Number(g.iso) === Number(film.iso) &&
      isBulk(g) === isBulk(film) &&
      (film.format !== 'sheet' || sheetSize(g) === size));
    return candidates.length === 1 ? candidates[0] : null;
  }
  return null;
}
