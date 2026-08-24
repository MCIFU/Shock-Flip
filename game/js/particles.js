// particles.js — Partículas en canvas (2 capas: fondo ambiental + efectos)
let bgCanvas, fxCanvas, bgCtx, fxCtx;
let bgParticles = [];
let fxParticles = [];
let ambientParticles = [];
let rafId = null;
let running = false;
let currentBgLight = 60;   // lightness interpolado para las motas de fondo
let targetBgLight = 60;
let currentBgSat = 80;
let targetBgSat = 80;

function isLightTheme() {
  return document.documentElement?.getAttribute('data-theme') === 'light';
}

export function initParticles() {
  bgCanvas = document.getElementById('bg-particles');
  fxCanvas = document.getElementById('fx-particles');
  if (!bgCanvas || !fxCanvas) return;
  bgCtx = bgCanvas.getContext('2d', { willReadFrequently: true });
  fxCtx = fxCanvas.getContext('2d', { willReadFrequently: true });
  resize();
  window.addEventListener('resize', resize);
  // 48 motas de luz cálida flotando
  bgParticles = [];
  for (let i = 0; i < 48; i++) {
    bgParticles.push({
      x: Math.random() * (bgCanvas.width || window.innerWidth),
      y: Math.random() * (bgCanvas.height || window.innerHeight),
      r: Math.random() * 2.5 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.3 - 0.1,
      a: Math.random() * 0.5 + 0.2,
      hue: 35 + Math.random() * 20,
    });
  }
  if (!running) { running = true; rafId = requestAnimationFrame(loop); }
}

function resize() {
  if (!bgCanvas || !fxCanvas) return;
  bgCanvas.width = fxCanvas.width = window.innerWidth;
  bgCanvas.height = fxCanvas.height = window.innerHeight;
}

function loop() {
  if (!running) return;
  drawBg();
  drawFx();
  rafId = requestAnimationFrame(loop);
}

function drawBg() {
  if (!bgCtx) return;
  // Suavizado progresivo hacia el tema destino (evita el salto brusco)
  targetBgLight = isLightTheme() ? 38 : 60;
  targetBgSat = isLightTheme() ? 70 : 80;
  currentBgLight += (targetBgLight - currentBgLight) * 0.06;
  currentBgSat += (targetBgSat - currentBgSat) * 0.06;
  const light = Math.round(currentBgLight);
  const sat = Math.round(currentBgSat);

  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  for (const p of bgParticles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.y < -10) p.y = bgCanvas.height + 10;
    if (p.y > bgCanvas.height + 10) p.y = -10;
    if (p.x < -10) p.x = bgCanvas.width + 10;
    if (p.x > bgCanvas.width + 10) p.x = -10;
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    bgCtx.fillStyle = `hsla(${p.hue}, ${sat}%, ${light}%, ${p.a})`;
    bgCtx.fill();
  }
}

function drawFx() {
  if (!fxCtx) return;
  fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  fxParticles = fxParticles.filter(p => p.life > 0);
  for (const p of fxParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.vy += p.gravity;
    p.life -= p.decay;
    const a = Math.max(0, p.life / p.maxLife);
    fxCtx.beginPath();
    fxCtx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
    fxCtx.fillStyle = p.color(a);
    fxCtx.fill();
  }

  // Deriva ambiental (partículas lentas que persisten tras un desbloqueo)
  if (ambientParticles.length > 0) {
    const w = fxCanvas.width || window.innerWidth;
    const h = fxCanvas.height || window.innerHeight;
    ambientParticles = ambientParticles.filter(p => p.life > 0);
    for (const p of ambientParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.y < -10) p.y = h + 10;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      const a = Math.max(0, p.life / p.maxLife) * p.baseAlpha;
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      fxCtx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${a})`;
      fxCtx.fill();
    }
  }
}

function spawn(count, x, y, opts = {}) {
  const {
    speed = 3, gravity = 0.05, drag = 0.97, decay = 0.02,
    size = 3, hue = 40, sat = 90, light = 60, spread = Math.PI * 2,
    colorFn,
  } = opts;
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * spread;
    const spd = Math.random() * speed;
    const baseColor = colorFn || (a => `hsla(${hue + Math.random() * 30 - 15}, ${sat}%, ${light}%, ${a})`);
    fxParticles.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      r: Math.random() * size + 1,
      life: 1,
      maxLife: 1,
      gravity,
      drag,
      decay: decay * (0.7 + Math.random() * 0.6),
      color: baseColor,
    });
  }
}

export function explodeBomb(x, y) {
  // Descarga eléctrica: chispas blancas/amarillas + azules
  const dim = isLightTheme() ? 25 : 0;
  // Chispas blancas/amarillas (núcleo caliente)
  spawn(40, x, y, { speed: 7, gravity: 0.08, decay: 0.014, size: 3.5,
    colorFn: a => {
      const h = 45 + Math.random() * 20;
      const l = Math.max(30, 65 - dim + Math.random() * 25);
      return `hsla(${h}, 100%, ${l}%, ${a})`;
    },
  });
  // Chispas azules/blancas (arco eléctrico)
  spawn(30, x, y, { speed: 5, gravity: 0.04, decay: 0.015, size: 2.5,
    colorFn: a => {
      const h = 195 + Math.random() * 30;
      const l = Math.max(30, 58 - dim + Math.random() * 30);
      return `hsla(${h}, 90%, ${l}%, ${a})`;
    },
  });
  // Anillos de energía
  shockwave(x, y, 'rgba(255, 242, 0, ');
  shockwave(x, y, 'rgba(100, 180, 255, ');
}

export function explodeMultiplier(x, y) {
  const light = isLightTheme() ? 42 : 60;
  spawn(26, x, y, { speed: 4, gravity: 0.04, decay: 0.015, size: 3, hue: 42, sat: 95, light });
  shockwave(x, y, 'rgba(224, 171, 79, ');
}

export function confetti(x, y) {
  // En modo claro, los tonos van más oscuros (35–55% L) para destacar sobre fondo crema
  spawn(150, x, y, {
    speed: 7, gravity: 0.08, decay: 0.006, size: 4,
    colorFn: a => {
      const light = isLightTheme() ? 35 + Math.random() * 20 : 55 + Math.random() * 15;
      return `hsla(${Math.random() * 360}, 90%, ${light}%, ${a})`;
    },
    spread: Math.PI,
  });
}

export function shieldParticles(x, y) {
  spawn(30, x, y, {
    speed: 4, gravity: 0, decay: 0.02, size: 3,
    colorFn: a => `hsla(190, 100%, 60%, ${a})`,
  });
}

export function trophySparkle(x, y) {
  const l = isLightTheme() ? 45 : 65;
  spawn(40, x, y, {
    speed: 5, gravity: 0.03, decay: 0.008, size: 3,
    colorFn: a => `hsla(48, 100%, ${l}%, ${a})`,
  });
}

export function legendaryConfetti(x, y) {
  const dim = isLightTheme() ? 20 : 0; // oscurecer en modo claro
  // Lluvia morada de arriba a abajo (full-screen)
  spawn(220, x, y, {
    speed: 8, gravity: 0.07, decay: 0.005, size: 5,
    colorFn: a => {
      const h = 255 + Math.random() * 45; // 255-300 (violeta/púrpura)
      const l = 55 + Math.random() * 30 - dim;
      return `hsla(${h}, ${85 + Math.random() * 15}%, ${l}%, ${a})`;
    },
    spread: Math.PI,
  });
  // Explosión radial púrpura desde el centro
  spawn(90, x, y, {
    speed: 7, gravity: 0.03, decay: 0.006, size: 3.5,
    colorFn: a => {
      const h = 265 + Math.random() * 40;
      return `hsla(${h}, 95%, ${60 + Math.random() * 25 - dim}%, ${a})`;
    },
  });
  // Ondas de choque púrpuras
  shockwave(x, y, 'rgba(179, 136, 255, ');
  shockwave(x, y, 'rgba(200, 160, 255, ');
  // Deriva ambiental púrpura lenta que persiste unos segundos
  legendaryAmbient();
}

// ─── Deriva ambiental lenta (persiste tras un desbloqueo, según rareza) ───
let ambientTimer = null;

function ambientDrift({ hueMin, hueMax, sat, light, count, baseAlphaMin, baseAlphaMax }) {
  if (!fxCanvas) return;
  if (ambientTimer) clearTimeout(ambientTimer);

  const w = fxCanvas.width || window.innerWidth;
  const h = fxCanvas.height || window.innerHeight;

  for (let i = 0; i < count; i++) {
    ambientParticles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 3 + 1.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.4 + 0.15),
      life: 1,
      maxLife: 1,
      decay: 0.0015 + Math.random() * 0.0012,
      hue: hueMin + Math.random() * (hueMax - hueMin),
      sat,
      // Oscurecer la deriva en modo claro para mantener contraste sobre fondo claro
      light: isLightTheme() ? Math.max(30, light - 28) : light,
      baseAlpha: baseAlphaMin + Math.random() * (baseAlphaMax - baseAlphaMin),
    });
  }

  // Desvanecer y retirar tras 5 segundos
  ambientTimer = setTimeout(() => {
    ambientParticles = [];
    ambientTimer = null;
  }, 5000);
}

export function legendaryAmbient() {
  ambientDrift({
    hueMin: 255, hueMax: 300, sat: 80, light: 65,
    count: 35, baseAlphaMin: 0.15, baseAlphaMax: 0.4,
  });
}

export function goldAmbient() {
  ambientDrift({
    hueMin: 42, hueMax: 55, sat: 90, light: 62,
    count: 28, baseAlphaMin: 0.14, baseAlphaMax: 0.36,
  });
}

export function silverAmbient() {
  ambientDrift({
    hueMin: 205, hueMax: 225, sat: 18, light: 82,
    count: 28, baseAlphaMin: 0.12, baseAlphaMax: 0.3,
  });
}

export function bronzeAmbient() {
  ambientDrift({
    hueMin: 18, hueMax: 32, sat: 62, light: 55,
    count: 26, baseAlphaMin: 0.12, baseAlphaMax: 0.3,
  });
}

export function shockwave(x, y, colorPrefix) {
  // Wave particles ring
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    fxParticles.push({
      x, y,
      vx: Math.cos(ang) * 2,
      vy: Math.sin(ang) * 2,
      r: 5,
      life: 1,
      maxLife: 1,
      gravity: 0,
      drag: 0.92,
      decay: 0.04,
      color: a => colorPrefix + a + ')',
    });
  }
}

// Fuse sparks — small golden particles that shoot upward like a lit fuse
export function fuseSparks(x, y) {
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const spd = 1.5 + Math.random() * 3;
    fxParticles.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      r: Math.random() * 2 + 0.8,
      life: 1,
      maxLife: 1,
      gravity: -0.02,
      drag: 0.96,
      decay: 0.025 + Math.random() * 0.03,
      color: a => {
        const h = 25 + Math.random() * 20;
        // Chispas cálidas; en modo claro van más oscuras para verse sobre el fondo
        return isLightTheme()
          ? `hsla(${h}, 90%, ${30 + a * 35}%, ${a})`
          : `hsla(${h}, 90%, ${55 + a * 40}%, ${a})`;
      },
    });
  }
}

export function clearFx() {
  fxParticles = [];
}