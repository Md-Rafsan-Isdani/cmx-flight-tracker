
// =======================
// CONFIG
// =======================
const WEATHER_API_KEY = "d1cd9db2d75eeea7256c3c549ee57fd4"; // replace with your OpenWeatherMap key
const FLIGHT_API_KEY = "b8d1eb66f94a55c5490f2e8d4a30e101"; // replace with AviationStack key
const LAT = 47.1715;
const LON = -88.5126;

// =======================
// CLOCK
// =======================
function updateClock() {
  const now = new Date();
  const options = { weekday: "short", month: "short", day: "numeric" };
  document.getElementById("clock").textContent = now.toLocaleTimeString([], { hour12: false });
  document.getElementById("clock-date").textContent = now.toLocaleDateString([], options);
}
setInterval(updateClock, 1000);
updateClock();

// =======================
// WEATHER
// =======================
async function fetchWeather() {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=imperial&appid=${WEATHER_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    document.getElementById("weather-temp").textContent = `${Math.round(data.main.temp)}°F`;
    document.getElementById("weather-desc").textContent = data.weather[0].description;
    document.getElementById("weather-wind").textContent = `${Math.round(data.wind.speed)} mph`;
    document.getElementById("weather-humidity").textContent = `${data.main.humidity}%`;
    document.getElementById("weather-vis").textContent = `${(data.visibility / 1609.34).toFixed(1)} mi`;
    document.getElementById("weather-pressure").textContent = `${data.main.pressure} hPa`;

    // Simple icon mapping
    const iconEl = document.getElementById("weather-icon");
    const main = data.weather[0].main.toLowerCase();
    if (main.includes("cloud")) iconEl.textContent = "☁";
    else if (main.includes("rain")) iconEl.textContent = "🌧";
    else if (main.includes("clear")) iconEl.textContent = "☀";
    else if (main.includes("snow")) iconEl.textContent = "❄";
    else iconEl.textContent = "🌡";

    document.getElementById("weather-time").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (err) {
    console.error("Weather fetch failed:", err);
  }
}
fetchWeather();
setInterval(fetchWeather, 10 * 60 * 1000); // every 10 min

// =======================
// FLIGHTS
// =======================
let currentFlightDate = new Date();

function formatDate(date) {
  return date.toISOString().split("T")[0]; // yyyy-mm-dd
}

async function fetchFlights(date = new Date()) {
  const formattedDate = formatDate(date);
  currentFlightDate = date;

  // Arrivals
  const arrivalsUrl = `https://api.aviationstack.com/v1/flights?access_key=${FLIGHT_API_KEY}&arr_icao=KCMX&flight_date=${formattedDate}`;
  // Departures
  const departuresUrl = `https://api.aviationstack.com/v1/flights?access_key=${FLIGHT_API_KEY}&dep_icao=KCMX&flight_date=${formattedDate}`;

  try {
    const [arrivalsRes, departuresRes] = await Promise.all([fetch(arrivalsUrl), fetch(departuresUrl)]);
    const arrivalsData = await arrivalsRes.json();
    const departuresData = await departuresRes.json();

    populateBoard("arrivals-list", arrivalsData.data, "arrival");
    populateBoard("departures-list", departuresData.data, "departure");

    document.getElementById("flights-updated").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (err) {
    console.error("Flight fetch failed:", err);
  }
}

function populateBoard(boardId, flights, type) {
  const container = document.getElementById(boardId);
  container.innerHTML = "";

  if (!flights || flights.length === 0) {
    container.innerHTML = `<div class="loading-state"><span>No flights found</span></div>`;
    return;
  }

  flights.forEach(f => {
    const row = document.createElement("div");
    row.className = "flight-row";
    const flightNum = f.flight ? f.flight.iata || f.flight.number : "---";
    const airline = f.airline ? f.airline.name : "---";
    const fromTo = type === "arrival" ? (f.departure ? f.departure.iata : "---") : (f.arrival ? f.arrival.iata : "---");
    const time = type === "arrival" ? (f.arrival ? f.arrival.scheduled : "---") : (f.departure ? f.departure.scheduled : "---");

    row.innerHTML = `
      <div class="flight-num">${flightNum}</div>
      <div class="flight-airline">${airline}</div>
      <div class="flight-fromto">${fromTo}</div>
      <div class="flight-time">${time !== "---" ? new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "---"}</div>
    `;
    container.appendChild(row);
  });
}

// Auto-refresh every 2 minutes
fetchFlights(currentFlightDate);
setInterval(() => fetchFlights(currentFlightDate), 2 * 60 * 1000);

// =======================
// DATE NAVIGATION
// =======================
document.querySelectorAll(".date-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".date-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const offset = parseInt(btn.dataset.offset);
    const date = new Date();
    date.setDate(date.getDate() + offset);
    fetchFlights(date);
  });
});

document.getElementById("search-btn").addEventListener("click", () => {
  const dateStr = document.getElementById("search-date").value;
  if (!dateStr) return;
  const date = new Date(dateStr);
  document.querySelectorAll(".date-btn").forEach(b => b.classList.remove("active"));
  fetchFlights(date);
});

// =======================
// WEBCAM
// =======================
function refreshWebcam() {
  const img = document.getElementById("webcam-img");
  const ts = document.getElementById("webcam-ts");
  const next = document.getElementById("webcam-next");

  const timestamp = new Date().getTime();
  img.src = `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=640&q=80&ts=${timestamp}`;
  ts.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let countdown = 30;
  next.textContent = countdown;
  const interval = setInterval(() => {
    countdown--;
    next.textContent = countdown;
    if (countdown <= 0) clearInterval(interval);
  }, 1000);
}

refreshWebcam();
setInterval(refreshWebcam, 30 * 1000);
