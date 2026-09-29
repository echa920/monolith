/* MONOLITH — hero layer
   Everything here is derived from what you actually log. No free points:
   every XP comes from a real set, a closed session, a photo, or a weight
   increase earned through double progression. */

/* ---------------- ranks ---------------- */
const RANKS = [
  { l: 1,  n: 'Forge Apprentice', d: 'You just picked up iron for the first time. Everyone starts here.' },
  { l: 3,  n: 'Iron Squire',      d: 'You know where every machine is now. Your body is starting to learn the language.' },
  { l: 6,  n: 'Steelbearer',      d: 'Technique stopped being a conscious effort. Now you can think about the weight.' },
  { l: 10, n: 'Forge Warrior',    d: 'Two months of real consistency. Statistically you have already outlasted 80% of people who start.' },
  { l: 15, n: 'Vanguard',         d: 'The mirror started showing you something else. People who do not see you often notice.' },
  { l: 20, n: 'Anvil Champion',   d: 'Half a year of real work. You are no longer "just starting the gym".' },
  { l: 30, n: 'Colossus',         d: 'Over a year in. The transformation is undeniable.' },
  { l: 40, n: 'Titan',            d: 'What you wanted in that photo is not a photo any more. It is you.' },
  { l: 55, n: 'Forge Legend',     d: 'Few make it here, and none of them got here in a hurry.' }
];

/* ---------------- attributes ---------------- */
const STATS = [
  { k: 'STR', n: 'Strength',    icon: '⚔', d: 'How much you move on the compounds, relative to your bodyweight. It does not rise by overloading: it rises by doing it well and repeating it.' },
  { k: 'VIG', n: 'Vigor',       icon: '❤', d: 'Total kilos you have lifted in your training life. The measure of accumulated work.' },
  { k: 'DIS', n: 'Discipline',  icon: '⚡', d: 'Sticking to the calendar, plus your current streak, with a small bonus for keeping the daily jawline & neck routine alive. The attribute that decides your final result more than any other.' },
  { k: 'MAS', n: 'Mastery',     icon: '🛡', d: 'Logging your RIR honestly and finishing the after-workout list. Rewards training with judgement, not ego.' },
  { k: 'FRG', n: 'Forge',       icon: '◈', d: 'Measured physical progress: photos analysed, measurements logged, and your shoulder-to-waist ratio.' }
];
/* combat mapping, shown to the player so the link is obvious */
const STAT_TO_COMBAT = { STR: 'Attack', VIG: 'Max HP', DIS: 'Speed', MAS: 'Defense', FRG: 'Crit rate' };

/* ---------------- trials ----------------
   These are GYM MILESTONES, not the creatures you fight on the map.
   kind 'lift'  : beat a weight on a lift (bw = bodyweight)
   kind 'ses'   : sessions closed
   kind 'streak': sessions in a row
   kind 'ratio' : shoulder-to-waist ratio from Symmetry
   kind 'prog'  : weight increases earned on different lifts            */
const MONSTERS = [
  /* --- TIER 1 --- */
  { id: 'rata',    t: 1, n: 'First Press',       kind: 'lift', ex: 'bench',    reps: 8,  w: () => 25, xp: 80,
    lore: 'Bench press 25 kg for 8. Your first milestone is not here to scare you: it is here to prove it can be done.' },
  { id: 'duende',  t: 1, n: 'First Pull',        kind: 'lift', ex: 'latpull',  reps: 10, w: () => 30, xp: 80,
    lore: 'Pulldown 30 kg for 10. Only counts if you pull with your elbows, not your hands.' },
  { id: 'jabali',  t: 1, n: 'Legs Not Skipped',  kind: 'lift', ex: 'legpress', reps: 10, w: () => 60, xp: 80,
    lore: 'Leg press 60 kg for 10. Nobody who looks the way you want to look skipped leg day.' },
  { id: 'perez',   t: 1, n: 'Beat the Excuse',   kind: 'ses',  need: 3, xp: 120,
    lore: 'Close 3 sessions. "I\'ll start tomorrow" has ended more training careers than every injury combined.' },

  /* --- TIER 2 --- */
  { id: 'golem',   t: 2, n: 'Bench 40',          kind: 'lift', ex: 'bench',    reps: 8,  w: () => 40, xp: 180,
    lore: 'Bench 40 kg for 8. You do not get here with one big effort: you get here with twelve weeks of adding 2.5 kg.' },
  { id: 'grifo',   t: 2, n: 'Pulldown 45',       kind: 'lift', ex: 'latpull',  reps: 8,  w: () => 45, xp: 180,
    lore: 'Pulldown 45 kg for 8. This is where your back genuinely starts getting wider.' },
  { id: 'carga',   t: 2, n: 'Triple Digits',     kind: 'lift', ex: 'legpress', reps: 10, w: () => 100, xp: 180,
    lore: 'Leg press 100 kg for 10. The first number that makes you feel actually strong.' },
  { id: 'gargola', t: 2, n: 'Overhead 12',       kind: 'lift', ex: 'ohp',      reps: 8,  w: () => 12, xp: 180,
    lore: 'Shoulder press 12 kg per hand for 8. This is the lift where you move the least weight — and that is completely normal.' },
  { id: 'serp',    t: 2, n: 'The Hinge',         kind: 'lift', ex: 'rdl',      reps: 10, w: () => 20, xp: 200,
    lore: 'RDL 20 kg per hand for 10, with a flat back. Not a strength milestone — a technique one.' },
  { id: 'desert',  t: 2, n: 'Six in a Row',      kind: 'streak', need: 6, xp: 250,
    lore: 'Six sessions without missing one. The streak matters more than any single workout in it.' },

  /* --- TIER 3 --- */
  { id: 'coloso',  t: 3, n: 'Three Quarters',    kind: 'lift', ex: 'bench',    reps: 8,  w: bw => Math.round(bw * 0.75), xp: 400,
    lore: 'Bench 0.75 × your bodyweight for 8. This is where you stop being someone who goes to the gym.' },
  { id: 'wyvern',  t: 3, n: 'Almost Bodyweight', kind: 'lift', ex: 'latpull',  reps: 8,  w: bw => Math.round(bw * 0.9), xp: 400,
    lore: 'Pulldown 0.9 × bodyweight for 8. The doorway to free pull-ups.' },
  { id: 'behem',   t: 3, n: 'Double Bodyweight', kind: 'lift', ex: 'legpress', reps: 10, w: bw => Math.round(bw * 2), xp: 400,
    lore: 'Leg press 2 × bodyweight for 10. Legs that can carry the torso you are building.' },
  { id: 'vigia',   t: 3, n: 'Shoulders That Show', kind: 'lift', ex: 'ohp',    reps: 8,  w: bw => Math.round(bw * 0.25), xp: 400,
    lore: 'Shoulder press a quarter of your bodyweight in each hand for 8. Shoulders visible from behind.' },
  { id: 'hidra',   t: 3, n: 'Hinge Mastery',     kind: 'lift', ex: 'rdl',      reps: 8,  w: () => 25, xp: 400,
    lore: 'RDL 25 kg per hand for 8. Every kilo you add makes the technique harder to hold. Never below RIR 3.' },
  { id: 'espectro', t: 3, n: 'The V Appears',    kind: 'ratio', need: 1.35, xp: 450,
    lore: 'Shoulder-to-waist ratio of 1.35 in the Symmetry tab. Not earned with weight — earned with lateral raises, pulldowns, rows and patience.' },
  { id: 'estanc',  t: 3, n: 'No Plateau',        kind: 'prog',  need: 5, xp: 350,
    lore: 'Earn a weight increase on 5 different exercises through double progression. Proof that you understand progressive overload.' },

  /* --- TIER 4 --- */
  { id: 'titan',   t: 4, n: 'Bodyweight Bench',  kind: 'lift', ex: 'bench',    reps: 8,  w: bw => Math.round(bw), xp: 800,
    lore: 'Your own bodyweight on the bench for 8 reps. For most people that is two years of work. For you too.' },
  { id: 'levia',   t: 4, n: 'Triple Bodyweight', kind: 'lift', ex: 'legpress', reps: 8,  w: bw => Math.round(bw * 3), xp: 800,
    lore: 'Leg press 3 × your bodyweight for 8. You can see it coming from a long way off and it still impresses.' },
  { id: 'dragon',  t: 4, n: 'Over Bodyweight Pull', kind: 'lift', ex: 'latpull', reps: 8, w: bw => Math.round(bw * 1.1), xp: 800,
    lore: 'Pulldown more than your bodyweight for 8. By now free pull-ups are a formality.' },
  { id: 'umbral',  t: 4, n: 'The V Is Yours',    kind: 'ratio', need: 1.45, xp: 900,
    lore: 'Ratio 1.45. The point where the V-taper stops being something you want and becomes something you have.' },
  { id: 'tiempo',  t: 4, n: 'One Hundred',       kind: 'ses',   need: 100, xp: 1000,
    lore: 'One hundred closed sessions. Roughly eight months of not missing. Time is the one opponent you cannot dodge, only walk beside.' },
  { id: 'yunque',  t: 4, n: 'Anvil Lord',        kind: 'lift', ex: 'bench',    reps: 5,  w: bw => Math.round(bw * 1.25), xp: 1200,
    lore: 'Bench 1.25 × bodyweight for 5. The final trial of this saga — and it grows again every time you gain bodyweight.' }
];

const ACHIEVEMENTS = [
  { id: 'a1',  n: 'First Iron',       d: 'Closed your first session.',                    f: g => g.sessions >= 1 },
  { id: 'a2',  n: 'Ten Fires',        d: '10 sessions closed.',                           f: g => g.sessions >= 10 },
  { id: 'a3',  n: 'Half a Hundred',   d: '50 sessions closed.',                           f: g => g.sessions >= 50 },
  { id: 'a4',  n: 'Ground Zero',      d: 'Took your first progress photo.',               f: g => g.photos >= 1 },
  { id: 'a5',  n: "Forger's Eye",     d: 'Analysed the symmetry of a photo.',             f: g => g.analyzed >= 1 },
  { id: 'a6',  n: 'Cartographer',     d: 'Logged measurements 3 times.',                  f: g => g.measures >= 3 },
  { id: 'a7',  n: 'Unbroken',         d: '12-session streak without missing.',            f: g => g.streak >= 12 },
  { id: 'a8',  n: 'Weight Earned',    d: 'First weight increase via double progression.', f: g => g.progressions >= 1 },
  { id: 'a9',  n: 'One Hundred K',    d: '100,000 kg lifted in total.',                   f: g => g.volume >= 100000 },
  { id: 'a10', n: 'One Million',      d: '1,000,000 kg lifted in total.',                 f: g => g.volume >= 1000000 },
  { id: 'a11', n: 'Scribe',           d: 'Logged RIR on 200 sets.',                       f: g => g.rirSets >= 200 },
  { id: 'a12', n: 'Full Ritual',      d: 'After-workout list finished on 10 sessions.',   f: g => g.fullChk >= 10 },
  { id: 'a13', n: 'The Silhouette',   d: 'Shoulder-to-waist ratio above 1.40.',           f: g => g.vRatio >= 1.40 },
  { id: 'a14', n: 'Cycle Closed',     d: 'Completed a full 12-week cycle.',               f: g => g.week > 12 },
  { id: 'a15', n: 'Head Up',          d: 'Jawline & neck routine 7 days in a row.',        f: g => g.jawStreak >= 7 },
  { id: 'a16', n: 'Posture Rebuilt',  d: '30 full days of the jawline & neck routine.',    f: g => g.jawFull >= 30 }
];

/* A session counts as finished properly when the after-workout list is ticked.
   Sessions logged before that list existed are still honoured on the old
   pre-workout list, so no XP or Mastery earned earlier disappears. */
function ritualDone(lg) {
  const c = (lg && lg.chk) || {};
  return POST.every(x => c[x[0]]) || CHK_LEGACY.every(x => c[x[0]]);
}

/* ---------------- computation ---------------- */
/* Bodyweight drives every "× your bodyweight" trial, so it must never be a
   silent guess: a logged measurement wins, then the estimate you set in
   Settings, and only then the starting default. */
function bodyW() {
  const m = S.measures.filter(x => x.peso).sort((a, b) => a.date < b.date ? 1 : -1);
  if (m.length) return +m[0].peso;
  /* a neutral starting point, not anyone's real weight — Settings overrides it */
  return +(S.profile && S.profile.weight) || 70;
}
function bodyWSource() {
  if (S.measures.some(x => x.peso)) return 'logged';
  if (S.profile && S.profile.weight) return 'estimate';
  return 'default';
}
/* best weight logged on a lift for at least `reps` reps */
function bestAt(exId, reps) {
  let b = 0;
  Object.keys(S.logs).forEach(k => {
    ((S.logs[k].sets || {})[exId] || []).forEach(s => {
      if (s.done && +s.r >= reps && +s.w > b) b = +s.w;
    });
  });
  return b;
}
function computeGame() {
  S.game = S.game || { seen: [] };
  const keys = Object.keys(S.logs).sort();
  const w = bodyW();
  const g = { bw: w, week: cycleWeek(weekOf(new Date())) };

  /* base counts */
  g.sessions = keys.filter(k => S.logs[k].done).length;
  g.setsDone = 0; g.volume = 0; g.rirSets = 0; g.rirGood = 0; g.fullChk = 0;
  keys.forEach(k => {
    const lg = S.logs[k];
    Object.keys(lg.sets || {}).forEach(ex => (lg.sets[ex] || []).forEach(s => {
      if (!s.done) return;
      g.setsDone++;
      if (s.w && s.r) g.volume += +s.w * +s.r;
      if (s.rir !== '' && s.rir != null) { g.rirSets++; if (+s.rir >= 1 && +s.rir <= 4) g.rirGood++; }
    }));
    if (ritualDone(lg)) g.fullChk++;
  });

  /* adherence and streak (same rule as the Progress tab) */
  const st0 = ensureStart(), today = new Date();
  let sched = 0;
  for (let d = new Date(st0); d <= today; d.setDate(d.getDate() + 1)) if (sessionFor(d)) sched++;
  g.sched = sched;
  g.adherence = sched ? g.sessions / sched * 100 : 0;
  let streak = 0; const d2 = new Date(today);
  for (let i = 0; i < 200; i++) {
    if (sessionFor(d2)) {
      const k = dk(d2);
      if (S.logs[k] && S.logs[k].done) streak++;
      else if (k !== dk(today)) break;
    }
    d2.setDate(d2.getDate() - 1);
  }
  g.streak = streak;

  /* weight increases earned, per exercise */
  g.progressions = 0; g.progExercises = 0;
  Object.keys(EX).forEach(id => {
    let mx = 0, ups = 0;
    keys.forEach(k => {
      (S.logs[k].sets[id] || []).forEach(s => {
        if (s.done && +s.w > mx) { if (mx > 0) ups++; mx = +s.w; }
      });
    });
    g.progressions += ups;
    if (ups > 0) g.progExercises++;
  });

  /* jawline & neck routine.
     It is a five-minute daily habit, not a training session, so it pays a
     small trickle: enough that staying consistent visibly moves the bar,
     never enough to stand in for going to the gym. */
  g.jawTicks = 0; g.jawDays = 0; g.jawFull = 0;
  Object.keys(S.jaw || {}).forEach(k => {
    const day = S.jaw[k] || {};
    const n = JAW.filter(j => day[j.id]).length;
    if (!n) return;
    g.jawTicks += n;
    g.jawDays++;
    if (n === JAW.length) g.jawFull++;
  });
  g.jawStreak = jawStreak();
  g.jawXP = g.jawTicks * 3 + g.jawFull * 10;

  /* physique */
  g.photos = S.photos.length;
  const marked = S.photos.filter(p => p.marks).sort((a, b) => a.id - b.id);
  g.analyzed = marked.length;
  g.measures = S.measures.length;
  g.vRatio = marked.length ? analyze(marked[marked.length - 1]).v : 0;

  /* attributes 0-100 */
  const rel = (ex, reps, target) => { const b = bestAt(ex, reps); return b ? clamp(b / w / target, 0, 1) : 0; };
  g.stats = {
    STR: Math.round((rel('bench', 8, 1.0) + rel('legpress', 10, 3.0) + rel('latpull', 8, 1.1) + rel('ohp', 8, 0.30)) / 4 * 100),
    VIG: Math.round(clamp(Math.log10(Math.max(g.volume, 1) / 1000) / 3, 0, 1) * 100),
    DIS: Math.round(Math.min(100, clamp(g.adherence / 100, 0, 1) * 60 + clamp(g.streak / 15, 0, 1) * 40 + clamp(g.jawStreak / 21, 0, 1) * 8)),
    MAS: Math.round((g.setsDone ? clamp(g.rirGood / g.setsDone, 0, 1) : 0) * 60 + (g.sessions ? clamp(g.fullChk / g.sessions, 0, 1) : 0) * 40),
    FRG: Math.round(clamp(g.analyzed * 12 + g.measures * 8, 0, 55) + clamp((g.vRatio - 1.1) / 0.4, 0, 1) * 45)
  };
  g.power = Math.round((g.stats.STR + g.stats.VIG + g.stats.DIS + g.stats.MAS + g.stats.FRG) / 5);

  /* trials */
  g.monsters = MONSTERS.map(m => {
    let have = 0, need = 0, unit = 'kg';
    if (m.kind === 'lift') { need = m.w(w); have = bestAt(m.ex, m.reps); }
    else if (m.kind === 'ses') { need = m.need; have = g.sessions; unit = 'sessions'; }
    else if (m.kind === 'streak') { need = m.need; have = g.streak; unit = 'in a row'; }
    else if (m.kind === 'ratio') { need = m.need; have = g.vRatio; unit = 'ratio'; }
    else if (m.kind === 'prog') { need = m.need; have = g.progExercises; unit = 'exercises'; }
    return Object.assign({}, m, { have: have, needV: need, unit: unit, dead: have >= need, pct: clamp(have / need * 100, 0, 100) });
  });
  g.slain = g.monsters.filter(m => m.dead);

  /* experience */
  g.xp = g.setsDone * 10 + g.sessions * 100 + g.fullChk * 30 + g.progressions * 50 +
         g.photos * 40 + g.analyzed * 30 + g.measures * 40 + g.jawXP +
         g.slain.reduce((a, m) => a + m.xp, 0);

  /* level */
  const need = i => 250 + (i - 1) * 150;
  let lvl = 1, cum = 0;
  while (cum + need(lvl) <= g.xp && lvl < 99) { cum += need(lvl); lvl++; }
  g.level = lvl; g.xpInto = g.xp - cum; g.xpNeed = need(lvl);
  g.rank = RANKS.filter(r => r.l <= lvl).pop() || RANKS[0];
  g.nextRank = RANKS.find(r => r.l > lvl) || null;

  /* achievements */
  g.achievements = ACHIEVEMENTS.map(a => Object.assign({}, a, { got: !!a.f(g) }));

  /* newly completed trials */
  const fresh = g.slain.filter(m => S.game.seen.indexOf(m.id) < 0);
  if (fresh.length) {
    S.game.seen = S.game.seen.concat(fresh.map(m => m.id));
    save();
    setTimeout(() => toast('Trial complete: ' + fresh[0].n), 400);
  }
  return g;
}

/* current week's quests */
function weekQuests(g) {
  const mon = mondayOf(new Date());
  const wkKeys = [];
  for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(d.getDate() + i); wkKeys.push(dk(d)); }
  const wkLogs = wkKeys.map(k => S.logs[k]).filter(Boolean);
  const closed = wkLogs.filter(l => l.done).length;
  let sets = 0, rir = 0;
  wkLogs.forEach(l => Object.keys(l.sets || {}).forEach(ex => (l.sets[ex] || []).forEach(s => {
    if (s.done) { sets++; if (s.rir !== '' && s.rir != null) rir++; }
  })));
  const chk = wkLogs.filter(ritualDone).length;
  const photoThisWeek = S.photos.some(p => wkKeys.indexOf(p.date) >= 0);
  const jawDays = wkKeys.filter(k => JAW.some(j => ((S.jaw || {})[k] || {})[j.id])).length;
  return [
    { n: 'Close all 3 sessions this week', have: closed, need: 3 },
    { n: 'Log RIR on every set', have: rir, need: Math.max(sets, 1) },
    { n: 'Finish the after-workout list all 3 times', have: chk, need: 3 },
    { n: 'Take the weekly progress photo', have: photoThisWeek ? 1 : 0, need: 1 },
    { n: 'Jawline & neck routine on 5 days', have: jawDays, need: 5 }
  ];
}

/* ---------------- THE ONE THING TO DO NEXT ----------------
   The single most useful action right now, so you never open the app
   and wonder what you are supposed to do. */
function nextStep(g) {
  const todayK = dk(new Date());
  const sid = sidFor(new Date());
  const lg = S.logs[todayK];

  if (sid && (!lg || !lg.done)) {
    const ses = SESSIONS[sid];
    let doneSets = 0;
    if (lg) sesIds(sid).forEach(x => doneSets += (lg.sets[x] || []).filter(s => s.done).length);
    const total = sesTotal(sid);
    return { t: doneSets ? 'Finish today\'s session' : 'Train today',
      d: ses.label + ' — ' + (doneSets ? doneSets + ' of ' + total + ' sets logged' : total + ' working sets') +
         '. Every set you log is +10 XP and +1 Energy.',
      go: 'today', btn: 'Open session' };
  }
  if (!g.photos) return { t: 'Take your first photo',
    d: 'Front view, arms relaxed. This is your ground zero and you cannot go back and get it later. Worth +40 XP.',
    go: 'photos', btn: 'Open Photos' };
  if (!g.analyzed) return { t: 'Analyse your photo',
    d: 'Mark 6 points and the app calculates your shoulder-to-waist ratio. It also unlocks the Mirror Cut attack. Worth +30 XP.',
    go: 'symmetry', btn: 'Open Symmetry' };
  if (!g.measures) return { t: 'Log your measurements',
    d: 'Bodyweight, shoulders, chest, waist and arms. Without these the app cannot tell you whether you are eating enough. Worth +40 XP.',
    go: 'measure', btn: 'Open Measure' };

  const en = energy(g);
  const r = rpg();
  const reg = REGIONS.filter(x => regionOpen(x, g)).pop();
  if (reg && r.bosses.indexOf(reg.boss) < 0 && en >= 3) {
    return { t: 'Challenge the boss of ' + reg.n,
      d: BOSSES[reg.boss].n + ' is holding this region. Beating it drops equipment and opens the next region.',
      go: 'quest', sub: 'map', btn: 'Go to the map' };
  }
  if (en >= 1) return { t: 'You have ' + en + ' Energy to spend',
    d: 'Energy only comes from training, and it is the only way to fight. Spend it on the map.',
    go: 'quest', sub: 'map', btn: 'Go to the map' };

  const nextTrial = g.monsters.filter(m => !m.dead).sort((a, b) => b.pct - a.pct)[0];
  return { t: 'Rest day — recover',
    d: nextTrial ? 'Closest trial: ' + nextTrial.n + ' (' + Math.round(nextTrial.pct) + '%). Sleep 8–10 h and eat well; that is what moves it.'
                 : 'Sleep 8–10 h and eat well. Muscle grows on the days you rest.',
    go: 'quest', sub: 'trials', btn: 'View trials' };
}

/* ---------------- attribute radar ---------------- */
function radarChart(stats) {
  const W = 320, H = 300, cx = 160, cy = 152, R = 96;
  const ks = STATS.map(s => s.k);
  const n = ks.length;
  const ang = i => -Math.PI / 2 + i * 2 * Math.PI / n;
  const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
  let g = '';
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const p = ks.map((_, i) => pt(i, R * f).join(',')).join(' ');
    g += '<polygon points="' + p + '" fill="none" stroke="#232830" stroke-width="1"/>';
  });
  ks.forEach((_, i) => {
    const [x, y] = pt(i, R);
    g += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x + '" y2="' + y + '" stroke="#232830"/>';
  });
  const poly = ks.map((k, i) => pt(i, R * clamp(stats[k], 0, 100) / 100).join(',')).join(' ');
  g += '<polygon class="radar-poly" points="' + poly + '" fill="rgba(200,255,0,.20)" stroke="#C8FF00" stroke-width="2.5" stroke-linejoin="round"/>';
  ks.forEach((k, i) => {
    const [x, y] = pt(i, R * clamp(stats[k], 0, 100) / 100);
    g += '<circle cx="' + x + '" cy="' + y + '" r="3.5" fill="#C8FF00"/>';
    const [lx, ly] = pt(i, R + 24);
    g += '<text x="' + lx + '" y="' + ly + '" fill="#8B93A1" font-size="11" font-weight="800" text-anchor="middle" font-family="monospace">' + k + '</text>' +
      '<text x="' + lx + '" y="' + (ly + 13) + '" fill="#C8FF00" font-size="12" font-weight="700" text-anchor="middle" font-family="monospace">' + stats[k] + '</text>';
  });
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:340px;margin:0 auto">' + g + '</svg>';
}

/* ---------------- compact strip for the TODAY tab ---------------- */
/* One slim line: level, progress to the next one, and energy as its own
   labelled chip instead of a number buried in a run-on mono string. */
function gameStrip() {
  const g = computeGame();
  const pct = Math.round(g.xpInto / g.xpNeed * 100);
  const en = energy(g);
  return '<div class="card flat hstrip">' +
    '<div class="row" style="gap:11px">' +
    '<div class="lvlbadge">' + g.level + '</div>' +
    '<div style="flex:1;min-width:0">' +
      '<div class="spread"><span style="font-weight:800;font-size:14px">' + esc(g.rank.n) + '</span>' +
      tierBadge(strengthRank().tier) + '</div>' +
      '<div class="bar" style="margin-top:8px"><i style="width:' + pct + '%"></i></div>' +
      '<div class="spread" style="margin-top:5px">' +
      '<span class="tiny mono">' + g.xpInto + ' / ' + g.xpNeed + ' XP</span>' +
      '<span class="echip">&#9889; ' + en + ' energy</span></div>' +
    '</div>' +
    '<button class="btn sm gh" id="toadv">Quest</button></div></div>';
}

/* ---------------- HERO sub-view (returns HTML) ---------------- */
function heroHTML(g) {
  const pct = Math.round(g.xpInto / g.xpNeed * 100);
  const cs = heroStats(g);
  let h = rankCard();

  h += '<div class="card acc"><div class="row" style="gap:16px;align-items:center">' +
    '<div class="lvlbadge big">' + g.level + '</div>' +
    '<div style="flex:1;min-width:0"><div class="tiny">LEVEL ' + g.level + '</div>' +
    '<div class="h-lg" style="font-size:clamp(22px,5.5vw,32px)">' + esc(g.rank.n) + '</div></div></div>' +
    '<p class="sub" style="margin-top:12px">' + esc(g.rank.d) + '</p>' +
    '<div class="tiny" style="margin-top:8px">' + (LANG === 'es'
      ? 'Este nivel mide <b>cuánto has entrenado</b>. El rango de arriba mide <b>cuánta fuerza tienes</b>. Son dos cosas distintas y las dos cuentan.'
      : 'This level measures <b>how much you have trained</b>. The rank above measures <b>how strong you are</b>. They are different questions and both matter.') + '</div>' +
    '<div style="margin-top:14px"><div class="spread" style="margin-bottom:6px">' +
    '<span class="tiny">EXPERIENCE</span><span class="mono tiny">' + g.xpInto + ' / ' + g.xpNeed + '</span></div>' +
    '<div class="bar"><i style="width:' + pct + '%"></i></div></div>' +
    (g.nextRank ? '<div class="tiny" style="margin-top:9px">Next rank: <b style="color:var(--acc)">' + esc(g.nextRank.n) + '</b> at level ' + g.nextRank.l + '</div>' : '') +
    '</div>';

  /* combat stats up front — this is what the map actually uses */
  h += '<div class="card"><div class="spread"><div class="sec-t" style="margin:0">Battle stats</div>' +
    '<span class="pill up">Power ' + g.power + '</span></div>' +
    '<div class="grid g4" style="margin-top:4px">' +
    st(cs.hp, 'HP') + st(cs.atk, 'Attack') + st(cs.def, 'Defense') + st(cs.crit + '%', 'Crit') +
    '</div>' +
    '<div class="tiny" style="margin-top:10px">These are what you fight with on the map. They come straight from your training below.</div></div>';

  h += '<div class="card"><div class="sec-t">Attributes</div>' +
    radarChart(g.stats) +
    '<div class="hr"></div>' +
    STATS.map(s => '<div style="margin-bottom:14px"><div class="spread" style="margin-bottom:5px">' +
      '<span style="font-weight:800;font-size:13.5px">' + s.icon + ' ' + s.n +
      ' <span class="tiny" style="font-weight:400">→ ' + STAT_TO_COMBAT[s.k] + '</span></span>' +
      '<span class="mono tiny" style="color:var(--acc)">' + g.stats[s.k] + '</span></div>' +
      '<div class="gauge"><i style="width:' + g.stats[s.k] + '%;background:var(--acc)"></i></div>' +
      '<div class="tiny" style="margin-top:5px">' + s.d + '</div></div>').join('') +
    '<div class="note w">Notice what each attribute rewards: none of them go up by lifting more than you should. <b>Mastery</b> drops if you stop logging RIR or train to failure every set; <b>Discipline</b> collapses fastest if you skip sessions. Winning here is the same thing as training well.</div></div>';

  const got = g.achievements.filter(a => a.got);
  h += '<div class="card"><div class="spread"><div class="sec-t" style="margin:0">Achievements</div>' +
    '<span class="pill">' + got.length + ' / ' + g.achievements.length + '</span></div>' +
    '<div class="grid g2" style="margin-top:12px">' +
    g.achievements.map(a => '<div class="stat" style="' + (a.got ? 'border-color:rgba(200,255,0,.35)' : 'opacity:.45') + '">' +
      '<div style="font-weight:800;font-size:13.5px;color:' + (a.got ? 'var(--acc)' : 'var(--dim)') + '">' +
      (a.got ? '★ ' : '☆ ') + esc(a.n) + '</div>' +
      '<div class="tiny" style="margin-top:4px">' + esc(a.d) + '</div></div>').join('') +
    '</div></div>';

  h += '<div class="card flat"><div class="sec-t">Where XP comes from</div>' +
    '<div class="tw"><table><thead><tr><th>Action</th><th>XP</th></tr></thead><tbody>' +
    '<tr><td>Log a completed set</td><td class="m">+10</td></tr>' +
    '<tr><td>Close a session</td><td class="m">+100</td></tr>' +
    '<tr><td>Finish the after-workout list</td><td class="m">+30</td></tr>' +
    '<tr><td>Earn a weight increase</td><td class="m">+50</td></tr>' +
    '<tr><td>Progress photo</td><td class="m">+40</td></tr>' +
    '<tr><td>Analyse a photo\'s symmetry</td><td class="m">+30</td></tr>' +
    '<tr><td>Log measurements</td><td class="m">+40</td></tr>' +
    '<tr><td>Tick one jawline &amp; neck exercise</td><td class="m">+3</td></tr>' +
    '<tr><td>All four of them in the same day</td><td class="m">+10 bonus</td></tr>' +
    '<tr><td>Complete a trial</td><td class="m">+80 to +1200</td></tr>' +
    '</tbody></table></div>' +
    '<div class="note" style="margin-top:12px">Winning fights gives you shards and loot, never XP. Your level is a record of training, so it stays honest.</div></div>';

  return h;
}

/* ---------------- TRIALS sub-view (returns HTML) ---------------- */
function trialsHTML(g) {
  let h = '<div class="card"><div class="spread"><div class="sec-t" style="margin:0">Trials</div>' +
    '<span class="pill ' + (g.slain.length ? 'good' : '') + '">' + g.slain.length + ' / ' + g.monsters.length + '</span></div>' +
    '<p class="sub" style="margin-top:8px">Trials are <b>gym milestones</b>, not creatures. You do not fight them — you complete them by logging the set that clears the bar. Each one pays XP.</p></div>';

  const q = weekQuests(g);
  h += '<div class="card"><div class="sec-t">This week</div>' +
    q.map(x => {
      const done = x.have >= x.need;
      const p = clamp(x.have / x.need * 100, 0, 100);
      return '<div style="margin-bottom:13px"><div class="spread" style="margin-bottom:5px">' +
        '<span style="font-size:13.5px;font-weight:700;color:' + (done ? 'var(--good)' : 'var(--tx)') + '">' +
        (done ? '✓ ' : '') + esc(x.n) + '</span>' +
        '<span class="mono tiny">' + x.have + '/' + x.need + '</span></div>' +
        '<div class="gauge"><i style="width:' + p + '%;background:' + (done ? 'var(--good)' : 'var(--acc)') + '"></i></div></div>';
    }).join('') +
    '<div class="tiny">Resets every Monday.</div></div>';

  const TIERS = [[1, 'Tier 1', 'First weeks'], [2, 'Tier 2', 'Months 2–4'],
                 [3, 'Tier 3', 'Months 5–12'], [4, 'Tier 4', 'Year 1 and beyond']];
  TIERS.forEach(t => {
    const ms = g.monsters.filter(m => m.t === t[0]);
    const doneN = ms.filter(m => m.dead).length;
    h += '<div class="card"><div class="spread" style="margin-bottom:4px">' +
      '<div class="sec-t" style="margin:0;color:var(--acc)">' + t[1] + ' <span style="color:var(--dim)">· ' + t[2] + '</span></div>' +
      '<span class="pill ' + (doneN === ms.length ? 'good' : '') + '">' + doneN + '/' + ms.length + '</span></div>';
    ms.forEach(m => {
      const c = m.dead ? 'var(--good)' : (m.pct > 60 ? 'var(--warn)' : 'var(--dim)');
      h += '<div class="trial' + (m.dead ? ' done' : '') + '">' +
        '<div class="spread" style="align-items:flex-start;gap:12px">' +
        '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14.5px;color:' + (m.dead ? 'var(--good)' : 'var(--tx)') + '">' +
        (m.dead ? '✓ ' : '') + esc(m.n) + '</div>' +
        '<div class="tiny mono" style="margin-top:3px">' + trialProgress(m) +
        (m.kind === 'lift' ? ' · ' + esc(EX[m.ex].n) : '') + '</div></div>' +
        '<span class="pill ' + (m.dead ? 'good' : '') + '">' + (m.dead ? 'done' : '+' + m.xp + ' XP') + '</span></div>' +
        '<div class="gauge" style="margin:9px 0 8px"><i style="width:' + m.pct + '%;background:' + c + '"></i></div>' +
        '<div class="tiny">' + esc(m.lore) + '</div></div>';
    });
    h += '</div>';
  });
  return h;
}
function trialProgress(m) {
  if (m.kind === 'ratio') return (r1(m.have * 100) / 100) + ' / ' + m.needV + ' ratio';
  if (m.kind === 'lift') return (m.have || 0) + ' / ' + m.needV + ' kg × ' + m.reps + ' reps';
  return (m.have || 0) + ' / ' + m.needV + ' ' + m.unit;
}
