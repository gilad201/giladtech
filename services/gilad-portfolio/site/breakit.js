// "Break it": a simulated self-healing data pipeline.
// Visitors break it in different ways and watch an AI agent find and fix the problem.
// Plain SVG + requestAnimationFrame; uses drum() from main.js for sound.
(function () {
  var root = document.querySelector('.ops');
  if (!root) return;

  var NS = 'http://www.w3.org/2000/svg';
  var NAMES = ['Sources', 'Ingest', 'Transform', 'Warehouse', 'Dashboard'];
  var NORMAL_SPAWN = 0.2;
  var GOOD_RELEASE = 141;
  var svg = root.querySelector('.ops__pipe');
  var logList = root.querySelector('.ops__log');
  var statusEl = root.querySelector('.ops__state');
  var fixedEl = root.querySelector('[data-stat="fixed"]');
  var costEl = root.querySelector('[data-stat="cost"]');
  var win = root.querySelector('.ops__win');
  var buttons = [].slice.call(root.querySelectorAll('[data-break]'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia('(max-width: 640px)');

  var G, stages, dotLayer, bin, binCount, pool = [];
  var labels = ['normal', '1 worker', 'v' + GOOD_RELEASE, '', 'correct'];
  var S = {
    dots: [], spawnEvery: NORMAL_SPAWN, spawnT: 0, badRate: 0,
    gates: {}, validate: false, quarantined: 0,
    cost: 4.2, costTarget: 4.2, fixed: 0, kinds: {}, incident: null
  };

  root.classList.add('is-live');
  build();
  narrow.addEventListener('change', build);
  log('All systems normal. Go ahead, break something.', 'sys');

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { start(b.getAttribute('data-break')); });
  });

  // ---------- layout ----------
  function geometry(vertical) {
    return vertical
      ? { w: 340, h: 580, vertical: true, half: 28, cross: 140, boxW: 170, boxH: 56, speed: 120,
          along: function (i) { return 45 + 122 * i; } }
      : { w: 1000, h: 270, vertical: false, half: 70, cross: 110, boxW: 140, boxH: 84, speed: 180,
          along: function (i) { return 100 + 200 * i; } };
  }
  function pt(s, off) {
    off = off || 0;
    return G.vertical ? [G.cross + off, s] : [s, G.cross + off];
  }
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function binPos() {
    return G.vertical ? [G.cross + 145, G.along(2)] : [G.along(2), G.cross + 118];
  }

  function build() {
    G = geometry(narrow.matches);
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 ' + G.w + ' ' + G.h);
    pool = [];

    for (var i = 0; i < NAMES.length - 1; i++) {
      var a = pt(G.along(i) + G.half), b = pt(G.along(i + 1) - G.half);
      el('line', { class: 'ops-link', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, svg);
    }
    var bp = binPos(), tp = pt(G.along(2), G.vertical ? G.boxW / 2 : G.boxH / 2);
    el('line', { class: 'ops-link ops-link--bin', x1: tp[0], y1: tp[1], x2: G.vertical ? bp[0] - 45 : bp[0], y2: G.vertical ? bp[1] : bp[1] - 18 }, svg);

    dotLayer = el('g', { class: 'ops-dots' }, svg);

    stages = NAMES.map(function (name, i) {
      var c = pt(G.along(i));
      var g = el('g', { class: 'ops-stage' }, svg);
      if (i === 1) {
        [12, 6].forEach(function (o) {
          el('rect', { class: 'ops-worker', x: c[0] - G.boxW / 2 + o, y: c[1] - G.boxH / 2 - o, width: G.boxW, height: G.boxH, rx: 14 }, g);
        });
      }
      el('rect', { class: 'ops-box', x: c[0] - G.boxW / 2, y: c[1] - G.boxH / 2, width: G.boxW, height: G.boxH, rx: 14 }, g);
      var t = el('text', { class: 'ops-name', x: c[0], y: c[1] - 4 }, g);
      t.textContent = name;
      var sub = el('text', { class: 'ops-sub', x: c[0], y: c[1] + 16 }, g);
      return { g: g, sub: sub, state: 'ok' };
    });

    bin = el('g', { class: 'ops-bin' }, svg);
    el('rect', { x: bp[0] - 45, y: bp[1] - 18, width: 90, height: 36, rx: 10 }, bin);
    var bt = el('text', { class: 'ops-sub', x: bp[0], y: bp[1] + 4 }, bin);
    bt.textContent = 'Quarantine ';
    binCount = el('tspan', {}, bt);
    binCount.textContent = S.quarantined;

    renderLabels();
  }

  // ---------- state helpers ----------
  function setStage(i, state, label) {
    stages[i].state = state;
    if (label != null) labels[i] = label;
    renderLabels();
  }
  function renderLabels() {
    stages.forEach(function (st, i) {
      st.g.setAttribute('class', 'ops-stage is-' + st.state + (i === 1 && labels[1] === '3 workers' ? ' is-scaled' : ''));
      st.sub.textContent = i === 3 ? '$' + Math.round(S.cost) + '/h' : labels[i];
    });
    bin.setAttribute('class', 'ops-bin' + (S.validate ? ' is-on' : ''));
  }
  function gate(i, mode, rate) { S.gates[i] = { mode: mode, rate: rate || 0, tokens: 0 }; }
  function queueBefore(i) {
    return S.dots.filter(function (d) { return d.wait === i; }).length;
  }

  function log(text, kind) {
    var li = document.createElement('li');
    li.className = 'ops__line ops__line--' + (kind || 'agent');
    li.textContent = text;
    logList.appendChild(li);
    while (logList.children.length > 7) logList.removeChild(logList.firstChild);
  }

  // ---------- incidents ----------
  function incident(kind, agent) {
    var say = function (t) { return function () { log(agent + ' > ' + t); }; };
    var bad = 'v' + (GOOD_RELEASE + 1), good = 'v' + GOOD_RELEASE;
    var steps = {
      deploy: [
        [0, function () { setStage(2, 'fail', bad + ' ✗'); gate(2, 'closed'); log('⚠ Transform is failing after release ' + bad + '. Jobs are piling up.', 'alert'); }],
        [0.9, say('Reading the logs...')],
        [2.0, function () { setStage(2, 'heal'); log(agent + ' > Found it: release ' + bad + ' broke Transform.'); }],
        [3.0, say('Rolling back to ' + good + '...')],
        [4.2, function () { setStage(2, 'ok', good); gate(2, 'open'); log(agent + ' > Rolled back. Draining the backlog.'); }]
      ],
      spike: [
        [0, function () { S.spawnEvery = 0.05; gate(1, 'rate', 3); setStage(0, 'warn', '×10 traffic'); setStage(1, 'warn', 'overloaded'); log('⚠ Traffic ×10. Ingest can\'t keep up.', 'alert'); }],
        [1.0, say('That\'s a lot of data. Nice problem to have.')],
        [2.1, function () { setStage(1, 'heal', 'scaling...'); log(agent + ' > Scaling Ingest from 1 to 3 workers...'); }],
        [3.2, function () { setStage(1, 'ok', '3 workers'); gate(1, 'open'); log(agent + ' > Workers are up. Clearing the queue.'); }],
        [6.0, function () { S.spawnEvery = NORMAL_SPAWN; setStage(0, 'ok', 'normal'); }],
        [7.0, function () { setStage(1, 'ok', '1 worker'); log(agent + ' > Traffic is back to normal. Scaling down to save money.'); }]
      ],
      data: [
        [0, function () { S.badRate = 0.6; setStage(0, 'warn', 'bad records'); log('⚠ Broken records are coming in.', 'alert'); }],
        [1.3, function () { setStage(4, 'warn', 'numbers off'); log(agent + ' > Dashboard numbers look off. Tracing it back...'); }],
        [2.5, function () { S.validate = true; setStage(2, 'heal', 'validating'); log(agent + ' > The source is sending empty prices. Quarantining bad records.'); }],
        [3.8, function () { S.badRate = 0; setStage(0, 'ok', 'normal'); setStage(2, 'ok', good); }],
        [4.8, function () { setStage(4, 'ok', 'correct'); log(agent + ' > Backfilled the affected hour. Dashboard is correct again.'); }]
      ],
      cost: [
        [0, function () { S.costTarget = 380; setStage(3, 'fail'); log('⚠ Warehouse cost is climbing fast.', 'alert'); }],
        [1.1, say('One query is scanning the whole warehouse, every minute.')],
        [2.3, function () { setStage(3, 'heal'); log(agent + ' > Killed it. Adding a guardrail so it can\'t run again.'); }],
        [3.5, function () { S.costTarget = 4.2; }]
      ]
    }[kind];
    var done = {
      deploy: function () { return queueBefore(2) < 3; },
      spike: function () { return queueBefore(1) < 3; },
      data: function () { return true; },
      cost: function () { if (S.cost < 5) { setStage(3, 'ok'); return true; } return false; }
    }[kind];
    return { kind: kind, steps: steps, done: done };
  }

  function start(kind) {
    if (S.incident) return;
    var list = kind === 'all'
      ? [incident('deploy', 'agent-1'), incident('spike', 'agent-2'), incident('cost', 'agent-3')]
      : [incident(kind, 'agent')];
    S.incident = { list: list, t: 0, all: kind === 'all' };
    buttons.forEach(function (b) { b.disabled = true; });
    statusEl.textContent = 'Incident · agent on it';
    statusEl.parentNode.classList.add('is-alert');
    drum('blip'); drum('blip', 0.16);
  }

  function finish() {
    var inc = S.incident;
    var secs = inc.t.toFixed(1);
    var n = inc.list.length;
    S.fixed += n;
    inc.list.forEach(function (x) { S.kinds[x.kind] = true; });
    if (inc.all) S.kinds.all = true;
    log(n > 1
      ? '✓ ' + n + ' incidents, ' + n + ' agents, 0 humans paged. ' + secs + 's.'
      : '✓ Recovered in ' + secs + 's. Nobody woke up.', 'ok');
    fixedEl.textContent = S.fixed;
    statusEl.textContent = 'All systems normal';
    statusEl.parentNode.classList.remove('is-alert');
    S.incident = null;
    buttons.forEach(function (b) { b.disabled = false; });
    drum('chime');
    if (Object.keys(S.kinds).length >= 3) win.hidden = false;
  }

  // ---------- simulation ----------
  function step(dt) {
    S.spawnT += dt;
    while (S.spawnT >= S.spawnEvery) {
      S.spawnT -= S.spawnEvery;
      if (S.dots.length < 160) S.dots.push({ s: G.along(0), bad: Math.random() < S.badRate, q: 0 });
    }

    var limits = {};
    for (var k in S.gates) limits[k] = G.along(+k) - G.half - 7;
    for (k in S.gates) {
      var g = S.gates[k];
      if (g.mode === 'rate') g.tokens = Math.min(g.tokens + g.rate * dt, 1.5);
    }

    S.dots.sort(function (a, b) { return b.s - a.s; });
    var end = G.along(NAMES.length - 1), mid = G.along(2);
    S.dots = S.dots.filter(function (d) {
      if (d.q) {
        d.q += dt * 1.6;
        if (d.q >= 1) { S.quarantined++; binCount.textContent = S.quarantined; return false; }
        return true;
      }
      var next = d.s + G.speed * dt;
      d.wait = 0;
      for (var i = 1; i < NAMES.length; i++) {
        var edge = G.along(i) - G.half;
        if (d.s >= edge) continue;
        var gt = S.gates[i];
        if (gt && next >= limits[i] && gt.mode !== 'open') {
          if (gt.mode === 'rate' && gt.tokens >= 1) { gt.tokens -= 1; break; }
          next = Math.min(next, limits[i]);
          limits[i] = next - 11;
          d.wait = i;
        }
        break;
      }
      if (S.validate && d.bad && d.s < mid && next >= mid) { d.s = mid; d.q = 0.001; return true; }
      d.s = Math.max(d.s, next);
      return d.s < end;
    });

    S.cost += (S.costTarget - S.cost) * Math.min(1, dt * (S.costTarget > S.cost ? 1.2 : 2.5));
    costEl.textContent = '$' + Math.round(S.cost);
    stages[3].sub.textContent = '$' + Math.round(S.cost) + '/h';

    var inc = S.incident;
    if (inc) {
      var before = inc.t;
      inc.t += dt;
      var pending = false;
      inc.list.forEach(function (x) {
        x.steps.forEach(function (s) { if (s[0] > before && s[0] <= inc.t || (before === 0 && s[0] === 0)) s[1](); });
        if (x.steps[x.steps.length - 1][0] > inc.t || !x.done()) pending = true;
      });
      if (!pending) finish();
    }
  }

  function draw() {
    if (reduceMotion) return;
    var bp = binPos();
    S.dots.forEach(function (d, i) {
      var c = pool[i];
      if (!c) { c = pool[i] = el('circle', { r: 5 }, dotLayer); }
      var p = pt(d.s);
      if (d.q) p = [p[0] + (bp[0] - p[0]) * d.q, p[1] + (bp[1] - p[1]) * d.q];
      c.setAttribute('cx', p[0].toFixed(1));
      c.setAttribute('cy', p[1].toFixed(1));
      c.setAttribute('class', d.bad ? 'is-bad' : '');
      c.style.display = '';
    });
    for (var j = S.dots.length; j < pool.length; j++) pool[j].style.display = 'none';
  }

  // Run only while the section is on screen.
  var running = false, last = 0;
  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    draw();
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(function (entries) {
    var on = entries[0].isIntersecting;
    if (on && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    if (!on) running = false;
  }).observe(root);
})();
