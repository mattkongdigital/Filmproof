// A shop's logo, or its initials in a tinted tile when we have no logo on file.
const initials = (name) =>
  (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export function StoreLogo({ store, size = 'md' }) {
  if (store.logo) {
    return (
      <img
        className={`store-logo store-logo-${size}`}
        src={store.logo}
        alt={`${store.name} logo`}
        loading="lazy"
      />
    );
  }
  return (
    <div className={`store-logo store-logo-fallback store-logo-${size}`} aria-hidden="true">
      {initials(store.name)}
    </div>
  );
}
