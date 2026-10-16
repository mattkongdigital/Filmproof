// opportunities/lib.js
// The deterministic half of the opportunities pipeline: fetching politely,
// reading feeds, flattening pages to text, and the URL key every entry is
// deduped on. No dependencies — Node 20's fetch is enough, and feeds from
// WordPress and Squarespace are regular enough that a small parser copes.

import { USER_AGENT } from './sources.config.js';

// ---------------------------------------------------------------------------
// URL key

// Query parameters that only ever say where a click came from. Two sources
// linking the same call with different tracking must land on one entry.
const TRACKING = /^(utm_\w+|fbclid|gclid|mc_cid|mc_eid|ref|_ga|igshid)$/i;

// The dedupe key for an official URL: host without `www.`, path without a
// trailing slash or index page, tracking dropped, remaining params sorted.
// Scheme and fragment are ignored. Returns null for anything that is not an
// absolute http(s) URL.
export function normaliseUrl(raw) {
  let u;
  try { u = new URL(String(raw).trim()); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  let path = u.pathname.replace(/\/index\.(html?|php)$/i, '/').replace(/\/+$/, '');
  const params = [...u.searchParams.entries()]
    .filter(([k]) => !TRACKING.test(k))
    .sort(([a], [b]) => a.localeCompare(b));
  const query = params.length ? '?' + new URLSearchParams(params).toString() : '';
  return host + path + query;
}

// ---------------------------------------------------------------------------
// Text

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', pound: '£', euro: '€' };

export function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
}

const stripCdata = (s) => String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

// Readable text from HTML: scripts, styles and chrome dropped, block elements
// turned into line breaks, entities decoded, whitespace collapsed per line.
export function htmlToText(html) {
  return decodeEntities(String(html)
    .replace(/<(script|style|noscript|svg|nav|footer|header|form)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|blockquote|dd|dt)>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

// Every <a href> in a page, made absolute against `base`, with its link text.
// The official URL an extraction names must be one of these (or the page
// itself) — that is how the pipeline stops a URL being invented.
export function extractLinks(html, base) {
  const out = [];
  const seen = new Set();
  for (const m of String(html).matchAll(/<a\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)) {
    let href;
    try { href = new URL(decodeEntities(m[2]), base).toString(); } catch { continue; }
    if (!/^https?:/i.test(href) || seen.has(href)) continue;
    seen.add(href);
    out.push({ href, text: htmlToText(m[3]).replace(/\n/g, ' ').slice(0, 120) });
  }
  return out;
}

// For comparing a quote against a page: case, whitespace, curly quotes and
// dash variants all folded, so a faithful quote matches however it was typed.
export function foldText(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Feeds

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? stripCdata(m[1]).trim() : '';
};

// RSS 2.0 <item>s or Atom <entry>s, as { title, url, published, html }.
// `html` is the fullest body the feed carries (content:encoded over
// description), which for WordPress is usually the whole post.
export function parseFeed(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const body = m[1];
    items.push({
      title: decodeEntities(tag(body, 'title')),
      url: decodeEntities(tag(body, 'link')),
      published: tag(body, 'pubDate') || tag(body, 'dc:date'),
      html: tag(body, 'content:encoded') || tag(body, 'description'),
    });
  }
  if (items.length) return items;
  for (const m of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
    const body = m[1];
    const link = body.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
      || body.match(/<link\b[^>]*href=["']([^"']+)["']/i);
    items.push({
      title: decodeEntities(tag(body, 'title')),
      url: link ? decodeEntities(link[1]) : '',
      published: tag(body, 'published') || tag(body, 'updated'),
      html: tag(body, 'content') || tag(body, 'summary'),
    });
  }
  return items.filter((i) => i.url);
}

// ---------------------------------------------------------------------------
// Fetching

// robots.txt, read once per host per run. Only the `*` group and a group naming
// FilmproofBot apply; a named group replaces `*` entirely, as the spec says.
const robotsCache = new Map();

export function robotsAllows(robotsTxt, path, agent = 'filmproofbot') {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of String(robotsTxt).split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const [, key, value] = m;
    if (key.toLowerCase() === 'user-agent') {
      if (!lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (!current) continue;
      const k = key.toLowerCase();
      if (k === 'allow' || k === 'disallow') current.rules.push({ allow: k === 'allow', path: value });
    }
  }
  const named = groups.filter((g) => g.agents.some((a) => a !== '*' && agent.startsWith(a)));
  const applicable = named.length ? named : groups.filter((g) => g.agents.includes('*'));
  // Longest matching rule wins; Allow wins a tie. `*` and `$` as in the spec.
  let best = null;
  for (const rule of applicable.flatMap((g) => g.rules)) {
    if (!rule.path) continue;
    const anchored = rule.path.endsWith('$');
    const body = (anchored ? rule.path.slice(0, -1) : rule.path)
      .split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
    const re = new RegExp('^' + body + (anchored ? '$' : ''));
    if (re.test(path) && (!best || rule.path.length > best.path.length || (rule.path.length === best.path.length && rule.allow))) best = rule;
  }
  return best ? best.allow : true;
}

async function allowedByRobots(url) {
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    let txt = '';
    try {
      const res = await fetch(`${u.origin}/robots.txt`, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(15000) });
      // A missing robots.txt allows everything; a 401/403 on it is read as
      // "keep out", per the robots spec's handling of unreachable files.
      if (res.status === 401 || res.status === 403) txt = 'User-agent: *\nDisallow: /';
      else if (res.ok) txt = await res.text();
    } catch { /* unreachable robots.txt: the page fetch will fail on its own */ }
    robotsCache.set(u.origin, txt);
  }
  return robotsAllows(robotsCache.get(u.origin), u.pathname + u.search);
}

const lastHit = new Map();
const PAUSE_MS = 1500;

// GET with our User-Agent, robots.txt honoured, and at most one request per
// host every PAUSE_MS. Throws on a robots refusal or a non-2xx.
export async function politeFetch(url) {
  if (!(await allowedByRobots(url))) throw new Error(`robots.txt disallows ${url}`);
  const host = new URL(url).host;
  const wait = (lastHit.get(host) || 0) + PAUSE_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastHit.set(host, Date.now());
  const res = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.8' },
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return { url: res.url, body: await res.text() };
}
