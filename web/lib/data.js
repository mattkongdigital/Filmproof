// lib/data.js — the front end's only data source.
// site.json is produced by `node build-site-data.js` at the project root
// (which runs the matcher). In production, swap this for a query against the
// offers table instead of a static import.

import site from '../data/site.json';

export function getFilms() {
  return site;
}

export function getFilm(slug) {
  return site.find((f) => f.slug === slug) || null;
}


// Slugs that used to be their own film page and now resolve to another. The
// catalogue is rebuilt from live shop data every deploy, so a slug normally
// comes and goes with the stock behind it — that churn is not worth tracking.
// This is for the other case: two pages that were always ONE film, merged in
// the normaliser. The old URL was real, was indexed, and now has nowhere to go,
// so it keeps a page that points at the survivor.
//
// `lomography-lomochrome-metropolis-110-film` was the same 110 Metropolis as
// `lomography-metropolis-110-film`; shops write LomoChrome's family name or
// drop it, and the line forked on that token.
//
// Lucky's colour negative forked the same way on the manufacturer's "C" code:
// `lucky-colour-200-film-35mm` and `lucky-film-200-120` were the shops that
// write the speed bare, and they are the same films as the C200 pages.
//
// Onboarding Chemical Dependency Lab retired two more. It states DragonFilm's
// speed where PJL does not, so the ISO-stub merge folded the bare page into the
// ISO'd one and the slug moved with it; and adding 'medium' to NOISE (its 120
// titles all say "120 Medium Format") merged PJL's Portra 800 page into the
// plain one the other shops share.
export const LEGACY_FILM_SLUGS = {
  'lomography-lomochrome-metropolis-110-film': 'lomography-metropolis-110-film',
  'lucky-colour-200-film-35mm': 'lucky-colour-c200-35mm-film',
  'lucky-film-200-120': 'lucky-colour-c200-120-film',
  'dragonfilm-no-i-35mm-black-and-white-film': 'dragonfilm-no-i-100-iso-35mm-black-white',
  'kodak-portra-800-120-medium-format-film': 'kodak-portra-800-120-film',
  // Eastman Kodak's own listings ("Kodak Eastman GOLD 200", "Eastman Kodak
  // (EKC) ...") forked every stock they carry from the plain "Kodak Gold 200"
  // page, until 'eastman' and 'ekc' went into BRAND_WORDS. Shop notes forked a
  // few more: a use-by date ("2028 Expiry"), Tri-X's "TX" code, and
  // "(Portra 800)" after Ektacolor Pro 800.
  'kodak-gold-120-film': 'kodak-eastman-gold-200-120-film',
  'kodak-eastman-gold-200-120': 'kodak-eastman-gold-200-120-film',
  'kodak-gold-200-35mm-film': 'kodak-eastman-gold-200-35mm-film',
  'kodak-eastman-gold-200-35mm': 'kodak-eastman-gold-200-35mm-film',
  'kodak-ultramax-400-35mm-film': 'kodak-eastman-ultramax-400-35mm-film',
  'kodak-eastman-ultramax-400-35mm': 'kodak-eastman-ultramax-400-35mm-film',
  'kodak-kodacolor-100-35mm': 'kodak-eastman-kodacolor-100-35mm-film',
  'kodak-kodacolor-200-35mm': 'kodak-eastman-kodacolor-200-35mm-film',
  'kodak-eastman-kodacolor-200-35mm-colour-film': 'kodak-eastman-kodacolor-200-35mm-film',
  'kodak-ektachrome-e100-120-film': 'kodak-eastman-ektachrome-e100-colour-reversal-120-film',
  'kodak-ektachrome-e100-35mm-film': 'kodak-eastman-ektachrome-e100-colour-reversal-35mm-film',
  'kodak-ektacolor-pro-160-120': 'kodak-eastman-ektacolor-pro-160-120-film',
  'kodak-ektacolor-pro-160-35mm': 'kodak-eastman-ektacolor-pro-160-35mm-film',
  'kodak-ektacolor-pro-400-120': 'kodak-eastman-ektacolor-pro-400-120-film',
  'kodak-ektacolor-pro-400-35mm': 'kodak-eastman-ektacolor-pro-400-35mm-film',
  'kodak-ektacolor-pro-800-120': 'kodak-eastman-ektacolor-pro-800-120-film',
  'kodak-ektacolor-pro-800-120-film-portra-800': 'kodak-eastman-ektacolor-pro-800-120-film',
  'kodak-ektacolor-pro-800-35mm': 'kodak-eastman-ektacolor-pro-800-35mm-film',
  'kodak-ektapan-100-120': 'kodak-eastman-ektapan-100-120-film',
  'kodak-ektapan-100-35mm': 'kodak-eastman-ektapan-100-35mm-film',
  'kodak-ektapan-400-120': 'kodak-eastman-ektapan-400-120-film',
  'kodak-ektapan-400-35mm': 'kodak-eastman-ektapan-400-35mm-film',
  'kodak-ektar-120-film': 'kodak-eastman-ektar-100-120-film',
  'kodak-ektar-100-35mm-film': 'kodak-eastman-ektar-100-35mm-film',
  'kodak-tri-x-400-35mm-film': 'kodak-eastman-tri-x-400-35mm-film',
  'kodak-tri-x-tx-135-pack': 'kodak-eastman-tri-x-400-35mm-film',
  'kodak-tri-x-400-120-film': 'kodak-eastman-tri-x-400-120-film',
  'kodak-tri-x-400-tx-120-b-w-film': 'kodak-eastman-tri-x-400-120-film',
  'kodak-tri-x-400-30-5m-bulk-roll-35mm': 'kodak-eastman-tri-x-400-30-5m-bulk-roll-35mm-film',
  'kodak-tri-x-320-8x10-large-format-film-10-sheets': 'kodak-eastman-tri-x-320-large-format-film-8x10',
  'kodak-portra-400-120-film-2028-expiry': 'kodak-portra-400-120-film',
  'cinestill-bwxx-black-white-negative-film-120-expiry-03-26': 'cinestill-bwxx-120-film',
  // Onboarding Parallax Photographic. Its titles state the speed where other
  // shops' don't, so the ISO-less listings now merge into its entry and take
  // its slug (Dubblefilm 120, Revolog 460nm). And the normaliser learned the
  // names it writes, which closed older forks too: "400Dynamic" is CineStill
  // 400D, Kino is Lomography's family word, and a speed range ("100-400") no
  // longer keys Metropolis and Purple apart from their ISO 400 pages.
  'revolog-460nm-120-film': 'revolog-460nm-200-120-film',
  'dubblefilm-apollo-120-film': 'dubblefilm-apollo-200-120-film',
  'dubblefilm-bubblegum-120-film': 'dubblefilm-bubblegum-200-120-film',
  'dubblefilm-pacific-120-film': 'dubblefilm-pacific-200-120-film',
  'cinestill-400dynamic-colour-135-film': 'cinestill-400d-35mm-film',
  'lomography-potsdam-kino-b-w-iso-100-35mm-film': 'lomography-potsdam-100-35mm-film',
  'lomochrome-metropolis-100-400-35mm-film': 'lomography-metropolis-35mm-film',
  'lomography-lomochrome-purple-35mm-film-100-400-iso': 'lomography-purple-35mm-film',
  // "Three Pack" is now read as three rolls, so Classic Photo Supplies' Lomography
  // three-packs join their films' pages instead of standing alone. And a page
  // no longer takes its name from a pack word or a use-by date in the first
  // shop's title ("- Three Pack - Expiry 08/26", "Double Pack").
  'lomography-lady-grey-b-w-35mm-400-iso-film-three-pack': 'lomography-lady-grey-400-35mm-film',
  'lomography-color-negative-400-35mm-three-pack': 'lomography-colour-negative-400-35mm-film',
  'lomography-color-negative-800-35mm-film-three-pack': 'lomography-colour-negative-800-35mm-film',
  'lomography-redscale-xr-50-200-35mm-film': 'lomography-redscale-xr-35mm-50-200-iso-film',
  'lomography-redscale-xr-35mm-50-200-iso-film-three-pack-expiry-08-26': 'lomography-redscale-xr-35mm-50-200-iso-film',
  'lomography-lomochrome-color-92-sun-kissed-35mm-400-iso-triple-pack': 'lomography-lomochrome-color-92-sun-kissed-35mm-400-iso',
  'fujicolor-c200-35mm-film-double-pack-expired': 'fujicolor-c200-35mm-film-expired',
  'kodak-gold-200-35mm-film-double-pack-expired': 'kodak-gold-200-35mm-film-expired',
  'polaroid-color-go-instant-film-double-pack-black-frame-edition': 'polaroid-color-go-instant-film-black-frame-edition',
  // Kentmere is sold as both "Kentmere 100" and "Kentmere Pan 100", PJL files
  // some of it under Ilford, and PJL's 120 titles add "photographic film". Each
  // of those forked a page; they now join the Pan pages.
  'kentmere-100-35mm': 'kentmere-pan-100-35mm-film',
  'kentmere-200-35mm': 'kentmere-pan-200-35mm-film',
  'kentmere-400-35mm': 'kentmere-pan-400-35mm-film',
  'kentmere-400-120': 'kentmere-pan-400-120-film',
  'kentmere-400-120-photographic-film': 'kentmere-pan-400-120-film',
  'kentmere-100-120-photographic-film': 'kentmere-pan-100-120-film',
  // Tidied before range pages went up, since a range lists every film in it:
  // "Expires 03/26" read like the "Expiry" note it is, "Porta" as the Portra
  // it misspells, "400T-Max" as T-Max 400, and Foma's range words wherever
  // they fall ("Fomapan 100 Classic"), not only straight after the brand.
  'kodak-gold-200-35mm-expires-03-26': 'kodak-eastman-gold-200-35mm-film',
  'kodak-porta-pro-800-35mm-colour-film': 'kodak-portra-800-35mm-film',
  'kodak-400t-max-135': 'kodak-t-max-400-35mm-film',
  'fomapan-100-classic-100-35mm-b-w-film': 'fomapan-classic-100-35mm-film',
  'fomapan-200-creative-135-35mm-b-w-film': 'fomapan-creative-200-35mm-film',
  'fomapan-400-action-135-35mm-b-w-film': 'fomapan-action-400-35mm-film',
  // Same again for the Ilford, Fujifilm and Harman ranges: "FP4 24 EXP PLUS"
  // said Plus twice, "EXP 36" put the count after the word, and Acros II is
  // sold with and without the Neopan name.
  'ilford-fp4-plus-125-35mm-film': 'ilford-fp4-plus-35mm-film',
  'ilford-hp5-plus-400-35mm-black-white-film-exp-36': 'ilford-hp5-plus-35mm-film',
  'fujifilm-acros-100-ii-120-film': 'fujifilm-neopan-acros-ii-120-film',
  // The duplicates the range pages showed up. A Kodak cine negative is
  // Vision3 whether or not a shop says so, and a cine roll's length is not its
  // identity; shops round a bulk roll's length ("30m", "30.5m"); FP4 Plus is
  // ISO 125 whatever a shop's tag says; Phoenix with no speed is the original
  // 200; and an Instax twin pack is two packs of the same film, however it is
  // written ("20 shots", "2 x 10 shots"). On instant film black and white is
  // now part of the name, which also split Polaroid's colour packs back off the
  // black and white pages they had been merged into.
  'kodak-vision3-500t-7219-colour-negative-16mm-film-30-5m': 'kodak-500t-16mm-movie-film',
  'kodak-vision3-200t-7213-colour-negative-16mm-film-30-5m': 'kodak-200t-16mm-movie-film',
  'kodak-vision3-50d-7203-colour-negative-16mm-film-30-5m': 'kodak-50d-16mm-movie-film',
  'ilford-hp5-plus-400-35mm-film-bulk-roll-30m': 'ilford-hp5-plus-400-35mm-30-5m-bulk-roll',
  'ilford-fp4-plus-125-4x5-film-25-sheets': 'ilford-fp4-plus-4x5-sheet-film-25-sheets',
  'harman-phoenix-35mm-colour-film': 'harman-phoenix-200-35mm-film',
  'fujifilm-instax-mini-twin-film-pack': 'fujifilm-instax-mini-film',
  'fujifilm-instax-mini-colour-film-20-shots': 'fujifilm-instax-mini-film',
  'fuji-instax-mini-film-2-x-10-shots': 'fujifilm-instax-mini-film',
  'fuji-instax-mini-monochrome-instant-film': 'fujifilm-instax-mini-film-black-and-white',
  'fujifilm-instax-square': 'fujifilm-instax-square-film-colour',
  'fujifilm-instax-wide-colour-film': 'fujifilm-instax-wide-film',
  'fujifilm-instax-wide-film-20-shots': 'fujifilm-instax-wide-film',
  'fuji-instax-wide-monochrome-instant-film': 'fujifilm-instax-wide-film-b-w',
  'polaroid-colour-600-film': 'polaroid-600-film-colour',
  // "Polaroid Originals" was the company's name from 2017 to 2020.
  'polaroid-originals-600-colour-instant-film-8-shots': 'polaroid-600-film-colour',
  // Sheet size is part of a sheet film's identity now, so 4x5 and 8x10 boxes
  // of one film no longer share a page. A page that held both goes to its 4x5
  // half, the size most of its offers were; Ektar 100 8x10, once folded into
  // the 4x5 page, is a page of its own again and so is not in this map.
  'kodak-eastman-ektacolor-pro-400-large-format-film': 'kodak-eastman-ektacolor-pro-400-large-format-film-4x5',
  'kodak-eastman-ektacolor-pro-160-large-format-film': 'kodak-eastman-ektacolor-pro-160-large-format-film-4x5',
  'kodak-eastman-tri-x-320-large-format-film': 'kodak-eastman-tri-x-320-large-format-film-4x5',
  'kodak-tri-x-320-5x7-large-format-film-50-sheets': 'kodak-eastman-tri-x-320-large-format-film-5x7',
};

// The film a legacy slug now points at, or null. Guards against a target that
// has itself left the catalogue: a redirect to a 404 is worse than a 404. And
// against a slug that is a live film again, as a split can bring one back: a
// live page always wins over a redirect.
export function resolveLegacyFilm(slug) {
  const target = LEGACY_FILM_SLUGS[slug];
  if (!target || getFilm(slug)) return null;
  const film = getFilm(target);
  return film ? { slug: target, film } : null;
}

export const gbp = (n) => '£' + Number(n).toFixed(2);

// What one price buys. Instant film is sold in packs of shots and sheet film
// in boxes of sheets, so a roll is the wrong word for either; every other
// format is a roll.
export const priceUnit = (film) => ({ instant: 'pack', sheet: 'box' }[film?.format] || 'roll');

export const formatLabel = (format) => ({
  '135': '35mm', '120': '120', '110': '110', '127': '127', '220': '220', '620': '620',
  instant: 'Instant', sheet: 'Sheet', movie: 'Cine', micro: 'Microfilm', bulk: 'Bulk',
}[format] || format || '—');

// Set this to your real domain before launch (used for canonicals + sitemap).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://filmproof.co.uk').replace(/\/$/, '');

const BRAND_LABELS = {
  fujifilm: 'Fujifilm', kodak: 'Kodak', ilford: 'Ilford', cinestill: 'CineStill',
  kentmere: 'Kentmere', kosmofoto: 'Kosmo Foto', agfa: 'AgfaPhoto', foma: 'Foma',
  lomography: 'Lomography', jch: 'Japan Camera Hunter', dubblefilm: 'dubblefilm',
  optikoldschool: 'Optik Oldschool', silbersalz: 'SilberSalz', filmneverdie: 'FilmNeverDie',
  rollei: 'Rollei', bergger: 'Bergger', adox: 'Adox', harman: 'Harman', polaroid: 'Polaroid',
  ferrania: 'Ferrania', revolog: 'Revolog', catlabs: 'CatLABS', lucky: 'Lucky Film',
  orwo: 'ORWO', reto: 'Reto', mira: 'Mira', yodica: 'Yodica', shanghai: 'Shanghai',
  washi: 'Film Washi', flic: 'Flic Film', kono: 'KONO', dragonfilm: 'Dragon Film',
  cinemot: 'CineMot', streetcandy: 'Street Candy', hanalogital: 'Hanalogital',
  kameratori: 'Kameratori', mrnegative: 'Mr Negative', reflx: 'Reflx Lab', rera: 'Rera',
  fpp: 'FPP', thisishowiroll: 'This Is How I Roll', alienfilm: 'Alien Film',
};

export const brandLabel = (slug) =>
  BRAND_LABELS[slug] || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : '');
