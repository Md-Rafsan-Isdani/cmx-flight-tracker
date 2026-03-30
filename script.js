document.addEventListener("DOMContentLoaded", () => {
  // =======================
  // CONFIG
  // =======================
  const WEATHER_API_KEY = "d1cd9db2d75eeea7256c3c549ee57fd4"; 
  const FLIGHTS_API_KEY = ""; 
  const HANCOCK_CITY_ID = 4996575;

  // =======================
  // HELPERS
  // =======================
  function formatTime(isoString) {
    if (!isoString) return "–";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatStatus(status) {
    if (!status) return "–";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function statusClass(status) {
    switch(status) {
      case "scheduled": return "status-scheduled";
      case "active": return "status-active";
      case "delayed": return "status-delayed";
      case "landed": return "status-landed";
      default: return "";
    }
  }

  // =======================
  // WEATHER
  // =======================
  async function getWeather() {
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?id=${HANCOCK_CITY_ID}&appid=${WEATHER_API_KEY}&units=imperial`);
      const data = await res.json();
      if (data.cod !== 200) {
        document.getElementById("weather").innerHTML = "Weather error: " + data.message;
        return;
      }
      document.getElementById("weather").innerHTML =
        `Temp: ${data.main.temp}°F | Wind: ${data.wind.speed} mph | ${data.weather[0].description}`;
    } catch (err) {
      document.getElementById("weather").innerHTML = "Failed to load weather";
      console.error(err);
    }
  }
  getWeather();
  setInterval(getWeather, 600000); // refresh every 10 minutes

  // =======================
  // FLIGHTS
  // =======================
  async function getFlights(dateStr) {
    try {
      const arrivalsRes = await fetch(`https://api.aviationstack.com/v1/flights?access_key=${FLIGHTS_API_KEY}&arr_iata=CMX&flight_date=${dateStr}`);
      const departuresRes = await fetch(`https://api.aviationstack.com/v1/flights?access_key=${FLIGHTS_API_KEY}&dep_iata=CMX&flight_date=${dateStr}`);
      const arrivalsData = await arrivalsRes.json();
      const departuresData = await departuresRes.json();
      return {
        arrivals: arrivalsData.data || [],
        departures: departuresData.data || []
      };
    } catch(err) {
      console.error(err);
      return { arrivals: [], departures: [] };
    }
  }

  function renderFlights(flights, containerId) {
    const container = document.getElementById(containerId);
    if (!flights || flights.length === 0) {
      container.innerHTML = "<h2>" + (containerId==="arrivals"?"Arrivals":"Departures") + "</h2><p>No flights found.</p>";
      return;
    }
    container.innerHTML = "<h2>" + (containerId==="arrivals"?"Arrivals":"Departures") + "</h2>" +
      flights.slice(0, 5).map(f =>
        `<p>
          <strong>${f.airline.name} ${f.flight.number}</strong> 
          ${containerId==="arrivals" ? "from" : "to"} ${containerId==="arrivals"?f.departure.iata:f.arrival.iata} |
          Scheduled: ${formatTime(containerId==="arrivals"?f.departure.scheduled:f.arrival.scheduled)} |
          Actual: ${formatTime(containerId==="arrivals"?f.departure.actual:f.arrival.actual)} |
          Status: <span class="${statusClass(f.flight_status)}">${formatStatus(f.flight_status)}</span>
        </p>`).join("");
  }

  async function loadFlightsByDate(dateObj) {
    const dateStr = dateObj.toISOString().split('T')[0];
    const flights = await getFlights(dateStr);
    renderFlights(flights.arrivals, "arrivals");
    renderFlights(flights.departures, "departures");
    updateTime();
  }

  function updateTime() {
    const now = new Date();
    document.getElementById("last-updated").innerText = now.toLocaleTimeString();
  }

  // =======================
  // DATE TABS
  // =======================
  document.querySelectorAll(".date-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const offset = parseInt(btn.dataset.offset);
      const date = new Date();
      date.setDate(date.getDate() + offset);
      loadFlightsByDate(date);
    });
  });

  document.getElementById("search-btn").addEventListener("click", () => {
    const dateInput = document.getElementById("search-date").value;
    if (!dateInput) return alert("Select a date");
    loadFlightsByDate(new Date(dateInput));
  });

  // Load today's flights by default
  document.getElementById("today-btn").click();

  // Auto-update time every minute
  setInterval(updateTime, 60000);
});
