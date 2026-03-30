// =======================
// CONFIG
// =======================

// OpenWeatherMap API key
const WEATHER_API_KEY = "d1cd9db2d75eeea7256c3c549ee57fd4";

// Aviationstack API key
const FLIGHTS_API_KEY = "b8d1eb66f94a55c5490f2e8d4a30e101";

// CMX webcam URL (replace with real if available)
const WEBCAM_URL = "https://via.placeholder.com/400x300?text=CMX+Webcam";

// =======================
// WEATHER
// =======================
async function getWeather() {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Houghton,MI&appid=${WEATHER_API_KEY}&units=imperial`
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

// Refresh weather every 10 minutes
setInterval(getWeather, 600000);
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

    // Show 2 arrivals
    document.getElementById("arrivals").innerHTML = "<h2>Arrivals</h2>" +
      arrivals.slice(0, 2).map(f =>
        `<p>${f.airline.name} ${f.flight.number} from ${f.departure.iata} | Scheduled: ${f.departure.scheduled || "–"} | Actual: ${f.departure.actual || "–"} | Status: ${f.flight_status}</p>`
      ).join("");

    // Show 2 departures
    document.getElementById("departures").innerHTML = "<h2>Departures</h2>" +
      departures.slice(0, 2).map(f =>
        `<p>${f.airline.name} ${f.flight.number} to ${f.arrival.iata} | Scheduled: ${f.arrival.scheduled || "–"} | Actual: ${f.arrival.actual || "–"} | Status: ${f.flight_status}</p>`
      ).join("");

  } catch (err) {
    console.error(err);
    document.getElementById("arrivals").innerHTML += "<p>Error loading arrivals</p>";
    document.getElementById("departures").innerHTML += "<p>Error loading departures</p>";
  }
}

// Refresh flights every 5 minutes
setInterval(populateFlights, 300000);
populateFlights();

// =======================
// WEBCAM
// =======================
function updateWebcam() {
  const cam = document.querySelector("#webcam img");
  cam.src = WEBCAM_URL + "?t=" + new Date().getTime(); // prevents caching
}
setInterval(updateWebcam, 30000); // refresh every 30s
updateWebcam();

// =======================
// LAST UPDATED TIMESTAMP
// =======================
function updateTime() {
  const now = new Date();
  document.getElementById("last-updated").innerText = now.toLocaleTimeString();
}
setInterval(updateTime, 60000);
updateTime();
