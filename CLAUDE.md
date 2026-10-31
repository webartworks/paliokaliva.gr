# Paliokaliva Village website

Website for Paliokaliva Village, a boutique hotel of 18 stone houses in Tragaki, Zakynthos (paliokaliva.gr). Built by Web Artworks for the hotel owner. It replaces an older PHP site.

The developer's English is not strong: write to them in simple, clear English. Text for the website itself must be polished. Greek text is checked by the developer.

## Commands

- `pnpm dev` starts the dev server.
- `pnpm build` builds the site into `dist/` (`dist/client` for the static pages, `dist/server` for the form endpoints). The first build is slow because it generates the images; later builds reuse the cache.
- `pnpm start` runs the built site (`node dist/server/entry.mjs`). It listens on `HOST` and `PORT`.
- Use pnpm, not npm. Astro 5 on Node 20 or newer (Astro 6+ needs Node 22).

## Stack and hosting

- Astro, no CMS. The developer edits content in the code. All pages are static; only the form endpoints in `src/pages/api/` run on the server, through the `@astrojs/node` adapter.
- Deployed on the developer's Coolify server as a Node app (not as a static site), with the variables from `.env.example` set there. Coolify builds from the `Dockerfile` (Build Pack: Dockerfile) and deploys on every push to `main` of `github.com/webartworks/paliokaliva.gr`. The Dockerfile keeps Astro's image cache on the server between builds; without it a build takes about 30 minutes. It sets `HOST`, `PORT` (3000) and installs `curl` for the Coolify health check.
- No UI framework and no animation library. Plain CSS and one small script.
- Fonts are self-hosted through `@fontsource-variable`: EB Garamond (titles), Open Sans (body), Fira Code (small quotes).

## Where things live

- `src/i18n/en.ts` and `src/i18n/el.ts`: every text on the site. `el.ts` is typed against `en.ts`, so a missing Greek text is a type error.
- `src/data/site.ts`: contact details, booking engine URL, social links, routes, menu order.
- `src/data/rooms.ts`: the six room types with size, guests and extra facilities, and the list of facilities found in every house.
- `src/data/offer.ts`: the offer card. Set `active`, the texts and the dates. Change `id` for each new offer.
- `src/styles/global.css`: colours, type sizes, spacing, shared classes (`.eyebrow`, `.h2`, `.btn`, `.arrow-link`, `.media`) and the motion rules.
- `src/scripts/site.ts`: scroll reveals, header state, mobile menu, booking bar, photo strip, mobile bar, offer card.
- `src/layouts/Base.astro`: page shell, meta tags, language alternates.
- `src/lib/mail.ts`: sending through Postmark, plus validation helpers and the request limit. `src/lib/form.ts` holds the steps every form endpoint shares. The endpoints are `src/pages/api/reservation.ts` (Meraki table request) and `src/pages/api/contact.ts`. On the page side, `FormFrame` holds what every form shares and the form texts common to all forms are in the `form` group of the dictionaries.
- `src/lib/seo.ts`: structured data for search engines (hotel, restaurant, breadcrumbs). `src/pages/sitemap.xml.ts` builds the sitemap from `routes` and the room list, so a new page added to `routes` is listed automatically. `public/` holds `robots.txt`, the icons and `og-default.jpg`, the general sharing image.
- `.env.example`: the settings the forms need. The real `.env` is never committed.
- `src/components/home/`: the homepage sections, one file each.
- `src/components/accommodation/`: the Our Houses page (at `/our-houses/`) and the room page. The thin files in `src/pages/our-houses/` and `src/pages/el/our-houses/` only choose the language.
- Shared page parts: `PageHero` (opening photo of an inner page), `Gallery` (photo mosaic with a large viewer), `RoomCard` / `RoomGrid`, `FeatureSection` (large photo beside text, with a small second photo), `LineList` / `AmenityList`, `BookingCta`.
- `src/pages/404.astro`: the "page not found" page, in both languages.
- `src/assets/images/`: photos used on the site, already cropped and resized.
- `src/assets/images/gallery/<group>/`: photos of the Gallery page, one folder per filter (village, pool, breakfast, activities), named `NN.jpg` and shown in file name order. The "Houses" group is not a folder: it takes the first two photos of every room. Alt texts on this page are generic (group name and number).
- `src/assets/images/rooms/<room>/`: gallery photos of each room, named `NN-kind.jpg` (for example `02-bedroom.jpg`). They show in file name order, the first is the page's opening photo, and the kind (bedroom, living, kitchen, dining, bathroom, interior, detail) gives the alt text. Adding a file adds it to the gallery.
- `_reference/`: the client's source material (design, brand book, texts, photos, videos). It is not in git. Never write into it; copy what is needed into `src/assets/`.

## Rules

- Two languages: English at `/`, Greek at `/el/`, with the same English slugs. Every new text needs both.
- Use `localePath(locale, path)` for internal links and `routes` from `site.ts` for paths. URLs end with a slash.
- Follow the homepage design in `_reference/design/UI/`. Colours and fonts come from the tokens in `global.css`; do not add new ones without asking.
- Every page passes `title` and `description` to `Base`. Pages with an opening photo also pass it as `image` (it becomes the 1200 x 630 sharing image) and a `jsonLd` breadcrumb.
- Photos go through `<Picture>` from `astro:assets` with `formats={imageFormats}` (from `src/lib/images.ts`), inside a `.media` wrapper. The built site offers AVIF and WebP; `pnpm dev` offers WebP only, because the dev server re-encodes AVIF on every request and takes seconds per photo.
- Motion is slow, soft and plays once: `data-reveal` for text (a fade with a very small drift), `data-reveal="image"` for photos (a slow curtain with a feathered edge; photos never move or zoom, also not on hover; the one exception is the homepage opening photo, which settles with a 3% zoom), `--i` for a small delay between neighbours. Titles fade in; nothing rises or bounces. The only thing that loops is the homepage slideshow, which the developer asked for: five photos cross-fade slowly behind the title and booking bar (photo list and a commented-out earlier selection in `Hero.astro`, timing in `initHeroSlides`). It has a pause button, rests when out of view, and does not run for visitors who asked for reduced motion. Short silent videos play over a photo while they are on screen: the pottery photo on the Activities page (`video` prop of `FeatureSection`), the pottery card on the homepage (`Activities.astro`), and the opening photos of the Activities and Meraki pages (`video` prop of `PageHero`, with a wide file for landscape screens and a tall one for upright screens; the wide files are a band cut out of the upright originals, so they are soft on large screens, which the developer accepted). The files are in `public/video/`, made from the client's two vertical videos with ffmpeg (no sound). At the developer's request they contain no guests' faces, only hands, clay, pots and cloths, and one person seen from behind. Staff of Meraki may be shown (chef, waiter), but not its guests and not the musicians' faces (the developer asked to remove them; the close-up of hands on the mandolin stays). Two people may be shown in the workshop video, as the developer confirmed: the workshop tutor (dark curly hair with a fringe, brown top) and a woman dressed in white with glasses. Keep it that way if the videos are ever re-cut. Lengths are now 15 to 21 seconds. The photo always stays underneath as the fallback, so removing the `video` prop restores the photo. Same rules as the slideshow, and the videos are not loaded for visitors who save data. The second client video shows a fabric dyeing workshop, which the site's texts do not mention yet.
- Tone of the texts: calm and professional, warm, family-run. Do not invent facts about the hotel (prices, times, capacities); ask instead.

## Decisions

- Main address: `https://www.paliokaliva.gr`, with www. The non-www address redirects to it. The address is set in `astro.config.mjs`, `src/data/site.ts` and `public/robots.txt`; keep the three the same.
- Booking: "Book now" and the booking bar send visitors to the external engine at `paliokalivavillage.reserve-online.net`. Passing dates and guests in the URL is not yet tested against the live engine.
- RateParity price widget: one script, loaded only in production builds and only after the visitor chooses "Allow" in the cookie notice (`rateParityNeedsConsent` in `site.ts`). It appears in the bottom right corner, so the offer card and the cookie notice sit bottom left. It is expected to work only on the live domain.
- WhatsApp button: a round button in the bottom right corner (`WhatsAppButton.astro`), on tablets and computers only (phones have WhatsApp in the bottom bar). It fades in after the opening photo, like the phone bar. RateParity sits above that corner; check on the live domain that they do not overlap.
- Cookie notice: it exists only because of RateParity. The site itself sets no cookies; the choice is kept in `localStorage` for 180 days and can be changed from the footer or the Privacy Policy page. The Google map loads on click and Umami uses no cookies, so neither is in the notice.
- Car hire: the Eurohire form (partner ID from the old site, in `site.carHire`) is on Village Life, under Facilities & services (`#car-hire`); "Car hire" in the services list links to it. It loads only after the visitor clicks "Find a car", inside a frame showing `src/pages/embed/car-hire.astro`, because the form's own CSS would otherwise restyle the whole page (fonts and colours). That page also holds our style overrides for the form. The form is English only, loads jQuery, Google Fonts and Google Maps, and opens the booking in a popup window from Eurohire. The Privacy Policy mentions it.
- Statistics: self-hosted Umami at `analytics.webartworks.com`, loaded in production once `analytics.websiteId` is set in `site.ts`.
- Page transitions use the browser's native `@view-transition`. Do not add Astro's `ClientRouter`: it would remove the RateParity widget when the visitor changes page.
- Offers: there is no offers page. A running offer is shown with the offer card.
- Meraki Restaurant is a separate business next to the hotel, with its own logo and photos. Table reservations will be an email form on the hotel site.
- Forms send email through Postmark. The Postmark server is shared with other Web Artworks sites, so the sender is always `Mailer from Web Artworks <mailer@webartworks.gr>` and every email has the tag `paliokaliva.gr`. The hotel receives at `info@paliokaliva.gr`, with the guest as Reply-To. The forms send nothing to the guest: the developer removed the automatic replies, so do not add them back without asking. Without `POSTMARK_SERVER_TOKEN`, `pnpm dev` prints the emails in the terminal and the built site answers with an error.
- Forms are protected by `src/lib/antispam.ts`, a TypeScript copy of the Web Artworks PHP spam kit used on the other client sites: a hidden trap field, a signed time token from `/api/token` (fetched by `site.ts`; at least 4 seconds and at most 3 hours old), the shared blocklists from `validation.webartworks.gr` (names, emails, domains, message phrases and words, cached for 6 hours, skipped if unavailable), an MX check of the email domain, and rules against links, repeated names, digits in names and text mostly in a script other than Latin or Greek. Bot traps get a normal "sent" answer; the other rules answer `spam`, and the form tells the visitor to call or email. Then a limit of 5 requests per 10 minutes per visitor. There is no captcha. `ANTISPAM_SECRET` is optional (see `.env.example`).
- Newsletter: a simple hosted service (for example Brevo or MailerLite) is planned; not chosen yet.
- Menu: Our Village, Our Houses, Village Life, Meraki Restaurant, Activities, Zakynthos, Contact. Gallery and Privacy Policy are in the footer. Six room types, each with its own page.

## Open points

Waiting for the owner or the developer:

- Room facts (sizes, guests, beds, bathrooms, facilities) come from the old site and need confirming. Superior Villa: max 4 guests, confirmed by the owner. "CD & DVD player" from the old facilities list was left out as probably outdated.
- Two photos in the client's folders are AI-generated (file names start with `Gemini_Generated_Image`). They are not used; ask before using them.
- Reception hours (left out of the footer until confirmed).
- Whether the mobile number has WhatsApp.
- Meraki menu: the "See the menu" button is hidden until `site.meraki.menuUrl` is set.
- Meraki opening season, hours and its own phone number are unknown; the page shows the hotel phone and the form accepts any time.
- Real sending through Postmark has not been tested from this side.
- Privacy Policy: a draft written by Claude, not legal advice; the owner or their lawyer should approve it. The legal company name, VAT number and G.E.MI. number are empty in `site.legal`. When the policy changes, update `privacyUpdated` there.
- Whether RateParity really stores cookies is not known; the consent gate is the cautious default.
- The Google map on the Contact page loads only after the visitor clicks "Show the map". Maps, directions and search data all use the coordinates in `site.geo`.
- Distances on the Contact page come from the owner's text. "Bus Station 250 m" was written as "Bus stop".
- Activities page: written in general terms on purpose, with no dates, times, prices or booking rules, until the owner sends those details. Each activity is a section of one page; separate pages can follow when there is more to say.
- The Zakynthos page has no photos of the island, because none were supplied. It needs photos the hotel has the right to use (Navagio, Blue Caves, turtles, beaches, villages). Its facts come from the owner's text and were not checked against other sources.
- Our Village says the hotel is family-run and that events include wine tastings and folk dancing evenings. This comes from the owner's questionnaire and texts; the owner should read that section.
- Greek titles in EB Garamond look old-fashioned; the developer is deciding whether to keep it.
- The map in the Eurohire place picker shows "This page can't load Google Maps correctly" on localhost; it uses Eurohire's Google key, so check it on the live domain.
- On phones the RateParity widget may overlap the Call / WhatsApp / Book bar; check on a test address.

Built: homepage, Our Houses, six room pages, Village Life, Meraki Restaurant with the table request form, Contact with the contact form, Our Village, Zakynthos, Gallery, Activities, Privacy Policy, and a 404 page. Still to build: the newsletter signup and redirects from the old site's addresses.
