export function buildExperience(kit) {
  const THREE = kit?.THREE;
  if (!THREE || !kit.sculpt || typeof kit.mesh !== "function") {
    throw new TypeError("photo experience requires the shared Three.js experience kit");
  }

  const sculpt = kit.sculpt;
  const collection = kit.collection || { id: "photo", items: [] };
  const items = Array.isArray(collection.items) ? collection.items.filter(Boolean) : [];
  const group = new THREE.Group();
  group.name = "spectral-folded-darkroom";

  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const ownedTextures = new Set();
  const materialCache = new Map();

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

  const resolveMaterial = (value, fallback, roughness = 0.62, metalness = 0) => {
    if (value && value.isMaterial) return value;
    if (typeof kit.material === "function") return kit.material(value || fallback, roughness, metalness);
    const key = `${value || fallback}:${roughness}:${metalness}`;
    if (!materialCache.has(key)) {
      materialCache.set(
        key,
        ownMaterial(new THREE.MeshStandardMaterial({ color: value || fallback, roughness, metalness })),
      );
    }
    return materialCache.get(key);
  };

  const localMaterial = (options) => ownMaterial(new THREE.MeshStandardMaterial(options));
  const brass = resolveMaterial(kit.brass, 0xa98248, 0.28, 0.76);
  const copper = resolveMaterial(0x98664a, 0x98664a, 0.38, 0.62);
  const stone = resolveMaterial(kit.stone, 0xaaa294, 0.88, 0.02);
  const cream = resolveMaterial(kit.cream, 0xeee7d8, 0.8, 0.01);
  const walnut = resolveMaterial(kit.walnut, 0x5b3f2d, 0.68, 0.02);
  const green = resolveMaterial(kit.green, 0x526b60, 0.56, 0.12);
  const dark = resolveMaterial(kit.dark, 0x1f2927, 0.48, 0.24);
  const ink = localMaterial({ color: 0x161a18, roughness: 0.48, metalness: 0.2 });
  const paper = localMaterial({ color: 0xf2ead8, roughness: 0.92, metalness: 0 });
  const ruby = localMaterial({
    color: 0x7a2634,
    roughness: 0.22,
    metalness: 0.08,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });
  const glass = localMaterial({
    color: 0xb8d1c6,
    roughness: 0.08,
    metalness: 0.02,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const prismGlass = new THREE.MeshPhysicalMaterial({
    color: 0xd9eee5,
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.56,
    transmission: 0.3,
    thickness: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  ownMaterial(prismGlass);
  const proxyMaterial = localMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const beamMaterials = [
    localMaterial({
      color: 0xe5b35c,
      emissive: 0xd08f32,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    localMaterial({
      color: 0x7ec8b5,
      emissive: 0x3e9f8d,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.56,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    localMaterial({
      color: 0xd88a95,
      emissive: 0xbd5263,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  ];

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
    if (node) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
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
      background: null,
      color: options.color || "#6f5733",
      fontSize: options.fontSize || 48,
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
  const state = {
    aperture: 0.46,
    focus: 0.54,
    exposure: 0,
    selected: items.length ? 0 : -1,
    developed: false,
  };
  let activeNow = false;
  let visualAperture = state.aperture;
  let visualFocus = state.focus;
  let development = 0;
  let developing = false;
  let shutterPress = 0;
  let filmKick = 0;
  let printLift = 0;

  const foundation = new THREE.Group();
  foundation.name = "split-stone-instrument-bed";
  group.add(foundation);
  const footData = [
    [-2.65, 0.13, -0.68, -0.17, 0.34],
    [2.34, 0.09, -1.16, 0.22, -0.24],
    [0.62, 0.17, 1.28, -0.08, 0.12],
  ];
  footData.forEach(([x, y, z, rotY, rotZ], index) => {
    const shoe = addRounded(
      1.8 - index * 0.18,
      0.18,
      0.5 + index * 0.08,
      index === 1 ? stone : cream,
      foundation,
      [x, y, z],
      0.07,
    );
    shoe.rotation.y = rotY;
    shoe.rotation.z = rotZ;
    const inlay = addRounded(
      1.42 - index * 0.12,
      0.035,
      0.22,
      index === 2 ? green : walnut,
      foundation,
      [x, y + 0.12, z],
      0.025,
    );
    inlay.rotation.y = rotY;
    inlay.rotation.z = rotZ;
  });

  const footBolts = [];
  footData.forEach(([x, y, z, rotY]) => {
    for (const offset of [-0.56, 0.56]) {
      footBolts.push({
        position: [x + Math.cos(rotY) * offset, y + 0.155, z - Math.sin(rotY) * offset],
        rotation: [Math.PI / 2, 0, 0],
        scale: [0.045, 0.018, 0.045],
      });
    }
  });
  addInstances(new THREE.CylinderGeometry(1, 1, 1, 12), brass, footBolts, foundation);

  const supportPaths = [
    [[-3.25, 0.28, -0.45], [-2.9, 1.1, -0.28], [-1.28, 2.5, 0.05], [-1.18, 4.52, 0.25]],
    [[2.95, 0.24, -0.86], [2.75, 1.25, -0.55], [1.48, 2.7, 0.12], [1.2, 4.55, 0.25]],
    [[0.86, 0.3, 1.54], [1.58, 1.3, 1.22], [1.08, 2.82, 0.58], [0.94, 4.34, 0.3]],
    [[-1.56, 0.26, 0.86], [-2.08, 1.32, 0.95], [-1.3, 2.74, 0.42], [-0.96, 4.36, 0.28]],
  ];
  supportPaths.forEach((points, index) => {
    addTube(points, index % 2 ? 0.035 : 0.052, index === 2 ? copper : brass, foundation, 56, 7);
    const collar = addRing(0.12, 0.025, index === 1 ? dark : brass, foundation, points.at(-1), Math.PI * 2);
    collar.rotation.set(0, 0, 0);
  });
  const supportEndCaps = [];
  supportPaths.forEach((points, index) => {
    supportEndCaps.push({
      position: points[0],
      rotation: [0, 0, 0],
      scale: [0.07, 0.045, 0.07],
    });
    supportEndCaps.push({
      position: points.at(-1),
      rotation: [0, 0, 0],
      scale: [0.055 + index * 0.004, 0.04, 0.055 + index * 0.004],
    });
  });
  supportEndCaps.push(
    { position: [-2.77, 1.15, -0.2], rotation: [0, 0, 0], scale: [0.045, 0.045, 0.045] },
    { position: [2.7, 1.24, -0.5], rotation: [0, 0, 0], scale: [0.045, 0.045, 0.045] },
    { position: [-2.72, 3.86, -0.24], rotation: [0, 0, 0], scale: [0.04, 0.04, 0.04] },
    { position: [2.55, 4.06, -0.14], rotation: [0, 0, 0], scale: [0.04, 0.04, 0.04] },
  );
  addInstances(new THREE.SphereGeometry(1, 12, 8), dark, supportEndCaps, foundation);
  addTube(
    [[-2.77, 1.15, -0.2], [-0.8, 2.08, 0.42], [1.08, 2.12, 0.31], [2.7, 1.24, -0.5]],
    0.022,
    dark,
    foundation,
    70,
    6,
  );
  addTube(
    [[-2.72, 3.86, -0.24], [-1.45, 3.18, -0.75], [0, 2.98, -0.98], [1.62, 3.3, -0.68], [2.55, 4.06, -0.14]],
    0.018,
    copper,
    foundation,
    76,
    6,
  );

  const trussBolts = [];
  for (let index = 0; index < 8; index += 1) {
    const x = -2.8 + index * 0.78;
    trussBolts.push({
      position: [x, 2.12 - Math.abs(x) * 0.03, 0.35],
      rotation: [Math.PI / 2, 0, 0],
      scale: [0.038, 0.018, 0.038],
    });
  }
  addInstances(new THREE.CylinderGeometry(1, 1, 1, 10), brass, trussBolts, foundation);

  const lensRoot = new THREE.Group();
  lensRoot.name = "folded-optical-axis";
  lensRoot.position.set(0.18, 4.58, 0.18);
  group.add(lensRoot);

  const barrelProfile = [
    [0.86, -1.02],
    [1.04, -0.96],
    [1.13, -0.72],
    [1.18, -0.18],
    [1.16, 0.43],
    [1.08, 0.78],
    [0.9, 0.94],
    [0.84, 1.02],
  ];
  const barrel = add(
    new THREE.LatheGeometry(barrelProfile.map(([radius, y]) => new THREE.Vector2(radius, y)), 72),
    dark,
    0,
    0,
    0,
    lensRoot,
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.material = dark;

  const barrelInset = add(
    new THREE.LatheGeometry(
      [
        [0.77, -0.92],
        [0.9, -0.82],
        [0.94, -0.12],
        [0.89, 0.63],
        [0.76, 0.82],
      ].map(([radius, y]) => new THREE.Vector2(radius, y)),
      64,
    ),
    green,
    0,
    0,
    0,
    lensRoot,
  );
  barrelInset.rotation.x = Math.PI / 2;

  const rearCap = add(new THREE.CylinderGeometry(0.87, 0.87, 0.08, 56), dark, 0, 0, -1.05, lensRoot);
  rearCap.rotation.x = Math.PI / 2;
  const rearRing = addRing(1.16, 0.075, brass, lensRoot, [0, 0, -1.0]);
  const frontRing = addRing(1.24, 0.09, brass, lensRoot, [0, 0, 1.04]);
  rearRing.castShadow = frontRing.castShadow = true;

  const focusSleeve = new THREE.Group();
  focusSleeve.name = "focused-lens-sleeve";
  focusSleeve.position.z = -0.33;
  lensRoot.add(focusSleeve);
  const sleeveBody = add(
    new THREE.CylinderGeometry(1.18, 1.18, 0.52, 64, 1, true),
    walnut,
    0,
    0,
    0,
    focusSleeve,
  );
  sleeveBody.rotation.x = Math.PI / 2;
  const focusRing = addRing(1.22, 0.13, walnut, focusSleeve, [0, 0, 0]);
  addRing(1.24, 0.045, brass, focusSleeve, [0, 0, -0.27]);
  addRing(1.24, 0.045, brass, focusSleeve, [0, 0, 0.27]);
  focusRing.castShadow = true;
  for (let index = 0; index < 18; index += 1) {
    const notch = addRounded(0.25, 0.024, 0.055, brass, focusSleeve, [0, 0, 0], 0.008);
    const angle = (index / 18) * Math.PI * 2;
    notch.position.set(Math.cos(angle) * 1.15, Math.sin(angle) * 1.15, 0.055);
    notch.rotation.z = angle;
  }
  const focusMarkRotor = new THREE.Group();
  focusMarkRotor.name = "focus-rotating-scale";
  focusSleeve.add(focusMarkRotor);
  addRing(1.19, 0.028, brass, focusMarkRotor, [0, 0, 0.302]);
  const focusIndexMark = addRounded(0.12, 0.34, 0.045, cream, focusMarkRotor, [0, 1.12, 0.318], 0.018);
  focusIndexMark.rotation.z = 0.06;
  addRounded(0.065, 0.24, 0.035, brass, focusSleeve, [0, 1.215, 0.324], 0.012);
  const focusControl = new THREE.Group();
  focusControl.name = "focus-eccentric-grip";
  focusControl.position.set(-1.48, 0.16, 1.93);
  focusControl.rotation.z = -0.12;
  focusSleeve.add(focusControl);
  addRounded(0.38, 0.24, 0.2, brass, focusControl, [0, 0, 0], 0.055);
  addRounded(0.12, 0.34, 0.15, dark, focusControl, [0, 0, 0.08], 0.028);
  addRounded(0.26, 0.09, 0.1, cream, focusControl, [-0.06, 0, 0.17], 0.02);
  addText("F", 0.12, 0.06, focusControl, [-0.06, 0, 0.226], null, {
    fontSize: 34,
    color: "#51442d",
    serif: false,
  });
  addTube(
    [
      [-1.06, 0.12, 0.27],
      [-1.44, 0.16, 1.02],
      [-1.48, 0.16, 1.9],
    ],
    0.045,
    dark,
    focusSleeve,
    38,
    7,
  );
  addRing(0.085, 0.022, brass, focusSleeve, [-1.44, 0.16, 1.02]);
  addRing(0.105, 0.025, dark, focusSleeve, [-1.46, 0.16, 1.48]);
  add(new THREE.SphereGeometry(0.075, 12, 8), brass, -1.48, 0.16, 1.9, focusSleeve);

  const hoodBody = add(
    new THREE.CylinderGeometry(1.35, 1.08, 0.42, 64, 1, true),
    dark,
    0,
    0,
    1.25,
    lensRoot,
  );
  hoodBody.rotation.x = Math.PI / 2;
  addRing(1.34, 0.055, brass, lensRoot, [0, 0, 1.04]);
  addRing(1.36, 0.045, dark, lensRoot, [0, 0, 1.44]);
  addRing(0.92, 0.022, copper, lensRoot, [0, 0, 1.09]);

  const lensA = new THREE.Group();
  const lensB = new THREE.Group();
  lensA.position.set(0, 0, -0.47);
  lensB.position.set(0, 0, 0.34);
  lensRoot.add(lensA, lensB);
  const lensProfileA = [
    [0, -0.18],
    [0.4, -0.15],
    [0.68, -0.075],
    [0.77, 0],
    [0.58, 0.075],
    [0, 0.1],
  ];
  const lensProfileB = [
    [0, -0.12],
    [0.5, -0.08],
    [0.74, -0.02],
    [0.7, 0.09],
    [0.35, 0.17],
    [0, 0.18],
  ];
  [
    [lensA, lensProfileA, 0.86, glass],
    [lensB, lensProfileB, 0.78, prismGlass],
  ].forEach(([parent, profile, scale, material]) => {
    const lens = add(
      new THREE.LatheGeometry(profile.map(([radius, y]) => new THREE.Vector2(radius, y)), 64),
      material,
      0,
      0,
      0,
      parent,
    );
    lens.rotation.x = Math.PI / 2;
    lens.scale.setScalar(scale);
    addRing(0.74, 0.035, brass, parent, [0, 0, -0.08]);
    addRing(0.65, 0.018, copper, parent, [0, 0, 0.08]);
  });
  addRing(0.84, 0.028, dark, lensRoot, [0, 0, -0.7]);
  addRing(0.84, 0.028, dark, lensRoot, [0, 0, -0.24]);
  addRing(0.81, 0.025, dark, lensRoot, [0, 0, 0.18]);
  addRing(0.81, 0.025, dark, lensRoot, [0, 0, 0.52]);

  const frontOptic = add(
    new THREE.LatheGeometry(
      [
        [0, -0.11],
        [0.45, -0.08],
        [0.7, -0.015],
        [0.72, 0.05],
        [0.36, 0.13],
        [0, 0.15],
      ].map(([radius, y]) => new THREE.Vector2(radius, y)),
      64,
    ),
    prismGlass,
    0,
    0,
    1.2,
    lensRoot,
  );
  frontOptic.rotation.x = Math.PI / 2;
  addRing(0.74, 0.022, brass, lensRoot, [0, 0, 1.18]);

  const irisRoot = new THREE.Group();
  irisRoot.name = "twelve-blade-iris";
  irisRoot.position.z = 0.82;
  lensRoot.add(irisRoot);
  const irisBack = addRing(0.79, 0.1, ink, irisRoot, [0, 0, -0.035]);
  irisBack.castShadow = true;
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0.1, -0.11);
  bladeShape.quadraticCurveTo(0.53, 0.02, 0.99, 0.055);
  bladeShape.lineTo(0.91, 0.235);
  bladeShape.quadraticCurveTo(0.48, 0.27, 0.055, 0.12);
  bladeShape.quadraticCurveTo(0.02, 0.02, 0.1, -0.11);
  const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.008,
    bevelThickness: 0.004,
    curveSegments: 8,
  });
  bladeGeometry.center();
  ownGeometry(bladeGeometry);
  const bladeMaterial = localMaterial({ color: 0x353e3b, roughness: 0.32, metalness: 0.58 });
  const blades = [];
  for (let index = 0; index < 12; index += 1) {
    const blade = add(bladeGeometry, bladeMaterial, 0, 0, 0.025, irisRoot);
    blade.userData.angle = (index / 12) * Math.PI * 2;
    blades.push(blade);
  }
  const irisPins = [];
  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2;
    irisPins.push({
      position: [Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 0.055],
      rotation: [Math.PI / 2, 0, 0],
      scale: [0.026, 0.018, 0.026],
    });
  }
  addInstances(new THREE.CylinderGeometry(1, 1, 1, 8), brass, irisPins, irisRoot);
  const apertureGear = addGear(0.96, 0.07, 26, brass, irisRoot, [0, 0, 0.088]);
  apertureGear.rotation.z = 0.08;

  const focusProxy = add(new THREE.BoxGeometry(0.58, 0.44, 0.34), proxyMaterial, 0, 0, 0.05, focusControl);
  const apertureGrip = new THREE.Group();
  apertureGrip.name = "aperture-control-ring";
  apertureGrip.position.z = 0.82;
  lensRoot.add(apertureGrip);
  addRing(1.1, 0.07, dark, apertureGrip, [0, 0, 0]);
  addRing(1.04, 0.025, brass, apertureGrip, [0, 0, 0.055]);
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const grip = addRounded(0.18, 0.035, 0.075, brass, apertureGrip, [0, 0, 0.055], 0.008);
    grip.position.set(Math.cos(angle) * 1.08, Math.sin(angle) * 1.08, 0.055);
    grip.rotation.z = angle;
  }
  const apertureNeedle = addRounded(0.24, 0.045, 0.035, cream, apertureGrip, [0, 1.02, 0.085], 0.012);
  apertureNeedle.rotation.z = 0.12;
  const apertureControl = new THREE.Group();
  apertureControl.name = "aperture-eccentric-grip";
  apertureControl.position.set(1.48, -0.1, 0.98);
  apertureControl.rotation.z = 0.1;
  apertureGrip.add(apertureControl);
  addRounded(0.42, 0.22, 0.2, brass, apertureControl, [0, 0, 0], 0.055);
  addRounded(0.14, 0.32, 0.14, ink, apertureControl, [0.02, 0, 0.08], 0.03);
  addRounded(0.25, 0.08, 0.1, cream, apertureControl, [0.08, 0, 0.16], 0.018);
  addText("ƒ", 0.12, 0.065, apertureControl, [0.08, 0, 0.216], null, {
    fontSize: 34,
    color: "#51442d",
    serif: true,
  });
  addTube(
    [
      [1.02, -0.03, 0.08],
      [1.46, -0.08, 0.42],
      [1.48, -0.1, 0.95],
    ],
    0.042,
    dark,
    apertureGrip,
    32,
    7,
  );
  addRing(0.08, 0.02, brass, apertureGrip, [1.46, -0.08, 0.42]);
  addRing(0.1, 0.024, dark, apertureGrip, [1.47, -0.09, 0.69]);
  add(new THREE.SphereGeometry(0.072, 12, 8), brass, 1.48, -0.1, 0.95, apertureGrip);
  const apertureProxy = add(new THREE.BoxGeometry(0.62, 0.42, 0.34), proxyMaterial, 0, 0, 0.04, apertureControl);

  for (let index = 0; index < 3; index += 1) {
    const angle = Math.PI * 0.16 + index * (Math.PI * 2 / 3);
    addTube(
      [
        [Math.cos(angle) * 1.03, Math.sin(angle) * 1.03, -0.9],
        [Math.cos(angle) * 1.08, Math.sin(angle) * 1.08, 0],
        [Math.cos(angle) * 1.03, Math.sin(angle) * 1.03, 0.92],
      ],
      0.025,
      brass,
      lensRoot,
      36,
      6,
    );
  }
  const collarBearings = [];
  for (let ring = 0; ring < 3; ring += 1) {
    for (let index = 0; index < 10; index += 1) {
      const angle = (index / 10) * Math.PI * 2 + ring * 0.17;
      collarBearings.push({
        position: [Math.cos(angle) * 1.17, Math.sin(angle) * 1.17, -0.66 + ring * 0.7],
        rotation: [Math.PI / 2, 0, 0],
        scale: [0.035, 0.026, 0.035],
      });
    }
  }
  addInstances(new THREE.CylinderGeometry(1, 1, 1, 10), copper, collarBearings, lensRoot);

  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2 + 0.2;
    addText(
      index % 2 ? `${8 + index * 2}` : `f/${[16, 11, 8, 5.6][index % 4]}`,
      0.18,
      0.06,
      lensRoot,
      [Math.cos(angle) * 1.3, Math.sin(angle) * 1.3, 0.94],
      [0, 0, angle - Math.PI / 2],
      { fontSize: 34, color: "#c8a86d" },
    );
  }

  const focusLines = [];
  for (let index = 0; index < 32; index += 1) {
    const angle = (index / 32) * Math.PI * 2;
    focusLines.push({
      position: [Math.cos(angle) * 1.17, Math.sin(angle) * 1.17, 0.285],
      rotation: [0, 0, angle - Math.PI / 2],
      scale: [index % 4 === 0 ? 0.23 : 0.12, 0.018, 0.021],
    });
  }
  addInstances(new THREE.BoxGeometry(1, 1, 1), cream, focusLines, focusMarkRotor);

  const prismAssembly = new THREE.Group();
  prismAssembly.name = "three-channel-prism";
  prismAssembly.position.set(-2.25, 4.36, 0.18);
  prismAssembly.rotation.set(-0.18, -0.25, 0.14);
  group.add(prismAssembly);

  const prismGeometry = new THREE.BufferGeometry();
  prismGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -0.72, -0.62, -0.48,
        0.72, -0.62, -0.48,
        0, 0.78, -0.48,
        -0.72, -0.62, 0.48,
        0.72, -0.62, 0.48,
        0, 0.78, 0.48,
      ],
      3,
    ),
  );
  prismGeometry.setIndex([
    0, 1, 2,
    5, 4, 3,
    0, 3, 4, 0, 4, 1,
    1, 4, 5, 1, 5, 2,
    2, 5, 3, 2, 3, 0,
  ]);
  prismGeometry.computeVertexNormals();
  ownGeometry(prismGeometry);
  const prism = add(prismGeometry, prismGlass, 0, 0, 0, prismAssembly);
  prism.castShadow = true;
  const prismEdges = new THREE.EdgesGeometry(prismGeometry, 8);
  ownGeometry(prismEdges);
  const prismEdge = new THREE.LineSegments(prismEdges, new THREE.LineBasicMaterial({ color: 0xe0b46b }));
  ownMaterial(prismEdge.material);
  prismAssembly.add(prismEdge);

  const prismCage = new THREE.Group();
  prismCage.position.z = 0.02;
  prismAssembly.add(prismCage);
  for (let index = 0; index < 3; index += 1) {
    const angle = (index / 3) * Math.PI * 2 + Math.PI / 2;
    addTube(
      [
        [Math.cos(angle) * 0.83, Math.sin(angle) * 0.83, -0.58],
        [Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 0],
        [Math.cos(angle) * 0.83, Math.sin(angle) * 0.83, 0.58],
      ],
      0.018,
      brass,
      prismCage,
      30,
      6,
    );
  }
  addRing(0.89, 0.025, copper, prismCage, [0, -0.57, 0]);
  addRing(0.89, 0.025, copper, prismCage, [0, 0.57, 0]);

  const beamPaths = [
    [[-3.82, 3.9, -0.34], [-2.85, 4.16, -0.06], [-2.12, 4.45, 0.22], [-0.86, 4.53, 0.28]],
    [[-2.46, 4.08, 0.38], [-1.75, 3.46, 1.0], [0.18, 3.08, 1.26], [2.02, 2.92, 1.18]],
    [[-2.08, 4.24, 0.42], [-1.2, 4.5, 0.78], [0.54, 4.43, 0.9], [2.34, 3.86, 0.84]],
  ];
  const beams = beamPaths.map((points, index) =>
    addTube(points, index === 1 ? 0.045 : 0.028, beamMaterials[index], group, 64, 6),
  );
  const beamExit = add(
    new THREE.CylinderGeometry(0.22, 0.52, 2.36, 18, 1, true),
    beamMaterials[0],
    0.18,
    4.58,
    1.72,
    group,
  );
  beamExit.rotation.x = Math.PI / 2;

  const filmAssembly = new THREE.Group();
  filmAssembly.name = "short-film-cassette";
  filmAssembly.position.set(-2.34, 2.12, 1.38);
  filmAssembly.rotation.set(-0.12, 0.2, 0.015);
  group.add(filmAssembly);
  addRounded(2.14, 1.22, 0.46, dark, filmAssembly, [0, 0.02, 0], 0.08);
  addRounded(2.2, 0.13, 0.5, brass, filmAssembly, [0, 0.58, 0], 0.035);
  addRounded(2.2, 0.11, 0.5, walnut, filmAssembly, [0, -0.52, 0], 0.03);
  addRounded(1.55, 0.76, 0.08, ink, filmAssembly, [0, 0.06, 0.255], 0.045);
  addRounded(1.38, 0.58, 0.035, paper, filmAssembly, [0, 0.07, 0.305], 0.025);
  const guideRollers = [];
  for (const x of [-0.81, 0.81]) {
    const roller = new THREE.Group();
    roller.position.set(x, -0.18, 0.25);
    filmAssembly.add(roller);
    addRing(0.2, 0.035, x < 0 ? brass : copper, roller, [0, 0, 0]);
    addRing(0.055, 0.018, dark, roller, [0, 0, 0.015]);
    for (let tooth = 0; tooth < 8; tooth += 1) {
      const angle = (tooth / 8) * Math.PI * 2;
      const lug = addRounded(0.055, 0.02, 0.04, brass, roller, [0, 0, 0.025], 0.006);
      lug.position.set(Math.cos(angle) * 0.21, Math.sin(angle) * 0.21, 0.025);
      lug.rotation.z = angle;
    }
    guideRollers.push(roller);
  }

  const filmCarriage = new THREE.Group();
  filmCarriage.name = "moving-film-gate";
  filmAssembly.add(filmCarriage);
  const carriageBody = addRounded(1.42, 0.72, 0.28, dark, filmCarriage, [0, 0.07, 0.12], 0.05);
  carriageBody.castShadow = true;
  addRounded(1.24, 0.58, 0.05, ink, filmCarriage, [0, 0.08, 0.285], 0.025);
  const filmPreviewMaterial = ownMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  const filmPreview = addGeometryPlane(0.92, 0.5, filmPreviewMaterial, [0, 0.08, 0.318], filmCarriage);
  const filmGateCorners = [];
  for (const x of [-0.54, 0.54]) {
    for (const y of [-0.22, 0.38]) {
      filmGateCorners.push({
        position: [x, y, 0.33],
        rotation: [0, 0, 0],
        scale: [0.1, 0.035, 0.026],
      });
    }
  }
  addInstances(new THREE.BoxGeometry(1, 1, 1), brass, filmGateCorners, filmCarriage);
  const filmPerforations = [];
  for (let row = 0; row < 2; row += 1) {
    for (let index = 0; index < 7; index += 1) {
      filmPerforations.push({
        position: [-0.63 + index * 0.21, row ? 0.48 : -0.32, 0.31],
        rotation: [0, 0, 0],
        scale: [0.065, 0.035, 0.018],
      });
    }
  }
  addInstances(new THREE.BoxGeometry(1, 1, 1), ink, filmPerforations, filmCarriage);
  const filmGrip = new THREE.Group();
  filmGrip.position.set(0, -0.57, 0.32);
  filmCarriage.add(filmGrip);
  addRounded(0.76, 0.16, 0.16, walnut, filmGrip, [0, 0, 0], 0.055);
  for (const x of [-0.25, 0, 0.25]) {
    addRounded(0.045, 0.08, 0.025, brass, filmGrip, [x, 0, 0.09], 0.008);
  }
  const filmProxy = add(new THREE.BoxGeometry(1.05, 0.36, 0.34), proxyMaterial, 0, 0, 0.02, filmGrip);

  const filmReadoutCanvas = document.createElement("canvas");
  filmReadoutCanvas.width = 320;
  filmReadoutCanvas.height = 96;
  const filmReadoutContext = filmReadoutCanvas.getContext("2d");
  const filmReadoutTexture = ownTexture(new THREE.CanvasTexture(filmReadoutCanvas));
  filmReadoutTexture.colorSpace = THREE.SRGBColorSpace;
  const filmReadoutMaterial = ownMaterial(
    new THREE.MeshBasicMaterial({
      map: filmReadoutTexture,
      transparent: true,
      toneMapped: false,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  addGeometryPlane(0.62, 0.18, filmReadoutMaterial, [0, 0.48, 0.306], filmAssembly);

  const printAssembly = new THREE.Group();
  printAssembly.name = "developing-print-paper";
  printAssembly.position.set(2.3, 2.24, 1.36);
  printAssembly.rotation.set(-0.035, -0.32, -0.025);
  group.add(printAssembly);

  const printRack = new THREE.Group();
  printRack.position.y = 0.1;
  printAssembly.add(printRack);
  addRounded(1.96, 0.08, 0.1, walnut, printRack, [0, 0.18, -0.16], 0.025);
  addRounded(1.9, 0.055, 0.08, dark, printRack, [0, -1.68, -0.14], 0.018);
  for (const side of [-1, 1]) {
    addRounded(0.055, 1.9, 0.08, walnut, printRack, [side * 0.98, -0.75, -0.16], 0.018);
    addRing(0.045, 0.014, brass, printRack, [side * 0.98, 0.18, -0.1]);
    addRing(0.045, 0.014, brass, printRack, [side * 0.98, -1.68, -0.1]);
  }

  const printPaperRoot = new THREE.Group();
  printPaperRoot.position.set(0, -0.02, 0.02);
  printAssembly.add(printPaperRoot);
  addRounded(1.98, 1.58, 0.055, cream, printPaperRoot, [0, -0.77, -0.04], 0.035);

  const photoShader = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: null },
      uFocus: { value: state.focus },
      uAperture: { value: state.aperture },
      uDevelop: { value: 0 },
      uExposure: { value: 0 },
      uHasMap: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uFocus;
      uniform float uAperture;
      uniform float uDevelop;
      uniform float uExposure;
      uniform float uHasMap;
      varying vec2 vUv;

      vec3 sampleSoft(vec2 uv, float radius) {
        vec2 px = vec2(radius, radius * 0.82);
        vec3 color = texture2D(uMap, uv).rgb * 0.2;
        color += texture2D(uMap, uv + vec2(px.x, 0.0)).rgb * 0.11;
        color += texture2D(uMap, uv - vec2(px.x, 0.0)).rgb * 0.11;
        color += texture2D(uMap, uv + vec2(0.0, px.y)).rgb * 0.11;
        color += texture2D(uMap, uv - vec2(0.0, px.y)).rgb * 0.11;
        color += texture2D(uMap, uv + px).rgb * 0.09;
        color += texture2D(uMap, uv - px).rgb * 0.09;
        color += texture2D(uMap, uv + vec2(px.x, -px.y)).rgb * 0.09;
        color += texture2D(uMap, uv + vec2(-px.x, px.y)).rgb * 0.09;
        return color;
      }

      void main() {
        vec2 uv = vUv;
        float blurRadius = mix(0.024, 0.0012, smoothstep(0.0, 1.0, uFocus));
        blurRadius *= mix(1.28, 0.7, uAperture);
        vec3 soft = uHasMap > 0.5 ? sampleSoft(uv, blurRadius) : vec3(0.48, 0.53, 0.48);
        vec3 sharp = uHasMap > 0.5 ? texture2D(uMap, uv).rgb : vec3(0.48, 0.53, 0.48);
        vec3 image = mix(soft, sharp, smoothstep(0.32, 0.96, uFocus));
        float luma = dot(image, vec3(0.299, 0.587, 0.114));
        image = mix(vec3(luma), image, mix(0.66, 1.16, uExposure));
        image = pow(max(image, vec3(0.0)), vec3(mix(1.18, 0.92, uExposure)));
        float vignette = 1.0 - smoothstep(0.24, 0.93, length((uv - 0.5) * vec2(1.12, 0.9)));
        image *= mix(0.58, 1.05, vignette) * mix(0.92, 1.22, uAperture);
        image = mix(image, image * vec3(1.08, 0.94, 0.78), 0.12);

        float wash = uDevelop * 1.34 - uv.y * 0.3 - (1.0 - uv.x) * 0.08;
        float reveal = smoothstep(0.0, 0.91, wash);
        float tide = smoothstep(0.0, 0.11, wash) - smoothstep(0.08, 0.2, wash);
        vec3 paperTone = vec3(0.82, 0.77, 0.64);
        paperTone *= 0.94 + 0.06 * sin((uv.x + uv.y) * 32.0 + uDevelop * 17.0);
        vec3 chemicalEdge = vec3(0.47, 0.22, 0.1);
        vec3 color = mix(paperTone, image, reveal);
        color = mix(color, chemicalEdge, tide * 0.24 * (1.0 - reveal));

        float border = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
        color *= mix(0.7, 1.0, smoothstep(0.0, 0.035, border));
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
  });
  ownMaterial(photoShader);
  const printSurface = addGeometryPlane(1.56, 1.16, photoShader, [0, -0.72, 0.025], printPaperRoot);
  addRing(0.035, 0.011, brass, printPaperRoot, [-0.84, 0.02, 0.04]);
  addRing(0.035, 0.011, brass, printPaperRoot, [0.84, 0.02, 0.04]);
  addRing(0.035, 0.011, brass, printPaperRoot, [-0.84, -1.48, 0.04]);
  addRing(0.035, 0.011, brass, printPaperRoot, [0.84, -1.48, 0.04]);

  const captionCanvas = document.createElement("canvas");
  captionCanvas.width = 1024;
  captionCanvas.height = 220;
  const captionContext = captionCanvas.getContext("2d");
  const captionTexture = ownTexture(new THREE.CanvasTexture(captionCanvas));
  captionTexture.colorSpace = THREE.SRGBColorSpace;
  const captionMaterial = ownMaterial(
    new THREE.MeshBasicMaterial({
      map: captionTexture,
      transparent: true,
      toneMapped: false,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  addGeometryPlane(1.42, 0.31, captionMaterial, [0, -1.64, 0.055], printPaperRoot);

  const chemistryRollers = [];
  for (const side of [-1, 1]) {
    for (let index = 0; index < 3; index += 1) {
      const roller = new THREE.Group();
      roller.position.set(side * (1.05 + index * 0.045), -1.66 - index * 0.07, 0.14);
      printAssembly.add(roller);
      addRing(0.13 - index * 0.018, 0.025, index === 1 ? copper : brass, roller, [0, 0, 0]);
      addRing(0.035, 0.01, dark, roller, [0, 0, 0.012]);
      chemistryRollers.push(roller);
    }
  }

  const shutterAssembly = new THREE.Group();
  shutterAssembly.name = "physical-shutter";
  shutterAssembly.position.set(1.88, 3.18, 1.28);
  shutterAssembly.rotation.z = -0.16;
  group.add(shutterAssembly);
  const shutterControl = new THREE.Group();
  shutterControl.name = "shutter-button-handle";
  shutterAssembly.add(shutterControl);
  addRing(0.42, 0.1, dark, shutterControl, [0, 0, 0]);
  addRing(0.34, 0.045, brass, shutterControl, [0, 0, 0.035]);
  const shutterButton = add(
    new THREE.CylinderGeometry(0.22, 0.25, 0.18, 24),
    ruby,
    0,
    0,
    0.08,
    shutterControl,
  );
  shutterButton.rotation.x = Math.PI / 2;
  const shutterProxy = add(new THREE.CylinderGeometry(0.46, 0.46, 0.3, 24), proxyMaterial, 0, 0, 0.08, shutterControl);
  shutterProxy.rotation.x = Math.PI / 2;
  addTube(
    [
      [0.2, -0.15, -0.08],
      [0.52, -0.42, -0.18],
      [0.88, -0.42, -0.22],
      [1.02, -0.18, -0.18],
    ],
    0.035,
    copper,
    shutterAssembly,
    36,
    7,
  );
  const shutterLeverStart = add(new THREE.SphereGeometry(0.06, 12, 8), dark, 0.2, -0.15, -0.08, shutterAssembly);
  const shutterLeverEnd = add(new THREE.SphereGeometry(0.07, 12, 8), brass, 1.02, -0.18, -0.18, shutterAssembly);
  shutterLeverStart.castShadow = shutterLeverEnd.castShadow = true;
  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2;
    addText(
      index % 2 ? "I" : "·",
      0.1,
      0.045,
      shutterAssembly,
      [Math.cos(angle) * 0.48, Math.sin(angle) * 0.48, 0.055],
      [0, 0, angle - Math.PI / 2],
      { fontSize: 30, color: "#d8bd84" },
    );
  }
  const shutterCountCanvas = document.createElement("canvas");
  shutterCountCanvas.width = 320;
  shutterCountCanvas.height = 80;
  const shutterCountContext = shutterCountCanvas.getContext("2d");
  const shutterCountTexture = ownTexture(new THREE.CanvasTexture(shutterCountCanvas));
  shutterCountTexture.colorSpace = THREE.SRGBColorSpace;
  const shutterCountMaterial = ownMaterial(
    new THREE.MeshBasicMaterial({
      map: shutterCountTexture,
      transparent: true,
      toneMapped: false,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  addGeometryPlane(0.62, 0.15, shutterCountMaterial, [0, 0.66, 0.045], shutterAssembly);

  const apertureLamp = new THREE.PointLight(0xe5b15b, 1.1, 6.5, 2);
  apertureLamp.position.set(0.2, 4.4, 1.7);
  group.add(apertureLamp);
  const prismLamp = new THREE.PointLight(0x7ec9b7, 0.85, 4.2, 2);
  prismLamp.position.set(-2.2, 4.1, 0.65);
  group.add(prismLamp);
  const lampCoreMaterial = localMaterial({
    color: 0xffe0a1,
    emissive: 0xf1b65d,
    emissiveIntensity: 1.6,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const lampCore = add(new THREE.SphereGeometry(0.1, 18, 12), lampCoreMaterial, 0.18, 4.58, 1.62, group);

  function addGeometryPlane(width, height, material, position, parent) {
    const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
    return add(geometry, material, ...position, parent);
  }

  function fNumber(aperture) {
    const value = 1.4 * Math.pow(16 / 1.4, clamp(aperture, 0, 1));
    return value >= 10 ? value.toFixed(0) : value >= 4 ? value.toFixed(1) : value.toFixed(1);
  }

  function fallbackMap() {
    const texture = new THREE.DataTexture(new Uint8Array([210, 200, 176, 255]), 1, 1, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return ownTexture(texture);
  }
  const emptyMap = fallbackMap();

  function photoURL(item) {
    return item && (item.fullImage || item.image || item.original || "");
  }

  function redrawCaption(item) {
    const width = captionCanvas.width;
    const height = captionCanvas.height;
    captionContext.clearRect(0, 0, width, height);
    captionContext.fillStyle = "rgba(243,236,220,0.95)";
    captionContext.fillRect(0, 0, width, height);
    captionContext.fillStyle = "#6d5130";
    captionContext.font = '600 34px "Space Grotesk", Arial, sans-serif';
    captionContext.textAlign = "left";
    captionContext.fillText(`FRAME ${item?.number || "—"} / ${item?.act || collection.title || "PHOTOGRAPHY"}`, 42, 62);
    captionContext.fillStyle = "#27312d";
    captionContext.font = '500 56px Georgia, "Songti SC", "Microsoft YaHei", serif';
    captionContext.fillText(String(item?.title || "等待一张胶片"), 42, 142, width - 84);
    captionContext.fillStyle = "#7d715f";
    captionContext.font = '400 25px "Space Grotesk", Arial, sans-serif';
    captionContext.textAlign = "right";
    captionContext.fillText(String(item?.meta || "THE COLLECTION"), width - 42, 195);
    captionTexture.needsUpdate = true;
  }

  function redrawFilmReadout(item) {
    const width = filmReadoutCanvas.width;
    const height = filmReadoutCanvas.height;
    filmReadoutContext.clearRect(0, 0, width, height);
    filmReadoutContext.fillStyle = "rgba(28,32,30,0.92)";
    filmReadoutContext.fillRect(0, 0, width, height);
    filmReadoutContext.fillStyle = "#e8cf9a";
    filmReadoutContext.font = '600 34px "Space Grotesk", Arial, sans-serif';
    filmReadoutContext.textAlign = "left";
    filmReadoutContext.fillText("FRAME", 22, 58);
    filmReadoutContext.textAlign = "right";
    filmReadoutContext.font = '600 42px "Space Grotesk", Arial, sans-serif';
    filmReadoutContext.fillText(item?.number || "—", width - 22, 62);
    filmReadoutTexture.needsUpdate = true;
  }

  function redrawShutterReadout() {
    const width = shutterCountCanvas.width;
    const height = shutterCountCanvas.height;
    shutterCountContext.clearRect(0, 0, width, height);
    shutterCountContext.fillStyle = "rgba(31,34,32,0.9)";
    shutterCountContext.fillRect(0, 0, width, height);
    shutterCountContext.fillStyle = "#d9c38e";
    shutterCountContext.font = '600 30px "Space Grotesk", Arial, sans-serif';
    shutterCountContext.textAlign = "left";
    shutterCountContext.fillText("EXPOSURE", 18, 49);
    shutterCountContext.textAlign = "right";
    shutterCountContext.fillText(String(state.exposure).padStart(2, "0"), width - 18, 50);
    shutterCountTexture.needsUpdate = true;
  }

  function setPhotoTexture(item) {
    const url = photoURL(item);
    let texture = emptyMap;
    if (url && typeof kit.texture === "function") {
      try {
        texture = kit.texture(url) || emptyMap;
      } catch {
        texture = emptyMap;
      }
    }
    filmPreviewMaterial.map = texture;
    filmPreviewMaterial.needsUpdate = true;
    photoShader.uniforms.uMap.value = texture;
    photoShader.uniforms.uHasMap.value = texture === emptyMap ? 0 : 1;
    redrawCaption(item);
    redrawFilmReadout(item);
  }

  function resetDevelopment(message = false) {
    development = 0;
    developing = false;
    state.developed = false;
    printLift = 0;
    photoShader.uniforms.uDevelop.value = 0;
    printPaperRoot.scale.set(1, 0.17, 1);
    if (message) status("换了胶片，印相纸卷回暗盒，等待新的曝光。");
  }

  function setSelected(index, announce = true) {
    if (!items.length) {
      state.selected = -1;
      return -1;
    }
    const next = ((Number(index) || 0) % items.length + items.length) % items.length;
    const changed = next !== state.selected;
    state.selected = next;
    const item = items[next];
    setPhotoTexture(item);
    if (changed) {
      resetDevelopment(announce);
      filmKick = state.selected % 2 ? 1 : -1;
    }
    if (announce) status(`胶片已推到第 ${item?.number || next + 1} 帧 · ${item?.title || "未题名"}`);
    invalidate();
    return next;
  }

  function beginExposure() {
    if (!items.length) {
      status("胶片轨还是空的，先选一张真实照片。");
      return false;
    }
    state.exposure += 1;
    redrawShutterReadout();
    developing = true;
    state.developed = false;
    development = 0;
    shutterPress = 1;
    status(
      `第 ${state.exposure} 次快门 · f/${fNumber(state.aperture)} · 焦段 ${Math.round(state.focus * 100)} · 正在显影`,
    );
    invalidate();
    return true;
  }

  function clickPrint() {
    if (!state.developed || !items.length || state.selected < 0) {
      status(
        developing
          ? "照片仍在药液里，等它从纸面浮现。"
          : "这张纸还没有显影，按下实体快门再试。",
      );
      return;
    }
    const item = items[state.selected];
    if (typeof kit.onSelect === "function") kit.onSelect("photo", state.selected);
    else if (typeof kit.onItemSelect === "function") kit.onItemSelect(item);
  }

  register(focusControl, {
    id: "photo-focus",
    label: "焦距握柄",
    hint: "左右拖动左前握柄，镜筒沿限位槽前后伸缩，照片由模糊到清晰",
    anchor: [0, 0, 0.2],
    onDrag({ dx, dy }) {
      state.focus = clamp(state.focus + (dx - dy * 0.45) * 0.0042, 0, 1);
      invalidate();
    },
    onUp() {
      status(`焦距 ${Math.round(state.focus * 100)}% · ${state.focus > 0.82 ? "焦点已落定" : "画面仍在弥散"}`);
    },
  });

  register(apertureControl, {
    id: "photo-aperture",
    label: "光圈握柄",
    hint: "左右拖动右前握柄，十二片光圈连续开合，光束宽度同步改变",
    anchor: [0, 0, 0.2],
    onDrag({ dx, dy }) {
      state.aperture = clamp(state.aperture + (dx - dy * 0.3) * 0.004, 0, 1);
      invalidate();
    },
    onUp() {
      status(`光圈 f/${fNumber(state.aperture)} · 十二片叶片已咬合`);
    },
  });

  register(filmGrip, {
    id: "photo-film-rail",
    label: "胶片短槽抓手",
    hint: "横向拖动短槽前方抓手，胶片在短槽内逐帧换片",
    anchor: [0, 0, 0.02],
    onDrag({ dx }) {
      if (!items.length) return;
      filmKick += dx * 0.035;
      if (Math.abs(filmKick) > items.length && Math.abs(dx) < 1) filmKick = Math.sign(filmKick) * 1.2;
      if (Math.abs(filmKick) >= 1.05) {
        const steps = Math.trunc(filmKick);
        setSelected(state.selected + steps, false);
        filmKick -= steps;
        const item = items[state.selected];
        status(`胶片第 ${item?.number || state.selected + 1} 帧 · ${item?.title || "未题名"}`);
      }
      invalidate();
    },
    onUp() {
      filmKick = 0;
      if (items[state.selected]) {
        status(`已装载第 ${items[state.selected].number || state.selected + 1} 帧，按下快门开始显影。`);
      }
    },
  });

  register(shutterControl, {
    id: "photo-shutter",
    label: "实体快门按钮",
    hint: "按下红色快门，底片与印相纸展开，照片在场景中显影",
    anchor: [0, 0, 0.08],
    onDown() {
      shutterPress = Math.max(shutterPress, 0.72);
      invalidate();
    },
    onUp() {
      shutterPress = 0;
    },
    onClick() {
      beginExposure();
    },
  });

  register(printSurface, {
    id: "photo-developed-print",
    label: "已显影印相纸",
    hint: "只有显影完成的照片可以打开详情",
    anchor: [0, 0, 0],
    onClick: clickPrint,
  });

  if (items.length) setSelected(0, false);
  else {
    redrawCaption(null);
    redrawFilmReadout(null);
  }
  redrawShutterReadout();

  function updateParts() {
    blades.forEach((blade, index) => {
      const angle = blade.userData.angle;
      const spread = 0.18 + visualAperture * 0.68;
      const radius = 0.13 + visualAperture * 0.42;
      blade.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.025 + index * 0.0007);
      blade.rotation.z = angle + 0.22 + visualAperture * 0.82;
      blade.scale.setScalar(0.82 + visualAperture * 0.12);
      blade.material.opacity = 1;
      blade.visible = spread > 0;
    });
    apertureGear.rotation.z = -visualAperture * Math.PI * 0.72;
    lensA.position.z = -0.48 + (visualFocus - 0.5) * 0.42;
    lensB.position.z = 0.34 - (visualFocus - 0.5) * 0.24;
    focusSleeve.position.z = -0.33 + (visualFocus - 0.5) * 0.42;
    focusRing.rotation.z = visualFocus * Math.PI * 1.85;
    focusMarkRotor.rotation.z = -visualFocus * Math.PI * 1.7;
    focusControl.rotation.z = -0.12 + visualFocus * 0.38;
    apertureNeedle.rotation.z = 0.12 + visualAperture * 2.45;
    apertureControl.rotation.z = 0.1 + visualAperture * 0.32;
    photoShader.uniforms.uFocus.value = visualFocus;
    photoShader.uniforms.uAperture.value = visualAperture;
    photoShader.uniforms.uExposure.value = clamp(0.36 + visualAperture * 0.54 + Math.min(state.exposure, 4) * 0.025, 0, 1);
    beamMaterials.forEach((material, index) => {
      material.opacity = (0.18 + visualAperture * (0.46 + index * 0.035)) * (0.4 + development * 0.6);
      material.emissiveIntensity = 0.5 + visualAperture * 1.35;
    });
    beamExit.scale.set(0.52 + visualAperture * 0.72, 1, 0.52 + visualAperture * 0.72);
    apertureLamp.intensity = 0.28 + visualAperture * 1.4;
    prismLamp.intensity = 0.36 + visualAperture * 0.9;
    lampCoreMaterial.opacity = 0.35 + visualAperture * 0.62;
    shutterButton.position.z = 0.08 - shutterPress * 0.105;
    shutterAssembly.rotation.z = -0.16 + shutterPress * 0.06;
    printPaperRoot.scale.y = 0.17 + (1 - Math.pow(1 - printLift, 3)) * 0.83;
    printPaperRoot.rotation.x = -0.16 + printLift * 0.16;
    printPaperRoot.rotation.z = -0.045 + printLift * 0.045;
    printAssembly.position.y = 2.24 - printLift * 0.16;
    filmCarriage.position.x = -filmKick * 0.22;
    filmCarriage.rotation.z = -filmKick * 0.014;
    filmAssembly.rotation.y = 0.2 + Math.sin(state.selected * 0.41) * 0.035;
    guideRollers.forEach((roller, index) => {
      roller.rotation.z = state.selected * 0.42 + development * 1.8 + index * Math.PI;
    });
    chemistryRollers.forEach((roller, index) => {
      roller.rotation.z = development * Math.PI * 5.4 + index * 0.43;
    });
    prismAssembly.rotation.y = -0.25 + Math.sin(visualFocus * Math.PI) * 0.075;
  }

  updateParts();

  return {
    group,
    focus: new THREE.Vector3(0.15, 3.55, 0.35),
    update(time, delta, active) {
      activeNow = Boolean(active);
      if (!activeNow) return;
      const dt = clamp(Number(delta) || 0, 0, 0.08);
      visualAperture = damp(visualAperture, state.aperture, 10, dt || 0.016);
      visualFocus = damp(visualFocus, state.focus, 10, dt || 0.016);
      filmKick = damp(filmKick, 0, 8, dt || 0.016);
      shutterPress = damp(shutterPress, 0, 18, dt || 0.016);
      if (developing) {
        development = Math.min(1, development + dt / 2.6);
        printLift = Math.min(1, printLift + dt / 1.25);
        photoShader.uniforms.uDevelop.value = development;
        if (development >= 1) {
          developing = false;
          state.developed = true;
          const item = items[state.selected];
          status(`显影完成 · ${item?.title || "照片"} · 现在可以点开印相纸`);
          invalidate();
        }
      }
      if (!developing && !state.developed) {
        development = damp(development, 0, 6, dt || 0.016);
        printLift = damp(printLift, 0, 4.2, dt || 0.016);
        photoShader.uniforms.uDevelop.value = development;
      }
      updateParts();
      if (Math.sin(time * 0.0007) > 0.999) invalidate();
    },
    interact(action, index) {
      if (action === "select" || action === "next" || action === "previous") {
        const direction = action === "previous" ? -1 : action === "next" ? 1 : 0;
        return setSelected(Number.isFinite(Number(index)) ? Number(index) : state.selected + direction, false);
      }
      if (action === "shutter" || action === "expose") return beginExposure();
      if (action === "aperture") {
        const value = Number(index);
        if (Number.isFinite(value)) state.aperture = clamp(value, 0, 1);
        updateParts();
        invalidate();
        return state.aperture;
      }
      if (action === "focus") {
        const value = Number(index);
        if (Number.isFinite(value)) state.focus = clamp(value, 0, 1);
        updateParts();
        invalidate();
        return state.focus;
      }
      if (action === "reset") {
        state.aperture = 0.46;
        state.focus = 0.54;
        state.exposure = 0;
        visualAperture = state.aperture;
        visualFocus = state.focus;
        printLift = 0;
        redrawShutterReadout();
        setSelected(0, false);
        resetDevelopment();
        updateParts();
        status("光学仪已复位。");
        invalidate();
        return true;
      }
      if (action === "reveal" && state.developed) clickPrint();
      return state.developed;
    },
    getState() {
      const item = items[state.selected];
      return {
        aperture: Number(state.aperture.toFixed(3)),
        fNumber: fNumber(state.aperture),
        focus: Number(state.focus.toFixed(3)),
        exposure: state.exposure,
        selected: state.selected,
        selectedId: item?.id || "",
        selectedNumber: item?.number || "",
        developed: state.developed,
        developing,
        development: Number(development.toFixed(3)),
        printOpen: Number(printLift.toFixed(3)),
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
