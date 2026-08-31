// posts.js — the editorial content layer.
//
// One silo today, sourced from markdown, flat and one level deep:
//
//   web/content/field-notes/<slug>.md -> /field-notes/<slug>/
//
// The directory IS the category — there are no /category/ routes, no dates in
// URLs and no /blog/ wrapper. The slug comes from the filename, so it is stable
// and hand-controlled: renaming a post's title never moves its URL.
//
// Another silo is an entry in SILOS below plus a matching pair of route files
// under web/app/<silo>/ — see web/app/field-notes/. Add one only alongside the
// posts that fill it: `output: 'export'` will not build a dynamic route that
// produces no paths, so an empty silo breaks the build.
//
// `film` and `brand` frontmatter values are not free-form tags: they are
// cross-links into the catalogue, resolved here against the same slugs the
// comparison side generates its pages from (lib/data + lib/facets, ultimately
// web/data/site.json). Anything that does not resolve fails the build with the
// file and value named — same reasoning as the empty-catalogue guard in
// build-site-data.js: a dead internal link that ships silently is worse than a
// build that stops.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { getFilm, getFilms, SITE_URL } from './data';
import { brandList } from './facets';

export const SILOS = [
  {
    slug: 'field-notes',
    label: 'Field notes',
    title: 'Field notes',
    description: 'Rolls shot, cameras carried and places photographed — notes from actually using the film rather than reading about it.',
  },
];

// Drafts are excluded everywhere by default — indexes, post routes and sitemap.
// Set INCLUDE_DRAFTS=1 for a local build that renders them so you can read a
// post in place before publishing it. Never set it for the deploy.
const INCLUDE_DRAFTS = process.env.INCLUDE_DRAFTS === '1';

const CONTENT_DIR = path.join(process.cwd(), 'content');

// The tag axes. `film` and `brand` are validated against the catalogue and
// rendered as links; the rest are free-form and unlinked for now.
export const TAG_FIELDS = ['location', 'camera', 'film', 'brand', 'format'];
const LINKED_FIELDS = ['film', 'brand'];

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const getSilo = (slug) => SILOS.find((s) => s.slug === slug) || null;

let cache = null;

// Every post in every silo, drafts included, newest first. Reads and validates
// once per process; the throw below therefore happens on the first page that
// touches the content layer, which during `next build` means the build stops.
function readAll() {
  if (cache) return cache;

  const posts = [];
  const errors = [];

  for (const silo of SILOS) {
    const dir = path.join(CONTENT_DIR, silo.slug);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
    for (const file of files) {
      const rel = `content/${silo.slug}/${file}`;
      const post = readPost(silo, dir, file, rel, errors);
      if (post) posts.push(post);
    }
  }

  if (errors.length) throw new Error(report(errors));

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
  cache = posts;
  return cache;
}

function readPost(silo, dir, file, rel, errors) {
  const fail = (msg, hint) => errors.push({ rel, msg, hint });

  const slug = file.replace(/\.md$/, '');
  if (!SLUG_RE.test(slug)) {
    fail(`filename "${file}" is not a usable slug — it becomes the URL, so it must be lowercase letters, digits and single hyphens.`);
    return null;
  }

  const { data, content } = matter(fs.readFileSync(path.join(dir, file), 'utf8'));

  const title = text(data.title);
  const description = text(data.description);
  if (!title) fail('frontmatter is missing `title`.');
  if (!description) fail('frontmatter is missing `description`.');

  const date = parseDate(data.date);
  if (!date) fail('frontmatter is missing a valid `date` (use YYYY-MM-DD, or YYYY-MM if only the month is known).');
  const updated = data.updated === undefined || data.updated === null ? null : parseDate(data.updated);
  if (data.updated !== undefined && data.updated !== null && !updated) {
    fail('`updated` is set but is not a valid date (use YYYY-MM-DD, or YYYY-MM).');
  }

  if (data.draft !== undefined && typeof data.draft !== 'boolean') {
    fail('`draft` must be true or false.');
  }

  const tags = {};
  for (const field of TAG_FIELDS) tags[field] = tagList(data[field]);

  // Cross-links. Resolved against the catalogue's own slugs, never a second
  // lookup table — if the catalogue drops a film, the link fails here.
  const links = {};
  for (const field of LINKED_FIELDS) {
    links[field] = tags[field].map((value) => {
      const resolved = field === 'film' ? resolveFilm(value) : resolveBrand(value);
      if (!resolved) {
        fail(
          `${field} "${value}" does not resolve to a catalogue ${field} page.`,
          suggest(field, value),
        );
        return { slug: value, label: value, href: null };
      }
      return resolved;
    });
  }

  return {
    silo: silo.slug,
    siloLabel: silo.label,
    slug,
    href: `/${silo.slug}/${slug}`,
    file: rel,
    title,
    description,
    date: date ? date.iso : null,
    datePrecision: date ? date.precision : null,
    updated: updated ? updated.iso : null,
    updatedPrecision: updated ? updated.precision : null,
    draft: data.draft === true,
    tags,
    links,
    blocks: renderBody(content.trim()),
    cover: coverFor(data.image, content),
  };
}

// A run of two or more image-only paragraphs becomes a carousel; a lone image
// stays a lone image. The convention lives in the markdown itself — put the
// frames one after another and they gallery up — so there is no shortcode to
// learn and the file still reads as a normal post in any editor.
// The thumbnail the silo index shows beside a post. An explicit `image:` in
// frontmatter wins; otherwise the first image in the body stands in, which is
// the lead frame in a post written the usual way. No new required field, and a
// post with no images simply has no thumbnail.
const FIRST_IMAGE = /!\[([^\]]*)\]\(([^)\s]+)\)/;

function coverFor(explicit, content) {
  if (typeof explicit === 'string' && explicit.trim()) {
    return { src: explicit.trim(), alt: '' };
  }
  const match = content.match(FIRST_IMAGE);
  // Alt is empty on purpose: the post title sits right next to the thumbnail in
  // the index, so repeating the frame's description is noise to a screen reader.
  return match ? { src: match[2], alt: '' } : null;
}

const IMAGE_ONLY = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

function renderBody(content) {
  const blocks = [];
  let markdown = [];
  let run = [];

  const pushMarkdown = () => {
    if (!markdown.length) return;
    blocks.push({ type: 'html', html: marked.parse(markdown.join('\n\n')) });
    markdown = [];
  };

  const closeRun = () => {
    if (run.length >= 2) {
      pushMarkdown();
      blocks.push({ type: 'carousel', images: run.map(({ alt, src }) => ({ alt, src })) });
    } else {
      // One image on its own is just an image — hand it back to the markdown.
      markdown.push(...run.map((img) => img.raw));
    }
    run = [];
  };

  for (const para of content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)) {
    const match = para.match(IMAGE_ONLY);
    if (match) {
      run.push({ alt: match[1], src: match[2], raw: para });
      continue;
    }
    closeRun();
    markdown.push(para);
  }
  closeRun();
  pushMarkdown();

  return blocks;
}

const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

// The date is when the roll was SHOT, not when the post went up, and a roll is
// often only remembered to the month. So `YYYY-MM` is as valid as `YYYY-MM-DD`
// and is not silently promoted to a day: the precision is carried through to
// what the page prints and to the <time> attribute, rather than inventing a 1st
// of the month and showing it as fact. The padded form is kept alongside it
// purely so posts still sort against each other.
//
// YAML turns an unquoted `2026-01-14` into a Date; `2026-01` is not a valid
// timestamp so it stays a string. Both are handled.
function parseDate(v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return { iso: v.toISOString().slice(0, 10), precision: 'day' };
  }
  if (typeof v === 'string') {
    const text = v.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
      const iso = text.slice(0, 10);
      if (!Number.isNaN(new Date(iso).getTime())) return { iso, precision: 'day' };
    }
    if (/^\d{4}-\d{2}$/.test(text)) {
      if (!Number.isNaN(new Date(`${text}-01`).getTime())) {
        return { iso: `${text}-01`, precision: 'month' };
      }
    }
  }
  return null;
}

// Tag values are lowercased and trimmed on the way in so they stay URL-safe:
// `Kodak` and `kodak` are the same tag, and the catalogue lookup only ever sees
// the canonical form. A bare string is accepted as a one-item list.
function tagList(v) {
  if (v === undefined || v === null) return [];
  const items = Array.isArray(v) ? v : [v];
  return items
    .map((x) => String(x).trim().toLowerCase())
    .filter(Boolean);
}

function resolveFilm(slug) {
  const film = getFilm(slug);
  if (!film) return null;
  return { slug, label: film.display, href: `/film/${slug}` };
}

// Brand pages exist for brands the catalogue actually has films for — the same
// list /brands is built from — so that is what a `brand` value has to hit.
function resolveBrand(slug) {
  const brand = brandList().find((b) => b.slug === slug);
  if (!brand) return null;
  return { slug, label: brand.label, href: `/brand/${slug}` };
}

// Brand slugs are not always the obvious guess (Japan Camera Hunter is `jch`),
// so a failure names the near misses rather than just saying no. Brands are
// also matched on their display name, which is what a slug is usually mistyped
// from — "japan-camera-hunter" points straight at `jch`.
function suggest(field, value) {
  const candidates = field === 'film'
    ? getFilms().map((f) => ({ slug: f.slug, keys: [f.slug] }))
    : brandList().map((b) => ({ slug: b.slug, keys: [b.slug, slugify(b.label)] }));

  const parts = value.split('-').filter((p) => p.length > 2);
  const scored = candidates
    .map((c) => ({
      slug: c.slug,
      score: Math.max(...c.keys.map((key) => (key === value ? 99 : parts.filter((p) => key.includes(p)).length))),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))
    .slice(0, 4);

  if (!scored.length) return null;
  return `closest slugs: ${scored.map((c) => c.slug).join(', ')}`;
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function report(errors) {
  const byFile = new Map();
  for (const e of errors) {
    if (!byFile.has(e.rel)) byFile.set(e.rel, []);
    byFile.get(e.rel).push(e);
  }
  const lines = [
    `Editorial content check failed — ${errors.length} problem${errors.length === 1 ? '' : 's'} in ${byFile.size} file${byFile.size === 1 ? '' : 's'}.`,
    '',
  ];
  for (const [rel, items] of byFile) {
    lines.push(`  ${rel}`);
    for (const it of items) lines.push(`    - ${it.msg}${it.hint ? ` (${it.hint})` : ''}`);
  }
  lines.push('', 'Fix the frontmatter, or the catalogue slug it points at. Refusing to build pages with dead internal links.');
  return lines.join('\n');
}

// Published posts across every silo, newest first.
export function getAllPosts() {
  return readAll().filter((p) => INCLUDE_DRAFTS || !p.draft);
}

// Published posts in one silo, newest first.
export function getPosts(siloSlug) {
  return getAllPosts().filter((p) => p.silo === siloSlug);
}

export function getPost(siloSlug, slug) {
  return getAllPosts().find((p) => p.silo === siloSlug && p.slug === slug) || null;
}

export const displayDate = (iso, precision = 'day') =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    ...(precision === 'day' ? { day: 'numeric' } : {}),
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });

// What goes in <time dateTime>. A month-precision date must not claim a day
// here either, or the markup asserts what the page deliberately does not.
export const dateAttr = (iso, precision = 'day') =>
  (precision === 'month' ? iso.slice(0, 7) : iso);

// --- Route helpers -------------------------------------------------------
// Titles here never carry " | Filmproof": app/layout.js appends it through the
// metadata title template, and baking it in duplicates the suffix.

export function siloMetadata(siloSlug) {
  const silo = getSilo(siloSlug);
  return {
    title: silo.title,
    description: silo.description,
    alternates: { canonical: `${SITE_URL}/${silo.slug}` },
  };
}

export function postMetadata(siloSlug, slug) {
  const post = getPost(siloSlug, slug);
  if (!post) return { title: 'Not found' };
  // The share card gets the same frame the index uses as a thumbnail. Paths are
  // resolved against metadataBase in layout.js, so a site-relative one is fine.
  // No publishedTime: `date` is when the roll was shot, not when this went up,
  // and the card should not assert otherwise.
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE_URL}${post.href}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `${SITE_URL}${post.href}`,
      ...(post.cover ? { images: [post.cover.src] } : {}),
    },
  };
}

export const postParams = (siloSlug) => getPosts(siloSlug).map((p) => ({ slug: p.slug }));
