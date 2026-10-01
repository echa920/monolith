/* MONOLITH — THE BESTIARY
   -----------------------------------------------------------------------
   Every creature in the world, drawn. Ten silhouette families, each one a
   function of a handful of parameters, so forty creatures cost ten drawings
   instead of forty — and they all look like they come from the same world.

   Rules the whole file keeps:
   · one 100x100 box, feet on the ground line at y=93. A wolf and a golem
     stand on the same floor, so their sizes actually mean something.
   · dark fill, bright type-coloured outline, glowing eyes. That silhouette
     reads at 44px on a map row and at 150px in the middle of a battle,
     which is why there is only one version of each creature.
   · no SVG filters. Phones render them slowly and inconsistently, and this
     app has to work on a phone first.
   ----------------------------------------------------------------------- */

const GND = 93;                      /* the ground line every creature stands on */

function bx(n) { return (+n).toFixed(1); }
function bHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619 & 0x7fffffff; return h; }
/* a deterministic 0..1 stream, so a creature is always exactly itself */
function bRnd(seed) { let s = (seed || 1) % 2147483647 || 1; return function () { s = s * 48271 % 2147483647; return s / 2147483647; }; }

/* the two ways anything in here is painted */
function bSkin(c, op) { return 'fill="' + c + '" fill-opacity="' + (op || .20) + '" stroke="' + c + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"'; }
function bHard(c) { return 'fill="#0B0F15" fill-opacity=".9" stroke="' + c + '" stroke-width="1.7" stroke-linejoin="round"'; }

/* an eye with a pupil. The pupil is what makes it feel like something alive
   is looking back, rather than two lamps. */
function bEye(x, y, r, c) {
  return '<circle cx="' + bx(x) + '" cy="' + bx(y) + '" r="' + bx(r * 2.3) + '" fill="' + c + '" fill-opacity=".16"/>' +
    '<circle cx="' + bx(x) + '" cy="' + bx(y) + '" r="' + bx(r) + '" fill="#FFF7DC"/>' +
    '<circle cx="' + bx(x) + '" cy="' + bx(y + r * .1) + '" r="' + bx(r * .46) + '" fill="#0A0D12"/>';
}
function bEyes(cx, y, gap, r, c, n) {
  if (n === 0) return '';
  if (n === 1) return bEye(cx, y, r, c);
  return bEye(cx - gap / 2, y, r, c) + bEye(cx + gap / 2, y, r, c);
}
/* a mouth of teeth, for the things that have one */
function bFangs(cx, y, w, n, c) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = cx - w / 2 + w / (n - 1) * i, dir = i % 2 ? 1 : -1;
    s += '<path d="M' + bx(x - 1.6) + ' ' + bx(y) + ' L' + bx(x) + ' ' + bx(y + 4 * dir + (dir < 0 ? 0 : 0)) + ' L' + bx(x + 1.6) + ' ' + bx(y) + ' Z" fill="#FFF7DC" stroke="' + c + '" stroke-width=".7"/>';
  }
  return s;
}

/* ---------------- 1. BLOB — a mass that oozes rather than stands ---------------- */
function famBlob(c, p, rnd) {
  const h = p.h || 46, w = (p.w || 58) / 2, top = GND - h, cx = 50, n = p.lumps || 4;
  let d = 'M' + bx(cx - w) + ' ' + GND +
    ' C' + bx(cx - w - 4) + ' ' + bx(top + h * .4) + ' ' + bx(cx - w + 2) + ' ' + bx(top + 5) + ' ' + bx(cx - w + 9) + ' ' + bx(top + 4);
  const span = (w * 2 - 18) / n;
  for (let i = 0; i < n; i++) {
    const x0 = cx - w + 9 + span * i, x1 = x0 + span;
    d += ' Q' + bx((x0 + x1) / 2) + ' ' + bx(top - 3 - rnd() * 8) + ' ' + bx(x1) + ' ' + bx(top + 3 + rnd() * 5);
  }
  d += ' C' + bx(cx + w - 2) + ' ' + bx(top + 6) + ' ' + bx(cx + w + 4) + ' ' + bx(top + h * .45) + ' ' + bx(cx + w) + ' ' + GND + ' Z';
  let s = '<path d="' + d + '" ' + bSkin(c, p.op) + '/>';
  /* drips, so it reads as something molten rather than a rock */
  if (p.drip) for (let i = 0; i < 3; i++) {
    const x = cx - w + 10 + rnd() * (w * 2 - 20), y = GND - 2 - rnd() * 8;
    s += '<path d="M' + bx(x) + ' ' + bx(y) + ' q2.6 5 0 9 q-2.6-4 0-9 Z" fill="' + c + '" fill-opacity=".5"/>';
  }
  if (p.core) s += '<ellipse cx="' + cx + '" cy="' + bx(GND - h * .4) + '" rx="' + bx(w * .36) + '" ry="' + bx(h * .22) + '" fill="' + c + '" fill-opacity=".5"/>';
  s += bEyes(cx, top + h * .30, p.gap || 17, p.er || 3.4, c, p.eyes == null ? 2 : p.eyes);
  if (p.fangs) s += bFangs(cx, top + h * .52, 18, 5, c);
  return s;
}

/* ---------------- 2. ROCK — a boulder that got up and started walking ------- */
function famRock(c, p, rnd) {
  const h = p.h || 48, w = (p.w || 52) / 2, cx = 50, top = GND - h;
  const cy = (top + GND) / 2, ry = h / 2;
  /* an irregular polygon around an ellipse, flattened wherever it meets the
     floor, so the thing sits on the ground instead of balancing on a point */
  const n = 9, pts = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n, k = 0.8 + rnd() * 0.28;
    const x = cx + Math.cos(a) * w * k;
    const y = Math.min(GND, cy + Math.sin(a) * ry * k);
    pts.push([x, y]);
  }
  const sk = bSkin(c, p.op);
  let s = '<path d="M' + pts.map(q => bx(q[0]) + ' ' + bx(q[1])).join(' L') + ' Z" ' + sk + '/>';
  /* facets: lines from a vertex to the middle. A rock with no facets is a blob. */
  for (let i = 0; i < n; i += 2) {
    s += '<line x1="' + bx(pts[i][0]) + '" y1="' + bx(pts[i][1]) + '" x2="' + bx(cx + (rnd() - .5) * w * .4) +
      '" y2="' + bx(cy + (rnd() - .5) * ry * .5) + '" stroke="' + c + '" stroke-width="1.1" stroke-opacity=".5"/>';
  }
  /* two stubby arms, which is the whole difference between a rock and a
     creature made of rock */
  [-1, 1].forEach(function (sd) {
    const ay = cy + ry * .34;
    s += '<path d="M' + bx(cx + sd * w * .8) + ' ' + bx(ay - 5) + ' l' + bx(sd * 12) + ' 2 l' + bx(-sd * 1) + ' 13 l' + bx(-sd * 11) + ' -3 Z" ' + bSkin(c, (p.op || .2) + .1) + '/>';
  });
  /* crystal shards growing out of the shoulders */
  const sh = p.shards || 0;
  for (let i = 0; i < sh; i++) {
    const t = sh === 1 ? .5 : i / (sh - 1);
    const x = cx - w * .75 + w * 1.5 * t, len = 11 + rnd() * 13;
    const base = cy - ry * .72 + Math.abs(t - .5) * ry * .8;
    s += '<path d="M' + bx(x - 3.4) + ' ' + bx(base + 3) + ' L' + bx(x + (rnd() - .5) * 6) + ' ' + bx(base - len) +
      ' L' + bx(x + 3.4) + ' ' + bx(base + 3) + ' Z" fill="' + c + '" fill-opacity=".42" stroke="' + c + '" stroke-width="1.5" stroke-linejoin="round"/>';
  }
  s += bEyes(cx, cy - ry * .25, p.gap || 15, p.er || 3.2, c, p.eyes == null ? 2 : p.eyes);
  if (p.fangs) s += bFangs(cx, cy + ry * .3, 17, 5, c);
  return s;
}

/* ---------------- 3. WORM — a segmented body rising out of the ground ---------------- */
function famWorm(c, p, rnd) {
  const h = p.h || 58, seg = p.seg || 6, cx = 50;
  let s = '', x = 30, y = GND - 2, r = p.r || 11;
  for (let i = 0; i < seg; i++) {
    const t = i / (seg - 1);
    x = 30 + t * 30 + Math.sin(t * 3.1) * 7;
    y = GND - 2 - t * h;
    const rr = r * (1 - t * 0.35);
    s += '<ellipse cx="' + bx(x) + '" cy="' + bx(y) + '" rx="' + bx(rr) + '" ry="' + bx(rr * .82) + '" ' + bSkin(c, p.op) + '/>';
  }
  /* head on the last segment: mandibles and eyes */
  const hr = r * .72;
  s += '<ellipse cx="' + bx(x) + '" cy="' + bx(y - hr * .6) + '" rx="' + bx(hr * 1.15) + '" ry="' + bx(hr) + '" ' + bSkin(c, (p.op || .2) + .12) + '/>';
  s += '<path d="M' + bx(x - hr) + ' ' + bx(y - hr * .3) + ' q-6 4 -3 10" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M' + bx(x + hr) + ' ' + bx(y - hr * .3) + ' q6 4 3 10" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/>';
  s += bEyes(x, y - hr * .8, hr * .9, 2.6, c, p.eyes == null ? 2 : p.eyes);
  /* the earth it came up through */
  s += '<path d="M18 ' + GND + ' q12 -7 24 0 Z" fill="' + c + '" fill-opacity=".22"/>';
  return s;
}

/* ---------------- 4. QUAD — four legs, a spine, and a head out in front ----- */
function famQuad(c, p, rnd) {
  const bh = p.bh || 30, bw = (p.bw || 56) / 2, cx = 50 - 4;
  const by = GND - bh;                      /* belly line */
  const back = by - (p.th || 18);           /* top of the back */
  const sk = bSkin(c, p.op), leg = p.leg || 7;
  let s = '';
  /* legs first, so the body covers where they join */
  [-bw * .74, -bw * .3, bw * .3, bw * .76].forEach(function (dx, i) {
    const x = cx + dx, bend = i < 2 ? -3 : 3;
    s += '<path d="M' + bx(x) + ' ' + bx(by - 1) + ' L' + bx(x + bend) + ' ' + bx((by + GND) / 2) + ' L' + bx(x) + ' ' + GND +
      '" fill="none" stroke="' + c + '" stroke-width="' + bx(leg) + '" stroke-linecap="round" stroke-opacity=".85"/>';
    s += '<path d="M' + bx(x - 4) + ' ' + GND + ' l8 0" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/>';
  });
  /* body: deep chest, arched back, tucked waist */
  s += '<path d="M' + bx(cx - bw) + ' ' + bx(by - 6) +
    ' C' + bx(cx - bw * .7) + ' ' + bx(back - 5) + ' ' + bx(cx + bw * .55) + ' ' + bx(back - 2) + ' ' + bx(cx + bw) + ' ' + bx(back + 4) +
    ' C' + bx(cx + bw + 3) + ' ' + bx(by - 2) + ' ' + bx(cx + bw * .5) + ' ' + bx(by + 5) + ' ' + bx(cx) + ' ' + bx(by + 4) +
    ' C' + bx(cx - bw * .6) + ' ' + bx(by + 4) + ' ' + bx(cx - bw) + ' ' + bx(by + 1) + ' ' + bx(cx - bw) + ' ' + bx(by - 6) + ' Z" ' + sk + '/>';
  /* neck and head, pushed forward and down like something that hunts */
  const nx = cx + bw + 2, ny = back + 5;
  const hx = nx + 13, hy = ny + 2;
  s += '<path d="M' + bx(nx - 4) + ' ' + bx(ny - 3) + ' L' + bx(hx - 4) + ' ' + bx(hy - 8) + ' L' + bx(hx - 2) + ' ' + bx(hy + 7) + ' L' + bx(nx - 3) + ' ' + bx(ny + 7) + ' Z" ' + sk + '/>';
  s += '<path d="M' + bx(hx - 7) + ' ' + bx(hy - 8) + ' L' + bx(hx + 7) + ' ' + bx(hy - 6) + ' L' + bx(hx + 13) + ' ' + bx(hy + 2) +
    ' L' + bx(hx + 7) + ' ' + bx(hy + 8) + ' L' + bx(hx - 6) + ' ' + bx(hy + 8) + ' Z" ' + sk + '/>';
  s += '<path d="M' + bx(hx + 4) + ' ' + bx(hy + 4) + ' l7 -1" stroke="' + c + '" stroke-width="1.4" stroke-opacity=".8"/>';
  s += '<path d="M' + bx(hx + 2) + ' ' + bx(hy + 8) + ' l' + bx(2) + ' 4 M' + bx(hx - 2) + ' ' + bx(hy + 8) + ' l-1 4" stroke="#FFF7DC" stroke-width="1.6" stroke-linecap="round"/>';
  s += bEye(hx + 1, hy - 2, p.er || 3, c);
  /* horns, curling back over the skull */
  if (p.horns) {
    const big = p.horns > 1;
    [-1, 1].forEach(function (sd, i) {
      const ox = hx - 3 + i * 5, oy = hy - 8;
      s += '<path d="M' + bx(ox) + ' ' + bx(oy) + ' q' + (big ? '-13 -4 -14 7' : '-8 -5 -11 1') +
        '" fill="none" stroke="' + c + '" stroke-width="' + (big ? 3.6 : 2.8) + '" stroke-linecap="round"/>';
    });
  }
  /* a second head, for the one with two */
  if (p.heads === 2) {
    const sx = nx + 6, sy = ny - 13;
    s += '<path d="M' + bx(nx - 3) + ' ' + bx(ny - 4) + ' L' + bx(sx - 3) + ' ' + bx(sy) + ' L' + bx(sx + 2) + ' ' + bx(sy + 3) + ' L' + bx(nx + 2) + ' ' + bx(ny) + ' Z" ' + sk + '/>' +
      '<path d="M' + bx(sx - 5) + ' ' + bx(sy - 2) + ' L' + bx(sx + 8) + ' ' + bx(sy - 4) + ' L' + bx(sx + 11) + ' ' + bx(sy + 3) + ' L' + bx(sx - 4) + ' ' + bx(sy + 5) + ' Z" ' + sk + '/>' +
      bEye(sx + 4, sy, 2.5, c);
  }
  /* spines down the back */
  if (p.spikes) for (let i = 0; i < p.spikes; i++) {
    const t = i / (p.spikes - 1), x = cx - bw * .65 + bw * 1.3 * t;
    const y = back - 2 + Math.abs(t - .5) * 6;
    s += '<path d="M' + bx(x - 3.2) + ' ' + bx(y + 3) + ' L' + bx(x) + ' ' + bx(y - 9) + ' L' + bx(x + 3.2) + ' ' + bx(y + 3) + ' Z" fill="' + c + '" fill-opacity=".55" stroke="' + c + '" stroke-width="1.1"/>';
  }
  s += '<path d="M' + bx(cx - bw) + ' ' + bx(by - 7) + ' q-13 ' + (p.tailUp ? '-12' : '3') + ' -19 ' + (p.tailUp ? '-16' : '-4') +
    '" fill="none" stroke="' + c + '" stroke-width="3.6" stroke-linecap="round"/>';
  return s;
}

/* ---------------- 5. PLANT — rooted, branching, no face to speak to --------- */
function famPlant(c, p, rnd) {
  const h = p.h || 62, cx = 50, top = GND - h, w = p.w || 10;
  const sk = bSkin(c, p.op);
  /* trunk */
  let s = '<path d="M' + bx(cx - w) + ' ' + GND + ' Q' + bx(cx - w * .45) + ' ' + bx(GND - h * .5) + ' ' + bx(cx - w * .55) + ' ' + bx(top + 10) +
    ' L' + bx(cx + w * .55) + ' ' + bx(top + 10) + ' Q' + bx(cx + w * .45) + ' ' + bx(GND - h * .5) + ' ' + bx(cx + w) + ' ' + GND + ' Z" ' + sk + '/>';
  /* bark */
  for (let i = 0; i < 3; i++) s += '<path d="M' + bx(cx - w * .4 + i * w * .4) + ' ' + bx(GND - 4) + ' L' + bx(cx - w * .3 + i * w * .35) + ' ' + bx(top + 14) +
    '" fill="none" stroke="' + c + '" stroke-width="1" stroke-opacity=".45"/>';
  /* branches: alternating, shortening as they climb, each with a fork */
  const n = p.arms || 5;
  for (let i = 0; i < n; i++) {
    const t = i / n, side = i % 2 ? 1 : -1;
    const y = GND - 12 - t * (h - 22), len = (24 - t * 9) * (0.8 + rnd() * .4);
    const ex = cx + side * len, ey = y - len * .55;
    s += '<path d="M' + bx(cx + side * 3) + ' ' + bx(y) + ' q' + bx(side * len * .6) + ' -5 ' + bx(side * len) + ' ' + bx(-len * .55) +
      '" fill="none" stroke="' + c + '" stroke-width="' + bx(3.8 - t * 1.6) + '" stroke-linecap="round"/>';
    s += '<path d="M' + bx(ex) + ' ' + bx(ey) + ' l' + bx(side * 6) + ' -7 M' + bx(ex) + ' ' + bx(ey) + ' l' + bx(side * 7) + ' 3" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>';
    if (p.thorns) for (let k = 1; k <= 2; k++) {
      const tx = cx + side * len * (k / 2.6), ty = y - len * .24 * k;
      s += '<path d="M' + bx(tx) + ' ' + bx(ty) + ' l' + bx(side * 5) + ' -5" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>';
    }
  }
  /* the bulb that passes for a head, with its eyes inside it */
  if (p.bulb) {
    const by = top + 8;                   /* bottom of the bulb */
    s += '<path d="M' + bx(cx - 15) + ' ' + bx(by) + ' q-2 -17 15 -17 q17 0 15 17 q-7 8 -15 8 q-8 0 -15 -8 Z" ' + bSkin(c, (p.op || .2) + .08) + '/>';
    s += bEyes(cx, by - 8, p.gap || 14, p.er || 3.4, c, p.eyes == null ? 2 : p.eyes);
    if (p.fangs) s += bFangs(cx, by + 1, 16, 5, c);
  } else {
    s += bEyes(cx, top + 18, p.gap || 11, p.er || 3, c, p.eyes == null ? 2 : p.eyes);
  }
  s += '<path d="M' + bx(cx - 17) + ' ' + GND + ' q9 -6 17 -4 q8 -2 17 4" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-opacity=".6"/>';
  return s;
}

/* ---------------- 6. WRAITH — hovering, hooded, torn off at the bottom ---------------- */
function famWraith(c, p, rnd) {
  const h = p.h || 62, w = (p.w || 40) / 2, cx = 50;
  const top = GND - h, hem = GND - (p.float == null ? 6 : p.float);
  const sk = bSkin(c, p.op);
  let s = '';
  /* the cloak: a hood tapering into a torn hem */
  let d = 'M' + bx(cx) + ' ' + bx(top) +
    ' C' + bx(cx - w * .9) + ' ' + bx(top + 6) + ' ' + bx(cx - w) + ' ' + bx(top + h * .5) + ' ' + bx(cx - w * .95) + ' ' + bx(hem);
  const tears = 5;
  for (let i = 0; i < tears; i++) {
    const x0 = cx - w * .95 + (w * 1.9 / tears) * i, x1 = x0 + w * 1.9 / tears;
    d += ' L' + bx((x0 + x1) / 2) + ' ' + bx(hem + 7 + rnd() * 5) + ' L' + bx(x1) + ' ' + bx(hem - rnd() * 4);
  }
  d += ' C' + bx(cx + w) + ' ' + bx(top + h * .5) + ' ' + bx(cx + w * .9) + ' ' + bx(top + 6) + ' ' + bx(cx) + ' ' + bx(top) + ' Z';
  s += '<path d="' + d + '" ' + sk + '/>';
  /* the dark under the hood, then whatever is looking out of it */
  s += '<path d="M' + bx(cx - w * .62) + ' ' + bx(top + 13) + ' q' + bx(w * .62) + ' -11 ' + bx(w * 1.24) + ' 0 q-' + bx(w * .4) + ' 14 -' + bx(w * 1.24) + ' 0 Z" fill="#070A0E" fill-opacity=".92"/>';
  const ne = p.eyes == null ? 2 : p.eyes;
  if (ne > 2) {   /* the Sleepless: eyes it cannot close */
    for (let i = 0; i < ne; i++) s += bEye(cx - w * .4 + (w * .8 / (ne - 1)) * i, top + 9 + (i % 2 ? 5 : 0), 2.3, c);
  } else s += bEyes(cx, top + 12, p.gap || 13, p.er || 3, c, ne);
  /* a hole where a chest should be */
  if (p.hollow) s += '<ellipse cx="' + cx + '" cy="' + bx(top + h * .52) + '" rx="8" ry="10" fill="#070A0E" fill-opacity=".9" stroke="' + c + '" stroke-width="1.6"/>';
  if (p.horns) s += '<path d="M' + bx(cx - w * .45) + ' ' + bx(top + 8) + ' q-11 -6 -13 -17 q7 4 11 9" fill="' + c + '" fill-opacity=".4" stroke="' + c + '" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<path d="M' + bx(cx + w * .45) + ' ' + bx(top + 8) + ' q11 -6 13 -17 q-7 4 -11 9" fill="' + c + '" fill-opacity=".4" stroke="' + c + '" stroke-width="2.2" stroke-linejoin="round"/>';
  /* sleeves, if it has anything to reach with */
  if (p.arms) s += '<path d="M' + bx(cx - w * .8) + ' ' + bx(top + h * .4) + ' q-12 8 -10 18" fill="none" stroke="' + c + '" stroke-width="4.5" stroke-linecap="round" stroke-opacity=".8"/>' +
    '<path d="M' + bx(cx + w * .8) + ' ' + bx(top + h * .4) + ' q12 8 10 18" fill="none" stroke="' + c + '" stroke-width="4.5" stroke-linecap="round" stroke-opacity=".8"/>';
  if (p.hold === 'hourglass') {
    const gx = cx + w + 6, gy = top + h * .62;
    s += '<path d="M' + bx(gx - 6) + ' ' + bx(gy - 9) + ' L' + bx(gx + 6) + ' ' + bx(gy - 9) + ' L' + bx(gx) + ' ' + bx(gy) +
      ' L' + bx(gx + 6) + ' ' + bx(gy + 9) + ' L' + bx(gx - 6) + ' ' + bx(gy + 9) + ' L' + bx(gx) + ' ' + bx(gy) + ' Z" ' + bHard(c) + '/>';
  }
  /* it hovers, so it gets a shadow and not feet */
  s += '<ellipse cx="' + cx + '" cy="' + bx(GND + 2) + '" rx="' + bx(w * .8) + '" ry="3" fill="' + c + '" fill-opacity=".18"/>';
  return s;
}

/* ---------------- 7. HUMAN — armour, pauldrons, and something in its hands ------- */
function famHuman(c, p, rnd) {
  const h = p.h || 70, cx = 50 + (p.dx || 0);
  const top = GND - h;                       /* crown of the helmet */
  const headR = h * .105;
  const neck = top + headR * 2.2, hipY = GND - h * .42, shoY = neck + h * .06;
  const sk = bSkin(c, p.op);
  let s = '';
  if (p.cape) s += '<path d="M' + bx(cx - 13) + ' ' + bx(shoY + 2) + ' q-12 ' + bx(h * .45) + ' -6 ' + bx(GND - shoY - 4) +
    ' l' + bx(38) + ' 0 q6 -' + bx(h * .4) + ' -6 -' + bx(h * .45) + ' Z" fill="' + c + '" fill-opacity=".14" stroke="' + c + '" stroke-width="1.4"/>';
  /* legs */
  [-1, 1].forEach(function (sd) {
    s += '<path d="M' + bx(cx + sd * 6) + ' ' + bx(hipY) + ' L' + bx(cx + sd * 8.5) + ' ' + bx((hipY + GND) / 2) + ' L' + bx(cx + sd * 7) + ' ' + GND + '" fill="none" stroke="' + c + '" stroke-width="7" stroke-linecap="round" stroke-opacity=".9"/>';
  });
  /* torso: a breastplate narrowing to the waist */
  s += '<path d="M' + bx(cx - 13) + ' ' + bx(shoY) + ' L' + bx(cx + 13) + ' ' + bx(shoY) + ' L' + bx(cx + 9) + ' ' + bx(hipY) + ' L' + bx(cx - 9) + ' ' + bx(hipY) + ' Z" ' + sk + '/>';
  s += '<path d="M' + bx(cx - 9) + ' ' + bx(shoY + 7) + ' L' + bx(cx) + ' ' + bx(shoY + 13) + ' L' + bx(cx + 9) + ' ' + bx(shoY + 7) + '" fill="none" stroke="' + c + '" stroke-width="1.5" stroke-opacity=".7"/>';
  /* pauldrons — the thing that makes a silhouette read as armoured */
  [-1, 1].forEach(function (sd) {
    s += '<path d="M' + bx(cx + sd * 11) + ' ' + bx(shoY - 2) + ' q' + bx(sd * 10) + ' -1 ' + bx(sd * 9) + ' 8 q' + bx(-sd * 5) + ' 3 ' + bx(-sd * 10) + ' 1 Z" ' + sk + '/>';
  });
  /* arms */
  s += '<path d="M' + bx(cx - 15) + ' ' + bx(shoY + 6) + ' q-7 ' + bx(h * .14) + ' -4 ' + bx(h * .26) + '" fill="none" stroke="' + c + '" stroke-width="5" stroke-linecap="round" stroke-opacity=".9"/>';
  s += '<path d="M' + bx(cx + 15) + ' ' + bx(shoY + 6) + ' q8 ' + bx(h * .1) + ' 5 ' + bx(h * .24) + '" fill="none" stroke="' + c + '" stroke-width="5" stroke-linecap="round" stroke-opacity=".9"/>';
  /* helmet */
  s += '<path d="M' + bx(cx - headR) + ' ' + bx(neck) + ' L' + bx(cx - headR) + ' ' + bx(top + headR * .7) +
    ' Q' + bx(cx) + ' ' + bx(top - 1) + ' ' + bx(cx + headR) + ' ' + bx(top + headR * .7) + ' L' + bx(cx + headR) + ' ' + bx(neck) + ' Z" ' + sk + '/>';
  /* the visor slit. With no eyes behind it you get the Faceless Miner. */
  s += '<rect x="' + bx(cx - headR * .8) + '" y="' + bx(top + headR * 1.0) + '" width="' + bx(headR * 1.6) + '" height="' + bx(headR * .5) + '" fill="#070A0E" fill-opacity=".95"/>';
  s += bEyes(cx, top + headR * 1.25, headR * .9, 2.2, c, p.eyes == null ? 2 : p.eyes);
  if (p.crown) {
    s += '<path d="M' + bx(cx - headR - 1) + ' ' + bx(top + 1) + ' l0 -6 l' + bx(headR * .7) + ' 4 l' + bx(headR * .6) + ' -8 l' + bx(headR * .6) + ' 8 l' + bx(headR * .7) + ' -4 l0 6 Z" fill="' + c + '" fill-opacity=".5" stroke="' + c + '" stroke-width="1.4"/>';
  }
  if (p.shards) for (let i = 0; i < p.shards; i++) {
    const sd = i % 2 ? 1 : -1, y = shoY + 2 + i * 3;
    s += '<path d="M' + bx(cx + sd * 12) + ' ' + bx(y) + ' L' + bx(cx + sd * (22 + rnd() * 8)) + ' ' + bx(y - 10 - rnd() * 8) + ' L' + bx(cx + sd * 14) + ' ' + bx(y + 4) + ' Z" fill="' + c + '" fill-opacity=".4" stroke="' + c + '" stroke-width="1.3"/>';
  }
  /* What it is carrying does most of the characterisation, so it is held out
     clear of the shoulder — drawn at cx+18 it landed across the helmet. */
  const wx = cx + 23, wy = shoY + h * .3;
  switch (p.wep) {
    case 'hammer':
      s += '<line x1="' + bx(wx) + '" y1="' + bx(wy + 10) + '" x2="' + bx(wx + 5) + '" y2="' + bx(wy - 22) + '" stroke="' + c + '" stroke-width="3.2" stroke-linecap="round"/>' +
        '<rect x="' + bx(wx - 3) + '" y="' + bx(wy - 32) + '" width="18" height="12" rx="2.5" ' + bSkin(c, .34) + '/>' +
        '<line x1="' + bx(wx + 1) + '" y1="' + bx(wy - 30) + '" x2="' + bx(wx + 1) + '" y2="' + bx(wy - 22) + '" stroke="' + c + '" stroke-width="1.2" stroke-opacity=".6"/>';
      break;
    case 'sword':
      s += '<line x1="' + bx(wx) + '" y1="' + bx(wy + 6) + '" x2="' + bx(wx + 4) + '" y2="' + bx(wy - 34) + '" stroke="' + c + '" stroke-width="3.4" stroke-linecap="round"/>' +
        '<line x1="' + bx(wx - 5) + '" y1="' + bx(wy - 2) + '" x2="' + bx(wx + 8) + '" y2="' + bx(wy - 4) + '" stroke="' + c + '" stroke-width="2.6"/>';
      break;
    case 'pick':
      s += '<line x1="' + bx(wx - 2) + '" y1="' + bx(wy + 12) + '" x2="' + bx(wx + 6) + '" y2="' + bx(wy - 20) + '" stroke="' + c + '" stroke-width="3"/>' +
        '<path d="M' + bx(wx - 8) + ' ' + bx(wy - 14) + ' q14 -11 26 -2" fill="none" stroke="' + c + '" stroke-width="3.4" stroke-linecap="round"/>';
      break;
    case 'bow':
      /* the limbs curve away from the string, which is the only thing that
         makes a bow look drawn rather than like a bracket */
      s += '<path d="M' + bx(wx + 2) + ' ' + bx(wy - 26) + ' C' + bx(wx + 16) + ' ' + bx(wy - 16) + ' ' + bx(wx + 16) + ' ' + bx(wy + 6) + ' ' + bx(wx + 2) + ' ' + bx(wy + 16) +
        '" fill="none" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>' +
        '<line x1="' + bx(wx + 2) + '" y1="' + bx(wy - 26) + '" x2="' + bx(wx - 5) + '" y2="' + bx(wy - 5) + '" stroke="#FFF7DC" stroke-width="1.2" stroke-opacity=".8"/>' +
        '<line x1="' + bx(wx + 2) + '" y1="' + bx(wy + 16) + '" x2="' + bx(wx - 5) + '" y2="' + bx(wy - 5) + '" stroke="#FFF7DC" stroke-width="1.2" stroke-opacity=".8"/>' +
        '<line x1="' + bx(wx - 9) + '" y1="' + bx(wy - 5) + '" x2="' + bx(wx + 13) + '" y2="' + bx(wy - 5) + '" stroke="#FFF7DC" stroke-width="1.6"/>' +
        '<path d="M' + bx(wx + 13) + ' ' + bx(wy - 5) + ' l6 0" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/>';
      break;
    case 'halberd':
      s += '<line x1="' + bx(wx) + '" y1="' + bx(wy + 18) + '" x2="' + bx(wx + 5) + '" y2="' + bx(wy - 30) + '" stroke="' + c + '" stroke-width="3.2" stroke-linecap="round"/>' +
        '<path d="M' + bx(wx + 5) + ' ' + bx(wy - 30) + ' l3 -8 l3 9 Z" ' + bSkin(c, .4) + '/>' +
        '<path d="M' + bx(wx + 4) + ' ' + bx(wy - 26) + ' q13 -2 15 9 q-9 2 -14 -3 Z" ' + bSkin(c, .4) + '/>';
      break;
    case 'scythe':
      s += '<line x1="' + bx(wx - 2) + '" y1="' + bx(wy + 14) + '" x2="' + bx(wx + 6) + '" y2="' + bx(wy - 32) + '" stroke="' + c + '" stroke-width="3"/>' +
        '<path d="M' + bx(wx + 6) + ' ' + bx(wy - 32) + ' q-18 2 -22 16" fill="none" stroke="' + c + '" stroke-width="3.2" stroke-linecap="round"/>';
      break;
    case 'staff':
      s += '<line x1="' + bx(wx) + '" y1="' + bx(wy + 14) + '" x2="' + bx(wx + 4) + '" y2="' + bx(wy - 30) + '" stroke="' + c + '" stroke-width="2.8"/>' +
        '<circle cx="' + bx(wx + 4) + '" cy="' + bx(wy - 34) + '" r="5" fill="' + c + '" fill-opacity=".45" stroke="' + c + '" stroke-width="1.6"/>';
      break;
  }
  if (p.shield) s += '<path d="M' + bx(cx - 26) + ' ' + bx(shoY + 8) + ' l13 -4 l13 4 l-2 17 q-11 8 -22 0 Z" ' + bSkin(c, .3) + '/>';
  return s;
}

/* ---------------- 8. BIRD — wings wide, feet in the dust -------------------- */
function famBird(c, p, rnd) {
  const h = p.h || 56, cx = 50, bodyY = GND - h * .55;
  const sk = bSkin(c, p.op);
  let s = '';
  /* each wing is one filled shape with feather splits cut into it, so it has
     surface at 44px and detail at 150px */
  [-1, 1].forEach(function (sd) {
    const sp = p.span || 38;
    s += '<path d="M' + bx(cx + sd * 4) + ' ' + bx(bodyY - 8) +
      ' Q' + bx(cx + sd * sp * .55) + ' ' + bx(bodyY - 20) + ' ' + bx(cx + sd * sp) + ' ' + bx(bodyY - 4) +
      ' L' + bx(cx + sd * sp * .86) + ' ' + bx(bodyY + 11) +
      ' Q' + bx(cx + sd * sp * .4) + ' ' + bx(bodyY + 9) + ' ' + bx(cx + sd * 4) + ' ' + bx(bodyY + 2) + ' Z" ' + sk + '/>';
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      s += '<path d="M' + bx(cx + sd * (6 + sp * t * .35)) + ' ' + bx(bodyY - 4 + t * 4) + ' L' + bx(cx + sd * sp * (0.45 + t * .5)) + ' ' + bx(bodyY + 4 + t * 5) +
        '" fill="none" stroke="' + c + '" stroke-width="1.4" stroke-opacity=".6"/>';
    }
  });
  /* body, neck, head */
  s += '<ellipse cx="' + cx + '" cy="' + bx(bodyY + 7) + '" rx="12" ry="16" ' + sk + '/>';
  s += '<path d="M' + bx(cx - 2) + ' ' + bx(bodyY - 5) + ' q-4 -13 7 -17" fill="none" stroke="' + c + '" stroke-width="6" stroke-linecap="round" stroke-opacity=".85"/>';
  const hx = cx + 6, hy = bodyY - 24;
  s += '<circle cx="' + bx(hx) + '" cy="' + bx(hy) + '" r="7.5" ' + sk + '/>';
  s += '<path d="M' + bx(hx + 5) + ' ' + bx(hy - 2) + ' l12 5 l-11 5 Z" fill="' + c + '" fill-opacity=".55" stroke="' + c + '" stroke-width="1.4" stroke-linejoin="round"/>';
  s += '<path d="M' + bx(hx - 4) + ' ' + bx(hy - 6) + ' q5 -8 11 -4" fill="none" stroke="' + c + '" stroke-width="2" stroke-opacity=".7"/>';
  s += bEye(hx + 1, hy - 2, 2.5, c);
  /* legs and talons */
  [-1, 1].forEach(function (sd) {
    const fx2 = cx + sd * 6;
    s += '<line x1="' + bx(cx + sd * 4) + '" y1="' + bx(bodyY + 19) + '" x2="' + bx(fx2) + '" y2="' + bx(GND - 2) + '" stroke="' + c + '" stroke-width="3.2" stroke-linecap="round"/>' +
      '<path d="M' + bx(fx2 - 5) + ' ' + GND + ' l5 -2 l5 2 M' + bx(fx2) + ' ' + bx(GND - 2) + ' l0 2" fill="none" stroke="' + c + '" stroke-width="2" stroke-linecap="round"/>';
  });
  return s;
}

/* ---------------- 9. GOLEM — stacked plates, a small head, a lit core -------- */
function famGolem(c, p, rnd) {
  const h = p.h || 76, w = (p.w || 56) / 2, cx = 50, top = GND - h;
  const sk = bSkin(c, p.op);
  let s = '';
  /* legs: two pillars */
  [-1, 1].forEach(function (sd) {
    s += '<rect x="' + bx(cx + sd * 6 - (sd > 0 ? 0 : 11)) + '" y="' + bx(GND - h * .36) + '" width="11" height="' + bx(h * .36) + '" rx="3" ' + sk + '/>';
  });
  /* torso: three plates, widest at the shoulders */
  for (let i = 0; i < 3; i++) {
    const ww = w * (1 - i * 0.16), y = top + 12 + i * (h * .18);
    s += '<rect x="' + bx(cx - ww) + '" y="' + bx(y) + '" width="' + bx(ww * 2) + '" height="' + bx(h * .18 - 2) + '" rx="3" ' + sk + '/>';
  }
  /* arms: heavy, hanging past the hip */
  [-1, 1].forEach(function (sd) {
    s += '<rect x="' + bx(cx + sd * (w + 2) - (sd > 0 ? 0 : 9)) + '" y="' + bx(top + 15) + '" width="9" height="' + bx(h * .46) + '" rx="4" ' + sk + '/>' +
      '<rect x="' + bx(cx + sd * (w + 1) - (sd > 0 ? 1 : 11)) + '" y="' + bx(top + 15 + h * .46) + '" width="13" height="10" rx="3" ' + bSkin(c, .3) + '/>';
  });
  /* the small head that makes the body look enormous */
  s += '<rect x="' + bx(cx - 8) + '" y="' + bx(top) + '" width="16" height="13" rx="3" ' + sk + '/>';
  s += bEyes(cx, top + 6.5, 8, 2.3, c, p.eyes == null ? 2 : p.eyes);
  /* core */
  const cy2 = top + 12 + h * .18 + h * .07;
  s += '<circle cx="' + cx + '" cy="' + bx(cy2) + '" r="' + bx(p.core || 6) + '" fill="' + (p.fire ? '#FF6B2C' : c) + '" fill-opacity=".55" stroke="' + (p.fire ? '#FFB36B' : c) + '" stroke-width="1.8"/>';
  if (p.fire) for (let i = 0; i < 3; i++) s += '<path d="M' + bx(cx - 6 + i * 6) + ' ' + bx(cy2 - 8) + ' q2 -7 0 -11 q4 4 3 11 Z" fill="#FF8A3D" fill-opacity=".6"/>';
  /* an anvil horn, for the one creature that is an anvil */
  if (p.anvil) s += '<path d="M' + bx(cx - w - 14) + ' ' + bx(top + 16) + ' l14 -4 l0 13 l-14 -3 Z" ' + bSkin(c, .35) + '/>';
  if (p.horns) s += '<path d="M' + bx(cx - 8) + ' ' + bx(top + 1) + ' l-8 -9 l5 10 Z M' + bx(cx + 8) + ' ' + bx(top + 1) + ' l8 -9 l-5 10 Z" fill="' + c + '" fill-opacity=".5" stroke="' + c + '" stroke-width="1.3"/>';
  return s;
}

/* ---------------- 10. SKELETON — ribs, a skull, nothing behind the eyes ------ */
function famSkel(c, p, rnd) {
  const h = p.h || 70, cx = 50, top = GND - h;
  const sk = bSkin(c, p.op);
  const headR = h * .11, spine = top + headR * 2.3, hipY = GND - h * .38;
  let s = '';
  [-1, 1].forEach(function (sd) {
    s += '<path d="M' + bx(cx + sd * 5) + ' ' + bx(hipY) + ' L' + bx(cx + sd * 8) + ' ' + bx((hipY + GND) / 2) + ' L' + bx(cx + sd * 6) + ' ' + GND + '" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round"/>';
  });
  s += '<line x1="' + cx + '" y1="' + bx(spine) + '" x2="' + cx + '" y2="' + bx(hipY) + '" stroke="' + c + '" stroke-width="3"/>';
  /* ribs */
  for (let i = 0; i < 4; i++) {
    const y = spine + 6 + i * ((hipY - spine - 8) / 4);
    const ww = 13 - i * 1.4;
    s += '<path d="M' + cx + ' ' + bx(y) + ' q-' + bx(ww) + ' 2 -' + bx(ww * .8) + ' 7 M' + cx + ' ' + bx(y) + ' q' + bx(ww) + ' 2 ' + bx(ww * .8) + ' 7" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/>';
  }
  s += '<path d="M' + bx(cx - 14) + ' ' + bx(hipY) + ' l28 0 l-4 8 l-20 0 Z" ' + sk + '/>';
  /* collarbones and arms */
  s += '<line x1="' + bx(cx - 13) + '" y1="' + bx(spine + 3) + '" x2="' + bx(cx + 13) + '" y2="' + bx(spine + 3) + '" stroke="' + c + '" stroke-width="2.6"/>';
  [-1, 1].forEach(function (sd) {
    s += '<path d="M' + bx(cx + sd * 13) + ' ' + bx(spine + 3) + ' q' + bx(sd * 5) + ' ' + bx(h * .16) + ' ' + bx(sd * 2) + ' ' + bx(h * .3) + '" fill="none" stroke="' + c + '" stroke-width="3.4" stroke-linecap="round"/>';
  });
  /* skull */
  s += '<path d="M' + bx(cx - headR) + ' ' + bx(top + headR) + ' q0 -' + bx(headR * 1.1) + ' ' + bx(headR) + ' -' + bx(headR * 1.1) +
    ' q' + bx(headR) + ' 0 ' + bx(headR) + ' ' + bx(headR * 1.1) + ' l0 ' + bx(headR * .7) + ' q-' + bx(headR) + ' ' + bx(headR * .6) + ' -' + bx(headR * 2) + ' 0 Z" ' + sk + '/>';
  s += '<circle cx="' + bx(cx - headR * .45) + '" cy="' + bx(top + headR * .95) + '" r="' + bx(headR * .3) + '" fill="#070A0E"/>' +
    '<circle cx="' + bx(cx + headR * .45) + '" cy="' + bx(top + headR * .95) + '" r="' + bx(headR * .3) + '" fill="#070A0E"/>';
  s += bEyes(cx, top + headR * .95, headR * .9, headR * .17, c, p.eyes == null ? 2 : p.eyes);
  s += '<path d="M' + bx(cx - headR * .55) + ' ' + bx(top + headR * 1.6) + ' l' + bx(headR * 1.1) + ' 0" stroke="' + c + '" stroke-width="1.6"/>';
  if (p.scythe) s += '<line x1="' + bx(cx + 20) + '" y1="' + GND + '" x2="' + bx(cx + 14) + '" y2="' + bx(top + 2) + '" stroke="' + c + '" stroke-width="3"/>' +
    '<path d="M' + bx(cx + 14) + ' ' + bx(top + 2) + ' q-20 2 -24 18" fill="none" stroke="' + c + '" stroke-width="3.2" stroke-linecap="round"/>';
  return s;
}

const FAMS = { blob: famBlob, rock: famRock, worm: famWorm, quad: famQuad, plant: famPlant,
               wraith: famWraith, human: famHuman, bird: famBird, golem: famGolem, skel: famSkel };

/* ---------------- who looks like what ----------------
   `sc` scales around the feet, so the thing that is meant to tower over you
   actually does. */
const BEAST = {
  /* region 1 — small, dumb, close to the ground */
  slag:      { f: 'blob',   p: { h: 36, w: 54, lumps: 4, drip: 1, core: 1 } },
  grub:      { f: 'worm',   p: { h: 40, seg: 5, r: 10 } },
  pebble:    { f: 'rock',   p: { h: 32, w: 42, shards: 2 } },
  whisper:   { f: 'wraith', p: { h: 44, w: 34 } },
  /* region 2 */
  ironwolf:  { f: 'quad',   p: { bh: 26, bw: 54, th: 17, spikes: 5, horns: 1 } },
  bramble:   { f: 'plant',  p: { h: 58, arms: 6, thorns: 1, w: 9 } },
  mosswarden:{ f: 'plant',  p: { h: 58, arms: 4, bulb: 1, w: 13, fangs: 1 } },
  echo:      { f: 'wraith', p: { h: 56, w: 40, arms: 1 } },
  /* region 3 */
  faceless:  { f: 'human',  p: { h: 64, wep: 'pick', eyes: 0 } },
  salaman:   { f: 'quad',   p: { bh: 20, bw: 62, th: 13, spikes: 7, leg: 5 } },
  veinling:  { f: 'rock',   p: { h: 50, w: 48, shards: 5 } },
  mirage:    { f: 'wraith', p: { h: 58, w: 42, op: .12, float: 12 } },
  /* region 4 */
  husk:      { f: 'wraith', p: { h: 66, w: 44, hollow: 1, arms: 1 } },
  vulture:   { f: 'bird',   p: { h: 56, span: 38 } },
  dune:      { f: 'blob',   p: { h: 54, w: 72, lumps: 5, gap: 22, er: 4 } },
  chimera:   { f: 'quad',   p: { bh: 28, bw: 58, th: 18, heads: 2, horns: 2, spikes: 4 } },
  /* region 5 */
  plateguard:{ f: 'human',  p: { h: 72, wep: 'sword', shield: 1 } },
  wallarch:  { f: 'human',  p: { h: 68, wep: 'bow' } },
  ram:       { f: 'quad',   p: { bh: 29, bw: 56, th: 19, horns: 2, leg: 8 } },
  egojudge:  { f: 'human',  p: { h: 70, wep: 'staff', crown: 1, cape: 1 } },
  /* region 6 — everything here is simply bigger than you */
  ancient:   { f: 'golem',  p: { h: 78, w: 58, horns: 1 } },
  voidherald:{ f: 'wraith', p: { h: 70, w: 48, horns: 1, arms: 1 } },
  crucible:  { f: 'golem',  p: { h: 76, w: 54, fire: 1, core: 8 } },
  /* dungeon creatures */
  veinworm:  { f: 'worm',   p: { h: 48, seg: 6, r: 11 } },
  warped:    { f: 'human',  p: { h: 68, wep: 'sword', op: .13 } },
  sleepless: { f: 'wraith', p: { h: 64, w: 44, eyes: 5, arms: 1 } },
  ember:     { f: 'blob',   p: { h: 48, w: 58, lumps: 4, drip: 1, core: 1, fangs: 1 } },
  bones:     { f: 'skel',   p: { h: 72 } },
  /* region bosses */
  b1:        { f: 'human',  p: { h: 68, wep: 'hammer' } },
  b2:        { f: 'wraith', p: { h: 66, w: 44, arms: 1, op: .16 } },
  b3:        { f: 'human',  p: { h: 72, shards: 5, wep: 'staff', eyes: 1 } },
  b4:        { f: 'human',  p: { h: 72, crown: 1, cape: 1, wep: 'sword', op: .14 } },
  b5:        { f: 'human',  p: { h: 76, wep: 'halberd', shield: 1, cape: 1 } },
  b6:        { f: 'golem',  p: { h: 82, w: 64, anvil: 1, core: 9, horns: 1 } },
  /* dungeon guardians */
  grubmother:{ f: 'worm',   p: { h: 58, seg: 7, r: 14 } },
  reflection:{ f: 'human',  p: { h: 70, wep: 'sword', op: .1, eyes: 1 } },
  wardenhours:{ f: 'wraith', p: { h: 70, w: 46, arms: 1, hold: 'hourglass' } },
  lesseranvil:{ f: 'golem', p: { h: 78, w: 58, anvil: 1, core: 7 } },
  chronos:   { f: 'skel',   p: { h: 78, scythe: 1 } }
};

/* how tall a set of params actually comes out, whichever family drew it */
function bodyH(b) { const p = b.p || {}; return p.h || ((p.bh || 30) + (p.th || 18)); }

/* The one entry point. Takes the creature object itself, because by the time a
   battle is running all the app has is a copy of it. `ak` is the art key; a
   creature without one still gets a body, picked from its name, so nothing in
   this world is ever a blank box. */
function creatureArt(foe, size) {
  const c = (typeof TYPES !== 'undefined' && TYPES[foe.t]) ? TYPES[foe.t].c : '#C8FF00';
  const key = foe.ak || '';
  let b = BEAST[key];
  if (!b) {
    const names = Object.keys(FAMS), hh = bHash(foe.n || key || 'x');
    b = { f: names[hh % names.length], sc: .95, p: { h: 64 } };
  }
  const rnd = bRnd(bHash(key + (foe.n || '')) || 7);
  const body = FAMS[b.f](c, b.p || {}, rnd);
  /* last line of defence: horns, crowns and crystal shards all grow upward out
     of the body, so a creature drawn to its full height loses its head off the
     top of the box. 82 leaves them room. */
  const sc = Math.min(b.sc || 1, 82 / Math.max(1, bodyH(b)));
  return '<svg viewBox="0 0 100 100" style="width:' + size + 'px;height:' + size + 'px;display:block;overflow:visible" aria-hidden="true">' +
    /* ground shadow: without it everything looks pasted on */
    '<ellipse cx="50" cy="' + (GND + 2) + '" rx="' + bx(26 * sc) + '" ry="3.4" fill="' + c + '" fill-opacity=".14"/>' +
    '<g transform="translate(50 ' + GND + ') scale(' + sc + ') translate(-50 ' + (-GND) + ')">' + body + '</g></svg>';
}

/* ---------------- you ----------------
   The same sword and dumbbell as the app icon, so the thing fighting on the
   left is recognisably the thing on your home screen. */
function heroArt(size, hurt) {
  const A = '#C8FF00', S2 = '#9FB3C8';
  const skin = 'fill="' + A + '" fill-opacity="' + (hurt ? .12 : .22) + '" stroke="' + A + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
  let s = '';
  /* cape */
  s += '<path d="M38 36 q-13 28 -7 48 l18 0 q-7 -24 -2 -46 Z" fill="' + A + '" fill-opacity=".10" stroke="' + A + '" stroke-width="1.3"/>';
  /* legs, braced apart */
  s += '<path d="M44 66 L40 79 L41 ' + GND + '" fill="none" stroke="' + A + '" stroke-width="7" stroke-linecap="round" stroke-opacity=".9"/>' +
    '<path d="M56 66 L62 79 L63 ' + GND + '" fill="none" stroke="' + A + '" stroke-width="7" stroke-linecap="round" stroke-opacity=".9"/>';
  /* torso + pauldrons */
  s += '<path d="M39 38 L61 38 L58 66 L42 66 Z" ' + skin + '/>' +
    '<path d="M41 44 L50 50 L59 44" fill="none" stroke="' + A + '" stroke-width="1.5" stroke-opacity=".7"/>' +
    '<path d="M38 36 q-10 0 -9 8 q5 3 10 1 Z" ' + skin + '/>' +
    '<path d="M62 36 q10 0 9 8 q-5 3 -10 1 Z" ' + skin + '/>';
  /* head: helmet with a visor */
  s += '<path d="M43 36 L43 25 Q50 20 57 25 L57 36 Z" ' + skin + '/>' +
    '<rect x="44.5" y="27" width="11" height="3.6" fill="#070A0E" fill-opacity=".95"/>' +
    bEye(47, 28.8, 1.9, A) + bEye(53, 28.8, 1.9, A);
  /* right arm raising the sword */
  s += '<path d="M64 42 q9 -6 10 -14" fill="none" stroke="' + A + '" stroke-width="5" stroke-linecap="round" stroke-opacity=".9"/>' +
    '<line x1="74" y1="28" x2="78" y2="6" stroke="' + S2 + '" stroke-width="3.4" stroke-linecap="round"/>' +
    '<line x1="70" y1="28" x2="80" y2="26" stroke="' + S2 + '" stroke-width="2.6"/>';
  /* left arm holding the dumbbell */
  s += '<path d="M36 42 q-9 7 -8 15" fill="none" stroke="' + A + '" stroke-width="5" stroke-linecap="round" stroke-opacity=".9"/>' +
    '<line x1="20" y1="57" x2="34" y2="57" stroke="' + S2 + '" stroke-width="3"/>' +
    '<rect x="17" y="51" width="5" height="12" rx="1.6" fill="' + S2 + '" fill-opacity=".5" stroke="' + S2 + '" stroke-width="1.4"/>' +
    '<rect x="32" y="51" width="5" height="12" rx="1.6" fill="' + S2 + '" fill-opacity=".5" stroke="' + S2 + '" stroke-width="1.4"/>';
  return '<svg viewBox="0 0 100 100" style="width:' + size + 'px;height:' + size + 'px;display:block;overflow:visible" aria-hidden="true">' +
    '<ellipse cx="50" cy="' + (GND + 2) + '" rx="24" ry="3.4" fill="' + A + '" fill-opacity=".16"/>' + s + '</svg>';
}

/* the tavern sign: a mug and a fire, which is all a tavern needs to be one */
function tavernArt(size) {
  const A = '#C8FF00', W = '#FFB36B';
  return '<svg viewBox="0 0 100 100" style="width:' + size + 'px;height:' + size + 'px;display:block">' +
    '<circle cx="50" cy="50" r="46" fill="' + A + '" fill-opacity=".07" stroke="' + A + '" stroke-opacity=".35"/>' +
    /* hearth */
    '<path d="M26 72 L74 72 L74 78 L26 78 Z" fill="' + A + '" fill-opacity=".2" stroke="' + A + '" stroke-width="1.6"/>' +
    '<path d="M44 70 q-7 -9 -1 -17 q1 7 6 9 q4 -6 1 -14 q11 7 11 18 q0 4 -3 4 Z" fill="' + W + '" fill-opacity=".55" stroke="' + W + '" stroke-width="1.6"/>' +
    /* mug */
    '<path d="M30 30 L52 30 L49 58 L33 58 Z" fill="' + A + '" fill-opacity=".18" stroke="' + A + '" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<path d="M52 36 q11 1 10 9 q-1 7 -11 7" fill="none" stroke="' + A + '" stroke-width="2.2"/>' +
    '<path d="M30 30 q5 -6 11 -2 q6 -5 11 2 Z" fill="#FFF7DC" fill-opacity=".8"/>' +
    '<circle cx="66" cy="22" r="3" fill="#FFF7DC" fill-opacity=".5"/>' +
    '<circle cx="73" cy="31" r="2" fill="#FFF7DC" fill-opacity=".35"/></svg>';
}
