const SUPABASE_URL = "https://ivwivgngihqcmisemlny.supabase.co";
const SUPABASE_KEY = "sb_publishable_sJIvcD9LtecNyQi4F2EHbQ_b6DTVZQR";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const tipoFiltro = document.querySelector("select");

const dataInicial =
  document.querySelectorAll("input[type='date']")[0];

const dataFinal =
  document.querySelectorAll("input[type='date']")[1];

const btnConsultar =
  document.querySelector(".btn-primary");

const cardsResumo =
  document.querySelectorAll(".card-resumo strong");

const areaResultado =
  document.querySelector(
    "section.area-vigilantes > div:last-child"
  );

btnConsultar.addEventListener(
  "click",
  consultarRelatorios
);

document.addEventListener(
  "DOMContentLoaded",
  () => {
    definirPeriodoInicial();
    consultarRelatorios();
  }
);

function definirPeriodoInicial() {
  const hoje = new Date();

  const hojeFormatado =
    hoje.toISOString().slice(0, 10);

  dataInicial.value = hojeFormatado;
  dataFinal.value = hojeFormatado;
}

async function consultarRelatorios() {
  const inicio = dataInicial.value;
  const fim = dataFinal.value;

  if (!inicio || !fim) {
    alert("Selecione o período.");
    return;
  }

  const inicioISO = `${inicio}T00:00:00`;
  const fimISO = `${fim}T23:59:59`;

  const { data, error } =
    await supabaseClient
      .from("rotas_concluidas")
      .select("*")
      .gte("created_at", inicioISO)
      .lte("created_at", fimISO)
      .order("created_at", {
        ascending: false
      });

  if (error) {
    console.error(error);
    alert("Erro ao consultar relatórios.");
    return;
  }

  const rotas = data || [];

  atualizarResumo(rotas);

  renderizarRelatorio(rotas);
}

function atualizarResumo(rotas) {
  const totalRotas = rotas.length;

  const tempoMedio =
    calcularTempoMedio(rotas);

  const vigilantes =
    new Set(
      rotas
        .map(r => r.vigilante)
        .filter(Boolean)
    ).size;

  const ocorrencias =
    rotas.reduce((total, rota) => {
      return (
        total +
        Number(rota.ocorrencias || 0)
      );
    }, 0);

  if (cardsResumo[0]) {
    cardsResumo[0].textContent =
      totalRotas;
  }

  if (cardsResumo[1]) {
    cardsResumo[1].textContent =
      `${tempoMedio}min`;
  }

  if (cardsResumo[2]) {
    cardsResumo[2].textContent =
      vigilantes;
  }

  if (cardsResumo[3]) {
    cardsResumo[3].textContent =
      ocorrencias;
  }
}

function renderizarRelatorio(rotas) {
  if (!areaResultado) return;

  let html = `
    <div style="
      display:grid;
      grid-template-columns:
      1.2fr 1fr 1fr 1fr 1fr;
      gap:12px;
      color:#91a7bd;
      font-size:14px;
      padding:0 0 14px;
      border-bottom:1px solid #173552;
    ">
      <strong>Rota</strong>
      <strong>Vigilante</strong>
      <strong>Condomínio</strong>
      <strong>Data</strong>
      <strong>Tempo</strong>
    </div>
  `;

  if (!rotas.length) {
    html += `
      <div style="
        padding:40px;
        text-align:center;
        color:#91a7bd;
        border:1px dashed #25415f;
        border-radius:14px;
        margin-top:20px;
      ">
        Nenhuma rota concluída encontrada
        nesse período.
      </div>
    `;

    areaResultado.innerHTML = html;
    return;
  }

  rotas.forEach((rota) => {
    html += `
      <div style="
        display:grid;
        grid-template-columns:
        1.2fr 1fr 1fr 1fr 1fr;
        gap:12px;
        align-items:center;
        padding:16px 0;
        border-bottom:1px solid #173552;
        color:#e8f1ff;
        font-size:14px;
      ">

        <div>
          <strong>
            ${rota.rota || "Sem nome"}
          </strong>

          <br>

          <small style="
            color:#91a7bd;
          ">
            ${
              rota.pontos_concluidos || 0
            } pontos concluídos
          </small>
        </div>

        <div>
          ${rota.vigilante || "-"}
        </div>

        <div>
          ${rota.condominio || "-"}
        </div>

        <div>
          ${formatarData(
            rota.created_at
          )}
        </div>

        <div>
          ${
            rota.tempo_percurso || "-"
          } min
        </div>

      </div>
    `;
  });

  areaResultado.innerHTML = html;
}

function calcularTempoMedio(rotas) {
  if (!rotas.length) return 0;

  const tempos = rotas
    .map(r =>
      Number(
        rotaNumero(r.tempo_percurso)
      )
    )
    .filter(t => t > 0);

  if (!tempos.length) return 0;

  const soma =
    tempos.reduce(
      (total, tempo) =>
        total + tempo,
      0
    );

  return Math.round(
    soma / tempos.length
  );
}

function rotaNumero(valor) {
  const numero = Number(valor);

  if (isNaN(numero)) return 0;

  return numero;
}

function formatarData(data) {
  if (!data) return "-";

  return new Date(data)
    .toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    });
}
