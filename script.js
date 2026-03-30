/* ============================================================
   CMX FLIGHT TRACKER — SCRIPT.JS
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  // =======================
  // CONFIG — add your keys
  // =======================
  const WEATHER_API_KEY = "d1cd9db2d75eeea7256c3c549ee57fd4";
  const FLIGHTS_API_KEY = ""; // ← paste your aviationstack.com key here
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
        `https://api.openweathermap.org/data/2.5/weather?lat=${HANCOCK_LAT}&lon=${HANCOCK_LON}&appid=${WEATHER_API_KEY}&units=imperial`
      );
      const d = await res.json();
      if (d.cod !== 200) throw new Error(d.message);

      document.getElementById("weather-icon").textContent    = weatherIcon(d.weather[0].id);
      document.getElementById("weather-temp").textContent    = `${Math.round(d.main.temp)}°F`;
      document.getElementById("weather-desc").textContent    = d.weather[0].description;
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
      if (data.cod !== "200") throw new Error(data.message);

      // Get one entry per day (noon-ish), skipping today, for next 2 days
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
        // Pick midday entry or first
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
  setInterval(() => { loadWeather(); loadForecast(); }, 600000); // every 10 min

  // =======================
  // FLIGHTS
  // =======================
  // … rest of your flights code remains unchanged …
  // (getDemoFlights, fetchFlights, buildFlightRow, renderFlightList, loadFlightsByDate, date buttons, auto-refresh)
  
  // Copy-paste the rest of your existing flights/webcam code here
  // Starting from getDemoFlights() all the way to the end of document.addEventListener

});
