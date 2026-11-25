// industry-news/paths.js
// Where each step of a run reads and writes, resolved from this file so the
// scripts run from anywhere. Page files share the opportunities pipeline's
// shape ({ url, fetched, text, links }) but live in their own work folder.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

export const WORK = join(HERE, 'work');
export const SEEN_PATH = join(HERE, 'seen.json');
export const CONTENT_PATH = join(HERE, '..', 'web', 'content', 'news', 'industry-news.json');

export const pageId = (url) => createHash('sha1').update(String(url)).digest('hex').slice(0, 12);

export function savePage(id, page) {
  writeFileSync(join(WORK, 'pages', `${id}.json`), JSON.stringify(page, null, 2) + '\n');
}

export function loadPage(id) {
  const p = join(WORK, 'pages', `${id}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}
