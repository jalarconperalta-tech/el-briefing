# Reglas editoriales de El Briefing

Este documento lo lee cada mañana la tarea programada que escribe la edición. Es público: **no contiene ni debe recibir datos personales**. El perfil del lector para filtrar oportunidades está en las instrucciones privadas de la tarea.

## Ámbito
- Actualidad **global, europea y española**.
- Nada local de Aragón o Zaragoza, salvo **oportunidades** relevantes para el perfil.

## Secciones
- `Política`, `Finanzas`, `Mundo` (campo `section` de cada noticia).
- **Radar de oportunidades** (`opportunities`), con tipos `Carrera`, `Ayuda`, `Inversión` o `Formación`.

## Volumen
- Unas **5 noticias** de actualidad como referencia. El número es variable: incluir más si hay novedades realmente relevantes, menos si no las hay.
- Calidad antes que cantidad. **Sin relleno.** Si un día no hay oportunidades que encajen, `opportunities` va vacío.

## Objetividad
- Lenguaje neutro, sin adjetivos valorativos.
- Contrastar **al menos 2 fuentes por noticia**, priorizando agencias (el esquema exige 2 o más en `sources`).
- En temas políticos, `views` recoge lo que defiende cada parte **con la misma extensión y el mismo tono**, sin dar veredicto. Exactamente dos puntos de vista.
- `why` explica por qué importa, sin opinar.

## Derechos de autor
- Resúmenes **con palabras propias**. Nunca copiar párrafos.
- Como mucho **una cita breve (menos de 15 palabras) por fuente**, entre comillas.
- Enlazar **siempre** al artículo original (URL `https://`).
- Financial Times y Bloomberg: solo lo que dicen sus titulares públicos.

## Oportunidades
Inversión, ayudas y subvenciones, empleo y demanda de perfiles, formación y ventajas de ser pionero.
- Solo si **encajan con el perfil** que dan las instrucciones de la tarea.
- Cada una con **enlace a la fuente oficial**, **plazo** si existe (`deadline`: "Plazo: 30 oct", "Subasta: 4 nov" o "Tendencia") y una **acción concreta** (`action`).
- Las de `Inversión` llevan **siempre** en `note` el texto "Información, no asesoramiento financiero" (el validador lo comprueba).
- En `fit` **no se publican datos personales concretos** (sueldo, empresa, familia, edad exacta, dirección…): la web es pública. Escribir en general: "Encaja con un perfil que…".

## Lunes
- Incluir un resumen del fin de semana y poner `is_monday_weekend_recap: true`. El resto de días, `false` (el validador lo comprueba).

## Fuentes
- **Agencias:** Reuters, AP, EFE, Europa Press.
- **España:** El País, El Mundo, ABC, elDiario.es, El Confidencial.
- **Economía:** Expansión, Cinco Días, elEconomista.es, Financial Times y Bloomberg (solo titulares públicos).
- **Europa y mundo:** Politico Europe, Euronews, BBC.
- **Oportunidades:** BOE, DOUE y portal de financiación de la UE, ICO, Tesoro Público, CNMV, SEPE y BOA (este último solo si encaja).

## Formato
- Esquema: `schema/edition.schema.json`. Ejemplo completo: la edición de muestra en `editions/` (la que tiene `"sample": true`; nunca poner `sample` en una edición real).
- `summary_30s`: 3 o 4 frases; la última empieza por `Para ti:` si hay oportunidades.
- Ids: noticias `c1`, `c2`…; oportunidades `o1`, `o2`…
- `label`: "Sección · Ámbito", por ejemplo "Política · España" o "Finanzas · Europa".
- `read_minutes`: minutos realistas de lectura de la tarjeta desplegada (1–3 normalmente).
- `edition_time`: "06:15".
- Ordenar las noticias de más a menos importante: las 3 primeras son los titulares del índice.

## Procedimiento de cada mañana
1. Leer las ediciones de los **3 días anteriores** (`editions/`) para no repetir noticias. Solo repetir si hay una novedad real, y decir cuál.
2. Escribir `editions/AAAA-MM-DD.json` (fecha de hoy) siguiendo el esquema.
3. Actualizar `editions/index.json`: añadir al **principio** de `editions` la entrada `{ "date", "stories", "opportunities", "headlines" }`, donde `stories` y `opportunities` son los números de elementos y `headlines` los títulos de las 3 primeras noticias, en el mismo orden.
4. Ejecutar `node scripts/validate.mjs` y corregir hasta que diga `OK`.
5. Hacer commit con el mensaje `Edición AAAA-MM-DD` y push a `main`.

Al hacer push, GitHub Actions valida, publica la web y envía la notificación al móvil.
