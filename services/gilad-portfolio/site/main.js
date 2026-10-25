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
