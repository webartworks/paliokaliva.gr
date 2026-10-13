// Receives the Meraki table request form.
// Sends one email to the hotel (Reply-To: the guest). The guest gets no email.
import type { APIRoute } from 'astro';
import { MAIL_TO } from 'astro:env/server';
import { consented, readSubmission, text, withinLimit } from '@/lib/form';
import { isEmail, json, MailNotConfiguredError, oneLine, sendMail } from '@/lib/mail';

export const prerender = false;

const MAX_GUESTS = 20;

export const POST: APIRoute = async (context) => {
  const submission = await readSubmission(context);
  if (submission instanceof Response) return submission;
  const { body, locale } = submission;

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
  if (!consented(body.consent)) invalid.push('consent');
  if (invalid.length > 0) return json({ ok: false, error: 'validation', fields: invalid }, 400);

  if (!withinLimit(context, 'reservation')) return json({ ok: false, error: 'rate' }, 429);

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
    });
  } catch (error) {
    console.error('[reservation] email to the hotel failed:', error);
    return json({ ok: false, error: error instanceof MailNotConfiguredError ? 'config' : 'server' }, 500);
  }

  return json({ ok: true });
};
