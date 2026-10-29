// Spam checks for the form endpoints. The same rules as the Web Artworks PHP kit
// (validation.webartworks.gr/kit) used on the other client sites:
// - a signed time token from /api/token, so a form posted straight to the
//   endpoint, or faster than a person can fill it, is caught;
// - names, emails, email domains and message text from the shared blocklists;
// - a few rules for the messages these bots send (links, repeated names, digits
//   in names, text mostly in a script other than Latin or Greek).
// The blocklists fail open: if they cannot be fetched, those checks are skipped.
import { ANTISPAM_SECRET, POSTMARK_SERVER_TOKEN } from 'astro:env/server';

const SITE = 'paliokaliva.gr';
const LIST_URL = 'https://validation.webartworks.gr/';
const LIST_TTL_MS = 6 * 60 * 60_000;
const LIST_RETRY_MS = 5 * 60_000;
const MIN_AGE_S = 4;
const MAX_AGE_S = 3 * 60 * 60;

// Without its own setting, the secret is derived from the Postmark token, so the
// live site needs no extra variable. It only has to stay the same between restarts.
// Web Crypto (built into Node) signs the token.
const encoder = new TextEncoder();
const signingKey = (async () => {
  const secret = ANTISPAM_SECRET
    ? encoder.encode(ANTISPAM_SECRET)
    : await crypto.subtle.digest('SHA-256', encoder.encode(`antispam|${POSTMARK_SERVER_TOKEN ?? 'dev'}`));
  return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
})();

// 'silent': a bot trap. Answer as if the message was sent, so the bot learns nothing.
// 'reject': the content looks like spam. Tell the visitor to call or email instead.
export type SpamVerdict = 'ok' | 'silent' | 'reject';

export async function issueToken(now = Date.now()): Promise<string> {
  const ts = Math.floor(now / 1000);
  return `${ts}.${await sign(ts)}`;
}

// The checks that need no form fields: the hidden field and the time token.
export async function checkTrap(body: Record<string, unknown>, ip: string): Promise<SpamVerdict> {
  if (typeof body.website === 'string' && body.website.trim() !== '') return log('silent', 'honeypot', ip);

  const match = typeof body._ast === 'string' ? /^(\d{9,11})\.([a-f0-9]{64})$/.exec(body._ast) : null;
  if (!match) return log('silent', 'token-missing', ip);
  const ts = Number(match[1]);
  if (!sameText(await sign(ts), match[2])) return log('silent', 'token-forged', ip);
  const age = Math.floor(Date.now() / 1000) - ts;
  if (age < -60) return log('silent', 'token-future', ip);
  if (age < MIN_AGE_S) return log('reject', 'too-fast', ip, `${age}s`);
  if (age > MAX_AGE_S) return log('reject', 'expired', ip, `${age}s`);
  return 'ok';
}

// The checks on what the visitor wrote. Values are the raw strings from the form.
export async function checkContent(fields: { name: string; email: string; message: string }, ip: string): Promise<SpamVerdict> {
  const name = clean(fields.name);
  const email = clean(fields.email).toLowerCase();
  const message = fields.message.trim();

  if (/[\r\n]/.test(fields.name + fields.email)) return log('reject', 'newline', ip);

  const parts = name.toLowerCase().split(' ');
  if (parts.length === 2 && parts[0] === parts[1]) return log('reject', 'name-repeated', ip, name);
  if (/\d/.test(name)) return log('reject', 'name-digits', ip, name);
  if (name !== '' && (await list('spam_names.txt')).includes(name.toLowerCase())) return log('reject', 'name-listed', ip, name);

  if (email !== '') {
    if ((await list('spam_emails.txt')).includes(email)) return log('reject', 'email-listed', ip, email);
    const domain = email.slice(email.lastIndexOf('@') + 1);
    if (domain !== '') {
      if ((await list('spam_domains.txt')).some((d) => domain === d || domain.endsWith(`.${d}`))) {
        return log('reject', 'domain-listed', ip, domain);
      }
      if (!(await receivesMail(domain))) return log('reject', 'domain-no-mx', ip, domain);
    }
  }

  if (message !== '') {
    if (/https?:|www\.|\[url|<\s*a\s|h\s*r\s*e\s*f\s*=/i.test(message)) return log('reject', 'link', ip);
    if (/\b[a-z0-9-]+\.(?:com|net|org|io|is|gd|ly|me|co|cc|ru|su|xyz|top|click|site|online|shop|info|biz|link|live|fun|bar|pro)\/\S/i.test(message)) {
      return log('reject', 'link', ip);
    }
    if (foreignRatio(message) > 0.3) return log('reject', 'script', ip);

    const norm = normalize(message);
    const exact = (await list('spam_messages_exact.txt')).find((p) => norm === normalize(p));
    if (exact) return log('reject', 'message-exact', ip, exact);
    const phrase = (await list('spam_messages.txt')).map(normalize).find((p) => p !== '' && norm.includes(p));
    if (phrase) return log('reject', 'message-phrase', ip, phrase);

    const words = await list('spam_words.txt');
    for (let i = 0; i < words.length; i += 100) {
      // Only syntax characters may be escaped in a unicode pattern ("\-" is an error).
      const alternatives = words.slice(i, i + 100).map((w) => w.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'));
      const found = new RegExp(`(?<![\\p{L}\\p{N}])(${alternatives.join('|')})(?![\\p{L}\\p{N}])`, 'iu').exec(message);
      if (found) return log('reject', 'word', ip, found[1]);
    }
  }

  return 'ok';
}

async function sign(ts: number): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await signingKey, encoder.encode(`${ts}|${SITE}`));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Compares in constant time, so the answer time tells nothing about the signature.
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function log(verdict: SpamVerdict, rule: string, ip: string, detail = ''): SpamVerdict {
  const extra = detail ? ` "${detail.replace(/[\r\n]+/g, ' ').slice(0, 80)}"` : '';
  console.warn(`[antispam] ${SITE} ${verdict} ${rule} ip=${ip}${extra}`);
  return verdict;
}

function clean(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

function normalize(value: string): string {
  return clean(value).toLowerCase().replace(/[ .!?;]+$/, '');
}

// Share of letters that are neither Latin nor Greek.
function foreignRatio(value: string): number {
  const letters = value.match(/\p{L}/gu)?.length ?? 0;
  if (letters === 0) return 0;
  const foreign = value.match(/[^\p{Script=Latin}\p{Script=Greek}\P{L}]/gu)?.length ?? 0;
  return foreign / letters;
}

// False only when DNS answers that the domain has no MX, A or AAAA record. A DNS
// error or timeout counts as true, so a slow resolver never blocks a guest.
// The project has no Node type definitions, so the three lookups used are typed here
// and the module name is passed as a value (TypeScript then does not look it up).
type Lookup = (domain: string) => Promise<unknown[]>;
const dnsModule = 'node:dns/promises';
const dns = import(/* @vite-ignore */ dnsModule) as Promise<{ resolveMx: Lookup; resolve4: Lookup; resolve6: Lookup }>;

async function receivesMail(domain: string): Promise<boolean> {
  const { resolveMx, resolve4, resolve6 } = await dns;
  const lookups = [resolveMx(domain), resolve4(domain), resolve6(domain)].map((lookup) =>
    lookup.then(
      (records): string => (records.length > 0 ? 'yes' : 'no'),
      (error: { code?: string }): string => (error.code === 'ENOTFOUND' || error.code === 'ENODATA' ? 'no' : 'unknown'),
    ),
  );
  const timeout = new Promise<'unknown'>((done) => setTimeout(() => done('unknown'), 3000));
  const answers = await Promise.race([Promise.all(lookups), timeout.then(() => ['unknown'])]);
  return answers.some((answer) => answer !== 'no');
}

// The shared blocklists, kept in memory. A failed fetch keeps the old copy (or an
// empty list) and is tried again after a few minutes.
const lists = new Map<string, { entries: string[]; fetchedAt: number }>();
let listsDownUntil = 0;

async function list(file: string): Promise<string[]> {
  const cached = lists.get(file);
  const now = Date.now();
  if ((cached && now - cached.fetchedAt < LIST_TTL_MS) || now < listsDownUntil) return cached?.entries ?? [];

  try {
    const response = await fetch(LIST_URL + file, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`status ${response.status}`);
    const entries = [...new Set((await response.text()).split(/\r\n|\r|\n/).map((line) => clean(line).toLowerCase()).filter(Boolean))];
    lists.set(file, { entries, fetchedAt: now });
    return entries;
  } catch (error) {
    console.warn(`[antispam] ${SITE} list unavailable: ${file}`, error instanceof Error ? error.message : error);
    listsDownUntil = now + LIST_RETRY_MS;
    return cached?.entries ?? [];
  }
}
