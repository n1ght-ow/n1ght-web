export function buildExperience(kit) {
  const THREE = kit?.THREE;
  if (!THREE || !kit.sculpt || typeof kit.mesh !== "function") {
    throw new TypeError("books experience requires the shared Three.js experience kit");
  }

  const group = new THREE.Group();
  group.name = "reading-room-folio";

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
  if (!items.length) {
    items.push({
      id: "empty-volume",
      title: "待编目",
      spine: "An Unfinished Catalogue",
      author: "N1GHT CHXN9",
      description: "这一册仍在等待书名、作者与一段藏书文字。",
      originalFields: {
        cloth: "#3d4d45",
        ink: "#f0eadc",
        band: "#b59762",
      },
    });
  }

  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const ownedTextures = new Set();
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
  const material = (color, roughness = 0.72, metalness = 0) => {
    if (color?.isMaterial) return color;
    return typeof kit.material === "function"
      ? kit.material(color, roughness, metalness)
      : ownMaterial(new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  };
  const localMaterial = (options) => ownMaterial(new THREE.MeshStandardMaterial(options));
  const addBox = (width, height, depth, mat, x, y, z, parent = group) => {
    const node = kit.box(width, height, depth, mat, x, y, z, parent);
    node.castShadow = true;
    node.receiveShadow = true;
    return node;
  };
  const addRounded = (width, height, depth, mat, parent, position, radius = 0.06) => {
    const node = kit.sculpt.rounded(width, height, depth, mat, parent, position, radius);
    ownGeometry(node?.geometry);
    if (node) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
    return node;
  };
  const addDisc = (radius, depth, mat, parent, position, segments = 28) => {
    const node = kit.cylinder(radius, radius, depth, mat, ...position, parent, segments);
    node.rotation.x = Math.PI / 2;
    node.castShadow = true;
    node.receiveShadow = true;
    return node;
  };
  const addTube = (points, radius, mat, parent, segments = 36, sides = 7) => {
    const node = kit.sculpt.tube(points, radius, mat, parent, segments, sides);
    ownGeometry(node?.geometry);
    if (node) node.castShadow = true;
    return node;
  };
  const addPlane = (width, height, mat, parent, position = [0, 0, 0]) => {
    const geometry = ownGeometry(new THREE.PlaneGeometry(width, height));
    const node = kit.mesh(geometry, mat, ...position, parent);
    node.castShadow = false;
    node.receiveShadow = true;
    return node;
  };
  const register = (object, descriptor) => {
    if (object && typeof kit.register === "function") kit.register(object, descriptor);
    return object;
  };
  const status = (message) => {
    if (typeof kit.status === "function") kit.status(message);
  };
  const invalidate = () => {
    if (typeof kit.invalidate === "function") kit.invalidate();
  };
  const reducedMotion = () => typeof kit.reducedMotion === "function" && kit.reducedMotion();
  const clamp = THREE.MathUtils.clamp;
  const damp = THREE.MathUtils.damp;

  const walnut = material(kit.walnut || "#584336", 0.74, 0.03);
  const olive = material("#353c30", 0.78, 0.05);
  const oliveEdge = material("#252b24", 0.64, 0.12);
  const brass = material(kit.brass || "#b19258", 0.3, 0.76);
  const agedBrass = material("#80643c", 0.48, 0.56);
  const paper = material(kit.cream || "#e7ddc7", 0.94, 0);
  const paperEdge = material("#c8bda3", 0.9, 0);
  const ink = material("#171b19", 0.52, 0.08);
  const proxy = localMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const base = addRounded(8.32, 0.27, 3.16, walnut, group, [0, 0.135, 0.12], 0.08);
  base.name = "reading-table-base";
  addRounded(7.72, 0.17, 2.62, olive, group, [0, 0.345, 0.15], 0.055);
  addRounded(5.46, 0.15, 1.86, oliveEdge, group, [0, 0.5, 0.12], 0.045);
  addBox(7.45, 0.035, 0.055, brass, 0, 0.29, 1.43, group);
  addBox(7.45, 0.035, 0.055, brass, 0, 0.29, -1.2, group);
  for (const x of [-3.52, 3.52]) {
    addBox(0.055, 0.035, 2.36, brass, x, 0.295, 0.12, group);
  }
  for (const x of [-3.72, 3.72]) {
    for (const z of [-0.86, 0.92]) {
      addDisc(0.16, 0.08, agedBrass, group, [x, 0.075, z], 22);
    }
  }

  const bookRoot = new THREE.Group();
  bookRoot.name = "open-folio-cradle";
  bookRoot.position.set(0, 2.56, 0.18);
  group.add(bookRoot);

  addRounded(3.14, 3.86, 0.16, walnut, bookRoot, [0, 0, -0.2], 0.035);
  addRounded(2.98, 3.7, 0.2, paperEdge, bookRoot, [0, 0, -0.045], 0.018);
  addBox(2.84, 3.56, 0.15, paper, 0, 0, 0.065, bookRoot);
  for (let layer = 0; layer < 5; layer += 1) {
    addBox(
      2.82 - layer * 0.018,
      3.54 - layer * 0.014,
      0.012,
      layer % 2 ? paper : paperEdge,
      0,
      -0.018 + layer * 0.008,
      0.147 + layer * 0.011,
      bookRoot,
    );
  }

  const coverWidth = 2.86;
  const coverHeight = 3.66;
  const coverCanvas = document.createElement("canvas");
  const leftPageCanvas = document.createElement("canvas");
  const rightPageCanvas = document.createElement("canvas");
  coverCanvas.width = 768;
  coverCanvas.height = Math.round((coverCanvas.width * coverHeight) / coverWidth);
  leftPageCanvas.width = rightPageCanvas.width = 640;
  leftPageCanvas.height = rightPageCanvas.height = 820;

  const coverContext = coverCanvas.getContext("2d");
  const leftPageContext = leftPageCanvas.getContext("2d");
  const rightPageContext = rightPageCanvas.getContext("2d");
  const coverTexture = ownTexture(new THREE.CanvasTexture(coverCanvas));
  const leftPageTexture = ownTexture(new THREE.CanvasTexture(leftPageCanvas));
  const rightPageTexture = ownTexture(new THREE.CanvasTexture(rightPageCanvas));
  for (const canvasTexture of [coverTexture, leftPageTexture, rightPageTexture]) {
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.anisotropy = 4;
  }

  const coverFront = localMaterial({
    map: coverTexture,
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0.015,
    side: THREE.FrontSide,
  });
  const coverBack = localMaterial({
    map: leftPageTexture,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0,
    side: THREE.FrontSide,
  });
  const pageRight = localMaterial({
    map: rightPageTexture,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0,
    side: THREE.FrontSide,
  });
  const coverEdge = localMaterial({
    color: 0x2e3029,
    roughness: 0.66,
    metalness: 0.08,
  });

  const rightPage = addPlane(1.42, 3.52, pageRight, bookRoot, [0.73, 0, 0.235]);
  rightPage.name = "right-reading-page";
  const pageProxy = addPlane(1.46, 3.58, proxy, bookRoot, [0.73, 0, 0.245]);
  pageProxy.name = "right-page-pick";

  const coverPivot = new THREE.Group();
  coverPivot.name = "folio-cover-hinge";
  coverPivot.position.set(-coverWidth / 2, 0, 0.215);
  bookRoot.add(coverPivot);
  const coverGeometry = ownGeometry(new THREE.BoxGeometry(coverWidth, coverHeight, 0.075));
  const cover = kit.mesh(
    coverGeometry,
    [coverEdge, coverEdge, coverEdge, coverEdge, coverFront, coverBack],
    coverWidth / 2,
    0,
    0,
    coverPivot,
  );
  cover.name = "selected-book-cover";
  cover.castShadow = true;
  cover.receiveShadow = true;

  addDisc(0.1, 0.12, brass, bookRoot, [-coverWidth / 2 - 0.03, coverHeight * 0.43, 0.19], 24);
  addDisc(0.1, 0.12, brass, bookRoot, [-coverWidth / 2 - 0.03, -coverHeight * 0.43, 0.19], 24);
  addBox(0.05, 3.88, 0.12, agedBrass, -1.7, 0, -0.16, bookRoot);
  addBox(3.56, 0.045, 0.12, agedBrass, 0, 1.96, -0.16, bookRoot);
  addBox(3.56, 0.045, 0.12, agedBrass, 0, -1.96, -0.16, bookRoot);
  addBox(0.05, 3.88, 0.12, agedBrass, 1.7, 0, -0.16, bookRoot);

  const folioWings = [];
  for (const side of [-1, 1]) {
    for (let layer = 0; layer < 3; layer += 1) {
      const wing = addPlane(1.34, 3.15 - layer * 0.1, layer === 2 ? paperEdge : paper, group, [
        side * (1.8 + layer * 0.1),
        2.38 - layer * 0.025,
        -0.02 - layer * 0.085,
      ]);
      wing.name = `folio-wing-${side < 0 ? "left" : "right"}-${layer + 1}`;
      wing.rotation.y = side * (0.26 + layer * 0.035);
      wing.rotation.z = side * (0.015 + layer * 0.006);
      folioWings.push({ node: wing, side, layer });
    }
  }

  const frame = new THREE.Group();
  frame.name = "narrow-brass-reading-frame";
  group.add(frame);
  for (const x of [-2.72, 2.72]) {
    addBox(0.055, 3.92, 0.08, agedBrass, x, 2.49, -0.43, frame);
    addBox(0.42, 0.08, 0.44, brass, x, 0.5, 0.02, frame);
  }
  addTube(
    [
      [-2.72, 4.42, -0.43],
      [-1.9, 4.62, -0.43],
      [0, 4.68, -0.43],
      [1.9, 4.62, -0.43],
      [2.72, 4.42, -0.43],
    ],
    0.028,
    brass,
    frame,
    58,
    7,
  );
  addBox(3.2, 0.045, 0.1, brass, 0, 0.54, -0.35, frame);
  addBox(3.2, 0.045, 0.1, brass, 0, 4.34, -0.35, frame);

  const paddleRoots = [];
  for (const [direction, id, label] of [
    [-1, "books-previous", "上一册黄铜拨片"],
    [1, "books-next", "下一册黄铜拨片"],
  ]) {
    const paddleRoot = new THREE.Group();
    paddleRoot.name = `${id}-assembly`;
    paddleRoot.position.set(direction * 3.66, 2.31, 0.37);
    group.add(paddleRoot);
    addBox(0.84, 0.055, 0.07, agedBrass, -direction * 0.46, 0, -0.1, paddleRoot);
    const paddle = addRounded(0.42, 0.98, 0.48, brass, paddleRoot, [0, 0, 0], 0.09);
    paddle.name = id;
    for (let slot = -1; slot <= 1; slot += 1) {
      addBox(0.21, 0.028, 0.022, oliveEdge, 0, slot * 0.16, 0.257, paddleRoot);
    }
    const chevron = addTube(
      [
        [direction * 0.085, -0.075, 0.266],
        [0, 0, 0.266],
        [direction * 0.085, 0.075, 0.266],
      ],
      0.012,
      ink,
      paddleRoot,
      12,
      5,
    );
    chevron.castShadow = false;
    register(paddleRoot, {
      id,
      label,
      hint: direction < 0 ? "点按左侧拨片，换到上一册真实藏书" : "点按右侧拨片，换到下一册真实藏书",
      anchor: [0, 0, 0.22],
      onClick() {
        selectBook(state.selected + direction, true);
      },
    });
    paddleRoots.push({ root: paddleRoot, direction, baseX: direction * 3.66 });
  }

  const openingHandle = new THREE.Group();
  openingHandle.name = "opening-handle-assembly";
  openingHandle.position.set(0, 0.68, 1.24);
  group.add(openingHandle);
  addBox(1.64, 0.06, 0.2, agedBrass, 0, -0.09, -0.14, openingHandle);
  addRounded(1.38, 0.18, 0.28, brass, openingHandle, [0, 0, 0], 0.07);
  for (let notch = -4; notch <= 4; notch += 1) {
    addBox(0.026, 0.12, 0.02, oliveEdge, notch * 0.13, 0, 0.151, openingHandle);
  }
  register(openingHandle, {
    id: "books-open-latch",
    label: "中央开卷拉手",
    hint: "点按拉手翻开或合上当前书封",
    anchor: [0, 0, 0.17],
    onClick() {
      setCoverOpen(state.opening < 0.5);
    },
  });

  const readingLight = new THREE.SpotLight("#ffe1ac", 12, 13, 0.52, 0.72, 1.45);
  readingLight.name = "folio-reading-light";
  readingLight.position.set(0, 6.35, 3.35);
  readingLight.target.position.set(0, 2.48, 0.2);
  readingLight.castShadow = false;
  group.add(readingLight, readingLight.target);
  const reflectedWarmth = new THREE.PointLight("#c99c5e", 3.2, 5.4, 1.7);
  reflectedWarmth.name = "brass-bounce-light";
  reflectedWarmth.position.set(0, 1.25, 2.3);
  group.add(reflectedWarmth);

  const state = {
    selected: 0,
    opening: 0,
    direction: 1,
  };
  let visualOpening = 0;
  let selectionKick = 0;
  let activeNow = false;

  function itemSource(item) {
    return item?.originalFields || item || {};
  }
  function bookTitle(item) {
    return String(item?.title || item?.spine || item?.id || "未题名");
  }
  function bookAuthor(item) {
    return String(item?.author || item?.meta || "佚名");
  }
  function bookSpine(item) {
    return String(item?.spine || item?.english || bookTitle(item));
  }
  function bookBlurb(item) {
    return String(item?.description || item?.blurb || itemSource(item).blurb || "书页仍在等待这一段文字的注解。");
  }
  function bookCode(item, index) {
    return String(itemSource(item).number || index + 1).padStart(2, "0");
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
  function fitTitleLines(context, text, maxWidth, maxSize, minSize, maxLines) {
    let size = maxSize;
    let lines = [String(text || "")];
    while (size >= minSize) {
      context.font = font(true, size, "500");
      lines = wrapText(context, text, maxWidth);
      if (lines.length <= maxLines) break;
      size -= 3;
    }
    return { size, lines: lines.slice(0, maxLines) };
  }
  function paperGround(context, width, height, code) {
    context.fillStyle = "#e9dfca";
    context.fillRect(0, 0, width, height);
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(255,252,240,0.62)");
    gradient.addColorStop(0.58, "rgba(224,210,181,0.08)");
    gradient.addColorStop(1, "rgba(104,84,55,0.13)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.save();
    context.globalAlpha = 0.09;
    context.strokeStyle = "#7b6749";
    context.lineWidth = 1;
    const seed = Number(code) || 1;
    for (let index = 0; index < 95; index += 1) {
      const x = (index * 73 + seed * 29) % width;
      const y = (index * 47 + seed * 17) % height;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 38 + (index % 6) * 17, y + ((index % 3) - 1) * 2);
      context.stroke();
    }
    context.restore();
    context.strokeStyle = "rgba(93,73,46,0.25)";
    context.lineWidth = 1.5;
    context.strokeRect(30, 30, width - 60, height - 60);
  }
  function drawInsidePages(item, index) {
    const title = bookTitle(item);
    const author = bookAuthor(item);
    const spine = bookSpine(item);
    const blurb = bookBlurb(item);
    const code = bookCode(item, index);

    paperGround(leftPageContext, leftPageCanvas.width, leftPageCanvas.height, code);
    leftPageContext.fillStyle = "#6e5b3d";
    leftPageContext.textAlign = "left";
    leftPageContext.font = font(false, 17, "600");
    leftPageContext.fillText("N1GHT CHXN9 / PRIVATE LIBRARY", 58, 72);
    leftPageContext.fillStyle = "#8f7751";
    leftPageContext.font = font(false, 14, "500");
    leftPageContext.fillText(`COLLECTOR'S COPY · ${code}`, 58, 101);
    leftPageContext.strokeStyle = "rgba(110,87,53,0.5)";
    leftPageContext.lineWidth = 1.5;
    leftPageContext.beginPath();
    leftPageContext.moveTo(58, 125);
    leftPageContext.lineTo(582, 125);
    leftPageContext.stroke();

    const titleFit = fitTitleLines(leftPageContext, title, 530, 66, 34, 3);
    leftPageContext.fillStyle = "#29342e";
    leftPageContext.font = font(true, titleFit.size, "600");
    titleFit.lines.forEach((line, lineIndex) => {
      leftPageContext.fillText(line, 58, 216 + lineIndex * (titleFit.size * 1.14));
    });
    const titleBottom = 216 + (titleFit.lines.length - 1) * (titleFit.size * 1.14);
    leftPageContext.fillStyle = "#665135";
    leftPageContext.font = font(false, 16, "600");
    leftPageContext.fillText(spine.toUpperCase(), 58, titleBottom + 54, 530);
    leftPageContext.fillStyle = "#263f34";
    leftPageContext.font = font(true, 38, "600");
    leftPageContext.fillText(author, 58, 540, 530);
    leftPageContext.strokeStyle = "rgba(92,112,91,0.45)";
    leftPageContext.beginPath();
    leftPageContext.moveTo(58, 579);
    leftPageContext.bezierCurveTo(186, 568, 364, 590, 582, 568);
    leftPageContext.stroke();
    leftPageContext.fillStyle = "#7c6b50";
    leftPageContext.font = font(true, 20, "400");
    leftPageContext.fillText("一册从书脊上取下来的时间。", 58, 643, 530);
    leftPageContext.fillStyle = "#8c795b";
    leftPageContext.font = font(false, 15, "500");
    leftPageContext.fillText("OPEN THE LEAF · READ THE NOTE", 58, 739);
    leftPageTexture.needsUpdate = true;

    paperGround(rightPageContext, rightPageCanvas.width, rightPageCanvas.height, code);
    rightPageContext.fillStyle = "#6e5b3d";
    rightPageContext.textAlign = "left";
    rightPageContext.font = font(false, 16, "600");
    rightPageContext.fillText("A NOTE ON THE SHELF", 58, 74);
    rightPageContext.fillStyle = "#26362f";
    rightPageContext.font = font(true, 36, "500");
    rightPageContext.fillText(title, 58, 137, 520);
    rightPageContext.fillStyle = "#363b36";
    rightPageContext.font = font(true, 28, "400");
    const lines = wrapText(rightPageContext, blurb, 512);
    const maxLines = 11;
    lines.slice(0, maxLines).forEach((line, lineIndex) => {
      rightPageContext.fillText(line, 58, 207 + lineIndex * 42);
    });
    if (lines.length > maxLines) rightPageContext.fillText("…", 58, 207 + maxLines * 42);
    rightPageContext.fillStyle = "#625237";
    rightPageContext.font = font(false, 20, "600");
    rightPageContext.fillText(author.toUpperCase(), 58, 714, 510);
    rightPageContext.textAlign = "right";
    rightPageContext.fillStyle = "#9a8666";
    rightPageContext.font = font(true, 25, "500");
    rightPageContext.fillText(code, 582, 756);
    rightPageTexture.needsUpdate = true;
  }
  function drawCover(item, index) {
    const source = itemSource(item);
    const title = bookTitle(item);
    const author = bookAuthor(item);
    const spine = bookSpine(item);
    const code = bookCode(item, index);
    const cloth = String(source.cloth || item?.cloth || "#3e5148");
    const coverInk = String(source.ink || item?.ink || "#f1eadc");
    const band = String(source.band || item?.band || "#c6a45e");
    const width = coverCanvas.width;
    const height = coverCanvas.height;
    const context = coverContext;
    context.clearRect(0, 0, width, height);
    context.fillStyle = cloth;
    context.fillRect(0, 0, width, height);
    const light = context.createLinearGradient(0, 0, width, height);
    light.addColorStop(0, "rgba(255,255,248,0.22)");
    light.addColorStop(0.42, "rgba(255,255,255,0.02)");
    light.addColorStop(1, "rgba(0,0,0,0.28)");
    context.fillStyle = light;
    context.fillRect(0, 0, width, height);
    context.save();
    context.globalAlpha = 0.13;
    context.strokeStyle = coverInk;
    context.lineWidth = 1;
    for (let index = 0; index < 170; index += 1) {
      const x = (index * 47 + Number(code) * 23) % width;
      const y = (index * 83 + Number(code) * 31) % height;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 14 + (index % 5) * 8, y + ((index % 3) - 1) * 1.4);
      context.stroke();
    }
    context.restore();

    context.strokeStyle = band;
    context.lineWidth = 4;
    context.strokeRect(32, 32, width - 64, height - 64);
    context.lineWidth = 1.5;
    context.strokeRect(45, 45, width - 90, height - 90);
    context.fillStyle = band;
    context.fillRect(45, 88, width - 90, 7);
    context.fillRect(45, height - 95, width - 90, 7);

    context.fillStyle = coverInk;
    context.textAlign = "center";
    context.font = font(false, 18, "700");
    context.fillText("N1GHT CHXN9 · PRIVATE EDITION", width / 2, 73);
    context.strokeStyle = band;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(width / 2, 173, 35, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = band;
    context.font = font(true, 22, "600");
    context.fillText("読", width / 2, 181);

    const titleFit = fitTitleLines(context, title, width - 142, 102, 45, 3);
    context.fillStyle = coverInk;
    context.font = font(true, titleFit.size, "600");
    const titleStart = 350 - ((titleFit.lines.length - 1) * titleFit.size * 1.13) / 2;
    titleFit.lines.forEach((line, lineIndex) => {
      context.fillText(line, width / 2, titleStart + lineIndex * titleFit.size * 1.13, width - 142);
    });
    context.fillStyle = band;
    context.fillRect(width / 2 - 78, 464, 156, 2);
    context.fillStyle = coverInk;
    context.font = font(false, 21, "600");
    context.fillText(spine.toUpperCase(), width / 2, 507, width - 150);
    context.font = font(true, 27, "500");
    context.fillText(author, width / 2, 562, width - 150);

    context.strokeStyle = band;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(102, height - 184);
    context.lineTo(width - 102, height - 184);
    context.stroke();
    context.fillStyle = coverInk;
    context.font = font(false, 14, "600");
    context.fillText("A VOLUME IN THE READING ROOM", width / 2, height - 145);
    context.fillStyle = band;
    context.font = font(false, 16, "700");
    context.fillText(code, width / 2, height - 94);
    coverTexture.needsUpdate = true;
  }
  function redrawVolume() {
    drawCover(items[state.selected], state.selected);
    drawInsidePages(items[state.selected], state.selected);
  }
  function selectBook(index, announce = true) {
    const next = ((Number(index) || 0) % items.length + items.length) % items.length;
    const previous = state.selected;
    state.selected = next;
    state.direction = next === previous ? state.direction : next > previous ? 1 : -1;
    state.opening = 0;
    visualOpening = reducedMotion() ? 0 : visualOpening;
    selectionKick = reducedMotion() ? 0 : 1;
    redrawVolume();
    const item = items[state.selected];
    if (announce) {
      status(`第 ${bookCode(item, state.selected)} 册 · ${bookTitle(item)} · ${bookAuthor(item)}`);
    }
    invalidate();
    return state.selected;
  }
  function setCoverOpen(open, announce = true) {
    state.opening = open ? 1 : 0;
    if (reducedMotion()) visualOpening = state.opening;
    if (announce) {
      status(
        open
          ? `书封已翻开 · ${bookAuthor(items[state.selected])} · 点按书面进入馆藏详情`
          : "书封已合上，黄铜拨片可以继续换书。",
      );
    }
    invalidate();
    return state.opening;
  }
  function openSelected() {
    if (state.opening < 0.5) {
      setCoverOpen(true);
      return false;
    }
    if (typeof kit.onSelect === "function") kit.onSelect("books", state.selected);
    else if (typeof kit.onItemSelect === "function") kit.onItemSelect(items[state.selected]);
    status(`正在阅读《${bookTitle(items[state.selected])}》的完整馆藏记录。`);
    return true;
  }

  register(cover, {
    id: "books-current-cover",
    label: "当前藏书封面",
    hint: "点按封面将它翻开，翻开后点按书面进入作品详情",
    anchor: [0, coverHeight * 0.18, 0.075],
    onClick() {
      if (state.opening < 0.5) setCoverOpen(true);
      else openSelected();
    },
  });
  register(pageProxy, {
    id: "books-reading-page",
    label: "翻开后的藏书页",
    hint: "点按真实作者与藏书文字所在的书面，进入当前作品详情",
    anchor: [0, 0, 0.02],
    onClick() {
      openSelected();
    },
  });

  function updateVisuals(time) {
    const opening = clamp(visualOpening, 0, 1);
    coverPivot.rotation.y = opening * Math.PI * 0.93;
    coverPivot.position.z = 0.215 + Math.sin(opening * Math.PI) * 0.075;
    coverPivot.rotation.z = Math.sin(opening * Math.PI) * -0.012;
    bookRoot.rotation.z = state.direction * selectionKick * 0.007;
    bookRoot.position.y = 2.56 + Math.sin(time * 0.00075) * 0.008 + Math.sin(opening * Math.PI) * 0.018;
    folioWings.forEach(({ node, side, layer }) => {
      node.position.x = side * (1.8 + layer * 0.1) + opening * side * 0.035;
      node.position.y = 2.38 - layer * 0.025 + Math.sin(time * 0.0006 + layer) * 0.004;
      node.rotation.z = side * (0.015 + layer * 0.006) + selectionKick * side * 0.006;
    });
    paddleRoots.forEach(({ root, direction, baseX }) => {
      root.position.x = baseX + selectionKick * direction * 0.04;
      root.position.z = 0.37 + selectionKick * direction * 0.055;
      root.rotation.y = selectionKick * direction * 0.025;
    });
    openingHandle.position.z = 1.24 + opening * 0.11;
    openingHandle.rotation.x = opening * -0.035;
    readingLight.intensity = 10.8 + opening * 4.4;
    reflectedWarmth.intensity = 2.7 + opening * 1.4;
  }

  redrawVolume();
  updateVisuals(0);
  status(`阅览室已就位 · ${bookTitle(items[0])} · 拨动两侧黄铜拨片换书，拉手翻开书封。`);

  return {
    group,
    focus: new THREE.Vector3(0, 2.55, 0),
    update(time, delta, active) {
      activeNow = Boolean(active);
      if (!activeNow) return;
      const dt = clamp(Number(delta) || 0, 0, 0.08);
      visualOpening = reducedMotion()
        ? state.opening
        : damp(visualOpening, state.opening, 7.4, dt || 0.016);
      selectionKick = reducedMotion()
        ? 0
        : damp(selectionKick, 0, 5.2, dt || 0.016);
      updateVisuals(Number(time) || 0);
      if (!reducedMotion() && (Math.abs(visualOpening - state.opening) > 0.001 || selectionKick > 0.001)) {
        invalidate();
      }
    },
    interact(action, index) {
      if (action === "select" || action === "next" || action === "previous") {
        const value = Number(index);
        const delta = action === "next" ? 1 : action === "previous" ? -1 : 0;
        return selectBook(Number.isFinite(value) ? value : state.selected + delta, false);
      }
      if (action === "extend" || action === "open" || action === "turn" || action === "page") {
        return setCoverOpen(state.opening < 0.5);
      }
      if (action === "reveal" || action === "read") return openSelected();
      if (action === "reset") {
        state.selected = 0;
        state.opening = 0;
        state.direction = 1;
        visualOpening = 0;
        selectionKick = 0;
        redrawVolume();
        updateVisuals(0);
        status("阅览室已经复位，第一册藏书回到合上的封面。");
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
        author: bookAuthor(item),
        opening: Number(state.opening.toFixed(3)),
        coverOpen: state.opening >= 0.5,
        detailsUnlocked: state.opening >= 0.5,
        bookCount: items.length,
        exhibitWidth: 8.32,
        exhibitHeight: 4.68,
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
