// Receives the contact form.
// Sends the message to the hotel (Reply-To: the guest) and a short receipt
// to the guest (Reply-To: the hotel).
import type { APIRoute } from 'astro';
import { MAIL_TO } from 'astro:env/server';
import { t } from '@/i18n';
import { consented, fill, readSubmission, text, withinLimit } from '@/lib/form';
import { isEmail, json, MailNotConfiguredError, oneLine, sendMail } from '@/lib/mail';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const submission = await readSubmission(context);
  if (submission instanceof Response) return submission;
  const { body, locale } = submission;

  const data = {
    name: oneLine(text(body.name, 100)),
    email: text(body.email, 254).toLowerCase(),
    phone: oneLine(text(body.phone, 40)),
    message: text(body.message, 4000),
  };

  const invalid: string[] = [];
  if (data.name.length < 2) invalid.push('name');
  if (!isEmail(data.email)) invalid.push('email');
  // The phone number is optional, but if given it has to look like one.
  if (data.phone !== '' && !/^[+\d][\d\s().-]{5,}$/.test(data.phone)) invalid.push('phone');
  if (data.message.length < 5) invalid.push('message');
  if (!consented(body.consent)) invalid.push('consent');
  if (invalid.length > 0) return json({ ok: false, error: 'validation', fields: invalid }, 400);

  if (!withinLimit(context, 'contact')) return json({ ok: false, error: 'rate' }, 429);

  const details = [
    `Name:    ${data.name}`,
    `Email:   ${data.email}`,
    `Phone:   ${data.phone || '-'}`,
    `Language of the guest: ${locale === 'el' ? 'Greek' : 'English'}`,
  ].join('\n');

  try {
    await sendMail({
      to: MAIL_TO,
      replyTo: data.email,
      subject: `Website message from ${data.name}`,
      text: `New message from the contact form of the website.\n\n${details}\n\nMessage:\n${data.message}\n\nReply to this email to answer the guest directly.`,
      tag: 'contact',
    });
  } catch (error) {
    console.error('[contact] email to the hotel failed:', error);
    return json({ ok: false, error: error instanceof MailNotConfiguredError ? 'config' : 'server' }, 500);
  }

  // The receipt never repeats the guest's own text, so the form cannot be used
  // to send someone else an arbitrary message.
  const receipt = t(locale).contactPage.emailReceipt;
  try {
    await sendMail({
      to: data.email,
      replyTo: MAIL_TO,
      subject: receipt.subject,
      text: fill(receipt.body, { name: data.name }),
      tag: 'contact-receipt',
    });
  } catch (error) {
    // The hotel already has the message, so the guest still sees the success message.
    console.error('[contact] receipt to the guest failed:', error);
  }

  return json({ ok: true });
};
