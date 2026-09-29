/* MONOLITH test suite  —  node test/suite.js
   Loads the real app into a vm with a DOM stub and checks the things that
   would silently break. Lives in the project, not a temp folder, because
   temp folders get wiped between sessions and this kept getting lost. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const DIR = path.join(__dirname, '..');
const FILES = ['data.js', 'lang.js', 'anatomy.js', 'ranks.js', 'exphoto.js',
               'game.js', 'world.js', 'planner.js', 'coach.js', 'app.js'];

/* ---------------- DOM stub ---------------- */
function el() {
  const e = {
    innerHTML: '', textContent: '', value: '', disabled: false, src: '', style: {}, dataset: {},
    files: [], width: 300, height: 400, clientWidth: 560,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {}, appendChild() {}, click() {},
    closest() { return el(); }, querySelector() { return el(); }, querySelectorAll() { return []; },
    getContext() { return { drawImage() {}, clearRect() {}, beginPath() {}, arc() {}, fill() {}, stroke() {},
      moveTo() {}, lineTo() {}, setLineDash() {}, translate() {}, scale() {} }; },
    toDataURL() { return 'x'; }, toBlob(c) { c({}); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 300, height: 400 }; }
  };
  return e;
}
const pad = n => String(n).padStart(2, '0');
const r1 = n => Math.round(n * 10) / 10;
const dk = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- seed ---------------- */
const START_MON = new Date(2026, 6, 6);
const SES = { PUSH: ['bench', 'incdb', 'ohp', 'latraise', 'triprop', 'tripro2'],
              PULL: ['latpull2', 'seatrow', 'latpull', 'machrow', 'preacher', 'inchammer'],
              LEGS: ['legpress', 'rdl', 'bss', 'legcurl', 'legext', 'calf', 'core'] };
function makeSeed(sessionIds) {
  const logs = {};
  for (let w = 0; w < 8; w++) {
    [[1, sessionIds[0]], [2, sessionIds[1]], [4, sessionIds[2]]].forEach(([off, sid]) => {
      const d = new Date(START_MON); d.setDate(d.getDate() + w * 7 + off);
      const sets = {};
      (SES[sid] || SES.PUSH).forEach(ex => { sets[ex] = [0, 1, 2].map(() => ({ w: 30 + w * 2, r: 10, rir: 2, done: true })); });
      logs[dk(d)] = { s: sid, sets: sets, chk: {}, notes: 'ok', done: true };
    });
  }
  return {
    profile: { name: 'P', age: 17, height: 180, start: dk(START_MON) },
    logs: logs, jaw: {},
    measures: [{ date: '2026-07-06', peso: 64, hombros: 112, cintura: 72 },
               { date: '2026-08-03', peso: 65.4, hombros: 114, cintura: 72.5 }],
    photos: [{ id: 1, date: '2026-07-06', pose: 'front', marks: { cuello: { x: .5, y: .2 }, ombligo: { x: .5, y: .55 },
      homI: { x: .29, y: .24 }, homD: { x: .71, y: .24 }, cinI: { x: .37, y: .5 }, cinD: { x: .63, y: .5 } } }],
    prefs: { sound: true }
  };
}

/* build a fresh app instance around a given saved state */
function boot(saved) {
  const store = { 'monolith.v1': JSON.stringify(saved) };
  const ctx = {
    console: { log() {}, warn() {}, error() {}, info() {} },
    setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    Math, Date, JSON, Object, Array, String, Number, Boolean, Promise, Error, isNaN, parseInt, parseFloat,
    localStorage: { getItem: k => store[k] || null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] },
    indexedDB: { open() { throw new Error('no idb in tests'); } },
    fetch: () => Promise.reject(new Error('no network in tests')),
    TextDecoder: TextDecoder,
    navigator: { vibrate() {} }, location: { reload() {} }, confirm: () => true,
    Image: function () {
      const self = this; self.onload = null; self.width = 1200; self.height = 1600;
      Object.defineProperty(self, 'src', { set() { setTimeout(() => self.onload && self.onload(), 0); } });
    },
    Blob: function () {},
    FileReader: function () {
      const self = this; self.onload = null; self.onerror = null; self.result = null;
      self.readAsDataURL = function () { setTimeout(() => { self.result = 'data:image/jpeg;base64,PHOTO'; if (self.onload) self.onload(); }, 0); };
    },
    URL: { createObjectURL: () => '', revokeObjectURL() {} },
    document: { querySelector: () => el(), querySelectorAll: () => [], createElement: () => el(),
      addEventListener() {}, visibilityState: 'visible', head: el(), documentElement: el(),
      getElementById: () => null, body: el() }
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  FILES.forEach(f => vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), ctx, { filename: f }));
  ctx.$get = name => vm.runInContext(name, ctx);   /* reach top-level consts */
  return ctx;
}

(async () => {
let fails = 0;
const ok = (c, m) => { if (c) console.log('OK  ' + m); else { fails++; console.log('FAIL ' + m); } };
const head = t => console.log('\n--- ' + t + ' ---');

/* ================= boot & views ================= */
head('BOOT');
let ctx;
try { ctx = boot(makeSeed(['PUSH', 'PULL', 'LEGS'])); console.log('OK  all ' + FILES.length + ' files loaded and the first render ran'); }
catch (e) { console.log('FAIL boot: ' + e.message + '\n' + e.stack.split('\n').slice(1, 4).join('\n')); process.exit(1); }

const S = ctx.$get('S'), EX = ctx.$get('EX'), SESSIONS = ctx.$get('SESSIONS');
const DAYS = ctx.$get('DAYS'), EX_MUS = ctx.$get('EX_MUS'), POST = ctx.$get('POST'), JAW = ctx.$get('JAW');
const dOn = n => { const d = new Date(START_MON); d.setDate(d.getDate() + ((n - 1 + 7) % 7)); return d; };

head('VIEWS');
[dOn(2), dOn(3), dOn(4), dOn(5)].forEach(d => {
  try { ctx.viewDate = d; ctx.render('today'); }
  catch (e) { fails++; console.log('FAIL today ' + d.toDateString() + ': ' + e.message); }
});
console.log('OK  today renders on training days and rest days');
['coach', 'quest', 'photos', 'symmetry', 'measure', 'progress', 'plan', 'guide'].forEach(v => {
  try { ctx.render(v); } catch (e) { fails++; console.log('FAIL view ' + v + ': ' + e.message + '\n  ' + e.stack.split('\n')[1]); }
});
console.log('OK  every other view renders');

/* ================= push / pull / legs ================= */
head('PUSH / PULL / LEGS');
ok(Object.keys(SESSIONS).join(',') === 'PUSH,PULL,LEGS', 'the three sessions are PUSH, PULL, LEGS');
ok(ctx.sessionFor(dOn(2)) === 'PUSH' && ctx.sessionFor(dOn(3)) === 'PULL' && ctx.sessionFor(dOn(5)) === 'LEGS',
   'the default week is Tue Push / Wed Pull / Fri Legs');

/* a push day must not contain pulling work, and vice versa — that is the whole point */
const PUSH_M = ['chest', 'delt_f', 'delt_s', 'triceps'];
const PULL_M = ['lat', 'rhomboid', 'delt_r', 'biceps', 'forearm', 'trap'];
const wrongOnPush = SESSIONS.PUSH.ex.filter(id => EX_MUS[id].p.some(m => PULL_M.indexOf(m) >= 0));
const wrongOnPull = SESSIONS.PULL.ex.filter(id => EX_MUS[id].p.some(m => PUSH_M.indexOf(m) >= 0));
ok(wrongOnPush.length === 0, 'nothing on push day is primarily a pull' + (wrongOnPush.length ? ': ' + wrongOnPush : ''));
ok(wrongOnPull.length === 0, 'nothing on pull day is primarily a push' + (wrongOnPull.length ? ': ' + wrongOnPull : ''));
ok(SESSIONS.LEGS.ex.every(id => EX_MUS[id].p.every(m => PUSH_M.indexOf(m) < 0 && PULL_M.indexOf(m) < 0)),
   'leg day stays legs and core');
const all = Object.keys(SESSIONS).reduce((a, k) => a.concat(SESSIONS[k].ex), []);
ok(all.length === new Set(all).size, 'no exercise appears in two different sessions');
ok(new Set(Object.keys(SESSIONS).map(k => SESSIONS[k].cls)).size === 3, 'each day has its own colour');
Object.keys(SESSIONS).forEach(k => {
  const t = ctx.sesTotal(k);
  if (t < 14 || t > 22) { fails++; console.log('FAIL ' + k + ' has ' + t + ' sets, outside a sane 14-22'); }
});
console.log('OK  set counts are balanced: ' + Object.keys(SESSIONS).map(k => k + ' ' + ctx.sesTotal(k)).join(', '));
ok(Object.keys(ctx.$get('WARMUP')).join(',') === 'PUSH,PULL,LEGS', 'each day has its own warm-up');

/* ================= migrating an old save ================= */
head('MIGRATING THE OLD UPPER / LOWER SPLIT');
const old = makeSeed(['UPPER_A', 'LEGS', 'UPPER_B']);
old.sched = { 0: null, 1: null, 2: 'UPPER_A', 3: 'LEGS', 4: null, 5: 'UPPER_B', 6: null };
old.plan = { UPPER_A: [{ id: 'bench', sets: 5 }], LEGS: [{ id: 'legpress', sets: 4 }] };
const nOldLogs = Object.keys(old.logs).length;
const m = boot(old);
const S2 = m.$get('S');
ok(S2.splitV === 2, 'an old save is migrated once and marked, so it never runs twice');
ok(S2.sched[2] === 'PUSH' && S2.sched[3] === 'LEGS' && S2.sched[5] === 'PULL',
   'the calendar keeps its days: Upper A becomes Push, Upper B becomes Pull');
ok(!!S2.plan.PUSH && S2.plan.PUSH[0].sets === 5 && !S2.plan.UPPER_A,
   'a session you had edited keeps the edit under its new name');
ok(!!S2.plan.LEGS, 'and leg day, whose name did not change, is untouched');
const stillOld = Object.keys(S2.logs).filter(k => /UPPER/.test(S2.logs[k].s));
ok(stillOld.length === 0, 'every one of the ' + nOldLogs + ' logged sessions was renamed, none left dangling');
ok(Object.keys(S2.logs).length === nOldLogs, 'and no session was lost in the process');
ok(Object.keys(S2.logs).every(k => SESSIONS[S2.logs[k].s]), 'every log now points at a session that exists');
try { m.viewDate = dOn(2); m.render('today'); m.render('progress'); m.render('quest');
  console.log('OK  a migrated save renders history without crashing'); }
catch (e) { fails++; console.log('FAIL migrated render: ' + e.message); }
ok(m.computeGame().sessions === nOldLogs, 'the XP economy still counts all ' + nOldLogs + ' of them');
/* running it again must be a no-op */
const before = JSON.stringify(S2.sched);
m.migrateSplit();
ok(JSON.stringify(S2.sched) === before, 'a second run changes nothing');

/* ================= schedule & sessions are editable ================= */
head('EDITABLE SCHEDULE AND SESSIONS');
S.sched = { 0: null, 1: 'LEGS', 2: null, 3: null, 4: 'PUSH', 5: null, 6: 'PULL' };
ok(ctx.sessionFor(dOn(1)) === 'LEGS' && ctx.sessionFor(dOn(4)) === 'PUSH', 'sessions can be moved to any day');
ok(ctx.trainingDaysText() === 'Monday, Thursday and Saturday', 'and it reads back as a sentence');
S.sched = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
try { ctx.render('plan'); ctx.viewDate = dOn(2); ctx.render('today'); console.log('OK  an all-rest week still renders'); }
catch (e) { fails++; console.log('FAIL all-rest week: ' + e.message); }
S.sched = { 0: null, 1: null, 2: 'PUSH', 3: 'PULL', 4: null, 5: 'LEGS', 6: null };

let list = ctx.sesList('PUSH');
list[0].sets = 5; ctx.setSesList('PUSH', list);
ok(ctx.setsFor('PUSH', 'bench') === 5 && ctx.sesEdited('PUSH'), 'set counts are editable');
S.plan.PUSH = [{ id: 'bench', sets: 99 }, { id: 'nope', sets: 3 }, null];
const clean = ctx.sesList('PUSH');
ok(clean.length === 1 && clean[0].sets === 6, 'a corrupt saved plan is cleaned, not obeyed');
ctx.setSesList('PUSH', null);
ok(!ctx.sesEdited('PUSH'), 'reset restores the built-in session');

/* ================= everything else that must not regress ================= */
head('REGRESSIONS');
const g = ctx.computeGame(), e = ctx.energyInfo(g);
ok(e.earned === e.fromSets + e.fromSessions && e.left === e.earned - e.spent, 'the energy ledger adds up');
ok(/Log one set/.test(ctx.energyCard(g)), 'and the meter still explains itself');
ok(POST.length === 5 && typeof ctx.renderChecklist === 'undefined', 'the after-workout list replaced the pre-workout one');
const lk = Object.keys(S.logs).filter(k => S.logs[k].done)[0];
const xp0 = ctx.computeGame().xp;
POST.forEach(x => S.logs[lk].chk[x[0]] = true);
ok(ctx.ritualDone(S.logs[lk]) && ctx.computeGame().xp === xp0 + 30, 'finishing it still pays +30 XP');
S.logs[lk].chk = {};
S.jaw = {}; S.jaw[dk(new Date())] = {}; JAW.forEach(j => S.jaw[dk(new Date())][j.id] = true);
ok(ctx.computeGame().jawXP === JAW.length * 3 + 10, 'the jaw routine still pays its trickle');
S.jaw = {};
ok(ctx.$get('TIERS').length === 7 && ctx.strengthRank().tier >= 0, 'strength ranks still compute');
ok(Object.keys(EX).every(id => ctx.$get('EX_POSE')[id] && EX_MUS[id]), 'every exercise still has a diagram and a muscle map');
ok(/<svg /.test(ctx.exFrame('bench', 'a')) && /data-exshot/.test(ctx.exFrame('bench', 'a')),
   'exercise cards still offer the drawing and the photo buttons');
ok(ctx.$get('AI_ENGINES')[0] === 'free' && ctx.aiEngine() === 'free', 'Monolith AI still defaults to the free engine');
const plan = ctx.plannerAnswer('give me a push day');
ok(!!plan.plan && plan.plan.list.length >= 3, 'the planner understands "push day" and builds one');
ok(plan.plan.list.every(id => EX_MUS[id.id].p.some(mm => PUSH_M.indexOf(mm) >= 0)), 'and it is genuinely push work');

head('LANGUAGE');
ok(ctx.$get('LANG') === 'en' && EX.bench.n === 'Barbell Bench Press', 'boots in English');
ctx.setLang('es');
ok(SESSIONS.PUSH.label === 'EMPUJE' && SESSIONS.PULL.label === 'TIRÓN' && SESSIONS.LEGS.label === 'PIERNA',
   'the three days translate: ' + Object.keys(SESSIONS).map(k => SESSIONS[k].label).join(' / '));
ok(ctx.$get('WARMUP').PULL[1][1] === 'Movilidad torácica', 'so do the warm-ups');
try { ctx.viewDate = dOn(2); ctx.render('today'); ['plan', 'quest', 'guide'].forEach(v => ctx.render(v));
  console.log('OK  every view renders in Spanish'); }
catch (err) { fails++; console.log('FAIL Spanish render: ' + err.message); }
ctx.setLang('en');
ok(SESSIONS.PUSH.label === 'PUSH', 'and switching back restores English');

console.log(fails ? '\n>>> ' + fails + ' FAILURES' : '\n>>> ALL GREEN');
process.exit(fails ? 1 : 0);
})();
