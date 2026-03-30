// ======= Minimal Flights Test (AviationStack) =======

const FLIGHT_API_KEY = "b8d1eb66f94a55c5490f2e8d4a30e101"; // replace with your key
const ARRIVALS_LIST = document.getElementById("arrivals-list");
const DEPARTURES_LIST = document.getElementById("departures-list");

function formatTime(dateStr) {
  return dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "---";
}

async function fetchFlights() {
  const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
  try {
    // Arrivals
    const arrivalsRes = await fetch(
      `https://api.aviationstack.com/v1/flights?access_key=${FLIGHT_API_KEY}&arr_icao=KCMX&flight_date=${today}`
    );
    const arrivalsData = await arrivalsRes.json();
    populateBoard(ARRIVALS_LIST, arrivalsData.data, "arrival");

    // Departures
    const departuresRes = await fetch(
      `https://api.aviationstack.com/v1/flights?access_key=${FLIGHT_API_KEY}&dep_icao=KCMX&flight_date=${today}`
    );
    const departuresData = await departuresRes.json();
    populateBoard(DEPARTURES_LIST, departuresData.data, "departure");

  } catch (err) {
    console.error("Flight fetch failed:", err);
    ARRIVALS_LIST.innerHTML = "<div class='loading-state'>Error loading arrivals</div>";
    DEPARTURES_LIST.innerHTML = "<div class='loading-state'>Error loading departures</div>";
  }
}

function populateBoard(container, flights, type) {
  container.innerHTML = "";
  if (!flights || flights.length === 0) {
    container.innerHTML = "<div class='loading-state'>No flights found</div>";
    return;
  }

  flights.forEach(f => {
    const flightNum = f.flight?.iata || f.flight?.number || "---";
    const airline = f.airline?.name || "---";
    const fromTo = type === "arrival" ? f.departure?.iata || "---" : f.arrival?.iata || "---";
    const time = type === "arrival" ? f.arrival?.scheduled : f.departure?.scheduled;

    const row = document.createElement("div");
    row.className = "flight-row";
    row.innerHTML = `
      <div class="flight-num">${flightNum}</div>
      <div class="flight-airline">${airline}</div>
      <div class="flight-fromto">${fromTo}</div>
      <div class="flight-time">${formatTime(time)}</div>
    `;
    container.appendChild(row);
  });
}

// Run once
fetchFlights();
