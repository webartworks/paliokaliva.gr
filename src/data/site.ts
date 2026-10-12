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
  licence: '1017280',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Paliokaliva+Village+Zakynthos',
  social: {
    instagram: 'https://www.instagram.com/paliokaliva/',
    facebook: 'https://www.facebook.com/PaliokalivaZakynthos',
    // Set the TripAdvisor URL to show the link in the footer.
    tripadvisor: null as string | null,
  },
  meraki: {
    // Set the menu URL (page or PDF) to show the "See the menu" button.
    menuUrl: null as string | null,
  },
} as const;

export const routes = {
  home: '/',
  village: '/our-village/',
  accommodation: '/accommodation/',
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

export const roomSlugs = [
  'studio',
  'superior-studio',
  'apartment',
  'superior-apartment',
  'villa',
  'superior-villa',
] as const;

export type RoomSlug = (typeof roomSlugs)[number];

// Size in m² and maximum guests, as published on the previous website.
export const roomFacts: Record<RoomSlug, { size: number; guests: number }> = {
  studio: { size: 40, guests: 3 },
  'superior-studio': { size: 50, guests: 4 },
  apartment: { size: 63, guests: 4 },
  'superior-apartment': { size: 68, guests: 4 },
  villa: { size: 83, guests: 5 },
  'superior-villa': { size: 100, guests: 5 },
};
