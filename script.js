// =========================
// FLIGHTS USING OPENSKY
// =========================

// CMX ICAO code
const AIRPORT_ICAO = "KCMX";

// Flight board containers
const ARRIVALS_LIST = document.getElementById("arrivals-list");
const DEPARTURES_LIST = document.getElementById("departures-list");

// Current flight date for navigation
let currentFlightDate = new Date();

// Mock data fallback for CMX (small airport)
const MOCK_FLIGHTS = [
  { flight: "DL123", airline: "Delta Airlines", from: "DTW", to: "CMX", time: "10:30" },
  { flight: "AA456", airline: "American Airlines", from: "ORD", to: "CMX", time: "13:00" },
  { flight: "DL789", airline: "Delta Airlines", from: "CMX", to: "DTW", time: "15:00" },
];

// Utility to format time
function formatTime(dateStr) {
  return dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "---";
}

// Populate flight board
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

// Fetch live flights from OpenSky Network API
async function fetchOpenSkyFlights() {
  try {
    // OpenSky API live arrivals/departures for KCMX
    // NOTE: OpenSky limits to last 7 days and only provides current positions
    const url = `https://opensky-network.org/api/flights/arrival?airport=${AIRPORT_ICAO}&begin=${Math.floor(Date.now()/1000)-86400}&end=${Math.floor(Date.now()/1000)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.length === 0) {
      // Use mock data if OpenSky returns nothing
      populateBoard(ARRIVALS_LIST, MOCK_FLIGHTS.filter(f => f.to === "CMX"), "arrival");
      populateBoard(DEPARTURES_LIST, MOCK_FLIGHTS.filter(f => f.from === "CMX"), "departure");
      return;
    }

    // Map OpenSky flights to board format
    const arrivals = data.filter(f => f.estArrivalAirport === "KCMX").map(f => ({
      flight: f.callsign?.trim() || "---",
      airline: f.estDepartureAirport || "---",
      from: f.estDepartureAirport || "---",
      to: "CMX",
      time: formatTime(f.lastSeen * 1000)
    }));

    const departures = data.filter(f => f.estDepartureAirport === "KCMX").map(f => ({
      flight: f.callsign?.trim() || "---",
      airline: f.estArrivalAirport || "---",
      from: "CMX",
      to: f.estArrivalAirport || "---",
      time: formatTime(f.firstSeen * 1000)
    }));

    populateBoard(ARRIVALS_LIST, arrivals.length ? arrivals : MOCK_FLIGHTS.filter(f => f.to === "CMX"), "arrival");
    populateBoard(DEPARTURES_LIST, departures.length ? departures : MOCK_FLIGHTS.filter(f => f.from === "CMX"), "departure");

  } catch (err) {
    console.error("OpenSky fetch failed:", err);
    // Use mock data fallback
    populateBoard(ARRIVALS_LIST, MOCK_FLIGHTS.filter(f => f.to === "CMX"), "arrival");
    populateBoard(DEPARTURES_LIST, MOCK_FLIGHTS.filter(f => f.from === "CMX"), "departure");
  }
}

// Auto-refresh every 2 minutes
fetchOpenSkyFlights();
setInterval(fetchOpenSkyFlights, 2 * 60 * 1000);
