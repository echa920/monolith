/* MONOLITH — your own photos on each exercise
   -----------------------------------------------------------------------
   The drawn figures are a diagram, and a diagram only takes you so far. This
   lets you pin a REAL photo to each exercise — the machine at your gym, a
   frame from a video, you in the start position — exactly the way the
   Symmetry tab holds your progress photos.

   Same storage as those: IndexedDB when the browser allows it, localStorage
   when it does not. The photo never leaves this computer.
   ----------------------------------------------------------------------- */

function exPhId(id, slot) { return 'ex-' + id + '-' + slot; }
function exPhState() { S.exPhotos = S.exPhotos || {}; return S.exPhotos; }
function exPhHas(id, slot) { const m = exPhState()[id]; return !!(m && m[slot]); }

function exPhSave(id, slot, src) {
  return scaleImage(src, 900, 0.85).then(small => phPut(exPhId(id, slot), small)).then(() => {
    const m = exPhState();
    m[id] = m[id] || {};
    m[id][slot] = 1;
    save();
    toast(LANG === 'es' ? 'Foto guardada' : 'Photo saved');
    rToday();
  }).catch(e => {
    console.error(e);
    toast(LANG === 'es' ? 'No se pudo guardar la foto' : 'Could not save the photo');
  });
}
function exPhDel(id, slot) {
  phDel(exPhId(id, slot)).catch(() => {});
  const m = exPhState();
  if (m[id]) { delete m[id][slot]; if (!Object.keys(m[id]).length) delete m[id]; }
  save();
  rToday();
}
/* read a File or Blob into a data URL, then store it */
function exPhFromBlob(id, slot, blob) {
  const fr = new FileReader();
  fr.onload = () => exPhSave(id, slot, fr.result);
  fr.onerror = () => toast(LANG === 'es' ? 'No se pudo leer el archivo' : 'Could not read the file');
  fr.readAsDataURL(blob);
}

/* ---------------- one frame: your photo if you have one, else the drawing ---------------- */
function exFrame(id, slot) {
  const es = LANG === 'es';
  const sp = EX_POSE[id];
  const i = slot === 'a' ? 0 : 1;
  const cap = sp ? (es ? (slot === 'a' ? sp.ca[1] : sp.cb[1]) : (slot === 'a' ? sp.ca[0] : sp.cb[0])) : '';
  const has = exPhHas(id, slot);
  const num = (es ? (i ? '2 · FINAL' : '1 · INICIO') : (i ? '2 · FINISH' : '1 · START'));

  return '<figure><div class="fr-n">' + num + '</div>' +
    (has
      ? '<div class="exph"><img data-exph="' + id + '|' + slot + '" alt=""><span class="exph-tag">' +
        (es ? 'TU FOTO' : 'YOUR PHOTO') + '</span></div>'
      : (sp ? poseSVG(sp, slot) : '')) +
    '<figcaption>' + esc(cap) + '</figcaption>' +
    '<div class="exph-btns no-print">' +
      '<button class="btn sm" data-exshot="' + id + '|' + slot + '" title="' + (es ? 'Hacer foto' : 'Take a photo') + '">&#128247;</button>' +
      '<button class="btn sm gh" data-exup="' + id + '|' + slot + '" title="' + (es ? 'Subir archivo' : 'Upload a file') + '">&#8593;</button>' +
      (has ? '<button class="btn sm gh danger" data-exdel="' + id + '|' + slot + '" title="' + (es ? 'Borrar' : 'Delete') + '">&#10005;</button>' : '') +
    '</div></figure>';
}

/* fill in the <img> tags once they are in the document */
function hydrateExPhotos() {
  $$('[data-exph]').forEach(el => {
    const [id, slot] = el.dataset.exph.split('|');
    phGet(exPhId(id, slot)).then(d => { if (d) el.src = d; })
      .catch(() => { el.closest('.exph').innerHTML = '<div class="tiny" style="padding:20px;text-align:center">' +
        (LANG === 'es' ? 'La foto se perdió' : 'That photo is gone') + '</div>'; });
  });
}
function wireExPhotos() {
  $$('[data-exshot]').forEach(b => b.onclick = () => {
    const [id, slot] = b.dataset.exshot.split('|');
    openCamera(blob => exPhFromBlob(id, slot, blob));
  });
  $$('[data-exup]').forEach(b => b.onclick = () => {
    const [id, slot] = b.dataset.exup.split('|');
    const f = $('#exfile');
    f.onchange = e => {
      const file = e.target.files[0];
      f.value = '';
      if (file) exPhFromBlob(id, slot, file);
    };
    f.click();
  });
  $$('[data-exdel]').forEach(b => b.onclick = () => {
    const [id, slot] = b.dataset.exdel.split('|');
    if (!confirm(LANG === 'es' ? '¿Borrar esta foto?' : 'Delete this photo?')) return;
    exPhDel(id, slot);
  });
  hydrateExPhotos();
}
