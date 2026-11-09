// Publish only information needed to consult the agenda, never the people registry.
export function publicAgenda(source = {}) {
  const pick = (value, keys) => Object.fromEntries(keys.filter(k => value[k] !== undefined).map(k => [k, value[k]]));
  const cultos = (source.cultos || []).map(c => ({
    ...pick(c, ['id','nome','data','hora','tipoCultoId','temaId','ministranteId','grupoMusicalId','ensaioData','ensaioHora']),
    slots: (c.slots || []).map(s => pick(s, ['id','tipo','instrumento','naipeAlvo','membroId','status'])),
    programa: (c.programa || []).map(i => ({...pick(i, ['id','tipo','titulo','hora','nome','responsavel']), musicas: [...(i.musicas || [])]})),
    organizacao: pick(c.organizacao || {}, ['ministerio','local','anciao','diaconos','diaconisas','recepcao','sonoplastia','transmissao'])
  }));
  const ids = new Set(cultos.flatMap(c => [c.ministranteId, ...c.slots.map(s => s.membroId)]));
  return { versao: 1, cultos, membros: (source.membros || []).filter(m => ids.has(m.id)).map(m => pick(m,['id','nome'])),
    gruposMusicais: (source.gruposMusicais || []).filter(g => cultos.some(c => c.grupoMusicalId === g.id)).map(g => pick(g,['id','nome'])),
    temasCulto: (source.temasCulto || []).filter(t => cultos.some(c => c.temaId === t.id)).map(t => pick(t,['id','nome'])),
    tiposCulto: [], modelosPrograma: [], cultosRemovidos: [] };
}
