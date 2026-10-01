/* MONOLITH test suite  —  node test/suite.js
   Loads the real app into a vm with a DOM stub and checks the things that
   would silently break. Lives in the project, not a temp folder, because
   temp folders get wiped between sessions and this kept getting lost. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const DIR = path.join(__dirname, '..');
const FILES = ['data.js', 'lang.js', 'anatomy.js', 'bestiary.js', 'ranks.js', 'exphoto.js',
               'game.js', 'world.js', 'planner.js', 'coach.js', 'sync.js', 'app.js'];

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
    _attr: {}, setAttribute(k, v) { this._attr[k] = v; }, getAttribute(k) { return this._attr[k]; },
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
    addEventListener() {}, removeEventListener() {}, scrollTo() {}, innerWidth: 900,
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
    /* querySelector must return the SAME node for the same selector, or code
       that sets an attribute and code that reads it talk to different objects */
    document: { _q: {}, querySelector(sel) { return this._q[sel] || (this._q[sel] = el()); },
      querySelectorAll: () => [], createElement: () => el(),
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

head('INTERFACE STRINGS');
{
const UI = ctx.$get('UI');
const used = new Set();
/* lang.js itself is skipped: its own doc comment says tr('key') */
FILES.filter(f => f !== 'lang.js').forEach(f => {
  const src = fs.readFileSync(path.join(DIR, f), 'utf8');
  (src.match(/\btr\('[A-Za-z0-9_]+'\)/g) || []).forEach(m => used.add(m.slice(4, -2)));
});
const missEn = [...used].filter(k => UI.en[k] === undefined);
const missEs = [...used].filter(k => UI.es[k] === undefined);
ok(used.size >= 40, 'the source asks for ' + used.size + ' interface strings');
ok(missEn.length === 0, 'every one of them exists in English' + (missEn.length ? ' — missing: ' + missEn.join(', ') : ''));
ok(missEs.length === 0, 'and in Spanish' + (missEs.length ? ' — missing: ' + missEs.join(', ') : ''));
/* a handful of words really are the same in both languages */
const SAME_OK = ['tab_plan'];
const same = Object.keys(UI.en).filter(k => UI.es[k] === UI.en[k] && !/^lang_/.test(k) &&
  SAME_OK.indexOf(k) < 0 && String(UI.en[k]).length > 3);
ok(same.length === 0, 'and none of them was left in English inside the Spanish dictionary' +
   (same.length ? ' — ' + same.join(', ') : ''));
}

head('THE FORGE — COMBAT');
{
const C = boot(makeSeed(['PUSH','PULL','LEGS']));
const SC = C.$get('S'), ATTACKS = C.$get('ATTACKS'), MOBS = C.$get('MOBS'), BOSSES = C.$get('BOSSES');
const BEAST = C.$get('BEAST'), g2 = C.computeGame(), R = C.rpg();

/* ---- every creature in the world has a face ---- */
const allFoes = Object.keys(MOBS).concat(Object.keys(BOSSES));
const noArt = allFoes.filter(k => !BEAST[k]);
ok(noArt.length === 0, 'all ' + allFoes.length + ' creatures have a drawing' + (noArt.length ? ' — missing: ' + noArt.join(', ') : ''));
const guards = Object.keys(C.$get('DUNGEONS')).map(d => C.$get('DUNGEONS')[d].guard);
ok(guards.every(gu => gu.ak && BEAST[gu.ak]), 'and so does every dungeon guardian');
const bad = allFoes.filter(k => {
  const svg = C.creatureArt(Object.assign({}, MOBS[k] || BOSSES[k]), 112);
  return !/^<svg /.test(svg) || svg.length < 400 || /NaN|undefined/.test(svg);
});
ok(bad.length === 0, 'every drawing is real SVG with no NaN in it' + (bad.length ? ' — broken: ' + bad.join(', ') : ''));
ok(/<svg /.test(C.heroArt(104)) && !/NaN/.test(C.heroArt(104)), 'and so do you');
/* a creature with no art key still gets a body rather than an empty box */
const orphan = C.creatureArt({ n: 'Something New', t: 'beast', hp: 10, atk: 5, def: 1 }, 90);
ok(/<svg /.test(orphan) && orphan.length > 400, 'a creature with no art key still gets a body');

/* ---- uses: the stronger the move, the fewer of them ---- */
const pows = Object.keys(ATTACKS).filter(k => ATTACKS[k].kind === 'dmg').map(k => ({ k: k, pow: ATTACKS[k].pow, pp: C.movePP(k) }));
const sorted = pows.slice().sort((a, b) => a.pow - b.pow);
let monotone = true;
for (let i = 1; i < sorted.length; i++) if (sorted[i].pp > sorted[i - 1].pp) monotone = false;
ok(monotone, 'uses never go up as power goes up — ' +
   sorted.map(x => x.pow + 'pow/' + x.pp).join(' '));
ok(C.movePP('bench_strike') === 20 && C.movePP('judgement') === 9 && C.movePP('anvil_drop') === 8,
   'the weakest move gets 20 uses, the heaviest 8');
ok(C.movePP('resolve') === 4 && C.movePP('roar') === 3, 'and the support moves are capped by hand, not by the formula');
ok(Object.keys(ATTACKS).every(k => C.movePP(k) >= 3), 'nothing is so strong it gets fewer than 3');

/* ---- spending them ---- */
R.moves = ['bench_strike', 'lat_pull'];
ok(C.ppLeft('bench_strike') === 20, 'an untouched move starts full');
C.ppSpend('bench_strike');
ok(C.ppLeft('bench_strike') === 19, 'using it costs one');
for (let i = 0; i < 25; i++) C.ppSpend('bench_strike');
ok(C.ppLeft('bench_strike') === 0, 'and it bottoms out at zero rather than going negative');
ok(!C.ppDry(C.computeGame()), 'with one move still loaded you are not dry');
C.rpg().moves.forEach(m => { for (let i = 0; i < 30; i++) C.ppSpend(m); });
ok(C.ppDry(C.computeGame()), 'empty every move and you are');
ok(C.moveById('bare').pow === 12 && C.ppLeft('bare') > 0, 'bare hands are always there, and always weak');

/* ---- speed decides who connects ---- */
ok(C.foeVel({ atk: 10 }) < C.foeVel({ atk: 40 }), 'an angrier creature is a faster one');
ok(C.foeVel({ atk: 40, vel: 5 }) === 5, 'unless it says otherwise');
ok(C.hitChance(95, 40, 10) > C.hitChance(95, 10, 40), 'being faster makes you land more');
ok(C.hitChance(95, 999, 0) <= 99 && C.hitChance(50, 0, 999) >= 45, 'but nothing ever always lands or always misses');
ok(C.critChance(5, 60, 10) > C.critChance(5, 10, 60), 'and speed buys crits too');
ok(C.moveAcc(ATTACKS.anvil_drop) < C.moveAcc(ATTACKS.bench_strike), 'the heaviest move is also the least reliable');

/* ---- a whole fight, start to finish ---- */
C.rpg().pp = {}; C.rpg().hp = null;
const spent0 = C.rpg().spent;
C.startBattle(Object.assign({}, MOBS.slag), { mobId: 'slag', cost: 1, repeat: true });
const Bf = C.$get('B');
ok(!!Bf && Bf.fhp === MOBS.slag.hp, 'a fight starts with the creature at full health');
ok(C.rpg().spent === spent0 + 1, 'and it cost one energy');
ok(Bf.vel === Bf.hs.vel && Bf.fvel > 0, 'both sides brought a speed');
const pp0 = C.ppLeft('bench_strike');
C.rpg().moves = ['bench_strike'];
C.heroAct('bench_strike');
ok(C.ppLeft('bench_strike') === pp0 - 1, 'swinging spends a use whether or not it lands');
await sleep(60);
/* fight it to the end on a fast clock */
let guard2 = 0;
while (C.$get('B') && !C.$get('B').over && guard2++ < 400) {
  const BB = C.$get('B');
  if (!BB.busy) C.heroAct('bench_strike');
  await sleep(4);
}
const Bend = C.$get('B');
ok(!!Bend && Bend.over, 'the fight ends by itself');
ok(Bend.hp < Bend.max || Bend.result.win, 'and it cost you something, or you won clean');
ok(C.rpg().hp === Math.max(0, Bend.hp), 'the health you walk out with is the health that gets saved');

/* ---- the tavern is the only way back ---- */
const hsT = C.heroStats(C.computeGame());
C.rpg().hp = 3; C.rpg().pp = { bench_strike: 0 }; C.rpg().restedAt = 999;
ok(C.heroHP(hsT) === 3, 'a wounded hero stays wounded between fights');
ok(!C.restFree(C.computeGame()), 'with no new session closed, resting is not free');
const en0 = C.energy(C.computeGame());
C.doRest(C.computeGame());
ok(C.heroHP(C.heroStats(C.computeGame())) === hsT.hp, 'resting gives all the health back');
ok(C.ppLeft('bench_strike') === C.movePP('bench_strike'), 'and every move its uses');
ok(C.energy(C.computeGame()) === en0 - 1, 'and it cost exactly one energy');
C.rpg().hp = 5; C.rpg().restedAt = 0;
const en1 = C.energy(C.computeGame());
ok(C.restFree(C.computeGame()), 'close a session and the next rest is free');
C.doRest(C.computeGame());
ok(C.energy(C.computeGame()) === en1, 'a free rest costs nothing');
ok(C.rpg().restedAt === C.computeGame().sessions, 'and it is only free once');

/* ---- at zero you cannot fight, which is the point ---- */
C.rpg().hp = 0;
const spent1 = C.rpg().spent;
C.startBattle(Object.assign({}, MOBS.slag), { mobId: 'slag', cost: 1 });
ok(C.rpg().spent === spent1, 'at zero health a fight does not even start, so no energy is burned');

/* ---- max HP moving must not make a wounded hero immortal ---- */
C.rpg().hp = 10000;
ok(C.heroHP(C.heroStats(C.computeGame())) === C.heroStats(C.computeGame()).hp,
   'stored health is clamped to the max you currently have');

/* ---- and the screen still draws ---- */
C.rpg().hp = null;
try { C.startBattle(Object.assign({}, BOSSES.b1), { boss: 'b1', cost: 3 }); C.drawBattle(); C.updateBattle();
  console.log('OK  the battle screen builds and updates'); }
catch (err) { fails++; console.log('FAIL battle screen: ' + err.message + '\n  ' + err.stack.split('\n')[1]); }
try { C.openTavern(); console.log('OK  the tavern opens'); }
catch (err) { fails++; console.log('FAIL tavern: ' + err.message); }
}

head('SYNC BETWEEN DEVICES');
/* the merge is the dangerous part: a bad one silently deletes a workout */
const A = boot(makeSeed(['PUSH','PULL','LEGS']));
const SA = A.$get('S');
SA.sync = { token: 't', gist: '', last: null, device: 'a' };

/* device B has trained on a day A knows nothing about, and has a photo A lacks */
const soloKey = '2099-03-02';
const remote = JSON.parse(JSON.stringify(A.syncPayload()));
remote.logs[soloKey] = { s: 'PUSH', sets: { bench: [{ w: 50, r: 8, rir: 2, done: true }] }, chk: {}, notes: '', done: true };
remote.photos.push({ id: 9001, date: '2099-03-02', pose: 'front', marks: null });
remote.measures.push({ date: '2099-03-02', peso: 70 });
remote.jaw = { '2099-03-02': { tuck: true } };
remote.at = new Date(Date.now() + 60000).toISOString();

/* and A has a day B knows nothing about */
SA.logs['2099-03-05'] = { s: 'LEGS', sets: { legpress: [{ w: 90, r: 10, rir: 2, done: true }] }, chk: {}, notes: '', done: true };
const beforeCount = Object.keys(SA.logs).length;

const res = A.syncMerge(remote);
ok(!!SA.logs[soloKey], 'a session only the other device had is pulled in');
ok(!!SA.logs['2099-03-05'], 'and the session only THIS device had survives — nothing is overwritten');
ok(Object.keys(SA.logs).length === beforeCount + 1, 'exactly one session was added, none lost');
ok(res.logs === 1, 'and it reports what it pulled');
ok(SA.photos.some(p => p.id === 9001), 'a photo the other device had is added to the library');
ok(SA.measures.some(m => m.date === '2099-03-02'), 'so are its measurements');
ok(!!(SA.jaw && SA.jaw['2099-03-02']), 'and its jaw-routine days');

/* the same day logged on both: the fuller version must win */
SA.logs['2099-03-09'] = { s: 'PUSH', sets: { bench: [{ w: 40, r: 8, done: true }] }, chk: {}, notes: '', done: false };
const r2 = JSON.parse(JSON.stringify(A.syncPayload()));
r2.logs['2099-03-09'] = { s: 'PUSH', sets: { bench: [{ w: 40, r: 8, done: true }, { w: 40, r: 8, done: true }, { w: 40, r: 8, done: true }] }, chk: {}, notes: '', done: true };
r2.at = new Date(Date.now() + 120000).toISOString();
A.syncMerge(r2);
ok(Object.keys(SA.logs['2099-03-09'].sets.bench).length === 3, 'when both sides logged the same day, the fuller session wins');

/* merging twice must not duplicate anything */
const n1 = Object.keys(SA.logs).length, p1 = SA.photos.length, m1 = SA.measures.length;
A.syncMerge(remote);
ok(Object.keys(SA.logs).length === n1 && SA.photos.length === p1 && SA.measures.length === m1,
   'merging the same payload twice adds nothing — sync is safe to repeat');

/* secrets must never leave the device */
SA.ai = { engine: 'claude', key: 'sk-ant-SECRET', chat: [{ role: 'user', content: 'hi' }], spent: { in: 1, out: 2, cached: 0 } };
SA.sync.token = 'ghp_SECRET';
const wire = JSON.stringify(A.syncPayload());
ok(wire.indexOf('sk-ant-SECRET') < 0, 'the Claude API key is NOT in what gets uploaded');
ok(wire.indexOf('ghp_SECRET') < 0, 'neither is the GitHub token');
ok(wire.indexOf('chat') >= 0, 'but the AI conversation itself does travel');

/* a payload from a future format version is ignored rather than half-applied */
const logsBefore = JSON.stringify(SA.logs);
A.syncMerge({ v: 99, logs: { '2099-04-01': { s: 'PUSH', sets: {}, done: true } } });
ok(JSON.stringify(SA.logs) === logsBefore, 'a payload from an unknown version is refused, not half-applied');

/* the photo list covers progress photos AND the ones pinned to exercises */
SA.exPhotos = { bench: { a: 1 } };
const ids = A.allPhotoIds();
ok(ids.indexOf('ex-bench-a') >= 0 && ids.some(x => /^[0-9]+$/.test(x)),
   'the upload list includes both progress photos and exercise photos');

/* with no token it refuses instead of failing halfway */
SA.sync.token = '';
let threw = null;
try { await A.syncNow(() => {}); } catch (e) { threw = e; }
ok(threw && /token/.test(threw.message), 'without a token it stops before touching the network');

head('iOS LAYOUT AND ZOOM');
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
ok(html.indexOf('padding:calc(10px + env(safe-area-inset-top') >= 0,
   'the header reserves room for the notch, so the clock cannot cover the top row');
ok(html.indexOf('viewport-fit=cover') >= 0, 'and the viewport opts into safe-area insets at all');
ok(html.indexOf('bottom:calc(18px + env(safe-area-inset-bottom') >= 0,
   'the rest timer clears the home indicator');
ok(html.indexOf('@media(max-width:620px)') >= 0 && html.indexOf('.brand span{display:none}') >= 0,
   'the header shrinks on a phone and drops the tagline');
ok(/id="zlock"/.test(html) && /id="zreset"/.test(html), 'both zoom buttons exist in the page');

/* the badge has to fit beside a notch */
S.prefs = S.prefs || {};
ctx.render('today');
const wide = ctx.$get('tr')('week') + ' ';
ok(ctx.$get('tr')('week_s').length <= 2, 'there is a one-letter week label for narrow screens');
ctx.setLang('es');
ok(ctx.$get('tr')('week_s') === 'S', 'in Spanish too');
ctx.setLang('en');

/* the zoom lock */
S.prefs.zoomLock = false;
ok(ctx.zoomLocked() === false, 'zoom starts unlocked');
S.prefs.zoomLock = true;
ok(ctx.zoomLocked() === true, 'and the preference is what drives it');
ctx.applyZoomLock();
const vp = ctx.vpMeta();
ok(/user-scalable=no/.test(vp.getAttribute('content')), 'locking clamps the viewport');
S.prefs.zoomLock = false;
ctx.applyZoomLock();
ok(!/user-scalable=no/.test(vp.getAttribute('content')), 'unlocking releases it again');
ok(ctx.$get('VP_LOCK') !== ctx.$get('VP_FREE') && /viewport-fit=cover/.test(ctx.$get('VP_LOCK')),
   'both viewport modes keep the safe-area opt-in, so the notch fix survives a lock');
try { ctx.resetView(); console.log('OK  reset view runs without throwing'); }
catch (e) { fails++; console.log('FAIL resetView: ' + e.message); }
/* the lock preference is a normal setting, so it syncs and survives a reload */
S.prefs.zoomLock = true;
ok(JSON.stringify(ctx.syncPayload()).indexOf('zoomLock') >= 0, 'and it travels with the rest of your settings');
S.prefs.zoomLock = false;

head('LANGUAGE');
/* the ones lang.js registers itself, then the ones world.js registers late */
const T = ['EX','SESSIONS','WARMUP','START','GUIDE','BLOCKS','JAW','JAW_TRUTH','MEASURES','NO_KIT','POSES','MARKS','POST',
          'TYPES','ATTACKS','ITEMS','SLOT_NAMES'];
const snapEN = {}; T.forEach(k => snapEN[k] = JSON.stringify(ctx.$get(k)));
ok(ctx.$get('LANG') === 'en' && EX.bench.n === 'Barbell Bench Press', 'boots in English');
const REG = Object.keys(ctx.$get('I18N_TARGETS'));
ok(T.every(k => REG.indexOf(k) >= 0) && REG.length === T.length,
   'all ' + T.length + ' data structures are registered for translation');

ctx.setLang('es');
const untouched = T.filter(k => JSON.stringify(ctx.$get(k)) === snapEN[k]);
ok(untouched.length === 0, 'every registered structure actually changes in Spanish' +
   (untouched.length ? ' — still English: ' + untouched.join(', ') : ''));

/* the big reading surfaces, specifically */
const G = ctx.$get('GUIDE');
ok(G.length === 14 && G.every(x => x.t && x.body), 'the guide keeps all 14 sections, title and body');
ok(!G.some(x => /Reps In Reserve|Beginner mistakes|when to stop/.test(x.t)), 'none of its titles are still English');
ok(/repeticiones en reserva/i.test(G[0].t) && /velocímetro/.test(G[0].body),
   'and it reads as Spanish prose, not a word-for-word swap');
ok(ctx.$get('JAW').every(j => /[áéíóúñ¿]/.test(j.why + j.how.join(''))),
   'the jaw routine is translated down to its how-to steps');
ok(ctx.$get('MEASURES')[0].n === 'Peso corporal' && ctx.$get('MEASURES')[0].k === 'peso',
   'measurements translate the label but keep the storage key');
ok(ctx.$get('MEASURES')[0].core === true, 'and the flag that marks the important ones');
ok(ctx.$get('POST')[0][0] === 'photo',
   'the after-workout list keeps its ids, so ticks already saved still count');
ok(ctx.$get('BLOCKS')[0].rirN === 3 && /Adaptación/.test(ctx.$get('BLOCKS')[0].name),
   'blocks translate their name but keep the numbers that drive the programme');
ok(ctx.$get('MARKS')[0].c === '#C8FF00', 'symmetry marks keep their colours');
ok(EX.pullup.n === 'Dominada' && EX.hipthrust.n.indexOf('Cadera') >= 0, 'the new exercises are translated too');
/* the forge: the words you read while deciding what to press */
ok(ctx.$get('TYPES').iron.n === 'Hierro' && ctx.$get('TYPES').iron.c === '#9FB3C8',
   'attack types translate their name and keep their colour');
const ATK = ctx.$get('ATTACKS');
ok(ATK.bench_strike.n === 'Golpe de Banca' && typeof ATK.bench_strike.u === 'function',
   'attacks translate without losing the rule that unlocks them');
ok(Object.keys(ATK).every(k => typeof ATK[k].u === 'function'), 'every single one of them');
ok(Object.keys(ATK).every(k => /[áéíóúñ¿¡]/.test(ATK[k].n + ATK[k].d) || ATK[k].n !== ctx.$get('EN_SNAP').ATTACKS[k].n),
   'and every one actually reads as Spanish');
ok(ctx.$get('ITEMS').shake.n === 'Batido de Proteína' && ctx.$get('ITEMS').shake.heal === 45,
   'gear translates its name and keeps what it does');
const enEX = JSON.parse(snapEN.EX);
const sameCues = Object.keys(EX).filter(id => EX[id].cues.join('') === enEX[id].cues.join(''));
ok(sameCues.length === 0, 'all ' + Object.keys(EX).length + ' exercises have Spanish cues' +
   (sameCues.length ? ' — missing: ' + sameCues.join(', ') : ''));
const sameName = Object.keys(EX).filter(id => EX[id].n === enEX[id].n);
ok(sameName.length === 0, 'and Spanish names' + (sameName.length ? ' — missing: ' + sameName.join(', ') : ''));

try { ctx.viewDate = dOn(2); ctx.render('today');
  ['plan', 'quest', 'guide', 'measure', 'coach', 'progress', 'symmetry'].forEach(v => ctx.render(v));
  console.log('OK  every view renders in Spanish'); }
catch (err) { fails++; console.log('FAIL Spanish render: ' + err.message); }

ctx.setLang('en');
const drift = T.filter(k => JSON.stringify(ctx.$get(k)) !== snapEN[k]);
ok(drift.length === 0, 'switching back restores every structure byte for byte' +
   (drift.length ? ' — drifted: ' + drift.join(', ') : ''));
ok(EX.pullup.n === 'Pull-up' && ctx.$get('GUIDE')[0].t === 'RIR — Reps In Reserve', 'including the guide and the new lifts');

head('THE FORTY EXERCISES');
ok(Object.keys(EX).length === 40, 'the catalogue holds 40 exercises');
const START = ctx.$get('START'), POSE = ctx.$get('EX_POSE');
ok(Object.keys(EX).every(id => START[id]), 'every one has a starting weight');
ok(Object.keys(EX).every(id => POSE[id] && EX_MUS[id]), 'every one has a diagram and a muscle map');
ok(Object.keys(EX).every(id => EX_MUS[id].p.length > 0), 'and names a prime mover');
const byGroup = {};
Object.keys(EX).forEach(id => { const g = EX[id].g.split(/[+·]/)[0].trim(); byGroup[g] = (byGroup[g] || 0) + 1; });
console.log('    groups: ' + Object.keys(byGroup).map(g => g + ' ' + byGroup[g]).join(', '));
ok(Object.keys(EX).filter(id => /chest/i.test(EX_MUS[id].p.join())).length >= 6, 'at least 6 chest options');
ok(Object.keys(EX).filter(id => /lat|rhomboid/.test(EX_MUS[id].p.join())).length >= 7, 'at least 7 back options');
ok(Object.keys(EX).filter(id => /biceps|triceps/.test(EX_MUS[id].p.join())).length >= 9, 'at least 9 arm options');
ok(Object.keys(EX).filter(id => /quad|ham|glute|calf/.test(EX_MUS[id].p.join())).length >= 10, 'at least 10 leg options');

console.log(fails ? '\n>>> ' + fails + ' FAILURES' : '\n>>> ALL GREEN');
process.exit(fails ? 1 : 0);
})();
