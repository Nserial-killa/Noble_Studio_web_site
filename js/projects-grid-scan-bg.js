/* ============================================================================
   FONDO "GRID SCAN" — Sección #projects (Proyectos Destacados)
   ----------------------------------------------------------------------------
   Adaptado de un componente de React Bits (React + Three.js + postprocessing
   + face-api.js) a JavaScript "vanilla" (sin frameworks) para que funcione
   en este sitio, que NO tiene bundler ni build system (todo vive en
   index.html, cargado por <script> normales, igual que Embla Carousel).

   QUÉ SE QUITÓ del componente original y POR QUÉ:

   1) React (useState/useEffect/props reactivos)
      → Este sitio no usa React. Se reemplaza por una función de fábrica
        (`initGridScanBackground`) que hace lo mismo "a mano": crea el
        canvas, arranca el loop de animación y devuelve una función
        `destroy()` para limpiar listeners si algún día se necesita.

   2) face-api.js + <video> + getUserMedia (seguimiento facial por webcam)
      → El componente original podía mover el fondo según la posición de tu
        cara usando la cámara. Eso implica: pedirle permiso de cámara al
        visitante, descargar modelos de IA desde un CDN externo, y arrastrar
        una librería pesada — todo para un simple fondo decorativo. Se quitó
        por completo: nadie va a autorizar la cámara para ver un fondo, y es
        una mala práctica de privacidad/rendimiento en una landing page.
        El movimiento sutil del fondo ahora reacciona solo al mouse (igual
        que ya hacía el componente original cuando no usaba la cámara).

   3) Giroscopio (deviceorientation)
      → Pide permisos extra en iOS y no aporta mucho en un fondo de sección;
        se quitó para simplificar. El efecto se sigue viendo bien solo con
        el mouse (y queda estático/parado en móvil, que es lo esperado).

   4) Librería "postprocessing" (BloomEffect + ChromaticAberrationEffect)
      → Es una dependencia externa más, pensada para proyectos con bundler.
        El shader (el código GLSL de abajo) YA calcula un halo/glow suave
        a mano con la variable `halo` (ver `uBloomOpacity` en el fragment
        shader), así que el "brillo" del efecto se conserva sin necesitar
        esa librería ni un EffectComposer aparte. Resultado: una sola
        dependencia (Three.js) en vez de tres.

   RESULTADO: mismo efecto visual (grid 3D con líneas doradas y un "escaneo"
   que recorre la cuadrícula), mismos colores del tema (negro + dorado),
   pero cargado igual que Embla: un <script> más, sin npm ni build.

   CÓMO SE CARGA (ver bloque de comentario al final del archivo y el prompt
   para Claude Code): Three.js se importa como módulo ES desde un CDN usando
   un <script type="importmap">, igual de "sin instalación" que el resto del
   sitio.
============================================================================ */

import * as THREE from 'three';

/* ----------------------------------------------------------------------------
   1) SHADERS (código que corre en la GPU, no en JS)
   ----------------------------------------------------------------------------
   - Vertex shader: solo posiciona un rectángulo (quad) que cubre toda la
     pantalla. No hace nada "3D" real; toda la ilusión de perspectiva pasa
     en el fragment shader (truco típico de shaders "raymarching-like").
   - Fragment shader: por cada pixel calcula si ese pixel cae sobre una
     línea de la cuadrícula (grid), y si el "escaneo" (una franja que viaja
     en el eje Z) está pasando por ahí. Combina ambas cosas en un color.
---------------------------------------------------------------------------- */

// vUv = coordenadas UV (0..1) del pixel actual dentro del rectángulo.
const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  // Como el quad ya cubre toda la pantalla, no hace falta multiplicar por
  // matrices de proyección/vista: se manda la posición directo en "clip space".
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

// --- Uniforms: "variables" que le pasamos desde JS al shader ---
uniform vec3  iResolution;      // ancho, alto y pixelRatio del canvas
uniform float iTime;            // tiempo transcurrido (para animar)
uniform vec2  uSkew;            // inclinación del "piso" según el mouse
uniform float uTilt;            // rotación leve en el eje de cámara (roll)
uniform float uYaw;             // rotación leve en el eje vertical (yaw)
uniform float uLineThickness;   // grosor de las líneas del grid
uniform vec3  uLinesColor;      // color de las líneas del grid
uniform vec3  uScanColor;       // color de la franja de "escaneo"
uniform float uGridScale;       // tamaño de cada celda del grid
uniform float uLineJitter;      // cuánto "tiemblan" las líneas (0 = quietas)
uniform float uScanOpacity;     // opacidad de la franja de escaneo
uniform float uScanDirection;   // 0 = adelante, 1 = atrás, 2 = ping-pong
uniform float uNoise;           // grano/ruido sutil sobre el color final
uniform float uBloomOpacity;    // intensidad del halo/glow en las líneas
uniform float uScanGlow;        // "ancho" del brillo de la franja de escaneo
uniform float uScanSoftness;    // qué tan suave/difuminada es esa franja
uniform float uPhaseTaper;      // suaviza la aparición/desaparición del escaneo
uniform float uScanDuration;    // segundos que tarda un ciclo de escaneo
uniform float uScanDelay;       // pausa entre un ciclo de escaneo y el siguiente

varying vec2 vUv;

// smoothstep "manual" con curva más suave (quintic) que la función nativa.
float smoother01(float a, float b, float x) {
  float t = clamp((x - a) / max(1e-5, (b - a)), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  // Convierte el pixel actual a coordenadas centradas en (0,0), con
  // aspecto corregido (para que el grid no se vea "estirado").
  vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

  // "Cámara" virtual: origen (ro) y dirección del rayo (rd) que sale de
  // cada pixel hacia la escena. Esto es la base de un raymarching simple.
  vec3 ro = vec3(0.0);
  vec3 rd = normalize(vec3(p, 2.0));

  // Rotaciones sutiles de la cámara según el mouse (tilt = roll, yaw = giro).
  float cR = cos(uTilt), sR = sin(uTilt);
  rd.xy = mat2(cR, -sR, sR, cR) * rd.xy;

  float cY = cos(uYaw), sY = sin(uYaw);
  rd.xz = mat2(cY, -sY, sY, cY) * rd.xz;

  // "Inclinación" extra según la posición del mouse dentro del contenedor.
  vec2 skew = clamp(uSkew, vec2(-0.7), vec2(0.7));
  rd.xy += skew * rd.z;

  vec3 color = vec3(0.0);
  float minT = 1e20;
  float gridScale = max(1e-5, uGridScale);
  float fadeStrength = 2.0;
  vec2 gridUV = vec2(0.0);
  float hitIsY = 1.0;

  // Busca en qué "pared" imaginaria del grid pega el rayo (hay 4 posibles:
  // 2 horizontales y 2 verticales, formando un pasillo/túnel).
  for (int i = 0; i < 4; i++) {
    float isY = float(i < 2);
    float pos = mix(-0.2, 0.2, float(i)) * isY + mix(-0.5, 0.5, float(i - 2)) * (1.0 - isY);
    float num = pos - (isY * ro.y + (1.0 - isY) * ro.x);
    float den = isY * rd.y + (1.0 - isY) * rd.x;
    float t = num / den;
    vec3 h = ro + rd * t;

    float depthBoost = smoothstep(0.0, 3.0, h.z);
    h.xy += skew * 0.15 * depthBoost;

    bool use = t > 0.0 && t < minT;
    gridUV = use ? mix(h.zy, h.xz, isY) / gridScale : gridUV;
    minT = use ? t : minT;
    hitIsY = use ? isY : hitIsY;
  }

  vec3 hit = ro + rd * minT;
  float dist = length(hit - ro);

  // Jitter opcional: hace que las líneas "vibren" un poco (queda apagado
  // por defecto, ver uLineJitter = 0 en la configuración de JS).
  float jitterAmt = clamp(uLineJitter, 0.0, 1.0);
  if (jitterAmt > 0.0) {
    vec2 j = vec2(
      sin(gridUV.y * 2.7 + iTime * 1.8),
      cos(gridUV.x * 2.3 - iTime * 1.6)
    ) * (0.15 * jitterAmt);
    gridUV += j;
  }

  // Calcula qué tan cerca está este pixel de una línea del grid (en X y en Y),
  // usando fwidth (derivada del pixel) para que las líneas se vean nítidas
  // sin "escalones" (antialiasing manual).
  float fx = fract(gridUV.x);
  float fy = fract(gridUV.y);
  float ax = min(fx, 1.0 - fx);
  float ay = min(fy, 1.0 - fy);
  float wx = fwidth(gridUV.x);
  float wy = fwidth(gridUV.y);
  float halfPx = max(0.0, uLineThickness) * 0.5;
  float tx = halfPx * wx;
  float ty = halfPx * wy;
  float lineX = 1.0 - smoothstep(tx, tx + wx, ax);
  float lineY = 1.0 - smoothstep(ty, ty + wy, ay);
  float lineMask = max(lineX, lineY);

  // Las líneas se van apagando (fade) conforme se alejan de la cámara,
  // dando sensación de profundidad/perspectiva.
  float fade = exp(-dist * fadeStrength);

  // --- Franja de "escaneo": una línea que recorre el grid en el eje Z ---
  float dur = max(0.05, uScanDuration);
  float del = max(0.0, uScanDelay);
  float scanZMax = 2.0;
  float widthScale = max(0.1, uScanGlow);
  float sigma = max(0.001, 0.18 * widthScale * uScanSoftness);
  float sigmaAura = sigma * 2.0;

  float cycle = dur + del;
  float tCycle = mod(iTime, cycle);
  float scanPhase = clamp((tCycle - del) / dur, 0.0, 1.0);
  float phase = scanPhase;
  if (uScanDirection > 0.5 && uScanDirection < 1.5) {
    phase = 1.0 - phase; // dirección invertida
  } else if (uScanDirection > 1.5) {
    // ping-pong: va y vuelve dentro del mismo ciclo
    float t2 = mod(max(0.0, iTime - del), 2.0 * dur);
    phase = (t2 < dur) ? (t2 / dur) : (1.0 - (t2 - dur) / dur);
  }

  float scanZ = phase * scanZMax;
  float dz = abs(hit.z - scanZ);

  // "Campana" gaussiana: más brillo cerca de la franja, se apaga a los lados.
  float lineBand = exp(-0.5 * (dz * dz) / (sigma * sigma));

  // Suaviza la entrada/salida del escaneo (para que no aparezca/desaparezca
  // de golpe en los extremos del recorrido).
  float taper = clamp(uPhaseTaper, 0.0, 0.49);
  float headFade = smoother01(0.0, taper, phase);
  float tailFade = 1.0 - smoother01(1.0 - taper, 1.0, phase);
  float phaseWindow = headFade * tailFade;

  float pulse = lineBand * phaseWindow * clamp(uScanOpacity, 0.0, 1.0);

  // "Aura": un brillo extra, más ancho y más tenue, alrededor de la franja.
  float auraBand = exp(-0.5 * (dz * dz) / (sigmaAura * sigmaAura));
  float aura = (auraBand * 0.25) * phaseWindow * clamp(uScanOpacity, 0.0, 1.0);

  // --- Combina todo: líneas del grid + franja de escaneo + su aura ---
  vec3 gridCol = uLinesColor * lineMask * fade;
  vec3 scanCol = uScanColor * pulse;
  vec3 scanAura = uScanColor * aura;
  color = gridCol + scanCol + scanAura;

  // Grano/ruido muy sutil (queda en 0 por defecto en la config de abajo).
  float n = fract(sin(dot(gl_FragCoord.xy + vec2(iTime * 123.4), vec2(12.9898, 78.233))) * 43758.5453123);
  color += (n - 0.5) * uNoise;
  color = clamp(color, 0.0, 1.0);

  // Alpha: fuera de las líneas/escaneo, el fondo es 100% transparente,
  // así se ve el bg-black de la sección por detrás sin "tapar" nada.
  float alpha = clamp(max(lineMask, pulse), 0.0, 1.0);

  // Halo/glow manual (esto reemplaza al BloomEffect de la librería
  // "postprocessing" que se quitó — ver comentario al inicio del archivo).
  float gx = 1.0 - smoothstep(tx * 2.0, tx * 2.0 + wx * 2.0, ax);
  float gy = 1.0 - smoothstep(ty * 2.0, ty * 2.0 + wy * 2.0, ay);
  float halo = max(gx, gy) * fade;
  alpha = max(alpha, halo * clamp(uBloomOpacity, 0.0, 1.0));

  fragColor = vec4(color, alpha);
}

void main() {
  vec4 c;
  mainImage(c, vUv * iResolution.xy);
  gl_FragColor = c;
}
`;

/* ----------------------------------------------------------------------------
   2) UTILIDAD: "smooth damp" (suavizado tipo resorte crítico)
   ----------------------------------------------------------------------------
   Mismo algoritmo que usa Unity/Unreal para mover un valor hacia un objetivo
   de forma suave (sin overshoot). Se usa para que el fondo no "salte" cuando
   movés el mouse, sino que lo siga con una inercia agradable.
---------------------------------------------------------------------------- */
function smoothDampFloat(current, target, velocity, smoothTime, deltaTime) {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

  const change = current - target;
  const newTarget = current - change;

  const temp = (velocity.value + omega * change) * deltaTime;
  const newVelocity = (velocity.value - omega * temp) * exp;
  const value = newTarget + (change + temp) * exp;

  velocity.value = newVelocity;
  return value;
}

// Convierte un color hexadecimal (ej. "#FFD700") a espacio lineal, que es lo
// que Three.js espera para que el color se vea "correcto" en el shader.
function srgbColor(hex) {
  return new THREE.Color(hex).convertSRGBToLinear();
}

/* ----------------------------------------------------------------------------
   3) FUNCIÓN PRINCIPAL: initGridScanBackground(container, options)
   ----------------------------------------------------------------------------
   Reemplaza al componente <GridScan /> de React. Recibe un elemento HTML
   (el contenedor donde debe "vivir" el canvas) y un objeto de opciones.
   Devuelve un objeto { destroy } para poder limpiar todo si algún día se
   necesita (por ejemplo, si la sección se quitara dinámicamente del DOM).
---------------------------------------------------------------------------- */
export function initGridScanBackground(container, options = {}) {
  const config = {
    lineThickness: 1.4,
    linesColor: '#2a2a2a',   // gris oscuro casi invisible sobre el negro
    scanColor: '#FFD700',    // dorado, para que combine con el resto del sitio
    scanOpacity: 0.35,
    gridScale: 0.09,
    lineJitter: 0,           // sin "temblor" en las líneas (look limpio)
    scanDirection: 'pingpong',
    bloomIntensity: 0.35,    // qué tanto brilla el halo alrededor de líneas
    noiseIntensity: 0,
    scanGlow: 0.8,
    scanSoftness: 1.2,
    scanPhaseTaper: 0.35,
    scanDuration: 3.5,
    scanDelay: 2.5,
    sensitivity: 0.5,        // qué tan fuerte reacciona al movimiento del mouse
    ...options
  };

  // Si el visitante pidió "reducir movimiento" en su sistema operativo,
  // respetamos esa preferencia igual que el resto del sitio (ver .fade-in,
  // .ave-hero, etc. en el CSS) y no animamos nada.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Setup de Three.js: renderer, escena, cámara y el "quad" con el shader ---
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0); // fondo transparente: se ve el bg-black de la sección
  container.appendChild(renderer.domElement);

  const uniforms = {
    iResolution: { value: new THREE.Vector3(container.clientWidth, container.clientHeight, renderer.getPixelRatio()) },
    iTime: { value: 0 },
    uSkew: { value: new THREE.Vector2(0, 0) },
    uTilt: { value: 0 },
    uYaw: { value: 0 },
    uLineThickness: { value: config.lineThickness },
    uLinesColor: { value: srgbColor(config.linesColor) },
    uScanColor: { value: srgbColor(config.scanColor) },
    uGridScale: { value: config.gridScale },
    uLineJitter: { value: config.lineJitter },
    uScanOpacity: { value: config.scanOpacity },
    uNoise: { value: config.noiseIntensity },
    uBloomOpacity: { value: config.bloomIntensity },
    uScanGlow: { value: config.scanGlow },
    uScanSoftness: { value: config.scanSoftness },
    uPhaseTaper: { value: config.scanPhaseTaper },
    uScanDuration: { value: config.scanDuration },
    uScanDelay: { value: config.scanDelay },
    uScanDirection: { value: config.scanDirection === 'backward' ? 1 : config.scanDirection === 'pingpong' ? 2 : 0 }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false
  });

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  // --- Interacción con el mouse (reemplaza al seguimiento facial) ---
  const s = THREE.MathUtils.clamp(config.sensitivity, 0, 1);
  const skewScale = THREE.MathUtils.lerp(0.06, 0.2, s);
  const tiltScale = THREE.MathUtils.lerp(0.12, 0.3, s);
  const yawScale = THREE.MathUtils.lerp(0.1, 0.28, s);
  const smoothTime = THREE.MathUtils.lerp(0.45, 0.12, s);
  const yBoost = THREE.MathUtils.lerp(1.2, 1.6, s);

  const lookTarget = new THREE.Vector2(0, 0);
  const lookCurrent = new THREE.Vector2(0, 0);
  const lookVelX = { value: 0 };
  const lookVelY = { value: 0 };

  let leaveTimer = null;

  function onMouseMove(e) {
    if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    lookTarget.set(nx, ny);
  }

  function onMouseLeave() {
    // Al salir el mouse del contenedor, el fondo vuelve suavemente a su
    // posición neutral (en vez de quedarse "trabado" en el último punto).
    if (leaveTimer) clearTimeout(leaveTimer);
    leaveTimer = window.setTimeout(() => lookTarget.set(0, 0), 250);
  }

  if (!prefersReducedMotion) {
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);
  }

  // --- Resize: mantiene el canvas y el shader sincronizados con el tamaño real ---
  function onResize() {
    renderer.setSize(container.clientWidth, container.clientHeight);
    uniforms.iResolution.value.set(container.clientWidth, container.clientHeight, renderer.getPixelRatio());
  }
  window.addEventListener('resize', onResize);

  // --- Loop de animación ---
  let rafId = null;
  let lastTime = performance.now();

  function tick() {
    const now = performance.now();
    const dt = Math.max(0, Math.min(0.1, (now - lastTime) / 1000));
    lastTime = now;

    lookCurrent.x = smoothDampFloat(lookCurrent.x, lookTarget.x, lookVelX, smoothTime, dt);
    lookCurrent.y = smoothDampFloat(lookCurrent.y, lookTarget.y, lookVelY, smoothTime, dt);

    uniforms.uSkew.value.set(lookCurrent.x * skewScale, -lookCurrent.y * yBoost * skewScale);
    uniforms.uTilt.value = lookCurrent.x * tiltScale * 0.3;
    uniforms.uYaw.value = THREE.MathUtils.clamp(lookCurrent.x * yawScale, -0.6, 0.6);
    uniforms.iTime.value = now / 1000;

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }

  if (prefersReducedMotion) {
    // Dibuja un solo frame estático y no arranca el loop de animación.
    renderer.render(scene, camera);
  } else {
    rafId = requestAnimationFrame(tick);
  }

  // --- Limpieza: por si la sección se destruye/desmonta en algún momento ---
  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    container.removeEventListener('mousemove', onMouseMove);
    container.removeEventListener('mouseleave', onMouseLeave);
    if (leaveTimer) clearTimeout(leaveTimer);
    material.dispose();
    quad.geometry.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return { destroy };
}
