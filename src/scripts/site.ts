// Small behaviours shared by every page: scroll reveals, header state, mobile menu,
// booking bar, photo strip, mobile dock and the offer card. No animation library.

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
  window.setTimeout(() => {
    window.addEventListener('scroll', show, { passive: true });
    show();
  }, 1500);

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

function init() {
  document.documentElement.classList.add('js');
  initReveal();
  initHeader();
  initMenu();
  initBooking();
  initStrip();
  initDock();
  initOffer();
}

init();

export {};
