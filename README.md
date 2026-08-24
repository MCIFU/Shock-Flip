# BOMB FLIP 💣

Puzzle arcade web (tablero 5×5) inspirado en la mecánica de *Voltorb Flip* de Pokémon HG/SS,
con **arte, código y sonido 100 % originales**. Sin frameworks, sin assets externos
y sin marcas de terceros: solo HTML, CSS y JavaScript vanilla (ES modules).

La estética es de **taller de bombas** (madera, cobre, pólvora, ámbar), con 6 temas
de tablero desbloqueables y 6 dorsos de carta.

## Cómo ejecutar

- Sirve la carpeta con cualquier servidor estático:

```bash
cd bomb-flip
node serve.mjs        # http://127.0.0.1:8383
# también vale: python3 -m http.server 8000
```

- Con doble clic en `index.html` también funciona.

## Cómo jugar

1. Pulsa **JUGAR** en la pantalla de bienvenida.
2. Cada fila y columna muestra dos pistas:
   - **×N (MULTI)**: suma de valores 2 y 3, +1 si hay al menos un 1.
   - **💣 (BOMBAS)**: número de bombas en esa línea.
3. Toca las casillas para revelarlas. Evita las bombas.
   - **2** o **3**: multiplican la puntuación (×2, ×3).
   - **1**: no modifica la puntuación.
   - **💣 Bomba**: pierdes las monedas de la partida.
4. Ganas al encontrar **todos** los 2 y 3. Recibirás monedas que podrás cobrar al banco.
5. **8 pantallas** de dificultad creciente (Novato → Leyenda).
6. **Taller**: compra seguros antibomba, medallas de vitrina, elige temas y dorsos.

## Controles

| Tecla | Acción |
|-------|--------|
| `M`   | Activar/desactivar MEMO |
| `S`   | Armar seguro antibomba |
| `Esc` | Cerrar ventanas modales |

**MEMO**: activa el modo marca para anotar sospechas en las casillas
(bomba → 1 → 2 → 3 → limpiar). Clic derecho quita la última marca.
Pulsación larga en táctil.

**Seguro antibomba**: ármalo y la próxima bomba será neutralizada.
Cuesta 300 monedas en el Taller o se regala cada 3 pantallas completadas.

## Arquitectura

```
bomb-flip/
├── index.html                    # entrada del juego
├── serve.mjs                     # servidor estático para desarrollo
├── README.md
├── game/
│   ├── css/style.css             # todos los estilos (~11 KB)
│   └── js/
│       ├── config.js             # niveles, constantes, claves localStorage
│       ├── collection.js         # temas, dorsos, medallas, trofeos, seguro
│       ├── logic.js              # generación de tableros y lógica pura
│       ├── audio.js              # síntesis de audio con Web Audio API
│       ├── particles.js          # partículas en canvas
│       └── game.js               # controlador principal
├── test/
│   ├── logic.test.js             # 22 pruebas de lógica
│   ├── collection.test.js        # 28 pruebas de colección/economía
│   └── simulate.test.js          # simulaciones Montecarlo
└── public/
    ├── manifest.webmanifest      # PWA
    └── assets/icons/             # iconos 192/512/1024 px
```

## Tests

Se ejecutan con Node (sin dependencias externas):

```bash
node --test test/logic.test.js test/collection.test.js test/simulate.test.js
# 52 tests, 0 failures
```

También compatibles con Bun:

```bash
bun test
```

## Persistencia

Todo se guarda en `localStorage`:

- `bombflip:coins` — saldo del banco
- `bombflip:sound` / `bombflip:music` — preferencias de audio
- `bombflip:collection` — temas, dorsos, medallas, trofeos, seguros
- `bombflip:stats` — estadísticas de juego

## Sistema de monedas

- **Banco**: monedas acumuladas de todas las partidas. Nunca se pierden.
- **Partida (run)**: monedas ganadas en la racha actual.
- **Rendirse**: disponible tras pantalla 1. Doble confirmación. Las monedas van al banco.
- Economía calibrada: ~74-819 monedas por hora.

## Desarrollo

Sin dependencias externas. Sin npm. Sin CDN. Solo HTML, CSS y JS vanilla.

Las fuentes (Bebas Neue, Rajdhani) se cargan desde Google Fonts.

Los iconos son SVG inline. El sonido se sintetiza con Web Audio API (0 samples externos).

Los PNG de la PWA se generan en el momento de construcción con un script Node.