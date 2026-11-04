const OWNED_ROOMS = new Set(["photo", "books", "poems", "paintings", "curate"]);

export function buildRoom(id, ctx) {
  if (!OWNED_ROOMS.has(id)) return null;
  if (!ctx?.THREE) throw new Error(`rooms-a: missing THREE context for ${id}`);

  switch (id) {
    case "photo":
      return buildPhotoRoom(ctx);
    case "books":
      return buildBooksRoom(ctx);
    case "poems":
      return buildPoemsRoom(ctx);
    case "paintings":
      return buildPaintingsRoom(ctx);
    case "curate":
      return buildCurateRoom(ctx);
    default:
      return null;
  }
}

function buildPhotoRoom(ctx) {
  const THREE = ctx.THREE;
  const group = new THREE.Group();
  group.name = "光轨暗房";
  const items = safeItems(ctx.items).slice(0, 12);
  const narrow = isNarrowViewport();
  const reduced = Boolean(ctx.reducedMotion);
  const initial = view(narrow ? [0, 3.2, 13.8] : [0, 3.35, 10.4], [0, 2.35, -1.1]);
  const printEntries = [];
  const lightNodes = [];

  addRoomLights(THREE, group, {
    hemi: 0x17232a,
    ground: 0x050708,
    intensity: 0.72,
    points: [
      [-3.4, 4.8, 1.8, 0x9cdaff, 24, 10],
      [3.6, 3.4, -2.4, 0xffb96b, 17, 9],
    ],
  });

  const graphite = standard(THREE, 0x080b0d, { roughness: 0.88, metalness: 0.32 });
  const frameMat = standard(THREE, 0x181d20, { roughness: 0.4, metalness: 0.82 });
  const railMat = standard(THREE, 0x332c25, {
    roughness: 0.34,
    metalness: 0.9,
    emissive: 0x2c1205,
    emissiveIntensity: 1.1,
  });
  const lightMat = emissive(THREE, 0xffd7a0, 4.4);
  const coolLightMat = emissive(THREE, 0x8bdcff, 3.6);
  const paperMat = standard(THREE, 0xb7aea3, { roughness: 0.72, metalness: 0.05 });
  const hitMaterial = invisibleMaterial(THREE);

  const floor = mesh(
    THREE,
    new THREE.PlaneGeometry(24, 22),
    graphite,
    group,
    [0, -0.05, -3.8],
    [-Math.PI / 2, 0, 0]
  );
  floor.name = "darkroom-floor";

  const railCurves = [
    curve(THREE, [
      [-6.8, 5.9, 1.8],
      [-4.8, 4.3, -0.7],
      [-2.2, 4.8, -3.5],
      [0.1, 3.9, -4.1],
      [2.8, 4.7, -3.4],
      [5.4, 4.1, -0.6],
      [7, 5.7, 2.2],
    ]),
    curve(THREE, [
      [-5.6, 1.1, 1.5],
      [-3.6, 0.7, -1.7],
      [-0.8, 1.45, -3.8],
      [2.2, 0.75, -3.1],
      [5.4, 1.2, -0.3],
    ]),
    curve(THREE, [
      [-4.8, 7.3, -2.3],
      [-1.8, 6.1, -5.7],
      [1.9, 6.4, -5.4],
      [4.9, 7.5, -2.1],
    ]),
  ];

  railCurves.forEach((rail, index) => {
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(rail, 64, index === 0 ? 0.038 : 0.026, 8, false),
      railMat
    );
    group.add(tube);

    for (let nodeIndex = 0; nodeIndex < 12; nodeIndex += 1) {
      const point = rail.getPoint((nodeIndex + 0.35) / 12);
      const node = mesh(
        THREE,
        new THREE.SphereGeometry(index === 0 ? 0.055 : 0.043, 10, 8),
        index % 2 ? coolLightMat : lightMat,
        group,
        point
      );
      lightNodes.push({ node, phase: nodeIndex * 0.42 + index });
    }
  });

  const anchorPositions = narrow
    ? [
        [-2.25, 2.5, -1.5, -0.13],
        [0, 2.85, -0.75, 0],
        [2.25, 2.5, -1.5, 0.13],
        [-2.05, 4.1, -4.15, 0.1],
        [0, 4.45, -3.55, 0],
        [2.05, 4.1, -4.15, -0.1],
        [-1.35, 1.15, -3.6, 0.08],
        [0, 1.15, -3.15, 0],
        [1.35, 1.15, -3.6, -0.08],
      ]
    : [
        [-4.2, 2.45, -1.55, -0.24],
        [-2.1, 3.05, -0.65, -0.1],
        [0, 2.35, -1.2, 0],
        [2.1, 3.05, -0.65, 0.1],
        [4.2, 2.45, -1.55, 0.24],
        [-3.65, 4.15, -4.0, 0.16],
        [-1.8, 4.55, -3.15, 0.04],
        [1.8, 4.55, -3.15, -0.04],
        [3.65, 4.15, -4.0, -0.16],
        [-2.35, 1.2, -4.2, 0.1],
        [0, 1.18, -3.35, 0],
        [2.35, 1.2, -4.2, -0.1],
      ];

  items.forEach((item, index) => {
    const placement = anchorPositions[index];
    const holder = new THREE.Group();
    holder.position.set(placement[0], placement[1], placement[2]);
    holder.rotation.y = placement[3];
    holder.userData.baseY = placement[1];
    holder.userData.baseZ = placement[2];
    group.add(holder);

    const hero = index === 0 || index === 1;
    const maxWidth = hero ? (narrow ? 2.35 : 2.7) : narrow ? 1.75 : 2.05;
    const maxHeight = hero ? 1.95 : 1.42;
    const image = artworkPlane(ctx, item, maxWidth, maxHeight);
    if (image) {
      holder.add(image.object);
      image.object.position.z = 0.042;
    } else {
      addLabel(THREE, holder, ctx, "FRAME / NO LOCAL IMAGE", 0.105, "#c8bca9", [0, 0, 0.05]);
    }

    const width = image?.width || maxWidth;
    const height = image?.height || maxHeight;
    addFrame(THREE, holder, width, height, frameMat, paperMat);

    const lower = holder.localToWorld(new THREE.Vector3(0, -height / 2 - 0.38, 0));
    const upper = holder.localToWorld(new THREE.Vector3(0, height / 2 + 0.42, 0));
    addCable(THREE, group, upper, [upper.x, 6.2, upper.z - 0.6], coolLightMat);
    addCable(THREE, group, lower, [lower.x, 0.06, lower.z + 0.4], railMat);

    const hit = addPickBox(
      THREE,
      holder,
      ctx,
      hitMaterial,
      width + 0.22,
      height + 0.22,
      0.22,
      [0, 0, 0.08],
      index
    );
    hit.userData.kind = "photo";

    addLabel(
      THREE,
      holder,
      ctx,
      `${String(index + 1).padStart(2, "0")} / ${clipText(itemTitle(item), 28)}`,
      0.112,
      "#e5d8c7",
      [0, -height / 2 - 0.18, 0.09]
    );

    printEntries.push({
      index,
      holder,
      hit,
      width,
      height,
      theta: placement[3],
      position: new THREE.Vector3(placement[0], placement[1], placement[2]),
      phase: index * 0.68,
    });
  });

  if (!items.length) {
    addEmptyFrame(THREE, group, ctx, frameMat, paperMat, "光轨暗房\n暂无照片记录", [0, 2.5, -1.5], 3.1, 2.15);
  }

  addLabel(THREE, group, ctx, "LIGHT RAIL / CONTACT SHEET", 0.15, "#9fcce0", [0, 6.85, -3.8]);
  addFloorGuides(THREE, group, railMat, 4.8);

  let selected = -1;

  return {
    group,
    camera: initial,
    update(time, dt) {
      const step = Math.max(0, Math.min(dt || 0, 0.05));
      if (reduced) return;
      const pulse = 3.2 + Math.sin(time * 1.45) * 0.75;
      lightMat.emissiveIntensity = pulse;
      coolLightMat.emissiveIntensity = 2.55 + Math.sin(time * 1.1 + 1.2) * 0.55;
      lightNodes.forEach(({ node, phase }, index) => {
        const scale = 0.78 + Math.sin(time * 1.7 + phase) * 0.2;
        node.scale.setScalar(scale);
        node.position.y += Math.sin(time * 0.7 + phase) * 0.0007 * (index % 2 ? 1 : -1);
      });
      printEntries.forEach((entry) => {
        const chosen = entry.index === selected;
        const targetY = entry.holder.userData.baseY + (chosen ? 0.13 : 0) + Math.sin(time * 0.55 + entry.phase) * 0.018;
        const targetZ = entry.holder.userData.baseZ + (chosen ? 0.28 : 0);
        entry.holder.position.y += (targetY - entry.holder.position.y) * Math.min(1, step * 4.5);
        entry.holder.position.z += (targetZ - entry.holder.position.z) * Math.min(1, step * 4);
        entry.holder.rotation.z = chosen ? Math.sin(time * 0.4) * 0.006 : 0;
      });
    },
    focus(index) {
      const entry = printEntries.find((candidate) => candidate.index === index);
      if (!entry) return initial;
      selected = index;
      const normal = new THREE.Vector3(Math.sin(entry.theta), 0, Math.cos(entry.theta));
      const distance = (narrow ? 4.65 : 3.25) + entry.width * 0.2;
      const target = new THREE.Vector3(entry.position.x, entry.position.y, entry.position.z);
      target.addScaledVector(normal, 0.2);
      const position = target.clone().addScaledVector(normal, distance);
      position.y += entry.height * 0.12;
      return view(position.toArray(), target.toArray());
    },
  };
}

function buildBooksRoom(ctx) {
  const THREE = ctx.THREE;
  const group = new THREE.Group();
  group.name = "重力书库";
  const items = safeItems(ctx.items).slice(0, 12);
  const narrow = isNarrowViewport();
  const reduced = Boolean(ctx.reducedMotion);
  const initial = view(narrow ? [0, 3.1, 13.5] : [0, 3.2, 10.2], [0, 2.3, -2.05]);
  const books = [];
  const coreRings = [];

  addRoomLights(THREE, group, {
    hemi: 0x121c1e,
    ground: 0x050606,
    intensity: 0.78,
    points: [
      [0, 4.6, 1.8, 0xd4e4c3, 34, 12],
      [-4.1, 2.1, -2.3, 0x7da8a1, 20, 9],
      [4.1, 2.1, -2.3, 0xc89557, 16, 9],
    ],
  });

  const shelfMat = standard(THREE, 0x1a2421, { roughness: 0.72, metalness: 0.38 });
  const edgeMat = standard(THREE, 0x94764f, { roughness: 0.35, metalness: 0.75 });
  const pageMat = standard(THREE, 0xbfb49d, { roughness: 0.92, metalness: 0 });
  const coreMat = standard(THREE, 0x050708, {
    roughness: 0.34,
    metalness: 0.74,
    emissive: 0x0c2020,
    emissiveIntensity: 1.1,
  });
  const coreGlow = emissive(THREE, 0x93f3d5, 4.2);
  const warmGlow = emissive(THREE, 0xd9ab6c, 2.2);
  const hitMaterial = invisibleMaterial(THREE);

  const floor = mesh(
    THREE,
    new THREE.CircleGeometry(9.5, 72),
    standard(THREE, 0x070b0b, { roughness: 0.78, metalness: 0.42 }),
    group,
    [0, -0.06, -1.1],
    [-Math.PI / 2, 0, 0]
  );
  floor.name = "library-floor";

  const well = mesh(THREE, new THREE.CylinderGeometry(0.58, 0.86, 5.7, 32), coreMat, group, [0, 2.65, -1.35]);
  well.name = "gravity-well";
  for (let level = 0; level < 6; level += 1) {
    const ring = mesh(
      THREE,
      new THREE.TorusGeometry(1.08 + level * 0.09, 0.032, 8, 64),
      level % 2 ? warmGlow : coreGlow,
      group,
      [0, 0.75 + level * 0.82, -1.35],
      [Math.PI / 2, 0, level * 0.16]
    );
    coreRings.push({ ring, speed: (level % 2 ? -1 : 1) * (0.08 + level * 0.012), baseY: ring.position.y });
  }

  const shelfLevels = [0.72, 2.22, 3.72];
  const shelfAngles = [-0.8, -0.27, 0.27, 0.8];
  const radius = narrow ? 2.75 : 3.45;

  shelfLevels.forEach((shelfY, shelfIndex) => {
    const shelfCurve = curve(
      THREE,
      [-1.22, -0.8, -0.4, 0, 0.4, 0.8, 1.22].map((angle) => [
        Math.sin(angle) * radius,
        shelfY,
        -Math.cos(angle) * radius - 1.35,
      ])
    );
    group.add(new THREE.Mesh(new THREE.TubeGeometry(shelfCurve, 64, 0.075, 8, false), edgeMat));

    const lipCurve = curve(
      THREE,
      [-1.22, -0.8, -0.4, 0, 0.4, 0.8, 1.22].map((angle) => [
        Math.sin(angle) * (radius - 0.24),
        shelfY - 0.11,
        -Math.cos(angle) * (radius - 0.24) - 1.35,
      ])
    );
    group.add(new THREE.Mesh(new THREE.TubeGeometry(lipCurve, 64, 0.045, 6, false), coreGlow));

    shelfAngles.forEach((angle, slotIndex) => {
      const supportAngle = angle + 0.12;
      const support = addBox(
        THREE,
        group,
        [0.06, 0.82, 1.12],
        shelfMat,
        [
          Math.sin(supportAngle) * (radius - 0.56),
          shelfY - 0.34,
          -Math.cos(supportAngle) * (radius - 0.56) - 1.35,
        ],
        [0, -supportAngle, 0]
      );
      support.name = `library-support-${shelfIndex}-${slotIndex}`;
    });
  });

  items.forEach((item, index) => {
    const tier = index % 3;
    const angle = shelfAngles[Math.floor(index / 3)] || 0;
    const bodyHeight = 0.92 + hashNumber(`${itemTitle(item)}-${index}`) * 0.38;
    const bodyWidth = 0.26 + hashNumber(`width-${index}`) * 0.18;
    const bodyDepth = 0.68 + hashNumber(`depth-${index}`) * 0.18;
    const book = new THREE.Group();
    book.position.set(Math.sin(angle) * radius, shelfLevels[tier] + bodyHeight / 2 + 0.07, -Math.cos(angle) * radius - 1.35);
    book.rotation.y = -angle;
    book.userData.baseY = book.position.y;
    group.add(book);

    const fieldSource = originalFields(item);
    const cloth = String(fieldSource.cloth || fieldSource.cover || fieldSource.color || "");
    const ink = String(fieldSource.ink || fieldSource.textColor || "");
    const coverColor = colorFromText(cloth, BOOK_COLORS[index % BOOK_COLORS.length]);
    const inkColor = colorFromText(ink, "#e8dfcf");
    const cover = standard(THREE, coverColor, { roughness: 0.74, metalness: 0.08 });
    const body = mesh(
      THREE,
      extrudedBookGeometry(THREE, bodyWidth, bodyHeight, bodyDepth),
      cover,
      book,
      [0, 0, 0]
    );
    body.name = `book-${index}`;
    ctx.pick(body, index);

    addBox(THREE, book, [bodyWidth + 0.028, 0.055, bodyDepth + 0.018], pageMat, [0, bodyHeight * 0.43, 0]);
    addBox(THREE, book, [bodyWidth + 0.028, 0.055, bodyDepth + 0.018], pageMat, [0, -bodyHeight * 0.43, 0]);
    addBox(THREE, book, [bodyWidth * 0.42, bodyHeight * 0.84, 0.035], edgeMat, [0, 0, bodyDepth / 2 + 0.02]);

    for (let groove = -1; groove <= 1; groove += 1) {
      addBox(
        THREE,
        book,
        [bodyWidth + 0.03, 0.014, 0.018],
        coreGlow,
        [0, groove * bodyHeight * 0.22, bodyDepth / 2 + 0.04]
      );
    }

    addLabel(
      THREE,
      book,
      ctx,
      `${clipText(itemTitle(item), narrow ? 15 : 19)}\n${clipText(fieldText(item, "author", "creator", "subtitle"), 20)}`,
      0.095,
      inkColor,
      [0, 0, bodyDepth / 2 + 0.055]
    );

    const shelfTitle = fieldText(item, "collection", "shelf", "form");
    if (shelfTitle) {
      addLabel(
        THREE,
        book,
        ctx,
        clipText(shelfTitle, 14),
        0.06,
        "#a9c8c0",
        [0, -bodyHeight / 2 - 0.12, bodyDepth / 2 + 0.04]
      );
    }

    const hit = addPickBox(
      THREE,
      book,
      ctx,
      hitMaterial,
      bodyWidth + 0.22,
      bodyHeight + 0.16,
      bodyDepth + 0.18,
      [0, 0, 0],
      index
    );
    hit.userData.kind = "book";
    books.push({
      index,
      book,
      body,
      angle,
      radius,
      height: bodyHeight,
      basePosition: book.position.clone(),
      phase: index * 0.63,
      inward: new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)),
    });
  });

  if (!items.length) {
    addLabel(THREE, group, ctx, "重力书库\n等待第一本书", 0.25, "#c9d7cf", [0, 2.7, 1.85]);
  }

  const floorArc = curve(
    THREE,
    [-1.18, -0.7, 0, 0.7, 1.18].map((angle) => [
      Math.sin(angle) * 6.8,
      0.012,
      -Math.cos(angle) * 6.8 - 1.35,
    ])
  );
  group.add(new THREE.Mesh(new THREE.TubeGeometry(floorArc, 48, 0.012, 5, false), coreGlow));

  let selected = -1;

  return {
    group,
    camera: initial,
    update(time, dt) {
      const step = Math.max(0, Math.min(dt || 0, 0.05));
      if (reduced) return;
      coreGlow.emissiveIntensity = 3.35 + Math.sin(time * 1.15) * 0.55;
      warmGlow.emissiveIntensity = 1.9 + Math.sin(time * 0.82 + 0.8) * 0.35;
      coreRings.forEach(({ ring, speed, baseY }) => {
        ring.rotation.z += speed * step;
        ring.position.y = baseY + Math.sin(time * 0.46 + baseY) * 0.025;
      });
      books.forEach((entry) => {
        const chosen = entry.index === selected;
        const drift = chosen ? 0.12 : 0;
        const target = entry.basePosition.clone().addScaledVector(entry.inward, drift);
        target.y += Math.sin(time * 0.62 + entry.phase) * 0.018;
        entry.book.position.lerp(target, Math.min(1, step * (chosen ? 6 : 2.4)));
        entry.book.rotation.z = chosen ? Math.sin(time * 0.42) * 0.008 : 0;
      });
    },
    focus(index) {
      const entry = books.find((candidate) => candidate.index === index);
      if (!entry) return initial;
      selected = index;
      const target = entry.basePosition.clone();
      target.y += entry.height * 0.1;
      const position = target.clone().addScaledVector(entry.inward, narrow ? 3.25 : 2.35);
      position.y += 0.12;
      return view(position.toArray(), target.toArray());
    },
  };
}

function buildPoemsRoom(ctx) {
  const THREE = ctx.THREE;
  const group = new THREE.Group();
  group.name = "回声井";
  const items = safeItems(ctx.items).slice(0, 9);
  const narrow = isNarrowViewport();
  const reduced = Boolean(ctx.reducedMotion);
  const initial = view(narrow ? [0, 3.7, 13.8] : [0, 3.75, 10.4], [0, 3.15, -0.8]);
  const rings = [];
  const verseEntries = [];

  addRoomLights(THREE, group, {
    hemi: 0x141a1d,
    ground: 0x030404,
    intensity: 0.64,
    points: [
      [0, 7.1, 0.4, 0xb9e7ff, 31, 12],
      [-3.4, 2.8, 1.8, 0xffc78b, 14, 8],
    ],
  });

  const shaftMat = standard(THREE, 0x0b1113, {
    roughness: 0.69,
    metalness: 0.54,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.84,
  });
  const ceramicMat = standard(THREE, 0x202a2d, { roughness: 0.48, metalness: 0.58 });
  const ringMat = standard(THREE, 0x3b4749, {
    roughness: 0.27,
    metalness: 0.86,
    emissive: 0x17333a,
    emissiveIntensity: 1.6,
  });
  const blueGlow = emissive(THREE, 0xa4e8ff, 3.5);
  const warmGlow = emissive(THREE, 0xf2c083, 2.3);
  const plateMat = standard(THREE, 0x11191b, {
    roughness: 0.3,
    metalness: 0.74,
    transparent: true,
    opacity: 0.86,
  });
  const hitMaterial = invisibleMaterial(THREE);

  const well = mesh(
    THREE,
    new THREE.CylinderGeometry(1.56, 2.12, 7.8, 48, 1, true),
    shaftMat,
    group,
    [0, 3.8, -0.8]
  );
  well.name = "echo-well";

  for (let level = 0; level < 11; level += 1) {
    const radius = 2.15 - level * 0.095;
    const ring = mesh(
      THREE,
      new THREE.TorusGeometry(radius, level % 3 === 0 ? 0.05 : 0.025, 8, 96),
      level % 3 === 0 ? warmGlow : ringMat,
      group,
      [0, 0.25 + level * 0.68, -0.8],
      [Math.PI / 2, 0, level * 0.08]
    );
    rings.push({ ring, baseY: ring.position.y, phase: level * 0.31, speed: (level % 2 ? -1 : 1) * 0.07 });
  }

  const bracketAngles = [-1.22, -0.86, -0.4, 0.4, 0.86, 1.22];
  bracketAngles.forEach((angle, index) => {
    const start = new THREE.Vector3(Math.sin(angle) * 2.18, 0.1, Math.cos(angle) * 2.18 - 0.8);
    const end = new THREE.Vector3(Math.sin(angle) * 1.54, 7.85, Math.cos(angle) * 1.54 - 0.8);
    const ribbon = curve(THREE, [start, start.clone().lerp(end, 0.34), start.clone().lerp(end, 0.7), end]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(ribbon, 40, index % 2 ? 0.018 : 0.026, 6, false), index % 2 ? ringMat : blueGlow));
  });

  items.forEach((item, index) => {
    const side = index % 2 ? 1 : -1;
    const row = Math.floor(index / 2);
    const y = 1.15 + row * 1.22 + (side > 0 ? 0.28 : 0);
    const angle = side * (0.46 + row * 0.09);
    const radius = narrow ? 1.46 : 1.72;
    const position = new THREE.Vector3(Math.sin(angle) * radius, y, Math.cos(angle) * radius - 0.8);
    const holder = new THREE.Group();
    holder.position.copy(position);
    holder.userData.baseY = y;
    group.add(holder);

    const plateWidth = narrow ? 1.45 : 1.72;
    const plateHeight = 0.78;
    addBox(THREE, holder, [plateWidth, plateHeight, 0.035], plateMat, [0, 0, 0]);
    addBox(THREE, holder, [0.024, plateHeight + 0.08, 0.08], index % 2 ? warmGlow : blueGlow, [-plateWidth / 2 - 0.02, 0, 0.035]);
    addBox(THREE, holder, [plateWidth + 0.08, 0.025, 0.08], index % 2 ? warmGlow : blueGlow, [0, -plateHeight / 2 - 0.03, 0.035]);

    const verse = firstVerse(itemText(item));
    const title = clipText(itemTitle(item), narrow ? 18 : 24);
    const body = verse ? clipText(verse, narrow ? 42 : 58) : clipText(fieldText(item, "author", "subtitle"), 32);
    addLabel(THREE, holder, ctx, `${title}\n${body}`, 0.084, "#dfe8e5", [0, 0.08, 0.048]);
    addLabel(THREE, holder, ctx, String(index + 1).padStart(2, "0"), 0.055, "#f2c88f", [-plateWidth / 2 + 0.12, -plateHeight / 2 + 0.11, 0.05]);

    const hit = addPickBox(
      THREE,
      holder,
      ctx,
      hitMaterial,
      plateWidth + 0.14,
      plateHeight + 0.14,
      0.18,
      [0, 0, 0.06],
      index
    );
    hit.userData.kind = "poem";

    const tether = curve(THREE, [
      [Math.sin(angle) * 1.58, y, Math.cos(angle) * 1.58 - 0.8],
      [Math.sin(angle) * 1.9, y + 0.25, Math.cos(angle) * 1.9 - 0.8],
      position.toArray(),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(tether, 20, 0.012, 5, false), index % 2 ? warmGlow : blueGlow));

    verseEntries.push({
      index,
      holder,
      hit,
      position,
      phase: index * 0.74,
      width: plateWidth,
    });
  });

  if (!items.length) {
    addLabel(THREE, group, ctx, "回声井\n暂无诗篇", 0.28, "#c6dce0", [0, 3.5, 1.35]);
  }

  const floor = mesh(
    THREE,
    new THREE.RingGeometry(2.2, 6.4, 64),
    ceramicMat,
    group,
    [0, -0.04, -0.8],
    [-Math.PI / 2, 0, 0]
  );
  floor.name = "echo-floor";

  let selected = -1;

  return {
    group,
    camera: initial,
    update(time, dt) {
      const step = Math.max(0, Math.min(dt || 0, 0.05));
      if (reduced) return;
      ringMat.emissiveIntensity = 1.35 + Math.sin(time * 1.2) * 0.35;
      blueGlow.emissiveIntensity = 3.05 + Math.sin(time * 0.9 + 0.5) * 0.65;
      warmGlow.emissiveIntensity = 2.0 + Math.sin(time * 0.73 + 1.8) * 0.35;
      rings.forEach(({ ring, baseY, phase, speed }) => {
        ring.rotation.z += speed * step;
        ring.position.y = baseY + Math.sin(time * 0.52 + phase) * 0.032;
      });
      verseEntries.forEach((entry) => {
        const chosen = entry.index === selected;
        const targetY = entry.holder.userData.baseY + (chosen ? 0.11 : 0) + Math.sin(time * 0.47 + entry.phase) * 0.012;
        entry.holder.position.y += (targetY - entry.holder.position.y) * Math.min(1, step * 4.5);
        const targetScale = chosen ? 1.045 : 1;
        const scale = entry.holder.scale.x + (targetScale - entry.holder.scale.x) * Math.min(1, step * 5);
        entry.holder.scale.setScalar(scale);
      });
    },
    focus(index) {
      const entry = verseEntries.find((candidate) => candidate.index === index);
      if (!entry) return initial;
      selected = index;
      const target = entry.position.clone();
      target.y += 0.04;
      const position = target.clone().add(new THREE.Vector3(entry.position.x * 0.36, 0.34, narrow ? 4.3 : 3.15));
      return view(position.toArray(), target.toArray());
    },
  };
}

function buildPaintingsRoom(ctx) {
  const THREE = ctx.THREE;
  const group = new THREE.Group();
  group.name = "恒光穹殿";
  const items = safeItems(ctx.items).slice(0, 9);
  const narrow = isNarrowViewport();
  const reduced = Boolean(ctx.reducedMotion);
  const initial = view(narrow ? [0, 3.45, 14.2] : [0, 3.35, 10.8], [0, 2.85, -3.5]);
  const paintingEntries = [];
  const haloMaterials = [];
  const floorLamps = [];

  addRoomLights(THREE, group, {
    hemi: 0x211d18,
    ground: 0x070604,
    intensity: 0.82,
    points: [
      [0, 6.3, 2.5, 0xffedc6, 44, 14],
      [-4.3, 3.8, -0.4, 0xffc872, 20, 10],
      [4.3, 3.8, -0.4, 0x9bc4d5, 16, 10],
    ],
  });

  const wallMat = standard(THREE, 0x29251f, { roughness: 0.64, metalness: 0.24 });
  const wallInsetMat = standard(THREE, 0x080909, { roughness: 0.46, metalness: 0.52 });
  const goldMat = standard(THREE, 0x6e583c, { roughness: 0.28, metalness: 0.88 });
  const ivoryMat = standard(THREE, 0xb8ad99, { roughness: 0.76, metalness: 0.03 });
  const warmGlow = emissive(THREE, 0xffdca4, 3.6);
  const coolGlow = emissive(THREE, 0x9bcdd9, 2.2);
  const hitMaterial = invisibleMaterial(THREE);

  const radius = narrow ? 4.6 : 5.25;
  const wallSegments = 30;
  for (let segment = 0; segment < wallSegments; segment += 1) {
    const angle = -1.4 + (segment / (wallSegments - 1)) * 2.8;
    const segmentArc = 2.8 / (wallSegments - 1);
    const width = 2 * (radius + 0.32) * Math.sin(segmentArc / 2) + 0.07;
    addBox(
      THREE,
      group,
      [width, 7.1, 0.32],
      wallMat,
      [Math.sin(angle) * (radius + 0.32), 3.4, -Math.cos(angle) * (radius + 0.32) - 0.8],
      [0, -angle, 0]
    );
  }

  const floor = mesh(
    THREE,
    new THREE.CircleGeometry(narrow ? 9.2 : 10.4, 80),
    standard(THREE, 0x0b0b09, { roughness: 0.7, metalness: 0.38 }),
    group,
    [0, -0.06, -0.8],
    [-Math.PI / 2, 0, 0]
  );
  floor.name = "paintings-floor";

  const inlay = curve(
    THREE,
    [-1.42, -0.95, -0.5, 0, 0.5, 0.95, 1.42].map((angle) => [
      Math.sin(angle) * 7.25,
      0.012,
      -Math.cos(angle) * 7.25 - 0.8,
    ])
  );
  group.add(new THREE.Mesh(new THREE.TubeGeometry(inlay, 64, 0.018, 5, false), warmGlow));

  const sideAngles = [0, -0.39, 0.39, -0.78, 0.78, -1.14, 1.14, -1.4, 1.4];
  items.forEach((item, index) => {
    const angle = narrow ? (index === 0 ? 0 : sideAngles[index] * 0.82) : sideAngles[index] || 0;
    const hero = index === 0;
    const level = hero ? 2.95 : index % 2 === 0 ? 2.24 : 4.08;
    const maxWidth = hero ? 2.72 : index < 5 ? 1.56 : 1.22;
    const maxHeight = hero ? 2.7 : index < 5 ? 1.78 : 1.44;
    const image = artworkPlane(ctx, item, maxWidth, maxHeight);
    const holder = new THREE.Group();
    holder.position.set(
      Math.sin(angle) * radius,
      level,
      -Math.cos(angle) * radius - 0.8
    );
    holder.rotation.y = -angle;
    holder.userData.baseZ = holder.position.z;
    holder.userData.baseScale = 1;
    group.add(holder);

    const width = image?.width || maxWidth;
    const height = image?.height || maxHeight;
    const nicheWidth = width + (hero ? 0.66 : 0.42);
    const nicheHeight = height + (hero ? 0.62 : 0.4);

    addBox(
      THREE,
      holder,
      [nicheWidth, nicheHeight, 0.16],
      wallInsetMat,
      [0, 0, -0.18]
    );
    addBox(THREE, holder, [nicheWidth + 0.12, 0.1, 0.24], goldMat, [0, -nicheHeight / 2, -0.02]);
    addBox(THREE, holder, [0.1, nicheHeight + 0.12, 0.24], goldMat, [-nicheWidth / 2, 0, -0.02]);
    addBox(THREE, holder, [0.1, nicheHeight + 0.12, 0.24], goldMat, [nicheWidth / 2, 0, -0.02]);

    const archRadius = nicheWidth / 2;
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(archRadius, 0.055, 8, 48, Math.PI),
      goldMat
    );
    arch.position.set(0, nicheHeight / 2, -0.02);
    holder.add(arch);

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: index % 2 ? 0xd8aa67 : 0x9ec6ce,
      transparent: true,
      opacity: hero ? 0.16 : 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    haloMaterials.push(haloMaterial);
    const halo = mesh(
      THREE,
      new THREE.PlaneGeometry(nicheWidth + 0.35, nicheHeight + 0.35),
      haloMaterial,
      holder,
      [0, 0, -0.12]
    );
    halo.renderOrder = -1;

    if (image) {
      holder.add(image.object);
      image.object.position.z = 0.035;
    } else {
      addBox(THREE, holder, [width, height, 0.03], ivoryMat, [0, 0, 0.01]);
      addLabel(THREE, holder, ctx, "NO LOCAL IMAGE\n真实图像未提供", 0.105, "#3c352b", [0, 0, 0.035]);
    }

    addBox(THREE, holder, [width + 0.06, 0.045, 0.08], goldMat, [0, height / 2 + 0.02, 0.04]);
    addBox(THREE, holder, [width + 0.06, 0.045, 0.08], goldMat, [0, -height / 2 - 0.02, 0.04]);

    const hit = addPickBox(
      THREE,
      holder,
      ctx,
      hitMaterial,
      width + 0.16,
      height + 0.16,
      0.2,
      [0, 0, 0.08],
      index
    );
    hit.userData.kind = "painting";

    const credit = fieldText(item, "artist", "creator", "subtitle");
    addLabel(
      THREE,
      holder,
      ctx,
      `${clipText(itemTitle(item), hero ? 34 : 23)}\n${clipText(credit, hero ? 38 : 28)}`,
      hero ? 0.105 : 0.072,
      "#eadfcb",
      [0, -nicheHeight / 2 - 0.22, 0.06]
    );

    paintingEntries.push({
      index,
      holder,
      hit,
      angle,
      width,
      height,
      halo,
      position: holder.position.clone(),
      inward: new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)),
    });

    if (index < 5) {
      const lampAngle = angle + (index % 2 ? 0.19 : -0.19);
      const lampPosition = [
        Math.sin(lampAngle) * (radius - 0.36),
        6.05,
        -Math.cos(lampAngle) * (radius - 0.36) - 0.8,
      ];
      const lamp = mesh(
        THREE,
        new THREE.SphereGeometry(hero ? 0.085 : 0.055, 12, 10),
        index % 2 ? coolGlow : warmGlow,
        group,
        lampPosition
      );
      floorLamps.push({ lamp, phase: index * 0.65 });
    }
  });

  if (!items.length) {
    addLabel(THREE, group, ctx, "恒光穹殿\n暂无画作记录", 0.3, "#e4d4b9", [0, 3.35, -2.65]);
  }

  for (let pillar = -1; pillar <= 1; pillar += 1) {
    const angle = pillar * 0.7;
    addBox(
      THREE,
      group,
      [0.12, 6.5, 0.16],
      goldMat,
      [Math.sin(angle) * (radius - 0.12), 3.25, -Math.cos(angle) * (radius - 0.12) - 0.8],
      [0, -angle, 0]
    );
  }

  let selected = -1;

  return {
    group,
    camera: initial,
    update(time, dt) {
      const step = Math.max(0, Math.min(dt || 0, 0.05));
      if (reduced) return;
      warmGlow.emissiveIntensity = 3.25 + Math.sin(time * 0.37) * 0.26;
      coolGlow.emissiveIntensity = 2.05 + Math.sin(time * 0.42 + 1.2) * 0.21;
      haloMaterials.forEach((material, index) => {
        material.opacity = (index === selected ? 0.2 : 0.08) + Math.sin(time * 0.5 + index) * 0.018;
      });
      floorLamps.forEach(({ lamp, phase }) => {
        const scale = 0.9 + Math.sin(time * 0.8 + phase) * 0.09;
        lamp.scale.setScalar(scale);
      });
      paintingEntries.forEach((entry) => {
        const chosen = entry.index === selected;
        const targetScale = chosen ? 1.025 : 1;
        const next = entry.holder.scale.x + (targetScale - entry.holder.scale.x) * Math.min(1, step * 4);
        entry.holder.scale.setScalar(next);
        entry.holder.position.z = entry.position.z + (chosen ? 0.08 : 0);
      });
    },
    focus(index) {
      const entry = paintingEntries.find((candidate) => candidate.index === index);
      if (!entry) return initial;
      selected = index;
      const target = entry.position.clone();
      target.addScaledVector(entry.inward, 0.12);
      target.y += 0.04;
      const distance = (narrow ? 4.3 : 3.45) + entry.width * 0.22;
      const position = target.clone().addScaledVector(entry.inward, distance);
      position.y += 0.1;
      return view(position.toArray(), target.toArray());
    },
  };
}

function buildCurateRoom(ctx) {
  const THREE = ctx.THREE;
  const group = new THREE.Group();
  group.name = "记忆装配坞";
  const items = safeItems(ctx.items);
  const narrow = isNarrowViewport();
  const reduced = Boolean(ctx.reducedMotion);
  const initial = view(narrow ? [7.6, 6.5, 13.6] : [7.2, 5.7, 8.9], [0, 1.75, 0.05]);
  const slots = [];
  const statusRings = [];

  addRoomLights(THREE, group, {
    hemi: 0x161b20,
    ground: 0x040506,
    intensity: 0.82,
    points: [
      [-3.4, 5.2, 2.8, 0xaad9ec, 29, 12],
      [3.7, 4.4, -1.7, 0xffbd75, 24, 11],
      [0, 6.4, 0.2, 0xe8f5f0, 17, 9],
    ],
  });

  const deckMat = standard(THREE, 0x131a1d, { roughness: 0.42, metalness: 0.74 });
  const deckTopMat = standard(THREE, 0x263136, { roughness: 0.6, metalness: 0.48 });
  const steelMat = standard(THREE, 0x414a4e, { roughness: 0.26, metalness: 0.92 });
  const brassMat = standard(THREE, 0x775d38, { roughness: 0.3, metalness: 0.9 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x9ccbd6,
    roughness: 0.18,
    metalness: 0.08,
    transparent: true,
    opacity: 0.22,
    transmission: 0.38,
    thickness: 0.3,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const cyanGlow = emissive(THREE, 0x9ce6f5, 3.7);
  const amberGlow = emissive(THREE, 0xf1b469, 2.9);
  const hitMaterial = invisibleMaterial(THREE);

  const base = mesh(THREE, new THREE.CylinderGeometry(3.2, 3.65, 0.48, 12), deckMat, group, [0, 0.22, 0]);
  base.name = "assembly-base";
  addMesh(
    THREE,
    group,
    new THREE.CylinderGeometry(2.82, 2.82, 0.12, 12),
    deckTopMat,
    [0, 0.52, 0]
  );

  for (let step = 0; step < 12; step += 1) {
    const angle = (step / 12) * Math.PI * 2;
    addBox(
      THREE,
      group,
      [0.34, 0.13, 1.05],
      steelMat,
      [Math.sin(angle) * 2.48, 0.18, Math.cos(angle) * 2.48],
      [0, angle, 0]
    );
  }

  const centerColumn = mesh(THREE, new THREE.CylinderGeometry(0.56, 0.8, 1.15, 12), steelMat, group, [0, 1.08, 0]);
  centerColumn.name = "seven-slot-press";
  addMesh(
    THREE,
    group,
    new THREE.CylinderGeometry(0.72, 0.72, 0.11, 12),
    brassMat,
    [0, 1.7, 0]
  );
  const outputStack = mesh(
    THREE,
    new THREE.CylinderGeometry(0.58, 0.47, 0.11, 32),
    glassMat,
    group,
    [0, 1.9, 0]
  );
  outputStack.name = "assembly-preview";
  const outputRing = mesh(
    THREE,
    new THREE.TorusGeometry(0.7, 0.025, 8, 48),
    cyanGlow,
    group,
    [0, 1.94, 0],
    [Math.PI / 2, 0, 0]
  );
  statusRings.push(outputRing);

  const gantry = new THREE.Group();
  group.add(gantry);
  addBox(THREE, gantry, [6.1, 0.12, 0.14], steelMat, [0, 4.35, -0.8]);
  addBox(THREE, gantry, [0.12, 4.35, 0.14], steelMat, [-3.02, 2.18, -0.8]);
  addBox(THREE, gantry, [0.12, 4.35, 0.14], steelMat, [3.02, 2.18, -0.8]);
  addBox(THREE, gantry, [6.2, 0.06, 0.05], cyanGlow, [0, 4.38, -0.71]);

  const head = new THREE.Group();
  head.position.set(0, 3.95, -0.62);
  gantry.add(head);
  addBox(THREE, head, [0.52, 0.34, 0.46], brassMat, [0, 0, 0]);
  addMesh(THREE, head, new THREE.ConeGeometry(0.19, 0.5, 12), steelMat, [0, -0.34, 0.02], [0, 0, Math.PI]);
  addMesh(THREE, head, new THREE.SphereGeometry(0.07, 12, 8), amberGlow, [0, -0.61, 0.02]);

  const slotTypes = ["photo", "photo", "photo", "book", "film", "series", "music"];
  const slotLabels = ["照片 01", "照片 02", "照片 03", "书籍", "影片", "剧集", "音乐"];
  const slotPositions = narrow
    ? [
        [-1.7, 1.0, -0.7],
        [0, 1.08, -1.28],
        [1.7, 1.0, -0.7],
        [-1.83, 0.8, 0.93],
        [-0.7, 0.76, 1.55],
        [0.7, 0.76, 1.55],
        [1.83, 0.8, 0.93],
      ]
    : [
        [-2.2, 1.02, -0.72],
        [0, 1.12, -1.45],
        [2.2, 1.02, -0.72],
        [-2.37, 0.78, 0.95],
        [-0.92, 0.73, 1.72],
        [0.92, 0.73, 1.72],
        [2.37, 0.78, 0.95],
      ];
  const slotRecords = mapCuratorRecords(items, slotTypes);

  slotTypes.forEach((type, index) => {
    const record = slotRecords[index];
    const position = slotPositions[index];
    const slot = new THREE.Group();
    slot.position.set(position[0], position[1], position[2]);
    slot.rotation.y = Math.atan2(position[0], position[2]) * 0.42;
    slot.userData.baseY = position[1];
    group.add(slot);

    const photoSlot = type === "photo";
    const width = photoSlot ? 1.48 : 1.05;
    const height = photoSlot ? 0.94 : 0.82;
    addMesh(
      THREE,
      slot,
      new THREE.CylinderGeometry(photoSlot ? 0.61 : 0.5, photoSlot ? 0.7 : 0.58, 0.16, 8),
      steelMat,
      [0, -0.36, 0]
    );
    addMesh(
      THREE,
      slot,
      new THREE.TorusGeometry(photoSlot ? 0.63 : 0.53, 0.026, 8, 32),
      record ? cyanGlow : brassMat,
      [0, -0.25, 0],
      [Math.PI / 2, 0, 0]
    );
    addBox(THREE, slot, [0.09, 0.64, 0.09], steelMat, [-width / 2 - 0.08, -0.02, 0]);
    addBox(THREE, slot, [0.09, 0.64, 0.09], steelMat, [width / 2 + 0.08, -0.02, 0]);
    addBox(THREE, slot, [0.24, 0.09, 0.12], brassMat, [-width / 2 + 0.08, 0.34, 0.04], [0, 0, -0.42]);
    addBox(THREE, slot, [0.24, 0.09, 0.12], brassMat, [width / 2 - 0.08, 0.34, 0.04], [0, 0, 0.42]);

    if (record) {
      const item = record.item;
      if (photoSlot || field(item, "image") || field(item, "thumb")) {
        const plane = artworkPlane(ctx, item, width, height);
        if (plane) {
          plane.object.position.set(0, 0.06, 0.055);
          slot.add(plane.object);
        } else {
          addBox(THREE, slot, [width, height, 0.035], deckMat, [0, 0.06, 0]);
        }
      } else {
        addBox(THREE, slot, [width, height, 0.035], deckMat, [0, 0.06, 0]);
      }
      addLabel(
        THREE,
        slot,
        ctx,
        `${clipText(itemTitle(item), narrow ? 15 : 21)}\n${clipText(fieldText(item, "subtitle", "artist", "author", "year"), 20)}`,
        photoSlot ? 0.074 : 0.068,
        "#e8e2d8",
        [0, 0.06, 0.083]
      );
      const hit = addPickBox(
        THREE,
        slot,
        ctx,
        hitMaterial,
        width + 0.12,
        height + 0.12,
        0.18,
        [0, 0.04, 0.08],
        record.itemIndex
      );
      hit.userData.kind = "curate-slot";
    } else {
      addBox(THREE, slot, [width, height, 0.025], glassMat, [0, 0.06, 0]);
      addLabel(THREE, slot, ctx, `${slotLabels[index]}\nEMPTY`, 0.078, "#a9bac0", [0, 0.06, 0.055]);
    }

    addLabel(THREE, slot, ctx, slotLabels[index].toUpperCase(), 0.058, record ? "#f1cb91" : "#7f8e92", [0, -0.48, 0.04]);

    const arm = addBox(THREE, slot, [0.07, 0.35, 0.07], brassMat, [0, 0.39, -0.1], [0, 0, 0]);
    arm.name = `slot-arm-${index}`;
    const status = mesh(
      THREE,
      new THREE.SphereGeometry(0.045, 10, 8),
      record ? cyanGlow : brassMat,
      slot,
      [0, 0.6, -0.1]
    );
    statusRings.push(status);

    slots.push({
      index,
      type,
      record,
      group: slot,
      status,
      baseY: position[1],
      position: new THREE.Vector3(position[0], position[1], position[2]),
      phase: index * 0.61,
    });
  });

  addLabel(THREE, group, ctx, "记忆装配坞 / SEVEN SLOTS", 0.16, "#d8e6e7", [0, 4.95, -0.12]);
  addLabel(
    THREE,
    group,
    ctx,
    "3 PHOTOGRAPHS  ·  BOOK  ·  FILM  ·  SERIES  ·  MUSIC",
    0.072,
    "#8fa6ab",
    [0, 0.17, 2.66]
  );

  if (!items.length) {
    addLabel(THREE, group, ctx, "七槽已就绪\n从目录装配你的展览", 0.18, "#b8cbd0", [0, 2.17, 1.14]);
  }

  let selected = -1;

  return {
    group,
    camera: initial,
    update(time, dt) {
      const step = Math.max(0, Math.min(dt || 0, 0.05));
      if (reduced) return;
      cyanGlow.emissiveIntensity = 3.3 + Math.sin(time * 1.1) * 0.5;
      amberGlow.emissiveIntensity = 2.55 + Math.sin(time * 0.78 + 0.5) * 0.35;
      outputRing.rotation.z = time * 0.24;
      statusRings.forEach((status, index) => {
        const active = index === 0 || status === slots[selected]?.status;
        const scale = active ? 1.08 : 0.92 + Math.sin(time * 0.7 + index) * 0.07;
        status.scale.setScalar(scale);
      });
      slots.forEach((slot) => {
        const chosen = slot.index === selected;
        const targetY = slot.baseY + (chosen ? 0.12 : 0) + Math.sin(time * 0.58 + slot.phase) * 0.008;
        slot.group.position.y += (targetY - slot.group.position.y) * Math.min(1, step * 4.8);
      });
      const targetSlot = slots[selected];
      if (targetSlot) {
        const targetHead = new THREE.Vector3(
          targetSlot.position.x,
          targetSlot.baseY + 2.24,
          targetSlot.position.z - 0.18
        );
        head.position.lerp(targetHead, Math.min(1, step * 2.8));
      } else {
        head.position.lerp(new THREE.Vector3(0, 3.95, -0.62), Math.min(1, step * 2.2));
      }
    },
    focus(index) {
      const slot = slots.find((candidate) => candidate.record?.itemIndex === index);
      if (!slot) return initial;
      selected = slot.index;
      const target = slot.position.clone();
      target.y += 0.08;
      const position = target.clone().add(new THREE.Vector3(narrow ? 1.15 : 0.9, narrow ? 2.15 : 1.62, narrow ? 4.2 : 3.15));
      return view(position.toArray(), target.toArray());
    },
  };
}

const BOOK_COLORS = ["#314441", "#4a3530", "#253648", "#4b4932", "#263f3a", "#4a3d2a", "#293f4f", "#3a3234"];

function safeItems(items) {
  return Array.isArray(items) ? items.filter((item) => item && typeof item === "object") : [];
}

function view(position, target) {
  return { position: position.slice(), target: target.slice() };
}

function isNarrowViewport() {
  if (typeof window === "undefined") return false;
  return Number(window.innerWidth) <= 680;
}

function hashNumber(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function originalFields(item) {
  return item?.originalFields && typeof item.originalFields === "object" ? item.originalFields : item || {};
}

function field(item, ...keys) {
  const original = originalFields(item);
  for (const key of keys) {
    const value = item?.[key] ?? original?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function fieldText(item, ...keys) {
  return String(field(item, ...keys) || "").replace(/\s+/g, " ").trim();
}

function itemTitle(item) {
  return fieldText(item, "title", "name") || "未命名记录";
}

function itemText(item) {
  const value = field(item, "text", "note", "description");
  return typeof value === "string" ? value : "";
}

function firstVerse(text) {
  const lines = String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return lines.slice(0, 2).join(" / ");
}

function clipText(value, limit) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, Math.max(1, limit - 1)).trimEnd()}…` : text;
}

function numeric(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value.trim())) {
    const parsed = Number(value);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

function estimateAspect(item, fallback = 1.5) {
  const original = originalFields(item);
  const explicit = numeric(item?.aspect) || numeric(item?.ratio) || numeric(original.aspect) || numeric(original.ratio);
  if (explicit) return Math.max(0.42, Math.min(3.2, explicit));

  const width = numeric(item?.width) || numeric(item?.imageWidth) || numeric(original.width) || numeric(original.imageWidth);
  const height = numeric(item?.height) || numeric(item?.imageHeight) || numeric(original.height) || numeric(original.imageHeight);
  if (width && height) return Math.max(0.42, Math.min(3.2, width / height));

  const dimensions = String(field(item, "dimensions", "size") || "");
  const match = dimensions.match(/(\d+(?:\.\d+)?)\s*[x×:]\s*(\d+(?:\.\d+)?)/i);
  if (match) {
    return Math.max(0.42, Math.min(3.2, Number(match[1]) / Number(match[2])));
  }
  return fallback;
}

function fitAspect(maxWidth, maxHeight, aspect) {
  const safeAspect = Math.max(0.2, Number(aspect) || 1);
  let width = maxWidth;
  let height = width / safeAspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * safeAspect;
  }
  return { width, height };
}

function artworkPlane(ctx, item, maxWidth, maxHeight) {
  if (!item || (!field(item, "image") && !field(item, "thumb"))) return null;
  const fit = fitAspect(maxWidth, maxHeight, estimateAspect(item));
  const object = ctx.plane(item, fit.width, fit.height);
  if (!object) return null;
  return { object, width: fit.width, height: fit.height, aspect: fit.width / fit.height };
}

function standard(THREE, color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.65,
    metalness: options.metalness ?? 0.15,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
    depthWrite: options.depthWrite ?? true,
  });
}

function emissive(THREE, color, intensity = 2.5) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.28,
    metalness: 0.16,
  });
}

function invisibleMaterial(THREE) {
  return new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
    side: THREE.DoubleSide,
  });
}

function mesh(THREE, geometry, material, parent, position, rotation) {
  const object = new THREE.Mesh(geometry, material);
  place(object, position, rotation);
  parent.add(object);
  return object;
}

function addMesh(THREE, parent, geometry, material, position, rotation) {
  return mesh(THREE, geometry, material, parent, position, rotation);
}

function addBox(THREE, parent, size, material, position, rotation) {
  return mesh(
    THREE,
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material,
    parent,
    position,
    rotation
  );
}

function extrudedBookGeometry(THREE, width, height, depth) {
  const shape = new THREE.Shape();
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const shoulder = Math.min(0.035, width * 0.16);
  shape.moveTo(-halfWidth + shoulder, -halfHeight);
  shape.lineTo(halfWidth - shoulder, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + shoulder);
  shape.lineTo(halfWidth, halfHeight - shoulder);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - shoulder, halfHeight);
  shape.lineTo(-halfWidth + shoulder, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - shoulder);
  shape.lineTo(-halfWidth, -halfHeight + shoulder);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + shoulder, -halfHeight);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    curveSegments: 3,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: Math.min(0.018, width * 0.08),
    bevelThickness: Math.min(0.018, depth * 0.04),
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function place(object, position, rotation) {
  if (position) object.position.set(position[0] || 0, position[1] || 0, position[2] || 0);
  if (rotation) object.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
  return object;
}

function curve(THREE, points) {
  return new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "centripetal",
    0.45
  );
}

function addCable(THREE, parent, from, to, material) {
  const start = new THREE.Vector3(from[0], from[1], from[2]);
  const end = new THREE.Vector3(to[0], to[1], to[2]);
  const direction = end.clone().sub(start);
  const length = direction.length();
  if (!Number.isFinite(length) || length <= 0) return null;
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, length, 6), material);
  cable.position.copy(start).add(end).multiplyScalar(0.5);
  cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  parent.add(cable);
  return cable;
}

function addLabel(THREE, parent, ctx, text, size, color, position, rotation) {
  if (!ctx?.label || !text) return null;
  const object = ctx.label(String(text), size, color);
  if (!object) return null;
  place(object, position, rotation);
  parent.add(object);
  return object;
}

function addFrame(THREE, parent, width, height, outerMaterial, edgeMaterial) {
  const edge = Math.max(0.035, Math.min(0.09, width * 0.026));
  addBox(THREE, parent, [width + edge * 2, edge, 0.08], outerMaterial, [0, height / 2 + edge / 2, 0]);
  addBox(THREE, parent, [width + edge * 2, edge, 0.08], outerMaterial, [0, -height / 2 - edge / 2, 0]);
  addBox(THREE, parent, [edge, height + edge * 2, 0.08], outerMaterial, [-width / 2 - edge / 2, 0, 0]);
  addBox(THREE, parent, [edge, height + edge * 2, 0.08], outerMaterial, [width / 2 + edge / 2, 0, 0]);
  addBox(THREE, parent, [width + edge * 0.5, edge * 0.4, 0.035], edgeMaterial, [0, height / 2 + 0.16, 0.04]);
}

function addPickBox(THREE, parent, ctx, material, width, height, depth, position, index) {
  const hit = addBox(THREE, parent, [width, height, depth], material, position);
  hit.userData.worldIndex = index;
  ctx.pick(hit, index);
  return hit;
}

function addEmptyFrame(THREE, parent, ctx, outerMaterial, edgeMaterial, text, position, width, height) {
  const holder = new THREE.Group();
  holder.position.set(position[0], position[1], position[2]);
  parent.add(holder);
  addFrame(THREE, holder, width, height, outerMaterial, edgeMaterial);
  addBox(THREE, holder, [width, height, 0.03], edgeMaterial, [0, 0, 0]);
  addLabel(THREE, holder, ctx, text, 0.18, "#756c60", [0, 0, 0.035]);
  return holder;
}

function addFloorGuides(THREE, parent, material, radius) {
  for (let index = -2; index <= 2; index += 1) {
    addBox(THREE, parent, [0.018, 0.012, 12], material, [index * radius * 0.38, 0.014, -2.6], [0, index * 0.085, 0]);
  }
  addBox(THREE, parent, [15, 0.014, 0.02], material, [0, 0.016, 1.35]);
}

function addRoomLights(THREE, group, config) {
  const hemi = new THREE.HemisphereLight(config.hemi, config.ground, config.intensity);
  group.add(hemi);
  for (const [x, y, z, color, intensity, distance] of config.points) {
    const light = new THREE.PointLight(color, intensity, distance, 1.7);
    light.position.set(x, y, z);
    group.add(light);
  }
}

function colorFromText(value, fallback) {
  const text = String(value || "").trim();
  if (/^#[0-9a-f]{3,8}$/i.test(text)) return text;
  if (/^[a-z]+$/i.test(text) && typeof CSS !== "undefined" && CSS.supports?.("color", text)) return text;
  if (text) {
    const firstColor = text.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/i);
    if (firstColor) return firstColor[0];
  }
  return fallback;
}

function mapCuratorRecords(items, slotTypes) {
  const result = Array(slotTypes.length).fill(null);
  const typed = items.some((item) => typeof field(item, "type") === "string" && field(item, "type"));

  if (!typed) {
    items.slice(0, slotTypes.length).forEach((item, itemIndex) => {
      result[itemIndex] = { item, itemIndex };
    });
    return result;
  }

  const used = new Set();
  items.forEach((item, itemIndex) => {
    if (used.has(itemIndex)) return;
    const type = String(field(item, "type") || "").toLowerCase();
    let slotIndex = slotTypes.findIndex((slotType, index) => slotType === type && !result[index]);
    if (type === "photo" || type === "photography") {
      slotIndex = slotTypes.findIndex((slotType, index) => slotType === "photo" && !result[index]);
    }
    if (slotIndex < 0) {
      slotIndex = slotTypes.findIndex((slotType, index) => !result[index]);
    }
    if (slotIndex >= 0) {
      result[slotIndex] = { item, itemIndex };
      used.add(itemIndex);
    }
  });
  return result;
}
