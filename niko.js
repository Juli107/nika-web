// Niko, la mascota de NIKA, construida con primitivas de three.js.
export const COLORS = {
  nube: 0xF6F4EF, tinta: 0x0B0C10, sol: 0xFFC83D, amanecer: 0xFF7A1A,
  lila: 0x9B8CFF, rojo: 0xD12E36, sakura: 0xF5A8B8,
};

export function buildNiko(THREE, pose = "frente", face = "feliz", opts = {}) {
  // Disfraces de Halloween: dracula, lobo, frankenstein, momia, zombie, bruja o esqueleto. La antena con el sol nunca cambia.
  const dz = opts.disfraz || null;
  const C = COLORS;
  const shell = new THREE.MeshPhysicalMaterial({ color: C.nube, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.3, sheenColor: new THREE.Color(C.lila) });
  const visorMat = new THREE.MeshPhysicalMaterial({ color: C.tinta, roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02 });
  const glow = (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  const matte = (c, r = 0.5) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const piel = (c, r = 0.55) => new THREE.MeshPhysicalMaterial({ color: c, roughness: r, clearcoat: 0.35, clearcoatRoughness: 0.4 });
  const cabezaMat = dz === "frankenstein" ? piel(0x9CC98A) : dz === "zombie" ? piel(0xA9B892, 0.7) : dz === "lobo" ? piel(0x8C7A68, 0.85) : shell;
  const cuerpoMat = dz === "lobo" ? piel(0x8C7A68, 0.85) : dz === "zombie" ? piel(0xA9B892, 0.7) : dz === "esqueleto" ? piel(0x1A1726, 0.4) : dz === "frankenstein" ? piel(0x2E3038, 0.6) : shell;

  const niko = new THREE.Group();
  const add = (parent, mesh) => { mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; };

  // Cabeza
  const head = new THREE.Group(); head.position.y = 0.15; niko.add(head);
  const skull = add(head, new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), cabezaMat)); skull.scale.set(1.25, 1, 1);
  const visor = add(head, new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), visorMat));
  visor.scale.set(0.98, 0.58, 0.62); visor.position.set(0, 0.06, 0.45);

  for (const s of [-1, 1]) {
    const cheek = add(head, new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), matte(C.sakura, 0.7)));
    cheek.scale.set(0.15, 0.1, 0.04); cheek.position.set(0.74 * s, -0.42, 0.7);
    cheek.lookAt(cheek.position.clone().multiply(new THREE.Vector3(2, 1, 2.2)));
    // Orejas con anillo lila (el brillo del Gear 5)
    const ear = add(head, new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.26, 48), cabezaMat));
    ear.rotation.z = Math.PI / 2; ear.position.set(1.24 * s, 0.05, 0);
    const ring = add(head, new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 16, 48), glow(C.lila, 0.9)));
    ring.rotation.y = Math.PI / 2; ring.position.set(1.38 * s, 0.05, 0);
  }
  // Expresiones en el visor (los ojos brillan en color sol)
  const eyeMat = glow(dz === "dracula" ? 0xFF3B47 : dz === "zombie" ? 0xB8F25A : C.sol);
  // Apoya cada ojo sobre la superficie curva del visor y lo orienta según su normal, para que no quede hundido
  const onVisor = (m, x, y, sx = 1) => {
    const A = 0.98, B = 0.58, Cz = 0.62, yc = 0.06, zc = 0.45;
    const q = Math.max(0.05, 1 - (x / A) ** 2 - ((y - yc) / B) ** 2), z = zc + Cz * Math.sqrt(q);
    const nrm = new THREE.Vector3(x / (A * A), (y - yc) / (B * B), (z - zc) / (Cz * Cz)).normalize();
    m.position.set(x, y, z + 0.05).addScaledVector(nrm, 0.0);
    m.rotation.set(-Math.asin(nrm.y) * 0.6, Math.atan2(nrm.x, nrm.z), 0);
    m.scale.multiplyScalar(sx); add(head, m); return m;
  };
  const arc = (r = 0.17, t = 0.05) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 20, 64, Math.PI), eyeMat);
  const flat = (shape, d = 0.03) => new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 });
  const star = () => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.08 : 0.2, a = Math.PI / 2 + i * Math.PI / 5; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } return new THREE.Mesh(flat(sh), eyeMat); };
  const heart = () => { const sh = new THREE.Shape(); sh.moveTo(0, -0.17); sh.bezierCurveTo(-0.08, -0.1, -0.2, -0.02, -0.2, 0.07); sh.bezierCurveTo(-0.2, 0.17, -0.06, 0.2, 0, 0.1); sh.bezierCurveTo(0.06, 0.2, 0.2, 0.17, 0.2, 0.07); sh.bezierCurveTo(0.2, -0.02, 0.08, -0.1, 0, -0.17); return new THREE.Mesh(flat(sh), glow(C.sakura)); };
  const bar = (w = 0.3) => new THREE.Mesh(new THREE.CapsuleGeometry(0.045, w, 8, 24), eyeMat);
  const ring = (r = 0.14) => new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 20, 64), eyeMat);
  const dotEye = (r = 0.075) => new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32), eyeMat);
  const red = glow(C.rojo), lilaG = glow(C.lila);
  const tube = (pts, mat = eyeMat, r = 0.04) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0))), 64, r, 12, false), mat);
  const group = (...ms) => { const g = new THREE.Group(); ms.forEach(m => g.add(m)); return g; };
  const slab = (side) => { const sh = new THREE.Shape(), m = -side; sh.moveTo(-0.17 * m, 0.13); sh.lineTo(0.17 * m, 0.01); sh.lineTo(0.17 * m, -0.09); sh.lineTo(-0.17 * m, -0.09); sh.closePath(); return new THREE.Mesh(flat(sh), red); };
  const chevron = (side) => tube([[-0.1 * side, 0.12], [0.1 * side, 0], [-0.1 * side, -0.12]], eyeMat, 0.045);
  const spiral = () => { const p = []; for (let i = 0; i <= 60; i++) { const a = i * 0.32, r = 0.02 + i * 0.0026; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return tube(p, lilaG, 0.022); };
  const droop = (side) => { const sh = new THREE.Shape(); sh.absarc(0, 0, 0.15, Math.PI, 2 * Math.PI, false); sh.lineTo(-0.15, 0); const m = new THREE.Mesh(flat(sh), eyeMat); m.rotation.z = -0.35 * side; return m; };
  const cross = () => group(tube([[-0.12, 0.12], [0.12, -0.12]], glow(0x8A8D99), 0.04), tube([[-0.12, -0.12], [0.12, 0.12]], glow(0x8A8D99), 0.04));
  const pixels = (side) => { const g = new THREE.Group(); const cells = side < 0 ? [[0,0],[1,0],[0,1],[1,1],[2,1],[1,2]] : [[0,0],[2,0],[1,1],[0,2],[2,2],[1,3]];
    cells.forEach(([i, j], k) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.085, 0.03), k % 3 ? red : lilaG); b.position.set((i - 1) * 0.095, (1 - j) * 0.095, 0); g.add(b); }); return g; };
  const sunEye = () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CircleGeometry(0.075, 32), eyeMat)); for (let i = 0; i < 8; i++) { const r = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.045, 4, 8), glow(C.amanecer)); const a = i * Math.PI / 4; r.position.set(Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0); r.rotation.z = a - Math.PI / 2; g.add(r); } return g; };
  const zEye = () => { const c = new THREE.CurvePath(); const P = [[-0.1, 0.11], [0.1, 0.11], [-0.1, -0.11], [0.1, -0.11]].map(([x, y]) => new THREE.Vector3(x, y, 0)); for (let i = 0; i < 3; i++) c.add(new THREE.LineCurve3(P[i], P[i + 1])); return new THREE.Mesh(new THREE.TubeGeometry(c, 48, 0.034, 10, false), lilaG); };
  const sparkle = () => { const sh = new THREE.Shape(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 0.035 : 0.19, a = Math.PI / 2 + i * Math.PI / 4; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } return new THREE.Mesh(flat(sh), glow(0xFFFFFF)); };
  const oval = () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), eyeMat); m.scale.set(0.75, 1.45, 0.3); return m; };
  const E = { // [izq, der] de cada expresión
    sol: () => [sunEye(), sunEye()],
    destello: () => [sparkle(), sparkle()],
    curioso: () => [oval(), oval()],
    enojado: () => [slab(-1), slab(1)],
    frustrado: () => [chevron(-1), chevron(1)],
    confundido: () => [spiral(), spiral()],
    triste: () => [droop(-1), droop(1)],
    sinenergia: () => [cross(), cross()],
    dormido: () => [zEye(), zEye()],
    error: () => [pixels(-1), pixels(1)],
    feliz: () => [arc(), arc()],
    guino: () => [arc(), (() => { const b = bar(); b.rotation.z = Math.PI / 2; return b; })()],
    sorpresa: () => [ring(), ring()],
    estrellas: () => [star(), star()],
    corazones: () => [heart(), heart()],
    pensando: () => [dotEye(), dotEye()],
  };
  const [eL, eR] = (E[face] || E.feliz)();
  const ey = face === "pensando" ? 0.12 : 0.02, ex = face === "pensando" ? 0.06 : 0;
  onVisor(eL, -0.33 + ex, ey); onVisor(eR, 0.33 + ex, ey);

  const mouthMat = matte(C.tinta, 0.3);
  let mouth;
  if (face === "sorpresa") { mouth = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.025, 16, 40), mouthMat); }
  else if (face === "pensando") { mouth = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.1, 6, 16), mouthMat); mouth.rotation.z = Math.PI / 2 + 0.2; }
  else if (face === "estrellas" || face === "corazones" || face === "sol") { const sh = new THREE.Shape(); sh.absarc(0, 0, 0.11, Math.PI, 2 * Math.PI, false); sh.lineTo(-0.11, 0); mouth = new THREE.Mesh(flat(sh, 0.02), matte(C.tinta, 0.3)); }
  else if (face === "enojado" || face === "triste") { const p = []; for (let i = 0; i <= 16; i++) { const x = -0.11 + i * 0.01375; p.push(new THREE.Vector3(x, 0.03 - 4 * x * x, 0)); } mouth = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 48, 0.026, 10, false), mouthMat); }
  else if (face === "frustrado" || face === "error") { mouth = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([-0.12, -0.06, 0, 0.06, 0.12].map((x, i) => new THREE.Vector3(x, i % 2 ? 0.035 : -0.02, 0))), 48, 0.022, 10, false), mouthMat); }
  else if (face === "confundido") { mouth = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-0.1, 0], [-0.03, 0.03], [0.03, -0.03], [0.1, 0]].map(([x, y]) => new THREE.Vector3(x, y, 0))), 48, 0.022, 10, false), mouthMat); }
  else if (face === "curioso") { mouth = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.02, 12, 32), mouthMat); }
  else if (face === "sinenergia" || face === "dormido") { mouth = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.02, 12, 32), mouthMat); }
  else if (dz === "dracula") { const sh = new THREE.Shape(); sh.absarc(0, 0, 0.14, Math.PI, 2 * Math.PI, false); sh.lineTo(-0.14, 0); mouth = new THREE.Mesh(flat(sh, 0.02), matte(C.tinta, 0.3)); }
  else { mouth = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.028, 16, 48, Math.PI), mouthMat); mouth.rotation.z = Math.PI; }
  if (dz === "dracula") { // Colmillos
    for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.13, 16), new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, roughness: 0.15, clearcoat: 1 }));
      f.rotation.z = Math.PI; f.position.set(0.07 * s, (mouth.geometry.type === "TorusGeometry" ? -0.1 : 0) - 0.045, 0.04); f.castShadow = true; mouth.add(f); } }
  if (face === "triste") { const tear = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 24), new THREE.MeshPhysicalMaterial({ color: 0xBFD8FF, roughness: 0, transparent: true, opacity: 0.8, clearcoat: 1 }))); tear.scale.y = 1.35; tear.position.set(0.42, -0.3, 0.86); }
  mouth.position.set(face === "pensando" ? 0.08 : 0, -0.52, ["enojado","triste","frustrado","error","confundido","sinenergia","dormido"].includes(face) ? 0.9 : 0.86); mouth.rotation.x = -0.5; add(head, mouth);

  // Antena con el sol: todo cuelga de un pivote en la cabeza, así el sol nunca se separa del tallo
  const antena = new THREE.Group(); antena.position.y = 0.94; head.add(antena);
  const metal = new THREE.MeshPhysicalMaterial({ color: C.tinta, roughness: 0.25, metalness: 0.6, clearcoat: 1 });
  const base = add(antena, new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.06, 32), metal)); base.position.y = 0.01;
  const stalk = add(antena, new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.055, 0.36, 24), shell)); stalk.position.y = 0.2;
  const cuello = add(antena, new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.05, 0.07, 24), metal)); cuello.position.y = 0.39;
  const sunMat = (c, e = 0.6) => new THREE.MeshPhysicalMaterial({ color: c, emissive: c, emissiveIntensity: e, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
  const sun = add(antena, new THREE.Mesh(new THREE.SphereGeometry(0.17, 48, 48), sunMat(C.sol)));
  sun.position.y = 0.55;
  const brillo = new THREE.Mesh(new THREE.SphereGeometry(0.235, 32, 32), new THREE.MeshBasicMaterial({ color: C.amanecer, transparent: true, opacity: 0.22, side: THREE.BackSide, depthWrite: false, toneMapped: false }));
  sun.add(brillo);
  const halo = add(antena, new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.022, 16, 64), glow(C.amanecer, 0.8)));
  halo.position.y = 0.55;
  const sunLight = new THREE.PointLight(C.sol, 2.2, 3); sunLight.position.y = 0.58; antena.add(sunLight);
  if (face === "sinenergia") { sun.material = new THREE.MeshStandardMaterial({ color: 0x55586A, roughness: 0.6 }); brillo.visible = false; halo.visible = false; sunLight.intensity = 0; }
  if (face === "dormido") { sun.material = sunMat(C.sol, 0.12); brillo.material.opacity = 0.08; halo.visible = false; sunLight.intensity = 0.4; }
  if (face === "enojado" || face === "error") { sun.material = sunMat(C.rojo, 0.7); brillo.material.color.set(C.rojo); halo.material = glow(C.rojo); sunLight.color.set(C.rojo); }

  // Cuerpo
  const body = new THREE.Group(); body.position.y = -1.55; niko.add(body);
  add(body, new THREE.Mesh(new THREE.CapsuleGeometry(0.64, 0.35, 24, 48), cuerpoMat));
  const sash = add(body, new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.075, 20, 96), matte(C.rojo, 0.45)));
  sash.rotation.x = Math.PI / 2; sash.position.y = -0.22;
  // Emblema: la A de NIKA (sin el sol, a pedido de Julián)
  const lam = new THREE.Shape();
  lam.moveTo(-0.26, -0.2); lam.lineTo(0, 0.28); lam.lineTo(0.26, -0.2); lam.lineTo(0.17, -0.2); lam.lineTo(0, 0.11); lam.lineTo(-0.17, -0.2); lam.closePath();
  const emblem = add(body, new THREE.Mesh(new THREE.ExtrudeGeometry(lam, { depth: 0.04, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }), matte(C.tinta, 0.25)));
  emblem.position.set(0, 0.12, 0.6);
  for (const s of [-1, 1]) {
    const leg = add(body, new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.18, 12, 32), cuerpoMat));
    leg.position.set(0.3 * s, -0.78, 0);
  }

  // Brazos con pivote en el hombro
  const arms = {};
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(0.66 * s, -1.08, 0); niko.add(pivot);
    const arm = add(pivot, new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 12, 32), cuerpoMat)); arm.position.y = -0.36;
    const hand = add(pivot, new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), dz === "esqueleto" ? shell : dz === "frankenstein" ? cabezaMat : cuerpoMat)); hand.position.y = -0.74;
    pivot.rotation.z = 0.28 * s;
    arms[s < 0 ? "izq" : "der"] = pivot;
  }
  if (dz) disfrazar(THREE, dz, { head, body, arms, sash, emblem, shell, matte, glow, add });

  if (pose === "saludo") { arms.der.rotation.z = 2.25; arms.der.rotation.x = -0.25; arms.der.position.x = 0.74; head.rotation.z = -0.08; }
  if (pose === "celebra") { arms.der.rotation.z = 2.6; arms.izq.rotation.z = -2.6; arms.der.position.x = 0.74; arms.izq.position.x = -0.74; niko.position.y = 0.15; head.rotation.x = -0.12; }
  if (pose === "pensando") { arms.der.rotation.set(-0.35, 0, 2.95); arms.der.position.x = 0.8; head.rotation.z = 0.12; head.rotation.y = -0.12; }
  if (pose === "ok") { arms.der.rotation.set(-1.25, 0, 0.35); arms.izq.rotation.set(-1.25, 0, -0.35); head.rotation.x = 0.08; }
  if (pose === "jarra") { arms.der.rotation.set(0.5, 0, 1.0); arms.izq.rotation.set(0.5, 0, -1.0); head.rotation.x = 0.12; }
  if (pose === "agarra") { arms.der.rotation.set(-0.2, 0, 2.85); arms.izq.rotation.set(-0.2, 0, -2.85); arms.der.position.x = 0.8; arms.izq.position.x = -0.8; head.rotation.x = 0.1; }
  if (pose === "duda") { arms.der.rotation.set(-0.35, 0, 2.95); arms.der.position.x = 0.8; arms.izq.rotation.set(0, 0, -0.9); head.rotation.z = 0.22; }
  if (pose === "cabizbajo") { arms.der.rotation.z = 0.08; arms.izq.rotation.z = -0.08; head.rotation.x = 0.32; head.position.y = 0.05; }
  if (pose === "caido") { arms.der.rotation.set(0.2, 0, 0.05); arms.izq.rotation.set(0.2, 0, -0.05); head.rotation.set(0.25, 0, 0.3); niko.rotation.z = 0.12; }
  if (pose === "falla") { arms.der.rotation.set(0, 0, 1.9); arms.izq.rotation.set(0.4, 0, -0.5); head.rotation.set(0, 0.3, -0.25); }
  if (pose === "abierto") { arms.der.rotation.set(0, 0, 1.25); arms.izq.rotation.set(0, 0, -1.25); arms.der.position.x = 0.72; arms.izq.position.x = -0.72; head.rotation.x = -0.1; }
  if (pose === "senala") { arms.der.rotation.z = 1.5; arms.der.rotation.y = -0.45; head.rotation.y = 0.35; head.rotation.z = -0.06; }

  niko.userData = { head, arms, antena, sun, halo, eyes: [eL, eR], body };
  return niko;
}

// ---------- Disfraces de Halloween ----------
function disfrazar(THREE, dz, P) {
  const { head, body, arms, sash, emblem, shell, matte, glow, add } = P, C = COLORS;
  const fis = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.5, ...o });
  const tela = (c, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r, side: THREE.DoubleSide });
  const capa = (fuera, dentro, alto = 1.45) => {
    for (const [m, sd] of [[fuera, THREE.FrontSide], [dentro, THREE.BackSide]]) { const mm = m.clone(); mm.side = sd;
      const c = add(body, new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.08, alto, 64, 1, true, Math.PI * 0.42, Math.PI * 1.16), mm)); c.position.set(0, 0.52 - alto / 2, -0.05); }
  };
  const cono = (r, h, mat) => new THREE.Mesh(new THREE.ConeGeometry(r, h, 32), mat);
  const pelo = (n, mat, fn, r = 0.07, h = 0.22) => { for (let i = 0; i < n; i++) { const m = add(head, cono(r, h, mat)); fn(m, i); } };

  if (dz === "dracula") {
    // Pelo engominado con pico en la frente
    const peloM = fis(0x15121D, { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 });
    const cap = add(head, new THREE.Mesh(new THREE.SphereGeometry(1.03, 96, 48, 0, Math.PI * 2, 0, Math.PI * 0.42), peloM)); cap.scale.set(1.26, 1.03, 1.05); cap.rotation.x = -0.5;
    const pico = add(head, cono(0.2, 0.36, peloM)); pico.rotation.set(-0.75, 0, Math.PI); pico.scale.z = 0.3; pico.position.set(0, 0.62, 0.8);
    // Capa con cuello alto: negra por fuera y roja por dentro
    capa(fis(0x14111C, { sheen: 1, sheenColor: new THREE.Color(C.lila) }), fis(0xB0141F, { sheen: 0.6, sheenColor: new THREE.Color(0xFF5A62) }));
    const cuello = add(body, new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.66, 0.5, 64, 1, true, Math.PI * 0.52, Math.PI * 0.96), tela(0x14111C, 0.5))); cuello.position.set(0, 0.74, -0.04);
    const cuelloIn = add(body, new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.64, 0.48, 64, 1, true, Math.PI * 0.52, Math.PI * 0.96), new THREE.MeshStandardMaterial({ color: 0xB0141F, roughness: 0.6, side: THREE.BackSide }))); cuelloIn.position.copy(cuello.position);
    // Medallón con rubí
    const med = add(body, new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 12, 32), fis(C.sol, { metalness: 0.9, roughness: 0.2 }))); med.position.set(0, 0.42, 0.63);
    const rubi = add(body, new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 24), fis(0xD0101C, { roughness: 0.05, clearcoat: 1, emissive: 0x6A0008 }))); rubi.position.set(0, 0.42, 0.65);
  }

  if (dz === "lobo") {
    const piel = fis(0x6E5B49, { roughness: 0.9 }), rosa = matte(0xD99AA0, 0.7), oscuro = fis(0x4A3B30, { roughness: 0.95 });
    for (const s of [-1, 1]) { // Orejas de lobo
      const o = add(head, cono(0.32, 0.78, piel)); o.scale.z = 0.5; o.position.set(0.66 * s, 0.98, 0); o.rotation.z = -0.42 * s;
      const oi = add(head, cono(0.19, 0.5, rosa)); oi.scale.z = 0.22; oi.position.set(0.64 * s, 0.94, 0.11); oi.rotation.z = -0.42 * s;
    }
    // Mechones de pelo en las mejillas y en la cabeza
    pelo(12, oscuro, (m, i) => { const s = i < 6 ? -1 : 1, k = i % 6; m.position.set((1.1 + (k % 2) * 0.05) * s, -0.05 - k * 0.12, 0.32 - k * 0.05); m.rotation.z = (1.75 + k * 0.14) * -s; }, 0.1, 0.34);
    pelo(7, oscuro, (m, i) => { m.position.set(-0.36 + i * 0.12, 0.93, 0.3); m.rotation.x = 0.7; m.rotation.z = (i - 3) * 0.22; }, 0.09, 0.3);
    // Cola
    const cola = add(body, cono(0.22, 0.9, oscuro)); cola.position.set(0.22, -0.55, -0.7); cola.rotation.set(-1.0, 0, -0.6);
    // Garras y la camisa rota
    for (const k of ["izq", "der"]) for (let i = 0; i < 3; i++) { const g = cono(0.03, 0.12, shell); g.position.set((i - 1) * 0.08, -0.93, 0.08); g.rotation.x = 0.4; g.rotation.z = Math.PI; arms[k].add(g); }
    const camisa = add(body, new THREE.Mesh(new THREE.CylinderGeometry(0.67, 0.68, 0.55, 64, 1, true), tela(0x4B5F8A))); camisa.position.y = -0.05;
    for (let i = 0; i < 9; i++) { const d = add(body, cono(0.08, 0.16, tela(0x4B5F8A))); const a = i * 0.7; d.position.set(Math.sin(a) * 0.67, -0.38, Math.cos(a) * 0.67); d.rotation.x = Math.PI; }
    sash.visible = false;
  }

  if (dz === "frankenstein") {
    const pelo = fis(0x111015, { roughness: 0.7 }), metal = fis(0x8A8F99, { metalness: 0.9, roughness: 0.3 });
    // Pelo cortado al ras, plano arriba y con flequillo en zigzag
    const tapa = add(head, new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.9, 0.42, 64), pelo)); tapa.scale.set(1.25, 1, 1.0); tapa.position.y = 0.76;
    for (let i = 0; i < 7; i++) { const f = add(head, cono(0.1, 0.2, pelo)); f.rotation.x = Math.PI + 0.35; f.position.set(-0.6 + i * 0.2, 0.66, 0.78 - Math.abs(i - 3) * 0.06); }
    // Tornillos en el cuello
    for (const s of [-1, 1]) { const t = add(head, new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.5, 24), metal)); t.rotation.z = Math.PI / 2; t.position.set(1.0 * s, -0.5, 0.1); const tc = add(head, new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 6), metal)); tc.rotation.z = Math.PI / 2; tc.position.set(1.25 * s, -0.5, 0.1); }
    // Cicatriz con puntos en la frente
    const cic = add(head, new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.012, 8, 64, 0.7), matte(0x2B3A26, 0.8))); cic.scale.set(1.26, 1, 1.01); cic.rotation.set(-0.1, 0, Math.PI / 2 - 0.35); cic.position.y = 0.0;
    for (let i = 0; i < 5; i++) { const a = Math.PI / 2 - 0.3 - i * 0.12; const p = add(head, new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.08, 0.02), matte(0x2B3A26, 0.8))); p.position.set(Math.cos(a) * 1.0 * 0.0 + (i - 2) * 0.13 + 0.35, 0.68 + Math.sin(i) * 0.01, 0.74); }
    sash.visible = false; emblem.material = matte(C.nube, 0.3);
  }

  if (dz === "momia") {
    const venda = (c = 0xEADFC4) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 });
    const tira = (parent, r, y, rx, rz, sx = 1.0, w = 0.07, col) => { const t = add(parent, new THREE.Mesh(new THREE.TorusGeometry(r, w, 6, 64), venda(col))); t.scale.set(sx, 1, 0.24 / w * w + 1); t.rotation.set(Math.PI / 2 + rx, 0, rz); t.position.y = y; t.scale.set(sx, 1, 1); t.scale.z = 1; return t; };
    // Cabeza: vendas arriba y abajo del visor
    [[0.78, 0.62, 0.15, 0.1], [0.66, 0.8, -0.12, -0.08], [0.9, 0.38, 0.05, 0.16], [0.82, -0.55, -0.1, 0.12], [0.6, -0.78, 0.12, -0.1]].forEach(([r, y, rx, rz], i) => tira(head, r * 1.0, y, rx, rz, 1.25, 0.075, i % 2 ? 0xE2D5B5 : 0xEFE6D0));
    // Cuerpo, brazos y piernas
    for (let i = 0; i < 6; i++) tira(body, 0.66 - Math.abs(i - 2.5) * 0.03, 0.42 - i * 0.16, (i % 2 ? 0.14 : -0.12), (i % 3 - 1) * 0.08, 1, 0.07, i % 2 ? 0xE2D5B5 : 0xEFE6D0);
    for (const k of ["izq", "der"]) for (let i = 0; i < 3; i++) { const t = add(arms[k], new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.05, 6, 40), venda(i % 2 ? 0xE2D5B5 : 0xEFE6D0))); t.rotation.set(Math.PI / 2 + (i % 2 ? 0.25 : -0.2), 0, 0); t.position.y = -0.18 - i * 0.2; }
    const suelta = add(body, new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.02), venda())); suelta.position.set(0.45, -0.3, 0.5); suelta.rotation.set(0.15, -0.6, 0.35);
    sash.visible = false; emblem.visible = false;
  }

  if (dz === "zombie") {
    const ropa = tela(0x3E4A5C, 0.9), roto = tela(0x2D3644, 0.9), herida = matte(0x6B2A2A, 0.8), punto = matte(0x2A2A2A, 0.8);
    const remera = add(body, new THREE.Mesh(new THREE.CylinderGeometry(0.665, 0.69, 0.75, 64, 1, true), ropa)); remera.position.y = 0.05;
    for (let i = 0; i < 11; i++) { const d = add(body, new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.14 + (i % 3) * 0.06, 12), roto)); const a = i * 0.57; d.position.set(Math.sin(a) * 0.69, -0.4, Math.cos(a) * 0.69); d.rotation.x = Math.PI; }
    const agujero = add(body, new THREE.Mesh(new THREE.CircleGeometry(0.1, 7), piel0())); agujero.position.set(-0.25, 0.15, 0.665); agujero.rotation.y = -0.38;
    function piel0() { return new THREE.MeshPhysicalMaterial({ color: 0xA9B892, roughness: 0.7 }); }
    // Cicatrices y moretones en la cabeza
    const mor = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), matte(0x7E8C6E, 0.9))); mor.scale.set(1, 0.7, 0.2); mor.position.set(0.72, 0.55, 0.62); mor.lookAt(0, 0.4, 0); mor.rotateY(Math.PI);
    const cort = add(head, new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.28, 4, 12), herida)); cort.position.set(-0.78, 0.5, 0.58); cort.rotation.z = 0.9; cort.lookAt(-1.6, 1.0, 1.2);
    for (let i = 0; i < 4; i++) { const p = add(head, new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.07, 0.02), punto)); p.position.set(-0.86 + i * 0.06, 0.42 + i * 0.05, 0.56); p.rotation.z = 0.9 + Math.PI / 2; }
    sash.visible = false; emblem.material = matte(0xD8DCE6, 0.4);
  }

  if (dz === "bruja") {
    const felpa = fis(0x241A3D, { roughness: 0.6, sheen: 1, sheenColor: new THREE.Color(C.lila) });
    const sombrero = new THREE.Group(); sombrero.position.set(-0.5, 0.74, 0.05); sombrero.rotation.set(0.12, 0, 0.5); sombrero.scale.setScalar(1.3); head.add(sombrero);
    add(sombrero, new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.035, 64), felpa));
    const c1 = add(sombrero, new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.36, 0.42, 48), felpa)); c1.position.y = 0.23;
    const c2 = add(sombrero, new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.2, 0.44, 48), felpa)); c2.position.set(0.06, 0.62, 0); c2.rotation.z = -0.35;
    const cinta = add(sombrero, new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.36, 0.09, 48), matte(C.amanecer, 0.4))); cinta.position.y = 0.075;
    const heb = add(sombrero, new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 4), fis(C.sol, { metalness: 0.8, roughness: 0.25 }))); heb.position.set(0, 0.075, 0.355); heb.rotation.z = Math.PI / 4;
    capa(fis(0x2A1F4A, { sheen: 1, sheenColor: new THREE.Color(C.lila) }), fis(0x3D2A6B), 1.35);
    // Pelo violeta asomando bajo el sombrero
    for (let i = 0; i < 6; i++) { const m = add(head, cono(0.08, 0.36, fis(0x6E4FC9, { roughness: 0.6 }))); m.position.set(-1.05 + (i % 2) * 0.08, 0.45 - i * 0.13, 0.15 - i * 0.03); m.rotation.z = 2.5 + i * 0.06; }
    // Escoba en la mano izquierda
    const esc = new THREE.Group(); esc.position.set(0, -0.74, 0.12); esc.rotation.set(0.2, 0, 0.15); arms.izq.add(esc);
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.9, 12), matte(0x7A4E2A, 0.7)); palo.position.y = 0.1; esc.add(palo);
    const paja = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xD9A441, roughness: 0.95, side: THREE.DoubleSide })); paja.position.y = -0.98; esc.add(paja);
  }

  if (dz === "esqueleto") {
    const hueso = new THREE.MeshPhysicalMaterial({ color: 0xF2EEE3, roughness: 0.45, clearcoat: 0.6 });
    // Costillas, esternón y columna pintados en un traje negro
    const est = add(body, new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.45, 6, 16), hueso)); est.position.set(0, 0.18, 0.64);
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.y = 0.36 - i * 0.12; g.rotation.y = 0.12; if (s < 0) g.scale.x = -1; body.add(g);
      const c = add(g, new THREE.Mesh(new THREE.TorusGeometry(0.665 - Math.abs(i - 1) * 0.01, 0.03, 10, 40, Math.PI * 0.36), hueso)); c.rotation.x = Math.PI / 2; c.rotation.z = Math.PI * 0.12; }
    for (const s of [-1, 1]) { const cad = add(body, new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), hueso)); cad.scale.set(1, 0.7, 0.25); cad.position.set(0.15 * s, -0.3, 0.62); cad.rotation.y = 0.25 * s; }
    const nariz = new THREE.Shape(); nariz.moveTo(0, -0.06); nariz.lineTo(0.05, 0.03); nariz.lineTo(-0.05, 0.03); nariz.closePath();
    const nz = add(head, new THREE.Mesh(new THREE.ExtrudeGeometry(nariz, { depth: 0.02, bevelEnabled: false }), matte(C.tinta, 0.4))); nz.position.set(0, -0.37, 0.92); nz.rotation.x = -0.4;
    for (const k of ["izq", "der"]) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.42, 6, 12), hueso); b.position.set(0, -0.36, 0.15); arms[k].add(b); }
    sash.visible = false; emblem.visible = false;
  }
}

// Combinaciones pensadas para usar en piezas: [pose, expresión]
export const LOOKS = {
  "frente-feliz": ["frente", "feliz"], "saludo-feliz": ["saludo", "feliz"], "senala-guino": ["senala", "guino"],
  "celebra-estrellas": ["celebra", "estrellas"], "pensando": ["pensando", "pensando"], "ok-corazones": ["ok", "corazones"],
  "frente-sorpresa": ["frente", "sorpresa"],
  // Problemas del cliente (para las slides de dolor)
  "enojado": ["jarra", "enojado"], "frustrado": ["agarra", "frustrado"], "confundido": ["duda", "confundido"],
  "triste": ["cabizbajo", "triste"], "sin-energia": ["caido", "sinenergia"], "error": ["falla", "error"],
  "abierto-sol": ["abierto", "sol"], "frente-destello": ["frente", "destello"], "senala-curioso": ["senala", "curioso"],
};

export function buildStage(THREE, RoomEnvironment, renderer) {
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(1.5, 7, 4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  scene.add(key);
  const rimL = new THREE.DirectionalLight(COLORS.lila, 3.2); rimL.position.set(-4, 2, -3); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(COLORS.amanecer, 1.6); rimR.position.set(4, 1, -3); scene.add(rimR);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9B8CFF, 0.5));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -2.62; ground.receiveShadow = true; scene.add(ground);
  return scene;
}

export function setupRenderer(THREE, renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}
