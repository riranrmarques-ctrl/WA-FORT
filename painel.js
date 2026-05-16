(() => {
  try {
    const colors = {
      blue: "#1268ff",
      green: "#22c76a",
      amber: "#f0ae1b",
      red: "#ff4d63",
      violet: "#6e63ff",
    };

    const storageKey = "safeway.condominiums.v2";
    const defaultCondos = [];

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

    const guards = [];

    const checkpointHistory = [];

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
    const routePointList = document.getElementById("routePointList");
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
        return Array.isArray(parsed) ? parsed.map(normalizeCondo) : defaultCondos.map(normalizeCondo);
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
      if (!condominiums.length) {
        const empty = document.createElement("article");
        empty.className = "condo-card empty";
        empty.innerHTML = `
          <div class="condo-photo"></div>
          <div>
            <strong>Nenhum condomínio cadastrado</strong>
            <span>Crie o primeiro cadastro</span>
            <small>A rota e o mapa aparecerão depois</small>
          </div>
        `;
        condoList.appendChild(empty);
        return;
      }
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
      mapCanvas.classList.toggle("empty", !activeCondo());
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
      return [];
    }

    function startRouteEditing() {
      routeEditing = !routeEditing;
      const condo = activeCondo();
      draftRoute = condo?.patrolRouteGeo?.length ? condo.patrolRouteGeo.map((point) => ({ ...point })) : [];
      mapCanvas.classList.toggle("editing", routeEditing);
      editRouteButton.classList.toggle("active", routeEditing);
      editRouteButton.textContent = routeEditing ? "Editando..." : "Editar rota";
      renderRoutePointList();
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
      editRouteButton.classList.remove("active");
      editRouteButton.textContent = "Editar rota";
      saveCondominiums();
      renderRoutePointList();
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
      renderRoutePointList();
      renderMap();
    }

    function addRoutePoint(event) {
      event.preventDefault();
      if (!routeEditing) startRouteEditing();
      const lat = normalizeCoordinate(routePointLat.value);
      const lng = normalizeCoordinate(routePointLng.value);
      if (!lat || !lng) {
        routePointLat.focus();
        return;
      }
      draftRoute.push({
        name: routePointName.value.trim() || `Ponto ${draftRoute.length + 1}`,
        lat,
        lng,
      });
      focusGoogleMapOnPoint({ lat, lng });
      routePointName.value = "";
      routePointLat.value = "";
      routePointLng.value = "";
      renderRoutePointList();
      renderMap();
    }

    function renderRoutePointList() {
      const source = routeEditing ? draftRoute : activeCondo()?.patrolRouteGeo || [];
      routePointList.replaceChildren();
      if (!source.length) {
        const empty = document.createElement("span");
        empty.className = "route-point-item";
        empty.textContent = "Nenhum ponto adicionado";
        routePointList.appendChild(empty);
        return;
      }
      source.forEach((point, index) => {
        const item = document.createElement("span");
        item.className = "route-point-item";
        item.innerHTML = `
          <b>${String(index + 1).padStart(2, "0")}</b>
          <span>${point.name || "Ponto"} • ${point.lat}, ${point.lng}</span>
          <button type="button" data-focus-point="${index}" title="Ver este ponto no Google">Ver</button>
        `;
        routePointList.appendChild(item);
      });
    }

    function projectRoute(routeGeo) {
      const condo = activeCondo();
      const centerLat = Number(normalizeCoordinate(condo?.googleAreaLat)) || Number(routeGeo[0]?.lat) || 0;
      const centerLng = Number(normalizeCoordinate(condo?.googleAreaLng)) || Number(routeGeo[0]?.lng) || 0;
      const zoom = Number(condo?.googleMapZoom || 18);
      const centerPixel = mercatorPixel(centerLat, centerLng, zoom);
      const viewWidth = 940;
      const viewHeight = 520;
      return routeGeo
        .map((point) => {
          const lat = Number(normalizeCoordinate(point.lat));
          const lng = Number(normalizeCoordinate(point.lng));
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const pixel = mercatorPixel(lat, lng, zoom);
          return {
            x: Math.max(0, Math.min(viewWidth, viewWidth / 2 + (pixel.x - centerPixel.x))),
            y: Math.max(0, Math.min(viewHeight, viewHeight / 2 + (pixel.y - centerPixel.y))),
            name: point.name || "",
            lat: String(point.lat),
            lng: String(point.lng),
          };
        })
        .filter(Boolean);
    }

    function mercatorPixel(lat, lng, zoom) {
      const siny = Math.max(-0.9999, Math.min(0.9999, Math.sin((lat * Math.PI) / 180)));
      const scale = 256 * Math.pow(2, zoom);
      return {
        x: ((lng + 180) / 360) * scale,
        y: (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) * scale,
      };
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
      if (!condo) {
        overviewGoogleMapFrame.removeAttribute("src");
        lastOverviewMapSrc = "";
        overviewCondoName.textContent = "Nenhum condomínio cadastrado";
        overviewCondoStatus.textContent = "Sem dispositivo";
        overviewCondoAddress.textContent = "Cadastre um condomínio para iniciar o monitoramento.";
        return;
      }
      const zoom = condo.googleMapZoom || "18";
      const mapType = condo.googleMapType || "k";
      const lat = normalizeCoordinate(condo.googleAreaLat);
      const lng = normalizeCoordinate(condo.googleAreaLng);
      const addressQuery = [condo.address, condo.city, condo.state, "Brasil"].filter(Boolean).join(", ");
      const encodedAddress = encodeURIComponent(addressQuery || "Brasil");
      const nextSrc =
        lat && lng
          ? `https://www.google.com/maps?ll=${lat},${lng}&t=${mapType}&z=${zoom}&output=embed`
          : `https://www.google.com/maps?q=${encodedAddress}&t=${mapType}&z=${zoom}&output=embed`;
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

      if (!guards.length) {
        const empty = document.createElement("div");
        empty.className = "table-row empty";
        empty.innerHTML = "<span>Nenhum vigilante vinculado</span><span>-</span><span>-</span><span>-</span><span>0%</span>";
        activeTable.appendChild(empty);
        return;
      }

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
      if (!checkpointHistory.length) {
        const item = document.createElement("div");
        item.className = "checkpoint-item";
        item.innerHTML = "<i></i><span>Nenhum ponto registrado</span><time>-</time>";
        checkpointHistoryEl.appendChild(item);
        return;
      }
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
      const activeRoutesMetric = document.getElementById("activeRoutesMetric");
      const openOccurrencesMetric = document.getElementById("openOccurrencesMetric");
      if (condoMetric) condoMetric.textContent = String(condominiums.length);
      if (activeGuardsMetric) {
        activeGuardsMetric.textContent = String(guards.length);
      }
      if (activeRoutesMetric) activeRoutesMetric.textContent = "0";
      if (openOccurrencesMetric) openOccurrencesMetric.textContent = "0";
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
      routeEditing = false;
      draftRoute = selected.patrolRouteGeo?.length ? selected.patrolRouteGeo.map((point) => ({ ...point })) : [];
      editRouteButton.classList.remove("active");
      editRouteButton.textContent = "Editar rota";
      renderImagePreview();
      renderRoutePointList();
      updateGoogleMap(selected);
      deleteCondoButton.disabled = condominiums.length <= 1;
    }

    function clearForm() {
      selectedCondoId = null;
      condoForm.reset();
      document.getElementById("formTitle").textContent = "Novo Condomínio";
      document.getElementById("formSubtitle").textContent = "Preencha os dados principais e adicione a imagem do condomínio.";
      currentImage = "";
      routeEditing = false;
      draftRoute = [];
      condoImage.value = "";
      googleAreaLat.value = "";
      googleAreaLng.value = "";
      googleMapType.value = "k";
      googleMapZoom.value = "18";
      renderImagePreview();
      renderRoutePointList();
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

    function focusGoogleMapOnPoint(point) {
      const lat = normalizeCoordinate(point?.lat);
      const lng = normalizeCoordinate(point?.lng);
      if (!lat || !lng) return;
      const zoom = formValue("googleMapZoom") || activeCondo()?.googleMapZoom || "19";
      const mapType = formValue("googleMapType") || activeCondo()?.googleMapType || "k";
      const encoded = encodeURIComponent(`${lat},${lng}`);
      googleMapFrame.src = `https://www.google.com/maps?q=${encoded}&t=${mapType}&z=${zoom}&output=embed`;
      googleMapLink.href = `https://www.google.com/maps/@${lat},${lng},${zoom}z/data=!3m1!1e3`;
    }

    function normalizeCoordinate(value) {
      const normalized = String(value || "")
        .trim()
        .replace(/\s+/g, "")
        .replace(/,$/, "")
        .replace(",", ".");
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
      document.getElementById("mapAge").textContent = activeCondo() ? String(10 + (tick % 4)) : "0";
      document.getElementById("finishedRoutesMetric").textContent = "0";
      document.getElementById("detailProgressText").textContent = "0%";
      document.getElementById("detailProgressBar").style.width = "0%";
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
    routePointList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-focus-point]");
      if (!button) return;
      const source = routeEditing ? draftRoute : activeCondo()?.patrolRouteGeo || [];
      focusGoogleMapOnPoint(source[Number(button.dataset.focusPoint)]);
    });
    [routePointName, routePointLat, routePointLng].forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") addRoutePoint(event);
      });
    });

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
