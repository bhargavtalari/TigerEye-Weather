import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Save,
  Trash2,
  FolderOpen,
  Sparkles,
  ClipboardList,
  Compass,
  MessageSquare,
  BookmarkCheck,
} from "lucide-react";
import { WeatherData, SavedTripPlan, PackingItem, ShuffledActivity } from "../types";
import PackingAssistant from "./PackingAssistant";
import ItineraryShuffler from "./ItineraryShuffler";
import Chatbot from "./Chatbot";

interface TripAdvisorProps {
  weatherData: WeatherData | null;
  darkMode: boolean;
}

export default function TripAdvisor({ weatherData, darkMode }: TripAdvisorProps) {
  // Trip Date State
  const [startDate, setStartDate] = useState<string>("2026-07-20");
  const [endDate, setEndDate] = useState<string>("2026-07-25");

  // Plan Outputs (passed down and modified inside children)
  const [intent, setIntent] = useState<string>("");
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [schedule, setSchedule] = useState<ShuffledActivity[]>([]);

  // Tabs for advisor features
  const [activeTab, setActiveTab] = useState<"itinerary" | "packing" | "chat">("itinerary");

  // Saved plans state
  const [savedPlans, setSavedPlans] = useState<SavedTripPlan[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load saved plans on mount
  useEffect(() => {
    let loaded = localStorage.getItem("tigereye_saved_plans");
    if (!loaded) {
      loaded = localStorage.getItem("skyline_saved_plans");
    }
    if (loaded) {
      try {
        setSavedPlans(JSON.parse(loaded));
      } catch (e) {
        console.error("Failed to parse saved plans", e);
      }
    }
  }, []);

  const handleSavePlan = () => {
    if (!weatherData) return;

    const newPlan: SavedTripPlan = {
      id: "trip_" + Date.now(),
      cityName: weatherData.location.name,
      startDate,
      endDate,
      intent: intent || "General sightseeing",
      packingList: packingItems,
      itinerary: schedule,
      weatherSummary: `Temp: ${weatherData.current.temperature_2m}°C, Code: ${weatherData.current.weather_code}`,
      savedAt: new Date().toLocaleDateString(),
    };

    const updated = [newPlan, ...savedPlans];
    setSavedPlans(updated);
    localStorage.setItem("tigereye_saved_plans", JSON.stringify(updated));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPlans.filter((p) => p.id !== id);
    setSavedPlans(updated);
    localStorage.setItem("tigereye_saved_plans", JSON.stringify(updated));
  };

  const handleLoadPlan = (plan: SavedTripPlan) => {
    setStartDate(plan.startDate);
    setEndDate(plan.endDate);
    setIntent(plan.intent);
    setPackingItems(plan.packingList);
    setSchedule(plan.itinerary);
  };

  const weatherSummaryText = weatherData
    ? `Current: ${weatherData.current.temperature_2m}°C. Forecast max: ${weatherData.daily.temperature_2m_max[0]}°C`
    : "";

  return (
    <div
      id="trip-advisor-panel"
      className="glass-panel p-6 transition-all shadow-xl"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-brand-primary" />
            <h2 className="font-display font-bold text-lg tracking-tight">
              Smart Trip Planner
            </h2>
          </div>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Set dates, define intent, generate weather-smart plans, and save them.
          </p>
        </div>

        {/* Saved Trips selector */}
        {savedPlans.length > 0 && (
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-brand-primary" />
            <select
              onChange={(e) => {
                const plan = savedPlans.find((p) => p.id === e.target.value);
                if (plan) handleLoadPlan(plan);
              }}
              defaultValue=""
              id="saved-plans-select"
              className={`text-xs px-3 py-1.5 rounded-lg border font-sans outline-none ${
                darkMode
                  ? "bg-zinc-900 border-zinc-800 text-zinc-300"
                  : "bg-white border-[#d0c6b3] text-brand-dark-card"
              }`}
            >
              <option value="" disabled>
                Recall Saved Plan...
              </option>
              {savedPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.cityName} ({plan.startDate})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Date Selectors & Config Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Start Date */}
        <div className="space-y-1.5">
          <label className="block text-xs font-display font-semibold text-zinc-400 uppercase tracking-wider">
            Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full text-xs px-3 py-2 rounded-xl border outline-none font-sans ${
                darkMode
                  ? "bg-zinc-900 border-zinc-800 text-zinc-100"
                  : "bg-white border-[#dcd2be] text-brand-dark-card"
              }`}
            />
          </div>
        </div>

        {/* End Date */}
        <div className="space-y-1.5">
          <label className="block text-xs font-display font-semibold text-zinc-400 uppercase tracking-wider">
            End Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full text-xs px-3 py-2 rounded-xl border outline-none font-sans ${
                darkMode
                  ? "bg-zinc-900 border-zinc-800 text-zinc-100"
                  : "bg-white border-[#dcd2be] text-brand-dark-card"
              }`}
            />
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-end">
          <button
            onClick={handleSavePlan}
            disabled={!weatherData || (packingItems.length === 0 && schedule.length === 0)}
            id="btn-save-plan"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-display font-medium text-sm rounded-xl transition-all disabled:opacity-40"
          >
            {saveSuccess ? (
              <>
                <BookmarkCheck className="h-4 w-4 text-emerald-300 animate-bounce" />
                Plan Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Recommendation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex border-b border-black/5 dark:border-white/5 mb-6">
        <button
          onClick={() => setActiveTab("itinerary")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-display font-semibold text-xs uppercase tracking-wide transition-all ${
            activeTab === "itinerary"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Itinerary Shuffler
        </button>
        <button
          onClick={() => setActiveTab("packing")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-display font-semibold text-xs uppercase tracking-wide transition-all ${
            activeTab === "packing"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Packing Assistant
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-display font-semibold text-xs uppercase tracking-wide transition-all ${
            activeTab === "chat"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          TigerEye Chat
        </button>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[220px]">
        {activeTab === "itinerary" && (
          <ItineraryShuffler
            schedule={schedule}
            setSchedule={setSchedule}
            dailyForecast={weatherData ? weatherData.daily : null}
            locationName={weatherData ? weatherData.location.name : ""}
            darkMode={darkMode}
          />
        )}

        {activeTab === "packing" && (
          <PackingAssistant
            items={packingItems}
            setItems={setPackingItems}
            locationName={weatherData ? weatherData.location.name : ""}
            weatherSummary={weatherSummaryText}
            intent={intent}
            setIntent={setIntent}
            darkMode={darkMode}
          />
        )}

        {activeTab === "chat" && <Chatbot weatherData={weatherData} darkMode={darkMode} />}
      </div>

      {/* Side Trip list displayed underneath when in mobile/tablet */}
      {savedPlans.length > 0 && (
        <div className="mt-8 border-t border-black/5 dark:border-white/5 pt-6">
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-zinc-400 mb-3">
            Saved Trips Library ({savedPlans.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {savedPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => handleLoadPlan(plan)}
                className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${
                  darkMode
                    ? "bg-zinc-900/30 border-zinc-800/80 hover:bg-zinc-900/60"
                    : "bg-white/30 border-[#d9ceb8] hover:bg-white/60"
                }`}
              >
                <div className="min-w-0">
                  <h5 className="font-display font-bold text-sm text-brand-primary truncate">
                    {plan.cityName}
                  </h5>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {plan.startDate} to {plan.endDate}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeletePlan(plan.id, e)}
                  id={`btn-delete-saved-plan-${plan.id}`}
                  className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
