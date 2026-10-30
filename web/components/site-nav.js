import { availableFormats, availableTypes, availableConditions, topBrandsByListings } from '../lib/facets';
import { liveOpportunities } from '../lib/opportunities';
import { NavBar } from './nav-bar';

// Server component: reads the facet data, then hands serialisable {slug,label}
// arrays to the client NavBar (which owns the mobile drawer toggle).
export function SiteNav() {
  const formats = availableFormats().map((f) => ({ slug: f.slug, label: f.label }));
  const types = availableTypes().map((t) => ({ slug: t.slug, label: t.label }));
  const conditions = availableConditions().map((c) => ({ slug: c.slug, label: c.label }));
  const brands = topBrandsByListings().map((b) => ({ slug: b.slug, label: b.label }));
  // Same rule as the footer: an empty board is noindex, so it isn't linked.
  const opportunities = liveOpportunities().length > 0;
  return <NavBar formats={formats} types={types} conditions={conditions} brands={brands} opportunities={opportunities} />;
}
