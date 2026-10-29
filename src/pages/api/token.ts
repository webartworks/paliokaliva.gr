// /api/token/ gives the forms a signed time token (see src/lib/antispam.ts). The form
// script asks for one when the page opens; the endpoints drop requests sent without it.
import type { APIRoute } from 'astro';
import { issueToken } from '@/lib/antispam';

export const prerender = false;

export const GET: APIRoute = async () =>
  new Response(JSON.stringify({ t: await issueToken() }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex',
    },
  });
