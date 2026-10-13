// ------------------------------------------------------------
// Site settings
// ------------------------------------------------------------
const BOOKING_EMAIL = 'salvadopi@gmail.com';

// Booking form: create a free form at https://formspree.io (send to the address above)
// and paste its endpoint here, e.g. 'https://formspree.io/f/abcdwxyz'.
const BOOKING_ENDPOINT = '';

// Mailing list: paste a Formspree endpoint, or your mailing list provider's form URL.
const NEWSLETTER_ENDPOINT = '';

// While an endpoint is empty, that form falls back to opening the visitor's email app.

// ------------------------------------------------------------
// Header and navigation
// ------------------------------------------------------------
const header = document.querySelector('.site-header');
const setSolid = () => header.classList.toggle('is-solid', window.scrollY > 24);
setSolid();
window.addEventListener('scroll', setSolid, { passive: true });

const toggle = document.querySelector('.menu-toggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const validEmail = (v) => /^\S+@\S+\.\S+$/.test(v || '');

// Sends form data to a form service. Resolves true on success.
async function submitTo(endpoint, form) {
  const res = await fetch(endpoint, {
    method: 'POST',
    body: new FormData(form),
    headers: { Accept: 'application/json' },
  });
  return res.ok;
}

// ------------------------------------------------------------
// Shows: search-engine event data, built from each event's data attributes
// ------------------------------------------------------------
const eventEls = document.querySelectorAll('[data-date][data-city]');
if (eventEls.length) {
  const events = [...eventEls].map((el) => ({
    '@type': 'ComedyEvent',
    name: el.querySelector('.event-title, h3')?.textContent.trim() || `Patrick Salvado Live: ${el.dataset.city}`,
    startDate: el.dataset.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: el.querySelector('.event-poster img')?.src,
    performer: [
      { '@type': 'Person', name: 'Patrick Salvado Idringi' },
      ...(el.dataset.city === 'Kampala' && el.textContent.includes('Hillary Okello')
        ? [{ '@type': 'Person', name: 'Dr. Hillary Okello' }] : []),
    ],
    location: {
      '@type': 'Place',
      name: el.dataset.venue || el.dataset.city,
      address: { '@type': 'PostalAddress', addressLocality: el.dataset.city, addressCountry: el.dataset.country },
    },
    ...(el.dataset.tickets && {
      offers: { '@type': 'Offer', url: el.dataset.tickets, priceCurrency: 'UGX', availability: 'https://schema.org/InStock' },
    }),
  }));
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': events });
  document.head.appendChild(ld);
}

// ------------------------------------------------------------
// Mailing list
// ------------------------------------------------------------
document.querySelectorAll('.newsletter-form').forEach((form) => {
  const status = form.querySelector('.nl-status');
  const button = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (d._gotcha) return;
    if (!validEmail(d.email)) {
      status.style.color = '#E07A86';
      status.textContent = 'Please enter a valid email address.';
      return;
    }
    status.style.color = '';
    if (NEWSLETTER_ENDPOINT) {
      button.disabled = true;
      status.textContent = 'Subscribing…';
      try {
        if (!(await submitTo(NEWSLETTER_ENDPOINT, form))) throw new Error();
        form.reset();
        status.textContent = "You're on the list. Look out for show news in your inbox.";
      } catch {
        status.style.color = '#E07A86';
        status.textContent = `That didn't go through. Please try again, or email ${BOOKING_EMAIL}.`;
      } finally {
        button.disabled = false;
      }
    } else {
      const body = `Please add me to the mailing list.\n\nEmail: ${d.email}\nNearest city: ${d.city || 'Not given'}`;
      location.href = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent('Mailing list sign-up')}&body=${encodeURIComponent(body)}`;
      status.textContent = 'Your email app should open with the sign-up ready to send.';
    }
  });
});

// ------------------------------------------------------------
// Press page: copy biography buttons
// ------------------------------------------------------------
document.querySelectorAll('.copy-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const target = document.getElementById(btn.dataset.copy);
    const label = btn.textContent;
    try {
      await navigator.clipboard.writeText(target.innerText.trim());
      btn.textContent = 'Copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(target);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      btn.textContent = 'Selected, press Ctrl+C';
    }
    setTimeout(() => { btn.textContent = label; }, 2200);
  });
});

// ------------------------------------------------------------
// Booking form
// ------------------------------------------------------------
const form = document.getElementById('booking-form');
if (form) {
  const status = document.getElementById('form-status');
  const button = form.querySelector('button[type="submit"]');

  // Pre-select the enquiry type when arriving from a link like book.html?type=Corporate
  const preset = new URLSearchParams(location.search).get('type');
  if (preset && [...form.type.options].some((o) => o.value === preset)) form.type.value = preset;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (d._gotcha) return;
    if (!d.name.trim() || !validEmail(d.email)) {
      status.style.color = '#9D2635';
      status.textContent = 'Please add your name and a valid email address so we can reply.';
      return;
    }
    status.style.color = '';

    if (BOOKING_ENDPOINT) {
      button.disabled = true;
      status.textContent = 'Sending…';
      try {
        if (!(await submitTo(BOOKING_ENDPOINT, form))) throw new Error();
        form.reset();
        status.textContent = 'Thank you. Your enquiry has been sent, and the team will reply by email.';
      } catch {
        status.style.color = '#9D2635';
        status.textContent = `Your enquiry didn't send. Please try again, or email ${BOOKING_EMAIL}.`;
      } finally {
        button.disabled = false;
      }
      return;
    }

    const lines = [
      `Name: ${d.name}`,
      `Email: ${d.email}`,
      d.org ? `Organisation: ${d.org}` : null,
      `Enquiry: ${d.type}`,
      `Date: ${d.date || 'TBC'}`,
      `City & venue: ${d.place || 'TBC'}`,
      `Country: ${d.country || 'TBC'}`,
      `Audience size: ${d.audience}`,
      `Budget: ${d.budget}`,
      '',
      d.message,
    ].filter((l) => l !== null);
    location.href = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent(`Booking enquiry: ${d.type}, ${d.country || 'country TBC'}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
    status.textContent = `Your email app should open with the enquiry ready to send. If it doesn't, write to ${BOOKING_EMAIL}.`;
  });
}
