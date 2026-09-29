/* MONOLITH — sync between your own devices
   -----------------------------------------------------------------------
   Storage is a SECRET GIST on your own GitHub account. Not a server of mine,
   not a service you sign up to: a file you own and can delete at any moment.

   What travels: the training log, measurements, schedule, session edits, rank,
   XP, adventure progress, the jaw routine, settings — and the photos.

   What never travels, on purpose:
     · your Claude API key      (a credential in a gist is a credential leaked)
     · your GitHub token itself (same reason)

   Merging is deliberate rather than last-write-wins. Two devices that both
   trained since the last sync must both keep their sessions; overwriting one
   with the other would quietly delete a workout.
   ----------------------------------------------------------------------- */

const GH_API = 'https://api.github.com';
const SYNC_MAIN = 'monolith.json';
const SYNC_V = 1;
/* photos go one per file: a gist truncates big files in the API response, and
   a single blob holding everything would cross that line almost immediately */
const PH_PREFIX = 'ph-';
const PH_PER_REQUEST = 3;

function syncState() {
  S.sync = S.sync || {};
  S.sync.token = S.sync.token || '';
  S.sync.gist = S.sync.gist || '';
  S.sync.last = S.sync.last || null;
  S.sync.device = S.sync.device || ('dev-' + Math.random().toString(36).slice(2, 8));
  return S.sync;
}
function syncReady() { return !!syncState().token; }

async function ghApi(path, opts) {
  const st = syncState();
  const res = await fetch(GH_API + path, Object.assign({
    headers: {
      'Authorization': 'Bearer ' + st.token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }, opts || {}));
  if (!res.ok) {
    let msg = 'HTTP ' + res.status;
    try { const j = await res.json(); if (j.message) msg = j.message; } catch (e) {}
    if (res.status === 401) msg += ' — el token no vale o caducó';
    if (res.status === 403) msg += ' — al token le falta el permiso de gists';
    if (res.status === 404 && /gists\//.test(path)) msg += ' — ese gist ya no existe';
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

/* ---------------- what goes in the main file ---------------- */
function syncPayload() {
  const st = syncState();
  const out = {
    v: SYNC_V, at: new Date().toISOString(), device: st.device,
    profile: S.profile, logs: S.logs, measures: S.measures, photos: S.photos,
    jaw: S.jaw, sched: S.sched, plan: S.plan, exPhotos: S.exPhotos || {},
    game: S.game, rpg: S.rpg, splitV: S.splitV,
    prefs: S.prefs
  };
  /* the AI slot travels without its key */
  if (S.ai) out.ai = { engine: S.ai.engine, chat: S.ai.chat, spent: S.ai.spent, ollamaModel: S.ai.ollamaModel };
  return out;
}

/* ---------------- merging ----------------
   The rule throughout: never drop something one side has and the other does
   not. Where both sides changed the same thing, prefer the one with more work
   in it, because a half-logged session is the one that was abandoned. */
function doneSets(lg) {
  return Object.keys((lg && lg.sets) || {}).reduce(
    (a, k) => a + (lg.sets[k] || []).filter(s => s.done).length, 0);
}
function syncMerge(remote) {
  if (!remote || remote.v !== SYNC_V) return { logs: 0, photos: 0 };
  let newLogs = 0, newPhotos = 0;

  /* logs: union by date; on a clash keep the fuller one */
  Object.keys(remote.logs || {}).forEach(k => {
    const mine = S.logs[k], theirs = remote.logs[k];
    if (!mine) { S.logs[k] = theirs; newLogs++; return; }
    if (doneSets(theirs) > doneSets(mine) || (theirs.done && !mine.done)) S.logs[k] = theirs;
  });

  /* measurements and photos: union by their natural key */
  const haveM = {};
  S.measures.forEach(m => haveM[m.date] = 1);
  (remote.measures || []).forEach(m => { if (!haveM[m.date]) S.measures.push(m); });
  S.measures.sort((a, b) => a.date < b.date ? -1 : 1);

  const haveP = {};
  S.photos.forEach(p => haveP[p.id] = 1);
  (remote.photos || []).forEach(p => {
    if (!haveP[p.id]) { S.photos.push(p); newPhotos++; }
    else {
      /* keep whichever copy has been analysed */
      const mine = S.photos.filter(x => x.id === p.id)[0];
      if (p.marks && !mine.marks) mine.marks = p.marks;
    }
  });
  S.photos.sort((a, b) => a.id - b.id);

  /* the jaw routine is a set of ticked days: union them */
  S.jaw = S.jaw || {};
  Object.keys(remote.jaw || {}).forEach(k => {
    S.jaw[k] = Object.assign({}, remote.jaw[k], S.jaw[k]);
  });

  /* exercise photo index: union */
  S.exPhotos = S.exPhotos || {};
  Object.keys(remote.exPhotos || {}).forEach(id => {
    S.exPhotos[id] = Object.assign({}, remote.exPhotos[id], S.exPhotos[id]);
  });

  /* adventure progress: keep the further-along side */
  if (remote.rpg && (!S.rpg || (remote.rpg.spent || 0) > (S.rpg.spent || 0))) S.rpg = remote.rpg;
  if (remote.game && remote.game.seen) {
    S.game = S.game || { seen: [] };
    remote.game.seen.forEach(x => { if (S.game.seen.indexOf(x) < 0) S.game.seen.push(x); });
  }

  /* single-value settings: the remote wins only if it was written later */
  const older = !S.sync.last || new Date(remote.at) > new Date(S.sync.last);
  if (older) {
    if (remote.sched) S.sched = remote.sched;
    if (remote.plan) S.plan = remote.plan;
    if (remote.profile) S.profile = Object.assign({}, S.profile, remote.profile);
    if (remote.prefs) S.prefs = Object.assign({}, S.prefs, remote.prefs);
    if (remote.ai) { S.ai = S.ai || {}; Object.keys(remote.ai).forEach(k => { S.ai[k] = remote.ai[k]; }); }
  }
  if (remote.splitV) S.splitV = Math.max(S.splitV || 0, remote.splitV);
  return { logs: newLogs, photos: newPhotos };
}

/* ---------------- the photos ---------------- */
function allPhotoIds() {
  const ids = S.photos.map(p => String(p.id));
  Object.keys(S.exPhotos || {}).forEach(ex => {
    Object.keys(S.exPhotos[ex]).forEach(slot => ids.push(exPhId(ex, slot)));
  });
  return ids;
}
/* a gist file over ~1 MB comes back flagged truncated with its real body at
   raw_url, so always follow that when it is set */
async function gistFileBody(f) {
  if (!f.truncated) return f.content;
  const r = await fetch(f.raw_url);
  if (!r.ok) throw new Error('no se pudo leer ' + f.filename);
  return r.text();
}

/* ---------------- the sync itself ---------------- */
async function syncNow(onStep) {
  const st = syncState();
  const step = onStep || (() => {});
  if (!st.token) throw new Error('falta el token');

  /* 1. find or create the gist */
  step('Buscando tu copia…');
  let gist = null;
  if (st.gist) {
    try { gist = await ghApi('/gists/' + st.gist); }
    catch (e) { if (!/ya no existe/.test(e.message)) throw e; st.gist = ''; }
  }
  if (!gist) {
    step('Creando la copia privada…');
    const files = {}; files[SYNC_MAIN] = { content: JSON.stringify(syncPayload()) };
    gist = await ghApi('/gists', {
      method: 'POST',
      body: JSON.stringify({ description: 'MONOLITH — copia privada de entrenamiento', public: false, files: files })
    });
    st.gist = gist.id;
  }

  /* 2. pull and merge */
  step('Bajando y combinando…');
  let merged = { logs: 0, photos: 0 };
  const main = gist.files && gist.files[SYNC_MAIN];
  if (main) {
    try { merged = syncMerge(JSON.parse(await gistFileBody(main))); }
    catch (e) { console.warn('la copia remota no se pudo leer:', e.message); }
  }

  /* 3. bring down photos this device is missing */
  const remoteFiles = Object.keys(gist.files || {});
  const wanted = allPhotoIds();
  let pulled = 0;
  for (const id of wanted) {
    const fname = PH_PREFIX + id + '.txt';
    if (remoteFiles.indexOf(fname) < 0) continue;
    let have = false;
    try { have = !!(await phGet(id)); } catch (e) { have = false; }
    if (have) continue;
    step('Bajando fotos… ' + (pulled + 1));
    try { await phPut(id, (await gistFileBody(gist.files[fname])).trim()); pulled++; }
    catch (e) { console.warn('no se pudo bajar ' + id + ':', e.message); }
  }

  /* 4. push the merged state back, plus any photo the copy does not have */
  step('Subiendo…');
  await ghApi('/gists/' + st.gist, {
    method: 'PATCH',
    body: JSON.stringify({ files: { [SYNC_MAIN]: { content: JSON.stringify(syncPayload()) } } })
  });

  const missing = [];
  for (const id of allPhotoIds()) {
    if (remoteFiles.indexOf(PH_PREFIX + id + '.txt') < 0) missing.push(id);
  }
  let pushed = 0;
  for (let i = 0; i < missing.length; i += PH_PER_REQUEST) {
    const batch = missing.slice(i, i + PH_PER_REQUEST);
    const files = {};
    for (const id of batch) {
      try {
        const d = await phGet(id);
        if (d) files[PH_PREFIX + id + '.txt'] = { content: String(d) };
      } catch (e) { /* a photo that is gone locally is simply not uploaded */ }
    }
    if (!Object.keys(files).length) continue;
    step('Subiendo fotos… ' + (pushed + Object.keys(files).length) + '/' + missing.length);
    await ghApi('/gists/' + st.gist, { method: 'PATCH', body: JSON.stringify({ files: files }) });
    pushed += Object.keys(files).length;
  }

  st.last = new Date().toISOString();
  save();
  return { pulledLogs: merged.logs, pulledPhotos: pulled, pushedPhotos: pushed, gist: st.gist };
}
