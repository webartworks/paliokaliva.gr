// The steps every form endpoint shares: read the request, drop bots, limit repeats.
import type { APIContext } from 'astro';
import { locales, type Locale } from '@/i18n';
import { allowRequest, json } from '@/lib/mail';

export interface Submission {
  body: Record<string, unknown>;
  locale: Locale;
}

// Returns the submitted data, or the response to send back when the request stops here.
export async function readSubmission({ request }: APIContext): Promise<Submission | Response> {
  // Only accept requests sent from the site's own pages. The address is read from the
  // Host header: behind the Coolify proxy, Astro's own `url` says "localhost".
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host')?.split(',')[0].trim() || request.headers.get('host');
  if (origin && originHost(origin) !== host) return json({ ok: false, error: 'server' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'validation', fields: [] }, 400);
  }

  // Two quiet checks against bots: a field people never see, and a form sent
  // faster than a person can fill it. Both get a normal-looking answer.
  const startedAt = Number(body.startedAt);
  const tooFast = Number.isFinite(startedAt) && Date.now() - startedAt < 3000;
  if (text(body.website, 200) !== '' || tooFast) return json({ ok: true });

  const locale: Locale = locales.includes(body.locale as Locale) ? (body.locale as Locale) : 'en';
  return { body, locale };
}

function originHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

// True when this visitor may send another request to the named form.
export function withinLimit(context: APIContext, form: string): boolean {
  let visitor = 'unknown';
  try {
    visitor = context.clientAddress;
  } catch {
    // Some hosts do not pass the visitor address; all such requests then share one limit.
  }
  return allowRequest(`${form}:${visitor}`);
}

export function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function consented(value: unknown): boolean {
  return value === true || value === 'on';
}
