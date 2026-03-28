"use client";

import { motion } from "framer-motion";
import { Users, PawPrint, QrCode, ScanLine, BookOpen, TrendingUp, Tag, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  totalUsers: number;
  totalPets: number;
  totalPlates: number;
  activePlates: number;
  totalPosts: number;
  totalScans: number;
}

export default function AdminDashboardClient({ stats }: { stats: Stats }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const cards = [
    { label: "Usuarios registrados", value: stats.totalUsers, icon: <Users size={20} />, color: "from-blue-500 to-blue-400" },
    { label: "Mascotas registradas", value: stats.totalPets, icon: <PawPrint size={20} />, color: "from-orange-500 to-orange-400" },
    { label: "Plaquitas generadas", value: stats.totalPlates, icon: <Tag size={20} />, color: "from-purple-500 to-purple-400" },
    { label: "Plaquitas activas", value: stats.activePlates, icon: <QrCode size={20} />, color: "from-emerald-500 to-emerald-400" },
    { label: "Publicaciones", value: stats.totalPosts, icon: <BookOpen size={20} />, color: "from-pink-500 to-pink-400" },
    { label: "Escaneos totales", value: stats.totalScans, icon: <ScanLine size={20} />, color: "from-yellow-500 to-yellow-400" },
  ];

  const navItems = [
    { href: "/admin/plates", label: "Gestionar plaquitas", icon: <Tag size={18} />, description: "Ver, generar y exportar placas QR para laser" },
    { href: "/admin/plates/generate", label: "Generar nuevo lote", icon: <QrCode size={18} />, description: "Crea un lote de códigos QR vírgenes" },
    { href: "/dashboard", label: "Ver app como usuario", icon: <TrendingUp size={18} />, description: "Accede al dashboard normal" },
  ];

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-purple-700/15 blur-[120px]" />
      </div>

      <header className="relative z-10 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center text-sm">🐾</div>
            <div>
              <span className="text-lg font-bold gradient-text">Qollar</span>
              <span className="ml-2 text-xs bg-[#FF6B35]/20 text-[#FF6B35] px-2 py-0.5 rounded-full font-semibold">ADMIN</span>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
          <p className="text-[#9B8FC0] text-sm mt-1">Vista completa de Qollar</p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-3xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-3`}>
                {card.icon}
              </div>
              <p className="text-3xl font-black text-white">{card.value}</p>
              <p className="text-[#9B8FC0] text-xs mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-lg font-semibold text-white mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {navItems.map((item, i) => (
              <Link key={i} href={item.href}>
                <div className="glass rounded-3xl p-5 hover:bg-white/8 group cursor-pointer h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/15 flex items-center justify-center text-[#FF6B35] mb-3 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <p className="font-semibold text-white text-sm">{item.label}</p>
                  <p className="text-[#9B8FC0] text-xs mt-1">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
