import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, CheckCircle, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { WeatherData } from "../types";

interface WeatherAlertProps {
  weatherData: WeatherData | null;
  darkMode: boolean;
}

export default function WeatherAlert({ weatherData, darkMode }: WeatherAlertProps) {
  const [alertText, setAlertText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [offline, setOffline] = useState<boolean>(false);

  const fetchAlerts = async () => {
    if (!weatherData) return;
    setLoading(true);
    try {
      const response = await fetch("/api/gemini/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: weatherData.location.name,
          weather: {
            temp: weatherData.current.temperature_2m,
            feelsLike: weatherData.current.apparent_temperature,
            windSpeed: weatherData.current.wind_speed_10m,
            code: weatherData.current.weather_code,
          },
        }),
      });
      const data = await response.json();
      setAlertText(data.text || "All clear! Ideal conditions ahead.");
      setOffline(!!data.offline);
    } catch (err) {
      console.error(err);
      setAlertText("All clear! Standard safety boundaries expected.");
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weatherData) {
      fetchAlerts();
    } else {
      setAlertText("");
    }
  }, [weatherData]);

  if (!weatherData) return null;

  const isAllClear = alertText.toLowerCase().includes("all clear");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      id="weather-alert-container"
      className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
        isAllClear
          ? darkMode
            ? "border-emerald-950/40 bg-emerald-950/15 text-emerald-300"
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
          : darkMode
          ? "border-brand-primary/40 bg-brand-primary/10 text-brand-secondary"
          : "border-brand-primary bg-amber-50 text-brand-primary"
      }`}
    >
      {/* Background glow design touch */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-current opacity-10 blur-xl" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {isAllClear ? (
              <CheckCircle className="h-5 w-5 text-emerald-500 animate-pulse" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-brand-primary animate-bounce" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm tracking-wide uppercase">
                {isAllClear ? "Safety Analysis" : "Active Weather Advisory"}
              </span>
              {offline && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 text-current">
                  Heuristic
                </span>
              )}
            </div>
            <p className="text-sm mt-1 font-sans leading-relaxed">
              {loading ? "Re-evaluating atmospheric hazards..." : alertText}
            </p>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          disabled={loading}
          id="btn-refresh-alerts"
          className={`shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium font-display transition-all border ${
            isAllClear
              ? darkMode
                ? "border-emerald-800/40 hover:bg-emerald-800/20 text-emerald-200"
                : "border-emerald-200 hover:bg-emerald-100 text-emerald-900"
              : darkMode
              ? "border-brand-primary/40 hover:bg-brand-primary/20 text-brand-secondary"
              : "border-brand-primary hover:bg-brand-primary hover:text-white text-brand-primary"
          }`}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Analyze
        </button>
      </div>
    </motion.div>
  );
}
