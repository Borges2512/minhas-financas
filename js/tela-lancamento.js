// tela-lancamento.js — formulário para criar ou editar um lançamento.
// TelaLancamento.abrir()          -> novo lançamento (gasto rápido)
// TelaLancamento.abrir({ id })    -> editar um lançamento existente

const TelaLancamento = (() => {
  function abrir({ id = null } = {}) {
    const existente = id ? Dados.lancamento(id) : null;
    const serie = existente && existente.serieId ? Dados.serie(existente.serieId) : null;

    // Valores iniciais do formulário
    const f = {
      tipo: existente ? existente.tipo : 'saida',
      valor: existente ? existente.valor : 0,
      descricao: existente ? existente.descricao : '',
      categoriaId: existente ? existente.categoriaId : null,
      data: existente ? existente.data : dataPadrao(),
      pago: existente ? existente.pago : null, // null = automático (pela data)
      repeticao: 'nenhuma',
      fimMensal: 'sem',
      dataFim: '',
      parcelas: 2,
    };
    if (f.pago === null) f.pago = f.data <= Formato.hoje();
    let pagoEscolhidoAMao = !!existente;

    const form = UI.criar(`
      <form class="form-lanc" novalidate autocomplete="off">
        <div class="segmentado" data-grupo="tipo">
          <button type="button" data-valor="saida" class="seg-saida">Saída</button>
          <button type="button" data-valor="entrada" class="seg-entrada">Entrada</button>
        </div>

        <label class="campo campo-valor">
          <span id="rotulo-valor">Valor</span>
          <div class="valor-linha">
            <span class="prefixo">R$</span>
            <input name="valor" inputmode="numeric" placeholder="0,00" aria-labelledby="rotulo-valor">
          </div>
        </label>

        <div class="campo">
          <span>Categoria</span>
          <div class="chips" id="chips"></div>
        </div>

        <label class="campo">
          <span>Descrição <small>(opcional)</small></span>
          <input name="descricao" maxlength="80" placeholder="Ex.: Mercado" enterkeyhint="done">
        </label>

        <label class="campo">
          <span>Data</span>
          <input name="data" type="date" required>
        </label>

        <div class="campo">
          <span>Situação</span>
          <div class="segmentado" data-grupo="pago">
            <button type="button" data-valor="sim" id="rotulo-pago">Pago</button>
            <button type="button" data-valor="nao">Pendente</button>
          </div>
        </div>

        ${existente ? infoSerie(existente, serie) : `
        <div class="campo">
          <span>Repetir</span>
          <div class="segmentado" data-grupo="repeticao">
            <button type="button" data-valor="nenhuma">Não repete</button>
            <button type="button" data-valor="mensal">Todo mês</button>
            <button type="button" data-valor="parcelado">Parcelado</button>
          </div>
        </div>

        <div class="campo sub" id="opcoes-mensal" hidden>
          <span>Até quando?</span>
          <div class="segmentado" data-grupo="fimMensal">
            <button type="button" data-valor="sem">Sem fim</button>
            <button type="button" data-valor="data">Até uma data</button>
          </div>
          <input name="dataFim" type="date" hidden aria-label="Data final">
        </div>

        <div class="campo sub" id="opcoes-parcelado" hidden>
          <span>Número de parcelas</span>
          <div class="contador">
            <button type="button" data-passo="-1" aria-label="Menos uma parcela">−</button>
            <input name="parcelas" inputmode="numeric" aria-label="Número de parcelas">
            <button type="button" data-passo="1" aria-label="Mais uma parcela">+</button>
          </div>
          <p class="dica" id="previa-parcelas"></p>
        </div>`}

        <p class="erro-form" id="erro-form" hidden></p>

        <button type="submit" class="btn btn-principal">Salvar</button>
        ${existente ? '<button type="button" class="btn btn-perigo-texto" id="btn-excluir">Excluir lançamento</button>' : ''}
      </form>`);

    const folha = UI.abrirFolha({
      titulo: existente ? 'Editar lançamento' : 'Novo lançamento',
      conteudo: form,
      alta: true,
    });

    const $ = (sel) => form.querySelector(sel);
    const inputValor = $('[name=valor]');
    const inputDesc = $('[name=descricao]');
    const inputData = $('[name=data]');
    const inputDataFim = $('[name=dataFim]');
    const inputParcelas = $('[name=parcelas]');

    // Preenche os campos
    inputValor.value = f.valor ? Formato.numeroValor(f.valor) : '';
    inputDesc.value = f.descricao;
    inputData.value = f.data;
    if (inputParcelas) inputParcelas.value = f.parcelas;

    // ----- Atualiza o que aparece na tela conforme as escolhas -----
    function atualizar() {
      marcarSegmento('tipo', f.tipo);
      marcarSegmento('pago', f.pago ? 'sim' : 'nao');
      $('#rotulo-pago').textContent = f.tipo === 'entrada' ? 'Recebido' : 'Pago';

      if (!existente) {
        marcarSegmento('repeticao', f.repeticao);
        marcarSegmento('fimMensal', f.fimMensal);
        $('#opcoes-mensal').hidden = f.repeticao !== 'mensal';
        $('#opcoes-parcelado').hidden = f.repeticao !== 'parcelado';
        inputDataFim.hidden = f.fimMensal !== 'data';
        $('#rotulo-valor').textContent = f.repeticao === 'parcelado' ? 'Valor total da compra' : 'Valor';
        atualizarPreviaParcelas();
      }
      desenharChips();
    }

    function marcarSegmento(grupo, valor) {
      const caixa = form.querySelector(`[data-grupo="${grupo}"]`);
      if (!caixa) return;
      caixa.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('ativo', b.dataset.valor === valor);
        b.setAttribute('aria-pressed', b.dataset.valor === valor);
      });
    }

    function atualizarPreviaParcelas() {
      const previa = $('#previa-parcelas');
      if (!previa) return;
      const n = lerParcelas();
      if (!f.valor || !n) { previa.textContent = 'Digite o valor total acima.'; return; }
      const parcela = Math.floor(f.valor / n);
      const resto = f.valor - parcela * n;
      previa.textContent = resto
        ? `1ª de ${Formato.dinheiro(parcela + resto)} e ${n - 1}x de ${Formato.dinheiro(parcela)}`
        : `${n}x de ${Formato.dinheiro(parcela)}`;
    }

    function lerParcelas() {
      const n = parseInt(inputParcelas ? inputParcelas.value : '0', 10);
      return Number.isFinite(n) ? n : 0;
    }

    function desenharChips() {
      const lista = Dados.categorias(f.tipo);
      if (f.categoriaId && !lista.some((c) => c.id === f.categoriaId)) f.categoriaId = null;
      $('#chips').innerHTML = lista.map((c) => `
        <button type="button" class="chip ${c.id === f.categoriaId ? 'ativo' : ''}" data-cat="${c.id}" style="--cor:${c.cor}">
          <span class="ponto"></span>${UI.esc(c.nome)}
        </button>`).join('') +
        '<button type="button" class="chip chip-nova" data-nova>+ Nova</button>';
    }

    function mostrarErro(msg) {
      const el = $('#erro-form');
      el.textContent = msg;
      el.hidden = !msg;
    }

    // ----- Eventos -----
    form.addEventListener('click', async (e) => {
      const seg = e.target.closest('[data-grupo] button');
      if (seg) {
        const grupo = seg.closest('[data-grupo]').dataset.grupo;
        const valor = seg.dataset.valor;
        if (grupo === 'tipo') f.tipo = valor;
        if (grupo === 'pago') { f.pago = valor === 'sim'; pagoEscolhidoAMao = true; }
        if (grupo === 'repeticao') f.repeticao = valor;
        if (grupo === 'fimMensal') f.fimMensal = valor;
        mostrarErro('');
        atualizar();
        return;
      }

      const chip = e.target.closest('[data-cat]');
      if (chip) {
        f.categoriaId = chip.dataset.cat;
        mostrarErro('');
        desenharChips();
        return;
      }

      if (e.target.closest('[data-nova]')) {
        const nome = await UI.pedirTexto({
          titulo: f.tipo === 'entrada' ? 'Nova categoria de entrada' : 'Nova categoria de saída',
          rotulo: 'Nome da categoria',
          botao: 'Criar categoria',
        });
        if (nome) {
          f.categoriaId = Dados.criarCategoria(nome, f.tipo).id;
          desenharChips();
        }
        return;
      }

      const passo = e.target.closest('[data-passo]');
      if (passo) {
        const n = Math.min(120, Math.max(2, lerParcelas() + Number(passo.dataset.passo)));
        inputParcelas.value = n;
        atualizarPreviaParcelas();
        return;
      }

      if (e.target.closest('#btn-excluir')) {
        const excluiu = await TelaMes.excluirComPergunta(existente.id);
        if (excluiu) folha.fechar();
      }
    });

    // Campo de valor no estilo de app de banco: digita 1234 e aparece 12,34.
    inputValor.addEventListener('input', () => {
      f.valor = Formato.lerValor(inputValor.value);
      inputValor.value = f.valor ? Formato.numeroValor(f.valor) : '';
      mostrarErro('');
      atualizarPreviaParcelas();
    });

    inputData.addEventListener('change', () => {
      f.data = inputData.value;
      // Se a pessoa ainda não escolheu a situação: data futura = pendente.
      if (!pagoEscolhidoAMao && f.data) {
        f.pago = f.data <= Formato.hoje();
        atualizar();
      }
    });

    if (inputParcelas) inputParcelas.addEventListener('input', atualizarPreviaParcelas);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      f.data = inputData.value;
      const cat = Dados.categoria(f.categoriaId);

      if (!f.valor) return mostrarErro('Digite o valor.');
      if (!cat) return mostrarErro('Escolha uma categoria.');
      if (!f.data) return mostrarErro('Escolha a data.');

      const dados = {
        tipo: f.tipo,
        descricao: inputDesc.value.trim() || cat.nome,
        valor: f.valor,
        data: f.data,
        categoriaId: f.categoriaId,
        pago: f.pago,
      };

      try {
        if (existente) {
          await salvarEdicao(dados);
        } else {
          salvarNovo(dados);
        }
      } catch (erro) {
        mostrarErro(erro.message);
      }
    });

    function salvarNovo(dados) {
      let repeticao = { modo: 'nenhuma' };
      if (f.repeticao === 'mensal') {
        const fim = f.fimMensal === 'data' ? inputDataFim.value : null;
        if (f.fimMensal === 'data' && !fim) throw new Error('Escolha a data final da repetição.');
        if (fim && fim < dados.data) throw new Error('A data final precisa ser depois da data do lançamento.');
        repeticao = { modo: 'mensal', fim };
      } else if (f.repeticao === 'parcelado') {
        const n = lerParcelas();
        if (n < 2 || n > 120) throw new Error('O número de parcelas deve ser de 2 a 120.');
        if (dados.valor < n) throw new Error('O valor é pequeno demais para tantas parcelas.');
        repeticao = { modo: 'parcelado', parcelas: n };
      }

      Dados.criar(dados, repeticao);
      folha.fechar();

      const p = Formato.partes(dados.data);
      TelaMes.irPara(p.ano, p.mes);
      if (repeticao.modo === 'parcelado') UI.aviso(`${repeticao.parcelas} parcelas criadas`);
      else if (repeticao.modo === 'mensal') UI.aviso('Lançamento mensal criado');
      else UI.aviso(`Salvo em ${Formato.data(dados.data)}`);
    }

    async function salvarEdicao(dados) {
      let escopo = 'este';
      if (serie) {
        escopo = await UI.perguntar({
          titulo: 'Salvar alterações',
          mensagem: 'Este lançamento se repete. Aplicar a mudança em quais?',
          opcoes: [
            { rotulo: 'Só este', valor: 'este', estilo: 'principal' },
            { rotulo: 'Este e os próximos', valor: 'proximos', estilo: 'principal' },
          ],
        });
        if (!escopo) return;
      }
      Dados.editar(existente.id, dados, escopo);
      folha.fechar();
      TelaMes.render();
      UI.aviso('Alterações salvas');
    }

    atualizar();
    if (!existente) inputValor.focus();
  }

  // Data sugerida: hoje, ou o dia 1 do mês que está aberto na tela (se for outro mês).
  function dataPadrao() {
    const hoje = Formato.hoje();
    const p = Formato.partes(hoje);
    const aberto = TelaMes.mesAberto();
    if (aberto.ano === p.ano && aberto.mes === p.mes) return hoje;
    return Formato.iso(aberto.ano, aberto.mes, 1);
  }

  function infoSerie(lanc, serie) {
    if (!serie) return '';
    const texto = serie.modo === 'parcelado'
      ? `Parcela ${lanc.indice + 1} de ${serie.total}.`
      : 'Este lançamento se repete todo mês.';
    return `<p class="info-serie">${texto} Ao salvar, você escolhe se a mudança vale só para este ou também para os próximos.</p>`;
  }

  return { abrir };
})();
