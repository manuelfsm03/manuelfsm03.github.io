document.addEventListener('DOMContentLoaded', function () {
  // ---- Language toggle (session-only, no storage; defaults to Spanish) ----
  var body = document.body;
  var langBtn = document.querySelector('.lang-toggle');

  function setLang(lang) {
    body.setAttribute('data-lang', lang);
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
});
