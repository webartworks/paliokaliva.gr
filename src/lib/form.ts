// The steps every form endpoint shares: read the request, drop bots, check for spam, limit repeats.
import type { APIContext } from 'astro';
import { locales, type Locale } from '@/i18n';
import { checkContent, checkTrap } from '@/lib/antispam';
import { allowRequest, json } from '@/lib/mail';

export interface Submission {
  body: Record<string, unknown>;
  locale: Locale;
}

// Returns the submitted data, or the response to send back when the request stops here.
export async function readSubmission(context: APIContext): Promise<Submission | Response> {
  const { request } = context;
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

  // Quiet checks against bots: a field people never see, and the signed time token
  // from /api/token (missing, forged, or a form sent faster than a person can fill it).
  // Bot traps get a normal-looking answer; a too fast or too old form gets "spam".
  const trap = await checkTrap(body, visitor(context));
  if (trap === 'silent') return json({ ok: true });
  if (trap === 'reject') return json({ ok: false, error: 'spam' }, 400);

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

// True when what the visitor wrote looks like spam (shared blocklists and rules,
// see src/lib/antispam.ts). Called by each endpoint once its fields are valid.
export async function looksLikeSpam(
  context: APIContext,
  fields: { name: unknown; email: unknown; message: unknown },
): Promise<boolean> {
  const raw = (value: unknown) => (typeof value === 'string' ? value : '');
  const verdict = await checkContent(
    { name: raw(fields.name), email: raw(fields.email), message: raw(fields.message) },
    visitor(context),
  );
  return verdict !== 'ok';
}

// True when this visitor may send another request to the named form.
export function withinLimit(context: APIContext, form: string): boolean {
  return allowRequest(`${form}:${visitor(context)}`);
}

function visitor(context: APIContext): string {
  try {
    return context.clientAddress;
  } catch {
    // Some hosts do not pass the visitor address; all such requests then share one limit.
    return 'unknown';
  }
}

export function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function consented(value: unknown): boolean {
  return value === true || value === 'on';
}
