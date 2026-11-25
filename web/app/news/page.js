import Link from 'next/link';
import { SITE_URL } from '../../lib/data';
import { recentNews, newsWeeks } from '../../lib/news';
import { NEWS_WINDOW_DAYS, displayWeek } from '../../lib/news-format.mjs';
import { Breadcrumbs } from '../../components/breadcrumbs';
import { NewsFeed } from '../../components/news-feed';

const DESCRIPTION = 'What changed at UK film shops this month: newly listed films, stock back on the shelf and lower prices, checked every day.';

export function generateMetadata() {
  return {
    title: 'Film news',
    description: DESCRIPTION,
    alternates: { canonical: `${SITE_URL}/news` },
    // An empty feed is a thin page. It still builds, so the URL never 404s,
    // but it stays out of search until something is on it.
    ...(recentNews().length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function NewsPage() {
  const items = recentNews();
  const weeks = newsWeeks();
  return (
    <div className="wrap">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'News' }]} />
      <header className="cat-head">
        <div className="eyebrow">News</div>
        <h1>What changed at the shops</h1>
        <p className="lede">
          Films newly listed, back in stock or lower in price at the shops we track, from each
          day&apos;s check of their catalogues. The last {NEWS_WINDOW_DAYS} days are here, and every
          week stays in the archive below.
        </p>
      </header>
      <NewsFeed items={items} empty="Nothing has changed at the shops in this window yet. The catalogue is checked every day." />
      {weeks.length > 0 && (
        <nav className="news-archive" aria-label="News archive">
          <h2 className="news-day-head">By week</h2>
          <ul>
            {weeks.map((w) => (
              <li key={w}><Link href={`/news/${w}/`}>{displayWeek(w)}</Link></li>
            ))}
          </ul>
        </nav>
      )}
      <p className="opp-note">
        Shop updates come from each shop&apos;s own product feed, so a listing can change between our
        check and your visit. Always confirm stock and price on the shop&apos;s page.{' '}
        <Link href="/how-it-works">How it works</Link>.
      </p>
    </div>
  );
}
