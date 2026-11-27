export function buildExperience(kit) {
  const THREE = kit.THREE;
  const collection = kit.collection || { items: [] };
  const items = Array.isArray(collection.items)
    ? collection.items.filter((item) => Array.isArray(item.stanzas) && item.stanzas.length)
    : [];
  const group = new THREE.Group();
  group.name = "moon-pulled-poetry";

  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const ownedTextures = new Set();
  const animatedMaterials = [];
  let active = false;
  let selected = 0;
  let verse = 0;
  let scroll = 0.08;
  let moonAngle = 0.42;
  let moonLift = 0;
  let lastStatus = "";
  let rippleSerial = 0;
  let lastInkAdvance = -Infinity;
  let pageSection = -1;

  const visual = {
    moonAngle,
    moonLift,
    scroll,
    ripples: 0,
  };

  const clamp = THREE.MathUtils.clamp;
  const damp = THREE.MathUtils.damp;
  const lerp = THREE.MathUtils.lerp;
  const smoothstep = THREE.MathUtils.smoothstep;

  function ownMaterial(options) {
    const material = new THREE.MeshStandardMaterial(options);
    ownedMaterials.add(material);
    return material;
  }

  function ownBasic(options) {
    const material = new THREE.MeshBasicMaterial(options);
    ownedMaterials.add(material);
    return material;
  }

  function ownGeometry(geometry) {
    ownedGeometries.add(geometry);
    return geometry;
  }

  const kitMaterial = (color, roughness = 0.66, metalness = 0) => (
    typeof kit.material === "function"
      ? kit.material(color, roughness, metalness)
      : ownMaterial({ color, roughness, metalness })
  );

  const materials = {
    porcelain: kitMaterial(0xe6e0d4, 0.48, 0.02),
    porcelainShade: kitMaterial(0xaaa49a, 0.58, 0.02),
    paper: ownMaterial({
      color: 0xe9ddc5,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
    copper: kitMaterial(0x956b43, 0.36, 0.66),
    verdigris: kitMaterial(0x65726b, 0.5, 0.2),
    ink: kitMaterial(0x172a28, 0.4, 0.08),
    charcoal: kitMaterial(0x292723, 0.64, 0.08),
    moon: ownMaterial({
      color: 0xf4f2e9,
      roughness: 0.16,
      metalness: 0.06,
      emissive: 0x1c2530,
      emissiveIntensity: 0.2,
    }),
    moonBack: kitMaterial(0x48645f, 0.3, 0.46),
    gem: ownMaterial({
      color: 0x6bb8aa,
      roughness: 0.12,
      metalness: 0.08,
      emissive: 0x235f5d,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    }),
    ghost: ownBasic({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  };

  function addMesh(geometry, material, parent = group, position = [0, 0, 0]) {
    const node = new THREE.Mesh(geometry, material);
    node.position.set(...position);
    node.castShadow = true;
    node.receiveShadow = true;
    parent.add(node);
    return node;
  }

  function roundedShapeGeometry(width, height, depth, radius) {
    const shape = new THREE.Shape();
    const left = -width / 2;
    const bottom = -height / 2;
    const right = width / 2;
    const top = height / 2;
    const corner = Math.min(radius, width / 2, height / 2);
    shape.moveTo(left + corner, bottom);
    shape.lineTo(right - corner, bottom);
    shape.quadraticCurveTo(right, bottom, right, bottom + corner);
    shape.lineTo(right, top - corner);
    shape.quadraticCurveTo(right, top, right - corner, top);
    shape.lineTo(left + corner, top);
    shape.quadraticCurveTo(left, top, left, top - corner);
    shape.lineTo(left, bottom + corner);
    shape.quadraticCurveTo(left, bottom, left + corner, bottom);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: Math.min(corner * 0.34, 0.035),
      bevelThickness: Math.min(depth * 0.22, 0.035),
      curveSegments: 8,
    });
    geometry.center();
    return ownGeometry(geometry);
  }

  function rounded(width, height, depth, material, parent, position, radius = 0.08) {
    if (kit.sculpt && typeof kit.sculpt.rounded === "function") {
      return kit.sculpt.rounded(width, height, depth, material, parent, position, radius);
    }
    return addMesh(roundedShapeGeometry(width, height, depth, radius), material, parent, position);
  }

  function lathe(profile, material, parent, position = [0, 0, 0], segments = 64) {
    if (kit.sculpt && typeof kit.sculpt.lathe === "function") {
      return kit.sculpt.lathe(profile, material, parent, position, segments);
    }
    const points = profile.map((point) => new THREE.Vector2(point[0], point[1]));
    return addMesh(ownGeometry(new THREE.LatheGeometry(points, segments)), material, parent, position);
  }

  function tube(points, radius, material, parent, segments = 64, sides = 8) {
    if (kit.sculpt && typeof kit.sculpt.tube === "function") {
      return kit.sculpt.tube(points, radius, material, parent, segments, sides);
    }
    const vectors = points.map((point) => (
      point && point.isVector3 ? point.clone() : new THREE.Vector3(...point)
    ));
    const curve = new THREE.CatmullRomCurve3(vectors);
    return addMesh(
      ownGeometry(new THREE.TubeGeometry(curve, segments, radius, sides, false)),
      material,
      parent,
    );
  }

  function ring(radiusValue, tubeRadius, material, parent, position = [0, 0, 0], arc = Math.PI * 2) {
    if (kit.sculpt && typeof kit.sculpt.ring === "function") {
      return kit.sculpt.ring(radiusValue, tubeRadius, material, parent, position, arc);
    }
    return addMesh(
      ownGeometry(new THREE.TorusGeometry(radiusValue, tubeRadius, 8, 72, arc)),
      material,
      parent,
      position,
    );
  }

  function instances(geometry, material, placements, parent) {
    if (kit.sculpt && typeof kit.sculpt.instances === "function") {
      return kit.sculpt.instances(geometry, material, placements, parent);
    }
    const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
    const dummy = new THREE.Object3D();
    placements.forEach((placement, index) => {
      dummy.position.set(...(placement.position || [0, 0, 0]));
      dummy.rotation.set(...(placement.rotation || [0, 0, 0]));
      const scale = placement.scale ?? 1;
      dummy.scale.set(...(Array.isArray(scale) ? scale : [scale, scale, scale]));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function gearGeometry(radiusValue, depth, teeth) {
    const shape = new THREE.Shape();
    const count = Math.max(8, teeth * 4);
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * Math.PI * 2;
      const toothWave = index % 4 < 2 ? 1 : 0.84;
      const radiusAt = radiusValue * toothWave;
      const x = Math.cos(angle) * radiusAt;
      const y = Math.sin(angle) * radiusAt;
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 1,
    });
    geometry.center();
    return ownGeometry(geometry);
  }

  function gear(radiusValue, depth, teeth, material, parent, position = [0, 0, 0]) {
    if (kit.sculpt && typeof kit.sculpt.gear === "function") {
      return kit.sculpt.gear(radiusValue, depth, teeth, material, parent, position);
    }
    return addMesh(gearGeometry(radiusValue, depth, teeth), material, parent, position);
  }

  function createCanvasTexture(width, height, draw) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    draw(context, canvas);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    ownedTextures.add(texture);
    return texture;
  }

  function drawFitLines(context, canvas, lines, options = {}) {
    const {
      x = canvas.width * 0.08,
      y = canvas.height * 0.12,
      width = canvas.width * 0.84,
      height = canvas.height * 0.8,
      color = "#233b38",
      fontFamily = "\"Baskerville\", \"Songti SC\", \"Times New Roman\", serif",
      weight = 400,
      lineGap = 1.36,
    } = options;
    const safeLines = lines.filter(Boolean);
    if (!safeLines.length) return;
    let fontSize = Math.min(canvas.height * 0.14, 86);
    let rows = [];
    do {
      context.font = `${weight} ${fontSize}px ${fontFamily}`;
      rows = [];
      safeLines.forEach((line) => {
        const words = String(line).split(/\s+/);
        let row = "";
        words.forEach((word) => {
          const candidate = row ? row + " " + word : word;
          if (context.measureText(candidate).width > width && row) {
            rows.push(row);
            row = word;
          } else {
            row = candidate;
          }
        });
        if (row) rows.push(row);
      });
      if (rows.length * fontSize * lineGap <= height) break;
      fontSize *= 0.9;
    } while (fontSize > 15);
    context.fillStyle = color;
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.font = `${weight} ${fontSize}px ${fontFamily}`;
    const leading = fontSize * lineGap;
    const startY = y + (height - rows.length * leading) * 0.5 + fontSize;
    rows.forEach((row, index) => {
      context.fillText(row, x, startY + index * leading, width);
    });
  }

  function makeBandTexture(item, index) {
    const lines = [];
    item.stanzas.forEach((stanza) => lines.push(...stanza));
    const excerpt = lines.slice(index % 3, index % 3 + 8);
    return createCanvasTexture(2048, 256, (context, canvas) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(34, 58, 55, 0.96)";
      context.textBaseline = "middle";
      context.font = "600 32px \"Baskerville\", \"Songti SC\", serif";
      context.fillText(`${item.title}  ·  ${item.author || ""}`, 54, 54, 1900);
      context.font = "400 44px \"Baskerville\", \"Songti SC\", serif";
      const line = excerpt.join("   ✦   ");
      context.fillText(line, 54, 155, 1900, 1);
    });
  }

  function makePageTexture(item, lines, index, complete = false) {
    const lineCount = lines.length;
    return createCanvasTexture(896, Math.max(420, Math.min(960, 310 + lineCount * 86)), (context, canvas) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = complete ? "rgba(239, 231, 213, 0.97)" : "rgba(239, 231, 213, 0.9)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "rgba(91, 111, 99, 0.38)";
      context.lineWidth = 2;
      context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
      context.fillStyle = "#465b54";
      context.font = "600 30px \"Songti SC\", \"Times New Roman\", serif";
      context.fillText(`${String(index + 1).padStart(2, "0")}  /  ${item.displayTitle || item.title}`, 64, 78, canvas.width - 128);
      drawFitLines(context, canvas, lines, {
        x: 64,
        y: 112,
        width: canvas.width - 128,
        height: canvas.height - 168,
        color: "#203532",
        weight: 400,
        lineGap: 1.48,
      });
      if (complete) {
        context.fillStyle = "rgba(58, 88, 79, 0.84)";
        context.font = "500 23px \"Songti SC\", serif";
        context.fillText(`${item.author || ""}  ·  ${item.form || ""}  ·  ${item.year || ""}`, 64, canvas.height - 46, canvas.width - 128);
      }
    });
  }

  function makeTextMaterial(texture, opacity = 1) {
    return ownBasic({
      map: texture,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
  }

  function replaceTextureMaterial(material, texture) {
    const previous = material.map;
    material.map = texture;
    material.needsUpdate = true;
    if (previous && ownedTextures.has(previous) && previous !== texture) {
      ownedTextures.delete(previous);
      previous.dispose();
    }
  }

  function transparentHit(width, height, radius, id, parent, position) {
    let geometry;
    if (!radius) geometry = ownGeometry(new THREE.PlaneGeometry(width, height));
    else geometry = ownGeometry(new THREE.SphereGeometry(radius, 18, 12));
    const node = addMesh(geometry, materials.ghost, parent, position);
    node.castShadow = false;
    node.receiveShadow = false;
    node.userData.interactionId = id;
    return node;
  }

  function register(node, descriptor) {
    if (typeof kit.register !== "function") return;
    kit.register(node, descriptor);
  }

  function status(message) {
    if (message === lastStatus) return;
    lastStatus = message;
    if (typeof kit.status === "function") kit.status(message);
  }

  function invalidate() {
    if (typeof kit.invalidate === "function") kit.invalidate();
  }

  function currentItem() {
    return items[selected] || null;
  }

  function flattenStanzas(item) {
    if (!item) return [];
    const result = [];
    item.stanzas.forEach((stanza, stanzaIndex) => {
      stanza.forEach((line, lineIndex) => {
        result.push({ text: line, stanzaIndex, lineIndex });
      });
    });
    return result;
  }

  function verseContext() {
    const item = currentItem();
    const flat = flattenStanzas(item);
    if (!flat.length) return { flat, current: null, stanza: [], lineWithin: -1 };
    const current = flat[((verse % flat.length) + flat.length) % flat.length];
    return {
      flat,
      current,
      stanza: item.stanzas[current.stanzaIndex] || [],
      lineWithin: current.lineIndex,
    };
  }

  // One broad stone deck and a dark timber shadow keep the page grounded.
  const foundation = new THREE.Group();
  foundation.name = "paper-table-foundation";
  group.add(foundation);
  rounded(7.25, 0.26, 1.9, materials.charcoal, foundation, [0, 0.14, 0], 0.1);
  rounded(6.78, 0.34, 1.42, materials.porcelainShade, foundation, [0, 0.42, 0.08], 0.12);

  // A low, quiet arch remains behind the paper as a room-scale depth cue.
  const archSystem = new THREE.Group();
  archSystem.name = "single-shadow-arch";
  archSystem.visible = false;
  group.add(archSystem);
  const rearArch = ring(4.15, 0.035, materials.verdigris, archSystem, [0, 3.6, -1.08], Math.PI * 1.2);
  rearArch.rotation.z = -0.08;
  for (const side of [-1, 1]) {
    tube([
      [side * 4.0, 0.55, -1.02],
      [side * 3.88, 2.16, -1.12],
      [side * 3.72, 3.52, -1.14],
    ], 0.045, materials.porcelainShade, archSystem, 28, 7);
  }

  const moonTrackPoints = [];
  for (let index = 0; index < 36; index += 1) {
    const angle = index / 36 * Math.PI * 2;
    moonTrackPoints.push([
      Math.cos(angle) * 3.02,
      7.45 + Math.sin(angle * 2) * 0.1,
      -1.48 + Math.sin(angle) * 0.27,
    ]);
  }
  tube(moonTrackPoints, 0.027, materials.copper, group, 144, 6).name = "moon-orbit-rail";

  const moonRig = new THREE.Group();
  moonRig.name = "moon-drive";
  group.add(moonRig);
  const moonShape = new THREE.Shape();
  const outerRadius = 0.97;
  const innerCenter = 0.31;
  const innerRadius = 0.82;
  const outerStart = Math.atan2(
    Math.sqrt(outerRadius * outerRadius - Math.pow((outerRadius * outerRadius - innerRadius * innerRadius + innerCenter * innerCenter) / (2 * innerCenter), 2)),
    (outerRadius * outerRadius - innerRadius * innerRadius + innerCenter * innerCenter) / (2 * innerCenter),
  );
  const innerStart = Math.atan2(
    Math.sqrt(innerRadius * innerRadius - Math.pow(((outerRadius * outerRadius - innerRadius * innerRadius + innerCenter * innerCenter) / (2 * innerCenter)) - innerCenter, 2)),
    ((outerRadius * outerRadius - innerRadius * innerRadius + innerCenter * innerCenter) / (2 * innerCenter)) - innerCenter,
  );
  moonShape.moveTo(Math.cos(outerStart) * outerRadius, Math.sin(outerStart) * outerRadius);
  moonShape.absarc(0, 0, outerRadius, outerStart, Math.PI * 2 - outerStart, false);
  moonShape.lineTo(Math.cos(-innerStart) * innerRadius + innerCenter, Math.sin(-innerStart) * innerRadius);
  moonShape.absarc(innerCenter, 0, innerRadius, -innerStart, -Math.PI * 2 + innerStart, true);
  moonShape.closePath();
  const moonGeometry = ownGeometry(new THREE.ExtrudeGeometry(moonShape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    curveSegments: 32,
  }));
  moonGeometry.center();
  const moonCrescent = addMesh(moonGeometry, materials.moon, moonRig);
  moonCrescent.rotation.y = 0.42;
  const moonBack = addMesh(moonGeometry, materials.moonBack, moonRig, [0, 0, -0.12]);
  moonBack.scale.set(1.035, 1.035, 0.6);
  moonBack.rotation.y = 0.42;
  const moonHub = ring(0.2, 0.055, materials.copper, moonRig, [0, 0, 0.18]);
  moonHub.rotation.y = 0.42;
  const moonGem = addMesh(
    ownGeometry(new THREE.IcosahedronGeometry(0.16, 2)),
    materials.gem,
    moonRig,
    [0.32, -0.02, 0.3],
  );
  moonGem.castShadow = false;
  const moonHit = transparentHit(1.86, 1.86, 0, "moon", moonRig, [0, 0, 0.36]);
  register(moonHit, {
    id: "moon",
    label: "月引轮",
    hint: "拖动月牙，改变月光方向并抬起诗页",
    anchor: [0, 0, 0.36],
    onDown() {
      status("月引轮已解除制动");
    },
    onDrag({ dx, dy }) {
      moonAngle += dx * 0.012;
      moonLift = clamp(moonLift - dy * 0.006, -1, 1);
      status(`月相 ${Math.round((moonAngle / (Math.PI * 2)) * 360)}° · 牵引高度 ${moonLift >= 0 ? "+" : ""}${(moonLift * 100).toFixed(0)}%`);
      applyMoon();
      invalidate();
    },
    onUp() {
      status(`月轨锁定在 ${Math.round((moonAngle / (Math.PI * 2)) * 360)}°`);
    },
    onClick() {
      moonAngle += Math.PI / 4;
      moonLift = clamp(moonLift + 0.22, -1, 1);
      applyMoon();
      status("月引轮转过一格，字潮抬高一层");
      invalidate();
    },
    onKey(key) {
      if (key === "ArrowLeft" || key === "ArrowRight") {
        moonAngle += key === "ArrowLeft" ? -0.12 : 0.12;
        applyMoon();
        invalidate();
      }
      if (key === "ArrowUp" || key === "ArrowDown") {
        moonLift = clamp(moonLift + (key === "ArrowUp" ? 0.08 : -0.08), -1, 1);
        applyMoon();
        invalidate();
      }
    },
  });

  // Three continuous Mobius-like text ribbons are true deformed surfaces, not rectangular cards.
  const ribbons = [];
  const ribbonRadius = [2.28, 2.62, 2.05];
  const ribbonHeight = [4.62, 4.15, 3.67];
  items.slice(0, 3).forEach((item, index) => {
    const texture = makeBandTexture(item, index);
    const material = ownMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.02,
      transparent: true,
      opacity: 0.08,
      alphaTest: 0.03,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const segments = 168;
    const geometry = ownGeometry(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array((segments + 1) * 6), 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array((segments + 1) * 4), 2));
    const indices = [];
    for (let segment = 0; segment < segments; segment += 1) {
      const a = segment * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geometry.setIndex(indices);
    const node = addMesh(geometry, material, group);
    node.name = `mobius-text-band-${index + 1}`;
    node.castShadow = false;
    node.visible = false;
    const edgeGeometry = ownGeometry(new THREE.BufferGeometry());
    edgeGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array((segments + 1) * 3), 3));
    const edge = new THREE.Line(
      edgeGeometry,
      new THREE.LineBasicMaterial({ color: index === 1 ? 0x8a6741 : 0x57766c, transparent: true, opacity: 0.08 }),
    );
    edge.name = `mobius-text-edge-${index + 1}`;
    edge.visible = false;
    ownedMaterials.add(edge.material);
    group.add(edge);
    ribbons.push({ node, edge, geometry, edgeGeometry, segments, index, material });
  });

  function ribbonAcross(index, t, side) {
    const angle = t * Math.PI * 2 + visual.moonAngle * (0.38 + index * 0.13);
    const radiusValue = ribbonRadius[index] + Math.sin(t * Math.PI * 4 + index) * 0.05;
    const center = new THREE.Vector3(
      Math.cos(angle) * radiusValue,
      ribbonHeight[index] + visual.moonLift * (0.42 + index * 0.12) + Math.sin(angle * 2 + index) * 0.2,
      Math.sin(angle) * radiusValue * 0.54,
    );
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const twist = t * Math.PI + index * Math.PI * 0.66;
    const across = up.multiplyScalar(Math.cos(twist)).addScaledVector(radial, Math.sin(twist));
    across.normalize().multiplyScalar(0.22 * side);
    return center.add(across);
  }

  function updateRibbon(ribbon) {
    const positions = ribbon.geometry.attributes.position;
    const uvs = ribbon.geometry.attributes.uv;
    const edgePositions = ribbon.edgeGeometry.attributes.position;
    for (let segment = 0; segment <= ribbon.segments; segment += 1) {
      const t = segment / ribbon.segments;
      const left = ribbonAcross(ribbon.index, t, -1);
      const right = ribbonAcross(ribbon.index, t, 1);
      positions.setXYZ(segment * 2, left.x, left.y, left.z);
      positions.setXYZ(segment * 2 + 1, right.x, right.y, right.z);
      uvs.setXY(segment * 2, t * 3, 0);
      uvs.setXY(segment * 2 + 1, t * 3, 1);
      edgePositions.setXYZ(segment, left.x, left.y, left.z);
    }
    positions.needsUpdate = true;
    uvs.needsUpdate = true;
    edgePositions.needsUpdate = true;
    ribbon.geometry.computeVertexNormals();
    ribbon.geometry.computeBoundingSphere();
    ribbon.edgeGeometry.computeBoundingSphere();
  }

  // Six paper leaves ride the orbit rails and carry the selected poem's complete lines.
  const floatingPages = new THREE.Group();
  floatingPages.name = "gravity-paper-orbit";
  floatingPages.visible = false;
  group.add(floatingPages);
  const pageLeaves = [];
  for (let index = 0; index < 3; index += 1) {
    const texture = items.length ? makePageTexture(items[index % items.length], [], index) : makePageTexture({
      displayTitle: "Poetry",
      title: "Poetry",
      author: "",
      form: "",
      year: "",
    }, [], index);
    const page = addMesh(
      ownGeometry(new THREE.PlaneGeometry(0.52, 0.68, 6, 8)),
      makeTextMaterial(texture, 0.44),
      floatingPages,
    );
    page.name = `floating-poem-page-${index + 1}`;
    page.castShadow = true;
    page.receiveShadow = false;
    const edge = new THREE.LineSegments(
      ownGeometry(new THREE.EdgesGeometry(page.geometry, 22)),
      new THREE.LineBasicMaterial({ color: 0x8f7957, transparent: true, opacity: 0.62 }),
    );
    ownedMaterials.add(edge.material);
    page.add(edge);
    pageLeaves.push({ page, index, material: page.material });
  }

  function refreshPageLeaves() {
    const item = currentItem();
    if (!item) return;
    const flat = flattenStanzas(item);
    const chunkSize = Math.max(2, Math.ceil(flat.length / 6));
    pageLeaves.forEach(({ page, index, material }) => {
      const start = index * chunkSize;
      const lines = flat.slice(start, start + chunkSize).map((entry) => entry.text);
      const texture = makePageTexture(item, lines, index);
      replaceTextureMaterial(material, texture);
      page.userData.collectionIndex = selected;
    });
  }

  const readingBackingMaterial = ownMaterial({
    color: 0x9b7d58,
    roughness: 0.84,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
  });
  const readingBacking = rounded(6.72, 6.72, 0.08, readingBackingMaterial, group, [0, 3.78, 1.56], 0.055);
  readingBacking.name = "complete-poem-backing";
  readingBacking.rotation.y = -0.035;
  const readingPageMaterial = makeTextMaterial(items.length
    ? makePageTexture(items[0], items[0].stanzas.flat().slice(0, 8), 0, true)
    : makePageTexture({ displayTitle: "Poetry", title: "Poetry", author: "", form: "", year: "" }, [], 0, true));
  const readingPage = addMesh(
    ownGeometry(new THREE.PlaneGeometry(6.36, 6.36, 8, 12)),
    readingPageMaterial,
    group,
    [0, 3.78, 1.66],
  );
  readingPage.name = "complete-poem-page";
  readingPage.rotation.y = -0.035;
  const readingHit = transparentHit(6.46, 6.46, 0, "reading-page", group, [0, 3.78, 1.82]);
  readingHit.name = "reading-page-hit";
  readingHit.rotation.y = -0.035;
  register(readingHit, {
    id: "reading-page",
    label: "展开诗页",
    hint: "卷轴完全展开后，点击这一页查看完整馆藏详情",
    anchor: [0, 0, 0.05],
    onClick() {
      if (scroll < 0.93) {
        status(`诗卷尚展开 ${Math.round(scroll * 100)}% · 需拉至末节才能进入完整诗页`);
        return;
      }
      status("完整诗页已展开，正在打开馆藏详情");
      if (typeof kit.onSelect === "function") kit.onSelect("poems", selected);
    },
  });

  // A black lacquer well follows a serpentine centerline; its shader carries eight live ripples.
  const inkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.42, 0.82, 2.2),
    new THREE.Vector3(-1.28, 0.86, 2.44),
    new THREE.Vector3(-0.28, 0.8, 1.98),
    new THREE.Vector3(0.68, 0.87, 1.5),
    new THREE.Vector3(1.5, 0.82, 1.8),
    new THREE.Vector3(2.42, 0.88, 2.28),
  ]);
  tube(inkCurve.getPoints(64), 0.11, materials.porcelainShade, group, 96, 8).name = "continuous-ink-trough-rim";
  const rippleUniforms = Array.from({ length: 8 }, () => new THREE.Vector4(0.5, 0.5, -1000, 0));
  const inkUniforms = {
    uTime: { value: 0 },
    uRipples: { value: rippleUniforms },
    uInk: { value: new THREE.Color(0x0d211f) },
    uSheen: { value: new THREE.Color(0x4f9786) },
  };
  const inkMaterial = new THREE.ShaderMaterial({
    uniforms: inkUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vInkUv;
      varying float vBand;

      void main() {
        vInkUv = uv;
        vBand = uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec4 uRipples[8];
      uniform vec3 uInk;
      uniform vec3 uSheen;
      varying vec2 vInkUv;
      varying float vBand;

      void main() {
        float rings = 0.0;
        float crest = 0.0;
        for (int i = 0; i < 8; i++) {
          vec4 ripple = uRipples[i];
          float age = max(0.0, uTime - ripple.z);
          vec2 delta = vInkUv - ripple.xy;
          delta.x *= 2.25;
          float distanceFromTouch = length(delta);
          float front = age * 0.33;
          float band = exp(-pow((distanceFromTouch - front) * 16.0, 2.0));
          float decay = exp(-age * 0.72) * ripple.w;
          rings += band * decay;
          crest += sin((distanceFromTouch - front) * 88.0) * band * decay;
        }
        float meniscus = smoothstep(0.0, 0.17, vBand) * smoothstep(1.0, 0.83, vBand);
        float flow = sin(vInkUv.x * 36.0 + uTime * 0.32) * 0.5 + 0.5;
        vec3 color = uInk + uSheen * (rings * 0.34 + crest * 0.045 + flow * 0.026);
        float alpha = (0.86 + rings * 0.12) * meniscus;
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  ownedMaterials.add(inkMaterial);
  animatedMaterials.push({ material: inkMaterial, uniform: "uTime", scale: 1 });

  function createInkSurface() {
    const segments = 112;
    const geometry = ownGeometry(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array((segments + 1) * 6), 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array((segments + 1) * 4), 2));
    geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array((segments + 1) * 6), 3));
    const indices = [];
    for (let index = 0; index < segments; index += 1) {
      const a = index * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geometry.setIndex(indices);
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const uvs = geometry.attributes.uv;
    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments;
      const center = inkCurve.getPoint(t);
      const tangent = inkCurve.getTangent(t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(0.62);
      const left = center.clone().add(side);
      const right = center.clone().sub(side);
      positions.setXYZ(index * 2, left.x, left.y, left.z);
      positions.setXYZ(index * 2 + 1, right.x, right.y, right.z);
      normals.setXYZ(index * 2, 0, 1, 0);
      normals.setXYZ(index * 2 + 1, 0, 1, 0);
      uvs.setXY(index * 2, t, 0);
      uvs.setXY(index * 2 + 1, t, 1);
    }
    positions.needsUpdate = true;
    normals.needsUpdate = true;
    uvs.needsUpdate = true;
    geometry.computeBoundingSphere();
    const surface = addMesh(geometry, inkMaterial, group);
    surface.receiveShadow = false;
    return surface;
  }

  const inkSurface = createInkSurface();
  const inkHit = transparentHit(6.25, 1.42, 0, "ink-pool", group, [0, 0.92, 2.1]);
  inkHit.rotation.x = -Math.PI / 2;
  register(inkHit, {
    id: "ink-pool",
    label: "诗墨潮池",
    hint: "点击或拖动墨面，让涟漪把当前诗节逐行托出",
    anchor: [0, 0, 0],
    onDown() {
      status("墨面已感知触点");
    },
    onDrag({ dx, dy, localPoint, point }) {
      const added = addInkRipple(localPoint || point, Math.min(1.25, 0.4 + Math.hypot(dx, dy) * 0.018));
      if (!added) return;
      const now = performance.now();
      if (now - lastInkAdvance > 240) {
        advanceVerse();
        lastInkAdvance = now;
      }
      status(`墨潮有 ${activeRippleCount()} 道涟漪 · 当前第 ${verse % Math.max(1, flattenStanzas(currentItem()).length) + 1} 行`);
      invalidate();
    },
    onClick({ localPoint, point }) {
      addInkRipple(localPoint || point, 1);
      advanceVerse();
      status(`墨中升起 ${verseContext().lineWithin + 1}/${verseContext().stanza.length || 0} 行`);
      invalidate();
    },
    onKey(key) {
      if (key === "Enter" || key === " ") {
        addInkRipple([0, 0.92, 2.1], 0.9);
        advanceVerse();
        invalidate();
      }
    },
  });

  function rippleUvFromPoint(value) {
    let x = 0;
    let z = 1.05;
    if (Array.isArray(value)) {
      x = Number(value[0]) || 0;
      z = Number(value[2]) || 1.05;
    } else if (value && value.isVector3) {
      x = value.x;
      z = value.z;
    }
    return {
      u: clamp((x + 2.4) / 4.8, 0.03, 0.97),
      v: clamp((z - 1.4) / 1.2, 0.08, 0.92),
    };
  }

  function addInkRipple(point, strength = 1) {
    const uv = rippleUvFromPoint(point);
    const now = performance.now() / 1000;
    const slot = rippleSerial % rippleUniforms.length;
    rippleSerial += 1;
    rippleUniforms[slot].set(uv.u, uv.v, now, clamp(strength, 0.2, 1.4));
    visual.ripples = activeRippleCount(now);
    return true;
  }

  function activeRippleCount(now = performance.now() / 1000) {
    return rippleUniforms.reduce((count, ripple) => (
      now - ripple.z >= 0 && now - ripple.z < 3.8 ? count + 1 : count
    ), 0);
  }

  function advanceVerse() {
    const flat = flattenStanzas(currentItem());
    if (!flat.length) return;
    verse = (verse + 1) % flat.length;
    refreshRisingLines(true);
  }

  const risingLines = new THREE.Group();
  risingLines.name = "ink-born-lines";
  group.add(risingLines);
  const lineMeshes = [];
  for (let index = 0; index < 5; index += 1) {
    const material = makeTextMaterial(makePageTexture({
      displayTitle: "Poetry",
      title: "Poetry",
      author: "",
      form: "",
      year: "",
    }, [], index));
    const line = addMesh(
      ownGeometry(new THREE.PlaneGeometry(2.8, 0.31, 18, 2)),
      material,
      risingLines,
      [0, 1.08 + index * 0.25, 2.58],
    );
    line.rotation.x = -0.08;
    line.castShadow = false;
    lineMeshes.push({ mesh: line, material, rise: 0 });
  }

  function refreshRisingLines(immediate = false) {
    const context = verseContext();
    lineMeshes.forEach(({ mesh, material, rise }, index) => {
      const text = context.stanza[index];
      if (!text) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      const texture = createCanvasTexture(1024, 128, (ctx, canvas) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#172c29";
        ctx.font = "500 42px \"Baskerville\", \"Songti SC\", serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 42);
      });
      replaceTextureMaterial(material, texture);
      if (immediate && index <= context.lineWithin) rise = 1;
      if (immediate && index > context.lineWithin) rise = 0;
    });
  }

  // Two broad rollers turn the central paper into a scroll without covering its text.
  const scrollRig = new THREE.Group();
  scrollRig.name = "parameter-paper-scroll";
  scrollRig.position.set(0, 3.78, 2.16);
  scrollRig.rotation.y = -0.035;
  group.add(scrollRig);
  const scrollSupports = new THREE.Group();
  scrollSupports.name = "fixed-scroll-guides";
  scrollRig.add(scrollSupports);
  for (const side of [-1, 1]) {
    tube([
      [side * 3.35, 3.18, -0.08],
      [side * 3.35, -3.18, -0.08],
    ], 0.022, materials.copper, scrollSupports, 28, 6);
  }
  const topRoller = addMesh(
    ownGeometry(new THREE.CylinderGeometry(0.08, 0.08, 6.62, 20, 1)),
    materials.copper,
    scrollRig,
    [0, 3.18, 0.12],
  );
  topRoller.name = "paper-scroll-top-roller";
  topRoller.rotation.z = Math.PI / 2;
  for (const side of [-1, 1]) {
    lathe([
      [0.08, 0],
      [0.26, 0.06],
      [0.21, 0.18],
      [0, 0.23],
    ], materials.porcelain, scrollRig, [side * 3.33, 3.18, 0.12], 24).rotation.z = Math.PI / 2;
  }
  const scrollPull = new THREE.Group();
  scrollPull.name = "paper-scroll-pull";
  scrollPull.position.set(0, 3.08, 0.15);
  scrollRig.add(scrollPull);
  const bottomRollerSpin = new THREE.Group();
  scrollPull.add(bottomRollerSpin);
  const bottomRoller = addMesh(
    ownGeometry(new THREE.CylinderGeometry(0.075, 0.075, 6.6, 20, 1)),
    materials.verdigris,
    bottomRollerSpin,
  );
  bottomRoller.rotation.z = Math.PI / 2;
  for (const side of [-1, 1]) {
    const cap = lathe([
      [0.06, -0.08],
      [0.17, -0.045],
      [0.19, 0.04],
      [0.11, 0.1],
      [0, 0.12],
    ], materials.porcelain, bottomRollerSpin, [side * 3.32, 0, 0], 20);
    cap.rotation.z = Math.PI / 2;
  }
  const pullGrip = rounded(1.18, 0.09, 0.1, materials.porcelain, scrollPull, [0, -0.2, 0.22], 0.03);
  pullGrip.castShadow = true;
  rounded(0.64, 0.045, 0.11, materials.copper, scrollPull, [0, -0.2, 0.275], 0.016);

  function refreshScrollTextures(force = false) {
    const item = currentItem();
    if (!item) return;
    const sectionCount = Math.max(1, item.stanzas.length);
    const section = Math.min(sectionCount - 1, Math.floor(scroll * sectionCount + 0.0001));
    if (!force && section === pageSection) return;
    pageSection = section;
    const lines = item.stanzas[section] || [];
    replaceTextureMaterial(readingPageMaterial, makePageTexture(item, lines, section, true));
  }

  const scrollHandle = transparentHit(6.62, 0.62, 0, "scroll", scrollPull, [0, -0.16, 0.38]);
  register(scrollHandle, {
    id: "scroll",
    label: "诗卷展开轮",
    hint: "向下拉到诗卷展开，向上收起；向右同样展开",
    anchor: [0, -0.2, 0.36],
    onDown() {
      status("纸卷张力已松开");
    },
    onDrag({ dx, dy }) {
      scroll = clamp(scroll + dx * 0.0032 + dy * 0.0042, 0, 1);
      status(`诗卷展开 ${Math.round(scroll * 100)}%`);
      applyScroll();
      invalidate();
    },
    onClick() {
      const sections = Math.max(1, currentItem()?.stanzas.length || 1);
      scroll = clamp(Math.round(scroll * sections + 1) / sections, 0, 1);
      status(`诗卷推进到第 ${Math.min(sections, Math.ceil(scroll * sections))} 节`);
      applyScroll();
      invalidate();
    },
    onKey(key) {
      if (key === "ArrowDown" || key === "ArrowRight") scroll = clamp(scroll + 0.1, 0, 1);
      if (key === "ArrowUp" || key === "ArrowLeft") scroll = clamp(scroll - 0.1, 0, 1);
      applyScroll();
      invalidate();
    },
  });

  const selector = new THREE.Group();
  selector.name = "poem-selector-dial";
  selector.position.set(3.9, 1.58, 2.42);
  group.add(selector);
  const selectorDiscs = [];
  items.slice(0, 3).forEach((item, index) => {
    const discGroup = new THREE.Group();
    discGroup.position.set(index % 2 ? 0.12 : 0, index * 0.86, 0);
    selector.add(discGroup);
    const disc = lathe([
      [0, -0.09],
      [0.31, -0.065],
      [0.34, 0],
      [0.3, 0.08],
      [0, 0.09],
    ], index === 0 ? materials.verdigris : materials.porcelain, discGroup, [0, 0, 0], 36);
    disc.rotation.x = Math.PI / 2;
    const inner = ring(0.21, 0.019, materials.copper, discGroup, [0, 0, 0.1], Math.PI * 1.82);
    inner.rotation.z = index * 0.65;
    const hit = transparentHit(0, 0, 0.48, `poem-${index}`, discGroup, [0, 0, 0.08]);
    register(hit, {
      id: `poem-${index}`,
      label: `选择《${item.title}》`,
      hint: "点击诗轮，将这份完整诗作送上纸页",
      anchor: [0, 0, 0.07],
      onClick() {
        setPoem(index);
        status(`诗轮转向《${item.title}》`);
        invalidate();
      },
    });
    selectorDiscs.push({ group: discGroup, disc, inner });
  });

  function setPoem(index) {
    if (!items.length) return;
    selected = ((Number(index) || 0) % items.length + items.length) % items.length;
    verse = 0;
    scroll = 0.08;
    refreshPageLeaves();
    refreshRisingLines(true);
    refreshScrollTextures(true);
    selectorDiscs.forEach((entry, discIndex) => {
      entry.group.rotation.z = discIndex === selected ? 0.28 : 0;
      entry.disc.scale.setScalar(discIndex === selected ? 1.16 : 1);
      entry.inner.material = discIndex === selected ? materials.copper : materials.verdigris;
    });
    applyScroll();
    invalidate();
  }

  const gravityLines = [];
  for (let index = 0; index < 3; index += 1) {
    const geometry = ownGeometry(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color: index === 1 ? 0x6aa798 : 0x9b744b,
        transparent: true,
        opacity: 0.38,
      }),
    );
    ownedMaterials.add(line.material);
    line.visible = false;
    group.add(line);
    gravityLines.push({ line, geometry });
  }

  function updateGravityLines() {
    gravityLines.forEach(({ geometry }, index) => {
      const start = moonRig.position.clone();
      const end = ribbonAcross(index, (index * 0.23 + 0.16 + visual.moonAngle * 0.04) % 1, 0);
      const position = geometry.attributes.position;
      position.setXYZ(0, start.x, start.y, start.z);
      position.setXYZ(1, end.x, end.y, end.z);
      position.needsUpdate = true;
      geometry.computeBoundingSphere();
    });
  }

  function applyMoon() {
    if (kit.reducedMotion?.()) {
      visual.moonAngle = moonAngle;
      visual.moonLift = moonLift;
    } else {
      visual.moonAngle = THREE.MathUtils.damp(visual.moonAngle, moonAngle, 8, 0.12);
      visual.moonLift = THREE.MathUtils.damp(visual.moonLift, moonLift, 8, 0.12);
    }
    const angle = visual.moonAngle;
    moonRig.position.set(
      Math.cos(angle) * 3.02,
      7.45 + visual.moonLift * 0.58 + Math.sin(angle * 2) * 0.12,
      -1.48 + Math.sin(angle) * 0.27,
    );
    moonRig.rotation.set(0.02, 0.36 - angle * 0.08, Math.sin(angle * 0.7) * 0.12);
    moonGem.rotation.x += 0.012;
    moonGem.rotation.y += 0.018;
    ribbons.forEach(updateRibbon);
    pageLeaves.forEach(({ page, index }) => {
      const angleValue = angle + index / pageLeaves.length * Math.PI * 2;
      const radiusValue = 2.16 + (index % 3) * 0.27;
      page.position.set(
        Math.cos(angleValue) * radiusValue,
        2.15 + visual.moonLift * (0.17 + index * 0.018) + Math.sin(angleValue * 2) * 0.14 + (index % 2) * 0.1,
        Math.sin(angleValue) * radiusValue * 0.47,
      );
      page.rotation.set(
        Math.sin(angleValue * 1.7) * 0.12,
        -angleValue + Math.PI * 0.46,
        Math.sin(angleValue * 2.2) * 0.22,
      );
    });
    updateGravityLines();
  }

  function applyScroll() {
    if (kit.reducedMotion?.()) visual.scroll = scroll;
    else visual.scroll = THREE.MathUtils.damp(visual.scroll, scroll, 10, 0.1);
    const eased = smoothstep(0, 1, visual.scroll);
    scrollPull.position.y = lerp(-3.18, 3.18, eased);
    bottomRollerSpin.rotation.y = visual.scroll * Math.PI * 4.2;
    readingBackingMaterial.opacity = 0.86 + visual.scroll * 0.14;
    refreshScrollTextures();
  }

  function updateRisingLines(time, dt) {
    const context = verseContext();
    lineMeshes.forEach(({ mesh, rise }, index) => {
      const target = index <= context.lineWithin ? 1 : 0;
      const next = kit.reducedMotion?.() ? target : damp(rise, target, 7.5, dt);
      lineMeshes[index].rise = next;
      const startY = 0.94;
      const endY = 1.32 + index * 0.23 + Math.sin(time * 0.7 + index) * 0.018;
      mesh.position.set(
        Math.sin(time * 0.22 + index * 0.85) * 0.045,
        lerp(startY, endY, next),
        2.56 + index * 0.012,
      );
      mesh.scale.setScalar(0.68 + next * 0.32);
      mesh.rotation.z = (1 - next) * (index % 2 ? -0.04 : 0.04);
      if (mesh.material) mesh.material.opacity = 0.05 + next * 0.95;
    });
  }

  function refreshAll(immediate = false) {
    if (!items.length) return;
    setPoem(selected);
    refreshPageLeaves();
    refreshRisingLines(immediate);
    refreshScrollTextures(true);
    applyMoon();
    applyScroll();
  }

  refreshAll(true);

  function interact(action, index) {
    if (action === "select") {
      setPoem(Number(index) || 0);
      status(`诗轮转向《${currentItem()?.title || "诗歌"}》`);
    } else if (action === "moon") {
      moonAngle += Math.PI / 6;
      applyMoon();
      status("月引轮转过一格");
    } else if (action === "ink") {
      addInkRipple([0, 0.92, 2.1], 1);
      advanceVerse();
      status("墨潮推进一行诗文");
    } else if (action === "scroll") {
      scroll = scroll > 0.9 ? 0.08 : clamp(scroll + 0.24, 0, 1);
      applyScroll();
      status(`诗卷展开 ${Math.round(scroll * 100)}%`);
    } else if (action === "reset") {
      moonAngle = 0.42;
      moonLift = 0;
      verse = 0;
      scroll = 0.08;
      rippleUniforms.forEach((ripple) => ripple.set(0.5, 0.5, -1000, 0));
      applyMoon();
      applyScroll();
      refreshRisingLines(true);
      status("月引诗潮已复位");
    }
    invalidate();
  }

  function getState() {
    const item = currentItem();
    const context = verseContext();
    return {
      moonAngle: Number(moonAngle.toFixed(4)),
      moonLift: Number(moonLift.toFixed(3)),
      verse,
      stanza: context.current ? context.current.stanzaIndex + 1 : 0,
      line: context.current ? context.current.lineIndex + 1 : 0,
      lineCount: flattenStanzas(item).length,
      ripples: activeRippleCount(),
      scroll: Number(scroll.toFixed(3)),
      unfoldedStanzas: item ? item.stanzas.filter((_, index) => (
        scroll * item.stanzas.length > index + 0.01
      )).length : 0,
      selected,
      selectedId: item?.id || "",
      selectedTitle: item?.title || "",
      completePageUnlocked: scroll >= 0.93,
      directHandles: ["moon", "ink-pool", "scroll"],
    };
  }

  function setActive(value) {
    active = Boolean(value);
    if (active) {
      applyMoon();
      applyScroll();
      invalidate();
    }
  }

  function update(time, dt) {
    if (!active) return;
    const step = Math.max(0.001, Math.min(dt || 0.016, 0.05));
    const reduced = Boolean(kit.reducedMotion?.());
    if (reduced) {
      visual.moonAngle = moonAngle;
      visual.moonLift = moonLift;
      visual.scroll = scroll;
    } else {
      visual.moonAngle = damp(visual.moonAngle, moonAngle, 7.5, step);
      visual.moonLift = damp(visual.moonLift, moonLift, 7.5, step);
      visual.scroll = damp(visual.scroll, scroll, 8.5, step);
    }
    inkUniforms.uTime.value = performance.now() / 1000;
    animatedMaterials.forEach((entry) => {
      if (entry.material.uniforms?.[entry.uniform]) {
        entry.material.uniforms[entry.uniform].value = time * entry.scale;
      }
    });
    applyMoon();
    applyScroll();
    updateRisingLines(time, step);
    moonGem.rotation.x = time * 0.12;
    moonGem.rotation.y = time * 0.18;
    selectorDiscs.forEach(({ inner }, index) => {
      inner.rotation.z = time * (index === selected ? 0.22 : 0.08) * (index % 2 ? -1 : 1);
    });
    visual.ripples = activeRippleCount();
    invalidate();
  }

  function dispose() {
    group.traverse((node) => {
      if (node.geometry && ownedGeometries.has(node.geometry)) {
        node.geometry.dispose();
      }
      const nodeMaterials = node.material
        ? (Array.isArray(node.material) ? node.material : [node.material])
        : [];
      nodeMaterials.forEach((material) => {
        if (ownedMaterials.has(material)) material.dispose();
      });
    });
    ownedTextures.forEach((texture) => texture.dispose());
    ownedGeometries.clear();
    ownedMaterials.clear();
    ownedTextures.clear();
    if (group.parent) group.parent.remove(group);
  }

  return {
    group,
    focus: new THREE.Vector3(0, 3.72, 0),
    update,
    interact,
    getState,
    setActive,
    dispose,
  };
}
