// opportunities/validate.js
// The rules that make "never guess" something the code checks, not something
// the extraction promises. An extraction is a claim; each field is kept only
// when the page that was actually fetched backs it up. A field that fails is
// emptied and the entry marked for review — it is never repaired or inferred.

import { normaliseUrl, foldText } from './lib.js';

export const TYPES = ['competition', 'open-call', 'commission'];
export const REGIONS = ['uk', 'worldwide', 'elsewhere'];
export const FILM = ['film-specific', 'film-friendly'];

// Rights terms beyond a limited licence to show the entries. Any of these on an
// entry holds it back from the board until a person has looked.
export const RIGHTS_FLAGS = [
  'perpetual',          // the licence never ends
  'exclusive',          // the photographer can't license the work elsewhere
  'commercial-unpaid',  // organiser or partners may use it commercially without paying
  'all-entrants',       // the licence covers every entry, not only winners
  'copyright-transfer', // copyright itself passes to the organiser
];

// A summary sharing a run this long with the source has been copied, not written.
const SHINGLE = 8;

const words = (s) => foldText(s).replace(/[^a-z0-9£€$' -]/g, ' ').split(/\s+/).filter(Boolean);

export function copiedRun(summary, sources) {
  const w = words(summary);
  if (w.length < SHINGLE) return null;
  const hay = ' ' + words(sources.join('\n')).join(' ') + ' ';
  for (let i = 0; i + SHINGLE <= w.length; i++) {
    const run = w.slice(i, i + SHINGLE).join(' ');
    if (hay.includes(' ' + run + ' ')) return run;
  }
  return null;
}

// True when `quote` appears in any of `texts`, after folding case, whitespace,
// quotes and dashes. An empty quote is never found.
export function quoted(quote, texts) {
  const q = foldText(quote);
  if (q.length < 4) return false;
  return texts.some((t) => foldText(t).includes(q));
}

const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
  && !isNaN(new Date(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().startsWith(s);

const cleanStr = (s, max) => (typeof s === 'string' && s.trim() ? s.trim().replace(/\s+/g, ' ').slice(0, max) : null);

// Validate one extracted entry.
//   raw       the `entry` object from extractions.json
//   pages     the fetched pages it was read from: [{ url, text, links }]
// Returns { entry, review, dropped }: `entry` is null when the extraction is
// unusable as a listing at all (no title, no type, no verifiable URL), with the
// reason in `dropped`. `review` lists what was emptied and why.
export function validateEntry(raw, pages) {
  const review = [];
  const texts = pages.map((p) => p.text || '');
  const e = raw || {};

  const title = cleanStr(e.title, 140);
  const organiser = cleanStr(e.organiser, 100);
  if (!title || !organiser) return { entry: null, review, dropped: 'missing title or organiser' };
  if (!TYPES.includes(e.type)) return { entry: null, review, dropped: `type "${e.type}" is not one of ${TYPES.join(', ')}` };

  // The official URL must be a page that was fetched or a link on one. A URL
  // that appears nowhere was made up, and an entry that can't link out to the
  // authority on its details is no use.
  const key = normaliseUrl(e.official_url);
  if (!key) return { entry: null, review, dropped: `official_url "${e.official_url}" is not an http(s) URL` };
  const known = new Set();
  for (const p of pages) {
    known.add(normaliseUrl(p.url));
    if (p.requested) known.add(normaliseUrl(p.requested));
    for (const l of p.links || []) known.add(normaliseUrl(l.href));
  }
  if (!known.has(key)) return { entry: null, review, dropped: `official_url ${e.official_url} is not a fetched page or a link on one` };

  const evidence = e.evidence || {};

  let deadline = null;
  if (e.deadline != null) {
    if (!isDay(e.deadline)) review.push(`deadline "${e.deadline}" is not a YYYY-MM-DD date`);
    else if (!quoted(evidence.deadline, texts)) review.push('deadline quote not found on the page');
    else deadline = e.deadline;
  }
  if (!deadline) review.push('deadline');

  const UNKNOWN_FEE = { free: null, amount: null, currency: null, note: null };
  let fee = UNKNOWN_FEE;
  const f = e.fee || {};
  if (f.free === true || f.free === false) {
    const amountOk = f.free === true
      ? true
      : (typeof f.amount === 'number' && f.amount > 0 && /^[A-Z]{3}$/.test(f.currency || '')) || !!cleanStr(f.note, 160);
    if (!amountOk) review.push('fee is not free but has no amount and currency or note');
    else if (!quoted(evidence.fee, texts)) review.push('fee quote not found on the page');
    else fee = {
      free: f.free,
      amount: f.free ? null : (typeof f.amount === 'number' ? f.amount : null),
      currency: f.free ? null : (f.currency || null),
      note: cleanStr(f.note, 160),
    };
  }
  if (fee.free === null) review.push('fee');

  // Rights flags only ever add caution, so a flag is kept even when its quote
  // can't be matched — but then a person needs to look at it.
  const r = e.rights || {};
  const flags = Array.isArray(r.flags) ? r.flags.filter((x) => RIGHTS_FLAGS.includes(x)) : [];
  const unknownFlags = Array.isArray(r.flags) ? r.flags.filter((x) => !RIGHTS_FLAGS.includes(x)) : [];
  if (unknownFlags.length) review.push(`unknown rights flag(s) ${unknownFlags.join(', ')} dropped`);
  let rightsSummary = cleanStr(r.summary, 300);
  if ((flags.length || rightsSummary) && !quoted(evidence.rights, texts)) {
    review.push('rights quote not found on the page');
    rightsSummary = null;
  }

  const region = REGIONS.includes(e.region) ? e.region : null;
  if (e.region != null && !region) review.push(`region "${e.region}" is not one of ${REGIONS.join(', ')}`);

  const film = FILM.includes(e.film) ? e.film : null;
  if (!film) review.push('film');

  let summary = cleanStr(e.summary, 400);
  if (!summary || summary.length < 20) { review.push('summary'); summary = null; }
  else {
    const run = copiedRun(summary, texts);
    if (run) review.push(`summary copies the source ("${run}")`);
  }

  return {
    entry: {
      key,
      official_url: e.official_url.trim(),
      title,
      organiser,
      type: e.type,
      deadline,
      fee,
      eligibility: cleanStr(e.eligibility, 200),
      region,
      film,
      rights: { summary: rightsSummary, flags },
      summary,
      evidence: {
        deadline: deadline ? cleanStr(evidence.deadline, 300) : null,
        fee: fee.free !== null ? cleanStr(evidence.fee, 300) : null,
        rights: rightsSummary || flags.length ? cleanStr(evidence.rights, 300) : null,
      },
    },
    review,
    dropped: null,
  };
}

// The flags an entry carries on the board's data file. Any flag holds the entry
// back (publish: false) until a person flips it.
export function entryFlags(entry, review) {
  const out = [];
  if (entry.fee.free === false) out.push('fee');
  for (const f of entry.rights.flags) out.push(`rights:${f}`);
  for (const r of review) {
    const field = r.split(/[ "]/)[0];
    const tag = ['deadline', 'fee', 'rights', 'film', 'summary', 'region', 'unknown'].includes(field) ? field : 'other';
    const flag = `needs-review:${tag === 'unknown' ? 'rights' : tag}`;
    if (!out.includes(flag)) out.push(flag);
  }
  return out;
}
