// Shared modelling tools. Geometry is cached; moving assemblies remain independent.
export function createSculptTools(THREE, mesh) {
  const geometry = new Map();
  const cached = (key, build) => {
    if (!geometry.has(key)) geometry.set(key, build());
    return geometry.get(key);
  };
  function rounded(w, h, d, material, parent, position = [0, 0, 0], radius = 0.08) {
    const r = Math.max(0.001, Math.min(radius, w * 0.45, h * 0.45, d * 0.45));
    const key = `rounded:${w}:${h}:${d}:${r}`;
    const geo = cached(key, () => {
      const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      const result = new THREE.ExtrudeGeometry(s, { depth: Math.max(d - r * 0.5, 0.001), steps: 1,
        bevelEnabled: true, bevelSize: r * 0.22, bevelThickness: r * 0.25, bevelSegments: 3, curveSegments: 6 });
      result.translate(0, 0, -d / 2 + r * 0.25); result.computeVertexNormals(); return result;
    });
    return mesh(geo, material, ...position, parent);
  }
  function lathe(profile, material, parent, position = [0, 0, 0], segments = 64) {
    const key = `lathe:${JSON.stringify(profile)}:${segments}`;
    const geo = cached(key, () => new THREE.LatheGeometry(profile.map(p => p.isVector2 ? p : new THREE.Vector2(...p)), segments));
    return mesh(geo, material, ...position, parent);
  }
  function tube(points, radius, material, parent, segments = 64, sides = 8) {
    const curve = points.isCurve ? points : new THREE.CatmullRomCurve3(points.map(p => p.isVector3 ? p : new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve, segments, radius, sides, false), material, 0, 0, 0, parent);
  }
  function ring(radius, thickness, material, parent, position = [0, 0, 0], arc = Math.PI * 2) {
    const key = `ring:${radius}:${thickness}:${arc}`;
    const geo = cached(key, () => new THREE.TorusGeometry(radius, thickness, 10, Math.max(32, Math.round(80 * arc / (Math.PI * 2))), arc));
    return mesh(geo, material, ...position, parent);
  }
  function gear(radius, depth, teeth, material, parent, position = [0, 0, 0]) {
    const key = `gear:${radius}:${depth}:${teeth}`;
    const geo = cached(key, () => {
      const shape = new THREE.Shape();
      for (let i = 0; i <= teeth * 4; i++) {
        const angle = i / (teeth * 4) * Math.PI * 2;
        const r = radius * (i % 4 === 1 || i % 4 === 2 ? 1 : 0.87);
        const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
        if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
      }
      const hole = new THREE.Path(); hole.absarc(0, 0, radius * 0.24, 0, Math.PI * 2, true); shape.holes.push(hole);
      const result = new THREE.ExtrudeGeometry(shape, { depth, steps: 1, bevelEnabled: true,
        bevelSegments: 2, bevelSize: Math.min(0.018, radius * 0.025), bevelThickness: Math.min(depth * 0.2, 0.025), curveSegments: 20 });
      result.translate(0, 0, -depth / 2); result.computeVertexNormals(); return result;
    });
    return mesh(geo, material, ...position, parent);
  }
  function surface(fn, uSegments, vSegments, material, parent) {
    const positions = [], uvs = [], indices = [];
    for (let j = 0; j <= vSegments; j++) for (let i = 0; i <= uSegments; i++) {
      const u = i / uSegments, v = j / vSegments, p = fn(u, v);
      positions.push(...(p.isVector3 ? p.toArray() : p)); uvs.push(u, v);
    }
    for (let j = 0; j < vSegments; j++) for (let i = 0; i < uSegments; i++) {
      const a = j * (uSegments + 1) + i, b = a + uSegments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(indices);
    geo.computeVertexNormals(); geo.computeBoundingSphere(); return mesh(geo, material, 0, 0, 0, parent);
  }
  function instances(geo, material, placements, parent) {
    const result = new THREE.InstancedMesh(geo, material, placements.length), dummy = new THREE.Object3D();
    placements.forEach((placement, index) => {
      dummy.position.fromArray(placement.position || placement.pos || (Array.isArray(placement) ? placement : [0, 0, 0]));
      dummy.rotation.set(...(placement.rotation || [0, 0, 0]));
      const scale = placement.scale ?? 1;
      if (typeof scale === 'number') dummy.scale.setScalar(scale); else dummy.scale.fromArray(scale);
      dummy.updateMatrix(); result.setMatrixAt(index, dummy.matrix);
      if (placement.color !== undefined) result.setColorAt(index, new THREE.Color(placement.color));
    });
    result.instanceMatrix.needsUpdate = true; result.computeBoundingSphere();
    result.castShadow = result.receiveShadow = true; parent.add(result); return result;
  }
  function text(value, w, h, parent, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(128, Math.min(1024, Math.ceil(w * 192 / 32) * 32));
    canvas.height = Math.min(1536, Math.max(48, Math.round(canvas.width * h / w)));
    const textureScale = canvas.width / 1024;
    const ctx = canvas.getContext('2d'), padding = (options.padding ?? 38) * textureScale;
    const background = options.background === undefined ? '#f4efe1' : options.background;
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.fillStyle = options.color || '#253c3a'; ctx.textAlign = options.align || 'center'; ctx.textBaseline = 'middle';
    const family = options.serif === false ? '"Space Grotesk", "Microsoft YaHei", sans-serif' : 'Georgia, "Songti SC", "Microsoft YaHei", serif';
    let size = options.fontSize ? options.fontSize * textureScale : Math.min(90 * textureScale, canvas.height * 0.32);
    let lines = [];
    const buildLines = () => {
      ctx.font = `${size}px ${family}`; const result = [];
      for (const paragraph of String(value).split('\n')) {
        let current = '';
        const tokens = paragraph.match(/[A-Za-z0-9À-ž]+(?:['’][A-Za-z]+)*|\s+|./gu) || [''];
        for (const token of tokens) {
          if (current && ctx.measureText(current + token).width > canvas.width - padding * 2) { result.push(current.trim()); current = token.trimStart(); }
          else current += token;
        }
        result.push(current.trim());
      }
      return result;
    };
    lines = buildLines();
    while (lines.length * size * 1.38 > canvas.height - padding * 2 && size > 16 * textureScale) { size *= 0.91; lines = buildLines(); }
    const blockHeight = lines.length * size * 1.38;
    const x = ctx.textAlign === 'left' ? padding : ctx.textAlign === 'right' ? canvas.width - padding : canvas.width / 2;
    lines.forEach((line, index) => ctx.fillText(line, x, (canvas.height - blockHeight) / 2 + size * 0.69 + index * size * 1.38, canvas.width - padding * 2));
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, transparent: !background,
      depthWrite: Boolean(background), alphaTest: background ? 0 : 0.025, toneMapped: false });
    return mesh(new THREE.PlaneGeometry(w, h), mat, 0, 0, 0, parent);
  }
  return { rounded, lathe, tube, ring, gear, surface, instances, text };
}

export function createSurfaceLibrary(THREE) {
  const maps = new Map();
  function relief(kind) {
    if (maps.has(kind)) return maps.get(kind);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d'), pixels = ctx.createImageData(256, 256);
    let seed = 1934;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = (seed / 4294967296 - 0.5) * 32;
      const weave = kind === 'wood' ? Math.sin(x * 0.22 + Math.sin(y * 0.03) * 1.8) * 24 + Math.sin(x * 0.9 + y * 0.015) * 10
        : kind === 'cloth' ? (x % 3 === 0 ? 15 : -5) + (y % 3 === 0 ? 15 : -5)
          : Math.sin(x * 0.05 + Math.sin(y * 0.018) * 2) * 6;
      const level = Math.round(160 + noise + weave), offset = (y * 256 + x) * 4;
      pixels.data[offset] = pixels.data[offset + 1] = pixels.data[offset + 2] = level; pixels.data[offset + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    const map = new THREE.CanvasTexture(canvas); map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(kind === 'wood' ? 2 : 4, kind === 'wood' ? 1 : 4); maps.set(kind, map); return map;
  }
  function decorate(material, kind = 'stone') {
    material.bumpMap = relief(kind); material.bumpScale = kind === 'wood' ? 0.035 : kind === 'cloth' ? 0.018 : 0.026;
    return material;
  }
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d'), sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#dedfdc'); sky.addColorStop(0.48, '#a2aaa7'); sky.addColorStop(0.52, '#a39883'); sky.addColorStop(1, '#373d37');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = '#fff9e9'; ctx.fillRect(70, 75, 190, 205); ctx.fillStyle = '#edf6ff'; ctx.fillRect(610, 110, 240, 130);
  ctx.fillStyle = '#f4ede1'; ctx.fillRect(370, 35, 75, 165); ctx.fillStyle = '#afbfb7'; ctx.fillRect(930, 160, 55, 240);
  const environment = new THREE.CanvasTexture(c); environment.colorSpace = THREE.SRGBColorSpace;
  environment.mapping = THREE.EquirectangularReflectionMapping;
  return { decorate, environment, dispose() { maps.forEach(map => map.dispose()); environment.dispose(); } };
}
