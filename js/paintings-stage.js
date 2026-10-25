(function () {
  "use strict";
  const root = document.getElementById("painting-gallery");
  const works = window.PAINTING_DATA || [];
  if (!root || !works.length) return;
  const panel = root.closest(".tab-panel");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const path = {
    prev: "M20 12H4m6-6-6 6 6 6", next: "M4 12h16m-6-6 6 6-6 6",
    close: "m6 6 12 12M18 6 6 18", external: "M5 19 19 5M7 5h12v12",
    zoom: "M15.5 15.5 21 21M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0M10 7v6M7 10h6",
    fit: "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"
  };
  const icon = (name) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path[name] + '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  root.innerHTML = `
    <div class="painting-stage">
      <div class="painting-wall">
        <button class="painting-open" type="button" aria-label="Open painting in full-screen viewer"><img class="painting-image" src="${works[0].image}" loading="lazy" decoding="async" alt=""></button>
        <span class="painting-wall-mark">${icon("zoom")} Look closer</span>
      </div>
      <div class="painting-label">
        <div class="painting-label-copy">
          <h3 class="painting-title" lang="zh-CN"></h3>
          <p class="painting-english"></p>
          <p class="painting-artist"></p>
          <p class="painting-medium"></p>
          <p class="painting-note" lang="zh-CN"></p>
          <a class="painting-museum" target="_blank" rel="noopener noreferrer"><span></span>${icon("external")}</a>
        </div>
        <div class="painting-navigation" role="group" aria-label="Browse paintings">
          <span class="painting-counter"></span>
          <button class="painting-arrow" data-painting-step="-1" type="button" aria-label="Previous painting">${icon("prev")}</button>
          <button class="painting-arrow" data-painting-step="1" type="button" aria-label="Next painting">${icon("next")}</button>
        </div>
      </div>
    </div>
    <div class="painting-catalogue" role="group" aria-label="Choose a painting. Use arrow keys to browse." data-lenis-prevent></div>
    <div class="painting-footnote"><p>A small window onto the world’s great paintings.</p><a class="painting-source" target="_blank" rel="noopener noreferrer">Image &amp; source</a></div>
    <p class="painting-status" role="status" aria-live="polite"></p>`;
  const $ = (selector) => root.querySelector(selector);
  const image = $(".painting-image");
  const open = $(".painting-open");
  const catalogue = $(".painting-catalogue");
  const status = $(".painting-status");
  const wall = $(".painting-wall");
  const label = $(".painting-label-copy");
  const counter = $(".painting-counter");
  let current = 0, requested = 0, revision = 0, motion = null, entered = false;
  let imageSources = null;
  const prepared = new Map();
  const setText = (selector, value) => { $(selector).textContent = value; };
  const position = () => String(current + 1).padStart(2, "0") + " / " + String(works.length).padStart(2, "0");
  const canAnimate = () => window.gsap && !reduced.matches && panel.classList.contains("is-active") && !document.hidden;
  function settle() {
    if (motion) motion.kill();
    motion = null;
    if (window.gsap) gsap.set([image, wall, ...label.children], { clearProps: "transform,opacity,visibility,clipPath" });
  }
  function load(index) {
    if (prepared.has(index)) return prepared.get(index);
    const pending = new Promise((resolve, reject) => {
      const next = new Image();
      const timer = setTimeout(() => reject(new Error("Image timeout")), 12000);
      next.onload = async () => {
        try { await next.decode(); } catch (_) { /* loaded image remains usable */ }
        clearTimeout(timer); resolve(next);
      };
      next.onerror = () => { clearTimeout(timer); reject(new Error("Image unavailable")); };
      next.src = works[index].image;
    }).catch((error) => { prepared.delete(index); throw error; });
    prepared.set(index, pending);
    return pending;
  }
  function updateSources() {
    const source = imageSources && imageSources.works.find((entry) => entry.id === works[current].id);
    const anchor = $(".painting-source");
    anchor.href = source ? source.source : works[current].museumUrl;
  }
  function paint() {
    const work = works[current];
    if (entered) image.src = work.image;
    image.alt = work.alt;
    open.setAttribute("aria-label", "Open " + work.english + " in full-screen viewer");
    setText(".painting-title", work.title);
    setText(".painting-english", work.english);
    setText(".painting-artist", work.artist + " · " + work.year);
    setText(".painting-medium", work.medium);
    setText(".painting-note", work.note);
    setText(".painting-museum span", work.museum);
    $(".painting-museum").href = work.museumUrl;
    counter.textContent = position();
    choices.forEach((choice, index) => {
      choice.setAttribute("aria-pressed", String(index === current));
      choice.tabIndex = index === current ? 0 : -1;
    });
    const selected = choices[current];
    // Scroll only this catalogue; never move the document or the tab strip.
    if (panel.classList.contains("is-active")) catalogue.scrollTo({ left: selected.offsetLeft - catalogue.offsetLeft - (catalogue.clientWidth - selected.offsetWidth) / 2, behavior: reduced.matches ? "auto" : "smooth" });
    updateSources();
    if (viewer.open) renderViewer();
  }
  function reveal(direction) {
    if (!canAnimate()) return;
    motion = gsap.timeline({ onComplete: settle })
      .fromTo(image, { clipPath: direction > 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)", scale: 1.035 },
        { clipPath: "inset(0 0% 0 0%)", scale: 1, duration: .82, ease: "expo.out" }, 0)
      .fromTo(label.children, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: .58, stagger: .045, ease: "expo.out" }, .08);
  }
  async function select(index, animate = true) {
    index = (index + works.length) % works.length;
    requested = index;
    const ticket = ++revision;
    status.replaceChildren();
    if (index === current && image.complete && image.naturalWidth) { root.removeAttribute("aria-busy"); return; }
    root.setAttribute("aria-busy", "true");
    status.textContent = "Loading " + works[index].english + "…";
    try {
      await load(index);
      if (ticket !== revision) return;
      const direction = index >= current ? 1 : -1;
      settle(); current = index; paint();
      root.removeAttribute("aria-busy");
      status.textContent = works[current].english + ", " + works[current].artist + ", " + works[current].year;
      // Announcements stay available without adding another visible caption.
      status.classList.add("sr-only");
      if (animate && !viewer.open) reveal(direction);
      if (viewer.open && canAnimate()) gsap.fromTo(viewerImage, { opacity: .4 }, { opacity: 1, duration: .32, clearProps: "opacity" });
      load((current + 1) % works.length).catch(() => {});
    } catch (_) {
      if (ticket !== revision) return;
      root.removeAttribute("aria-busy");
      status.classList.remove("sr-only");
      status.textContent = "This painting could not load. Please try again.";
      const retry = document.createElement("button");
      retry.type = "button"; retry.className = "painting-retry"; retry.textContent = "Retry";
      retry.addEventListener("click", () => select(index)); status.append(retry);
    }
  }
  const choices = works.map((work, index) => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "painting-choice";
    button.setAttribute("aria-label", work.title + " — " + work.english + ", " + work.artist);
    button.setAttribute("aria-pressed", String(index === 0)); button.tabIndex = index === 0 ? 0 : -1;
    const mount = document.createElement("span"); mount.className = "painting-thumb";
    const thumb = document.createElement("img"); thumb.alt = ""; thumb.loading = "lazy"; thumb.decoding = "async"; thumb.src = work.thumbnail;
    mount.append(thumb);
    const name = document.createElement("span"); name.textContent = work.artistShort;
    button.append(mount, name);
    button.addEventListener("click", () => select(index));
    button.addEventListener("keydown", (event) => {
      let target = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") target++;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") target--;
      else if (event.key === "Home") target = 0;
      else if (event.key === "End") target = works.length - 1;
      else return;
      event.preventDefault(); target = (target + works.length) % works.length;
      choices[target].focus({ preventScroll: true }); select(target);
    });
    catalogue.append(button); return button;
  });
  root.querySelectorAll("[data-painting-step]").forEach((button) => button.addEventListener("click", () => select(requested + Number(button.dataset.paintingStep))));

  const viewer = document.createElement("dialog");
  viewer.className = "painting-viewer";
  viewer.setAttribute("aria-labelledby", "painting-viewer-title");
  viewer.setAttribute("data-lenis-prevent", "");
  viewer.innerHTML = `
    <div class="painting-viewer-head"><div class="painting-viewer-heading"><h2 class="painting-viewer-title" id="painting-viewer-title" lang="zh-CN"></h2><p class="painting-viewer-credit"></p></div><button class="painting-viewer-control" data-viewer-close type="button" aria-label="Close painting viewer">${icon("close")}</button></div>
    <div class="painting-viewer-canvas" tabindex="0" role="region" aria-label="Painting. Use the zoom button to inspect details; scroll to pan."><img class="painting-viewer-image" src="${works[0].image}" loading="lazy" alt="" draggable="false"></div>
    <div class="painting-viewer-foot"><span class="painting-viewer-position"></span><p class="painting-viewer-hint">Arrow keys to browse · Esc to close</p><div class="painting-viewer-tools"><button class="painting-viewer-control" data-viewer-zoom type="button" aria-label="Zoom in" aria-pressed="false">${icon("zoom")}</button><button class="painting-viewer-control" data-viewer-step="-1" type="button" aria-label="Previous painting">${icon("prev")}</button><button class="painting-viewer-control" data-viewer-step="1" type="button" aria-label="Next painting">${icon("next")}</button></div></div>`;
  document.body.append(viewer);
  const viewerImage = viewer.querySelector(".painting-viewer-image");
  const canvas = viewer.querySelector(".painting-viewer-canvas");
  const zoom = viewer.querySelector("[data-viewer-zoom]");
  const close = viewer.querySelector("[data-viewer-close]");
  let pan = null;
  function stopPan() {
    if (pan && canvas.hasPointerCapture(pan.id)) canvas.releasePointerCapture(pan.id);
    pan = null; canvas.classList.remove("is-panning");
  }
  function resetZoom() {
    stopPan(); canvas.classList.remove("is-zoomed"); canvas.scrollTo(0, 0);
    zoom.setAttribute("aria-pressed", "false"); zoom.setAttribute("aria-label", "Zoom in"); zoom.innerHTML = icon("zoom");
  }
  function toggleZoom() {
    if (canvas.classList.contains("is-zoomed")) { resetZoom(); return; }
    canvas.classList.add("is-zoomed"); zoom.setAttribute("aria-pressed", "true"); zoom.setAttribute("aria-label", "Fit painting to screen"); zoom.innerHTML = icon("fit");
    canvas.scrollTo(canvas.clientWidth / 2, canvas.clientHeight / 2);
  }
  function renderViewer() {
    resetZoom();
    viewerImage.src = works[current].image; viewerImage.alt = works[current].alt;
    viewer.querySelector(".painting-viewer-title").textContent = works[current].title;
    viewer.querySelector(".painting-viewer-credit").textContent = works[current].english + " · " + works[current].artist + " · " + works[current].year;
    viewer.querySelector(".painting-viewer-position").textContent = position();
  }
  open.addEventListener("click", () => {
    if (!image.naturalWidth) return;
    settle(); renderViewer(); viewer.showModal();
    if (typeof syncOverlays === "function") syncOverlays();
    close.focus();
    if (canAnimate()) gsap.fromTo(viewerImage, { opacity: .3, scale: .97 }, { opacity: 1, scale: 1, duration: .5, ease: "expo.out", clearProps: "transform,opacity" });
  });
  close.addEventListener("click", () => viewer.close());
  viewer.addEventListener("cancel", (event) => { event.preventDefault(); viewer.close(); });
  viewer.addEventListener("close", () => {
    resetZoom();
    if (window.gsap) gsap.killTweensOf(viewerImage);
    viewerImage.style.removeProperty("opacity"); viewerImage.style.removeProperty("transform");
    if (typeof syncOverlays === "function") syncOverlays();
    open.focus({ preventScroll: true });
  });
  viewer.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); viewer.close(); }
    else if (!canvas.classList.contains("is-zoomed") && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault(); event.stopPropagation(); select(requested + (event.key === "ArrowRight" ? 1 : -1));
    } else if (event.key === "+" || event.key === "=" || event.key === "-") { event.preventDefault(); toggleZoom(); }
  });
  viewer.querySelectorAll("[data-viewer-step]").forEach((button) => button.addEventListener("click", () => select(requested + Number(button.dataset.viewerStep))));
  zoom.addEventListener("click", toggleZoom);
  viewerImage.addEventListener("dblclick", toggleZoom);
  canvas.addEventListener("pointerdown", (event) => {
    if (!canvas.classList.contains("is-zoomed") || event.pointerType === "touch" || event.button !== 0) return;
    pan = { id: event.pointerId, x: event.clientX, y: event.clientY, left: canvas.scrollLeft, top: canvas.scrollTop };
    canvas.setPointerCapture(event.pointerId); canvas.classList.add("is-panning"); event.preventDefault();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!pan || pan.id !== event.pointerId) return;
    canvas.scrollLeft = pan.left - (event.clientX - pan.x); canvas.scrollTop = pan.top - (event.clientY - pan.y);
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => canvas.addEventListener(name, stopPan));
  window.addEventListener("blur", stopPan);
  window.addEventListener("resize", resetZoom);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { stopPan(); settle(); } });
  reduced.addEventListener("change", () => { settle(); if (window.gsap) { gsap.killTweensOf(viewerImage); gsap.set(viewerImage, { clearProps: "transform,opacity" }); } });
  document.getElementById("archive-tabbar").addEventListener("night:archive-tab", (event) => {
    settle();
    if (event.detail.token !== "paintings") return;
    if (!entered) { entered = true; select(current, false); }
  });
  fetch("assets/paintings/sources.json?v=1").then((response) => {
    if (!response.ok) throw new Error("Source information unavailable");
    return response.json();
  }).then((sources) => { imageSources = sources; updateSources(); }).catch(() => {});
  // Artwork loads on first entry, while the small catalogue stays lazy.
  paint();
})();
