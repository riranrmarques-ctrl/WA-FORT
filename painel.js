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
        deviceLinked: true,
        address: "Rua das Palmeiras, 120",
        city: "São Paulo",
        state: "SP",
        image: "",
        googleAreaLat: "",
        googleAreaLng: "",
        googleMapType: "k",
        googleMapZoom: "18",
        notes: "Condomínio piloto para ronda do perímetro externo.",
      },
      {
        id: "belle-ville",
        name: "Condomínio Belle Ville",
        deviceLinked: true,
        address: "Av. Central, 800",
        city: "São Paulo",
        state: "SP",
        image: "",
        googleAreaLat: "",
        googleAreaLng: "",
        googleMapType: "k",
        googleMapZoom: "18",
        notes: "",
      },
      {
        id: "panorama",
        name: "Edifício Panorama",
        deviceLinked: true,
        address: "Rua Bela Vista, 45",
        city: "São Paulo",
        state: "SP",
        image: "",
        googleAreaLat: "",
        googleAreaLng: "",
        googleMapType: "k",
        googleMapZoom: "18",
        notes: "",
      },
      {
        id: "jardim-flores",
        name: "Residencial Jardim das Flores",
        deviceLinked: false,
        address: "Alameda das Flores, 55",
        city: "São Paulo",
        state: "SP",
        image: "",
        googleAreaLat: "",
        googleAreaLng: "",
        googleMapType: "k",
        googleMapZoom: "18",
        notes: "Portão lateral exige conferência manual no turno noturno.",
      },
      {
        id: "solar-aguas",
        name: "Condomínio Solar das Águas",
        deviceLinked: false,
        address: "Rua das Águas, 410",
        city: "São Paulo",
        state: "SP",
        image: "",
        googleAreaLat: "",
        googleAreaLng: "",
        googleMapType: "k",
        googleMapZoom: "18",
        notes: "",
      },
    ];

    const defaultRoute = [
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
    const mapCanvas = document.querySelector(".map-canvas");
    const overviewGoogleMapFrame = document.getElementById("overviewGoogleMapFrame");
    const overviewCondoName = document.getElementById("overviewCondoName");
    const overviewCondoStatus = document.getElementById("overviewCondoStatus");
    const overviewCondoAddress = document.getElementById("overviewCondoAddress");
    const activeTable = document.getElementById("activeTable");
    const checkpointHistoryEl = document.getElementById("checkpointHistory");
    const adminCondoList = document.getElementById("adminCondoList");
    const condoForm = document.getElementById("condoForm");
    const adminSearch = document.getElementById("adminSearch");
    const statusFilter = document.getElementById("statusFilter");
    const condoImage = document.getElementById("condoImage");
    const imagePreview = document.getElementById("imagePreview");
    const removeImageButton = document.getElementById("removeImageButton");
    const googleMapFrame = document.getElementById("googleMapFrame");
    const googleMapLink = document.getElementById("googleMapLink");
    const googleAreaLat = document.getElementById("googleAreaLat");
    const googleAreaLng = document.getElementById("googleAreaLng");
    const googleMapType = document.getElementById("googleMapType");
    const googleMapZoom = document.getElementById("googleMapZoom");
    const applyGoogleAreaButton = document.getElementById("applyGoogleAreaButton");
    const deleteCondoButton = document.getElementById("deleteCondoButton");
    const editRouteButton = document.getElementById("editRouteButton");
    const saveRouteButton = document.getElementById("saveRouteButton");
    const clearRouteButton = document.getElementById("clearRouteButton");
    const routeCoordinatePanel = document.getElementById("routeCoordinatePanel");
    const routePointName = document.getElementById("routePointName");
    const routePointLat = document.getElementById("routePointLat");
    const routePointLng = document.getElementById("routePointLng");
    const addCoordinatePointButton = document.getElementById("addCoordinatePointButton");
    let currentImage = "";
    let routeEditing = false;
    let draftRoute = [];
    let lastOverviewMapSrc = "";

    function svg(tag, attrs = {}) {
      const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
      return element;
    }

    function pathFrom(points) {
      return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    }

    function pointAt(points, progress) {
      const looped = ((progress % 1) + 1) % 1;
      const scaled = looped * (points.length - 1);
      const index = Math.floor(scaled);
      const next = Math.min(index + 1, points.length - 1);
      const local = scaled - index;
      const { x: x1, y: y1 } = points[index];
      const { x: x2, y: y2 } = points[next];
      return { x: x1 + (x2 - x1) * local, y: y1 + (y2 - y1) * local };
    }

    function partialPath(points, progress) {
      const scaled = Math.min(progress, 0.98) * (points.length - 1);
      const index = Math.floor(scaled);
      const result = points.slice(0, index + 1);
      const next = Math.min(index + 1, points.length - 1);
      const local = scaled - index;
      const { x: x1, y: y1 } = points[index];
      const { x: x2, y: y2 } = points[next];
      result.push({ x: x1 + (x2 - x1) * local, y: y1 + (y2 - y1) * local });
      return pathFrom(result);
    }

    function loadCondominiums() {
      try {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return defaultCondos.map(normalizeCondo);
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length ? parsed.map(normalizeCondo) : defaultCondos.map(normalizeCondo);
      } catch {
        return defaultCondos.map(normalizeCondo);
      }
    }

    function normalizeCondo(condo) {
      return {
        id: condo.id || `condo-${Date.now()}`,
        name: condo.name || "Condomínio sem nome",
        deviceLinked: typeof condo.deviceLinked === "boolean" ? condo.deviceLinked : condo.status === "Online",
        address: condo.address || "",
        city: condo.city || "",
        state: condo.state || "",
        image: condo.image || "",
        googleAreaLat: condo.googleAreaLat || condo.lat || "",
        googleAreaLng: condo.googleAreaLng || condo.lng || "",
        googleMapType: condo.googleMapType || "k",
        googleMapZoom: condo.googleMapZoom || "18",
        patrolRoute: Array.isArray(condo.patrolRoute) ? condo.patrolRoute : [],
        patrolRouteGeo: Array.isArray(condo.patrolRouteGeo) ? condo.patrolRouteGeo : [],
        notes: condo.notes || "",
      };
    }

    function saveCondominiums() {
      localStorage.setItem(storageKey, JSON.stringify(condominiums));
    }

    function activeCondo() {
      return condominiums.find((condo) => condo.id === selectedCondoId) || condominiums[0] || null;
    }

    function deviceStatus(condo) {
      return condo.deviceLinked ? "Com dispositivo" : "Aguardando dispositivo";
    }

    function statusClass(condo) {
      if (!condo.deviceLinked) return " attention";
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
            <span>${deviceStatus(condo)}</span>
            <small>${condo.city || "Cidade não informada"} ${condo.state || ""}</small>
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
        const deviceFilter = status === "Com dispositivo" ? condo.deviceLinked : status === "Sem dispositivo" ? !condo.deviceLinked : true;
        return text.includes(term) && deviceFilter;
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
        card.dataset.status = condo.deviceLinked ? "Com dispositivo" : "Sem dispositivo";
        card.innerHTML = `
          <div>
            <strong>${condo.name}</strong>
            <span>${deviceStatus(condo)}</span>
            <small>${condo.address || "Endereço não informado"} • ${condo.city || "Cidade"} ${condo.state || ""}</small>
            <small>${condo.deviceLinked ? "Dispositivo operacional vinculado" : "Vincule um dispositivo para ativar status em tempo real"}</small>
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
      const activeRoute = getActiveRoute();

      if (activeRoute.length > 1) {
        completedLayer.appendChild(svg("path", { class: "route-shadow", d: pathFrom(activeRoute) }));
        plannedLayer.appendChild(svg("path", { class: "route-planned", d: pathFrom(activeRoute) }));
        completedLayer.appendChild(svg("path", { class: "route-completed", d: partialPath(activeRoute, 0.75 + Math.sin(tick / 5) * 0.02) }));
      }

      activeRoute.forEach((point, index) => {
        const pointColor = [colors.blue, colors.green, colors.violet, colors.amber][index % 4];
        mapCheckpoints.appendChild(svg("circle", { class: "checkpoint-ring", cx: point.x, cy: point.y, r: 18, fill: pointColor }));
        const label = svg("text", { class: "map-label", x: point.x, y: point.y + 1 });
        label.textContent = point.name ? String(index + 1).padStart(2, "0") : String(index + 1).padStart(2, "0");
        mapCheckpoints.appendChild(label);
      });

      guards.forEach((guard) => {
        if (activeRoute.length < 2) return;
        const moved = guard.routeOffset + Math.sin((tick + Number(guard.number)) / 8) * 0.005;
        const point = pointAt(activeRoute, moved);
        mapGuards.appendChild(svg("circle", { class: "guard-dot", cx: point.x, cy: point.y, r: 8, fill: guard.color }));
      });
    }

    function getActiveRoute() {
      if (routeEditing) return projectRoute(draftRoute);
      const condo = activeCondo();
      if (condo?.patrolRouteGeo?.length) return projectRoute(condo.patrolRouteGeo);
      if (condo?.patrolRoute?.length) return condo.patrolRoute.map(([x, y]) => ({ x, y }));
      return defaultRoute.map(([x, y]) => ({ x, y }));
    }

    function startRouteEditing() {
      routeEditing = !routeEditing;
      const condo = activeCondo();
      draftRoute = condo?.patrolRouteGeo?.length ? condo.patrolRouteGeo.map((point) => ({ ...point })) : [];
      mapCanvas.classList.toggle("editing", routeEditing);
      routeCoordinatePanel.classList.toggle("active", routeEditing);
      editRouteButton.classList.toggle("active", routeEditing);
      editRouteButton.textContent = routeEditing ? "Editando..." : "Editar rota";
      renderMap();
    }

    function saveRoute() {
      const condo = activeCondo();
      if (!condo || draftRoute.length < 2) return;
      condo.patrolRouteGeo = draftRoute.map((point, index) => ({
        name: point.name || `Ponto ${index + 1}`,
        lat: normalizeCoordinate(point.lat),
        lng: normalizeCoordinate(point.lng),
      }));
      condo.patrolRoute = projectRoute(condo.patrolRouteGeo).map((point) => [Math.round(point.x), Math.round(point.y)]);
      routeEditing = false;
      mapCanvas.classList.remove("editing");
      routeCoordinatePanel.classList.remove("active");
      editRouteButton.classList.remove("active");
      editRouteButton.textContent = "Editar rota";
      saveCondominiums();
      renderMap();
    }

    function clearRoute() {
      draftRoute = [];
      const condo = activeCondo();
      if (!routeEditing && condo) {
        condo.patrolRoute = [];
        condo.patrolRouteGeo = [];
        saveCondominiums();
      }
      renderMap();
    }

    function addRoutePoint(event) {
      event.preventDefault();
      if (!routeEditing) return;
      const lat = normalizeCoordinate(routePointLat.value);
      const lng = normalizeCoordinate(routePointLng.value);
      if (!lat || !lng) return;
      draftRoute.push({
        name: routePointName.value.trim() || `Ponto ${draftRoute.length + 1}`,
        lat,
        lng,
      });
      routePointName.value = "";
      routePointLat.value = "";
      routePointLng.value = "";
      renderMap();
    }

    function projectRoute(routeGeo) {
      const condo = activeCondo();
      const centerLat = Number(normalizeCoordinate(condo?.googleAreaLat)) || Number(routeGeo[0]?.lat) || 0;
      const centerLng = Number(normalizeCoordinate(condo?.googleAreaLng)) || Number(routeGeo[0]?.lng) || 0;
      const zoom = Number(condo?.googleMapZoom || 18);
      const metersPerPixel = 156543.03392 * Math.cos((centerLat * Math.PI) / 180) / Math.pow(2, zoom);
      const scale = Math.max(0.2, metersPerPixel / 0.72);
      return routeGeo
        .map((point) => {
          const lat = Number(normalizeCoordinate(point.lat));
          const lng = Number(normalizeCoordinate(point.lng));
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const metersX = (lng - centerLng) * 111320 * Math.cos((centerLat * Math.PI) / 180);
          const metersY = (centerLat - lat) * 110540;
          return {
            x: Math.max(0, Math.min(940, 470 + metersX / scale)),
            y: Math.max(0, Math.min(520, 260 + metersY / scale)),
            name: point.name || "",
            lat: String(point.lat),
            lng: String(point.lng),
          };
        })
        .filter(Boolean);
    }

    function distanceMeters(a, b) {
      const radius = 6371000;
      const lat1 = (Number(a.lat) * Math.PI) / 180;
      const lat2 = (Number(b.lat) * Math.PI) / 180;
      const deltaLat = ((Number(b.lat) - Number(a.lat)) * Math.PI) / 180;
      const deltaLng = ((Number(b.lng) - Number(a.lng)) * Math.PI) / 180;
      const h =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
      return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }

    function nearestRouteDistanceMeters(position, routeGeo) {
      if (!routeGeo?.length) return Infinity;
      return Math.min(...routeGeo.map((point) => distanceMeters(position, point)));
    }

    function isGuardOffRoute(position, condo, toleranceMeters = 35) {
      const distance = nearestRouteDistanceMeters(position, condo?.patrolRouteGeo || []);
      return { offRoute: distance > toleranceMeters, distance };
    }

    function updateOverviewCondoMap() {
      const condo = activeCondo();
      if (!condo) return;
      const zoom = condo.googleMapZoom || "18";
      const mapType = condo.googleMapType || "k";
      const lat = normalizeCoordinate(condo.googleAreaLat);
      const lng = normalizeCoordinate(condo.googleAreaLng);
      const addressQuery = [condo.address, condo.city, condo.state, "Brasil"].filter(Boolean).join(", ");
      const query = lat && lng ? `${lat},${lng}` : addressQuery || "Brasil";
      const encoded = encodeURIComponent(query);
      const nextSrc = `https://www.google.com/maps?q=${encoded}&t=${mapType}&z=${zoom}&output=embed`;
      if (overviewGoogleMapFrame.src !== nextSrc && lastOverviewMapSrc !== nextSrc) {
        overviewGoogleMapFrame.src = nextSrc;
        lastOverviewMapSrc = nextSrc;
      }
      overviewCondoName.textContent = condo.name || "Condomínio";
      overviewCondoStatus.textContent = deviceStatus(condo);
      overviewCondoAddress.textContent = [condo.address, condo.city, condo.state].filter(Boolean).join(" • ") || "Endereço não informado";
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
        activeGuardsMetric.textContent = String(guards.length);
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
      document.getElementById("condoAddress").value = selected.address || "";
      document.getElementById("condoCity").value = selected.city || "";
      document.getElementById("condoState").value = selected.state || "";
      document.getElementById("condoNotes").value = selected.notes || "";
      googleAreaLat.value = selected.googleAreaLat || "";
      googleAreaLng.value = selected.googleAreaLng || "";
      googleMapType.value = selected.googleMapType || "k";
      googleMapZoom.value = selected.googleMapZoom || "18";
      currentImage = selected.image || "";
      renderImagePreview();
      updateGoogleMap(selected);
      deleteCondoButton.disabled = condominiums.length <= 1;
    }

    function clearForm() {
      selectedCondoId = null;
      condoForm.reset();
      document.getElementById("formTitle").textContent = "Novo Condomínio";
      document.getElementById("formSubtitle").textContent = "Preencha os dados principais e adicione a imagem do condomínio.";
      currentImage = "";
      condoImage.value = "";
      googleAreaLat.value = "";
      googleAreaLng.value = "";
      googleMapType.value = "k";
      googleMapZoom.value = "18";
      renderImagePreview();
      updateGoogleMap(null);
      deleteCondoButton.disabled = true;
      renderAllCondos();
    }

    function saveForm(event) {
      event.preventDefault();
      const payload = {
        id: selectedCondoId || `condo-${Date.now()}`,
        name: formValue("condoName"),
        deviceLinked: condominiums.find((condo) => condo.id === selectedCondoId)?.deviceLinked || false,
        address: formValue("condoAddress"),
        city: formValue("condoCity"),
        state: formValue("condoState").toUpperCase(),
        image: currentImage,
        googleAreaLat: formValue("googleAreaLat"),
        googleAreaLng: formValue("googleAreaLng"),
        googleMapType: formValue("googleMapType") || "k",
        googleMapZoom: formValue("googleMapZoom") || "18",
        patrolRoute: condominiums.find((condo) => condo.id === selectedCondoId)?.patrolRoute || [],
        patrolRouteGeo: condominiums.find((condo) => condo.id === selectedCondoId)?.patrolRouteGeo || [],
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
      updateOverviewCondoMap();
    }

    function deleteSelectedCondo() {
      if (!selectedCondoId || condominiums.length <= 1) return;
      condominiums = condominiums.filter((condo) => condo.id !== selectedCondoId);
      selectedCondoId = condominiums[0]?.id || null;
      saveCondominiums();
      fillForm(activeCondo());
      renderAllCondos();
      updateOverviewCondoMap();
    }

    function renderImagePreview() {
      if (!currentImage) {
        imagePreview.innerHTML = "<span>Sem imagem cadastrada</span>";
        return;
      }
      imagePreview.innerHTML = `<img src="${currentImage}" alt="Imagem do condomínio" />`;
    }

    function updateGoogleMap(condo) {
      const selected = condo || {
        address: formValue("condoAddress"),
        city: formValue("condoCity"),
        state: formValue("condoState"),
        googleAreaLat: formValue("googleAreaLat"),
        googleAreaLng: formValue("googleAreaLng"),
        googleMapType: formValue("googleMapType") || "k",
        googleMapZoom: formValue("googleMapZoom") || "18",
      };
      const zoom = selected.googleMapZoom || "18";
      const mapType = selected.googleMapType || "k";
      const addressQuery = [selected.address, selected.city, selected.state, "Brasil"].filter(Boolean).join(", ");
      const lat = normalizeCoordinate(selected.googleAreaLat);
      const lng = normalizeCoordinate(selected.googleAreaLng);
      const hasCoordinates = lat && lng;
      const query = hasCoordinates ? `${lat},${lng}` : addressQuery || "Brasil";
      const encoded = encodeURIComponent(query);
      googleMapFrame.src = `https://www.google.com/maps?q=${encoded}&t=${mapType}&z=${zoom}&output=embed`;
      googleMapLink.href = hasCoordinates
        ? `https://www.google.com/maps/@${lat},${lng},${zoom}z/data=!3m1!1e3`
        : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    }

    function normalizeCoordinate(value) {
      const normalized = String(value || "").trim().replace(",", ".");
      return /^-?\d+(?:\.\d+)?$/.test(normalized) ? normalized : "";
    }

    function handleImageUpload(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        currentImage = String(reader.result || "");
        renderImagePreview();
      };
      reader.readAsDataURL(file);
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
      } else if (viewName === "overview") {
        updateOverviewCondoMap();
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
    condoImage.addEventListener("change", handleImageUpload);
    removeImageButton.addEventListener("click", () => {
      currentImage = "";
      condoImage.value = "";
      renderImagePreview();
    });
    ["condoAddress", "condoCity", "condoState"].forEach((id) => {
      document.getElementById(id).addEventListener("change", () => updateGoogleMap(null));
    });
    applyGoogleAreaButton.addEventListener("click", () => updateGoogleMap(null));
    googleAreaLat.addEventListener("change", () => updateGoogleMap(null));
    googleAreaLng.addEventListener("change", () => updateGoogleMap(null));
    googleMapType.addEventListener("change", () => updateGoogleMap(null));
    googleMapZoom.addEventListener("change", () => updateGoogleMap(null));
    editRouteButton.addEventListener("click", startRouteEditing);
    saveRouteButton.addEventListener("click", saveRoute);
    clearRouteButton.addEventListener("click", clearRoute);
    addCoordinatePointButton.addEventListener("click", addRoutePoint);

    renderAllCondos();
    renderTable();
    renderHistory();
    fillForm(activeCondo());
    updateOverviewCondoMap();
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
