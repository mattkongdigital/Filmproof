// normalise.js
// Reduce a messy retailer title (any film format) to a canonical identity key:
//   {brand}-{line}-{format}[-{iso}]
// Both canonical films and incoming offers run through this, so a match is
// just key equality. Exposure count and pack size are parsed as DATA, not
// identity — a 24exp and a 36exp roll of one stock share a film.

// Brand detection is phrase-based and ordered (specific/multi-word first),
// so "Kosmo Foto", "Japan Camera Hunter" and "AgfaPhoto" all resolve cleanly.
const BRAND_PATTERNS = [
  [/\bjapan camera hunter\b|\bjch\b/, 'jch'],
  [/\bkosmo\s*foto\b/, 'kosmofoto'],
  [/\boptik\s*oldschool\b/, 'optikoldschool'],
  [/\bmira\s*films?\b/, 'mira'],
  [/\bmr\.?\s*negative\b/, 'mrnegative'],
  [/\bstreet\s*candy\b/, 'streetcandy'],
  [/\breflx\s*lab\b|\breflx\b/, 'reflx'],
  [/\bfilm\s*photography\s*project\b|\bfpp\b/, 'fpp'],
  [/\blucky\s*film\b|\blucky\b/, 'lucky'],
  [/\brera\s*pan\b|\brera\b/, 'rera'],
  [/\borwo\b|\bwolfen\b/, 'orwo'],
  [/\bagfaphoto\b|\bagfa\b/, 'agfa'],
  [/\bfujichrome\b/, 'fujifilm'],
  [/\bfujicolou?r\b/, 'fujifilm'],
  [/\bfujifilm\b|\bfuji\b/, 'fujifilm'],
  [/\blomography\b|\blomo\b/, 'lomography'],
  [/\bfomapan\b|\bfoma\b/, 'foma'],
  [/\bkodak\b/, 'kodak'],
  [/\bilford\b/, 'ilford'],
  [/\bcinestill\b/, 'cinestill'],
  [/\bkentmere\b/, 'kentmere'],
  [/\bleica\b|\bleitz\b/, 'leica'],
  [/\brollei\b/, 'rollei'],
  [/\bferrania\b/, 'ferrania'],
  [/\bpolaroid\b/, 'polaroid'],
  [/\bharman\b/, 'harman'],
  [/\bwashi\b/, 'washi'],
  [/\bbergger\b/, 'bergger'],
  [/\badox\b/, 'adox'],
  [/\bshanghai\b/, 'shanghai'],
  [/\bkono\b/, 'kono'],
  [/\bflic\b/, 'flic'],
  [/\brevolog\b/, 'revolog'],
  [/\bcatlabs\b/, 'catlabs'],
  [/\bdubblefilm\b|\bdubble\b/, 'dubblefilm'],
  [/\banalogheld\b/, 'analogheld'],
  [/\bhanalogital\b/, 'hanalogital'],
  [/\bkameratori\b/, 'kameratori'],
  [/\bretrospekt\b/, 'retrospekt'],
  [/\bsilbersalz\s*35\b|\bsilbersalz\b/, 'silbersalz'],
  [/\byodica\b/, 'yodica'],
  [/\bcandido\b/, 'candido'],
  [/\boriental\b/, 'oriental'],
  [/\bwittner\b/, 'wittner'],
  [/\bcinemot\b/, 'cinemot'],
  [/\bfilmneverdie\b|\bfnd\b/, 'filmneverdie'],
  [/\bdragon\s*film\b|\bdragonfilm\b/, 'dragonfilm'],
  [/\breto\b/, 'reto'],
];

// Residual single-word brand tokens to strip from the product line.
const BRAND_WORDS = new Set([
  'kodak','ilford','fujifilm','fuji','cinestill','lomography','lomo','agfa','agfaphoto',
  'kentmere','rollei','fomapan','foma','ferrania','polaroid','harman','washi','bergger','leica','leitz',
  'adox','shanghai','kono','flic','fpp','revolog','catlabs','jch','dubblefilm','dubble',
  'analogheld','hanalogital','kameratori','orwo','wolfen','reto','retrospekt','silbersalz',
  'yodica','candido','oriental','wittner','kosmo','optik','mira','lucky','rera',
  'cinemot','filmneverdie','fnd','dragonfilm','dragon','alaris','fujichrome','fujicolor','fujicolour',
]);

const ISO_SPEEDS = new Set([25,32,40,50,64,80,100,125,160,200,250,320,400,500,640,800,1000,1250,1600,3200,6400]);
const FORMAT_TOKENS = new Set(['135','120','110','127','220','35mm','35','mm','16mm','8mm','super8','sheet','4x5','5x4','8x10','10x8']);
const EXP_WORDS = new Set(['exp','exposure','exposures']);
const NOISE = new Set([
  'film','films','colour','color','negative','neg','print','iso','asa','roll','rolls','single','pack','pk','of',
  'super','double','twin','triple','quad','std','movie','cine','sheet','large','format','micro','microfilm','disposable','reusable',
  'reversal','daylight','tungsten','ft','bw','value','box','new','the','and','with','pro','coming','soon','set','expired','instant','sheets','professional','positive','slide',
  // LomoChrome is Lomography's family name for its colour lines, and shops
  // include or drop it freely — "Lomography Metropolis" and "Lomography
  // LomoChrome Metropolis" are one film listed two ways. Left in, it forks the
  // line and the catalogue carries two pages for the same stock. There is no
  // Lomography line whose identity is the word alone, so dropping it merges
  // Metropolis, Purple, Turquoise and Classicolor rather than losing anything.
  'lomochrome',
]);

export function parseFilmTitle(raw, typeHint = '', extraIso = null) {
  const text = String(raw).toLowerCase()
    .replace(/\bblack\s*(?:and|&|n)?\s*white\b/g, ' ')
    .replace(/\bb\s*&\s*w\b/g, ' ')
    .replace(/\bc-?41\b/g, ' ')
    .replace(/\becn-?2\b/g, ' ')
    .replace(/\be-?6\b/g, ' ')
    .replace(/\+/g, ' plus ')
    .replace(/[&']/g, ' ')
    .replace(/\b\d+\s*sheets?\b/g, ' ')          // Instant "10 sheets" shot count
    // Canonical names for mainstream ranges, so spacing/spelling variants merge.
    .replace(/\bcolou?r\s*plus\b/g, 'colorplus')
    .replace(/\bultra\s*max\b/g, 'ultramax')
    .replace(/\btri[\s-]?x\b/g, 'trix')
    .replace(/\bt[\s-]?max\b/g, 'tmax')
    .replace(/\bpro\s*image\b/g, 'proimage')
    .replace(/\bhp\s?5(?:\s*plus)?\b/g, 'hp5plus')   // "HP5" and "HP5 Plus" are one film
    .replace(/\bfp\s?4(?:\s*plus)?\b/g, 'fp4plus')
    .replace(/\bpan\s?f(?:\s*plus)?\b/g, 'panfplus')
    .replace(/\bgold\s+gb\b/g, 'gold')          // GB is a factory code — same film
    // Foma renamed its three main stocks (Classic 100 / Creative 200 / Action
    // 400) but shops still stock both spellings, and some carry the bare
    // "Fomapan 200". They are one film, so drop the range word.
    .replace(/\bfomapan\s+(?:classic|creative|action)\b/g, 'fomapan')
    // Shops glue the multipack word onto "pack" ("Twinpack") as often as they
    // space it, and the pack rule below keys off a standalone "pack".
    .replace(/\b(twin|double|triple|quad)pack\b/g, '$1 pack')
    // Some shops glue the ISO onto the line name ("SFX200"). We can't split
    // digits off *any* line name — plenty (Tri-X, HP5, T-Max, 3200) are
    // legitimately alphanumeric — so this only fires for known line names,
    // turning "SFX200" into "SFX 200" so the ISO parses out normally.
    .replace(/\b(sfx|delta|ortho|superpan|acros|velvia|provia|portra|ektar|gold|colou?rplus|ultramax|proimage|superia|fomapan|kentmere)\s*(\d{2,4})\b/g, '$1 $2')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const hint = String(typeHint).toLowerCase();

  // brand — and drop everything up to & including it (vendor/shop-name noise
  // like "Kodak Alaris" or "Take It Easy Lab" sits before the real film name).
  let brand = null, brandMatch = null;
  for (const [re, slug] of BRAND_PATTERNS) { const m = text.match(re); if (m) { brand = slug; brandMatch = m[0]; break; } }
  let lineText = text;
  if (brandMatch) {
    const idx = text.indexOf(brandMatch);
    lineText = text.slice(idx + brandMatch.length);
  }

  // Expired stock is a different product from fresh — different price, different
  // results — so it keys separately (below) and is surfaced as its own browse
  // axis on the front end. 'expired' is in NOISE, so it never reaches `line`.
  const expired = /\bexpired\b/.test(text);

  // The shop's category is normally the better signal — it knows a 30.5m bulk
  // roll is bulk even when the title only says "35mm". But a shop can also
  // simply misfile a product: Bass & Bligh list "Leica Monopan 50 35mm Film"
  // under a "120 Film" category. So when BOTH the category and the title name
  // a plain roll format and they disagree, the title wins — a title that spells
  // out "35mm Film" is more specific than a shelf. Packaging formats (bulk,
  // sheet, movie, instant) keep category priority, because those encode how the
  // film is sold and the title often doesn't repeat it.
  const ROLL_FORMATS = new Set(['135', '120', '110', '127', '220', '620']);
  const hintFormat = detectFormat(hint);
  const textFormat = detectFormat(text);
  const format =
    hintFormat && textFormat && hintFormat !== textFormat &&
    ROLL_FORMATS.has(hintFormat) && ROLL_FORMATS.has(textFormat)
      ? textFormat
      : (hintFormat || textFormat);

  let exp = null;
  const em = text.match(/\b(\d{2})\s?(?:exp|exposure|exposures)\b/) || text.match(/\b135[\s-]?(\d{2})\b/);
  if (em) exp = em[1];

  let packSize = 1;
  const pm = text.match(/(\d+)\s*[-x]?\s*pack\b/) || text.match(/pack of (\d+)/) || text.match(/\bset of (\d+)/) || text.match(/\bbundle of (\d+)/);
  if (pm) { const n = parseInt(pm[1], 10); if (n >= 2 && n <= 12) packSize = n; }
  // Shops write multipacks in words as often as digits — "Triple Pack",
  // "Twinpack", "Twin Film Pack". Left unparsed these both inflate the price
  // (matchOffer divides by packSize) and leak the word into the film's identity
  // key, forking "Kodak Gold 200 Triple Pack" off its own single roll. Only
  // counted when the title also says "pack", so "Double 8mm" and Double-X stay
  // single rolls.
  if (packSize === 1 && /\bpack\b/.test(text)) {
    const wm = text.match(/\b(twin|double|triple|quad)\b/);
    if (wm) packSize = { twin: 2, double: 2, triple: 3, quad: 4 }[wm[1]];
  }

  let iso = null;
  for (const t of text.split(' ')) {
    // "E100" and friends carry the speed inside the line name (Ektachrome E100
    // is ISO 100). Read the ISO out of it but leave the token in `line`, so the
    // key matches shops that spell the speed out separately.
    const m = t.match(/^(\d{2,4})[std]?$/) || t.match(/^e(\d{2,4})$/);
    if (m) { const n = Number(m[1]); if (ISO_SPEEDS.has(n) && String(n) !== exp && n !== packSize) { iso = String(n); break; } }
  }
  if (iso == null && extraIso != null) iso = String(extraIso);

  const line = lineText.split(' ').filter(Boolean).filter((t) => {
    if (BRAND_WORDS.has(t)) return false;
    if (FORMAT_TOKENS.has(t)) return false;
    if (NOISE.has(t)) return false;
    if (EXP_WORDS.has(t)) return false;
    if (t === exp || t === iso) return false;
    if (/^(\d{2,4})[std]?$/.test(t) && ISO_SPEEDS.has(Number(t.replace(/[std]$/, '')))) return false;
    if (/^\d{4}$/.test(t)) return false;
    if (packSize > 1 && Number(t) === packSize) return false;
    if (/^\d{2}(exp|exposure|exposures)$/.test(t)) return false;
    if (/^\d+(pack|pk)$/.test(t)) return false;
    // "(36 Exposures x3)" repeats the pack count — but only drop it when it
    // really is the pack count, or CatLABS X80 loses its name.
    if (packSize > 1 && t === `x${packSize}`) return false;
    if (/^\d+ft$/.test(t)) return false;
    if (/^(8|16)$/.test(t)) return false;
    return true;
  // Sorted, not source order: shops write the same film's modifiers in whatever
  // order reads best ("Limited Edition Ilford HP5 Plus Football" vs "Ilford HP5
  // PLUS ... FOOTBALL Limited Edition"). The tokens are identical, so sorting
  // makes those one film instead of two. `line` is an identity key, never shown.
  }).sort().join('');

  const identified = Boolean(brand && format && (line || iso));
  const baseKey = identified ? [brand, line, format, iso].filter(Boolean).join('-') : null;
  const key = baseKey && expired ? `${baseKey}-expired` : baseKey;

  return { brand, line, format, iso, exp, packSize, expired, key, identified, complete: identified, cleaned: text };
}

function detectFormat(s) {
  if (!s) return null;
  if (/instant|instax|polaroid/.test(s)) return 'instant';
  if (/large format|sheet|4x5|5x4|8x10|10x8/.test(s)) return 'sheet';
  if (/super\s?8|double\s?8|std\s?8|\b16\s?mm\b|\b8\s?mm\b|movie|\bcine\b/.test(s)) return 'movie';
  if (/micro\s?film/.test(s)) return 'micro';
  if (/\b135\b/.test(s) || /\b35\s?mm\b/.test(s)) return '135';
  if (/\b120\b/.test(s)) return '120';
  if (/\b110\b/.test(s)) return '110';
  if (/\b127\b/.test(s)) return '127';
  if (/\b220\b/.test(s)) return '220';
  if (/\b620\b/.test(s)) return '620';
  if (/\bbulk\b/.test(s) || /\b\d{1,3}(?:\.\d)?\s?m\b/.test(s)) return 'bulk';
  return null;
}
