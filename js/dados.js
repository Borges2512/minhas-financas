// dados.js — onde os dados ficam guardados e todas as regras de negócio.
//
// Tudo fica no próprio aparelho (localStorage), num único objeto "estado":
//   categorias:  [{ id, nome, tipo: 'saida' | 'entrada', cor }]
//   lancamentos: [{ id, tipo, descricao, valor (centavos), data 'AAAA-MM-DD',
//                   categoriaId, pago, serieId?, indice? }]
//   series:      [{ id, modo: 'mensal' | 'parcelado', tipo, descricao, valor, categoriaId,
//                   dataInicio, dia, total (nº de vezes; null = sem fim), geradas }]
//
// Uma "série" é a regra de um lançamento que se repete (todo mês ou parcelado).
// Cada mês da série vira um lançamento normal com serieId + indice (0 = primeiro).
// Lançamentos mensais "sem fim" são criados aos poucos, conforme os meses são abertos.

const Dados = (() => {
  const CHAVE = 'minhas-financas';
  const VERSAO_DADOS = 1;
  const CORES = ['#e11d48', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#0284c7',
    '#4f46e5', '#9333ea', '#db2777', '#64748b'];

  let estado = null;

  // ---------- Guardar e carregar ----------

  function estadoInicial() {
    const cat = (nome, tipo, cor) => ({ id: novoId(), nome, tipo, cor });
    return {
      versao: VERSAO_DADOS,
      categorias: [
        cat('Alimentação', 'saida', '#ea580c'),
        cat('Moradia', 'saida', '#0284c7'),
        cat('Transporte', 'saida', '#ca8a04'),
        cat('Lazer', 'saida', '#9333ea'),
        cat('Saúde', 'saida', '#e11d48'),
        cat('Outros', 'saida', '#64748b'),
        cat('Salário', 'entrada', '#16a34a'),
        cat('Outros', 'entrada', '#0d9488'),
      ],
      lancamentos: [],
      series: [],
      config: { ultimoBackup: null },
    };
  }

  function carregar() {
    try {
      const texto = localStorage.getItem(CHAVE);
      estado = texto ? JSON.parse(texto) : estadoInicial();
    } catch (erro) {
      console.error('Não foi possível ler os dados', erro);
      estado = estadoInicial();
    }
    completarCampos();
  }

  // Garante que dados antigos ou importados tenham todos os campos esperados.
  function completarCampos() {
    estado.versao = VERSAO_DADOS;
    estado.categorias = Array.isArray(estado.categorias) ? estado.categorias : [];
    estado.lancamentos = Array.isArray(estado.lancamentos) ? estado.lancamentos : [];
    estado.series = Array.isArray(estado.series) ? estado.series : [];
    estado.config = estado.config || { ultimoBackup: null };
  }

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (erro) {
      console.error(erro);
      throw new Error('Não foi possível salvar. O armazenamento do aparelho pode estar cheio.');
    }
  }

  function novoId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  // ---------- Categorias ----------

  function categorias(tipo) {
    const lista = tipo ? estado.categorias.filter((c) => c.tipo === tipo) : estado.categorias;
    return lista.slice().sort((a, b) => {
      if (a.nome === 'Outros') return 1; // "Outros" sempre por último
      if (b.nome === 'Outros') return -1;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }

  function categoria(id) {
    return estado.categorias.find((c) => c.id === id) || null;
  }

  function criarCategoria(nome, tipo) {
    const usadas = estado.categorias.map((c) => c.cor);
    const cor = CORES.find((c) => !usadas.includes(c)) || CORES[estado.categorias.length % CORES.length];
    const nova = { id: novoId(), nome: nome.trim(), tipo, cor };
    estado.categorias.push(nova);
    salvar();
    return nova;
  }

  function renomearCategoria(id, nome) {
    const c = categoria(id);
    if (!c) return;
    c.nome = nome.trim();
    salvar();
  }

  function usosCategoria(id) {
    return estado.lancamentos.filter((l) => l.categoriaId === id).length;
  }

  // Exclui a categoria; os lançamentos dela passam para "Outros" do mesmo tipo.
  function excluirCategoria(id) {
    const c = categoria(id);
    if (!c) return;
    estado.categorias = estado.categorias.filter((x) => x.id !== id);
    if (usosCategoria(id) > 0 || estado.series.some((s) => s.categoriaId === id)) {
      let outros = estado.categorias.find((x) => x.tipo === c.tipo && x.nome === 'Outros');
      if (!outros) outros = criarCategoria('Outros', c.tipo);
      estado.lancamentos.forEach((l) => { if (l.categoriaId === id) l.categoriaId = outros.id; });
      estado.series.forEach((s) => { if (s.categoriaId === id) s.categoriaId = outros.id; });
    }
    salvar();
  }

  // ---------- Séries (repetições) ----------

  function serie(id) {
    return estado.series.find((s) => s.id === id) || null;
  }

  function dataDaOcorrencia(s, indice) {
    return Formato.dataMaisMeses(s.dataInicio, indice, s.dia);
  }

  function serieTemMais(s) {
    return s.total === null || s.geradas < s.total;
  }

  function gerarProxima(s) {
    const lanc = {
      id: novoId(),
      tipo: s.tipo,
      descricao: s.descricao,
      valor: s.valor,
      data: dataDaOcorrencia(s, s.geradas),
      categoriaId: s.categoriaId,
      pago: false,
      serieId: s.id,
      indice: s.geradas,
    };
    estado.lancamentos.push(lanc);
    s.geradas += 1;
    return lanc;
  }

  // Cria os lançamentos das séries que ainda faltam até a data limite.
  function gerarSeriesAte(dataLimite) {
    let mudou = false;
    for (const s of estado.series) {
      let seguranca = 0;
      while (serieTemMais(s) && dataDaOcorrencia(s, s.geradas) <= dataLimite && seguranca < 1200) {
        gerarProxima(s);
        mudou = true;
        seguranca += 1;
      }
    }
    if (mudou) salvar();
  }

  // Quantas vezes uma série mensal acontece entre o início e a data final.
  function contarAte(s, dataFim) {
    let n = 0;
    while (n < 1200 && dataDaOcorrencia(s, n) <= dataFim) n += 1;
    return n;
  }

  // Remove séries que já terminaram e não têm mais nenhum lançamento.
  function limparSeries() {
    estado.series = estado.series.filter((s) =>
      serieTemMais(s) || estado.lancamentos.some((l) => l.serieId === s.id));
  }

  // Texto curto que aparece no lançamento: "2/6" ou "Mensal".
  function rotuloSerie(lanc) {
    if (!lanc.serieId) return '';
    const s = serie(lanc.serieId);
    if (!s) return '';
    if (s.modo === 'parcelado') return `${lanc.indice + 1}/${s.total}`;
    return 'Mensal';
  }

  // ---------- Lançamentos ----------

  function lancamento(id) {
    return estado.lancamentos.find((l) => l.id === id) || null;
  }

  // Lista do mês, ordenada por data. Antes, cria as repetições que faltam.
  function lancamentosDoMes(ano, mes) {
    const hoje = Formato.partes(Formato.hoje());
    const limite = Math.max(ano * 12 + mes, hoje.ano * 12 + hoje.mes);
    const fim = Formato.ultimoDiaDoMes(Math.floor((limite - 1) / 12), ((limite - 1) % 12) + 1);
    gerarSeriesAte(fim);

    const prefixo = `${ano}-${String(mes).padStart(2, '0')}-`;
    return estado.lancamentos
      .filter((l) => l.data.startsWith(prefixo))
      .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  }

  function resumo(lista) {
    const r = { entradas: 0, saidas: 0, entradasPagas: 0, saidasPagas: 0 };
    for (const l of lista) {
      if (l.tipo === 'entrada') {
        r.entradas += l.valor;
        if (l.pago) r.entradasPagas += l.valor;
      } else {
        r.saidas += l.valor;
        if (l.pago) r.saidasPagas += l.valor;
      }
    }
    r.previsto = r.entradas - r.saidas;
    r.realizado = r.entradasPagas - r.saidasPagas;
    return r;
  }

  // dados: { tipo, descricao, valor, data, categoriaId, pago }
  // repeticao: { modo: 'nenhuma' } | { modo: 'mensal', fim: null | 'AAAA-MM-DD' }
  //            | { modo: 'parcelado', parcelas: N }  (aqui "valor" é o total da compra)
  // Devolve o primeiro lançamento criado.
  function criar(dados, repeticao) {
    const modo = repeticao ? repeticao.modo : 'nenhuma';

    if (modo === 'nenhuma') {
      const lanc = {
        id: novoId(),
        tipo: dados.tipo,
        descricao: dados.descricao,
        valor: dados.valor,
        data: dados.data,
        categoriaId: dados.categoriaId,
        pago: dados.pago,
      };
      estado.lancamentos.push(lanc);
      salvar();
      return lanc;
    }

    const s = {
      id: novoId(),
      modo,
      tipo: dados.tipo,
      descricao: dados.descricao,
      valor: dados.valor,
      categoriaId: dados.categoriaId,
      dataInicio: dados.data,
      dia: Formato.partes(dados.data).dia,
      total: null,
      geradas: 0,
    };

    let resto = 0;
    if (modo === 'parcelado') {
      const n = repeticao.parcelas;
      s.total = n;
      s.valor = Math.floor(dados.valor / n);
      resto = dados.valor - s.valor * n; // centavos que sobram vão na 1ª parcela
    } else if (repeticao.fim) {
      s.total = Math.max(1, contarAte(s, repeticao.fim));
    }

    estado.series.push(s);

    const primeiro = gerarProxima(s);
    primeiro.pago = dados.pago;
    primeiro.valor += resto;

    // Parcelas são poucas: já cria todas. Mensais são criadas conforme os meses são abertos.
    if (modo === 'parcelado') {
      while (serieTemMais(s)) gerarProxima(s);
    }

    salvar();
    return primeiro;
  }

  // escopo: 'este' (só este) ou 'proximos' (este e os próximos da série)
  function editar(id, dados, escopo) {
    const l = lancamento(id);
    if (!l) return;
    const campos = {
      tipo: dados.tipo,
      descricao: dados.descricao,
      valor: dados.valor,
      categoriaId: dados.categoriaId,
    };
    Object.assign(l, campos, { data: dados.data, pago: dados.pago });

    if (escopo === 'proximos' && l.serieId) {
      const s = serie(l.serieId);
      if (s) {
        Object.assign(s, campos, { dia: Formato.partes(dados.data).dia });
        for (const outro of estado.lancamentos) {
          if (outro.serieId === s.id && outro.indice > l.indice) {
            Object.assign(outro, campos);
            outro.data = dataDaOcorrencia(s, outro.indice);
          }
        }
      }
    }
    salvar();
  }

  function excluir(id, escopo) {
    const l = lancamento(id);
    if (!l) return;

    if (escopo === 'proximos' && l.serieId) {
      const s = serie(l.serieId);
      estado.lancamentos = estado.lancamentos.filter(
        (o) => !(o.serieId === l.serieId && o.indice >= l.indice));
      if (s) s.total = l.indice; // não cria mais nenhum a partir daqui
    } else {
      estado.lancamentos = estado.lancamentos.filter((o) => o.id !== id);
    }
    limparSeries();
    salvar();
  }

  function alternarPago(id) {
    const l = lancamento(id);
    if (!l) return;
    l.pago = !l.pago;
    salvar();
  }

  // ---------- Backup ----------

  function exportar() {
    estado.config.ultimoBackup = new Date().toISOString();
    salvar();
    return JSON.stringify({
      app: 'minhas-financas',
      versao: VERSAO_DADOS,
      exportadoEm: estado.config.ultimoBackup,
      dados: estado,
    }, null, 2);
  }

  // Substitui todos os dados pelos do arquivo. Lança erro se o arquivo não servir.
  function importar(texto) {
    let obj;
    try {
      obj = JSON.parse(texto);
    } catch {
      throw new Error('Este arquivo não é um backup válido.');
    }
    const novo = obj && obj.dados ? obj.dados : obj;
    if (!novo || !Array.isArray(novo.lancamentos) || !Array.isArray(novo.categorias)) {
      throw new Error('Este arquivo não é um backup do Minhas Finanças.');
    }
    estado = novo;
    completarCampos();
    salvar();
    return estado.lancamentos.length;
  }

  function ultimoBackup() {
    return estado.config.ultimoBackup;
  }

  return {
    carregar, categorias, categoria, criarCategoria, renomearCategoria, usosCategoria,
    excluirCategoria, serie, rotuloSerie, lancamento, lancamentosDoMes, resumo,
    criar, editar, excluir, alternarPago, exportar, importar, ultimoBackup,
  };
})();
