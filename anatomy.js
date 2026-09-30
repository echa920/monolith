/* MONOLITH — anatomy & technique diagrams
   -----------------------------------------------------------------------
   Every exercise gets two drawn frames (start of the rep, far end of the
   range) plus a body map with the muscles it trains.

   Everything is inline SVG generated from numbers: the app has no image
   files, works offline, and the figures scale and re-theme for free.

   Figures are posed by forward kinematics from joint angles, so a pose is
   eight numbers instead of fourteen coordinate pairs, and the skeleton can
   never come out disconnected.

   Angle convention, for every joint:  0° = straight up, 90° = forward (+x),
   180° = straight down, 270°/-90° = backward. Limb angles are absolute
   except the elbow and knee, which are relative to the segment above them.
   ----------------------------------------------------------------------- */

/* ---------------- muscle map ----------------
   The body is drawn once and the trained muscles are painted on top.
   `v` is which view the muscle is visible from. */
const MUSC = {
  /* --- front --- */
  chest:    { en: 'Chest',            es: 'Pecho',              v: 'front', s: [['e', 48, 78, 15, 12], ['e', 72, 78, 15, 12]] },
  delt_f:   { en: 'Front delts',      es: 'Deltoides frontal',  v: 'front', s: [['e', 33, 62, 10, 9], ['e', 87, 62, 10, 9]] },
  delt_s:   { en: 'Side delts',       es: 'Deltoides lateral',  v: 'front', s: [['e', 27, 66, 8, 11], ['e', 93, 66, 8, 11]] },
  biceps:   { en: 'Biceps',           es: 'Bíceps',             v: 'front', s: [['e', 23, 95, 7, 14], ['e', 97, 95, 7, 14]] },
  forearm:  { en: 'Forearms',         es: 'Antebrazos',         v: 'front', s: [['e', 19, 127, 6, 15], ['e', 101, 127, 6, 15]] },
  abs:      { en: 'Abs',              es: 'Abdomen',            v: 'front', s: [['r', 52, 100, 16, 38, 6]] },
  oblique:  { en: 'Obliques',         es: 'Oblicuos',           v: 'front', s: [['e', 43, 116, 6, 16], ['e', 77, 116, 6, 16]] },
  quad:     { en: 'Quads',            es: 'Cuádriceps',         v: 'front', s: [['e', 47, 172, 12, 28], ['e', 73, 172, 12, 28]] },
  adductor: { en: 'Inner thigh',      es: 'Aductores',          v: 'front', s: [['e', 56, 168, 5, 22], ['e', 64, 168, 5, 22]] },
  tibialis: { en: 'Shins',            es: 'Tibial',             v: 'front', s: [['e', 46, 218, 6, 18], ['e', 74, 218, 6, 18]] },
  trap_f:   { en: 'Upper traps',      es: 'Trapecio superior',  v: 'front', s: [['e', 49, 52, 12, 7], ['e', 71, 52, 12, 7]] },

  /* --- back --- */
  lat:      { en: 'Lats',             es: 'Dorsales',           v: 'back',  s: [['e', 41, 96, 14, 26], ['e', 79, 96, 14, 26]] },
  trap:     { en: 'Traps',            es: 'Trapecio',           v: 'back',  s: [['e', 60, 62, 26, 14]] },
  rhomboid: { en: 'Mid back',         es: 'Espalda media',      v: 'back',  s: [['r', 48, 78, 24, 22, 5]] },
  erector:  { en: 'Lower back',       es: 'Lumbares',           v: 'back',  s: [['e', 54, 122, 5, 20], ['e', 66, 122, 5, 20]] },
  delt_r:   { en: 'Rear delts',       es: 'Deltoides posterior', v: 'back', s: [['e', 30, 64, 9, 10], ['e', 90, 64, 9, 10]] },
  triceps:  { en: 'Triceps',          es: 'Tríceps',            v: 'back',  s: [['e', 23, 95, 7, 15], ['e', 97, 95, 7, 15]] },
  glute:    { en: 'Glutes',           es: 'Glúteos',            v: 'back',  s: [['e', 49, 150, 13, 15], ['e', 71, 150, 13, 15]] },
  ham:      { en: 'Hamstrings',       es: 'Isquiotibiales',     v: 'back',  s: [['e', 48, 182, 11, 24], ['e', 72, 182, 11, 24]] },
  calf:     { en: 'Calves',           es: 'Gemelos',            v: 'back',  s: [['e', 47, 216, 8, 19], ['e', 73, 216, 8, 19]] }
};
function muscName(k) { const m = MUSC[k]; return m ? (LANG === 'es' ? m.es : m.en) : k; }

/* which muscles each exercise actually trains: p = prime movers, s = assisting */
const EX_MUS = {
  bench:     { p: ['chest'], s: ['triceps', 'delt_f'] },
  latpull:   { p: ['lat'], s: ['biceps', 'rhomboid', 'delt_r'] },
  incdb:     { p: ['chest', 'delt_f'], s: ['triceps'] },
  seatrow:   { p: ['rhomboid', 'lat'], s: ['biceps', 'delt_r', 'erector'] },
  latraise:  { p: ['delt_s'], s: ['trap_f'] },
  preacher:  { p: ['biceps'], s: ['forearm'] },
  triprop:   { p: ['triceps'], s: [] },
  legpress:  { p: ['quad', 'glute'], s: ['ham', 'adductor'] },
  rdl:       { p: ['ham', 'glute'], s: ['erector', 'forearm'] },
  bss:       { p: ['quad', 'glute'], s: ['ham', 'adductor'] },
  legcurl:   { p: ['ham'], s: ['calf'] },
  legext:    { p: ['quad'], s: [] },
  calf:      { p: ['calf'], s: [] },
  core:      { p: ['abs'], s: ['oblique', 'erector'] },
  incbar:    { p: ['chest', 'delt_f'], s: ['triceps'] },
  machrow:   { p: ['rhomboid', 'lat'], s: ['biceps', 'delt_r'] },
  ohp:       { p: ['delt_f'], s: ['delt_s', 'triceps'] },
  latpull2:  { p: ['lat'], s: ['biceps', 'rhomboid'] },
  inchammer: { p: ['biceps', 'forearm'], s: [] },
  tripro2:   { p: ['triceps'], s: [] },

  /* --- the twenty added later --- */
  dbpress:    { p: ['chest'], s: ['triceps', 'delt_f'] },
  cablefly:   { p: ['chest'], s: ['delt_f'] },
  machfly:    { p: ['chest'], s: ['delt_f'] },
  dipchest:   { p: ['chest', 'triceps'], s: ['delt_f'] },
  pullup:     { p: ['lat'], s: ['biceps', 'rhomboid', 'forearm'] },
  dbrow:      { p: ['lat'], s: ['rhomboid', 'biceps', 'delt_r'] },
  tbar:       { p: ['rhomboid', 'lat'], s: ['biceps', 'delt_r', 'erector'] },
  pullover:   { p: ['lat'], s: ['triceps'] },
  facepull:   { p: ['delt_r'], s: ['rhomboid', 'trap'] },
  curlbar:    { p: ['biceps'], s: ['forearm'] },
  cablecurl:  { p: ['biceps'], s: ['forearm'] },
  conc:       { p: ['biceps'], s: [] },
  skull:      { p: ['triceps'], s: [] },
  ohtri:      { p: ['triceps'], s: [] },
  dips:       { p: ['triceps'], s: ['chest', 'delt_f'] },
  squat:      { p: ['quad', 'glute'], s: ['abs', 'adductor'] },
  hack:       { p: ['quad'], s: ['glute', 'adductor'] },
  lunge:      { p: ['quad', 'glute'], s: ['ham', 'adductor'] },
  hipthrust:  { p: ['glute'], s: ['ham', 'erector'] },
  seatedcalf: { p: ['calf'], s: [] }
};

/* ---------------- palette ----------------
   Deliberately high contrast: the old figures were dark grey on near-black and
   were hard to read on a phone in a gym. */
const C = {
  panel:  '#0E1219',   /* the ground the figure sits on */
  body:   '#CBD6E8',   /* the body itself — near-white, so it reads at a glance */
  edge:   '#0E1219',   /* the outline that separates limb from limb */
  skin:   '#E6EDF8',   /* head */
  work:   '#C8FF00',   /* marks the muscle this exercise trains */
  gear:   '#FF9500',   /* bars, dumbbells, handles */
  cable:  '#98A2B3',
  arrow:  '#00E0FF',   /* the path the weight travels */
  frame:  '#38455C',   /* benches, seats, machines */
  floor:  '#4C5A72'
};

/* roughly where each piece of furniture sits, so the auto-zoom can keep it in shot */
const ENV_BOX = {
  floor:    [8, 188, 192, 198],
  flat:     [48, 112, 166, 174],
  incline:  [58, 92, 178, 177],
  seat:     [72, 58, 146, 184],
  preacher: [56, 98, 142, 181],
  sled:     [22, 50, 190, 154],
  step:     [66, 178, 144, 199],
  bench40:  [136, 146, 190, 193],
  mat:      [20, 176, 180, 191],
  pullupbar:[38, 10, 172, 198],
  benchside:[84, 192, 192, 242]
};
/* ---------------- body map drawing ---------------- */
function musShapes(list, fill, stroke, op) {
  return list.map(sh => sh[0] === 'e'
    ? '<ellipse cx="' + sh[1] + '" cy="' + sh[2] + '" rx="' + sh[3] + '" ry="' + sh[4] +
      '" fill="' + fill + '" fill-opacity="' + op + '" stroke="' + stroke + '" stroke-width="1.4"/>'
    : '<rect x="' + sh[1] + '" y="' + sh[2] + '" width="' + sh[3] + '" height="' + sh[4] + '" rx="' + (sh[5] || 4) +
      '" fill="' + fill + '" fill-opacity="' + op + '" stroke="' + stroke + '" stroke-width="1.4"/>'
  ).join('');
}

/* A front-facing human, drawn so the shape itself reads as a body:
   neck, shoulders wider than the waist, arms clear of the torso, knees. */
function bodyOutline() {
  return '<g fill="' + C.body + '" stroke="#687895" stroke-width="1.4" stroke-linejoin="round">' +
    '<path d="M60 8 C70 8 76 16 76 26 C76 36 69 44 60 44 C51 44 44 36 44 26 C44 16 50 8 60 8 Z"/>' +
    '<path d="M53 42 L53 52 C53 55 67 55 67 52 L67 42 Z"/>' +
    '<path d="M60 50 C48 50 40 53 34 58 C28 63 26 72 26 80 L28 104 C29 112 32 120 36 127 ' +
      'L41 140 C41 146 79 146 79 140 L84 127 C88 120 91 112 92 104 L94 80 ' +
      'C94 72 92 63 86 58 C80 53 72 50 60 50 Z"/>' +
    '<path d="M30 60 C24 62 21 70 20 80 L17 100 C16 106 25 108 27 102 L31 82 C32 74 34 66 34 62 Z"/>' +
    '<path d="M90 60 C96 62 99 70 100 80 L103 100 C104 106 95 108 93 102 L89 82 C88 74 86 66 86 62 Z"/>' +
    '<path d="M18 101 L15 128 C14 136 13 142 14 146 C15 150 23 150 24 146 C25 141 25 135 26 128 L28 103 Z"/>' +
    '<path d="M102 101 L105 128 C106 136 107 142 106 146 C105 150 97 150 96 146 C95 141 95 135 94 128 L92 103 Z"/>' +
    '<ellipse cx="19" cy="152" rx="6" ry="8"/><ellipse cx="101" cy="152" rx="6" ry="8"/>' +
    '<path d="M42 144 C38 158 37 174 38 190 L40 196 C41 200 51 200 52 196 L55 176 C57 164 58 152 58 144 Z"/>' +
    '<path d="M78 144 C82 158 83 174 82 190 L80 196 C79 200 69 200 68 196 L65 176 C63 164 62 152 62 144 Z"/>' +
    '<path d="M39 197 C38 210 38 226 39 238 L40 244 C41 248 51 248 52 244 L53 226 C54 212 54 204 53 197 Z"/>' +
    '<path d="M81 197 C82 210 82 226 81 238 L80 244 C79 248 69 248 68 244 L67 226 C66 212 66 204 67 197 Z"/>' +
    '</g>' +
    '<line x1="60" y1="52" x2="60" y2="142" stroke="#687895" stroke-width="1" opacity=".3"/>';
}

/* body, then assisting muscles, then prime movers on top */
function bodyMap(view, prim, sec) {
  const P = prim.filter(k => MUSC[k] && MUSC[k].v === view);
  const Sx = sec.filter(k => MUSC[k] && MUSC[k].v === view);
  return '<svg viewBox="0 0 120 258" class="bodymap" role="img">' +
    '<rect x="0" y="0" width="120" height="258" fill="' + C.panel + '"/>' +
    bodyOutline() +
    Sx.map(k => musShapes(MUSC[k].s, '#00D6FF', '#8DEDFF', .6)).join('') +
    P.map(k => musShapes(MUSC[k].s, C.work, '#F2FFC0', .92)).join('') +
    '</svg>';
}

/* ---------------- posed figure ---------------- */
const LIMB = { torso: 56, head: 20, uarm: 30, farm: 28, thigh: 38, shin: 38 };
function pstep(p, deg, len) {
  const a = deg * Math.PI / 180;
  return { x: p.x + Math.sin(a) * len, y: p.y - Math.cos(a) * len };
}
function skeleton(q) {
  const hip = { x: q.x != null ? q.x : 100, y: q.y != null ? q.y : 120 };
  const torso = q.torso || 0;
  const neck = pstep(hip, torso, LIMB.torso);
  const head = pstep(neck, torso, LIMB.head);
  const sho = pstep(neck, torso, 4);
  const elb = pstep(sho, q.sho || 180, LIMB.uarm);
  const wri = pstep(elb, (q.sho || 180) + (q.elb || 0), LIMB.farm);
  const kne = pstep(hip, q.hip != null ? q.hip : 180, LIMB.thigh);
  const ank = pstep(kne, (q.hip != null ? q.hip : 180) + (q.kne || 0), LIMB.shin);
  return { hip: hip, neck: neck, head: head, sho: sho, elb: elb, wri: wri, kne: kne, ank: ank };
}

/* a tapered capsule, so a limb reads as a limb instead of a stick */
function limbPts(a, b, w1, w2) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const px = -dy / L, py = dx / L;
  return [[a.x + px * w1, a.y + py * w1], [b.x + px * w2, b.y + py * w2],
          [b.x - px * w2, b.y - py * w2], [a.x - px * w1, a.y - py * w1]];
}
function limb(a, b, w1, w2, fill, op) {
  const o = op != null ? ' fill-opacity="' + op + '"' : '';
  return '<circle cx="' + a.x.toFixed(1) + '" cy="' + a.y.toFixed(1) + '" r="' + w1 + '" fill="' + fill + '"' + o + '/>' +
    '<circle cx="' + b.x.toFixed(1) + '" cy="' + b.y.toFixed(1) + '" r="' + w2 + '" fill="' + fill + '"' + o + '/>' +
    '<path d="M' + limbPts(a, b, w1, w2).map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') +
    ' Z" fill="' + fill + '"' + o + '/>';
}
/* ring the muscle being worked rather than filling it: a solid green torso
   hides the shape of the body, which is the thing you came to look at */
function limbEdge(a, b, w1, w2, col, wid, op, noCaps) {
  const st = '" fill="none" stroke="' + (col || C.work) + '" stroke-width="' + (wid || 3) + '" opacity="' + (op || .95) + '"/>';
  return '<path d="M' + limbPts(a, b, w1, w2).map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' Z' + st +
    (noCaps ? '' :
      '<circle cx="' + a.x.toFixed(1) + '" cy="' + a.y.toFixed(1) + '" r="' + w1 + st +
      '<circle cx="' + b.x.toFixed(1) + '" cy="' + b.y.toFixed(1) + '" r="' + w2 + st);
}

/* which body segment this exercise works, so it can be ringed */
const SEG_OF = {
  chest: 'torso', lat: 'torso', rhomboid: 'torso', trap: 'torso', trap_f: 'torso',
  abs: 'torso', oblique: 'torso', erector: 'torso',
  biceps: 'uarm', triceps: 'uarm', delt_f: 'uarm', delt_s: 'uarm', delt_r: 'uarm',
  forearm: 'farm', quad: 'thigh', ham: 'thigh', glute: 'thigh',
  adductor: 'thigh', calf: 'shin', tibialis: 'shin'
};
function workSeg(id) {
  const mm = EX_MUS[id];
  if (!mm || !mm.p.length) return null;
  return SEG_OF[mm.p[0]] || null;
}

/* draw one body; a low opacity makes it the ghost of the other position */
function figure(k, seg, op) {
  /* The other position of the rep, drawn behind as a thin wireframe. */
  if (op != null) {
    const G = '#5D6B86', W = 2, O = .85;
    return limbEdge(k.hip, k.kne, 9, 7, G, W, O) + limbEdge(k.kne, k.ank, 7, 5, G, W, O) +
      limbEdge(k.hip, k.neck, 11, 15, G, W, O) +
      '<circle cx="' + k.head.x.toFixed(1) + '" cy="' + k.head.y.toFixed(1) + '" r="12" fill="none" stroke="' + G + '" stroke-width="' + W + '" opacity="' + O + '"/>' +
      limbEdge(k.sho, k.elb, 8, 6, G, W, O) + limbEdge(k.elb, k.wri, 6, 4.5, G, W, O);
  }
  /* Every limb gets a dark outline. Without it a light body on a dark ground
     turns into one white blob the moment two limbs overlap. */
  const E = ' stroke="' + C.edge + '" stroke-width="2" stroke-linejoin="round"';
  const cap = (p, r) => '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r + '" fill="' + C.body + '"' + E + '/>';
  const seg2 = (a, b, w1, w2) => '<path d="M' + limbPts(a, b, w1, w2).map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') +
    ' Z" fill="' + C.body + '"' + E + '/>';
  /* a nose, so the direction the body faces is never ambiguous */
  const face = pstep(k.head, (k.head.x - k.neck.x) * 0 + 90, 0);
  const nx = (k.head.x - k.hip.x), ny = (k.head.y - k.hip.y);
  const L = Math.hypot(nx, ny) || 1;
  const noseP = { x: k.head.x - ny / L * 11, y: k.head.y + nx / L * 11 };

  let h =
    seg2(k.hip, k.kne, 9, 7) + cap(k.kne, 7) +
    seg2(k.kne, k.ank, 7, 5) +
    '<path d="M' + k.ank.x.toFixed(1) + ' ' + k.ank.y.toFixed(1) + ' l11 0 l0 5 l-13 0 Z" fill="' + C.body + '"' + E + '/>' +
    seg2(k.hip, k.neck, 11, 15) + cap(k.hip, 11) +
    seg2(k.neck, k.head, 6, 6) +
    '<circle cx="' + k.head.x.toFixed(1) + '" cy="' + k.head.y.toFixed(1) + '" r="12" fill="' + C.skin + '"' + E + '/>' +
    '<circle cx="' + noseP.x.toFixed(1) + '" cy="' + noseP.y.toFixed(1) + '" r="3.2" fill="' + C.edge + '"/>' +
    seg2(k.sho, k.elb, 8, 6) + cap(k.sho, 8) + cap(k.elb, 6) +
    seg2(k.elb, k.wri, 6, 4.5) + cap(k.wri, 6);

  if (seg) {
    const ring = (p, q2, w1, w2) => limbEdge(p, q2, w1 + 2.5, w2 + 2.5, C.work, 3.2, 1, true);
    if (seg === 'torso') h += ring(k.hip, k.neck, 11, 15);
    else if (seg === 'uarm') h += ring(k.sho, k.elb, 8, 6);
    else if (seg === 'farm') h += ring(k.elb, k.wri, 6, 4.5);
    else if (seg === 'thigh') h += ring(k.hip, k.kne, 9, 7);
    else if (seg === 'shin') h += ring(k.kne, k.ank, 7, 5);
  }
  return h;
}

/* a label pinned to a point on the drawing, with a leader line */
function pin(p, dx, dy, text, col, fs2, side) {
  const tx = p.x + dx, ty = p.y + dy;
  /* the text must run INTO the picture, not off the edge it is parked against */
  const anchor = side < 0 ? 'end' : 'start';
  return '<line x1="' + p.x.toFixed(1) + '" y1="' + p.y.toFixed(1) + '" x2="' + tx.toFixed(1) + '" y2="' + ty.toFixed(1) +
    '" stroke="' + col + '" stroke-width="1.6" opacity=".85"/>' +
    '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="2.6" fill="' + col + '"/>' +
    '<text x="' + (tx + (side < 0 ? -4 : 4)).toFixed(1) + '" y="' + (ty + 4).toFixed(1) + '" fill="' + col +
    '" font-family="ui-monospace,Consolas,monospace" font-size="' + (fs2 || 11) + '" font-weight="700" text-anchor="' + anchor + '">' + text + '</text>';
}

function pathArrow(a, b) {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  if (d < 14) return '';
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const nx = -(b.y - a.y) / d, ny = (b.x - a.x) / d;
  const cx = mx + nx * d * 0.22, cy = my + ny * d * 0.22;
  const ang = Math.atan2(b.y - cy, b.x - cx) * 180 / Math.PI;
  return '<path d="M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) +
    ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) + '" fill="none" stroke="' + C.arrow +
    '" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="7 5" opacity=".9"/>' +
    '<g transform="translate(' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')">' +
    '<path d="M0 0 L-9 -5 L-9 5 Z" fill="' + C.arrow + '"/></g>';
}

/* equipment, drawn at the hands */
function gear(kind, w, q) {
  const x = w.x, y = w.y;
  switch (kind) {
    case 'bar':
      return '<line x1="' + (x - 30) + '" y1="' + y + '" x2="' + (x + 30) + '" y2="' + y + '" stroke="' + C.cable + '" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="' + (x - 25) + '" cy="' + y + '" r="10" fill="' + C.gear + '" opacity=".25"/>' +
        '<circle cx="' + (x - 25) + '" cy="' + y + '" r="10" fill="none" stroke="' + C.gear + '" stroke-width="3.5"/>' +
        '<circle cx="' + (x + 25) + '" cy="' + y + '" r="10" fill="' + C.gear + '" opacity=".25"/>' +
        '<circle cx="' + (x + 25) + '" cy="' + y + '" r="10" fill="none" stroke="' + C.gear + '" stroke-width="3.5"/>';
    case 'db':
      return '<rect x="' + (x - 3.5) + '" y="' + (y - 12) + '" width="7" height="24" rx="3" fill="' + C.cable + '"/>' +
        '<rect x="' + (x - 10) + '" y="' + (y - 15) + '" width="20" height="9" rx="3" fill="' + C.gear + '"/>' +
        '<rect x="' + (x - 10) + '" y="' + (y + 6) + '" width="20" height="9" rx="3" fill="' + C.gear + '"/>';
    case 'ez':
      return '<path d="M' + (x - 26) + ' ' + y + ' q7 -7 14 0 q7 7 14 0" fill="none" stroke="' + C.cable + '" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="' + (x - 29) + '" cy="' + y + '" r="9" fill="none" stroke="' + C.gear + '" stroke-width="3.5"/>' +
        '<circle cx="' + (x + 29) + '" cy="' + y + '" r="9" fill="none" stroke="' + C.gear + '" stroke-width="3.5"/>';
    case 'cable': {
      const py = q && q.pulleyY != null ? q.pulleyY : 20;
      const px = q && q.pulleyX != null ? q.pulleyX : x;
      return '<line x1="' + px + '" y1="' + py + '" x2="' + x + '" y2="' + y + '" stroke="' + C.cable + '" stroke-width="2.2" stroke-dasharray="5 4"/>' +
        '<line x1="' + (x - 19) + '" y1="' + y + '" x2="' + (x + 19) + '" y2="' + y + '" stroke="' + C.gear + '" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="' + px + '" cy="' + py + '" r="5" fill="' + C.cable + '"/>';
    }
    case 'rope': {
      const py = q && q.pulleyY != null ? q.pulleyY : 20;
      return '<line x1="' + x + '" y1="' + py + '" x2="' + x + '" y2="' + (y - 7) + '" stroke="' + C.cable + '" stroke-width="2.2" stroke-dasharray="5 4"/>' +
        '<path d="M' + x + ' ' + (y - 7) + ' l-10 16 M' + x + ' ' + (y - 7) + ' l10 16" stroke="' + C.gear + '" stroke-width="5" stroke-linecap="round" fill="none"/>' +
        '<circle cx="' + x + '" cy="' + py + '" r="5" fill="' + C.cable + '"/>';
    }
    case 'handle':
      return '<circle cx="' + x + '" cy="' + y + '" r="9" fill="none" stroke="' + C.gear + '" stroke-width="5"/>';
    case 'pad':
      return '<rect x="' + (x - 12) + '" y="' + (y - 7) + '" width="24" height="14" rx="6" fill="' + C.gear + '"/>';
    default: return '';
  }
}

/* the furniture behind the figure */
function env(kind) {
  const F = C.frame, FL = C.floor;
  const floor = y => '<line x1="8" y1="' + y + '" x2="192" y2="' + y + '" stroke="' + FL + '" stroke-width="3.5" stroke-linecap="round"/>';
  switch (kind) {
    case 'floor':  return floor(196);
    case 'flat':   return '<rect x="50" y="118" width="114" height="11" rx="5" fill="' + F + '"/>' +
                          '<rect x="64" y="129" width="9" height="42" fill="' + F + '"/><rect x="143" y="129" width="9" height="42" fill="' + F + '"/>' + floor(172);
    case 'incline':return '<g transform="rotate(-30 150 130)"><rect x="50" y="123" width="108" height="11" rx="5" fill="' + F + '"/></g>' +
                          '<rect x="127" y="130" width="11" height="44" fill="' + F + '"/>' + floor(175);
    case 'seat':   return '<rect x="74" y="132" width="64" height="11" rx="5" fill="' + F + '"/>' +
                          '<g transform="rotate(10 136 132)"><rect x="129" y="62" width="11" height="72" rx="5" fill="' + F + '"/></g>' +
                          '<rect x="99" y="143" width="10" height="38" fill="' + F + '"/>' + floor(182);
    case 'preacher':return '<rect x="76" y="128" width="56" height="10" rx="5" fill="' + F + '"/>' +
                          '<g transform="rotate(-42 96 122)"><rect x="58" y="111" width="74" height="12" rx="6" fill="' + F + '"/></g>' +
                          '<rect x="97" y="138" width="10" height="40" fill="' + F + '"/>' + floor(179);
    case 'sled':   return '<line x1="152" y1="54" x2="66" y2="152" stroke="' + F + '" stroke-width="5"/>' +
                          '<rect x="24" y="94" width="46" height="13" rx="4" fill="' + C.gear + '" transform="rotate(-38 47 101)"/>' +
                          '<rect x="130" y="120" width="56" height="13" rx="5" fill="' + F + '"/>' +
                          '<g transform="rotate(-38 168 104)"><rect x="149" y="52" width="11" height="64" rx="5" fill="' + F + '"/></g>';
    case 'step':   return '<rect x="68" y="182" width="74" height="15" rx="4" fill="' + F + '"/>' + floor(197);
    case 'bench40':return '<rect x="138" y="150" width="50" height="11" rx="5" fill="' + F + '"/>' +
                          '<rect x="151" y="161" width="9" height="30" fill="' + F + '"/>' + floor(191);
    case 'mat':    return '<rect x="22" y="180" width="156" height="9" rx="4" fill="' + F + '"/>';
    case 'pullupbar': return '<rect x="40" y="26" width="130" height="12" rx="6" fill="' + F + '"/>' +
                          '<rect x="44" y="12" width="10" height="20" fill="' + F + '"/>' +
                          '<rect x="156" y="12" width="10" height="20" fill="' + F + '"/>' + floor(196);
    case 'benchside': return '<rect x="86" y="196" width="104" height="12" rx="5" fill="' + F + '"/>' +
                          '<rect x="98" y="208" width="9" height="30" fill="' + F + '"/>' +
                          '<rect x="168" y="208" width="9" height="30" fill="' + F + '"/>' + floor(240);
    default: return '';
  }
}

/* one frame: the other position in ghost, this one solid, the path between */
function poseSVG(spec, which) {
  const q = Object.assign({}, spec.base || {}, spec[which]);
  const other = Object.assign({}, spec.base || {}, spec[which === 'a' ? 'b' : 'a']);
  const k = skeleton(q), ko = skeleton(other);
  const seg = workSeg(spec.id);
  const lean = q.lean || 0, leanO = other.lean || 0;
  const rot = (p, deg, c) => {
    if (!deg) return p;
    const a = deg * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
    const dx = p.x - c.x, dy = p.y - c.y;
    return { x: c.x + dx * cs - dy * sn, y: c.y + dx * sn + dy * cs };
  };
  const wrap = (deg, piv, inner) => deg
    ? '<g transform="rotate(' + deg + ' ' + piv.x.toFixed(1) + ' ' + piv.y.toFixed(1) + ')">' + inner + '</g>'
    : '<g>' + inner + '</g>';

  const legWork = seg === 'thigh' || seg === 'shin';
  const from = rot(legWork ? ko.ank : ko.wri, leanO, ko.hip);
  const to = rot(legWork ? k.ank : k.wri, lean, k.hip);

  /* --- auto-zoom: crop to what is actually drawn, so the body fills the frame
     instead of floating in the middle of a 200x200 box --- */
  const pts = [];
  Object.keys(k).forEach(j => pts.push(rot(k[j], lean, k.hip)));
  Object.keys(ko).forEach(j => pts.push(rot(ko[j], leanO, ko.hip)));
  let x0 = Math.min.apply(null, pts.map(p => p.x)) - 34;
  let y0 = Math.min.apply(null, pts.map(p => p.y)) - 26;
  let x1 = Math.max.apply(null, pts.map(p => p.x)) + 34;
  let y1 = Math.max.apply(null, pts.map(p => p.y)) + 26;
  const eb = ENV_BOX[spec.env];
  if (eb) { x0 = Math.min(x0, eb[0]); y0 = Math.min(y0, eb[1]); x1 = Math.max(x1, eb[2]); y1 = Math.max(y1, eb[3]); }
  if (spec.grip === 'cable' || spec.grip === 'rope') {
    const py = q.pulleyY != null ? q.pulleyY : 20, px = q.pulleyX != null ? q.pulleyX : to.x;
    x0 = Math.min(x0, px - 8); y0 = Math.min(y0, py - 8); x1 = Math.max(x1, px + 8); y1 = Math.max(y1, py + 8);
  }
  const side = Math.max(x1 - x0, y1 - y0);
  const vx = x0 - (side - (x1 - x0)) / 2, vy = y0 - (side - (y1 - y0)) / 2;

  /* the muscle, named on the drawing itself */
  const mid = { torso: [k.hip, k.neck], uarm: [k.sho, k.elb], farm: [k.elb, k.wri],
                thigh: [k.hip, k.kne], shin: [k.kne, k.ank] }[seg];
  let label = '';
  if (mid && EX_MUS[spec.id]) {
    const c0 = rot({ x: (mid[0].x + mid[1].x) / 2, y: (mid[0].y + mid[1].y) / 2 }, lean, k.hip);
    /* park the text in whichever corner is furthest from every limb, so it can
       never land on top of the body it is pointing at */
    const inset = side * 0.16;
    const corners = [
      { x: vx + inset, y: vy + inset, dx: 1 }, { x: vx + side - inset, y: vy + inset, dx: -1 },
      { x: vx + inset, y: vy + side - inset, dx: 1 }, { x: vx + side - inset, y: vy + side - inset, dx: -1 }
    ];
    let best = corners[0], bestD = -1;
    corners.forEach(c2 => {
      const d = Math.min.apply(null, pts.map(p => Math.hypot(p.x - c2.x, p.y - c2.y)));
      if (d > bestD) { bestD = d; best = c2; }
    });
    label = pin(c0, best.x - c0.x, best.y - c0.y, muscName(EX_MUS[spec.id].p[0]).toUpperCase(), C.work, Math.max(10, side * 0.062), best.dx);
  }

  return '<svg viewBox="' + vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + side.toFixed(1) + ' ' + side.toFixed(1) + '" class="posefig" role="img">' +
    '<rect x="' + (vx - 5) + '" y="' + (vy - 5) + '" width="' + (side + 10) + '" height="' + (side + 10) + '" fill="' + C.panel + '"/>' +
    env(spec.env) +
    wrap(leanO, ko.hip, figure(ko, null, .5)) +
    pathArrow(from, to) +
    wrap(lean, k.hip, figure(k, seg) + gear(spec.grip, k.wri, q)) +
    label +
    '</svg>';
}

const EX_POSE = {
  bench: { env: 'flat', grip: 'bar',
    base: { x: 108, y: 112, lean: -90, torso: 0, hip: 178, kne: 40 },
    a: { sho: 92, elb: 0 }, b: { sho: 60, elb: 125 },
    ca: ['Arms locked out, bar over your chest', 'Brazos estirados, barra sobre el pecho'],
    cb: ['Bar touching the lower chest, elbows at 45–60°', 'Barra tocando el pecho bajo, codos a 45–60°'] },

  latpull: { env: 'seat', grip: 'cable',
    base: { x: 104, y: 128, torso: 12, hip: 100, kne: 70, pulleyY: 14 },
    a: { sho: 12, elb: 8 }, b: { sho: 150, elb: 70 },
    ca: ['Arms fully stretched overhead, shoulders down', 'Brazos estirados arriba, hombros abajo'],
    cb: ['Bar at the collarbone, elbows driven to your back pocket', 'Barra en la clavícula, codos al bolsillo trasero'] },

  incdb: { env: 'incline', grip: 'db',
    base: { x: 108, y: 116, lean: -60, torso: 0, hip: 172, kne: 42 },
    a: { sho: 86, elb: 4 }, b: { sho: 56, elb: 122 },
    ca: ['Dumbbells locked out over the upper chest', 'Mancuernas arriba sobre el pecho alto'],
    cb: ['Elbows just below torso level — that is the stretch', 'Codos algo por debajo del torso: ahí está el estiramiento'] },

  seatrow: { env: 'seat', grip: 'cable',
    base: { x: 96, y: 130, hip: 96, kne: 66, pulleyY: 128, pulleyX: 188 },
    a: { torso: 4, sho: 96, elb: 4 }, b: { torso: -8, sho: 150, elb: 62 },
    ca: ['Arms straight, shoulder blades spread, chest up', 'Brazos estirados, omóplatos separados, pecho arriba'],
    cb: ['Handle at the navel, shoulder blades squeezed', 'Agarre al ombligo, omóplatos juntos'] },

  latraise: { env: 'floor', grip: 'db',
    base: { x: 100, y: 106, torso: 8, hip: 180, kne: 2 },
    a: { sho: 176, elb: 6 }, b: { sho: 96, elb: 8 },
    ca: ['Dumbbells at your sides, slight fixed bend in the elbow', 'Mancuernas a los lados, codo con flexión leve y fija'],
    cb: ['Up to shoulder height, no higher, pinky a touch up', 'Hasta la altura del hombro, no más, meñique un pelo arriba'] },

  preacher: { env: 'preacher', grip: 'ez',
    base: { x: 108, y: 126, torso: 22, hip: 100, kne: 70 },
    a: { sho: 132, elb: 34 }, b: { sho: 132, elb: 112 },
    ca: ['Elbow almost straight, upper arm flat on the pad', 'Codo casi estirado, brazo plano sobre la almohadilla'],
    cb: ['Curled to just short of vertical, squeeze', 'Sube hasta poco antes de la vertical y aprieta'] },

  triprop: { env: 'floor', grip: 'cable',
    base: { x: 100, y: 106, torso: 12, hip: 180, kne: 3, pulleyY: 12 },
    a: { sho: 168, elb: -88 }, b: { sho: 168, elb: -4 },
    ca: ['Elbows pinned at your ribs, about 90° of bend', 'Codos pegados a las costillas, unos 90° de flexión'],
    cb: ['Extended to a soft lockout, elbows never move', 'Extendido hasta bloqueo suave, los codos no se mueven'] },

  legpress: { env: 'sled', grip: 'none',
    base: { x: 118, y: 126, lean: -66, torso: 0, sho: 150, elb: 40 },
    a: { hip: 158, kne: -24 }, b: { hip: 128, kne: -78 },
    ca: ['Knees almost extended, never snapped into lockout', 'Rodillas casi estiradas, nunca bloqueadas de golpe'],
    cb: ['About 90° of knee bend — stop before your hips curl up', 'Unos 90° de rodilla: para antes de que la cadera se enrolle'] },

  rdl: { env: 'floor', grip: 'db',
    base: { x: 100, y: 106, kne: 14 },
    a: { torso: 2, hip: 178, sho: 179, elb: 2 }, b: { torso: 74, hip: 176, sho: 186, elb: 2 },
    ca: ['Standing tall, dumbbells against your thighs', 'De pie erguido, mancuernas pegadas a los muslos'],
    cb: ['Hips pushed back, flat back, bar just below the knee', 'Cadera atrás, espalda plana, peso justo bajo la rodilla'] },

  bss: { env: 'bench40', grip: 'db',
    base: { x: 92, torso: 12, sho: 179, elb: 2 },
    a: { y: 102, hip: 176, kne: 10 }, b: { y: 120, hip: 150, kne: 78 },
    ca: ['Front foot planted, rear foot on the bench, tall', 'Pie delantero firme, pie de atrás en el banco, erguido'],
    cb: ['Front thigh close to parallel, knee over the ankle', 'Muslo delantero casi paralelo, rodilla sobre el tobillo'] },

  legcurl: { env: 'flat', grip: 'pad',
    base: { x: 96, y: 112, lean: -90, torso: 0, sho: 176, elb: 6, hip: 180 },
    a: { kne: 6 }, b: { kne: 108 },
    ca: ['Legs almost straight, hips pinned to the bench', 'Piernas casi rectas, cadera pegada al banco'],
    cb: ['Curled all the way, squeeze for one second', 'Flexión completa, aprieta un segundo'] },

  legext: { env: 'seat', grip: 'pad',
    base: { x: 104, y: 128, torso: -6, sho: 176, elb: 8, hip: 96 },
    a: { kne: 84 }, b: { kne: 6 },
    ca: ['Knees bent at the edge of the seat, pad on the shin', 'Rodillas dobladas en el borde del asiento, almohadilla en la espinilla'],
    cb: ['Extended to just short of lockout, squeeze', 'Extiende hasta poco antes del bloqueo y aprieta'] },

  calf: { env: 'step', grip: 'db',
    base: { x: 100, y: 108, torso: 2, hip: 180, kne: 2, sho: 179, elb: 2 },
    a: { y: 112 }, b: { y: 96 },
    ca: ['Heels dropped below the step, full stretch', 'Talones por debajo del escalón, estiramiento completo'],
    cb: ['All the way up on your toes, squeeze at the top', 'Arriba del todo de puntillas, aprieta arriba'] },

  core: { env: 'mat', grip: 'none',
    base: { x: 100, y: 168, lean: -90, torso: 0 },
    a: { sho: 90, elb: 0, hip: 90, kne: 88 }, b: { sho: 140, elb: 0, hip: 168, kne: 16 },
    ca: ['Dead bug start: arms up, knees at 90°, lower back flat', 'Inicio del dead bug: brazos arriba, rodillas a 90°, lumbar pegada'],
    cb: ['Opposite arm and leg lowered — lower back never lifts', 'Brazo y pierna opuestos abajo: la lumbar nunca se despega'] },

  incbar: { env: 'incline', grip: 'bar',
    base: { x: 108, y: 116, lean: -60, torso: 0, hip: 172, kne: 42 },
    a: { sho: 88, elb: 2 }, b: { sho: 58, elb: 120 },
    ca: ['Bar locked out over the collarbones', 'Barra estirada sobre las clavículas'],
    cb: ['Bar touching the very top of the chest, no bounce', 'Barra tocando la parte muy alta del pecho, sin rebote'] },

  machrow: { env: 'seat', grip: 'handle',
    base: { x: 96, y: 130, torso: 6, hip: 96, kne: 66 },
    a: { sho: 94, elb: 4 }, b: { sho: 148, elb: 58 },
    ca: ['Chest into the pad, arms straight, lats stretched', 'Pecho en la almohadilla, brazos estirados, dorsales estirados'],
    cb: ['Elbows past your ribs, one-second squeeze', 'Codos por detrás de las costillas, aprieta un segundo'] },

  ohp: { env: 'seat', grip: 'db',
    base: { x: 104, y: 128, torso: -4, hip: 96, kne: 66 },
    a: { sho: 128, elb: 104 }, b: { sho: 8, elb: 6 },
    ca: ['Dumbbells at ear height, elbows slightly forward', 'Mancuernas a la altura de la oreja, codos algo adelante'],
    cb: ['Pressed up and slightly in, without clanging them', 'Empuje arriba y un poco adentro, sin chocarlas'] },

  latpull2: { env: 'seat', grip: 'cable',
    base: { x: 104, y: 128, torso: 12, hip: 100, kne: 70, pulleyY: 14 },
    a: { sho: 12, elb: 8 }, b: { sho: 150, elb: 70 },
    ca: ['Full stretch overhead before every rep', 'Estiramiento completo arriba antes de cada repetición'],
    cb: ['Bar to the upper chest, never behind the neck', 'Barra al pecho alto, nunca detrás de la nuca'] },

  inchammer: { env: 'incline', grip: 'db',
    base: { x: 104, y: 118, lean: -48, torso: 0, hip: 174, kne: 40 },
    a: { sho: 186, elb: 4 }, b: { sho: 186, elb: 118 },
    ca: ['Arms hanging straight down and slightly behind you', 'Brazos colgando rectos y un poco por detrás'],
    cb: ['Curled to just short of vertical, neutral grip held', 'Sube hasta poco antes de la vertical, agarre neutro'] },

  tripro2: { env: 'floor', grip: 'rope',
    base: { x: 100, y: 106, torso: 12, hip: 180, kne: 3, pulleyY: 12 },
    a: { sho: 168, elb: -88 }, b: { sho: 168, elb: -4 },
    ca: ['Elbows fixed at your sides, forearms up', 'Codos fijos al costado, antebrazos arriba'],
    cb: ['Fully extended, hands spread apart at the bottom', 'Extensión completa, manos separadas abajo'] },

  /* ---------------- the twenty added later ---------------- */
  dbpress: { env: 'flat', grip: 'db',
    base: { x: 108, y: 112, lean: -90, torso: 0, hip: 178, kne: 40 },
    a: { sho: 92, elb: 0 }, b: { sho: 58, elb: 124 },
    ca: ['Dumbbells locked out over the chest', 'Mancuernas arriba, sobre el pecho'],
    cb: ['Elbows just below the torso — deeper than a barbell allows', 'Codos algo por debajo del torso: más profundo que con barra'] },

  cablefly: { env: 'floor', grip: 'cable',
    base: { x: 100, y: 106, torso: 14, hip: 180, kne: 3, pulleyY: 40, pulleyX: 176 },
    a: { sho: 108, elb: -10 }, b: { sho: 158, elb: -12 },
    ca: ['Arms wide, chest stretched, elbows at a fixed bend', 'Brazos abiertos, pecho estirado, codos con flexión fija'],
    cb: ['Hands together in front of the sternum, squeeze', 'Manos juntas frente al esternón, aprieta'] },

  machfly: { env: 'seat', grip: 'handle',
    base: { x: 100, y: 130, torso: -2, hip: 96, kne: 66 },
    a: { sho: 112, elb: -8 }, b: { sho: 150, elb: -10 },
    ca: ['Handles out wide at chest height, back on the pad', 'Agarres abiertos a la altura del pecho, espalda apoyada'],
    cb: ['Squeezed together and held for a second', 'Juntos y aguantados un segundo'] },

  dipchest: { env: 'floor', grip: 'handle',
    base: { x: 100, y: 112, torso: 26, hip: 168, kne: 44 },
    a: { sho: 176, elb: 4 }, b: { sho: 150, elb: 86 },
    ca: ['Arms straight, torso leaned forward about 30°', 'Brazos estirados, torso inclinado unos 30°'],
    cb: ['Upper arms about parallel to the floor, no deeper', 'Brazos casi paralelos al suelo, no más abajo'] },

  pullup: { env: 'pullupbar', grip: 'handle',
    base: { x: 104, torso: 2, hip: 176, kne: 82 },
    a: { y: 134, sho: 8, elb: 4 }, b: { y: 102, sho: 32, elb: 96 },
    ca: ['Dead hang, arms straight, shoulders pulled down', 'Colgado, brazos rectos, hombros hacia abajo'],
    cb: ['Chest to the bar, elbows driven down to your ribs', 'Pecho a la barra, codos hacia las costillas'] },

  dbrow: { env: 'benchside', grip: 'db',
    base: { x: 104, y: 112, torso: 78, hip: 178, kne: 16 },
    a: { sho: 178, elb: 2 }, b: { sho: 214, elb: 96 },
    ca: ['Back flat and parallel to the floor, weight hanging', 'Espalda plana y paralela al suelo, peso colgando'],
    cb: ['Elbow driven up and back towards the hip', 'Codo arriba y atrás, hacia la cadera'] },

  tbar: { env: 'seat', grip: 'handle',
    base: { x: 96, y: 116, torso: 52, hip: 150, kne: 40 },
    a: { sho: 186, elb: 2 }, b: { sho: 228, elb: 74 },
    ca: ['Chest on the pad, arms straight, blades spread', 'Pecho en la almohadilla, brazos rectos, omóplatos separados'],
    cb: ['Blades squeezed, elbows past the ribs, one-second pause', 'Omóplatos juntos, codos pasados de las costillas, pausa de 1 s'] },

  pullover: { env: 'floor', grip: 'cable',
    base: { x: 100, y: 108, torso: 26, hip: 178, kne: 8, pulleyY: 16 },
    a: { sho: 30, elb: 4 }, b: { sho: 170, elb: 6 },
    ca: ['Arms overhead and almost straight, lats lengthened', 'Brazos arriba y casi rectos, dorsales estirados'],
    cb: ['Swept down to the thighs, elbows never bending', 'Bajados hasta los muslos, sin doblar nunca el codo'] },

  facepull: { env: 'floor', grip: 'rope',
    base: { x: 100, y: 106, torso: 6, hip: 180, kne: 3, pulleyY: 30 },
    a: { sho: 46, elb: 8 }, b: { sho: 78, elb: 104 },
    ca: ['Arms extended towards the pulley at face height', 'Brazos extendidos hacia la polea, a la altura de la cara'],
    cb: ['Knuckles beside your ears, elbows high', 'Nudillos junto a las orejas, codos altos'] },

  curlbar: { env: 'floor', grip: 'ez',
    base: { x: 100, y: 106, torso: 2, hip: 180, kne: 2 },
    a: { sho: 179, elb: 4 }, b: { sho: 179, elb: 130 },
    ca: ['Standing tall, arms straight, elbows at your sides', 'De pie erguido, brazos rectos, codos al costado'],
    cb: ['Curled to just short of vertical, elbows still', 'Hasta poco antes de la vertical, codos quietos'] },

  cablecurl: { env: 'floor', grip: 'cable',
    base: { x: 100, y: 106, torso: 3, hip: 180, kne: 2, pulleyY: 182, pulleyX: 172 },
    a: { sho: 182, elb: 6 }, b: { sho: 182, elb: 128 },
    ca: ['Arms straight, the stack already off its rest', 'Brazos rectos, con el peso ya despegado'],
    cb: ['Curled and squeezed, tension never released', 'Arriba y apretado, sin soltar la tensión'] },

  conc: { env: 'seat', grip: 'db',
    base: { x: 100, y: 132, torso: 40, hip: 106, kne: 62 },
    a: { sho: 186, elb: 6 }, b: { sho: 186, elb: 126 },
    ca: ['Upper arm braced against the inside of the thigh', 'Brazo apoyado contra la cara interna del muslo'],
    cb: ['Curled to the peak, little finger turned in', 'Arriba del todo, meñique girado hacia dentro'] },

  skull: { env: 'flat', grip: 'ez',
    base: { x: 108, y: 112, lean: -90, torso: 0, hip: 178, kne: 40 },
    a: { sho: 86, elb: 4 }, b: { sho: 76, elb: 112 },
    ca: ['Arms vertical, upper arms angled slightly back', 'Brazos verticales, con los codos algo hacia atrás'],
    cb: ['Bent only at the elbow, bar towards the forehead', 'Solo flexiona el codo, barra hacia la frente'] },

  ohtri: { env: 'floor', grip: 'rope',
    base: { x: 100, y: 116, torso: 20, hip: 180, kne: 3, pulleyY: 172, pulleyX: 26 },
    a: { sho: 40, elb: 112 }, b: { sho: 34, elb: 8 },
    ca: ['Rope behind your head, elbows forward and high', 'Cuerda detrás de la cabeza, codos adelante y altos'],
    cb: ['Extended straight overhead, rope spread apart', 'Extensión completa arriba, cuerda separada'] },

  dips: { env: 'benchside', grip: 'none',
    base: { x: 118, y: 140, torso: -8, hip: 96, kne: 78 },
    a: { sho: 208, elb: 4 }, b: { sho: 202, elb: 84 },
    ca: ['Arms straight, hands on the bench behind you', 'Brazos rectos, manos en el banco por detrás'],
    cb: ['Elbows to about 90°, torso close to the bench', 'Codos a unos 90°, torso pegado al banco'] },

  squat: { env: 'floor', grip: 'db',
    base: { x: 100, torso: 8, sho: 150, elb: 78 },
    a: { y: 102, hip: 178, kne: 6 }, b: { y: 128, hip: 142, kne: 84 },
    ca: ['Standing tall, one dumbbell held at the chest', 'De pie erguido, una mancuerna contra el pecho'],
    cb: ['Sat down between the hips, thighs past parallel', 'Sentado entre las caderas, muslos bajo la paralela'] },

  hack: { env: 'sled', grip: 'none',
    base: { x: 118, y: 126, lean: -58, torso: 0, sho: 150, elb: 40 },
    a: { hip: 162, kne: -18 }, b: { hip: 124, kne: -84 },
    ca: ['Knees almost extended, back flat on the pad', 'Rodillas casi estiradas, espalda plana en el respaldo'],
    cb: ['About 90° of knee bend, hips still on the pad', 'Unos 90° de rodilla, cadera pegada al respaldo'] },

  lunge: { env: 'floor', grip: 'db',
    base: { x: 96, torso: 6, sho: 179, elb: 2 },
    a: { y: 102, hip: 172, kne: 12 }, b: { y: 124, hip: 146, kne: 84 },
    ca: ['Stepped forward, front shin vertical, torso upright', 'Paso adelante, espinilla vertical, torso erguido'],
    cb: ['Back knee just above the floor, drive up through the front heel', 'Rodilla de atrás rozando el suelo, empuja con el talón delantero'] },

  hipthrust: { env: 'benchside', grip: 'bar',
    base: { x: 112, y: 138, torso: 68, sho: 150, elb: 40, kne: 96 },
    a: { hip: 128 }, b: { hip: 92 },
    ca: ['Hips down, upper back on the bench, shins vertical at the top', 'Cadera abajo, espalda alta en el banco, espinillas verticales arriba'],
    cb: ['Locked out in a straight line from knee to shoulder, glutes squeezed', 'Bloqueado en línea recta de rodilla a hombro, glúteos apretados'] },

  seatedcalf: { env: 'seat', grip: 'pad',
    base: { x: 104, y: 128, torso: -4, sho: 168, elb: 30, hip: 96 },
    a: { kne: 74 }, b: { kne: 96 },
    ca: ['Heels dropped below the platform, full stretch', 'Talones por debajo de la plataforma, estiramiento completo'],
    cb: ['Up on the toes, squeezed for a second', 'Arriba de puntillas, apretado un segundo'] }
};

/* ---------------- the block that goes in the app ---------------- */
function exVisual(id) {
  const sp = EX_POSE[id], mm = EX_MUS[id];
  if (!sp || !mm) return '';
  sp.id = id;                    /* so the figure knows which muscle to light up */
  const es = LANG === 'es';
  const cap = c => es ? c[1] : c[0];
  const views = ['front', 'back'].filter(v =>
    mm.p.concat(mm.s).some(k => MUSC[k] && MUSC[k].v === v));

  return '<div class="howto">' +
    '<div class="howto-t">' + (es ? 'Cómo se hace' : 'How it looks') + '</div>' +
    '<div class="frames">' + exFrame(id, 'a') + exFrame(id, 'b') + '</div>' +
    '<div class="tiny" style="margin-top:8px">' + (es
      ? 'El dibujo es un esquema. Toca <b>&#128247;</b> para poner <b>tu propia foto</b> en cualquiera de los dos — la máquina de tu gimnasio, un fotograma de un vídeo, o tú en esa posición. Se guarda solo en este ordenador, igual que tus fotos de progreso.'
      : 'The drawing is a diagram. Tap <b>&#128247;</b> to put <b>your own photo</b> in either slot — the machine at your gym, a frame from a video, or you in that position. It is stored only on this computer, like your progress photos.') + '</div>' +
    '<div class="howto-t" style="margin-top:14px">' + (es ? 'Qué trabajas' : 'What you are working') + '</div>' +
    '<div class="frames">' +
      views.map(v => '<figure>' +
        '<div class="fr-n">' + (es ? (v === 'front' ? 'DE FRENTE' : 'DE ESPALDA') : (v === 'front' ? 'FRONT' : 'BACK')) + '</div>' +
        bodyMap(v, mm.p, mm.s) + '</figure>').join('') +
    '</div>' +
    '<div class="mlegend">' +
      mm.p.map(k => '<span class="mtag p">' + esc(muscName(k)) + '</span>').join('') +
      mm.s.map(k => '<span class="mtag s">' + esc(muscName(k)) + '</span>').join('') +
    '</div>' +
    '<div class="tiny" style="margin-top:8px">' +
      (es ? '<b style="color:var(--acc)">Verde</b> = músculo principal · <b style="color:var(--up)">azul</b> = ayuda. Los dibujos son un esquema, no una foto: sirven para ver la posición y el recorrido.'
          : '<b style="color:var(--acc)">Green</b> = prime mover · <b style="color:var(--up)">blue</b> = assisting. The figures are a diagram, not a photo: they are there to show the position and the path.') +
    '</div>' +
  '</div>';
}
