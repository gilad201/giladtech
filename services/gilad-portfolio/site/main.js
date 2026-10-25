// Renders the drum videos listed in window.DRUM_VIDEOS (index.html).
// Shows a thumbnail first and loads the YouTube player only on click,
// so the page stays fast and nothing from YouTube loads until a visitor asks.
(function () {
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  var list = (window.DRUM_VIDEOS || []).map(youtubeId).filter(Boolean);
  var box = document.getElementById('videos');
  if (!box || list.length === 0) return;

  list.forEach(function (id) {
    var btn = document.createElement('button');
    btn.className = 'video';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Play drum video');
    var img = document.createElement('img');
    img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
    img.alt = '';
    img.loading = 'lazy';
    var play = document.createElement('span');
    play.className = 'video__play';
    play.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="#1C1410"/></svg>';
    btn.appendChild(img);
    btn.appendChild(play);
    btn.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1';
      frame.title = 'Drum video';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.allowFullscreen = true;
      btn.replaceWith(frame);
      frame.className = 'video';
    });
    box.appendChild(btn);
  });
  box.hidden = false;

  function youtubeId(url) {
    var m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
})();

// Case studies (inside Experience): each case steps through
// Problem → What I built → Result while its diagram highlights the matching parts.
// Without JS, every step simply shows.
(function () {
  var STEPS = ['problem', 'built', 'result'];
  [].forEach.call(document.querySelectorAll('.case'), function (panel) {
    panel.classList.add('is-interactive');
    setupSteps(panel);
  });

  function setupSteps(panel) {
    var dl = panel.querySelector('.case__steps');
    var labels = dl.querySelectorAll('dt');
    var texts = dl.querySelectorAll('dd');
    var nav = document.createElement('div');
    nav.className = 'steps';
    var current = 0;
    var buttons = [].map.call(labels, function (dt, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'step';
      b.innerHTML = '<span class="step__n">' + (k + 1) + '</span>' + dt.textContent;
      b.addEventListener('click', function () { go(k); });
      nav.appendChild(b);
      return b;
    });
    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'step-next';
    next.addEventListener('click', function () { go((current + 1) % STEPS.length); });
    dl.parentNode.insertBefore(nav, dl);
    dl.parentNode.appendChild(next);
    go(0);

    function go(k) {
      current = k;
      panel.setAttribute('data-step', STEPS[k]);
      buttons.forEach(function (b, j) { b.setAttribute('aria-pressed', j === k); });
      [].forEach.call(texts, function (dd, j) { dd.hidden = j !== k; });
      next.textContent = k < STEPS.length - 1 ? 'Next →' : 'Start over ↺';
    }
  }
})();

// Projects: flip the cards to read the back; flipping all five wins.
(function () {
  var game = document.querySelector('.game');
  if (!game) return;
  var tiles = [].slice.call(game.querySelectorAll('.tile'));
  var dots = game.querySelectorAll('.game__dots i');
  var text = game.querySelector('.game__text');
  var win = game.querySelector('.game__win');
  var seen = [];

  game.classList.add('is-game');
  game.querySelector('.game__score').hidden = false;

  tiles.forEach(function (tile, i) {
    var front = tile.querySelector('.tile__front');
    var back = tile.querySelector('.tile__back');
    var title = tile.querySelector('.tile__title').textContent;
    front.setAttribute('role', 'button');
    front.tabIndex = 0;
    front.setAttribute('aria-label', title + ': flip card');
    var undo = document.createElement('button');
    undo.type = 'button';
    undo.className = 'tile__undo';
    undo.setAttribute('aria-label', 'Flip ' + title + ' back');
    undo.textContent = '↺';
    back.appendChild(undo);
    back.inert = true;

    front.addEventListener('click', function () { flip(i, true); });
    front.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(i, true); undo.focus(); }
    });
    back.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      flip(i, false);
      if (e.target === undo) front.focus();
    });
  });

  game.querySelector('.game__all').addEventListener('click', function () {
    tiles.forEach(function (_, i) { setTimeout(function () { flip(i, true); }, i * 120); });
  });

  function flip(i, open) {
    var tile = tiles[i];
    tile.classList.toggle('is-flipped', open);
    tile.querySelector('.tile__front').inert = open;
    tile.querySelector('.tile__back').inert = !open;
    if (open && seen.indexOf(i) < 0) {
      seen.push(i);
      dots[seen.length - 1].className = 'on';
      text.textContent = seen.length + ' of ' + tiles.length + ' flipped';
      if (seen.length === tiles.length) win.hidden = false;
    }
  }
})();

// Tiny drum kit made with Web Audio, so the playful bits can make noise.
// Sounds only ever start from a tap or key press.
var drum = (function () {
  var VOLUME = 0.3; // overall loudness, 0–1
  var ctx, master, noiseBuf;
  function audio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = VOLUME;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function noise(c) {
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var src = c.createBufferSource();
    src.buffer = noiseBuf;
    return src;
  }
  function env(c, t, peak, len) {
    var g = c.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    g.connect(master);
    return g;
  }
  function tone(c, t, type, from, to, len, peak) {
    var o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + len);
    o.connect(env(c, t, peak, len));
    o.start(t); o.stop(t + len);
  }
  function hiss(c, t, cutoff, len, peak) {
    var n = noise(c), f = c.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = cutoff;
    n.connect(f); f.connect(env(c, t, peak, len));
    n.start(t); n.stop(t + len);
  }
  var kit = {
    kick: function (c, t) { tone(c, t, 'sine', 150, 40, 0.35, 0.9); },
    snare: function (c, t) { hiss(c, t, 1200, 0.18, 0.5); tone(c, t, 'triangle', 220, 160, 0.08, 0.3); },
    tom: function (c, t) { tone(c, t, 'sine', 220, 90, 0.3, 0.7); },
    hat: function (c, t) { hiss(c, t, 7000, 0.06, 0.3); },
    crash: function (c, t) { hiss(c, t, 4000, 1.2, 0.25); },
    blip: function (c, t) { tone(c, t, 'square', 880, 880, 0.08, 0.12); },
    chime: function (c, t) { tone(c, t, 'sine', 660, 660, 0.35, 0.35); tone(c, t + 0.12, 'sine', 990, 990, 0.5, 0.3); }
  };
  return function (name, delay) {
    var c = audio();
    if (c && kit[name]) kit[name](c, c.currentTime + (delay || 0));
  };
})();

// Hero: "play drums" plays a little fill.
(function () {
  var egg = document.querySelector('.drum-egg');
  if (!egg) return;
  egg.setAttribute('role', 'button');
  egg.tabIndex = 0;
  egg.title = 'Go on, tap it';
  function fill() {
    ['snare', 'snare', 'tom', 'tom', 'kick'].forEach(function (s, i) { drum(s, i * 0.11); });
    drum('crash', 0.55);
    egg.classList.remove('is-hit');
    void egg.offsetWidth;
    egg.classList.add('is-hit');
  }
  egg.addEventListener('click', fill);
  egg.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fill(); }
  });
})();

// About: tap a world to light it and read its line. All three lit, they slide together.
(function () {
  var box = document.querySelector('.worlds');
  if (!box) return;
  var worlds = [].slice.call(box.querySelectorAll('.world'));
  var line = box.querySelector('.worlds__line');
  box.classList.add('is-live');
  line.textContent = 'Tap a world.';
  worlds.forEach(function (w) {
    w.addEventListener('click', function () {
      w.setAttribute('aria-pressed', 'true');
      line.textContent = w.getAttribute('data-line');
      var lit = worlds.filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; }).length;
      if (lit === worlds.length) box.classList.add('is-complete');
    });
  });
})();

// Now: play one bar of 6/8 with accents on 1 and 4.
(function () {
  var btn = document.querySelector('.now__play');
  if (!btn) return;
  btn.hidden = false;
  btn.addEventListener('click', function () {
    var step = 0.2;
    for (var i = 0; i < 6; i++) {
      drum(i % 3 === 0 ? 'snare' : 'hat', i * step);
      if (i === 0 || i === 3) drum('kick', i * step);
    }
  });
})();
