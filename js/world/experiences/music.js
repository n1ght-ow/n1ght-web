const TAU = Math.PI * 2;
const STRING_SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 24];

export function buildExperience(kit) {
  const THREE = kit?.THREE;
  if (!THREE || !kit.sculpt || typeof kit.mesh !== "function") {
    throw new TypeError("music experience requires the shared Three.js experience kit");
  }

  const sculpt = kit.sculpt;
  const collection = kit.collection || { id: "music", items: [] };
  const items = Array.isArray(collection.items) ? collection.items.filter(Boolean) : [];
  const group = new THREE.Group();
  group.name = "resonance-tide-engine";

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
  const ownObjectResources = (object, ownSharedMaterial = false) => {
    if (!object) return object;
    ownGeometry(object.geometry);
    const materials = object.material == null ? [] : [object.material].flat();
    for (const material of materials) {
      if (ownSharedMaterial) ownMaterial(material);
      for (const value of Object.values(material || {})) {
        if (value?.isTexture && ownSharedMaterial) ownTexture(value);
      }
    }
    if (object.isInstancedMesh) ownedInstanced.add(object);
    return object;
  };

  const resolveMaterial = (value, fallback, roughness = 0.62, metalness = 0) => {
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
  const brass = resolveMaterial(kit.brass, 0xa98143, 0.28, 0.76);
  const copper = resolveMaterial(0x9a6040, 0x9a6040, 0.34, 0.72);
  const darkCopper = resolveMaterial(0x5d4637, 0x5d4637, 0.48, 0.54);
  const porcelain = resolveMaterial(kit.cream, 0xeee8db, 0.72, 0.02);
  const stone = resolveMaterial(kit.stone, 0xa8a397, 0.9, 0.02);
  const blackLacquer = localMaterial({ color: 0x101716, roughness: 0.2, metalness: 0.24 });
  const lake = localMaterial({
    color: 0x075269,
    roughness: 0.28,
    metalness: 0.3,
    emissive: 0x063d50,
    emissiveIntensity: 0.75,
  });
  const lakeGlow = ownMaterial(new THREE.MeshBasicMaterial({
    color: 0x55d9e7,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
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
  const unitCylinder = ownGeometry(new THREE.CylinderGeometry(1, 1, 1, 24));
  const rivetGeometry = ownGeometry(new THREE.SphereGeometry(0.035, 8, 6));

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
  const addLathe = (profile, material, parent, position, segments = 64) => {
    const node = sculpt.lathe(profile, material, parent, position, segments);
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
  const addGear = (radius, depth, teeth, material, parent, position) => {
    const node = sculpt.gear(radius, depth, teeth, material, parent, position);
    ownObjectResources(node);
    if (node) node.castShadow = true;
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
      color: options.color || "#d8c89d",
      fontSize: options.fontSize || 44,
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
  const addLine = (points, color, parent = group) => {
    if (typeof kit.line !== "function") return null;
    return kit.line(points, color, parent);
  };

  const state = {
    energy: 0.1,
    frequency: 264,
    selected: -1,
    plucks: 0,
    playing: false,
    spinAngle: 0.18,
    spinVelocity: 0.16,
    strikeCount: 0,
  };
  let activeNow = true;
  let disposed = false;
  let draggingRotor = false;
  let draggingFrequency = false;
  let frequencyStart = state.frequency;
  let lastTime = 0;
  let lastStatusAt = -Infinity;
  let pressurePulse = 0;
  let selectedCover = null;
  const stringImpulses = new Float32Array(STRING_SCALE.length);
  const stringBases = [];
  const gears = [];
  const waveBases = [];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const damp = (current, target, smoothing, delta) =>
    current + (target - current) * (1 - Math.exp(-smoothing * Math.max(0, delta)));
  const frequencyNormalized = () => (state.frequency - 110) / 770;
  const shortText = (value, length = 26) => {
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

  // Three separated footings replace the old circular tray and carry a visible
  // cam train into the suspended rotor.
  const foundation = new THREE.Group();
  foundation.name = "split-seismic-footings";
  group.add(foundation);
  const footAnchors = [];
  for (let index = 0; index < 3; index += 1) {
    const angle = index / 3 * TAU + Math.PI / 6;
    const foot = new THREE.Group();
    foot.position.set(Math.sin(angle) * 2.95, 0.28, Math.cos(angle) * 2.2);
    foot.rotation.y = angle;
    foundation.add(foot);
    addRounded(1.24, 0.38, 0.92, stone, foot, [0, 0, 0], 0.1);
    addRounded(0.92, 0.2, 0.72, porcelain, foot, [0.04, 0.27, 0], 0.08);
    addCylinder(0.14, 0.34, brass, 0, 0.48, 0, foot);
    for (const side of [-1, 1]) {
      addBox(copper, 0.08, 0.44, 0.08, side * 0.42, 0.43, -0.24, foot, [0, 0, side * 0.15]);
    }
    footAnchors.push(new THREE.Vector3(foot.position.x, 0.58, foot.position.z));
  }
  addTube(
    [footAnchors[0], new THREE.Vector3(-1.3, 0.82, -0.2), new THREE.Vector3(0, 1.18, 0)],
    0.055,
    brass,
    foundation,
    48,
    7,
  );
  addTube(
    [footAnchors[1], new THREE.Vector3(1.6, 0.98, -0.5), new THREE.Vector3(0.35, 1.36, 0)],
    0.046,
    darkCopper,
    foundation,
    48,
    7,
  );
  addTube(
    [footAnchors[2], new THREE.Vector3(0.1, 0.74, 1.8), new THREE.Vector3(0, 1.1, 0.45)],
    0.04,
    brass,
    foundation,
    48,
    7,
  );

  const drive = new THREE.Group();
  drive.name = "compound-cam-drive";
  drive.position.set(0, 1.24, 0);
  group.add(drive);
  const gearSpecs = [
    [-1.38, 0.4, 0.48, 18, copper],
    [1.42, 0.22, 0.56, 22, brass],
    [0.2, -0.42, 0.34, 14, darkCopper],
  ];
  for (const [x, z, radius, teeth, material] of gearSpecs) {
    const gear = addGear(radius, 0.1, teeth, material, drive, [x, 0, z]);
    if (gear) gears.push(gear);
    addCylinder(0.12, 0.22, blackLacquer, x, 0, z, drive, [Math.PI / 2, 0, 0]);
    addRing(radius * 0.53, 0.018, lakeGlow, drive, [x, 0, z + 0.065]);
  }
  const couplingPlacements = [];
  for (let index = 0; index < 3; index += 1) {
    for (let ridge = 0; ridge < 8; ridge += 1) {
      const angle = ridge / 8 * TAU + index * 0.17;
      const radius = 0.55 + index * 0.08;
      couplingPlacements.push({
        position: [Math.sin(angle) * radius - 0.4 + index * 0.35, Math.cos(angle) * radius * 0.5, 0.18],
        rotation: [0, 0, angle],
        scale: [1, 1, 1],
      });
    }
  }
  addInstances(rivetGeometry, lakeGlow, couplingPlacements, drive);

  const frame = new THREE.Group();
  frame.name = "string-and-pipe-frame";
  frame.position.z = -0.92;
  group.add(frame);
  for (const side of [-1, 1]) {
    addTube(
      [
        [side * 2.62, 0.55, 0.28],
        [side * 3.02, 2.18, 0.48],
        [side * 2.46, 5.72, 0.18],
        [side * 1.46, 7.25, 0],
      ],
      0.055,
      side > 0 ? brass : copper,
      frame,
      56,
      7,
    );
  }
  addTube(
    [
      [-2.92, 6.76, 0.26],
      [-1.38, 7.42, 0.08],
      [0.18, 7.2, 0],
      [1.62, 7.42, 0.1],
      [2.86, 6.68, 0.28],
    ],
    0.05,
    brass,
    frame,
    64,
    7,
  );
  const ribPlacements = [];
  for (let index = 0; index < 22; index += 1) {
    const t = index / 21;
    const x = -2.72 + t * 5.44;
    const y = 6.88 + Math.sin(t * Math.PI) * 0.38;
    ribPlacements.push({
      position: [x, y, 0.22],
      rotation: [0, 0, -0.8 + t * 1.6],
      scale: [1, 0.52 + (index % 4) * 0.08, 1],
    });
  }
  addInstances(
    new THREE.CylinderGeometry(0.014, 0.014, 1, 5),
    porcelain,
    ribPlacements,
    frame,
  );

  const rotorRoot = new THREE.Group();
  rotorRoot.name = "giant-resonance-wheel";
  rotorRoot.position.set(0.05, 3.32, 0.12);
  group.add(rotorRoot);
  const rotor = new THREE.Group();
  rotorRoot.add(rotor);

  const discProfile = [
    [0, -0.12],
    [1.5, -0.15],
    [1.76, -0.08],
    [1.86, 0],
    [1.76, 0.1],
    [0.58, 0.14],
    [0, 0.11],
  ];
  const disc = addLathe(discProfile, blackLacquer, rotor, [0, 0, 0], 80);
  if (disc) disc.rotation.x = Math.PI / 2;
  const hub = addLathe(
    [
      [0, -0.32],
      [0.36, -0.28],
      [0.48, -0.12],
      [0.43, 0.18],
      [0.22, 0.29],
      [0, 0.32],
    ],
    copper,
    rotor,
    [0, 0, 0],
    48,
  );
  if (hub) hub.rotation.x = Math.PI / 2;
  for (let index = 0; index < 4; index += 1) {
    addRing(0.66 + index * 0.27, 0.014 + index * 0.002, index % 2 ? brass : lakeGlow, rotor, [0, 0, 0.17]);
  }
  addRing(1.82, 0.055, brass, rotor, [0, 0, 0.12]);
  addRing(1.56, 0.018, lakeGlow, rotor, [0, 0, 0.19]);

  const spokePlacements = [];
  for (let index = 0; index < 16; index += 1) {
    const angle = index / 16 * TAU;
    spokePlacements.push({
      position: [0, 0, 0.15],
      rotation: [0, 0, angle],
      scale: [1, 1.45 + (index % 3) * 0.12, 1],
    });
  }
  addInstances(new THREE.BoxGeometry(0.035, 1, 0.06), copper, spokePlacements, rotor);

  const shaderGeometry = ownGeometry(new THREE.CircleGeometry(1.73, 96, 0, TAU));
  const waveMaterial = ownMaterial(new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uEnergy: { value: state.energy },
      uFrequency: { value: state.frequency },
      uColorA: { value: new THREE.Color(0x043b53) },
      uColorB: { value: new THREE.Color(0x4fe3eb) },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uEnergy;
      uniform float uFrequency;
      varying vec2 vUv;
      varying float vWave;

      void main() {
        vUv = uv;
        vec3 transformed = position;
        float radius = length(position.xy);
        float phase = radius * (3.2 + uFrequency * 0.018) - uTime * (1.2 + uEnergy * 8.0);
        float wave = sin(phase) * cos(position.x * 3.0 - position.y * 2.0 + uTime);
        float edgeFade = 1.0 - smoothstep(1.48, 1.72, radius);
        transformed.z += wave * (0.018 + uEnergy * 0.14) * edgeFade;
        vWave = wave;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uEnergy;
      uniform float uTime;
      varying vec2 vUv;
      varying float vWave;

      void main() {
        float radial = length(vUv - 0.5) * 2.0;
        float rings = 0.5 + 0.5 * sin(radial * 94.0 - uTime * 3.5);
        float crest = smoothstep(0.22, 1.0, rings * (0.55 + uEnergy * 0.65) + vWave * 0.12);
        vec3 color = mix(uColorA, uColorB, crest);
        float alpha = (0.22 + uEnergy * 0.56) * (1.0 - smoothstep(0.82, 1.0, radial));
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }));
  const shaderDisc = addMesh(shaderGeometry, waveMaterial, 0, 0, 0.21, rotor);
  if (shaderDisc) {
    shaderDisc.castShadow = false;
    shaderDisc.receiveShadow = false;
    shaderDisc.renderOrder = 4;
  }

  const waveFinsGeometry = new THREE.BoxGeometry(0.035, 0.3, 0.07);
  const wavePlacements = [];
  for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
    for (let index = 0; index < 16; index += 1) {
      const angle = index / 16 * TAU + ringIndex * 0.071;
      const radius = 1.02 + ringIndex * 0.26;
      wavePlacements.push({
        position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0.24 + ringIndex * 0.014],
        rotation: [0, 0, -angle],
        scale: [1, 0.66 + (index % 5) * 0.1, 1],
      });
      waveBases.push({ angle, radius, ringIndex, index });
    }
  }
  const waveFins = addInstances(waveFinsGeometry, lakeGlow, wavePlacements, rotor);
  if (waveFins) {
    waveFins.frustumCulled = false;
    waveFins.renderOrder = 3;
  }

  const rotorProxy = addMesh(
    ownGeometry(new THREE.CylinderGeometry(1.9, 1.9, 0.16, 32)),
    proxyMaterial,
    0,
    0,
    0.34,
    rotorRoot,
  );
  const rotorHandler = {
    id: "resonance-rotor",
    label: "搓盘曲柄",
    hint: "按住曲柄或盘面斜向拖动，向装置注入旋转能量",
    anchor: [0, 0, 0],
    onDown() {
      ensureAudio();
      draggingRotor = true;
      rotor.userData.dragMomentum = 0;
    },
    onDrag({ dx = 0, dy = 0 } = {}) {
      const momentum = Number(rotor.userData.dragMomentum) || 0;
      const impulse = clamp(dx - dy * 0.32, -28, 28);
      rotor.userData.dragMomentum = momentum * 0.72 + impulse * 0.08;
      state.spinVelocity = clamp(state.spinVelocity * 0.38 + impulse * 0.055, -8.5, 8.5);
      state.spinAngle += Math.abs(dx + dy) * 0.0035 + impulse * 0.0025;
      state.energy = clamp(state.energy + (Math.abs(dx) + Math.abs(dy)) / 620, 0.06, 1);
      state.playing = state.playing || state.energy > 0.12;
      const now = lastTime;
      if (now - lastStatusAt > 0.16) {
        status(
          `搓盘曲柄 ${Math.abs(state.spinVelocity).toFixed(1)} 转/秒 · 能量 ${Math.round(state.energy * 100)}%`,
        );
        lastStatusAt = now;
      }
      invalidate();
    },
    onUp() {
      draggingRotor = false;
      status(
        `装置音色 · 共振 ${Math.round(state.energy * 100)}% · 频率 ${Math.round(state.frequency)} Hz`,
      );
    },
    onClick() {
      ensureAudio();
      state.spinVelocity = clamp(state.spinVelocity + 1.45, -8.5, 8.5);
      state.energy = clamp(state.energy + 0.055, 0, 1);
      status("共振盘获得一次短促启动。");
      invalidate();
    },
    onKey(key) {
      ensureAudio();
      if (key === "ArrowLeft" || key === "ArrowDown") {
        state.spinVelocity = clamp(state.spinVelocity - 0.6, -8.5, 8.5);
      } else if (key === "ArrowRight" || key === "ArrowUp") {
        state.spinVelocity = clamp(state.spinVelocity + 0.6, -8.5, 8.5);
      } else if (key === "Enter" || key === " ") {
        state.energy = clamp(state.energy + 0.08, 0, 1);
      } else {
        return;
      }
      invalidate();
    },
  };

  // A front-right crank rides on the rotor. Its grip sits outside the string
  // fan and receives a deliberately large proxy before the full-disc proxy.
  const crankRoot = new THREE.Group();
  crankRoot.name = "resonance-crank";
  crankRoot.position.set(1.58, -0.18, 0.58);
  crankRoot.rotation.z = -0.16;
  rotor.add(crankRoot);
  addCylinder(0.11, 0.18, blackLacquer, 0, 0, 0, crankRoot, [Math.PI / 2, 0, 0]);
  addCylinder(0.045, 0.76, brass, 0.31, 0, 0, crankRoot, [0, 0, Math.PI / 2]);
  addCylinder(0.12, 0.16, darkCopper, 0.69, 0, 0, crankRoot, [Math.PI / 2, 0, 0]);
  addCylinder(0.11, 0.46, porcelain, 0.69, 0, 0.29, crankRoot, [Math.PI / 2, 0, 0]);
  addCylinder(0.072, 0.22, lakeGlow, 0.69, 0, 0.55, crankRoot, [Math.PI / 2, 0, 0]);
  addCylinder(0.15, 0.08, porcelain, 0, 0, 0.15, crankRoot, [Math.PI / 2, 0, 0]);
  addCylinder(0.075, 0.08, lakeGlow, 0, 0, 0.22, crankRoot, [Math.PI / 2, 0, 0]);
  addRing(0.155, 0.028, brass, crankRoot, [0.69, 0, 0.1]);
  addRing(0.155, 0.022, lakeGlow, crankRoot, [0.69, 0, 0.48]);
  const crankProxy = addMesh(
    ownGeometry(new THREE.SphereGeometry(0.32, 12, 9)),
    proxyMaterial,
    0.69,
    0,
    0.29,
    crankRoot,
  );
  if (rotorProxy) {
    rotorProxy.rotation.x = Math.PI / 2;
    rotorProxy.castShadow = false;
    rotorProxy.receiveShadow = false;
    rotorProxy.userData.interactionId = "resonance-rotor";
  }
  if (crankProxy) {
    crankProxy.castShadow = false;
    crankProxy.receiveShadow = false;
    crankProxy.userData.interactionId = "resonance-crank";
    kit.register(crankProxy, {
      ...rotorHandler,
      id: "resonance-crank",
      label: "共振盘曲柄",
      hint: "按住外侧握柄搓动，给共振轮注入能量",
    });
  }
  if (rotorProxy) {
    kit.register(rotorProxy, {
      ...rotorHandler,
      id: "resonance-rotor",
      label: "共振盘",
      hint: "在盘面无弦区域斜向拖动，注入旋转能量",
      anchor: [0.92, 0.2, 0],
    });
  }
  addCylinder(0.21, 0.96, brass, 0, 0, -0.02, rotorRoot, [Math.PI / 2, 0, 0]);
  addCylinder(0.3, 0.12, porcelain, 0, 0, 0.51, rotorRoot, [Math.PI / 2, 0, 0]);
  addCylinder(0.14, 0.1, lakeGlow, 0, 0, 0.59, rotorRoot, [Math.PI / 2, 0, 0]);
  addCylinder(0.28, 0.12, darkCopper, 0, 0, -0.53, rotorRoot, [Math.PI / 2, 0, 0]);

  // A fixed axle carries a short, scaled lever. The dial and its tick marks stay
  // outside the disc so no control cuts across the resonance wheel.
  const frequencyArm = new THREE.Group();
  frequencyArm.name = "frequency-short-arm";
  frequencyArm.position.set(-1.28, 2.2, 1.16);
  frequencyArm.rotation.y = -0.08;
  group.add(frequencyArm);
  addCylinder(0.69, 0.14, blackLacquer, 0, 0, 0, frequencyArm, [Math.PI / 2, 0, 0]);
  addRing(0.64, 0.045, brass, frequencyArm, [0, 0, 0.09]);
  addRing(0.47, 0.014, lakeGlow, frequencyArm, [0, 0, 0.11]);
  addCylinder(0.14, 0.22, darkCopper, 0, 0, 0.14, frequencyArm, [Math.PI / 2, 0, 0]);
  addCylinder(0.075, 0.1, porcelain, 0, 0, 0.26, frequencyArm, [Math.PI / 2, 0, 0]);

  const frequencyTickPlacements = [];
  for (let index = 0; index < 11; index += 1) {
    const amount = index / 10;
    const angle = -0.58 + amount * 1.16;
    frequencyTickPlacements.push({
      position: [Math.sin(angle) * 0.56, Math.cos(angle) * 0.56, 0.115],
      rotation: [0, 0, -angle],
      scale: [index % 5 === 0 ? 1.45 : 0.78, index % 5 === 0 ? 1.35 : 0.84, 1],
    });
  }
  addInstances(
    new THREE.BoxGeometry(0.022, 0.1, 0.018),
    lakeGlow,
    frequencyTickPlacements,
    frequencyArm,
  );
  addText("110", 0.24, 0.075, frequencyArm, [-0.55, -0.5, 0.12], {
    color: "#8fdce1",
    fontSize: 26,
  });
  addText("880", 0.24, 0.075, frequencyArm, [0.55, -0.5, 0.12], {
    color: "#8fdce1",
    fontSize: 26,
  });

  const frequencyLever = new THREE.Group();
  frequencyLever.position.z = 0.18;
  frequencyArm.add(frequencyLever);
  addRounded(0.075, 0.47, 0.07, brass, frequencyLever, [0, 0.23, 0], 0.025);
  addCylinder(0.095, 0.35, brass, 0, 0.47, 0.1, frequencyLever, [Math.PI / 2, 0, 0]);
  addCylinder(0.125, 0.24, porcelain, 0, 0.47, 0.24, frequencyLever, [Math.PI / 2, 0, 0]);
  addCylinder(0.08, 0.09, lakeGlow, 0, 0.47, 0.38, frequencyLever, [Math.PI / 2, 0, 0]);
  addRing(0.15, 0.022, brass, frequencyLever, [0, 0.47, 0.08]);
  addRing(0.15, 0.018, lakeGlow, frequencyLever, [0, 0.47, 0.35]);

  const frequencyProxy = addMesh(
    ownGeometry(new THREE.SphereGeometry(0.29, 12, 9)),
    proxyMaterial,
    0,
    0.47,
    0.26,
    frequencyLever,
  );
  if (frequencyProxy) {
    frequencyProxy.castShadow = false;
    frequencyProxy.receiveShadow = false;
    frequencyProxy.userData.interactionId = "frequency-arm";
    kit.register(frequencyProxy, {
      id: "frequency-arm",
      label: "频率弧形臂",
      hint: "围绕固定轴心左右拖动短弧握柄，改变结构与波形频率",
      anchor: [0, 0, 0],
      onDown() {
        ensureAudio();
        draggingFrequency = true;
        frequencyStart = state.frequency;
      },
      onDrag({ totalX = 0, totalY = 0 } = {}) {
        state.frequency = clamp(frequencyStart + totalX * 1.55 - totalY * 0.72, 110, 880);
        if (lastTime - lastStatusAt > 0.14) {
          status(
            `频率滑臂 ${Math.round(state.frequency)} Hz · 波形密度 ${Math.round(frequencyNormalized() * 100)}%`,
          );
          lastStatusAt = lastTime;
        }
        invalidate();
      },
      onUp() {
        draggingFrequency = false;
        status(`结构频率锁定在 ${Math.round(state.frequency)} Hz。`);
      },
      onClick() {
        ensureAudio();
        state.frequency = state.frequency >= 780 ? 110 : clamp(state.frequency + 55, 110, 880);
        status(`频率滑臂推进至 ${Math.round(state.frequency)} Hz。`);
        invalidate();
      },
      onKey(key) {
        if (key === "ArrowLeft" || key === "ArrowDown") state.frequency = clamp(state.frequency - 22, 110, 880);
        else if (key === "ArrowRight" || key === "ArrowUp") state.frequency = clamp(state.frequency + 22, 110, 880);
        else return;
        invalidate();
      },
    });
  }

  const stringBank = new THREE.Group();
  stringBank.name = "left-rear-resonant-harp";
  stringBank.position.set(-2.74, 0, -0.76);
  stringBank.rotation.y = 0.18;
  group.add(stringBank);
  addTube(
    [
      [-0.82, 2.22, 0.02],
      [-0.88, 4.32, -0.02],
      [-0.7, 6.38, 0],
      [-0.28, 6.72, 0],
    ],
    0.052,
    copper,
    stringBank,
    52,
    7,
  );
  addTube(
    [
      [0.82, 2.22, 0.02],
      [0.88, 4.32, -0.02],
      [0.7, 6.38, 0],
      [0.28, 6.72, 0],
    ],
    0.052,
    brass,
    stringBank,
    52,
    7,
  );
  addTube(
    [
      [-0.78, 6.38, 0],
      [-0.31, 6.78, 0],
      [0.31, 6.78, 0],
      [0.78, 6.38, 0],
    ],
    0.045,
    brass,
    stringBank,
    48,
    7,
  );
  addTube(
    [
      [-0.88, 2.22, 0.02],
      [0, 2.08, 0.08],
      [0.88, 2.22, 0.02],
    ],
    0.052,
    darkCopper,
    stringBank,
    42,
    7,
  );
  for (let index = 0; index < STRING_SCALE.length; index += 1) {
    const spread = STRING_SCALE.length === 1 ? 0.5 : index / (STRING_SCALE.length - 1);
    const topX = -0.58 + spread * 1.16;
    const bottomX = -0.49 + spread * 0.98;
    const top = new THREE.Vector3(topX, 6.43 + Math.sin(index * 1.3) * 0.045, 0.03);
    const bottom = new THREE.Vector3(bottomX, 2.48 + (index % 3) * 0.04, 0.08);
    const midpoint = top.clone().add(bottom).multiplyScalar(0.5);
    const direction = bottom.clone().sub(top);
    const length = direction.length();
    const angle = Math.atan2(direction.x, direction.y);
    stringBases.push({ top, bottom, midpoint, angle, length });
  }
  const stringPlacements = stringBases.map((entry) => ({
    position: entry.midpoint.toArray(),
    rotation: [0, 0, entry.angle],
    scale: [1, entry.length, 1],
  }));
  const stringGeometry = new THREE.CylinderGeometry(0.0085, 0.0085, 1, 5);
  const strings = addInstances(stringGeometry, porcelain, stringPlacements, stringBank);
  if (strings) {
    strings.frustumCulled = false;
    strings.castShadow = false;
  }

  const bridgeGeometry = ownGeometry(new THREE.SphereGeometry(0.045, 9, 7));
  const bridges = [];
  for (let index = 0; index < STRING_SCALE.length; index += 1) {
    const base = stringBases[index];
    const bridge = addMesh(bridgeGeometry, index % 3 === 0 ? lakeGlow : brass, base.bottom.x, base.bottom.y, base.bottom.z, stringBank);
    bridge.rotation.z = index * 0.11;
    bridges.push(bridge);

    const proxyHeight = base.length * 0.92;
    const proxy = addMesh(
      ownGeometry(new THREE.CylinderGeometry(0.16, 0.16, 1, 7)),
      proxyMaterial,
      base.midpoint.x,
      base.midpoint.y,
      base.midpoint.z,
      stringBank,
    );
    proxy.scale.y = proxyHeight;
    proxy.rotation.z = base.angle;
    proxy.castShadow = false;
    proxy.receiveShadow = false;
    proxy.userData.interactionId = `string-${index + 1}`;
    let draggedString = false;
    kit.register(proxy, {
      id: `string-${index + 1}`,
      label: `第 ${index + 1} 根共振弦`,
      hint: "按下或向外拨动，触发该弦位的装置短音",
      anchor: [0, 0, 0],
      onDown() {
        ensureAudio();
        draggedString = false;
      },
      onDrag({ totalX = 0, totalY = 0 } = {}) {
        if (Math.hypot(totalX, totalY) > 9 && !draggedString) {
          draggedString = true;
          pluckString(index);
        }
      },
      onUp() {
        if (draggedString) status("弦列正在把局部振动传回共振盘。");
      },
      onClick() {
        pluckString(index);
      },
      onKey(key) {
        if (key === "Enter" || key === " ") pluckString(index);
      },
    });
  }

  const organBank = new THREE.Group();
  organBank.name = "eleven-organ-pipes";
  organBank.position.set(2.62, 1.36, -1.22);
  organBank.rotation.y = -0.1;
  group.add(organBank);
  const pipeGeometry = new THREE.CylinderGeometry(0.13, 0.19, 1, 16, 1, true);
  const pipeMaterial = localMaterial({
    color: 0x9a6040,
    roughness: 0.32,
    metalness: 0.72,
    side: THREE.DoubleSide,
  });
  const pipePlacements = [];
  for (let index = 0; index < 11; index += 1) {
    const height = 2.0 + (index % 6) * 0.63 + Math.floor(index / 6) * 0.28;
    pipePlacements.push({
      position: [(index % 4) * 0.36 + Math.floor(index / 8) * 0.13, height / 2, -Math.floor(index / 4) * 0.42],
      rotation: [0, 0, (index % 2 ? 1 : -1) * 0.012],
      scale: [0.72 + (index % 3) * 0.13, height, 0.72 + (index % 3) * 0.13],
    });
  }
  addInstances(pipeGeometry, pipeMaterial, pipePlacements, organBank);
  const pipeRimGeometry = new THREE.TorusGeometry(1, 0.09, 6, 18);
  const pipeRimPlacements = pipePlacements.map((entry, index) => ({
    position: [entry.position[0], entry.position[1] * 2 - 0.06, entry.position[2]],
    rotation: [Math.PI / 2, 0, 0],
    scale: [0.22 + (index % 3) * 0.03, 0.22 + (index % 3) * 0.03, 0.22 + (index % 3) * 0.03],
  }));
  addInstances(pipeRimGeometry, brass, pipeRimPlacements, organBank);

  const columns = new THREE.Group();
  columns.name = "acoustic-columns";
  columns.position.set(0, 0.58, -0.82);
  group.add(columns);
  const columnPlacements = [];
  for (let index = 0; index < 9; index += 1) {
    const angle = index / 9 * TAU;
    const height = 0.7 + (index % 4) * 0.34;
    columnPlacements.push({
      position: [Math.cos(angle) * 1.18, height / 2, Math.sin(angle) * 0.62],
      rotation: [0, 0, Math.sin(angle) * 0.08],
      scale: [0.045 + (index % 3) * 0.012, height, 0.045 + (index % 3) * 0.012],
    });
  }
  addInstances(
    new THREE.CylinderGeometry(1, 1, 1, 10),
    lake,
    columnPlacements,
    columns,
  );

  // A pressed ivory key pushes four visible compressor rods; it is not a
  // detail button. Its impact is reflected by rotor energy and the frame.
  const strikeRoot = new THREE.Group();
  strikeRoot.name = "pressure-key";
  strikeRoot.position.set(0.22, 0.68, 2.02);
  group.add(strikeRoot);
  const keyWell = addRounded(1.05, 0.18, 0.7, blackLacquer, strikeRoot, [0, 0, 0], 0.06);
  const keyCap = addRounded(0.8, 0.22, 0.54, porcelain, strikeRoot, [0, 0.16, 0.02], 0.06);
  for (let index = 0; index < 4; index += 1) {
    const x = (index - 1.5) * 0.17;
    addCylinder(0.035, 0.58, brass, x, 0.48, -0.12, strikeRoot);
    addCylinder(0.094, 0.1, index % 2 ? lakeGlow : copper, x, 0.76, -0.12, strikeRoot);
  }
  const strikeProxy = addRounded(1.06, 0.34, 0.74, proxyMaterial, strikeRoot, [0, 0.13, 0.04], 0.06);
  if (strikeProxy) {
    strikeProxy.castShadow = false;
    strikeProxy.receiveShadow = false;
    strikeProxy.userData.interactionId = "pressure-key";
    kit.register(strikeProxy, {
      id: "pressure-key",
      label: "脉冲压键",
      hint: "按下，四支压缩杆会推高能量并触发短和弦",
      anchor: [0, 0, 0],
      onDown() {
        ensureAudio();
        if (keyCap) keyCap.position.y = 0.1;
      },
      onUp() {
        if (keyCap) keyCap.position.y = 0.16;
      },
      onClick() {
        strike();
      },
      onKey(key) {
        if (key === "Enter" || key === " ") strike();
      },
    });
  }

  // The sleeve library is a compact two-shelf rack on the far left. It no
  // longer crosses the pressure key or the swinging crank.
  const rack = new THREE.Group();
  rack.name = "left-album-sleeve-rack";
  rack.position.set(-3.45, 1.06, 0.98);
  rack.rotation.y = 0.3;
  group.add(rack);
  addTube(
    [
      [-1.02, 0.34, 0],
      [-0.84, 0.45, 0.02],
      [0.84, 0.45, 0.02],
      [1.02, 0.34, 0],
    ],
    0.038,
    brass,
    rack,
    42,
    7,
  );
  addTube(
    [
      [-1.02, -0.42, 0],
      [-0.84, -0.33, 0.02],
      [0.84, -0.33, 0.02],
      [1.02, -0.42, 0],
    ],
    0.038,
    copper,
    rack,
    42,
    7,
  );
  for (const side of [-1, 1]) {
    addCylinder(0.034, 1.08, brass, side * 1.0, -0.02, -0.02, rack);
  }
  const coverCount = Math.min(7, items.length);
  for (let index = 0; index < coverCount; index += 1) {
    const sourceIndex = Math.floor(index / Math.max(1, coverCount) * items.length);
    const item = items[sourceIndex];
    const holder = new THREE.Group();
    const topRow = index < 4;
    const rowIndex = topRow ? index : index - 4;
    const rowCount = topRow ? 4 : Math.max(1, coverCount - 4);
    const x = (rowIndex - (rowCount - 1) / 2) * 0.48;
    holder.position.set(x, topRow ? 0.58 : -0.18, 0.08 + rowIndex * 0.008);
    holder.rotation.y = -x * 0.08;
    holder.rotation.z = x * 0.018;
    rack.add(holder);
    addRounded(0.41, 0.41, 0.055, blackLacquer, holder, [0, 0, 0], 0.03);
    if (item?.image && typeof kit.image === "function") {
      const picture = kit.image(item.image, 0.35, 0.35, holder);
      if (picture) {
        picture.position.z = 0.035;
        picture.castShadow = false;
      }
    }
    addText(shortText(item?.title, 11), 0.42, 0.055, holder, [0, -0.26, 0.05], {
      color: "#c8b98f",
      fontSize: 30,
    });
    addCylinder(0.018, 0.2, brass, -0.14, -0.27, -0.02, holder);
    addCylinder(0.018, 0.2, brass, 0.14, -0.27, -0.02, holder);
    const hit = addRounded(0.44, 0.48, 0.13, proxyMaterial, holder, [0, 0, 0.055], 0.035);
    if (hit) {
      hit.castShadow = false;
      hit.receiveShadow = false;
      hit.userData.interactionId = `music-sleeve-${index + 1}`;
      kit.register(hit, {
        id: `music-sleeve-${index + 1}`,
        label: shortText(item?.title, 18) || "唱片封面",
        hint: "首次点击选中封面；再次点击读取作品入口",
        anchor: [0, 0, 0],
        onClick() {
          selectCover(sourceIndex, holder);
        },
        onKey(key) {
          if (key === "Enter" || key === " ") selectCover(sourceIndex, holder);
        },
      });
    }
  }

  addText("共振潮汐机", 2.6, 0.44, group, [0, 7.64, 0.35], {
    color: "#e8d8aa",
    fontSize: 62,
  });
  addText("装置音色 · 非馆藏歌曲播放", 3.2, 0.2, group, [0, 7.22, 0.35], {
    color: "#7fd8df",
    fontSize: 34,
  });
  addText("搓盘 / 移臂 / 拨弦 / 压键", 2.5, 0.18, group, [0, 0.18, 2.54], {
    color: "#b99a62",
    fontSize: 30,
  });

  let audioContext = null;
  let masterGain = null;
  let compressor = null;
  const voices = new Set();
  const scheduledTimers = new Set();

  function ensureAudio() {
    if (disposed || !activeNow) return null;
    const AudioCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtor) return null;
    if (!audioContext) {
      audioContext = new AudioCtor();
      masterGain = audioContext.createGain();
      compressor = audioContext.createDynamicsCompressor();
      masterGain.gain.value = 0.24;
      compressor.threshold.value = -24;
      compressor.knee.value = 18;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.2;
      masterGain.connect(compressor);
      compressor.connect(audioContext.destination);
    }
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    return audioContext;
  }

  function removeVoice(voice) {
    if (!voice) return;
    voices.delete(voice);
    try {
      voice.oscillator.disconnect();
      voice.overtone.disconnect();
      voice.gain.disconnect();
      voice.overtoneGain.disconnect();
    } catch {
      // Nodes may already be disconnected by the browser after stop().
    }
  }

  function playDeviceTone(frequency, duration = 0.58, level = 0.18) {
    const context = ensureAudio();
    if (!context || !masterGain) return false;
    if (voices.size >= 10) {
      const oldest = voices.values().next().value;
      try {
        oldest?.oscillator.stop();
        oldest?.overtone.stop();
      } catch {
        // The oldest voice may already have ended.
      }
      removeVoice(oldest);
    }
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const overtone = context.createOscillator();
    const gain = context.createGain();
    const overtoneGain = context.createGain();
    oscillator.type = "sine";
    overtone.type = "triangle";
    oscillator.frequency.setValueAtTime(clamp(frequency, 55, 1800), now);
    overtone.frequency.setValueAtTime(clamp(frequency * 2.01, 80, 3200), now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, level), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    overtoneGain.gain.setValueAtTime(0.0001, now);
    overtoneGain.gain.exponentialRampToValueAtTime(Math.max(0.001, level * 0.22), now + 0.008);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.48);
    oscillator.connect(gain);
    overtone.connect(overtoneGain);
    gain.connect(masterGain);
    overtoneGain.connect(masterGain);
    const voice = { oscillator, overtone, gain, overtoneGain };
    voices.add(voice);
    oscillator.start(now);
    overtone.start(now);
    oscillator.stop(now + duration + 0.02);
    overtone.stop(now + duration * 0.55);
    oscillator.addEventListener("ended", () => removeVoice(voice), { once: true });
    state.playing = true;
    return true;
  }

  function stopVoices() {
    for (const voice of Array.from(voices)) {
      try {
        voice.oscillator.stop();
        voice.overtone.stop();
      } catch {
        // A stopped oscillator is already silent.
      }
      removeVoice(voice);
    }
    state.playing = false;
  }

  function pluckString(index) {
    if (index < 0 || index >= STRING_SCALE.length || !activeNow) return false;
    ensureAudio();
    const pitch = 110
      * Math.pow(2, STRING_SCALE[index] / 12)
      * (0.72 + frequencyNormalized() * 0.86);
    stringImpulses[index] = 1;
    state.energy = clamp(state.energy + 0.045 + index / STRING_SCALE.length * 0.025, 0, 1);
    state.spinVelocity = clamp(state.spinVelocity + (index % 2 ? 0.22 : -0.14), -8.5, 8.5);
    state.plucks += 1;
    pressurePulse = Math.max(pressurePulse, 0.24);
    playDeviceTone(pitch, 0.48 + index * 0.018, 0.12 + state.energy * 0.08);
    status(
      `装置音色 · 第 ${String(index + 1).padStart(2, "0")} 弦 · ${Math.round(pitch)} Hz · 已拨 ${state.plucks} 次`,
    );
    invalidate();
    return pitch;
  }

  function strike() {
    if (!activeNow) return false;
    ensureAudio();
    state.strikeCount += 1;
    state.energy = clamp(state.energy + 0.16, 0, 1);
    state.spinVelocity = clamp(state.spinVelocity + 1.8, -8.5, 8.5);
    pressurePulse = 1;
    const base = 92 + frequencyNormalized() * 88;
    playDeviceTone(base, 0.72, 0.17);
    if (globalThis.setTimeout) {
      const timer = globalThis.setTimeout(() => {
        scheduledTimers.delete(timer);
        if (activeNow && !disposed) playDeviceTone(base * 1.498, 0.68, 0.11);
      }, 75);
      scheduledTimers.add(timer);
    }
    status(
      `脉冲压键第 ${state.strikeCount} 次 · 能量 ${Math.round(state.energy * 100)}% · 压缩杆已抬升`,
    );
    invalidate();
    return true;
  }

  function setSelected(index, notify = false) {
    if (!items.length) return -1;
    const requested = Number.isFinite(Number(index)) ? Math.trunc(Number(index)) : 0;
    const next = ((requested % items.length) + items.length) % items.length;
    state.selected = next;
    const item = items[next];
    if (notify) {
      if (typeof kit.onItemSelect === "function") kit.onItemSelect(item);
      else if (typeof kit.onSelect === "function") kit.onSelect("music", next);
      status(`已打开作品入口 · ${shortText(item?.title, 22)}`);
      return next;
    }
    status(`已选中 ${shortText(item?.title, 20)} · 再次点击封面可读取作品详情`);
    invalidate();
    return next;
  }

  function selectCover(sourceIndex, holder) {
    if (!items.length) return;
    if (selectedCover) selectedCover.scale.setScalar(1);
    selectedCover = holder;
    if (state.selected === sourceIndex) {
      setSelected(sourceIndex, true);
    } else {
      state.selected = sourceIndex;
      holder.scale.setScalar(1.08);
      status(`已选中 ${shortText(items[sourceIndex]?.title, 20)} · 装置音色保持不变`);
      invalidate();
    }
  }

  function updateWaveFins(time) {
    if (!waveFins) return;
    const dummy = new THREE.Object3D();
    const energy = state.energy;
    waveBases.forEach((base, index) => {
      const pulse =
        Math.sin(time * (1.2 + energy * 5.8) + base.index * 0.72 + base.ringIndex * 1.4)
        * (0.3 + energy * 0.7);
      const radius = base.radius + pulse * (0.035 + energy * 0.1);
      dummy.position.set(
        Math.cos(base.angle) * radius,
        Math.sin(base.angle) * radius,
        0.24 + base.ringIndex * 0.014 + pulse * 0.045,
      );
      dummy.rotation.set(0, 0, -base.angle + pulse * 0.38);
      dummy.scale.set(
        0.8 + energy * 1.8,
        0.62 + (base.index % 5) * 0.08 + energy * 1.35 * Math.abs(pulse),
        0.8 + energy * 0.85,
      );
      dummy.updateMatrix();
      waveFins.setMatrixAt(index, dummy.matrix);
    });
    waveFins.instanceMatrix.needsUpdate = true;
  }

  function updateStrings(time, delta) {
    if (!strings) return;
    const dummy = new THREE.Object3D();
    stringBases.forEach((base, index) => {
      stringImpulses[index] = damp(stringImpulses[index], 0, 2.65, delta);
      const impulse = stringImpulses[index];
      const vibration = Math.sin(time * 34 + index * 1.7) * impulse;
      dummy.position.copy(base.midpoint);
      dummy.position.x += Math.cos(base.angle) * vibration * 0.045;
      dummy.position.y += Math.sin(base.angle) * vibration * 0.045;
      dummy.rotation.set(0, 0, base.angle + vibration * 0.052);
      dummy.scale.set(1 + impulse * 0.8, base.length, 1 + impulse * 0.45);
      dummy.updateMatrix();
      strings.setMatrixAt(index, dummy.matrix);
      if (bridges[index]) {
        bridges[index].position.x = base.bottom.x + Math.cos(base.angle) * vibration * 0.1;
        bridges[index].position.y = base.bottom.y + Math.sin(base.angle) * vibration * 0.1;
      }
    });
    strings.instanceMatrix.needsUpdate = true;
  }

  function updateStructure(time, delta) {
    if (!draggingRotor) state.spinVelocity = damp(state.spinVelocity, 0.05, 0.72, delta);
    state.spinAngle += state.spinVelocity * delta;
    rotor.rotation.z = state.spinAngle;
    state.energy = damp(state.energy, 0.055 + Math.min(0.09, Math.abs(state.spinVelocity) * 0.012), 0.12, delta);
    pressurePulse = damp(pressurePulse, 0, 3.1, delta);

    const energy = state.energy;
    if (waveMaterial?.uniforms) {
      waveMaterial.uniforms.uTime.value = time;
      waveMaterial.uniforms.uEnergy.value = energy;
      waveMaterial.uniforms.uFrequency.value = state.frequency;
    }
    if (lakeGlow) lakeGlow.opacity = 0.6 + energy * 0.35;
    gearSpecs.forEach((entry, index) => {
      const gear = gears[index];
      if (!gear) return;
      gear.rotation.z += delta * (index % 2 ? -1 : 1) * (0.18 + Math.abs(state.spinVelocity) * 0.65);
    });
    frequencyLever.rotation.z = damp(
      frequencyLever.rotation.z,
      -0.58 + frequencyNormalized() * 1.16,
      7.2,
      delta,
    );
    organBank.position.set(2.62, 1.36, -1.22);
    organBank.rotation.set(0, -0.1, 0);
    organBank.scale.y = damp(organBank.scale.y, 0.96 + frequencyNormalized() * 0.08, 4.2, delta);
    columns.rotation.y += delta * (0.015 + energy * 0.34);
    strikeRoot.rotation.z = Math.sin(time * 19) * pressurePulse * 0.018;
    updateWaveFins(time);
    updateStrings(time, delta);
    if (state.playing && voices.size === 0 && pressurePulse < 0.03) state.playing = false;
    invalidate();
  }

  function resetExperience() {
    for (const timer of scheduledTimers) globalThis.clearTimeout?.(timer);
    scheduledTimers.clear();
    stopVoices();
    state.energy = 0.1;
    state.frequency = 264;
    state.selected = -1;
    state.plucks = 0;
    state.playing = false;
    state.spinAngle = 0.18;
    state.spinVelocity = 0.16;
    state.strikeCount = 0;
    pressurePulse = 0;
    stringImpulses.fill(0);
    if (selectedCover) selectedCover.scale.setScalar(1);
    selectedCover = null;
    status("共振潮汐机已复位到待机频率。");
    invalidate();
    return true;
  }

  return {
    group,
    focus: new THREE.Vector3(0, 3.65, 0),
    update(time, delta, active) {
      if (disposed || !activeNow) return;
      const safeTime = Number(time) || 0;
      const safeDelta = clamp(Number(delta) || 0, 0, 0.05);
      lastTime = safeTime;
      if (!active) return;
      updateStructure(safeTime, reducedMotion() ? Math.max(safeDelta, 0.08) : safeDelta);
    },
    interact(action, index) {
      if (action === "reset") return resetExperience();
      if (action === "select") return setSelected(index, false);
      if (action === "open") return setSelected(Number.isFinite(Number(index)) ? Number(index) : state.selected, true);
      if (action === "pluck") return pluckString(clamp(index, 0, STRING_SCALE.length - 1));
      if (action === "strike") return strike();
      if (action === "spin") {
        state.spinVelocity = clamp(state.spinVelocity + Number(index || 0), -8.5, 8.5);
        invalidate();
        return state.spinVelocity;
      }
      if (action === "frequency") {
        state.frequency = clamp(index, 110, 880);
        invalidate();
        return state.frequency;
      }
      return false;
    },
    getState() {
      const item = items[state.selected];
      return {
        energy: Number(state.energy.toFixed(3)),
        frequency: Math.round(state.frequency),
        frequencyNormalized: Number(frequencyNormalized().toFixed(3)),
        selected: state.selected,
        selectedId: item?.id || "",
        selectedTitle: item?.title || "",
        plucks: state.plucks,
        strikes: state.strikeCount,
        playing: Boolean(state.playing && activeNow),
        spinAngle: Number(state.spinAngle.toFixed(3)),
        spinVelocity: Number(state.spinVelocity.toFixed(3)),
        pulse: Number(pressurePulse.toFixed(3)),
        audioMode: "device-timbre-only",
      };
    },
    setActive(active) {
      activeNow = Boolean(active);
      if (!activeNow) {
        for (const timer of scheduledTimers) globalThis.clearTimeout?.(timer);
        scheduledTimers.clear();
        stopVoices();
        audioContext?.suspend?.().catch?.(() => {});
      } else {
        invalidate();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      activeNow = false;
      draggingRotor = false;
      draggingFrequency = false;
      for (const timer of scheduledTimers) globalThis.clearTimeout?.(timer);
      scheduledTimers.clear();
      stopVoices();
      audioContext?.close?.().catch?.(() => {});
      audioContext = null;
      masterGain = null;
      compressor = null;
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
