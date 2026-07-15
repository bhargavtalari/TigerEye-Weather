import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User, Sparkles, MessageSquare, RefreshCw } from "lucide-react";
import { ChatMessage, WeatherData } from "../types";

interface ChatbotProps {
  weatherData: WeatherData | null;
  darkMode: boolean;
}

export default function Chatbot({ weatherData, darkMode }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Welcome! I am Skyline Guide, your smart weather planning copilot. Search for a city, select travel dates, or ask me anything like 'What should I do if it rains in Paris?' or 'Suggest an outdoor gear checklist!'",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsgId = Date.now().toString();
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          weatherContext: weatherData
            ? {
                current: weatherData.current,
                daily: weatherData.daily,
              }
            : null,
          location: weatherData ? weatherData.location.name : "unknown",
        }),
      });

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text || "I was unable to retrieve a response. Please verify details.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I am having trouble connecting to the weather intelligence system.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "init",
        role: "assistant",
        content: "History cleared. How can I help you plan under the current weather forecast?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-[300px] border border-zinc-700/10 dark:border-zinc-800 rounded-2xl overflow-hidden bg-black/5 dark:bg-white/2">
      {/* Mini Chat Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700/10 dark:border-zinc-800/80 bg-zinc-400/5 dark:bg-zinc-950/20">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand-primary" />
          <span className="text-xs font-display font-semibold uppercase tracking-wider">
            SkyLine Copilot Chat
          </span>
        </div>
        <button
          onClick={handleClearChat}
          id="btn-clear-chat"
          className="text-[10px] font-mono hover:text-red-500 font-semibold px-2 py-0.5 rounded border border-zinc-700/10 dark:border-zinc-800 transition-all"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map((m) => {
          const isAssistant = m.role === "assistant";
          return (
            <div key={m.id} className={`flex gap-2.5 ${!isAssistant ? "justify-end" : ""}`}>
              {isAssistant && (
                <div className="h-6 w-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed font-sans ${
                  isAssistant
                    ? darkMode
                      ? "bg-zinc-900 border border-zinc-800 text-zinc-200"
                      : "bg-[#e2d7c4] text-brand-dark-card"
                    : "bg-brand-primary text-white"
                }`}
              >
                <p className="whitespace-pre-line">{m.content}</p>
                <span className="block text-[9px] opacity-60 text-right mt-1 font-mono">
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5">
            <div className="h-6 w-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 animate-bounce">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div
              className={`rounded-2xl px-3.5 py-2.5 text-xs ${
                darkMode ? "bg-zinc-900 border border-zinc-800" : "bg-[#e2d7c4]"
              }`}
            >
              <div className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 bg-brand-primary rounded-full animate-bounce" />
                <span className="h-1.5 w-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 p-3 border-t border-zinc-700/10 dark:border-zinc-800/80 bg-zinc-400/5 dark:bg-zinc-950/20"
      >
        <input
          type="text"
          placeholder="Ask about weather, packing, or activity plans..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`flex-1 text-xs px-3 py-2 rounded-xl border outline-none font-sans ${
            darkMode
              ? "bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-brand-primary"
              : "bg-white border-[#dcd2be] text-brand-dark-card focus:border-brand-primary"
          }`}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          id="btn-send-chat"
          className="p-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl transition-all disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
