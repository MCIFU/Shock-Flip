# SHOCK FLIP ⚡

**Puzzle arcade de riesgo, lógica y rachas.**

SHOCK FLIP es un juego web de tablero inspirado en los puzzles de multiplicadores clásicos. Descubre todos los valores **2** y **3** sin activar un núcleo eléctrico oculto. Cada elección aumenta tu puntuación y también el riesgo de perder la partida.

El proyecto está construido con **HTML, CSS y JavaScript vanilla usando ES modules**. No utiliza frameworks, dependencias de ejecución ni assets de audio externos.

## Características

- Tablero configurable de **4×4, 5×5 o 6×6**.
- Pistas por filas y columnas: **MULTI** y número de **SHOCKS**.
- Puntuación multiplicativa basada en los valores descubiertos.
- Ocho pantallas de dificultad creciente, de **Novato** a **Leyenda**.
- Rachas de pantallas y economía persistente con protección contra farming.
- Modo **MEMO** para anotar sospechas sin revelar casillas.
- **Aislante anti-shock** comprable o recibido como recompensa.
- Taller con temas de tablero, dorsos de carta, medallas y música de partida.
- Galería de trofeos con cuatro rarezas: bronce, plata, oro y legendario.
- Efectos de partículas, confeti, haptics y sonido sintetizado con Web Audio API.
- Preferencias de sonido, música, vibración y tema oscuro/claro/automático.
- Diseño responsive y soporte PWA.

## Ejecutar localmente

SHOCK FLIP es una aplicación estática. Solo necesitas Node.js para lanzar el servidor incluido:

```bash
cd "Shock Flip"
node serve.mjs 8383
```

Abre [http://127.0.0.1:8383](http://127.0.0.1:8383) en el navegador.

También puedes utilizar cualquier servidor estático compatible. El doble clic sobre `index.html` funciona para la mayoría de las funciones, aunque un servidor local es recomendable para probar módulos ES, PWA y rutas de assets.

## Cómo jugar

1. Pulsa **JUGAR**.
2. Consulta las pistas de cada fila y columna:
   - **×N MULTI**: suma de los valores numéricos de la línea.
   - **⚡ SHOCKS**: cantidad de núcleos eléctricos ocultos.
3. Revela casillas con cuidado:
   - **1** no modifica la puntuación.
   - **2** y **3** aumentan la puntuación multiplicativamente.
   - **⚡ SHOCK** termina la ronda si no tienes un aislante armado.
4. Ganas la pantalla cuando revelas todos los 2 y 3.
5. Después puedes cobrar la recompensa o continuar para aumentar la racha.

### Puntuación

La primera casilla numérica establece la base. Después, cada 2 o 3 multiplica el resultado; los 1 no lo modifican.

```text
2 → ×2 → 3 → ×6 → 2 → ×12 → 3 → ×36
```

### MEMO

Activa **MEMO** para marcar una casilla sin descubrirla. El ciclo de marcas es:

```text
vacía → shock → 1 → 2 → 3 → vacía
```

En escritorio, el clic derecho elimina la marca. En dispositivos táctiles, una pulsación larga la elimina.

### Aislante anti-shock

Arma el aislante desde el HUD para neutralizar el próximo shock. Se consume al activarse. Puedes comprarlo en el Taller por **300 monedas** o recibirlo como recompensa cada tres pantallas completadas.

## Controles

| Control | Acción |
| --- | --- |
| Toque o clic | Revelar una casilla o colocar una marca MEMO |
| Clic derecho | Eliminar una marca MEMO |
| Pulsación larga | Eliminar una marca MEMO en táctil |
| `M` | Activar o desactivar MEMO |
| `S` | Armar o desarmar el aislante |
| `Esc` | Cerrar overlays y ventanas |

El botón **RENDIRSE** pide una confirmación mostrando «¿SEGURO?». Una segunda pulsación cobra las monedas acumuladas de la partida y vuelve al menú. No reinicia el tablero actual: la siguiente partida comienza siempre desde la pantalla 1.

El HUD también ofrece acceso rápido a sonido y vibración. Las preferencias se pueden modificar desde **⚙️ OPCIONES**.

## Progresión y economía

- El **Banco** conserva las monedas cobradas entre partidas.
- La **Partida** contiene las monedas de la racha actual.
- Si pierdes, las monedas de la partida se pierden, pero el banco permanece intacto.
- Puedes cobrar después de superar la primera pantalla; **RENDIRSE** envía las monedas actuales al banco y devuelve al menú para que la siguiente partida empiece en la pantalla 1.
- Continuar una racha ofrece un multiplicador adicional.
- Las repeticiones de pantallas inferiores al mejor nivel tienen una recompensa reducida.

## Taller

El Taller permite personalizar la experiencia sin alterar la lógica del puzzle:

- Elegir una de las cuatro pistas de música de partida, con preview breve al seleccionarla.
- Equipar temas de tablero y dorsos de carta.
- Cambiar el tamaño del tablero.
- Comprar aislantes y medallas de vitrina.
- Consultar el progreso de trofeos.

La música del menú y la música de partida son independientes y realizan una transición gradual al cambiar de contexto.

## Arquitectura

```text
Shock Flip/
├── index.html                    # Entrada y estructura de todas las pantallas
├── serve.mjs                     # Servidor estático local
├── README.md
├── game/
│   ├── css/
│   │   └── style.css             # Diseño, temas, responsive y animaciones
│   └── js/
│       ├── config.js             # Niveles, constantes y claves de persistencia
│       ├── collection.js         # Temas, skins, medallas, trofeos y persistencia
│       ├── logic.js              # Tableros, pistas, puntuación y economía pura
│       ├── game.js               # Controlador de UI y flujo de partida
│       ├── audio.js              # Música y efectos con Web Audio API
│       ├── particles.js          # Partículas ambientales y efectos de canvas
│       ├── haptic.js             # Vibración progresiva en dispositivos compatibles
│       └── rarity.js              # Efectos de rareza y compras de medallas
├── test/
│   ├── logic.test.js             # Pruebas de lógica, economía y cobro
│   ├── collection.test.js        # Persistencia y colección
│   ├── rarity.test.js             # Rarezas y compras
│   ├── game-flow.test.js         # Regresiones de flujo y HUD
│   └── simulate.test.js          # Simulaciones de partidas y economía
└── public/
    ├── manifest.webmanifest      # Configuración PWA
    └── assets/icons/             # Iconos de instalación
```

## Tests

La suite utiliza el test runner integrado de Node.js y no requiere instalar dependencias:

```bash
node --test
```

También es compatible con Bun:

```bash
bun test
```

Las pruebas cubren generación de tableros, pistas, puntuación, economía, rachas, cobro, persistencia, rarezas, compras y transiciones entre pantallas.

## Persistencia

El juego guarda los datos localmente mediante `localStorage`:

| Clave | Contenido |
| --- | --- |
| `bombflip:coins` | Saldo del banco |
| `bombflip:sound` | Preferencia de efectos de sonido |
| `bombflip:music` | Pista de partida seleccionada |
| `bombflip:musicOn` | Preferencia de música activada |
| `bombflip:haptics` | Preferencia de vibración |
| `bombflip:theme` | Tema `dark`, `light` o `auto` |
| `bombflip:collection` | Temas, dorsos, medallas, trofeos y aislantes |
| `bombflip:stats` | Estadísticas y récords de juego |

El prefijo histórico `bombflip:` se conserva para no perder el progreso guardado durante la evolución de la identidad a SHOCK FLIP.

## Principios técnicos

- Sin frameworks ni dependencias de runtime.
- Sin samples de audio externos: la música y los efectos se sintetizan en el navegador.
- Sin assets visuales externos para la interfaz: los iconos principales son SVG inline.
- Generación aleatoria con Fisher–Yates y lógica separada del DOM.
- Canvas independiente para partículas ambientales y efectos.
- Diseño adaptado a teclado, ratón, pantallas táctiles y dispositivos con notch.
- Cambios visuales y preferencias persistidos localmente.

## Licencia y créditos

Proyecto original de SHOCK FLIP. La implementación, los estilos, los iconos y el sistema de audio son propios. La referencia conceptual se limita a la idea general de puzzles de multiplicadores; no se incluyen marcas, código, gráficos ni audio de terceros.
