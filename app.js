/* MONOLITH — app logic */
'use strict';

/* ============ utils ============ */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const pad = n => String(n).padStart(2, '0');
const dk = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseDk = s => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fdate = s => { const d = parseDk(s); return MON[d.getMonth()] + ' ' + d.getDate(); };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = n => Math.round(n * 10) / 10;

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2200);
}
function modal(html) {
  $('#modalin').innerHTML = html;
  $('#modal').classList.add('on');
}
/* same modal, narrow — for the two-second popups that should not feel like a page */
function modalSm(html) {
  $('#modal').classList.add('sm');
  modal(html);
}
function closeModal() {
  $('#modal').classList.remove('on');
  $('#modal').classList.remove('sm');
  if (window._stream) { window._stream.getTracks().forEach(t => t.stop()); window._stream = null; }
}
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

/* ============ storage ============ */
const LS = 'monolith.v1';
function defaults() {
  return {
    /* left empty on purpose: the app asks for these in Settings rather than
       shipping one person's body in the source code */
    profile: { name: '', age: null, height: null, weight: null, start: null },
    logs: {}, measures: [], photos: [], jaw: {},
    /* which session runs on each weekday (0 = Sunday). null = rest day. */
    sched: { 0: null, 1: null, 2: 'PUSH', 3: 'PULL', 4: null, 5: 'LEGS', 6: null },
    /* per-session overrides: plan.PUSH = [{id,sets}...]. Absent = the built-in session. */
    plan: {},
    /* Monolith AI: the API key, the thread, and what it has cost so far */
    ai: { key: '', chat: [], spent: { in: 0, out: 0, cached: 0 } },
    prefs: { sound: true }, game: { seen: [] }, rpg: null
  };
}
let S = defaults();
try {
  const raw = localStorage.getItem(LS);
  if (raw) S = Object.assign(defaults(), JSON.parse(raw));
} catch (e) { console.warn('could not read saved data', e); }
/* The split used to be UPPER A / LEGS / UPPER B. Anything already saved under
   the old ids is rewritten once so the calendar, your per-session edits and the
   whole training history survive the move to push / pull / legs. Upper A becomes
   Push and Upper B becomes Pull, which is the closest honest mapping.
   Deliberately NOT in defaults(): an old save has no marker, so it migrates. */
const SES_OLD = { UPPER_A: 'PUSH', UPPER_B: 'PULL' };
function migrateSplit() {
  if (S.splitV === 2) return;
  let touched = 0;
  Object.keys(S.sched || {}).forEach(d => {
    if (SES_OLD[S.sched[d]]) { S.sched[d] = SES_OLD[S.sched[d]]; touched++; }
  });
  Object.keys(S.plan || {}).forEach(k => {
    if (SES_OLD[k]) { S.plan[SES_OLD[k]] = S.plan[k]; delete S.plan[k]; touched++; }
  });
  Object.keys(S.logs || {}).forEach(k => {
    const lg = S.logs[k];
    if (lg && SES_OLD[lg.s]) { lg.s = SES_OLD[lg.s]; touched++; }
  });
  S.splitV = 2;
  if (touched) console.info('migrated ' + touched + ' records from the old upper/lower split');
}

/* legacy: photo poses used to be stored in Spanish */
const POSE_MAP = { frente: 'front', espalda: 'back', lateral: 'side', doble: 'flex' };
S.photos.forEach(p => { if (POSE_MAP[p.pose]) p.pose = POSE_MAP[p.pose]; });

let saveT = null;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try { localStorage.setItem(LS, JSON.stringify(S)); }
    catch (e) { toast('Save failed'); console.error(e); }
  }, 120);
}

/* ---- photo storage ----
   Photos normally live in IndexedDB. But browsers BLOCK IndexedDB when the page
   is opened straight off the disk (file://), which silently broke every upload.
   So we detect that and fall back to localStorage with a smaller image. */
let _db = null;
let phMode = 'idb';          /* 'idb' | 'ls' */
const LSPH = 'monolith.ph.';

function idb() {
  return new Promise((res, rej) => {
    if (_db) return res(_db);
    let r;
    try { r = indexedDB.open('monolith', 1); } catch (e) { return rej(e); }
    r.onupgradeneeded = () => { r.result.createObjectStore('ph'); };
    r.onsuccess = () => { _db = r.result; res(_db); };
    r.onerror = () => rej(r.error);
  });
}
/* decide once, at boot, which store we can actually use */
function phInit() {
  return idb().then(() => { phMode = 'idb'; })
    .catch(() => {
      phMode = 'ls';
      console.warn('IndexedDB unavailable — photos will use localStorage (lower quality, less space). ' +
                   'Launch the app with start.cmd to get the full store.');
    });
}
function lsPut(id, data) {
  return new Promise((res, rej) => {
    try { localStorage.setItem(LSPH + id, data); res(); }
    catch (e) { rej(new Error('quota')); }
  });
}
function idbPut(id, data) {
  return idb().then(db => new Promise((res, rej) => {
    const t = db.transaction('ph', 'readwrite');
    t.objectStore('ph').put(data, id);
    t.oncomplete = () => res(); t.onerror = () => rej(t.error);
  }));
}
function phPut(id, data) {
  if (phMode === 'ls') return lsPut(id, data);
  return idbPut(id, data).catch(() => { phMode = 'ls'; return lsPut(id, data); });
}
function phGet(id) {
  const fromLs = () => {
    const v = localStorage.getItem(LSPH + id);
    return v ? Promise.resolve(v) : Promise.reject(new Error('missing'));
  };
  if (phMode === 'ls') return fromLs();
  return idb().then(db => new Promise((res, rej) => {
    const t = db.transaction('ph', 'readonly');
    const q = t.objectStore('ph').get(id);
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  })).then(v => v != null ? v : fromLs(), fromLs);
}
function phDel(id) {
  try { localStorage.removeItem(LSPH + id); } catch (e) {}
  if (phMode === 'ls') return Promise.resolve();
  return idb().then(db => new Promise((res, rej) => {
    const t = db.transaction('ph', 'readwrite');
    t.objectStore('ph').delete(id);
    t.oncomplete = () => res(); t.onerror = () => rej(t.error);
  })).catch(() => {});
}

/* ============ program calendar ============ */
function mondayOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const off = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - off);
  return x;
}
function ensureStart() {
  if (!S.profile.start) { S.profile.start = dk(mondayOf(new Date())); save(); }
  return parseDk(S.profile.start);
}
function weekOf(d) {
  const st = ensureStart();
  return Math.floor((mondayOf(d) - st) / 86400000 / 7) + 1;
}
/* Fixed weekly split, the same every week:
   Defaults to Tuesday PUSH / Wednesday PULL / Friday LEGS, but S.sched
   is the authority and the user edits it in the Plan tab.
   Upper gets 2 sessions a week, legs 1. */
function sessionFor(d) {
  if (weekOf(d) < 1) return null;
  const s = (S.sched || {})[d.getDay()];
  return (s && SESSIONS[s]) ? s : null;
}
/* Monday-first order, because that is how a training week reads. */
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];
function trainingDays() {
  return DOW_ORDER.filter(n => (S.sched || {})[n] && SESSIONS[(S.sched || {})[n]]);
}
function trainingDaysText() {
  const d = trainingDays().map(n => DAYS[n]);
  if (!d.length) return 'no training days set yet';
  if (d.length === 1) return d[0];
  return d.slice(0, -1).join(', ') + ' and ' + d[d.length - 1];
}
function restDaysText() {
  const d = DOW_ORDER.filter(n => trainingDays().indexOf(n) < 0).map(n => DAYS[n]);
  if (!d.length) return 'none — every day is a training day';
  return d.join(', ');
}
/* ============ what a session actually contains ============
   The built-in program is the default, never a cage: S.plan[sid] replaces it
   whenever the user has edited that session. Everything downstream reads
   through here, so there is exactly one source of truth. */
function sesList(sid) {
  const c = (S.plan || {})[sid];
  if (c && c.length) {
    return c.filter(x => x && EX[x.id])
            .map(x => ({ id: x.id, sets: clamp(Math.round(+x.sets) || EX[x.id].sets, 1, 6) }));
  }
  return (SESSIONS[sid] ? SESSIONS[sid].ex : []).map(id => ({ id: id, sets: EX[id].sets }));
}
function sesIds(sid) { return sesList(sid).map(x => x.id); }
function setsFor(sid, exId) {
  const it = sesList(sid).filter(x => x.id === exId)[0];
  return it ? it.sets : (EX[exId] ? EX[exId].sets : 3);
}
function sesTotal(sid) { return sesList(sid).reduce((a, x) => a + x.sets, 0); }
function sesEdited(sid) { const c = (S.plan || {})[sid]; return !!(c && c.length); }
/* write a session back, or drop the override entirely to return to the program */
function setSesList(sid, list) {
  S.plan = S.plan || {};
  if (!list) delete S.plan[sid];
  else S.plan[sid] = list.map(x => ({ id: x.id, sets: x.sets }));
  save();
}

/* A short description of whoever is using this copy, built from Settings.
   Empty profile gives 'beginner', which is true of everyone on day one. */
function profileLine() {
  const p = S.profile || {};
  const bits = [];
  if (p.height) bits.push(p.height + ' cm');
  if (bodyWSource() !== 'default') bits.push(r1(bodyW()) + ' kg');
  bits.push(LANG === 'es' ? 'principiante' : 'beginner');
  return bits.join(' · ');
}

/* the scheduled session, or one the user forced on that day */
function sidFor(d) {
  const s = sessionFor(d);
  if (s) return s;
  const lg = S.logs[dk(d)];
  return (lg && lg.s) || null;
}
function blockOf(wk) {
  const w = ((wk - 1) % 12) + 1;
  return BLOCKS.find(b => w >= b.w[0] && w <= b.w[1]) || BLOCKS[0];
}
function cycleWeek(wk) { return ((wk - 1) % 12) + 1; }

/* ============ log access ============ */
function logFor(key, sid) {
  if (!S.logs[key]) S.logs[key] = { s: sid, sets: {}, chk: {}, notes: '', done: false };
  if (sid && S.logs[key].s !== sid) S.logs[key].s = sid;
  return S.logs[key];
}
function setsOf(key, exId) {
  const lg = S.logs[key]; if (!lg) return [];
  return lg.sets[exId] || [];
}
function lastPerf(exId, exceptKey) {
  const keys = Object.keys(S.logs).filter(k => k !== exceptKey).sort().reverse();
  for (const k of keys) {
    const a = (S.logs[k].sets || {})[exId];
    if (a && a.some(s => s.done && s.r)) return { key: k, sets: a.filter(s => s.done && s.r) };
  }
  return null;
}
/* double progression: suggest a weight increase */
function suggest(exId, exceptKey, need) {
  const ex = EX[exId]; const lp = lastPerf(exId, exceptKey);
  if (!lp || !ex.inc) return null;
  const done = lp.sets;
  if (done.length < (need || ex.sets)) return null;
  const allTop = done.every(s => +s.r >= ex.hi);
  const easy = done.every(s => s.rir === '' || s.rir == null || +s.rir >= 1);
  const w = +done[0].w || 0;
  if (allTop && easy && w > 0) return { w: r1(w + ex.inc), from: w };
  return null;
}

/* ============ navigation ============ */
const TAB_IDS = ['today', 'coach', 'quest', 'photos', 'symmetry', 'measure', 'progress', 'plan', 'guide'];
function tabs() { return TAB_IDS.map(id => [id, tr('tab_' + id)]); }
let cur = 'today';
function nav() {
  $('#nav').innerHTML = tabs().map(x =>
    '<button data-t="' + x[0] + '" class="' + (x[0] === cur ? 'on' : '') + '">' + x[1] + '</button>').join('');
}
/* ---- language toggle ----
   applyLang() rewrites the data objects in place, so a full re-render is all
   that is needed: nothing else in the app has to know a language exists. */
function setLang(l) {
  S.prefs = S.prefs || {};
  S.prefs.lang = l;
  save();
  applyLang(l);
  paintLangBtn();
  nav();
  render(cur);
}
function paintLangBtn() {
  const b = $('#langbtn');
  if (!b) return;
  b.textContent = tr('lang_btn');
  b.title = tr('lang_title');
}
$('#nav').addEventListener('click', e => {
  const b = e.target.closest('button[data-t]'); if (!b) return;
  go(b.dataset.t);
});
function go(t) {
  cur = t; nav();
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + t));
  window.scrollTo({ top: 0, behavior: 'instant' });
  render(t);
}
function render(t) {
  ({ today: rToday, coach: rCoach, quest: rQuest, photos: rPhotos, symmetry: rSymmetry,
     measure: rMeasure, progress: rProgress, plan: rPlan, guide: rGuide })[t]();
  const wk = weekOf(new Date());
  const b = blockOf(wk);
  $('#wkbadge').textContent = tr('week') + ' ' + wk + ' · ' + tr('cycle') + ' ' + cycleWeek(wk) + '/12 · RIR ' + b.rir;
}

/* ============ VIEW: TODAY ============ */
let viewDate = new Date();

function rToday() {
  const d = viewDate, key = dk(d);
  const sid = sidFor(d);
  const wk = weekOf(d), blk = blockOf(wk);
  const isToday = key === dk(new Date());
  let h = '';

  h += '<div class="spread no-print" style="margin-bottom:14px">' +
    '<button class="btn sm gh" id="dprev">&larr;</button>' +
    '<div style="text-align:center"><div class="mono tiny">' + esc(DAYS[d.getDay()]) + ', ' + MON[d.getMonth()] + ' ' + d.getDate() + '</div>' +
    (isToday ? '<div class="tiny" style="color:var(--acc)">TODAY</div>' : '<div class="tiny"><a href="#" id="dtoday" style="color:var(--acc)">back to today</a></div>') +
    '</div>' +
    '<button class="btn sm gh" id="dnext">&rarr;</button></div>';

  h += gameStrip();

  if (!sid) {
    const nx = nextTraining(d);
    h += '<div class="card"><div class="daytag t-rest">REST DAY</div>' +
      '<div class="h-lg" style="margin:12px 0 8px">Recovery</div>' +
      '<p class="sub">Today is when muscle grows. Do not train out of anxiety: you trained well, now let your body build.</p>' +
      '<div class="hr"></div>' +
      '<div class="sec-t">What to actually do today</div>' +
      '<div class="cue">Walk 20–30 min, ride a bike easy, or play a light sport.</div>' +
      '<div class="cue">Eat well: protein at every meal.</div>' +
      '<div class="cue">Sleep 8–10 h. This is literally when you build muscle.</div>' +
      '<div class="cue">5–10 min of easy stretching if you feel tight.</div>' +
      '<div class="hr"></div>' +
      '<div class="spread"><div><div class="tiny">NEXT SESSION</div><div class="h-md">' +
      (nx ? SESSIONS[nx.s].label + ' · ' + DAYS[nx.d.getDay()] : '—') + '</div></div>' +
      '<button class="btn sm" id="gonext">View session</button></div></div>';

    h += '<div class="card flat no-print"><div class="sec-t">Want to train anyway?</div>' +
      '<p class="sub" style="margin-bottom:10px">Your training days are ' + trainingDaysText() + '. If you shift a day for a one-off reason, pick the session and it gets logged.</p>' +
      '<div class="row wrap">' + Object.keys(SESSIONS).map(k =>
        '<button class="btn sm" data-force="' + k + '">' + SESSIONS[k].label + '</button>').join('') + '</div></div>';

    h += renderJaw(key);

    $('#v-today').innerHTML = h;
    wireTodayNav();
    wireJaw(key);
    $$('[data-force]').forEach(b => b.onclick = () => { logFor(key, b.dataset.force); save(); rToday(); });
    const gn = $('#gonext'); if (gn && nx) gn.onclick = () => { viewDate = nx.d; rToday(); };
    return;
  }

  const lg = S.logs[key];
  h += renderSessionCard(sid, blk, wk, key, lg);
  h += renderWarmup(sid);
  h += renderExercises(sid, blk, key);
  h += renderFinish(key, sid);
  h += renderJaw(key);          /* secondary on a training day, so it goes last */
  if (!sessionFor(d)) {
    h += '<div class="card flat no-print"><div class="spread">' +
      '<span class="tiny">Extra day added manually. Your normal calendar is ' + trainingDaysText() + '.</span>' +
      '<button class="btn sm danger" id="unforce">Remove</button></div></div>';
  }
  $('#v-today').innerHTML = h;
  wireTodayNav();
  wireJaw(key);
  wireExercises(key, sid);
  wireFinish(key);
  wireExPhotos();
  const uf = $('#unforce');
  if (uf) uf.onclick = () => {
    if (!confirm('This deletes everything logged on this extra day. Sure?')) return;
    delete S.logs[key]; save(); rToday();
  };
}

/* ---- jawline & neck routine ---- */
function jawDone(key) { return (S.jaw && S.jaw[key]) || {}; }
function jawStreak() {
  let n = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const done = jawDone(dk(d));
    const any = JAW.some(j => done[j.id]);
    if (any) n++;
    else if (i > 0) break;               /* today not done yet does not break it */
    d.setDate(d.getDate() - 1);
  }
  return n;
}
function renderJaw(key) {
  const done = jawDone(key);
  const n = JAW.filter(j => done[j.id]).length;
  const streak = jawStreak();
  /* same numbers computeGame() pays out, so what you see here is what you get */
  const xpToday = n * 3 + (n === JAW.length ? 10 : 0);
  return '<details class="q" style="margin-bottom:14px"' + (n ? ' open' : '') + '>' +
    '<summary>Jawline &amp; neck &mdash; ' + n + '/' + JAW.length +
    (streak > 1 ? ' &middot; ' + streak + '-day streak' : '') +
    (xpToday ? ' <span class="pill good">+' + xpToday + ' XP</span>' : '') + '</summary><div>' +
    '<p>A jawline is mostly <b>revealed</b>, not built: body fat, bone structure and age decide most of it. What you can actually train is <b>head posture</b> and <b>neck size</b> — and that is what this routine does. Chewing devices and hard gum are left out on purpose: small payoff, real risk of jaw joint problems.</p>' +
    JAW.map(j => {
      const on = !!done[j.id];
      return '<div class="jaw' + (on ? ' on' : '') + '">' +
        '<div class="chk ' + (on ? 'on' : '') + '" data-jaw="' + j.id + '" style="margin-bottom:8px">' +
        '<div class="box">&#10003;</div><span><b>' + esc(j.n) + '</b> &middot; ' + esc(j.dose) +
        ' <span class="tiny mono" style="color:var(--acc)">+3 XP</span></span></div>' +
        '<div class="tiny mono" style="margin:0 0 6px 30px">' + esc(j.freq) + '</div>' +
        '<div style="margin-left:16px">' +
        '<div class="tiny" style="margin-bottom:6px">' + esc(j.why) + '</div>' +
        j.how.map(x => '<div class="cue">' + esc(x) + '</div>').join('') +
        '<div class="note w" style="margin:8px 0 0"><b>Careful:</b> ' + esc(j.care) + '</div>' +
        '</div></div>';
    }).join('') +
    '<div class="note" style="margin:14px 0 0">Each exercise you tick is <b>+3 XP</b>, and all four in the same day pays <b>+10 more</b> — ' +
    '<b>' + (JAW.length * 3 + 10) + ' XP a day</b> if you keep it up. A gym session is worth far more, on purpose: this is a five-minute habit, ' +
    'not a workout. A long run of days also nudges your <b>Discipline</b> attribute up, which is your Speed in combat.</div>' +
    '<div class="sec-t" style="margin:18px 0 8px">What actually decides it</div>' +
    '<div class="tw"><table><thead><tr><th>Factor</th><th>Reality</th></tr></thead><tbody>' +
    JAW_TRUTH.map(t => '<tr><td><b>' + esc(t[0]) + '</b></td><td class="tiny">' + esc(t[1]) + '</td></tr>').join('') +
    '</tbody></table></div>' +
    '<div class="note b" style="margin-top:12px"><b>Stop immediately</b> if you get jaw clicking, locking, pain in front of your ear, or headaches at the temples. That is TMJ trouble. It is mostly caused by hard chewing devices and mastic gum — which is exactly why they are not in this routine.</div>' +
    '</div></details>';
}
function wireJaw(key) {
  $$('[data-jaw]').forEach(el => el.onclick = () => {
    S.jaw = S.jaw || {};
    S.jaw[key] = S.jaw[key] || {};
    const id = el.dataset.jaw;
    if (S.jaw[key][id]) delete S.jaw[key][id]; else S.jaw[key][id] = true;
    if (!Object.keys(S.jaw[key]).length) delete S.jaw[key];
    save();
    rToday();
  });
}

function nextTraining(from) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 1; i <= 8; i++) {
    d.setDate(d.getDate() + 1);
    const s = sessionFor(d);
    if (s) return { d: new Date(d), s: s };
  }
  return null;
}
function wireTodayNav() {
  const p = $('#dprev'), n = $('#dnext'), t = $('#dtoday');
  if (p) p.onclick = () => { viewDate.setDate(viewDate.getDate() - 1); rToday(); };
  if (n) n.onclick = () => { viewDate.setDate(viewDate.getDate() + 1); rToday(); };
  if (t) t.onclick = e => { e.preventDefault(); viewDate = new Date(); rToday(); };
  const a = $('#toadv'); if (a) a.onclick = () => go('quest');
}

function renderSessionCard(sid, blk, wk, key, lg) {
  const ses = SESSIONS[sid], list = sesList(sid);
  const total = sesTotal(sid);
  let done = 0;
  if (lg) list.forEach(x => done += (lg.sets[x.id] || []).filter(s => s.done).length);
  const exDone = list.filter(x => setsOf(key, x.id).filter(y => y.done).length >= x.sets).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  /* One headline, one progress line, everything explanatory folded away.
     What you need mid-session is: which session, how far in, how hard. */
  return '<div class="card acc">' +
    '<div class="spread"><span class="daytag ' + ses.cls + '">' + ses.label + '</span>' +
    '<span class="pill">Week ' + cycleWeek(wk) + '/12</span></div>' +
    '<div class="h-lg" style="margin:12px 0 6px">' + ses.label + '</div>' +
    '<div class="tiny mono">~65 MIN &nbsp;·&nbsp; ' + total + ' WORKING SETS &nbsp;·&nbsp; RIR ' + blk.rir + '</div>' +
    '<div style="margin-top:15px"><div class="spread" style="margin-bottom:6px">' +
      '<span class="tiny">' + (done >= total ? 'ALL SETS DONE' : 'EXERCISE ' + Math.min(exDone + 1, list.length) + ' OF ' + list.length) + '</span>' +
      '<span class="mono tiny" id="seslab">' + done + '/' + total + ' sets</span></div>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div></div>' +
    '<details class="q" style="margin:15px 0 0"><summary>What this session is for</summary><div>' +
      '<p>' + ses.sub + '</p><p><b>Block goal:</b> ' + blk.goal + '</p>' +
      '<p class="tiny">' + esc(blk.name) + (sesEdited(sid) ? ' &middot; you have edited this session' : '') + '</p>' +
      '<button class="btn sm gh" id="editses" style="margin-top:10px">Edit this session</button>' +
      '</div></details>' +
    '</div>';
}
function st(v, k, d) {
  return '<div class="stat"><div class="v">' + v + '</div><div class="k">' + k + '</div>' + (d ? '<div class="d">' + d + '</div>' : '') + '</div>';
}

/* ---- after-workout popup ----
   Fires once, right after you close the session. Small on purpose: five ticks,
   no scrolling, and it is the same lg.chk store the old list used, so XP,
   Mastery and the achievements keep working untouched. */
function postCount(lg) { const c = (lg && lg.chk) || {}; return POST.filter(x => c[x[0]]).length; }
function postBody(key) {
  const lg = S.logs[key], c = (lg && lg.chk) || {}, n = postCount(lg);
  return '<div class="spread" style="margin-bottom:12px">' +
    '<div class="sec-t" style="margin:0">After workout</div>' +
    '<span class="pill ' + (n === POST.length ? 'good' : '') + '" id="pwn">' + n + '/' + POST.length + '</span></div>' +
    POST.map(x => '<div class="chk sm ' + (c[x[0]] ? 'on' : '') + '" data-post="' + x[0] + '">' +
      '<div class="box">&#10003;</div><span>' + x[1] + '</span></div>').join('') +
    '<div class="tiny" style="margin:10px 0 12px">' +
    (n === POST.length ? 'All five &mdash; that is the +30 XP.' : 'All five is worth +30 XP.') + '</div>' +
    '<div class="row" style="gap:8px">' +
    '<button class="btn sm gh" id="pwphoto" style="flex:1">Take the photo</button>' +
    '<button class="btn sm p" id="pwdone" style="flex:1">Done</button></div>';
}
function openPost(key) {
  modalSm(postBody(key));
  wirePost(key);
}
function wirePost(key) {
  $$('[data-post]').forEach(el => el.onclick = () => {
    const lg = logFor(key, sidFor(viewDate));
    const k = el.dataset.post;
    lg.chk[k] = !lg.chk[k]; save();
    el.classList.toggle('on', !!lg.chk[k]);
    const n = postCount(lg), pill = $('#pwn');
    if (pill) { pill.textContent = n + '/' + POST.length; pill.classList.toggle('good', n === POST.length); }
  });
  const ph = $('#pwphoto');
  if (ph) ph.onclick = () => { closeModal(); go('photos'); };
  const dn = $('#pwdone');
  if (dn) dn.onclick = () => { closeModal(); rToday(); };
}

function renderWarmup(sid) {
  const w = WARMUP[sid];
  return '<details class="q" style="margin-bottom:14px"><summary>Warm-up &mdash; 8 to 12 min</summary><div>' +
    '<p>The warm-up raises your temperature, preps your joints and makes you lift better. <b>It should not tire you out.</b> If you finish out of breath, you overdid it.</p>' +
    w.map(x => '<p><b>' + x[0] + ' &middot; ' + x[1] + '</b><br>' + x[2] + '</p>').join('') +
    '<p class="tiny">Ramp-up sets <b>do not count</b> as working sets: they are light rehearsals to wake up your nervous system and check that today\'s weight feels right.</p>' +
    '</div></details>';
}

function renderExercises(sid, blk, key) {
  const list = sesList(sid);
  /* The first exercise you have not finished is THE one. It is highlighted,
     it is the only one open, and finishing it opens the next automatically. */
  let nowIdx = list.findIndex(x => setsOf(key, x.id).filter(s => s.done).length < x.sets);
  let h = '<div class="spread"><div class="sec-t">The session</div>' +
    '<button class="btn sm gh no-print" id="editses2">Edit</button></div>';
  list.forEach((item, i) => {
    const id = item.id, nSets = item.sets;
    const ex = EX[id];
    const arr = setsOf(key, id);
    const nd = arr.filter(s => s.done).length;
    const sug = suggest(id, key, nSets);
    const lp = lastPerf(id, key);
    const rir = id === 'rdl' ? '3' : blk.rir;

    h += '<div class="ex' + (nd >= nSets ? ' done' : '') + (i === nowIdx ? ' now open' : '') + '" data-ex="' + id + '" data-sets="' + nSets + '">' +
      '<div class="ex-h"><div class="ex-n">' + (nd >= nSets ? '&#10003;' : (i + 1)) + '</div>' +
      '<div class="ex-t"><b>' + esc(ex.n) + '</b>' +
      '<div class="ex-meta">' + nSets + ' × ' + ex.lo + '-' + ex.hi + (ex.uni ? ' /leg' : '') +
        ' &nbsp;·&nbsp; RIR ' + rir + ' &nbsp;·&nbsp; ' + fmtRest(ex.rest) + ' rest</div>' +
      '<div class="row wrap" style="margin-top:7px">' +
        '<span class="pill">' + esc(ex.g) + '</span>' +
        (EX_MUS[id] ? '<span class="pill up">' + EX_MUS[id].p.map(muscName).map(esc).join(' + ') + '</span>' : '') +
        (sug ? '<span class="pill up">Go up to ' + sug.w + ' kg</span>' :
          (lp ? '<span class="pill">Last: ' + (lp.sets[0].w || '-') + ' kg &middot; ' + lp.sets.map(s => s.r).join(', ') + '</span>'
              : '<span class="pill warn">Start with ' + esc(START[id] ? START[id].w : '?') + '</span>')) +
        (nd > 0 && nd < nSets ? '<span class="pill warn">' + nd + '/' + nSets + '</span>' : '') +
      '</div><div class="nowtag">&#9656; do this now</div>' +
      '</div><div class="chev">&#9656;</div></div>' +
      '<div class="ex-b">' +
        '<div class="colh"><div>#</div><div>Kg</div><div>Reps</div><div>RIR</div><div>OK</div></div>' +
        Array.from({ length: nSets }, (_, si) => {
          const s = arr[si] || {};
          return '<div class="setrow" data-si="' + si + '">' +
            '<div class="sn">' + (si + 1) + '</div>' +
            '<input type="number" step="0.5" inputmode="decimal" data-f="w" placeholder="kg" value="' + (s.w != null ? s.w : '') + '">' +
            '<input type="number" inputmode="numeric" data-f="r" placeholder="' + ex.lo + '-' + ex.hi + '" value="' + (s.r != null ? s.r : '') + '">' +
            '<input type="number" inputmode="numeric" data-f="rir" placeholder="' + rir + '" value="' + (s.rir != null ? s.rir : '') + '">' +
            '<div class="ok' + (s.done ? ' on' : '') + '" data-ok>&#10003;</div></div>';
        }).join('') +
        (!lp && START[id] ? '<div class="note" style="margin-top:12px"><b>First time · start with ' + esc(START[id].w) + '.</b> ' +
          esc(START[id].why) + '<br><br><b>Test set:</b> do 10 reps with that weight. If you had 4 or more left, go up. If you barely got 8 or fewer, go down. If you had 2–3 left, that is your weight: start set 1 there.</div>' : '') +
        '<details class="q ex-help"><summary>' + (LANG === 'es' ? 'Cómo se hace · músculos · errores' : 'How it looks, muscles &amp; mistakes') + '</summary><div>' +
          exVisual(id) +
          '<div class="sec-t" style="margin:16px 0 6px">' + (LANG === 'es' ? 'Cómo hacerlo' : 'How to do it') + '</div>' +
          ex.cues.map(c => '<div class="cue">' + c + '</div>').join('') +
          '<div class="sec-t" style="margin:14px 0 6px">Where you should feel it</div>' +
          '<div class="cue">' + ex.feel + '</div>' +
          '<div class="sec-t" style="margin:14px 0 6px">Common mistakes</div>' +
          ex.errs.map(c => '<div class="cue bad">' + c + '</div>').join('') +
          '<div class="note w" style="margin-top:12px"><b>Is the weight too heavy?</b> ' + ex.heavy + '</div>' +
          (ex.alt && ex.alt !== '—' ? '<div class="note" style="margin-top:8px"><b>Alternative:</b> ' + ex.alt + '</div>' : '') +
        '</div></details>' +
      '</div></div>';
  });
  return h;
}
function fmtRest(s) { return s >= 60 ? (s % 60 === 0 ? (s / 60) + ' min' : Math.floor(s / 60) + ':' + pad(s % 60) + ' min') : s + ' s'; }

/* Only one exercise stays open at a time — the whole point is that the screen
   shows the set you are about to do and nothing competing with it. */
function openOnly(card) {
  $$('.ex').forEach(c => c.classList.toggle('open', c === card));
}
/* Recompute which card carries the "do this now" marker. */
function markNow() {
  const cards = $$('.ex');
  let found = false;
  cards.forEach(c => {
    const first = !found && !c.classList.contains('done');
    if (first) found = true;
    c.classList.toggle('now', first);   /* CSS reveals .nowtag inside .ex.now */
  });
}
function wireExercises(key, sid) {
  $$('.ex').forEach(card => {
    const id = card.dataset.ex, ex = EX[id];
    const nSets = +card.dataset.sets || setsFor(sid, id);
    card.querySelector('.ex-h').onclick = () => {
      if (card.classList.contains('open')) card.classList.remove('open');
      else openOnly(card);
    };
    $$('.setrow', card).forEach(row => {
      const si = +row.dataset.si;
      $$('input', row).forEach(inp => {
        inp.onchange = inp.onblur = () => writeSet(key, id, si, inp.dataset.f, inp.value);
      });
      row.querySelector('[data-ok]').onclick = () => {
        const lg = logFor(key, sidFor(viewDate));
        const arr = lg.sets[id] = lg.sets[id] || [];
        arr[si] = arr[si] || {};
        const now = !arr[si].done;
        arr[si].done = now;
        if (now) {
          $$('input', row).forEach(inp => { if (inp.value !== '') arr[si][inp.dataset.f] = inp.value; });
          if (arr[si].r == null || arr[si].r === '') arr[si].r = ex.hi;
          startTimer(ex.rest, ex.n + ' · set ' + (si + 1));
        }
        save();
        row.querySelector('[data-ok]').classList.toggle('on', now);
        refreshExHeader(card, id, key);
        markNow();
        /* last set of this exercise done? move the screen on for you */
        if (now && setsOf(key, id).filter(x => x.done).length >= nSets) {
          const cards = $$('.ex');
          const next = cards.slice(cards.indexOf(card) + 1).filter(c => !c.classList.contains('done'))[0];
          if (next) {
            openOnly(next);
            toast('Next: ' + EX[next.dataset.ex].n);
          } else {
            card.classList.remove('open');
            toast('All exercises done — close the session below');
          }
        }
      };
    });
  });
}
function writeSet(key, id, si, f, v) {
  const lg = logFor(key, sidFor(viewDate));
  const arr = lg.sets[id] = lg.sets[id] || [];
  arr[si] = arr[si] || {};
  arr[si][f] = v === '' ? null : v;
  save();
}
function refreshExHeader(card, id, key) {
  const nd = setsOf(key, id).filter(s => s.done).length;
  const nSets = +card.dataset.sets || EX[id].sets;
  card.classList.toggle('done', nd >= nSets);
  card.querySelector('.ex-n').innerHTML = nd >= nSets ? '&#10003;' : ($$('.ex').indexOf(card) + 1);
  const sid = sidFor(viewDate);
  if (!sid) return;
  const list = sesList(sid);
  const total = sesTotal(sid);
  let done = 0; list.forEach(x => done += setsOf(key, x.id).filter(s => s.done).length);
  const bar = $('#v-today .card.acc .bar > i'); if (bar) bar.style.width = (total ? Math.round(done / total * 100) : 0) + '%';
  const lab = $('#seslab'); if (lab) lab.textContent = done + '/' + total + ' sets';
  const fb = $('#finbar'); if (fb) fb.textContent = done + ' of ' + total + ' sets completed';
}

function renderFinish(key, sid) {
  const lg = S.logs[key];
  const total = sesTotal(sid);
  let done = 0; if (lg) sesIds(sid).forEach(id => done += (lg.sets[id] || []).filter(s => s.done).length);
  const enNow = done + (lg && lg.done ? 5 : 0);
  return '<div class="card"><div class="spread"><div class="sec-t" style="margin:0">Close the session</div>' +
    '<span class="echip">&#9889; +' + enNow + (lg && lg.done ? '' : ' so far') + '</span></div>' +
    '<div class="tiny" style="margin:8px 0 14px">' + done + ' set' + (done === 1 ? '' : 's') + ' &times; 1 energy' +
    (lg && lg.done ? ' + 5 for closing the session' : ', plus 5 more the moment you close it') +
    ' &mdash; spend it on the map in the Quest tab.</div>' +
    '<label class="f" style="margin-bottom:12px"><span>Notes (how you felt, aches, what went well)</span>' +
    '<textarea id="notes" rows="2" placeholder="e.g. bench felt easier, right shoulder a bit cranky on laterals.">' + esc(lg ? lg.notes : '') + '</textarea></label>' +
    '<div class="spread"><span class="tiny mono" id="finbar">' + done + ' of ' + total + ' sets completed</span>' +
    '<button class="btn ' + (lg && lg.done ? '' : 'p') + '" id="fin">' + (lg && lg.done ? 'Session closed &#10003;' : 'Finish session') + '</button></div>' +
    (lg && lg.done ? '<div class="spread" style="margin-top:14px">' +
      '<span class="tiny">After workout &mdash; ' + postCount(lg) + '/' + POST.length + '</span>' +
      '<button class="btn sm gh" id="reopost">Open the list</button></div>' : '') +
    '</div>';
}
function wireFinish(key) {
  const n = $('#notes');
  if (n) n.onchange = () => { logFor(key, sidFor(viewDate)).notes = n.value; save(); };
  const f = $('#fin');
  if (f) f.onclick = () => {
    const lg = logFor(key, sidFor(viewDate));
    lg.done = !lg.done; save();
    toast(lg.done ? 'Session logged' : 'Session reopened');
    rToday();
    if (lg.done) openPost(key);      /* the one moment this list is useful */
  };
  const rp = $('#reopost');
  if (rp) rp.onclick = () => openPost(key);
  const sid = sidFor(viewDate);
  ['editses', 'editses2'].forEach(bid => { const b = $('#' + bid); if (b && sid) b.onclick = () => openSesEdit(sid, rToday); });
}

/* ============ rest timer ============ */
let T = { left: 0, iv: null, ex: '' };
function startTimer(sec, label) {
  T.left = sec; T.ex = label;
  $('#tex').textContent = label;
  $('#timer').classList.add('on');
  $('#timer').classList.remove('ring');
  clearInterval(T.iv);
  T.iv = setInterval(tick, 1000);
  drawTimer();
}
function tick() {
  T.left--;
  if (T.left <= 0) {
    clearInterval(T.iv); T.left = 0;
    $('#timer').classList.add('ring');
    $('#tlab').textContent = 'READY — NEXT SET';
    beep();
    if (navigator.vibrate) try { navigator.vibrate([150, 80, 150]); } catch (e) {}
  }
  drawTimer();
}
function drawTimer() {
  $('#tt').textContent = Math.floor(T.left / 60) + ':' + pad(T.left % 60);
  if (T.left > 0) $('#tlab').textContent = 'REST';
}
$('#tskip').onclick = () => { clearInterval(T.iv); $('#timer').classList.remove('on', 'ring'); };
$('#tplus').onclick = () => {
  T.left += 30; $('#timer').classList.remove('ring');
  clearInterval(T.iv); T.iv = setInterval(tick, 1000); drawTimer();
};
function beep() {
  if (!S.prefs.sound) return;
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const ac = beep.ac || (beep.ac = new C());
    [0, 0.18, 0.36].forEach(t => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ac.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ac.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.14);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.16);
    });
  } catch (e) {}
}

/* ============ VIEW: PHOTOS ============ */
let poseFilter = 'all';
function rPhotos() {
  let h = '<div class="card"><div class="h-lg">Progress photos</div>' +
    '<p class="sub" style="margin-top:8px">Once a week, same day, same time, same place, same light. Do not pump up beforehand. That consistency is what makes the comparison mean anything.</p>' +
    '<div class="note" style="margin-top:12px"><b>Your photos never leave this computer.</b> They are stored in the browser on your machine. No server, no cloud, no account.</div>' +
    (phMode === 'ls' ? '<div class="note b" style="margin-top:10px"><b>Limited photo mode.</b> The browser blocks the proper photo store when the app is opened straight from the file, so photos are being saved smaller and space runs out fast. Close this tab and launch the app with <b>start.cmd</b> to fix it — everything else keeps working normally.</div>' : '') +
    '<div class="row wrap no-print" style="margin-top:14px">' +
    '<button class="btn p" id="cam">Take photo</button>' +
    '<button class="btn" id="upl">Upload from file</button>' +
    '<input type="file" id="file" accept="image/*" hidden>' +
    '</div></div>';

  h += '<div class="card"><div class="sec-t">How to take them properly</div>' +
    POSES.map(p => '<div class="cue"><b>' + p.n + ':</b> ' + p.tip + '</div>').join('') +
    '<div class="cue">Camera at chest height, about 2 metres away, portrait orientation. Use the 10-second timer.</div>' +
    '<div class="cue">Same clothes (shorts), plain background, no harsh shadows.</div>' +
    '<div class="cue">Relaxed, natural posture. If you tense up some days and not others, the comparison lies.</div></div>';

  const list = S.photos.slice().sort((a, b) => b.id - a.id)
    .filter(p => poseFilter === 'all' || p.pose === poseFilter);

  h += '<div class="card"><div class="spread" style="margin-bottom:12px">' +
    '<div class="sec-t" style="margin:0">Gallery · ' + S.photos.length + ' photos</div>' +
    (S.photos.length >= 2 ? '<button class="btn sm" id="cmp">Compare</button>' : '') + '</div>' +
    '<div class="row wrap no-print" style="margin-bottom:12px">' +
    ['all'].concat(POSES.map(p => p.k)).map(k =>
      '<button class="btn sm ' + (poseFilter === k ? 'p' : 'gh') + '" data-pose="' + k + '">' + k + '</button>').join('') +
    '</div>';

  if (!list.length) {
    h += '<div class="drop" id="drop2">No photos yet.<br>Take the first one today: it is your ground zero and you cannot get it back later.</div>';
  } else {
    h += '<div class="pgrid" id="pgrid">' + list.map(p =>
      '<div class="ph" data-ph="' + p.id + '"><img data-src="' + p.id + '" alt="">' +
      '<div class="pose">' + p.pose + '</div>' +
      (p.marks ? '<div class="mk">&#9679;</div>' : '') +
      '<div class="cap">' + fdate(p.date) + '</div></div>').join('') + '</div>';
  }
  h += '</div>';
  $('#v-photos').innerHTML = h;

  $('#upl').onclick = () => $('#file').click();
  $('#file').onchange = e => { if (e.target.files[0]) addPhoto(e.target.files[0]); };
  $('#cam').onclick = openCamera;
  const d2 = $('#drop2'); if (d2) d2.onclick = () => $('#file').click();
  const c = $('#cmp'); if (c) c.onclick = openCompare;
  $$('[data-pose]').forEach(b => b.onclick = () => { poseFilter = b.dataset.pose; rPhotos(); });
  $$('#pgrid img[data-src]').forEach(img => {
    phGet(+img.dataset.src).then(d => { if (d) img.src = d; }).catch(() => {});
  });
  $$('[data-ph]').forEach(el => el.onclick = () => openPhoto(+el.dataset.ph));
}

function scaleImage(src, max, q) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, hh = img.height;
      const s = Math.min(1, max / Math.max(w, hh));
      w = Math.round(w * s); hh = Math.round(hh * s);
      const c = document.createElement('canvas'); c.width = w; c.height = hh;
      c.getContext('2d').drawImage(img, 0, 0, w, hh);
      res(c.toDataURL('image/jpeg', q == null ? 0.85 : q));
    };
    img.src = src;
  });
}
function askPose() {
  return new Promise(res => {
    modal('<div class="sec-t">Which pose is this?</div>' +
      POSES.map(p => '<button class="btn w" data-pk="' + p.k + '" style="margin-bottom:8px;justify-content:flex-start;text-align:left">' +
        p.n + '</button>').join('') +
      '<button class="btn gh w" id="pcancel">Cancel</button>');
    $$('[data-pk]').forEach(b => b.onclick = () => { closeModal(); res(b.dataset.pk); });
    $('#pcancel').onclick = () => { closeModal(); res(null); };
  });
}
async function addPhoto(file) {
  const pose = await askPose(); if (!pose) return;
  const fr = new FileReader();
  fr.onerror = () => toast('Could not read that file');
  fr.onload = async () => {
    /* localStorage is ~5 MB total, so shrink harder when that is all we have */
    const data = phMode === 'ls'
      ? await scaleImage(fr.result, 620, 0.7)
      : await scaleImage(fr.result, 1100, 0.85);
    const id = Date.now();
    try { await phPut(id, data); }
    catch (e) {
      console.error(e);
      if (e && e.message === 'quota') {
        modal('<div class="h-md">Photo storage is full</div>' +
          '<p class="sub" style="margin:8px 0 12px">You are running the app straight from the file, so photos have to squeeze into the browser\'s small storage box and it just filled up.</p>' +
          '<div class="cue">Close this and launch the app with <b>start.cmd</b> instead. That gives you the proper photo store — far more space and full quality.</div>' +
          '<div class="cue">Your existing photos and training data are safe either way.</div>' +
          '<button class="btn p w" id="xclose" style="margin-top:12px">Got it</button>');
        $('#xclose').onclick = closeModal;
      } else toast('Could not save the photo');
      return;
    }
    S.photos.push({ id: id, date: dk(new Date()), pose: pose, marks: null });
    save(); toast('Photo saved'); rPhotos();
  };
  fr.readAsDataURL(file);
}

function openCamera(onShot) {
  /* onShot receives the blob; without it the shot goes to the progress library */
  const deliver = onShot || addPhoto;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast('Camera not available here');
    if (onShot) { const f = $('#exfile'); f.onchange = e => { const x = e.target.files[0]; f.value = ''; if (x) onShot(x); }; return f.click(); }
    return $('#file').click();
  }
  modal('<div class="sec-t">Camera</div>' +
    '<video id="vid" autoplay playsinline muted style="width:100%;border-radius:12px;background:#000;transform:scaleX(-1)"></video>' +
    '<div id="cd" class="mono" style="text-align:center;font-size:34px;margin:8px 0;min-height:40px"></div>' +
    '<div class="row wrap" style="margin-top:6px">' +
    '<button class="btn p" id="shot">Shoot</button>' +
    '<button class="btn" id="shot10">10 s timer</button>' +
    '<button class="btn" id="flip">Flip camera</button>' +
    '<button class="btn gh" id="ccancel">Close</button></div>' +
    '<p class="tiny" style="margin-top:10px">If the browser blocks the camera (it can when the file is opened directly), use "Upload from file" or launch the app with <b>start.cmd</b>.</p>');
  let facing = 'user';
  const start = () => {
    if (window._stream) window._stream.getTracks().forEach(t => t.stop());
    navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 } }, audio: false })
      .then(s => { window._stream = s; $('#vid').srcObject = s; })
      .catch(err => { console.error(err); toast('No camera access'); });
  };
  start();
  $('#flip').onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; start(); };
  $('#ccancel').onclick = closeModal;
  $('#shot').onclick = () => grab();
  $('#shot10').onclick = () => {
    let n = 10;
    $('#cd').textContent = n;
    const iv = setInterval(() => {
      n--; $('#cd').textContent = n > 0 ? n : '';
      if (n <= 3 && n > 0) beep();
      if (n <= 0) { clearInterval(iv); grab(); }
    }, 1000);
  };
  function grab() {
    const v = $('#vid'); if (!v || !v.videoWidth) return toast('Camera not ready yet');
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    const cx = c.getContext('2d');
    if (facing === 'user') { cx.translate(c.width, 0); cx.scale(-1, 1); }
    cx.drawImage(v, 0, 0);
    c.toBlob(b => { closeModal(); deliver(b); }, 'image/jpeg', 0.92);
  }
}

function openPhoto(id) {
  const p = S.photos.find(x => x.id === id); if (!p) return;
  phGet(id).then(d => {
    modal('<div class="spread" style="margin-bottom:10px"><div><div class="h-md">' + p.pose + '</div>' +
      '<div class="tiny mono">' + p.date + '</div></div>' +
      '<button class="btn sm gh" id="xclose">Close</button></div>' +
      '<img src="' + d + '" style="width:100%;border-radius:12px">' +
      '<div class="row wrap" style="margin-top:12px">' +
      ((p.pose === 'front' || p.pose === 'back') ? '<button class="btn p" id="xmark">' + (p.marks ? 'Redo analysis' : 'Analyse symmetry') + '</button>' : '') +
      '<button class="btn danger" id="xdel">Delete</button></div>');
    $('#xclose').onclick = closeModal;
    const m = $('#xmark'); if (m) m.onclick = () => { closeModal(); go('symmetry'); setTimeout(() => openMarker(id), 60); };
    $('#xdel').onclick = () => {
      if (!confirm('Delete this photo? This cannot be undone.')) return;
      phDel(id).catch(() => {});
      S.photos = S.photos.filter(x => x.id !== id); save(); closeModal(); rPhotos();
    };
  });
}

function openCompare() {
  const ps = S.photos.slice().sort((a, b) => a.id - b.id);
  const opts = ps.map(p => '<option value="' + p.id + '">' + p.date + ' · ' + p.pose + '</option>').join('');
  modal('<div class="spread" style="margin-bottom:12px"><div class="h-md">Compare</div>' +
    '<button class="btn sm gh" id="xclose">Close</button></div>' +
    '<div class="grid g2"><label class="f"><span>Before</span><select id="ca">' + opts + '</select></label>' +
    '<label class="f"><span>After</span><select id="cb">' + opts + '</select></label></div>' +
    '<div class="grid g2" style="margin-top:12px"><img id="ia" style="width:100%;border-radius:10px"><img id="ib" style="width:100%;border-radius:10px"></div>' +
    '<div class="grid g2" style="margin-top:6px"><div class="tiny mono" id="la"></div><div class="tiny mono" id="lb"></div></div>');
  $('#xclose').onclick = closeModal;
  $('#ca').value = ps[0].id; $('#cb').value = ps[ps.length - 1].id;
  const upd = (sel, img, lab) => {
    const p = S.photos.find(x => x.id === +$(sel).value);
    phGet(p.id).then(d => { $(img).src = d; });
    $(lab).textContent = p.date + ' · ' + p.pose;
  };
  const both = () => { upd('#ca', '#ia', '#la'); upd('#cb', '#ib', '#lb'); };
  $('#ca').onchange = both; $('#cb').onchange = both; both();
}

/* ============ VIEW: SYMMETRY ============ */
function rSymmetry() {
  const done = S.photos.filter(p => p.marks).sort((a, b) => a.id - b.id);
  const cand = S.photos.filter(p => p.pose === 'front' || p.pose === 'back').sort((a, b) => b.id - a.id);
  let h = '<div class="card"><div class="h-lg">Symmetry analysis</div>' +
    '<p class="sub" style="margin-top:8px">You mark 6 points on one of your photos and the app calculates your <b>shoulder-to-waist ratio</b> (the V), your <b>relative shoulder width</b>, and your <b>left/right difference</b>. Everything is normalised by your torso length, so photos still compare even if you are not at exactly the same distance from the camera.</p>' +
    '<div class="note w" style="margin-top:12px">This measures a photo of you, not a medical scan. Use it for <b>trend</b>: what matters is not today\'s number but how it changes over 3 months. Always mark the same way and use the same kind of photo.</div></div>';

  if (!cand.length) {
    h += '<div class="card"><div class="sec-t">A photo is missing</div><p class="sub">You need at least one <b>front</b> or <b>back</b> photo. Go to the Photos tab and take the first one.</p>' +
      '<button class="btn p" id="tophotos" style="margin-top:12px">Go to Photos</button></div>';
    $('#v-symmetry').innerHTML = h;
    $('#tophotos').onclick = () => go('photos');
    return;
  }

  h += '<div class="card no-print"><div class="sec-t">Pick the photo to analyse</div><div class="pgrid">' +
    cand.map(p => '<div class="ph" data-mk="' + p.id + '"><img data-src="' + p.id + '">' +
      '<div class="pose">' + p.pose + '</div>' +
      (p.marks ? '<div class="mk">&#9679;</div>' : '') +
      '<div class="cap">' + fdate(p.date) + '</div></div>').join('') + '</div>' +
    '<p class="tiny" style="margin-top:10px">The green dot marks photos you already analysed. Tap any of them to (re)mark it.</p></div>';

  if (done.length) {
    const last = analyze(done[done.length - 1]);
    const first = done.length > 1 ? analyze(done[0]) : null;
    h += reportCard(last, first);
    if (done.length > 1) h += trendCard(done);
  }
  h += measureSymCard();
  $('#v-symmetry').innerHTML = h;
  $$('#v-symmetry img[data-src]').forEach(img => phGet(+img.dataset.src).then(d => { if (d) img.src = d; }).catch(() => {}));
  $$('[data-mk]').forEach(el => el.onclick = () => openMarker(+el.dataset.mk));
}

function analyze(p) {
  const m = p.marks;
  const ax = { x: m.ombligo.x - m.cuello.x, y: m.ombligo.y - m.cuello.y };
  const L = Math.hypot(ax.x, ax.y) || 1;              /* torso length = the unit */
  const ux = ax.x / L, uy = ax.y / L;
  const perp = pt => {                                 /* signed distance to the axis */
    const vx = pt.x - m.cuello.x, vy = pt.y - m.cuello.y;
    return (vx * uy - vy * ux);
  };
  const hI = Math.abs(perp(m.homI)), hD = Math.abs(perp(m.homD));
  const cI = Math.abs(perp(m.cinI)), cD = Math.abs(perp(m.cinD));
  const shoulders = hI + hD, waist = cI + cD;
  const v = waist > 0 ? shoulders / waist : 0;
  const symH = 100 - Math.abs(hI - hD) / ((hI + hD) / 2 || 1) * 100;
  const symC = 100 - Math.abs(cI - cD) / ((cI + cD) / 2 || 1) * 100;
  return {
    date: p.date, pose: p.pose,
    v: v,
    hIdx: shoulders / L,
    cIdx: waist / L,
    symH: clamp(symH, 0, 100), symC: clamp(symC, 0, 100),
    hI: hI / L, hD: hD / L,
    score: clamp(Math.round(clamp(symH, 0, 100) * 0.45 + clamp(symC, 0, 100) * 0.25 + clamp((v - 1) / 0.6 * 100, 0, 100) * 0.30), 0, 100)
  };
}
function vLabel(v) {
  if (v < 1.20) return ['Building', 'var(--mut)'];
  if (v < 1.32) return ['Solid base', 'var(--up)'];
  if (v < 1.45) return ['Athletic', 'var(--acc)'];
  if (v < 1.60) return ['Clear V', 'var(--good)'];
  return ['Strong V', 'var(--good)'];
}
function symLabel(s) {
  if (s >= 97) return ['Symmetric', 'var(--good)'];
  if (s >= 94) return ['Slight difference', 'var(--acc)'];
  if (s >= 90) return ['Visible difference', 'var(--warn)'];
  return ['Marked asymmetry', 'var(--bad)'];
}
function reportCard(a, b) {
  const vl = vLabel(a.v), sh = symLabel(a.symH), sc = symLabel(a.symC);
  const dv = b ? a.v - b.v : null;
  const dh = b ? a.hIdx - b.hIdx : null;
  let h = '<div class="card acc"><div class="spread"><div class="sec-t" style="margin:0">Report · ' + a.date + '</div>' +
    '<span class="pill">' + a.pose + '</span></div>' +
    '<div class="row" style="align-items:baseline;gap:14px;margin:14px 0 4px">' +
    '<div class="h-lg" style="color:' + vl[1] + '">' + r1(a.v).toFixed(2) + '</div>' +
    '<div><div class="h-md" style="margin:0">Shoulder-to-waist ratio</div>' +
    '<div class="tiny" style="color:' + vl[1] + '">' + vl[0] + (dv != null ? ' &middot; ' + (dv >= 0 ? '+' : '') + (r1(dv * 100) / 100) + ' since ' + b.date : '') + '</div></div></div>' +
    '<div class="gauge" style="margin:12px 0 18px"><i style="width:' + clamp((a.v - 1) / 0.7 * 100, 3, 100) + '%;background:' + vl[1] + '"></i></div>' +
    '<div class="grid g2">' +
    st(Math.round(a.symH) + '%', 'Shoulder symmetry', sh[0]) +
    st(Math.round(a.symC) + '%', 'Waist symmetry', sc[0]) +
    st(r1(a.hIdx * 100) / 100, 'Shoulder index', 'Width / torso length') +
    st(a.score + '/100', 'Overall score', 'Symmetry + V shape') +
    '</div>';

  h += '<div class="hr"></div><div class="sec-t">What this means</div>';
  const bullets = [];
  bullets.push('<b>Ratio ' + r1(a.v).toFixed(2) + ':</b> your shoulders are ' + r1(a.v).toFixed(2) + ' times as wide as your waist in this photo. Rough reference: below 1.25 the V barely reads; between 1.35 and 1.50 it clearly looks like an athletic build.');
  if (a.symH >= 97) bullets.push('<b>Even shoulders:</b> ' + Math.round(a.symH) + '% symmetry. Nothing to fix.');
  else {
    const side = a.hI > a.hD ? 'left' : 'right';
    bullets.push('<b>Your ' + side + ' shoulder reads slightly wider</b> (' + Math.round(a.symH) + '% symmetry). Before worrying: repeat the measurement on 2–3 different photos, because a tiny torso rotation while posing produces exactly this result. If it repeats, start lateral raises and rows with the smaller side and match the reps on the other.');
  }
  if (a.symC < 94) bullets.push('<b>Uneven waist</b> (' + Math.round(a.symC) + '%): this is almost always posture or rotation while posing, not muscle. Check that your weight is evenly spread across both feet.');
  if (dh != null) {
    if (dh > 0.02) bullets.push('<b>Real progress:</b> your shoulder index went from ' + (r1(b.hIdx * 100) / 100) + ' to ' + (r1(a.hIdx * 100) / 100) + ' since ' + b.date + '. Your shoulders are growing relative to your own torso — exactly what lateral raises are for.');
    else if (dh < -0.02) bullets.push('<b>Heads up:</b> your shoulder index dropped compared to ' + b.date + '. It may just be the camera angle or distance. Retake the photo under the same conditions before drawing conclusions.');
    else bullets.push('Shoulder index steady since ' + b.date + '. In natural hypertrophy visible change takes 8–12 weeks: that is normal.');
  } else {
    bullets.push('This is your <b>baseline</b>. From here everything is compared against today. Take the next one in 4 weeks.');
  }
  bullets.push('<b>How to improve the ratio:</b> the main lever is widening the top — lateral raises (in both upper days), pulldowns and rows. You do not train the waist to shrink it: no weighted obliques, no loaded twists.');
  h += bullets.map(b2 => '<div class="cue">' + b2 + '</div>').join('');
  h += '</div>';
  return h;
}
function trendCard(list) {
  const A = list.map(analyze);
  return '<div class="card"><div class="sec-t">Trend</div>' +
    '<div style="margin-bottom:6px" class="tiny">Shoulder-to-waist ratio</div>' +
    lineChart(A.map(a => ({ x: fdate(a.date), y: a.v })), { color: '#C8FF00', dec: 2 }) +
    '<div style="margin:18px 0 6px" class="tiny">Shoulder index (width / torso)</div>' +
    lineChart(A.map(a => ({ x: fdate(a.date), y: a.hIdx })), { color: '#00D6FF', dec: 2 }) +
    '<div style="margin:18px 0 6px" class="tiny">Shoulder symmetry (%)</div>' +
    lineChart(A.map(a => ({ x: fdate(a.date), y: a.symH })), { color: '#38DC84', dec: 0 }) +
    '</div>';
}
function measureSymCard() {
  const ms = S.measures.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  if (!ms.length) return '<div class="card flat"><div class="sec-t">Tape-measure symmetry</div>' +
    '<p class="sub">The photo measures proportions; the tape measures each arm and leg separately. Log your measurements in the <b>Measure</b> tab to see left/right differences here.</p></div>';
  const m = ms[0];
  const rows = MEASURES.filter(x => x.pair).map(x => {
    const i = +m[x.k + 'I'], d = +m[x.k + 'D'];
    if (!i || !d) return '';
    const df = Math.abs(i - d), pc = df / ((i + d) / 2) * 100;
    const lb = pc < 2 ? ['Normal', 'var(--good)'] : pc < 4 ? ['Slight', 'var(--acc)'] : ['Worth attention', 'var(--warn)'];
    return '<tr><td><b>' + x.n + '</b></td><td class="m">' + i + ' cm</td><td class="m">' + d + ' cm</td>' +
      '<td class="m">' + r1(df) + ' cm</td><td class="m" style="color:' + lb[1] + '">' + lb[0] + ' (' + r1(pc) + '%)</td></tr>';
  }).join('');
  return '<div class="card"><div class="sec-t">Tape-measure symmetry · ' + m.date + '</div>' +
    (rows ? '<div class="tw"><table><thead><tr><th>Measure</th><th>Left</th><th>Right</th><th>Diff</th><th>Reading</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="note" style="margin-top:12px">A difference of up to <b>2%</b> between left and right is completely normal — almost nobody is symmetric, and the dominant arm is usually slightly bigger. If it stays above 4% consistently, start each exercise with the weaker side and match the reps (never add unplanned extra sets on one side).</div>'
      : '<p class="sub">Log arm, thigh or calf measurements (left and right) to see the analysis.</p>') + '</div>';
}

/* photo marker */
let MK = { id: null, pts: {}, idx: 0, img: null };
function openMarker(id) {
  const p = S.photos.find(x => x.id === id); if (!p) return;
  phGet(id).then(data => {
    const img = new Image();
    img.onload = () => {
      MK = { id: id, pts: {}, idx: 0, img: img };
      modal('<div class="spread" style="margin-bottom:10px"><div class="h-md">Mark the 6 points</div>' +
        '<button class="btn sm gh" id="xclose">Close</button></div>' +
        '<div id="mkstep" class="note" style="margin-bottom:10px"></div>' +
        '<div id="markwrap"><canvas id="markcv"></canvas></div>' +
        '<div class="row wrap" style="margin-top:12px">' +
        '<button class="btn" id="mundo">Undo</button>' +
        '<button class="btn" id="mreset">Start over</button>' +
        '<button class="btn p" id="msave" disabled>Save analysis</button></div>' +
        '<p class="tiny" style="margin-top:10px">Tap precisely: a few pixels off changes little, but marking the shoulder on your sleeve instead of the muscle does change the result. Use the same criteria on every photo.</p>');
      const cv = $('#markcv');
      const maxW = Math.min(560, $('#modalin').clientWidth - 4);
      const sc = maxW / img.width;
      cv.width = img.width * sc; cv.height = img.height * sc;
      MK.sc = sc;
      drawMarks();
      cv.onclick = e => {
        if (MK.idx >= MARKS.length) return;
        const r = cv.getBoundingClientRect();
        MK.pts[MARKS[MK.idx].k] = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
        MK.idx++;
        drawMarks();
      };
      $('#xclose').onclick = closeModal;
      $('#mundo').onclick = () => { if (MK.idx > 0) { MK.idx--; delete MK.pts[MARKS[MK.idx].k]; drawMarks(); } };
      $('#mreset').onclick = () => { MK.pts = {}; MK.idx = 0; drawMarks(); };
      $('#msave').onclick = () => {
        p.marks = MK.pts; save(); closeModal(); toast('Analysis saved'); rSymmetry();
      };
    };
    img.src = data;
  }).catch(() => toast('Could not open the photo'));
}
function drawMarks() {
  const cv = $('#markcv'); if (!cv) return;
  const cx = cv.getContext('2d');
  cx.clearRect(0, 0, cv.width, cv.height);
  cx.drawImage(MK.img, 0, 0, cv.width, cv.height);
  const P = k => MK.pts[k] ? { x: MK.pts[k].x * cv.width, y: MK.pts[k].y * cv.height } : null;
  const line = (a, b, col) => {
    if (!a || !b) return;
    cx.strokeStyle = col; cx.lineWidth = 2; cx.setLineDash([6, 5]);
    cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke(); cx.setLineDash([]);
  };
  line(P('cuello'), P('ombligo'), 'rgba(200,255,0,.85)');
  line(P('homI'), P('homD'), 'rgba(0,214,255,.85)');
  line(P('cinI'), P('cinD'), 'rgba(255,107,44,.85)');
  MARKS.forEach(m => {
    const p = P(m.k); if (!p) return;
    cx.fillStyle = m.c;
    cx.beginPath(); cx.arc(p.x, p.y, 6, 0, 7); cx.fill();
    cx.strokeStyle = 'rgba(0,0,0,.7)'; cx.lineWidth = 2; cx.stroke();
  });
  const step = $('#mkstep');
  if (MK.idx < MARKS.length) {
    const m = MARKS[MK.idx];
    step.innerHTML = '<b>' + (MK.idx + 1) + '/6 &middot; ' + m.n + '</b><br>' + m.hint;
    $('#msave').disabled = true;
  } else {
    step.innerHTML = '<b>Done.</b> Check that the lines match your body and save.';
    $('#msave').disabled = false;
  }
}

/* ============ VIEW: MEASURE ============ */
function rMeasure() {
  const ms = S.measures.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  const core = MEASURES.filter(m => m.core), extra = MEASURES.filter(m => !m.core);
  const field = m => m.pair
    ? '<label class="f"><span>' + m.n + ' LEFT (' + m.u + ')</span><input type="number" step="0.1" data-m="' + m.k + 'I"></label>' +
      '<label class="f"><span>' + m.n + ' RIGHT (' + m.u + ')</span><input type="number" step="0.1" data-m="' + m.k + 'D"></label>'
    : '<label class="f"><span>' + m.n + ' (' + m.u + ')</span><input type="number" step="0.1" data-m="' + m.k + '"></label>';

  let h = '<div class="card"><div class="h-lg">Measurements</div>' +
    '<p class="sub" style="margin-top:8px"><b>You do not need any equipment for this app to work.</b> Every field here is optional — fill in whatever you can get, leave the rest blank, and the app uses what it has.</p>' +
    '<div class="note" style="margin-top:12px">No tape measure? A <b>shoelace and any ruler</b> does the same job: wrap it around, pinch where it meets, lay it flat against the ruler. And if you have neither, the <b>Symmetry</b> tab gets your shoulder-to-waist ratio from a photo with no tools at all.</div></div>';

  h += '<div class="card no-print"><div class="spread"><div class="sec-t" style="margin:0">New entry</div>' +
    '<span class="pill">all optional</span></div>' +
    '<p class="tiny" style="margin:8px 0 12px">These two are the ones worth chasing. Everything else is a bonus.</p>' +
    '<div class="grid g2">' + core.map(field).join('') + '</div>' +
    core.map(m => '<div class="cue"><b>' + m.n + '</b> <span class="tiny">(' + m.need + ')</span><br>' + m.tip + '</div>').join('') +
    '<details class="q" style="margin:14px 0 0"><summary>More measurements &mdash; only if you have a tape or a shoelace</summary><div>' +
      '<div class="grid g2" style="margin-bottom:10px">' + extra.map(field).join('') + '</div>' +
      extra.map(m => '<div class="cue"><b>' + m.n + ':</b> ' + m.tip + '</div>').join('') +
    '</div></details>' +
    '<button class="btn p w" id="msaveM" style="margin-top:14px">Save what I have</button></div>';

  /* bodyweight is the one number the game layer genuinely needs */
  const src = bodyWSource();
  if (src !== 'logged') {
    h += '<div class="card no-print"><div class="sec-t">If you cannot weigh yourself</div>' +
      '<p class="sub" style="margin:8px 0 12px">Several trials are set as a multiple of your bodyweight, so the app needs <b>some</b> number. Right now it is using <b>' +
      bodyW() + ' kg</b>' + (src === 'default' ? ', which is just the starting default and probably not you any more' : ', the estimate you set') + '.</p>' +
      '<div class="row" style="gap:8px"><input type="number" step="0.5" id="bwest" placeholder="kg" value="' +
      ((S.profile && S.profile.weight) || '') + '" style="flex:1">' +
      '<button class="btn sm p" id="bwsave">Use this</button></div>' +
      '<p class="tiny" style="margin-top:10px">A rough estimate is fine and far better than a wrong default. A real weigh-in always overrides it.</p></div>';
  }

  h += '<div class="card"><div class="sec-t">What you can track with what you have</div>' +
    NO_KIT.map(x => '<div class="cue"><b>' + x[0] + ':</b> ' + x[1] + '</div>').join('') + '</div>';

  if (ms.length) {
    const w = ms.filter(x => x.peso).map(x => ({ x: fdate(x.date), y: +x.peso })).reverse();
    if (w.length > 1) {
      const dw = w[w.length - 1].y - w[0].y;
      h += '<div class="card"><div class="spread"><div class="sec-t" style="margin:0">Bodyweight</div>' +
        '<span class="pill ' + (dw > 0 ? 'good' : '') + '">' + (dw >= 0 ? '+' : '') + r1(dw) + ' kg</span></div>' +
        lineChart(w, { color: '#C8FF00', dec: 1 }) +
        '<div class="note" style="margin-top:12px">You are aiming for <b>+0.2 to +0.4 kg per week</b>. If it has not moved in 3 weeks, add a meal. If it climbs faster than 0.5 kg/week consistently, a good part of that will be fat.</div></div>';
    }
    const keys = ['hombros', 'pecho', 'cintura'];
    const series = keys.filter(k => ms.some(m => m[k]));
    if (series.length) {
      h += '<div class="card"><div class="sec-t">Proportions</div>';
      series.forEach(k => {
        const d = ms.filter(m => m[k]).map(m => ({ x: fdate(m.date), y: +m[k] })).reverse();
        h += '<div class="tiny" style="margin:14px 0 6px">' + MEASURES.find(x => x.k === k).n + ' (cm)</div>' +
          lineChart(d, { color: k === 'cintura' ? '#FF6B2C' : '#00D6FF', dec: 1 });
      });
      const last = ms[0];
      if (last.hombros && last.cintura) {
        const rt = last.hombros / last.cintura;
        h += '<div class="hr"></div><div class="spread"><div><div class="h-md">Tape ratio: ' + (r1(rt * 100) / 100) + '</div>' +
          '<div class="tiny">Shoulder circumference ÷ waist circumference</div></div>' +
          '<span class="pill up">target ~1.60</span></div>' +
          '<div class="note" style="margin-top:10px">Note: this is a ratio of <b>circumferences</b> (tape all the way around), different from the Symmetry tab which measures <b>widths</b> in a photo. Both are useful, but each one only compares against itself.</div>';
      }
      h += '</div>';
    }
    /* only show columns you have actually filled in, so the table stays readable
       when you are tracking two numbers instead of ten */
    const used = MEASURES.filter(x => ms.some(m => x.pair ? (m[x.k + 'I'] || m[x.k + 'D']) : m[x.k]));
    h += '<div class="card"><div class="sec-t">History</div><div class="tw"><table><thead><tr><th>Date</th>' +
      used.map(m => m.pair ? '<th>' + m.n + ' L/R</th>' : '<th>' + m.n + '</th>').join('') + '<th></th></tr></thead><tbody>' +
      ms.map(m => '<tr><td class="m">' + m.date + '</td>' +
        used.map(x => x.pair ? '<td class="m">' + (m[x.k + 'I'] || '-') + ' / ' + (m[x.k + 'D'] || '-') + '</td>' : '<td class="m">' + (m[x.k] || '-') + '</td>').join('') +
        '<td><button class="btn sm gh no-print" data-delm="' + m.date + '">&times;</button></td></tr>').join('') +
      '</tbody></table></div></div>';
  }
  $('#v-measure').innerHTML = h;
  const bs = $('#bwsave');
  if (bs) bs.onclick = () => {
    const v = +$('#bwest').value;
    if (!v || v < 25 || v > 200) return toast('Enter a bodyweight in kg');
    S.profile.weight = v; save(); toast('Using ' + v + ' kg'); rMeasure();
  };
  $('#msaveM').onclick = () => {
    const rec = { date: dk(new Date()) };
    let any = false;
    $$('[data-m]').forEach(i => { if (i.value !== '') { rec[i.dataset.m] = +i.value; any = true; } });
    if (!any) return toast('Fill in at least one field');
    S.measures = S.measures.filter(m => m.date !== rec.date).concat([rec]);
    save(); toast('Measurements saved'); rMeasure();
  };
  $$('[data-delm]').forEach(b => b.onclick = () => {
    S.measures = S.measures.filter(m => m.date !== b.dataset.delm); save(); rMeasure();
  });
}

/* ============ charts ============ */
function lineChart(pts, o) {
  o = o || {};
  if (!pts || pts.length < 2) return '<p class="tiny">At least 2 entries are needed to show a trend.</p>';
  const W = 640, H = 170, pl = 42, pr = 10, pt = 12, pb = 26;
  const ys = pts.map(p => p.y);
  let mn = Math.min.apply(null, ys), mx = Math.max.apply(null, ys);
  if (mn === mx) { mn -= 1; mx += 1; }
  const padY = (mx - mn) * 0.15; mn -= padY; mx += padY;
  const X = i => pl + i * (W - pl - pr) / (pts.length - 1);
  const Y = v => pt + (1 - (v - mn) / (mx - mn)) * (H - pt - pb);
  const dec = o.dec == null ? 1 : o.dec;
  const col = o.color || '#C8FF00';
  let g = '';
  for (let i = 0; i <= 3; i++) {
    const v = mn + (mx - mn) * i / 3, y = Y(v);
    g += '<line x1="' + pl + '" y1="' + y + '" x2="' + (W - pr) + '" y2="' + y + '" stroke="#232830" stroke-width="1"/>' +
      '<text x="' + (pl - 7) + '" y="' + (y + 4) + '" fill="#5C6472" font-size="10" text-anchor="end" font-family="monospace">' + v.toFixed(dec) + '</text>';
  }
  const line = pts.map((p, i) => (i ? 'L' : 'M') + X(i) + ' ' + Y(p.y)).join(' ');
  const area = line + ' L' + X(pts.length - 1) + ' ' + (H - pb) + ' L' + pl + ' ' + (H - pb) + ' Z';
  const uid = 'g' + Math.floor(Math.random() * 1e6);
  const dots = pts.map((p, i) => '<circle cx="' + X(i) + '" cy="' + Y(p.y) + '" r="3.5" fill="' + col + '"/>').join('');
  const every = Math.ceil(pts.length / 6);
  const lab = pts.map((p, i) => (i % every === 0 || i === pts.length - 1) ?
    '<text x="' + X(i) + '" y="' + (H - 8) + '" fill="#5C6472" font-size="10" text-anchor="middle" font-family="monospace">' + esc(p.x) + '</text>' : '').join('');
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '">' +
    '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="' + col + '" stop-opacity=".28"/><stop offset="100%" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
    g + '<path d="' + area + '" fill="url(#' + uid + ')"/>' +
    '<path d="' + line + '" fill="none" stroke="' + col + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
    dots + lab +
    '<text x="' + (W - pr) + '" y="' + (pt + 2) + '" fill="' + col + '" font-size="12" text-anchor="end" font-family="monospace" font-weight="700">' +
    pts[pts.length - 1].y.toFixed(dec) + '</text></svg>';
}
function barChart(pts, o) {
  o = o || {};
  if (!pts.length) return '<p class="tiny">No data yet.</p>';
  const W = 640, H = 150, pl = 44, pr = 10, pt = 12, pb = 26;
  const mx = Math.max.apply(null, pts.map(p => p.y)) || 1;
  const bw = (W - pl - pr) / pts.length;
  const col = o.color || '#C8FF00';
  const b = pts.map((p, i) => {
    const h = (p.y / mx) * (H - pt - pb);
    return '<rect x="' + (pl + i * bw + bw * 0.15) + '" y="' + (H - pb - h) + '" width="' + (bw * 0.7) + '" height="' + Math.max(h, 1) + '" rx="3" fill="' + col + '" opacity="' + (i === pts.length - 1 ? 1 : .55) + '"/>' +
      '<text x="' + (pl + i * bw + bw / 2) + '" y="' + (H - 8) + '" fill="#5C6472" font-size="10" text-anchor="middle" font-family="monospace">' + esc(p.x) + '</text>';
  }).join('');
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '">' +
    '<line x1="' + pl + '" y1="' + (H - pb) + '" x2="' + (W - pr) + '" y2="' + (H - pb) + '" stroke="#232830"/>' +
    '<text x="' + (pl - 7) + '" y="' + (pt + 8) + '" fill="#5C6472" font-size="10" text-anchor="end" font-family="monospace">' + Math.round(mx / 1000) + 'k</text>' + b + '</svg>';
}

/* ============ VIEW: PROGRESS ============ */
function isoWeekKey(d) { return dk(mondayOf(d)); }
function rProgress() {
  const keys = Object.keys(S.logs).sort();
  const doneLogs = keys.filter(k => S.logs[k].done);
  const st0 = ensureStart();
  const today = new Date();

  let sched = 0;
  for (let d = new Date(st0); d <= today; d.setDate(d.getDate() + 1)) if (sessionFor(d)) sched++;
  const adh = sched ? Math.round(doneLogs.length / sched * 100) : 0;

  let streak = 0;
  const d2 = new Date(today);
  for (let i = 0; i < 120; i++) {
    if (sessionFor(d2)) {
      const k = dk(d2);
      if (S.logs[k] && S.logs[k].done) streak++;
      else if (k !== dk(today)) break;
    }
    d2.setDate(d2.getDate() - 1);
  }

  const vol = {};
  keys.forEach(k => {
    const wkk = isoWeekKey(parseDk(k));
    let v = 0;
    const sets = S.logs[k].sets || {};
    Object.keys(sets).forEach(ex => sets[ex].forEach(s => { if (s.done && s.w && s.r) v += +s.w * +s.r; }));
    vol[wkk] = (vol[wkk] || 0) + v;
  });
  const volArr = Object.keys(vol).sort().slice(-8).map(k => ({ x: fdate(k), y: Math.round(vol[k]) }));

  let h = '<div class="card"><div class="h-lg">Progress</div>' +
    '<p class="sub" style="margin-top:8px">Everything you log in each session ends up here. This is what separates training from improvising.</p></div>';

  h += '<div class="grid g4">' +
    st(doneLogs.length, 'Sessions done') +
    st(streak, 'Streak', 'sessions in a row') +
    st(adh + '%', 'Adherence', doneLogs.length + ' of ' + sched + ' scheduled') +
    st(cycleWeek(weekOf(today)) + '/12', 'Cycle week', (blockOf(weekOf(today)).name.split('—')[1] || '').trim()) +
    '</div>';

  h += '<div class="card"><div class="sec-t">Weekly volume (total kg lifted)</div>' +
    barChart(volArr, { color: '#C8FF00' }) +
    '<div class="tiny" style="margin-top:8px">Volume = weight × reps across all sets. It does not have to rise every week; what matters is the 4–6 week trend.</div>';
  if (volArr.length >= 3) {
    const l = volArr.length;
    if (volArr[l - 1].y < volArr[l - 2].y && volArr[l - 2].y < volArr[l - 3].y) {
      h += '<div class="note w" style="margin-top:12px"><b>Your volume dropped two weeks in a row.</b> Check sleep and food first. If you are also tired, unmotivated or carrying aches that will not clear, read the <b>deload</b> section in the Guide.</div>';
    }
  }
  h += '</div>';

  h += '<div class="card"><div class="sec-t">Automatic report</div>' + buildReport(doneLogs, volArr) + '</div>';

  const best = [];
  Object.keys(EX).forEach(id => {
    let bw = 0, bd = null, br = 0;
    keys.forEach(k => {
      (S.logs[k].sets[id] || []).forEach(s => {
        if (s.done && +s.w > bw && +s.r >= EX[id].lo) { bw = +s.w; br = +s.r; bd = k; }
      });
    });
    if (bw) best.push({ id: id, w: bw, r: br, d: bd });
  });
  if (best.length) {
    h += '<div class="card"><div class="sec-t">Personal bests</div><div class="tw"><table><thead><tr>' +
      '<th>Exercise</th><th>Best set</th><th>Date</th><th>Suggestion</th></tr></thead><tbody>' +
      best.map(b => {
        const sg = suggest(b.id, null);
        return '<tr><td><b>' + esc(EX[b.id].n) + '</b><div class="tiny">' + esc(EX[b.id].g) + '</div></td>' +
          '<td class="m">' + b.w + ' kg × ' + b.r + '</td><td class="m">' + b.d + '</td>' +
          '<td>' + (sg ? '<span class="pill up">Go to ' + sg.w + ' kg</span>' : '<span class="pill">Add reps</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  if (keys.length) {
    h += '<div class="card"><div class="sec-t">Session history</div><div class="tw"><table><thead><tr>' +
      '<th>Date</th><th>Session</th><th>Sets</th><th>Volume</th><th>Notes</th></tr></thead><tbody>' +
      keys.slice().reverse().slice(0, 30).map(k => {
        const lg = S.logs[k], ses = SESSIONS[lg.s];
        let n = 0, v = 0;
        Object.keys(lg.sets || {}).forEach(ex => (lg.sets[ex] || []).forEach(s => { if (s.done) { n++; if (s.w && s.r) v += +s.w * +s.r; } }));
        return '<tr><td class="m">' + k + '</td><td><span class="pill">' + (ses ? ses.label : '—') + '</span>' +
          (lg.done ? ' <span class="pill good">closed</span>' : '') + '</td>' +
          '<td class="m">' + n + '</td><td class="m">' + Math.round(v).toLocaleString('en') + ' kg</td>' +
          '<td class="tiny">' + esc((lg.notes || '').slice(0, 60)) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }
  $('#v-progress').innerHTML = h;
}
function buildReport(doneLogs, volArr) {
  const out = [];
  const wk = weekOf(new Date()), blk = blockOf(wk);
  out.push('You are in <b>week ' + cycleWeek(wk) + ' of 12</b>, inside <b>' + blk.name + '</b>. Your intensity target this week is <b>RIR ' + blk.rir + '</b>.');
  if (!doneLogs.length) {
    out.push('You have not closed a single session yet. Open the <b>Today</b> tab, log every set and hit "Finish session" at the end: no data, no report.');
    return out.map(x => '<div class="cue">' + x + '</div>').join('');
  }
  out.push('You have <b>' + doneLogs.length + ' sessions</b> logged.');
  if (volArr.length >= 2) {
    const a = volArr[volArr.length - 2].y, b = volArr[volArr.length - 1].y;
    const pc = a ? Math.round((b - a) / a * 100) : 0;
    if (pc > 3) out.push('Your volume rose <b>' + pc + '%</b> compared to last week. That is real progression: keep doing what you are doing and do not force big jumps in weight.');
    else if (pc < -8) out.push('Your volume dropped <b>' + Math.abs(pc) + '%</b> this week. It could be an unlogged session, less sleep, or just a flat week. Do not change anything yet; look again next week.');
    else out.push('Your volume is steady compared to last week. For a beginner the expected pattern is a slow, steady climb, not jumps.');
  }
  const ups = Object.keys(EX).map(id => ({ id: id, s: suggest(id, null) })).filter(x => x.s);
  if (ups.length) out.push('Exercises where you have earned a weight increase: <b>' + ups.map(u => EX[u.id].n).join(', ') + '</b>. Add the minimum increment, no more.');
  else out.push('No exercise currently meets the condition for adding weight (every set at the top of the range at RIR 1–2). Add reps before kilos.');
  const marked = S.photos.filter(p => p.marks).sort((a, b) => a.id - b.id);
  if (marked.length >= 2) {
    const A = analyze(marked[0]), B2 = analyze(marked[marked.length - 1]);
    const d = B2.v - A.v;
    out.push('Your shoulder-to-waist ratio went from <b>' + r1(A.v).toFixed(2) + '</b> (' + A.date + ') to <b>' + r1(B2.v).toFixed(2) + '</b> (' + B2.date + '), a change of <b>' + (d >= 0 ? '+' : '') + (r1(d * 100) / 100) + '</b>.');
  } else if (marked.length === 1) {
    out.push('You have one analysed photo. Take another in 4 weeks to start seeing a symmetry trend.');
  } else {
    out.push('You have not analysed any photo yet. Go to <b>Photos</b>, take a front shot and mark it in <b>Symmetry</b>: that is your baseline.');
  }
  const ms = S.measures.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  if (ms.length >= 2 && ms[0].peso && ms[ms.length - 1].peso) {
    const dw = ms[0].peso - ms[ms.length - 1].peso;
    const wks = Math.max(1, Math.round((parseDk(ms[0].date) - parseDk(ms[ms.length - 1].date)) / 604800000));
    const rate = dw / wks;
    if (rate < 0.05) out.push('Your bodyweight has barely moved (<b>' + r1(dw) + ' kg in ' + wks + ' weeks</b>). To build muscle at your age you need to eat a bit more: add a meal or a snack with protein and carbs.');
    else if (rate > 0.55) out.push('You are gaining <b>' + r1(rate) + ' kg per week</b>, faster than ideal. Ease off the surplus slightly so more of what you gain is muscle.');
    else out.push('Your weight is rising at <b>' + r1(rate) + ' kg per week</b>: exactly the rate you want. Change nothing.');
  }
  return out.map(x => '<div class="cue">' + x + '</div>').join('');
}

/* ============ EDITORS: your week, your sessions ============
   The program shipped with the app is a starting point. Both of these write
   into S and everything else reads through sessionFor() and sesList(), so a
   change here reaches the Today view, the trials and the XP economy at once. */
const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function schedCard() {
  const n = trainingDays().length;
  let h = '<div class="card"><div class="spread"><div class="sec-t" style="margin:0">Your week</div>' +
    '<span class="pill ' + (n ? '' : 'warn') + '">' + n + ' training day' + (n === 1 ? '' : 's') + '</span></div>' +
    '<p class="sub" style="margin:8px 0 12px">Tap to set what happens on each day. Nothing is locked to Tuesday or Wednesday — put the sessions wherever your week actually allows.</p>';
  h += DOW_ORDER.map(dw => {
    const cur = (S.sched || {})[dw] || '';
    return '<div class="drow' + (cur ? '' : ' off') + '"><span class="dname">' + DOW_SHORT[dw] + '</span><div class="dopts">' +
      '<button data-sd="' + dw + '" data-sv="" class="' + (cur ? '' : 'on') + '">Rest</button>' +
      Object.keys(SESSIONS).map(k => '<button data-sd="' + dw + '" data-sv="' + k + '" class="' +
        (cur === k ? 'on' : '') + '">' + SESSIONS[k].label + '</button>').join('') +
      '</div></div>';
  }).join('');
  h += '<div class="row wrap" style="margin-top:14px">' +
    '<button class="btn sm gh" id="schreset">Back to Tue / Wed / Fri</button></div>';
  if (!n) h += '<div class="note b" style="margin-top:12px">Every day is set to rest, so the app has no sessions to give you. Pick at least one.</div>';
  else if (n > 4) h += '<div class="note w" style="margin-top:12px"><b>' + n + ' days is a lot at your training age.</b> Three or four hard sessions a week, recovered properly, beat six rushed ones. Your call — but recovery is where the muscle is actually built.</div>';
  return h + '</div>';
}
function wireSched(after) {
  $$('[data-sd]').forEach(b => b.onclick = () => {
    S.sched = S.sched || {};
    S.sched[+b.dataset.sd] = b.dataset.sv || null;
    save();
    (after || rPlan)();
  });
  const r = $('#schreset');
  if (r) r.onclick = () => {
    S.sched = { 0: null, 1: null, 2: 'PUSH', 3: 'PULL', 4: null, 5: 'LEGS', 6: null };
    save(); toast('Back to the default week'); (after || rPlan)();
  };
}

function sessionsCard() {
  let h = '<div class="card"><div class="sec-t">Your sessions</div>' +
    '<p class="sub" style="margin:8px 0 12px">Swap an exercise your gym does not have, drop one you dislike, reorder them, or change how many sets you do.</p>';
  h += Object.keys(SESSIONS).map(k => {
    const list = sesList(k);
    return '<div class="drow"><div style="flex:1;min-width:0">' +
      '<div style="font-weight:800;font-size:14px">' + SESSIONS[k].label +
      (sesEdited(k) ? ' <span class="pill up">edited</span>' : '') + '</div>' +
      '<div class="tiny mono">' + list.length + ' exercises &middot; ' + sesTotal(k) + ' sets</div></div>' +
      '<button class="btn sm" data-edses="' + k + '">Edit</button></div>';
  }).join('');
  return h + '</div>';
}

/* ---- the per-session editor (a modal, redrawn after every change) ---- */
function openSesEdit(sid, after) {
  const draw = () => {
    const list = sesList(sid);
    const taken = list.map(x => x.id);
    const spare = Object.keys(EX).filter(id => taken.indexOf(id) < 0)
      .sort((a, b) => EX[a].g < EX[b].g ? -1 : EX[a].g > EX[b].g ? 1 : 0);
    let h = '<div class="spread" style="margin-bottom:4px">' +
      '<div class="h-md">' + SESSIONS[sid].label + '</div>' +
      '<span class="pill">' + list.length + ' exercises &middot; ' + sesTotal(sid) + ' sets</span></div>' +
      '<p class="tiny" style="margin-bottom:12px">Order is the order you train them in. Keep your heaviest compound first.</p>';
    h += list.map((x, i) => {
      const e = EX[x.id];
      return '<div class="erow">' +
        '<div class="en"><b>' + esc(e.n) + '</b><span class="tiny">' + esc(e.g) + ' &middot; ' + e.lo + '-' + e.hi + ' reps</span></div>' +
        '<div class="stepper"><button data-dec="' + i + '"' + (x.sets <= 1 ? ' disabled' : '') + '>&minus;</button>' +
        '<span>' + x.sets + ' set' + (x.sets === 1 ? '' : 's') + '</span>' +
        '<button data-inc="' + i + '"' + (x.sets >= 6 ? ' disabled' : '') + '>+</button></div>' +
        '<button class="ebtn" data-up="' + i + '"' + (i === 0 ? ' disabled' : '') + ' title="Move up">&#9650;</button>' +
        '<button class="ebtn" data-dn="' + i + '"' + (i === list.length - 1 ? ' disabled' : '') + ' title="Move down">&#9660;</button>' +
        '<button class="ebtn rm" data-rm="' + i + '"' + (list.length <= 1 ? ' disabled' : '') + ' title="Remove">&#10005;</button>' +
        '</div>';
    }).join('');
    if (spare.length) {
      h += '<div class="hr"></div><div class="sec-t" style="margin-bottom:8px">Add an exercise</div>' +
        '<div class="row" style="gap:8px"><select id="addex" style="flex:1">' +
        spare.map(id => '<option value="' + id + '">' + esc(EX[id].n) + ' — ' + esc(EX[id].g) + '</option>').join('') +
        '</select><button class="btn sm p" id="addgo">Add</button></div>';
    }
    h += '<div class="hr"></div><div class="row wrap">' +
      (sesEdited(sid) ? '<button class="btn sm gh" id="sesreset">Reset to the built-in session</button>' : '') +
      '<button class="btn p" id="sesdone" style="flex:1">Done</button></div>' +
      '<p class="tiny" style="margin-top:10px">Sets you have already logged are kept. Removing an exercise only takes it out of future sessions.</p>';
    modal(h);

    const commit = fn => { const l = sesList(sid); fn(l); setSesList(sid, l); draw(); };
    $$('[data-inc]').forEach(b => b.onclick = () => commit(l => { l[+b.dataset.inc].sets = Math.min(6, l[+b.dataset.inc].sets + 1); }));
    $$('[data-dec]').forEach(b => b.onclick = () => commit(l => { l[+b.dataset.dec].sets = Math.max(1, l[+b.dataset.dec].sets - 1); }));
    $$('[data-up]').forEach(b => b.onclick = () => commit(l => { const i = +b.dataset.up; const t = l[i - 1]; l[i - 1] = l[i]; l[i] = t; }));
    $$('[data-dn]').forEach(b => b.onclick = () => commit(l => { const i = +b.dataset.dn; const t = l[i + 1]; l[i + 1] = l[i]; l[i] = t; }));
    $$('[data-rm]').forEach(b => b.onclick = () => commit(l => { l.splice(+b.dataset.rm, 1); }));
    const ag = $('#addgo');
    if (ag) ag.onclick = () => {
      const sel = $('#addex'); if (!sel || !sel.value) return;
      commit(l => l.push({ id: sel.value, sets: EX[sel.value].sets }));
    };
    const rs = $('#sesreset');
    if (rs) rs.onclick = () => {
      if (!confirm('Put ' + SESSIONS[sid].label + ' back to the exercises it came with?')) return;
      setSesList(sid, null); draw();
    };
    $('#sesdone').onclick = () => { closeModal(); if (after) after(); };
  };
  draw();
}

/* ============ VIEW: PLAN ============ */
function rPlan() {
  const wk = weekOf(new Date());
  const legDays = trainingDays().filter(n => S.sched[n] === 'LEGS').length;
  const upDays = trainingDays().length - legDays;
  let h = '<div class="card"><div class="h-lg">The plan</div>' +
    '<p class="sub" style="margin-top:8px">You train on <b>' + trainingDaysText() + '</b>. Rest: ' + restDaysText() + '.</p>' +
    '<div class="hr"></div><div class="sec-t">What your split prioritises</div>' +
    '<div class="cue"><b>' + upDays + ' upper session' + (upDays === 1 ? '' : 's') + ' a week against ' + legDays + ' leg session' + (legDays === 1 ? '' : 's') + '.</b> ' +
      (upDays > legDays ? 'That trade favours shoulders, back, chest and arms — which is what you said you wanted.'
                        : 'Upper body is what drives the V-taper you are after, so consider giving it the extra session.') + '</div>' +
    '<div class="cue">Two upper sessions a week is the frequency that actually builds the V. Side delts and lats want hitting twice.</div>' +
    (legDays === 0 ? '<div class="cue bad">You have <b>no leg day</b> scheduled. Nobody who looks the way you want to look skipped legs entirely — add one.</div>'
     : legDays === 1 ? '<div class="cue">Legs only come around once, so <b>that day is the least skippable of the week</b>. Miss it and you go two weeks between leg sessions, which is where progress actually stalls.</div>'
     : '<div class="cue">Two leg days a week is plenty at your training age, and more than most people your size manage.</div>') +
    '<div class="cue">If you ever add a day, make it the one your split has least of.</div></div>';

  h += schedCard();
  h += sessionsCard();

  const tds = trainingDays();
  h += '<div class="card"><div class="sec-t">Next 4 weeks</div>';
  if (!tds.length) h += '<p class="sub">No training days set. Pick some above and this fills in.</p>';
  else {
    h += '<div class="tw"><table><thead><tr><th>Week</th>' +
      tds.map(n => '<th>' + DAYS[n] + '</th>').join('') + '<th>Block</th></tr></thead><tbody>';
    for (let i = 0; i < 4; i++) {
      const w = wk + i, b = blockOf(w);
      h += '<tr' + (i === 0 ? ' style="background:rgba(200,255,0,.05)"' : '') + '><td class="m">' + w + (i === 0 ? ' (now)' : '') + '</td>' +
        tds.map(n => '<td><span class="pill">' + SESSIONS[S.sched[n]].label + '</span></td>').join('') +
        '<td class="m" style="color:' + b.color + '">RIR ' + b.rir + '</td></tr>';
    }
    h += '</tbody></table></div><p class="tiny" style="margin-top:10px">Rest: ' + restDaysText() + '. Walking or an easy sport is perfect on those.</p>';
  }
  h += '</div>';

  h += '<div class="card"><div class="sec-t">The 3 blocks of 12 weeks</div>' +
    BLOCKS.map(b => {
      const on = cycleWeek(wk) >= b.w[0] && cycleWeek(wk) <= b.w[1];
      return '<div class="card flat" style="margin-bottom:10px;' + (on ? 'border-color:' + b.color : '') + '">' +
        '<div class="spread"><div class="h-md" style="color:' + b.color + '">' + esc(b.name) + '</div>' +
        '<span class="pill">Wk ' + b.w[0] + '–' + b.w[1] + ' · RIR ' + b.rir + '</span></div>' +
        '<p class="sub" style="margin:6px 0 10px">' + esc(b.goal) + '</p>' +
        b.rules.map(r => '<div class="cue">' + r + '</div>').join('') + '</div>';
    }).join('') + '</div>';

  h += '<div class="card"><div class="spread"><div class="sec-t" style="margin:0">Starting weights</div>' +
    '<span class="pill">' + esc(profileLine()) + '</span></div>' +
    '<p class="sub" style="margin:8px 0 12px">For your first session of each exercise. After that your own log takes over, not this table.</p>' +
    '<div class="tw"><table><thead><tr><th>Exercise</th><th>Start</th><th>Why</th></tr></thead><tbody>' +
    Object.keys(SESSIONS).map(k => {
      const s = SESSIONS[k];
      return '<tr class="grp"><td colspan="3">' + s.label + '</td></tr>' +
        sesIds(k).filter(id => START[id]).map(id =>
          '<tr><td><b>' + esc(EX[id].n) + '</b></td><td class="m" style="color:var(--acc)">' + esc(START[id].w) + '</td>' +
          '<td class="tiny">' + esc(START[id].why) + '</td></tr>').join('');
    }).join('') + '</tbody></table></div>' +
    '<div class="note w" style="margin-top:12px"><b>Machines lie between gyms.</b> A plate marked "20" on a pulldown may be 20 real kg or a reduced pulley. A leg press sled weighs 20–40 kg empty. So the number above is only the entry point: the <b>test set</b> decides.</div>' +
    '<div class="hr"></div><div class="sec-t">The test set (day 1 of each exercise)</div>' +
    '<div class="cue">Load the weight from the table and do <b>10 controlled reps</b>.</div>' +
    '<div class="cue">Had <b>4 or more</b> reps left? Go up one step and repeat the test.</div>' +
    '<div class="cue">Barely got <b>8 or fewer</b>, or your technique changed? Go down one step.</div>' +
    '<div class="cue">Had <b>2–3</b> left? That is your weight. Log it and start set 1.</div>' +
    '<div class="cue">The test set <b>does not count</b> as a working set, same as the warm-up.</div>' +
    '<div class="note" style="margin-top:12px">Do this once per exercise. From the second session the app already knows your last weight and tells you when to go up.</div></div>';

  h += '<div class="card"><div class="spread"><div class="sec-t" style="margin:0">Full program table</div>' +
    '<button class="btn sm no-print" onclick="window.print()">Print</button></div>' +
    '<div class="tw"><table><thead><tr><th>Day</th><th>Exercise</th><th>Sets</th><th>Reps</th><th>Rest</th><th>RIR</th><th>Group</th></tr></thead><tbody>';
  Object.keys(SESSIONS).forEach(k => {
    const s = SESSIONS[k];
    h += '<tr class="grp"><td colspan="7">' + s.label + ' — ' + s.sub +
      (sesEdited(k) ? ' (edited)' : '') + '</td></tr>';
    sesList(k).forEach(item => {
      const id = item.id, e = EX[id];
      h += '<tr><td class="m">' + s.label + '</td><td><b>' + esc(e.n) + '</b></td><td class="m">' + item.sets + '</td>' +
        '<td class="m">' + e.lo + '–' + e.hi + (e.uni ? ' /leg' : '') + '</td><td class="m">' + fmtRest(e.rest) + '</td>' +
        '<td class="m">' + (id === 'rdl' ? '3' : '2–3') + '</td><td class="m">' + esc(e.g) + '</td></tr>';
    });
  });
  h += '</tbody></table></div></div>';

  h += '<div class="card"><div class="sec-t">Time per session (~65 min)</div>' +
    '<div class="tw"><table><thead><tr><th>Part</th><th>Duration</th><th>What happens</th></tr></thead><tbody>' +
    '<tr><td><b>Warm-up</b></td><td class="m">8–12 min</td><td>Easy cardio, mobility and ramp-up sets for the first exercise.</td></tr>' +
    '<tr><td><b>Compounds 1–2</b></td><td class="m">18–22 min</td><td>6 working sets with 2–3 min rest. The most important part of the day.</td></tr>' +
    '<tr><td><b>Compounds 3–4</b></td><td class="m">16–18 min</td><td>6 sets with 90–120 s rest.</td></tr>' +
    '<tr><td><b>Isolations 5–7</b></td><td class="m">14–16 min</td><td>7 sets with 60–90 s rest.</td></tr>' +
    '<tr><td><b>Wrap-up</b></td><td class="m">3–5 min</td><td>Log the session, easy stretching, water.</td></tr>' +
    '</tbody></table></div>' +
    '<div class="note" style="margin-top:12px">If you go past 80 minutes it is almost always the phone between sets, not the training. The app timer exists for exactly that.</div></div>';

  $('#v-plan').innerHTML = h;
  wireSched();
  $$('[data-edses]').forEach(b => b.onclick = () => openSesEdit(b.dataset.edses, rPlan));
}

/* ============ VIEW: GUIDE ============ */
function rGuide() {
  let h = '<div class="card"><div class="h-lg">Guide</div>' +
    '<p class="sub" style="margin-top:8px">Everything you need to understand for the program to work. Read it once end to end, then come back to whatever you need.</p></div>';
  h += GUIDE.map(g => '<details class="q"><summary>' + esc(g.t) + '</summary><div>' + g.body + '</div></details>').join('');

  h += '<div class="card" style="margin-top:14px"><div class="sec-t">After every workout</div>' +
    POST.map(c => '<div class="chk"><div class="box">&#10003;</div><span>' + c[1] + '</span></div>').join('') +
    '<p class="tiny" style="margin-top:10px">This pops up on its own the moment you close a session in the <b>Today</b> tab, and it is saved with that session.</p></div>';

  h += '<div class="card no-print"><div class="sec-t">Settings</div>' +
    '<div class="grid g2">' +
    '<label class="f"><span>Program start (Monday of week 1)</span><input type="date" id="pstart" value="' + (S.profile.start || '') + '"></label>' +
    '<label class="f"><span>Age</span><input type="number" id="pedad" value="' + (S.profile.age || '') + '"></label>' +
    '<label class="f"><span>Height (cm)</span><input type="number" id="palt" value="' + (S.profile.height || '') + '"></label>' +
    '<label class="f"><span>Bodyweight estimate (kg)</span><input type="number" step="0.5" id="ppeso" value="' + (S.profile.weight || '') + '"></label>' +
    '</div>' +
    '<p class="tiny" style="margin-top:8px">The bodyweight estimate is only used when you have not logged a real weigh-in. Trials like "bench your own bodyweight" need a number to aim at.</p>' +
    '<div class="chk ' + (S.prefs.sound ? 'on' : '') + '" id="snd" style="margin-top:12px"><div class="box">&#10003;</div><span>Sound when the rest timer ends</span></div>' +
    '<div class="hr"></div>' +
    '<div class="sec-t">Backup</div>' +
    '<p class="sub" style="margin-bottom:12px">Everything lives in this browser. If you wipe browsing data or change computers, it is gone. Export now and then — the file includes your photos.</p>' +
    '<div class="row wrap"><button class="btn" id="exp">Export backup</button>' +
    '<button class="btn" id="imp">Import backup</button>' +
    '<input type="file" id="impf" accept="application/json" hidden>' +
    '<button class="btn danger" id="wipe">Erase everything</button></div></div>';

  $('#v-guide').innerHTML = h;
  $('#pstart').onchange = e => { S.profile.start = e.target.value; save(); toast('Start date updated'); render('guide'); };
  $('#pedad').onchange = e => { S.profile.age = +e.target.value || null; save(); };
  $('#palt').onchange = e => { S.profile.height = +e.target.value || null; save(); };
  $('#ppeso').onchange = e => { S.profile.weight = +e.target.value || null; save(); };
  $('#snd').onclick = () => { S.prefs.sound = !S.prefs.sound; save(); $('#snd').classList.toggle('on', S.prefs.sound); };
  $('#exp').onclick = doExport;
  $('#imp').onclick = () => $('#impf').click();
  $('#impf').onchange = e => { if (e.target.files[0]) doImport(e.target.files[0]); };
  $('#wipe').onclick = () => {
    if (!confirm('This erases EVERYTHING: sessions, measurements and photos. Sure?')) return;
    if (!confirm('Final confirmation. This cannot be undone.')) return;
    S.photos.forEach(p => phDel(p.id).catch(() => {}));
    localStorage.removeItem(LS); location.reload();
  };
}
async function doExport() {
  toast('Preparing backup...');
  const photos = [];
  for (const p of S.photos) {
    try { photos.push(Object.assign({}, p, { data: await phGet(p.id) })); } catch (e) {}
  }
  const blob = new Blob([JSON.stringify({ v: 1, S: S, photos: photos }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'monolith-' + dk(new Date()) + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast('Backup downloaded');
}
function doImport(file) {
  const fr = new FileReader();
  fr.onload = async () => {
    try {
      const o = JSON.parse(fr.result);
      if (!o.S) throw new Error('format');
      if (!confirm('This replaces all current data. Continue?')) return;
      S = Object.assign(defaults(), o.S);
      S.photos.forEach(p => { if (POSE_MAP[p.pose]) p.pose = POSE_MAP[p.pose]; });
      for (const p of (o.photos || [])) { if (p.data) await phPut(p.id, p.data); }
      save(); toast('Backup restored'); go('today');
    } catch (e) { toast('Invalid file'); }
  };
  fr.readAsText(file);
}

/* ============ boot ============ */
migrateSplit();
ensureStart();
applyLang(S.prefs && S.prefs.lang);
paintLangBtn();
$('#langbtn').onclick = () => setLang(LANG === 'es' ? 'en' : 'es');
phInit().then(() => { if (cur === 'photos') rPhotos(); });
nav();
render('today');
if (navigator.wakeLock) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') navigator.wakeLock.request('screen').catch(() => {});
  });
  navigator.wakeLock.request('screen').catch(() => {});
}
