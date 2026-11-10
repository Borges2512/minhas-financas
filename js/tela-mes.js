// tela-mes.js — tela principal: mês escolhido, resumo e lista de lançamentos.

const TelaMes = (() => {
  let ano;
  let mes;

  function iniciar() {
    const hoje = Formato.partes(Formato.hoje());
    ano = hoje.ano;
    mes = hoje.mes;

    document.getElementById('btn-mes-anterior').addEventListener('click', () => mudarMes(-1));
    document.getElementById('btn-mes-seguinte').addEventListener('click', () => mudarMes(1));
    document.getElementById('btn-hoje').addEventListener('click', irParaHoje);
    document.getElementById('lista').addEventListener('click', (e) => {
      const item = e.target.closest('[data-id]');
      if (item) abrirAcoes(item.dataset.id);
    });
    render();
  }

  function mudarMes(n) {
    const novo = Formato.somarMeses(ano, mes, n);
    irPara(novo.ano, novo.mes);
  }

  function irParaHoje() {
    const hoje = Formato.partes(Formato.hoje());
    irPara(hoje.ano, hoje.mes);
  }

  function irPara(novoAno, novoMes) {
    ano = novoAno;
    mes = novoMes;
    render();
    window.scrollTo(0, 0);
  }

  function mesAberto() {
    return { ano, mes };
  }

  function render() {
    const hoje = Formato.hoje();
    const p = Formato.partes(hoje);
    const ehMesAtual = p.ano === ano && p.mes === mes;

    document.getElementById('titulo-mes').textContent = Formato.nomeMes(ano, mes);
    document.getElementById('btn-hoje').hidden = ehMesAtual;

    const lista = Dados.lancamentosDoMes(ano, mes);
    renderResumo(Dados.resumo(lista));
    renderLista(lista, hoje);
  }

  function renderResumo(r) {
    const classeSaldo = (v) => (v < 0 ? 'negativo' : 'positivo');
    document.getElementById('resumo').innerHTML = `
      <div class="saldo-principal">
        <span class="rotulo">Saldo do mês (previsto)</span>
        <strong class="${classeSaldo(r.previsto)}">${Formato.dinheiro(r.previsto)}</strong>
        <span class="saldo-realizado">Realizado: <b class="${classeSaldo(r.realizado)}">${Formato.dinheiro(r.realizado)}</b></span>
      </div>
      <div class="totais">
        <div class="total entrada">
          <span class="rotulo">Entradas</span>
          <strong>${Formato.dinheiro(r.entradas)}</strong>
          <small>Recebido ${Formato.dinheiro(r.entradasPagas)}</small>
        </div>
        <div class="total saida">
          <span class="rotulo">Saídas</span>
          <strong>${Formato.dinheiro(r.saidas)}</strong>
          <small>Pago ${Formato.dinheiro(r.saidasPagas)}</small>
        </div>
      </div>`;
  }

  function renderLista(lista, hoje) {
    const el = document.getElementById('lista');
    if (lista.length === 0) {
      el.innerHTML = `
        <div class="vazio">
          <p>Nenhum lançamento em ${Formato.nomeMes(ano, mes).toLowerCase()}.</p>
          <p>Toque no <b>+</b> para adicionar.</p>
        </div>`;
      return;
    }

    let html = '';
    let dataAtual = null;
    for (const l of lista) {
      if (l.data !== dataAtual) {
        if (dataAtual) html += '</ul>';
        dataAtual = l.data;
        html += `<h3 class="dia">${Formato.data(l.data)} <span>${Formato.diaSemana(l.data)}</span></h3><ul class="itens">`;
      }
      html += itemHtml(l, hoje);
    }
    html += '</ul>';
    el.innerHTML = html;
  }

  function itemHtml(l, hoje) {
    const cat = Dados.categoria(l.categoriaId);
    const serie = Dados.rotuloSerie(l);
    const atrasado = !l.pago && l.data < hoje;
    let situacao = '';
    if (!l.pago) {
      situacao = atrasado
        ? '<span class="etiqueta atrasado">Atrasado</span>'
        : '<span class="etiqueta pendente">Pendente</span>';
    }
    const sinal = l.tipo === 'saida' ? '− ' : '+ ';
    return `
      <li>
        <button type="button" class="item ${l.tipo} ${l.pago ? 'pago' : 'nao-pago'}" data-id="${l.id}">
          <span class="marca" style="background:${cat ? cat.cor : '#94a3b8'}"></span>
          <span class="item-texto">
            <span class="item-desc">${UI.esc(l.descricao)}${serie ? ` <span class="serie">${serie}</span>` : ''}</span>
            <span class="item-info">${UI.esc(cat ? cat.nome : 'Sem categoria')} ${situacao}</span>
          </span>
          <span class="item-valor">${sinal}${Formato.dinheiro(l.valor)}</span>
        </button>
      </li>`;
  }

  // Menu ao tocar num lançamento: marcar como pago, editar ou excluir.
  async function abrirAcoes(id) {
    const l = Dados.lancamento(id);
    if (!l) return;
    const cat = Dados.categoria(l.categoriaId);
    const serie = Dados.rotuloSerie(l);
    const palavraPago = l.tipo === 'entrada' ? 'recebido' : 'pago';

    const partes = [Formato.dinheiro(l.valor), Formato.data(l.data)];
    if (cat) partes.push(cat.nome);
    if (serie) partes.push(serie === 'Mensal' ? 'Repete todo mês' : `Parcela ${serie}`);
    partes.push(l.pago ? (l.tipo === 'entrada' ? 'Recebido' : 'Pago') : 'Pendente');

    const escolha = await UI.perguntar({
      titulo: l.descricao,
      mensagem: partes.join(' · '),
      opcoes: [
        { rotulo: l.pago ? 'Marcar como pendente' : `Marcar como ${palavraPago}`, valor: 'pago', estilo: 'principal' },
        { rotulo: 'Editar', valor: 'editar' },
        { rotulo: 'Excluir', valor: 'excluir', estilo: 'perigo' },
      ],
    });

    if (escolha === 'pago') {
      Dados.alternarPago(id);
      render();
      UI.aviso(l.pago ? `Marcado como ${palavraPago}` : 'Marcado como pendente');
    } else if (escolha === 'editar') {
      TelaLancamento.abrir({ id });
    } else if (escolha === 'excluir') {
      excluirComPergunta(id);
    }
  }

  // Pergunta "só este" / "este e os próximos" quando o lançamento se repete.
  // Devolve true se excluiu.
  async function excluirComPergunta(id) {
    const l = Dados.lancamento(id);
    if (!l) return false;
    let escopo;
    if (l.serieId) {
      escopo = await UI.perguntar({
        titulo: 'Excluir lançamento',
        mensagem: 'Este lançamento se repete. O que você quer excluir?',
        opcoes: [
          { rotulo: 'Só este', valor: 'este', estilo: 'perigo' },
          { rotulo: 'Este e os próximos', valor: 'proximos', estilo: 'perigo' },
        ],
      });
    } else {
      escopo = await UI.perguntar({
        titulo: 'Excluir lançamento',
        mensagem: `Excluir "${l.descricao}"? Isso não pode ser desfeito.`,
        opcoes: [{ rotulo: 'Excluir', valor: 'este', estilo: 'perigo' }],
      });
    }
    if (!escopo) return false;
    try {
      Dados.excluir(id, escopo);
      render();
      UI.aviso('Lançamento excluído');
      return true;
    } catch (erro) {
      UI.aviso(erro.message, true);
      return false;
    }
  }

  return { iniciar, render, irPara, mesAberto, excluirComPergunta };
})();
