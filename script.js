async function fetchFlights(date) {
  const begin = Math.floor(new Date(date).setHours(0,0,0,0) / 1000);
  const end   = Math.floor(new Date(date).setHours(23,59,59,999) / 1000);

  try {
    // Arrivals
    const arrRes = await fetch(`https://opensky-network.org/api/flights/arrival?airport=KCMX&begin=${begin}&end=${end}`);
    const arrData = arrRes.status === 404 ? [] : await arrRes.json();

    // Departures
    const depRes = await fetch(`https://opensky-network.org/api/flights/departure?airport=KCMX&begin=${begin}&end=${end}`);
    const depData = depRes.status === 404 ? [] : await depRes.json();

    populateBoard("arrivals-list", arrData, "arrival");
    populateBoard("departures-list", depData, "departure");
    document.getElementById("flights-updated").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  } catch(err) {
    console.error("OpenSky fetch failed:", err);
    // optional fallback to test data
  }
}
