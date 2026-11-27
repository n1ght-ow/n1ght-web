const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const QUARTER_PI = Math.PI / 4;
const LAYOUTS = ["ring", "spiral", "linear"];

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function wrapIndex(index, length) {
  if (!length) return -1;
  return ((Number(index) || 0) % length + length) % length;
}

function damp(current, target, smoothing, delta) {
  return current + (target - current) * (1 - Math.exp(-smoothing * delta));
}

function dampAngle(current, target, smoothing, delta) {
  let difference = (target - current + Math.PI) % TAU;
  if (difference < 0) difference += TAU;
  difference -= Math.PI;
  return current + difference * (1 - Math.exp(-smoothing * delta));
}

function easeInOut(value) {
  const t = clamp(Number(value) || 0, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function normalizeAngle(angle) {
  return ((angle % TAU) + TAU) % TAU;
}

function shortText(value, limit = 28) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1).trimEnd() + "…";
}

function controlKey(value) {
  const key = String(value || "").toLowerCase();
  if (["arrowright", "right", "d"].includes(key)) return "right";
  if (["arrowleft", "left", "a"].includes(key)) return "left";
  if (["arrowup", "up", "w"].includes(key)) return "up";
  if (["arrowdown", "down", "s"].includes(key)) return "down";
  if (["enter", " ", "space", "spacebar"].includes(key)) return "activate";
  return key;
}

function disposeTextMesh(mesh) {
  if (!mesh) return;
  mesh.removeFromParent();
  const materialList = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  materialList.forEach((material) => {
    if (!material) return;
    if (material.userData?.experienceTextTexture && material.map) material.map.dispose();
    material.dispose();
  });
  mesh.geometry?.dispose();
}

export function buildExperience(kit) {
  if (!kit || !kit.THREE) throw new TypeError("curate experience requires a Three.js kit");
  if (!kit.sculpt) throw new TypeError("curate experience requires kit.sculpt");

  const THREE = kit.THREE;
  const sculpt = kit.sculpt;
  const group = new THREE.Group();
  group.name = "experience-curate-memory-theatre";

  const ownedMaterials = new Set();
  const ownedGeometries = new Set();
  const textMeshes = new Set();

  const ownMaterial = (material) => {
    material.userData = material.userData || {};
    material.userData.experienceOwned = true;
    ownedMaterials.add(material);
    return material;
  };

  const ownGeometry = (geometry) => {
    geometry.userData = geometry.userData || {};
    geometry.userData.experienceOwned = true;
    ownedGeometries.add(geometry);
    return geometry;
  };

  const rawMaterial = (color, roughness = 0.65, metalness = 0) =>
    ownMaterial(new THREE.MeshStandardMaterial({ color, roughness, metalness }));

  const materials = {
    porcelain: kit.material("#b8b0a1", 0.84, 0.01),
    stone: kit.material("#918d83", 0.92, 0.01),
    jade: kit.material("#40534a", 0.68, 0.06),
    forest: rawMaterial("#26352f", 0.64, 0.08),
    ink: kit.dark || kit.material("#1b1d1b", 0.56, 0.12),
    walnut: kit.walnut || kit.material("#3b2b23", 0.76, 0.02),
    brass: kit.brass || kit.material("#a38355", 0.42, 0.58),
    copper: rawMaterial("#806047", 0.52, 0.46),
    coral: rawMaterial("#8e5851", 0.58, 0.12),
    sapphire: rawMaterial("#435867", 0.5, 0.18),
    paper: rawMaterial("#d8cdb9", 0.9, 0),
    glass: ownMaterial(new THREE.MeshStandardMaterial({
      color: "#aeb5aa",
      transparent: true,
      opacity: 0.1,
      roughness: 0.14,
      metalness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    })),
    veil: ownMaterial(new THREE.MeshStandardMaterial({
      color: "#eadfc8",
      transparent: true,
      opacity: 0.12,
      roughness: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    })),
  };

  const beamGeometry = ownGeometry(new THREE.BoxGeometry(1, 1, 1));
  function makeText(width, height, text, position, parent = group, options = {}) {
    const mesh = sculpt.text(text, width, height, parent, {
      background: options.background ?? null,
      color: options.color ?? "#eee7d7",
      fontSize: options.fontSize ?? 64,
      padding: options.padding ?? 18,
      align: options.align ?? "center",
      serif: options.serif ?? true,
    });
    if (mesh) {
      mesh.position.set(position[0], position[1], position[2]);
      mesh.userData.pickThrough = true;
      if (options.rotation) mesh.rotation.set(...options.rotation);
      mesh.material.userData = mesh.material.userData || {};
      mesh.material.userData.experienceTextTexture = Boolean(mesh.material.map);
      textMeshes.add(mesh);
      mesh.userData.experienceText = true;
    }
    return mesh;
  }

  function replaceText(existing, width, height, text, position, parent = group, options = {}) {
    textMeshes.delete(existing);
    disposeTextMesh(existing);
    return makeText(width, height, text, position, parent, options);
  }

  function makeLine(points, color, parent = group) {
    const line = kit.line(points, color, parent);
    if (line) {
      line.material.userData = line.material.userData || {};
      line.material.userData.experienceOwned = true;
      ownedMaterials.add(line.material);
      line.geometry.userData = line.geometry.userData || {};
      line.geometry.userData.experienceOwned = true;
      ownedGeometries.add(line.geometry);
    }
    return line;
  }

  function makeCable() {
    const geometry = ownGeometry(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const material = ownMaterial(new THREE.LineBasicMaterial({
      color: "#c9a367",
      transparent: true,
      opacity: 0.7,
    }));
    return new THREE.Line(geometry, material);
  }

  const architecture = new THREE.Group();
  architecture.name = "memory-theatre-armature";
  group.add(architecture);

  const splitStage = new THREE.Group();
  splitStage.name = "split-stage-decks";
  group.add(splitStage);
  const deckPieces = [
    [-2.7, 0.2, 0.42, 3.05, 0.24, 1.62, -0.07, materials.stone],
    [0.08, 0.13, -1.18, 2.52, 0.18, 1.36, 0.04, materials.jade],
    [2.82, 0.24, 0.72, 2.62, 0.26, 1.5, 0.11, materials.stone],
  ];
  deckPieces.forEach(([x, y, z, width, height, depth, rotation, material], index) => {
    const deck = sculpt.rounded(width, height, depth, material, splitStage, [x, y, z], 0.12);
    deck.rotation.y = rotation;
    const seam = sculpt.tube(
      [
        new THREE.Vector3(x - width * 0.42, y + height * 0.65, z - depth * 0.48),
        new THREE.Vector3(x + width * 0.44, y + height * 0.65, z - depth * 0.48),
      ],
      0.018,
      index === 1 ? materials.brass : materials.copper,
      splitStage,
      24,
      6,
    );
    seam.rotation.y = rotation;
    const underRibs = [];
    for (let rib = 0; rib < 8; rib += 1) {
      underRibs.push({
        position: [
          x - width * 0.36 + rib * width * 0.1,
          y - height * 0.62,
          z,
        ],
        rotation: [0, rotation, 0],
        scale: [0.035, 0.16, depth * 0.72],
      });
    }
    sculpt.instances(beamGeometry, materials.brass, underRibs, splitStage);
  });

  const mechanicalBed = new THREE.Group();
  mechanicalBed.name = "counterweight-mechanism-bed";
  group.add(mechanicalBed);
  for (const side of [-1, 1]) {
    sculpt.tube(
      [
        new THREE.Vector3(side * 3.72, 0.24, -1.75),
        new THREE.Vector3(side * 3.72, 0.34, 1.58),
      ],
      0.055,
      materials.walnut,
      mechanicalBed,
      20,
      8,
    );
    const guidePlacements = [];
    for (let index = 0; index < 13; index += 1) {
      guidePlacements.push({
        position: [side * 3.72, 0.4, -1.64 + index * 0.27],
        rotation: [0, 0, 0],
        scale: [0.16, 0.05, 0.05],
      });
    }
    sculpt.instances(beamGeometry, materials.copper, guidePlacements, mechanicalBed);
  }

  for (let index = 0; index < 4; index += 1) {
    const x = -2.55 + index * 1.68;
    const base = sculpt.lathe(
      [
        [0, 0],
        [0.34, 0],
        [0.36, 0.07],
        [0.24, 0.14],
        [0.13, 0.34],
        [0.1, 1.08],
        [0, 1.1],
      ],
      materials.walnut,
      mechanicalBed,
      [x, 0.32, -1.42],
      40,
    );
    base.scale.z = 0.78;
    const gear = sculpt.gear(0.22, 0.07, 14, materials.brass, mechanicalBed, [x, 1.54, -1.42]);
    gear.rotation.z = index * 0.2;
  }
  for (const side of [-1, 1]) {
    const shaftStart = new THREE.Vector3(side * 2.96, 1.28, -3.72);
    const shaftEnd = new THREE.Vector3(side * 1.9, 1.22, -3.66);
    sculpt.tube([shaftStart, shaftEnd], 0.032, materials.brass, mechanicalBed, 24, 7);
    [shaftStart, shaftEnd].forEach((point) => {
      sculpt.lathe(
        [
          [0, 0],
          [0.11, 0],
          [0.13, 0.035],
          [0.08, 0.075],
          [0, 0.09],
        ],
        materials.forest,
        mechanicalBed,
        [point.x, point.y - 0.02, point.z],
        24,
      );
      sculpt.ring(0.12, 0.014, materials.copper, mechanicalBed, [point.x, point.y + 0.03, point.z]).rotation.x = HALF_PI;
    });
  }

  const proscenium = new THREE.Group();
  proscenium.name = "three-layer-proscenium";
  group.add(proscenium);

  const archPoints = [];
  for (let index = 0; index <= 42; index += 1) {
    const angle = Math.PI - (index / 42) * Math.PI;
    archPoints.push(new THREE.Vector3(Math.cos(angle) * 3.95, 2.62 + Math.sin(angle) * 4.25, -0.62));
  }
  sculpt.tube(archPoints, 0.085, materials.brass, proscenium, 96, 10);
  sculpt.tube(
    archPoints.map((point, index) => point.clone().add(new THREE.Vector3(
      0,
      0.18 * Math.sin(index * 0.45),
      -0.13,
    ))),
    0.026,
    materials.copper,
    proscenium,
    96,
    7,
  );
  sculpt.tube(
    archPoints.map((point) => point.clone().multiply(new THREE.Vector3(0.76, 0.86, 1))),
    0.018,
    materials.jade,
    proscenium,
    96,
    6,
  );

  for (const side of [-1, 1]) {
    const column = sculpt.lathe(
      [
        [0, 0],
        [0.42, 0],
        [0.44, 0.12],
        [0.26, 0.2],
        [0.2, 5.72],
        [0.32, 5.93],
        [0.42, 6.08],
        [0, 6.14],
      ],
      materials.walnut,
      proscenium,
      [side * 3.94, 0.2, -0.62],
      48,
    );
    column.scale.set(0.78, 1, 0.58);
    const flutes = [];
    for (let flute = 0; flute < 13; flute += 1) {
      const angle = flute / 13 * TAU;
      flutes.push({
        position: [side * 3.94 + Math.cos(angle) * 0.22, 2.94, -0.62 + Math.sin(angle) * 0.16],
        rotation: [0, angle, 0],
        scale: [0.018, 5.15, 0.018],
      });
    }
    sculpt.instances(beamGeometry, materials.copper, flutes, proscenium);
    sculpt.ring(0.48, 0.045, materials.brass, proscenium, [side * 3.94, 5.9, -0.62]);
  }

  const upperTrack = sculpt.ring(2.72, 0.075, materials.brass, proscenium, [0, 6.92, -1.8], TAU);
  upperTrack.rotation.x = HALF_PI;
  upperTrack.scale.y = 0.5;
  const trackGlowMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: "#d7b778",
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  const trackGlow = sculpt.ring(2.72, 0.18, trackGlowMaterial, proscenium, [0, 6.92, -1.8], TAU);
  trackGlow.rotation.x = HALF_PI;
  trackGlow.scale.y = 0.5;
  trackGlow.renderOrder = 2;

  const trussPlacements = [];
  for (let ring = 0; ring < 3; ring += 1) {
    for (let index = 0; index < 20; index += 1) {
      const angle = index / 20 * TAU + ring * Math.PI / 20;
      const radius = 1.36 + ring * 0.68;
      trussPlacements.push({
        position: [Math.cos(angle) * radius, 6.04 + ring * 0.29, -1.8 + Math.sin(angle) * radius * 0.5],
        rotation: [0, -angle, 0],
        scale: [0.04, 0.04, ring === 2 ? 0.58 : 0.42],
      });
    }
  }
  sculpt.instances(beamGeometry, materials.porcelain, trussPlacements, proscenium);

  const stageLights = new THREE.Group();
  stageLights.name = "folding-lamp-arms";
  group.add(stageLights);
  const lightBeamMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: "#f0d9a0",
    transparent: true,
    opacity: 0.035,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  }));
  const lightBeamGeometry = ownGeometry(new THREE.ConeGeometry(0.52, 1.42, 20, 1, true));
  const foldingLamps = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 3.05, 5.3, 0.28);
    pivot.rotation.z = -side * 0.32;
    stageLights.add(pivot);
    sculpt.ring(0.2, 0.035, materials.brass, pivot, [0, 0, 0]);
    const armA = new THREE.Group();
    pivot.add(armA);
    sculpt.tube(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.72, -0.12, 0.12),
      ],
      0.035,
      materials.copper,
      armA,
      18,
      7,
    );
    const armB = new THREE.Group();
    armB.position.set(side * 0.72, -0.12, 0.12);
    armA.add(armB);
    sculpt.tube(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.48, -0.45, 0.18),
      ],
      0.024,
      materials.brass,
      armB,
      16,
      6,
    );
    const lamp = sculpt.lathe(
      [
        [0, 0],
        [0.12, 0],
        [0.24, 0.1],
        [0.32, 0.36],
        [0.18, 0.46],
        [0, 0.48],
      ],
      materials.ink,
      armB,
      [side * 0.48, -0.46, 0.18],
      32,
    );
    lamp.rotation.z = Math.PI;
    sculpt.ring(0.22, 0.025, materials.brass, armB, [side * 0.48, -0.54, 0.18]);
    const beam = new THREE.Mesh(lightBeamGeometry, lightBeamMaterial);
    beam.position.set(side * 0.48, -1.15, 0.18);
    beam.rotation.z = side * 0.1;
    beam.renderOrder = 1;
    armB.add(beam);
    foldingLamps.push({ side, pivot, armA, armB, beam });
  }
  proscenium.scale.set(0.94, 0.76, 0.84);
  proscenium.position.z = -0.82;
  stageLights.scale.set(0.86, 0.78, 0.82);
  stageLights.position.z = -0.34;

  const veilGeometryA = (() => {
    const helper = new THREE.Group();
    const mesh = sculpt.surface(
      (u, v) => [
        (u - 0.5) * 4.4 + Math.sin(v * Math.PI) * 0.25,
        2.2 + v * 3.75,
        -1.32 + Math.sin(u * Math.PI * 2.2 + v * 3) * 0.18,
      ],
      18,
      12,
      materials.veil,
      helper,
    );
    helper.remove(mesh);
    ownGeometry(mesh.geometry);
    return mesh.geometry;
  })();
  const veilA = new THREE.Mesh(veilGeometryA, materials.veil);
  veilA.rotation.y = -0.18;
  proscenium.add(veilA);
  const veilB = new THREE.Mesh(veilGeometryA, materials.glass);
  veilB.rotation.y = 0.26;
  veilB.position.x = 0.4;
  proscenium.add(veilB);

  const artRig = new THREE.Group();
  artRig.name = "suspended-art-rig";
  group.add(artRig);

  const liftConsole = new THREE.Group();
  liftConsole.name = "three-lift-console";
  group.add(liftConsole);
  const rowLift = [0, 0, 0];
  const LIFT_MIN = -0.2;
  const LIFT_MAX = 0.2;
  const rowNames = ["下层", "中层", "上层"];
  const actuators = [];

  for (let row = 0; row < 3; row += 1) {
    const root = new THREE.Group();
    root.position.set([-3.36, 3.36, 3.36][row], 0.16, [3.28, 3.28, 4.38][row]);
    root.scale.setScalar(0.48);
    root.rotation.y = -0.08 + row * 0.08;
    liftConsole.add(root);
    sculpt.lathe(
      [
        [0, 0],
        [0.46, 0],
        [0.46, 0.08],
        [0.3, 0.16],
        [0.2, 0.45],
        [0.2, 1.15],
        [0, 1.18],
      ],
      materials.walnut,
      root,
      [0, 0, 0],
      42,
    );
    const piston = sculpt.lathe(
      [
        [0, 0],
        [0.09, 0],
        [0.09, 1],
        [0.14, 1.04],
        [0, 1.08],
      ],
      materials.copper,
      root,
      [0, 1.16, 0],
      32,
    );
    const gear = sculpt.gear(0.36, 0.1, 20, materials.brass, root, [0, 0.92, 0.26]);
    makeText(
      0.56,
      0.13,
      rowNames[row],
      [0, 0.52, 0.34],
      root,
      { color: "#ece2cc", fontSize: 48, background: "#263934" },
    );

    const channel = new THREE.Group();
    channel.name = "lift-channel-" + row;
    channel.position.set((row - 1) * 1.16, 1.5 + row * 0.56, -3.92);
    liftConsole.add(channel);
    sculpt.rounded(1.34, 0.2, 0.28, materials.walnut, channel, [0, 0, 0], 0.045);
    sculpt.rounded(0.98, 0.045, 0.14, materials.ink, channel, [0, 0.12, 0.08], 0.03);
    for (const side of [-1, 1]) {
      sculpt.lathe(
        [
          [0, 0],
          [0.13, 0],
          [0.15, 0.035],
          [0.09, 0.09],
          [0, 0.11],
        ],
        materials.forest,
        channel,
        [side * 0.61, 0.04, 0],
        28,
      );
      sculpt.ring(0.135, 0.016, materials.brass, channel, [side * 0.61, 0.15, 0]).rotation.x = HALF_PI;
    }
    const telescope = sculpt.rounded(0.52, 0.075, 0.14, materials.copper, channel, [0, 0.15, 0.08], 0.025);
    const carriage = sculpt.rounded(0.3, 0.12, 0.22, materials.brass, channel, [0, 0.22, 0.1], 0.03);
    const counterweight = sculpt.rounded(0.24, 0.46, 0.2, materials.jade, channel, [0.42, -0.24, -0.04], 0.035);

    const pushHandle = new THREE.Group();
    pushHandle.position.set(0, 1.14, 0.56);
    root.add(pushHandle);
    const tickPlacements = [];
    for (let tick = 0; tick < 5; tick += 1) {
      tickPlacements.push({
        position: [0.3, 0.72 + tick * 0.14, 0.32],
        rotation: [0, 0, 0],
        scale: [0.12 + tick * 0.018, 0.014, 0.018],
      });
    }
    sculpt.instances(beamGeometry, materials.brass, tickPlacements, root);
    const levelMaterial = ownMaterial(new THREE.MeshBasicMaterial({
      color: "#d8bd82",
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    }));
    const levelMarker = new THREE.Mesh(
      ownGeometry(new THREE.SphereGeometry(0.045, 12, 8)),
      levelMaterial,
    );
    levelMarker.position.set(0.41, 1.14, 0.34);
    root.add(levelMarker);
    sculpt.tube(
      [
        new THREE.Vector3(0, -0.2, 0),
        new THREE.Vector3(0, 0.12, 0.18),
      ],
      0.028,
      materials.copper,
      pushHandle,
      16,
      7,
    );
    sculpt.lathe(
      [
        [0, 0],
        [0.1, 0],
        [0.13, 0.05],
        [0.1, 0.16],
        [0, 0.2],
      ],
      [materials.forest, materials.jade, materials.ink][row],
      pushHandle,
      [0, 0.14, 0.2],
      30,
    );
    sculpt.ring(0.15, 0.018, materials.brass, pushHandle, [0, 0.14, 0.225]);

    const glowMaterial = ownMaterial(new THREE.MeshBasicMaterial({
      color: "#d2ae6d",
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    const glow = sculpt.ring(0.19, 0.025, glowMaterial, pushHandle, [0, 0.14, 0.24]);
    glow.renderOrder = 2;
    const hitMaterial = ownMaterial(new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      colorWrite: false,
    }));
    const hit = new THREE.Mesh(ownGeometry(new THREE.SphereGeometry(0.32, 14, 10)), hitMaterial);
    hit.position.set(0, 1.28, 0.78);
    root.add(hit);
    actuators.push({
      root,
      row,
      piston,
      gear,
      channel,
      telescope,
      carriage,
      counterweight,
      pushHandle,
      levelMarker,
      levelMaterial,
      glowMaterial,
      hit,
      glow,
    });
  }

  const slotRecords = Array.from({ length: 7 }, (_, index) => ({
    index,
    item: null,
    root: null,
    frame: null,
    hit: null,
    image: null,
    backImage: null,
    imageMaterial: null,
    imageUrl: "",
    fallbackText: null,
    plaqueLabel: null,
    plaqueBackLabel: null,
    plaque: null,
    plaqueBack: null,
    cable: null,
    trolley: null,
    emptyMark: null,
    target: new THREE.Vector3(),
    targetYaw: 0,
    row: index < 3 ? 0 : index < 5 ? 1 : 2,
    dragStart: new THREE.Vector3(),
    dragFrameQuaternion: new THREE.Quaternion(),
    dragRootQuaternion: new THREE.Quaternion(),
    dragX: 0,
    dragY: 0,
    keyboardMoved: false,
  }));

  let actualItems = [];
  let layoutIndex = 0;
  let dragging = null;
  let draggingSlot = -1;
  let layoutAngle = 0;
  let layoutTargetAngle = 0;
  let statusText = "";
  let lastTime = 0;
  let active = true;
  let refreshRevision = 0;
  let layoutTransition = null;

  function layoutName() {
    return LAYOUTS[layoutIndex];
  }

  function slotPose(index) {
    const record = slotRecords[index];
    const lift = rowLift[record.row];
    if (layoutName() === "ring") {
      const positions = [
        [-2.62, 2.24, 0.34],
        [-1.34, 2.35, 0.58],
        [1.34, 2.35, 0.58],
        [2.62, 2.24, 0.34],
        [-1.92, 4.56, -0.28],
        [0, 4.76, -0.5],
        [1.92, 4.56, -0.28],
      ];
      const position = positions[index];
      return {
        position: new THREE.Vector3(position[0], position[1] + lift, position[2]),
        yaw: -position[0] * 0.025,
      };
    }
    if (layoutName() === "spiral") {
      const t = index / 6;
      const x = -2.55 + t * 5.1;
      return {
        position: new THREE.Vector3(x, 1.92 + t * 3.26 + lift, 1.08 - t * 1.52),
        yaw: -x * 0.026,
      };
    }
    if (layoutName() === "linear") {
      const row = record.row;
      const rowStart = row === 0 ? 0 : row === 1 ? 3 : 5;
      const count = row === 0 ? 3 : 2;
      const column = index - rowStart;
      const spread = count === 1 ? 0 : column - (count - 1) / 2;
      return {
        position: new THREE.Vector3(
          spread * 1.66,
          [2.12, 3.88, 5.64][row] + lift,
          0.46 - row * 0.38,
        ),
        yaw: -spread * 0.025,
      };
    }
    return {
      position: new THREE.Vector3(0, 2.2, 0),
      yaw: 0,
    };
  }

  function updateCable(record) {
    if (!record.cable) return;
    const anchorAngle = layoutName() === "linear"
      ? -HALF_PI + record.index / 7 * TAU
      : Math.atan2(record.root.position.z, record.root.position.x);
    const top = new THREE.Vector3(
      Math.cos(anchorAngle) * 2.72,
      6.92,
      -1.8 + Math.sin(anchorAngle) * 1.36,
    );
    const bottom = new THREE.Vector3(
      record.root.position.x,
      record.root.position.y + 0.89,
      record.root.position.z,
    );
    const array = record.cable.geometry.attributes.position.array;
    array[0] = top.x;
    array[1] = top.y;
    array[2] = top.z;
    array[3] = bottom.x;
    array[4] = bottom.y;
    array[5] = bottom.z;
    record.cable.geometry.attributes.position.needsUpdate = true;
    if (record.trolley) {
      record.trolley.position.copy(top);
      record.trolley.rotation.y = -anchorAngle;
    }
  }

  function createEmptyMark(parent) {
    const mark = new THREE.Group();
    parent.add(mark);
    sculpt.tube(
      [
        new THREE.Vector3(-0.42, -0.56, 0),
        new THREE.Vector3(0.42, 0.56, 0),
      ],
      0.018,
      materials.brass,
      mark,
      16,
      6,
    );
    sculpt.tube(
      [
        new THREE.Vector3(0.42, -0.56, 0),
        new THREE.Vector3(-0.42, 0.56, 0),
      ],
      0.018,
      materials.brass,
      mark,
      16,
      6,
    );
    sculpt.ring(0.52, 0.018, materials.copper, mark, [0, 0, 0], TAU);
    return mark;
  }

  function dragWorldUnitsPerPixel() {
    const scale = kit.getDragScale?.();
    if (Number.isFinite(Number(scale))) return Math.max(0.0001, Number(scale));
    const nested = scale?.worldUnitsPerPixel ?? scale?.unitsPerPixel ?? scale?.scale;
    return Number.isFinite(Number(nested)) ? Math.max(0.0001, Number(nested)) : 1 / 58;
  }

  function dragDeltaForFrame(context, record) {
    const delta = context?.delta;
    if (
      delta &&
      Number.isFinite(Number(delta.x)) &&
      Number.isFinite(Number(delta.y)) &&
      Number.isFinite(Number(delta.z))
    ) {
      return new THREE.Vector3(delta.x, delta.y, delta.z)
        .applyQuaternion(record.dragFrameQuaternion)
        .applyQuaternion(record.dragRootQuaternion);
    }

    record.dragX += Number(context?.dx) || 0;
    record.dragY += Number(context?.dy) || 0;
    const unitsPerPixel = dragWorldUnitsPerPixel();
    return new THREE.Vector3(
      record.dragX * unitsPerPixel,
      -record.dragY * unitsPerPixel,
      0,
    ).applyQuaternion(record.dragRootQuaternion.clone().invert());
  }

  function separateDraggedFrame(record, position) {
    const adjusted = position.clone();
    slotRecords.forEach((other) => {
      if (other.index === record.index || !other.root) return;
      const dx = adjusted.x - other.root.position.x;
      const dy = adjusted.y - other.root.position.y;
      const dz = adjusted.z - other.root.position.z;
      if (Math.abs(dx) >= 1.48 || Math.abs(dy) >= 1.88 || Math.abs(dz) >= 0.38) return;
      const overlapX = 1.48 - Math.abs(dx);
      const overlapY = 1.88 - Math.abs(dy);
      if (overlapX < overlapY) {
        adjusted.x = other.root.position.x + (dx < 0 ? -1.48 : 1.48);
      } else {
        adjusted.y = other.root.position.y + (dy < 0 ? -1.88 : 1.88);
      }
    });
    adjusted.x = clamp(adjusted.x, -4.3, 4.3);
    adjusted.y = clamp(adjusted.y, 0.82, 5.7);
    adjusted.z = clamp(adjusted.z, -4.3, 4.3);
    return adjusted;
  }

  function makeSlot(index) {
    const record = slotRecords[index];
    const root = new THREE.Group();
    root.name = "curated-stage-slot-" + index;
    artRig.add(root);
    record.root = root;

    const frame = new THREE.Group();
    root.add(frame);
    record.frame = frame;
    sculpt.rounded(1.54, 2.04, 0.11, materials.walnut, frame, [0, 0, 0], 0.075);
    sculpt.rounded(1.34, 1.82, 0.04, materials.paper, frame, [0, 0, 0.075], 0.035);
    sculpt.tube(
      [
        new THREE.Vector3(-0.7, -0.92, 0.13),
        new THREE.Vector3(0.7, -0.92, 0.13),
        new THREE.Vector3(0.7, 0.92, 0.13),
        new THREE.Vector3(-0.7, 0.92, 0.13),
        new THREE.Vector3(-0.7, -0.92, 0.13),
      ],
      0.021,
      materials.brass,
      frame,
      36,
      7,
    );

    const image = kit.image("", 1.2, 1.68, frame);
    record.image = image;
    if (image) {
      image.position.set(0, 0, 0.115);
      image.material = image.material || new THREE.MeshBasicMaterial();
      image.material.side = THREE.DoubleSide;
      image.material.toneMapped = false;
      image.material.transparent = true;
      image.material.opacity = 1;
      ownMaterial(image.material);
      record.imageMaterial = image.material;

      const backImage = new THREE.Mesh(image.geometry, record.imageMaterial);
      backImage.position.set(0, 0, -0.145);
      backImage.rotation.y = Math.PI;
      backImage.renderOrder = 2;
      frame.add(backImage);
      record.backImage = backImage;

      sculpt.tube(
        [
          new THREE.Vector3(-0.66, -0.88, -0.175),
          new THREE.Vector3(0.66, -0.88, -0.175),
          new THREE.Vector3(0.66, 0.88, -0.175),
          new THREE.Vector3(-0.66, 0.88, -0.175),
          new THREE.Vector3(-0.66, -0.88, -0.175),
        ],
        0.014,
        materials.copper,
        frame,
        32,
        6,
      );
    }

    record.fallbackText = makeText(
      1.04,
      0.3,
      `空展位 ${String(index + 1).padStart(2, "0")}`,
      [0, 0, 0.19],
      frame,
      { color: "#d8cdb8", fontSize: 54, background: null },
    );
    record.emptyMark = createEmptyMark(frame);
    record.emptyMark.position.z = 0.18;

    const hitMaterial = ownMaterial(new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      colorWrite: false,
      side: THREE.DoubleSide,
    }));
    const hit = new THREE.Mesh(ownGeometry(new THREE.BoxGeometry(1.72, 2.2, 0.34)), hitMaterial);
    hit.position.z = 0.04;
    frame.add(hit);
    record.hit = hit;

    const plaque = sculpt.rounded(0.94, 0.12, 0.045, materials.walnut, root, [0, -0.96, 0.235], 0.025);
    const plaqueBack = sculpt.rounded(0.94, 0.12, 0.045, materials.walnut, root, [0, -0.96, -0.235], 0.025);
    plaqueBack.rotation.y = Math.PI;
    record.plaque = plaque;
    record.plaqueBack = plaqueBack;
    record.plaqueLabel = makeText(
      0.86,
      0.08,
      `EMPTY ${String(index + 1).padStart(2, "0")}`,
      [0, -0.96, 0.265],
      root,
      { color: "#e8dfca", fontSize: 48 },
    );
    record.plaqueBackLabel = makeText(
      0.86,
      0.08,
      `EMPTY ${String(index + 1).padStart(2, "0")}`,
      [0, -0.96, -0.265],
      root,
      { color: "#e8dfca", fontSize: 48, rotation: [0, Math.PI, 0] },
    );
    const plaqueHitMaterial = ownMaterial(new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      colorWrite: false,
    }));
    const plaqueHit = new THREE.Mesh(
      ownGeometry(new THREE.BoxGeometry(1.12, 0.24, 0.62)),
      plaqueHitMaterial,
    );
    plaqueHit.position.set(0, -0.96, 0);
    root.add(plaqueHit);

    const cable = makeCable();
    artRig.add(cable);
    record.cable = cable;
    const trolley = new THREE.Group();
    trolley.position.set(0, 6.92, 0);
    artRig.add(trolley);
    sculpt.rounded(0.24, 0.08, 0.14, materials.brass, trolley, [0, 0, 0], 0.025);
    sculpt.lathe(
      [
        [0, 0],
        [0.07, 0],
        [0.08, 0.025],
        [0.055, 0.07],
        [0, 0.08],
      ],
      materials.copper,
      trolley,
      [0, -0.065, 0.02],
      20,
    );
    const trolleyBearing = sculpt.ring(0.085, 0.012, materials.ink, trolley, [0, 0.015, -0.085]);
    trolleyBearing.rotation.x = HALF_PI;
    record.trolley = trolley;

    const pose = slotPose(index);
    root.position.copy(pose.position);
    root.rotation.y = pose.yaw;
    record.target.copy(pose.position);
    record.targetYaw = pose.yaw;

    kit.register(hit, {
      id: `curated-frame-${index}`,
      label: `第 ${index + 1} 展位画框`,
      anchor: [0, 0, 0],
      hint: "直接拖动画框，松手后吸附到最近展位并同步策展顺序",
      onDown() {
        if (!record.item) {
          kit.status?.(`展位 ${index + 1} 为空，请添加真实藏品`);
          return;
        }
        finishLayoutTransition();
        dragging = record.item.id;
        draggingSlot = index;
        record.dragStart.copy(root.position);
        record.dragFrameQuaternion.copy(record.frame.quaternion);
        record.dragRootQuaternion.copy(root.quaternion);
        record.dragX = 0;
        record.dragY = 0;
        record.keyboardMoved = false;
        record.imageMaterial.opacity = 0.58;
        kit.status?.(`正在移动《${record.item.title}》`);
      },
      onDrag(context) {
        if (!record.item || draggingSlot !== index) return;
        const displacement = dragDeltaForFrame(context, record);
        root.position.copy(record.dragStart).add(displacement);
        root.position.copy(separateDraggedFrame(record, root.position));
        root.rotation.z = 0;
        updateCable(record);
        kit.invalidate?.();
      },
      onUp() {
        if (!record.item || draggingSlot !== index) return;
        if (record.keyboardMoved) {
          record.keyboardMoved = false;
          dragging = null;
          draggingSlot = -1;
          record.imageMaterial.opacity = 1;
          return;
        }
        const item = record.item;
        const targetIndex = nearestSlotIndex(root);
        dragging = null;
        draggingSlot = -1;
        root.rotation.z = 0;
        record.imageMaterial.opacity = 1;
        kit.moveCurated?.(item.id, targetIndex);
        const synced = kit.getCuratedItems?.();
        if (Array.isArray(synced)) refresh(synced);
        // Ordering swaps the content of fixed exhibition slots. Finish the
        // promised snap immediately, instead of sweeping this frame through
        // its neighbours on a damped return to the original slot.
        root.position.copy(record.target);
        root.rotation.y = record.targetYaw;
        updateCable(record);
        kit.status?.(`《${item.title}》已吸附到展位 ${targetIndex + 1}`);
        kit.invalidate?.();
      },
      onClick() {
        if (!record.item) {
          kit.requestCuration?.();
          return;
        }
        kit.status?.("拖动画框可改变位置；点击下方小铭牌可打开作品");
      },
      onKey(key) {
        if (!record.item) return;
        const direction = controlKey(key);
        const currentIndex = actualItems.findIndex((item) => item.id === record.item?.id);
        if (currentIndex < 0) return;
        if (direction === "left") kit.moveCurated?.(record.item.id, Math.max(0, currentIndex - 1));
        if (direction === "right") kit.moveCurated?.(record.item.id, Math.min(actualItems.length - 1, currentIndex + 1));
        const synced = kit.getCuratedItems?.();
        if (Array.isArray(synced)) refresh(synced);
        record.keyboardMoved = direction === "left" || direction === "right";
      },
    });

    kit.register(plaqueHit, {
      id: `item-plaque-${index}`,
      label: `展位 ${index + 1} 作品铭牌`,
      anchor: [0, 0, 0],
      hint: "点击真实作品铭牌，在界面读取作品",
      onClick() {
        if (record.item) kit.onItemSelect?.(record.item);
        else kit.requestCuration?.();
      },
      onKey(key) {
        if (controlKey(key) !== "activate") return;
        if (record.item) kit.onItemSelect?.(record.item);
        else kit.requestCuration?.();
      },
    });
  }

  for (let index = 0; index < slotRecords.length; index += 1) makeSlot(index);

  const weightGeometry = ownGeometry(new THREE.BoxGeometry(0.18, 0.48, 0.18));
  const weights = sculpt.instances(
    weightGeometry,
    materials.jade,
    slotRecords.map((record, index) => ({
      position: [-2.8 + index * 0.94, 2.2, -3.72],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    })),
    artRig,
  );
  weights.scale.set(0.76, 0.7, 0.76);
  weights.visible = false;

  const layoutDialGroup = new THREE.Group();
  layoutDialGroup.position.set(3.05, 1.18, 4.04);
  group.add(layoutDialGroup);
  sculpt.lathe(
    [
      [0, 0],
      [0.76, 0],
      [0.76, 0.08],
      [0.62, 0.15],
      [0.4, 0.22],
      [0, 0.24],
    ],
    materials.ink,
    layoutDialGroup,
    [0, -0.72, 0],
    56,
  );
  const dialHaloMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: "#d6b36f",
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  const dialHalo = sculpt.ring(0.73, 0.035, dialHaloMaterial, layoutDialGroup, [0, 0, 0.05]);
  dialHalo.renderOrder = 2;
  const layoutDial = sculpt.gear(0.58, 0.12, 14, materials.brass, layoutDialGroup, [0, 0, 0]);
  const dialSpokes = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = index / 6 * TAU;
    dialSpokes.push({
      position: [Math.cos(angle) * 0.34, Math.sin(angle) * 0.34, 0.1],
      rotation: [0, 0, angle],
      scale: [0.32, 0.035, 0.04],
    });
  }
  sculpt.instances(beamGeometry, materials.copper, dialSpokes, layoutDialGroup);
  const dialHitMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  }));
  const dialHit = new THREE.Mesh(ownGeometry(new THREE.SphereGeometry(0.72, 16, 12)), dialHitMaterial);
  dialHit.position.z = 0.22;
  layoutDialGroup.add(dialHit);
  let layoutReadout = makeText(
    1.22,
    0.19,
    "布局 · 环形",
    [0, -0.86, 0.22],
    layoutDialGroup,
    { color: "#eee4cf", fontSize: 54, background: "#263a35" },
  );

  kit.register(dialHit, {
    id: "layout-dial",
    label: "布局编排轮",
      anchor: [0, 0, 0],
    hint: "前景大轮：点击或按左右键，在环形、螺旋、线性叠层之间切换",
    onClick() {
      cycleLayout(1);
    },
    onKey(key) {
      const direction = controlKey(key);
      if (direction === "right" || direction === "down") cycleLayout(1);
      if (direction === "left" || direction === "up") cycleLayout(-1);
    },
  });

  const requestStand = new THREE.Group();
  requestStand.position.set(0, 0.3, 4.28);
  requestStand.scale.setScalar(1.08);
  group.add(requestStand);
  sculpt.lathe(
    [
      [0, 0],
      [0.42, 0],
      [0.4, 0.1],
      [0.25, 0.2],
      [0.16, 0.82],
      [0, 0.86],
    ],
    materials.walnut,
    requestStand,
    [0, 0, 0],
    44,
  );
  const requestPlate = sculpt.rounded(2.55, 0.72, 0.1, materials.walnut, requestStand, [0, 1.04, 0.08], 0.075);
  requestPlate.rotation.x = -0.1;
  const requestHaloMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: "#d7b169",
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  const requestHalo = sculpt.ring(0.62, 0.03, requestHaloMaterial, requestStand, [0, 1.06, 0], TAU * 0.86);
  requestHalo.rotation.x = -0.1;
  const requestLabel = makeText(
    2.26,
    0.46,
    "＋ 选择真实藏品",
    [0, 1.05, 0.15],
    requestStand,
    { color: "#eee4d2", fontSize: 64, background: "#263730", rotation: [-0.1, 0, 0] },
  );
  requestLabel.renderOrder = 3;
  kit.register(requestPlate, {
    id: "curation-invitation",
    label: "前景·添加真实藏品",
    anchor: [0, 0, 0],
    hint: "请求主界面打开真实藏品选择器",
    onClick() {
      kit.requestCuration?.();
      kit.status?.("请选择真实藏品加入七席舞台");
    },
    onKey(key) {
      if (controlKey(key) !== "activate") return;
      kit.requestCuration?.();
    },
  });

  let stageStatusLabel = makeText(
    2.85,
    0.22,
    "记忆编排剧院 · 环形舞台",
    [0, 0.54, 2.02],
    group,
    { color: "#284039", fontSize: 58, background: "#e7deca" },
  );

  function projectWorld(position) {
    if (typeof kit.projectPoint !== "function") return null;
    const projected = kit.projectPoint(position);
    if (!projected || !Number.isFinite(Number(projected.x)) || !Number.isFinite(Number(projected.y))) {
      return null;
    }
    return { x: Number(projected.x), y: Number(projected.y) };
  }

  function nearestSlotIndex(root) {
    const limit = Math.max(1, Math.min(actualItems.length, slotRecords.length));
    let nearest = 0;
    let nearestDistance = Infinity;
    root.updateWorldMatrix(true, false);
    const currentScreen = projectWorld(root.getWorldPosition(new THREE.Vector3()));
    for (let index = 0; index < limit; index += 1) {
      const target = slotRecords[index].target;
      const targetWorld = artRig.localToWorld(target.clone());
      const targetScreen = currentScreen ? projectWorld(targetWorld) : null;
      const distance = targetScreen && currentScreen
        ? (targetScreen.x - currentScreen.x) ** 2 + (targetScreen.y - currentScreen.y) ** 2
        : (target.x - root.position.x) ** 2 * 1.1 + (target.y - root.position.y) ** 2;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    }
    return nearest;
  }

  function interpolateYaw(from, to, amount) {
    let difference = normalizeAngle(to - from + Math.PI) - Math.PI;
    return from + difference * amount;
  }

  function finishLayoutTransition() {
    if (!layoutTransition) return;
    slotRecords.forEach((record) => {
      record.root.position.copy(record.target);
      record.root.rotation.y = record.targetYaw;
      record.root.scale.setScalar(1);
      updateCable(record);
    });
    layoutTransition = null;
    kit.invalidate?.();
  }

  // Full-size frames travel one at a time through the free space around the
  // stage. Plan against the other six oriented frames; never scale artwork to
  // manufacture clearance or push it sideways after a collision has occurred.
  function frameClear(point, yaw, obstacles) {
    const axes = [[Math.cos(yaw), -Math.sin(yaw)], [Math.sin(yaw), Math.cos(yaw)]];
    for (const obstacle of obstacles) {
      if (Math.abs(point.y - obstacle.position.y) >= 0.99 + obstacle.halfY) continue;
      const other = [[Math.cos(obstacle.yaw), -Math.sin(obstacle.yaw)], [Math.sin(obstacle.yaw), Math.cos(obstacle.yaw)]];
      const dx = point.x - obstacle.position.x, dz = point.z - obstacle.position.z;
      const separated = [...axes, ...other].some(([x, z]) => {
        const a = 0.70 * Math.abs(axes[0][0] * x + axes[0][1] * z) + 0.20 * Math.abs(axes[1][0] * x + axes[1][1] * z);
        const b = obstacle.halfX * Math.abs(other[0][0] * x + other[0][1] * z) + obstacle.halfZ * Math.abs(other[1][0] * x + other[1][1] * z);
        return Math.abs(dx * x + dz * z) >= a + b + 0.045;
      });
      if (!separated) return false;
    }
    return true;
  }

  function routeClear(from, to, yaw, obstacles) {
    const steps = Math.max(1, Math.ceil(from.distanceTo(to) / 0.1));
    const sample = new THREE.Vector3();
    for (let step = 1; step <= steps; step++) {
      sample.lerpVectors(from, to, step / steps);
      if (!frameClear(sample, yaw, obstacles)) return false;
    }
    return true;
  }

  function planFrameRoute(from, to, yaw, obstacles) {
    if (routeClear(from, to, yaw, obstacles)) return [from.clone(), to.clone()];
    const step = 0.46;
    const key = point => point.join(',');
    const position = point => new THREE.Vector3(point[0] * step, 1.18 + point[1] * step, point[2] * step);
    const startCell = [Math.round(from.x / step), Math.round((from.y - 1.18) / step), Math.round(from.z / step)];
    const origin = { cell: startCell, point: from.clone(), cost: 0, previous: null };
    const queue = [origin], visited = new Map([[key(startCell), 0]]);
    let goal = null;
    for (let iteration = 0; queue.length && iteration < 15000; iteration++) {
      queue.sort((a, b) => (a.cost + a.point.distanceTo(to)) - (b.cost + b.point.distanceTo(to)));
      const node = queue.shift();
      if (node.point.distanceTo(to) < step * 1.8 && routeClear(node.point, to, yaw, obstacles)) { goal = node; break; }
      for (const direction of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
        const cell = node.cell.map((value, index) => value + direction[index]);
        if (Math.abs(cell[0]) > 13 || Math.abs(cell[2]) > 13 || cell[1] < 0 || cell[1] > 13) continue;
        const point = position(cell), cost = node.cost + node.point.distanceTo(point), id = key(cell);
        if ((visited.get(id) ?? Infinity) <= cost || !routeClear(node.point, point, yaw, obstacles)) continue;
        visited.set(id, cost); queue.push({ cell, point, cost, previous: node });
      }
    }
    if (!goal) return null;
    const nodes = [to.clone()];
    for (let node = goal; node; node = node.previous) nodes.push(node.point.clone());
    nodes.reverse();
    const simplified = [nodes[0]];
    for (let index = 0; index < nodes.length - 1;) {
      let next = nodes.length - 1;
      while (next > index + 1 && !routeClear(nodes[index], nodes[next], yaw, obstacles)) next--;
      simplified.push(nodes[next]); index = next;
    }
    return simplified;
  }

  function beginLayoutTransition() {
    if (layoutTransition) finishLayoutTransition();
    updateLayoutTargets();
    if (kit.reducedMotion?.()) {
      slotRecords.forEach(record => { record.root.position.copy(record.target); record.root.rotation.y = record.targetYaw; updateCable(record); });
      return;
    }
    const poses = slotRecords.map(record => ({ position: record.root.position.clone(), yaw: record.root.rotation.y }));
    const staging = slotRecords.map((_, index) => {
      const angle = -Math.PI / 2 + index / 7 * TAU;
      return { position: new THREE.Vector3(Math.cos(angle) * 5.12, 3.5, Math.sin(angle) * 5.12), yaw: angle + Math.PI / 2 };
    });
    const staticObstacles = [-1, 1].flatMap(side => [
      { position: new THREE.Vector3(side * 3.94, 3.1, -0.62), yaw: 0, halfX: 0.22, halfY: 2.7, halfZ: 0.17 },
      { position: new THREE.Vector3(side * 3.94, 0.30, -0.62), yaw: 0, halfX: 0.45, halfY: 0.115, halfZ: 0.34 },
      { position: new THREE.Vector3(side * 3.94, 6.18, -0.62), yaw: 0, halfX: 0.43, halfY: 0.25, halfZ: 0.33 },
    ]);
    for (let n = 0; n <= 28; n++) {
      const angle = n / 28 * Math.PI;
      staticObstacles.push({ position: new THREE.Vector3(Math.cos(angle) * 3.95, 2.62 + Math.sin(angle) * 4.25, -0.62), yaw: 0, halfX: 0.24, halfY: 0.24, halfZ: 0.12 });
    }
    const moves = [];
    const extraction = [...slotRecords].sort((a, b) => poses[b.index].position.lengthSq() - poses[a.index].position.lengthSq());
    const insertion = [...slotRecords].sort((a, b) => b.target.lengthSq() - a.target.lengthSq());
    for (const [phase, records] of [[0, extraction], [1, insertion]]) {
      for (const record of records) {
        const index = record.index, from = poses[index];
        const target = phase === 0 ? staging[index] : { position: record.target.clone(), yaw: record.targetYaw };
        const obstacles = poses.filter((_, other) => other !== index).map(pose => ({ ...pose, halfX: 0.70, halfY: 0.93, halfZ: 0.20 })).concat(staticObstacles);
        // The exterior parking stations have ample room to turn before entry.
        const travelYaw = phase === 0 ? from.yaw : target.yaw;
        const route = planFrameRoute(from.position, target.position, travelYaw, obstacles);
        if (!route) {
          kit.status?.('换位空间不足，请先将升降机构复位。');
          slotRecords.forEach(slot => { slot.target.copy(slot.root.position); slot.targetYaw = slot.root.rotation.y; });
          return;
        }
        const lengths = route.slice(1).map((point, n) => point.distanceTo(route[n]));
        moves.push({ index, route, lengths, distance: lengths.reduce((sum, length) => sum + length, 0), fromYaw: from.yaw, travelYaw, toYaw: target.yaw, duration: 0.62 });
        poses[index] = { position: target.position.clone(), yaw: target.yaw };
      }
    }
    layoutTransition = { elapsed: 0, moves, duration: moves.reduce((sum, move) => sum + move.duration, 0) };
  }

  function updateLayoutTransition(delta) {
    if (!layoutTransition) return false;
    layoutTransition.elapsed += delta;
    let elapsed = layoutTransition.elapsed;
    for (const move of layoutTransition.moves) {
      const record = slotRecords[move.index];
      if (elapsed < 0) break;
      const progress = clamp(elapsed / move.duration, 0, 1);
      const travel = easeInOut(clamp((progress - 0.12) / 0.76, 0, 1));
      let distance = travel * move.distance, segment = 0;
      while (segment < move.lengths.length - 1 && distance > move.lengths[segment]) distance -= move.lengths[segment++];
      record.root.position.lerpVectors(move.route[segment], move.route[segment + 1], distance / Math.max(0.001, move.lengths[segment]));
      record.root.rotation.y = progress < 0.12 ? interpolateYaw(move.fromYaw, move.travelYaw, easeInOut(progress / 0.12)) :
        progress > 0.88 ? interpolateYaw(move.travelYaw, move.toYaw, easeInOut((progress - 0.88) / 0.12)) : move.travelYaw;
      record.root.scale.setScalar(1);
      record.frame.rotation.z = 0;
      elapsed -= move.duration;
    }
    slotRecords.forEach(updateCable);
    if (layoutTransition.elapsed >= layoutTransition.duration) { finishLayoutTransition(); return false; }
    return true;
  }

  function updateLayoutTargets() {
    slotRecords.forEach((record, index) => {
      const pose = slotPose(index);
      record.target.copy(pose.position);
      record.targetYaw = pose.yaw;
      if (kit.reducedMotion?.() && draggingSlot !== index) {
        record.root.position.copy(record.target);
        record.root.rotation.y = record.targetYaw;
      }
      updateCable(record);
    });
  }

  function updateActuatorVisuals() {
    actuators.forEach((actuator, row) => {
      const lift = rowLift[row];
      actuator.piston.scale.y = 1 + Math.max(0, lift) * 0.6;
      actuator.piston.position.y = 1.16 + Math.max(0, lift) * 0.05;
      actuator.channel.position.y = 1.5 + row * 0.56 + lift * 0.22;
      actuator.telescope.scale.x = 0.76 + (lift + 0.25) * 0.72;
      actuator.carriage.position.x = clamp(lift * 0.72, -0.26, 0.26);
      actuator.counterweight.position.y = -0.24 - lift * 0.42;
      actuator.pushHandle.position.y = 1.14 + lift * 0.82;
      actuator.pushHandle.rotation.z = -lift * 1.6;
      actuator.levelMarker.position.y =
        0.72 + ((lift - LIFT_MIN) / (LIFT_MAX - LIFT_MIN)) * 0.56;
      actuator.levelMaterial.opacity = 0.72 + Math.abs(lift) * 0.7;
      actuator.gear.rotation.z = -lift * 0.8;
      actuator.glowMaterial.opacity = 0.14 + Math.abs(lift) * 0.12;
    });
  }

  function applyItems(items) {
    actualItems = items.filter(Boolean).slice(0, 7);
    slotRecords.forEach((record, index) => {
      const item = actualItems[index] || null;
      record.item = item;
      const hasImage = Boolean(item?.image);
      if (record.image) record.image.visible = hasImage;
      if (record.backImage) record.backImage.visible = hasImage;
      if (hasImage && record.imageMaterial && typeof kit.texture === "function") {
        if (record.imageUrl !== item.image) {
          const texture = kit.texture(item.image);
          if (texture) {
            record.imageMaterial.map = texture;
            record.imageMaterial.color.set("#ffffff");
            record.imageMaterial.needsUpdate = true;
            record.imageUrl = item.image;
          }
        }
      } else if (record.imageMaterial) {
        record.imageMaterial.map = null;
        record.imageMaterial.color.set("#d9d0be");
        record.imageMaterial.needsUpdate = true;
        record.imageUrl = "";
      }

      record.fallbackText = replaceText(
        record.fallbackText,
        0.9,
        0.34,
        item ? shortText(item.title || item.english || "未命名作品", 26) : `空展位 ${String(index + 1).padStart(2, "0")}`,
        [0, 0, 0.19],
        record.frame,
        {
          color: item ? "#e1d5bd" : "#cbbda7",
          fontSize: item ? 62 : 52,
          background: item ? null : "#33443d",
        },
      );
      record.fallbackText.visible = !hasImage;
      if (record.emptyMark) record.emptyMark.visible = !item;
      record.plaqueLabel = replaceText(
        record.plaqueLabel,
        0.72,
        0.08,
        item ? shortText(item.title || item.english || "", 24) : `EMPTY ${String(index + 1).padStart(2, "0")}`,
        [0, -0.8, 0.265],
        record.root,
        { color: item ? "#f0e6d3" : "#b9ac96", fontSize: 46 },
      );
      record.plaqueBackLabel = replaceText(
        record.plaqueBackLabel,
        0.72,
        0.08,
        item ? shortText(item.title || item.english || "", 24) : `EMPTY ${String(index + 1).padStart(2, "0")}`,
        [0, -0.8, -0.265],
        record.root,
        {
          color: item ? "#f0e6d3" : "#b9ac96",
          fontSize: 46,
          rotation: [0, Math.PI, 0],
        },
      );
      record.plaque.material = materials.ink;
      record.plaqueBack.material = materials.ink;
    });
    updateLayoutTargets();
    updateStageStatus(false);
    kit.invalidate?.();
  }

  function refresh(items) {
    refreshRevision += 1;
    const revision = refreshRevision;
    const source = Array.isArray(items)
      ? items
      : kit.getCuratedItems?.();
    if (!Array.isArray(source)) return;
    if (revision !== refreshRevision) return;
    applyItems(source.slice());
  }

  function updateStageStatus(announce = false) {
    const layoutLabel = layoutName() === "ring" ? "环形" : layoutName() === "spiral" ? "螺旋" : "线性";
    const message = actualItems.length
      ? `记忆编排剧院 · ${layoutLabel === "环形" ? "环形舞台" : layoutLabel === "螺旋" ? "螺旋高台" : "线性叠层"} · ${actualItems.length}/7 件`
      : "空展览 · 点击前景选择真实藏品";
    if (message === statusText) return;
    statusText = message;
    stageStatusLabel = replaceText(
      stageStatusLabel,
      2.85,
      0.22,
      message,
      [0, 0.54, 2.02],
      group,
      { color: "#284039", fontSize: 58, background: "#e7deca" },
    );
    layoutReadout = replaceText(
      layoutReadout,
      1.22,
      0.19,
      `布局 · ${layoutLabel}`,
      [0, -0.86, 0.22],
      layoutDialGroup,
      { color: "#eee4cf", fontSize: 54, background: "#263a35" },
    );
    if (announce) kit.status?.(message);
    kit.invalidate?.();
  }

  function cycleLayout(direction = 1) {
    layoutIndex = (layoutIndex + (direction >= 0 ? 1 : -1) + LAYOUTS.length) % LAYOUTS.length;
    layoutTargetAngle += direction >= 0 ? TAU / 7 : -TAU / 7;
    beginLayoutTransition();
    updateStageStatus(true);
    kit.invalidate?.();
    return layoutName();
  }

  actuators.forEach((actuator) => {
    let dragStart = rowLift[actuator.row];
    let dragAccumulator = dragStart;
    kit.register(actuator.hit, {
      id: `lift-actuator-${actuator.row}`,
      label: `${rowNames[actuator.row]}升降机`,
      anchor: [0, 0, 0],
      hint: "上下拖动改变该层画框高度；点击按 0.25 档升降",
      onDown() {
        finishLayoutTransition();
        dragging = `lift-${actuator.row}`;
        dragStart = rowLift[actuator.row];
        dragAccumulator = dragStart;
        actuator.glowMaterial.opacity = 0.42;
        kit.status?.(`${rowNames[actuator.row]}升降机已接合`);
      },
      onDrag(context) {
        dragAccumulator = clamp(dragAccumulator - (Number(context.dy) || 0) * 0.008, LIFT_MIN, LIFT_MAX);
        rowLift[actuator.row] = dragAccumulator;
        updateActuatorVisuals();
        updateLayoutTargets();
        if (kit.reducedMotion?.()) {
          slotRecords.forEach((record) => {
            if (record.row === actuator.row && draggingSlot !== record.index) {
              record.root.position.copy(record.target);
              updateCable(record);
            }
          });
        }
        kit.invalidate?.();
      },
      onUp() {
        rowLift[actuator.row] = Math.round(dragAccumulator * 20) / 20;
        dragging = null;
        updateActuatorVisuals();
        updateLayoutTargets();
        kit.status?.(`${rowNames[actuator.row]}高度 ${rowLift[actuator.row].toFixed(2)}`);
      },
      onClick() {
        rowLift[actuator.row] = clamp(rowLift[actuator.row] + 0.25, LIFT_MIN, LIFT_MAX);
        updateActuatorVisuals();
        updateLayoutTargets();
        kit.status?.(`${rowNames[actuator.row]}高度 ${rowLift[actuator.row].toFixed(2)}`);
      },
      onKey(key) {
        const direction = controlKey(key);
        if (direction === "up" || direction === "right") rowLift[actuator.row] += 0.12;
        else if (direction === "down" || direction === "left") rowLift[actuator.row] -= 0.12;
        else return;
        rowLift[actuator.row] = clamp(rowLift[actuator.row], LIFT_MIN, LIFT_MAX);
        updateActuatorVisuals();
        updateLayoutTargets();
      },
    });
  });

  updateActuatorVisuals();
  updateLayoutTargets();
  refresh(kit.getCuratedItems?.() || []);

  function updateWeightInstances() {
    const dummy = new THREE.Object3D();
    slotRecords.forEach((record, index) => {
      const row = record.row;
      dummy.position.set(
        -2.82 + index * 1.02,
        2.18 - rowLift[row] * 0.45,
        -3.72,
      );
      dummy.rotation.set(0, record.targetYaw * 0.15, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      weights.setMatrixAt(index, dummy.matrix);
    });
    weights.instanceMatrix.needsUpdate = true;
  }

  function update(time, delta, isActive) {
    if (!isActive || !active) return;
    const dt = clamp(Number(delta) || 0, 0, 0.08);
    lastTime = Number(time) || lastTime;
    const transitioning = updateLayoutTransition(dt);
    slotRecords.forEach((record) => {
      if (!transitioning && draggingSlot !== record.index) {
        record.root.position.x = damp(record.root.position.x, record.target.x, 6.8, dt);
        record.root.position.y = damp(record.root.position.y, record.target.y, 6.8, dt);
        record.root.position.z = damp(record.root.position.z, record.target.z, 6.8, dt);
        record.root.rotation.y = dampAngle(record.root.rotation.y, record.targetYaw, 5.8, dt);
      }
      if (!transitioning && draggingSlot !== record.index) {
        record.frame.rotation.z = Math.sin(lastTime * 0.42 + record.index * 0.73) * 0.008;
      }
      updateCable(record);
    });
    layoutAngle = dampAngle(layoutAngle, layoutTargetAngle, 5, dt);
    layoutDial.rotation.z = layoutAngle;
    layoutDialGroup.rotation.x = Math.sin(lastTime * 0.68) * 0.025;
    dialHalo.rotation.z = -layoutAngle * 0.16;
    dialHaloMaterial.opacity = 0.17 + Math.sin(lastTime * 0.8) * 0.035;
    requestHaloMaterial.opacity = 0.15 + Math.sin(lastTime * 0.64 + 1.2) * 0.03;
    trackGlowMaterial.opacity = 0.09 + Math.sin(lastTime * 0.64) * 0.025;
    lightBeamMaterial.opacity = 0.028 + Math.sin(lastTime * 0.5) * 0.008;
    foldingLamps.forEach((lamp, index) => {
      const folded = layoutIndex === 2 ? 0.34 : layoutIndex === 1 ? 0.16 : 0;
      lamp.armA.rotation.z = lamp.side * (0.08 + folded) + Math.sin(layoutAngle + index * 1.6) * 0.035;
      lamp.armB.rotation.z = -lamp.side * (0.22 + folded * 1.8) + Math.sin(layoutAngle * 1.2 + index) * 0.028;
    });
    actuators.forEach((actuator, index) => {
      actuator.gear.rotation.z += dt * (0.08 + index * 0.012);
    });
    updateWeightInstances();
  }

  function interact(action, value) {
    const normalized = String(action || "").toLowerCase();
    if (normalized === "refresh") {
      refresh(value);
      return getState();
    }
    if (normalized === "layout") {
      if (typeof value === "string") {
        const requested = LAYOUTS.indexOf(value.toLowerCase());
        if (requested >= 0) {
          layoutIndex = requested;
          layoutTargetAngle = requested * TAU / 7;
          beginLayoutTransition();
          updateStageStatus(true);
          return layoutName();
        }
      }
      if (Number.isFinite(Number(value))) {
        const requested = wrapIndex(value, LAYOUTS.length);
        layoutIndex = requested;
        layoutTargetAngle = requested * TAU / 7;
        beginLayoutTransition();
        updateStageStatus(true);
        return layoutName();
      }
      return cycleLayout(1);
    }
    if (normalized === "lift" && Number.isFinite(Number(value))) {
      const row = clamp(Math.round(Number(value)), 0, 2);
      rowLift[row] = clamp(rowLift[row] + 0.25, LIFT_MIN, LIFT_MAX);
      updateActuatorVisuals();
      updateLayoutTargets();
      return rowLift[row];
    }
    if (normalized === "request") {
      kit.requestCuration?.();
      return true;
    }
    if (normalized === "reset") {
      layoutIndex = 0;
      layoutTargetAngle = 0;
      rowLift.fill(0);
      updateActuatorVisuals();
      beginLayoutTransition();
      updateStageStatus(true);
      return true;
    }
    return false;
  }

  function getState() {
    return {
      layout: layoutName(),
      order: actualItems.map((item) => item.id),
      heights: slotRecords.map((record) => Math.round(record.root.position.y * 100) / 100),
      dragging,
      rowLifts: rowLift.slice(),
      filled: actualItems.length,
      selectedIds: actualItems.map((item) => item.id),
      transitioning: Boolean(layoutTransition),
      active,
    };
  }

  function setActive(value) {
    active = Boolean(value);
    if (!active) {
      dragging = null;
      draggingSlot = -1;
      slotRecords.forEach((record) => {
        if (record.imageMaterial) record.imageMaterial.opacity = 1;
      });
    }
  }

  function dispose() {
    textMeshes.forEach(disposeTextMesh);
    textMeshes.clear();
    ownedMaterials.forEach((material) => material.dispose());
    ownedMaterials.clear();
    ownedGeometries.forEach((geometry) => geometry.dispose());
    ownedGeometries.clear();
    group.clear();
  }

  return {
    group,
    focus: new THREE.Vector3(0, 3.2, 0),
    update,
    interact,
    getState,
    setActive,
    dispose,
  };
}
