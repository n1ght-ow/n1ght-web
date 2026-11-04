import * as THREE from "../vendor/three/three.module.js";

const ROUTES = [
  ["photo", "光轨暗房"], ["books", "重力书库"], ["poems", "回声井"],
  ["paintings", "恒光穹殿"], ["music", "声纹反应堆"], ["sport", "竞技观测场"],
  ["series", "连续信号塔"], ["films", "轨道放映厅"], ["games", "交互试验场"],
  ["curate", "记忆装配坞"],
];
const ROOM_A = new Set(["photo", "books", "poems", "paintings", "curate"]);
const HIT_LIMIT = 9;
const MAX_TEXTURES = 24;
const MAX_TEXTURE_BYTES = 48 * 1024 * 1024;
const TAU = Math.PI * 2;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const asXYZ = (value, fallback) => Array.isArray(value) && value.length >= 3
  ? value.slice(0, 3).map((part, index) => Number.isFinite(Number(part)) ? Number(part) : fallback[index])
  : fallback.slice();
const waitFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function failure(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function makeLabel(text, size = 0.42, color = "#d9f6f3") {
  const lines = String(text || "").split(/\n/).slice(0, 4);
  const canvas = document.createElement("canvas");
  const probe = canvas.getContext("2d");
  const font = '600 48px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
  probe.font = font;
  canvas.width = Math.min(2048, Math.max(64, Math.ceil(Math.max(...lines.map(line => probe.measureText(line).width))) + 32));
  canvas.height = Math.max(80, lines.length * 64 + 16);
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = font;
  context.fillStyle = color;
  lines.forEach((line, index) => context.fillText(line, canvas.width / 2, 40 + index * 64, canvas.width - 24));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size * canvas.width / 48, size * canvas.height / 48, 1);
  sprite.userData.engineLabel = true;
  return sprite;
}

function aspectOf(item) {
  const candidates = [item.aspect, item.ratio, item.width && item.height ? item.width / item.height : 0];
  const metaRatio = String(item.meta || "").match(/(\d{2,5})\s*[x×]\s*(\d{2,5})/);
  if (metaRatio) candidates.push(Number(metaRatio[1]) / Number(metaRatio[2]));
  return candidates.find((value) => Number.isFinite(Number(value)) && Number(value) > 0.1 && Number(value) < 10) || 4 / 3;
}

function radialLineGeometry(count = 64, inner = 4.5, outer = 26, y = -4.5) {
  const points = [];
  for (let index = 0; index < count; index += 1) {
    const angle = index / count * TAU;
    points.push(new THREE.Vector3(Math.cos(angle) * inner, y, Math.sin(angle) * inner));
    points.push(new THREE.Vector3(Math.cos(angle) * outer, y, Math.sin(angle) * outer));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return geometry;
}

function setPortalTarget(object, id) {
  object.userData.portalId = id;
  return object;
}

function ownerOf(id) {
  if (ROOM_A.has(id)) return "a";
  if (ROUTES.some(([route]) => route === id)) return "b";
  return "";
}

export async function createWorld({
  canvas,
  reducedMotion = false,
  onPortal = () => {},
  onPick = () => {},
  onFocus = () => {},
  onError = () => {},
} = {}) {
  if (!(canvas instanceof HTMLCanvasElement)) throw failure("canvas", "createWorld 需要 HTMLCanvasElement canvas");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (cause) {
    const error = failure("webgl", "WebGL 无法初始化", { cause });
    onError(error);
    throw error;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x020506, 1);
  if (!canvas.hasAttribute("tabindex")) canvas.tabIndex = 0;
  canvas.style.touchAction = "none";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020506);
  scene.fog = new THREE.FogExp2(0x020607, 0.018);
  const camera = new THREE.PerspectiveCamera(46, 1, 0.08, 180);
  const abort = new AbortController();
  const textureCache = new Map();
  const labelTextures = new Set();
  const pickObjects = [];
  const portalObjects = [];
  const portalEntries = [];
  const disposables = new Set();
  const animated = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const activePointers = new Map();
  const cameraPose = { position: new THREE.Vector3(0, 3, 16), target: new THREE.Vector3(0, 0, 0) };
  const orbit = { yaw: 0, pitch: -0.1, distance: 16 };
  let routeRoot = null;
  let room = null;
  let routeId = "entry";
  let routeItems = [];
  let generation = 0;
  let routeLoading = false;
  let lastError = null;
  let hovered = null;
  let lastHit = null;
  let lastPick = null;
  let focusedIndex = 0;
  let renderedFrames = 0;
  let cameraMove = null;
  let corridorStep = 0;
  let corridorCurve = null;
  let corridorPoints = [];
  let pointerDrag = null;
  let pinchDistance = 0;
  let disposed = false;
  let paused = false;
  let contextLost = false;
  let motionEnabled = !reducedMotion;
  let frameHandle = 0;
  let dirty = true;
  let elapsed = 0;
  let previousTime = performance.now();
  let fps = 0;
  let fpsFrames = 0;
  let fpsAt = previousTime;

  const skyUniforms = { uTime: { value: 0 } };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(72, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: skyUniforms,
      vertexShader: "varying vec3 vPos; void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "varying vec3 vPos; uniform float uTime; void main(){vec3 d=normalize(vPos);float h=d.y*.5+.5;float warm=pow(max(0.0,dot(d,normalize(vec3(-.75,.12,.55)))),8.0);float cold=pow(max(0.0,dot(d,normalize(vec3(.7,.25,-.3)))),6.0);vec3 c=mix(vec3(.004,.009,.012),vec3(.01,.03,.038),h);c+=vec3(.32,.11,.035)*warm*.32+vec3(.05,.26,.31)*cold*.28;float veil=.5+.5*sin(d.x*18.0+d.y*15.0+uTime*.08);c+=vec3(.012,.025,.028)*veil*.14;gl_FragColor=vec4(c,1.0);}",
    }),
  );
  sky.frustumCulled = false;
  scene.add(sky);

  const starCanvas = document.createElement("canvas");
  starCanvas.width = starCanvas.height = 32;
  const starContext = starCanvas.getContext("2d");
  const starGradient = starContext.createRadialGradient(16, 16, 0, 16, 16, 16);
  starGradient.addColorStop(0, "rgba(224,250,255,1)");
  starGradient.addColorStop(0.18, "rgba(149,222,231,.8)");
  starGradient.addColorStop(1, "rgba(40,100,110,0)");
  starContext.fillStyle = starGradient;
  starContext.fillRect(0, 0, 32, 32);
  const starTexture = new THREE.CanvasTexture(starCanvas);
  const starPositions = [];
  let seed = 92371;
  const random = () => ((seed = seed * 16807 % 2147483647) / 2147483647);
  for (let index = 0; index < 900; index += 1) {
    const radius = 25 + random() * 38;
    const theta = random() * TAU;
    starPositions.push(Math.cos(theta) * radius, -15 + random() * 42, Math.sin(theta) * radius);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
    color: 0xa9eff1, map: starTexture, size: 0.34, transparent: true, opacity: 0.62,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  }));
  scene.add(stars);

  const coreUniforms = { uTime: { value: 0 } };
  const gravityCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.15, 5),
    new THREE.ShaderMaterial({
      transparent: true,
      uniforms: coreUniforms,
      vertexShader: "uniform float uTime; varying vec3 vN; varying vec3 vP; void main(){vN=normalize(normalMatrix*normal);vec3 p=position;float wave=sin(p.y*7.0+uTime*.7+sin(p.x*4.0))*0.026+sin(p.z*9.0-uTime*.48)*0.014;p+=normal*wave;vP=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}",
      fragmentShader: "uniform float uTime; varying vec3 vN; varying vec3 vP; void main(){float f=pow(1.0-abs(dot(normalize(vN),vec3(0.,0.,1.))),2.3);float veins=.5+.5*sin(vP.x*11.0+vP.y*17.0+uTime);vec3 cold=vec3(.16,.75,.82);vec3 warm=vec3(1.0,.39,.13);vec3 c=mix(cold*.18,warm,f*.76);c+=cold*veins*.32;gl_FragColor=vec4(c,.2+f*.78);}",
    }),
  );
  gravityCore.renderOrder = 2;
  scene.add(gravityCore);
  const coreShadow = new THREE.Mesh(
    new THREE.SphereGeometry(1.72, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0x010303, metalness: 0.86, roughness: 0.18, emissive: 0x07191c, emissiveIntensity: 0.65 }),
  );
  scene.add(coreShadow);
  const coreAssembly = new THREE.Group();
  for (let index = 0; index < 7; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.1 + index * 0.48, 0.025 + index * 0.006, 8, 128),
      new THREE.MeshStandardMaterial({ color: index % 2 ? 0xc6723f : 0x82d4dc, emissive: index % 2 ? 0x50200e : 0x0d353b, emissiveIntensity: 0.72, metalness: 0.82, roughness: 0.28 }),
    );
    ring.rotation.set(Math.PI / 2 + index * 0.09, index * 0.31, index * 0.17);
    coreAssembly.add(ring);
    animated.push({ object: ring, speed: (index + 1) * 0.018 });
  }
  scene.add(coreAssembly);
  const basin = new THREE.Mesh(
    new THREE.CylinderGeometry(19, 23, 0.45, 96, 1, false),
    new THREE.MeshStandardMaterial({ color: 0x071013, metalness: 0.72, roughness: 0.3, transparent: true, opacity: 0.8 }),
  );
  basin.position.y = -4.7;
  basin.receiveShadow = true;
  scene.add(basin);
  const radialLines = new THREE.LineSegments(radialLineGeometry(), new THREE.LineBasicMaterial({ color: 0x31545a, transparent: true, opacity: 0.28 }));
  scene.add(radialLines);

  scene.add(new THREE.HemisphereLight(0x8de3ed, 0x170b05, 1.4));
  const keyLight = new THREE.DirectionalLight(0xc8fbff, 3.1);
  keyLight.position.set(-10, 15, 9);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);
  const warmLight = new THREE.PointLight(0xff7d3d, 34, 28, 1.6);
  warmLight.position.set(9, 2, 5);
  scene.add(warmLight);
  const coldLight = new THREE.PointLight(0x68e6ec, 42, 34, 1.5);
  coldLight.position.set(-7, -1, -8);
  scene.add(coldLight);

  const hoverMarker = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.205, 40),
    new THREE.MeshBasicMaterial({ color: 0xdcffff, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false }),
  );
  hoverMarker.visible = false;
  hoverMarker.renderOrder = 20;
  scene.add(hoverMarker);

  function notify(code, message, details = {}) {
    const error = code instanceof Error ? code : failure(code, message, details);
    lastError = { code: error.code || code, message: error.message, at: Date.now(), ...(error.details || details) };
    try { onError(error); } catch (callbackError) { console.error("[NightWorld engine]", callbackError); }
  }

  function project(worldPosition) {
    const rect = canvas.getBoundingClientRect();
    const vector = worldPosition.clone().project(camera);
    return {
      x: Number(((vector.x + 1) / 2).toFixed(4)),
      y: Number(((1 - vector.y) / 2).toFixed(4)),
      screenX: Math.round(rect.left + (vector.x + 1) / 2 * rect.width),
      screenY: Math.round(rect.top + (1 - vector.y) / 2 * rect.height),
      visible: vector.z > -1 && vector.z < 1 && Math.abs(vector.x) <= 1.05 && Math.abs(vector.y) <= 1.05,
    };
  }

  function projectPortals() {
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    return portalEntries.map((entry) => {
      const target = new THREE.Vector3();
      entry.hit.getWorldPosition(target);
      return { id: entry.id, ...project(target), position: target.toArray() };
    });
  }

  function projectPickObjects() {
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const seen = new Set();
    return pickObjects.map((object) => {
      const index = Number(object.userData.pickIndex);
      if (seen.has(index)) return null;
      seen.add(index);
      const target = new THREE.Vector3();
      object.getWorldPosition(target);
      return { index, ...project(target), position: target.toArray() };
    }).filter(Boolean);
  }

  function registerPortal(group, id, title, staged) {
    setPortalTarget(group, id);
    const entry = { id, title, group, hit: group.userData.hit || group, baseScale: group.scale.clone() };
    staged.portals.push(entry);
    staged.portalObjects.push(entry.hit);
    return entry;
  }

  function makeDoorTexture(color, staged) {
    const doorCanvas = document.createElement("canvas");
    doorCanvas.width = 512;
    doorCanvas.height = 768;
    const context = doorCanvas.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, 512, 768);
    gradient.addColorStop(0, "rgba(210,250,250,.28)");
    gradient.addColorStop(0.48, "rgba(6,19,22,.92)");
    gradient.addColorStop(1, color);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 768);
    context.strokeStyle = "rgba(215,250,250,.55)";
    context.lineWidth = 4;
    for (let y = 70; y < 750; y += 48) {
      context.beginPath(); context.moveTo(30, y); context.lineTo(482, y); context.stroke();
    }
    const texture = new THREE.CanvasTexture(doorCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    staged.labels.add(texture);
    return texture;
  }

  function makeDoor(id, title, color, staged) {
    const group = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xb8b9ae, metalness: 0.92, roughness: 0.23 });
    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x071014, metalness: 0.78, roughness: 0.25 });
    const glowMaterial = new THREE.MeshBasicMaterial({ color: id === "curate" ? 0xff9854 : 0x9ceff0, transparent: true, opacity: 0.85, toneMapped: false });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 5.2), new THREE.MeshStandardMaterial({
      map: makeDoorTexture(color, staged), color: 0xffffff, roughness: 0.42, metalness: 0.18, emissive: 0x0c3539, emissiveIntensity: 0.52, side: THREE.DoubleSide,
    }));
    plane.userData.portalId = id;
    group.add(plane);
    const sideGeometry = new THREE.BoxGeometry(0.16, 5.8, 0.22);
    for (const x of [-1.88, 1.88]) {
      const side = new THREE.Mesh(sideGeometry, frameMaterial);
      side.position.x = x; group.add(side);
    }
    for (const y of [-2.88, 2.88]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(3.92, 0.16, 0.24), frameMaterial);
      beam.position.y = y; group.add(beam);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.24, 0.28), darkMaterial);
    lintel.position.set(0, 2.43, 0.08); group.add(lintel);
    const seal = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.045, 8, 40), glowMaterial);
    seal.position.set(0, 2.43, 0.23); group.add(seal);
    const titleLabel = makeLabel(title, 0.31, "#e6ffff");
    titleLabel.position.set(0, 2.04, 0.2); group.add(titleLabel);
    group.userData.hit = plane;
    registerPortal(group, id, title, staged);
    return group;
  }

  function buildEntry(staged) {
    const group = new THREE.Group();
    group.name = "entry";
    const walk = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.28, 17), new THREE.MeshStandardMaterial({ color: 0x111b1e, metalness: 0.86, roughness: 0.24 }));
    walk.position.set(0, -2.75, 5.4); walk.receiveShadow = true; group.add(walk);
    for (let index = 0; index < 12; index += 1) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(index % 2 ? 0.045 : 4.6, 0.035, 0.28), new THREE.MeshBasicMaterial({ color: index % 2 ? 0xff925a : 0x6ed1d8, transparent: true, opacity: 0.65, toneMapped: false }));
      strip.position.set(0, -2.59, 12.5 - index * 1.25); group.add(strip);
    }
    const arch = new THREE.Group();
    for (let index = 0; index < 3; index += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.1 + index * 0.25, 0.055, 10, 96), new THREE.MeshStandardMaterial({ color: index === 1 ? 0xd2844f : 0x9caaa8, metalness: 0.94, roughness: 0.18, emissive: index === 1 ? 0x351406 : 0x08282d, emissiveIntensity: 0.65 }));
      ring.position.z = index * 0.32; arch.add(ring);
    }
    arch.position.set(0, 0.35, 2.2); group.add(arch);
    const aperture = new THREE.Mesh(new THREE.CircleGeometry(2.72, 72), new THREE.MeshBasicMaterial({ color: 0x89dce1, transparent: true, opacity: 0.095, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    aperture.position.set(0, 0.35, 2.55); group.add(aperture);
    const title = makeLabel("引航通道\nTRANSIT SPINE", 0.48);
    title.position.set(0, 4.15, 2.5); group.add(title);
    const indexLabel = makeLabel("N1GHT CHXN9  /  TEN DOCKING APERTURES", 0.25, "#c68152");
    indexLabel.position.set(0, -2.25, 13); group.add(indexLabel);
    setPortalTarget(arch, "corridor"); arch.userData.hit = aperture; aperture.userData.portalId = "corridor";
    registerPortal(arch, "corridor", "引航通道", staged);
    return group;
  }

  function buildCorridor(staged) {
    const group = new THREE.Group();
    group.name = "corridor";
    const points = [];
    for (let index = 0; index <= 120; index += 1) {
      const t = index / 120;
      const angle = -0.75 + t * TAU * 2.18;
      points.push(new THREE.Vector3(Math.cos(angle) * 9.2, -4.1 + t * 11.4, Math.sin(angle) * 9.2));
    }
    corridorCurve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.45);
    corridorPoints = points;
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x899da0, emissive: 0x0b3036, emissiveIntensity: 0.72, metalness: 0.9, roughness: 0.24 });
    const warmRail = new THREE.MeshStandardMaterial({ color: 0xc77945, emissive: 0x3b1709, emissiveIntensity: 0.8, metalness: 0.82, roughness: 0.28 });
    group.add(new THREE.Mesh(new THREE.TubeGeometry(corridorCurve, 180, 0.075, 8, false), railMaterial));
    for (const offset of [-0.68, 0.68]) {
      const shifted = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point.x + offset, point.y + 0.82, point.z + offset)));
      group.add(new THREE.Mesh(new THREE.TubeGeometry(shifted, 100, 0.032, 6, false), warmRail));
    }
    const ribGeometry = new THREE.TorusGeometry(1.18, 0.026, 6, 36);
    for (let index = 0; index < 46; index += 1) {
      const t = index / 45;
      const position = corridorCurve.getPointAt(t);
      const tangent = corridorCurve.getTangentAt(t).normalize();
      const rib = new THREE.Mesh(ribGeometry, index % 5 ? railMaterial : warmRail);
      rib.position.copy(position);
      rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      group.add(rib);
    }
    ROUTES.forEach(([id, title], index) => {
      const t = 0.055 + index / 9 * 0.89;
      const position = corridorCurve.getPointAt(t);
      const door = makeDoor(id, title, index % 2 ? "rgba(206,113,58,.38)" : "rgba(55,151,161,.4)", staged);
      door.position.copy(position);
      const previous = corridorCurve.getPointAt(Math.max(0.005, t - 0.045));
      door.lookAt(previous);
      group.add(door);
    });
    const spineLabel = makeLabel("THE TRANSIT SPINE\n沿螺旋脊线前进", 0.31, "#d9b27d");
    spineLabel.position.copy(corridorCurve.getPointAt(0.02)).add(new THREE.Vector3(0, 2.3, 0));
    group.add(spineLabel);
    return group;
  }

  function disposeRoot(root) {
    if (!root) return;
    root.updateMatrixWorld(true);
    root.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
      materials.forEach((material) => {
        const maps = ["map", "alphaMap", "emissiveMap", "normalMap", "roughnessMap", "metalnessMap", "aoMap"];
        maps.forEach((key) => {
          const texture = material[key];
          if (texture?.userData?.cacheUrl) textureCache.get(texture.userData.cacheUrl)?.refs.delete(object);
          if (texture && !textureCache.has(texture.userData.cacheUrl) && texture !== starTexture) texture.dispose();
        });
        material.dispose();
      });
    });
    root.removeFromParent();
  }

  function clearRouteResources() {
    if (room?.dispose) {
      try { room.dispose(); } catch (error) { notify("room-dispose", "展区释放失败", { cause: String(error) }); }
    }
    room = null;
    disposeRoot(routeRoot);
    routeRoot = null;
    pickObjects.length = 0;
    portalObjects.length = 0;
    portalEntries.length = 0;
    labelTextures.forEach((texture) => texture.dispose());
    labelTextures.clear();
    hovered = null;
    lastHit = null;
    hoverMarker.visible = false;
    pruneTextureCache(0);
  }

  function textureBytes(texture) {
    const image = texture?.image;
    return image?.width && image?.height ? image.width * image.height * 4 : 512 * 512 * 4;
  }

  function pruneTextureCache(protect = 0) {
    let total = [...textureCache.values()].reduce((sum, entry) => sum + entry.bytes, 0);
    const entries = [...textureCache.values()].sort((a, b) => a.used - b.used);
    for (const entry of entries) {
      if (textureCache.size <= MAX_TEXTURES && total <= MAX_TEXTURE_BYTES) break;
      if (entry === protect || entry.refs.size) continue;
      entry.texture?.dispose();
      textureCache.delete(entry.url);
      total -= entry.bytes;
    }
  }

  async function acquireTexture(url, token) {
    const source = String(url || "").trim();
    if (!source) return null;
    let entry = textureCache.get(source);
    if (!entry) {
      const promise = new THREE.TextureLoader().loadAsync(source).then((texture) => {
        if (disposed) { texture.dispose(); return null; }
        const image = texture.image;
        const largest = Math.max(image.width || 0, image.height || 0);
        if (largest > 1024) {
          const surface = document.createElement("canvas");
          surface.width = Math.max(1, Math.round(image.width * 1024 / largest));
          surface.height = Math.max(1, Math.round(image.height * 1024 / largest));
          surface.getContext("2d").drawImage(image, 0, 0, surface.width, surface.height);
          texture.image = surface;
          texture.needsUpdate = true;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        const record = { url: source, texture, refs: new Set(), used: performance.now(), bytes: textureBytes(texture), promise: null };
        texture.userData.cacheUrl = source;
        textureCache.set(source, record);
        pruneTextureCache(record);
        return record;
      }).catch((cause) => {
        textureCache.delete(source);
        notify("texture", "图像载入失败", { url: source, recoverable: true, cause: String(cause) });
        return null;
      });
      entry = { url: source, texture: null, refs: new Set(), used: performance.now(), bytes: 0, promise };
      textureCache.set(source, entry);
    }
    const record = entry.texture ? entry : await entry.promise;
    if (!record || token !== generation || disposed) return null;
    record.used = performance.now();
    return record;
  }

  function applyMap(object, texture, source) {
    object.traverse((child) => {
      const materials = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
      materials.forEach((material) => {
        const previous = material.map;
        if (previous?.userData?.cacheUrl) textureCache.get(previous.userData.cacheUrl)?.refs.delete(child);
        material.map = texture;
        material.color?.set(0xffffff);
        material.needsUpdate = true;
        material.userData.textureUrl = source;
        textureCache.get(source)?.refs.add(child);
      });
    });
  }

  function makeContext(items, token, staged) {
    const bindTexture = async (url, mesh) => {
      if (!mesh) return null;
      if (!mesh.userData.aspectBox && mesh.geometry?.type === "PlaneGeometry") {
        mesh.userData.aspectBox = { width: mesh.geometry.parameters.width, height: mesh.geometry.parameters.height };
      }
      const request = (mesh.userData.textureRequest || 0) + 1;
      mesh.userData.textureRequest = request;
      const record = await acquireTexture(url, token);
      if (!record || token !== generation || disposed || mesh.userData.textureRequest !== request) return null;
      const bounds = mesh.userData.aspectBox;
      if (bounds && mesh.geometry?.type === "PlaneGeometry") {
        const image = record.texture.image;
        const ratio = image.width / image.height;
        const height = Math.min(bounds.width / ratio, bounds.height);
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(height * ratio, height);
      }
      applyMap(mesh, record.texture, record.url);
      requestRender();
      return record.texture;
    };
    return Object.freeze({
      THREE,
      items,
      reducedMotion,
      texture: bindTexture,
      label: (text, size = 0.4, color) => {
        const sprite = makeLabel(text, size, color);
        staged.labels.add(sprite.material.map);
        return sprite;
      },
      pick: (object, index) => {
        const numeric = Number(index);
        if (!object?.isObject3D || !Number.isInteger(numeric) || numeric < 0 || numeric >= HIT_LIMIT || numeric >= items.length) {
          throw failure("pick-index", "pick(index) 必须引用当前 setRoute items 的 0..8 索引", { index, length: items.length });
        }
        object.userData.pickIndex = numeric;
        staged.picks.push(object);
        return object;
      },
      plane: (item, width = 2.4, height) => {
        const ratio = aspectOf(item);
        const boxWidth = Number.isFinite(width) ? width : 2.4;
        const maxHeight = Number.isFinite(height) ? height : Infinity;
        const planeHeight = Math.min(boxWidth / ratio, maxHeight);
        const planeWidth = planeHeight * ratio;
        const material = new THREE.MeshBasicMaterial({ color: 0x536a6d, side: THREE.DoubleSide, toneMapped: false });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeHeight), material);
        mesh.userData.engineTextureTarget = true;
        mesh.userData.aspectBox = { width: boxWidth, height: maxHeight };
        mesh.userData.aspect = ratio;
        if (item.image || item.thumb) void bindTexture(item.image || item.thumb, mesh);
        return mesh;
      },
    });
  }

  let roomModulesPromise = null;
  async function roomModules() {
    if (!roomModulesPromise) {
      roomModulesPromise = Promise.all([import("./rooms-a.js?v=2"), import("./rooms-b.js?v=2")]).then(([a, b]) => ({ a, b }));
    }
    return roomModulesPromise;
  }

  async function makeRoom(id, items, token, staged) {
    const modules = await roomModules();
    if (token !== generation) return null;
    const module = ownerOf(id) === "a" ? modules.a : modules.b;
    if (typeof module.buildRoom !== "function") throw failure("room-module", id + " 所属房间模块缺少 buildRoom");
    const built = module.buildRoom(id, makeContext(items, token, staged));
    if (!built) throw failure("room-unsupported", "房间模块未声明 " + id);
    if (!built.group?.isObject3D) throw failure("room-group", id + " buildRoom 未返回 THREE.Group");
    return built;
  }

  function setPose(position, target, animate = true) {
    const destination = { position: new THREE.Vector3(...asXYZ(position, cameraPose.position.toArray())), target: new THREE.Vector3(...asXYZ(target, cameraPose.target.toArray())) };
    if (!motionEnabled || !animate) {
      cameraPose.position.copy(destination.position);
      cameraPose.target.copy(destination.target);
      cameraMove = null;
      camera.position.copy(cameraPose.position);
      camera.lookAt(cameraPose.target);
      syncOrbitFromPose();
      requestRender();
      return;
    }
    cameraMove = {
      fromPosition: cameraPose.position.clone(), toPosition: destination.position,
      fromTarget: cameraPose.target.clone(), toTarget: destination.target,
      started: performance.now(), duration: 680,
    };
    requestRender();
  }

  function syncOrbitFromPose() {
    const direction = cameraPose.position.clone().sub(cameraPose.target);
    orbit.distance = clamp(direction.length(), 2.2, 48);
    orbit.yaw = Math.atan2(direction.x, direction.z);
    orbit.pitch = Math.asin(clamp(direction.y / Math.max(direction.length(), 0.001), -1, 1));
  }

  function applyOrbit() {
    const horizontal = Math.cos(orbit.pitch) * orbit.distance;
    cameraPose.position.set(
      cameraPose.target.x + Math.sin(orbit.yaw) * horizontal,
      cameraPose.target.y + Math.sin(orbit.pitch) * orbit.distance,
      cameraPose.target.z + Math.cos(orbit.yaw) * horizontal,
    );
    camera.position.copy(cameraPose.position);
    camera.lookAt(cameraPose.target);
    requestRender();
  }

  function setCorridorStep(step) {
    if (routeId !== "corridor" || !corridorCurve) return;
    corridorStep = (Number(step) + 10) % 10;
    const t = 0.055 + corridorStep / 9 * 0.89;
    const target = corridorCurve.getPointAt(t);
    const before = corridorCurve.getPointAt(Math.max(0.01, t - 0.055));
    setPose(before.toArray().map((value, index) => value + (index === 1 ? 0.75 : 0)), target.toArray(), true);
    hovered = portalEntries.find((entry) => entry.id === ROUTES[corridorStep][0]) || null;
  }

  function routeCamera(group) {
    if (routeId === "entry") setPose([0, 2.8, 15], [0, 0.45, 1.8], false);
    else if (routeId === "corridor") setPose([23, 16, 26], [0, 1.5, 0], true);
    else if (room?.camera) setPose(room.camera.position, room.camera.target, true);
    else setPose([0, 2.2, 12], [group.position.x, 0, group.position.z], true);
  }

  async function setRoute(id = "entry", items = []) {
    if (disposed) return false;
    const nextId = String(id || "entry");
    if (nextId !== "entry" && nextId !== "corridor" && !ownerOf(nextId)) return false;
    const token = ++generation;
    routeLoading = true;
    canvas.dataset.route = nextId;
    cameraMove = null;
    hovered = null;
    hoverMarker.visible = false;
    const staged = { picks: [], portalObjects: [], portals: [], labels: new Set() };
    const discardStaged = (nextRoot, builtRoom, staged) => {
      if (builtRoom?.dispose) builtRoom.dispose();
      disposeRoot(nextRoot);
      staged.labels.forEach((texture) => texture.dispose());
    };
    try {
      const nextItems = Array.isArray(items) ? items.slice(0, HIT_LIMIT) : [];
      let builtRoom = null;
      let nextRoot;
      if (nextId === "entry") nextRoot = buildEntry(staged);
      else if (nextId === "corridor") nextRoot = buildCorridor(staged);
      else {
        builtRoom = await makeRoom(nextId, nextItems, token, staged);
        if (token !== generation || disposed) {
          if (builtRoom?.dispose) builtRoom.dispose();
          disposeRoot(builtRoom?.group);
          staged.labels.forEach((texture) => texture.dispose());
          return false;
        }
        nextRoot = builtRoom.group;
      }
      if (token !== generation || disposed) {
        discardStaged(nextRoot, builtRoom, staged);
        return false;
      }
      clearRouteResources();
      routeId = nextId;
      routeItems = nextItems;
      focusedIndex = 0;
      room = builtRoom;
      routeRoot = nextRoot;
      routeRoot.userData.route = nextId;
      scene.add(routeRoot);
      const inTransit = nextId === "entry" || nextId === "corridor";
      [gravityCore, coreShadow, coreAssembly, basin, radialLines].forEach((object) => { object.visible = inTransit; });
      pickObjects.splice(0, pickObjects.length, ...staged.picks);
      portalObjects.splice(0, portalObjects.length, ...staged.portalObjects);
      portalEntries.splice(0, portalEntries.length, ...staged.portals);
      staged.labels.forEach((texture) => labelTextures.add(texture));
      routeCamera(routeRoot);
      canvas.dataset.route = nextId;
      if (routeId === "corridor") corridorStep = 0;
      routeLoading = false;
      requestRender();
      return true;
    } catch (cause) {
      if (token !== generation || disposed) return false;
      staged.labels.forEach((texture) => texture.dispose());
      routeLoading = false;
      const error = failure("route", "无法进入展区 " + nextId, { cause });
      notify(error);
      throw error;
    }
  }

  async function focusRoomIndex(index, fromUser = false) {
    const numeric = Number(index);
    if (!room || !Number.isInteger(numeric) || numeric < 0 || numeric >= routeItems.length) return false;
    try {
      const focusGeneration = generation;
      const result = await room.focus?.(numeric);
      if (focusGeneration !== generation || disposed) return false;
      focusedIndex = numeric;
      if (Array.isArray(result?.position) && Array.isArray(result?.target)) {
        setPose(result.position, result.target, true);
      }
      if (fromUser && !disposed) onFocus(numeric);
      return true;
    } catch (cause) {
      notify("focus", "展品聚焦失败", { index: numeric, cause });
      return false;
    }
  }

  function focusItem(index) {
    return focusRoomIndex(index, false);
  }

  function setMotion(enabled) {
    motionEnabled = Boolean(enabled);
    previousTime = performance.now();
    if (!motionEnabled && cameraMove) setPose(cameraMove.toPosition.toArray(), cameraMove.toTarget.toArray(), false);
    requestRender();
  }

  function resize() {
    if (disposed) return;
    const width = Math.max(1, canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth);
    const height = Math.max(1, canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  }

  function pointerNdc(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    return pointer;
  }

  function findUserObject(object) {
    let current = object;
    while (current) {
      if (current.userData?.portalId || Number.isInteger(current.userData?.pickIndex)) return current;
      current = current.parent;
    }
    return null;
  }

  function hitAt(event) {
    if (!routeRoot || (!portalObjects.length && !pickObjects.length)) return null;
    raycaster.setFromCamera(pointerNdc(event), camera);
    const intersections = raycaster.intersectObjects([...portalObjects, ...pickObjects], true);
    for (const intersection of intersections) {
      const object = findUserObject(intersection.object);
      if (!object) continue;
      return { object, point: intersection.point.clone(), portalId: object.userData.portalId, index: Number.isInteger(object.userData.pickIndex) ? object.userData.pickIndex : null };
    }
    return null;
  }

  function setHover(hit) {
    const next = hit?.portalId ? portalEntries.find((entry) => entry.id === hit.portalId) : hit?.index != null ? hit : null;
    if (hovered !== next) hovered = next;
    lastHit = hit;
    hoverMarker.visible = Boolean(hit);
    if (hit) hoverMarker.position.copy(hit.point);
    canvas.style.cursor = hit ? "pointer" : "grab";
    lastPick = hit ? { portalId: hit.portalId || null, index: hit.index, projected: project(hit.point), at: Date.now() } : lastPick;
    requestRender();
  }

  function activateHit(hit) {
    if (!hit) return false;
    if (hit.portalId) {
      try { onPortal(hit.portalId); } catch (error) { notify("portal-callback", "入口回调失败", { cause: error }); }
      return true;
    }
    if (hit.index != null) {
      try { onPick(hit.index); } catch (error) { notify("pick-callback", "展品拾取回调失败", { cause: error }); }
      return true;
    }
    return false;
  }

  function onPointerDown(event) {
    if (event.target !== canvas) return;
    canvas.focus({ preventScroll: true });
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.size === 1) {
      const initialHit = hitAt(event);
      pointerDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, hit: initialHit, focusIndex: initialHit?.index ?? null };
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = "grabbing";
    } else if (activePointers.size === 2) {
      const [a, b] = [...activePointers.values()];
      pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pointerDrag) pointerDrag.moved = true;
    }
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (activePointers.has(event.pointerId)) activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.size === 2) {
      const [a, b] = [...activePointers.values()];
      const nextDistance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDistance) orbit.distance = clamp(orbit.distance * pinchDistance / Math.max(1, nextDistance), 2.2, 48);
      pinchDistance = nextDistance;
      applyOrbit();
      event.preventDefault();
      return;
    }
    if (!pointerDrag || pointerDrag.id !== event.pointerId) {
      setHover(hitAt(event));
      return;
    }
    const dx = event.clientX - pointerDrag.x;
    const dy = event.clientY - pointerDrag.y;
    if (Math.hypot(dx, dy) > 4) pointerDrag.moved = true;
    if (!pointerDrag.moved) return;
    cameraMove = null;
    orbit.yaw -= dx * 0.006;
    orbit.pitch = clamp(orbit.pitch + dy * 0.005, -1.18, 1.18);
    applyOrbit();
    pointerDrag.x = event.clientX;
    pointerDrag.y = event.clientY;
    if (pointerDrag.focusIndex != null) {
      const focusIndex = pointerDrag.focusIndex;
      pointerDrag.focusIndex = null;
      focusRoomIndex(focusIndex, true);
    }
    hoverMarker.visible = false;
    event.preventDefault();
  }

  function onPointerUp(event) {
    const wasTap = event.type === "pointerup" && pointerDrag && !pointerDrag.moved && pointerDrag.id === event.pointerId;
    const hit = wasTap ? pointerDrag.hit || hitAt(event) : null;
    activePointers.delete(event.pointerId);
    if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    pointerDrag = null;
    pinchDistance = 0;
    canvas.style.cursor = "grab";
    if (wasTap) activateHit(hit);
  }

  function onWheel(event) {
    event.preventDefault();
    cameraMove = null;
    orbit.distance = clamp(orbit.distance * (event.deltaY > 0 ? 1.08 : 0.92), 2.2, 48);
    applyOrbit();
  }

  function onKeyDown(event) {
    if (event.target !== canvas) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      activateHit(lastHit || null);
    } else if (event.key === "[" || event.key === "]") {
      event.preventDefault();
      event.stopPropagation();
      if (routeId === "corridor") setCorridorStep(corridorStep + (event.key === "]" ? 1 : -1));
    } else if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && room && routeItems.length) {
      event.preventDefault();
      event.stopPropagation();
      const current = focusedIndex;
      const index = (current + (event.key === "ArrowRight" ? 1 : routeItems.length - 1) + routeItems.length) % routeItems.length;
      focusRoomIndex(index, true);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "+" || event.key === "-") {
      event.preventDefault();
      event.stopPropagation();
      cameraMove = null;
      if (event.key === "ArrowUp") orbit.pitch = clamp(orbit.pitch - 0.06, -1.18, 1.18);
      if (event.key === "ArrowDown") orbit.pitch = clamp(orbit.pitch + 0.06, -1.18, 1.18);
      if (event.key === "+") orbit.distance = clamp(orbit.distance * 0.92, 2.2, 48);
      if (event.key === "-") orbit.distance = clamp(orbit.distance * 1.08, 2.2, 48);
      applyOrbit();
    }
  }

  function onVisibility() {
    paused = document.hidden || contextLost;
    previousTime = performance.now();
    if (paused) {
      cancelAnimationFrame(frameHandle); frameHandle = 0;
      activePointers.clear(); pointerDrag = null; pinchDistance = 0;
    } else requestRender();
  }

  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    paused = true;
    cancelAnimationFrame(frameHandle); frameHandle = 0;
    notify("context-lost", "WebGL 上下文已丢失，等待恢复", { recoverable: true });
  }

  function onContextRestored() {
    contextLost = false;
    paused = document.hidden;
    resize();
  }

  function tick(now) {
    frameHandle = 0;
    if (disposed) return;
    if (paused || contextLost) return;
    dirty = false;
    const dt = Math.min(0.05, Math.max(0.001, (now - previousTime) / 1000));
    previousTime = now;
    elapsed += dt;
    if (motionEnabled) {
      skyUniforms.uTime.value = elapsed;
      coreUniforms.uTime.value = elapsed;
      stars.rotation.y = elapsed * 0.006;
      animated.forEach(({ object, speed }) => { object.rotation.z += speed * dt; });
      if (routeId === "entry" && !cameraMove) {
        orbit.yaw = Math.sin(elapsed * 0.11) * 0.055;
        applyOrbit();
      }
    }
    if (cameraMove) {
      const progress = clamp((performance.now() - cameraMove.started) / cameraMove.duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      cameraPose.position.lerpVectors(cameraMove.fromPosition, cameraMove.toPosition, eased);
      cameraPose.target.lerpVectors(cameraMove.fromTarget, cameraMove.toTarget, eased);
      camera.position.copy(cameraPose.position);
      camera.lookAt(cameraPose.target);
      if (progress >= 1) {
        cameraMove = null;
        syncOrbitFromPose();
      }
    }
    if (hovered) {
      if (hovered.group) hovered.group.scale.lerp(hovered.baseScale.clone().multiplyScalar(1.035), 0.16);
      const pulse = 1 + Math.sin(elapsed * 5) * 0.12;
      hoverMarker.scale.setScalar(pulse);
      hoverMarker.quaternion.copy(camera.quaternion);
    }
    portalEntries.forEach((entry) => {
      if (entry !== hovered) entry.group.scale.lerp(entry.baseScale, 0.12);
    });
    if (motionEnabled && room?.update) {
      try { room.update(elapsed, dt); } catch (error) { notify("room-update", "展区更新失败", { cause: error }); room.update = null; }
    }
    renderer.render(scene, camera);
    renderedFrames += 1;
    if (motionEnabled || cameraMove || dirty) requestRender();
    fpsFrames += 1;
    if (now - fpsAt > 1000) {
      fps = Math.round(fpsFrames * 1000 / (now - fpsAt));
      fpsFrames = 0;
      fpsAt = now;
    }
  }

  function requestRender() {
    dirty = true;
    if (!frameHandle && !disposed && !paused && !contextLost) frameHandle = requestAnimationFrame(tick);
  }

  function metrics() {
    let objects = 0;
    let geometries = 0;
    let materials = 0;
    const materialSet = new Set();
    scene.traverse((object) => {
      objects += 1;
      if (object.geometry) geometries += 1;
      const entries = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
      entries.forEach((material) => { if (!materialSet.has(material)) { materialSet.add(material); materials += 1; } });
    });
    return {
      route: routeId, routeLoading, items: routeItems.length, corridorStep,
      motion: motionEnabled, paused, contextLost, disposed, fps, renderedFrames,
      portals: projectPortals(), picks: projectPickObjects(), lastPick, lastError,
      textures: { cached: [...textureCache.values()].filter((entry) => entry.texture).length, limit: MAX_TEXTURES, bytes: [...textureCache.values()].reduce((sum, entry) => sum + entry.bytes, 0), byteLimit: MAX_TEXTURE_BYTES },
      scene: { objects, geometries, materials },
      renderer: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, points: renderer.info.render.points, lines: renderer.info.render.lines, memory: { ...renderer.info.memory } },
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    generation += 1;
    abort.abort();
    cancelAnimationFrame(frameHandle);
    clearRouteResources();
    textureCache.forEach((entry) => entry.texture?.dispose());
    textureCache.clear();
    starGeometry.dispose(); starTexture.dispose();
    scene.traverse((object) => {
      object.geometry?.dispose();
      const entries = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
      entries.forEach((material) => material.dispose());
    });
    renderer.dispose();
    renderer.forceContextLoss?.();
    canvas.style.cursor = "";
  }

  canvas.addEventListener("pointerdown", onPointerDown, { signal: abort.signal });
  canvas.addEventListener("pointermove", onPointerMove, { signal: abort.signal });
  canvas.addEventListener("pointerup", onPointerUp, { signal: abort.signal });
  canvas.addEventListener("pointercancel", onPointerUp, { signal: abort.signal });
  canvas.addEventListener("wheel", onWheel, { passive: false, signal: abort.signal });
  canvas.addEventListener("keydown", onKeyDown, { signal: abort.signal });
  canvas.addEventListener("webglcontextlost", onContextLost, { signal: abort.signal });
  canvas.addEventListener("webglcontextrestored", onContextRestored, { signal: abort.signal });
  document.addEventListener("visibilitychange", onVisibility, { signal: abort.signal });
  window.addEventListener("resize", resize, { signal: abort.signal });

  await setRoute("entry", []);
  resize();
  requestRender();

  return Object.freeze({
    setRoute,
    focusItem,
    setMotion,
    resize,
    dispose,
    metrics,
    advanceCorridor: (step = 1) => setCorridorStep(corridorStep + Number(step || 0)),
    setView: (x = 0.5, y = 0.5) => {
      cameraMove = null;
      orbit.yaw = (clamp(Number(x), 0, 1) - 0.5) * TAU;
      orbit.pitch = (clamp(Number(y), 0, 1) - 0.5) * -1.9;
      applyOrbit();
    },
    projectPortals,
  });
}
