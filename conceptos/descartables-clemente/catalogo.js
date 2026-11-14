/* Descartables Clemente · concepto NIKA — catálogo de la tienda. Artículos, presentaciones y PRECIOS DE MUESTRA:
   en la versión final se cargan desde la lista real del local.
   u = unidades por paquete (venta por menor) · b = unidades por caja (venta por mayor)
   p = precio del paquete por menor, en pesos · r = rubros · s = 0 si no hay stock */
(function () {
  var CATS = [
    { id: 'vasos', n: 'Vasos', c: '#F3E4D3' },
    { id: 'platos', n: 'Platos', c: '#FBF7F3' },
    { id: 'envases', n: 'Bandejas y envases', c: '#DADDE3' },
    { id: 'cubiertos', n: 'Cubiertos y sorbetes', c: '#E8282E' },
    { id: 'postres', n: 'Potes y postres', c: '#FFC23D' },
    { id: 'film', n: 'Film, aluminio y manteca', c: '#C9D2DE' },
    { id: 'embalaje', n: 'Cajas y embalaje', c: '#C9A06A' },
    { id: 'combos', n: 'Combos de cumple', c: '#FF8A8B' },
    { id: 'limpieza', n: 'Limpieza institucional', c: '#8FD0B8' }
  ];
  var RUBROS = [
    { id: 'gas', n: 'Pizzerías y rotiserías' },
    { id: 'pan', n: 'Panaderías y repostería' },
    { id: 'caf', n: 'Cafeterías y heladerías' },
    { id: 'eve', n: 'Cumpleaños y eventos' },
    { id: 'inst', n: 'Instituciones y empresas' },
    { id: 'emp', n: 'Emprendedores' }
  ];
  var A = [
    ['Vaso plástico 110 cc transparente', 'vasos', ['caf', 'eve'], 50, 1000, 2600],
    ['Vaso plástico 220 cc transparente', 'vasos', ['eve', 'gas'], 50, 1000, 3400],
    ['Vaso plástico 500 cc transparente', 'vasos', ['eve', 'gas'], 100, 1000, 15990],
    ['Vaso térmico con pico vertedor 240 cc', 'vasos', ['caf'], 50, 1000, 6900],
    ['Vaso térmico con pico vertedor 360 cc', 'vasos', ['caf'], 50, 1000, 8400],
    ['Vaso de color 300 cc pastel', 'vasos', ['eve'], 25, 500, 3900, 0],

    ['Plato playo 22 cm blanco', 'platos', ['eve', 'gas'], 25, 500, 3300],
    ['Plato de postre 15 cm blanco', 'platos', ['eve', 'pan'], 50, 500, 4200],
    ['Plato rígido 22 cm rosa pastel', 'platos', ['eve'], 10, 200, 3100],
    ['Plato de cartón 26 cm', 'platos', ['gas', 'eve'], 50, 500, 5400],

    ['Bandeja de aluminio F75 con tapa', 'envases', ['gas'], 50, 300, 29470],
    ['Bandeja de aluminio F100 con tapa', 'envases', ['gas'], 50, 300, 34900],
    ['Bandeja plástica 105 apta microondas', 'envases', ['gas'], 100, 500, 21290],
    ['Bandeja de telgopor 618 (15 × 20 cm)', 'envases', ['gas', 'pan'], 100, 500, 15790],
    ['Envase PET con tapa 500 cc', 'envases', ['gas', 'caf'], 25, 500, 6200],
    ['Envase hamburguesa de telgopor', 'envases', ['gas'], 50, 500, 5900, 0],

    ['Tenedor blanco', 'cubiertos', ['gas', 'eve'], 50, 1000, 2100],
    ['Cuchillo blanco', 'cubiertos', ['gas', 'eve'], 50, 1000, 2100],
    ['Cuchara sundae transparente', 'cubiertos', ['caf', 'pan', 'eve'], 100, 2000, 4900],
    ['Kit de cubiertos de madera', 'cubiertos', ['gas'], 25, 500, 5200],
    ['Sorbetes flexibles', 'cubiertos', ['caf', 'eve'], 100, 2000, 1900],

    ['Vasito shot 110 cc para postre', 'postres', ['pan', 'eve'], 100, 1000, 9900],
    ['Vaso octogonal cristal para postre', 'postres', ['pan', 'eve'], 50, 500, 21990],
    ['Pote de telgopor ¼ kg', 'postres', ['caf'], 25, 500, 3600],
    ['Pote de telgopor 1 kg', 'postres', ['caf'], 25, 500, 6400],
    ['Molde de papel para budín 500 g', 'postres', ['pan'], 100, 1000, 42990],

    ['Papel film 38 cm × 300 m', 'film', ['gas', 'pan'], 1, 8, 12900],
    ['Papel aluminio 38 cm × 1 kg', 'film', ['gas'], 1, 8, 31900],
    ['Papel manteca 38 cm × 1 kg', 'film', ['pan', 'gas'], 1, 8, 19990],
    ['Kit aluminio + manteca + film', 'film', ['gas', 'pan'], 1, 6, 52360],
    ['Kit film 300 m + aluminio 1 kg', 'film', ['gas'], 1, 6, 25460],

    ['Caja para pizza grande 32 × 32 cm', 'embalaje', ['gas'], 100, 100, 73680],
    ['Caja para media pizza 32 × 17,5 cm', 'embalaje', ['gas'], 100, 100, 32990],
    ['Caja para empanadas 28,5 × 21,5 cm', 'embalaje', ['gas'], 100, 100, 57890],
    ['Caja blanca con visor 25 × 20 × 8 cm', 'embalaje', ['pan', 'emp'], 10, 200, 21050],
    ['Caja con visor para alfajores', 'embalaje', ['pan', 'emp'], 10, 200, 10520],
    ['Caja para mate con visor', 'embalaje', ['emp'], 10, 200, 13680],
    ['Cinta de embalar 48 × 100 m (pack × 6)', 'embalaje', ['emp', 'inst'], 1, 12, 14990],
    ['Bolsa de consorcio 90 × 120 (× 100)', 'embalaje', ['inst', 'gas'], 1, 10, 28490],
    ['Bolsa riñón camiseta 40 × 50', 'embalaje', ['gas', 'emp'], 100, 1000, 6900],

    ['Combo cumple 50 personas: platos, vasos y servilletas', 'combos', ['eve'], 1, 10, 15740],
    ['Combo 100 personas: plato, tenedor y vaso', 'combos', ['eve'], 1, 10, 27990],
    ['Kit cumpleaños 10 platos y 10 vasos pastel', 'combos', ['eve'], 1, 20, 13680],
    ['Combo postre 50 platos y 50 tenedores', 'combos', ['eve', 'pan'], 1, 10, 12630],
    ['Combo postrecito 100 vasos shot + 100 cucharas', 'combos', ['eve', 'pan'], 1, 10, 15780],

    ['Papel higiénico jumbo × 8 rollos de 300 m', 'limpieza', ['inst'], 1, 10, 15150],
    ['Toallas intercaladas blancas 20 × 24 (1,6 kg)', 'limpieza', ['inst', 'gas'], 1, 6, 13870],
    ['Bobina industrial 19 cm × 400 m (× 2)', 'limpieza', ['inst', 'gas'], 1, 6, 37990],
    ['Servilletas de papel × 80', 'limpieza', ['gas', 'eve', 'caf'], 1, 50, 1900]
  ];
  var r10 = function (x) { return Math.round(x / 10) * 10; };
  window.MD_CATS = CATS;
  window.MD_RUBROS = RUBROS;
  window.MD_CATALOGO = A.map(function (a, i) {
    var u = a[3], b = a[4], p = a[5];
    return { id: 'a' + i, n: a[0], cat: a[1], r: a[2], u: u, b: b, p: p,
      pm: r10(p * (b / u) * .85), /* caja: unos 15 % menos por unidad */
      s: a[6] === 0 ? 0 : 1, pop: (i * 37) % 11 };
  });
})();
