import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ListTodo, RefreshCw, Calendar, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { ShuffledActivity, DailyWeather } from "../types";

interface ItineraryShufflerProps {
  schedule: ShuffledActivity[];
  setSchedule: React.Dispatch<React.SetStateAction<ShuffledActivity[]>>;
  dailyForecast: DailyWeather | null;
  locationName: string;
  darkMode: boolean;
}

export default function ItineraryShuffler({
  schedule,
  setSchedule,
  dailyForecast,
  locationName,
  darkMode,
}: ItineraryShufflerProps) {
  const [activities, setActivities] = useState<string[]>([
    "Outdoor Photography / Sightseeing",
    "Local Art Museum Tour",
    "Casual Evening Cafe Exploration",
  ]);
  const [newActivity, setNewActivity] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim()) return;
    setActivities((prev) => [...prev, newActivity.trim()]);
    setNewActivity("");
  };

  const handleRemoveActivity = (index: number) => {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  };

  const shuffleItinerary = async () => {
    if (activities.length === 0 || !dailyForecast) return;
    setLoading(true);
    try {
      const response = await fetch("/api/gemini/shuffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activities,
          dailyForecast,
          location: locationName,
        }),
      });
      const data = await response.json();
      if (data.schedule) {
        setSchedule(data.schedule);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Configuration column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Activities builder */}
        <div className="space-y-3">
          <label className="block text-xs font-display font-semibold text-zinc-400 uppercase tracking-wider">
            Input Activities (3-4 Items Recommended)
          </label>
          <form onSubmit={handleAddActivity} className="flex gap-1.5">
            <input
              type="text"
              placeholder="e.g. Hiking, Museum, Surf session, Dinner date"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              className={`flex-1 text-sm px-3 py-2 rounded-xl border outline-none font-sans transition-all ${
                darkMode
                  ? "bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-brand-primary"
                  : "bg-white border-[#dcd2be] text-brand-dark-card focus:border-brand-primary"
              }`}
            />
            <button
              type="submit"
              id="btn-add-activity"
              className="px-3 bg-zinc-800 hover:bg-zinc-700 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-xl font-display font-medium text-xs shrink-0 transition-all"
            >
              Add
            </button>
          </form>

          {/* Activities list */}
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {activities.map((act, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-sans border ${
                    darkMode
                      ? "bg-zinc-900/60 border-zinc-800/60"
                      : "bg-white/60 border-[#e5dcce]"
                  }`}
                >
                  <span className="truncate">{act}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveActivity(index)}
                    id={`btn-remove-activity-${index}`}
                    className="text-zinc-400 hover:text-red-500 font-display font-medium"
                  >
                    Remove
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            onClick={shuffleItinerary}
            disabled={loading || activities.length === 0 || !dailyForecast}
            id="btn-trigger-shuffler"
            className="w-full py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-display font-medium text-sm rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Sparkles className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Aligning Schedules..." : "Align Schedule to Weather"}
          </button>
        </div>

        {/* Right: Display optimized schedule */}
        <div className="border border-zinc-700/10 dark:border-zinc-800 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
            <span className="block text-[10px] font-display font-bold text-zinc-400 uppercase tracking-widest">
              Smart Weather Alignment
            </span>

            {schedule.length > 0 ? (
              <div className="space-y-3">
                {schedule.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2.5 rounded-xl border text-xs font-sans ${
                      darkMode
                        ? "bg-zinc-900/50 border-zinc-800/80"
                        : "bg-white/50 border-[#dfd6c6]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-brand-primary">{item.activity}</span>
                      <span className="px-2 py-0.5 rounded-md font-display font-bold uppercase text-[9px] bg-brand-primary/10 text-brand-secondary">
                        {item.optimizedDay}
                      </span>
                    </div>
                    <p className="text-zinc-500 font-light text-[11px] leading-relaxed">
                      <strong>Reason:</strong> {item.reason}
                    </p>
                    <p className="text-zinc-400 font-light text-[11px] leading-relaxed mt-0.5">
                      <strong>Tip:</strong> {item.tip}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-8 w-8 text-zinc-400 opacity-60" />
                <h5 className="mt-2 text-xs font-semibold font-display text-zinc-400">
                  Forecast Matrix Empty
                </h5>
                <p className="text-[10px] text-zinc-500 font-sans mt-1">
                  Add 3-4 activities and click "Align Schedule" to map them optimally onto the 7-day weather outlook!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
