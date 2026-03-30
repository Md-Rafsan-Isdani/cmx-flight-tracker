/* ============================================================
   CMX FLIGHT TRACKER — script.js
   Mock flight data (200 flights), lat/lon weather, rotating webcam
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  // =======================
  // CONFIG
  // =======================
  const WEATHER_API_KEY = "d1cd9db2d75eeea7256c3c549ee57fd4";
  const HANCOCK_LAT     = 47.1742;
  const HANCOCK_LON     = -88.4904;

  // =======================
  // WEBCAM IMAGE POOL
  // 10 aviation/airfield images that rotate every 30 seconds
  // =======================
  const WEBCAM_IMAGES = [
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
    "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&q=80",
    "https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=800&q=80",
    "https://images.unsplash.com/photo-1542296332-6d9e07573af7?w=800&q=80",
    "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&q=80",
    "https://images.unsplash.com/photo-1534481016308-0fca71578ae5?w=800&q=80",
    "https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800&q=80",
    "https://images.unsplash.com/photo-1507812984078-917a274065be?w=800&q=80",
    "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=80",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80",
  ];
  let webcamIndex     = 0;
  let webcamCountdown = 30;

  // =======================
  // MOCK DATA SEED ARRAYS
  // =======================
  const AIRLINES = [
    { name: "United Express",   iata: "UA" },
    { name: "SkyWest Airlines", iata: "OO" },
    { name: "American Eagle",   iata: "AA" },
    { name: "Delta Connection", iata: "DL" },
    { name: "Cape Air",         iata: "9K" },
    { name: "Endeavor Air",     iata: "9E" },
    { name: "Mesa Airlines",    iata: "YV" },
  ];

  const HUB_AIRPORTS = [
    { iata: "ORD", city: "Chicago"      },
    { iata: "DTW", city: "Detroit"      },
    { iata: "MSP", city: "Minneapolis"  },
    { iata: "MKE", city: "Milwaukee"    },
    { iata: "GRR", city: "Grand Rapids" },
    { iata: "CWA", city: "Wausau"       },
    { iata: "ESC", city: "Escanaba"     },
    { iata: "IWD", city: "Ironwood"     },
  ];

  const AIRCRAFT_TYPES = [
    "ERJ-145","CRJ-200","CRJ-700","ATR 72","Beech 1900","Cessna 208","PC-12"
  ];

  const GATES = ["G1","G2","G3","G4"];

  const STATUS_TODAY  = ["scheduled","scheduled","active","active","delayed","delayed","landed","landed","landed","cancelled"];
  const STATUS_PAST   = ["landed","landed","landed","cancelled","diverted"];
  const STATUS_FUTURE = ["scheduled","scheduled","scheduled","delayed"];

  // =======================
  // UTILS
  // =======================
  function rnd(min, max)  { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr)      { return arr[rnd(0, arr.length - 1)]; }

  function toLocalDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  function parseDateInputAsLocal(str) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function shortDate(d) {
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function makeTimeISO(dateStr, hour, minute) {
    const m = minute % 60;
    const h = (hour + Math.floor(minute / 60)) % 24;
    return `${dateStr}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00`;
  }

  function formatTime(iso) {
    if (!iso) return "–";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatStatus(s) {
    if (!s) return "–";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function statusClass(s) {
    return { scheduled:"status-scheduled", active:"status-active", landed:"status-landed",
             delayed:"status-delayed", cancelled:"status-cancelled", diverted:"status-diverted" }[s] || "status-scheduled";
  }

  function weatherIcon(code) {
    if (code >= 200 && code < 300) return "⛈";
    if (code >= 300 && code < 400) return "🌦";
    if (code >= 500 && code < 600) return "🌧";
    if (code >= 600 && code < 700) return "❄";
    if (code === 800) return "☀";
    if (code === 801) return "🌤";
    if (code <= 804) return "☁";
    return "🌡";
  }

  // =======================
  // CLOCK
  // =======================
  function updateClock() {
    const now = new Date();
    const c   = document.getElementById("clock");
    const cd  = document.getElementById("clock-date");
    if (c)  c.textContent  = now.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" });
    if (cd) cd.textContent = now.toLocaleDateString([], { weekday:"short", month:"short", day:"numeric", year:"numeric" }).toUpperCase();
  }
  updateClock();
  setInterval(updateClock, 1000);

  // =======================
  // DATE TAB LABELS
  // =======================
  (function populateDateLabels() {
    const today = new Date();
    [[-2,"date-label-2"],[-1,"date-label-1"],[0,"date-label-0"],[1,"date-label-3"]].forEach(([off,id]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const d  = new Date(today);
      d.setDate(d.getDate() + off);
      el.textContent = shortDate(d);
    });
  })();

  // =======================
  // WEATHER — current (lat/lon)
  // =======================
  async function loadWeather() {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${HANCOCK_LAT}&lon=${HANCOCK_LON}&appid=${WEATHER_API_KEY}&units=imperial`
      );
      const d = await res.json();
      if (d.cod !== 200) throw new Error(d.message);
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set("weather-icon",     weatherIcon(d.weather[0].id));
      set("weather-temp",     `${Math.round(d.main.temp)}°F`);
      set("weather-desc",     d.weather[0].description);
      set("weather-wind",     `${d.wind.speed} mph`);
      set("weather-humidity", `${d.main.humidity}%`);
      set("weather-vis",      d.visibility ? `${(d.visibility/1609.34).toFixed(1)} mi` : "–");
      set("weather-pressure", `${d.main.pressure} hPa`);
      set("weather-time",     new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
    } catch (err) {
      const el = document.getElementById("weather-desc");
      if (el) el.textContent = "Weather unavailable";
      console.error("Weather:", err);
    }
  }

  // =======================
  // WEATHER — 2-day forecast (lat/lon)
  // =======================
  async function loadForecast() {
    try {
      const res  = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${HANCOCK_LAT}&lon=${HANCOCK_LON}&appid=${WEATHER_API_KEY}&units=imperial&cnt=16`
      );
      const data = await res.json();
      if (data.cod !== "200") throw new Error(data.message);
      const todayStr = new Date().toLocaleDateString();
      const days     = {};
      data.list.forEach(item => {
        const key = new Date(item.dt * 1000).toLocaleDateString();
        if (key === todayStr) return;
        (days[key] = days[key] || []).push(item);
      });
      const container = document.getElementById("weather-forecast");
      if (!container) return;
      container.innerHTML = "";
      Object.keys(days).slice(0, 2).forEach(key => {
        const entries = days[key];
        const high    = Math.round(Math.max(...entries.map(e => e.main.temp_max)));
        const low     = Math.round(Math.min(...entries.map(e => e.main.temp_min)));
        const mid     = entries.find(e => new Date(e.dt*1000).getHours() >= 12) || entries[0];
        const lbl     = new Date(mid.dt*1000).toLocaleDateString([], { weekday:"short" }).toUpperCase();
        container.insertAdjacentHTML("beforeend", `
          <div class="forecast-card">
            <div class="forecast-day">${lbl}</div>
            <span class="forecast-icon">${weatherIcon(mid.weather[0].id)}</span>
            <div class="forecast-temps">
              <span class="forecast-high">${high}°</span>
              <span class="forecast-low">${low}°</span>
            </div>
          </div>
        `);
      });
    } catch (err) { console.error("Forecast:", err); }
  }

  loadWeather();
  loadForecast();
  setInterval(() => { loadWeather(); loadForecast(); }, 600000);

  // =======================
  // BUILD 200-FLIGHT MOCK DB
  // ~50 flights/day across 4 days (today±2, tomorrow)
  // =======================
  function buildFlightDB() {
    const db    = {};
    const today = new Date();

    for (let offset = -2; offset <= 1; offset++) {
      const d       = new Date(today);
      d.setDate(d.getDate() + offset);
      const dateStr = toLocalDateStr(d);
      const pool    = offset < 0 ? STATUS_PAST : offset === 0 ? STATUS_TODAY : STATUS_FUTURE;
      const count   = rnd(23, 27); // ~25 per day × 4 days = 100 pairs = 200 total flights

      const arrivals   = [];
      const departures = [];

      // Spread evenly across 05:00–22:00
      for (let i = 0; i < count; i++) {
        const airline  = pick(AIRLINES);
        const hub      = pick(HUB_AIRPORTS);
        const flightNo = airline.iata + rnd(1000, 9999);
        const status   = pick(pool);
        const aircraft = pick(AIRCRAFT_TYPES);
        const gate     = pick(GATES);

        const baseHour  = 5 + Math.floor((i / count) * 17); // spread 05-22
        const baseMin   = rnd(0, 59);
        const delayArr  = status === "delayed" ? rnd(15, 90) : 0;
        const delayDep  = status === "delayed" ? rnd(10, 60) : 0;

        const arrSchedISO  = makeTimeISO(dateStr, baseHour, baseMin);
        const arrActualISO = (status === "landed" || status === "active" || status === "delayed")
          ? makeTimeISO(dateStr, baseHour, baseMin + delayArr) : null;

        const depBaseHour = baseHour + rnd(1, 3);
        const depSchedISO  = makeTimeISO(dateStr, depBaseHour, baseMin);
        const depActualISO = (status === "landed" || status === "active" || status === "delayed")
          ? makeTimeISO(dateStr, depBaseHour, baseMin + delayDep) : null;

        arrivals.push({
          flight:        { iata: flightNo },
          airline:       { name: airline.name },
          departure:     { iata: hub.iata,  city: hub.city,   scheduled: arrSchedISO, actual: arrActualISO, gate: null },
          arrival:       { iata: "CMX",     city: "Hancock",  scheduled: arrSchedISO, actual: arrActualISO, gate },
          flight_status: status,
          aircraft:      { type: aircraft },
        });

        departures.push({
          flight:        { iata: airline.iata + rnd(1000, 9999) },
          airline:       { name: airline.name },
          departure:     { iata: "CMX",     city: "Hancock",  scheduled: depSchedISO, actual: depActualISO, gate },
          arrival:       { iata: hub.iata,  city: hub.city,   scheduled: depSchedISO, actual: depActualISO, gate: null },
          flight_status: status,
          aircraft:      { type: aircraft },
        });
      }

      arrivals.sort((a,b)   => new Date(a.arrival.scheduled)   - new Date(b.arrival.scheduled));
      departures.sort((a,b) => new Date(a.departure.scheduled) - new Date(b.departure.scheduled));
      db[dateStr] = { arrivals, departures };
    }
    return db;
  }

  const FLIGHT_DB = buildFlightDB();

  // For arbitrary calendar dates: generate on-the-fly
  function getFlightsForDate(dateStr) {
    if (FLIGHT_DB[dateStr]) return FLIGHT_DB[dateStr];
    const arrivals = [], departures = [];
    const count    = rnd(8, 16);
    for (let i = 0; i < count; i++) {
      const airline  = pick(AIRLINES);
      const hub      = pick(HUB_AIRPORTS);
      const flightNo = airline.iata + rnd(1000, 9999);
      const hour     = rnd(6, 20);
      const minute   = pick([0,10,15,20,30,40,45,50]);
      const schedISO = makeTimeISO(dateStr, hour, minute);
      const status   = pick(STATUS_PAST);

      arrivals.push({
        flight:        { iata: flightNo },
        airline:       { name: airline.name },
        departure:     { iata: hub.iata, scheduled: schedISO, actual: schedISO, gate: null },
        arrival:       { iata: "CMX",    scheduled: schedISO, actual: schedISO, gate: pick(GATES) },
        flight_status: status,
        aircraft:      { type: pick(AIRCRAFT_TYPES) },
      });
      departures.push({
        flight:        { iata: airline.iata + rnd(1000,9999) },
        airline:       { name: airline.name },
        departure:     { iata: "CMX",    scheduled: schedISO, actual: schedISO, gate: pick(GATES) },
        arrival:       { iata: hub.iata, scheduled: schedISO, actual: schedISO, gate: null },
        flight_status: status,
        aircraft:      { type: pick(AIRCRAFT_TYPES) },
      });
    }
    arrivals.sort((a,b)   => new Date(a.arrival.scheduled)   - new Date(b.arrival.scheduled));
    departures.sort((a,b) => new Date(a.departure.scheduled) - new Date(b.departure.scheduled));
    return { arrivals, departures };
  }

  // =======================
  // RENDER FLIGHTS
  // =======================
  function buildFlightRow(f, type) {
    const isArr  = type === "arrivals";
    const dep    = f.departure || {};
    const arr    = f.arrival   || {};
    const sched  = isArr ? arr.scheduled  : dep.scheduled;
    const actual = isArr ? arr.actual     : dep.actual;
    const gate   = isArr ? (arr.gate || "–") : (dep.gate || "–");
    const remote = isArr ? dep.iata : arr.iata;

    const delayMs   = sched && actual ? new Date(actual) - new Date(sched) : 0;
    const delayMins = Math.round(delayMs / 60000);

    return `
      <div class="flight-row">
        <div class="fcol-id">
          <div class="flight-number">${f.flight?.iata || "–"}</div>
          <div class="airline-name">${f.airline?.name || "–"}</div>
        </div>
        <div class="fcol-mid">
          <div class="flight-route">
            <span class="iata-code">${remote || "–"}</span>
            <span class="dir-lbl">${isArr ? "FROM" : "TO"}</span>
          </div>
          <div class="flight-meta">
            <span>Gate ${gate}</span>
            ${f.aircraft?.type ? `<span>${f.aircraft.type}</span>` : ""}
          </div>
        </div>
        <div class="fcol-right">
          <div class="time-block">
            <span class="time-sched">${formatTime(sched)}</span>
            ${actual && delayMins > 1
              ? `<span class="time-actual delay-red">${formatTime(actual)} +${delayMins}m</span>`
              : actual
                ? `<span class="time-actual">${formatTime(actual)}</span>`
                : ""}
          </div>
          <span class="status-badge ${statusClass(f.flight_status)}">${formatStatus(f.flight_status)}</span>
        </div>
      </div>`;
  }

  function renderList(flights, listId, type) {
    const el = document.getElementById(listId);
    if (!el) return;

    if (!flights || flights.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">✈</div><span>No flights found for this date.</span></div>`;
      return;
    }

    el._allFlights = flights;
    const first = flights.slice(0, 4);
    const rest  = flights.length - 4;
    let html = first.map(f => buildFlightRow(f, type)).join("");
    if (rest > 0) {
      html += `<div class="show-more-wrap"><button class="show-more-btn" data-list="${listId}" data-type="${type}" data-shown="4">Show ${rest} more ▾</button></div>`;
    }
    el.innerHTML = html;
  }

  document.addEventListener("click", e => {
    const btn = e.target.closest(".show-more-btn");
    if (!btn) return;
    const { list: listId, type, shown } = btn.dataset;
    const shownN = parseInt(shown);
    const el     = document.getElementById(listId);
    if (!el?._allFlights) return;
    const next      = el._allFlights.slice(shownN, shownN + 4);
    const remaining = el._allFlights.length - shownN - next.length;
    el.querySelector(".show-more-wrap")?.remove();
    next.forEach(f => el.insertAdjacentHTML("beforeend", buildFlightRow(f, type)));
    if (remaining > 0) {
      el.insertAdjacentHTML("beforeend",
        `<div class="show-more-wrap"><button class="show-more-btn" data-list="${listId}" data-type="${type}" data-shown="${shownN + next.length}">Show ${remaining} more ▾</button></div>`
      );
    }
  });

  function setLoading() {
    ["arrivals-list","departures-list"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading...</span></div>`;
    });
  }

  function loadFlightsByDate(dateObj, activeOffset = null) {
    setLoading();
    document.querySelectorAll(".date-btn").forEach(btn => {
      btn.classList.toggle("active", activeOffset !== null && parseInt(btn.dataset.offset) === activeOffset);
    });
    setTimeout(() => {
      const dateStr = toLocalDateStr(dateObj);
      const data    = getFlightsForDate(dateStr);
      renderList(data.arrivals,   "arrivals-list",   "arrivals");
      renderList(data.departures, "departures-list", "departures");
      const upd = document.getElementById("flights-updated");
      if (upd) upd.textContent = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    }, 280);
  }

  // =======================
  // DATE BUTTONS
  // =======================
  document.querySelectorAll(".date-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const offset = parseInt(btn.dataset.offset);
      const d      = new Date();
      d.setDate(d.getDate() + offset);
      loadFlightsByDate(d, offset);
    });
  });

  const searchBtn  = document.getElementById("search-btn");
  const searchDate = document.getElementById("search-date");

  searchBtn?.addEventListener("click", () => {
    const val = searchDate?.value;
    if (!val) return alert("Please select a date first.");
    loadFlightsByDate(parseDateInputAsLocal(val), null);
  });

  searchDate?.addEventListener("keydown", e => {
    if (e.key === "Enter") searchBtn?.click();
  });

  loadFlightsByDate(new Date(), 0);

  // Auto-refresh flights every 2 min
  setInterval(() => {
    const active = document.querySelector(".date-btn.active");
    if (!active) return;
    const offset = parseInt(active.dataset.offset);
    const d      = new Date();
    d.setDate(d.getDate() + offset);
    loadFlightsByDate(d, offset);
  }, 120000);

  // =======================
  // WEBCAM ROTATION
  // =======================
  function showWebcamImage(index) {
    const img = document.getElementById("webcam-img");
    if (!img) return;
    img.style.opacity = "0.4";
    const fresh = new Image();
    fresh.onload  = () => { img.src = fresh.src; img.style.opacity = "1"; };
    fresh.onerror = () => { img.style.opacity = "1"; };
    fresh.src = WEBCAM_IMAGES[index % WEBCAM_IMAGES.length];
    const ts = document.getElementById("webcam-ts");
    if (ts) ts.textContent = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  }

  function webcamTick() {
    webcamCountdown--;
    const nxt = document.getElementById("webcam-next");
    if (nxt) nxt.textContent = webcamCountdown;
    if (webcamCountdown <= 0) {
      webcamIndex = (webcamIndex + 1) % WEBCAM_IMAGES.length;
      showWebcamImage(webcamIndex);
      webcamCountdown = 30;
    }
  }

  showWebcamImage(0);
  setInterval(webcamTick, 1000);

  // =======================
  // INJECTED CSS
  // (works with both your style.css files)
  // =======================
  const style = document.createElement("style");
  style.textContent = `
    .boards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 768px) { .boards-grid { grid-template-columns: 1fr; } }

    .flight-row {
      display: grid;
      grid-template-columns: 120px 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 11px 14px;
      border-bottom: 1px solid #e8eaed;
      transition: background 0.15s;
      animation: rowIn 0.22s ease;
    }
    .flight-row:last-of-type { border-bottom: none; }
    .flight-row:hover { background: #f5f7fb; }
    @keyframes rowIn { from { opacity:0; transform:translateY(3px); } to { opacity:1; transform:none; } }

    .flight-number { font-family:'Space Mono',monospace; font-size:13px; font-weight:700; color:#1a1a2e; }
    .airline-name  { font-size:11px; color:#999; margin-top:2px; }
    .flight-route  { display:flex; align-items:center; gap:6px; }
    .iata-code     { font-family:'Space Mono',monospace; font-size:14px; font-weight:700; color:#1a1a2e; }
    .dir-lbl       { font-size:10px; color:#bbb; letter-spacing:0.06em; }
    .flight-meta   { display:flex; gap:8px; font-size:11px; color:#aaa; margin-top:2px; font-family:'Space Mono',monospace; }
    .fcol-right    { display:flex; flex-direction:column; align-items:flex-end; gap:5px; }
    .time-block    { text-align:right; }
    .time-sched    { font-family:'Space Mono',monospace; font-size:15px; font-weight:700; color:#1a1a2e; display:block; }
    .time-actual   { font-family:'Space Mono',monospace; font-size:11px; color:#aaa; display:block; }
    .delay-red     { color:#e53935 !important; }

    .status-badge    { display:inline-block; padding:3px 9px; border-radius:20px; font-family:'Space Mono',monospace; font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; white-space:nowrap; }
    .status-scheduled{ background:#e3f2fd; color:#1565c0; }
    .status-active   { background:#e8f5e9; color:#2e7d32; }
    .status-landed   { background:#e0f2f1; color:#00695c; }
    .status-delayed  { background:#ffebee; color:#c62828; }
    .status-cancelled{ background:#fce4ec; color:#ad1457; }
    .status-diverted { background:#fff3e0; color:#e65100; }

    .loading-state { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:50px 20px; color:#aaa; font-size:13px; }
    .spinner       { width:22px; height:22px; border:2px solid #ddd; border-top-color:#1976d2; border-radius:50%; animation:spin 0.75s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:50px 20px; color:#bbb; font-size:13px; gap:8px; text-align:center; }
    .empty-icon  { font-size:30px; opacity:0.4; }

    .show-more-wrap { text-align:center; padding:10px; border-top:1px solid #eee; }
    .show-more-btn  { background:none; border:1px solid #1976d2; color:#1976d2; border-radius:6px; padding:6px 18px; font-size:12px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s; }
    .show-more-btn:hover { background:#e3f2fd; }

    .webcam-frame img { transition: opacity 0.4s ease; }

    .forecast-card  { background:#f0f4fa; border-radius:8px; padding:10px 14px; min-width:80px; text-align:center; }
    .forecast-day   { font-size:10px; color:#888; letter-spacing:0.08em; margin-bottom:4px; font-family:'Space Mono',monospace; }
    .forecast-icon  { font-size:22px; display:block; margin-bottom:4px; }
    .forecast-temps { display:flex; justify-content:center; gap:6px; }
    .forecast-high  { font-family:'Space Mono',monospace; font-size:13px; font-weight:700; color:#1a1a2e; }
    .forecast-low   { font-family:'Space Mono',monospace; font-size:13px; color:#aaa; }
    .detail-label   { display:block; font-size:10px; color:#888; letter-spacing:0.08em; margin-bottom:2px; }
    .detail-val     { font-family:'Space Mono',monospace; font-size:13px; font-weight:700; color:#1a1a2e; }
  `;
  document.head.appendChild(style);

});
