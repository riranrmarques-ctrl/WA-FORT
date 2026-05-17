const SUPABASE_URL = "https://ivwivgngihqcmisemlny.supabase.co";
const SUPABASE_KEY = "sb_publishable_sJIvcD9LtecNyQi4F2EHbQ_b6DTVZQR";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const listaOcorrencias = document.querySelector(".lista-vigilantes");
const campoBusca = document.querySelector(".busca input");

const cardsResumo = document.querySelectorAll(".card-resumo strong");

let ocorrenciasCache = [];

document.addEventListener("DOMContentLoaded", () => {
  carregarOcorrencias();

  if (campoBusca) {
    campoBusca.addEventListener("input", filtrarOcorrencias);
  }

  setInterval(carregarOcorrencias, 30000);
});

async function carregarOcorrencias() {
  const { data, error } = await supabaseClient
    .from("ocorrencias")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar ocorrências:", error);
    return;
  }

  ocorrenciasCache = data || [];

  atualizarResumo(ocorrenciasCache);
  renderizarOcorrencias(ocorrenciasCache);
}

function atualizarResumo(ocorrencias) {
  const abertas = ocorrencias.filter(o => o.status === "aberta").length;
  const atendimento = ocorrencias.filter(o => o.status === "em_atendimento").length;
  const resolvidasHoje = ocorrencias.filter(o => {
    if (o.status !== "resolvida" || !o.updated_at) return false;

    const hoje = new Date().toISOString().slice(0, 10);
    return o.updated_at.slice(0, 10) === hoje;
  }).length;

  const altaPrioridade = ocorrencias.filter(o => o.prioridade === "alta").length;

  if (cardsResumo[0]) cardsResumo[0].textContent = abertas;
  if (cardsResumo[1]) cardsResumo[1].textContent = atendimento;
  if (cardsResumo[2]) cardsResumo[2].textContent = resolvidasHoje;
  if (cardsResumo[3]) cardsResumo[3].textContent = altaPrioridade;
}

function renderizarOcorrencias(ocorrencias) {
  if (!listaOcorrencias) return;

  listaOcorrencias.innerHTML = "";

  if (!ocorrencias.length) {
    listaOcorrencias.innerHTML = `
      <div class="vazio">
        Nenhuma ocorrência recebida ainda.
      </div>
    `;
    return;
  }

  ocorrencias.forEach((ocorrencia) => {
    const card = document.createElement("div");
    card.className = `card-vigilante ${classeStatus(ocorrencia.status)}`;

    card.innerHTML = `
      <div class="card-cabecalho">
        <div style="display:flex; gap:14px;">
          <div class="codigo-box">
            △
          </div>

          <div class="info-card">
            <h3>${ocorrencia.tipo || "Ocorrência"}</h3>
            <p>${ocorrencia.condominio || "Condomínio não informado"}</p>
          </div>
        </div>

        <div class="status ${classeStatus(ocorrencia.status)}">
          ${formatarStatus(ocorrencia.status)}
        </div>
      </div>

      <div class="dados-turno">
        <span>Enviado por</span>
        <strong>${ocorrencia.vigilante || "Vigilante não informado"}</strong>

        <span>Descrição</span>
        <small>${ocorrencia.descricao || "Sem descrição"}</small>

        <br><br>

        <span>Data e horário</span>
        <small>${formatarData(ocorrencia.created_at)}</small>
      </div>

      <div class="acoes-card">
        <button onclick="alterarStatus('${ocorrencia.id}', 'em_atendimento')">
          Atender
        </button>

        <button onclick="alterarStatus('${ocorrencia.id}', 'resolvida')">
          Resolver
        </button>
      </div>
    `;

    listaOcorrencias.appendChild(card);
  });
}

function filtrarOcorrencias() {
  const termo = campoBusca.value.toLowerCase().trim();

  if (!termo) {
    renderizarOcorrencias(ocorrenciasCache);
    return;
  }

  const filtradas = ocorrenciasCache.filter(o =>
    String(o.tipo || "").toLowerCase().includes(termo) ||
    String(o.condominio || "").toLowerCase().includes(termo) ||
    String(o.vigilante || "").toLowerCase().includes(termo) ||
    String(o.descricao || "").toLowerCase().includes(termo)
  );

  renderizarOcorrencias(filtradas);
}

async function alterarStatus(id, status) {
  const { error } = await supabaseClient
    .from("ocorrencias")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar ocorrência:", error);
    alert("Erro ao atualizar ocorrência.");
    return;
  }

  carregarOcorrencias();
}

function classeStatus(status) {
  if (status === "resolvida") return "ativo";
  if (status === "em_atendimento") return "aguardando";
  return "offline";
}

function formatarStatus(status) {
  if (status === "resolvida") return "RESOLVIDA";
  if (status === "em_atendimento") return "EM ATENDIMENTO";
  return "ABERTA";
}

function formatarData(data) {
  if (!data) return "-";

  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}
