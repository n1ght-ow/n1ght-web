(function () {
  "use strict";

  /* The shelf. Ports the book-shelf lab at sanyam.sh (components/labs/
     book-shelf) onto this site's stack: one mount, no build step, and GSAP
     for the travel where the original used motion/react.

     The idea worth keeping, in the original's own words: the thing arriving in
     the centre is the same object that was on the shelf, turned. The spine is
     one face of a box and the cover is another, so bringing the cover to the
     reader is a rotation rather than a swap, and nothing has to fade into
     anything. Because the cover lands centred on the box's own middle, the
     travel to the centre is a plain translation the layout already knows. */

  var BOOKS = window.BOOK_SHELF || [];
  if (!BOOKS.length) return;

  /* how wide a cover is, which is also how deep a book sits on the shelf */
  var COVER = 182;
  /* the gap between two spines */
  var GAP = 3;
  /* how much frame is kept clear either side of the shelf */
  var MARGIN = 70;
  /* how a book answers a pointer: it tips its head out, which is how a hand
     takes one off a shelf. Coming forward instead is almost nothing on screen
     at this perspective. */
  var TIP_OUT = 7;

  /* where each book starts along the shelf, and how wide the row comes to */
  var left = [];
  var rowWidth = 0;
  BOOKS.forEach(function (b) {
    left.push(rowWidth);
    rowWidth += b.thickness + GAP;
  });
  rowWidth -= GAP;

  /* how far the leaning book's head swings past the row. A lean pivots on the
     corner the book stands on, so the box the layout knows about stops at the
     spine while the head reaches further, and centring the boxes leaves the
     shelf visibly off centre. Everything is centred on this instead. */
  var overhang = BOOKS.reduce(function (most, b) {
    return Math.max(most, b.height * Math.sin((b.lean * Math.PI) / 180));
  }, 0);
  overhang = Math.round(overhang);

  var reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* the original's spring is stiffness 210 / damping 26, which settles at about
     0.35s with roughly half a percent of overshoot; power3.out is that curve */
  var SPRING = reduce ? { duration: 0 } : { duration: 0.5, ease: "power3.out" };
  var SNAP = reduce ? { duration: 0 } : { duration: 0.16, ease: "expo.out" };

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function build(mount) {
    mount.classList.add("book-shelf");
    mount.replaceChildren();

    var scene = el("div", "bs-scene");
    mount.appendChild(scene);

    var board = el("div", "bs-board");
    board.style.width = rowWidth + overhang + 30 + "px";
    board.style.marginLeft = -(rowWidth + overhang + 30) / 2 + "px";
    scene.appendChild(board);

    var cast = el("div", "bs-cast");
    cast.style.width = rowWidth + overhang + 14 + "px";
    cast.style.marginLeft = -(rowWidth + overhang + 14) / 2 + "px";
    scene.appendChild(cast);

    var row = el("div", "bs-row");
    row.style.width = rowWidth + "px";
    row.style.marginLeft = -(rowWidth + overhang) / 2 + "px";
    scene.appendChild(row);

    var grainUrl =
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

    var nodes = BOOKS.map(function (book, index) {
      var btn = el("button", "bs-book");
      btn.type = "button";
      btn.setAttribute("data-book", book.id);
      btn.style.left = left[index] + "px";
      btn.style.width = book.thickness + "px";
      btn.style.height = book.height + "px";
      /* a book pivots on the corner it is standing on, and that corner is at
         the front of the board rather than through the middle of it. Without
         the z the tip rotates about the book's centre plane, which swings the
         foot of the spine backwards and down, and the board it is standing on
         then covers the bottom of it. */
      btn.style.transformOrigin =
        (book.lean > 0 ? "right" : "left") + " bottom " + COVER / 2 + "px";

      var box = el("div", "bs-box");
      btn.appendChild(box);

      var spine = el("div", "bs-spine");
      spine.style.background = book.cloth;
      box.appendChild(spine);

      spine.appendChild(el("span", "bs-round"));
      var grain = el("span", "bs-grain");
      grain.setAttribute("aria-hidden", "true");
      grain.style.backgroundImage = grainUrl;
      spine.appendChild(grain);
      spine.appendChild(el("span", "bs-blind"));

      var head = el("span", "bs-band bs-band--head");
      head.style.background = book.band;
      var tail = el("span", "bs-band bs-band--tail");
      tail.style.background = book.band;
      spine.appendChild(head);
      spine.appendChild(tail);

      /* a spine too thin for a title shows none, which is what a real shelf
         does: the cloth is left to tell the book apart */
      var title = null;
      if (book.thickness >= 18) {
        title = el("span", "bs-title");
        /* the back of the book carries the short form, in English: a spine is a
           21px strip and Latin turns to lie along it, which is what a spine
           does. The cover below carries the name the book is known by. */
        title.textContent = book.spine;
        title.setAttribute("lang", "en");
        title.style.color = book.ink;
        spine.appendChild(title);
      }

      var pages = el("div", "bs-pages");
      pages.style.width = book.thickness + "px";
      pages.style.height = book.height + "px";
      pages.style.transform = "rotateY(180deg) translateZ(" + COVER / 2 + "px)";
      box.appendChild(pages);

      var cover = el("div", "bs-cover");
      cover.style.width = COVER + "px";
      cover.style.height = book.height + "px";
      cover.style.left = (book.thickness - COVER) / 2 + "px";
      cover.style.background = book.cloth;
      cover.style.transform =
        "rotateY(90deg) translateZ(" + book.thickness / 2 + "px)";
      box.appendChild(cover);

      cover.appendChild(el("span", "bs-cover-light"));
      var coverGrain = el("span", "bs-grain");
      coverGrain.setAttribute("aria-hidden", "true");
      coverGrain.style.backgroundImage = grainUrl;
      cover.appendChild(coverGrain);
      cover.appendChild(el("span", "bs-cover-border"));

      /* the label, pasted on */
      var label = el("div", "bs-label");
      var rule = el("span", "bs-label-rule");
      rule.style.background = book.band;
      label.appendChild(rule);
      var lt = el("p", "bs-label-title");
      lt.textContent = book.title;
      lt.setAttribute("lang", "zh");
      label.appendChild(lt);
      var la = el("p", "bs-label-author");
      la.textContent = book.author;
      la.setAttribute("lang", "zh");
      label.appendChild(la);
      cover.appendChild(label);

      var stamp = el("span", "bs-stamp");
      stamp.style.boxShadow =
        "inset 0 0 0 1px " + book.band + ", inset 0 1px 0 oklch(0 0 0 / 0.25)";
      cover.appendChild(stamp);

      row.appendChild(btn);
      return { book: book, index: index, btn: btn, box: box, title: title };
    });

    /* the scrim is a button because it is the other way out of the modal */
    var scrim = el("button", "bs-scrim");
    scrim.type = "button";
    scrim.setAttribute("aria-label", "Put the book back");
    scene.appendChild(scrim);

    var blurb = el("p", "bs-blurb");
    blurb.setAttribute("lang", "zh");
    var live = el("p", "sr-only");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    mount.appendChild(blurb);
    mount.appendChild(live);

    return { scene: scene, nodes: nodes, scrim: scrim, blurb: blurb, live: live };
  }

  function init(mount) {
    var parts = build(mount);
    var nodes = parts.nodes;
    var picked = null;
    var hovered = null;

    /* the two lines around the open book sit in fixed bands, so the geometry
       only ever has to be read once per layout */
    function metrics() {
      var cs = getComputedStyle(mount);
      var px = function (name, fallback) {
        var v = parseFloat(cs.getPropertyValue(name));
        return isNaN(v) ? fallback : v;
      };
      return {
        base: px("--bs-base", 500),
        /* the stage's own middle, which is where the scene's scale pivots and
           therefore where a picked cover lands at any fit */
        centre: mount.clientHeight / 2 || 280,
        out: px("--bs-out", 210)
      };
    }
    var M = metrics();

    function fit() {
      var fit = Math.min(1, (mount.clientWidth - MARGIN * 2) / (rowWidth + 40));
      mount.style.setProperty("--bs-fit", String(fit));
    }

    /* the spine titles are set in a face whose Latin is much wider than the
       page sans, so a long title can outrun its spine. Shrink to fit rather
       than clip: a half-spine is worse than a small one. */
    function fitTitles() {
      nodes.forEach(function (n) {
        if (!n.title) return;
        /* one size for the whole shelf, the way a publisher would set a series.
           The check below only ever shrinks it, and only for the two long
           titles that need it. */
        var max = 13;
        n.title.style.fontSize = max + "px";
        var guard = 0;
        while (n.title.offsetHeight > n.book.height - 44 && max > 7 && guard < 40) {
          max -= 0.5;
          n.title.style.fontSize = max + "px";
          guard++;
        }
      });
    }

    function render(animate) {
      var gap = -1;
      if (picked) {
        for (var i = 0; i < BOOKS.length; i++) if (BOOKS[i].id === picked) gap = i;
      }

      nodes.forEach(function (n) {
        var book = n.book;
        var isPicked = picked === book.id;
        var away = gap < 0 ? 0 : n.index - gap;

        /* the neighbours lean into the hole. A book only stands up because the
           books either side of it do, so taking one out and leaving the row
           perfectly upright is the one thing a shelf never does. It falls off
           with distance, and the two nearest do nearly all of it. */
        /* the tip is capped and a book that already leans takes none of it: a
           lean pivots on the corner the book stands on, so it swings its head
           sideways by its own height times the sine, and the row starts
           crossing itself. */
        var tip = 0;
        if (gap >= 0 && !isPicked && book.lean === 0 && Math.abs(away) <= 3) {
          tip = (away > 0 ? -1 : 1) * (3 / Math.abs(away));
        }

        /* the cover lands in the middle of the stage, which the layout already
           knows */
        var dx = (rowWidth + overhang) / 2 - (left[n.index] + book.thickness / 2);
        var dy = M.centre - (M.base - book.height / 2);

        n.btn.setAttribute(
          "aria-label",
          (isPicked ? "合上《" + book.title + "》" : "打开《" + book.title + "》")
        );
        n.btn.setAttribute("data-picked", isPicked ? "true" : "false");

        var to = {
          x: isPicked ? dx : 0,
          y: isPicked ? dy : 0,
          z: isPicked ? M.out : 0,
          rotateX: !isPicked && hovered === book.id ? -TIP_OUT : 0,
          rotateZ: isPicked ? 0 : book.lean + tip
        };

        if (!animate) {
          gsap.set(n.btn, to);
          gsap.set(n.box, { rotateY: isPicked ? -90 : 0 });
          return;
        }

        gsap.to(n.btn, {
          x: to.x,
          y: to.y,
          rotateX: to.rotateX,
          rotateZ: to.rotateZ,
          duration: SPRING.duration,
          ease: SPRING.ease
        });
        /* out of the row, then turn. Back the other way round: turn first and
           drop into the row last, or the book comes down level with its
           neighbours while it is still travelling and passes through them. */
        gsap.to(n.btn, {
          z: to.z,
          duration: SPRING.duration,
          ease: SPRING.ease,
          delay: isPicked ? 0 : 0.16
        });
        gsap.to(n.box, {
          rotateY: isPicked ? -90 : 0,
          duration: SPRING.duration,
          ease: SPRING.ease,
          delay: isPicked ? 0.08 : 0
        });
        gsap.to(n.btn, {
          rotateX: to.rotateX,
          duration: SNAP.duration,
          ease: SNAP.ease,
          overwrite: "auto"
        });
      });

      if (picked) {
        mount.setAttribute("data-picked", picked);
      } else {
        mount.removeAttribute("data-picked");
      }

      var open = null;
      if (picked) {
        for (var j = 0; j < BOOKS.length; j++) if (BOOKS[j].id === picked) open = BOOKS[j];
      }
      if (open) {
        parts.blurb.textContent = open.blurb;
        parts.live.textContent = open.title + "，" + open.author + "。" + open.blurb;
      } else {
        parts.live.textContent = "";
      }
    }

    function pick(id) {
      picked = picked === id ? null : id;
      hovered = null;
      render(true);
    }

    nodes.forEach(function (n) {
      n.btn.addEventListener("click", function () {
        pick(n.book.id);
      });
      n.btn.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "touch") return;
        hovered = n.book.id;
        render(true);
      });
      n.btn.addEventListener("pointerleave", function () {
        if (hovered !== n.book.id) return;
        hovered = null;
        render(true);
      });
    });

    parts.scrim.addEventListener("click", function () {
      picked = null;
      render(true);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !picked) return;
      picked = null;
      render(true);
    });

    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function () {
        fit();
        M = metrics();
        render(false);
      });
      ro.observe(mount);
    } else {
      window.addEventListener("resize", function () {
        fit();
        M = metrics();
        render(false);
      });
    }

    fit();
    render(false);
    /* the spine face is a webfont, and a spine that reflows after it lands
       would jump inside a fixed-width 3D box */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        fitTitles();
        render(false);
      });
    } else {
      fitTitles();
    }
  }

  function boot() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-book-shelf='auto']"),
      init
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
