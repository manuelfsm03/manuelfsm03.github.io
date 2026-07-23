document.addEventListener('DOMContentLoaded', function () {
  // ---- Language toggle (session-only, no storage; defaults to Spanish) ----
  var body = document.body;
  var langBtn = document.querySelector('.lang-toggle');

  function setLang(lang) {
    body.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    var t = body.getAttribute('data-title-' + lang);
    if (t) { document.title = t; }
    if (langBtn) {
      langBtn.textContent = lang === 'es' ? 'EN' : 'ES';
      langBtn.setAttribute('aria-label', lang === 'es' ? 'Switch to English' : 'Cambiar a español');
    }
  }
  setLang('es');

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

  // ---- Active nav link based on current page ----
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href');
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
});
