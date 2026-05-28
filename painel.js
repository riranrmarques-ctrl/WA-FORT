(() => {
  try {
    const SUPABASE_URL = "https://ivwivgngihqcmisemlny.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_sJIvcD9LtecNyQi4F2EHbQ_b6DTVZQR";
    const supabaseClient = window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

    const colors = {
      blue: "#1268ff",
      green: "#22c76a",
      amber: "#f0ae1b",
      red: "#ff4d63",
      violet: "#6e63ff",
    };

    const storageKey = "safeway.condominiums.v2";
    const guardsStorageKey = "safeway.guards.v1";
    const devicesStorageKey = "safeway.devices.v1";
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
    let condominiums = [];
    let guards = [];
    let devices = [];
    let liveGuards = {};
    let selectedCondoId = null;
    let selectedGuardId = null;

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
    const guardCondo = document.getElementById("guardCondo");
    const guardDevice = document.getElementById("guardDevice");
    const guardShift = document.getElementById("guardShift");
    const guardStatus = document.getElementById("guardStatus");
    const deleteGuardButton = document.getElementById("deleteGuardButton");
    const deviceList = document.getElementById("deviceList");
    const deviceName = document.getElementById("deviceName");
    const deviceCode = document.getElementById("deviceCode");
    const deviceType = document.getElementById("deviceType");
    const deviceStatus = document.getElementById("deviceStatus");
    const deviceGuard = document.getElementById("deviceGuard");
    const deviceBattery = document.getElementById("deviceBattery");
    const deviceLastSync = document.getElementById("deviceLastSync");
    const deviceActive = document.getElementById("deviceActive");
    const addDeviceButton = document.getElementById("addDeviceButton");
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
    const condoRoutePreview = document.getElementById("condoRoutePreview");
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
    const detailProgressText = document.getElementById("detailProgressText");
    const detailProgressBar = document.getElementById("detailProgressBar");
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
    let editorMapCenter = null;

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

    async function loadSupabaseCondominiums() {
      if (!supabaseClient) return null;
      const { data: condos, error: condosError } = await supabaseClient.from("condominios").select("*").order("criado_em", { ascending: false });
      if (condosError) {
        console.error("Erro ao carregar condomínios no Supabase:", condosError);
        return null;
      }

      const [{ data: routes, error: routesError }, { data: points, error: pointsError }] = await Promise.all([
        supabaseClient.from("rotas").select("*"),
        supabaseClient.from("pontos_rota").select("*").order("ordem", { ascending: true }),
      ]);

      if (routesError) console.warn("Rotas não carregadas do Supabase:", routesError);
      if (pointsError) console.warn("Pontos de rota não carregados do Supabase:", pointsError);

      return (condos || []).map((condo) => {
        const condoRoutes = (routes || []).filter((route) => route.condominio_id === condo.id);
        const patrolRouteSegments = condoRoutes.flatMap((route, index) => {
          const routePoints = (points || [])
            .filter((point) => point.rota_id === route.id)
            .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));
          if (routePoints.length >= 2) {
            const start = routePoints[0];
            const end = routePoints[routePoints.length - 1];
            return [{
              id: route.id,
              routeId: route.id,
              name: route.nome || `Rota ${index + 1}`,
              progress: 0,
              startLat: start.latitude,
              startLng: start.longitude,
              endLat: end.latitude,
              endLng: end.longitude,
            }];
          }
          return [];
        });

        return normalizeCondo({
          id: condo.id,
          name: condo.nome,
          deviceLinked: Boolean(condo.ativo),
          address: condo.endereco || "",
          city: condo.cidade || "",
          state: condo.estado || "",
          image: condo.imagem_url || "",
          googleAreaLat: condo.latitude || "",
          googleAreaLng: condo.longitude || "",
          googleMapType: condo.tipo_mapa || "k",
          googleMapZoom: condo.zoom_mapa || "18",
          patrolRouteSegments,
          notes: condo.observacoes || "",
        });
      });
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
          .map((segment, index) => normalizeRouteCoordinateSet({
            id: segment.id || segment.routeId || "",
            routeId: segment.routeId || segment.id || "",
            name: segment.name || `Rota ${index + 1}`,
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
        return normalizeRouteCoordinateSet({
          id: point.id || "",
          routeId: point.routeId || point.id || "",
          name: `Rota ${index + 1}`,
          progress: 0,
          startLat: normalizeCoordinate(point.lat),
          startLng: normalizeCoordinate(point.lng),
          endLat: normalizeCoordinate(next.lat),
          endLng: normalizeCoordinate(next.lng),
        });
      });
    }

    function normalizeRouteCoordinateSet(segment) {
      const startLat = normalizeCoordinate(segment.startLat);
      const startLng = normalizeCoordinate(segment.startLng);
      const endLat = normalizeCoordinate(segment.endLat);
      const endLng = normalizeCoordinate(segment.endLng);

      if (looksLikeLat(startLat) && looksLikeLat(startLng) && looksLikeLng(endLat) && looksLikeLng(endLng)) {
        return { ...segment, startLat, startLng: endLat, endLat: startLng, endLng };
      }

      if (looksLikeLng(startLat) && looksLikeLat(startLng) && looksLikeLng(endLat) && looksLikeLat(endLng)) {
        return { ...segment, startLat: startLng, startLng: startLat, endLat: endLng, endLng: endLat };
      }

      return { ...segment, startLat, startLng, endLat, endLng };
    }

    function looksLikeLat(value) {
      const number = Number(normalizeCoordinate(value));
      return Number.isFinite(number) && number >= -35 && number <= 8;
    }

    function looksLikeLng(value) {
      const number = Number(normalizeCoordinate(value));
      return Number.isFinite(number) && number >= -75 && number <= -30;
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

    function isUuid(value) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
    }

    async function saveCondominiumToSupabase(payload) {
      if (!supabaseClient) return true;
      const row = {
        nome: payload.name,
        endereco: payload.address || null,
        cidade: payload.city || null,
        estado: payload.state || null,
        imagem_url: payload.image || null,
        latitude: normalizeCoordinate(payload.googleAreaLat) || null,
        longitude: normalizeCoordinate(payload.googleAreaLng) || null,
        ativo: true,
      };
      if (isUuid(payload.id)) row.id = payload.id;

      const { data, error } = await supabaseClient.from("condominios").upsert(row).select().single();
      if (error) {
        console.error("Erro ao salvar condomínio no Supabase:", error);
        alert("Não consegui salvar o condomínio no Supabase. Confira RLS e colunas da tabela condominios.");
        return false;
      }
      if (data?.id) payload.id = data.id;
      return true;
    }

    async function saveRoutesForCondo(condo) {
      if (!supabaseClient || !isUuid(condo?.id)) return true;
      const segments = condo.patrolRouteSegments || [];
      const { data: oldRoutes, error: oldRoutesError } = await supabaseClient.from("rotas").select("id").eq("condominio_id", condo.id);
      if (oldRoutesError) {
        console.error("Erro ao consultar rotas antigas no Supabase:", oldRoutesError);
        return true;
      }
      const oldRouteIds = (oldRoutes || []).map((route) => route.id).filter(Boolean);
      if (oldRouteIds.length) {
        const { error: pointsDeleteError } = await supabaseClient.from("pontos_rota").delete().in("rota_id", oldRouteIds);
        if (pointsDeleteError) {
          console.error("Erro ao limpar pontos antigos no Supabase:", pointsDeleteError);
          return true;
        }
      }
      const { error: deleteError } = await supabaseClient.from("rotas").delete().eq("condominio_id", condo.id);
      if (deleteError) {
        console.error("Erro ao limpar rotas antigas no Supabase:", deleteError);
        return true;
      }
      if (!segments.length) return true;

      for (const [index, segment] of segments.entries()) {
        const { data: route, error: routeError } = await supabaseClient
          .from("rotas")
          .insert({
            condominio_id: condo.id,
            nome: segment.name || `Rota ${index + 1}`,
            ativo: true,
          })
          .select()
          .single();

        if (routeError || !route?.id) {
          console.error("Erro ao salvar rota no Supabase:", routeError);
          return true;
        }

        segment.id = route.id;
        segment.routeId = route.id;
        const points = [
          { rota_id: route.id, ordem: 1, nome: "Início", latitude: normalizeCoordinate(segment.startLat), longitude: normalizeCoordinate(segment.startLng) },
          { rota_id: route.id, ordem: 2, nome: "Fim", latitude: normalizeCoordinate(segment.endLat), longitude: normalizeCoordinate(segment.endLng) },
        ];
        const { error: pointsError } = await supabaseClient.from("pontos_rota").insert(points);
        if (pointsError) {
          console.error("Erro ao salvar pontos da rota no Supabase:", pointsError);
          return true;
        }
      }
      return true;
    }

    function generateGuardCode() {
      return `SAFE-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    function normalizeDevice(device = {}, index = 0) {
      return {
        id: device.id || `device-${Date.now()}-${index}`,
        name: device.name || device.nome || "Dispositivo sem nome",
        code: device.code || device.codigo_app || generateGuardCode(),
        condoId: device.condoId || device.condominio_id || "",
        type: device.type || device.tipo || "Ronda",
        status: device.status || "Aguardando sincronização",
        currentGuardId: device.currentGuardId || device.vigilante_atual_id || "",
        battery: Number.isFinite(Number(device.battery ?? device.bateria)) ? Number(device.battery ?? device.bateria) : "",
        lastSync: device.lastSync || device.ultima_sincronizacao || "",
        active: typeof device.active === "boolean" ? device.active : device.ativo !== false,
      };
    }

    function loadDevices() {
      try {
        const stored = localStorage.getItem(devicesStorageKey);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.map(normalizeDevice) : [];
      } catch {
        return [];
      }
    }

    function saveDevices() {
      localStorage.setItem(devicesStorageKey, JSON.stringify(devices));
    }

    async function loadSupabaseDevices() {
      if (!supabaseClient) return null;
      const { data, error } = await supabaseClient.from("dispositivos").select("*").order("criado_em", { ascending: false });
      if (error) {
        console.warn("Dispositivos não carregados do Supabase:", error);
        return null;
      }
      return (data || []).map(normalizeDevice);
    }

    async function saveDeviceToSupabase(device) {
      if (!supabaseClient) return true;
      const row = {
        nome: device.name,
        codigo_app: device.code,
        condominio_id: isUuid(device.condoId) ? device.condoId : null,
        tipo: device.type,
        status: device.status,
        vigilante_atual_id: isUuid(device.currentGuardId) ? device.currentGuardId : null,
        bateria: device.battery === "" ? null : Number(device.battery),
        ultima_sincronizacao: device.lastSync || null,
        ativo: Boolean(device.active),
      };
      if (isUuid(device.id)) row.id = device.id;
      const { data, error } = await supabaseClient.from("dispositivos").upsert(row).select().single();
      if (error) {
        console.error("Erro ao salvar dispositivo no Supabase:", error);
        console.warn("Dispositivo será mantido localmente até o Supabase aceitar a tabela/policies.");
        return true;
      }
      if (data?.id) device.id = data.id;
      return true;
    }

    function normalizeGuard(guard = {}, index = 0) {
      const progress = Number(guard.progress);
      const routeIndex = Number(guard.routeIndex);
      return {
        id: guard.id || `guard-${Date.now()}-${index}`,
        name: guard.name || "Vigilante sem nome",
        phone: guard.phone || "",
        condoId: guard.condoId || "",
        deviceId: guard.deviceId || guard.dispositivo_id || "",
        routeId: guard.routeId || "",
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

    async function loadSupabaseGuards() {
      if (!supabaseClient) return null;
      const { data, error } = await supabaseClient.from("vigilantes").select("*").order("criado_em", { ascending: false });
      if (error) {
        console.error("Erro ao carregar vigilantes no Supabase:", error);
        return null;
      }
      return (data || []).map((row, index) => {
        const condoId = row.condominio_id || row.condominio || "";
        const condo = condominiums.find((item) => item.id === condoId);
        return normalizeGuard({
          id: row.id,
          name: row.nome,
          phone: row.telefone,
          condoId,
          deviceId: row.dispositivo_id || "",
          shift: row.turno || "06:00 - 18:00",
          status: row.status || "Aguardando sincronização",
        }, index);
      });
    }

    async function saveGuardToSupabase(guard) {
      if (!supabaseClient) return true;
      const row = {
        nome: guard.name,
        telefone: guard.phone || null,
        condominio_id: isUuid(guard.condoId) ? guard.condoId : null,
        dispositivo_id: isUuid(guard.deviceId) ? guard.deviceId : null,
        turno: guard.shift,
        status: guard.status,
        ativo: true,
      };
      if (isUuid(guard.id)) row.id = guard.id;

      const attempts = [
        row,
        omitKeys(row, ["dispositivo_id"]),
        omitKeys(row, ["dispositivo_id", "turno", "status", "ativo"]),
        omitKeys(row, ["dispositivo_id", "turno", "status", "ativo", "condominio_id"]),
      ];

      let data = null;
      let lastError = null;
      for (const attempt of attempts) {
        const result = await supabaseClient.from("vigilantes").upsert(attempt).select().single();
        if (!result.error) {
          data = result.data;
          lastError = null;
          break;
        }
        lastError = result.error;
      }

      if (lastError) {
        console.warn("Vigilante salvo apenas localmente. Supabase recusou todas as tentativas:", lastError);
        return true;
      }
      if (data?.id) guard.id = data.id;
      return true;
    }

    function omitKeys(source, keys) {
      const copy = { ...source };
      keys.forEach((key) => delete copy[key]);
      return copy;
    }

    function activeGuard() {
      return guards.find((guard) => guard.id === selectedGuardId) || guards[0] || null;
    }

    function listenFirebaseLiveGuards() {
      if (!window.realtimeDb || !window.firebaseRef || !window.firebaseOnValue) {
        console.warn("Firebase Realtime ainda não carregado");
        return;
      }

      const guardsRef = window.firebaseRef(window.realtimeDb, "ao_vivo");

      window.firebaseOnValue(guardsRef, (snapshot) => {
        liveGuards = snapshot.val() || {};
        console.log("Dispositivos ao vivo:", liveGuards);
        updateMetricsFromCondos();
        renderMap();
      });
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
          routeEditing = false;
          draftRoute = condo.patrolRouteSegments?.length ? condo.patrolRouteSegments.map((segment) => ({ ...segment })) : [];
          lastOverviewMapSrc = "";
          fillForm(condo);
          overviewCondoPanel?.classList.remove("open");
          renderAllCondos();
          updateOverviewCondoMap();
          renderMap();
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
          routeEditing = false;
          draftRoute = condo.patrolRouteSegments?.length ? condo.patrolRouteSegments.map((segment) => ({ ...segment })) : [];
          lastOverviewMapSrc = "";
          fillForm(condo);
          renderAllCondos();
          updateOverviewCondoMap();
          renderMap();
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

    function populateGuardDeviceOptions(condoId) {
      if (!guardDevice) return;
      guardDevice.replaceChildren();
      const condoDevices = devices.filter((device) => String(device.condoId) === String(condoId) && device.active);
      if (!condoDevices.length) {
        guardDevice.appendChild(new Option("Nenhum dispositivo cadastrado", ""));
        guardDevice.disabled = true;
        return;
      }
      guardDevice.disabled = false;
      condoDevices.forEach((device) => {
        guardDevice.appendChild(new Option(`${device.name} · ${device.code}`, device.id));
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
      populateGuardDeviceOptions(defaultCondoId);
      document.getElementById("guardFormTitle").textContent = selected ? "Editar Vigilante" : "Novo Vigilante";
      document.getElementById("guardFormSubtitle").textContent = selected
        ? `${selected.name} · ${deviceLabel(selected.deviceId)}`
        : "Preencha os dados do vigilante e selecione o dispositivo assumido no turno.";
      guardName.value = selected?.name || "";
      guardPhone.value = selected?.phone || "";
      guardCondo.value = defaultCondoId;
      populateGuardDeviceOptions(defaultCondoId);
      guardDevice.value = selected?.deviceId || "";
      guardShift.value = selected?.shift || "06:00 - 18:00";
      guardStatus.value = selected?.status || "Aguardando sincronização";
      deleteGuardButton.disabled = !selected;
    }

    function clearGuardForm() {
      selectedGuardId = null;
      guardForm.reset();
      fillGuardForm(null);
      openGuardEditor();
    }

    function deviceLabel(deviceId) {
      const device = devices.find((item) => item.id === deviceId);
      return device ? `${device.name} · ${device.code}` : "Sem dispositivo";
    }

    function renderGuards() {
      if (!guardList) return;
      const term = (guardSearch?.value || "").trim().toLowerCase();
      const filtered = guards.filter((guard) => {
        const condo = condominiums.find((item) => item.id === guard.condoId);
        const text = `${guard.name} ${guard.phone} ${deviceLabel(guard.deviceId)} ${condo?.name || ""}`.toLowerCase();
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
            <small>${deviceLabel(guard.deviceId)}</small>
            <small>${condo?.name || "Sem condomínio"}</small>
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

    function populateDeviceGuardOptions() {
      if (!deviceGuard) return;
      deviceGuard.replaceChildren();
      deviceGuard.appendChild(new Option("Nenhum vigilante assumiu", ""));
      guards.forEach((guard) => {
        deviceGuard.appendChild(new Option(guard.name, guard.id));
      });
    }

    function renderDevices() {
      if (!deviceList) return;
      const condo = activeCondo();
      const condoDevices = devices.filter((device) => String(device.condoId) === String(condo?.id));
      deviceList.replaceChildren();
      if (!condoDevices.length) {
        const empty = document.createElement("div");
        empty.className = "device-item empty";
        empty.textContent = "Nenhum dispositivo cadastrado neste condomínio.";
        deviceList.appendChild(empty);
        return;
      }
      condoDevices.forEach((device) => {
        const guard = guards.find((item) => item.id === device.currentGuardId);
        const item = document.createElement("div");
        item.className = `device-item${device.active ? "" : " inactive"}`;
        item.innerHTML = `
          <strong>${device.name}</strong>
          <span>${device.code}</span>
          <small>${device.type} · ${device.status}</small>
          <small>${guard?.name || "Sem vigilante"} · Bateria ${device.battery === "" ? "--" : `${device.battery}%`}</small>
        `;
        deviceList.appendChild(item);
      });
    }

    async function addDeviceToCurrentCondo() {
      const condo = activeCondo();
      if (!condo || !deviceName || !deviceCode) return;
      const device = normalizeDevice({
        name: deviceName.value.trim() || "Dispositivo sem nome",
        code: deviceCode.value.trim() || generateGuardCode(),
        condoId: condo.id,
        type: deviceType.value || "Ronda",
        status: deviceStatus.value || "Aguardando sincronização",
        currentGuardId: deviceGuard.value || "",
        battery: deviceBattery.value.trim(),
        lastSync: deviceLastSync.value.trim(),
        active: deviceActive.checked,
      });
      const saved = await saveDeviceToSupabase(device);
      if (!saved) return;
      devices.unshift(device);
      saveDevices();
      clearDeviceFields();
      renderDevices();
      renderGuards();
      populateGuardDeviceOptions(guardCondo.value);
    }

    function clearDeviceFields() {
      if (!deviceName || !deviceCode || !deviceType || !deviceStatus || !deviceGuard || !deviceBattery || !deviceLastSync || !deviceActive) return;
      deviceName.value = "";
      deviceCode.value = generateGuardCode();
      deviceType.value = "Ronda";
      deviceStatus.value = "Aguardando sincronização";
      deviceGuard.value = "";
      deviceBattery.value = "";
      deviceLastSync.value = "";
      deviceActive.checked = true;
    }

    function syncGuardAssignments() {
      devices = devices.map((device) => {
        const guard = guards.find((item) => item.deviceId === device.id);
        return { ...device, currentGuardId: guard?.id || device.currentGuardId || "" };
      });

      condominiums.forEach((condo) => {
        condo.patrolRouteSegments = normalizeRouteSegments(condo.patrolRouteSegments, []);
        condo.patrolRouteGeo = routeSegmentsToPoints(condo.patrolRouteSegments);
        condo.patrolRoute = projectRoute(condo.patrolRouteGeo).map((point) => [Math.round(point.x), Math.round(point.y)]);
      });
      saveDevices();
      saveCondominiums();
    }

    async function saveGuardForm(event) {
      event.preventDefault();
      const existing = guards.find((guard) => guard.id === selectedGuardId);
      const payload = normalizeGuard({
        ...(existing || {}),
        id: existing?.id || `guard-${Date.now()}`,
        name: guardName.value.trim(),
        phone: guardPhone.value.trim(),
        condoId: guardCondo.value,
        deviceId: guardDevice.value,
        shift: guardShift.value,
        status: guardStatus.value,
      });

      const saved = await saveGuardToSupabase(payload);
      if (!saved) return;

      const existingIndex = guards.findIndex((guard) => guard.id === payload.id);
      if (existingIndex >= 0) {
        guards[existingIndex] = payload;
      } else {
        guards.unshift(payload);
      }
      selectedGuardId = payload.id;
      saveGuards();
      devices = devices.map((device) => {
        if (device.id === payload.deviceId) {
          return { ...device, currentGuardId: payload.id, status: payload.status };
        }
        if (device.currentGuardId === payload.id) {
          return { ...device, currentGuardId: "" };
        }
        return device;
      });
      const assignedDevice = devices.find((device) => device.id === payload.deviceId);
      if (assignedDevice) await saveDeviceToSupabase(assignedDevice);
      saveDevices();
      syncGuardAssignments();
      renderAllCondos();
      renderGuards();
      updateOverviewCondoMap();
      closeGuardEditor();
    }

    async function deleteSelectedGuard() {
      if (!selectedGuardId) return;
      if (supabaseClient && isUuid(selectedGuardId)) {
        const { error } = await supabaseClient.from("vigilantes").delete().eq("id", selectedGuardId);
        if (error) {
          console.error("Erro ao excluir vigilante no Supabase:", error);
          alert("Não consegui excluir o vigilante no Supabase.");
          return;
        }
      }
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
          const mid = {
            x: segmentPoints[0].x + (segmentPoints[segmentPoints.length - 1].x - segmentPoints[0].x) * 0.5 + 16,
            y: segmentPoints[0].y + (segmentPoints[segmentPoints.length - 1].y - segmentPoints[0].y) * 0.5,
          };
          const label = svg("text", { class: "route-name-label", x: mid.x, y: mid.y, transform: `rotate(-90 ${mid.x} ${mid.y})` });
          label.textContent = `${segment.name || `Rota ${index + 1}`} ${String(index + 1).padStart(2, "0")}`;
          plannedLayer.appendChild(label);
        });
        if (Object.keys(liveGuards || {}).length || devices.length) {
          completedLayer.appendChild(svg("path", { class: "route-completed", d: partialPath(activeRoute, 0.75 + Math.sin(tick / 5) * 0.02) }));
        }
      }

      segments.forEach((segment, index) => {
        const segmentPoints = projectRoute(routeSegmentsToPoints([segment]));
        if (segmentPoints.length < 2) return;
        const start = segmentPoints[0];
        const end = segmentPoints[segmentPoints.length - 1];
        const routeMarker = svg("g", { class: "route-map-marker", "data-route-index": index });
        routeMarker.appendChild(svg("circle", { class: "route-endpoint", cx: start.x, cy: start.y, r: 7 }));
        routeMarker.appendChild(svg("circle", { class: "route-endpoint", cx: end.x, cy: end.y, r: 7 }));
        routeMarker.addEventListener("click", () => selectRoute(index));
        mapCheckpoints.appendChild(routeMarker);
      });

      const hasLiveGuards = renderLiveGuardsOnMap();

      if (!hasLiveGuards) {
        guards
          .filter((guard) => !guard.condoId || guard.condoId === activeCondo()?.id)
          .forEach((guard, index) => {
            if (activeRoute.length < 2) return;
            const baseProgress = Number(guard.progress) ? Number(guard.progress) / 100 : 0.12 + index * 0.12;
            const moved = Math.max(0.02, Math.min(0.98, baseProgress)) + Math.sin((tick + index + 1) / 8) * 0.005;
            const point = pointAt(activeRoute, moved);
            mapGuards.appendChild(svg("circle", { class: "guard-dot", cx: point.x, cy: point.y, r: 8, fill: guard.color || colors.green }));
          });
      }
      renderSelectedRouteDetails();
    }

    function renderLiveGuardsOnMap() {
      if (!mapGuards || !activeCondo()) return false;

      const values = Object.values(liveGuards || {});
      const currentCondo = activeCondo();

      const filtered = values.filter((item) => {
        if (!item) return false;
        if (!item.latitude || !item.longitude) return false;
        return liveDeviceBelongsToCondo(item, currentCondo);
      });

      if (!filtered.length) return false;

      filtered.forEach((device) => {
        const projected = projectGeoPoint({
          lat: device.latitude,
          lng: device.longitude,
        });

        if (!projected) return;

        const dot = svg("circle", {
          class: "guard-dot live",
          cx: projected.x,
          cy: projected.y,
          r: 9,
          fill: colors.green,
        });

        mapGuards.appendChild(dot);

        const label = svg("text", {
          class: "map-label guard-live-label",
          x: projected.x + 14,
          y: projected.y + 4,
        });

        label.textContent = device.nome_dispositivo || device.dispositivo_id || device.codigo_app || "Dispositivo";
        mapGuards.appendChild(label);
      });

      return true;
    }

    function liveDeviceBelongsToCondo(item, condo) {
      if (!condo) return false;
      const liveCondoId = String(item.condominio_id || item.condominioId || "");
      const liveCondoName = String(item.condominio_nome || item.condominio || "").trim().toLowerCase();
      const code = String(item.codigo_app || item.codigoDispositivo || item.device_code || item.dispositivo_codigo || "").trim();
      const deviceId = String(item.dispositivo_id || item.deviceId || "").trim();

      if (liveCondoId && liveCondoId === String(condo.id)) return true;
      if (liveCondoName && liveCondoName === String(condo.name || "").trim().toLowerCase()) return true;

      const condoDevices = devices.filter((device) => String(device.condoId) === String(condo.id));
      if (code && condoDevices.some((device) => String(device.code).trim() === code)) return true;
      if (deviceId && condoDevices.some((device) => String(device.id) === deviceId)) return true;

      return !liveCondoId && !liveCondoName && !code && !deviceId;
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
        detailGuardName.textContent = "Nenhum dispositivo selecionado";
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
      const liveDevice = Object.values(liveGuards || {}).find((item) => {
        if (!item || !liveDeviceBelongsToCondo(item, activeCondo())) return false;
        if (item.rota_id && String(item.rota_id) === String(segment.routeId || segment.id)) return true;
        if (item.rota_nome && String(item.rota_nome).trim().toLowerCase() === String(segment.name || "").trim().toLowerCase()) return true;
        return false;
      });
      const statusInfo = liveDevice ? getDeviceStatus(liveDevice, segment) : null;
      detailRouteNumber.textContent = String(source.indexOf(segment) + 1).padStart(2, "0");
      detailGuardName.textContent = liveDevice?.nome_dispositivo || liveDevice?.dispositivo_id || "Dispositivo não definido";
      detailGuardStatus.textContent = statusInfo ? `${statusInfo.status} — ${statusInfo.label}` : "Aguardando dispositivo";
      detailRouteName.textContent = `Rota: ${segment.name || `Rota ${source.indexOf(segment) + 1}`}`;
      detailRoutePath.textContent = `${segment.startLat}, ${segment.startLng} até ${segment.endLat}, ${segment.endLng}`;
      detailProgressText.textContent = `${progress}%`;
      detailProgressBar.style.width = `${progress}%`;
      detailNextPoint.textContent = liveDevice?.etapa ? `${segment.name || "Rota"} · ${liveDevice.etapa}` : segment.name || "Fim da rota";
      detailEta.textContent = formatDuration(Number(liveDevice?.tempo_rota_segundos) || 0) || "--:--";
    }

    function formatClock(value) {
      const date = value ? new Date(value) : new Date();
      if (Number.isNaN(date.getTime())) return "--:--:--";
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }

    function formatDuration(seconds) {
      if (!seconds) return "";
      const total = Math.max(0, Math.floor(seconds));
      const minutes = Math.floor(total / 60);
      const rest = total % 60;
      return `${String(minutes).padStart(2, "0")}min ${String(rest).padStart(2, "0")}s`;
    }

    function getDeviceStatus(device, route) {
      const updatedAt = new Date(device.ultima_atualizacao || device.status_horario || Date.now());
      const movedAt = new Date(device.ultima_movimentacao || device.ultima_atualizacao || Date.now());
      const now = Date.now();
      const inactive = Number.isNaN(updatedAt.getTime()) || now - updatedAt.getTime() > 120000;
      if (inactive) return { status: "Dispositivo inativo", label: `Último sinal às ${formatClock(updatedAt)}` };
      const speed = Number(device.velocidade || 0);
      const position = { lat: device.latitude, lng: device.longitude };
      const distance = route ? nearestRouteDistanceMeters(position, routeSegmentsToPoints([route])) : 0;
      if (speed > 0.5 && distance > 35) return { status: "Desvio de rota", label: `Detectado às ${formatClock(device.status_horario || Date.now())}` };
      if (now - movedAt.getTime() > 300000) return { status: "Fora da patrulha", label: `Sem movimento desde ${formatClock(movedAt)}` };
      return { status: "Patrulhando", label: `Atualizado às ${formatClock(updatedAt)}` };
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

    async function saveRoute() {
      const condo = activeCondo();
      if (!condo || !draftRoute.length) return;
      condo.patrolRouteSegments = normalizeRouteSegments(draftRoute, []);
      condo.patrolRouteGeo = routeSegmentsToPoints(condo.patrolRouteSegments);
      condo.patrolRoute = projectRoute(condo.patrolRouteGeo).map((point) => [Math.round(point.x), Math.round(point.y)]);
      await saveRoutesForCondo(condo);
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
      const normalizedSegment = normalizeRouteCoordinateSet({
        name: routePointName.value.trim() || `Rota ${draftRoute.length + 1}`,
        progress: 0,
        startLat,
        startLng,
        endLat,
        endLng,
      });
      draftRoute.push(normalizedSegment);
      focusGoogleMapOnPoint({ lat: normalizedSegment.startLat, lng: normalizedSegment.startLng });
      routePointName.value = "";
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
        renderCondoRoutePreview();
        return;
      }
      source.forEach((segment, index) => {
        const item = document.createElement("span");
        item.className = "route-point-item";
        item.innerHTML = `
          <b>${String(index + 1).padStart(2, "0")}</b>
          <span>${segment.name || `Rota ${index + 1}`} · Início ${segment.startLat}, ${segment.startLng} · Fim ${segment.endLat}, ${segment.endLng}</span>
          <button type="button" data-focus-route="${index}" data-route-edge="start" title="Ver início no Google">Início</button>
          <button type="button" data-focus-route="${index}" data-route-edge="end" title="Ver fim no Google">Fim</button>
        `;
        routePointList.appendChild(item);
      });
      renderCondoRoutePreview();
    }

    function renderCondoRoutePreview() {
      if (!condoRoutePreview) return;
      condoRoutePreview.replaceChildren();
      const source = routeEditing ? draftRoute : activeCondo()?.patrolRouteSegments || [];
      if (!source.length) return;

      source.forEach((rawSegment, index) => {
        const segment = normalizeRouteCoordinateSet(rawSegment);
        const start = projectEditorRoutePoint({ lat: segment.startLat, lng: segment.startLng });
        const end = projectEditorRoutePoint({ lat: segment.endLat, lng: segment.endLng });
        if (!start || !end) return;

        const line = svg("line", {
          class: "condo-route-preview-line",
          x1: start.x,
          y1: start.y,
          x2: end.x,
          y2: end.y,
        });
        condoRoutePreview.appendChild(line);

        [start, end].forEach((point) => {
          condoRoutePreview.appendChild(svg("circle", {
            class: "condo-route-preview-point",
            cx: point.x,
            cy: point.y,
            r: 8,
          }));
        });

        const midX = start.x + (end.x - start.x) * 0.5;
        const midY = start.y + (end.y - start.y) * 0.5;
        const label = svg("text", {
          class: "condo-route-preview-label",
          x: midX + 12,
          y: midY - 8,
        });
        label.textContent = segment.name || `Rota ${index + 1}`;
        condoRoutePreview.appendChild(label);
      });
    }

    function projectEditorRoutePoint(point) {
      const lat = Number(normalizeCoordinate(point?.lat));
      const lng = Number(normalizeCoordinate(point?.lng));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const source = routeEditing ? draftRoute : activeCondo()?.patrolRouteSegments || [];
      const routePoints = routeSegmentsToPoints(source);
      const routeLats = routePoints.map((item) => Number(normalizeCoordinate(item.lat))).filter(Number.isFinite);
      const routeLngs = routePoints.map((item) => Number(normalizeCoordinate(item.lng))).filter(Number.isFinite);
      const centerLat =
        Number(normalizeCoordinate(editorMapCenter?.lat)) ||
        Number(normalizeCoordinate(googleAreaLat?.value)) ||
        Number(normalizeCoordinate(activeCondo()?.googleAreaLat)) ||
        (routeLats.length ? routeLats.reduce((sum, value) => sum + value, 0) / routeLats.length : lat);
      const centerLng =
        Number(normalizeCoordinate(editorMapCenter?.lng)) ||
        Number(normalizeCoordinate(googleAreaLng?.value)) ||
        Number(normalizeCoordinate(activeCondo()?.googleAreaLng)) ||
        (routeLngs.length ? routeLngs.reduce((sum, value) => sum + value, 0) / routeLngs.length : lng);
      const zoom = Number(googleMapZoom?.value || activeCondo()?.googleMapZoom || 18);
      const centerPixel = mercatorPixel(centerLat, centerLng, zoom);
      const pixel = mercatorPixel(lat, lng, zoom);
      const viewWidth = 1000;
      const viewHeight = 520;
      const previewRect = condoRoutePreview.getBoundingClientRect();
      const previewWidth = previewRect.width || viewWidth;
      const previewHeight = previewRect.height || viewHeight;
      const screenX = previewWidth / 2 + (pixel.x - centerPixel.x);
      const screenY = previewHeight / 2 + (pixel.y - centerPixel.y);

      return {
        x: Math.max(0, Math.min(viewWidth, (screenX / previewWidth) * viewWidth)),
        y: Math.max(0, Math.min(viewHeight, (screenY / previewHeight) * viewHeight)),
      };
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

    function projectGeoPoint(point) {
      const condo = activeCondo();
      if (!condo || !point) return null;

      const lat = Number(normalizeCoordinate(point.lat || point.latitude));
      const lng = Number(normalizeCoordinate(point.lng || point.longitude));

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const routePoints = routeSegmentsToPoints(condo.patrolRouteSegments || []);
      const routeLats = routePoints.map((item) => Number(normalizeCoordinate(item.lat))).filter(Number.isFinite);
      const routeLngs = routePoints.map((item) => Number(normalizeCoordinate(item.lng))).filter(Number.isFinite);
      const centerLat =
        Number(normalizeCoordinate(condo.googleAreaLat)) ||
        (routeLats.length ? routeLats.reduce((sum, value) => sum + value, 0) / routeLats.length : lat);
      const centerLng =
        Number(normalizeCoordinate(condo.googleAreaLng)) ||
        (routeLngs.length ? routeLngs.reduce((sum, value) => sum + value, 0) / routeLngs.length : lng);
      const zoom = Number(condo.googleMapZoom || 18);

      const centerPixel = mercatorPixel(centerLat, centerLng, zoom);
      const pixel = mercatorPixel(lat, lng, zoom);

      const viewWidth = 940;
      const viewHeight = 520;

      const canvasRect = mapCanvas.getBoundingClientRect();
      const canvasWidth = canvasRect.width || viewWidth;
      const canvasHeight = canvasRect.height || viewHeight;

      const screenX = canvasWidth / 2 + (pixel.x - centerPixel.x);
      const screenY = canvasHeight / 2 + (pixel.y - centerPixel.y);

      return {
        x: Math.max(0, Math.min(viewWidth, (screenX / canvasWidth) * viewWidth)),
        y: Math.max(0, Math.min(viewHeight, (screenY / canvasHeight) * viewHeight)),
      };
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
      header.innerHTML = "<span>Hora início</span><span>Rota</span><span>Dispositivo</span><span>Vigilante</span><span>Ida</span><span>Volta</span><span>Total</span><span>Status</span>";
      activeTable.appendChild(header);

      if (!completedRoutes.length) {
        const empty = document.createElement("div");
        empty.className = "table-row empty";
        empty.innerHTML = "<span>Nenhuma rota concluída hoje</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span>";
        activeTable.appendChild(empty);
        return;
      }

      completedRoutes.forEach((route) => {
        const row = document.createElement("div");
        row.className = "table-row";
        row.innerHTML = `
          <span>${route.startedAt}</span>
          <span>${route.name}</span>
          <span>${route.device || "-"}</span>
          <span>${route.guard || "-"}</span>
          <span>${route.outbound || "-"}</span>
          <span>${route.returned || "-"}</span>
          <span>${route.duration || "-"}</span>
          <span class="table-status">${route.status || "Concluída"}</span>
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
        const liveCount = Object.keys(liveGuards || {}).length;
        activeGuardsMetric.textContent = String(liveCount || guards.length);
      }
      if (openOccurrencesMetric) openOccurrencesMetric.textContent = "0";
    }

    function renderAllCondos() {
      renderCondos();
      renderAdminCondos();
      renderGuards();
      populateDeviceGuardOptions();
      renderDevices();
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
      populateDeviceGuardOptions();
      clearDeviceFields();
      renderDevices();
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
      populateDeviceGuardOptions();
      renderDevices();
      updateGoogleMap(null);
      deleteCondoButton.disabled = true;
      renderAllCondos();
      openCondoEditor();
    }

    async function saveForm(event) {
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

      const savedCondo = await saveCondominiumToSupabase(payload);
      if (!savedCondo) return;
      await saveRoutesForCondo(payload);

      const existingIndex = condominiums.findIndex((condo) => condo.id === selectedCondoId || condo.id === payload.id);
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

    async function deleteSelectedCondo() {
      if (!selectedCondoId || condominiums.length <= 1) return;
      if (supabaseClient && isUuid(selectedCondoId)) {
        const { error } = await supabaseClient.from("condominios").delete().eq("id", selectedCondoId);
        if (error) {
          console.error("Erro ao excluir condomínio no Supabase:", error);
          alert("Não consegui excluir o condomínio no Supabase.");
          return;
        }
      }
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
        editorMapCenter = null;
        if (googleMapLink) googleMapLink.href = "https://www.google.com/maps";
        renderCondoRoutePreview();
        return;
      }
      editorMapCenter = hasCoordinates ? { lat, lng } : null;
      const query = hasCoordinates ? `${lat},${lng}` : addressQuery;
      const encoded = encodeURIComponent(query);
      googleMapFrame.src = hasCoordinates
        ? `https://www.google.com/maps?ll=${lat},${lng}&t=${mapType}&z=${zoom}&output=embed`
        : `https://www.google.com/maps?q=${encoded}&t=${mapType}&z=${zoom}&output=embed`;
      if (googleMapLink) {
        googleMapLink.href = hasCoordinates
          ? `https://www.google.com/maps/@${lat},${lng},${zoom}z/data=!3m1!1e3`
          : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
      }
      renderCondoRoutePreview();
    }

    function focusGoogleMapOnPoint(point) {
      const lat = normalizeCoordinate(point?.lat);
      const lng = normalizeCoordinate(point?.lng);
      if (!lat || !lng) return;
      const zoom = formValue("googleMapZoom") || activeCondo()?.googleMapZoom || "19";
      const mapType = formValue("googleMapType") || activeCondo()?.googleMapType || "k";
      editorMapCenter = { lat, lng };
      googleMapFrame.src = `https://www.google.com/maps?ll=${lat},${lng}&t=${mapType}&z=${zoom}&output=embed`;
      if (googleMapLink) googleMapLink.href = `https://www.google.com/maps/@${lat},${lng},${zoom}z/data=!3m1!1e3`;
      renderCondoRoutePreview();
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
    function on(element, eventName, handler) {
      element?.addEventListener(eventName, handler);
    }

    on(document.getElementById("newCondoButton"), "click", clearForm);
    on(document.getElementById("resetFormButton"), "click", clearForm);
    on(document.getElementById("newGuardButton"), "click", clearGuardForm);
    on(document.getElementById("resetGuardFormButton"), "click", clearGuardForm);
    on(condoForm, "submit", saveForm);
    on(guardForm, "submit", saveGuardForm);
    on(deleteCondoButton, "click", deleteSelectedCondo);
    on(deleteGuardButton, "click", deleteSelectedGuard);
    on(adminSearch, "input", renderAdminCondos);
    on(guardSearch, "input", renderGuards);
    statusFilter?.addEventListener("change", renderAdminCondos);
    on(condoImage, "change", handleImageUpload);
    on(removeImageButton, "click", () => {
      currentImage = "";
      condoImage.value = "";
      renderImagePreview();
    });
    on(closeEditorButton, "click", closeCondoEditor);
    on(closeGuardEditorButton, "click", closeGuardEditor);
    on(condoEditorOverlay, "click", (event) => {
      if (event.target === condoEditorOverlay) closeCondoEditor();
    });
    on(guardEditorOverlay, "click", (event) => {
      if (event.target === guardEditorOverlay) closeGuardEditor();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && condoEditorOverlay.classList.contains("open")) closeCondoEditor();
      if (event.key === "Escape" && guardEditorOverlay.classList.contains("open")) closeGuardEditor();
    });
    ["condoAddress", "condoCity", "condoState"].forEach((id) => {
      on(document.getElementById(id), "change", () => updateGoogleMap(null));
    });
    on(applyGoogleAreaButton, "click", () => updateGoogleMap(null));
    on(googleAreaLat, "change", () => updateGoogleMap(null));
    on(googleAreaLng, "change", () => updateGoogleMap(null));
    on(googleMapType, "change", () => updateGoogleMap(null));
    on(googleMapZoom, "change", () => updateGoogleMap(null));
    if (googleMapsApiKey) googleMapsApiKey.value = localStorage.getItem(googleMapsApiKeyStorageKey) || "";
    on(googleMapsApiKey, "change", saveGoogleMapsApiKey);
    on(guardCondo, "change", () => populateGuardDeviceOptions(guardCondo.value));
    on(addDeviceButton, "click", addDeviceToCurrentCondo);
    on(editRouteButton, "click", startRouteEditing);
    on(saveRouteButton, "click", saveRoute);
    on(clearRouteButton, "click", clearRoute);
    on(addCoordinatePointButton, "click", addRoutePoint);
    on(routePointList, "click", (event) => {
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
    [routePointName, routeStartLat, routeStartLng, routeEndLat, routeEndLng].forEach((input) => {
      on(input, "keydown", (event) => {
        if (event.key === "Enter") addRoutePoint(event);
      });
    });

    async function initializePanel() {
      const remoteCondos = await loadSupabaseCondominiums();
      condominiums = remoteCondos || loadCondominiums();
      selectedCondoId = condominiums[0]?.id || null;
      listenFirebaseLiveGuards();

      const remoteDevices = await loadSupabaseDevices();
      devices = remoteDevices || loadDevices();

      const remoteGuards = await loadSupabaseGuards();
      guards = remoteGuards || loadGuards();
      selectedGuardId = guards[0]?.id || null;

      syncGuardAssignments();
      renderAllCondos();
      renderTable();
      renderHistory();
      fillForm(activeCondo());
      updateOverviewCondoMap();
      render();
      setInterval(render, 1200);
      window.safewayPanelReady = true;
    }

    initializePanel();
  } catch (error) {
    window.safewayPanelError = String(error && error.stack || error);
    const message = document.createElement("pre");
    message.style.cssText = "position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;padding:16px;border:1px solid #ff4d63;border-radius:8px;background:#180b10;color:#ffd6dc;white-space:pre-wrap";
    message.textContent = window.safewayPanelError;
    document.body.appendChild(message);
  }
})();
