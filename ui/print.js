// A paper document, independent of the current tab or editing mode.
export function renderPrintService(culto, { state, escapeHtml: esc, nomeInstrumento }) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(culto.data || '') ? culto.data.split('-').reverse().join('/') : '';
  const org = culto.organizacao || {};
  const leader = state.membros.find(m => m.id === culto.ministranteId);
  const group = state.gruposMusicais.find(g => g.id === culto.grupoMusicalId);
  const theme = state.temasCulto.find(t => t.id === culto.temaId);
  const line = value => `<div class="paper-entry${value ? '' : ' paper-blank'}">${value ? esc(value) : '&nbsp;'}</div>`;
  const rows = (culto.programa || []).map(item => item.tipo === 'secao'
    ? `<tr class="paper-section"><th colspan="3">${esc(item.titulo || '')}</th></tr>`
    : `<tr><td class="paper-time">${esc(item.hora || '')}</td><td>${esc(item.nome || '')}</td><td>${item.responsavel ? `<div class="paper-person">${esc(item.responsavel)}</div>` : ''}${(item.musicas || []).map(line).join('')}${!item.responsavel && !(item.musicas || []).length ? line('') : ''}</td></tr>`).join('');
  const crew = (culto.slots || []).map(slot => {
    const person = state.membros.find(m => m.id === slot.membroId);
    const role = slot.tipo === 'instrumento' ? nomeInstrumento(slot.instrumento) : slot.tipo === 'solo' ? 'Música especial' : slot.naipeAlvo || 'Voz';
    const status = person && slot.status === 'recusado' ? ' (substituição necessária)' : person && slot.status !== 'confirmado' ? ' (a confirmar)' : '';
    return `<span><b>${esc(role)}:</b> ${person ? esc(person.nome + status) : '________________'}</span>`;
  });
  const departments = [['anciao','Ancião'],['diaconos','Diáconos'],['diaconisas','Diaconisas'],['recepcao','Recepção'],['sonoplastia','Sonoplastia'],['transmissao','Transmissão']]
    .filter(([key]) => org[key]).map(([key,label]) => `<span><b>${label}:</b> ${esc(org[key])}</span>`);
  return `<div class="paper-service">
    <header class="paper-header"><p class="paper-church">IGREJA ADVENTISTA DO SÉTIMO DIA · CENTRAL DE CAMPINA GRANDE</p><h1>${esc(culto.nome || 'Ordem do culto')}</h1><p>${date}${culto.hora ? ` · ${esc(culto.hora)}` : ''}${org.local ? ` · ${esc(org.local)}` : ''}</p>${theme ? `<p>${esc(theme.nome)}</p>` : ''}${org.ministerio ? `<p><b>Ministério responsável:</b> ${esc(org.ministerio)}</p>` : ''}</header>
    <table class="paper-order"><colgroup><col class="paper-col-time"/><col class="paper-col-moment"/><col/></colgroup><thead><tr><th>Horário</th><th>Momento</th><th>Responsáveis / músicas</th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="paper-no-order">Ordem do culto ainda não preenchida.</td></tr>'}</tbody></table>
    <section class="paper-team"><h2>Equipe de louvor</h2><div class="paper-roster">${group ? `<span><b>Grupo convidado:</b> ${esc(group.nome)}</span>` : crew.join('')}${leader ? `<span><b>Condução do louvor:</b> ${esc(leader.nome)}</span>` : ''}${culto.ensaioData ? `<span><b>Ensaio:</b> ${esc(culto.ensaioData.split('-').reverse().join('/'))}${culto.ensaioHora ? ' · ' + esc(culto.ensaioHora) : ''}</span>` : ''}</div></section>
    ${departments.length ? `<section class="paper-team"><h2>Apoio ao culto</h2><div class="paper-roster">${departments.join('')}</div></section>` : ''}
    ${org.observacoes ? `<section class="paper-notes"><b>Orientações:</b> ${esc(org.observacoes)}</section>` : ''}
    <footer class="paper-footer">IASD Central de Campina Grande · Ordem do culto</footer>
  </div>`;
}
