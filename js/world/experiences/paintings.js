export function buildExperience(kit) {
  const THREE = kit.THREE;
  const collection = kit.collection || { items: [] };
  const artworks = Array.isArray(collection.items)
    ? collection.items.filter((item) => item && (item.image || item.fullImage || item.original))
    : [];
  const group = new THREE.Group();
  group.name = "dimensional-deconstruction-atelier";

  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const ownedTextures = new Set();
  let active = false;
  let selected = 0;
  let explode = 0;
  let lightX = 0.08;
  let lightY = 0.18;
  let aligned = true;
  let dialTravel = 0;
  let dialStart = 0;
  let lastStatus = "";
  let textureReady = false;
  let textureDimensions = null;

  const visual = {
    explode: 0,
    lightX,
    lightY,
  };

  const clamp = THREE.MathUtils.clamp;
  const damp = THREE.MathUtils.damp;
  const lerp = THREE.MathUtils.lerp;
  const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;

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

  const kitMaterial = (color, roughness = 0.62, metalness = 0) => (
    typeof kit.material === "function"
      ? kit.material(color, roughness, metalness)
      : ownMaterial({ color, roughness, metalness })
  );

  function resolveKitMaterial(value, color, roughness, metalness) {
    if (value && value.isMaterial) return value;
    return kitMaterial(color, roughness, metalness);
  }

  const materials = {
    porcelain: kitMaterial(0xe5dfd3, 0.46, 0.02),
    porcelainShadow: kitMaterial(0xa9a49b, 0.58, 0.02),
    paper: kitMaterial(0xdfd4c1, 0.94, 0),
    ink: kitMaterial(0x17211f, 0.34, 0.12),
    blackLacquer: kitMaterial(0x211b17, 0.34, 0.12),
    walnut: resolveKitMaterial(kit.walnut, 0x3c2b21, 0.7, 0),
    copper: kitMaterial(0x9b7047, 0.32, 0.68),
    verdigris: kitMaterial(0x66736c, 0.48, 0.24),
    brass: resolveKitMaterial(kit.brass, 0xa78150, 0.35, 0.62),
    glass: ownMaterial({
      color: 0xa9cfc5,
      roughness: 0.1,
      metalness: 0.04,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    ghost: ownBasic({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    alignment: ownBasic({
      color: 0x7bcdbd,
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
      bevelSize: Math.min(corner * 0.25, 0.035),
      bevelThickness: Math.min(depth * 0.18, 0.035),
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

  function lathe(profile, material, parent, position = [0, 0, 0], segments = 48) {
    if (kit.sculpt && typeof kit.sculpt.lathe === "function") {
      return kit.sculpt.lathe(profile, material, parent, position, segments);
    }
    const points = profile.map((point) => new THREE.Vector2(point[0], point[1]));
    return addMesh(ownGeometry(new THREE.LatheGeometry(points, segments)), material, parent, position);
  }

  function tube(points, radius, material, parent, segments = 64, sides = 8, closed = false) {
    if (kit.sculpt && typeof kit.sculpt.tube === "function") {
      return kit.sculpt.tube(points, radius, material, parent, segments, sides);
    }
    const vectors = points.map((point) => (
      point && point.isVector3 ? point.clone() : new THREE.Vector3(...point)
    ));
    const curve = new THREE.CatmullRomCurve3(vectors, closed);
    return addMesh(
      ownGeometry(new THREE.TubeGeometry(curve, segments, radius, sides, closed)),
      material,
      parent,
    );
  }

  function ring(radiusValue, tubeRadius, material, parent, position = [0, 0, 0], arc = Math.PI * 2) {
    if (kit.sculpt && typeof kit.sculpt.ring === "function") {
      return kit.sculpt.ring(radiusValue, tubeRadius, material, parent, position, arc);
    }
    return addMesh(
      ownGeometry(new THREE.TorusGeometry(radiusValue, tubeRadius, 8, 64, arc)),
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
    const count = Math.max(12, teeth * 4);
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * Math.PI * 2;
      const radiusAt = radiusValue * (index % 4 < 2 ? 1 : 0.83);
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

  const placeholderTexture = createCanvasTexture(512, 512, (context, canvas) => {
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#d7d0c0");
    gradient.addColorStop(0.52, "#7ba69a");
    gradient.addColorStop(1, "#3e5b55");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(246,241,227,.65)";
    context.lineWidth = 5;
    for (let index = 0; index < 8; index += 1) {
      context.beginPath();
      context.arc(canvas.width / 2, canvas.height / 2, 40 + index * 27, 0.2, Math.PI * 1.5);
      context.stroke();
    }
  });

  function textureForItem(item) {
    if (item && typeof kit.texture === "function") {
      const texture = kit.texture(item.fullImage || item.image || item.original);
      if (texture) return texture;
    }
    return placeholderTexture;
  }

  function independentTextureSource(data) {
    if (THREE.TextureSource) return new THREE.TextureSource(data);
    return new THREE.Source(data);
  }

  function textureDataInfo(base) {
    const data = base?.source?.data ?? base?.image ?? null;
    const width = Number(data?.naturalWidth || data?.videoWidth || data?.width || data?.image?.width || 0);
    const height = Number(data?.naturalHeight || data?.videoHeight || data?.height || data?.image?.height || 0);
    const isOwnPlaceholder = !base || base === placeholderTexture || data === placeholderTexture?.image;
    return {
      data,
      width,
      height,
      ready: !isOwnPlaceholder && Boolean(data) && width > 16 && height > 16,
      version: Number(base?.source?.version ?? base?.version ?? 0),
    };
  }

  function updateArtworkTextureSources() {
    const item = currentItem();
    if (!item) {
      textureReady = false;
      textureDimensions = null;
      return null;
    }
    const base = textureForItem(item);
    const info = textureDataInfo(base);
    let readyPieces = 0;
    pieces.forEach((piece) => {
      const map = piece.texture;
      map.offset.set(piece.column / cols, piece.row / rows);
      map.repeat.set(1 / cols, 1 / rows);
      map.colorSpace = base?.colorSpace || THREE.SRGBColorSpace;
      map.channel = base?.channel ?? 0;
      map.flipY = base?.flipY ?? true;
      if (info.ready) {
        const sourceVersion = `${item.id || selected}:${info.width}x${info.height}`;
        if (map.source?.data !== info.data || map.userData.sourceVersion !== sourceVersion) {
          // The placeholder was already uploaded using immutable WebGL storage.
          // Retire that allocation before replacing its dimensions and Source.
          map.dispose();
          // Cropping belongs to each texture's UV transform. The decoded image
          // and its GPU allocation can be shared by all 24 fragments.
          map.source = base.source;
          map.userData.sourceVersion = sourceVersion;
          map.userData.assetState = "loaded";
          map.needsUpdate = true;
          piece.material.needsUpdate = true;
        }
        if (map.source?.data === info.data) readyPieces += 1;
      } else if (map.userData.assetState !== "placeholder") {
        map.dispose();
        map.source = independentTextureSource(placeholderTexture.image);
        map.userData.sourceVersion = "placeholder";
        map.userData.assetState = "placeholder";
        map.needsUpdate = true;
        piece.material.needsUpdate = true;
      }
    });
    textureReady = info.ready && readyPieces === pieces.length;
    textureDimensions = textureReady ? { width: info.width, height: info.height } : null;
    return base;
  }

  function transparentHit(width, height, depth, id, parent, position) {
    let geometry;
    if (height > 0) geometry = ownGeometry(new THREE.PlaneGeometry(width, height));
    else if (depth > 0) geometry = ownGeometry(new THREE.BoxGeometry(width, height, depth));
    else geometry = ownGeometry(new THREE.SphereGeometry(width, 18, 12));
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
    return artworks[selected] || null;
  }

  function reducedMotion() {
    return Boolean(kit.reducedMotion?.());
  }

  const artworkDimensions = {
    "starry-night": [92.1, 73.7],
    "pearl-earring": [39, 44.5],
    "mona-lisa": [53, 77],
    "water-lilies": [94.1, 89.9],
    "the-kiss": [180, 180],
    "birth-of-venus": [278.5, 172.5],
    "impression-sunrise": [63, 48],
    "la-grande-jatte": [308.1, 207.6],
    "the-scream": [73.5, 91],
    "las-meninas": [276, 318],
    "night-watch": [453.5, 379.5],
    "bedroom-arles": [91.3, 72.4],
  };
  const measuredAspects = new Map();
  let imageAspect = artworkDimensions["starry-night"][0] / artworkDimensions["starry-night"][1];
  let aspectSource = "metadata";

  function metadataAspect(item) {
    const dimensions = artworkDimensions[item?.id];
    if (!dimensions) return 1;
    return dimensions[0] / dimensions[1];
  }

  function requestNaturalAspect(item) {
    if (!item || typeof Image === "undefined") return;
    const source = item.fullImage || item.image || item.original;
    const url = kit.assetURL?.(source) || source;
    if (!url) return;
    if (measuredAspects.has(url)) {
      const measured = measuredAspects.get(url);
      if (currentItem()?.id === item.id) applyArtworkAspect(measured.ratio, "natural");
      return;
    }
    const image = new Image();
    image.decoding = "async";
    let applied = false;
    const applyLoadedImage = () => {
      if (applied) return;
      if (!image.naturalWidth || !image.naturalHeight) return;
      applied = true;
      const ratio = image.naturalWidth / image.naturalHeight;
      measuredAspects.set(url, { ratio, width: image.naturalWidth, height: image.naturalHeight });
      if (currentItem()?.id === item.id) {
        applyArtworkAspect(ratio, "natural");
        invalidate();
      }
    };
    image.onload = applyLoadedImage;
    image.src = url;
    if (image.complete) applyLoadedImage();
  }

  // The painting rests on one low stone deck and a walnut shadow line.
  const foundation = new THREE.Group();
  foundation.name = "painting-timber-and-stone-plinth";
  foundation.position.y = 0.12;
  group.add(foundation);
  rounded(6.4, 0.28, 1.9, materials.walnut, foundation, [0, 0.16, 0], 0.12);
  rounded(5.65, 0.38, 1.4, materials.porcelainShadow, foundation, [0, 0.46, 0.08], 0.12);

  const counterweight = lathe([
    [0, 0],
    [0.72, 0.08],
    [0.8, 0.22],
    [0.62, 0.42],
    [0, 0.48],
  ], materials.blackLacquer, foundation, [0, 0.48, -0.38], 40);
  counterweight.scale.set(2.1, 0.7, 0.78);
  const coreGem = addMesh(
    ownGeometry(new THREE.IcosahedronGeometry(0.11, 2)),
    materials.verdigris,
    foundation,
    [0, 0.96, -0.38],
  );

  const tripod = new THREE.Group();
  tripod.name = "low-cantilever-supports";
  group.add(tripod);
  for (const side of [-1, 1]) {
    tube([
      [side * 2.14, 0.5, -0.22],
      [side * 1.55, 2.1, -0.52],
      [side * 0.5, 3.32, -0.76],
    ], 0.065, materials.walnut, tripod, 32, 8);
    rounded(0.42, 0.16, 0.28, materials.copper, tripod, [side * 0.82, 3.23, -0.64], 0.05);
  }

  const artworkRig = new THREE.Group();
  artworkRig.name = "deconstructed-painting-gimbal";
  artworkRig.position.set(0, 4.03, 0);
  group.add(artworkRig);
  const initialAspect = metadataAspect(artworks[0]);
  let paintingWidth = Math.min(5.1, 5.15 * initialAspect);
  let paintingHeight = paintingWidth / initialAspect;
  const cols = 6;
  const rows = 4;

  const backing = rounded(1, 1, 0.08, materials.blackLacquer, artworkRig, [0, 0, -0.46], 0.025);
  const backingInset = rounded(1, 1, 0.045, materials.paper, artworkRig, [0, 0, -0.395], 0.015);
  backingInset.receiveShadow = true;

  const gridJitter = [];
  for (let row = 0; row <= rows; row += 1) {
    const line = [];
    for (let column = 0; column <= cols; column += 1) {
      line.push({
        x: column > 0 && column < cols ? Math.sin(row * 1.71 + column * 2.11) * 0.018 : 0,
        y: row > 0 && row < rows ? Math.cos(row * 2.17 + column * 1.37) * 0.018 : 0,
      });
    }
    gridJitter.push(line);
  }

  function buildGridPoints() {
    const points = [];
    for (let row = 0; row <= rows; row += 1) {
      const line = [];
      for (let column = 0; column <= cols; column += 1) {
        line.push(new THREE.Vector2(
          (column / cols - 0.5) * paintingWidth + gridJitter[row][column].x,
          (row / rows - 0.5) * paintingHeight + gridJitter[row][column].y,
        ));
      }
      points.push(line);
    }
    return points;
  }
  const gridPoints = buildGridPoints();

  function polygonGeometry(corners) {
    const geometry = ownGeometry(new THREE.BufferGeometry());
    const positions = [];
    corners.forEach((point) => positions.push(point.x, point.y, 0));
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute([
      0, 0,
      1, 0,
      1, 1,
      0, 1,
    ], 2));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function updatePolygonGeometry(geometry, corners) {
    const positions = geometry.attributes.position;
    corners.forEach((point, index) => positions.setXYZ(index, point.x, point.y, 0));
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  const pieces = [];
  const alignmentPins = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < cols; column += 1) {
      const corners = [
        gridPoints[row][column],
        gridPoints[row][column + 1],
        gridPoints[row + 1][column + 1],
        gridPoints[row + 1][column],
      ];
      const center = corners.reduce((sum, point) => sum.add(point), new THREE.Vector2()).multiplyScalar(0.25);
      const localCorners = corners.map((point) => point.clone().sub(center));
      const geometry = polygonGeometry(localCorners);
      const texture = new THREE.Texture(placeholderTexture.image);
      texture.name = `painting-fragment-texture-${String(row * cols + column + 1).padStart(2, "0")}`;
      texture.offset.set(column / cols, row / rows);
      texture.repeat.set(1 / cols, 1 / rows);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 4;
      texture.userData.assetState = "placeholder";
      texture.userData.sourceVersion = "placeholder";
      texture.needsUpdate = true;
      ownedTextures.add(texture);
      const material = ownMaterial({
        map: texture,
        color: 0xffffff,
        roughness: 0.72,
        metalness: 0.015,
        side: THREE.DoubleSide,
      });
      const root = new THREE.Group();
      root.name = `painting-fragment-${String(row * cols + column + 1).padStart(2, "0")}`;
      root.position.set(center.x, center.y, 0.015);
      artworkRig.add(root);
      const front = new THREE.Mesh(geometry, material);
      front.castShadow = true;
      front.receiveShadow = true;
      front.position.z = 0.018;
      root.add(front);
      const back = new THREE.Mesh(geometry, materials.blackLacquer);
      back.position.z = -0.035;
      back.castShadow = true;
      back.receiveShadow = true;
      root.add(back);
      const edgeGeometry = ownGeometry(new THREE.BufferGeometry().setFromPoints([
          ...localCorners.map((point) => new THREE.Vector3(point.x, point.y, 0.043)),
        ]));
      const edge = new THREE.LineLoop(
        edgeGeometry,
        new THREE.LineBasicMaterial({ color: 0x9c7948, transparent: true, opacity: 0.72 }),
      );
      ownedMaterials.add(edge.material);
      root.add(edge);
      const index = row * cols + column;
      const layer = index % 4;
      pieces.push({
        root,
        front,
        back,
        geometry,
        edge,
        edgeGeometry,
        material,
        texture,
        row,
        column,
        layer,
        baseX: center.x,
        baseY: center.y,
        baseZ: 0.015,
        directionX: (column - (cols - 1) / 2) * 0.36 + Math.sin(index * 1.91) * 0.16,
        directionY: (row - (rows - 1) / 2) * 0.31 + Math.cos(index * 1.37) * 0.13,
        directionZ: 0.48 + layer * 0.46,
        rotationX: (row - 1.5) * 0.2 + Math.sin(index * 0.93) * 0.08,
        rotationY: (column - 2.5) * 0.105,
        rotationZ: Math.sin(index * 2.73) * 0.17,
      });
      alignmentPins.push({
        position: [center.x, center.y, -0.13],
        rotation: [Math.PI / 2, 0, index * 0.39],
        scale: 0.42,
      });
    }
  }
  const alignmentField = instances(
    ownGeometry(new THREE.TorusGeometry(0.085, 0.014, 5, 16)),
    materials.alignment,
    alignmentPins,
    artworkRig,
  );
  alignmentField.castShadow = false;
  alignmentField.renderOrder = 2;

  function applyWorkTextures(refreshPlaque = true) {
    const base = updateArtworkTextureSources();
    if (!base) return;
    if (refreshPlaque) updateCataloguePlaque();
  }

  const cataloguePlateMaterial = ownBasic({
    map: createCanvasTexture(1024, 192, (context, canvas) => {
      context.fillStyle = "#eee6d5";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#263d37";
      context.font = "500 42px \"Songti SC\", \"Times New Roman\", serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("空间画轮 · 十二幅真实作品", canvas.width / 2, canvas.height / 2);
    }),
    transparent: true,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const cataloguePlate = addMesh(
    ownGeometry(new THREE.PlaneGeometry(1.62, 0.3, 8, 2)),
    cataloguePlateMaterial,
    group,
    [0, 1.46, 1.46],
  );
  cataloguePlate.rotation.x = -0.12;

  function updateCataloguePlaque() {
    const item = currentItem();
    const texture = createCanvasTexture(1024, 192, (context, canvas) => {
      context.fillStyle = "#eee6d5";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "#9d7b48";
      context.lineWidth = 5;
      context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
      context.fillStyle = "#263d37";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = "600 39px \"Songti SC\", \"Times New Roman\", serif";
      context.fillText(
        item ? `${String(selected + 1).padStart(2, "0")} / ${String(Math.max(12, artworks.length)).padStart(2, "0")}  ${item.title}` : "空间画轮",
        canvas.width / 2,
        78,
        canvas.width - 70,
      );
      context.font = "400 25px \"Baskerville\", \"Times New Roman\", serif";
      context.fillText(
        item ? `${item.artistShort || item.artist || ""} · ${item.year || ""}` : "选择真实作品",
        canvas.width / 2,
        132,
        canvas.width - 70,
      );
    });
    const previous = cataloguePlateMaterial.map;
    cataloguePlateMaterial.map = texture;
    cataloguePlateMaterial.needsUpdate = true;
    if (previous && ownedTextures.has(previous) && previous !== placeholderTexture) {
      ownedTextures.delete(previous);
      previous.dispose();
    }
  }

  // A single shadow frame gives the assembled picture a clear boundary.
  const nestedFrames = [];
  for (let layer = 0; layer < 1; layer += 1) {
    const frame = new THREE.Group();
    frame.name = `telescoping-frame-layer-${layer + 1}`;
    frame.position.z = -0.18 - layer * 0.24;
    artworkRig.add(frame);
    const material = layer % 2 ? materials.verdigris : materials.porcelainShadow;
    const top = rounded(1, 0.075, 0.085, material, frame, [0, 0, 0], 0.025);
    const bottom = rounded(1, 0.075, 0.085, material, frame, [0, 0, 0], 0.025);
    const left = rounded(0.075, 1, 0.085, material, frame, [0, 0, 0], 0.025);
    const right = rounded(0.075, 1, 0.085, material, frame, [0, 0, 0], 0.025);
    const cornerJoints = [];
    for (const sideX of [-1, 1]) {
      for (const sideY of [-1, 1]) {
        const joint = addMesh(
          ownGeometry(new THREE.IcosahedronGeometry(0.07, 1)),
          layer % 2 ? materials.copper : materials.porcelain,
          frame,
        );
        joint.userData.sideX = sideX;
        joint.userData.sideY = sideY;
        cornerJoints.push(joint);
      }
    }
    nestedFrames.push({ frame, layer, baseZ: -0.18 - layer * 0.24, top, bottom, left, right, cornerJoints });
  }

  const ornamentPlacements = [];
  for (let index = 0; index < 24; index += 1) {
    const perimeter = index % 4;
    const progress = ((index * 0.61803398875) % 1) - 0.5;
    let x;
    let y;
    if (perimeter < 2) {
      x = progress * 4.2;
      y = (perimeter === 0 ? 1 : -1) * 2.88;
    } else {
      x = (perimeter === 2 ? -1 : 1) * 2.1;
      y = progress * 5.62;
    }
    ornamentPlacements.push({
      position: [x, y, 0.16],
      rotation: [Math.PI / 2, index * 0.27, index * 0.13],
      scale: 0.7 + (index % 4) * 0.1,
    });
  }
  const frameOrnaments = instances(
    ownGeometry(new THREE.OctahedronGeometry(0.055, 0)),
    materials.brass,
    ornamentPlacements,
    artworkRig,
  );
  frameOrnaments.name = "instanced-carved-frame-studs";

  const frameRails = [];
  function createFrameRail(name, axis, openX, openY, rotation) {
    const rail = new THREE.Group();
    rail.name = name;
    artworkRig.add(rail);
    const vertical = axis === "vertical";
    const bar = rounded(vertical ? 0.25 : 1, vertical ? 1 : 0.28, 0.22, materials.walnut, rail, [0, 0, 0], 0.055);
    const copperInlay = rounded(vertical ? 0.22 : 0.92, vertical ? 0.92 : 0.15, 0.28, materials.copper, rail, [0, 0, 0.025], 0.035);
    const porcelainInlay = rounded(vertical ? 0.15 : 0.74, vertical ? 0.74 : 0.07, 0.3, materials.porcelain, rail, [0, 0, 0.045], 0.022);
    const rosettes = [];
    frameRails.push({
      rail,
      bar,
      copperInlay,
      porcelainInlay,
      rosettes,
      axis,
      closed: new THREE.Vector3(),
      open: new THREE.Vector3(),
      openOffset: new THREE.Vector3(openX, openY, 0),
      rotation,
    });
    return rail;
  }
  createFrameRail("frame-left", "vertical", -0.78, 0.08, 0.1);
  createFrameRail("frame-right", "vertical", 0.78, -0.1, -0.12);
  createFrameRail("frame-top", "horizontal", 0.04, 0.7, -0.08);
  createFrameRail("frame-bottom", "horizontal", -0.04, -0.66, 0.09);

  // Only four recessed timber hinges remain, keeping the assembled picture quiet.
  const hingeRows = [];
  for (let row = 0; row < rows; row += 1) {
    const rowGroup = new THREE.Group();
    rowGroup.name = `recessed-timber-hinge-${row + 1}`;
    artworkRig.add(rowGroup);
    const shaft = rounded(1, 0.045, 0.055, materials.walnut, rowGroup);
    shaft.name = `hinge-row-${row + 1}-contained-shaft`;
    const endCaps = [];
    for (const side of [-1, 1]) {
      const endCap = rounded(0.16, 0.16, 0.12, materials.copper, rowGroup, [0, 0, 0.03], 0.035);
      endCap.name = `hinge-row-${row + 1}-${side < 0 ? "left" : "right"}-axle-cap`;
      endCap.userData.side = side;
      endCaps.push(endCap);
    }
    hingeRows.push({ rowGroup, shaft, rib: null, endCaps });
  }

  const sideMechanisms = [];

  // During deconstruction one restrained shadow frame steps behind the slices.
  const escapeFrames = [];
  [{ material: materials.blackLacquer, scale: 1.08, side: 0, lift: 0.2 }].forEach((spec, index) => {
    const frame = new THREE.Group();
    frame.name = `reverse-floating-frame-${index + 1}`;
    artworkRig.add(frame);
    const top = rounded(1, 0.05, 0.07, spec.material, frame, [0, 0, 0], 0.018);
    const bottom = rounded(1, 0.05, 0.07, spec.material, frame, [0, 0, 0], 0.018);
    const left = rounded(0.05, 1, 0.07, spec.material, frame, [0, 0, 0], 0.018);
    const right = rounded(0.05, 1, 0.07, spec.material, frame, [0, 0, 0], 0.018);
    const cornerJoints = [];
    for (const sideX of [-1, 1]) {
      for (const sideY of [-1, 1]) {
        const joint = addMesh(
          ownGeometry(new THREE.IcosahedronGeometry(0.085, 1)),
          index === 1 ? materials.copper : materials.porcelain,
          frame,
        );
        joint.userData.sideX = sideX;
        joint.userData.sideY = sideY;
        cornerJoints.push(joint);
      }
    }
    escapeFrames.push({ frame, top, bottom, left, right, cornerJoints, ...spec, index });
  });

  const foldingFins = [];

  // A single brass arc marks the moving light without competing with the picture.
  const skylight = new THREE.Group();
  skylight.name = "light-arc";
  skylight.position.set(0, 6.22, -0.64);
  group.add(skylight);
  const skylightRibs = [];
  const lightArc = ring(2.78, 0.025, materials.copper, skylight, [0, 0, 0], Math.PI * 1.18);
  lightArc.rotation.x = Math.PI / 2;
  lightArc.rotation.z = 0.18;
  skylightRibs.push(lightArc);

  const louvers = new THREE.Group();
  louvers.name = "retired-louver-guides";
  louvers.position.set(0, 0, 0);
  louvers.visible = false;
  group.add(louvers);
  const louverSlats = [];

  const lightTrackGroup = new THREE.Group();
  lightTrackGroup.name = "outer-frame-light-orbit";
  group.add(lightTrackGroup);
  const lightTrack = addMesh(
    ownGeometry(new THREE.BufferGeometry()),
    materials.verdigris,
    lightTrackGroup,
  );
  lightTrack.name = "physical-light-track";
  lightTrack.castShadow = false;
  let lightRouteCurve = null;
  const lightTrackCaps = [];
  for (const side of [-1, 1]) {
    const cap = lathe([
      [0, -0.09],
      [0.09, -0.045],
      [0.12, 0.04],
      [0.075, 0.1],
      [0, 0.12],
    ], materials.copper, lightTrackGroup, [0, 0, 0], 20);
    cap.rotation.x = Math.PI / 2;
    lightTrackCaps.push({ cap, side });
  }
  const lightTrackCollars = [];
  for (let index = 0; index < 3; index += 1) {
    const collar = ring(0.095, 0.018, materials.porcelain, lightTrackGroup, [0, 0, 0]);
    collar.rotation.y = Math.PI / 2;
    lightTrackCollars.push({ collar, index });
  }

  const lightCarrier = new THREE.Group();
  lightCarrier.name = "movable-light-orb";
  group.add(lightCarrier);
  const orbMaterial = ownMaterial({
    color: 0xffe2b0,
    emissive: 0xffb55c,
    emissiveIntensity: 2.2,
    roughness: 0.18,
    metalness: 0,
  });
  const lightOrb = addMesh(
    ownGeometry(new THREE.IcosahedronGeometry(0.2, 3)),
    orbMaterial,
    lightCarrier,
  );
  lightOrb.castShadow = false;
  const orbHalo = ring(0.31, 0.026, materials.copper, lightCarrier);
  orbHalo.rotation.x = Math.PI / 2;
  const orbHaloTwo = ring(0.25, 0.018, materials.verdigris, lightCarrier);
  orbHaloTwo.rotation.y = Math.PI / 2;
  for (let index = 0; index < 6; index += 1) {
    const angle = index / 6 * Math.PI * 2;
    const fin = rounded(0.035, 0.24, 0.055, materials.copper, lightCarrier, [
      Math.cos(angle) * 0.31,
      Math.sin(angle) * 0.31,
      0,
    ], 0.01);
    fin.rotation.z = angle - Math.PI / 2;
  }

  const spotLight = new THREE.SpotLight(0xffe2b8, 72, 20, Math.PI / 6.2, 0.46, 1.28);
  spotLight.name = "painting-moving-spotlight";
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.set(1024, 1024);
  spotLight.shadow.bias = -0.00018;
  spotLight.shadow.normalBias = 0.025;
  group.add(spotLight);
  const lightTarget = new THREE.Object3D();
  lightTarget.position.set(0, 4.05, 0);
  group.add(lightTarget);
  spotLight.target = lightTarget;
  const fillLight = new THREE.PointLight(0x89c7b8, 1.4, 8, 2);
  fillLight.position.set(-1.8, 3.6, 2.1);
  group.add(fillLight);

  const lightBeams = [];
  for (let index = 0; index < 4; index += 1) {
    const geometry = ownGeometry(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color: index % 2 ? 0xa7d5c9 : 0xd8ae70,
        transparent: true,
        opacity: 0.24,
      }),
    );
    ownedMaterials.add(line.material);
    group.add(line);
    lightBeams.push({ line, geometry });
  }

  const lightHit = transparentHit(1.04, 1.04, 0, "light-orb", lightCarrier, [0, 0, 0.38]);
  register(lightHit, {
    id: "light-orb",
    label: "实体光球",
    hint: "拖动铜灯，实际移动聚光灯与光轨",
    anchor: [0, 0, 0.38],
    onDown() {
      status("实体光球与聚光灯制动解除");
    },
    onDrag({ dx, dy }) {
      lightX = clamp(lightX + dx * 0.0085, -1, 1);
      lightY = clamp(lightY - dy * 0.0085, -1, 1);
      status(`天光方位 ${lightX >= 0 ? "东" : "西"}${Math.abs(lightX * 100).toFixed(0)} · 高度 ${lightY >= 0 ? "+" : ""}${(lightY * 100).toFixed(0)}%`);
      applyLight();
      invalidate();
    },
    onUp() {
      status("实体光球锁定，聚光灯与光轨保持新的位置");
    },
    onClick() {
      lightX = lightX > 0.55 ? -0.72 : 0.72;
      lightY = clamp(lightY + 0.18, -1, 1);
      applyLight();
      status("实体光球跨过画心，聚光灯扫向另一侧");
      invalidate();
    },
    onKey(key) {
      if (key === "ArrowLeft" || key === "ArrowRight") {
        lightX = clamp(lightX + (key === "ArrowLeft" ? -0.08 : 0.08), -1, 1);
      }
      if (key === "ArrowUp" || key === "ArrowDown") {
        lightY = clamp(lightY + (key === "ArrowUp" ? 0.08 : -0.08), -1, 1);
      }
      applyLight();
      invalidate();
    },
  });

  const deconstructRig = new THREE.Group();
  deconstructRig.name = "deconstruction-control";
  deconstructRig.position.set(-3.05, 2.42, 1.92);
  group.add(deconstructRig);
  const deconstructRotor = new THREE.Group();
  deconstructRotor.name = "indexed-deconstruction-rotor";
  deconstructRig.add(deconstructRotor);
  const deconstructBack = lathe([
    [0, -0.08],
    [0.48, -0.05],
    [0.56, 0.04],
    [0.47, 0.13],
    [0, 0.15],
  ], materials.blackLacquer, deconstructRig, [0, 0, -0.04], 40);
  deconstructBack.rotation.x = Math.PI / 2;
  const deconstructRing = ring(0.44, 0.042, materials.copper, deconstructRotor, [0, 0, 0.08]);
  const deconstructGear = lathe([
    [0, -0.08],
    [0.31, -0.06],
    [0.35, 0.02],
    [0.28, 0.1],
    [0, 0.12],
  ], materials.verdigris, deconstructRotor, [0, 0, 0.02], 36);
  deconstructGear.rotation.x = Math.PI / 2;
  const deconstructTicks = [];
  for (let index = 0; index < 4; index += 1) {
    const angle = index / 4 * Math.PI * 2;
    const tick = rounded(0.028, 0.16, 0.04, materials.brass, deconstructRotor, [
      Math.cos(angle) * 0.56,
      Math.sin(angle) * 0.56,
      0.08,
    ], 0.008);
    tick.rotation.z = angle - Math.PI / 2;
    deconstructTicks.push(tick);
  }
  const deconstructArm = rounded(0.68, 0.085, 0.1, materials.blackLacquer, deconstructRotor, [0.28, 0.02, 0.17], 0.025);
  deconstructArm.rotation.z = -0.12;
  const deconstructGripAssembly = new THREE.Group();
  deconstructGripAssembly.position.set(0.62, 0.1, 0.2);
  deconstructGripAssembly.rotation.z = -0.08;
  deconstructRotor.add(deconstructGripAssembly);
  const deconstructGrip = addMesh(
    ownGeometry(new THREE.CylinderGeometry(0.1, 0.13, 0.44, 18, 3)),
    materials.porcelain,
    deconstructGripAssembly,
  );
  deconstructGrip.rotation.z = 0.08;
  for (const y of [-0.23, 0.23]) {
    const cap = addMesh(
      ownGeometry(new THREE.SphereGeometry(0.12, 16, 10)),
      materials.copper,
      deconstructGripAssembly,
      [0, y, 0],
    );
    cap.castShadow = true;
  }
  for (const y of [-0.12, 0.12]) {
    const collar = ring(0.115, 0.014, materials.verdigris, deconstructGripAssembly, [0, y, 0]);
    collar.rotation.x = Math.PI / 2;
  }
  const deconstructCap = lathe([
    [0, -0.13],
    [0.16, -0.08],
    [0.21, 0.04],
    [0.14, 0.13],
    [0, 0.15],
  ], materials.copper, deconstructRotor, [0, 0, 0.18], 28);
  deconstructCap.rotation.x = Math.PI / 2;
  const deconstructHit = transparentHit(1.34, 1.34, 0, "deconstruct", deconstructRig, [0, 0, 0.46]);
  register(deconstructHit, {
    id: "deconstruct",
    label: "维度解构柄",
    hint: "向上或向右拖动，二十四片画面连续爆开；向下归零则精准重组",
    anchor: [0, 0, 0.46],
    onDown() {
      status("解构柄已接入画面铰链");
    },
    onDrag({ dx, dy }) {
      explode = clamp(explode + dx * 0.0042 - dy * 0.0048, 0, 1);
      status(`画面解构 ${Math.round(explode * 100)}% · ${explode < 0.015 ? "已精准对齐" : `${(explode * 100).toFixed(0)}% 空间位移`}`);
      if (reducedMotion()) visual.explode = explode;
      applyExplosion();
      invalidate();
    },
    onUp() {
      if (explode < 0.09) explode = 0;
      if (explode > 0.91) explode = 1;
      status(explode === 0 ? "二十四块画面已精准重组" : `解构停在 ${Math.round(explode * 100)}%`);
    },
    onClick() {
      explode = explode > 0.12 ? 0 : 1;
      if (reducedMotion()) visual.explode = explode;
      applyExplosion();
      status(explode === 0 ? "画框合拢，二十四个 UV 拼片精准重合" : "画框沿多级铰链完全展开");
      invalidate();
    },
    onKey(key) {
      if (key === "ArrowUp" || key === "ArrowRight") explode = clamp(explode + 0.12, 0, 1);
      if (key === "ArrowDown" || key === "ArrowLeft") explode = clamp(explode - 0.12, 0, 1);
      if (key === "Enter" || key === " ") explode = explode > 0.1 ? 0 : 1;
      if (reducedMotion()) visual.explode = explode;
      applyExplosion();
      invalidate();
    },
  });

  const dial = new THREE.Group();
  dial.name = "painting-catalogue-wheel";
  dial.position.set(2.85, 1.82, 1.72);
  group.add(dial);
  const dialBack = lathe([
    [0, -0.08],
    [0.58, -0.03],
    [0.7, 0.08],
    [0.58, 0.2],
    [0, 0.23],
  ], materials.blackLacquer, dial, [0, 0, 0], 48);
  dialBack.rotation.x = Math.PI / 2;
  const dialRing = ring(0.62, 0.045, materials.brass, dial, [0, 0, 0.13]);
  const dialInner = ring(0.47, 0.022, materials.verdigris, dial, [0, 0, 0.17], Math.PI * 1.72);
  const dialGear = lathe([
    [0, -0.06],
    [0.3, -0.045],
    [0.34, 0.02],
    [0.25, 0.08],
    [0, 0.1],
  ], materials.copper, dial, [0, 0, 0.19], 32);
  dialGear.rotation.x = Math.PI / 2;
  const dialMarkers = [];
  for (let index = 0; index < 3; index += 1) {
    const angle = index / 3 * Math.PI * 2 - Math.PI / 2;
    const marker = ring(0.032, 0.008, materials.porcelain, dial, [
      Math.cos(angle) * 0.52,
      Math.sin(angle) * 0.52,
      0.18,
    ]);
    dialMarkers.push({ marker, angle });
  }
  const dialHit = transparentHit(1.42, 1.42, 0, "catalogue", dial, [0, 0, 0.34]);
  register(dialHit, {
    id: "catalogue",
    label: "画框画轮",
    hint: "左右拖动切换十二幅真实画作，所有二十四块拼片同步换图",
    anchor: [0, 0, 0.34],
    onDown() {
      dialStart = selected;
      dialTravel = 0;
      status("画轮已解锁");
    },
    onDrag({ dx }) {
      dialTravel += dx;
      const steps = Math.trunc(dialTravel / 46);
      setArtwork(dialStart + steps, false);
      dialInner.rotation.z += dx * 0.006;
      dialGear.rotation.z -= dx * 0.01;
      status(`画轮 ${String(selected + 1).padStart(2, "0")} / ${String(Math.max(12, artworks.length)).padStart(2, "0")} · 《${currentItem()?.title || "作品"}》`);
      invalidate();
    },
    onUp() {
      dialTravel = 0;
      status(`已切换到《${currentItem()?.title || "作品"}》`);
    },
    onClick() {
      setArtwork(selected + 1, false);
      status(`画轮转到《${currentItem()?.title || "作品"}》`);
      invalidate();
    },
    onKey(key) {
      if (key === "ArrowLeft") setArtwork(selected - 1, false);
      if (key === "ArrowRight") setArtwork(selected + 1, false);
      invalidate();
    },
  });

  const completePaintingHit = transparentHit(1, 1, 0, "complete-painting", artworkRig, [0, 0, 0.18]);
  register(completePaintingHit, {
    id: "complete-painting",
    label: "重合后的完整画作",
    hint: "仅当二十四块拼片精准归零时，点击画面打开馆藏详情",
    anchor: [0, 0, 0.18],
    onClick() {
      if (explode > 0.009 || visual.explode > 0.018) {
        status(`画面仍有约 ${Math.max(1, Math.round(visual.explode * 100))}% 位移，先归零解构柄`);
        return;
      }
      status(`完整画面已重合，正在打开《${currentItem()?.title || "画作"}》`);
      if (typeof kit.onSelect === "function") kit.onSelect("paintings", selected);
    },
  });

  function writeInstancePlacements(mesh, placements) {
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
    mesh.computeBoundingSphere();
  }

  function lightRoutePoints() {
    const centerY = 4.03;
    const top = centerY + paintingHeight / 2;
    return [
      new THREE.Vector3(-paintingWidth / 2 - 0.38, top + 0.38, 1.92),
      new THREE.Vector3(-paintingWidth * 0.24, top + 0.62, 2.02),
      new THREE.Vector3(0, top + 0.68, 2.08),
      new THREE.Vector3(paintingWidth * 0.24, top + 0.62, 2.02),
      new THREE.Vector3(paintingWidth / 2 + 0.38, top + 0.38, 1.92),
    ];
  }

  function updateLightTrackLayout() {
    const points = lightRoutePoints();
    lightRouteCurve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    const previousGeometry = lightTrack.geometry;
    lightTrack.geometry = ownGeometry(new THREE.TubeGeometry(lightRouteCurve, 96, 0.035, 7, false));
    if (previousGeometry && ownedGeometries.has(previousGeometry)) {
      ownedGeometries.delete(previousGeometry);
      previousGeometry.dispose();
    }
    lightTrackCaps.forEach(({ cap, side }) => {
      cap.position.copy(points[side < 0 ? 0 : points.length - 1]);
    });
    lightTrackCollars.forEach(({ collar, index }) => {
      const t = 0.18 + index * 0.32;
      const point = lightRouteCurve.getPoint(t);
      const tangent = lightRouteCurve.getTangent(t).normalize();
      collar.position.copy(point);
      collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    });
  }

  function applyArtworkLayout() {
    backing.scale.set(paintingWidth + 0.3, paintingHeight + 0.3, 1);
    backingInset.scale.set(paintingWidth + 0.14, paintingHeight + 0.14, 1);
    completePaintingHit.scale.set(paintingWidth, paintingHeight, 1);

    const points = buildGridPoints();
    pieces.forEach((piece, index) => {
      const corners = [
        points[piece.row][piece.column],
        points[piece.row][piece.column + 1],
        points[piece.row + 1][piece.column + 1],
        points[piece.row + 1][piece.column],
      ];
      const center = corners.reduce((sum, point) => sum.add(point), new THREE.Vector2()).multiplyScalar(0.25);
      const localCorners = corners.map((point) => point.clone().sub(center));
      updatePolygonGeometry(piece.geometry, localCorners);
      const edgePositions = piece.edgeGeometry.attributes.position;
      localCorners.forEach((point, pointIndex) => edgePositions.setXYZ(pointIndex, point.x, point.y, 0.043));
      edgePositions.needsUpdate = true;
      piece.edgeGeometry.computeBoundingBox();
      piece.edgeGeometry.computeBoundingSphere();
      piece.baseX = center.x;
      piece.baseY = center.y;
      piece.directionX = (piece.column - (cols - 1) / 2) * (Math.max(0.2, paintingWidth / cols) * 0.5 + 0.08) + Math.sin(index * 1.91) * 0.025;
      piece.directionY = (piece.row - (rows - 1) / 2) * Math.max(0.2, paintingHeight / rows * 0.44) + Math.cos(index * 1.37) * 0.07;
      alignmentPins[index].position = [center.x, center.y, -0.13];
    });
    writeInstancePlacements(alignmentField, alignmentPins);

    nestedFrames.forEach(({ layer, frame, top, bottom, left, right, cornerJoints }) => {
      const spread = 0.12 + layer * 0.1;
      const width = paintingWidth + 0.3 + spread * 2;
      const height = paintingHeight + 0.3 + spread * 2;
      top.scale.set(width, 1.2, 1);
      bottom.scale.set(width, 1.2, 1);
      left.scale.set(1.2, height, 1);
      right.scale.set(1.2, height, 1);
      top.position.y = height / 2;
      bottom.position.y = -height / 2;
      left.position.x = -width / 2;
      right.position.x = width / 2;
      cornerJoints.forEach((joint) => {
        joint.position.set(joint.userData.sideX * width / 2, joint.userData.sideY * height / 2, 0.06);
      });
      frame.userData.layoutWidth = width;
      frame.userData.layoutHeight = height;
    });

    ornamentPlacements.forEach((placement, index) => {
      const perimeter = index % 4;
      const progress = ((index * 0.61803398875) % 1) - 0.5;
      if (perimeter < 2) {
        placement.position = [
          progress * (paintingWidth + 0.42),
          (perimeter === 0 ? 1 : -1) * (paintingHeight / 2 + 0.22),
          0.16,
        ];
      } else {
        placement.position = [
          (perimeter === 2 ? -1 : 1) * (paintingWidth / 2 + 0.2),
          progress * (paintingHeight + 0.42),
          0.16,
        ];
      }
    });
    writeInstancePlacements(frameOrnaments, ornamentPlacements);

    frameRails.forEach((entry) => {
      const vertical = entry.axis === "vertical";
      const length = (vertical ? paintingHeight : paintingWidth) + 0.72;
      if (vertical) {
        entry.bar.scale.set(1, length, 1);
        entry.copperInlay.scale.set(1, length, 1);
        entry.porcelainInlay.scale.set(1, length, 1);
        entry.closed.set(entry.rail.name === "frame-left" ? -(paintingWidth / 2 + 0.36) : paintingWidth / 2 + 0.36, 0, 0.22);
      } else {
        entry.bar.scale.set(length, 1, 1);
        entry.copperInlay.scale.set(length, 1, 1);
        entry.porcelainInlay.scale.set(length, 1, 1);
        entry.closed.set(0, entry.rail.name === "frame-top" ? paintingHeight / 2 + 0.36 : -(paintingHeight / 2 + 0.36), 0.22);
      }
      entry.open.copy(entry.closed).add(entry.openOffset);
      entry.rosettes.forEach((rosette) => {
        rosette.visible = false;
      });
    });

    hingeRows.forEach(({ rowGroup, shaft, endCaps }, row) => {
      rowGroup.position.set(0, (row - (rows - 1) / 2) * (paintingHeight / rows) * 0.92, -0.24 - row * 0.035);
      shaft.scale.set(paintingWidth + 0.58, 1, 1);
      endCaps.forEach((cap) => {
        cap.position.x = cap.userData.side * (paintingWidth / 2 + 0.24);
      });
    });

    sideMechanisms.forEach(({ mechanism, side }) => {
      mechanism.position.x = side * (paintingWidth / 2 + 0.84);
    });

    deconstructRig.position.set(-(paintingWidth / 2 + 0.58), 2.4, 1.92);
    dial.position.set(paintingWidth / 2 + 0.58, 1.88, 1.72);
    updateLightTrackLayout();

    escapeFrames.forEach((entry) => {
      const width = paintingWidth * entry.scale + 0.3;
      const height = paintingHeight * entry.scale + 0.3;
      entry.top.scale.set(width, 1, 1);
      entry.bottom.scale.set(width, 1, 1);
      entry.left.scale.set(1, height, 1);
      entry.right.scale.set(1, height, 1);
      entry.top.position.y = height / 2;
      entry.bottom.position.y = -height / 2;
      entry.left.position.x = -width / 2;
      entry.right.position.x = width / 2;
      entry.cornerJoints.forEach((joint) => {
        joint.position.set(joint.userData.sideX * width / 2, joint.userData.sideY * height / 2, 0.055);
      });
      entry.closedPosition = new THREE.Vector3(entry.side * 0.06, entry.lift * 0.12, -0.62 - entry.index * 0.18);
      entry.openPosition = new THREE.Vector3(
        entry.side * (0.5 + paintingWidth * 0.08),
        entry.lift * paintingHeight * 0.22,
        -2.05 - entry.index * 0.26,
      );
    });

    foldingFins.forEach((entry) => {
      const length = Math.max(0.82, paintingWidth * 0.42) + entry.index * 0.07;
      entry.length = length;
      entry.restY = (entry.index - 1.5) * (paintingHeight / 4.5);
      entry.blade.scale.set(length, 1, 1);
      entry.inlay.scale.set(length, 1, 1);
      entry.edge.scale.set(length, 1, 1);
      entry.blade.position.x = entry.side * length * 0.5;
      entry.inlay.position.x = entry.side * length * 0.5;
      entry.edge.position.x = entry.side * length * 0.5;
      entry.endCap.position.x = entry.side * length;
    });

    louverSlats.forEach((entry) => {
      entry.baseY = 4.03 + paintingHeight / 2 + 0.62 - entry.index * 0.13;
      entry.restY = entry.baseY;
      entry.unit.position.set(
        entry.side * (paintingWidth / 2 + 0.73),
        entry.baseY,
        -0.6 - entry.index * 0.025,
      );
      entry.slat.scale.set(1, 1, 1);
    });
  }

  function applyArtworkAspect(ratio, source = "metadata") {
    const safeRatio = clamp(Number(ratio) || metadataAspect(currentItem()), 0.45, 2.4);
    const nextHeight = Math.min(5.18, 5.1 / safeRatio);
    const nextWidth = nextHeight * safeRatio;
    if (Math.abs(nextWidth - paintingWidth) < 0.0005 && Math.abs(nextHeight - paintingHeight) < 0.0005) {
      imageAspect = safeRatio;
      aspectSource = source;
      applyArtworkLayout();
      return;
    }
    imageAspect = safeRatio;
    aspectSource = source;
    paintingWidth = nextWidth;
    paintingHeight = nextHeight;
    applyArtworkLayout();
    applyExplosion();
    applyLight();
    invalidate();
  }

  function setArtwork(index, announce = true) {
    if (!artworks.length) return;
    selected = mod(Number(index) || 0, artworks.length);
    dialMarkers.forEach(({ marker }, markerIndex) => {
      marker.scale.setScalar(markerIndex === selected ? 1.65 : 1);
    });
    applyWorkTextures();
    const item = currentItem();
    applyArtworkAspect(metadataAspect(item), "metadata");
    requestNaturalAspect(item);
    if (announce) status(`画轮选择《${currentItem()?.title || "作品"}》`);
    invalidate();
  }

  function applyExplosion() {
    const amount = reducedMotion() ? explode : visual.explode;
    pieces.forEach((piece) => {
      const stagger = 0.84 + piece.layer * 0.06;
      piece.root.position.set(
        piece.baseX + piece.directionX * amount * stagger,
        piece.baseY + piece.directionY * amount * stagger,
        piece.baseZ + piece.directionZ * amount,
      );
      piece.root.rotation.set(
        piece.rotationX * amount,
        piece.rotationY * amount,
        piece.rotationZ * amount,
      );
      piece.root.scale.setScalar(1 + 0.035 * amount * Math.sin(piece.layer + piece.column));
      piece.back.position.z = -0.035 - amount * 0.11;
      piece.edge.material.opacity = 0.1 + amount * 0.64;
    });
    frameRails.forEach((entry, index) => {
      entry.rail.position.lerpVectors(entry.closed, entry.open, amount);
      entry.rail.rotation.z = entry.rotation * amount;
      entry.rail.rotation.x = amount * (index < 2 ? Math.sin(index * 1.7) * 0.06 : Math.cos(index) * 0.08);
    });
    nestedFrames.forEach(({ frame, layer, baseZ }) => {
      frame.visible = amount > 0.015;
      frame.position.z = baseZ - amount * (0.3 + layer * 0.2);
      frame.rotation.set(0, 0, 0);
      frame.scale.setScalar(1 + amount * layer * 0.018);
    });
    hingeRows.forEach(({ rowGroup, shaft, rib }, row) => {
      rowGroup.position.z = -0.24 - row * 0.035 - amount * (0.3 + row * 0.08);
      rowGroup.rotation.x = amount * (row - 1.5) * 0.035;
      shaft.rotation.y = amount * row * 0.06;
      if (rib) rib.rotation.y = amount * (row % 2 ? -0.36 : 0.36);
    });
    sideMechanisms.forEach(({ mechanism, gimbalA, gimbalB, gimbalC, mechanismGear, side }) => {
      mechanism.position.x = side * (paintingWidth / 2 + 0.84 + amount * 0.42);
      mechanism.rotation.z = amount * side * 0.18;
      gimbalA.rotation.z = amount * side * 0.25;
      gimbalB.rotation.x = Math.PI / 2 + amount * side * 0.34;
      gimbalC.rotation.y = amount * side * 0.42;
      mechanismGear.rotation.z = amount * side * 0.74;
    });
    escapeFrames.forEach((entry) => {
      if (!entry.closedPosition || !entry.openPosition) return;
      entry.frame.visible = amount > 0.025;
      entry.frame.position.lerpVectors(entry.closedPosition, entry.openPosition, amount);
      entry.frame.rotation.set(0, 0, 0);
    });
    foldingFins.forEach((entry) => {
      entry.pivot.visible = false;
    });
    deconstructRotor.rotation.z = amount * Math.PI * 1.2;
    deconstructRing.rotation.z = amount * Math.PI * 0.24;
    deconstructGear.rotation.z = -amount * Math.PI * 0.5;
    deconstructCap.rotation.z = -amount * Math.PI * 0.14;
    materials.alignment.opacity = 0.08 + amount * 0.62;
    alignmentField.visible = amount > 0.008;
    aligned = explode === 0 && visual.explode <= 0.012;
  }

  function applyLight() {
    if (reducedMotion()) {
      visual.lightX = lightX;
      visual.lightY = lightY;
    }
    const routeT = clamp((visual.lightX + 1) / 2, 0, 1);
    const routePoint = lightRouteCurve
      ? lightRouteCurve.getPoint(routeT)
      : new THREE.Vector3(0, 4.03 + paintingHeight / 2 + 0.8, 1.2);
    const localX = routePoint.x;
    const localY = routePoint.y + visual.lightY * 0.28;
    const localZ = routePoint.z + 0.22;
    lightCarrier.position.set(localX, localY, localZ);
    lightCarrier.rotation.z = visual.lightX * 0.35;
    lightCarrier.rotation.x = visual.lightY * 0.28;
    orbHalo.rotation.z += 0.02 * (visual.lightX + 0.2);
    orbHaloTwo.rotation.y += 0.018 * (visual.lightY + 0.3);
    spotLight.position.set(localX, localY, localZ + 0.16);
    spotLight.intensity = 66 + Math.max(0, visual.lightY) * 18;
    spotLight.target.position.set(visual.lightX * paintingWidth * 0.24, 4.03 + visual.lightY * paintingHeight * 0.12, -0.08);
    spotLight.target.updateMatrixWorld();
    fillLight.position.set(-localX * 0.4, 3.5 + visual.lightY * 0.35, 1.7);
    const movement = Math.max(Math.abs(visual.lightX), Math.abs(visual.lightY - 0.18));
    const rawReach = clamp((movement - 0.12) / 0.5, 0, 1);
    const reach = rawReach * rawReach * (3 - 2 * rawReach);
    louverSlats.forEach(({ slat, index, side }) => {
      slat.position.x = side * lerp(0.22, -0.12, reach);
      slat.position.y = 0;
      slat.position.z = 0.12 + Math.sin(index * 0.7 + visual.lightX * 1.4) * 0.018 * reach;
      slat.rotation.z = reach * visual.lightX * 0.2 * ((index % 3) - 1);
      slat.rotation.x = -0.02 + reach * visual.lightY * 0.1;
    });
    lightBeams.forEach(({ geometry }, index) => {
      const targetX = (index - 1.5) * paintingWidth * 0.22;
      const targetY = 4.03 + (index % 2 ? 1 : -1) * paintingHeight * 0.23;
      const position = geometry.attributes.position;
      position.setXYZ(0, lightCarrier.position.x, lightCarrier.position.y, lightCarrier.position.z);
      position.setXYZ(1, targetX, targetY, 0.1);
      position.needsUpdate = true;
      geometry.computeBoundingSphere();
    });
  }

  function applyWorkTextureRefresh() {
    applyWorkTextures(false);
  }

  applyWorkTextures();
  setArtwork(0, false);
  applyExplosion();
  applyLight();

  function interact(action, index) {
    if (action === "select") {
      setArtwork(Number(index) || 0, false);
      status(`完整目录联动到《${currentItem()?.title || "作品"}》`);
    } else if (action === "explode") {
      explode = explode > 0.1 ? 0 : 1;
      if (reducedMotion()) visual.explode = explode;
      applyExplosion();
      status(explode === 0 ? "画框与二十四块拼片精准归零" : "画框沿关节完全解构");
    } else if (action === "align") {
      explode = 0;
      if (reducedMotion()) visual.explode = 0;
      applyExplosion();
      status("对位机构收回，画面已重合");
    } else if (action === "light") {
      if (Math.abs(lightX) < 0.18) {
        lightX = lightX >= 0 ? 0.82 : -0.82;
        lightY = 0.34;
      } else {
        lightX = 0;
        lightY = 0.1;
      }
      applyLight();
      status("实体光球移动，聚光灯与阴影同步转向");
    } else if (action === "cycle") {
      setArtwork(selected + 1, false);
      status(`画轮转到《${currentItem()?.title || "作品"}》`);
    } else if (action === "reset") {
      explode = 0;
      lightX = 0.08;
      lightY = 0.18;
      if (reducedMotion()) {
        visual.explode = 0;
        visual.lightX = lightX;
        visual.lightY = lightY;
      }
      applyExplosion();
      applyLight();
      status("维度解构画室已复位");
    }
    invalidate();
  }

  function getState() {
    const item = currentItem();
    return {
      explode: Number(explode.toFixed(3)),
      lightX: Number(lightX.toFixed(3)),
      lightY: Number(lightY.toFixed(3)),
      selected,
      selectedId: item?.id || "",
      selectedTitle: item?.title || "",
      aspect: Number(imageAspect.toFixed(4)),
      aspectSource,
      textureReady,
      textureDimensions: textureDimensions ? { ...textureDimensions } : null,
      textureSourceCount: pieces.filter((piece) => piece.texture.userData.assetState === "loaded").length,
      aligned: Boolean(aligned && explode === 0 && visual.explode <= 0.012),
      alignmentError: Number(visual.explode.toFixed(4)),
      pieceCount: pieces.length,
      catalogueCount: artworks.length,
      directHandles: ["deconstruct", "light-orb", "catalogue"],
    };
  }

  function setActive(value) {
    active = Boolean(value);
    if (active) {
      applyWorkTextureRefresh();
      applyExplosion();
      applyLight();
      invalidate();
    }
  }

  function update(time, dt) {
    if (!active) return;
    const step = Math.max(0.001, Math.min(dt || 0.016, 0.05));
    const reduced = reducedMotion();
    if (reduced) {
      visual.explode = explode;
      visual.lightX = lightX;
      visual.lightY = lightY;
    } else {
      visual.explode = damp(visual.explode, explode, 7.8, step);
      visual.lightX = damp(visual.lightX, lightX, 9, step);
      visual.lightY = damp(visual.lightY, lightY, 9, step);
    }
    applyExplosion();
    applyLight();
    applyWorkTextureRefresh();
    lightOrb.rotation.x = time * 0.38;
    lightOrb.rotation.y = time * 0.52;
    orbMaterial.emissiveIntensity = 1.75 + Math.sin(time * 2.1) * 0.22;
    coreGem.rotation.x = time * 0.14;
    coreGem.rotation.y = time * 0.19;
    skylightRibs.forEach((rib, index) => {
      rib.rotation.y = Math.sin(time * 0.18 + index) * 0.018 * (1 + visual.explode);
    });
    louverSlats.forEach(({ unit, restY }, index) => {
      unit.position.y = restY + Math.sin(time * 0.5 + index * 0.31) * 0.003 * (1 + visual.explode);
    });
    dialInner.rotation.z = -time * 0.09;
    cataloguePlate.rotation.y = Math.sin(time * 0.17) * 0.018;
    invalidate();
  }

  function dispose() {
    group.traverse((node) => {
      if (node.geometry && ownedGeometries.has(node.geometry)) node.geometry.dispose();
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
    focus: new THREE.Vector3(0, 3.75, 0),
    update,
    interact,
    getState,
    refreshTextures: applyWorkTextureRefresh,
    setActive,
    dispose,
  };
}
