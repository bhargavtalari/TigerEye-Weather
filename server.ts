import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

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
// AI Weather Helper Endpoints (Real Gemini with intelligent offline fallbacks)
// ----------------------------------------------------

// Vibe Check Generator
app.post("/api/gemini/vibe-check", async (req, res) => {
  const { weather, location } = req.body;
  if (!weather || !location) {
    return res.status(400).json({ error: "Missing weather or location data." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are a witty weather guru with high design taste. 
Current conditions in ${location}: Temp ${weather.temp}°C, feels like ${weather.feelsLike}°C, weather code: ${weather.code}. 
Daily Forecast max/min: ${weather.tempMax}°C / ${weather.tempMin}°C.
Provide a short, stylish "Vibe Check" summary of this weather in 2 to 3 sentences maximum. Keep the vocabulary high-contrast, atmospheric, and inspiring (e.g. cozy slate sky, radiant sunlit trails, ambient briskness). Do not return markdown blocks or headers, just plain text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text?.trim() });
  } catch (error: any) {
    console.warn("Gemini Error, using heuristic vibe-check:", error.message);
    // Graceful offline fallback
    const t = weather.temp;
    let fallbackText = `Weather in ${location} presents a mild atmosphere. `;
    if (t > 28) {
      fallbackText = `The atmosphere in ${location} is radiant and energized with a warm amber glow. Seek cool spaces, embrace light fabrics, and keep your hydration at premium levels.`;
    } else if (t < 8) {
      fallbackText = `Crisp, sharp currents dominate the landscape of ${location}. An invitation to pull out heavy knits, savor rich warm brews, and appreciate the static beauty of a cool day.`;
    } else if (weather.code >= 51) {
      fallbackText = `Soft rhythmic drizzle bathes the avenues of ${location}. A perfect backdrop for cozy indoor reflections, low-key ambient tunes, and standard-issue umbrellas.`;
    } else {
      fallbackText = `Balanced conditions with comfortable thermal currents. The canvas is clear for outdoor excursions or structured strolls under a peaceful ambient sky.`;
    }
    res.json({ text: fallbackText, offline: true });
  }
});

// Plain English Extreme Weather Alerts
app.post("/api/gemini/alerts", async (req, res) => {
  const { weather, location } = req.body;
  if (!weather) {
    return res.status(400).json({ error: "Missing weather data." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Analyze this weather data for ${location || "this location"}:
Current Temp: ${weather.temp}°C, Feels Like: ${weather.feelsLike}°C, Wind Speed: ${weather.windSpeed} km/h, Weather Code: ${weather.code}.
Identify any hazards (e.g. Extreme Cold below 5°C, Extreme Heat above 35°C, High Winds over 25 km/h, Heavy Rain/Snow codes).
Provide a single-sentence Plain-English Extreme Weather Alert. It should look highly professional but direct.
If everything is within comfortable, safe bounds, you MUST return exactly: "All clear! Ideal conditions ahead."`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text?.trim() });
  } catch (error: any) {
    console.warn("Gemini Error, using heuristic alerts:", error.message);
    const t = weather.temp;
    const w = weather.windSpeed || 0;
    let alert = "All clear! Ideal conditions ahead.";
    if (t > 36) {
      alert = `⚠️ Extreme Heat Alert: Temperature feels like ${t}°C. Avoid direct sun exposure between 11 AM - 4 PM and prioritize hydration.`;
    } else if (t < 2) {
      alert = `⚠️ Freeze Warning: Temperatures have plummeted near freezing (${t}°C). Ensure layered insulation and watch for icy patches.`;
    } else if (w > 28) {
      alert = `⚠️ High Wind Advisory: Blustery winds clocking at ${w} km/h. Secure loose outdoor accessories.`;
    } else if (weather.code >= 95) {
      alert = `⚠️ Thunderstorm Advisory: Active electrical storm systems. Stay indoors and avoid high-ground areas.`;
    } else if (weather.code >= 71 && weather.code <= 77) {
      alert = `⚠️ Winter Weather Alert: Snowfall in progress. Commutes might be delayed; dress for heavy winter exposure.`;
    }
    res.json({ text: alert, offline: true });
  }
});

// Clothing Layering Guide (What to Wear)
app.post("/api/gemini/clothing-guide", async (req, res) => {
  const { weather } = req.body;
  if (!weather) {
    return res.status(400).json({ error: "Missing weather data." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Given the weather conditions: Temp ${weather.temp}°C, apparent temperature ${weather.feelsLike}°C, rain code ${weather.code}. 
Suggest a 3-layer clothing scheme + key accessories suitable for these conditions.
Return a clean JSON object according to the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            baseLayer: { type: Type.STRING, description: "Moisture-wicking inner garment" },
            middleLayer: { type: Type.STRING, description: "Thermal/insulating sweater, fleece, or light shirt" },
            outerLayer: { type: Type.STRING, description: "Wind/waterproof shell, coat, or jacket" },
            accessories: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Hats, gloves, umbrellas, sunglasses as needed",
            },
          },
          required: ["baseLayer", "middleLayer", "outerLayer", "accessories"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.warn("Gemini Error, using heuristic clothing-guide:", error.message);
    const t = weather.temp;
    let guide = {
      baseLayer: "Soft combed cotton t-shirt",
      middleLayer: "Lightweight utility pullover or casual sweater",
      outerLayer: "Breathable windbreaker or denim jacket",
      accessories: ["Polarized sunglasses", "Casual baseball cap"],
    };

    if (t > 26) {
      guide = {
        baseLayer: "Ultralight linen or moisture-wicking tank/tee",
        middleLayer: "None required - keep it light",
        outerLayer: "Optional airy linen overshirt for sun protection",
        accessories: ["UV400 Sunglasses", "Broad-brimmed sun hat", "Water bottle"],
      };
    } else if (t < 10) {
      guide = {
        baseLayer: "Thermal merino wool base top",
        middleLayer: "Heavy knitted wool sweater or fleece zip-up",
        outerLayer: "Insulated down parka or thick wool overcoat",
        accessories: ["Fleece-lined beanie", "Insulated gloves", "Thermal scarf"],
      };
    } else if (weather.code >= 51) {
      guide = {
        baseLayer: "Comfortable breathable cotton tee",
        middleLayer: "Micro-fleece pullover or knit sweater",
        outerLayer: "Waterproof hooded rain shell or trench coat",
        accessories: ["Windproof compact umbrella", "Water-resistant boots"],
      };
    }
    res.json({ ...guide, offline: true });
  }
});

// Trip Packing List Generator
app.post("/api/gemini/packing-list", async (req, res) => {
  const { intent, weatherSummary, location } = req.body;
  if (!intent) {
    return res.status(400).json({ error: "Missing trip intent." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Create a custom weather-aware packing list for a trip to ${
      location || "destination"
    }. 
Trip Intent: "${intent}"
Expected Weather Context: "${weatherSummary || "typical conditions"}"
Return a structured list of recommended items categorized neatly (e.g., Clothing, Gear, Toiletries, Documents). 
Provide 6-10 highly relevant items total.
Return a JSON object conforming to the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                },
                required: ["name", "category", "quantity"],
              },
            },
          },
          required: ["items"],
        },
      },
    });

    const data = JSON.parse(response.text || '{"items":[]}');
    res.json(data);
  } catch (error: any) {
    console.warn("Gemini Error, using heuristic packing-list:", error.message);
    // Formulate a smart heuristic list based on intent and generic weather
    const lowerIntent = intent.toLowerCase();
    let mockItems = [
      { name: "Government ID & Passport", category: "Documents", quantity: "1" },
      { name: "Universal Travel Charger", category: "Gear", quantity: "1" },
      { name: "Premium Toiletries Kit", category: "Toiletries", quantity: "1 set" },
      { name: "All-weather walking shoes", category: "Clothing", quantity: "1 pair" },
    ];

    if (lowerIntent.includes("hike") || lowerIntent.includes("sport") || lowerIntent.includes("outdoor")) {
      mockItems.push(
        { name: "Tactical daypack", category: "Gear", quantity: "1" },
        { name: "Reusable water bottle", category: "Gear", quantity: "1" },
        { name: "Breathable trail socks", category: "Clothing", quantity: "3 pairs" },
        { name: "Sunscreen SPF 50", category: "Toiletries", quantity: "1 tube" }
      );
    } else if (lowerIntent.includes("business") || lowerIntent.includes("conference") || lowerIntent.includes("meet")) {
      mockItems.push(
        { name: "Tailored blazer or suit jacket", category: "Clothing", quantity: "1" },
        { name: "Polished dress shoes", category: "Clothing", quantity: "1 pair" },
        { name: "Wireless presenter & notebook", category: "Gear", quantity: "1 set" },
        { name: "Press shirt / blouse", category: "Clothing", quantity: "3" }
      );
    } else {
      mockItems.push(
        { name: "Versatile smart-casual shirts", category: "Clothing", quantity: "4" },
        { name: "Lightweight windbreaker", category: "Clothing", quantity: "1" },
        { name: "Compact travel umbrella", category: "Gear", quantity: "1" }
      );
    }
    res.json({ items: mockItems, offline: true });
  }
});

// Smart Itinerary Shuffler
app.post("/api/gemini/shuffle", async (req, res) => {
  const { activities, dailyForecast, location } = req.body;
  if (!activities || !Array.isArray(activities)) {
    return res.status(400).json({ error: "Activities array is required." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are a Smart Travel Concierge. 
The user wants to do the following activities during their trip to ${location || "destination"}:
${activities.map((act, i) => `${i + 1}. ${act}`).join("\n")}

Here is the 7-day weather forecast:
${JSON.stringify(dailyForecast || "Moderate weather")}

Optimize and shuffle these activities into the most suitable forecast days (e.g. recommend outdoor activities for clear/sunny days, indoor items for rainy/windy/cold days).
Return a JSON object conforming to the schema with days matching 'Day 1' to 'Day 7' or specific weekday names.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  activity: { type: Type.STRING },
                  optimizedDay: { type: Type.STRING, description: "e.g. Monday, Day 2, etc." },
                  reason: { type: Type.STRING, description: "Why this day is best based on weather" },
                  tip: { type: Type.STRING, description: "Weather-aware tip for the activity" },
                },
                required: ["activity", "optimizedDay", "reason", "tip"],
              },
            },
          },
          required: ["schedule"],
        },
      },
    });

    const data = JSON.parse(response.text || '{"schedule":[]}');
    res.json(data);
  } catch (error: any) {
    console.warn("Gemini Error, using heuristic shuffler:", error.message);
    // Simple heuristic allocation
    const schedule = activities.map((act, index) => {
      const days = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Monday"];
      const day = days[index % days.length];
      return {
        activity: act,
        optimizedDay: day,
        reason: `Matched with ideal atmospheric parameters expected on ${day}.`,
        tip: `Keep an eye on short-term wind charts and make sure to dress in comfortable layers.`,
      };
    });
    res.json({ schedule, offline: true });
  }
});

// Weather Smart Chatbot
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, weatherContext, location } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  try {
    const ai = getGeminiClient();
    const systemInstruction = `You are a helpful, stylish, and knowledgeable Weather Planning Concierge called "SkyLine Guide".
You are helping a traveler plan their activities and pack appropriately. 
Current location of interest: ${location || "unknown"}.
Weather context to reference: ${JSON.stringify(weatherContext || "No weather loaded yet")}.
Always incorporate the current weather metrics into your answers when relevant. Keep your answers concise, clear, and focused on weather or planning. Limit your response to 2 paragraphs max.`;

    // Construct history for gemini
    const contents = messages.map((m) => {
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    res.json({ text: response.text?.trim() });
  } catch (error: any) {
    console.warn("Gemini Error, using heuristic chatbot response:", error.message);
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let reply = `I am currently operating in offline smart heuristic mode, but I can still assist! For ${
      location || "your destination"
    }, the current climate suggests comfortable layering. Regarding "${lastUserMessage}", I recommend arranging outdoor sightseeing for clear afternoons and packing a versatile rain shell just in case. Once your Gemini key is verified in Settings, I'll be able to run deep atmospheric analysis!`;
    res.json({ text: reply, offline: true });
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
