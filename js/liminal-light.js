/* Native WebGL1 liminal sculpture for the hero and footer stages.
   The renderer keeps one RAF for every visible scene and falls back to a
   painted Canvas2D ring when WebGL or its shader setup is unavailable. */
(function () {
  'use strict';

  if (window.LiminalLight) return;

  const VERTEX_SHADER = `
    attribute vec2 aPosition;
    varying vec2 vUv;

    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SHADER = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif

    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uScene;
    uniform vec2 uTurn;
    varying vec2 vUv;

    vec3 rotateY(vec3 p, float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
    }

    vec3 rotateX(vec3 p, float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
    }

    float sculptureSdf(vec3 point) {
      float breath = 1.0 + 0.018 * sin(uTime * 0.52);
      vec3 p = point / breath;

      p = rotateY(p, 0.18 + sin(uTime * 0.12) * 0.48 + uTurn.x);
      p = rotateX(p, 0.32 + sin(uTime * 0.11) * 0.040 + uTurn.y);

      float angle = atan(p.y, p.x + 0.000001);
      float axialFold = 0.092 * sin(angle * 2.0 + uTime * 0.14)
                      + 0.038 * sin(angle * 5.0 - uTime * 0.11);
      float ringRadius = 0.91 + 0.047 * cos(angle * 3.0 - uTime * 0.12);
      float radial = length(p.xy) - ringRadius;
      float roll = axialFold
                 + 0.026 * sin(angle * 7.0 + uTime * 0.19);
      vec2 section = vec2(
        radial - 0.024 * cos(angle * 5.0 - uTime * 0.20),
        p.z + roll
      );
      float twist = angle * 2.0 + uTime * 0.20 + p.z * 0.78;
      float c = cos(twist);
      float s = sin(twist);
      section = mat2(c, -s, s, c) * section;
      section *= vec2(
        1.0 + 0.16 * cos(angle * 3.0 - uTime * 0.14),
        0.76 + 0.10 * sin(angle * 2.0 + uTime * 0.16)
      );

      float tube = 0.286 + 0.018 * sin(angle * 6.0 + uTime * 0.31);
      float liquid = length(section) - tube;
      liquid += 0.009 * sin(angle * 11.0 + p.z * 17.0 - uTime * 0.43);

      float shell = length(p) - 1.55;
      return max(liquid, shell);
    }

    vec3 sculptureNormal(vec3 p) {
      float epsilon = 0.0015;
      float dx = sculptureSdf(p + vec3(epsilon, 0.0, 0.0))
               - sculptureSdf(p - vec3(epsilon, 0.0, 0.0));
      float dy = sculptureSdf(p + vec3(0.0, epsilon, 0.0))
               - sculptureSdf(p - vec3(0.0, epsilon, 0.0));
      float dz = sculptureSdf(p + vec3(0.0, 0.0, epsilon))
               - sculptureSdf(p - vec3(0.0, 0.0, epsilon));
      return normalize(vec3(dx, dy, dz));
    }

    float traceSculpture(vec3 rayOrigin, vec3 rayDirection, out float travel) {
      float t = 2.0;
      travel = t;

      for (int i = 0; i < 64; i++) {
        vec3 p = rayOrigin + rayDirection * t;
        float distanceToSurface = sculptureSdf(p);
        if (distanceToSurface < 0.0012) {
          travel = t;
          return 1.0;
        }
        t += max(distanceToSurface * 0.72, 0.006);
        if (t > 6.1) break;
      }

      travel = t;
      return 0.0;
    }

    float softShadow(vec3 p) {
      vec3 lightDirection = normalize(vec3(-0.62, 0.84, 0.58));
      float result = 1.0;
      float t = 0.035;

      for (int i = 0; i < 12; i++) {
        float d = sculptureSdf(p + lightDirection * t);
        result = min(result, 12.0 * d / t);
        t += clamp(d, 0.025, 0.17);
        if (result < 0.025 || t > 1.25) break;
      }

      return clamp(result, 0.0, 1.0);
    }

    float ambientOcclusion(vec3 p, vec3 normal) {
      float occlusion = 0.0;
      float weight = 1.0;

      for (int i = 0; i < 5; i++) {
        float h = 0.025 + float(i) * 0.055;
        float d = sculptureSdf(p + normal * h);
        occlusion += (h - d) * weight;
        weight *= 0.74;
      }

      return clamp(1.0 - 1.65 * occlusion, 0.0, 1.0);
    }

    vec3 studioEnvironment(vec3 reflectedDirection, float nightScene) {
      vec3 direction = normalize(reflectedDirection);
      float heightMix = smoothstep(-0.72, 0.82, direction.y);

      vec3 dayEnvironment = mix(
        vec3(0.34, 0.37, 0.39),
        vec3(1.56, 1.56, 1.50),
        heightMix
      );
      float dayBox = pow(max(dot(direction, normalize(vec3(-0.42, 0.58, 0.70))), 0.0), 14.0);
      float dayStrip = pow(max(dot(direction, normalize(vec3(0.82, 0.18, 0.54))), 0.0), 36.0);
      float dayPeach = pow(max(dot(direction, normalize(vec3(0.30, -0.48, 0.82))), 0.0), 44.0);
      dayEnvironment += vec3(1.18, 1.14, 1.08) * dayBox * 0.76;
      dayEnvironment += vec3(0.66, 0.78, 0.86) * dayStrip * 0.48;
      dayEnvironment += vec3(0.74, 0.31, 0.27) * dayPeach * 0.30;

      vec3 nightEnvironment = mix(
        vec3(0.060, 0.140, 0.34),
        vec3(0.36, 0.72, 1.34),
        heightMix
      );
      float nightBox = pow(max(dot(direction, normalize(vec3(-0.36, 0.72, 0.60))), 0.0), 12.0);
      float nightStrip = pow(max(dot(direction, normalize(vec3(0.86, 0.12, 0.46))), 0.0), 34.0);
      float nightCoral = pow(max(dot(direction, normalize(vec3(0.22, -0.62, 0.75))), 0.0), 38.0);
      nightEnvironment += vec3(0.72, 1.06, 1.38) * nightBox * 1.12;
      nightEnvironment += vec3(0.92, 0.98, 1.32) * nightStrip * 0.72;
      nightEnvironment += vec3(1.10, 0.38, 0.31) * nightCoral * 0.50;

      return mix(dayEnvironment, nightEnvironment, nightScene);
    }

    vec3 shadeMetal(vec3 p, vec3 normal, vec3 rayDirection) {
      float nightScene = uScene;
      vec3 viewDirection = -rayDirection;
      vec3 keyDirection = normalize(vec3(-0.62, 0.84, 0.60));
      vec3 halfDirection = normalize(keyDirection + viewDirection);
      float facing = max(dot(normal, viewDirection), 0.0);
      float fresnel = pow(1.0 - facing, 3.1);
      float diffuse = max(dot(normal, keyDirection), 0.0);
      float shadow = softShadow(p + normal * 0.018);
      float occlusion = ambientOcclusion(p, normal);
      vec3 reflected = reflect(rayDirection, normal);
      vec3 environment = studioEnvironment(reflected, nightScene);

      float broadSpecular = pow(max(dot(normal, halfDirection), 0.0), 20.0);
      float sharpSpecular = pow(max(dot(normal, halfDirection), 0.0), 108.0);
      vec3 pearl = mix(vec3(0.70, 0.76, 0.80), vec3(1.04, 1.05, 1.02), normal.y * 0.5 + 0.5);
      vec3 color = pearl * 0.28;
      color += environment * (0.54 + fresnel * 0.78);
      color += vec3(0.84, 0.94, 1.06) * diffuse * shadow * 0.72;
      color += vec3(0.84, 0.86, 0.90) * broadSpecular * 0.30;
      color += vec3(1.30, 1.26, 1.17) * sharpSpecular * (0.50 + shadow * 0.50);

      float film = 0.5 + 0.5 * sin(
        15.0 * fresnel + 5.0 * normal.y + 3.0 * normal.x + uTime * 0.08
      );
      vec3 thinFilm = mix(vec3(0.48, 0.72, 1.0), vec3(1.0, 0.58, 0.53), film);
      color += thinFilm * (0.025 + fresnel * 0.10);

      float coralSweep = smoothstep(0.28, 0.95, normal.x * 0.55 - normal.y * 0.45 + fresnel);
      color += mix(vec3(0.46, 0.78, 1.0), vec3(1.0, 0.45, 0.38), coralSweep)
             * pow(fresnel, 2.0) * mix(0.12, 0.20, nightScene);
      color *= mix(0.72, 1.0, occlusion);
      color /= vec3(1.0) + max(color, vec3(0.0)) * 0.34;
      color = pow(max(color, vec3(0.0)), vec3(0.92));
      return color;
    }

    vec3 backgroundScene(vec2 screenUv) {
      float nightScene = uScene;
      vec3 dayPaper = vec3(0.960784, 0.956863, 0.941176);
      vec3 nightBlue = vec3(0.090196, 0.231373, 0.898039);
      vec3 color = mix(dayPaper, nightBlue, nightScene);
      vec2 projected = screenUv - vec2(0.50, 0.36);
      float projection = exp(-dot(projected * vec2(1.05, 1.72), projected * vec2(1.05, 1.72)) * 22.0);
      float edgeDistance = min(
        min(screenUv.x, 1.0 - screenUv.x),
        min(screenUv.y, 1.0 - screenUv.y)
      );
      float edgeFade = smoothstep(0.0, 0.12, edgeDistance);
      color *= 1.0 - projection * mix(0.026, 0.052, nightScene) * edgeFade;
      return color;
    }

    void main() {
      vec2 screenUv = vUv;
      vec2 centered = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
      vec3 rayOrigin = vec3(0.0, 0.0, 4.30);
      vec3 rayDirection = normalize(vec3(centered * 0.70, -1.95));
      float travel;
      float hit = traceSculpture(rayOrigin, rayDirection, travel);
      vec3 color = backgroundScene(screenUv);

      if (hit > 0.5) {
        vec3 hitPoint = rayOrigin + rayDirection * travel;
        vec3 normal = sculptureNormal(hitPoint);
        color = shadeMetal(hitPoint, normal, rayDirection);
      }

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `;

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = window.matchMedia('(max-width: 760px)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const scenes = [];
  const boundCanvases = new WeakSet();
  const RENDER_INTERVAL = 1000 / 30;
  let userPaused = false;
  let motionTime = 8.6;
  let rafId = 0;
  let lastRender = 0;
  let resizeTimer = 0;
  let intersectionObserver = null;
  let resizeObserver = null;
  let booted = false;

  const isPaused = () => userPaused || reducedMotion.matches;
  const isVisibleDocument = () => !document.hidden;

  function publishMotionState() {
    const paused = isPaused();
    root.dataset.liminalMotion = paused ? 'paused' : 'running';
    window.dispatchEvent(new CustomEvent('liminal:motion-state', {
      detail: { paused, reduced: reducedMotion.matches },
    }));
  }

  function stopLoop() {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
    lastRender = 0;
  }

  function visibleWebGLScenes() {
    return scenes.filter(scene => scene.visible && scene.kind === 'webgl' && scene.ready);
  }

  function startLoop() {
    if (rafId || !isVisibleDocument() || isPaused() || !visibleWebGLScenes().length) return;
    lastRender = 0;
    rafId = requestAnimationFrame(renderFrame);
  }

  function renderFrame(now) {
    rafId = 0;
    if (!isVisibleDocument() || isPaused()) {
      lastRender = 0;
      return;
    }

    const eligible = visibleWebGLScenes();
    if (!eligible.length) {
      lastRender = 0;
      return;
    }

    if (!lastRender || now - lastRender >= RENDER_INTERVAL - 1) {
      if (lastRender) motionTime += Math.min((now - lastRender) / 1000, 0.05);
      eligible.forEach(scene => {
        scene.turnX += (scene.targetTurnX - scene.turnX) * 0.055;
        scene.turnY += (scene.targetTurnY - scene.turnY) * 0.055;
        renderWebGL(scene, motionTime + scene.phase);
      });
      lastRender = now;
    }

    rafId = requestAnimationFrame(renderFrame);
  }

  function renderStillFrames() {
    scenes.forEach(scene => {
      if (!scene.visible || !isVisibleDocument()) return;
      if (scene.kind === 'webgl' && scene.ready) {
        renderWebGL(scene, motionTime + scene.phase);
      } else if (scene.kind === 'fallback') {
        paintFallback(scene);
      }
    });
  }

  function refreshMotionMode() {
    publishMotionState();
    if (isPaused()) {
      stopLoop();
      renderStillFrames();
    } else {
      startLoop();
    }
  }

  function setPaused(value) {
    userPaused = Boolean(value);
    refreshMotionMode();
    return getState();
  }

  function toggle() {
    return setPaused(!userPaused);
  }

  function getState() {
    return {
      paused: isPaused(),
      running: Boolean(rafId),
      reduced: reducedMotion.matches,
      time: motionTime,
      userPaused,
      visible: scenes.filter(scene => scene.visible).map(scene => scene.mode),
      scenes: scenes.map(scene => ({
        mode: scene.mode,
        state: scene.stage.dataset.sceneState,
        visible: scene.visible,
        frames: scene.frames,
      })),
    };
  }

  window.LiminalLight = { setPaused, toggle, getState };

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  }

  function createProgram(gl) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      return null;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    gl.deleteProgram(program);
    return null;
  }

  function disposeWebGL(scene) {
    const gl = scene.gl;
    if (!gl) return;
    if (scene.buffer) gl.deleteBuffer(scene.buffer);
    if (scene.program) gl.deleteProgram(scene.program);
    scene.buffer = null;
    scene.program = null;
    scene.ready = false;
    scene.gl = null;
  }

  function setupWebGL(scene) {
    disposeWebGL(scene);
    let gl = null;
    try {
      const attributes = {
        alpha: false,
        antialias: true,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
      };
      gl = scene.canvas.getContext('webgl', attributes)
        || scene.canvas.getContext('experimental-webgl', attributes);
    } catch (_) {
      gl = null;
    }
    if (!gl) return false;

    const program = createProgram(gl);
    if (!program) return false;
    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
    const timeLocation = gl.getUniformLocation(program, 'uTime');
    const sceneLocation = gl.getUniformLocation(program, 'uScene');
    const turnLocation = gl.getUniformLocation(program, 'uTurn');
    if (positionLocation < 0 || !resolutionLocation || !timeLocation || !sceneLocation || !turnLocation) {
      gl.deleteProgram(program);
      return false;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      return false;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    scene.gl = gl;
    scene.program = program;
    scene.buffer = buffer;
    scene.positionLocation = positionLocation;
    scene.resolutionLocation = resolutionLocation;
    scene.timeLocation = timeLocation;
    scene.sceneLocation = sceneLocation;
    scene.turnLocation = turnLocation;
    scene.ready = true;
    scene.stage.dataset.sceneState = 'webgl';
    return true;
  }

  function fitCanvas(scene) {
    const box = scene.stage.getBoundingClientRect();
    const width = Math.max(0, Math.round(box.width));
    const height = Math.max(0, Math.round(box.height));
    if (width < 2 || height < 2) return false;

    const mobile = mobileLayout.matches || coarsePointer.matches;
    const dprLimit = mobile ? 1.35 : 1.5;
    const pixelBudget = mobile ? 650000 : 1250000;
    const dpr = Math.min(window.devicePixelRatio || 1, dprLimit);
    let pixelWidth = Math.max(1, Math.round(width * dpr));
    let pixelHeight = Math.max(1, Math.round(height * dpr));
    const budgetScale = Math.min(1, Math.sqrt(pixelBudget / (pixelWidth * pixelHeight)));
    pixelWidth = Math.max(1, Math.floor(pixelWidth * budgetScale));
    pixelHeight = Math.max(1, Math.floor(pixelHeight * budgetScale));

    scene.cssWidth = width;
    scene.cssHeight = height;
    scene.sizeDirty = false;
    if (scene.canvas.width !== pixelWidth || scene.canvas.height !== pixelHeight) {
      scene.canvas.width = pixelWidth;
      scene.canvas.height = pixelHeight;
    }
    if (scene.kind === 'webgl' && scene.gl) {
      scene.gl.viewport(0, 0, pixelWidth, pixelHeight);
    }
    return true;
  }

  function renderWebGL(scene, time) {
    if (!scene.ready || !scene.gl || !isVisibleDocument() || !scene.visible) return;
    if (scene.sizeDirty && !fitCanvas(scene)) return;
    scene.frames += 1;
    const gl = scene.gl;
    gl.viewport(0, 0, scene.canvas.width, scene.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(scene.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, scene.buffer);
    gl.enableVertexAttribArray(scene.positionLocation);
    gl.vertexAttribPointer(scene.positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(scene.resolutionLocation, scene.canvas.width, scene.canvas.height);
    gl.uniform1f(scene.timeLocation, time);
    gl.uniform1f(scene.sceneLocation, scene.mode === 'night' ? 1 : 0);
    gl.uniform2f(scene.turnLocation, scene.turnX, scene.turnY);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function replaceCanvas(scene) {
    const previous = scene.canvas;
    const replacement = document.createElement('canvas');
    Array.from(previous.attributes).forEach(attribute => {
      replacement.setAttribute(attribute.name, attribute.value);
    });
    replacement.classList.add('liminal-canvas');
    previous.replaceWith(replacement);
    scene.canvas = replacement;
  }

  function paintFallback(scene) {
    if (!scene.visible || !isVisibleDocument()) return;
    if ((scene.sizeDirty || !scene.cssWidth) && !fitCanvas(scene)) return;
    const canvas = scene.canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      canvas.style.background = scene.mode === 'night' ? '#173be5' : '#f5f4f0';
      return;
    }

    const width = scene.cssWidth;
    const height = scene.cssHeight;
    const minSize = Math.min(width, height);
    const scaleX = canvas.width / width;
    const scaleY = canvas.height / height;
    context.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    context.clearRect(0, 0, width, height);

    const night = scene.mode === 'night';
    context.fillStyle = night ? '#173be5' : '#f5f4f0';
    context.fillRect(0, 0, width, height);

    const centerX = width * 0.51;
    const centerY = height * 0.49;
    const radius = minSize * 0.29;
    const band = minSize * 0.145;

    const shadow = context.createRadialGradient(
      centerX, centerY + minSize * 0.20, minSize * 0.04,
      centerX, centerY + minSize * 0.20, radius * 1.28
    );
    shadow.addColorStop(0, night ? 'rgba(3, 14, 70, 0.30)' : 'rgba(44, 49, 43, 0.16)');
    shadow.addColorStop(0.58, night ? 'rgba(4, 19, 95, 0.12)' : 'rgba(52, 58, 51, 0.07)');
    shadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.save();
    context.translate(centerX, centerY + minSize * 0.20);
    context.scale(1.08, 0.31);
    context.translate(-centerX, -(centerY + minSize * 0.20));
    context.fillStyle = shadow;
    context.fillRect(0, 0, width, height);
    context.restore();

    context.save();
    context.translate(centerX, centerY);
    context.rotate(-0.11);
    context.scale(1, 0.82);

    context.beginPath();
    context.arc(0, minSize * 0.022, radius, 0, Math.PI * 2);
    context.lineWidth = band * 1.03;
    context.strokeStyle = night ? 'rgba(4, 16, 88, 0.42)' : 'rgba(43, 48, 42, 0.22)';
    context.stroke();

    const ring = context.createLinearGradient(-radius, -radius, radius, radius);
    if (night) {
      ring.addColorStop(0, '#dcecff');
      ring.addColorStop(0.25, '#8fbaff');
      ring.addColorStop(0.52, '#f8f7f0');
      ring.addColorStop(0.76, '#8fcfff');
      ring.addColorStop(1, '#ffad99');
    } else {
      ring.addColorStop(0, '#f7f6f1');
      ring.addColorStop(0.24, '#9ca6aa');
      ring.addColorStop(0.50, '#fffefa');
      ring.addColorStop(0.74, '#aebbc0');
      ring.addColorStop(1, '#edb6aa');
    }
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.lineWidth = band;
    context.strokeStyle = ring;
    context.stroke();

    context.globalCompositeOperation = 'lighter';
    context.lineCap = 'round';
    context.beginPath();
    context.arc(0, 0, radius - band * 0.13, Math.PI * 1.06, Math.PI * 1.72);
    context.lineWidth = band * 0.10;
    context.strokeStyle = night ? 'rgba(205, 239, 255, 0.78)' : 'rgba(255, 255, 250, 0.86)';
    context.stroke();

    context.beginPath();
    context.arc(0, 0, radius + band * 0.12, Math.PI * 0.14, Math.PI * 0.62);
    context.lineWidth = band * 0.075;
    context.strokeStyle = night ? 'rgba(255, 157, 137, 0.78)' : 'rgba(220, 169, 157, 0.62)';
    context.stroke();
    context.restore();
    context.globalCompositeOperation = 'source-over';
  }

  function installFallback(scene) {
    disposeWebGL(scene);
    replaceCanvas(scene);
    scene.kind = 'fallback';
    scene.ready = true;
    scene.sizeDirty = true;
    scene.stage.dataset.sceneState = 'fallback';
    scene.canvas.dataset.liminalFallback = 'true';
    if (scene.visible && isVisibleDocument()) paintFallback(scene);
  }

  function bindContextLifecycle(scene) {
    if (boundCanvases.has(scene.canvas)) return;
    boundCanvases.add(scene.canvas);
    scene.canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      installFallback(scene);
      refreshMotionMode();
    }, { passive: false });
    scene.canvas.addEventListener('webglcontextrestored', () => {
      if (scene.kind !== 'webgl') return;
      if (!setupWebGL(scene)) {
        installFallback(scene);
        return;
      }
      if (scene.visible) {
        if (isPaused()) renderWebGL(scene, motionTime + scene.phase);
        else startLoop();
      }
    });
  }

  function attachPointerOrientation(scene) {
    if (!scene.section) return;
    scene.section.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || isPaused()) return;
      const box = scene.section.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const normalizedX = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
      const normalizedY = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
      scene.targetTurnX = normalizedX * 0.1;
      scene.targetTurnY = -normalizedY * 0.1;
    }, { passive: true });
    scene.section.addEventListener('pointerleave', event => {
      if (event.pointerType === 'touch') return;
      scene.targetTurnX = 0;
      scene.targetTurnY = 0;
    }, { passive: true });
  }

  function setSceneVisible(scene, visible) {
    scene.visible = visible;
    if (visible) {
      if (isPaused()) {
        if (scene.kind === 'webgl' && scene.ready) renderWebGL(scene, motionTime + scene.phase);
        else if (scene.kind === 'fallback') paintFallback(scene);
      } else if (scene.kind === 'fallback') {
        paintFallback(scene);
      } else if (scene.kind === 'webgl' && scene.ready) {
        startLoop();
      }
    }
    if (!visible && !scenes.some(item => item.visible && item.kind === 'webgl')) stopLoop();
  }

  function manualVisibility(scene) {
    const box = scene.stage.getBoundingClientRect();
    return box.width > 1
      && box.height > 1
      && box.bottom > 0
      && box.top < window.innerHeight;
  }

  function setupVisibility() {
    if ('IntersectionObserver' in window) {
      intersectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const scene = scenes.find(item => item.stage === entry.target);
          if (!scene) return;
          setSceneVisible(scene, entry.isIntersecting && entry.intersectionRatio > 0);
        });
        if (!isPaused() && visibleWebGLScenes().length) startLoop();
      }, { threshold: [0, 0.01] });
      scenes.forEach(scene => intersectionObserver.observe(scene.stage));
    } else {
      const update = () => scenes.forEach(scene => setSceneVisible(scene, manualVisibility(scene)));
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update, { passive: true });
      update();
    }
  }

  function scheduleResize() {
    if (resizeTimer) return;
    resizeTimer = window.setTimeout(() => {
      resizeTimer = 0;
      scenes.forEach(scene => {
        scene.sizeDirty = true;
        if (scene.visible && scene.kind === 'fallback') paintFallback(scene);
      });
      if (isPaused()) renderStillFrames();
      else startLoop();
    }, 90);
  }

  function setupResize() {
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(scheduleResize);
      scenes.forEach(scene => resizeObserver.observe(scene.stage));
    }
    window.addEventListener('resize', scheduleResize, { passive: true });
  }

  function bindReducedMotion() {
    const update = () => refreshMotionMode();
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', update);
    else reducedMotion.addListener(update);
  }

  function bindLifecycle() {
    document.addEventListener('visibilitychange', () => {
      if (!isVisibleDocument()) {
        stopLoop();
      } else if (isPaused()) {
        renderStillFrames();
      } else {
        startLoop();
      }
    });

    window.addEventListener('pagehide', event => {
      stopLoop();
      if (resizeTimer) {
        clearTimeout(resizeTimer);
        resizeTimer = 0;
      }
      if (!event.persisted) {
        intersectionObserver?.disconnect();
        resizeObserver?.disconnect();
      }
      scenes.forEach(scene => {
        if (scene.kind === 'webgl') disposeWebGL(scene);
      });
    });

    window.addEventListener('pageshow', () => {
      if (!isVisibleDocument()) return;
      scenes.forEach(scene => {
        if (scene.kind === 'webgl' && !scene.ready && !setupWebGL(scene)) installFallback(scene);
      });
      if (isPaused()) renderStillFrames();
      else startLoop();
    });
  }

  function boot() {
    if (booted) return;
    booted = true;

    document.querySelectorAll('[data-light-scene]').forEach((stage, index) => {
      let canvas = stage.querySelector('canvas.liminal-canvas') || stage.querySelector('canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'liminal-canvas';
        stage.append(canvas);
      }
      canvas.classList.add('liminal-canvas');

      const mode = stage.dataset.lightScene === 'night' ? 'night' : 'day';
      const scene = {
        stage,
        canvas,
        mode,
        section: stage.closest('section') || stage.closest('footer') || stage.parentElement,
        phase: mode === 'night' ? 2.7 : index * 0.9,
        visible: false,
        ready: false,
        kind: 'webgl',
        gl: null,
        program: null,
        buffer: null,
        turnX: 0,
        turnY: 0,
        targetTurnX: 0,
        targetTurnY: 0,
        frames: 0,
        sizeDirty: true,
      };
      scenes.push(scene);
      bindContextLifecycle(scene);
      if (!setupWebGL(scene)) installFallback(scene);
      attachPointerOrientation(scene);
    });

    setupVisibility();
    setupResize();
    bindReducedMotion();
    bindLifecycle();
    publishMotionState();

    if (isPaused()) renderStillFrames();
    else startLoop();
  }

  root.dataset.liminalMotion = isPaused() ? 'paused' : 'running';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
