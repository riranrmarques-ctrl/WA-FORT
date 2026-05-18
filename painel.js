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
    const guardsStorageKey = "safeway.guards.v1";
    const googleMapsApiKeyStorageKey = "safeway.googleMapsApiKey.v1";
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

    const completedRoutes = [];

    const checkpointHistory = [];

    let tick = 0;
    let condominiums = loadCondominiums();
    let guards = loadGuards();
    let selectedCondoId = condominiums[0]?.id || null;
    let selectedGuardId = guards[0]?.id || null;

    const condoList = document.getElementById("condoList");
    const overviewCondoPanel = document.querySelector(".overview-condo-panel");
    const condoSelectorToggle = document.getElementById("condoSelectorToggle");
    const plannedLayer = document.getElementById("plannedLayer");
    const completedLayer = document.getElementById("completedLayer");
    const mapCheckpoints = document.getElementById("mapCheckpoints");
    const mapGuards = document.getElementById("mapGuards");
    const mapCanvas = document.querySelector(".map-canvas");
    const topbar = document.getElementById("topbar");
    const overviewPreciseMap = document.getElementById("overviewPreciseMap");
    const overviewGoogleMapFrame = document.getElementById("overviewGoogleMapFrame");
    const overviewCondoName = document.getElementById("overviewCondoName");
    const activeTable = document.getElementById("activeTable");
    const checkpointHistoryEl = document.getElementById("checkpointHistory");
    const guardList = document.getElementById("guardList");
    const guardForm = document.getElementById("guardForm");
    const guardEditorOverlay = document.getElementById("guardEditorOverlay");
    const closeGuardEditorButton = document.getElementById("closeGuardEditorButton");
    const guardSearch = document.getElementById("guardSearch");
    const guardName = document.getElementById("guardName");
    const guardPhone = document.getElementById("guardPhone");
    const guardAppCode = document.getElementById("guardAppCode");
    const guardDeviceName = document.getElementById("guardDeviceName");
    const guardCondo = document.getElementById("guardCondo");
    const guardRoute = document.getElementById("guardRoute");
    const guardShift = document.getElementById("guardShift");
    const guardStatus = document.getElementById("guardStatus");
    const guardCodePreview = document.getElementById("guardCodePreview");
    const deleteGuardButton = document.getElementById("deleteGuardButton");
    const adminCondoList = document.getElementById("adminCondoList");
    const condoForm = document.getElementById("condoForm");
    const condoEditorOverlay = document.getElementById("condoEditorOverlay");
    const closeEditorButton = document.getElementById("closeEditorButton");
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
    const googleMapsApiKey = document.getElementById("googleMapsApiKey");
    const googleMapsApiStatus = document.getElementById("googleMapsApiStatus");
    const applyGoogleAreaButton = document.getElementById("applyGoogleAreaButton");
    const deleteCondoButton = document.getElementById("deleteCondoButton");
    const editRouteButton = document.getElementById("editRouteButton");
    const saveRouteButton = document.getElementById("saveRouteButton");
    const clearRouteButton = document.getElementById("clearRouteButton");
    const routeCoordinatePanel = document.getElementById("routeCoordinatePanel");
    const routePointName = document.getElementById("routePointName");
    const routeGuardName = document.getElementById("routeGuardName");
    const routeStartLat = document.getElementById("routeStartLat");
    const routeStartLng = document.getElementById("routeStartLng");
    const routeEndLat = document.getElementById("routeEndLat");
    const routeEndLng = document.getElementById("routeEndLng");
    const routePointList = document.getElementById("routePointList");
    const addCoordinatePointButton = document.getElementById("addCoordinatePointButton");
    const detailRouteNumber = document.getElementById("detailRouteNumber");
    const detailGuardName = document.getElementById("detailGuardName");
    const detailGuardStatus = document.getElementById("detailGuardStatus");
    const detailRouteName = document.getElementById("detailRouteName");
    const detailRoutePath = document.getElementById("detailRoutePath");
    const detailNextPoint = document.getElementById("detailNextPoint");
    const detailEta = document.getElementById("detailEta");
    let currentImage = "";
    let routeEditing = false;
    let draftRoute = [];
    let lastOverviewMapSrc = "";
    let selectedRouteIndex = 0;
    let googleMapsApiPromise = null;
    let preciseMap = null;
    let preciseMapMarkers = [];
    let preciseMapLines = [];

    function svg(tag, attrs = {}) {
      const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
      return element;
    }

    function pathFrom(points) {
      return points.map((point, index) => `${index === 0 || point.move ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
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
      const routeSegments = normalizeRouteSegments(condo.patrolRouteSegments, condo.patrolRouteGeo);
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
        patrolRouteGeo: routeSegmentsToPoints(routeSegments),
        patrolRouteSegments: routeSegments,
        notes: condo.notes || "",
      };
    }

    function normalizeRouteSegments(segments, legacyPoints) {
      if (Array.isArray(segments) && segments.length) {
        return segments
          .map((segment, index) => ({
            name: segment.name || `Rota ${index + 1}`,
            guardName: segment.guardName || "",
            guardStatus: segment.guardStatus || "Aguardando cadastro",
            progress: Number.isFinite(Number(segment.progress)) ? Number(segment.progress) : 0,
            startLat: normalizeCoordinate(segment.startLat),
            startLng: normalizeCoordinate(segment.startLng),
            endLat: normalizeCoordinate(segment.endLat),
            endLng: normalizeCoordinate(segment.endLng),
          }))
          .filter((segment) => segment.startLat && segment.startLng && segment.endLat && segment.endLng);
      }

      if (!Array.isArray(legacyPoints) || legacyPoints.length < 2) return [];
      return legacyPoints.slice(0, -1).map((point, index) => {
        const next = legacyPoints[index + 1];
        return {
          name: `Rota ${index + 1}`,
          guardName: "",
          guardStatus: "Aguardando cadastro",
          progress: 0,
          startLat: normalizeCoordinate(point.lat),
          startLng: normalizeCoordinate(point.lng),
          endLat: normalizeCoordinate(next.lat),
          endLng: normalizeCoordinate(next.lng),
        };
      });
    }

    function routeSegmentsToPoints(segments) {
      if (!Array.isArray(segments) || !segments.length) return [];
      return segments.flatMap((segment, index) => {
        const start = {
          name: `${segment.name || `Rota ${index + 1}`} início`,
          lat: segment.startLat,
          lng: segment.startLng,
        };
        const end = {
          name: `${segment.name || `Rota ${index + 1}`} fim`,
          lat: segment.endLat,
          lng: segment.endLng,
        };
        start.move = index > 0;
        return [start, end];
      });
    }

    function saveCondominiums() {
      localStorage.setItem(storageKey, JSON.stringify(condominiums));
    }

    function generateGuardCode() {
      return `SAFE-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    function normalizeGuard(guard = {}, index = 0) {
      const progress = Number(guard.progress);
      const routeIndex = Number(guard.routeIndex);
      return {
        id: guard.id || `guard-${Date.now()}-${index}`,
        name: guard.name || "Vigilante sem nome",
        phone: guard.phone || "",
        appCode: guard.appCode || generateGuardCode(),
        deviceName: guard.deviceName || "",
        condoId: guard.condoId || "",
        routeIndex: Number.isFinite(routeIndex) ? routeIndex : 0,
        shift: guard.shift || "06:00 - 18:00",
        status: guard.status || "Aguardando sincronização",
        progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0,
        color: guard.color || colors.green,
        routeOffset: Number.isFinite(Number(guard.routeOffset)) ? Number(guard.routeOffset) : 0,
      };
    }

    function loadGuards() {
      try {
        const stored = localStorage.getItem(guardsStorageKey);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.map(normalizeGuard) : [];
      } catch {
        return [];
      }
    }

    function saveGuards() {
      localStorage.setItem(guardsStorageKey, JSON.stringify(guards));
    }

    function activeGuard() {
      return guards.find((guard) => guard.id === selectedGuardId) || guards[0] || null;
    }

    function openCondoEditor() {
      condoEditorOverlay.classList.add("open");
      condoEditorOverlay.setAttribute("aria-hidden", "false");
    }

    function closeCondoEditor() {
      condoEditorOverlay.classList.remove("open");
      condoEditorOverlay.setAttribute("aria-hidden", "true");
    }

    function activeCondo() {
      return condominiums.find((condo) => condo.id === selectedCondoId) || condominiums[0] || null;
    }

    function currentGoogleMapsApiKey() {
      return (googleMapsApiKey.value || localStorage.getItem(googleMapsApiKeyStorageKey) || "").trim();
    }

    function saveGoogleMapsApiKey() {
      const key = googleMapsApiKey.value.trim();
      if (key) {
        localStorage.setItem(googleMapsApiKeyStorageKey, key);
        googleMapsApiStatus.textContent = "Chave salva. O painel tentará usar o modo preciso.";
      } else {
        localStorage.removeItem(googleMapsApiKeyStorageKey);
        googleMapsApiStatus.textContent = "Sem chave: o painel usa prévia visual aproximada.";
      }
      googleMapsApiPromise = null;
      preciseMap = null;
      renderPreciseOverviewMap(activeCondo());
    }

    function loadGoogleMapsApi() {
      const key = currentGoogleMapsApiKey();
      if (!key) return Promise.resolve(false);
      if (window.google?.maps) return Promise.resolve(true);
      if (googleMapsApiPromise) return googleMapsApiPromise;
      googleMapsApiStatus.textContent = "Carregando modo preciso do Google Maps...";
      googleMapsApiPromise = new Promise((resolve) => {
        window.__safewayGoogleMapsReady = () => resolve(true);
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__safewayGoogleMapsReady&v=weekly`;
        script.async = true;
        script.defer = true;
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });
      return googleMapsApiPromise;
    }

    function clearPreciseMapOverlays() {
      preciseMapMarkers.forEach((marker) => marker.setMap(null));
      preciseMapLines.forEach((line) => line.setMap(null));
      preciseMapMarkers = [];
      preciseMapLines = [];
    }

    async function renderPreciseOverviewMap(condo) {
      const lat = normalizeCoordinate(condo?.googleAreaLat);
      const lng = normalizeCoordinate(condo?.googleAreaLng);
      const hasApi = await loadGoogleMapsApi();
      if (!hasApi || !lat || !lng) {
        mapCanvas.classList.remove("precise");
        if (currentGoogleMapsApiKey()) googleMapsApiStatus.textContent = "Não foi possível carregar a API. Confira a chave e o domínio liberado.";
        return;
      }

      const center = { lat: Number(lat), lng: Number(lng) };
      const mapTypeId = condo.googleMapType === "m" ? "roadmap" : "satellite";
      mapCanvas.classList.add("precise");
      googleMapsApiStatus.textContent = "Modo preciso ativo: rotas desenhadas dentro do Google Maps.";

      if (!preciseMap) {
        preciseMap = new google.maps.Map(overviewPreciseMap, {
          center,
          zoom: Number(condo.googleMapZoom || 18),
          mapTypeId,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "none",
        });
      } else {
        preciseMap.setCenter(center);
        preciseMap.setZoom(Number(condo.googleMapZoom || 18));
        preciseMap.setMapTypeId(mapTypeId);
      }

      clearPreciseMapOverlays();
      (condo.patrolRouteSegments || []).forEach((segment, index) => {
        const start = {
          lat: Number(normalizeCoordinate(segment.startLat)),
          lng: Number(normalizeCoordinate(segment.startLng)),
        };
        const end = {
          lat: Number(normalizeCoordinate(segment.endLat)),
          lng: Number(normalizeCoordinate(segment.endLng)),
        };
        if (!Number.isFinite(start.lat) || !Number.isFinite(start.lng) || !Number.isFinite(end.lat) || !Number.isFinite(end.lng)) return;
        const line = new google.maps.Polyline({
          map: preciseMap,
          path: [start, end],
          strokeColor: colors.blue,
          strokeOpacity: 0.95,
          strokeWeight: 5,
        });
        line.addListener("click", () => selectRoute(index));
        const marker = new google.maps.Marker({
          map: preciseMap,
          position: start,
          label: String(index + 1).padStart(2, "0"),
          title: segment.name || `Rota ${index + 1}`,
        });
        marker.addListener("click", () => selectRoute(index));
        preciseMapLines.push(line);
        preciseMapMarkers.push(marker);
      });
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
            <small>Crie o primeiro cadastro para liberar o mapa</small>
          </div>
        `;
        condoList.appendChild(empty);
        return;
      }
      condominiums.slice(0, 5).forEach((condo) => {
        const card = document.createElement("article");
        const photo = condo.image ? `<img src="${condo.image}" alt="${condo.name}" />` : "";
        const routesCount = condo.patrolRouteSegments?.length || 0;
        card.className = `condo-card${condo.id === selectedCondoId ? " active" : ""}`;
        card.innerHTML = `
          <div class="condo-photo">${photo}</div>
          <div>
            <strong>${condo.name}</strong>
            <small>${routesCount} ${routesCount === 1 ? "rota cadastrada" : "rotas cadastradas"}</small>
          </div>
        `;
        card.addEventListener("click", () => {
          selectedCondoId = condo.id;
          selectedRouteIndex = 0;
          fillForm(condo);
          overviewCondoPanel?.classList.remove("open");
          renderAllCondos();
        });
        condoList.appendChild(card);
      });
    }

    function renderAdminCondos() {
      const term = adminSearch.value.trim().toLowerCase();
      const status = statusFilter?.value || "Todos";
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
        const imageMarkup = condo.image ? `<img src="${condo.image}" alt="${condo.name}" />` : "◇";
        card.innerHTML = `
          <div class="admin-condo-thumb">${imageMarkup}</div>
          <div>
            <strong>${condo.name}</strong>
            <span>${condo.city || "Cidade"} ${condo.state || ""}</span>
            <small>${condo.patrolRouteSegments?.length || 0} rotas cadastradas</small>
          </div>
        `;
        card.addEventListener("click", () => {
          selectedCondoId = condo.id;
          selectedRouteIndex = 0;
          fillForm(condo);
          renderAllCondos();
          openCondoEditor();
        });
        adminCondoList.appendChild(card);
      });
    }

    function populateGuardCondoOptions() {
      if (!guardCondo) return;
      guardCondo.replaceChildren();
      if (!condominiums.length) {
        guardCondo.appendChild(new Option("Nenhum condomínio cadastrado", ""));
        return;
      }
      condominiums.forEach((condo) => {
        guardCondo.appendChild(new Option(condo.name, condo.id));
      });
    }

    function populateGuardRouteOptions(condoId) {
      if (!guardRoute) return;
      guardRoute.replaceChildren();
      const condo = condominiums.find((item) => item.id === condoId);
      const routes = condo?.patrolRouteSegments || [];
      if (!routes.length) {
        guardRoute.appendChild(new Option("Nenhuma rota cadastrada", ""));
        guardRoute.disabled = true;
        return;
      }
      guardRoute.disabled = false;
      routes.forEach((route, index) => {
        guardRoute.appendChild(new Option(route.name || `Rota ${index + 1}`, String(index)));
      });
    }

    function openGuardEditor() {
      guardEditorOverlay?.classList.add("open");
      guardEditorOverlay?.setAttribute("aria-hidden", "false");
    }

    function closeGuardEditor() {
      guardEditorOverlay?.classList.remove("open");
      guardEditorOverlay?.setAttribute("aria-hidden", "true");
    }

    function fillGuardForm(guard) {
      const selected = arguments.length ? guard : activeGuard();
      populateGuardCondoOptions();
      const defaultCondoId = selected?.condoId || condominiums[0]?.id || "";
      populateGuardRouteOptions(defaultCondoId);
      document.getElementById("guardFormTitle").textContent = selected ? "Editar Vigilante" : "Novo Vigilante";
      document.getElementById("guardFormSubtitle").textContent = selected
        ? `${selected.name} · ${selected.deviceName || "Dispositivo sem nome"}`
        : "Preencha os dados do vigilante e o código para sincronizar com o app.";
      guardName.value = selected?.name || "";
      guardPhone.value = selected?.phone || "";
      guardAppCode.value = selected?.appCode || generateGuardCode();
      guardDeviceName.value = selected?.deviceName || "";
      guardCondo.value = defaultCondoId;
      populateGuardRouteOptions(defaultCondoId);
      guardRoute.value = selected?.routeIndex != null ? String(selected.routeIndex) : "0";
      guardShift.value = selected?.shift || "06:00 - 18:00";
      guardStatus.value = selected?.status || "Aguardando sincronização";
      guardCodePreview.textContent = guardAppCode.value || "SAFE-0000";
      deleteGuardButton.disabled = !selected;
    }

    function clearGuardForm() {
      selectedGuardId = null;
      guardForm.reset();
      fillGuardForm(null);
      openGuardEditor();
    }

    function guardRouteLabel(guard) {
      const condo = condominiums.find((item) => item.id === guard.condoId);
      const route = condo?.patrolRouteSegments?.[guard.routeIndex];
      return route?.name || "Rota não definida";
    }

    function renderGuards() {
      if (!guardList) return;
      const term = (guardSearch?.value || "").trim().toLowerCase();
      const filtered = guards.filter((guard) => {
        const condo = condominiums.find((item) => item.id === guard.condoId);
        const text = `${guard.name} ${guard.phone} ${guard.deviceName} ${guard.appCode} ${condo?.name || ""}`.toLowerCase();
        return text.includes(term);
      });

      guardList.replaceChildren();
      if (!filtered.length) {
        const empty = document.createElement("div");
        empty.className = "admin-condo-card guard-admin-card empty";
        empty.innerHTML = "<div><strong>Nenhum vigilante cadastrado</strong><small>Clique em Novo Vigilante para criar o primeiro.</small></div>";
        guardList.appendChild(empty);
        return;
      }

      filtered.forEach((guard) => {
        const condo = condominiums.find((item) => item.id === guard.condoId);
        const initials = guard.name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase();
        const card = document.createElement("article");
        card.className = `admin-condo-card guard-admin-card${guard.id === selectedGuardId ? " active" : ""}`;
        card.innerHTML = `
          <div class="guard-avatar">${initials || "VG"}</div>
          <div>
            <strong>${guard.name}</strong>
            <span>${guard.status}</span>
            <small>${guard.deviceName || "Dispositivo sem nome"} · ${guard.appCode}</small>
            <small>${condo?.name || "Sem condomínio"} · ${guardRouteLabel(guard)}</small>
            <small>Turno ${guard.shift}</small>
          </div>
        `;
        card.addEventListener("click", () => {
          selectedGuardId = guard.id;
          fillGuardForm(guard);
          renderGuards();
          openGuardEditor();
        });
        guardList.appendChild(card);
      });
    }

    function syncGuardAssignments() {
      condominiums.forEach((condo) => {
        (condo.patrolRouteSegments || []).forEach((segment) => {
          segment.guardName = "";
          segment.guardStatus = "Aguardando cadastro";
          segment.progress = 0;
        });
      });

      guards.forEach((guard) => {
        const condo = condominiums.find((item) => item.id === guard.condoId);
        const segment = condo?.patrolRouteSegments?.[guard.routeIndex];
        if (!segment) return;
        segment.guardName = guard.name;
        segment.guardStatus = guard.status;
        segment.progress = guard.status === "Em patrulha" ? Math.max(guard.progress, 1) : guard.progress;
      });

      condominiums.forEach((condo) => {
        condo.patrolRouteSegments = normalizeRouteSegments(condo.patrolRouteSegments, []);
        condo.patrolRouteGeo = routeSegmentsToPoints(condo.patrolRouteSegments);
        condo.patrolRoute = projectRoute(condo.patrolRouteGeo).map((point) => [Math.round(point.x), Math.round(point.y)]);
      });
      saveCondominiums();
    }

    function saveGuardForm(event) {
      event.preventDefault();
      const routeIndex = Number(guardRoute.value);
      const existing = guards.find((guard) => guard.id === selectedGuardId);
      const payload = normalizeGuard({
        ...(existing || {}),
        id: existing?.id || `guard-${Date.now()}`,
        name: guardName.value.trim(),
        phone: guardPhone.value.trim(),
        appCode: guardAppCode.value.trim() || generateGuardCode(),
        deviceName: guardDeviceName.value.trim(),
        condoId: guardCondo.value,
        routeIndex: Number.isFinite(routeIndex) ? routeIndex : 0,
        shift: guardShift.value,
        status: guardStatus.value,
      });

      const existingIndex = guards.findIndex((guard) => guard.id === payload.id);
      if (existingIndex >= 0) {
        guards[existingIndex] = payload;
      } else {
        guards.unshift(payload);
      }
      selectedGuardId = payload.id;
      saveGuards();
      syncGuardAssignments();
      renderAllCondos();
      renderGuards();
      updateOverviewCondoMap();
      closeGuardEditor();
    }

    function deleteSelectedGuard() {
      if (!selectedGuardId) return;
      guards = guards.filter((guard) => guard.id !== selectedGuardId);
      selectedGuardId = guards[0]?.id || null;
      saveGuards();
      syncGuardAssignments();
      renderAllCondos();
      renderGuards();
      updateOverviewCondoMap();
      closeGuardEditor();
    }

    function renderMap() {
      plannedLayer.replaceChildren();
      completedLayer.replaceChildren();
      mapCheckpoints.replaceChildren();
      mapGuards.replaceChildren();
      mapCanvas.classList.toggle("empty", !activeCondo());
      const activeRoute = getActiveRoute();
      const segments = routeEditing ? draftRoute : activeCondo()?.patrolRouteSegments || [];

      if (activeRoute.length > 1) {
        segments.forEach((segment, index) => {
          const segmentPoints = projectRoute(routeSegmentsToPoints([segment]));
          if (segmentPoints.length < 2) return;
          const d = pathFrom(segmentPoints);
          const hit = svg("path", { class: "route-click-target", d, "data-route-index": index });
          const line = svg("path", { class: `route-planned${index === selectedRouteIndex ? " selected" : ""}`, d });
          hit.addEventListener("click", () => selectRoute(index));
          plannedLayer.appendChild(hit);
          plannedLayer.appendChild(line);
        });
        if (guards.length) {
          completedLayer.appendChild(svg("path", { class: "route-completed", d: partialPath(activeRoute, 0.75 + Math.sin(tick / 5) * 0.02) }));
        }
      }

      segments.forEach((segment, index) => {
        const segmentPoints = projectRoute(routeSegmentsToPoints([segment]));
        if (segmentPoints.length < 2) return;
        const start = segmentPoints[0];
        const end = segmentPoints[segmentPoints.length - 1];
        const markerPoint = {
          x: start.x + (end.x - start.x) * 0.5,
          y: start.y + (end.y - start.y) * 0.5,
        };
        const pointColor = [colors.blue, colors.green, colors.violet, colors.amber][index % 4];
        const routeMarker = svg("g", { class: "route-map-marker", "data-route-index": index });
        routeMarker.appendChild(svg("circle", { class: "route-endpoint", cx: start.x, cy: start.y, r: 7 }));
        routeMarker.appendChild(svg("circle", { class: "route-endpoint", cx: end.x, cy: end.y, r: 7 }));
        routeMarker.appendChild(svg("circle", { class: "checkpoint-ring", cx: markerPoint.x, cy: markerPoint.y, r: 18, fill: pointColor }));
        const label = svg("text", { class: "map-label", x: markerPoint.x, y: markerPoint.y + 1 });
        label.textContent = String(index + 1).padStart(2, "0");
        routeMarker.appendChild(label);
        routeMarker.addEventListener("click", () => selectRoute(index));
        mapCheckpoints.appendChild(routeMarker);
      });

      guards
        .filter((guard) => !guard.condoId || guard.condoId === activeCondo()?.id)
        .forEach((guard, index) => {
        if (activeRoute.length < 2) return;
        const baseProgress = Number(guard.progress) ? Number(guard.progress) / 100 : 0.12 + index * 0.12;
        const moved = Math.max(0.02, Math.min(0.98, baseProgress)) + Math.sin((tick + index + 1) / 8) * 0.005;
        const point = pointAt(activeRoute, moved);
        mapGuards.appendChild(svg("circle", { class: "guard-dot", cx: point.x, cy: point.y, r: 8, fill: guard.color || colors.green }));
      });
      renderSelectedRouteDetails();
    }

    function getActiveRoute() {
      if (routeEditing) return projectRoute(routeSegmentsToPoints(draftRoute));
      const condo = activeCondo();
      if (condo?.patrolRouteGeo?.length) return projectRoute(condo.patrolRouteGeo);
      if (condo?.patrolRoute?.length) return condo.patrolRoute.map(([x, y]) => ({ x, y }));
      return [];
    }

    function selectRoute(index) {
      selectedRouteIndex = index;
      renderMap();
    }

    function renderSelectedRouteDetails() {
      const source = routeEditing ? draftRoute : activeCondo()?.patrolRouteSegments || [];
      const segment = source[selectedRouteIndex] || source[0];
      if (!segment) {
        detailRouteNumber.textContent = "--";
        detailGuardName.textContent = "Nenhum vigilante vinculado";
        detailGuardStatus.textContent = "Selecione uma rota no mapa";
        detailRouteName.textContent = "Rota: --";
        detailRoutePath.textContent = "Nenhum percurso selecionado";
        detailProgressText.textContent = "0%";
        detailProgressBar.style.width = "0%";
        detailNextPoint.textContent = "Nenhum ponto definido";
        detailEta.textContent = "--:--";
        return;
      }
      const progress = Math.max(0, Math.min(100, Number(segment.progress) || 0));
      detailRouteNumber.textContent = String(source.indexOf(segment) + 1).padStart(2, "0");
      detailGuardName.textContent = segment.guardName || "Vigilante não definido";
      detailGuardStatus.textContent = segment.guardName ? segment.guardStatus || "Vinculado à rota" : "Aguardando cadastro";
      detailRouteName.textContent = `Rota: ${segment.name || `Rota ${source.indexOf(segment) + 1}`}`;
      detailRoutePath.textContent = `${segment.startLat}, ${segment.startLng} até ${segment.endLat}, ${segment.endLng}`;
      detailProgressText.textContent = `${progress}%`;
      detailProgressBar.style.width = `${progress}%`;
      detailNextPoint.textContent = segment.name || "Fim da rota";
      detailEta.textContent = progress ? "Em andamento" : "--:--";
    }

    function startRouteEditing() {
      routeEditing = !routeEditing;
      const condo = activeCondo();
      draftRoute = condo?.patrolRouteSegments?.length ? condo.patrolRouteSegments.map((segment) => ({ ...segment })) : [];
      mapCanvas.classList.toggle("editing", routeEditing);
      editRouteButton.classList.toggle("active", routeEditing);
      editRouteButton.textContent = routeEditing ? "Editando..." : "Editar rota";
      renderRoutePointList();
      renderMap();
    }

    function saveRoute() {
      const condo = activeCondo();
      if (!condo || !draftRoute.length) return;
      condo.patrolRouteSegments = normalizeRouteSegments(draftRoute, []);
      condo.patrolRouteGeo = routeSegmentsToPoints(condo.patrolRouteSegments);
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
        condo.patrolRouteSegments = [];
        saveCondominiums();
      }
      renderRoutePointList();
      renderMap();
    }

    function addRoutePoint(event) {
      event.preventDefault();
      if (!routeEditing) startRouteEditing();
      const startLat = normalizeCoordinate(routeStartLat.value);
      const startLng = normalizeCoordinate(routeStartLng.value);
      const endLat = normalizeCoordinate(routeEndLat.value);
      const endLng = normalizeCoordinate(routeEndLng.value);
      if (!startLat || !startLng || !endLat || !endLng) {
        routeStartLat.focus();
        return;
      }
      draftRoute.push({
        name: routePointName.value.trim() || `Rota ${draftRoute.length + 1}`,
        guardName: routeGuardName.value.trim(),
        guardStatus: routeGuardName.value.trim() ? "Vinculado à rota" : "Aguardando cadastro",
        progress: 0,
        startLat,
        startLng,
        endLat,
        endLng,
      });
      focusGoogleMapOnPoint({ lat: startLat, lng: startLng });
      routePointName.value = "";
      routeGuardName.value = "";
      routeStartLat.value = "";
      routeStartLng.value = "";
      routeEndLat.value = "";
      routeEndLng.value = "";
      renderRoutePointList();
      renderMap();
    }

    function renderRoutePointList() {
      const source = routeEditing ? draftRoute : activeCondo()?.patrolRouteSegments || [];
      routePointList.replaceChildren();
      if (!source.length) {
        const empty = document.createElement("span");
        empty.className = "route-point-item";
        empty.textContent = "Nenhuma rota adicionada";
        routePointList.appendChild(empty);
        return;
      }
      source.forEach((segment, index) => {
        const item = document.createElement("span");
        item.className = "route-point-item";
        item.innerHTML = `
          <b>${String(index + 1).padStart(2, "0")}</b>
          <span>${segment.name || `Rota ${index + 1}`} · ${segment.guardName || "Sem vigilante"} · Início ${segment.startLat}, ${segment.startLng} · Fim ${segment.endLat}, ${segment.endLng}</span>
          <button type="button" data-focus-route="${index}" data-route-edge="start" title="Ver início no Google">Início</button>
          <button type="button" data-focus-route="${index}" data-route-edge="end" title="Ver fim no Google">Fim</button>
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
      const canvasRect = mapCanvas.getBoundingClientRect();
      const canvasWidth = canvasRect.width || viewWidth;
      const canvasHeight = canvasRect.height || viewHeight;
      return routeGeo
        .map((point) => {
          const lat = Number(normalizeCoordinate(point.lat));
          const lng = Number(normalizeCoordinate(point.lng));
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const pixel = mercatorPixel(lat, lng, zoom);
          const screenX = canvasWidth / 2 + (pixel.x - centerPixel.x);
          const screenY = canvasHeight / 2 + (pixel.y - centerPixel.y);
          const svgX = (screenX / canvasWidth) * viewWidth;
          const svgY = (screenY / canvasHeight) * viewHeight;
          return {
            x: Math.max(0, Math.min(viewWidth, svgX)),
            y: Math.max(0, Math.min(viewHeight, svgY)),
            name: point.name || "",
            lat: String(point.lat),
            lng: String(point.lng),
            move: Boolean(point.move),
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
        mapCanvas.classList.remove("precise");
        clearPreciseMapOverlays();
        overviewCondoName.textContent = "Nenhum condomínio cadastrado";
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
      renderPreciseOverviewMap(condo);
    }

    function renderTable() {
      activeTable.replaceChildren();
      const header = document.createElement("div");
      header.className = "table-row header";
      header.innerHTML = "<span>Rota</span><span>Vigilante</span><span>Início</span><span>Fim</span><span>Tempo de percurso</span>";
      activeTable.appendChild(header);

      if (!completedRoutes.length) {
        const empty = document.createElement("div");
        empty.className = "table-row empty";
        empty.innerHTML = "<span>Nenhuma rota concluída hoje</span><span>-</span><span>-</span><span>-</span><span>-</span>";
        activeTable.appendChild(empty);
        return;
      }

      completedRoutes.forEach((route) => {
        const row = document.createElement("div");
        row.className = "table-row";
        row.innerHTML = `
          <span>${route.name}</span>
          <span>${route.guard}</span>
          <span>${route.startedAt}</span>
          <span>${route.finishedAt}</span>
          <span class="table-status">${route.duration}</span>
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
      const activeGuardsMetric = document.getElementById("activeGuardsMetric");
      const openOccurrencesMetric = document.getElementById("openOccurrencesMetric");
      if (activeGuardsMetric) {
        activeGuardsMetric.textContent = String(guards.length);
      }
      if (openOccurrencesMetric) openOccurrencesMetric.textContent = "0";
    }

    function renderAllCondos() {
      renderCondos();
      renderAdminCondos();
      renderGuards();
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
      draftRoute = selected.patrolRouteSegments?.length ? selected.patrolRouteSegments.map((segment) => ({ ...segment })) : [];
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
      selectedRouteIndex = 0;
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
      openCondoEditor();
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
        patrolRoute: [],
        patrolRouteGeo: [],
        patrolRouteSegments: routeEditing
          ? normalizeRouteSegments(draftRoute, [])
          : condominiums.find((condo) => condo.id === selectedCondoId)?.patrolRouteSegments || normalizeRouteSegments(draftRoute, []),
        notes: formValue("condoNotes"),
      };
      payload.patrolRouteGeo = routeSegmentsToPoints(payload.patrolRouteSegments);
      payload.patrolRoute = projectRoute(payload.patrolRouteGeo).map((point) => [Math.round(point.x), Math.round(point.y)]);

      const existingIndex = condominiums.findIndex((condo) => condo.id === payload.id);
      if (existingIndex >= 0) {
        condominiums[existingIndex] = payload;
      } else {
        condominiums.unshift(payload);
      }

      selectedCondoId = payload.id;
      routeEditing = false;
      draftRoute = payload.patrolRouteSegments.map((segment) => ({ ...segment }));
      selectedRouteIndex = 0;
      saveCondominiums();
      fillForm(payload);
      renderAllCondos();
      updateOverviewCondoMap();
      closeCondoEditor();
    }

    function deleteSelectedCondo() {
      if (!selectedCondoId || condominiums.length <= 1) return;
      condominiums = condominiums.filter((condo) => condo.id !== selectedCondoId);
      selectedCondoId = condominiums[0]?.id || null;
      saveCondominiums();
      fillForm(activeCondo());
      renderAllCondos();
      updateOverviewCondoMap();
      closeCondoEditor();
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
      if (!hasCoordinates && !addressQuery) {
        googleMapFrame.removeAttribute("src");
        if (googleMapLink) googleMapLink.href = "https://www.google.com/maps";
        return;
      }
      const query = hasCoordinates ? `${lat},${lng}` : addressQuery;
      const encoded = encodeURIComponent(query);
      googleMapFrame.src = `https://www.google.com/maps?q=${encoded}&t=${mapType}&z=${zoom}&output=embed`;
      if (googleMapLink) {
        googleMapLink.href = hasCoordinates
          ? `https://www.google.com/maps/@${lat},${lng},${zoom}z/data=!3m1!1e3`
          : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
      }
    }

    function focusGoogleMapOnPoint(point) {
      const lat = normalizeCoordinate(point?.lat);
      const lng = normalizeCoordinate(point?.lng);
      if (!lat || !lng) return;
      const zoom = formValue("googleMapZoom") || activeCondo()?.googleMapZoom || "19";
      const mapType = formValue("googleMapType") || activeCondo()?.googleMapType || "k";
      const encoded = encodeURIComponent(`${lat},${lng}`);
      googleMapFrame.src = `https://www.google.com/maps?q=${encoded}&t=${mapType}&z=${zoom}&output=embed`;
      if (googleMapLink) googleMapLink.href = `https://www.google.com/maps/@${lat},${lng},${zoom}z/data=!3m1!1e3`;
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
    }

    function setView(viewName) {
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
      document.getElementById(`${viewName}View`)?.classList.add("active");
      document.querySelectorAll("[data-view-button]").forEach((button) => {
        button.classList.toggle("active", button.dataset.viewButton === viewName);
      });
      topbar.classList.toggle("hidden", viewName === "condominiums" || viewName === "guards");
      if (viewName === "condominiums") {
        fillForm(activeCondo());
        renderAllCondos();
      } else if (viewName === "guards") {
        renderGuards();
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
    condoSelectorToggle?.addEventListener("click", (event) => {
      event.stopPropagation();
      overviewCondoPanel?.classList.toggle("open");
    });
    document.addEventListener("click", (event) => {
      if (!overviewCondoPanel?.contains(event.target)) {
        overviewCondoPanel?.classList.remove("open");
      }
    });
    document.getElementById("newCondoButton").addEventListener("click", clearForm);
    document.getElementById("resetFormButton").addEventListener("click", clearForm);
    document.getElementById("newGuardButton").addEventListener("click", clearGuardForm);
    document.getElementById("resetGuardFormButton").addEventListener("click", clearGuardForm);
    condoForm.addEventListener("submit", saveForm);
    guardForm.addEventListener("submit", saveGuardForm);
    deleteCondoButton.addEventListener("click", deleteSelectedCondo);
    deleteGuardButton.addEventListener("click", deleteSelectedGuard);
    adminSearch.addEventListener("input", renderAdminCondos);
    guardSearch.addEventListener("input", renderGuards);
    statusFilter?.addEventListener("change", renderAdminCondos);
    condoImage.addEventListener("change", handleImageUpload);
    removeImageButton.addEventListener("click", () => {
      currentImage = "";
      condoImage.value = "";
      renderImagePreview();
    });
    closeEditorButton.addEventListener("click", closeCondoEditor);
    closeGuardEditorButton.addEventListener("click", closeGuardEditor);
    condoEditorOverlay.addEventListener("click", (event) => {
      if (event.target === condoEditorOverlay) closeCondoEditor();
    });
    guardEditorOverlay.addEventListener("click", (event) => {
      if (event.target === guardEditorOverlay) closeGuardEditor();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && condoEditorOverlay.classList.contains("open")) closeCondoEditor();
      if (event.key === "Escape" && guardEditorOverlay.classList.contains("open")) closeGuardEditor();
    });
    ["condoAddress", "condoCity", "condoState"].forEach((id) => {
      document.getElementById(id).addEventListener("change", () => updateGoogleMap(null));
    });
    applyGoogleAreaButton.addEventListener("click", () => updateGoogleMap(null));
    googleAreaLat.addEventListener("change", () => updateGoogleMap(null));
    googleAreaLng.addEventListener("change", () => updateGoogleMap(null));
    googleMapType.addEventListener("change", () => updateGoogleMap(null));
    googleMapZoom.addEventListener("change", () => updateGoogleMap(null));
    googleMapsApiKey.value = localStorage.getItem(googleMapsApiKeyStorageKey) || "";
    googleMapsApiKey.addEventListener("change", saveGoogleMapsApiKey);
    guardAppCode.addEventListener("input", () => {
      guardCodePreview.textContent = guardAppCode.value.trim() || "SAFE-0000";
    });
    guardCondo.addEventListener("change", () => populateGuardRouteOptions(guardCondo.value));
    editRouteButton.addEventListener("click", startRouteEditing);
    saveRouteButton.addEventListener("click", saveRoute);
    clearRouteButton.addEventListener("click", clearRoute);
    addCoordinatePointButton.addEventListener("click", addRoutePoint);
    routePointList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-focus-route]");
      if (!button) return;
      const source = routeEditing ? draftRoute : activeCondo()?.patrolRouteSegments || [];
      const segment = source[Number(button.dataset.focusRoute)];
      if (!segment) return;
      const isEnd = button.dataset.routeEdge === "end";
      focusGoogleMapOnPoint({
        lat: isEnd ? segment.endLat : segment.startLat,
        lng: isEnd ? segment.endLng : segment.startLng,
      });
    });
    [routePointName, routeGuardName, routeStartLat, routeStartLng, routeEndLat, routeEndLng].forEach((input) => {
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
