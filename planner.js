/* MONOLITH — the free planner
   -----------------------------------------------------------------------
   Answers training questions with no account, no key, no internet and no
   cost, by reading the same log the rest of the app writes.

   It is NOT a language model. It matches training words — muscles, time,
   equipment, goals — and then does real work with the exercise catalogue and
   your own numbers. It says so when it does not understand, instead of
   inventing something.
   ----------------------------------------------------------------------- */

/* what a word means, in both languages */
const P_MUS = [
  [['glute', 'gluteo', 'glúteo', 'gluteos', 'glúteos', 'butt', 'culo'], ['glute']],
  [['quad', 'cuadricep', 'cuádricep'], ['quad']],
  [['hamstring', 'isquio', 'femoral'], ['ham']],
  [['calf', 'calves', 'gemelo', 'pantorrilla'], ['calf']],
  [['leg', 'pierna', 'piernas', 'tren inferior', 'lower'], ['quad', 'glute', 'ham', 'calf']],
  [['chest', 'pecho', 'pectoral'], ['chest']],
  [['lat', 'dorsal'], ['lat']],
  [['back', 'espalda'], ['lat', 'rhomboid']],
  [['shoulder', 'hombro', 'delt', 'deltoide', 'deltoides'], ['delt_s', 'delt_f', 'delt_r']],
  [['bicep', 'bícep', 'biceps', 'bíceps'], ['biceps']],
  [['tricep', 'trícep', 'triceps', 'tríceps'], ['triceps']],
  [['arm', 'brazo'], ['biceps', 'triceps']],
  [['abs', 'core', 'abdomen', 'abdominal', 'abdominales'], ['abs', 'oblique']],
  [['push', 'empuje', 'empujar'], ['chest', 'delt_f', 'triceps']],
  [['pull', 'tiron', 'tirón', 'jalon', 'jalón', 'tirar'], ['lat', 'rhomboid', 'biceps']],
  [['upper', 'superior', 'torso'], ['chest', 'lat', 'delt_s', 'biceps', 'triceps']],
  [['full body', 'cuerpo completo', 'todo el cuerpo', 'fullbody'], ['chest', 'lat', 'quad', 'delt_s', 'glute']],
  [['v taper', 'v-taper', 'espalda en v', 'forma de v'], ['lat', 'delt_s']]
];
const P_LONG = ['year', 'año', 'ano ', 'month', 'mes', 'meses', 'long term', 'largo plazo', 'roadmap', 'hoja de ruta', 'plan de un', '12 week', '12 semana', 'semanas'];
const P_FOOD = ['eat', 'diet', 'food', 'protein', 'comer', 'comida', 'dieta', 'proteina', 'proteína', 'calorias', 'calorías', 'nutricion', 'nutrición', 'bulk', 'volumen', 'definicion', 'definición'];
const P_STUCK = ['stuck', 'plateau', 'stopped', 'not going up', 'no sube', 'estancado', 'atascado', 'no progreso', 'no avanzo'];
const P_RANK = ['rank', 'rango', 'how strong', 'que tan fuerte', 'qué tan fuerte', 'fuerte soy'];
const P_DB = ['dumbbell only', 'only dumbbell', 'solo mancuerna', 'mancuernas solo', 'just dumbbell'];
const P_HOME = ['at home', 'en casa', 'no gym', 'sin gimnasio', 'home workout'];

function pNorm(s) { return (' ' + String(s).toLowerCase() + ' ').replace(/[¿?¡!.,;:]/g, ' '); }
/* whole-word matching, not substring: 'ab' must not fire inside 'about'.
   pNorm() already pads the text and strips punctuation, so plain spaces work. */
function pHas(t, list) { return list.some(w => t.indexOf(' ' + w + ' ') >= 0 || t.indexOf(' ' + w + 's ') >= 0); }

function pMuscles(t) {
  const out = [];
  P_MUS.forEach(([words, mus]) => { if (pHas(t, words)) mus.forEach(m => { if (out.indexOf(m) < 0) out.push(m); }); });
  return out;
}
function pMinutes(t) {
  const m = t.match(/(\d{2,3})\s*(min|minuto|minute)/) || t.match(/(\d)\s*(h|hora|hour)/);
  if (!m) return null;
  return /h|hora|hour/.test(m[2]) ? +m[1] * 60 : +m[1];
}

/* ---------------- building a session ---------------- */
function pBuild(mus, minutes, opts) {
  opts = opts || {};
  const n = minutes ? clamp(Math.round((minutes - 10) / 7), 3, 8) : 6;
  const scored = Object.keys(EX).map(id => {
    const mm = EX_MUS[id] || { p: [], s: [] };
    let sc = 0;
    mus.forEach(m => { if (mm.p.indexOf(m) >= 0) sc += 3; else if (mm.s.indexOf(m) >= 0) sc += 1; });
    if (!sc) return null;
    if (opts.dbOnly && !/dumbbell|mancuerna|db/i.test(EX[id].n) && EX[id].kind !== 'iso') sc -= 2;
    if (opts.home && /machine|cable|máquina|polea|press|prensa/i.test(EX[id].n)) sc -= 2;
    return { id: id, sc: sc, comp: /comp/.test(EX[id].kind) };
  }).filter(x => x && x.sc > 0);

  /* heaviest compounds first, then the strongest matches */
  scored.sort((a, b) => (b.comp - a.comp) || (b.sc - a.sc));
  const pick = [];
  scored.forEach(x => {
    if (pick.length >= n) return;
    /* avoid two of the same prime mover unless there is nothing else */
    const prim = (EX_MUS[x.id] || { p: [] }).p.join(',');
    if (pick.filter(y => (EX_MUS[y.id] || { p: [] }).p.join(',') === prim).length >= 2) return;
    pick.push(x);
  });
  return pick.map(x => ({ id: x.id, sets: EX[x.id].sets }));
}
function pSessionText(list, mus, minutes) {
  const es = LANG === 'es';
  const total = list.reduce((a, x) => a + x.sets, 0);
  const mins = Math.round(list.reduce((a, x) => a + x.sets * (EX[x.id].rest + 40), 0) / 60) + 10;
  const blk = blockOf(weekOf(new Date()));
  let h = (es ? 'Sesión de ' : 'A session for ') + '<b>' + mus.map(muscName).join(', ') + '</b>. ' +
    list.length + (es ? ' ejercicios, ' : ' exercises, ') + total + (es ? ' series, unos ' : ' sets, about ') + mins + (es ? ' min con calentamiento.' : ' min including the warm-up.') +
    (minutes && mins > minutes + 8 ? (es ? ' Pedías ' + minutes + ' min, así que quita el último ejercicio si vas justo.' : ' You asked for ' + minutes + ' min, so drop the last exercise if you are tight.') : '') + '\n\n';
  list.forEach((x, i) => {
    const e = EX[x.id];
    h += '- **' + (i + 1) + '. ' + e.n + '** — ' + x.sets + ' × ' + e.lo + '-' + e.hi + ', RIR ' + (x.id === 'rdl' ? '3' : blk.rir) + ', ' + fmtRest(e.rest) + (es ? ' de descanso' : ' rest') + '\n';
  });
  h += '\n' + (es
    ? 'Los compuestos van primero a propósito: son los que necesitan que estés fresco.'
    : 'The compounds come first on purpose: they are the ones that need you fresh.');
  return h;
}

/* ---------------- the long-term roadmap ---------------- */
function pRoadmap(t) {
  const es = LANG === 'es';
  const r = strengthRank();
  const g = computeGame();
  const bw = bodyW();
  const named = /david laid|zyzz|jeff seid|chris bumstead|cbum/.test(t);
  let h = '';

  if (named) {
    h += (es
      ? '**Primero lo honesto.** Los físicos que ves online son 5–10 años de entrenamiento, genética concreta y, en bastantes casos, cosas que no se cuentan. David Laid empezó a los 14 y publicó su transformación a los 18: eso son cuatro años seguidos sin fallar, siendo un caso genético favorable y midiendo 188 cm. Tú llevas semanas, no años.\n\nLo que **sí** está en tu mano es la forma: hombros anchos, cintura estrecha, espalda en V. Eso se construye, y en un año se nota mucho.\n\n'
      : '**The honest part first.** The physiques you see online are 5–10 years of training, specific genetics and, often, things nobody mentions. David Laid started at 14 and posted his transformation at 18 — four unbroken years, favourable genetics, and 188 cm of height. You are weeks in, not years.\n\nWhat **is** in your hands is the shape: wide shoulders, narrow waist, a back that flares. That gets built, and a year of it shows.\n\n');
  }

  h += (es ? '**Tu punto de partida hoy**\n' : '**Where you are starting from**\n');
  h += '- ' + (es ? 'Rango de fuerza: ' : 'Strength rank: ') + (r.tier < 0 ? (es ? 'sin rango todavía' : 'unranked yet') : tierName(r.tier)) + '\n';
  h += '- ' + (es ? 'Sesiones cerradas: ' : 'Sessions closed: ') + g.sessions + (es ? ', adherencia ' : ', adherence ') + Math.round(g.adherence) + '%\n';
  h += '- ' + (es ? 'Peso: ' : 'Bodyweight: ') + r1(bw) + ' kg\n\n';

  const phases = es ? [
    ['Meses 1–3 · Técnica y hábito', 'Tres sesiones a la semana sin fallar. RIR 3: te sobran 3 repeticiones siempre. El objetivo no es levantar mucho, es que la técnica se vuelva automática y que ir al gimnasio deje de ser una decisión. Sube 2,5 kg en cuanto llegues arriba del rango en todas las series.'],
    ['Meses 4–6 · Carga', 'RIR 2. Aquí es donde los números empiezan a moverse rápido porque eres principiante. Prioridad absoluta: elevaciones laterales y todo lo de espalda. Son los dos que construyen la V. Come suficiente o esto no pasa.'],
    ['Meses 7–9 · Volumen dirigido', 'Añade una serie a hombros y espalda, quita una a lo que menos te aporte. Si consigues un cuarto día, que sea el segundo día de pierna. Empieza a comparar fotos de verdad: cada 4 semanas, mismo sitio, misma luz.'],
    ['Meses 10–12 · Consolidar', 'RIR 1–2 en los compuestos, nunca en peso muerto rumano. A estas alturas deberías estar en Oro o cerca en varios ejercicios. La diferencia en las fotos de aquí al mes 1 va a ser la parte que te sorprenda.']
  ] : [
    ['Months 1–3 · Technique and habit', 'Three sessions a week without missing. RIR 3: always three reps left. The goal is not to lift a lot, it is to make the technique automatic and make going to the gym stop being a decision. Add 2.5 kg the moment you hit the top of the range on every set.'],
    ['Months 4–6 · Load', 'RIR 2. This is where the numbers move fast, because you are a beginner. Absolute priority: lateral raises and everything for the back. Those two build the V. Eat enough or none of this happens.'],
    ['Months 7–9 · Targeted volume', 'Add a set to shoulders and back, drop one from whatever gives you least. If you get a fourth day, make it a second leg day. Start comparing photos properly: every 4 weeks, same spot, same light.'],
    ['Months 10–12 · Consolidate', 'RIR 1–2 on the compounds, never on the Romanian deadlift. By now you should be at or near Gold on several lifts. The difference between these photos and month one is the part that surprises people.']
  ];
  h += (es ? '**El año, por fases**\n\n' : '**The year, in phases**\n\n');
  phases.forEach(p => { h += '### ' + p[0] + '\n' + p[1] + '\n\n'; });

  h += (es
    ? '**Lo que decide el resultado**, en orden: no faltar > comer suficiente > dormir 8–10 h > el programa. El programa es el último. Ya lo tienes, y es correcto.'
    : '**What decides the result**, in order: not missing > eating enough > sleeping 8–10 h > the programme. The programme is last. You already have it, and it is fine.');
  return h;
}

/* ---------------- other answers, from the real log ---------------- */
function pStuck() {
  const es = LANG === 'es';
  const rows = Object.keys(EX).map(id => {
    const keys = Object.keys(S.logs).filter(k => (S.logs[k].sets || {})[id]).sort();
    if (keys.length < 2) return null;
    const first = (S.logs[keys[0]].sets[id] || []).filter(s => s.done && s.w)[0];
    const last = (S.logs[keys[keys.length - 1]].sets[id] || []).filter(s => s.done && s.w)[0];
    if (!first || !last) return null;
    return { id: id, n: EX[id].n, from: +first.w, to: +last.w, d: +last.w - +first.w, sessions: keys.length };
  }).filter(Boolean);
  if (!rows.length) return es
    ? 'Todavía no hay suficientes series registradas para ver si algo está estancado. Registra dos sesiones del mismo ejercicio y te lo digo con tus números.'
    : 'There are not enough logged sets yet to tell whether anything has stalled. Log the same exercise twice and I can answer with your own numbers.';

  const flat = rows.filter(r => r.d <= 0 && r.sessions >= 3).sort((a, b) => b.sessions - a.sessions);
  const moving = rows.filter(r => r.d > 0).sort((a, b) => b.d - a.d);
  let h = '';
  if (flat.length) {
    h += (es ? '**Estancados** (mismo peso o menos desde que empezaste):\n' : '**Stalled** (same weight or less since you started):\n');
    flat.slice(0, 4).forEach(r => h += '- ' + r.n + ': ' + r.from + ' → ' + r.to + ' kg ' + (es ? 'en ' : 'over ') + r.sessions + (es ? ' sesiones' : ' sessions') + '\n');
    h += '\n';
  }
  if (moving.length) {
    h += (es ? '**Subiendo**: ' : '**Moving**: ') + moving.slice(0, 4).map(r => r.n + ' +' + r1(r.d) + ' kg').join(' · ') + '\n\n';
  }
  h += (es
    ? '**La regla, por si se te escapó:** primero subes repeticiones hasta el tope del rango en TODAS las series, y solo entonces subes el peso (2,5 kg en barras y máquinas, 1–2 kg en mancuernas). Si llevas tres sesiones en el tope del rango y no has subido el peso, no estás estancado: estás esperando. Sube.\n\nY si sí has subido y no se mueve: casi siempre es comida o sueño, no el programa.'
    : '**The rule, in case it slipped:** you add reps until every set is at the top of the range, and only then add weight (2.5 kg on bars and machines, 1–2 kg on dumbbells). If you have been at the top of the range for three sessions and have not added weight, you are not stalled — you are waiting. Go up.\n\nAnd if you have gone up and it still will not move, it is almost always food or sleep, not the programme.');
  return h;
}
function pFood() {
  const es = LANG === 'es';
  const bw = bodyW();
  const prot = Math.round(bw * 1.8);
  const kcal = Math.round(bw * 44);
  return (es
    ? '**Con ' + r1(bw) + ' kg, a tu edad y entrenando 3 días:**\n\n' +
      '- **Proteína: ' + prot + ' g al día.** Es el único número que merece la pena contar. Repártelo en 3–4 comidas.\n' +
      '- **Calorías: alrededor de ' + kcal + ' kcal**, ajustando por la báscula, no por la calculadora.\n' +
      '- **La señal real:** +0,2 a +0,4 kg por semana. Si en 3 semanas no se mueve, añade una comida. Si sube más de 0,5 kg/semana de forma sostenida, buena parte es grasa.\n\n' +
      'Fuentes baratas de proteína: huevos, leche, yogur, atún en lata, pollo, lentejas. No necesitas suplementos; la proteína en polvo es comida cara y cómoda, nada más.\n\n' +
      'A los 16 comer poco es el error que más frena. El músculo se construye con el excedente, no con las series.'
    : '**At ' + r1(bw) + ' kg, at your age, training 3 days:**\n\n' +
      '- **Protein: ' + prot + ' g a day.** It is the only number worth counting. Spread it over 3–4 meals.\n' +
      '- **Calories: around ' + kcal + ' kcal**, adjusted by the scale, not by the calculator.\n' +
      '- **The real signal:** +0.2 to +0.4 kg per week. If it has not moved in 3 weeks, add a meal. If it climbs past 0.5 kg/week consistently, a good part of that is fat.\n\n' +
      'Cheap protein: eggs, milk, yoghurt, tinned tuna, chicken, lentils. You do not need supplements; protein powder is convenient expensive food, nothing more.\n\n' +
      'At 16, under-eating is the thing that holds people back most. Muscle is built out of the surplus, not out of the sets.');
}
function pRankAnswer() {
  const es = LANG === 'es';
  const r = strengthRank();
  if (r.tier < 0) return es ? 'Todavía no hay pesos registrados suficientes para darte un rango. Registra peso y repeticiones en cualquier ejercicio.' : 'Not enough logged weight yet to rank you. Log weight and reps on any lift.';
  let h = (es ? 'Tu rango general es **' : 'Your overall rank is **') + tierName(r.tier) + '**. ' + tierDesc(r.tier) + '\n\n';
  r.done.sort((a, b) => b.tier - a.tier).slice(0, 6).forEach(l => {
    h += '- ' + l.n + ': **' + tierName(l.tier) + '** — ' + r1(l.best.w) + ' kg × ' + l.best.r +
      (l.nextTier != null ? (es ? ' · para ' : ' · for ') + tierName(l.nextTier) + ': ' + r1(l.needW) + ' kg × ' + l.reps : '') + '\n';
  });
  return h + '\n' + (es ? 'El detalle completo está en la pestaña Aventura.' : 'The full breakdown is in the Quest tab.');
}

/* ---------------- the entry point ---------------- */
function plannerAnswer(input) {
  const es = LANG === 'es';
  const t = pNorm(input);
  const mus = pMuscles(t);
  const minutes = pMinutes(t);

  if (pHas(t, P_LONG) || /david laid|zyzz|cbum|parecerme|look like/.test(t)) return { text: pRoadmap(t) };
  if (pHas(t, P_STUCK)) return { text: pStuck() };
  if (pHas(t, P_FOOD)) return { text: pFood() };
  if (pHas(t, P_RANK)) return { text: pRankAnswer() };

  if (mus.length) {
    const list = pBuild(mus, minutes, { dbOnly: pHas(t, P_DB), home: pHas(t, P_HOME) });
    if (!list.length) return { text: es ? 'No tengo ejercicios en el catálogo para eso.' : 'I have no exercises in the catalogue for that.' };
    return {
      text: pSessionText(list, mus, minutes),
      plan: { label: mus.map(muscName).slice(0, 2).join(' + '), list: list }
    };
  }

  return { text: (es
    ? 'No he entendido eso. **No soy un chat**: funciono con palabras de entrenamiento, así que no me preguntes cualquier cosa. Lo que sí sé hacer:\n\n' +
      '- **Una sesión de lo que quieras**: "plan de glúteo", "pecho en 30 min", "espalda y bíceps", "día de empuje"\n' +
      '- **Un plan largo**: "plan de un año", "plan de 6 meses"\n' +
      '- **Por qué no subes**: "estoy estancado", "no sube mi press"\n' +
      '- **Comida**: "cuánta proteína", "cómo como para ganar músculo"\n' +
      '- **Tu fuerza**: "qué rango tengo"\n\n' +
      'Si quieres un chat de verdad que entienda cualquier frase, está la opción de Claude en Ajustes — pero esa cuesta dinero.'
    : 'I did not understand that. **I am not a chatbot**: I work off training words, so do not ask me anything at all. What I can do:\n\n' +
      '- **A session for anything**: "glute plan", "chest in 30 min", "back and biceps", "push day"\n' +
      '- **A long plan**: "year plan", "6 month plan"\n' +
      '- **Why you are stuck**: "I am stalled", "my bench stopped going up"\n' +
      '- **Food**: "how much protein", "how do I eat to gain muscle"\n' +
      '- **Your strength**: "what rank am I"\n\n' +
      'If you want a real chat that understands any sentence, there is the Claude option in Settings — but that one costs money.') };
}
