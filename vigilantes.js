const SUPABASE_URL = "SUA_URL";
const SUPABASE_KEY = "SUA_KEY";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const listaVigilantes = document.getElementById("listaVigilantes");

const modal = document.getElementById("modalVigilante");
const btnNovoVigilante = document.getElementById("btnNovoVigilante");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnCancelar = document.getElementById("btnCancelar");

const form = document.getElementById("formVigilante");

const campoBusca = document.getElementById("campoBusca");

const vigilanteId = document.getElementById("vigilanteId");

const codigoVigilante = document.getElementById("codigoVigilante");
const nomeDispositivo = document.getElementById("nomeDispositivo");
const nomeCondominio = document.getElementById("nomeCondominio");

const agenteTurno1 = document.getElementById("agenteTurno1");
const inicioTurno1 = document.getElementById("inicioTurno1");

const agenteTurno2 = document.getElementById("agenteTurno2");
const inicioTurno2 = document.getElementById("inicioTurno2");

const totalVigilantes = document.getElementById("totalVigilantes");
const totalDispositivos = document.getElementById("totalDispositivos");
const totalAgentes = document.getElementById("totalAgentes");
const totalAguardando = document.getElementById("totalAguardando");

btnNovoVigilante.addEventListener("click", abrirNovoModal);

btnFecharModal.addEventListener("click", fecharModal);
btnCancelar.addEventListener("click", fecharModal);

campoBusca.addEventListener("input", buscarVigilantes);

form.addEventListener("submit", salvarVigilante);

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    fecharModal();
  }
});

async function carregarVigilantes() {
  const { data, error } = await supabaseClient
    .from("vigilantes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  renderizarVigilantes(data || []);
}

function renderizarVigilantes(vigilantes) {
  listaVigilantes.innerHTML = "";

  if (!vigilantes.length) {
    listaVigilantes.innerHTML = `
      <div class="vazio">
        Nenhum vigilante cadastrado ainda.
      </div>
    `;

    atualizarResumo([]);
    return;
  }

  vigilantes.forEach((vigilante) => {
    const agenteAtual = obterAgenteAtual(vigilante);

    const status =
      !vigilante.nome_dispositivo
        ? "aguardando"
        : "ativo";

    const card = document.createElement("div");

    card.className = `card-vigilante ${status}`;

    card.innerHTML = `
      <div class="card-cabecalho">
        <div style="display:flex; gap:14px;">
          <div class="codigo-box">
            ${vigilante.codigo}
          </div>

          <div class="info-card">
            <h3>${vigilante.nome_condominio || "Sem condomínio"}</h3>

            <p>
              ${vigilante.nome_dispositivo || "Sem dispositivo"}
            </p>
          </div>
        </div>

        <div class="status ${status}">
          ${status === "ativo"
            ? "ATIVO"
            : "AGUARDANDO"}
        </div>
      </div>

      <div class="dados-turno">
        <span>Agente em turno</span>

        <strong>
          ${agenteAtual.nome}
        </strong>

        <small>
          ${agenteAtual.periodo}
        </small>
      </div>

      <div class="acoes-card">
        <button onclick="editarVigilante('${vigilante.id}')">
          Editar
        </button>

        <button
          class="excluir"
          onclick="excluirVigilante('${vigilante.id}')"
        >
          Excluir
        </button>
      </div>
    `;

    listaVigilantes.appendChild(card);
  });

  atualizarResumo(vigilantes);
}

function atualizarResumo(vigilantes) {
  totalVigilantes.textContent = vigilantes.length;

  totalDispositivos.textContent =
    vigilantes.filter(v => v.nome_dispositivo).length;

  totalAgentes.textContent =
    vigilantes.filter(v =>
      v.agente_turno_1 || v.agente_turno_2
    ).length;

  totalAguardando.textContent =
    vigilantes.filter(v => !v.nome_dispositivo).length;
}

function obterAgenteAtual(vigilante) {
  const agora = new Date();

  const hora = agora.getHours();
  const minuto = agora.getMinutes();

  const horarioAtual = `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;

  const turno1 = vigilante.inicio_turno_1 || "07:00";
  const turno2 = vigilante.inicio_turno_2 || "19:00";

  if (horarioAtual >= turno1 && horarioAtual < turno2) {
    return {
      nome: vigilante.agente_turno_1 || "Não definido",
      periodo: `${turno1} até ${turno2}`
    };
  }

  return {
    nome: vigilante.agente_turno_2 || "Não definido",
    periodo: `${turno2} até ${turno1}`
  };
}

function abrirNovoModal() {
  form.reset();

  vigilanteId.value = "";

  codigoVigilante.value = gerarCodigo();

  modal.classList.add("ativo");
}

function fecharModal() {
  modal.classList.remove("ativo");
}

function gerarCodigo() {
  return Math.floor(
    1000 + Math.random() * 9000
  ).toString();
}

async function salvarVigilante(e) {
  e.preventDefault();

  const payload = {
    codigo: codigoVigilante.value,
    nome_dispositivo: nomeDispositivo.value,
    nome_condominio: nomeCondominio.value,

    agente_turno_1: agenteTurno1.value,
    inicio_turno_1: inicioTurno1.value,

    agente_turno_2: agenteTurno2.value,
    inicio_turno_2: inicioTurno2.value
  };

  if (vigilanteId.value) {
    const { error } = await supabaseClient
      .from("vigilantes")
      .update(payload)
      .eq("id", vigilanteId.value);

    if (error) {
      console.error(error);
      alert("Erro ao atualizar vigilante.");
      return;
    }
  } else {
    const { error } = await supabaseClient
      .from("vigilantes")
      .insert(payload);

    if (error) {
      console.error(error);
      alert("Erro ao criar vigilante.");
      return;
    }
  }

  fecharModal();

  carregarVigilantes();
}

async function editarVigilante(id) {
  const { data, error } = await supabaseClient
    .from("vigilantes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error(error);
    return;
  }

  vigilanteId.value = data.id;

  codigoVigilante.value = data.codigo || "";

  nomeDispositivo.value =
    data.nome_dispositivo || "";

  nomeCondominio.value =
    data.nome_condominio || "";

  agenteTurno1.value =
    data.agente_turno_1 || "";

  inicioTurno1.value =
    data.inicio_turno_1 || "07:00";

  agenteTurno2.value =
    data.agente_turno_2 || "";

  inicioTurno2.value =
    data.inicio_turno_2 || "19:00";

  modal.classList.add("ativo");
}

async function excluirVigilante(id) {
  const confirmar = confirm(
    "Deseja realmente excluir este vigilante?"
  );

  if (!confirmar) return;

  const { error } = await supabaseClient
    .from("vigilantes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao excluir.");
    return;
  }

  carregarVigilantes();
}

async function buscarVigilantes() {
  const termo = campoBusca.value.trim();

  if (!termo) {
    carregarVigilantes();
    return;
  }

  const { data, error } = await supabaseClient
    .from("vigilantes")
    .select("*")
    .or(`
      codigo.ilike.%${termo}%,
      nome_dispositivo.ilike.%${termo}%,
      agente_turno_1.ilike.%${termo}%,
      agente_turno_2.ilike.%${termo}%
    `);

  if (error) {
    console.error(error);
    return;
  }

  renderizarVigilantes(data || []);
}

carregarVigilantes();

setInterval(() => {
  carregarVigilantes();
}, 30000);
