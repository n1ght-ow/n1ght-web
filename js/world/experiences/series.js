const TAU = Math.PI * 2;
const WINDOW_OFFSETS = [0, -1, 1, -2, 2, -3];
const BRANCH_COLORS = [0xc9a45d, 0x77927d];

export function buildExperience(kit) {
  if (!kit?.THREE || !kit.sculpt) {
    throw new Error("series experience requires THREE and kit.sculpt");
  }

  const { THREE, sculpt } = kit;
  const collection = isRecord(kit.collection) ? kit.collection : { id: "series", items: [] };
  const items = Array.isArray(collection.items) ? collection.items.filter(isRecord) : [];
  const group = new THREE.Group();
  group.name = "分岔时间织机";

  const materials = {
    porcelain: resolveMaterial(kit.stone, 0xd9d1bf, 0.86, 0.02),
    ivory: resolveMaterial(kit.cream, 0xeee7d5, 0.76, 0),
    walnut: resolveMaterial(kit.walnut, 0x4a3023, 0.68, 0),
    brass: resolveMaterial(kit.brass, 0xa98248, 0.28, 0.72),
    ink: resolveMaterial(kit.dark, 0x18231f, 0.54, 0.12),
    green: resolveMaterial(kit.green, 0x63775f, 0.76, 0.03),
    burgundy: kit.material(0x6c3037, 0.7, 0.08),
    copper: kit.material(0x9e623d, 0.35, 0.64),
    pulse: kit.material(0xd9b06b, 0.22, 0.38),
    windowInk: kit.material(0x1b2925, 0.48, 0.16),
  };
  if (materials.pulse.emissive) {
    materials.pulse.emissive.set(0x8b5d24);
    materials.pulse.emissiveIntensity = 0.45;
  }

  const state = {
    timeline: 0,
    selectedIndex: items.length ? 0 : -1,
    branch: 0,
    direction: 1,
    active: true,
    disposed: false,
    pendulumImpulse: 0,
    branchPulse: 0,
    lastStatusAt: 0,
  };
  const visual = {
    timeline: 0,
    pointer: 0,
    pendulum: 0,
    reelAngle: 0,
  };
  const branchGroups = [];
  const loomLevels = [];
  const windowNodes = [];
  const gearNodes = [];
  const spoolNodes = [];
  const beadSets = [];
  let tickPointer;
  let pendulumBob;
  let branchLinkage;
  let timelineCaption;
  let branchReadout;
  let threadAttribute;
  const beadDummy = new THREE.Object3D();
  let activeLease = true;

  buildSplitFoundation();
  buildLoomLevels();
  buildScrollReels();
  buildBranches();
  buildNarrativeWindows();
  buildTimelineDials();
  buildMechanisms();
  buildThreadsAndBeads();
  buildControlText();
  selectTimeline(0, false);
  setBranch(0, false);

  return {
    group,
    focus: new THREE.Vector3(0, 3.25, 0.1),
    update,
    interact,
    getState,
    setActive,
    dispose,
  };

  function buildSplitFoundation() {
    rounded(6.0, 0.14, 3.35, materials.walnut, group, [0, 0.07, 0.08], [0, 0, 0], 0.09);
    rounded(5.56, 0.16, 2.96, materials.porcelain, group, [0, 0.2, 0.02], [0, 0, 0], 0.1);
    rounded(5.06, 0.08, 2.54, materials.green, group, [0, 0.31, -0.02], [0, 0, 0], 0.065);
    rounded(4.3, 0.06, 0.32, materials.copper, group, [0, 0.38, 1.14], [0, 0, 0], 0.03);
  }

  function buildLoomLevels() {
    const levels = [
      { y: 0.74, radius: 2.84, twist: -0.035, width: 0.14 },
      { y: 2.9, radius: 2.84, twist: 0.045, width: 0.14 },
      { y: 5.08, radius: 2.84, twist: -0.035, width: 0.14 },
    ];
    levels.forEach((level, index) => {
      const levelGroup = new THREE.Group();
      levelGroup.position.y = level.y;
      levelGroup.rotation.y = level.twist;
      group.add(levelGroup);
      loomLevels.push({ group: levelGroup, twist: level.twist, index });

      rounded(5.56, level.width, 0.34, materials.walnut, levelGroup, [0, 0.48, 0], [0, 0, 0], 0.035);
      rounded(5.28, 0.045, 0.39, materials.brass, levelGroup, [0, 0.57, 0.025], [0, 0, 0], 0.02);
      rounded(4.92, 0.045, 0.38, materials.porcelain, levelGroup, [0, 0.43, 0.08], [0, 0, 0], 0.025);
      for (const side of [-1, 1]) {
        rounded(0.11, 0.72, 0.15, materials.walnut, levelGroup, [side * 2.74, 0.18, 0.02], [0, 0, side * 0.025], 0.025);
      }
    });
    rounded(5.9, 3.92, 0.15, materials.walnut, group, [0, 3.18, -0.5], [0, 0, 0], 0.035);
    for (const x of [-2.9, 2.9]) {
      rounded(0.12, 5.12, 0.18, materials.walnut, group, [x, 2.9, -0.34], [0, 0, 0], 0.03);
    }
  }

  function buildScrollReels() {
    const spoolProfiles = [
      [[0.08, -0.62], [0.2, -0.58], [0.38, -0.46], [0.43, -0.37], [0.25, -0.25], [0.21, 0.25], [0.43, 0.37], [0.38, 0.46], [0.2, 0.58], [0.08, 0.62]],
      [[0.07, -0.5], [0.18, -0.46], [0.32, -0.36], [0.36, -0.26], [0.2, -0.12], [0.18, 0.12], [0.36, 0.26], [0.32, 0.36], [0.18, 0.46], [0.07, 0.5]],
    ];
    [
      { x: -2.92, y: 4.85, z: -0.58, profile: spoolProfiles[0], direction: 1 },
      { x: 2.92, y: 4.85, z: -0.58, profile: spoolProfiles[1], direction: -1 },
    ].forEach((spec, index) => {
      const reel = new THREE.Group();
      reel.position.set(spec.x, spec.y, spec.z);
      group.add(reel);
      sculpt.lathe(spec.profile, index ? materials.green : materials.porcelain, reel, [0, 0, 0], 64);
      const wound = new THREE.Mesh(
        new THREE.CylinderGeometry(index ? 0.25 : 0.3, index ? 0.25 : 0.3, 0.84, 32, 1, true),
        index ? materials.burgundy : materials.walnut,
      );
      reel.add(wound);

      for (const y of [-0.53, -0.31, 0.31, 0.53]) {
        const rim = sculpt.ring(index ? 0.34 : 0.4, 0.016, materials.brass, reel, [0, y, 0]);
        rim.rotation.x = Math.PI / 2;
      }

      const spokes = [];
      for (let spoke = 0; spoke < 10; spoke += 1) {
        const angle = spoke / 10 * TAU;
        spokeCycle(spokes, angle, index ? 0.26 : 0.31, 0.54, index ? 0.34 : 0.4);
      }
      sculpt.instances(new THREE.BoxGeometry(0.014, 0.22, 0.022), materials.brass, spokes, reel);

      tube([
        [0, 0.58, 0],
        [spec.direction * 0.24, 0.72, 0],
        [spec.direction * 0.45, 0.66, 0.04],
        [spec.direction * 0.58, 0.52, 0.1],
      ], 0.016, materials.brass, reel, 20, 5);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 8), materials.copper);
      knob.position.set(spec.direction * 0.58, 0.52, 0.1);
      reel.add(knob);

      const guard = new THREE.Group();
      guard.position.set(spec.x, spec.y, spec.z);
      group.add(guard);
      for (const y of [-0.65, 0.65]) {
        const collar = sculpt.ring(0.1, 0.018, materials.brass, guard, [0, y, 0]);
        collar.rotation.x = Math.PI / 2;
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.06, 14), materials.copper);
        cap.position.y = y;
        guard.add(cap);
      }
      spoolNodes.push({ reel, direction: spec.direction, baseY: spec.y });
    });

    const bearing = new THREE.Group();
    bearing.position.set(0, 6.58, -0.1);
    group.add(bearing);
    [
      [0.22, 12, materials.brass, -0.26, 0],
      [0.16, 9, materials.copper, 0.08, 0.14],
      [0.13, 8, materials.brass, 0.28, -0.08],
    ].forEach(([radius, teeth, material, x, y], index) => {
      const gear = sculpt.gear(radius, 0.07, teeth, material, bearing, [x, y, 0]);
      const guard = sculpt.ring(radius * 0.31, 0.012, materials.brass, bearing, [x, y, 0.05]);
      guard.rotation.z = index * 0.17;
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 12), materials.ink);
      axle.rotation.x = Math.PI / 2;
      axle.position.set(x, y, 0.05);
      bearing.add(axle);
      gearNodes.push({ gear, direction: index % 2 ? -1 : 1, speed: 0.18 + index * 0.08 });
    });
    tube([
      [-0.54, 0, 0],
      [-0.38, 0.03, 0],
      [-0.22, 0, 0],
      [0.34, 0.02, 0],
      [0.52, 0, 0],
    ], 0.012, materials.brass, bearing, 26, 5);
  }

  function buildBranches() {
    for (let branch = 0; branch < 2; branch += 1) {
      const branchGroup = new THREE.Group();
      branchGroup.rotation.y = branch ? 0.045 : -0.035;
      group.add(branchGroup);
      const branchMaterial = materialVariant(BRANCH_COLORS[branch], branch ? 0.38 : 0.3, 0.52);
      const direction = branch ? 1 : -1;
      tube([
        [-2.58, 0.62, 0.82],
        [-2.72 + direction * 0.04, 2.3, 0.8],
        [-2.52 + direction * 0.08, 4.02, 0.76],
        [-2.16 + direction * 0.11, 6.12, 0.7],
      ], 0.022, branchMaterial, branchGroup, 42, 6);
      tube([
        [2.58, 0.62, 0.82],
        [2.72 - direction * 0.04, 2.3, 0.8],
        [2.52 - direction * 0.08, 4.02, 0.76],
        [2.16 - direction * 0.11, 6.12, 0.7],
      ], 0.022, branchMaterial, branchGroup, 42, 6);
      for (const y of [0.64, 2.92, 5.12]) {
        rounded(0.18, 0.08, 0.12, branchMaterial, branchGroup, [-2.72, y, 0.84], [0, 0, 0], 0.025);
        rounded(0.18, 0.08, 0.12, branchMaterial, branchGroup, [2.72, y, 0.84], [0, 0, 0], 0.025);
      }
      branchGroup.visible = branch === 0;
      branchGroups.push({ group: branchGroup, material: branchMaterial });
    }
  }

  function buildNarrativeWindows() {
    const placements = [
      { position: [0, 5.24, 1.72], frame: [1.5, 2.02], image: [1.36, 1.82], labelY: -0.93 },
      { position: [-1.82, 4.98, 1.62], frame: [1.25, 1.78], image: [1.13, 1.58], labelY: -0.8 },
      { position: [1.82, 4.98, 1.62], frame: [1.25, 1.78], image: [1.13, 1.58], labelY: -0.8 },
      { position: [-1.86, 2.8, 1.78], frame: [1.25, 1.76], image: [1.13, 1.56], labelY: -0.79 },
      { position: [1.86, 2.8, 1.78], frame: [1.25, 1.76], image: [1.13, 1.56], labelY: -0.79 },
      { position: [0, 0.92, 1.94], frame: [1.36, 1.88], image: [1.23, 1.67], labelY: -0.85 },
    ];
    placements.forEach((placement, slot) => {
      const [x, y, z] = placement.position;
      const [frameWidth, frameHeight] = placement.frame;
      const [imageWidth, imageHeight] = placement.image;
      const holder = new THREE.Group();
      holder.position.set(x, y, z);
      holder.rotation.y = Math.atan2(x, z) * 0.18;
      group.add(holder);

      rounded(frameWidth, frameHeight, 0.1, kit.walnut, holder, [0, 0, 0], [0, 0, 0], 0.035);
      rounded(frameWidth - 0.07, frameHeight - 0.07, 0.024, materials.brass, holder, [0, 0.01, 0.062], [0, 0, 0], 0.025);
      rounded(frameWidth - 0.12, frameHeight - 0.12, 0.02, materials.windowInk, holder, [0, 0.02, 0.078], [0, 0, 0], 0.018);
      const itemIndex = modulo(WINDOW_OFFSETS[slot], items.length);
      const item = items[itemIndex];
      const image = item ? makeImage(item, imageWidth, imageHeight, holder, [0, 0.05, 0.094]) : null;
      const proxy = hitProxy(frameWidth + 0.05, frameHeight + 0.08, 0.18, holder, [0, 0, 0.12]);
      const label = makeText("", frameWidth - 0.12, 0.15, holder, [0, placement.labelY, 0.11], {
        background: null,
        color: "#e8dbc2",
        fontSize: slot === 0 ? 19 : 17,
        align: "center",
        serif: true,
      });
      const node = {
        holder,
        image,
        proxy,
        label,
        base: new THREE.Vector3(x, y, z),
        baseRotation: holder.rotation.y,
        slot,
        itemIndex,
        phase: slot * 0.72,
        labelY: placement.labelY,
        labelWidth: frameWidth - 0.12,
        labelSize: slot === 0 ? 19 : 17,
      };
      windowNodes.push(node);
      kit.register(proxy, {
        id: `story-window-${slot + 1}`,
        label: "已呈现的叙事窗",
        hint: "点击当前海报查看真实剧集资料",
        onClick() {
          const selectedItem = items[node.itemIndex];
          if (!selectedItem) return;
          selectTimeline(node.itemIndex, false);
          openItem(node.itemIndex);
        },
        onKey(key) {
          if (key === "Enter" || key === " ") {
            const selectedItem = items[node.itemIndex];
            if (selectedItem) {
              selectTimeline(node.itemIndex, false);
              openItem(node.itemIndex);
            }
          }
        },
      });
    });
  }

  function buildTimelineDials() {
    rounded(1.38, 0.18, 0.92, materials.walnut, group, [-2.76, 0.48, 2.26], [0, 0.06, 0], 0.065);
    rounded(1.16, 0.05, 0.7, materials.brass, group, [-2.76, 0.61, 2.26], [0, 0.06, 0], 0.038);
    for (const x of [-3.2, -2.32]) {
      rounded(0.08, 0.44, 0.08, materials.walnut, group, [x, 0.24, 2.26], [0, 0, 0], 0.025);
    }
    const dial = new THREE.Group();
    dial.position.set(-2.76, 1.08, 2.36);
    dial.rotation.x = -0.08;
    group.add(dial);
    const dialBack = new THREE.Mesh(
      new THREE.CircleGeometry(0.56, 48),
      new THREE.MeshBasicMaterial({ color: 0x16221f, transparent: true, opacity: 0.86, side: THREE.DoubleSide }),
    );
    dialBack.position.z = -0.04;
    dial.add(dialBack);
    sculpt.ring(0.56, 0.028, materials.brass, dial, [0, 0, 0]);
    sculpt.ring(0.41, 0.012, materials.copper, dial, [0, 0, 0.02]);

    const tickCount = Math.max(36, items.length);
    const ticks = [];
    for (let index = 0; index < tickCount; index += 1) {
      const angle = index / tickCount * TAU;
      const major = index % 6 === 0;
      ticks.push({
        position: [Math.cos(angle) * 0.47, Math.sin(angle) * 0.47, 0.045],
        rotation: [0, 0, angle - Math.PI / 2],
        scale: [major ? 1.35 : 0.7, major ? 1.04 : 0.62, 1],
      });
    }
    sculpt.instances(new THREE.BoxGeometry(0.011, 0.085, 0.018), materials.brass, ticks, dial);
    tickPointer = new THREE.Group();
    tickPointer.position.z = 0.08;
    dial.add(tickPointer);
    rounded(0.022, 0.39, 0.03, materials.pulse, tickPointer, [0, 0.195, 0], [0, 0, 0], 0.008);
    const pointerTip = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.12, 12), materials.pulse);
    pointerTip.position.y = 0.44;
    tickPointer.add(pointerTip);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.08, 18), materials.brass);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = 0.12;
    dial.add(hub);
    const dialProxy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.1, 22),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
    );
    dialProxy.rotation.x = Math.PI / 2;
    dialProxy.position.z = 0.22;
    dial.add(dialProxy);
    kit.register(dialProxy, {
      id: "timeline-scroll",
      label: "时间卷轴",
      hint: "左右拖动独立时间盘，浏览真实剧集目录",
      onDown() {
        visual.timeline = state.timeline;
      },
      onDrag({ dx }) {
        scrubTimeline(visual.timeline + dx * 0.024);
      },
      onUp() {
        snapTimeline();
      },
      onClick() {
        selectTimeline(state.timeline + 1, true);
      },
      onKey(key) {
        if (key === "ArrowLeft") selectTimeline(state.timeline - 1, true);
        if (key === "ArrowRight") selectTimeline(state.timeline + 1, true);
      },
    });
  }

  function buildMechanisms() {
    const timelineHandle = new THREE.Group();
    timelineHandle.position.set(0, 6.02, -0.16);
    group.add(timelineHandle);
    rounded(0.86, 0.12, 0.2, materials.brass, timelineHandle, [0, 0, 0], [0, 0, 0], 0.045);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.42, 18), materials.walnut);
    grip.rotation.z = Math.PI / 2;
    timelineHandle.add(grip);
    for (const x of [-0.47, 0.47]) {
      sculpt.ring(0.09, 0.016, materials.copper, timelineHandle, [x, 0, 0.06]);
      rounded(0.12, 0.24, 0.16, materials.walnut, timelineHandle, [x, -0.12, 0], [0, 0, 0], 0.025);
    }

    const forkRoot = new THREE.Group();
    forkRoot.position.set(2.74, 0.68, 2.24);
    group.add(forkRoot);
    rounded(0.76, 0.14, 0.42, materials.walnut, forkRoot, [0, -0.22, -0.04], [0, 0, 0], 0.045);
    for (const x of [-0.34, 0.34]) {
      const stop = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.062, 0.13, 12), materials.brass);
      stop.position.set(x, -0.19, 0.15);
      forkRoot.add(stop);
    }
    tube([
      [0, -0.22, 0],
      [0, 0.18, 0],
      [-0.34, 0.48, 0.12],
      [-0.76, 0.58, 0.28],
    ], 0.055, materials.brass, forkRoot, 20, 7);
    tube([
      [0, 0.18, 0],
      [0.28, 0.44, 0.12],
      [0.72, 0.56, 0.3],
    ], 0.055, materials.brass, forkRoot, 20, 7);
    [-1, 1].forEach((side, branch) => {
      const gripProxy = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 18, 12),
        new THREE.MeshBasicMaterial({ color: BRANCH_COLORS[branch], transparent: true, opacity: 0.92 }),
      );
      gripProxy.position.set(side * 0.76, 0.58, 0.29);
      forkRoot.add(gripProxy);
      kit.register(gripProxy, {
        id: `branch-fork-${branch + 1}`,
        label: branch ? "右侧分岔" : "左侧分岔",
        hint: "按下，将纱线与悬挑桥接到另一条时间路径",
        onClick() {
          setBranch(branch, true);
        },
        onKey(key) {
          if (key === "Enter" || key === " ") setBranch(branch, true);
        },
      });
    });

    const pendulum = new THREE.Group();
    pendulum.position.set(3.34, 3.72, 1.84);
    group.add(pendulum);
    rounded(0.18, 0.3, 0.18, materials.ink, pendulum, [0, 0.12, 0], [0, 0, 0], 0.035);
    const pendulumBearing = sculpt.ring(0.15, 0.025, materials.brass, pendulum, [0, 0.12, 0.11]);
    pendulumBearing.rotation.x = Math.PI / 2;
    tube([
      [0, -0.02, 0],
      [0, -0.54, 0],
      [0.13, -0.84, 0.08],
    ], 0.02, materials.brass, pendulum, 18, 5);
    pendulumBob = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 12), materials.pulse);
    pendulumBob.position.set(0.13, -0.87, 0.08);
    pendulum.add(pendulumBob);
    kit.register(pendulumBob, {
      id: "counterflow-pendulum",
      label: "逆流摆锤",
      hint: "左右拖动改变珠链方向；轻点可反转",
      onDown() {
        state.pendulumImpulse = 0;
      },
      onDrag({ totalX }) {
        const nextDirection = totalX < 0 ? -1 : 1;
        if (nextDirection !== state.direction) {
          state.direction = nextDirection;
          notifyDirection();
        }
        state.pendulumImpulse = Math.min(0.9, Math.abs(totalX) / 120);
      },
      onClick() {
        reverseDirection();
      },
      onKey(key) {
        if (key === "Enter" || key === " " || key === "ArrowLeft" || key === "ArrowRight") reverseDirection();
      },
    });

    branchLinkage = new THREE.Group();
    branchLinkage.position.set(-2.38, 1.66, -0.02);
    group.add(branchLinkage);
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 16), materials.ink);
    hinge.rotation.x = Math.PI / 2;
    branchLinkage.add(hinge);
    sculpt.ring(0.13, 0.018, materials.brass, branchLinkage, [0, 0, 0.12]);
    rounded(0.82, 0.08, 0.09, materials.brass, branchLinkage, [0.44, 0, 0], [0, 0, -0.16], 0.024);
    tube([
      [0.82, -0.06, 0],
      [1.14, 0.2, 0.09],
      [1.4, 0.38, 0.18],
    ], 0.022, materials.copper, branchLinkage, 20, 5);
  }

  function buildThreadsAndBeads() {
    const threadGeometry = new THREE.BufferGeometry();
    threadAttribute = new THREE.Float32BufferAttribute(new Float32Array(6 * 4 * 3), 3);
    threadAttribute.setUsage(THREE.DynamicDrawUsage);
    threadGeometry.setAttribute("position", threadAttribute);
    const threadLines = new THREE.LineSegments(
      threadGeometry,
      new THREE.LineBasicMaterial({ color: 0xb88b51, transparent: true, opacity: 0.42 }),
    );
    group.add(threadLines);

    const beadGeometry = new THREE.SphereGeometry(0.045, 10, 8);
    for (let chain = 0; chain < 2; chain += 1) {
      const mesh = sculpt.instances(
        beadGeometry,
        chain === 1 ? materials.green : materials.copper,
        Array.from({ length: 10 }, (_, index) => ({
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: 0.75 + index * 0.018,
        })),
        group,
      );
      beadSets.push({
        mesh,
        phase: chain * 0.29,
        speed: 0.055 + chain * 0.012,
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-3.0, 4.3, 0),
          new THREE.Vector3(-1.2, 3.4, 0.5),
          new THREE.Vector3(0, 3, 0.8),
          new THREE.Vector3(1.2, 3.6, 0.5),
          new THREE.Vector3(3, 4.1, 0),
        ], false, "centripetal", 0.42),
      });
    }
    updateThreadGeometry();
  }

  function buildControlText() {
    const title = makeText("分岔时间织机", 2.55, 0.36, group, [0, 7.16, 0.12], {
      background: null,
      color: "#e8dcc4",
      fontSize: 42,
      align: "center",
      serif: true,
    });
    if (title) title.rotation.x = -0.06;

    timelineCaption = makeText("", 2.5, 0.36, group, [0, 0.28, 3.38], {
      background: null,
      color: "#e9d9bc",
      fontSize: 20,
      align: "center",
      serif: false,
    });
    branchReadout = makeText("", 1.8, 0.24, group, [0, 6.62, 0.42], {
      background: null,
      color: "#c8b58f",
      fontSize: 17,
      align: "center",
      serif: false,
    });
    updateCaption();
  }

  function scrubTimeline(value) {
    visual.timeline = wrapFloat(value, Math.max(1, items.length));
    const nextIndex = modulo(Math.round(visual.timeline), Math.max(1, items.length));
    if (nextIndex !== state.selectedIndex) selectTimeline(nextIndex, false);
    state.timeline = visual.timeline;
    notifyThrottled();
  }

  function snapTimeline() {
    const index = modulo(Math.round(visual.timeline), Math.max(1, items.length));
    visual.timeline = index;
    state.timeline = index;
    selectTimeline(index, true);
  }

  function selectTimeline(value, announce) {
    if (!items.length) {
      state.timeline = 0;
      state.selectedIndex = -1;
      updateCaption();
      return -1;
    }
    const index = typeof value === "string"
      ? Math.max(0, items.findIndex((item) => String(item.id) === value))
      : modulo(Math.round(Number(value) || 0), items.length);
    state.selectedIndex = index;
    state.timeline = modulo(Number(value) || 0, items.length);
    visual.timeline = state.timeline;
    updateWindowItems();
    updateCaption();
    syncDirectoryPose();
    if (announce) {
      const item = items[index];
      kit.status?.(`时间轴 ${String(index + 1).padStart(2, "0")} / ${items.length} · ${itemTitle(item)} · ${seriesYears(item)}`);
    }
    kit.invalidate?.();
    return index;
  }

  function updateWindowItems() {
    if (!items.length) return;
    windowNodes.forEach((node) => {
      const itemIndex = modulo(state.selectedIndex + WINDOW_OFFSETS[node.slot], items.length);
      node.itemIndex = itemIndex;
      const item = items[itemIndex];
      setImageSource(node.image, item);
      node.label = replaceText(node.label, `${seriesYears(item)} · ${clip(itemTitle(item), 12)}`, node.labelWidth, 0.15, node.holder, [0, node.labelY, 0.11], {
        background: null,
        color: "#e8dbc2",
        fontSize: node.labelSize,
        align: "center",
        serif: true,
      });
    });
    updateThreadGeometry();
  }

  function updateCaption() {
    const item = items[state.selectedIndex];
    const number = items.length ? `${String(state.selectedIndex + 1).padStart(2, "0")} / ${items.length}` : "NO RECORDS";
    const text = item
      ? `${number}   ${clip(itemTitle(item), 18)}   ${seriesYears(item)}`
      : "等待真实剧集目录";
    timelineCaption = replaceText(timelineCaption, text, 2.5, 0.36, group, [0, 0.28, 3.38], {
      background: null,
      color: "#e9d9bc",
      fontSize: 20,
      align: "center",
      serif: false,
    });
    branchReadout = replaceText(
      branchReadout,
      `BRANCH ${state.branch + 1} · ${state.direction > 0 ? "顺流" : "逆流"}`,
      1.8,
      0.26,
      group,
      [0, 6.62, 0.42],
      {
        background: null,
        color: "#c8b58f",
        fontSize: 17,
        align: "center",
        serif: false,
      },
    );
  }

  function setBranch(value, announce) {
    state.branch = modulo(Math.round(Number(value) || 0), 2);
    state.branchPulse = 1;
    branchGroups.forEach((branch, index) => {
      branch.group.visible = index === state.branch;
      branch.material.opacity = index === state.branch ? 1 : 0.16;
      branch.material.transparent = index !== state.branch;
    });
    updateCaption();
    updateThreadGeometry();
    syncDirectoryPose();
    if (announce) {
      kit.status?.(`分岔 ${state.branch + 1} 已接入 · 三层桥面与叙事窗重新配线`);
      kit.invalidate?.();
    }
  }

  function reverseDirection() {
    state.direction *= -1;
    state.pendulumImpulse = 0.65;
    if (pendulumBob?.parent) pendulumBob.parent.rotation.z = state.direction * 0.28;
    notifyDirection();
    kit.invalidate?.();
  }

  function notifyDirection() {
    kit.status?.(`逆流摆锤：${state.direction > 0 ? "时间珠链顺流" : "时间珠链逆流"}`);
  }

  function updateThreadGeometry() {
    if (!threadAttribute) return;
    const branch = state.branch;
    for (let index = 0; index < 6; index += 1) {
      const column = index;
      const row = Math.floor(index / 2);
      const startAngle = index / 6 * TAU;
      const start = [
        -2.92 + Math.cos(startAngle) * (0.3 + row * 0.04),
        3.08 + (row - 1) * 1.9,
        -0.52 + Math.sin(startAngle) * 0.14,
      ];
      const endNode = windowNodes[column];
      const end = endNode
        ? [endNode.base.x, endNode.base.y + 0.1, endNode.base.z + 0.1]
        : [0, 3.2, 1.5];
      const mid = [
        (start[0] + end[0]) * 0.48,
        1.55 + row * 1.95 + Math.sin(column / 5 * Math.PI) * 0.22,
        (branch ? -0.04 : 0.18) + Math.sin(index * 1.7) * 0.1,
      ];
      const vertex = index * 4;
      threadAttribute.setXYZ(vertex, ...start);
      threadAttribute.setXYZ(vertex + 1, ...mid);
      threadAttribute.setXYZ(vertex + 2, ...mid);
      threadAttribute.setXYZ(vertex + 3, ...end);
    }
    threadAttribute.needsUpdate = true;
  }

  function syncDirectoryPose() {
    const progress = items.length ? state.timeline / items.length : 0;
    if (tickPointer) tickPointer.rotation.z = -progress * TAU;
    loomLevels.forEach((level) => {
      level.group.rotation.y = level.twist
        + progress * TAU * (level.index % 2 ? -0.075 : 0.095) * state.direction
        + state.branch * (level.index % 2 ? -0.07 : 0.04);
    });
    spoolNodes.forEach((node, index) => {
      node.reel.rotation.y = (progress + index * 0.14) * TAU * node.direction * state.direction;
    });
    gearNodes.forEach((node, index) => {
      node.gear.rotation.z = progress * TAU * node.direction * state.direction * (index + 1);
    });
    if (branchLinkage) branchLinkage.rotation.y = state.branch ? -0.42 : 0.28;
  }

  function update(time, dt, active) {
    if (state.disposed || !state.active || !active) return;
    const step = clamp(Number(dt) || 0, 0, 0.05);
    const now = Number(time) || 0;
    const reduced = Boolean(kit.reducedMotion?.());
    const motion = reduced ? 0 : 1;
    const timelineTarget = items.length ? state.timeline / items.length * TAU : 0;
    visual.pointer = dampAngle(visual.pointer, -timelineTarget, 8, step);
    if (tickPointer) tickPointer.rotation.z = visual.pointer;

    visual.reelAngle += step * state.direction * (0.23 + state.branch * 0.03) * motion;
    const timelineTurn = items.length ? state.timeline / items.length * TAU : 0;
    loomLevels.forEach((level) => {
      level.group.rotation.y = level.twist
        + timelineTurn * (level.index % 2 ? -0.075 : 0.095) * state.direction
        + state.branch * (level.index % 2 ? -0.07 : 0.04);
    });
    spoolNodes.forEach((node) => {
      node.reel.rotation.y = visual.reelAngle * node.direction;
    });
    gearNodes.forEach((node) => {
      node.gear.rotation.z += step * node.speed * node.direction * state.direction * motion;
    });

    state.branchPulse = Math.max(0, state.branchPulse - step * 1.8);
    state.pendulumImpulse = Math.max(0, state.pendulumImpulse - step * 0.9);
    visual.pendulum = dampAngle(
      visual.pendulum,
      Math.sin(now * (1.4 + state.pendulumImpulse * 2.2)) * (0.24 + state.pendulumImpulse * 0.42) * state.direction * motion,
      5.5,
      step,
    );
    const pendulumRoot = pendulumBob?.parent;
    if (pendulumRoot) pendulumRoot.rotation.z = visual.pendulum;

    windowNodes.forEach((node) => {
      const branchShift = state.branch * (node.slot % 2 ? 0.18 : -0.16);
      node.holder.position.y = node.base.y + Math.sin(now * 0.55 + node.phase) * 0.018 * motion;
      node.holder.position.x = node.base.x + branchShift;
      node.holder.rotation.y = node.baseRotation + Math.sin(now * 0.36 + node.phase) * 0.035 * motion;
      node.holder.rotation.z = Math.sin(now * 0.44 + node.slot) * 0.007 * motion;
    });

    branchGroups.forEach((branch, index) => {
      branch.group.position.y = Math.sin(now * 0.26 + index) * 0.012 * motion;
      branch.group.rotation.y = (index ? 0.045 : -0.035) + (index === state.branch ? Math.sin(now * 0.44) * 0.008 * motion : 0);
    });
    if (branchLinkage) {
      branchLinkage.rotation.y = dampAngle(branchLinkage.rotation.y, state.branch ? -0.42 : 0.28, 6, step);
      branchLinkage.rotation.z = Math.sin(now * 0.45) * 0.018 * motion;
    }

    const beads = beadSets;
    beads.forEach((chain, chainIndex) => {
      chain.curve.points[1].set(-1.2, 2.8 + chainIndex * 0.22, state.branch ? 0.2 : 0.7);
      chain.curve.points[2].set(0, 3.0 + chainIndex * 0.16, state.branch ? 0.34 : 0.86);
      chain.curve.points[3].set(1.2, 3.45 + chainIndex * 0.2, state.branch ? 0.1 : 0.58);
      const count = chain.mesh.count;
      for (let index = 0; index < count; index += 1) {
        const base = index / Math.max(1, count - 1);
        const t = wrapFraction(base + chain.phase + now * chain.speed * state.direction);
        const position = chain.curve.getPoint(t);
        beadDummy.position.set(position.x, position.y + chainIndex * 0.11, position.z);
        beadDummy.scale.setScalar(0.8 + Math.sin(index * 0.9) * 0.12);
        beadDummy.rotation.set(now * 0.18 * state.direction, 0, now * 0.12);
        beadDummy.updateMatrix();
        chain.mesh.setMatrixAt(index, beadDummy.matrix);
      }
      chain.mesh.instanceMatrix.needsUpdate = true;
    });

    materials.pulse.emissiveIntensity = 0.38 + state.branchPulse * 0.8;
    kit.invalidate?.();
  }

  function interact(action, index) {
    if (action === "select") return selectTimeline(index, true);
    if (action === "branch") {
      setBranch(index, true);
      return state.branch;
    }
    if (action === "reverse") {
      reverseDirection();
      return state.direction;
    }
    if (action === "reset") {
      visual.timeline = 0;
      visual.reelAngle = 0;
      state.pendulumImpulse = 0;
      state.branchPulse = 0;
      selectTimeline(0, false);
      setBranch(0, false);
      state.direction = 1;
      updateCaption();
      kit.status?.("时间织机已复位 · 回到目录起点与顺流方向");
      kit.invalidate?.();
      return getState();
    }
    return null;
  }

  function getState() {
    const item = items[state.selectedIndex];
    return {
      timeline: state.selectedIndex,
      timelineProgress: Number(state.timeline.toFixed(3)),
      branch: state.branch,
      direction: state.direction,
      selected: item?.id ?? null,
      selectedIndex: state.selectedIndex,
      title: itemTitle(item),
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
      kit.onSelect(collection.id || "series", index);
    }
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

  function setImageSource(image, item) {
    if (!image || !item) return;
    const url = itemImage(item);
    const texture = url && typeof kit.texture === "function" ? kit.texture(url) : null;
    if (!texture?.isTexture || !image.material) return;
    const materialList = Array.isArray(image.material) ? image.material : [image.material];
    materialList.forEach((material) => {
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
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
      }),
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
    object.userData.textOptions = options;
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

  function stairPlacements({ start, end, count, curve }) {
    const placements = [];
    for (let index = 0; index < count; index += 1) {
      const t = index / Math.max(1, count - 1);
      const x = lerp(start[0], end[0], t) + Math.sin(t * Math.PI) * curve;
      const y = lerp(start[1], end[1], t);
      const z = lerp(start[2], end[2], t) + Math.cos(t * Math.PI) * 0.2;
      const nextX = lerp(start[0], end[0], Math.min(1, t + 0.03)) + Math.sin(Math.min(1, t + 0.03) * Math.PI) * curve;
      const nextZ = lerp(start[2], end[2], Math.min(1, t + 0.03));
      placements.push({
        position: [x, y, z],
        rotation: [0, Math.atan2(nextX - x, nextZ - z), 0.035],
        scale: [1, 1, 1],
      });
    }
    return placements;
  }

  function spokeCycle(output, angle, radius, halfHeight, outerRadius) {
    output.push({
      position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
      rotation: [0, -angle, 0],
      scale: [1, halfHeight / 0.44, (outerRadius - radius) / 0.035],
    });
  }

  function materialVariant(color, roughness, metalness) {
    return kit.material(color, roughness, metalness);
  }

  function notifyThrottled() {
    const now = Date.now();
    if (now - state.lastStatusAt < 110) return;
    state.lastStatusAt = now;
    const item = items[state.selectedIndex];
    kit.status?.(`时间轴 ${String(state.selectedIndex + 1).padStart(2, "0")} / ${items.length} · ${itemTitle(item)} · ${seriesYears(item)}`);
  }
}

function resolveMaterial(value, fallbackColor, roughness, metalness) {
  return value?.isMaterial ? value : value || { isMaterial: true, color: fallbackColor, roughness, metalness };
}

function itemImage(item) {
  return textValue(item?.image || item?.poster || item?.thumb || item?.thumbnail || item?.original?.poster);
}

function itemTitle(item) {
  return textValue(item?.title || item?.name || item?.original?.title) || "未命名剧集";
}

function seriesYears(item) {
  return textValue(item?.years || item?.year || item?.original?.years || item?.original?.year) || "年份未记";
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

function wrapFraction(value) {
  return ((Number(value) || 0) % 1 + 1) % 1;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
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
