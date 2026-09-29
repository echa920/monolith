/* MONOLITH — Monolith AI
   -----------------------------------------------------------------------
   A real Claude conversation, from the browser, over raw HTTPS.

   Why raw fetch and not the Anthropic SDK: this app has no build step and no
   node_modules on purpose — it is four script tags served off a local static
   server and it must keep working with no network for everything except this
   one screen. Pulling the SDK in would mean a bundler or a CDN dependency.

   The API key lives in this browser's localStorage and is sent straight to
   api.anthropic.com. That is only acceptable because this app runs on your own
   machine; it is NOT how you would ship a website.
   ----------------------------------------------------------------------- */

const AI_URL = 'https://api.anthropic.com/v1/messages';
const AI_MODEL = 'claude-opus-5';
const AI_VERSION = '2023-06-01';
/* $ per million tokens, for the running cost estimate */
const AI_PRICE = { in: 5, out: 25, cache_read: 0.5 };

/* Three engines, in order of what they cost you:
     free    — planner.js. No account, no internet, no money. Training words only.
     ollama  — a model running on this PC. Free and unlimited, but you install it.
     claude  — the real thing. Understands anything. Costs money per message. */
const AI_ENGINES = ['free', 'ollama', 'claude'];
function aiKey() { return (S.ai && S.ai.key) || ''; }
function aiState() {
  S.ai = S.ai || {};
  if (AI_ENGINES.indexOf(S.ai.engine) < 0) S.ai.engine = 'free';
  S.ai.key = S.ai.key || '';
  S.ai.ollamaModel = S.ai.ollamaModel || '';
  S.ai.chat = S.ai.chat || [];
  S.ai.spent = S.ai.spent || { in: 0, out: 0, cached: 0 };
  return S.ai;
}
function aiEngine() { return aiState().engine; }
function aiCost() {
  const sp = aiState().spent;
  return (sp.in / 1e6) * AI_PRICE.in + (sp.out / 1e6) * AI_PRICE.out + (sp.cached / 1e6) * AI_PRICE.cache_read;
}

/* ---------------- what Claude is told ----------------
   Split in two: a big stable half that is worth caching, and a small volatile
   half with today's numbers. Cache reads are a tenth the price of fresh input,
   and the catalogue is most of the tokens. */
function aiSystemStable() {
  const cat = Object.keys(EX).map(id => {
    const e = EX[id];
    return '- ' + id + ' | ' + e.n + ' | ' + e.g + ' | default ' + e.sets + '×' + e.lo + '-' + e.hi +
      ' | rest ' + e.rest + 's' + (EX_MUS[id] ? ' | trains ' + EX_MUS[id].p.join(',') + (EX_MUS[id].s.length ? ' (assist ' + EX_MUS[id].s.join(',') + ')' : '') : '');
  }).join('\n');

  /* whatever the user has told the app about themselves, and nothing more */
  const p = S.profile || {};
  const who = [p.age ? p.age + ' years old' : null, p.height ? p.height + ' cm' : null]
    .filter(Boolean).join(', ');
  return 'You are Monolith AI, the coach built into a training app, used by one person whose real training log you can see. ' +
    (who ? 'They are ' + who + '. ' : '') +
    'Be direct, concrete and warm. Never pad.\n\n' +
    'HARD RULES\n' +
    '- Assume the user may be a teenager unless they say otherwise. Never suggest steroids, SARMs, prohormones, fat burners, extreme cuts, or training to failure on spinal-loaded lifts. If they ask about any of those, say plainly why not and give them what actually works instead.\n' +
    '- Never invent numbers about his training. If the log does not contain something, say so.\n' +
    '- Weights in kg. Reps as ranges. Always give RIR (reps in reserve), never "go to failure".\n' +
    '- If he asks to look like a specific person, be honest: genetics, height, bone structure and years of training decide a lot, and most physiques he sees online took 5+ years. Then give him the part that IS in his control and a realistic timeline.\n' +
    '- Keep answers short unless he asks for a full plan. No preamble, no "great question".\n' +
    '- Answer in the language he writes in.\n\n' +
    'PROPOSING A SESSION\n' +
    'When he asks for a workout, a session, or a plan for a specific day, end your reply with a fenced block exactly like this:\n' +
    '```monolith-session\n' +
    '{"label":"Glute focus","exercises":[{"id":"legpress","sets":4},{"id":"rdl","sets":3}]}\n' +
    '```\n' +
    'Use ONLY the exercise ids from the catalogue below. 4-8 exercises, 2-5 sets each, heaviest compound first. ' +
    'The app turns that block into a button he can tap to load the session. Put your explanation ABOVE the block. ' +
    'For a long-term plan (months, a year) do NOT emit the block — write the roadmap in prose with phases instead.\n\n' +
    'EXERCISE CATALOGUE (id | name | muscle group | default sets×reps | rest | muscles)\n' + cat;
}
function aiSystemLive() {
  const g = computeGame();
  const r = strengthRank();
  const lifts = r.done.map(l => l.n + ' ' + r1(l.best.w) + 'kg×' + l.best.r + ' (' + tierName(l.tier) + ')').join('; ') || 'nothing logged yet';
  const days = trainingDays().map(n => DAYS[n] + '=' + SESSIONS[S.sched[n]].label).join(', ') || 'no training days set';
  const recent = Object.keys(S.logs).filter(k => S.logs[k].done).sort().slice(-6).map(k => {
    const lg = S.logs[k];
    const n = Object.keys(lg.sets || {}).reduce((a, x) => a + (lg.sets[x] || []).filter(s => s.done).length, 0);
    return k + ' ' + (SESSIONS[lg.s] ? SESSIONS[lg.s].label : lg.s) + ' (' + n + ' sets)';
  }).join('; ') || 'none';
  const m = S.measures.slice().sort((a, b) => a.date < b.date ? 1 : -1)[0];

  return 'HIS CURRENT DATA (today is ' + dk(new Date()) + ')\n' +
    '- Bodyweight: ' + r1(bodyW()) + ' kg' + (bodyWSource() === 'logged' ? ' (weighed)' : ' (estimate — he may not have a scale)') + '\n' +
    '- Programme week ' + weekOf(new Date()) + ', cycle week ' + cycleWeek(weekOf(new Date())) + '/12, target RIR ' + blockOf(weekOf(new Date())).rir + '\n' +
    '- Weekly schedule: ' + days + '\n' +
    '- Sessions closed: ' + g.sessions + ' · current streak ' + g.streak + ' · adherence ' + Math.round(g.adherence) + '%\n' +
    '- Overall strength rank: ' + (r.tier < 0 ? 'unranked' : tierName(r.tier)) + '\n' +
    '- Best lifts: ' + lifts + '\n' +
    '- Last sessions: ' + recent + '\n' +
    (m ? '- Latest measurements: ' + Object.keys(m).filter(k => k !== 'date').map(k => k + ' ' + m[k]).join(', ') + '\n' : '- No measurements logged\n');
}

/* ---------------- dispatcher ----------------
   Every engine takes (text, onDelta) and returns the finished reply, so the
   chat view never needs to know which one is running. */
async function aiSend(text, onDelta) {
  const e = aiEngine();
  if (e === 'claude') return aiSendClaude(text, onDelta);
  if (e === 'ollama') return aiSendOllama(text, onDelta);
  return aiSendFree(text, onDelta);
}

/* --- free: the local planner, instant and offline --- */
async function aiSendFree(text, onDelta) {
  const st = aiState();
  st.chat.push({ role: 'user', content: text });
  const a = plannerAnswer(text);
  const out = a.text + (a.plan
    ? '\n\n```monolith-session\n' + JSON.stringify({ label: a.plan.label, exercises: a.plan.list.map(x => ({ id: x.id, sets: x.sets })) }) + '\n```'
    : '');
  onDelta(out, '');
  st.chat.push({ role: 'assistant', content: out });
  save();
  return out;
}

/* --- ollama: a model on this machine, free and unlimited --- */
async function aiOllamaModels() {
  const r = await fetch('http://127.0.0.1:11434/api/tags');
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  return (j.models || []).map(m => m.name);
}
async function aiSendOllama(text, onDelta) {
  const st = aiState();
  st.chat.push({ role: 'user', content: text });
  let res;
  try {
    res = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: st.ollamaModel || 'llama3.1',
        stream: true,
        messages: [{ role: 'system', content: aiSystemStable() + '\n\n' + aiSystemLive() }]
          .concat(st.chat.map(m => ({ role: m.role, content: m.content })))
      })
    });
  } catch (e) { st.chat.pop(); throw e; }
  if (!res.ok) { st.chat.pop(); throw new Error('Ollama HTTP ' + res.status); }
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = '', out = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        let j; try { j = JSON.parse(line); } catch (x) { continue; }
        if (j.message && j.message.content) { out += j.message.content; onDelta(out, ''); }
      }
    }
  } catch (e) { if (!out) { st.chat.pop(); throw e; } }
  st.chat.push({ role: 'assistant', content: out });
  if (st.chat.length > 24) st.chat = st.chat.slice(-24);
  save();
  return out;
}

/* --- claude: the paid API --- */
async function aiSendClaude(text, onDelta) {
  const st = aiState();
  st.chat.push({ role: 'user', content: text });

  const body = {
    model: AI_MODEL,
    max_tokens: 8000,
    stream: true,
    thinking: { type: 'adaptive', display: 'summarized' },
    system: [
      { type: 'text', text: aiSystemStable(), cache_control: { type: 'ephemeral' } },
      { type: 'text', text: aiSystemLive() }
    ],
    messages: st.chat.map(m => ({ role: m.role, content: m.content }))
  };

  /* any failure from here on must roll the user's message back out of the
     thread, or it sits there unanswered and gets resent on the next turn */
  let res;
  try {
    res = await fetch(AI_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': aiKey(),
      'anthropic-version': AI_VERSION,
      /* the API blocks browser origins unless this opt-in is present */
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(body)
    });
  } catch (e) {
    st.chat.pop();
    throw e;
  }

  if (!res.ok) {
    let msg = 'HTTP ' + res.status;
    try { const e = await res.json(); if (e.error && e.error.message) msg = e.error.message; } catch (x) {}
    st.chat.pop();
    throw new Error(msg + (res.status === 401 ? ' — check your API key' : '') +
                          (res.status === 429 ? ' — rate limited or out of credit' : ''));
  }

  /* read the SSE stream by hand: no SDK, so no .stream() helper */
  let reader;
  try { reader = res.body.getReader(); } catch (e) { st.chat.pop(); throw e; }
  const dec = new TextDecoder();
  let buf = '', out = '', think = '';
  let stopReason = null;

  try {
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      let ev;
      try { ev = JSON.parse(line.slice(5).trim()); } catch (x) { continue; }
      if (ev.type === 'content_block_delta') {
        if (ev.delta.type === 'text_delta') { out += ev.delta.text; onDelta(out, think); }
        else if (ev.delta.type === 'thinking_delta') { think += ev.delta.thinking || ''; onDelta(out, think); }
      } else if (ev.type === 'message_start' && ev.message && ev.message.usage) {
        const u = ev.message.usage;
        st.spent.in += (u.input_tokens || 0);
        st.spent.cached += (u.cache_read_input_tokens || 0);
      } else if (ev.type === 'message_delta') {
        if (ev.usage && ev.usage.output_tokens) st.spent.out += ev.usage.output_tokens;
        if (ev.delta && ev.delta.stop_reason) stopReason = ev.delta.stop_reason;
      }
    }
  }

  } catch (e) {
    /* the connection dropped part-way: keep whatever streamed, drop the turn if nothing did */
    if (!out) { st.chat.pop(); throw e; }
  }

  /* a policy decline comes back as a normal 200 with this stop reason */
  if (stopReason === 'refusal' && !out) out = LANG === 'es'
    ? '(La API rechazó esa petición por política de seguridad. Prueba a preguntarlo de otra forma.)'
    : '(The API declined that request on safety grounds. Try rephrasing it.)';

  st.chat.push({ role: 'assistant', content: out });
  if (st.chat.length > 24) st.chat = st.chat.slice(-24);   /* keep the thread, and the bill, bounded */
  save();
  return out;
}

/* ---------------- the session block Claude can emit ---------------- */
function aiParsePlan(text) {
  const m = text.match(/```monolith-session\s*([\s\S]*?)```/);
  if (!m) return null;
  let o;
  try { o = JSON.parse(m[1].trim()); } catch (e) { return null; }
  if (!o || !Array.isArray(o.exercises)) return null;
  const list = o.exercises
    .filter(x => x && EX[x.id])
    .map(x => ({ id: x.id, sets: clamp(Math.round(+x.sets) || EX[x.id].sets, 1, 6) }));
  if (!list.length) return null;
  return { label: String(o.label || 'Session').slice(0, 40), list: list, raw: m[0] };
}
/* load a proposed session into today, without touching the saved programme */
function aiApplyPlan(plan) {
  const key = dk(viewDate || new Date());
  const sid = sidFor(new Date()) || 'PUSH';
  setSesList(sid, plan.list);
  logFor(key, sid);
  save();
  toast(LANG === 'es' ? 'Sesión cargada en Hoy' : 'Session loaded into Today');
  go('today');
}

/* ---------------- view ---------------- */
function rCoach() {
  const es = LANG === 'es';
  const st = aiState();
  const eng = aiEngine();
  let h = '';

  /* engine picker — always visible, because which one is running changes
     what the answers cost and what they can understand */
  const label = { free: es ? 'Gratis' : 'Free', ollama: 'Ollama', claude: 'Claude' };
  const sub = {
    free:   es ? 'sin cuenta, sin internet, sin coste' : 'no account, no internet, no cost',
    ollama: es ? 'un modelo en este PC · gratis' : 'a model on this PC · free',
    claude: es ? 'entiende cualquier frase · de pago' : 'understands anything · paid'
  };
  h += '<div class="card"><div class="spread" style="margin-bottom:10px">' +
    '<div><div style="font-weight:800;font-size:15px">Monolith AI</div>' +
    '<div class="tiny mono">' + esc(sub[eng]) +
    (eng === 'claude' ? ' · $' + aiCost().toFixed(3) : '') + '</div></div>' +
    '<div class="row" style="gap:6px"><button class="btn sm gh" id="ainew">' + (es ? 'Nuevo' : 'New') + '</button></div></div>' +
    '<div class="engines">' + AI_ENGINES.map(k =>
      '<button data-eng="' + k + '" class="' + (k === eng ? 'on' : '') + '">' + esc(label[k]) + '</button>').join('') + '</div>';

  if (eng === 'free') {
    h += '<div class="tiny" style="margin-top:10px">' + (es
      ? 'Gratis de verdad: no sale de tu ordenador y no cuesta nada. <b>No es un chat</b> — entiende palabras de entrenamiento, no cualquier frase. Lee tu registro real.'
      : 'Genuinely free: nothing leaves your computer and nothing is charged. <b>Not a chatbot</b> — it understands training words, not any sentence. It reads your real log.') + '</div>';
  } else if (eng === 'ollama') {
    h += '<div class="note w" style="margin-top:10px">' + (es
      ? '<b>Gratis e ilimitado, pero hay que instalarlo.</b> Descarga Ollama de ollama.com, y luego en una terminal: <span class="mono">ollama pull llama3.1</span>. Se descarga un modelo de unos 5 GB y corre en tu PC, sin internet y sin cuenta. Entiende frases libres, pero es bastante menos capaz que Claude.'
      : '<b>Free and unlimited, but you have to install it.</b> Get Ollama from ollama.com, then in a terminal: <span class="mono">ollama pull llama3.1</span>. That downloads a ~5 GB model that runs on your PC, with no internet and no account. It understands free-form sentences, but it is clearly less capable than Claude.') + '</div>' +
      '<div class="row" style="gap:8px;margin-top:10px"><input id="olmodel" placeholder="llama3.1" value="' + esc(st.ollamaModel || '') + '" style="flex:1">' +
      '<button class="btn sm" id="olcheck">' + (es ? 'Probar' : 'Test') + '</button></div>' +
      '<div class="tiny" id="olstat" style="margin-top:8px"></div>';
  } else {
    if (!aiKey()) {
      h += '<div class="note b" style="margin-top:10px"><b>' + (es ? 'Esta opción cuesta dinero.' : 'This option costs money.') + '</b><br><br>' +
        (es
          ? '<b>1.</b> Se paga por uso a Anthropic, unos céntimos por mensaje, sin tope automático.<br><br>' +
            '<b>2.</b> La cuenta de API exige 18 años, así que la tiene que crear y pagar un adulto.<br><br>' +
            '<b>3.</b> Necesita internet.<br><br>' +
            '<b>4.</b> La clave se guarda en este navegador y cualquiera que use el PC puede leerla.'
          : '<b>1.</b> You pay Anthropic per use, a few cents a message, with no automatic cap.<br><br>' +
            '<b>2.</b> The API account requires you to be 18, so an adult has to create and pay for it.<br><br>' +
            '<b>3.</b> It needs internet.<br><br>' +
            '<b>4.</b> The key is stored in this browser and anyone using the PC can read it.') + '</div>' +
        '<label class="f" style="margin-top:12px"><span>' + (es ? 'Clave de API' : 'API key') + '</span>' +
        '<input type="password" id="aikey" placeholder="sk-ant-..." autocomplete="off"></label>' +
        '<button class="btn p w" id="aisave" style="margin-top:10px">' + (es ? 'Guardar la clave' : 'Save the key') + '</button>';
    } else {
      h += '<div class="spread" style="margin-top:10px"><span class="tiny">' +
        (es ? 'Clave guardada · Claude Opus 5' : 'Key saved · Claude Opus 5') + '</span>' +
        '<button class="btn sm gh" id="aikeyout">' + (es ? 'Borrar clave' : 'Remove key') + '</button></div>';
    }
  }
  h += '</div>';

  if (!st.chat.length) {
    h += '<div class="card"><div class="sec-t">' + (es ? 'Prueba con' : 'Try') + '</div>' +
      (es
        ? ['Hazme un plan de glúteo para hoy', 'Pecho en 30 minutos', 'Hazme un plan de un año para parecerme a David Laid', 'Estoy estancado en press de banca', '¿Cuánta proteína necesito?', '¿Qué rango tengo?']
        : ['Make me a glute plan for today', 'Chest in 30 minutes', 'Make me a year plan to look like David Laid', 'I am stalled on bench press', 'How much protein do I need?', 'What rank am I?'])
      .map(q => '<div class="chk" data-ask="' + esc(q) + '"><div class="box">&#8250;</div><span>' + esc(q) + '</span></div>').join('') +
      '</div>';
  }

  h += '<div id="aithread">' + st.chat.map((m, i) => aiBubble(m, i)).join('') + '</div>';
  h += '<div class="card no-print"><textarea id="aiin" rows="3" placeholder="' +
    (es ? 'Escribe lo que quieras…' : 'Ask anything…') + '"></textarea>' +
    '<button class="btn p w" id="aigo" style="margin-top:10px">' + (es ? 'Enviar' : 'Send') + '</button></div>';

  $('#v-coach').innerHTML = h;
  wireCoach();
}

function aiBubble(m, i) {
  const mine = m.role === 'user';
  const plan = mine ? null : aiParsePlan(m.content);
  const body = plan ? m.content.replace(plan.raw, '') : m.content;
  return '<div class="msg ' + (mine ? 'me' : 'ai') + '"><div class="mtxt">' + aiFmt(body) + '</div>' +
    (plan ? '<div class="planbox"><div class="spread"><div>' +
      '<div style="font-weight:800;font-size:13.5px">' + esc(plan.label) + '</div>' +
      '<div class="tiny mono">' + plan.list.length + (LANG === 'es' ? ' ejercicios · ' : ' exercises · ') +
      plan.list.reduce((a, x) => a + x.sets, 0) + ' sets</div></div>' +
      '<button class="btn sm p" data-plan="' + i + '">' + (LANG === 'es' ? 'Usar hoy' : 'Use today') + '</button></div>' +
      '<div class="tiny" style="margin-top:8px">' + plan.list.map(x => esc(EX[x.id].n) + ' ' + x.sets + '×').join(' · ') + '</div>' +
      '</div>' : '') + '</div>';
}
/* the model writes markdown; render the little that matters and escape the rest */
function aiFmt(s) {
  return esc(s)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/^### (.+)$/gm, '<div class="sec-t" style="margin:10px 0 4px">$1</div>')
    .replace(/^[-*] (.+)$/gm, '<div class="cue">$1</div>')
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
}
function wireCoach() {
  const es = LANG === 'es';
  const st = aiState();
  $$('[data-ask]').forEach(b => b.onclick = () => { $('#aiin').value = b.dataset.ask; $('#aigo').click(); });
  $$('[data-eng]').forEach(b2 => b2.onclick = () => { aiState().engine = b2.dataset.eng; save(); rCoach(); });
  const om = $('#olmodel');
  if (om) om.onchange = () => { aiState().ollamaModel = om.value.trim(); save(); };
  const oc = $('#olcheck');
  if (oc) oc.onclick = async () => {
    const out = $('#olstat');
    out.textContent = es ? 'buscando…' : 'looking…';
    try {
      const list = await aiOllamaModels();
      out.innerHTML = list.length
        ? '<b style="color:var(--good)">' + (es ? 'Ollama funciona.' : 'Ollama is running.') + '</b> ' + (es ? 'Modelos: ' : 'Models: ') + list.map(esc).join(', ')
        : '<b style="color:var(--warn)">' + (es ? 'Ollama corre pero no tiene ningún modelo. Ejecuta: ollama pull llama3.1' : 'Ollama is running but has no model. Run: ollama pull llama3.1') + '</b>';
      if (list.length && !aiState().ollamaModel) { aiState().ollamaModel = list[0]; om.value = list[0]; save(); }
    } catch (e2) {
      out.innerHTML = '<b style="color:var(--bad)">' + (es ? 'No responde en localhost:11434.' : 'Nothing answering on localhost:11434.') + '</b> ' +
        (es ? 'Instálalo desde ollama.com y déjalo abierto.' : 'Install it from ollama.com and leave it running.');
    }
  };
  $$('[data-plan]').forEach(b => b.onclick = () => {
    const plan = aiParsePlan(st.chat[+b.dataset.plan].content);
    if (plan) aiApplyPlan(plan);
  });
  const nb = $('#ainew'); if (nb) nb.onclick = () => { st.chat = []; save(); rCoach(); };
  const kb = $('#aikeyout'); if (kb) kb.onclick = () => {
    if (!confirm(es ? '¿Borrar la clave de API de este navegador?' : 'Remove the API key from this browser?')) return;
    st.key = ''; save(); rCoach();
  };
  const go2 = $('#aigo');
  if (!go2) return;
  go2.onclick = async () => {
    const inp = $('#aiin');
    const text = (inp.value || '').trim();
    if (!text) return;
    inp.value = '';
    go2.disabled = true;
    go2.textContent = es ? 'Pensando…' : 'Thinking…';
    const thread = $('#aithread');
    thread.innerHTML += aiBubble({ role: 'user', content: text }, st.chat.length) +
      '<div class="msg ai" id="aitmp"><div class="mtxt tiny">' + (es ? 'pensando…' : 'thinking…') + '</div></div>';
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    try {
      await aiSend(text, (out, think) => {
        const t = $('#aitmp');
        if (t) t.querySelector('.mtxt').innerHTML = out ? aiFmt(out)
          : '<span class="tiny">' + (think ? aiFmt(think.slice(-400)) : (es ? 'pensando…' : 'thinking…')) + '</span>';
      });
      rCoach();
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (e) {
      const t = $('#aitmp');
      const cors = /Failed to fetch|NetworkError|load failed/i.test(e.message);
      if (t) t.querySelector('.mtxt').innerHTML = '<b style="color:var(--bad)">' + (es ? 'No se pudo conectar' : 'Could not connect') + '</b><br>' +
        esc(e.message) + (cors ? '<br><br>' + (es
          ? 'Suele ser falta de internet, o que abriste el archivo directamente en vez de usar start.cmd.'
          : 'Usually no internet, or the page was opened straight from disk instead of through start.cmd.') : '');
    }
    go2.disabled = false;
    go2.textContent = es ? 'Enviar' : 'Send';
  };
}
