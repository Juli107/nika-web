/* Franciotex · concepto NIKA — interfaz, animaciones al scrollear y estado compartido con el 3D.
   Si GSAP o el 3D no cargan, la página queda estática y se lee completa. */
(function () {
  'use strict';
  var root = document.documentElement;
  var P = window.FX_PRODUCTOS || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mobile = window.matchMedia('(max-width: 900px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- estado que lee el 3D (tela.js) ---------- */
  var KF = {
    hero:      { x: .5,  y: .02, z: 0,    rx: -.26, ry: -.55, rz: .12, s: 1.12, amp: 1,   flag: 0,  curl: .95,  prod: 0,  threads: 0, m: { x: .08, y: .66, s: .36 } },
    macro:     { x: .42, y: 0,   z: 1.75, rx: -.04, ry: -.12, rz: .02, s: 1.15, amp: .3,  flag: 0,  curl: .15, prod: 0,  threads: 0, m: { x: 0, y: .5, z: .5, s: .75 } },
    hilos:     { x: .78, y: -.25,z: -1.4, rx: -.1,  ry: .7,   rz: -.1, s: .75,  amp: .8,  flag: 0,  curl: .5,  prod: 0,  threads: 1, m: { x: .4, y: .55, s: .5 } },
    productos: { x: -.16,y: -.03,z: .1,   rx: -.12, ry: 0,    rz: 0,   s: .9,   amp: .55, flag: 0,  curl: .3,  prod: 0,  threads: 0, m: { x: 0, y: .24, s: .5 } },
    bandera: { x: .44, y: .3,  z: 0,    rx: 0,    ry: -.32, rz: 0,   s: 1.0,  amp: 1.15,flag: 1,  curl: 0,   prod: 8,  threads: 0, m: { x: 0, y: .5, s: .62 } },
    lateral: { x: .1,  y: -.62,z: -.8,  rx: -.2,  ry: .6,   rz: .25, s: .001,   amp: .7,  flag: 0,  curl: .9,  prod: 11, threads: 0, m: { x: -.6, y: .62, s: .001 } },
    lejos:     { x: .95, y: .55, z: -2.2, rx: -.3,  ry: -.6,  rz: -.2, s: .001,   amp: .9,  flag: 0,  curl: .6,  prod: 13, threads: 0, m: { x: .5, y: .7, s: .001 } },
    pedido: { x: .5,  y: .2,  z: -1.2, rx: -.1,  ry: .5,   rz: .15, s: .001,   amp: .8,  flag: 0,  curl: .5,  prod: 14, threads: 0, m: { x: -.5, y: .75, s: .001 } },
    cierre:    { x: 0,   y: .05, z: -.4,  rx: -.2,  ry: 0,    rz: 0,   s: .001,  amp: 1,   flag: .35,curl: .2,  prod: 15, threads: 0, m: { x: 0, y: .05, s: .001 } }
  };
  var KEYS = ['x', 'y', 'z', 'rx', 'ry', 'rz', 's', 'amp', 'flag', 'curl', 'prod', 'threads', 'tx', 'ty', 'tr'];
  function kf(name) {
    var k = KF[name], o = {};
    KEYS.forEach(function (key) { o[key] = k[key] === undefined ? 0 : k[key]; });
    if (mobile.matches && k.m) for (var m in k.m) o[m] = k.m[m];
    return o;
  }
  var ST = window.FX_STATE = kf('hero');

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
    c.innerHTML = (p.foto ? '<figure class="foto"><img src="' + p.foto + '" alt="' + p.nombre + ' Franciotex" loading="lazy"><figcaption>Foto real</figcaption></figure>' : '') + '<span class="tag">' + p.tag + '</span><h3>' + p.nombre + '</h3><p>' + p.txt + '</p><dl class="spec">' +
      p.spec.map(function (s) { return '<div><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>'; }).join('') +
      '</dl><a class="btn sec" href="#mayoristas" data-add="' + p.id + '">Sumar al pedido</a>';
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
  /* con el 3D activo, la ficha sigue a la tela que se ve en pantalla */
  var glOn = false, lastShown = 0;
  window.addEventListener('fx:prod', function (e) {
    glOn = true; lastShown = e.detail;
    var pin = document.querySelector('#prodStage').getBoundingClientRect();
    if (pin.top < innerHeight * .5 && pin.bottom > innerHeight * .5) setProduct(e.detail);
  });

  /* ---------- pedido mayorista ---------- */
  var qty = {};
  var rows = $('#rows');
  P.forEach(function (p) {
    qty[p.id] = 0;
    var r = document.createElement('div');
    r.className = 'row';
    r.innerHTML = '<span class="sw" style="background:' + p.sw + '"></span><div><b>' + p.nombre + '</b><small>' + p.spec[1][1] + '</small></div>' +
      '<div class="step"><button type="button" data-d="-1" aria-label="Menos ' + p.nombre + '">−</button><output id="q-' + p.id + '">0</output><button type="button" data-d="1" aria-label="Más ' + p.nombre + '">+</button></div>';
    r.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { qty[p.id] = Math.max(0, qty[p.id] + (+b.dataset.d)); paint(); });
    });
    rows.appendChild(r);
  });
  function paint() {
    var n = 0, k = 0;
    P.forEach(function (p) { $('#q-' + p.id).textContent = qty[p.id]; n += qty[p.id]; if (qty[p.id]) k++; });
    $('#tot').textContent = n ? n + (n === 1 ? ' bulto' : ' bultos') + ' · ' + k + (k === 1 ? ' producto' : ' productos') : 'Sin productos todavía';
  }
  $$('[data-add]').forEach(function (a) {
    a.addEventListener('click', function () { var id = a.dataset.add; if (qty[id] === 0) { qty[id] = 1; paint(); } });
  });
  $('#pedido').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, err = $('#err');
    var items = P.filter(function (p) { return qty[p.id] > 0; });
    if (!items.length) { err.textContent = 'Sumá al menos un producto con el botón +.'; return; }
    if (!f.nombre.value.trim() || !f.localidad.value.trim()) { err.textContent = 'Completá tu nombre y la localidad para cotizarte la entrega.'; return; }
    err.textContent = '';
    var msg = '¡Hola Franciotex! Quiero hacer un pedido mayorista:\n\n' +
      items.map(function (p) { return '• ' + p.nombre + ': ' + qty[p.id] + (qty[p.id] === 1 ? ' bulto' : ' bultos'); }).join('\n') +
      '\n\nNombre: ' + f.nombre.value.trim() + (f.comercio.value.trim() ? '\nComercio: ' + f.comercio.value.trim() : '') +
      '\nRubro: ' + f.rubro.value + '\nLocalidad: ' + f.localidad.value.trim() + '\n\n¿Me pasan precios y condiciones de entrega?';
    window.open('https://wa.me/5491122784412?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });

  /* ---------- prueba de la franela (limpiar el vidrio) ---------- */
  (function () {
    var glass = $('#glass'), cv = $('#dirt'), cur = $('#cur'), hint = $('#hint');
    var ctx = cv.getContext('2d', { willReadFrequently: true });
    var W, H, dpr, total = 0, last = null, cleaned = 0, done = false;
    function dirt() {
      var r = glass.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.width = Math.round(r.width * dpr); H = cv.height = Math.round(r.height * dpr);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(176,164,140,.92)'; ctx.fillRect(0, 0, W, H);
      for (var i = 0; i < 1400; i++) {
        var x = Math.random() * W, y = Math.random() * H, s = Math.random() * 40 * dpr + 4;
        var tone = 105 + Math.random() * 70 | 0;
        ctx.fillStyle = 'rgba(' + tone + ',' + (tone - 8) + ',' + (tone - 22) + ',' + (Math.random() * .22) + ')';
        ctx.beginPath(); ctx.ellipse(x, y, s, s * (.4 + Math.random() * .6), Math.random() * 3, 0, 7); ctx.fill();
      }
      for (var j = 0; j < 7; j++) { /* huellas de dedos */
        var cx = Math.random() * W, cy = Math.random() * H;
        ctx.strokeStyle = 'rgba(90,80,64,.18)'; ctx.lineWidth = 1.2 * dpr;
        for (var k = 1; k < 12; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, k * 3 * dpr, k * 4 * dpr, .4, 0, 7); ctx.stroke(); }
      }
      ctx.font = 600 * 1 + ' ' + Math.round(15 * dpr) + 'px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(70,60,46,.5)'; ctx.textAlign = 'center';
      ctx.fillText('limpiame', W / 2, H * .3);
      total = W * H; cleaned = 0; done = false;
    }
    function wipe(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      var rad = 46 * dpr;
      var pts = last ? Math.max(1, Math.ceil(Math.hypot(x - last[0], y - last[1]) / (rad * .3))) : 1;
      for (var i = 1; i <= pts; i++) {
        var px = last ? last[0] + (x - last[0]) * i / pts : x, py = last ? last[1] + (y - last[1]) * i / pts : y;
        var g = ctx.createRadialGradient(px, py, rad * .2, px, py, rad);
        g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, rad, 0, 7); ctx.fill();
      }
      last = [x, y];
    }
    var tick = 0;
    function measure() {
      if (done) return;
      var d = ctx.getImageData(0, 0, W, H).data, clear = 0;
      for (var i = 3; i < d.length; i += 64) if (d[i] < 40) clear++;
      var pc = Math.min(100, Math.round(clear / (d.length / 64) * 100 * 1.08));
      $('#pct').textContent = pc + '%'; $('#pctBar').style.width = pc + '%';
      if (pc > 80 && !done) {
        done = true; glass.style.setProperty('--sh', '160%');
        ctx.globalCompositeOperation = 'source-over';
        if (window.gsap) gsap.to(cv, { opacity: 0, duration: .8 }); else cv.style.opacity = 0;
        $('#pct').textContent = '100% · ¡Impecable!'; $('#pctBar').style.width = '100%';
      }
    }
    function pos(e) { var r = glass.getBoundingClientRect(); return [(e.clientX - r.left), (e.clientY - r.top)]; }
    function move(e) {
      var p = pos(e);
      cur.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px) rotate(' + (-8 + Math.sin(p[0] / 40) * 8) + 'deg)';
      if (done) return;
      hint.style.opacity = 0;
      wipe(p[0] * dpr, p[1] * dpr);
      if (++tick % 6 === 0) measure();
    }
    glass.addEventListener('pointermove', move);
    glass.addEventListener('pointerdown', function (e) { last = null; move(e); });
    glass.addEventListener('pointerleave', function () { last = null; cur.style.transform = 'translate(-200px,-200px)'; measure(); });
    glass.addEventListener('pointerup', function () { last = null; measure(); });
    if (window.matchMedia('(hover: none)').matches) hint.textContent = 'PASÁ EL DEDO PARA LIMPIAR';
    dirt();
    var rw = glass.clientWidth;
    window.addEventListener('resize', function () { if (Math.abs(glass.clientWidth - rw) > 40) { rw = glass.clientWidth; cv.style.opacity = 1; glass.style.removeProperty('--sh'); dirt(); measure(); } });
  })();

  /* ---------- brillo que sigue al mouse en las tarjetas de usos ---------- */
  $$('.uso').forEach(function (u) {
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

  /* titulares letra por letra */
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
      gsap.to($$('.ch', el), { opacity: 1, y: 0, rotate: 0, duration: .9, ease: 'expo.out', stagger: .018,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('.rv').forEach(function (el) {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  }

  /* contadores */
  $$('[data-count]').forEach(function (b) {
    var o = { v: 0 }, to = +b.dataset.count, pre = b.dataset.pre || '', suf = b.dataset.suf || '';
    ScrollTrigger.create({ trigger: b, start: 'top 85%', once: true, onEnter: function () {
      gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: function () { b.textContent = pre + Math.round(o.v) + suf; } });
    } });
  });

  /* barras tricolor de la historia */
  $$('.tlc').forEach(function (c) {
    gsap.to(c, { '--p': 1, ease: 'none', scrollTrigger: { trigger: c, start: 'top 85%', end: 'top 45%', scrub: true } });
  });

  /* marcadores del tejido */
  var pins = $$('.pin');
  gsap.to(pins, { opacity: 1, x: 0, stagger: .25, ease: 'power2.out', scrollTrigger: { trigger: '#tejido', start: 'top 40%', end: 'top -10%', scrub: true } });

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

  /* ---------- coreografía del 3D ---------- */
  var built = [];
  function build() {
    built.forEach(function (t) { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
    built = [];
    var prev = kf('hero');
    for (var k in prev) ST[k] = prev[k];
    $$('[data-scene]').forEach(function (sec) {
      var name = sec.dataset.scene; if (name === 'hero') return;
      var to = kf(name);
      var tw = gsap.fromTo(ST, Object.assign({}, prev), Object.assign({}, to, {
        ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: sec, start: 'top bottom', end: name === 'productos' ? 'top top' : 'top 25%', scrub: 1 }
      }));
      built.push(tw);
      if (name === 'productos') {
        var last = Object.assign({}, to, { prod: P.length - 1 });
        var tp = gsap.fromTo(ST, { prod: 0 }, { prod: P.length - 1, ease: 'none', immediateRender: false,
          onUpdate: function () { setProduct(glOn ? lastShown : Math.round(ST.prod)); },
          scrollTrigger: { trigger: '#prodStage', start: 'top top', end: '+=' + (P.length * 70) + '%', pin: true, scrub: 1 } });
        built.push(tp);
        to = last;
      }
      prev = to;
    });
    ScrollTrigger.refresh();
  }
  build();
  mobile.addEventListener('change', build);

  $$('#prodList button').forEach(function (b) {
    b.addEventListener('click', function () {
      var st = built.filter(function (t) { return t.scrollTrigger && t.scrollTrigger.pin; })[0];
      if (!st) return;
      var s = st.scrollTrigger, i = +b.dataset.i;
      go(s.start + (s.end - s.start) * (i / (P.length - 1)) + 2);
    });
  });
})();
