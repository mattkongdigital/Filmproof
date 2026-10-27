import Link from 'next/link';

// Turns a brand page's copy into text with its ranges linked: the first
// mention of each range on the page links to its range page, and later ones
// stay plain, so a paragraph naming Portra three times reads as prose rather
// than a row of links. `linked` is shared across every call for one page and
// records which ranges have had their link, so call this in reading order.
// Only ranges with a built page are passed in, so nothing links to a 404.
export function linkRanges(text, ranges, linked) {
  const parts = [];
  let rest = text;
  for (;;) {
    let next = null;
    for (const r of ranges) {
      if (linked.has(r.slug)) continue;
      const m = r.mention.exec(rest);
      if (m && (!next || m.index < next.m.index)) next = { r, m };
    }
    if (!next) break;
    const { r, m } = next;
    if (m.index > 0) parts.push(rest.slice(0, m.index));
    parts.push(<Link key={r.slug} href={r.href}>{m[0]}</Link>);
    linked.add(r.slug);
    rest = rest.slice(m.index + m[0].length);
  }
  if (rest) parts.push(rest);
  return parts;
}
