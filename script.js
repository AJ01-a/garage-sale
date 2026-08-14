/* =========================================================================
   GARAGE SALE — script.js
   Plain JavaScript. No libraries, nothing to install.

   >>> IF YOU ONLY WANT TO CHANGE THE SALE INFO, EDIT THE BLOCK BELOW. <<<
   Everything else on this page updates itself from these values.
   ========================================================================= */

const SITE_CONFIG = {
  // --- WHEN ---------------------------------------------------------------
  // Written in "ISO" format: YYYY-MM-DDTHH:MM:SS followed by the time-zone
  // offset. "-05:00" is Manitoba summer time (CDT). In winter use "-06:00".
  // Because the offset is included, the countdown is correct for a visitor
  // in ANY time zone in the world.
  startISO: '2026-08-15T08:00:00-05:00',
  endISO:   '2026-08-15T16:00:00-05:00',

  // --- WHERE --------------------------------------------------------------
  address:     '55 Bradley Boulevard, Neepawa, MB, Canada',
  latitude:    50.2383757,
  longitude:   -99.4602787,

  // --- THIS WEBSITE'S ADDRESS --------------------------------------------
  // Used by tools/build-assets.py to generate the QR code printed on the
  // poster, and by the link-preview tags in index.html. If the address ever
  // changes, run:  python3 tools/set-site-url.py <new-url>
  siteUrl: 'https://aj01-a.github.io/garage-sale/',

  // --- MESSAGES -----------------------------------------------------------
  labelBefore: 'Sale starts in',
  labelLive:   'Happening right now',
  labelOver:   'That’s a wrap',
  messageLive: 'THE GARAGE SALE IS OPEN!',
  messageOver: 'THANK YOU FOR STOPPING BY!'
};

/* ========================================================================= */
/* From here down is the machinery. You shouldn't need to change it.         */
/* ========================================================================= */

(function () {
  'use strict';

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));

  /* ---------------------------------------------------------------------
     1. MAP + DIRECTIONS LINKS
     Built from SITE_CONFIG.address so there's only one place to edit.
     --------------------------------------------------------------------- */
  function buildMapLinks() {
    const q = encodeURIComponent(SITE_CONFIG.address);
    const lat = SITE_CONFIG.latitude;
    const lon = SITE_CONFIG.longitude;

    const directions = 'https://www.google.com/maps/dir/?api=1&destination=' + q;
    const satellite  = 'https://www.google.com/maps/@' + lat + ',' + lon + ',18z/data=!3m1!1e3';
    const apple      = 'https://maps.apple.com/?q=' + q + '&ll=' + lat + ',' + lon;

    $$('#directions-hero, #directions-map, #directions-final').forEach(function (a) {
      a.href = directions;
    });
    if ($('#link-satellite')) $('#link-satellite').href = satellite;
    if ($('#link-apple'))     $('#link-apple').href = apple;

    const copyBtn = $('#copy-address');
    if (copyBtn) copyBtn.dataset.copy = SITE_CONFIG.address;
  }

  /* ---------------------------------------------------------------------
     2. COUNTDOWN
     Three states: before the sale, during the sale, after the sale.
     --------------------------------------------------------------------- */
  function initCountdown() {
    const box    = $('#countdown');
    const grid   = $('#countdown-grid');
    const label  = $('#countdown-label');
    const status = $('#countdown-status');
    const sr     = $('#countdown-sr');
    if (!box || !grid) return;

    const start = new Date(SITE_CONFIG.startISO).getTime();
    const end   = new Date(SITE_CONFIG.endISO).getTime();

    // If the dates are typed wrong, fail quietly instead of showing "NaN".
    if (isNaN(start) || isNaN(end)) {
      grid.hidden = true;
      label.textContent = 'Saturday, August 15, 2026';
      return;
    }

    const els = {
      days:  $('#cd-days'),
      hours: $('#cd-hours'),
      mins:  $('#cd-mins'),
      secs:  $('#cd-secs')
    };

    const pad = (n) => String(n).padStart(2, '0');
    let lastSrMinute = -1;

    function showMessage(cssClass, labelText, messageText) {
      grid.hidden = true;
      status.hidden = false;
      box.classList.add(cssClass);
      label.textContent = labelText;
      status.textContent = messageText;
      if (sr) sr.textContent = messageText;
    }

    function tick() {
      const now = Date.now();

      if (now >= end) {
        showMessage('countdown--over', SITE_CONFIG.labelOver, SITE_CONFIG.messageOver);
        return false;                       // stop the timer
      }
      if (now >= start) {
        showMessage('countdown--live', SITE_CONFIG.labelLive, SITE_CONFIG.messageLive);
        return true;                        // keep ticking so it closes at 4 PM
      }

      let remaining = Math.floor((start - now) / 1000);
      const days    = Math.floor(remaining / 86400); remaining -= days * 86400;
      const hours   = Math.floor(remaining / 3600);  remaining -= hours * 3600;
      const mins    = Math.floor(remaining / 60);
      const secs    = remaining - mins * 60;

      els.days.textContent  = String(days);
      els.hours.textContent = pad(hours);
      els.mins.textContent  = pad(mins);
      els.secs.textContent  = pad(secs);

      // Announce to screen readers once a minute, not 60 times a minute.
      if (sr && mins !== lastSrMinute) {
        lastSrMinute = mins;
        sr.textContent = days + ' days, ' + hours + ' hours and ' + mins +
                         ' minutes until the garage sale starts.';
      }
      return true;
    }

    if (tick()) {
      const timer = setInterval(function () {
        if (!tick()) clearInterval(timer);
      }, 1000);
    }
  }

  /* ---------------------------------------------------------------------
     3. "COPY ADDRESS" BUTTON
     --------------------------------------------------------------------- */
  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    // Force a reflow so the CSS transition runs every time.
    void el.offsetWidth;
    el.classList.add('toast--visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove('toast--visible');
      setTimeout(function () { el.hidden = true; }, 250);
    }, 2200);
  }

  function copyText(text, successMessage) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(function () { toast(successMessage); })
        .catch(function () { legacyCopy(text, successMessage); });
    } else {
      legacyCopy(text, successMessage);
    }
  }

  function legacyCopy(text, successMessage) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    toast(ok ? successMessage : text);
  }

  function initCopyAddress() {
    const copyAddress = $('#copy-address');
    if (!copyAddress) return;
    copyAddress.addEventListener('click', function () {
      copyText(copyAddress.dataset.copy || SITE_CONFIG.address, 'Address copied!');
    });
  }

  /* ---------------------------------------------------------------------
     4. FADE-IN ON SCROLL + ACTIVE NAV LINK
     --------------------------------------------------------------------- */
  function initReveal() {
    const items = $$('.reveal');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  function initActiveNav() {
    const links = $$('.nav__links a');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const map = {};
    const sections = [];
    links.forEach(function (link) {
      const id = link.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      if (section) { map[id] = link; sections.push(section); }
    });

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          const active = map[entry.target.id];
          if (active) active.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------------------------------------------------------------------
     5. START EVERYTHING
     --------------------------------------------------------------------- */
  function init() {
    buildMapLinks();
    initCountdown();
    initCopyAddress();
    initReveal();
    initActiveNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
