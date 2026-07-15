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

  const fetchVibe = () => {
    if (!weatherData) return;
    setLoading(true);
    setTimeout(() => {
      const temp = weatherData.current.temperature_2m;
      const code = weatherData.current.weather_code;
      const winds = weatherData.current.wind_speed_10m;
      let generatedVibe = "A serene atmosphere perfect for reflective planning. Seek comfortable layers and carry on.";

      const isRainy = (code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);
      const isSnowy = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);

      if (isRainy) {
        generatedVibe = "Wet and moody. The sound of rain brings a quiet, meditative backdrop to the city. Best for cozy indoor plans, galleries, or warm coffee with a sturdy umbrella.";
      } else if (isSnowy) {
        generatedVibe = "A magical, quiet blanket of winter flurry. Keep yourself fully insulated, enjoy the scenic snowfall, and watch your step on any icy walkways!";
      } else if (temp < 5) {
        generatedVibe = "Biting cold with a crisp, bracing wind. The atmosphere is sharp and clean. Perfect for wrapping up in heavy coats and treating yourself to a hot beverage.";
      } else if (temp < 15) {
        generatedVibe = "Brisk, chilly, and wonderfully fresh. A classic cool day requiring warm sweaters and stylish coats. Ideal for active city exploration and long brisk walks.";
      } else if (temp < 25) {
        generatedVibe = "Superb, comfortable, and temperate conditions. A light jacket or denim layer is all you need. Effortless vibes for outdoor cafes, sightseeing, and parks.";
      } else {
        generatedVibe = "Warm, bright, and vibrant summer rays. The city is basking in gorgeous sunshine. Apply sunscreen, grab your sunglasses, and embrace outdoor leisure!";
      }

      if (winds > 25) {
        generatedVibe += " Warning: strong wind gusts are active, adding a wild and breezy element to your outdoor ventures.";
      }

      setVibe(generatedVibe);
      setOffline(true);
      setLoading(false);
    }, 600);
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
