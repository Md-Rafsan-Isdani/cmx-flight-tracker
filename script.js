// =========================
// FLIGHT BOARD USING OPENSKY + MOCK
// =========================

// =========================
// CONFIG
// =========================
const AIRPORT_ICAO = "KCMX"; // Change to test other airports
const ARRIVALS_LIST = document.getElementById("arrivals-list");
const DEPARTURES_LIST = document.getElementById("departures-list");
const FLIGHTS_UPDATED = document.getElementById("flights-updated");

let currentFlightDate = new Date();

// =========================
// MOCK DATA (fallback for small airports like CMX)
// =========================
const MOCK_FLIGHTS = [
  { flight: "DL123", airline: "Delta Airlines", from: "DTW", to: "CMX", time: "10:30" },
  { flight: "AA456", airline: "American Airlines", from: "ORD", to: "CMX", time: "13:00" },
  { flight: "DL789", airline: "Delta Airlines", from: "CMX", to: "DTW", time: "15:00" },
];

// =========================
// UTILITIES
// =========================
function formatTime(dateStr) {
  return dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "---";
}

function formatDate(date) {
  return date.toISOString().split("T")[0]; // yyyy-mm-dd
}

// Populate board
function populateBoard(container, flights, type) {
  container.innerHTML = "";
  if (!flights || flights.length === 0) {
    container.innerHTML = "<div class='loading-state'>No flights found</div>";
    return;
  }

  flights.forEach(f => {
    const row = document.createElement("div");
    row.className = "flight-row";
    row.innerHTML = `
      <div class="flight-num">${f.flight}</div>
      <div class="flight-airline">${f.airline}</div>
      <div class="flight-fromto">${type === "arrival" ? f.from : f.to}</div>
      <div class="flight-time">${f.time}</div>
    `;
    container.appendChild(row);
  });
}

// =========================
// FETCH LIVE FLIGHTS (OpenSky API)
// =========================
async function fetchOpenSkyFlights(date = new Date()) {
  try {
    const begin = Math.floor(new Date(date).setHours(0,0,0,0)/1000);
    const end = Math.floor(new Date(date).setHours(23,59,59,999)/1000);

    const url = `https://opensky-network.org/api/flights/arrival?airport=${AIRPORT_ICAO}&begin=${begin}&end=${end}`;
    const res = await fetch(url);
    const data = await res.json();

    let arrivals = [];
    let departures = [];

    if (data && data.length > 0) {
      arrivals = data.filter(f => f.estArrivalAirport === AIRPORT_ICAO).map(f => ({
        flight: f.callsign?.trim() || "---",
        airline: f.estDepartureAirport || "---",
        from: f.estDepartureAirport || "---",
        to: AIRPORT_ICAO,
        time: formatTime(f.lastSeen * 1000)
      }));

      departures = data.filter(f => f.estDepartureAirport === AIRPORT_ICAO).map(f => ({
        flight: f.callsign?.trim() || "---",
        airline: f.estArrivalAirport || "---",
        from: AIRPORT_ICAO,
        to: f.estArrivalAirport || "---",
        time: formatTime(f.firstSeen * 1000)
      }));
    }

    // If no flights, fallback to mock
    if (!arrivals.length) arrivals = MOCK_FLIGHTS.filter(f => f.to === AIRPORT_ICAO);
    if (!departures.length) departures = MOCK_FLIGHTS.filter(f => f.from === AIRPORT_ICAO);

    populateBoard(ARRIVALS_LIST, arrivals, "arrival");
    populateBoard(DEPARTURES_LIST, departures, "departure");

    FLIGHTS_UPDATED.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  } catch (err) {
    console.error("OpenSky fetch failed:", err);
    populateBoard(ARRIVALS_LIST, MOCK_FLIGHTS.filter(f => f.to === AIRPORT_ICAO), "arrival");
    populateBoard(DEPARTURES_LIST, MOCK_FLIGHTS.filter(f => f.from === AIRPORT_ICAO), "departure");
    FLIGHTS_UPDATED.textContent = "--:--";
  }
}

// =========================
// DATE NAVIGATION
// =========================
function setupDateButtons() {
  const buttons = document.querySelectorAll(".date-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const offset = parseInt(btn.dataset.offset);
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + offset);
      currentFlightDate = newDate;
      fetchOpenSkyFlights(currentFlightDate);
    });
  });
}

// Search by input date
document.getElementById("search-btn").addEventListener("click", () => {
  const input = document.getElementById("search-date").value;
  if (!input) return;
  currentFlightDate = new Date(input);
  document.querySelectorAll(".date-btn").forEach(b => b.classList.remove("active"));
  fetchOpenSkyFlights(currentFlightDate);
});

// =========================
// INITIALIZATION
// =========================
setupDateButtons();
fetchOpenSkyFlights(currentFlightDate);
setInterval(() => fetchOpenSkyFlights(currentFlightDate), 2 * 60 * 1000);
