// =========================
// CLOCK
// =========================
function updateClock() {
  const now = new Date();

  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("clock-date");

  if (clockEl) clockEl.textContent = now.toLocaleTimeString();
  if (dateEl) dateEl.textContent = now.toDateString();
}

setInterval(updateClock, 1000);
updateClock();


// =========================
// WEATHER
// =========================
const LAT = 47.12;
const LON = -88.56;
const API_KEY = "YOUR_API_KEY_HERE"; // <-- put your key

async function fetchWeather() {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=imperial&appid=${API_KEY}`
    );
    const data = await res.json();

    const tempEl = document.getElementById("weather-temp");
    const descEl = document.getElementById("weather-desc");

    if (tempEl) tempEl.textContent = `${Math.round(data.main.temp)}°F`;
    if (descEl) descEl.textContent = data.weather[0].description;

  } catch (err) {
    console.error("Weather error:", err);
  }
}

fetchWeather();
setInterval(fetchWeather, 10 * 60 * 1000);


// =========================
// WEBCAM
// =========================
let webcamCountdown = 30;

function updateWebcam() {
  const img = document.getElementById("webcam-img");
  const ts = document.getElementById("webcam-ts");

  if (img) {
    img.src = `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=640&ts=${Date.now()}`;
  }

  if (ts) {
    ts.textContent = new Date().toLocaleTimeString();
  }

  webcamCountdown = 30;
}

setInterval(() => {
  webcamCountdown--;

  const nextEl = document.getElementById("webcam-next");
  if (nextEl) nextEl.textContent = webcamCountdown;

  if (webcamCountdown <= 0) updateWebcam();
}, 1000);

updateWebcam();


// =========================
// MOCK FLIGHTS
// =========================
const flights = [];

const airlines = ["Delta", "United", "American", "Southwest"];
const cities = ["Chicago", "Detroit", "Minneapolis", "Denver", "New York", "Atlanta", "Dallas"];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randTime(base) {
  const d = new Date(base);
  d.setHours(Math.floor(Math.random() * 24));
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
}

function generateFlights(count = 200) {
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const offset = Math.floor(Math.random() * 8) - 2;
    const base = new Date(now);
    base.setDate(now.getDate() + offset);

    flights.push({
      flight: `${rand(["DL","UA","AA","SW"])}${Math.floor(100 + Math.random() * 900)}`,
      airline: rand(airlines),
      destination: rand(cities),
      time: randTime(base),
      status: rand(["On Time", "Delayed", "Boarding", "Canceled"])
    });
  }
}

generateFlights();


// =========================
// FILTER + RENDER
// =========================
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function renderFlights(date) {
  const container = document.getElementById("flights");
  if (!container) return;

  const list = flights
    .filter(f => sameDay(f.time, date))
    .sort((a, b) => a.time - b.time);

  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<div>No flights found</div>";
    return;
  }

  list.forEach(f => {
    const div = document.createElement("div");
    div.className = "flight";

    div.textContent =
      `${f.flight} → ${f.destination} | ` +
      `${f.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} | ` +
      `${f.status}`;

    container.appendChild(div);
  });
}


// =========================
// BUTTON HANDLERS (GLOBAL)
// =========================
window.showToday = function () {
  renderFlights(new Date());
};

window.showYesterday = function () {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  renderFlights(d);
};

window.showTomorrow = function () {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  renderFlights(d);
};

window.pickDate = function () {
  const input = document.getElementById("datePicker");
  if (!input || !input.value) return;

  renderFlights(new Date(input.value));
};


// =========================
// INITIAL LOAD
// =========================
showToday();
