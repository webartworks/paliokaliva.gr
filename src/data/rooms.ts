import studioCover from '@/assets/images/room-studio.jpg';
import superiorStudioCover from '@/assets/images/room-superior-studio.jpg';
import apartmentCover from '@/assets/images/room-apartment.jpg';
import superiorApartmentCover from '@/assets/images/room-superior-apartment.jpg';
import villaCover from '@/assets/images/room-villa.jpg';
import superiorVillaCover from '@/assets/images/room-superior-villa.jpg';

export const roomSlugs = [
  'studio',
  'superior-studio',
  'apartment',
  'superior-apartment',
  'villa',
  'superior-villa',
] as const;

export type RoomSlug = (typeof roomSlugs)[number];

// Comforts found in every house, in the order they are listed on the site.
export const baseAmenities = [
  'kitchen',
  'veranda',
  'wifi',
  'ac',
  'tv',
  'safe',
  'phone',
  'housekeeping',
  'cocomat',
  'linen',
  'toiletries',
  'hairdryer',
  'cot',
  'parking',
  'garden',
] as const;

export const extraAmenities = ['nespresso', 'bathrobes'] as const;

export type Amenity = (typeof baseAmenities)[number] | (typeof extraAmenities)[number];

interface RoomFacts {
  // Size in m².
  size: number;
  // Maximum guests, and how many of them can be adults when that is lower.
  guests: number;
  adults?: number;
  extras: (typeof extraAmenities)[number][];
}

// Taken from the previous website; to be confirmed by the owner.
export const roomFacts: Record<RoomSlug, RoomFacts> = {
  studio: { size: 40, guests: 3, adults: 2, extras: [] },
  'superior-studio': { size: 50, guests: 4, adults: 2, extras: [] },
  apartment: { size: 63, guests: 4, extras: ['nespresso'] },
  'superior-apartment': { size: 68, guests: 4, extras: [] },
  villa: { size: 83, guests: 5, extras: ['nespresso'] },
  'superior-villa': { size: 100, guests: 5, adults: 4, extras: ['bathrobes'] },
};

// Portrait photos for the room cards.
export const roomCovers: Record<RoomSlug, ImageMetadata> = {
  studio: studioCover,
  'superior-studio': superiorStudioCover,
  apartment: apartmentCover,
  'superior-apartment': superiorApartmentCover,
  villa: villaCover,
  'superior-villa': superiorVillaCover,
};

export const photoKinds = ['bedroom', 'living', 'kitchen', 'dining', 'bathroom', 'interior', 'detail'] as const;
export type PhotoKind = (typeof photoKinds)[number];

export interface RoomPhoto {
  image: ImageMetadata;
  kind: PhotoKind;
}

// Gallery photos live in src/assets/images/rooms/<room>/ and are named "NN-kind.jpg",
// for example "02-bedroom.jpg". They show in file name order; the first one is also
// the large photo at the top of the room page. To add a photo, drop a file in the folder.
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/rooms/*/*.jpg', { eager: true });

export function roomPhotos(slug: RoomSlug): RoomPhoto[] {
  return Object.keys(files)
    .filter((path) => path.includes(`/rooms/${slug}/`))
    .sort()
    .map((path) => {
      const name = path.split('/').pop()!.replace(/\.jpg$/, '');
      const kind = name.replace(/^\d+-/, '') as PhotoKind;
      return { image: files[path].default, kind: photoKinds.includes(kind) ? kind : 'interior' };
    });
}

export function otherRooms(slug: RoomSlug, count = 3): RoomSlug[] {
  const start = roomSlugs.indexOf(slug);
  return Array.from({ length: count }, (_, i) => roomSlugs[(start + 1 + i) % roomSlugs.length]);
}
