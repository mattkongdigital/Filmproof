import { SITE_URL } from '../../lib/data';
import { liveOpportunities } from '../../lib/opportunities';
import { Breadcrumbs } from '../../components/breadcrumbs';
import { OpportunityBoard } from '../../components/opportunity-board';

const DESCRIPTION = 'Competitions, open calls and commissions for film photographers, mostly UK, checked every week. Each links to the organiser’s own page for the full terms.';

export function generateMetadata() {
  const live = liveOpportunities();
  return {
    title: 'Opportunities for film photographers',
    description: DESCRIPTION,
    alternates: { canonical: `${SITE_URL}/opportunities` },
    // An empty board is a thin page. It still builds, so the URL never 404s
    // between calls, but it stays out of search until there is something on it.
    ...(live.length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function OpportunitiesPage() {
  const live = liveOpportunities();
  return (
    <div className="wrap">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Opportunities' }]} />
      <header className="cat-head">
        <div className="eyebrow">Opportunities</div>
        <h1>Competitions, open calls &amp; commissions</h1>
        <p className="lede">
          Places to enter, submit and show work made on film, gathered every week and closing soonest
          first. Summaries are ours; the organiser&apos;s page is the authority on deadlines, fees and
          rights, so read it before you enter.
        </p>
      </header>
      <OpportunityBoard items={live} />
      <p className="opp-note">
        Fees and rights terms are flagged where we found them, but not every call states them.
        A listing here is not an endorsement. Spotted a call we should list?{' '}
        <a href="/contact">Tell us</a>.
      </p>
    </div>
  );
}
