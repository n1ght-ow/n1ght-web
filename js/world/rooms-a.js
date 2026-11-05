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
  const initial = { ...view([0, 3.6, 12], [0, 3.2, -1.6]), frame: narrow ? { width: 7, height: 7.3 } : { width: 12, height: 6.7 } };
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
  const coolLightMat = standard(THREE, 0x617679, { roughness: 0.7, metalness: 0.35 });
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

  const anchorPositions = [
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
    const placement = narrow
      ? (index === 0 ? [0, 3.65, 0.8, 0]
        : index < 3 ? [(index === 1 ? -1 : 1) * 1.85, 5.45, -1.4, 0]
        : [((index - 3) % 3 - 1) * 2, 1.9 - Math.floor((index - 3) / 3) * 1.5, -1.5, 0])
      : anchorPositions[index];
    const holder = new THREE.Group();
    holder.position.set(placement[0], placement[1], placement[2]);
    holder.rotation.y = placement[3];
    holder.userData.baseY = placement[1];
    holder.userData.baseZ = placement[2];
    group.add(holder);

    const hero = narrow ? index === 0 : index === 0 || index === 1;
    const maxWidth = hero ? (narrow ? 3 : 2.7) : narrow ? 1.7 : 2.05;
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
    const upperCable = addCable(THREE, group, upper, [upper.x, 6.2, upper.z - 0.6], coolLightMat);
    const lowerCable = addCable(THREE, group, lower, [lower.x, 0.06, lower.z + 0.4], frameMat);

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
      cables: [upperCable, lowerCable],
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
    overview() {
      selected = -1;
      printEntries.forEach(entry => {
        entry.holder.position.copy(entry.position);
        entry.holder.rotation.set(0, entry.theta, 0);
        entry.cables.forEach(cable => { if (cable) cable.visible = true; });
      });
      return initial;
    },
    update(time, dt) {
      const step = Math.max(0, Math.min(dt || 0, 0.05));
      if (reduced) return;
      const pulse = 3.2 + Math.sin(time * 1.45) * 0.75;
      lightMat.emissiveIntensity = pulse;
      lightNodes.forEach(({ node, phase }, index) => {
        const scale = 0.78 + Math.sin(time * 1.7 + phase) * 0.2;
        node.scale.setScalar(scale);
        node.position.y += Math.sin(time * 0.7 + phase) * 0.0007 * (index % 2 ? 1 : -1);
      });

    },
    focus(index) {
      const entry = printEntries.find((candidate) => candidate.index === index);
      if (!entry) return initial;
      selected = index;
      printEntries.forEach(candidate => {
        candidate.holder.position.copy(candidate.position);
        candidate.holder.rotation.set(0, candidate.theta, 0);
        candidate.cables.forEach(cable => { if (cable) cable.visible = candidate !== entry; });
      });
      entry.holder.position.set(0, 3.1, 2.2);
      entry.holder.rotation.set(0, 0, 0);
      return { ...view([0, 3.1, 8], [0, 3.1, 2.2]), frame: { width: entry.width + 0.6, height: entry.height + 0.7 } };
    },
  };
}

const BOOKS_ROOM_FALLBACK_CLOTHES = [
  "#2f4858",
  "#8a3b34",
  "#c7a233",
  "#1f4b52",
  "#7d2f2a",
  "#5f6b4a",
  "#22304a",
  "#8c4a1f",
  "#3b3550",
];

function buildBooksRoom(ctx) {
  const THREE = ctx.THREE;
  const group = new THREE.Group();
  group.name = "悬挑阅览架";
  const items = safeItems(ctx.items).slice(0, 9);
  const narrow = isNarrowViewport();
  const initial = {
    ...view(
      narrow ? [0.55, 5.05, 12.4] : [0.7, 4.9, 10.7],
      [0, 4.38, -3.7]
    ),
    frame: narrow
      ? { width: 9.65, height: 8.5 }
      : { width: 10.15, height: 8.35 },
  };
  const entries = [];
  const shelfLightMaterials = [];
  const shelfLevels = [0.86, 3.36, 5.86];
  const shelfXs = [-2.42, 0, 2.42];
  const shelfSpan = 4.72;
  const shelfBaseZ = -4.28;
  const tableTopY = 0.58;
  const readingPosition = new THREE.Vector3(0, 2.42, 2.22);

  addRoomLights(THREE, group, {
    hemi: 0x1b2525,
    ground: 0x050707,
    intensity: 0.9,
    points: [
      [-3.4, 5.9, 1.4, 0xdde8ce, 24, 13],
      [3.6, 4.3, 0.6, 0xd9b16f, 19, 12],
      [0, 2.8, 3.7, 0xbfd9d0, 10, 8],
    ],
  });

  const floorMaterial = standard(THREE, 0x080c0c, {
    roughness: 0.83,
    metalness: 0.34,
  });
  const graphiteMaterial = standard(THREE, 0x111919, {
    roughness: 0.62,
    metalness: 0.54,
  });
  const titaniumMaterial = standard(THREE, 0x354144, {
    roughness: 0.3,
    metalness: 0.86,
  });
  const brassMaterial = standard(THREE, 0x9b7548, {
    roughness: 0.28,
    metalness: 0.88,
    emissive: 0x2a1608,
    emissiveIntensity: 0.55,
  });
  const tableMaterial = standard(THREE, 0x202827, {
    roughness: 0.55,
    metalness: 0.48,
  });
  const hitMaterial = invisibleMaterial(THREE);
  const pageTexture = booksRoomPageTexture(THREE);
  const pageMaterial = new THREE.MeshStandardMaterial({
    map: pageTexture,
    color: 0xf2ead9,
    roughness: 0.94,
    metalness: 0,
  });

  const floor = mesh(
    THREE,
    new THREE.CircleGeometry(10.8, 72),
    floorMaterial,
    group,
    [0, -0.07, -1.3],
    [-Math.PI / 2, 0, 0]
  );
  floor.name = "cantilever-library-floor";

  for (const side of [-1, 1]) {
    const fin = addBox(
      THREE,
      group,
      [0.16, 8.28, 0.9],
      titaniumMaterial,
      [side * (shelfSpan + 0.3), 4.1, shelfBaseZ + 0.1]
    );
    fin.name = side < 0 ? "library-left-fin" : "library-right-fin";

    addBox(
      THREE,
      group,
      [0.055, 7.4, 0.055],
      brassMaterial,
      [side * (shelfSpan + 0.19), 4.12, shelfBaseZ + 0.55]
    );
    addBox(
      THREE,
      group,
      [0.82, 0.14, 0.92],
      graphiteMaterial,
      [side * 4.35, 0.07, shelfBaseZ + 0.1]
    );
  }

  const shelving = new THREE.Group();
  shelving.name = "three-tier-cantilever-shelves";
  group.add(shelving);

  shelfLevels.forEach((shelfY, tier) => {
    const segmentCount = 18;
    const segmentWidth = (shelfSpan * 2) / segmentCount;
    for (let segment = 0; segment < segmentCount; segment += 1) {
      const x = -shelfSpan + segmentWidth * (segment + 0.5);
      const z = booksRoomShelfZ(x, shelfBaseZ, shelfSpan);
      const nextZ = booksRoomShelfZ(
        x + segmentWidth * 0.5,
        shelfBaseZ,
        shelfSpan
      );
      const previousZ = booksRoomShelfZ(
        x - segmentWidth * 0.5,
        shelfBaseZ,
        shelfSpan
      );
      const yaw = Math.atan2(-(nextZ - previousZ), segmentWidth);
      addBox(
        THREE,
        shelving,
        [segmentWidth + 0.018, 0.11, 1.08],
        graphiteMaterial,
        [x, shelfY, z],
        [0, yaw, 0]
      );
    }

    const shelfCurve = curve(
      THREE,
      Array.from({ length: 11 }, (_, index) => {
        const x = -shelfSpan + (index / 10) * shelfSpan * 2;
        return [
          x,
          shelfY - 0.075,
          booksRoomShelfZ(x, shelfBaseZ, shelfSpan) + 0.51,
        ];
      })
    );
    shelving.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(shelfCurve, 72, 0.025, 7, false),
        brassMaterial
      )
    );

    const lightMaterial = emissive(THREE, 0xd9b574, 1.65);
    shelfLightMaterials.push(lightMaterial);
    const lightCurve = curve(
      THREE,
      Array.from({ length: 11 }, (_, index) => {
        const x = -shelfSpan + (index / 10) * shelfSpan * 2;
        return [
          x,
          shelfY - 0.135,
          booksRoomShelfZ(x, shelfBaseZ, shelfSpan) + 0.49,
        ];
      })
    );
    shelving.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(lightCurve, 72, 0.012, 6, false),
        lightMaterial
      )
    );

    for (const side of [-1, 1]) {
      addBox(
        THREE,
        shelving,
        [0.74, 0.075, 0.68],
        titaniumMaterial,
        [side * 4.35, shelfY - 0.03, booksRoomShelfZ(side * 4.35, shelfBaseZ, shelfSpan) + 0.04]
      );
    }
  });

  const table = new THREE.Group();
  table.name = "books-reading-desk";
  table.position.set(0, 0, 1.92);
  group.add(table);
  addBox(THREE, table, [3.45, 0.17, 1.22], tableMaterial, [0, 0.5, 0]);
  addBox(THREE, table, [3.06, 0.025, 0.022], brassMaterial, [0, 0.6, 0.57]);
  for (const x of [-1.28, 1.28]) {
    addBox(THREE, table, [0.09, 0.46, 0.09], titaniumMaterial, [x, 0.23, -0.36]);
    addBox(THREE, table, [0.09, 0.46, 0.09], titaniumMaterial, [x, 0.23, 0.36]);
  }
  const tableGlowMaterial = emissive(THREE, 0xb8d8cb, 0.16);
  addBox(
    THREE,
    table,
    [2.7, 0.012, 0.03],
    tableGlowMaterial,
    [0, 0.606, -0.47]
  );

  const selectionLight = new THREE.PointLight(0xd7eee4, 1.2, 8.5, 1.8);
  selectionLight.position.set(0, 4.4, 2.7);
  group.add(selectionLight);

  items.forEach((item, index) => {
    const tier = Math.floor(index / 3);
    const column = index % 3;
    const shelfY = shelfLevels[tier] ?? shelfLevels[shelfLevels.length - 1];
    const x = shelfXs[column] ?? 0;
    const data = booksRoomBookData(item, index);
    const shelfZ = booksRoomShelfZ(x, shelfBaseZ, shelfSpan);
    const shelfYaw = booksRoomShelfTangent(x, shelfBaseZ, shelfSpan);
    const displayYaw = shelfYaw + (column - 1) * 0.12;
    const shelfPosition = new THREE.Vector3(
      x,
      shelfY + 0.065 + data.height / 2,
      shelfZ + 0.05
    );
    const shelfRotation = [0, displayYaw, data.lean];
    const book = booksRoomCreateBook(
      THREE,
      ctx,
      item,
      index,
      data,
      pageMaterial,
      hitMaterial
    );
    book.group.position.copy(shelfPosition);
    book.group.rotation.set(...shelfRotation);
    group.add(book.group);

    entries.push({
      index,
      item,
      data,
      ...book,
      shelfPosition,
      shelfRotation,
      readingPosition: new THREE.Vector3(
        readingPosition.x,
        tableTopY + data.height / 2 + 0.04,
        readingPosition.z
      ),
      targetPosition: shelfPosition.clone(),
      targetRotation: shelfRotation.slice(),
      targetScale: 1,
      mute: 0,
      targetMute: 0,
    });
  });

  if (!items.length) {
    addLabel(
      THREE,
      group,
      ctx,
      "悬挑阅览架\n等待本页书目",
      0.22,
      "#d7ded7",
      [0, 3.8, shelfBaseZ + 1.15]
    );
  }

  addLabel(
    THREE,
    group,
    ctx,
    "READING STACK\n悬挑阅览架",
    0.14,
    "#b7c4bd",
    [0, 8.92, shelfBaseZ + 0.48]
  );

  let selected = -1;

  function syncVisuals() {
    entries.forEach((entry) => {
      entry.group.position.copy(entry.targetPosition);
      entry.group.rotation.set(...entry.targetRotation);
      entry.group.scale.setScalar(entry.targetScale);
      entry.mute = entry.targetMute;
      booksRoomTintBook(entry);
    });
    selectionLight.intensity = selected >= 0 ? 21 : 1.2;
    tableGlowMaterial.emissiveIntensity = selected >= 0 ? 2.1 : 0.16;
  }

  function setSelection(index) {
    selected = entries.some((entry) => entry.index === index) ? index : -1;
    entries.forEach((entry) => {
      const active = entry.index === selected;
      entry.targetPosition.copy(active ? entry.readingPosition : entry.shelfPosition);
      entry.targetRotation = active ? [0, 0, 0] : entry.shelfRotation.slice();
      entry.targetScale = active ? 1.045 : 1;
      entry.targetMute = selected >= 0 && !active ? 0.58 : 0;
    });
    selectionLight.intensity = selected >= 0 ? 21 : 1.2;
    tableGlowMaterial.emissiveIntensity = selected >= 0 ? 2.1 : 0.16;
    if (booksRoomMotionPaused(ctx)) syncVisuals();
  }

  return {
    group,
    camera: initial,
    update(_time, dt) {
      if (booksRoomMotionPaused(ctx)) {
        syncVisuals();
        return;
      }
      const step = Math.max(0, Math.min(Number(dt) || 0, 0.05));
      const positionEase = booksRoomDamp(step * 8.5);
      const rotationEase = booksRoomDamp(step * 9.5);
      entries.forEach((entry) => {
        entry.group.position.lerp(entry.targetPosition, positionEase);
        entry.group.rotation.x +=
          (entry.targetRotation[0] - entry.group.rotation.x) * rotationEase;
        entry.group.rotation.y +=
          (entry.targetRotation[1] - entry.group.rotation.y) * rotationEase;
        entry.group.rotation.z +=
          (entry.targetRotation[2] - entry.group.rotation.z) * rotationEase;
        const nextScale =
          entry.group.scale.x +
          (entry.targetScale - entry.group.scale.x) * positionEase;
        entry.group.scale.setScalar(nextScale);
        entry.mute += (entry.targetMute - entry.mute) * positionEase;
        booksRoomTintBook(entry);
      });
    },
    focus(index) {
      const entry = entries.find((candidate) => candidate.index === index);
      if (!entry) return initial;
      setSelection(index);
      const target = entry.readingPosition.clone();
      target.y += entry.data.height * 0.02;
      const position = target.clone();
      position.x += narrow ? 0.32 : 0.58;
      position.y += entry.data.height * 0.1;
      position.z += narrow ? 7.4 : 6.1;
      return {
        ...view(position.toArray(), target.toArray()),
        frame: {
          width: entry.data.coverWidth + (narrow ? 0.78 : 0.88),
          height: entry.data.height + 0.58,
        },
      };
    },
    overview() {
      setSelection(-1);
      return initial;
    },
  };
}

function booksRoomBookData(item, index) {
  const heightValue = booksRoomPositiveNumber(field(item, "height"), 264);
  const thicknessValue = booksRoomPositiveNumber(
    field(item, "thickness", "width"),
    32
  );
  const leanValue = booksRoomNumber(field(item, "lean"), 0);
  const rawCloth = String(field(item, "cloth", "cover", "color") || "");
  const rawInk = String(field(item, "ink", "textColor") || "");
  const rawBand = String(field(item, "band", "accent") || "");
  return {
    height: booksRoomClamp(heightValue / 120, 1.92, 2.46),
    coverWidth: booksRoomClamp(heightValue / 120, 1.92, 2.46) * 0.64,
    thickness: booksRoomClamp(thicknessValue / 60, 0.34, 0.78),
    lean: booksRoomClamp(
      Math.abs(leanValue) > 1 ? leanValue * (Math.PI / 180) : leanValue,
      -0.16,
      0.16
    ),
    cloth: colorFromText(
      rawCloth,
      BOOKS_ROOM_FALLBACK_CLOTHES[index % BOOKS_ROOM_FALLBACK_CLOTHES.length]
    ),
    ink: colorFromText(rawInk, "#f2ece0"),
    band: colorFromText(rawBand, "#c8a24a"),
    title: itemTitle(item),
    spine: fieldText(item, "spine", "meta") || itemTitle(item),
    author: fieldText(item, "author", "creator", "subtitle") || "作者未记录",
  };
}

function booksRoomCreateBook(
  THREE,
  ctx,
  item,
  index,
  data,
  pageMaterial,
  hitMaterial
) {
  const group = new THREE.Group();
  group.name = `archive-book-${index}-${String(item?.id || "untitled")}`;
  const bookPageMaterial = pageMaterial.clone();

  const clothMaterial = standard(THREE, data.cloth, {
    roughness: 0.79,
    metalness: 0.035,
  });
  const bandMaterial = standard(THREE, data.band, {
    roughness: 0.42,
    metalness: 0.15,
    emissive: data.band,
    emissiveIntensity: 0.08,
  });
  const coverTexture = booksRoomCoverTexture(
    THREE,
    data,
    index,
    data.coverWidth / data.height
  );
  const coverMaterial = new THREE.MeshStandardMaterial({
    map: coverTexture,
    color: 0xffffff,
    roughness: 0.68,
    metalness: 0.025,
  });
  const spineTexture = booksRoomSpineTexture(
    THREE,
    data,
    index,
    data.thickness / data.height
  );
  const spineMaterial = new THREE.MeshStandardMaterial({
    map: spineTexture,
    color: 0xffffff,
    roughness: 0.7,
    metalness: 0.03,
  });

  addBox(
    THREE,
    group,
    [data.coverWidth - 0.09, data.height - 0.07, data.thickness * 0.82],
    bookPageMaterial,
    [0.025, 0, 0]
  );
  addBox(
    THREE,
    group,
    [data.coverWidth, data.height, data.thickness * 0.12],
    clothMaterial,
    [0, 0, -data.thickness * 0.45]
  );
  addBox(
    THREE,
    group,
    [data.coverWidth, data.height, data.thickness * 0.12],
    clothMaterial,
    [0, 0, data.thickness * 0.45]
  );
  addBox(
    THREE,
    group,
    [0.085, data.height, data.thickness * 0.98],
    clothMaterial,
    [-data.coverWidth / 2 + 0.035, 0, 0]
  );
  addBox(
    THREE,
    group,
    [data.coverWidth * 0.92, 0.035, 0.016],
    bandMaterial,
    [0, data.height * 0.355, data.thickness / 2 + 0.008]
  );
  addBox(
    THREE,
    group,
    [data.coverWidth * 0.92, 0.022, 0.016],
    bandMaterial,
    [0, -data.height * 0.365, data.thickness / 2 + 0.008]
  );
  addBox(
    THREE,
    group,
    [0.09, 0.035, data.thickness * 1.01],
    bandMaterial,
    [-data.coverWidth / 2 + 0.035, data.height * 0.355, 0]
  );
  addBox(
    THREE,
    group,
    [0.09, 0.022, data.thickness * 1.01],
    bandMaterial,
    [-data.coverWidth / 2 + 0.035, -data.height * 0.365, 0]
  );

  const coverFace = mesh(
    THREE,
    new THREE.PlaneGeometry(data.coverWidth * 0.965, data.height * 0.965),
    coverMaterial,
    group,
    [0, 0, data.thickness / 2 + 0.012]
  );
  coverFace.name = "front-cover";

  const spineFace = mesh(
    THREE,
    new THREE.PlaneGeometry(
      data.thickness * 0.87,
      data.height * 0.9
    ),
    spineMaterial,
    group,
    [-data.coverWidth / 2 - 0.008, 0, 0],
    [0, -Math.PI / 2, 0]
  );
  spineFace.name = "spine-label";

  const hit = addBox(
    THREE,
    group,
    [data.coverWidth + 0.16, data.height + 0.15, data.thickness + 0.18],
    hitMaterial,
    [0, 0, 0]
  );
  hit.userData.kind = "book";
  hit.userData.bookIndex = index;
  ctx.pick(hit, index);

  const materials = [
    clothMaterial,
    bandMaterial,
    coverMaterial,
    spineMaterial,
    bookPageMaterial,
  ];
  materials.forEach((material) => {
    material.userData.booksRoomBaseColor = material.color.clone();
    material.userData.booksRoomBaseEmissive = material.emissive
      ? material.emissive.clone()
      : null;
    material.userData.booksRoomBaseEmissiveIntensity =
      material.emissiveIntensity || 0;
  });

  return {
    group,
    coverFace,
    spineFace,
    hit,
    materials,
    clothMaterial,
    bandMaterial,
    coverMaterial,
    spineMaterial,
    bookPageMaterial,
  };
}

function booksRoomTintBook(entry) {
  const light = 1 - entry.mute * 0.54;
  entry.materials.forEach((material) => {
    const baseColor = material.userData.booksRoomBaseColor;
    if (baseColor) material.color.copy(baseColor).multiplyScalar(light);
    if (material.emissive && material.userData.booksRoomBaseEmissive) {
      material.emissive
        .copy(material.userData.booksRoomBaseEmissive)
        .multiplyScalar(light);
      material.emissiveIntensity =
        material.userData.booksRoomBaseEmissiveIntensity * light;
    }
  });
}

function booksRoomCoverTexture(THREE, data, index, ratio) {
  const size = booksRoomTextureSize(ratio);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const paint = canvas.getContext("2d");
  const { width, height } = canvas;
  paint.fillStyle = data.cloth;
  paint.fillRect(0, 0, width, height);

  const wash = paint.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, "rgba(255,255,255,.085)");
  wash.addColorStop(0.46, "rgba(255,255,255,0)");
  wash.addColorStop(1, "rgba(0,0,0,.16)");
  paint.fillStyle = wash;
  paint.fillRect(0, 0, width, height);

  paint.strokeStyle = booksRoomCanvasAlpha(data.ink, 0.5);
  paint.lineWidth = 3;
  paint.strokeRect(34, 34, width - 68, height - 68);

  paint.fillStyle = data.band;
  paint.fillRect(34, height * 0.12, width - 68, Math.max(13, height * 0.017));
  paint.fillRect(34, height * 0.84, width - 68, Math.max(9, height * 0.012));

  paint.fillStyle = data.ink;
  paint.textAlign = "left";
  paint.textBaseline = "top";
  paint.font =
    '600 23px "Space Grotesk", "PingFang SC", "Microsoft YaHei", sans-serif';
  paint.fillText("DEEP ARCHIVE · TYPESET COVER", 72, height * 0.17);
  paint.fillText(String(index + 1).padStart(2, "0"), 72, height * 0.2);

  const titleSize = booksRoomTitleSize(data.title, width);
  paint.font = `${booksRoomTitleWeight(data.title)} ${titleSize}px Georgia, "Songti SC", STSong, serif`;
  const titleLines = booksRoomCanvasLines(paint, data.title, width - 144);
  const titleHeight = titleSize * 1.06;
  let titleY = Math.max(height * 0.28, height * 0.42 - (titleLines.length * titleHeight) / 2);
  titleLines.forEach((line) => {
    paint.fillText(line, 72, titleY);
    titleY += titleHeight;
  });

  paint.font =
    '600 38px "Space Grotesk", Georgia, "Times New Roman", serif';
  const spineLines = booksRoomCanvasLines(paint, data.spine, width - 144).slice(0, 3);
  let spineY = height * 0.68;
  spineLines.forEach((line) => {
    paint.fillText(line, 72, spineY);
    spineY += 45;
  });

  paint.font =
    '500 30px "Space Grotesk", "PingFang SC", "Microsoft YaHei", sans-serif';
  const author = booksRoomEllipsis(paint, data.author, width - 144);
  paint.fillText(author, 72, height - 118);

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = `archive-cover-${index}`;
  if ("colorSpace" in texture) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function booksRoomSpineTexture(THREE, data, index, ratio) {
  const size = booksRoomTextureSize(ratio);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const paint = canvas.getContext("2d");
  const { width, height } = canvas;
  paint.fillStyle = data.cloth;
  paint.fillRect(0, 0, width, height);
  paint.fillStyle = booksRoomCanvasAlpha(data.ink, 0.28);
  paint.fillRect(18, 0, 2, height);
  paint.fillStyle = data.band;
  paint.fillRect(0, height * 0.1, width, 34);
  paint.fillRect(0, height * 0.88, width, 22);

  paint.save();
  paint.translate(width / 2, height / 2);
  paint.rotate(-Math.PI / 2);
  paint.textAlign = "center";
  paint.textBaseline = "middle";
  paint.fillStyle = data.ink;
  paint.font =
    '600 48px "Space Grotesk", Georgia, "Times New Roman", serif';
  const title = booksRoomEllipsis(paint, data.spine, height - 190);
  paint.fillText(title, 0, -8);
  paint.font =
    '500 23px "Space Grotesk", "PingFang SC", "Microsoft YaHei", sans-serif';
  paint.fillText(String(index + 1).padStart(2, "0"), 0, 40);
  paint.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = `archive-spine-${index}`;
  if ("colorSpace" in texture) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function booksRoomPageTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const paint = canvas.getContext("2d");
  paint.fillStyle = "#e8deca";
  paint.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 8; y < canvas.height; y += 5) {
    paint.strokeStyle = y % 2 ? "rgba(86,72,52,.18)" : "rgba(255,255,255,.28)";
    paint.lineWidth = 1;
    paint.beginPath();
    paint.moveTo(0, y + 0.5);
    paint.lineTo(canvas.width, y + 0.5);
    paint.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.name = "books-page-edges";
  if ("colorSpace" in texture) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function booksRoomTextureSize(ratio) {
  const aspect = booksRoomClamp(Number(ratio) || 1, 0.04, 4);
  if (aspect <= 1) {
    return {
      width: Math.max(64, Math.round(1024 * aspect)),
      height: 1024,
    };
  }
  return {
    width: 1024,
    height: Math.max(64, Math.round(1024 / aspect)),
  };
}

function booksRoomShelfZ(x, baseZ, span) {
  const normalized = booksRoomClamp(Math.abs(x) / span, 0, 1);
  return baseZ + 0.3 * Math.cos((normalized * Math.PI) / 2);
}

function booksRoomShelfTangent(x, baseZ, span) {
  const step = 0.04;
  const left = booksRoomShelfZ(x - step, baseZ, span);
  const right = booksRoomShelfZ(x + step, baseZ, span);
  return Math.atan2(-(right - left), step * 2);
}

function booksRoomMotionPaused(ctx) {
  if (typeof document !== "undefined") {
    const toggle = document.querySelector("[data-toggle-motion]");
    if (toggle?.hasAttribute("aria-pressed")) {
      return toggle.getAttribute("aria-pressed") === "true";
    }
  }
  return Boolean(ctx.reducedMotion);
}

function booksRoomDamp(value) {
  return 1 - Math.exp(-Math.max(0, Number(value) || 0));
}

function booksRoomTitleSize(title, width) {
  const length = Array.from(String(title || "")).length;
  if (length <= 3) return Math.round(width * 0.18);
  if (length <= 6) return Math.round(width * 0.15);
  return Math.round(width * 0.12);
}

function booksRoomTitleWeight(title) {
  return /[\u3400-\u9fff]/u.test(String(title || "")) ? 700 : 600;
}

function booksRoomCanvasLines(paint, text, maxWidth) {
  const values = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!values.length) return [""];
  const lines = [];
  let line = "";
  values.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (paint.measureText(candidate).width <= maxWidth) {
      line = candidate;
      return;
    }
    if (line) lines.push(line);
    if (paint.measureText(word).width <= maxWidth) {
      line = word;
      return;
    }
    line = "";
    Array.from(word).forEach((character) => {
      const next = line + character;
      if (line && paint.measureText(next).width > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = next;
      }
    });
  });
  if (line) lines.push(line);
  return lines;
}

function booksRoomEllipsis(paint, text, maxWidth) {
  const value = String(text || "").trim();
  if (paint.measureText(value).width <= maxWidth) return value;
  const characters = Array.from(value);
  while (characters.length && paint.measureText(`${characters.join("")}…`).width > maxWidth) {
    characters.pop();
  }
  return `${characters.join("").trimEnd()}…`;
}

function booksRoomCanvasAlpha(color, alpha) {
  const value = String(color || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    const red = Number.parseInt(value.slice(1, 3), 16);
    const green = Number.parseInt(value.slice(3, 5), 16);
    const blue = Number.parseInt(value.slice(5, 7), 16);
    return `rgba(${red},${green},${blue},${alpha})`;
  }
  return `rgba(255,255,255,${alpha})`;
}

function booksRoomPositiveNumber(value, fallback) {
  const numericValue = booksRoomNumber(value, fallback);
  return numericValue > 0 ? numericValue : fallback;
}

function booksRoomNumber(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function booksRoomClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function buildPoemsRoom(ctx) {
  const THREE = ctx.THREE;
  const group = new THREE.Group();
  group.name = "诗页庭";
  const items = safeItems(ctx.items).slice(0, 3);
  const narrow = isNarrowViewport();
  const initial = poemCameraPose(narrow, false);
  const pageWidth = 4.8;
  const pageHeight = 5;
  const pages = [];

  addRoomLights(THREE, group, {
    hemi: 0x252521,
    ground: 0x080807,
    intensity: 0.86,
    points: [
      [-3.8, 6.8, 6.5, 0xffefd1, 34, 15],
      [4.4, 4.2, 3.1, 0xc9d8d3, 18, 11],
    ],
  });
  const keyLight = new THREE.DirectionalLight(0xfff1d7, 2.1);
  keyLight.position.set(-4.5, 8, 8);
  group.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xb8d0cb, 0.66);
  fillLight.position.set(5, 3.5, 6);
  group.add(fillLight);

  const floorMat = standard(THREE, 0x111311, {
    roughness: 0.94,
    metalness: 0.04,
  });
  const stoneMat = standard(THREE, 0x68665e, {
    roughness: 0.91,
    metalness: 0.02,
  });
  const stoneInsetMat = standard(THREE, 0x7b786f, {
    roughness: 0.96,
    metalness: 0.01,
  });
  const paperEdgeMat = standard(THREE, 0xb8ad97, {
    roughness: 0.88,
    metalness: 0,
  });
  const pageBackMat = standard(THREE, 0x8e8472, {
    roughness: 0.94,
    metalness: 0,
  });
  const hitMaterial = invisibleMaterial(THREE);

  const floor = mesh(
    THREE,
    new THREE.CircleGeometry(narrow ? 7.2 : 9.4, 80),
    floorMat,
    group,
    [0, -0.24, -1.1],
    [-Math.PI / 2, 0, 0]
  );
  floor.name = "poem-court-floor";

  const lowerStone = mesh(
    THREE,
    new THREE.CylinderGeometry(5.75, 6.1, 0.32, 64),
    stoneMat,
    group,
    [0, -0.08, -0.7]
  );
  lowerStone.scale.z = 0.54;
  lowerStone.name = "poem-stone-base";

  const upperStone = mesh(
    THREE,
    new THREE.CylinderGeometry(5.02, 5.2, 0.16, 64),
    stoneInsetMat,
    group,
    [0, 0.15, -0.7]
  );
  upperStone.scale.z = 0.54;
  upperStone.name = "poem-stone-inset";

  items.forEach((item, index) => {
    const page = poemPaper(THREE, ctx, item, index, pageWidth, pageHeight, paperEdgeMat, pageBackMat, hitMaterial, group, narrow);
    if (!page) return;
    const hit = page.hit;
    hit.userData.kind = "poem";
    pages.push({
      index,
      group: page.group,
      hit,
      item,
    });
  });

  if (!items.length) {
    addLabel(THREE, group, ctx, "诗页庭\n暂无诗篇", 0.28, "#d9ddcf", [0, 3.2, 1.2]);
  }

  let selected = items.length ? 0 : -1;

  function layout(nextIndex, overview = false) {
    selected = Number.isInteger(nextIndex) && nextIndex >= 0 && nextIndex < pages.length ? nextIndex : selected;
    pages.forEach((page) => {
      const pose = poemPagePose(page.index, selected, pages.length, narrow, overview);
      poemApplyPagePose(page.group, pose);
    });
    group.userData.selectedPoem = selected;
  }

  layout(selected, true);

  return {
    group,
    camera: initial,
    focus(index) {
      if (!pages.some((page) => page.index === index)) return initial;
      layout(index, false);
      return poemCameraPose(narrow, true);
    },
    overview() {
      layout(selected, true);
      return initial;
    },
  };
}

function poemPaper(THREE, ctx, item, index, width, height, edgeMaterial, backMaterial, hitMaterial, parent, narrow) {
  const page = new THREE.Group();
  page.name = `poem-page-${item.id || index}`;
  page.userData.poemIndex = index;
  parent.add(page);

  const back = addBox(
    THREE,
    page,
    [width + 0.08, height + 0.08, 0.12],
    backMaterial,
    [0, 0, -0.055]
  );
  back.name = "poem-page-thickness";
  addBox(
    THREE,
    page,
    [width + 0.16, 0.055, 0.16],
    edgeMaterial,
    [0, -height / 2 - 0.025, -0.015]
  );

  const texture = poemPaperTexture(THREE, item, index, width / height, narrow);
  const paperMaterial = texture
    ? new THREE.MeshStandardMaterial({
        map: texture,
        color: 0xffffff,
        roughness: 0.92,
        metalness: 0,
        emissive: 0x2a2118,
        emissiveIntensity: 0.08,
        side: THREE.DoubleSide,
      })
    : standard(THREE, 0xd8cfbc, { roughness: 0.96, metalness: 0, side: THREE.DoubleSide });
  const sheet = mesh(
    THREE,
    poemCurvedPlane(THREE, width * 0.965, height * 0.965),
    paperMaterial,
    page,
    [0, 0, 0.018]
  );
  sheet.name = "poem-printed-sheet";

  const hit = addPickBox(
    THREE,
    page,
    ctx,
    hitMaterial,
    width + 0.18,
    height + 0.18,
    0.34,
    [0, 0, 0.1],
    index
  );
  return { group: page, hit };
}

function poemPaperTexture(THREE, item, index, aspect, narrow) {
  if (typeof document === "undefined" || typeof document.createElement !== "function") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = Math.round(canvas.width / aspect);
  const context = canvas.getContext("2d");
  if (!context) return null;

  const paper = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  paper.addColorStop(0, "#eee7d8");
  paper.addColorStop(0.52, "#f7f1e4");
  paper.addColorStop(1, "#ddd4c2");
  context.fillStyle = paper;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const seed = 17 + index * 29;
  for (let fiber = 0; fiber < 180; fiber += 1) {
    const x = poemRandom(seed + fiber * 13) * canvas.width;
    const y = poemRandom(seed + fiber * 31) * canvas.height;
    const length = 10 + poemRandom(seed + fiber * 47) * 56;
    context.strokeStyle = fiber % 4 === 0 ? "rgba(109, 88, 61, 0.055)" : "rgba(255, 255, 255, 0.08)";
    context.lineWidth = 0.6 + poemRandom(seed + fiber * 19) * 0.8;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + length, y + (poemRandom(seed + fiber * 11) - 0.5) * 3);
    context.stroke();
  }

  const fold = context.createLinearGradient(canvas.width * 0.43, 0, canvas.width * 0.57, 0);
  fold.addColorStop(0, "rgba(67, 54, 36, 0)");
  fold.addColorStop(0.48, "rgba(67, 54, 36, 0.06)");
  fold.addColorStop(0.52, "rgba(255, 255, 255, 0.11)");
  fold.addColorStop(1, "rgba(67, 54, 36, 0)");
  context.fillStyle = fold;
  context.fillRect(canvas.width * 0.43, 0, canvas.width * 0.14, canvas.height);

  context.strokeStyle = "rgba(65, 58, 47, 0.2)";
  context.lineWidth = 2;
  context.strokeRect(40, 38, canvas.width - 80, canvas.height - 76);

  const left = narrow ? 62 : 74;
  const gutter = left;
  const contentWidth = canvas.width - left - gutter;
  const title = fieldText(item, "title", "name") || itemTitle(item);
  const author = fieldText(item, "author") || "Unknown author";
  const year = fieldText(item, "year");
  const lines = poemFirstStanza(item);

  const titleSize = poemFitFontSize(
    context,
    title,
    contentWidth,
    narrow ? 58 : 68,
    narrow ? 38 : 48,
    narrow ? 2 : 3,
    "italic",
    700,
    '"Instrument Serif", Georgia, serif'
  );
  context.fillStyle = "#202523";
  context.font = `italic 700 ${titleSize}px "Instrument Serif", Georgia, serif`;
  context.textBaseline = "alphabetic";
  const titleLines = poemWrapCanvasText(context, title, contentWidth, narrow ? 2 : 3);
  const titleTop = narrow ? 82 : 104;
  const titleLineHeight = titleSize * 0.96;
  titleLines.forEach((line, lineIndex) => {
    context.fillText(line, left, titleTop + lineIndex * titleLineHeight);
  });

  const metaY = titleTop + (titleLines.length - 1) * titleLineHeight + (narrow ? 48 : 52);
  context.font = `500 ${narrow ? 34 : 28}px "Space Grotesk", sans-serif`;
  context.fillStyle = "#414944";
  context.fillText(author, left, metaY);
  if (year) {
    context.textAlign = "right";
    context.fillText(year, canvas.width - gutter, metaY);
    context.textAlign = "left";
  }

  const ruleY = metaY + (narrow ? 38 : 46);
  context.strokeStyle = "rgba(51, 55, 49, 0.28)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(left, ruleY);
  context.lineTo(canvas.width - gutter, ruleY);
  context.stroke();

  const bodyTop = ruleY + (narrow ? 48 : 52);
  const body = poemStanzaLayout(
    context,
    lines,
    contentWidth,
    narrow ? 64 : 50,
    narrow ? 46 : 38,
    narrow,
    bodyTop,
    canvas.height - 58
  );
  context.fillStyle = "#1d2522";
  context.font = `400 ${body.size}px "Instrument Serif", Georgia, serif`;
  body.rows.forEach((line, lineIndex) => {
    context.fillText(line.text, left + line.indent, bodyTop + lineIndex * body.lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function poemFirstStanza(item) {
  const stanza = Array.isArray(item?.stanzas) ? item.stanzas.find((entry) => Array.isArray(entry) && entry.length) : null;
  if (stanza) return stanza.map((line) => String(line).trim()).filter(Boolean);
  const fallback = String(item?.text || "")
    .replace(/\r/g, "")
    .split(/\n\s*\n/)[0]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return fallback.length ? fallback : ["Text unavailable in the spatial record."];
}

function poemCameraPose(narrow, focused) {
  const pose = focused
    ? view(narrow ? [0, 2.72, 7.0] : [0, 2.68, 10.35], [0, 2.56, 0.2])
    : view(narrow ? [0, 3.05, 8.3] : [0, 3.08, 13.0], [0, narrow ? 2.9 : 2.58, -0.15]);
  pose.frame = focused
    ? { width: narrow ? 5.2 : 5.5, height: narrow ? 5.35 : 5.9 }
    : { width: narrow ? 5.8 : 10.2, height: narrow ? 6.6 : 6.8 };
  return pose;
}

function poemPagePose(index, selected, total, narrow, overview) {
  if (narrow && overview) {
    if (index === selected) return { position: [0, 4.05, 0.34], rotation: [0, 0, 0], scale: 0.64 };
    const side = poeticPageSide(index, selected, total);
    return { position: [side * 1.3, 1.22, 0.1], rotation: [0, -side * 0.08, side * 0.025], scale: 0.43 };
  }
  if (index === selected) {
    return {
      position: [0, 2.72, 0.34],
      rotation: [0, 0, 0],
      scale: 1,
    };
  }
  const side = poeticPageSide(index, selected, total);
  return {
    position: [side * (narrow ? 2.72 : 3.38), 2.27, -1.38],
    rotation: [0.015, -side * (overview ? 0.38 : 0.31), side * 0.045],
    scale: 0.63,
  };
}

function poeticPageSide(index, selected, total) {
  const others = Array.from({ length: total }, (_, candidate) => candidate).filter(candidate => candidate !== selected);
  return others.indexOf(index) === 0 ? -1 : 1;
}

function poemApplyPagePose(page, pose) {
  page.position.set(pose.position[0], pose.position[1], pose.position[2]);
  page.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
  page.scale.setScalar(pose.scale);
}

function poemCurvedPlane(THREE, width, height) {
  const geometry = new THREE.PlaneGeometry(width, height, 24, 18);
  const positions = geometry.attributes.position;
  const halfWidth = width / 2;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index) / halfWidth;
    const y = positions.getY(index) / (height / 2);
    const curve = Math.abs(x) ** 2.8 * 0.085;
    const paperWave = Math.sin((y + 1) * Math.PI) * 0.008;
    positions.setZ(index, curve + paperWave);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function poemFitFontSize(context, text, maxWidth, preferred, minimum, maxLines, style, weight, family) {
  let size = preferred;
  while (size > minimum) {
    context.font = `${style} ${weight} ${size}px ${family}`;
    if (poemWrapCanvasText(context, text, maxWidth, maxLines + 1).length <= maxLines) return size;
    size -= 2;
  }
  return minimum;
}

function poemStanzaLayout(context, lines, maxWidth, preferred, minimum, wrap, bodyTop, maxBottom) {
  let size = preferred;
  let result = null;
  while (size >= minimum) {
    context.font = `400 ${size}px "Instrument Serif", Georgia, serif`;
    const rows = poemStanzaRows(context, lines, maxWidth, size, wrap);
    const lineHeight = size * (wrap ? 1.2 : 1.34);
    result = { size, rows, lineHeight };
    const widest = Math.max(0, ...rows.map((row) => context.measureText(row.text).width + row.indent));
    if (widest <= maxWidth && bodyTop + Math.max(0, rows.length - 1) * lineHeight <= maxBottom) return result;
    size -= 1;
  }
  return result;
}

function poemStanzaRows(context, lines, maxWidth, size, wrap) {
  if (!wrap) return lines.map((line) => ({ text: line, indent: 0 }));
  const rows = [];
  const continuationIndent = size * 0.62;
  lines.forEach((line) => {
    const words = line.split(/\s+/).filter(Boolean);
    let row = "";
    words.forEach((word) => {
      const indent = rows.length && rows[rows.length - 1]?.continuation ? continuationIndent : 0;
      const limit = maxWidth - (row ? 0 : indent);
      const next = row ? `${row} ${word}` : word;
      if (!row || context.measureText(next).width <= limit) {
        row = next;
      } else {
        rows.push({ text: row, indent, continuation: false });
        row = word;
        rows[rows.length - 1].continuation = true;
      }
    });
    if (row) rows.push({ text: row, indent: 0, continuation: false });
  });
  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1];
    if (previous.continuation) rows[index].indent = continuationIndent;
  }
  return rows;
}

function poemWrapCanvasText(context, text, maxWidth, maxLines = Infinity) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let line = words[0];
  for (const word of words.slice(1)) {
    const next = `${line} ${word}`;
    if (context.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  return lines;
}

function poemRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function buildPaintingsRoom(ctx) {
  const THREE = ctx.THREE;
  const group = new THREE.Group();
  group.name = "恒光穹殿";
  const items = safeItems(ctx.items).slice(0, 9);
  const narrow = isNarrowViewport();
  const reduced = Boolean(ctx.reducedMotion);
  const initial = { ...view([0, 3.6, 11], [0, 3.3, -3.4]), frame: { width: 12.2, height: 7 } };
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
      new THREE.TorusGeometry(archRadius, 0.026, 8, 48, Math.PI),
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

  for (const angle of [-1.46, 1.46]) {
    addBox(
      THREE,
      group,
      [0.12, 6.5, 0.16],
      goldMat,
      [Math.sin(angle) * (radius + 0.3), 3.25, -Math.cos(angle) * (radius + 0.3) - 0.8],
      [0, -angle, 0]
    );
  }

  let selected = -1;

  return {
    group,
    camera: initial,
    overview() {
      selected = -1;
      paintingEntries.forEach(entry => { entry.holder.position.copy(entry.position); entry.holder.rotation.set(0, -entry.angle, 0); });
      return initial;
    },
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

    },
    focus(index) {
      const entry = paintingEntries.find((candidate) => candidate.index === index);
      if (!entry) return initial;
      selected = index;
      paintingEntries.forEach(candidate => {
        candidate.holder.position.copy(candidate.position);
        candidate.holder.rotation.set(0, -candidate.angle, 0);
      });
      entry.holder.position.set(0, 3.1, 1);
      entry.holder.rotation.set(0, 0, 0);
      return { ...view([0, 3.1, 8], [0, 3.1, 1]), frame: { width: entry.width + 0.9, height: entry.height + 1.3 } };
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
  const initial = { ...view([5.5, 5.2, 10.5], [0, 2.1, 0.05]), frame: { width: 8.4, height: 7 } };
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
  const start = from.isVector3 ? from.clone() : new THREE.Vector3(...from);
  const end = to.isVector3 ? to.clone() : new THREE.Vector3(...to);
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
