# Garage Sale Website 🏷️

A small, fast, mobile-friendly website announcing a garage sale:

> **Saturday, August 15, 2026 · 8:00 AM – 4:00 PM**
> 55 Bradley Boulevard, Neepawa, Manitoba

It is a plain **HTML + CSS + JavaScript** website — no frameworks, no build step, no server.
That means it works perfectly on **GitHub Pages** (free website hosting from GitHub).

It also comes with ready-to-post **advertisement images** for Facebook, Messenger and printing.

---

## 📁 What's in this project

```text
Garage-Sale/
├── index.html                  ← the whole website (all the text lives here)
├── styles.css                  ← the colours, fonts and layout
├── script.js                   ← countdown, opening celebration, map links, copy button
├── site.webmanifest            ← name + icons when saved to a phone home screen
├── .nojekyll                   ← tells GitHub Pages to serve the files as-is
├── README.md                   ← this file
│
├── assets/
│   ├── garage-sale-ad.svg      ← Facebook / Messenger ad  (square, editable)
│   ├── garage-sale-ad.png      ← Facebook / Messenger ad  (1200 × 1200, post this one)
│   ├── garage-sale-poster.svg  ← printable poster (8.5 × 11 in, editable)
│   ├── garage-sale-poster.png  ← printable poster (2550 × 3300, 300 dpi — print this one)
│   ├── garage-sale-qr.png      ← QR code (printed on the poster)
│   ├── garage-sale-qr.svg      ← QR code (vector version)
│   ├── og-image.png            ← preview picture shown when the link is shared
│   ├── location-illustration.svg / .png ← "garage sale here" drawing
│   ├── favicon.svg             ← little icon in the browser tab
│   ├── favicon-32.png
│   └── apple-touch-icon.png
│
└── tools/
    ├── build-assets.py         ← re-creates the QR code + all PNG images
    └── set-site-url.py         ← puts your real website address everywhere
```

---

## A. How to test the website on your computer

**The quick way:** open the folder and double-click **`index.html`**. It opens in your browser.
Everything works this way except the *Copy address* button, which some browsers block on
double-clicked files.

**The better way (recommended):** run a tiny local web server. This behaves exactly like
the real website.

1. Open a terminal (Command Prompt / PowerShell on Windows, Terminal on Mac).
2. Move into this project folder:
   ```bash
   cd path/to/Garage-Sale
   ```
   *(Tip: type `cd ` then drag the folder onto the terminal window.)*
3. Start the server:
   ```bash
   python3 -m http.server 8000
   ```
   On Windows you may need `py -m http.server 8000` instead.
4. Open your browser to **http://localhost:8000**
5. Press `Ctrl + C` in the terminal when you're finished.

**To check the phone layout:** in Chrome or Edge press `F12`, then click the little
phone/tablet icon (or press `Ctrl + Shift + M`). You can then pick "iPhone SE",
"Pixel 7", etc. from the dropdown at the top.

### Seeing what the page looks like on sale day

The page has three states — counting down, open, and finished — and it switches between
them by itself. To look at any of them right now, add one of these to the end of the
address:

| Add this to the address | What you'll see |
| --- | --- |
| `?preview=before` | Two days to go — the normal countdown |
| `?preview=open` | Five seconds to go, so you can watch the whole opening: the numbers hit zero, the garage door rolls up, confetti falls, and the card turns into **🎉 GARAGE SALE IS OPEN! 🎉** |
| `?preview=live` | Arriving in the middle of the sale |
| `?preview=ending` | Ten seconds before 4:00 PM, so you can watch it close |
| `?preview=ended` | After the sale — **👋 Thanks for stopping by!** |
| `?at=2026-08-15T07:59:55-05:00` | Pretend it is any exact moment you like |

For example: **http://localhost:8000/?preview=open**

This is only for you. A plain visit to the website — with nothing after the address —
always uses the real clock, so nobody sees these unless they type one in on purpose.
If you'd rather it didn't exist at all, delete the `previewOffset` function in
`script.js` and the one line that calls it (search for `previewOffset`).

The opening celebration plays **once per visit**. If someone refreshes the page during
the sale they just see "GARAGE SALE IS OPEN!" without the animation replaying. To watch
it again while testing, open a new tab (or close and reopen the browser).

Anyone whose phone or computer is set to "reduce motion" gets the same information with
the door already open, no confetti and no movement.

---

## B. How to create the GitHub repository

1. Go to **https://github.com** and sign in (create a free account if you don't have one).
2. Click the **+** in the top-right corner → **New repository**.
3. Fill in:
   * **Repository name:** `garage-sale`
   * **Description:** *(optional)* "Garage sale announcement website"
   * Choose **Public** — this is required for free GitHub Pages.
   * Do **not** tick "Add a README file" (you already have one).
4. Click **Create repository**.

Leave that page open — you'll need it in the next step.

---

## C. How to upload the website

### Option 1 — Drag and drop (easiest, no Git needed)

1. On your new empty repository page, click **uploading an existing file**
   (the link in the middle of the page).
2. Open your `Garage-Sale` folder on your computer.
3. Select **everything inside it** (`index.html`, `styles.css`, `script.js`,
   `site.webmanifest`, `README.md`, and the `assets` folder) and drag it all onto the
   GitHub page.
4. Wait for the uploads to finish.
5. In the **Commit changes** box at the bottom type `Add garage sale website` and click
   **Commit changes**.

> ⚠️ **One file is invisible in the drag-and-drop method** because its name starts with a
> dot: `.nojekyll`. That's fine — the website works without it.

### Option 2 — With Git (if you've installed it)

In a terminal, inside the project folder:

```bash
git init
git add .
git commit -m "Add garage sale website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/garage-sale.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username. Git will ask you to sign in
the first time.

---

## D. How to enable GitHub Pages

1. In your repository, click the **Settings** tab (top of the page).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment → Source**, choose:
   * **Deploy from a branch**
4. Under **Branch**, choose **`main`** and the folder **`/ (root)`**, then click **Save**.
5. Wait about 1–2 minutes, then refresh the page. A green banner appears at the top with
   your website address.

> **This project uses "Deploy from a branch".** GitHub serves the files in the repository
> exactly as they are — there is no build step and no GitHub Actions workflow to go wrong.
> Every time you push (or upload) a change, the live site updates within a minute or two.
>
> There is also a "GitHub Actions" source option. It produces the identical website but
> adds a moving part that can fail, so this project doesn't use it.

---

## E. What your final website link will look like

```text
https://YOUR-USERNAME.github.io/garage-sale/
```

For example, if your GitHub username is `albertj`, your link is:

```text
https://albertj.github.io/garage-sale/
```

That is the link you send to people. 🎉

### ⭐ Important final step — tell the website its own address

Two things need the real link: the **social media preview picture** and the **QR code**.

**If you have Python on your computer**, this does it all in one command:

```bash
python3 tools/set-site-url.py https://YOUR-USERNAME.github.io/garage-sale/
```

*(One-time setup for that script: `pip3 install --break-system-packages segno cairosvg`)*

**If you don't have Python**, do it by hand — it's just a find-and-replace:

1. Open `index.html` in a text editor (Notepad works).
2. Use **Edit → Replace** to change every `YOUR-USERNAME` to your real GitHub username.
3. Do the same in `script.js` (there's one, near the top) and `site.webmanifest`.
4. For the QR code, go to any free QR generator website, paste your link, download the
   PNG, rename it to `garage-sale-qr.png` and put it in the `assets` folder.
5. Upload the changed files to GitHub again (drag and drop, replacing the old ones).

---

## F. How to change the garage-sale information later

All the wording is in **`index.html`**. Open it in a text editor and edit the text
between the tags. You don't need to understand the tags — just change the words.

| What you want to change | Where to look |
| --- | --- |
| Big "GARAGE SALE!" heading | `index.html` → search for `hero__title` |
| Date, time, address at the top | `index.html` → search for `hero__facts` |
| The four information cards | `index.html` → search for `<ul class="cards">` |
| "What You'll Find" paragraph | `index.html` → search for `class="pitch"` |
| The item categories (the coloured pills) | `index.html` → search for `id="category-list"` |
| The helpful notes (cash, bags) | `index.html` → search for `<ul class="notes">` |
| **The countdown date/time** | `script.js` → `startISO` and `endISO` at the very top |
| The wording on sale day ("GARAGE SALE IS OPEN!", "Thanks for stopping by!") | `script.js` → `messageLive`, `subLive`, `messageOver`, `subOver` |
| The "look for us in the driveway" note | `index.html` → search for `open-note` |
| The address used by the map buttons | `script.js` → `address`, `latitude`, `longitude` |
| Google/Facebook preview text | `index.html` → the `<meta ...>` lines near the top |

### Adding a new item category

Find this in `index.html`:

```html
<ul class="chips" id="category-list">
  <li class="chip"><span aria-hidden="true">🏡</span> Household items</li>
```

Copy one `<li>` line, paste it underneath, and change the emoji and the words:

```html
  <li class="chip"><span aria-hidden="true">📚</span> Books &amp; games</li>
```

### Changing the date

If you move the sale to a different day, change **two** things:

1. The visible text in `index.html` (there are a few spots — use Find for `August 15`).
2. The countdown in `script.js`:
   ```js
   startISO: '2026-08-15T08:00:00-05:00',   // year-month-day T hour:minute:second
   endISO:   '2026-08-15T16:00:00-05:00',   // 16:00 = 4:00 PM
   ```
   Keep the `-05:00` on the end — that's Manitoba summer time, and it makes the countdown
   correct for visitors in every time zone. (In winter, Manitoba is `-06:00`.)

---

## G. How to replace or add images later

All pictures live in the **`assets`** folder.

**To swap a picture for your own photo:**

1. Put your photo in the `assets` folder, e.g. `assets/my-photo.jpg`.
2. In `index.html`, find the `<img ...>` line you want to change and update the `src`:
   ```html
   <img src="assets/my-photo.jpg" alt="Tables of items in the driveway" ...>
   ```
3. Always update the `alt="..."` text too — it describes the picture for people using
   screen readers, and it shows if the image fails to load.

**Tips:**

* File names are **case-sensitive** on GitHub Pages. `Photo.JPG` and `photo.jpg` are
  different files. Stick to lowercase names with no spaces.
* Keep photos under about 300 KB so the page stays fast. Most phones let you "resize
  when sharing"; 1200 pixels wide is plenty.
* To edit the **advertisement** itself, open `assets/garage-sale-ad.svg` in a free editor
  such as [Inkscape](https://inkscape.org) or [Boxy SVG](https://boxy-svg.com), or just
  open the `.svg` file in a text editor and change the words — the text is right there in
  plain English.
* After editing any `.svg`, re-create the `.png` versions with:
  ```bash
  python3 tools/build-assets.py
  ```

---

## 📣 Using the advertisement images

| File | Use it for |
| --- | --- |
| `assets/garage-sale-ad.png` | Facebook posts, Messenger, Instagram, texting. Square 1200 × 1200 — looks right everywhere. |
| `assets/garage-sale-poster.png` | Printing. It's letter size (8.5 × 11 in) at 300 dpi, with the QR code on it. |
| `assets/og-image.png` | Used automatically for the link preview — you don't need to touch it. |
| `assets/garage-sale-qr.png` | The QR code on its own, if you want it on a hand-made sign. It is already built into the poster. |

**To post on Facebook:** open `assets/garage-sale-ad.png`, save it to your phone or
computer, then attach it to your post and paste the website link in the text.

**To print the poster:** open `assets/garage-sale-poster.png`, print at
**100% / Actual size** on letter paper. Remember to regenerate the QR code first
(section E) so it points at your real website.

---

## ♿ Accessibility & performance notes

* Semantic HTML with a proper heading order, skip link, and visible keyboard focus rings.
* All colours meet WCAG AA contrast; buttons are at least 48 px tall for easy tapping.
* Animations are switched off automatically for anyone using "reduce motion" — including
  the garage door and the confetti, which are skipped entirely while the page still shows
  the correct "open" or "ended" message.
* The confetti is about 40 lines of plain JavaScript drawing on one `<canvas>`, which
  deletes itself after four seconds. No library, nothing left running afterwards.
* No frameworks and no web fonts — the whole page is well under 100 KB of code, plus a
  lazy-loaded map that only loads when you scroll to it.
* The map is OpenStreetMap's official embed, which is free to use and correctly credited.

---

## ❓ Troubleshooting

| Problem | Fix |
| --- | --- |
| Website shows a 404 page | Wait 2 minutes and refresh. Make sure `index.html` is at the **top level** of the repository, not inside another folder. |
| Styling is missing | Check that `styles.css` uploaded, and that the name is lowercase. |
| Images don't appear | Check the `assets` folder uploaded and file names match exactly, including capitals. |
| Facebook preview shows the wrong thing | Do section **E**, then paste your link into <https://developers.facebook.com/tools/debug/> and click *Scrape Again*. |
| Countdown says the wrong thing | Check `startISO` / `endISO` in `script.js`. |
| The garage door / confetti didn't play again | That's on purpose — it plays once per visit. Open a new tab to see it again, or use `?preview=open` (section **A**). |
| QR code goes to the wrong page | Re-run `python3 tools/set-site-url.py <your link>`. |
