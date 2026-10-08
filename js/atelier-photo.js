(function () {
  'use strict';
  var host = document.getElementById('photo-deck');
  if (!host) return;
  var frames = Array.from(host.querySelectorAll('.photo-frame'));
  if (!frames.length) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var active = 0;
  var manual = false;
  var animations = [];
  var exchange = null;
  var ghosts = [];
  var decodedPrints = new Map();
  var refreshLayout = function () { window.scheduleRefresh(250); };

  host.classList.add('atelier-photo');
  host.setAttribute('aria-label', 'Photography viewing room, 21 photographs');
  var heading = document.createElement('div');
  heading.className = 'atelier-photo__heading';
  heading.innerHTML = '<span>Field notes / A year in light</span><span>21 photographs · one long walk</span>';
  var room = document.createElement('div');
  room.className = 'atelier-photo__room';
  var plane = document.createElement('div');
  plane.className = 'atelier-photo__plane';
  room.appendChild(plane);
  var catalog = document.createElement('div');
  catalog.className = 'atelier-photo__catalog';
  catalog.innerHTML = '<div class="atelier-photo__catalog-head"><p class="atelier-photo__catalog-label">The contact sheet <span class="atelier-photo__count">/ 01 of 21</span></p><div class="atelier-photo__controls"><button class="atelier-photo__step" type="button" data-step="-1" aria-label="Previous photograph">←</button><button class="atelier-photo__step" type="button" data-step="1" aria-label="Next photograph">→</button></div></div>';
  var sheet = document.createElement('div');
  sheet.className = 'atelier-photo__sheet';
  sheet.setAttribute('role', 'group');
  sheet.setAttribute('aria-label', 'Select photograph');
  catalog.appendChild(sheet);
  var note = document.createElement('p');
  note.className = 'atelier-photo__note';
  note.lang = 'en';
  note.textContent = 'Choose a print to revisit a day. Open the photograph for a closer look.';
  catalog.appendChild(note);
  var live = document.createElement('p');
  live.className = 'atelier-photo__live';
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  var thumbs = frames.map(function (frame, i) {
    var image = frame.querySelector('img');
    var rail = image.getAttribute('data-rail') || image.getAttribute('src');
    image.setAttribute('data-rail', rail);
    image.draggable = false;
    frame.hidden = true;
    frame.classList.remove('is-top', 'is-flying');
    frame.removeAttribute('style');
    frame.querySelector('.photo-frame-cap').classList.remove('sr-only');
    plane.appendChild(frame);
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'atelier-photo__thumb';
    button.setAttribute('aria-label', 'Select photograph ' + (i + 1) + ': ' + image.alt);
    button.setAttribute('aria-pressed', 'false');
    var small = document.createElement('img');
    small.src = rail;
    small.alt = '';
    small.loading = 'lazy';
    small.decoding = 'async';
    small.width = 80;
    small.height = 80;
    var number = document.createElement('span');
    number.textContent = String(i + 1).padStart(2, '0');
    button.appendChild(small);
    button.appendChild(number);
    button.addEventListener('click', function () { manual = true; select(i, true); });
    button.addEventListener('keydown', function (event) {
      var next;
      if (event.key === 'ArrowRight') next = (i + 1) % frames.length;
      if (event.key === 'ArrowLeft') next = (i + frames.length - 1) % frames.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = frames.length - 1;
      if (typeof next !== 'number') return;
      event.preventDefault();
      manual = true;
      select(next, true);
      thumbs[next].focus({ preventScroll: true });
    });
    sheet.appendChild(button);
    return button;
  });
  var fallback = host.querySelector('[data-photo-fallback]');
  if (fallback) fallback.remove();
  var foot = document.getElementById('photo-deck-foot');
  if (foot) foot.hidden = true;
  host.prepend(room);
  host.prepend(heading);
  host.appendChild(catalog);
  host.appendChild(live);

  function stopExchange() {
    if (exchange) exchange.kill();
    exchange = null;
    ghosts.forEach(function (ghost) { ghost.remove(); });
    ghosts = [];
    if (window.gsap) gsap.set(frames.concat(frames.map(function (frame) { return frame.querySelector('.photo-frame-cap'); })), { clearProps: 'transform,transformOrigin,opacity,visibility,willChange' });
  }

  function select(index, animate) {
    var next = (index + frames.length) % frames.length;
    if (next === active && animate) return;
    var direction = index < active ? -1 : 1;
    var moving = animate && !reduced.matches && window.gsap;
    // Snapshot the current visual positions before cancelling an interrupted exchange.
    var planeBox = plane.getBoundingClientRect();
    var before = new Map();
    var departing = [];
    var visible = [next, (next + 7) % frames.length, (next + 14) % frames.length];
    if (moving) frames.forEach(function (frame, i) {
      if (frame.hidden) return;
      var box = frame.getBoundingClientRect();
      before.set(frame, box);
      if (!visible.includes(i)) {
        var copy = frame.cloneNode(true);
        copy.removeAttribute('style');
        copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach(function (node) { node.removeAttribute('id'); });
        copy.classList.add('atelier-photo__ghost');
        copy.setAttribute('aria-hidden', 'true');
        copy.inert = true;
        Object.assign(copy.style, { inset: 'auto', left: (box.left - planeBox.left) + 'px', top: (box.top - planeBox.top) + 'px', width: box.width + 'px', height: box.height + 'px' });
        departing.push(copy);
      }
    });
    stopExchange();
    active = next;
    var classes = ['is-featured', 'is-companion-a', 'is-companion-b'];
    frames.forEach(function (frame, i) {
      if (window.gsap) gsap.killTweensOf(frame);
      frame.classList.remove.apply(frame.classList, classes);
      frame.removeAttribute('style');
      var slot = visible.indexOf(i);
      frame.hidden = slot < 0;
      if (slot < 0) return;
      frame.classList.add(classes[slot]);
      var image = frame.querySelector('img');
      var full = image.getAttribute('data-full');
      image.loading = 'eager';
      if (full && image.getAttribute('src') !== full) {
        // Keep the small, decoded print on screen while the full image loads.
        // Swapping src first would leave the shared transition without pixels.
        if (!decodedPrints.has(full)) {
          var print = new Image();
          print.decoding = 'async';
          print.src = full;
          decodedPrints.set(full, print.decode().then(function () { return true; }).catch(function () {
            decodedPrints.delete(full);
            return false;
          }));
        }
        decodedPrints.get(full).then(function (ready) {
          if (ready && !frame.hidden) image.src = full;
        });
      }
    });
    if (moving) {
      ghosts = departing;
      ghosts.forEach(function (ghost) { plane.appendChild(ghost); });
      var arrivals = visible.map(function (i) {
        var frame = frames[i];
        return { frame: frame, box: frame.getBoundingClientRect(), old: before.get(frame) };
      });
      exchange = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: stopExchange });
      if (ghosts.length) exchange.to(ghosts, { x: -direction * 58, y: -10, rotation: -direction * 1.2, opacity: 0, duration: .38, stagger: .025 }, 0);
      arrivals.forEach(function (arrival, slot) {
        var frame = arrival.frame, box = arrival.box, old = arrival.old;
        gsap.set(frame, { willChange: 'transform,opacity', transformOrigin: '0 0' });
        exchange.fromTo(frame, old ? {
          x: old.left - box.left, y: old.top - box.top,
          scaleX: old.width / box.width, scaleY: old.height / box.height, opacity: 1,
        } : { x: direction * (slot ? 38 : 72), y: 16, rotation: direction * 1.2, scale: .975, opacity: 0 },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1, duration: .65 }, slot * .045);
        if (!old) exchange.fromTo(frame.querySelector('.photo-frame-cap'), { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: .36 }, .2 + slot * .045);
      });
    }
    thumbs.forEach(function (button, i) { button.setAttribute('aria-pressed', String(i === active)); });
    host.querySelector('.atelier-photo__count').textContent = '/ ' + String(active + 1).padStart(2, '0') + ' of ' + frames.length;
    if (animate) live.textContent = 'Photograph ' + (active + 1) + ', ' + frames[active].querySelector('.photo-frame-text').textContent;
    refreshLayout();
  }
  catalog.querySelectorAll('[data-step]').forEach(function (button) {
    button.addEventListener('click', function () {
      manual = true;
      select(active + Number(button.dataset.step), true);
    });
  });
  /* No PhotoDeck facade: every displayed original button opens the shared
     detail layer directly, including either companion photograph. */
  select(0, false);

  function setupMotion() {
    stopExchange();
    animations.forEach(function (animation) {
      if (animation.scrollTrigger) animation.scrollTrigger.kill();
      if (animation.kill) animation.kill();
    });
    animations = [];
    if (window.gsap) gsap.set(plane, { clearProps: 'transform' });
    if (reduced.matches && window.gsap) {
      frames.forEach(function (frame) {
        gsap.killTweensOf(frame);
        gsap.set(frame, { clearProps: 'opacity,transform' });
      });
    }
    if (reduced.matches || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.innerWidth > 720) {
      animations.push(gsap.fromTo(plane, { y: 35 }, {
        y: -22, ease: 'none',
        scrollTrigger: { trigger: room, start: 'top bottom', end: 'bottom top', scrub: .9, invalidateOnRefresh: true }
      }));
    }
    var previous = 0;
    var trigger = ScrollTrigger.create({
      trigger: room, start: 'top 70%', end: 'bottom 20%', invalidateOnRefresh: true,
      onUpdate: function (self) {
        var chapter = Math.min(2, Math.floor(self.progress * 3));
        if (chapter === previous) return;
        previous = chapter;
        if (!manual && !host.contains(document.activeElement)) select(chapter * 7, true);
      }
    });
    animations.push({ kill: function () { trigger.kill(); } });
  }
  setupMotion();
  reduced.addEventListener('change', setupMotion);
  var narrow = window.matchMedia('(max-width: 720px)');
  narrow.addEventListener('change', setupMotion);
  window.AtelierPhoto = { select: function (index, animate) { manual = true; select(index, animate !== false); }, count: function () { return frames.length; } };
})();
