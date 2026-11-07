/* Mapla Des · concepto NIKA — catálogo de la tienda. Artículos, presentaciones y PRECIOS DE MUESTRA:
   en la versión final se cargan desde la lista real del local.
   u = unidades por paquete (venta por menor) · b = unidades por bulto (venta por mayor)
   p = precio del paquete por menor, en pesos · r = rubros · s = 0 si no hay stock */
(function () {
  var CATS = [
    { id: 'vasos', n: 'Vasos', c: '#86C7ED' },
    { id: 'platos', n: 'Platos', c: '#F5F7FC' },
    { id: 'envases', n: 'Envases y bandejas', c: '#CFE7F7' },
    { id: 'cubiertos', n: 'Cubiertos y sorbetes', c: '#3B63F0' },
    { id: 'helado', n: 'Potes y cucuruchos', c: '#FF3D3E' },
    { id: 'film', n: 'Film y aluminio', c: '#C9D2DE' },
    { id: 'embalaje', n: 'Embalaje y bolsas', c: '#C9A06A' },
    { id: 'cotillon', n: 'Cotillón', c: '#FF8A8B' }
  ];
  var RUBROS = [
    { id: 'gas', n: 'Rotiserías y delivery' },
    { id: 'hel', n: 'Heladerías y cafeterías' },
    { id: 'eve', n: 'Eventos y cumpleaños' },
    { id: 'kio', n: 'Kioscos y almacenes' },
    { id: 'casa', n: 'Para la casa' }
  ];
  var A = [
    ['Vaso plástico 110 cc transparente', 'vasos', ['hel', 'eve', 'kio'], 50, 2000, 2200],
    ['Vaso plástico 180 cc transparente', 'vasos', ['eve', 'kio', 'casa'], 50, 2000, 2600],
    ['Vaso plástico 220 cc transparente', 'vasos', ['eve', 'gas', 'casa'], 50, 2000, 2900],
    ['Vaso cervecero 300 cc', 'vasos', ['eve', 'gas'], 50, 1000, 3900],
    ['Vaso trago largo 500 cc', 'vasos', ['eve'], 25, 500, 3600],
    ['Vaso térmico polipapel 8 oz', 'vasos', ['hel', 'gas'], 50, 1000, 5800],
    ['Tapa para vaso térmico 8 oz', 'vasos', ['hel', 'gas'], 50, 1000, 3400],
    ['Vaso de color 300 cc (rojo o azul)', 'vasos', ['eve', 'casa'], 25, 500, 3200, 0],

    ['Plato playo 22 cm blanco', 'platos', ['eve', 'casa', 'gas'], 25, 500, 3100],
    ['Plato hondo 18 cm blanco', 'platos', ['eve', 'casa'], 25, 500, 2900],
    ['Plato de postre 15 cm', 'platos', ['eve', 'casa'], 25, 500, 2200],
    ['Plato de cartón 26 cm', 'platos', ['gas', 'eve'], 50, 500, 4800],
    ['Plato de color 22 cm', 'platos', ['eve'], 10, 200, 1900],

    ['Envase PET con tapa 250 cc', 'envases', ['gas', 'hel'], 25, 500, 4300],
    ['Envase PET con tapa 500 cc', 'envases', ['gas'], 25, 500, 5600],
    ['Envase PET con tapa 1.000 cc', 'envases', ['gas'], 25, 300, 7900],
    ['Bandeja de aluminio F70 con tapa', 'envases', ['gas', 'casa'], 10, 300, 4600],
    ['Bandeja de aluminio F100 con tapa', 'envases', ['gas'], 10, 300, 6200],
    ['Bandeja de telgopor 103', 'envases', ['gas', 'kio'], 100, 1000, 6900],
    ['Envase hamburguesa de telgopor', 'envases', ['gas'], 50, 500, 5200],
    ['Pote PP 250 cc con tapa', 'envases', ['gas', 'hel'], 25, 500, 3800, 0],

    ['Tenedor blanco', 'cubiertos', ['gas', 'eve', 'casa'], 50, 1000, 1800],
    ['Cuchillo blanco', 'cubiertos', ['gas', 'eve', 'casa'], 50, 1000, 1800],
    ['Cuchara sopera blanca', 'cubiertos', ['gas', 'eve'], 50, 1000, 1900],
    ['Cucharita de café', 'cubiertos', ['hel', 'kio'], 100, 2000, 2100],
    ['Kit de cubiertos de madera', 'cubiertos', ['gas'], 25, 500, 4700],
    ['Sorbetes flexibles', 'cubiertos', ['hel', 'eve', 'kio'], 100, 2000, 1600],

    ['Pote de telgopor ¼ kg', 'helado', ['hel'], 25, 500, 3300],
    ['Pote de telgopor ½ kg', 'helado', ['hel'], 25, 500, 4100],
    ['Pote de telgopor 1 kg', 'helado', ['hel'], 25, 500, 5900],
    ['Cucurucho simple', 'helado', ['hel'], 50, 1000, 4400],
    ['Cucharita para helado', 'helado', ['hel'], 100, 5000, 1500],

    ['Film PVC 28 cm × 30 m', 'film', ['casa', 'kio'], 1, 24, 2300],
    ['Film PVC 38 cm × 300 m', 'film', ['gas', 'kio'], 1, 6, 11900],
    ['Papel aluminio 30 cm × 7 m', 'film', ['casa', 'kio'], 1, 24, 2100],
    ['Papel aluminio 45 cm × 100 m', 'film', ['gas'], 1, 6, 24900],
    ['Papel manteca 30 cm × 10 m', 'film', ['casa'], 1, 24, 1900],

    ['Cinta de embalar transparente 48 mm', 'embalaje', ['kio', 'casa'], 1, 36, 1700],
    ['Caja de cartón 40 × 30 × 30 cm', 'embalaje', ['kio', 'casa'], 1, 25, 2600],
    ['Bolsa camiseta 40 × 50 cm', 'embalaje', ['kio', 'gas'], 100, 1000, 5200],
    ['Bolsa de arranque 20 × 30 cm (rollo)', 'embalaje', ['kio'], 1, 10, 6800],
    ['Bolsa de consorcio 60 × 90 cm', 'embalaje', ['casa', 'gas'], 10, 250, 2400],
    ['Caja para pizza', 'embalaje', ['gas'], 10, 100, 5400],

    ['Globos de látex N.º 9 surtidos', 'cotillon', ['eve'], 50, 1000, 4900],
    ['Globo número metalizado 40 cm', 'cotillon', ['eve'], 1, 25, 3200],
    ['Velas de cumpleaños', 'cotillon', ['eve', 'casa'], 24, 480, 1300],
    ['Vela bengala', 'cotillon', ['eve'], 4, 100, 1600],
    ['Guirnalda «Feliz cumple»', 'cotillon', ['eve'], 1, 25, 2700],
    ['Piñata mediana', 'cotillon', ['eve'], 1, 10, 9800],
    ['Mantel plástico 1,2 × 1,8 m', 'cotillon', ['eve', 'casa'], 1, 50, 1900],
    ['Servilletas de color', 'cotillon', ['eve', 'casa', 'gas'], 20, 1000, 1400]
  ];
  var r10 = function (x) { return Math.round(x / 10) * 10; };
  window.MD_CATS = CATS;
  window.MD_RUBROS = RUBROS;
  window.MD_CATALOGO = A.map(function (a, i) {
    var u = a[3], b = a[4], p = a[5];
    return { id: 'a' + i, n: a[0], cat: a[1], r: a[2], u: u, b: b, p: p,
      pm: r10(p * (b / u) * .82), /* bulto: unos 18 % menos por unidad */
      s: a[6] === 0 ? 0 : 1, pop: (i * 37) % 11 };
  });
})();
