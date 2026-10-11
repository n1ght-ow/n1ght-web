(function () {
  "use strict";

  const archive = document.getElementById("archive");
  const tabbar = document.getElementById("archive-tabbar");
  const panelGroup = archive && archive.querySelector(":scope > .tab-panels");
  if (!archive || !tabbar || !panelGroup) return;

  const tabs = Array.from(tabbar.querySelectorAll("[role='tab']"));
  const rooms = {
    books: { count: (window.BOOK_SHELF || []).length, unit: "books" },
    films: { count: (window.FILM_DATA || []).length, unit: "films" },
    series: { count: (window.SERIES_DATA || []).length, unit: "series" },
    music: { count: (window.MUSIC_DATA || []).reduce((sum, group) => sum + group.tracks.length, 0), unit: "tracks" },
    sport: { count: archive.querySelectorAll(".sport-card").length, unit: "teams" },
    games: { count: archive.querySelectorAll(".hof-item").length, unit: "games" },
    poems: { count: (window.POEM_DATA || []).length, unit: "poems" },
  };

  tabs.forEach((tab) => {
    const token = tab.dataset.tab;
    const room = rooms[token];
    if (!room || tab.querySelector(".collection-tab-name")) return;
    const title = document.createElement("span");
    title.className = "collection-tab-name";
    const textNodes = Array.from(tab.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE);
    title.textContent = textNodes.map((node) => node.textContent).join("").trim();
    textNodes.forEach((node) => node.remove());
    tab.append(title);
  });

  const roomHeader = document.createElement("div");
  roomHeader.className = "collection-room";
  const roomName = document.createElement("p");
  roomName.className = "collection-room-name";
  const roomTitle = document.createElement("span");
  roomName.append(roomTitle);
  const explore = document.createElement("button");
  explore.type = "button";
  explore.className = "collection-room-action";
  explore.append(document.createTextNode("Surprise me"));
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  explore.append(arrow);
  explore.setAttribute("aria-label", "Explore a randomly chosen collection room");
  roomHeader.append(roomName, explore);
  panelGroup.prepend(roomHeader);

  let current = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
  if (current < 0) current = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const updateRoom = (index, animate) => {
    current = index;
    const tab = tabs[index];
    const room = tab && rooms[tab.dataset.tab];
    if (!room) return;
    roomTitle.textContent = room.count + " " + room.unit;
    archive.dataset.collectionRoom = tab.dataset.tab;
    if (animate && window.gsap && !reduced.matches) {
      gsap.fromTo(roomTitle,
        { y: 9, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.045, ease: "power3.out", overwrite: true, clearProps: "transform,opacity,visibility" });
    }
    // This scrolls only the horizontal catalogue on phones. Page position stays put.
    if (window.innerWidth <= 720) {
      const left = tab.offsetLeft - (tabbar.clientWidth - tab.offsetWidth) / 2;
      tabbar.scrollTo({ left, behavior: reduced.matches ? "auto" : "smooth" });
    }
  };
  updateRoom(current, false);
  reduced.addEventListener('change', () => {
    if (!window.gsap) return;
    gsap.killTweensOf(roomTitle);
    gsap.set(roomTitle, { clearProps: 'transform,opacity,visibility' });
  });
  tabbar.addEventListener("night:archive-tab", (event) => updateRoom(event.detail.index, true));
  explore.addEventListener("click", () => {
    const candidates = tabs.filter((tab, index) => index !== current);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    if (chosen) chosen.click();
  });

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(roomHeader,
        { y: 17 },
        { y: 0, ease: "none", scrollTrigger: {
          trigger: roomHeader, start: "top 92%", end: "top 62%", scrub: 0.7,
          invalidateOnRefresh: true,
        } });
      return () => {
        gsap.set(roomHeader, { clearProps: "transform,opacity,visibility" });
      };
    });
    // Tab sizing has a ResizeObserver in glass-pill.js; refresh after adding
    // the compact collection count and random-room control.
    if (typeof scheduleRefresh === "function") scheduleRefresh();
    else requestAnimationFrame(() => ScrollTrigger.refresh());
  }
})();
