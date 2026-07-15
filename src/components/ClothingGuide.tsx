import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Shirt, Sun, Wind, Shield, Layers, HelpCircle, Eye } from "lucide-react";
import { WeatherData, ClothingGuide as ClothingGuideType } from "../types";

interface ClothingGuideProps {
  weatherData: WeatherData | null;
  darkMode: boolean;
}

export default function ClothingGuide({ weatherData, darkMode }: ClothingGuideProps) {
  const [guide, setGuide] = useState<ClothingGuideType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchClothingGuide = () => {
    if (!weatherData) return;
    setLoading(true);
    setTimeout(() => {
      const temp = weatherData.current.temperature_2m;
      const code = weatherData.current.weather_code;
      const winds = weatherData.current.wind_speed_10m;

      let baseLayer = "Breathable short-sleeve t-shirt or linen shirt.";
      let middleLayer = "None (keep a light cardigan or hoodie in your bag just in case).";
      let outerLayer = "None needed. Enjoy the comfortable temperatures!";
      const accessories = ["Sunglasses", "Sunscreen (recommended)"];

      const isRainy = (code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);
      const isSnowy = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);

      if (temp < 0) {
        baseLayer = "Thermal underwear (merino wool/synthetic) and long-sleeve top.";
        middleLayer = "Heavy fleece sweater, down vest, or premium knit wool layer.";
        outerLayer = "Windproof and waterproof heavy insulated parka or down jacket.";
        accessories.push("Warm beanie", "Thick gloves", "Thermal wool socks", "Scarf");
      } else if (temp < 10) {
        baseLayer = "Long-sleeve t-shirt or light thermal crewneck.";
        middleLayer = "Fleece jacket, lightweight down sweater, or warm sweater.";
        outerLayer = "Trench coat, padded bomber jacket, or thick wool coat.";
        accessories.push("Light scarf", "Warm socks");
      } else if (temp < 18) {
        baseLayer = "Short-sleeve cotton shirt or long-sleeve button-down.";
        middleLayer = "Light knit sweater, crewneck sweatshirt, or structured blazer.";
        outerLayer = "Denim jacket, leather jacket, or lightweight windbreaker shell.";
      } else if (temp >= 28) {
        baseLayer = "Ultra-breathable tank top, loose t-shirt, or linen apparel.";
        middleLayer = "None. High temperature conditions.";
        outerLayer = "None.";
        accessories.push("Sun hat / Cap", "UV-protection glasses");
      }

      if (isRainy) {
        outerLayer = "Waterproof hardshell jacket or hooded rain slicker.";
        accessories.push("Compact Umbrella", "Water-resistant shoes/boots");
      } else if (isSnowy) {
        outerLayer = "Water-resistant insulated snow jacket.";
        accessories.push("Waterproof winter boots", "Warm mittens");
      }

      setGuide({
        baseLayer,
        middleLayer,
        outerLayer,
        accessories,
      });
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    if (weatherData) {
      fetchClothingGuide();
    } else {
      setGuide(null);
    }
  }, [weatherData]);

  if (!weatherData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      id="clothing-guide-container"
      className="glass-panel p-5 transition-all shadow-lg"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Shirt className="h-5 w-5 text-brand-primary" />
          <h3 className="font-display font-semibold text-base tracking-tight">
            Clothing Layering Guide
          </h3>
        </div>
        <span className="text-xs font-mono uppercase bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
          3-Layer Scheme
        </span>
      </div>

      {loading ? (
        <div className="space-y-4 py-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-black/5 dark:bg-white/5 animate-pulse shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 bg-black/5 dark:bg-white/5 rounded w-1/4 animate-pulse" />
                <div className="h-3 bg-black/5 dark:bg-white/5 rounded w-3/4 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : guide ? (
        <div className="space-y-4">
          {/* Base Layer */}
          <div className="flex gap-3 items-start border-b border-black/5 dark:border-white/5 pb-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs font-display font-semibold text-zinc-400 uppercase tracking-wider">
                Base Layer (Comfort)
              </span>
              <p className="text-sm font-sans font-medium mt-0.5">{guide.baseLayer}</p>
            </div>
          </div>

          {/* Middle Layer */}
          <div className="flex gap-3 items-start border-b border-black/5 dark:border-white/5 pb-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
              <Shirt className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs font-display font-semibold text-zinc-400 uppercase tracking-wider">
                Middle Layer (Insulation)
              </span>
              <p className="text-sm font-sans font-medium mt-0.5">{guide.middleLayer}</p>
            </div>
          </div>

          {/* Outer Layer */}
          <div className="flex gap-3 items-start border-b border-black/5 dark:border-white/5 pb-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs font-display font-semibold text-zinc-400 uppercase tracking-wider">
                Outer Layer (Protection)
              </span>
              <p className="text-sm font-sans font-medium mt-0.5">{guide.outerLayer}</p>
            </div>
          </div>

          {/* Accessories */}
          {guide.accessories && guide.accessories.length > 0 && (
            <div>
              <span className="block text-xs font-display font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Recommended Accessories
              </span>
              <div className="flex flex-wrap gap-1.5">
                {guide.accessories.map((acc, index) => (
                  <span
                    key={index}
                    className={`text-xs px-2.5 py-1 rounded-md font-sans border ${
                      darkMode
                        ? "bg-zinc-800/50 border-zinc-700/50 text-zinc-300"
                        : "bg-white/50 border-[#d0c6b3] text-brand-dark-card"
                    }`}
                  >
                    {acc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-zinc-500 font-sans">No clothing recommendation loaded.</p>
      )}
    </motion.div>
  );
}
