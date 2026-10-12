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
- Deployed on the developer's Coolify server as a Node app (not as a static site), with the variables from `.env.example` set there.
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
- `src/components/accommodation/`: the Accommodation page and the room page. The thin files in `src/pages/accommodation/` and `src/pages/el/accommodation/` only choose the language.
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
- Motion is slow, soft and plays once: `data-reveal` for text, `data-reveal="image"` for photos, `--i` for a small delay between neighbours. Nothing loops or moves on its own. Reduced-motion settings must be respected.
- Tone of the texts: calm and professional, warm, family-run. Do not invent facts about the hotel (prices, times, capacities); ask instead.

## Decisions

- Booking: "Book now" and the booking bar send visitors to the external engine at `paliokalivavillage.reserve-online.net`. Passing dates and guests in the URL is not yet tested against the live engine.
- RateParity price widget: one script, loaded only in production builds and only after the visitor chooses "Allow" in the cookie notice (`rateParityNeedsConsent` in `site.ts`). It appears in the bottom right corner, so the offer card and the cookie notice sit bottom left. It is expected to work only on the live domain.
- Cookie notice: it exists only because of RateParity. The site itself sets no cookies; the choice is kept in `localStorage` for 180 days and can be changed from the footer or the Privacy Policy page. The Google map loads on click and Umami uses no cookies, so neither is in the notice.
- Statistics: self-hosted Umami at `analytics.webartworks.com`, loaded in production once `analytics.websiteId` is set in `site.ts`.
- Page transitions use the browser's native `@view-transition`. Do not add Astro's `ClientRouter`: it would remove the RateParity widget when the visitor changes page.
- Offers: there is no offers page. A running offer is shown with the offer card.
- Meraki Restaurant is a separate business next to the hotel, with its own logo and photos. Table reservations will be an email form on the hotel site.
- Forms send email through Postmark. The sender is always `mailer@webartworks.gr` and the hotel receives at `info@paliokaliva.gr`. The email to the hotel has the guest as Reply-To; the receipt to the guest has the hotel as Reply-To and never repeats the guest's free text. Without `POSTMARK_SERVER_TOKEN`, `pnpm dev` prints the emails in the terminal and the built site answers with an error.
- Forms are protected by a hidden trap field, a minimum fill time and a limit of 5 requests per 10 minutes per visitor. There is no captcha.
- Newsletter: a simple hosted service (for example Brevo or MailerLite) is planned; not chosen yet.
- Menu: Our Village, Accommodation, Village Life, Meraki Restaurant, Activities, Zakynthos, Contact. Gallery and Privacy Policy are in the footer. Six room types, each with its own page.

## Open points

Waiting for the owner or the developer:

- Room facts (sizes, guests, beds, bathrooms, facilities) come from the old site and need confirming. Superior Villa is set to 5 guests for now. "CD & DVD player" from the old facilities list was left out as probably outdated.
- Two photos in the client's folders are AI-generated (file names start with `Gemini_Generated_Image`). They are not used; ask before using them.
- Reception hours (left out of the footer until confirmed).
- Whether the mobile number has WhatsApp.
- Meraki menu: the "See the menu" button is hidden until `site.meraki.menuUrl` is set.
- Meraki opening season, hours and its own phone number are unknown; the page shows the hotel phone and the form accepts any time.
- Real sending through Postmark has not been tested from this side.
- Privacy Policy: a draft written by Claude, not legal advice; the owner or their lawyer should approve it. The legal company name, VAT number and G.E.MI. number are empty in `site.legal`. When the policy changes, update `privacyUpdated` there.
- Umami website ID is not set yet (`site.analytics.websiteId`).
- Whether RateParity really stores cookies is not known; the consent gate is the cautious default.
- The Google map on the Contact page loads only after the visitor clicks "Show the map". Maps, directions and search data all use the coordinates in `site.geo`.
- Distances on the Contact page come from the owner's text. "Bus Station 250 m" was written as "Bus stop".
- Activities page: written in general terms on purpose, with no dates, times, prices or booking rules, until the owner sends those details. Each activity is a section of one page; separate pages can follow when there is more to say.
- The Zakynthos page has no photos of the island, because none were supplied. It needs photos the hotel has the right to use (Navagio, Blue Caves, turtles, beaches, villages). Its facts come from the owner's text and were not checked against other sources.
- Our Village says the hotel is family-run and that events include wine tastings and folk dancing evenings. This comes from the owner's questionnaire and texts; the owner should read that section.
- Greek titles in EB Garamond look old-fashioned; the developer is deciding whether to keep it.
- On phones the RateParity widget may overlap the Call / WhatsApp / Book bar; check on a test address.

Built: homepage, Accommodation, six room pages, Village Life, Meraki Restaurant with the table request form, Contact with the contact form, Our Village, Zakynthos, Gallery, Activities, Privacy Policy, and a 404 page. Still to build: the newsletter signup and redirects from the old site's addresses.
