/* ==========================================================================
   main.js — comportements communs (AEXT Studio)
   Aucune dépendance externe. Tout dégrade proprement sans JS.
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.setAttribute('data-js', 'true');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Stockage sûr (peut lever en navigation privée) ---------- */
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }
  };

  /* ---------- Thème clair / sombre ---------------------------------- */
  function initTheme() {
    var saved = store.get('aext-theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
          (!document.documentElement.hasAttribute('data-theme') &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);
        var next = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        store.set('aext-theme', next);
        btn.setAttribute('aria-label', next === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre');
      });
    });
  }

  /* ---------- Navigation mobile ------------------------------------- */
  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var drawer = document.querySelector('[data-nav-drawer]');
    if (!toggle || !drawer) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      drawer.setAttribute('data-open', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* ---------- État de l'en-tête au défilement ----------------------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var ticking = false;
    function update() {
      header.setAttribute('data-scrolled', String(window.scrollY > 12));
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- Apparition au défilement ------------------------------ */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.setAttribute('data-revealed', 'true'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute('data-revealed', 'true');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });

    items.forEach(function (el) {
      // Décalage en cascade à l'intérieur d'un même groupe parent
      var siblings = el.parentElement ? el.parentElement.querySelectorAll(':scope > [data-reveal]') : [];
      var idx = Array.prototype.indexOf.call(siblings, el);
      if (idx > 0) el.style.setProperty('--reveal-delay', Math.min(idx, 6) * 70 + 'ms');
      io.observe(el);
    });

    // Filet de sécurité : rien ne doit rester invisible si l'observateur
    // n'a jamais été déclenché (impression, capture, navigateur exotique).
    window.setTimeout(function () {
      items.forEach(function (el) { el.setAttribute('data-revealed', 'true'); });
    }, 2600);
  }

  /* ---------- Compteurs animés -------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count-to]');
    if (!counters.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count-to'));
      var decimals = parseInt(el.getAttribute('data-count-decimals') || '0', 10);
      var suffix = el.getAttribute('data-count-suffix') || '';
      var prefix = el.getAttribute('data-count-prefix') || '';
      if (reduceMotion) {
        el.textContent = prefix + target.toLocaleString('fr-FR', {
          minimumFractionDigits: decimals, maximumFractionDigits: decimals
        }) + suffix;
        return;
      }
      var start = performance.now();
      var dur = 1400;
      function frame(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target * eased;
        el.textContent = prefix + val.toLocaleString('fr-FR', {
          minimumFractionDigits: decimals, maximumFractionDigits: decimals
        }) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Formulaires ------------------------------------------- */
  /*
     Câblage réel :
     - Formspree  → <form data-form action="https://formspree.io/f/XXXX" method="post">
     - Netlify    → <form data-form netlify name="contact"> (garder l'action vide)
     Sans action renseignée, le formulaire reste en mode démonstration.
  */
  function initForms() {
    document.querySelectorAll('[data-form]').forEach(function (form) {
      var status = form.querySelector('.form__status');
      var submit = form.querySelector('[type="submit"]');

      function setStatus(state, message) {
        if (!status) return;
        status.setAttribute('data-state', state);
        status.textContent = message;
      }

      function validate() {
        var ok = true;
        form.querySelectorAll('.field').forEach(function (field) {
          var input = field.querySelector('input, textarea, select');
          if (!input || !input.required) return;
          var valid = input.checkValidity() && input.value.trim() !== '';
          field.setAttribute('data-invalid', String(!valid));
          if (!valid) ok = false;
        });
        return ok;
      }

      form.querySelectorAll('.field input, .field textarea').forEach(function (input) {
        input.addEventListener('blur', function () {
          var field = input.closest('.field');
          if (!field || !input.required) return;
          field.setAttribute('data-invalid', String(!(input.checkValidity() && input.value.trim() !== '')));
        });
        input.addEventListener('input', function () {
          var field = input.closest('.field');
          if (field && field.getAttribute('data-invalid') === 'true' && input.value.trim() !== '') {
            field.setAttribute('data-invalid', 'false');
          }
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!validate()) {
          setStatus('error', 'Merci de compléter les champs obligatoires.');
          var firstBad = form.querySelector('.field[data-invalid="true"] input, .field[data-invalid="true"] textarea');
          if (firstBad) firstBad.focus();
          return;
        }

        // Champ leurre : un robot le remplit, un humain jamais.
        var honey = form.querySelector('.honeypot input');
        if (honey && honey.value !== '') return;

        var endpoint = form.getAttribute('action');

        if (!endpoint) {
          setStatus('success', 'Message envoyé. Nous revenons vers vous sous 48 h.');
          form.reset();
          return;
        }

        setStatus('loading', 'Envoi en cours…');
        if (submit) submit.disabled = true;

        fetch(endpoint, {
          method: form.getAttribute('method') || 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        }).then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          setStatus('success', 'Message envoyé. Nous revenons vers vous sous 48 h.');
          form.reset();
        }).catch(function () {
          setStatus('error', 'L’envoi a échoué. Écrivez-nous directement par e-mail ou réessayez dans un instant.');
        }).finally(function () {
          if (submit) submit.disabled = false;
        });
      });
    });
  }

  /* ---------- Notification flottante -------------------------------- */
  var toastTimer;
  window.aextToast = function (message) {
    var toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.setAttribute('data-visible', 'true');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.setAttribute('data-visible', 'false');
    }, 2800);
  };

  /* ---------- Année courante dans le pied de page ------------------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------- Démarrage --------------------------------------------- */
  function boot() {
    initTheme();
    initNav();
    initHeader();
    initReveal();
    initCounters();
    initForms();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
