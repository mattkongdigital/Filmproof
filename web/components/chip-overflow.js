import Link from 'next/link';

// A chip row's links, capped. The first `limit` render as normal chips; the rest
// sit behind a "+N more" chip that opens in place. It is a <details>, so it works
// without JS and every link is still in the HTML for crawlers.
export function ChipOverflow({ links, limit = 10, noun = 'more' }) {
  const shown = links.slice(0, limit);
  const rest = links.slice(limit);
  return (
    <>
      {shown.map((l) => <ChipLink key={l.href} {...l} />)}
      {rest.length > 0 && (
        <details className="chip-more">
          <summary className="chip">
            <span className="chip-more-open">+{rest.length} {noun}</span>
            <span className="chip-more-close">Fewer</span>
          </summary>
          <div className="chip-more-list">
            {rest.map((l) => <ChipLink key={l.href} {...l} />)}
          </div>
        </details>
      )}
    </>
  );
}

function ChipLink({ href, label, count }) {
  return (
    <Link href={href} className="chip">
      {label} <span className="chip-count">{count}</span>
    </Link>
  );
}
