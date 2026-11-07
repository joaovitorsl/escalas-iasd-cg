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

Consulta e edição são modos de interface, não permissões de acesso. O projeto ainda usa um documento compartilhado e não implementa autenticação por usuário no cliente. A estrutura atual não resolve conflitos de edição simultânea entre departamentos.

## Testes de interface

Requer Node.js, Playwright e Chrome. Com o servidor local ativo:

```sh
node tests/ui.mjs
node tests/sync.mjs
```

Caso Playwright não esteja na resolução padrão do Node, informe `PLAYWRIGHT_MODULE` com o caminho absoluto de seu `index.mjs`. `CHROME_PATH` pode apontar para outro executável Chromium/Chrome. `BASE_URL` configura o servidor local do primeiro teste; use um endereço localhost.

Os testes usam pessoas fictícias. O teste de sincronização intercepta todos os pedidos e substitui o Firebase por um módulo simulado: não acessa o banco da igreja. As capturas vão para uma pasta temporária indicada ao terminar.

Cobertura: consulta sem cadastro de equipe, estados das vagas, eventos no mesmo dia, edição, persistência, filtros, calendário, criação de culto, celular, impressão, inicialização hospedada e resultado de sincronização.
