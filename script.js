// =======================
// CONFIG
// =======================
const WEATHER_API_KEY = "d1cd9db2d75eeea7256c3c549ee57fd4";
const FLIGHTS_API_KEY = "b8d1eb66f94a55c5490f2e8d4a30e101";

// Houghton city ID for OpenWeatherMap
const HOUGHTON_CITY_ID = 4996574; 

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
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?id=${HOUGHTON_CITY_ID}&appid=${WEATHER_API_KEY}&units=imperial`
    );
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
setInterval(getWeather, 600000); // refresh every 10 mins
getWeather();

// =======================
// FLIGHTS
// =======================
async function getArrivals() {
  const res = await fetch(
    `https://api.aviationstack.com/v1/flights?access_key=${FLIGHTS_API_KEY}&arr_iata=CMX`
  );
  const data = await res.json();
  return data.data || [];
}

async function getDepartures() {
  const res = await fetch(
    `https://api.aviationstack.com/v1/flights?access_key=${FLIGHTS_API_KEY}&dep_iata=CMX`
  );
  const data = await res.json();
  return data.data || [];
}

async function populateFlights() {
  try {
    const arrivals = await getArrivals();
    const departures = await getDepartures();

    document.getElementById("arrivals").innerHTML = "<h2>Arrivals</h2>" +
      arrivals.slice(0,2).map(f =>
        `<p>
          <strong>${f.airline.name} ${f.flight.number}</strong> from ${f.departure.iata} |
          Scheduled: ${formatTime(f.departure.scheduled)} |
          Actual: ${formatTime(f.departure.actual)} |
          Status: <span class="${statusClass(f.flight_status)}">${formatStatus(f.flight_status)}</span>
        </p>`
      ).join("");

    document.getElementById("departures").innerHTML = "<h2>Departures</h2>" +
      departures.slice(0,2).map(f =>
        `<p>
          <strong>${f.airline.name} ${f.flight.number}</strong> to ${f.arrival.iata} |
          Scheduled: ${formatTime(f.arrival.scheduled)} |
          Actual: ${formatTime(f.arrival.actual)} |
          Status: <span class="${statusClass(f.flight_status)}">${formatStatus(f.flight_status)}</span>
        </p>`
      ).join("");

  } catch (err) {
    console.error(err);
    document.getElementById("arrivals").innerHTML += "<p>Error loading arrivals</p>";
    document.getElementById("departures").innerHTML += "<p>Error loading departures</p>";
  }
}
setInterval(populateFlights, 300000); // refresh every 5 mins
populateFlights();

// =======================
// LAST UPDATED TIMESTAMP
// =======================
function updateTime() {
  const now = new Date();
  document.getElementById("last-updated").innerText = now.toLocaleTimeString();
}
setInterval(updateTime, 60000);
updateTime();
