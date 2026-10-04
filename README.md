# QR Code Generator (PWA)

A single-page QR code generator web app. It is responsive on desktop and mobile, installable to the home screen (PWA), and works offline.
There is no build step and no Node installation needed: it is plain HTML / CSS / JS, ready to deploy on GitHub Pages.

> Thai version: [README.md](README.md)

## File structure

```
qr-generator-pwa/
├── index.html                  # Main page (SPA)
├── manifest.json               # PWA manifest (app name, icons, colours)
├── sw.js                       # Service Worker (caching for offline use)
├── .nojekyll                   # Tells GitHub Pages not to process the site with Jekyll
├── README.md                   # Thai README
├── README.en.md                # English README
├── css/
│   └── style.css               # Styles + 8 colour themes
├── js/
│   ├── app.js                  # App logic (QR generation, download/share, themes)
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

- Large text box that accepts text or a URL (Thai and emoji supported; encoded as UTF-8)
- **Generate QR Code** button (themed colour) and **Clear** button (always red). Clear empties the text box and hides the QR code immediately
- The QR code appears below the buttons only after pressing Generate
- **Desktop:** click the QR code to open a small menu with "Download QR Code" (saved as a `.png`)
- **Mobile:** tap (or long-press) the QR code to open a bottom action sheet with "Download" and "Share" (Share is shown when the browser supports the Web Share API)
- Hamburger icon at the top right opens a drawer with 8 colour themes: Blue, Green, Red, Purple, Orange, Teal, Pink, Slate
  - The background becomes a light tint of the chosen colour, the main buttons use the dark shade, and button text is white (contrast passes WCAG AA in every theme)
  - The selected theme is remembered on the device (`localStorage`)
- Shortcut: `Ctrl/Cmd + Enter` in the text box generates the QR code

## Run locally

The Service Worker only works on `https://` or `http://localhost`. Opening the file directly via `file://` still lets the app work, but without offline mode.

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
git commit -m "feat: initial release of QR Code Generator PWA"
git branch -M main
git remote add origin https://github.com/<USERNAME>/qr-generator-pwa.git
git push -u origin main
```

Replace `<USERNAME>` with your GitHub username.

> Not using the command line? Open the repository on GitHub, choose **Add file → Upload files**, drag in all the project's files and folders (including `.nojekyll`), then **Commit changes**.

### 3) Enable GitHub Pages

1. Go to the repository → **Settings** → **Pages** (left menu)
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch**
3. For **Branch**, choose `main` and the `/ (root)` folder, then click **Save**
4. Wait about 1–2 minutes, then refresh Settings → Pages. It will show a link such as
   `https://<USERNAME>.github.io/qr-generator-pwa/`

### 4) Verify everything works

| What to check | How |
|---|---|
| The page loads | Open the Pages link, type some text, then Generate and Clear |
| Download | Click the QR code (desktop) → "Download QR Code" gives you a `qrcode.png` file |
| It really scans | Open the PNG and scan it with a phone camera |
| Themes | Click the hamburger at the top right, pick a theme, then refresh. The theme should persist |
| Manifest / Service Worker | Chrome DevTools (F12) → **Application** tab → **Manifest** shows no errors, and **Service Workers** shows *activated and running* |
| Offline | Application → Service Workers → tick **Offline**, then refresh. The app should still open and generate QR codes |
| Install the app | Desktop Chrome: install icon in the address bar / Android Chrome: ⋮ menu → **Install app** or **Add to Home screen** / iOS Safari: Share button → **Add to Home Screen** |
| Overall scores | Chrome DevTools → **Lighthouse** → select *Progressive Web App* and *Accessibility* |

## Updating the app after deployment

- If you change any cached file (HTML/CSS/JS/icons), bump `CACHE_VERSION` in `sw.js` (e.g. `'v1'` → `'v2'`) before committing so existing users receive the new files.
- If you add a new file to the project, also add its name to the `APP_SHELL` list in `sw.js`.
- To add or change theme colours: edit the `[data-theme="..."]` blocks at the top of `css/style.css`, add a `<label class="theme-option">` entry in `index.html`, and add the theme name to `THEMES` in `js/app.js`.

## Good to know

- **iOS (Safari / installed app):** downloading may open the image instead of saving it right away. Use **Share → Save Image** (or long-press the image).
- **Text length:** a QR code holds at most about 2,300 bytes (a Thai character takes 3 bytes). If the text is longer, the app shows a warning.
- The generated QR code is always black on white with a white border (quiet zone) so it scans as reliably as possible. It does not change with the theme.
- Everything is processed in the browser. The text you type is never sent to any server.

## License

The app code is free to use. The `js/vendor/qrcode.js` library is [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), Copyright © Kazuhiko Arase, under the MIT License.



# QR Code Generator (PWA)

เว็บแอปสร้าง QR Code แบบ Single Page รองรับ Desktop และ Mobile ติดตั้งลงหน้าจอโฮมได้ (PWA) และใช้งานออฟไลน์ได้
ไม่มี build step ไม่ต้องติดตั้ง Node — เป็นไฟล์ HTML / CSS / JS ล้วน พร้อม Deploy บน GitHub Pages

## โครงสร้างไฟล์

```
qr-generator-pwa/
├── index.html                  # หน้าเว็บหลัก (SPA)
├── manifest.json               # PWA manifest (ชื่อแอป, ไอคอน, สี)
├── sw.js                       # Service Worker (cache เพื่อใช้งานออฟไลน์)
├── .nojekyll                   # บอก GitHub Pages ไม่ต้องประมวลผลด้วย Jekyll
├── README.md
├── css/
│   └── style.css               # สไตล์ + 8 ธีมสี
├── js/
│   ├── app.js                  # ตรรกะของแอป (สร้าง QR, ดาวน์โหลด/แชร์, ธีม)
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

- Text Box ขนาดใหญ่ รับข้อความหรือ URL (รองรับภาษาไทยและอีโมจิ — เข้ารหัสเป็น UTF-8)
- ปุ่ม **Generate QR Code** (สีตามธีม) และปุ่ม **Clear** (สีแดงเสมอ) — Clear ล้างข้อความและซ่อน QR ทันที
- QR Code แสดงใต้ปุ่มเฉพาะหลังกด Generate
- **Desktop:** คลิกที่ QR → เมนูเล็ก "Download QR Code" (บันทึกเป็น `.png`)
- **Mobile:** แตะ (หรือกดค้าง) ที่ QR → Action Sheet ด้านล่าง มี "Download" และ "Share" (Share แสดงเมื่อเบราว์เซอร์รองรับ Web Share API)
- Hamburger ที่มุมขวาบน → ลิ้นชักเลือกธีม 8 สี: Blue, Green, Red, Purple, Orange, Teal, Pink, Slate
  - พื้นหลังเป็นสีอ่อนของโทนนั้น ปุ่มหลักเป็นสีเข้ม ตัวอักษรบนปุ่มสีขาว (ค่า contrast ผ่านเกณฑ์ WCAG AA ทุกธีม)
  - จำธีมที่เลือกไว้ในเครื่อง (`localStorage`)
- คีย์ลัด: `Ctrl/Cmd + Enter` ใน Text Box เพื่อ Generate

## ทดลองรันในเครื่อง

Service Worker ทำงานเฉพาะบน `https://` หรือ `http://localhost` (เปิดไฟล์ด้วย `file://` ตรง ๆ แอปยังใช้งานได้ แต่จะไม่มีโหมดออฟไลน์)

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
git commit -m "Add QR Code Generator PWA"
git branch -M main
git remote add origin https://github.com/<USERNAME>/qr-generator-pwa.git
git push -u origin main
```

แทนที่ `<USERNAME>` ด้วยชื่อผู้ใช้ GitHub ของคุณ

> ไม่ใช้ command line? เปิด Repository บน GitHub → **Add file → Upload files** แล้วลากไฟล์และโฟลเดอร์ทั้งหมดในโปรเจกต์ไปวาง (รวมไฟล์ `.nojekyll`) → **Commit changes**

### 3) เปิดใช้งาน GitHub Pages

1. ไปที่ Repository → **Settings** → **Pages** (เมนูซ้าย)
2. ใน **Build and deployment** → **Source** เลือก **Deploy from a branch**
3. **Branch** เลือก `main` และโฟลเดอร์ `/ (root)` → กด **Save**
4. รอประมาณ 1–2 นาที แล้วรีเฟรชหน้า Settings → Pages จะแสดงลิงก์ เช่น
   `https://<USERNAME>.github.io/qr-generator-pwa/`

### 4) ตรวจสอบความถูกต้อง

| สิ่งที่ตรวจ | วิธีตรวจ |
|---|---|
| หน้าเว็บขึ้นปกติ | เปิดลิงก์ Pages ทดลองพิมพ์ข้อความ → Generate → Clear |
| ดาวน์โหลด | คลิกที่ QR (Desktop) → "Download QR Code" ได้ไฟล์ `qrcode.png` |
| สแกนได้จริง | เปิดไฟล์ PNG แล้วสแกนด้วยกล้องมือถือ |
| ธีม | กด Hamburger มุมขวาบน → เลือกธีม แล้วรีเฟรช ธีมต้องยังอยู่ |
| Manifest / Service Worker | Chrome DevTools (F12) → แท็บ **Application** → **Manifest** ไม่มี error และ **Service Workers** สถานะ *activated and running* |
| ออฟไลน์ | Application → Service Workers → ติ๊ก **Offline** แล้วรีเฟรช แอปต้องยังเปิดและสร้าง QR ได้ |
| ติดตั้งแอป | Desktop Chrome: ไอคอนติดตั้งที่ช่อง URL / Android Chrome: เมนู ⋮ → **Install app** หรือ **Add to Home screen** / iOS Safari: ปุ่ม Share → **Add to Home Screen** |
| คะแนนรวม | Chrome DevTools → **Lighthouse** → เลือก *Progressive Web App* และ *Accessibility* |

## การแก้ไขและอัปเดตแอปหลัง Deploy

- แก้ไฟล์ใดก็ตามที่ถูก cache ไว้ (HTML/CSS/JS/ไอคอน) ให้เปลี่ยนเลข `CACHE_VERSION` ในไฟล์ `sw.js` (เช่น `'v1'` → `'v2'`) ก่อน commit เพื่อให้ผู้ใช้เดิมได้ไฟล์ใหม่
- เพิ่มไฟล์ใหม่ในโปรเจกต์ → เพิ่มชื่อไฟล์ในรายการ `APP_SHELL` ใน `sw.js` ด้วย
- เพิ่มหรือแก้สีธีม: แก้บล็อก `[data-theme="..."]` ที่ต้นไฟล์ `css/style.css` และเพิ่มรายการ `<label class="theme-option">` ใน `index.html` กับชื่อธีมใน `THEMES` ของ `js/app.js`

## ข้อควรรู้

- **iOS (Safari / แอปที่ติดตั้ง):** การดาวน์โหลดไฟล์อาจเปิดรูปขึ้นมาแทนการบันทึกทันที ให้ใช้ปุ่ม **Share → Save Image** (หรือกดค้างที่รูป)
- **ขนาดข้อความ:** QR Code เก็บข้อมูลได้สูงสุดประมาณ 2,300 ไบต์ (ภาษาไทย 1 ตัวอักษรใช้ 3 ไบต์) ถ้ายาวเกินแอปจะแจ้งเตือน
- QR Code ที่สร้างเป็นสีดำบนพื้นขาวพร้อมขอบขาว (quiet zone) เสมอ เพื่อให้สแกนติดง่ายที่สุด ไม่เปลี่ยนตามธีม
- ทุกอย่างประมวลผลในเบราว์เซอร์ ข้อความที่พิมพ์ไม่ถูกส่งไปที่เซิร์ฟเวอร์ใด ๆ

## License

โค้ดของแอปนี้ใช้ได้อิสระ ส่วนไลบรารี `js/vendor/qrcode.js` คือ [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) ลิขสิทธิ์ © Kazuhiko Arase ภายใต้ MIT License
