// Sending email through Postmark, plus the small guards shared by the form endpoints.
import { MAIL_FROM, POSTMARK_MESSAGE_STREAM, POSTMARK_SERVER_TOKEN } from 'astro:env/server';
import { site } from '@/data/site';

interface Mail {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  // Shown in the Postmark activity list, for example "meraki-reservation".
  tag: string;
}

export class MailNotConfiguredError extends Error {}

export async function sendMail(mail: Mail): Promise<void> {
  if (!POSTMARK_SERVER_TOKEN) {
    if (import.meta.env.DEV) {
      // No token while developing: show the email in the terminal instead.
      console.log(
        `\n--- email (not sent, no POSTMARK_SERVER_TOKEN) ---\nTo: ${mail.to}\nReply-To: ${mail.replyTo}\nSubject: ${mail.subject}\n\n${mail.text}\n---\n`,
      );
      return;
    }
    throw new MailNotConfiguredError('POSTMARK_SERVER_TOKEN is not set');
  }

  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
    },
    body: JSON.stringify({
      From: `${site.name} <${MAIL_FROM}>`,
      To: mail.to,
      ReplyTo: mail.replyTo,
      Subject: mail.subject,
      TextBody: mail.text,
      Tag: mail.tag,
      MessageStream: POSTMARK_MESSAGE_STREAM,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Postmark answered ${response.status}: ${detail.slice(0, 300)}`);
  }
}

// Keeps a value on one line, so nothing typed in a form can break an email subject.
export function oneLine(value: string): string {
  return value.replace(/[\r\n\t]+/g, ' ').trim();
}

export function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/.test(value);
}

// At most `limit` requests per visitor address inside `windowMs`. Kept in memory,
// which is enough for one small server; it resets when the site restarts.
const hits = new Map<string, number[]>();

export function allowRequest(key: string, limit = 5, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((time) => now - time >= windowMs)) hits.delete(k);
    }
  }
  return true;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
