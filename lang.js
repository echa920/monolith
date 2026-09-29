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
const I18N_TARGETS = { EX: EX, SESSIONS: SESSIONS, WARMUP: WARMUP, START: START };
const EN_SNAP = {};
Object.keys(I18N_TARGETS).forEach(k => { EN_SNAP[k] = JSON.parse(JSON.stringify(I18N_TARGETS[k])); });

/* overwrite only the keys present in src, so a partial translation is fine:
   anything not yet translated simply stays in English. */
function deepApply(dst, src) {
  if (!dst || !src) return;
  Object.keys(src).forEach(k => {
    const v = src[k];
    if (Array.isArray(v)) dst[k] = v.slice();
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
    tab_coach: 'Monolith AI',
    week: 'Week', cycle: 'Cycle'
  },
  es: {
    lang_btn: 'EN', lang_title: 'Switch to English',
    tab_today: 'Hoy', tab_quest: 'Aventura', tab_photos: 'Fotos', tab_symmetry: 'Simetría',
    tab_measure: 'Medidas', tab_progress: 'Progreso', tab_plan: 'Plan', tab_guide: 'Guía',
    tab_coach: 'Monolith AI',
    week: 'Semana', cycle: 'Ciclo'
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
  tripro2:   { w: '15–20 kg', why: 'Igual que la extensión del Superior A.' }
}

};
