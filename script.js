const API_KEY = "d1cd9db2d75eeea7256c3c549ee57fd4";

async function getWeather() {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=Houghton,MI&appid=${API_KEY}&units=imperial`
  );
  const data = await res.json();

  document.getElementById("weather").innerHTML =
    `Temp: ${data.main.temp}°F | Wind: ${data.wind.speed} mph | ${data.weather[0].description}`;
}

// TEMP placeholder for flights
document.getElementById("flights").innerHTML =
  "Flights will appear here (next step)";

// Webcam placeholder (replace later)
document.getElementById("webcam").src =
  "https://via.placeholder.com/400x300?text=CMX+Webcam";

getWeather();
