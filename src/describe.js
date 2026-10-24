// describe.js
// Turn the structured specs we already have into presentable labels and an
// ORIGINAL short description (written from the data, never copied from a shop).

export function formatLabel(format) {
  return {
    '135': '35mm',
    '120': '120 (medium format)',
    '110': '110',
    '127': '127',
    '220': '220',
    '620': '620',
    instant: 'Instant',
    sheet: 'Sheet / large format',
    movie: 'Cine',
    micro: 'Microfilm',
    bulk: 'Bulk (by the metre)',
  }[format] || format;
}

// Known stock names. B&W is checked before colour, so a C-41 black & white
// film like XP2 still reads as black & white.
const BW_STOCKS = /black|b&w|ektapan|\bmono\b|monochrome|\bhp\s?5\b|\bfp\s?4\b|delta|tri-?x|t-?max|\btmax\b|fomapan|\bpan\s?f\b|kentmere|\bpan\b|\bapx\b|earl grey|lady grey|scala|\bhr-?50\b|\bxp\s?2\b|ortho|silvermax|\bufx\b|retropan|\bdouble ?x\b|\bbwxx\b|\bwashi\s?[fsxv]\b|\bplus[\s-]?x\b|acros|neopan|\bspur\b|adox chs|orwo|superpan|\bp30\b|streetpan|\bretro\s?\d|\brpx\b|infrared|\bsfx\b|aviphot|chs\s?100/;
const COLOUR_STOCKS = /gold|ektacolou?r|red\s?scale|colou?r\s?plus|ultramax|portra|ektar|proimage|superia|fujicolor|natura|\bc200\b|colou?r ?200|colou?r ?400|vista|cinestill|aerocolor|phoenix|harman red|candido|santacolor|metropolis|\bpro ?400h?\b|\bxtra\b|nc[24]00|fujifilm ?[24]00|fuji ?[24]00|lomochrome|\bcolor\b|\bcolour\b/;

// Work out the process. Trust the shop's own category first (most reliable),
// then well-known stock names. Returns null when genuinely unsure — better to
// leave a film unclassified than to misfile it on the colour or B&W page.
export function deriveProcess(type = '', title = '', tags = '', body = '') {
  const t = (type || '').toLowerCase();
  const s = (type + ' ' + title).toLowerCase();
  const bwSignal = /black|b&w|\bb\s*w\b|\bmono\b|monochrome/;

  // 1. Instant (Instax / Polaroid) — split into colour vs black & white.
  if (/instant|instax|polaroid|i-?type|sx-?70|onestep|\bgo film\b/.test(s) || /instant/.test(t)) {
    return bwSignal.test(s) ? 'Black & white instant' : 'Colour instant';
  }

  // 2. C-41 black & white exceptions, before any colour rule can grab them.
  if (/\bxp\s?2\b|bw400cn|\bg400\b/.test(s)) return 'Black & white';

  // 3. Black and white reversal, before the cine rule below can call Tri-X
  // Reversal and Fomapan R ECN-2: they are cine stocks, but black and white
  // ones developed to a positive, not colour negative. Fomapan R often drops
  // the word "reversal", and FPP writes "BW40". Never a colour stock.
  if ((/reversal/.test(s) || /\bfomapan\s*r\b/.test(s))
      && (bwSignal.test(s) || /\bbw\s?\d/.test(s) || BW_STOCKS.test(s))
      && !/colou?r|chrome|\be-?6\b/.test(s)) return 'Black & white reversal';

  // 4. Slide / cine (category or name).
  if (/slide|reversal|\be-?6\b/.test(t) || /\bslide\b|provia|velvia|ektachrome|\be100\b|\bchrome\b/.test(s)) return 'Colour slide (E-6)';
  if (/movie|cine|super\s?8/.test(t) || /super\s?8|\bcine\b|vision3|\becn/.test(s)) return 'Cine (ECN-2)';

  // 5. The shop's own colour / B&W category.
  if (/black\s*&?\s*white|b&w|\bb\s*w\b|\bmono\b|monochrome/.test(t)) return 'Black & white';
  if (/colour|color/.test(t) && /film/.test(t)) return 'Colour negative (C-41)';

  // 6. Known stock names (B&W before colour).
  if (BW_STOCKS.test(s)) return 'Black & white';
  if (COLOUR_STOCKS.test(s)) return 'Colour negative (C-41)';

  // 7. What the shop says about the film, for the small makers' stocks whose
  // names carry no clue (Revolog Paper, Hanalogital Halo, Mr Negative 700S).
  // Still null when that is silent or contradicts itself.
  return fromEvidence(tags, body);
}

// The shop's tags first, since Analogue Wonderland's are structured
// ("type:Colour", "type:Negative", "B&W", "C-41", "ECN-2", "e6"), then plain
// statements in its description. ECN-2 outranks the rest, because a cine stock's
// description says it "CANNOT be processed in C-41". Two kinds of noise are
// left out: Parallax's developing-guide boilerplate names every process on
// every page, and Analogue Wonderland's "Colour Slide Film" tag sits on
// negative films (FPP Sun, which Classic Photo Supplies sells as C-41) beside
// a "type:Negative" that is right, so only "e6" or "type:Slide" counts.
function fromEvidence(tags, body) {
  const tagList = String(tags || '').toLowerCase().split(',').map((t) => t.trim());
  const tag = (re) => tagList.some((t) => re.test(t));
  const b = String(body || '').toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/how to develop [^.]{0,60}?film/g, ' ')
    .replace(/black (?:and|&) white film (?:developing times|reviews)/g, ' ');

  if (tag(/^ecn-?2$/) || /\becn-?2\b/.test(b)) return 'Cine (ECN-2)';

  const one = (bw, neg, slide) => {
    const n = [bw, neg, slide].filter(Boolean).length;
    if (n !== 1) return n > 1 ? false : null;
    return bw ? 'Black & white' : neg ? 'Colour negative (C-41)' : 'Colour slide (E-6)';
  };
  const fromTags = one(
    tag(/^(?:type:)?b&w$|^black (?:and|&) white(?: film)?$/),
    tag(/^c-?41$/) || (tag(/^type:colou?r$/) && tag(/^type:negative$/)),
    tag(/^e-?6$|^type:slide$/),
  );
  if (fromTags !== null) return fromTags || null;

  return one(
    /black[\s-]*(?:and|&)[\s-]*white(?:\s+\w+)?\s+(?:film|negative|stock|emulsion)\b|\b(?:pan|ortho)chromatic black/.test(b),
    /\bc-?41\b|colou?r negative/.test(b),
    /\be-?6\b|colou?r reversal|\bslide film/.test(b),
  ) || null;
}

// An original, spec-driven blurb — unique per film because the inputs differ.
export function describe({ display, brand, format, iso, process }) {
  const fmt = formatLabel(format);
  const brandName = pretty(brand);
  const proc = (process || 'film').toLowerCase();

  const speed =
    iso == null ? ''
    : iso <= 100 ? `Its low ISO ${iso} rating keeps grain fine and detail crisp, rewarding good light or a tripod.`
    : iso <= 400 ? `At ISO ${iso} it's a flexible all-rounder, comfortable everywhere from bright days to overcast streets.`
    : `Its fast ISO ${iso} speed suits low light, indoors and hand-held shooting after dark.`;

  const kind =
    proc.includes('slide') ? 'a colour reversal (slide) stock that projects and scans with punchy, saturated colour'
    : proc.includes('instant') ? 'an instant film that develops in your hand, no lab required'
    : proc.includes('cine') ? 'a motion-picture stock repurposed for stills, with a distinctive cinematic palette'
    : proc.includes('black') ? 'a black & white film with classic tonal character'
    : proc.includes('colour') ? 'a colour negative film with natural, print-ready colour'
    : null;

  const opener = kind
    ? `${display} is ${kind}, made by ${brandName} for ${fmt} cameras.`
    : `${display} is a ${fmt} film made by ${brandName}.`;

  return `${opener} ${speed}`.trim();
}

function pretty(brand) {
  const map = {
    fujifilm: 'Fujifilm', kodak: 'Kodak', ilford: 'Ilford', cinestill: 'CineStill',
    kentmere: 'Kentmere', kosmofoto: 'Kosmo Foto', agfa: 'AgfaPhoto', foma: 'Foma',
    lomography: 'Lomography', jch: 'Japan Camera Hunter', dubblefilm: 'dubblefilm',
    optikoldschool: 'Optik Oldschool', silbersalz: 'SilberSalz', filmneverdie: 'FilmNeverDie',
    mrnegative: 'Mr Negative', dragonfilm: 'DragonFilm', harman: 'Harman', rollei: 'Rollei',
    adox: 'Adox', bergger: 'Bergger', washi: 'Washi', polaroid: 'Polaroid',
    ferrania: 'Ferrania', orwo: 'ORWO', shanghai: 'Shanghai', revolog: 'Revolog',
    yodica: 'Yodica', candido: 'Candido', flic: 'Flic Film', catlabs: 'CatLABS',
    streetcandy: 'Street Candy', psychedelicblues: 'Psychedelic Blues',
  };
  return map[brand] || (brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : 'its maker');
}

// When the title lacks ISO/exposures, look in the shop's tags + description.
export function extractExp(tags = '', body = '') {
  const hay = (tags + ' ' + body).toLowerCase();
  const m = hay.match(/\b(\d{2})\s*(?:exposures?|exp)\b/) || hay.match(/exposures?\D{0,4}(\d{2})\b/);
  return m ? Number(m[1]) : null;
}

export function extractIso(tags = '', body = '') {
  const hay = (tags + ' ' + body).toLowerCase();
  const m = hay.match(/\b(?:iso|asa)\s*(\d{2,4})\b/) || hay.match(/\b(\d{2,4})\s*(?:iso|asa)\b/);
  return m ? Number(m[1]) : null;
}