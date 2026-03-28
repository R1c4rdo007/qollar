"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Star, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Transaction {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

const REWARDS = [
  { points: 100, label: "Descuento 10% en tienda aliada", icon: "🛍️" },
  { points: 250, label: "Consulta virtual gratis con Dr. Qoll", icon: "🩺" },
  { points: 500, label: "Plaquita QR gratis", icon: "🏷️" },
  { points: 1000, label: "Mes premium gratis", icon: "⭐" },
];

export default function PointsClient({ points, transactions }: { points: number; transactions: Transaction[] }) {
  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-yellow-600/10 blur-[120px]" />
      </div>

      <header className="relative z-10 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard">
            <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 className="font-bold text-white">Mis QollPoints</h1>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 text-center glow-orange"
        >
          <div className="text-5xl mb-3">⭐</div>
          <p className="text-6xl font-black gradient-text">{points}</p>
          <p className="text-[#9B8FC0] mt-2">QollPoints acumulados</p>
        </motion.div>

        {/* How to earn */}
        <div className="glass rounded-3xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#FF6B35]" />
            ¿Cómo ganar puntos?
          </h2>
          <div className="space-y-3">
            {[
              { action: "Registrarte en Qollar", pts: 50, icon: "🎉" },
              { action: "Registrar una mascota", pts: 20, icon: "🐾" },
              { action: "Encontrar una mascota perdida", pts: 100, icon: "🏆" },
              { action: "Publicar en la comunidad", pts: 5, icon: "📸" },
              { action: "Comentar una publicación", pts: 2, icon: "💬" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white/3 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-[#9B8FC0]">{item.action}</span>
                </div>
                <span className="text-sm font-bold text-[#FF6B35]">+{item.pts} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards */}
        <div className="glass rounded-3xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Star size={18} className="text-yellow-400" />
            Recompensas disponibles
          </h2>
          <div className="space-y-3">
            {REWARDS.map((r, i) => (
              <div key={i} className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${points >= r.points ? "bg-[#FF6B35]/10 border-[#FF6B35]/30" : "bg-white/3 border-white/10"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{r.icon}</span>
                  <span className="text-sm text-white">{r.label}</span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold ${points >= r.points ? "text-[#FF6B35]" : "text-[#9B8FC0]"}`}>
                    {r.points} pts
                  </span>
                  {points >= r.points && (
                    <p className="text-xs text-[#10B981]">¡Disponible!</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#9B8FC0] text-center mt-4">
            Canje de recompensas próximamente 🚀
          </p>
        </div>

        {/* Transaction history */}
        <div className="glass rounded-3xl p-6">
          <h2 className="font-semibold text-white mb-4">Historial de puntos</h2>
          {transactions.length === 0 ? (
            <p className="text-[#9B8FC0] text-sm text-center py-4">Sin transacciones aún</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-white/3 rounded-2xl px-4 py-3">
                  <div>
                    <p className="text-sm text-white">{t.reason}</p>
                    <p className="text-xs text-[#9B8FC0]">
                      {new Date(t.created_at).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                  <span className={`font-bold text-sm ${t.amount > 0 ? "text-[#10B981]" : "text-red-400"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
