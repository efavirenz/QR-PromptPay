# Project Rules & Agent Instructions — QR & PromptPay PWA

**Repository Target:** Static PWA (Text-to-QR and Thai PromptPay QR Generator)  
**Hosting Environment:** GitHub Pages (`https://<username>.github.io/<repo>/`)  
**Current Release Version:** v2.1  

---

## 1. Architectural Principles

1. **Static Multi-File Architecture:**
   - Plain HTML, CSS, and Vanilla JavaScript.
   - **No Node.js runtime, build step, bundler, or transpiler.** The codebase runs directly from source files in the browser and GitHub Pages.
   - All asset paths are **relative** to support hosting on GitHub Pages sub-paths (`./index.html`, `./css/style.css`, etc.).

2. **Strict ES5 Syntactic Standard:**
   - `js/app.js`, `js/version.js`, and the inline pre-paint `<script>` in `index.html` strictly adhere to **ECMAScript 5 syntax**:
     - Allowed: `var`, `function`, `indexOf`, `.forEach()`, `.filter()`, `.map()`, standard objects/arrays.
     - Prohibited: `const`, `let`, arrow functions (`=>`), template literals (`` `...` ``), classes, destructuring, spread/rest operators (`...`), `for...of`, default function parameters.
   - Verification gate: `acorn.parse(code, { ecmaVersion: 5 })` must pass with zero errors.
   - Service Worker (`sw.js`) executes in the worker thread and utilizes standard modern ES2015+ features (`const`, arrow functions). It must pass `node --check sw.js`.

3. **DOM Safety & Injection Prevention:**
   - Never inject user- or storage-derived strings via `innerHTML`, `outerHTML`, `insertAdjacentHTML`, or `document.write`.
   - All dynamic text updates must route exclusively through `element.textContent`, properties, or DOM attribute setters (`setAttribute`).

4. **Bilingual Internationalization (`I18N`):**
   - Every user-visible string (labels, button texts, `aria-label`, `placeholder`, `alt`, error messages, toasts, dynamic feedback) must exist in **both** English (`en`) and Thai (`th`) in the `I18N` table in `js/app.js`.
   - HTML elements utilize `data-i18n` for text content and `data-i18n-attr="attr:key"` for element attributes.
   - Dynamic strings constructed in JavaScript must re-render inside `renderDynamic()` whenever language changes.

5. **PromptPay Financial Correctness (Highest Risk Area):**
   - PromptPay TLV payload generator follows EMVCo Merchant-Presented Mode (MPM) specification and BOT (Bank of Thailand) standards.
   - Tag order: Tag `00` must be first; Tag `63` (CRC-16/CCITT-FALSE) must be last. Polynomial: `0x1021`, initial value: `0xFFFF`.
   - Standard test vector: `crc16("123456789") === "29B1"`.
   - Currency is fixed to THB (`764`); Country is fixed to `TH`.
   - Displayed and masked recipient and amount must strictly correspond to encoded data.
   - QR code image is always rendered in crisp black-on-white (`#000000` on `#ffffff`) with a minimum 4-module quiet zone, regardless of the active UI theme.

6. **Privacy & Storage Scoping:**
   - **A 13-digit Thai National ID must NEVER be persisted** to `localStorage` or `sessionStorage` under any circumstances (keystroke typing, paste, generate, or reload).
   - Storage keys:
     - `qr-generator-theme`: active theme name
     - `qr-generator-lang`: `'en'` or `'th'`
     - `qr-generator-mode`: `'text'` or `'promptpay'`
     - `qr-generator-text`: text input (only persisted if opt-in is enabled)
     - `qr-generator-text-optin`: `'1'` or `'0'`
     - `qr-generator-pp-target`: phone number or e-Wallet ID (never national ID)
     - `qr-generator-pp-amount`: amount string
     - `sessionStorage` `qr-generator-updated`: target version string during update reloads
   - Multi-tenant origin consideration: Storage is scoped to origin. Handle failing storage access defensively via `try...catch`.

7. **Single-Source Versioning:**
   - Single source of truth is `self.APP_VERSION` in `js/version.js`.
   - `CACHE_NAME` in `sw.js` is programmatically derived: `'qr-generator-v' + self.APP_VERSION`.
   - When releasing a new version, update `js/version.js`, static button text in `index.html`, and `README.md` synchronously.

8. **Browser Support Baseline:**
   - Supported browsers: Modern mid-2022+ baseline:
     - Google Chrome / Chromium 105+ (Aug 2022)
     - Apple Safari / iOS Safari 16.0+ (Sep 2022)
     - Mozilla Firefox 121+ (Dec 2023) / Firefox ESR 115+
   - Baseline features: `HTMLElement.prototype.inert`, `Element.prototype.toggleAttribute`, `Element.prototype.closest`, CSS `:has()`, `dvh`.

9. **Vendored Code:**
   - `js/vendor/qrcode.js` is vendored from Kazuhiko Arase (`qrcode-generator` v2.0.4, MIT License).
   - Vendored files must not be arbitrarily refactored or modified.
