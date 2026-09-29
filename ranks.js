/* MONOLITH — strength ranks
   -----------------------------------------------------------------------
   The XP level says how much you have trained. This says how STRONG you are,
   which is a different question and the one people actually mean.

   It reads the weight and reps you logged, converts them to an estimated
   one-rep max, divides by your bodyweight, and compares that against a
   standard for each lift. Nothing here can be farmed: it only moves when
   the numbers in your log move.
   ----------------------------------------------------------------------- */

const TIERS = [
  { k: 'bronze',   en: 'Bronze',       es: 'Bronce',       c: '#C87B3C', d_en: 'You have started. Most people never get here.',            d_es: 'Has empezado. La mayoría de la gente nunca llega aquí.' },
  { k: 'silver',   en: 'Silver',       es: 'Plata',        c: '#B8C0CC', d_en: 'A few months of honest work. The weights are real now.',     d_es: 'Unos meses de trabajo honesto. Los pesos ya son de verdad.' },
  { k: 'gold',     en: 'Gold',         es: 'Oro',          c: '#F3C13A', d_en: 'Strong for your age and bodyweight. People notice.',         d_es: 'Fuerte para tu edad y tu peso. La gente lo nota.' },
  { k: 'diamond',  en: 'Diamond',      es: 'Diamante',     c: '#6FE3FF', d_en: 'Genuinely strong. A year or two of not missing.',            d_es: 'Fuerte de verdad. Uno o dos años sin fallar.' },
  { k: 'emerald',  en: 'Emerald',      es: 'Esmeralda',    c: '#3BE08A', d_en: 'Strong in any gym you walk into.',                          d_es: 'Fuerte en cualquier gimnasio al que entres.' },
  { k: 'titanium', en: 'Titanium',     es: 'Titanio',      c: '#D8DEE9', d_en: 'Very few people who lift ever reach this.',                  d_es: 'Muy poca gente que entrena llega hasta aquí.' },
  { k: 'olympic',  en: 'Olympic God',  es: 'Dios Olímpico', c: '#C8FF00', d_en: 'Competitive-level strength. Years of it.',                  d_es: 'Nivel de competición. Años de trabajo.' }
];
function tierName(i) { const t = TIERS[i]; return t ? (LANG === 'es' ? t.es : t.en) : '—'; }
function tierDesc(i) { const t = TIERS[i]; return t ? (LANG === 'es' ? t.d_es : t.d_en) : ''; }
function tierColor(i) { return TIERS[i] ? TIERS[i].c : '#5C6472'; }

/* Thresholds are estimated 1RM as a multiple of bodyweight, one per tier.
   `per` marks lifts loaded per hand, where the numbers are naturally lower.
   Machine lifts are approximate by nature — a pulldown stack is not a barbell —
   so these are calibrated to be reachable, not to be a competition standard. */
const STD = {
  bench:     { w: 1.0, t: [0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00] },
  incbar:    { w: 0.9, t: [0.40, 0.60, 0.80, 1.00, 1.20, 1.40, 1.60] },
  legpress:  { w: 1.0, t: [1.50, 2.00, 2.75, 3.50, 4.25, 5.00, 6.00] },
  latpull:   { w: 0.9, t: [0.60, 0.80, 1.00, 1.20, 1.40, 1.60, 1.80] },
  latpull2:  { w: 0.6, t: [0.60, 0.80, 1.00, 1.20, 1.40, 1.60, 1.80] },
  seatrow:   { w: 0.7, t: [0.50, 0.70, 0.90, 1.10, 1.30, 1.50, 1.70] },
  machrow:   { w: 0.6, t: [0.50, 0.70, 0.90, 1.10, 1.30, 1.50, 1.70] },
  ohp:       { w: 0.8, per: true, t: [0.15, 0.22, 0.30, 0.38, 0.46, 0.55, 0.65] },
  rdl:       { w: 0.8, per: true, t: [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80] },
  incdb:     { w: 0.6, per: true, t: [0.15, 0.22, 0.30, 0.38, 0.46, 0.55, 0.65] },
  preacher:  { w: 0.5, t: [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80] },
  inchammer: { w: 0.4, per: true, t: [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40] },
  latraise:  { w: 0.5, per: true, t: [0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.25] },
  legcurl:   { w: 0.5, t: [0.30, 0.45, 0.60, 0.75, 0.90, 1.05, 1.20] },
  legext:    { w: 0.5, t: [0.35, 0.50, 0.70, 0.90, 1.10, 1.30, 1.50] }
};

/* Epley, clamped: past about 12 reps the formula stops predicting a true 1RM. */
function e1rm(w, r) {
  const reps = Math.min(Math.max(+r || 1, 1), 12);
  return (+w || 0) * (1 + reps / 30);
}
/* the best estimated 1RM ever logged on a lift */
function bestE1RM(exId) {
  let best = 0, from = null;
  Object.keys(S.logs).forEach(k => {
    ((S.logs[k].sets || {})[exId] || []).forEach(s => {
      if (!s.done || !s.w || !s.r) return;
      const e = e1rm(s.w, s.r);
      if (e > best) { best = e; from = { w: +s.w, r: +s.r, date: k }; }
    });
  });
  return { e: best, from: from };
}

/* one lift's rank */
function liftRank(exId) {
  const std = STD[exId];
  if (!std || !EX[exId]) return null;
  const bw = bodyW();
  const b = bestE1RM(exId);
  if (!b.e) return { id: exId, n: EX[exId].n, has: false, tier: -1, std: std };
  const ratio = b.e / bw;
  let tier = -1;
  for (let i = 0; i < std.t.length; i++) if (ratio >= std.t[i]) tier = i;
  const nextIdx = tier + 1;
  const next = nextIdx < std.t.length ? std.t[nextIdx] : null;
  /* what you would have to lift for the reps you actually use to get there */
  const reps = Math.round((EX[exId].lo + EX[exId].hi) / 2);
  const needE = next != null ? next * bw : null;
  const needW = needE != null ? needE / (1 + Math.min(reps, 12) / 30) : null;
  const nowW = b.e / (1 + Math.min(reps, 12) / 30);
  const floor = tier >= 0 ? std.t[tier] : 0;
  return {
    id: exId, n: EX[exId].n, has: true, tier: tier, std: std,
    e1rm: b.e, ratio: ratio, best: b.from, reps: reps,
    nextTier: nextIdx < std.t.length ? nextIdx : null,
    needW: needW, nowW: nowW,
    pct: next != null ? clamp((ratio - floor) / (next - floor) * 100, 0, 100) : 100
  };
}

/* the overall rank: a weighted average of the lifts you have actually trained,
   so one strong lift cannot carry you and one weak lift cannot sink you */
function strengthRank() {
  const lifts = Object.keys(STD).map(liftRank).filter(Boolean);
  const done = lifts.filter(l => l.has);
  if (!done.length) return { tier: -1, lifts: lifts, done: done, score: 0, pct: 0 };
  let num = 0, den = 0;
  done.forEach(l => {
    /* position on the ladder as a continuous number, not just the tier index */
    const t = l.std.t;
    let pos = 0;
    if (l.ratio >= t[t.length - 1]) pos = t.length - 1;
    else for (let i = 0; i < t.length; i++) {
      if (l.ratio < t[i]) { pos = i - 1 + (i === 0 ? l.ratio / t[0] : (l.ratio - t[i - 1]) / (t[i] - t[i - 1])); break; }
    }
    num += Math.max(pos, -0.99) * l.std.w;
    den += l.std.w;
  });
  const score = den ? num / den : 0;
  const tier = Math.max(-1, Math.min(TIERS.length - 1, Math.floor(score)));
  return {
    tier: tier, score: score, lifts: lifts, done: done,
    pct: clamp((score - Math.floor(score)) * 100, 0, 100),
    next: tier + 1 < TIERS.length ? tier + 1 : null
  };
}

/* ---------------- display ---------------- */
function tierBadge(i, size) {
  const c = tierColor(i);
  return '<span class="tier' + (size === 'big' ? ' big' : '') + '" style="color:' + c +
    ';border-color:' + c + '66;background:' + c + '1a">' + esc(i < 0 ? (LANG === 'es' ? 'Sin rango' : 'Unranked') : tierName(i)) + '</span>';
}
function rankCard() {
  const es = LANG === 'es';
  const r = strengthRank();
  let h = '<div class="card acc"><div class="spread" style="align-items:flex-start">' +
    '<div><div class="tiny">' + (es ? 'TU RANGO DE FUERZA' : 'YOUR STRENGTH RANK') + '</div>' +
    '<div style="margin:8px 0 6px">' + tierBadge(r.tier, 'big') + '</div>' +
    '<div class="tiny">' + esc(r.tier < 0 ? (es ? 'Registra peso y repeticiones en cualquier ejercicio y aparece tu rango.' : 'Log weight and reps on any lift and your rank appears.') : tierDesc(r.tier)) + '</div></div>' +
    '</div>';
  if (r.done.length) {
    h += '<div style="margin-top:14px"><div class="spread" style="margin-bottom:6px">' +
      '<span class="tiny">' + (r.next != null ? (es ? 'HACIA ' : 'TOWARDS ') + tierName(r.next).toUpperCase() : (es ? 'RANGO MÁXIMO' : 'TOP RANK')) + '</span>' +
      '<span class="mono tiny">' + Math.round(r.pct) + '%</span></div>' +
      '<div class="bar"><i style="width:' + Math.round(r.pct) + '%;background:' + tierColor(r.next != null ? r.next : r.tier) + '"></i></div></div>';
  }
  h += '<div class="tiny" style="margin-top:12px">' +
    (es ? 'Se calcula con el peso y las repeticiones que registras, convertidos a un máximo estimado y divididos por tu peso corporal (' + r1(bodyW()) + ' kg). Subir de rango es levantar más, no entrenar más veces.'
        : 'Worked out from the weight and reps you log, converted to an estimated max and divided by your bodyweight (' + r1(bodyW()) + ' kg). You rank up by lifting more, not by training more often.') +
    '</div></div>';

  /* the ladder */
  h += '<div class="card"><div class="sec-t">' + (es ? 'Los siete rangos' : 'The seven ranks') + '</div>' +
    '<div class="ladder">' + TIERS.map((t, i) =>
      '<div class="rung' + (i === r.tier ? ' on' : '') + '">' + tierBadge(i) +
      '<span class="tiny">' + esc(tierDesc(i)) + '</span></div>').join('') + '</div></div>';

  /* per-lift breakdown */
  const done = r.lifts.filter(l => l.has).sort((a, b) => b.tier - a.tier);
  const todo = r.lifts.filter(l => !l.has);
  h += '<div class="card"><div class="sec-t">' + (es ? 'Rango por ejercicio' : 'Rank by lift') + '</div>';
  if (!done.length) h += '<p class="sub">' + (es ? 'Todavía no hay series registradas con peso y repeticiones.' : 'No sets logged with weight and reps yet.') + '</p>';
  done.forEach(l => {
    h += '<div class="lrow"><div class="spread"><div style="min-width:0">' +
      '<div style="font-weight:800;font-size:13.5px">' + esc(l.n) + '</div>' +
      '<div class="tiny mono">' + (es ? 'mejor' : 'best') + ': ' + r1(l.best.w) + ' kg × ' + l.best.r +
      ' &middot; ' + (es ? 'máx. est.' : 'est. max') + ' ' + r1(l.e1rm) + ' kg &middot; ' + r1(l.ratio) + '× ' + (es ? 'tu peso' : 'BW') + '</div>' +
      '</div>' + tierBadge(l.tier) + '</div>' +
      '<div class="bar" style="margin-top:7px"><i style="width:' + Math.round(l.pct) + '%;background:' + tierColor(l.nextTier != null ? l.nextTier : l.tier) + '"></i></div>' +
      (l.nextTier != null
        ? '<div class="tiny" style="margin-top:5px">' + (es ? 'Para ' : 'For ') + '<b style="color:' + tierColor(l.nextTier) + '">' + esc(tierName(l.nextTier)) + '</b>: ' +
          r1(l.needW) + ' kg × ' + l.reps + ' <span class="mono">(' + (es ? 'te faltan ' : '+' ) + r1(Math.max(0, l.needW - l.nowW)) + ' kg' + (es ? '' : ' to go') + ')</span></div>'
        : '<div class="tiny" style="margin-top:5px">' + (es ? 'Rango máximo en este ejercicio.' : 'Top rank on this lift.') + '</div>') +
      '</div>';
  });
  if (todo.length) {
    h += '<div class="hr"></div><div class="tiny">' + (es ? 'Sin datos todavía: ' : 'No data yet: ') +
      todo.map(l => esc(l.n)).join(' · ') + '</div>';
  }
  h += '</div>';
  return h;
}
