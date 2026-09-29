/* MONOLITH — program data
   3-day split — Tue: Upper A · Wed: Legs · Fri: Upper B, fixed every week
   Written for a beginner. The app reads real height, weight and age from
   Settings; nothing about any individual is hard-coded here. */

const EX = {

  /* ---------------- PUSH + PULL (upper body) ---------------- */
  bench: {
    n: 'Barbell Bench Press', g: 'Chest', sets: 3, lo: 8, hi: 10, rest: 150, kind: 'comp-up',
    inc: 2.5,
    alt: 'Machine chest press (Smith or converging) or flat dumbbell press if nobody can spot you.',
    feel: 'Chest and triceps. Never a sharp pinch at the front of the shoulder.',
    cues: [
      'Eyes directly under the bar. Feet flat and planted, slightly behind your knees.',
      'Grip: hands a bit wider than shoulder width. The bar sits on the base of your palm, not your fingers.',
      'Squeeze your shoulder blades back and down, like holding two pencils between them. Hold that ALL set.',
      'Lower the bar under control (2 seconds) until it touches your lower chest / sternum line.',
      'Elbows about 45–60° from your torso, not flared out to 90°.',
      'Breathe in on the way down, hold at the bottom, exhale on the way up.',
      'Press by driving your feet into the floor and moving the bar slightly up and back.'
    ],
    errs: [
      'Bouncing the bar off your chest: you lose the stimulus and can hurt your sternum. Touch and press, no bounce.',
      'Elbows flared to a full 90°: heavy strain on the shoulder. Tuck them in a bit.',
      'Butt coming off the bench: if that happens, the weight is too heavy.',
      'Lifting your head to watch the bar: keep the back of your head on the bench.'
    ],
    heavy: 'If the bar stalls halfway, drifts to one side, or your back suddenly arches, it is too heavy. Drop 2.5–5 kg.'
  },
  latpull: {
    n: 'Lat Pulldown', g: 'Back', sets: 3, lo: 8, hi: 12, rest: 105, kind: 'comp-up',
    inc: 2.5,
    alt: 'Assisted pull-ups on the machine.',
    feel: 'Under and beside your armpits (lats). If you only feel biceps, you are pulling with your arms.',
    cues: [
      'Set the thigh pad so it stops you lifting off the seat.',
      'Pronated grip (palms forward), slightly wider than your shoulders. Not extremely wide.',
      'Torso nearly vertical, leaning back 10–15° at most. Chest up.',
      'Before you pull: drive your shoulders DOWN (depress the shoulder blades). That is the real start of the movement.',
      'Think about driving your ELBOWS to your back pocket, not pulling the bar with your hands.',
      'Bar to your collarbone / upper chest. Never behind your neck.',
      'Come back up under control for 2–3 seconds until fully stretched.'
    ],
    errs: [
      'Swinging your torso back for momentum: if you have to rock, lower the weight.',
      'Letting the bar rip your arms up at the top: the negative is where most of the growth is.',
      'Shrugging your shoulders to your ears as you pull: shoulders down first.',
      'Bar behind the neck: unnecessary and risky for the shoulder.'
    ],
    heavy: 'If your body lifts off the seat or you need a low-back yank, drop one plate.'
  },
  incdb: {
    n: 'Incline Dumbbell Press', g: 'Upper chest', sets: 3, lo: 8, hi: 12, rest: 105, kind: 'comp-up',
    inc: 2,
    alt: 'Incline machine press.',
    feel: 'Upper chest, right below the collarbones.',
    cues: [
      'Bench at 30° (45° maximum). Steeper than that turns it into a shoulder press.',
      'Sit with the dumbbells on your thighs and "kick" them up with your knees as you lie back.',
      'Shoulder blades pinned back and down, same as bench press.',
      'Dumbbells at upper-chest height, wrists straight and stacked over your elbows.',
      'Lower until your elbows are slightly below torso level: that is where you feel the stretch.',
      'Press in a shallow "A" — the dumbbells come closer at the top but do NOT clang together.',
      'Do not slam your elbows into lockout at the top; leave a slight bend.'
    ],
    errs: [
      'Bench too steep (60°+): the front delt takes over the work.',
      'Not lowering far enough: half a rep, half a result.',
      'Wrists bent backwards: wrist pain. Knuckles point at the ceiling.',
      'Banging the dumbbells together at the top: the chest loses tension.'
    ],
    heavy: 'If you cannot control a 2-second descent or your elbows drift out of line, drop 2 kg per hand.'
  },
  seatrow: {
    n: 'Seated Cable Row', g: 'Back', sets: 3, lo: 8, hi: 12, rest: 105, kind: 'comp-up',
    inc: 2.5,
    alt: 'Chest-supported machine row.',
    feel: 'Mid-back between the shoulder blades, plus lats.',
    cues: [
      'Feet planted, knees slightly bent (not locked out).',
      'Torso upright, chest up, natural curve in your lower back.',
      'Start the pull by squeezing your shoulder blades together, then drive your elbows past your ribs.',
      'The handle arrives at navel / lower-rib height.',
      'Squeeze for 1 second at the contraction, without shrugging.',
      'Return by letting your arms straighten and your shoulder blades spread, but WITHOUT rounding your lower back.'
    ],
    errs: [
      'Rocking forward and back like a rower: your torso barely moves.',
      'Rounding your lower back on the stretch: keep your chest up.',
      'Pulling with your biceps only: think elbows, not hands.',
      'Short range: let the weight stretch you all the way forward.'
    ],
    heavy: 'If your torso travels backward more than about 10°, it is too heavy.'
  },
  latraise: {
    n: 'Lateral Raise', g: 'Side delt', sets: 3, lo: 12, hi: 15, rest: 75, kind: 'iso',
    inc: 1,
    alt: 'Cable lateral raise (better tension) or machine lateral raise.',
    feel: 'Right on the side of the shoulder. If you feel it in your neck, you are using traps.',
    cues: [
      'THIS is exercise number one for the V-taper look. High priority for you.',
      'Go LIGHT. Seriously: 4–6 kg is normal and plenty at the start.',
      'Standing, torso leaned forward about 10°, elbows locked at a very slight fixed bend.',
      'Raise out to the sides as if pouring water from a jug (pinky a touch higher than thumb).',
      'Stop at shoulder height. You do not need to go higher.',
      'Lower SLOWLY, 2–3 seconds. The lowering is half the exercise.',
      'Shoulders stay down and away from your ears the whole time.'
    ],
    errs: [
      'Too much weight plus a hip swing: the traps steal the work and the delt never grows.',
      'Shrugging as you lift.',
      'Going well above shoulder height with heavy weight.',
      'Dropping the weight in free fall on the way down.'
    ],
    heavy: 'If you have to jerk your body to start the first rep, it is too heavy. Drop to 4 kg without shame.'
  },
  preacher: {
    n: 'Preacher Curl', g: 'Biceps', sets: 3, lo: 10, hi: 12, rest: 75, kind: 'iso',
    inc: 2.5,
    alt: 'Preacher curl machine, or one arm at a time with a dumbbell on the same bench.',
    feel: 'The lower half of the biceps, right above the elbow, with a hard stretch at the bottom.',
    cues: [
      'Chest against the pad, armpits right at the top edge. If you slide down as you pull, raise the seat.',
      'Both upper arms stay flat on the pad for the whole set. That pad is the entire point: it makes cheating impossible.',
      'Lower until the elbow is ALMOST straight. Almost — do not drop into a locked elbow under load.',
      'Curl to just short of vertical and hold the squeeze for a beat.',
      'Lower for a full 2 seconds. The stretched bottom half is where this exercise earns its place.'
    ],
    errs: [
      'Elbows lifting off the pad at the top — that is just a standing curl with extra steps.',
      'Bouncing out of the bottom. Under a stretch is the most vulnerable position for the biceps tendon; never bounce it.',
      'Standing up out of the seat to grind the last rep.',
      'Wrists bending back. Keep the knuckles in line with the forearm.'
    ],
    heavy: 'Preacher curls feel much harder than standing curls at the same weight, because the pad removes every way of cheating. Expect to use clearly less than you would standing. That is correct, not a step backwards.'
  },
  triprop: {
    n: 'Cable Triceps Pushdown', g: 'Triceps', sets: 2, lo: 10, hi: 12, rest: 75, kind: 'iso',
    inc: 2.5,
    alt: 'Assisted dip machine or dumbbell skull crushers.',
    feel: 'The back of your upper arm.',
    cues: [
      'Standing, one foot slightly forward, torso leaned about 10–15°.',
      'Elbows pinned to your sides and FIXED at rib height.',
      'Only the forearm moves: extend to a soft lockout at the bottom.',
      'With a rope attachment, spread your hands apart at the end of the range.',
      'Come back up under control to roughly 90° of elbow bend, without letting your elbows drift forward.'
    ],
    errs: [
      'Using your whole body like a plank that pumps up and down.',
      'Elbows travelling forward and back.',
      'So much weight it lifts you off the floor.'
    ],
    heavy: 'If your heels come off the floor or you have to lean much further, drop one plate.'
  },

  /* ---------------- LEGS ---------------- */
  legpress: {
    n: 'Leg Press', g: 'Quads + glutes', sets: 3, lo: 8, hi: 12, rest: 150, kind: 'comp-lo',
    inc: 5,
    alt: 'Hack squat or Smith machine squat.',
    feel: 'Quads and glutes. Never a pinpoint pain in the knee or lower back.',
    cues: [
      'Feet shoulder-width, mid-platform, toes turned slightly out.',
      'Lower back and glutes STAY pinned to the backrest. That is safety point number one.',
      'Lower to roughly 90° of knee bend, or to just before your pelvis starts to lift.',
      'Push through your midfoot and heel, not your toes.',
      'Do not snap your knees into lockout at the top: leave a slight bend.',
      '2-second descent, controlled press. No bouncing.',
      'Only release the safety catches once you are set and know how to put them back.'
    ],
    errs: [
      'Going so deep your hips curl under and your lower back lifts: a real risk of a lumbar injury.',
      'Knees caving inward: push your knees out, in line with your feet.',
      'Putting your hands on your knees to help: hold the handles.',
      'Slamming your knees into lockout.'
    ],
    heavy: 'If your pelvis lifts at the bottom or you have to push on your knees with your hands, it is too heavy.'
  },
  rdl: {
    n: 'Dumbbell Romanian Deadlift', g: 'Hamstrings + glutes', sets: 3, lo: 8, hi: 10, rest: 150, kind: 'comp-lo',
    inc: 2,
    alt: 'If you doubt your technique: machine hip thrust or machine back extension. With 3 weeks of training, START with dumbbells, not a barbell.',
    feel: 'A strong stretch in the back of your thigh (hamstrings). If you feel it in your lower back, the technique is wrong.',
    cues: [
      'This is the most technical lift in the program. Start with two light dumbbells (6–10 kg each) and learn the pattern.',
      'Stand with feet hip-width, knees at a FIXED bend of about 15° (this is not a squat).',
      'HINGE at the hip: push your hips backward, as if closing a car door with your backside.',
      'The dumbbells travel down glued to your thighs, brushing your legs.',
      'Chest up, back flat and neutral. Picture a steel rod running from your head to your tailbone.',
      'Lower ONLY as far as you can keep a flat back and feel the stretch (usually just below the knee).',
      'Come up by squeezing your glutes and driving your hips forward. Your back does not do the work.',
      'Breathe in at the top, hold through the descent, exhale on the way up.'
    ],
    errs: [
      'Rounding your lower back: STOP the set immediately. Drop the weight and shorten the range.',
      'Turning it into a squat (bending the knees a lot): the knee barely moves.',
      'Letting the dumbbells drift away from your body: it multiplies the load on your lower back.',
      'Hyperextending your back at the top: finish standing tall, neutral, glutes squeezed.'
    ],
    heavy: 'Rule: if your back rounds even slightly, it is already too heavy. Never take this lift to failure (minimum RIR 3).'
  },
  bss: {
    n: 'Bulgarian Split Squat', g: 'Quads + glutes (single leg)', sets: 2, lo: 8, hi: 10, rest: 105, kind: 'comp-lo',
    inc: 2, uni: true,
    alt: 'Static lunges or single-leg press if balance is a real struggle.',
    feel: 'The quad and glute of the FRONT leg.',
    cues: [
      'Start with NO weight until you own the balance. Then hold light dumbbells at your sides.',
      'Top of your rear foot resting on a bench about 40 cm high.',
      'Front foot far enough forward that at the bottom your knee sits over your ankle or just past it.',
      'Lean your torso slightly forward for more glute; stay upright for more quad.',
      'Lower under control until your front thigh is close to parallel with the floor.',
      'Drive up through the HEEL of your front foot.',
      'Do all reps on one leg, rest about 30 s, then the other. The full rest comes after both.'
    ],
    errs: [
      'Front knee caving inward: think "knee toward your little toe".',
      'Front foot too close to the bench: it punishes the knee.',
      'Loading the back leg: it is only a balance point.',
      'Losing balance and stumbling: lower the weight or hold on lightly with one hand.'
    ],
    heavy: 'If you cannot do 8 clean reps without wobbling, train it with bodyweight for a few more weeks.'
  },
  legcurl: {
    n: 'Leg Curl', g: 'Hamstrings', sets: 3, lo: 10, hi: 15, rest: 75, kind: 'iso',
    inc: 2.5,
    alt: 'Seated or lying, whichever your gym has.',
    feel: 'The back of your thigh.',
    cues: [
      'Set the machine so its pivot (the hinge) lines up with your knee.',
      'The pad rests just above your heel / Achilles tendon, not on your calf.',
      'Hips stay pinned to the seat or bench the whole time.',
      'Curl and squeeze hard for 1 second at peak contraction.',
      'Return SLOWLY (2–3 s) to almost full extension, without letting the weight drop.'
    ],
    errs: [
      'Lifting your hips off the bench to cheat.',
      'Letting the weight crash back down.',
      'Partial range.'
    ],
    heavy: 'If your hips lift off, lower the weight.'
  },
  legext: {
    n: 'Leg Extension', g: 'Quads', sets: 2, lo: 10, hi: 15, rest: 75, kind: 'iso',
    inc: 2.5,
    alt: '—',
    feel: 'Quads, especially near the knee as you extend.',
    cues: [
      'Adjust the backrest so the back of your knee touches the edge of the seat.',
      'Pad on your lower shin, above the ankle.',
      'Extend to just short of lockout and squeeze for 1 second.',
      'Lower under control for 2 seconds, without letting the plates clang.',
      'Back against the pad, hold the handles.'
    ],
    errs: [
      'Kicking with momentum and dropping the weight.',
      'Lifting your glutes off the seat.',
      'So much weight you only move through a quarter of the range.'
    ],
    heavy: 'If you come off the backrest or have to kick, use less weight and more control.'
  },
  calf: {
    n: 'Calf Raise', g: 'Calves', sets: 3, lo: 12, hi: 15, rest: 75, kind: 'iso',
    inc: 5,
    alt: 'Standing machine, on the leg press, or on a step with a dumbbell.',
    feel: 'Calf, with a clear stretch at the bottom.',
    cues: [
      'Balls of your feet on the edge of the platform, heels hanging free.',
      'Drop your heels as far as you can and hold the stretch for 1–2 seconds.',
      'Rise all the way onto your toes and squeeze for 1 second at the top.',
      'Slow tempo: the calf responds to time under tension, not bouncing.',
      'Knees nearly straight (standing version).'
    ],
    errs: [
      'Fast bouncing off the tendon: zero stimulus.',
      'Short range (half up, half down).',
      'Bending your knees to help.'
    ],
    heavy: 'If you cannot pause 1 second at the top and bottom, lower the weight.'
  },
  core: {
    n: 'Core — Dead Bug + Plank', g: 'Abs / core', sets: 3, lo: 10, hi: 15, rest: 60, kind: 'iso',
    inc: 0,
    alt: 'Later on: hanging leg raises or cable crunches, once your technique is solid.',
    feel: 'Deep abs, with your lower back PRESSED into the floor.',
    cues: [
      'For you, with 3 weeks of training, the best core work is ANTI-movement: dead bugs and planks. They teach your trunk to stay rigid, which is exactly what protects your back on RDLs and leg press.',
      'DEAD BUG: on your back, arms to the ceiling, knees at 90°. Lower your right arm and left leg together, slowly, without letting your lower back lift off the floor. Return and alternate. 10–12 per side.',
      'PLANK: elbows under shoulders, glutes squeezed, ribs down, body in a straight line. 30–45 seconds of quality beats 2 minutes with your hips sagging.',
      'No endless crunches: a visible six-pack comes from body fat percentage plus a trained core, not from infinite reps.'
    ],
    errs: [
      'Lower back arched off the floor on dead bugs: shorten the range.',
      'Hips too high or sagging on the plank.',
      'Holding your breath: keep breathing throughout.'
    ],
    heavy: 'If you cannot keep your lower back on the floor, use less range or fewer reps.'
  },

  /* ---------------- more PUSH + PULL ---------------- */
  incbar: {
    n: 'Incline Press (Barbell or Machine)', g: 'Upper chest', sets: 3, lo: 8, hi: 12, rest: 150, kind: 'comp-up',
    inc: 2.5,
    alt: 'Incline machine press if nobody can spot you with a barbell.',
    feel: 'Upper chest.',
    cues: [
      'Bench at 30°. Same setup as bench press: shoulder blades back and down, feet planted.',
      'Grip slightly narrower than on flat bench.',
      'The bar comes down to your collarbones / very top of the chest.',
      'Soft touch, no bounce, then press up and slightly back on a diagonal.',
      'Elbows at ~45–60°, not fully flared.'
    ],
    errs: [
      'Bringing the bar down to mid-chest (that is just a badly done flat press).',
      'Lifting your hips off the bench.',
      'Bouncing.'
    ],
    heavy: 'If the bar stalls or tips to one side, lower the weight.'
  },
  machrow: {
    n: 'Machine or Cable Row (neutral grip)', g: 'Mid back', sets: 3, lo: 8, hi: 12, rest: 105, kind: 'comp-up',
    inc: 2.5,
    alt: 'One-arm dumbbell row supported on a bench.',
    feel: 'Between the shoulder blades and through the lats.',
    cues: [
      'Chest pressed firmly into the pad (on a chest-supported machine).',
      'Start the pull by squeezing your shoulder blades together.',
      'Elbows brushing your sides, pull back and slightly down.',
      '1-second pause at the contraction.',
      'Controlled return over 2–3 s, letting the lats stretch without losing your posture.'
    ],
    errs: [
      'Peeling your chest off the pad to move more weight.',
      'Shrugging.',
      'Making it a biceps-only movement.'
    ],
    heavy: 'If you come off the support, drop one plate.'
  },
  ohp: {
    n: 'Dumbbell Shoulder Press', g: 'Front delt', sets: 3, lo: 8, hi: 10, rest: 105, kind: 'comp-up',
    inc: 2,
    alt: 'Machine shoulder press (easier to learn).',
    feel: 'Shoulders and triceps.',
    cues: [
      'Seated with the backrest nearly vertical (80–90°), back supported.',
      'Dumbbells at ear height, elbows slightly FORWARD of your body (about 30°), not fully flared.',
      'Squeeze your glutes and brace your abs: no arching the lower back.',
      'Press up and slightly inward, without clanging the dumbbells together.',
      'Lower under control until your elbows are at shoulder height or a touch below.'
    ],
    errs: [
      'Arching your lower back hard (it becomes an incline press and hammers your spine).',
      'Elbows flared fully in line with your ears: unnecessary shoulder stress.',
      'Cutting the range short at the top.'
    ],
    heavy: 'If your back arches just to start the rep, drop 2 kg per hand.'
  },
  latpull2: {
    n: 'Lat Pulldown or Assisted Pull-up', g: 'Lats', sets: 3, lo: 8, hi: 12, rest: 105, kind: 'comp-up',
    inc: 2.5,
    alt: 'If you can do 5+ clean assisted pull-ups, use the assist machine and reduce the assistance over time.',
    feel: 'Lats.',
    cues: [
      'Same keys as the pulldown in Upper A: shoulders down first, elbows to your back pocket.',
      'On assisted pull-ups: grip slightly wider than your shoulders, chest up, no swinging.',
      'Come down under control to a full stretch before the next rep.',
      'Mid-term goal: reduce the assistance until you can do free pull-ups.'
    ],
    errs: [
      'Kipping with your legs on assisted pull-ups.',
      'Partial range.',
      'Shrugging.'
    ],
    heavy: 'On the assist machine, if you cannot reach 8 clean reps, increase the assistance (less bodyweight to lift).'
  },
  inchammer: {
    n: 'Incline Hammer Curl', g: 'Biceps + brachialis', sets: 3, lo: 10, hi: 12, rest: 75, kind: 'iso',
    inc: 1,
    alt: 'Standing hammer curl, or rope hammer curl on a cable.',
    feel: 'Biceps and the outside of your forearm, with a long stretch at the bottom of every rep. This is the one that thickens the arm seen from the front.',
    cues: [
      'Set the bench to about 45–60°. Sit back with your head and upper back against the pad.',
      'Let your arms hang straight down and slightly BEHIND your torso. That hanging position is the whole reason to do it on an incline.',
      'Neutral grip — palms facing each other, like holding two hammers — and hold that grip the whole rep.',
      'Upper arms stay still. Only the forearm moves.',
      'Curl to just short of vertical, then lower for 2 seconds until the arm hangs straight again.'
    ],
    errs: [
      'Rolling the shoulders forward so the arms hang beside you instead of behind you. That kills the stretch and turns it back into a standing curl.',
      'Swinging the dumbbells up with the shoulders.',
      'Cutting the bottom short. The stretch is the reason you are lying back at all.',
      'Setting the bench too upright. Past about 60° you lose most of the benefit.'
    ],
    heavy: 'The incline makes this harder than a standing hammer curl, because you cannot use your body at all. Start 1–2 kg per hand below what you would curl standing and earn it back.'
  },
  tripro2: {
    n: 'Cable Triceps Pushdown (rope)', g: 'Triceps', sets: 2, lo: 10, hi: 12, rest: 75, kind: 'iso',
    inc: 2.5,
    alt: 'Overhead rope triceps extension (more stretch, good complement).',
    feel: 'The back of your upper arm, especially near the elbow.',
    cues: [
      'Same as the pushdown in Upper A, but with the rope spread your hands wide at the bottom.',
      'Squeeze for 1 second at the bottom with elbows fully extended.',
      'Elbows pinned and fixed.'
    ],
    errs: ['Using bodyweight to drive it down.', 'Elbows travelling.', 'Not extending fully.'],
    heavy: 'If it lifts you off the floor, drop one plate.'
  }
};

/* ---------------- SESSIONS ---------------- */
/* Push / pull / legs. Every muscle is grouped with the ones it already helps,
   so nothing gets trained twice in a session by accident and each day has one
   clear job: press it, pull it, or stand on it. */
const SESSIONS = {
  PUSH: { id: 'PUSH', label: 'PUSH', sub: 'Chest · Shoulders · Triceps', cls: 't-up',
    ex: ['bench', 'incdb', 'ohp', 'latraise', 'triprop', 'tripro2'] },
  PULL: { id: 'PULL', label: 'PULL', sub: 'Back · Lats · Rear delts · Biceps', cls: 't-pl',
    ex: ['latpull2', 'seatrow', 'latpull', 'machrow', 'preacher', 'inchammer'] },
  LEGS: { id: 'LEGS', label: 'LEGS', sub: 'Quads · Hamstrings · Glutes · Calves · Core', cls: 't-lg',
    ex: ['legpress', 'rdl', 'bss', 'legcurl', 'legext', 'calf', 'core'] }
};

/* ---------------- WARM-UP (8–12 min) ---------------- */
const WARMUP = {
  PUSH: [
    ['4 min', 'Easy cardio', 'Bike, elliptical or incline walk. A pace where you could still hold a conversation. Just to raise your temperature and heart rate.'],
    ['2 min', 'Shoulder mobility', '10 arm circles forward + 10 back · 10 band or broomstick dislocates.'],
    ['2 min', 'Rotator cuff', '15 external rotations per arm with a light band. This is the one that keeps your shoulder healthy across three pressing movements.'],
    ['3–4 min', 'Ramp-up sets on the bench press', 'Empty bar × 12 → 40% × 8 → 60% × 5 → 75% × 3. Short rests (45–60 s). These do NOT count as working sets.']
  ],
  PULL: [
    ['4 min', 'Easy cardio', 'Bike, elliptical or incline walk.'],
    ['2 min', 'Thoracic mobility', '8 side-lying thoracic rotations per side · 10 arm circles. A back that cannot extend cannot pull properly.'],
    ['2 min', 'Scapular activation', '10 scapular pulls hanging from the bar, or on the pulldown with almost no weight: just drive the shoulders down, no elbow bend. This is the movement the whole day is built on.'],
    ['3–4 min', 'Ramp-up on the pulldown', '40% × 10 → 60% × 6 → 75% × 3. These do not count as working sets.']
  ],
  LEGS: [
    ['4 min', 'Easy cardio', 'Bike or incline walk, conversational pace.'],
    ['2 min', 'Hip and ankle mobility', '10 leg swings front/back per side · 10 lateral swings · 10 ankle rocks with your knee driving to the wall.'],
    ['2 min', 'Activation', '15 bodyweight squats · 15 glute bridges · 10 unloaded hip hinges (the RDL pattern).'],
    ['3–4 min', 'Ramp-up for the first exercise', 'Empty or very light leg press × 12 → 50% × 8 → 70% × 5. These do not count as working sets.']
  ]
};

/* ---------------- AFTER-WORKOUT CHECK ----------------
   Five things, ticked in a small popup once the session is closed.
   Short on purpose: a list you actually finish beats a list you admire. */
const POST = [
  ['photo',   'Progress photo (once a week is plenty)'],
  ['protein', 'Protein + carbs within 2 h'],
  ['water',   'Drink water — 500 ml or more'],
  ['log',     'Every set logged: weight, reps, RIR'],
  ['stretch', '5 min easy stretch on what you trained']
];
/* The old pre-workout list. Nothing renders it any more — it exists so that
   sessions logged before the change still count towards XP and Mastery. */
const CHK_LEGACY = [
  ['sleep'], ['food'], ['water'], ['warm'], ['tech'],
  ['load'], ['log'], ['ego'], ['phone'], ['photo']
];

/* ---------------- 12-WEEK BLOCKS ---------------- */
const BLOCKS = [
  { w: [1, 4], name: 'Block 1 — Adaptation and technique', rir: '3', rirN: 3,
    color: '#00D6FF',
    goal: 'Learn the patterns. Make every rep look like the one before it.',
    rules: [
      'RIR 3 on EVERY set: you finish feeling like you had 3 more reps in you.',
      'Only add weight when your technique is clean AND you hit the top of the range on every set.',
      'Top priority: full range of motion and a controlled 2-second descent.',
      'Strong soreness in the first 2 weeks is normal. It fades on its own.',
      'Do not swap exercises. Repeating them is what makes you better at them.'
    ] },
  { w: [5, 8], name: 'Block 2 — Progression', rir: '2', rirN: 2,
    color: '#C8FF00',
    goal: 'Start accumulating real load without losing your form.',
    rules: [
      'RIR 2 on most sets. Stay at RIR 3 on the RDL.',
      'Apply double progression strictly: reps first, weight second.',
      'If you add nothing in a given week, that is fine. Repeat the same weight and win one rep.',
      'Start watching your weekly volume in the PROGRESS tab: it should climb slowly.',
      'If your sleep drops below 7 h for several days, progress stalls. At your age that is the number one cause.'
    ] },
  { w: [9, 12], name: 'Block 3 — Strength and hypertrophy', rir: '1–2', rirN: 1,
    color: '#FF6B2C',
    goal: 'Press the accelerator on the lifts you already own.',
    rules: [
      'RIR 2 on the early sets, RIR 1 on the LAST set of isolation exercises.',
      'Compounds (bench, leg press, shoulder press): never below RIR 1.',
      'RDL stays at RIR 3. Non-negotiable.',
      'End of week 12: record your best numbers, take photos and measurements, then start another cycle with the same exercises.',
      'Only consider a deload if the fatigue signs actually show up (see GUIDE).'
    ] }
];

/* ---------------- GUIDE ---------------- */
const GUIDE = [
  { t: 'RIR — Reps In Reserve', body:
    '<p><b>RIR</b> is how many reps you had left when you finished a set. It is your speedometer: it tells you how hard you are pressing the accelerator.</p>' +
    '<ul>' +
    '<li><b>RIR 3</b> — you could have done 3 more. The bar moves fast and easy. <i>Your zone in weeks 1–4.</i></li>' +
    '<li><b>RIR 2</b> — 2 left in the tank. The last rep is noticeably slower. <i>Your main zone from week 5 on.</i></li>' +
    '<li><b>RIR 1</b> — 1 left. The last rep is genuinely hard. <i>Only on the last set of isolations, and only from week 9.</i></li>' +
    '<li><b>RIR 0</b> — muscular failure, you cannot do one more. <i>You basically never need this.</i></li>' +
    '</ul>' +
    '<p><b>Never close to failure:</b> Romanian deadlift, Bulgarian split squat, and bench press without a spotter. These are lifts where failing means getting hurt, not growing faster.</p>' +
    '<p>At 16 with 3 weeks of training, working at RIR 2–3 gives you <b>almost exactly the same growth</b> as going to failure, with far less fatigue and far less risk.</p>' },

  { t: 'How to pick your starting weight', body:
    '<p>Simple rule: if the target is <b>3 × 8–12</b>, pick a weight you could do about <b>13–15</b> reps with if forced, and do 8–10. That puts you at RIR 3.</p>' +
    '<ul>' +
    '<li><b>Too light:</b> you sail past the top of the range and the last set feels like the first. → Go up.</li>' +
    '<li><b>Right:</b> the early reps are smooth, the last 2–3 slow down but your technique does not change. → Stay there.</li>' +
    '<li><b>Too heavy:</b> your technique changes (swinging, arching, shortening the range), the bar stalls, or you cannot reach the bottom of the range. → Go down.</li>' +
    '</ul>' +
    '<p>There is absolutely nothing wrong with starting with an empty bar or 6 kg dumbbells. In six months nobody will remember what you started with; the technique you learned will still show.</p>' },

  { t: 'Progression — double progression', body:
    '<p>This is the only system you need right now. Here is how it works, using <b>3 × 8–12</b>:</p>' +
    '<ul>' +
    '<li>Today you do <b>10, 10, 9</b> with 30 kg → you keep 30 kg next time and try to add reps.</li>' +
    '<li>Weeks later you hit <b>12, 12, 12</b> with clean form at RIR 1–2 → <b>now</b> you add weight.</li>' +
    '<li>When the weight goes up your reps drop (say to 9, 8, 8). That is normal and correct. You climb again.</li>' +
    '</ul>' +
    '<p><b>How much to add each time:</b></p>' +
    '<ul>' +
    '<li>Upper-body compounds (bench, pulldown, row, shoulder press): <b>+2.5 kg</b>.</li>' +
    '<li>Lower-body compounds (leg press, hack squat): <b>+5 kg</b> (or one plate).</li>' +
    '<li>Dumbbells: <b>+1 to +2 kg per hand</b> (usually you jump to the next pair).</li>' +
    '<li>Isolations (lateral raises, curls): <b>+1 kg</b> or one small plate.</li>' +
    '</ul>' +
    '<p>Order of priority, always: <b>Technique → Reps → Weight</b>. Never the other way round.</p>' },

  { t: 'Rest between sets', body:
    '<p>Rest is not wasted time: it is what lets you do the next set with quality.</p>' +
    '<ul>' +
    '<li><b>Heavy compounds</b> (bench, leg press, RDL, barbell incline): <b>2–3 min</b>.</li>' +
    '<li><b>Moderate compounds</b> (pulldown, row, shoulder press, Bulgarian): <b>90–120 s</b>.</li>' +
    '<li><b>Isolations</b> (laterals, curls, triceps, leg curl, extension, calves): <b>60–90 s</b>.</li>' +
    '<li><b>Core</b>: <b>45–90 s</b>.</li>' +
    '</ul>' +
    '<p><b>Why not rest less?</b> If you rest 30 s on bench press, your second set drops from 10 reps to 6 — not because the muscle got more stimulus but because you are out of breath. Fewer total reps means less stimulus.</p>' +
    '<p><b>Why not 5 minutes on a curl?</b> Because a biceps recovers in 60–90 s, and stretching the session to 2 hours just means you train tired and feel less like coming back. The app times every rest for you automatically.</p>' },

  { t: 'Sleep and recovery', body:
    '<p>You are 16: <b>8–10 hours a night</b>, and it is not negotiable if you want results.</p>' +
    '<p>During deep sleep your body releases most of the day’s <b>growth hormone</b>. Sleep is also when:</p>' +
    '<ul>' +
    '<li>The muscle fibres you broke down in training get repaired and rebuilt.</li>' +
    '<li><b>Motor learning</b> consolidates: you literally improve your technique while sleeping.</li>' +
    '<li>Your nervous system recovers, which is what lets you lift more next session.</li>' +
    '</ul>' +
    '<p>Regularly sleeping 5–6 hours reduces muscle gain and raises injury risk no matter how well you train. It is the cheapest, highest-return lever you have.</p>' +
    '<p><b>Rest days (Mon, Thu, Sat, Sun):</b> walk, ride a bike easy, play a light sport, stretch for 10 min. Do not add "a bit of extra gym". Muscle grows on the days you rest, not the days you train.</p>' },

  { t: 'Nutrition', body:
    '<p>No extreme diets. You are still growing: your goal is to <b>eat enough to grow and recover</b>.</p>' +
    '<ul>' +
    '<li><b>Calories:</b> eat enough to gain weight slowly and steadily. For a lean beginner a sensible rate is <b>+0.2 to +0.4 kg per week</b>. If your weight has not moved in 3 weeks, add a meal or a snack.</li>' +
    '<li><b>Protein:</b> spread it across every meal — a protein source on every plate. Real sources: eggs, chicken, beef, fish (tuna, salmon), milk, Greek yoghurt, cheese, lentils, chickpeas, beans.</li>' +
    '<li><b>Carbohydrates:</b> your training fuel. Rice, pasta, potatoes, oats, bread, fruit. Do not fear them: at your age and bodyweight you need them.</li>' +
    '<li><b>Healthy fats:</b> olive oil, avocado, nuts, whole eggs, oily fish.</li>' +
    '<li><b>Fruit and vegetables:</b> at almost every meal. Micronutrients, fibre, digestion.</li>' +
    '<li><b>Calcium and iron:</b> important at 16 while your bones are still building density. Dairy, leafy greens, red meat, legumes.</li>' +
    '<li><b>Water:</b> 2–3 litres a day, more on training days.</li>' +
    '</ul>' +
    '<p><b>What you should NOT do right now:</b> aggressive cutting, long fasts, cutting carbs, skipping meals to "get abs". At 16 that slows your growth and your performance. Cutting comes later, when there is muscle to reveal.</p>' +
    '<p class="tiny">Any significant change to how you eat is worth discussing with your parents and, if possible, a health professional.</p>' },

  { t: 'Supplements — the short truth', body:
    '<p><b>You need none of them.</b> At 16 with 3 weeks of training, 100% of your results will come from training well, eating enough and sleeping. Point by point:</p>' +
    '<ul>' +
    '<li><b>Protein powder:</b> not necessary. It is just food in powder form, convenient if you struggle to hit your protein with real food. A glass of milk or a Greek yoghurt does the same job.</li>' +
    '<li><b>Creatine:</b> the only supplement besides protein with solid evidence, but research in minors is limited. <b>Do not take it without talking to your parents and a doctor first.</b> You do not need it to progress this year.</li>' +
    '<li><b>Pre-workout:</b> unnecessary and not advisable at your age — high doses of caffeine that will wreck the sleep that is doing most of the work.</li>' +
    '<li><b>BCAAs:</b> unnecessary. If you eat enough protein, you are already getting them.</li>' +
    '<li><b>Vitamins:</b> only if a doctor finds a real deficiency (vitamin D or iron, for example). Not blindly.</li>' +
    '<li><b>Fat burners:</b> no. Not now, not later. They do not work and some are dangerous.</li>' +
    '</ul>' +
    '<p>General rule: if a supplement promises fast results, it is selling you smoke.</p>' },

  { t: 'Cardio', body:
    '<p>Yes, do some — but a little, and in a way that does not interfere.</p>' +
    '<ul>' +
    '<li><b>Recommended:</b> 20–30 min of brisk walking, easy cycling or a sport, <b>2–3 times a week</b>, preferably on rest days or after lifting (never before heavy leg work).</li>' +
    '<li>A sport you already play (football, basketball, swimming) counts perfectly and is good for your coordination.</li>' +
    '<li><b>Avoid:</b> long runs or hard HIIT the day before or the same day as legs. It will eat your recovery.</li>' +
    '</ul>' +
    '<p>That light cardio improves your recovery between sets, your cardiovascular health and your work capacity. It will not "burn" your muscle — that happens with very high cardio volumes and not enough food, not with a 25-minute walk.</p>' },

  { t: 'Deload — when do you actually need one?', body:
    '<p>A <b>deload</b> is an easy week: same exercises, roughly <b>60% of your usual weights</b> and one less set per exercise. It lets your body and joints catch up.</p>' +
    '<p><b>Do not do it automatically.</b> With 3 weeks of experience your accumulated fatigue is still low. Only deload if <b>2 or more</b> of these show up for more than a week:</p>' +
    '<ul>' +
    '<li>Performance dropping across several sessions in a row (the same weights feel much heavier).</li>' +
    '<li>General tiredness that does not clear with a rest day.</li>' +
    '<li>Muscle or joint aches that will not go away.</li>' +
    '<li>Persistent lack of motivation to go to the gym.</li>' +
    '<li>Disturbed sleep, trouble falling asleep, or waking up tired.</li>' +
    '<li>Irritability, loss of appetite.</li>' +
    '</ul>' +
    '<p>The <b>PROGRESS</b> tab warns you if your weekly volume falls two weeks in a row — that is usually the first objective clue.</p>' },

  { t: 'Realistic expectations', body:
    '<p>No false promises. This is what you can reasonably expect training consistently, sleeping and eating well:</p>' +
    '<ul>' +
    '<li><b>1 month:</b> better technique, more coordination, weights climbing fast. Almost all of it is nervous-system adaptation, not new muscle. You will feel stronger before you look different.</li>' +
    '<li><b>3 months:</b> first visible changes — shoulders and back look fuller, better posture. Clothes start to fit differently. Strength clearly up.</li>' +
    '<li><b>6 months:</b> obvious change to people who do not see you often. The V-taper starts to show.</li>' +
    '<li><b>9 months:</b> clearly a trained physique with a shirt on. The lifts feel automatic.</li>' +
    '<li><b>12 months:</b> a real transformation from today. This is when most people stop saying "I’m just starting".</li>' +
    '<li><b>18 months:</b> a settled athletic physique with defined proportions.</li>' +
    '<li><b>2 years:</b> the look you are after is entirely reachable in this window, naturally.</li>' +
    '</ul>' +
    '<p>On the numbers: a male beginner can gain roughly <b>0.5–1 kg of muscle per month</b> in the first year, and less after that. Genetics, sleep, food, consistency and age all matter — and consistency matters more than all the rest combined. <b>Someone who trains 3 days a week for 2 years gains far more than someone who trains 6 days a week for 2 months.</b></p>' },

  { t: 'The look you want — how the V is built', body:
    '<p>The V-taper is a <b>contrast illusion</b>: wide at the top, narrow at the waist. You work both ends.</p>' +
    '<ul>' +
    '<li><b>Side delts</b> (lateral raises) — the single biggest driver of how wide you look from the front. It is a small muscle: it grows with higher reps, clean technique and frequency, not brute weight. That is why they appear in BOTH upper sessions.</li>' +
    '<li><b>Lats</b> (pulldowns, pull-ups, rows) — width from the front and the back, and the bottom half of the V.</li>' +
    '<li><b>Upper back and mid traps</b> (rows) — thickness and an upright posture. Posture alone changes how you look.</li>' +
    '<li><b>Upper chest</b> (incline press) — fills out the top of the torso, right under the collarbones. That is why incline press is in both upper days.</li>' +
    '<li><b>Arms</b> (curls, hammers, triceps) — the triceps is two thirds of arm size. If you want big arms, train triceps, not just biceps.</li>' +
    '<li><b>Waist</b> — do not make it bigger: no heavy weighted oblique work or loaded twists. Anti-movement core (plank, dead bug) is enough. Your waist looks narrow because your shoulders are wide, not because your abs shrink.</li>' +
    '<li><b>Legs</b> — always train them. A big torso on toothpick legs does not read as athletic, it reads as odd. Leg press and RDLs also drive your overall progress.</li>' +
    '</ul>' +
    '<p>The <b>SYMMETRY</b> tab measures exactly this: your shoulder-to-waist ratio from your own photos, session after session.</p>' },

  { t: 'Beginner mistakes that will cost you months', body:
    '<ul>' +
    '<li><b>Changing your program constantly.</b> You cannot progress at a lift you do once. Stick with these exercises for at least 12 weeks. → Fix: follow the app’s plan and leave it alone.</li>' +
    '<li><b>Lifting too heavy.</b> The number one mistake and the number one cause of injury. → Fix: RIR 2–3 and technique first.</li>' +
    '<li><b>Trading technique for reps.</b> A rep with a swing does not count. → Fix: if the form changes, the set is over.</li>' +
    '<li><b>Not resting between sets.</b> → Fix: use the timer the app starts for you.</li>' +
    '<li><b>Training to failure every set.</b> More fatigue, same result, more risk. → Fix: RIR 2.</li>' +
    '<li><b>Copying advanced bodybuilders from Instagram.</b> They have 10 years in and are sometimes not natural. → Fix: your program is built for a beginner. It is the right one for you today.</li>' +
    '<li><b>Doing too many exercises.</b> 7 done well beats 15 done halfway. → Fix: do not add "extra" exercises on your own.</li>' +
    '<li><b>Skipping legs.</b> If leg day only comes around once a week, one skip means two weeks between leg sessions. → Fix: treat your leg day as the least skippable day of the week.</li>' +
    '<li><b>Too much cardio.</b> → Fix: 2–3 short easy sessions a week, maximum.</li>' +
    '<li><b>Under-eating.</b> The number one reason a young lifter does not grow despite training well. → Fix: weigh yourself once a week; if you are not gaining, eat more.</li>' +
    '<li><b>Not sleeping enough.</b> → Fix: 8–10 h. Phone out of the bed.</li>' +
    '<li><b>Comparing yourself to others.</b> Everyone has different genetics, training age and starting point. → Fix: compare your photos and your numbers to YOUR OWN from three months ago. That is what this app is for.</li>' +
    '<li><b>Expecting results in 3 weeks.</b> → Fix: read the realistic expectations section and come back in 6 months.</li>' +
    '</ul>' },

  { t: 'Jawline — what actually works', body:
    '<p>Straight answer first, because this topic is full of nonsense online: <b>a jawline is mostly revealed, not built.</b> The order of what actually decides how sharp yours looks:</p>' +
    '<ul>' +
    '<li><b>Body fat percentage</b> — by far the biggest factor. This is why the same person looks completely different at 12% and 20%.</li>' +
    '<li><b>Bone structure</b> — genetics. No exercise changes bone. Anyone claiming otherwise is selling something.</li>' +
    '<li><b>Age</b> — you are 16. Male facial structure keeps maturing into the early twenties and the jaw fills out late. A meaningful part of this will happen on its own.</li>' +
    '<li><b>Head posture</b> — trainable and it works fast. Forward head posture visually erases a jawline.</li>' +
    '<li><b>Neck development</b> — trainable, and it frames the jaw.</li>' +
    '<li><b>Masseter (chewing muscle)</b> — trainable to a modest degree, but not worth the risk. See below.</li>' +
    '<li><b>Sleep, salt and water</b> — bad sleep and a very salty day cause facial puffiness that blurs everything.</li>' +
    '</ul>' +
    '<p><b>On "mewing":</b> resting your tongue on the roof of your mouth with your lips closed and breathing through your nose is a perfectly good habit. But the popular claim that it reshapes adult facial bones is <b>not supported by good evidence</b>. Do it as free posture practice, not as a face-changing technique, and do not let anyone convince you it replaces losing body fat.</p>' +
    '<p><b>On jaw trainers and hard mastic gum — why they are not in this routine:</b> chewing resistance does grow the masseter a little, but these devices are far harder than they look and overuse causes real problems: jaw clicking, locking, pain in front of the ear, temple headaches, worn teeth. That is <b>TMJ dysfunction</b>, it is common in people who go too hard too fast, and it can take months to settle. The visual payoff is small and the downside is a joint you use every time you eat and talk. Bad trade — so the routine leaves it out entirely.</p>' +
    '<p>If you ever decide to try it anyway, at least do it properly: ordinary sugar-free gum, a few minutes at most, alternating sides evenly, no more than a couple of days a week, and stop at the very first click or ache. If anything persists, see a dentist.</p>' +
    '<p>What is left in the <b>Today</b> tab is the part with a real payoff and no meaningful risk: posture, neck, and gentle jaw mobility.</p>' },

  { t: 'Safety — when to stop', body:
    '<p>Stop the set <b>immediately</b> if:</p>' +
    '<ul>' +
    '<li>You feel a <b>sharp, stabbing or electric</b> pain in a joint (shoulder, knee, elbow, lower back). That is not effort, that is a signal.</li>' +
    '<li>Your lower back rounds on the RDL or the leg press.</li>' +
    '<li>Your vision goes, you feel dizzy, or your breathing feels wrong.</li>' +
    '<li>You have to change your technique to finish the rep.</li>' +
    '</ul>' +
    '<p>Diffuse muscular discomfort and burning = normal. Pinpoint joint pain = stop, and if it persists, talk to a coach at your gym or a health professional.</p>' +
    '<p><b>Always:</b> use the safety pins in the rack, do not bench heavy without someone nearby, and do not hesitate to ask a trainer to watch a set. Nobody is going to laugh; everyone started the same way.</p>' +
    '<p class="tiny">This app is an organisation and tracking tool, not a substitute for an in-person coach or medical advice. If you have a health condition or an injury, check first.</p>' }
];

/* ---------------- JAWLINE & NECK ROUTINE ----------------
   Honest framing: a visible jawline is mostly revealed (body fat, bone structure,
   age, posture), not built. What IS trainable: neck size, head posture, and a
   modest amount of masseter development. Everything here is low volume on purpose
   because the jaw joint is easy to overwork and slow to forgive. */
const JAW = [
  { id: 'chin', n: 'Chin tucks', freq: 'Daily', dose: '3 × 10 reps, 2 s hold',
    why: 'The highest-value item on this list. Forward head posture is what visually erases a jawline: it pushes the chin out and slackens the skin under the jaw. Fixing it changes your profile immediately, before any muscle grows.',
    how: [
      'Sit or stand tall, eyes level, shoulders relaxed.',
      'Slide your head straight back — not down — as if making a double chin on purpose.',
      'Hold 2 seconds, feel the stretch at the base of your skull, release slowly.',
      'Do not tilt your chin up or down. It is a pure backwards glide.'
    ],
    care: 'If you get dizzy or feel tingling in your arms, stop and mention it to a doctor.' },

  { id: 'neckiso', n: 'Neck isometrics', freq: '3 days a week', dose: '2 × 10 s each direction',
    why: 'A thicker neck frames the jaw and makes it read sharper from the front and side. Isometrics are the safest way to train it at 16 — no loaded movement, no plates behind your head.',
    how: [
      'Press your palm against your forehead and push your head into it. Do not let your head move. 10 seconds.',
      'Repeat with your hand on the back of your head, then on each side.',
      'Push at about 50–60% of your maximum, never full force.',
      'Breathe normally the whole time. Do not hold your breath.'
    ],
    care: 'Never do explosive neck movements or bridges. Nothing here should move your neck at all.' },

  { id: 'open', n: 'Gentle jaw mobility', freq: '3 days a week', dose: '2 × 10 slow reps',
    why: 'Keeps the jaw joint moving smoothly and trains the muscles that open the jaw, which most people never use. Mobility work, not strength work — the goal is a joint that tracks cleanly, not a bigger chewing muscle.',
    how: [
      'Rest a fist lightly under your chin.',
      'Open your mouth slowly against very light resistance, over about 3 seconds.',
      'Close just as slowly. This should feel easy — it is not a strength test.',
      'Keep the opening straight. If your jaw drifts to one side, reduce the range.'
    ],
    care: 'If the joint clicks or catches during this, stop doing it and mention it to a dentist.' },

  { id: 'tongue', n: 'Tongue and mouth posture', freq: 'All day habit', dose: 'Just a habit, no sets',
    why: 'Resting with your tongue on the roof of your mouth, lips together and breathing through your nose is good general practice — it supports nasal breathing and a neutral head position. Be aware that the popular claim that this reshapes adult facial bones ("mewing") is not supported by good evidence. Treat it as a free posture habit, not a face-changing technique.',
    how: [
      'Lips together, teeth lightly apart, breathe through your nose.',
      'Let the whole tongue rest against the roof of your mouth, not just the tip.',
      'Do not clench your teeth. Clenching is how you get jaw pain and worn enamel.'
    ],
    care: 'If you cannot breathe through your nose comfortably, get that checked — it matters far more for your sleep and your training than for your jawline.' }
];

const JAW_TRUTH = [
  ['Body fat', 'By far the biggest factor. A jawline is revealed, not built. At your weight and age this mostly takes care of itself as you grow into your frame — which is another reason not to bulk aggressively.'],
  ['Bone structure', 'Genetics set the shape. No exercise changes the bone. Anyone selling you otherwise is selling something.'],
  ['Age', 'You are 16. Male facial structure keeps maturing into the early twenties, and the jaw is one of the last things to fill out. A lot of this will simply happen.'],
  ['Posture', 'Trainable, and it works fast. Chin tucks plus the rows already in your program.'],
  ['Neck size', 'Trainable and genuinely helps the framing.'],
  ['Masseter', 'Technically trainable through chewing resistance, but deliberately left out of this routine: the payoff is small and the risk of jaw joint problems is real. Not worth it.'],
  ['Sleep, salt and water', 'Poor sleep and a very salty day both cause facial puffiness that blurs the jawline. Cheapest fix on the list.']
];

/* ---------------- MEASUREMENTS ---------------- */
/* `core: true` marks the two numbers that actually change what you do.
   Everything else is optional and always has been — the form just used to
   look like it demanded a tape measure and ten readings. */
const MEASURES = [
  { k: 'peso', n: 'Bodyweight', u: 'kg', pair: null, core: true, need: 'any bathroom scale',
    tip: 'Same time of day every time — first thing in the morning is easiest to repeat. This is the one number that tells you whether you are eating enough to grow.' },
  { k: 'cintura', n: 'Waist', u: 'cm', pair: null, core: true, need: 'a tape, or a shoelace and a ruler',
    tip: 'At the NARROWEST point, usually 2 cm above the navel. Do not suck in. Paired with bodyweight it tells you whether you are gaining muscle or just gaining.' },
  { k: 'hombros', n: 'Shoulder circumference', u: 'cm', pair: null, need: 'a tape, or a shoelace and a ruler',
    tip: 'All the way around the widest part of your delts, arms relaxed.' },
  { k: 'pecho', n: 'Chest', u: 'cm', pair: null, need: 'a tape, or a shoelace and a ruler',
    tip: 'At nipple height, at the end of a normal exhale.' },
  { k: 'brazo', n: 'Arm (flexed)', u: 'cm', pair: true, need: 'a tape, or a shoelace and a ruler',
    tip: 'Biceps flexed, at the thickest point. Both arms.' },
  { k: 'muslo', n: 'Thigh', u: 'cm', pair: true, need: 'a tape, or a shoelace and a ruler',
    tip: 'Halfway between knee and hip.' },
  { k: 'pant', n: 'Calf', u: 'cm', pair: true, need: 'a tape, or a shoelace and a ruler',
    tip: 'At the thickest point, standing.' }
];
/* What you can actually track with what you have. Ordered cheapest first. */
const NO_KIT = [
  ['Nothing at all', 'Photos. The <b>Symmetry</b> tab reads your shoulder-to-waist ratio straight off a front photo — no tools, and it is the number that matches your goal most closely. Take one every 2 weeks, same spot, same light.'],
  ['A phone and a mirror', 'Add how your clothes fit. A note like "same jeans, belt one hole looser" in the session notes is real data, and you will be glad you wrote it in three months.'],
  ['A shoelace and any ruler', 'This replaces a tape measure completely. Wrap the lace around, pinch where it meets, lay it flat next to a ruler or a 30 cm school rule. Mark the lace with a pen so the next measurement starts from the same place.'],
  ['A bathroom scale', 'Bodyweight, once a week, same time of day. At your age and size this is the single most useful number in the whole app: it is what tells you whether you are eating enough to actually grow.'],
  ['A tape measure', 'Everything above plus circumferences. Nice, not necessary — a tape costs very little if you ever want one, but nothing in this app breaks without it.']
];

const POSES = [
  { k: 'front', n: 'Front relaxed', tip: 'Facing the camera, arms at your sides and relaxed, not flexed. This is the photo used for symmetry analysis.' },
  { k: 'back', n: 'Back', tip: 'Facing away, arms relaxed. Shows lat width.' },
  { k: 'side', n: 'Side profile', tip: 'From the side, always the same side. Shows chest, posture and midsection.' },
  { k: 'flex', n: 'Double biceps', tip: 'Optional, arms flexed. Useful for comparing arm development.' }
];

/* points you mark on the photo for symmetry analysis */
const MARKS = [
  { k: 'cuello', n: 'Neck notch', hint: 'The dip between your collarbones, dead centre.', c: '#C8FF00' },
  { k: 'ombligo', n: 'Navel', hint: 'The centre of your navel. Together with the point above, this defines your vertical axis.', c: '#C8FF00' },
  { k: 'homI', n: 'Left shoulder', hint: 'The OUTERMOST edge of your left delt (your left).', c: '#00D6FF' },
  { k: 'homD', n: 'Right shoulder', hint: 'The outermost edge of your right delt.', c: '#00D6FF' },
  { k: 'cinI', n: 'Left waist', hint: 'The narrowest point on the left side of your torso.', c: '#FF6B2C' },
  { k: 'cinD', n: 'Right waist', hint: 'The narrowest point on the right side.', c: '#FF6B2C' }
];

/* ---------------- STARTING WEIGHTS ----------------
   Calculated for a lean beginner with a few weeks of training.
   A STARTING POINT for your first session, not a target.
   The test set always overrides these numbers. */
const START = {
  bench:    { w: 'Empty bar (20 kg)', why: 'An Olympic bar weighs 20 kg and that is plenty for your first time. If you get 10 perfect reps with no effort, try 25 kg next session.' },
  latpull:  { w: '25–30 kg', why: 'Roughly 40–45% of your bodyweight. It is a plate stack: start low and go up one plate at a time.' },
  incdb:    { w: '8 kg per hand', why: 'Bench at 30°. If your gym jumps from 8 to 10, stay at 8 for the first week.' },
  seatrow:  { w: '25–30 kg', why: 'Similar to the pulldown. If you rock to pull it, drop one plate.' },
  latraise: { w: '4 kg per hand', why: 'Yes, 4 kg. This is the lift where most people destroy the stimulus by going too heavy. The side delt is small and responds to technique, not kilos.' },
  preacher: { w: 'the empty EZ bar (7–10 kg), or the lightest plate on the preacher machine',
              why: 'The pad takes away every way of cheating, so the honest weight here is well below a standing curl. Learn the bottom position before you add anything.' },
  triprop:  { w: '15–20 kg', why: 'Cable stack. If it lifts you off the floor, drop one plate.' },

  legpress: { w: '40 kg in plates (2 × 20 kg)', why: 'Careful: the sled itself weighs 20–40 kg empty, and it varies by gym. That makes this number a rough guide — the test set is mandatory here.' },
  rdl:      { w: '8–10 kg per hand', why: 'Deliberately VERY light. The first 3–4 weeks of Romanian deadlifts are for learning the hip hinge, not for loading. Technique first.' },
  bss:      { w: 'Bodyweight only', why: 'No dumbbells until you can do 8 reps per leg without wobbling. Only then add 5 kg per hand.' },
  legcurl:  { w: '15–20 kg', why: 'Machine. If your hips lift off the bench, go down.' },
  legext:   { w: '15–25 kg', why: 'Machine. Aim for a weight you can pause with for 1 second at the top.' },
  calf:     { w: '20–30 kg', why: 'Calves tolerate a fair amount, but prioritise full range and a pause at the bottom.' },
  core:     { w: 'Bodyweight', why: 'Dead bugs and planks carry no load. Progress is more time and more control, not more weight.' },

  incbar:   { w: 'Empty bar (20 kg)', why: 'Same as flat bench: the bar alone is the right starting point.' },
  machrow:  { w: '25–30 kg', why: 'On a chest-supported machine, start low: it feels easier than it is.' },
  ohp:      { w: '6–8 kg per hand', why: 'Shoulder press is where you will move the least weight in the whole program. That is normal and means nothing bad.' },
  latpull2: { w: '25–30 kg (or 30–35 kg of assistance)', why: 'On assisted pull-ups the assistance is subtracted from your bodyweight: with 35 kg of help you are lifting about 29 kg. Aim for 8 clean reps.' },
  inchammer:{ w: '5–6 kg per hand', why: 'A kilo or two below a standing hammer curl. The stretch at the bottom makes it harder than it looks.' },
  tripro2:  { w: '15–20 kg', why: 'Same as the pushdown in Upper A.' }
};
