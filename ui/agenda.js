// Small, pure presentation components. Scheduling and persistence stay in app.js.
const paths = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h2m4 0h2m-8 3h2"/>',
  people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
  music: '<path d="M9 18V5l12-2v13M9 9l12-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="16" rx="3" ry="3"/>',
  order: '<path d="M9 5h12M9 12h12M9 19h12M3 5h.01M3 12h.01M3 19h.01"/>',
  bookmark: '<path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-4z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  moon: '<path d="M20.9 13a9 9 0 1 1-9.9-9.9A7 7 0 0 0 20.9 13Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>'
};
export function icon(name) { return `<svg class="ui-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.calendar}</svg>`; }

export function renderServiceCard(culto, featured, { state, status, escapeHtml: esc, parseISO, dias }) {
  const date = parseISO(culto.data);
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const leader = state.membros.find(m => m.id === culto.ministranteId);
  const group = state.gruposMusicais.find(g => g.id === culto.grupoMusicalId);
  const theme = state.temasCulto.find(t => t.id === culto.temaId);
  const slots = culto.slots || [];
  const confirmed = slots.filter(s => s.status === 'confirmado' && state.membros.some(m => m.id === s.membroId)).length;
  const moments = (culto.programa || []).filter(m => m.tipo !== 'secao').length;
  const rehearsal = culto.ensaioData ? parseISO(culto.ensaioData).toLocaleDateString('pt-BR', {day:'numeric',month:'short'}) + (culto.ensaioHora ? ' · ' + culto.ensaioHora : '') : 'A combinar';
  return `<article class="agenda-card ${featured ? 'agenda-card-next' : ''}">
    ${featured ? `<div class="featured-label"><span class="live-dot"></span> PRÓXIMO NA AGENDA <span class="featured-caption">Um encontro para servir.</span></div>` : ''}
    <div class="agenda-card-main">
      <div class="agenda-date"><span>${month}</span><strong>${date.getDate()}</strong><span>${dias[date.getDay()].slice(0,3)}</span></div>
      <div class="agenda-card-content"><p class="agenda-when">${dias[date.getDay()]} <span>·</span> ${esc(culto.hora || 'Horário a definir')}</p><h3>${esc(culto.nome)}</h3>${theme ? `<p class="agenda-theme">${esc(theme.nome)}</p>` : ''}<p class="agenda-leader">${group ? esc(group.nome) : leader ? `Louvor com ${esc(leader.nome)}` : 'Responsável pelo louvor a definir'}</p></div>
      <div class="agenda-card-action"><span class="service-status ${status.classe}">${status.texto}</span><button class="${featured ? 'btn-fill' : 'btn-outline'}" data-action="abrir-culto" data-culto="${esc(culto.id)}">Ver culto ${icon('arrow')}</button></div>
    </div>
    ${featured ? `<div class="featured-preparation"><div>${icon('people')}<span><small>EQUIPE DE LOUVOR</small><strong>${group ? esc(group.nome) : `${confirmed} de ${slots.length} confirmados`}</strong></span></div><div>${icon('order')}<span><small>ORDEM DO CULTO</small><strong>${moments ? `${moments} momentos preparados` : 'Ainda não preparada'}</strong></span></div><div>${icon('clock')}<span><small>PRÓXIMO ENSAIO</small><strong>${esc(rehearsal)}</strong></span></div></div>` : ''}
  </article>`;
}
