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

  // --- THE "ADD TO CALENDAR" BUTTON -------------------------------------
  // What the sale is called once it lands in someone's own calendar.
  eventTitle:   'Garage Sale — 55 Bradley Boulevard',
  eventDetails: 'Garage sale at 55 Bradley Boulevard, Neepawa, MB. 8:00 AM – 4:00 PM, one day only. Cash is easiest — small bills if you can.',

  // --- THE MAP ------------------------------------------------------------
  // How much ground the map shows, top to bottom, in metres. Bigger number
  // = more of the neighbourhood, smaller = closer in on the house.
  mapHeightMetres: 420
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

    $$('#directions-hero, #directions-map, #directions-final, #directions-nav, #directions-live').forEach(function (a) {
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
    const livebar     = $('#livebar');
    const livebarTime = $('#livebar-time');
    const dayBox      = $('#dayprogress');
    const dayFill     = $('#dayprogress-fill');
    const dayLabel    = $('#dayprogress-label');
    const partyBtn    = $('#party-btn');
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
      if (dayBox) dayBox.hidden = !open;
      if (partyBtn) partyBtn.hidden = !open;
      showLivebar(livebar, open);
      document.body.classList.toggle('sale-open', open);
      setBadge(s.name);
      if (open) startBalloons(); else stopBalloons();

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
        playOpeningCurtain();               // the full-screen "WE'RE OPEN!"
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

      if (isOpen(s.name)) {
        // Still open. Show how much of today is left, in the banner at the
        // top and as a bar under the countdown, and keep ticking so the
        // page closes itself at 4 PM.
        const day  = days[s.index];
        const left = Math.max(0, day.end - now);
        const done = Math.min(1, Math.max(0, (now - day.start) / (day.end - day.start)));
        const hrs  = Math.floor(left / 3600000);
        const mns  = Math.floor(left / 60000) % 60;
        const words = hrs > 0 ? hrs + 'h ' + pad(mns) + 'm' : mns + ' min';

        if (livebarTime) livebarTime.textContent = 'Closes in ' + words;
        if (dayFill)  dayFill.style.width = (done * 100).toFixed(1) + '%';
        if (dayLabel) dayLabel.textContent = words + ' left today';
        return true;
      }

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
     3c. THE REST OF THE SALE-DAY CELEBRATION
     The confetti above is the noisy part. These three are the quieter ones:
     the green "we're open" banner at the top of the page, a screenful of
     "WE'RE OPEN!" the moment the clock reaches 8:00 AM, and balloons that
     keep drifting up the screen all day.
     --------------------------------------------------------------------- */

  /* Shows or hides the banner. It sits above the sticky navigation, so its
     height has to be handed to the stylesheet — that is what pushes the
     navigation bar (and anchor links) down out of the way. */
  function showLivebar(bar, open) {
    if (!bar) return;
    bar.hidden = !open;
    const write = function () {
      document.documentElement.style.setProperty(
        '--livebar-h', open ? bar.offsetHeight + 'px' : '0px');
    };
    write();
    if (open && !bar._watching) {
      bar._watching = true;
      window.addEventListener('resize', write, { passive: true });
    }
  }

  /* One screenful of celebration, then it takes itself away again. */
  function playOpeningCurtain() {
    const el = $('#opening');
    if (!el || prefersReducedMotion) return;

    el.hidden = false;
    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () {
        el.hidden = true;
        el.classList.remove('is-leaving');
      }, 750);
    }, 2600);
  }

  /* Balloons. One every few seconds while the sale is on; each one removes
     itself when it reaches the top, so they never pile up. */
  let balloonTimer = null;
  const BALLOON_EMOJI = ['🎈', '🎈', '🎈', '🎉', '🛍️'];

  function releaseBalloon() {
    // A hidden tab keeps firing timers on some browsers; there is no point
    // animating anything nobody is looking at.
    if (document.hidden) return;
    const el = document.createElement('span');
    el.className = 'balloon';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = BALLOON_EMOJI[Math.floor(Math.random() * BALLOON_EMOJI.length)];
    el.style.setProperty('--bx',     (4 + Math.random() * 92) + '%');
    el.style.setProperty('--bs',     (1.7 + Math.random() * 1.6).toFixed(2) + 'rem');
    el.style.setProperty('--bd',     (8 + Math.random() * 7).toFixed(1) + 's');
    el.style.setProperty('--bdrift', (-70 + Math.random() * 140).toFixed(0) + 'px');
    document.body.appendChild(el);
    el.addEventListener('animationend', function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function startBalloons() {
    if (balloonTimer || prefersReducedMotion) return;
    releaseBalloon();
    balloonTimer = setInterval(releaseBalloon, 2600);
  }

  function stopBalloons() {
    clearInterval(balloonTimer);
    balloonTimer = null;
  }

  /* The floating "Celebrate" button, and a confetti burst for anyone who
     taps the page while the sale is on. */
  function initParty() {
    const btn = $('#party-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        dropConfetti('small');
        btn.animate
          ? btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
                        { duration: 380, easing: 'cubic-bezier(.2,1.3,.4,1)' })
          : null;
      });
    }

    // Tapping the big hero headline during the sale throws confetti too.
    const title = $('#hero-title');
    if (title) {
      title.addEventListener('click', function () {
        if (document.body.classList.contains('sale-open')) dropConfetti('small');
      });
    }
  }

  /* ---------------------------------------------------------------------
     3d. PREVIEW MODE — FOR TESTING ONLY
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
     7. THE MAP
     The embedded map draws itself to fit whatever size the frame is at the
     moment it loads. If the frame is still settling — web fonts landing,
     images arriving, the page reflowing — it can end up drawing a small map
     inside a big empty box. Two things fix that here:

       * the address is only handed to the map AFTER the frame has been
         measured, so it never loads at the wrong size;
       * the piece of ground it is asked to show is worked out from the
         frame's own width-to-height ratio, so the map fills the frame
         instead of being letterboxed inside it;
       * and if the frame changes shape (turning a phone sideways, dragging
         a window wider) the map is asked again, once things settle.
     --------------------------------------------------------------------- */
  function initMap() {
    const frame = $('#map-frame');
    const embed = $('#map-embed');
    if (!frame || !embed) return;

    const lat = SITE_CONFIG.latitude;
    const lon = SITE_CONFIG.longitude;

    /* A rectangle around the house, in degrees, shaped like the frame. */
    function boxFor(width, height) {
      const metres = SITE_CONFIG.mapHeightMetres || 420;
      const ratio  = (width > 0 && height > 0) ? (width / height) : 1.5;

      // 111320 m is one degree of latitude. A degree of longitude is shorter
      // the further north you go, hence the cosine — without it the map comes
      // out stretched sideways this far north.
      const halfLat = (metres / 2) / 111320;
      const halfLon = halfLat * ratio / Math.cos(lat * Math.PI / 180);

      return [(lon - halfLon).toFixed(6), (lat - halfLat).toFixed(6),
              (lon + halfLon).toFixed(6), (lat + halfLat).toFixed(6)].join(',');
    }

    let lastKey = '';

    function load() {
      const rect = frame.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 40) return;      // not laid out yet

      // Round the size before comparing, so a one-pixel wobble during
      // scrolling never reloads the map.
      const key = Math.round(rect.width / 20) + 'x' + Math.round(rect.height / 20);
      if (key === lastKey) return;
      lastKey = key;

      embed.src = 'https://www.openstreetmap.org/export/embed.html' +
                  '?bbox=' + encodeURIComponent(boxFor(rect.width, rect.height)) +
                  '&layer=mapnik' +
                  '&marker=' + lat + '%2C' + lon;
    }

    // Wait for the browser to finish laying the page out before measuring.
    requestAnimationFrame(function () { requestAnimationFrame(load); });
    window.addEventListener('load', load);

    // Re-fit when the frame changes shape, but only once it has stopped.
    let settle;
    const later = function () { clearTimeout(settle); settle = setTimeout(load, 350); };
    if ('ResizeObserver' in window) new ResizeObserver(later).observe(frame);
    else window.addEventListener('resize', later, { passive: true });

    // The pane over the map keeps a swipe scrolling the page. One tap lifts it.
    const shield = $('#map-shield');
    if (shield) {
      shield.addEventListener('click', function () {
        frame.classList.add('is-live');
        shield.setAttribute('tabindex', '-1');
      });
    }

    // "Full screen" opens the same spot on openstreetmap.org.
    const expand = $('#map-expand');
    if (expand) {
      expand.href = 'https://www.openstreetmap.org/?mlat=' + lat + '&mlon=' + lon +
                    '#map=17/' + lat + '/' + lon;
    }
  }

  /* ---------------------------------------------------------------------
     7b. "ADD TO CALENDAR"
     Writes a standard .ics calendar file in the browser and hands it over
     as a download. Apple Calendar, Google Calendar, Outlook and the phone
     calendar apps all understand it, so there is nothing to sign in to.
     --------------------------------------------------------------------- */
  function icsStamp(ms) {
    // Calendar files want UTC, written as 20260822T130000Z.
    return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function buildIcs() {
    const day = (SITE_CONFIG.days || [])[0];
    if (!day) return null;
    const start = new Date(day.startISO).getTime();
    const end   = new Date(day.endISO).getTime();
    if (isNaN(start) || isNaN(end)) return null;

    // Long lines have to be wrapped at 75 characters, and commas escaped.
    const esc = function (t) { return String(t).replace(/([,;\\])/g, '\\$1'); };

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Garage Sale//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + start + '@garage-sale',
      'DTSTAMP:' + icsStamp(Date.now()),
      'DTSTART:' + icsStamp(start),
      'DTEND:'   + icsStamp(end),
      'SUMMARY:' + esc(SITE_CONFIG.eventTitle),
      'DESCRIPTION:' + esc(SITE_CONFIG.eventDetails + ' ' + SITE_CONFIG.siteUrl),
      'LOCATION:' + esc(SITE_CONFIG.address),
      'URL:' + SITE_CONFIG.siteUrl,
      'GEO:' + SITE_CONFIG.latitude + ';' + SITE_CONFIG.longitude,
      // A reminder the evening before, so it isn't forgotten.
      'BEGIN:VALARM',
      'TRIGGER:-PT14H',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + esc(SITE_CONFIG.eventTitle) + ' is tomorrow',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  function initCalendar() {
    const btn = $('#add-calendar');
    if (!btn) return;

    btn.addEventListener('click', function () {
      const text = buildIcs();
      if (!text) { toast('Sorry — the calendar file could not be made.'); return; }

      const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = 'garage-sale.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Give the download a moment to start before the file is thrown away.
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);

      toast('Saved to your calendar app 📅');
    });
  }

  /* ---------------------------------------------------------------------
     7c. THE DETAIL CARDS LEAN TOWARDS THE POINTER
     Mouse and trackpad only — on a touch screen there is no pointer to
     follow, and the cards would only ever be tilted by accident.
     --------------------------------------------------------------------- */
  function initCardTilt() {
    if (prefersReducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top)  / r.height;
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        card.style.setProperty('--tilt-y', ((x - 0.5) *  7).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-x', ((y - 0.5) * -7).toFixed(2) + 'deg');
        card.classList.add('is-tilting');
      }, { passive: true });

      card.addEventListener('pointerleave', function () {
        card.classList.remove('is-tilting');
        card.style.removeProperty('--tilt-x');
        card.style.removeProperty('--tilt-y');
      });
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
    initMap();
    initCalendar();
    initCardTilt();
    initParty();
    initReveal();
    initActiveNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
