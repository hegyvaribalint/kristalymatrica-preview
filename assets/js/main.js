/* =========================================================
   Kristálymatrica — main.js (a luxrent.hu main.js-ére épül)
   Vanilla JS, nincs külső könyvtár. Beállítások: window.KM (tail.html).

   MÉRÉS: a Google Tag Manager CSAK süti-hozzájárulás után töltődik be.
   A GA4, a Google Ads és a Meta Pixel címke a GTM-ben van, a kódban nincs.
   Események a dataLayerbe: generate_lead, phone_click, email_click.
   ========================================================= */
(function () {
  'use strict';
  var KM = window.KM || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Fejléc: görgetési állapot ---------- */
  var header = document.getElementById('fejlec');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobil menü ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var mobileNav = document.getElementById('mobil-menu');
  if (toggle && mobileNav) {
    var setNav = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
      mobileNav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
    mobileNav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1200) setNav(false); });
  }

  /* ---------- Mobil ajánlatkérő sáv: a nyitóblokk után jelenik meg ---------- */
  var callBar = document.getElementById('call-bar');
  if (callBar) {
    var top = document.querySelector('.hero, .page-hero');
    if (top && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { callBar.classList.toggle('is-visible', !en[0].isIntersecting); }).observe(top);
    } else {
      var onBar = function () { callBar.classList.toggle('is-visible', window.scrollY > 320); };
      onBar(); window.addEventListener('scroll', onBar, { passive: true });
    }
  }

  /* ---------- Sütibanner + mérés ---------- */
  var KEY = 'km_cookie_consent';
  var banner = document.getElementById('cookie-banner');
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* privát mód */ }
  if (saved === 'all') loadTagManager();
  if (banner && !saved) {
    banner.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { banner.classList.add('is-visible'); }); });
  }
  if (banner) banner.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cookie]');
    if (!btn) return;
    var choice = btn.getAttribute('data-cookie');
    try { localStorage.setItem(KEY, choice); } catch (e2) { /* nem tárolható */ }
    banner.classList.remove('is-visible');
    setTimeout(function () { banner.hidden = true; }, 350);
    if (choice === 'all') loadTagManager();
  });

  function loadTagManager() {
    window.__kmConsent = 'all';
    window.gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted', personalization_storage: 'granted' });
    if (!KM.gtm || KM.elonezet || window.__kmGtm) return;   // előnézetben nincs mérés
    window.__kmGtm = true;
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(KM.gtm);
    document.head.appendChild(s);
  }

  /** Esemény a dataLayerbe, CSAK hozzájárulás után. */
  function esemeny(nev, adat) {
    if (window.__kmConsent !== 'all') return;
    var o = { event: nev }; for (var k in adat) o[k] = adat[k];
    window.dataLayer.push(o);
  }

  /* ---------- Telefon- és e-mail-kattintás mérése ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var hely = a.closest('.call-bar') ? 'mobil-sav' : a.closest('.site-header') ? 'fejlec' : a.closest('.site-footer') ? 'lablec' : 'tartalom';
    if (href.indexOf('tel:') === 0) esemeny('phone_click', { oldal: location.pathname, hely: hely });
    else if (href.indexOf('mailto:') === 0) esemeny('email_click', { oldal: location.pathname, hely: hely });
  }, true);

  /* ---------- "Tesztlapot kérek" gomb: a téma előre kiválasztva ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-tema]');
    if (!a) return;
    var sel = document.querySelector('select[name="tema"]');
    if (sel) sel.value = a.getAttribute('data-tema');
  });

  /* ---------- ?tema=tesztlap a címben (pl. a Tesztlap oldalról): téma előre kiválasztva ---------- */
  try {
    var kertTema = new URLSearchParams(location.search).get('tema');
    var temaSel = document.querySelector('select[name="tema"]');
    if (kertTema && temaSel && temaSel.querySelector('option[value="' + kertTema.replace(/[^a-z]/g, '') + '"]')) temaSel.value = kertTema;
  } catch (e) { /* régi böngésző */ }

  /* ---------- Forrás (UTM, gclid) az ajánlatkéréshez: a CRM-hez ---------- */
  var forras = '';
  try {
    var q = new URLSearchParams(location.search);
    var parts = ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid']
      .filter(function (k) { return q.get(k); }).map(function (k) { return k + '=' + q.get(k).slice(0, 100); });
    if (parts.length) sessionStorage.setItem('km_forras', parts.join('&'));
    forras = sessionStorage.getItem('km_forras') || (document.referrer ? 'ref=' + document.referrer.slice(0, 150) : 'kozvetlen');
  } catch (e) { /* nem tárolható */ }

  /* ---------- reCAPTCHA v3: csak akkor töltjük be, ha a látogató hozzányúl az űrlaphoz ---------- */
  var recaptchaPromise = null;
  function loadRecaptcha() {
    if (!KM.recaptcha || KM.elonezet) return Promise.resolve(null);
    if (recaptchaPromise) return recaptchaPromise;
    recaptchaPromise = new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(KM.recaptcha);
      s.async = true;
      s.onload = function () { window.grecaptcha.ready(function () { resolve(window.grecaptcha); }); };
      s.onerror = function () { resolve(null); };   // ha nem töltődik be, a szerver dönt (nem vész el az érdeklődő)
      document.head.appendChild(s);
    });
    return recaptchaPromise;
  }

  /* ---------- Ajánlatkérő űrlap ---------- */
  document.querySelectorAll('form[data-koszono]').forEach(function (form) {
    var betoltve = Date.now();
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type="submit"]');
    var mezo = function (n) { return form.querySelector('[name="' + n + '"]'); };
    if (mezo('forras')) mezo('forras').value = forras;
    form.addEventListener('focusin', loadRecaptcha, { once: true });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (KM.elonezet) { show('is-ok', 'Előnézet: az üzenet nem került elküldésre. Az élő oldalon innen megy az ajánlatkérés.'); return; }
      mezo('csapda_ido').value = String(Date.now() - betoltve);
      var felirat = btn.textContent;
      btn.disabled = true; btn.textContent = 'Küldés folyamatban…';
      show('', '');
      loadRecaptcha().then(function (g) {
        if (!g) return null;
        return g.execute(KM.recaptcha, { action: 'ajanlatkeres' }).catch(function () { return null; });
      }).then(function (token) {
        if (token) mezo('recaptcha_token').value = token;
        return fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'X-Requested-With': 'fetch' } });
      }).then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (d) {
          if (d && d.ok) {
            esemeny('generate_lead', { oldal: location.pathname, tema: (mezo('tema') || {}).value || '' });
            form.reset();
            setTimeout(function () { location.href = form.getAttribute('data-koszono'); }, 250);
          } else show('is-err', (d && d.message) || hiba());
        })
        .catch(function () { show('is-err', hiba()); })
        .then(function () { btn.disabled = false; btn.textContent = felirat; });
    });

    function show(cls, msg) { if (!status) return; status.className = 'form-status field--full ' + cls; status.textContent = msg; }
  });
  function hiba() { return 'Sajnáljuk, az üzenet küldése nem sikerült. Hívjon minket a ' + (KM.tel || '') + ' számon, vagy írjon e-mailt.'; }

  /* ---------- Lábléc évszám ---------- */
  var ev = document.getElementById('ev');
  if (ev) ev.textContent = String(new Date().getFullYear());
})();
