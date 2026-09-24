document.addEventListener('DOMContentLoaded', function () {
  // ---- Language toggle (persists across pages via ?lang=en in URLs; no storage; defaults to Spanish) ----
  var body = document.body;
  var langBtn = document.querySelector('.lang-toggle');

  // Rewrite internal .html links so the chosen language follows the visitor
  function syncLinks(lang) {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (!/^\/?[A-Za-z0-9._-]+\.html([?#].*)?$/.test(href)) { return; }
      var hashIdx = href.indexOf('#');
      var hash = hashIdx > -1 ? href.slice(hashIdx) : '';
      var base = (hashIdx > -1 ? href.slice(0, hashIdx) : href).split('?')[0];
      a.setAttribute('href', lang === 'en' ? base + '?lang=en' + hash : base + hash);
    });
  }

  function setLang(lang) {
    body.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    var t = body.getAttribute('data-title-' + lang);
    if (t) { document.title = t; }
    if (langBtn) {
      langBtn.textContent = lang === 'es' ? 'EN' : 'ES';
      langBtn.setAttribute('aria-label', lang === 'es' ? 'Switch to English' : 'Cambiar a español');
    }
    syncLinks(lang);
    if (window.history && history.replaceState) {
      history.replaceState(null, '', location.pathname + (lang === 'en' ? '?lang=en' : '') + location.hash);
    }
  }
  var initialLang = 'es';
  try {
    if (new URLSearchParams(location.search).get('lang') === 'en') { initialLang = 'en'; }
  } catch (e) { /* URLSearchParams no disponible: queda español */ }
  setLang(initialLang);

  if (langBtn) {
    langBtn.addEventListener('click', function () {
      var current = body.getAttribute('data-lang');
      setLang(current === 'es' ? 'en' : 'es');
    });
  }

  // ---- Active nav link based on current page (ignoring ?lang=en and hashes) ----
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.rh-links a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').split('?')[0].split('#')[0].split('/').pop();
    if (href === here) { a.classList.add('active'); }
  });

  // ---- "Esta versión: <mes> <año>" from the deploy date (GitHub Pages sends Last-Modified).
  // Without that header the browser reports "now", so anything under a minute old keeps the static text.
  var lm = new Date(document.lastModified);
  if (!isNaN(lm.getTime()) && Date.now() - lm.getTime() > 60000) {
    var months = {
      es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    var y = lm.getFullYear(), m = lm.getMonth();
    document.querySelectorAll('time.js-version').forEach(function (el) {
      var holder = el.closest('[data-lang]');
      var lang = holder ? holder.getAttribute('data-lang') : 'es';
      el.textContent = lang === 'en' ? months.en[m] + ' ' + y : months.es[m] + ' de ' + y;
      el.setAttribute('datetime', y + '-' + (m < 9 ? '0' : '') + (m + 1));
    });
  }

  // ---- Figura 1: move "today" and the ongoing bars to the actual date ----
  // Positions are months since January 2022; the static HTML is correct as of September 2026.
  var tl = document.querySelector('.tl');
  if (tl) {
    var BASE = 2022;
    var now = new Date();
    var t = (now.getFullYear() - BASE) * 12 + now.getMonth() + (now.getDate() - 1) / 31;
    var span = parseFloat(tl.style.getPropertyValue('--span')) || 72;
    var needed = (now.getFullYear() - BASE + 1) * 12;
    if (needed > span) {
      span = needed;
      tl.style.setProperty('--span', span);
      var years = tl.querySelector('.tl-years');
      if (years) {
        var html = '';
        for (var yr = BASE; yr < BASE + span / 12; yr++) {
          html += '<span style="--y:' + (yr - BASE) * 12 + '">' + yr + '</span>';
        }
        years.innerHTML = html;
      }
      document.querySelectorAll('.js-tl-end').forEach(function (el) { el.textContent = BASE + span / 12 - 1; });
    }
    tl.querySelectorAll('.tl-bar.ongoing').forEach(function (bar) {
      var s = parseFloat(bar.style.getPropertyValue('--s')) || 0;
      bar.style.setProperty('--e', Math.max(t, s + 0.5).toFixed(2));
    });
    var today = tl.querySelector('.tl-today');
    if (today) { today.style.setProperty('--t', t.toFixed(2)); }
  }
});
