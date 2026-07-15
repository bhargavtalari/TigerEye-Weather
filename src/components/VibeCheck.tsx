import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, CloudRain, Sun, Wind, Compass } from "lucide-react";
import { WeatherData } from "../types";

interface VibeCheckProps {
  weatherData: WeatherData | null;
  darkMode: boolean;
}

export default function VibeCheck({ weatherData, darkMode }: VibeCheckProps) {
  const [vibe, setVibe] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [offline, setOffline] = useState<boolean>(false);

  const fetchVibe = async () => {
    if (!weatherData) return;
    setLoading(true);
    try {
      const response = await fetch("/api/gemini/vibe-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: `${weatherData.location.name}, ${weatherData.location.country}`,
          weather: {
            temp: weatherData.current.temperature_2m,
            feelsLike: weatherData.current.apparent_temperature,
            tempMax: weatherData.daily.temperature_2m_max[0],
            tempMin: weatherData.daily.temperature_2m_min[0],
            code: weatherData.current.weather_code,
          },
        }),
      });
      const data = await response.json();
      setVibe(data.text || "A calm day to reset your vectors.");
      setOffline(!!data.offline);
    } catch (err) {
      console.error(err);
      setVibe("A serene atmosphere perfect for reflective planning. Seek comfortable layers and carry on.");
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weatherData) {
      fetchVibe();
    } else {
      setVibe("");
    }
  }, [weatherData]);

  if (!weatherData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      id="vibe-check-container"
      className="glass-panel p-5 relative overflow-hidden transition-all shadow-lg"
    >
      {/* Decorative compass wheel */}
      <Compass className="absolute right-3 bottom-3 h-28 w-28 opacity-[0.04] stroke-[1] text-brand-primary" />

      <div className="flex items-center justify-between gap-4 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-primary" />
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider">
            Daily Vibe Check
          </h3>
          {offline && (
            <span className="text-[9px] font-mono px-1 rounded bg-black/10 text-brand-primary">
              Heuristic
            </span>
          )}
        </div>
        <button
          onClick={fetchVibe}
          disabled={loading}
          id="btn-recheck-vibe"
          className="text-xs font-medium font-display px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-brand-primary transition-all disabled:opacity-50"
        >
          {loading ? "Tuning..." : "Recalibrate"}
        </button>
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="space-y-2 py-1">
            <div className="h-3 bg-black/5 dark:bg-white/5 rounded w-11/12 animate-pulse" />
            <div className="h-3 bg-black/5 dark:bg-white/5 rounded w-full animate-pulse" />
            <div className="h-3 bg-black/5 dark:bg-white/5 rounded w-4/5 animate-pulse" />
          </div>
        ) : (
          <p className="text-sm font-sans leading-relaxed font-light italic">
            "{vibe}"
          </p>
        )}
      </div>
    </motion.div>
  );
}
