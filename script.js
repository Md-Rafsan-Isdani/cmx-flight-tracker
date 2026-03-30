// =======================
// CONFIG
// =======================
const FLIGHT_API_KEY = "YOUR_AVIATIONSTACK_KEY"; // replace with your key
let currentFlightDate = new Date();

// =======================
// HELPERS
// =======================
function formatDate(date) {
  return date.toISOString().split("T")[0]; // yyyy-mm-dd
}

function parseFlightTime(rawTime) {
  return rawTime ? new Date(rawTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "---";
}

// =======================
// POPULATE BOARD
// =======================
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
    const timeRaw = type === "arrival" ? (f.arrival ? f.arrival.scheduled : "---") : (f.departure ? f.departure.scheduled : "---");
    const time = parseFlightTime(timeRaw);

    row.innerHTML = `
      <div class="flight-num">${flightNum}</div>
      <div class="flight-airline">${airline}</div>
      <div class="flight-fromto">${fromTo}</div>
      <div class="flight-time">${time}</div>
    `;
    container.appendChild(row);
  });
}

// =======================
// FETCH FLIGHTS FROM API
// =======================
async function fetchFlights(date = new Date()) {
  const formattedDate = formatDate(date);
  currentFlightDate = date;

  // Build URLs for arrivals and departures
  const arrivalsUrl = `https://api.aviationstack.com/v1/flights?access_key=${FLIGHT_API_KEY}&arr_icao=KCMX&flight_date=${formattedDate}`;
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
    // Optional: fallback to test data
    alert("Flight API fetch failed. Displaying test data.");
    populateBoard("arrivals-list", testArrivals, "arrival");
    populateBoard("departures-list", testDepartures, "departure");
  }
}

// =======================
// TEST DATA (fallback)
// =======================
const testArrivals = [
  { flight: { iata: "DL123" }, airline: { name: "Delta" }, departure: { iata: "MSP" }, arrival: { scheduled: "2026-03-30T14:20:00" } },
  { flight: { iata: "AA456" }, airline: { name: "American Airlines" }, departure: { iata: "ORD" }, arrival: { scheduled: "2026-03-30T15:05:00" } },
  { flight: { iata: "UA789" }, airline: { name: "United" }, departure: { iata: "DTW" }, arrival: { scheduled: "2026-03-30T16:10:00" } },
];

const testDepartures = [
  { flight: { iata: "DL321" }, airline: { name: "Delta" }, departure: { scheduled: "2026-03-30T14:50:00" }, arrival: { iata: "MSP" } },
  { flight: { iata: "AA654" }, airline: { name: "American Airlines" }, departure: { scheduled: "2026-03-30T15:30:00" }, arrival: { iata: "ORD" } },
  { flight: { iata: "UA987" }, airline: { name: "United" }, departure: { scheduled: "2026-03-30T16:40:00" }, arrival: { iata: "DTW" } },
];

// =======================
// AUTO-REFRESH EVERY 2 MINUTES
// =======================
fetchFlights(currentFlightDate);
setInterval(() => fetchFlights(currentFlightDate), 2 * 60 * 1000);

// =======================
// DATE NAVIGATION
// =======================
document.querySelectorAll(".date-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".date-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const offset = parseInt(btn.dataset.offset, 10);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + offset);
    fetchFlights(newDate);
  });
});

// =======================
// SEARCH BY DATE
// =======================
document.getElementById("search-btn").addEventListener("click", () => {
  const input = document.getElementById("search-date").value;
  if (!input) return alert("Please select a date");
  const searchDate = new Date(input);
  fetchFlights(searchDate);
});
