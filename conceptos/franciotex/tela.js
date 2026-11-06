/* Franciotex · concepto NIKA — los productos en 3D.
   Cada tela se teje en tiempo real: los hilos se dibujan en un canvas (color, relieve y huecos de la trama)
   y la ondulación se calcula en la placa de video, así que no hace falta descargar ninguna imagen.
   Lee window.FX_STATE, que ui.js anima con el scroll. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const root = document.documentElement;
const canvas = document.getElementById('gl');
const P = window.FX_PRODUCTOS || [];
const N = P.length;
const isMobile = matchMedia('(max-width: 900px)').matches || matchMedia('(pointer: coarse)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { root.classList.add('fallback'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 1.75));
renderer.setClearColor(0x0F0E0C, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const ANISO = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0F0E0C, 4, 9);
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.environmentIntensity = 0.28;

const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 40);
camera.position.set(0, 0, 3.2);

/* luz de estudio: principal cálida, contraluz fría y relleno */
const key = new THREE.DirectionalLight(0xFFF1DC, 3.4); key.position.set(-2.6, 2.4, 2.2); scene.add(key);
const rim = new THREE.DirectionalLight(0x9CC4FF, 2.4); rim.position.set(2.5, 1.2, -2.5); scene.add(rim);
const fill = new THREE.HemisphereLight(0xFFF6E8, 0x1A1610, 0.3); scene.add(fill);
const warm = new THREE.PointLight(0xE5B84B, 2.2, 6, 1.6); warm.position.set(1.6, -1.2, 1.4); scene.add(warm);

/* ---------------- telar: genera las texturas de cada producto ---------------- */
const BASE = isMobile ? 768 : 1280;
const LOOK = {
  rejilla:   { cm: [40, 40], pitch: 20, tw: .76, base: '#F3EEE3', fringe: .045, holes: true,
               weft: (f) => band(f, [[.17, .2, '#2E8B57'], [.215, .245, '#D23A2E'], [.755, .785, '#D23A2E'], [.8, .83, '#2E8B57']]) },
  argentina: { cm: [50, 40], pitch: 20, tw: .76, base: '#F5F1E8', fringe: .045, holes: true,
               weft: (f) => band(f, [[.12, .2, '#7DB6E8'], [.215, .235, '#E5B84B'], [.44, .56, '#7DB6E8'], [.765, .785, '#E5B84B'], [.8, .88, '#7DB6E8']]) },
  repasador: { cm: [45, 64], pitch: 9, tw: .9, base: '#F7F4EE', fringe: 0, holes: false, hem: true,
               weft: (f) => band(f, [[.06, .1, '#2F5DA8'], [.115, .125, '#2F5DA8'], [.875, .885, '#2F5DA8'], [.9, .94, '#2F5DA8']]),
               warp: (f) => band(f, [[.06, .09, '#2F5DA8'], [.91, .94, '#2F5DA8']]) },
  piso:      { cm: [50, 60], pitch: 15, tw: .92, base: '#ECE8E1', fringe: 0, holes: true, waffle: true,
               weft: (f) => (Math.floor(f * 12) % 2 ? '#8F8E8A' : null) },
  franela:   { cm: [40, 50], felt: '#D9661A', edge: '#FFC34D' },
  auto:      { cm: [50, 60], pitch: 17, tw: .86, base: '#EADFC8', fringe: .04, holes: true, heavy: true,
               weft: (f) => band(f, [[.42, .47, '#2F5DA8'], [.49, .5, '#EADFC8'], [.52, .57, '#C9362C']]) }
};
function band(f, list) { for (const b of list) if (f >= b[0] && f < b[1]) return b[2]; return null; }
function rnd(a, b) { return a + Math.random() * (b - a); }
function shade(hex, k) { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); }

function weave(L) {
  const W = BASE, H = Math.round(BASE * L.cm[1] / L.cm[0]);
  const cm = document.createElement('canvas'); cm.width = W; cm.height = H;
  const cb = document.createElement('canvas'); cb.width = W; cb.height = H; /* R = relieve, G = opacidad */
  const m = cm.getContext('2d'), b = cb.getContext('2d');
  const k = BASE / 1280;

  if (L.felt) { /* franela: frisa suave con borde overlock */
    m.fillStyle = L.felt; m.fillRect(0, 0, W, H);
    b.fillStyle = 'rgb(120,255,0)'; b.fillRect(0, 0, W, H);
    for (let i = 0; i < 26000 * k; i++) {
      const x = Math.random() * W, y = Math.random() * H, l = rnd(3, 10) * k, a = Math.random() * 6.3;
      m.strokeStyle = Math.random() < .5 ? 'rgba(255,190,110,.18)' : 'rgba(170,70,10,.16)';
      m.lineWidth = 1; m.beginPath(); m.moveTo(x, y); m.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); m.stroke();
      b.strokeStyle = `rgba(${Math.random() < .5 ? 200 : 60},255,0,.25)`;
      b.beginPath(); b.moveTo(x, y); b.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); b.stroke();
    }
    const e = 16 * k, step = 9 * k;
    m.strokeStyle = L.edge; m.lineWidth = 2.6 * k; b.strokeStyle = 'rgb(255,255,0)'; b.lineWidth = 2.6 * k;
    const zig = (ctx, x0, y0, x1, y1) => {
      const len = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(len / step), dx = (x1 - x0) / len, dy = (y1 - y0) / len;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const s = i % 2 ? e : 2 * k; /* hacia adentro de la tela */
        const ox = dy ? (x0 < W / 2 ? s : -s) : 0, oy = dx ? (y0 < H / 2 ? s : -s) : 0;
        ctx.lineTo(x0 + dx * i * step + ox, y0 + dy * i * step + oy);
      }
      ctx.stroke();
    };
    [m, b].forEach((ctx) => { zig(ctx, 0, 0, W, 0); zig(ctx, 0, H, W, H); zig(ctx, 0, 0, 0, H); zig(ctx, W, 0, W, H); });
    return [cm, cb];
  }

  const p = L.pitch * k, tw = p * L.tw;
  const fr = Math.round(H * (L.fringe || 0));
  m.fillStyle = L.base; m.fillRect(0, 0, W, H);
  b.fillStyle = L.holes ? 'rgb(0,0,0)' : 'rgb(40,255,0)'; b.fillRect(0, 0, W, H);
  if (fr) { m.fillStyle = shade(L.base, .9); }

  const cols = Math.ceil(W / p), rows = Math.ceil((H - 2 * fr) / p);
  const warpC = (i) => (L.warp && L.warp(i / cols)) || L.base;
  const weftC = (j) => (L.weft && L.weft(j / rows)) || L.base;

  /* un hilo: color con sombreado cilíndrico + relieve (R) + opacidad (G) */
  function thread(horiz, pos, from, to, color, wobble, lift) {
    const g1 = horiz ? m.createLinearGradient(0, pos - tw / 2, 0, pos + tw / 2) : m.createLinearGradient(pos - tw / 2, 0, pos + tw / 2, 0);
    g1.addColorStop(0, shade(color, .62)); g1.addColorStop(.5, shade(color, lift ? 1.08 : 1.02)); g1.addColorStop(1, shade(color, .58));
    const g2 = horiz ? b.createLinearGradient(0, pos - tw / 2, 0, pos + tw / 2) : b.createLinearGradient(pos - tw / 2, 0, pos + tw / 2, 0);
    const hi = lift ? 255 : 200;
    g2.addColorStop(0, 'rgb(20,140,0)'); g2.addColorStop(.5, `rgb(${hi},255,0)`); g2.addColorStop(1, 'rgb(20,140,0)');
    /* el hilo de algodón no es parejo: se dibuja en tramos de grosor y posición levemente distintos */
    const seg = lift ? (to - from) : p * .5;
    let off = wobble;
    for (let s = from; s < to; s += seg) {
      const len = Math.min(seg, to - s) + .6;
      const wv = lift ? tw * 1.04 : tw * rnd(.86, 1.08);
      off = lift ? wobble : Math.max(-tw * .12, Math.min(tw * .12, off + rnd(-.5, .5) * k));
      for (const [ctx, g] of [[m, g1], [b, g2]]) {
        ctx.fillStyle = g;
        if (horiz) ctx.fillRect(s, pos - wv / 2 + off, len, wv);
        else ctx.fillRect(pos - wv / 2 + off, s, wv, len);
      }
    }
  }
  /* trama (horizontal) */
  const wy = [];
  for (let j = 0; j < rows; j++) { const y = fr + j * p + p / 2; wy.push(y); thread(true, y, 0, W, weftC(j), rnd(-.6, .6) * k, false); }
  /* urdimbre (vertical), con flecos irregulares arriba y abajo */
  for (let i = 0; i < cols; i++) {
    const x = i * p + p / 2, c = warpC(i);
    const top = fr ? rnd(0, fr * .35) : 0, bot = fr ? H - rnd(0, fr * .35) : H;
    thread(false, x, top, bot, c, rnd(-.6, .6) * k, false);
  }
  /* cruces: la trama pasa por arriba en damero */
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    if ((i + j) % 2) continue;
    const x = i * p + p / 2, y = wy[j];
    thread(true, y, x - tw * .62, x + tw * .62, weftC(j), 0, true);
  }
  if (L.waffle) { /* nido de abeja: celdas en relieve */
    b.globalCompositeOperation = 'multiply';
    const c = p * 4;
    for (let y = fr; y < H - fr; y += c) for (let x = 0; x < W; x += c) {
      const g = b.createRadialGradient(x + c / 2, y + c / 2, c * .1, x + c / 2, y + c / 2, c * .7);
      g.addColorStop(0, 'rgb(140,255,255)'); g.addColorStop(1, 'rgb(255,255,255)');
      b.fillStyle = g; b.fillRect(x, y, c, c);
    }
    b.globalCompositeOperation = 'source-over';
  }
  if (L.hem) { /* dobladillo del repasador */
    const h = 18 * k;
    for (const [ctx, col] of [[m, shade(L.base, .97)], [b, 'rgb(150,255,0)']]) {
      ctx.fillStyle = col; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h); ctx.fillRect(0, 0, h, H); ctx.fillRect(W - h, 0, h, H);
    }
    m.strokeStyle = 'rgba(0,0,0,.18)'; m.setLineDash([6 * k, 5 * k]); m.lineWidth = 1.4 * k; m.strokeRect(h * .9, h * .9, W - h * 1.8, H - h * 1.8); m.setLineDash([]);
  }
  /* pelusa de algodón: fibras sueltas */
  const fib = (L.heavy ? 30000 : 18000) * k;
  for (let i = 0; i < fib; i++) {
    const x = Math.random() * W, y = rnd(fr * .6, H - fr * .6), l = rnd(2, L.heavy ? 9 : 6) * k, a = Math.random() * 6.3;
    m.strokeStyle = Math.random() < .5 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.08)';
    m.lineWidth = .8; m.beginPath(); m.moveTo(x, y); m.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); m.stroke();
    if (L.holes && Math.random() < .35) { b.strokeStyle = 'rgba(160,255,0,.5)'; b.lineWidth = .8; b.beginPath(); b.moveTo(x, y); b.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); b.stroke(); }
  }
  return [cm, cb];
}

const TEX = {};
function texFor(i) {
  const id = P[i].id;
  if (TEX[id]) return TEX[id];
  const [cm, cb] = weave(LOOK[id]);
  const map = new THREE.CanvasTexture(cm); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = ANISO;
  const bump = new THREE.CanvasTexture(cb); bump.anisotropy = ANISO;
  const L = LOOK[id];
  return (TEX[id] = { map, bump, holes: !!L.holes, size: new THREE.Vector2(L.cm[0] / 40 * .92, L.cm[1] / 40 * .92), heavy: !!L.heavy, felt: !!L.felt });
}

/* ---------------- la tela: ondula en la placa de video ---------------- */
const U = {
  uTime: { value: 0 }, uAmp: { value: 1 }, uFlag: { value: 0 }, uCurl: { value: .6 },
  uSize: { value: new THREE.Vector2(.92, .92) }
};
const CLOTH_GLSL = `
uniform float uTime, uAmp, uFlag, uCurl; uniform vec2 uSize;
vec3 clothPos(vec2 uv){
  vec2 p = (uv - .5) * uSize;
  float t = uTime;
  float hang = 1. - uv.y;
  float fl = uv.x;
  float w = mix(.25 + hang, .05 + fl * 1.1, uFlag);
  float z = sin(p.x * 2.6 + t * 1.1) * cos(p.y * 2.1 + t * .8) * .11
          + sin(p.y * 4.2 + t * 1.5 + p.x * 1.7) * .035
          + sin(p.x * 7.3 - p.y * 4.1 + t * 2.1) * .008;
  float fz = sin(p.x * 4.6 - t * 4.2 + p.y * .8) * .1 + sin(p.x * 9.5 - t * 6.3 + p.y * 3.) * .025;
  z = mix(z, fz, uFlag) * uAmp * w;
  z += sin(p.x * 23.1 + p.y * 9.7) * sin(p.y * 19.3 - p.x * 7.1) * .004;
  float x = p.x, y = p.y;
  y -= uFlag * fl * fl * .05 * uAmp;
  if (abs(uCurl) > .001) {
    float th = x * uCurl;
    float c = cos(th), s = sin(th);
    vec2 a = vec2(s / uCurl, (1. - c) / uCurl);
    vec2 n = vec2(-s, c);
    return vec3(a.x + n.x * z, y, -a.y + n.y * z);
  }
  return vec3(x, y, z);
}
vec3 clothNormal(vec2 uv){
  float e = .0025;
  vec3 a = clothPos(uv);
  vec3 bx = clothPos(uv + vec2(e, 0.)) - a;
  vec3 by = clothPos(uv + vec2(0., e)) - a;
  return normalize(cross(bx, by));
}`;
const t0 = texFor(0);
const mat = new THREE.MeshPhysicalMaterial({
  map: t0.map, bumpMap: t0.bump, bumpScale: 2.2, alphaMap: t0.bump, alphaTest: .42,
  roughness: .92, metalness: 0, sheen: 1, sheenRoughness: .55, sheenColor: new THREE.Color(0xFFF4E2),
  side: THREE.DoubleSide, alphaToCoverage: true
});
mat.onBeforeCompile = (sh) => {
  Object.assign(sh.uniforms, U);
  sh.vertexShader = CLOTH_GLSL + '\n' + sh.vertexShader
    .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = clothNormal(uv);\n#ifdef USE_TANGENT\nvec3 objectTangent = vec3(1.,0.,0.);\n#endif')
    .replace('#include <begin_vertex>', 'vec3 transformed = clothPos(uv);');
};
const SEG = isMobile ? 110 : 180;
const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, SEG, SEG), mat);
cloth.frustumCulled = false;
const holder = new THREE.Group(); holder.add(cloth); scene.add(holder);
U.uSize.value.copy(t0.size);
let shown = 0;
function show(i) {
  if (i === shown) return; shown = i;
  dispatchEvent(new CustomEvent('fx:prod', { detail: i }));
  const t = texFor(i);
  mat.map = t.map; mat.bumpMap = t.bump; mat.alphaMap = t.holes ? t.bump : null;
  mat.alphaTest = t.holes ? .42 : 0;
  mat.bumpScale = t.felt ? .8 : (t.heavy ? 3 : 2.2);
  mat.sheenRoughness = t.felt ? .35 : .55;
  mat.sheenColor.set(t.felt ? 0xFF9A4A : 0xFFF4E2); mat.sheen = t.felt ? .7 : 1;
  mat.needsUpdate = true;
}
/* tejer el resto en segundo plano para que el cambio de producto sea instantáneo */
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 120));
let pre = 1; (function next() { if (pre >= N) return; texFor(pre++); idle(next); })();

/* ---------------- hilos de la historia: verde, blanco y rojo ---------------- */
const threads = new THREE.Group(); scene.add(threads);
function plyTex(hex) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 32; const g = c.getContext('2d');
  g.fillStyle = hex; g.fillRect(0, 0, 256, 32);
  for (let x = -40; x < 300; x += 14) { g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 20, 32); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 5, 0); g.lineTo(x + 25, 32); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(70, 1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; return t;
}
const TH = ['#2E8B57', '#F4EFE6', '#D23A2E'].map((c) => new THREE.MeshPhysicalMaterial({ map: plyTex(c), roughness: .8, sheen: 1, sheenRoughness: .4, sheenColor: new THREE.Color(0xffffff), bumpMap: null }));
let thMeshes = [];
function buildThreads(hw, hh) {
  thMeshes.forEach((m) => { m.geometry.dispose(); threads.remove(m); });
  thMeshes = TH.map((mt, k) => {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const f = i / 16;
      pts.push(new THREE.Vector3((f * 2.6 - 1.3) * hw, (Math.sin(f * 6 + k * 1.1) * .16 + (k - 1) * .07 - .42) * hh + Math.cos(f * 3 + k) * .04, -.15 + Math.sin(f * 5 + k * 2) * .3));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 500, isMobile ? .012 : .016, 10, false);
    const m = new THREE.Mesh(geo, mt); m.frustumCulled = false; threads.add(m); return m;
  });
}

/* ---------------- tamaño y cámara ---------------- */
let hw = 1, hh = 1;
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z; hw = hh * camera.aspect;
  buildThreads(hw, hh);
}
resize();
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

/* ---------------- mouse ---------------- */
const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', (e) => { ptr.tx = e.clientX / innerWidth * 2 - 1; ptr.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });

/* ---------------- animación ---------------- */
const cur = Object.assign({}, window.FX_STATE || {});
const clock = new THREE.Clock();
const ease = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
function frame() {
  const dt = Math.min(clock.getDelta(), .05);
  const S = window.FX_STATE || cur;
  const f = 1 - Math.exp(-dt * 5);
  for (const k in S) cur[k] = cur[k] === undefined ? S[k] : ease(cur[k], S[k], k === 'prod' ? 1 - Math.exp(-dt * 8) : f);
  ptr.x = ease(ptr.x, ptr.tx, f * .6); ptr.y = ease(ptr.y, ptr.ty, f * .6);

  U.uTime.value += reduce ? dt * .25 : dt;
  U.uAmp.value = cur.amp; U.uFlag.value = cur.flag; U.uCurl.value = cur.curl;

  /* producto visible y giro al cambiar */
  const p = cur.prod, fl = Math.floor(p), fr = p - fl;
  const idx = (((Math.round(p)) % N) + N) % N;
  show(idx);
  const spin = Math.PI * (fl + smooth(.32, .68, fr));
  U.uSize.value.lerp(texFor(idx).size, f * 1.4);

  holder.position.set(cur.x * hw + ptr.x * .04, cur.y * hh - ptr.y * .03, cur.z);
  holder.rotation.set(cur.rx + ptr.y * .08, cur.ry + spin + ptr.x * .14, cur.rz);
  holder.scale.setScalar(cur.s * (1 - Math.sin(smooth(.2, .8, fr) * Math.PI) * .08));

  /* hilos */
  const tv = cur.threads;
  threads.visible = tv > .01;
  if (threads.visible) {
    thMeshes.forEach((m, k) => {
      const c = m.geometry.index.count, seg = 10 * 6;
      const prog = Math.min(1, Math.max(0, tv * 1.25 - k * .1));
      m.geometry.setDrawRange(0, Math.floor(c * prog / seg) * seg);
    });
    threads.rotation.x = Math.sin(U.uTime.value * .4) * .05 + ptr.y * .05;
    threads.position.y = Math.sin(U.uTime.value * .7) * .02;
  }
  warm.intensity = 1.6 + Math.sin(U.uTime.value * .8) * .4;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
root.classList.add('gl-on');
