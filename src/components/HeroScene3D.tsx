import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

interface HeroScene3DProps {
  activeAccentHex: string;
  hoveredIndex: number | null;
  paused: boolean;
}

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createBrushedMetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y++) {
      const shade = 112 + Math.floor((Math.sin(y * 0.73) * 0.5 + 0.5) * 32);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(0, y, 256, 1);
    }
    for (let i = 0; i < 420; i++) {
      const y = (i * 47) % 256;
      const x = (i * 89) % 256;
      const w = 24 + (i % 64);
      const val = i % 2 === 0 ? 156 : 96;
      ctx.fillStyle = `rgba(${val},${val},${val},0.22)`;
      ctx.fillRect(x, y, w, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createAmbientAuraTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 6, 128, 128, 126);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.14)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  return new THREE.CanvasTexture(canvas);
}

export function HeroScene3D({
  activeAccentHex,
  hoveredIndex,
  paused,
}: HeroScene3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef({ activeAccentHex, hoveredIndex, paused });
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    propsRef.current = { activeAccentHex, hoveredIndex, paused };
  }, [activeAccentHex, hoveredIndex, paused]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
        preserveDrawingBuffer: isSoftwareGl,
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0b0c0e, 1);

    const initWidth = container.clientWidth || window.innerWidth;
    const initHeight = container.clientHeight || window.innerHeight;
    renderer.setSize(initWidth, initHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0c0e);
    scene.fog = new THREE.FogExp2(0x0b0c0e, 0.022);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      36,
      initWidth / Math.max(initHeight, 1),
      0.1,
      100,
    );

    // Three-point studio lighting + warm/cool contrast
    const hemiLight = new THREE.HemisphereLight(0xc2d6f2, 0x1a1714, 0.92);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff3dc, 2.8);
    keyLight.position.set(6, 9, 8);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8bb2e2, 1.25);
    fillLight.position.set(-7, 3, 5);
    scene.add(fillLight);

    const accentRimLight = new THREE.PointLight(0xd4a853, 12, 22, 1.5);
    accentRimLight.position.set(-1.5, 2.4, -2.8);
    scene.add(accentRimLight);

    const coreGlowLight = new THREE.PointLight(0xd4a853, 6.5, 11, 1.8);
    coreGlowLight.position.set(0, 0.55, 0.6);
    scene.add(coreGlowLight);

    // Shared procedural textures
    const brushedBump = createBrushedMetalTexture();
    brushedBump.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const shadowTex = createContactShadowTexture();
    const auraTex = createAmbientAuraTexture();

    // Shared calibrated PBR materials (varying roughness >= 0.25 across adjacent parts)
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x1e222b,
      roughness: 0.64,
      metalness: 0.38,
      bumpMap: brushedBump,
      bumpScale: 0.008,
    });

    const titaniumMat = new THREE.MeshPhysicalMaterial({
      color: 0xcbd2dd,
      roughness: 0.22,
      metalness: 0.92,
      bumpMap: brushedBump,
      bumpScale: 0.006,
      clearcoat: 0.4,
      clearcoatRoughness: 0.22,
    });

    const champagneBrassMat = new THREE.MeshPhysicalMaterial({
      color: 0xdfb45f,
      roughness: 0.16,
      metalness: 0.94,
      bumpMap: brushedBump,
      bumpScale: 0.005,
      clearcoat: 0.5,
      clearcoatRoughness: 0.16,
    });

    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4efe4,
      roughness: 0.08,
      metalness: 0.12,
      transmission: isSoftwareGl ? 0 : 0.72,
      transparent: true,
      opacity: isSoftwareGl ? 0.62 : 0.94,
      ior: 1.62,
      thickness: 1.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
    });

    const accentEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0xd4a853,
      emissive: 0xd4a853,
      emissiveIntensity: 1.65,
      roughness: 0.22,
      metalness: 0.4,
    });

    // Root architectural sculpture assembly
    const sculptureRoot = new THREE.Group();
    scene.add(sculptureRoot);

    // Subtle soft atmospheric aura behind the sculpture (color reacts to hovered room)
    const auraGeo = new THREE.PlaneGeometry(7.2, 7.2);
    const auraMat = new THREE.MeshBasicMaterial({
      map: auraTex,
      color: 0xd4a853,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const auraPlane = new THREE.Mesh(auraGeo, auraMat);
    auraPlane.position.set(0, 0.35, -2.4);
    sculptureRoot.add(auraPlane);

    // 1. Grounded Architectural Pedestal Base (3 stepped parts)
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.y = -2.48;
    sculptureRoot.add(pedestalGroup);

    const basePlinthGeo = new THREE.CylinderGeometry(2.15, 2.38, 0.14, 48);
    const basePlinth = new THREE.Mesh(basePlinthGeo, obsidianMat);
    basePlinth.position.y = 0.07;
    basePlinth.receiveShadow = true;
    pedestalGroup.add(basePlinth);

    const brassTrimRingGeo = new THREE.TorusGeometry(2.14, 0.026, 16, 64);
    const brassTrimRing = new THREE.Mesh(brassTrimRingGeo, champagneBrassMat);
    brassTrimRing.rotation.x = Math.PI / 2;
    brassTrimRing.position.y = 0.145;
    pedestalGroup.add(brassTrimRing);

    const upperPlinthGeo = new THREE.CylinderGeometry(1.35, 1.52, 0.1, 48);
    const upperPlinth = new THREE.Mesh(upperPlinthGeo, obsidianMat);
    upperPlinth.position.y = 0.2;
    upperPlinth.receiveShadow = true;
    pedestalGroup.add(upperPlinth);

    const upperBrassTrimGeo = new THREE.TorusGeometry(1.35, 0.016, 12, 48);
    const upperBrassTrim = new THREE.Mesh(upperBrassTrimGeo, champagneBrassMat);
    upperBrassTrim.rotation.x = Math.PI / 2;
    upperBrassTrim.position.y = 0.252;
    pedestalGroup.add(upperBrassTrim);

    // Contact shadow plane directly underneath pedestal
    const shadowGeo = new THREE.CircleGeometry(3.4, 48);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.78,
    });
    const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.015;
    pedestalGroup.add(shadowDisc);

    // 2. Floating Astrolabe & Monolith Core Assembly
    const astrolabe = new THREE.Group();
    astrolabe.position.y = 0.35;
    sculptureRoot.add(astrolabe);

    // Primary silhouette: Faceted architectural prism + stepped brass collar rings + inner filament
    const coreGroup = new THREE.Group();
    astrolabe.add(coreGroup);

    const outerCrystalGeo = new THREE.OctahedronGeometry(0.92, 0);
    const outerCrystal = new THREE.Mesh(outerCrystalGeo, crystalMat);
    outerCrystal.scale.set(0.86, 1.38, 0.86);
    outerCrystal.castShadow = !isSoftwareGl;
    coreGroup.add(outerCrystal);

    const innerMonolithGeo = new THREE.OctahedronGeometry(0.46, 0);
    const innerMonolith = new THREE.Mesh(innerMonolithGeo, accentEmissiveMat);
    innerMonolith.scale.set(0.75, 1.45, 0.75);
    coreGroup.add(innerMonolith);

    const collarGeo = new THREE.TorusGeometry(0.82, 0.03, 16, 48);
    const upperCollar = new THREE.Mesh(collarGeo, champagneBrassMat);
    upperCollar.rotation.x = Math.PI / 2;
    upperCollar.position.y = 0.32;
    coreGroup.add(upperCollar);

    const lowerCollar = new THREE.Mesh(collarGeo, champagneBrassMat);
    lowerCollar.rotation.x = Math.PI / 2;
    lowerCollar.position.y = -0.32;
    coreGroup.add(lowerCollar);

    // Vertical meridian spire rods
    const spireGeo = new THREE.CylinderGeometry(0.02, 0.02, 3.1, 16);
    const spire = new THREE.Mesh(spireGeo, titaniumMat);
    coreGroup.add(spire);

    const finialGeo = new THREE.ConeGeometry(0.068, 0.22, 8);
    const topFinial = new THREE.Mesh(finialGeo, champagneBrassMat);
    topFinial.position.y = 1.66;
    coreGroup.add(topFinial);

    const bottomFinial = new THREE.Mesh(finialGeo, champagneBrassMat);
    bottomFinial.rotation.x = Math.PI;
    bottomFinial.position.y = -1.66;
    coreGroup.add(bottomFinial);

    // 3. Secondary Read: Three interlocking gyroscopic rings + instanced vernier graduation ticks
    const ringOuterGroup = new THREE.Group();
    const outerRingGeo = new THREE.TorusGeometry(2.15, 0.052, 20, 96);
    const outerRing = new THREE.Mesh(outerRingGeo, obsidianMat);
    outerRing.castShadow = !isSoftwareGl;
    ringOuterGroup.add(outerRing);

    const outerBrassFilletGeo = new THREE.TorusGeometry(2.21, 0.018, 12, 96);
    const outerBrassFillet = new THREE.Mesh(
      outerBrassFilletGeo,
      champagneBrassMat,
    );
    ringOuterGroup.add(outerBrassFillet);

    // 36 instanced architectural tick marks along outer meridian ring
    const tickCount = 36;
    const tickGeo = new THREE.BoxGeometry(0.024, 0.145, 0.038);
    const tickInstanced = new THREE.InstancedMesh(
      tickGeo,
      champagneBrassMat,
      tickCount,
    );
    const dummy = new THREE.Object3D();
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      const isMajor = i % 3 === 0;
      dummy.position.set(Math.cos(angle) * 2.02, Math.sin(angle) * 2.02, 0);
      dummy.rotation.set(0, 0, angle + Math.PI / 2);
      dummy.scale.set(isMajor ? 1.45 : 0.85, isMajor ? 1.38 : 0.74, 1);
      dummy.updateMatrix();
      tickInstanced.setMatrixAt(i, dummy.matrix);
    }
    tickInstanced.instanceMatrix.needsUpdate = true;
    tickInstanced.computeBoundingSphere();
    ringOuterGroup.add(tickInstanced);
    astrolabe.add(ringOuterGroup);

    const ringMidGroup = new THREE.Group();
    const midRingGeo = new THREE.TorusGeometry(1.74, 0.04, 18, 84);
    const midRing = new THREE.Mesh(midRingGeo, titaniumMat);
    midRing.castShadow = !isSoftwareGl;
    ringMidGroup.add(midRing);
    ringMidGroup.rotation.set(Math.PI / 3.4, Math.PI / 5, 0);
    astrolabe.add(ringMidGroup);

    const ringInnerGroup = new THREE.Group();
    const innerRingGeo = new THREE.TorusGeometry(1.32, 0.03, 16, 72);
    const innerRing = new THREE.Mesh(innerRingGeo, champagneBrassMat);
    ringInnerGroup.add(innerRing);
    ringInnerGroup.rotation.set(-Math.PI / 3.8, -Math.PI / 4, 0);
    astrolabe.add(ringInnerGroup);

    // 4. Accent Detail: 10 Orbiting Collection Satellite Nodes on ecliptic plane
    const satellitesGroup = new THREE.Group();
    satellitesGroup.rotation.x = 0.24;
    astrolabe.add(satellitesGroup);

    const orbitTrackGeo = new THREE.TorusGeometry(2.68, 0.011, 10, 96);
    const orbitTrackMat = new THREE.MeshStandardMaterial({
      color: 0x7b8394,
      roughness: 0.35,
      metalness: 0.85,
    });
    const orbitTrack = new THREE.Mesh(orbitTrackGeo, orbitTrackMat);
    orbitTrack.rotation.x = Math.PI / 2;
    satellitesGroup.add(orbitTrack);

    const satNodeGeo = new THREE.OctahedronGeometry(0.105, 0);
    const satHaloGeo = new THREE.TorusGeometry(0.155, 0.014, 10, 28);
    const satelliteNodes: THREE.Group[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const sat = new THREE.Group();
      sat.position.set(Math.cos(angle) * 2.68, 0, Math.sin(angle) * 2.68);
      const gem = new THREE.Mesh(
        satNodeGeo,
        i % 2 === 0 ? champagneBrassMat : titaniumMat,
      );
      const halo = new THREE.Mesh(satHaloGeo, champagneBrassMat);
      halo.rotation.x = Math.PI / 2;
      sat.add(gem, halo);
      satellitesGroup.add(sat);
      satelliteNodes.push(sat);
    }

    // 5. Subtle ambient architectural dust motes via InstancedMesh
    const moteCount = 64;
    const moteGeo = new THREE.OctahedronGeometry(0.024, 0);
    const moteMat = new THREE.MeshBasicMaterial({
      color: 0xe6e0d4,
      transparent: true,
      opacity: 0.45,
    });
    const motes = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
    for (let i = 0; i < moteCount; i++) {
      const radius = 3.2 + ((i * 37) % 55) * 0.1;
      const theta = (i * 2.39996) % (Math.PI * 2);
      const y = (((i * 19) % 100) / 100 - 0.5) * 6.5;
      dummy.position.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
      const s = 0.65 + ((i * 13) % 10) * 0.09;
      dummy.scale.setScalar(s);
      dummy.rotation.set(i * 0.5, i * 0.3, 0);
      dummy.updateMatrix();
      motes.setMatrixAt(i, dummy.matrix);
    }
    motes.instanceMatrix.needsUpdate = true;
    motes.computeBoundingSphere();
    scene.add(motes);

    // Responsive framing helper (keeps sculpture unobstructed on right for desktop, cleanly framed on mobile)
    const applyLayout = (w: number, h: number) => {
      const safeH = Math.max(h, 1);
      const aspect = w / safeH;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w, safeH, false);

      const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      if (w >= 960) {
        const camZ = THREE.MathUtils.clamp(9.8 / Math.min(aspect / 1.55, 1.05), 9.4, 12.2);
        camera.position.set(0, 0.85, camZ);
        camera.lookAt(0, 0.25, 0);
        sculptureRoot.scale.setScalar(0.86);
        sculptureRoot.position.set(1.85, 0.72, 0);
        coreGlowLight.position.set(1.85, 1.05, 0.8);
      } else {
        const requiredZ = 3.1 / (tanHalfFov * Math.max(aspect, 0.35));
        const camZ = THREE.MathUtils.clamp(requiredZ, 11.2, 19.5);
        camera.position.set(0, 0.9, camZ);
        camera.lookAt(0, 0.35, 0);
        sculptureRoot.scale.setScalar(0.84);
        sculptureRoot.position.set(0, 1.95, 0);
        coreGlowLight.position.set(0, 2.25, 0.8);
      }
    };

    applyLayout(initWidth, initHeight);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Interaction state (pointer parallax + drag orbit)
    let pointerX = 0;
    let pointerY = 0;
    let dragActive = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let manualYaw = 0;
    let manualPitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;

    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointerX = nx;
      pointerY = ny;
      if (dragActive) {
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        targetYaw += dx * 0.008;
        targetPitch = THREE.MathUtils.clamp(
          targetPitch + dy * 0.005,
          -0.65,
          0.65,
        );
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.target !== renderer.domElement) return;
      dragActive = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    };

    const onPointerUp = () => {
      dragActive = false;
    };

    let disposed = false;

    const onResize = () => {
      if (disposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      applyLayout(w, h);
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(container);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setWebglUnavailable(true);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    // Pre-allocated scratch variables (zero GC in render loop)
    const targetColor = new THREE.Color(0xd4a853);
    const currentColor = new THREE.Color(0xd4a853);
    let elapsed = 0;
    let lastTime = performance.now();
    let frameId = 0;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const startedAt = performance.now();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED && performance.now() - startedAt < 240) {
            frameId = window.setTimeout(poll, 8);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 8);
      } else {
        frameId = window.setTimeout(cb, 90);
      }
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const {
        activeAccentHex: accentHex,
        hoveredIndex: activeHover,
        paused: isPaused,
      } = propsRef.current;

      if (!isPaused && !prefersReducedMotion) {
        elapsed += dt;
      }

      // Smooth accent color transition
      targetColor.set(accentHex || '#D4A853');
      currentColor.lerp(targetColor, 1 - Math.exp(-5 * dt));
      accentRimLight.color.copy(currentColor);
      coreGlowLight.color.copy(currentColor);
      accentEmissiveMat.color.copy(currentColor);
      accentEmissiveMat.emissive.copy(currentColor);
      auraMat.color.copy(currentColor);

      // Smooth pointer + drag damping
      const hoverYawOffset =
        activeHover !== null ? (activeHover - 4.5) * 0.14 : 0;
      const desiredYaw = targetYaw + pointerX * 0.28 + hoverYawOffset;
      const desiredPitch = targetPitch + pointerY * 0.16;

      manualYaw = THREE.MathUtils.damp(manualYaw, desiredYaw, 4.5, dt);
      manualPitch = THREE.MathUtils.damp(manualPitch, desiredPitch, 4.5, dt);

      astrolabe.rotation.y = manualYaw + elapsed * 0.16;
      astrolabe.rotation.x = manualPitch;
      astrolabe.position.y = 0.35 + Math.sin(elapsed * 0.9) * 0.08;

      coreGroup.rotation.y = -elapsed * 0.32;
      ringOuterGroup.rotation.z = elapsed * 0.11;
      ringOuterGroup.rotation.x = Math.sin(elapsed * 0.28) * 0.22;

      ringMidGroup.rotation.y = elapsed * 0.24;
      ringMidGroup.rotation.x = Math.PI / 3.4 + Math.cos(elapsed * 0.22) * 0.14;

      ringInnerGroup.rotation.x = -elapsed * 0.36;
      ringInnerGroup.rotation.z = elapsed * 0.19;

      satellitesGroup.rotation.y = -elapsed * 0.18;
      motes.rotation.y = elapsed * 0.025;

      for (let i = 0; i < satelliteNodes.length; i++) {
        const sat = satelliteNodes[i];
        const isHighlighted = activeHover === i;
        const targetScale = isHighlighted ? 1.75 : 1.0;
        const nextScale = THREE.MathUtils.damp(
          sat.scale.x,
          targetScale,
          8,
          dt,
        );
        sat.scale.setScalar(nextScale);
        sat.rotation.y = elapsed * 0.8 + i;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    // Initial render
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry.dispose();
        }
      });
      obsidianMat.dispose();
      titaniumMat.dispose();
      champagneBrassMat.dispose();
      crystalMat.dispose();
      accentEmissiveMat.dispose();
      orbitTrackMat.dispose();
      shadowMat.dispose();
      auraMat.dispose();
      moteMat.dispose();
      brushedBump.dispose();
      shadowTex.dispose();
      auraTex.dispose();
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  if (webglUnavailable) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_60%_42%,rgba(212,168,83,0.16),rgba(11,12,14,0.96)_62%)]"
        aria-hidden="true"
      >
        <div className="h-72 w-72 rounded-full border border-white/10 opacity-60" />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      data-testid="hero-3d-canvas"
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    />
  );
}
