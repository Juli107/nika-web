/* Bliss Cookies · concepto NIKA — cookie 3D que se parte con el scroll */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { document.documentElement.classList.add('no-gl'); throw e; }
window.__gl = true;
document.documentElement.classList.remove('no-gl');
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
camera.position.set(0, 0, 7);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

scene.add(new THREE.HemisphereLight(0xffe2c4, 0x2a1410, 0.35));
const key = new THREE.DirectionalLight(0xfff0dc, 2.0); key.position.set(3, 5, 4); scene.add(key);
const rim = new THREE.PointLight(0xff5c93, 30, 14); rim.position.set(-3.5, 1.5, -2.5); scene.add(rim);
const fill = new THREE.PointLight(0xffb37a, 10, 12); fill.position.set(3, -2, 3); scene.add(fill);

/* ---------- forma de la cookie ---------- */
const R = 1, SEG_W = 72, SEG_H = 48;
// ruido determinístico (sumas de senos) para que las dos mitades coincidan en el corte
const n2 = (x, z) => Math.sin(x * 5.1 + 1.3) * Math.cos(z * 4.7 - 0.4) * 0.5 + Math.sin(x * 11.3 - z * 9.1) * 0.25 + Math.cos(x * 17.0 + z * 15.3 + 2.0) * 0.12;
function shapeVertex(v) {
  const ang = Math.atan2(v.z, v.x);
  const wob = 1 + 0.035 * Math.sin(ang * 5 + 0.7) + 0.02 * Math.sin(ang * 11 + 2.1) + 0.012 * Math.sin(ang * 23);
  v.x *= wob; v.z *= wob;
  const rr = Math.hypot(v.x, v.z);
  if (v.y >= 0) {
    // domo bajo con grietas
    v.y = v.y * 0.42 + n2(v.x, v.z) * 0.05 * (1 - rr * 0.5) - Math.max(0, rr - 0.86) * 0.28;
  } else {
    v.y = Math.max(v.y * 0.2, -0.13); // base casi plana
  }
  return v;
}
const C_TOP = new THREE.Color('#B9773A'), C_EDGE = new THREE.Color('#7A3F16'), C_LIGHT = new THREE.Color('#D9A060'), C_BOT = new THREE.Color('#5E3010');
function cookieHalf(sign) {
  const phiStart = sign > 0 ? Math.PI / 2 : -Math.PI / 2;
  const g = new THREE.SphereGeometry(R, SEG_W, SEG_H, phiStart, Math.PI);
  const p = g.attributes.position, v = new THREE.Vector3(), col = [];
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const up = v.y >= 0;
    shapeVertex(v); p.setXYZ(i, v.x, v.y, v.z);
    const rr = Math.hypot(v.x, v.z), nn = n2(v.x * 1.7, v.z * 1.7);
    const c = up ? C_TOP.clone().lerp(C_EDGE, Math.min(1, Math.max(0, (rr - 0.6) * 2.2))).lerp(C_LIGHT, Math.max(0, nn) * 0.55) : C_BOT.clone();
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, bumpMap: crumbTex, bumpScale: 0.6, envMapIntensity: 0.45 }));

  // tapa del corte: contorno = costura de la esfera (columna 0 y última)
  const pts = [];
  for (let iy = 0; iy <= SEG_H; iy++) { const k = iy * (SEG_W + 1); pts.push(new THREE.Vector2(p.getZ(k), p.getY(k))); }
  for (let iy = SEG_H; iy >= 0; iy--) { const k = iy * (SEG_W + 1) + SEG_W; pts.push(new THREE.Vector2(p.getZ(k), p.getY(k))); }
  const cap = new THREE.ShapeGeometry(new THREE.Shape(pts), 1);
  const cp = cap.attributes.position, uv = cap.attributes.uv;
  for (let i = 0; i < cp.count; i++) {
    const z = cp.getX(i), y = cp.getY(i);
    cp.setXYZ(i, 0, y, z);
    uv.setXY(i, (z + 1) / 2, (y + 0.14) / 0.6);
  }
  cap.computeVertexNormals();
  // normal hacia afuera del corte
  const capMesh = new THREE.Mesh(cap, new THREE.MeshStandardMaterial({ map: insideTex, roughness: 0.75, side: THREE.DoubleSide, bumpMap: insideTex, bumpScale: 1.2, envMapIntensity: 0.4 }));
  capMesh.position.x = 0.002 * -sign;
  const grp = new THREE.Group(); grp.add(mesh, capMesh);
  return grp;
}

/* texturas procedurales */
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const crumbTex = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const g = 90 + rnd() * 120 | 0; x.fillStyle = `rgb(${g},${g},${g})`; x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); }
});
crumbTex.wrapS = crumbTex.wrapT = THREE.RepeatWrapping; crumbTex.repeat.set(3, 3); crumbTex.colorSpace = THREE.NoColorSpace;
const insideTex = canvasTex(1024, 512, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#8E4F1E'); gr.addColorStop(0.16, '#C98D4E'); gr.addColorStop(0.7, '#BD8045'); gr.addColorStop(1, '#7A4119');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 2200; i++) { x.fillStyle = rnd() < 0.5 ? 'rgba(120,70,30,.35)' : 'rgba(255,230,190,.35)'; x.beginPath(); x.arc(rnd() * w, rnd() * h, rnd() * 3.2, 0, 7); x.fill(); }
  for (let i = 0; i < 26; i++) { // chocolate derretido
    const cx = 60 + rnd() * (w - 120), cy = 90 + rnd() * (h - 170), r = 16 + rnd() * 34;
    x.fillStyle = '#3A1C0F'; x.beginPath();
    for (let a = 0; a < 6.3; a += 0.5) { const rr = r * (0.75 + rnd() * 0.45); x.lineTo(cx + Math.cos(a) * rr * 1.3, cy + Math.sin(a) * rr); }
    x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,220,200,.25)'; x.beginPath(); x.ellipse(cx - r * 0.3, cy - r * 0.3, r * 0.35, r * 0.18, -0.4, 0, 7); x.fill();
  }
});

/* chocolate */
const chocoMat = new THREE.MeshStandardMaterial({ color: '#2B140B', roughness: 0.38, metalness: 0, envMapIntensity: 0.6 });
function chunk(size) {
  const g = new THREE.IcosahedronGeometry(size, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.8 + rnd() * 0.5), p.getY(i) * (0.55 + rnd() * 0.3), p.getZ(i) * (0.8 + rnd() * 0.5));
  g.computeVertexNormals();
  return new THREE.Mesh(g, chocoMat);
}
function topY(x, z) { const v = shapeVertex(new THREE.Vector3(x, Math.sqrt(Math.max(0, 1 - x * x - z * z)), z)); return v.y; }

const cookie = new THREE.Group();
const halves = [cookieHalf(-1), cookieHalf(1)];
halves.forEach(h => cookie.add(h));
for (let i = 0; i < 34; i++) {
  const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 0.82;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (Math.abs(x) < 0.07) continue;
  const m = chunk(0.06 + rnd() * 0.06);
  m.position.set(x, topY(x, z) - 0.025, z);
  m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
  halves[x < 0 ? 0 : 1].add(m);
}
// trozos asomando en el corte
for (let s = 0; s < 2; s++) for (let i = 0; i < 6; i++) {
  const z = -0.75 + rnd() * 1.5, y = -0.02 + rnd() * 0.18;
  const m = chunk(0.06 + rnd() * 0.05);
  m.position.set((s ? 1 : -1) * 0.02, y, z);
  halves[s].add(m);
}
// hilos de chocolate entre las mitades
const strands = [];
const strandMat = new THREE.MeshStandardMaterial({ color: '#3A1C0F', roughness: 0.25 });
for (let i = 0; i < 4; i++) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 10, 1, true), strandMat);
  m.rotation.z = Math.PI / 2; m.userData = { y: 0.02 + rnd() * 0.14, z: -0.5 + i * 0.33 + rnd() * 0.1 };
  strands.push(m); cookie.add(m);
}
// migas flotando
const crumbs = new THREE.Group();
const crumbMat = new THREE.MeshStandardMaterial({ color: '#B9773A', roughness: 0.9, envMapIntensity: 0.4 });
for (let i = 0; i < 40; i++) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.02 + rnd() * 0.035, 0), rnd() < 0.3 ? chocoMat : crumbMat);
  m.userData = { a: rnd() * 6.28, r: 1.3 + rnd() * 1.1, y: -0.8 + rnd() * 1.6, s: 0.2 + rnd() * 0.5 };
  crumbs.add(m);
}
scene.add(cookie, crumbs);

/* ---------- escena según scroll ---------- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; }, { passive: true });
// en el celu: el giroscopio inclina la cookie
addEventListener('deviceorientation', e => { if (e.gamma == null) return; mouse.tx = Math.max(-0.5, Math.min(0.5, e.gamma / 60)); mouse.ty = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 60)); }, { passive: true });

let W = 0, H = 0, mobile = false;
function resize() {
  W = innerWidth; H = innerHeight; mobile = W < 820;
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const proc = document.getElementById('proceso'), sab = document.getElementById('sabores');
const callouts = [document.getElementById('co1'), document.getElementById('co2'), document.getElementById('co3')];
const v3 = new THREE.Vector3();
function toScreen(obj, local) { v3.copy(local); obj.localToWorld(v3); v3.project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; }

let t0 = performance.now(), visible = true, spin = 0;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) loop(); });
function loop() {
  if (!visible) return;
  requestAnimationFrame(loop);
  const now = performance.now(), dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
  mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;

  const p = window.blissProgress ? window.blissProgress() : 0;   // 0..1 dentro del proceso
  const pr = proc.getBoundingClientRect();
  const enter = clamp(1 - pr.top / H);                             // 0 en la portada → 1 al fijarse el proceso
  const exitR = sab.getBoundingClientRect();
  const leave = clamp(1 - exitR.top / H);                          // 0 → 1 al entrar en sabores

  // posición: portada a la derecha (arriba en el celu) → centro-derecha en el proceso → se va al salir
  const heroX = mobile ? 0 : 1.55, heroY = mobile ? 0.62 : 0.05, heroS = mobile ? 0.62 : 1.05;
  const procX = mobile ? 0 : 1.05, procY = mobile ? 0.82 : 0, procS = mobile ? 0.5 : 0.95;
  const e = ease(enter);
  let x = lerp(heroX, procX, e), y = lerp(heroY, procY, e), s = lerp(heroS, procS, e);
  y += leave * 3.2; s *= 1 - leave * 0.3;
  cookie.position.set(x, y + Math.sin(now / 900) * 0.04, 0);
  cookie.scale.setScalar(s);
  canvas.style.opacity = String(1 - clamp((leave - 0.55) / 0.45));

  // giro libre en la portada, se acomoda para partirse
  if (!reduce) spin += dt * 0.35 * (1 - e);
  const split = ease(clamp((p - 0.12) / 0.38));                    // 0 → 1 se separan
  const tiltX = lerp(0.62, 0.3, e) + mouse.y * 0.5 - split * 0.05;
  cookie.rotation.set(tiltX, spin * (1 - e) + mouse.x * 0.8 + p * 0.25, lerp(-0.12, 0, e));

  const sep = split * 0.9;
  const open = split * 0.6;
  halves[0].position.x = -sep / 2; halves[0].rotation.y = -open; halves[0].position.y = split * 0.04;
  halves[1].position.x = sep / 2; halves[1].rotation.y = open; halves[1].position.y = -split * 0.04;
  strands.forEach((m, i) => {
    const show = sep > 0.01 && sep < 1.05 + i * 0.05;
    m.visible = show;
    if (!show) return;
    m.position.set(0, m.userData.y, m.userData.z * (1 - split * 0.15));
    m.scale.set(1, sep + 0.04, Math.max(0.12, 1 - sep * 0.75));
    m.scale.x = Math.max(0.12, 1 - sep * 0.75);
  });

  crumbs.position.copy(cookie.position);
  crumbs.children.forEach(c => {
    const u = c.userData; u.a += dt * u.s * (0.4 + split);
    c.position.set(Math.cos(u.a) * u.r * s * (1 + split * 0.4), u.y * s + Math.sin(u.a * 2) * 0.1, Math.sin(u.a) * u.r * 0.6 * s);
    c.rotation.x += dt * 2; c.rotation.y += dt * 1.5;
  });
  crumbs.visible = !reduce;

  // etiquetas sobre la cookie partida
  const showCo = !mobile && p > 0.22 && p < 0.97 && leave < 0.1;
  if (showCo) {
    cookie.updateMatrixWorld();
    const a = toScreen(halves[0], new THREE.Vector3(0.05, 0.12, -0.25));
    const b = toScreen(halves[1], new THREE.Vector3(-0.05, 0.02, 0.3));
    const c = toScreen(halves[1], new THREE.Vector3(0, 0.05, -0.95));
    [[a, 0, -40, -170], [b, 1, 40, 20], [c, 2, 0, 30]].forEach(([pt, i, dy, dx]) => {
      callouts[i].style.left = (pt[0] + dx) + 'px'; callouts[i].style.top = (pt[1] + dy) + 'px';
    });
  }
  callouts[0].classList.toggle('on', showCo && p > 0.3);
  callouts[1].classList.toggle('on', showCo && p > 0.45);
  callouts[2].classList.toggle('on', showCo && p > 0.55);

  renderer.render(scene, camera);
}
loop();
