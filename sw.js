// sw.js — "service worker": guarda os arquivos do app no aparelho para ele abrir sem internet.
//
// IMPORTANTE: sempre que mudar qualquer arquivo do app, aumente a VERSAO abaixo
// (ex.: 'v1' -> 'v2'). É isso que avisa o iPhone que existe uma versão nova.

const VERSAO = 'v1';
const CACHE = `minhas-financas-${VERSAO}`;

const ARQUIVOS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/estilo.css',
  'js/formato.js',
  'js/dados.js',
  'js/ui.js',
  'js/tela-mes.js',
  'js/tela-lancamento.js',
  'js/tela-ajustes.js',
  'js/app.js',
  'icones/icone-180.png',
  'icones/icone-192.png',
  'icones/icone-512.png',
  'icones/icone-maskable-512.png',
];

// Instalação: baixa todos os arquivos (ignorando o cache do navegador) e guarda.
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ARQUIVOS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

// Ativação: apaga as versões antigas guardadas.
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(
        nomes.filter((n) => n.startsWith('minhas-financas-') && n !== CACHE).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// Cada pedido de arquivo: usa a cópia guardada; se não houver, busca na internet.
self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(pedido, { ignoreSearch: true }).then((guardado) => {
      if (guardado) return guardado;
      return fetch(pedido).catch(() => {
        // Sem internet e abrindo uma página: mostra o app mesmo assim.
        if (pedido.mode === 'navigate') return caches.match('./');
        return Response.error();
      });
    })
  );
});
