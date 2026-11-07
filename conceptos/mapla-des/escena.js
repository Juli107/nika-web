/* Mapla Des · concepto NIKA — escena 3D. Todo es procedural (sin modelos ni fotos):
   el isotipo de Mapla en volumen y los productos (vasos, platos, envases, cubiertos, potes, film, embalaje y cotillón).
   Lee el estado window.MD_STATE que anima ui.js con el scroll. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const root = document.documentElement;
const canvas = document.getElementById('gl');
const small = matchMedia('(max-width: 900px)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' });
} catch (e) { root.classList.add('fallback'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, .1, 100);
camera.position.set(0, 0, 9);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

/* luces: clave blanca y bordes rojo y azul, como el isotipo */
scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x0a0c18, .6));
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 6); scene.add(key);
const rimR = new THREE.PointLight(0xff3d3e, 40, 30, 1.6); rimR.position.set(-5, 1, 2); scene.add(rimR);
const rimB = new THREE.PointLight(0x3b63f0, 46, 30, 1.6); rimB.position.set(5, -1.5, 1); scene.add(rimB);

/* ---------- materiales ---------- */
const C = { rojo: 0xff3d3e, azul: 0x1836b2, azul2: 0x3b63f0, celeste: 0x86c7ed, blanco: 0xf4f6fa };
const plastic = (color, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: .32, metalness: 0, clearcoat: .9, clearcoatRoughness: .15 }, o));
const clear = small
  ? new THREE.MeshPhysicalMaterial({ color: 0xdfeeff, roughness: .06, transparent: true, opacity: .32, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false })
  : new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transmission: 1, thickness: .35, ior: 1.46, clearcoat: 1, side: THREE.DoubleSide });
const clearTint = small
  ? new THREE.MeshPhysicalMaterial({ color: 0x86c7ed, roughness: .08, transparent: true, opacity: .42, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false })
  : new THREE.MeshPhysicalMaterial({ color: 0xa8d8f5, roughness: .08, transmission: .92, thickness: .4, ior: 1.46, clearcoat: 1, side: THREE.DoubleSide });
const M = {
  rojo: plastic(C.rojo), azul: plastic(C.azul), azul2: plastic(C.azul2), celeste: plastic(C.celeste), blanco: plastic(C.blanco, { roughness: .4 }),
  negro: plastic(0x16181f, { roughness: .45 }), alu: new THREE.MeshStandardMaterial({ color: 0xdfe3ea, metalness: 1, roughness: .22 }),
  madera: plastic(0xd9b27c, { roughness: .7, clearcoat: 0 })
};

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const carton = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#B98A55'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '70,45,20' : '235,200,150'},${Math.random() * .08})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1); }
  g.fillStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 2, h);
  g.fillStyle = '#FF3D3E'; g.fillRect(0, h * .44, w, h * .12);
  g.fillStyle = '#fff'; g.font = 'bold 44px Lexend, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('MAPLADES', w / 2, h * .5);
});
const waffle = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#D9A15C'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#A8672C'; g.lineWidth = 5;
  for (let i = -w; i < w * 2; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); }
});
waffle.wrapS = waffle.wrapT = THREE.RepeatWrapping; waffle.repeat.set(3, 2);
const banda = canvasTex(1024, 128, (g, w, h) => {
  g.fillStyle = '#F4F6FA'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#FF3D3E'; g.fillRect(0, h * .3, w, h * .4);
  g.fillStyle = '#fff'; g.font = 'bold 40px Lexend, Arial'; g.textBaseline = 'middle';
  for (let x = 20; x < w; x += 340) g.fillText('MAPLADES', x, h * .5);
  g.fillStyle = '#1836B2'; g.fillRect(0, h * .7, w, h * .08);
});

/* ---------- utilidades ---------- */
const lathe = (pts, seg = 64) => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg);
function shell(profile, t = .025) {
  /* perfil exterior de abajo hacia arriba y vuelve por adentro: pieza con espesor */
  const out = profile.map(p => [p[0], p[1]]);
  const inn = profile.slice().reverse().map(p => [Math.max(0, p[0] - t), p[1] + (p[1] === profile[0][1] ? t : 0)]);
  return lathe(out.concat(inn));
}
function fit(obj, size = 1.9) {
  const box = new THREE.Box3().setFromObject(obj), s = new THREE.Vector3(), c = new THREE.Vector3();
  box.getSize(s); box.getCenter(c);
  const k = size / Math.max(s.x, s.y, s.z);
  const wrap = new THREE.Group(); obj.position.sub(c); wrap.add(obj); wrap.scale.setScalar(k);
  return wrap;
}
const mesh = (g, m) => new THREE.Mesh(g, m);

/* ---------- productos ---------- */
function vasos() {
  const g = new THREE.Group();
  const prof = [[0, 0], [.3, 0], [.31, .02], [.44, 1.25], [.46, 1.27], [.47, 1.3]];
  const v1 = mesh(shell(prof, .018), clear); g.add(v1);
  const rim = mesh(new THREE.TorusGeometry(.465, .018, 10, 64), clear); rim.rotation.x = Math.PI / 2; rim.position.y = 1.3; g.add(rim);
  /* gaseosa adentro */
  const liq = mesh(lathe([[0, .03], [.29, .03], [.4, 1.0], [0, 1.0]]), new THREE.MeshPhysicalMaterial({ color: 0xff3d3e, roughness: .1, transmission: small ? 0 : .5, transparent: small, opacity: small ? .85 : 1, thickness: .6 }));
  g.add(liq);
  const v2 = mesh(shell([[0, 0], [.26, 0], [.27, .02], [.37, 1.0], [.39, 1.02]], .02), M.azul2); v2.position.set(.95, 0, -.35); g.add(v2);
  const v3 = mesh(shell([[0, 0], [.22, 0], [.23, .02], [.3, .72], [.32, .74]], .02), M.blanco); v3.position.set(-.85, 0, -.2); g.add(v3);
  return g;
}
function platos() {
  const g = new THREE.Group();
  const prof = [[0, 0], [.55, 0], [.62, .03], [.95, .16], [1.0, .19]];
  [[M.blanco, 0], [M.rojo, .09], [M.azul2, .18], [M.celeste, .27]].forEach(([m, y], i) => {
    const p = mesh(shell(prof, .02), m); p.position.y = y; p.rotation.y = i; g.add(p);
  });
  g.rotation.x = .55;
  return g;
}
function envases() {
  const g = new THREE.Group();
  const base = mesh(new RoundedBoxGeometry(1.7, .5, 1.2, 4, .12), M.negro); g.add(base);
  const comida = mesh(new RoundedBoxGeometry(1.5, .2, 1.0, 3, .08), plastic(0xffc83d, { roughness: .8, clearcoat: 0 })); comida.position.y = .2; g.add(comida);
  const tapa = new THREE.Group();
  const lid = mesh(new RoundedBoxGeometry(1.74, .42, 1.24, 4, .14), clear); lid.position.set(0, .21, .62); tapa.add(lid);
  tapa.position.set(0, .25, -.62); tapa.rotation.x = -.75; g.add(tapa);
  const b2 = mesh(new RoundedBoxGeometry(1.2, .35, .9, 4, .1), M.alu); b2.position.set(.5, -.45, .75); b2.rotation.y = -.4; g.add(b2);
  return g;
}
function cubiertos() {
  const g = new THREE.Group();
  const ex = (shape, d = .06) => new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 2, curveSegments: 16 });
  /* tenedor: el del logo de Mapla */
  const f = new THREE.Shape();
  f.moveTo(-.07, -1.3); f.lineTo(.07, -1.3); f.lineTo(.08, -.2); f.quadraticCurveTo(.26, -.1, .26, .15); f.lineTo(.26, .75);
  for (let i = 0; i < 4; i++) { const x = .26 - i * .14; f.lineTo(x, .75); f.lineTo(x - .07, .75); if (i < 3) { f.lineTo(x - .07, .25); f.lineTo(x - .14, .25); } }
  f.lineTo(-.26, .15); f.quadraticCurveTo(-.26, -.1, -.08, -.2); f.lineTo(-.07, -1.3);
  const fork = mesh(ex(f), M.azul2); fork.rotation.z = -.32; fork.position.x = -.45; g.add(fork);
  const k = new THREE.Shape();
  k.moveTo(-.07, -1.3); k.lineTo(.07, -1.3); k.lineTo(.08, -.15); k.quadraticCurveTo(.16, .5, .02, .9); k.lineTo(-.08, .9); k.lineTo(-.08, -.15);
  const knife = mesh(ex(k), M.rojo); knife.rotation.z = .02; knife.position.set(.05, .05, -.1); g.add(knife);
  const sp = new THREE.Group();
  const bowl = mesh(new THREE.SphereGeometry(.26, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.blanco); bowl.scale.set(1, .35, 1.45); bowl.rotation.x = Math.PI / 2; bowl.position.y = .55; sp.add(bowl);
  const h = mesh(new RoundedBoxGeometry(.13, 1.6, .05, 2, .02), M.blanco); h.position.y = -.45; sp.add(h);
  sp.rotation.z = .34; sp.position.x = .55; g.add(sp);
  return g;
}
function helado() {
  const g = new THREE.Group();
  const pote = mesh(shell([[0, 0], [.42, 0], [.44, .02], [.55, .8], [.57, .82]], .02), new THREE.MeshPhysicalMaterial({ map: banda, roughness: .45, clearcoat: .5 }));
  pote.position.set(-.55, -.4, 0); g.add(pote);
  const tapa = mesh(new THREE.CylinderGeometry(.6, .6, .06, 48), M.blanco); tapa.position.set(-.55, .47, 0); tapa.rotation.z = .25; tapa.position.x -= .05; g.add(tapa);
  const cono = mesh(new THREE.ConeGeometry(.32, 1.15, 48, 1, true), new THREE.MeshStandardMaterial({ map: waffle, roughness: .8, side: THREE.DoubleSide }));
  cono.rotation.x = Math.PI; cono.position.set(.55, -.25, .1); g.add(cono);
  [[0xff8fa8, .45], [0x86c7ed, .78]].forEach(([c, y], i) => { const b = mesh(new THREE.SphereGeometry(.34 - i * .03, 32, 24), plastic(c, { roughness: .6, clearcoat: .2 })); b.position.set(.55 + i * .03, y, .1); b.scale.y = .9; g.add(b); });
  const cuch = mesh(new RoundedBoxGeometry(.08, .55, .03, 2, .015), M.rojo); cuch.position.set(.75, .95, .1); cuch.rotation.z = -.5; g.add(cuch);
  return g;
}
function film() {
  const g = new THREE.Group();
  const caja = mesh(new RoundedBoxGeometry(2.3, .42, .42, 3, .04), new THREE.MeshPhysicalMaterial({ map: banda, roughness: .5 })); caja.position.set(0, -.55, 0); g.add(caja);
  const rolloA = mesh(new THREE.CylinderGeometry(.24, .24, 2.0, 48), M.alu); rolloA.rotation.z = Math.PI / 2; rolloA.position.set(0, .15, 0); g.add(rolloA);
  const hoja = new THREE.PlaneGeometry(1.95, 1.2, 1, 20); const pa = hoja.attributes.position;
  for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); pa.setZ(i, Math.sin((y + .6) * 2.2) * .18); }
  hoja.computeVertexNormals();
  const sheet = mesh(hoja, new THREE.MeshStandardMaterial({ color: 0xe6e9ef, metalness: 1, roughness: .3, side: THREE.DoubleSide })); sheet.position.set(0, .4, .5); sheet.rotation.x = -1.1; g.add(sheet);
  const rolloF = mesh(new THREE.CylinderGeometry(.28, .28, 1.8, 48), clearTint); rolloF.rotation.z = Math.PI / 2; rolloF.position.set(.15, .75, -.55); g.add(rolloF);
  const core = mesh(new THREE.CylinderGeometry(.1, .1, 1.82, 24), M.madera); core.rotation.z = Math.PI / 2; core.position.copy(rolloF.position); g.add(core);
  return g;
}
function embalaje() {
  const g = new THREE.Group();
  const mc = new THREE.MeshStandardMaterial({ map: carton, roughness: .85 });
  const mi = new THREE.MeshStandardMaterial({ color: 0x9c6f3e, roughness: .9, side: THREE.DoubleSide });
  const W = 1.5, H = 1.1, D = 1.1;
  const caja = new THREE.Group();
  [[0, 0, D / 2, 0], [0, 0, -D / 2, Math.PI]].forEach(([x, y, z, r]) => { const p = mesh(new THREE.PlaneGeometry(W, H), mc); p.position.set(x, y, z); p.rotation.y = r; caja.add(p); });
  [[W / 2, Math.PI / 2], [-W / 2, -Math.PI / 2]].forEach(([x, r]) => { const p = mesh(new THREE.PlaneGeometry(D, H), mc); p.position.x = x; p.rotation.y = r; caja.add(p); });
  const fondo = mesh(new THREE.PlaneGeometry(W, D), mi); fondo.rotation.x = -Math.PI / 2; fondo.position.y = -H / 2; caja.add(fondo);
  caja.children.forEach(c => { if (c.material === mc) { const b = mesh(c.geometry, mi); b.position.copy(c.position); b.rotation.copy(c.rotation); b.rotateY(Math.PI); b.translateZ(.005); caja.add(b); } });
  /* solapas abiertas */
  [[0, D / 2, 1, .5], [0, -D / 2, -1, .5]].forEach(([x, z, s]) => { const pv = new THREE.Group(); pv.position.set(x, H / 2, z); const f = mesh(new THREE.PlaneGeometry(W, D / 2), mi); f.position.z = s * D / 4; f.rotation.x = -Math.PI / 2; pv.add(f); pv.rotation.x = s * .9; caja.add(pv); });
  [[W / 2, 1], [-W / 2, -1]].forEach(([x, s]) => { const pv = new THREE.Group(); pv.position.set(x, H / 2, 0); const f = mesh(new THREE.PlaneGeometry(W / 2.4, D), mi); f.position.x = s * W / 4.8; f.rotation.x = -Math.PI / 2; pv.add(f); pv.rotation.z = -s * 1.1; caja.add(pv); });
  g.add(caja);
  const cinta = mesh(new THREE.TorusGeometry(.32, .12, 16, 48), new THREE.MeshPhysicalMaterial({ color: 0xc89b5a, roughness: .25, transmission: small ? 0 : .5, thickness: .3, clearcoat: 1 }));
  cinta.position.set(1.05, -.35, .55); cinta.rotation.set(.3, .6, 0); g.add(cinta);
  return g;
}
function globoGeo() {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24, a = t * Math.PI; pts.push([Math.sin(a) * (.5 + .08 * Math.sin(a)) * (1 - .25 * t * t), -Math.cos(a) * .62 - .06 * t]); }
  pts.unshift([0, -.62 - .05]); pts.unshift([.05, -.72]); pts.unshift([0, -.74]);
  return lathe(pts, 48);
}
const GLOBO = globoGeo();
function globo(color) {
  const g = new THREE.Group();
  g.add(mesh(GLOBO, plastic(color, { roughness: .18, clearcoat: 1, sheen: .5 })));
  const hilo = mesh(new THREE.CylinderGeometry(.006, .006, 1.4, 4), new THREE.MeshBasicMaterial({ color: 0xdfe3ea })); hilo.position.y = -1.45; g.add(hilo);
  return g;
}
function cotillon() {
  const g = new THREE.Group();
  [[C.rojo, -.55, .25, 0], [C.azul2, .2, .55, -.3], [C.celeste, .65, .05, .25]].forEach(([c, x, y, z]) => { const b = globo(c); b.position.set(x, y, z); b.rotation.z = -x * .3; g.add(b); });
  const vela = mesh(new THREE.CylinderGeometry(.06, .06, .5, 16), M.blanco); vela.position.set(-.2, -.9, .5); g.add(vela);
  const llama = mesh(new THREE.SphereGeometry(.06, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffc83d })); llama.scale.y = 1.8; llama.position.set(-.2, -.56, .5); g.add(llama);
  return g;
}

const builders = [vasos, platos, envases, cubiertos, helado, film, embalaje, cotillon];
const world = new THREE.Group(); scene.add(world);
const products = builders.map((b, i) => {
  const p = fit(b(), i === 3 ? 2.2 : 1.9);
  const holder = new THREE.Group(); holder.add(p); world.add(holder);
  holder.userData = { spin: Math.random() * 6 };
  return holder;
});

/* ---------- isotipo en volumen ---------- */
const logo = new THREE.Group(); world.add(logo);
function prism(points, mat, depth = .55) {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => { const X = (x - 340) / 100, Y = -(y - 166) / 100; i ? s.lineTo(X, Y) : s.moveTo(X, Y); });
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: .06, bevelSize: .05, bevelSegments: 4 });
  geo.translate(0, 0, -depth / 2);
  const m = mesh(geo, mat);
  /* cada pieza gira sobre su propio centro */
  geo.computeBoundingBox(); const c = new THREE.Vector3(); geo.boundingBox.getCenter(c); geo.translate(-c.x, -c.y, 0);
  const piv = new THREE.Group(); piv.position.copy(c); piv.add(m); piv.userData.home = c.clone(); return piv;
}
const pieces = [
  prism([[150, 168], [220, 168], [255, 230], [220, 292], [150, 292], [115, 230]], M.celeste),
  prism([[212, 38], [300, 38], [410, 248], [386, 295], [300, 295], [190, 82]], M.rojo),
  prism([[356, 38], [446, 38], [556, 248], [532, 295], [446, 295], [334, 82]], M.azul)
];
const dirs = [new THREE.Vector3(-1.6, -.6, .6), new THREE.Vector3(-.3, 1.2, -.8), new THREE.Vector3(1.6, -.3, .4)];
pieces.forEach(p => logo.add(p));
logo.scale.setScalar(.95);

/* ---------- globos del cotillón ---------- */
const party = new THREE.Group(); world.add(party);
const PC = [C.rojo, C.azul2, C.celeste, C.blanco];
const balloons = [];
for (let i = 0; i < (small ? 9 : 14); i++) {
  const b = globo(PC[i % 4]); const s = .55 + Math.random() * .45; b.scale.setScalar(s);
  b.userData = { x: (Math.random() - .5) * 5.5, z: (Math.random() - .5) * 3 - .5, sp: .25 + Math.random() * .3, ph: Math.random() * 10, y0: Math.random() * 8 };
  party.add(b); balloons.push(b);
}
const confN = small ? 140 : 260;
const conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(.07, .12), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .5, metalness: .2 }), confN);
const confData = [];
const col = new THREE.Color();
for (let i = 0; i < confN; i++) { conf.setColorAt(i, col.setHex(PC[i % 3])); confData.push({ x: (Math.random() - .5) * 7, y: Math.random() * 7, z: (Math.random() - .5) * 4, r: Math.random() * 6, v: .3 + Math.random() * .5 }); }
party.add(conf);

/* ---------- animación ---------- */
const ST = () => window.MD_STATE || { x: .5, y: 0, s: 1, logo: 1, explode: 0, orbit: 1, focus: 0, prod: 0, balloons: 0, tilt: 0 };
const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', e => { ptr.tx = e.clientX / innerWidth - .5; ptr.ty = e.clientY / innerHeight - .5; }, { passive: true });
const dummy = new THREE.Object3D();
const clock = new THREE.Clock();
const smooth = x => x * x * (3 - 2 * x);
let running = true, t = 0;
document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { clock.getDelta(); loop(); } });

function frame(dt) {
  const s = ST();
  t += reduce ? dt * .25 : dt;
  ptr.x += (ptr.tx - ptr.x) * .05; ptr.y += (ptr.ty - ptr.y) * .05;
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z, halfW = halfH * camera.aspect;
  world.position.set(s.x * halfW, s.y * halfH, 0);
  const base = Math.min(1, camera.aspect / 1.2) * .25 + .75;
  world.scale.setScalar(s.s * base);
  world.rotation.x = s.tilt * .5 + ptr.y * .18;
  world.rotation.y = ptr.x * .35;

  /* isotipo */
  const L = smooth(Math.max(0, Math.min(1, s.logo)));
  logo.visible = L > .01;
  logo.scale.setScalar(.95 * L);
  logo.rotation.y = Math.sin(t * .35) * .35 + s.explode * .6;
  logo.rotation.x = Math.sin(t * .27) * .1;
  pieces.forEach((p, i) => {
    p.position.copy(p.userData.home).addScaledVector(dirs[i], s.explode * 1.2);
    p.rotation.set(s.explode * (i - 1) * 1.1 + Math.sin(t + i) * .05 * s.explode, s.explode * (i + 1) * .8, s.explode * (1 - i) * .5);
  });

  /* productos: órbita alrededor del isotipo o uno al frente */
  const N = products.length, vis = Math.max(s.orbit, s.focus);
  products.forEach((h, i) => {
    const a = i / N * Math.PI * 2 + t * .18;
    const R = 2.75;
    const ox = Math.cos(a) * R, oz = Math.sin(a) * R * .55 - .3, oy = Math.sin(a * 2 + t * .5) * .25 + Math.sin(a) * .5;
    const d = i - s.prod, ad = Math.abs(d);
    const fx = d * .9, fy = -d * 3.1, fz = -ad * 1.4;
    const f = s.focus;
    h.position.set(ox + (fx - ox) * f, oy + (fy - oy) * f, oz + (fz - oz) * f);
    const so = .5, sf = 1.25 * (1 - .5 * Math.min(1, ad));
    let sc = (so + (sf - so) * f) * vis;
    if (f > .5 && ad > .55) sc *= Math.max(0, 1 - (ad - .55) * 1.6);
    h.scale.setScalar(Math.max(.0001, sc));
    h.visible = sc > .002;
    h.rotation.y = h.userData.spin + t * (.45 - .25 * f) + d * 1.4;
    h.rotation.x = Math.sin(t * .6 + i) * .12 * (1 - f) + .12 * f;
    h.rotation.z = Math.sin(t * .4 + i * 2) * .08;
  });

  /* globos y papel picado */
  const B = smooth(Math.max(0, Math.min(1, s.balloons)));
  party.visible = B > .01;
  if (party.visible) {
    balloons.forEach(b => {
      const u = b.userData, y = ((u.y0 + t * u.sp) % 8) - 4;
      b.position.set(u.x + Math.sin(t * .7 + u.ph) * .3, y - (1 - B) * 6, u.z);
      b.rotation.z = Math.sin(t + u.ph) * .15;
    });
    confData.forEach((c, i) => {
      const y = 3.5 - ((c.y + t * c.v) % 7);
      dummy.position.set(c.x + Math.sin(t + i) * .2, y + (1 - B) * 6, c.z);
      dummy.rotation.set(t * 2 + c.r, t * 1.5 + c.r, c.r);
      dummy.scale.setScalar(B); dummy.updateMatrix(); conf.setMatrixAt(i, dummy.matrix);
    });
    conf.instanceMatrix.needsUpdate = true;
  }
  rimR.position.x = -5 + Math.sin(t * .5) * 1.5; rimB.position.y = -1.5 + Math.cos(t * .4) * 1.5;
}

function loop() {
  if (!running) return;
  requestAnimationFrame(loop);
  frame(Math.min(clock.getDelta(), .05));
  renderer.render(scene, camera);
}
function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
}
let rw = innerWidth;
addEventListener('resize', () => { if (!small || Math.abs(innerWidth - rw) > 40) { rw = innerWidth; resize(); } else { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); } });
loop();
window.MD_READY = true;
