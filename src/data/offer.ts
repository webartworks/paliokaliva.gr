import type { Locale } from '@/i18n';

// The small offer card in the bottom left corner.
// To run an offer: set `active` to true, fill in the texts and the dates.
// Change `id` for every new offer, so visitors who closed an older one see it again.
export const offer = {
  active: true,
  id: 'offer-2027-early-booking',
  from: '2026-10-01',
  until: '2027-02-28',
  // Leave empty to send visitors to the booking engine home page.
  url: '',
  text: {
    en: {
      title: 'Early booking',
      body: 'Book your summer stay before the end of February and save 10%.',
      cta: 'Book this offer',
    },
    el: {
      title: 'Έγκαιρη κράτηση',
      body: 'Κλείστε τις καλοκαιρινές σας διακοπές έως το τέλος Φεβρουαρίου με έκπτωση 10%.',
      cta: 'Κράτηση προσφοράς',
    },
  } satisfies Record<Locale, { title: string; body: string; cta: string }>,
};
