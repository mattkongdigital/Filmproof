import Link from 'next/link';
import { SITE_URL } from '../lib/data';

// items: [{ name, href? }] — the last item is the current page and needs no href.
export function Breadcrumbs({ items }) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(it.href ? { item: `${SITE_URL}${it.href}` } : {}),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav className="crumbs" aria-label="Breadcrumb">
        {items.map((it, i) => (
          <span className="crumb-item" key={i}>
            {it.href ? <Link href={it.href}>{it.name}</Link> : <span aria-current="page">{it.name}</span>}
            {i < items.length - 1 && <span className="crumb-sep">/</span>}
          </span>
        ))}
      </nav>
    </>
  );
}
