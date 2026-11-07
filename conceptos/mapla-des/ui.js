/* Mapla Des · concepto NIKA — interfaz, animaciones al scrollear y estado compartido con el 3D (escena.js).
   Si GSAP o el 3D no cargan, la página queda estática y se lee completa. */
(function () {
  'use strict';
  var root = document.documentElement;
  var P = window.MD_PRODUCTOS || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mobile = window.matchMedia('(max-width: 900px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- estado que lee el 3D ----------
     x,y: centro de la escena (unidades de pantalla, -1..1) · s: escala · logo: isotipo armado (0..1)
     explode: piezas del isotipo separadas · orbit: productos girando alrededor · focus: un producto al frente
     prod: producto al frente · balloons: globos del cotillón · tilt: inclinación de la cámara */
  var KF = {
    hero:      { x: .5, y: .04, s: .78,   logo: 1,   explode: 0,   orbit: 1,  focus: 0, prod: 0, balloons: 0, tilt: 0,   m: { x: 0, y: .4, s: .42 } },
    why:       { x: .02, y: -.62, s: .55, logo: .45, explode: 1,   orbit: .55, focus: 0, prod: 0, balloons: 0, tilt: .25, m: { x: 0, y: .5, s: .5, logo: .3 } },
    productos: { x: .06, y: 0,   s: 1,   logo: 0,   explode: 1,   orbit: 0,  focus: 1, prod: 0, balloons: 0, tilt: 0,   m: { x: 0, y: .3, s: .62 } },
    rubros:    { x: .74, y: .52, s: .5,  logo: 0,   explode: 1,   orbit: .8, focus: 0, prod: 7, balloons: 0, tilt: .4,  m: { x: .5, y: .75, s: .35, orbit: 0 } },
    cotillon:  { x: .5,  y: 0,   s: .9,  logo: 0,   explode: 1,   orbit: 0,  focus: 0, prod: 7, balloons: 1, tilt: 0,   m: { x: .3, y: .3, s: .55 } },
    modo:      { x: .62, y: .5,  s: .5,  logo: .35, explode: .6,  orbit: .5, focus: 0, prod: 7, balloons: 0, tilt: -.2, m: { x: .4, y: .75, s: .35, orbit: 0, logo: 0 } },
    pedido:    { x: -.58,y: -.5, s: .5,  logo: 0,   explode: 1,   orbit: 1,  focus: 0, prod: 7, balloons: 0, tilt: .2,  m: { x: 0, y: .82, s: .3, orbit: 0 } },
    local:     { x: .7,  y: .6,  s: .55, logo: .5,  explode: .2,  orbit: .4, focus: 0, prod: 7, balloons: 0, tilt: 0,   m: { x: .5, y: .82, s: .3, orbit: 0, logo: 0 } },
    cierre:    { x: 0,   y: -.42,s: .78, logo: 1,   explode: 0,   orbit: 1,  focus: 0, prod: 7, balloons: .3, tilt: 0, m: { x: 0, y: -.45, s: .55 } }
  };
  var KEYS = ['x', 'y', 's', 'logo', 'explode', 'orbit', 'focus', 'prod', 'balloons', 'tilt'];
  function kf(name) {
    var k = KF[name], o = {};
    KEYS.forEach(function (key) { o[key] = k[key]; });
    if (mobile.matches && k.m) for (var m in k.m) o[m] = k.m[m];
    return o;
  }
  var ST = window.MD_STATE = kf('hero');

  /* ---------- menú y header ---------- */
  var burger = $('#burger'), links = $('#links');
  burger.addEventListener('click', function () {
    var o = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
  });
  $$('#links a').forEach(function (a) { a.addEventListener('click', function () { links.classList.remove('open'); burger.setAttribute('aria-expanded', false); }); });
  var header = $('#top');
  function onScrollHeader() { header.classList.toggle('solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScrollHeader, { passive: true }); onScrollHeader();

  /* ---------- productos: lista y fichas ---------- */
  var list = $('#prodList'), cards = $('#prodCards');
  P.forEach(function (p, i) {
    var li = document.createElement('li');
    li.innerHTML = '<button type="button" data-i="' + i + '"><i></i>' + p.nombre + '</button>';
    list.appendChild(li);
    var c = document.createElement('article');
    c.className = 'pc';
    c.style.setProperty('--sw', p.sw);
    c.innerHTML = '<span class="tag"><i></i>' + p.tag + '</span><h3>' + p.nombre + '</h3><p>' + p.txt + '</p><dl class="spec">' +
      p.spec.map(function (s) { return '<div><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>'; }).join('') +
      '</dl><a class="btn pri" href="#pedido" data-add="' + p.id + '">Sumar al pedido</a>';
    cards.appendChild(c);
  });
  $('#pcT').textContent = String(P.length).padStart(2, '0');
  var current = -1;
  function setProduct(i) {
    i = Math.max(0, Math.min(P.length - 1, i));
    if (i === current) return; current = i;
    $$('.pc', cards).forEach(function (c, j) { c.classList.toggle('on', j === i); });
    $$('button', list).forEach(function (b, j) { b.classList.toggle('on', j === i); });
    $('#pcN').textContent = String(i + 1).padStart(2, '0');
    if (window.gsap && !reduce) gsap.fromTo($$('.pc', cards)[i].children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .5, ease: 'power3.out', overwrite: true });
  }
  setProduct(0);

  /* ---------- pedido ---------- */
  var qty = {}, modo = 'Mayorista';
  var rows = $('#rows');
  P.forEach(function (p) {
    qty[p.id] = 0;
    var r = document.createElement('div');
    r.className = 'row'; r.id = 'r-' + p.id;
    r.innerHTML = '<span class="sw" style="background:' + p.sw + '"></span><div><b>' + p.nombre + '</b><small>' + p.spec[0][1] + '</small></div>' +
      '<div class="step"><button type="button" data-d="-1" aria-label="Menos ' + p.nombre + '">−</button><output id="q-' + p.id + '">0</output><button type="button" data-d="1" aria-label="Más ' + p.nombre + '">+</button></div>';
    r.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { qty[p.id] = Math.max(0, qty[p.id] + (+b.dataset.d)); paint(); });
    });
    rows.appendChild(r);
  });
  function unidad(n) { return modo === 'Mayorista' ? (n === 1 ? ' bulto' : ' bultos') : (n === 1 ? ' paquete' : ' paquetes'); }
  function paint() {
    var n = 0, k = 0;
    P.forEach(function (p) { $('#q-' + p.id).textContent = qty[p.id]; $('#r-' + p.id).classList.toggle('has', qty[p.id] > 0); n += qty[p.id]; if (qty[p.id]) k++; });
    $('#tot').textContent = n ? n + unidad(n) + ' · ' + k + (k === 1 ? ' producto' : ' productos') : 'Sin productos todavía';
  }
  $$('#modoSeg button').forEach(function (b) {
    b.addEventListener('click', function () {
      modo = b.dataset.m;
      $$('#modoSeg button').forEach(function (x) { x.classList.toggle('on', x === b); });
      paint();
    });
  });
  $$('[data-add]').forEach(function (a) {
    a.addEventListener('click', function () { var id = a.dataset.add; if (qty[id] === 0) { qty[id] = 1; paint(); } });
  });
  $('#pedidoForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, err = $('#err');
    var items = P.filter(function (p) { return qty[p.id] > 0; });
    if (!items.length) { err.textContent = 'Sumá al menos un producto con el botón +.'; return; }
    if (!f.nombre.value.trim()) { err.textContent = 'Decinos tu nombre para responderte.'; return; }
    err.textContent = '';
    var msg = '¡Hola Mapla Des! Quiero hacer un pedido ' + (modo === 'Mayorista' ? 'por mayor' : 'por menor') + ':\n\n' +
      items.map(function (p) { return '• ' + p.nombre + ': ' + qty[p.id] + unidad(qty[p.id]); }).join('\n') +
      '\n\nNombre: ' + f.nombre.value.trim() + (f.comercio.value.trim() ? '\nNegocio: ' + f.comercio.value.trim() : '') +
      '\nRubro: ' + f.rubro.value + '\nZona: ' + f.zona.value + '\n\n¿Me pasan precios y disponibilidad?';
    window.open('https://wa.me/5493854984294?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });

  /* ---------- brillo que sigue al mouse en los rubros ---------- */
  $$('.rb').forEach(function (u) {
    u.addEventListener('pointermove', function (e) {
      var r = u.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      u.style.setProperty('--mx', x + 'px'); u.style.setProperty('--my', y + 'px');
      if (window.gsap && !reduce) gsap.to(u, { rotateY: (x / r.width - .5) * 10, rotateX: -(y / r.height - .5) * 10, transformPerspective: 900, duration: .5, ease: 'power2.out' });
    });
    u.addEventListener('pointerleave', function () { if (window.gsap) gsap.to(u, { rotateX: 0, rotateY: 0, duration: .7, ease: 'power3.out' }); });
  });

  /* ---------- animaciones al scrollear ---------- */
  if (!window.gsap || !window.ScrollTrigger) { root.classList.add('nojs'); return; }
  gsap.registerPlugin(ScrollTrigger);
  $$('.split').forEach(function (el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            var ws = document.createElement('span'); ws.style.display = 'inline-block'; ws.style.whiteSpace = 'nowrap';
            w.split('').forEach(function (ch) { var s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; ws.appendChild(s); });
            frag.appendChild(ws);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
  });
  if (reduce) {
    $$('.split .ch,.rv').forEach(function (e) { e.style.opacity = 1; e.style.transform = 'none'; });
  } else {
    $$('.split').forEach(function (el) {
      gsap.to($$('.ch', el), { opacity: 1, y: 0, duration: .9, ease: 'expo.out', stagger: .016,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('.rv').forEach(function (el) {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
  }
  $$('[data-count]').forEach(function (b) {
    var o = { v: 0 }, to = +b.dataset.count, pre = b.dataset.pre || '', suf = b.dataset.suf || '';
    ScrollTrigger.create({ trigger: b, start: 'top 85%', once: true, onEnter: function () {
      gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: function () { b.textContent = pre + Math.round(o.v) + suf; } });
    } });
  });
  $$('.stat').forEach(function (c) {
    gsap.to(c, { '--p': 1, ease: 'none', scrollTrigger: { trigger: c, start: 'top 85%', end: 'top 50%', scrub: true } });
  });
  gsap.to('#prog', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: .3 } });

  /* scroll suave */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: .09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function go(target) { if (lenis) lenis.scrollTo(target, { offset: -60 }); else window.scrollTo({ top: typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY - 60, behavior: 'smooth' }); }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = document.querySelector(id); if (!t) return;
      e.preventDefault(); go(t);
    });
  });

  /* ---------- coreografía del 3D ----------
     Un solo cálculo por cuadro: según el scroll se interpola entre las escenas de cada sección
     y el 3D se acerca suavemente a ese objetivo (así ningún tween pisa a otro al saltar con el menú). */
  var segs = [], pinST = null, target = kf('hero');
  function build() {
    segs.forEach(function (s) { s.st.kill(); });
    segs = []; pinST = null;
    var prev = kf('hero');
    $$('[data-scene]').forEach(function (sec) {
      var name = sec.dataset.scene; if (name === 'hero') return;
      var to = kf(name);
      if (name === 'productos') {
        to.prod = 0;
        segs.push({ st: ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'top top' }), from: prev, to: to });
        pinST = ScrollTrigger.create({ trigger: '#prodStage', start: 'top top', end: '+=' + (P.length * 65) + '%', pin: true,
          onToggle: function (s) { document.body.classList.toggle('instage', s.isActive); } });
        var last = Object.assign({}, to, { prod: P.length - 1 });
        segs.push({ st: pinST, from: to, to: last });
        prev = last; return;
      }
      segs.push({ st: ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'top 30%' }), from: prev, to: to });
      prev = to;
    });
    ScrollTrigger.refresh();
  }
  function aim() {
    var y = window.scrollY, from = kf('hero'), res = null;
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i], a = s.st.start, b = s.st.end;
      if (y >= b) { from = s.to; continue; }
      if (y > a) {
        var p = (y - a) / Math.max(1, b - a); res = {};
        KEYS.forEach(function (k) { res[k] = s.from[k] + (s.to[k] - s.from[k]) * p; });
      }
      break;
    }
    return res || from;
  }
  build();
  mobile.addEventListener('change', build);
  gsap.ticker.add(function (time, dt) {
    target = aim();
    var f = reduce ? 1 : 1 - Math.pow(1 - .09, Math.min(dt, 100) / 16.7);
    KEYS.forEach(function (k) { ST[k] += (target[k] - ST[k]) * f; });
    if (pinST && pinST.isActive) setProduct(Math.round(ST.prod));
  });
  $$('#prodList button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!pinST) return;
      var i = +b.dataset.i;
      go(pinST.start + (pinST.end - pinST.start) * (i / (P.length - 1)) + 2);
    });
  });
})();
