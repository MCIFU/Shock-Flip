# SHOCK FLIP ⚡

Puzzle arcade de riesgo y lógica. Revela los valores **2** y **3** sin activar un núcleo eléctrico oculto. Los valores **1** no modifican la puntuación; cada 2 o 3 multiplica el resultado.

## Características

- Tableros de 4×4, 5×5 y 6×6.
- Ocho pantallas de dificultad creciente.
- Pistas por filas y columnas: MULTI y cantidad de SHOCKS.
- MEMO para marcar casillas sin revelarlas.
- Aislante para neutralizar un shock.
- Banco de monedas, colección, medallas y trofeos.
- Temas visuales, música sintetizada, efectos, partículas y vibración.
- Diseño responsive y soporte PWA.

## Ejecutar

Requiere Node.js. Desde la carpeta del proyecto:

```bash
node serve.mjs 8383
```

Abre <http://127.0.0.1:8383> en el navegador.

## Cómo jugar

1. Pulsa **JUGAR**.
2. Usa las pistas para decidir qué casillas revelar.
3. Revela todos los 2 y 3 para completar la pantalla.
4. Un **SHOCK** termina la ronda, salvo que tengas un aislante armado.
5. Tras ganar, cobra las monedas o continúa hasta completar las ocho pantallas.

### Puntuación

La primera casilla numérica establece la base. Después, los valores 2 y 3 multiplican la puntuación; los 1 no la cambian.

```text
2 → ×2 → 3 → ×6 → 2 → ×12 → 3 → ×36
```

### MEMO

Con MEMO activo, tocar una casilla recorre estas marcas:

```text
vacía → shock → 1 → 2 → 3 → vacía
```

El clic derecho o una pulsación larga elimina la última marca.

### Aislante

Ármalo desde el HUD para protegerte del próximo shock. Se consume al activarse. Puede comprarse en el Taller o recibirse como recompensa.

## Controles

| Control | Acción |
| --- | --- |
| Clic o toque | Revelar o marcar una casilla |
| Clic derecho | Quitar una marca MEMO |
| Pulsación larga | Quitar una marca MEMO en móvil |
| `M` | Activar o desactivar MEMO |
| `S` | Armar o desarmar el aislante |
| `Esc` | Cerrar ventanas y overlays |

**RENDIRSE** requiere confirmar con «¿SEGURO?». Cobra las monedas de la partida y vuelve al menú; la siguiente partida comienza en la pantalla 1.

## Taller y opciones

Desde el Taller puedes elegir música de partida, temas, dorsos, tamaño de tablero, aislantes y medallas. La música ofrece una previa breve al seleccionarla.

Desde **⚙️ OPCIONES** puedes cambiar sonido, música, vibración y tema claro/oscuro/automático, además de reiniciar el progreso.

## Desarrollo

```text
Shock Flip/
├── index.html
├── serve.mjs
├── game/
│   ├── css/style.css
│   └── js/
│       ├── config.js       # Niveles y constantes
│       ├── collection.js   # Colección y persistencia
│       ├── logic.js        # Tableros, pistas, puntuación y economía
│       ├── game.js         # UI y flujo de partida
│       ├── audio.js        # Música y efectos sintetizados
│       ├── particles.js    # Efectos de canvas
│       ├── haptic.js       # Vibración
│       └── rarity.js       # Rarezas y medallas
├── test/
└── public/
```

No usa frameworks ni dependencias de ejecución. La música y los efectos se generan con Web Audio API.

## Tests

```bash
node --test
```

También puede ejecutarse con Bun:

```bash
bun test
```

Las pruebas cubren la lógica del tablero, pistas, puntuación, economía, cobro, persistencia, colección, rarezas y flujos principales.

## Persistencia

El progreso se guarda en `localStorage` con claves históricas `bombflip:` para conservar partidas anteriores:

- `bombflip:coins`: monedas del banco.
- `bombflip:collection`: temas, dorsos, medallas, trofeos y aislantes.
- `bombflip:stats`: estadísticas y récords.
- `bombflip:sound`, `bombflip:musicOn`, `bombflip:haptics`: preferencias.
- `bombflip:music`: pista seleccionada.
- `bombflip:theme`: tema visual.

Proyecto original de SHOCK FLIP. No incluye código, gráficos ni audio de terceros.
