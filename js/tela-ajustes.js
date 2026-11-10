// tela-ajustes.js — categorias e backup.

const TelaAjustes = (() => {
  function abrir() {
    const conteudo = UI.criar('<div class="ajustes"></div>');
    UI.abrirFolha({ titulo: 'Ajustes', conteudo, alta: true });

    function desenhar() {
      const ultimo = Dados.ultimoBackup();
      conteudo.innerHTML = `
        ${secaoCategorias('saida', 'Categorias de saída')}
        ${secaoCategorias('entrada', 'Categorias de entrada')}

        <section>
          <h3>Backup</h3>
          <p class="dica">Seus dados ficam só neste aparelho. Faça um backup de vez em quando
            e guarde o arquivo no app Arquivos, iCloud Drive ou mande para o seu e-mail.</p>
          <p class="dica"><b>Último backup:</b> ${ultimo ? Formato.data(ultimo.slice(0, 10)) : 'nunca'}</p>
          <button type="button" class="btn btn-principal" data-acao="exportar">Exportar backup</button>
          <button type="button" class="btn btn-neutro" data-acao="importar">Importar backup</button>
          <input type="file" accept="application/json,.json" hidden id="arquivo-backup">
        </section>

        <section>
          <h3>Sobre</h3>
          <p class="dica">Minhas Finanças · versão ${APP_VERSAO}</p>
        </section>`;
    }

    function secaoCategorias(tipo, titulo) {
      const itens = Dados.categorias(tipo).map((c) => `
        <li>
          <button type="button" class="linha-categoria" data-cat="${c.id}">
            <span class="ponto" style="background:${c.cor}"></span>
            <span class="nome">${UI.esc(c.nome)}</span>
            <span class="seta">›</span>
          </button>
        </li>`).join('');
      return `
        <section>
          <h3>${titulo}</h3>
          <ul class="lista-categorias">${itens}</ul>
          <button type="button" class="btn btn-texto" data-nova="${tipo}">+ Nova categoria</button>
        </section>`;
    }

    conteudo.addEventListener('click', async (e) => {
      const linha = e.target.closest('[data-cat]');
      if (linha) return editarCategoria(linha.dataset.cat);

      const nova = e.target.closest('[data-nova]');
      if (nova) {
        const tipo = nova.dataset.nova;
        const nome = await UI.pedirTexto({
          titulo: tipo === 'entrada' ? 'Nova categoria de entrada' : 'Nova categoria de saída',
          rotulo: 'Nome da categoria',
          botao: 'Criar categoria',
        });
        if (nome) {
          Dados.criarCategoria(nome, tipo);
          desenhar();
          UI.aviso('Categoria criada');
        }
        return;
      }

      const acao = e.target.closest('[data-acao]');
      if (acao && acao.dataset.acao === 'exportar') return exportarBackup(desenhar);
      if (acao && acao.dataset.acao === 'importar') conteudo.querySelector('#arquivo-backup').click();
    });

    conteudo.addEventListener('change', (e) => {
      if (e.target.id === 'arquivo-backup' && e.target.files[0]) {
        importarBackup(e.target.files[0], desenhar);
        e.target.value = '';
      }
    });

    async function editarCategoria(id) {
      const c = Dados.categoria(id);
      if (!c) return;
      const escolha = await UI.perguntar({
        titulo: c.nome,
        opcoes: [
          { rotulo: 'Renomear', valor: 'renomear', estilo: 'principal' },
          { rotulo: 'Excluir', valor: 'excluir', estilo: 'perigo' },
        ],
      });

      if (escolha === 'renomear') {
        const nome = await UI.pedirTexto({ titulo: 'Renomear categoria', rotulo: 'Nome', valor: c.nome });
        if (nome) {
          Dados.renomearCategoria(id, nome);
          desenhar();
          TelaMes.render();
        }
      } else if (escolha === 'excluir') {
        const usos = Dados.usosCategoria(id);
        const msg = usos
          ? `${usos} lançamento(s) usam esta categoria e vão passar para "Outros".`
          : 'Nenhum lançamento usa esta categoria.';
        const ok = await UI.perguntar({
          titulo: `Excluir "${c.nome}"?`,
          mensagem: msg,
          opcoes: [{ rotulo: 'Excluir categoria', valor: true, estilo: 'perigo' }],
        });
        if (ok) {
          Dados.excluirCategoria(id);
          desenhar();
          TelaMes.render();
          UI.aviso('Categoria excluída');
        }
      }
    }

    desenhar();
  }

  // Gera o arquivo JSON. No iPhone abre a tela de compartilhar ("Salvar em Arquivos").
  async function exportarBackup(depois) {
    const texto = Dados.exportar();
    const nome = `minhas-financas-backup-${Formato.hoje()}.json`;
    const arquivo = new File([texto], nome, { type: 'application/json' });

    try {
      if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: 'Backup Minhas Finanças' });
      } else {
        const url = URL.createObjectURL(arquivo);
        const a = document.createElement('a');
        a.href = url;
        a.download = nome;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      UI.aviso('Backup gerado');
    } catch (erro) {
      if (erro.name !== 'AbortError') UI.aviso('Não foi possível gerar o backup.', true);
    }
    if (depois) depois();
  }

  function importarBackup(arquivo, depois) {
    const leitor = new FileReader();
    leitor.onload = async () => {
      const ok = await UI.perguntar({
        titulo: 'Importar backup?',
        mensagem: 'Todos os dados atuais deste aparelho serão substituídos pelos dados do arquivo.',
        opcoes: [{ rotulo: 'Substituir meus dados', valor: true, estilo: 'perigo' }],
      });
      if (!ok) return;
      try {
        const total = Dados.importar(leitor.result);
        TelaMes.render();
        if (depois) depois();
        UI.aviso(`Backup importado: ${total} lançamento(s)`);
      } catch (erro) {
        UI.aviso(erro.message, true);
      }
    };
    leitor.onerror = () => UI.aviso('Não foi possível ler o arquivo.', true);
    leitor.readAsText(arquivo);
  }

  return { abrir };
})();
