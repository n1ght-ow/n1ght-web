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
    focus: new THREE.Vector3(0, 2.7, 0),
    update,
    interact,
    getState,
    setActive,
    dispose,
  };

  function buildSplitFoundation() {
    const feet = [
      { size: [2.7, 0.44, 2.15], position: [-1.42, 0.22, 0.72], rotation: [0, -0.12, 0], material: materials.porcelain },
      { size: [2.55, 0.34, 2.5], position: [1.42, 0.17, -0.82], rotation: [0, 0.19, 0], material: materials.ivory },
      { size: [1.9, 0.28, 1.6], position: [0.36, 0.14, 1.36], rotation: [0, 0.34, 0], material: materials.walnut },
    ];
    feet.forEach((entry) => {
      rounded(entry.size[0], entry.size[1], entry.size[2], entry.material, group, entry.position, entry.rotation, 0.1);
    });

    const footRibs = [];
    for (let index = 0; index < 18; index += 1) {
      const angle = index / 18 * TAU;
      footRibs.push({
        position: [Math.cos(angle) * 2.25, 0.24 + (index % 3) * 0.07, Math.sin(angle) * 1.72],
        rotation: [0.2, -angle, Math.sin(angle) * 0.15],
        scale: [1, 0.72 + (index % 4) * 0.16, 1],
      });
    }
    const ribGeometry = new THREE.BoxGeometry(0.045, 0.5, 0.045);
    sculpt.instances(ribGeometry, materials.brass, footRibs, group);

    for (let index = 0; index < 4; index += 1) {
      const angle = index / 4 * TAU + 0.25;
      const x = Math.cos(angle) * 2.64;
      const z = Math.sin(angle) * 2.06;
      tube([
        [x, 0.36, z],
        [x * 0.82, 1.4, z * 0.82],
        [x * 0.62, 2.15, z * 0.62],
      ], 0.035, materials.brass, group, 24, 6);
    }
  }

  function buildLoomLevels() {
    const levels = [
      { y: 1.28, radius: 2.35, twist: -0.14, width: 0.3 },
      { y: 3.46, radius: 2.05, twist: 0.2, width: 0.26 },
      { y: 5.52, radius: 1.65, twist: -0.32, width: 0.22 },
    ];
    levels.forEach((level, index) => {
      const levelGroup = new THREE.Group();
      levelGroup.position.y = level.y;
      levelGroup.rotation.y = level.twist;
      group.add(levelGroup);
      loomLevels.push({ group: levelGroup, twist: level.twist, index });

      for (const side of [-1, 1]) {
        rounded(
          level.width,
          0.94,
          0.34,
          index === 2 ? materials.green : materials.walnut,
          levelGroup,
          [side * level.radius, 0.36, 0],
          [0, 0, side * 0.12],
          0.045,
        );
        rounded(1.22, 0.18, 0.58, materials.porcelain, levelGroup, [side * level.radius, 0.9, 0], [0, 0, side * 0.06], 0.06);
      }

      const beamHeight = index === 1 ? 0.72 : 0.56;
      tube([
        [-level.radius, 0.32, 0],
        [-level.radius * 0.62, beamHeight, 0],
        [0, beamHeight + 0.22, 0],
        [level.radius * 0.62, beamHeight, 0],
        [level.radius, 0.32, 0],
      ], index === 2 ? 0.055 : 0.045, materials.brass, levelGroup, 42, 7);

      const braces = [];
      for (let brace = 0; brace < 10; brace += 1) {
        const spread = -1 + brace / 4.5;
        braces.push({
          position: [spread * level.radius, 0.62 + Math.cos(spread * Math.PI / 2) * 0.22, -0.12],
          rotation: [0, 0, spread * 0.55],
          scale: [0.65 + (brace % 3) * 0.12, 1, 1],
        });
      }
      sculpt.instances(new THREE.BoxGeometry(0.035, 0.38, 0.045), materials.copper, braces, levelGroup);
    });

    const stairPlacementsA = stairPlacements({
      start: [-3.05, 0.58, 1.18],
      end: [0.55, 2.8, 0.34],
      count: 18,
      curve: -0.48,
    });
    const stairPlacementsB = stairPlacements({
      start: [-0.75, 2.72, -0.44],
      end: [3.16, 5.48, 0.18],
      count: 22,
      curve: 0.62,
    });
    sculpt.instances(new THREE.BoxGeometry(0.64, 0.09, 0.3), materials.walnut, stairPlacementsA, group);
    sculpt.instances(new THREE.BoxGeometry(0.56, 0.08, 0.27), materials.walnut, stairPlacementsB, group);

    tube(stairPlacementsA.map((entry) => new THREE.Vector3(
      entry.position[0],
      entry.position[1] + 0.28,
      entry.position[2] + 0.21,
    )), 0.018, materials.brass, group, 48, 5);
    tube(stairPlacementsB.map((entry) => new THREE.Vector3(
      entry.position[0],
      entry.position[1] + 0.26,
      entry.position[2] - 0.2,
    )), 0.018, materials.brass, group, 54, 5);
  }

  function buildScrollReels() {
    const spoolProfiles = [
      [[0.22, -1.42], [0.52, -1.34], [0.96, -1.13], [1.08, -0.94], [0.64, -0.7], [0.55, 0.7], [1.08, 0.94], [0.96, 1.13], [0.52, 1.34], [0.22, 1.42]],
      [[0.18, -1.12], [0.45, -1.04], [0.78, -0.86], [0.88, -0.68], [0.51, -0.48], [0.45, 0.48], [0.88, 0.68], [0.78, 0.86], [0.45, 1.04], [0.18, 1.12]],
    ];
    [
      { x: -3.03, y: 5.34, z: -1.48, profile: spoolProfiles[0], direction: 1 },
      { x: 3.03, y: 5.05, z: -1.62, profile: spoolProfiles[1], direction: -1 },
    ].forEach((spec, index) => {
      const reel = new THREE.Group();
      reel.position.set(spec.x, spec.y, spec.z);
      group.add(reel);
      sculpt.lathe(spec.profile, index ? materials.green : materials.porcelain, reel, [0, 0, 0], 64);
      const wound = new THREE.Mesh(
        new THREE.CylinderGeometry(index ? 0.57 : 0.68, index ? 0.57 : 0.68, 2.0, 48, 1, true),
        index ? materials.burgundy : materials.walnut,
      );
      reel.add(wound);

      for (const y of [-1.2, -0.82, 0.82, 1.2]) {
        const rim = sculpt.ring(index ? 0.8 : 0.98, 0.032, materials.brass, reel, [0, y, 0]);
        rim.rotation.x = Math.PI / 2;
      }

      const spokes = [];
      for (let spoke = 0; spoke < 18; spoke += 1) {
        const angle = spoke / 18 * TAU;
        spokeCycle(spokes, angle, index ? 0.65 : 0.82, 1.28, index ? 0.8 : 0.98);
      }
      sculpt.instances(new THREE.BoxGeometry(0.025, 0.44, 0.035), materials.brass, spokes, reel);

      tube([
        [0, 1.35, 0],
        [spec.direction * 0.45, 1.62, 0],
        [spec.direction * 0.9, 1.48, 0.05],
        [spec.direction * 1.15, 1.25, 0.18],
      ], 0.025, materials.brass, reel, 26, 6);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10), materials.copper);
      knob.position.set(spec.direction * 1.17, 1.24, 0.18);
      reel.add(knob);

      const guard = new THREE.Group();
      guard.position.set(spec.x, spec.y, spec.z);
      group.add(guard);
      for (const y of [-1.5, 1.5]) {
        const collar = sculpt.ring(0.31, 0.045, materials.brass, guard, [0, y, 0]);
        collar.rotation.x = Math.PI / 2;
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.14, 24), materials.copper);
        cap.position.y = y;
        guard.add(cap);
      }
      spoolNodes.push({ reel, direction: spec.direction, baseY: spec.y });
    });

    const bearing = new THREE.Group();
    bearing.position.set(0, 6.55, -0.44);
    group.add(bearing);
    [
      [0.56, 18, materials.brass, -0.62, 0],
      [0.42, 14, materials.copper, 0.22, 0.38],
      [0.34, 12, materials.brass, 0.72, -0.2],
    ].forEach(([radius, teeth, material, x, y], index) => {
      const gear = sculpt.gear(radius, 0.12, teeth, material, bearing, [x, y, 0]);
      const guard = sculpt.ring(radius * 0.31, 0.022, materials.brass, bearing, [x, y, 0.085]);
      guard.rotation.z = index * 0.17;
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 16), materials.ink);
      axle.rotation.x = Math.PI / 2;
      axle.position.set(x, y, 0.08);
      bearing.add(axle);
      gearNodes.push({ gear, direction: index % 2 ? -1 : 1, speed: 0.18 + index * 0.08 });
    });
    tube([
      [-1.25, 0, 0],
      [-0.92, 0.08, 0],
      [-0.6, 0, 0],
      [0.78, 0.05, 0],
      [1.2, 0, 0],
    ], 0.025, materials.brass, bearing, 34, 5);
  }

  function buildBranches() {
    for (let branch = 0; branch < 2; branch += 1) {
      const branchGroup = new THREE.Group();
      branchGroup.rotation.y = branch ? 0.23 : -0.13;
      group.add(branchGroup);
      const branchMaterial = materialVariant(BRANCH_COLORS[branch], branch ? 0.38 : 0.3, 0.52);
      const tierHeights = [1.34, 3.12, 4.9];
      tierHeights.forEach((baseY, tier) => {
        const branchBend = branch ? 0.5 : -0.38;
        const baseZ = 0.42 + tier * 0.11;
        const bridge = sculpt.surface((u, v) => {
          const side = v - 0.5;
          const bend = Math.sin(u * Math.PI);
          return [
            -2.56 + u * 5.02,
            baseY + u * (tier === 1 ? 0.34 : 0.19) + bend * (tier === 2 ? 0.13 : 0.08),
            baseZ + branchBend * (bend - 0.5) + side * (0.66 + bend * 0.32),
          ];
        }, 28, 3, branchMaterial, branchGroup);
        bridge.castShadow = true;
        bridge.receiveShadow = true;

        for (const edge of [0.08, 0.92]) {
          const railPoints = [];
          for (let index = 0; index <= 16; index += 1) {
            const u = index / 16;
            const bend = Math.sin(u * Math.PI);
            railPoints.push([
              -2.56 + u * 5.02,
              baseY + 0.22 + u * (tier === 1 ? 0.34 : 0.19) + bend * (tier === 2 ? 0.13 : 0.08),
              baseZ + branchBend * (bend - 0.5) + (edge - 0.5) * (0.66 + bend * 0.32),
            ]);
          }
          tube(railPoints, 0.02, materials.brass, branchGroup, 40, 5);
        }

        const crossbars = [];
        for (let index = 1; index < 10; index += 1) {
          const u = index / 10;
          const bend = Math.sin(u * Math.PI);
          crossbars.push({
            position: [
              -2.56 + u * 5.02,
              baseY + 0.2 + u * (tier === 1 ? 0.34 : 0.19) + bend * (tier === 2 ? 0.13 : 0.08),
              baseZ + branchBend * (bend - 0.5),
            ],
            rotation: [0.13, 0, -0.18],
            scale: [0.5 + bend * 0.22, 1, 1],
          });
        }
        sculpt.instances(new THREE.BoxGeometry(1, 0.022, 0.032), materials.copper, crossbars, branchGroup);

        for (const side of [-1, 1]) {
          rounded(0.11, 0.62 + tier * 0.12, 0.11, materials.walnut, branchGroup, [
            side * 2.38,
            baseY - 0.33 - tier * 0.06,
            baseZ + branchBend * -0.5,
          ], [0, 0, side * 0.035], 0.03);
          const seat = sculpt.ring(0.11, 0.022, materials.brass, branchGroup, [
            side * 2.38,
            baseY - 0.02,
            baseZ + branchBend * -0.5,
          ]);
          seat.rotation.x = Math.PI / 2;
        }
      });
      branchGroup.visible = branch === 0;
      branchGroups.push({ group: branchGroup, material: branchMaterial });
    }
  }

  function buildNarrativeWindows() {
    const placements = [
      [-1.66, 1.36, 2.18],
      [1.66, 1.36, 2.18],
      [-1.66, 3.14, 2.22],
      [1.66, 3.14, 2.22],
      [-1.58, 4.92, 2.16],
      [1.58, 4.92, 2.16],
    ];
    placements.forEach((placement, slot) => {
      const [x, y, z] = placement;
      const holder = new THREE.Group();
      holder.position.set(x, y, z);
      holder.rotation.y = Math.atan2(x, z) * 0.48;
      group.add(holder);

      rounded(1.08, 1.48, 0.12, kit.walnut, holder, [0, 0, 0], [0, 0, 0], 0.04);
      rounded(0.92, 1.27, 0.045, materials.windowInk, holder, [0, 0, 0.075], [0, 0, 0], 0.025);
      const itemIndex = modulo(WINDOW_OFFSETS[slot], items.length);
      const item = items[itemIndex];
      const image = item ? makeImage(item, 0.82, 1.15, holder, [0, 0.04, 0.105]) : null;
      const proxy = hitProxy(1.02, 1.4, 0.18, holder, [0, 0, 0.12]);
      const label = makeText("", 0.86, 0.16, holder, [0, -0.64, 0.12], {
        background: null,
        color: "#e8dbc2",
        fontSize: 18,
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
    rounded(1.55, 0.24, 1.08, materials.walnut, group, [-3.02, 0.54, 2.28], [0, 0.08, 0], 0.08);
    rounded(1.3, 0.06, 0.84, materials.brass, group, [-3.02, 0.7, 2.28], [0, 0.08, 0], 0.045);
    for (const x of [-3.62, -2.42]) {
      rounded(0.1, 0.58, 0.1, materials.walnut, group, [x, 0.27, 2.28], [0, 0, 0], 0.03);
    }
    const dial = new THREE.Group();
    dial.position.set(-3.02, 1.24, 2.42);
    dial.rotation.x = -0.08;
    group.add(dial);
    const dialBack = new THREE.Mesh(
      new THREE.CircleGeometry(0.72, 56),
      new THREE.MeshBasicMaterial({ color: 0x16221f, transparent: true, opacity: 0.86, side: THREE.DoubleSide }),
    );
    dialBack.position.z = -0.04;
    dial.add(dialBack);
    sculpt.ring(0.72, 0.035, materials.brass, dial, [0, 0, 0]);
    sculpt.ring(0.53, 0.015, materials.copper, dial, [0, 0, 0.02]);

    const tickCount = Math.max(36, items.length);
    const ticks = [];
    for (let index = 0; index < tickCount; index += 1) {
      const angle = index / tickCount * TAU;
      const major = index % 6 === 0;
      ticks.push({
        position: [Math.cos(angle) * 0.61, Math.sin(angle) * 0.61, 0.045],
        rotation: [0, 0, angle - Math.PI / 2],
        scale: [major ? 1.35 : 0.7, major ? 1.04 : 0.62, 1],
      });
    }
    sculpt.instances(new THREE.BoxGeometry(0.014, 0.105, 0.022), materials.brass, ticks, dial);
    tickPointer = new THREE.Group();
    tickPointer.position.z = 0.08;
    dial.add(tickPointer);
    rounded(0.027, 0.5, 0.038, materials.pulse, tickPointer, [0, 0.25, 0], [0, 0, 0], 0.01);
    const pointerTip = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.16, 14), materials.pulse);
    pointerTip.position.y = 0.57;
    tickPointer.add(pointerTip);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.1, 20), materials.brass);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = 0.12;
    dial.add(hub);
    const dialProxy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.12, 24),
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
    timelineHandle.position.set(0, 2.78, -1.03);
    group.add(timelineHandle);
    rounded(1.08, 0.18, 0.27, materials.brass, timelineHandle, [0, 0, 0], [0, 0, 0], 0.07);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.56, 20), materials.walnut);
    grip.rotation.z = Math.PI / 2;
    timelineHandle.add(grip);
    for (const x of [-0.61, 0.61]) {
      sculpt.ring(0.13, 0.022, materials.copper, timelineHandle, [x, 0, 0.08]);
      rounded(0.16, 0.34, 0.22, materials.walnut, timelineHandle, [x, -0.18, 0], [0, 0, 0], 0.035);
    }

    const forkRoot = new THREE.Group();
    forkRoot.position.set(3.02, 1.12, 2.18);
    group.add(forkRoot);
    rounded(0.86, 0.18, 0.5, materials.walnut, forkRoot, [0, -0.22, -0.04], [0, 0, 0], 0.055);
    for (const x of [-0.34, 0.34]) {
      const stop = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.16, 14), materials.brass);
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
    pendulum.position.set(3.54, 3.12, 1.9);
    group.add(pendulum);
    rounded(0.24, 0.42, 0.24, materials.ink, pendulum, [0, 0.12, 0], [0, 0, 0], 0.045);
    const pendulumBearing = sculpt.ring(0.2, 0.035, materials.brass, pendulum, [0, 0.12, 0.14]);
    pendulumBearing.rotation.x = Math.PI / 2;
    tube([
      [0, -0.04, 0],
      [0, -0.72, 0],
      [0.18, -1.12, 0.1],
    ], 0.026, materials.brass, pendulum, 20, 5);
    pendulumBob = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), materials.pulse);
    pendulumBob.position.set(0.18, -1.15, 0.1);
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
    branchLinkage.position.set(-2.3, 2.54, -0.42);
    group.add(branchLinkage);
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 20), materials.ink);
    hinge.rotation.x = Math.PI / 2;
    branchLinkage.add(hinge);
    sculpt.ring(0.17, 0.025, materials.brass, branchLinkage, [0, 0, 0.15]);
    rounded(1.08, 0.1, 0.11, materials.brass, branchLinkage, [0.58, 0, 0], [0, 0, -0.16], 0.03);
    tube([
      [1.02, -0.08, 0],
      [1.42, 0.28, 0.12],
      [1.74, 0.54, 0.25],
    ], 0.03, materials.copper, branchLinkage, 24, 6);
  }

  function buildThreadsAndBeads() {
    const threadGeometry = new THREE.BufferGeometry();
    threadAttribute = new THREE.Float32BufferAttribute(new Float32Array(18 * 4 * 3), 3);
    threadAttribute.setUsage(THREE.DynamicDrawUsage);
    threadGeometry.setAttribute("position", threadAttribute);
    const threadLines = new THREE.LineSegments(
      threadGeometry,
      new THREE.LineBasicMaterial({ color: 0xb88b51, transparent: true, opacity: 0.78 }),
    );
    group.add(threadLines);

    const beadGeometry = new THREE.SphereGeometry(0.045, 10, 8);
    for (let chain = 0; chain < 3; chain += 1) {
      const mesh = sculpt.instances(
        beadGeometry,
        chain === 1 ? materials.green : materials.copper,
        Array.from({ length: 14 }, (_, index) => ({
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
    const title = makeText("分岔时间织机", 2.55, 0.36, group, [0, 7.25, 0.32], {
      background: null,
      color: "#e8dcc4",
      fontSize: 42,
      align: "center",
      serif: true,
    });
    if (title) title.rotation.x = -0.06;

    timelineCaption = makeText("", 2.3, 0.52, group, [0, 0.34, 3.3], {
      background: null,
      color: "#e9d9bc",
      fontSize: 20,
      align: "center",
      serif: false,
    });
    branchReadout = makeText("", 1.8, 0.26, group, [0, 1.88, 3.06], {
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
      node.label = replaceText(node.label, `${seriesYears(item)} · ${clip(itemTitle(item), 12)}`, 0.86, 0.16, node.holder, [0, -0.64, 0.12], {
        background: null,
        color: "#e8dbc2",
        fontSize: 16,
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
    timelineCaption = replaceText(timelineCaption, text, 2.3, 0.52, group, [0, 0.34, 3.3], {
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
      [0, 1.88, 3.06],
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
    for (let index = 0; index < 18; index += 1) {
      const column = index % 6;
      const row = Math.floor(index / 6);
      const startAngle = index / 18 * TAU;
      const start = [
        -3.03 + Math.cos(startAngle) * (0.54 + row * 0.1),
        3.08 + (row - 1) * 1.2,
        -0.18 + Math.sin(startAngle) * 0.24,
      ];
      const endNode = windowNodes[column];
      const end = endNode
        ? [endNode.base.x, endNode.base.y + 0.1, endNode.base.z + 0.1]
        : [0, 3.2, 1.5];
      const mid = [
        (start[0] + end[0]) * 0.48,
        1.85 + row * 1.18 + Math.sin(column / 5 * Math.PI) * 0.38,
        (branch ? -0.28 : 0.36) + Math.sin(index * 1.7) * 0.18,
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
      branch.group.rotation.y = (index ? 0.23 : -0.13) + (index === state.branch ? Math.sin(now * 0.44) * 0.008 * motion : 0);
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
