const TAU = Math.PI * 2;
const SLOT_COUNT = 3;

export function buildExperience(kit) {
  if (!kit?.THREE || !kit.sculpt) {
    throw new Error("films experience requires THREE and kit.sculpt");
  }

  const { THREE, sculpt } = kit;
  const collection = isRecord(kit.collection) ? kit.collection : { id: "films", items: [] };
  const items = Array.isArray(collection.items) ? collection.items.filter(isRecord) : [];
  const group = new THREE.Group();
  group.name = "折光剪辑场";

  const materials = {
    porcelain: resolveMaterial(kit.stone, 0xd8d0bf, 0.84, 0.03),
    ivory: resolveMaterial(kit.cream, 0xeee7d8, 0.74, 0),
    walnut: resolveMaterial(kit.walnut, 0x483126, 0.68, 0),
    brass: resolveMaterial(kit.brass, 0xa98248, 0.27, 0.76),
    ink: resolveMaterial(kit.dark, 0x121817, 0.48, 0.16),
    green: resolveMaterial(kit.green, 0x5e7261, 0.72, 0.05),
    wine: kit.material(0x6d2e36, 0.86, 0.01),
    goldDark: kit.material(0x6f5733, 0.42, 0.48),
    copper: kit.material(0x9e623d, 0.35, 0.64),
    lens: kit.material(0x8d8d86, 0.22, 0.9),
    glow: kit.material(0xe0bd7b, 0.22, 0.22),
    frameBlack: kit.material(0x171b1a, 0.32, 0.22),
  };
  if (materials.glow.emissive) {
    materials.glow.emissive.set(0x9a662b);
    materials.glow.emissiveIntensity = 0.55;
  }

  const stripMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x211916,
    roughness: 0.32,
    metalness: 0.14,
    transparent: false,
    opacity: 1,
    side: THREE.DoubleSide,
    clearcoat: 0.45,
    clearcoatRoughness: 0.22,
    depthWrite: true,
  });
  const perforationAlpha = makePerforationAlpha(THREE);
  if (perforationAlpha) {
    stripMaterial.alphaMap = perforationAlpha;
    stripMaterial.alphaTest = 0.5;
    stripMaterial.needsUpdate = true;
  }
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0xe4c482,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const filmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.18, 4.4, -0.92),
    new THREE.Vector3(-2.24, 3.86, -0.18),
    new THREE.Vector3(-2.72, 3.16, 0.54),
    new THREE.Vector3(-1.42, 2.78, 0.92),
    new THREE.Vector3(0, 3.16, 1.04),
    new THREE.Vector3(1.42, 2.78, 0.92),
    new THREE.Vector3(2.72, 3.16, 0.54),
    new THREE.Vector3(2.24, 3.86, -0.18),
    new THREE.Vector3(2.18, 4.4, -0.92),
  ], false, "centripetal", 0.42);
  const LENS_HOME = Object.freeze([2.55, 2.3, 0.94]);
  const slotGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x8d6a4a,
    roughness: 0.16,
    metalness: 0.08,
    transparent: true,
    opacity: 0.34,
    transmission: 0.18,
    thickness: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const state = {
    frame: items.length ? 0 : -1,
    frameProgress: 0,
    clips: initialClipSlots(items.length),
    spliced: false,
    lensPosition: LENS_HOME.slice(),
    active: true,
    disposed: false,
    stripMotion: 0,
    gearVelocity: 0,
    selectedSlot: 0,
    lensDragStart: LENS_HOME.slice(),
    lastStatusAt: 0,
  };
  const visual = {
    reelAngle: 0,
    slotLift: [0, 0, 0],
    markerPulse: 0,
  };
  const reelNodes = [];
  const rollerNodes = [];
  const gearNodes = [];
  const clipSlots = [];
  const screenNodes = [];
  let stripMesh;
  let stripMarkers;
  let currentCaption;
  let clipCaption;
  let lensRig;
  let lensHousing;
  let lensProxy;
  let spliceLever;
  let beamMesh;
  let beamPosition;
  let frameGaugeNeedle;
  let activeLease = true;

  buildFragmentaryFloor();
  buildOpticalBays();
  buildFilmLoop();
  buildGuideTrain();
  buildEditingTable();
  buildProjectionScreens();
  buildProjectionLens();
  buildGearBank();
  buildControlLabels();
  selectFrame(state.frame, false);
  updateClipSlots();
  applySplice(false);

  return {
    group,
    focus: new THREE.Vector3(0, 2.8, 0),
    update,
    interact,
    getState,
    setActive,
    dispose,
  };

  function buildFragmentaryFloor() {
    rounded(4.2, 0.46, 2.75, materials.porcelain, group, [0, 0.23, -0.02], [0, 0.03, 0], 0.12);
    rounded(2.2, 0.34, 3.1, materials.ivory, group, [-2.35, 0.17, 0.66], [0, -0.24, 0], 0.1);
    rounded(2.0, 0.28, 2.45, materials.walnut, group, [2.5, 0.14, 0.92], [0, 0.22, 0], 0.08);
    rounded(2.45, 0.18, 0.52, materials.brass, group, [0.12, 0.48, 1.18], [0, -0.04, 0], 0.045);
    for (const x of [-1.16, 1.4]) {
      rounded(0.18, 0.28, 0.6, materials.walnut, group, [x, 0.43, 1.18], [0, -0.04, 0], 0.035);
    }

    const foundationRibs = [];
    for (let index = 0; index < 22; index += 1) {
      const x = -2.9 + index * 0.275;
      foundationRibs.push({
        position: [x, 0.42 + (index % 3) * 0.035, -0.82 + Math.sin(index * 0.8) * 0.16],
        rotation: [0.12, -0.2 + index * 0.02, (index % 2 ? -1 : 1) * 0.18],
        scale: [0.65 + (index % 4) * 0.1, 1, 1],
      });
    }
    sculpt.instances(new THREE.BoxGeometry(0.04, 0.54, 0.045), materials.brass, foundationRibs, group);

    for (const side of [-1, 1]) {
      tube([
        [side * 2.9, 0.42, 1.28],
        [side * 2.75, 1.42, 1.52],
        [side * 2.3, 2.34, 1.2],
        [side * 1.75, 3.06, 0.48],
      ], 0.045, materials.goldDark, group, 36, 6);
    }
  }

  function buildOpticalBays() {
    const bays = [
      { x: -2.85, y: 2.65, z: -0.82, width: 0.16, height: 3.6, twist: -0.2 },
      { x: 2.82, y: 3.12, z: -0.48, width: 0.14, height: 4.45, twist: 0.18 },
      { x: -0.34, y: 4.68, z: -1.28, width: 0.12, height: 3.1, twist: 0.04 },
    ];
    bays.forEach((bay, index) => {
      rounded(bay.width, bay.height, bay.width, materials.walnut, group, [bay.x, bay.y, bay.z], [0, bay.twist, index === 1 ? -0.08 : 0.07], 0.035);
      rounded(0.5, 0.12, 0.46, materials.brass, group, [bay.x, bay.y + bay.height / 2, bay.z], [0, bay.twist, 0], 0.035);
      rounded(0.68, 0.1, 0.58, materials.porcelain, group, [bay.x, bay.y - bay.height / 2, bay.z], [0, bay.twist, 0], 0.05);
    });

    tube([
      [-2.85, 4.45, -0.82],
      [-1.78, 5.18, -1.04],
      [-0.34, 5.72, -1.28],
      [1.22, 5.24, -1.02],
      [2.82, 4.56, -0.48],
    ], 0.055, materials.brass, group, 54, 7);
    tube([
      [-2.85, 2.2, -0.82],
      [-1.2, 2.62, 0.22],
      [0, 2.94, 0.62],
      [1.28, 2.58, 0.2],
      [2.82, 2.16, -0.48],
    ], 0.032, materials.copper, group, 54, 6);

    const hangers = [];
    for (let index = 0; index < 16; index += 1) {
      const t = index / 15;
      const x = lerp(-2.75, 2.72, t);
      hangers.push({
        position: [x, 5.38 + Math.sin(t * Math.PI) * 0.16, -1.04],
        rotation: [0, 0, (index % 2 ? -1 : 1) * 0.08],
        scale: [1, 0.72 + (index % 4) * 0.12, 1],
      });
    }
    sculpt.instances(new THREE.BoxGeometry(0.035, 0.52, 0.045), materials.brass, hangers, group);
  }

  function buildFilmLoop() {
    stripMesh = sculpt.surface((u, v) => {
      const point = stripPoint(u);
      return [point[0], point[1] + (v - 0.5) * 0.58, point[2]];
    }, 112, 2, stripMaterial, group);
    stripMesh.castShadow = true;
    stripMesh.receiveShadow = false;

    const lowEdge = [];
    const highEdge = [];
    const markerPlacements = [];
    for (let index = 0; index <= 72; index += 1) {
      const u = index / 72;
      const point = stripPoint(u);
      const ahead = stripPoint(Math.min(1, u + 0.0025));
      const angle = -Math.atan2(ahead[2] - point[2], ahead[0] - point[0]);
      lowEdge.push([point[0], point[1] - 0.275, point[2]]);
      highEdge.push([point[0], point[1] + 0.275, point[2]]);
    }
    tube(lowEdge, 0.018, materials.goldDark, group, 96, 5);
    tube(highEdge, 0.018, materials.goldDark, group, 96, 5);

    for (let index = 0; index < Math.max(24, items.length); index += 1) {
      const u = (index + 0.5) / Math.max(24, items.length);
      const point = stripPoint(u);
      const ahead = stripPoint(Math.min(1, u + 0.003));
      const angle = -Math.atan2(ahead[2] - point[2], ahead[0] - point[0]);
      markerPlacements.push({
        position: [point[0], point[1], point[2] + 0.028],
        rotation: [0, angle, 0],
        scale: [1, 1, 1],
      });
    }
    const markerMaterial = kit.material(0xffffff, 0.42, 0.14);
    stripMarkers = sculpt.instances(new THREE.BoxGeometry(0.18, 0.29, 0.018), markerMaterial, markerPlacements, group);
    stripMarkers.castShadow = false;
    updateMarkerColors();

    for (const endpoint of [0, 1]) {
      const point = filmCurve.getPointAt(endpoint);
      const tangent = filmCurve.getTangentAt(endpoint).normalize();
      const collar = sculpt.ring(0.36, 0.035, materials.brass, group, point.toArray());
      collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      for (const offset of [-0.045, 0.045]) {
        const cheek = sculpt.ring(0.28, 0.014, materials.copper, group, point.toArray());
        cheek.quaternion.copy(collar.quaternion);
        cheek.position.addScaledVector(tangent, offset);
      }
    }

    kit.register(stripMesh, filmDragSpec("projection-film", "穿孔胶片", "左右拖动胶片逐帧浏览真实 24 部电影"));

    const frameProxy = sculpt.rounded(
      2.1,
      0.88,
      0.18,
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
      group,
      [0, 3.18, 1.2],
      0.03,
    );
    frameProxy.castShadow = false;
    kit.register(frameProxy, filmDragSpec("film-window", "胶片观察窗", "拖动中央胶片带换片"));
  }

  function buildGuideTrain() {
    const stations = [0.06, 0.2, 0.37, 0.55, 0.76, 0.91];
    const up = new THREE.Vector3(0, 1, 0);
    stations.forEach((u, index) => {
      const point = filmCurve.getPointAt(u);
      const tangent = filmCurve.getTangentAt(u).normalize();
      const side = tangent.clone().cross(up).normalize();
      const normal = side.clone().cross(tangent).normalize();
      const radius = index % 2 ? 0.34 : 0.46;
      const center = point.clone().addScaledVector(normal, radius * 0.94);
      const holder = new THREE.Group();
      holder.position.copy(center);
      holder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), side);
      group.add(holder);
      sculpt.ring(radius, 0.045, materials.brass, holder, [0, 0, 0]);
      sculpt.ring(index % 2 ? 0.2 : 0.27, 0.018, materials.goldDark, holder, [0, 0, 0.02]);
      const spokes = [];
      const count = index % 2 ? 10 : 14;
      for (let spoke = 0; spoke < count; spoke += 1) {
        const angle = spoke / count * TAU;
        spokes.push({
          position: [Math.cos(angle) * (index % 2 ? 0.2 : 0.27), Math.sin(angle) * (index % 2 ? 0.2 : 0.27), 0.02],
          rotation: [0, 0, angle],
          scale: [1, index % 2 ? 0.84 : 0.98, 1],
        });
      }
      sculpt.instances(new THREE.BoxGeometry(0.018, index % 2 ? 0.16 : 0.2, 0.02), materials.brass, spokes, holder);
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 16), materials.ink);
      axle.rotation.x = Math.PI / 2;
      holder.add(axle);
      for (const offset of [-0.17, 0.17]) {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.055, 14), materials.brass);
        cap.rotation.x = Math.PI / 2;
        cap.position.set(0, 0, offset);
        holder.add(cap);
      }
      rollerNodes.push({
        group: holder,
        speed: (index % 2 ? -1 : 1) * (0.8 + index * 0.08),
      });
    });

    [
      { x: -3.2, y: 5.16, z: -1.32, direction: 1 },
      { x: 3.2, y: 5.16, z: -1.32, direction: -1 },
    ].forEach((spec, index) => {
      const reel = new THREE.Group();
      reel.position.set(spec.x, spec.y, spec.z);
      reel.rotation.y = index ? -0.22 : 0.18;
      group.add(reel);
      const wound = new THREE.Mesh(
        new THREE.CylinderGeometry(index ? 0.9 : 1.04, index ? 0.9 : 1.04, 0.42, 56),
        stripMaterial,
      );
      wound.rotation.x = Math.PI / 2;
      reel.add(wound);
      for (const z of [-0.24, -0.08, 0.08, 0.24]) {
        sculpt.ring(index ? 1.18 : 1.34, 0.026, materials.brass, reel, [0, 0, z]);
      }
      const reelSpokes = [];
      for (let spoke = 0; spoke < 20; spoke += 1) {
        const angle = spoke / 20 * TAU;
        reelSpokes.push({
          position: [Math.cos(angle) * 0.66, Math.sin(angle) * 0.66, 0.29],
          rotation: [0, 0, angle],
          scale: [1, index ? 0.85 : 1, 1],
        });
      }
      sculpt.instances(new THREE.BoxGeometry(0.022, 0.64, 0.03), materials.brass, reelSpokes, reel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.6, 24), materials.lens);
      hub.rotation.x = Math.PI / 2;
      reel.add(hub);
      for (const z of [-0.34, 0.34]) {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.08, 20), materials.brass);
        cap.rotation.x = Math.PI / 2;
        cap.position.z = z;
        reel.add(cap);
      }
      const axleGuard = sculpt.ring(0.3, 0.024, materials.brass, reel, [0, 0, 0.32]);
      axleGuard.rotation.z = index * 0.14;
      const grip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), materials.wine);
      grip.position.set(spec.direction * 1.48, 0, 0.1);
      reel.add(grip);
      tube([
        [0, 0, 0.22],
        [spec.direction * 0.8, 0, 0.18],
        [spec.direction * 1.46, 0, 0.1],
      ], 0.028, materials.brass, reel, 22, 5);
      const frontHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 24), materials.copper);
      frontHandle.rotation.x = Math.PI / 2;
      frontHandle.position.z = 0.44;
      reel.add(frontHandle);
      const handleBar = rounded(0.5, 0.07, 0.08, materials.brass, reel, [0, 0, 0.52], [0, 0, index ? 0.55 : -0.55], 0.025);
      handleBar.castShadow = true;
      reelNodes.push({ reel, direction: spec.direction });

      const proxy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 0.12, 24),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
      );
      proxy.rotation.x = Math.PI / 2;
      proxy.position.z = 0.62;
      reel.add(proxy);
      kit.register(proxy, filmDragSpec(`film-reel-${index + 1}`, `第 ${index + 1} 胶片卷盘`, "拖动大卷盘换片，胶带与导轮同步"));
    });
  }

  function buildEditingTable() {
    rounded(4.1, 0.22, 1.62, materials.walnut, group, [0, 1.06, 1.72], [0, 0.02, 0], 0.07);
    rounded(3.75, 0.08, 1.35, materials.brass, group, [0, 1.2, 1.72], [0, 0.02, 0], 0.04);
    rounded(1.08, 0.2, 0.82, materials.ink, group, [0, 1.34, 1.82], [0, 0, 0], 0.06);

    for (let index = 0; index < SLOT_COUNT; index += 1) {
      const x = (index - 1) * 1.23;
      const holder = new THREE.Group();
      holder.position.set(x, 1.34, 2.24);
      holder.userData.baseY = holder.position.y;
      group.add(holder);
      rounded(0.98, 0.14, 0.92, materials.frameBlack, holder, [0, -0.11, 0], [0, 0, 0], 0.055);
      rounded(0.88, 0.055, 0.78, materials.goldDark, holder, [0, -0.02, 0.01], [0, 0, 0], 0.035);
      rounded(0.76, 0.05, 0.64, slotGlassMaterial, holder, [0, 0.04, 0.04], [0, 0, 0], 0.03);
      const image = makeImage(items[index] || items[0], 0.52, 0.33, holder, [0, 0.08, 0.085]);
      const proxy = hitProxy(1.03, 0.5, 0.94, holder, [0, 0.02, 0.02]);
      const digit = makeText(`SLOT ${index + 1}`, 0.66, 0.12, holder, [0, -0.22, 0.18], {
        background: null,
        color: "#dbc69d",
        fontSize: 15,
        align: "center",
        serif: false,
      });
      const drag = {
        startIndex: index,
        targetIndex: index,
        moved: false,
      };
      kit.register(proxy, {
        id: `clip-slot-${index + 1}`,
        label: `剪辑槽 ${index + 1}`,
        hint: "轻点选入当前电影；左右拖到相邻槽位交换片段",
        onDown() {
          drag.startIndex = index;
          drag.targetIndex = index;
          drag.moved = false;
          state.selectedSlot = index;
          clipSlots.forEach((slot, slotIndex) => {
            slot.holder.position.y = slot.holder.userData.baseY + (slotIndex === index ? -0.052 : 0);
            slot.holder.scale.setScalar(slotIndex === index ? 1.035 : 1);
          });
          kit.invalidate?.();
        },
        onDrag({ totalX }) {
          if (drag.moved) return;
          if (totalX > 58 && index < SLOT_COUNT - 1) {
            drag.targetIndex = index + 1;
            moveClipSlot(index, index + 1);
            drag.moved = true;
          } else if (totalX < -58 && index > 0) {
            drag.targetIndex = index - 1;
            moveClipSlot(index, index - 1);
            drag.moved = true;
          }
        },
        onUp() {
          if (drag.moved) kit.status?.(`剪辑片段已移到槽位 ${drag.targetIndex + 1}`);
        },
        onClick() {
          if (drag.moved || state.frame < 0) return;
          state.selectedSlot = index;
          state.clips[index] = state.frame;
          state.spliced = false;
          updateClipSlots();
          applySplice(false);
          kit.status?.(`${filmTitle(items[state.frame])} 已放入剪辑槽 ${index + 1}`);
          kit.invalidate?.();
        },
        onKey(key) {
          if (key === "ArrowLeft") moveClipSlot(index, index - 1);
          if (key === "ArrowRight") moveClipSlot(index, index + 1);
          if (key === "Enter" || key === " ") {
            state.selectedSlot = index;
            state.clips[index] = state.frame;
            state.spliced = false;
            updateClipSlots();
            applySplice(false);
            kit.status?.(`${filmTitle(items[state.frame])} 已放入剪辑槽 ${index + 1}`);
          }
        },
      });
      clipSlots.push({ holder, image, proxy, digit, index });
    }

    const spliceRoot = new THREE.Group();
    spliceRoot.position.set(0, 1.38, 2.78);
    spliceRoot.rotation.x = -0.18;
    group.add(spliceRoot);
    rounded(0.92, 0.11, 0.42, materials.ink, spliceRoot, [0, -0.13, 0], [0, 0, 0], 0.045);
    rounded(0.18, 0.13, 0.2, materials.brass, spliceRoot, [-0.25, -0.18, -0.06], [0, 0, 0.12], 0.03);
    rounded(0.18, 0.13, 0.2, materials.copper, spliceRoot, [0.25, -0.25, -0.16], [0, 0, -0.18], 0.03);
    spliceLever = new THREE.Group();
    spliceLever.position.set(0, 0, 0);
    spliceRoot.add(spliceLever);
    tube([
      [0, 0, 0],
      [0, 0.52, -0.04],
      [0, 0.9, -0.18],
    ], 0.045, materials.brass, spliceLever, 20, 7);
    const grip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), materials.wine);
    grip.position.set(0, 0.92, -0.19);
    spliceLever.add(grip);
    const spliceProxy = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 18, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
    );
    spliceProxy.position.set(0, 0.92, -0.07);
    spliceLever.add(spliceProxy);
    kit.register(spliceProxy, {
      id: "splice-lever",
      label: "实体拼接杆",
      hint: "按下，把三个剪辑槽接成可投映的真实片单",
      onClick() {
        toggleSplice();
      },
      onKey(key) {
        if (key === "Enter" || key === " ") toggleSplice();
      },
    });
  }

  function buildProjectionScreens() {
    const screenRoot = new THREE.Group();
    screenRoot.position.set(0, 3.5, -2.92);
    screenRoot.rotation.x = -0.025;
    group.add(screenRoot);
    for (let index = 0; index < SLOT_COUNT; index += 1) {
      const holder = new THREE.Group();
      holder.position.set((index - 1) * 1.18, index === 1 ? 0.18 : 0, index === 1 ? 0.08 : 0);
      screenRoot.add(holder);
      rounded(1.04, 1.56, 0.1, materials.frameBlack, holder, [0, 0, 0], [0, 0, 0], 0.04);
      rounded(0.9, 1.4, 0.025, materials.ink, holder, [0, 0, 0.065], [0, 0, 0], 0.03);
      const image = makeImage(items[index] || items[0], 0.82, 1.27, holder, [0, 0, 0.088]);
      const proxy = hitProxy(0.9, 1.38, 0.14, holder, [0, 0, 0.1]);
      kit.register(proxy, {
        id: `projection-frame-${index + 1}`,
        label: "已投映电影画面",
        hint: "点击当前真实电影查看资料与来源",
        onClick() {
          const itemIndex = screenItemIndex(index);
          if (itemIndex >= 0) openItem(itemIndex);
        },
        onKey(key) {
          if (key === "Enter" || key === " ") {
            const itemIndex = screenItemIndex(index);
            if (itemIndex >= 0) openItem(itemIndex);
          }
        },
      });
      screenNodes.push({
        holder,
        image,
        proxy,
        baseX: holder.position.x,
        baseY: holder.position.y,
        index,
      });
    }

    const gantry = [];
    for (let index = 0; index < 7; index += 1) {
      gantry.push({
        position: [0, 4.39 + index * 0.02, -2.98 - index * 0.035],
        rotation: [0, 0, 0],
        scale: [1 - index * 0.08, 1, 1],
      });
    }
    sculpt.instances(new THREE.BoxGeometry(3.82, 0.035, 0.045), materials.brass, gantry, group);
    for (const x of [-1.95, 1.95]) {
      rounded(0.12, 0.46, 0.18, materials.walnut, group, [x, 4.28, -2.95], [0, 0, 0], 0.03);
    }

    beamPosition = new Float32Array([
      -0.11, 2.05, 1.66,
      0.11, 2.05, 1.66,
      1.72, 2.55, -2.8,
      -1.72, 2.55, -2.8,
      -0.11, 2.05, 1.66,
      0.11, 2.05, 1.66,
      1.72, 4.1, -2.8,
      -1.72, 4.1, -2.8,
    ]);
    const beamGeometry = new THREE.BufferGeometry();
    beamGeometry.setAttribute("position", new THREE.BufferAttribute(beamPosition, 3));
    beamGeometry.setIndex([0, 1, 2, 0, 2, 3, 4, 7, 6, 4, 6, 5]);
    beamGeometry.computeVertexNormals();
    beamMesh = new THREE.Mesh(beamGeometry, beamMaterial);
    beamMesh.renderOrder = 3;
    group.add(beamMesh);
  }

  function buildProjectionLens() {
    lensRig = new THREE.Group();
    lensRig.position.set(...LENS_HOME);
    group.add(lensRig);
    lensHousing = sculpt.lathe([
      [0.16, 0],
      [0.26, 0.08],
      [0.5, 0.22],
      [0.58, 0.38],
      [0.34, 0.54],
      [0.24, 0.7],
      [0.29, 0.82],
      [0.14, 0.92],
    ], materials.brass, lensRig, [0, 0, 0], 64);
    lensHousing.rotation.x = Math.PI / 2;
    lensHousing.position.set(0, 0, -0.22);
    for (let index = 0; index < 5; index += 1) {
      const ring = sculpt.ring(0.28 + (index % 2) * 0.07, 0.018, materials.lens, lensRig, [0, 0, -0.42 + index * 0.15]);
      ring.rotation.z = index * 0.2;
    }
    const lensGlass = new THREE.Mesh(
      new THREE.CircleGeometry(0.19, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0xe7cc92,
        roughness: 0.04,
        metalness: 0.02,
        transparent: true,
        opacity: 0.68,
        transmission: 0.65,
        thickness: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    lensGlass.position.set(0, 0, -0.67);
    lensRig.add(lensGlass);
    const lensTrack = rounded(1.3, 0.16, 0.42, materials.ink, group, [2.55, 1.72, 0.94], [0, 0, 0], 0.06);
    lensTrack.castShadow = true;
    const lensTicks = [];
    for (let index = 0; index < 9; index += 1) {
      lensTicks.push({
        position: [2.07 + index * 0.12, 1.81, 1.16],
        rotation: [0, 0, 0],
        scale: [index % 4 === 0 ? 1.3 : 0.75, index % 4 === 0 ? 1.25 : 0.72, 1],
      });
    }
    sculpt.instances(new THREE.BoxGeometry(0.018, 0.11, 0.025), materials.brass, lensTicks, group);
    for (const x of [1.91, 3.19]) {
      rounded(0.13, 0.34, 0.3, materials.brass, group, [x, 2.05, 0.94], [0, 0, 0], 0.035);
    }
    tube([
      [2.07, 2.3, 0.94],
      [2.23, 1.98, 0.94],
      [2.55, 1.82, 0.96],
      [2.87, 1.98, 0.94],
      [3.03, 2.3, 0.94],
    ], 0.026, materials.brass, group, 28, 5);
    const frontCollar = sculpt.ring(0.34, 0.035, materials.brass, lensRig, [0, 0, 0.94]);
    frontCollar.rotation.z = 0.16;
    const frontBar = rounded(0.48, 0.045, 0.06, materials.copper, lensRig, [0, 0, 1], [0, 0, 0.24], 0.018);
    frontBar.castShadow = true;

    lensProxy = hitProxy(0.92, 0.82, 0.18, lensRig, [0, 0, 1.08]);
    kit.register(lensProxy, {
      id: "projection-lens",
      label: "投影镜头组件",
      hint: "上下左右拖动，改变光源位置、投射比例与三屏间距",
      onDown() {
        state.lensDragStart = state.lensPosition.slice();
      },
      onDrag({ totalX, totalY }) {
        const x = clamp(state.lensDragStart[0] + totalX / 135, 2.03, 3.08);
        const y = clamp(state.lensDragStart[1] - totalY / 150, 2.06, 2.72);
        const z = state.lensDragStart[2] + totalY * 0.0007;
        state.lensPosition = [x, y, clamp(z, 0.72, 1.2)];
        applyLensPosition();
        const offsetX = x - LENS_HOME[0];
        const offsetY = y - LENS_HOME[1];
        const horizontal = Math.abs(offsetX) < 0.04 ? "" : offsetX < 0 ? "左" : "右";
        const vertical = Math.abs(offsetY) < 0.04 ? "" : offsetY > 0 ? "上" : "下";
        const direction = horizontal && vertical
          ? `镜头向${horizontal}${vertical}`
          : horizontal
            ? `镜头偏${horizontal}`
            : vertical
              ? `镜头${vertical}移`
              : "镜头居中";
        const projectionScale = 1
          + Math.abs(offsetX) * 0.35
          + Math.abs(offsetY) * 0.2
          + Math.max(0, state.lensPosition[2] - LENS_HOME[2]) * 0.8;
        kit.status?.(`${direction} · 投影比例 ${projectionScale.toFixed(2)}`);
        kit.invalidate?.();
      },
      onUp() {
        state.lensPosition = [
          lensRig.position.x,
          lensRig.position.y,
          lensRig.position.z,
        ];
      },
      onClick() {
        state.lensPosition = LENS_HOME.slice();
        applyLensPosition();
        kit.status?.("镜头回到光学链中心");
      },
      onKey(key) {
        if (key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown") {
          const x = clamp(state.lensPosition[0] + (key === "ArrowLeft" ? -0.08 : key === "ArrowRight" ? 0.08 : 0), 2.03, 3.08);
          const y = clamp(state.lensPosition[1] + (key === "ArrowUp" ? 0.08 : key === "ArrowDown" ? -0.08 : 0), 2.06, 2.72);
          state.lensPosition = [x, y, state.lensPosition[2]];
          applyLensPosition();
        }
      },
    });
    applyLensPosition();
  }

  function buildGearBank() {
    const bank = new THREE.Group();
    bank.position.set(-2.48, 1.76, -0.22);
    bank.rotation.y = 0.28;
    group.add(bank);
    [
      [0.58, 20, -0.48, 0],
      [0.38, 14, 0.12, 0.42],
      [0.31, 12, 0.56, -0.18],
      [0.23, 10, 0.78, 0.36],
    ].forEach(([radius, teeth, x, y], index) => {
      gearNodes.push({
        mesh: sculpt.gear(radius, 0.11, teeth, index % 2 ? materials.copper : materials.brass, bank, [x, y, 0]),
        direction: index % 2 ? -1 : 1,
        ratio: 1 + index * 0.25,
      });
    });
    tube([
      [-0.93, 0, 0],
      [-0.52, 0.12, 0],
      [-0.18, 0.1, 0],
      [0.72, 0.02, 0],
      [1.02, 0.08, 0],
    ], 0.025, materials.brass, bank, 36, 5);

    const winch = new THREE.Group();
    winch.position.set(-3.46, 1.44, 1.72);
    winch.rotation.y = 0.08;
    group.add(winch);
    rounded(0.96, 0.16, 0.64, materials.walnut, winch, [0, -0.25, -0.04], [0, 0, 0], 0.055);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.84, 32), materials.ink);
    drum.rotation.z = Math.PI / 2;
    winch.add(drum);
    for (const x of [-0.36, 0.36]) {
      const flange = sculpt.ring(0.4, 0.038, materials.brass, winch, [x, 0, 0]);
      flange.rotation.y = Math.PI / 2;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.08, 18), materials.brass);
      cap.rotation.z = Math.PI / 2;
      cap.position.x = x * 1.08;
      winch.add(cap);
    }
    tube([
      [0.42, 0, 0],
      [0.78, 0.18, 0],
      [0.92, 0.48, 0.04],
      [0.86, 0.78, 0.09],
    ], 0.026, materials.brass, winch, 24, 6);
    const winchGrip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 15, 10), materials.wine);
    winchGrip.position.set(0.86, 0.8, 0.09);
    winch.add(winchGrip);
    const gripCap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 14), materials.brass);
    gripCap.rotation.x = Math.PI / 2;
    gripCap.position.set(0.86, 0.8, 0.18);
    winch.add(gripCap);
    tube([
      [-0.36, -0.18, 0],
      [-0.62, 0.34, 0.1],
      [-0.92, 0.8, 0.2],
    ], 0.014, materials.goldDark, winch, 28, 5);
    const winchProxy = hitProxy(0.52, 0.52, 0.2, winch, [0.86, 0.8, 0.23]);
    kit.register(winchProxy, filmDragSpec("film-winch", "胶片绞盘", "拖动绞盘，胶片、导轮和目录帧一起移动"));
  }

  function buildControlLabels() {
    const title = makeText("折光剪辑场", 2.5, 0.38, group, [0, 7.28, 0.32], {
      background: null,
      color: "#e8ddc9",
      fontSize: 42,
      align: "center",
      serif: true,
    });
    if (title) title.rotation.x = -0.04;

    currentCaption = makeText("", 2.35, 0.44, group, [0, 0.48, 2.72], {
      background: null,
      color: "#e8d7b8",
      fontSize: 19,
      align: "center",
      serif: false,
    });
    clipCaption = makeText("", 2.8, 0.34, group, [0, 1.73, 2.4], {
      background: null,
      color: "#d2ba8c",
      fontSize: 17,
      align: "center",
      serif: false,
    });
    makeText("FRAME INDEX", 1.1, 0.16, group, [2.62, 1.72, 2.38], {
      background: null,
      color: "#d6c39e",
      fontSize: 14,
      align: "center",
      serif: false,
    });
    const gauge = new THREE.Group();
    gauge.position.set(2.62, 1.34, 2.12);
    group.add(gauge);
    rounded(1.05, 0.24, 0.34, materials.ink, gauge, [0, 0, 0], [0, 0, 0], 0.045);
    const gaugeTicks = [];
    for (let index = 0; index < 13; index += 1) {
      gaugeTicks.push({
        position: [-0.43 + index * 0.0717, 0.015, 0.19],
        rotation: [0, 0, 0],
        scale: [index % 3 === 0 ? 1.3 : 0.7, index % 3 === 0 ? 1.2 : 0.7, 1],
      });
    }
    sculpt.instances(new THREE.BoxGeometry(0.014, 0.1, 0.02), materials.brass, gaugeTicks, gauge);
    for (const x of [-0.48, 0.48]) {
      rounded(0.06, 0.18, 0.08, materials.copper, gauge, [x, 0, 0.04], [0, 0, 0], 0.015);
    }
    frameGaugeNeedle = new THREE.Group();
    frameGaugeNeedle.position.z = 0.22;
    gauge.add(frameGaugeNeedle);
    rounded(0.025, 0.19, 0.03, materials.glow, frameGaugeNeedle, [0, 0, 0], [0, 0, 0], 0.008);
    updateFrameCaption();
    updateClipCaption();
  }

  function filmDragSpec(id, label, hint) {
    return {
      id,
      label,
      hint,
      onDown() {
        state.stripMotion = 0;
      },
      onDrag({ dx, dy }) {
        state.stripMotion = dx * 0.8 - dy * 0.28;
        state.gearVelocity = state.stripMotion * 0.025;
        const next = wrapFloat(state.frameProgress + dx * 0.026 - dy * 0.012, Math.max(1, items.length));
        selectFrame(Math.round(next), false);
        state.frameProgress = next;
        syncDirectoryMotion();
        notifyFrameThrottled();
      },
      onUp() {
        state.frameProgress = state.frame;
        syncDirectoryMotion();
        kit.invalidate?.();
      },
      onClick() {
        selectFrame(state.frame + 1, true);
      },
      onKey(key) {
        if (key === "ArrowLeft") selectFrame(state.frame - 1, true);
        if (key === "ArrowRight") selectFrame(state.frame + 1, true);
        if (key === "Home") selectFrame(0, true);
        if (key === "End") selectFrame(items.length - 1, true);
      },
    };
  }

  function selectFrame(value, announce) {
    if (!items.length) {
      state.frame = -1;
      state.frameProgress = 0;
      updateFrameCaption();
      return -1;
    }
    const index = typeof value === "string"
      ? Math.max(0, items.findIndex((item) => String(item.id) === value))
      : modulo(Math.round(Number(value) || 0), items.length);
    const changed = index !== state.frame;
    state.frame = index;
    state.frameProgress = index;
    state.selectedSlot = modulo(state.selectedSlot, SLOT_COUNT);
    if (changed) {
      visual.markerPulse = 1;
      updateMarkerColors();
      if (!state.spliced) setScreenImage(screenNodes[1]?.image, items[index]);
      updateFrameCaption();
    }
    syncDirectoryMotion();
    if (announce) {
      const item = items[index];
      kit.status?.(`胶片帧 ${String(index + 1).padStart(2, "0")} / ${items.length} · ${filmTitle(item)} · ${filmMeta(item)}`);
    }
    kit.invalidate?.();
    return index;
  }

  function updateClipSlots() {
    clipSlots.forEach((slot, index) => {
      const itemIndex = state.clips[index];
      setImageSource(slot.image, items[itemIndex]);
      slot.holder.scale.setScalar(index === state.selectedSlot ? 1.035 : 1);
    });
    if (!state.spliced) setScreenImage(screenNodes[1]?.image, items[state.frame]);
    updateClipCaption();
  }

  function moveClipSlot(from, to) {
    if (to < 0 || to >= SLOT_COUNT || from === to) {
      kit.status?.("剪辑槽已到边缘");
      return false;
    }
    const itemIndex = state.clips.splice(from, 1)[0];
    state.clips.splice(to, 0, itemIndex);
    state.selectedSlot = to;
    state.spliced = false;
    applySplice(false);
    updateClipSlots();
    kit.status?.(`片段调序：槽位 ${from + 1} → ${to + 1}`);
    kit.invalidate?.();
    return true;
  }

  function toggleSplice() {
    if (!canSplice()) {
      kit.status?.("三个剪辑槽需要三份不同的真实电影");
      state.spliced = false;
      applySplice(false);
      return false;
    }
    state.spliced = !state.spliced;
    applySplice(true);
    kit.status?.(state.spliced ? "三格片单已接合 · 银幕显示真实拼接结果" : "拼接解除 · 回到单片单帧预览");
    kit.invalidate?.();
    return state.spliced;
  }

  function applySplice(announce) {
    const ready = state.spliced && canSplice();
    screenNodes.forEach((screen, index) => {
      const itemIndex = screenItemIndex(index);
      screen.image && (screen.image.visible = index === 1 || ready);
      screen.proxy.visible = index === 1 || ready;
      if (index !== 1 || ready) setScreenImage(screen.image, items[itemIndex]);
      screen.holder.position.y = screen.baseY + (ready ? index === 1 ? 0.2 : 0.08 : index === 1 ? 0.18 : 0);
      screen.holder.position.x = screen.baseX * (ready ? 1 : 0.5);
    });
    if (spliceLever) {
      spliceLever.rotation.z = state.spliced ? -0.58 : 0;
    }
    if (materials.glow.emissive) {
      materials.glow.emissiveIntensity = state.spliced ? 1.25 : 0.48;
    }
    beamMaterial.opacity = state.spliced ? 0.2 : 0.1;
    updateClipCaption();
    if (announce) updateClipSlots();
  }

  function canSplice() {
    return state.clips.length === SLOT_COUNT
      && state.clips.every((index) => Number.isInteger(index) && index >= 0 && index < items.length)
      && new Set(state.clips).size === SLOT_COUNT;
  }

  function screenItemIndex(screenIndex) {
    if (state.spliced && canSplice()) return state.clips[screenIndex];
    return state.frame >= 0 ? state.frame : (items.length ? 0 : -1);
  }

  function applyLensPosition() {
    if (!lensRig) return;
    const [x, y, z] = state.lensPosition;
    lensRig.position.set(x, y, z);
    const scale = 1 + z * 0.34 + Math.abs(x) * 0.08;
    screenNodes.forEach((screen, index) => {
      const spread = state.spliced ? 1.18 : 0.52;
      screen.holder.position.x = (index - 1) * spread * scale;
      screen.holder.scale.setScalar(0.9 + scale * 0.08);
    });
    if (beamMesh?.geometry?.attributes?.position) {
      const attribute = beamMesh.geometry.attributes.position;
      const startY = lensRig.position.y;
      const startZ = lensRig.position.z - 0.12;
      const startHalf = 0.09 + Math.abs(x) * 0.05;
      const endHalf = 1.58 + z * 0.42 + Math.abs(x) * 0.12;
      const endY = 3.27;
      const endZ = -2.78;
      attribute.setXYZ(0, -startHalf, startY, startZ);
      attribute.setXYZ(1, startHalf, startY, startZ);
      attribute.setXYZ(2, endHalf, endY - 0.78, endZ);
      attribute.setXYZ(3, -endHalf, endY - 0.78, endZ);
      attribute.setXYZ(4, -startHalf, startY, startZ);
      attribute.setXYZ(5, startHalf, startY, startZ);
      attribute.setXYZ(6, endHalf, endY + 0.78, endZ);
      attribute.setXYZ(7, -endHalf, endY + 0.78, endZ);
      attribute.needsUpdate = true;
      beamMesh.geometry.computeVertexNormals();
    }
    if (lensProxy) lensProxy.rotation.z = (x - LENS_HOME[0]) * 0.18;
    updateFrameCaption();
    kit.invalidate?.();
  }

  function updateMarkerColors() {
    if (!stripMarkers) return;
    const color = new THREE.Color();
    for (let index = 0; index < stripMarkers.count; index += 1) {
      const active = index === state.frame;
      color.setHex(active ? 0xe3b966 : index < items.length ? 0x73444a : 0x3a3832);
      stripMarkers.setColorAt(index, color);
    }
    if (stripMarkers.instanceColor) stripMarkers.instanceColor.needsUpdate = true;
  }

  function updateFrameCaption() {
    const item = items[state.frame];
    const text = item
      ? `${String(state.frame + 1).padStart(2, "0")} / ${items.length}   ${filmTitle(item)}   ${filmMeta(item)}`
      : "等待真实电影目录";
    currentCaption = replaceText(currentCaption, text, 2.35, 0.44, group, [0, 0.48, 2.72], {
      background: null,
      color: "#e8d7b8",
      fontSize: 19,
      align: "center",
      serif: false,
    });
  }

  function syncDirectoryMotion() {
    const progress = items.length ? state.frameProgress / items.length : 0;
    reelNodes.forEach((node, index) => {
      node.reel.rotation.z = (progress + index * 0.17) * TAU * node.direction;
    });
    rollerNodes.forEach((node, index) => {
      node.group.rotation.z = progress * TAU * node.speed * (index + 1);
    });
    gearNodes.forEach((node) => {
      node.mesh.rotation.z = progress * TAU * node.ratio * node.direction;
    });
    if (frameGaugeNeedle) frameGaugeNeedle.position.x = lerp(-0.43, 0.43, items.length > 1 ? progress : 0);
  }

  function updateClipCaption() {
    const labels = state.clips.map((itemIndex, index) => {
      const item = items[itemIndex];
      return `${index + 1}:${item ? clip(filmTitle(item), 9) : "空"}`;
    });
    clipCaption = replaceText(
      clipCaption,
      `${labels.join("  ·  ")}   ${state.spliced ? "SPLICED" : "UNSPLICED"}`,
      2.8,
      0.34,
      group,
      [0, 1.73, 2.4],
      {
        background: null,
        color: "#d2ba8c",
        fontSize: 16,
        align: "center",
        serif: false,
      },
    );
  }

  function update(time, dt, active) {
    if (state.disposed || !state.active || !active) return;
    const step = clamp(Number(dt) || 0, 0, 0.05);
    const now = Number(time) || 0;
    const motion = kit.reducedMotion?.() ? 0 : 1;
    visual.reelAngle += step * (0.2 * motion + state.stripMotion * 0.006);
    state.stripMotion *= Math.exp(-step * 5.5);
    state.gearVelocity *= Math.exp(-step * 6.2);

    reelNodes.forEach((node) => {
      node.reel.rotation.z = visual.reelAngle * node.direction;
    });
    rollerNodes.forEach((node) => {
      node.group.rotation.z += step * node.speed * motion + state.stripMotion * 0.0008;
    });
    gearNodes.forEach((node) => {
      node.mesh.rotation.z += step * node.ratio * node.direction * motion + state.gearVelocity * node.direction;
    });

    visual.slotLift.forEach((value, index) => {
      const target = index === state.selectedSlot ? -0.052 : 0;
      visual.slotLift[index] = damp(value, target, 8, step);
      if (clipSlots[index]) clipSlots[index].holder.position.y = clipSlots[index].holder.userData.baseY + visual.slotLift[index];
    });
    clipSlots.forEach((slot, index) => {
      const targetScale = index === state.selectedSlot ? 1.04 : 1;
      const currentScale = slot.holder.scale.x;
      slot.holder.scale.setScalar(damp(currentScale, targetScale, 8, step));
      slot.holder.rotation.z = Math.sin(now * 0.45 + index) * 0.008 * motion;
    });

    screenNodes.forEach((screen, index) => {
      screen.holder.position.y = screen.baseY
        + (state.spliced ? (index === 1 ? 0.2 : 0.08) : index === 1 ? 0.18 : 0)
        + Math.sin(now * 0.46 + index) * 0.012 * motion;
      screen.holder.rotation.y = (index - 1) * (state.spliced ? -0.08 : -0.035);
    });

    visual.markerPulse = Math.max(0, visual.markerPulse - step * 2.2);
    if (materials.glow.emissive) {
      materials.glow.emissiveIntensity = 0.48 + (state.spliced ? 0.66 : 0) + visual.markerPulse * 0.35;
    }
    beamMaterial.opacity = (state.spliced ? 0.19 : 0.105) + Math.sin(now * 5.2) * 0.008;
    if (spliceLever) {
      spliceLever.rotation.z = damp(spliceLever.rotation.z, state.spliced ? -0.58 : 0, 7, step);
    }
    kit.invalidate?.();
  }

  function interact(action, index) {
    if (action === "select") return selectFrame(index, true);
    if (action === "splice") {
      toggleSplice();
      return state.spliced;
    }
    if (action === "slot" && Number.isFinite(Number(index))) {
      state.selectedSlot = modulo(Number(index), SLOT_COUNT);
      state.clips[state.selectedSlot] = state.frame;
      state.spliced = false;
      updateClipSlots();
      applySplice(false);
      return state.selectedSlot;
    }
    if (action === "reset") {
      state.frame = items.length ? 0 : -1;
      state.frameProgress = 0;
      state.clips = initialClipSlots(items.length);
      state.spliced = false;
      state.lensPosition = LENS_HOME.slice();
      state.selectedSlot = 0;
      state.gearVelocity = 0;
      state.stripMotion = 0;
      visual.reelAngle = 0;
      selectFrame(0, false);
      updateClipSlots();
      applySplice(false);
      applyLensPosition();
      kit.status?.("折光剪辑场已复位 · 胶片、镜头和三槽片单回到起点");
      kit.invalidate?.();
      return getState();
    }
    return null;
  }

  function getState() {
    const item = items[state.frame];
    return {
      frame: state.frame,
      frameProgress: Number(state.frameProgress.toFixed(3)),
      selected: item?.id ?? null,
      selectedTitle: filmTitle(item),
      clips: state.clips.slice(),
      clipIds: state.clips.map((itemIndex) => items[itemIndex]?.id || null),
      selectedSlot: state.selectedSlot,
      spliced: Boolean(state.spliced && canSplice()),
      lensPosition: state.lensPosition.map((value) => Number(value.toFixed(3))),
      itemCount: items.length,
      active: state.active && activeLease,
    };
  }

  function setActive(value) {
    activeLease = Boolean(value);
    state.active = activeLease;
  }

  function dispose() {
    state.disposed = true;
    state.active = false;
    activeLease = false;
    group.parent?.remove(group);
    group.visible = false;
  }

  function openItem(index) {
    const item = items[index];
    if (!item) return;
    if (typeof kit.onItemSelect === "function") {
      kit.onItemSelect(item);
    } else if (typeof kit.onSelect === "function") {
      kit.onSelect(collection.id || "films", index);
    }
  }

  function notifyFrameThrottled() {
    const now = Date.now();
    if (now - state.lastStatusAt < 110) return;
    state.lastStatusAt = now;
    const item = items[state.frame];
    kit.status?.(`胶片帧 ${String(state.frame + 1).padStart(2, "0")} / ${items.length} · ${filmTitle(item)} · ${filmMeta(item)}`);
  }

  function stripPoint(u) {
    return filmCurve.getPointAt(clamp(u, 0, 1)).toArray();
  }

  function makeImage(item, width, height, parent, position) {
    const url = itemImage(item);
    if (!url) return null;
    const image = kit.image(url, width, height, parent);
    if (!image) return null;
    image.position.set(position[0] || 0, position[1] || 0, position[2] || 0);
    image.userData.itemImage = url;
    image.castShadow = false;
    return image;
  }

  function setScreenImage(image, item) {
    if (!image || !item) return;
    setImageSource(image, item);
  }

  function setImageSource(image, item) {
    if (!image || !item) return;
    const url = itemImage(item);
    const texture = url && typeof kit.texture === "function" ? kit.texture(url) : null;
    if (!texture?.isTexture || !image.material) return;
    const list = Array.isArray(image.material) ? image.material : [image.material];
    list.forEach((material) => {
      material.map = texture;
      material.color?.set?.(0xffffff);
      material.needsUpdate = true;
    });
    image.userData.itemImage = url;
  }

  function hitProxy(width, height, depth, parent, position) {
    const proxy = sculpt.rounded(
      width,
      height,
      depth,
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
      parent,
      position,
      0.02,
    );
    proxy.castShadow = false;
    proxy.receiveShadow = false;
    return proxy;
  }

  function rounded(width, height, depth, material, parent, position = [0, 0, 0], rotation = [0, 0, 0], radius = 0.08) {
    const object = sculpt.rounded(width, height, depth, material, parent, position, radius);
    object.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
    object.castShadow = true;
    object.receiveShadow = true;
    return object;
  }

  function tube(points, radius, material, parent, segments = 48, sides = 7) {
    const object = sculpt.tube(points, radius, material, parent, segments, sides);
    object.castShadow = true;
    object.receiveShadow = true;
    return object;
  }

  function makeText(value, width, height, parent, position, options) {
    const object = sculpt.text(value, width, height, parent, options);
    if (!object) return null;
    object.position.set(position[0] || 0, position[1] || 0, position[2] || 0);
    object.userData.renderedText = value;
    return object;
  }

  function replaceText(current, value, width, height, parent, position, options) {
    if (current?.userData?.renderedText === value && current.parent === parent) {
      current.position.set(position[0] || 0, position[1] || 0, position[2] || 0);
      return current;
    }
    if (current) {
      current.parent?.remove(current);
      current.geometry?.dispose?.();
      const materialList = Array.isArray(current.material) ? current.material : [current.material];
      materialList.forEach((material) => {
        material?.map?.dispose?.();
        material?.dispose?.();
      });
    }
    return makeText(value, width, height, parent, position, options);
  }
}

function initialClipSlots(itemCount) {
  return Array.from({ length: SLOT_COUNT }, (_, index) => itemCount ? index % itemCount : -1);
}

function makePerforationAlpha(THREE) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000000";
  context.fillRect(18, 14, 28, 16);
  context.fillRect(18, 98, 28, 16);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(72, 1);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function resolveMaterial(value, fallbackColor, roughness, metalness) {
  if (value?.isMaterial) return value;
  return value || { isMaterial: true, color: fallbackColor, roughness, metalness };
}

function itemImage(item) {
  return textValue(item?.image || item?.poster || item?.thumb || item?.thumbnail || item?.original?.poster);
}

function filmTitle(item) {
  return textValue(item?.title || item?.name || item?.original?.title) || "未命名电影";
}

function filmMeta(item) {
  const director = textValue(item?.director || item?.original?.director);
  const year = textValue(item?.year || item?.original?.year || item?.meta);
  return [director, year].filter(Boolean).join(" · ") || "资料未记";
}

function textValue(value) {
  return value == null ? "" : String(value).replace(/\s+/g, " ").trim();
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clip(value, limit) {
  const text = textValue(value);
  return text.length > limit ? `${text.slice(0, Math.max(1, limit - 1)).trim()}…` : text;
}

function modulo(value, length) {
  if (!length) return 0;
  return ((Math.round(Number(value) || 0) % length) + length) % length;
}

function wrapFloat(value, length) {
  if (!length) return 0;
  return ((Number(value) || 0) % length + length) % length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function damp(current, target, smoothing, delta) {
  return current + (target - current) * (1 - Math.exp(-smoothing * delta));
}
