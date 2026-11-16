/* FitFirst marketing site — interactions. No dependencies. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cfg = window.FF_SITE || {};

  /* ── garment illustrations ── */
  $$('[data-g]').forEach(function (el) { el.innerHTML = window.FFG.render(el.dataset.g); });

  /* ── calls to action ── */
  var toastEl = $('#toast'), toastTimer;
  var toast = function (html) {
    toastEl.innerHTML = html; toastEl.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.hidden = true; }, 6000);
  };
  $$('[data-cta="demo"]').forEach(function (a) { if (cfg.demoUrl) a.href = cfg.demoUrl; });
  $$('[data-cta="contact"]').forEach(function (a) {
    if (cfg.contactEmail) {
      a.href = 'mailto:' + cfg.contactEmail + '?subject=' + encodeURIComponent(cfg.contactSubject || 'FitFirst');
      return;
    }
    a.addEventListener('click', function (e) {
      var atCta = a.closest('#contact');
      if (atCta) e.preventDefault(); /* elsewhere, the link still scrolls to the contact section */
      toast('The contact address is not set yet. Add it in <code>marketing/js/config.js</code>.');
    });
  });

  /* ── navigation: solid on scroll, mobile menu, current section ── */
  var nav = $('#nav'), links = $('#nav-links'), menuBtn = $('#menu-btn');
  var onScroll = function () { nav.classList.toggle('solid', window.scrollY > 12); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  var setMenu = function (open) {
    links.classList.toggle('open', open); nav.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); });

  var navMap = {};
  $$('a[href^="#"]', links).forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = navMap[e.target.id]; if (!a || !e.isIntersecting) return;
        Object.keys(navMap).forEach(function (k) { navMap[k].classList.remove('cur'); });
        a.classList.add('cur');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(navMap).forEach(function (id) { var s = document.getElementById(id); if (s) secIO.observe(s); });
  }

  /* ── scroll reveals ── */
  var revealed = function (el) {
    el.classList.add('in');
    if (el.id === 'funnel') countUp(el);
  };
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { revealed(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
  }

  function countUp(root) {
    $$('[data-count]', root).forEach(function (b, i) {
      var to = Number(b.dataset.count), t0 = null, dur = 900 + i * 120;
      var tick = function (t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        b.textContent = Math.round(to * e);
        if (p < 1) requestAnimationFrame(tick);
      };
      b.textContent = '0'; requestAnimationFrame(tick);
    });
  }

  /* ── hero: gentle pointer parallax (fine pointers only) ── */
  var stage = $('#stage');
  if (stage && !reduce && window.matchMedia('(pointer: fine) and (min-width: 901px)').matches) {
    var raf = 0;
    stage.addEventListener('pointermove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        var r = stage.getBoundingClientRect();
        stage.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        stage.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        raf = 0;
      });
    });
    stage.addEventListener('pointerleave', function () { stage.style.setProperty('--px', 0); stage.style.setProperty('--py', 0); });
  }

  /* ── how it works: the thread fills as you scroll ── */
  var steps = $('#steps');
  if (steps) {
    var items = $$('li', steps), sraf = 0;
    var paint = function () {
      sraf = 0;
      var r = steps.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.78 - r.top) / (r.height + vh * 0.25)));
      if (reduce) p = 1;
      steps.style.setProperty('--p', p.toFixed(3));
      items.forEach(function (li, i) { li.classList.toggle('lit', p >= (i / items.length) + 0.04 || (reduce)); });
    };
    paint();
    window.addEventListener('scroll', function () { if (!sraf) sraf = requestAnimationFrame(paint); }, { passive: true });
    window.addEventListener('resize', paint);
  }

  /* ── languages: rotate the sample line ── */
  var langs = $$('#langs li');
  if (langs.length && !reduce) {
    var li = 0;
    setInterval(function () { langs[li].classList.remove('on'); li = (li + 1) % langs.length; langs[li].classList.add('on'); }, 2600);
  } else if (reduce) { langs.forEach(function (l) { l.classList.add('on'); l.style.gridArea = 'auto'; l.style.minHeight = '0'; }); }

  /* ── clearance dial ── */
  var dial = $('#dial'), rank = $('#rank'), out = $('#dial-out');
  if (dial && rank) {
    /* Illustrative pieces. suit = suitability for this shopper (0–1); aged pieces can earn the nudge. */
    var PIECES = [
      { g: 'teal-saree', name: 'Teal silk saree, zari border', suit: 0.95, days: 12 },
      { g: 'rust-anarkali', name: 'Rust anarkali, floral', suit: 0.86, days: 20 },
      { g: 'rose-saree', name: 'Rosewood georgette saree', suit: 0.83, days: 118 },
      { g: 'mustard-kurta', name: 'Mustard straight kurta', suit: 0.81, days: 31 },
      { g: 'maroon-lehenga', name: 'Maroon lehenga, embroidered', suit: 0.79, days: 164 },
    ];
    var AGED = 90, CAP = 0.08, LABELS = ['Off', 'Gentle', 'Moderate', 'Strong', 'Capped max'];
    var rows = {};
    PIECES.forEach(function (p) {
      var aged = p.days >= AGED, el = document.createElement('li');
      if (aged) el.className = 'aged';
      el.innerHTML = '<span class="pos"></span><span class="g th">' + window.FFG.render(p.g) + '</span>' +
        '<span><b>' + p.name + '</b><span class="meta">' + (aged ? 'Suits · eligible for the nudge' : 'Suits') + '</span></span>' +
        '<span class="age' + (aged ? '' : ' new') + '">' + p.days + ' days</span>' +
        '<span class="suit" style="--s:' + (p.suit * 100 - 8) + '%;--n:0%"><i></i><u></u></span>';
      rows[p.g] = el; rank.appendChild(el);
    });
    var order = function (level) {
      var nudge = CAP * (level / 4);
      return PIECES.map(function (p) { return { p: p, score: p.suit + (p.days >= AGED ? nudge : 0), n: p.days >= AGED ? nudge : 0 }; })
        .sort(function (a, b) { return b.score - a.score; });
    };
    var apply = function (animate) {
      var level = Number(dial.value), list = order(level);
      var first = {};
      if (animate) PIECES.forEach(function (p) { first[p.g] = rows[p.g].getBoundingClientRect().top; });
      list.forEach(function (it, i) {
        var el = rows[it.p.g];
        rank.appendChild(el);
        $('.pos', el).textContent = i + 1;
        $('.suit', el).style.setProperty('--n', (it.n * 100) + '%');
      });
      if (animate && !reduce) {
        PIECES.forEach(function (p) {
          var el = rows[p.g], d = first[p.g] - el.getBoundingClientRect().top;
          if (!d) return;
          el.style.transition = 'none'; el.style.transform = 'translateY(' + d + 'px)';
          requestAnimationFrame(function () { el.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)'; el.style.transform = ''; });
        });
      }
      out.textContent = LABELS[level];
      dial.style.setProperty('--fill', (level / 4 * 100) + '%');
      dial.setAttribute('aria-valuetext', LABELS[level]);
    };
    dial.addEventListener('input', function () { apply(true); });
    apply(false);
  }

  /* ── showcase tabs: keyboard accessible, auto-advance until the visitor takes over ── */
  var show = $('.show');
  if (show) {
    var tabs = $$('[role="tab"]', show), timer = 0, visible = false, hold = false, auto = !reduce;
    var select = function (i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tabs[i].focus();
      if (auto) { /* restart the progress bar */ show.classList.remove('auto'); void show.offsetWidth; show.classList.add('auto'); schedule(); }
    };
    var current = function () { return tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; }); };
    var schedule = function () {
      clearTimeout(timer);
      show.classList.toggle('paused', !visible || hold);
      if (!auto || !visible || hold) return;
      timer = setTimeout(function () { select((current() + 1) % tabs.length); }, 7000);
    };
    var takeOver = function () { auto = false; clearTimeout(timer); show.classList.remove('auto', 'paused'); };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { takeOver(); select(i); });
      t.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!k && e.key !== 'Home' && e.key !== 'End') return;
        e.preventDefault(); takeOver();
        select(e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + k + tabs.length) % tabs.length, true);
      });
    });
    show.addEventListener('pointerenter', function () { hold = true; schedule(); });
    show.addEventListener('pointerleave', function () { hold = false; schedule(); });
    show.addEventListener('focusin', function () { hold = true; schedule(); });
    show.addEventListener('focusout', function () { hold = false; schedule(); });
    if (auto && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && auto && !show.classList.contains('auto')) show.classList.add('auto');
        schedule();
      }, { threshold: 0.35 }).observe(show);
    }
  }
})();
