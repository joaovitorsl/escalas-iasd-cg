# Central / Louvor

Agenda, escala de louvor e ordem dos cultos da IASD Central de Campina Grande. Aplicação estática, sem etapa de compilação.

## Executar localmente

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8765`. Em localhost, os dados ficam apenas no navegador e o aplicativo não carrega o Firebase. É possível restaurar uma cópia JSON em **Organizar → Configurações e cópias** para testar com dados locais.

Em outros hosts, a aplicação mantém a integração com o documento compartilhado do Firestore. Não use uma hospedagem externa de teste como se fosse um ambiente isolado. O workflow existente publica apenas a branch `main` no GitHub Pages.

## Navegação

- **Agenda de cultos:** lista e calendário; consulta por culto, busca e filtros.
- **Louvor:** equipe, confirmação e ensaio.
- **Ordem do culto:** momentos, responsáveis e músicas na sequência.
- **Departamentos:** ministério, local, ancião, diaconia, recepção, som, transmissão e orientações.
- **Editar:** habilita os controles do culto selecionado. As alterações são salvas automaticamente.
- **Imprimir culto:** inclui equipe, programa e departamentos.
- **Organizar:** modelos, temas, grupos e manutenção dos dados.

Os campos dos departamentos são texto livre em `culto.organizacao`. Os registros existentes de músicos, vagas e programa são preservados. O pregador continua registrado no momento da pregação no programa. Esta versão não importa planilhas XLSX nem resolve nomes e datas ambíguos automaticamente.

A versão publicada exige entrada com Google e conta autorizada. A autorização real é aplicada pelo Firestore (`firestore.rules`); a lista `AUTHORIZED_EMAILS` também controla o acesso à interface. O projeto ainda usa um documento compartilhado: conflitos de edição simultânea não são mesclados por campo. Alterações pendentes são guardadas no navegador e precisam ser revisadas antes de substituir a agenda da nuvem após uma falha.

## Testes de interface

Requer Node.js, Playwright e Chrome. Com o servidor local ativo:

```sh
node tests/ui.mjs
node tests/sync.mjs
node tests/persistence.mjs
node tests/print.mjs
```

Caso Playwright não esteja na resolução padrão do Node, informe `PLAYWRIGHT_MODULE` com o caminho absoluto de seu `index.mjs`. `CHROME_PATH` pode apontar para outro executável Chromium/Chrome. `BASE_URL` configura o servidor local do primeiro teste; use um endereço localhost.

Os testes usam pessoas fictícias. O teste de sincronização intercepta todos os pedidos e substitui o Firebase por um módulo simulado: não acessa o banco da igreja. As capturas vão para uma pasta temporária indicada ao terminar.

Cobertura: consulta sem cadastro de equipe, estados das vagas, eventos no mesmo dia, edição, persistência, filtros, calendário, criação de culto, celular, impressão, inicialização hospedada e resultado de sincronização.

### Interface

A navegação fica na lateral no desktop e na parte inferior no celular. A agenda destaca o próximo culto com equipe, programa e ensaio, e agrupa os demais por mês. O visual usa uma paleta verde com temas claro e escuro.

`ui/agenda.js` contém os componentes de apresentação e ícones; `agenda.css` define a navegação, agenda, consulta e adaptação móvel. `style.css` mantém os tokens compartilhados e os componentes dos editores. As regras de escala e a persistência continuam em `app.js`, sem etapa de build.

### Impressão

“Imprimir culto” abre uma prévia A4 com horário, momento e responsáveis/músicas. A folha inclui as seções do programa, espaços de músicas vazias, equipe de louvor e os dados de apoio preenchidos. Os horários e o conteúdo vêm do próprio culto; a impressão não copia um modelo nem estima horários de término. Programas maiores continuam em novas páginas com cabeçalho de tabela repetido. Na janela do navegador, desative os cabeçalhos e rodapés automáticos.

A apresentação está em `ui/print.js` e `print.css`. Execute `node tests/print.mjs` para verificar estrutura, conteúdo, campos vazios e escape de texto.

### Firebase Authentication e regras

No projeto `escala-central-745a9`, ativar Google em Authentication → Sign-in method e incluir `joaovitorsl.github.io` em Authorized domains. Publicar `firestore.rules` no Firestore Console. As regras antigas expiraram em 29/08/2026 e negavam leitura e gravação. A regra nova permite apenas contas verificadas da lista, no documento `iasd_cg/estado_global`. Não permite apagar o documento inteiro. Para ampliar a equipe autorizada, atualizar a lista das regras e `AUTHORIZED_EMAILS` no cliente.

Dados digitados em localhost ficam somente naquele navegador; não são enviados à nuvem automaticamente. O site guarda uma cópia local das leituras da nuvem e mantém uma cópia separada das alterações aguardando envio. Em caso de permissão negada, não tenta substituir o banco com um estado vazio.

### Consulta pública e presença rápida

Visitantes consultam lista, calendário, equipe, ordem do culto e impressão sem login. A edição e os botões de presença (Confirmar / Não pode / A confirmar), diretamente no cartão da pessoa, exigem conta autorizada. Localhost continua sendo uma prévia editável, sem conexão ao Firebase.

A leitura pública usa exclusivamente `agenda_publica/atual`; `iasd_cg/estado_global` permanece privado. `ui/public-agenda.js` cria uma cópia com campos permitidos, sem contatos, indisponibilidades, observações internas ou cadastro de pessoas não escaladas. Ao entrar com conta autorizada, a leitura confirmada do documento privado publica a cópia; gravações seguintes atualizam essa cópia após salvar o original. Falhas na publicação mostram um aviso com nova tentativa e não impedem salvar o documento privado. Há uma pequena janela entre a gravação privada e a atualização pública; não é uma transação entre os dois documentos.

Para ativar, publicar as regras atualizadas e abrir o site com uma conta autorizada uma vez. Sem documento público, o visitante vê uma mensagem de preparação; o app não inventa uma agenda nem usa o cache privado. Testes: `node tests/public-agenda.mjs`, `node tests/persistence.mjs` e `node tests/print.mjs`.
