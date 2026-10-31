/* Halloween en 3D: murciélagos que vuelan detrás del contenido, arañas colgando de su hilo y telarañas con rocío.
   Se dibuja en su propio lienzo (#hw), entre el fondo y el contenido, y solo mientras dura la edición Halloween. */
export function iniciar(THREE, op = {}) {
  const movil = innerWidth <= 900;
  const lienzo = document.createElement("canvas");
  lienzo.id = "hw"; lienzo.setAttribute("aria-hidden", "true");
  lienzo.style.cssText = "position:fixed;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:1";
  document.body.insertBefore(lienzo, document.getElementById("fx"));
  const R = new THREE.WebGLRenderer({ canvas: lienzo, antialias: !movil, alpha: true, powerPreference: "low-power" });
  R.setPixelRatio(Math.min(devicePixelRatio, movil ? 1 : 1.5));
  R.setClearColor(0x000000, 0);
  R.toneMapping = THREE.ACESFilmicToneMapping; R.outputColorSpace = THREE.SRGBColorSpace;

  const escena = new THREE.Scene();
  const DIST = 14, cam = new THREE.PerspectiveCamera(30, 1, .1, 100); cam.position.z = DIST;
  escena.add(new THREE.HemisphereLight(0x9B8CFF, 0x0B0C10, 1.1));
  const luna = new THREE.DirectionalLight(0xFFC83D, 2.4); luna.position.set(4, 5, 6); escena.add(luna);
  const contra = new THREE.DirectionalLight(0x9B8CFF, 3); contra.position.set(-3, 2, -5); escena.add(contra);
  const brillo = new THREE.PointLight(0xFF7A1A, 9, 30); brillo.position.set(-4, -2, 5); escena.add(brillo);

  let W = innerWidth, H = innerHeight, k = 1;
  function medir() { W = innerWidth; H = innerHeight; R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); k = 2 * Math.tan(THREE.MathUtils.degToRad(15)) * DIST / H; }
  medir(); addEventListener("resize", medir);
  const aMundo = (x, y, v) => v.set((x - W / 2) * k, -(y - H / 2) * k, 0);

  const add = (p, o) => (p.add(o), o);
  const esfera = (r, m, s = 14) => new THREE.Mesh(new THREE.SphereGeometry(r, s, Math.round(s * .7)), m);
  function hueso(p, a, b, r0, r1, m) { // cilindro de a a b
    const d = new THREE.Vector3().subVectors(b, a), largo = d.length();
    const c = add(p, new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, largo, 6), m));
    c.position.copy(a).addScaledVector(d, .5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return c;
  }

  /* ---------- Murciélago ---------- */
  const piel = new THREE.MeshStandardMaterial({ color: 0x1C1521, roughness: .85 });
  const membrana = new THREE.MeshStandardMaterial({ color: 0x3A2742, roughness: .55, side: THREE.DoubleSide, emissive: 0x24112A, emissiveIntensity: .7 });
  const ojoRojo = new THREE.MeshBasicMaterial({ color: 0xFF3B47 });
  function forma(pts) { // contorno con borde de fuga festoneado: [x,y] o [x,y,cx,cy] para curvas
    const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) { const q = pts[i]; q.length > 2 ? s.quadraticCurveTo(q[2], q[3], q[0], q[1]) : s.lineTo(q[0], q[1]); }
    return new THREE.ShapeGeometry(s, 10);
  }
  const alaIn = forma([[0, .06], [.52, .2], [.56, -.44, .3, -.22], [.02, -.3, .3, -.28]]);
  const alaEx = forma([[-.1, .02], [.46, .16], [.9, -.06], [.64, -.56, .58, -.18], [.22, -.68, .34, -.46], [-.06, -.62, .1, -.56], [-.14, -.3]]);
  function murcielago() {
    const g = new THREE.Group(), cuerpo = add(g, esfera(.22, piel)); cuerpo.scale.set(.85, 1.3, .8);
    const cab = add(g, esfera(.16, piel)); cab.position.set(0, .34, .05);
    const hocico = add(cab, new THREE.Mesh(new THREE.ConeGeometry(.06, .12, 8), piel)); hocico.rotation.x = Math.PI / 2; hocico.position.set(0, -.03, .16);
    for (const s of [-1, 1]) {
      const o = add(cab, new THREE.Mesh(new THREE.ConeGeometry(.065, .22, 8), piel)); o.position.set(.08 * s, .17, -.01); o.rotation.z = -.35 * s; o.scale.z = .5;
      const e = add(cab, esfera(.024, ojoRojo, 8)); e.position.set(.06 * s, .03, .13);
      const pie = add(g, new THREE.Mesh(new THREE.ConeGeometry(.03, .12, 6), piel)); pie.position.set(.06 * s, -.32, -.02); pie.rotation.x = Math.PI;
    }
    const alas = [];
    for (const s of [-1, 1]) {
      const hombro = add(g, new THREE.Group()); hombro.position.set(.13 * s, .14, 0); hombro.scale.x = s;
      add(hombro, new THREE.Mesh(alaIn, membrana));
      hueso(hombro, new THREE.Vector3(0, .06, .005), new THREE.Vector3(.52, .2, .005), .028, .02, piel);
      const codo = add(hombro, new THREE.Group()); codo.position.set(.5, .2, 0);
      add(codo, new THREE.Mesh(alaEx, membrana));
      const mu = new THREE.Vector3(.46, .16, .006);
      hueso(codo, new THREE.Vector3(0, 0, .006), mu, .02, .016, piel);
      for (const p of [[.9, -.06], [.64, -.56], [.22, -.68]]) hueso(codo, mu, new THREE.Vector3(p[0], p[1], .006), .012, .005, piel);
      alas.push({ hombro, codo, s });
    }
    return { g, alas };
  }
  const MURCI = [];
  const nM = movil ? 4 : 7;
  for (let i = 0; i < nM; i++) {
    const m = murcielago(); escena.add(m.g);
    MURCI.push(Object.assign(m, { dir: i % 2 ? -1 : 1, y: .12 + (i * .137 % .7), vel: 90 + (i * 37 % 70), tam: (op.murci || (movil ? 46 : 70)) * (.7 + (i * .29 % .6)), fase: i * 1.7, aleteo: 13 + (i * 3 % 6), espera: i * 2.3, x: -1 }));
  }
  function moverMurci(m, t, dt) {
    if (m.espera > 0) { m.espera -= dt; m.g.visible = false; return; }
    if (m.x < 0) m.x = 0;
    m.x += m.vel * dt; const recorrido = W + m.tam * 3;
    if (m.x > recorrido) { m.x = 0; m.espera = 2 + Math.random() * 5; m.y = .1 + Math.random() * .7; m.dir = Math.random() < .5 ? -1 : 1; m.g.visible = false; return; }
    m.g.visible = true;
    const px = m.dir > 0 ? m.x - m.tam * 1.5 : W + m.tam * 1.5 - m.x;
    const ola = Math.sin(t * 1.4 + m.fase) * 46 + Math.sin(t * 3.1 + m.fase) * 12, py = m.y * H + ola;
    aMundo(px, py, m.g.position);
    m.g.scale.setScalar(m.tam * k / 2.6);
    const sube = Math.cos(t * 1.4 + m.fase); // inclina el cuerpo según sube o baja
    m.g.rotation.set(-.55 + sube * .15, m.dir * .75, -m.dir * sube * .22);
    const f = t * m.aleteo + m.fase, a = Math.sin(f);
    m.g.position.y += a * .03 * m.g.scale.x * 4;
    for (const w of m.alas) { w.hombro.rotation.z = .12 + a * .85; w.hombro.rotation.y = Math.cos(f) * .35; w.codo.rotation.z = Math.sin(f - .8) * .32 - .06; }
  }

  /* ---------- Araña ---------- */
  const caparazon = new THREE.MeshStandardMaterial({ color: 0x0E0B12, roughness: .2, metalness: .35 });
  const pata = new THREE.MeshStandardMaterial({ color: 0x17121B, roughness: .5 });
  const marca = new THREE.MeshStandardMaterial({ color: 0xFF7A1A, emissive: 0xFF3B10, emissiveIntensity: .9 });
  const seda = new THREE.LineBasicMaterial({ color: 0xE8E4F2, transparent: true, opacity: .45 });
  function arana() {
    const g = new THREE.Group(), ab = add(g, esfera(.3, caparazon, 28)); ab.position.y = -.34; ab.scale.set(1, 1.18, .95);
    const r1 = add(ab, new THREE.Mesh(new THREE.ConeGeometry(.07, .11, 4), marca)); r1.position.set(0, .05, .29); r1.scale.z = .3;
    const r2 = add(ab, new THREE.Mesh(new THREE.ConeGeometry(.07, .11, 4), marca)); r2.position.set(0, -.07, .29); r2.rotation.z = Math.PI; r2.scale.z = .3;
    const ce = add(g, esfera(.17, caparazon)); ce.position.set(0, -.76, .02);
    for (const [x, y, r] of [[-.05, -.86, .028], [.05, -.86, .028], [-.1, -.83, .018], [.1, -.83, .018]]) { const e = add(g, esfera(r, ojoRojo, 8)); e.position.set(x, y, .17); }
    for (const s of [-1, 1]) { const q = add(g, new THREE.Mesh(new THREE.ConeGeometry(.03, .12, 6), pata)); q.position.set(.04 * s, -.93, .1); q.rotation.set(-.3, 0, Math.PI + .3 * s); }
    const patas = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      const cad = add(g, new THREE.Group()); cad.position.set(.1 * s, -.7 - i * .04, 0); cad.rotation.y = (i - 1.5) * .42 * s; cad.scale.x = s;
      const a = new THREE.Vector3(), b = new THREE.Vector3(.36, .26 - i * .05, 0), c = new THREE.Vector3(.7, -.12 - i * .06, 0), d = new THREE.Vector3(.86, -.42 - i * .05, 0);
      hueso(cad, a, b, .032, .026, pata); hueso(cad, b, c, .026, .018, pata); hueso(cad, c, d, .018, .008, pata);
      add(cad, esfera(.03, pata, 8)).position.copy(b); add(cad, esfera(.022, pata, 8)).position.copy(c);
      patas.push({ cad, base: cad.rotation.z, f: i * 1.3 + (s > 0 ? 0 : 2.2) });
    }
    const hilo = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), seda);
    escena.add(hilo); escena.add(g);
    return { g, patas, hilo };
  }

  /* ---------- Telaraña ---------- */
  const telaMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 } },
    vertexShader: `attribute float d; varying float vD; void main(){ vD = d; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uT; varying float vD;
      void main(){ float g = smoothstep(.07, 0., abs(fract(vD * .9 - uT * .12) - .5));
        gl_FragColor = vec4(mix(vec3(.82, .8, .9), vec3(1., .8, .35), g), .22 + g * .55); }` });
  const rocio = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: .05, metalness: .2, emissive: 0x9B8CFF, emissiveIntensity: .25 });
  function telaGeo(seed) {
    let sd = seed * 9301 + 49297; const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    const P = [], D = [], gotas = [], N = 8, ang = [];
    for (let i = 0; i < N; i++) ang.push((i / (N - 1)) * Math.PI / 2 + (rnd() - .5) * .08);
    const seg = (a, b, da, db) => { P.push(a.x, a.y, a.z, b.x, b.y, b.z); D.push(da, db); };
    const radio = (i, r) => new THREE.Vector3(Math.cos(ang[i]) * r, -Math.sin(ang[i]) * r, 0);
    for (let i = 0; i < N; i++) seg(new THREE.Vector3(), radio(i, 1.08), 0, 1.08);
    let r = .12;
    while (r < 1) {
      for (let i = 0; i < N - 1; i++) {
        const a = radio(i, r * (1 + (rnd() - .5) * .06)), b = radio(i + 1, r * (1 + (rnd() - .5) * .06)), m = a.clone().add(b).multiplyScalar(.5);
        const c = m.clone().multiplyScalar(.9); // el hilo cuelga un poco hacia el centro
        let prev = a;
        for (let j = 1; j <= 6; j++) { const u = j / 6, p = new THREE.Vector3().addScaledVector(a, (1 - u) * (1 - u)).addScaledVector(c, 2 * u * (1 - u)).addScaledVector(b, u * u); seg(prev, p, r, r); prev = p; }
        if (rnd() < .22) gotas.push(m.clone().multiplyScalar(.95));
      }
      r += .1 + r * .08;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute("d", new THREE.Float32BufferAttribute(D, 1));
    return { geo, gotas };
  }
  function telarana(seed) {
    const g = new THREE.Group(), { geo, gotas } = telaGeo(seed); escena.add(g);
    const lineas = add(g, new THREE.LineSegments(geo, telaMat));
    const gm = add(g, new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), rocio, gotas.length));
    const mt = new THREE.Matrix4();
    gotas.forEach((p, i) => { const r = .0045 + (i % 3) * .002; mt.makeScale(r, r * 1.2, r).setPosition(p); gm.setMatrixAt(i, mt); });
    return { g, lineas };
  }

  /* ---------- Anclas en la página (las mismas cajas que usaba la versión plana) ---------- */
  const TELAS = [...document.querySelectorAll(".hw-tela")].map((el, i) => ({ el, cl: el.className, ...telarana(i + 3) }));
  const ARANAS = [...document.querySelectorAll(".hw-arana")].map((el, i) => ({ el, f: i * 2.1, largo: parseFloat(getComputedStyle(el).getPropertyValue("--h")) || 190, ...arana() }));
  document.documentElement.classList.add("hw3d");

  const v = new THREE.Vector3(), v2 = new THREE.Vector3(), reloj = new THREE.Clock(); let t = 0;
  // en el celular se dibuja a 30 cuadros por segundo y nunca se dibuja cuando no hay ningún bicho a la vista,
  // así no le quita fluidez a R-bot
  let impar = false, habia = true;
  function cuadro() {
    requestAnimationFrame(cuadro);
    if (movil && (impar = !impar)) return;
    const dt = Math.min(reloj.getDelta(), .1); t += dt; telaMat.uniforms.uT.value = t;
    for (const m of MURCI) moverMurci(m, t, dt);
    for (const w of TELAS) {
      const r = w.el.getBoundingClientRect(), ver = r.bottom > -40 && r.top < H + 40 && r.width > 0; w.g.visible = ver; if (!ver) continue;
      const der = /\b(tr|br)\b/.test(w.cl), abajo = /\b(bl|br)\b/.test(w.cl), tam = r.width * 1.15;
      aMundo(der ? r.right : r.left, abajo ? r.bottom : r.top, w.g.position);
      w.g.scale.set(tam * k * (der ? -1 : 1), tam * k * (abajo ? -1 : 1), tam * k);
      w.g.rotation.set(.32 * (abajo ? -1 : 1) + Math.sin(t * .7 + tam) * .05, .38 * (der ? -1 : 1) + Math.sin(t * .5) * .06, 0);
    }
    for (const a of ARANAS) {
      const r = a.el.getBoundingClientRect(), largo = a.largo;
      const ver = r.width > 0 && r.top < H + 40 && r.top + largo * 1.3 > -40; a.g.visible = a.hilo.visible = ver; if (!ver) continue;
      const tam = op.arana || (movil ? 30 : 40), baja = largo * (.75 + .45 * Math.sin(t * .55 + a.f)), x = r.left + r.width / 2 + Math.sin(t * .8 + a.f) * 6;
      aMundo(r.left + r.width / 2, r.top, v); aMundo(x, r.top + baja, v2);
      a.g.position.copy(v2); a.g.scale.setScalar(tam * k / 1.1);
      a.g.rotation.set(Math.sin(t * .9 + a.f) * .12, Math.sin(t * .35 + a.f) * .9, Math.sin(t * .8 + a.f) * .08);
      const pos = a.hilo.geometry.attributes.position; pos.setXYZ(0, v.x, v.y, 0); pos.setXYZ(1, v2.x, v2.y, 0); pos.needsUpdate = true;
      for (const p of a.patas) p.cad.rotation.z = p.base + Math.sin(t * 5 + p.f) * .12 + Math.sin(t * .55 + a.f) * .08;
    }
    const hay = MURCI.some((m) => m.g.visible) || TELAS.some((w) => w.g.visible) || ARANAS.some((a) => a.g.visible);
    if (hay) R.render(escena, cam); else if (habia) R.clear();
    habia = hay;
  }
  cuadro();
}
