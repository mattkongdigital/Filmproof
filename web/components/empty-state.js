import Link from 'next/link';

const DEFAULT_LINKS = [
  { href: '/35mm-film', label: '35mm' },
  { href: '/120-film', label: '120' },
  { href: '/colour-film', label: 'Colour' },
  { href: '/black-and-white-film', label: 'Black & white' },
  { href: '/brands', label: 'All brands' },
  { href: '/stores', label: 'All stores' },
];

export function EmptyState({ title, message, action = null, links = DEFAULT_LINKS }) {
  return (
    <div className="empty-state">
      <div className="empty-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="8" y="12" width="32" height="24" rx="3" />
          <path d="M8 20h32M8 28h32M16 12v24M32 12v24" opacity=".45" />
        </svg>
      </div>
      {title && <div className="empty-title">{title}</div>}
      <p className="empty-msg">{message}</p>
      {action}
      <div className="empty-links">
        <span className="empty-links-head">Try instead</span>
        <div className="chips">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="chip">{l.label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
