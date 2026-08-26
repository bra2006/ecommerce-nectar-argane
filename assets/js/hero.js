/* hero.js — Nectar d'Argane
   Gouttes d'huile qui remontent lentement, comme dans un flacon qu'on repose.
   Décoratif : neutralisé si l'utilisateur limite les animations. */
(function () {
  'use strict';

  var canvas = document.querySelector('[data-hero-canvas]');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var w = 0, h = 0, dpr = 1, raf = null, drops = [];

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.hasAttribute('data-theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function palette() {
    return isDark()
      ? [[217, 153, 46], [206, 129, 104], [150, 105, 40]]
      : [[201, 131, 40], [166, 92, 70], [232, 193, 119]];
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function build() {
    var colors = palette();
    drops = [];
    var count = w < 640 ? 12 : 24;
    for (var i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * w,
        y: h + Math.random() * h,
        r: 5 + Math.random() * 34,
        speed: 0.09 + Math.random() * 0.34,
        drift: (Math.random() - 0.5) * 0.22,
        color: colors[i % colors.length],
        alpha: 0.07 + Math.random() * 0.13
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.y -= d.speed;
      d.x += d.drift;
      if (d.y + d.r < 0) { d.y = h + d.r + Math.random() * 60; d.x = Math.random() * w; }

      var g = ctx.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, 0, d.x, d.y, d.r);
      var c = d.color;
      g.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (d.alpha * 1.7) + ')');
      g.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() { draw(); raf = requestAnimationFrame(loop); }

  function start() {
    resize();
    if (reduce) { draw(); return; }
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer); timer = setTimeout(start, 180);
  });

  new MutationObserver(build).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme']
  });

  if ('IntersectionObserver' in window && !reduce) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(loop); }
        else if (raf) { cancelAnimationFrame(raf); raf = null; }
      });
    }, { threshold: 0 }).observe(canvas);
  }

  start();
})();
