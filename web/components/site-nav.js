import { availableFormats, availableTypes } from '../lib/facets';
import { NavBar } from './nav-bar';

// Server component: reads the facet data, then hands serialisable {slug,label}
// arrays to the client NavBar (which owns the mobile drawer toggle).
export function SiteNav() {
  const formats = availableFormats().map((f) => ({ slug: f.slug, label: f.label }));
  const types = availableTypes().map((t) => ({ slug: t.slug, label: t.label }));
  return <NavBar formats={formats} types={types} />;
}
