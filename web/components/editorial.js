import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from './breadcrumbs';
import { Carousel } from './carousel';
import { getSilo, getPosts, getPost, displayDate } from '../lib/posts';

// The rows of the "filed under" block, in the order they read. `film` and
// `brand` are links into the catalogue; the rest are plain text until there are
// enough posts to know which clusters deserve real hub pages.
const META_ROWS = [
  { field: 'location', label: 'Location' },
  { field: 'camera', label: 'Camera' },
  { field: 'film', label: 'Film', linked: true },
  { field: 'brand', label: 'Brand', linked: true },
  { field: 'format', label: 'Format' },
];

export function SiloIndex({ silo: siloSlug }) {
  const silo = getSilo(siloSlug);
  const posts = getPosts(siloSlug);

  return (
    <div className="wrap">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: silo.label }]} />
      <header className="cat-head">
        <div className="eyebrow">Writing</div>
        <h1>{silo.label}</h1>
        <p className="lede">{silo.description}</p>
      </header>

      {posts.length === 0 ? (
        <p className="empty">Nothing here yet.</p>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.slug} className="post-item">
              {post.cover && (
                // A second link to the same place, so it is hidden from the
                // accessibility tree and skipped by tab — the title link below
                // is the one that carries the name.
                <Link href={post.href} className="post-thumb" aria-hidden="true" tabIndex={-1}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.cover.src} alt={post.cover.alt} loading="lazy" decoding="async" />
                </Link>
              )}
              <div className="post-item-text">
                <time className="post-date" dateTime={post.date}>{displayDate(post.date)}</time>
                <h2 className="post-item-title">
                  <Link href={post.href}>{post.title}</Link>
                </h2>
                <p className="post-item-desc">{post.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PostArticle({ silo: siloSlug, slug }) {
  const silo = getSilo(siloSlug);
  const post = getPost(siloSlug, slug);
  if (!post) notFound();

  const rows = META_ROWS
    .map((row) => ({ ...row, values: row.linked ? post.links[row.field] : post.tags[row.field] }))
    .filter((row) => row.values.length > 0);

  return (
    <div className="wrap doc">
      <Breadcrumbs items={[
        { name: 'Home', href: '/' },
        { name: silo.label, href: `/${silo.slug}` },
        { name: post.title },
      ]} />

      <h1>{post.title}</h1>
      <div className="updated">
        <time dateTime={post.date}>{displayDate(post.date)}</time>
        {post.updated && <> · updated <time dateTime={post.updated}>{displayDate(post.updated)}</time></>}
        {post.draft && <> · draft</>}
      </div>

      <p className="lead">{post.description}</p>

      <div className="post-body">
        {post.blocks.map((block, i) => (
          block.type === 'carousel'
            ? <Carousel key={i} images={block.images} />
            : <div key={i} dangerouslySetInnerHTML={{ __html: block.html }} />
        ))}
      </div>

      {rows.length > 0 && (
        <dl className="post-meta">
          {rows.map((row) => (
            <div key={row.field} className="post-meta-row">
              <dt>{row.label}</dt>
              <dd>
                {row.values.map((v, i) => (
                  <span key={row.linked ? v.slug : v}>
                    {i > 0 && ', '}
                    {row.linked ? <Link href={v.href}>{v.label}</Link> : v}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
