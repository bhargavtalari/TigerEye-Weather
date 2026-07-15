import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Sun,
  Moon,
  Wind,
  Droplets,
  CloudRain,
  Snowflake,
  Cloud,
  CloudLightning,
  AlertTriangle,
  Compass,
  ArrowRight,
  Info,
  Calendar,
  Layers,
} from "lucide-react";
import { WeatherData } from "./types";
import WeatherAlert from "./components/WeatherAlert";
import VibeCheck from "./components/VibeCheck";
import ClothingGuide from "./components/ClothingGuide";
import TripAdvisor from "./components/TripAdvisor";

// WMO Weather Code helper
export function getWeatherDetails(code: number) {
  if (code === 0) {
    return {
      label: "Clear Sky",
      icon: <Sun className="h-10 w-10 text-amber-500 animate-[spin_12s_linear_infinite]" />,
      bgClass: "from-amber-500/15 via-orange-500/5 to-transparent",
      type: "sunny",
    };
  } else if (code >= 1 && code <= 3) {
    return {
      label: "Partly Cloudy",
      icon: <Cloud className="h-10 w-10 text-zinc-400" />,
      bgClass: "from-zinc-400/10 via-zinc-500/5 to-transparent",
      type: "cloudy",
    };
  } else if (code === 45 || code === 48) {
    return {
      label: "Foggy Weather",
      icon: <Cloud className="h-10 w-10 text-zinc-500 opacity-60" />,
      bgClass: "from-slate-400/10 via-slate-500/5 to-transparent",
      type: "cloudy",
    };
  } else if (
    (code >= 51 && code <= 57) ||
    (code >= 61 && code <= 67) ||
    (code >= 80 && code <= 82)
  ) {
    return {
      label: "Rain Showers",
      icon: <CloudRain className="h-10 w-10 text-blue-400 animate-bounce" />,
      bgClass: "from-blue-500/15 via-indigo-600/5 to-transparent",
      type: "rainy",
    };
  } else if (
    (code >= 71 && code <= 77) ||
    (code >= 85 && code <= 86)
  ) {
    return {
      label: "Snowfall",
      icon: <Snowflake className="h-10 w-10 text-sky-200" />,
      bgClass: "from-sky-300/15 via-blue-400/5 to-transparent",
      type: "snowy",
    };
  } else if (code >= 95 && code <= 99) {
    return {
      label: "Thunderstorm",
      icon: <CloudLightning className="h-10 w-10 text-purple-400" />,
      bgClass: "from-purple-950/20 via-purple-900/15 to-transparent",
      type: "stormy",
    };
  }
  return {
    label: "Atmospheric Variance",
    icon: <Cloud className="h-10 w-10 text-zinc-400" />,
    bgClass: "from-zinc-400/10 via-zinc-500/5 to-transparent",
    type: "cloudy",
  };
}

export default function App() {
  const [cityInput, setCityInput] = useState<string>("San Francisco");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Load weather for default city on mount
  useEffect(() => {
    fetchWeather("San Francisco");
  }, []);

  const fetchWeather = async (city: string) => {
    if (!city.trim()) return;
    setLoading(true);
    setError("");
    try {
      // 1. Geocoding API: First, fetch the latitude, longitude, name, admin1, and country
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const geoResponse = await fetch(geoUrl);
      if (!geoResponse.ok) {
        throw new Error("Failed to contact the geocoding service.");
      }
      const geoData = await geoResponse.json();

      // 2. Error Check: If geoData.results is empty or undefined, throw an error
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`City "${city}" not found.`);
      }

      const geoResult = geoData.results[0];
      const { latitude, longitude, name, admin1, country } = geoResult;

      // 3. Weather API: Fetch forecast payload using coordinates
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
      const forecastResponse = await fetch(forecastUrl);
      if (!forecastResponse.ok) {
        throw new Error("Failed to retrieve weather forecast data.");
      }
      const forecastData = await forecastResponse.json();

      // 4. State Hydration: Combine into the exact schema layout expected by WeatherData type
      const weatherPayload: WeatherData = {
        location: {
          name: name || city,
          country: country || "",
          region: admin1 || "",
          latitude,
          longitude,
        },
        current: {
          time: forecastData.current.time,
          interval: forecastData.current.interval,
          temperature_2m: forecastData.current.temperature_2m,
          relative_humidity_2m: forecastData.current.relative_humidity_2m,
          apparent_temperature: forecastData.current.apparent_temperature,
          is_day: forecastData.current.is_day,
          precipitation: forecastData.current.precipitation,
          rain: forecastData.current.rain,
          showers: forecastData.current.showers,
          snowfall: forecastData.current.snowfall,
          weather_code: forecastData.current.weather_code,
          cloud_cover: forecastData.current.cloud_cover,
          wind_speed_10m: forecastData.current.wind_speed_10m,
        },
        daily: {
          time: forecastData.daily.time,
          weather_code: forecastData.daily.weather_code,
          temperature_2m_max: forecastData.daily.temperature_2m_max,
          temperature_2m_min: forecastData.daily.temperature_2m_min,
          apparent_temperature_max: forecastData.daily.apparent_temperature_max,
          apparent_temperature_min: forecastData.daily.apparent_temperature_min,
          precipitation_sum: forecastData.daily.precipitation_sum,
          precipitation_probability_max: forecastData.daily.precipitation_probability_max,
          wind_speed_10m_max: forecastData.daily.wind_speed_10m_max,
        },
      };

      setWeather(weatherPayload);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred fetching weather data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeather(cityInput);
  };

  const currentDetails = weather ? getWeatherDetails(weather.current.weather_code) : null;

  return (
    <div
      className={`min-h-screen weather-gradient transition-colors duration-500 relative overflow-hidden ${
        darkMode ? "bg-brand-dark-bg text-zinc-100 dark" : "bg-brand-light-bg text-brand-dark-card light"
      }`}
    >
      {/* Interactive Weather-Dependent Background Animation Visual */}
      <AnimatePresence>
        {currentDetails && (
          <motion.div
            key={currentDetails.type}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 bg-gradient-to-b ${currentDetails.bgClass} pointer-events-none transition-all duration-1000 z-0`}
          >
            {/* Dynamic visual overlay assets based on type */}
            {currentDetails.type === "sunny" && (
              <div className="absolute top-10 left-1/4 h-[300px] w-[300px] rounded-full bg-brand-primary/10 blur-[80px] animate-pulse" />
            )}
            {currentDetails.type === "rainy" && (
              <div className="absolute inset-0 overflow-hidden opacity-30">
                <div className="absolute h-[200%] w-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0)_100%)] bg-[length:3px_40px] animate-[slide-down_2s_linear_infinite]" />
              </div>
            )}
            {currentDetails.type === "cloudy" && (
              <div className="absolute top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-slate-500/5 blur-[120px]" />
            )}
            {currentDetails.type === "snowy" && (
              <div className="absolute inset-0 opacity-20">
                <div className="absolute h-[200%] w-full bg-[radial-gradient(circle_at_center,white_1px,transparent_2px)] bg-[length:24px_24px] animate-[slide-down_8s_linear_infinite]" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* Header Branding Row */}
        <header className="flex items-center justify-between gap-4 border-b border-zinc-500/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-display font-bold text-xl tracking-tight shadow-md shadow-brand-primary/20">
              T
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight uppercase">
                TigerEye Weather
              </h1>
              <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
                Weather Planning Suite
              </span>
            </div>
          </div>

          {/* Search bar & controls */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Enter city (e.g. London, Tokyo)..."
                id="search-input-desktop"
                className={`w-[260px] text-xs px-3.5 py-2.5 pl-10 rounded-full border outline-none font-sans transition-all ${
                  darkMode
                    ? "bg-brand-dark-card border-zinc-800 text-zinc-100 focus:border-brand-primary"
                    : "bg-brand-light-card border-[#dcd2be] text-brand-dark-card focus:border-brand-primary"
                }`}
              />
              <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-zinc-400" />
            </form>

            {/* Light/Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              id="theme-toggle-btn"
              className={`p-2.5 rounded-full border transition-all ${
                darkMode
                  ? "bg-brand-dark-card border-zinc-800 text-brand-primary hover:bg-zinc-800"
                  : "bg-brand-light-card border-[#dcd2be] text-brand-primary hover:bg-[#d9ceb8]"
              }`}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Mobile Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative block md:hidden">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Search city name..."
            id="search-input-mobile"
            className={`w-full text-xs px-3.5 py-3 pl-11 rounded-xl border outline-none font-sans transition-all ${
              darkMode
                ? "bg-brand-dark-card border-zinc-800 text-zinc-100 focus:border-brand-primary"
                : "bg-brand-light-card border-[#dcd2be] text-brand-dark-card focus:border-brand-primary"
            }`}
          />
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
        </form>

        {/* Error Handling Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-sans"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 7-Day Forecast Section (Runs along top beautifully below search bars) */}
        {weather && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            id="seven-day-forecast"
            className="glass-panel p-6 transition-all shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-primary" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                  7-Day Forecast Outlook
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                Coordinates: {weather.location.latitude.toFixed(2)}°N,{" "}
                {weather.location.longitude.toFixed(2)}°E
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {weather.daily.time.map((time, index) => {
                const maxTemp = Math.round(weather.daily.temperature_2m_max[index]);
                const minTemp = Math.round(weather.daily.temperature_2m_min[index]);
                const wCode = weather.daily.weather_code[index];
                const rainProb = weather.daily.precipitation_probability_max[index];
                const dayDetails = getWeatherDetails(wCode);

                const dateObj = new Date(time);
                const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                const dateNum = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                return (
                  <div
                    key={time}
                    className={`p-3 rounded-2xl border text-center font-sans flex flex-col justify-between h-36 ${
                      darkMode
                        ? "bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/80"
                        : "bg-white/40 border-[#dfd6c6] hover:bg-white/80"
                    } transition-all`}
                  >
                    <div>
                      <span className="block text-xs font-semibold font-display text-current">
                        {dayName}
                      </span>
                      <span className="block text-[10px] text-zinc-400 font-mono">
                        {dateNum}
                      </span>
                    </div>

                    <div className="my-2 flex justify-center">
                      {/* Scaled down dynamic icon */}
                      {React.cloneElement(dayDetails.icon, { className: "h-6 w-6 text-brand-primary" })}
                    </div>

                    <div>
                      <div className="flex justify-center gap-1.5 text-xs font-mono font-medium">
                        <span className="text-current">{maxTemp}°</span>
                        <span className="text-zinc-500">{minTemp}°</span>
                      </div>
                      {rainProb > 0 && (
                        <span className="text-[10px] font-mono text-blue-400 mt-1 block">
                          ☔ {rainProb}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Main Content Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Weather Display & Clothing Layering (5 cols on large) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Current Weather Card */}
            {weather ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                id="current-weather-card"
                className="glass-panel p-6 transition-all relative overflow-hidden shadow-xl"
              >
                {/* Visual anchor background compass */}
                <Compass className="absolute right-[-20px] top-[-20px] h-40 w-40 opacity-[0.03] stroke-[1] text-brand-primary pointer-events-none" />

                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-display font-bold text-2xl tracking-tight text-current">
                      {weather.location.name}
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5 uppercase tracking-wider">
                      {weather.location.region ? `${weather.location.region}, ` : ""}
                      {weather.location.country}
                    </p>
                  </div>
                  <span className="text-xs font-mono uppercase bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full">
                    Current
                  </span>
                </div>

                {/* Big Temperature Display */}
                <div className="flex items-center gap-4 my-6">
                  {currentDetails?.icon}
                  <div>
                    <span className="text-5xl font-display font-light tracking-tighter text-current">
                      {Math.round(weather.current.temperature_2m)}°C
                    </span>
                    <span className="block text-xs text-zinc-400 mt-1">
                      Feels like {Math.round(weather.current.apparent_temperature)}°C •{" "}
                      {currentDetails?.label}
                    </span>
                  </div>
                </div>

                {/* Auxiliary Weather parameters */}
                <div className="grid grid-cols-3 gap-3 border-t border-black/5 dark:border-white/5 pt-4">
                  {/* Wind */}
                  <div className="text-center p-2 rounded-xl bg-black/5 dark:bg-white/3">
                    <Wind className="h-4 w-4 text-brand-primary mx-auto mb-1" />
                    <span className="block text-[10px] text-zinc-400 font-display uppercase tracking-wider">
                      Wind
                    </span>
                    <span className="text-xs font-mono font-medium mt-0.5">
                      {weather.current.wind_speed_10m} km/h
                    </span>
                  </div>

                  {/* Humidity */}
                  <div className="text-center p-2 rounded-xl bg-black/5 dark:bg-white/3">
                    <Droplets className="h-4 w-4 text-brand-primary mx-auto mb-1" />
                    <span className="block text-[10px] text-zinc-400 font-display uppercase tracking-wider">
                      Humidity
                    </span>
                    <span className="text-xs font-mono font-medium mt-0.5">
                      {weather.current.relative_humidity_2m}%
                    </span>
                  </div>

                  {/* Precipitation */}
                  <div className="text-center p-2 rounded-xl bg-black/5 dark:bg-white/3">
                    <CloudRain className="h-4 w-4 text-brand-primary mx-auto mb-1" />
                    <span className="block text-[10px] text-zinc-400 font-display uppercase tracking-wider">
                      Precip
                    </span>
                    <span className="text-xs font-mono font-medium mt-0.5">
                      {weather.current.precipitation} mm
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[250px] rounded-3xl border border-dashed border-zinc-700/20 flex items-center justify-center">
                <span className="text-xs text-zinc-400 animate-pulse">
                  Calibrating atmospheric metrics...
                </span>
              </div>
            )}

            {/* Clothing Layering Guide */}
            <ClothingGuide weatherData={weather} darkMode={darkMode} />
          </div>

          {/* Right Column: AI advisories, Extreme Weather Alerts, and Advisor Workspace (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Extreme Weather Alerts (High-visibility banner) */}
            <WeatherAlert weatherData={weather} darkMode={darkMode} />

            {/* Vibe Check Summary */}
            <VibeCheck weatherData={weather} darkMode={darkMode} />

            {/* TripAdvisor master suite */}
            <TripAdvisor weatherData={weather} darkMode={darkMode} />
          </div>
        </div>
      </div>

      {/* Slide-down keyframes css injected for custom weather animations */}
      <style>{`
        @keyframes slide-down {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
