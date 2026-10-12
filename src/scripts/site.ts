// Small behaviours shared by every page: scroll reveals, header state, mobile menu,
// booking bar, photo strip, photo viewer, forms, cookie notice, mobile dock and the offer card. No animation library.

declare global {
  interface Window {
    __paliokaliva?: boolean;
  }
}

window.__paliokaliva = true;

function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );

  items.forEach((el) => observer.observe(el));
}

function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initMenu() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const label = document.querySelector<HTMLElement>('[data-menu-label]');
  if (!header || !toggle || !menu) return;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    if (label) label.textContent = (open ? label.dataset.close : label.dataset.open) ?? '';

    if (open) {
      menu.hidden = false;
      // Wait one frame so the fade-in transition runs.
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    } else {
      menu.classList.remove('is-open');
      window.setTimeout(() => {
        if (toggle.getAttribute('aria-expanded') === 'false') menu.hidden = true;
      }, 500);
    }
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

  menu.addEventListener(
    'click',
    (event) => {
      if ((event.target as HTMLElement).closest('a')) setOpen(false);
    },
  );

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    },
  );

  // The full-screen menu only exists below the desktop breakpoint.
  window.matchMedia('(min-width: 72em)').addEventListener(
    'change',
    (event) => {
      if (event.matches) setOpen(false);
    },
  );
}

function toISODate(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function initBooking() {
  document.querySelectorAll<HTMLFormElement>('[data-booking]').forEach((form) => {
    const checkin = form.querySelector<HTMLInputElement>('[data-checkin]');
    const checkout = form.querySelector<HTMLInputElement>('[data-checkout]');

    if (checkin && checkout) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      checkin.min = toISODate(today);
      checkout.min = toISODate(tomorrow);

      checkin.addEventListener(
        'change',
        () => {
          if (!checkin.value) return;
          const next = new Date(`${checkin.value}T12:00:00`);
          next.setDate(next.getDate() + 1);
          checkout.min = toISODate(next);
          if (!checkout.value || checkout.value <= checkin.value) checkout.value = toISODate(next);
        },
      );
    }

    form.querySelectorAll<HTMLElement>('[data-stepper]').forEach((stepper) => {
      const input = stepper.querySelector<HTMLInputElement>('input');
      if (!input) return;
      stepper.addEventListener(
        'click',
        (event) => {
          const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-step]');
          if (!button) return;
          const value = Number(input.value) + Number(button.dataset.step);
          input.value = String(Math.min(Number(input.max), Math.max(Number(input.min), value)));
        },
      );
    });
  });
}

function initStrip() {
  document.querySelectorAll<HTMLElement>('[data-strip]').forEach((strip) => {
    const track = strip.querySelector<HTMLElement>('[data-strip-track]');
    const bar = strip.querySelector<HTMLElement>('[data-strip-bar]');
    if (!track) return;

    const update = () => {
      const progress = (track.scrollLeft + track.clientWidth) / track.scrollWidth;
      bar?.style.setProperty('--progress', String(Math.min(1, progress)));
    };
    // Start in the middle, so photos run off both edges of the screen.
    track.scrollLeft = (track.scrollWidth - track.clientWidth) / 2;
    update();
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    // Drag with the mouse; touch screens already scroll the row natively.
    let startX = 0;
    let startScroll = 0;
    let dragging = false;

    track.addEventListener(
      'pointerdown',
      (event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        dragging = true;
        startX = event.clientX;
        startScroll = track.scrollLeft;
        track.classList.add('is-dragging');
        track.setPointerCapture(event.pointerId);
      },
    );

    track.addEventListener(
      'pointermove',
      (event) => {
        if (dragging) track.scrollLeft = startScroll - (event.clientX - startX);
      },
    );

    const stop = () => {
      dragging = false;
      track.classList.remove('is-dragging');
    };
    track.addEventListener('pointerup', stop);
    track.addEventListener('pointercancel', stop);
  });
}

function initDock() {
  const dock = document.querySelector<HTMLElement>('[data-dock]');
  if (!dock) return;

  const update = () => dock.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initOffer() {
  const card = document.querySelector<HTMLElement>('[data-offer]');
  if (!card) return;

  const key = `offer-closed:${card.dataset.offer}`;
  const today = toISODate(new Date());
  const inDates = (!card.dataset.from || today >= card.dataset.from) && (!card.dataset.until || today <= card.dataset.until);

  let closed = false;
  try {
    closed = sessionStorage.getItem(key) === '1';
  } catch {
    // Storage can be blocked; the card then simply shows on every page.
  }
  if (!inDates || closed) return;

  // The card waits until the visitor has scrolled a little, so it never covers
  // the booking bar on the opening photo.
  const show = () => {
    if (window.scrollY < window.innerHeight * 0.4) return;
    window.removeEventListener('scroll', show);
    card.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('is-visible')));
  };
  const start = () =>
    window.setTimeout(() => {
      window.addEventListener('scroll', show, { passive: true });
      show();
    }, 1500);

  // The cookie notice and the offer card share the same corner; the notice goes first.
  if (document.querySelector('[data-consent]:not([hidden])')) {
    document.addEventListener('consent:decided', start, { once: true });
  } else {
    start();
  }

  card.querySelector('[data-offer-close]')?.addEventListener(
    'click',
    () => {
      card.classList.remove('is-visible');
      window.setTimeout(() => (card.hidden = true), 900);
      try {
        sessionStorage.setItem(key, '1');
      } catch {
        // See above.
      }
    },
  );
}

function initLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
  const all = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-lightbox]'));
  const image = dialog?.querySelector<HTMLImageElement>('[data-lightbox-image]');
  const count = dialog?.querySelector<HTMLElement>('[data-lightbox-count]');
  if (!dialog || !image || all.length === 0 || typeof dialog.showModal !== 'function') return;

  // Photos hidden by a filter are skipped.
  let links = all;
  let current = 0;

  const show = (index: number) => {
    current = (index + links.length) % links.length;
    const link = links[current];
    image.classList.add('is-loading');
    image.onload = () => image.classList.remove('is-loading');
    image.src = link.href;
    image.alt = link.dataset.alt ?? '';
    if (count) {
      count.textContent = (dialog.dataset.counter ?? '{n} / {total}')
        .replace('{n}', String(current + 1))
        .replace('{total}', String(links.length));
    }
  };

  all.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      links = all.filter((item) => !item.closest('[hidden]'));
      show(links.indexOf(link));
      dialog.showModal();
    });
  });

  dialog.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => show(current - 1));
  dialog.querySelector('[data-lightbox-next]')?.addEventListener('click', () => show(current + 1));
  dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });

  // A click on the dark area around the photo closes the viewer.
  dialog.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target === dialog || target.tagName === 'FIGURE') dialog.close();
  });

  // Swipe left or right on touch screens.
  let touchX = 0;
  dialog.addEventListener('touchstart', (event) => (touchX = event.touches[0].clientX), { passive: true });
  dialog.addEventListener(
    'touchend',
    (event) => {
      const moved = event.changedTouches[0].clientX - touchX;
      if (Math.abs(moved) > 50) show(current + (moved < 0 ? 1 : -1));
    },
    { passive: true },
  );

  // Put the focus back on the photo the visitor was looking at.
  dialog.addEventListener('close', () => links[current]?.focus());
}

function initGalleryFilter() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  const items = document.querySelectorAll<HTMLElement>('[data-gallery] [data-group]');
  if (buttons.length === 0) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.dataset.filter ?? '';
      buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      items.forEach((item) => {
        item.hidden = group !== '' && item.dataset.group !== group;
      });
    });
  });
}

function initForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-ajax-form]').forEach((form) => {
    const status = form.querySelector<HTMLElement>('[data-form-status]');
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const success = document.querySelector<HTMLElement>(`[data-form-success="${form.id}"]`);
    const started = form.querySelector<HTMLInputElement>('input[name="startedAt"]');
    if (started) started.value = String(Date.now());

    // Requests for a past date make no sense.
    form.querySelectorAll<HTMLInputElement>('input[type="date"][data-min-today]').forEach((input) => {
      input.min = toISODate(new Date());
    });

    const label = button?.textContent ?? '';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
      if (status) status.textContent = '';
      if (button) {
        button.disabled = true;
        button.textContent = button.dataset.sending ?? label;
      }

      const data: Record<string, unknown> = Object.fromEntries(new FormData(form));
      data.consent = form.querySelector<HTMLInputElement>('input[name="consent"]')?.checked ?? false;

      let result: { ok: boolean; error?: string; fields?: string[] } = { ok: false, error: 'server' };
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        result = await response.json();
      } catch {
        // Network problem or an unreadable answer: handled as a general error below.
      }

      if (result.ok && success) {
        form.hidden = true;
        success.hidden = false;
        success.focus();
        return;
      }

      result.fields?.forEach((name) => {
        form.querySelector(`[name="${name}"]`)?.setAttribute('aria-invalid', 'true');
      });
      if (status) {
        const key = result.error === 'validation' || result.error === 'rate' ? result.error : 'server';
        status.textContent = status.dataset[key] ?? '';
      }
      if (button) {
        button.disabled = false;
        button.textContent = label;
      }
    });
  });
}

function initMap() {
  // The Google map is only loaded when the visitor asks for it.
  document.querySelectorAll<HTMLElement>('[data-map]').forEach((frame) => {
    frame.querySelector('[data-map-show]')?.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = frame.dataset.src ?? '';
      iframe.title = frame.dataset.title ?? '';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      frame.replaceChildren(iframe);
    });
  });
}

const CONSENT_KEY = 'cookie-consent';
const CONSENT_DAYS = 180;

function readConsent(): 'all' | 'necessary' | null {
  try {
    const saved = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? 'null') as { choice?: string; at?: number } | null;
    if (!saved || typeof saved.at !== 'number') return null;
    if (Date.now() - saved.at > CONSENT_DAYS * 24 * 60 * 60_000) return null;
    return saved.choice === 'all' || saved.choice === 'necessary' ? saved.choice : null;
  } catch {
    return null;
  }
}

function initConsent() {
  const notice = document.querySelector<HTMLElement>('[data-consent]');
  if (!notice) return;

  const loadOptional = () => {
    const src = notice.dataset.script;
    if (!src || document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.body.append(script);
  };

  const open = () => {
    notice.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => notice.classList.add('is-visible')));
  };

  const decide = (choice: 'all' | 'necessary') => {
    const before = readConsent();
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, at: Date.now() }));
    } catch {
      // Storage can be blocked; the choice then only lasts for this page.
    }
    notice.classList.remove('is-visible');
    window.setTimeout(() => (notice.hidden = true), 600);
    document.dispatchEvent(new CustomEvent('consent:decided'));

    if (choice === 'all') loadOptional();
    // A script that is already running cannot be unloaded, so withdrawing consent reloads the page.
    else if (before === 'all') window.location.reload();
  };

  notice.querySelector('[data-consent-accept]')?.addEventListener('click', () => decide('all'));
  notice.querySelector('[data-consent-decline]')?.addEventListener('click', () => decide('necessary'));
  document.querySelectorAll('[data-consent-open]').forEach((button) => button.addEventListener('click', open));

  const choice = readConsent();
  if (choice === 'all') loadOptional();
  // Shown at once (not animated in) so everything that waits for it can see it.
  if (choice === null) {
    notice.hidden = false;
    notice.classList.add('is-visible');
  }
}

function init() {
  document.documentElement.classList.add('js');
  // First, because the offer card checks whether the cookie notice is showing.
  initConsent();
  initReveal();
  initHeader();
  initMenu();
  initBooking();
  initStrip();
  initDock();
  initOffer();
  initLightbox();
  initForms();
  initMap();
  initGalleryFilter();
}

init();

export {};
