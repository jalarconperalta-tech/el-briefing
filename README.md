# El Briefing

Newsletter diaria personal en forma de web estática tipo periódico, pensada para leer en el móvil. Coste: 0 €.

## Cómo funciona
1. Cada mañana laborable, una **tarea programada de Claude** (plan Claude Pro) lee [`EDITORIAL.md`](EDITORIAL.md), escribe `editions/AAAA-MM-DD.json`, actualiza `editions/index.json`, ejecuta el validador y hace push a `main`. Este repositorio no genera contenido ni usa ninguna API de IA.
2. **GitHub Actions** (`.github/workflows/deploy.yml`):
   - valida con `node scripts/validate.mjs`; si falla, no se publica y la web sigue con la edición anterior;
   - publica la web en **GitHub Pages**;
   - si el push añadió una edición nueva (que no sea la de muestra), envía una notificación con **ntfy.sh** al topic guardado en el secreto `NTFY_TOPIC`. Al pulsarla se abre esa edición.
3. La web lee los JSON en el navegador. No hay servidor ni paso de build.

## Estructura
| Ruta | Qué es |
|---|---|
| `index.html`, `styles.css`, `app.js` | La web (HTML, CSS y JavaScript sin frameworks). |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA instalable en la pantalla de inicio. |
| `editions/AAAA-MM-DD.json` | Una edición por día laborable. |
| `editions/index.json` | Lista de ediciones, de la más reciente a la más antigua. |
| `schema/edition.schema.json`, `schema/index.schema.json` | Formato de los datos (JSON Schema). |
| `scripts/validate.mjs` | Validador sin dependencias. |
| `EDITORIAL.md` | Reglas para la tarea diaria. |

## Rutas de la web
- `#/` → la edición de hoy (o la última disponible, con aviso, si hoy no hay).
- `#/AAAA-MM-DD` → una edición concreta.
- `#/hemeroteca` → todas las ediciones, con buscador por titulares.

El estado de lectura (tarjetas desplegadas) se guarda solo en el navegador (`localStorage`).

## Probar en local
```bash
node scripts/validate.mjs
npx --yes serve .   # o cualquier servidor estático; abrir en ancho de móvil
```

## Edición de muestra
`editions/2026-10-23.json` lleva `"sample": true`: contenido ficticio para probar la web, no genera notificación. Se puede borrar (archivo y entrada del índice) cuando haya ediciones reales.

## Notificaciones
Instala la app **ntfy** en el iPhone y suscríbete al topic del secreto `NTFY_TOPIC` (servidor `ntfy.sh`). El nombre es largo y aleatorio porque cualquiera que lo conozca puede leer los avisos.

## Privacidad
El repositorio y la web son públicos. No se guardan datos personales: el perfil del lector va solo en las instrucciones privadas de la tarea programada.
