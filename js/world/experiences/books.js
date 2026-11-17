export function buildExperience(kit) {
  const THREE = kit?.THREE;
  if (!THREE || !kit.sculpt || typeof kit.mesh !== "function") {
    throw new TypeError("books experience requires the shared Three.js experience kit");
  }

  const sculpt = kit.sculpt;
  const collection = kit.collection || { id: "books", items: [] };
  const collected = Array.isArray(collection.items) ? collection.items.filter(Boolean) : [];
  const fallback = Array.isArray(globalThis.BOOK_SHELF)
    ? globalThis.BOOK_SHELF.map((book, index) => ({
        ...book,
        id: String(book.id || `book-${index + 1}`),
        title: book.title || book.spine || "",
        author: book.author || "",
        description: book.blurb || "",
        originalFields: book,
      }))
    : [];
  const items = (collected.length ? collected : fallback).slice(0, 16);
  const group = new THREE.Group();
  group.name = "endless-page-city";

  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const ownedTextures = new Set();
  const localMaterialCache = new Map();

  const ownGeometry = (geometry) => {
    if (geometry) ownedGeometries.add(geometry);
    return geometry;
  };
  const ownMaterial = (material) => {
    if (material) ownedMaterials.add(material);
    return material;
  };
  const ownTexture = (texture) => {
    if (texture) ownedTextures.add(texture);
    return texture;
  };
  const resolveMaterial = (value, fallbackValue, roughness = 0.65, metalness = 0) => {
    if (value && value.isMaterial) return value;
    if (typeof kit.material === "function") return kit.material(value || fallbackValue, roughness, metalness);
    const key = `${value || fallbackValue}:${roughness}:${metalness}`;
    if (!localMaterialCache.has(key)) {
      localMaterialCache.set(
        key,
        ownMaterial(new THREE.MeshStandardMaterial({ color: value || fallbackValue, roughness, metalness })),
      );
    }
    return localMaterialCache.get(key);
  };
  const localMaterial = (options) => ownMaterial(new THREE.MeshStandardMaterial(options));
  const brass = resolveMaterial(kit.brass, 0xa77f45, 0.3, 0.73);
  const copper = resolveMaterial(0x9a6648, 0x9a6648, 0.4, 0.58);
  const stone = resolveMaterial(kit.stone, 0xa79e8f, 0.9, 0.02);
  const cream = resolveMaterial(kit.cream, 0xeee6d6, 0.82, 0.01);
  const walnut = resolveMaterial(kit.walnut, 0x5a3e2d, 0.69, 0.02);
  const green = resolveMaterial(kit.green, 0x415d50, 0.67, 0.08);
  const dark = resolveMaterial(kit.dark, 0x1c2926, 0.52, 0.18);
  const ink = localMaterial({ color: 0x151917, roughness: 0.58, metalness: 0.08 });
  const paper = localMaterial({ color: 0xefe7d4, roughness: 0.94, metalness: 0 });
  const paperEdge = localMaterial({ color: 0xcabf9f, roughness: 0.9, metalness: 0 });
  const shellPaper = localMaterial({
    color: 0xeee5d1,
    roughness: 0.88,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
  const roofPaper = localMaterial({
    color: 0xe5d9bf,
    roughness: 0.9,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
  const structureMetal = localMaterial({
    color: 0x352923,
    roughness: 0.38,
    metalness: 0.62,
  });
  const gilt = localMaterial({ color: 0xc69c55, roughness: 0.24, metalness: 0.78 });
  const glass = localMaterial({
    color: 0xbed8ce,
    roughness: 0.08,
    metalness: 0.03,
    transparent: true,
    opacity: 0.27,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const proxyMaterial = localMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const glowMaterial = localMaterial({
    color: 0xefc873,
    emissive: 0xd69b3d,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });

  const add = (geometry, material, x, y, z, parent = group) => {
    ownGeometry(geometry);
    const node = kit.mesh(geometry, material, x, y, z, parent);
    node.castShadow = true;
    node.receiveShadow = true;
    return node;
  };
  const addRounded = (width, height, depth, material, parent, position, radius = 0.04) => {
    const node = sculpt.rounded(width, height, depth, material, parent, position, radius);
    ownGeometry(node?.geometry);
    if (node) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
    return node;
  };
  const addRing = (radius, thickness, material, parent, position, arc = Math.PI * 2) => {
    const node = sculpt.ring(radius, thickness, material, parent, position, arc);
    ownGeometry(node?.geometry);
    if (node) node.castShadow = true;
    return node;
  };
  const addGear = (radius, depth, teeth, material, parent, position) => {
    const node = sculpt.gear(radius, depth, teeth, material, parent, position);
    ownGeometry(node?.geometry);
    if (node) node.castShadow = true;
    return node;
  };
  const addTube = (points, radius, material, parent, segments = 48, sides = 8) => {
    const node = sculpt.tube(points, radius, material, parent, segments, sides);
    ownGeometry(node?.geometry);
    if (node) node.castShadow = true;
    return node;
  };
  const addSurface = (fn, uSegments, vSegments, material, parent) => {
    const node = sculpt.surface(fn, uSegments, vSegments, material, parent);
    ownGeometry(node?.geometry);
    if (node) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
    return node;
  };
  const addInstances = (geometry, material, placements, parent) => {
    ownGeometry(geometry);
    const node = sculpt.instances(geometry, material, placements, parent);
    if (node) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
    return node;
  };
  const addText = (value, width, height, parent, position, rotation, options = {}) => {
    if (!value) return null;
    const node = sculpt.text(value, width, height, parent, {
      background: options.background ?? null,
      color: options.color || "#d8bd82",
      fontSize: options.fontSize || 44,
      padding: options.padding ?? 0.04,
      align: options.align || "center",
      serif: options.serif ?? true,
    });
    if (!node) return null;
    node.position.set(...position);
    if (rotation) node.rotation.set(...rotation);
    ownGeometry(node.geometry);
    return node;
  };
  const register = (object, spec) => {
    if (object && typeof kit.register === "function") kit.register(object, spec);
    return object;
  };
  const status = (message) => {
    if (typeof kit.status === "function") kit.status(message);
  };
  const invalidate = () => {
    if (typeof kit.invalidate === "function") kit.invalidate();
  };
  const clamp = THREE.MathUtils.clamp;
  const damp = THREE.MathUtils.damp;

  const titleCanvas = document.createElement("canvas");
  const proseCanvas = document.createElement("canvas");
  titleCanvas.width = proseCanvas.width = 1024;
  titleCanvas.height = proseCanvas.height = 1024;
  const titleContext = titleCanvas.getContext("2d");
  const proseContext = proseCanvas.getContext("2d");
  const titleTexture = ownTexture(new THREE.CanvasTexture(titleCanvas));
  const proseTexture = ownTexture(new THREE.CanvasTexture(proseCanvas));
  titleTexture.colorSpace = proseTexture.colorSpace = THREE.SRGBColorSpace;
  titleTexture.anisotropy = proseTexture.anisotropy = 4;
  const titlePageMaterial = localMaterial({
    color: 0xffffff,
    map: titleTexture,
    roughness: 0.91,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const prosePageMaterial = localMaterial({
    color: 0xffffff,
    map: proseTexture,
    roughness: 0.91,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const turningPageMaterial = localMaterial({
    color: 0xffffff,
    map: proseTexture,
    roughness: 0.9,
    metalness: 0,
    side: THREE.FrontSide,
  });
  const turningBackMaterial = localMaterial({
    color: 0xeee5d0,
    roughness: 0.94,
    metalness: 0,
    side: THREE.BackSide,
  });

  const state = {
    selected: items.length ? 0 : -1,
    opening: 0.74,
    pageTurn: 0.88,
    extension: 0.18,
  };
  let visualOpening = state.opening;
  let visualPageTurn = state.pageTurn;
  let visualExtension = state.extension;
  let pageDragging = false;
  let extensionDragging = false;
  let crankDragging = false;
  let crankAngle = 0;
  let crankAccumulator = 0;
  let selectionKick = 0;
  let activeNow = false;

  function bookTitle(item) {
    return String(item?.title || item?.spine || item?.id || "未题名");
  }
  function bookAuthor(item) {
    return String(item?.author || item?.meta || "佚名");
  }
  function bookBlurb(item) {
    return String(item?.description || item?.blurb || item?.originalFields?.blurb || "书页仍在等待这一段文字的注解。");
  }
  function bookCode(item, index) {
    return String(item?.originalFields?.number || index + 1).padStart(2, "0");
  }
  function font(serif, size, weight = "400") {
    const family = serif
      ? 'Georgia, "Songti SC", "Noto Serif CJK SC", "Microsoft YaHei", serif'
      : '"Space Grotesk", "Helvetica Neue", Arial, "Microsoft YaHei", sans-serif';
    return `${weight} ${size}px ${family}`;
  }
  function wrapText(context, text, maxWidth) {
    const source = String(text || "").replace(/\s+/g, " ").trim();
    const tokens = /[\u3400-\u9fff]/.test(source)
      ? Array.from(source)
      : source.split(/(\s+)/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const token of tokens) {
      const candidate = line + token;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line.trim());
        line = token.trimStart();
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line.trim());
    return lines;
  }
  function fitText(context, text, maxWidth, maxSize, minSize, serif, weight) {
    let size = maxSize;
    while (size > minSize) {
      context.font = font(serif, size, weight);
      if (context.measureText(String(text)).width <= maxWidth) break;
      size -= 4;
    }
    return size;
  }
  function paperGround(context, code, side) {
    context.fillStyle = "#eee5cf";
    context.fillRect(0, 0, 1024, 1024);
    const gradient = context.createLinearGradient(0, 0, 1024, 1024);
    gradient.addColorStop(0, "rgba(255,251,238,0.62)");
    gradient.addColorStop(0.55, "rgba(216,201,169,0.1)");
    gradient.addColorStop(1, "rgba(126,105,72,0.15)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1024, 1024);
    context.save();
    context.globalAlpha = 0.11;
    context.strokeStyle = "#765f3f";
    context.lineWidth = 1;
    for (let index = 0; index < 120; index += 1) {
      const y = (index * 67 + code.length * 19) % 1024;
      const x = (index * 131) % 1024;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 75 + (index % 5) * 24, y + ((index % 3) - 1) * 2);
      context.stroke();
    }
    context.restore();
    context.strokeStyle = "rgba(91,73,48,0.25)";
    context.lineWidth = 2;
    context.strokeRect(54, 54, 916, 916);
    context.fillStyle = "#806b4c";
    context.textAlign = side === "left" ? "left" : "right";
    context.font = font(false, 24, "600");
    context.fillText(`N1GHT CHXN9 / ${code}`, side === "left" ? 78 : 946, 118);
  }
  function drawBookPages(item, index) {
    const title = bookTitle(item);
    const author = bookAuthor(item);
    const blurb = bookBlurb(item);
    const code = bookCode(item, index);

    paperGround(titleContext, code, "left");
    titleContext.fillStyle = "#27312c";
    titleContext.textAlign = "left";
    titleContext.font = font(true, 88, "600");
    titleContext.fillText("OPEN FOLIO", 88, 225);
    const titleSize = fitText(titleContext, title, 760, 176, 78, true, "600");
    titleContext.font = font(true, titleSize, "600");
    titleContext.fillText(title, 88, 470, 820);
    titleContext.fillStyle = "#6f5534";
    titleContext.font = font(false, 30, "500");
    titleContext.fillText(item?.spine || title, 92, 534, 800);
    titleContext.fillStyle = "#40564b";
    titleContext.font = font(true, 54, "500");
    titleContext.fillText(author, 92, 642, 760);
    titleContext.strokeStyle = "rgba(110,83,48,0.58)";
    titleContext.lineWidth = 3;
    titleContext.beginPath();
    titleContext.moveTo(92, 700);
    titleContext.bezierCurveTo(346, 678, 590, 726, 872, 692);
    titleContext.stroke();
    titleContext.fillStyle = "#8b7a62";
    titleContext.font = font(false, 25, "500");
    titleContext.fillText("A FLOATING VOLUME IN THE ENDLESS LIBRARY", 92, 794);
    titleContext.textAlign = "right";
    titleContext.fillText(code, 932, 900);
    titleTexture.needsUpdate = true;

    paperGround(proseContext, code, "right");
    proseContext.fillStyle = "#2b312d";
    proseContext.textAlign = "left";
    proseContext.font = font(false, 26, "600");
    proseContext.fillText("A NOTE FROM THE SHELF", 84, 205);
    proseContext.fillStyle = "#695134";
    proseContext.font = font(true, 62, "500");
    proseContext.fillText(title, 84, 304, 820);
    proseContext.fillStyle = "#4e514a";
    proseContext.font = font(true, 41, "400");
    const lines = wrapText(proseContext, blurb, 820);
    const maxLines = 11;
    lines.slice(0, maxLines).forEach((line, lineIndex) => {
      proseContext.fillText(line, 84, 405 + lineIndex * 62);
    });
    if (lines.length > maxLines) {
      proseContext.fillText("…", 84, 405 + maxLines * 62);
    }
    proseContext.fillStyle = "#7c674b";
    proseContext.font = font(false, 28, "600");
    proseContext.fillText(author.toUpperCase(), 84, 858);
    proseContext.textAlign = "right";
    proseContext.fillStyle = "#9b876a";
    proseContext.font = font(true, 34, "500");
    proseContext.fillText(code, 940, 920);
    proseTexture.needsUpdate = true;
  }

  function polygonSlabGeometry(points, thickness, bevel = 0.035) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index += 1) {
      shape.lineTo(points[index][0], points[index][1]);
    }
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      steps: 1,
      curveSegments: 4,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: bevel,
      bevelThickness: bevel,
    });
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, thickness, 0);
    geometry.computeVertexNormals();
    return ownGeometry(geometry);
  }

  const strata = new THREE.Group();
  strata.name = "split-library-strata";
  group.add(strata);
  const strataData = [
    {
      points: [[-4.2, -1.2], [-0.7, -1.55], [0.46, -0.36], [-0.42, 1.1], [-3.6, 1.28], [-4.75, 0.12]],
      y: 0.04,
      material: stone,
    },
    {
      points: [[-0.2, -1.3], [3.85, -1.62], [4.62, -0.15], [3.12, 0.98], [0.78, 0.52]],
      y: 0.15,
      material: cream,
    },
    {
      points: [[-1.25, 1.08], [1.28, 0.74], [2.22, 1.72], [0.42, 2.32], [-1.67, 1.94]],
      y: 0.11,
      material: green,
    },
  ];
  strataData.forEach((entry) => {
    add(polygonSlabGeometry(entry.points, 0.16), entry.material, 0, entry.y, 0, strata);
  });

  const baseFasteners = [];
  strataData.forEach((entry, layer) => {
    entry.points.forEach(([x, z], index) => {
      if ((index + layer) % 2) return;
      baseFasteners.push({
        position: [x * 0.82, entry.y + 0.2, z * 0.82],
        rotation: [0, 0, 0],
        scale: [0.09, 0.055, 0.09],
      });
    });
  });
  addInstances(new THREE.CylinderGeometry(1, 1, 1, 10), brass, baseFasteners, strata);

  const lowerRack = new THREE.Group();
  lowerRack.name = "lower-script-fans";
  lowerRack.position.set(-0.62, 1.1, -0.62);
  lowerRack.rotation.y = 0.19;
  group.add(lowerRack);
  const upperRack = new THREE.Group();
  upperRack.name = "upper-script-fans";
  upperRack.position.set(-0.15, 4.24, -3.83);
  upperRack.rotation.y = -0.41;
  group.add(upperRack);

  function fanPoint(center, inner, outer, start, length, y, u, v) {
    const angle = start + length * u;
    const radius = inner + (outer - inner) * v;
    const lift = Math.sin(u * Math.PI) * 0.09 + Math.sin(v * Math.PI) * 0.055;
    return [
      center[0] + Math.cos(angle) * radius,
      y + lift - v * 0.035,
      center[1] + Math.sin(angle) * radius,
    ];
  }

  function addFanShelf(parent, spec, index) {
    const shelf = addSurface(
      (u, v) => fanPoint(spec.center, spec.inner, spec.outer, spec.start, spec.length, spec.y, u, v),
      30,
      10,
      index % 2 ? walnut : cream,
      parent,
    );
    shelf.material.side = THREE.DoubleSide;
    const outerPoints = [];
    for (let step = 0; step <= 18; step += 1) {
      const point = fanPoint(spec.center, spec.inner, spec.outer, spec.start, spec.length, spec.y + 0.035, step / 18, 0.98);
      outerPoints.push(point);
    }
    addTube(outerPoints, index % 2 ? 0.018 : 0.025, index % 2 ? structureMetal : walnut, parent, 42, 6);
    for (let rib = 0; rib <= 3; rib += 1) {
      const u = rib / 3;
      const innerPoint = fanPoint(spec.center, spec.inner, spec.outer, spec.start, spec.length, spec.y + 0.03, u, 0.06);
      const outerPoint = fanPoint(spec.center, spec.inner, spec.outer, spec.start, spec.length, spec.y + 0.03, u, 0.96);
      addTube([innerPoint, outerPoint], rib === 2 ? 0.012 : 0.007, structureMetal, parent, 8, 5);
    }
    return shelf;
  }

  const rackFanSpecs = [
    { center: [-1.46, 0.02], inner: 0.22, outer: 1.38, start: -2.55, length: 1.36, y: 0.04 },
    { center: [1.28, -0.46], inner: 0.24, outer: 1.24, start: 0.24, length: 1.46, y: 0.12 },
  ];
  rackFanSpecs.forEach((spec, index) => addFanShelf(lowerRack, spec, index));
  rackFanSpecs.forEach((spec, index) => {
    addFanShelf(
      upperRack,
      {
        ...spec,
        center: [spec.center[0] * 0.84 - 0.12, spec.center[1] * 0.78 - 0.22],
        outer: spec.outer * 0.82,
        start: spec.start + 0.3,
        y: spec.y + 0.03,
      },
      index + 2,
    );
  });

  const coverMaterialCache = new Map();
  const foilMaterialCache = new Map();
  function bookCoverMaterial(item) {
    const color = item?.originalFields?.cloth || item?.cloth || "#445b52";
    if (!coverMaterialCache.has(color)) {
      coverMaterialCache.set(color, resolveMaterial(color, 0x445b52, 0.88, 0.01));
    }
    return coverMaterialCache.get(color);
  }
  function bookFoilMaterial(item) {
    const color = item?.originalFields?.band || item?.band || 0xc49a55;
    if (!foilMaterialCache.has(color)) {
      foilMaterialCache.set(color, resolveMaterial(color, 0xc49a55, 0.3, 0.54));
    }
    return foilMaterialCache.get(color);
  }

  const books = [];
  const bookLookup = new Map();
  const rackPagePlacements = { lower: [], upper: [] };
  function createBook(item, index, parent, position, rotation, rackName) {
    const source = item?.originalFields || item || {};
    const width = clamp(Number(source.thickness || 30) * 0.0082, 0.23, 0.38);
    const height = clamp(Number(source.height || 260) * 0.00385, 0.92, 1.14);
    const depth = 0.43 + (index % 4) * 0.018;
    const cover = bookCoverMaterial(item);
    const foil = bookFoilMaterial(item);
    const root = new THREE.Group();
    root.name = `book-${item?.id || index}`;
    root.position.set(...position);
    root.rotation.set(...rotation);
    parent.add(root);

    addRounded(width, height, 0.045, cover, root, [0, height / 2, depth / 2], 0.022);
    addRounded(width, height, 0.045, cover, root, [0, height / 2, -depth / 2], 0.022);
    addRounded(0.075, height - 0.025, depth, cover, root, [-width / 2 + 0.028, height / 2, 0], 0.02);
    addRounded(width * 0.82, height * 0.9, depth * 0.88, paperEdge, root, [0.035, height / 2, 0], 0.025);
    addRounded(width * 0.77, height * 0.86, depth * 0.9, paper, root, [0.045, height / 2, 0], 0.02);
    addRounded(width + 0.018, 0.03, depth + 0.03, foil, root, [0, height - 0.08, 0], 0.012);
    addRounded(width + 0.018, 0.022, depth + 0.03, foil, root, [0, 0.075, 0], 0.011);
    addRounded(width + 0.016, 0.018, depth + 0.025, foil, root, [0, height * 0.68, 0], 0.01);

    for (let cord = 0; cord < 3; cord += 1) {
      addRounded(0.06, 0.018, depth * 0.82, copper, root, [-width / 2 + 0.012, height * (0.2 + cord * 0.28), 0], 0.006);
    }
    add(new THREE.CylinderGeometry(0.035, 0.035, width * 0.7, 10), foil, 0.02, height - 0.01, 0, root).rotation.z = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.035, 0.035, width * 0.7, 10), foil, 0.02, 0.02, 0, root).rotation.z = Math.PI / 2;
    addRounded(0.055, height * 0.66, 0.012, foil, root, [width * 0.28, height * 0.48, depth / 2 + 0.032], 0.007);

    addText(
      bookTitle(item).slice(0, 12),
      width * 0.78,
      height * 0.16,
      root,
      [0.035, height * 0.64, depth / 2 + 0.034],
      [0, 0, 0],
      { fontSize: 34, color: source.ink || "#f1e8d7", serif: true },
    );
    addText(
      bookAuthor(item).slice(0, 16),
      width * 0.7,
      height * 0.07,
      root,
      [0.035, height * 0.49, depth / 2 + 0.034],
      [0, 0, 0],
      { fontSize: 26, color: source.ink || "#f1e8d7", serif: false },
    );
    addText(
      bookTitle(item).slice(0, 9),
      height * 0.52,
      width * 0.54,
      root,
      [-width / 2 - 0.039, height * 0.47, 0],
      [0, -Math.PI / 2, Math.PI / 2],
      { fontSize: 30, color: source.ink || "#f1e8d7", serif: true },
    );
    addText(
      bookCode(item, index),
      0.2,
      0.08,
      root,
      [0.06, height * 0.13, depth / 2 + 0.035],
      [0, 0, 0],
      { fontSize: 28, color: source.band || "#d3ae68", serif: false },
    );

    const highlight = addRounded(
      width + 0.1,
      height + 0.12,
      0.018,
      glowMaterial,
      root,
      [0, height / 2, -depth / 2 - 0.04],
      0.03,
    );
    highlight.material = glowMaterial.clone();
    ownMaterial(highlight.material);
    highlight.material.opacity = 0;
    highlight.material.emissiveIntensity = 1.6;
    highlight.material.depthWrite = false;

    for (let sheet = 0; sheet < 7; sheet += 1) {
      rackPagePlacements[rackName].push({
        position: [
          position[0] + 0.04,
          position[1] + height * (0.08 + sheet * 0.112),
          position[2] + ((sheet % 3) - 1) * 0.055,
        ],
        rotation: [rotation[0], rotation[1], rotation[2]],
        scale: [width * 0.82, 0.008, depth * 0.9],
      });
    }
    const entry = { root, highlight, item, index, height, width, depth, rackName };
    books.push(entry);
    bookLookup.set(index, entry);
    return entry;
  }

  const lowerItems = items.slice(0, 8);
  const upperItems = items.slice(8, 16);
  const bookClusterSpecs = [
    { center: [-1.46, 0.02], radius: 1.08, start: -2.34, step: 0.36, y: 0.18, depthSwing: 0.12 },
    { center: [1.28, -0.46], radius: 0.98, start: 0.43, step: 0.34, y: 0.25, depthSwing: -0.1 },
  ];
  function placeBookCluster(bookItems, startIndex, parent, rackName, scale = 1) {
    bookItems.forEach((item, localIndex) => {
      const cluster = bookClusterSpecs[localIndex < 4 ? 0 : 1];
      const within = localIndex % 4;
      const angle = cluster.start + within * cluster.step;
      const radius = cluster.radius + Math.sin(within * 1.2) * 0.11 * scale;
      const position = [
        (cluster.center[0] + Math.cos(angle) * radius) * scale,
        cluster.y + within * 0.075 + Math.sin(within * 1.5) * 0.06,
        (cluster.center[1] + Math.sin(angle) * radius + Math.cos(within * 1.8) * cluster.depthSwing) * scale,
      ];
      const rotation = [
        -0.025 + Math.sin(within * 1.1) * 0.045,
        -Math.PI * 0.5 - angle + Math.sin(within * 0.8) * 0.12,
        0.018 * ((within % 2) ? 1 : -1),
      ];
      createBook(item, startIndex + localIndex, parent, position, rotation, rackName);
    });
  }
  placeBookCluster(lowerItems, 0, lowerRack, "lower", 1);
  placeBookCluster(upperItems, 8, upperRack, "upper", 0.83);
  addInstances(
    new THREE.BoxGeometry(1, 1, 1),
    paperEdge,
    rackPagePlacements.lower,
    lowerRack,
  );
  addInstances(
    new THREE.BoxGeometry(1, 1, 1),
    paperEdge,
    rackPagePlacements.upper,
    upperRack,
  );

  const lowerFanFasteners = [];
  const upperFanFasteners = [];
  rackFanSpecs.forEach((spec, shelfIndex) => {
    for (let index = 0; index < 7; index += 1) {
      const point = fanPoint(spec.center, spec.inner, spec.outer, spec.start, spec.length, spec.y + 0.06, index / 6, 0.91);
      lowerFanFasteners.push({
        position: point,
        rotation: [0, 0, 0],
        scale: [0.038, 0.012, 0.038],
      });
      const upperPoint = fanPoint(
        [spec.center[0] * 0.84 - 0.12, spec.center[1] * 0.78 - 0.22],
        spec.inner,
        spec.outer * 0.82,
        spec.start + 0.3,
        spec.length,
        spec.y + 0.09,
        index / 6,
        0.91,
      );
      upperFanFasteners.push({
        position: upperPoint,
        rotation: [0, 0, 0],
        scale: [0.026, 0.01, 0.026],
      });
    }
  });
  addInstances(new THREE.CylinderGeometry(1, 1, 1, 8), structureMetal, lowerFanFasteners, lowerRack);
  addInstances(new THREE.CylinderGeometry(1, 1, 1, 8), structureMetal, upperFanFasteners, upperRack);

  const shelfHandle = new THREE.Group();
  shelfHandle.name = "front-left-spine-rail-handle";
  shelfHandle.position.set(-1.85, 0.15, 1.48);
  shelfHandle.rotation.y = -0.08;
  lowerRack.add(shelfHandle);
  addRounded(1.7, 0.1, 0.16, walnut, shelfHandle, [0, -0.19, 0], 0.035);
  addRounded(0.68, 0.24, 0.2, cream, shelfHandle, [0, 0, 0.06], 0.065);
  for (const x of [-0.52, -0.26, 0.26, 0.52]) {
    addRounded(0.045, 0.1, 0.22, brass, shelfHandle, [x, 0.07, 0.02], 0.012);
  }
  addText(
    "PULL",
    0.3,
    0.075,
    shelfHandle,
    [0, 0, 0.177],
    null,
    { fontSize: 28, color: "#5e4930", serif: false },
  );
  const shelfProxy = add(new THREE.BoxGeometry(1.95, 0.55, 0.46), proxyMaterial, 0, -0.04, 0.06, shelfHandle);

  const shelfReadoutCanvas = document.createElement("canvas");
  shelfReadoutCanvas.width = 384;
  shelfReadoutCanvas.height = 72;
  const shelfReadoutContext = shelfReadoutCanvas.getContext("2d");
  const shelfReadoutTexture = ownTexture(new THREE.CanvasTexture(shelfReadoutCanvas));
  shelfReadoutTexture.colorSpace = THREE.SRGBColorSpace;
  const shelfReadoutMaterial = ownMaterial(
    new THREE.MeshBasicMaterial({
      map: shelfReadoutTexture,
      transparent: true,
      toneMapped: false,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  const shelfReadout = add(new THREE.PlaneGeometry(0.78, 0.14), shelfReadoutMaterial, 0, -0.36, 0.03, shelfHandle);
  shelfReadout.castShadow = false;

  const towerCity = new THREE.Group();
  towerCity.name = "twin-oblique-reading-towers";
  group.add(towerCity);
  const readingTowerLevels = [];
  const bookSpineTextureGeometry = new THREE.BoxGeometry(1, 1, 1);
  ownGeometry(bookSpineTextureGeometry);

  function createReadingTower(spec) {
    const root = new THREE.Group();
    root.name = spec.name;
    root.position.set(...spec.position);
    root.rotation.set(spec.tiltX || 0, spec.rotationY, spec.tiltZ || 0);
    root.scale.setScalar(spec.scale || 1);
    towerCity.add(root);

    for (let strand = 0; strand < 3; strand += 1) {
      const points = [];
      for (let step = 0; step <= 8; step += 1) {
        const p = step / 8;
        const angle = spec.phase + p * Math.PI * (1.15 + strand * 0.2) + strand * 2.1;
        points.push([
          Math.cos(angle) * (0.13 + p * 0.06),
          0.18 + p * 5.9,
          Math.sin(angle) * (0.12 + p * 0.05),
        ]);
      }
      addTube(points, strand === 1 ? 0.022 : 0.014, strand === 1 ? structureMetal : dark, root, 66, 6);
    }

    const levels = [];
    for (let level = 0; level < 5; level += 1) {
      const groupLevel = new THREE.Group();
      const baseY = 0.62 + level * 1.02;
      const levelTurn = spec.turn * level;
      groupLevel.position.set(0, baseY, 0);
      groupLevel.rotation.y = spec.phase + levelTurn;
      root.add(groupLevel);

      const reach = 0.78 + level * 0.075;
      addSurface(
        (u, v) => {
          const angle = -1.08 + u * 1.96;
          const radius = 0.18 + v * reach;
          return [
            Math.cos(angle) * radius,
            Math.sin(u * Math.PI) * 0.06 - v * 0.035,
            Math.sin(angle) * radius,
          ];
        },
        24,
        8,
        level % 2 ? cream : walnut,
        groupLevel,
      );
      const rail = [];
      for (let step = 0; step <= 15; step += 1) {
        const angle = -1.08 + (step / 15) * 1.96;
        rail.push([Math.cos(angle) * reach, 0.03, Math.sin(angle) * reach]);
      }
      addTube(rail, level === 4 ? 0.018 : 0.012, level === 2 ? brass : structureMetal, groupLevel, 34, 5);

      const spines = [];
      for (let spine = 0; spine < 8; spine += 1) {
        const angle = -0.92 + (spine / 7) * 1.62;
        const radius = reach * (0.6 + (spine % 2) * 0.018);
        spines.push({
          position: [Math.cos(angle) * radius, 0.19, Math.sin(angle) * radius],
          rotation: [0, -angle - Math.PI * 0.5, 0],
          scale: [0.07 + (spine % 3) * 0.012, 0.36 + (spine % 4) * 0.045, 0.16],
        });
      }
      addInstances(bookSpineTextureGeometry, level % 2 ? dark : green, spines, groupLevel);
      levels.push({
        group: groupLevel,
        baseY,
        baseTurn: spec.phase + levelTurn,
        reach,
      });
      readingTowerLevels.push({
        group: groupLevel,
        baseY,
        baseTurn: spec.phase + levelTurn,
        tower: root,
        level,
        direction: level % 2 ? 1 : -1,
      });
    }

    addSurface(
      (u, v) => {
        const angle = -0.78 + u * 1.42;
        const radius = 0.18 + v * 0.95;
        return [
          Math.cos(angle) * radius,
          6.15 + Math.sin(u * Math.PI) * 0.32 + v * 0.42,
          Math.sin(angle) * radius,
        ];
      },
      20,
      7,
      roofPaper,
      root,
    );
    addTube(
      [
        [0.02, 6.22, 0.02],
        [0, 6.68, 0],
        [-0.025, 6.82, -0.02],
      ],
      0.018,
      structureMetal,
      root,
      18,
      6,
    );
    return { root, levels, spec };
  }

  const readingTowerA = createReadingTower({
    name: "west-oblique-reading-tower",
    position: [-3.78, 0.34, -2.9],
    rotationY: 0.58,
    tiltX: 0.035,
    tiltZ: -0.055,
    turn: 0.27,
    phase: 0.35,
    scale: 0.88,
  });
  const readingTowerB = createReadingTower({
    name: "east-oblique-reading-tower",
    position: [3.82, 0.26, -3.15],
    rotationY: -0.78,
    tiltX: -0.04,
    tiltZ: 0.06,
    turn: -0.23,
    phase: 2.18,
    scale: 0.84,
  });

  const bookRoot = new THREE.Group();
  bookRoot.name = "giant-curved-folio";
  bookRoot.position.set(0.12, 3.22, 0.24);
  bookRoot.rotation.set(-0.11, 0.045, -0.018);
  group.add(bookRoot);

  const pageWidth = 3.14;
  const pageDepth = 4.08;
  function openPagePoint(side) {
    return (u, v) => {
      const edge = u * pageWidth;
      const x = side * edge + side * 0.045 * Math.sin(v * Math.PI) * u;
      const y = 0.035 + Math.sin(u * Math.PI * 0.68) * 0.25 - edge * 0.047 + Math.sin(v * Math.PI) * 0.04 * u;
      const z = (v - 0.5) * pageDepth + Math.sin(u * Math.PI) * 0.1 * (v - 0.5);
      return [x, y, z];
    };
  }
  addSurface(openPagePoint(-1), 42, 28, titlePageMaterial, bookRoot);
  addSurface(openPagePoint(1), 42, 28, prosePageMaterial, bookRoot);

  const coverPoint = (side) => (u, v) => {
    const edge = u * (pageWidth + 0.22);
    return [
      side * edge,
      -0.11 + Math.sin(u * Math.PI * 0.7) * 0.16 - edge * 0.045,
      (v - 0.5) * (pageDepth + 0.28),
    ];
  };
  addSurface(coverPoint(-1), 36, 22, walnut, bookRoot);
  addSurface(coverPoint(1), 36, 22, walnut, bookRoot);
  addTube(
    [
      [0, 0.16, -pageDepth * 0.54],
      [0, 0.12, 0],
      [0, 0.16, pageDepth * 0.54],
    ],
    0.115,
    dark,
    bookRoot,
    48,
    12,
  );
  for (let band = 0; band < 4; band += 1) {
    addRing(0.118, 0.022, brass, bookRoot, [0, 0.12, -1.36 + band * 0.9]);
  }

  const pageFanPlacements = [];
  for (let sheet = 0; sheet < 24; sheet += 1) {
    const side = sheet < 12 ? -1 : 1;
    const layer = sheet % 12;
    const x = side * (0.42 + (layer % 4) * 0.52);
    pageFanPlacements.push({
      position: [x, -0.075 - layer * 0.012, -0.92 + Math.floor(layer / 4) * 0.9],
      rotation: [0, side * 0.023, side * (-0.035 - layer * 0.002)],
      scale: [1.02, 0.012, 0.84],
    });
  }
  const pageFanMesh = addInstances(new THREE.BoxGeometry(1, 1, 1), paperEdge, pageFanPlacements, bookRoot);
  const pageFanDummy = new THREE.Object3D();

  const turnGeometry = new THREE.BufferGeometry();
  const turnUSegments = 40;
  const turnVSegments = 30;
  const turnVertexCount = (turnUSegments + 1) * (turnVSegments + 1);
  const turnPositions = new Float32Array(turnVertexCount * 3);
  const turnUVs = new Float32Array(turnVertexCount * 2);
  const turnIndices = [];
  for (let iu = 0; iu <= turnUSegments; iu += 1) {
    for (let iv = 0; iv <= turnVSegments; iv += 1) {
      const vertex = iu * (turnVSegments + 1) + iv;
      turnUVs[vertex * 2] = iu / turnUSegments;
      turnUVs[vertex * 2 + 1] = 1 - iv / turnVSegments;
      if (iu < turnUSegments && iv < turnVSegments) {
        const a = vertex;
        const b = vertex + turnVSegments + 1;
        const c = vertex + 1;
        const d = b + 1;
        turnIndices.push(a, c, b, c, d, b);
      }
    }
  }
  turnGeometry.setAttribute("position", new THREE.BufferAttribute(turnPositions, 3));
  turnGeometry.setAttribute("uv", new THREE.BufferAttribute(turnUVs, 2));
  turnGeometry.setIndex(turnIndices);
  ownGeometry(turnGeometry);

  function updateTurnGeometry(progress) {
    const position = turnGeometry.attributes.position;
    const p = clamp(progress, 0, 1);
    const angleBase = p * Math.PI;
    const curl = Math.sin(p * Math.PI) * 0.92;
    for (let iu = 0; iu <= turnUSegments; iu += 1) {
      const u = iu / turnUSegments;
      for (let iv = 0; iv <= turnVSegments; iv += 1) {
        const v = iv / turnVSegments;
        const curlAcross = Math.sin(u * Math.PI * 1.05) * curl * (0.34 + 0.66 * Math.sin(v * Math.PI));
        const angle = angleBase + curlAcross;
        const radius = u * pageWidth;
        const x = radius * Math.cos(angle);
        const y = 0.045 + radius * Math.sin(angle) - u * (1 - p) * 0.055 + Math.sin(v * Math.PI) * 0.035 * u;
        const z =
          (v - 0.5) * pageDepth +
          Math.sin(u * Math.PI) * 0.08 * Math.sin(p * Math.PI) * (0.4 + Math.abs(v - 0.5)) +
          Math.sin(u * Math.PI) * 0.07 * (v - 0.5);
        const vertex = iu * (turnVSegments + 1) + iv;
        position.setXYZ(vertex, x, y, z);
      }
    }
    position.needsUpdate = true;
    turnGeometry.computeVertexNormals();
    turnGeometry.computeBoundingSphere();
  }
  updateTurnGeometry(visualPageTurn);

  function currentTurnPageAnchor(lift = 0.09) {
    const iu = Math.round(0.45 * turnUSegments);
    const iv = Math.round(0.65 * turnVSegments);
    const vertex = iu * (turnVSegments + 1) + iv;
    const position = new THREE.Vector3().fromBufferAttribute(turnGeometry.attributes.position, vertex);
    const normal = new THREE.Vector3()
      .fromBufferAttribute(turnGeometry.attributes.normal, vertex)
      .normalize();
    if (normal.y < 0) normal.negate();
    return position.addScaledVector(normal, lift);
  }

  const turningPage = kit.mesh(turnGeometry, turningPageMaterial, 0, 0, 0, bookRoot);
  const turningBack = kit.mesh(turnGeometry, turningBackMaterial, 0, 0, 0, bookRoot);
  turningPage.castShadow = turningBack.castShadow = true;
  turningPage.receiveShadow = turningBack.receiveShadow = true;

  const pageCorner = new THREE.Group();
  pageCorner.name = "page-corner-handle";
  bookRoot.add(pageCorner);
  addRounded(0.32, 0.1, 0.24, gilt, pageCorner, [0, 0.06, 0], 0.04);
  addRing(0.08, 0.02, brass, pageCorner, [0, 0.08, 0.106]);
  addText("↖", 0.16, 0.11, pageCorner, [0, 0.07, 0.142], null, {
    fontSize: 34,
    color: "#4e3c25",
    serif: false,
  });
  const pageProxy = add(new THREE.BoxGeometry(0.64, 0.46, 0.4), proxyMaterial, 0, 0.05, 0, pageCorner);

  function updateCorner() {
    const angle = visualPageTurn * Math.PI;
    const radius = pageWidth * 0.88;
    pageCorner.position.set(
      radius * Math.cos(angle) + 0.05,
      0.17 + radius * Math.sin(angle),
      pageDepth * 0.43,
    );
    pageCorner.rotation.set(-0.18, 0, -angle * 0.25);
  }
  updateCorner();

  const shellField = new THREE.Group();
  shellField.name = "folded-paper-vaults";
  group.add(shellField);
  const foldedShells = [];
  const shellSpecs = [
    { position: [-4.16, 0.78, -3.5], rotation: [-0.08, -0.96, 0.07], width: 2.55, height: 4.55, depth: 1.18, fold: 0.38, lift: 0.28 },
    { position: [-2.72, 1.05, -3.9], rotation: [0.06, -0.38, -0.045], width: 2.78, height: 5.35, depth: 1.34, fold: 0.48, lift: 0.34 },
    { position: [0.08, 1.12, -3.56], rotation: [0.02, 0.08, 0.025], width: 3.0, height: 6.05, depth: 1.46, fold: 0.55, lift: 0.38 },
    { position: [2.84, 0.94, -3.6], rotation: [-0.055, 0.54, -0.04], width: 2.68, height: 5.12, depth: 1.28, fold: 0.42, lift: 0.3 },
    { position: [4.0, 0.72, -3.92], rotation: [0.075, 1.02, 0.06], width: 2.36, height: 4.1, depth: 1.06, fold: 0.34, lift: 0.24 },
  ];
  function shellPoint(spec, u, v, offset = 0) {
    const taper = 1 - v * 0.24;
    const fold = Math.abs(u - 0.5) * spec.fold * v;
    return [
      (u - 0.5) * spec.width * taper + Math.sin(v * Math.PI) * 0.08,
      v * spec.height + Math.sin(v * Math.PI) * spec.lift,
      -v * spec.depth + fold + Math.sin(u * Math.PI) * 0.18 + offset,
    ];
  }
  shellSpecs.forEach((spec, index) => {
    const shell = new THREE.Group();
    shell.name = `folded-shell-${index + 1}`;
    shell.position.set(...spec.position);
    shell.rotation.set(...spec.rotation);
    shellField.add(shell);
    const surface = addSurface(
      (u, v) => shellPoint(spec, u, v),
      30,
      26,
      index === 2 ? shellPaper : roofPaper,
      shell,
    );
    surface.material.side = THREE.DoubleSide;
    for (const u of [0, 0.25, 0.5, 0.75, 1]) {
      const points = [];
      for (let step = 0; step <= 16; step += 1) {
        points.push(shellPoint(spec, u, step / 16, 0.025));
      }
      addTube(
        points,
        u === 0.5 ? 0.027 : u === 0 || u === 1 ? 0.019 : 0.011,
        u === 0.5 ? structureMetal : walnut,
        shell,
        38,
        6,
      );
    }
    const foldLine = [];
    for (let step = 0; step <= 18; step += 1) {
      const u = step / 18;
      foldLine.push(shellPoint(spec, u, 0.91, 0.055));
    }
    addTube(foldLine, 0.014, index % 2 ? brass : structureMetal, shell, 42, 6);
    const outward = new THREE.Vector3(spec.position[0], 0, spec.position[2]).normalize();
    foldedShells.push({
      group: shell,
      basePosition: shell.position.clone(),
      baseRotation: shell.rotation.clone(),
      outward,
      phase: index * 0.8,
    });
  });

  const roofArchitecture = new THREE.Group();
  roofArchitecture.name = "page-roof-suspensions";
  group.add(roofArchitecture);
  const pageRoofs = [];
  function addRoofRibbon(start, end, width, arch, material, name) {
    const roof = new THREE.Group();
    roof.name = name;
    roofArchitecture.add(roof);
    const from = new THREE.Vector3(...start);
    const to = new THREE.Vector3(...end);
    addSurface(
      (u, v) => {
        const t = u;
        const point = from.clone().lerp(to, t);
        const sideX = (v - 0.5) * width * (1 - t * 0.18);
        const sideZ = (v - 0.5) * width * 0.18;
        return [
          point.x + sideX,
          point.y + Math.sin(t * Math.PI) * arch + Math.sin(v * Math.PI) * 0.045,
          point.z + sideZ + Math.sin(t * Math.PI) * 0.16,
        ];
      },
      32,
      8,
      material,
      roof,
    );
    for (const edge of [0, 1]) {
      const path = [];
      for (let step = 0; step <= 22; step += 1) {
        const u = step / 22;
        const point = from.clone().lerp(to, u);
        path.push([
          point.x + (edge - 0.5) * width * (1 - u * 0.18),
          point.y + Math.sin(u * Math.PI) * arch + 0.025,
          point.z + (edge - 0.5) * width * 0.18 + Math.sin(u * Math.PI) * 0.16,
        ]);
      }
      addTube(path, 0.016, edge ? walnut : structureMetal, roof, 44, 6);
    }
    pageRoofs.push({
      group: roof,
      basePosition: roof.position.clone(),
      baseRotation: roof.rotation.clone(),
      spread: name.includes("west") ? -1 : 1,
    });
    return roof;
  }
  addRoofRibbon(
    [-2.72, 3.42, 0.72],
    [-3.42, 5.48, -1.34],
    1.28,
    0.72,
    roofPaper,
    "west-page-roof",
  );
  addRoofRibbon(
    [2.62, 3.46, 0.84],
    [3.36, 5.72, -1.54],
    1.2,
    0.84,
    shellPaper,
    "east-page-roof",
  );
  addRoofRibbon(
    [-0.68, 3.82, -1.42],
    [1.92, 6.08, -2.12],
    0.82,
    0.48,
    roofPaper,
    "crown-page-roof",
  );

  const platform = new THREE.Group();
  platform.name = "unfolding-reading-platform";
  platform.position.set(2.66, 0.82, 0.2);
  group.add(platform);
  const platformLeaves = [];
  for (let leaf = 0; leaf < 3; leaf += 1) {
    const leafGroup = new THREE.Group();
    leafGroup.position.y = -0.04 + leaf * 0.03;
    leafGroup.rotation.y = -0.34 + leaf * 0.26;
    platform.add(leafGroup);
    addSurface(
      (u, v) => {
        const angle = -0.86 + u * 1.82;
        const radius = 0.2 + v * (1.34 - leaf * 0.12);
        return [
          Math.cos(angle) * radius,
          Math.sin(u * Math.PI) * 0.06 + leaf * 0.02,
          Math.sin(angle) * radius,
        ];
      },
      22,
      7,
      leaf === 1 ? cream : walnut,
      leafGroup,
    );
    platformLeaves.push(leafGroup);
  }
  for (const side of [-1, 1]) {
    addTube(
      [
        [side * 0.08, 0.03, -0.22],
        [side * 0.72, 0.32, -0.44],
        [side * 1.08, 0.32, 0.2],
        [side * 0.7, 0.03, 1.1],
      ],
      0.022,
      side < 0 ? structureMetal : walnut,
      platform,
      42,
      6,
    );
  }
  const desk = new THREE.Group();
  desk.position.set(0.1, 0.18, 0.14);
  desk.rotation.x = -0.26;
  platform.add(desk);
  addRounded(1.12, 0.08, 0.7, cream, desk, [0, 0, 0], 0.035);
  addRounded(0.7, 0.04, 0.48, titlePageMaterial, desk, [0, 0.06, 0], 0.02);
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.56, 9), brass, 0.48, 0.36, -0.2, desk);
  const deskLamp = add(new THREE.SphereGeometry(0.12, 16, 10), glowMaterial, 0.48, 0.66, -0.2, desk);
  deskLamp.material = glowMaterial.clone();
  ownMaterial(deskLamp.material);
  deskLamp.material.opacity = 0.55;

  const stairRoot = new THREE.Group();
  stairRoot.name = "helical-reading-stair";
  group.add(stairRoot);
  const stairSpecs = [];
  const stairCount = 22;
  for (let index = 0; index < stairCount; index += 1) {
    const p = index / (stairCount - 1);
    const angle = -0.62 + p * 1.62;
    const radiusX = 4.15 - Math.sin(p * Math.PI) * 0.12;
    const radiusZ = 3.42;
    const full = new THREE.Vector3(
      Math.cos(angle) * radiusX,
      0.58 + p * 5.38,
      Math.sin(angle) * radiusZ - 0.08,
    );
    const collapsed = new THREE.Vector3(
      1.05 + p * 1.32,
      0.82 + p * 1.45,
      -1.32 + p * 0.42,
    );
    stairSpecs.push({
      full,
      collapsed,
      rotation: -angle + Math.PI * 0.5,
    });
  }
  const stairProto = addRounded(0.78, 0.105, 0.42, stone, stairRoot, [0, 0, 0], 0.025);
  const stairGeometry = stairProto.geometry;
  stairProto.scale.set(0, 0, 0);
  const stairNoseGeometry = new THREE.BoxGeometry(0.68, 0.022, 0.05);
  ownGeometry(stairNoseGeometry);
  const stepGroups = stairSpecs.map((spec, index) => {
    const step = new THREE.Group();
    stairRoot.add(step);
    const tread = kit.mesh(stairGeometry, index % 4 ? stone : cream, 0, 0, 0, step);
    tread.scale.set(1, 1, 1);
    tread.castShadow = tread.receiveShadow = true;
    const nose = kit.mesh(stairNoseGeometry, brass, 0, 0.07, 0.19, step);
    nose.castShadow = true;
    return { step, tread, nose, ...spec };
  });

  const spineRails = new THREE.Group();
  spineRails.name = "extension-stringers";
  group.add(spineRails);
  const stringerGeometry = new THREE.BoxGeometry(1, 1, 1);
  ownGeometry(stringerGeometry);
  const stringers = [];
  for (const side of [-1, 1]) {
    for (let index = 0; index < stairCount - 1; index += 1) {
      const stringer = kit.mesh(stringerGeometry, index % 3 ? structureMetal : walnut, 0, 0, 0, spineRails);
      stringer.castShadow = true;
      stringers.push({ mesh: stringer, side, index });
    }
  }

  const crank = new THREE.Group();
  crank.name = "front-right-sixteen-book-crank";
  crank.position.set(3.66, 1.52, 1.82);
  crank.rotation.set(-0.04, -0.12, 0);
  group.add(crank);
  const crankHousing = add(new THREE.CylinderGeometry(0.94, 0.94, 0.34, 48), dark, 0, 0, -0.16, crank);
  crankHousing.rotation.x = Math.PI / 2;
  addRing(0.9, 0.065, walnut, crank, [0, 0, -0.02]);
  addRing(0.75, 0.035, structureMetal, crank, [0, 0, 0.13]);
  const crankRotor = new THREE.Group();
  crankRotor.name = "crank-rotor-and-eccentric-grip";
  crank.add(crankRotor);
  const crankGear = addGear(0.66, 0.16, 26, brass, crankRotor, [0, 0, 0.08]);
  crankGear.name = "crank-drive-gear";
  const crankArm = addRounded(0.92, 0.09, 0.09, copper, crankRotor, [0.38, 0, 0.2], 0.035);
  crankArm.name = "crank-eccentric-arm";
  crankArm.rotation.z = 0;
  const crankKnob = add(new THREE.CylinderGeometry(0.15, 0.15, 0.28, 20), walnut, 0.82, 0, 0.24, crankRotor);
  crankKnob.name = "crank-eccentric-grip";
  crankKnob.rotation.x = Math.PI / 2;
  addRing(0.18, 0.025, brass, crankRotor, [0.82, 0, 0.335]);
  const crankProxy = add(new THREE.CylinderGeometry(0.96, 0.96, 0.38, 28, 1, true), proxyMaterial, 0, 0, 0.1, crankRotor);
  crankProxy.rotation.x = Math.PI / 2;
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    addText(
      String(index + 1).padStart(2, "0"),
      0.16,
      0.065,
      crank,
      [Math.cos(angle) * 0.94, Math.sin(angle) * 0.94, 0.2],
      [0, 0, angle - Math.PI / 2],
      { fontSize: 27, color: "#d2b474", serif: false },
    );
  }
  const crankPointer = addRounded(0.19, 0.07, 0.05, cream, crankRotor, [0, 0.93, 0.18], 0.02);
  crankPointer.rotation.z = 0.04;

  const crankReadoutCanvas = document.createElement("canvas");
  crankReadoutCanvas.width = 384;
  crankReadoutCanvas.height = 76;
  const crankReadoutContext = crankReadoutCanvas.getContext("2d");
  const crankReadoutTexture = ownTexture(new THREE.CanvasTexture(crankReadoutCanvas));
  crankReadoutTexture.colorSpace = THREE.SRGBColorSpace;
  const crankReadoutMaterial = ownMaterial(
    new THREE.MeshBasicMaterial({
      map: crankReadoutTexture,
      transparent: true,
      toneMapped: false,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  add(new THREE.PlaneGeometry(0.78, 0.16), crankReadoutMaterial, 0, -1.03, 0.06, crank);

  const bridgeNetwork = new THREE.Group();
  bridgeNetwork.name = "interpenetrating-reading-bridges";
  group.add(bridgeNetwork);
  const bridgeGroups = [];
  function addReadingBridge(start, end, width, archHeight, name) {
    const bridge = new THREE.Group();
    bridge.name = name;
    bridgeNetwork.add(bridge);
    const from = new THREE.Vector3(...start);
    const to = new THREE.Vector3(...end);
    addSurface(
      (u, v) => {
        const point = from.clone().lerp(to, u);
        return [
          point.x + (v - 0.5) * width,
          point.y + Math.sin(u * Math.PI) * archHeight + Math.sin(v * Math.PI) * 0.035,
          point.z + (v - 0.5) * width * 0.22,
        ];
      },
      26,
      6,
      walnut,
      bridge,
    );
    for (const edge of [0, 0.5, 1]) {
      const path = [];
      for (let step = 0; step <= 20; step += 1) {
        const u = step / 20;
        const point = from.clone().lerp(to, u);
        path.push([
          point.x + (edge - 0.5) * width,
          point.y + Math.sin(u * Math.PI) * archHeight,
          point.z + (edge - 0.5) * width * 0.22,
        ]);
      }
      addTube(path, edge === 0.5 ? 0.012 : 0.019, structureMetal, bridge, 38, 5);
    }
    for (const edge of [0, 1]) {
      const rail = [];
      for (let step = 0; step <= 16; step += 1) {
        const u = step / 16;
        const point = from.clone().lerp(to, u);
        rail.push([
          point.x + (edge - 0.5) * width,
          point.y + Math.sin(u * Math.PI) * archHeight + 0.44,
          point.z + (edge - 0.5) * width * 0.22,
        ]);
      }
      addTube(rail, 0.011, brass, bridge, 34, 5);
    }
    bridgeGroups.push({
      group: bridge,
      basePosition: bridge.position.clone(),
      baseRotation: bridge.rotation.clone(),
      midpoint: from.clone().lerp(to, 0.5),
    });
    return bridge;
  }
  addReadingBridge([-3.0, 5.2, -1.38], [3.12, 5.55, -1.58], 0.46, 0.42, "high-crossing-bridge");
  addReadingBridge([-1.74, 2.36, -1.42], [2.66, 1.62, 0.42], 0.34, 0.2, "low-folio-bridge");
  addReadingBridge([0.28, 4.0, -2.26], [3.16, 4.82, -1.72], 0.3, 0.26, "page-to-tower-bridge");

  const readingLight = new THREE.PointLight(0xe7be71, 1.25, 7, 2);
  readingLight.position.set(2.7, 2.8, 1.35);
  group.add(readingLight);
  const titleLight = new THREE.PointLight(0xa7d0bf, 0.85, 6, 2);
  titleLight.position.set(-1.1, 4.4, 1.8);
  group.add(titleLight);

  function recomputeOpening() {
    state.opening = clamp(0.68 + state.extension * 0.32, 0, 1);
  }
  recomputeOpening();

  let renderedExtension = -1;
  function redrawShelfReadout() {
    const percent = Math.round(state.extension * 100);
    if (percent === renderedExtension) return;
    renderedExtension = percent;
    const width = shelfReadoutCanvas.width;
    const height = shelfReadoutCanvas.height;
    shelfReadoutContext.clearRect(0, 0, width, height);
    shelfReadoutContext.fillStyle = "rgba(37,32,27,0.92)";
    shelfReadoutContext.fillRect(0, 0, width, height);
    shelfReadoutContext.strokeStyle = "rgba(205,181,132,0.5)";
    shelfReadoutContext.lineWidth = 2;
    for (let index = 0; index <= 10; index += 1) {
      const x = 16 + index * (width - 32) / 10;
      shelfReadoutContext.beginPath();
      shelfReadoutContext.moveTo(x, height - 15);
      shelfReadoutContext.lineTo(x, height - (index % 5 === 0 ? 31 : 23));
      shelfReadoutContext.stroke();
    }
    shelfReadoutContext.fillStyle = "#e0c68b";
    shelfReadoutContext.font = '600 26px "Space Grotesk", Arial, sans-serif';
    shelfReadoutContext.textAlign = "right";
    shelfReadoutContext.fillText(`EXT ${String(percent).padStart(3, "0")}%`, width - 16, 30);
    shelfReadoutTexture.needsUpdate = true;
  }
  redrawShelfReadout();

  function updateHighlights() {
    books.forEach((book) => {
      const selected = book.index === state.selected;
      book.highlight.material.opacity = damp(book.highlight.material.opacity, selected ? 0.52 : 0, 10, 0.05);
      book.highlight.material.emissiveIntensity = selected ? 2.2 : 1.0;
    });
  }

  function selectBook(index, announce = true) {
    if (!items.length) return -1;
    state.selected = ((Number(index) || 0) % items.length + items.length) % items.length;
    const item = items[state.selected];
    drawBookPages(item, state.selected);
    redrawCrankReadout();
    selectionKick = 1;
    const found = bookLookup.get(state.selected);
    if (found) found.root.rotation.y += 0.004;
    if (announce) {
      status(`第 ${bookCode(item, state.selected)} 本 · ${bookTitle(item)} · ${bookAuthor(item)}`);
    }
    invalidate();
    return state.selected;
  }

  function redrawCrankReadout() {
    const width = crankReadoutCanvas.width;
    const height = crankReadoutCanvas.height;
    crankReadoutContext.clearRect(0, 0, width, height);
    crankReadoutContext.fillStyle = "rgba(32,29,25,0.94)";
    crankReadoutContext.fillRect(0, 0, width, height);
    crankReadoutContext.fillStyle = "#dfc58a";
    crankReadoutContext.font = '600 28px "Space Grotesk", Arial, sans-serif';
    crankReadoutContext.textAlign = "left";
    crankReadoutContext.fillText("VOLUME", 18, 48);
    crankReadoutContext.textAlign = "right";
    crankReadoutContext.fillText(
      `${String(state.selected + 1).padStart(2, "0")} / ${String(items.length || 16).padStart(2, "0")}`,
      width - 18,
      49,
    );
    crankReadoutTexture.needsUpdate = true;
  }

  function toggleExtension() {
    state.extension = state.extension > 0.52 ? 0.12 : 0.94;
    recomputeOpening();
    status(
      state.extension > 0.52
        ? "书脊列沿黄铜导轨拉出，台阶与阅览平台正在展开。"
        : "书脊列收回，阶梯折入书楼。",
    );
    invalidate();
  }

  function togglePage(direction = 1) {
    state.pageTurn = direction >= 0 ? 1 : 0;
    status(direction >= 0 ? "页面翻过书脊，落向另一侧。" : "纸页回落到右侧书页。");
    invalidate();
  }

  function openSelected() {
    const title = bookTitle(items[state.selected]);
    if (state.opening < 0.61) {
      status("先拉开书脊列，让巨型开本完全展开。");
      return false;
    }
    if (state.pageTurn < 0.55 && state.pageTurn > 0.08) {
      status("等这一页卷过书脊，再从翻开后的文字页进入。");
      return false;
    }
    if (typeof kit.onSelect === "function") kit.onSelect("books", state.selected);
    else if (typeof kit.onItemSelect === "function") kit.onItemSelect(items[state.selected]);
    status(`正在阅读《${title}》的完整馆藏记录。`);
    return true;
  }

  register(shelfHandle, {
    id: "books-shelf-extension",
    label: "前左书脊轨抓手",
    hint: "向右或向上拖动前方象牙抓手，书簇向外后分离，台阶与页屋面展开",
    anchor: [0, 0, 0.18],
    onDown() {
      extensionDragging = true;
    },
    onDrag({ dx, dy }) {
      state.extension = clamp(state.extension + (dx - dy * 0.35) / 180, 0, 1);
      recomputeOpening();
      redrawShelfReadout();
      invalidate();
    },
    onUp() {
      extensionDragging = false;
      state.extension = state.extension > 0.52 ? 1 : 0.1;
      recomputeOpening();
      redrawShelfReadout();
      status(
        state.extension > 0.52
          ? `书楼展开 ${Math.round(state.extension * 100)}%，阅览平台已接入台阶。`
          : "书脊列收回，保留窄阅览缝。",
      );
      invalidate();
    },
  });

  register(pageCorner, {
    id: "books-page-turn",
    label: "前列页缘金角抓手",
    hint: "向左上拖动页角，纸面连续卷曲过书脊；松手后落下",
    anchor: [0, 0.06, 0.11],
    onDown() {
      pageDragging = true;
    },
    onDrag({ dx, dy }) {
      state.pageTurn = clamp(state.pageTurn + (-dx - dy * 0.9) / 210, 0, 1);
      visualPageTurn = state.pageTurn;
      updateTurnGeometry(visualPageTurn);
      updateCorner();
      invalidate();
    },
    onUp() {
      pageDragging = false;
      state.pageTurn = state.pageTurn > 0.36 ? 1 : 0;
      status(state.pageTurn > 0.5 ? "纸页已经翻过，文字面可以打开。" : "纸页回落到右侧。");
      invalidate();
    },
  });

  register(crankRotor, {
    id: "books-book-selector",
    label: "前右十六书偏心曲柄",
    hint: "转动带轴承外壳的曲柄，在 16 本真实藏书之间切换，并联动书楼与台阶",
    anchor: [0.82, 0, 0.38],
    onDown() {
      crankDragging = true;
    },
    onDrag({ dx, dy }) {
      const movement = dx - dy * 0.22;
      crankAngle -= movement * 0.012;
      crankAngle = Math.atan2(Math.sin(crankAngle), Math.cos(crankAngle));
      crankAccumulator += movement / 34;
      if (Math.abs(crankAccumulator) >= 1) {
        const steps = Math.trunc(crankAccumulator);
        selectBook(state.selected + steps, false);
        crankAccumulator -= steps;
        const item = items[state.selected];
        status(`书楼转位 · ${bookCode(item, state.selected)} ${bookTitle(item)}`);
      }
      invalidate();
    },
    onUp() {
      crankDragging = false;
      crankAccumulator = 0;
    },
  });

  register(turningPage, {
    id: "books-opened-text-page",
    label: "已经翻开的文字页",
    hint: "卷页完成后，点按文字页打开当前藏书的详情",
    anchor: currentTurnPageAnchor().toArray(),
    getAnchor: currentTurnPageAnchor,
    onClick() {
      openSelected();
    },
  });
  register(turningBack, {
    id: "books-opened-text-page-back",
    label: "已经翻开的文字页",
    hint: "卷页完成后，点按文字页打开当前藏书的详情",
    anchor: currentTurnPageAnchor().toArray(),
    getAnchor: currentTurnPageAnchor,
    onClick() {
      openSelected();
    },
  });

  if (items.length) drawBookPages(items[0], 0);
  redrawCrankReadout();
  updateHighlights();

  function updateMechanism() {
    redrawShelfReadout();
    const selectionNormalized = state.selected / Math.max(1, items.length - 1) - 0.5;
    lowerRack.position.set(
      -0.62 - visualExtension * 0.64,
      1.1 - visualExtension * 0.04,
      -0.62 - visualExtension * 0.22,
    );
    lowerRack.rotation.set(
      -0.025 * visualExtension,
      0.19 + visualExtension * 0.17 + selectionNormalized * 0.09,
      0.018 * visualExtension,
    );
    upperRack.position.set(
      -0.15 + visualExtension * 0.62,
      4.24 + visualExtension * 0.26,
      -3.83 - visualExtension * 0.28,
    );
    upperRack.rotation.set(
      0.02 * visualExtension,
      -0.41 - visualExtension * 0.22 - selectionNormalized * 0.06,
      -0.016 * visualExtension,
    );

    foldedShells.forEach((entry, index) => {
      const separation = visualExtension * (0.52 + index * 0.065);
      entry.group.position.copy(entry.basePosition).addScaledVector(entry.outward, separation);
      entry.group.position.y = entry.basePosition.y + Math.sin(visualExtension * Math.PI) * (0.13 + index * 0.018);
      entry.group.rotation.x =
        entry.baseRotation.x + visualExtension * (index % 2 ? -0.1 : 0.085);
      entry.group.rotation.y =
        entry.baseRotation.y + visualExtension * entry.outward.x * 0.16 + selectionNormalized * 0.025;
      entry.group.rotation.z =
        entry.baseRotation.z + visualExtension * (index % 2 ? 0.045 : -0.04);
    });

    pageRoofs.forEach((entry, index) => {
      entry.group.position.set(
        visualExtension * entry.spread * (0.32 + index * 0.08),
        visualExtension * (0.15 + index * 0.045),
        -visualExtension * (0.18 + index * 0.04),
      );
      entry.group.rotation.set(
        visualExtension * (index % 2 ? -0.035 : 0.045),
        visualExtension * entry.spread * (0.08 + index * 0.025)
          + selectionNormalized * 0.035,
        visualExtension * entry.spread * 0.018,
      );
    });

    readingTowerA.root.position.set(
      -3.78 - visualExtension * 0.42,
      0.34 + visualExtension * 0.18,
      -2.9 - visualExtension * 0.34,
    );
    readingTowerB.root.position.set(
      3.82 + visualExtension * 0.42,
      0.26 + visualExtension * 0.2,
      -3.15 - visualExtension * 0.34,
    );
    readingTowerA.root.rotation.y = 0.58 + visualExtension * 0.17 + selectionNormalized * 0.12;
    readingTowerB.root.rotation.y = -0.78 - visualExtension * 0.15 - selectionNormalized * 0.1;
    readingTowerA.root.rotation.z = -0.055 + visualExtension * 0.028;
    readingTowerB.root.rotation.z = 0.06 - visualExtension * 0.024;
    readingTowerLevels.forEach((entry) => {
      const direction = entry.direction;
      entry.group.position.x = visualExtension * 0.11 * direction * (1 + entry.level * 0.22);
      entry.group.position.y = entry.baseY + visualExtension * (0.08 + entry.level * 0.025);
      entry.group.position.z = visualExtension * 0.08 * -direction;
      entry.group.rotation.y =
        entry.baseTurn
        + visualExtension * direction * (0.07 + entry.level * 0.012)
        + selectionKick * direction * 0.045;
    });

    stepGroups.forEach((entry, index) => {
      const p = index / (stepGroups.length - 1);
      const selectionTwist = selectionNormalized * 0.18;
      entry.step.position.lerpVectors(entry.collapsed, entry.full, visualExtension);
      entry.step.rotation.set(
        -0.055 + Math.sin(index * 0.63) * 0.035,
        entry.rotation + selectionTwist * (0.4 + p),
        -0.02 + Math.cos(index * 0.55) * 0.02,
      );
      const width = 0.48 + visualExtension * 0.52;
      entry.tread.scale.set(width, 0.75 + visualExtension * 0.25, 0.7 + visualExtension * 0.3);
      entry.nose.position.x = (1 - width) * 0.39;
      entry.nose.scale.x = width;
    });

    stringers.forEach((entry) => {
      const startStep = stepGroups[entry.index]?.step.position;
      const endStep = stepGroups[entry.index + 1]?.step.position;
      if (!startStep || !endStep) return;
      const startPoint = startStep.clone().add(new THREE.Vector3(0, entry.side * 0.055, entry.side * 0.16));
      const endPoint = endStep.clone().add(new THREE.Vector3(0, entry.side * 0.055, entry.side * 0.16));
      const middle = startPoint.clone().add(endPoint).multiplyScalar(0.5);
      const direction = endPoint.clone().sub(startPoint);
      entry.mesh.position.copy(middle);
      entry.mesh.scale.set(0.018 + visualExtension * 0.008, direction.length(), 0.018 + visualExtension * 0.008);
      entry.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    });

    platform.position.set(
      2.16 + visualExtension * 0.48,
      0.54 + visualExtension * 0.62,
      -0.42 - visualExtension * 0.22,
    );
    platform.rotation.set(-0.1 + visualExtension * 0.075, -0.32 + visualExtension * 0.42, -0.06 + visualExtension * 0.03);
    platform.scale.set(0.64 + visualExtension * 0.36, 0.52 + visualExtension * 0.48, 0.58 + visualExtension * 0.42);
    platform.visible = visualExtension > 0.025;
    platformLeaves.forEach((leaf, index) => {
      leaf.position.y = -0.04 + index * 0.03 + Math.sin(visualExtension * Math.PI + index * 0.55) * 0.025;
      leaf.rotation.y = -0.34 + index * 0.26
        + visualExtension * (index - 1) * 0.045
        + selectionNormalized * 0.035;
    });

    bridgeGroups.forEach((entry, index) => {
      entry.group.position.set(
        visualExtension * (index % 2 ? -0.12 : 0.1),
        visualExtension * (0.08 + index * 0.035),
        -visualExtension * (0.2 + index * 0.055),
      );
      entry.group.rotation.set(
        visualExtension * (index % 2 ? -0.018 : 0.014),
        selectionNormalized * 0.024 + visualExtension * (index % 2 ? -0.035 : 0.025),
        visualExtension * (index % 2 ? 0.016 : -0.012),
      );
    });

    bookRoot.rotation.z = -0.018 + Math.sin(visualOpening * Math.PI) * 0.018;
    bookRoot.rotation.x = -0.11 + (1 - visualOpening) * 0.045;
    bookRoot.rotation.y = 0.045 + selectionNormalized * 0.018;
    bookRoot.position.y = 3.22 + Math.sin(visualOpening * Math.PI) * 0.09;
    pageFanPlacements.forEach((placement, index) => {
      const sheet = index % 12;
      const side = index < 12 ? -1 : 1;
      placement.position[1] = -0.075 - sheet * 0.012 - (1 - visualOpening) * 0.025;
      placement.rotation[2] = side * (-0.035 - sheet * 0.002 + (1 - visualOpening) * 0.01);
      pageFanDummy.position.set(...placement.position);
      pageFanDummy.rotation.set(...placement.rotation);
      pageFanDummy.scale.set(...placement.scale);
      pageFanDummy.updateMatrix();
      pageFanMesh.setMatrixAt(index, pageFanDummy.matrix);
    });
    pageFanMesh.instanceMatrix.needsUpdate = true;
    pageFanMesh.computeBoundingSphere?.();

    crankRotor.rotation.z = crankAngle;
    readingLight.intensity = 0.34 + visualExtension * 0.92;
    titleLight.intensity = 0.58 + visualOpening * 0.36;
  }

  updateMechanism();

  return {
    group,
    focus: new THREE.Vector3(0.2, 3.45, 0.15),
    update(time, delta, active) {
      activeNow = Boolean(active);
      if (!activeNow) return;
      const dt = clamp(Number(delta) || 0, 0, 0.08);
      visualExtension = damp(visualExtension, state.extension, extensionDragging ? 15 : 6.5, dt || 0.016);
      visualOpening = damp(visualOpening, state.opening, 7, dt || 0.016);
      visualPageTurn = pageDragging ? state.pageTurn : damp(visualPageTurn, state.pageTurn, 7.5, dt || 0.016);
      crankAngle = damp(crankAngle, crankAngle - Math.sin(time * 0.0013) * 0.0002, 5, dt || 0.016);
      selectionKick = damp(selectionKick, 0, 4.8, dt || 0.016);
      updateTurnGeometry(visualPageTurn);
      updateCorner();
      updateHighlights();
      updateMechanism();
      if (pageDragging || extensionDragging || crankDragging || Math.abs(visualPageTurn - state.pageTurn) > 0.001) {
        invalidate();
      }
    },
    interact(action, index) {
      if (action === "select" || action === "next" || action === "previous") {
        const delta = action === "previous" ? -1 : action === "next" ? 1 : 0;
        return selectBook(Number.isFinite(Number(index)) ? Number(index) : state.selected + delta, false);
      }
      if (action === "extend" || action === "open" || action === "shelf") {
        toggleExtension();
        return state.extension;
      }
      if (action === "turn" || action === "page") {
        togglePage(Number.isFinite(Number(index)) ? Number(index) : 1);
        return state.pageTurn;
      }
      if (action === "reveal" || action === "read") return openSelected();
      if (action === "reset") {
        state.extension = 0.18;
        recomputeOpening();
        state.pageTurn = 0.88;
        visualExtension = state.extension;
        visualOpening = state.opening;
        visualPageTurn = state.pageTurn;
        selectBook(0, false);
        updateTurnGeometry(visualPageTurn);
        updateCorner();
        updateMechanism();
        status("书城已经复位，第一本藏书回到翻页位置。");
        invalidate();
        return true;
      }
      return state.opening;
    },
    getState() {
      const item = items[state.selected];
      return {
        selected: state.selected,
        selectedId: item?.id || "",
        title: bookTitle(item),
        opening: Number(state.opening.toFixed(3)),
        pageTurn: Number(state.pageTurn.toFixed(3)),
        extension: Number(state.extension.toFixed(3)),
        detailsUnlocked:
          state.opening >= 0.61 && (state.pageTurn >= 0.55 || state.pageTurn <= 0.08),
        bookCount: books.length,
        pageSegments: [turnUSegments, turnVSegments],
      };
    },
    setActive(active) {
      activeNow = Boolean(active);
      if (activeNow) invalidate();
    },
    dispose() {
      ownedGeometries.forEach((geometry) => geometry.dispose?.());
      ownedMaterials.forEach((material) => material.dispose?.());
      ownedTextures.forEach((texture) => texture.dispose?.());
    },
  };
}
