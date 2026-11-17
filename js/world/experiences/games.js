const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const QUARTER_PI = Math.PI / 4;

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

function normalizeAngle(angle) {
  return ((angle % TAU) + TAU) % TAU;
}

function routeDirectionKey(value) {
  const key = String(value || "").toLowerCase();
  if (["arrowright", "right", "d"].includes(key)) return "right";
  if (["arrowleft", "left", "a"].includes(key)) return "left";
  if (["arrowup", "up", "w"].includes(key)) return "forward";
  if (["arrowdown", "down", "s"].includes(key)) return "backward";
  if (["enter", " ", "space", "spacebar"].includes(key)) return "activate";
  return key;
}

function shortText(value, limit = 34) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1).trimEnd() + "…";
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
  if (!kit || !kit.THREE) throw new TypeError("games experience requires a Three.js kit");
  if (!kit.sculpt) throw new TypeError("games experience requires kit.sculpt");

  const THREE = kit.THREE;
  const sculpt = kit.sculpt;
  const group = new THREE.Group();
  group.name = "experience-games-gravity-fold";

  const collection = kit.collection || { id: "games", items: [] };
  const games = Array.isArray(collection.items) ? collection.items.filter(Boolean) : [];
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
    porcelain: kit.cream || kit.material("#f2ede2", 0.48, 0.02),
    porcelainBlue: rawMaterial("#dce6df", 0.52, 0.02),
    jade: kit.green || kit.material("#1f6658", 0.5, 0.08),
    deepGreen: rawMaterial("#173b35", 0.55, 0.16),
    ink: kit.dark || kit.material("#14201d", 0.46, 0.18),
    walnut: kit.walnut || kit.material("#4b3327", 0.64, 0.02),
    brass: kit.brass || kit.material("#b68b4c", 0.27, 0.72),
    copper: rawMaterial("#b66445", 0.32, 0.7),
    ruby: rawMaterial("#a72d45", 0.24, 0.32),
    sapphire: rawMaterial("#285a7d", 0.26, 0.42),
    opal: rawMaterial("#d9c79f", 0.32, 0.16),
    glass: ownMaterial(new THREE.MeshStandardMaterial({
      color: "#bedbd3",
      transparent: true,
      opacity: 0.2,
      roughness: 0.12,
      metalness: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    })),
    film: ownMaterial(new THREE.MeshStandardMaterial({
      color: "#d8e9df",
      transparent: true,
      opacity: 0.14,
      roughness: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    })),
  };

  const stepGeometry = ownGeometry(new THREE.BoxGeometry(0.48, 0.065, 0.25));
  const ribGeometry = ownGeometry(new THREE.BoxGeometry(0.86, 0.022, 0.025));
  const rivetGeometry = ownGeometry(new THREE.SphereGeometry(0.045, 10, 8));

  function makeText(width, height, text, position, parent = group, options = {}) {
    const mesh = sculpt.text(text, width, height, parent, {
      background: options.background ?? null,
      color: options.color ?? "#e8f0e7",
      fontSize: options.fontSize ?? 70,
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

  const lowerStrata = new THREE.Group();
  lowerStrata.name = "split-gravity-strata";
  group.add(lowerStrata);

  const strata = [
    [-2.92, 0.24, 0.72, 1.85, 0.23, 1.08, -0.16],
    [-0.74, 0.12, -1.38, 1.48, 0.18, 1.16, 0.12],
    [1.42, 0.2, 0.5, 2.18, 0.2, 1.02, -0.1],
  ];
  strata.forEach(([x, y, z, w, h, d, rotation], index) => {
    const slab = sculpt.rounded(w, h, d, materialForStrata(index), lowerStrata, [x, y, z], 0.11);
    slab.rotation.y = rotation;
    const underline = makeLine(
      [
        new THREE.Vector3(x - w * 0.42, y + h * 0.65, z - d * 0.5),
        new THREE.Vector3(x + w * 0.42, y + h * 0.65, z - d * 0.5),
      ],
      "#b78d52",
      lowerStrata,
    );
    underline.position.z += 0.012;
  });

  function materialForStrata(index) {
    return index === 1 ? materials.jade : materials.porcelain;
  }

  const suspendedFoundation = new THREE.Group();
  suspendedFoundation.name = "floating-foundations";
  group.add(suspendedFoundation);
  for (let index = 0; index < 6; index += 1) {
    const angle = -1.12 + index * 0.9;
    const radius = 2.6 + (index % 2) * 0.58;
    const panel = sculpt.rounded(
      1.0 + (index % 3) * 0.18,
      0.07,
      0.54,
      index % 2 ? materials.glass : materials.porcelainBlue,
      suspendedFoundation,
      [Math.cos(angle) * radius, 0.56 + index * 0.08, Math.sin(angle) * radius],
      0.05,
    );
    panel.rotation.set(0.04 * (index % 2), -angle + HALF_PI, 0.1 * Math.sin(index));
    makeLine(
      [
        new THREE.Vector3(panel.position.x - 0.25, panel.position.y + 0.05, panel.position.z),
        new THREE.Vector3(panel.position.x + 0.25, panel.position.y + 0.05, panel.position.z),
      ],
      "#b58b53",
      suspendedFoundation,
    );
  }

  const rearMechanism = new THREE.Group();
  rearMechanism.name = "rear-fold-mechanism";
  rearMechanism.position.set(0, 0.2, -3.95);
  rearMechanism.scale.setScalar(0.38);
  group.add(rearMechanism);

  const core = new THREE.Group();
  core.name = "fold-core";
  rearMechanism.add(core);

  const spineCurve = [
    new THREE.Vector3(-0.45, 0.38, 0.18),
    new THREE.Vector3(-0.2, 1.55, -0.1),
    new THREE.Vector3(0.36, 2.6, 0.12),
    new THREE.Vector3(0.08, 3.72, -0.1),
    new THREE.Vector3(-0.24, 4.92, 0.08),
    new THREE.Vector3(0.08, 6.14, 0),
    new THREE.Vector3(0, 7.34, 0),
  ];
  sculpt.tube(spineCurve, 0.075, materials.brass, core, 96, 10);
  sculpt.tube(
    spineCurve.map((point, index) => point.clone().add(new THREE.Vector3(
      Math.cos(index * 1.8) * 0.12,
      0,
      Math.sin(index * 1.8) * 0.12,
    ))),
    0.018,
    materials.copper,
    core,
    80,
    7,
  );

  for (let index = 0; index < 4; index += 1) {
    const y = 1.35 + index * 1.26;
    const radius = 0.8 + index * 0.18;
    sculpt.ring(radius, 0.025, materials.brass, core, [0, y, 0], TAU * 0.78);
    const torque = sculpt.ring(radius * 0.72, 0.018, materials.jade, core, [0, y + 0.12, 0], TAU * 0.62);
    torque.rotation.set(0.48, index * 0.56, 0.18);
  }

  const gravityShell = new THREE.Group();
  gravityShell.name = "gravity-rotating-steps";
  core.add(gravityShell);

  const stairStepPlacements = [];
  for (let flight = 0; flight < 3; flight += 1) {
    for (let index = 0; index < 9; index += 1) {
      const angle = -0.8 + index * 0.31 + flight * (TAU / 3);
      const radius = 2.2 - index * 0.075 + flight * 0.1;
      stairStepPlacements.push({
        position: [
          Math.cos(angle) * radius,
          1.55 + index * 0.42 + flight * 0.17,
          Math.sin(angle) * radius,
        ],
        rotation: [0.04 * Math.sin(index), -angle + HALF_PI, 0.03 * Math.cos(angle)],
        scale: [0.84 + index * 0.018, 1, 0.9],
      });
    }
  }
  const stairSteps = sculpt.instances(stepGeometry, materials.porcelain, stairStepPlacements, gravityShell);
  stairSteps.castShadow = true;
  stairSteps.receiveShadow = true;

  const stairRibPlacements = stairStepPlacements.map((placement, index) => ({
    position: [
      placement.position[0],
      placement.position[1] - 0.055,
      placement.position[2],
    ],
    rotation: placement.rotation,
    scale: [1, 1, 1 + (index % 3) * 0.18],
  }));
  const stairRibs = sculpt.instances(stepGeometry, materials.jade, stairRibPlacements, gravityShell);
  stairRibs.castShadow = true;

  const stairRailPointsA = [];
  const stairRailPointsB = [];
  for (let index = 0; index <= 10; index += 1) {
    const angle = -0.38 + index * 0.21;
    const y = 1.78 + index * 0.19;
    const radius = 1.58 - index * 0.026;
    stairRailPointsA.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
    stairRailPointsB.push(new THREE.Vector3(Math.cos(angle + TAU / 3) * radius, y + 0.08, Math.sin(angle + TAU / 3) * radius));
  }
  sculpt.tube(stairRailPointsA, 0.025, materials.copper, gravityShell, 96, 7);
  sculpt.tube(stairRailPointsB, 0.02, materials.brass, gravityShell, 96, 7);
  [stairRailPointsA, stairRailPointsB].forEach((rail) => {
    [rail[0], rail[rail.length - 1]].forEach((point) => {
      sculpt.lathe(
        [
          [0.0, 0.0],
          [0.11, 0.0],
          [0.13, 0.035],
          [0.075, 0.08],
          [0.0, 0.1],
        ],
        materials.deepGreen,
        gravityShell,
        [point.x, point.y - 0.05, point.z],
        24,
      );
      const collar = sculpt.ring(0.105, 0.018, materials.brass, gravityShell, [point.x, point.y + 0.02, point.z]);
      collar.rotation.x = HALF_PI;
    });
  });

  const shardGeometry = (() => {
    const parent = new THREE.Group();
    const mesh = sculpt.surface(
      (u, v) => {
        const x = (u - 0.5) * 1.58;
        const y = (v - 0.5) * 0.92;
        const z =
          Math.sin(u * Math.PI) * 0.16 +
          Math.sin(v * Math.PI * 1.5) * 0.08;
        return [x, y, z];
      },
      12,
      6,
      materials.film,
      parent,
    );
    parent.remove(mesh);
    return mesh.geometry;
  })();
  ownGeometry(shardGeometry);

  const shardGroups = [];
  for (let index = 0; index < 7; index += 1) {
    const holder = new THREE.Group();
    const angle = (index / 7) * TAU + 0.2;
    const radius = 2.35 + (index % 3) * 0.38;
    holder.position.set(Math.cos(angle) * radius, 3.25 + index * 0.48, Math.sin(angle) * radius);
    holder.rotation.set(0.04 * Math.sin(index), -angle, 0.08 * Math.cos(index * 1.7));
    gravityShell.add(holder);
    const shard = new THREE.Mesh(shardGeometry, index % 2 ? materials.glass : materials.film);
    shard.castShadow = true;
    holder.add(shard);
    sculpt.tube(
      [
        new THREE.Vector3(-0.72, -0.46, 0.02),
        new THREE.Vector3(0.72, -0.46, 0.02),
        new THREE.Vector3(0.72, 0.46, 0.02),
        new THREE.Vector3(-0.72, 0.46, 0.02),
        new THREE.Vector3(-0.72, -0.46, 0.02),
      ],
      0.018,
      index % 2 ? materials.brass : materials.copper,
      holder,
      36,
      6,
    );
    shardGroups.push({ holder, baseY: holder.position.y, phase: index * 0.68 });
  }

  const gravityCenter = new THREE.Vector3(-1.25, 4.7, 2.2);
  const gravityRadius = 1.45;
  const gravityRotor = new THREE.Group();
  gravityRotor.name = "gravity-ring-rotor";
  gravityRotor.position.copy(gravityCenter);
  group.add(gravityRotor);
  const gravityRing = sculpt.ring(
    gravityRadius,
    0.075,
    materials.brass,
    gravityRotor,
    [0, 0, 0],
    TAU * 0.92,
  );
  gravityRing.name = "gravity-ring";
  const gravityTeeth = [];
  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * TAU;
    gravityTeeth.push({
      position: [
        Math.cos(angle) * gravityRadius,
        Math.sin(angle) * gravityRadius,
        0.06,
      ],
      rotation: [0, 0, angle],
      scale: [1, 1, 1],
    });
  }
  sculpt.instances(rivetGeometry, materials.copper, gravityTeeth, gravityRotor);
  const gravityGlowMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: "#d8b772",
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  const gravityGlowRing = sculpt.ring(
    gravityRadius,
    0.24,
    gravityGlowMaterial,
    gravityRotor,
    [0, 0, 0],
    TAU * 0.92,
  );
  gravityGlowRing.renderOrder = 3;
  const gravityHub = sculpt.gear(
    0.34,
    0.16,
    20,
    materials.brass,
    gravityRotor,
    [0, 0, 0.02],
  );
  gravityHub.castShadow = true;
  const gravityHandle = new THREE.Group();
  gravityHandle.name = "gravity-ring-handle";
  gravityHandle.position.set(gravityRadius, -0.18, 0.16);
  gravityRing.add(gravityHandle);
  sculpt.tube(
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.28, 0.04, 0.14),
    ],
    0.035,
    materials.copper,
    gravityHandle,
    16,
    7,
  );
  sculpt.lathe(
    [
      [0.0, 0.0],
      [0.09, 0.0],
      [0.12, 0.05],
      [0.1, 0.16],
      [0.0, 0.2],
    ],
    materials.deepGreen,
    gravityHandle,
    [0.3, 0.04, 0.16],
    28,
  );
  const gravityHandleHitMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  }));
  const gravityHandleHit = new THREE.Mesh(
    ownGeometry(new THREE.SphereGeometry(0.34, 14, 10)),
    gravityHandleHitMaterial,
  );
  gravityHandleHit.position.set(0.28, 0.06, 0.16);
  gravityHandle.add(gravityHandleHit);
  const supportFoot = new THREE.Vector3(-2.72, 0.46, 1.42);
  const supportJoint = new THREE.Vector3(
    gravityCenter.x - gravityRadius * 0.68,
    gravityCenter.y - gravityRadius * 0.48,
    gravityCenter.z - 0.08,
  );
  sculpt.tube(
    [
      supportFoot,
      new THREE.Vector3(-2.58, 2.02, 1.68),
      supportJoint,
    ],
    0.045,
    materials.copper,
    group,
    32,
    8,
  );
  sculpt.lathe(
    [
      [0.0, 0.0],
      [0.18, 0.0],
      [0.2, 0.04],
      [0.12, 0.1],
      [0.0, 0.13],
    ],
    materials.deepGreen,
    group,
    [supportFoot.x, supportFoot.y - 0.03, supportFoot.z],
    32,
  );
  const supportBearing = sculpt.ring(0.13, 0.022, materials.brass, group, [
    supportJoint.x,
    supportJoint.y,
    supportJoint.z,
  ]);
  supportBearing.rotation.x = HALF_PI;

  const routeNodes = [
    { name: "起点", position: new THREE.Vector3(-3.63, 1.18, 0.74), kind: "start" },
    { name: "道路一", position: new THREE.Vector3(-2.35, 1.32, 0.5), kind: "road" },
    { name: "道路二", position: new THREE.Vector3(-1.07, 1.46, 0.26), kind: "road" },
    { name: "道路三", position: new THREE.Vector3(0.21, 1.62, 0.02), kind: "road" },
    { name: "道路四", position: new THREE.Vector3(0.21, 1.8, -1.26), kind: "road" },
    { name: "道路五", position: new THREE.Vector3(0.21, 1.98, -2.54), kind: "road" },
    { name: "传送门", position: new THREE.Vector3(0.21, 3.26, -3.82), kind: "portal" },
  ];

  const startPad = sculpt.lathe(
    [
      [0.0, 0.0],
      [0.7, 0.0],
      [0.72, 0.06],
      [0.58, 0.11],
      [0.38, 0.13],
      [0.0, 0.13],
    ],
    materials.deepGreen,
    group,
    [routeNodes[0].position.x, 1.08, routeNodes[0].position.z],
    48,
  );
  startPad.scale.set(0.8, 1, 0.8);
  sculpt.ring(0.5, 0.025, materials.brass, group, [routeNodes[0].position.x, 1.23, routeNodes[0].position.z]);

  const routePlatforms = [];
  const platformBasePorts = [
    [0, 2],
    [0, 2],
    [0, 3],
    [0, 2],
    [0, 2],
  ];
  const initialQuarters = [1, 1, 0, 0, 0];

  function rotatedPort(port, quarter) {
    return (port + quarter) % 4;
  }

  for (let index = 0; index < 5; index += 1) {
    const node = routeNodes[index + 1];
    const root = new THREE.Group();
    root.name = "road-platform-" + index;
    root.position.copy(node.position);
    group.add(root);

    const spin = new THREE.Group();
    spin.name = "road-rotor-" + index;
    root.add(spin);

    sculpt.rounded(0.88, 0.13, 0.88, materials.porcelain, spin, [0, 0, 0], 0.1);
    sculpt.rounded(0.72, 0.045, 0.72, materials.deepGreen, spin, [0, 0.085, 0], 0.068);
    const roadMat = index === 2 ? materials.jade : materials.porcelainBlue;
    if (index === 2) {
      sculpt.rounded(0.68, 0.035, 0.17, roadMat, spin, [0.06, 0.12, 0], 0.038);
      sculpt.rounded(0.17, 0.035, 0.68, roadMat, spin, [0, 0.12, 0.26], 0.038);
    } else {
      sculpt.rounded(0.7, 0.035, 0.17, roadMat, spin, [0, 0.12, 0], 0.038);
    }

    const ribPlacements = [];
    for (let rib = 0; rib < 7; rib += 1) {
      ribPlacements.push({
        position: [-0.27 + rib * 0.09, -0.085, 0],
        rotation: [0, 0, 0],
        scale: [0.72, 1, 0.72],
      });
    }
    sculpt.instances(ribGeometry, materials.brass, ribPlacements, spin);

    sculpt.tube(
      [
        new THREE.Vector3(-0.41, 0.15, -0.41),
        new THREE.Vector3(0.41, 0.15, -0.41),
        new THREE.Vector3(0.41, 0.15, 0.41),
        new THREE.Vector3(-0.41, 0.15, 0.41),
        new THREE.Vector3(-0.41, 0.15, -0.41),
      ],
      0.016,
      materials.brass,
      spin,
      40,
      6,
    );

    const hub = sculpt.lathe(
      [
        [0.0, 0.0],
        [0.22, 0.0],
        [0.23, 0.05],
        [0.13, 0.11],
        [0.08, 0.2],
        [0.0, 0.22],
      ],
      materials.brass,
      spin,
      [0, 0.1, 0],
      40,
    );
    hub.castShadow = true;

    const gearPivot = new THREE.Group();
    gearPivot.position.set(0, 0.28, 0);
    gearPivot.rotation.x = HALF_PI;
    spin.add(gearPivot);
    const gear = sculpt.gear(0.25, 0.08, 18, materials.copper, gearPivot, [0, 0, 0]);
    gear.castShadow = true;

    const glowMaterial = ownMaterial(new THREE.MeshBasicMaterial({
      color: "#c68c48",
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    }));
    const glowRing = sculpt.ring(0.31, 0.025, glowMaterial, spin, [0, 0.24, 0]);
    glowRing.rotation.x = HALF_PI;
    glowRing.renderOrder = 2;

    const envelopeMaterial = ownMaterial(new THREE.MeshBasicMaterial({
      color: "#84b4a3",
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    }));
    const envelope = sculpt.ring(0.62, 0.014, envelopeMaterial, spin, [0, 0.17, 0]);
    envelope.rotation.x = HALF_PI;
    envelope.renderOrder = 1;

    const detentPlacements = [];
    for (let detent = 0; detent < 4; detent += 1) {
      const angle = detent * HALF_PI;
      detentPlacements.push({
        position: [Math.cos(angle) * 0.52, 0.18, Math.sin(angle) * 0.52],
        rotation: [0, 0, 0],
        scale: 1,
      });
    }
    sculpt.instances(rivetGeometry, materials.brass, detentPlacements, spin);

    const portCursor = [[0.31, 0], [0, -0.31], [-0.31, 0], [0, 0.31]];
    platformBasePorts[index].forEach((port) => {
      const [x, z] = portCursor[port];
      const radial = new THREE.Vector3(x, 0, z).normalize();
      const tangent = new THREE.Vector3(-radial.z, 0, radial.x);
      const tip = radial.clone().multiplyScalar(0.37);
      const tail = radial.clone().multiplyScalar(0.22);
      sculpt.tube(
        [
          tail.clone().addScaledVector(tangent, 0.065).setY(0.165),
          tip.clone().setY(0.165),
          tail.clone().addScaledVector(tangent, -0.065).setY(0.165),
        ],
        0.014,
        materials.brass,
        spin,
        14,
        5,
      );
      sculpt.rounded(
        0.12,
        0.025,
        0.07,
        materials.opal,
        spin,
        [x * 1.03, 0.17, z * 1.03],
        0.025,
      ).rotation.y = port % 2 ? HALF_PI : 0;
    });

    const hitMaterial = ownMaterial(new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      colorWrite: false,
      side: THREE.DoubleSide,
    }));
    const handle = new THREE.Group();
    handle.name = "road-edge-handle-" + index;
    handle.position.set(0, 0.31, 0.42);
    root.add(handle);
    sculpt.tube(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.025, 0.18),
      ],
      0.024,
      materials.brass,
      handle,
      18,
      7,
    );
    sculpt.lathe(
      [
        [0.0, 0.0],
        [0.08, 0.0],
        [0.105, 0.045],
        [0.085, 0.13],
        [0.0, 0.16],
      ],
      materials.copper,
      handle,
      [0, 0.035, 0.19],
      28,
    );
    const edgeHit = new THREE.Mesh(
      ownGeometry(new THREE.SphereGeometry(0.23, 14, 10)),
      hitMaterial,
    );
    edgeHit.position.set(0, 0.055, 0.19);
    handle.add(edgeHit);
    const hit = handle;

    const destinationMaterial = ownMaterial(new THREE.MeshBasicMaterial({
      color: "#dbae62",
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    }));
    const destination = new THREE.Mesh(ownGeometry(new THREE.SphereGeometry(0.07, 12, 8)), destinationMaterial);
    destination.position.set(0.34, 0.4, 0);
    spin.add(destination);

    const quarter = initialQuarters[index];
    spin.rotation.y = quarter * HALF_PI;
    routePlatforms.push({
      root,
      spin,
      gear,
      hit,
      destination,
      destinationMaterial,
      envelopeMaterial,
      glowMaterial,
      quarter,
      targetAngle: quarter * HALF_PI,
      dragging: false,
      dragAngle: quarter * HALF_PI,
    });
  }

  const connectionDefinitions = [
    { from: 0, to: 1, checks: [[0, 2]] },
    { from: 1, to: 2, checks: [[0, 0], [1, 2]] },
    { from: 2, to: 3, checks: [[1, 0], [2, 2]] },
    { from: 3, to: 4, checks: [[2, 1], [3, 3]] },
    { from: 4, to: 5, checks: [[3, 1], [4, 3]] },
    { from: 5, to: 6, checks: [[4, 1]] },
  ];
  const connectionMaterials = [];
  const connectionGems = [];
  const connectionTubes = [];

  function hasPort(platformIndex, port) {
    const quarter = Math.round(normalizeAngle(routePlatforms[platformIndex].spin.rotation.y) / HALF_PI);
    return platformBasePorts[platformIndex].some((basePort) => rotatedPort(basePort, quarter) === port);
  }

  function connectionOpen(definition) {
    return definition.checks.every(([platformIndex, port]) => hasPort(platformIndex, port));
  }

  for (let index = 0; index < connectionDefinitions.length; index += 1) {
    const definition = connectionDefinitions[index];
    const start = routeNodes[definition.from].position;
    const end = routeNodes[definition.to].position;
    const direction = end.clone().sub(start).normalize();
    const startInset = definition.from === 0 ? 0.42 : 0.5;
    const endInset = definition.to === 6 ? 0.52 : 0.5;
    const startEdge = start.clone().addScaledVector(direction, startInset);
    const endEdge = end.clone().addScaledVector(direction, -endInset);
    const midpoint = startEdge.clone().lerp(endEdge, 0.5);
    midpoint.y += 0.15 + Math.sin(index * 1.4) * 0.08;
    const material = ownMaterial(new THREE.MeshBasicMaterial({
      color: "#9b6544",
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }));
    connectionMaterials.push(material);
    const route = sculpt.tube(
      [
        startEdge.clone().setY(startEdge.y + 0.13),
        midpoint,
        endEdge.clone().setY(endEdge.y + 0.13),
      ],
      0.018,
      material,
      group,
      28,
      6,
    );
    route.renderOrder = 2;
    connectionTubes.push(route);
    const gem = new THREE.Mesh(ownGeometry(new THREE.OctahedronGeometry(0.06, 0)), material);
    gem.position.copy(midpoint);
    gem.rotation.z = QUARTER_PI;
    group.add(gem);
    connectionGems.push(gem);
    [startEdge, endEdge].forEach((edge, edgeIndex) => {
      const seat = sculpt.lathe(
        [
          [0.0, 0.0],
          [0.13, 0.0],
          [0.15, 0.035],
          [0.09, 0.075],
          [0.0, 0.09],
        ],
        edgeIndex === 0 ? materials.deepGreen : materials.ink,
        group,
        [edge.x, edge.y + 0.08, edge.z],
        24,
      );
      seat.castShadow = true;
      sculpt.ring(
        0.13,
        0.014,
        materials.brass,
        group,
        [edge.x, edge.y + 0.17, edge.z],
      ).rotation.x = HALF_PI;
    });
  }

  const portal = new THREE.Group();
  portal.name = "multi-petal-gate";
  portal.position.set(routeNodes[6].position.x, 3.42, routeNodes[6].position.z);
  group.add(portal);

  sculpt.ring(1.52, 0.13, materials.porcelainBlue, portal, [0, 0, 0], TAU * 0.94);
  sculpt.ring(1.34, 0.035, materials.brass, portal, [0, 0, 0.08], TAU);
  sculpt.ring(1.72, 0.025, materials.copper, portal, [0, 0, -0.08], TAU * 0.7);
  for (let index = 0; index < 22; index += 1) {
    const angle = (index / 22) * TAU * 0.94;
    const spoke = sculpt.tube(
      [
        new THREE.Vector3(Math.cos(angle) * 1.54, Math.sin(angle) * 1.54, 0),
        new THREE.Vector3(Math.cos(angle) * 1.7, Math.sin(angle) * 1.7, 0),
      ],
      0.012,
      materials.brass,
      portal,
      8,
      5,
    );
    spoke.rotation.z = angle;
  }

  let selected = games.length ? 0 : -1;
  const portalImageGroup = new THREE.Group();
  portalImageGroup.position.z = 0.1;
  portal.add(portalImageGroup);
  const firstGame = selected >= 0 ? games[selected] : null;
  const portalImage = kit.image(firstGame?.image || "", 1.35, 1.8, portalImageGroup);
  let portalImageMaterial = portalImage?.material || null;
  if (portalImageMaterial) {
    portalImageMaterial.transparent = true;
    portalImageMaterial.opacity = 0;
    portalImageMaterial.depthWrite = false;
    ownMaterial(portalImageMaterial);
  }
  if (portalImage) {
    portalImage.position.z = 0.1;
    portalImage.renderOrder = 4;
  }

  const petalSurfaceGeometry = (() => {
    const helper = new THREE.Group();
    const mesh = sculpt.surface(
      (u, v) => {
        const x = (u - 0.5) * 0.74;
        const y = (v - 0.5) * 1.74;
        const z = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.12;
        return [x, y, z];
      },
      6,
      12,
      materials.porcelainBlue,
      helper,
    );
    helper.remove(mesh);
    ownGeometry(mesh.geometry);
    return mesh.geometry;
  })();

  const petals = [];
  for (let index = 0; index < 4; index += 1) {
    const angle = index * HALF_PI + QUARTER_PI;
    const petal = new THREE.Group();
    petal.position.set(Math.cos(angle) * 0.13, Math.sin(angle) * 0.13, 0);
    portal.add(petal);
    const surface = new THREE.Mesh(petalSurfaceGeometry, materials.porcelainBlue);
    surface.castShadow = true;
    surface.receiveShadow = true;
    petal.add(surface);
    sculpt.tube(
      [
        new THREE.Vector3(-0.33, -0.78, 0.15),
        new THREE.Vector3(0.33, -0.78, 0.15),
        new THREE.Vector3(0.33, 0.78, 0.15),
        new THREE.Vector3(-0.33, 0.78, 0.15),
        new THREE.Vector3(-0.33, -0.78, 0.15),
      ],
      0.018,
      materials.brass,
      petal,
      32,
      6,
    );
    petals.push({
      group: petal,
      surface,
      closed: new THREE.Vector3(Math.cos(angle) * 0.18, Math.sin(angle) * 0.18, 0),
      open: new THREE.Vector3(Math.cos(angle) * 1.35, Math.sin(angle) * 1.35, -0.08),
      closedRotation: -angle * 0.1,
      openRotation: angle * 0.36,
    });
  }

  const coverPlaque = sculpt.rounded(1.7, 0.2, 0.08, materials.ink, portal, [0, -1.92, 0.22], 0.035);
  coverPlaque.rotation.z = -0.005;
  let selectedLabel = makeText(
    1.52,
    0.13,
    selected >= 0 ? (games[selected]?.title || "") : "NO GAME SELECTED",
    [0, -1.92, 0.275],
    portal,
    { color: "#efe7d3", fontSize: 56, background: null },
  );

  let statusLabel = makeText(
    2.35,
    0.2,
    "重力路径：等待校准",
    [0.02, 0.76, 3.03],
    group,
    { color: "#2b453d", fontSize: 58, background: "#e8dfcb" },
  );

  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(3.0, 0.45, 1.92);
  consoleGroup.rotation.y = -0.34;
  group.add(consoleGroup);
  sculpt.lathe(
    [
      [0.0, 0.0],
      [0.46, 0.0],
      [0.46, 0.08],
      [0.34, 0.16],
      [0.28, 0.46],
      [0.0, 0.46],
    ],
    materials.walnut,
    consoleGroup,
    [0, 0, 0],
    48,
  );
  const resetGear = sculpt.gear(0.32, 0.08, 20, materials.copper, consoleGroup, [0, 0.5, 0]);
  resetGear.rotation.x = HALF_PI;
  const resetHitMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  }));
  const resetHit = new THREE.Mesh(ownGeometry(new THREE.SphereGeometry(0.48, 14, 10)), resetHitMaterial);
  resetHit.position.set(0, 0.52, 0);
  consoleGroup.add(resetHit);

  const traveler = new THREE.Group();
  traveler.name = "traveler-orb";
  group.add(traveler);
  const travelerCoreMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: "#ecdfb1",
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
  }));
  const travelerCore = new THREE.Mesh(ownGeometry(new THREE.SphereGeometry(0.13, 18, 12)), travelerCoreMaterial);
  traveler.add(travelerCore);
  const travelerHaloMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: "#8bd4c4",
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  const travelerRings = [];
  for (let index = 0; index < 3; index += 1) {
    const ring = sculpt.ring(0.22 + index * 0.035, 0.012, travelerHaloMaterial, traveler, [0, 0, 0]);
    ring.rotation.set(index * 1.1, index * 0.72, index * 0.47);
    travelerRings.push(ring);
  }
  const travelerHitMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  }));
  const travelerHit = new THREE.Mesh(ownGeometry(new THREE.SphereGeometry(0.38, 14, 10)), travelerHitMaterial);
  traveler.add(travelerHit);

  const travelerTrailMaterial = ownMaterial(new THREE.LineBasicMaterial({
    color: "#d8c07c",
    transparent: true,
    opacity: 0.62,
  }));
  const travelerTrailGeometry = ownGeometry(new THREE.BufferGeometry());
  const trailPositions = new Float32Array(24 * 3);
  travelerTrailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
  travelerTrailGeometry.setDrawRange(0, 0);
  const travelerTrail = new THREE.Line(travelerTrailGeometry, travelerTrailMaterial);
  group.add(travelerTrail);

  let travelerNode = 0;
  let travelerFrom = 0;
  let travelerTo = 0;
  let travelerProgress = 1;
  let travelQueue = [];
  let draggingTraveler = false;
  let dragTravelPath = [];
  let previewTravelerPosition = null;
  let statusText = "";
  let gravityAngle = 0;
  let gravityTarget = 0;
  let gravityDragging = false;
  let active = true;
  let lastTime = 0;
  let solved = false;
  let portalOpen = 0;
  let portalTarget = 0;
  let resetPulse = 0;

  function applyPortalImmediate(open) {
    portalOpen = open ? 1 : 0;
    portalTarget = open ? 1 : 0;
    petals.forEach((petal) => {
      petal.group.position.copy(open ? petal.open : petal.closed);
      petal.group.rotation.z = open ? petal.openRotation : petal.closedRotation;
      petal.group.scale.setScalar(open ? 0.92 : 1);
    });
    if (portalImageMaterial) portalImageMaterial.opacity = open ? 0.98 : 0;
  }

  function applyGravityImmediate() {
    gravityAngle = gravityTarget;
    gravityRotor.rotation.z = gravityAngle;
    gravityShell.rotation.z = gravityAngle;
  }

  function connectionCount() {
    return connectionDefinitions.reduce((total, definition) => total + (connectionOpen(definition) ? 1 : 0), 0);
  }

  function updateConnectionVisuals() {
    const connections = connectionDefinitions.map(connectionOpen);
    connectionMaterials.forEach((material, index) => {
      const connected = connections[index];
      material.color.set(connected ? "#5ea98f" : "#a45645");
      material.opacity = connected ? 0.95 : 0.38;
    });
    connectionGems.forEach((gem, index) => {
      gem.scale.setScalar(connections[index] ? 1.25 : 0.78);
    });
    routePlatforms.forEach((platform, index) => {
      const touching = connections[index] || connections[index + 1] || false;
      platform.glowMaterial.color.set(touching ? "#69c4a5" : "#b26b4f");
      platform.glowMaterial.opacity = touching ? 0.82 : 0.36;
      platform.envelopeMaterial.color.set(touching ? "#76c5ae" : "#87a89e");
      platform.envelopeMaterial.opacity = touching ? 0.28 : 0.14;
      platform.destinationMaterial.opacity = touching ? 1 : 0.34;
    });
    solved = connections.every(Boolean);
    portalTarget = solved ? 1 : 0;
    return connections;
  }

  function summary() {
    const count = connectionCount();
    if (solved) return "重力路径 6/6 · 门瓣展开，选择旅行光球前往作品";
    const firstBroken = connectionDefinitions.findIndex((definition) => !connectionOpen(definition));
    const label = firstBroken >= 0 ? firstBroken + 1 : 6;
    return `重力路径 ${count}/6 · 第 ${label} 段尚未对齐`;
  }

  function updateStatus(announce = false) {
    const message = summary();
    if (message === statusText) return;
    statusText = message;
    statusLabel = replaceText(
      statusLabel,
      2.35,
      0.2,
      message,
      [0.02, 0.76, 3.03],
      group,
      { color: solved ? "#1e5a47" : "#673b32", fontSize: 58, background: "#e8dfcb" },
    );
    if (announce) kit.status?.(message);
    kit.invalidate?.();
  }

  function setPlatformQuarter(index, quarter, announce = false) {
    const platform = routePlatforms[index];
    if (!platform) return false;
    platform.quarter = wrapIndex(quarter, 4);
    platform.targetAngle = platform.quarter * HALF_PI;
    if (kit.reducedMotion?.()) platform.spin.rotation.y = platform.targetAngle;
    const connections = updateConnectionVisuals();
    if (kit.reducedMotion?.()) applyPortalImmediate(solved);
    updateStatus(announce);
    kit.invalidate?.();
    return connections.every(Boolean);
  }

  function bindRoad(index) {
    const platform = routePlatforms[index];
    let downAngle = platform.spin.rotation.y;
    let dragAngle = downAngle;
    const descriptor = {
      id: `road-joint-${index}`,
      label: `道路关节 ${index + 1}`,
      anchor: [0, 0.055, 0.19],
      hint: "左右拖动让道路旋转并吸附到 90°；也可点击或用方向键旋转",
      onDown() {
        platform.dragging = true;
        downAngle = platform.spin.rotation.y;
        dragAngle = downAngle;
        platform.glowMaterial.opacity = 1;
        kit.status?.(`道路 ${index + 1}：拖动到与相邻接口对齐`);
      },
      onDrag(context) {
        const horizontal = Number(context.dx) || 0;
        const vertical = Number(context.dy) || 0;
        dragAngle += (horizontal - vertical) * 0.014;
        platform.spin.rotation.y = dragAngle;
        platform.gear.rotation.z += (horizontal - vertical) * 0.032;
        updateConnectionVisuals();
        kit.invalidate?.();
      },
      onUp() {
        platform.dragging = false;
        const quarter = Math.round(normalizeAngle(platform.spin.rotation.y) / HALF_PI);
        setPlatformQuarter(index, quarter, true);
      },
      onClick() {
        setPlatformQuarter(index, platform.quarter + 1, true);
      },
      onKey(key) {
        const direction = routeDirectionKey(key);
        if (direction === "right" || direction === "forward") {
          setPlatformQuarter(index, platform.quarter + 1, true);
        } else if (direction === "left" || direction === "backward") {
          setPlatformQuarter(index, platform.quarter - 1, true);
        }
      },
    };
    kit.register(platform.hit, descriptor);
  }

  for (let index = 0; index < routePlatforms.length; index += 1) bindRoad(index);

  function findPath(from, to) {
    const connections = connectionDefinitions.map(connectionOpen);
    const queue = [from];
    const previous = new Map([[from, -1]]);
    while (queue.length) {
      const node = queue.shift();
      for (const direction of [-1, 1]) {
        const edge = Math.min(node, node + direction);
        const next = node + direction;
        if (next < 0 || next >= routeNodes.length || !connections[edge] || previous.has(next)) continue;
        previous.set(next, node);
        if (next === to) {
          const path = [to];
          let cursor = to;
          while (cursor !== from) {
            cursor = previous.get(cursor);
            if (cursor == null || cursor < 0) return [];
            path.unshift(cursor);
          }
          return path;
        }
        queue.push(next);
      }
    }
    return from === to ? [from] : [];
  }

  function setTravelerAtNode(node) {
    travelerNode = clamp(Math.round(node), 0, routeNodes.length - 1);
    travelerFrom = travelerNode;
    travelerTo = travelerNode;
    travelerProgress = 1;
    travelQueue = [];
    traveler.position.copy(routeNodes[travelerNode].position);
    traveler.position.y += 0.18;
    kit.invalidate?.();
  }

  function beginNextTravelSegment() {
    if (!travelQueue.length) {
      travelerProgress = 1;
      kit.status?.(`旅行光球抵达 ${routeNodes[travelerNode].name}`);
      return false;
    }
    travelerFrom = travelerNode;
    travelerTo = travelQueue.shift();
    travelerProgress = 0;
    return true;
  }

  function travelToNode(target, announce = true) {
    const destination = clamp(Math.round(Number(target) || 0), 0, routeNodes.length - 1);
    const path = findPath(travelerNode, destination);
    if (!path.length || (destination !== travelerNode && path.length === 1)) {
      if (announce) {
        const message = `无法前往 ${routeNodes[destination].name}：道路连接中断`;
        kit.status?.(message);
      }
      return false;
    }
    travelQueue = path.slice(1);
    if (!travelQueue.length) {
      if (announce) kit.status?.(`旅行光球已在 ${routeNodes[travelerNode].name}`);
      return true;
    }
    if (kit.reducedMotion?.()) {
      setTravelerAtNode(destination);
      updateTrail();
      if (announce) kit.status?.(`旅行光球抵达 ${routeNodes[destination].name}`);
      return true;
    }
    beginNextTravelSegment();
    if (announce) kit.status?.(`旅行光球前往 ${routeNodes[destination].name}`);
    kit.invalidate?.();
    return true;
  }

  function registerDestination(platformIndex) {
    const targetNode = platformIndex + 1;
    kit.register(routePlatforms[platformIndex].destination, {
      id: `destination-${platformIndex}`,
      label: `${routeNodes[targetNode].name}目的地`,
      anchor: [0, 0, 0],
      hint: "点击后，旅行光球只会沿已经接通的道路前进",
      onClick() {
        travelToNode(targetNode, true);
      },
      onKey(key) {
        if (routeDirectionKey(key) === "activate") travelToNode(targetNode, true);
      },
    });
  }
  for (let index = 0; index < routePlatforms.length; index += 1) registerDestination(index);

  const portalHitMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
    side: THREE.DoubleSide,
  }));
  const portalHit = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(2.95, 3.15)), portalHitMaterial);
  portalHit.position.z = 0.3;
  portal.add(portalHit);
  kit.register(portalHit, {
    id: "portal-destination",
    label: "传送门终点",
    anchor: [0, 0, 0],
    hint: "接通道路后点击，让光球沿路抵达；抵达后再点一次阅读作品",
    onClick() {
      if (solved && travelerNode === 6 && travelerProgress >= 1 && games[selected]) {
        kit.onSelect?.("games", selected);
      } else travelToNode(6, true);
    },
    onKey(key) {
      if (routeDirectionKey(key) === "activate") travelToNode(6, true);
    },
  });

  let gravityDragAngle = 0;
  kit.register(gravityHandleHit, {
    id: "gravity-ring",
    label: "重力环握柄",
    anchor: [0, 0, 0],
    hint: "上下拖动改变局部重力方向与阶梯朝向；点击每次转 45°",
    onDown() {
      gravityDragging = true;
      gravityDragAngle = gravityTarget;
      gravityGlowMaterial.opacity = 0.42;
      kit.status?.("重力环：拖动以折叠局部方向");
    },
    onDrag(context) {
      const horizontal = Number(context.dx) || 0;
      const vertical = Number(context.dy) || 0;
      gravityDragAngle += horizontal * 0.006 - vertical * 0.012;
      gravityAngle = gravityDragAngle;
      gravityShell.rotation.z = gravityAngle;
      gravityRotor.rotation.z = gravityAngle;
      kit.invalidate?.();
    },
    onUp() {
      gravityDragging = false;
      gravityTarget = Math.round(gravityDragAngle / QUARTER_PI) * QUARTER_PI;
      gravityAngle = gravityTarget;
      gravityGlowMaterial.opacity = 0.14;
      const degrees = Math.round(normalizeAngle(gravityTarget) * 180 / Math.PI);
      kit.status?.(`局部重力已折叠至 ${degrees}°`);
      kit.invalidate?.();
    },
    onClick() {
      gravityTarget += QUARTER_PI;
      if (kit.reducedMotion?.()) applyGravityImmediate();
      const degrees = Math.round(normalizeAngle(gravityTarget) * 180 / Math.PI);
      kit.status?.(`局部重力已折叠至 ${degrees}°`);
      kit.invalidate?.();
    },
    onKey(key) {
      const direction = routeDirectionKey(key);
      if (direction === "right" || direction === "up" || direction === "forward") {
        gravityTarget += QUARTER_PI;
      } else if (direction === "left" || direction === "down" || direction === "backward") {
        gravityTarget -= QUARTER_PI;
      } else return;
      if (kit.reducedMotion?.()) applyGravityImmediate();
      kit.invalidate?.();
    },
  });

  kit.register(resetHit, {
    id: "reset-console",
    label: "重力校准复位",
    anchor: [0, 0, 0],
    hint: "按下后恢复道路、重力环与旅行光球",
    onClick() {
      reset();
    },
    onKey(key) {
      if (routeDirectionKey(key) === "activate") reset();
    },
  });

  let travelerDragStart = 0;
  kit.register(travelerHit, {
    id: "traveler-orb",
    label: "旅行光球",
    anchor: [0, 0, 0],
    hint: "上下拖动沿已接通路径预览，松手后移动；点击前进一步",
    onDown() {
      draggingTraveler = true;
      travelerDragStart = travelerNode;
      dragTravelPath = [travelerNode];
      kit.status?.("旅行光球：沿亮起的路径拖动");
    },
    onDrag(context) {
      const vertical = Number(context.totalY) || 0;
      const steps = Math.round(-vertical / 42);
      const destination = clamp(travelerDragStart + steps, 0, routeNodes.length - 1);
      dragTravelPath = findPath(travelerNode, destination);
      if (!dragTravelPath.length) {
        dragTravelPath = [travelerNode];
        previewTravelerPosition = routeNodes[travelerNode].position.clone();
      } else {
        const fraction = clamp(Math.abs(vertical) / 84, 0, dragTravelPath.length - 1);
        previewTravelerPosition = samplePath(dragTravelPath, fraction);
      }
      if (previewTravelerPosition) {
        traveler.position.copy(previewTravelerPosition);
        traveler.position.y += 0.18;
      }
      kit.invalidate?.();
    },
    onUp() {
      draggingTraveler = false;
      if (dragTravelPath.length > 1) {
        const destination = dragTravelPath[dragTravelPath.length - 1];
        travelerNode = travelerDragStart;
        travelToNode(destination, true);
      } else {
        setTravelerAtNode(travelerDragStart);
        kit.status?.("旅行光球前方路径尚未接通");
      }
      dragTravelPath = [];
      previewTravelerPosition = null;
    },
    onClick() {
      if (travelerNode >= routeNodes.length - 1) {
        if (solved && games[selected]) {
          kit.onSelect?.("games", selected);
          return;
        }
        travelerNode = 0;
        setTravelerAtNode(0);
        kit.status?.("旅行光球回到起点");
        return;
      }
      travelToNode(travelerNode + 1, true);
    },
    onKey(key) {
      const direction = routeDirectionKey(key);
      if (direction === "right" || direction === "up" || direction === "forward") {
        travelToNode(travelerNode + 1, true);
      } else if (direction === "left" || direction === "down" || direction === "backward") {
        travelToNode(travelerNode - 1, true);
      }
    },
  });

  function samplePath(path, fraction) {
    if (!path.length) return new THREE.Vector3();
    if (path.length === 1) return routeNodes[path[0]].position.clone();
    const segmentPosition = clamp(fraction, 0, path.length - 1);
    const segment = Math.min(Math.floor(segmentPosition), path.length - 2);
    const local = segmentPosition - segment;
    return routeNodes[path[segment]].position.clone().lerp(routeNodes[path[segment + 1]].position, local);
  }

  function updateTrail() {
    const positions = travelerTrailGeometry.attributes.position.array;
    let count = 0;
    const trailNodes = dragTravelPath.length > 1
      ? dragTravelPath
      : travelQueue.length
        ? [travelerFrom, travelerTo, ...travelQueue]
        : [travelerNode];
    trailNodes.forEach((node) => {
      if (count >= 24) return;
      const position = routeNodes[node].position;
      positions[count * 3] = position.x;
      positions[count * 3 + 1] = position.y + 0.18;
      positions[count * 3 + 2] = position.z;
      count += 1;
    });
    travelerTrailGeometry.attributes.position.needsUpdate = true;
    travelerTrailGeometry.setDrawRange(0, count);
  }

  function setSelected(index, notify = false) {
    if (!games.length) {
      selected = -1;
      if (portalImageMaterial) portalImageMaterial.map = null;
      selectedLabel = replaceText(
        selectedLabel,
        1.52,
        0.13,
        "NO GAME SELECTED",
        [0, -1.92, 0.275],
        portal,
        { color: "#efe7d3", fontSize: 56 },
      );
      return false;
    }
    selected = wrapIndex(index, games.length);
    const item = games[selected];
    if (portalImageMaterial && item?.image && typeof kit.texture === "function") {
      const texture = kit.texture(item.image);
      if (texture) {
        portalImageMaterial.map = texture;
        portalImageMaterial.color.set("#ffffff");
        portalImageMaterial.needsUpdate = true;
      }
    }
    selectedLabel = replaceText(
      selectedLabel,
      1.52,
      0.13,
      shortText(item?.title || "", 30),
      [0, -1.92, 0.275],
      portal,
      { color: "#efe7d3", fontSize: 56 },
    );
    if (notify) kit.status?.(`已装载真实游戏：${item?.title || ""}`);
    kit.invalidate?.();
    return selected;
  }

  function reset() {
    initialQuarters.forEach((quarter, index) => {
      setPlatformQuarter(index, quarter, false);
      routePlatforms[index].spin.rotation.y = quarter * HALF_PI;
    });
    gravityTarget = 0;
    applyGravityImmediate();
    applyPortalImmediate(false);
    setTravelerAtNode(0);
    resetPulse = 1;
    updateConnectionVisuals();
    updateStatus(true);
    kit.status?.("重力折叠乐园已复位，可以重新排列道路");
  }

  initializeGate();

  function initializeGate() {
    setTravelerAtNode(0);
    updateConnectionVisuals();
    updateStatus(false);
    if (games.length) setSelected(0, false);
  }

  updateTrail();

  function update(time, delta, isActive) {
    if (!isActive || !active) return;
    const dt = clamp(Number(delta) || 0, 0, 0.08);
    lastTime = Number(time) || lastTime;

    routePlatforms.forEach((platform, index) => {
      if (!platform.dragging) {
        platform.spin.rotation.y = dampAngle(
          platform.spin.rotation.y,
          platform.targetAngle,
          kit.reducedMotion?.() ? 20 : 9,
          dt,
        );
      }
      platform.gear.rotation.z += dt * (0.22 + index * 0.015);
    });
    const solvedBeforeAnimation = solved;
    updateConnectionVisuals();
    if (solved !== solvedBeforeAnimation) updateStatus(true);

    if (!gravityDragging) {
      gravityAngle = dampAngle(
        gravityAngle,
        gravityTarget,
        kit.reducedMotion?.() ? 20 : 6,
        dt,
      );
      gravityShell.rotation.z = gravityAngle;
      gravityRotor.rotation.z = gravityAngle;
    }
    gravityHub.rotation.z += dt * 0.08;

    shardGroups.forEach((shard, index) => {
      shard.holder.position.y = shard.baseY + Math.sin(lastTime * 0.55 + shard.phase) * 0.055;
      shard.holder.rotation.z = 0.08 * Math.cos(index * 1.7) + Math.sin(lastTime * 0.32 + shard.phase) * 0.025;
    });

    portalOpen = damp(portalOpen, portalTarget, 5.5, dt);
    petals.forEach((petal, index) => {
      petal.group.position.lerpVectors(petal.closed, petal.open, portalOpen);
      petal.group.rotation.z = damp(
        petal.group.rotation.z,
        petal.closedRotation + (petal.openRotation - petal.closedRotation) * portalOpen,
        6,
        dt,
      );
      petal.surface.material.opacity = 1;
      petal.group.scale.setScalar(1 - portalOpen * 0.08);
    });
    if (portalImageMaterial) {
      portalImageMaterial.opacity = damp(portalImageMaterial.opacity, solved ? 0.98 : 0, 5, dt);
    }
    gravityGlowMaterial.opacity = damp(
      gravityGlowMaterial.opacity,
      gravityDragging ? 0.38 : 0.1 + Math.sin(lastTime * 0.8) * 0.025,
      4,
      dt,
    );

    if (travelerProgress < 1) {
      travelerProgress = Math.min(1, travelerProgress + dt * 1.65);
      const from = routeNodes[travelerFrom].position;
      const to = routeNodes[travelerTo].position;
      traveler.position.lerpVectors(from, to, travelerProgress);
      traveler.position.y += 0.18 + Math.sin(travelerProgress * Math.PI) * 0.22;
      if (travelerProgress >= 1) {
        travelerNode = travelerTo;
        if (!beginNextTravelSegment()) updateTrail();
      }
    } else if (!draggingTraveler) {
      traveler.position.copy(routeNodes[travelerNode].position);
      traveler.position.y += 0.18 + Math.sin(lastTime * 1.7) * 0.025;
    }

    travelerRings.forEach((ring, index) => {
      ring.rotation.x += dt * (0.26 + index * 0.06);
      ring.rotation.y += dt * (0.18 + index * 0.04);
    });
    travelerTrailMaterial.opacity = 0.36 + Math.sin(lastTime * 1.1) * 0.08;
    updateTrail();

    resetPulse = Math.max(0, resetPulse - dt * 2.2);
    resetGear.rotation.z += dt * (0.08 + resetPulse * 6);
  }

  function interact(action, index) {
    const normalized = String(action || "").toLowerCase();
    if (normalized === "rotate") {
      const platformIndex = Number.isFinite(Number(index))
        ? clamp(Math.round(Number(index)), 0, routePlatforms.length - 1)
        : Math.max(0, connectionDefinitions.findIndex((definition) => !connectionOpen(definition))) % routePlatforms.length;
      return setPlatformQuarter(platformIndex, routePlatforms[platformIndex].quarter + 1, true);
    }
    if (normalized === "gravity") {
      gravityTarget += QUARTER_PI;
      if (kit.reducedMotion?.()) applyGravityImmediate();
      kit.status?.(`局部重力已折叠至 ${Math.round(normalizeAngle(gravityTarget) * 180 / Math.PI)}°`);
      kit.invalidate?.();
      return gravityTarget;
    }
    if (normalized === "travel") return travelToNode(index, true);
    if (normalized === "select" && Number.isFinite(Number(index))) return setSelected(index, true);
    if (normalized === "next") return setSelected(selected + 1, true);
    if (normalized === "reset") {
      reset();
      return true;
    }
    return false;
  }

  function getState() {
    return {
      platformAngles: routePlatforms.map((platform) => Math.round(normalizeAngle(platform.spin.rotation.y) * 180 / Math.PI)),
      connections: connectionDefinitions.map(connectionOpen),
      traveler: {
        node: travelerNode,
        label: routeNodes[travelerNode]?.name || "",
        moving: travelerProgress < 1,
        previewing: draggingTraveler,
      },
      solved,
      selected,
      gravityAngle: Math.round(normalizeAngle(gravityAngle) * 180 / Math.PI),
      dragging: gravityDragging
        ? "gravity-ring"
        : draggingTraveler
          ? "traveler-orb"
          : routePlatforms.findIndex((platform) => platform.dragging) >= 0
            ? `road-joint-${routePlatforms.findIndex((platform) => platform.dragging)}`
            : null,
      gateOpen: portalOpen > 0.92,
      active,
    };
  }

  function setActive(value) {
    active = Boolean(value);
    if (!active) {
      gravityDragging = false;
      draggingTraveler = false;
      routePlatforms.forEach((platform) => { platform.dragging = false; });
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
    focus: new THREE.Vector3(0, 3.15, 0),
    update,
    interact,
    getState,
    setActive,
    dispose,
  };
}
