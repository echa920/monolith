/* MONOLITH — servidor local minimo.
   Sirve la app en http://localhost:5173 para que la camara y el
   almacenamiento de fotos funcionen sin restricciones del navegador. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 5173;
const ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

/* every address this machine has on the local network, so the phone can be told
   where to look instead of you hunting for it in Windows settings */
function lanAddresses() {
  const nets = require('os').networkInterfaces();
  const out = [];
  Object.keys(nets).forEach(name => (nets[name] || []).forEach(n => {
    if (n.family === 'IPv4' && !n.internal) out.push(n.address);
  }));
  return out;
}

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const file = path.join(ROOT, path.normalize(rel).replace(/^([/\\])+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('403'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404'); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      /* the service worker keeps its own copy; the browser should not also
         hold a stale one while you are changing the app */
      'Cache-Control': 'no-store'
    });
    res.end(buf);
  });
/* 0.0.0.0, not 127.0.0.1: otherwise only this PC can reach it and the phone
   shortcut has nothing to open. Only devices on your own Wi-Fi can connect. */
}).listen(PORT, '0.0.0.0', () => {
  const url = 'http://localhost:' + PORT;
  const lan = lanAddresses();
  console.log('');
  console.log('  MONOLITH corriendo');
  console.log('');
  console.log('  En este PC:   ' + url);
  if (lan.length) {
    console.log('  En el móvil:  ' + lan.map(a => 'http://' + a + ':' + PORT).join('\n                '));
    console.log('                (el móvil tiene que estar en el mismo WiFi)');
  } else {
    console.log('  Sin red local detectada: el móvil no va a poder conectarse.');
  }
  console.log('');
  console.log('  Dejá esta ventana abierta mientras usás la app.');
  console.log('  Para cerrar: Ctrl+C');
  console.log('');
  exec('start "" "' + url + '"');
});
