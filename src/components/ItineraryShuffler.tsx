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

  const shuffleItinerary = () => {
    if (activities.length === 0 || !dailyForecast) return;
    setLoading(true);
    setTimeout(() => {
      // Create schedules
      const matchedSchedule: ShuffledActivity[] = [];
      const days = dailyForecast.time.map((t, idx) => {
        const dateObj = new Date(t);
        const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
        return {
          dayName,
          tempMax: dailyForecast.temperature_2m_max[idx],
          precipProb: dailyForecast.precipitation_probability_max[idx],
          weatherCode: dailyForecast.weather_code[idx],
        };
      });

      // Loop through each activity and map to a day
      activities.forEach((activity) => {
        const actLower = activity.toLowerCase();
        
        // Find best day for this activity
        // We will assign a score to each day for this activity
        const scoredDays = days.map((day, dayIdx) => {
          let score = 50; // base score

          const isOutdoor = actLower.includes("hike") || 
                            actLower.includes("surf") || 
                            actLower.includes("beach") || 
                            actLower.includes("photo") || 
                            actLower.includes("walk") || 
                            actLower.includes("park") || 
                            actLower.includes("sightsee") || 
                            actLower.includes("climb") || 
                            actLower.includes("sport") || 
                            actLower.includes("outdoor");

          const isIndoor = actLower.includes("museum") || 
                           actLower.includes("cafe") || 
                           actLower.includes("dine") || 
                           actLower.includes("dining") || 
                           actLower.includes("restaurant") || 
                           actLower.includes("shop") || 
                           actLower.includes("gallery") || 
                           actLower.includes("cinema") || 
                           actLower.includes("spa") || 
                           actLower.includes("indoor");

          if (isOutdoor) {
            // outdoor prefers low precipitation
            score -= day.precipProb * 0.8;
            // outdoor prefers pleasant temperatures (15 to 26)
            if (day.tempMax >= 15 && day.tempMax <= 26) {
              score += 20;
            } else if (day.tempMax < 10 || day.tempMax > 32) {
              score -= 15;
            }
          } else if (isIndoor) {
            // indoor is fine with high precipitation
            if (day.precipProb > 40) {
              score += 20;
            }
            // indoor is fine/prefers extreme temps
            if (day.tempMax < 12 || day.tempMax > 30) {
              score += 10;
            }
          }

          // Spread out index to avoid assigning everything to the exact same day
          score -= (dayIdx % 3) * 2;

          return { day, score, dayIdx };
        });

        // Sort scored days descending
        scoredDays.sort((a, b) => b.score - a.score);
        const bestDay = scoredDays[0].day;

        // Generate reason and tip deterministically based on actual weather
        let reason = "";
        let tip = "";

        if (bestDay.precipProb > 40) {
          reason = `Rain probability is high (${bestDay.precipProb}%) on ${bestDay.dayName}, making it the perfect timing for this activity.`;
          tip = "Carry an umbrella and stick to covered areas or cozy interiors.";
        } else if (bestDay.tempMax < 10) {
          reason = `Brisk temperatures of ${Math.round(bestDay.tempMax)}°C on ${bestDay.dayName} provide a refreshing climate for this plan.`;
          tip = "Dress in multiple insulated layers to stay comfortable throughout.";
        } else {
          reason = `Beautiful dry conditions (Precip: ${bestDay.precipProb}%) and a comfortable high of ${Math.round(bestDay.tempMax)}°C on ${bestDay.dayName} offer perfect conditions.`;
          tip = "Bring sunglasses and stay hydrated while enjoying the fantastic weather.";
        }

        matchedSchedule.push({
          activity,
          optimizedDay: bestDay.dayName,
          reason,
          tip,
        });
      });

      setSchedule(matchedSchedule);
      setLoading(false);
    }, 1000);
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
