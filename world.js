/* MONOLITH — THE FORGE
   Open world layer: regions, turn-based combat, dungeons and gear.
   Golden rule: the ENERGY you fight with comes only from real sets and sessions.
   Your adventurer level still comes from the gym; the world is the reward. */

/* ---------------- types and effectiveness ---------------- */
const TYPES = {
  iron:   { n: 'Iron',   c: '#9FB3C8' },
  beast:  { n: 'Beast',  c: '#FF6B2C' },
  stone:  { n: 'Stone',  c: '#C9A227' },
  shadow: { n: 'Shadow', c: '#8B5CF6' },
  spirit: { n: 'Spirit', c: '#00D6FF' }
};
/* cycle: each type is strong against the next and weak against the previous */
const CYCLE = ['iron', 'beast', 'stone', 'shadow', 'spirit'];
function typeMult(a, d) {
  if (a === d) return 1;
  const i = CYCLE.indexOf(a), j = CYCLE.indexOf(d);
  if (i < 0 || j < 0) return 1;
  if ((i + 1) % 5 === j) return 2;
  if ((j + 1) % 5 === i) return 0.5;
  return 1;
}
function multTxt(m) { return m > 1 ? "It's super effective!" : (m < 1 ? "It's not very effective..." : ''); }

/* ---------------- attacks ----------------
   Every attack unlocks from a REAL gym milestone.

   Three numbers decide what a move is worth:
     pow  how hard it hits
     acc  how often it connects, before speed is taken into account
     pp   how many times you may use it before the tavern

   pp is derived from pow by movePP() — hard hitters get fewer uses, which is
   the whole point — and only written out here where the formula would be
   wrong, which is the three support moves: a heal worth fourteen casts is not
   a decision, it is a button. */
const ATTACKS = {
  bench_strike: { n: 'Bench Strike', t: 'iron', pow: 35, kind: 'dmg', acc: 98,
    d: 'A short, flat drive. The first move every apprentice learns, and the one that never runs dry.',
    u: () => true, ut: 'Available from the start' },
  lat_pull: { n: 'Lat Drag', t: 'beast', pow: 42, kind: 'dmg', acc: 96,
    d: 'You drag the enemy in with your elbows, not your hands.',
    u: g => bestAt('latpull', 8) >= 35, ut: 'Lat pulldown: 35 kg × 8' },
  hinge: { n: 'Iron Hinge', t: 'stone', pow: 48, kind: 'dmg', acc: 95,
    d: 'The hips snap forward like a bolt. Unflashy, devastating.',
    u: g => bestAt('rdl', 10) >= 20, ut: 'Romanian deadlift: 20 kg × 10' },
  side_edge: { n: 'Side Edge', t: 'spirit', pow: 40, kind: 'dmg', crit: 25, acc: 97,
    d: 'Two clean cuts out from the shoulders. Lands often and crits often.',
    u: g => bestAt('latraise', 12) >= 6 || g.vRatio >= 1.3, ut: 'Lateral raise: 6 kg × 12' },
  quake: { n: 'Seismic Press', t: 'stone', pow: 62, kind: 'dmg', acc: 92,
    d: 'You push the floor until the floor gives.',
    u: g => bestAt('legpress', 10) >= 100, ut: 'Leg press: 100 kg × 10' },
  ham_claw: { n: 'Hamstring Claw', t: 'beast', pow: 52, kind: 'dmg', acc: 94,
    d: 'A scissor strike from behind. Nobody sees the hamstrings coming.',
    u: g => bestAt('legcurl', 10) >= 25, ut: 'Leg curl: 25 kg × 10' },
  hammer: { n: 'Neutral Hammer', t: 'iron', pow: 50, kind: 'dmg', acc: 95,
    d: 'Hammer grip, hammer impact.',
    u: g => bestAt('inchammer', 10) >= 8, ut: 'Incline hammer curl: 8 kg × 10' },
  rep_chain: { n: 'Rep Chain', t: 'beast', pow: 16, kind: 'multi', acc: 93,
    d: 'Hits 2 to 4 times. Volume is damage too.',
    u: g => g.sessions >= 10, ut: '10 sessions closed' },
  titan_push: { n: 'Titan Push', t: 'iron', pow: 70, kind: 'dmg', acc: 90,
    d: 'Three quarters of your bodyweight turned into one shove. Slow enough that a fast enemy can step out of it.',
    u: g => bestAt('bench', 8) >= g.bw * 0.75, ut: 'Bench press: 0.75 × bodyweight × 8' },
  resolve: { n: 'Unbroken Resolve', t: 'shadow', pow: 0, kind: 'heal', heal: 45, pp: 4,
    d: 'Restore 45% of your HP. Four times between rests — not earned by fighting, earned by not missing.',
    u: g => g.streak >= 6, ut: '6-session streak' },
  roar: { n: 'Forge Roar', t: 'shadow', pow: 0, kind: 'buffA', pp: 3,
    d: 'Raises your Attack by 35% for the rest of the fight.',
    u: g => g.sessions >= 15, ut: '15 sessions closed' },
  stance: { n: 'Steel Stance', t: 'stone', pow: 0, kind: 'buffD', pp: 3,
    d: 'Raises your Defense by 45% for the rest of the fight. Technique is armour.',
    u: g => g.fullChk >= 5, ut: 'After-workout list finished on 5 sessions' },
  mirror: { n: 'Mirror Cut', t: 'spirit', pow: 58, kind: 'dmg', crit: 20, acc: 94,
    d: 'Only mastered by someone who truly measures themselves.',
    u: g => g.analyzed >= 3, ut: 'Analyse 3 photos in Symmetry' },
  anvil_drop: { n: 'Anvil Drop', t: 'iron', pow: 95, kind: 'charge', acc: 82,
    d: 'Charges one turn, lands the next. Devastating if you can take the hit — and it misses more than anything else you own.',
    u: g => bestAt('bench', 8) >= g.bw, ut: 'Bench press: your bodyweight × 8' },
  judgement: { n: 'Forge Judgement', t: 'spirit', pow: 85, kind: 'dmg', crit: 15, acc: 88,
    d: 'The strike only available to someone who genuinely changed.',
    u: g => g.level >= 20, ut: 'Adventurer level 20' }
};

/* What is left when every attack is empty. It is deliberately pathetic: it
   stops you being locked out of a fight, and it is never worth choosing. */
const BARE = { n: 'Bare Hands', t: 'iron', pow: 12, kind: 'dmg', acc: 100, bare: true,
  d: 'What is left when everything else is empty.' };

/* ---------------- gear ---------------- */
const ITEMS = {
  rusty_bar:  { n: 'Rusty Bar',        s: 'weapon', atk: 4,  d: 'Heavier than it should be. It works.' },
  oly_bar:    { n: 'Olympic Bar',      s: 'weapon', atk: 9,  d: '20 kg of honest steel.' },
  anvil:      { n: 'Portable Anvil',   s: 'weapon', atk: 16, d: 'Nobody knows how you carry it. Neither do you.' },
  forge_ham:  { n: 'Forge Hammer',     s: 'weapon', atk: 26, crit: 8, d: 'The first plates were made with this.' },
  wraps:      { n: 'Worn Wraps',       s: 'armor',  def: 4,  d: 'Protects your wrists and not much else.' },
  belt:       { n: 'Leather Belt',     s: 'armor',  def: 9,  hp: 15, d: 'Teaches your trunk to stay rigid.' },
  plate_mail: { n: 'Plate Harness',    s: 'armor',  def: 17, hp: 25, d: 'Twenty-kilo plates stitched together.' },
  aegis:      { n: 'Aegis of the Constant', s: 'armor', def: 24, hp: 45, d: 'Hardens with every session you did not skip.' },
  timer:      { n: 'Broken Timer',     s: 'charm',  vel: 12, d: 'Always reads 90 seconds. That is all you need.' },
  eye:        { n: "Forger's Eye",     s: 'charm',  crit: 14, d: 'Sees asymmetry before the mirror does.' },
  amulet:     { n: 'Protein Amulet',   s: 'charm',  hp: 55, d: 'Warm to the touch. Faintly smells of vanilla.' },
  hourglass:  { n: 'Inverted Hourglass', s: 'charm', vel: 20, crit: 10, d: 'For once, time is working for you.' },
  /* consumable */
  shake:      { n: 'Protein Shake',    s: 'use', heal: 45, d: 'Restores 45% of your HP mid-battle.' }
};
const SLOT_NAMES = { weapon: 'Weapon', armor: 'Armour', charm: 'Charm' };

/* ---------------- creatures ---------------- */
const MOBS = {
  /* region 1 — reference hero: ATK ~33, 96 HP, DEF ~34 */
  slag:     { n: 'Foundry Slag',      t: 'iron',   hp: 100, atk: 10, def: 4, gold: 9 },
  grub:     { n: 'Quarry Grub',       t: 'beast',  hp: 92,  atk: 12, def: 3, gold: 9 },
  pebble:   { n: 'Living Pebble',     t: 'stone',  hp: 118, atk: 8,  def: 8, gold: 11 },
  whisper:  { n: 'Lazy Whisper',      t: 'shadow', hp: 105, atk: 12, def: 4, gold: 12 },
  /* region 2 */
  ironwolf: { n: 'Iron Wolf',         t: 'iron',   hp: 155, atk: 11, def: 10, gold: 24 },
  bramble:  { n: 'Choking Bramble',   t: 'beast',  hp: 168, atk: 10, def: 12, gold: 26 },
  mosswarden:{ n: 'Moss Warden',      t: 'stone',  hp: 190, atk: 9,  def: 16, gold: 28 },
  echo:     { n: 'Echo of the Quitter', t: 'shadow', hp: 148, atk: 13, def: 8, gold: 30 },
  /* region 3 */
  faceless: { n: 'Faceless Miner',    t: 'stone',  hp: 215, atk: 12, def: 18, gold: 46 },
  salaman:  { n: 'Salt Salamander',   t: 'beast',  hp: 195, atk: 14, def: 14, gold: 49 },
  veinling: { n: 'Veinling',          t: 'iron',   hp: 235, atk: 11, def: 22, gold: 51 },
  mirage:   { n: 'Saline Mirage',     t: 'spirit', hp: 185, atk: 15, def: 12, gold: 54 },
  /* region 4 */
  husk:     { n: 'Hollow Husk',       t: 'shadow', hp: 330, atk: 18, def: 22, gold: 82 },
  vulture:  { n: 'Excuse Vulture',    t: 'spirit', hp: 300, atk: 21, def: 18, gold: 86 },
  dune:     { n: 'Wandering Dune',    t: 'stone',  hp: 390, atk: 16, def: 30, gold: 90 },
  chimera:  { n: 'Shortcut Chimera',  t: 'beast',  hp: 345, atk: 22, def: 24, gold: 94 },
  /* region 5 */
  plateguard:{ n: 'Plate Guard',      t: 'iron',   hp: 480, atk: 24, def: 34, gold: 152 },
  wallarch: { n: 'Wall Archer',       t: 'spirit', hp: 440, atk: 28, def: 26, gold: 158 },
  ram:      { n: 'Living Ram',        t: 'stone',  hp: 540, atk: 22, def: 40, gold: 164 },
  egojudge: { n: 'Ego Inquisitor',    t: 'shadow', hp: 460, atk: 30, def: 30, gold: 172 },
  /* region 6 */
  ancient:  { n: 'Ancient Forged',    t: 'iron',   hp: 750, atk: 41, def: 46, gold: 285 },
  voidherald:{ n: 'Void Herald',      t: 'shadow', hp: 690, atk: 46, def: 38, gold: 295 },
  crucible: { n: 'Wandering Crucible', t: 'spirit', hp: 710, atk: 44, def: 40, gold: 305 },
  /* dungeons */
  veinworm: { n: 'Vein Worm',         t: 'stone',  hp: 200, atk: 13, def: 12, gold: 62 },
  warped:   { n: 'Warped Reflection', t: 'spirit', hp: 290, atk: 15, def: 16, gold: 104 },
  sleepless:{ n: 'The Sleepless',     t: 'shadow', hp: 410, atk: 19, def: 22, gold: 145 },
  ember:    { n: 'Lost Ember',        t: 'iron',   hp: 630, atk: 25, def: 30, gold: 185 },
  bones:    { n: 'Adventurer Bones',  t: 'shadow', hp: 910, atk: 33, def: 38, gold: 268 }
};

/* region bosses */
const BOSSES = {
  b1: { n: 'The Quarry Foreman', t: 'stone', hp: 215, atk: 10, def: 8, vel: 9, gold: 90, item: 'rusty_bar',
    lore: 'He looks you up and down and laughs: "another one who lasts three weeks". Shut him up with one clean set.' },
  b2: { n: 'Alced, Who Never Came Back', t: 'shadow', hp: 310, atk: 11, def: 14, vel: 20, gold: 260, item: 'wraps',
    lore: 'He trained for two months, four years ago. He still lives off that story. The most common ghost there is.' },
  b3: { n: 'Veinarch, Lady of Salt', t: 'iron', hp: 400, atk: 13, def: 20, vel: 14, gold: 600, item: 'oly_bar',
    lore: 'Crystallised from the inside by repeating the same thing without ever changing it. Only real progression breaks her.' },
  b4: { n: 'The Crowned Quitter', t: 'shadow', hp: 590, atk: 20, def: 28, vel: 30, gold: 1200, item: 'belt',
    lore: 'The version of you that gave up. It wears your face and your voice, and it knows every one of your excuses by heart.' },
  b5: { n: 'Ferro, Warden of the Citadel', t: 'iron', hp: 850, atk: 29, def: 38, vel: 26, gold: 2600, item: 'anvil',
    lore: 'He hates nobody. He simply does not let through anyone who has not earned the passage.' },
  b6: { n: 'THE ANVIL', t: 'stone', hp: 1650, atk: 43, def: 52, vel: 18, gold: 7000, item: 'forge_ham',
    lore: 'Not a monster. The surface you hammered yourself against for years until you took shape. Beating it means accepting you are no longer the person who started.' }
};

/* Each creature carries the key to its own drawing, because by the time a
   battle is running all the code has is a copy of the creature. */
Object.keys(MOBS).forEach(k => MOBS[k].ak = k);
Object.keys(BOSSES).forEach(k => BOSSES[k].ak = k);

/* ---------------- regions ---------------- */
const REGIONS = [
  { id: 'r1', n: 'The Novice Quarries', lvl: 1, mobs: ['slag', 'grub', 'pebble', 'whisper'], boss: 'b1', dung: 'd1',
    intro: 'Dust, clanging metal, and people who are not looking at you even though you think they are. Everyone starts here: no strength, no technique, and a feeling of being out of place. That feeling fades in three weeks. The strength takes a little longer.',
    end: 'The foreman goes quiet. Not because you impressed him, but because you came back a fourth time. The quarries have nothing left to teach you.' },
  { id: 'r2', n: 'The Iron Wood', lvl: 4, mobs: ['ironwolf', 'bramble', 'mosswarden', 'echo'], boss: 'b2', dung: 'd2',
    intro: 'Cold steel trees that grew crooked from a lack of consistency. Between them drift the echoes of everyone who trained for a month and left. Harmless until they recognise you.',
    end: 'Alced dissolves without resisting. He was never strong: he just got here before you and then stopped.' },
  { id: 'r3', n: 'The Salt Mines', lvl: 8, mobs: ['faceless', 'salaman', 'veinling', 'mirage'], boss: 'b3', dung: 'd3',
    intro: 'Kilometres of tunnels where everything is preserved exactly as it was, forever. This is the kingdom of the plateau: down here, whoever stops progressing crystallises. The only tool that works is adding a little at a time.',
    end: 'Veinarch cracks and the salt falls away. You learned what she was guarding: you do not need to lift much more, you need to lift a little more than yesterday.' },
  { id: 'r4', n: 'The Quitter\'s Waste', lvl: 13, mobs: ['husk', 'vulture', 'dune', 'chimera'], boss: 'b4', dung: 'd4',
    intro: 'A flat desert where the wind repeats familiar lines: "not today", "I\'ll start Monday", "I already lost the streak anyway". Crossing it does not take strength. It takes coming back.',
    end: 'The crown falls into the sand. The one who quit was not weaker than you: he simply stopped showing up. Now you know exactly what that looks like.' },
  { id: 'r5', n: 'The Steel Citadel', lvl: 20, mobs: ['plateguard', 'wallarch', 'ram', 'egojudge'], boss: 'b5', dung: 'd5',
    intro: 'High walls, silence, order. This is where the people with years behind them live. Nobody looks down on you and nobody helps you: respect is not requested here, it is accumulated one session at a time.',
    end: 'Ferro steps aside and lets you through. You are not someone who goes to the gym any more. You are someone who trains.' },
  { id: 'r6', n: 'The Anvil Deep', lvl: 30, mobs: ['ancient', 'voidherald', 'crucible'], boss: 'b6', dung: null,
    intro: 'The bottom of the forge, where metal becomes something else. There are no new enemies down here: only larger versions of everything you already beat. As it should be.',
    end: 'The Anvil splits. Under the metal there is no treasure: there is a mirror. And the person looking back looks nothing like the one who first opened this app.' }
];

/* ---------------- secret dungeons ----------------
   These do not open with level. They open with real behaviour. */
const DUNGEONS = {
  d1: { n: 'The Deep Vein', floors: [['veinworm', 'pebble'], ['veinworm', 'slag'], ['veinworm', 'veinworm']],
    guard: { n: 'Grub Mother', t: 'stone', hp: 340, atk: 12, def: 14, vel: 12, gold: 220, ak: 'grubmother' }, item: 'timer',
    cond: g => g.sessions >= 10, ct: 'Close 10 sessions to find the entrance',
    lore: 'A crack under the quarries you can only see once you have walked past the same spot enough times. Consistency opens doors that strength cannot.' },
  d2: { n: 'The Mirror Sanctum', floors: [['warped', 'echo'], ['warped', 'warped'], ['warped', 'vulture']],
    guard: { n: 'Your Own Reflection', t: 'spirit', hp: 480, atk: 15, def: 18, vel: 28, gold: 460, ak: 'reflection' }, item: 'eye',
    cond: g => g.analyzed >= 3, ct: 'Analyse 3 photos in Symmetry for the sanctum to appear',
    lore: 'A temple of polished surfaces where everything you see is a version of you. Only those willing to measure themselves honestly can enter.' },
  d3: { n: 'The Sleepless Crypt', floors: [['sleepless', 'husk'], ['sleepless', 'sleepless'], ['sleepless', 'chimera']],
    guard: { n: 'Warden of Hours', t: 'shadow', hp: 700, atk: 21, def: 24, vel: 34, gold: 900, ak: 'wardenhours' }, item: 'amulet',
    cond: g => g.fullChk >= 5, ct: 'Finish the after-workout list on 5 sessions',
    lore: 'It opens only for those who sleep and eat well. Inside there are no traps: only the exact consequences of your last five weeks.' },
  d4: { n: 'The Lost Forge', floors: [['ember', 'dune'], ['ember', 'ember'], ['ember', 'plateguard']],
    guard: { n: 'Lesser Anvil', t: 'iron', hp: 1000, atk: 27, def: 34, vel: 15, gold: 1700, ak: 'lesseranvil' }, item: 'plate_mail',
    cond: g => g.progExercises >= 8, ct: 'Earn a weight increase on 8 different exercises',
    lore: 'The original forge, cold for centuries. It relights itself when somebody proves they understand progression.' },
  d5: { n: 'The Ossuary of Time', floors: [['bones', 'egojudge'], ['bones', 'bones'], ['bones', 'ancient']],
    guard: { n: 'Chronos of the Forge', t: 'shadow', hp: 1500, atk: 36, def: 44, vel: 40, gold: 4500, ak: 'chronos' }, item: 'hourglass',
    cond: g => g.sessions >= 50, ct: 'Close 50 sessions',
    lore: 'The bones of everyone who started and did not continue. There are many. Walking among them is how you understand why getting here already makes you different.' }
};

/* shop */
const SHOP = [
  { id: 'shake', price: 60, stack: true },
  { id: 'wraps', price: 220 },
  { id: 'oly_bar', price: 650 },
  { id: 'belt', price: 1400 },
  { id: 'plate_mail', price: 4200 },
  { id: 'aegis', price: 12000 }
];

/* The nouns of this file translate like everything else. They are registered
   here rather than in lang.js because lang.js loads first and cannot see them. */
if (typeof i18nLate === 'function') {
  i18nLate('TYPES', TYPES);
  i18nLate('ATTACKS', ATTACKS);
  i18nLate('ITEMS', ITEMS);
  i18nLate('SLOT_NAMES', SLOT_NAMES);
}

/* ---------------- state ---------------- */
let curRegion = 0;
let questTab = 'map';

function rpg() {
  if (!S.rpg) S.rpg = { spent: 0, gold: 0, items: {}, eq: { weapon: null, armor: null, charm: null },
                        moves: [], bosses: [], dungeons: {}, seen: [], kills: {}, tut: false,
                        pp: {}, hp: null, restedAt: null };
  const r = S.rpg;
  r.items = r.items || {};
  r.eq = r.eq || { weapon: null, armor: null, charm: null };
  r.moves = r.moves || []; r.bosses = r.bosses || []; r.dungeons = r.dungeons || {};
  r.kills = r.kills || {}; r.seen = r.seen || [];
  /* Uses and health survive a fight, which is what gives the tavern a job.
     An absent entry means full, so an old save walks in at full strength and a
     move unlocked tomorrow arrives with all of its uses. */
  r.pp = r.pp || {};
  if (r.hp === undefined) r.hp = null;
  if (r.restedAt === undefined) r.restedAt = null;
  if (r.gold == null) r.gold = 0;
  return r;
}

/* ---------------- uses, the Pokémon rule ----------------
   The harder a move hits, the fewer times you may use it. Uses do not come
   back when the fight ends: they come back at the tavern, the tavern costs
   energy, and energy only comes from training. That chain is the whole design
   of this app in one resource. */
function moveById(id) { return id === 'bare' ? BARE : ATTACKS[id]; }
/* what a move actually puts out in one turn — the chain's three average hits
   count, not its 16 per hit */
function movePow(a) { return a.kind === 'multi' ? a.pow * 3 : a.pow; }
function movePP(id) {
  const a = moveById(id);
  if (!a) return 0;
  if (a.pp != null) return a.pp;
  return clamp(Math.round(760 / Math.max(10, movePow(a))), 3, 20);
}
function moveAcc(a) { return a.acc != null ? a.acc : 95; }
function ppLeft(id) {
  if (id === 'bare') return 99;
  const v = rpg().pp[id];
  return v == null ? movePP(id) : clamp(v, 0, movePP(id));
}
function ppSpend(id) {
  if (id === 'bare') return;
  const r = rpg(); r.pp[id] = Math.max(0, ppLeft(id) - 1); save();
}
function ppRestore() { rpg().pp = {}; }   /* absent means full, so emptying the map refills everything */
function ppDry(g) { return !activeMoves(g).some(id => ppLeft(id) > 0); }

/* ---------------- speed ----------------
   Every creature has one. Most inherit it from how aggressive they are: a
   thing that hits hard and often is a thing that moves. */
function foeVel(f) { return f.vel != null ? f.vel : Math.round(6 + (f.atk || 10) * 0.7); }
/* Agility decides who connects. The gap between two speeds moves the roll but
   never off the end of it — nothing ever lands for certain, nothing is ever
   impossible, and a charm that buys you speed is worth wearing. */
function hitChance(acc, fast, slow) { return clamp(acc + (fast - slow) * 0.7, 45, 99); }
function critChance(base, fast, slow) { return clamp(base + (fast - slow) * 0.3, 1, 55); }

/* ---------------- health between fights ----------------
   Max HP moves as you train and swap gear, so what is stored is the current
   number, clamped on the way out. */
function heroHP(hs) { const r = rpg(); return r.hp == null ? hs.hp : clamp(r.hp, 0, hs.hp); }
function heroHurt(g) { const hs = heroStats(g); return heroHP(hs) < hs.hp || ppDry(g); }
/* One rest is free after every session you close: training is rest. */
function restFree(g) { const r = rpg(); return r.restedAt == null || g.sessions > r.restedAt; }
function doRest(g) {
  const r = rpg(), hs = heroStats(g);
  if (!restFree(g)) r.spent += 1;
  r.hp = hs.hp; ppRestore(); r.restedAt = g.sessions;
  save();
}
/* Energy in one place, with its whole story attached, so the number is
   never shown without the player being able to see where it came from. */
function energyInfo(g) {
  const fromSets = g.setsDone * 1;
  const fromSessions = g.sessions * 5;
  const earned = fromSets + fromSessions;
  const spent = rpg().spent || 0;
  const left = Math.max(0, earned - spent);
  return { fromSets: fromSets, fromSessions: fromSessions, earned: earned, spent: spent,
           left: left, fights: left, bosses: Math.floor(left / 3) };
}
function energy(g) { return energyInfo(g).left; }
/* The energy meter, used at the top of the map. */
function energyCard(g) {
  const e = energyInfo(g), r = rpg();
  const canDo = e.left === 0 ? 'Empty. Log some sets and it comes straight back.'
    : 'That is <b>' + e.fights + ' creature fight' + (e.fights === 1 ? '' : 's') +
      (e.bosses ? '</b>, or <b>' + e.bosses + ' boss fight' + (e.bosses === 1 ? '' : 's') : '</b>') + '</b>.';
  return '<div class="card acc">' +
    '<div class="spread" style="align-items:flex-start"><div>' +
      '<div class="tiny">ENERGY YOU CAN SPEND</div>' +
      '<div class="ebig">' + e.left + ' <i>&#9889;</i></div>' +
      '<div class="tiny" style="margin-top:4px">' + canDo + '</div></div>' +
      '<div style="text-align:right"><div class="tiny">SHARDS</div>' +
      '<div class="mono" style="font-size:20px;font-weight:700">' + (r.gold || 0) + '</div></div></div>' +
    '<div class="ledger">' +
      '<div><span>Log one set</span><b class="pos">+1</b></div>' +
      '<div><span>Close a session</span><b class="pos">+5</b></div>' +
      '<div><span>Fight a creature</span><b class="neg">&minus;1</b></div>' +
      '<div><span>Fight a region boss</span><b class="neg">&minus;3</b></div>' +
      '<div><span>One dungeon floor</span><b class="neg">&minus;2</b></div>' +
      '<div><span>A dungeon guardian</span><b class="neg">&minus;4</b></div>' +
      '<div><span>' + tr('w_ledger_rest') + '</span><b class="neg">&minus;1</b></div>' +
    '</div>' +
    '<div class="tiny" style="margin-top:11px">Earned <b style="color:var(--tx)">' + e.earned + '</b> in total &mdash; ' +
      e.fromSets + ' from sets, ' + e.fromSessions + ' from closed sessions &mdash; and spent <b style="color:var(--tx)">' + e.spent + '</b>. ' +
      'Training is the <b style="color:var(--tx)">only</b> way to make more.</div></div>';
}
function unlockedMoves(g) { return Object.keys(ATTACKS).filter(k => ATTACKS[k].u(g)); }
function activeMoves(g) {
  const r = rpg(), un = unlockedMoves(g);
  r.moves = r.moves.filter(m => un.indexOf(m) >= 0);
  if (!r.moves.length) r.moves = un.slice(0, 4);
  return r.moves;
}
function eqBonus() {
  const r = rpg(), b = { atk: 0, def: 0, vel: 0, crit: 0, hp: 0 };
  ['weapon', 'armor', 'charm'].forEach(s => {
    const it = ITEMS[r.eq[s]];
    if (it) ['atk', 'def', 'vel', 'crit', 'hp'].forEach(k => b[k] += it[k] || 0);
  });
  return b;
}
function heroStats(g) {
  const b = eqBonus();
  return {
    hp:   Math.round(60 + g.stats.VIG * 0.9 + g.sessions * 2 + b.hp),
    atk:  Math.round(12 + g.stats.STR * 0.55 + g.level * 1.2 + b.atk),
    def:  Math.round(8 + g.stats.MAS * 0.40 + g.level * 0.8 + b.def),
    vel:  Math.round(10 + g.stats.DIS * 0.35 + b.vel),
    crit: Math.round(5 + g.stats.FRG * 0.15 + b.crit)
  };
}
/* a region opens with enough LEVEL and the previous boss defeated, so the
   story moves in order and you never wander into a zone that flattens you */
function regionOpen(reg, g) {
  const i = REGIONS.indexOf(reg);
  if (i <= 0) return g.level >= reg.lvl;
  return g.level >= reg.lvl && rpg().bosses.indexOf(REGIONS[i - 1].boss) >= 0;
}
function regionBlockReason(reg, g) {
  const i = REGIONS.indexOf(reg);
  if (g.level < reg.lvl) return 'You need adventurer level ' + reg.lvl + '. Levels come from training, not fighting.';
  if (i > 0 && rpg().bosses.indexOf(REGIONS[i - 1].boss) < 0)
    return 'First you have to beat ' + BOSSES[REGIONS[i - 1].boss].n + ', the boss of ' + REGIONS[i - 1].n + '.';
  return '';
}

/* ---------------- procedural sigil ---------------- */
function sigil(id, type, size) {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  const c = TYPES[type] ? TYPES[type].c : '#C8FF00';
  const n = 5 + (h % 4), rot = h % 360, inner = 0.35 + (h % 30) / 100;
  const R = 42, cx = 50, cy = 50;
  let pts = '';
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? R * inner : R;
    const a = -Math.PI / 2 + i * Math.PI / n;
    pts += (cx + Math.cos(a) * r).toFixed(1) + ',' + (cy + Math.sin(a) * r).toFixed(1) + ' ';
  }
  const rings = 1 + (h % 3);
  let g2 = '';
  for (let i = 1; i <= rings; i++) g2 += '<circle cx="50" cy="50" r="' + (44 - i * 6) + '" fill="none" stroke="' + c + '" stroke-opacity=".22"/>';
  return '<svg viewBox="0 0 100 100" style="width:' + size + 'px;height:' + size + 'px;display:block">' +
    '<circle cx="50" cy="50" r="46" fill="' + c + '" fill-opacity=".10" stroke="' + c + '" stroke-opacity=".45"/>' + g2 +
    '<polygon points="' + pts + '" fill="' + c + '" fill-opacity=".55" stroke="' + c + '" stroke-width="1.5" ' +
    'transform="rotate(' + rot + ' 50 50)"/></svg>';
}

/* ================= COMBAT ================= */
let B = null;
let BID = 0;

function startBattle(foe, ctxOpts) {
  const g = computeGame();
  const cost = ctxOpts.cost || 1;
  const hs = heroStats(g);
  /* at zero health there is no fight to have, only a rest to take */
  if (heroHP(hs) <= 0) { toast(tr('w_down')); openTavern(); return; }
  if (energy(g) < cost) { toast(tr('w_noenergy')); return; }
  rpg().spent += cost; save();
  B = {
    id: ++BID, g: g, hs: hs, hp: heroHP(hs), max: hs.hp, vel: hs.vel,
    foe: foe, fhp: foe.hp, fmax: foe.hp, fvel: foeVel(foe),
    ctx: ctxOpts, log: [], atkBuff: 1, defBuff: 1, charging: null,
    over: false, busy: false, turn: 1
  };
  B.log.push({ t: 'sys', m: foe.n + ' blocks your path!' });
  drawBattle();
  /* Something much faster than you gets the opening move. Losing a turn before
     you have taken one is the clearest lesson in what speed is for. */
  if (B.fvel > B.vel && Math.random() < Math.min(.7, (B.fvel - B.vel) / 55)) {
    B.busy = true;
    B.log.push({ t: 'sys', m: tr('w_first').replace('{n}', foe.n) });
    updateBattle();
    setTimeout(foeTurn, 950);
  }
}
/* multiplicative mitigation: defense reduces a percentage, not a flat amount.
   With flat subtraction, a high defense left every enemy dealing the 1 damage floor. */
function dmgCalc(atk, def, pow, mult, critPct) {
  const crit = Math.random() * 100 < critPct;
  const rnd = 0.9 + Math.random() * 0.2;
  const mitig = 100 / (100 + Math.max(0, def));
  const d = (atk * pow / 45) * mult * rnd * (crit ? 1.6 : 1) * mitig;
  return { d: Math.max(1, Math.round(d)), crit: crit };
}
function heroAct(mid) {
  if (!B || B.over || B.busy) return;
  const a = moveById(mid);
  if (!a) return;
  /* While a charge is held, any button releases it — and that release is
     already paid for, so it costs no second use. */
  if (B.charging) {
    const c = moveById(B.charging); B.charging = null;
    B.busy = true;
    resolveHero(c, true);
    return;
  }
  if (ppLeft(mid) <= 0) { toast(tr('w_nouses')); return; }
  B.busy = true;
  ppSpend(mid);
  if (a.kind === 'charge') {
    B.charging = mid;
    B.log.push({ t: 'you', m: 'You charge ' + a.n + '... the air gets heavy.' });
    updateBattle(); setTimeout(foeTurn, 700);
    return;
  }
  resolveHero(a, false);
}
function resolveHero(a, charged) {
  const atk = B.hs.atk * B.atkBuff;
  let dealt = 0, wasCrit = false, mult = 1;
  /* Support never misses. A heal that whiffs is not tension, it is just
     annoying, and these are the moves you earned by not skipping. */
  if (a.pow) {
    const ch = hitChance(moveAcc(a), B.vel, B.fvel);
    if (Math.random() * 100 >= ch) {
      B.log.push({ t: 'you', m: a.n + ' — ' + tr('w_you_miss') });
      fx('foe', tr('w_miss_s'), 'miss');
      updateBattle();
      setTimeout(foeTurn, 760);
      return;
    }
  }
  if (a.kind === 'heal') {
    const h = Math.round(B.max * a.heal / 100);
    B.hp = Math.min(B.max, B.hp + h);
    B.log.push({ t: 'you', m: a.n + ': you recover ' + h + ' HP.' });
    fx('hero', '+' + h, 'heal');
  } else if (a.kind === 'buffA') {
    B.atkBuff = Math.min(2.2, B.atkBuff * 1.35);
    B.log.push({ t: 'you', m: a.n + ': your Attack rises.' });
    fx('hero', 'ATK ↑', 'buff');
  } else if (a.kind === 'buffD') {
    B.defBuff = Math.min(2.5, B.defBuff * 1.45);
    B.log.push({ t: 'you', m: a.n + ': your Defense rises.' });
    fx('hero', 'DEF ↑', 'buff');
  } else if (a.kind === 'multi') {
    const hits = 2 + Math.floor(Math.random() * 3);
    mult = typeMult(a.t, B.foe.t);
    const cc = critChance(B.hs.crit, B.vel, B.fvel);
    for (let i = 0; i < hits; i++) dealt += dmgCalc(atk, B.foe.def, a.pow, mult, cc).d;
    B.fhp -= dealt;
    B.log.push({ t: 'you', m: a.n + ' hits ' + hits + ' times for ' + dealt + '. ' + multTxt(mult) });
    fx('foe', '-' + dealt, mult > 1 ? 'super' : 'dmg');
    shake('foe');
  } else {
    mult = typeMult(a.t, B.foe.t);
    const r = dmgCalc(atk, B.foe.def, a.pow, mult, critChance(B.hs.crit + (a.crit || 0), B.vel, B.fvel));
    dealt = r.d; wasCrit = r.crit;
    B.fhp -= dealt;
    B.log.push({ t: 'you', m: (charged ? 'ANVIL DROP! ' : '') + a.n + ' deals ' + dealt + '.' +
      (r.crit ? ' ' + tr('w_crit') : '') + ' ' + multTxt(mult) });
    fx('foe', '-' + dealt, r.crit ? 'crit' : (mult > 1 ? 'super' : 'dmg'));
    shake('foe');
    if (r.crit) flash();
  }
  updateBattle();
  if (B.fhp <= 0) { setTimeout(() => endBattle(true), 750); return; }
  setTimeout(foeTurn, 780);
}
function foeTurn() {
  if (!B || B.over) return;
  /* Being faster than the thing in front of you is worth something, and this
     is where you feel it. */
  if (Math.random() * 100 >= hitChance(92, B.fvel, B.vel)) {
    B.log.push({ t: 'foe', m: tr('w_foe_miss').replace('{n}', B.foe.n) });
    fx('hero', tr('w_miss_s'), 'miss');
    B.turn++; B.busy = false; updateBattle();
    return;
  }
  const r = dmgCalc(B.foe.atk, B.hs.def * B.defBuff, 45, 1, critChance(6, B.fvel, B.vel));
  B.hp -= r.d;
  B.log.push({ t: 'foe', m: B.foe.n + ' attacks for ' + r.d + '.' + (r.crit ? ' Critical!' : '') });
  fx('hero', '-' + r.d, r.crit ? 'crit' : 'dmg');
  shake('hero');
  updateBattle();
  if (B.hp <= 0) { setTimeout(() => endBattle(false), 750); return; }
  B.turn++; B.busy = false; updateBattle();
}
function useItem() {
  if (!B || B.over || B.busy) return;
  const r = rpg();
  if (!r.items.shake) { toast('No shakes left'); return; }
  r.items.shake--; if (!r.items.shake) delete r.items.shake; save();
  B.busy = true;
  const h = Math.round(B.max * 0.45);
  B.hp = Math.min(B.max, B.hp + h);
  B.log.push({ t: 'you', m: 'Protein Shake: +' + h + ' HP.' });
  fx('hero', '+' + h, 'heal');
  updateBattle(); setTimeout(foeTurn, 780);
}
function endBattle(win) {
  B.over = true;
  const r = rpg(), c = B.ctx;
  r.hp = Math.max(0, B.hp);     /* health leaves the fight with you */
  if (win) {
    r.gold = (r.gold || 0) + (B.foe.gold || 0);
    r.kills[c.mobId || B.foe.n] = (r.kills[c.mobId || B.foe.n] || 0) + 1;
    let extra = '';
    if (c.boss && r.bosses.indexOf(c.boss) < 0) {
      r.bosses.push(c.boss);
      const it = BOSSES[c.boss].item;
      r.items[it] = (r.items[it] || 0) + 1;
      extra = 'Loot: ' + ITEMS[it].n;
    }
    if (c.dungeon && c.guard) {
      const d = DUNGEONS[c.dungeon];
      r.dungeons[c.dungeon] = 'cleared';
      r.items[d.item] = (r.items[d.item] || 0) + 1;
      extra = 'Treasure: ' + ITEMS[d.item].n;
    } else if (c.dungeon && c.floor != null) {
      r.dungeons[c.dungeon] = Math.max(+(r.dungeons[c.dungeon] || 0) || 0, c.floor + 1);
    }
    save();
    B.result = { win: true, gold: B.foe.gold || 0, extra: extra };
  } else {
    save();
    B.result = { win: false };
  }
  updateBattle();
}

/* ---------------- battle visuals ---------------- */
let _ov = null;      /* cached so we never build a second overlay */
let drawnId = 0;     /* which battle the shell was built for — a plain variable,
                        never the DOM, so drawBattle/updateBattle cannot recurse */
function battleOverlay() {
  if (_ov) return _ov;
  let ov = document.getElementById('battle');
  if (!ov) { ov = document.createElement('div'); ov.id = 'battle'; document.body.appendChild(ov); }
  _ov = ov;
  return ov;
}
function fx(who, text, cls) {
  const host = document.getElementById(who === 'foe' ? 'fx-foe' : 'fx-hero');
  if (!host) return;
  const s = document.createElement('span');
  s.className = 'fxnum ' + cls;
  s.textContent = text;
  s.style.left = (25 + Math.random() * 50) + '%';
  host.appendChild(s);
  setTimeout(() => { if (s.parentNode) s.parentNode.removeChild(s); }, 1100);
}
function shake(who) {
  const el2 = document.getElementById(who === 'foe' ? 'art-foe' : 'art-hero');
  if (!el2) return;
  el2.classList.remove('shake');
  void el2.offsetWidth;          /* restart the animation */
  el2.classList.add('shake');
}
function flash() {
  const ov = battleOverlay();
  ov.classList.remove('flash');
  void ov.offsetWidth;
  ov.classList.add('flash');
  setTimeout(() => ov.classList.remove('flash'), 300);
}

/* full render — builds the shell once per battle so animations survive.

   The middle of this screen used to be a text log with a small procedural
   badge above it, which meant the thing you were fighting was a word. Now the
   middle is a stage with both creatures standing on it, and the log is a strip
   underneath. Everything that moves — the bob, the shake, the floating
   numbers — hangs off this shell, so it is built once and then only updated. */
function drawBattle() {
  const ov = battleOverlay();
  if (!B) { ov.classList.remove('on'); ov.innerHTML = ''; drawnId = 0; return; }
  ov.classList.add('on');
  drawnId = B.id;
  const tc = TYPES[B.foe.t].c;
  ov.innerHTML =
    '<div class="bwrap">' +
      '<div class="bstage">' +
        '<div class="fxlayer fxf" id="fx-foe"></div>' +
        '<div class="fxlayer fxh" id="fx-hero"></div>' +
        '<div class="plate pfoe" id="card-foe">' +
          '<div class="prow"><span class="pn">' + esc(B.foe.n) + '</span><span class="phv mono" id="fhp"></span></div>' +
          '<div class="hpbar"><i id="fbar" style="background:' + tc + '"></i></div>' +
          '<div class="pdet mono" style="color:' + tc + '">' + TYPES[B.foe.t].n.toUpperCase() +
            ' · ' + tr('w_spd') + ' ' + B.fvel + '</div>' +
        '</div>' +
        '<div class="cart cfoe" id="art-foe">' + creatureArt(B.foe, 118) + '</div>' +
        '<div class="cart chero" id="art-hero">' + heroArt(96) + '</div>' +
        '<div class="plate phero" id="card-hero">' +
          '<div class="prow"><span class="pn">You · Lv ' + B.g.level + '</span><span class="phv mono" id="hhp"></span></div>' +
          '<div class="hpbar"><i id="hbar"></i></div>' +
          '<div class="pdet mono" id="hstats"></div>' +
        '</div>' +
      '</div>' +
      '<div class="blog" id="blog"></div>' +
      '<div id="bactions"></div>' +
    '</div>';
  updateBattle();
}
function updateBattle() {
  const ov = battleOverlay();
  if (!B) return;
  if (drawnId !== B.id) { drawBattle(); return; }

  const fp = clamp(B.fhp / B.fmax * 100, 0, 100);
  const hp = clamp(B.hp / B.max * 100, 0, 100);
  const fbar = document.getElementById('fbar'); if (fbar) fbar.style.width = fp + '%';
  const hbar = document.getElementById('hbar');
  if (hbar) {
    hbar.style.width = hp + '%';
    hbar.style.background = hp > 50 ? 'var(--good)' : hp > 20 ? 'var(--warn)' : 'var(--bad)';
  }
  const fhp = document.getElementById('fhp');
  if (fhp) fhp.textContent = Math.max(0, B.fhp) + ' / ' + B.fmax;
  const hhp = document.getElementById('hhp');
  if (hhp) hhp.textContent = Math.max(0, B.hp) + ' / ' + B.max;
  const hs = document.getElementById('hstats');
  if (hs) {
    hs.textContent = 'ATK ' + Math.round(B.hs.atk * B.atkBuff) +
      ' · DEF ' + Math.round(B.hs.def * B.defBuff) + ' · ' + tr('w_spd') + ' ' + B.vel;
    /* a buff that does not show is a buff you cannot plan around */
    hs.style.color = (B.atkBuff > 1 || B.defBuff > 1) ? 'var(--acc)' : '';
  }
  /* a creature at zero health stops standing up */
  const fa = document.getElementById('art-foe');
  if (fa) fa.style.opacity = B.fhp <= 0 ? '.25' : '1';
  const ha = document.getElementById('art-hero');
  if (ha) ha.style.opacity = B.hp <= 0 ? '.25' : '1';

  const lg = document.getElementById('blog');
  if (lg) {
    lg.innerHTML = B.log.slice(-6).map(l => '<div class="ll ' + l.t + '">' + esc(l.m) + '</div>').join('');
    lg.scrollTop = lg.scrollHeight;
  }

  const act = document.getElementById('bactions');
  if (!act) return;
  const r = rpg();
  if (B.over) {
    const R = B.result;
    act.innerHTML = '<div class="bend">' + (R.win ?
      '<div class="h-md" style="color:var(--good)">' + tr('w_victory') + '</div>' +
      '<div class="sub">+' + R.gold + ' ' + tr('w_shards') + (R.extra ? ' · <b style="color:var(--acc)">' + esc(R.extra) + '</b>' : '') + '</div>' :
      '<div class="h-md" style="color:var(--bad)">' + tr('w_defeat') + '</div>' +
      '<div class="sub">' + tr('w_lost_hp') + '</div>') +
      '<div class="row" style="margin-top:12px">' +
      (R.win && B.ctx.repeat ? '<button class="btn p" id="bagain">' + tr('w_again') + '</button>' : '') +
      '<button class="btn' + (R.win && B.ctx.repeat ? ' gh' : ' p') + '" id="bclose">' + tr('w_leave') + '</button></div></div>';
  } else {
    /* every move empty leaves you your bare hands, so a fight is never a
       dead end — only a bad one */
    const dry = ppDry(B.g);
    const mv = dry ? ['bare'] : activeMoves(B.g);
    act.innerHTML = (dry ? '<div class="note w" style="margin-bottom:8px">' + tr('w_bare_d') + '</div>' : '') +
    '<div class="bmoves">' + mv.map(id => {
      const a = moveById(id);
      const m = a.pow ? typeMult(a.t, B.foe.t) : 1;
      const tag = a.pow ? (m > 1 ? '<span class="eff up2">×2</span>' : m < 1 ? '<span class="eff dn">×½</span>' : '') : '';
      const left = ppLeft(id), max = movePP(id), out = left <= 0;
      const ppTxt = id === 'bare' ? '∞' : left + '/' + max;
      return '<button class="mv' + (out ? ' out' : '') + '" data-mv="' + id + '"' + (B.busy || out ? ' disabled' : '') + '>' +
        '<span class="spread"><span class="mvn">' + esc(id === 'bare' ? tr('w_bare') : a.n) + ' ' + tag + '</span>' +
        '<span class="pp' + (!out && left <= 2 && id !== 'bare' ? ' low' : '') + '">' + ppTxt + '</span></span>' +
        '<span class="mvt" style="color:' + TYPES[a.t].c + '">' + TYPES[a.t].n +
        (a.pow ? ' · ' + a.pow + ' · ' + moveAcc(a) + '%' : ' · ' + tr('w_support')) + '</span></button>';
    }).join('') + '</div>' +
    '<div class="row" style="margin-top:8px">' +
    '<button class="btn sm" id="bitem"' + (B.busy || !r.items.shake ? ' disabled' : '') + '>' + tr('w_shake') + ' (' + (r.items.shake || 0) + ')</button>' +
    '<button class="btn sm gh" id="bflee">' + tr('w_flee') + '</button>' +
    '<span class="tiny mono" style="margin-left:auto">' + tr('w_turn') + ' ' + B.turn + '</span></div>';
  }

  $$('#battle [data-mv]').forEach(b => b.onclick = () => heroAct(b.dataset.mv));
  const bi = document.getElementById('bitem'); if (bi) bi.onclick = useItem;
  /* running away still costs you the health you already lost */
  const bf = document.getElementById('bflee');
  if (bf) bf.onclick = () => { rpg().hp = Math.max(0, B.hp); save(); B = null; drawBattle(); rQuest(); };
  const bc = document.getElementById('bclose'); if (bc) bc.onclick = () => { const c = B.ctx; B = null; drawBattle(); afterBattle(c); };
  const ba = document.getElementById('bagain'); if (ba) ba.onclick = () => { const c = B.ctx; B = null; drawBattle(); startBattle(Object.assign({}, MOBS[c.mobId]), c); };
}
function afterBattle(c) {
  if (c && c.dungeon && !c.guard) { openDungeon(c.dungeon); return; }
  rQuest();
}

/* ---------------- injected combat styles ---------------- */
(function injectCSS() {
  try {
    const s = document.createElement('style');
    s.textContent =
      '#battle{position:fixed;inset:0;z-index:120;background:rgba(4,5,7,.97);backdrop-filter:blur(10px);' +
      'display:none;align-items:center;justify-content:center;padding:14px}' +
      '#battle.on{display:flex}' +
      '#battle.flash::after{content:"";position:absolute;inset:0;background:#fff;opacity:.16;pointer-events:none;animation:critf .3s ease-out}' +
      '@keyframes critf{from{opacity:.3}to{opacity:0}}' +
      '.bwrap{width:100%;max-width:520px;display:flex;flex-direction:column;gap:10px}' +
      /* the stage: both creatures on one floor, nameplates in opposite corners */
      '.bstage{position:relative;border:1px solid var(--line);border-radius:16px;overflow:hidden;' +
      'height:clamp(176px,27vh,228px);background:radial-gradient(120% 80% at 50% 108%,rgba(200,255,0,.07),transparent 60%),' +
      'linear-gradient(180deg,#0B0F15,#12161F)}' +
      '.bstage::after{content:"";position:absolute;left:0;right:0;bottom:30%;height:1px;background:var(--line)}' +
      /* the two creatures occupy opposite bands of the stage, and the plates
         sit in the two corners neither of them uses */
      '.cart{position:absolute;z-index:2;animation:bob 3.6s ease-in-out infinite;transition:opacity .5s}' +
      '.cart.cfoe{right:3%;bottom:35%}' +
      '.cart.chero{left:3%;bottom:2%;animation-delay:-1.8s}' +
      '@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}' +
      '.plate{position:absolute;z-index:3;width:min(55%,205px);background:rgba(10,13,18,.86);' +
      'border:1px solid var(--line);border-radius:11px;padding:7px 9px;backdrop-filter:blur(3px)}' +
      '.plate.pfoe{left:7px;top:7px}.plate.phero{right:7px;bottom:7px}' +
      '.plate .prow{display:flex;align-items:baseline;gap:7px;margin-bottom:5px}' +
      '.plate .pn{font-weight:800;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}' +
      '.plate .phv{font-size:10.5px;color:var(--dim);flex:0 0 auto}' +
      '.plate .pdet{font-size:9.5px;letter-spacing:.07em;color:var(--dim);margin-top:5px;' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.plate .hpbar{margin-top:0;height:9px}' +
      '.fxlayer{position:absolute;pointer-events:none;overflow:visible;z-index:6;width:50%;height:62%}' +
      '.fxlayer.fxf{right:0;top:4%}.fxlayer.fxh{left:0;bottom:4%}' +
      '.fxnum{position:absolute;top:12px;font-family:var(--mono);font-weight:800;font-size:22px;' +
      'text-shadow:0 2px 8px rgba(0,0,0,.9);animation:fxup 1.1s cubic-bezier(.2,.8,.3,1) forwards;white-space:nowrap}' +
      '.fxnum.dmg{color:#FF8A7D}.fxnum.crit{color:#FFD23D;font-size:28px}' +
      '.fxnum.miss{color:#9FB3C8;font-size:17px;letter-spacing:.08em}' +
      '.fxnum.super{color:#C8FF00;font-size:26px}.fxnum.heal{color:#38DC84}.fxnum.buff{color:#00D6FF;font-size:18px}' +
      '@keyframes fxup{0%{transform:translateY(6px) scale(.7);opacity:0}' +
      '18%{transform:translateY(-4px) scale(1.15);opacity:1}100%{transform:translateY(-42px) scale(1);opacity:0}}' +
      '.shake{animation:shk .34s cubic-bezier(.36,.07,.19,.97)}' +
      '@keyframes shk{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}' +
      '30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}' +
      '.sigwrap{animation:breathe 3.4s ease-in-out infinite}' +
      '@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}' +
      '.hpbar{height:11px;border-radius:99px;background:#0A0C10;overflow:hidden;margin-top:9px;border:1px solid var(--line)}' +
      '.hpbar>i{display:block;height:100%;width:100%;border-radius:99px;transition:width .5s cubic-bezier(.4,0,.2,1),background .3s}' +
      '.blog{background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:9px 12px;' +
      'height:clamp(62px,11vh,96px);overflow-y:auto;font-size:12.5px;line-height:1.5}' +
      '.ll{margin-bottom:4px;animation:llin .25s ease}' +
      '@keyframes llin{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:none}}' +
      '.ll.you{color:var(--acc)}.ll.foe{color:#FF8A7D}.ll.sys{color:var(--dim);font-style:italic}' +
      '.bmoves{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
      '.mv{background:var(--surf2);border:1px solid var(--line);border-radius:11px;padding:11px 12px;text-align:left;' +
      'cursor:pointer;font:inherit;color:var(--tx);display:flex;flex-direction:column;gap:3px;transition:.13s}' +
      '.mv:hover:not(:disabled){border-color:var(--acc);background:#1D222A;transform:translateY(-1px)}' +
      '.mv:active:not(:disabled){transform:translateY(1px)}' +
      '.mv:disabled{opacity:.4;cursor:not-allowed}' +
      '.mv.out{opacity:.32;border-style:dashed}' +
      '.mvn{font-weight:800;font-size:13px}.mvt{font-family:var(--mono);font-size:10px;letter-spacing:.06em}' +
      /* uses left, in the corner of every move, because it is the number you
         are actually budgeting */
      '.pp{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--dim);flex:0 0 auto;margin-left:6px}' +
      '.pp.low{color:var(--warn)}' +
      '.ppbar{display:flex;gap:3px;margin-top:5px}' +
      '.ppbar i{flex:1;height:4px;border-radius:99px;background:var(--acc)}' +
      '.ppbar i.off{background:var(--line)}' +
      '.eff{font-family:var(--mono);font-size:10px;padding:1px 5px;border-radius:99px;margin-left:3px}' +
      '.eff.up2{background:rgba(56,220,132,.2);color:var(--good)}' +
      '.eff.dn{background:rgba(255,74,61,.18);color:var(--bad)}' +
      '.bend{background:var(--surf);border:1px solid var(--acc);border-radius:14px;padding:16px;text-align:center;animation:llin .3s ease}' +
      '.node{background:var(--bg2);border:1px solid var(--line);border-radius:13px;padding:14px;margin-bottom:9px;' +
      'display:flex;gap:12px;align-items:center;cursor:pointer;transition:.14s}' +
      '.node:hover{border-color:var(--dim);transform:translateY(-1px)}.node.lock{opacity:.45;cursor:not-allowed}' +
      '.node.lock:hover{transform:none}' +
      '.node.dung{border-color:rgba(139,92,246,.4);background:rgba(139,92,246,.06)}' +
      '.node.boss{border-color:rgba(255,74,61,.4);background:rgba(255,74,61,.05)}' +
      '.trial{border:1px solid var(--line);border-radius:12px;background:var(--bg2);padding:13px;margin-bottom:9px}' +
      '.trial.done{border-color:rgba(56,220,132,.3)}' +
      '.lvlbadge{width:44px;height:44px;flex:0 0 44px;border-radius:11px;background:linear-gradient(145deg,#C8FF00,#7FA300);' +
      'display:grid;place-items:center;color:#0A0C05;font-family:var(--mono);font-size:17px;font-weight:800}' +
      '.lvlbadge.big{width:72px;height:72px;flex:0 0 72px;border-radius:18px;font-size:30px;font-weight:900}' +
      '.subnav{display:flex;gap:6px;margin-bottom:16px;background:var(--bg2);padding:5px;border-radius:12px;border:1px solid var(--line)}' +
      '.subnav button{flex:1;background:none;border:0;color:var(--dim);font:inherit;font-weight:800;font-size:12px;' +
      'letter-spacing:.1em;text-transform:uppercase;padding:10px 6px;border-radius:8px;cursor:pointer;transition:.14s}' +
      '.subnav button.on{background:var(--acc);color:#0A0C05}' +
      '.subnav button:not(.on):hover{color:var(--tx)}';
    (document.head || document.documentElement).appendChild(s);
  } catch (e) { console.warn('could not inject battle CSS', e); }
})();

/* ================= QUEST TAB ================= */
function rQuest() {
  const g = computeGame();
  let h = '';

  /* the one thing to do next — always visible */
  const ns = nextStep(g);
  h += '<div class="card acc"><div class="spread" style="align-items:flex-start;gap:14px">' +
    '<div style="flex:1;min-width:0"><div class="sec-t" style="margin-bottom:6px">Next step</div>' +
    '<div class="h-md">' + esc(ns.t) + '</div>' +
    '<p class="sub" style="margin-top:6px">' + esc(ns.d) + '</p></div></div>' +
    '<button class="btn p" id="nsgo" style="margin-top:12px">' + esc(ns.btn) + '</button></div>';

  h += '<div class="subnav">' +
    ['map', 'hero', 'trials'].map(k =>
      '<button data-q="' + k + '" class="' + (questTab === k ? 'on' : '') + '">' +
      ({ map: 'Map', hero: 'Hero', trials: 'Trials' })[k] + '</button>').join('') + '</div>';

  if (questTab === 'hero') h += heroHTML(g);
  else if (questTab === 'trials') h += trialsHTML(g);
  else h += mapHTML(g);

  $('#v-quest').innerHTML = h;

  const go = $('#nsgo');
  if (go) go.onclick = () => {
    if (ns.sub) questTab = ns.sub;
    if (ns.go === 'quest') rQuest(); else go(ns.go);
  };
  $$('[data-q]').forEach(b => b.onclick = () => { questTab = b.dataset.q; rQuest(); });
  if (questTab === 'map') wireMap(g);
}

function mapHTML(g) {
  const r = rpg();
  const en = energy(g), hs = heroStats(g);
  const canFight = en >= 1, canBoss = en >= 3;
  let h = '';

  /* first-time explainer, dismissible */
  if (!r.tut) {
    h += '<div class="card"><div class="sec-t">How this works</div>' +
      '<div class="cue"><b>1.</b> Train and log your sets. Each set gives <b>+1 &#9889; Energy</b>, each finished session <b>+5</b>. The meter below always shows the full maths.</div>' +
      '<div class="cue"><b>2.</b> Spend Energy fighting on the map. A normal fight costs 1, a boss 3.</div>' +
      '<div class="cue"><b>3.</b> Winning gives <b>shards</b> and <b>gear</b>. It never gives XP — your level only comes from the gym.</div>' +
      '<div class="cue"><b>4.</b> Beat a region boss to open the next region and continue the story.</div>' +
      '<button class="btn sm w" id="tutok" style="margin-top:12px">Got it</button></div>';
  }

  h += energyCard(g);

  const hp = heroHP(hs), dry = ppDry(g), hurt = hp < hs.hp;
  h += '<div class="card"><div class="sec-t">Your battle stats</div>' +
    '<div class="grid g4">' +
    st(hp + '<span style="font-size:.6em;color:var(--dim)">/' + hs.hp + '</span>', tr('w_hp')) +
    st(hs.atk, 'Attack') + st(hs.def, 'Defense') + st(hs.vel, tr('w_spd')) + '</div>' +
    '<div class="tiny mono" style="margin-top:10px">CRIT ' + hs.crit + '%</div>' +
    '<p class="tiny" style="margin-top:8px">' + tr('w_agility') + '</p>' +
    ((hurt || dry) ? '<div class="note w" style="margin-top:11px">' +
      (hp <= 0 ? tr('w_down') : (dry ? tr('w_bare_d') : tr('w_wounded') + ' — ' + tr('w_tavern_sub'))) + '</div>' : '') +
    '<div class="row wrap" style="margin-top:14px">' +
    '<button class="btn sm' + (hurt || dry ? ' p' : '') + '" id="wtav">' + tr('w_tavern') + '</button>' +
    '<button class="btn sm" id="wequip">Gear</button>' +
    '<button class="btn sm" id="wshop">Shop</button>' +
    '<button class="btn sm" id="wmoves">Attacks</button></div></div>';

  /* region picker */
  h += '<div class="row wrap" style="margin-bottom:12px">' + REGIONS.map((rg, i) => {
    const open = regionOpen(rg, g);
    const done = r.bosses.indexOf(rg.boss) >= 0;
    return '<button class="btn sm ' + (i === curRegion ? 'p' : 'gh') + '" data-rg="' + i + '"' +
      (open ? '' : ' disabled') + '>' + (open ? (done ? '✓ ' : '') + (i + 1) : '🔒 ' + rg.lvl) + '</button>';
  }).join('') + '</div>';

  const reg = REGIONS[clamp(curRegion, 0, REGIONS.length - 1)];
  if (!regionOpen(reg, g)) {
    return h + '<div class="card"><div class="h-md">Region locked</div>' +
      '<p class="sub">' + esc(regionBlockReason(reg, g)) + '</p></div>';
  }
  const bossDown = r.bosses.indexOf(reg.boss) >= 0;

  h += '<div class="card"><div class="spread"><div class="sec-t" style="margin:0">Region ' + (REGIONS.indexOf(reg) + 1) + ' of 6</div>' +
    '<span class="pill ' + (bossDown ? 'good' : '') + '">' + (bossDown ? 'cleared' : 'contested') + '</span></div>' +
    '<div class="h-lg" style="font-size:clamp(20px,5vw,28px);margin:8px 0 10px">' + esc(reg.n) + '</div>' +
    '<p class="sub">' + esc(bossDown ? reg.end : reg.intro) + '</p></div>';

  h += '<div class="card"><div class="spread"><div class="sec-t" style="margin:0">Creatures</div>' +
    '<span class="echip">&#9889; 1 each</span></div>' +
    (canFight ? '' : '<div class="note w" style="margin-bottom:12px">No energy left. Log a set and you can fight again.</div>');
  reg.mobs.forEach(id => {
    const m = MOBS[id], k = r.kills[id] || 0;
    h += '<div class="node' + (canFight ? '' : ' lock') + '"' + (canFight ? ' data-mob="' + id + '"' : '') + '>' + sigil(m.n, m.t, 46) +
      '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14.5px">' + esc(m.n) + '</div>' +
      '<div class="tiny mono">' + m.hp + ' HP · ATK ' + m.atk + ' · DEF ' + m.def + ' · +' + m.gold + ' shards</div></div>' +
      '<div style="text-align:right"><span class="pill" style="color:' + TYPES[m.t].c + ';border-color:' + TYPES[m.t].c + '55">' + TYPES[m.t].n + '</span>' +
      (k ? '<div class="tiny mono" style="margin-top:4px">×' + k + '</div>' : '') + '</div></div>';
  });
  h += '</div>';

  if (reg.dung) {
    const d = DUNGEONS[reg.dung], open = d.cond(g), cleared = r.dungeons[reg.dung] === 'cleared';
    h += '<div class="card"><div class="sec-t">Secret dungeon</div>' +
      '<div class="node dung' + (open ? '' : ' lock') + '"' + (open ? ' data-dung="' + reg.dung + '"' : '') + '>' +
      sigil(d.n, 'shadow', 46) +
      '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14.5px">' + (open ? esc(d.n) : '???') + '</div>' +
      '<div class="tiny">' + (open ? (cleared ? 'Cleared · treasure claimed' : '3 floors + guardian · 2 energy per floor') : esc(d.ct)) + '</div></div>' +
      '<span class="pill ' + (cleared ? 'good' : open ? 'up' : '') + '">' + (cleared ? '✓' : open ? 'open' : 'sealed') + '</span></div>' +
      (open ? '<p class="tiny" style="margin-top:10px">' + esc(d.lore) + '</p>' +
        '<div class="note" style="margin-top:10px">Reward: <b style="color:var(--acc)">' + esc(ITEMS[d.item].n) + '</b> — ' + esc(ITEMS[d.item].d) + '</div>' :
        '<div class="note w" style="margin-top:10px">Dungeons do not unlock with levels. They unlock with how you train.</div>') +
      '</div>';
  }

  const bs = BOSSES[reg.boss];
  h += '<div class="card"><div class="spread"><div class="sec-t" style="margin:0">Region boss</div>' +
    '<span class="echip">&#9889; 3</span></div>' +
    '<div class="node boss' + (canBoss ? '' : ' lock') + '"' + (canBoss ? ' data-boss="' + reg.boss + '"' : '') + '>' + sigil(bs.n, bs.t, 54) +
    '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:15px;color:' + (bossDown ? 'var(--good)' : 'var(--tx)') + '">' +
    (bossDown ? '✓ ' : '') + esc(bs.n) + '</div>' +
    '<div class="tiny mono">' + bs.hp + ' HP · ATK ' + bs.atk + ' · DEF ' + bs.def + '</div></div>' +
    '<span class="pill" style="color:' + TYPES[bs.t].c + ';border-color:' + TYPES[bs.t].c + '55">' + TYPES[bs.t].n + '</span></div>' +
    '<p class="tiny" style="margin-top:10px">' + esc(bs.lore) + '</p>' +
    (bossDown ? '' : '<div class="note" style="margin-top:10px">Beating it drops <b style="color:var(--acc)">' + esc(ITEMS[bs.item].n) + '</b> and opens the next region.</div>') +
    '</div>';

  return h;
}
function wireMap(g) {
  $$('[data-rg]').forEach(b => b.onclick = () => { curRegion = +b.dataset.rg; rQuest(); });
  $$('[data-mob]').forEach(n => n.onclick = () => {
    const id = n.dataset.mob;
    startBattle(Object.assign({}, MOBS[id]), { mobId: id, cost: 1, repeat: true });
  });
  $$('[data-boss]').forEach(n => n.onclick = () => {
    const id = n.dataset.boss;
    startBattle(Object.assign({}, BOSSES[id]), { boss: id, cost: 3 });
  });
  $$('[data-dung]').forEach(n => n.onclick = () => openDungeon(n.dataset.dung));
  const t = $('#tutok'); if (t) t.onclick = () => { rpg().tut = true; save(); rQuest(); };
  const tv = $('#wtav'); if (tv) tv.onclick = openTavern;
  const e = $('#wequip'); if (e) e.onclick = openEquip;
  const s = $('#wshop'); if (s) s.onclick = openShop;
  const m = $('#wmoves'); if (m) m.onclick = openMoves;
}

/* ---------------- dungeons ---------------- */
function openDungeon(id) {
  const d = DUNGEONS[id], r = rpg();
  const prog = r.dungeons[id];
  if (prog === 'cleared') {
    modal('<div class="h-md">' + esc(d.n) + '</div><p class="sub" style="margin:8px 0 14px">Already cleared. The treasure was yours: <b style="color:var(--acc)">' + esc(ITEMS[d.item].n) + '</b>.</p>' +
      '<button class="btn p w" id="xclose">Close</button>');
    $('#xclose').onclick = closeModal; return;
  }
  const floor = +(prog || 0);
  if (floor >= d.floors.length) {
    modal('<div class="sec-t">' + esc(d.n) + ' · Final chamber</div>' +
      '<div style="text-align:center;margin:14px 0;display:flex;justify-content:center">' + sigil(d.guard.n, d.guard.t, 92) + '</div>' +
      '<div class="h-md" style="text-align:center">' + esc(d.guard.n) + '</div>' +
      '<p class="sub" style="text-align:center;margin:6px 0 14px">' + d.guard.hp + ' HP · costs 4 energy</p>' +
      '<button class="btn p w" id="xgo" style="margin-bottom:8px">Face it</button>' +
      '<button class="btn gh w" id="xclose">Retreat</button>');
    $('#xclose').onclick = closeModal;
    $('#xgo').onclick = () => { closeModal(); startBattle(Object.assign({}, d.guard), { dungeon: id, guard: true, cost: 4 }); };
    return;
  }
  const pool = d.floors[floor];
  const mid = pool[Math.floor(Math.random() * pool.length)];
  modal('<div class="sec-t">' + esc(d.n) + ' · Floor ' + (floor + 1) + ' of ' + d.floors.length + '</div>' +
    '<p class="sub" style="margin-bottom:14px">' + esc(d.lore) + '</p>' +
    '<div class="node" style="cursor:default">' + sigil(MOBS[mid].n, MOBS[mid].t, 46) +
    '<div style="flex:1"><div style="font-weight:800">' + esc(MOBS[mid].n) + '</div>' +
    '<div class="tiny mono">' + MOBS[mid].hp + ' HP · blocks the way</div></div></div>' +
    '<button class="btn p w" id="xgo" style="margin:12px 0 8px">Advance (2 energy)</button>' +
    '<button class="btn gh w" id="xclose">Retreat</button>');
  $('#xclose').onclick = closeModal;
  $('#xgo').onclick = () => {
    closeModal();
    startBattle(Object.assign({}, MOBS[mid]), { mobId: mid, dungeon: id, floor: floor, cost: 2 });
  };
}

/* ---------------- the tavern ----------------
   The one place that gives anything back. One energy buys a full night: all
   your health, and every attack back to its full number of uses. It is free
   once after each session you close, because the thing this whole app is for
   is the thing that should also be the thing that heals you. */
function tavernState(g) {
  const hs = heroStats(g), r = rpg();
  const moves = activeMoves(g);
  return {
    hs: hs, hp: heroHP(hs), max: hs.hp, moves: moves,
    free: restFree(g), energy: energy(g),
    full: heroHP(hs) >= hs.hp && moves.every(id => ppLeft(id) >= movePP(id))
  };
}
function openTavern() {
  const g = computeGame(), t = tavernState(g);
  const pct = clamp(t.hp / t.max * 100, 0, 100);
  const can = t.full ? false : (t.free || t.energy >= 1);
  let h = '<div class="spread" style="margin-bottom:10px"><div class="h-md">' + tr('w_tavern_n') + '</div>' +
    '<button class="btn sm gh" id="xclose">×</button></div>' +
    '<div style="display:flex;justify-content:center;margin:2px 0 10px">' + tavernArt(96) + '</div>' +
    '<p class="sub" style="margin-bottom:14px">' + tr('w_tavern_d') + '</p>' +
    '<div class="sec-t">' + tr('w_your_hp') + '</div>' +
    '<div class="hpbar" style="margin-bottom:6px"><i style="width:' + pct + '%;background:' +
      (pct > 50 ? 'var(--good)' : pct > 20 ? 'var(--warn)' : 'var(--bad)') + '"></i></div>' +
    '<div class="tiny mono" style="margin-bottom:16px">' + t.hp + ' / ' + t.max + ' ' + tr('w_hp') + '</div>' +
    '<div class="sec-t">' + tr('w_uses') + '</div>';
  t.moves.forEach(id => {
    const a = ATTACKS[id]; if (!a) return;
    const left = ppLeft(id), max = movePP(id);
    let bars = '';
    for (let i = 0; i < max; i++) bars += '<i class="' + (i < left ? '' : 'off') + '"></i>';
    h += '<div style="margin-bottom:11px"><div class="spread">' +
      '<span style="font-size:13.5px;font-weight:700">' + esc(a.n) + '</span>' +
      '<span class="mono tiny' + (left === 0 ? '" style="color:var(--bad)' : (left <= 2 ? '" style="color:var(--warn)' : '')) + '">' +
        left + ' / ' + max + '</span></div>' +
      '<div class="ppbar">' + bars + '</div></div>';
  });
  h += '<div class="note' + (t.free ? '' : ' w') + '" style="margin:14px 0 12px">' +
    (t.full ? tr('w_already_full') : (t.free ? tr('w_rest_why') : tr('w_tavern_sub_cost'))) + '</div>' +
    '<button class="btn p w" id="xrest"' + (can ? '' : ' disabled') + '>' +
      (t.free ? tr('w_rest_free') : tr('w_rest_cost')) + '</button>';
  modal(h);
  $('#xclose').onclick = closeModal;
  const rb = $('#xrest');
  if (rb) rb.onclick = () => {
    const g2 = computeGame();
    if (tavernState(g2).full) return;
    doRest(g2);
    toast(tr('w_rested'));
    closeModal(); rQuest();
  };
}

/* ---------------- gear, shop, attacks ---------------- */
function statLine(it) {
  return ['atk', 'def', 'vel', 'crit', 'hp'].filter(x => it[x])
    .map(x => '+' + it[x] + ' ' + ({ atk: 'ATK', def: 'DEF', vel: 'SPD', crit: 'CRIT', hp: 'HP' })[x]).join(' · ');
}
function openEquip() {
  const r = rpg(), g = computeGame(), hs = heroStats(g);
  const owned = Object.keys(r.items).filter(k => ITEMS[k] && ITEMS[k].s !== 'use');
  let h = '<div class="spread" style="margin-bottom:12px"><div class="h-md">Gear</div>' +
    '<button class="btn sm gh" id="xclose">Close</button></div>' +
    '<div class="grid g4" style="margin-bottom:14px">' +
    st(hs.hp, 'HP') + st(hs.atk, 'ATK') + st(hs.def, 'DEF') + st(hs.crit + '%', 'CRIT') + '</div>';
  ['weapon', 'armor', 'charm'].forEach(s => {
    h += '<div class="sec-t" style="margin:14px 0 8px">' + SLOT_NAMES[s] + '</div>';
    const list = owned.filter(k => ITEMS[k].s === s);
    if (!list.length) h += '<p class="tiny">Nothing yet. Bosses and dungeons drop gear.</p>';
    list.forEach(k => {
      const it = ITEMS[k], on = r.eq[s] === k;
      h += '<div class="node' + (on ? ' dung' : '') + '" data-eq="' + s + '|' + k + '">' +
        '<div style="flex:1"><div style="font-weight:800;font-size:14px">' + esc(it.n) + '</div>' +
        '<div class="tiny mono">' + statLine(it) + '</div>' +
        '<div class="tiny" style="margin-top:3px">' + esc(it.d) + '</div></div>' +
        '<span class="pill ' + (on ? 'up' : '') + '">' + (on ? 'equipped' : 'equip') + '</span></div>';
    });
  });
  const consum = Object.keys(r.items).filter(k => ITEMS[k] && ITEMS[k].s === 'use');
  if (consum.length) {
    h += '<div class="sec-t" style="margin:14px 0 8px">Consumables</div>';
    consum.forEach(k => h += '<div class="node" style="cursor:default"><div style="flex:1"><b>' + esc(ITEMS[k].n) + '</b>' +
      '<div class="tiny">' + esc(ITEMS[k].d) + '</div></div><span class="pill">×' + r.items[k] + '</span></div>');
  }
  modal(h);
  $('#xclose').onclick = closeModal;
  $$('[data-eq]').forEach(n => n.onclick = () => {
    const p = n.dataset.eq.split('|');
    r.eq[p[0]] = r.eq[p[0]] === p[1] ? null : p[1];
    save(); openEquip(); rQuest();
  });
}
function openShop() {
  const r = rpg();
  let h = '<div class="spread" style="margin-bottom:6px"><div class="h-md">The Forge</div>' +
    '<button class="btn sm gh" id="xclose">Close</button></div>' +
    '<p class="sub" style="margin-bottom:14px">You have <b style="color:var(--acc)">' + (r.gold || 0) + '</b> shards.</p>';
  SHOP.forEach(s => {
    const it = ITEMS[s.id], have = r.items[s.id] || 0;
    const can = (r.gold || 0) >= s.price && (s.stack || !have);
    h += '<div class="node' + (can ? '' : ' lock') + '"' + (can ? ' data-buy="' + s.id + '|' + s.price + '"' : '') + '>' +
      '<div style="flex:1"><div style="font-weight:800;font-size:14px">' + esc(it.n) + (have ? ' <span class="tiny">(×' + have + ')</span>' : '') + '</div>' +
      '<div class="tiny mono">' + statLine(it) + (it.heal ? 'restores ' + it.heal + '% HP' : '') + '</div>' +
      '<div class="tiny" style="margin-top:3px">' + esc(it.d) + '</div></div>' +
      '<span class="pill ' + (can ? 'up' : '') + '">' + s.price + '</span></div>';
  });
  modal(h);
  $('#xclose').onclick = closeModal;
  $$('[data-buy]').forEach(n => n.onclick = () => {
    const p = n.dataset.buy.split('|');
    if ((r.gold || 0) < +p[1]) return;
    r.gold -= +p[1]; r.items[p[0]] = (r.items[p[0]] || 0) + 1; save();
    toast('Bought: ' + ITEMS[p[0]].n); openShop(); rQuest();
  });
}
function openMoves() {
  const g = computeGame(), r = rpg();
  const un = unlockedMoves(g), act = activeMoves(g);
  let h = '<div class="spread" style="margin-bottom:6px"><div class="h-md">Attacks</div>' +
    '<button class="btn sm gh" id="xclose">Close</button></div>' +
    '<p class="sub" style="margin-bottom:10px">You take up to 4 into battle. Tap to add or remove.</p>' +
    '<div class="note" style="margin-bottom:10px">' + tr('w_moves_pp') + '</div>' +
    '<div class="note" style="margin-bottom:14px"><b>Type cycle:</b> Iron → Beast → Stone → Shadow → Spirit → Iron.<br>' +
    'Each type does <b>double</b> damage to the next one and <b>half</b> to the previous one. In battle the app marks the good picks with ×2.</div>';
  Object.keys(ATTACKS).forEach(id => {
    const a = ATTACKS[id], ok = un.indexOf(id) >= 0, on = act.indexOf(id) >= 0;
    h += '<div class="node' + (ok ? (on ? ' dung' : '') : ' lock') + '"' + (ok ? ' data-mv2="' + id + '"' : '') + '>' +
      '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14px">' + (ok ? esc(a.n) : '???') + '</div>' +
      '<div class="tiny mono" style="color:' + TYPES[a.t].c + '">' + TYPES[a.t].n +
        (a.pow ? ' · ' + tr('w_power') + ' ' + a.pow + ' · ' + moveAcc(a) + '%' : ' · ' + tr('w_support')) +
        ' · ' + movePP(id) + ' ' + tr('w_uses') + (ok ? ' (' + ppLeft(id) + ' ' + tr('w_left') + ')' : '') + '</div>' +
      '<div class="tiny" style="margin-top:3px">' + (ok ? esc(a.d) : 'Locked — ' + esc(a.ut)) + '</div></div>' +
      '<span class="pill ' + (on ? 'up' : ok ? 'good' : '') + '">' + (on ? 'equipped' : ok ? 'ready' : 'locked') + '</span></div>';
  });
  modal(h);
  $('#xclose').onclick = closeModal;
  $$('[data-mv2]').forEach(n => n.onclick = () => {
    const id = n.dataset.mv2, i = r.moves.indexOf(id);
    if (i >= 0) { if (r.moves.length > 1) r.moves.splice(i, 1); }
    else { if (r.moves.length >= 4) { toast('Maximum 4 attacks'); return; } r.moves.push(id); }
    save(); openMoves();
  });
}
