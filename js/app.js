/* ==========================================================================
   QR Code Generator PWA — app.js
   Depends on js/vendor/qrcode.js (qrcode-generator by Kazuhiko Arase, MIT).
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Config ---------- */
  var THEMES = ['blue', 'green', 'red', 'purple', 'orange', 'teal', 'pink', 'slate'];
  var DEFAULT_THEME = 'blue';
  var THEME_KEY = 'qr-generator-theme';
  var QUIET_ZONE = 4;        // modules of white border (QR spec minimum)
  var TARGET_PX = 1024;      // approximate size of the exported PNG
  var FILE_NAME = 'qrcode.png';

  /* ---------- Elements ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var el = {
    topbar: $('topbar'), main: $('main'),
    input: $('input'), error: $('error'),
    generateBtn: $('generateBtn'), clearBtn: $('clearBtn'),
    result: $('result'), qrBtn: $('qrBtn'), qrImg: $('qrImg'),
    popover: $('popover'), popDownload: $('popDownload'),
    hint: $('qrHint'), status: $('status'),
    menuBtn: $('menuBtn'), closeMenu: $('closeMenu'),
    drawer: $('drawer'), scrim: $('scrim'),
    sheet: $('sheet'), sheetDownload: $('sheetDownload'),
    sheetShare: $('sheetShare'), sheetCancel: $('sheetCancel')
  };
  var themeRadios = Array.prototype.slice.call(document.querySelectorAll('input[name="theme"]'));
  var metaTheme = document.querySelector('meta[name="theme-color"]');

  var state = { text: '', blob: null, dataUrl: '' };
  var openLayerName = null;     // 'drawer' | 'sheet' | null
  var statusTimer = null;

  /* ---------- Make the QR library encode UTF-8 (Thai, emoji, …) ---------- */
  if (window.qrcode && qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  }

  /* ======================================================================
     Themes
     ====================================================================== */
  function applyTheme(name, persist) {
    if (THEMES.indexOf(name) === -1) name = DEFAULT_THEME;
    root.setAttribute('data-theme', name);
    themeRadios.forEach(function (r) { r.checked = (r.value === name); });

    // keep the browser / status-bar colour in step with the page background
    var bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (bg && metaTheme) metaTheme.setAttribute('content', bg);

    if (persist) {
      try { localStorage.setItem(THEME_KEY, name); } catch (e) { /* private mode */ }
    }
  }

  themeRadios.forEach(function (r) {
    r.addEventListener('change', function () { if (r.checked) applyTheme(r.value, true); });
  });

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

  function showError(msg) {
    el.error.textContent = msg;
    el.error.hidden = false;
  }
  function hideError() {
    el.error.textContent = '';
    el.error.hidden = true;
  }

  function hideResult() {
    closePopover();
    if (openLayerName === 'sheet') closeLayer(false);
    el.result.hidden = true;
    el.qrImg.removeAttribute('src');
    el.status.textContent = '';
    state.text = '';
    state.blob = null;
    state.dataUrl = '';
  }

  function generate() {
    var text = el.input.value.trim();
    if (!text) {
      hideResult();
      showError('Please enter some text or a URL first.');
      el.input.focus();
      return;
    }

    var qr;
    try {
      qr = buildQr(text);
    } catch (err) {
      hideResult();
      showError('That text is too long to fit in a QR code. Please shorten it.');
      el.input.focus();
      return;
    }

    hideError();
    closePopover();

    var canvas = drawQr(qr);
    state.text = text;
    state.dataUrl = canvas.toDataURL('image/png');
    state.blob = null;
    canvas.toBlob(function (blob) { state.blob = blob; }, 'image/png');

    el.qrImg.src = state.dataUrl;
    el.hint.textContent = isTouchMode()
      ? 'Tap the QR code to download or share it.'
      : 'Click the QR code to download it.';
    el.status.textContent = '';
    el.result.hidden = false;

    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (el.result.scrollIntoView) {
      el.result.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  function clearAll() {
    el.input.value = '';
    hideError();
    hideResult();
    el.input.focus();
  }

  el.generateBtn.addEventListener('click', generate);
  el.clearBtn.addEventListener('click', clearAll);

  // Ctrl/Cmd + Enter generates, Enter alone still inserts a new line
  el.input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      generate();
    }
  });
  el.input.addEventListener('input', function () { if (!el.error.hidden) hideError(); });

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
    if (state.blob) return Promise.resolve(state.blob);
    if (!state.dataUrl) return Promise.reject(new Error('No QR code'));
    return fetch(state.dataUrl).then(function (r) { return r.blob(); });
  }

  function download() {
    return getBlob().then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = FILE_NAME;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      flashStatus('QR code downloaded.');
    }).catch(function () {
      flashStatus('Could not download the image.');
    });
  }

  function share() {
    return getBlob().then(function (blob) {
      var file = new File([blob], FILE_NAME, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: 'QR Code' });
      }
      if (navigator.share) {
        return navigator.share({ title: 'QR Code', text: state.text });
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
     Drawer + action sheet (modal layers)
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
      var checked = themeRadios.filter(function (r) { return r.checked; })[0];
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

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (openLayerName) closeLayer();
    else closePopover(true);
  });

  // Rotating the device / resizing: close anything that is open
  window.addEventListener('orientationchange', function () { closeLayer(false); closePopover(); });

  /* ======================================================================
     Init
     ====================================================================== */
  applyTheme(root.getAttribute('data-theme') || DEFAULT_THEME, false);

  /* ---------- Service worker (offline + installable) ---------- */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline support is optional */ });
    });
  }
})();
