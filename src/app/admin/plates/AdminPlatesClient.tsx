"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, QrCode, Tag, Search } from "lucide-react";
import Link from "next/link";

interface Plate {
  id: string;
  plate_code: string;
  status: "inactive" | "active";
  batch_id: string | null;
  created_at: string;
  activated_at: string | null;
  pet: { id: string; name: string; species: string } | null;
}

export default function AdminPlatesClient({ plates }: { plates: Plate[] }) {
  const [filter, setFilter] = useState<"all" | "inactive" | "active">("all");
  const [search, setSearch] = useState("");

  const filtered = plates.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search && !p.plate_code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: plates.length,
    active: plates.filter((p) => p.status === "active").length,
    inactive: plates.filter((p) => p.status === "inactive").length,
  };

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-purple-700/15 blur-[120px]" />
      </div>

      <header className="relative z-10 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white"><ArrowLeft size={20} /></button>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-white">Gestión de Plaquitas</h1>
            <p className="text-xs text-[#9B8FC0]">{plates.length} plaquitas en total</p>
          </div>
          <Link href="/admin/plates/generate">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#FF6B35]/90">
              <QrCode size={16} />Generar lote
            </button>
          </Link>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-white" },
            { label: "Activas", value: stats.active, color: "text-emerald-400" },
            { label: "Vírgenes", value: stats.inactive, color: "text-[#9B8FC0]" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[#9B8FC0] text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B8FC0]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 focus:outline-none" />
          </div>
          <div className="flex gap-2">
            {(["all", "inactive", "active"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f ? "bg-[#FF6B35] text-white" : "bg-white/5 text-[#9B8FC0] hover:bg-white/10"}`}>
                {f === "all" ? "Todas" : f === "inactive" ? "Vírgenes" : "Activas"}
              </button>
            ))}
          </div>
        </div>

        {/* Plates list */}
        <div className="space-y-3">
          {filtered.map((plate, i) => (
            <motion.div key={plate.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${plate.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-[#9B8FC0]"}`}>
                {plate.status === "active" ? <QrCode size={18} /> : <Tag size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-mono font-semibold text-sm">{plate.plate_code}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${plate.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-[#9B8FC0]"}`}>
                    {plate.status === "active" ? "Activa" : "Virgen"}
                  </span>
                  {plate.pet && <span className="text-xs text-[#9B8FC0]">→ {plate.pet.name} {plate.pet.species === "dog" ? "🐶" : "🐱"}</span>}
                  {plate.batch_id && <span className="text-xs text-[#9B8FC0]/50">Lote: {plate.batch_id}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-[#9B8FC0]">{new Date(plate.created_at).toLocaleDateString("es-PE")}</p>
                {plate.activated_at && <p className="text-xs text-emerald-400">Activada {new Date(plate.activated_at).toLocaleDateString("es-PE")}</p>}
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Tag size={32} className="text-[#9B8FC0]/30 mx-auto mb-2" />
              <p className="text-[#9B8FC0] text-sm">Sin plaquitas que coincidan</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
