# QR & PromptPay (PWA) — v2.1

A single-page app that turns text or links into a QR code and creates **PromptPay** QR codes for receiving money in Thailand. It is responsive on desktop and mobile, installable to the home screen (PWA), and works offline.
There is no build step and no Node installation needed: it is plain HTML / CSS / JS, ready to deploy on GitHub Pages.

## File structure

```
qr-generator-pwa/
├── index.html                  # Main page (SPA)
├── manifest.json               # PWA manifest (app name, icons, colours). Static, so it is English only
├── sw.js                       # Service Worker (caching for offline use, update handling)
├── .nojekyll                   # Tells GitHub Pages not to process the site with Jekyll
├── README.md                   # Project documentation (English)
├── AGENTS.md                   # Engineering standards, constraints, and architecture rules
├── css/
│   └── style.css               # Styles + 10 colour themes (5 light, 5 dark)
├── js/
│   ├── version.js              # The app version (APP_VERSION). Bump it here to release
│   ├── app.js                  # App logic (modes, i18n, PromptPay, QR, download/share, themes, update check)
│   └── vendor/
│       ├── qrcode.js           # qrcode-generator library (MIT), bundled for offline use
│       └── LICENSE-qrcode-generator.txt
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-maskable-512.png   # For Android (adaptive icon)
    └── apple-touch-icon.png    # For iOS
```

> Every path in the project is a **relative path**, so it works both at `https://<user>.github.io/<repo>/` and on a root domain.

## Features

- **Top bar:** hamburger menu at the top **left** (the menu slides in from the left), version button (for example `v2.1`) at the top **right**
- **Two modes** (switch in the menu): **Text** and **PromptPay**
- **Generate** button (themed colour) and **Clear** button (always red). The QR code appears below only after pressing Generate
- **Desktop:** click the QR code to open a small menu with "Download QR Code" (saved as a `.png`)
- **Mobile:** tap (or long-press) the QR code to open a bottom action sheet with "Download" and "Share" (Share is shown when the browser supports the Web Share API)
- **Language: EN / TH.** The first visit follows the browser language (Thai → TH, anything else → EN). The choice is remembered. It covers all text: labels, hints, error messages, theme names, `aria-label`s and `<html lang>`. `manifest.json` is a static file, so the app name there cannot switch language
- **10 colour themes:**
  - Light: Blue, Green, Purple, Orange, Pink
  - Dark: Midnight Blue, Forest Green, Plum, Ember, Charcoal
  - Text and button contrast passes WCAG AA in every theme. The QR code itself is **always black on white**, even in dark themes, so it scans reliably
- **Menu order:** 1. Language, 2. Mode, 3. Themes. Choosing a theme or a mode closes the menu; choosing a language keeps it open so you see the change immediately
- Shortcut: `Ctrl/Cmd + Enter` in the Text box generates the QR code

### Text mode

A large text box that accepts text or a URL (Thai and emoji supported; encoded as UTF-8). Includes an optional "Remember this text" checkbox to save input across sessions.

### PromptPay mode

**Output:** a QR code built the same way as the PHP library [kittinan/php-promptpay-qr](https://github.com/kittinan/php-promptpay-qr) (`src/PromptPay.php`): Thai QR Payment (EMV) payload, PromptPay ID `A000000677010111`, THB (`764`), country `TH`, CRC-16/CCITT. The output was checked against that library's own test values.

**Inputs:**

| Box | What to enter | Rules |
|---|---|---|
| 1. Destination | Phone number (**10** digits), national ID (**13** digits) or e-Wallet ID (**15** digits) | Digits only: anything else is removed while you type or paste (Thai digits are converted). Pasted international `+66` / `66` 11-digit mobile numbers are automatically normalised to standard domestic `0` format. Exactly 10, 13 or 15 digits are accepted. The detected type is shown under the box. A 10-digit phone number must start with `0`, because the library replaces only a leading `0` with `66` (`0891234567` → `66891234567`); other numbers would produce a wrong target. For 13 digits the app checks the national-ID check digit and shows a **warning only** (it does not block) |
| 2. Amount (THB) | Optional | Empty or `0` = no amount (static QR, the payer types the amount). Up to 2 decimals, maximum `9,999,999.99`. Sub-satang values and invalid numbers are rejected. Smart decimal comma disambiguation allows typing either standard commas or European decimals. Numeric keyboard with decimals on phones |

**After Generate:** the QR code is shown with the account type and the amount below it. The destination is partly hidden (for example `089-xxx-9999`). The same download / share sheet is used. No PromptPay logo is added. Modifying any input field immediately clears the generated QR to avoid stale scans.

### What is remembered on the device (`localStorage`)

Saved automatically, restored when you open the app again (only the input boxes are restored, no QR code is generated automatically):

- Mode, language, theme
- Text mode: the text (only when "Remember this text" is checked)
- PromptPay mode: destination and amount (stored separately from Text mode)
- **Clear** empties the boxes of the current mode **and** the saved values for them

> **Privacy note:** `localStorage` is plain text on the device. A national ID is therefore **never stored**. Text input is saved only when explicitly opted in via "Remember this text" (default is off for shared device privacy). The destination is saved only when it is a complete 10-digit phone number starting with `0` or a 15-digit e-Wallet ID. Everything else, including the 11–12 digits typed on the way to a 13-digit ID, is not saved. (A phone number that is still half typed is therefore not restored.)

### Version button and updates

The button at the top right shows the app version, for example `v2.1`. Tap it to check for a new version:

| Situation | What happens |
|---|---|
| A new version exists | It is activated and the page reloads. Saved data is kept |
| Already the newest | A short message: "You are on the latest version." |
| Offline / server not reachable | A message that the check is not possible |

How it works: the button reads `js/version.js` from the server (never from a cache). If the number differs, it asks the Service Worker to update, waits until the new files are cached and active, then reloads. Boxes are saved in `localStorage` before reloading.

## Run locally

The Service Worker only works on `https://` or `http://localhost`. Opening the file directly via `file://` still lets the app work, but without offline mode and without the update check.

```bash
cd qr-generator-pwa
python3 -m http.server 8080
# then open http://localhost:8080
```

## Commit to GitHub and enable GitHub Pages

### 1) Create a repository on GitHub

1. Go to <https://github.com/new>
2. Name the repository, e.g. `qr-generator-pwa`
3. Choose **Public** (free GitHub Pages works with public repos; private repos need a plan that supports it)
4. Do **not** tick "Add a README", since the project already has one. Click **Create repository**

### 2) Commit and push from your machine

```bash
cd qr-generator-pwa
git init
git add .
git commit -m "feat: QR & PromptPay v2.1"
git branch -M main
git remote add origin https://github.com/<USERNAME>/qr-generator-pwa.git
git push -u origin main
```

Replace `<USERNAME>` with your GitHub username. `git add .` includes the hidden `.nojekyll` file.

> Not using the command line? Open the repository on GitHub, choose **Add file → Upload files**, drag in all the project's files and folders (including `.nojekyll`), then **Commit changes**.

### 3) Enable GitHub Pages

1. Go to the repository → **Settings** → **Pages** (left menu)
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch**
3. For **Branch**, choose `main` and the `/ (root)` folder, then click **Save**
4. Wait about 1–2 minutes, then refresh Settings → Pages. It will show a link such as
   `https://<USERNAME>.github.io/qr-generator-pwa/`

This works because the app is fully static (no server code), every path is relative, the Service Worker is registered as `sw.js` next to `index.html` (so its scope is the repository sub-path), and GitHub Pages serves everything over HTTPS, which Service Workers require.

### 4) Verify everything works

| What to check | How |
|---|---|
| The page loads | Open the Pages link, type some text, then Generate and Clear |
| Download | Click the QR code (desktop) → "Download QR Code" gives you a `qrcode.png` file (`promptpay-qr.png` in PromptPay mode) |
| It really scans | Open the PNG and scan it with a phone camera. For PromptPay, scan with a banking app |
| Menu | Hamburger at the top left opens a drawer from the left: Language, Mode, Themes |
| Language | Switch EN / TH: all text changes and the menu stays open |
| Memory | Type something, close the tab, open the app again: the boxes are filled again (a 13-digit ID is not) |
| Version button | Tap `v2.1` at the top right: "You are on the latest version." Turn off the network and tap again: the check is reported as not possible |
| Manifest / Service Worker | Chrome DevTools (F12) → **Application** tab → **Manifest** shows no errors, and **Service Workers** shows *activated and running* |
| Offline | Application → Service Workers → tick **Offline**, then refresh. The app should still open and generate QR codes |
| Install the app | Desktop Chrome: install icon in the address bar / Android Chrome: ⋮ menu → **Install app** or **Add to Home screen** / iOS Safari: Share button → **Add to Home Screen**. The name is **QR & PromptPay** |
| Overall scores | Chrome DevTools → **Lighthouse** → select *Progressive Web App* and *Accessibility* |

## Releasing a new version (bumping the version)

1. Make your changes.
2. Edit **one line** in `js/version.js`: `self.APP_VERSION = '2.1';` → for example `'2.2'`. This single number is shown on the version button **and** names the offline cache (`qr-generator-v2.2`). Browsers notice that `sw.js` imports a changed file and download the new version.
3. If you add a new file to the project, also add it to the `APP_SHELL` list in `sw.js`.
4. Commit and push. After GitHub Pages finishes publishing (1–2 minutes), users can tap the version button to get the new version at once; others get it the next time they open the app.

> If you change files but **forget to bump `APP_VERSION`**, existing users will not receive the change, because the offline cache keeps serving the old files.

To add or change theme colours: edit the `[data-theme="..."]` / `[data-sw="..."]` blocks at the top of `css/style.css`, add a `<label class="theme-option">` entry in `index.html`, add the theme name to `THEMES` in `js/app.js` and its name to both languages in the `I18N` table.

## Good to know

- **iOS (Safari / installed app):** downloading may open the image instead of saving it right away. Use **Share → Save Image** (or long-press the image).
- **Text length:** a QR code holds at most 2,331 bytes (Level M) or up to 2,953 bytes (Level L fallback) in UTF-8. A Thai character takes 3 bytes. If the text is longer, the app shows a warning.
- **Browser support:** modern mid-2022+ baseline (Chrome 105+, Safari 16+, Firefox 121+). Uses native modern Web APIs (`Element.prototype.closest`, CSS custom properties, Service Worker API, safe-area insets). No legacy polyfills or build steps required.
- The generated QR code is always black on white with a white border (quiet zone) so it scans as reliably as possible. It does not change with the theme.
- Everything is processed in the browser. What you type is never sent to any server. The only request the app makes by itself is reading `js/version.js` from its own site when you tap the version button.
- On Android the home-screen label may be shortened if the launcher limits the length of `QR & PromptPay`.

## Updates

### v2.1 (2026-10-27)

- **Service Worker & Caching:**
  - Added cache-busting query strings (`?v=${self.APP_VERSION}`) on shell asset installation to bypass edge CDN caching.
  - Implemented Network-First navigation with offline cache fallback to ensure instant updates upon new deployments while keeping offline support intact.
  - Removed unconditional `skipWaiting()` during install; activation now cleanly transitions on update reload without race conditions.
- **PromptPay & Input Processing:**
  - Added smart decimal comma disambiguation in amount input (distinguishes European decimal commas like `12,50` from thousands separators like `1,500`).
  - Added strict amount validation rejecting sub-satang values (e.g. `0.001`) and multiple decimals.
  - Added automatic normalization for pasted international Thai mobile numbers (`+66` / `66` 11-digit numbers auto-convert to standard domestic `0` format).
  - Fixed stale QR display: modifying input values now immediately hides the outdated QR code.
- **Privacy & Security:**
  - Added opt-in toggle (`#textRemember`) for Text mode storage; default is opt-out to prevent data retention on shared devices.
  - Implemented strict Content Security Policy (CSP) meta tag with SHA-256 hash for inline pre-paint script.
  - Converted QR download/share Blob generation to synchronous in-memory base64 decoding, removing network `fetch()` and CSP network constraints.
- **Accessibility & UX:**
  - Added modal dialog semantics (`role="dialog"`, `aria-modal="true"`) to settings drawer.
  - Added live region announcement (`role="status"`, `aria-live="polite"`) to PromptPay target warning banner.
  - Added horizontal safe-area insets (`env(safe-area-inset-*)`) for landscape displays and notched devices.
  - Dynamic iOS status bar style adjustment (`black-translucent` vs `default`) matching selected theme.
  - Dynamic document title and meta description updates when switching language (EN / TH).
- **Engineering & Standards:**
  - Added comprehensive `AGENTS.md` specifying architecture constraints, ES5 syntax enforcement, and EMVCo tag sequence compliance.
  - Restored full MIT License file for vendored `qrcode.js`.

## License

The app code is free to use. The `js/vendor/qrcode.js` library is [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), Copyright © Kazuhiko Arase, under the MIT License. The PromptPay payload follows [kittinan/php-promptpay-qr](https://github.com/kittinan/php-promptpay-qr), itself inspired by [dtinth/promptpay-qr](https://github.com/dtinth/promptpay-qr).
