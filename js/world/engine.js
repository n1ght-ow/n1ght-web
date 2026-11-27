import * as THREE from '../vendor/three/three.module.js';
import { resolveSiteAsset } from './paths.js?v=1';
import { createSculptTools, createSurfaceLibrary } from './sculpt.js?v=5';
import { FEATURED_PHOTO, ROOMS } from './gallery.js?v=1';

const LOADERS = {
  photo: () => import('./experiences/photo.js?v=6'),
  books: () => import('./experiences/books.js?v=7'),
  poems: () => import('./experiences/poems.js?v=6'),
  paintings: () => import('./experiences/paintings.js?v=8'),
  music: () => import('./experiences/music.js?v=6'),
  sport: () => import('./experiences/sport.js?v=6'),
  series: () => import('./experiences/series.js?v=6'),
  films: () => import('./experiences/films.js?v=6'),
  games: () => import('./experiences/games.js?v=8'),
  curate: () => import('./experiences/curate.js?v=9'),
};
const ENTRY = { x: 0, y: 3.0, z: 0.1, yaw: 0.21, pitch: 0.15, size: 9.4 };

export function createWorld({ canvas, collections, onRoom, onSelect, onReady, onPending,
  onStatus, onControlHover, onControlPositions, shouldProjectControls, getCuratedItems, onMoveCurated, onCurationRequest }) {
  let dirty = true, activeId = null, requestedId = null, readyFrame = true, disposed = false;
  let pendingSelection = null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.35 : 1.65));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const scene = new THREE.Scene();
  const surfaces = createSurfaceLibrary(THREE);
  scene.environment = surfaces.environment;
  scene.environmentIntensity = 0.7;
  scene.background = new THREE.Color('#343a31');
  const camera = new THREE.OrthographicCamera(-30, 30, 20, -20, 0.1, 180);
  const hemisphere = new THREE.HemisphereLight('#eae4d1', '#666c4f', 1.52);
  scene.add(hemisphere);
  const sunlight = new THREE.DirectionalLight('#fff0d4', 2.45);
  sunlight.position.set(-18, 36, 25);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 100 });
  sunlight.shadow.normalBias = 0.035;
  sunlight.shadow.bias = -0.00015;
  scene.add(sunlight);
  scene.add(sunlight.target);
  const fill = new THREE.DirectionalLight('#bac4b7', 0.6);
  fill.position.set(20, 10, -25);
  scene.add(fill);

  const materials = new Map();
  const geometries = new Map();
  const textures = new Map();
  const picks = [];
  const pickMap = new Map();
  const statuses = new Map();
  let interactionSerial = 0, lastInteraction = null;
  const pavilions = new Map();
  const mat = (color, roughness = 0.65, metalness = 0) => {
    const key = `${color}:${roughness}:${metalness}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
    return materials.get(key);
  };
  const stone = surfaces.decorate(mat('#ded9ce', 0.82));
  const cream = surfaces.decorate(mat('#f0eee5', 0.45));
  const brass = mat('#b59a69', 0.27, 0.85);
  const walnut = surfaces.decorate(mat('#49372e', 0.57), 'wood');
  const green = mat('#637761', 0.83);
  const dark = mat('#263c37', 0.68);
  function mesh(geometry, material, x = 0, y = 0, z = 0, parent = scene) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(w, h, d, material, x = 0, y = 0, z = 0, parent = scene) {
    const key = `b:${w}:${h}:${d}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.BoxGeometry(w, h, d));
    return mesh(geometries.get(key), material, x, y, z, parent);
  }
  function cylinder(rt, rb, h, material, x = 0, y = 0, z = 0, parent = scene, segments = 48) {
    const key = `c:${rt}:${rb}:${h}:${segments}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.CylinderGeometry(rt, rb, h, segments));
    return mesh(geometries.get(key), material, x, y, z, parent);
  }
  function texture(url) {
    if (!url) return null;
    if (!textures.has(url)) {
      const resolvedURL = resolveSiteAsset(url) || url;
      const t = new THREE.TextureLoader().load(resolvedURL, () => {
        for (const pavilion of pavilions.values()) pavilion.refreshTextures?.();
        invalidate();
      }, undefined, () => {
        document.dispatchEvent(new CustomEvent('world:asset-error', { detail: url }));
      });
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
      textures.set(url, t);
    }
    return textures.get(url);
  }
  function image(url, w, h, parent = scene) {
    const m = new THREE.MeshBasicMaterial({ map: texture(url), color: url ? '#ffffff' : '#ded9c8', side: THREE.DoubleSide, toneMapped: false });
    return mesh(new THREE.PlaneGeometry(w, h), m, 0, 0, 0, parent);
  }
  function line(points, color = '#b49354', parent = scene) {
    const vertices = points.map(p => p.isVector3 ? p : new THREE.Vector3(...p));
    const result = new THREE.Line(new THREE.BufferGeometry().setFromPoints(vertices), new THREE.LineBasicMaterial({ color }));
    parent.add(result);
    return result;
  }
  function label(text, w, h, parent = scene) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = Math.max(128, Math.round(1024 * h / w));
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f4efdf'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#294039'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.min(110, c.height * 0.48)}px Georgia, "Songti SC", "Microsoft YaHei", serif`;
    ctx.fillText(text, 512, c.height / 2, 950);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false }), 0, 0, 0, parent);
  }
  const sculpt = createSculptTools(THREE, mesh);
  function register(object, descriptor, roomId = null) {
    const handlers = typeof descriptor === 'function' ? { onClick: descriptor } : descriptor || {};
    const key = `${roomId || 'world'}:${handlers.id || picks.length}`;
    const control = { object, handlers, roomId, key,
      anchor: handlers.anchor ? (handlers.anchor.isVector3 ? handlers.anchor.clone() : new THREE.Vector3(...handlers.anchor)) : null };
    picks.push(control); pickMap.set(object, control);
    return control;
  }

  const entrance = new THREE.Group();
  scene.add(entrance);
  const limestone = surfaces.decorate(mat('#969079', 0.92));
  const darkPlaster = surfaces.decorate(mat('#414639', 0.86));
  const metal = mat('#3b3b2e', 0.48, 0.48);
  const lightStrip = new THREE.MeshBasicMaterial({ color: '#e2c795', toneMapped: false });
  const entryPhoto = collections.find(room => room.id === 'photo').items.find(item => item.id === FEATURED_PHOTO);

  box(22, 0.35, 29, darkPlaster, 0, -0.195, 3, entrance);
  box(16, 8.5, 0.32, darkPlaster, 0, 3.9, -4.1, entrance);
  sculpt.rounded(11.1, 7.0, 0.45, limestone, entrance, [-0.1, 3.04, -2.7], 0.065);
  sculpt.rounded(8.0, 5.9, 0.15, metal, entrance, [-0.08, 3.23, -2.4], 0.055);
  const front = image(entryPhoto.image, 7.35, 5.53, entrance);
  front.position.set(-0.08, 3.22, -2.30);
  front.castShadow = false;
  register(front, { onClick: () => onRoom?.('photo'), overviewOnly: true });
  for (const [side, depth] of [[-1, 3.4], [1, 2.35]]) {
    box(1.35, 8.3, 5.2, darkPlaster, side * 6.05, 3.9, depth - 3.9, entrance);
    box(0.085, 6.9, 0.08, lightStrip, side * 5.34, 3.55, depth - 1.25, entrance).castShadow = false;
  }
  box(14.2, 1.5, 4.2, darkPlaster, 0, 7.23, -1.55, entrance);
  box(9.3, 0.045, 0.08, lightStrip, -0.12, 6.49, -0.3, entrance).castShadow = false;
  box(8.35, 0.045, 10.8, limestone, -0.08, 0.0, 3.2, entrance);
  box(0.025, 0.014, 10.1, brass, 3.94, 0.032, 3.4, entrance);
  box(0.025, 0.014, 10.1, brass, -4.1, 0.032, 3.4, entrance);

  const roomArchitecture = new THREE.Group();
  scene.add(roomArchitecture);
  roomArchitecture.visible = false;
  const roomWall = surfaces.decorate(new THREE.MeshStandardMaterial({ color: '#525344', roughness: 0.9 }));
  const roomFloor = surfaces.decorate(new THREE.MeshStandardMaterial({ color: '#5a5d4d', roughness: 0.93 }));
  box(48, 0.18, 42, roomFloor, 0, -0.12, 5, roomArchitecture).castShadow = false;
  box(42, 13, 0.3, roomWall, 0, 6, -9, roomArchitecture);
  box(42, 0.035, 0.06, lightStrip, 0, 0.4, -8.82, roomArchitecture).castShadow = false;
  for (const x of [-8.0, 9.5]) {
    box(0.3, 13, 1.4, roomWall, x, 6, -8.2, roomArchitecture);
  }

  const pending = new Map();
  function loadPavilion(id) {
    if (pavilions.has(id)) return Promise.resolve(pavilions.get(id));
    if (pending.has(id)) return pending.get(id);
    const request = LOADERS[id]().then(({ buildExperience }) => {
      if (!disposed) return createPavilion(id, buildExperience);
    }).finally(() => pending.delete(id));
    pending.set(id, request);
    return request;
  }

  function createPavilion(id, buildExperience) {
    const room = collections.find(collection => collection.id === id);
    const exhibit = new THREE.Group();
    exhibit.visible = false;
    const kit = { THREE, collection: room, mesh, box, cylinder, material: mat, texture, image,
      assetURL: url => resolveSiteAsset(url) || url,
      brass, stone, cream, walnut, green, dark, line, label, sculpt,
      register: (object, descriptor) => register(object, descriptor, id),
      invalidate,
      reducedMotion: () => reduce.matches,
      getDragScale: () => (camera.top - camera.bottom) / Math.max(canvas.clientHeight, 1),
      projectPoint: point => {
        const worldPoint = point?.isVector3 ? point.clone() : new THREE.Vector3(...point);
        const ndc = worldPoint.project(camera), rect = canvas.getBoundingClientRect();
        return { x: rect.left + (ndc.x + 1) * rect.width / 2, y: rect.top + (1 - ndc.y) * rect.height / 2 };
      },
      status: message => { statuses.set(id, String(message)); if (activeId === id) onStatus?.({ id, message: String(message) }); },
      getCuratedItems: () => getCuratedItems?.() || [],
      moveCurated: (itemId, targetIndex) => onMoveCurated?.(itemId, targetIndex),
      requestCuration: () => onCurationRequest?.(),
      onSelect: (category, index) => onSelect?.(category, index),
      onItemSelect: item => {
        const room = collections.find(r => r.id === item.category);
        const index = room?.items.findIndex(i => i.id === item.id) ?? -1;
        if (index >= 0) onSelect?.(item.category, index);
      },
    };
    let pavilion;
    const firstPick = picks.length;
    try {
      pavilion = buildExperience(kit);
    } catch (error) {
      for (const control of picks.splice(firstPick)) pickMap.delete(control.object);
      statuses.delete(id);
      throw error;
    }
    const localLights = [];
    exhibit.add(pavilion.group);
    scene.add(exhibit);
    pavilion.group.traverse(object => {
      if (object.isLight) {
        localLights.push(object); object.visible = false;
        // Local lamps shape the materials. The shared key light supplies the
        // contact shadow, avoiding a huge second screen-shaped floor shadow.
        if (object.isSpotLight || object.isPointLight) object.castShadow = false;
      }
      if (object.isMesh) {
        const objectMaterials = [object.material].flat();
        // Invisible pick volumes and translucent optical effects must not cast
        // the opaque rectangle produced by a default shadow depth material.
        if (objectMaterials.every(material => material &&
          (material.opacity < 0.95 || material.depthWrite === false || material.transmission > 0))) object.castShadow = false;
      }
      if (object.isMesh && object.geometry?.attributes.position?.count > 8000 && object.geometry.type === 'TorusGeometry') object.castShadow = false;
    });
    const result = { ...pavilion, localLights, exhibit };
    pavilions.set(id, result);
    return result;
  }

  let width = 1, height = 1, last = 0, time = 0, flight = null, frame = 0;
  const state = { ...ENTRY };
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  function invalidate() { dirty = true; }
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    renderer.setSize(width, height, false); dirty = true;
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas.parentElement);
  function focusRoom(id, instant = false) {
    if (id && !LOADERS[id]) return;
    if (id !== requestedId) pendingSelection = null;
    requestedId = id;
    if (activeId !== id) {
      releaseDrag();
      pavilions.get(activeId)?.setActive?.(false);
      if (id && !pavilions.has(id)) {
        readyFrame = false;
        onPending?.();
        loadPavilion(id).then(pavilion => {
          if (id === requestedId && !disposed) enterRoom(id, pavilion, instant);
        }).catch(error => {
          if (id !== requestedId || disposed) return;
          console.warn('Unable to open gallery room:', error.message);
          document.dispatchEvent(new Event('world:room-error'));
        });
        return;
      }
    }
    enterRoom(id, pavilions.get(id), instant);
  }
  function enterRoom(id, pavilion, instant) {
    const changed = activeId !== id;
    if (changed) pavilions.get(activeId)?.setActive?.(false);
    activeId = id;
    pavilion?.setActive?.(!document.hidden);
    for (const [key, exhibit] of pavilions) {
      exhibit.exhibit.visible = key === id;
      exhibit.localLights.forEach(light => { light.visible = key === id; });
    }
    entrance.visible = !id;
    roomArchitecture.visible = Boolean(id);
    onControlHover?.(null);
    const profile = ROOMS[id];
    const target = pavilion?.focus || new THREE.Vector3(0, 3, 0);
    scene.background.set(profile?.color || '#343a31');
    if (profile) {
      roomWall.color.set(profile.color);
      roomFloor.color.set(profile.color).multiplyScalar(0.84);
    }
    sunlight.target.position.copy(target);
    sunlight.position.copy(target).add(new THREE.Vector3(-7, 19, 12));
    Object.assign(sunlight.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13 });
    sunlight.shadow.camera.updateProjectionMatrix();
    const to = profile ? { x: target.x, y: target.y, z: target.z, size: profile.size, yaw: profile.yaw, pitch: profile.pitch } : ENTRY;
    flight = { from: { ...state }, to, start: performance.now(), duration: instant || reduce.matches ? 0 : 520 };
    if (changed && id === 'curate') pavilion.interact?.('refresh', getCuratedItems?.() || []);
    if (pavilion && pendingSelection !== null) {
      const selection = pendingSelection;
      pendingSelection = null;
      interact('select', selection);
    }
    if (id) onStatus?.({ id, message: statuses.get(id) || '' });
    renderer.shadowMap.needsUpdate = true;
    readyFrame = true;
    dirty = true;
  }
  function updateCamera() {
    const aspect = width / height;
    const profile = ROOMS[activeId];
    const fit = (profile?.span || 11.7) / ((profile?.size || ENTRY.size) * aspect);
    const size = state.size * Math.max(1, fit);
    camera.left = -size * aspect / 2; camera.right = size * aspect / 2;
    camera.top = size / 2; camera.bottom = -size / 2;
    camera.updateProjectionMatrix();
    const radius = 50, flat = Math.cos(state.pitch) * radius;
    camera.position.set(state.x + Math.sin(state.yaw) * flat, state.y + Math.sin(state.pitch) * radius, state.z + Math.cos(state.yaw) * flat);
    camera.lookAt(state.x, state.y, state.z); camera.updateMatrixWorld();
  }
  let dragging = false, moved = false, dragDistance = 0, downX = 0, downY = 0, capturedPointer = null;
  let originX = 0, originY = 0, grabbed = null, hoveredKey = null;
  const dragPlane = new THREE.Plane(), dragOrigin = new THREE.Vector3(), dragPoint = new THREE.Vector3();
  const dragLocalOrigin = new THREE.Vector3();
  const dragParentInverse = new THREE.Matrix4();
  const occlusionRay = new THREE.Raycaster();
  const controlVisibility = new Map();
  const controlOccluders = new Map();
  let visibilityCheckedAt = 0, visibilityRoom = null;
  function visible(object) {
    for (let node = object; node; node = node.parent) if (!node.visible) return false;
    return true;
  }
  function belongsTo(object, parent) {
    for (let node = object; node; node = node.parent) if (node === parent) return true;
    return false;
  }
  function physicalMeshes() {
    const objects = [];
    const root = pavilions.get(activeId)?.group;
    root?.updateWorldMatrix(true, true);
    root?.traverse(object => {
      if (!object.isMesh || !visible(object) || object.userData.pickThrough) return;
      const solid = [object.material].flat().some(material => material && material.visible !== false &&
        material.colorWrite !== false && material.depthWrite !== false && material.opacity >= 0.95 && !material.wireframe);
      if (solid) objects.push(object);
    });
    return objects;
  }
  function obstructed(control, controlHit, probe, solids) {
    // Test the visible scene as well as the enlarged interaction proxies. A
    // handle behind a wall must not catch a drag through that wall.
    const previousFar = probe.far;
    probe.far = Math.max(0, controlHit.distance - 0.1);
    const blocking = probe.intersectObjects(solids, false).find(hit => !belongsTo(hit.object, control.object));
    probe.far = previousFar;
    return blocking?.object || null;
  }
  function controlList() {
    const rect = canvas.getBoundingClientRect();
    const now = performance.now();
    const checkVisibility = visibilityRoom !== activeId || now - visibilityCheckedAt > 240;
    const solids = checkVisibility ? physicalMeshes() : null;
    if (checkVisibility) { visibilityRoom = activeId; visibilityCheckedAt = now; }
    return picks.filter(p => p.roomId === activeId && p.handlers.label && !p.handlers.overviewOnly && visible(p.object)).map(p => {
      const movingAnchor = p.handlers.getAnchor?.();
      if (movingAnchor) p.anchor = movingAnchor.isVector3 ? movingAnchor.clone() : new THREE.Vector3(...movingAnchor);
      if (!p.anchor) {
        const center = new THREE.Box3().setFromObject(p.object).getCenter(new THREE.Vector3());
        p.anchor = p.object.worldToLocal(center);
      }
      const position = p.object.localToWorld(p.anchor.clone()), ndc = position.clone().project(camera);
      if (checkVisibility) {
        occlusionRay.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera);
        const hit = occlusionRay.intersectObject(p.object, true).find(entry => visible(entry.object)) ||
          { distance: occlusionRay.ray.origin.distanceTo(position) };
        const blocker = obstructed(p, hit, occlusionRay, solids);
        controlVisibility.set(p.key, !blocker);
        controlOccluders.set(p.key, blocker ? blocker.name || blocker.parent?.name || blocker.geometry.type : null);
      }
      return { id: p.key, label: p.handlers.label, hint: p.handlers.hint || '', draggable: Boolean(p.handlers.onDrag),
        x: rect.left + (ndc.x + 1) * width / 2, y: rect.top + (1 - ndc.y) * height / 2, world: position.toArray(),
        visible: ndc.z >= -1 && ndc.z <= 1 && controlVisibility.get(p.key) !== false,
        occludedBy: controlOccluders.get(p.key) || null };
    });
  }
  function setRay(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    ray.setFromCamera(pointer, camera);
  }
  function pick(event) {
    setRay(event);
    const objects = picks.filter(p => visible(p.object) && !(activeId && p.handlers.overviewOnly) && (!activeId || !p.roomId || p.roomId === activeId));
    const allowed = new Set(objects);
    const solids = activeId ? physicalMeshes() : [];
    const hits = ray.intersectObjects(objects.map(p => p.object), true);
    const checked = new Set();
    for (const hit of hits) {
      if (!visible(hit.object)) continue;
      for (let node = hit.object; node; node = node.parent) {
        const control = pickMap.get(node);
        if (control && allowed.has(control) && !checked.has(control)) {
          checked.add(control);
          if (!obstructed(control, hit, ray, solids)) return { control, hit };
        }
      }
    }
    if (activeId) {
      const tolerance = event.pointerType === 'touch' ? 24 : 11;
      const nearby = controlList().map(c => ({ ...c, distance: Math.hypot(c.x - event.clientX, c.y - event.clientY) }))
        .filter(c => c.visible && c.distance < tolerance).sort((a, b) => a.distance - b.distance)[0];
      if (nearby) {
        const control = picks.find(p => p.key === nearby.id), point = new THREE.Vector3(...nearby.world);
        const hit = { point, distance: ray.ray.origin.distanceTo(point) };
        if (!obstructed(control, hit, ray, solids)) return { control, hit };
      }
    }
    return null;
  }
  function context(event, control, hit, dx = 0, dy = 0) {
    setRay(event);
    const point = ray.ray.intersectPlane(dragPlane, dragPoint) ? dragPoint.clone() : (hit?.point || dragOrigin).clone();
    // Use the coordinate frame captured at pointer-down. A handle's parent can
    // itself move during dragging; recomputing its inverse would subtract that
    // motion and make a dragged picture travel only half as far as the pointer.
    const localPoint = point.clone().applyMatrix4(dragParentInverse);
    return { event, point, localPoint, delta: localPoint.clone().sub(dragLocalOrigin),
      dx, dy, totalX: event.clientX - originX, totalY: event.clientY - originY,
      uv: hit?.uv, instanceId: hit?.instanceId, cancelled: event.type === 'pointercancel' };
  }
  function record(control, phase) {
    interactionSerial++;
    lastInteraction = { serial: interactionSerial, room: control.roomId, control: control.key, phase };
    renderer.shadowMap.needsUpdate = true; dirty = true;
  }
  function settleReducedMotion() {
    if (!reduce.matches) return;
    const pavilion = pavilions.get(activeId);
    const steps = activeId === 'sport' ? 150 : 2;
    for (let index = 0; index < steps; index++) pavilion?.update?.(time + index * 0.05, 0.05, true);
  }
  function hover(result, event) {
    const control = result?.control;
    const h = control?.handlers;
    const actionable = control && activeId === control.roomId && h.label && !h.overviewOnly;
    if (hoveredKey !== control?.key) {
      hoveredKey = control?.key || null;
      document.dispatchEvent(new CustomEvent('world:control-hover', { detail: actionable ? control.key : null }));
    }
    onControlHover?.(actionable ? { id: control.key, label: h.label, hint: h.hint || (h.onDrag ? '拖动这个部件，观察装置变化。' : '按下这个部件。'),
      draggable: Boolean(h.onDrag), x: event.clientX, y: event.clientY } : null);
    canvas.style.cursor = actionable ? h.onDrag ? 'grab' : 'pointer' : control ? 'pointer' : 'grab';
  }
  function pointerDown(event) {
    if (event.button !== 0 || event.isPrimary === false) return;
    dragging = true; moved = false; dragDistance = 0; downX = event.clientX; downY = event.clientY;
    originX = event.clientX; originY = event.clientY;
    const result = pick(event);
    grabbed = result && activeId && result.control.roomId === activeId && !result.control.handlers.overviewOnly ? result : null;
    if (grabbed) {
      dragOrigin.copy(grabbed.hit.point);
      dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), dragOrigin);
      const dragParent = grabbed.control.object.parent;
      if (dragParent) { dragParent.updateWorldMatrix(true, false); dragParentInverse.copy(dragParent.matrixWorld).invert(); }
      else dragParentInverse.identity();
      dragLocalOrigin.copy(dragOrigin).applyMatrix4(dragParentInverse);
      grabbed.control.handlers.onDown?.(context(event, grabbed.control, grabbed.hit));
      record(grabbed.control, 'down');
    }
    flight = null;
    capturedPointer = event.pointerId;
    canvas.setPointerCapture(capturedPointer);
    canvas.classList.add('is-dragging');
  }
  function pointerMove(event) {
    if (event.isPrimary === false) return;
    if (dragging) {
      const dx = event.clientX - downX, dy = event.clientY - downY;
      dragDistance += Math.abs(dx) + Math.abs(dy);
      if (dragDistance > 5) moved = true;
      if (grabbed) {
        const control = grabbed.control;
        control.handlers.onDrag?.(context(event, control, grabbed.hit, dx, dy));
        record(control, 'drag');
        hover(grabbed, event);
      } else {
        changeYaw(-dx * 0.006);
        state.pitch = THREE.MathUtils.clamp(state.pitch + dy * 0.004, 0.07, 1.12);
      }
      downX = event.clientX; downY = event.clientY; dirty = true;
    } else hover(pick(event), event);
  }
  function pointerUp(event) {
    if (!dragging || capturedPointer !== event.pointerId) return;
    if (grabbed) {
      const { control, hit } = grabbed, ctx = context(event, control, hit);
      control.handlers.onUp?.(ctx);
      if (!moved && event.type !== 'pointercancel') control.handlers.onClick?.(ctx);
      settleReducedMotion();
      record(control, event.type === 'pointercancel' ? 'cancel' : moved ? 'release' : 'click');
    } else if (!moved && event.type !== 'pointercancel') {
      const picked = pick(event);
      if (picked?.control.roomId && picked.control.roomId !== activeId) onRoom?.(picked.control.roomId);
      else picked?.control.handlers.onClick?.({ event, point: picked.hit.point, uv: picked.hit.uv });
    }
    releaseDrag();
  }
  function releaseDrag() {
    if (capturedPointer !== null && canvas.hasPointerCapture(capturedPointer)) canvas.releasePointerCapture(capturedPointer);
    capturedPointer = null;
    dragging = false;
    grabbed = null;
    canvas.classList.remove('is-dragging');
  }
  function wheel(event) {
    event.preventDefault(); flight = null;
    state.size = THREE.MathUtils.clamp(state.size * (1 + Math.sign(event.deltaY) * 0.065), 6, 20);
    dirty = true;
  }
  function changeYaw(amount) {
    state.yaw = THREE.MathUtils.clamp(state.yaw + amount, -0.93, 0.93);
  }
  canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp); canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('pointerleave', () => { if (!dragging) onControlHover?.(null); });
  canvas.addEventListener('wheel', wheel, { passive: false });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); renderer.setAnimationLoop(null);
    document.dispatchEvent(new CustomEvent('world:context-lost'));
  });
  function visibility() {
    if (activeId === requestedId) pavilions.get(activeId)?.setActive?.(!document.hidden);
    if (!document.hidden) { last = performance.now(); dirty = true; }
  }
  document.addEventListener('visibilitychange', visibility);
  function animate(now) {
    if (document.hidden || disposed) return;
    if (!flight && !dirty && now - last < 32) return;
    const dt = Math.min((now - (last || now)) / 1000, 0.05); last = now; time += dt;
    if (flight) {
      const t = flight.duration && !reduce.matches ? Math.min((now - flight.start) / flight.duration, 1) : 1;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      for (const key of Object.keys(flight.to)) state[key] = THREE.MathUtils.lerp(flight.from[key], flight.to[key], eased);
      dirty = true; if (t === 1) flight = null;
    }
    if (activeId && activeId === requestedId && !reduce.matches && pavilions.get(activeId)?.update) {
      pavilions.get(activeId).update?.(time, dt, true); dirty = true;
      if (frame++ % 10 === 0) renderer.shadowMap.needsUpdate = true;
    }
    if (dirty) {
      updateCamera();
      renderer.render(scene, camera);
      dirty = false;
      if (activeId && shouldProjectControls?.()) onControlPositions?.(controlList());
      if (readyFrame && (activeId || front.material.map.image)) {
        readyFrame = false;
        onReady?.();
      }
    }
  }
  resize();
  renderer.setAnimationLoop(animate);
  function interact(action, index) {
    if (activeId !== requestedId) {
      if (action === 'select') pendingSelection = index;
      return;
    }
    const pavilion = pavilions.get(activeId);
    pavilion?.interact?.(action, index);
    if (reduce.matches && pavilion?.update) {
      for (let i = 0; i < 80; i++) pavilion.update(time + i * 0.05, 0.05, true);
    }
    renderer.shadowMap.needsUpdate = true;
    dirty = true;
  }
  return {
    focus: focusRoom,
    getControls: controlList,
    activateControl(id, key = 'activate') {
      const control = picks.find(p => p.key === id && p.roomId === activeId);
      if (!control) return;
      const center = control.anchor ? control.object.localToWorld(control.anchor.clone()) :
        new THREE.Box3().setFromObject(control.object).getCenter(new THREE.Vector3());
      const local = control.object.parent?.worldToLocal(center.clone()) || center.clone();
      const dx = key === 'ArrowLeft' ? -28 : key === 'ArrowRight' || key === 'activate' ? 28 : 0;
      const dy = key === 'ArrowUp' ? -28 : key === 'ArrowDown' ? 28 : 0;
      const ctx = { dx, dy, totalX: dx, totalY: dy, point: center, localPoint: local,
        delta: new THREE.Vector3(dx / 80, -dy / 80, 0), keyboard: true, event: { type: 'keyboard' } };
      control.handlers.onDown?.(ctx);
      if (control.handlers.onKey && key !== 'activate') control.handlers.onKey(key);
      else if (key === 'activate' && control.handlers.onClick) control.handlers.onClick(ctx);
      else control.handlers.onDrag?.(ctx);
      control.handlers.onUp?.(ctx); settleReducedMotion(); record(control, 'keyboard');
    },
    interact,
    zoom(amount) { flight = null; state.size = THREE.MathUtils.clamp(state.size * amount, 6, 20); dirty = true; },
    rotate(amount) { flight = null; changeYaw(amount); dirty = true; },
    getStats() {
      return { requested: requestedId, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures,
        camera: { ...state, transitioning: Boolean(flight) },
        lastInteraction, active: activeId, state: pavilions.get(activeId)?.getState?.() || null,
        experiences: Object.fromEntries([...pavilions].map(([id, p]) => [id, p.getState?.() || null])),
        textureReadiness: [...textures].map(([url, texture]) => ({ url, width: texture.image?.naturalWidth || texture.image?.width || 0,
          height: texture.image?.naturalHeight || texture.image?.height || 0, sourceVersion: texture.source.version, version: texture.version })) };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      releaseDrag();
      for (const p of pavilions.values()) { p.setActive?.(false); p.dispose?.(); }
      renderer.setAnimationLoop(null); observer.disconnect(); document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointercancel', pointerUp); canvas.removeEventListener('wheel', wheel);
      const gs = new Set(), ms = new Set(), ts = new Set(textures.values());
      scene.traverse(o => { if (o.geometry) gs.add(o.geometry); if (o.material) for (const m of [o.material].flat()) { ms.add(m); if (m.map) ts.add(m.map); } });
      scene.traverse(o => { if (o.isBatchedMesh || o.isInstancedMesh) o.dispose(); });
      gs.forEach(g => g.dispose()); ms.forEach(m => m.dispose()); ts.forEach(t => t.dispose());
      surfaces.dispose(); renderer.dispose();
    },
  };
}
