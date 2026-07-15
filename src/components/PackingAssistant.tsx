import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ClipboardList, Plus, Trash2, Sparkles, AlertCircle } from "lucide-react";
import { PackingItem } from "../types";

interface PackingAssistantProps {
  items: PackingItem[];
  setItems: React.Dispatch<React.SetStateAction<PackingItem[]>>;
  locationName: string;
  weatherSummary: string;
  intent: string;
  setIntent: (intent: string) => void;
  darkMode: boolean;
}

export default function PackingAssistant({
  items,
  setItems,
  locationName,
  weatherSummary,
  intent,
  setIntent,
  darkMode,
}: PackingAssistantProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("Clothing");

  const generatePackingList = () => {
    setLoading(true);
    setTimeout(() => {
      // Deterministic generation
      const newItems: PackingItem[] = [
        // Standard essential items
        { name: "Passport / Photo ID", category: "Documents", quantity: "1" },
        { name: "Wallet & Payment Cards", category: "Documents", quantity: "1" },
        { name: "Phone Charger & Power Bank", category: "Gear", quantity: "1" },
        { name: "Toothbrush & Toothpaste", category: "Toiletries", quantity: "1" },
        { name: "Deodorant & Skincare", category: "Toiletries", quantity: "1" },
      ];

      // Parse weather summary (or detect temp range)
      const tempMatch = weatherSummary.match(/Current:\s*(-?\d+)/i);
      const temp = tempMatch ? parseInt(tempMatch[1], 10) : 18;

      // Weather-based clothes
      if (temp < 10) {
        newItems.push(
          { name: "Heavy Winter Coat", category: "Clothing", quantity: "1" },
          { name: "Thermal Innerwear", category: "Clothing", quantity: "2" },
          { name: "Warm Woolen Beanie", category: "Clothing", quantity: "1" },
          { name: "Gloves / Mittens", category: "Clothing", quantity: "1" },
          { name: "Thick Wool Socks", category: "Clothing", quantity: "3" }
        );
      } else if (temp < 20) {
        newItems.push(
          { name: "Light Sweater / Cardigan", category: "Clothing", quantity: "2" },
          { name: "Denim or Windbreaker Jacket", category: "Clothing", quantity: "1" },
          { name: "Long Pants / Jeans", category: "Clothing", quantity: "3" },
          { name: "Comfortable Sneakers", category: "Clothing", quantity: "1" }
        );
      } else {
        newItems.push(
          { name: "Short Sleeve T-Shirts", category: "Clothing", quantity: "5" },
          { name: "Breathable Shorts / Skirts", category: "Clothing", quantity: "3" },
          { name: "Sunglasses", category: "Gear", quantity: "1" },
          { name: "Sunscreen lotion (SPF 50)", category: "Toiletries", quantity: "1" }
        );
      }

      // Rain/wet check
      const lowerSummary = weatherSummary.toLowerCase();
      if (lowerSummary.includes("rain") || lowerSummary.includes("shower") || lowerSummary.includes("drizzle") || lowerSummary.includes("precip")) {
        newItems.push(
          { name: "Compact Umbrella", category: "Gear", quantity: "1" },
          { name: "Waterproof Rain Shell", category: "Clothing", quantity: "1" }
        );
      }

      // Intent parsing
      const cleanIntent = intent.toLowerCase();
      if (cleanIntent.includes("hike") || cleanIntent.includes("hiking") || cleanIntent.includes("climb") || cleanIntent.includes("trail")) {
        newItems.push(
          { name: "Sturdy Hiking Boots", category: "Clothing", quantity: "1" },
          { name: "Reusable Water Flask", category: "Gear", quantity: "1" },
          { name: "Backpack / Daypack", category: "Gear", quantity: "1" },
          { name: "First-Aid Kit (compact)", category: "Gear", quantity: "1" }
        );
      }
      if (cleanIntent.includes("dine") || cleanIntent.includes("dining") || cleanIntent.includes("formal") || cleanIntent.includes("restaurant")) {
        newItems.push(
          { name: "Formal / Evening Wear", category: "Clothing", quantity: "1" },
          { name: "Dress Shoes / Heels", category: "Clothing", quantity: "1" }
        );
      }
      if (cleanIntent.includes("swim") || cleanIntent.includes("pool") || cleanIntent.includes("beach") || cleanIntent.includes("lake")) {
        newItems.push(
          { name: "Swimwear / Swimsuit", category: "Clothing", quantity: "2" },
          { name: "Quick-Dry Beach Towel", category: "Gear", quantity: "1" },
          { name: "Flip Flops / Sandals", category: "Clothing", quantity: "1" }
        );
      }
      if (cleanIntent.includes("business") || cleanIntent.includes("work") || cleanIntent.includes("present") || cleanIntent.includes("conference")) {
        newItems.push(
          { name: "Business Suit / Blazer", category: "Clothing", quantity: "1" },
          { name: "Laptop & Charger", category: "Gear", quantity: "1" },
          { name: "Professional Notepad", category: "Documents", quantity: "1" }
        );
      }

      setItems(newItems);
      setCheckedItems({});
      setLoading(false);
    }, 800);
  };

  const handleToggleCheck = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setItems((prev) => [
      ...prev,
      { name: newItem, category: newCategory, quantity: "1" },
    ]);
    setNewItem("");
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Search/Intent Input */}
      <div className="space-y-2">
        <label
          htmlFor="packing-intent-input"
          className="block text-xs font-display font-semibold text-zinc-400 uppercase tracking-wider"
        >
          Trip Intent & Special Plans
        </label>
        <div className="flex gap-2">
          <input
            id="packing-intent-input"
            type="text"
            placeholder="e.g., Casual hiking, fine dining, pool lounge, business presentation"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className={`flex-1 text-sm px-3 py-2.5 rounded-xl border outline-none font-sans transition-all ${
              darkMode
                ? "bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-brand-primary"
                : "bg-white border-[#dcd2be] text-brand-dark-card focus:border-brand-primary"
            }`}
          />
          <button
            onClick={generatePackingList}
            disabled={loading || !intent.trim()}
            id="btn-generate-packing"
            className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-display font-medium text-sm rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Packing..." : "Generate List"}
          </button>
        </div>
      </div>

      {/* Render list */}
      <AnimatePresence mode="popLayout">
        {items.length > 0 ? (
          <div className="space-y-4">
            {/* Packing List Items sorted by category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
              {items.map((item, index) => {
                const isChecked = checkedItems[index] || false;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isChecked
                        ? "opacity-50 line-through bg-zinc-500/5 border-transparent"
                        : darkMode
                        ? "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700"
                        : "bg-white/40 border-[#d9ceb8] hover:border-brand-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleCheck(index)}
                        id={`btn-check-item-${index}`}
                        className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          isChecked
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-zinc-400 hover:border-brand-primary"
                        }`}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-sans font-medium text-current truncate">
                          {item.name}
                        </p>
                        <span className="text-[10px] font-display font-semibold uppercase text-zinc-400 tracking-wider">
                          {item.category} • Qty {item.quantity}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(index)}
                      id={`btn-delete-item-${index}`}
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Add Custom Item Form */}
            <form onSubmit={handleAddItem} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Add custom item..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className={`flex-1 text-xs px-2.5 py-2 rounded-lg border outline-none font-sans ${
                  darkMode
                    ? "bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-brand-primary"
                    : "bg-white border-[#dcd2be] text-brand-dark-card focus:border-brand-primary"
                }`}
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className={`text-xs px-2 py-2 rounded-lg border outline-none font-sans ${
                  darkMode
                    ? "bg-zinc-900 border-zinc-800 text-zinc-100"
                    : "bg-white border-[#dcd2be] text-brand-dark-card"
                }`}
              >
                <option value="Clothing">Clothing</option>
                <option value="Gear">Gear</option>
                <option value="Toiletries">Toiletries</option>
                <option value="Documents">Documents</option>
              </select>
              <button
                type="submit"
                id="btn-add-custom-item"
                className="p-2 bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-lg transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-zinc-700/20 dark:border-zinc-800 rounded-2xl">
            <ClipboardList className="mx-auto h-8 w-8 text-zinc-400 opacity-60" />
            <h4 className="mt-2 text-sm font-semibold font-display text-zinc-400">
              No Packing Items Generated
            </h4>
            <p className="text-xs text-zinc-500 font-sans mt-1 max-w-[280px] mx-auto">
              Tell us your Trip Intent above and press 'Generate List' to build a custom weather-aware packing assistant.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
