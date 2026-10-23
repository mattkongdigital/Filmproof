// What a shop does besides sell film, in the order the badges and filters show.
// Kept apart from ./stores.js so the /stores/ filter (a client component) can
// import it without pulling the catalogue into the browser bundle.
export const STORE_SERVICES = [
  {
    key: 'lab',
    badge: 'Photo lab',
    filter: 'Also a photo lab',
    note: (name) => `${name} is also a photo lab, so you can send your film back to them for developing.`,
  },
  {
    key: 'repairs',
    badge: 'Camera repairs',
    filter: 'Repairs cameras',
    note: (name) => `${name} also repairs film cameras, so you can send yours to them when it needs fixing.`,
  },
];

export function storeServices(store) {
  return STORE_SERVICES.filter((s) => (store.services || []).includes(s.key));
}
