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
  // "This Is How I Roll" is long enough that shops (and the brand itself) repeat
  // it — the vendor field says "This is How I Roll Film" and the product title
  // says it again — so the pattern eats a whole run of repeats rather than the
  // first one, or the brand name leaks back into the line.
  [/(?:\bthis\s*is\s*how\s*i\s*roll(?:\s*film)?\b\s*)+/, 'thisishowiroll'],
  [/\balien\s*film\b/, 'alienfilm'],
  [/\breflx\s*lab\b|\breflx\b/, 'reflx'],
  [/\bfilm\s*photography\s*project\b|\bfpp\b/, 'fpp'],
  [/\blucky\s*film\b|\blucky\b/, 'lucky'],
  [/\brera\s*pan\b|\brera\b/, 'rera'],
  [/\borwo\b|\bwolfen\b/, 'orwo'],
  [/\bagfaphoto\b|\bagfa\b/, 'agfa'],
  [/\bfujichrome\b/, 'fujifilm'],
  [/\bfujicolou?r\b/, 'fujifilm'],
  [/\bfujifilm\b|\bfuji\b/, 'fujifilm'],
  // LomoChrome is only ever Lomography's, and Take It Easy Lab lists its films
  // under that name alone ("Lomochrome Color 92 - 35mm").
  [/\blomography\b|\blomo\b|\blomochrome\b/, 'lomography'],
  [/\bfomapan\b|\bfoma\b/, 'foma'],
  [/\bkodak\b/, 'kodak'],
  // Kentmere is made by Harman, who also make Ilford, and shops file it under
  // either vendor: PJL's "Kentmere 200 35mm" arrives as "Ilford Kentmere 200
  // 35mm". The film's own name wins, so Kentmere is matched before Ilford.
  [/\bkentmere\b/, 'kentmere'],
  [/\bilford\b/, 'ilford'],
  [/\bcinestill\b/, 'cinestill'],
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
  'alien','alienfilm',
  // Eastman Kodak is the company behind the film Kodak Alaris no longer makes
  // (Gold, Ektacolor, Ektar, Tri-X sold under the Eastman name since 2025), and
  // shops write it every way: "Kodak Eastman GOLD 200", "Eastman Kodak (EKC)
  // Kodak Eastman GOLD 200", or plain "Kodak Gold 200". It names the maker,
  // not the stock, so it must not reach `line` — left in, each spelling forked
  // the same roll into its own page.
  'eastman','ekc',
]);

const ISO_SPEEDS = new Set([25,32,40,50,64,80,100,125,160,200,250,320,400,500,640,800,1000,1250,1600,3200,6400]);
const FORMAT_TOKENS = new Set(['135','120','110','127','220','35mm','35','mm','16mm','8mm','super8','sheet','4x5','5x4','8x10','10x8']);
const EXP_WORDS = new Set(['exp','exposure','exposures']);
const NOISE = new Set([
  'film','films','colour','color','negative','neg','print','iso','asa','roll','rolls','single','pack','pk','of',
  'super','double','twin','triple','quad','std','movie','cine','sheet','large','medium','format','micro','microfilm','disposable','reusable',
  'reversal','daylight','tungsten','ft','bw','value','box','new','the','and','with','pro','coming','soon','set','expired','instant','sheets','professional','positive','slide',
  // LomoChrome is Lomography's family name for its colour lines, and shops
  // include or drop it freely — "Lomography Metropolis" and "Lomography
  // LomoChrome Metropolis" are one film listed two ways. Left in, it forks the
  // line and the catalogue carries two pages for the same stock. There is no
  // Lomography line whose identity is the word alone, so dropping it merges
  // Metropolis, Purple, Turquoise and Classicolor rather than losing anything.
  'lomochrome',
  // "2028 Expiry" / "Expiry 03/26" is a shop telling you the dating on fresh
  // stock; the date itself is stripped in parseFilmTitle(). It is not expired
  // film (that is the separate `expired` axis), and it is not the film's name.
  'expiry',
  // Kino is the family name of Lomography's cine-stock lines (Berlin, Potsdam,
  // Babylon, Fantôme), and shops include or drop it — "Potsdam 100" and
  // "Potsdam Kino 100" are one film — so, like LomoChrome, it is not identity.
  'kino',
  // "Three Pack", "Five Pack" — the count is read in parseFilmTitle(); the
  // word is not a name.
  'three','five',
  // "Kentmere 400 120 photographic film" is the same roll as "Kentmere 400,
  // 120"; the word describes the product, it doesn't name it.
  'photographic',
]);

// Speeds that belong to the film, not the listing. A shop's ISO tag only fills
// in a speed the title leaves out, and Analogue Wonderland tags FP4 Plus
// sheets "ISO 400", which keyed them apart from the same sheets at 125. These
// films come in one speed, so the name settles it. Matched as a substring of
// the sorted `line`, so "5x7fp4plus" and the Football HP5 count too.
const FIXED_ISO = [
  ['ilford', 'fp4plus', '125'],
  ['ilford', 'hp5plus', '400'],
  ['ilford', 'panfplus', '50'],
  ['fujifilm', 'instax', '800'],
];
// Speeds assumed only when neither the title nor a tag gives one. Phoenix
// without a number is the original ISO 200; Phoenix 125 always says so.
const DEFAULT_ISO = [
  ['harman', 'phoenix', '200'],
];
const isoFor = (table, brand, line) => (table.find(([b, l]) => b === brand && (l === line || (table === FIXED_ISO && line.includes(l)))) || [])[2] ?? null;

// Instant film is sold by the pack, and shops write a twin pack every way:
// "Twin Pack", "(20 shots)", "2 x 10 shots", "20 Sheet Pack". All but the first
// read as one pack of an unknown film, so a twin pack forked a page of its own
// and priced twenty shots as one pack. Here they all become "2 pack", which
// the pack rules below already understand. A pack is ten shots of Instax and
// eight of Polaroid, so Polaroid's "40 Shot Pack" is five packs, not four.
function instantPacks(text) {
  const perPack = /\binstax\b/.test(text) ? 10 : 8;
  return text
    .replace(/\b(\d)\s*x\s*(?:8|10)\s*(?:shots?|sheets?|exposures?|prints?|photos?)?\b/g, ' $1 pack ')
    .replace(/\bx?(\d{1,2})\s*(?:shots?|sheets?|exposures?|prints?|photos?)(?:\s*pack)?\b/g, (m, n) => {
      const packs = Number(n) / perPack;
      return Number.isInteger(packs) && packs >= 2 ? ` ${packs} pack ` : ' ';
    })
    // Not "photo": Instax Mini "Photo Slide" is a frame design, not a count.
    .replace(/\b(?:shots?|prints?)\b/g, ' ');
}

// A sheet film's size, as one token with the short side first, so "5x4" and
// "4x5" are one size. null when the text names none we know. Exported for
// build-catalogue.js, which splits a product sold in several sizes.
const SHEET_SIZES = new Set(['4x5', '5x7', '8x10', '11x14', '9x12', '13x18', '2.25x3.25', '3.25x4.25', '6.5x9']);
export function sheetSize(text) {
  for (const m of String(text).toLowerCase().matchAll(/(\d{1,2}(?:\.\d{1,2})?)\s*x\s*(\d{1,2}(?:\.\d{1,2})?)(?![\d.])/g)) {
    const [a, b] = [m[1], m[2]].sort((x, y) => Number(x) - Number(y));
    if (SHEET_SIZES.has(`${a}x${b}`)) return `${a}x${b}`;
  }
  return null;
}

export function parseFilmTitle(raw, typeHint = '', extraIso = null) {
  let text = String(raw).toLowerCase();
  const instant = /\b(?:instax|polaroid|instant)\b/.test(text);
  if (instant) {
    // On instant film, black and white IS the product: Instax Mini Monochrome
    // and Instax Mini Film, Black and White are one pack, and neither is the
    // colour one. Elsewhere it is the process, which the key does not carry.
    text = instantPacks(text)
      // "Polaroid Originals" was the company's name from 2017 to 2020; shops
      // still carry stock listed under it, and it names no film.
      .replace(/\boriginals\b/g, ' ')
      .replace(/\bblack\s*(?:and|&|n)?\s*white\b|\bb\s*[&/]\s*w\b/g, ' monochrome ');
  }
  text = text
    // "Fantôme" and "Fantome" are one film; an accent would otherwise split
    // the word in two at the non-ASCII strip below.
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\bblack\s*(?:and|&|n)?\s*white\b/g, ' ')
    .replace(/\bb\s*&\s*w\b/g, ' ')
    .replace(/\bc-?41\b/g, ' ')
    .replace(/\becn-?2\b/g, ' ')
    .replace(/\be-?6\b/g, ' ')
    .replace(/\+/g, ' plus ')
    .replace(/[&']/g, ' ')
    .replace(/\b\d+\s*sheets?\b/g, ' ')          // Instant "10 sheets" shot count
    // Shops round a roll's length: "30.5m" and "30m" are the same 100ft bulk
    // roll. One whole token, so a 17m roll still keys apart from a 30m one,
    // and detectFormat() still reads it for bulk.
    .replace(/\b(\d{1,3})\.\d\s?m\b/g, '$1m')
    // A use-by date is batch information, not identity: "Portra 400 - 2028
    // Expiry" is the same film as "Portra 400". Strip the date here, while its
    // slash is still there to delimit it — later it would split into tokens
    // ("08 26") that leak into `line`. The bare word goes via NOISE.
    // "Expires 03/26" is the same note in a verb: Gold 200 listed that way had
    // a page of its own beside the plain Gold 200. Not "expired", which is.
    .replace(/\bexpir(?:y|es)(?:\s*date)?\s*:?\s*(?:\d{1,2}\s*[/.-]\s*\d{2,4}|[a-z]{3,9}\.?\s+\d{2,4}|\d{4})?/g, ' expiry ')
    .replace(/\b(?:19|20)\d{2}\s+expir(?:y|es)\b/g, ' expiry ')
    // Canonical names for mainstream ranges, so spacing/spelling variants merge.
    .replace(/\bcolou?r\s*plus\b/g, 'colorplus')
    .replace(/\bultra\s*max\b/g, 'ultramax')
    .replace(/\btri[\s-]?x\b/g, 'trix')
    .replace(/\b(trix\b(?:\s+\d{3})?)\s+txp?\b/g, '$1')   // TX/TXP are Tri-X's own codes
    // Shops gloss Eastman's Ektacolor Pro with the Portra it replaces —
    // "Ektacolor Pro 800 (Portra 800)" — which is a note, not a second name.
    .replace(/\b(ektacolou?r\b[^(]*)\(\s*portra[^)]*\)/g, '$1')
    // "400T-Max" puts the speed first and glues it on, which no \b can split.
    .replace(/\b(\d{3,4})\s*t[\s-]?max\b/g, 'tmax $1')
    .replace(/\bt[\s-]?max\b/g, 'tmax')
    .replace(/\bpro\s*image\b/g, 'proimage')
    .replace(/\bhp\s?5(?:\s*plus)?\b/g, 'hp5plus')   // "HP5" and "HP5 Plus" are one film
    .replace(/\bfp\s?4(?:\s*plus)?\b/g, 'fp4plus')
    .replace(/\bpan\s?f(?:\s*plus)?\b/g, 'panfplus')
    // ...and a second "Plus" further on is the same word again: Film Camera
    // Store's "FP4 24 EXP PLUS 125" keyed apart from every other FP4 Plus.
    .replace(/\b(hp5plus|fp4plus|panfplus)\b(.*?)\s+plus\b/g, '$1$2')
    // Acros II is sold with and without Fujifilm's old "Neopan" family name.
    .replace(/\bneopan\s+((?:\d{2,4}\s+)?acros)\b/g, '$1')
    .replace(/\bgold\s+gb\b/g, 'gold')          // GB is a factory code — same film
    // Spelled-out and coded names for one stock: CineStill sells 400D as
    // "400Dynamic", and "BWXX" is its Double-X, which some shops add in words.
    .replace(/\b400\s?dynamic\b/g, '400d')
    .replace(/\bbwxx\s+double[\s-]?x\b/g, 'bwxx')
    .replace(/\bsx[\s-]?70\b/g, 'sx70')
    .replace(/\bsuperia\s+venus\b/g, 'venus')   // sold as both
    .replace(/\bsun[\s-]?kissed\b/g, 'sunkissed')
    .replace(/\bagfa\s+photo\b/g, 'agfaphoto')   // Film Camera Store's "AGFA Photo APX"
    .replace(/\b160\s?ns\b/g, '160 ns')          // Fuji Pro "160NS" / "160 NS"
    .replace(/\btesla\s+(ii|i)\b/g, (m, r) => `tesla ${r.length}`)   // Revolog Tesla I / 1
    // "Metropolis XR" is Lomography's current name for Metropolis, and the same
    // for Purple and Turquoise. Not XR everywhere: Redscale XR (50-200) is a
    // different film from Redscale 100, and the XR is what tells them apart.
    .replace(/\b(metropolis|purple|turquoise)\s+xr\b/g, '$1')
    // A speed range ("Metropolis 100-400", "Redscale XR 50-200 ISO") is a film
    // rated across speeds, not at the first one. Read as ISO 100, Parallax's
    // "Metropolis XR 100-400 110" sat beside AW's ISO 400 entry and left the
    // ISO-less listings between them ambiguous — one film split across three
    // pages. So a range sets no ISO from the title; the film keys like any
    // listing that states none, and joins its sibling in reconcileIsoStubs().
    .replace(/\b(\d{2,4})\s*[-–/]\s*(\d{2,4})\b/g, (m, a, b) =>
      (ISO_SPEEDS.has(Number(a)) && ISO_SPEEDS.has(Number(b)) && Number(a) < Number(b) ? ' ' : m))
    // Foma renamed its three main stocks (Classic 100 / Creative 200 / Action
    // 400) but shops still stock both spellings, and some carry the bare
    // "Fomapan 200". They are one film, so drop the range word.
    // Not always next to the brand, either: "Fomapan 100 Classic" is one too.
    .replace(/\bfomapan\b(.*)/g, (m, rest) => `fomapan${rest.replace(/\b(?:classic|creative|action)\b/g, ' ')}`)
    // Shops glue the multipack word onto "pack" ("Twinpack") as often as they
    // space it, and the pack rule below keys off a standalone "pack".
    .replace(/\b(twin|double|triple|quad)pack\b/g, '$1 pack')
    // Some shops glue the ISO onto the line name ("SFX200"). We can't split
    // digits off *any* line name — plenty (Tri-X, HP5, T-Max, 3200) are
    // legitimately alphanumeric — so this only fires for known line names,
    // turning "SFX200" into "SFX 200" so the ISO parses out normally.
    .replace(/\b(sfx|delta|ortho|superpan|acros|velvia|provia|portra|ektar|gold|colou?rplus|ultramax|proimage|superia|fomapan|kentmere|pancro|atm)\s*(\d{2,4})\b/g, '$1 $2')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Lucky's colour negative is sold as "Colour C200"/"C400" by some shops and
  // as plain "Colour 200"/"400" by others — the C is the manufacturer's code
  // for the colour range, not part of a line name, so it is the same film both
  // ways. Left in, the C sticks to `line` while the bare spelling has no line
  // at all, and one film forks into two pages per format (it also swallowed the
  // speed, so "C400" pages showed whatever ISO the shop's tags happened to
  // carry). Guarded on the brand and on the number really being a film speed,
  // because a leading C before digits means nothing of the sort elsewhere.
  if (/\blucky\b/.test(text)) {
    text = text.replace(/\bc\s?(\d{2,4})\b/g, (m, n) => (ISO_SPEEDS.has(Number(n)) ? n : m));
  }
  // Kentmere renamed its stocks "Kentmere Pan 100/200/400" and shops use both
  // names, so "Kentmere 100" and "Kentmere Pan 100" forked into two pages per
  // format. Pan is not identity for Kentmere (it has no other line), but it is
  // elsewhere (Bergger PAN400, Derev Pan), so this is scoped to the brand.
  if (/\bkentmere\b/.test(text)) {
    text = text.replace(/\bpan\b/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // "Porta" is a shop's misspelling of Portra, not a Kodak film; left alone it
  // gave Portra 800 35mm a second page.
  if (/\bkodak\b/.test(text)) text = text.replace(/\bporta\b/g, 'portra');
  // Harman Red is a redscale film, and one shop names it for that: "Harman
  // Redscale 125" is the Red 125 every other shop lists. Scoped to Harman, as
  // Lomography's Redscale is a film of its own.
  if (/\bharman\b/.test(text)) text = text.replace(/\bredscale\b/g, 'red');
  // Adox CHS 100 II is the only CHS 100 on sale (the original, made by Efke,
  // ended in 2012), and shops write it with or without the "II", which gave
  // it two pages in 35mm.
  if (/\badox\b/.test(text)) text = text.replace(/\bchs(\s*100)?\s+ii\b/g, 'chs$1');
  // LomoChrome Color '92 Sun-Kissed is a film of its own, a later and warmer
  // edition of Color '92, but shops write it "Colour '92 (Sunkissed)", "92
  // Sun-Kissed" or plain "Sun-Kissed", which forked it three ways per format.
  // The name settles it, so the "92" goes; plain Color '92 keeps its own page.
  if (/\blomography\b|\blomochrome\b/.test(text) && /\bsunkissed\b/.test(text)) {
    text = text.replace(/\b92\b/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // Lomography's colour negatives carry the same kind of range code — "Color
  // Tiger CN200" is the Tiger 200 other shops list without it.
  if (/\blomography\b|\blomo\b/.test(text)) {
    text = text.replace(/\bcn\s?(\d{2,4})\b/g, (m, n) => (ISO_SPEEDS.has(Number(n)) ? n : m));
  }

  // An instant "10 Pack" is the shot count, like "10 sheets" above: Instax
  // comes in tens and Polaroid in eights, and no shop lists ten boxes as one
  // product. Read as a pack size it priced a £10.45 box of Instax Mini at
  // £1.04 "per pack", the cheapest on the site by a mile.
  if (instant) text = text.replace(/\b(?:8|10)\s*pack\b/g, ' ').replace(/\s+/g, ' ').trim();

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
  let format =
    hintFormat && textFormat && hintFormat !== textFormat &&
    ROLL_FORMATS.has(hintFormat) && ROLL_FORMATS.has(textFormat)
      ? textFormat
      : (hintFormat || textFormat);

  let exp = null;
  // "36 Exp", and the other way round ("EXP 36"), and "135-36".
  const em = text.match(/\b(\d{2})\s?(?:exp|exposure|exposures)\b/) || text.match(/\bexp\s?(\d{2})\b/) || text.match(/\b135[\s-]?(\d{2})\b/);
  if (em) exp = em[1];
  // A title with no format but a 24, 27 or 36 exposure count is 35mm: no
  // other roll film comes in those lengths. Classic Photo Supplies lists
  // Harman Red as "Harman Redscale 125 Film - 36 Exposure" and nothing else.
  if (!format && ['24', '27', '36'].includes(exp)) format = '135';

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
    const wm = text.match(/\b(twin|double|triple|three|quad|five)\b/);
    if (wm) packSize = { twin: 2, double: 2, triple: 3, three: 3, quad: 4, five: 5 }[wm[1]];
  }

  let iso = null;
  for (const t of text.split(' ')) {
    // "E100" and friends carry the speed inside the line name (Ektachrome E100
    // is ISO 100). Read the ISO out of it but leave the token in `line`, so the
    // key matches shops that spell the speed out separately.
    const m = t.match(/^(\d{2,4})[std]?$/) || t.match(/^e(\d{2,4})$/);
    if (m) { const n = Number(m[1]); if (ISO_SPEEDS.has(n) && String(n) !== exp && n !== packSize) { iso = String(n); break; } }
  }
  const titleIso = iso;
  if (iso == null && extraIso != null) iso = String(extraIso);

  // Cine gauges share the 'movie' format, so the gauge has to be part of the
  // line or Super 8 and 16mm of one stock fold into one page.
  const gauge = format === 'movie'
    ? (/\bdouble\s*super\s*8\b|\bds\s?8\b/.test(text) ? 'gds8'
      : /\bsuper\s*8\b|\bsuper8\b/.test(text) ? 'gs8'
      : /\bdouble\s*8\b|\b2\s*x\s*8\s*mm\b|\bstd\s?8\b/.test(text) ? 'gd8'
      : /\b16\s?mm\b/.test(text) ? 'g16'
      : /\b35\s?mm\b/.test(text) ? 'g35'
      : /\b8\s?mm\b/.test(text) ? 'gd8' : null)
    : null;

  // Sheet sizes share the 'sheet' format, so the size is part of the line, or
  // 4x5 and 8x10 boxes of one film fold into one page and compare as one.
  // Read from the raw title, before the dot in "2.25x3.25" is stripped.
  const size = format === 'sheet' ? sheetSize(raw) : null;
  // How many sheets the box holds. Data, not identity: a 10-sheet and a
  // 50-sheet box of one film share a page and compare per sheet.
  const sheets = format === 'sheet'
    ? (Number((String(raw).match(/\b(\d{1,3})\s*sheets?\b/i) || [])[1]) || null)
    : null;

  const tokens = lineText.split(' ').filter(Boolean).filter((t) => {
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
    // A cine roll's length is left out by as many shops as give it, so for
    // cine it is not identity, the same as feet already are.
    if (format === 'movie' && /^\d{1,3}m$/.test(t)) return false;
    if (/^(8|16)$/.test(t)) return false;
    if (size && /^\d{1,2}x\d{1,2}$/.test(t)) return false;
    // Every Kodak cine colour negative on sale is Vision3, and shops list it
    // with or without the name ("Kodak 500T, 16mm" is Vision3 500T 7219).
    if (format === 'movie' && brand === 'kodak' && t === 'vision3') return false;
    return true;
  // Sorted, not source order: shops write the same film's modifiers in whatever
  // order reads best ("Limited Edition Ilford HP5 Plus Football" vs "Ilford HP5
  // PLUS ... FOOTBALL Limited Edition"). The tokens are identical, so sorting
  // makes those one film instead of two. `line` is an identity key, never shown.
  });
  if (gauge) tokens.push(gauge);
  if (size) tokens.push(`s${size}`);
  const line = tokens.sort().join('');

  if (titleIso == null) iso = isoFor(FIXED_ISO, brand, line) ?? iso ?? isoFor(DEFAULT_ISO, brand, line);

  const identified = Boolean(brand && format && (line || iso));
  const baseKey = identified ? [brand, line, format, iso].filter(Boolean).join('-') : null;
  const key = baseKey && expired ? `${baseKey}-expired` : baseKey;

  return { brand, line, format, iso, exp, packSize, sheets, expired, key, identified, complete: identified, cleaned: text };
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
