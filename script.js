document.addEventListener('DOMContentLoaded', function () {
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) { n.setAttribute(k, attrs[k]); }
    if (parent) { parent.appendChild(n); }
    return n;
  }
  document.documentElement.classList.add('js');
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
    document.dispatchEvent(new CustomEvent('langchange'));
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

  // ---- Tile maps of Argentina: one small square per ~90 km cell, coloured by province ----
  // Grid rasterised from INDEC/IGN department boundaries (github.com/mgaitan/departamentos_argentina),
  // latitude-corrected; CABA is smaller than a cell and gets the cell its centre falls in.
  var AR = {
    cols: 24,
    rows: [
      "...........QQ",
      "........JJQQQI",
      "........JJQQQI",
      ".......QJJJQQIII",
      "......QQQQQQQDDII",
      "......CCQQQQDDDDIII",
      "......CCQQQVVVDDIII...N",
      "......CCCXXVVVDDDD....N",
      "......CCCXVVVVDDDDF..NN",
      ".....LCCCCVVVVUUUFFFF",
      ".....LLLLCVVVVUUUFFFF",
      "....RRLLLCVVVVUUUFFF",
      "....RRRLLLGGGVUUUFF",
      "....RRRRLGGGGGUUUHH",
      "....RRRRLGGGGGUUHH",
      "....RRRSSSGGGGUHHH",
      "....MMMMSSGGGGUHHH",
      ".....MMMSSGGGGUUHH",
      ".....MMMSSGGGUAAAA",
      "....MMMMSSGGAAAAAB",
      "....MMMMSSKKAAAAAAA",
      "....MMKKKKKKAAAAAAA",
      "...OMMKKKKKKAAAAAAAA",
      "...OOOKKKKKKAAAAAAAA",
      "...OOOPKKKKKAAAAAAA",
      "...OOOOPPKKKAAAAA",
      "...OOOPPPPPPAA",
      "..OOPPPPPPPPA",
      "..OPPPPPPP.PP",
      "..PPPPPPPP",
      "..EEEEEEEE.E",
      "..EEEEEEEE.E",
      "..EEEEEEEE",
      "..EEEEEEEE",
      "..EEEEEEE",
      "...EEEEE",
      "..TTTTT",
      "..TTTTTT",
      "..TTTTTTT",
      "..TTTTTTT",
      ".TTTTTTT",
      "TTTTTTT",
      "TTTTTT",
      "..TTT",
      "..TTTT..........WWW",
      ".....T.........W",
      "",
      "......W",
      "......WW",
      ".......WWW"
    ],
    names: {"A": "Buenos Aires", "B": "CABA", "C": "Catamarca", "D": "Chaco", "E": "Chubut", "F": "Corrientes", "G": "Córdoba", "H": "Entre Ríos", "I": "Formosa", "J": "Jujuy", "K": "La Pampa", "L": "La Rioja", "M": "Mendoza", "N": "Misiones", "O": "Neuquén", "P": "Río Negro", "Q": "Salta", "R": "San Juan", "S": "San Luis", "T": "Santa Cruz", "U": "Santa Fe", "V": "Santiago del Estero", "W": "Tierra del Fuego", "X": "Tucumán"},
    shade: {"A": 1, "B": 0, "C": 2, "D": 3, "E": 1, "F": 0, "G": 0, "H": 3, "I": 1, "J": 1, "K": 2, "L": 3, "M": 0, "N": 1, "O": 1, "P": 0, "Q": 0, "R": 2, "S": 1, "T": 0, "U": 2, "V": 1, "W": 0, "X": 3}
  };

  var SHADES = ['#1C3C4D', '#2E5A6E', '#58879B', '#8DB2C2'];
  var MESO = { 'Misiones': 1, 'Corrientes': 1, 'Entre Ríos': 1 };
  document.querySelectorAll('svg[data-tilemap]').forEach(function (m) {
    var meso = m.getAttribute('data-tilemap') === 'meso';
    var C = 5, G = 1, U = C + G, W = AR.cols * U, H = AR.rows.length * U, LAB = meso ? 118 : 0;
    m.setAttribute('viewBox', '0 0 ' + (W + LAB) + ' ' + H);
    var groups = {}, cells = {};
    AR.rows.forEach(function (row, r) {
      for (var c = 0; c < row.length; c++) {
        var k = row.charAt(c);
        if (k === '.') { continue; }
        if (!groups[k]) {
          var name = AR.names[k];
          var fill = meso ? (MESO[name] ? 'var(--green)' : '#CFCBBE') : SHADES[AR.shade[k]];
          groups[k] = svgEl('g', { fill: fill }, m);
          svgEl('title', {}, groups[k]).textContent = name;
          cells[k] = [];
        }
        svgEl('rect', { x: c * U, y: r * U, width: C, height: C }, groups[k]);
        cells[k].push([r, c]);
      }
    });
    if (meso) {
      // Labels to the right, with a leader line from each province's centre
      var y0 = -Infinity;
      ['Misiones', 'Corrientes', 'Entre Ríos'].forEach(function (name) {
        var k = Object.keys(AR.names).filter(function (x) { return AR.names[x] === name; })[0];
        var pts = cells[k], cr = 0, cc = 0;
        pts.forEach(function (p) { cr += p[0] / pts.length; cc += p[1] / pts.length; });
        var cx = (cc + .5) * U, cy = (cr + .5) * U, ly = Math.max(cy, y0 + 22);
        y0 = ly;
        svgEl('line', { x1: cx, y1: cy, x2: W + 8, y2: ly }, m);
        svgEl('text', { x: W + 12, y: ly + 6 }, m).textContent = name;
      });
    }
  });

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

  function curLang() { return body.getAttribute('data-lang') === 'en' ? 'en' : 'es'; }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Cover illustration: Anscombe's quartet, refit live ----
  var plot = document.getElementById('ans-plot');
  if (plot) {
    var X = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
    var X4 = [8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8];
    var Y = [
      [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68],
      [9.14, 8.14, 8.74, 8.77, 9.26, 8.10, 6.13, 3.10, 9.13, 7.26, 4.74],
      [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73],
      [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.50, 5.56, 7.91, 6.89]
    ];
    function dataset(k) { var xs = k === 3 ? X4 : X; return xs.map(function (x, i) { return { x: x, y: Y[k][i] }; }); }
    var XMIN = 2, XMAX = 20, YMIN = 2, YMAX = 14;
    var L0 = 34, R0 = 428, T0 = 12, B0 = 302;
    function sx(x) { return L0 + (x - XMIN) / (XMAX - XMIN) * (R0 - L0); }
    function sy(y) { return B0 - (y - YMIN) / (YMAX - YMIN) * (B0 - T0); }

    [4, 8, 12, 16, 20].forEach(function (v) {
      svgEl('line', { 'class': 'ans-gridline', x1: sx(v), x2: sx(v), y1: T0, y2: B0 }, plot);
      svgEl('text', { 'class': 'ans-tick', x: sx(v), y: B0 + 18, 'text-anchor': 'middle' }, plot).textContent = v;
    });
    [4, 8, 12].forEach(function (v) {
      svgEl('line', { 'class': 'ans-gridline', x1: L0, x2: R0, y1: sy(v), y2: sy(v) }, plot);
      svgEl('text', { 'class': 'ans-tick', x: L0 - 8, y: sy(v) + 4, 'text-anchor': 'end' }, plot).textContent = v;
    });
    svgEl('line', { 'class': 'ans-axis', x1: L0, x2: R0, y1: B0, y2: B0 }, plot);
    svgEl('line', { 'class': 'ans-axis', x1: L0, x2: L0, y1: T0, y2: B0 }, plot);
    svgEl('text', { 'class': 'ans-lab', x: R0 - 4, y: B0 - 8, 'text-anchor': 'end' }, plot).textContent = 'x';
    svgEl('text', { 'class': 'ans-lab', x: L0 + 8, y: T0 + 14 }, plot).textContent = 'y';
    var clip = svgEl('clipPath', { id: 'ans-clip' }, svgEl('defs', {}, plot));
    svgEl('rect', { x: L0, y: T0, width: R0 - L0, height: B0 - T0 }, clip);
    var gRes = svgEl('g', { 'clip-path': 'url(#ans-clip)' }, plot);
    var fitLine = svgEl('line', { 'class': 'ans-fit', 'clip-path': 'url(#ans-clip)' }, plot);
    var eq = svgEl('text', { 'class': 'ans-eq', x: L0 + 26, y: T0 + 22 }, plot);
    var gPts = svgEl('g', {}, plot);

    var cur = dataset(0), active = 0, edited = false;
    var resLines = [], dots = [];
    cur.forEach(function (p, i) {
      resLines.push(svgEl('line', { 'class': 'ans-res' }, gRes));
      var g = svgEl('g', { 'data-i': i, style: 'touch-action:none' }, gPts);
      svgEl('circle', { r: 15, fill: 'transparent', style: 'cursor:grab' }, g);
      dots.push(svgEl('circle', { 'class': 'ans-pt', r: 6.5 }, g));
    });

    function fit(pts) {
      var n = pts.length, mx = 0, my = 0, sxx = 0, sxy = 0, syy = 0;
      pts.forEach(function (p) { mx += p.x / n; my += p.y / n; });
      pts.forEach(function (p) { sxx += (p.x - mx) * (p.x - mx); sxy += (p.x - mx) * (p.y - my); syy += (p.y - my) * (p.y - my); });
      var b1 = sxx > 1e-9 ? sxy / sxx : 0, r = sxx > 1e-9 && syy > 1e-9 ? sxy / Math.sqrt(sxx * syy) : 0;
      return { b0: my - b1 * mx, b1: b1, r: r, r2: r * r };
    }
    // R prints a rounded vector with as many decimals as its "longest" element needs
    function rDigits(vals, digits) {
      var rounded = vals.map(function (v) { var f = Math.pow(10, digits); return Math.round(v * f) / f; });
      var d = 0;
      rounded.forEach(function (v) {
        for (var k = 0; k <= digits; k++) { var f = Math.pow(10, k); if (Math.abs(Math.round(v * f) / f - v) < 1e-9) { d = Math.max(d, k); break; } }
      });
      return rounded.map(function (v) { return v.toFixed(d); });
    }
    function sig7(v) { return String(parseFloat(v.toPrecision(7))); }
    function pad(s, w) { while (s.length < w) { s = ' ' + s; } return s; }
    function dec(v, d) { var s = v.toFixed(d); return curLang() === 'es' ? s.replace('.', ',') : s; }
    var consoleEl = document.getElementById('ans-console');
    function render() {
      var f = fit(cur);
      cur.forEach(function (p, i) {
        dots[i].setAttribute('cx', sx(p.x)); dots[i].setAttribute('cy', sy(p.y));
        dots[i].parentNode.firstChild.setAttribute('cx', sx(p.x)); dots[i].parentNode.firstChild.setAttribute('cy', sy(p.y));
        var l = resLines[i];
        l.setAttribute('x1', sx(p.x)); l.setAttribute('x2', sx(p.x));
        l.setAttribute('y1', sy(p.y)); l.setAttribute('y2', sy(f.b0 + f.b1 * p.x));
      });
      fitLine.setAttribute('x1', sx(XMIN)); fitLine.setAttribute('y1', sy(f.b0 + f.b1 * XMIN));
      fitLine.setAttribute('x2', sx(XMAX)); fitLine.setAttribute('y2', sy(f.b0 + f.b1 * XMAX));
      eq.textContent = 'ŷ = ' + dec(f.b0, 2) + (f.b1 < 0 ? ' − ' : ' + ') + dec(Math.abs(f.b1), 2) + ' x';
      svgEl('tspan', { dx: 22 }, eq).textContent = 'R² = ' + dec(f.r2, 2);
      var k = active + 1, co = rDigits([f.b0, f.b1], 3), w = Math.max(11, co[0].length, co[1].length);
      var P = '<span class="pr">&gt;</span> ';
      var lines = [];
      if (edited) { lines.push('<span class="cm"># ' + (curLang() === 'en' ? 'you edited the data by hand' : 'editaste los datos a mano') + '</span>'); }
      lines.push(P + 'm &lt;- lm(y' + k + ' ~ x' + k + ', anscombe)');
      lines.push(P + 'round(coef(m), 3)');
      lines.push(pad('(Intercept)', w) + ' ' + pad('x' + k, w));
      lines.push('<span class="va">' + pad(co[0], w) + ' ' + pad(co[1], w) + '</span>');
      lines.push(P + 'round(summary(m)$r.squared, 3)');
      lines.push('<span class="va">[1] ' + rDigits([f.r2], 3)[0] + '</span>');
      lines.push(P + 'with(anscombe, cor(x' + k + ', y' + k + '))');
      lines.push('<span class="va">[1] ' + sig7(f.r) + '</span>');
      consoleEl.innerHTML = lines.join('\n');
    }

    var segBtns = document.querySelectorAll('#ans-sets button');
    var resetBtn = document.getElementById('ans-reset');
    var anim = null;
    function goTo(k) {
      active = k;
      edited = false;
      resetBtn.hidden = true;
      segBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-set') === k)); });
      var from = cur.map(function (p) { return { x: p.x, y: p.y }; }), to = dataset(k);
      if (anim) { cancelAnimationFrame(anim); anim = null; }
      if (reduceMotion) { cur = to; render(); return; }
      var t0 = null, DUR = 800;
      function step(ts) {
        if (t0 === null) { t0 = ts; }
        var t = Math.min(1, (ts - t0) / DUR), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        cur = from.map(function (p, i) { return { x: p.x + (to[i].x - p.x) * e, y: p.y + (to[i].y - p.y) * e }; });
        render();
        anim = t < 1 ? requestAnimationFrame(step) : null;
      }
      anim = requestAnimationFrame(step);
    }

    // Autoplay I -> II -> III -> IV until the visitor touches anything
    var auto = null, paused = false;
    function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
    if (!reduceMotion) {
      auto = setInterval(function () { if (!paused && !document.hidden) { goTo((active + 1) % 4); } }, 4200);
    }
    var fig = document.getElementById('anscombe');
    fig.addEventListener('pointerenter', function () { paused = true; });
    fig.addEventListener('pointerleave', function () { paused = false; });
    segBtns.forEach(function (b) {
      b.addEventListener('click', function () { stopAuto(); goTo(+b.getAttribute('data-set')); });
    });
    resetBtn.addEventListener('click', function () { goTo(active); });

    var dragging = null;
    function toData(e) {
      var pt = plot.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      var p = pt.matrixTransform(plot.getScreenCTM().inverse());
      var x = XMIN + (p.x - L0) / (R0 - L0) * (XMAX - XMIN), y = YMIN + (B0 - p.y) / (B0 - T0) * (YMAX - YMIN);
      return { x: Math.min(XMAX, Math.max(XMIN, x)), y: Math.min(YMAX, Math.max(YMIN, y)) };
    }
    gPts.addEventListener('pointerdown', function (e) {
      var g = e.target.closest('g[data-i]');
      if (!g) { return; }
      e.preventDefault();
      stopAuto();
      if (anim) { cancelAnimationFrame(anim); anim = null; }
      dragging = +g.getAttribute('data-i');
      dots[dragging].classList.add('drag');
      try { g.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    });
    gPts.addEventListener('pointermove', function (e) {
      if (dragging === null) { return; }
      cur[dragging] = toData(e);
      edited = true;
      resetBtn.hidden = false;
      render();
    });
    function endDrag() { if (dragging !== null) { dots[dragging].classList.remove('drag'); dragging = null; } }
    gPts.addEventListener('pointerup', endDrag);
    gPts.addEventListener('pointercancel', endDrag);
    document.addEventListener('langchange', render);
    render();
  }

  // ---- Side index: hidden while the hero band is on screen (it would sit on the navy grid) ----
  var sideToc = document.querySelector('.side-toc');
  var heroBand = document.querySelector('.hero-band');
  if (sideToc && heroBand) {
    var tocVis = function () { sideToc.classList.toggle('show', heroBand.getBoundingClientRect().bottom < 160); };
    window.addEventListener('scroll', tocVis, { passive: true });
    tocVis();
  } else if (sideToc) {
    sideToc.classList.add('show');
  }
});
