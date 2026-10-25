// El Briefing: web estática, rutas por hash (#/ hoy, #/AAAA-MM-DD, #/hemeroteca).
const app = document.getElementById('app');
const READ_KEY = 'briefing:read:v1';
const TABS = ['Todo', 'Para ti', 'Política', 'Finanzas', 'Mundo'];
const TAGLINE = 'Lo que pasa en el mundo y lo que puedes aprovechar';

let indexCache = null;
let current = null; // { edition, tab }

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
function longDate(iso) {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseDate(iso));
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Estado de lectura: { "AAAA-MM-DD": ["c1", "o2", ...] }
function loadRead() {
  try { return JSON.parse(localStorage.getItem(READ_KEY)) || {}; } catch { return {}; }
}
function markRead(date, id) {
  const all = loadRead();
  const list = new Set(all[date] || []);
  if (list.has(id)) return;
  list.add(id);
  all[date] = [...list];
  try { localStorage.setItem(READ_KEY, JSON.stringify(all)); } catch { /* sin almacenamiento */ }
}
function readIds(date) {
  return new Set(loadRead()[date] || []);
}

async function getJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}
async function getIndex() {
  if (!indexCache) indexCache = (await getJSON('editions/index.json')).editions || [];
  return indexCache;
}

function masthead(small = false) {
  return `<header class="masthead${small ? ' small' : ''}">
    <h1><a href="#/">El Briefing</a></h1>
    <p class="tagline">${TAGLINE}</p>
  </header>`;
}

function sourcesList(sources) {
  return `<ul class="sources">${sources.map((s) =>
    `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a></li>`).join('')}</ul>`;
}

function oppCard(o, read) {
  return `<article class="card opp${read.has(o.id) ? ' is-read' : ''}" data-id="${esc(o.id)}">
    <button class="card-head" aria-expanded="false" aria-controls="b-${esc(o.id)}">
      <span class="meta"><span class="kind">${esc(o.kind)}</span>${o.deadline ? `<span class="deadline">${esc(o.deadline)}</span>` : ''}${read.has(o.id) ? '<span class="read">✓ Leída</span>' : ''}</span>
      <span class="card-title">${esc(o.title)}</span>
      <span class="fit"><b>Por qué tú:</b> ${esc(o.fit)}</span>
      <span class="foot meta"><span></span><span class="more">Ver <span class="chev" aria-hidden="true">⌄</span></span></span>
    </button>
    <div class="card-body" id="b-${esc(o.id)}" hidden>
      <p>${esc(o.detail)}</p>
      <h3 class="block-title">Qué hacer</h3>
      <p>${esc(o.action)}</p>
      <h3 class="block-title">Fuentes</h3>
      ${sourcesList(o.sources)}
      ${o.note ? `<p class="note">${esc(o.note)}</p>` : ''}
    </div>
  </article>`;
}

function storyCard(s, read) {
  const n = s.sources.length;
  return `<article class="card story${read.has(s.id) ? ' is-read' : ''}" data-id="${esc(s.id)}">
    <button class="card-head" aria-expanded="false" aria-controls="b-${esc(s.id)}">
      <span class="meta"><span class="kind">${esc(s.label)}</span>${read.has(s.id) ? '<span class="read">✓ Leída</span>' : ''}</span>
      <span class="card-title">${esc(s.title)}</span>
      <span class="dek">${esc(s.dek)}</span>
      <span class="foot meta"><span>${n} ${n === 1 ? 'fuente' : 'fuentes'} · ${s.read_minutes} min</span><span class="more">Leer <span class="chev" aria-hidden="true">⌄</span></span></span>
    </button>
    <div class="card-body" id="b-${esc(s.id)}" hidden>
      <h3 class="block-title">Qué ha pasado</h3>
      <ul>${s.what.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
      <h3 class="block-title">Por qué importa</h3>
      <p>${esc(s.why)}</p>
      <h3 class="block-title">Puntos de vista</h3>
      <div class="views">${s.views.map((v) => `<div class="view"><strong>${esc(v.label)}</strong>${esc(v.text)}</div>`).join('')}</div>
      <h3 class="block-title">Fuentes</h3>
      ${sourcesList(s.sources)}
    </div>
  </article>`;
}

function contentHtml(ed, tab, read) {
  const showOpps = (tab === 'Todo' || tab === 'Para ti') && ed.opportunities.length;
  const stories = tab === 'Todo' ? ed.stories : ed.stories.filter((s) => s.section === tab);
  let html = '';
  if (showOpps) {
    html += `<section class="radar" aria-labelledby="h-radar">
      <div class="section-head"><span class="kicker">Para ti</span><h2 id="h-radar">Radar de oportunidades</h2></div>
      ${ed.opportunities.map((o) => oppCard(o, read)).join('')}
    </section>`;
  }
  if (tab === 'Para ti' && !ed.opportunities.length) html += '<p class="empty">Hoy no hay oportunidades que encajen contigo.</p>';
  if (tab !== 'Para ti') {
    html += `<section aria-labelledby="h-news">
      <div class="section-head"><span class="kicker">${tab === 'Todo' ? 'Actualidad' : esc(tab)}</span><h2 id="h-news">Noticias</h2></div>
      ${stories.length ? stories.map((s) => storyCard(s, read)).join('') : '<p class="empty">Hoy no hay noticias en esta sección.</p>'}
    </section>`;
  }
  return html;
}

function progressHtml(ed, read) {
  const ids = [...ed.stories, ...ed.opportunities].map((x) => x.id);
  const done = ids.filter((id) => read.has(id)).length;
  const mins = ed.stories.reduce((a, s) => a + s.read_minutes, 0) + ed.opportunities.length;
  const pct = ids.length ? Math.round((done / ids.length) * 100) : 0;
  const n = ed.stories.length;
  return `<span class="progress-text">${n} ${n === 1 ? 'noticia' : 'noticias'} · ≈ ${mins} min</span>
    <span class="bar" role="progressbar" aria-label="Leídas" aria-valuemin="0" aria-valuemax="${ids.length}" aria-valuenow="${done}"><span style="width:${pct}%"></span></span>
    <span class="progress-text">${done}/${ids.length}</span>`;
}

function summaryItem(text) {
  const m = /^Para ti:\s*/i.exec(text);
  return m ? `<li><span class="for-you">Para ti:</span> ${esc(text.slice(m[0].length))}</li>` : `<li>${esc(text)}</li>`;
}

function renderEdition(ed, notice) {
  current = { edition: ed, tab: 'Todo' };
  const read = readIds(ed.date);
  const friday = parseDate(ed.date).getDay() === 5;
  document.title = `El Briefing · ${longDate(ed.date)}`;
  app.innerHTML = `
    <div class="topline"><span>${esc(longDate(ed.date))}</span><span>Edición ${esc(ed.edition_time)}</span></div>
    ${masthead()}
    ${ed.sample ? '<p class="notice sample"><strong>Edición de muestra.</strong> Contenido ficticio para probar la web.</p>' : ''}
    ${notice ? `<p class="notice">${notice}</p>` : ''}
    <section class="progress" aria-label="Progreso de lectura">${progressHtml(ed, read)}</section>
    <section class="summary" aria-labelledby="h-30s">
      <h2 class="block-title" id="h-30s">En 30 segundos</h2>
      <ul>${ed.summary_30s.map(summaryItem).join('')}</ul>
      ${ed.is_monday_weekend_recap ? '<p class="kicker recap-flag">Incluye resumen del fin de semana</p>' : ''}
    </section>
    <nav class="tabs" role="tablist" aria-label="Secciones">
      ${TABS.map((t) => `<button role="tab" aria-selected="${t === 'Todo'}" data-tab="${esc(t)}">${esc(t)}</button>`).join('')}
    </nav>
    <div id="content">${contentHtml(ed, 'Todo', read)}</div>
    <footer class="end">
      <p>Ya estás al día. ${friday ? 'Hasta el lunes a las 6:15.' : 'Hasta mañana a las 6:15.'}</p>
      <a class="btn" href="#/hemeroteca">Ver ediciones anteriores</a>
      <p class="disclaimer">Resúmenes generados con IA · enlace a la fuente original · no es asesoramiento financiero</p>
    </footer>`;
  window.scrollTo(0, 0);
}

async function renderArchive() {
  current = null;
  document.title = 'El Briefing · Hemeroteca';
  const list = await getIndex();
  const item = (e) => {
    const read = readIds(e.date).size;
    const total = e.stories + e.opportunities;
    const state = read === 0 ? ['new', 'Sin leer'] : read >= total ? ['done', 'Leída'] : ['partial', `${read}/${total} leídas`];
    return `<li data-text="${esc(norm(e.headlines.join(' ')))}">
      <a href="#/${esc(e.date)}">
        <span class="meta"><span class="state ${state[0]}">${state[1]}</span><span class="count">${e.opportunities} para ti</span>${e.sample ? '<span class="count">Muestra</span>' : ''}</span>
        <span class="date">${esc(longDate(e.date))}</span>
        <ul class="heads">${e.headlines.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
      </a>
    </li>`;
  };
  app.innerHTML = `
    <div class="topline"><a class="back" href="#/">← Hoy</a><span>Hemeroteca</span></div>
    ${masthead(true)}
    <div class="search">
      <label class="kicker" for="q">Buscar en los titulares</label>
      <input id="q" type="search" autocomplete="off" placeholder="Ej.: BCE, vivienda, ayudas…">
    </div>
    <ul class="archive" id="archive">${list.map(item).join('')}</ul>
    <p class="empty" id="no-results" hidden>Ningún titular coincide con la búsqueda.</p>`;
  window.scrollTo(0, 0);
}

function renderError(msg) {
  current = null;
  app.innerHTML = `${masthead()}<p class="empty">${msg}</p><p style="text-align:center"><a class="btn" href="#/hemeroteca">Ver ediciones anteriores</a></p>`;
}

async function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  try {
    if (hash === 'hemeroteca') return await renderArchive();
    const list = await getIndex();
    if (!list.length) return renderError('Todavía no hay ninguna edición publicada.');
    if (/^\d{4}-\d{2}-\d{2}$/.test(hash)) {
      if (!list.some((e) => e.date === hash)) return renderError(`No hay edición del ${esc(longDate(hash))}.`);
      return renderEdition(await getJSON(`editions/${hash}.json`));
    }
    const today = todayISO();
    const latest = list.find((e) => e.date <= today) || list[list.length - 1];
    const notice = latest.date === today ? '' : `Hoy no hay edición. Esta es la última disponible: ${esc(longDate(latest.date))}.`;
    renderEdition(await getJSON(`editions/${latest.date}.json`), notice);
  } catch (e) {
    console.error(e);
    renderError('No se ha podido cargar el briefing. Comprueba la conexión y vuelve a intentarlo.');
  }
}

app.addEventListener('click', (ev) => {
  const tab = ev.target.closest('[data-tab]');
  if (tab && current) {
    current.tab = tab.dataset.tab;
    app.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === tab)));
    app.querySelector('#content').innerHTML = contentHtml(current.edition, current.tab, readIds(current.edition.date));
    return;
  }
  const head = ev.target.closest('.card-head');
  if (!head || !current) return;
  const card = head.closest('.card');
  const body = card.querySelector('.card-body');
  const open = head.getAttribute('aria-expanded') !== 'true';
  head.setAttribute('aria-expanded', String(open));
  body.hidden = !open;
  if (open && !card.classList.contains('is-read')) {
    markRead(current.edition.date, card.dataset.id);
    card.classList.add('is-read');
    head.querySelector('.meta').insertAdjacentHTML('beforeend', '<span class="read">✓ Leída</span>');
    app.querySelector('.progress').innerHTML = progressHtml(current.edition, readIds(current.edition.date));
  }
});

app.addEventListener('input', (ev) => {
  if (ev.target.id !== 'q') return;
  const q = norm(ev.target.value.trim());
  let shown = 0;
  app.querySelectorAll('#archive > li').forEach((li) => {
    const ok = !q || li.dataset.text.includes(q);
    li.hidden = !ok;
    if (ok) shown++;
  });
  app.querySelector('#no-results').hidden = shown > 0;
});

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
