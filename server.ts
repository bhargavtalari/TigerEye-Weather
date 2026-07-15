import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ----------------------------------------------------
// Weather Proxy API (Uses free Open-Meteo API)
// ----------------------------------------------------
app.get("/api/weather", async (req, res) => {
  const { city } = req.query;
  if (!city || typeof city !== "string") {
    return res.status(400).json({ error: "City query parameter is required." });
  }

  try {
    // 1. Geocode City
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1&language=en&format=json`;
    const geoResponse = await fetch(geocodeUrl);
    if (!geoResponse.ok) {
      throw new Error(`Geocoding failed: ${geoResponse.statusText}`);
    }
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ error: `City '${city}' not found.` });
    }

    const location = geoData.results[0];
    const { latitude, longitude, name, country, admin1 } = location;

    // 2. Fetch Weather & 7-day Forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error(`Weather fetch failed: ${weatherResponse.statusText}`);
    }
    const weatherData = await weatherResponse.json();

    res.json({
      location: {
        name,
        country,
        region: admin1 || "",
        latitude,
        longitude,
      },
      current: weatherData.current,
      daily: weatherData.daily,
    });
  } catch (error: any) {
    console.error("Weather Route Error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch weather data." });
  }
});

// ----------------------------------------------------
// Serve App / Development server setup
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
