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
- `.env.example`: the settings the forms need. The real `.env` is never committed.
- `src/components/home/`: the homepage sections, one file each.
- `src/components/accommodation/`: the Accommodation page and the room page. The thin files in `src/pages/accommodation/` and `src/pages/el/accommodation/` only choose the language.
- Shared page parts: `PageHero` (opening photo of an inner page), `Gallery` (photo mosaic with a large viewer), `RoomCard` / `RoomGrid`, `FeatureSection` (large photo beside text, with a small second photo), `LineList` / `AmenityList`, `BookingCta`.
- `src/pages/[...path].astro`: placeholder for every page that is not built yet. When a real page is added, remove its entry from the list there.
- `src/assets/images/`: photos used on the site, already cropped and resized.
- `src/assets/images/rooms/<room>/`: gallery photos of each room, named `NN-kind.jpg` (for example `02-bedroom.jpg`). They show in file name order, the first is the page's opening photo, and the kind (bedroom, living, kitchen, dining, bathroom, interior, detail) gives the alt text. Adding a file adds it to the gallery.
- `_reference/`: the client's source material (design, brand book, texts, photos, videos). It is not in git. Never write into it; copy what is needed into `src/assets/`.

## Rules

- Two languages: English at `/`, Greek at `/el/`, with the same English slugs. Every new text needs both.
- Use `localePath(locale, path)` for internal links and `routes` from `site.ts` for paths. URLs end with a slash.
- Follow the homepage design in `_reference/design/UI/`. Colours and fonts come from the tokens in `global.css`; do not add new ones without asking.
- Photos go through `<Picture>` from `astro:assets` with `avif` and `webp`, inside a `.media` wrapper.
- Motion is slow, soft and plays once: `data-reveal` for text, `data-reveal="image"` for photos, `--i` for a small delay between neighbours. Nothing loops or moves on its own. Reduced-motion settings must be respected.
- Tone of the texts: calm and professional, warm, family-run. Do not invent facts about the hotel (prices, times, capacities); ask instead.

## Decisions

- Booking: "Book now" and the booking bar send visitors to the external engine at `paliokalivavillage.reserve-online.net`. Passing dates and guests in the URL is not yet tested against the live engine.
- RateParity price widget: one script, loaded only in production builds. It appears in the bottom right corner, so the offer card sits bottom left. It is expected to work only on the live domain.
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
- Reception hours and the TripAdvisor link (both left out of the footer until confirmed).
- Whether the mobile number has WhatsApp.
- Meraki menu: the "See the menu" button is hidden until `site.meraki.menuUrl` is set.
- Meraki opening season, hours and its own phone number are unknown; the page shows the hotel phone and the form accepts any time.
- The Postmark token is not set yet, so real sending has not been tested.
- The Google map on the Contact page loads only after the visitor clicks "Show the map". It searches for the hotel by name; check that the pin is on the hotel, or replace `mapsEmbedUrl` and `mapsUrl` in `site.ts` with exact links.
- Distances on the Contact page come from the owner's text. "Bus Station 250 m" was written as "Bus stop".
- Activity details (pottery workshop, wine tasting): the current texts are drafts without facts.
- Greek titles in EB Garamond look old-fashioned; the developer is deciding whether to keep it.
- On phones the RateParity widget may overlap the Call / WhatsApp / Book bar; check on a test address.

Built: homepage, Accommodation, six room pages, Village Life, Meraki Restaurant with the table request form, Contact with the contact form. Still to build: the other inner pages, the forms, the newsletter signup, the privacy policy and cookie notice, redirects from the old site's addresses, and a social sharing image.
