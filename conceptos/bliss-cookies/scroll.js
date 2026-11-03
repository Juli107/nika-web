/* Bliss Cookies · concepto NIKA — animaciones al scrollear (GSAP + ScrollTrigger + Lenis).
   Si las librerías no cargan, la página queda estática y todo se ve igual. */
(function () {
  'use strict';
  var root = document.documentElement;
  function done() { root.classList.remove('js'); }
  if (!window.gsap || !window.ScrollTrigger) { done(); return; }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* resaltados rosas: se pintan al entrar */
  $$('.hl').forEach(function (el) {
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: function () { el.classList.add('in'); } });
  });
  if (reduce) { $$('.hl').forEach(function (e) { e.classList.add('in'); }); return; }

  /* scroll suave */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id); if (!t) return;
        e.preventDefault(); lenis.scrollTo(t, { offset: -70 });
      });
    });
    window.blissScrollTo = function (el) { lenis.scrollTo(el, { offset: -70 }); };
  }

  /* barra de progreso */
  gsap.to('#prog', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });

  var mm = gsap.matchMedia();

  /* ===== HERO: la cookie gira, se parte y deja ver el centro ===== */
  (function () {
    var hero = $('#hero');
    // entrada
    var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro.from('#disc', { scale: 0, duration: 1.4 })
      .from('#cookie', { scale: 0.4, rotate: -120, opacity: 0, duration: 1.6 }, 0.1)
      .from('.hw', { yPercent: 110, opacity: 0, rotate: 4, duration: 1.2, stagger: 0.12 }, 0.25)
      .from(['#stamp', '#badge'], { scale: 0, duration: 0.9, ease: 'back.out(2)', stagger: 0.1 }, 0.7)
      .from('#sub', { y: 30, opacity: 0, duration: 1 }, 0.8)
      .from('#hint', { opacity: 0, duration: 1 }, 1.1);

    // mouse: la cookie sigue un poco al cursor
    if (window.matchMedia('(pointer: fine)').matches) {
      var qx = gsap.quickTo('#cookie', 'x', { duration: 0.8, ease: 'power3' });
      var qy = gsap.quickTo('#cookie', 'y', { duration: 0.8, ease: 'power3' });
      hero.addEventListener('mousemove', function (e) {
        qx((e.clientX / innerWidth - 0.5) * 40); qy((e.clientY / innerHeight - 0.5) * 30);
      });
    }

    var idle = gsap.to('#cookie .spin', { rotate: 5, y: -12, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: '+=260%', pin: true, scrub: 0.8, anticipatePin: 1,
        onUpdate: function (s) { if (s.progress > 0.01) idle.pause(); else idle.play(); } }
    });
    tl.to('.hw.a', { xPercent: -60, opacity: 0, duration: 1 }, 0)
      .to('.hw.b', { xPercent: 60, opacity: 0, duration: 1 }, 0)
      .to('.hw.c', { yPercent: 80, opacity: 0, duration: 1 }, 0)
      .to(['#sub', '#hint', '#badge'], { opacity: 0, y: 40, duration: 0.6 }, 0)
      .to('#stamp', { rotate: 200, scale: 0.4, opacity: 0, duration: 1 }, 0)
      .to('#cookie', { scale: 1.12, rotate: -8, duration: 1 }, 0)
      .to('#disc', { scale: 1.25, duration: 1 }, 0)
      // se parte
      .to('#hl', { xPercent: -42, yPercent: 6, rotate: -16, duration: 1.2, ease: 'power2.inOut' }, 1)
      .to('#hr', { xPercent: 42, yPercent: -4, rotate: 14, duration: 1.2, ease: 'power2.inOut' }, 1)
      .to('#inside', { scale: 0.92, duration: 1.2, ease: 'power2.out' }, 1.05)
      // el centro llena la pantalla
      .to('#reveal', { clipPath: 'circle(75% at 50% 50%)', duration: 1.3, ease: 'power2.in' }, 2.2)
      .from('#reveal .cap', { y: 60, opacity: 0, duration: 0.6 }, 3.0)
      .to('#reveal img', { scale: 1.08, duration: 1 }, 2.6);
  })();

  /* cinta: se acelera y se inclina con la velocidad del scroll */
  (function () {
    var tr = $('#mq'), x = 0, speed = 1, dir = -1;
    var setX = gsap.quickSetter(tr, 'x', 'px');
    var skew = gsap.quickTo(tr, 'skewX', { duration: 0.4 });
    gsap.ticker.add(function () {
      var w = tr.scrollWidth / 2;
      x += dir * speed; if (x <= -w) x += w; if (x > 0) x -= w;
      setX(x); speed += (1 - speed) * 0.05;
    });
    ScrollTrigger.create({
      onUpdate: function (self) {
        var v = self.getVelocity();
        speed = Math.min(12, 1 + Math.abs(v) / 250); dir = v < 0 ? 1 : -1;
        skew(gsap.utils.clamp(-10, 10, v / -250));
      }
    });
  })();

  /* manifiesto: cada palabra se pinta al bajar */
  (function () {
    var p = $('#manitxt');
    var hot = ['fría.', 'belga,', 'suena', 'desarma.', 'Bliss,', 'mano'];
    p.innerHTML = p.textContent.trim().split(/\s+/).map(function (w) {
      return '<span class="wd' + (hot.indexOf(w) > -1 ? ' ch' : '') + '">' + w + '</span>';
    }).join(' ');
    gsap.to('#manitxt .wd', {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: '#mani', start: 'top 70%', end: 'bottom 60%', scrub: true }
    });
  })();

  /* títulos: líneas que suben desde abajo */
  $$('h2.lines').forEach(function (h) {
    if (h.closest('#hero')) return;
    gsap.from(h, { yPercent: 40, opacity: 0, rotate: 2, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  $$('.up').forEach(function (el) {
    gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  /* proceso: carrusel horizontal anclado */
  (function () {
    var sec = $('#proceso'), track = $('#track'), count = $('#pcount');
    var cards = $$('#track .card');
    function dist() { return Math.max(0, track.scrollWidth - innerWidth); }
    var tw = gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: {
        trigger: sec, start: 'top top', end: function () { return '+=' + (dist() + innerHeight * 0.3); },
        pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (s) { var k = Math.min(5, Math.floor(s.progress * 5.2) + 1); count.textContent = '0' + k + '/05'; }
      }
    });
    cards.forEach(function (c) {
      var img = c.querySelector('.ph img');
      if (img) gsap.fromTo(img, { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
      gsap.from(c, { rotate: 4, y: 60, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tw, start: 'left 100%', end: 'left 60%', scrub: true } });
    });
  })();

  /* sabores: entran girando */
  gsap.from('#flavors .fl', {
    y: 140, rotateX: -35, rotate: function (i) { return [-6, 4, -3][i] || 0; }, opacity: 0,
    duration: 1.2, ease: 'expo.out', stagger: 0.12, clearProps: 'transform',
    scrollTrigger: { trigger: '#flavors', start: 'top 82%' }
  });
  $$('#flavors .plate img').forEach(function (img) {
    gsap.fromTo(img, { rotate: -40 }, { rotate: 30, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* banda de foto con parallax y zoom */
  gsap.fromTo('#band img', { yPercent: -12, scale: 1.15 }, { yPercent: 12, scale: 1, ease: 'none', scrollTrigger: { trigger: '#band', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('#band h2', { scale: 0.7, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#band', start: 'top 80%', end: 'center center', scrub: true } });

  /* regalos: la caja se abre desde un círculo y las cookies caen adentro */
  gsap.fromTo('#gph', { clipPath: 'inset(22% 22% 22% 22% round 400px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: '#gph', start: 'top 90%', end: 'center 55%', scrub: true } });
  gsap.from('#gph .gc', { y: -260, rotate: function (i) { return [-90, 60, 120][i]; }, opacity: 0, duration: 1.2, ease: 'bounce.out', stagger: 0.15, scrollTrigger: { trigger: '#gph', start: 'top 55%' } });
  gsap.from('#gph .card2', { scale: 0, rotate: -30, duration: 0.8, ease: 'back.out(2.5)', scrollTrigger: { trigger: '#gph', start: 'top 45%' } });
  gsap.from('#occ .oc', { y: 80, opacity: 0, rotate: function (i) { return [-4, 3, -2][i]; }, duration: 1, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '#occ', start: 'top 85%' } });

  /* caja, opiniones, dónde: entradas con distintas velocidades */
  mm.add('(min-width: 821px)', function () {
    $$('.q[data-speed]').forEach(function (q) {
      var s = parseFloat(q.dataset.speed);
      gsap.fromTo(q, { y: 120 * s }, { y: -60 * s, ease: 'none', scrollTrigger: { trigger: '#opiniones', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });
  gsap.from('.q', { scale: 0.85, opacity: 0, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.1, scrollTrigger: { trigger: '.quotes', start: 'top 85%' } });
  gsap.from('#where .panel2', { y: 70, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '#where', start: 'top 85%' } });

  /* hermanas: el marco se abre */
  gsap.fromTo('#sisph', { clipPath: 'inset(30% 10% 30% 10% round 220px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '#sisph', start: 'top 90%', end: 'center 60%', scrub: true } });
  gsap.from('.seal', { rotate: -200, scale: 0, ease: 'back.out(1.8)', duration: 1.1, scrollTrigger: { trigger: '#sisph', start: 'center 70%' } });

  /* pie: letras gigantes que suben */
  (function () {
    var b = $('#big');
    b.innerHTML = b.textContent.split('').map(function (c) { return c === ' ' ? ' ' : '<span>' + c + '</span>'; }).join('');
    gsap.from('#big span', { yPercent: 100, rotate: 12, opacity: 0, stagger: 0.03, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top 95%', end: 'top 35%', scrub: true } });
  })();

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
