/* Mapla Des · concepto NIKA — tienda online: catálogo sin fotos, filtros, carrito y pago (simulado en el concepto). */
(function () {
  'use strict';
  var CAT = window.MD_CATALOGO || [], CATS = window.MD_CATS || [], RUB = window.MD_RUBROS || [];
  var WA = '5493854984294', ENVIO = 4500, MINIMO = 150000, PAGE = 12;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return '$' + Math.round(n).toLocaleString('es-AR'); };
  var catBy = {}; CATS.forEach(function (c) { catBy[c.id] = c; });
  var rubBy = {}; RUB.forEach(function (r) { rubBy[r.id] = r; });
  var artBy = {}; CAT.forEach(function (a) { artBy[a.id] = a; });

  /* ---------- estado ---------- */
  var st = { q: '', cats: [], rubs: [], max: null, stock: false, modo: 'mayor', orden: 'pop', shown: PAGE };
  var cart = {};
  try { var saved = JSON.parse(localStorage.getItem('md-cart') || '{}'); if (saved && typeof saved === 'object') { cart = saved.items || {}; st.modo = saved.modo === 'menor' ? 'menor' : 'mayor'; } } catch (e) {}
  function save() { try { localStorage.setItem('md-cart', JSON.stringify({ items: cart, modo: st.modo })); } catch (e) {} }
  var price = function (a) { return st.modo === 'mayor' ? a.pm : a.p; };
  var pres = function (a) {
    if (st.modo === 'mayor') return 'Bulto × ' + a.b.toLocaleString('es-AR') + ' u.';
    return a.u === 1 ? 'Por unidad' : 'Paquete × ' + a.u + ' u.';
  };
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
  $$('#modoSeg button').forEach(function (b) {
    b.classList.toggle('on', b.dataset.m === st.modo);
    b.addEventListener('click', function () {
      st.modo = b.dataset.m; st.max = null; range.value = 100;
      $$('#modoSeg button').forEach(function (x) { x.classList.toggle('on', x === b); });
      save(); reset(); paintCart();
    });
  });
  $('#fClear').addEventListener('click', clearAll);
  function clearAll() {
    st.q = ''; st.cats = []; st.rubs = []; st.max = null; st.stock = false;
    $('#q').value = ''; range.value = 100; $('#fStock').checked = false;
    $$('#panel input[type=checkbox]').forEach(function (i) { i.checked = false; });
    reset();
  }
  /* desde la ficha 3D de cada producto: «Ver en la tienda» */
  var map3d = { vasos: 'vasos', platos: 'platos', envases: 'envases', cubiertos: 'cubiertos', helado: 'helado', film: 'film', embalaje: 'embalaje', cotillon: 'cotillon' };
  $$('[data-cat]').forEach(function (a) {
    a.addEventListener('click', function () {
      var c = map3d[a.dataset.cat]; if (!c) return;
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
  function card(a) {
    var c = catBy[a.cat], q = cart[a.id] || 0;
    var act = !a.s ? '<button class="add" type="button" disabled>Sin stock</button>'
      : q ? '<div class="qty"><button type="button" data-d="-1" data-id="' + a.id + '" aria-label="Quitar uno">−</button><output>' + q + '</output><button type="button" data-d="1" data-id="' + a.id + '" aria-label="Sumar uno">+</button></div>'
      : '<button class="add" type="button" data-d="1" data-id="' + a.id + '">Agregar</button>';
    return '<article class="it' + (a.s ? '' : ' out') + '"><p class="cat"><i style="background:' + c.c + '"></i>' + c.n + '</p><h3>' + a.n + '</h3><p class="pres">' + pres(a) + ' · ' + unit(a) + '</p>' +
      '<div class="rb2">' + a.r.map(function (x) { return '<span>' + rubBy[x].n + '</span>'; }).join('') + '</div>' +
      '<div class="row2"><p class="pr">' + money(price(a)) + '<small>' + (st.modo === 'mayor' ? 'por bulto' : (a.u === 1 ? 'por unidad' : 'por paquete')) + '</small></p>' + act + '</div></article>';
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
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-d][data-id]'); if (!b) return;
    add(b.dataset.id, +b.dataset.d);
  });

  /* ---------- carrito ---------- */
  function add(id, d) {
    var q = Math.max(0, (cart[id] || 0) + d);
    if (q) cart[id] = q; else delete cart[id];
    save(); render(); paintCart();
    if (d > 0) $$('[data-cart]').forEach(function (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
  }
  function lines() { return Object.keys(cart).filter(function (id) { return artBy[id]; }).map(function (id) { return { a: artBy[id], q: cart[id] }; }); }
  function subtotal() { return lines().reduce(function (s, l) { return s + price(l.a) * l.q; }, 0); }
  function paintCart() {
    var L = lines(), n = L.reduce(function (s, l) { return s + l.q; }, 0), sub = subtotal();
    $$('[data-n]').forEach(function (b) { b.textContent = n; });
    $('#cartFab').classList.toggle('show', n > 0);
    $('#cartBody').innerHTML = L.length ? L.map(function (l) {
      return '<div class="cl"><div><b>' + l.a.n + '</b><small>' + pres(l.a) + ' · ' + money(price(l.a)) + ' c/' + (st.modo === 'mayor' ? 'bulto' : (l.a.u === 1 ? 'unidad' : 'paquete')) + '</small></div><p class="lp">' + money(price(l.a) * l.q) + '</p>' +
        '<div class="qty" style="justify-self:start"><button type="button" data-d="-1" data-id="' + l.a.id + '" aria-label="Quitar uno">−</button><output>' + l.q + '</output><button type="button" data-d="1" data-id="' + l.a.id + '" aria-label="Sumar uno">+</button></div><button class="rm" type="button" data-rm="' + l.a.id + '">Quitar</button></div>';
    }).join('') : '<div class="cempty"><p class="lx" style="font-size:20px;color:#fff">Tu carrito está vacío</p><p style="margin-top:8px">Sumá artículos desde la tienda.</p></div>';
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
  $('#cartBody').addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (b) { delete cart[b.dataset.rm]; save(); render(); paintCart(); } });
  var drawer = $('#drawer'), modal = $('#checkout');
  function openCart() { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.documentElement.style.overflow = 'hidden'; }
  function closeCart() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.documentElement.style.overflow = ''; }
  $$('[data-cart]').forEach(function (b) { b.addEventListener('click', openCart); });
  $$('[data-close]', drawer).forEach(function (b) { b.addEventListener('click', closeCart); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeCart(); closeModal(); panel.classList.remove('open'); } });

  /* ---------- checkout ---------- */
  var order = null;
  function step(n) {
    $('#st1').hidden = n !== 1; $('#st2').hidden = n !== 2;
    $('#paying').style.display = n === 3 ? 'block' : 'none'; $('#ok').style.display = n === 4 ? 'block' : 'none';
    $$('.steps i', modal).forEach(function (i, k) { i.classList.toggle('on', k < Math.min(n, 3)); });
  }
  function openModal() { closeCart(); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.documentElement.style.overflow = 'hidden'; step(1); }
  function closeModal() { if (!modal.classList.contains('open')) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.documentElement.style.overflow = ''; }
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
    e.textContent = ''; summary(); step(2);
  });
  $('#back1').addEventListener('click', function () { step(1); });
  function totals() { var sub = subtotal(), env = envSel() === 'ciudad' ? ENVIO : 0; return { sub: sub, env: env, tot: sub + env }; }
  function summary() {
    var t = totals(), n = lines().reduce(function (s, l) { return s + l.q; }, 0);
    $('#sum').innerHTML = '<div><span>' + n + (st.modo === 'mayor' ? (n === 1 ? ' bulto' : ' bultos') : (n === 1 ? ' artículo' : ' artículos')) + '</span><span>' + money(t.sub) + '</span></div>' +
      '<div><span>Entrega</span><span>' + (envSel() === 'retiro' ? 'Retiro gratis' : envSel() === 'ciudad' ? money(t.env) : 'A coordinar') + '</span></div>' +
      '<div class="t"><span>Total</span><span>' + money(t.tot) + '</span></div>';
    $('#pay').textContent = 'Pagar ' + money(t.tot);
  }
  $$('input[name=pay]').forEach(function (i) { i.addEventListener('change', function () { var v = i.value; $('#pay').textContent = (v === 'mp' ? 'Pagar ' : 'Confirmar pedido · ') + money(totals().tot); }); });
  $('#pay').addEventListener('click', function () {
    var pay = $('input[name=pay]:checked').value, t = totals();
    order = { n: 'MD-' + String(Date.now()).slice(-5), pay: pay, t: t, env: envSel(), L: lines(), modo: st.modo };
    var done = function () {
      step(4);
      $('#okT').textContent = pay === 'mp' ? '¡Pago aprobado!' : '¡Pedido confirmado!';
      $('#okP').textContent = 'Pedido ' + order.n + ' por ' + money(t.tot) + '. ' + (order.env === 'retiro' ? 'Te avisamos por WhatsApp cuando esté listo para retirar.' : 'Te escribimos por WhatsApp para coordinar la entrega.');
      $('#okAlias').hidden = pay !== 'tr';
      $('#okWa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(waText());
      cart = {}; save(); render(); paintCart();
    };
    if (pay === 'mp') { step(3); setTimeout(done, 1800); } else done();
  });
  function waText() {
    var o = order, pago = { mp: 'Mercado Pago (pagado)', tr: 'Transferencia', ef: 'Efectivo al ' + (o.env === 'retiro' ? 'retirar' : 'recibir') }[o.pay];
    var ent = o.env === 'retiro' ? 'Retiro en el local' : o.env === 'ciudad' ? 'Envío a ' + $('#cD').value.trim() : 'Otra localidad: ' + $('#cD').value.trim();
    return '¡Hola Mapla Des! Hice el pedido ' + o.n + ' en la web (' + (o.modo === 'mayor' ? 'por mayor' : 'por menor') + '):\n\n' +
      o.L.map(function (l) { return '• ' + l.q + ' × ' + l.a.n + ' (' + (o.modo === 'mayor' ? 'bulto × ' + l.a.b : (l.a.u === 1 ? 'unidad' : 'paquete × ' + l.a.u)) + ')'; }).join('\n') +
      '\n\nTotal: ' + money(o.t.tot) + '\nPago: ' + pago + '\nEntrega: ' + ent +
      '\nNombre: ' + $('#cN').value.trim() + ($('#cC').value.trim() ? ' · ' + $('#cC').value.trim() : '') + '\nWhatsApp: ' + $('#cT').value.trim();
  }

  render(); paintCart();
})();
