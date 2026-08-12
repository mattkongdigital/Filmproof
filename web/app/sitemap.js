import { SITE_URL } from '../lib/data';
import { getFilms } from '../lib/data';
import { categoryParams, comboParams, brandList, brandSubParams } from '../lib/facets';
import { STORES } from '../lib/stores';

export const dynamic = 'force-static';

export default function sitemap() {
  const now = new Date();
  const urls = ['', '/brands', '/stores', '/how-it-works', '/about', '/disclosure', '/contact', '/privacy', '/terms'];
  for (const p of categoryParams()) urls.push(`/${p.category}`);
  for (const p of comboParams()) urls.push(`/${p.category}/${p.sub}`);
  for (const b of brandList()) urls.push(`/brand/${b.slug}`);
  for (const p of brandSubParams()) urls.push(`/brand/${p.slug}/${p.sub}`);
  for (const s of STORES) urls.push(`/store/${s.slug}`);
  for (const f of getFilms()) urls.push(`/film/${f.slug}`);
  return urls.map((u) => ({ url: `${SITE_URL}${u}`, lastModified: now, changeFrequency: 'daily' }));
}
