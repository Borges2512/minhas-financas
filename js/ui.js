// ui.js — peças de interface reutilizáveis: painéis que sobem de baixo ("folhas"),
// perguntas com botões, pedido de texto e avisos rápidos.

const UI = (() => {
  const camadas = () => document.getElementById('camadas');

  // Evita que textos digitados virem código HTML.
  function esc(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // Cria um elemento a partir de um trecho de HTML.
  function criar(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // Abre um painel que sobe da parte de baixo da tela.
  // Devolve { el, corpo, fechar }.
  function abrirFolha({ titulo = '', conteudo = '', alta = false, aoFechar = null } = {}) {
    const camada = criar(`
      <div class="camada">
        <div class="fundo"></div>
        <div class="folha ${alta ? 'alta' : ''}" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
          <div class="folha-cabecalho">
            <h2>${esc(titulo)}</h2>
            <button type="button" class="btn-fechar" aria-label="Fechar">
              <svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div class="folha-corpo"></div>
        </div>
      </div>`);
    const corpo = camada.querySelector('.folha-corpo');
    if (typeof conteudo === 'string') corpo.innerHTML = conteudo;
    else if (conteudo) corpo.appendChild(conteudo);

    let fechada = false;
    function fechar(resultado) {
      if (fechada) return;
      fechada = true;
      camada.classList.remove('aberta');
      setTimeout(() => camada.remove(), 250);
      if (!camadas().querySelector('.camada.aberta')) document.body.classList.remove('travado');
      if (aoFechar) aoFechar(resultado);
    }

    camada.querySelector('.fundo').addEventListener('click', () => fechar(null));
    camada.querySelector('.btn-fechar').addEventListener('click', () => fechar(null));
    camada.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(null); });

    camadas().appendChild(camada);
    document.body.classList.add('travado');
    camada.getBoundingClientRect(); // força o navegador a desenhar antes da animação
    camada.classList.add('aberta');

    return { el: camada, corpo, fechar };
  }

  // Pergunta com botões. opcoes: [{ rotulo, valor, estilo: 'principal' | 'perigo' }]
  // Devolve uma Promise com o "valor" escolhido, ou null se cancelou.
  function perguntar({ titulo, mensagem = '', opcoes }) {
    return new Promise((resolver) => {
      const conteudo = criar(`
        <div class="pergunta">
          ${mensagem ? `<p class="pergunta-msg">${esc(mensagem)}</p>` : ''}
          <div class="pergunta-botoes">
            ${opcoes.map((o, i) => `<button type="button" class="btn ${o.estilo ? 'btn-' + o.estilo : 'btn-neutro'}" data-i="${i}">${esc(o.rotulo)}</button>`).join('')}
            <button type="button" class="btn btn-texto" data-cancelar>Cancelar</button>
          </div>
        </div>`);
      const folha = abrirFolha({ titulo, conteudo, aoFechar: resolver });
      conteudo.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        folha.fechar(b.hasAttribute('data-cancelar') ? null : opcoes[Number(b.dataset.i)].valor);
      });
    });
  }

  // Pede um texto curto (ex.: nome de categoria). Devolve o texto ou null.
  function pedirTexto({ titulo, rotulo, valor = '', botao = 'Salvar' }) {
    return new Promise((resolver) => {
      const form = criar(`
        <form class="pedir-texto">
          <label class="campo">
            <span>${esc(rotulo)}</span>
            <input name="texto" maxlength="40" autocomplete="off" enterkeyhint="done" value="${esc(valor)}">
          </label>
          <button type="submit" class="btn btn-principal">${esc(botao)}</button>
        </form>`);
      const folha = abrirFolha({ titulo, conteudo: form, aoFechar: resolver });
      const input = form.querySelector('input');
      input.focus();
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const texto = input.value.trim();
        if (!texto) { input.focus(); return; }
        folha.fechar(texto);
      });
    });
  }

  // Aviso rápido que some sozinho.
  let temporizador = null;
  function aviso(mensagem, erro = false) {
    let caixa = document.getElementById('aviso');
    if (!caixa) {
      caixa = criar('<div id="aviso" role="status" aria-live="polite"></div>');
      document.body.appendChild(caixa);
    }
    caixa.textContent = mensagem;
    caixa.classList.toggle('erro', erro);
    caixa.classList.add('visivel');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => caixa.classList.remove('visivel'), erro ? 4500 : 2500);
  }

  return { esc, criar, abrirFolha, perguntar, pedirTexto, aviso };
})();
