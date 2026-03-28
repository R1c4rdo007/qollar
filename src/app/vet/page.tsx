"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { VET_AI_NAME, VET_AI_DESCRIPTION } from "@/lib/config";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "¿Cuántas veces al día debo alimentar a mi perro?",
  "Mi gato no quiere comer, ¿qué hago?",
  "¿Cuándo debo vacunar a mi cachorro?",
  "¿Es normal que mi perro coma pasto?",
  "¿Cómo sé si mi mascota tiene fiebre?",
  "¿Cada cuánto debo bañar a mi perro?",
];

export default function VetPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: `¡Hola! Soy **${VET_AI_NAME}**, ${VET_AI_DESCRIPTION} 🐾\n\n¿En qué puedo ayudarte hoy? Puedes preguntarme sobre alimentación, salud, comportamiento o cuidados de tu mascota.\n\n*Recuerda: mis consejos son orientativos. Para diagnósticos formales, consulta con un veterinario.*`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = messages
      .filter((m) => m.role !== "assistant" || messages.indexOf(m) !== 0)
      .map((m) => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch("/api/vet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", text: `❌ ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: data.text }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Error de conexión. Por favor intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  function renderText(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-700/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-purple-700/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 glass border-b border-white/5 px-6 py-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard">
            <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-xl shadow-lg">
              🩺
            </div>
            <div>
              <h1 className="font-bold text-white">{VET_AI_NAME}</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <p className="text-xs text-[#9B8FC0]">Veterinario virtual · Disponible 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0">
                  🩺
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-3xl px-5 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] text-white rounded-tr-lg"
                    : "glass text-[#F8F4FF] rounded-tl-lg"
                }`}
                dangerouslySetInnerHTML={{ __html: renderText(msg.text) }}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-sm mr-2 flex-shrink-0">
              🩺
            </div>
            <div className="glass rounded-3xl rounded-tl-lg px-5 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-[#10B981]" />
              <span className="text-xs text-[#9B8FC0]">{VET_AI_NAME} está escribiendo...</span>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="relative z-10 max-w-2xl mx-auto w-full px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="flex-shrink-0 text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[#9B8FC0] hover:text-white hover:bg-white/10 whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative z-10 glass border-t border-white/5 px-4 py-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Pregúntale al Dr. Qoll..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-[#9B8FC0]/60 focus:border-[#10B981]/60 focus:ring-2 focus:ring-[#10B981]/20 focus:outline-none"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-lg disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
