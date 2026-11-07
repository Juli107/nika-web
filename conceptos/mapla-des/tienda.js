/* Mapla Des · concepto NIKA — tienda online: catálogo sin fotos, filtros, ficha de artículo, carrito y pago (simulado en el concepto). */
(function () {
  'use strict';
  var CAT = window.MD_CATALOGO || [], CATS = window.MD_CATS || [], RUB = window.MD_RUBROS || [];
  var WA = '5493854984294', ENVIO = 4500, MINIMO = 150000, PAGE = 12;
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return '$' + Math.round(n).toLocaleString('es-AR'); };
  var fmt = function (n) { return n.toLocaleString('es-AR'); };
  var catBy = {}; CATS.forEach(function (c) { catBy[c.id] = c; });
  var rubBy = {}; RUB.forEach(function (r) { rubBy[r.id] = r; });
  var artBy = {}; CAT.forEach(function (a) { artBy[a.id] = a; });
  var code = function (a) { return 'MD-' + ('000' + a.id.slice(1)).slice(-4); };

  /* ---------- estado ---------- */
  var st = { q: '', cats: [], rubs: [], max: null, stock: false, modo: 'mayor', orden: 'pop', shown: PAGE };
  var cart = {}, fresh = null;
  try { var saved = JSON.parse(localStorage.getItem('md-cart') || '{}'); if (saved && typeof saved === 'object') { cart = saved.items || {}; st.modo = saved.modo === 'menor' ? 'menor' : 'mayor'; } } catch (e) {}
  function save() { try { localStorage.setItem('md-cart', JSON.stringify({ items: cart, modo: st.modo })); } catch (e) {} }
  var price = function (a) { return st.modo === 'mayor' ? a.pm : a.p; };
  var pres = function (a) {
    if (st.modo === 'mayor') return 'Bulto × ' + fmt(a.b) + ' u.';
    return a.u === 1 ? 'Por unidad' : 'Paquete × ' + a.u + ' u.';
  };
  var per = function (a) { return st.modo === 'mayor' ? 'bulto' : (a.u === 1 ? 'unidad' : 'paquete'); };
  var unit = function (a) { return money(price(a) / (st.modo === 'mayor' ? a.b : a.u)) + ' c/u'; };
  var maxPrice = function () { return Math.max.apply(null, CAT.map(price)); };

  /* ---------- filtros ---------- */
  function countBy(fn) { var n = 0; CAT.forEach(function (a) { if (fn(a)) n++; }); return n; }
  $('#fCats').innerHTML = CATS.map(function (c) {
    return '<label class="ck"><input type="checkbox" value="' + c.id + '"><i style="background:' + c.c + '"></i><span>' + c.n + '</span><small>' + countBy(function (a) { return a.cat === c.id; }) + '</small></label>';
  }).join('');
  $('#fRubros').innerHTML = RUB.map(function (r) {
    return '<label class="ck"><input type="checkbox" value="' + r.id + '"><span>' + r.n + '</span><small>' + countBy(function (a) { return a.r.indexOf(r.id) > -1; }) + '</small></label>';
  }).join('');
  $$('#fCats input').forEach(function (i) { i.addEventListener('change', function () { st.cats = $$('#fCats input:checked').map(function (x) { return x.value; }); reset(); }); });
  $$('#fRubros input').forEach(function (i) { i.addEventListener('change', function () { st.rubs = $$('#fRubros input:checked').map(function (x) { return x.value; }); reset(); }); });
  var range = $('#fPrecio');
  range.addEventListener('input', function () { st.max = +range.value >= 100 ? null : Math.max(500, Math.round(maxPrice() * range.value / 100 / 500) * 500); reset(); });
  $('#fStock').addEventListener('change', function (e) { st.stock = e.target.checked; reset(); });
  var qT; $('#q').addEventListener('input', function (e) { clearTimeout(qT); qT = setTimeout(function () { st.q = e.target.value; reset(); }, 120); });
  $('#orden').addEventListener('change', function (e) { st.orden = e.target.value; reset(); });
  function setModo(m) {
    st.modo = m; st.max = null; range.value = 100;
    $$('#modoSeg button').forEach(function (x) { x.classList.toggle('on', x.dataset.m === m); });
    save(); reset(); paintCart();
  }
  $$('#modoSeg button').forEach(function (b) {
    b.classList.toggle('on', b.dataset.m === st.modo);
    b.addEventListener('click', function () { setModo(b.dataset.m); });
  });
  $('#fClear').addEventListener('click', clearAll);
  function clearAll() {
    st.q = ''; st.cats = []; st.rubs = []; st.max = null; st.stock = false;
    $('#q').value = ''; range.value = 100; $('#fStock').checked = false;
    $$('#panel input[type=checkbox]').forEach(function (i) { i.checked = false; });
    reset();
  }
  /* desde la ficha 3D de cada producto: «Ver en la tienda» */
  $$('[data-cat]').forEach(function (a) {
    a.addEventListener('click', function () {
      var c = a.dataset.cat; if (!catBy[c]) return;
      clearAll();
      var box = $('#fCats input[value="' + c + '"]'); if (box) { box.checked = true; st.cats = [c]; reset(); }
    });
  });
  /* panel de filtros en el celular */
  var panel = $('#panel');
  $('#fOpen').addEventListener('click', function () { panel.classList.add('open'); });
  $('#pClose').addEventListener('click', function () { panel.classList.remove('open'); });

  /* ---------- listado ---------- */
  var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  function filtered() {
    var words = norm(st.q).split(/\s+/).filter(Boolean);
    var r = CAT.filter(function (a) {
      if (st.cats.length && st.cats.indexOf(a.cat) < 0) return false;
      if (st.rubs.length && !st.rubs.some(function (x) { return a.r.indexOf(x) > -1; })) return false;
      if (st.stock && !a.s) return false;
      if (st.max != null && price(a) > st.max) return false;
      if (words.length) { var h = norm(a.n + ' ' + catBy[a.cat].n + ' ' + a.r.map(function (x) { return rubBy[x].n; }).join(' ')); if (!words.every(function (w) { return h.indexOf(w) > -1; })) return false; }
      return true;
    });
    var o = st.orden;
    r.sort(function (x, y) {
      if (x.s !== y.s) return y.s - x.s;
      if (o === 'pa') return price(x) - price(y);
      if (o === 'pd') return price(y) - price(x);
      if (o === 'az') return x.n.localeCompare(y.n, 'es');
      return y.pop - x.pop;
    });
    return r;
  }
  function reset() { st.shown = PAGE; render(); }
  function render() {
    var r = filtered(), list = $('#list');
    $('#fPrecioV').textContent = st.max == null ? 'Sin tope' : 'Hasta ' + money(st.max);
    $('#resN').textContent = r.length + (r.length === 1 ? ' artículo' : ' artículos');
    $('#resM').textContent = st.modo === 'mayor' ? 'Precios por bulto cerrado' : 'Precios por paquete';
    if (!r.length) list.innerHTML = '<p class="empty">No encontramos artículos con esos filtros. <br><button class="btn sec" type="button" id="emptyClear" style="margin-top:14px">Limpiar filtros</button></p>';
    else list.innerHTML = r.slice(0, st.shown).map(card).join('');
    var ec = $('#emptyClear'); if (ec) ec.addEventListener('click', clearAll);
    $('#more').hidden = r.length <= st.shown;
    chips();
  }
  function qtyBox(id, q) {
    return '<div class="qty"><button type="button" data-d="-1" data-id="' + id + '" aria-label="Quitar uno">−</button><output>' + q + '</output><button type="button" data-d="1" data-id="' + id + '" aria-label="Sumar uno">+</button></div>';
  }
  function card(a) {
    var c = catBy[a.cat], q = cart[a.id] || 0;
    var act = !a.s ? '<button class="add" type="button" disabled>Sin stock</button>'
      : q ? qtyBox(a.id, q)
      : '<button class="add" type="button" data-d="1" data-id="' + a.id + '">Agregar</button>';
    return '<article class="it' + (a.s ? '' : ' out') + '" data-id="' + a.id + '"><p class="cat"><i style="background:' + c.c + '"></i>' + c.n + '<span class="vd">Ver detalle</span></p><h3><button type="button" class="nm" data-art="' + a.id + '">' + a.n + '</button></h3><p class="pres">' + pres(a) + ' · ' + unit(a) + '</p>' +
      '<div class="rb2">' + a.r.map(function (x) { return '<span>' + rubBy[x].n + '</span>'; }).join('') + '</div>' +
      '<div class="row2"><p class="pr">' + money(price(a)) + '<small>por ' + per(a) + '</small></p>' + act + '</div></article>';
  }
  function chips() {
    var c = [];
    if (st.q) c.push(['q', '«' + st.q + '»']);
    st.cats.forEach(function (x) { c.push(['c:' + x, catBy[x].n]); });
    st.rubs.forEach(function (x) { c.push(['r:' + x, rubBy[x].n]); });
    if (st.max != null) c.push(['max', 'Hasta ' + money(st.max)]);
    if (st.stock) c.push(['stock', 'Con stock']);
    $('#chips').innerHTML = c.map(function (x) { return '<button type="button" data-k="' + x[0] + '">' + x[1] + ' <span aria-hidden="true">×</span></button>'; }).join('');
  }
  $('#chips').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var k = b.dataset.k;
    if (k === 'q') { st.q = ''; $('#q').value = ''; }
    else if (k === 'max') { st.max = null; range.value = 100; }
    else if (k === 'stock') { st.stock = false; $('#fStock').checked = false; }
    else { var v = k.slice(2), box = $((k[0] === 'c' ? '#fCats' : '#fRubros') + ' input[value="' + v + '"]'); if (box) box.checked = false; if (k[0] === 'c') st.cats = st.cats.filter(function (x) { return x !== v; }); else st.rubs = st.rubs.filter(function (x) { return x !== v; }); }
    reset();
  });
  $('#more').addEventListener('click', function () { st.shown += PAGE; render(); });

  /* un solo manejador para sumar/restar, abrir fichas y tocar una tarjeta */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-d][data-id]');
    if (b) { add(b.dataset.id, +b.dataset.d, b); return; }
    var o = e.target.closest('[data-art]');
    if (o) { openArt(o.dataset.art); return; }
    var it = e.target.closest('.it');
    if (it && !e.target.closest('button,a,input')) openArt(it.dataset.id);
  });

  /* ---------- carrito ---------- */
  function add(id, d, src) {
    var from = src && src.getBoundingClientRect ? src.getBoundingClientRect() : null;
    var q = Math.max(0, (cart[id] || 0) + d);
    if (d > 0 && !cart[id]) fresh = id;
    if (q) cart[id] = q; else delete cart[id];
    save(); render(); paintCart(); if (artOpen) paintArt();
    fresh = null;
    if (d > 0) celebrate(id, d, from);
  }
  function lines() { return Object.keys(cart).filter(function (id) { return artBy[id]; }).map(function (id) { return { a: artBy[id], q: cart[id] }; }); }
  function subtotal() { return lines().reduce(function (s, l) { return s + price(l.a) * l.q; }, 0); }
  function count() { return lines().reduce(function (s, l) { return s + l.q; }, 0); }
  /* artículos que comparten rubro con lo que ya está en el carrito */
  function suggest(base, n, exclude) {
    var rubs = {}; base.forEach(function (a) { a.r.forEach(function (r) { rubs[r] = (rubs[r] || 0) + 1; }); });
    var cats = base.map(function (a) { return a.cat; });
    return CAT.filter(function (a) { return a.s && !exclude[a.id]; })
      .map(function (a) { var s = a.r.reduce(function (t, r) { return t + (rubs[r] || 0); }, 0) + (cats.indexOf(a.cat) < 0 ? 1.5 : 0); return { a: a, s: s }; })
      .filter(function (x) { return x.s > 1.5; })
      .sort(function (x, y) { return y.s - x.s || y.a.pop - x.a.pop; })
      .slice(0, n).map(function (x) { return x.a; });
  }
  function relRow(r) {
    return '<div class="rl"><button type="button" class="rn" data-art="' + r.id + '">' + r.n + '<small>' + pres(r) + '</small></button><b>' + money(price(r)) + '</b><button type="button" class="radd" data-d="1" data-id="' + r.id + '" aria-label="Agregar ' + r.n + '">+</button></div>';
  }
  function paintCart() {
    var L = lines(), n = count(), sub = subtotal();
    $$('[data-n]').forEach(function (b) { b.textContent = n; });
    $('#cartFab').classList.toggle('show', n > 0);
    $('#cartT').innerHTML = 'Tu carrito' + (n ? ' <span class="cc">' + n + '</span>' : '');
    var inCart = {}; L.forEach(function (l) { inCart[l.a.id] = 1; });
    var sug = L.length ? suggest(L.map(function (l) { return l.a; }), 3, inCart) : [];
    $('#cartBody').innerHTML = L.length ? L.map(function (l) {
      return '<div class="cl' + (l.a.id === fresh ? ' new' : '') + '"><div><b class="ln" data-art="' + l.a.id + '">' + l.a.n + '</b><small>' + pres(l.a) + ' · ' + money(price(l.a)) + ' c/' + per(l.a) + '</small></div><p class="lp">' + money(price(l.a) * l.q) + '</p>' +
        qtyBox(l.a.id, l.q).replace('class="qty"', 'class="qty" style="justify-self:start"') + '<button class="rm" type="button" data-rm="' + l.a.id + '">Quitar</button></div>';
    }).join('') + (sug.length ? '<div class="sug"><h4>Te puede servir</h4><div class="rws">' + sug.map(relRow).join('') + '</div></div>' : '')
      : '<div class="cempty"><p class="lx" style="font-size:20px;color:#fff">Tu carrito está vacío</p><p style="margin-top:8px">Sumá artículos desde la tienda.</p></div>';
    $('#cartFoot').hidden = !L.length;
    $('#cartSub').textContent = money(sub);
    var mb = $('#minBox');
    if (st.modo === 'mayor') {
      var pc = Math.min(100, sub / MINIMO * 100);
      mb.innerHTML = sub >= MINIMO ? '✓ Llegaste a la compra mínima mayorista.' : 'Te faltan <b style="color:#fff">' + money(MINIMO - sub) + '</b> para la compra mínima mayorista (' + money(MINIMO) + ').' + '<div class="trk"><i style="width:' + pc + '%"></i></div>';
    } else mb.innerHTML = 'Compra por menor: sin mínimo.';
    $('#toCheckout').disabled = st.modo === 'mayor' && sub < MINIMO;
    $('#toCheckout').style.opacity = $('#toCheckout').disabled ? .5 : 1;
  }
  $('#cartBody').addEventListener('click', function (e) {
    var b = e.target.closest('[data-rm]'); if (!b) return;
    var id = b.dataset.rm, row = b.closest('.cl');
    var go = function () { delete cart[id]; save(); render(); paintCart(); };
    if (RM || !row) go(); else { row.classList.add('bye'); setTimeout(go, 230); }
  });
  $('#cartClear').addEventListener('click', function () { cart = {}; save(); render(); paintCart(); });
  var drawer = $('#drawer'), modal = $('#checkout'), art = $('#artModal');
  var lockScroll = function () { document.documentElement.style.overflow = 'hidden'; };
  var freeScroll = function () { if (!drawer.classList.contains('open') && !modal.classList.contains('open') && !art.classList.contains('open')) document.documentElement.style.overflow = ''; };
  function openCart() { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); lockScroll(); }
  function closeCart() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); freeScroll(); }
  $$('[data-cart]').forEach(function (b) { b.addEventListener('click', openCart); });
  $$('[data-close]', drawer).forEach(function (b) { b.addEventListener('click', closeCart); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (art.classList.contains('open')) { closeArt(); return; }
    closeCart(); closeModal(); panel.classList.remove('open');
  });
  /* el carrito flotante se esconde cuando el de la barra está a la vista */
  var barCart = $('.bar [data-cart]');
  if ('IntersectionObserver' in window && barCart) new IntersectionObserver(function (en) { $('#cartFab').classList.toggle('near', en[0].isIntersecting); }).observe(barCart);

  /* ---------- motion al agregar ---------- */
  var COLORS = ['#FF3D3E', '#3B63F0', '#86C7ED', '#FFC83D', '#FFFFFF'];
  function cartTarget() {
    if (drawer.classList.contains('open')) return $('#cartT');
    var c = $$('[data-cart]').filter(function (b) {
      var r = b.getBoundingClientRect();
      return b.offsetParent !== null && +getComputedStyle(b).opacity > .2 && r.width && r.bottom > 0 && r.top < innerHeight;
    });
    return c[0] || null;
  }
  function sparks(x, y, n, dist) {
    if (RM || !Element.prototype.animate) return;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i'); s.className = 'spk';
      s.style.background = COLORS[i % COLORS.length];
      if (i % 3 === 1) s.style.borderRadius = '50%';
      document.body.appendChild(s);
      var ang = Math.random() * Math.PI * 2, d = (dist || 50) * (.5 + Math.random() * .7);
      var dx = Math.cos(ang) * d, dy = Math.sin(ang) * d - (dist || 50) * .3;
      s.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px) rotate(0) scale(1)', opacity: 1 },
        { transform: 'translate(' + (x + dx) + 'px,' + (y + dy) + 'px) rotate(' + (Math.random() * 540 - 270) + 'deg) scale(.4)', opacity: 0 }
      ], { duration: 650 + Math.random() * 350, easing: 'cubic-bezier(.15,.7,.3,1)' }).onfinish = (function (el) { return function () { el.remove(); }; })(s);
    }
  }
  function bump() {
    $$('[data-cart]').forEach(function (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
    $$('[data-n], #cartT .cc').forEach(function (b) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
  }
  function flashCard(id) {
    var el = $('.it[data-id="' + id + '"]'); if (!el) return;
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }
  var tst = $('#toast'), tT;
  function toast(a, d) {
    $('[data-tn]', tst).textContent = a.n;
    $('[data-tq]', tst).textContent = (d > 1 ? d + ' × ' : '') + pres(a) + ' · subtotal ' + money(subtotal());
    tst.classList.remove('show'); void tst.offsetWidth; tst.classList.add('show');
    clearTimeout(tT); tT = setTimeout(function () { tst.classList.remove('show'); }, 2800);
  }
  $('#toastCart').addEventListener('click', function () { tst.classList.remove('show'); closeArt(); openCart(); });
  function celebrate(id, d, from) {
    var a = artBy[id];
    flashCard(id); toast(a, d);
    var tg = cartTarget();
    if (RM || !from || !from.width || !tg || !Element.prototype.animate) { bump(); return; }
    var to = tg.getBoundingClientRect();
    var sx = from.left + from.width / 2, sy = from.top + from.height / 2, tx = to.left + to.width / 2, ty = to.top + to.height / 2;
    var my = Math.min(sy, ty) - Math.min(180, 60 + Math.abs(tx - sx) * .25), D = 820;
    sparks(sx, sy, 12, 46);
    var f = document.createElement('div'); f.className = 'flyer';
    f.innerHTML = '<div><i><svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/></svg>+' + d + '</i></div>';
    document.body.appendChild(f);
    f.animate([{ transform: 'translateX(' + sx + 'px)' }, { transform: 'translateX(' + tx + 'px)' }], { duration: D, easing: 'cubic-bezier(.35,0,.65,1)', fill: 'forwards' });
    f.firstChild.animate([
      { transform: 'translateY(' + sy + 'px) scale(.5)', opacity: 0, easing: 'cubic-bezier(.2,.7,.4,1)' },
      { transform: 'translateY(' + my + 'px) scale(1.12)', opacity: 1, offset: .42, easing: 'cubic-bezier(.6,0,.85,.45)' },
      { transform: 'translateY(' + ty + 'px) scale(.35)', opacity: .9 }
    ], { duration: D, fill: 'forwards' }).onfinish = function () { f.remove(); bump(); sparks(tx, ty, 8, 34); };
  }

  /* ---------- ficha de artículo ---------- */
  var artOpen = null, artQ = 1;
  function openArt(id) {
    if (!artBy[id]) return;
    artOpen = id; artQ = 1; paintArt(); tst.classList.remove('show');
    art.classList.add('open'); art.setAttribute('aria-hidden', 'false'); lockScroll();
    $('#artBox').scrollTop = 0;
  }
  function closeArt() {
    if (!art.classList.contains('open')) return;
    art.classList.remove('open'); art.setAttribute('aria-hidden', 'true'); artOpen = null; freeScroll();
  }
  $$('[data-aclose]', art).forEach(function (b) { b.addEventListener('click', closeArt); });
  function pbox(m, t, p, pr, u, note) {
    return '<button type="button" class="pbox' + (st.modo === m ? ' on' : '') + '" data-pm="' + m + '"><span>' + t + '</span><small>' + p + '</small><b>' + money(pr) + '</b><small>' + money(u) + ' c/u</small>' + (note ? '<em>' + note + '</em>' : '') + '</button>';
  }
  function paintArt() {
    var a = artBy[artOpen]; if (!a) return;
    var c = catBy[a.cat], inCart = cart[a.id] || 0;
    var uM = a.pm / a.b, uP = a.p / a.u, ahorro = Math.round((1 - uM / uP) * 100);
    var ex = {}; ex[a.id] = 1;
    var rel = suggest([a], 3, ex);
    $('#artBody').innerHTML =
      '<p class="cat"><i style="background:' + c.c + '"></i>' + c.n + ' · Cód. ' + code(a) + '</p>' +
      '<h3 id="artT">' + a.n + '</h3>' +
      '<p class="stk ' + (a.s ? 'si' : 'no') + '">' + (a.s ? 'En stock · listo para retirar hoy' : 'Sin stock por ahora') + '</p>' +
      '<div class="pcmp">' +
        pbox('mayor', 'Por mayor', 'Bulto × ' + fmt(a.b) + ' u.', a.pm, uM, ahorro > 0 ? 'Ahorrás ' + ahorro + '% por unidad' : '') +
        pbox('menor', 'Por menor', a.u === 1 ? 'Por unidad' : 'Paquete × ' + a.u + ' u.', a.p, uP, '') +
      '</div>' +
      '<dl class="spec"><div><dt>Unidades por bulto</dt><dd>' + fmt(a.b) + '</dd></div><div><dt>Unidades por paquete</dt><dd>' + a.u + '</dd></div>' +
        '<div><dt>Ideal para</dt><dd>' + a.r.map(function (x) { return rubBy[x].n; }).join(', ') + '</dd></div><div><dt>Entrega</dt><dd>Retiro en el local o envío en el día</dd></div></dl>' +
      (a.s
        ? '<div class="abuy"><div class="qty"><button type="button" data-aq="-1" aria-label="Uno menos">−</button><output>' + artQ + '</output><button type="button" data-aq="1" aria-label="Uno más">+</button></div>' +
          '<div class="atot"><small>' + artQ + ' × ' + per(a) + '</small><b>' + money(price(a) * artQ) + '</b></div><button class="btn pri" type="button" id="artAdd">Agregar al carrito</button></div>' +
          (inCart ? '<p class="incart">Ya tenés ' + inCart + ' en el carrito · <button type="button" class="lnk" data-opencart>Ver carrito</button></p>' : '')
        : '<a class="btn sec" style="width:100%;justify-content:center;margin-top:16px" target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' + encodeURIComponent('Hola Mapla Des, ¿cuándo vuelve a entrar ' + a.n + '?') + '">Avisame cuando entre</a>') +
      (rel.length ? '<h4 class="relh">Combiná con</h4><div class="rel">' + rel.map(relRow).join('') + '</div>' : '');
  }
  $('#artBody').addEventListener('click', function (e) {
    var q = e.target.closest('[data-aq]'); if (q) { artQ = Math.max(1, Math.min(99, artQ + +q.dataset.aq)); paintArt(); return; }
    var pm = e.target.closest('[data-pm]'); if (pm) { if (pm.dataset.pm !== st.modo) { setModo(pm.dataset.pm); paintArt(); } return; }
    var ad = e.target.closest('#artAdd'); if (ad) { var n = artQ; artQ = 1; add(artOpen, n, ad); return; }
    if (e.target.closest('[data-opencart]')) { closeArt(); openCart(); }
  });

  /* ---------- checkout ---------- */
  var order = null, VIEWS = ['st1', 'st2', 'stMp', 'stTr', 'paying', 'ok'];
  function step(v) {
    VIEWS.forEach(function (k) { var el = $('#' + k), on = k === v; if (k === 'paying' || k === 'ok') el.style.display = on ? 'block' : 'none'; else el.hidden = !on; });
    var n = v === 'st1' ? 1 : v === 'ok' ? 3 : 2;
    $$('.steps i', modal).forEach(function (i, k) { i.classList.toggle('on', k < n); });
    $('.mbox', modal).scrollTop = 0;
  }
  function openModal() { closeCart(); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); lockScroll(); step('st1'); }
  function closeModal() { if (!modal.classList.contains('open')) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); freeScroll(); }
  $('#toCheckout').addEventListener('click', function () { if (!this.disabled) openModal(); });
  $$('[data-mclose]', modal).forEach(function (b) { b.addEventListener('click', closeModal); });
  var envSel = function () { return ($('input[name=env]:checked') || {}).value; };
  $$('input[name=env]').forEach(function (i) { i.addEventListener('change', function () { $('#dirBox').hidden = envSel() === 'retiro'; }); });
  $('#envCosto').textContent = money(ENVIO);
  $$('#st1 input').forEach(function (i) { i.addEventListener('input', function () { $('#e1').textContent = ''; }); });
  $('#go2').addEventListener('click', function () {
    var e = $('#e1');
    if (!$('#cN').value.trim()) { e.textContent = 'Decinos tu nombre.'; return; }
    if ($('#cT').value.replace(/\D/g, '').length < 8) { e.textContent = 'Dejanos un WhatsApp para avisarte del pedido.'; return; }
    if (envSel() !== 'retiro' && !$('#cD').value.trim()) { e.textContent = 'Completá la dirección de entrega.'; return; }
    e.textContent = ''; summary(); step('st2');
  });
  $('#back1').addEventListener('click', function () { step('st1'); });
  function totals() { var sub = subtotal(), env = envSel() === 'ciudad' ? ENVIO : 0; return { sub: sub, env: env, tot: sub + env }; }
  function summary() {
    var t = totals(), n = count();
    $('#sum').innerHTML = '<div><span>' + n + (st.modo === 'mayor' ? (n === 1 ? ' bulto' : ' bultos') : (n === 1 ? ' artículo' : ' artículos')) + '</span><span>' + money(t.sub) + '</span></div>' +
      '<div><span>Entrega</span><span>' + (envSel() === 'retiro' ? 'Retiro gratis' : envSel() === 'ciudad' ? money(t.env) : 'A coordinar') + '</span></div>' +
      '<div class="t"><span>Total</span><span>' + money(t.tot) + '</span></div>';
    payLabel();
  }
  function payLabel() { var v = $('input[name=pay]:checked').value; $('#pay').textContent = v === 'ef' ? 'Confirmar pedido · ' + money(totals().tot) : 'Continuar'; }
  $$('input[name=pay]').forEach(function (i) { i.addEventListener('change', payLabel); });
  $('#pay').addEventListener('click', function () {
    var pay = $('input[name=pay]:checked').value;
    if (pay === 'mp') { paintMp(); step('stMp'); }
    else if (pay === 'tr') { $('#trMonto').textContent = money(totals().tot); step('stTr'); }
    else finish('ef');
  });

  /* ventana de tarjeta (Mercado Pago simulado) */
  var digits = function (s) { return s.replace(/\D/g, ''); };
  var brandOf = function (n) { return /^4/.test(n) ? 'VISA' : /^5[1-5]|^2[2-7]/.test(n) ? 'MASTERCARD' : /^3[47]/.test(n) ? 'AMEX' : /^6/.test(n) ? 'CABAL' : 'TARJETA'; };
  function paintMp() {
    var t = totals().tot;
    $('#ccCuotas').innerHTML = [[1, '1 pago de ' + money(t)], [3, '3 cuotas sin interés de ' + money(t / 3)], [6, '6 cuotas de ' + money(t * 1.18 / 6) + ' (total ' + money(t * 1.18) + ')']]
      .map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('');
    $('#ccPay').textContent = 'Pagar ' + money(t); $('#e2').textContent = ''; paintCard();
  }
  function paintCard() {
    var n = digits($('#ccNum').value);
    $('#cvNum').textContent = (n + '••••••••••••••••').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    $('#cvBrand').textContent = brandOf(n);
    $('#cvName').textContent = $('#ccName').value.trim().toUpperCase() || 'NOMBRE Y APELLIDO';
    $('#cvExp').textContent = $('#ccExp').value || 'MM/AA';
    $('#cvCvv').textContent = $('#ccCvv').value.replace(/./g, '•') || '•••';
  }
  $('#ccNum').addEventListener('input', function (e) { e.target.value = digits(e.target.value).slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); paintCard(); });
  $('#ccExp').addEventListener('input', function (e) { var v = digits(e.target.value).slice(0, 4); e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; paintCard(); });
  $('#ccCvv').addEventListener('input', function (e) { e.target.value = digits(e.target.value).slice(0, 4); paintCard(); });
  $('#ccDni').addEventListener('input', function (e) { e.target.value = digits(e.target.value).slice(0, 8); });
  $('#ccName').addEventListener('input', paintCard);
  $('#ccCvv').addEventListener('focus', function () { $('#ccard').classList.add('flip'); });
  $('#ccCvv').addEventListener('blur', function () { $('#ccard').classList.remove('flip'); });
  $$('#stMp input').forEach(function (i) { i.addEventListener('input', function () { $('#e2').textContent = ''; }); });
  $('#ccDemo').addEventListener('click', function () {
    $('#ccNum').value = '4509 9535 6623 3704'; $('#ccName').value = $('#cN').value.trim() || 'Laura Gómez';
    $('#ccExp').value = '11/30'; $('#ccCvv').value = '123'; $('#ccDni').value = '30123456'; $('#e2').textContent = ''; paintCard();
  });
  $('#back2').addEventListener('click', function () { step('st2'); });
  $('#ccPay').addEventListener('click', function () {
    var e = $('#e2'), n = digits($('#ccNum').value), ex = $('#ccExp').value.split('/'), mm = +ex[0], yy = +ex[1];
    var now = new Date(), cy = now.getFullYear() % 100, cm = now.getMonth() + 1;
    if (n.length < 15) { e.textContent = 'Revisá el número de la tarjeta.'; return; }
    if (!$('#ccName').value.trim()) { e.textContent = 'Escribí el nombre como figura en la tarjeta.'; return; }
    if (!(mm >= 1 && mm <= 12) || isNaN(yy) || yy < cy || (yy === cy && mm < cm)) { e.textContent = 'Revisá el vencimiento (MM/AA).'; return; }
    if ($('#ccCvv').value.length < 3) { e.textContent = 'Falta el código de seguridad.'; return; }
    if ($('#ccDni').value.length < 7) { e.textContent = 'Revisá el DNI del titular.'; return; }
    var cu = +$('#ccCuotas').value;
    finish('mp', brandOf(n) + ' •••• ' + n.slice(-4) + (cu > 1 ? ' · ' + cu + ' cuotas' : ' · 1 pago'), cu === 6 ? 1.18 : 1);
  });

  /* ventana de transferencia */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.copy === 'monto' ? String(Math.round(totals().tot)) : b.dataset.copy;
      try { var p = navigator.clipboard && navigator.clipboard.writeText(v); if (p && p.catch) p.catch(function () {}); } catch (err) {}
      b.textContent = 'Copiado ✓'; setTimeout(function () { b.textContent = 'Copiar'; }, 1500);
    });
  });
  $('#back3').addEventListener('click', function () { step('st2'); });
  $('#trDone').addEventListener('click', function () { finish('tr'); });

  /* confirmación y comprobante */
  function finish(pay, extra, recargo) {
    var t = totals();
    if (recargo && recargo !== 1) t = { sub: t.sub, env: t.env, tot: t.tot * recargo };
    order = { n: 'MD-' + String(Date.now()).slice(-5), pay: pay, extra: extra || '', t: t, env: envSel(), L: lines(), modo: st.modo, date: new Date() };
    $('#payingT').textContent = pay === 'mp' ? 'Procesando el pago…' : pay === 'tr' ? 'Reservando tu mercadería…' : 'Registrando tu pedido…';
    step('paying');
    setTimeout(done, pay === 'mp' ? 1900 : 1100);
  }
  function entTxt(o) { return o.env === 'retiro' ? 'Retiro en el local' : (o.env === 'ciudad' ? 'Envío a ' : 'Otra localidad: ') + $('#cD').value.trim(); }
  function payTxt(o) { return { mp: 'Mercado Pago · ' + o.extra, tr: 'Transferencia (a confirmar)', ef: 'Efectivo al ' + (o.env === 'retiro' ? 'retirar' : 'recibir') }[o.pay]; }
  function done() {
    var o = order;
    step('ok');
    $('#okT').textContent = o.pay === 'mp' ? '¡Pago aprobado!' : '¡Pedido confirmado!';
    $('#okP').textContent = o.env === 'retiro' ? 'Te avisamos por WhatsApp cuando esté listo para retirar.' : 'Te escribimos por WhatsApp para coordinar la entrega.';
    $('#rcpt').innerHTML = '<div><span>Pedido</span><b>' + o.n + '</b></div><div><span>Fecha</span><b>' + o.date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) + '</b></div>' +
      o.L.map(function (l) { return '<div class="rl2"><span>' + l.q + ' × ' + l.a.n + '</span><b>' + money(price(l.a) * l.q) + '</b></div>'; }).join('') +
      '<div><span>Entrega</span><b>' + entTxt(o) + '</b></div><div><span>Pago</span><b>' + payTxt(o) + '</b></div>' +
      '<div class="rt"><span>Total</span><b>' + money(o.t.tot) + '</b></div>';
    $('#okAlias').hidden = o.pay !== 'tr';
    $('#okWa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(waText());
    cart = {}; save(); render(); paintCart();
    setTimeout(function () { var r = $('#okTick').getBoundingClientRect(); sparks(r.left + r.width / 2, r.top + r.height / 2, 34, 120); }, 250);
  }
  $('#okPrint').addEventListener('click', function () {
    document.body.classList.add('printing');
    setTimeout(function () { window.print(); document.body.classList.remove('printing'); }, 50);
  });
  function waText() {
    var o = order;
    return '¡Hola Mapla Des! Hice el pedido ' + o.n + ' en la web (' + (o.modo === 'mayor' ? 'por mayor' : 'por menor') + '):\n\n' +
      o.L.map(function (l) { return '• ' + l.q + ' × ' + l.a.n + ' (' + (o.modo === 'mayor' ? 'bulto × ' + l.a.b : (l.a.u === 1 ? 'unidad' : 'paquete × ' + l.a.u)) + ')'; }).join('\n') +
      '\n\nTotal: ' + money(o.t.tot) + '\nPago: ' + payTxt(o) + '\nEntrega: ' + entTxt(o) +
      '\nNombre: ' + $('#cN').value.trim() + ($('#cC').value.trim() ? ' · ' + $('#cC').value.trim() : '') + '\nWhatsApp: ' + $('#cT').value.trim();
  }

  render(); paintCart();
})();
