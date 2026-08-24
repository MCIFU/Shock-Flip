// haptic.js — Vibración háptica (sin dependencias, con feature-detection)
const supported = typeof navigator !== 'undefined' && !!navigator.vibrate;
let enabled = true;

function vibrate(pattern) {
  if (!supported || !enabled) return;
  try {
    // Algunos navegadores lanzan si se llama sin gesto previo del usuario
    navigator.vibrate(pattern);
  } catch (e) {
    // Sin soporte real o bloqueado: ignorar silenciosamente
  }
}

export function setEnabled(on) {
  enabled = !!on;
}

// Tick corto y seco (impacto de shock)
export function tick() {
  vibrate(30);
}

// Doble pulso (victoria de pantalla)
export function doublePulse() {
  vibrate([40, 60, 90]);
}

// Redoble creciente (desbloqueo legendario)
export function legendary() {
  vibrate([60, 50, 60, 50, 120, 60, 200]);
}

export function isSupported() {
  return supported;
}
