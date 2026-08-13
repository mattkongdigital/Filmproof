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
const BW_STOCKS = /black|b&w|\bmono\b|monochrome|\bhp\s?5\b|\bfp\s?4\b|delta|tri-?x|t-?max|\btmax\b|fomapan|\bpan\s?f\b|kentmere|\bpan\b|\bapx\b|earl grey|lady grey|scala|\bhr-?50\b|\bxp\s?2\b|ortho|silvermax|\bufx\b|retropan|\bdouble ?x\b|\bwashi\s?[fsxv]\b|\bplus[\s-]?x\b|acros|neopan|\bspur\b|adox chs|orwo|superpan|\bp30\b|streetpan|\bretro\s?\d|\brpx\b|infrared|\bsfx\b|aviphot|chs\s?100/;
const COLOUR_STOCKS = /gold|colou?r\s?plus|ultramax|portra|ektar|proimage|superia|fujicolor|natura|\bc200\b|colou?r ?200|colou?r ?400|vista|cinestill|aerocolor|phoenix|harman red|candido|santacolor|metropolis|\bpro ?400h?\b|\bxtra\b|nc[24]00|fujifilm ?[24]00|fuji ?[24]00|lomochrome|\bcolor\b|\bcolour\b/;

// Work out the process. Trust the shop's own category first (most reliable),
// then well-known stock names. Returns null when genuinely unsure — better to
// leave a film unclassified than to misfile it on the colour or B&W page.
export function deriveProcess(type = '', title = '') {
  const t = (type || '').toLowerCase();
  const s = (type + ' ' + title).toLowerCase();
  const bwSignal = /black|b&w|\bb\s*w\b|\bmono\b|monochrome/;

  // 1. Instant (Instax / Polaroid) — split into colour vs black & white.
  if (/instant|instax|polaroid|i-?type|sx-?70|onestep|\bgo film\b/.test(s) || /instant/.test(t)) {
    return bwSignal.test(s) ? 'Black & white instant' : 'Colour instant';
  }

  // 2. C-41 black & white exceptions, before any colour rule can grab them.
  if (/\bxp\s?2\b|bw400cn|\bg400\b/.test(s)) return 'Black & white';

  // 3. Slide / cine (category or name).
  if (/slide|reversal|\be-?6\b/.test(t) || /\bslide\b|provia|velvia|ektachrome|\be100\b|\bchrome\b/.test(s)) return 'Colour slide (E-6)';
  if (/movie|cine|super\s?8/.test(t) || /super\s?8|\bcine\b|vision3|\becn/.test(s)) return 'Cine (ECN-2)';

  // 4. The shop's own colour / B&W category.
  if (/black\s*&?\s*white|b&w|\bb\s*w\b|\bmono\b|monochrome/.test(t)) return 'Black & white';
  if (/colour|color/.test(t) && /film/.test(t)) return 'Colour negative (C-41)';

  // 5. Known stock names (B&W before colour).
  if (BW_STOCKS.test(s)) return 'Black & white';
  if (COLOUR_STOCKS.test(s)) return 'Colour negative (C-41)';

  // 6. Genuinely unsure — leave unclassified so it isn't misfiled.
  return null;
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