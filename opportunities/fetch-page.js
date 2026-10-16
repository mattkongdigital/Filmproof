// opportunities/fetch-page.js
// Fetch one more page during extraction — normally the organiser's official
// page for a call a source only summarised — and save it beside the candidate
// pages, so merge.js can check quotes against exactly what was read.
//
//   node opportunities/fetch-page.js <url>
//
// Prints the page id to pass as `official_page` in extractions.json. Honours
// robots.txt like every other fetch; a refusal is an answer, not something to
// route around.

import { mkdirSync } from 'node:fs';
import { htmlToText, extractLinks, politeFetch } from './lib.js';
import { WORK, savePage, pageId } from './paths.js';

const url = process.argv[2];
if (!url) {
  console.error('usage: node opportunities/fetch-page.js <url>');
  process.exit(2);
}

mkdirSync(`${WORK}/pages`, { recursive: true });
try {
  const { url: finalUrl, body } = await politeFetch(url);
  const id = pageId(url);
  savePage(id, {
    url: finalUrl,
    requested: url,
    fetched: new Date().toISOString().slice(0, 10),
    text: htmlToText(body),
    links: extractLinks(body, finalUrl),
  });
  console.log(id);
} catch (e) {
  console.error(`could not fetch ${url}: ${e.message}`);
  process.exit(1);
}
