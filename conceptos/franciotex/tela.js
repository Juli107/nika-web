/* Franciotex · concepto NIKA — los productos en 3D.
   Cada tela se teje en tiempo real: los hilos se dibujan en un canvas (color, relieve y huecos de la trama)
   y la ondulación se calcula en la placa de video. La franela y la ballerina usan la textura de fotos reales (fotos/).
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
  /* rejillas y repasador: trama de fotos reales de algodón (Pexels) con las franjas tejidas encima */
  rejilla:   { cm: [40, 40], photo: 'fotos/rejilla-tex.jpg', avg: '#F1EBDD', rep: 3.2, holes: true, dim: .86, sheen: 0xFFF4E2, fringe: .045,
               hstripes: [[.17, .2, '#2E8B57'], [.215, .245, '#D23A2E'], [.755, .785, '#D23A2E'], [.8, .83, '#2E8B57']] },
  argentina: { cm: [50, 40], photo: 'fotos/rejilla-tex.jpg', avg: '#F3EEE2', rep: 3.6, holes: true, dim: .86, sheen: 0xFFF4E2, fringe: .045,
               hstripes: [[.12, .2, '#4F96D8'], [.215, .24, '#E0A92E'], [.44, .56, '#4F96D8'], [.76, .785, '#E0A92E'], [.8, .88, '#4F96D8']] },
  repasador: { cm: [45, 64], photo: 'fotos/repasador-tex.jpg', avg: '#F5F2EC', rep: 2.6, dim: .9, sheen: 0xFFF8EE,
               hstripes: [[.06, .1, '#2F5DA8'], [.115, .125, '#2F5DA8'], [.875, .885, '#2F5DA8'], [.9, .94, '#2F5DA8']],
               vstripes: [[.06, .09, '#2F5DA8'], [.91, .94, '#2F5DA8']] },
  /* trapo de piso: textura de la foto real, franjas azul y roja a un costado y flecos abajo */
  piso:      { cm: [50, 60], photo: 'fotos/piso-tex.jpg', avg: '#E3D5BF', rep: 3.4, holes: true, dim: .8, grain: 7, sheen: 0xFFF4E2,
               vstripes: [[.035, .05, '#1C2440'], [.065, .085, '#C3242B'], [.1, .118, '#1C2440'], [.132, .15, '#C3242B'], [.955, .962, '#C3242B']], fringe: .05 },
  /* franela y ballerina: textura tomada de fotos reales del producto */
  franela:   { cm: [40, 50], photo: 'fotos/franela-tex.jpg', avg: '#E3202B', rep: 3.6, edge: '#9E0E17', felt: true, sheen: 0xFF2A2A },
  ballerina: { cm: [40, 40], photo: 'fotos/ballerina-tex.jpg', avg: '#E2CF14', rep: 2.4, felt: true, sheen: 0xFFE000 },
  auto:      { cm: [50, 60], photo: 'fotos/auto-tex.jpg', avg: '#EADFC8', rep: 3, holes: true, heavy: true, dim: .84, sheen: 0xFFF4E2, fringe: .04,
               hstripes: [[.42, .47, '#2F5DA8'], [.52, .57, '#C9362C']] }
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

  if (L.photo) { /* se pinta cuando carga la foto (ver paintPhoto) */
    m.fillStyle = L.avg; m.fillRect(0, 0, W, H);
    b.fillStyle = 'rgb(120,255,0)'; b.fillRect(0, 0, W, H);
    return [cm, cb];
  }
  if (L.felt) { /* frisa suave con borde overlock */
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

/* tela a partir de una foto real: la textura se repite, el relieve sale del brillo de la foto
   y la franela lleva el borde cosido (overlock) */
function paintPhoto(L, cm, cb, img) {
  const W = cm.width, H = cm.height, k = BASE / 1280;
  const m = cm.getContext('2d'), b = cb.getContext('2d');
  const sc = W / L.rep / img.width;
  const pat = m.createPattern(img, 'repeat'); pat.setTransform(new DOMMatrix().scale(sc));
  m.fillStyle = pat; m.fillRect(0, 0, W, H);
  const d = m.getImageData(0, 0, W, H), bd = b.createImageData(W, H);
  let lo = 255, hi = 0;
  for (let i = 0; i < d.data.length; i += 4) { const l = (d.data[i] * .3 + d.data[i + 1] * .59 + d.data[i + 2] * .11); if (l < lo) lo = l; if (l > hi) hi = l; }
  const rg = Math.max(1, hi - lo);
  for (let i = 0; i < d.data.length; i += 4) {
    const l = (d.data[i] * .3 + d.data[i + 1] * .59 + d.data[i + 2] * .11);
    const n = (l - lo) / rg; bd.data[i] = 40 + n * 200; bd.data[i + 1] = L.open && n < L.open ? 0 : 255; /* huecos reales de la trama */ bd.data[i + 2] = 0; bd.data[i + 3] = 255;
  }
  b.putImageData(bd, 0, 0);
  if (L.grain) { /* trama gruesa de algodón: hilos irregulares en las dos direcciones */
    const g = L.grain * k;
    m.globalCompositeOperation = 'multiply'; b.globalCompositeOperation = 'source-over';
    for (let y = 0; y < H; y += g) { const a = rnd(.05, .2); m.fillStyle = `rgba(120,95,70,${a})`; m.fillRect(0, y + rnd(-1, 1) * k, W, g * rnd(.25, .45)); b.fillStyle = `rgba(30,255,0,${a * 1.6})`; b.fillRect(0, y, W, g * .35); }
    for (let x = 0; x < W; x += g) { const a = rnd(.04, .16); m.fillStyle = `rgba(120,95,70,${a})`; m.fillRect(x + rnd(-1, 1) * k, 0, g * rnd(.25, .45), H); b.fillStyle = `rgba(30,255,0,${a * 1.6})`; b.fillRect(x, 0, g * .35, H); }
    m.globalCompositeOperation = 'source-over';
  }
  if (L.vstripes || L.hstripes) { /* franjas tejidas: se multiplican sobre la foto para conservar la trama */
    m.globalCompositeOperation = 'multiply';
    for (const [a, z, col] of L.vstripes || []) { m.fillStyle = col; m.fillRect(a * W, 0, (z - a) * W, H); }
    for (const [a, z, col] of L.hstripes || []) { m.fillStyle = col; m.fillRect(0, a * H, W, (z - a) * H); }
    m.globalCompositeOperation = 'source-over';
  }
  if (L.fringe) { /* flecos: hilos sueltos con huecos entre ellos */
    const fh = L.fringe * H, y0 = H - fh, st = 6 * k;
    m.fillStyle = '#0F0E0C'; m.fillRect(0, y0, W, fh);
    b.fillStyle = 'rgb(0,0,0)'; b.fillRect(0, y0, W, fh);
    for (let x = 0; x < W; x += st) {
      const len = fh * rnd(.55, 1), w = st * rnd(.45, .7);
      m.fillStyle = shade(L.avg, rnd(.86, 1)); m.fillRect(x, y0, w, len);
      b.fillStyle = 'rgb(200,255,0)'; b.fillRect(x, y0, w, len);
    }
  }
  /* borde: un poco más oscuro y apretado */
  const e = 14 * k;
  for (const [ctx, col] of [[m, 'rgba(0,0,0,.16)'], [b, 'rgba(255,255,0,.35)']]) { ctx.strokeStyle = col; ctx.lineWidth = e; ctx.strokeRect(e / 2, e / 2, W - e, H - e - (L.fringe ? L.fringe * H : 0)); }
  if (L.edge) {
    const step = 7 * k;
    for (const [ctx, col] of [[m, L.edge], [b, 'rgb(255,255,0)']]) {
      ctx.strokeStyle = col; ctx.lineWidth = 2.2 * k;
      ctx.beginPath();
      for (let x = 0; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x + step * .6, e); ctx.moveTo(x, H); ctx.lineTo(x + step * .6, H - e); }
      for (let y = 0; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(e, y + step * .6); ctx.moveTo(W, y); ctx.lineTo(W - e, y + step * .6); }
      ctx.stroke();
    }
  }
}

const TEX = {};
function texFor(i) {
  const id = P[i].id;
  if (TEX[id]) return TEX[id];
  const [cm, cb] = weave(LOOK[id]);
  const map = new THREE.CanvasTexture(cm); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = ANISO;
  const bump = new THREE.CanvasTexture(cb); bump.anisotropy = ANISO;
  const L = LOOK[id];
  if (L.photo) {
    const img = new Image();
    img.onload = () => { paintPhoto(L, cm, cb, img); map.needsUpdate = true; bump.needsUpdate = true; };
    img.src = L.photo;
  }
  return (TEX[id] = { map, bump, holes: !!L.holes, size: new THREE.Vector2(L.cm[0] / 40 * .92, L.cm[1] / 40 * .92), heavy: !!L.heavy, felt: !!L.felt, sheen: L.sheen, photo: !!L.photo, dim: L.dim });
}

/* ---------------- la tela: ondula en la placa de video ---------------- */
const U = {
  uTime: { value: 0 }, uAmp: { value: 1 }, uFlag: { value: 0 }, uCurl: { value: .6 },
  uSize: { value: new THREE.Vector2(.92, .92) }, uWeave: { value: 1 }, uWarp: { value: 1 }
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
    .replace('#include <begin_vertex>', 'vec3 transformed = clothPos(uv);\nvCUv = uv;')
    .replace('void main() {', 'varying vec2 vCUv;\nvoid main() {');
  /* el telar: arriba de la línea de tejido solo quedan los hilos de la urdimbre; en la línea brilla la pasada */
  sh.fragmentShader = 'uniform float uWeave, uWarp, uTime;\nvarying vec2 vCUv;\n' + sh.fragmentShader
    .replace('#include <map_fragment>', `#include <map_fragment>
    float wl = uWeave * 1.08 - .04;
    if (uWeave < .999 && vCUv.y > wl) {
      float n = 30.;
      float id = floor(vCUv.x * n), fx = fract(vCUv.x * n);
      float d = abs((id + .5) / n - .5) * 2.;
      float len = clamp(uWarp * 1.7 - d * .7, 0., 1.);
      float th = smoothstep(.0, .08, fx) * (1. - smoothstep(.16, .26, fx));
      if (th < .5 || 1. - vCUv.y > len) discard;
      diffuseColor.rgb = vec3(.95, .92, .86) * (.72 + .28 * sin(vCUv.y * 700. + id));
      diffuseColor.a = 1.;
    }`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
    if (uWeave > .001 && uWeave < .999) {
      float wl2 = uWeave * 1.08 - .04;
      float sx = fract(uTime * .45); sx = abs(sx * 2. - 1.);
      float band = 1. - smoothstep(0., .014, abs(vCUv.y - wl2));
      totalEmissiveRadiance += vec3(1., .72, .28) * band * (.35 + 1.6 * exp(-pow((vCUv.x - sx) * 7., 2.)));
    }`);
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
  mat.bumpScale = t.photo ? 1.8 : t.felt ? .8 : (t.heavy ? 3 : 2.2);
  mat.sheenRoughness = t.felt ? .35 : .55;
  mat.sheenColor.set(t.sheen || (t.felt ? 0xFF9A4A : 0xFFF4E2)); mat.sheen = t.photo ? .12 : t.felt ? .7 : 1;
  mat.color.setScalar(t.photo ? (t.dim || .58) : 1); /* las fotos ya traen su luz: se bajan un poco para no lavar el color */
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
const cur = Object.assign({}, window.FX_STATE || {}); cur.threads = 0;
const clock = new THREE.Clock();
const ease = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
function frame() {
  const dt = Math.min(clock.getDelta(), .2);
  const S = window.FX_STATE || cur;
  const f = 1 - Math.exp(-dt * 5);
  for (const k in S) cur[k] = cur[k] === undefined ? S[k] : ease(cur[k], S[k], k === 'prod' ? 1 - Math.exp(-dt * 8) : f);
  ptr.x = ease(ptr.x, ptr.tx, f * .6); ptr.y = ease(ptr.y, ptr.ty, f * .6);

  U.uTime.value += reduce ? dt * .25 : dt;
  U.uWeave.value = cur.weave === undefined ? 1 : cur.weave; U.uWarp.value = cur.warp === undefined ? 1 : cur.warp;
  U.uAmp.value = cur.amp; U.uFlag.value = cur.flag; U.uCurl.value = cur.curl;

  /* producto visible y giro al cambiar */
  const p = cur.prod, fl = Math.floor(p), fr = p - fl;
  const idx = (((Math.round(p)) % N) + N) % N;
  show(idx);
  const spin = Math.PI * (fl + smooth(.32, .68, fr));
  U.uSize.value.lerp(texFor(idx).size, f * 1.4);

  holder.position.set(cur.x * hw + ptr.x * .04, cur.y * hh - ptr.y * .03, cur.z);
  holder.rotation.set(cur.rx + ptr.y * .08, cur.ry + spin + ptr.x * .14, cur.rz);
  holder.scale.setScalar(Math.max(cur.s, .001) * (1 - Math.sin(smooth(.2, .8, fr) * Math.PI) * .08));
  holder.visible = cur.s > .03;

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
    threads.position.y = (cur.ty || 0) * hh + Math.sin(U.uTime.value * .7) * .02;
    threads.rotation.z = cur.tr || 0;
    threads.position.x = (cur.tx || 0) * hw;
  }
  warm.intensity = 1.6 + Math.sin(U.uTime.value * .8) * .4;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
root.classList.add('gl-on');
