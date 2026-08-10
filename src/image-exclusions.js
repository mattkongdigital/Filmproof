// Specific product image URLs to never use, because they carry a shop's own
// promotional graphic (a "2 for £X", "was £Y" or similar banner baked
// directly into the photo) that reads as misleading — or just out of place —
// on a page comparing many shops at once.
//
// The automatic filter in build-catalogue.js catches images a shop has
// labelled clearly in the filename or alt text. Some banners have no such
// label and slip through — if you spot one on the site, paste its image URL
// below (right-click the image → "Copy image address") and it'll be skipped
// on the next rebuild, falling back to the site's plain "no image" frame.
export const EXCLUDED_IMAGE_URLS = new Set([
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/KodakUltraMax3Pack__30was_38_f2f78e9e-50db-435c-9d72-01e6d4545800.png?v=1782291009',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/products/kodak-ultramax-400-35mm-film-36-exp-411738.jpg?v=1776243827',
]);
