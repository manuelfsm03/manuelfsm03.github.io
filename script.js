document.addEventListener('DOMContentLoaded', function () {
  var body = document.body;
  var SVGNS = 'http://www.w3.org/2000/svg';
  function lang() { return body.getAttribute('data-lang') === 'en' ? 'en' : 'es'; }
  function svgEl(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) { n.setAttribute(k, attrs[k]); }
    if (parent) { parent.appendChild(n); }
    return n;
  }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Language toggle (persists across pages via ?lang=en in URLs; no storage; defaults to Spanish) ----
  var langBtn = document.querySelector('.lang-toggle');

  // Rewrite internal .html links so the chosen language follows the visitor
  function syncLinks(l) {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (!/^\/?[A-Za-z0-9._-]+\.html([?#].*)?$/.test(href)) { return; }
      var hashIdx = href.indexOf('#');
      var hash = hashIdx > -1 ? href.slice(hashIdx) : '';
      var base = (hashIdx > -1 ? href.slice(0, hashIdx) : href).split('?')[0];
      a.setAttribute('href', l === 'en' ? base + '?lang=en' + hash : base + hash);
    });
  }

  function setLang(l) {
    body.setAttribute('data-lang', l);
    document.documentElement.setAttribute('lang', l);
    var t = body.getAttribute('data-title-' + l);
    if (t) { document.title = t; }
    if (langBtn) {
      langBtn.textContent = l === 'es' ? 'EN' : 'ES';
      langBtn.setAttribute('aria-label', l === 'es' ? 'Switch to English' : 'Cambiar a español');
    }
    syncLinks(l);
    try {
      history.replaceState(null, '', location.pathname + (l === 'en' ? '?lang=en' : '') + location.hash);
    } catch (e) { /* some sandboxes refuse replaceState */ }
    document.dispatchEvent(new CustomEvent('langchange'));
  }
  var initialLang = 'es';
  try {
    if (new URLSearchParams(location.search).get('lang') === 'en') { initialLang = 'en'; }
  } catch (e) { /* URLSearchParams no disponible: queda español */ }

  if (langBtn) {
    langBtn.addEventListener('click', function () { setLang(lang() === 'es' ? 'en' : 'es'); });
  }

  // ---- Active nav link based on current page (ignoring ?lang=en and hashes) ----
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.masthead nav a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').split('?')[0].split('#')[0].split('/').pop();
    if (href === here) { a.classList.add('active'); }
  });

  // ---- "Septiembre de 2026" from the deploy date (GitHub Pages sends Last-Modified).
  // Without that header the browser reports "now", so anything under a minute old keeps the static text.
  var lm = new Date(document.lastModified);
  if (!isNaN(lm.getTime()) && Date.now() - lm.getTime() > 60000) {
    var MONTHS = {
      es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    document.querySelectorAll('.js-version').forEach(function (el) {
      var holder = el.closest('[data-lang]');
      var l = holder ? holder.getAttribute('data-lang') : 'es';
      el.textContent = l === 'en' ? MONTHS.en[lm.getMonth()] + ' ' + lm.getFullYear() : MONTHS.es[lm.getMonth()] + ' de ' + lm.getFullYear();
    });
  }

  // ---- Tile maps of Argentina's 24 jurisdictions ([name, column, row]) ----
  var TILES = [
    ['Jujuy', 1, 0], ['Salta', 2, 0], ['Formosa', 3, 0], ['Misiones', 4, 0],
    ['Catamarca', 0, 1], ['Tucumán', 1, 1], ['Santiago del Estero', 2, 1], ['Chaco', 3, 1], ['Corrientes', 4, 1],
    ['San Juan', 0, 2], ['La Rioja', 1, 2], ['Córdoba', 2, 2], ['Santa Fe', 3, 2], ['Entre Ríos', 4, 2],
    ['Mendoza', 0, 3], ['San Luis', 1, 3], ['La Pampa', 2, 3], ['Buenos Aires', 3, 3], ['CABA', 4, 3],
    ['Neuquén', 1, 4], ['Río Negro', 2, 4], ['Chubut', 2, 5], ['Santa Cruz', 2, 6], ['Tierra del Fuego', 3, 7]
  ];
  var MESO = { 'Misiones': 1, 'Corrientes': 1, 'Entre Ríos': 1 };
  document.querySelectorAll('svg[data-tilemap]').forEach(function (m) {
    var meso = m.getAttribute('data-tilemap') === 'meso';
    var color = meso ? 'var(--green)' : 'var(--blue)';
    var S = 18, G = 3, extra = meso ? 78 : 0;
    m.setAttribute('viewBox', '0 0 ' + (5 * (S + G) + extra) + ' ' + (8 * (S + G)));
    TILES.forEach(function (t) {
      var on = !meso || MESO[t[0]];
      var r = svgEl('rect', { x: t[1] * (S + G), y: t[2] * (S + G), width: S, height: S, rx: 2.5, fill: on ? color : 'var(--rule)' }, m);
      svgEl('title', {}, r).textContent = t[0];
      if (meso && on) {
        svgEl('text', { x: 5 * (S + G) + 5, y: t[2] * (S + G) + S / 2 + 4 }, m).textContent = t[0];
      }
    });
  });

  // ---- Figura 1: career timeline built from the CV ----
  var tl = document.getElementById('tl');
  if (tl) {
    var BASE = 2022;
    var MES = {
      es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
      en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    };
    var TL = [
      { k: 'edu', org: 'UBA', role: ['Licenciatura en Economía', 'BA in Economics'], s: [2022, 3], e: [2025, 12],
        d: ['Promedio 7,76/10. Diploma de honor.', 'GPA 7.76/10. Honors diploma.'] },
      { k: 'work', org: 'TheMindCo', role: ['consultoría', 'consulting'], s: [2024, 2], e: [2026, 2],
        d: ['Entré como analista de investigación y seguí como consultor de estrategia.', 'Started as a research analyst, then strategy consultant.'] },
      { k: 'teach', org: 'FCE-UBA', role: ['Microeconomía II', 'Microeconomics II'], s: [2025, 3],
        d: ['Ayudante, cátedra Ojeda: clases prácticas de teoría de juegos.', 'TA, Ojeda chair: problem sessions on game theory.'] },
      { k: 'research', org: 'IIEP', role: ['becario PROPAI', 'PROPAI fellow'], s: [2025, 4],
        d: ['Equipo de Modelos Económicos de Simulación (MESi).', 'Economic Simulation Models team (MESi).'] },
      { k: 'work', org: 'Bunge', role: ['Economic Research', 'Economic Research'], s: [2026, 3],
        d: ['Datos, modelos y proyecciones para los mercados de granos del Cono Sur.', 'Data, models, and projections for Southern Cone grain markets.'] },
      { k: 'teach', org: 'FCE-UBA', role: ['Lab. de Métodos Cuantitativos', 'Quantitative Methods Lab'], s: [2026, 3],
        d: ['Ayudante, cátedra Morrone: cálculo y optimización con Python.', 'TA, Morrone chair: calculus and optimization in Python.'] },
      { k: 'proj', org: '', role: ['Maestría en Economía', "Master's in Economics"], s: [2027, 1], e: [2027, 12],
        d: ['La quiero empezar en 2027. Lo punteado es proyección.', 'Planned for 2027. Dashed means projected.'] }
    ];
    var KINDS = [
      { k: 'work', n: ['empresas', 'industry'], c: 'var(--gold)' },
      { k: 'research', n: ['investigación', 'research'], c: 'var(--blue)' },
      { k: 'teach', n: ['docencia', 'teaching'], c: 'var(--green)' },
      { k: 'edu', n: ['formación', 'education'], c: 'var(--gray)' },
      { k: 'proj', n: ['proyección', 'projected'], dashed: true }
    ];
    function both(pair) { return '<span data-lang="es">' + pair[0] + '</span><span data-lang="en">' + pair[1] + '</span>'; }
    var today = new Date();
    var tNow = (today.getFullYear() - BASE) * 12 + today.getMonth() + (today.getDate() - 1) / 31;
    var span = Math.max(72, (today.getFullYear() - BASE + 1) * 12);
    tl.style.setProperty('--span', span);
    document.querySelectorAll('.js-tl-end').forEach(function (el) { el.textContent = BASE + span / 12 - 1; });
    function mi(a) { return (a[0] - BASE) * 12 + a[1] - 1; }
    function when(r) {
      var L = lang(), i = L === 'en' ? 1 : 0;
      if (r.k === 'proj') { return String(r.s[0]); }
      return MES[L][r.s[1] - 1] + ' ' + r.s[0] + ' – ' + (r.e ? MES[L][r.e[1] - 1] + ' ' + r.e[0] : ['hoy', 'now'][i]);
    }
    var rows = document.getElementById('tl-rows');
    TL.forEach(function (r, i) {
      var s = mi(r.s), e = r.e ? mi(r.e) + 1 : Math.max(tNow, s + .5);
      var row = document.createElement('div');
      row.className = 'tl-row';
      row.setAttribute('data-k', r.k);
      var label = r.org ? '<b>' + r.org + '</b> <span class="role">— ' + both(r.role) + '</span>' : '<b>' + both(r.role) + '</b> <span class="role">— ' + both(['proyección', 'projected']) + '</span>';
      row.innerHTML = '<span class="tl-label">' + label + '</span>' +
        '<span class="tl-track"><button type="button" class="tl-bar ' + r.k + (r.e ? '' : ' ongoing') + '" data-i="' + i + '" ' +
        'style="--s:' + s + ';--e:' + e.toFixed(2) + ';--i:' + i + '"></button></span>';
      rows.appendChild(row);
    });
    function labelBars() {
      rows.querySelectorAll('.tl-bar').forEach(function (b) {
        var r = TL[+b.getAttribute('data-i')], i = lang() === 'en' ? 1 : 0;
        b.setAttribute('aria-label', (r.org ? r.org + ', ' : '') + r.role[i] + ': ' + when(r));
      });
    }
    labelBars();
    document.addEventListener('langchange', labelBars);
    var years = document.getElementById('tl-years');
    for (var y = BASE; y < BASE + span / 12; y++) {
      var sp = document.createElement('span');
      sp.style.setProperty('--y', (y - BASE) * 12);
      sp.textContent = y;
      years.appendChild(sp);
    }
    document.getElementById('tl-today').style.setProperty('--t', tNow.toFixed(2));

    var tip = document.getElementById('tl-tip');
    function showTip(bar) {
      var r = TL[+bar.getAttribute('data-i')], i = lang() === 'en' ? 1 : 0;
      tip.innerHTML = '<b>' + (r.org ? r.org + ' — ' : '') + r.role[i] + '</b><span class="when">' + when(r) + '</span>' + r.d[i];
      var box = tl.getBoundingClientRect(), b = bar.getBoundingClientRect();
      tip.classList.add('show');
      var half = tip.offsetWidth / 2;
      tip.style.left = Math.min(Math.max(b.left + b.width / 2 - box.left, half), box.width - half) + 'px';
      tip.style.top = (b.top - box.top) + 'px';
    }
    function hideTip() { tip.classList.remove('show'); }
    rows.addEventListener('pointerover', function (e) { var b = e.target.closest('.tl-bar'); if (b) { showTip(b); } });
    rows.addEventListener('pointerout', function (e) { if (e.target.closest('.tl-bar')) { hideTip(); } });
    rows.addEventListener('focusin', function (e) { var b = e.target.closest('.tl-bar'); if (b) { showTip(b); } });
    rows.addEventListener('focusout', hideTip);

    var chips = document.getElementById('tl-chips');
    var only = null;
    KINDS.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<span class="sw' + (k.dashed ? ' dashed' : '') + '"' + (k.c ? ' style="background:' + k.c + '"' : '') + '></span>' + both(k.n);
      b.addEventListener('click', function () {
        only = only === k.k ? null : k.k;
        chips.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        if (only) { b.setAttribute('aria-pressed', 'true'); }
        rows.querySelectorAll('.tl-row').forEach(function (row) { row.classList.toggle('dim', !!only && row.getAttribute('data-k') !== only); });
      });
      chips.appendChild(b);
    });
  }

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
    function dec(v, d) { var s = v.toFixed(d); return lang() === 'es' ? s.replace('.', ',') : s; }
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
      if (edited) { lines.push('<span class="cm"># ' + (lang() === 'en' ? 'you edited the data by hand' : 'editaste los datos a mano') + '</span>'); }
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

  // ---- Copy buttons ----
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var original = btn.innerHTML;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      function done(es, en) {
        btn.textContent = lang() === 'en' ? en : es;
        setTimeout(function () { btn.innerHTML = original; }, 1800);
      }
      function fallback() {
        var target = document.getElementById(btn.getAttribute('data-copy-target'));
        if (target) {
          var range = document.createRange();
          range.selectNodeContents(target);
          var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        }
        done('Seleccionado: copialo', 'Selected: copy it');
      }
      try {
        navigator.clipboard.writeText(text).then(function () { done('Copiado', 'Copied'); }, fallback);
      } catch (e) { fallback(); }
    });
  });

  setLang(initialLang);
});
