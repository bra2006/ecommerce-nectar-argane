/* cart.js — Nectar d'Argane
   Panier côté client : ajout, quantités, total, persistance locale.
   Le stockage peut échouer (navigation privée) : tout est encapsulé.
   Dans une boutique en production, cette couche est remplacée par
   le panier de Shopify ou de WooCommerce. */
(function () {
  'use strict';

  var KEY = 'nectar-cart';
  var LIVRAISON_OFFERTE = 400;
  var FRAIS_PORT = 35;

  var store = {
    read: function () {
      try {
        var raw = window.localStorage.getItem(KEY);
        var parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    },
    write: function (items) {
      try { window.localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* ignoré */ }
    }
  };

  var items = store.read();

  function money(v) {
    return v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' MAD';
  }

  function totals() {
    var sousTotal = items.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
    var port = (sousTotal === 0 || sousTotal >= LIVRAISON_OFFERTE) ? 0 : FRAIS_PORT;
    return { sousTotal: sousTotal, port: port, total: sousTotal + port };
  }

  function count() {
    return items.reduce(function (s, it) { return s + it.qty; }, 0);
  }

  function persist() {
    store.write(items);
    renderBadge();
    renderCart();
  }

  /* ---------- Badge de l'en-tête ---------- */
  function renderBadge() {
    var n = count();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = String(n);
    });
    document.querySelectorAll('[data-cart-btn]').forEach(function (btn) {
      btn.setAttribute('aria-label', n === 0 ? 'Panier vide' : 'Panier : ' + n + ' article' + (n > 1 ? 's' : ''));
    });
  }

  function bump() {
    document.querySelectorAll('[data-cart-btn]').forEach(function (btn) {
      btn.setAttribute('data-bump', 'true');
      setTimeout(function () { btn.setAttribute('data-bump', 'false'); }, 180);
    });
  }

  /* ---------- Ajout au panier ---------- */
  function add(id, name, price, art, qty) {
    var existing = items.filter(function (it) { return it.id === id; })[0];
    if (existing) existing.qty += qty;
    else items.push({ id: id, name: name, price: price, art: art, qty: qty });
    persist();
    bump();
    if (window.aextToast) {
      window.aextToast(name + ' ajouté au panier');
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    e.preventDefault();
    var qtyInput = document.querySelector('[data-qty-input]');
    var qty = 1;
    if (qtyInput && btn.hasAttribute('data-use-qty')) {
      qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
    }
    add(
      btn.getAttribute('data-id'),
      btn.getAttribute('data-name'),
      parseFloat(btn.getAttribute('data-price')),
      btn.getAttribute('data-art') || 'art--huile',
      qty
    );
  });

  /* ---------- Sélecteur de quantité (fiche produit) ---------- */
  document.addEventListener('click', function (e) {
    var step = e.target.closest('[data-qty-step]');
    if (!step) return;
    var input = document.querySelector('[data-qty-input]');
    if (!input) return;
    var delta = parseInt(step.getAttribute('data-qty-step'), 10);
    input.value = Math.max(1, Math.min(99, (parseInt(input.value, 10) || 1) + delta));
  });

  /* ---------- Page panier ---------- */
  function renderCart() {
    var list = document.querySelector('[data-cart-list]');
    if (!list) return;

    var summary = document.querySelector('[data-cart-summary]');
    var t = totals();

    if (!items.length) {
      list.innerHTML =
        '<div class="cart-empty">' +
        '<p class="text-soft" style="margin-bottom:18px">Votre panier est vide pour le moment.</p>' +
        '<a class="btn btn--primary" href="boutique.html">Découvrir la boutique</a>' +
        '</div>';
      if (summary) summary.style.display = 'none';
      return;
    }

    if (summary) summary.style.display = '';

    list.innerHTML = items.map(function (it) {
      return '<div class="cart-line">' +
        '<div class="media art ' + it.art + '" style="--media-ratio:1/1"></div>' +
        '<div>' +
          '<div class="cart-line__name">' + it.name + '</div>' +
          '<div class="cart-line__meta">' + money(it.price) + ' l\'unité</div>' +
          '<div class="cluster" style="--cluster-gap:14px;margin-top:8px">' +
            '<div class="qty">' +
              '<button type="button" data-cart-dec="' + it.id + '" aria-label="Diminuer la quantité">−</button>' +
              '<input type="number" value="' + it.qty + '" min="1" max="99" data-cart-qty="' + it.id + '" aria-label="Quantité">' +
              '<button type="button" data-cart-inc="' + it.id + '" aria-label="Augmenter la quantité">+</button>' +
            '</div>' +
            '<button type="button" class="cart-remove" data-cart-remove="' + it.id + '">Retirer</button>' +
          '</div>' +
        '</div>' +
        '<div class="cart-line__price">' + money(it.price * it.qty) + '</div>' +
      '</div>';
    }).join('');

    var rows = document.querySelector('[data-cart-totals]');
    if (rows) {
      rows.innerHTML =
        '<div class="cart-summary__row"><span>Sous-total</span><span class="tabular">' + money(t.sousTotal) + '</span></div>' +
        '<div class="cart-summary__row"><span>Livraison</span><span class="tabular">' +
          (t.port === 0 ? 'Offerte' : money(t.port)) + '</span></div>' +
        (t.sousTotal < LIVRAISON_OFFERTE
          ? '<p class="form__note" style="margin-top:4px">Plus que ' + money(LIVRAISON_OFFERTE - t.sousTotal) + ' pour la livraison offerte.</p>'
          : '') +
        '<div class="cart-summary__row cart-summary__row--total"><span>Total</span><span class="tabular">' + money(t.total) + '</span></div>';
    }
  }

  document.addEventListener('click', function (e) {
    var inc = e.target.closest('[data-cart-inc]');
    var dec = e.target.closest('[data-cart-dec]');
    var rm = e.target.closest('[data-cart-remove]');

    if (inc) {
      var a = items.filter(function (it) { return it.id === inc.getAttribute('data-cart-inc'); })[0];
      if (a) { a.qty = Math.min(99, a.qty + 1); persist(); }
    } else if (dec) {
      var b = items.filter(function (it) { return it.id === dec.getAttribute('data-cart-dec'); })[0];
      if (b) { b.qty = Math.max(1, b.qty - 1); persist(); }
    } else if (rm) {
      var id = rm.getAttribute('data-cart-remove');
      items = items.filter(function (it) { return it.id !== id; });
      persist();
    }
  });

  document.addEventListener('change', function (e) {
    var input = e.target.closest('[data-cart-qty]');
    if (!input) return;
    var it = items.filter(function (x) { return x.id === input.getAttribute('data-cart-qty'); })[0];
    if (it) { it.qty = Math.max(1, Math.min(99, parseInt(input.value, 10) || 1)); persist(); }
  });

  /* ---------- Passage en caisse (démonstration) ---------- */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-checkout]')) return;
    e.preventDefault();
    if (!items.length) return;
    if (window.aextToast) {
      window.aextToast('Démonstration : le paiement en ligne est branché à la mise en production.');
    }
  });

  /* ---------- Vidage du panier ---------- */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-cart-clear]')) return;
    items = [];
    persist();
  });

  renderBadge();
  renderCart();
})();
