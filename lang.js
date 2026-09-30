/* MONOLITH — idioma / language
   -----------------------------------------------------------------------
   How this works: data.js is the English source. At load we take a snapshot
   of it, and switching language rewrites the live objects in place — so every
   `EX[id].n`, `ex.cues`, `SESSIONS[k].label` in the rest of the app keeps
   working untouched, in whichever language is active.

   Only structures that are pure data (no functions) can be listed in TARGETS,
   because the snapshot goes through JSON.
   ----------------------------------------------------------------------- */

let LANG = 'en';

/* everything translatable, by name */
const I18N_TARGETS = {
  EX: EX, SESSIONS: SESSIONS, WARMUP: WARMUP, START: START,
  GUIDE: GUIDE, BLOCKS: BLOCKS, JAW: JAW, JAW_TRUTH: JAW_TRUTH,
  MEASURES: MEASURES, NO_KIT: NO_KIT, POSES: POSES, MARKS: MARKS, POST: POST
};
const EN_SNAP = {};
Object.keys(I18N_TARGETS).forEach(k => { EN_SNAP[k] = JSON.parse(JSON.stringify(I18N_TARGETS[k])); });

/* overwrite only the keys present in src, so a partial translation is fine:
   anything not yet translated simply stays in English. */
function deepApply(dst, src) {
  if (!dst || !src) return;
  Object.keys(src).forEach(k => {
    const v = src[k];
    if (Array.isArray(v)) {
      /* Same-length arrays of objects merge element by element. That lets a
         translation supply only the text and leave ids, flags and colours
         alone — replacing the array wholesale would drop them. */
      const isObjList = v.length && v.every(x => x && typeof x === 'object' && !Array.isArray(x));
      if (isObjList && Array.isArray(dst[k]) && dst[k].length === v.length) {
        v.forEach((x, i) => deepApply(dst[k][i], x));
      } else dst[k] = v.slice();
    }
    else if (v && typeof v === 'object') { if (!dst[k] || typeof dst[k] !== 'object') dst[k] = {}; deepApply(dst[k], v); }
    else dst[k] = v;
  });
}

function applyLang(l) {
  LANG = (l === 'es') ? 'es' : 'en';
  /* always reset to English first, so switching back is exact */
  Object.keys(I18N_TARGETS).forEach(k => deepApply(I18N_TARGETS[k], EN_SNAP[k]));
  if (LANG === 'es') Object.keys(ES).forEach(k => { if (I18N_TARGETS[k]) deepApply(I18N_TARGETS[k], ES[k]); });
}

/* ---------------- interface strings ----------------
   tr('key') returns the active language. English is the fallback for anything
   not yet translated, so a missing key degrades instead of showing "undefined". */
const UI = {
  en: {
    lang_btn: 'ES', lang_title: 'Cambiar a español',
    tab_today: 'Today', tab_quest: 'Quest', tab_photos: 'Photos', tab_symmetry: 'Symmetry',
    tab_measure: 'Measure', tab_progress: 'Progress', tab_plan: 'Plan', tab_guide: 'Guide',
    tab_coach: 'AI',
    week: 'Week', cycle: 'Cycle', week_s: 'W'
  },
  es: {
    lang_btn: 'EN', lang_title: 'Switch to English',
    tab_today: 'Hoy', tab_quest: 'Aventura', tab_photos: 'Fotos', tab_symmetry: 'Simetría',
    tab_measure: 'Medidas', tab_progress: 'Progreso', tab_plan: 'Plan', tab_guide: 'Guía',
    tab_coach: 'AI',
    week: 'Semana', cycle: 'Ciclo', week_s: 'S'
  }
};
/* named tr: app.js already uses both t (locals) and T (the rest timer). */
function tr(k) {
  const a = UI[LANG] || UI.en;
  return (a[k] !== undefined) ? a[k] : (UI.en[k] !== undefined ? UI.en[k] : k);
}

/* ======================================================================
   ESPAÑOL
   Etapa 1: lo que lees dentro del gimnasio — ejercicios, técnica, errores,
   avisos de seguridad, calentamiento y pesos de inicio.
   ====================================================================== */
const ES = {

SESSIONS: {
  PUSH: { label: 'EMPUJE', sub: 'Pecho · Hombros · Tríceps' },
  PULL: { label: 'TIRÓN',  sub: 'Espalda · Dorsales · Deltoides posterior · Bíceps' },
  LEGS: { label: 'PIERNA', sub: 'Cuádriceps · Isquios · Glúteos · Gemelos · Core' }
},

EX: {

  /* ---------------- EMPUJE + TIRÓN ---------------- */
  bench: {
    n: 'Press de Banca con Barra', g: 'Pecho',
    alt: 'Press de pecho en máquina (Smith o convergente), o press con mancuernas en banco plano si no hay nadie que te asegure.',
    feel: 'Pecho y tríceps. Nunca un pinchazo seco en la parte delantera del hombro.',
    cues: [
      'Los ojos justo debajo de la barra. Pies planos y firmes en el suelo, un poco por detrás de las rodillas.',
      'Agarre: manos algo más abiertas que los hombros. La barra apoya en la base de la palma, no en los dedos.',
      'Junta los omóplatos hacia atrás y abajo, como si sujetaras dos lápices entre ellos. Mantenlo TODA la serie.',
      'Baja la barra controlado (2 segundos) hasta tocar la parte baja del pecho / la línea del esternón.',
      'Codos a unos 45–60° respecto al torso, no abiertos a 90°.',
      'Inspira al bajar, aguanta abajo, exhala al subir.',
      'Empuja clavando los pies en el suelo y llevando la barra un poco hacia arriba y hacia atrás.'
    ],
    errs: [
      'Rebotar la barra en el pecho: pierdes el estímulo y te puedes lastimar el esternón. Tocar y empujar, sin rebote.',
      'Codos abiertos a 90°: mucha tensión en el hombro. Ciérralos un poco.',
      'Levantar el culo del banco: si pasa eso, el peso es demasiado.',
      'Levantar la cabeza para mirar la barra: la nuca se queda apoyada en el banco.'
    ],
    heavy: 'Si la barra se te queda a mitad de camino, se va hacia un lado, o de golpe arqueas mucho la espalda, pesa demasiado. Baja 2,5–5 kg.'
  },
  latpull: {
    n: 'Jalón al Pecho', g: 'Espalda',
    alt: 'Dominadas asistidas en máquina.',
    feel: 'Debajo y al lado de las axilas (dorsales). Si solo sientes bíceps, estás tirando con los brazos.',
    cues: [
      'Ajusta la almohadilla de los muslos para que no te levante del asiento.',
      'Agarre prono (palmas hacia adelante), algo más abierto que los hombros. No exageradamente abierto.',
      'Torso casi vertical, inclinado hacia atrás 10–15° como mucho. Pecho arriba.',
      'Antes de tirar: baja los hombros (deprime los omóplatos). Ese es el verdadero inicio del movimiento.',
      'Piensa en llevar los CODOS al bolsillo trasero, no en tirar de la barra con las manos.',
      'La barra va a la clavícula / parte alta del pecho. Nunca detrás de la nuca.',
      'Sube controlado durante 2–3 segundos hasta estirar del todo.'
    ],
    errs: [
      'Balancear el torso hacia atrás para coger impulso: si necesitas mecerte, baja el peso.',
      'Dejar que la barra te suba los brazos de golpe arriba: la fase negativa es donde está casi todo el crecimiento.',
      'Encoger los hombros hacia las orejas al tirar: primero hombros abajo.',
      'Barra detrás de la nuca: innecesario y arriesgado para el hombro.'
    ],
    heavy: 'Si el cuerpo se te despega del asiento o necesitas un tirón de lumbar, quita un disco.'
  },
  incdb: {
    n: 'Press Inclinado con Mancuernas', g: 'Pecho alto',
    alt: 'Press inclinado en máquina.',
    feel: 'Pecho alto, justo debajo de las clavículas.',
    cues: [
      'Banco a 30° (45° como máximo). Más inclinado que eso se convierte en un press de hombro.',
      'Siéntate con las mancuernas sobre los muslos y "empújalas" con las rodillas mientras te tumbas.',
      'Omóplatos atrás y abajo, igual que en press de banca.',
      'Mancuernas a la altura del pecho alto, muñecas rectas y alineadas sobre los codos.',
      'Baja hasta que los codos queden un poco por debajo del nivel del torso: ahí sientes el estiramiento.',
      'Empuja dibujando una "A" suave: las mancuernas se acercan arriba, pero NO chocan.',
      'No claves los codos en bloqueo arriba; deja una flexión leve.'
    ],
    errs: [
      'Banco demasiado inclinado (60°+): el deltoides frontal se lleva el trabajo.',
      'No bajar lo suficiente: media repetición, medio resultado.',
      'Muñecas dobladas hacia atrás: dolor de muñeca. Los nudillos apuntan al techo.',
      'Chocar las mancuernas arriba: el pecho pierde tensión.'
    ],
    heavy: 'Si no puedes controlar una bajada de 2 segundos o los codos se te descuadran, baja 2 kg por mano.'
  },
  seatrow: {
    n: 'Remo Sentado en Polea', g: 'Espalda',
    alt: 'Remo en máquina con apoyo de pecho.',
    feel: 'Zona media de la espalda entre los omóplatos, más dorsales.',
    cues: [
      'Pies firmes, rodillas ligeramente flexionadas (no bloqueadas).',
      'Torso erguido, pecho arriba, curva natural en la zona lumbar.',
      'Empieza el tirón juntando los omóplatos, y después lleva los codos por detrás de las costillas.',
      'El agarre llega a la altura del ombligo / costillas bajas.',
      'Aprieta 1 segundo en la contracción, sin encoger los hombros.',
      'Vuelve dejando que los brazos se estiren y los omóplatos se separen, pero SIN redondear la lumbar.'
    ],
    errs: [
      'Mecerse adelante y atrás como si remaras de verdad: el torso casi no se mueve.',
      'Redondear la lumbar en el estiramiento: pecho arriba.',
      'Tirar solo con los bíceps: piensa en codos, no en manos.',
      'Recorrido corto: deja que el peso te estire del todo hacia adelante.'
    ],
    heavy: 'Si el torso se va hacia atrás más de unos 10°, pesa demasiado.'
  },
  latraise: {
    n: 'Elevaciones Laterales', g: 'Deltoides lateral',
    alt: 'Elevación lateral en polea (mejor tensión) o en máquina.',
    feel: 'Justo en el lateral del hombro. Si lo sientes en el cuello, estás usando trapecio.',
    cues: [
      'ESTE es el ejercicio número uno para la forma de V. Máxima prioridad para ti.',
      'Ve LIGERO. En serio: 4–6 kg es normal y más que suficiente al principio.',
      'De pie, torso inclinado unos 10° hacia adelante, codos con una flexión mínima y fija.',
      'Sube hacia los lados como si vaciaras una jarra de agua (meñique un poco más alto que el pulgar).',
      'Para a la altura del hombro. No hace falta subir más.',
      'Baja DESPACIO, 2–3 segundos. La bajada es la mitad del ejercicio.',
      'Los hombros se quedan abajo, lejos de las orejas, todo el rato.'
    ],
    errs: [
      'Demasiado peso más balanceo de cadera: el trapecio roba el trabajo y el deltoides no crece.',
      'Encoger los hombros al subir.',
      'Subir muy por encima del hombro con peso alto.',
      'Dejar caer el peso en caída libre al bajar.'
    ],
    heavy: 'Si tienes que dar un tirón con el cuerpo para arrancar la primera repetición, pesa demasiado. Baja a 4 kg sin vergüenza.'
  },
  preacher: {
    n: 'Curl en Banco Scott (predicador)', g: 'Bíceps',
    alt: 'Máquina de curl scott, o un brazo a la vez con mancuerna en el mismo banco.',
    feel: 'La mitad baja del bíceps, justo encima del codo, con un estiramiento fuerte abajo.',
    cues: [
      'Pecho contra la almohadilla, axilas justo en el borde de arriba. Si te resbalas hacia abajo al tirar, sube el asiento.',
      'Los dos brazos se quedan planos sobre la almohadilla toda la serie. Esa almohadilla es el objetivo entero: hace imposible hacer trampa.',
      'Baja hasta que el codo esté CASI estirado. Casi: no lo dejes caer en bloqueo con peso encima.',
      'Sube hasta un poco antes de la vertical y aprieta un instante.',
      'Baja durante 2 segundos completos. La mitad baja, en estiramiento, es donde este ejercicio se gana su sitio.'
    ],
    errs: [
      'Que los codos se despeguen de la almohadilla arriba: eso ya es un curl de pie con pasos de más.',
      'Rebotar desde abajo. En estiramiento es la posición más vulnerable para el tendón del bíceps; nunca rebotes ahí.',
      'Levantarte del asiento para sacar la última repetición.',
      'Doblar las muñecas hacia atrás. Nudillos en línea con el antebrazo.'
    ],
    heavy: 'El curl scott se siente mucho más duro que el curl de pie con el mismo peso, porque la almohadilla quita todas las formas de hacer trampa. Cuenta con usar claramente menos que de pie. Eso es correcto, no es retroceder.'
  },
  triprop: {
    n: 'Extensión de Tríceps en Polea', g: 'Tríceps',
    alt: 'Máquina de fondos asistidos o press francés con mancuernas.',
    feel: 'La parte de atrás del brazo.',
    cues: [
      'De pie, un pie ligeramente adelantado, torso inclinado unos 10–15°.',
      'Codos pegados al costado y FIJOS a la altura de las costillas.',
      'Solo se mueve el antebrazo: estira hasta un bloqueo suave abajo.',
      'Con la cuerda, separa las manos al final del recorrido.',
      'Sube controlado hasta unos 90° de flexión de codo, sin dejar que los codos se vayan hacia adelante.'
    ],
    errs: [
      'Usar todo el cuerpo como una tabla que sube y baja bombeando.',
      'Codos que viajan adelante y atrás.',
      'Tanto peso que te levanta del suelo.'
    ],
    heavy: 'Si se te levantan los talones o tienes que inclinarte mucho más, quita un disco.'
  },

  /* ---------------- PIERNA ---------------- */
  legpress: {
    n: 'Prensa de Piernas', g: 'Cuádriceps + glúteos',
    alt: 'Hack squat o sentadilla en multipower.',
    feel: 'Cuádriceps y glúteos. Nunca un dolor puntual en la rodilla o en la lumbar.',
    cues: [
      'Pies al ancho de los hombros, en el centro de la plataforma, puntas ligeramente hacia afuera.',
      'La lumbar y los glúteos SE QUEDAN pegados al respaldo. Ese es el punto de seguridad número uno.',
      'Baja hasta unos 90° de flexión de rodilla, o hasta justo antes de que la pelvis empiece a despegarse.',
      'Empuja con el medio del pie y el talón, no con las puntas.',
      'No claves las rodillas en bloqueo arriba: deja una flexión leve.',
      'Bajada de 2 segundos, empuje controlado. Sin rebotes.',
      'Solo quita los seguros cuando estés colocado y sepas cómo volver a ponerlos.'
    ],
    errs: [
      'Bajar tanto que la cadera se enrolla y la lumbar se despega: riesgo real de lesión lumbar.',
      'Rodillas que se van hacia adentro: empuja las rodillas hacia afuera, en línea con los pies.',
      'Poner las manos en las rodillas para ayudarte: agarra las asas.',
      'Bloquear las rodillas de golpe.'
    ],
    heavy: 'Si la pelvis se te levanta abajo o tienes que empujar las rodillas con las manos, pesa demasiado.'
  },
  rdl: {
    n: 'Peso Muerto Rumano con Mancuernas', g: 'Isquiotibiales + glúteos',
    alt: 'Si dudas de tu técnica: hip thrust en máquina o hiperextensiones en máquina. Con 3 semanas entrenando, EMPIEZA con mancuernas, no con barra.',
    feel: 'Un estiramiento fuerte en la parte de atrás del muslo (isquios). Si lo sientes en la lumbar, la técnica está mal.',
    cues: [
      'Es el ejercicio más técnico del programa. Empieza con dos mancuernas ligeras (6–10 kg cada una) y aprende el patrón.',
      'De pie, pies al ancho de la cadera, rodillas con una flexión FIJA de unos 15° (esto no es una sentadilla).',
      'BISAGRA de cadera: lleva la cadera hacia atrás, como si cerraras la puerta del coche con el culo.',
      'Las mancuernas bajan pegadas a los muslos, rozando las piernas.',
      'Pecho arriba, espalda plana y neutra. Imagina una barra de acero desde la cabeza hasta el coxis.',
      'Baja SOLO hasta donde puedas mantener la espalda plana y notar el estiramiento (normalmente justo debajo de la rodilla).',
      'Sube apretando los glúteos y llevando la cadera hacia adelante. La espalda no hace el trabajo.',
      'Inspira arriba, aguanta durante la bajada, exhala al subir.'
    ],
    errs: [
      'Redondear la lumbar: PARA la serie de inmediato. Baja el peso y acorta el recorrido.',
      'Convertirlo en sentadilla (doblar mucho las rodillas): la rodilla casi no se mueve.',
      'Dejar que las mancuernas se separen del cuerpo: multiplica la carga en tu lumbar.',
      'Hiperextender la espalda arriba: termina de pie, neutro, glúteos apretados.'
    ],
    heavy: 'Regla: si la espalda se redondea aunque sea un poco, ya pesa demasiado. Nunca lleves este ejercicio al fallo (mínimo RIR 3).'
  },
  bss: {
    n: 'Sentadilla Búlgara', g: 'Cuádriceps + glúteos (una pierna)',
    alt: 'Zancadas estáticas o prensa a una pierna si el equilibrio te cuesta de verdad.',
    feel: 'El cuádriceps y el glúteo de la pierna DELANTERA.',
    cues: [
      'Empieza SIN peso hasta dominar el equilibrio. Después sujeta mancuernas ligeras a los lados.',
      'El empeine del pie de atrás apoyado en un banco de unos 40 cm.',
      'Pie delantero lo bastante adelante para que abajo la rodilla quede sobre el tobillo o un poco por delante.',
      'Inclina un poco el torso hacia adelante para más glúteo; quédate erguido para más cuádriceps.',
      'Baja controlado hasta que el muslo delantero esté casi paralelo al suelo.',
      'Sube empujando con el TALÓN del pie delantero.',
      'Haz todas las repeticiones de una pierna, descansa unos 30 s y cambia. El descanso completo va después de las dos.'
    ],
    errs: [
      'Rodilla delantera que se va hacia adentro: piensa "rodilla hacia el dedo pequeño".',
      'Pie delantero demasiado cerca del banco: castiga la rodilla.',
      'Cargar la pierna de atrás: solo es un punto de equilibrio.',
      'Perder el equilibrio y trastabillar: baja el peso o apóyate suave con una mano.'
    ],
    heavy: 'Si no puedes hacer 8 repeticiones limpias sin tambalearte, entrénalo con tu propio peso unas semanas más.'
  },
  legcurl: {
    n: 'Curl Femoral', g: 'Isquiotibiales',
    alt: 'Sentado o tumbado, el que tenga tu gimnasio.',
    feel: 'La parte de atrás del muslo.',
    cues: [
      'Ajusta la máquina para que su eje (la bisagra) quede alineado con tu rodilla.',
      'La almohadilla apoya justo encima del talón / tendón de Aquiles, no en el gemelo.',
      'La cadera se queda pegada al asiento o al banco todo el rato.',
      'Flexiona y aprieta fuerte 1 segundo en la contracción máxima.',
      'Vuelve DESPACIO (2–3 s) hasta casi extensión completa, sin dejar caer el peso.'
    ],
    errs: [
      'Levantar la cadera del banco para hacer trampa.',
      'Dejar que el peso se estrelle al bajar.',
      'Recorrido parcial.'
    ],
    heavy: 'Si se te levanta la cadera, baja el peso.'
  },
  legext: {
    n: 'Extensión de Cuádriceps', g: 'Cuádriceps',
    alt: '—',
    feel: 'Cuádriceps, sobre todo cerca de la rodilla al extender.',
    cues: [
      'Ajusta el respaldo para que la parte de atrás de la rodilla toque el borde del asiento.',
      'Almohadilla en la parte baja de la espinilla, por encima del tobillo.',
      'Extiende hasta un poco antes del bloqueo y aprieta 1 segundo.',
      'Baja controlado durante 2 segundos, sin dejar que los discos choquen.',
      'Espalda contra el respaldo, agarra las asas.'
    ],
    errs: [
      'Dar patadas con impulso y soltar el peso.',
      'Levantar los glúteos del asiento.',
      'Tanto peso que solo recorres un cuarto del rango.'
    ],
    heavy: 'Si te despegas del respaldo o tienes que dar patadas, usa menos peso y más control.'
  },
  calf: {
    n: 'Elevación de Gemelos', g: 'Gemelos',
    alt: 'En máquina de pie, en la prensa, o en un escalón con una mancuerna.',
    feel: 'Gemelo, con un estiramiento claro abajo.',
    cues: [
      'Metatarsos en el borde de la plataforma, talones al aire.',
      'Baja los talones todo lo que puedas y aguanta el estiramiento 1–2 segundos.',
      'Sube del todo de puntillas y aprieta 1 segundo arriba.',
      'Ritmo lento: el gemelo responde al tiempo bajo tensión, no a los rebotes.',
      'Rodillas casi estiradas (versión de pie).'
    ],
    errs: [
      'Rebotar rápido sobre el tendón: cero estímulo.',
      'Recorrido corto (medio arriba, medio abajo).',
      'Doblar las rodillas para ayudarte.'
    ],
    heavy: 'Si no puedes hacer una pausa de 1 segundo arriba y abajo, baja el peso.'
  },
  core: {
    n: 'Core — Dead Bug + Plancha', g: 'Abdomen / core',
    alt: 'Más adelante: elevaciones de piernas colgado o crunch en polea, cuando la técnica esté sólida.',
    feel: 'Abdomen profundo, con la lumbar PEGADA al suelo.',
    cues: [
      'Para ti, con 3 semanas entrenando, el mejor trabajo de core es ANTI-movimiento: dead bugs y planchas. Enseñan al tronco a mantenerse rígido, que es exactamente lo que protege tu espalda en el peso muerto rumano y en la prensa.',
      'DEAD BUG: boca arriba, brazos al techo, rodillas a 90°. Baja a la vez el brazo derecho y la pierna izquierda, despacio, sin dejar que la lumbar se despegue del suelo. Vuelve y alterna. 10–12 por lado.',
      'PLANCHA: codos bajo los hombros, glúteos apretados, costillas hacia abajo, cuerpo en línea recta. 30–45 segundos de calidad valen más que 2 minutos con la cadera caída.',
      'Nada de crunches infinitos: un abdomen marcado sale del porcentaje de grasa más un core entrenado, no de repeticiones sin fin.'
    ],
    errs: [
      'Lumbar arqueada y despegada del suelo en los dead bugs: acorta el recorrido.',
      'Cadera demasiado alta o hundida en la plancha.',
      'Aguantar la respiración: sigue respirando todo el rato.'
    ],
    heavy: 'Si no puedes mantener la lumbar en el suelo, usa menos rango o menos repeticiones.'
  },

  /* ---------------- más EMPUJE + TIRÓN ---------------- */
  incbar: {
    n: 'Press Inclinado (barra o máquina)', g: 'Pecho alto',
    alt: 'Press inclinado en máquina si no hay nadie que te asegure con la barra.',
    feel: 'Pecho alto.',
    cues: [
      'Banco a 30°. Misma colocación que en press de banca: omóplatos atrás y abajo, pies firmes.',
      'Agarre un poco más cerrado que en banca plana.',
      'La barra baja a las clavículas / parte muy alta del pecho.',
      'Toque suave, sin rebote, y empuja hacia arriba y ligeramente atrás, en diagonal.',
      'Codos a ~45–60°, no completamente abiertos.'
    ],
    errs: [
      'Bajar la barra a la mitad del pecho (eso es un press plano mal hecho).',
      'Levantar la cadera del banco.',
      'Rebotar.'
    ],
    heavy: 'Si la barra se te queda parada o se inclina hacia un lado, baja el peso.'
  },
  machrow: {
    n: 'Remo en Máquina o Polea (agarre neutro)', g: 'Espalda media',
    alt: 'Remo a una mano con mancuerna apoyado en un banco.',
    feel: 'Entre los omóplatos y en los dorsales.',
    cues: [
      'Pecho bien apoyado contra la almohadilla (en máquina con apoyo de pecho).',
      'Empieza el tirón juntando los omóplatos.',
      'Codos rozando los costados, tira hacia atrás y ligeramente abajo.',
      'Pausa de 1 segundo en la contracción.',
      'Vuelta controlada en 2–3 s, dejando que los dorsales se estiren sin perder la postura.'
    ],
    errs: [
      'Despegar el pecho de la almohadilla para mover más peso.',
      'Encoger los hombros.',
      'Convertirlo en un ejercicio solo de bíceps.'
    ],
    heavy: 'Si te despegas del apoyo, quita un disco.'
  },
  ohp: {
    n: 'Press de Hombro con Mancuernas', g: 'Deltoides frontal',
    alt: 'Press de hombro en máquina (más fácil de aprender).',
    feel: 'Hombros y tríceps.',
    cues: [
      'Sentado con el respaldo casi vertical (80–90°), espalda apoyada.',
      'Mancuernas a la altura de la oreja, codos ligeramente ADELANTE del cuerpo (unos 30°), no completamente abiertos.',
      'Aprieta glúteos y abdomen: nada de arquear la lumbar.',
      'Empuja hacia arriba y un poco hacia adentro, sin chocar las mancuernas.',
      'Baja controlado hasta que los codos queden a la altura del hombro o un poco por debajo.'
    ],
    errs: [
      'Arquear mucho la lumbar (se convierte en un press inclinado y castiga la columna).',
      'Codos totalmente abiertos en línea con las orejas: tensión innecesaria en el hombro.',
      'Quedarte corto de recorrido arriba.'
    ],
    heavy: 'Si arqueas la espalda solo para arrancar la repetición, baja 2 kg por mano.'
  },
  latpull2: {
    n: 'Jalón al Pecho o Dominada Asistida', g: 'Dorsales',
    alt: 'Si puedes hacer 5 o más dominadas asistidas limpias, usa la máquina de asistencia y ve reduciendo la ayuda.',
    feel: 'Dorsales.',
    cues: [
      'Mismas claves que el jalón del Superior A: primero hombros abajo, codos al bolsillo trasero.',
      'En dominadas asistidas: agarre algo más abierto que los hombros, pecho arriba, sin balanceo.',
      'Baja controlado hasta el estiramiento completo antes de la siguiente repetición.',
      'Objetivo a medio plazo: reducir la asistencia hasta hacer dominadas libres.'
    ],
    errs: [
      'Dar impulso con las piernas en las dominadas asistidas.',
      'Recorrido parcial.',
      'Encoger los hombros.'
    ],
    heavy: 'En la máquina de asistencia, si no llegas a 8 repeticiones limpias, sube la asistencia (menos peso corporal que levantar).'
  },
  inchammer: {
    n: 'Curl Martillo Inclinado', g: 'Bíceps + braquial',
    alt: 'Curl martillo de pie, o curl martillo con cuerda en polea.',
    feel: 'Bíceps y la parte de fuera del antebrazo, con un estiramiento largo abajo en cada repetición. Este es el que engrosa el brazo visto de frente.',
    cues: [
      'Pon el banco a unos 45–60°. Siéntate con la cabeza y la parte alta de la espalda apoyadas.',
      'Deja los brazos colgando rectos hacia abajo y un poco POR DETRÁS del torso. Esa posición colgando es toda la razón de hacerlo inclinado.',
      'Agarre neutro — palmas enfrentadas, como si sujetaras dos martillos — y mantenlo toda la repetición.',
      'Los brazos no se mueven. Solo se mueve el antebrazo.',
      'Sube hasta un poco antes de la vertical y baja en 2 segundos hasta que el brazo vuelva a colgar recto.'
    ],
    errs: [
      'Rodar los hombros hacia adelante para que los brazos cuelguen al lado en vez de por detrás. Eso mata el estiramiento y lo convierte otra vez en un curl de pie.',
      'Subir las mancuernas con impulso de hombro.',
      'Quedarte corto abajo. El estiramiento es la razón de estar tumbado.',
      'Poner el banco demasiado vertical. Pasados unos 60° pierdes casi todo el beneficio.'
    ],
    heavy: 'El inclinado es más duro que el curl martillo de pie, porque no puedes usar el cuerpo en absoluto. Empieza 1–2 kg por mano por debajo de lo que harías de pie y recupéralo entrenando.'
  },
  tripro2: {
    n: 'Extensión de Tríceps en Polea (cuerda)', g: 'Tríceps',
    alt: 'Extensión de tríceps con cuerda por encima de la cabeza (más estiramiento, buen complemento).',
    feel: 'La parte de atrás del brazo, sobre todo cerca del codo.',
    cues: [
      'Igual que la extensión del Superior A, pero con la cuerda separa bien las manos abajo.',
      'Aprieta 1 segundo abajo con los codos totalmente extendidos.',
      'Codos pegados y fijos.'
    ],
    errs: ['Usar el peso del cuerpo para empujar hacia abajo.', 'Codos que se mueven.', 'No extender del todo.'],
    heavy: 'Si te levanta del suelo, quita un disco.'
  },

  /* --- pecho --- */
  dbpress: {
    n: 'Press Plano con Mancuernas', g: 'Pecho',
    alt: 'Press de pecho en máquina.',
    feel: 'Pecho, con un estiramiento abajo más profundo del que permite una barra.',
    cues: [
      'Siéntate con las mancuernas sobre los muslos y empújalas con las rodillas mientras te tumbas.',
      'Omóplatos atrás y abajo, pies planos en el suelo.',
      'Baja hasta que los codos queden justo por debajo de la línea del torso: ese es el estiramiento que una barra no te puede dar.',
      'Empuja hacia arriba y un poco hacia dentro, sin chocarlas arriba.',
      'Muñecas rectas y alineadas sobre los codos todo el recorrido.'
    ],
    errs: [
      'Dejar que las mancuernas se abran demasiado: el hombro se lleva la carga en vez del pecho.',
      'Medio recorrido, parando a la altura del pecho.',
      'Soltarlas al suelo al acabar en vez de incorporarte con ellas sobre el pecho.'
    ],
    heavy: 'Si no puedes colocártelas tú solo, pesan demasiado. Las mancuernas castigan el ego más que una barra.'
  },
  cablefly: {
    n: 'Aperturas en Polea', g: 'Pecho',
    alt: 'Contractora (peck deck), o aperturas con mancuernas en banco plano.',
    feel: 'Por el centro del pecho, más fuerte cuando las manos se juntan.',
    cues: [
      'Poleas a la altura del hombro para el pecho medio, más bajas para el pecho alto.',
      'Un pie adelantado, torso inclinado unos 15° hacia el movimiento.',
      'Codos con una flexión leve y fija. No se abren ni se cierran: quien se mueve es el hombro.',
      'Junta las manos delante del esternón y aprieta un segundo entero.',
      'Déjalas volver hasta notar el estiramiento en el pecho, y ahí para.'
    ],
    errs: [
      'Doblar y estirar los codos: eso lo convierte en un press mal hecho.',
      'Irte tan atrás que el hombro se queda con el estiramiento.',
      'Ir con prisa. Es el ejercicio donde apretar despacio es todo el objetivo.'
    ],
    heavy: 'Si los codos empiezan a doblarse para mover el peso, quita un disco. Una apertura nunca es pesada.'
  },
  machfly: {
    n: 'Contractora (peck deck)', g: 'Pecho',
    alt: 'Aperturas en polea.',
    feel: 'El pecho interno, con la máquina guiándote el recorrido.',
    cues: [
      'Ajusta el asiento para que los agarres queden a la altura del pecho, no del hombro.',
      'Espalda plana contra el respaldo, pies firmes.',
      'Junta las manos y aguanta un segundo donde la tensión es máxima.',
      'Abre despacio hasta notar el pecho estirado, sin dejar que los discos toquen abajo.'
    ],
    errs: [
      'Asiento demasiado bajo: se convierte en ejercicio de hombro.',
      'Dejar que el peso golpee abajo en cada repetición.',
      'Encoger los hombros hacia las orejas al apretar.'
    ],
    heavy: 'Si los hombros se te van hacia delante para terminar la repetición, baja el peso.'
  },
  dipchest: {
    n: 'Fondos en Paralelas (asistidos)', g: 'Pecho + tríceps',
    alt: 'Máquina de asistencia al principio; press declinado si el hombro se queja.',
    feel: 'Pecho bajo y tríceps.',
    cues: [
      'Empieza en la máquina de asistencia. Más asistencia significa menos peso corporal que levantar.',
      'Inclina el torso HACIA DELANTE unos 30°: erguido es ejercicio de tríceps, inclinado es de pecho.',
      'Los codos se abren ligeramente hacia fuera y atrás, no pegados al costado.',
      'Baja hasta que los brazos queden más o menos paralelos al suelo, y ni un dedo más.',
      'Sube sin bloquear los codos de golpe arriba.'
    ],
    errs: [
      'Bajar demasiado. Pasada la paralela el hombro está en su posición más vulnerable y no hay nada que ganar.',
      'Rebotar abajo.',
      'Encoger los hombros: mantenlos tirados hacia abajo, lejos de las orejas.'
    ],
    heavy: 'Cualquier pinchazo en la parte delantera del hombro significa parar la serie y acortar el recorrido. La profundidad no vale un hombro.'
  },

  /* --- espalda --- */
  pullup: {
    n: 'Dominada', g: 'Dorsales',
    alt: 'Máquina de dominadas asistidas, o una goma bajo la rodilla, hasta que domines 5 repeticiones limpias.',
    feel: 'Dorsales, desde la axila bajando por el lateral de la espalda.',
    cues: [
      'Agarre algo más abierto que los hombros, palmas hacia fuera.',
      'Empieza colgado con los brazos rectos, y baja los HOMBROS antes de doblar ningún codo.',
      'Lleva los codos abajo y atrás hacia las costillas, pecho hacia la barra.',
      'La barbilla pasa la barra sin estirar el cuello.',
      'Baja en 2–3 segundos hasta quedar colgado del todo otra vez.'
    ],
    errs: [
      'Dar impulso con las piernas. Si lo necesitas, usa la máquina de asistencia.',
      'Parar a medio bajar. La parte de abajo de una dominada es donde el dorsal crece de verdad.',
      'Encoger los hombros al empezar en vez de bajar los omóplatos.'
    ],
    heavy: 'Si no llegas a 5 repeticiones limpias, usa asistencia y ve reduciéndola con las semanas. Las dominadas mal hechas no construyen nada.'
  },
  dbrow: {
    n: 'Remo a una Mano con Mancuerna', g: 'Espalda',
    alt: 'Remo en máquina con apoyo de pecho si tienes la lumbar cansada.',
    feel: 'El dorsal del lado que trabaja, desde la axila hacia abajo.',
    cues: [
      'Una rodilla y una mano en el banco, el otro pie firme en el suelo.',
      'Espalda plana y más o menos paralela al suelo: ni redondeada ni erguida.',
      'Deja que la mancuerna cuelgue y el omóplato se separe abajo.',
      'Tira del codo arriba y atrás hacia la cadera, no hacia fuera.',
      'Aprieta arriba y baja en 2 segundos hasta el estiramiento completo.'
    ],
    errs: [
      'Girar el torso para lanzar el peso: los hombros se quedan nivelados.',
      'Tirar hacia la axila en vez de hacia la cadera, lo que lo convierte en ejercicio de deltoides posterior.',
      'Redondear la lumbar abajo.'
    ],
    heavy: 'Si el torso rota para terminar una repetición, pesa demasiado. Ir de uno en uno hace la trampa evidente.'
  },
  tbar: {
    n: 'Remo en T', g: 'Espalda media',
    alt: 'Remo en máquina con apoyo de pecho.',
    feel: 'Grosor por el centro de la espalda, entre los omóplatos.',
    cues: [
      'Pecho en la almohadilla si la máquina la tiene. Saca tu lumbar de la ecuación.',
      'Agarre neutro, brazos estirados al empezar, omóplatos separados.',
      'Empieza el tirón juntando los omóplatos, y después lleva los codos atrás.',
      'Pausa de un segundo arriba con el pecho todavía en la almohadilla.',
      'Baja en 2–3 segundos hasta el estiramiento completo.'
    ],
    errs: [
      'Despegar el pecho de la almohadilla para mover más peso.',
      'Dar tirones con la lumbar en un remo en T sin apoyo.',
      'Medias repeticiones que nunca llegan al estiramiento.'
    ],
    heavy: 'Si el pecho se despega de la almohadilla, quita un disco. Esa almohadilla es la razón entera de elegir esto en vez de un remo con barra.'
  },
  pullover: {
    n: 'Pullover en Polea (brazos rectos)', g: 'Dorsales',
    alt: 'Pullover con mancuerna en un banco.',
    feel: 'Un estiramiento largo por los dorsales. El único ejercicio de dorsal donde el codo no se dobla.',
    cues: [
      'Colócate un paso por detrás de una polea alta, con una inclinación leve de cadera.',
      'Brazos casi rectos con una flexión pequeña y fija, y ASÍ se quedan.',
      'Baja la barra en arco hasta los muslos usando solo el hombro.',
      'Aprieta los dorsales un segundo abajo.',
      'Deja que los brazos suban por encima de la cabeza hasta notar los dorsales alargarse.'
    ],
    errs: [
      'Doblar los codos: se convierte en una extensión de tríceps.',
      'Estar demasiado erguido, lo que mata el estiramiento de arriba.',
      'Usar la lumbar para empujar la barra hacia abajo.'
    ],
    heavy: 'Si los codos se doblan o la espalda se redondea, baja el peso. Este va del estiramiento, nunca del número.'
  },
  facepull: {
    n: 'Face Pull (jalón a la cara)', g: 'Deltoides posterior + espalda media',
    alt: 'Pájaros en la contractora invertida, o aperturas inversas con mancuernas inclinado.',
    feel: 'La parte de atrás de los hombros y entre los omóplatos.',
    cues: [
      'Cuerda en la polea a la altura de la cara, más o menos.',
      'Tira de la cuerda hacia la frente, separando las manos según llega.',
      'Termina con los nudillos junto a las orejas y los codos altos, como en una pose de doble bíceps.',
      'Aprieta un segundo y vuelve despacio con los brazos completamente estirados.',
      'Poco peso y muchas repeticiones. Esto es un ejercicio de postura, no de fuerza.'
    ],
    errs: [
      'Demasiado peso, con lo que se convierte en un remo a la altura del pecho.',
      'Echarte hacia atrás para arrastrar la cuerda.',
      'Dejar que los codos caigan por debajo de las muñecas.'
    ],
    heavy: 'Si te echas atrás o los codos caen, quita la mitad del peso. El face pull protege el hombro con el que empujas: no lo conviertas en trabajo de ego.'
  },

  /* --- brazos --- */
  curlbar: {
    n: 'Curl con Barra Z', g: 'Bíceps',
    alt: 'Curl con barra recta, o con mancuernas de uno en uno.',
    feel: 'Todo el bíceps. La barra acodada deja las muñecas cómodas.',
    cues: [
      'Agarra la parte inclinada de la barra, manos al ancho de los hombros.',
      'Codos pegados al costado y FIJOS. Solo se mueve el antebrazo.',
      'Sube hasta poco antes de la vertical, para que el bíceps mantenga tensión.',
      'Baja en 2 segundos hasta extender el codo del todo.',
      'De pie erguido: nada de echarte hacia atrás para arrancar la repetición.'
    ],
    errs: [
      'Balancear la cadera. Si lo necesitas, quita 5 kg.',
      'Codos que se van hacia delante, lo que pasa el trabajo al deltoides frontal.',
      'Quedarte corto abajo y no estirar nunca el brazo.'
    ],
    heavy: 'Si tu espalda se echa atrás para ponerla en marcha, pesa demasiado.'
  },
  cablecurl: {
    n: 'Curl en Polea', g: 'Bíceps',
    alt: 'Curl con mancuernas, aunque la tensión es menos constante.',
    feel: 'Tensión constante, sin ningún punto fácil arriba.',
    cues: [
      'Polea baja, barra o cuerda, un paso por delante para que el cable tire ligeramente hacia atrás.',
      'Codos al costado y quietos.',
      'Sube, aprieta, y controla la bajada durante 2 segundos.',
      'No dejes que el peso descanse entre repeticiones: esa es la razón de usar polea.'
    ],
    errs: [
      'Ponerte demasiado cerca, lo que mata la tensión abajo.',
      'Dejar que la torre de discos toque y descansar a media serie.',
      'Echarte atrás en las últimas repeticiones.'
    ],
    heavy: 'Si el peso golpea abajo en cada repetición, estás usando impulso, no músculo.'
  },
  conc: {
    n: 'Curl Concentrado', g: 'Bíceps',
    alt: 'Curl scott de un brazo.',
    feel: 'El pico del bíceps, más aislado que en ningún otro curl.',
    cues: [
      'Sentado en un banco, pies abiertos, apoya la parte de atrás del brazo contra la cara interna del muslo.',
      'Ese muslo es todo el objetivo: hace imposible mover el brazo.',
      'Sube despacio, girando un poco el meñique hacia ti arriba.',
      'Aprieta un segundo y baja en 2–3 segundos hasta el estiramiento completo.',
      'Todas las repeticiones de un brazo, y después el otro.'
    ],
    errs: [
      'Dejar que el brazo se despegue del muslo.',
      'Echarte atrás para ayudarte en las últimas.',
      'Bajar con prisa, que es donde está la mayor parte del trabajo.'
    ],
    heavy: 'Ve ligero. Si necesitas al cuerpo para ayudarte, el aislamiento se ha ido y con él el sentido del ejercicio.'
  },
  skull: {
    n: 'Press Francés', g: 'Tríceps',
    alt: 'Extensión con cuerda por encima de la cabeza, que es más amable con el codo.',
    feel: 'La cabeza larga del tríceps, bien estirada por detrás del brazo.',
    cues: [
      'Tumbado en banco plano con una barra Z, brazos verticales sobre los hombros.',
      'Mantén los brazos QUIETOS y ligeramente inclinados hacia atrás, por encima de la cabeza.',
      'Dobla solo el codo, bajando la barra hacia la frente o justo por detrás.',
      'Para antes de que la barra toque, y extiende sin bloquear con fuerza arriba.',
      'Despacio al bajar: 2 segundos como mínimo.'
    ],
    errs: [
      'Dejar que los brazos se balanceen adelante y atrás, convirtiéndolo en un pullover.',
      'Ir demasiado pesado y dejar caer la barra hacia la cara. Pide que te aseguren o empieza muy ligero.',
      'Bloquear los codos de forma brusca arriba.'
    ],
    heavy: 'Cualquier dolor de codo significa parar y cambiar a la versión con cuerda por encima de la cabeza. Los codos tardan en perdonar este.'
  },
  ohtri: {
    n: 'Extensión de Tríceps sobre la Cabeza', g: 'Tríceps',
    alt: 'Extensión con una mancuerna sujeta con las dos manos.',
    feel: 'Un estiramiento profundo por detrás del brazo. El mejor estiramiento de tríceps que hay.',
    cues: [
      'Cuerda en polea baja o media, date la vuelta y da un paso adelante.',
      'Cuerda detrás de la cabeza, codos apuntando hacia delante y altos.',
      'Extiende los brazos rectos por encima de la cabeza, separando la cuerda arriba.',
      'Deja que los codos se doblen del todo detrás de la cabeza para el estiramiento, sin dejar que se abran.',
      'Los brazos se quedan junto a las orejas todo el rato.'
    ],
    errs: [
      'Codos que se abren hacia los lados.',
      'Dejar caer los brazos, lo que acorta el estiramiento que hace que este ejercicio valga la pena.',
      'Arquear la lumbar para empujar el peso arriba.'
    ],
    heavy: 'Si arqueas la lumbar o se te abren los codos, quita un disco.'
  },
  dips: {
    n: 'Fondos en Banco', g: 'Tríceps',
    alt: 'Máquina de fondos asistidos en posición erguida, o flexiones con manos juntas.',
    feel: 'La parte de atrás de los brazos, con estiramiento abajo.',
    cues: [
      'Manos en el borde de un banco detrás de ti, dedos hacia delante, talones en el suelo.',
      'El torso se queda cerca del banco durante toda la bajada.',
      'Baja hasta que los codos lleguen a unos 90° y ni un dedo más.',
      'Empuja hacia arriba con la base de las manos.',
      'Dobla las rodillas para hacerlo más fácil; estira las piernas o pon un disco en el regazo para hacerlo más difícil.'
    ],
    errs: [
      'Hundirte demasiado, lo que pone el hombro en mala posición a cambio de nada.',
      'Separarte del banco, con lo que los hombros se llevan el trabajo.',
      'Rebotar abajo.'
    ],
    heavy: 'Si la parte delantera del hombro se queja, reduce primero la profundidad y después las repeticiones.'
  },

  /* --- pierna --- */
  squat: {
    n: 'Sentadilla Goblet', g: 'Cuádriceps + glúteos',
    alt: 'Hack squat o prensa si el límite es el equilibrio.',
    feel: 'Cuádriceps y glúteos, con el core trabajando duro para mantenerte erguido.',
    cues: [
      'Sujeta una mancuerna en vertical contra el pecho, codos metidos hacia dentro.',
      'Pies algo más abiertos que los hombros, puntas ligeramente hacia fuera.',
      'Siéntate HACIA ABAJO entre las caderas, no hacia atrás: el peso delante te mantiene erguido.',
      'Baja todo lo que puedas con la espalda plana, idealmente muslos por debajo de la paralela.',
      'Sube empujando con el medio del pie, rodillas siguiendo la línea de los dedos.'
    ],
    errs: [
      'Talones que se levantan: te falta movilidad de tobillo, o pon discos pequeños debajo.',
      'Rodillas que se van hacia dentro al subir.',
      'Redondear la lumbar abajo, que es el punto donde debes dejar de bajar.'
    ],
    heavy: 'La sentadilla goblet se limita sola: cuando ya no puedes sostener la mancuerna arriba, ese es tu techo. Pasa al hack squat en vez de forzarla.'
  },
  hack: {
    n: 'Hack Squat (sentadilla hack)', g: 'Cuádriceps',
    alt: 'Prensa, o sentadilla en multipower.',
    feel: 'Cuádriceps, más duro de lo que puede darles cualquier otra cosa del gimnasio.',
    cues: [
      'Espalda y cadera planas contra el respaldo, hombros bajo las almohadillas.',
      'Pies al ancho de los hombros, en el centro de la plataforma. Más arriba es más glúteo, más abajo es más cuádriceps.',
      'Quita los seguros solo cuando estés colocado y sepas cómo volver a ponerlos.',
      'Baja en 2–3 segundos hasta unos 90° de rodilla o un poco más.',
      'Sube sin bloquear las rodillas de golpe.'
    ],
    errs: [
      'Dejar que la lumbar se despegue del respaldo abajo.',
      'Rodillas que se van hacia dentro.',
      'Rebotar desde abajo en vez de controlarlo.'
    ],
    heavy: 'Si la cadera se te despega del respaldo abajo, o bajas menos o quitas peso.'
  },
  lunge: {
    n: 'Zancadas Caminando', g: 'Cuádriceps + glúteos (una pierna)',
    alt: 'Zancadas estáticas en el sitio, o la sentadilla búlgara.',
    feel: 'El cuádriceps y el glúteo de la pierna delantera, y tu equilibrio.',
    cues: [
      'Empieza solo con tu peso hasta que puedas dar diez pasos sin tambalearte.',
      'Da un paso lo bastante largo para que la espinilla delantera quede casi vertical abajo.',
      'Baja hasta que la rodilla de atrás quede justo por encima del suelo.',
      'Sube empujando con el TALÓN delantero y encadena directamente el siguiente paso.',
      'Torso erguido, mancuernas colgando a los lados.'
    ],
    errs: [
      'Pasos demasiado cortos, que lanzan la rodilla por delante de la punta del pie.',
      'Dejar que la rodilla de atrás golpee el suelo.',
      'Inclinar el torso sobre la pierna delantera.'
    ],
    heavy: 'Si te tambaleas, pesa demasiado. El equilibrio es el límite mucho antes que la fuerza.'
  },
  hipthrust: {
    n: 'Elevación de Cadera (hip thrust)', g: 'Glúteos',
    alt: 'Puente de glúteo en el suelo, o la máquina de hip thrust.',
    feel: 'Glúteos, y casi nada más. Es el mejor ejercicio de glúteo que hay.',
    cues: [
      'Parte alta de la espalda contra el borde largo de un banco, justo debajo de los omóplatos.',
      'Pies planos, espinillas verticales ARRIBA del movimiento: así es como encuentras dónde poner los pies.',
      'Barbilla metida, costillas abajo. Mira al frente, no al techo.',
      'Empuja con los talones hasta formar una línea recta de rodilla a hombro.',
      'Aprieta los glúteos fuerte un segundo entero arriba, y baja controlado.'
    ],
    errs: [
      'Arquear la lumbar arriba en vez de terminar con el glúteo: este es el error principal.',
      'Empujar con las puntas de los pies.',
      'No llegar a extender del todo, con lo que el glúteo nunca alcanza la contracción completa.'
    ],
    heavy: 'Usa una almohadilla en la barra. Si arriba el trabajo lo hace la lumbar, baja el peso y aprieta más fuerte.'
  },
  seatedcalf: {
    n: 'Gemelo Sentado', g: 'Gemelos (sóleo)',
    alt: 'Gemelo de pie, aunque entrena una parte distinta.',
    feel: 'Profundo y bajo en la pantorrilla, por debajo de donde llega el gemelo de pie.',
    cues: [
      'Rodillas dobladas a 90° bajo la almohadilla, metatarsos en la plataforma.',
      'La rodilla doblada es lo que lo hace distinto: apunta al sóleo, debajo del gemelo visible.',
      'Baja los talones todo lo que puedas y aguanta el estiramiento un segundo.',
      'Sube del todo de puntillas y aprieta un segundo.',
      'Lento de principio a fin. El gemelo solo responde al tiempo bajo tensión.'
    ],
    errs: [
      'Rebotes rápidos y parciales, que son la razón por la que casi nadie tiene gemelos.',
      'Almohadilla colocada demasiado arriba del muslo, sobre la rodilla.',
      'Recorrido corto por arriba o por abajo.'
    ],
    heavy: 'Si no puedes hacer una pausa de un segundo entero arriba y abajo, pesa demasiado.'
  }
},

/* mismo formato que el inglés: [duración, nombre, detalle] */
WARMUP: {
  PUSH: [
    ['4 min', 'Cardio suave', 'Bici, elíptica o cinta en cuesta. A un ritmo en el que todavía podrías mantener una conversación. Solo para subir la temperatura y las pulsaciones.'],
    ['2 min', 'Movilidad de hombro', '10 círculos de brazo hacia adelante + 10 hacia atrás · 10 dislocaciones con goma o palo de escoba.'],
    ['2 min', 'Manguito rotador', '15 rotaciones externas por brazo con goma ligera. Es lo que mantiene el hombro sano a lo largo de tres ejercicios de empuje.'],
    ['3–4 min', 'Series de aproximación en press de banca', 'Barra vacía × 12 → 40% × 8 → 60% × 5 → 75% × 3. Descansos cortos (45–60 s). Estas NO cuentan como series efectivas.']
  ],
  LEGS: [
    ['4 min', 'Cardio suave', 'Bici o cinta en cuesta, a ritmo de conversación.'],
    ['2 min', 'Movilidad de cadera y tobillo', '10 balanceos de pierna adelante/atrás por lado · 10 balanceos laterales · 10 movilizaciones de tobillo llevando la rodilla a la pared.'],
    ['2 min', 'Activación', '15 sentadillas con tu propio peso · 15 puentes de glúteo · 10 bisagras de cadera sin peso (el patrón del peso muerto rumano).'],
    ['3–4 min', 'Aproximación del primer ejercicio', 'Prensa vacía o muy ligera × 12 → 50% × 8 → 70% × 5. No cuentan como series efectivas.']
  ],
  PULL: [
    ['4 min', 'Cardio suave', 'Bici, elíptica o cinta en cuesta.'],
    ['2 min', 'Movilidad torácica', '8 rotaciones torácicas tumbado de lado, por lado · 10 círculos de brazo. Una espalda que no extiende no puede tirar bien.'],
    ['2 min', 'Activación escapular', '10 tirones escapulares colgado de la barra, o en el jalón sin casi peso: solo llevar los hombros hacia abajo, sin doblar el codo. Es el movimiento sobre el que se construye todo el día.'],
    ['3–4 min', 'Aproximación en el jalón', '40% × 10 → 60% × 6 → 75% × 3. No cuentan como series efectivas.']
  ]
},

START: {
  bench:     { w: '20 kg (la barra olímpica vacía)', why: 'Casi todos empiezan aquí. La barra sola ya es un peso real y te deja aprender el patrón sin miedo.' },
  latpull:   { w: '25–30 kg', why: 'Debería permitirte 10 repeticiones limpias tirando con los codos, no con las manos.' },
  incdb:     { w: '8–10 kg por mano', why: 'Inclinado siempre se siente más pesado que plano. Empieza conservador.' },
  seatrow:   { w: '25–30 kg', why: 'Si el torso se balancea, baja el peso.' },
  latraise:  { w: '4–5 kg por mano', why: 'Sí, tan ligero. Es el error más común del gimnasio: el deltoides lateral es pequeño.' },
  preacher:  { w: 'la barra Z vacía (7–10 kg), o el disco más ligero de la máquina scott',
               why: 'La almohadilla quita todas las formas de hacer trampa, así que el peso honesto aquí está muy por debajo de un curl de pie. Aprende la posición de abajo antes de añadir nada.' },
  triprop:   { w: '15–20 kg', why: 'Con los codos fijos. Si se mueven, pesa demasiado.' },
  legpress:  { w: '40–60 kg además del trineo', why: 'El trineo vacío ya pesa 20–40 kg según la máquina. Empieza bajo y sube rápido.' },
  rdl:       { w: '8–10 kg por mano', why: 'Es técnica antes que fuerza. Muy ligero durante las primeras semanas.' },
  bss:       { w: 'solo tu peso corporal', why: 'Primero el equilibrio. Las mancuernas llegan cuando hagas 10 limpias sin tambalearte.' },
  legcurl:   { w: '15–20 kg', why: 'Sin levantar la cadera del banco.' },
  legext:    { w: '15–20 kg', why: 'Control total, sin patadas.' },
  calf:      { w: '20–30 kg', why: 'Con pausa de 1 segundo arriba y abajo.' },
  core:      { w: 'sin peso', why: 'Dead bugs y plancha. La calidad es el peso.' },
  incbar:    { w: '20 kg (la barra vacía)', why: 'Igual que en banca: la barra sola es suficiente para empezar.' },
  machrow:   { w: '25–30 kg', why: 'Pecho pegado al apoyo.' },
  ohp:       { w: '6–8 kg por mano', why: 'El press de hombro es donde menos peso vas a mover, y es completamente normal.' },
  latpull2:  { w: '25–30 kg', why: 'O la asistencia que te deje 8 dominadas limpias.' },
  inchammer: { w: '5–6 kg por mano', why: 'Un kilo o dos por debajo del curl martillo de pie. El estiramiento de abajo lo hace más duro de lo que parece.' },
  tripro2:   { w: '15–20 kg', why: 'Igual que la extensión del Superior A.' },
  dbpress:   { w: '10–12 kg por mano', why: 'Las mancuernas se sienten más pesadas que una barra al mismo total. Empieza por debajo de tu banca.' },
  cablefly:  { w: '5–8 kg por lado', why: 'Una apertura nunca es pesada. Si se doblan los codos, es demasiado.' },
  machfly:   { w: '15–20 kg', why: 'Lo justo para notar el apretón y poder aguantarlo un segundo.' },
  dipchest:  { w: 'la asistencia que te deje 8 repeticiones limpias', why: 'Más asistencia, menos peso corporal. Ve reduciéndola con las semanas.' },
  pullup:    { w: 'asistida, ajustada para 5–8 limpias', why: 'Las dominadas mal hechas no construyen nada. Gánate las libres.' },
  dbrow:     { w: '12–16 kg', why: 'De uno en uno la trampa se ve, así que sé honesto aquí.' },
  tbar:      { w: '20–25 kg más la barra', why: 'Pecho en la almohadilla. Si se despega, ese es tu límite.' },
  pullover:  { w: '15–20 kg', why: 'Los brazos se quedan rectos. En cuanto se doblen, quita un disco.' },
  facepull:  { w: '10–15 kg', why: 'Ligero a propósito. Esto protege el hombro con el que empujas.' },
  curlbar:   { w: 'la barra Z vacía (7–10 kg)', why: 'Apréndelo sin balanceo y después sube de 2,5 en 2,5.' },
  cablecurl: { w: '10–15 kg', why: 'Lo bastante ligero para que el peso no descanse entre repeticiones.' },
  conc:      { w: '5–7 kg', why: 'El curl más aislado que hay, así que el peso honesto es pequeño.' },
  skull:     { w: 'la barra Z vacía (7–10 kg)', why: 'Empieza por debajo de lo que te parezca fácil. Los codos tardan en perdonar este.' },
  ohtri:     { w: '10–15 kg', why: 'Lo justo para notar el estiramiento sin arquear la espalda.' },
  dips:      { w: 'tu peso, rodillas dobladas', why: 'Estira las piernas cuando 15 repeticiones se te queden fáciles.' },
  squat:     { w: '10–14 kg', why: 'Una mancuerna contra el pecho. Se limita sola, que es justo por qué es segura para aprender.' },
  hack:      { w: '20–40 kg más el trineo', why: 'El trineo ya pesa algo. Empieza bajo y sube rápido.' },
  lunge:     { w: 'primero tu propio peso', why: 'Diez pasos sin tambalearte, y después mancuernas.' },
  hipthrust: { w: '20–30 kg más la barra, con almohadilla', why: 'Nota el glúteo antes de perseguir el número.' },
  seatedcalf:{ w: '15–25 kg', why: 'Con una pausa de un segundo en cada extremo. Esa pausa es el ejercicio.' }
},

/* ---------------- listas cortas ---------------- */
POST: [
  ['photo',   'Foto de progreso (una a la semana basta)'],
  ['protein', 'Proteína + carbohidratos en 2 h'],
  ['water',   'Bebe agua — 500 ml o más'],
  ['log',     'Todas las series registradas: peso, reps, RIR'],
  ['stretch', '5 min de estiramiento suave de lo que entrenaste']
],

POSES: [
  { n: 'Frente relajado', tip: 'De frente a la cámara, brazos a los lados y relajados, sin flexionar. Esta es la foto que se usa para el análisis de simetría.' },
  { n: 'Espalda',         tip: 'De espaldas, brazos relajados. Muestra la anchura de los dorsales.' },
  { n: 'Perfil',          tip: 'De lado, siempre el mismo lado. Muestra pecho, postura y abdomen.' },
  { n: 'Doble bíceps',    tip: 'Opcional, brazos flexionados. Útil para comparar el desarrollo del brazo.' }
],

MARKS: [
  { n: 'Hueco del cuello', hint: 'El hueco entre las clavículas, justo en el centro.' },
  { n: 'Ombligo',          hint: 'El centro del ombligo. Junto con el punto de arriba define tu eje vertical.' },
  { n: 'Hombro izquierdo', hint: 'El borde MÁS EXTERNO de tu deltoides izquierdo (tu izquierda).' },
  { n: 'Hombro derecho',   hint: 'El borde más externo de tu deltoides derecho.' },
  { n: 'Cintura izquierda', hint: 'El punto más estrecho del lado izquierdo del torso.' },
  { n: 'Cintura derecha',  hint: 'El punto más estrecho del lado derecho.' }
],

MEASURES: [
  { n: 'Peso corporal', need: 'cualquier báscula de baño',
    tip: 'Siempre a la misma hora del día — a primera hora de la mañana es lo más fácil de repetir. Es el único número que te dice si estás comiendo suficiente para crecer.' },
  { n: 'Cintura', need: 'una cinta, o un cordón y una regla',
    tip: 'En el punto MÁS ESTRECHO, normalmente 2 cm por encima del ombligo. No metas barriga. Junto con el peso te dice si estás ganando músculo o solo ganando.' },
  { n: 'Contorno de hombros', need: 'una cinta, o un cordón y una regla',
    tip: 'Rodeando la parte más ancha de los deltoides, con los brazos relajados.' },
  { n: 'Pecho', need: 'una cinta, o un cordón y una regla',
    tip: 'A la altura del pezón, al final de una espiración normal.' },
  { n: 'Brazo (flexionado)', need: 'una cinta, o un cordón y una regla',
    tip: 'Bíceps flexionado, por la parte más gruesa. Los dos brazos.' },
  { n: 'Muslo', need: 'una cinta, o un cordón y una regla',
    tip: 'A mitad de camino entre la rodilla y la cadera.' },
  { n: 'Gemelo', need: 'una cinta, o un cordón y una regla',
    tip: 'Por la parte más gruesa, de pie.' }
],

NO_KIT: [
  ['Nada de nada', 'Fotos. La pestaña <b>Simetría</b> saca tu proporción hombro-cintura directamente de una foto de frente — sin herramientas, y es el número que más se parece a tu objetivo. Hazte una cada 2 semanas, mismo sitio, misma luz.'],
  ['Un móvil y un espejo', 'Añade cómo te queda la ropa. Una nota tipo "mismos vaqueros, el cinturón un agujero más suelto" en las notas de la sesión es un dato real, y dentro de tres meses te alegrarás de haberlo escrito.'],
  ['Un cordón y cualquier regla', 'Esto sustituye por completo a una cinta métrica. Rodea con el cordón, pellizca donde se junta, estíralo junto a una regla. Marca el cordón con boli para que la próxima medida empiece en el mismo sitio.'],
  ['Una báscula de baño', 'Peso corporal, una vez por semana, a la misma hora. A tu edad y tamaño es el número más útil de toda la app: es el que te dice si estás comiendo suficiente para crecer de verdad.'],
  ['Una cinta métrica', 'Todo lo anterior más los contornos. Está bien, pero no hace falta — una cinta cuesta muy poco si algún día la quieres, pero nada de esta app se rompe sin ella.']
],

/* ---------------- bloques de 12 semanas ---------------- */
BLOCKS: [
  { name: 'Bloque 1 — Adaptación y técnica',
    goal: 'Aprender los patrones. Que cada repetición se parezca a la anterior.',
    rules: [
      'RIR 3 en TODAS las series: terminas sintiendo que te sobraban 3 repeticiones.',
      'Sube peso solo cuando la técnica esté limpia Y llegues al tope del rango en todas las series.',
      'Prioridad absoluta: recorrido completo y bajada controlada de 2 segundos.',
      'Tener agujetas fuertes las 2 primeras semanas es normal. Se pasan solas.',
      'No cambies de ejercicio. Repetirlos es lo que te hace bueno en ellos.'
    ] },
  { name: 'Bloque 2 — Progresión',
    goal: 'Empezar a acumular carga real sin perder la forma.',
    rules: [
      'RIR 2 en la mayoría de series. Quédate en RIR 3 en el peso muerto rumano.',
      'Aplica la doble progresión a rajatabla: primero repeticiones, después peso.',
      'Si una semana no subes nada, no pasa nada. Repite el mismo peso y gana una repetición.',
      'Empieza a mirar tu volumen semanal en la pestaña PROGRESO: debería subir despacio.',
      'Si duermes menos de 7 h varios días seguidos, el progreso se para. A tu edad esa es la causa número uno.'
    ] },
  { name: 'Bloque 3 — Fuerza e hipertrofia',
    goal: 'Pisar el acelerador en los ejercicios que ya dominas.',
    rules: [
      'RIR 2 en las primeras series, RIR 1 en la ÚLTIMA serie de los ejercicios de aislamiento.',
      'Compuestos (banca, prensa, press de hombro): nunca por debajo de RIR 1.',
      'El peso muerto rumano se queda en RIR 3. Innegociable.',
      'Al terminar la semana 12: apunta tus mejores marcas, hazte fotos y medidas, y empieza otro ciclo con los mismos ejercicios.',
      'Plantéate una descarga solo si aparecen de verdad las señales de fatiga (mira la GUÍA).'
    ] }
],

/* ---------------- rutina de mandíbula ---------------- */
JAW: [
  { n: 'Retracción de barbilla', freq: 'A diario', dose: '3 × 10 repeticiones, 2 s de aguante',
    why: 'Lo más valioso de esta lista. La cabeza adelantada es lo que borra visualmente la mandíbula: saca la barbilla hacia delante y afloja la piel de debajo. Corregirlo te cambia el perfil de inmediato, antes de que crezca ningún músculo.',
    how: [
      'Sentado o de pie erguido, mirada al frente, hombros relajados.',
      'Desliza la cabeza recta hacia atrás — no hacia abajo — como si te hicieras papada a propósito.',
      'Aguanta 2 segundos, nota el estiramiento en la base del cráneo, suelta despacio.',
      'No inclines la barbilla ni arriba ni abajo. Es un deslizamiento puro hacia atrás.'
    ],
    care: 'Si te mareas o notas hormigueo en los brazos, para y coméntaselo a un médico.' },
  { n: 'Isométricos de cuello', freq: '3 días por semana', dose: '2 × 10 s en cada dirección',
    why: 'Un cuello más grueso enmarca la mandíbula y hace que se vea más marcada de frente y de perfil. Los isométricos son la forma más segura de entrenarlo a los 16 — sin movimiento cargado y sin discos detrás de la cabeza.',
    how: [
      'Aprieta la palma contra la frente y empuja la cabeza contra ella. No dejes que la cabeza se mueva. 10 segundos.',
      'Repite con la mano en la nuca, y después a cada lado.',
      'Empuja al 50–60% de tu máximo, nunca a tope.',
      'Respira con normalidad todo el rato. No aguantes la respiración.'
    ],
    care: 'Nunca hagas movimientos explosivos de cuello ni puentes. Aquí nada debería mover el cuello en absoluto.' },
  { n: 'Movilidad suave de mandíbula', freq: '3 días por semana', dose: '2 × 10 repeticiones lentas',
    why: 'Mantiene la articulación de la mandíbula moviéndose con suavidad y entrena los músculos que abren la boca, que casi nadie usa. Es trabajo de movilidad, no de fuerza: el objetivo es una articulación que se mueva limpia, no un músculo masticador más grande.',
    how: [
      'Apoya el puño suavemente bajo la barbilla.',
      'Abre la boca despacio contra una resistencia muy ligera, en unos 3 segundos.',
      'Cierra igual de despacio. Esto tiene que resultar fácil: no es una prueba de fuerza.',
      'Mantén la apertura recta. Si la mandíbula se te va a un lado, reduce el recorrido.'
    ],
    care: 'Si la articulación chasquea o se engancha al hacerlo, deja de hacerlo y coméntaselo a un dentista.' },
  { n: 'Postura de lengua y boca', freq: 'Hábito de todo el día', dose: 'Solo un hábito, sin series',
    why: 'Descansar con la lengua en el paladar, los labios juntos y respirando por la nariz es una buena costumbre en general: favorece la respiración nasal y una posición neutra de la cabeza. Ten claro que la idea popular de que esto remodela los huesos de la cara en un adulto ("mewing") no está respaldada por buena evidencia. Tómatelo como un hábito postural gratis, no como una técnica para cambiarte la cara.',
    how: [
      'Labios juntos, dientes ligeramente separados, respira por la nariz.',
      'Deja toda la lengua apoyada en el paladar, no solo la punta.',
      'No aprietes los dientes. Apretar es como se consigue dolor de mandíbula y desgaste del esmalte.'
    ],
    care: 'Si no puedes respirar cómodamente por la nariz, que te lo miren: eso importa muchísimo más para tu sueño y tu entrenamiento que para tu mandíbula.' }
],

JAW_TRUTH: [
  ['Grasa corporal', 'De lejos el factor más importante. Una mandíbula se revela, no se construye. A tu peso y tu edad esto se resuelve prácticamente solo según vas llenando tu estructura, que es otra razón para no hacer un volumen agresivo.'],
  ['Estructura ósea', 'La genética decide la forma. Ningún ejercicio cambia el hueso. Quien te diga lo contrario te está vendiendo algo.'],
  ['Edad', 'Tienes 16. La estructura facial masculina sigue madurando hasta los veintipocos, y la mandíbula es de lo último en llenarse. Buena parte de esto va a pasar solo.'],
  ['Postura', 'Entrenable, y funciona rápido. Retracciones de barbilla más los remos que ya tienes en el programa.'],
  ['Tamaño del cuello', 'Entrenable, y ayuda de verdad a enmarcarla.'],
  ['Masetero', 'Técnicamente entrenable con resistencia al masticar, pero deliberadamente fuera de esta rutina: el beneficio es pequeño y el riesgo de problemas en la articulación es real. No compensa.'],
  ['Sueño, sal y agua', 'Dormir mal y un día muy salado hinchan la cara y difuminan la mandíbula. El arreglo más barato de la lista.']
],

/* ---------------- la guía completa ---------------- */
GUIDE: [
  { t: 'RIR — repeticiones en reserva',
    body: '<p>El RIR es cuántas repeticiones te sobraban al terminar una serie. Es tu velocímetro: te dice cuánto estás pisando el acelerador.</p>' +
      '<ul><li><b>RIR 3</b> — podrías haber hecho 3 más. La barra sube rápida y fácil. Tu zona en las semanas 1–4.</li>' +
      '<li><b>RIR 2</b> — te sobraban 2. La última repetición se nota claramente más lenta. Tu zona principal a partir de la semana 5.</li>' +
      '<li><b>RIR 1</b> — te sobraba 1. La última cuesta de verdad. Solo en la última serie de los aislamientos, y solo desde la semana 9.</li>' +
      '<li><b>RIR 0</b> — fallo muscular, no puedes hacer ni una más. Prácticamente nunca lo necesitas.</li></ul>' +
      '<p><b>Nunca cerca del fallo:</b> peso muerto rumano, sentadilla búlgara y press de banca sin nadie que te asegure. Son ejercicios donde fallar significa lesionarte, no crecer más rápido.</p>' +
      '<p>A los 16 y con pocas semanas entrenando, trabajar a RIR 2–3 te da casi exactamente el mismo crecimiento que ir al fallo, con mucha menos fatiga y mucho menos riesgo.</p>' },
  { t: 'Cómo elegir tu peso de inicio',
    body: '<p>Regla simple: si el objetivo es 3 × 8–12, coge un peso con el que podrías hacer unas 13–15 repeticiones si te obligaran, y haz 8–10. Eso te deja en RIR 3.</p>' +
      '<ul><li><b>Demasiado ligero:</b> te pasas del tope del rango sin despeinarte y la última serie se siente como la primera. → Sube.</li>' +
      '<li><b>Correcto:</b> las primeras repeticiones salen suaves, las últimas 2–3 se ralentizan pero tu técnica no cambia. → Quédate ahí.</li>' +
      '<li><b>Demasiado pesado:</b> te cambia la técnica (balanceo, arqueo, recorrido más corto), la barra se para, o no llegas al mínimo del rango. → Baja.</li></ul>' +
      '<p>No tiene absolutamente nada de malo empezar con la barra vacía o con mancuernas de 6 kg. Dentro de seis meses nadie se va a acordar de con cuánto empezaste; la técnica que aprendiste se seguirá notando.</p>' },
  { t: 'Progresión — doble progresión',
    body: '<p>Es el único sistema que necesitas ahora mismo. Así funciona, con 3 × 8–12 de ejemplo:</p>' +
      '<ul><li>Hoy haces 10, 10, 9 con 30 kg → la próxima vez mantienes 30 kg e intentas sumar repeticiones.</li>' +
      '<li>Semanas después llegas a 12, 12, 12 con buena técnica y a RIR 1–2 → ahora sí, subes el peso.</li>' +
      '<li>Al subir el peso las repeticiones bajan (por ejemplo a 9, 8, 8). Eso es normal y correcto. Y vuelves a escalar.</li></ul>' +
      '<p><b>Cuánto subir cada vez:</b></p>' +
      '<ul><li>Compuestos de tren superior (banca, jalón, remo, press de hombro): <b>+2,5 kg</b>.</li>' +
      '<li>Compuestos de tren inferior (prensa, hack squat): <b>+5 kg</b> (o un disco).</li>' +
      '<li>Mancuernas: <b>+1 a +2 kg por mano</b> (normalmente saltas al par siguiente).</li>' +
      '<li>Aislamientos (elevaciones laterales, curls): <b>+1 kg</b> o un disco pequeño.</li></ul>' +
      '<p>Orden de prioridad, siempre: <b>Técnica → Repeticiones → Peso</b>. Nunca al revés.</p>' },
  { t: 'Descanso entre series',
    body: '<p>El descanso no es tiempo perdido: es lo que te permite hacer la siguiente serie con calidad.</p>' +
      '<ul><li><b>Compuestos pesados</b> (banca, prensa, peso muerto rumano, press inclinado con barra): 2–3 min.</li>' +
      '<li><b>Compuestos moderados</b> (jalón, remo, press de hombro, búlgara): 90–120 s.</li>' +
      '<li><b>Aislamientos</b> (laterales, curls, tríceps, femoral, extensiones, gemelos): 60–90 s.</li>' +
      '<li><b>Core</b>: 45–90 s.</li></ul>' +
      '<p><b>¿Por qué no descansar menos?</b> Si descansas 30 s en press de banca, tu segunda serie baja de 10 repeticiones a 6 — y no porque el músculo haya recibido más estímulo, sino porque estás sin aire. Menos repeticiones totales significa menos estímulo.</p>' +
      '<p><b>¿Y por qué no 5 minutos en un curl?</b> Porque un bíceps se recupera en 60–90 s, y estirar la sesión a 2 horas solo hace que entrenes cansado y tengas menos ganas de volver. La app te cronometra cada descanso automáticamente.</p>' },
  { t: 'Sueño y recuperación',
    body: '<p>Tienes 16 años: <b>8–10 horas por noche</b>, y no es negociable si quieres resultados.</p>' +
      '<p>Durante el sueño profundo tu cuerpo libera la mayor parte de la hormona del crecimiento del día. Dormir es además cuando:</p>' +
      '<ul><li>Las fibras musculares que rompiste entrenando se reparan y se reconstruyen.</li>' +
      '<li>Se consolida el aprendizaje motor: literalmente mejoras tu técnica mientras duermes.</li>' +
      '<li>Se recupera tu sistema nervioso, que es lo que te permite levantar más en la siguiente sesión.</li></ul>' +
      '<p>Dormir 5–6 horas de forma habitual reduce la ganancia muscular y aumenta el riesgo de lesión por muy bien que entrenes. Es la palanca más barata y de mayor retorno que tienes.</p>' +
      '<p><b>Días de descanso:</b> camina, monta en bici suave, juega a algo, estira 10 min. No añadas "un poco de gimnasio extra". El músculo crece los días que descansas, no los que entrenas.</p>' },
  { t: 'Alimentación',
    body: '<p>Nada de dietas extremas. Todavía estás creciendo: tu objetivo es <b>comer suficiente para crecer y recuperarte</b>.</p>' +
      '<ul><li><b>Calorías:</b> come lo suficiente para ganar peso despacio y de forma sostenida. Para un principiante delgado, un ritmo sensato es <b>+0,2 a +0,4 kg por semana</b>. Si tu peso no se mueve en 3 semanas, añade una comida o una merienda.</li>' +
      '<li><b>Proteína:</b> repártela en todas las comidas — una fuente de proteína en cada plato. Fuentes reales: huevos, pollo, ternera, pescado (atún, salmón), leche, yogur griego, queso, lentejas, garbanzos, alubias.</li>' +
      '<li><b>Carbohidratos:</b> son tu combustible para entrenar. Arroz, pasta, patata, avena, pan, fruta. No les tengas miedo: a tu edad y tu peso los necesitas.</li>' +
      '<li><b>Grasas saludables:</b> aceite de oliva, aguacate, frutos secos, huevo entero, pescado azul.</li>' +
      '<li><b>Fruta y verdura:</b> en casi todas las comidas. Micronutrientes, fibra, digestión.</li>' +
      '<li><b>Calcio y hierro:</b> importantes a los 16, mientras tus huesos siguen ganando densidad. Lácteos, verduras de hoja verde, carne roja, legumbres.</li>' +
      '<li><b>Agua:</b> 2–3 litros al día, más los días de entrenamiento.</li></ul>' +
      '<p><b>Lo que NO deberías hacer ahora mismo:</b> déficits agresivos, ayunos largos, quitar carbohidratos, saltarte comidas para "marcar abdominales". A los 16 eso frena tu crecimiento y tu rendimiento. La definición llega después, cuando haya músculo que enseñar.</p>' +
      '<p>Cualquier cambio importante en cómo comes merece hablarlo con tus padres y, si puede ser, con un profesional sanitario.</p>' },
  { t: 'Suplementos — la verdad corta',
    body: '<p>No necesitas ninguno. A los 16 y con pocas semanas entrenando, el 100% de tus resultados va a venir de entrenar bien, comer suficiente y dormir.</p>' +
      '<ul><li><b>Proteína en polvo:</b> no es necesaria. Es comida en polvo, cómoda si te cuesta llegar a tu proteína con comida real. Un vaso de leche o un yogur griego hacen lo mismo.</li>' +
      '<li><b>Creatina:</b> el único suplemento junto a la proteína con evidencia sólida, pero la investigación en menores es limitada. No la tomes sin hablarlo antes con tus padres y un médico. No la necesitas para progresar este año.</li>' +
      '<li><b>Pre-entreno:</b> innecesario y poco recomendable a tu edad — dosis altas de cafeína que te van a destrozar el sueño, que es lo que está haciendo la mayor parte del trabajo.</li>' +
      '<li><b>BCAA:</b> innecesarios. Si comes suficiente proteína, ya los estás tomando.</li>' +
      '<li><b>Vitaminas:</b> solo si un médico encuentra una carencia real (vitamina D o hierro, por ejemplo). No a ciegas.</li>' +
      '<li><b>Quemagrasas:</b> no. Ni ahora ni después. No funcionan y algunos son peligrosos.</li></ul>' +
      '<p><b>Regla general:</b> si un suplemento promete resultados rápidos, te está vendiendo humo.</p>' },
  { t: 'Cardio',
    body: '<p>Sí, haz algo — pero poco, y de forma que no interfiera.</p>' +
      '<p><b>Recomendado:</b> 20–30 min de caminar rápido, bici suave o un deporte, <b>2–3 veces por semana</b>, preferiblemente en días de descanso o después de entrenar (nunca antes de pierna pesada). Un deporte que ya practiques (fútbol, baloncesto, natación) cuenta perfectamente y es bueno para tu coordinación.</p>' +
      '<p><b>Evita:</b> carreras largas o HIIT duro el día antes o el mismo día de pierna. Se te come la recuperación.</p>' +
      '<p>Ese cardio suave mejora tu recuperación entre series, tu salud cardiovascular y tu capacidad de trabajo. No te va a "quemar" el músculo: eso pasa con volúmenes de cardio muy altos y sin comer suficiente, no con un paseo de 25 minutos.</p>' },
  { t: 'Descarga — ¿cuándo la necesitas de verdad?',
    body: '<p>Una descarga es una semana fácil: mismos ejercicios, alrededor del 60% de tus pesos habituales y una serie menos por ejercicio. Sirve para que tu cuerpo y tus articulaciones se pongan al día.</p>' +
      '<p><b>No la hagas automáticamente.</b> Con pocas semanas de experiencia tu fatiga acumulada todavía es baja. Descarga solo si aparecen <b>2 o más</b> de estas señales durante más de una semana:</p>' +
      '<ul><li>El rendimiento cae varias sesiones seguidas (los mismos pesos se sienten mucho más pesados).</li>' +
      '<li>Cansancio general que no se va con un día de descanso.</li>' +
      '<li>Molestias musculares o articulares que no terminan de irse.</li>' +
      '<li>Falta de ganas persistente de ir al gimnasio.</li>' +
      '<li>Sueño alterado, te cuesta dormirte, o te despiertas cansado.</li>' +
      '<li>Irritabilidad, pérdida de apetito.</li></ul>' +
      '<p>La pestaña PROGRESO te avisa si tu volumen semanal cae dos semanas seguidas: suele ser la primera pista objetiva.</p>' },
  { t: 'Expectativas realistas',
    body: '<p>Sin falsas promesas. Esto es lo que puedes esperar razonablemente entrenando con constancia, durmiendo y comiendo bien:</p>' +
      '<ul><li><b>1 mes:</b> mejor técnica, más coordinación, los pesos suben rápido. Casi todo es adaptación del sistema nervioso, no músculo nuevo. Te vas a sentir más fuerte antes de verte distinto.</li>' +
      '<li><b>3 meses:</b> primeros cambios visibles — hombros y espalda se ven más llenos, mejor postura. La ropa empieza a quedarte distinta. Fuerza claramente arriba.</li>' +
      '<li><b>6 meses:</b> cambio evidente para la gente que no te ve a menudo. La V empieza a notarse.</li>' +
      '<li><b>9 meses:</b> claramente un físico entrenado incluso con camiseta. Los ejercicios te salen automáticos.</li>' +
      '<li><b>12 meses:</b> una transformación real respecto a hoy. Es cuando la mayoría deja de decir "estoy empezando".</li>' +
      '<li><b>18 meses:</b> un físico atlético asentado, con proporciones definidas.</li>' +
      '<li><b>2 años:</b> el aspecto que buscas es totalmente alcanzable en esa ventana, de forma natural.</li></ul>' +
      '<p><b>Sobre los números:</b> un principiante puede ganar aproximadamente 0,5–1 kg de músculo al mes el primer año, y menos después. Genética, sueño, comida, constancia y edad influyen todas — y la constancia influye más que todas las demás juntas. Quien entrena 3 días a la semana durante 2 años gana muchísimo más que quien entrena 6 días durante 2 meses.</p>' },
  { t: 'El aspecto que quieres — cómo se construye la V',
    body: '<p>La forma de V es una <b>ilusión de contraste</b>: ancho arriba, estrecho en la cintura. Se trabajan los dos extremos.</p>' +
      '<ul><li><b>Deltoides laterales</b> (elevaciones laterales) — lo que más determina lo ancho que te ves de frente. Es un músculo pequeño: crece con repeticiones altas, técnica limpia y frecuencia, no con peso bruto.</li>' +
      '<li><b>Dorsales</b> (jalones, dominadas, remos) — anchura de frente y de espaldas, y la mitad inferior de la V.</li>' +
      '<li><b>Espalda alta y trapecio medio</b> (remos) — grosor y una postura erguida. La postura sola ya te cambia el aspecto.</li>' +
      '<li><b>Pecho alto</b> (press inclinado) — llena la parte de arriba del torso, justo debajo de las clavículas.</li>' +
      '<li><b>Brazos</b> (curls, martillo, tríceps) — el tríceps es dos tercios del tamaño del brazo. Si quieres brazos grandes, entrena tríceps, no solo bíceps.</li>' +
      '<li><b>Cintura</b> — no la hagas más grande: nada de oblicuos con mucho peso ni giros cargados. Con core anti-movimiento (plancha, dead bug) sobra. Tu cintura se ve estrecha porque tus hombros son anchos, no porque el abdomen encoja.</li>' +
      '<li><b>Piernas</b> — entrénalas siempre. Un torso grande sobre piernas de palillo no se lee como atlético, se lee como raro. La prensa y el peso muerto rumano además tiran de tu progreso general.</li></ul>' +
      '<p>La pestaña SIMETRÍA mide exactamente esto: tu proporción hombro-cintura a partir de tus propias fotos, sesión tras sesión.</p>' },
  { t: 'Errores de principiante que te costarán meses',
    body: '<ul><li><b>Cambiar de programa constantemente.</b> No puedes progresar en un ejercicio que haces una vez. Quédate con estos al menos 12 semanas. → Arreglo: sigue el plan de la app y déjalo en paz.</li>' +
      '<li><b>Levantar demasiado peso.</b> El error número uno y la causa número uno de lesión. → Arreglo: RIR 2–3 y técnica primero.</li>' +
      '<li><b>Cambiar técnica por repeticiones.</b> Una repetición con balanceo no cuenta. → Arreglo: si la forma cambia, la serie se acabó.</li>' +
      '<li><b>No descansar entre series.</b> → Arreglo: usa el cronómetro que la app te pone sola.</li>' +
      '<li><b>Ir al fallo en todas las series.</b> Más fatiga, mismo resultado, más riesgo. → Arreglo: RIR 2.</li>' +
      '<li><b>Copiar a culturistas avanzados de Instagram.</b> Llevan 10 años y a veces no son naturales. → Arreglo: tu programa está hecho para un principiante. Es el correcto para ti hoy.</li>' +
      '<li><b>Hacer demasiados ejercicios.</b> 7 bien hechos valen más que 15 a medias. → Arreglo: no añadas ejercicios "extra" por tu cuenta.</li>' +
      '<li><b>Saltarte la pierna.</b> Si el día de pierna solo llega una vez por semana, un salto significa dos semanas entre sesiones de pierna. → Arreglo: trata tu día de pierna como el menos saltable de la semana.</li>' +
      '<li><b>Demasiado cardio.</b> → Arreglo: 2–3 sesiones cortas y suaves por semana, como máximo.</li>' +
      '<li><b>Comer poco.</b> La razón número uno por la que alguien joven no crece a pesar de entrenar bien. → Arreglo: pésate una vez por semana; si no ganas, come más.</li>' +
      '<li><b>No dormir suficiente.</b> → Arreglo: 8–10 h. El móvil fuera de la cama.</li>' +
      '<li><b>Compararte con otros.</b> Cada uno tiene una genética, una edad de entrenamiento y un punto de partida distintos. → Arreglo: compara tus fotos y tus números con LOS TUYOS de hace tres meses. Para eso está esta app.</li>' +
      '<li><b>Esperar resultados en 3 semanas.</b> → Arreglo: lee la sección de expectativas realistas y vuelve dentro de 6 meses.</li></ul>' },
  { t: 'Mandíbula — qué funciona de verdad',
    body: '<p>Primero la respuesta directa, porque este tema está lleno de tonterías por internet: <b>una mandíbula se revela, no se construye.</b> El orden de lo que realmente decide cómo de marcada se ve la tuya:</p>' +
      '<ul><li><b>Porcentaje de grasa corporal</b> — de lejos el factor más importante. Por eso la misma persona se ve completamente distinta al 12% y al 20%.</li>' +
      '<li><b>Estructura ósea</b> — genética. Ningún ejercicio cambia el hueso. Quien diga lo contrario está vendiendo algo.</li>' +
      '<li><b>Edad</b> — tienes 16. La estructura facial masculina sigue madurando hasta los veintipocos y la mandíbula se llena tarde. Una parte importante de esto va a pasar sola.</li>' +
      '<li><b>Postura de la cabeza</b> — entrenable y funciona rápido. La cabeza adelantada borra visualmente la mandíbula.</li>' +
      '<li><b>Desarrollo del cuello</b> — entrenable, y enmarca la mandíbula.</li>' +
      '<li><b>Masetero</b> (músculo masticador) — entrenable hasta cierto punto, pero no compensa el riesgo. Mira abajo.</li>' +
      '<li><b>Sueño, sal y agua</b> — dormir mal y un día muy salado hinchan la cara y lo difuminan todo.</li></ul>' +
      '<p><b>Sobre el "mewing":</b> descansar la lengua en el paladar con los labios cerrados y respirando por la nariz es una costumbre perfectamente buena. Pero la afirmación popular de que remodela los huesos faciales de un adulto <b>no está respaldada por buena evidencia</b>. Hazlo como práctica postural gratuita, no como técnica para cambiarte la cara, y no dejes que nadie te convenza de que sustituye a bajar grasa.</p>' +
      '<p><b>Sobre los aparatos de masticar y el chicle duro tipo mastic — por qué no están en esta rutina:</b> masticar contra resistencia sí hace crecer un poco el masetero, pero estos aparatos son mucho más duros de lo que parecen y pasarse causa problemas reales: chasquidos, bloqueos, dolor delante de la oreja, dolores de cabeza en las sienes, desgaste dental. Eso es <b>disfunción de la articulación temporomandibular</b>, es común en quien va demasiado fuerte demasiado pronto, y puede tardar meses en calmarse. El beneficio visual es pequeño y lo que te juegas es una articulación que usas cada vez que comes y hablas. Mal trato: por eso la rutina lo deja fuera del todo.</p>' +
      '<p>Si aun así algún día decides probarlo, hazlo bien al menos: chicle normal sin azúcar, unos pocos minutos como mucho, alternando los dos lados por igual, no más de un par de días por semana, y para al primer chasquido o molestia. Si algo persiste, ve al dentista.</p>' +
      '<p>Lo que queda en la pestaña <b>Hoy</b> es la parte con beneficio real y sin riesgo apreciable: postura, cuello y movilidad suave de mandíbula.</p>' },
  { t: 'Seguridad — cuándo parar',
    body: '<p><b>Para la serie inmediatamente si:</b></p>' +
      '<ul><li>Notas un dolor agudo, punzante o eléctrico en una articulación (hombro, rodilla, codo, lumbar). Eso no es esfuerzo, es una señal.</li>' +
      '<li>Se te redondea la lumbar en el peso muerto rumano o en la prensa.</li>' +
      '<li>Se te va la vista, te mareas, o respirar te resulta raro.</li>' +
      '<li>Tienes que cambiar la técnica para terminar la repetición.</li></ul>' +
      '<p>Molestia muscular difusa y ardor = normal. Dolor puntual en una articulación = para, y si persiste, habla con un entrenador de tu gimnasio o con un profesional sanitario.</p>' +
      '<p><b>Siempre:</b> usa los seguros del rack, no hagas banca pesada sin alguien cerca, y no dudes en pedirle a un monitor que te mire una serie. Nadie se va a reír; todo el mundo empezó igual.</p>' +
      '<p>Esta app es una herramienta de organización y seguimiento, no un sustituto de un entrenador presencial ni de consejo médico. Si tienes alguna condición de salud o una lesión, consúltalo antes.</p>' }
]


};
