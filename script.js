/* =========================================================================
   GARAGE SALE — script.js
   Plain JavaScript. No libraries, nothing to install.

   >>> IF YOU ONLY WANT TO CHANGE THE SALE INFO, EDIT THE BLOCK BELOW. <<<
   Everything else on this page updates itself from these values.
   ========================================================================= */

const SITE_CONFIG = {
  // --- WHEN ---------------------------------------------------------------
  // One entry per day of the sale, earliest first. Add or remove a day by
  // adding or removing a line — the countdown, the "back tomorrow" message
  // and the finish all follow along by themselves.
  //
  // Written in "ISO" format: YYYY-MM-DDTHH:MM:SS followed by the time-zone
  // offset. "-05:00" is Manitoba summer time (CDT). In winter use "-06:00".
  // Because the offset is included, the countdown is correct for a visitor
  // in ANY time zone in the world.
  days: [
    { startISO: '2026-08-22T08:00:00-05:00', endISO: '2026-08-22T16:00:00-05:00' }   // Saturday
  ],

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
  // If you change the dates above, change the wording in `subNext` too —
  // that's the only message with a date written into it. (It is only used
  // if the sale runs over more than one day.)
  labelBefore:  'Sale starts in',
  labelLive:    'Happening right now',
  labelNext:    'Tomorrow’s sale starts in',
  labelOver:    'That’s a wrap',

  messageLive:  '🎉 THE SALE IS ON! 🎉',            // first day
  subLive:      'Today · 8:00 AM – 4:00 PM. Come on by and take a look!',

  messageAgain: '🛍️ THE SALE IS ON! 🛍️',           // any day after the first
  subAgain:     'We’re open again — come on by and take a look!',

  messageNext:  '🎉 BACK TOMORROW! 🎉',              // overnight, between days
  subNext:      'We’re continuing the garage sale tomorrow, 8:00 AM to 4:00 PM.',

  messageOver:  '👋 The sale has ended',             // after the very last day
  subOver:      'Thanks so much to everyone who stopped by!',

  // The little pill at the top of the page
  badgeBefore:  'Starting soon',
  badgeNext:    'Back tomorrow',
  badgeLive:    'Sale is live',
  badgeOver:    'Sale ended',

  // The fun "reveal a surprise" button. Add or change as many as you like.
  surprises: [
    'Something you didn’t know you needed 👀',
    'A hidden gem 💎',
    'Something nostalgic 📼',
    'A genuinely great deal 💰',
    'A mystery item 🎁',
    'Something for the workshop 🔧',
    'A completely unexpected find 🤔',
    'The perfect thing for that empty shelf 🪴',
    'A book you’ll actually read 📚',
    'Something you’ll argue about with a friend 😄'
  ]
};

/* ========================================================================= */
/* From here down is the machinery. You shouldn't need to change it.         */
/* ========================================================================= */

(function () {
  'use strict';

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = motionQuery.matches;
  // Someone can flip the setting while the page is open.
  const onMotionChange = function (e) { prefersReducedMotion = e.matches; };
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
  else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);

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

    $$('#directions-hero, #directions-map, #directions-final, #directions-nav').forEach(function (a) {
      a.href = directions;
    });
    if ($('#link-satellite')) $('#link-satellite').href = satellite;
    if ($('#link-apple'))     $('#link-apple').href = apple;

    const copyBtn = $('#copy-address');
    if (copyBtn) copyBtn.dataset.copy = SITE_CONFIG.address;
  }

  /* ---------------------------------------------------------------------
     2. ROLLING DIGITS
     Each digit is a two-cell strip inside a window one line tall. To change
     it, the strip slides up by exactly one cell; when it lands, both cells
     are set to the new value and the strip snaps back invisibly, ready for
     the next change. Only digits that actually changed ever move.
     --------------------------------------------------------------------- */
  const ROLL_MS = 420;

  function makeDigit(ch) {
    const digit = document.createElement('span');
    digit.className = 'digit';
    const track = document.createElement('span');
    track.className = 'digit__track';
    const now  = document.createElement('span');
    const next = document.createElement('span');
    now.className = next.className = 'digit__cell';
    now.textContent = next.textContent = ch;
    track.appendChild(now);
    track.appendChild(next);
    digit.appendChild(track);
    digit._track = track;
    digit._now = now;
    digit._next = next;
    digit._value = ch;
    return digit;
  }

  function setDigit(digit, ch) {
    if (digit._value === ch) return;
    digit._value = ch;

    if (prefersReducedMotion) {
      digit._now.textContent = digit._next.textContent = ch;
      return;
    }

    digit._next.textContent = ch;
    digit._track.classList.remove('is-rolling');
    void digit._track.offsetWidth;          // restart the animation
    digit._track.classList.add('is-rolling');

    clearTimeout(digit._timer);
    digit._timer = setTimeout(function () {
      digit._now.textContent = digit._next.textContent = digit._value;
      digit._track.classList.remove('is-rolling');
    }, ROLL_MS + 20);
  }

  /* Draws `text` into `el`, reusing the digit strips already there. */
  function setNumber(el, text) {
    if (!el) return;
    if (el._text === text) return;
    let digits = el._digits;

    if (!digits || digits.length !== text.length) {
      el.textContent = '';
      digits = el._digits = [];
      for (let i = 0; i < text.length; i++) {
        const d = makeDigit(text.charAt(i));
        digits.push(d);
        el.appendChild(d);
      }
    } else {
      for (let i = 0; i < text.length; i++) setDigit(digits[i], text.charAt(i));
    }
    el._text = text;
  }

  /* ---------------------------------------------------------------------
     3. COUNTDOWN + OPENING CELEBRATION
     There are three states for a one-day sale:

       before   counting down to the morning
       live     open
       over     finished

     (Two extra states, `next` and `again`, take care of a sale that runs
     over more than one day — add a second line to `days` and they switch
     themselves on.)

     TIME ZONES: every startISO / endISO carries Manitoba's UTC offset, so
     they are exact points in time. Comparing them against Date.now()
     (which is UTC underneath, whatever the visitor's clock is set to)
     gives the right answer from any country.
     --------------------------------------------------------------------- */
  function initCountdown() {
    const box    = $('#countdown');
    const grid   = $('#countdown-grid');
    const label  = $('#countdown-label');
    const status = $('#countdown-status');
    const sub    = $('#countdown-sub');
    const next   = $('#countdown-next');
    const sr     = $('#countdown-sr');
    const garage = $('#garage');
    const note   = $('#open-note');
    const badge  = $('#status-badge');
    const badgeText = $('#status-text');
    if (!box || !grid || !label || !status || !sub || !next) return;

    const days = (SITE_CONFIG.days || []).map(function (day) {
      return { start: new Date(day.startISO).getTime(), end: new Date(day.endISO).getTime() };
    });

    // If the dates are missing or typed wrong, fail quietly instead of
    // showing "NaN".
    const broken = !days.length || days.some(function (d) {
      return isNaN(d.start) || isNaN(d.end) || d.end <= d.start;
    });
    if (broken) {
      grid.hidden = true;
      label.textContent = 'Saturday, August 22, 2026 · 8:00 AM – 4:00 PM';
      return;
    }

    // Normally this is just Date.now(). It is only shifted when the page is
    // opened with a ?preview= or ?at= address — see previewOffset() below.
    const offset = previewOffset(days);
    const clock  = function () { return Date.now() + offset; };

    const els = {
      days:  $('#cd-days'),
      hours: $('#cd-hours'),
      mins:  $('#cd-mins'),
      secs:  $('#cd-secs')
    };

    const pad = (n) => String(n).padStart(2, '0');
    let lastSrMinute = -1;
    let state = { name: null, index: 0 };

    /* Which state are we in, and which day does it refer to? */
    function stateAt(now) {
      for (let i = 0; i < days.length; i++) {
        if (now < days[i].start) return { name: i === 0 ? 'before' : 'next', index: i };
        if (now < days[i].end)   return { name: i === 0 ? 'live'   : 'again', index: i };
      }
      return { name: 'over', index: days.length - 1 };
    }

    const isOpen    = (name) => name === 'live' || name === 'again';
    const isWaiting = (name) => name === 'before' || name === 'next';

    function setBadge(name) {
      if (!badge || !badgeText) return;
      if (isOpen(name))        { badge.dataset.state = 'live';   badgeText.textContent = SITE_CONFIG.badgeLive; }
      else if (name === 'over'){ badge.dataset.state = 'over';   badgeText.textContent = SITE_CONFIG.badgeOver; }
      else if (name === 'next'){ badge.dataset.state = 'before'; badgeText.textContent = SITE_CONFIG.badgeNext; }
      else                     { badge.dataset.state = 'before'; badgeText.textContent = SITE_CONFIG.badgeBefore; }
    }

    // Paints one state. Safe to call at any time — it always clears the
    // others first, so states can never stack up.
    function applyState(s) {
      box.classList.remove('countdown--live', 'countdown--over', 'countdown--next', 'countdown--zero');

      const open    = isOpen(s.name);
      const waiting = isWaiting(s.name);

      grid.hidden   = !waiting;
      label.hidden  = s.name === 'next';    // the "tomorrow" line takes its place
      next.hidden   = s.name !== 'next';
      status.hidden = s.name === 'before';
      sub.hidden    = s.name === 'before';
      grid.classList.toggle('countdown__grid--hms', s.name === 'next');
      if (note)   note.hidden = !open;
      if (garage) garage.classList.toggle('is-open', open);
      document.body.classList.toggle('sale-open', open);
      setBadge(s.name);

      if (s.name === 'before') {
        label.textContent = SITE_CONFIG.labelBefore;
        return;
      }
      if (open) {
        const first = s.name === 'live';
        box.classList.add('countdown--live');
        label.textContent  = SITE_CONFIG.labelLive;
        status.textContent = first ? SITE_CONFIG.messageLive : SITE_CONFIG.messageAgain;
        sub.textContent    = first ? SITE_CONFIG.subLive     : SITE_CONFIG.subAgain;
        if (sr) sr.textContent = 'The garage sale is open. ' + sub.textContent;
        return;
      }
      if (s.name === 'next') {
        box.classList.add('countdown--next');
        next.textContent   = SITE_CONFIG.labelNext;
        status.textContent = SITE_CONFIG.messageNext;
        sub.textContent    = SITE_CONFIG.subNext;
        if (sr) sr.textContent = 'Back tomorrow. ' + SITE_CONFIG.subNext;
        return;
      }
      box.classList.add('countdown--over');
      label.textContent  = SITE_CONFIG.labelOver;
      status.textContent = SITE_CONFIG.messageOver;
      sub.textContent    = SITE_CONFIG.subOver;
      if (sr) sr.textContent = 'The garage sale has ended. ' + SITE_CONFIG.subOver;
    }

    /* The opening celebration, at most once per day per browser tab.
       "big"   — first morning: the numbers pop, the door rolls up, confetti.
       "small" — a later morning: the door rolls up and a short burst, since
                 it is a continuation rather than the big opening.
       `state` is already set by the caller, so the one-second timer running
       underneath never starts it a second time. */
    function celebrate(s, size) {
      rememberCelebrated(s.index);

      if (prefersReducedMotion) {           // no animation, same information
        applyState(s);
        return;
      }

      if (size === 'small') {
        applyState(s);
        setTimeout(function () { dropConfetti('small'); }, 750);
        return;
      }

      setNumber(els.days,  '0');
      setNumber(els.hours, '00');
      setNumber(els.mins,  '00');
      setNumber(els.secs,  '00');
      box.classList.add('countdown--zero');

      setTimeout(function () {
        applyState(s);                      // also removes countdown--zero
        setTimeout(function () { dropConfetti('big'); }, 900);   // door is most of the way up
      }, 650);
    }

    function tick() {
      const now = clock();
      const s   = stateAt(now);

      if (s.name !== state.name || s.index !== state.index) {
        const was       = state.name;
        const firstLoad = was === null;
        state = s;                          // set first: celebrate() relies on it

        // Only the change from "waiting" to "open" is worth celebrating —
        // and on a fresh page load, only if this tab hasn't already.
        const opening = isOpen(s.name) &&
                        (isWaiting(was) || (firstLoad && !hasCelebrated(s.index)));

        if (opening) celebrate(s, s.name === 'live' ? 'big' : 'small');
        else applyState(s);
      }

      if (s.name === 'over') return false;  // finished — stop the timer
      if (isOpen(s.name)) return true;      // keep ticking so it closes on time

      // Counting down to days[s.index]. During an overnight wait the days
      // box is hidden, so those hours are rolled into the hours box.
      const hideDays = s.name === 'next';
      let remaining  = Math.max(0, Math.floor((days[s.index].start - now) / 1000));
      const dayCount = hideDays ? 0 : Math.floor(remaining / 86400);
      remaining -= dayCount * 86400;
      const hours    = Math.floor(remaining / 3600);  remaining -= hours * 3600;
      const mins     = Math.floor(remaining / 60);
      const secs     = remaining - mins * 60;

      setNumber(els.days,  String(dayCount));
      setNumber(els.hours, pad(hours));
      setNumber(els.mins,  pad(mins));
      setNumber(els.secs,  pad(secs));

      // Announce to screen readers once a minute, not 60 times a minute.
      if (sr && mins !== lastSrMinute) {
        lastSrMinute = mins;
        sr.textContent = (hideDays ? '' : dayCount + ' days, ') + hours + ' hours and ' +
                         mins + ' minutes until the garage sale ' +
                         (s.name === 'next' ? 'opens again.' : 'starts.');
      }
      return true;
    }

    if (tick()) {
      const timer = setInterval(function () {
        if (!tick()) clearInterval(timer);
      }, 1000);
    }
  }

  /* Remembers, for this browser tab only, which day's celebration has
     already played, so refreshing during the sale doesn't replay it.
     Private-mode browsers can throw when storage is touched, hence the
     try/catch. */
  function celebratedKey(index) {
    const day = (SITE_CONFIG.days || [])[index];
    return 'garage-sale-opened:' + (day ? day.startISO : index);
  }
  function hasCelebrated(index) {
    try { return sessionStorage.getItem(celebratedKey(index)) === '1'; }
    catch (e) { return false; }
  }
  function rememberCelebrated(index) {
    try { sessionStorage.setItem(celebratedKey(index), '1'); } catch (e) { /* ignore */ }
  }

  /* ---------------------------------------------------------------------
     3b. CONFETTI
     One <canvas>, a few dozen paper rectangles, then it deletes itself.
     No library, nothing left running afterwards.
     --------------------------------------------------------------------- */
  function dropConfetti(size) {
    if (prefersReducedMotion) return;
    const small = size === 'small';

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
    const colours = ['#F0562B', '#FFB627', '#0E7C7B', '#2F7D4F', '#FFE9B8', '#FFFFFF'];
    const full    = w < 480 ? 70 : 120;
    const count   = small ? Math.round(full * 0.45) : full;    // gentler on day two
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

    const LIFE = small ? 2600 : 4200, FADE = 1000;
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
     3c. PREVIEW MODE — FOR TESTING ONLY
     Off unless you deliberately put ?preview=... on the end of the address,
     so the live website is never affected. Delete this function (and the
     one line that calls it) if you'd rather it not exist at all.

       ?preview=before    two days to go
       ?preview=open      five seconds to go — watch the whole celebration
       ?preview=live      mid-sale
       ?preview=closing   ten seconds before the 4:00 PM finish
       ?preview=ended     after the sale
       ?at=2026-08-22T07:59:55-05:00   pretend it is this exact moment

     If the sale is ever given a second day, three more turn up by
     themselves: ?preview=tonight, ?preview=nextday and ?preview=live2.
     --------------------------------------------------------------------- */
  function previewOffset(days) {
    let params;
    try { params = new URLSearchParams(window.location.search); }
    catch (e) { return 0; }

    const at = params.get('at');
    if (at) {
      const moment = new Date(at).getTime();
      if (!isNaN(moment)) return moment - Date.now();
    }

    const first = days[0];
    const last  = days[days.length - 1];
    const moments = {
      before:  first.start - 2 * 86400000,
      open:    first.start - 5000,
      live:    first.start + 2 * 3600000,
      closing: first.end - 10000,
      ending:  last.end - 10000,
      ended:   last.end + 3600000
    };
    if (days.length > 1) {
      moments.tonight = first.end + 3 * 3600000;   // overnight, between days
      moments.nextday = last.start - 5000;         // just before the next morning
      moments.live2   = last.start + 2 * 3600000;  // mid-sale on the last day
    }
    const pick = params.get('preview');
    if (pick && moments[pick] != null) return moments[pick] - Date.now();
    return 0;
  }

  /* ---------------------------------------------------------------------
     4. "COPY ADDRESS" BUTTON
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
     5. NAVIGATION — hamburger menu, sticky bar, reading progress
     --------------------------------------------------------------------- */
  function initNav() {
    const header = $('#site-header');
    const toggle = $('#nav-toggle');
    const links  = $('#nav-links');
    if (!header || !toggle || !links) return;

    const desktop = window.matchMedia('(min-width: 820px)');

    function setOpen(open) {
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    const isOpen = function () { return header.classList.contains('is-open'); };

    toggle.addEventListener('click', function () { setOpen(!isOpen()); });

    // Tapping a link jumps to the section, so the menu should get out of the way.
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { setOpen(false); toggle.focus(); }
    });

    document.addEventListener('click', function (e) {
      if (isOpen() && !header.contains(e.target)) setOpen(false);
    });

    // Growing the window past the phone breakpoint shows the full navigation,
    // so the "open" state has to be dropped or the toggle stays out of sync.
    const onBreakpoint = function (e) { if (e.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
    else if (desktop.addListener) desktop.addListener(onBreakpoint);
  }

  function initScrollChrome() {
    const header = $('#site-header');
    const bar    = $('#progress-bar');
    const hero   = document.querySelector('.hero');
    if (!header && !bar) return;

    let ticking = false;

    function update() {
      ticking = false;
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;

      if (header) {
        // Swap to the solid bar just as the dark hero scrolls out from
        // under it, so the text never sits on a background it can't be
        // read against.
        const limit = hero ? Math.max(80, hero.offsetHeight - header.offsetHeight - 24) : 80;
        header.classList.toggle('is-stuck', y > limit);
      }

      if (bar) {
        const doc = document.documentElement;
        const total = (doc.scrollHeight - window.innerHeight) || 1;
        bar.style.width = Math.min(100, Math.max(0, (y / total) * 100)) + '%';
      }
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------------
     6. HERO PARALLAX
     The floating objects lean a little towards the pointer. Skipped
     entirely on touch screens and for anyone who asked for less motion.
     --------------------------------------------------------------------- */
  function initParallax() {
    const wrap = $('#floaters');
    if (!wrap || prefersReducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const items = $$('.floater');
    if (!items.length) return;

    let targetX = 0, targetY = 0, ticking = false;

    function apply() {
      ticking = false;
      items.forEach(function (el) {
        const depth = parseFloat(el.dataset.depth || '12');
        el.style.setProperty('--px', (targetX * depth).toFixed(1) + 'px');
        el.style.setProperty('--py', (targetY * depth).toFixed(1) + 'px');
      });
    }

    document.querySelector('.hero').addEventListener('pointermove', function (e) {
      targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------
     7. THE SURPRISE MACHINE
     Picks a random line, never the same one twice in a row.
     --------------------------------------------------------------------- */
  function initSurprise() {
    const btn = $('#surprise-btn');
    const out = $('#surprise-out');
    if (!btn || !out) return;

    const lines = SITE_CONFIG.surprises || [];
    if (!lines.length) { btn.hidden = true; return; }
    let last = -1;

    btn.addEventListener('click', function () {
      let i = Math.floor(Math.random() * lines.length);
      if (lines.length > 1 && i === last) i = (i + 1) % lines.length;
      last = i;

      out.textContent = lines[i];
      out.classList.remove('is-new');
      void out.offsetWidth;                 // restart the animation
      out.classList.add('is-new');
      btn.textContent = '';
      btn.insertAdjacentHTML('beforeend',
        '<span aria-hidden="true">🎲</span> Try another');
    });
  }

  /* ---------------------------------------------------------------------
     8. FADE-IN ON SCROLL + ACTIVE NAV LINK
     --------------------------------------------------------------------- */
  function initReveal() {
    const items = $$('.reveal');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
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
     9. START EVERYTHING
     --------------------------------------------------------------------- */
  function init() {
    buildMapLinks();
    initCountdown();
    initCopyAddress();
    initNav();
    initScrollChrome();
    initParallax();
    initSurprise();
    initReveal();
    initActiveNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
