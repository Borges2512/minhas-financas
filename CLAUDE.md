# Minhas Finanças

PWA de finanças pessoais, de uso individual, feito para iPhone (Safari → "Adicionar à Tela de Início"). O dono não é programador: explique tudo em português do Brasil simples e diga exatamente o que ele precisa fazer.

## Regras
- Interface em **português do Brasil**, valores em R$ (`Formato.dinheiro`) e datas em dd/mm/aaaa (`Formato.data`).
- HTML, CSS e JS puros, **sem build e sem dependências**. Scripts clássicos (não usar ES modules) carregados em ordem no `index.html`; cada arquivo expõe um objeto global (`Formato`, `Dados`, `UI`, `TelaMes`, `TelaLancamento`, `TelaAjustes`).
- Mobile-first: alvos de toque ≥ 44px e inputs com fonte ≥ 16px (evita o zoom no iOS).
- **Sempre que mudar qualquer arquivo publicado, aumente `VERSAO` em `sw.js`.** Se criar um arquivo novo, inclua-o em `ARQUIVOS` no `sw.js`.
- Use só caminhos relativos (o site fica em `usuario.github.io/minhas-financas/`).

## Dados
- Ficam em `localStorage['minhas-financas']`, num único objeto (o formato está documentado no topo de `js/dados.js`).
- Valores em **centavos inteiros**; datas como texto `AAAA-MM-DD`.
- Repetições: uma `serie` (mensal ou parcelado) gera lançamentos com `serieId` + `indice`. As mensais "sem fim" são geradas sob demanda em `lancamentosDoMes`, e `serie.geradas` evita recriar um lançamento excluído. "Este e os próximos" atualiza o molde da série e os lançamentos com `indice` maior.
- Mudou o formato dos dados? Aumente `VERSAO_DADOS` e migre em `completarCampos()`, porque os backups antigos precisam continuar importando.

## Testar
- No computador: `python servidor-local.py` → http://localhost:8123 (corrige o tipo MIME de `.js` no Windows).
- Publicação: GitHub Pages, enviando os arquivos pelo site (o passo a passo está em `LEIA-ME.md`).

## Ideias futuras citadas pelo dono
Gráficos por categoria (as categorias já têm `cor`), metas de gastos e sincronização na nuvem.
