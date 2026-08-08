// adapters/wex.js
// One adapter per retailer, because no two feeds share a schema. This one
// reads a simple product XML feed. (For production use a real parser such as
// fast-xml-parser — the regex here is deliberately minimal for a zero-dep demo.)

import { readFileSync } from 'node:fs';

export function loadWex(path) {
  const xml = readFileSync(path, 'utf8');
  const blocks = [...xml.matchAll(/<product>([\s\S]*?)<\/product>/g)];
  const tag = (block, name) =>
    (block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`)) || [, ''])[1].trim();

  return blocks.map(([, block]) => ({
    retailer: 'Wex Photo Video',
    retailerSku: tag(block, 'sku'),
    title: tag(block, 'title'),
    price: parseFloat(tag(block, 'price')),
    inStock: tag(block, 'stock') === 'in_stock',
    url: tag(block, 'link'),
  }));
}
