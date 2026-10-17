# QR & PromptPay (PWA) — v2.0

A single-page app that turns text or links into a QR code and creates **PromptPay** QR codes for receiving money in Thailand. It is responsive on desktop and mobile, installable to the home screen (PWA), and works offline.
There is no build step and no Node installation needed: it is plain HTML / CSS / JS, ready to deploy on GitHub Pages.

> This file has two parts: English (below) and Thai ([ข้ามไปส่วนภาษาไทย](#qr--promptpay-pwa--v20-ภาษาไทย)).

## File structure

```
qr-generator-pwa/
├── index.html                  # Main page (SPA)
├── manifest.json               # PWA manifest (app name, icons, colours). Static, so it is English only
├── sw.js                       # Service Worker (caching for offline use, update handling)
├── .nojekyll                   # Tells GitHub Pages not to process the site with Jekyll
├── README.md                   # This file (English + Thai)
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

- **Top bar:** hamburger menu at the top **left** (the menu slides in from the left), version button (for example `v2.0`) at the top **right**
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

A large text box that accepts text or a URL (Thai and emoji supported; encoded as UTF-8).

### PromptPay mode

**Output:** a QR code built the same way as the PHP library [kittinan/php-promptpay-qr](https://github.com/kittinan/php-promptpay-qr) (`src/PromptPay.php`): Thai QR Payment (EMV) payload, PromptPay ID `A000000677010111`, THB (`764`), country `TH`, CRC-16/CCITT. The output was checked against that library's own test values.

**Inputs:**

| Box | What to enter | Rules |
|---|---|---|
| 1. Destination | Phone number (**10** digits), national ID (**13** digits) or e-Wallet ID (**15** digits) | Digits only: anything else is removed while you type or paste (Thai digits are converted). Exactly 10, 13 or 15 digits are accepted. The detected type is shown under the box. A 10-digit phone number must start with `0`, because the library replaces only a leading `0` with `66` (`0891234567` → `66891234567`); other numbers would produce a wrong target. For 13 digits the app checks the national-ID check digit and shows a **warning only** (it does not block) |
| 2. Amount (THB) | Optional | Empty or `0` = no amount (static QR, the payer types the amount). Up to 2 decimals, maximum `9,999,999.99`. Numeric keyboard with decimals on phones |

**After Generate:** the QR code is shown with the account type and the amount below it. The destination is partly hidden (for example `089-xxx-9999`). The same download / share sheet is used. No PromptPay logo is added.

### What is remembered on the device (`localStorage`)

Saved automatically, restored when you open the app again (only the input boxes are restored, no QR code is generated automatically):

- Mode, language, theme
- Text mode: the text
- PromptPay mode: destination and amount (stored separately from Text mode)
- **Clear** empties the boxes of the current mode **and** the saved values for them

> **Privacy note:** `localStorage` is plain text on the device. A national ID is therefore **never stored**. The destination is saved only when it is a complete 10-digit phone number starting with `0` or a 15-digit e-Wallet ID. Everything else, including the 11–12 digits typed on the way to a 13-digit ID, is not saved. (A phone number that is still half typed is therefore not restored.)

### Version button and updates

The button at the top right shows the app version, for example `v2.0`. Tap it to check for a new version:

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
git commit -m "feat: QR & PromptPay v2.0"
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
| Version button | Tap `v2.0` at the top right: "You are on the latest version." Turn off the network and tap again: the check is reported as not possible |
| Manifest / Service Worker | Chrome DevTools (F12) → **Application** tab → **Manifest** shows no errors, and **Service Workers** shows *activated and running* |
| Offline | Application → Service Workers → tick **Offline**, then refresh. The app should still open and generate QR codes |
| Install the app | Desktop Chrome: install icon in the address bar / Android Chrome: ⋮ menu → **Install app** or **Add to Home screen** / iOS Safari: Share button → **Add to Home Screen**. The name is **QR & PromptPay** |
| Overall scores | Chrome DevTools → **Lighthouse** → select *Progressive Web App* and *Accessibility* |

## Releasing a new version (bumping the version)

1. Make your changes.
2. Edit **one line** in `js/version.js`: `self.APP_VERSION = '2.0';` → for example `'2.1'`. This single number is shown on the version button **and** names the offline cache (`qr-generator-v2.1`). Browsers notice that `sw.js` imports a changed file and download the new version.
3. If you add a new file to the project, also add it to the `APP_SHELL` list in `sw.js`.
4. Commit and push. After GitHub Pages finishes publishing (1–2 minutes), users can tap the version button to get the new version at once; others get it the next time they open the app.

> If you change files but **forget to bump `APP_VERSION`**, existing users will not receive the change, because the offline cache keeps serving the old files.

To add or change theme colours: edit the `[data-theme="..."]` / `[data-sw="..."]` blocks at the top of `css/style.css`, add a `<label class="theme-option">` entry in `index.html`, add the theme name to `THEMES` in `js/app.js` and its name to both languages in the `I18N` table.

## Good to know

- **iOS (Safari / installed app):** downloading may open the image instead of saving it right away. Use **Share → Save Image** (or long-press the image).
- **Text length:** a QR code holds at most about 2,300 bytes (a Thai character takes 3 bytes). If the text is longer, the app shows a warning.
- The generated QR code is always black on white with a white border (quiet zone) so it scans as reliably as possible. It does not change with the theme.
- Everything is processed in the browser. What you type is never sent to any server. The only request the app makes by itself is reading `js/version.js` from its own site when you tap the version button.
- On Android the home-screen label may be shortened if the launcher limits the length of `QR & PromptPay`.

## License

The app code is free to use. The `js/vendor/qrcode.js` library is [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), Copyright © Kazuhiko Arase, under the MIT License. The PromptPay payload follows [kittinan/php-promptpay-qr](https://github.com/kittinan/php-promptpay-qr), itself inspired by [dtinth/promptpay-qr](https://github.com/dtinth/promptpay-qr).



# QR & PromptPay (PWA) — v2.0 (ภาษาไทย)

เว็บแอปแบบ Single Page สำหรับสร้าง QR Code จากข้อความหรือลิงก์ และสร้าง QR **PromptPay** สำหรับรับเงิน รองรับ Desktop และ Mobile ติดตั้งลงหน้าจอโฮมได้ (PWA) และใช้งานออฟไลน์ได้
ไม่มี build step ไม่ต้องติดตั้ง Node — เป็นไฟล์ HTML / CSS / JS ล้วน พร้อม Deploy บน GitHub Pages

## โครงสร้างไฟล์

```
qr-generator-pwa/
├── index.html                  # หน้าเว็บหลัก (SPA)
├── manifest.json               # PWA manifest (ชื่อแอป, ไอคอน, สี) เป็นไฟล์คงที่ จึงเป็นภาษาอังกฤษอย่างเดียว
├── sw.js                       # Service Worker (cache เพื่อใช้งานออฟไลน์ และจัดการการอัปเดต)
├── .nojekyll                   # บอก GitHub Pages ไม่ต้องประมวลผลด้วย Jekyll
├── README.md                   # ไฟล์นี้ (อังกฤษ + ไทย)
├── css/
│   └── style.css               # สไตล์ + 10 ธีมสี (สว่าง 5 มืด 5)
├── js/
│   ├── version.js              # เลขเวอร์ชันของแอป (APP_VERSION) แก้ที่นี่เมื่อออกเวอร์ชันใหม่
│   ├── app.js                  # ตรรกะของแอป (โหมด, สองภาษา, PromptPay, QR, ดาวน์โหลด/แชร์, ธีม, ตรวจเวอร์ชัน)
│   └── vendor/
│       ├── qrcode.js           # ไลบรารี qrcode-generator (MIT) เก็บไว้ในโปรเจกต์เพื่อใช้ออฟไลน์
│       └── LICENSE-qrcode-generator.txt
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-maskable-512.png   # สำหรับ Android (ไอคอนปรับรูปทรงได้)
    └── apple-touch-icon.png    # สำหรับ iOS
```

> ทุก path ในโปรเจกต์เป็น **relative path** จึงทำงานได้ทั้งบน `https://<user>.github.io/<repo>/` และบน root domain

## ฟีเจอร์

- **แถบด้านบน:** ปุ่ม Hamburger อยู่มุมซ้ายบน (เมนูเลื่อนเข้ามาจากฝั่งซ้าย) ปุ่มแสดงเวอร์ชัน (เช่น `v2.0`) อยู่มุมขวาบน
- **สองโหมด** (สลับในเมนู): **ข้อความ (Text)** และ **PromptPay**
- ปุ่ม **Generate** (สีตามธีม) และปุ่ม **Clear** (สีแดงเสมอ) QR Code แสดงใต้ปุ่มเฉพาะหลังกด Generate
- **Desktop:** คลิกที่ QR → เมนูเล็ก "Download QR Code" (บันทึกเป็น `.png`)
- **Mobile:** แตะ (หรือกดค้าง) ที่ QR → Action Sheet ด้านล่าง มี "Download" และ "Share" (Share แสดงเมื่อเบราว์เซอร์รองรับ Web Share API)
- **ภาษา EN / TH:** ครั้งแรกเลือกตามภาษาเบราว์เซอร์ (ไทย → TH, อื่น ๆ → EN) แล้วจำค่าที่เลือก ครอบคลุมข้อความทั้งหมด ทั้งป้ายกำกับ คำแนะนำ ข้อความ error ชื่อธีม `aria-label` และ `<html lang>` ส่วน `manifest.json` เป็นไฟล์คงที่ ชื่อแอปในนั้นจึงสลับภาษาไม่ได้
- **10 ธีมสี:**
  - สว่าง: Blue, Green, Purple, Orange, Pink
  - มืด: Midnight Blue, Forest Green, Plum, Ember, Charcoal
  - ค่า contrast ของตัวอักษรและปุ่มผ่านเกณฑ์ WCAG AA ทุกธีม ส่วน QR Code เป็น **สีดำบนพื้นขาวเสมอ** แม้ในธีมมืด เพื่อให้สแกนติด
- **ลำดับในเมนู:** 1. ภาษา 2. โหมด 3. ธีม เลือกธีมหรือโหมดแล้วเมนูปิดเอง เลือกภาษาเมนูยังเปิดอยู่เพื่อเห็นผลทันที
- คีย์ลัด: `Ctrl/Cmd + Enter` ในช่องข้อความเพื่อ Generate

### โหมดข้อความ (Text)

Text Box ขนาดใหญ่ รับข้อความหรือ URL (รองรับภาษาไทยและอีโมจิ — เข้ารหัสเป็น UTF-8)

### โหมด PromptPay

**Output:** QR Code ที่สร้างตามวิธีของไลบรารี PHP [kittinan/php-promptpay-qr](https://github.com/kittinan/php-promptpay-qr) (`src/PromptPay.php`) คือ payload แบบ Thai QR Payment (EMV) ใช้รหัส PromptPay `A000000677010111` สกุลเงิน THB (`764`) ประเทศ `TH` และ CRC-16/CCITT โดยตรวจเทียบกับค่าทดสอบของไลบรารีนั้นแล้ว

**Input:**

| ช่อง | กรอกอะไร | กฎ |
|---|---|---|
| 1. ปลายทาง | เบอร์โทร (**10** หลัก), เลขบัตรประชาชน (**13** หลัก) หรือ e-Wallet ID (**15** หลัก) | รับเฉพาะตัวเลข อักขระอื่นจะถูกตัดทิ้งตั้งแต่พิมพ์/วาง (เลขไทยแปลงเป็นเลขอารบิกให้) รับ 10, 13 หรือ 15 หลักพอดีเท่านั้น และแสดงประเภทที่ตรวจพบใต้ช่อง เบอร์โทร 10 หลักต้องขึ้นต้นด้วย `0` เพราะไลบรารีแทนที่เฉพาะ `0` นำหน้าเป็น `66` (`0891234567` → `66891234567`) ถ้าไม่ขึ้นต้นด้วย 0 จะได้เลขปลายทางผิด สำหรับ 13 หลักแอปตรวจ check digit ของเลขบัตรประชาชนและ **เตือนเฉยๆ ไม่บล็อก** |
| 2. จำนวนเงิน (บาท) | ใส่หรือไม่ใส่ก็ได้ | ว่างหรือ `0` = ไม่ระบุยอด (static QR ผู้จ่ายกรอกยอดเอง) ทศนิยมได้ไม่เกิน 2 ตำแหน่ง สูงสุด `9,999,999.99` บนมือถือใช้คีย์บอร์ดตัวเลขแบบทศนิยม |

**หลังกด Generate:** แสดง QR Code พร้อมประเภทบัญชีและจำนวนเงินใต้ QR ส่วนเลขปลายทางแสดงแบบปิดบังบางส่วน (เช่น `089-xxx-9999`) ใช้ sheet ดาวน์โหลด/แชร์ชุดเดิม และไม่ใส่โลโก้ PromptPay

### ข้อมูลที่จำไว้ในเครื่อง (`localStorage`)

บันทึกอัตโนมัติ และคืนค่าเมื่อเปิดแอปใหม่ (คืนเฉพาะช่องกรอก ไม่สร้าง QR ให้อัตโนมัติ):

- โหมด ภาษา ธีม
- โหมดข้อความ: ข้อความที่พิมพ์
- โหมด PromptPay: เลขปลายทางและจำนวนเงิน (เก็บแยกจากโหมดข้อความ)
- ปุ่ม **Clear** ล้างช่องกรอกของโหมดปัจจุบัน **และ** ค่าที่บันทึกไว้ของช่องเหล่านั้น

> **ข้อควรระวังด้านความเป็นส่วนตัว:** `localStorage` เก็บเป็นข้อความธรรมดาบนเครื่อง ดังนั้น **จะไม่เก็บเลขบัตรประชาชน** เลขปลายทางจะถูกบันทึกเฉพาะกรณีเป็นเบอร์โทร 10 หลักที่ขึ้นต้นด้วย `0` หรือ e-Wallet ID 15 หลักที่ครบแล้วเท่านั้น กรณีอื่น รวมถึงตัวเลข 11–12 หลักที่พิมพ์ค้างระหว่างทางไปถึง 13 หลัก จะไม่ถูกบันทึก (เบอร์โทรที่พิมพ์ยังไม่ครบจึงไม่ถูกคืนค่าด้วย)

### ปุ่มเวอร์ชันและการอัปเดต

ปุ่มมุมขวาบนแสดงเลขเวอร์ชันของแอป เช่น `v2.0` แตะเพื่อตรวจหาเวอร์ชันใหม่:

| สถานการณ์ | สิ่งที่เกิดขึ้น |
|---|---|
| มีเวอร์ชันใหม่ | เปิดใช้งานเวอร์ชันใหม่แล้วรีโหลดหน้า ข้อมูลที่บันทึกไว้ไม่สูญหาย |
| เป็นเวอร์ชันล่าสุดแล้ว | แสดงข้อความสั้นๆ ว่า "ใช้เวอร์ชันล่าสุดแล้ว" |
| ออฟไลน์ / เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ | แจ้งว่าตรวจสอบไม่ได้ |

หลักการทำงาน: ปุ่มจะอ่านไฟล์ `js/version.js` จากเซิร์ฟเวอร์ (ไม่ใช้ค่าจาก cache) ถ้าเลขไม่ตรงกัน จะสั่งให้ Service Worker อัปเดต รอจนไฟล์ใหม่ถูก cache และเริ่มทำงาน แล้วรีโหลด โดยบันทึกช่องกรอกลง `localStorage` ก่อนรีโหลด

## ทดลองรันในเครื่อง

Service Worker ทำงานเฉพาะบน `https://` หรือ `http://localhost` (เปิดไฟล์ด้วย `file://` ตรง ๆ แอปยังใช้งานได้ แต่จะไม่มีโหมดออฟไลน์และตรวจเวอร์ชันไม่ได้)

```bash
cd qr-generator-pwa
python3 -m http.server 8080
# แล้วเปิด http://localhost:8080
```

## ขั้นตอน Commit ขึ้น GitHub และเปิด GitHub Pages

### 1) สร้าง Repository บน GitHub

1. เข้า <https://github.com/new>
2. ตั้งชื่อ Repository เช่น `qr-generator-pwa`
3. เลือก **Public** (GitHub Pages แบบฟรีใช้กับ Public repo; Private ต้องใช้แผนที่รองรับ)
4. **ไม่ต้อง** ติ๊ก "Add a README" เพราะในโปรเจกต์มีอยู่แล้ว → กด **Create repository**

### 2) Commit และ Push จากเครื่อง

```bash
cd qr-generator-pwa
git init
git add .
git commit -m "feat: QR & PromptPay v2.0"
git branch -M main
git remote add origin https://github.com/<USERNAME>/qr-generator-pwa.git
git push -u origin main
```

แทนที่ `<USERNAME>` ด้วยชื่อผู้ใช้ GitHub ของคุณ `git add .` จะรวมไฟล์ซ่อน `.nojekyll` ด้วย

> ไม่ใช้ command line? เปิด Repository บน GitHub → **Add file → Upload files** แล้วลากไฟล์และโฟลเดอร์ทั้งหมดในโปรเจกต์ไปวาง (รวมไฟล์ `.nojekyll`) → **Commit changes**

### 3) เปิดใช้งาน GitHub Pages

1. ไปที่ Repository → **Settings** → **Pages** (เมนูซ้าย)
2. ใน **Build and deployment** → **Source** เลือก **Deploy from a branch**
3. **Branch** เลือก `main` และโฟลเดอร์ `/ (root)` → กด **Save**
4. รอประมาณ 1–2 นาที แล้วรีเฟรชหน้า Settings → Pages จะแสดงลิงก์ เช่น
   `https://<USERNAME>.github.io/qr-generator-pwa/`

ที่ deploy บน GitHub Pages ได้เพราะแอปเป็นไฟล์สถิตล้วน (ไม่มีโค้ดฝั่งเซิร์ฟเวอร์) ทุก path เป็น relative, Service Worker ลงทะเบียนเป็น `sw.js` ที่อยู่ข้าง `index.html` (scope จึงเป็น sub-path ของ repo) และ GitHub Pages ให้บริการผ่าน HTTPS ซึ่ง Service Worker ต้องใช้

### 4) ตรวจสอบความถูกต้อง

| สิ่งที่ตรวจ | วิธีตรวจ |
|---|---|
| หน้าเว็บขึ้นปกติ | เปิดลิงก์ Pages ทดลองพิมพ์ข้อความ → Generate → Clear |
| ดาวน์โหลด | คลิกที่ QR (Desktop) → "Download QR Code" ได้ไฟล์ `qrcode.png` (โหมด PromptPay ได้ `promptpay-qr.png`) |
| สแกนได้จริง | เปิดไฟล์ PNG แล้วสแกนด้วยกล้องมือถือ ส่วน PromptPay ให้สแกนด้วยแอปธนาคาร |
| เมนู | Hamburger มุมซ้ายบนเปิดลิ้นชักจากฝั่งซ้าย: ภาษา โหมด ธีม |
| ภาษา | สลับ EN / TH ข้อความทั้งหมดเปลี่ยนและเมนูยังเปิดอยู่ |
| การจำค่า | พิมพ์อะไรไว้ ปิดแท็บแล้วเปิดแอปใหม่ ช่องกรอกต้องกลับมา (เลขบัตรประชาชน 13 หลักจะไม่กลับมา) |
| ปุ่มเวอร์ชัน | แตะ `v2.0` มุมขวาบน ต้องขึ้น "ใช้เวอร์ชันล่าสุดแล้ว" ปิดเน็ตแล้วแตะอีกครั้ง ต้องแจ้งว่าตรวจสอบไม่ได้ |
| Manifest / Service Worker | Chrome DevTools (F12) → แท็บ **Application** → **Manifest** ไม่มี error และ **Service Workers** สถานะ *activated and running* |
| ออฟไลน์ | Application → Service Workers → ติ๊ก **Offline** แล้วรีเฟรช แอปต้องยังเปิดและสร้าง QR ได้ |
| ติดตั้งแอป | Desktop Chrome: ไอคอนติดตั้งที่ช่อง URL / Android Chrome: เมนู ⋮ → **Install app** หรือ **Add to Home screen** / iOS Safari: ปุ่ม Share → **Add to Home Screen** ชื่อแอปต้องเป็น **QR & PromptPay** |
| คะแนนรวม | Chrome DevTools → **Lighthouse** → เลือก *Progressive Web App* และ *Accessibility* |

## วิธีเลื่อนเวอร์ชัน (ออกเวอร์ชันใหม่)

1. แก้ไขโค้ดตามต้องการ
2. แก้ **บรรทัดเดียว** ใน `js/version.js`: `self.APP_VERSION = '2.0';` → เช่น `'2.1'` เลขนี้ใช้แสดงบนปุ่มเวอร์ชัน **และ** ใช้ตั้งชื่อ cache ออฟไลน์ (`qr-generator-v2.1`) เบราว์เซอร์จะเห็นว่าไฟล์ที่ `sw.js` นำเข้าเปลี่ยนไป แล้วดาวน์โหลดเวอร์ชันใหม่ให้
3. ถ้าเพิ่มไฟล์ใหม่ในโปรเจกต์ → เพิ่มชื่อไฟล์ในรายการ `APP_SHELL` ใน `sw.js` ด้วย
4. Commit และ push รอ GitHub Pages เผยแพร่ (1–2 นาที) ผู้ใช้แตะปุ่มเวอร์ชันเพื่อรับเวอร์ชันใหม่ได้ทันที ส่วนคนอื่นจะได้รับเมื่อเปิดแอปครั้งถัดไป

> ถ้าแก้ไฟล์แต่ **ลืมเปลี่ยน `APP_VERSION`** ผู้ใช้เดิมจะไม่ได้รับการเปลี่ยนแปลง เพราะ cache ออฟไลน์ยังให้ไฟล์เก่าอยู่

เพิ่มหรือแก้สีธีม: แก้บล็อก `[data-theme="..."]` / `[data-sw="..."]` ที่ต้นไฟล์ `css/style.css` เพิ่มรายการ `<label class="theme-option">` ใน `index.html` เพิ่มชื่อธีมใน `THEMES` ของ `js/app.js` และเพิ่มชื่อธีมทั้งสองภาษาในตาราง `I18N`

## ข้อควรรู้

- **iOS (Safari / แอปที่ติดตั้ง):** การดาวน์โหลดไฟล์อาจเปิดรูปขึ้นมาแทนการบันทึกทันที ให้ใช้ปุ่ม **Share → Save Image** (หรือกดค้างที่รูป)
- **ขนาดข้อความ:** QR Code เก็บข้อมูลได้สูงสุดประมาณ 2,300 ไบต์ (ภาษาไทย 1 ตัวอักษรใช้ 3 ไบต์) ถ้ายาวเกินแอปจะแจ้งเตือน
- QR Code ที่สร้างเป็นสีดำบนพื้นขาวพร้อมขอบขาว (quiet zone) เสมอ เพื่อให้สแกนติดง่ายที่สุด ไม่เปลี่ยนตามธีม
- ทุกอย่างประมวลผลในเบราว์เซอร์ สิ่งที่พิมพ์ไม่ถูกส่งไปที่เซิร์ฟเวอร์ใด ๆ คำขอเดียวที่แอปส่งเองคือการอ่าน `js/version.js` จากเว็บไซต์ของแอปเองเมื่อแตะปุ่มเวอร์ชัน
- บน Android ชื่อใต้ไอคอนอาจถูกตัดสั้น ถ้าลันเชอร์จำกัดความยาวของ `QR & PromptPay`

## License

โค้ดของแอปนี้ใช้ได้อิสระ ส่วนไลบรารี `js/vendor/qrcode.js` คือ [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) ลิขสิทธิ์ © Kazuhiko Arase ภายใต้ MIT License ส่วน payload PromptPay ทำตาม [kittinan/php-promptpay-qr](https://github.com/kittinan/php-promptpay-qr) ซึ่งได้แรงบันดาลใจจาก [dtinth/promptpay-qr](https://github.com/dtinth/promptpay-qr)
