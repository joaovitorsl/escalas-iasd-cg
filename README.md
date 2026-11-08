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
