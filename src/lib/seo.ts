// Structured data (schema.org) that tells search engines what the pages are about.
import { localePath, t, type Locale } from '@/i18n';
import { baseAmenities } from '@/data/rooms';
import { routes, site } from '@/data/site';

const absolute = (path: string) => new URL(path, site.url).href;

const address = {
  '@type': 'PostalAddress',
  streetAddress: 'Tragaki',
  addressLocality: 'Zakynthos',
  addressRegion: 'Ionian Islands',
  postalCode: '29100',
  addressCountry: 'GR',
};

const geo = { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng };

const sameAs = [site.social.instagram, site.social.facebook, site.social.tripadvisor].filter(Boolean);

export function hotelSchema(locale: Locale) {
  const dict = t(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    '@id': `${site.url}/#hotel`,
    name: site.name,
    description: dict.meta.description,
    url: absolute(localePath(locale, routes.home)),
    image: absolute('/og-default.jpg'),
    logo: absolute('/apple-touch-icon.png'),
    telephone: site.phone.href,
    email: site.email,
    address,
    geo,
    hasMap: site.mapsUrl,
    numberOfRooms: 18,
    amenityFeature: baseAmenities.map((key) => ({
      '@type': 'LocationFeatureSpecification',
      name: dict.room.amenities[key],
      value: true,
    })),
    award: dict.villagePage.awards.items.map((award) => `${award.name}: ${award.detail}`),
    sameAs,
  };
}

export function restaurantSchema(locale: Locale) {
  const dict = t(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Meraki Restaurant',
    description: dict.merakiPage.description,
    url: absolute(localePath(locale, routes.meraki)),
    servesCuisine: 'Greek',
    acceptsReservations: true,
    address,
    geo: { '@type': 'GeoCoordinates', latitude: site.meraki.geo.lat, longitude: site.meraki.geo.lng },
  };
}

// The trail from the homepage to the current page, for example Home > Accommodation > Villa.
export function breadcrumbSchema(locale: Locale, trail: { name: string; path: string }[]) {
  const items = [{ name: t(locale).nav.home, path: routes.home }, ...trail];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absolute(localePath(locale, item.path)),
    })),
  };
}
