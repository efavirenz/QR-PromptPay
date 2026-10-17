/* ==========================================================================
   QR & PromptPay PWA — app.js
   Depends on js/vendor/qrcode.js (qrcode-generator by Kazuhiko Arase, MIT)
   and js/version.js (APP_VERSION).

   Sections: config · i18n · storage · themes · mode · PromptPay payload ·
             QR generation · download/share · layers · version check · init
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Config ---------- */
  var APP_VERSION = String(window.APP_VERSION || '?');
  var THEMES = ['blue', 'green', 'purple', 'orange', 'pink',
                'midnight', 'forest', 'plum', 'ember', 'charcoal'];
  var DEFAULT_THEME = 'blue';
  var LANGS = ['en', 'th'];
  var MODES = ['text', 'promptpay'];
  var KEY = {
    theme: 'qr-generator-theme',
    lang: 'qr-generator-lang',
    mode: 'qr-generator-mode',
    text: 'qr-generator-text',
    ppTarget: 'qr-generator-pp-target',
    ppAmount: 'qr-generator-pp-amount',
    updated: 'qr-generator-updated'       // sessionStorage: set just before an update reload
  };
  var QUIET_ZONE = 4;          // modules of white border (QR spec minimum)
  var TARGET_PX = 1024;        // approximate size of the exported PNG
  var MAX_AMOUNT_INT_DIGITS = 7;           // 9,999,999.99 is the largest amount accepted
  var TOAST_MS = 3500;

  /* ---------- Elements ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var el = {
    topbar: $('topbar'), main: $('main'),
    input: $('input'), error: $('error'),
    ppTarget: $('ppTarget'), ppTargetInfo: $('ppTargetInfo'), ppTargetWarn: $('ppTargetWarn'),
    ppAmount: $('ppAmount'),
    generateBtn: $('generateBtn'), clearBtn: $('clearBtn'),
    result: $('result'), qrBtn: $('qrBtn'), qrImg: $('qrImg'),
    popover: $('popover'), popDownload: $('popDownload'),
    ppInfoType: $('ppInfoType'), ppInfoTo: $('ppInfoTo'), ppInfoAmount: $('ppInfoAmount'), ppWarn: $('ppWarn'),
    hint: $('qrHint'), status: $('status'), toast: $('toast'),
    menuBtn: $('menuBtn'), closeMenu: $('closeMenu'), versionBtn: $('versionBtn'),
    drawer: $('drawer'), scrim: $('scrim'),
    sheet: $('sheet'), sheetTitle: $('sheetTitle'), sheetDownload: $('sheetDownload'),
    sheetShare: $('sheetShare'), sheetCancel: $('sheetCancel')
  };
  var radios = function (name) {
    return Array.prototype.slice.call(document.querySelectorAll('input[name="' + name + '"]'));
  };
  var themeRadios = radios('theme'), langRadios = radios('lang'), modeRadios = radios('mode');
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  var metaDesc = document.querySelector('meta[name="description"]');

  var lang = 'en';
  var mode = 'text';
  var result = null;            // the QR code currently on screen (see showQr)
  var errorState = null;        // { key, params } of the visible error, so it can be re-translated
  var openLayerName = null;     // 'drawer' | 'sheet' | null
  var statusTimer = null;
  var toastTimer = null;
  var checkingUpdate = false;

  /* ---------- Make the QR library encode UTF-8 (Thai, emoji, …) ---------- */
  if (window.qrcode && qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  }

  /* ======================================================================
     i18n — every visible string (and aria-label / placeholder / alt) lives here
     ====================================================================== */
  var I18N = {
    en: {
      'menu.open': 'Open menu',
      'menu.close': 'Close menu',
      'menu.title': 'Settings',
      'menu.language': 'Language',
      'menu.mode': 'Mode',
      'menu.theme': 'Theme',
      'menu.light': 'Light',
      'menu.dark': 'Dark',
      'mode.text': 'Text',
      'theme.blue': 'Blue', 'theme.green': 'Green', 'theme.purple': 'Purple',
      'theme.orange': 'Orange', 'theme.pink': 'Pink',
      'theme.midnight': 'Midnight Blue', 'theme.forest': 'Forest Green', 'theme.plum': 'Plum',
      'theme.ember': 'Ember', 'theme.charcoal': 'Charcoal',

      'lead.text': 'Turn any text or link into a QR code in one tap.',
      'lead.promptpay': 'Create a PromptPay QR code to receive money. Works with phone numbers, national IDs and e-Wallet IDs.',
      'card.label': 'QR code input',
      'text.label': 'Text or URL to encode',
      'text.placeholder': 'Enter text or URL here...',

      'pp.targetLabel': 'Phone number, national ID or e-Wallet ID',
      'pp.targetPlaceholder': '10, 13 or 15 digits',
      'pp.amountLabel': 'Amount (THB), optional',
      'pp.amountHelp': 'Leave empty or enter 0 for no fixed amount. Up to 2 decimals, max 9,999,999.99.',
      'pp.detect.empty': 'Digits only: 10 (phone), 13 (national ID) or 15 (e-Wallet).',
      'pp.detect.partial': '{n} digits so far. Enter exactly 10, 13 or 15.',
      'pp.detect': 'Detected: {type}',
      'type.phone': 'Phone number',
      'type.id': 'National ID',
      'type.ewallet': 'e-Wallet ID',
      'pp.warn.phone0': 'A 10-digit phone number must start with 0.',
      'pp.warn.idcheck': 'This national ID does not pass the check-digit test. Please double-check it.',
      'pp.warn.idcheckResult': 'The national ID does not pass the check-digit test. The QR code was still created, so please double-check the number.',

      'btn.generate': 'Generate QR Code',
      'btn.clear': 'Clear',
      'err.textEmpty': 'Please enter some text or a URL first.',
      'err.textLong': 'That text is too long to fit in a QR code. Please shorten it.',
      'err.ppLength': 'Enter exactly 10 digits (phone), 13 digits (national ID) or 15 digits (e-Wallet ID).',
      'err.ppPhone0': 'A 10-digit phone number must start with 0.',
      'err.amountInvalid': 'Enter a valid amount, for example 250 or 250.50.',
      'err.qr': 'Could not create the QR code.',

      'result.label': 'Generated QR code',
      'qr.btnLabel': 'QR code. Press to open download options',
      'qr.alt': 'Generated QR code',
      'pop.download': 'Download QR Code',
      'hint.touch': 'Tap the QR code to download or share it.',
      'hint.click': 'Click the QR code to download it.',
      'status.downloaded': 'QR code downloaded.',
      'status.downloadFail': 'Could not download the image.',
      'sheet.title': 'QR code',
      'sheet.titlePP': 'PromptPay QR',
      'sheet.download': 'Download',
      'sheet.share': 'Share',
      'sheet.cancel': 'Cancel',
      'share.title': 'QR Code',

      'pp.info.type': 'Account type',
      'pp.info.to': 'Pay to',
      'pp.info.amount': 'Amount',
      'pp.noAmount': 'Any amount',
      'pp.amountFmt': '{amt} THB',

      'ver.aria': 'App version {v}. Tap to check for updates.',
      'ver.checking': 'Checking for updates…',
      'ver.latest': 'You are on the latest version.',
      'ver.updating': 'New version {v} found. Updating…',
      'ver.updated': 'Updated to {v}.',
      'ver.updateFailed': 'The update did not finish. Please try again.',
      'ver.offline': 'Can’t check for updates while offline.',
      'ver.failed': 'Couldn’t check for updates. Please try again.'
    },

    th: {
      'menu.open': 'เปิดเมนู',
      'menu.close': 'ปิดเมนู',
      'menu.title': 'ตั้งค่า',
      'menu.language': 'ภาษา',
      'menu.mode': 'โหมด',
      'menu.theme': 'ธีม',
      'menu.light': 'สว่าง',
      'menu.dark': 'มืด',
      'mode.text': 'ข้อความ',
      'theme.blue': 'น้ำเงิน', 'theme.green': 'เขียว', 'theme.purple': 'ม่วง',
      'theme.orange': 'ส้ม', 'theme.pink': 'ชมพู',
      'theme.midnight': 'น้ำเงินเข้ม', 'theme.forest': 'เขียวป่า', 'theme.plum': 'ม่วงพลัม',
      'theme.ember': 'แดงถ่านไฟ', 'theme.charcoal': 'เทาถ่าน',

      'lead.text': 'เปลี่ยนข้อความหรือลิงก์ให้เป็น QR Code ได้ในแตะเดียว',
      'lead.promptpay': 'สร้าง QR PromptPay สำหรับรับเงิน รองรับเบอร์โทรศัพท์ เลขบัตรประชาชน และ e-Wallet ID',
      'card.label': 'ช่องกรอกข้อมูลสำหรับ QR Code',
      'text.label': 'ข้อความหรือ URL ที่จะแปลงเป็น QR Code',
      'text.placeholder': 'พิมพ์ข้อความหรือ URL ที่นี่...',

      'pp.targetLabel': 'เบอร์โทรศัพท์ เลขบัตรประชาชน หรือ e-Wallet ID',
      'pp.targetPlaceholder': 'ตัวเลข 10, 13 หรือ 15 หลัก',
      'pp.amountLabel': 'จำนวนเงิน (บาท) ไม่บังคับ',
      'pp.amountHelp': 'เว้นว่างหรือใส่ 0 = ไม่ระบุยอด ทศนิยมได้ไม่เกิน 2 ตำแหน่ง สูงสุด 9,999,999.99',
      'pp.detect.empty': 'ตัวเลขเท่านั้น: 10 หลัก (เบอร์โทร), 13 หลัก (บัตรประชาชน) หรือ 15 หลัก (e-Wallet)',
      'pp.detect.partial': 'กรอกแล้ว {n} หลัก ต้องครบ 10, 13 หรือ 15 หลักพอดี',
      'pp.detect': 'ตรวจพบ: {type}',
      'type.phone': 'เบอร์โทรศัพท์',
      'type.id': 'เลขบัตรประชาชน',
      'type.ewallet': 'e-Wallet ID',
      'pp.warn.phone0': 'เบอร์โทร 10 หลักต้องขึ้นต้นด้วย 0',
      'pp.warn.idcheck': 'เลขบัตรประชาชนนี้ไม่ผ่านการตรวจเลขตรวจสอบ (check digit) โปรดตรวจสอบอีกครั้ง',
      'pp.warn.idcheckResult': 'เลขบัตรประชาชนไม่ผ่านการตรวจเลขตรวจสอบ (check digit) แต่สร้าง QR Code ให้แล้ว โปรดตรวจสอบเลขอีกครั้ง',

      'btn.generate': 'สร้าง QR Code',
      'btn.clear': 'ล้าง',
      'err.textEmpty': 'กรุณาใส่ข้อความหรือ URL ก่อน',
      'err.textLong': 'ข้อความยาวเกินกว่าจะใส่ใน QR Code ได้ กรุณาย่อให้สั้นลง',
      'err.ppLength': 'กรอกตัวเลขให้ครบ 10 หลัก (เบอร์โทร), 13 หลัก (บัตรประชาชน) หรือ 15 หลัก (e-Wallet ID) พอดี',
      'err.ppPhone0': 'เบอร์โทร 10 หลักต้องขึ้นต้นด้วย 0',
      'err.amountInvalid': 'จำนวนเงินไม่ถูกต้อง เช่น 250 หรือ 250.50',
      'err.qr': 'ไม่สามารถสร้าง QR Code ได้',

      'result.label': 'QR Code ที่สร้างแล้ว',
      'qr.btnLabel': 'QR Code กดเพื่อเปิดตัวเลือกดาวน์โหลด',
      'qr.alt': 'QR Code ที่สร้างแล้ว',
      'pop.download': 'ดาวน์โหลด QR Code',
      'hint.touch': 'แตะที่ QR Code เพื่อดาวน์โหลดหรือแชร์',
      'hint.click': 'คลิกที่ QR Code เพื่อดาวน์โหลด',
      'status.downloaded': 'ดาวน์โหลด QR Code แล้ว',
      'status.downloadFail': 'ไม่สามารถดาวน์โหลดรูปภาพได้',
      'sheet.title': 'QR Code',
      'sheet.titlePP': 'QR PromptPay',
      'sheet.download': 'ดาวน์โหลด',
      'sheet.share': 'แชร์',
      'sheet.cancel': 'ยกเลิก',
      'share.title': 'QR Code',

      'pp.info.type': 'ประเภทบัญชี',
      'pp.info.to': 'ปลายทาง',
      'pp.info.amount': 'จำนวนเงิน',
      'pp.noAmount': 'ไม่ระบุยอด',
      'pp.amountFmt': '{amt} บาท',

      'ver.aria': 'เวอร์ชันแอป {v} แตะเพื่อตรวจสอบเวอร์ชันใหม่',
      'ver.checking': 'กำลังตรวจสอบเวอร์ชันใหม่…',
      'ver.latest': 'ใช้เวอร์ชันล่าสุดแล้ว',
      'ver.updating': 'พบเวอร์ชันใหม่ {v} กำลังอัปเดต…',
      'ver.updated': 'อัปเดตเป็น {v} แล้ว',
      'ver.updateFailed': 'อัปเดตไม่สำเร็จ กรุณาลองอีกครั้ง',
      'ver.offline': 'ตรวจสอบเวอร์ชันไม่ได้ เนื่องจากออฟไลน์อยู่',
      'ver.failed': 'ตรวจสอบเวอร์ชันไม่สำเร็จ กรุณาลองอีกครั้ง'
    }
  };

  function t(key, params) {
    var s = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
    if (params) {
      Object.keys(params).forEach(function (k) { s = s.split('{' + k + '}').join(params[k]); });
    }
    return s;
  }

  function detectLang() {
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return /^th(-|_|$)/i.test(nav) ? 'th' : 'en';       // th → TH, everything else → EN
  }

  /* Re-translate everything that is in the HTML (data-i18n / data-i18n-attr) */
  function applyI18n() {
    root.setAttribute('lang', lang);
    if (metaDesc) {
      metaDesc.setAttribute('content', lang === 'th'
        ? 'ตัวสร้าง QR Code ฟรี เร็ว และเป็นส่วนตัว รองรับ PromptPay ใช้งานออฟไลน์และติดตั้งบนมือถือได้'
        : 'Free, fast and private QR code generator with PromptPay support. Works offline and can be installed on your phone.');
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (node) {
      node.textContent = t(node.getAttribute('data-i18n'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-attr]'), function (node) {
      node.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var i = pair.indexOf(':');
        node.setAttribute(pair.slice(0, i), t(pair.slice(i + 1)));
      });
    });
    renderDynamic();
  }

  /* Strings built in JavaScript are redrawn here whenever the language changes */
  function renderDynamic() {
    renderError();
    renderTargetInfo();
    renderResult();
    el.versionBtn.textContent = 'v' + APP_VERSION;
    el.versionBtn.setAttribute('aria-label', t('ver.aria', { v: 'v' + APP_VERSION }));
  }

  function setLang(next, persist) {
    lang = LANGS.indexOf(next) === -1 ? 'en' : next;
    langRadios.forEach(function (r) { r.checked = (r.value === lang); });
    applyI18n();
    if (persist) lsSet(KEY.lang, lang);
  }

  /* ======================================================================
     Storage (localStorage can throw in private mode, so every call is guarded)
     ====================================================================== */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode / full */ } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

  /* The target is remembered only when it cannot be a national ID (or a piece of one):
     a complete 10-digit phone number (it must start with 0, IDs never do) or a 15-digit
     e-Wallet ID. A 13-digit ID — and the 11–12 digits typed on the way to it — is never stored. */
  function isRememberableTarget(d) {
    return (d.length === 10 && d.charAt(0) === '0') || d.length === 15;
  }

  function persistText() {
    if (el.input.value) lsSet(KEY.text, el.input.value); else lsDel(KEY.text);
  }
  function persistTarget() {
    var d = el.ppTarget.value;
    if (isRememberableTarget(d)) lsSet(KEY.ppTarget, d); else lsDel(KEY.ppTarget);
  }
  function persistAmount() {
    if (el.ppAmount.value) lsSet(KEY.ppAmount, el.ppAmount.value); else lsDel(KEY.ppAmount);
  }
  function persistInputs() { persistText(); persistTarget(); persistAmount(); }

  /* On start-up only the input boxes get their values back — no QR code is generated */
  function restoreInputs() {
    el.input.value = lsGet(KEY.text) || '';

    var target = filterDigits(lsGet(KEY.ppTarget) || '');
    if (isRememberableTarget(target)) el.ppTarget.value = target; else lsDel(KEY.ppTarget);

    el.ppAmount.value = filterAmount(lsGet(KEY.ppAmount) || '');
  }

  /* ======================================================================
     Themes
     ====================================================================== */
  function applyTheme(name, persist) {
    if (THEMES.indexOf(name) === -1) {          // unknown or retired theme (e.g. the old "red")
      name = DEFAULT_THEME;
      lsDel(KEY.theme);
    }
    root.setAttribute('data-theme', name);
    themeRadios.forEach(function (r) { r.checked = (r.value === name); });

    // keep the browser / status-bar colour in step with the page background
    var bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (bg && metaTheme) metaTheme.setAttribute('content', bg);

    if (persist) lsSet(KEY.theme, name);
  }

  /* ======================================================================
     Mode: Text / PromptPay
     ====================================================================== */
  function setMode(next, persist) {
    if (MODES.indexOf(next) === -1) next = 'text';
    var changed = next !== mode;
    mode = next;
    root.setAttribute('data-mode', mode);
    modeRadios.forEach(function (r) { r.checked = (r.value === mode); });
    if (persist) lsSet(KEY.mode, mode);
    if (changed) {            // the QR code on screen belongs to the other mode
      hideError();
      hideResult();
    }
  }

  /* ======================================================================
     Input filters
     ====================================================================== */
  function filterDigits(s) {
    return String(s)
      .replace(/[๐-๙]/g, function (ch) { return String(ch.charCodeAt(0) - 0x0E50); })   // Thai digits → 0-9
      .replace(/\D/g, '')
      .slice(0, 15);
  }

  /* digits and at most one ".", max 2 decimals, max 7 integer digits (→ 9,999,999.99) */
  function filterAmount(s) {
    s = String(s).replace(/[๐-๙]/g, function (ch) { return String(ch.charCodeAt(0) - 0x0E50); })
                 .replace(/[^0-9.]/g, '');
    var dot = s.indexOf('.');
    if (dot === -1) return s.slice(0, MAX_AMOUNT_INT_DIGITS);
    return s.slice(0, dot).slice(0, MAX_AMOUNT_INT_DIGITS) + '.' + s.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  }

  /* Filter while typing / pasting and keep the caret where the user expects it */
  function bindFilter(input, filter, after) {
    input.addEventListener('input', function () {
      var raw = input.value;
      var pos = input.selectionStart;
      var clean = filter(raw);
      if (clean !== raw) {
        var caret = filter(raw.slice(0, pos == null ? raw.length : pos)).length;
        input.value = clean;
        try { input.setSelectionRange(Math.min(caret, clean.length), Math.min(caret, clean.length)); } catch (e) { /* not supported */ }
      }
      if (errorState) hideError();
      after();
    });
  }

  /* ======================================================================
     PromptPay payload — same logic as github.com/kittinan/php-promptpay-qr (src/PromptPay.php)
     ====================================================================== */
  function tlv(id, value) {
    var len = String(value.length);
    if (len.length < 2) len = '0' + len;
    return id + len + value;
  }

  function crc16(str) {                       // CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF
    var crc = 0xFFFF;
    for (var i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (var j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (((crc << 1) ^ 0x1021) & 0xFFFF) : ((crc << 1) & 0xFFFF);
      }
    }
    return ('0000' + crc.toString(16).toUpperCase()).slice(-4);
  }

  /* target: digits only (10, 13 or 15 of them). amount: "250.00" or null for a static QR. */
  function promptPayPayload(target, amount) {
    var targetType = target.length >= 15 ? '03' : (target.length >= 13 ? '02' : '01');   // e-Wallet / ID / phone
    var formatted = target.length >= 13
      ? target
      : ('0000000000000' + target.replace(/^0/, '66')).slice(-13);                     // 0891234567 → 0066891234567

    var data = tlv('00', '01') +                                                        // payload format
               tlv('01', amount ? '12' : '11') +                                        // 12 = dynamic (has amount), 11 = static
               tlv('29', tlv('00', 'A000000677010111') + tlv(targetType, formatted)) +  // PromptPay merchant info
               tlv('58', 'TH') +
               tlv('53', '764') +                                                       // THB
               (amount ? tlv('54', amount) : '');
    var withCrcTag = data + '6304';
    return withCrcTag + crc16(withCrcTag);
  }

  function targetKind(d) {
    return d.length === 10 ? 'phone' : d.length === 13 ? 'id' : d.length === 15 ? 'ewallet' : null;
  }

  /* Thai national ID check digit: sum(d[i] * (13 - i)) for i = 0..11, then (11 - sum % 11) % 10 */
  function thaiIdCheckOk(d) {
    var sum = 0;
    for (var i = 0; i < 12; i++) sum += Number(d.charAt(i)) * (13 - i);
    return ((11 - (sum % 11)) % 10) === Number(d.charAt(12));
  }

  function repeat(ch, n) { var s = ''; while (n-- > 0) s += ch; return s; }

  /* Show only part of the destination, e.g. 089-xxx-9999 */
  function maskTarget(d) {
    var m;
    if (d.length === 10) return d.slice(0, 3) + '-xxx-' + d.slice(6);
    if (d.length === 13) {
      m = repeat('x', 9) + d.slice(9);
      return m.charAt(0) + '-' + m.slice(1, 5) + '-' + m.slice(5, 10) + '-' + m.slice(10, 12) + '-' + m.charAt(12);
    }
    m = repeat('x', 11) + d.slice(11);
    return m.slice(0, 3) + '-' + m.slice(3, 7) + '-' + m.slice(7, 11) + '-' + m.slice(11);
  }

  /* "" / "0" / "0.00" → { ok, value: null } (static QR); otherwise value is "250.00" */
  function parseAmount(raw) {
    var s = String(raw).trim();
    if (s === '') return { ok: true, value: null };
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return { ok: false };
    var parts = s.split('.');
    var intPart = (parts[0] || '0').replace(/^0+(?=\d)/, '');
    var dec = parts[1] || '';
    while (dec.length < 2) dec += '0';
    dec = dec.slice(0, 2);
    if (intPart.length > MAX_AMOUNT_INT_DIGITS) return { ok: false };
    if (/^0+$/.test(intPart + dec)) return { ok: true, value: null };
    return { ok: true, value: intPart + '.' + dec };
  }

  function formatMoney(value) {                     // "1234.5" style string → "1,234.50"
    var p = value.split('.');
    return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + p[1];
  }

  /* Live feedback under the first box: detected type, plus non-blocking warnings */
  function renderTargetInfo() {
    var d = el.ppTarget.value;
    var kind = targetKind(d);
    var warn = '';

    if (!d) {
      el.ppTargetInfo.textContent = t('pp.detect.empty');
    } else if (!kind) {
      el.ppTargetInfo.textContent = t('pp.detect.partial', { n: d.length });
    } else {
      el.ppTargetInfo.textContent = t('pp.detect', { type: t('type.' + kind) });
      if (kind === 'phone' && d.charAt(0) !== '0') warn = t('pp.warn.phone0');
      if (kind === 'id' && !thaiIdCheckOk(d)) warn = t('pp.warn.idcheck');
    }
    el.ppTargetWarn.textContent = warn;
    el.ppTargetWarn.hidden = !warn;
  }

  bindFilter(el.ppTarget, filterDigits, function () { renderTargetInfo(); persistTarget(); });
  bindFilter(el.ppAmount, filterAmount, persistAmount);
  el.input.addEventListener('input', function () { if (errorState) hideError(); persistText(); });

  /* ======================================================================
     QR generation
     ====================================================================== */
  function buildQr(text) {
    var levels = ['M', 'L'];     // fall back to lower error correction for long text
    var lastError;
    for (var i = 0; i < levels.length; i++) {
      try {
        var qr = qrcode(0, levels[i]);   // 0 = pick the smallest version that fits
        qr.addData(text, 'Byte');
        qr.make();
        return qr;
      } catch (err) { lastError = err; }
    }
    throw lastError;
  }

  /* Always black on white with a white border, whatever the theme (so it scans) */
  function drawQr(qr) {
    var n = qr.getModuleCount();
    var total = n + QUIET_ZONE * 2;
    var scale = Math.max(4, Math.floor(TARGET_PX / total));   // whole pixels per module = crisp edges
    var size = total * scale;

    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + QUIET_ZONE) * scale, (r + QUIET_ZONE) * scale, scale, scale);
        }
      }
    }
    return canvas;
  }

  /* ---------- errors ---------- */
  function showError(key, params) {
    errorState = { key: key, params: params };
    renderError();
  }
  function renderError() {
    if (!errorState) { el.error.textContent = ''; el.error.hidden = true; return; }
    el.error.textContent = t(errorState.key, errorState.params);
    el.error.hidden = false;
  }
  function hideError() {
    errorState = null;
    renderError();
  }

  /* ---------- result ---------- */
  function hideResult() {
    closePopover();
    if (openLayerName === 'sheet') closeLayer(false);
    el.result.hidden = true;
    el.qrImg.removeAttribute('src');
    el.status.textContent = '';
    result = null;
  }

  function renderResult() {
    if (!result) return;
    el.hint.textContent = t(isTouchMode() ? 'hint.touch' : 'hint.click');
    el.sheetTitle.textContent = t(result.mode === 'promptpay' ? 'sheet.titlePP' : 'sheet.title');
    if (result.mode === 'promptpay') {
      var info = result.info;
      el.ppInfoType.textContent = t('type.' + info.kind);
      el.ppInfoTo.textContent = info.masked;
      el.ppInfoAmount.textContent = info.amount ? t('pp.amountFmt', { amt: formatMoney(info.amount) }) : t('pp.noAmount');
      el.ppWarn.textContent = t('pp.warn.idcheckResult');
      el.ppWarn.hidden = !info.idWarn;
    } else {
      el.ppWarn.hidden = true;
    }
  }

  function showQr(text, meta) {
    var qr;
    try {
      qr = buildQr(text);
    } catch (err) {
      hideResult();
      return false;
    }

    hideError();
    closePopover();

    var canvas = drawQr(qr);
    result = {
      mode: meta.mode,
      text: text,
      fileName: meta.fileName,
      info: meta.info || null,
      blob: null,
      dataUrl: canvas.toDataURL('image/png')
    };
    var mine = result;
    canvas.toBlob(function (blob) { mine.blob = blob; }, 'image/png');

    el.qrImg.src = result.dataUrl;
    el.status.textContent = '';
    renderResult();
    el.result.hidden = false;

    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (el.result.scrollIntoView) {
      el.result.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'nearest' });
    }
    return true;
  }

  function generateText() {
    var text = el.input.value.trim();
    if (!text) {
      hideResult();
      showError('err.textEmpty');
      el.input.focus();
      return;
    }
    if (!showQr(text, { mode: 'text', fileName: 'qrcode.png' })) {
      showError('err.textLong');
      el.input.focus();
    }
  }

  function generatePromptPay() {
    var target = el.ppTarget.value;
    var kind = targetKind(target);

    if (!kind) {
      hideResult();
      showError('err.ppLength');
      el.ppTarget.focus();
      return;
    }
    if (kind === 'phone' && target.charAt(0) !== '0') {
      hideResult();
      showError('err.ppPhone0');
      el.ppTarget.focus();
      return;
    }
    var amount = parseAmount(el.ppAmount.value);
    if (!amount.ok) {
      hideResult();
      showError('err.amountInvalid');
      el.ppAmount.focus();
      return;
    }

    var payload = promptPayPayload(target, amount.value);
    var ok = showQr(payload, {
      mode: 'promptpay',
      fileName: 'promptpay-qr.png',
      info: {
        kind: kind,
        masked: maskTarget(target),
        amount: amount.value,
        idWarn: kind === 'id' && !thaiIdCheckOk(target)
      }
    });
    if (!ok) showError('err.qr');
  }

  function generate() {
    persistInputs();
    if (mode === 'promptpay') generatePromptPay(); else generateText();
  }

  /* Clear empties the boxes of the current mode AND forgets what was saved for them */
  function clearAll() {
    if (mode === 'promptpay') {
      el.ppTarget.value = '';
      el.ppAmount.value = '';
      lsDel(KEY.ppTarget);
      lsDel(KEY.ppAmount);
      renderTargetInfo();
    } else {
      el.input.value = '';
      lsDel(KEY.text);
    }
    hideError();
    hideResult();
    (mode === 'promptpay' ? el.ppTarget : el.input).focus();
  }

  el.generateBtn.addEventListener('click', generate);
  el.clearBtn.addEventListener('click', clearAll);

  // Ctrl/Cmd + Enter generates in the text box, Enter alone still inserts a new line
  el.input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      generate();
    }
  });
  // PromptPay boxes: Enter on the first goes to the amount, Enter on the amount generates
  el.ppTarget.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); el.ppAmount.focus(); }
  });
  el.ppAmount.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); generate(); }
  });

  /* ======================================================================
     Download / share
     ====================================================================== */
  function isTouchMode() {
    return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  function flashStatus(msg) {
    el.status.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { el.status.textContent = ''; }, 3000);
  }

  function getBlob() {
    if (!result) return Promise.reject(new Error('No QR code'));
    if (result.blob) return Promise.resolve(result.blob);
    return fetch(result.dataUrl).then(function (r) { return r.blob(); });
  }

  function download() {
    var fileName = result ? result.fileName : 'qrcode.png';
    return getBlob().then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      flashStatus(t('status.downloaded'));
    }).catch(function () {
      flashStatus(t('status.downloadFail'));
    });
  }

  function share() {
    var shareMode = result ? result.mode : 'text';
    var shareText = result ? result.text : '';
    var fileName = result ? result.fileName : 'qrcode.png';
    return getBlob().then(function (blob) {
      var file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: t('share.title') });
      }
      // Without file sharing, text is only worth sharing in Text mode (a PromptPay payload is not readable text)
      if (navigator.share && shareMode === 'text') {
        return navigator.share({ title: t('share.title'), text: shareText });
      }
      return download();
    }).catch(function (err) {
      if (err && err.name === 'AbortError') return;      // user closed the share sheet
      return download();                                  // anything else: fall back to saving
    });
  }

  /* ---------- Desktop pop-over ---------- */
  function openPopover() {
    el.popover.hidden = false;
    el.qrBtn.setAttribute('aria-expanded', 'true');
    el.popDownload.focus();
  }
  function closePopover(restoreFocus) {
    if (el.popover.hidden) return;
    el.popover.hidden = true;
    el.qrBtn.setAttribute('aria-expanded', 'false');
    if (restoreFocus) el.qrBtn.focus();
  }

  el.qrBtn.addEventListener('click', function () {
    if (isTouchMode()) {
      openLayer('sheet');
    } else if (el.popover.hidden) {
      openPopover();
    } else {
      closePopover(true);
    }
  });

  // Long-press on touch devices fires "contextmenu": show our sheet instead of the browser's
  el.qrBtn.addEventListener('contextmenu', function (e) {
    if (isTouchMode()) {
      e.preventDefault();
      openLayer('sheet');
    }
  });

  el.popDownload.addEventListener('click', function () {
    closePopover(true);
    download();
  });

  document.addEventListener('click', function (e) {
    if (!el.popover.hidden && !e.target.closest('.qr-wrap')) closePopover();
  });

  /* ======================================================================
     Drawer (left) + action sheet (bottom) — modal layers
     ====================================================================== */
  function setBackgroundInert(on) {
    [el.topbar, el.main].forEach(function (node) { node.toggleAttribute('inert', on); });
  }

  function openLayer(name) {
    if (openLayerName) closeLayer(false);
    closePopover();

    var node = name === 'drawer' ? el.drawer : el.sheet;
    openLayerName = name;
    node.removeAttribute('inert');
    node.classList.add('open');
    el.scrim.classList.add('show');
    setBackgroundInert(true);

    if (name === 'drawer') {
      el.menuBtn.setAttribute('aria-expanded', 'true');
      var checked = langRadios.filter(function (r) { return r.checked; })[0];
      (checked || el.closeMenu).focus();
    } else {
      el.sheetShare.hidden = !navigator.share;
      el.sheetDownload.focus();
    }
  }

  function closeLayer(restoreFocus) {
    if (!openLayerName) return;
    var name = openLayerName;
    var node = name === 'drawer' ? el.drawer : el.sheet;
    openLayerName = null;

    node.classList.remove('open');
    node.setAttribute('inert', '');
    el.scrim.classList.remove('show');
    setBackgroundInert(false);
    el.menuBtn.setAttribute('aria-expanded', 'false');

    if (restoreFocus !== false) {
      (name === 'drawer' ? el.menuBtn : el.qrBtn).focus();
    }
  }

  el.menuBtn.addEventListener('click', function () { openLayer('drawer'); });
  el.closeMenu.addEventListener('click', function () { closeLayer(); });
  el.scrim.addEventListener('click', function () { closeLayer(); });
  el.sheetCancel.addEventListener('click', function () { closeLayer(); });

  el.sheetDownload.addEventListener('click', function () {
    closeLayer();
    download();
  });
  el.sheetShare.addEventListener('click', function () {
    closeLayer();
    share();
  });

  /* Menu choices. "click" (not "change") so that tapping the option that is already
     selected still behaves the same way.
       Language → menu stays open (the change is visible right away)
       Mode, Theme → menu closes */
  langRadios.forEach(function (r) {
    r.addEventListener('click', function () { setLang(r.value, true); });
  });
  modeRadios.forEach(function (r) {
    r.addEventListener('click', function () { setMode(r.value, true); closeLayer(); });
  });
  themeRadios.forEach(function (r) {
    r.addEventListener('click', function () { applyTheme(r.value, true); closeLayer(); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (openLayerName) closeLayer();
    else closePopover(true);
  });

  // Rotating the device / resizing: close anything that is open
  window.addEventListener('orientationchange', function () { closeLayer(false); closePopover(); });

  /* ======================================================================
     Toast + version check (top-right "vX.Y" button)
     ====================================================================== */
  function toast(msg, sticky) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    if (!sticky) toastTimer = setTimeout(function () { el.toast.classList.remove('show'); }, TOAST_MS);
  }

  /* Read the version number that is on the server right now (never from any cache).
     A network failure rejects with a plain TypeError/AbortError; other problems carry .kind. */
  function fetchRemoteVersion() {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
    return fetch('js/version.js?_vc=' + Date.now(), { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        if (!res.ok) { var e = new Error('HTTP ' + res.status); e.kind = 'http'; throw e; }
        return res.text();
      })
      .then(function (text) {
        var m = /APP_VERSION\s*=\s*['"]([^'"]+)['"]/.exec(text);
        if (!m) { var e = new Error('version not found'); e.kind = 'parse'; throw e; }
        return m[1];
      })
      .then(
        function (v) { clearTimeout(timer); return v; },
        function (err) { clearTimeout(timer); throw err; }
      );
  }

  /* Make the new files active. Resolves true when it is safe to reload, false if it did not finish. */
  function activateNewVersion() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return Promise.resolve(true);
    return navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg) return true;                    // no Service Worker: a plain reload is all there is
      return new Promise(function (resolve) {
        var settled = false;
        var timer = setTimeout(function () { done(false); }, 12000);
        function done(ok) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          navigator.serviceWorker.removeEventListener('controllerchange', onChange);
          resolve(ok);
        }
        function onChange() { done(true); }
        navigator.serviceWorker.addEventListener('controllerchange', onChange);

        reg.update().then(function () {
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });   // installed, not yet in charge
          else if (!reg.installing) done(true);                                 // nothing pending: newest worker already active
        }).catch(function () { done(false); });
      });
    });
  }

  function checkForUpdate() {
    if (checkingUpdate) return;
    checkingUpdate = true;
    el.versionBtn.classList.add('checking');
    el.versionBtn.setAttribute('aria-busy', 'true');
    var finish = function () {
      checkingUpdate = false;
      el.versionBtn.classList.remove('checking');
      el.versionBtn.removeAttribute('aria-busy');
    };

    if (navigator.onLine === false) {
      toast(t('ver.offline'));
      finish();
      return;
    }
    toast(t('ver.checking'), true);

    fetchRemoteVersion().then(function (remote) {
      if (remote === APP_VERSION) {
        toast(t('ver.latest'));
        finish();
        return;
      }
      toast(t('ver.updating', { v: 'v' + remote }), true);
      return activateNewVersion().then(function (ok) {
        if (!ok) {
          toast(t('ver.updateFailed'));
          finish();
          return;
        }
        persistInputs();                           // saved boxes survive the reload
        try { sessionStorage.setItem(KEY.updated, remote); } catch (e) { /* ignore */ }
        location.reload();
      });
    }).catch(function (err) {
      var networkDown = !(err && err.kind);         // fetch itself failed → offline / unreachable
      toast(t(networkDown && location.protocol !== 'file:' ? 'ver.offline' : 'ver.failed'));
      finish();
    });
  }

  el.versionBtn.addEventListener('click', checkForUpdate);

  /* After an update reload: confirm which version is now running */
  function announceUpdate() {
    var from;
    try {
      from = sessionStorage.getItem(KEY.updated);
      sessionStorage.removeItem(KEY.updated);
    } catch (e) { return; }
    if (!from) return;
    toast(from === APP_VERSION ? t('ver.updated', { v: 'v' + APP_VERSION }) : t('ver.updateFailed'));
  }

  /* ======================================================================
     Init
     ====================================================================== */
  var savedLang = lsGet(KEY.lang);
  if (savedLang !== 'en' && savedLang !== 'th') {      // first run: follow the browser, then remember it
    savedLang = detectLang();
    lsSet(KEY.lang, savedLang);
  }
  var savedMode = lsGet(KEY.mode);

  restoreInputs();
  applyTheme(root.getAttribute('data-theme') || DEFAULT_THEME, false);
  setMode(savedMode === 'promptpay' ? 'promptpay' : 'text', false);
  setLang(savedLang, false);          // also draws every translated string
  announceUpdate();

  /* ---------- Service worker (offline + installable) ---------- */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      // updateViaCache:'none' = always look at the server (not the HTTP cache) for sw.js and version.js
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
        .catch(function () { /* offline support is optional */ });
    });
  }
})();
