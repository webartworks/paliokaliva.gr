export const site = {
  name: 'Paliokaliva Village',
  url: 'https://paliokaliva.gr',
  email: 'info@paliokaliva.gr',
  phone: { href: '+302695063770', label: '+30 26950 63770' },
  mobile: { href: '+306974774379', label: '+30 697 477 4379' },
  whatsapp: '306974774379',
  bookingUrl: 'https://paliokalivavillage.reserve-online.net/',
  // RateParity price comparison widget, as on the previous website. Set to '' to turn it off.
  rateParityScript: 'https://code.rateparity.com/versions/installer.min.js',
  // True: the widget loads only after the visitor allows it in the cookie notice.
  // False: it loads for everyone and no cookie notice is shown. Only switch this off
  // if RateParity confirms in writing that the widget stores nothing on the visitor's device.
  rateParityNeedsConsent: true,
  // Umami visitor statistics, hosted by Web Artworks. They use no cookies, so they need
  // no consent. Fill in the website ID from Umami to switch them on.
  analytics: {
    src: 'https://analytics.webartworks.com/script.js',
    websiteId: '',
  },
  // Shown on the Privacy Policy page. Fill in the legal details of the company that runs the hotel.
  legal: {
    company: '',
    vat: '',
    gemi: '',
    // Date of the latest change to the Privacy Policy.
    privacyUpdated: '2026-10-13',
  },
  licence: '1017280',
  // Exact position of the hotel, used for directions, the embedded map and search engines.
  geo: { lat: 37.820195, lng: 20.85055 },
  // Opens the hotel's own Google Maps profile (photos, reviews). It finds the hotel by name;
  // coordinates alone would only show a plain pin. Replace with the hotel's share link if you have it.
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Paliokaliva+Village+Zakynthos',
  // Opens Google Maps with the route from where the visitor is to the hotel.
  directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=37.820195,20.85055',
  // The embedded map on the Contact page. It loads only after the visitor asks for it.
  mapsEmbedUrl: 'https://www.google.com/maps?q=37.820195,20.85055&z=15&output=embed',
  social: {
    instagram: 'https://www.instagram.com/paliokaliva/',
    facebook: 'https://www.facebook.com/PaliokalivaZakynthos',
    // Set to null to hide the TripAdvisor link.
    tripadvisor:
      'https://www.tripadvisor.com/Hotel_Review-g25085052-d1184618-Reviews-Paliokaliva_Village-Arkadii_Zakynthos_Ionian_Islands.html' as
        | string
        | null,
  },
  meraki: {
    // Exact position of the restaurant, used for search engines.
    geo: { lat: 37.820095, lng: 20.850771 },
    // Set the menu URL (page or PDF) to show the "See the menu" button.
    menuUrl: null as string | null,
  },
} as const;

export const routes = {
  home: '/',
  village: '/our-village/',
  accommodation: '/our-houses/',
  life: '/village-life/',
  meraki: '/meraki-restaurant/',
  activities: '/activities/',
  zakynthos: '/zakynthos/',
  contact: '/contact/',
  gallery: '/gallery/',
  privacy: '/privacy-policy/',
} as const;

export type RouteKey = keyof typeof routes;

export const mainNav: RouteKey[] = [
  'village',
  'accommodation',
  'life',
  'meraki',
  'activities',
  'zakynthos',
  'contact',
];
