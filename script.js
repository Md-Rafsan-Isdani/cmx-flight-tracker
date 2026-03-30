/* ============================================================
   CMX FLIGHT TRACKER — SCRIPT.JS
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  // =======================
  // CONFIG — add your keys
  // =======================
  const WEATHER_API_KEY = "d1cd9db2d75eeea7256c3c549ee57fd4";
  const FLIGHTS_API_KEY = "b8d1eb66f94a55c5490f2e8d4a30e101"; // ← paste your aviationstack.com key here
  const HANCOCK_LAT     = 47.1742;
  const HANCOCK_LON     = -88.4904;

  // =======================
  // CLOCK
  // =======================
  function updateClock() {
    const now = new Date();
    document.getElementById("clock").textContent =
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    document.getElementById("clock-date").textContent =
      now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  }
  updateClock();
  setInterval(updateClock, 1000);

  // =======================
  // DATE HELPERS
  // =======================
  function toLocalDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseDateInputAsLocal(str) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function shortDate(d) {
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function formatTime(isoString) {
    if (!isoString) return "–";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatStatus(s) {
    if (!s) return "–";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function statusClass(s) {
    const map = {
      scheduled: "status-scheduled",
      active:    "status-active",
      landed:    "status-landed",
      delayed:   "status-delayed",
      cancelled: "status-cancelled",
      diverted:  "status-diverted",
    };
    return map[s] || "status-scheduled";
  }

  // =======================
  // WEATHER ICON MAP
  // =======================
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
  // DATE TAB LABELS
  // =======================
  function populateDateLabels() {
    const today = new Date();
    const offsets = [-2, -1, 0, 1];
    const ids = ["date-label-2", "date-label-1", "date-label-0", "date-label-3"];
    offsets.forEach((offset, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      document.getElementById(ids[i]).textContent = shortDate(d);
    });
  }
  populateDateLabels();

  // =======================
  // WEATHER — CURRENT
  // =======================
  async function loadWeather() {
    try {
      const res = await fetch(
        `http://api.openweathermap.org/data/2.5/weather?lat=${HANCOCK_LAT}&lon=${HANCOCK_LON}&appid=${WEATHER_API_KEY}&units=imperial`
      );
      const d = await res.json();
      if (d.cod !== 200) throw new Error(d.message);

      document.getElementById("weather-icon").textContent    = weatherIcon(d.weather[0].id);
      document.getElementById("weather-temp").textContent    = `${Math.round(d.main.temp)}°F`;
      document.getElementById("weather-desc").textContent    =
        d.weather[0].description.replace(/\b\w/g, c => c.toUpperCase());
      document.getElementById("weather-wind").textContent    = `${d.wind.speed} mph`;
      document.getElementById("weather-humidity").textContent= `${d.main.humidity}%`;
      document.getElementById("weather-vis").textContent     = d.visibility
        ? `${(d.visibility / 1609.34).toFixed(1)} mi`
        : "–";
      document.getElementById("weather-pressure").textContent= `${d.main.pressure} hPa`;
      document.getElementById("weather-time").textContent    =
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (err) {
      document.getElementById("weather-desc").textContent = "Weather unavailable";
      console.error("Weather error:", err);
    }
  }

  // =======================
  // WEATHER — FORECAST
  // =======================
  async function loadForecast() {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${HANCOCK_LAT}&lon=${HANCOCK_LON}&appid=${WEATHER_API_KEY}&units=imperial&cnt=16`
      );
      const data = await res.json();
      if (data.cod != 200) throw new Error(data.message);

      const today = new Date().toLocaleDateString();
      const days = {};
      data.list.forEach(item => {
        const itemDate = new Date(item.dt * 1000);
        const dateKey  = itemDate.toLocaleDateString();
        if (dateKey === today) return;
        if (!days[dateKey]) days[dateKey] = [];
        days[dateKey].push(item);
      });

      const dayKeys = Object.keys(days).slice(0, 2);
      const container = document.getElementById("weather-forecast");
      container.innerHTML = "";

      dayKeys.forEach(key => {
        const entries = days[key];
        const highTemp = Math.round(Math.max(...entries.map(e => e.main.temp_max)));
        const lowTemp  = Math.round(Math.min(...entries.map(e => e.main.temp_min)));
        const midday   = entries.find(e => new Date(e.dt * 1000).getHours() >= 12) || entries[0];
        const d        = new Date(midday.dt * 1000);
        const dayLabel = d.toLocaleDateString([], { weekday: "short" }).toUpperCase();

        container.insertAdjacentHTML("beforeend", `
          <div class="forecast-card">
            <div class="forecast-day">${dayLabel}</div>
            <span class="forecast-icon">${weatherIcon(midday.weather[0].id)}</span>
            <div class="forecast-temps">
              <span class="forecast-high">${highTemp}°</span>
              <span class="forecast-low">${lowTemp}°</span>
            </div>
          </div>
        `);
      });
    } catch (err) {
      console.error("Forecast error:", err);
    }
  }

  loadWeather();
  loadForecast();
  setInterval(() => { loadWeather(); loadForecast(); }, 600000);

  // =======================
  // (REST OF YOUR CODE UNCHANGED)
  // =======================

 // every 10 min

  // =======================
  // FLIGHTS
  // =======================

  // Demo/fallback data when no API key is present
  function getDemoFlights(dateStr, type) {
    const isToday = dateStr === toLocalDateStr(new Date());
    const airlines = [
      { name: "United Express", iata: "UA" },
      { name: "SkyWest Airlines", iata: "OO" },
    ];
    const flights = [];
    const statusOptions = isToday
      ? ["active", "scheduled", "delayed", "landed"]
      : ["landed", "landed", "landed", "cancelled"];

    for (let i = 0; i < 2; i++) {
      const al = airlines[i];
      const num = 4000 + Math.floor(Math.random() * 999);
      const base = new Date(dateStr + "T" + (9 + i * 4) + ":30:00");
      const delayed = statusOptions[i] === "delayed" ? 25 : 0;
      flights.push({
        airline: { name: al.name },
        flight:  { iata: al.iata + num, number: num },
        departure: {
          iata: type === "arrivals" ? ["ORD","DTW"][i] : "CMX",
          scheduled: new Date(base).toISOString(),
          actual: delayed ? new Date(base.getTime() + delayed * 60000).toISOString() : null,
          gate: ["A1","B2"][i],
        },
        arrival: {
          iata: type === "arrivals" ? "CMX" : ["ORD","DTW"][i],
          scheduled: new Date(base.getTime() + 90 * 60000).toISOString(),
          actual: delayed ? new Date(base.getTime() + (90 + delayed) * 60000).toISOString() : null,
          gate: ["G1","G2"][i],
        },
        flight_status: statusOptions[i],
        aircraft: { registration: ["N" + (12000 + i * 17),"N" + (34500 + i * 11)][i] },
      });
    }
    return flights;
  }

  async function fetchFlights(dateStr) {
    if (!FLIGHTS_API_KEY) {
      // Return demo data so the UI is always populated
      return {
        arrivals:   getDemoFlights(dateStr, "arrivals"),
        departures: getDemoFlights(dateStr, "departures"),
        isDemo: true,
      };
    }
    try {
      const [arrRes, depRes] = await Promise.all([
        fetch(`https://api.aviationstack.com/v1/flights?access_key=${FLIGHTS_API_KEY}&arr_iata=CMX&flight_date=${dateStr}`),
        fetch(`https://api.aviationstack.com/v1/flights?access_key=${FLIGHTS_API_KEY}&dep_iata=CMX&flight_date=${dateStr}`),
      ]);
      const [arrData, depData] = await Promise.all([arrRes.json(), depRes.json()]);
      return {
        arrivals:   arrData.data  || [],
        departures: depData.data  || [],
        isDemo: false,
      };
    } catch (err) {
      console.error("Flights fetch error:", err);
      return { arrivals: [], departures: [], error: true };
    }
  }

  function buildFlightRow(f, type) {
    const isArrival = type === "arrivals";
    const dep = f.departure || {};
    const arr = f.arrival   || {};

    const originDest = isArrival ? dep.iata || "–" : arr.iata || "–";
    const schedTime  = isArrival ? arr.scheduled    : dep.scheduled;
    const actualTime = isArrival ? arr.actual        : dep.actual;
    const gate       = isArrival ? (arr.gate || dep.gate) : (dep.gate || arr.gate);
    const aircraft   = f.aircraft?.registration || "";

    const delayMs   = schedTime && actualTime
      ? new Date(actualTime) - new Date(schedTime)
      : 0;
    const delayMins = Math.round(delayMs / 60000);
    const delayText = delayMins > 1 ? `+${delayMins}m` : "";

    return `
      <div class="flight-row">
        <div>
          <div class="flight-number">${f.flight?.iata || f.flight?.number || "–"}</div>
          <div class="airline-name">${f.airline?.name || "–"}</div>
        </div>
        <div class="flight-mid">
          <div class="flight-route">
            <span class="iata-code">${originDest}</span>
            <span style="color:var(--text-muted); margin: 0 4px; font-size:11px;">${isArrival ? "FROM" : "TO"}</span>
          </div>
          <div class="flight-meta">
            ${gate      ? `<span>Gate ${gate}</span>` : ""}
            ${aircraft  ? `<span>${aircraft}</span>`  : ""}
          </div>
        </div>
        <div class="flight-right">
          <div class="time-block">
            <span class="time-sched">${formatTime(schedTime)}</span>
            ${actualTime && delayMins > 0
              ? `<span class="time-actual" style="color:var(--red)">${formatTime(actualTime)} ${delayText}</span>`
              : actualTime
                ? `<span class="time-actual">${formatTime(actualTime)}</span>`
                : ""
            }
          </div>
          <span class="status-badge ${statusClass(f.flight_status)}">${formatStatus(f.flight_status)}</span>
        </div>
      </div>
    `;
  }

  function renderFlightList(flights, listId, type, isDemo, hasError) {
    const el = document.getElementById(listId);

    if (hasError) {
      el.innerHTML = `<div class="error-state">⚠ Failed to load flight data. Check your API key or connection.</div>`;
      return;
    }

    if (isDemo) {
      el.innerHTML = `
        <div style="padding: 8px 16px 4px; font-family: var(--font-mono); font-size: 10px; color: var(--yellow); background: rgba(255,214,0,0.06); border-bottom: 1px solid var(--border); letter-spacing:0.06em;">
          ⚠ DEMO DATA — Add your AviationStack API key to enable live flights
        </div>
        ${flights.map(f => buildFlightRow(f, type)).join("")}
      `;
      return;
    }

    if (!flights || flights.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✈</div>
          <div>No flights found for this date</div>
          <div style="font-size:11px;margin-top:4px;color:var(--text-muted)">CMX operates limited seasonal service</div>
        </div>
      `;
      return;
    }

    el.innerHTML = flights.slice(0, 4).map(f => buildFlightRow(f, type)).join("");
  }

  // =======================
  // LOAD FLIGHTS
  // =======================
  async function loadFlightsByDate(dateObj, activeOffset = null) {
    // Show loading spinners
    document.getElementById("arrivals-list").innerHTML   = `<div class="loading-state"><div class="spinner"></div><span>Loading...</span></div>`;
    document.getElementById("departures-list").innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading...</span></div>`;

    // Update active button
    document.querySelectorAll(".date-btn").forEach(btn => {
      btn.classList.toggle("active", activeOffset !== null && parseInt(btn.dataset.offset) === activeOffset);
    });

    const dateStr = toLocalDateStr(dateObj);
    const data    = await fetchFlights(dateStr);

    renderFlightList(data.arrivals,   "arrivals-list",   "arrivals",   data.isDemo, data.error);
    renderFlightList(data.departures, "departures-list", "departures", data.isDemo, data.error);

    document.getElementById("flights-updated").textContent =
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // =======================
  // DATE BUTTONS
  // =======================
  document.querySelectorAll(".date-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const offset = parseInt(btn.dataset.offset);
      const d = new Date();
      d.setDate(d.getDate() + offset);
      loadFlightsByDate(d, offset);
    });
  });

  document.getElementById("search-btn").addEventListener("click", () => {
    const val = document.getElementById("search-date").value;
    if (!val) return alert("Please select a date first.");
    loadFlightsByDate(parseDateInputAsLocal(val), null);
  });

  document.getElementById("search-date").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("search-btn").click();
  });

  // Load today on start
  loadFlightsByDate(new Date(), 0);

  // Auto-refresh flights every 2 minutes
  setInterval(() => {
    const activeBtn = document.querySelector(".date-btn.active");
    if (activeBtn) {
      const offset = parseInt(activeBtn.dataset.offset);
      const d = new Date();
      d.setDate(d.getDate() + offset);
      loadFlightsByDate(d, offset);
    }
  }, 120000);

  // =======================
  // WEBCAM AUTO-REFRESH
  // =======================
  // Replace WEBCAM_URL with your real webcam image URL.
  // Many airport webcams are just auto-refreshing JPEGs.
  const WEBCAM_URL = ""; // ← e.g. "https://your-webcam-url.jpg"
  let webcamCountdown = 30;

  function refreshWebcam() {
    const img = document.getElementById("webcam-img");
    if (WEBCAM_URL) {
      img.style.opacity = "0.6";
      const fresh = new Image();
      fresh.onload = () => {
        img.src = fresh.src;
        img.style.opacity = "1";
      };
      fresh.onerror = () => { img.style.opacity = "1"; };
      fresh.src = `${WEBCAM_URL}?t=${Date.now()}`;
    }
    document.getElementById("webcam-ts").textContent =
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    webcamCountdown = 30;
  }

  function webcamTick() {
    webcamCountdown--;
    document.getElementById("webcam-next").textContent = webcamCountdown;
    if (webcamCountdown <= 0) refreshWebcam();
  }

  // Init webcam timestamp
  refreshWebcam();
  setInterval(webcamTick, 1000);

});
