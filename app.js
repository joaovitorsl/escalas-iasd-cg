import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjs-et-tcz6ggSxQ54TZOpvpXQLJ2p-NI",
  authDomain: "escala-central-745a9.firebaseapp.com",
  projectId: "escala-central-745a9",
  storageBucket: "escala-central-745a9.firebasestorage.app",
  messagingSenderId: "926450456877",
  appId: "1:926450456877:web:f4ff8ec7a1455e29fe5ba4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Referência para o nosso documento único no banco
const docRef = doc(db, "iasd_cg", "estado_global");

/* ─────────────────────────────────────────────────────────
   Escalas · Viver e Louvar — app.js
   Gerenciador de escalas do TIME DE MÚSICA (instrumentos + vozes)
   100% client-side. Sem backend: estado vive em localStorage e é
   exportado/aberto como arquivo .json ao clicar em Salvar/Abrir arquivo.

   Fora de escopo de propósito: pregador, ancião, diácono, sonoplastia,
   transmissão, recepção etc. — a escala completa da igreja é mais
   complexa que isso, mas aqui o foco é só a parte de música. Esses
   papéis ainda podem ser anotados como texto livre no "programa" do
   culto (ex: "Pregação — Pr. Paulo"), só não têm sorteio/substituição.
   ───────────────────────────────────────────────────────── */

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
const STATUS_LABEL = { aberto: "Aberto", convidado: "Convidado", confirmado: "Confirmado", recusado: "Recusado" };

/* modelos padrão de programa (ordem do culto), um por tipo de culto recorrente */
const PROGRAMA_PADRAO = {
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

const NOMES_MODELO_PADRAO = {
  "dom-noite": "Domingo à Noite",
  "qua-noite": "Quarta à Noite",
  "sab-manha": "Sábado de Manhã",
};

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
                musicas: Array.isArray(item.musicas) ? item.musicas : [],
              }
        )
      : [],
  };
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

  const cultos = (bruto.cultos || []).map((c) => ({ ministranteId: null, especial: false, grupoMusicalId: null, temaId: null, ...c, programa: Array.isArray(c.programa) ? c.programa : [] }));
  // cultos criados antes do recurso de "programa" existir (ou vindos de um
  // arquivo antigo) ficam com programa vazio — preenche com o modelo padrão
  // do tipo de culto, já que o objetivo é só completar pessoas/músicas depois
  cultos.forEach((c) => {
    if (!c.especial && !c.programa.length && c.tipoCultoId) {
      const tipo = tiposCulto.find((t) => t.id === c.tipoCultoId);
      c.programa = programaDoModelo((tipo && tipo.modeloProgramaId) || c.tipoCultoId);
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
let viewMode = "lista"; // "lista" | "calendario"
let calMes = null; // Date do 1º dia do mês exibido no calendário
let fileHandle = null;
let fileName = null;
let dirty = false;
let lastSavedAt = null;
const suggestOpen = new Set();
const programaAberto = new Set();

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
async function persistLocal() {
  try {
    await setDoc(docRef, state);
  } catch (e) {
    console.error("Erro ao salvar na nuvem: ", e);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); 
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
    if (dirty && !confirm("Você tem alterações não salvas neste navegador. Importar este arquivo vai substituí-las. Continuar?")) {
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

function baixarCopia() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "escalas-iasd-cg.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function updateSaveStatus() {
  const el = document.getElementById("saveStatus");
  if (!el) return;
  if (dirty) {
    el.textContent = "Alterações guardadas neste navegador — clique em Salvar para exportar o arquivo";
  } else if (lastSavedAt) {
    const hora = lastSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    el.textContent = `Salvo${fileName ? " em " + fileName : ""} às ${hora}`;
  } else if (fileName) {
    el.textContent = `Aberto: ${fileName}`;
  } else {
    el.textContent = "Nenhum arquivo aberto (dados guardados neste navegador)";
  }
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
        state.cultos.push({
          id: uid(),
          tipoCultoId: tipo.id,
          data,
          hora: tipo.hora,
          nome: tipo.nome,
          especial: false,
          slots: defaultSlots(),
          programa: defaultPrograma(tipo.modeloProgramaId || tipo.id),
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
  if (culto.grupoMusicalId) return "esc-cal-ok";
  const preenchido = culto.slots.some((s) => s.membroId);
  if (!preenchido) return "esc-cal-vazio";
  const temPianoOuViolao = culto.slots.some((s) => s.tipo === "instrumento" && (s.instrumento === "piano" || s.instrumento === "violao") && s.membroId);
  return temPianoOuViolao ? "esc-cal-ok" : "esc-cal-alerta";
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
      <select data-action="assign-slot" data-culto="${culto.id}" data-slot="${slot.id}">${options}</select>
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
    return `<div class="esc-ministra"><span class="esc-ministra-label">Quem ministra</span><em class="esc-ministra-vazio">escale alguém primeiro</em></div>`;
  }
  const opcoes = membrosAtribuidos
    .map((m) => `<option value="${m.id}" ${m.id === culto.ministranteId ? "selected" : ""}>${escapeHtml(m.nome)}${m.podeMinistrar ? " ★" : ""}</option>`)
    .join("");
  return `<div class="esc-ministra">
    <span class="esc-ministra-label">Quem ministra</span>
    <select data-action="set-ministrante" data-culto="${culto.id}">
      <option value="">— a definir —</option>
      ${opcoes}
    </select>
  </div>`;
}

/* ── render: Escalas · programa (ordem do culto) ── */
function programaLinhaHtml(culto, item, idx, total) {
  const acoes = `
    <span class="esc-prog-linha-acoes">
      <button data-action="prog-subir" data-culto="${culto.id}" data-item="${item.id}" ${idx === 0 ? "disabled" : ""} title="Mover para cima">↑</button>
      <button data-action="prog-descer" data-culto="${culto.id}" data-item="${item.id}" ${idx === total - 1 ? "disabled" : ""} title="Mover para baixo">↓</button>
      <button data-action="prog-remover" data-culto="${culto.id}" data-item="${item.id}" class="esc-danger" title="Remover linha">×</button>
    </span>`;

  if (item.tipo === "secao") {
    return `
      <tr class="esc-prog-secao">
        <td colspan="4">
          <input type="text" class="esc-prog-secao-input" value="${escapeHtml(item.titulo)}" data-action="prog-titulo" data-culto="${culto.id}" data-item="${item.id}" />
        </td>
        <td>${acoes}</td>
      </tr>`;
  }
  return `
    <tr>
      <td><input type="text" class="esc-prog-hora" value="${escapeHtml(item.hora || "")}" placeholder="hh:mm" data-action="prog-hora" data-culto="${culto.id}" data-item="${item.id}" /></td>
      <td><input type="text" value="${escapeHtml(item.nome || "")}" placeholder="Momento" data-action="prog-nome" data-culto="${culto.id}" data-item="${item.id}" /></td>
      <td><input type="text" value="${escapeHtml(item.responsavel || "")}" placeholder="Responsável" data-action="prog-responsavel" data-culto="${culto.id}" data-item="${item.id}" /></td>
      <td><textarea rows="1" placeholder="Uma música por linha" data-action="prog-musicas" data-culto="${culto.id}" data-item="${item.id}">${escapeHtml((item.musicas || []).join("\n"))}</textarea></td>
      <td>${acoes}</td>
    </tr>`;
}

function programaTabelaHtml(culto) {
  const itens = culto.programa || [];
  const linhas = itens.map((item, idx) => programaLinhaHtml(culto, item, idx, itens.length)).join("");
  return `
    <div class="esc-programa">
      <table class="esc-prog-tabela">
        <thead><tr><th>Hora</th><th>Momento</th><th>Responsável</th><th>Música(s)</th><th></th></tr></thead>
        <tbody>${linhas || `<tr><td colspan="5" class="esc-prog-vazio">Sem programa definido ainda.</td></tr>`}</tbody>
      </table>
      <div class="esc-prog-add">
        <button class="esc-link" data-action="prog-add-momento" data-culto="${culto.id}">+ momento</button>
        <button class="esc-link" data-action="prog-add-secao" data-culto="${culto.id}">+ seção</button>
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

function cultoCardHtml(culto) {
  const especialTag = culto.especial ? `<span class="tag">especial</span>` : "";
  const tema = culto.temaId ? state.temasCulto.find((t) => t.id === culto.temaId) : null;
  const temaTag = tema ? `<span class="tag">${escapeHtml(tema.nome)}</span>` : "";
  const programaAbertoAqui = programaAberto.has(culto.id);
  const grupo = culto.grupoMusicalId ? state.gruposMusicais.find((g) => g.id === culto.grupoMusicalId) : null;
  const temGrupo = !!culto.grupoMusicalId;

  const acoesEscala = temGrupo
    ? ""
    : `<button class="btn-outline esc-btn-sm" data-action="autofill" data-culto="${culto.id}">Gerar automaticamente</button>
       <button class="btn-outline esc-btn-sm" data-action="reroll" data-culto="${culto.id}">Sortear de novo</button>
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
    <article class="esc-culto-card" data-culto-id="${culto.id}">
      <header class="esc-culto-head">
        <div>
          <span class="esc-culto-data">${formatDataLonga(culto.data)} · ${escapeHtml(culto.hora)}</span>
          <h3>${escapeHtml(culto.nome)} ${especialTag} ${temaTag}</h3>
          ${temaSelectHtml(culto)}
          ${temGrupo ? "" : ministranteSelectHtml(culto)}
          ${grupoMusicalSelectHtml(culto)}
        </div>
        <div class="esc-culto-actions">
          ${acoesEscala}
          <button class="esc-icon-btn" data-action="delete-culto" data-culto="${culto.id}" title="Remover culto da agenda">×</button>
        </div>
      </header>
      ${corpoEscala}
      <div class="esc-prog-toggle-wrap">
        <button class="esc-link" data-action="toggle-programa" data-culto="${culto.id}">${programaAbertoAqui ? "ocultar programa do culto ▴" : "ver / editar programa do culto ▾"}</button>
      </div>
      ${programaAbertoAqui ? programaTabelaHtml(culto) : ""}
    </article>`;
}

/* ── render: Escalas · lista e calendário ── */
function renderListaCultos() {
  const mostrarPassados = document.getElementById("chkPassados").checked;
  const hojeISO = todayISO();
  const lista = state.cultos
    .filter((c) => mostrarPassados || c.data >= hojeISO)
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

  const container = document.getElementById("cultosList");
  if (!state.membros.length) {
    container.innerHTML = `<p class="esc-empty">Cadastre a equipe na aba <strong style="color:var(--text)">Equipe</strong> para começar a preencher as vagas (ou carregue dados de exemplo em Configurações).</p>`;
    return;
  }
  if (!lista.length) {
    container.innerHTML = `<p class="esc-empty">Nenhum culto ${mostrarPassados ? "" : "futuro "}encontrado. Confira os tipos de culto em Configurações.</p>`;
    return;
  }
  container.innerHTML = lista.map(cultoCardHtml).join("");
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
          `<button class="esc-cal-badge ${classeSaudeCulto(c)}" data-action="ir-para-culto" data-culto="${c.id}" title="${escapeHtml(c.nome)} · ${escapeHtml(c.hora)}">${escapeHtml(c.nome)}</button>`
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
  if (modo === "calendario") renderCalendario();
}

function renderEscalas() {
  ensureUpcomingCultos();
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
  renderGruposMusicais();
  renderTemasCulto();
  renderModelosPrograma();
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
      <td><textarea rows="1" placeholder="Uma música por linha" data-action="modelo-item-musicas" data-modelo="${modelo.id}" data-item="${item.id}">${escapeHtml((item.musicas || []).join("\n"))}</textarea></td>
      <td>${acoes}</td>
    </tr>`;
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

/* ── despacho geral de render ── */
function render() {
  atualizarOpcoesModeloEspecial();
  if (activeTab === "escalas") renderEscalas();
  else if (activeTab === "equipe") renderEquipe();
  else renderConfig();
}

/* ── abas ── */
document.getElementById("tabsNav").addEventListener("click", (e) => {
  const btn = e.target.closest(".esc-tab");
  if (!btn) return;
  activeTab = btn.dataset.tab;
  document.querySelectorAll(".esc-tab").forEach((b) => b.classList.toggle("active", b === btn));
  document.querySelectorAll(".esc-panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + activeTab));
  render();
});

/* ── eventos: Escalas · toggle lista/calendário + navegação de mês ── */
document.getElementById("btnVerLista").addEventListener("click", () => setViewMode("lista"));
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
  setViewMode("lista");
  renderListaCultos();
  requestAnimationFrame(() => {
    const cardEl = document.querySelector(`.esc-culto-card[data-culto-id="${el.dataset.culto}"]`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
      cardEl.classList.add("esc-culto-destacado");
      setTimeout(() => cardEl.classList.remove("esc-culto-destacado"), 1600);
    }
  });
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
  }
});

cultosList.addEventListener("input", (e) => {
  const el = e.target;
  const culto = el.dataset.culto ? state.cultos.find((c) => c.id === el.dataset.culto) : null;
  if (!culto || !el.dataset.item) return;
  const item = (culto.programa || []).find((i) => i.id === el.dataset.item);
  if (!item) return;
  const action = el.dataset.action;
  if (action === "prog-hora") item.hora = el.value;
  else if (action === "prog-nome") item.nome = el.value;
  else if (action === "prog-responsavel") item.responsavel = el.value;
  else if (action === "prog-titulo") item.titulo = el.value;
  else if (action === "prog-musicas") item.musicas = el.value.split("\n").map((s) => s.trim()).filter(Boolean);
  else return;
  markDirty();
});

cultosList.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const culto = el.dataset.culto ? state.cultos.find((c) => c.id === el.dataset.culto) : null;
  const slot = culto && el.dataset.slot ? culto.slots.find((s) => s.id === el.dataset.slot) : null;
  const action = el.dataset.action;

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

document.getElementById("chkPassados").addEventListener("change", renderListaCultos);

document.getElementById("btnNovoEspecial").addEventListener("click", () => {
  document.getElementById("especialForm").hidden = false;
});
document.getElementById("especialCancelar").addEventListener("click", () => {
  document.getElementById("especialForm").hidden = true;
});
document.getElementById("especialSalvar").addEventListener("click", () => {
  const nome = document.getElementById("especialNome").value.trim() || "Culto especial";
  const data = document.getElementById("especialData").value;
  const hora = document.getElementById("especialHora").value || "19:30";
  const modelo = document.getElementById("especialModelo").value;
  if (!data) {
    alert("Escolha uma data.");
    return;
  }
  state.cultos.push({
    id: uid(),
    tipoCultoId: null,
    data,
    hora,
    nome,
    especial: true,
    slots: defaultSlots(),
    programa: defaultPrograma(modelo),
    ministranteId: null,
    grupoMusicalId: null,
    temaId: null,
  });
  document.getElementById("especialNome").value = "";
  document.getElementById("especialData").value = "";
  document.getElementById("especialModelo").value = "";
  document.getElementById("especialForm").hidden = true;
  markDirty();
  render();
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
  else if (action === "modelo-item-musicas") item.musicas = el.value.split("\n").map((s) => s.trim()).filter(Boolean);
  else return;
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
      renderConfig();
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
  renderConfig();
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
  document.getElementById("btnTema").textContent = temaAtual() === "dark" ? "☀️" : "🌙";
}
document.getElementById("btnTema").addEventListener("click", () => {
  const novoTema = temaAtual() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", novoTema);
  localStorage.setItem(TEMA_STORAGE_KEY, novoTema);
  atualizarBotaoTema();
});

/* ── boot ── */
// Substitua o seu boot() atual por este:
function boot() {
  atualizarBotaoTema();
  updateSaveStatus();
  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      state = normalizarEstado(docSnap.data());
    } else {
      state = novoEstado();
    }
    
    dirty = false;
    ensureUpcomingCultos();
    render();
  }, (error) => {
    console.error("Erro ao escutar o banco:", error);
    state = loadLocal(); 
    render();
  });
}

boot();
boot();
