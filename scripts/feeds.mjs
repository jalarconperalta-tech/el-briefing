#!/usr/bin/env node
// Lee los feeds de config/briefing.json y lista las noticias candidatas de la
// ventana de tiempo, con una puntuación orientativa según los pesos de la
// configuración. Es una ayuda para elegir: la decisión final la toma la tarea
// siguiendo EDITORIAL.md (la clasificación por palabras clave es aproximada).
//
// Uso:  node scripts/feeds.mjs [--horas N] [--todos] [--json]
//   --horas N  ventana en horas (por defecto 24; los lunes, la de fin de semana)
//   --todos    muestra también las descartadas (temas excluidos y filtros)
//   --json     salida en JSON

import { readFile } from 'node:fs/promises';

const cfg = JSON.parse(await readFile(new URL('../config/briefing.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };

const esLunes = new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid', weekday: 'short' }) === 'Mon';
const horas = Number(val('--horas')) || (esLunes ? cfg.ventana.horas_lunes : cfg.ventana.horas);
const desde = Date.now() - horas * 3600e3;

const UA = 'Mozilla/5.0 (compatible; ElBriefing/1.0; +https://jalarconperalta-tech.github.io/el-briefing/)';
const temas = cfg.temas;
const temaPorId = Object.fromEntries(temas.map((t) => [t.id, t]));
const { coeficientes: K } = cfg.seleccion;

// ---------- lectura de feeds ----------
function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}
const tag = (xml, names) => {
  for (const n of names) {
    const m = xml.match(new RegExp(`<${n}\\b[^>]*>([\\s\\S]*?)</${n}>`, 'i'));
    if (m) return decodeEntities(m[1]);
  }
  return '';
};

async function leerFeed(f) {
  const res = await fetch(f.feed, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const head = buf.subarray(0, 300).toString('latin1');
  const enc = /encoding=["']iso-8859-1["']/i.test(head) ? 'latin1' : 'utf8';
  const xml = buf.toString(enc);
  const bloques = xml.match(/<item\b[\s\S]*?<\/item>|<entry\b[\s\S]*?<\/entry>/gi) || [];
  if (!bloques.length) throw new Error('sin noticias (¿no es un feed?)');
  return bloques.map((b) => {
    let link = tag(b, ['link']);
    if (!link) link = (b.match(/<link\b[^>]*href=["']([^"']+)["']/i) || [])[1] || '';
    let titulo = tag(b, ['title']);
    let medio = tag(b, ['source']);
    const google = /news\.google\.com/.test(f.feed);
    if (google && medio && titulo.endsWith(` - ${medio}`)) titulo = titulo.slice(0, -(medio.length + 3));
    const fecha = Date.parse(tag(b, ['pubDate', 'published', 'updated', 'dc:date'])) || null;
    return { fuente: f.id, medio: medio || f.nombre, titulo, url: decodeEntities(link), fecha, google };
  });
}

// ---------- clasificación ----------
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patron = (kw) => {
  const acronimo = kw.length <= 4 && kw === kw.toUpperCase();
  return new RegExp(`(?<![\\p{L}\\p{N}])${esc(kw)}(?![\\p{L}\\p{N}])`, acronimo ? 'u' : 'iu');
};
const patrones = Object.fromEntries(temas.map((t) => [t.id, t.palabras_clave.map(patron)]));
const aciertos = (texto, id) => patrones[id].filter((re) => re.test(texto)).length;

const RE_EUROPA = /(?<![\p{L}])(UE|Bruselas|Unión Europea|Eurozona|zona euro|BCE|ECB|Comisión Europea|Eurogrupo)(?![\p{L}])/u;
const RE_BOLSILLO = /hipoteca|alquiler|precio|impuesto|IRPF|deducci|sueldo|salario|pensi|ahorro|factura|cuota|devoluci|Euríbor|tipos/i;
const RE_OPORTUNIDAD = /plazo|convocatoria|\bayudas\b|subvenci|\bbecas?\b|solicitar|requisitos|oposici|inscripci/i;
const RE_ANALISIS = /claves|escenario|qué (se juega|cambia|supone|significa)|por qué|cómo afecta|\?/i;

function clasificar(n) {
  const texto = n.titulo;
  const hits = temas.map((t) => ({ t, h: aciertos(texto, t.id) })).filter((x) => x.h > 0);
  const permitidos = hits.filter((x) => x.t.prioridad !== 'excluir');
  const excluidos = hits.filter((x) => x.t.prioridad === 'excluir');
  const hp = permitidos.reduce((a, x) => a + x.h, 0);
  const he = excluidos.reduce((a, x) => a + x.h, 0);

  let tema; let factor = 1;
  if (hp > he) {
    tema = permitidos.sort((a, b) => b.h - a.h || b.t.peso - a.t.peso)[0].t;
  } else if (he > 0) {
    tema = excluidos.sort((a, b) => b.h - a.h || b.t.peso - a.t.peso)[0].t;
  } else {
    // Sin palabras clave: se asume el primer tema de la fuente, con menos peso.
    tema = temaPorId[cfg.fuentes.find((f) => f.id === n.fuente)?.temas?.[0]] || temaPorId.politica_espana;
    factor = 0.8;
  }

  let ambito = 'espana';
  if (aciertos(texto, 'aragon')) ambito = 'aragon';
  else if (aciertos(texto, 'italia')) ambito = 'italia';
  else if (RE_EUROPA.test(texto)) ambito = 'europa';
  else if (aciertos(texto, 'internacional') || /hl=en/.test(cfg.fuentes.find((f) => f.id === n.fuente)?.feed || '')) ambito = 'global';
  if (n.fuente === 'ansa') ambito = 'italia';

  let enfoque = 'hechos_datos';
  if (RE_OPORTUNIDAD.test(texto)) enfoque = 'oportunidad_accionable';
  else if (RE_BOLSILLO.test(texto)) enfoque = 'impacto_bolsillo';
  else if (RE_ANALISIS.test(texto)) enfoque = 'analisis_contexto';

  const puntuacion = factor * (K.tema * tema.peso) + K.enfoque * cfg.enfoques[enfoque].peso + K.ambito * cfg.ambitos[ambito].peso;
  return { ...n, tema: tema.id, prioridad: tema.prioridad, ambito, enfoque, puntuacion: Math.round(puntuacion * 10) / 10 };
}

function motivoDescarte(n) {
  const f = cfg.filtros;
  const url = n.url.toLowerCase();
  if (!n.google && f.descartar_urls_con.some((p) => url.includes(p))) return 'opinión/sección excluida';
  if (f.descartar_titulos_con.some((p) => n.titulo.toLowerCase().includes(p.toLowerCase()))) return 'titular excluido';
  if (n.prioridad === 'excluir') return `tema excluido (${temaPorId[n.tema].nombre})`;
  if (n.prioridad === 'media' && n.puntuacion < cfg.seleccion.umbral_media) return 'tema medio bajo el umbral';
  return '';
}

// ---------- ejecución ----------
const conFeed = cfg.fuentes.filter((f) => f.feed);
const resultados = await Promise.allSettled(conFeed.map(leerFeed));
const fallos = [];
let todas = [];
resultados.forEach((r, i) => {
  if (r.status === 'fulfilled') todas.push(...r.value);
  else fallos.push(`${conFeed[i].id}: ${r.reason?.message || r.reason}`);
});

const admitidos = (cfg.filtros.medios_google_news_admitidos || []).map((m) => m.toLowerCase());
// Nombre exacto, o seguido de " - …" (p. ej. "EFE - Agencia de noticias"); así "El Mundo Financiero" no pasa por "El Mundo".
const medioAdmitido = (n) => {
  if (!n.google) return true;
  const medio = n.medio.toLowerCase().trim();
  return admitidos.some((m) => medio === m || medio.startsWith(`${m} - `));
};
const vistos = new Set();
todas = todas
  .filter((n) => n.titulo && (n.fecha === null || n.fecha >= desde) && medioAdmitido(n))
  .filter((n) => { const k = n.titulo.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); if (vistos.has(k)) return false; vistos.add(k); return true; })
  .map(clasificar)
  .map((n) => ({ ...n, descarte: motivoDescarte(n) }))
  .sort((a, b) => b.puntuacion - a.puntuacion);

const candidatas = todas.filter((n) => !n.descarte);
const descartadas = todas.filter((n) => n.descarte);

if (flag('--json')) {
  console.log(JSON.stringify({ horas, fallos, candidatas, descartadas: flag('--todos') ? descartadas : descartadas.length }, null, 2));
} else {
  const fecha = (t) => (t ? new Date(t).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 's/f');
  console.log(`Ventana: últimas ${horas} h · ${conFeed.length - fallos.length}/${conFeed.length} feeds leídos · ${candidatas.length} candidatas · ${descartadas.length} descartadas`);
  if (fallos.length) console.log(`Feeds con error (seguir con el resto y decirlo al final): ${fallos.join(' · ')}`);
  for (const t of temas.filter((t) => t.prioridad !== 'excluir')) {
    const porFuente = {};
    const lista = candidatas.filter((n) => n.tema === t.id)
      .filter((n) => (porFuente[n.fuente] = (porFuente[n.fuente] || 0) + 1) <= 4)
      .slice(0, 15);
    console.log(`\n## ${t.nombre} · peso ${t.peso} · prioridad ${t.prioridad} · cupo ${t.cupo.join('-')} · ${lista.length ? '' : 'SIN CANDIDATAS'}`);
    for (const n of lista) {
      const aviso = n.google ? ' [Google News: buscar URL original]' : '';
      console.log(`- ${n.puntuacion} | ${n.ambito} | ${n.enfoque} | ${n.medio} | ${fecha(n.fecha)} | ${n.titulo.length > 200 ? n.titulo.slice(0, 200) + '…' : n.titulo}\n  ${n.google ? '(enlace de Google News, no usar como fuente)' : n.url}${aviso}`);
    }
  }
  if (flag('--todos')) {
    console.log('\n## Descartadas');
    for (const n of descartadas) console.log(`- ${n.descarte} | ${n.medio} | ${n.titulo}`);
  }
}
