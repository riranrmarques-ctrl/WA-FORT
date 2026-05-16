(() => {
  try {
    const colors = {
      blue: "#1268ff",
      green: "#22c76a",
      amber: "#f0ae1b",
      red: "#ff4d63",
      violet: "#6e63ff",
    };

    const storageKey = "safeway.condominiums.v1";
    const defaultCondos = [
      {
        id: "alpha",
        name: "Residencial Alpha",
        status: "Online",
        guardsCount: 4,
        address: "Rua das Palmeiras, 120",
        city: "São Paulo",
        state: "SP",
        lat: "-23.550520",
        lng: "-46.633308",
        notes: "Condomínio piloto para ronda do perímetro externo.",
      },
      {
        id: "belle-ville",
        name: "Condomínio Belle Ville",
        status: "Online",
        guardsCount: 3,
        address: "Av. Central, 800",
        city: "São Paulo",
        state: "SP",
        lat: "-23.556200",
        lng: "-46.642900",
        notes: "",
      },
      {
        id: "panorama",
        name: "Edifício Panorama",
        status: "Online",
        guardsCount: 2,
        address: "Rua Bela Vista, 45",
        city: "São Paulo",
        state: "SP",
        lat: "-23.548800",
        lng: "-46.625900",
        notes: "",
      },
      {
        id: "jardim-flores",
        name: "Residencial Jardim das Flores",
        status: "Em atenção",
        guardsCount: 1,
        address: "Alameda das Flores, 55",
        city: "São Paulo",
        state: "SP",
        lat: "-23.561500",
        lng: "-46.638100",
        notes: "Portão lateral exige conferência manual no turno noturno.",
      },
      {
        id: "solar-aguas",
        name: "Condomínio Solar das Águas",
        status: "Offline",
        guardsCount: 0,
        address: "Rua das Águas, 410",
        city: "São Paulo",
        state: "SP",
        lat: "-23.544400",
        lng: "-46.651300",
        notes: "",
      },
    ];

    const route = [
      [90, 405],
      [90, 340],
      [165, 320],
      [180, 232],
      [300, 232],
      [315, 315],
      [438, 332],
      [610, 330],
      [612, 426],
      [715, 426],
      [795, 365],
      [820, 255],
      [735, 162],
      [525, 160],
      [512, 90],
      [302, 88],
      [300, 232],
      [165, 232],
      [165, 342],
      [90, 340],
    ];

    const guards = [
      { number: "01", name: "Carlos Eduardo", status: "Em Patrulha", path: "Bloco A → Área de Lazer", lastPoint: "09:42:01", progress: 75, color: colors.blue, routeOffset: 0.74 },
      { number: "02", name: "Marcos Vinícius", status: "Em Patrulha", path: "Estacionamento → Bloco B", lastPoint: "09:41:58", progress: 60, color: colors.green, routeOffset: 0.93 },
      { number: "03", name: "Rafael Almeida", status: "Em Patrulha", path: "Bloco C → Quadra", lastPoint: "09:42:05", progress: 45, color: colors.violet, routeOffset: 0.33 },
      { number: "04", name: "José Ferreira", status: "Em Patrulha", path: "Área Externa → Portaria", lastPoint: "09:41:50", progress: 30, color: colors.amber, routeOffset: 0.55 },
    ];

    const checkpointHistory = [
      { name: "Portaria", time: "09:15:00", done: true },
      { name: "Bloco A", time: "09:18:32", done: true },
      { name: "Playground", time: "09:23:45", done: true },
      { name: "Academia", time: "09:29:10", done: true },
      { name: "Piscina", time: "09:34:21", done: true },
      { name: "Salão de Festas", time: "Aguardando" },
      { name: "Área de Lazer", time: "Pendente" },
    ];

    let tick = 0;
    let condominiums = loadCondominiums();
    let selectedCondoId = condominiums[0]?.id || null;

    const condoList = document.getElementById("condoList");
    const plannedLayer = document.getElementById("plannedLayer");
    const completedLayer = document.getElementById("completedLayer");
    const mapCheckpoints = document.getElementById("mapCheckpoints");
    const mapGuards = document.getElementById("mapGuards");
    const activeTable = document.getElementById("activeTable");
    const checkpointHistoryEl = document.getElementById("checkpointHistory");
    const adminCondoList = document.getElementById("adminCondoList");
    const condoForm = document.getElementById("condoForm");
    const adminSearch = document.getElementById("adminSearch");
    const statusFilter = document.getElementById("statusFilter");
    const pickerMap = document.getElementById("pickerMap");
    const pickerPin = document.getElementById("pickerPin");
    const deleteCondoButton = document.getElementById("deleteCondoButton");

    function svg(tag, attrs = {}) {
      const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
      return element;
    }

    function pathFrom(points) {
      return points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
    }

    function pointAt(points, progress) {
      const looped = ((progress % 1) + 1) % 1;
      const scaled = looped * (points.length - 1);
      const index = Math.floor(scaled);
      const next = Math.min(index + 1, points.length - 1);
      const local = scaled - index;
      const [x1, y1] = points[index];
      const [x2, y2] = points[next];
      return { x: x1 + (x2 - x1) * local, y: y1 + (y2 - y1) * local };
    }

    function partialPath(points, progress) {
      const scaled = Math.min(progress, 0.98) * (points.length - 1);
      const index = Math.floor(scaled);
      const result = points.slice(0, index + 1);
      const next = Math.min(index + 1, points.length - 1);
      const local = scaled - index;
      const [x1, y1] = points[index];
      const [x2, y2] = points[next];
      result.push([x1 + (x2 - x1) * local, y1 + (y2 - y1) * local]);
      return pathFrom(result);
    }

    function loadCondominiums() {
      try {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return [...defaultCondos];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length ? parsed : [...defaultCondos];
      } catch {
        return [...defaultCondos];
      }
    }

    function saveCondominiums() {
      localStorage.setItem(storageKey, JSON.stringify(condominiums));
    }

    function activeCondo() {
      return condominiums.find((condo) => condo.id === selectedCondoId) || condominiums[0] || null;
    }

    function guardText(count) {
      const value = Number(count || 0);
      return `${value} ${value === 1 ? "vigilante ativo" : "vigilantes ativos"}`;
    }

    function statusClass(condo) {
      if (condo.status === "Offline") return " offline";
      if (condo.status === "Em atenção") return " attention";
      return "";
    }

    function renderCondos() {
      condoList.replaceChildren();
      condominiums.slice(0, 5).forEach((condo) => {
        const card = document.createElement("article");
        card.className = `condo-card${condo.id === selectedCondoId ? " active" : ""}${statusClass(condo)}`;
        card.innerHTML = `
          <div class="condo-photo"></div>
          <div>
            <strong>${condo.name}</strong>
            <span>${condo.status}</span>
            <small>${guardText(condo.guardsCount)}</small>
          </div>
        `;
        card.addEventListener("click", () => {
          selectedCondoId = condo.id;
          fillForm(condo);
          renderAllCondos();
        });
        condoList.appendChild(card);
      });
    }

    function renderAdminCondos() {
      const term = adminSearch.value.trim().toLowerCase();
      const status = statusFilter.value;
      const filtered = condominiums.filter((condo) => {
        const text = `${condo.name} ${condo.address} ${condo.city} ${condo.state}`.toLowerCase();
        return text.includes(term) && (status === "Todos" || condo.status === status);
      });

      adminCondoList.replaceChildren();
      if (!filtered.length) {
        const empty = document.createElement("div");
        empty.className = "admin-condo-card";
        empty.innerHTML = "<div><strong>Nenhum condomínio encontrado</strong><small>Altere a busca ou crie um novo cadastro.</small></div>";
        adminCondoList.appendChild(empty);
        return;
      }

      filtered.forEach((condo) => {
        const card = document.createElement("article");
        card.className = `admin-condo-card${condo.id === selectedCondoId ? " active" : ""}`;
        card.dataset.status = condo.status;
        card.innerHTML = `
          <div>
            <strong>${condo.name}</strong>
            <span>${condo.status}</span>
            <small>${condo.address || "Endereço não informado"} • ${condo.city || "Cidade"} ${condo.state || ""}</small>
            <small>${guardText(condo.guardsCount)} • ${condo.lat || "sem latitude"}, ${condo.lng || "sem longitude"}</small>
          </div>
          <div class="admin-card-actions">
            <button class="mini-button" type="button">Editar</button>
          </div>
        `;
        card.addEventListener("click", () => {
          selectedCondoId = condo.id;
          fillForm(condo);
          renderAllCondos();
        });
        adminCondoList.appendChild(card);
      });
    }

    function renderMap() {
      plannedLayer.replaceChildren();
      completedLayer.replaceChildren();
      mapCheckpoints.replaceChildren();
      mapGuards.replaceChildren();

      completedLayer.appendChild(svg("path", { class: "route-shadow", d: pathFrom(route) }));
      plannedLayer.appendChild(svg("path", { class: "route-planned", d: pathFrom(route) }));
      completedLayer.appendChild(svg("path", { class: "route-completed", d: partialPath(route, 0.75 + Math.sin(tick / 5) * 0.02) }));

      [
        { number: "01", x: 525, y: 160, color: colors.blue },
        { number: "02", x: 78, y: 342, color: colors.green },
        { number: "03", x: 398, y: 332, color: colors.violet },
        { number: "04", x: 792, y: 325, color: colors.amber },
      ].forEach((point) => {
        mapCheckpoints.appendChild(svg("circle", { class: "map-point", cx: point.x, cy: point.y, r: 20, fill: point.color }));
        const label = svg("text", { class: "map-label", x: point.x, y: point.y + 1 });
        label.textContent = point.number;
        mapCheckpoints.appendChild(label);
      });

      guards.forEach((guard) => {
        const moved = guard.routeOffset + Math.sin((tick + Number(guard.number)) / 8) * 0.005;
        const point = pointAt(route, moved);
        mapGuards.appendChild(svg("circle", { class: "guard-dot", cx: point.x, cy: point.y, r: 8, fill: guard.color }));
      });
    }

    function renderTable() {
      activeTable.replaceChildren();
      const header = document.createElement("div");
      header.className = "table-row header";
      header.innerHTML = "<span>Vigilante</span><span>Status</span><span>Percurso Atual</span><span>Último Ponto</span><span>Progresso</span>";
      activeTable.appendChild(header);

      guards.forEach((guard) => {
        const row = document.createElement("div");
        row.className = "table-row";
        row.innerHTML = `
          <span><i class="guard-chip" style="background:${guard.color}">${guard.number}</i>${guard.name}</span>
          <span class="table-status">${guard.status}</span>
          <span>${guard.path}</span>
          <span>${guard.lastPoint}</span>
          <span>${guard.progress}% <b class="mini-progress"><i style="width:${guard.progress}%"></i></b></span>
        `;
        activeTable.appendChild(row);
      });
    }

    function renderHistory() {
      checkpointHistoryEl.replaceChildren();
      checkpointHistory.forEach((point) => {
        const item = document.createElement("div");
        item.className = `checkpoint-item${point.done ? " done" : ""}`;
        item.innerHTML = `<i>${point.done ? "✓" : ""}</i><span>${point.name}</span><time>${point.time}</time>`;
        checkpointHistoryEl.appendChild(item);
      });
    }

    function updateMetricsFromCondos() {
      const condoMetric = document.querySelector(".metric-card strong");
      const activeGuardsMetric = document.getElementById("activeGuardsMetric");
      if (condoMetric) condoMetric.textContent = String(condominiums.length);
      if (activeGuardsMetric) {
        activeGuardsMetric.textContent = String(condominiums.reduce((total, condo) => total + Number(condo.guardsCount || 0), 0));
      }
    }

    function renderAllCondos() {
      renderCondos();
      renderAdminCondos();
      updateMetricsFromCondos();
    }

    function formValue(id) {
      return document.getElementById(id).value.trim();
    }

    function fillForm(condo) {
      const selected = condo || activeCondo();
      if (!selected) return;
      document.getElementById("formTitle").textContent = "Editar Condomínio";
      document.getElementById("formSubtitle").textContent = selected.name;
      document.getElementById("condoName").value = selected.name || "";
      document.getElementById("condoStatus").value = selected.status || "Online";
      document.getElementById("condoAddress").value = selected.address || "";
      document.getElementById("condoCity").value = selected.city || "";
      document.getElementById("condoState").value = selected.state || "";
      document.getElementById("condoGuards").value = String(selected.guardsCount || 0);
      document.getElementById("condoLat").value = selected.lat || "";
      document.getElementById("condoLng").value = selected.lng || "";
      document.getElementById("condoNotes").value = selected.notes || "";
      updatePickerPin(selected.lat, selected.lng);
      deleteCondoButton.disabled = condominiums.length <= 1;
    }

    function clearForm() {
      selectedCondoId = null;
      condoForm.reset();
      document.getElementById("formTitle").textContent = "Novo Condomínio";
      document.getElementById("formSubtitle").textContent = "Preencha os dados principais e marque a posição no mapa.";
      document.getElementById("condoStatus").value = "Online";
      document.getElementById("condoGuards").value = "0";
      document.getElementById("condoLat").value = "";
      document.getElementById("condoLng").value = "";
      updatePickerPin("", "");
      deleteCondoButton.disabled = true;
      renderAllCondos();
    }

    function saveForm(event) {
      event.preventDefault();
      const payload = {
        id: selectedCondoId || `condo-${Date.now()}`,
        name: formValue("condoName"),
        status: formValue("condoStatus"),
        address: formValue("condoAddress"),
        city: formValue("condoCity"),
        state: formValue("condoState").toUpperCase(),
        guardsCount: Number(formValue("condoGuards") || 0),
        lat: formValue("condoLat"),
        lng: formValue("condoLng"),
        notes: formValue("condoNotes"),
      };

      const existingIndex = condominiums.findIndex((condo) => condo.id === payload.id);
      if (existingIndex >= 0) {
        condominiums[existingIndex] = payload;
      } else {
        condominiums.unshift(payload);
      }

      selectedCondoId = payload.id;
      saveCondominiums();
      fillForm(payload);
      renderAllCondos();
    }

    function deleteSelectedCondo() {
      if (!selectedCondoId || condominiums.length <= 1) return;
      condominiums = condominiums.filter((condo) => condo.id !== selectedCondoId);
      selectedCondoId = condominiums[0]?.id || null;
      saveCondominiums();
      fillForm(activeCondo());
      renderAllCondos();
    }

    function updatePickerPin(lat, lng) {
      const latNumber = Number(String(lat).replace(",", "."));
      const lngNumber = Number(String(lng).replace(",", "."));
      const hasCoordinates = Number.isFinite(latNumber) && Number.isFinite(lngNumber);
      const x = hasCoordinates ? 50 + Math.max(-20, Math.min(20, (lngNumber + 46.63) * 120)) : 50;
      const y = hasCoordinates ? 50 - Math.max(-20, Math.min(20, (latNumber + 23.55) * 120)) : 50;
      pickerPin.style.left = `${x}%`;
      pickerPin.style.top = `${y}%`;
    }

    function setCoordinatesFromMap(event) {
      const rect = pickerMap.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const lat = -23.55 + (0.5 - y) / 120;
      const lng = -46.63 + (x - 0.5) / 120;
      document.getElementById("condoLat").value = lat.toFixed(6);
      document.getElementById("condoLng").value = lng.toFixed(6);
      updatePickerPin(lat, lng);
    }

    function updateClock() {
      const now = new Date();
      const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      document.getElementById("sidebarClock").textContent = time;
      document.getElementById("mapAge").textContent = String(10 + (tick % 4));
      document.getElementById("finishedRoutesMetric").textContent = String(156 + (tick % 3));
      document.getElementById("detailProgressText").textContent = `${75 + (tick % 2)}%`;
      document.getElementById("detailProgressBar").style.width = `${75 + (tick % 2)}%`;
    }

    function setView(viewName) {
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
      document.getElementById(`${viewName}View`)?.classList.add("active");
      document.querySelectorAll("[data-view-button]").forEach((button) => {
        button.classList.toggle("active", button.dataset.viewButton === viewName);
      });
      if (viewName === "condominiums") {
        fillForm(activeCondo());
        renderAllCondos();
      }
    }

    function render() {
      tick += 1;
      renderMap();
      updateClock();
    }

    document.querySelectorAll("[data-view-button]").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.viewButton));
    });
    document.getElementById("newCondoButton").addEventListener("click", clearForm);
    document.getElementById("resetFormButton").addEventListener("click", clearForm);
    condoForm.addEventListener("submit", saveForm);
    deleteCondoButton.addEventListener("click", deleteSelectedCondo);
    adminSearch.addEventListener("input", renderAdminCondos);
    statusFilter.addEventListener("change", renderAdminCondos);
    pickerMap.addEventListener("click", setCoordinatesFromMap);
    document.getElementById("condoLat").addEventListener("input", () => updatePickerPin(formValue("condoLat"), formValue("condoLng")));
    document.getElementById("condoLng").addEventListener("input", () => updatePickerPin(formValue("condoLat"), formValue("condoLng")));

    renderAllCondos();
    renderTable();
    renderHistory();
    fillForm(activeCondo());
    render();
    setInterval(render, 1200);
    window.safewayPanelReady = true;
  } catch (error) {
    window.safewayPanelError = String(error && error.stack || error);
    const message = document.createElement("pre");
    message.style.cssText = "position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;padding:16px;border:1px solid #ff4d63;border-radius:8px;background:#180b10;color:#ffd6dc;white-space:pre-wrap";
    message.textContent = window.safewayPanelError;
    document.body.appendChild(message);
  }
})();
