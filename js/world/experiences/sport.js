const TAU = Math.PI * 2;
const TARGET_STEPS = 64;
const REAR_STAND_START = Math.PI * 0.34;
const REAR_STAND_END = Math.PI * 1.66;
const REAR_STAND_ARC = REAR_STAND_END - REAR_STAND_START;
const REAR_DOME_START = Math.PI * 0.3;
const REAR_DOME_END = Math.PI * 1.7;
const REAR_DOME_ARC = REAR_DOME_END - REAR_DOME_START;
const TARGET_FRONT_SHIFT = 1;
const BALL_ENVELOPE = {
  minX: -2.75,
  maxX: 2.75,
  minY: 2.32,
  maxY: 7.35,
  minZ: -2.45,
  maxZ: 3.05,
};
const COURT_SEAM_PATTERN = [
  { dx: 0.025, dz: -0.035, lift: 0.014, shrink: 0.09 },
  { dx: -0.04, dz: 0.028, lift: -0.012, shrink: 0.1 },
  { dx: 0.018, dz: 0.045, lift: 0.022, shrink: 0.08 },
  { dx: -0.026, dz: -0.046, lift: -0.006, shrink: 0.11 },
  { dx: 0.042, dz: 0.018, lift: 0.017, shrink: 0.09 },
  { dx: -0.016, dz: -0.03, lift: -0.016, shrink: 0.1 },
  { dx: 0.034, dz: 0.034, lift: 0.009, shrink: 0.085 },
];

const SPORT_PROFILES = [
  {
    key: "basketball",
    label: "篮球",
    targetLabel: "篮筐",
    color: 0x304b40,
    accent: 0xc8aa76,
    standX: 4.0,
    standZ: 2.72,
  },
  {
    key: "football",
    label: "足球",
    targetLabel: "球门",
    color: 0x51413a,
    accent: 0xc5b18c,
    standX: 4.2,
    standZ: 3.04,
  },
  {
    key: "formula-1",
    label: "一级方程式",
    targetLabel: "计时门",
    color: 0x33404a,
    accent: 0xc49a62,
    standX: 4.34,
    standZ: 2.48,
  },
  {
    key: "american-football",
    label: "美式橄榄球",
    targetLabel: "球门柱",
    color: 0x484233,
    accent: 0xc1af8a,
    standX: 4.22,
    standZ: 2.84,
  },
  {
    key: "esports",
    label: "电子竞技",
    targetLabel: "六边环",
    color: 0x433a4a,
    accent: 0xb3c6bd,
    standX: 4.28,
    standZ: 2.64,
  },
];

const COURT_LAYOUTS = [
  [
    { x: -1.82, z: -0.82, w: 1.38, d: 1.42, rot: 0 },
    { x: -1.82, z: 0.72, w: 1.38, d: 1.28, rot: 0 },
    { x: -0.36, z: 0, w: 1.18, d: 2.62, rot: 0 },
    { x: 1.08, z: 0, w: 1.52, d: 2.62, rot: 0 },
    { x: 2.34, z: -0.72, w: 0.72, d: 1.1, rot: 0.08 },
    { x: 2.34, z: 0.72, w: 0.72, d: 1.1, rot: -0.08 },
    { x: 0, z: 1.72, w: 2.72, d: 0.38, rot: 0 },
  ],
  [
    { x: -1.86, z: 0, w: 1.44, d: 3.25, rot: 0 },
    { x: -0.34, z: -0.62, w: 1.12, d: 1.9, rot: 0 },
    { x: -0.34, z: 0.72, w: 1.12, d: 1.7, rot: 0 },
    { x: 0.84, z: 0, w: 1.12, d: 3.25, rot: 0 },
    { x: 1.98, z: -0.72, w: 0.94, d: 1.38, rot: -0.1 },
    { x: 1.98, z: 0.72, w: 0.94, d: 1.38, rot: 0.1 },
    { x: 0, z: 2.1, w: 4.55, d: 0.3, rot: 0 },
  ],
  [
    { x: -2.34, z: 0.35, w: 0.82, d: 3.5, rot: 0.33 },
    { x: -1.42, z: -1.12, w: 1.28, d: 0.82, rot: -0.26 },
    { x: -0.18, z: -1.62, w: 1.45, d: 0.64, rot: 0 },
    { x: 1.16, z: -1.12, w: 1.18, d: 0.8, rot: 0.32 },
    { x: 2.18, z: 0.18, w: 0.72, d: 2.8, rot: -0.34 },
    { x: 0.86, z: 1.18, w: 1.78, d: 0.62, rot: 0.18 },
    { x: -0.82, z: 0.08, w: 1.92, d: 1.13, rot: -0.05 },
  ],
  [
    { x: -1.72, z: 0, w: 1.22, d: 3.0, rot: 0 },
    { x: -0.54, z: -0.28, w: 0.46, d: 2.56, rot: 0 },
    { x: 0.06, z: 0.26, w: 0.58, d: 3.1, rot: 0 },
    { x: 0.72, z: -0.3, w: 0.52, d: 2.52, rot: 0 },
    { x: 1.62, z: 0, w: 1.18, d: 3.0, rot: 0 },
    { x: 2.48, z: -0.62, w: 0.46, d: 1.05, rot: 0.15 },
    { x: 2.48, z: 0.62, w: 0.46, d: 1.05, rot: -0.15 },
  ],
  [
    { x: 0, z: -1.92, w: 2.2, d: 0.58, rot: 0 },
    { x: -1.72, z: -0.72, w: 2.15, d: 0.62, rot: 0.34 },
    { x: 1.72, z: -0.72, w: 2.15, d: 0.62, rot: -0.34 },
    { x: -1.98, z: 0.48, w: 1.2, d: 0.68, rot: -0.74 },
    { x: 1.98, z: 0.48, w: 1.2, d: 0.68, rot: 0.74 },
    { x: -0.78, z: 1.56, w: 1.5, d: 0.58, rot: -0.2 },
    { x: 0.78, z: 1.56, w: 1.5, d: 0.58, rot: 0.2 },
  ],
];

export function buildExperience(kit) {
  const THREE = kit?.THREE;
  if (!THREE || !kit.sculpt || typeof kit.mesh !== "function") {
    throw new TypeError("sport experience requires the shared Three.js experience kit");
  }

  const sculpt = kit.sculpt;
  const collection = kit.collection || { id: "sport", items: [] };
  const items = Array.isArray(collection.items) ? collection.items.filter(Boolean) : [];
  const group = new THREE.Group();
  group.name = "zero-gravity-arena-dome";

  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const ownedTextures = new Set();
  const ownedInstanced = new Set();
  const materialCache = new Map();

  const ownGeometry = (value) => {
    if (value?.isBufferGeometry) ownedGeometries.add(value);
    return value;
  };
  const ownMaterial = (value) => {
    if (value?.isMaterial) ownedMaterials.add(value);
    return value;
  };
  const ownTexture = (value) => {
    if (value?.isTexture) ownedTextures.add(value);
    return value;
  };
  const ownObjectResources = (object, ownSharedResources = false) => {
    if (!object) return object;
    ownGeometry(object.geometry);
    const materials = object.material == null ? [] : [object.material].flat();
    for (const material of materials) {
      if (ownSharedResources) ownMaterial(material);
      if (ownSharedResources) {
        for (const value of Object.values(material || {})) {
          if (value?.isTexture) ownTexture(value);
        }
      }
    }
    if (object.isInstancedMesh) ownedInstanced.add(object);
    return object;
  };

  const resolveMaterial = (value, fallback, roughness = 0.66, metalness = 0.02) => {
    if (value?.isMaterial) return value;
    if (typeof kit.material === "function") return kit.material(value || fallback, roughness, metalness);
    const key = `${String(value || fallback)}:${roughness}:${metalness}`;
    if (!materialCache.has(key)) {
      materialCache.set(
        key,
        ownMaterial(new THREE.MeshStandardMaterial({
          color: value || fallback,
          roughness,
          metalness,
        })),
      );
    }
    return materialCache.get(key);
  };

  const localMaterial = (options) => ownMaterial(new THREE.MeshStandardMaterial(options));
  const stone = resolveMaterial(kit.stone, 0xaaa397, 0.92, 0.01);
  const porcelain = resolveMaterial(kit.cream, 0xeee8dc, 0.78, 0.02);
  const walnut = resolveMaterial(kit.walnut, 0x49372e, 0.72, 0.03);
  const steel = resolveMaterial(0x4a5a57, 0x4a5a57, 0.34, 0.78);
  const dark = resolveMaterial(kit.dark, 0x1b2624, 0.36, 0.42);
  const brass = resolveMaterial(kit.brass, 0xa57f47, 0.28, 0.72);
  const blackLacquer = localMaterial({ color: 0x0d1514, roughness: 0.22, metalness: 0.28 });
  const darkCopper = localMaterial({ color: 0x5b4032, roughness: 0.46, metalness: 0.56 });
  const rubber = localMaterial({ color: 0x17201f, roughness: 0.62, metalness: 0.04 });
  const courtMaterial = localMaterial({
    color: 0x304b40,
    roughness: 0.74,
    metalness: 0.04,
    emissive: 0x14241e,
    emissiveIntensity: 0.12,
  });
  const teamMaterial = localMaterial({
    color: SPORT_PROFILES[0].color,
    roughness: 0.68,
    metalness: 0.08,
    emissive: SPORT_PROFILES[0].color,
    emissiveIntensity: 0.08,
  });
  const standMaterial = localMaterial({
    color: 0x4b554f,
    roughness: 0.86,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
  const glowMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: 0xc9a26c,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  const amberGlow = ownMaterial(new THREE.MeshBasicMaterial({
    color: 0xd6aa68,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  const netMaterial = ownMaterial(new THREE.LineBasicMaterial({
    color: 0x9da49a,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  }));
  const proxyMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
    side: THREE.DoubleSide,
  }));

  const unitBox = ownGeometry(new THREE.BoxGeometry(1, 1, 1));
  const unitCylinder = ownGeometry(new THREE.CylinderGeometry(1, 1, 1, 20));
  const rivetGeometry = ownGeometry(new THREE.SphereGeometry(0.03, 8, 6));

  const addMesh = (geometry, material, x, y, z, parent = group) => {
    const node = kit.mesh(geometry, material, x, y, z, parent);
    if (node) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
    return node;
  };
  const addBox = (material, width, height, depth, x, y, z, parent = group, rotation) => {
    const node = addMesh(unitBox, material, x, y, z, parent);
    if (!node) return null;
    node.scale.set(width, height, depth);
    if (rotation) node.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
    return node;
  };
  const addCylinder = (radius, height, material, x, y, z, parent = group, rotation) => {
    const node = addMesh(unitCylinder, material, x, y, z, parent);
    if (!node) return null;
    node.scale.set(radius, height, radius);
    if (rotation) node.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
    return node;
  };
  const addRounded = (width, height, depth, material, parent, position, radius = 0.04) => {
    const node = sculpt.rounded(width, height, depth, material, parent, position, radius);
    ownObjectResources(node);
    if (node) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
    return node;
  };
  const addTube = (points, radius, material, parent, segments = 64, sides = 8) => {
    const node = sculpt.tube(points, radius, material, parent, segments, sides);
    ownObjectResources(node);
    if (node) node.castShadow = true;
    return node;
  };
  const addRing = (radius, thickness, material, parent, position, arc = TAU) => {
    const node = sculpt.ring(radius, thickness, material, parent, position, arc);
    ownObjectResources(node);
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
      ownedInstanced.add(node);
      node.castShadow = true;
      node.receiveShadow = true;
    }
    return node;
  };
  const addText = (value, width, height, parent, position, options = {}) => {
    if (!value) return null;
    const node = sculpt.text(value, width, height, parent, {
      background: options.background ?? null,
      color: options.color || "#e7dcc1",
      fontSize: options.fontSize || 42,
      padding: options.padding ?? 0.05,
      align: options.align || "center",
      serif: options.serif ?? true,
    });
    ownObjectResources(node, true);
    if (!node) return null;
    node.position.set(position[0] || 0, position[1] || 0, position[2] || 0);
    if (options.rotation) node.rotation.set(...options.rotation);
    return node;
  };
  const disposeObjectResources = (object) => {
    if (!object) return;
    const materials = object.material == null ? [] : [object.material].flat();
    object.geometry?.dispose?.();
    ownedGeometries.delete(object.geometry);
    for (const material of materials) {
      for (const value of Object.values(material || {})) {
        if (value?.isTexture) {
          value.dispose?.();
          ownedTextures.delete(value);
        }
      }
      material?.dispose?.();
      ownedMaterials.delete(material);
    }
  };
  const replaceText = (current, value, width, height, parent, position, options = {}) => {
    current?.removeFromParent?.();
    disposeObjectResources(current);
    return addText(value, width, height, parent, position, options);
  };
  const addLine = (points, color, parent = group) => {
    if (typeof kit.line !== "function") return null;
    return kit.line(points, color, parent);
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const damp = (current, target, smoothing, delta) =>
    current + (target - current) * (1 - Math.exp(-smoothing * Math.max(0, delta)));
  const shortText = (value, length = 22) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length <= length ? text : `${text.slice(0, length - 1)}…`;
  };
  const status = (message) => {
    if (typeof kit.status === "function") kit.status(message);
  };
  const invalidate = () => {
    if (typeof kit.invalidate === "function") kit.invalidate();
  };
  const reducedMotion = () =>
    typeof kit.reducedMotion === "function" ? Boolean(kit.reducedMotion()) : false;
  const currentItem = () => items[state.selected] || null;
  const currentProfile = () => SPORT_PROFILES[state.selected] || SPORT_PROFILES[0];

  const state = {
    score: 0,
    shots: 0,
    selected: 0,
    playing: false,
    charge: 0,
    lastResult: "等待出手",
    aim: {
      lateral: 0,
      elevation: 0.56,
      power: 0.68,
    },
    gravity: {
      magnitude: 9.8,
      angle: 0,
    },
    ballPosition: new THREE.Vector3(0, 2.68, 2.92),
  };
  const ballStart = new THREE.Vector3(0, 2.68, 2.92);
  const gravityVector = new THREE.Vector3();
  let activeNow = true;
  let disposed = false;
  let lastTime = 0;
  let lastStatusAt = -Infinity;
  let dragX = 0;
  let dragY = 0;
  let draggingBall = false;
  let gravityStart = 9.8;
  let gravityAngleStart = 0;
  let targetPulse = 0;
  let chargePulse = 0;
  let flight = null;
  let currentDetector = null;
  let dossierTitle = null;
  let dossierImage = null;

  const foundation = new THREE.Group();
  foundation.name = "split-gravity-footings";
  group.add(foundation);
  const footingAnchors = [];
  const footingSpecs = [
    { x: -2.64, z: -1.18, y: 0.37, rotation: -0.25, width: 1.52 },
    { x: 0, z: -1.9, y: 0.25, rotation: 0.08, width: 1.42 },
    { x: 2.58, z: -1.12, y: 0.45, rotation: 0.28, width: 1.48 },
  ];
  footingSpecs.forEach((spec, index) => {
    const foot = new THREE.Group();
    foot.position.set(spec.x, spec.y, spec.z);
    foot.rotation.y = spec.rotation;
    foundation.add(foot);
    addRounded(spec.width, 0.42, 1.0 - index * 0.08, walnut, foot, [0, 0, 0], 0.11);
    addRounded(spec.width * 0.72, 0.14, 0.68, index === 1 ? brass : dark, foot, [0, 0.26, 0], 0.06);
    addCylinder(0.12, 0.54, steel, 0, 0.5, 0, foot);
    for (const side of [-1, 1]) {
      addBox(steel, 0.06, 0.48, 0.06, side * spec.width * 0.32, 0.46, -0.28, foot, [0, 0, side * 0.13]);
    }
    footingAnchors.push(new THREE.Vector3(spec.x, spec.y + 0.78, spec.z));
  });

  const beamPairs = [];
  const jointPositions = [];
  const addBeam = (start, end, thickness = 0.026) => {
    beamPairs.push({ start: start.clone(), end: end.clone(), thickness });
    jointPositions.push(start.clone(), end.clone());
  };
  const gravitySpine = new THREE.Group();
  gravitySpine.name = "gravity-spine";
  group.add(gravitySpine);
  addCylinder(0.16, 1.72, steel, 0, 1.12, 0, gravitySpine);
  addRing(0.52, 0.035, amberGlow, gravitySpine, [0, 1.08, 0.02]);
  addRing(0.72, 0.022, brass, gravitySpine, [0, 0.75, 0.02]);
  addBeam(footingAnchors[0], new THREE.Vector3(-0.34, 1.36, 0.12), 0.035);
  addBeam(footingAnchors[1], new THREE.Vector3(0, 1.62, 0), 0.04);
  addBeam(footingAnchors[2], new THREE.Vector3(0.34, 1.36, 0.12), 0.035);

  const courtRoot = new THREE.Group();
  courtRoot.name = "split-floating-court";
  courtRoot.position.set(0, 2.22, 0);
  group.add(courtRoot);
  const courtTileGeometry = ownGeometry(new THREE.BoxGeometry(1, 0.12, 1));
  const courtTiles = [];
  for (let index = 0; index < 7; index += 1) {
    const tile = addMesh(courtTileGeometry, courtMaterial, 0, 0, 0, courtRoot);
    tile.name = `court-tile-${index + 1}`;
    tile.castShadow = true;
    tile.receiveShadow = true;
    courtTiles.push(tile);
  }
  const courtUnderRibGeometry = new THREE.CylinderGeometry(1, 1, 1, 7);
  const underRibPlacements = [];
  for (let index = 0; index < 12; index += 1) {
    const angle = index / 12 * TAU;
    const radius = 1.5 + (index % 5) * 0.27;
    underRibPlacements.push({
      position: [Math.sin(angle) * radius, -0.19, Math.cos(angle) * radius * 0.67],
      rotation: [Math.PI / 2, angle, 0],
      scale: [0.022, 0.48 + (index % 4) * 0.08, 0.022],
    });
  }
  addInstances(courtUnderRibGeometry, steel, underRibPlacements, courtRoot);

  const courtLineGeometry = ownGeometry(new THREE.BufferGeometry());
  const courtLinePositions = new Float32Array(512 * 3);
  courtLineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(courtLinePositions, 3));
  courtLineGeometry.setDrawRange(0, 0);
  courtLineGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);
  const courtLineMaterial = ownMaterial(new THREE.LineBasicMaterial({
    color: 0xe8dfca,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  }));
  const courtLines = new THREE.LineSegments(courtLineGeometry, courtLineMaterial);
  courtLines.position.y = 0.071;
  courtRoot.add(courtLines);

  const rearArcPoints = (radiusX, radiusZ, y, start = REAR_STAND_START, end = REAR_STAND_END, count = 96) => {
    const points = [];
    for (let index = 0; index <= count; index += 1) {
      const angle = start + (end - start) * index / count;
      points.push(new THREE.Vector3(Math.sin(angle) * radiusX, y, Math.cos(angle) * radiusZ));
    }
    return points;
  };

  const standRoot = new THREE.Group();
  standRoot.name = "rear-horseshoe-stands";
  group.add(standRoot);
  const standSurfaces = [];
  for (let tier = 0; tier < 6; tier += 1) {
    const surface = sculpt.surface(
      (u, v) => {
        const angle = REAR_STAND_START + u * REAR_STAND_ARC;
        const radial = 0.83 + v * 0.17;
        return [
          Math.sin(angle) * radial,
          3.08 + tier * 0.39 + v * 0.17,
          Math.cos(angle) * radial * 0.68,
        ];
      },
      68,
      4,
      standMaterial,
      standRoot,
    );
    ownObjectResources(surface);
    if (surface) {
      surface.castShadow = true;
      surface.receiveShadow = true;
      standSurfaces.push(surface);
    }
  }
  const standRings = [];
  for (let tier = 0; tier <= 6; tier += 1) {
    const ring = addTube(
      rearArcPoints(1, 0.68, 3.02 + tier * 0.39),
      0.025,
      tier % 2 ? darkCopper : steel,
      standRoot,
      96,
      6,
    );
    standRings.push(ring);
  }

  const seatsPerTier = 48;
  const tierCount = 6;
  const seatCount = seatsPerTier * tierCount;
  const seatBodyGeometry = ownGeometry(new THREE.BoxGeometry(0.2, 0.065, 0.23));
  const seatBackGeometry = ownGeometry(new THREE.BoxGeometry(0.18, 0.23, 0.055));
  const seatBodyInstances = new THREE.InstancedMesh(seatBodyGeometry, teamMaterial, seatCount);
  const seatBackInstances = new THREE.InstancedMesh(seatBackGeometry, teamMaterial, seatCount);
  seatBodyInstances.castShadow = true;
  seatBackInstances.castShadow = true;
  standRoot.add(seatBodyInstances, seatBackInstances);
  ownedInstanced.add(seatBodyInstances);
  ownedInstanced.add(seatBackInstances);

  const trackRoot = new THREE.Group();
  trackRoot.name = "double-suspended-tracks";
  group.add(trackRoot);
  const trackLow = new THREE.Group();
  const trackHigh = new THREE.Group();
  trackRoot.add(trackLow, trackHigh);
  addTube(rearArcPoints(4.3, 3.0, 3.04), 0.045, brass, trackLow, 120, 7);
  addTube(rearArcPoints(4.06, 2.78, 5.52), 0.038, steel, trackHigh, 120, 7);
  addTube(rearArcPoints(2.72, 1.85, 3.04), 0.02, glowMaterial, trackLow, 96, 6);
  const trackPods = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = REAR_STAND_START + (index + 0.5) / 6 * REAR_STAND_ARC;
    const pod = addRounded(0.34, 0.1, 0.18, index % 2 ? darkCopper : brass, trackLow, [
      Math.sin(angle) * 4.3,
      3.09,
      Math.cos(angle) * 3.0,
    ], 0.05);
    pod.rotation.y = -angle;
    trackPods.push({ pod, phase: index / 6, speed: 0.008 + index * 0.001 });
  }
  for (let index = 0; index < 4; index += 1) {
    const angle = REAR_STAND_START + (index + 0.5) / 4 * REAR_STAND_ARC;
    const pod = addRounded(0.28, 0.08, 0.14, darkCopper, trackHigh, [
      Math.sin(angle) * 4.06,
      5.57,
      Math.cos(angle) * 2.78,
    ], 0.04);
    pod.rotation.y = -angle;
    trackPods.push({ pod, phase: index / 4, speed: -0.006 - index * 0.001, high: true });
  }

  const domeNet = new THREE.Group();
  domeNet.name = "spatial-tension-net";
  group.add(domeNet);
  const domePositions = [];
  const pushSegment = (target, a, b) => {
    target.push(a.x, a.y, a.z, b.x, b.y, b.z);
  };
  const domeRings = [
    { y: 5.02, rx: 4.15, rz: 2.92 },
    { y: 5.7, rx: 3.58, rz: 2.32 },
    { y: 6.32, rx: 2.42, rz: 1.42 },
  ];
  for (let ringIndex = 0; ringIndex < domeRings.length; ringIndex += 1) {
    const current = domeRings[ringIndex];
    for (let index = 0; index < 16; index += 1) {
      const a0 = REAR_DOME_START + index / 16 * REAR_DOME_ARC;
      const a1 = REAR_DOME_START + (index + 1) / 16 * REAR_DOME_ARC;
      pushSegment(
        domePositions,
        new THREE.Vector3(Math.sin(a0) * current.rx, current.y, Math.cos(a0) * current.rz),
        new THREE.Vector3(Math.sin(a1) * current.rx, current.y, Math.cos(a1) * current.rz),
      );
      if (ringIndex < domeRings.length - 1) {
        const next = domeRings[ringIndex + 1];
        pushSegment(
          domePositions,
          new THREE.Vector3(Math.sin(a0) * current.rx, current.y, Math.cos(a0) * current.rz),
          new THREE.Vector3(Math.sin(a0) * next.rx, next.y, Math.cos(a0) * next.rz),
        );
      }
    }
  }
  const domeNetGeometry = ownGeometry(new THREE.BufferGeometry());
  domeNetGeometry.setAttribute("position", new THREE.Float32BufferAttribute(domePositions, 3));
  domeNet.add(new THREE.LineSegments(domeNetGeometry, netMaterial));

  const lightHeadPlacements = [];
  const lightLensPlacements = [];
  for (let index = 0; index < 8; index += 1) {
    const angle = REAR_STAND_START + (index + 0.5) / 8 * REAR_STAND_ARC;
    const bottom = new THREE.Vector3(Math.sin(angle) * 4.55, 0.7, Math.cos(angle) * 3.2);
    const elbow = new THREE.Vector3(Math.sin(angle) * 4.55, 6.34, Math.cos(angle) * 3.2);
    const head = elbow.clone().add(new THREE.Vector3(-Math.sin(angle) * 0.62, 0.32, -Math.cos(angle) * 0.44));
    addBeam(bottom, elbow, 0.032);
    addBeam(elbow, head, 0.026);
    lightHeadPlacements.push({
      position: head.toArray(),
      rotation: [0, -angle, -0.12],
      scale: [1, 1, 1],
    });
    lightLensPlacements.push({
      position: [head.x, head.y - 0.09, head.z],
      rotation: [0, -angle, 0],
      scale: [1, 1, 1],
    });
  }
  addInstances(new THREE.BoxGeometry(0.56, 0.2, 0.3), steel, lightHeadPlacements, group);
  const lightLenses = addInstances(new THREE.BoxGeometry(0.38, 0.07, 0.08), amberGlow, lightLensPlacements, group);
  if (lightLenses) lightLenses.castShadow = false;

  for (let tier = 0; tier < 6; tier += 1) {
    for (let index = 0; index < 12; index += 1) {
      const angle = REAR_STAND_START + (index + 0.5) / 12 * REAR_STAND_ARC + tier * 0.018;
      const x = Math.sin(angle) * (4.05 + tier * 0.16);
      const z = Math.cos(angle) * (2.78 + tier * 0.11);
      addBeam(
        new THREE.Vector3(x, 2.95 + tier * 0.38, z),
        new THREE.Vector3(x * 0.9, 3.24 + tier * 0.38, z * 0.9),
        0.017,
      );
    }
  }
  for (const side of [-1, 1]) {
    addBeam(new THREE.Vector3(side * 3.18, 0.68, -0.86), new THREE.Vector3(side * 3.72, 2.08, -1.58), 0.028);
    addBeam(new THREE.Vector3(side * 3.18, 0.68, -0.86), new THREE.Vector3(side * 3.34, 2.08, -2.72), 0.026);
    addBeam(new THREE.Vector3(side * 3.72, 2.08, -1.58), new THREE.Vector3(side * 4.08, 2.92, -1.36), 0.026);
  }
  addBeam(new THREE.Vector3(0, 0.66, -1.9), new THREE.Vector3(0, 2.08, -3.02), 0.03);
  const beamGeometry = ownGeometry(new THREE.CylinderGeometry(1, 1, 1, 6));
  const beamInstances = new THREE.InstancedMesh(beamGeometry, steel, beamPairs.length);
  beamInstances.castShadow = true;
  group.add(beamInstances);
  ownedInstanced.add(beamInstances);
  const beamDummy = new THREE.Object3D();
  const beamDirection = new THREE.Vector3();
  const beamMidpoint = new THREE.Vector3();
  const beamUp = new THREE.Vector3(0, 1, 0);
  beamPairs.forEach((beam, index) => {
    beamDirection.copy(beam.end).sub(beam.start);
    const length = beamDirection.length();
    beamMidpoint.copy(beam.start).add(beam.end).multiplyScalar(0.5);
    beamDummy.position.copy(beamMidpoint);
    beamDummy.quaternion.setFromUnitVectors(beamUp, beamDirection.normalize());
    beamDummy.scale.set(beam.thickness, length, beam.thickness);
    beamDummy.updateMatrix();
    beamInstances.setMatrixAt(index, beamDummy.matrix);
  });
  beamInstances.instanceMatrix.needsUpdate = true;
  const jointPlacements = jointPositions.map((position) => ({
    position: position.toArray(),
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  }));
  addInstances(rivetGeometry, brass, jointPlacements, group);

  const targetGroups = [];
  const targetDetectors = [];

  const basketballTarget = new THREE.Group();
  basketballTarget.name = "basketball-hoop-target";
  group.add(basketballTarget);
  addRounded(1.45, 0.86, 0.09, porcelain, basketballTarget, [0, 4.56, -2.34], 0.05);
  addRounded(0.74, 0.42, 0.012, courtMaterial, basketballTarget, [0, 4.63, -2.285], 0.025);
  const hoopGeometry = ownGeometry(new THREE.TorusGeometry(0.5, 0.035, 9, 48));
  const hoop = addMesh(hoopGeometry, amberGlow, 0, 4.18, -2.03, basketballTarget);
  hoop.rotation.x = Math.PI / 2;
  for (let index = 0; index < 14; index += 1) {
    const angle = index / 14 * TAU;
    addLine(
      [
        new THREE.Vector3(Math.cos(angle) * 0.49, 4.18, -2.03 + Math.sin(angle) * 0.49),
        new THREE.Vector3(Math.cos(angle) * 0.32, 3.52, -1.92 + Math.sin(angle) * 0.32),
        new THREE.Vector3(Math.cos(angle) * 0.49, 3.18, -1.8 + Math.sin(angle) * 0.49),
      ],
      0xd9e5dc,
      basketballTarget,
    );
  }
  targetGroups.push(basketballTarget);
  targetDetectors.push({
    axis: "y",
    center: new THREE.Vector3(0, 4.18, -2.03),
    radiusX: 0.51,
    radiusZ: 0.51,
  });

  const footballTarget = new THREE.Group();
  footballTarget.name = "football-goal-target";
  group.add(footballTarget);
  addTube(
    [
      [-1.12, 2.33, -2.18],
      [-1.12, 4.72, -2.18],
      [1.12, 4.72, -2.18],
      [1.12, 2.33, -2.18],
    ],
    0.045,
    porcelain,
    footballTarget,
    72,
    8,
  );
  for (let index = 0; index <= 16; index += 1) {
    const x = -1.08 + index / 16 * 2.16;
    addLine(
      [
        new THREE.Vector3(x, 4.68, -2.18),
        new THREE.Vector3(x * 0.92, 2.48, -1.28),
      ],
      0xd9e5dc,
      footballTarget,
    );
  }
  for (let row = 0; row < 8; row += 1) {
    const y = 2.5 + row / 7 * 2.15;
    addLine(
      [
        new THREE.Vector3(-1.08, y, -2.18),
        new THREE.Vector3(1.08, y, -2.18),
      ],
      0xd9e5dc,
      footballTarget,
    );
  }
  targetGroups.push(footballTarget);
  targetDetectors.push({
    axis: "z",
    center: new THREE.Vector3(0, 3.55, -2.18),
    halfWidth: 1.05,
    halfHeight: 1.12,
  });

  const formulaTarget = new THREE.Group();
  formulaTarget.name = "formula-timing-gate";
  group.add(formulaTarget);
  const formulaGate = addRing(1.03, 0.055, glowMaterial, formulaTarget, [0, 3.72, -2.18]);
  formulaGate.scale.y = 1.18;
  const innerGate = addRing(0.84, 0.018, brass, formulaTarget, [0, 3.72, -2.15]);
  innerGate.scale.y = 1.18;
  for (let index = 0; index < 3; index += 1) {
    const bar = addRounded(2.8, 0.035, 0.035, glowMaterial, formulaTarget, [0, 2.48 + index * 0.045, -2.18], 0.015);
    bar.rotation.z = index * 0.04;
  }
  for (const x of [-1.18, 1.18]) {
    addTube(
      [
        [x, 2.28, -2.26],
        [x, 4.88, -2.26],
        [x * 0.82, 5.56, -2.1],
      ],
      0.032,
      steel,
      formulaTarget,
      36,
      7,
    );
  }
  targetGroups.push(formulaTarget);
  targetDetectors.push({
    axis: "z",
    center: new THREE.Vector3(0, 3.72, -2.18),
    halfWidth: 1.0,
    halfHeight: 1.12,
  });

  const footballUsTarget = new THREE.Group();
  footballUsTarget.name = "american-football-uprights";
  group.add(footballUsTarget);
  for (const x of [-1.0, 1.0]) {
    addCylinder(0.035, 3.0, porcelain, x, 3.86, -2.18, footballUsTarget);
  }
  addBox(porcelain, 2.0, 0.045, 0.045, 0, 3.42, -2.18, footballUsTarget);
  const uprightCross = addTube(
    [
      [-0.55, 5.36, -2.18],
      [-0.55, 4.32, -2.18],
      [0, 4.12, -2.18],
      [0.55, 4.32, -2.18],
      [0.55, 5.36, -2.18],
    ],
    0.032,
    amberGlow,
    footballUsTarget,
    40,
    7,
  );
  uprightCross.castShadow = false;
  targetGroups.push(footballUsTarget);
  targetDetectors.push({
    axis: "z",
    center: new THREE.Vector3(0, 4.34, -2.18),
    halfWidth: 1.02,
    halfHeight: 1.02,
  });

  const esportsTarget = new THREE.Group();
  esportsTarget.name = "esports-hex-target";
  group.add(esportsTarget);
  const hexPoints = [];
  for (let index = 0; index <= 6; index += 1) {
    const angle = index / 6 * TAU + Math.PI / 6;
    hexPoints.push(new THREE.Vector3(Math.cos(angle) * 1.23, 3.78 + Math.sin(angle) * 1.34, -2.2));
  }
  addTube(hexPoints, 0.055, glowMaterial, esportsTarget, 72, 8);
  const innerHexPoints = hexPoints.map((point) => new THREE.Vector3(point.x * 0.72, 3.78 + (point.y - 3.78) * 0.72, -2.16));
  addTube(innerHexPoints, 0.018, brass, esportsTarget, 48, 6);
  for (let index = 0; index < 6; index += 1) {
    addLine(
      [
        new THREE.Vector3(0, 3.78, -2.16),
        hexPoints[index],
      ],
      0x91d9d4,
      esportsTarget,
    );
  }
  targetGroups.push(esportsTarget);
  targetDetectors.push({
    axis: "z",
    center: new THREE.Vector3(0, 3.78, -2.2),
    halfWidth: 1.08,
    halfHeight: 1.18,
  });
  targetGroups.forEach((target) => {
    target.position.z = TARGET_FRONT_SHIFT;
  });
  targetDetectors.forEach((detector) => {
    detector.center.z += TARGET_FRONT_SHIFT;
  });

  const selectorRoot = new THREE.Group();
  selectorRoot.name = "sport-selector-stations";
  group.add(selectorRoot);
  const selectorRecords = [];
  for (let index = 0; index < SPORT_PROFILES.length; index += 1) {
    const profile = SPORT_PROFILES[index];
    const plaqueMaterial = localMaterial({
      color: index === state.selected ? 0xeee8dc : 0x1b2624,
      roughness: 0.54,
      metalness: 0.12,
      emissive: index === state.selected ? 0x4f7f73 : 0x000000,
      emissiveIntensity: index === state.selected ? 0.2 : 0,
    });
    const holder = new THREE.Group();
    const x = (index - 2) * 0.78;
    holder.position.set(x, 0.56, 1.96 - Math.abs(x) * 0.025);
    holder.rotation.y = -x * 0.08;
    selectorRoot.add(holder);
    addRounded(0.64, 0.3, 0.1, plaqueMaterial, holder, [0, 0, 0], 0.05);
    const plaqueLabel = addText(profile.label, 0.62, 0.15, holder, [0, 0.035, 0.061], {
      color: index === state.selected ? "#224038" : "#d7cbaa",
      fontSize: 34,
    });
    addCylinder(0.035, 0.38, brass, 0, -0.34, -0.05, holder);
    const hit = addRounded(0.82, 0.52, 0.18, proxyMaterial, holder, [0, 0, 0.03], 0.05);
    hit.castShadow = false;
    hit.receiveShadow = false;
    hit.userData.interactionId = `sport-select-${profile.key}`;
    kit.register(hit, {
      id: `sport-select-${profile.key}`,
      label: `${profile.label}场地展牌`,
      hint: "点击切换本地球场、目标与看台形态",
      anchor: [0, 0, 0],
      onClick() {
        selectSport(index, false);
      },
      onKey(key) {
        if (key === "Enter" || key === " ") selectSport(index, false);
      },
    });
    selectorRecords.push({ holder, profile, baseX: x, plaqueMaterial, plaqueLabel });
  }

  const dossier = new THREE.Group();
  dossier.name = "sport-collection-dossier";
  dossier.position.set(-4.25, 2.82, 1.9);
  dossier.rotation.y = 0.28;
  group.add(dossier);
  addRounded(1.52, 1.16, 0.14, walnut, dossier, [0, 0, 0], 0.08);
  addRounded(1.32, 0.84, 0.055, stone, dossier, [0, 0.09, 0.095], 0.04);
  const firstImage = currentItem()?.image || "";
  if (firstImage && typeof kit.image === "function") {
    dossierImage = kit.image(firstImage, 1.2, 0.72, dossier);
    if (dossierImage) {
      dossierImage.position.set(0, 0.1, 0.132);
      dossierImage.castShadow = false;
    }
  }
  dossierTitle = addText(shortText(currentItem()?.title, 18) || "等待运动收藏", 1.34, 0.17, dossier, [0, -0.42, 0.14], {
    color: "#d8c89f",
    fontSize: 34,
  });
  addText("作品牌 · 点击读取真实收藏", 1.36, 0.1, dossier, [0, -0.58, 0.14], {
    color: "#91c9c2",
    fontSize: 24,
  });
  const dossierProxy = addRounded(1.62, 1.28, 0.28, proxyMaterial, dossier, [0, 0, 0.08], 0.07);
  dossierProxy.castShadow = false;
  dossierProxy.receiveShadow = false;
  dossierProxy.userData.interactionId = "sport-collection-card";
  kit.register(dossierProxy, {
    id: "sport-collection-card",
    label: "运动收藏作品牌",
    hint: "打开当前运动收藏，不改变访客小游戏比分",
    anchor: [0, 0, 0],
    onClick() {
      openSelectedItem();
    },
    onKey(key) {
      if (key === "Enter" || key === " ") openSelectedItem();
    },
  });

  const ballRoot = new THREE.Group();
  ballRoot.name = "draggable-ball";
  ballRoot.position.copy(ballStart);
  group.add(ballRoot);
  const ballGeometry = ownGeometry(new THREE.SphereGeometry(0.2, 24, 16));
  const ballMesh = addMesh(ballGeometry, brass, 0, 0, 0, ballRoot);
  ballMesh.castShadow = true;
  const seamGeometry = ownGeometry(new THREE.TorusGeometry(0.202, 0.009, 5, 28));
  const seamA = addMesh(seamGeometry, rubber, 0, 0, 0, ballRoot);
  seamA.rotation.x = Math.PI / 2;
  const seamB = addMesh(seamGeometry, rubber, 0, 0, 0, ballRoot);
  seamB.rotation.y = Math.PI / 2;
  const launchZone = new THREE.Group();
  launchZone.name = "launch-zone";
  group.add(launchZone);
  addCylinder(0.52, 0.055, dark, 0, 2.17, 2.92, launchZone);
  const launchRing = addRing(0.46, 0.018, amberGlow, launchZone, [0, 2.205, 2.92]);
  launchRing.rotation.x = Math.PI / 2;
  const ballProxy = addMesh(
    ownGeometry(new THREE.SphereGeometry(0.42, 12, 9)),
    proxyMaterial,
    0,
    0,
    0,
    ballRoot,
  );
  ballProxy.castShadow = false;
  ballProxy.receiveShadow = false;
  ballProxy.userData.interactionId = "launch-ball";
  kit.register(ballProxy, {
    id: "launch-ball",
    label: "弹道球",
    hint: "拖动显示真实弧线与力道，释放后发射",
    anchor: [0, 0, 0],
    onDown() {
      cancelFlight();
      draggingBall = true;
      dragX = 0;
      dragY = 0;
      status("拖动球改变横向偏角、仰角与力道。");
    },
    onDrag({ dx = 0, dy = 0, totalX, totalY } = {}) {
      dragX = Number.isFinite(Number(totalX)) ? Number(totalX) : dragX + Number(dx || 0);
      dragY = Number.isFinite(Number(totalY)) ? Number(totalY) : dragY + Number(dy || 0);
      const distance = Math.hypot(dragX, dragY);
      state.aim.lateral = clamp(dragX / 145, -1, 1);
      state.aim.elevation = clamp(0.56 - dragY / 150, 0.02, 1.18);
      state.aim.power = clamp(0.25 + distance / 185 + state.charge * 0.08, 0.25, 1);
      ballRoot.position.x = ballStart.x + state.aim.lateral * 0.42;
      ballRoot.position.y = ballStart.y + (state.aim.elevation - 0.56) * 0.24;
      ballRoot.position.z = ballStart.z;
      updateAimArc();
      if (lastTime - lastStatusAt > 0.13) {
        status(
          `瞄准 ${Math.round(state.aim.power * 100)}% · 仰角 ${Math.round(state.aim.elevation * 100)} · 偏角 ${Math.round(state.aim.lateral * 100)}`,
        );
        lastStatusAt = lastTime;
      }
      invalidate();
    },
    onUp() {
      if (draggingBall) launchBall();
    },
    onClick() {
      launchBall();
    },
    onKey(key) {
      if (key === "ArrowLeft") state.aim.lateral = clamp(state.aim.lateral - 0.06, -1, 1);
      else if (key === "ArrowRight") state.aim.lateral = clamp(state.aim.lateral + 0.06, -1, 1);
      else if (key === "ArrowUp") state.aim.elevation = clamp(state.aim.elevation + 0.06, 0.02, 1.18);
      else if (key === "ArrowDown") state.aim.elevation = clamp(state.aim.elevation - 0.06, 0.02, 1.18);
      else if (key === "Enter" || key === " ") launchBall();
      else return;
      updateAimArc();
      invalidate();
    },
  });

  const gravityMount = new THREE.Group();
  gravityMount.name = "draggable-gravity-ring";
  gravityMount.position.set(-3.28, 1.2, 2.94);
  gravityMount.rotation.y = -0.18;
  group.add(gravityMount);
  const gravityTilt = new THREE.Group();
  gravityMount.add(gravityTilt);
  addCylinder(1.02, 0.12, blackLacquer, 0, 0, -0.04, gravityTilt, [Math.PI / 2, 0, 0]);
  const gravityRingMesh = addRing(0.84, 0.055, glowMaterial, gravityTilt, [0, 0, 0.18]);
  const gravityRingInner = addRing(0.64, 0.018, brass, gravityTilt, [0, 0, 0.2]);
  const gravityVaneGeometry = new THREE.BoxGeometry(0.15, 0.025, 0.05);
  const gravityVanePlacements = [];
  for (let index = 0; index < 24; index += 1) {
    const angle = index / 24 * TAU;
    gravityVanePlacements.push({
      position: [Math.sin(angle) * 0.92, Math.cos(angle) * 0.92, 0.19],
      rotation: [0, 0, -angle],
      scale: [index % 6 === 0 ? 1.38 : 0.76, index % 6 === 0 ? 1.35 : 0.8, 1],
    });
  }
  addInstances(gravityVaneGeometry, amberGlow, gravityVanePlacements, gravityTilt);
  addText("3", 0.13, 0.075, gravityTilt, [-0.72, -0.55, 0.2], {
    color: "#d9c18d",
    fontSize: 28,
  });
  addText("18", 0.16, 0.075, gravityTilt, [0.64, -0.58, 0.2], {
    color: "#d9c18d",
    fontSize: 28,
  });
  addText("方向", 0.3, 0.08, gravityTilt, [0, 0.96, 0.2], {
    color: "#9ce1dd",
    fontSize: 24,
  });

  const gravityDirectionLever = new THREE.Group();
  gravityDirectionLever.position.z = 0.26;
  gravityTilt.add(gravityDirectionLever);
  addRounded(0.055, 0.6, 0.06, brass, gravityDirectionLever, [0, 0.28, 0], 0.02);
  addCylinder(0.12, 0.3, stone, 0, 0.6, 0.08, gravityDirectionLever, [Math.PI / 2, 0, 0]);
  addCylinder(0.072, 0.1, amberGlow, 0, 0.6, 0.24, gravityDirectionLever, [Math.PI / 2, 0, 0]);
  addCylinder(0.1, 0.16, darkCopper, 0, 0, 0, gravityDirectionLever, [Math.PI / 2, 0, 0]);

  const gravityGrip = addCylinder(0.17, 0.38, brass, 0.78, -0.34, 0.34, gravityTilt, [Math.PI / 2, 0, 0]);
  addCylinder(0.09, 0.1, amberGlow, 0.78, -0.34, 0.53, gravityTilt, [Math.PI / 2, 0, 0]);
  addRing(0.21, 0.025, brass, gravityTilt, [0.78, -0.34, 0.3]);
  gravityGrip.userData.interactionId = "gravity-ring";
  kit.register(gravityGrip, {
    id: "gravity-ring",
    label: "引力环握柄",
    hint: "拖动前左引力环外缘握柄，改变重力强度与方向刻度",
    anchor: [0, 0, 0],
    onDown() {
      gravityStart = state.gravity.magnitude;
      gravityAngleStart = state.gravity.angle;
    },
    onDrag({ totalX = 0, totalY = 0 } = {}) {
      state.gravity.magnitude = clamp(gravityStart + totalX * 0.045, 3, 18);
      state.gravity.angle = clamp(gravityAngleStart + totalY * 0.0095, -Math.PI / 2, Math.PI / 2);
      updateGravityVector();
      updateAimArc();
      if (lastTime - lastStatusAt > 0.14) {
        status(
          `引力 ${state.gravity.magnitude.toFixed(1)} · 倾角 ${Math.round(state.gravity.angle * 180 / Math.PI)}°`,
        );
        lastStatusAt = lastTime;
      }
      invalidate();
    },
    onUp() {
      status(`引力锁定 · ${state.gravity.magnitude.toFixed(1)} · 弹道已重算`);
    },
    onClick() {
      state.gravity.angle = state.gravity.angle > 0.5 ? -0.5 : state.gravity.angle + 0.25;
      updateGravityVector();
      updateAimArc();
      invalidate();
    },
    onKey(key) {
      if (key === "ArrowLeft") state.gravity.magnitude = clamp(state.gravity.magnitude - 0.5, 3, 18);
      else if (key === "ArrowRight") state.gravity.magnitude = clamp(state.gravity.magnitude + 0.5, 3, 18);
      else if (key === "ArrowUp") state.gravity.angle = clamp(state.gravity.angle + 0.08, -Math.PI / 2, Math.PI / 2);
      else if (key === "ArrowDown") state.gravity.angle = clamp(state.gravity.angle - 0.08, -Math.PI / 2, Math.PI / 2);
      else return;
      updateGravityVector();
      updateAimArc();
      invalidate();
    },
  });

  const pressRoot = new THREE.Group();
  pressRoot.name = "pressure-pulse";
  pressRoot.position.set(3.28, 1.03, 2.94);
  pressRoot.rotation.y = 0.18;
  group.add(pressRoot);
  addRounded(0.9, 0.24, 0.72, dark, pressRoot, [0, 0, 0], 0.07);
  const pressCap = addRounded(0.62, 0.26, 0.52, brass, pressRoot, [0, 0.17, 0], 0.06);
  addCylinder(0.06, 0.62, brass, 0, 0.56, -0.16, pressRoot);
  addCylinder(0.2, 0.12, amberGlow, 0, 0.9, -0.16, pressRoot);
  addRounded(0.24, 0.09, 0.34, darkCopper, pressCap, [0, 0.17, 0], 0.03);
  for (let index = 0; index < 5; index += 1) {
    addBox(
      index < 4 ? brass : amberGlow,
      0.055,
      0.028,
      0.12,
      -0.28 + index * 0.14,
      0.02,
      0.4,
      pressRoot,
    );
  }
  addText("0", 0.12, 0.07, pressRoot, [-0.38, 0.04, 0.43], {
    color: "#d9c18d",
    fontSize: 24,
  });
  addText("100%", 0.3, 0.07, pressRoot, [0.35, 0.04, 0.43], {
    color: "#e7b65e",
    fontSize: 24,
  });
  pressCap.userData.interactionId = "pressure-pulse";
  kit.register(pressCap, {
    id: "pressure-pulse",
    label: "蓄压推杆",
    hint: "按下，为下一次发射蓄压并抬升悬浮轨道",
    anchor: [0, 0, 0],
    onDown() {
      pressCap.position.y = 0.09;
    },
    onUp() {
      pressCap.position.y = 0.17;
    },
    onClick() {
      chargeShot();
    },
    onKey(key) {
      if (key === "Enter" || key === " ") chargeShot();
    },
  });

  const aimGeometry = ownGeometry(new THREE.BufferGeometry());
  const aimPositions = new Float32Array(TARGET_STEPS * 3);
  aimGeometry.setAttribute("position", new THREE.Float32BufferAttribute(aimPositions, 3));
  aimGeometry.setDrawRange(0, 0);
  aimGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 9);
  const aimMaterial = ownMaterial(new THREE.LineBasicMaterial({
    color: 0xffd07a,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  const aimLine = new THREE.Line(aimGeometry, aimMaterial);
  aimLine.frustumCulled = false;
  aimLine.visible = false;
  group.add(aimLine);

  addText("失重竞技穹顶", 3.0, 0.42, group, [0, 7.55, 0.25], {
    color: "#e9ddbf",
    fontSize: 60,
  });
  addText("访客小游戏 · 不记录真实赛果", 3.2, 0.2, group, [0, 7.14, 0.25], {
    color: "#9ce1dd",
    fontSize: 32,
  });

  function updateGravityVector() {
    const magnitude = state.gravity.magnitude;
    const angle = state.gravity.angle;
    gravityVector.set(
      Math.sin(angle) * magnitude * 0.16,
      -magnitude,
      -Math.sin(angle * 0.6) * magnitude * 0.07,
    );
    return gravityVector;
  }

  function profileCourtLineSegments(profileIndex) {
    const points = [];
    const add = (x1, z1, x2, z2) => {
      points.push(new THREE.Vector3(x1, 0, z1), new THREE.Vector3(x2, 0, z2));
    };
    const ellipse = (cx, cz, rx, rz, count = 24) => {
      for (let index = 0; index < count; index += 1) {
        const a0 = index / count * TAU;
        const a1 = (index + 1) / count * TAU;
        add(
          cx + Math.cos(a0) * rx,
          cz + Math.sin(a0) * rz,
          cx + Math.cos(a1) * rx,
          cz + Math.sin(a1) * rz,
        );
      }
    };
    if (profileIndex === 0) {
      add(-2.72, -1.44, 2.72, -1.44);
      add(2.72, -1.44, 2.72, 1.44);
      add(2.72, 1.44, -2.72, 1.44);
      add(-2.72, 1.44, -2.72, -1.44);
      add(0, -1.44, 0, 1.44);
      ellipse(0, 0, 0.64, 0.58, 20);
      ellipse(-2.05, 0, 0.5, 0.43, 16);
      ellipse(2.05, 0, 0.5, 0.43, 16);
    } else if (profileIndex === 1) {
      add(-2.72, -1.66, 2.72, -1.66);
      add(2.72, -1.66, 2.72, 1.66);
      add(2.72, 1.66, -2.72, 1.66);
      add(-2.72, 1.66, -2.72, -1.66);
      add(0, -1.66, 0, 1.66);
      ellipse(0, 0, 0.58, 0.58, 20);
      add(-2.72, -0.84, -1.92, -0.84);
      add(-2.72, 0.84, -1.92, 0.84);
      add(2.72, -0.84, 1.92, -0.84);
      add(2.72, 0.84, 1.92, 0.84);
    } else if (profileIndex === 2) {
      ellipse(0, 0, 2.58, 1.69, 36);
      ellipse(0, 0.05, 1.42, 0.92, 28);
      add(-0.42, 1.48, 0.16, 1.89);
      add(0.16, 1.89, 0.72, 1.45);
      add(-1.0, -0.2, 1.0, 0.25);
    } else if (profileIndex === 3) {
      add(-2.76, -1.56, 2.76, -1.56);
      add(2.76, -1.56, 2.76, 1.56);
      add(2.76, 1.56, -2.76, 1.56);
      add(-2.76, 1.56, -2.76, -1.56);
      for (let index = -4; index <= 4; index += 1) add(index * 0.58, -1.56, index * 0.58, 1.56);
      add(0, -2.12, 0, 2.12);
    } else {
      const hex = [];
      for (let index = 0; index <= 6; index += 1) {
        const angle = index / 6 * TAU + Math.PI / 6;
        hex.push([Math.cos(angle) * 2.7, Math.sin(angle) * 1.75]);
      }
      for (let index = 0; index < 6; index += 1) {
        add(hex[index][0], hex[index][1], hex[index + 1][0], hex[index + 1][1]);
        add(0, 0, hex[index][0], hex[index][1]);
      }
      ellipse(0, 0, 0.85, 0.62, 18);
    }
    return points;
  }

  function updateCourtLines(index) {
    const points = profileCourtLineSegments(index);
    const count = Math.min(points.length, courtLinePositions.length / 3);
    for (let offset = 0; offset < count; offset += 1) {
      const point = points[offset];
      courtLinePositions[offset * 3] = point.x;
      courtLinePositions[offset * 3 + 1] = point.y;
      courtLinePositions[offset * 3 + 2] = point.z;
    }
    courtLineGeometry.attributes.position.needsUpdate = true;
    courtLineGeometry.setDrawRange(0, count);
  }

  function updateStands(index) {
    const profile = SPORT_PROFILES[index] || SPORT_PROFILES[0];
    standSurfaces.forEach((surface, tier) => {
      surface.scale.set(profile.standX + tier * 0.13, 1, profile.standZ + tier * 0.08);
    });
    standRings.forEach((ring, tier) => {
      ring.scale.set(profile.standX + tier * 0.13, 1, profile.standZ + tier * 0.08);
    });

    const seatDummy = new THREE.Object3D();
    let seatIndex = 0;
    for (let tier = 0; tier < tierCount; tier += 1) {
      const reverse = tier >= 3;
      const radiusX = profile.standX + tier * 0.17;
      const radiusZ = profile.standZ + tier * 0.11;
      const height = 3.14 + tier * 0.39;
      for (let lane = 0; lane < seatsPerTier; lane += 1) {
        const angle = REAR_STAND_START + (lane + 0.5) / seatsPerTier * REAR_STAND_ARC + tier * 0.012;
        const x = Math.sin(angle) * radiusX;
        const z = Math.cos(angle) * radiusZ;
        seatDummy.position.set(x, height, z);
        seatDummy.rotation.order = "YXZ";
        seatDummy.rotation.set(reverse ? Math.PI : 0, -angle, Math.sin(lane * 2.3) * 0.018);
        seatDummy.scale.set(1, 1, 1);
        seatDummy.updateMatrix();
        seatBodyInstances.setMatrixAt(seatIndex, seatDummy.matrix);

        seatDummy.position.set(
          x + Math.sin(angle) * 0.12,
          height + (reverse ? -0.13 : 0.13),
          z + Math.cos(angle) * 0.12,
        );
        seatDummy.rotation.set(reverse ? Math.PI : 0, -angle, 0);
        seatDummy.updateMatrix();
        seatBackInstances.setMatrixAt(seatIndex, seatDummy.matrix);
        seatIndex += 1;
      }
    }
    seatBodyInstances.instanceMatrix.needsUpdate = true;
    seatBackInstances.instanceMatrix.needsUpdate = true;
    seatBodyInstances.computeBoundingSphere?.();
    seatBackInstances.computeBoundingSphere?.();
  }

  function updateTargets(index) {
    targetGroups.forEach((target, targetIndex) => {
      target.visible = targetIndex === index;
    });
    currentDetector = targetDetectors[index] || targetDetectors[0];
  }

  function updateSelectorStyles(index) {
    selectorRecords.forEach((record, recordIndex) => {
      const selected = recordIndex === index;
      record.holder.position.y = 0.56 + (selected ? 0.08 : 0);
      record.holder.scale.setScalar(selected ? 1.07 : 1);
      record.plaqueMaterial.color.setHex(selected ? 0xb59a69 : 0x202824);
      record.plaqueMaterial.emissive.setHex(selected ? SPORT_PROFILES[recordIndex].color : 0x000000);
      record.plaqueMaterial.emissiveIntensity = selected ? 0.22 : 0;
      if (record.plaqueLabel?.material) {
        record.plaqueLabel.material.color.set(selected ? "#1c2a25" : "#c8bda3");
      }
    });
  }

  function updateDossier() {
    const item = currentItem();
    if (!item) return;
    dossierTitle = replaceText(
      dossierTitle,
      shortText(item.title, 18),
      1.34,
      0.17,
      dossier,
      [0, -0.42, 0.14],
      { color: "#d8c89f", fontSize: 34 },
    );
    if (dossierImage && item.image && typeof kit.texture === "function") {
      const nextTexture = kit.texture(item.image);
      const apply = (textureValue) => {
        const texture = textureValue?.isTexture ? textureValue : textureValue?.texture;
        if (!texture?.isTexture || !dossierImage.material) return;
        dossierImage.material.map = texture;
        dossierImage.material.needsUpdate = true;
      };
      if (nextTexture?.then) nextTexture.then(apply).catch(() => {});
      else apply(nextTexture);
    }
  }

  function selectSport(index, notify) {
    if (!SPORT_PROFILES.length) return -1;
    const requested = Number.isFinite(Number(index)) ? Math.trunc(Number(index)) : 0;
    state.selected = ((requested % SPORT_PROFILES.length) + SPORT_PROFILES.length) % SPORT_PROFILES.length;
    const profile = currentProfile();
    cancelFlight();
    state.aim.lateral = 0;
    state.aim.elevation = 0.56;
    state.aim.power = 0.68;
    state.charge = 0;
    chargePulse = 0;
    resetBall();

    const layout = COURT_LAYOUTS[state.selected] || COURT_LAYOUTS[0];
    courtTiles.forEach((tile, tileIndex) => {
      const spec = layout[tileIndex] || layout[layout.length - 1];
      const seam = COURT_SEAM_PATTERN[tileIndex % COURT_SEAM_PATTERN.length];
      tile.position.set(spec.x + seam.dx, seam.lift, spec.z + seam.dz);
      tile.scale.set(
        Math.max(0.24, spec.w - seam.shrink),
        1,
        Math.max(0.24, spec.d - seam.shrink * 0.72),
      );
      tile.rotation.y = (spec.rot || 0) + (tileIndex % 3 - 1) * 0.012;
    });
    updateCourtLines(state.selected);
    updateStands(state.selected);
    updateTargets(state.selected);
    updateSelectorStyles(state.selected);
    updateDossier();
    courtMaterial.color.setHex(profile.color);
    courtMaterial.emissive.setHex(profile.color);
    courtMaterial.emissiveIntensity = 0.12;
    teamMaterial.color.setHex(profile.color);
    teamMaterial.emissive.setHex(profile.color);
    teamMaterial.emissiveIntensity = 0.15;
    glowMaterial.color.setHex(profile.accent);
    updateGravityVector();
    updateAimArc();
    if (notify) {
      status(`${profile.label}场地已展开 · 目标：${profile.targetLabel} · 访客比分 ${state.score}/${state.shots}`);
      invalidate();
    }
    return state.selected;
  }

  function openSelectedItem() {
    const item = currentItem();
    if (!item) return false;
    if (typeof kit.onItemSelect === "function") kit.onItemSelect(item);
    else if (typeof kit.onSelect === "function") kit.onSelect("sport", state.selected);
    status(`已打开运动收藏 · ${shortText(item.title, 24)}`);
    return true;
  }

  function resetBall() {
    ballRoot.position.copy(ballStart);
    state.ballPosition.copy(ballStart);
    aimLine.visible = false;
    ballRoot.visible = true;
  }

  function cancelFlight() {
    flight = null;
    state.playing = false;
    draggingBall = false;
    resetBall();
  }

  function chargeShot() {
    if (!activeNow) return false;
    if (state.charge >= 1) {
      chargePulse = Math.max(chargePulse, 0.45);
      status("蓄压已达 100% 上限；请先发射，再重新蓄压。");
      invalidate();
      return false;
    }
    state.charge = 1;
    chargePulse = 1;
    state.aim.power = clamp(state.aim.power + 0.08, 0.25, 1);
    updateAimArc();
    status("蓄压推杆已压到底 · 下一条弹道速度提高、轨道抬高");
    invalidate();
    return true;
  }

  function solveLaunch() {
    const detector = currentDetector || targetDetectors[0];
    const start = ballStart.clone();
    const target = detector.center.clone();
    const lateralOffset = state.aim.lateral * (detector.radiusX || detector.halfWidth || 0.9) * 1.52;
    const verticalOffset = (state.aim.elevation - 0.56) * (detector.halfHeight || detector.radiusZ || 0.9) * 1.35;
    if (detector.axis === "y") {
      target.x += lateralOffset;
      target.z += verticalOffset;
    } else {
      target.x += lateralOffset;
      target.y += verticalOffset;
    }
    const gravity = updateGravityVector().clone();
    const time = clamp(1.38 - state.aim.power * 0.32 - state.charge * 0.08, 0.78, 1.18);
    const velocity = target.clone().sub(start).addScaledVector(gravity, -0.5 * time * time).multiplyScalar(1 / time);
    return {
      start,
      target,
      gravity,
      time,
      velocity,
      detector,
    };
  }

  function sampleArc(shot, steps = TARGET_STEPS) {
    const positions = [];
    const position = shot.start.clone();
    const velocity = shot.velocity.clone();
    const step = shot.time / Math.max(1, steps - 1);
    for (let index = 0; index < steps; index += 1) {
      positions.push(position.clone());
      velocity.addScaledVector(shot.gravity, step);
      position.addScaledVector(velocity, step);
    }
    return positions;
  }

  function updateAimArc() {
    if (!currentDetector || disposed) return;
    const shot = solveLaunch();
    const points = sampleArc(shot);
    for (let index = 0; index < points.length; index += 1) {
      aimPositions[index * 3] = points[index].x;
      aimPositions[index * 3 + 1] = points[index].y;
      aimPositions[index * 3 + 2] = points[index].z;
    }
    aimGeometry.attributes.position.needsUpdate = true;
    aimGeometry.setDrawRange(0, points.length);
    aimLine.visible = !state.playing;
    aimMaterial.opacity = 0.48 + state.aim.power * 0.38 + state.charge * 0.12;
  }

  function crossesDetector(previous, current, detector) {
    if (detector.axis === "y") {
      if (!(previous.y >= detector.center.y && current.y <= detector.center.y)) return false;
      const span = previous.y - current.y || 1;
      const t = clamp((previous.y - detector.center.y) / span, 0, 1);
      const x = THREE.MathUtils.lerp(previous.x, current.x, t);
      const z = THREE.MathUtils.lerp(previous.z, current.z, t);
      const dx = (x - detector.center.x) / (detector.radiusX || 0.5);
      const dz = (z - detector.center.z) / (detector.radiusZ || 0.5);
      return dx * dx + dz * dz <= 1;
    }
    if (!(previous.z >= detector.center.z && current.z <= detector.center.z)) return false;
    const span = previous.z - current.z || 1;
    const t = clamp((previous.z - detector.center.z) / span, 0, 1);
    const x = THREE.MathUtils.lerp(previous.x, current.x, t);
    const y = THREE.MathUtils.lerp(previous.y, current.y, t);
    return Math.abs(x - detector.center.x) <= (detector.halfWidth || 1)
      && Math.abs(y - detector.center.y) <= (detector.halfHeight || 1);
  }

  function launchBall() {
    if (!activeNow || disposed || state.playing) return false;
    draggingBall = false;
    const shot = solveLaunch();
    state.shots += 1;
    state.playing = true;
    state.lastResult = "球在飞行";
    flight = {
      ...shot,
      elapsed: 0,
      hit: false,
      missReported: false,
      position: shot.start.clone(),
      velocity: shot.velocity.clone(),
      previous: shot.start.clone(),
    };
    ballRoot.position.copy(shot.start);
    state.ballPosition.copy(shot.start);
    aimLine.visible = true;
    state.charge = 0;
    status(`${currentProfile().targetLabel}发射 · 第 ${state.shots} 次 · 实时计算弹道`);
    invalidate();
    return true;
  }

  function finishShot(hit) {
    if (!flight) return;
    state.playing = false;
    flight = null;
    state.lastResult = hit ? "命中" : "未命中";
    if (hit) {
      state.score += 1;
      targetPulse = 1;
      status(`访客命中 ${currentProfile().targetLabel} · ${state.score}/${state.shots}`);
    } else {
      status(`访客未命中 · ${state.score}/${state.shots} · 可拖动引力环重算弧线`);
    }
    globalThis.setTimeout?.(() => {
      if (!disposed && activeNow && !state.playing) resetBall();
    }, reducedMotion() ? 0 : 420);
    invalidate();
  }

  function insideBallEnvelope(position) {
    return position.x >= BALL_ENVELOPE.minX
      && position.x <= BALL_ENVELOPE.maxX
      && position.y >= BALL_ENVELOPE.minY
      && position.y <= BALL_ENVELOPE.maxY
      && position.z >= BALL_ENVELOPE.minZ
      && position.z <= BALL_ENVELOPE.maxZ;
  }

  function updateFlight(delta) {
    if (!flight) return;
    let remaining = delta;
    const step = 0.012;
    while (remaining > 0) {
      const slice = Math.min(step, remaining);
      flight.previous.copy(flight.position);
      flight.velocity.addScaledVector(flight.gravity, slice);
      flight.position.addScaledVector(flight.velocity, slice);
      flight.elapsed += slice;
      ballRoot.position.copy(flight.position);
      state.ballPosition.copy(flight.position);
      ballRoot.rotation.z -= slice * 8;
      ballRoot.rotation.x += slice * 2;
      if (!insideBallEnvelope(flight.position)) {
        flight.position.set(
          clamp(flight.position.x, BALL_ENVELOPE.minX, BALL_ENVELOPE.maxX),
          clamp(flight.position.y, BALL_ENVELOPE.minY, BALL_ENVELOPE.maxY),
          clamp(flight.position.z, BALL_ENVELOPE.minZ, BALL_ENVELOPE.maxZ),
        );
        ballRoot.position.copy(flight.position);
        state.ballPosition.copy(flight.position);
        finishShot(false);
        return;
      }
      if (!flight.hit && crossesDetector(flight.previous, flight.position, flight.detector)) {
        flight.hit = true;
        finishShot(true);
        return;
      }
      remaining -= slice;
    }
    if (flight && flight.elapsed > flight.time + 0.46) finishShot(false);
  }

  function resetExperience() {
    cancelFlight();
    state.score = 0;
    state.shots = 0;
    state.selected = 0;
    state.playing = false;
    state.charge = 0;
    state.lastResult = "等待出手";
    state.aim.lateral = 0;
    state.aim.elevation = 0.56;
    state.aim.power = 0.68;
    state.gravity.magnitude = 9.8;
    state.gravity.angle = 0;
    targetPulse = 0;
    chargePulse = 0;
    selectSport(0, false);
    status("失重竞技穹顶已复位 · 访客比分 0/0");
    invalidate();
    return true;
  }

  updateGravityVector();
  selectSport(0, false);
  updateAimArc();

  return {
    group,
    focus: new THREE.Vector3(0, 3.55, 0),
    update(time, delta, active) {
      if (disposed || !activeNow) return;
      const safeTime = Number(time) || 0;
      const safeDelta = clamp(Number(delta) || 0, 0, 0.05);
      lastTime = safeTime;
      if (!active) return;
      targetPulse = damp(targetPulse, 0, 4.2, safeDelta);
      chargePulse = damp(chargePulse, 0, 3.4, safeDelta);
      if (!state.playing) {
        ballRoot.rotation.y += safeDelta * 0.32;
        if (draggingBall) updateAimArc();
      }
      updateFlight(safeDelta);
      trackPods.forEach((record, index) => {
        const phase = ((record.phase + safeTime * record.speed) % 1 + 1) % 1;
        const angle = REAR_STAND_START + phase * REAR_STAND_ARC;
        const radiusX = record.high ? 4.06 : 4.3;
        const radiusZ = record.high ? 2.78 : 3.0;
        record.pod.position.set(
          Math.sin(angle) * radiusX,
          record.high ? 5.57 : 3.09,
          Math.cos(angle) * radiusZ,
        );
        record.pod.rotation.y = -angle;
        record.pod.scale.setScalar(1 + chargePulse * (index % 2 ? 0.04 : 0.07));
      });
      gravityTilt.rotation.z = state.gravity.angle * 0.08;
      gravityDirectionLever.rotation.z = -state.gravity.angle * 0.42;
      gravityMount.position.set(-3.28, 1.2 + chargePulse * 0.06, 2.94);
      gravityRingMesh.scale.setScalar(1 + targetPulse * 0.035 + chargePulse * 0.025);
      gravityRingInner.scale.setScalar(1 + targetPulse * 0.025);
      glowMaterial.opacity = 0.68 + targetPulse * 0.28;
      amberGlow.opacity = 0.58 + chargePulse * 0.26;
      pressRoot.rotation.z = Math.sin(safeTime * 23) * chargePulse * 0.016;
      selectorRecords.forEach((record, index) => {
        const selected = index === state.selected;
        record.holder.rotation.z = Math.sin(safeTime * 0.55 + index) * (selected ? 0.012 : 0.004);
      });
      if (targetPulse > 0.02) {
        targetGroups[state.selected].scale.setScalar(1 + targetPulse * 0.08);
      } else if (targetGroups[state.selected]) {
        targetGroups[state.selected].scale.setScalar(1);
      }
      invalidate();
    },
    interact(action, index) {
      if (action === "reset") return resetExperience();
      if (action === "select") return selectSport(index, true);
      if (action === "charge") return chargeShot();
      if (action === "launch" || action === "play") return launchBall();
      if (action === "gravity") {
        state.gravity.magnitude = clamp(index, 3, 18);
        updateGravityVector();
        updateAimArc();
        invalidate();
        return state.gravity.magnitude;
      }
      if (action === "open") return openSelectedItem();
      return false;
    },
    getState() {
      const item = currentItem();
      const profile = currentProfile();
      const direction = updateGravityVector();
      return {
        score: state.score,
        shots: state.shots,
        aim: {
          lateral: Number(state.aim.lateral.toFixed(3)),
          elevation: Number(state.aim.elevation.toFixed(3)),
          power: Number(state.aim.power.toFixed(3)),
          charge: state.charge,
        },
        gravity: {
          magnitude: Number(state.gravity.magnitude.toFixed(2)),
          angle: Number(state.gravity.angle.toFixed(3)),
          direction: [
            Number(direction.x.toFixed(3)),
            Number(direction.y.toFixed(3)),
            Number(direction.z.toFixed(3)),
          ],
        },
        selected: state.selected,
        selectedId: item?.id || profile.key,
        court: profile.label,
        target: profile.targetLabel,
        ballPosition: [
          Number(state.ballPosition.x.toFixed(3)),
          Number(state.ballPosition.y.toFixed(3)),
          Number(state.ballPosition.z.toFixed(3)),
        ],
        playing: Boolean(state.playing),
        lastResult: state.lastResult,
        visitorScore: true,
        limits: {
          gravity: [3, 18],
          charge: [0, 1],
          aimPower: [0.25, 1],
        },
        ballEnvelope: {
          min: [BALL_ENVELOPE.minX, BALL_ENVELOPE.minY, BALL_ENVELOPE.minZ],
          max: [BALL_ENVELOPE.maxX, BALL_ENVELOPE.maxY, BALL_ENVELOPE.maxZ],
        },
      };
    },
    setActive(active) {
      activeNow = Boolean(active);
      if (!activeNow) {
        draggingBall = false;
        flight = null;
        state.playing = false;
        resetBall();
      } else updateAimArc();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      activeNow = false;
      flight = null;
      draggingBall = false;
      for (const object of ownedInstanced) object.dispose?.();
      ownedGeometries.forEach((geometry) => geometry.dispose?.());
      ownedMaterials.forEach((material) => material.dispose?.());
      ownedTextures.forEach((texture) => texture.dispose?.());
      ownedInstanced.clear();
      ownedGeometries.clear();
      ownedMaterials.clear();
      ownedTextures.clear();
      group.removeFromParent?.();
    },
  };
}
