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

  // ---- Mobile nav toggle ----
  var navToggle = document.querySelector('.nav-toggle-btn');
  var navLinks = document.querySelector('nav.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      var expanded = navLinks.classList.contains('open');
      navToggle.setAttribute('aria-expanded', expanded);
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { navLinks.classList.remove('open'); });
    });
  }

  // ---- Active nav link based on current page (ignoring ?lang=en and hashes) ----
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.nav-links a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').split('?')[0].split('#')[0].split('/').pop();
    if (href === here || (here === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // ---- Ticker (home only): illustrative figures, explicitly labeled as not live ----
  var tickerTrack = document.getElementById('tickerTrack');
  if (tickerTrack) {
    var markets = [
      { sym: 'MERVAL',  name: 'BA',    price: '2.145.300', chg: '1.2%',   up: true },
      { sym: 'S&P 500', name: 'US',    price: '6.310',     chg: '0.4%',   up: true },
      { sym: 'USD/ARS', name: 'MEP',   price: '1.480',     chg: '0.3%',   up: false },
      { sym: 'SOJA',    name: 'CBOT',  price: '412.50',    chg: '0.8%',   up: true },
      { sym: 'MAÍZ',    name: 'CBOT',  price: '178.25',    chg: '0.2%',   up: false },
      { sym: 'TRIGO',   name: 'CBOT',  price: '221.75',    chg: '1.5%',   up: true },
      { sym: 'UST 10Y', name: 'yield', price: '4.12%',     chg: '5 bps',  up: false },
      { sym: 'XAU',     name: 'oro',   price: '3.180',     chg: '0.6%',   up: true }
    ];
    function tickHTML(m) {
      var arrow = m.up
        ? '<span class="up">▲' + m.chg + '</span>'
        : '<span class="down">▼' + m.chg + '</span>';
      return '<span class="tick"><b>' + m.sym + '</b><span class="tname">' + m.name + '</span><span>' + m.price + '</span>' + arrow + '</span>';
    }
    // Duplicated once for a seamless marquee loop
    tickerTrack.innerHTML = markets.map(tickHTML).join('') + markets.map(tickHTML).join('');
  }

  // ---- Side index: highlight the section in view ----
  var toc = document.querySelector('.side-toc');
  if (toc) {
    var tocLinks = toc.querySelectorAll('a');
    var anchors = [];
    tocLinks.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (el) { anchors.push({ el: el, link: a }); }
    });
    function updateToc() {
      var y = window.scrollY + 110;
      var current = null;
      anchors.forEach(function (s) {
        var top = s.el.getBoundingClientRect().top + window.scrollY;
        if (top <= y) { current = s.link; }
      });
      tocLinks.forEach(function (a) { a.classList.remove('toc-active'); });
      (current || (anchors[0] && anchors[0].link)).classList.add('toc-active');
    }
    window.addEventListener('scroll', updateToc, { passive: true });
    updateToc();
  }
});
