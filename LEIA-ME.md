# Minhas Finanças — guia rápido

App pessoal de controle de entradas e saídas. Funciona no iPhone como um app de verdade (ícone na Tela de Início, tela cheia e sem internet).
Os dados ficam **só no seu aparelho**. Faça backups.

---

## 1. Testar no computador

1. Abra a pasta `minhas-financas`.
2. Dê **dois cliques** em `servidor-local.py`. Vai abrir uma janela preta e o navegador vai abrir sozinho em `http://localhost:8123`.
   - Se não abrir sozinho, digite esse endereço no navegador.
3. Para ver como fica no celular: no Chrome ou no Edge, aperte **F12** e depois **Ctrl+Shift+M**, e escolha um iPhone na lista do topo.
4. Para parar, feche a janela preta.

> Os dados de teste ficam guardados no navegador do computador e não vão para o iPhone.

---

## 2. Publicar de graça (GitHub Pages) — só uma vez

Você vai precisar de uma conta gratuita no GitHub.

1. Acesse **github.com** e crie uma conta (botão *Sign up*). Escolha um nome de usuário, que vai aparecer no endereço do app.
2. Já logado, clique no **+** (canto superior direito) e depois em **New repository**.
   - **Repository name:** `minhas-financas`
   - Marque **Public**. O GitHub Pages grátis exige isso. Só o *código* do app fica visível; **seus dados financeiros nunca saem do celular**.
   - Clique em **Create repository**.
3. Na página que abrir, clique no link **uploading an existing file**.
4. Abra a pasta `minhas-financas` no Windows, selecione **tudo o que está dentro dela** (Ctrl+A) e arraste para a página do GitHub.
   - Pode enviar tudo, inclusive `servidor-local.py` e este LEIA-ME; não atrapalha.
   - As pastas `css`, `js` e `icones` precisam ir junto. Se o seu navegador não deixar arrastar pastas, use o Chrome ou o Edge.
5. Clique no botão verde **Commit changes**.
6. Vá em **Settings** (aba no topo do repositório), depois em **Pages** (no menu da esquerda).
   - Em **Branch**, escolha `main` e a pasta `/ (root)`, e clique em **Save**.
7. Espere 1 a 2 minutos e recarregue a página. Vai aparecer: *Your site is live at* `https://SEU-USUARIO.github.io/minhas-financas/`.

## 3. Instalar no iPhone

1. No iPhone, abra o endereço acima **no Safari** (precisa ser o Safari).
2. Toque no botão **Compartilhar** (quadrado com seta para cima).
3. Role e toque em **Adicionar à Tela de Início**, depois em **Adicionar**.
4. Abra o app pelo ícone **Minhas Finanças** na Tela de Início.

> **Importante:** use sempre o app pelo ícone. No iPhone, os dados do ícone são **separados** dos dados do Safari. Se você lançar algo pelo Safari, não vai aparecer no ícone, e vice-versa.

**Teste offline:** abra o app uma vez com internet, ative o Modo Avião e abra de novo. Deve funcionar normalmente.

---

## 4. Atualizar o app depois de mudanças

Quando pedir melhorias, os arquivos alterados ficam nesta pasta. Para publicar:

1. No GitHub, abra o repositório `minhas-financas` e clique em **Add file**, depois em **Upload files**.
2. Arraste **de novo todos os arquivos e pastas**. O GitHub substitui os antigos.
3. Clique em **Commit changes**. Em 1 a 2 minutos o site é atualizado.
4. No iPhone, abra o app (com internet), **feche-o** (deslize para cima) e **abra de novo**. A nova versão entra na segunda abertura.

> Toda mudança precisa aumentar a versão escrita no começo do arquivo `sw.js` (`const VERSAO = 'v1'` → `'v2'`…). É isso que avisa o iPhone que há novidade. Quando o Claude fizer mudanças, ele faz isso por você.

**Seus dados não se perdem com atualizações.** Eles só se perdem se você apagar o app da Tela de Início ou limpar os dados do Safari. Por isso existe o backup.

---

## 5. Backup

- **Ajustes (engrenagem) → Exportar backup:** o iPhone abre a tela de compartilhar. Escolha **Salvar em Arquivos** (iCloud Drive) ou mande para o seu e-mail.
- **Ajustes → Importar backup:** escolha o arquivo `.json`. Isso **substitui** todos os dados atuais pelos do arquivo.
- Trocou de celular? Instale o app no novo (passo 3) e importe o último backup.

---

## Como o código está organizado (para melhorias futuras)

| Arquivo | O que faz |
|---|---|
| `index.html` | Estrutura da tela principal |
| `css/estilo.css` | Cores e aparência (claro e escuro) |
| `js/formato.js` | Formata R$ e datas dd/mm/aaaa |
| `js/dados.js` | Guarda os dados e aplica as regras (repetições, parcelas, backup) |
| `js/ui.js` | Painéis, perguntas e avisos reutilizáveis |
| `js/tela-mes.js` | Tela do mês: resumo e lista |
| `js/tela-lancamento.js` | Formulário de novo lançamento ou edição |
| `js/tela-ajustes.js` | Categorias e backup |
| `js/app.js` | Liga tudo e ativa o modo offline |
| `sw.js` | Guarda os arquivos no aparelho (offline) |
| `manifest.webmanifest` + `icones/` | Nome e ícone do app |
