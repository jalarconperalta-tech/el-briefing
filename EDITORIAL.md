# Reglas editoriales de El Briefing

Este documento lo lee cada mañana la tarea programada que escribe la edición. Es público: **no contiene ni debe recibir datos personales**. El perfil del lector para filtrar oportunidades está en las instrucciones privadas de la tarea.

## Selección: temas, enfoque y ámbito
La configuración completa (pesos, cupos, palabras clave, filtros y fuentes) está en `config/briefing.json`. Resumen:

- **Prioridad alta, siempre presentes y con más espacio:** Política España (10), Vivienda (9,5), Fiscalidad (9), Oportunidades (8,5), Italia (8).
- **Prioridad media, solo si hay algo relevante** (puntuación de 6 o más): Economía y BCE (6,5), Aragón y Zaragoza (6), Mercados (5,7).
- **Prioridad baja, solo si es una noticia muy grande** (abre al menos 3 de las fuentes de la lista o afecta directamente a España; como mucho 1 al día): IA y tecnología (4,6), Energía (4).
- **Excluidos:** Internacional (salvo Italia), Empresas, Cultura y sociedad, Deportes, Ciencia y salud. Una noticia de estos temas solo entra si se puede contar desde un tema permitido por su efecto directo (el petróleo en Mercados, una empresa que contrata en Oportunidades).
- **Enfoque preferido**, al elegir y al redactar: oportunidad accionable (7,8) > impacto en el bolsillo (6,8) > análisis y contexto (5,5) > hechos y datos (4,7) > curiosidad (1,5, evitar).
- **Ámbito:** Aragón (7) > Italia (6,7) > España (6,4) > global (4) > Europa (3,6).
- **Puntuación:** 0,60 × tema + 0,25 × enfoque + 0,15 × ámbito. Ordenar de mayor a menor; en caso de empate, Política España primero.
- Si un tema de prioridad alta no tiene nada en la ventana normal, buscar hasta 7 días atrás algo no publicado en las 3 ediciones anteriores. Si sigue sin haber nada, se omite: nunca relleno.
- **Nunca opinión presentada como noticia:** fuera columnas, tribunas, editoriales y blogs. Un titular valorativo o una frase entre comillas se reescribe atribuida («X afirma que…») o se descarta.

## Secciones
- `Política`, `Finanzas`, `Mundo` (campo `section`, fijo por el diseño). Política España y la política de Aragón van en `Política`; Vivienda, Fiscalidad, Economía y BCE, Mercados, IA y Energía en `Finanzas`; Italia en `Mundo`.
- El tema se ve en `label`, con el formato "Tema · Ámbito": "Política · España", "Vivienda · España", "Fiscalidad · España", "Italia · Economía", "Aragón · Vivienda".
- **Radar de oportunidades** (`opportunities`), con tipos `Carrera`, `Ayuda`, `Inversión` o `Formación`.

## Volumen
- Unas **10 noticias** (entre 8 y 12) para unos **7 minutos** de lectura en total, más 0 a 4 oportunidades.
- Reparto orientativo: Política España 2-3, Vivienda 1-2, Fiscalidad 1-2, Italia 1, Economía y BCE 0-2, Aragón 0-1, Mercados 0-1, e IA o Energía 0-1.
- Calidad antes que cantidad. **Sin relleno.** Si un día no hay oportunidades que encajen, `opportunities` va vacío.

## Objetividad y estructura de cada noticia
- Lenguaje neutro, sin adjetivos valorativos.
- Contrastar **al menos 2 fuentes por noticia**, priorizando agencias y fuentes oficiales (el esquema exige 2 o más en `sources`).
- **Hechos + por qué importa:** `what` son los hechos (2 a 4 puntos breves); `why` explica por qué importa, sin opinar, y cuando haya una consecuencia práctica termina con una frase que empieza por **"Qué significa para ti:"** (finanzas personales, vivienda o carrera, según el perfil privado de la tarea y sin datos personales).
- **Política, siempre con contraste de línea editorial:** `views` recoge cómo lo cuentan o qué defienden las dos partes, con la misma extensión y el mismo tono, sin veredicto. Apoyarse en medios de líneas distintas (El País o elDiario.es frente a El Mundo o ABC, además de las agencias) y citarlos en `sources`.
- En el resto de temas, `views` recoge las dos posturas reales que haya (Gobierno y oposición, ministerio y sector, a favor y en contra), también sin veredicto. Exactamente dos.
- Nada en italiano: las fuentes italianas se leen en su edición en inglés o en español.

## Derechos de autor
- Resúmenes **con palabras propias**. Nunca copiar párrafos.
- Como mucho **una cita breve (menos de 15 palabras) por fuente**, entre comillas.
- Enlazar **siempre** al artículo original (URL `https://`).

## Oportunidades
Inversión, ayudas y subvenciones, empleo y demanda de perfiles, formación y ventajas de ser pionero.
- Solo si **encajan con el perfil** que dan las instrucciones de la tarea.
- Cada una con **enlace a la fuente oficial**, **plazo** si existe (`deadline`: "Plazo: 30 oct", "Subasta: 4 nov" o "Tendencia") y una **acción concreta** (`action`).
- Las de `Inversión` llevan **siempre** en `note` el texto "Información, no asesoramiento financiero" (el validador lo comprueba).
- En `fit` **no se publican datos personales concretos** (sueldo, empresa, familia, edad exacta, dirección…): la web es pública. Escribir en general: "Encaja con un perfil que…".

## Lunes
- Incluir un resumen del fin de semana y poner `is_monday_weekend_recap: true`. El resto de días, `false` (el validador lo comprueba).

## Fuentes
Todas gratuitas. La lista con sus feeds comprobados está en `config/briefing.json` (`fuentes`).
- **Agencias (prioridad 1):** EFE, Europa Press (Nacional, Economía y Aragón), Reuters, AP y ANSA (en inglés).
- **Oficiales (prioridad 1):** BOE, BCE, Banco de España, INE, Agencia Tributaria y Comisión Europea; para oportunidades, además, BOA, DOUE y portal de financiación de la UE, ICO, Tesoro Público, CNMV, SEPE, ENISA y CDTI.
- **Economía:** Expansión, Cinco Días y elEconomista.
- **Regional:** Heraldo de Aragón.
- **Diarios para contrastar la política:** El País, elDiario.es, El Mundo, ABC y El Confidencial.
- Reuters, AP, EFE, elEconomista, INE, Agencia Tributaria, Comisión Europea y BOA se descubren con feeds de Google News porque no tienen RSS gratuito que funcione. **En `sources` nunca va un enlace de news.google.com:** hay que encontrar y abrir el artículo original.

## Formato
- Esquema: `schema/edition.schema.json`. Ejemplo completo: la edición de muestra en `editions/` (la que tiene `"sample": true`; nunca poner `sample` en una edición real).
- `summary_30s`: 3 o 4 frases; la última empieza por `Para ti:` si hay oportunidades.
- Ids: noticias `c1`, `c2`…; oportunidades `o1`, `o2`…
- `label`: "Tema · Ámbito" (ver Secciones).
- `read_minutes`: minutos realistas de lectura de la tarjeta desplegada (normalmente 1; la suma de la edición, unos 7).
- `edition_time`: "06:15".
- Ordenar las noticias de más a menos importante según la puntuación: las 3 primeras son los titulares del índice.

## Procedimiento de cada mañana
1. Ejecutar `node scripts/feeds.mjs`: lee todos los feeds y lista las candidatas por tema con una puntuación orientativa. La clasificación por palabras clave es aproximada: la decisión final es editorial. Si algún feed falla, seguir con el resto y decirlo en el resumen final. Completar con WebSearch y WebFetch, sobre todo para fuentes oficiales y oportunidades.
2. Leer las ediciones de los **3 días anteriores** (`editions/`) para no repetir noticias. Solo repetir si hay una novedad real, y decir cuál.
3. Escribir `editions/AAAA-MM-DD.json` (fecha de hoy) siguiendo el esquema.
4. Actualizar `editions/index.json`: añadir al **principio** de `editions` la entrada `{ "date", "stories", "opportunities", "headlines" }`, donde `stories` y `opportunities` son los números de elementos y `headlines` los títulos de las 3 primeras noticias, en el mismo orden.
5. Ejecutar `node scripts/validate.mjs` y corregir hasta que diga `OK`.
6. Hacer commit con el mensaje `Edición AAAA-MM-DD` y push a `main`.

Al hacer push, GitHub Actions valida, publica la web y envía la notificación al móvil.
