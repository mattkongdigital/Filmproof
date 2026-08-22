// category-content.js — long-form copy for the format, type, condition and
// combo category pages (e.g. "35mm film", "Colour film", "Expired film",
// "Colour 35mm film", "Expired 35mm film").
// Mirrors the shape of brand-content.js: meta {title, description}, intro,
// and a list of {heading, paragraphs} sections. Combo pages only actually
// render once a format×type combo has >= MIN_COMBO_FILMS films in stock
// (see lib/facets.js), so some entries here (e.g. slide 110 film) exist for
// when stock allows, even if the page isn't always live.

export const FORMAT_CONTENT = {
  '35mm-film': {
    meta: { title: '35mm Film Prices UK | Compare & Buy | Filmproof', description: 'Compare 35mm film prices from UK retailers on Filmproof. Kodak, Fujifilm, Ilford and more, colour, black & white and slide, find the best deal on 35mm rolls.' },
    intro: "35mm film, also known as 135 format, is the most widely used camera film in the world, loaded in a light-tight cassette that drops straight into almost every film camera ever made, from pocket point-and-shoots to professional SLRs. It's the easiest format to find, the cheapest to develop, and the natural starting point for anyone getting into film photography. Compare 35mm film prices from UK retailers on Filmproof and find the best deal on your next roll.",
    sections: [
      { heading: "What is 35mm film?", paragraphs: [
        "35mm film takes its name from the width of the film strip, and produces a standard frame of 24x36mm, though half-frame cameras split each frame in two for double the shots per roll. The format was standardised in the 1930s, building on 35mm movie stock originally developed for cinema, and Kodak's launch of the Retina camera in 1934 helped establish it as the everyday choice for still photography.",
        "Today, 35mm remains the backbone of film photography. It's manufactured in far higher volumes than any other format, which keeps prices relatively low and choice extremely wide, everything from budget consumer colour film to specialist black and white, slide and cine-derived stocks is available in 35mm, usually in cassettes of 24 or 36 exposures.",
      ] },
      { heading: "Popular 35mm film stocks", paragraphs: [
        "35mm is where you'll find the broadest choice of film on the market. Colour negative options range from affordable everyday stocks like Kodak Gold 200 and Fujicolor C200 through to professional favourites such as Kodak Portra and Fujicolor Superia. Black and white shooters can choose from classics like Ilford HP5 Plus and Kodak Tri-X, while slide film fans have Fujifilm Provia, Velvia and Kodak Ektachrome to pick from.",
        "Because 35mm is the format nearly every manufacturer supports, it's also the best place to try something different, cine-derived stocks like CineStill 800T, experimental brands like Lomography and Revolog, and boutique respools from brands such as Flic Film and Washi are almost all built around the 35mm cassette.",
      ] },
      { heading: "Buying and shooting 35mm film", paragraphs: [
        "Because 35mm is produced at such scale, it's usually the cheapest format per roll and per exposure, and every high street and online photo lab in the UK processes it, so turnaround times and costs are lower than other formats too. It's a good idea to compare price per roll rather than sticker price alone, since 24 and 36 exposure rolls of the same film are priced differently.",
        "Filmproof tracks live 35mm film prices across UK retailers, so you can see what's actually in stock and compare the cost per roll before you buy, rather than discovering a stockist is sold out after you've ordered.",
      ] },
    ],
  },
  '120-film': {
    meta: { title: '120 Film Prices UK | Compare & Buy | Filmproof', description: 'Compare 120 medium format film prices from UK retailers on Filmproof. Kodak, Fujifilm, Ilford and more, find the best deal on your next roll.' },
    intro: "120 film is the classic medium format roll film used in cameras like the Hasselblad, Mamiya and Rolleiflex, prized for negatives many times larger than 35mm. That extra size means sharper detail, smoother tonal gradation and a shallower depth of field, at the cost of fewer shots per roll and a higher price. Compare 120 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "What is 120 film?", paragraphs: [
        "120 is roll film without a cassette, the film is wound onto a spool with a paper backing that protects it from light, so it can be loaded and unloaded in normal room light rather than needing full darkness. It was introduced by Kodak in 1901 for its Brownie No. 2 camera and has remained in continuous production ever since, making it one of the longest-lived film formats in history.",
        "Unlike 35mm, 120 doesn't have one fixed frame size, the same roll can produce different negative sizes depending on the camera, most commonly 6x4.5cm, 6x6cm (square format), 6x7cm or 6x9cm, giving anywhere from 8 to 16 exposures per roll. That flexibility is part of the format's appeal to medium format shooters.",
      ] },
      { heading: "Popular 120 film stocks", paragraphs: [
        "Most major manufacturers who produce 35mm also offer their core stocks in 120, including Kodak Portra, Ektar and Tri-X, Ilford HP5 Plus and Delta, and Fujifilm's colour and slide ranges, so switching to medium format doesn't mean giving up familiar film. Specialist and boutique brands including Foma, Rollei, Adox and Lomography also produce 120 stocks, often at a lower price than the professional ranges.",
        "Because 120 is shot less often than 35mm, per-roll prices tend to run higher, but the larger negative means each frame carries far more detail, something landscape, portrait and fine art photographers often consider worth the extra cost.",
      ] },
      { heading: "Buying and shooting 120 film", paragraphs: [
        "120 film is sold by roll rather than in bulk multipacks as often as 35mm, and stock levels can vary more between UK retailers, so it's worth comparing before you commit to a shoot. Not every UK lab processes 120 as standard, so it's worth checking your local lab handles medium format before buying in volume.",
        "Filmproof tracks live 120 film prices and stock across UK shops, making it easier to plan a medium format shoot without discovering your preferred stock is out of stock everywhere.",
      ] },
    ],
  },
  '110-film': {
    meta: { title: '110 Film Prices UK | Compare & Buy | Filmproof', description: 'Compare 110 film prices from UK retailers on Filmproof. Lomography and cartridge film for pocket cameras, find the best deal.' },
    intro: "110 film is a small, self-contained cartridge format originally designed for compact pocket cameras, producing a distinctly small, grainy negative with a nostalgic, lo-fi character. Once considered obsolete, it's been kept alive by a small circle of manufacturers and a growing following among Lomography and vintage camera fans. Compare 110 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "What is 110 film?", paragraphs: [
        "Kodak introduced 110 in 1972 as a simpler, smaller alternative to 126 cartridge film, aimed at compact, easy-to-load pocket cameras. The film cartridge drops straight into the camera with no threading required, and produces a small 13x17mm negative, roughly a quarter the area of a 35mm frame.",
        "110 fell out of production in the 2000s as compact cameras and then digital took over, but Lomography relaunched the format in 2012 with new film stock and cameras, and it now has a small but dedicated following among photographers drawn to its distinctive grain and portability.",
      ] },
      { heading: "Popular 110 film stocks", paragraphs: [
        "Lomography is the main active manufacturer of 110 film today, with a small range spanning Tiger and Lobster colour negative, Orca black and white, and the cross-processed Peacock slide film, alongside dedicated 110 cameras like the Lomomatic. Availability is far more limited than 35mm or 120, so stock can sell out or be seasonal.",
        "Because the format was dormant for so long, most 110 shooters are working with either recent Lomography stock or hunting down expired vintage cartridges, both of which behave quite differently, expired 110 film often shows heavier grain, colour shifts and light leaks.",
      ] },
      { heading: "Buying and shooting 110 film", paragraphs: [
        "110 is a niche, lower-volume format, so prices per roll tend to be higher than 35mm for a much smaller negative, and choice is limited to whatever a small number of manufacturers currently have in production. It's worth checking stock regularly, since 110 can go in and out of availability more than mainstream formats.",
        "Filmproof tracks 110 film stock and prices across UK retailers so you can catch it when it's available, rather than missing a limited run.",
      ] },
    ],
  },
  '127-film': {
    meta: { title: '127 Film Prices UK | Compare & Buy | Filmproof', description: "Compare 127 film prices from UK retailers on Filmproof. Specialist respooled black & white and colour film for vintage box cameras." },
    intro: "127 film is a vintage roll film format, roughly midway in size between 35mm and 120, once hugely popular in box cameras and later 1950s-60s models. Original manufacture ended decades ago, so today's 127 supply comes almost entirely from small specialist companies respooling and reperforating other film stock by hand. Compare 127 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "What is 127 film?", paragraphs: [
        "127 was introduced by Kodak in 1912 for its Vest Pocket Kodak camera and went on to be widely used in classic box cameras and later 1950s-60s cameras like the Baby Rolleiflex and Yashica 44, typically producing 4x4cm or 4x6.5cm negatives on a compact spool.",
        "Mainstream production of 127 wound down through the late twentieth century as 35mm and 126 cartridge film took over the consumer market, and the last major manufacturers stopped making it some years ago. It survives today because a handful of small companies still hand-cut and respool other formats down to 127 size.",
      ] },
      { heading: "Popular 127 film stocks", paragraphs: [
        "127 supply comes from specialist respoolers rather than major manufacturers, working with black and white and colour base stock sourced from established makers and cutting it down to fit 127 cameras and spools. Choice is limited to a small handful of products at any given time, and availability can vary.",
        "Because it's a genuinely small-scale, hand-produced supply chain, expect higher prices per roll than mainstream formats, and don't expect the same consistency as a factory-coated 35mm or 120 roll.",
      ] },
      { heading: "Buying and shooting 127 film", paragraphs: [
        "If you've inherited or picked up a vintage box camera or a Baby Rolleiflex, 127 is the only way to shoot it on genuine roll film, so it's worth checking stock before assuming the format is dead. Because production runs are small, roll counts and availability shift more often than mainstream formats.",
        "Filmproof tracks 127 film stock across UK retailers, helping you catch it when the small specialist suppliers who keep the format alive have rolls available.",
      ] },
    ],
  },
  'large-format-film': {
    meta: { title: 'Large Format Film Prices UK | Compare & Buy | Filmproof', description: 'Compare large format sheet film prices from UK retailers on Filmproof. 4x5, 5x4, 8x10 and more from Kodak, Ilford, Fomapan and Adox.' },
    intro: "Large format film is sold as individual sheets rather than rolls, most commonly in 4x5 and 8x10 inch sizes, for use in view and technical cameras. It delivers the largest negatives available to still photographers, prized by landscape, architectural and fine art shooters for extraordinary detail and full perspective control. Compare large format film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "What is large format film?", paragraphs: [
        "Unlike roll formats, large format (or sheet) film is loaded one sheet at a time into a film holder in complete darkness, then inserted into a view camera for each individual exposure. Common sizes include 4x5 and 5x4 inch, which are the same size described differently, along with larger formats such as 5x7, 8x10 and 10x8, and specialist ultra-large formats beyond that.",
        "The huge negative size, dozens of times the area of a 35mm frame, produces exceptional resolution and tonal range, and view cameras allow movements like tilt and shift that let photographers correct perspective or control depth of field in ways smaller formats simply can't match.",
      ] },
      { heading: "Popular large format film stocks", paragraphs: [
        "Large format film is available from most of the major manufacturers who still support the format, including Kodak (T-Max, Tri-X, Portra and Ektar in sheet form), Ilford (HP5 Plus, FP4 Plus, Delta), and specialist black and white makers such as Fomapan and Adox, which produce sheet film alongside their roll stocks. Colour sheet film is a smaller, more expensive part of the range than black and white.",
        "Because each sheet is exposed and processed individually, some photographers develop large format film by hand at home even if they don't process roll film themselves, giving precise control over each exposure's development.",
      ] },
      { heading: "Buying and shooting large format film", paragraphs: [
        "Large format film is sold by the sheet, usually in boxes of 10, 25 or 50, and prices per sheet are significantly higher than a 35mm or 120 exposure, reflecting both the size of the film and the smaller scale of production. Stock and available sizes can vary more between retailers than roll film.",
        "Filmproof tracks large format sheet film prices and stock across UK retailers, so you can compare cost per sheet across sizes and brands before committing to a box.",
      ] },
    ],
  },
  'instant-film': {
    meta: { title: 'Instant Film Prices UK | Compare & Buy | Filmproof', description: 'Compare instant film prices from UK retailers on Filmproof. Polaroid, Fujifilm Instax and Lomography, find the best deal on instant film.' },
    intro: "Instant film develops itself inside the camera, delivering a physical, ready-to-hold print within minutes of pressing the shutter, no lab, no scanning, no waiting. From classic Polaroid squares to pocket-sized Fujifilm Instax prints, instant film remains one of the most immediate and social ways to shoot on film. Compare instant film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "What is instant film?", paragraphs: [
        "Instant film packs contain both the light-sensitive negative and the chemistry needed to develop it, sealed together in individual pods. When a shot is taken, the camera spreads the developer chemistry evenly across the print as it's ejected, and the image appears gradually over the following minutes as it develops in daylight.",
        "Edwin Land and Polaroid invented the format in 1948, and it remained a category Polaroid effectively owned for decades. Today it spans several distinct film systems, Polaroid's i-Type, 600 and SX-70 formats, Fujifilm's Instax Mini, Square and Wide ranges, and Lomography's own instant film, each requiring a matching camera system.",
      ] },
      { heading: "Popular instant film stocks", paragraphs: [
        "Fujifilm Instax is currently the most widely used instant system, thanks to affordable, compact cameras and printers and a lower cost per shot than Polaroid, with Mini (credit-card sized), Square and Wide format prints available in colour and monochrome. Polaroid remains the choice for the classic large square print and for anyone shooting a vintage 600 or SX-70 camera, with i-Type film for its modern cameras.",
        "Lomography also produces its own instant film compatible with Instax and Polaroid-format cameras, often with creative colour effects and coloured edge finishes not available from the two bigger brands.",
      ] },
      { heading: "Buying and shooting instant film", paragraphs: [
        "Instant film is one of the more expensive ways to shoot film per exposure, since you're paying for the built-in chemistry as well as the film itself, but there's no processing cost or wait, the print is finished within minutes. It's worth checking which system your camera uses before buying, Instax, Polaroid and older peel-apart formats aren't interchangeable.",
        "Filmproof tracks instant film prices and stock across UK retailers, so you can compare cost per shot across Polaroid, Instax and Lomography before you buy a pack.",
      ] },
    ],
  },
  'cine-film': {
    meta: { title: 'Cine Film Prices UK | Compare & Buy | Filmproof', description: 'Compare Super 8, 16mm and other cine film prices from UK retailers on Filmproof. Motion picture film for home movie cameras.' },
    intro: "Cine film is motion picture stock made for genuine movie cameras, Super 8, Standard 8 and 16mm, rather than for still photography. Shooting cine film means capturing moving images the same way film-makers did for most of the twentieth century, on physical strips of film that run through a projector once developed. Compare cine film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "What is cine film?", paragraphs: [
        "Cine film comes in small cartridges or spools designed for movie cameras rather than the 35mm cassettes and 120 rolls used for stills. Super 8, introduced by Kodak in 1965, is the most widely used amateur format today, loaded in an easy-to-use cartridge, while 16mm and the older Standard 8 formats use open spools and are aimed at more experienced or professional users.",
        "Unlike still film, cine film is exposed as a continuous sequence of tiny frames, then developed and, in most cases, projected or digitised to view the finished footage rather than printed as individual photographs.",
      ] },
      { heading: "Popular cine film stocks", paragraphs: [
        "Kodak is the dominant manufacturer of genuine cine film, producing Super 8 and 16mm stock built on its professional Vision3 colour negative line, alongside black and white options such as Tri-X. These are the same underlying emulsions used in professional motion picture production, scaled down for amateur cameras.",
        "Because cine film is a specialist, lower-volume product, choice is narrower than still photography formats, and most of what's available comes from Kodak, distributed and cut to size by a small number of specialist film suppliers.",
      ] },
      { heading: "Buying and shooting cine film", paragraphs: [
        "Cine film is priced and sold differently to still photography film, cartridges are rated in feet of footage rather than exposure count, and processing needs a lab that specifically handles motion picture film, which is less widely available than standard photo processing. It's worth confirming a lab can handle Super 8 or 16mm before buying stock.",
        "Filmproof tracks cine film prices and stock across UK retailers, making it easier to find Super 8 and 16mm stock in one place rather than searching specialist suppliers individually.",
      ] },
    ],
  },
};

export const TYPE_CONTENT = {
  'colour-film': {
    meta: { title: 'Colour Film Prices UK | Compare & Buy | Filmproof', description: 'Compare colour film prices from UK retailers on Filmproof. Kodak, Fujifilm, Lomography and more, find the best deal on colour negative film.' },
    intro: "Colour film, more specifically colour negative film, is the most widely shot type of camera film, developed using the standard C-41 process available at almost every photo lab. From affordable everyday stocks to professional-grade portrait film, colour negative covers everything from holiday snapshots to wedding photography. Compare colour film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "What is colour film?", paragraphs: [
        "Colour negative film captures an image as an orange-tinted negative, where light and dark tones, and colours, are inverted from how they'll appear in the final print or scan. It's processed using the C-41 chemical process, standardised across the industry, which is why colour negative film can be developed quickly and cheaply at almost any lab, including many high street chemists and supermarkets.",
        "Colour negative film has a wide exposure latitude, meaning it forgives over and underexposure far more gracefully than slide film, which is one reason it's become the default choice for most film photographers, from complete beginners to working professionals.",
      ] },
      { heading: "Popular colour film stocks", paragraphs: [
        "Everyday colour stocks like Kodak Gold 200, Kodak UltraMax 400, Fujicolor C200 and AgfaPhoto Vista Plus are affordable, forgiving and widely available, ideal for general shooting. Professional ranges such as Kodak Portra and Fujicolor Superia offer finer grain and more accurate, flattering colour, favoured by portrait and wedding photographers.",
        "For a different look, cine-derived colour stocks like CineStill 800T bring a distinctive halation glow around light sources, while experimental brands including Lomography and Revolog offer colour-shifting and special-effect films for photographers chasing something more unusual.",
      ] },
      { heading: "Developing colour film", paragraphs: [
        "Because colour negative film uses the standardised C-41 process, it's the fastest and cheapest type of film to get developed, with many UK labs offering same-day or next-day turnaround, and it's also straightforward to process at home with a basic C-41 kit.",
        "Filmproof tracks live colour film prices and stock across UK retailers, so you can compare everyday and professional stocks side by side before you buy.",
      ] },
    ],
  },
  'black-and-white-film': {
    meta: { title: 'Black & White Film Prices UK | Compare & Buy | Filmproof', description: 'Compare black & white film prices from UK retailers on Filmproof. Ilford, Kodak, Fomapan and more, find the best deal on B&W film.' },
    intro: "Black and white film strips photography back to tone, contrast and grain, and remains a favourite for street, documentary and fine art photographers. It's also the easiest type of film to develop at home, needing nothing more than basic chemistry and a changing bag or darkroom. Compare black & white film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "What is black and white film?", paragraphs: [
        "Black and white, or monochrome, film records an image using only light and dark silver tones rather than colour, developed traditionally using black and white chemistry rather than colour C-41 chemistry. Some chromogenic black and white films, like Ilford XP2 Super, are the exception, formulated to be processed in standard colour C-41 chemistry for convenience.",
        "The format has never gone out of fashion, partly because monochrome tone, grain and contrast are often seen as more expressive and timeless than colour, and partly because it's genuinely simple and affordable to develop at home without a colour darkroom.",
      ] },
      { heading: "Popular black and white film stocks", paragraphs: [
        "Ilford is the UK's own black and white specialist, with HP5 Plus, FP4 Plus and the Delta range covering everything from classic grain to modern fine-grain technology. Kodak's Tri-X 400 and T-Max range remain industry standards, while budget-friendly options like Kentmere and Fomapan make black and white an affordable way to shoot more.",
        "Specialist black and white brands including Rollei, Adox and Lucky offer distinctive traditional emulsions, while chromogenic films like Ilford XP2 Super are processed in standard colour C-41 chemistry for anyone who wants black and white results without a dedicated darkroom process.",
      ] },
      { heading: "Developing black and white film", paragraphs: [
        "Standard black and white film needs its own chemistry, developer, stop bath and fixer, rather than colour C-41 processing, but it's genuinely simple to do at home with basic equipment, which is why many black and white shooters develop their own film even if they don't process colour.",
        "Filmproof tracks black and white film prices and stock across UK retailers, so you can compare classic and budget stocks before you buy.",
      ] },
    ],
  },
  'slide-film': {
    meta: { title: 'Slide Film Prices UK | Compare & Buy | Filmproof', description: 'Compare slide film prices from UK retailers on Filmproof. Fujifilm Provia, Velvia and Kodak Ektachrome, find the best deal on E-6 film.' },
    intro: "Slide film, also called reversal or transparency film, produces a positive image directly on the film itself rather than a negative, ready to project or hold up to the light. Known for punchy colour, fine grain and unforgiving exposure latitude, it's a smaller but devoted corner of film photography. Compare slide film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "What is slide film?", paragraphs: [
        "Unlike colour negative film, slide film develops directly into a positive image, the colours and tones you see on the processed film are the actual colours and tones of the scene, rather than inverted. It's processed using the E-6 process, a different and generally more expensive chemistry to the C-41 process used for colour negative film.",
        "Slide film has a much narrower exposure latitude than colour negative, meaning accurate metering matters far more, but in return it delivers exceptionally fine grain, high saturation and contrast that many photographers find impossible to replicate with negative film and a scanner.",
      ] },
      { heading: "Popular slide film stocks", paragraphs: [
        "Fujifilm dominates the modern slide film market, with Velvia 50 famous for intensely saturated, vivid colour favoured by landscape photographers, and Provia 100F offering a more neutral, balanced palette for general use. Kodak's Ektachrome E100 was relaunched in 2018 after a period of discontinuation and remains a popular alternative with slightly different colour rendering.",
        "Because slide film is a smaller, more specialist market, choice is narrower than colour negative or black and white, and prices per roll tend to run higher, reflecting both the more complex E-6 chemistry and lower production volumes.",
      ] },
      { heading: "Developing slide film", paragraphs: [
        "E-6 processing is less widely available on the high street than C-41, so it's worth checking a lab supports slide film before shooting a roll, though most dedicated photo labs and specialist mail-order services do. Once developed, slides can be scanned, projected, or mounted for viewing directly.",
        "Filmproof tracks slide film prices and stock across UK retailers, helping you find and compare Velvia, Provia and Ektachrome before you commit to a roll of E-6 film.",
      ] },
    ],
  },
};

export const CONDITION_CONTENT = {
  'expired-film': {
    meta: { title: 'Expired Film Prices UK | Compare & Buy | Filmproof', description: 'Compare expired film prices from UK retailers on Filmproof. Expired Kodak, Fujifilm and Ilford stock, tracked separately from fresh film, with live prices per roll.' },
    intro: "Expired film is stock sold past the date the manufacturer guaranteed it to, and it behaves differently from fresh film: slower, grainier, and often shifted in colour. For some photographers that unpredictability is the whole point, and for others it is simply a cheaper way to shoot. Filmproof tracks expired stock as its own listing rather than mixing it in with fresh, so a discounted expired roll never gets compared against a fresh one on price alone.",
    sections: [
      { heading: "What is expired film?", paragraphs: [
        "Every roll of film carries a process-before date, typically two to three years from manufacture, which is the point up to which the maker guarantees its rated speed and colour balance. Film does not stop working on that date, it simply stops being guaranteed. The emulsion degrades gradually from the moment it is made, and the date is the manufacturer drawing a line rather than the film going off in any sudden sense.",
        "What actually changes is the silver halide crystals in the emulsion, which slowly lose sensitivity while background radiation and heat build up a base fog across the film. In practice that means expired film tends to be effectively slower than its box speed, grainier, lower in contrast, and, in colour stocks, shifted towards whichever dye layer has held up best, often producing the green or magenta casts expired film is known for.",
      ] },
      { heading: "How well film keeps", paragraphs: [
        "Storage matters far more than the date on the box. Film kept frozen or refrigerated ages very slowly and can shoot close to fresh decades past its date, while the same stock left in a warm loft or a car can be visibly degraded within a few years of expiry. A roll expired in 2015 and kept frozen will usually outperform one expired in 2022 and kept warm, which is why the storage history is worth asking a seller about.",
        "Film speed and type matter too. Faster film is more sensitive to background radiation, so ISO 800 and 3200 stocks degrade noticeably quicker than ISO 100. Black and white film keeps best of all, often shooting near normally long past its date, colour negative shifts more visibly as its dye layers age at different rates, and slide film is the least forgiving, since its narrow exposure latitude leaves little room for the extra fog and speed loss to hide in.",
      ] },
      { heading: "Shooting and buying expired film", paragraphs: [
        "The usual working rule is to overexpose by roughly one stop for every decade past the expiry date, so a ten-year-expired ISO 400 film gets metered at around ISO 200, and a twenty-year-expired roll at ISO 100. That compensates for the lost sensitivity and lifts the image clear of the base fog. Film you know was cold-stored often needs less than that, or none at all, and bracketing the first roll of any batch is the most reliable way to find out what a particular lot actually wants.",
        "Expired stock is usually cheaper than fresh, but it is one-off inventory, whatever a shop happens to have found, so availability moves faster than it does for current stock and a listed roll can sell out quickly. Two shops selling expired stock of the same film are not necessarily selling the same thing either, since expiry dates and storage differ by lot. Filmproof lists expired film separately from fresh across UK retailers so you can see what is actually about and compare prices per roll before you buy.",
      ] },
    ],
  },
};

export const COMBO_CONTENT = {
  'colour-film/expired': {
    meta: { title: 'Expired Colour Film Prices UK | Compare & Buy | Filmproof', description: 'Compare expired colour film prices from UK retailers on Filmproof. Expired Kodak, Fujifilm and Lomography colour negative stock, tracked separately from fresh film.' },
    intro: "Expired colour film is where age shows most plainly. Colour negative film carries three dye layers, and they do not fade at the same rate, so as a roll ages past its date the balance between them drifts and the whole image takes on a cast. That shift is the reason a lot of people shoot expired colour deliberately. Compare expired colour film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "How expired colour film shifts", paragraphs: [
        "Which way the colour goes depends on the stock and how it was kept, but the direction is usually consistent within a batch: the cyan layer tends to hold up longest and the yellow to fade first, which is why heavily expired colour negative often prints green or magenta, and why the orange mask can look denser than it should. Alongside the shift you get the same base fog and speed loss any expired film picks up, which flattens contrast and mutes saturation.",
        "None of this is a defect to be corrected away, and scanning software that auto-balances every frame will fight you for it. If the cast is the reason you bought the roll, scan flat and set the balance yourself rather than letting the scanner neutralise it.",
      ] },
      { heading: "Shooting and buying expired colour", paragraphs: [
        "Colour negative has wide exposure latitude to begin with, which is what makes it the most forgiving type to shoot expired. The usual one stop of extra exposure per decade past the date applies, and the latitude absorbs a fair margin of error on top of that, so a roll metered generously will almost always give you something. Overexposure also lifts the image clear of the fog, which is where the muddiness in expired colour comes from.",
        "Everyday consumer stocks turn up expired far more often than professional ones, simply because they sold in much larger numbers. Filmproof lists expired colour film separately from fresh across UK retailers, with live prices per roll updated daily.",
      ] },
    ],
  },
  'black-and-white-film/expired': {
    meta: { title: 'Expired Black & White Film Prices UK | Compare & Buy | Filmproof', description: 'Compare expired black & white film prices from UK retailers on Filmproof. Expired Ilford, Kodak and Fomapan stock, tracked separately from fresh film.' },
    intro: "Black and white film keeps better than any other type. With no dye layers to fade out of balance, an expired roll loses speed and gains fog but holds its character, which is why decades-old black and white stock is often still perfectly usable while colour of the same age has shifted badly. Compare expired black & white film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Why black and white ages well", paragraphs: [
        "A monochrome emulsion is a single silver halide layer, so there is no colour balance to drift. What ageing does instead is raise base fog, which lifts the shadows and lowers contrast, and slowly reduce effective speed. Both are straightforward to work around, and neither changes the look of the film in the way a colour shift does.",
        "Slow film keeps best. An ISO 100 stock is far less sensitive to the background radiation that fogs film over time than an ISO 400 or 3200 one, so expired Pan F or FP4 will often shoot close to box speed decades on, while expired Delta 3200 can be badly fogged within a few years of its date.",
      ] },
      { heading: "Shooting and developing expired black and white", paragraphs: [
        "Start with the usual stop of extra exposure per decade, but black and white gives you a second lever colour does not: development. Pulling development slightly, or using a compensating developer, holds back the fog that extra exposure would otherwise amplify. If you develop your own film, a clip test from the first roll of a batch tells you exactly what the rest needs.",
        "Because black and white ages so gracefully, expired stock is often the cheapest way to shoot a lot of film. Filmproof lists expired black & white separately from fresh across UK retailers, with live prices per roll updated daily.",
      ] },
    ],
  },
  'slide-film/expired': {
    meta: { title: 'Expired Slide Film Prices UK | Compare & Buy | Filmproof', description: 'Compare expired slide film prices from UK retailers on Filmproof. Expired Fujifilm Velvia, Provia and Kodak Ektachrome, tracked separately from fresh film.' },
    intro: "Slide film is the least forgiving type to buy expired. Its narrow exposure latitude leaves nowhere for age-related fog and speed loss to hide, and because it develops to a positive there is no printing stage at which anything can be corrected. Storage history matters more here than for any other film. Compare expired slide film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Why expired slide film is harder", paragraphs: [
        "Colour negative film has several stops of latitude to absorb a bad guess at effective speed. Slide film has perhaps half a stop either side of correct, so the compensation that rescues an expired negative will blow out an expired transparency instead. Age-related fog is also more visible in a positive image, showing up as veiled, milky highlights and a colour cast that cannot be dialled out later.",
        "The one-stop-per-decade rule is therefore a much rougher guide here than elsewhere, and worth treating as the starting point for a bracket rather than a setting. Frozen or cold-stored slide film is a genuinely different proposition from room-temperature stock of the same date, and worth paying more for.",
      ] },
      { heading: "Buying expired slide film", paragraphs: [
        "Expired slide film is often sought out rather than merely tolerated, because several of the best-known emulsions no longer exist: Kodachrome cannot be processed at all any more, and discontinued Ektachrome and Fujichrome lines are only available expired. That scarcity means expired slide sometimes sells for more than fresh stock, not less.",
        "Ask about storage before buying anything old, and bracket generously on the first roll of a batch. Filmproof lists expired slide film separately from fresh across UK retailers, with live prices per roll updated daily.",
      ] },
    ],
  },
  '35mm-film/expired': {
    meta: { title: 'Expired 35mm Film Prices UK | Compare & Buy | Filmproof', description: 'Compare expired 35mm film prices from UK retailers on Filmproof. Expired Kodak, Fujifilm and Ilford 35mm rolls, tracked separately from fresh stock.' },
    intro: "Expired 35mm film is where most expired stock turns up, simply because 35mm has been made in far greater volume than any other format for decades, so there is more of it sitting in drawers, shop stockrooms and house clearances. It is also the cheapest format to shoot while you work out how a particular batch behaves. Compare expired 35mm film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "What to expect from expired 35mm", paragraphs: [
        "Expired 35mm covers everything from rolls a year or two past date, which usually shoot much like fresh film, to stock from the 1990s that has lost several stops of speed and shifted colour heavily. The everyday consumer stocks that sold in the largest numbers, Kodak Gold, UltraMax and the old Fujicolor lines, are the ones that surface most often, alongside discontinued emulsions that can only be bought expired now.",
        "As a starting point, meter around one stop over box speed for each decade past the date, so a ten-year-expired ISO 400 roll is shot at about ISO 200. Because 35mm gives you 24 or 36 frames, it is worth bracketing across the first roll of a batch rather than committing a whole shoot to a guess.",
      ] },
      { heading: "Buying expired 35mm film", paragraphs: [
        "Expired 35mm generally sells below fresh stock, though genuinely scarce discontinued emulsions can go the other way and command more than they ever did new. Ask how a roll was stored where you can, since cold-stored film from the 2000s often outperforms warm-stored film from the 2010s.",
        "Filmproof tracks expired 35mm separately from fresh 35mm across UK shops, so a cheap expired roll is never presented as the best price for a fresh one. Live prices per roll are updated daily.",
      ] },
    ],
  },
  '120-film/expired': {
    meta: { title: 'Expired 120 Film Prices UK | Compare & Buy | Filmproof', description: 'Compare expired 120 medium format film prices from UK retailers on Filmproof. Expired Kodak, Fujifilm and Ilford 120 rolls, tracked separately from fresh stock.' },
    intro: "Expired 120 film turns up less often than expired 35mm, but medium format shooters tend to seek it out for the discontinued emulsions that are no longer made in any format. With only eight to sixteen frames a roll, there is less room to experiment, so knowing how a batch was stored matters more here than it does in 35mm. Compare expired 120 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "What to expect from expired 120", paragraphs: [
        "120 has a quirk 35mm does not: the paper backing. Over long periods the printed backing can transfer its numbering onto the emulsion, leaving faint marks across frames, and the tape can dry out or the roll can loosen on the spool. That is a storage problem rather than an age problem, but it is specific to roll film and worth knowing about before buying anything very old.",
        "Otherwise expired 120 behaves like any expired stock, losing effective speed and gaining fog and grain, and the same one stop per decade starting point applies. The larger negative is more forgiving of the extra grain than 35mm is, which is part of why expired medium format is often more usable than its age suggests.",
      ] },
      { heading: "Buying expired 120 film", paragraphs: [
        "Expired 120 is scarcer than expired 35mm and often priced accordingly, particularly for discontinued Fujifilm colour and slide stocks that have no current equivalent. Because a roll gives you so few frames, it is worth buying more than one from the same batch if you find something you like, since the next lot will behave differently.",
        "Filmproof lists expired 120 separately from fresh 120 across UK retailers, with live prices per roll updated daily.",
      ] },
    ],
  },
  '35mm-film/colour': {
    meta: { title: 'Colour 35mm Film Prices UK | Compare & Buy | Filmproof', description: 'Compare colour 35mm film prices from UK retailers on Filmproof. Kodak Gold, Portra, Fujicolor and more, find the best deal on 35mm colour rolls.' },
    intro: "Colour 35mm film pairs the world's most widely supported film format with the widest choice of colour stocks anywhere in film photography, from budget everyday rolls to professional portrait film. It's the natural place to start if you're new to shooting colour on film. Compare colour 35mm film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Best colour 35mm film stocks", paragraphs: [
        "For everyday shooting, Kodak Gold 200, Kodak UltraMax 400 and Fujicolor C200 are affordable, forgiving choices that handle a wide range of lighting well. Photographers after finer grain and more accurate skin tones tend to move up to Kodak Portra or Fujicolor Superia X-Tra, both popular for portrait and wedding work.",
        "For a different look entirely, cine-derived stocks like CineStill 800T bring a cinematic tungsten colour cast and halation glow, while brands such as Lomography and Revolog offer bold, unpredictable colour effects for more experimental shooting, all built around the standard 35mm cassette.",
      ] },
      { heading: "Why shoot colour 35mm film", paragraphs: [
        "35mm is the cheapest and most widely developed film format in the UK, so colour 35mm film is the lowest-friction way to shoot colour on film, cheap rolls, fast C-41 processing at almost any lab, and the widest possible choice of stocks. Filmproof tracks live colour 35mm film prices across UK retailers so you can compare rolls before you buy.",
      ] },
    ],
  },
  '35mm-film/black-and-white': {
    meta: { title: 'Black & White 35mm Film Prices UK | Compare & Buy | Filmproof', description: 'Compare black & white 35mm film prices from UK retailers on Filmproof. Ilford HP5, Kodak Tri-X and more, find the best deal on B&W 35mm rolls.' },
    intro: "Black and white 35mm film is the classic combination for street, documentary and fine art photography, small and light enough to carry everywhere, and simple to develop at home without a colour darkroom. Compare black & white 35mm film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Best black and white 35mm film stocks", paragraphs: [
        "Ilford HP5 Plus and Kodak Tri-X 400 are the enduring standards, fast, forgiving and well suited to street and documentary work. For finer grain, Ilford FP4 Plus and the Delta and T-Max ranges offer a more modern look, while budget options like Kentmere and Fomapan make it affordable to shoot in volume.",
        "Chromogenic film such as Ilford XP2 Super processes in standard colour C-41 chemistry, useful if you want a black and white look without needing dedicated black and white developing.",
      ] },
      { heading: "Why shoot black and white 35mm film", paragraphs: [
        "35mm's low cost per roll and easy availability make it the easiest way into home developing, a changing bag, a development tank and basic chemistry is all it takes to process a roll of black and white 35mm film yourself. Filmproof tracks live black and white 35mm film prices across UK retailers.",
      ] },
    ],
  },
  '35mm-film/slide': {
    meta: { title: 'Slide 35mm Film Prices UK | Compare & Buy | Filmproof', description: 'Compare slide 35mm film prices from UK retailers on Filmproof. Fujifilm Velvia, Provia and Kodak Ektachrome, find the best deal on E-6 rolls.' },
    intro: "Slide 35mm film delivers punchy, saturated colour and exceptionally fine grain in the most widely supported film format, making it the most accessible way to shoot E-6 reversal film. Compare slide 35mm film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Best slide 35mm film stocks", paragraphs: [
        "Fujifilm Velvia 50 is the classic choice for landscape photographers chasing vivid, saturated colour, while Provia 100F offers a more neutral, balanced palette for general use. Kodak Ektachrome E100 is a popular alternative, relaunched in 2018 with slightly different colour rendering to Fuji's stocks.",
      ] },
      { heading: "Why shoot slide 35mm film", paragraphs: [
        "Slide film's narrow exposure latitude rewards careful metering, and 35mm is the easiest format to practise that discipline on thanks to its low cost per shot relative to 120 or large format slide film. Filmproof tracks live slide 35mm film prices across UK retailers, so you can compare Velvia, Provia and Ektachrome before buying.",
      ] },
    ],
  },
  '120-film/colour': {
    meta: { title: 'Colour 120 Film Prices UK | Compare & Buy | Filmproof', description: 'Compare colour 120 film prices from UK retailers on Filmproof. Kodak Portra, Ektar, Fujifilm and more, find the best deal on 120 colour rolls.' },
    intro: "Colour 120 film combines medium format's larger negative with the flattering tones and forgiving exposure latitude of colour negative film, a favourite for portrait, wedding and landscape photographers who want more detail than 35mm can offer. Compare colour 120 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Best colour 120 film stocks", paragraphs: [
        "Kodak Portra remains the medium format standard for portrait and wedding work, prized for natural skin tones, with Ektar 100 the go-to for punchy, fine-grained landscape colour. Fujifilm's colour ranges and more affordable options from Lomography and Rollei round out the choice.",
      ] },
      { heading: "Why shoot colour 120 film", paragraphs: [
        "The larger 120 negative resolves far more detail and smoother tonal gradation than 35mm, which is why colour 120 film is popular with photographers who print or exhibit large, or who simply want the shallow depth of field a bigger negative allows. Filmproof tracks live colour 120 film prices across UK retailers.",
      ] },
    ],
  },
  '120-film/black-and-white': {
    meta: { title: 'Black & White 120 Film Prices UK | Compare & Buy | Filmproof', description: 'Compare black & white 120 film prices from UK retailers on Filmproof. Ilford, Kodak and Fomapan, find the best deal on B&W medium format film.' },
    intro: "Black and white 120 film pairs medium format's large negative with classic monochrome tone and grain, a longstanding favourite for fine art, portrait and landscape photographers shooting cameras like the Hasselblad, Mamiya and Rolleiflex. Compare black & white 120 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Best black and white 120 film stocks", paragraphs: [
        "Ilford's HP5 Plus, FP4 Plus and Delta ranges are all available in 120, alongside Kodak Tri-X and T-Max. Budget-friendly options from Fomapan and Kentmere make it more affordable to shoot black and white in medium format regularly.",
      ] },
      { heading: "Why shoot black and white 120 film", paragraphs: [
        "The bigger 120 negative shows off fine monochrome grain and tonal range especially well, which is why black and white 120 film remains popular for darkroom printing and large-format scanning alike. Filmproof tracks live black and white 120 film prices across UK retailers.",
      ] },
    ],
  },
  '120-film/slide': {
    meta: { title: 'Slide 120 Film Prices UK | Compare & Buy | Filmproof', description: 'Compare slide 120 film prices from UK retailers on Filmproof. Fujifilm and Kodak E-6 medium format film, find the best deal.' },
    intro: "Slide 120 film brings together medium format's large negative and the punchy, fine-grained colour of E-6 reversal film, a niche but highly regarded combination for landscape and fine art photographers. Compare slide 120 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Best slide 120 film stocks", paragraphs: [
        "Fujifilm's Velvia and Provia ranges and Kodak Ektachrome are the main slide film options available in 120, offering the same vivid, saturated colour as their 35mm versions on a substantially larger negative.",
      ] },
      { heading: "Why shoot slide 120 film", paragraphs: [
        "A 120 slide held up to the light or projected shows off exceptional detail and colour, which is why it remains a favourite among photographers who want the ultimate in transparency quality. Filmproof tracks live slide 120 film prices across UK retailers.",
      ] },
    ],
  },
  '110-film/colour': {
    meta: { title: 'Colour 110 Film Prices UK | Compare & Buy | Filmproof', description: 'Compare colour 110 film prices from UK retailers on Filmproof. Lomography cartridge film for pocket cameras, find the best deal.' },
    intro: "Colour 110 film brings the small, self-contained cartridge format back to life, mainly through Lomography's modern colour stocks, giving pocket cameras a distinctive, lo-fi grainy character. Compare colour 110 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Best colour 110 film stocks", paragraphs: [
        "Lomography is the main active producer of colour 110 film, with Tiger 200 as its everyday colour negative option and Lobster 200, a redscale film shot through the base of the film for warm, red-toned images, both designed for its own Lomomatic cameras and other 110 pocket cameras.",
      ] },
      { heading: "Why shoot colour 110 film", paragraphs: [
        "110's tiny negative gives colour images a distinctive soft, grainy character that's become popular in its own right rather than despite its limitations. Because supply is limited, Filmproof tracks colour 110 film stock across UK retailers so you can catch it when it's available.",
      ] },
    ],
  },
  '110-film/black-and-white': {
    meta: { title: 'Black & White 110 Film Prices UK | Compare & Buy | Filmproof', description: 'Compare black & white 110 film prices from UK retailers on Filmproof. Lomography Orca cartridge film for pocket cameras.' },
    intro: "Black and white 110 film pairs the pocket-sized cartridge format with classic monochrome tone, a niche option for photographers who want the format's distinctive grain without colour. Compare black & white 110 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Best black and white 110 film stocks", paragraphs: [
        "Lomography Orca 100 is currently the main dedicated black and white 110 film, an ISO 100 negative stock designed for the format's wide depth of field, developed the same way as any standard black and white film.",
      ] },
      { heading: "Why shoot black and white 110 film", paragraphs: [
        "110's small negative combined with monochrome tone produces a distinctly gritty, vintage look that suits experimental and lo-fi shooting. Filmproof tracks black and white 110 film stock across UK retailers.",
      ] },
    ],
  },
  '110-film/slide': {
    meta: { title: 'Slide 110 Film Prices UK | Compare & Buy | Filmproof', description: 'Compare slide 110 film prices from UK retailers on Filmproof. Lomography Peacock X-Pro, the only E-6 slide film for pocket cameras.' },
    intro: "Slide 110 film has one standing option, Lomography's Peacock X-Pro, a genuine E-6 reversal film built for cross-processing that brings bold, colour-shifted slides to the pocket-sized cartridge format. Compare slide 110 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Slide 110 film stocks", paragraphs: [
        "Lomography Peacock X-Pro 200 is currently the only slide film made in 110 format, an E-6 reversal stock designed specifically for cross-processing in C-41 chemistry, which produces the bold, colour-shifted look it's known for rather than conventional accurate slide colour.",
      ] },
      { heading: "Why shoot slide 110 film", paragraphs: [
        "Cross-processed in C-41, Peacock delivers unpredictable, saturated colour shifts on a pocket-sized negative, a genuinely different look from Lomography's Tiger colour negative or Orca black and white 110 films. Filmproof tracks slide 110 film stock across UK retailers.",
      ] },
    ],
  },
  '127-film/colour': {
    meta: { title: 'Colour 127 Film Prices UK | Compare & Buy | Filmproof', description: 'Compare colour 127 film prices from UK retailers on Filmproof. Kodak Gold 200 and Reflx Lab Pro100, respooled for vintage box cameras.' },
    intro: "Colour 127 film keeps vintage box cameras and 1950s-60s models like the Baby Rolleiflex shooting in colour, supplied almost entirely by small specialist companies who respool other film stock down to 127 size. Compare colour 127 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Best colour 127 film stocks", paragraphs: [
        "Because 127 isn't manufactured at scale by any major brand, colour options come from small specialist respoolers, most notably Kodak Gold 200 cut down into 127 rolls, and Reflx Lab Pro100, a colour negative stock respooled from Aerocolor print film. Choice and availability are narrower and less predictable than mainstream formats.",
      ] },
      { heading: "Why shoot colour 127 film", paragraphs: [
        "If you've got a vintage camera built for 127, it's the only genuine way to shoot roll film through it, rather than adapting another format. Filmproof tracks colour 127 film stock across UK retailers, helping you catch it when the small suppliers who keep the format alive have rolls in stock.",
      ] },
    ],
  },
  '127-film/black-and-white': {
    meta: { title: 'Black & White 127 Film Prices UK | Compare & Buy | Filmproof', description: 'Compare black & white 127 film prices from UK retailers on Filmproof. ReraPan and other respooled film for vintage box cameras.' },
    intro: "Black and white 127 film is the more readily available side of this vintage format, supplied by specialist manufacturers who cut and respool black and white stock to fit classic box cameras and 1950s-60s models. Compare black & white 127 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Best black and white 127 film stocks", paragraphs: [
        "ReraPan 100, from the Japanese specialist Rera, is the main dedicated black and white 127 film currently in production, giving vintage camera owners a genuine, ongoing choice of stock rather than relying entirely on expired vintage rolls.",
      ] },
      { heading: "Why shoot black and white 127 film", paragraphs: [
        "Black and white 127 film tends to be a little more consistently available than colour 127, making it the more practical choice for regularly shooting a vintage camera built around the format. Filmproof tracks black and white 127 film stock across UK retailers.",
      ] },
    ],
  },
  '127-film/slide': {
    meta: { title: 'Slide 127 Film Prices UK | Compare & Buy | Filmproof', description: 'Compare slide 127 film prices from UK retailers on Filmproof. ReraChrome, the only current E-6 slide film in 127 format.' },
    intro: "Slide 127 film has a single current standard-bearer, ReraChrome, a genuine E-6 reversal film cut and spooled specifically for 127 cameras. Compare slide 127 film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Slide 127 film stocks", paragraphs: [
        "ReraChrome 100 is currently the only colour slide film made in 127 format, an E-6 reversal stock from the same Japanese manufacturer, Rera, behind ReraPan black and white 127 film. It's a small-batch specialist product rather than something produced at scale, so stock can be limited.",
      ] },
      { heading: "Why shoot slide 127 film", paragraphs: [
        "For 127 camera owners who want to see just how good a vintage box camera or Baby Rolleiflex can look with punchy, saturated reversal film, ReraChrome is the way to do it. Filmproof tracks slide 127 film stock across UK retailers.",
      ] },
    ],
  },
  'large-format-film/colour': {
    meta: { title: 'Colour Large Format Film Prices UK | Compare & Buy | Filmproof', description: 'Compare colour large format sheet film prices from UK retailers on Filmproof. Kodak Portra and Ektar in 4x5, 8x10 and more.' },
    intro: "Colour large format film brings Kodak's professional colour negative stocks to individual sheets, giving landscape, architectural and fine art photographers the largest colour negatives available in still photography. Compare colour large format film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Best colour large format film stocks", paragraphs: [
        "Kodak's Portra and Ektar ranges are the main colour options available in sheet form, typically in 4x5 and 8x10 inch sizes, offering the same natural skin tones and punchy landscape colour as their roll film versions on a vastly larger negative.",
      ] },
      { heading: "Why shoot colour large format film", paragraphs: [
        "A colour large format negative resolves an extraordinary level of detail, and view camera movements allow precise control over perspective and focus that no roll film camera can match. Filmproof tracks colour large format film prices and stock across UK retailers.",
      ] },
    ],
  },
  'large-format-film/black-and-white': {
    meta: { title: 'Black & White Large Format Film Prices UK | Compare & Buy | Filmproof', description: 'Compare black & white large format sheet film prices from UK retailers on Filmproof. Ilford, Kodak, Fomapan and Adox in 4x5, 8x10 and more.' },
    intro: "Black and white large format film is the classic choice for fine art and landscape photography, giving the largest, most detailed monochrome negatives available and full control over individual sheet development. Compare black & white large format film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Best black and white large format film stocks", paragraphs: [
        "Ilford (HP5 Plus, FP4 Plus, Delta), Kodak (T-Max, Tri-X) and specialist black and white makers Fomapan and Adox all produce sheet film, typically in 4x5 and 8x10 inch sizes, giving a wide choice of traditional and modern emulsions.",
      ] },
      { heading: "Why shoot black and white large format film", paragraphs: [
        "Because each sheet is developed individually, black and white large format film is popular with photographers who want precise control over contrast and development for every single exposure, a technique that underpins much of classic fine art photography. Filmproof tracks black and white large format film prices and stock across UK retailers.",
      ] },
    ],
  },
  'large-format-film/slide': {
    meta: { title: 'Slide Large Format Film Prices UK | Compare & Buy | Filmproof', description: 'Compare slide large format sheet film prices from UK retailers on Filmproof. Kodak Ektachrome E100 in 4x5, 5x7 and 8x10.' },
    intro: "Slide large format film puts genuine E-6 reversal chemistry onto individual sheets, a small but real part of the ranges from Kodak and Fujifilm rather than a purely specialist or hand-made product. Compare slide large format film prices from UK retailers on Filmproof.",
    sections: [
      { heading: "Slide large format film stocks", paragraphs: [
        "Kodak Ektachrome E100 is the main current option, produced in 4x5, 5x7 and 8x10 sheet sizes alongside its roll film versions. Fujifilm's Provia 100F is also available in 4x5, though supply has tightened in recent years, while Fujifilm discontinued Velvia 50 in 4x5 and 8x10 sheet sizes in 2022, so it's no longer part of the current range.",
      ] },
      { heading: "Why shoot slide large format film", paragraphs: [
        "A large format slide held to the light or on a light box shows off transparency detail and colour that's hard to match with any other combination of format and film type, and unlike some large format colour options, both Kodak and Fujifilm still keep at least one E-6 sheet stock in active production. Filmproof tracks slide large format film prices and stock across UK retailers.",
      ] },
    ],
  },
};

export function getFormatContent(slug) {
  return FORMAT_CONTENT[slug] || null;
}

export function getTypeContent(slug) {
  return TYPE_CONTENT[slug] || null;
}

export function getConditionContent(slug) {
  return CONDITION_CONTENT[slug] || null;
}

export function getComboContent(categorySlug, subShort) {
  return COMBO_CONTENT[`${categorySlug}/${subShort}`] || null;
}
