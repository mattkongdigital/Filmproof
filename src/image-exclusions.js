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
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/KodakGold363Pack_Buy2For_55_1.png?v=1785922958',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/IlfordDelta10035mmMix_Match5ForPriceOf4_495d4721-0fc1-41f2-adee-a2010910ce42.png?v=1785324828',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/IlfordDelta40035mmMix_Match5ForPriceOf4_4cc9c9c7-4d0b-4a99-9a8c-3082d6142e31.png?v=1785324844',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/HarmanRed12535mmMix_Match5ForPriceOf4_c3eb5392-c4ab-4a36-a77b-01937b6fb929.png?v=1785323681',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/IlfordPANFPlus35mmMix_Match5ForPriceOf4_6ee04ede-443e-4ece-98ee-5c75b61a536c.png?v=1785325079',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/IlfordHP5Plus35mmFilmFootballMix_Match5ForPriceOf4_efe7c89c-dd8f-4551-a800-c9abc6eb74dc.png?v=1785323846',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/KodakProImage1005Pack_Buy2For_115_80a841e6-c660-4217-bb9b-e8864e64a8d8.png?v=1776857451',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/IlfordXP235mmFilmFootballMix_Match5ForPriceOf4_8c343454-40b5-4326-a8f6-d3302b3bf1ed.png?v=1785323827',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/IlfordOrthoPlus35mmMix_Match5ForPriceOf4_f2e00120-8534-4802-b61e-94a3e52b13cf.png?v=1785325351',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/IlfordDelta320035mmMix_Match5ForPriceOf4_30d21dfe-b359-44a6-bb2e-a385c9243603.png?v=1785324868',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/products/kodak-gold-200-35mm-colour-film-36exp-384896.jpg?v=1776243825',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/products/ilford-delta-100-35mm-film-803860.jpg?v=1646653959',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/products/ilford-delta-400-35mm-film-551877.jpg?v=1675777834',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/HarmanRed-35mmFilm-AmyFarrerSampleImage3.jpg?v=1739530161',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/products/ilford-pan-f-plus-35mm-film-150710.jpg?v=1646653713',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/products/ilford-hp5-plus-35mm-film-36-exposures-622223.jpg?v=1739360565',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/products/kodak-pro-image-100-35mm-colour-film-561965.jpg?v=1774872009',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/products/ilford-xp2-35mm-film-837795.jpg?v=1675761324',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/products/ilford-delta-3200-35mm-film-949646.jpg?v=1675761468',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/products/ilford-ortho-plus-80-35mm-film-761698.jpg?v=1647253112',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/IlfordSFX20035mmMix_Match5ForPriceOf4_2f629075-8fe5-4507-9caa-cb4541833d32.png?v=1785325305',
  'https://cdn.shopify.com/s/files/1/0005/1435/9356/files/KodakPortra1605Pack__70was_85_2.png?v=1786031428',
]);
