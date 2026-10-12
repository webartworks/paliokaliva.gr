// The list of pages for search engines, with each page's two language versions linked.
import type { APIRoute } from 'astro';
import { htmlLang, localePath, locales } from '@/i18n';
import { roomSlugs } from '@/data/rooms';
import { routes, site } from '@/data/site';

const paths = [...Object.values(routes), ...roomSlugs.map((slug) => `${routes.accommodation}${slug}/`)];

const absolute = (path: string) => new URL(path, site.url).href;

export const GET: APIRoute = () => {
  const urls = paths.flatMap((path) =>
    locales.map((locale) => {
      const alternates = [
        ...locales.map(
          (l) => `<xhtml:link rel="alternate" hreflang="${htmlLang[l]}" href="${absolute(localePath(l, path))}"/>`,
        ),
        `<xhtml:link rel="alternate" hreflang="x-default" href="${absolute(path)}"/>`,
      ].join('');
      return `<url><loc>${absolute(localePath(locale, path))}</loc>${alternates}</url>`;
    }),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
