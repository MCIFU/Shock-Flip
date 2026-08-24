// rarity.js — Efectos y lógica compartida por rareza (trofeos y medallas)
import * as Particles from './particles.js';
import * as Haptic from './haptic.js';
import { MEDALS } from './collection.js';

// ─── Efectos de celebración según la rareza del trofeo ───
// `dom` debe exponer: flash (overlay), app (contenedor raíz para sacudida)
export function celebrateTrophy(tier, cx, cy, dom) {
  const flash = dom?.flash;
  const app = dom?.app;
  const w2 = window.innerWidth / 2;
  const h2 = window.innerHeight / 2;

  if (tier === 'legendary') {
    // Full-screen: confeti púrpura + flash púrpura + sacudida sutil + deriva ambiental + háptica
    Particles.legendaryConfetti(w2, h2);
    flash?.classList.add('legendary', 'active');
    if (app) {
      app.classList.remove('screen-shake');
      void app.offsetWidth; // reinicia la animación si ya estaba en curso
      app.classList.add('screen-shake');
    }
    Haptic.legendary();
    setTimeout(() => {
      flash?.classList.remove('legendary', 'active');
      app?.classList.remove('screen-shake');
    }, 1700);
  } else if (tier === 'gold') {
    // Tinte ámbar + chispas doradas + deriva ambiental
    Particles.trophySparkle(cx, cy);
    Particles.goldAmbient();
    flash?.classList.add('gold', 'active');
    setTimeout(() => flash?.classList.remove('gold', 'active'), 1500);
  } else if (tier === 'silver') {
    // Tinte plateado + chispas doradas + deriva ambiental
    Particles.trophySparkle(cx, cy);
    Particles.silverAmbient();
    flash?.classList.add('silver', 'active');
    setTimeout(() => flash?.classList.remove('silver', 'active'), 1400);
  } else {
    // Bronce: chispas doradas + tinte cobrizo sutil + deriva ambiental
    Particles.trophySparkle(cx, cy);
    Particles.bronzeAmbient();
    flash?.classList.add('bronze', 'active');
    setTimeout(() => flash?.classList.remove('bronze', 'active'), 1300);
  }
}

// ─── Compra de medalla ───
// Lógica pura: no toca localStorage ni el DOM. Devuelve el nuevo estado o `{ ok: false }`.
export function purchaseMedal(medal, bankCoins, collection) {
  if (!medal || bankCoins < medal.cost) return { ok: false };
  const owned = collection.owned ? [...collection.owned] : [];
  if (owned.includes(medal.id)) return { ok: false };
  owned.push(medal.id);
  return {
    ok: true,
    bankCoins: bankCoins - medal.cost,
    owned,
    allMedals: owned.length >= MEDALS.length,
  };
}
