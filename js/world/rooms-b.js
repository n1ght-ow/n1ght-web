const ROOM_IDS = new Set(["music", "sport", "series", "films", "games"]);
const VISIBLE_LIMIT = 16;
const CREST_TEXTURES = {
  "logos/spurs.svg": "assets/world/crests/spurs.png?v=1",
  "logos/mancity.svg": "assets/world/crests/mancity.png?v=1",
};

const C = Object.freeze({
  ink: 0x071012,
  ceramic: 0x11191c,
  titanium: 0x7e8d91,
  ghost: 0xb9d0d1,
  ice: 0xc8f3ef,
  cyan: 0x67d9db,
  amber: 0xf0b45e,
  orange: 0xff784f,
  magenta: 0xe174ab,
  violet: 0x8b82ff,
  lime: 0xb9e86d,
  green: 0x4b9b75,
  white: 0xf5f2e8,
});

function visibleItems(items) {
  return Array.isArray(items) ? items.slice(0, VISIBLE_LIMIT) : [];
}

function nestedField(item, names) {
  const sources = [item, item && item.meta, item && item.originalFields];
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const name of names) {
      const value = source[name];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return "";
}

function cardUrl(item, room) {
  const common = ["image", "thumb"];
  const preferred = {
    music: ["cover", "albumCover"],
    sport: ["crest", "badge", "logo", "emblem"],
    series: ["poster", "cover"],
    films: ["poster", "cover"],
    games: ["cover", "poster"],
  }[room] || [];
  return nestedField(item, preferred.concat(common));
}

function detailUrl(item) {
  return nestedField(item, ["photo", "image", "thumb", "poster"]);
}

function clampIndex(index, length) {
  if (!length) return -1;
  const parsed = Math.trunc(Number(index));
  if (!Number.isFinite(parsed)) return 0;
  if (parsed < 0) return -1;
  return Math.max(0, Math.min(length - 1, parsed));
}

function selectedIndex(index, length) {
  return Number(index) < 0 ? -1 : clampIndex(index, length);
}

function markMesh(mesh, cast = true, receive = false) {
  if (!mesh) return mesh;
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

class RoomScope {
  constructor(ctx) {
    this.ctx = ctx;
    this.THREE = ctx.THREE;
    this.group = new this.THREE.Group();
    this.disposed = false;
    this.textureQueues = new Map();
  }

  material(params = {}, kind = "MeshStandardMaterial") {
    const Material = this.THREE[kind] || this.THREE.MeshStandardMaterial;
    return new Material(params);
  }

  add(child, parent = this.group) {
    if (!child || !parent) return child;
    parent.add(child);
    return child;
  }

  mesh(geometry, material, parent = this.group) {
    const mesh = new this.THREE.Mesh(geometry, material);
    markMesh(mesh);
    return this.add(mesh, parent);
  }

  label(text, size, color, position, parent = this.group) {
    let value = null;
    try {
      value = this.ctx.label(String(text || ""), size, color);
    } catch (error) {
      return null;
    }
    const place = (object) => {
      if (!object) return;
      if (position) object.position.set(position[0], position[1], position[2]);
      this.add(object, parent);
    };
    if (value && typeof value.then === "function") value.then(place).catch(() => {});
    else place(value);
    return value;
  }

  plane(item, width, height, position, parent = this.group) {
    let visual = null;
    try {
      visual = this.ctx.plane(item, width, height);
    } catch (error) {
      return null;
    }
    const place = (object) => {
      if (!object) return;
      if (position) object.position.set(position[0], position[1], position[2]);
      this.add(object, parent);
    };
    if (visual && typeof visual.then === "function") visual.then(place).catch(() => {});
    else place(visual);
    return visual;
  }

  pickBox(width, height, index, position, parent = this.group) {
    const material = this.material({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 }, "MeshBasicMaterial");
    const hit = markMesh(new this.THREE.Mesh(new this.THREE.BoxGeometry(width, height, 0.28), material), false, false);
    hit.position.set(position[0], position[1], position[2]);
    this.add(hit, parent);
    try {
      this.ctx.pick(hit, index);
    } catch (error) {
      // A missing hit target must not prevent the rest of the room from loading.
    }
    return hit;
  }

  texture(mesh, url) {
    if (!mesh || !url || this.disposed) return Promise.resolve();
    const previous = this.textureQueues.get(mesh) || Promise.resolve();
    const task = previous
      .catch(() => {})
      .then(() => {
        if (this.disposed) return;
        return this.ctx.texture(url, mesh);
      })
      .catch(() => {});
    this.textureQueues.set(mesh, task);
    task.finally(() => {
      if (this.textureQueues.get(mesh) === task) this.textureQueues.delete(mesh);
    });
    return task;
  }

  setMaterial(mesh, update) {
    if (!mesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      try {
        update(material);
        material.needsUpdate = true;
      } catch (error) {
        // Keep the room usable when a helper returns an unusual material.
      }
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.textureQueues.clear();
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}

function addSoftGlow(scope, color, intensity, position, distance = 12) {
  const light = new scope.THREE.PointLight(color, intensity, distance, 2);
  light.position.set(position[0], position[1], position[2]);
  scope.add(light);
  return light;
}

function buildMusic(ctx) {
  const scope = new RoomScope(ctx);
  const { THREE, group } = scope;
  const items = visibleItems(ctx.items);
  const reduced = Boolean(ctx.reducedMotion);
  const compact = window.innerWidth <= 700;

  const ceramic = scope.material({ color: C.ceramic, roughness: 0.34, metalness: 0.52 });
  const dark = scope.material({ color: C.ink, roughness: 0.58, metalness: 0.3 });
  const metal = scope.material({ color: C.titanium, roughness: 0.24, metalness: 0.9 });
  const cyan = scope.material({ color: C.cyan, emissive: C.cyan, emissiveIntensity: 1.2, roughness: 0.25 });
  const amber = scope.material({ color: C.amber, emissive: C.amber, emissiveIntensity: 1.1, roughness: 0.3 });
  const groove = scope.material({ color: 0x203033, roughness: 0.27, metalness: 0.88 });
  const glass = scope.material({ color: 0x66aaa8, transparent: true, opacity: 0.18, roughness: 0.15, metalness: 0.2, side: THREE.DoubleSide });

  scope.mesh(new THREE.CylinderGeometry(12.5, 13.2, 0.55, 96), dark).position.y = -0.1;
  const plinth = scope.mesh(new THREE.CylinderGeometry(3.4, 4.2, 1.2, 72), ceramic);
  plinth.position.y = 0.5;
  const rotor = new THREE.Group();
  rotor.position.y = 1.55;
  scope.add(rotor);
  scope.mesh(new THREE.CylinderGeometry(2.7, 2.7, 0.18, 96), groove, rotor);
  for (let i = 1; i <= 10; i += 1) {
    const ring = scope.mesh(new THREE.TorusGeometry(0.32 + i * 0.23, 0.018, 6, 72), i % 3 ? groove : cyan, rotor);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.12 + i * 0.006;
  }
  const spindle = scope.mesh(new THREE.CylinderGeometry(0.18, 0.24, 3.2, 20), metal, rotor);
  spindle.position.y = 1.65;
  const upperRecord = scope.mesh(new THREE.CylinderGeometry(2.15, 2.15, 0.13, 96), groove, rotor);
  upperRecord.position.y = 2.7;
  upperRecord.rotation.z = 0.06;
  const core = scope.mesh(new THREE.IcosahedronGeometry(0.76, 1), amber, rotor);
  core.position.y = 3.8;
  const halo = scope.mesh(new THREE.TorusGeometry(1.34, 0.035, 8, 96), cyan, rotor);
  halo.position.y = 3.8;
  halo.rotation.x = Math.PI / 2;

  const rodPivots = [];
  for (let i = 0; i < 24; i += 1) {
    const angle = (i / 24) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(Math.sin(angle) * 6.1, 1.05, Math.cos(angle) * 6.1);
    scope.add(pivot);
    const rod = scope.mesh(new THREE.CylinderGeometry(0.055, 0.085, 1.45, 8), i % 4 === 0 ? cyan : metal, pivot);
    rod.position.y = 0.72;
    rod.position.z = 0.05;
    rodPivots.push({ pivot, rod, phase: i * 0.63 });
  }
  const mechanicalDeck = scope.mesh(new THREE.TorusGeometry(6.15, 0.12, 12, 120), ceramic);
  mechanicalDeck.rotation.x = Math.PI / 2;
  mechanicalDeck.position.y = 1.15;

  const needle = new THREE.Group();
  needle.position.y = 1.95;
  scope.add(needle);
  const needleArm = scope.mesh(new THREE.BoxGeometry(0.16, 0.16, 6.2), metal, needle);
  needleArm.position.z = 3.1;
  const needleTip = scope.mesh(new THREE.ConeGeometry(0.22, 0.75, 16), amber, needle);
  needleTip.position.set(0, 0, 6.18);
  needleTip.rotation.x = Math.PI / 2;

  const records = [];
  const recordRadius = compact ? 8.05 : 9.45;
  const recordY = 2.72;
  const count = Math.max(1, items.length);
  for (let i = 0; i < items.length; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const root = new THREE.Group();
    root.rotation.y = angle;
    root.position.set(Math.sin(angle) * recordRadius, 1.05, Math.cos(angle) * recordRadius);
    scope.add(root);
    const stand = scope.mesh(new THREE.CylinderGeometry(1.95, 2.2, 0.38, 48), ceramic, root);
    stand.position.y = 0.16;
    const record = scope.mesh(new THREE.CylinderGeometry(1.92, 1.92, 0.1, 96), groove, root);
    record.rotation.x = Math.PI / 2;
    record.position.y = recordY;
    const ringMaterial = (i === 0 ? amber : cyan).clone();
    const selectionRing = scope.mesh(new THREE.TorusGeometry(2.15, 0.052, 8, 72), ringMaterial, root);
    selectionRing.position.set(0, recordY, -0.02);
    scope.plane(items[i], 3.08, 3.08, [0, recordY, 0.075], root);
    scope.pickBox(3.7, 3.7, i, [0, recordY, 0.1], root);
    records.push({ root, record, selectionRing, baseY: root.position.y, focus: 0 });
  }

  for (let i = -2; i <= 2; i += 1) {
    const ring = scope.mesh(new THREE.TorusGeometry(12.5 - Math.abs(i) * 0.23, 0.025, 5, 120), i === 0 ? amber : glass);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02 + (i + 2) * 0.025;
  }
  addSoftGlow(scope, C.cyan, 11, [0, 5.4, 0], 16);
  addSoftGlow(scope, C.amber, 8, [0, 2.6, 6.5], 12);
  const key = new THREE.DirectionalLight(C.white, 1.5);
  key.position.set(5, 14, 10);
  scope.add(key);
  scope.label("声纹反应堆 · MECHANICAL RECORD INDEX", 0.26, "#f0b45e", [0, 5.3, 0]);

  let selected = -1;
  const overviewView = {
    position: [0, 7.2, 25],
    target: [0, 3.05, 0],
    frame: { width: compact ? 19.2 : 23.5, height: 8.8 },
  };
  function focus(index) {
    selected = selectedIndex(index, records.length);
    for (let i = 0; i < records.length; i += 1) {
      const entry = records[i];
      const active = i === selected;
      scope.setMaterial(entry.selectionRing, (material) => {
        material.color.setHex(active ? C.amber : C.cyan);
        if ("emissive" in material) material.emissive.setHex(active ? C.amber : C.cyan);
        if ("emissiveIntensity" in material) material.emissiveIntensity = active ? 2.1 : 0.7;
      });
      entry.focus = active ? 1 : 0;
      entry.root.position.y = entry.baseY + (active ? 0.18 : 0);
      entry.root.scale.setScalar(active ? 1.08 : 1);
      entry.selectionRing.scale.setScalar(active ? 1.045 : 1);
    }
    if (selected < 0 || !records[selected]) return overviewView;
    const angle = (selected / records.length) * Math.PI * 2;
    const normalX = Math.sin(angle);
    const normalZ = Math.cos(angle);
    const coverX = normalX * recordRadius;
    const coverZ = normalZ * recordRadius;
    const coverY = records[selected].baseY + recordY + 0.18;
    needle.rotation.y = angle;
    return {
      position: [coverX + normalX * 7, coverY + 0.35, coverZ + normalZ * 7],
      target: [coverX, coverY, coverZ],
      frame: { width: 3.55, height: 3.7 },
    };
  }

  function update(time, delta) {
    if (scope.disposed) return;
    const dt = Math.min(0.05, Math.max(0, Number(delta) || 0));
    const motion = reduced ? 0 : 1;
    rotor.rotation.y += dt * (0.22 + selected * 0.006) * motion;
    core.rotation.x += dt * 0.35 * motion;
    core.rotation.z -= dt * 0.2 * motion;
    halo.rotation.z += dt * 0.38 * motion;
    for (let i = 0; i < records.length; i += 1) {
      const entry = records[i];
      const isSelected = i === selected;
      entry.focus += ((isSelected ? 1 : 0) - entry.focus) * (reduced ? 1 : Math.min(1, dt * 7));
      entry.root.position.y = entry.baseY + entry.focus * 0.18;
      entry.root.scale.setScalar(1 + entry.focus * 0.08);
      entry.record.rotation.y += dt * (isSelected ? 0 : 0.08) * motion;
    }
    for (const entry of rodPivots) {
      const wave = reduced ? 0.22 : 0.22 + Math.sin(time * 2.2 + entry.phase) * 0.18;
      entry.rod.scale.y = 0.55 + wave;
      entry.pivot.rotation.z = reduced ? 0 : Math.sin(time * 0.9 + entry.phase) * 0.08;
    }
  }

  focus(0);
  return {
    group,
    camera: overviewView,
    update,
    focus,
    overview: () => {
      focus(-1);
      return overviewView;
    },
    dispose: () => scope.dispose(),
  };
}

function buildSport(ctx) {
  const scope = new RoomScope(ctx);
  const { THREE, group } = scope;
  const items = visibleItems(ctx.items);
  const reduced = Boolean(ctx.reducedMotion);
  const compact = window.innerWidth <= 700;

  const pitchMat = scope.material({ color: 0x17372c, roughness: 0.9, metalness: 0 });
  const stripeMat = scope.material({ color: 0x204a3a, roughness: 0.92 });
  const concrete = scope.material({ color: 0x152126, roughness: 0.72, metalness: 0.16 });
  const seatMat = scope.material({ color: 0x21353a, roughness: 0.68, metalness: 0.34 });
  const steel = scope.material({ color: 0x819092, roughness: 0.34, metalness: 0.85 });
  const whiteLine = new THREE.LineBasicMaterial({ color: 0xd5ebe3, transparent: true, opacity: 0.9 });
  const gold = scope.material({ color: C.amber, emissive: C.amber, emissiveIntensity: 1.4, roughness: 0.28 });
  const crestBacking = scope.material({ color: 0x0b1216, roughness: 0.5, metalness: 0.35 });

  scope.mesh(new THREE.CylinderGeometry(20.6, 21.8, 0.6, 96), concrete).position.y = -0.18;
  const pitch = scope.mesh(new THREE.PlaneGeometry(24, 14), pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.y = 0.14;
  for (let i = 0; i < 12; i += 1) {
    if (i % 2) continue;
    const stripe = scope.mesh(new THREE.PlaneGeometry(2, 14), stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(-11 + i * 2 + 1, 0.151, 0);
  }
  const boundary = [
    [-12, 0.18, -7], [12, 0.18, -7], [12, 0.18, 7], [-12, 0.18, 7], [-12, 0.18, -7],
  ].map((p) => new THREE.Vector3(...p));
  const boundaryGeo = new THREE.BufferGeometry().setFromPoints(boundary);
  scope.add(new THREE.Line(boundaryGeo, whiteLine));
  const centerLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.18, -7), new THREE.Vector3(0, 0.18, 7),
  ]), whiteLine);
  scope.add(centerLine);
  const centerCircle = scope.mesh(new THREE.RingGeometry(2.75, 2.83, 64), whiteLine);
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.y = 0.18;

  for (let tier = 0; tier < 6; tier += 1) {
    const ring = scope.mesh(new THREE.RingGeometry(15.2 + tier * 0.9, 16.1 + tier * 0.9, 96), seatMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 1.05 + tier * 0.58;
    for (let seat = 0; seat < 56; seat += 1) {
      const angle = (seat / 56) * Math.PI * 2;
      const radius = 15.45 + tier * 0.9;
      const block = scope.mesh(new THREE.BoxGeometry(0.32, 0.13, 0.38), tier % 2 ? steel : concrete);
      block.position.set(Math.sin(angle) * radius, 1.18 + tier * 0.58, Math.cos(angle) * radius);
      block.rotation.y = angle;
    }
  }
  const bowlShell = scope.mesh(new THREE.CylinderGeometry(20.6, 15.2, 5.1, 96, 1, true), concrete);
  bowlShell.position.y = 2.4;

  const masts = [];
  const spacing = items.length > 1 ? Math.min(compact ? 3.3 : 5.1, (compact ? 13.2 : 17) / (items.length - 1)) : 0;
  for (let i = 0; i < items.length; i += 1) {
    const x = (i - (items.length - 1) / 2) * spacing;
    const z = -2.8 + Math.abs(x) * 0.035;
    const root = new THREE.Group();
    root.position.set(x, 0, z);
    scope.add(root);
    const mast = scope.mesh(new THREE.CylinderGeometry(0.11, 0.18, 4.7, 12), steel, root);
    mast.position.y = 2.35;
    const frame = scope.mesh(new THREE.BoxGeometry(3.15, 3.15, 0.24), crestBacking, root);
    frame.position.y = 5.15;
    const rimMaterial = (i === 0 ? gold : steel).clone();
    const rim = scope.mesh(new THREE.TorusGeometry(1.58, 0.055, 8, 40), rimMaterial, root);
    rim.position.set(0, 5.15, 0.13);
    const crest = cardUrl(items[i], "sport");
    const crestDisk = scope.mesh(new THREE.CircleGeometry(1.47, 48), scope.material({ color: crest === "logos/spurs.svg" ? 0x17282e : 0xe8edeb, side: THREE.DoubleSide }, "MeshBasicMaterial"), root);
    crestDisk.position.set(0, 5.15, 0.14);
    const crestTexture = CREST_TEXTURES[crest] || crest;
    const crestFace = scope.plane({ ...items[i], image: crestTexture, thumb: crestTexture }, 2.7, 2.7, [0, 5.15, 0.18], root);
    if (crestFace?.material) { crestFace.material.transparent = true; crestFace.material.alphaTest = 0.01; }
    scope.pickBox(3.55, 3.55, i, [0, 5.15, 0.15], root);
    masts.push({ root, rim, world: new THREE.Vector3(x, 0, z) });
  }

  const scoreboard = scope.mesh(new THREE.BoxGeometry(10.4, 4.5, 0.35), crestBacking);
  scoreboard.position.set(0, 7.3, -15.3);
  const heroMaterial = scope.material({ color: 0xffffff, toneMapped: false }, "MeshBasicMaterial");
  const hero = scope.mesh(new THREE.PlaneGeometry(8.2, 3.05), heroMaterial);
  hero.position.set(0, 7.3, -15.08);
  const heroRim = scope.mesh(new THREE.BoxGeometry(9.1, 3.95, 0.12), gold);
  heroRim.position.set(0, 7.3, -15.22);
  let heroUrl = "";

  const selectionLight = new THREE.SpotLight(C.amber, 30, 34, Math.PI / 8, 0.55, 1.3);
  selectionLight.position.set(0, 16, 5);
  scope.add(selectionLight);
  scope.add(selectionLight.target);
  for (const x of [-12, 0, 12]) {
    const tower = scope.mesh(new THREE.CylinderGeometry(0.22, 0.34, 13.2, 12), steel);
    tower.position.set(x, 6.6, -10.5);
    const lamp = scope.mesh(new THREE.BoxGeometry(3.4, 0.8, 0.6), C.ice ? gold : gold);
    lamp.position.set(x, 13.1, -10.3);
    const spot = new THREE.SpotLight(C.ice, 45, 42, Math.PI / 5, 0.58, 1.3);
    spot.position.set(x, 13.1, -10.2);
    spot.target.position.set(x * 0.35, 0, 2);
    scope.add(spot);
    scope.add(spot.target);
  }
  addSoftGlow(scope, C.amber, 8, [0, 8.5, -14], 15);
  scope.label("竞技观测场 · REAL CRESTS / LIVE CLUB INDEX", 0.25, "#f0b45e", [0, 10.6, -14.75]);

  let selected = -1;
  const overviewView = {
    position: [0, 10.8, 27],
    target: [0, 4.65, -1.6],
    frame: { width: compact ? 20.5 : 27, height: 13.5 },
  };
  function focus(index) {
    selected = selectedIndex(index, masts.length);
    for (let i = 0; i < masts.length; i += 1) {
      const active = i === selected;
      scope.setMaterial(masts[i].rim, (material) => {
        material.color.setHex(active ? C.amber : C.titanium);
        if ("emissive" in material) material.emissive.setHex(active ? C.amber : 0x000000);
        if ("emissiveIntensity" in material) material.emissiveIntensity = active ? 2.2 : 0;
      });
      masts[i].rim.scale.setScalar(active ? 1.045 : 1);
      masts[i].root.scale.setScalar(active ? 1.04 : 1);
    }
    if (selected >= 0 && items[selected]) {
      const value = detailUrl(items[selected]);
      if (value && value !== heroUrl) {
        heroUrl = value;
        scope.texture(hero, value);
      }
      selectionLight.target.position.set(masts[selected].world.x, 5.15, masts[selected].world.z);
    }
    if (selected < 0) return overviewView;
    const target = masts[selected].world;
    return {
      position: [target.x, 5.55, target.z + 8],
      target: [target.x, 5.15, target.z],
      frame: { width: 4.25, height: 4.55 },
    };
  }

  function update(time, delta) {
    if (scope.disposed) return;
    const dt = Math.min(0.05, Math.max(0, Number(delta) || 0));
    if (reduced) return;
    hero.position.y = 7.3;
    heroRim.position.y = hero.position.y;
  }

  focus(0);
  return {
    group,
    camera: overviewView,
    update,
    focus,
    overview: () => {
      focus(-1);
      return overviewView;
    },
    dispose: () => scope.dispose(),
  };
}

function buildSeries(ctx) {
  const scope = new RoomScope(ctx);
  const { THREE, group } = scope;
  const items = visibleItems(ctx.items);
  const reduced = Boolean(ctx.reducedMotion);

  const shell = scope.material({ color: 0x121820, roughness: 0.34, metalness: 0.65 });
  const blackMetal = scope.material({ color: 0x070b10, roughness: 0.45, metalness: 0.52 });
  const silver = scope.material({ color: 0x8c9ba2, roughness: 0.25, metalness: 0.94 });
  const magenta = scope.material({ color: C.magenta, emissive: C.magenta, emissiveIntensity: 1.15, roughness: 0.3 });
  const cyan = scope.material({ color: C.cyan, emissive: C.cyan, emissiveIntensity: 0.9, roughness: 0.3 });
  const podMat = scope.material({ color: 0x18242a, roughness: 0.38, metalness: 0.45 });

  scope.mesh(new THREE.CylinderGeometry(8.8, 9.7, 0.42, 64), blackMetal).position.y = -0.08;
  const mast = scope.mesh(new THREE.CylinderGeometry(0.56, 0.98, 14.8, 20), shell);
  mast.position.y = 7.4;
  for (let level = 0; level < 8; level += 1) {
    const ring = scope.mesh(new THREE.TorusGeometry(1.55 + (level % 3) * 0.18, 0.045, 7, 56), level % 2 ? cyan : magenta);
    ring.position.y = 1.35 + level * 1.58;
    ring.rotation.x = Math.PI / 2;
  }
  const spinePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.4, 0),
    new THREE.Vector3(0.28, 3.5, 0.2),
    new THREE.Vector3(-0.25, 7, -0.2),
    new THREE.Vector3(0.18, 11, 0.15),
    new THREE.Vector3(0, 14.9, 0),
  ]);
  scope.mesh(new THREE.TubeGeometry(spinePath, 96, 0.07, 8, false), cyan);
  for (let side = 0; side < 3; side += 1) {
    const angle = side / 3 * Math.PI * 2;
    const cable = scope.mesh(new THREE.CylinderGeometry(0.028, 0.028, 14, 6), side === 0 ? magenta : silver);
    cable.position.set(Math.sin(angle) * 1.18, 7.4, Math.cos(angle) * 1.18);
  }

  const pods = [];
  const broadcastRadius = 4.15;
  for (let i = 0; i < items.length; i += 1) {
    const side = (i % 3) - 1;
    const band = Math.floor(i / 3);
    const angle = side * 0.08;
    const y = 2.65 + band * 4.6;
    const root = new THREE.Group();
    root.position.set(side * 4.05, y, 4.4 - Math.abs(side) * 0.3);
    root.rotation.y = angle;
    scope.add(root);
    const pod = scope.mesh(new THREE.BoxGeometry(3.0, 3.95, 0.48), podMat, root);
    const frameMaterial = (i === 0 ? magenta : silver).clone();
    const frame = scope.mesh(new THREE.BoxGeometry(3.3, 4.25, 0.22), frameMaterial, root);
    frame.position.z = -0.15;
    scope.plane(items[i], 3.02, 3.95, [0, 0, 0.62], root);
    scope.pickBox(3.48, 4.42, i, [0, 0, 0.68], root);
    const strut = scope.mesh(new THREE.BoxGeometry(0.13, 0.13, broadcastRadius - 1.1), silver, root);
    strut.position.z = -(broadcastRadius - 1.1) / 2 - 0.25;
    pod.position.z = 0.05;
    frame.position.y = 0;
    scope.label(items[i].title, 0.11, "#e7eeec", [0, -2.31, 0.7], root);
    pods.push({ root, frame, pod, pivotAngle: angle, baseY: y, basePosition: root.position.clone(), focus: 0 });
  }

  const signal = new THREE.PointLight(C.magenta, 18, 13, 2);
  signal.position.set(0, 3, 0);
  scope.add(signal);
  const topLight = new THREE.PointLight(C.cyan, 22, 16, 2);
  topLight.position.set(0, 14.2, 0);
  scope.add(topLight);
  const beaconPivot = new THREE.Group();
  beaconPivot.position.y = 14.35;
  scope.add(beaconPivot);
  const beacon = scope.mesh(new THREE.OctahedronGeometry(0.62, 0), cyan, beaconPivot);
  const beaconRing = scope.mesh(new THREE.TorusGeometry(1.12, 0.04, 8, 48), magenta, beaconPivot);
  beaconRing.rotation.x = Math.PI / 2;
  scope.label("连续信号塔 · SEASON CARRIER", 0.25, "#e174ab", [0, 15.2, 0]);

  let selected = -1;
  const overviewView = {
    position: [0, 8.4, 24],
    target: [0, 7.4, 2.6],
    frame: { width: 13.2, height: 16.4 },
  };
  function focus(index) {
    selected = selectedIndex(index, pods.length);
    for (let i = 0; i < pods.length; i += 1) {
      const active = i === selected;
      scope.setMaterial(pods[i].frame, (material) => {
        material.color.setHex(active ? C.magenta : C.titanium);
        if ("emissive" in material) material.emissive.setHex(active ? C.magenta : 0x000000);
        if ("emissiveIntensity" in material) material.emissiveIntensity = active ? 2 : 0;
      });
      pods[i].focus = active ? 1 : 0;
      pods[i].root.position.copy(pods[i].basePosition);
      if (active) pods[i].root.position.set(0, 5.4, 10.5);
      pods[i].root.rotation.y = active ? 0 : pods[i].pivotAngle;
      pods[i].frame.scale.setScalar(active ? 1.025 : 1);
      pods[i].pod.position.z = active ? 0.27 : 0.05;
    }
    if (selected >= 0) {
      const item = pods[selected];
      const pod = item.root.position;
      signal.position.y = item.baseY;
      return {
        position: [0, 5.4, pod.z + 7],
        target: [0, 5.4, pod.z + 0.62],
        frame: { width: 3.8, height: 5.2 },
      };
    }
    return overviewView;
  }

  function update(time, delta) {
    if (scope.disposed) return;
    const dt = Math.min(0.05, Math.max(0, Number(delta) || 0));
    if (!reduced) {
      beaconPivot.rotation.y += dt * 0.42;
      beacon.rotation.x += dt * 0.36;
      beaconRing.rotation.z -= dt * 0.2;
    }
    for (let i = 0; i < pods.length; i += 1) {
      const entry = pods[i];
      const active = i === selected;
      entry.focus += ((active ? 1 : 0) - entry.focus) * (reduced ? 1 : Math.min(1, dt * 6));
      entry.root.rotation.y = active ? 0 : entry.pivotAngle;
      entry.root.position.y = active ? 5.4 : entry.baseY;
      entry.pod.position.z = 0.05 + entry.focus * 0.22;
    }
    topLight.intensity = reduced ? 21 : 20 + Math.sin(time * 2.1) * 4;
  }

  focus(0);
  return {
    group,
    camera: overviewView,
    update,
    focus,
    overview: () => {
      focus(-1);
      return overviewView;
    },
    dispose: () => scope.dispose(),
  };
}

function curvedScreenGeometry(THREE, radius, height, arc, segments) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const a = -arc / 2 + (i / segments) * arc;
    const x = Math.sin(a) * radius;
    const z = -13 + Math.cos(a) * radius;
    positions.push(x, height / 2, z, x, -height / 2, z);
    uvs.push(i / segments, 1, i / segments, 0);
    if (i < segments) {
      const n = i * 2;
      indices.push(n, n + 2, n + 1, n + 2, n + 3, n + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildFilms(ctx) {
  const scope = new RoomScope(ctx);
  const { THREE, group } = scope;
  const items = visibleItems(ctx.items);
  const reduced = Boolean(ctx.reducedMotion);
  const compact = window.innerWidth <= 700;

  const floor = scope.material({ color: 0x09090d, roughness: 0.55, metalness: 0.35 });
  const shell = scope.material({ color: 0x151418, roughness: 0.42, metalness: 0.48 });
  const velvet = scope.material({ color: 0x2a1018, roughness: 0.92, metalness: 0 });
  const brass = scope.material({ color: 0xa7834f, roughness: 0.28, metalness: 0.88 });
  const silver = scope.material({ color: 0x8d9497, roughness: 0.24, metalness: 0.95 });
  const red = scope.material({ color: C.orange, emissive: C.orange, emissiveIntensity: 0.85, roughness: 0.36 });
  const screenMat = scope.material({ color: 0x1b2228, side: THREE.DoubleSide, toneMapped: false }, "MeshBasicMaterial");

  scope.mesh(new THREE.CylinderGeometry(19.5, 20.2, 0.35, 72), floor).position.y = -0.1;
  const screen = scope.mesh(curvedScreenGeometry(THREE, 13, 8.8, 1.3, 36), screenMat);
  screen.position.set(0, 5.4, 0);
  const screenBezel = scope.mesh(new THREE.BoxGeometry(13.9, 9.5, 0.22), shell);
  screenBezel.position.set(0, 5.4, -13.18);
  const focusPoster = scope.plane(items[0], 6.2, 8.15, [0, 5.4, 0.16]);
  if (focusPoster) {
    focusPoster.material.toneMapped = false;
    focusPoster.renderOrder = 2;
  }
  let focusUrl = "";

  const ceiling = scope.mesh(new THREE.BoxGeometry(28, 0.35, 19), shell);
  ceiling.position.set(0, 13.3, -2);
  for (const x of [-12, -6, 0, 6, 12]) {
    const column = scope.mesh(new THREE.CylinderGeometry(0.22, 0.48, 13.2, 12), silver);
    column.position.set(x, 6.5, -12.4);
    const sconce = scope.mesh(new THREE.BoxGeometry(1.1, 0.25, 0.5), red);
    sconce.position.set(x, 9.7, -11.9);
  }
  for (const x of [-2, 2]) {
    const curtain = scope.mesh(new THREE.BoxGeometry(1.2, 12.7, 0.35), velvet);
    curtain.position.set(x, 6.3, -12.9);
  }

  const railCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-12, 1.2, 11),
    new THREE.Vector3(-7, 1.2, 14),
    new THREE.Vector3(0, 1.2, 15.5),
    new THREE.Vector3(7, 1.2, 14),
    new THREE.Vector3(12, 1.2, 11),
  ]);
  for (const offset of [-0.19, 0.19]) {
    const shifted = new THREE.CatmullRomCurve3(railCurve.points.map((point) => new THREE.Vector3(point.x, point.y + offset, point.z)));
    scope.mesh(new THREE.TubeGeometry(shifted, 72, 0.055, 8, false), brass);
  }

  const frames = [];
  for (let i = 0; i < items.length; i += 1) {
    const side = i % 2 ? 1 : -1;
    const rank = Math.floor(i / 2);
    const a = side * ((compact ? 0.32 : 0.42) + rank * (compact ? 0.08 : 0.115));
    const radius = 15.5;
    const x = Math.sin(a) * radius;
    const z = -13 + Math.cos(a) * radius;
    const y = 3.3 + (i % 3) * 0.24;
    const root = new THREE.Group();
    root.position.set(x, y, z);
    root.rotation.y = a;
    scope.add(root);
    const back = scope.mesh(new THREE.BoxGeometry(2.65, 3.85, 0.24), shell, root);
    const rimMaterial = (i === 0 ? brass : silver).clone();
    const rim = scope.mesh(new THREE.BoxGeometry(2.9, 4.1, 0.12), rimMaterial, root);
    rim.position.z = -0.16;
    scope.plane(items[i], 2.2, 3.3, [0, 0, 0.18], root);
    scope.pickBox(2.95, 4.22, i, [0, 0, 0.22], root);
    const foot = scope.mesh(new THREE.CylinderGeometry(0.16, 0.28, 2.1, 10), silver, root);
    foot.position.y = -2.65;
    frames.push({ root, rim, back, angle: a, baseY: y, focus: 0 });
  }

  const dolly = new THREE.Group();
  dolly.position.set(0, 1.35, 15.5);
  scope.add(dolly);
  const dollyBase = scope.mesh(new THREE.BoxGeometry(1.8, 0.38, 1.15), shell, dolly);
  const projector = scope.mesh(new THREE.CylinderGeometry(0.38, 0.52, 1.3, 18), brass, dolly);
  projector.rotation.x = Math.PI / 2;
  projector.position.set(0, 0.7, -0.6);
  const lens = scope.mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.18, 20), red, dolly);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 0.7, -1.3);
  const projectorLight = new THREE.SpotLight(0xffd8a7, 34, 34, 0.22, 0.62, 1.15);
  projectorLight.position.set(0, 2.1, 14.9);
  projectorLight.target.position.set(0, 5.4, -3.4);
  scope.add(projectorLight);
  scope.add(projectorLight.target);
  addSoftGlow(scope, 0xffa06b, 17, [0, 7.2, -4.2], 15);
  scope.label("轨道放映厅 · PROJECTION DOLLY", 0.25, "#f0b45e", [0, 11.4, -2]);

  let selected = -1;
  const dollyTarget = new THREE.Vector3(0, 1.35, 15.5);
  const overviewView = {
    position: [0, 7.2, 22],
    target: [0, 4.9, -5.2],
    frame: { width: compact ? 21 : 29, height: 15.8 },
  };
  function focus(index) {
    selected = selectedIndex(index, frames.length);
    for (let i = 0; i < frames.length; i += 1) {
      const active = i === selected;
      scope.setMaterial(frames[i].rim, (material) => {
        material.color.setHex(active ? 0xc79152 : C.titanium);
        if ("emissive" in material) material.emissive.setHex(active ? C.orange : 0x000000);
        if ("emissiveIntensity" in material) material.emissiveIntensity = active ? 1.45 : 0;
      });
      frames[i].rim.scale.setScalar(active ? 1.025 : 1);
      frames[i].root.position.y = frames[i].baseY;
    }
    if (selected >= 0) {
      const entry = frames[selected];
      dollyTarget.set(entry.root.position.x * 0.74, 1.35, entry.root.position.z + 0.5);
      const value = cardUrl(items[selected], "films");
      if (value && value !== focusUrl) {
        focusUrl = value;
        scope.texture(focusPoster, value);
      }
      return {
        position: [0, 5.72, 5.5],
        target: [0, 5.4, 0.16],
        frame: { width: 6.55, height: 9.0 },
      };
    }
    dollyTarget.set(0, 1.35, 15.5);
    return overviewView;
  }

  function update(time, delta) {
    if (scope.disposed) return;
    const dt = Math.min(0.05, Math.max(0, Number(delta) || 0));
    if (!reduced) {
      dolly.position.lerp(dollyTarget, Math.min(1, dt * 1.9));
      projector.rotation.z += dt * 0.12;
      lens.emissiveIntensity = 1.1 + Math.sin(time * 4.2) * 0.18;
    } else {
      dolly.position.copy(dollyTarget);
    }
    if (focusPoster?.material) focusPoster.material.opacity = 1;
  }

  focus(0);
  return {
    group,
    camera: overviewView,
    update,
    focus,
    overview: () => {
      focus(-1);
      return overviewView;
    },
    dispose: () => scope.dispose(),
  };
}

function buildGames(ctx) {
  const scope = new RoomScope(ctx);
  const { THREE, group } = scope;
  const items = visibleItems(ctx.items);
  const reduced = Boolean(ctx.reducedMotion);
  const compact = window.innerWidth <= 700;

  const voidMat = scope.material({ color: 0x090812, roughness: 0.72, metalness: 0.18 });
  const plate = scope.material({ color: 0x191b27, roughness: 0.36, metalness: 0.62 });
  const edge = scope.material({ color: 0x7f8b9d, roughness: 0.25, metalness: 0.9 });
  const violet = scope.material({ color: C.violet, emissive: C.violet, emissiveIntensity: 1.2, roughness: 0.28 });
  const lime = scope.material({ color: C.lime, emissive: C.lime, emissiveIntensity: 0.92, roughness: 0.32 });
  const cartridgeMat = scope.material({ color: 0x111318, roughness: 0.5, metalness: 0.42 });

  scope.mesh(new THREE.CylinderGeometry(15.6, 16.3, 0.38, 8), voidMat).position.y = -0.08;
  const grid = new THREE.GridHelper(30, 30, 0x384052, 0x202534);
  grid.position.y = 0.13;
  scope.add(grid);

  const coreRoot = new THREE.Group();
  coreRoot.position.set(0, 6.1, -8.5);
  scope.add(coreRoot);
  const core = scope.mesh(new THREE.IcosahedronGeometry(1.02, 1), violet, coreRoot);
  const coreCage = scope.mesh(new THREE.IcosahedronGeometry(1.42, 0), edge, coreRoot);
  scope.setMaterial(coreCage, (material) => {
    material.transparent = true;
    material.opacity = 0.42;
    material.wireframe = true;
  });
  const rings = [];
  for (let i = 0; i < 3; i += 1) {
    const ring = scope.mesh(new THREE.TorusGeometry(1.75 + i * 0.29, 0.045, 8, 72), i % 2 ? lime : violet, coreRoot);
    ring.rotation.set(i * 0.42, i * 0.58, i * 0.27);
    rings.push(ring);
  }
  for (let arm = 0; arm < 6; arm += 1) {
    const angle = arm / 6 * Math.PI * 2;
    const beam = scope.mesh(new THREE.BoxGeometry(0.1, 0.1, 3.4), edge, coreRoot);
    beam.position.set(Math.sin(angle) * 1.9, 0, Math.cos(angle) * 1.9);
    beam.rotation.y = angle;
    beam.rotation.x = 0.18;
  }

  const platforms = [];
  const columns = Math.min(compact ? 4 : 6, Math.max(1, items.length));
  const rows = items.length > columns ? 2 : 1;
  for (let i = 0; i < items.length; i += 1) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = (col - (columns - 1) / 2) * 2.62;
    const z = 3.25 + row * 4.05;
    const y = 1.62 + ((col + row * 3) % 3) * 0.42;
    const root = new THREE.Group();
    root.position.set(x, y, z);
    scope.add(root);
    const disc = scope.mesh(new THREE.CylinderGeometry(1.12, 0.74, 0.32, 8), plate, root);
    disc.position.y = -0.62;
    const strut = scope.mesh(new THREE.CylinderGeometry(0.055, 0.075, y - 0.4, 8), edge, root);
    strut.position.y = -(y - 0.4) / 2 - 0.75;
    const holder = scope.mesh(new THREE.BoxGeometry(2.55, 1.65, 0.58), cartridgeMat, root);
    const face = scope.plane(items[i], 2.26, 1.3, [0, 0.02, 0.32], root);
    scope.pickBox(2.72, 1.78, i, [0, 0.02, 0.38], root);
    const accentMaterial = (i === 0 ? lime : edge).clone();
    const accent = scope.mesh(new THREE.BoxGeometry(2.62, 0.055, 0.08), accentMaterial, root);
    accent.position.set(0, -0.84, 0.34);
    platforms.push({ root, disc, holder, face, accent, baseY: y, basePosition: root.position.clone(), phase: i * 0.7, focus: 0 });
  }

  const coreLight = new THREE.PointLight(C.violet, 18, 21, 2);
  coreLight.position.copy(coreRoot.position);
  scope.add(coreLight);
  const rimLight = new THREE.PointLight(C.lime, 11, 18, 2);
  rimLight.position.set(-7, 3, 12);
  scope.add(rimLight);
  scope.label("交互试验场 · STAGGERED CARTRIDGE ARRAY", 0.25, "#b9e86d", [0, 8.7, -8]);

  let selected = -1;
  const overviewView = {
    position: [0, 8.1, 25],
    target: [0, compact ? 3.35 : 3.15, compact ? 5.7 : 4.7],
    frame: { width: compact ? 12.5 : 18.5, height: compact ? 13.4 : 10.2 },
  };
  function focus(index) {
    selected = selectedIndex(index, platforms.length);
    for (let i = 0; i < platforms.length; i += 1) {
      const active = i === selected;
      const platform = platforms[i];
      scope.setMaterial(platform.accent, (material) => {
        material.color.setHex(active ? C.lime : C.titanium);
        if ("emissive" in material) material.emissive.setHex(active ? C.lime : 0x000000);
        if ("emissiveIntensity" in material) material.emissiveIntensity = active ? 2 : 0;
      });
      platform.focus = active ? 1 : 0;
      platform.root.position.copy(platform.basePosition);
      if (active) platform.root.position.set(0, 2.7, 12.5);
      platform.root.rotation.y = 0;
      platform.holder.rotation.z = 0;
      platform.accent.scale.setScalar(active ? 1.035 : 1);
    }
    coreLight.intensity = selected >= 0 ? 8 : 17;
    if (selected >= 0) {
      const platform = platforms[selected];
      const p = platform.root.position;
      rimLight.position.set(p.x, p.y + 1.5, p.z + 2.5);
      return {
        position: [p.x, p.y + 0.36, p.z + 6.2],
        target: [p.x, p.y + 0.02, p.z + 0.34],
        frame: { width: 3.05, height: 2.35 },
      };
    }
    rimLight.position.set(-7, 3, 12);
    return overviewView;
  }

  function update(time, delta) {
    if (scope.disposed) return;
    const dt = Math.min(0.05, Math.max(0, Number(delta) || 0));
    if (!reduced) {
      core.rotation.x += dt * 0.28;
      core.rotation.z -= dt * 0.19;
      coreCage.rotation.y -= dt * 0.13;
      rings.forEach((ring, index) => {
        ring.rotation.x += dt * (0.09 + index * 0.015) * (index % 2 ? -1 : 1);
        ring.rotation.y += dt * 0.055;
      });
      coreRoot.position.y = 6.1 + Math.sin(time * 0.75) * 0.08;
      coreLight.position.copy(coreRoot.position);
    }
    for (let i = 0; i < platforms.length; i += 1) {
      const platform = platforms[i];
      const active = i === selected;
      platform.focus += ((active ? 1 : 0) - platform.focus) * (reduced ? 1 : Math.min(1, dt * 6.5));
      const floatY = active || reduced ? 0 : Math.sin(time * 1.15 + platform.phase) * 0.045;
      platform.root.position.y = active ? 2.7 : platform.baseY + floatY;
      platform.root.rotation.y = 0;
      platform.disc.rotation.y += dt * (active ? 0 : 0.08) * (reduced ? 0 : 1);
      platform.holder.rotation.z = active || reduced ? 0 : Math.sin(time * 0.65 + platform.phase) * 0.012;
    }
  }

  focus(0);
  return {
    group,
    camera: overviewView,
    update,
    focus,
    overview: () => {
      focus(-1);
      return overviewView;
    },
    dispose: () => scope.dispose(),
  };
}

export function buildRoom(id, ctx) {
  if (!ROOM_IDS.has(id)) return null;
  if (!ctx || !ctx.THREE) throw new TypeError("rooms-b requires a Three.js context");
  const builders = { music: buildMusic, sport: buildSport, series: buildSeries, films: buildFilms, games: buildGames };
  const room = builders[id](ctx);
  room.group.userData.worldRoom = id;
  room.group.userData.visibleItems = visibleItems(ctx.items).length;
  room.group.userData.textureLimit = VISIBLE_LIMIT;
  return room;
}

export default buildRoom;
