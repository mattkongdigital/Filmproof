// adapters/niktrick.js
// A second retailer with a completely different feed shape: CSV, different
// column names, Y/N stock flags, and multipacks. The adapter's whole job is to
// flatten that into the same normalised offer shape every retailer produces.
// (For production use a real CSV parser such as csv-parse.)

import { readFileSync } from 'node:fs';

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const split = (line) => {
    const out = [];
    let cur = '';
    let q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === ',' && !q) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const header = split(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = split(line);
    return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  });
}

export function loadNikTrick(path) {
  return parseCsv(readFileSync(path, 'utf8')).map((r) => ({
    retailer: 'Nik & Trick',
    retailerSku: r.product_code,
    title: r.name,
    price: parseFloat(r.gross_price),
    inStock: r.availability === 'Y',
    url: r.url,
  }));
}
