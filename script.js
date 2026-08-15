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
  messageLive: '🎉 GARAGE SALE IS OPEN! 🎉',
  subLive:     'Come on by and take a look!',
  messageOver: '👋 Thanks for stopping by!',
  subOver:     'The garage sale has ended.'
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

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     2. COUNTDOWN + OPENING CELEBRATION
     Three states: before the sale, during the sale, after the sale.

     TIME ZONES: startISO / endISO carry Manitoba's UTC offset, so the two
     moments below are exact points in time. Comparing them against
     Date.now() (which is UTC underneath, whatever the visitor's clock is
     set to) gives the right answer from any country.
     --------------------------------------------------------------------- */
  function initCountdown() {
    const box    = $('#countdown');
    const grid   = $('#countdown-grid');
    const label  = $('#countdown-label');
    const status = $('#countdown-status');
    const sub    = $('#countdown-sub');
    const sr     = $('#countdown-sr');
    const garage = $('#garage');
    const note   = $('#open-note');
    if (!box || !grid || !label || !status || !sub) return;

    const start = new Date(SITE_CONFIG.startISO).getTime();
    const end   = new Date(SITE_CONFIG.endISO).getTime();

    // If the dates are typed wrong, fail quietly instead of showing "NaN".
    if (isNaN(start) || isNaN(end)) {
      grid.hidden = true;
      label.textContent = 'Saturday, August 15, 2026';
      return;
    }

    // Normally this is just Date.now(). It is only shifted when the page is
    // opened with a ?preview= or ?at= address — see previewOffset() below.
    const offset = previewOffset(start, end);
    const clock  = function () { return Date.now() + offset; };

    const els = {
      days:  $('#cd-days'),
      hours: $('#cd-hours'),
      mins:  $('#cd-mins'),
      secs:  $('#cd-secs')
    };

    const pad = (n) => String(n).padStart(2, '0');
    let lastSrMinute = -1;
    let state = null;                       // null | 'before' | 'live' | 'over'

    function stateAt(now) {
      if (now >= end)   return 'over';
      if (now >= start) return 'live';
      return 'before';
    }

    // Paints one of the three states. Safe to call at any time — it always
    // clears the other two first, so states can never stack up.
    function applyState(next) {
      box.classList.remove('countdown--live', 'countdown--over', 'countdown--zero');

      const live = next === 'live';
      grid.hidden   = !(next === 'before');
      status.hidden = next === 'before';
      sub.hidden    = next === 'before';
      if (note)   note.hidden = !live;
      if (garage) garage.classList.toggle('is-open', live);
      document.body.classList.toggle('sale-open', live);

      if (next === 'before') {
        label.textContent = SITE_CONFIG.labelBefore;
        return;
      }
      if (live) {
        box.classList.add('countdown--live');
        label.textContent  = SITE_CONFIG.labelLive;
        status.textContent = SITE_CONFIG.messageLive;
        sub.textContent    = SITE_CONFIG.subLive;
        if (sr) sr.textContent = 'The garage sale is open. ' + SITE_CONFIG.subLive;
      } else {
        box.classList.add('countdown--over');
        label.textContent  = SITE_CONFIG.labelOver;
        status.textContent = SITE_CONFIG.messageOver;
        sub.textContent    = SITE_CONFIG.subOver;
        if (sr) sr.textContent = 'Thanks for stopping by. ' + SITE_CONFIG.subOver;
      }
    }

    /* The opening celebration. Runs at most once per browser tab:
         countdown pops  →  garage door rolls up  →  confetti.
       `state` is already set to 'live' by the caller, so the one-second
       timer that keeps running underneath never starts it a second time. */
    function celebrate() {
      rememberCelebrated();

      if (prefersReducedMotion) {           // no animation, same information
        applyState('live');
        return;
      }

      els.days.textContent  = '0';
      els.hours.textContent = '00';
      els.mins.textContent  = '00';
      els.secs.textContent  = '00';
      box.classList.add('countdown--zero');

      setTimeout(function () {
        applyState('live');                 // also removes countdown--zero
        setTimeout(dropConfetti, 900);      // once the door is most of the way up
      }, 650);
    }

    function tick() {
      const now  = clock();
      const next = stateAt(now);

      if (next !== state) {
        const wasCountingDown = state === 'before';
        const firstLoad       = state === null;
        state = next;                       // set first: celebrate() relies on it

        if (next === 'live' && (wasCountingDown || (firstLoad && !hasCelebrated()))) {
          celebrate();
        } else {
          applyState(next);
        }
      }

      if (next === 'over') return false;    // stop the timer
      if (next === 'live') return true;     // keep ticking so it closes at 4 PM

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

  /* Remembers, for this browser tab only, that the celebration has already
     played, so refreshing during the sale doesn't replay it. Private-mode
     browsers can throw when storage is touched, hence the try/catch. */
  const CELEBRATED_KEY = 'garage-sale-opened:' + SITE_CONFIG.startISO;

  function hasCelebrated() {
    try { return sessionStorage.getItem(CELEBRATED_KEY) === '1'; }
    catch (e) { return false; }
  }
  function rememberCelebrated() {
    try { sessionStorage.setItem(CELEBRATED_KEY, '1'); } catch (e) { /* ignore */ }
  }

  /* ---------------------------------------------------------------------
     2b. CONFETTI
     One <canvas>, a few dozen paper rectangles, then it deletes itself.
     No library, nothing left running afterwards.
     --------------------------------------------------------------------- */
  function dropConfetti() {
    if (prefersReducedMotion) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    document.body.appendChild(canvas);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;

    function resize() {
      w = canvas.clientWidth  || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // The site's own palette, so it looks like it belongs here.
    const colours = ['#E4572E', '#FFC145', '#126E73', '#2F7D4F', '#FFE29A', '#FFFFFF'];
    const count   = w < 480 ? 70 : 120;
    const bits    = [];

    for (let i = 0; i < count; i++) {
      bits.push({
        x: Math.random() * w,
        y: -20 - Math.random() * h * 0.7,     // staggered above the screen
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        vx: -25 + Math.random() * 50,
        vy: 110 + Math.random() * 150,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 7,
        sway: Math.random() * Math.PI * 2,
        colour: colours[Math.floor(Math.random() * colours.length)]
      });
    }

    const LIFE = 4200, FADE = 1000;
    const began = performance.now();
    let last = began, frame = 0;

    function draw(now) {
      const dt   = Math.min((now - last) / 1000, 0.05);   // survives tab switches
      const gone = now - began;
      last = now;

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = gone > LIFE - FADE ? Math.max(0, (LIFE - gone) / FADE) : 1;

      for (let i = 0; i < bits.length; i++) {
        const b = bits[i];
        b.sway += dt * 3;
        b.y += b.vy * dt;
        b.x += (b.vx + Math.sin(b.sway) * 24) * dt;
        b.rot += b.spin * dt;

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.colour;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      }

      if (gone < LIFE) {
        frame = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', resize);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    }
    frame = requestAnimationFrame(draw);
  }

  /* ---------------------------------------------------------------------
     2c. PREVIEW MODE — FOR TESTING ONLY
     Off unless you deliberately put ?preview=... on the end of the address,
     so the live website is never affected. Delete this function (and the
     one line that calls it) if you'd rather it not exist at all.

       ?preview=before   two days to go
       ?preview=open     five seconds to go — watch the whole celebration
       ?preview=live     mid-sale, arriving after it already started
       ?preview=ending   ten seconds before 4 PM
       ?preview=ended    the day after
       ?at=2026-08-15T07:59:55-05:00   pretend it is this exact moment
     --------------------------------------------------------------------- */
  function previewOffset(start, end) {
    let params;
    try { params = new URLSearchParams(window.location.search); }
    catch (e) { return 0; }

    const at = params.get('at');
    if (at) {
      const moment = new Date(at).getTime();
      if (!isNaN(moment)) return moment - Date.now();
    }

    const moments = {
      before: start - 2 * 86400000,
      open:   start - 5000,
      live:   start + 2 * 3600000,
      ending: end - 10000,
      ended:  end + 3600000
    };
    const pick = params.get('preview');
    if (pick && moments[pick] != null) return moments[pick] - Date.now();
    return 0;
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
