// Receives the Meraki table request form.
// Sends one email to the hotel (Reply-To: the guest) and one confirmation of receipt
// to the guest (Reply-To: the hotel).
import type { APIRoute } from 'astro';
import { MAIL_TO } from 'astro:env/server';
import { locales, t, type Locale } from '@/i18n';
import { allowRequest, isEmail, json, MailNotConfiguredError, oneLine, sendMail } from '@/lib/mail';

export const prerender = false;

const MAX_GUESTS = 20;

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}

export const POST: APIRoute = async ({ request, clientAddress, url }) => {
  // Only accept requests sent from the site's own pages.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== url.host) return json({ ok: false, error: 'server' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'validation', fields: [] }, 400);
  }

  const locale: Locale = locales.includes(body.locale as Locale) ? (body.locale as Locale) : 'en';
  const r = t(locale).reservation;

  // Two quiet checks against bots: a field people never see, and a form sent
  // faster than a person can fill it. Both get a normal-looking answer.
  const startedAt = Number(body.startedAt);
  const tooFast = Number.isFinite(startedAt) && Date.now() - startedAt < 3000;
  if (text(body.website, 200) !== '' || tooFast) return json({ ok: true });

  const data = {
    name: oneLine(text(body.name, 100)),
    email: text(body.email, 254).toLowerCase(),
    phone: oneLine(text(body.phone, 40)),
    date: text(body.date, 10),
    time: text(body.time, 5),
    guests: Number.parseInt(text(String(body.guests ?? ''), 3), 10),
    notes: text(body.notes, 1500),
  };

  // One day of slack, so a guest in another time zone can still ask for "today".
  const earliest = new Date(Date.now() - 24 * 60 * 60_000).toISOString().slice(0, 10);
  const invalid: string[] = [];
  if (data.name.length < 2) invalid.push('name');
  if (!isEmail(data.email)) invalid.push('email');
  if (!/^[+\d][\d\s().-]{5,}$/.test(data.phone)) invalid.push('phone');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || Number.isNaN(Date.parse(data.date)) || data.date < earliest) {
    invalid.push('date');
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) invalid.push('time');
  if (!Number.isInteger(data.guests) || data.guests < 1 || data.guests > MAX_GUESTS) invalid.push('guests');
  if (body.consent !== true && body.consent !== 'on') invalid.push('consent');
  if (invalid.length > 0) return json({ ok: false, error: 'validation', fields: invalid }, 400);

  let visitor = 'unknown';
  try {
    visitor = clientAddress;
  } catch {
    // Some hosts do not pass the visitor address; all such requests then share one limit.
  }
  if (!allowRequest(`reservation:${visitor}`)) return json({ ok: false, error: 'rate' }, 429);

  const guests = String(data.guests);
  const details = [
    `Date:    ${data.date}`,
    `Time:    ${data.time}`,
    `Guests:  ${guests}`,
    `Name:    ${data.name}`,
    `Email:   ${data.email}`,
    `Phone:   ${data.phone}`,
    `Language of the guest: ${locale === 'el' ? 'Greek' : 'English'}`,
  ].join('\n');

  try {
    await sendMail({
      to: MAIL_TO,
      replyTo: data.email,
      subject: `Meraki table request: ${data.date} ${data.time}, ${guests} guests, ${data.name}`,
      text: `New table request for Meraki Restaurant, sent from the website.\n\n${details}\n\nNotes:\n${data.notes || '-'}\n\nReply to this email to answer the guest directly.`,
      tag: 'meraki-reservation',
    });
  } catch (error) {
    console.error('[reservation] email to the hotel failed:', error);
    return json({ ok: false, error: error instanceof MailNotConfiguredError ? 'config' : 'server' }, 500);
  }

  // The guest's copy repeats only the booking details, never their free text,
  // so the form cannot be used to send someone else an arbitrary message.
  try {
    await sendMail({
      to: data.email,
      replyTo: MAIL_TO,
      subject: r.email.subject,
      text: fill(r.email.body, { name: data.name, date: data.date, time: data.time, guests }),
      tag: 'meraki-reservation-receipt',
    });
  } catch (error) {
    // The hotel already has the request, so the guest still sees the success message.
    console.error('[reservation] confirmation to the guest failed:', error);
  }

  return json({ ok: true });
};
