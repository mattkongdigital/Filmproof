// match.js
// Decide what a raw feed offer is. Two outcomes only:
//   - matched : parsed cleanly AND its key exists in the canonical catalogue
//   - review  : anything else (incomplete parse, or a film we don't yet stock)
//
// Nothing auto-links unless it's a confident, complete match. Silent
// mismatches are how comparison sites end up showing the wrong price against
// the wrong product — so uncertainty goes to a human, never to the live page.

import { parseFilmTitle } from './normalise.js';
import { extractExp, extractIso } from './describe.js';

export function matchOffer(rawOffer, filmByKey) {
  const tagStr = Array.isArray(rawOffer.tags) ? rawOffer.tags.join(', ') : (rawOffer.tags || '');
  const tagIso = extractIso(tagStr, '');
  const parsed = parseFilmTitle(rawOffer.title, rawOffer.productType, tagIso);
  const pack = parsed.packSize || 1;
  const pricePerRoll = +(rawOffer.price / pack).toFixed(2);
  const exp = (parsed.exp ? Number(parsed.exp) : null) ?? extractExp(tagStr, '');
  const offer = { ...rawOffer, packSize: pack, pricePerRoll, exp };

  if (!parsed.complete) {
    return { status: 'review', reason: 'incomplete_parse', parsed, offer };
  }

  const film = filmByKey.get(parsed.key);
  if (!film) {
    return { status: 'review', reason: 'no_canonical_match', parsed, offer };
  }

  return { status: 'matched', filmId: film.id, key: parsed.key, parsed, offer };
}
