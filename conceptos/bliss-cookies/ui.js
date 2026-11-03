/* Bliss Cookies · concepto NIKA — interacción de la página (funciona aunque no cargue el 3D) */
(function () {
  'use strict';
  var WA = '5492804706544';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var waLink = function (t) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t); };

  /* nav */
  var header = $('header');
  var burger = $('#burger'), links = $('#links');
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.textContent = open ? '✕' : '☰';
  });
  $$('#links a').forEach(function (a) { a.addEventListener('click', function () { links.classList.remove('open'); burger.textContent = '☰'; burger.setAttribute('aria-expanded', false); }); });

  /* WhatsApp */
  $('#wa').href = waLink('¡Hola Bliss! Vi la web y quiero hacer un pedido 🍪');
  $('#giftbtn').href = waLink('¡Hola Bliss! Quiero cotizar cajas para regalo. Cantidad aproximada: ___ · Fecha de entrega: ___');
  $('#giftbtn').target = '_blank';

  /* aparición al hacer scroll */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  $$('.rv').forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 0.08 + 's'; io.observe(el); });

  /* proceso: pasos según el scroll */
  var proc = $('#proceso'), steps = $$('.step'), bars = $$('.bar i b');
  window.blissProgress = function () {
    var r = proc.getBoundingClientRect(), h = proc.offsetHeight - window.innerHeight;
    return Math.min(1, Math.max(0, -r.top / h));
  };
  function onScroll() {
    header.classList.toggle('solid', window.scrollY > 40);
    var p = window.blissProgress();
    var k = Math.min(4, Math.floor(p * 5));
    steps.forEach(function (s, i) { s.classList.toggle('on', i === k); });
    bars.forEach(function (b, i) { b.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p * 5 - i)) + ')'; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* migas de cookie con el mouse en la portada */
  if (fine && !reduce) {
    var hero = $('#hero'), last = 0;
    hero.addEventListener('mousemove', function (e) {
      var now = performance.now(); if (now - last < 45) return; last = now;
      var c = document.createElement('i');
      c.className = 'crumb';
      c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px';
      c.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
      var s = 4 + Math.random() * 6; c.style.width = s + 'px'; c.style.height = s * 0.8 + 'px';
      if (Math.random() < 0.35) c.style.background = '#3B1E12';
      document.body.appendChild(c);
      setTimeout(function () { c.remove(); }, 1000);
    });
  }

  /* sabores: inclinación 3D con el mouse */
  if (fine && !reduce) {
    $$('.fl').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'rotateY(' + x * 16 + 'deg) rotateX(' + (-y * 16) + 'deg)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* armá tu caja */
  var FL = [
    { id: 'belga', nm: 'La Belga', d: 'chocolate belga' },
    { id: 'limon', nm: 'Limón & Frambuesa', d: 'con chocolate blanco' },
    { id: 'temp', nm: 'Sabor del mes', d: 'idea de temporada' },
    { id: 'drop', nm: 'Edición limitada', d: 'idea de drop' }
  ];
  var st = { n: 6, q: { belga: 0, limon: 0, temp: 0, drop: 0 }, zone: 'Recoleta', mode: 'Retiro' };
  var rows = $('#rows'), tray = $('#tray');
  FL.forEach(function (f) {
    var r = document.createElement('div');
    r.className = 'row';
    r.innerHTML = '<span class="dot ck ' + f.id + '"></span><span class="nm">' + f.nm + '<small>' + f.d + '</small></span>' +
      '<span class="qty"><button aria-label="Sacar ' + f.nm + '" data-d="-1" data-f="' + f.id + '">−</button><b id="q-' + f.id + '">0</b><button aria-label="Sumar ' + f.nm + '" data-d="1" data-f="' + f.id + '">+</button></span>';
    rows.appendChild(r);
  });
  function total() { return FL.reduce(function (a, f) { return a + st.q[f.id]; }, 0); }
  function render(added) {
    var t = total();
    FL.forEach(function (f) { $('#q-' + f.id).textContent = st.q[f.id]; });
    $$('.qty button').forEach(function (b) {
      var f = b.dataset.f, d = +b.dataset.d;
      b.disabled = d < 0 ? st.q[f] === 0 : t >= st.n;
    });
    var cols = st.n === 4 ? 2 : st.n === 6 ? 3 : 4;
    tray.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    var list = [];
    FL.forEach(function (f) { for (var i = 0; i < st.q[f.id]; i++) list.push(f.id); });
    tray.innerHTML = '';
    for (var i = 0; i < st.n; i++) {
      var s = document.createElement('div'); s.className = 'slot';
      if (list[i]) {
        var c = document.createElement('div'); c.className = 'ck ' + list[i];
        if (!(added && i === list.length - 1)) c.style.animation = 'none';
        s.appendChild(c);
      }
      tray.appendChild(s);
    }
    $('#count').textContent = t + ' / ' + st.n;
    $('#fill').style.width = (t / st.n * 100) + '%';
    var parts = FL.filter(function (f) { return st.q[f.id]; }).map(function (f) { return st.q[f.id] + ' ' + f.nm; });
    $('#sum').textContent = t === 0 ? 'Sumá sabores para llenar la caja.' :
      parts.join(' · ') + (t < st.n ? ' — te faltan ' + (st.n - t) + '.' : ' — ¡caja completa!');
    $('#send').disabled = t !== st.n;
  }
  rows.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var d = +b.dataset.d, f = b.dataset.f;
    if (d > 0 && total() >= st.n) return;
    st.q[f] = Math.max(0, st.q[f] + d);
    render(d > 0);
  });
  function seg(id, key, attr) {
    $('#' + id).addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('#' + id + ' button').forEach(function (x) { x.classList.toggle('on', x === b); });
      st[key] = attr === 'n' ? +b.dataset.n : b.dataset[attr];
      if (key === 'n') { // si la caja nueva es más chica, recorta desde el último sabor
        var t = total();
        for (var i = FL.length - 1; i >= 0 && t > st.n; i--) { var cut = Math.min(st.q[FL[i].id], t - st.n); st.q[FL[i].id] -= cut; t -= cut; }
      }
      render(false);
    });
  }
  seg('sizes', 'n', 'n'); seg('zone', 'zone', 'z'); seg('mode', 'mode', 'm');
  $$('[data-add]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (total() < st.n) { st.q[b.dataset.add]++; render(true); }
      document.getElementById('caja').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  $('#send').addEventListener('click', function () {
    var parts = FL.filter(function (f) { return st.q[f.id]; }).map(function (f) { return '• ' + st.q[f.id] + ' ' + f.nm; });
    var nm = $('#name').value.trim();
    var msg = '¡Hola Bliss! 🍪 Quiero una caja x' + st.n + ':\n' + parts.join('\n') +
      '\n\nZona: ' + st.zone + ' · ' + st.mode + ($('#gift').checked ? '\nEs para regalo, con tarjeta 🎁' : '') + (nm ? '\n\nSoy ' + nm + '.' : '');
    window.open(waLink(msg), '_blank', 'noopener');
  });
  render(false);
})();
