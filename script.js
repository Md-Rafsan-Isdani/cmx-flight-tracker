// =========================
// CLOCK
// =========================
function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("clock-date");

  clockEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  dateEl.textContent = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

// Update clock every second
setInterval(updateClock, 1000);
updateClock();

// =========================
// WEATHER
// =========================
const LAT = 47.12;  // example: CMX latitude
const LON = -88.56; // example: CMX longitude
const WEATHER_API_KEY = "d1cd9db2d75eeea7256c3c549ee57fd4";

async function fetchWeather() {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=imperial&appid=${WEATHER_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    document.getElementById("weather-icon").textContent = data.weather[0]?.main || "☁";
    document.getElementById("weather-temp").textContent = `${Math.round(data.main.temp)}°F`;
    document.getElementById("weather-desc").textContent = data.weather[0]?.description || "---";
    document.getElementById("weather-wind").textContent = `${Math.round(data.wind.speed)} mph`;
    document.getElementById("weather-humidity").textContent = `${data.main.humidity}%`;
    document.getElementById("weather-vis").textContent = `${data.visibility / 1609.34 ? (data.visibility / 1609.34).toFixed(1) : "---"} mi`;
    document.getElementById("weather-pressure").textContent = `${data.main.pressure} hPa`;
    document.getElementById("weather-time").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  } catch (err) {
    console.error("Weather fetch failed:", err);
  }
}

// Fetch weather every 10 minutes
fetchWeather();
setInterval(fetchWeather, 10 * 60 * 1000);

// =========================
// WEBCAM
// =========================
const WEBCAM_IMG = document.getElementById("webcam-img");
const WEBCAM_TS = document.getElementById("webcam-ts");
const WEBCAM_NEXT = document.getElementById("webcam-next");
let webcamCountdown = 30;

function updateWebcam() {
  const timestamp = Date.now();
  WEBCAM_IMG.src = `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=640&q=80&ts=${timestamp}`;
  WEBCAM_TS.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  webcamCountdown = 30;
}

// Countdown display for next refresh
setInterval(() => {
  webcamCountdown--;
  WEBCAM_NEXT.textContent = webcamCountdown;
  if (webcamCountdown <= 0) updateWebcam();
}, 1000);

// Initial webcam update
updateWebcam();
