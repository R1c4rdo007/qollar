"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, PawPrint, QrCode, ScanLine, BookOpen, TrendingUp, Tag, LogOut, X, ChevronRight } from "lucide-react";
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

type DetailType = "users" | "pets" | "posts" | "scans" | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DetailRow = Record<string, any>;

export default function AdminDashboardClient({ stats }: { stats: Stats }) {
  const router = useRouter();
  const [detailType, setDetailType] = useState<DetailType>(null);
  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  async function openDetail(type: DetailType) {
    if (!type) return;
    setDetailType(type);
    setDetailRows([]);
    setLoadingDetail(true);
    const supabase = createClient();

    if (type === "users") {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      setDetailRows(data || []);
    } else if (type === "pets") {
      const { data } = await supabase
        .from("pets")
        .select("id, name, species, created_at, owner:profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      setDetailRows(data || []);
    } else if (type === "posts") {
      const { data } = await supabase
        .from("community_posts")
        .select("id, caption, created_at, likes_count, author:profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      setDetailRows(data || []);
    } else if (type === "scans") {
      const { data } = await supabase
        .from("scan_events")
        .select("id, created_at, location_lat, location_lng, plate:qr_plates(plate_code)")
        .order("created_at", { ascending: false })
        .limit(50);
      setDetailRows(data || []);
    }

    setLoadingDetail(false);
  }

  const cards: { label: string; value: number; icon: React.ReactNode; color: string; action: () => void }[] = [
    {
      label: "Usuarios registrados",
      value: stats.totalUsers,
      icon: <Users size={20} />,
      color: "from-blue-500 to-blue-400",
      action: () => openDetail("users"),
    },
    {
      label: "Mascotas registradas",
      value: stats.totalPets,
      icon: <PawPrint size={20} />,
      color: "from-orange-500 to-orange-400",
      action: () => openDetail("pets"),
    },
    {
      label: "Plaquitas generadas",
      value: stats.totalPlates,
      icon: <Tag size={20} />,
      color: "from-purple-500 to-purple-400",
      action: () => router.push("/admin/plates"),
    },
    {
      label: "Plaquitas activas",
      value: stats.activePlates,
      icon: <QrCode size={20} />,
      color: "from-emerald-500 to-emerald-400",
      action: () => router.push("/admin/plates?filter=active"),
    },
    {
      label: "Publicaciones",
      value: stats.totalPosts,
      icon: <BookOpen size={20} />,
      color: "from-pink-500 to-pink-400",
      action: () => openDetail("posts"),
    },
    {
      label: "Escaneos totales",
      value: stats.totalScans,
      icon: <ScanLine size={20} />,
      color: "from-yellow-500 to-yellow-400",
      action: () => openDetail("scans"),
    },
  ];

  const navItems = [
    { href: "/admin/plates", label: "Gestionar plaquitas", icon: <Tag size={18} />, description: "Ver, generar y exportar placas QR para laser" },
    { href: "/admin/plates/generate", label: "Generar nuevo lote", icon: <QrCode size={18} />, description: "Crea un lote de códigos QR vírgenes" },
    { href: "/dashboard", label: "Ver app como usuario", icon: <TrendingUp size={18} />, description: "Accede al dashboard normal" },
  ];

  const detailLabels: Record<NonNullable<DetailType>, string> = {
    users: "Usuarios registrados",
    pets: "Mascotas registradas",
    posts: "Publicaciones",
    scans: "Escaneos",
  };

  function renderDetailRow(row: DetailRow, type: DetailType) {
    if (type === "users") {
      return (
        <div key={row.id} className="flex items-center gap-3 py-2.5 border-b border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(row.full_name?.[0] || "U").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{row.full_name || "Sin nombre"}</p>
          </div>
          <p className="text-xs text-[#9B8FC0] flex-shrink-0">{new Date(row.created_at).toLocaleDateString("es-PE")}</p>
        </div>
      );
    }
    if (type === "pets") {
      const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
      return (
        <div key={row.id} className="flex items-center gap-3 py-2.5 border-b border-white/5">
          <span className="text-xl flex-shrink-0">{row.species === "dog" ? "🐶" : row.species === "cat" ? "🐱" : "🐾"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{row.name}</p>
            <p className="text-xs text-[#9B8FC0] truncate">{owner?.full_name || "–"}</p>
          </div>
          <p className="text-xs text-[#9B8FC0] flex-shrink-0">{new Date(row.created_at).toLocaleDateString("es-PE")}</p>
        </div>
      );
    }
    if (type === "posts") {
      const author = Array.isArray(row.author) ? row.author[0] : row.author;
      return (
        <div key={row.id} className="flex items-center gap-3 py-2.5 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{row.caption || "(Sin texto)"}</p>
            <p className="text-xs text-[#9B8FC0]">{author?.full_name || "–"} · ❤️ {row.likes_count ?? 0}</p>
          </div>
          <p className="text-xs text-[#9B8FC0] flex-shrink-0">{new Date(row.created_at).toLocaleDateString("es-PE")}</p>
        </div>
      );
    }
    if (type === "scans") {
      const plate = Array.isArray(row.plate) ? row.plate[0] : row.plate;
      return (
        <div key={row.id} className="flex items-center gap-3 py-2.5 border-b border-white/5">
          <ScanLine size={16} className="text-yellow-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-mono truncate">{plate?.plate_code || "–"}</p>
            {row.location_lat && (
              <p className="text-xs text-[#9B8FC0]">{Number(row.location_lat).toFixed(4)}, {Number(row.location_lng).toFixed(4)}</p>
            )}
          </div>
          <p className="text-xs text-[#9B8FC0] flex-shrink-0">{new Date(row.created_at).toLocaleDateString("es-PE")}</p>
        </div>
      );
    }
    return null;
  }

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
          <p className="text-[#9B8FC0] text-sm mt-1">Toca una métrica para ver el detalle</p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {cards.map((card, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={card.action}
              className="glass rounded-3xl p-5 text-left hover:bg-white/5 transition-colors group w-full"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-3`}>
                {card.icon}
              </div>
              <p className="text-3xl font-black text-white">{card.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[#9B8FC0] text-xs">{card.label}</p>
                <ChevronRight size={14} className="text-[#9B8FC0]/40 group-hover:text-[#9B8FC0] transition-colors" />
              </div>
            </motion.button>
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

      {/* Detail drawer */}
      <AnimatePresence>
        {detailType && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailType(null)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-50 glass border-t border-white/10 rounded-t-3xl"
              style={{ maxHeight: "75vh" }}
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
                <div>
                  <h2 className="font-bold text-white">{detailLabels[detailType]}</h2>
                  <p className="text-xs text-[#9B8FC0]">Últimos 50 registros</p>
                </div>
                <button
                  onClick={() => setDetailType(null)}
                  className="p-2 rounded-xl bg-white/5 text-[#9B8FC0] hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-6 pb-8" style={{ maxHeight: "calc(75vh - 80px)" }}>
                {loadingDetail ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-[#9B8FC0] text-sm">Cargando...</p>
                  </div>
                ) : detailRows.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-[#9B8FC0] text-sm">Sin registros aún</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/0">
                    {detailRows.map((row) => renderDetailRow(row, detailType))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
