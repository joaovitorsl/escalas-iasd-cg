import { icon, renderServiceCard } from "./ui/agenda.js";
// Local previews never connect to the church's shared database.
const LOCAL_PREVIEW = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
let setDoc, onSnapshot, docRef;
if (!LOCAL_PREVIEW) {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js");
  const firestore = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
  setDoc = firestore.setDoc;
  onSnapshot = firestore.onSnapshot;

  const firebaseConfig = {
  apiKey: "AIzaSyCjs-et-tcz6ggSxQ54TZOpvpXQLJ2p-NI",
  authDomain: "escala-central-745a9.firebaseapp.com",
  projectId: "escala-central-745a9",
  storageBucket: "escala-central-745a9.firebasestorage.app",
  messagingSenderId: "926450456877",
  appId: "1:926450456877:web:f4ff8ec7a1455e29fe5ba4"
  };

  const app = initializeApp(firebaseConfig);
  docRef = firestore.doc(firestore.getFirestore(app), "iasd_cg", "estado_global");
}

// A single service connects its agenda, worship team, departments and order.
// Localhost uses only browser storage. Production retains the existing Firestore document.
const STORAGE_KEY = "viverLouvarEscalas.v1";
const WEEKS_AHEAD = 8;

const INSTRUMENTOS = [
  { id: "piano", nome: "Piano" },
  { id: "violao", nome: "Violão" },
  { id: "guitarra", nome: "Guitarra" },
  { id: "baixo", nome: "Baixo" },
  { id: "bateria", nome: "Bateria" },
  { id: "cajon", nome: "Cajón" },
];
/* só esses vêm por padrão em cultos novos — os demais ficam disponíveis
   no "+ instrumento" de cada culto, pra adicionar sob demanda */
const INSTRUMENTOS_PADRAO = ["piano", "violao"];
const NAIPES = ["barítono/baixo", "tenor", "contralto", "soprano"];
const NIVEIS_HABILIDADE = [
  { id: "iniciante", nome: "Iniciante" },
  { id: "intermediario", nome: "Intermediário" },
  { id: "avancado", nome: "Avançado" },
];
const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const STATUS_LABEL = { aberto: "Aberto", convidado: "A confirmar", confirmado: "Confirmado", recusado: "Não pode" };

/* modelos padrão de programa (ordem do culto), um por tipo de culto recorrente */
const PROGRAMA_LEGADO = {
  "dom-noite": [
    { hora: "19:00", nome: "Louvores Congregacionais", responsavel: "", musicas: ["Há Um Amigo (HASD 323)", "Jesus é Melhor (HASD 321)", "Mais Semelhante a Jesus (HASD 400)"] },
    { hora: "19:15", nome: "Dízimos e Oferta", responsavel: "", musicas: ["Música de Fundo"] },
    { hora: "19:20", nome: "Louvor Congregacional", responsavel: "", musicas: ["Perto de Jesus (HASD 402)"] },
    { hora: "19:25", nome: "Pregação", responsavel: "Pr. Paulo", musicas: [] },
    { hora: "19:55", nome: "Louvor Final", responsavel: "", musicas: ["A Ele a Glória"] },
    { hora: "20:00", nome: "Oração Final", responsavel: "Pr. Paulo", musicas: [] },
    { hora: "20:02", nome: "Música de Saída", responsavel: "", musicas: ["Permaneça em mim"] },
  ],
  "qua-noite": [
    { hora: "19:00", nome: "Louvores Congregacionais", responsavel: "", musicas: ["Mãos (NHA 263)", "Fiel a Toda Prova (NHA 288)", "Fortes (Ministério Jovem)"] },
    { hora: "19:15", nome: "Dízimos e Oferta", responsavel: "", musicas: ["Fundo Musical"] },
    { hora: "19:20", nome: "Momento de Oração", responsavel: "", musicas: ["Fundo Musical"] },
    { hora: "19:35", nome: "Pregação", responsavel: "Leonardo", musicas: [] },
    { hora: "19:55", nome: "Louvor Especial", responsavel: "Iran Edson", musicas: ["Eu Não me Esqueci de Ti"] },
    { hora: "20:00", nome: "Oração Final", responsavel: "Leonardo", musicas: [] },
  ],
  "sab-manha": [
    { secao: "1ª Parte Escola Sabatina" },
    { hora: "08:45", nome: "Louvor Congregacional", responsavel: "Ministério Jovem", musicas: ["Brilhar Por Ti (NHA 240)", "Sua Glória (NHA 563)", "De Hoje em Diante (NHA 394)"] },
    { hora: "09:00", nome: "Boas Vindas", responsavel: "", musicas: [] },
    { hora: "09:03", nome: "Hino Inicial", responsavel: "Ministério Jovem", musicas: ["Tudo por Ele"] },
    { hora: "09:07", nome: "Oração Inicial", responsavel: "", musicas: [] },
    { hora: "09:10", nome: "Informativo", responsavel: "", musicas: [] },
    { hora: "09:14", nome: "Oração pelo Estudo da Lição", responsavel: "", musicas: [] },
    { secao: "Estudo da Lição" },
    { secao: "2ª Parte Escola Sabatina" },
    { hora: "10:00", nome: "Hino Final", responsavel: "Coral UNASP-EC", musicas: ["Faz Chover (Acústico)"] },
    { hora: "", nome: "Oração Final", responsavel: "", musicas: [] },
    { secao: "Culto" },
    { hora: "10:05", nome: "Avisos", responsavel: "Cosme Alexandre", musicas: [] },
    { hora: "10:10", nome: "Momento da Saúde", responsavel: "", musicas: ["Vídeo"] },
    { hora: "10:15", nome: "Momento da Família", responsavel: "Walmo e Samara", musicas: ["Cesta Espiritual"] },
    { hora: "10:20", nome: "Hino de Invocação", responsavel: "Gabriel Guedes", musicas: ["Santo Pra Sempre*"] },
    { hora: "10:23", nome: "Oração", responsavel: "", musicas: [] },
    { hora: "10:25", nome: "Provai e Vede", responsavel: "", musicas: ["Vídeo"] },
    { hora: "10:30", nome: "Dízimos e Ofertas", responsavel: "Adoradores 1", musicas: ["Entrego Minha Vida"] },
    { hora: "10:38", nome: "Adoração Infantil", responsavel: "", musicas: ["É Bom Ter Jesus no Coração (NHA 543)"] },
    { hora: "10:55", nome: "Louvores Congregacionais", responsavel: "", musicas: ["Mil Versos (Coral Jovem UNASP)", "Eu Quero Mais (Celebra SP)"] },
    { hora: "11:05", nome: "Oração de Consagração", responsavel: "Ancião", musicas: [] },
    { hora: "11:10", nome: "Louvor Especial", responsavel: "Jullyanner", musicas: ["Vou Testemunhar (Sonete)"] },
    { hora: "11:15", nome: "Pregação", responsavel: "Janaína", musicas: [] },
    { hora: "11:45", nome: "Louvor Final", responsavel: "Jullyanner", musicas: ["Entrego a Ti (Rafaela Pinho)"] },
    { hora: "11:50", nome: "Oração Final", responsavel: "Janaína", musicas: [] },
    { hora: "", nome: "Hino de Saída", responsavel: "Ministério Jovem", musicas: ["Cada Dia Mais Perto (NHA 459)"] },
  ],
};

// Keep the legacy seed only to recognize untouched example songs in saved templates.
// Empty strings preserve one editable field per song, including three-song moments.
const PROGRAMA_PADRAO = Object.fromEntries(Object.entries(PROGRAMA_LEGADO).map(([id, itens]) => [
  id, itens.map(item => item.secao ? { ...item } : { ...item, musicas: item.musicas.map(() => "") })
]));
function musicasDoModelo(m, item) {
  const musicas = Array.isArray(item.musicas) ? item.musicas : [];
  const exemplo = (PROGRAMA_LEGADO[m.id] || []).find(ref => !ref.secao && ref.nome === item.nome && ref.hora === item.hora && JSON.stringify(ref.musicas) === JSON.stringify(musicas));
  return exemplo ? musicas.map(() => "") : [...musicas];
}

const NOMES_MODELO_PADRAO = {
  "dom-noite": "Domingo à Noite",
  "qua-noite": "Quarta à Noite",
  "sab-manha": "Sábado de Manhã",
};

/* só cultos até esta data nascem com o programa já preenchido (conteúdo real,
   com nomes/músicas de quem já está combinado) — depois disso o time ainda
   não sabe o que vai rolar, então o culto nasce com o programa "zerado" e é
   preenchido conforme a data se aproxima. Cultos que já tinham sido gerados
   além dessa data com o programa padrão (por engano, antes dessa correção)
   são limpos automaticamente na normalização — mas só se ninguém já tiver
   editado o conteúdo (ver programaIgualAoModelo), pra nunca apagar edição
   manual de verdade. */
const HORIZONTE_PROGRAMA_ATE_ISO = "2026-08-01";

function nomeInstrumento(id) {
  return INSTRUMENTOS.find((i) => i.id === id)?.nome || id;
}
function nomeNivel(id) {
  return NIVEIS_HABILIDADE.find((n) => n.id === id)?.nome || id;
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ── datas (sempre em horário local, evita off-by-one por fuso) ── */
function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function formatISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function todayISO() {
  return formatISO(new Date());
}
function formatDataLonga(iso) {
  const s = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "long" }).format(parseISO(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatDataCurta(iso) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(parseISO(iso));
}
function nextDatesForWeekday(weekday, fromDate, count) {
  const dates = [];
  const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
  for (let i = 0; i < count; i++) {
    dates.push(formatISO(d));
    d.setDate(d.getDate() + 7);
  }
  return dates;
}
function datesForWeekdayUntil(weekday, fromDate, ateISO) {
  const dates = [];
  const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
  while (formatISO(d) <= ateISO) {
    dates.push(formatISO(d));
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

/* ── modelo / defaults ── */
function defaultTiposCulto() {
  return [
    { id: "dom-noite", nome: "Domingo à Noite", diaSemana: 0, hora: "19:00", modeloProgramaId: "dom-noite" },
    { id: "qua-noite", nome: "Quarta à Noite", diaSemana: 3, hora: "19:00", modeloProgramaId: "qua-noite" },
    { id: "sab-manha", nome: "Sábado de Manhã", diaSemana: 6, hora: "08:45", modeloProgramaId: "sab-manha" },
  ];
}
/* horários errados usados como default até essa correção — qualquer tipo de
   culto ou culto já gerado que ainda tenha exatamente esse valor "de fábrica"
   é corrigido automaticamente na normalização (edições manuais do usuário
   pra outros valores não são mexidas) */
const HORAS_ANTIGAS_INCORRETAS = { "dom-noite": "19:30", "qua-noite": "19:30", "sab-manha": "09:00" };
const HORAS_CORRETAS = { "dom-noite": "19:00", "qua-noite": "19:00", "sab-manha": "08:45" };
function defaultTemasCulto() {
  return [
    { id: "santa-ceia", nome: "Santa Ceia" },
    { id: "semana-jovem", nome: "Semana Jovem" },
    { id: "gojep", nome: "GOJEP" },
    { id: "quebrando-silencio", nome: "Quebrando o Silêncio" },
    { id: "mordomia", nome: "Mordomia" },
    { id: "13-sabado", nome: "13º Sábado" },
  ];
}
/* modelos de programa são dados-do-usuário editáveis (CRUD em Configurações),
   mas nascem semeados a partir dos 3 modelos padrão acima */
function defaultModelosPrograma() {
  return Object.keys(PROGRAMA_PADRAO).map((id) => ({
    id,
    nome: NOMES_MODELO_PADRAO[id] || id,
    itens: PROGRAMA_PADRAO[id].map((item) =>
      item.secao
        ? { id: uid(), tipo: "secao", titulo: item.secao }
        : { id: uid(), tipo: "momento", hora: item.hora, nome: item.nome, responsavel: item.responsavel, musicas: [...item.musicas] }
    ),
  }));
}
function defaultSlots() {
  return [
    ...INSTRUMENTOS.filter((i) => INSTRUMENTOS_PADRAO.includes(i.id)).map((i) => ({ id: uid(), tipo: "instrumento", instrumento: i.id, membroId: null, status: "aberto" })),
    ...NAIPES.map((n) => ({ id: uid(), tipo: "vocal", naipeAlvo: n, membroId: null, status: "aberto" })),
  ];
}
/* usado depois que `state` já existe (geração de próximos cultos, culto
   especial novo) — lê os modelos editáveis em state.modelosPrograma, não a
   constante PROGRAMA_PADRAO (essa só serve de semente inicial) */
function defaultPrograma(modeloId) {
  const modelo = state.modelosPrograma.find((m) => m.id === modeloId);
  if (!modelo) return [];
  return modelo.itens.map((item) =>
    item.tipo === "secao"
      ? { id: uid(), tipo: "secao", titulo: item.titulo }
      : { id: uid(), tipo: "momento", hora: item.hora, nome: item.nome, responsavel: item.responsavel, musicas: [...(item.musicas || [])] }
  );
}
/* de qual modelo um culto deveria "voltar ao padrão" (botão Limpar programa):
   especiais guardam o modelo escolhido na criação; recorrentes derivam do
   tipo de culto (mesmo que não tenham o campo salvo, ex: cultos antigos) */
function modeloIdDoCulto(culto) {
  if (culto.modeloProgramaId) return culto.modeloProgramaId;
  if (culto.tipoCultoId) {
    const tipo = state.tiposCulto.find((t) => t.id === culto.tipoCultoId);
    return (tipo && tipo.modeloProgramaId) || culto.tipoCultoId;
  }
  return null;
}
function chaveRemovido(tipoCultoId, data) {
  return tipoCultoId + "|" + data;
}

/* normaliza dados vindos de localStorage/arquivo importado — preenche
   campos que não existiam em versões anteriores do app, sem quebrar
   o que já foi salvo */
function normalizarMembro(m) {
  return {
    id: m.id,
    nome: m.nome,
    genero: m.genero === "F" ? "F" : "M",
    instrumentos: Array.isArray(m.instrumentos) ? m.instrumentos : [],
    nivelInstrumentos: m.nivelInstrumentos && typeof m.nivelInstrumentos === "object" ? { ...m.nivelInstrumentos } : {},
    vocal: !!m.vocal,
    naipe: m.naipe || null,
    ativo: m.ativo !== false,
    indisponibilidades: Array.isArray(m.indisponibilidades) ? m.indisponibilidades : [],
    diasIndisponiveis: Array.isArray(m.diasIndisponiveis) ? m.diasIndisponiveis : [],
    gostaDeSolo: !!m.gostaDeSolo,
    podeMinistrar: !!m.podeMinistrar,
    externo: !!m.externo,
    contato: m.contato || "",
    observacoes: m.observacoes || "",
  };
}
function normalizarGrupoMusical(g) {
  return { id: g.id, nome: g.nome || "Grupo sem nome", observacoes: g.observacoes || "" };
}
function normalizarTema(t) {
  return { id: t.id, nome: t.nome || "Tema sem nome" };
}
function normalizarModeloPrograma(m) {
  return {
    id: m.id,
    nome: m.nome || "Modelo sem nome",
    itens: Array.isArray(m.itens)
      ? m.itens.map((item) =>
          item.tipo === "secao"
            ? { id: item.id || uid(), tipo: "secao", titulo: item.titulo || "" }
            : {
                id: item.id || uid(),
                tipo: "momento",
                hora: item.hora || "",
                nome: item.nome || "",
                responsavel: item.responsavel || "",
                musicas: musicasDoModelo(m, item),
              }
        )
      : [],
  };
}
/* compara o programa atual de um culto com o modelo de origem, item a item
   (ignorando os ids, que são gerados de novo a cada cópia) — usado só pra
   saber se um programa distante ainda é "o padrão intocado" (pode ser
   zerado com segurança) ou já foi editado por alguém (não mexe) */
function programaIgualAoModelo(programa, modelo) {
  if (!modelo) return false;
  const base = modelo.itens || [];
  if (!programa || programa.length !== base.length) return false;
  return programa.every((item, idx) => {
    const ref = base[idx];
    if (!ref || item.tipo !== ref.tipo) return false;
    if (item.tipo === "secao") return (item.titulo || "") === (ref.titulo || "");
    return (
      (item.hora || "") === (ref.hora || "") &&
      (item.nome || "") === (ref.nome || "") &&
      (item.responsavel || "") === (ref.responsavel || "") &&
      JSON.stringify(item.musicas || []) === JSON.stringify(ref.musicas || [])
    );
  });
}
function normalizarEstado(bruto) {
  bruto = bruto || {};
  // computado localmente (não lê o `state` global, que ainda não existe
  // enquanto normalizarEstado constrói o próprio estado) — usado só aqui
  // pra semear o programa de cultos antigos sem recurso de "programa" ainda
  const modelosPrograma =
    bruto.modelosPrograma && bruto.modelosPrograma.length ? bruto.modelosPrograma.map(normalizarModeloPrograma) : defaultModelosPrograma();
  function programaDoModelo(modeloId) {
    const modelo = modelosPrograma.find((m) => m.id === modeloId);
    if (!modelo) return [];
    return modelo.itens.map((item) =>
      item.tipo === "secao"
        ? { id: uid(), tipo: "secao", titulo: item.titulo }
        : { id: uid(), tipo: "momento", hora: item.hora, nome: item.nome, responsavel: item.responsavel, musicas: [...(item.musicas || [])] }
    );
  }

  const tiposCulto = bruto.tiposCulto && bruto.tiposCulto.length ? bruto.tiposCulto : defaultTiposCulto();
  tiposCulto.forEach((t) => {
    if (HORAS_ANTIGAS_INCORRETAS[t.id] && t.hora === HORAS_ANTIGAS_INCORRETAS[t.id]) {
      t.hora = HORAS_CORRETAS[t.id];
    }
    // tipos de culto antigos não tinham modelo de programa explícito — usavam
    // o próprio id como referência implícita (era assim que PROGRAMA_PADRAO
    // era indexado antes dos modelos virarem editáveis)
    if (!t.modeloProgramaId) t.modeloProgramaId = t.id;
  });

  const cultos = (bruto.cultos || []).map((c) => ({
    ministranteId: null,
    especial: false,
    grupoMusicalId: null,
    temaId: null,
    modeloProgramaId: null,
    ...c,
    programa: Array.isArray(c.programa) ? c.programa : [],
    ensaioData: c.ensaioData || "",
    ensaioHora: c.ensaioHora || "",
  }));
  cultos.forEach((c) => {
    if (!c.especial && c.tipoCultoId) {
      const tipo = tiposCulto.find((t) => t.id === c.tipoCultoId);
      const modeloId = (tipo && tipo.modeloProgramaId) || c.tipoCultoId;
      const modelo = modelosPrograma.find((m) => m.id === modeloId);
      if (c.data > HORIZONTE_PROGRAMA_ATE_ISO) {
        // limpeza pontual: culto distante que ainda está com o programa
        // padrão intocado (gerado em massa por engano antes dessa correção)
        // volta a ficar zerado — edições manuais nunca são mexidas aqui
        if (c.programa.length && programaIgualAoModelo(c.programa, modelo)) {
          c.programa = [];
        }
      } else if (!c.programa.length) {
        // cultos criados antes do recurso de "programa" existir (ou vindos de
        // um arquivo antigo) ficam com programa vazio — preenche com o
        // modelo padrão do tipo de culto, já que estão dentro do horizonte
        c.programa = programaDoModelo(modeloId);
      }
    }
    if (c.tipoCultoId && HORAS_ANTIGAS_INCORRETAS[c.tipoCultoId] && c.hora === HORAS_ANTIGAS_INCORRETAS[c.tipoCultoId]) {
      c.hora = HORAS_CORRETAS[c.tipoCultoId];
    }
  });

  return {
    versao: 1,
    membros: (bruto.membros || []).map(normalizarMembro),
    tiposCulto,
    cultos,
    cultosRemovidos: Array.isArray(bruto.cultosRemovidos) ? bruto.cultosRemovidos : [],
    gruposMusicais: Array.isArray(bruto.gruposMusicais) ? bruto.gruposMusicais.map(normalizarGrupoMusical) : [],
    temasCulto: bruto.temasCulto && bruto.temasCulto.length ? bruto.temasCulto.map(normalizarTema) : defaultTemasCulto(),
    modelosPrograma,
  };
}
function novoEstado() {
  return normalizarEstado({});
}

/* ── estado em memória ── */
let state = novoEstado();
let activeTab = "escalas";
let detalheSecao = "louvor";
let editandoCulto = false;
let syncStatus = LOCAL_PREVIEW ? "local" : "loading";
const CAMPOS_CULTO = [
  ["ministerio", "Ministério responsável"], ["local", "Local"],
  ["anciao", "Ancião"], ["diaconos", "Diáconos"],
  ["diaconisas", "Diaconisas"], ["recepcao", "Recepção"],
  ["sonoplastia", "Sonoplastia"], ["transmissao", "Transmissão"],
  ["observacoes", "Orientações para a equipe"],
];
let viewMode = "lista"; // "lista" | "calendario"
let calMes = null; // Date do 1º dia do mês exibido no calendário
let fileHandle = null;
let fileName = null;
let dirty = false;
let lastSavedAt = null;
let cultoFiltroId = null; // quando setado, a lista mostra só esse culto (vindo de um clique no calendário)
const suggestOpen = new Set();
const programaAberto = new Set();
const programaAutoAberto = new Set(); // cultos cujo programa já foi auto-aberto por causa do "ao vivo" (não força de novo se a pessoa fechar)

/* ── persistência local ── */
function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.membros) && Array.isArray(parsed.cultos) && Array.isArray(parsed.tiposCulto)) {
        return normalizarEstado(parsed);
      }
    }
  } catch (e) {
    console.warn("Falha ao ler dados salvos neste navegador", e);
  }
  return novoEstado();
}
/* escrever no Firestore a cada tecla digitada fazia o onSnapshot dessa mesma
   escrita voltar e forçar um render() completo a cada caractere — no celular
   isso reconstrói o campo que a pessoa está digitando e derruba o teclado.
   Por isso: guarda local é imediato (síncrono), e o envio pra nuvem é
   agrupado (debounce) — só sai de fato ~700ms depois da última mudança. */
const FIRESTORE_DEBOUNCE_MS = 700;
let firestoreDebounceTimer = null;
let localWriteSeq = 0;
let ultimoSeqEnviado = -1;

function persistLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Falha ao guardar neste navegador", e);
  }
  if (LOCAL_PREVIEW) { updateSaveStatus(); return; }
  syncStatus = "pending";
  updateSaveStatus();
  clearTimeout(firestoreDebounceTimer);
  firestoreDebounceTimer = setTimeout(enviarParaNuvem, FIRESTORE_DEBOUNCE_MS);
}
async function enviarParaNuvem() {
  firestoreDebounceTimer = null;
  const seq = ++localWriteSeq;
  ultimoSeqEnviado = seq;
  try {
    await setDoc(docRef, { ...state, _seq: seq });
    if (seq === ultimoSeqEnviado && !firestoreDebounceTimer) syncStatus = "saved";
    updateSaveStatus();
  } catch (e) {
    syncStatus = "error";
    updateSaveStatus();
    console.error("Erro ao salvar na nuvem: ", e);
  }
}
function markDirty() {
  dirty = true;
  persistLocal();
  updateSaveStatus();
}

const supportsFS = "showSaveFilePicker" in window;

async function abrirArquivo() {
  try {
    if (supportsFS) {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: "Escalas (JSON)", accept: { "application/json": [".json"] } }],
      });
      const file = await handle.getFile();
      const texto = await file.text();
      if (!aplicarJsonImportado(texto)) return;
      fileHandle = handle;
      fileName = handle.name;
      updateSaveStatus();
    } else {
      document.getElementById("fileInput").click();
    }
  } catch (e) {
    if (e.name !== "AbortError") console.error(e);
  }
}

document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const texto = await file.text();
  if (aplicarJsonImportado(texto)) {
    fileHandle = null;
    fileName = file.name;
    updateSaveStatus();
  }
});

function aplicarJsonImportado(texto) {
  try {
    const parsed = JSON.parse(texto);
    if (!parsed || !Array.isArray(parsed.membros) || !Array.isArray(parsed.cultos)) {
      alert("Arquivo inválido: não parece ser um arquivo de escalas.");
      return false;
    }
    if (!confirm(LOCAL_PREVIEW ? "Restaurar esta cópia? Isso substitui os dados desta prévia local." : "Restaurar esta cópia? Isso substitui a agenda compartilhada de toda a equipe.")) {
      return false;
    }
    state = normalizarEstado(parsed);
    dirty = false;
    lastSavedAt = null;
    persistLocal();
    render();
    return true;
  } catch (e) {
    alert("Não foi possível ler o arquivo: " + e.message);
    return false;
  }
}

async function salvar() {
  const texto = JSON.stringify(state, null, 2);
  if (supportsFS) {
    try {
      if (!fileHandle) {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: "escalas-iasd-cg.json",
          types: [{ description: "Escalas (JSON)", accept: { "application/json": [".json"] } }],
        });
        fileName = fileHandle.name;
      }
      const writable = await fileHandle.createWritable();
      await writable.write(texto);
      await writable.close();
      dirty = false;
      lastSavedAt = new Date();
      updateSaveStatus();
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
      console.error(e);
      /* segue para o fallback de download abaixo */
    }
  }
  baixarCopia();
  dirty = false;
  lastSavedAt = new Date();
  updateSaveStatus();
}

function baixarTextoComoArquivo(texto, nomeArquivo, tipoMime) {
  const blob = new Blob([texto], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function baixarCopia() {
  baixarTextoComoArquivo(JSON.stringify(state, null, 2), fileName || "escalas-iasd-cg.json", "application/json");
}

/* ── import/export de programa via CSV ──
   pensado pra um fluxo tipo "manda uma foto ou PDF do programa impresso pra
   uma IA, pede pra ela preencher esse CSV no mesmo formato, e importa aqui"
   — evita digitar tudo à mão. Colunas fixas, na ordem:
   Tipo (secao|momento), Hora, Momento/Título, Responsável, Músicas
   (várias músicas na mesma célula, separadas por " | "). */
const CSV_CABECALHO = ["Tipo", "Hora", "Momento", "Responsável", "Músicas"];

function csvEscapeCelula(valor) {
  const s = String(valor ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function programaParaCsv(itens) {
  const linhas = [CSV_CABECALHO.join(",")];
  (itens || []).forEach((item) => {
    if (item.tipo === "secao") {
      linhas.push(["secao", "", item.titulo || "", "", ""].map(csvEscapeCelula).join(","));
    } else {
      linhas.push(
        ["momento", item.hora || "", item.nome || "", item.responsavel || "", (item.musicas || []).join(" | ")]
          .map(csvEscapeCelula)
          .join(",")
      );
    }
  });
  return linhas.join("\r\n");
}
function parseCsvLinha(linha) {
  const celulas = [];
  let atual = "";
  let dentroAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (dentroAspas) {
      if (c === '"' && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else if (c === '"') {
        dentroAspas = false;
      } else {
        atual += c;
      }
    } else if (c === '"') {
      dentroAspas = true;
    } else if (c === ",") {
      celulas.push(atual);
      atual = "";
    } else {
      atual += c;
    }
  }
  celulas.push(atual);
  return celulas;
}
function csvParaPrograma(texto) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim().length);
  if (!linhas.length) return [];
  // pula a linha de cabeçalho, se a 1ª célula for literalmente "tipo"
  const inicio = /^tipo$/i.test((parseCsvLinha(linhas[0])[0] || "").trim()) ? 1 : 0;
  const itens = [];
  for (let i = inicio; i < linhas.length; i++) {
    const [tipo, hora, nome, responsavel, musicas] = parseCsvLinha(linhas[i]);
    if ((tipo || "").trim().toLowerCase() === "secao") {
      itens.push({ id: uid(), tipo: "secao", titulo: (nome || "").trim() });
    } else {
      itens.push({
        id: uid(),
        tipo: "momento",
        hora: (hora || "").trim(),
        nome: (nome || "").trim(),
        responsavel: (responsavel || "").trim(),
        musicas: (musicas || "").split("|").map((s) => s.trim()).filter(Boolean),
      });
    }
  }
  return itens;
}
const CSV_EXEMPLO_PADRAO = [{ id: uid(), tipo: "momento", hora: "19:00", nome: "Nome do momento", responsavel: "", musicas: ["Música 1", "Música 2"] }];
/* pra baixar: usa o programa/itens atuais como base (assim já sai preenchido
   pra uma IA só completar o que falta); se ainda estiver vazio, manda um
   exemplo mínimo só pra mostrar o formato esperado */
function csvModeloParaCulto(culto) {
  if (culto.programa && culto.programa.length) return culto.programa;
  const modeloId = modeloIdDoCulto(culto);
  return modeloId ? defaultPrograma(modeloId) : CSV_EXEMPLO_PADRAO;
}

let csvImportAlvo = null; // { tipo: "culto"|"modelo", id }
document.getElementById("csvInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  const alvo = csvImportAlvo;
  csvImportAlvo = null;
  if (!file || !alvo) return;
  const texto = await file.text();
  const itens = csvParaPrograma(texto);
  if (!itens.length) {
    alert("Não encontrei nenhuma linha válida nesse CSV.");
    return;
  }
  if (alvo.tipo === "culto") {
    const culto = state.cultos.find((c) => c.id === alvo.id);
    if (culto && confirm(`Importar ${itens.length} linha(s) e substituir o programa atual deste culto?`)) {
      culto.programa = itens;
      markDirty();
      render();
    }
  } else if (alvo.tipo === "modelo") {
    const modelo = state.modelosPrograma.find((m) => m.id === alvo.id);
    if (modelo && confirm(`Importar ${itens.length} linha(s) e substituir os itens deste modelo?`)) {
      modelo.itens = itens;
      markDirty();
      renderModelosPrograma();
    }
  }
});

function updateSaveStatus() {
  const el = document.getElementById("saveStatus");
  if (!el) return;
  const messages = {
    local: "Prévia local · dados só neste navegador",
    loading: "Conectando à agenda…",
    pending: "Salvando alterações…",
    saved: "Alterações salvas na nuvem",
    error: "Sem sincronização · confira sua conexão",
  };
  el.textContent = messages[syncStatus];
}

function carregarExemplo() {
  if (state.membros.length && !confirm("Isso vai adicionar pessoas de exemplo à equipe atual. Continuar?")) return;
  const exemplo = [
    { nome: "Ex: João Teclas", genero: "M", instrumentos: ["piano"], vocal: false, naipe: null, podeMinistrar: true },
    { nome: "Ex: Marcos Cordas", genero: "M", instrumentos: ["violao", "guitarra"], vocal: false, naipe: null, diasIndisponiveis: [3] },
    { nome: "Ex: Pedro Groove", genero: "M", instrumentos: ["baixo"], vocal: true, naipe: "barítono/baixo" },
    { nome: "Ex: Lucas Batera", genero: "M", instrumentos: ["bateria"], vocal: false, naipe: null },
    { nome: "Ex: Ana Voz", genero: "F", instrumentos: [], vocal: true, naipe: "soprano", gostaDeSolo: true },
    { nome: "Ex: Maria Contralto", genero: "F", instrumentos: ["piano"], vocal: true, naipe: "contralto", podeMinistrar: true },
    { nome: "Ex: Rafael Tenor", genero: "M", instrumentos: [], vocal: true, naipe: "tenor", diasIndisponiveis: [0] },
    { nome: "Ex: Carla Apoio", genero: "F", instrumentos: ["violao"], vocal: true, naipe: "soprano", gostaDeSolo: true },
    { nome: "Ex: Roberto Convidado", genero: "M", instrumentos: ["bateria"], vocal: false, naipe: null, externo: true },
  ];
  exemplo.forEach((m) =>
    state.membros.push(
      normalizarMembro({ id: uid(), ativo: true, indisponibilidades: [], observacoes: "pessoa de exemplo — edite ou remova", ...m })
    )
  );
  if (!state.gruposMusicais.length) {
    state.gruposMusicais.push(
      { id: uid(), nome: "Ex: Coral Jovem", observacoes: "grupo de exemplo — edite ou remova" },
      { id: uid(), nome: "Ex: Grupo Bless", observacoes: "grupo de exemplo — edite ou remova" }
    );
  }
  markDirty();
  render();
}

function limparTudo() {
  if (!confirm("Isso vai apagar todos os membros, cultos e configurações guardados neste navegador. Tem certeza?")) return;
  state = novoEstado();
  fileHandle = null;
  fileName = null;
  dirty = false;
  lastSavedAt = null;
  persistLocal();
  render();
  updateSaveStatus();
}

/* garante pelo menos até esta data (além da janela rolante normal de
   WEEKS_AHEAD) — pedido pra ter a temporada 2026 inteira já disponível */
const HORIZONTE_MINIMO_ISO = "2026-12-31";
/* a temporada 2026 começa numa data FIXA, não em "hoje" — do contrário,
   abrir o app depois de 26/07/2026 faria esse culto (e qualquer outro já
   "passado" da temporada) nunca ser gerado */
const HORIZONTE_INICIO_ISO = "2026-07-26";

/* ── geração automática dos próximos cultos recorrentes ── */
function ensureUpcomingCultos() {
  const hoje = new Date();
  const anchorHistorico = parseISO(HORIZONTE_INICIO_ISO);
  const fimJanelaRolante = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + WEEKS_AHEAD * 7);
  const ateISO = formatISO(fimJanelaRolante) > HORIZONTE_MINIMO_ISO ? formatISO(fimJanelaRolante) : HORIZONTE_MINIMO_ISO;
  let mudou = false;
  state.tiposCulto.forEach((tipo) => {
    // uma passada fixa cobrindo a temporada inteira (26/07 a 31/12/2026) +
    // uma passada rolante a partir de hoje (garante continuidade depois que
    // a temporada fixa acabar, sem depender de reabrir o app antes disso)
    const datas = new Set([
      ...datesForWeekdayUntil(tipo.diaSemana, anchorHistorico, HORIZONTE_MINIMO_ISO),
      ...datesForWeekdayUntil(tipo.diaSemana, hoje, ateISO),
    ]);
    datas.forEach((data) => {
      if (data < HORIZONTE_INICIO_ISO) return;
      if (state.cultosRemovidos.includes(chaveRemovido(tipo.id, data))) return;
      const existe = state.cultos.some((c) => c.tipoCultoId === tipo.id && c.data === data);
      if (!existe) {
        const modeloId = tipo.modeloProgramaId || tipo.id;
        state.cultos.push({
          id: uid(),
          tipoCultoId: tipo.id,
          data,
          hora: tipo.hora,
          nome: tipo.nome,
          especial: false,
          slots: defaultSlots(),
          // só preenche o programa de verdade dentro do horizonte próximo —
          // além disso o culto nasce zerado (ver HORIZONTE_PROGRAMA_ATE_ISO)
          programa: data <= HORIZONTE_PROGRAMA_ATE_ISO ? defaultPrograma(modeloId) : [],
          modeloProgramaId: modeloId,
          ensaioData: "",
          ensaioHora: "",
          ministranteId: null,
          grupoMusicalId: null,
          temaId: null,
        });
        mudou = true;
      }
    });
  });
  if (mudou) persistLocal();
}

/* ── elegibilidade, justiça e sorteio ponderado ── */
function memberHistory(membroId) {
  let timesServed = 0;
  let lastServedDate = null;
  for (const c of state.cultos) {
    if (c.slots.some((s) => s.membroId === membroId)) {
      timesServed++;
      if (!lastServedDate || c.data > lastServedDate) lastServedDate = c.data;
    }
  }
  return { timesServed, lastServedDate };
}

function rankCandidates(membros) {
  return membros
    .map((m) => ({ membro: m, ...memberHistory(m.id) }))
    .sort((a, b) => {
      // músicos externos/convidados (não são da igreja, só topam tapar buraco)
      // sempre por último, mesmo que "nunca escalados" os colocasse no topo
      if (!!a.membro.externo !== !!b.membro.externo) return a.membro.externo ? 1 : -1;
      if (!a.lastServedDate && b.lastServedDate) return -1;
      if (a.lastServedDate && !b.lastServedDate) return 1;
      if (a.lastServedDate !== b.lastServedDate) return a.lastServedDate < b.lastServedDate ? -1 : 1;
      return a.timesServed - b.timesServed;
    });
}

function weightedPick(ranked) {
  if (!ranked.length) return null;
  const pesos = ranked.map((_, i) => 1 / (i + 1));
  const total = pesos.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < ranked.length; i++) {
    r -= pesos[i];
    if (r <= 0) return ranked[i];
  }
  return ranked[ranked.length - 1];
}

function recencyLabel(dataISO) {
  if (!dataISO) return "nunca escalado(a)";
  const dias = Math.round((parseISO(todayISO()) - parseISO(dataISO)) / 86400000);
  if (dias === 0) return "escalado(a) neste dia";
  if (dias < 0) return `já escalado(a) em breve`;
  if (dias < 14) return `há ${dias} dia${dias === 1 ? "" : "s"}`;
  return `há ${Math.round(dias / 7)} semanas`;
}

function poolBaseParaSlot(culto, slot, excludeIds, permitirExterno) {
  const usadosNesteCulto = new Set(culto.slots.filter((s) => s.membroId && s.id !== slot.id).map((s) => s.membroId));
  const diaSemanaCulto = parseISO(culto.data).getDay();
  let pool = state.membros.filter((m) => {
    if (!m.ativo) return false;
    if (!permitirExterno && m.externo) return false;
    if (usadosNesteCulto.has(m.id)) return false;
    if (excludeIds.includes(m.id)) return false;
    if (m.indisponibilidades.includes(culto.data)) return false;
    if (m.diasIndisponiveis.includes(diaSemanaCulto)) return false;
    if (slot.tipo === "instrumento") return m.instrumentos.includes(slot.instrumento);
    return m.vocal; // vocal e solo dependem de cantar
  });
  if (slot.tipo === "vocal" && slot.naipeAlvo) {
    const porNaipe = pool.filter((m) => m.naipe === slot.naipeAlvo);
    if (porNaipe.length) pool = porNaipe;
  }
  if (slot.tipo === "solo") {
    const querSolo = pool.filter((m) => m.gostaDeSolo);
    if (querSolo.length) pool = querSolo;
  }
  return pool;
}

/* usado pelo sorteio automático e pelas sugestões de substituto: convidados
   externos NUNCA entram aqui — só aparecem se alguém escolher manualmente
   no dropdown (poolForSlotManual). Se sobrar vaga aberta, fica aberta mesmo. */
function poolForSlot(culto, slot, excludeIds = []) {
  return poolBaseParaSlot(culto, slot, excludeIds, false);
}

/* usado no dropdown manual: mostra todo mundo elegível (regulares + convidados),
   pra quem está escalando poder decidir na hora de tapar um buraco */
function poolForSlotManual(culto, slot) {
  return poolBaseParaSlot(culto, slot, [], true);
}

function comBalanceamentoGenero(culto, slot, pool) {
  if (slot.tipo !== "vocal" || slot.naipeAlvo) return pool;
  const contagem = { M: 0, F: 0 };
  culto.slots.forEach((s) => {
    if (s.tipo === "vocal" && s.membroId && s.id !== slot.id) {
      const m = state.membros.find((x) => x.id === s.membroId);
      if (m) contagem[m.genero] = (contagem[m.genero] || 0) + 1;
    }
  });
  const minoria = contagem.M <= contagem.F ? "M" : "F";
  const restrito = pool.filter((m) => m.genero === minoria);
  return restrito.length ? restrito : pool;
}

function prioridadeSlot(slot) {
  if (slot.tipo === "instrumento") return INSTRUMENTOS.findIndex((i) => i.id === slot.instrumento);
  if (slot.tipo === "vocal" && slot.naipeAlvo) return 10 + NAIPES.indexOf(slot.naipeAlvo);
  if (slot.tipo === "vocal") return 20;
  if (slot.tipo === "solo") return 25;
  return 30;
}

function assignedMemberIds(culto) {
  return Array.from(new Set(culto.slots.filter((s) => s.membroId).map((s) => s.membroId)));
}

function limparMinistranteSeInvalido(culto) {
  if (culto.ministranteId && !culto.slots.some((s) => s.membroId === culto.ministranteId)) {
    culto.ministranteId = null;
  }
}

function autoFillCulto(culto, { somenteAbertos = true } = {}) {
  const alvo = somenteAbertos ? ["aberto"] : ["aberto", "recusado"];
  const slots = [...culto.slots].sort((a, b) => prioridadeSlot(a) - prioridadeSlot(b));
  slots.forEach((slot) => {
    if (!alvo.includes(slot.status)) return;
    const excluir = slot.status === "recusado" && slot.membroId ? [slot.membroId] : [];
    let pool = poolForSlot(culto, slot, excluir);
    pool = comBalanceamentoGenero(culto, slot, pool);
    const escolhido = weightedPick(rankCandidates(pool));
    if (escolhido) {
      slot.membroId = escolhido.membro.id;
      slot.status = "convidado";
    } else {
      slot.membroId = null;
      slot.status = "aberto";
    }
  });
  limparMinistranteSeInvalido(culto);
  if (!culto.ministranteId) {
    const candidatos = assignedMemberIds(culto)
      .map((id) => state.membros.find((m) => m.id === id))
      .filter((m) => m && m.podeMinistrar);
    if (candidatos.length) culto.ministranteId = candidatos[Math.floor(Math.random() * candidatos.length)].id;
  }
  markDirty();
  render();
}

function suggestSubstitutes(culto, slot, limite = 5) {
  const excluir = slot.membroId ? [slot.membroId] : [];
  let pool = poolForSlot(culto, slot, excluir);
  pool = comBalanceamentoGenero(culto, slot, pool);
  return rankCandidates(pool).slice(0, limite);
}

function resumoPreenchimento(culto) {
  const totalInstr = culto.slots.filter((s) => s.tipo === "instrumento").length;
  const preenchidoInstr = culto.slots.filter((s) => s.tipo === "instrumento" && s.membroId).length;
  const totalVoz = culto.slots.filter((s) => s.tipo === "vocal").length;
  const preenchidoVoz = culto.slots.filter((s) => s.tipo === "vocal" && s.membroId).length;
  const totalSolo = culto.slots.filter((s) => s.tipo === "solo").length;
  const preenchidoSolo = culto.slots.filter((s) => s.tipo === "solo" && s.membroId).length;
  const temPianoOuViolao = culto.slots.some((s) => s.tipo === "instrumento" && (s.instrumento === "piano" || s.instrumento === "violao") && s.membroId);
  const aviso = temPianoOuViolao ? "" : ` · <span class="esc-warn">sem piano/violão</span>`;
  const soloTexto = totalSolo ? ` · ${preenchidoSolo}/${totalSolo} solo` : "";
  return `${preenchidoInstr}/${totalInstr} instrumentos · ${preenchidoVoz}/${totalVoz} vozes${soloTexto}${aviso}`;
}

function classeSaudeCulto(culto) {
  const status = statusLouvor(culto);
  return status.classe === "confirmed" ? "esc-cal-ok" : status.classe === "pending" ? "esc-cal-alerta" : "esc-cal-vazio";
}

/* ── render: Escalas · vaga individual ── */
function slotHtml(culto, slot) {
  const membroAtual = slot.membroId ? state.membros.find((m) => m.id === slot.membroId) : null;
  const label = slot.tipo === "instrumento" ? nomeInstrumento(slot.instrumento) : slot.tipo === "solo" ? "Solo / Música especial" : slot.naipeAlvo || "Voz (livre)";
  const ranked = rankCandidates(poolForSlotManual(culto, slot));

  let options = `<option value="">— vaga aberta —</option>`;
  const idsListados = new Set();
  ranked.forEach((r) => {
    idsListados.add(r.membro.id);
    const sel = r.membro.id === slot.membroId ? "selected" : "";
    const tagExterno = r.membro.externo ? " · convidado(a) externo(a)" : "";
    options += `<option value="${r.membro.id}" ${sel}>${escapeHtml(r.membro.nome)}${tagExterno} — ${recencyLabel(r.lastServedDate)}</option>`;
  });
  if (membroAtual && !idsListados.has(membroAtual.id)) {
    options += `<option value="${membroAtual.id}" selected>${escapeHtml(membroAtual.nome)} (fora da elegibilidade atual)</option>`;
  }

  const botoesStatus = ["convidado", "confirmado", "recusado"]
    .map(
      (st) =>
        `<button class="esc-status-btn ${slot.status === st ? "active" : ""}" data-action="status-slot" data-culto="${culto.id}" data-slot="${slot.id}" data-status="${st}" ${!slot.membroId ? "disabled" : ""}>${STATUS_LABEL[st]}</button>`
    )
    .join("");

  const suggestBtn =
    slot.status === "recusado"
      ? `<button class="esc-link" data-action="toggle-suggest" data-culto="${culto.id}" data-slot="${slot.id}">${suggestOpen.has(slot.id) ? "ocultar sugestões" : "sugerir substituto"}</button>`
      : "";
  const suggestBlock = suggestOpen.has(slot.id) ? suggestionsHtml(culto, slot) : "";

  return `
    <div class="esc-slot esc-slot-${slot.status}">
      <button class="esc-slot-remove" data-action="remove-slot" data-culto="${culto.id}" data-slot="${slot.id}" title="Remover vaga">×</button>
      <div class="esc-slot-label">${escapeHtml(label)}</div>
      <select aria-label="Pessoa para ${escapeHtml(label)}" data-action="assign-slot" data-culto="${culto.id}" data-slot="${slot.id}">${options}</select>
      <div class="esc-slot-status">${botoesStatus}</div>
      ${suggestBtn}
      ${suggestBlock}
    </div>`;
}

function suggestionsHtml(culto, slot) {
  const sugestoes = suggestSubstitutes(culto, slot);
  if (!sugestoes.length) {
    return `<div class="esc-suggest"><em>nenhum substituto elegível encontrado</em></div>`;
  }
  return `<div class="esc-suggest">
    <span class="esc-suggest-label">Sugestões (mais justo primeiro)</span>
    ${sugestoes
      .map(
        (s) =>
          `<button class="esc-suggest-btn" data-action="use-suggestion" data-culto="${culto.id}" data-slot="${slot.id}" data-membro="${s.membro.id}">${escapeHtml(s.membro.nome)} <em>(${recencyLabel(s.lastServedDate)})</em></button>`
      )
      .join("")}
  </div>`;
}

function temaSelectHtml(culto) {
  const opcoes = state.temasCulto
    .map((t) => `<option value="${t.id}" ${t.id === culto.temaId ? "selected" : ""}>${escapeHtml(t.nome)}</option>`)
    .join("");
  return `<div class="esc-ministra">
    <span class="esc-ministra-label">Tema do culto</span>
    <select data-action="set-tema" data-culto="${culto.id}">
      <option value="">— sem tema —</option>
      ${opcoes}
    </select>
  </div>`;
}

function ministranteSelectHtml(culto) {
  const membrosAtribuidos = assignedMemberIds(culto)
    .map((id) => state.membros.find((m) => m.id === id))
    .filter(Boolean)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  if (!membrosAtribuidos.length) {
    return `<div class="esc-ministra"><span class="esc-ministra-label">Quem conduz o louvor</span><em class="esc-ministra-vazio">escale alguém primeiro</em></div>`;
  }
  const opcoes = membrosAtribuidos
    .map((m) => `<option value="${m.id}" ${m.id === culto.ministranteId ? "selected" : ""}>${escapeHtml(m.nome)}${m.podeMinistrar ? " ★" : ""}</option>`)
    .join("");
  return `<div class="esc-ministra">
    <span class="esc-ministra-label">Quem conduz o louvor</span>
    <select data-action="set-ministrante" data-culto="${culto.id}">
      <option value="">— a definir —</option>
      ${opcoes}
    </select>
  </div>`;
}

/* ── "ao vivo": compara a hora atual com a hora de cada item do programa,
   só pro culto de hoje — destaca o que já rolou e o que deveria estar
   rolando agora, sem precisar abrir o programa manualmente durante o culto */
function horaParaMinutos(hhmm) {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function minutosAgora() {
  const agora = new Date();
  return agora.getHours() * 60 + agora.getMinutes();
}
function janelaCulto(culto) {
  const horasItens = (culto.programa || [])
    .filter((i) => i.tipo !== "secao")
    .map((i) => horaParaMinutos(i.hora))
    .filter((m) => m !== null);
  const inicio = horaParaMinutos(culto.hora) ?? horasItens[0] ?? 0;
  const ultimo = horasItens.length ? Math.max(...horasItens) : inicio;
  // pelo menos 1h de janela, e ao menos 20min depois do último item com hora
  const fim = Math.max(ultimo + 20, inicio + 60);
  return { inicio, fim };
}
function cultoEstaAoVivo(culto) {
  if (culto.data !== todayISO()) return false;
  const { inicio, fim } = janelaCulto(culto);
  const agora = minutosAgora();
  return agora >= inicio - 10 && agora <= fim;
}
function indiceItemAtualPrograma(culto) {
  const agora = minutosAgora();
  let atualIdx = -1;
  (culto.programa || []).forEach((item, idx) => {
    if (item.tipo === "secao") return;
    const m = horaParaMinutos(item.hora);
    if (m !== null && m <= agora) atualIdx = idx;
  });
  return atualIdx;
}

/* ── render: Escalas · programa (ordem do culto) ── */
function programaLinhaHtml(culto, item, idx, total, estadoTemporal) {
  const acoes = `
    <span class="esc-prog-linha-acoes">
      <button data-action="prog-subir" data-culto="${culto.id}" data-item="${item.id}" ${idx === 0 ? "disabled" : ""} title="Mover para cima">↑</button>
      <button data-action="prog-descer" data-culto="${culto.id}" data-item="${item.id}" ${idx === total - 1 ? "disabled" : ""} title="Mover para baixo">↓</button>
      <button data-action="prog-remover" data-culto="${culto.id}" data-item="${item.id}" class="esc-danger" title="Remover linha">×</button>
    </span>`;
  const classeTemporal = estadoTemporal ? ` esc-prog-${estadoTemporal}` : "";

  if (item.tipo === "secao") {
    return `
      <tr class="esc-prog-secao${classeTemporal}">
        <td colspan="4">
          <input type="text" class="esc-prog-secao-input" value="${escapeHtml(item.titulo)}" data-action="prog-titulo" data-culto="${culto.id}" data-item="${item.id}" />
        </td>
        <td>${acoes}</td>
      </tr>`;
  }
  return `
    <tr class="${classeTemporal.trim()}">
      <td><input type="text" class="esc-prog-hora" value="${escapeHtml(item.hora || "")}" placeholder="hh:mm" data-action="prog-hora" data-culto="${culto.id}" data-item="${item.id}" /></td>
      <td><input type="text" value="${escapeHtml(item.nome || "")}" placeholder="Momento" data-action="prog-nome" data-culto="${culto.id}" data-item="${item.id}" /></td>
      <td><input type="text" value="${escapeHtml(item.responsavel || "")}" placeholder="Responsável" data-action="prog-responsavel" data-culto="${culto.id}" data-item="${item.id}" /></td>
      <td>${musicasCelulaCultoHtml(culto, item)}</td>
      <td>${acoes}</td>
    </tr>`;
}

/* cada música vira sua própria linha (input + remover) em vez de um único
   textarea multi-linha — mais fácil de editar/apagar uma música específica,
   principalmente no celular */
function musicasCelulaCultoHtml(culto, item) {
  const linhas = (item.musicas || [])
    .map(
      (m, i) => `
    <div class="esc-musica-row">
      <input type="text" value="${escapeHtml(m)}" placeholder="Música" data-action="prog-musica-editar" data-culto="${culto.id}" data-item="${item.id}" data-musica="${i}" />
      <button data-action="prog-musica-remover" data-culto="${culto.id}" data-item="${item.id}" data-musica="${i}" title="Remover música">×</button>
    </div>`
    )
    .join("");
  return `<div class="esc-musicas-list">
    ${linhas}
    <button class="esc-link esc-musica-add" data-action="prog-musica-add" data-culto="${culto.id}" data-item="${item.id}">+ música</button>
  </div>`;
}

function programaTabelaHtml(culto) {
  const itens = culto.programa || [];
  const aoVivo = cultoEstaAoVivo(culto);
  const atualIdx = aoVivo ? indiceItemAtualPrograma(culto) : -1;
  const linhas = itens
    .map((item, idx) => {
      const estadoTemporal = !aoVivo ? null : idx === atualIdx ? "atual" : atualIdx >= 0 && idx < atualIdx ? "passado" : null;
      return programaLinhaHtml(culto, item, idx, itens.length, estadoTemporal);
    })
    .join("");
  return `
    <div class="esc-programa">
      <table class="esc-prog-tabela">
        <thead><tr><th>Hora</th><th>Momento</th><th>Responsável</th><th>Música(s)</th><th></th></tr></thead>
        <tbody>${linhas || `<tr><td colspan="5" class="esc-prog-vazio">Sem programa definido ainda.</td></tr>`}</tbody>
      </table>
      <div class="esc-prog-add">
        <button class="esc-link" data-action="prog-add-momento" data-culto="${culto.id}">+ momento</button>
        <button class="esc-link" data-action="prog-add-secao" data-culto="${culto.id}">+ seção</button>
        <button class="esc-link" data-action="prog-importar-csv" data-culto="${culto.id}">importar CSV</button>
        <button class="esc-link" data-action="prog-baixar-csv" data-culto="${culto.id}">baixar modelo CSV</button>
        <button class="esc-link esc-danger" data-action="limpar-programa" data-culto="${culto.id}">limpar programa (voltar ao padrão)</button>
      </div>
    </div>`;
}

function grupoMusicalSelectHtml(culto) {
  const opcoes = state.gruposMusicais
    .map((g) => `<option value="${g.id}" ${g.id === culto.grupoMusicalId ? "selected" : ""}>${escapeHtml(g.nome)}</option>`)
    .join("");
  return `<div class="esc-ministra">
    <span class="esc-ministra-label">Grupo musical</span>
    <select data-action="set-grupo-musical" data-culto="${culto.id}">
      <option value="">— time regular (escalar individualmente) —</option>
      ${opcoes}
    </select>
  </div>`;
}

function cultoEditorHtml(culto) {
  const aoVivo = cultoEstaAoVivo(culto);
  const especialTag = culto.especial ? `<span class="tag">especial</span>` : "";
  const vivoTag = aoVivo ? `<span class="tag esc-tag-vivo">Horário previsto do culto</span>` : "";
  const tema = culto.temaId ? state.temasCulto.find((t) => t.id === culto.temaId) : null;
  const temaTag = tema ? `<span class="tag">${escapeHtml(tema.nome)}</span>` : "";
  const grupo = culto.grupoMusicalId ? state.gruposMusicais.find((g) => g.id === culto.grupoMusicalId) : null;
  const temGrupo = !!culto.grupoMusicalId;

  const acoesEscala = temGrupo
    ? ""
    : `<button class="btn-outline esc-btn-sm" data-action="autofill" data-culto="${culto.id}">Sugerir equipe</button>
       <button class="btn-outline esc-btn-sm" data-action="reroll" data-culto="${culto.id}">Refazer sugestões</button>
       <button class="btn-outline esc-btn-sm" data-action="limpar-escala" data-culto="${culto.id}">Limpar escala</button>`;

  const corpoEscala = temGrupo
    ? `<div class="esc-grupo-aviso">Este culto é conduzido por <strong>${escapeHtml(grupo ? grupo.nome : "um grupo removido")}</strong> — sem escala individual de instrumentos/vozes. Escolha "time regular" acima pra voltar a escalar pessoa por pessoa.</div>`
    : `<div class="esc-slots-grid">
        ${culto.slots.map((slot) => slotHtml(culto, slot)).join("")}
      </div>
      <footer class="esc-culto-foot">
        <select class="esc-add-select" data-action="add-instrumento" data-culto="${culto.id}">
          <option value="">+ instrumento</option>
          ${INSTRUMENTOS.map((i) => `<option value="${i.id}">${i.nome}</option>`).join("")}
        </select>
        <select class="esc-add-select" data-action="add-vocal" data-culto="${culto.id}">
          <option value="">+ voz</option>
          <option value="__livre">Livre (sem naipe definido)</option>
          ${NAIPES.map((n) => `<option value="${n}">${n}</option>`).join("")}
        </select>
        <button class="esc-link" data-action="add-solo" data-culto="${culto.id}">+ solo</button>
        <span class="esc-culto-resumo">${resumoPreenchimento(culto)}</span>
      </footer>`;

  return `
    <article class="esc-culto-card${aoVivo ? " esc-culto-ao-vivo" : ""}" data-culto-id="${culto.id}">
      <header class="esc-culto-head">
        <div>
          <span class="esc-culto-data">${formatDataLonga(culto.data)} · ${escapeHtml(culto.hora)}</span>
          <h3>${escapeHtml(culto.nome)} ${especialTag} ${temaTag} ${vivoTag}</h3>
          ${temaSelectHtml(culto)}
          ${temGrupo ? "" : ministranteSelectHtml(culto)}
          ${grupoMusicalSelectHtml(culto)}
          ${ensaioSelectHtml(culto)}
        </div>
        <div class="esc-culto-actions">
          ${acoesEscala}
          <button class="esc-icon-btn" data-action="delete-culto" data-culto="${culto.id}" title="Remover culto da agenda">×</button>
        </div>
      </header>
      ${corpoEscala}

    </article>`;
}

/* ── ensaio (data + hora opcionais, um só por culto) ── */
function ensaioSelectHtml(culto) {
  return `<div class="esc-ministra">
    <span class="esc-ministra-label">Ensaio</span>
    <input type="date" value="${escapeHtml(culto.ensaioData || "")}" data-action="ensaio-data" data-culto="${culto.id}" />
    <input type="time" value="${escapeHtml(culto.ensaioHora || "")}" data-action="ensaio-hora" data-culto="${culto.id}" />
  </div>`;
}

/* ── render: Escalas · lista e calendário ── */
function statusLouvor(culto) {
  if (culto.grupoMusicalId) {
    const grupo = state.gruposMusicais.find(g => g.id === culto.grupoMusicalId);
    return { texto: grupo ? "Grupo convidado definido" : "Revisar grupo convidado", classe: grupo ? "neutral" : "pending" };
  }
  const slots = culto.slots || [];
  const recusas = slots.filter(s => s.membroId && s.status === "recusado").length;
  const vagas = slots.filter(s => !s.membroId || !state.membros.some(m => m.id === s.membroId)).length;
  const pendentes = slots.filter(s => s.membroId && s.status !== "confirmado" && s.status !== "recusado").length;
  if (recusas) return { texto: `${recusas} ${recusas === 1 ? "substituição necessária" : "substituições necessárias"}`, classe: "pending" };
  if (vagas) return { texto: `${vagas} ${vagas === 1 ? "vaga para preencher" : "vagas para preencher"}`, classe: "pending" };
  if (pendentes) return { texto: `${pendentes} ${pendentes === 1 ? "pessoa a confirmar" : "pessoas a confirmar"}`, classe: "pending" };
  return { texto: slots.length ? "Equipe de louvor confirmada" : "Equipe ainda não definida", classe: slots.length ? "confirmed" : "neutral" };
}

function cultoResumoHtml(culto, primeiro) {
  return renderServiceCard(culto, primeiro, { state, status: statusLouvor(culto), escapeHtml, parseISO, dias: DIAS_SEMANA });
}

function programaLeituraHtml(culto) {
  if (!(culto.programa || []).length) return `<div class="detail-empty"><h3>A ordem do culto ainda não foi preparada</h3><p>Quem organiza pode usar “Editar” para adicionar os momentos, responsáveis e músicas.</p></div>`;
  return `<ol class="service-order">${culto.programa.map(item => item.tipo === "secao"
    ? `<li class="order-section">${escapeHtml(item.titulo)}</li>`
    : `<li class="order-moment"><span class="order-time">${escapeHtml(item.hora || "—")}</span><div><h3>${escapeHtml(item.nome || "Momento sem nome")}</h3>${item.responsavel ? `<p class="order-person">${escapeHtml(item.responsavel)}</p>` : ''}${(item.musicas || []).filter(Boolean).map(m => `<p class="order-song">${escapeHtml(m)}</p>`).join('')}</div></li>`).join('')}</ol>`;
}

function louvorLeituraHtml(culto) {
  const grupo = state.gruposMusicais.find(g => g.id === culto.grupoMusicalId);
  const lider = state.membros.find(m => m.id === culto.ministranteId);
  const slots = culto.slots || [];
  return `<div class="worship-intro"><div><span class="eyebrow">Responsável pelo louvor</span><h3>${escapeHtml(grupo ? grupo.nome : lider ? lider.nome : 'A definir')}</h3></div><div><span class="eyebrow">Ensaio</span><p>${culto.ensaioData ? `${formatDataLonga(culto.ensaioData)}${culto.ensaioHora ? ' · ' + escapeHtml(culto.ensaioHora) : ' · horário a definir'}` : 'Ainda não marcado'}</p></div></div>
    ${culto.grupoMusicalId ? `<p class="detail-note">${grupo ? 'O grupo convidado conduz o louvor deste culto.' : 'O grupo desta escala não está mais cadastrado. Revise a escolha em Editar.'}</p>` :
      `<ul class="team-read">${slots.map(slot => {
        const pessoa = state.membros.find(m => m.id === slot.membroId);
        const papel = slot.tipo === 'instrumento' ? nomeInstrumento(slot.instrumento) : slot.tipo === 'solo' ? 'Música especial' : slot.naipeAlvo || 'Voz';
        return `<li><div><span class="eyebrow">${escapeHtml(papel)}</span><strong>${escapeHtml(pessoa ? pessoa.nome : slot.membroId ? 'Pessoa não encontrada' : 'Pessoa a definir')}</strong></div><span class="service-status ${pessoa && slot.status === 'confirmado' ? 'confirmed' : 'pending'}">${pessoa ? STATUS_LABEL[slot.status] || 'A confirmar' : 'Vaga aberta'}</span></li>`;
      }).join('')}</ul>${!slots.length ? '<p class="detail-note">Nenhuma vaga de louvor cadastrada para este culto.</p>' : ''}`}
    <button class="btn-outline" data-action="secao-culto" data-secao="programa" data-culto="${culto.id}">Ver músicas na ordem do culto →</button>`;
}

function departamentosHtml(culto) {
  const dados = culto.organizacao || {};
  return `<p class="detail-note">Os responsáveis e orientações ficam junto da escala de louvor. A pregação e os demais momentos são preenchidos na ordem do culto.</p>
    <div class="department-grid">${CAMPOS_CULTO.map(([key, label]) => editandoCulto
      ? `<label>${label}<input type="text" data-action="organizacao" data-field="${key}" data-culto="${culto.id}" value="${escapeHtml(dados[key] || '')}" placeholder="A definir" /></label>`
      : `<div><span class="eyebrow">${label}</span><p>${escapeHtml(dados[key] || 'A definir')}</p></div>`).join('')}</div>`;
}

function cultoDetalheHtml(culto) {
  const status = statusLouvor(culto);
  const secoes = [['louvor', 'Equipe de louvor'], ['programa', 'Ordem do culto'], ['igreja', 'Outros departamentos']];
  const conteudo = detalheSecao === 'programa' ? (editandoCulto ? programaTabelaHtml(culto) : programaLeituraHtml(culto))
    : detalheSecao === 'igreja' ? departamentosHtml(culto)
    : editandoCulto ? cultoEditorHtml(culto) : louvorLeituraHtml(culto);
  return `<div class="detail-back"><button class="esc-link" data-action="limpar-filtro-culto">← Voltar para a agenda</button><button class="btn-outline" data-action="imprimir-culto">Imprimir culto</button></div>
    <article class="service-detail">
      <header class="service-heading"><div><p class="eyebrow">${formatDataLonga(culto.data)} · ${escapeHtml(culto.hora || 'Horário a definir')}</p><h2 tabindex="-1" id="cultoTitulo">${escapeHtml(culto.nome)}</h2><span class="service-status ${status.classe}">${status.texto}</span></div>
      <button class="${editandoCulto ? 'btn-fill' : 'btn-outline'}" data-action="editar-culto" data-culto="${culto.id}">${editandoCulto ? 'Concluir edição' : 'Editar'}</button></header>
      ${editandoCulto ? '<p class="edit-notice">Modo de edição · as alterações são salvas automaticamente.</p>' : ''}
      <nav class="detail-tabs" aria-label="Informações do culto">${secoes.map(([id, label]) => `<button class="${detalheSecao === id ? 'active' : ''}" aria-label="${label}" aria-pressed="${detalheSecao === id}" data-action="secao-culto" data-secao="${id}" data-culto="${culto.id}">${id === 'louvor' ? 'Louvor' : id === 'igreja' ? 'Departamentos' : label}</button>`).join('')}</nav>
      <div class="detail-content">${conteudo}</div>
      <div class="print-service"><h3>Equipe de louvor</h3>${louvorLeituraHtml(culto)}<h3>Ordem do culto</h3>${programaLeituraHtml(culto)}<h3>Outros departamentos</h3>${departamentosHtml(culto)}</div>
    </article>`;
}

function renderListaCultos() {
  const container = document.getElementById("cultosList");
  const selecionado = state.cultos.find(c => c.id === cultoFiltroId);
  document.getElementById("agendaIntro").hidden = !!selecionado;
  document.getElementById("agendaToolbar").hidden = !!selecionado;
  document.getElementById("agendaFilters").hidden = !!selecionado || viewMode === "calendario";
  if (selecionado) { container.innerHTML = cultoDetalheHtml(selecionado); return; }
  cultoFiltroId = null;
  const mostrarPassados = document.getElementById("chkPassados").checked;
  const busca = document.getElementById("buscarCulto").value.trim().toLocaleLowerCase('pt-BR');
  const filtro = document.getElementById("filtroCulto").value;
  const lista = state.cultos.filter(c => (mostrarPassados || c.data >= todayISO()) &&
    (!filtro || String(parseISO(c.data).getDay()) === filtro) &&
    (!busca || [c.nome, c.data, formatDataLonga(c.data), state.temasCulto.find(t => t.id === c.temaId)?.nome, c.organizacao?.ministerio].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(busca)))
    .sort((a,b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  const proximo = state.cultos.filter(c => c.data >= todayISO()).sort((a,b) => (a.data + a.hora).localeCompare(b.data + b.hora))[0];
  container.innerHTML = lista.length ? lista.map((c, i) => { const month = c.data.slice(0, 7); const heading = i === 0 || lista[i - 1].data.slice(0, 7) !== month; return `${heading ? `<h3 class="agenda-month">${parseISO(c.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>` : ''}${cultoResumoHtml(c, c.id === proximo?.id)}`; }).join('') : '<div class="detail-empty"><h3>Nenhum culto encontrado</h3><p>Tente outro dia ou outra busca. Você também pode adicionar um culto.</p></div>';
  document.getElementById("agendaCount").textContent = `${lista.length} ${lista.length === 1 ? 'culto' : 'cultos'}`;
}

/* temporada atual começa em jul/2026 — não faz sentido navegar o calendário
   pra antes disso, então a mesma trava vale pro mês inicial e pro botão "‹" */
const MES_MINIMO_CALENDARIO = new Date(2026, 6, 1);

function inicializarCalMes() {
  if (!calMes) {
    const hoje = new Date();
    const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    calMes = inicioMesAtual < MES_MINIMO_CALENDARIO ? new Date(MES_MINIMO_CALENDARIO) : inicioMesAtual;
  }
}

function renderCalendario() {
  inicializarCalMes();
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(calMes);
  document.getElementById("calMesLabel").textContent = label.charAt(0).toUpperCase() + label.slice(1);
  document.getElementById("calMesAnterior").disabled =
    calMes.getFullYear() === MES_MINIMO_CALENDARIO.getFullYear() && calMes.getMonth() === MES_MINIMO_CALENDARIO.getMonth();

  const primeiroDiaSemana = new Date(calMes.getFullYear(), calMes.getMonth(), 1).getDay();
  const diasNoMes = new Date(calMes.getFullYear(), calMes.getMonth() + 1, 0).getDate();
  const hojeISO = todayISO();

  const porData = {};
  state.cultos.forEach((c) => {
    (porData[c.data] = porData[c.data] || []).push(c);
  });

  let celulas = "";
  for (let i = 0; i < primeiroDiaSemana; i++) celulas += `<div class="esc-cal-cell esc-cal-vazia"></div>`;
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataISO = formatISO(new Date(calMes.getFullYear(), calMes.getMonth(), dia));
    const cultosDoDia = porData[dataISO] || [];
    const badges = cultosDoDia
      .map(
        (c) =>
          `<button class="esc-cal-badge ${classeSaudeCulto(c)}" data-action="ir-para-culto" data-culto="${c.id}" aria-label="${escapeHtml(c.nome)} · ${escapeHtml(c.hora)} · ${statusLouvor(c).texto}" title="${escapeHtml(c.nome)} · ${escapeHtml(c.hora)} · ${statusLouvor(c).texto}">${escapeHtml(c.hora)} ${escapeHtml(c.nome)}</button>`
      )
      .join("");
    celulas += `
      <div class="esc-cal-cell ${dataISO === hojeISO ? "esc-cal-hoje" : ""}">
        <span class="esc-cal-dia">${dia}</span>
        <div class="esc-cal-badges">${badges}</div>
      </div>`;
  }
  document.getElementById("calendarioGrid").innerHTML = celulas;
}

function setViewMode(modo) {
  viewMode = modo;
  document.getElementById("cultosList").hidden = modo !== "lista";
  document.getElementById("calendarioView").hidden = modo !== "calendario";
  document.getElementById("btnVerLista").classList.toggle("active", modo === "lista");
  document.getElementById("btnVerCalendario").classList.toggle("active", modo === "calendario");
  document.getElementById("agendaFilters").hidden = modo === "calendario" || !!cultoFiltroId;
  if (modo === "calendario") renderCalendario();
}

function renderEscalas() {
  ensureUpcomingCultos();
  // primeira vez que um culto entra na janela "ao vivo": abre o programa
  // sozinho (se a pessoa fechar depois, não força de novo)
  state.cultos.forEach((c) => {
    if (cultoEstaAoVivo(c) && !programaAutoAberto.has(c.id)) {
      programaAberto.add(c.id);
      programaAutoAberto.add(c.id);
    }
  });
  renderListaCultos();
  if (viewMode === "calendario") renderCalendario();
}

/* ── render: Equipe ── */
function membroCardHtml(m) {
  const chips = [
    `<span class="tag">${m.genero === "M" ? "Homem" : "Mulher"}</span>`,
    ...m.instrumentos.map((i) => {
      const nivel = m.nivelInstrumentos[i];
      return `<span class="tag">${nomeInstrumento(i)}${nivel ? " · " + escapeHtml(nomeNivel(nivel)) : ""}</span>`;
    }),
    m.vocal ? `<span class="tag">Vocal${m.naipe ? " · " + escapeHtml(m.naipe) : ""}</span>` : "",
    m.diasIndisponiveis.length ? `<span class="tag">Nunca: ${m.diasIndisponiveis.map((d) => DIAS_SEMANA[d].slice(0, 3)).join(", ")}</span>` : "",
    m.gostaDeSolo ? `<span class="tag">★ gosta de solo</span>` : "",
    m.podeMinistrar ? `<span class="tag">Ministra</span>` : "",
    m.externo ? `<span class="tag">Convidado(a) externo(a)</span>` : "",
  ].join("");
  const indisp = m.indisponibilidades.length
    ? m.indisponibilidades
        .map((d) => `<span class="esc-date-tag">${formatDataCurta(d)}<button data-action="remove-indisp" data-id="${m.id}" data-date="${d}">×</button></span>`)
        .join("")
    : `<em style="color:var(--muted);font-size:0.8rem">nenhuma data</em>`;

  return `
    <div class="esc-membro-card ${m.ativo ? "" : "esc-inativo"}" data-membro="${m.id}">
      <div class="esc-membro-head">
        <h3>${escapeHtml(m.nome)}</h3>
        <label class="esc-switch"><input type="checkbox" data-action="toggle-ativo" data-id="${m.id}" ${m.ativo ? "checked" : ""}/> ativo</label>
      </div>
      <div class="esc-membro-chips">${chips}</div>
      ${m.contato ? `<p class="esc-membro-contato">📞 ${escapeHtml(m.contato)}</p>` : ""}
      ${m.observacoes ? `<p class="esc-membro-obs">${escapeHtml(m.observacoes)}</p>` : ""}
      <div class="esc-indisp">
        <span class="esc-indisp-label">Indisponível em (datas específicas)</span>
        <div class="esc-indisp-tags">${indisp}</div>
        <div class="esc-indisp-add">
          <input type="date" class="esc-indisp-input" data-id="${m.id}" />
          <button class="esc-link" data-action="add-indisp" data-id="${m.id}">+ adicionar</button>
        </div>
      </div>
      <div class="esc-membro-actions">
        <button class="esc-link" data-action="edit-membro" data-id="${m.id}">editar</button>
        <button class="esc-link esc-danger" data-action="remove-membro" data-id="${m.id}">remover</button>
      </div>
    </div>`;
}

function renderEquipe() {
  const container = document.getElementById("membrosList");
  if (!state.membros.length) {
    container.innerHTML = `<p class="esc-empty">Nenhuma pessoa cadastrada ainda. Clique em "+ Adicionar pessoa" acima ou, em Configurações, carregue dados de exemplo para explorar o app.</p>`;
    return;
  }
  const ordenados = [...state.membros].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  container.innerHTML = ordenados.map(membroCardHtml).join("");
}

/* ── render: Configurações ── */
function renderConfig() {
  const container = document.getElementById("tiposCultoList");
  container.innerHTML = state.tiposCulto
    .map(
      (t) => `
    <div class="esc-tipo-row" data-id="${t.id}">
      <input type="text" value="${escapeHtml(t.nome)}" data-action="tipo-nome" data-id="${t.id}" />
      <select data-action="tipo-dia" data-id="${t.id}">
        ${DIAS_SEMANA.map((d, i) => `<option value="${i}" ${i === t.diaSemana ? "selected" : ""}>${d}</option>`).join("")}
      </select>
      <input type="time" value="${escapeHtml(t.hora)}" data-action="tipo-hora" data-id="${t.id}" />
      <select data-action="tipo-modelo" data-id="${t.id}" title="Modelo de programa">
        <option value="">— sem modelo de programa —</option>
        ${state.modelosPrograma.map((mp) => `<option value="${mp.id}" ${mp.id === t.modeloProgramaId ? "selected" : ""}>${escapeHtml(mp.nome)}</option>`).join("")}
      </select>
      <button class="esc-link esc-danger" data-action="remove-tipo" data-id="${t.id}">remover</button>
    </div>`
    )
    .join("");
}

function renderGruposMusicais() {
  const container = document.getElementById("gruposMusicaisList");
  if (!container) return;
  container.innerHTML = state.gruposMusicais
    .map(
      (g) => `
    <div class="esc-tipo-row" data-id="${g.id}">
      <input type="text" value="${escapeHtml(g.nome)}" placeholder="Nome do grupo" data-action="grupo-nome" data-id="${g.id}" />
      <input type="text" value="${escapeHtml(g.observacoes)}" placeholder="Observações (opcional)" data-action="grupo-obs" data-id="${g.id}" />
      <button class="esc-link esc-danger" data-action="remove-grupo" data-id="${g.id}">remover</button>
    </div>`
    )
    .join("");
}

function renderTemasCulto() {
  const container = document.getElementById("temasCultoList");
  if (!container) return;
  container.innerHTML = state.temasCulto
    .map(
      (t) => `
    <div class="esc-tipo-row" data-id="${t.id}">
      <input type="text" value="${escapeHtml(t.nome)}" placeholder="Nome do tema" data-action="tema-nome" data-id="${t.id}" />
      <button class="esc-link esc-danger" data-action="remove-tema" data-id="${t.id}">remover</button>
    </div>`
    )
    .join("");
}

/* ── render: Configurações · modelos de programa (CRUD completo) ── */
const modelosAbertos = new Set();

function modeloLinhaHtml(modelo, item, idx, total) {
  const acoes = `
    <span class="esc-prog-linha-acoes">
      <button data-action="modelo-item-subir" data-modelo="${modelo.id}" data-item="${item.id}" ${idx === 0 ? "disabled" : ""} title="Mover para cima">↑</button>
      <button data-action="modelo-item-descer" data-modelo="${modelo.id}" data-item="${item.id}" ${idx === total - 1 ? "disabled" : ""} title="Mover para baixo">↓</button>
      <button data-action="modelo-item-remover" data-modelo="${modelo.id}" data-item="${item.id}" class="esc-danger" title="Remover linha">×</button>
    </span>`;

  if (item.tipo === "secao") {
    return `
      <tr class="esc-prog-secao">
        <td colspan="4">
          <input type="text" class="esc-prog-secao-input" value="${escapeHtml(item.titulo)}" data-action="modelo-item-titulo" data-modelo="${modelo.id}" data-item="${item.id}" />
        </td>
        <td>${acoes}</td>
      </tr>`;
  }
  return `
    <tr>
      <td><input type="text" class="esc-prog-hora" value="${escapeHtml(item.hora || "")}" placeholder="hh:mm" data-action="modelo-item-hora" data-modelo="${modelo.id}" data-item="${item.id}" /></td>
      <td><input type="text" value="${escapeHtml(item.nome || "")}" placeholder="Momento" data-action="modelo-item-nome" data-modelo="${modelo.id}" data-item="${item.id}" /></td>
      <td><input type="text" value="${escapeHtml(item.responsavel || "")}" placeholder="Responsável" data-action="modelo-item-responsavel" data-modelo="${modelo.id}" data-item="${item.id}" /></td>
      <td>${musicasCelulaModeloHtml(modelo, item)}</td>
      <td>${acoes}</td>
    </tr>`;
}

function musicasCelulaModeloHtml(modelo, item) {
  const linhas = (item.musicas || [])
    .map(
      (m, i) => `
    <div class="esc-musica-row">
      <input type="text" value="${escapeHtml(m)}" placeholder="Música" data-action="modelo-musica-editar" data-modelo="${modelo.id}" data-item="${item.id}" data-musica="${i}" />
      <button data-action="modelo-musica-remover" data-modelo="${modelo.id}" data-item="${item.id}" data-musica="${i}" title="Remover música">×</button>
    </div>`
    )
    .join("");
  return `<div class="esc-musicas-list">
    ${linhas}
    <button class="esc-link esc-musica-add" data-action="modelo-musica-add" data-modelo="${modelo.id}" data-item="${item.id}">+ música</button>
  </div>`;
}

function modeloTabelaHtml(modelo) {
  const itens = modelo.itens || [];
  const linhas = itens.map((item, idx) => modeloLinhaHtml(modelo, item, idx, itens.length)).join("");
  return `
    <div class="esc-programa">
      <table class="esc-prog-tabela">
        <thead><tr><th>Hora</th><th>Momento</th><th>Responsável</th><th>Música(s)</th><th></th></tr></thead>
        <tbody>${linhas || `<tr><td colspan="5" class="esc-prog-vazio">Sem itens ainda.</td></tr>`}</tbody>
      </table>
      <div class="esc-prog-add">
        <button class="esc-link" data-action="modelo-add-momento" data-modelo="${modelo.id}">+ momento</button>
        <button class="esc-link" data-action="modelo-add-secao" data-modelo="${modelo.id}">+ seção</button>
        <button class="esc-link" data-action="modelo-importar-csv" data-modelo="${modelo.id}">importar CSV</button>
        <button class="esc-link" data-action="modelo-baixar-csv" data-modelo="${modelo.id}">baixar modelo CSV</button>
      </div>
    </div>`;
}

function modeloRowHtml(modelo) {
  const aberto = modelosAbertos.has(modelo.id);
  return `
    <div class="esc-modelo-card" data-id="${modelo.id}">
      <div class="esc-tipo-row">
        <input type="text" value="${escapeHtml(modelo.nome)}" placeholder="Nome do modelo" data-action="modelo-nome" data-id="${modelo.id}" />
        <button class="esc-link" data-action="toggle-modelo" data-id="${modelo.id}">${aberto ? "ocultar itens ▴" : "ver / editar itens ▾"}</button>
        <button class="esc-link esc-danger" data-action="remove-modelo" data-id="${modelo.id}">remover</button>
      </div>
      ${aberto ? modeloTabelaHtml(modelo) : ""}
    </div>`;
}

function renderModelosPrograma() {
  const container = document.getElementById("modelosProgramaList");
  if (!container) return;
  container.innerHTML = state.modelosPrograma.map(modeloRowHtml).join("");
}

/* mantém o <select> de "+ Culto especial" em sincronia com os modelos
   cadastrados (inclui os novos, ex: "Doxologia" criada em Configurações) */
function atualizarOpcoesModeloEspecial() {
  const sel = document.getElementById("especialModelo");
  if (!sel) return;
  const atual = sel.value;
  sel.innerHTML =
    `<option value="">sem modelo de programa</option>` +
    state.modelosPrograma.map((m) => `<option value="${m.id}">Copiar modelo: ${escapeHtml(m.nome)}</option>`).join("");
  if (Array.from(sel.options).some((o) => o.value === atual)) sel.value = atual;
}

/* ── preservar foco/cursor através de um render() ──
   render() reconstrói innerHTML inteiro; se alguém está digitando quando um
   render acontece (ex: uma atualização chegando de outro dispositivo pelo
   Firestore), o campo é recriado do zero e o foco/teclado (no celular) cai.
   Identifica o campo focado pelos data-attributes (estáveis entre renders)
   e restaura foco + posição do cursor depois de recriar o HTML. */
function capturarFoco() {
  const el = document.activeElement;
  if (!el || !el.dataset || !["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return null;
  const chave = ["action", "culto", "modelo", "item", "slot", "id", "musica", "field"]
    .filter((k) => el.dataset[k] !== undefined)
    .map((k) => `[data-${k}="${CSS.escape(el.dataset[k])}"]`)
    .join("");
  if (!chave) return null;
  return {
    seletor: el.tagName.toLowerCase() + chave,
    selStart: typeof el.selectionStart === "number" ? el.selectionStart : null,
    selEnd: typeof el.selectionEnd === "number" ? el.selectionEnd : null,
  };
}
function restaurarFoco(info) {
  if (!info) return;
  let el;
  try {
    el = document.querySelector(info.seletor);
  } catch (e) {
    return;
  }
  if (!el) return;
  el.focus();
  if (info.selStart !== null && typeof el.setSelectionRange === "function") {
    try {
      el.setSelectionRange(info.selStart, info.selEnd);
    } catch (e) {
      /* alguns tipos de input (ex: date) não suportam seleção de texto */
    }
  }
}

/* ── despacho geral de render ── */
function render() {
  const foco = capturarFoco();
  atualizarOpcoesModeloEspecial();
  if (activeTab === "escalas") renderEscalas();
  else if (activeTab === "equipe") renderEquipe();
  else if (activeTab === "modelos") renderModelosPrograma();
  else if (activeTab === "temas") renderTemasCulto();
  else if (activeTab === "grupos") renderGruposMusicais();
  else renderConfig();
  restaurarFoco(foco);
}

/* ── abas ── */
document.getElementById("tabsNav").addEventListener("click", (e) => {
  const btn = e.target.closest(".esc-tab");
  if (!btn) return;
  activeTab = btn.dataset.tab;
  document.querySelector(".organize-menu").classList.toggle("has-active", !["escalas", "equipe"].includes(activeTab));
  if (window.matchMedia("(max-width: 760px)").matches) document.querySelector(".organize-menu").open = false;
  document.getElementById("workspaceTitle").textContent = btn.textContent.trim();
  document.querySelectorAll(".esc-tab").forEach((b) => b.classList.toggle("active", b === btn));
  document.querySelectorAll(".esc-panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + activeTab));
  render();
});

/* ── eventos: Escalas · toggle lista/calendário + navegação de mês ── */
document.getElementById("btnVerLista").addEventListener("click", () => {
  cultoFiltroId = null;
  setViewMode("lista");
  renderListaCultos();
});
document.getElementById("btnVerCalendario").addEventListener("click", () => setViewMode("calendario"));
document.getElementById("calMesAnterior").addEventListener("click", () => {
  inicializarCalMes();
  const anterior = new Date(calMes.getFullYear(), calMes.getMonth() - 1, 1);
  if (anterior < MES_MINIMO_CALENDARIO) return;
  calMes = anterior;
  renderCalendario();
});
document.getElementById("calMesProximo").addEventListener("click", () => {
  inicializarCalMes();
  calMes = new Date(calMes.getFullYear(), calMes.getMonth() + 1, 1);
  renderCalendario();
});
document.getElementById("calendarioGrid").addEventListener("click", (e) => {
  const el = e.target.closest('[data-action="ir-para-culto"]');
  if (!el) return;
  const cultoAlvo = state.cultos.find((c) => c.id === el.dataset.culto);
  if (cultoAlvo && cultoAlvo.data < todayISO()) {
    document.getElementById("chkPassados").checked = true;
  }
  // abre só esse culto, em vez da lista inteira
  cultoFiltroId = el.dataset.culto;
  editandoCulto = false;
  detalheSecao = "louvor";
  setViewMode("lista");
  renderListaCultos();
});

/* ── eventos: Escalas · cultos e vagas ── */
const cultosList = document.getElementById("cultosList");

cultosList.addEventListener("change", (e) => {
  const el = e.target;
  const culto = el.dataset.culto ? state.cultos.find((c) => c.id === el.dataset.culto) : null;
  if (!culto) return;
  if (el.dataset.action === "assign-slot") {
    const slot = culto.slots.find((s) => s.id === el.dataset.slot);
    slot.membroId = el.value || null;
    slot.status = el.value ? "convidado" : "aberto";
    limparMinistranteSeInvalido(culto);
    markDirty();
    render();
  } else if (el.dataset.action === "add-instrumento" && el.value) {
    culto.slots.push({ id: uid(), tipo: "instrumento", instrumento: el.value, membroId: null, status: "aberto" });
    markDirty();
    render();
  } else if (el.dataset.action === "add-vocal" && el.value) {
    const naipeAlvo = el.value === "__livre" ? null : el.value;
    culto.slots.push({ id: uid(), tipo: "vocal", naipeAlvo, membroId: null, status: "aberto" });
    markDirty();
    render();
  } else if (el.dataset.action === "set-ministrante") {
    culto.ministranteId = el.value || null;
    markDirty();
  } else if (el.dataset.action === "set-grupo-musical") {
    culto.grupoMusicalId = el.value || null;
    markDirty();
    render();
  } else if (el.dataset.action === "set-tema") {
    culto.temaId = el.value || null;
    markDirty();
    render();
  } else if (el.dataset.action === "ensaio-data") {
    culto.ensaioData = el.value;
    markDirty();
  } else if (el.dataset.action === "ensaio-hora") {
    culto.ensaioHora = el.value;
    markDirty();
  }
});

cultosList.addEventListener("input", (e) => {
  const el = e.target;
  const culto = el.dataset.culto ? state.cultos.find((c) => c.id === el.dataset.culto) : null;
  if (!culto) return;
  if (el.dataset.action === "organizacao" && CAMPOS_CULTO.some(([key]) => key === el.dataset.field)) {
    culto.organizacao = { ...(culto.organizacao || {}), [el.dataset.field]: el.value };
    markDirty();
    return;
  }
  if (!el.dataset.item) return;
  const item = (culto.programa || []).find((i) => i.id === el.dataset.item);
  if (!item) return;
  const action = el.dataset.action;
  if (action === "prog-hora") item.hora = el.value;
  else if (action === "prog-nome") item.nome = el.value;
  else if (action === "prog-responsavel") item.responsavel = el.value;
  else if (action === "prog-titulo") item.titulo = el.value;
  else if (action === "prog-musica-editar") {
    if (!Array.isArray(item.musicas)) item.musicas = [];
    item.musicas[Number(el.dataset.musica)] = el.value;
  } else return;
  markDirty();
});

cultosList.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  if (el.dataset.action === "limpar-filtro-culto") {
    cultoFiltroId = null;
    editandoCulto = false;
    renderListaCultos();
    document.getElementById("agendaTitle").focus();
    return;
  }
  const culto = el.dataset.culto ? state.cultos.find((c) => c.id === el.dataset.culto) : null;
  const slot = culto && el.dataset.slot ? culto.slots.find((s) => s.id === el.dataset.slot) : null;
  const action = el.dataset.action;

  if (action === "imprimir-culto") { window.print(); return; }
  if (action === "abrir-culto" && culto) {
    cultoFiltroId = culto.id;
    detalheSecao = "louvor";
    editandoCulto = false;
    renderListaCultos();
    document.getElementById("cultoTitulo").focus();
    return;
  }
  if (action === "secao-culto" && culto) {
    detalheSecao = el.dataset.secao;
    renderListaCultos();
    document.querySelector(`.detail-tabs [data-secao="${detalheSecao}"]`).focus();
    return;
  }
  if (action === "editar-culto" && culto) {
    editandoCulto = !editandoCulto;
    renderListaCultos();
    document.querySelector('[data-action="editar-culto"]').focus();
    return;
  }
  if (action === "autofill" && culto) autoFillCulto(culto, { somenteAbertos: true });
  else if (action === "reroll" && culto) autoFillCulto(culto, { somenteAbertos: false });
  else if (action === "limpar-escala" && culto) {
    if (confirm("Limpar a escala deste culto? Todas as vagas voltam a ficar abertas (o programa e a lista de vagas continuam).")) {
      culto.slots.forEach((s) => {
        s.membroId = null;
        s.status = "aberto";
      });
      culto.ministranteId = null;
      markDirty();
      render();
    }
  } else if (action === "delete-culto" && culto) {
    const aviso = culto.especial
      ? "Excluir este culto especial da agenda?"
      : "Remover este culto da agenda? Ele não será recriado automaticamente depois (a menos que você remova o tipo de culto e crie de novo).";
    if (confirm(aviso)) {
      if (!culto.especial && culto.tipoCultoId) {
        state.cultosRemovidos.push(chaveRemovido(culto.tipoCultoId, culto.data));
      }
      state.cultos = state.cultos.filter((c) => c.id !== culto.id);
      markDirty();
      render();
    }
  } else if (action === "remove-slot" && culto && slot) {
    culto.slots = culto.slots.filter((s) => s.id !== slot.id);
    limparMinistranteSeInvalido(culto);
    markDirty();
    render();
  } else if (action === "add-solo" && culto) {
    culto.slots.push({ id: uid(), tipo: "solo", membroId: null, status: "aberto" });
    markDirty();
    render();
  } else if (action === "status-slot" && culto && slot) {
    slot.status = el.dataset.status;
    if (slot.membroId) {
      const membro = state.membros.find((m) => m.id === slot.membroId);
      if (membro) {
        if (slot.status === "recusado") {
          // recusar uma vaga marca a pessoa como indisponível naquela data —
          // assim o sorteio/sugestão de substituto já não volta a oferecer o
          // mesmo dia
          if (!membro.indisponibilidades.includes(culto.data)) {
            membro.indisponibilidades.push(culto.data);
            membro.indisponibilidades.sort();
          }
        } else {
          // confirmar/convidar de volta pro mesmo dia contradiz uma recusa
          // anterior — remove a indisponibilidade que essa recusa tinha criado
          membro.indisponibilidades = membro.indisponibilidades.filter((d) => d !== culto.data);
        }
      }
    }
    markDirty();
    render();
  } else if (action === "toggle-suggest" && slot) {
    if (suggestOpen.has(slot.id)) suggestOpen.delete(slot.id);
    else suggestOpen.add(slot.id);
    render();
  } else if (action === "use-suggestion" && culto && slot) {
    slot.membroId = el.dataset.membro;
    slot.status = "convidado";
    suggestOpen.delete(slot.id);
    limparMinistranteSeInvalido(culto);
    markDirty();
    render();
  } else if (action === "toggle-programa" && culto) {
    if (programaAberto.has(culto.id)) programaAberto.delete(culto.id);
    else programaAberto.add(culto.id);
    render();
  } else if (action === "prog-add-momento" && culto) {
    culto.programa = culto.programa || [];
    culto.programa.push({ id: uid(), tipo: "momento", hora: "", nome: "Novo momento", responsavel: "", musicas: [] });
    markDirty();
    render();
  } else if (action === "prog-add-secao" && culto) {
    culto.programa = culto.programa || [];
    culto.programa.push({ id: uid(), tipo: "secao", titulo: "Nova seção" });
    markDirty();
    render();
  } else if (action === "prog-musica-add" && culto && el.dataset.item) {
    const item = (culto.programa || []).find((i) => i.id === el.dataset.item);
    if (item) {
      item.musicas = item.musicas || [];
      item.musicas.push("");
      markDirty();
      render();
    }
  } else if (action === "prog-musica-remover" && culto && el.dataset.item) {
    const item = (culto.programa || []).find((i) => i.id === el.dataset.item);
    if (item && Array.isArray(item.musicas)) {
      item.musicas.splice(Number(el.dataset.musica), 1);
      markDirty();
      render();
    }
  } else if (action === "limpar-programa" && culto) {
    const modeloId = modeloIdDoCulto(culto);
    if (!modeloId || !state.modelosPrograma.some((m) => m.id === modeloId)) {
      alert("Este culto não tem um modelo de programa associado — não há um padrão para restaurar.");
      return;
    }
    if (confirm("Limpar o programa deste culto e voltar ao modelo padrão? Todo o conteúdo atual (horários, responsáveis, músicas) será substituído.")) {
      culto.programa = defaultPrograma(modeloId);
      markDirty();
      render();
    }
  } else if (action === "prog-baixar-csv" && culto) {
    baixarTextoComoArquivo(programaParaCsv(csvModeloParaCulto(culto)), `programa-${culto.data}.csv`, "text/csv");
  } else if (action === "prog-importar-csv" && culto) {
    csvImportAlvo = { tipo: "culto", id: culto.id };
    document.getElementById("csvInput").click();
  } else if (action === "prog-remover" && culto && el.dataset.item) {
    culto.programa = (culto.programa || []).filter((i) => i.id !== el.dataset.item);
    markDirty();
    render();
  } else if ((action === "prog-subir" || action === "prog-descer") && culto && el.dataset.item) {
    const arr = culto.programa || [];
    const i = arr.findIndex((x) => x.id === el.dataset.item);
    const j = action === "prog-subir" ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < arr.length) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      markDirty();
      render();
    }
  }
});

document.getElementById("buscarCulto").addEventListener("input", renderListaCultos);
document.getElementById("filtroCulto").addEventListener("change", renderListaCultos);
document.getElementById("chkPassados").addEventListener("change", renderListaCultos);

document.getElementById("btnNovoEspecial").addEventListener("click", () => {
  document.getElementById("especialForm").hidden = false;
  document.getElementById("especialNome").focus();
});
document.getElementById("especialCancelar").addEventListener("click", () => {
  document.getElementById("especialForm").hidden = true;
});
document.getElementById("especialSalvar").addEventListener("click", () => {
  const nome = document.getElementById("especialNome").value.trim() || "Culto especial";
  const data = document.getElementById("especialData").value;
  const hora = document.getElementById("especialHora").value || "19:00";
  const modelo = document.getElementById("especialModelo").value;
  if (!data) {
    alert("Escolha uma data.");
    return;
  }
  const novoCultoId = uid();
  state.cultos.push({
    id: novoCultoId,
    tipoCultoId: null,
    data,
    hora,
    nome,
    especial: true,
    slots: defaultSlots(),
    programa: defaultPrograma(modelo),
    modeloProgramaId: modelo || null,
    ensaioData: "",
    ensaioHora: "",
    ministranteId: null,
    grupoMusicalId: null,
    temaId: null,
  });
  document.getElementById("especialNome").value = "";
  document.getElementById("especialData").value = "";
  document.getElementById("especialModelo").value = "";
  document.getElementById("especialForm").hidden = true;
  cultoFiltroId = novoCultoId;
  detalheSecao = "louvor";
  editandoCulto = false;
  setViewMode("lista");
  markDirty();
  render();
  document.getElementById("cultoTitulo").focus();
});

/* ── eventos: Equipe ── */
const membrosList = document.getElementById("membrosList");

membrosList.addEventListener("change", (e) => {
  if (e.target.dataset.action === "toggle-ativo") {
    const m = state.membros.find((x) => x.id === e.target.dataset.id);
    if (m) {
      m.ativo = e.target.checked;
      markDirty();
      render();
    }
  }
});

membrosList.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const id = el.dataset.id;
  const m = id ? state.membros.find((x) => x.id === id) : null;
  const action = el.dataset.action;

  if (action === "remove-membro" && m) {
    if (confirm(`Remover ${m.nome} da equipe? As vagas já escaladas para essa pessoa ficarão em aberto.`)) {
      state.cultos.forEach((c) => {
        c.slots.forEach((s) => {
          if (s.membroId === id) {
            s.membroId = null;
            s.status = "aberto";
          }
        });
        limparMinistranteSeInvalido(c);
      });
      state.membros = state.membros.filter((x) => x.id !== id);
      markDirty();
      render();
    }
  } else if (action === "edit-membro" && m) {
    abrirFormPessoa(m);
  } else if (action === "add-indisp" && m) {
    const input = membrosList.querySelector(`.esc-indisp-input[data-id="${id}"]`);
    if (input.value && !m.indisponibilidades.includes(input.value)) {
      m.indisponibilidades.push(input.value);
      m.indisponibilidades.sort();
      markDirty();
      render();
    }
  } else if (action === "remove-indisp" && m) {
    m.indisponibilidades = m.indisponibilidades.filter((d) => d !== el.dataset.date);
    markDirty();
    render();
  }
});

/* ── formulário de pessoa (adicionar/editar) ── */
const pessoaForm = document.getElementById("pessoaForm");
const pessoaVocalChk = document.getElementById("pessoaVocal");
const pessoaNaipeWrap = document.getElementById("pessoaNaipeWrap");

function atualizarVisibilidadeNaipe() {
  pessoaNaipeWrap.style.display = pessoaVocalChk.checked ? "" : "none";
}
pessoaVocalChk.addEventListener("change", atualizarVisibilidadeNaipe);

/* checklist de instrumentos é montado a partir de INSTRUMENTOS (garante que
   um instrumento novo, ex: Cajón, apareça aqui sem precisar editar o HTML),
   cada um com um seletor de nível de habilidade que só aparece se marcado */
function montarChecklistInstrumentos() {
  const container = document.getElementById("pessoaInstrumentos");
  container.innerHTML = INSTRUMENTOS.map(
    (i) => `
    <div class="esc-instrumento-row">
      <label class="esc-check"><input type="checkbox" data-instrumento="${i.id}" /> ${i.nome}</label>
      <select class="esc-nivel-select" data-nivel-instrumento="${i.id}" hidden>
        ${NIVEIS_HABILIDADE.map((n) => `<option value="${n.id}">${n.nome}</option>`).join("")}
      </select>
    </div>`
  ).join("");
  container.querySelectorAll("input[type=checkbox][data-instrumento]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const sel = container.querySelector(`select[data-nivel-instrumento="${cb.dataset.instrumento}"]`);
      if (sel) sel.hidden = !cb.checked;
    });
  });
}
montarChecklistInstrumentos();

function abrirFormPessoa(m) {
  document.getElementById("pessoaId").value = m ? m.id : "";
  document.getElementById("pessoaNome").value = m ? m.nome : "";
  document.getElementById("pessoaGenero").value = m ? m.genero : "M";
  document.querySelectorAll("#pessoaInstrumentos input[type=checkbox]").forEach((cb) => {
    const marcado = m ? m.instrumentos.includes(cb.dataset.instrumento) : false;
    cb.checked = marcado;
    const sel = document.querySelector(`select[data-nivel-instrumento="${cb.dataset.instrumento}"]`);
    if (sel) {
      sel.value = (m && m.nivelInstrumentos && m.nivelInstrumentos[cb.dataset.instrumento]) || "intermediario";
      sel.hidden = !marcado;
    }
  });
  pessoaVocalChk.checked = m ? m.vocal : false;
  document.getElementById("pessoaNaipe").value = m && m.naipe ? m.naipe : "";
  document.getElementById("pessoaAtivo").checked = m ? m.ativo : true;
  document.querySelectorAll("#pessoaDiasIndisponiveis input[type=checkbox]").forEach((cb) => {
    cb.checked = m ? m.diasIndisponiveis.includes(Number(cb.dataset.dia)) : false;
  });
  document.getElementById("pessoaGostaSolo").checked = m ? m.gostaDeSolo : false;
  document.getElementById("pessoaPodeMinistrar").checked = m ? m.podeMinistrar : false;
  document.getElementById("pessoaExterno").checked = m ? m.externo : false;
  document.getElementById("pessoaContato").value = m ? m.contato || "" : "";
  document.getElementById("pessoaObs").value = m ? m.observacoes || "" : "";
  atualizarVisibilidadeNaipe();
  pessoaForm.hidden = false;
  pessoaForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

document.getElementById("btnNovaPessoa").addEventListener("click", () => abrirFormPessoa(null));
document.getElementById("pessoaCancelar").addEventListener("click", () => {
  pessoaForm.hidden = true;
});
document.getElementById("pessoaSalvar").addEventListener("click", () => {
  const nome = document.getElementById("pessoaNome").value.trim();
  if (!nome) {
    alert("Informe o nome.");
    return;
  }
  const id = document.getElementById("pessoaId").value || uid();
  const instrumentos = Array.from(document.querySelectorAll("#pessoaInstrumentos input[type=checkbox]:checked")).map((cb) => cb.dataset.instrumento);
  const nivelInstrumentos = {};
  instrumentos.forEach((id) => {
    const sel = document.querySelector(`select[data-nivel-instrumento="${id}"]`);
    nivelInstrumentos[id] = (sel && sel.value) || "intermediario";
  });
  const vocal = pessoaVocalChk.checked;
  const naipe = vocal ? document.getElementById("pessoaNaipe").value || null : null;
  const genero = document.getElementById("pessoaGenero").value;
  const ativo = document.getElementById("pessoaAtivo").checked;
  const diasIndisponiveis = Array.from(document.querySelectorAll("#pessoaDiasIndisponiveis input[type=checkbox]:checked")).map((cb) => Number(cb.dataset.dia));
  const gostaDeSolo = document.getElementById("pessoaGostaSolo").checked;
  const podeMinistrar = document.getElementById("pessoaPodeMinistrar").checked;
  const externo = document.getElementById("pessoaExterno").checked;
  const contato = document.getElementById("pessoaContato").value.trim();
  const observacoes = document.getElementById("pessoaObs").value.trim();

  const existente = state.membros.find((m) => m.id === id);
  const dados = {
    id,
    nome,
    genero,
    instrumentos,
    nivelInstrumentos,
    vocal,
    naipe,
    ativo,
    diasIndisponiveis,
    gostaDeSolo,
    podeMinistrar,
    externo,
    contato,
    observacoes,
    indisponibilidades: existente ? existente.indisponibilidades : [],
  };
  if (existente) Object.assign(existente, dados);
  else state.membros.push(dados);

  pessoaForm.hidden = true;
  markDirty();
  render();
});

/* ── eventos: Configurações ── */
const tiposCultoList = document.getElementById("tiposCultoList");

tiposCultoList.addEventListener("input", (e) => {
  const tipo = state.tiposCulto.find((t) => t.id === e.target.dataset.id);
  if (!tipo) return;
  if (e.target.dataset.action === "tipo-nome") tipo.nome = e.target.value;
  else if (e.target.dataset.action === "tipo-hora") tipo.hora = e.target.value;
  else return;
  markDirty();
});
tiposCultoList.addEventListener("change", (e) => {
  const tipo = state.tiposCulto.find((t) => t.id === e.target.dataset.id);
  if (!tipo) return;
  if (e.target.dataset.action === "tipo-dia") {
    tipo.diaSemana = Number(e.target.value);
    markDirty();
  } else if (e.target.dataset.action === "tipo-modelo") {
    tipo.modeloProgramaId = e.target.value || null;
    markDirty();
  }
});
tiposCultoList.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action='remove-tipo']");
  if (!el) return;
  if (confirm("Remover este tipo de culto? Os cultos já criados continuam na agenda.")) {
    state.tiposCulto = state.tiposCulto.filter((t) => t.id !== el.dataset.id);
    markDirty();
    renderConfig();
  }
});
document.getElementById("btnNovoTipo").addEventListener("click", () => {
  state.tiposCulto.push({ id: uid(), nome: "Novo culto", diaSemana: 0, hora: "19:30" });
  markDirty();
  renderConfig();
});

const gruposMusicaisList = document.getElementById("gruposMusicaisList");
gruposMusicaisList.addEventListener("input", (e) => {
  const grupo = state.gruposMusicais.find((g) => g.id === e.target.dataset.id);
  if (!grupo) return;
  if (e.target.dataset.action === "grupo-nome") grupo.nome = e.target.value;
  else if (e.target.dataset.action === "grupo-obs") grupo.observacoes = e.target.value;
  else return;
  markDirty();
});
gruposMusicaisList.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action='remove-grupo']");
  if (!el) return;
  if (confirm("Remover este grupo musical? Cultos que usam esse grupo voltam a precisar de escala individual.")) {
    state.gruposMusicais = state.gruposMusicais.filter((g) => g.id !== el.dataset.id);
    state.cultos.forEach((c) => {
      if (c.grupoMusicalId === el.dataset.id) c.grupoMusicalId = null;
    });
    markDirty();
    renderGruposMusicais();
  }
});
document.getElementById("btnNovoGrupo").addEventListener("click", () => {
  state.gruposMusicais.push({ id: uid(), nome: "Novo grupo", observacoes: "" });
  markDirty();
  renderGruposMusicais();
});

const temasCultoList = document.getElementById("temasCultoList");
temasCultoList.addEventListener("input", (e) => {
  const tema = state.temasCulto.find((t) => t.id === e.target.dataset.id);
  if (!tema) return;
  if (e.target.dataset.action === "tema-nome") tema.nome = e.target.value;
  else return;
  markDirty();
});
temasCultoList.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action='remove-tema']");
  if (!el) return;
  if (confirm("Remover este tema? Cultos que já usam esse tema ficam sem tema.")) {
    state.temasCulto = state.temasCulto.filter((t) => t.id !== el.dataset.id);
    state.cultos.forEach((c) => {
      if (c.temaId === el.dataset.id) c.temaId = null;
    });
    markDirty();
    renderTemasCulto();
  }
});
document.getElementById("btnNovoTema").addEventListener("click", () => {
  state.temasCulto.push({ id: uid(), nome: "Novo tema" });
  markDirty();
  renderTemasCulto();
});

const modelosProgramaList = document.getElementById("modelosProgramaList");
modelosProgramaList.addEventListener("input", (e) => {
  const el = e.target;
  const modelo = state.modelosPrograma.find((m) => m.id === (el.dataset.id || el.dataset.modelo));
  if (!modelo) return;
  if (el.dataset.action === "modelo-nome") {
    modelo.nome = el.value;
    markDirty();
    return;
  }
  const item = (modelo.itens || []).find((i) => i.id === el.dataset.item);
  if (!item) return;
  const action = el.dataset.action;
  if (action === "modelo-item-hora") item.hora = el.value;
  else if (action === "modelo-item-nome") item.nome = el.value;
  else if (action === "modelo-item-responsavel") item.responsavel = el.value;
  else if (action === "modelo-item-titulo") item.titulo = el.value;
  else if (action === "modelo-musica-editar") {
    if (!Array.isArray(item.musicas)) item.musicas = [];
    item.musicas[Number(el.dataset.musica)] = el.value;
  } else return;
  markDirty();
});
modelosProgramaList.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const idModelo = el.dataset.id || el.dataset.modelo;
  const modelo = state.modelosPrograma.find((m) => m.id === idModelo);
  const action = el.dataset.action;

  if (action === "remove-modelo" && modelo) {
    if (confirm("Remover este modelo de programa? Cultos que já copiaram esse modelo mantêm o programa como está, só não será mais possível reaplicá-lo.")) {
      state.modelosPrograma = state.modelosPrograma.filter((m) => m.id !== idModelo);
      state.tiposCulto.forEach((t) => {
        if (t.modeloProgramaId === idModelo) t.modeloProgramaId = null;
      });
      markDirty();
      renderModelosPrograma();
    }
  } else if (action === "toggle-modelo") {
    if (modelosAbertos.has(idModelo)) modelosAbertos.delete(idModelo);
    else modelosAbertos.add(idModelo);
    renderModelosPrograma();
  } else if (action === "modelo-add-momento" && modelo) {
    modelo.itens = modelo.itens || [];
    modelo.itens.push({ id: uid(), tipo: "momento", hora: "", nome: "Novo momento", responsavel: "", musicas: [] });
    markDirty();
    renderModelosPrograma();
  } else if (action === "modelo-add-secao" && modelo) {
    modelo.itens = modelo.itens || [];
    modelo.itens.push({ id: uid(), tipo: "secao", titulo: "Nova seção" });
    markDirty();
    renderModelosPrograma();
  } else if (action === "modelo-musica-add" && modelo && el.dataset.item) {
    const item = (modelo.itens || []).find((i) => i.id === el.dataset.item);
    if (item) {
      item.musicas = item.musicas || [];
      item.musicas.push("");
      markDirty();
      renderModelosPrograma();
    }
  } else if (action === "modelo-musica-remover" && modelo && el.dataset.item) {
    const item = (modelo.itens || []).find((i) => i.id === el.dataset.item);
    if (item && Array.isArray(item.musicas)) {
      item.musicas.splice(Number(el.dataset.musica), 1);
      markDirty();
      renderModelosPrograma();
    }
  } else if (action === "modelo-baixar-csv" && modelo) {
    baixarTextoComoArquivo(
      programaParaCsv(modelo.itens && modelo.itens.length ? modelo.itens : CSV_EXEMPLO_PADRAO),
      `modelo-${modelo.nome}.csv`,
      "text/csv"
    );
  } else if (action === "modelo-importar-csv" && modelo) {
    csvImportAlvo = { tipo: "modelo", id: modelo.id };
    document.getElementById("csvInput").click();
  } else if (action === "modelo-item-remover" && modelo && el.dataset.item) {
    modelo.itens = (modelo.itens || []).filter((i) => i.id !== el.dataset.item);
    markDirty();
    renderModelosPrograma();
  } else if ((action === "modelo-item-subir" || action === "modelo-item-descer") && modelo && el.dataset.item) {
    const arr = modelo.itens || [];
    const i = arr.findIndex((x) => x.id === el.dataset.item);
    const j = action === "modelo-item-subir" ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < arr.length) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      markDirty();
      renderModelosPrograma();
    }
  }
});
document.getElementById("btnNovoModelo").addEventListener("click", () => {
  state.modelosPrograma.push({ id: uid(), nome: "Novo modelo", itens: [] });
  markDirty();
  renderModelosPrograma();
});

/* ── barra superior: persistência ── */
document.getElementById("btnAbrir").addEventListener("click", abrirArquivo);
document.getElementById("btnSalvar").addEventListener("click", salvar);
document.getElementById("btnBaixarCopia").addEventListener("click", baixarCopia);
document.getElementById("btnExemplo").addEventListener("click", carregarExemplo);
document.getElementById("btnLimpar").addEventListener("click", limparTudo);

/* ── tema claro/escuro ── */
const TEMA_STORAGE_KEY = "escalasTema";

function temaAtual() {
  return document.documentElement.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
function atualizarBotaoTema() {
  document.getElementById("btnTema").innerHTML = icon(temaAtual() === "dark" ? "sun" : "moon");
}
document.getElementById("btnTema").addEventListener("click", () => {
  const novoTema = temaAtual() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", novoTema);
  localStorage.setItem(TEMA_STORAGE_KEY, novoTema);
  atualizarBotaoTema();
});

/* ── boot ── */
function boot() {
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  document.getElementById('agendaToday').textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const mobileNav = window.matchMedia('(max-width: 760px)');
  document.querySelector('.organize-menu').open = !mobileNav.matches;
  mobileNav.addEventListener('change', e => { document.querySelector('.organize-menu').open = !e.matches; });
  atualizarBotaoTema();
  updateSaveStatus();
  if (LOCAL_PREVIEW) {
    state = loadLocal();
    render();
    return;
  }
  onSnapshot(docRef, (docSnap) => {
    // se ainda há uma escrita local agendada (pessoa digitando), não sobrescreve
    // por cima dela com o que veio da nuvem — a nossa escrita vai sair em seguida
    if (firestoreDebounceTimer) return;
    const bruto = docSnap.exists() ? docSnap.data() : {};
    // eco da nossa própria escrita (o onSnapshot dispara pra escritas locais
    // também) — o estado já está refletido aqui, não precisa reprocessar
    if (typeof bruto._seq === "number" && bruto._seq === ultimoSeqEnviado) return;
    state = normalizarEstado(bruto);
    syncStatus = docSnap.metadata.fromCache ? "pending" : "saved";
    updateSaveStatus();
    dirty = false;
    ensureUpcomingCultos();
    render();
  }, (error) => {
    syncStatus = "error";
    updateSaveStatus();
    console.error("Erro ao escutar o banco:", error);
    state = loadLocal();
    render();
  });
}

boot();
