#!/usr/bin/env node
// Valida editions/*.json y editions/index.json contra schema/. Sin dependencias.
// Uso: node scripts/validate.mjs   (código de salida 1 si hay errores)
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const editionsDir = join(root, 'editions');
const errors = [];
const warnings = [];

function loadJSON(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    errors.push(`${file.slice(root.length + 1)}: JSON no válido (${e.message})`);
    return undefined;
  }
}

// Subconjunto de JSON Schema: type, enum, required, properties, additionalProperties,
// items, $ref (#/$defs/...), minItems, maxItems, minLength, maxLength, pattern, minimum, maximum.
function typeOk(type, v) {
  if (type === 'integer') return Number.isInteger(v);
  if (type === 'array') return Array.isArray(v);
  if (type === 'object') return v !== null && typeof v === 'object' && !Array.isArray(v);
  return typeof v === type;
}

function check(schema, v, path, rootSchema, out) {
  if (schema.$ref) return check(rootSchema.$defs[schema.$ref.replace('#/$defs/', '')], v, path, rootSchema, out);
  if (schema.type && !typeOk(schema.type, v)) return out.push(`${path}: debe ser ${schema.type}`);
  if (schema.enum && !schema.enum.includes(v)) out.push(`${path}: "${v}" no permitido (opciones: ${schema.enum.join(', ')})`);
  if (typeof v === 'string') {
    if (schema.minLength != null && v.trim().length < schema.minLength) out.push(`${path}: texto demasiado corto`);
    if (schema.maxLength != null && v.length > schema.maxLength) out.push(`${path}: texto demasiado largo (${v.length} > ${schema.maxLength})`);
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(v)) out.push(`${path}: formato no válido ("${v}")`);
  }
  if (typeof v === 'number') {
    if (schema.minimum != null && v < schema.minimum) out.push(`${path}: mínimo ${schema.minimum}`);
    if (schema.maximum != null && v > schema.maximum) out.push(`${path}: máximo ${schema.maximum}`);
  }
  if (Array.isArray(v)) {
    if (schema.minItems != null && v.length < schema.minItems) out.push(`${path}: al menos ${schema.minItems} elementos`);
    if (schema.maxItems != null && v.length > schema.maxItems) out.push(`${path}: como mucho ${schema.maxItems} elementos`);
    if (schema.items) v.forEach((x, i) => check(schema.items, x, `${path}[${i}]`, rootSchema, out));
  }
  if (typeOk('object', v)) {
    for (const k of schema.required || []) if (!(k in v)) out.push(`${path}: falta "${k}"`);
    for (const [k, x] of Object.entries(v)) {
      if (schema.properties?.[k]) check(schema.properties[k], x, `${path}.${k}`, rootSchema, out);
      else if (schema.additionalProperties === false) out.push(`${path}: campo no permitido "${k}"`);
    }
  }
}

function validDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const editionSchema = loadJSON(join(root, 'schema', 'edition.schema.json'));
const indexSchema = loadJSON(join(root, 'schema', 'index.schema.json'));
if (!editionSchema || !indexSchema) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const files = readdirSync(editionsDir).filter((f) => f.endsWith('.json') && f !== 'index.json').sort();
const editions = new Map();

for (const f of files) {
  const rel = `editions/${f}`;
  const out = [];
  if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(f)) { errors.push(`${rel}: el nombre debe ser AAAA-MM-DD.json`); continue; }
  const ed = loadJSON(join(editionsDir, f));
  if (ed === undefined) continue;
  check(editionSchema, ed, 'edición', editionSchema, out);
  if (!out.length) {
    const date = f.slice(0, 10);
    if (ed.date !== date) out.push(`date "${ed.date}" no coincide con el nombre del archivo`);
    if (!validDate(ed.date)) out.push(`date "${ed.date}" no es una fecha real`);
    const day = new Date(`${ed.date}T12:00:00Z`).getUTCDay();
    if (day === 0 || day === 6) warnings.push(`${rel}: es fin de semana`);
    if (ed.is_monday_weekend_recap !== (day === 1)) out.push('is_monday_weekend_recap debe ser true los lunes y false el resto de días');
    const ids = [...ed.opportunities, ...ed.stories].map((x) => x.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) out.push(`ids repetidos: ${[...new Set(dup)].join(', ')}`);
    ed.opportunities.forEach((o, i) => {
      if (o.kind === 'Inversión' && !/no asesoramiento financiero/i.test(o.note || '')) {
        out.push(`opportunities[${i}]: las de inversión deben llevar la nota "Información, no asesoramiento financiero"`);
      }
    });
    if (!ed.summary_30s.some((s) => /^Para ti:/i.test(s)) && ed.opportunities.length) {
      warnings.push(`${rel}: "En 30 segundos" no tiene un punto "Para ti: …"`);
    }
    editions.set(date, ed);
  }
  out.forEach((m) => errors.push(`${rel}: ${m}`));
}

const index = loadJSON(join(editionsDir, 'index.json'));
if (index !== undefined) {
  const out = [];
  check(indexSchema, index, 'índice', indexSchema, out);
  if (!out.length) {
    const dates = index.editions.map((e) => e.date);
    dates.forEach((d, i) => {
      if (i && d >= dates[i - 1]) out.push(`debe ir de más reciente a más antigua (${dates[i - 1]} → ${d})`);
    });
    for (const e of index.editions) {
      const ed = editions.get(e.date);
      if (!ed) {
        if (!files.includes(`${e.date}.json`)) out.push(`${e.date}: no existe editions/${e.date}.json`);
        continue;
      }
      if (e.stories !== ed.stories.length) out.push(`${e.date}: stories = ${e.stories}, pero la edición tiene ${ed.stories.length}`);
      if (e.opportunities !== ed.opportunities.length) out.push(`${e.date}: opportunities = ${e.opportunities}, pero la edición tiene ${ed.opportunities.length}`);
      const expected = ed.stories.slice(0, 3).map((s) => s.title);
      if (JSON.stringify(e.headlines) !== JSON.stringify(expected)) out.push(`${e.date}: headlines deben ser los títulos de las 3 primeras noticias, en orden`);
      if (Boolean(e.sample) !== Boolean(ed.sample)) out.push(`${e.date}: "sample" no coincide con la edición`);
    }
    for (const f of files) if (!dates.includes(f.slice(0, 10))) out.push(`falta ${f} en el índice`);
  }
  out.forEach((m) => errors.push(`editions/index.json: ${m}`));
}

warnings.forEach((w) => console.warn(`AVISO  ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`ERROR  ${e}`));
  console.error(`\n${errors.length} error(es). Corrígelos antes de publicar.`);
  process.exit(1);
}
console.log(`OK: ${files.length} edición(es) y el índice son válidos.`);
