// app.js — ponto de partida: carrega os dados, liga os botões e ativa o modo offline.

const APP_VERSAO = '1.0.0';

(function iniciarApp() {
  Dados.carregar();
  TelaMes.iniciar();

  document.getElementById('btn-adicionar').addEventListener('click', () => TelaLancamento.abrir());
  document.getElementById('btn-ajustes').addEventListener('click', () => TelaAjustes.abrir());

  // Ao voltar para o app (ex.: no dia seguinte), atualiza "atrasado" e afins.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') TelaMes.render();
  });

  // Pede ao navegador para não apagar os dados quando faltar espaço.
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }

  // Service worker = o que faz o app abrir sem internet.
  // Só funciona em https (site publicado) ou em localhost (teste no computador).
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    const jaTinhaVersao = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch((erro) => console.warn('Service worker:', erro));

    // Quando uma versão nova do app é instalada, recarrega uma vez para usá-la.
    let recarregou = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!jaTinhaVersao || recarregou) return;
      recarregou = true;
      location.reload();
    });
  }
})();
