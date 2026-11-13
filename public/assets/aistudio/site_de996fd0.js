/* The FS Lab — site behaviour (no dependencies) */
(function () {
  'use strict';
  var FS = window.FS = window.FS || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- mobile menu ---------- */
  var toggle = $('.menu-toggle'), nav = $('#site-nav');
  function closeMenu() { if (!nav) return; nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu'; if (FS.progress) FS.progress(); }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Đóng' : 'Menu';
      if (FS.progress) FS.progress();
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }
  FS.closeMenu = closeMenu;

  /* ---------- services tabs ---------- */
  var tabs = $$('.svc-tab');
  function selectService(id, focus) {
    var found = false;
    tabs.forEach(function (t) {
      var on = t.dataset.svc === id;
      if (on) found = true;
    });
    if (!found) return false;
    tabs.forEach(function (t) {
      var on = t.dataset.svc === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById('panel-' + t.dataset.svc);
      if (p) p.hidden = !on;
      if (on && focus) t.focus();
      if (on && t.scrollIntoView && window.matchMedia('(max-width:900px)').matches) {
        try { t.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {}
      }
    });
    return true;
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectService(t.dataset.svc); });
    t.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      selectService(tabs[(i + d + tabs.length) % tabs.length].dataset.svc, true);
    });
  });
  /* anchors: a service id opens its tab; anything else scrolls to the element */
  FS.gotoAnchor = function (id, root, instant) {
    if (!id) return false;
    var target;
    if (selectService(id)) { target = document.getElementById('dich-vu'); if (FS.evenText) setTimeout(FS.evenText, 60); }
    else target = (root || document).querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(id) : id));
    if (!target) return false;
    var y = target.getBoundingClientRect().top + window.pageYOffset - 84;
    try { window.scrollTo({ top: Math.max(0, y), left: 0, behavior: instant ? 'instant' : 'smooth' }); }
    catch (e) { window.scrollTo(0, Math.max(0, y)); }
    return true;
  };

  /* ---------- knowledge hub filter ---------- */
  var chips = $$('.chip'), rows = $$('.prow'), count = $('.hub-count');
  function filter(tag) {
    var n = 0;
    rows.forEach(function (r) {
      var show = tag === 'all' || (' ' + r.dataset.tags + ' ').indexOf(' ' + tag + ' ') > -1;
      r.hidden = !show; if (show) n++;
    });
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.tag === tag ? 'true' : 'false'); });
    if (count) count.textContent = n ? (n + ' bài viết') : 'Chưa có bài viết trong chủ đề này. Chọn chủ đề khác hoặc xem tất cả.';
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { filter(c.dataset.tag); }); });

  /* ---------- course modules: open / close all ---------- */
  var allBtn = $('[data-mods-toggle]');
  if (allBtn) allBtn.addEventListener('click', function () {
    var mods = $$('.mod'), open = mods.some(function (m) { return !m.open; });
    mods.forEach(function (m) { m.open = open; });
    allBtn.textContent = open ? 'Thu gọn tất cả' : 'Mở tất cả học phần';
  });

  /* ---------- motion: intro, hero, scroll reveal, progress, rail ---------- */
  var root = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };

  /* opening sequence: deep green, gold wordmark, tagline, layered wipe (as on the original site) */
  var intro = $('#intro');
  var onHome = FS.demo ? /^(#\/?(~.*)?)?$/.test(location.hash) : true;
  if (!intro || reduce || !onHome) {
    root.classList.add('intro-done');
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
  } else {
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      setTimeout(function () { intro.classList.add('t1'); }, 180);
      setTimeout(function () { intro.classList.add('t2'); }, 760);
      setTimeout(function () { intro.classList.add('t3'); root.classList.add('intro-done-soon'); }, 1680);
      setTimeout(function () {
        document.body.style.overflow = '';
        root.classList.add('intro-done');
        if (intro.parentNode) intro.parentNode.removeChild(intro);
        update();
      }, 2680);
    });
  }

  /* scroll reveal: fade + rise, staggered inside each group; images wipe in */
  var RV = ['.sec-head > *', '.manifesto > *', '.figs > div', '.kcar', '.car-foot', '.pull', '.xhead > *', '.xbanner', '.xabout > div', '.xvals li', '.xsplit-head', '.xrows li', '.ncard', '.xtiles li', '.xlib', '.chero-copy > *', '.cfacts > div', '.pill4 li', '.acard', '.rmod', '.road-nav', '.flow3 li', '.fcard2', '.rail li', '.rail-more', '.svc-tab', '.svc-panels', '.aud li', '.lab > *', '.post-lg', '.post-sm',
    '.posts-foot', '.lib > *', '.mentor > *', '.stats > div', '.page-head .crumbs', '.page-head .kicker', '.page-head h1', '.page-head .lead',
    '.page-head .actions', '.page-head .badges', '.page-head .note', '.pillars', '.strip > div', '.cols3 > *', '.cols2 > *', '.mods-tools', '.mod',
    '.cta-band .wrap > *', '.toc-list li', '.inside-head', '.faqs', '.nextc', '.strip--res > div', '.chips', '.prow', '.banner', '.res', '.tool > *', '.planned li', '.art-col > *', '.art-pn', '.relc', '.about-note'];
  var RVIMG = ['.art-fig img', '.book img', '.post-lg .thumb', '.lib .book-row img'];
  var targets = [];
  $$(RV.join(',')).forEach(function (el) {
    if (el.closest('.rv') || el.closest('.hero')) return;
    el.classList.add('rv'); targets.push(el);
  });
  $$(RVIMG.join(',')).forEach(function (el) { el.classList.add('rv-img'); targets.push(el); });
  var seen = [];
  targets.forEach(function (el) {
    if (!el.classList.contains('rv')) return;
    var p = el.parentElement, i = seen.indexOf(p), n;
    if (i < 0) { seen.push(p); p.__rv = 0; }
    n = p.__rv++;
    el.style.setProperty('--d', Math.min(n * 75, 450) + 'ms');
  });
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in'); io.unobserve(en.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -9% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* one rAF loop: page progress, header state, process rail */
  var bar = $('.progress'), header = $('.site-header'), rails = $$('[data-rail]'), fills = $$('[data-fill]'), photo = $('.hv-photo img'), ticking = false;
  function update() {
    ticking = false;
    var y = window.pageYOffset || 0, max = Math.max(1, root.scrollHeight - window.innerHeight);
    if (bar) bar.style.width = (clamp(y / max) * 100).toFixed(2) + '%';
    if (header) {
      header.classList.toggle('scrolled', y > 28);
      var vh0 = $$('.vhero').filter(function (h) { return h.offsetParent !== null; })[0];       // home: header floats over the hero
      header.classList.toggle('over', !!vh0 && y < vh0.offsetHeight - 110 && !(nav && nav.classList.contains('open')));
      header.classList.toggle('over-light', !!vh0 && vh0.classList.contains('vhero--light'));
    }
    fills.forEach(function (el) {                                   // manifesto: words light up as the block scrolls through
      if (el.offsetParent === null) return;
      var r = el.getBoundingClientRect(), vh = window.innerHeight, ws = el.__w || (el.__w = $$('.w', el));
      var p = reduce ? 1 : clamp((vh * 0.86 - r.top) / (r.height + vh * 0.34)), n = Math.round(p * ws.length);
      if (n === el.__n) return; el.__n = n;
      for (var i = 0; i < ws.length; i++) ws[i].classList.toggle('lit', i < n);
    });
    if (photo && !reduce) photo.style.setProperty('--py', Math.max(-30, Math.min(30, y * 0.05 - 8)).toFixed(1) + 'px');
    rails.forEach(function (rail) {
      if (rail.offsetParent === null) return;
      var steps = Array.prototype.slice.call(rail.children), r = rail.getBoundingClientRect(), vh = window.innerHeight;
      var horizontal = steps.length > 1 && steps[1].offsetTop === steps[0].offsetTop;
      var p = reduce ? 1 : clamp((vh * 0.84 - r.top) / (horizontal ? vh * 0.42 : Math.max(r.height, 1)));
      var active = Math.ceil(p * steps.length - 0.0001);
      steps.forEach(function (s, i) { s.classList.toggle('on', i < active); });
      var last = steps[active - 1], len = 0;
      if (last) len = active === steps.length ? (horizontal ? rail.offsetWidth : rail.offsetHeight) : (horizontal ? last.offsetLeft : last.offsetTop) + 9;
      rail.style.setProperty('--p', len + 'px');
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  FS.progress = update;
  update();


  /* ---------- free-guide page: sticky download bar + copy link ---------- */
  $$('[data-sticky]').forEach(function (bar) {
    var page = bar.closest('main') || document, first = page.querySelector('.gift [data-download]'), last = page.querySelector('.cta-band [data-download]');
    if (!first || !('IntersectionObserver' in window)) return;
    bar.hidden = false;
    var seen = { a: true, b: false };
    function sync() { bar.classList.toggle('on', !seen.a && !seen.b); }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.target === first) seen.a = en.isIntersecting; else seen.b = en.isIntersecting; });
      sync();
    }, { threshold: 0 });
    o.observe(first); if (last) o.observe(last);
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (!b) return;
    var inp = b.parentNode.querySelector('input'), text = b.getAttribute('data-copy') || (inp && inp.value) || location.href;
    var done = function () { b.textContent = 'Đã sao chép'; setTimeout(function () { b.textContent = 'Sao chép link'; }, 2200); };
    var legacy = function () {
      var t = inp; if (!t) { t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;left:-999px;top:0'; document.body.appendChild(t); }
      try { t.focus(); t.select(); if (document.execCommand('copy')) done(); } catch (x) {}
      if (t !== inp) document.body.removeChild(t);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, legacy); else legacy();
  });


  /* ---------- article: highlight the section being read in the side contents ---------- */
  if ('IntersectionObserver' in window) {
    $$('.art,.road').forEach(function (art) {
      var links = $$('[data-spy]', art); if (!links.length) return;
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle('on', l.getAttribute('data-spy') === en.target.id); });
        });
      }, { rootMargin: '-18% 0px -72% 0px', threshold: 0 });
      links.forEach(function (l) { var s = art.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(l.getAttribute('data-spy')) : l.getAttribute('data-spy'))); if (s) spy.observe(s); });
    });
  }


  /* ---------- home: figures count up once, carousel buttons ---------- */
  (function () {
    var nums = $$('[data-count]');
    function run(el) {
      var to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = null, dur = 1300;
      if (reduce) { el.textContent = to + suf; return; }
      function step(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = v + suf; if (k < 1) requestAnimationFrame(step); }
      el.textContent = '0' + suf; requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window && nums.length) {
      var co = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { run(en.target); co.unobserve(en.target); } }); }, { threshold: 0.6 });
      nums.forEach(function (n) { co.observe(n); });
    }
    $$('[data-car]').forEach(function (car) {
      var sec = car.closest('section') || document, prev = $('[data-car-prev]', sec), next = $('[data-car-next]', sec);
      function stepW() { var c = car.querySelector('.kc'); return c ? c.getBoundingClientRect().width + parseFloat(window.getComputedStyle(car).columnGap || 20) : 320; }
      function sync() { if (!prev || !next) return; prev.disabled = car.scrollLeft < 8; next.disabled = car.scrollLeft > car.scrollWidth - car.clientWidth - 8; }
      if (prev) prev.addEventListener('click', function () { car.scrollBy({ left: -stepW(), behavior: 'smooth' }); });
      if (next) next.addEventListener('click', function () { car.scrollBy({ left: stepW(), behavior: 'smooth' }); });
      car.addEventListener('scroll', sync, { passive: true }); window.addEventListener('resize', sync); sync();
      if ('IntersectionObserver' in window) new IntersectionObserver(function () { sync(); }, { threshold: [0, 0.2] }).observe(car);
    });
  })();

  /* ---------- justified text: keep it only where word spacing stays even ----------
     Each block of copy is measured as if left-aligned. If a line would need its gaps stretched
     too far to reach the right margin, the whole group falls back to left alignment. */
  var GROUPS = '.xhead,.xabout,.xvals,.xrows,.xtiles,.xlib,.xsplit-head,.figs,.cfacts,.pill4,.acards,.rmod-card,.flow3,.fcards,.chero-copy,.rail,.aud,.cols3,.cols2,.stats,.strip,.svc-tabs,.svc-facts,.svc-lead,.toc-list,.next3,.faqs,.method,.posts-top,.plist,.prose,.sec-head,.mentor,.lab,.lib,.inside-head,.gift-copy,.cta-band,.mod-body,.hero-main,.art-col,.about-note,.rel3,.hero-links';
  var LIMIT = 0.58;                 // extra space per gap, in em, beyond which a justified line looks stretched
  function evenText() {
    var page = $$('main').filter(function (m) { return !m.hidden; })[0]; if (!page) return;
    $$('.noj', page).forEach(function (el) { el.classList.remove('noj'); });
    var els = $$('p,li,dd,.svc-tab em', page).filter(function (el) {
      if (el.offsetParent === null || el.closest('.sheet,.app,.chipset,.crumbs,.tscroll') || el.textContent.length < 28) return false;
      var cs = window.getComputedStyle(el);
      if (cs.textAlign !== 'justify' || cs.display === 'grid' || cs.display === 'flex') return false;   // only real justified copy
      for (var c = el.firstElementChild; c; c = c.nextElementSibling) {                            // containers of blocks are not lines of text
        if (/^(block|grid|flex|list-item|table)/.test(window.getComputedStyle(c).display)) return false;
      }
      return true;
    });
    page.classList.add('evening');                                  // everything left-aligned while measuring
    var bad = [], rng = document.createRange();
    els.forEach(function (el) {
      var cs = window.getComputedStyle(el), fs = parseFloat(cs.fontSize) || 16, box = el.getBoundingClientRect();
      var right = box.right - (parseFloat(cs.paddingRight) || 0), width = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      if (width < 40) return;
      rng.selectNodeContents(el);
      var rects = rng.getClientRects(), lines = {}, tops = [], i, t;
      for (i = 0; i < rects.length; i++) {
        if (rects[i].width < 1) continue;
        t = Math.round(rects[i].top / (fs * 0.6));
        if (lines[t] === undefined) { lines[t] = rects[i].right; tops.push(t); } else lines[t] = Math.max(lines[t], rects[i].right);
      }
      tops.sort(function (x, y) { return x - y; });
      var worst = 0;
      for (i = 0; i < tops.length - 1; i++) {                       // the last line is never stretched
        var slack = right - lines[tops[i]], gaps = Math.max(1, Math.round((width - slack) / (2.5 * fs)) - 1);
        worst = Math.max(worst, slack / gaps / fs);
      }
      if (worst > LIMIT) bad.push(el);
    });
    page.classList.remove('evening');
    var seen = [];
    bad.forEach(function (el) {
      var g = el.closest(GROUPS) || el.parentElement;
      if (seen.indexOf(g) > -1) return; seen.push(g);
      $$('p,li,dd,.svc-tab em', g).forEach(function (x) { if (!x.closest('.sheet,.app')) x.classList.add('noj'); });
    });
  }
  var evenTimer;
  function evenSoon() { clearTimeout(evenTimer); evenTimer = setTimeout(evenText, 120); }
  FS.evenText = evenText;
  window.addEventListener('resize', evenSoon);
  window.addEventListener('load', evenSoon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(evenSoon);
  document.addEventListener('toggle', evenSoon, true);
  document.addEventListener('click', function (e) { if (e.target.closest('.svc-tab')) evenSoon(); });
  evenSoon();

  /* production pages: open a service tab when the URL hash names one */
  if (!FS.demo && location.hash.length > 1) {
    window.addEventListener('load', function () { FS.gotoAnchor(decodeURIComponent(location.hash.slice(1))); });
  }
})();
