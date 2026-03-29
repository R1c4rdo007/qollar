"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, QrCode, LogOut, AlertCircle, CheckCircle, Bell, Star, Users, Stethoscope, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pet, Profile } from "@/types";
import { User } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/config";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import Image from "next/image";

interface Props {
  pets: Pet[];
  profile: Profile & { points?: number };
  user: User;
  unreadCount: number;
}

const NAV = [
  { href: "/community", icon: <Users size={20} />, label: "Comunidad" },
  { href: "/vet", icon: <Stethoscope size={20} />, label: "Dr. Qoll" },
  { href: "/points", icon: <Star size={20} />, label: "Puntos" },
];

export default function DashboardClient({ pets, profile, user, unreadCount }: Props) {
  const router = useRouter();
  const admin = isAdmin(profile?.email || user.email);

  // Sync theme from Supabase profile so all devices/sessions stay in sync
  useEffect(() => {
    const serverTheme = profile?.theme_preference;
    if (serverTheme && serverTheme !== "dark") {
      document.documentElement.setAttribute("data-theme", serverTheme);
      localStorage.setItem("qollar-theme", serverTheme);
    }
  }, [profile?.theme_preference]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function toggleLost(pet: Pet) {
    const supabase = createClient();
    const { error } = await supabase
      .from("pets")
      .update({ is_lost: !pet.is_lost })
      .eq("id", pet.id);

    if (error) {
      toast.error("No se pudo actualizar el estado");
    } else {
      toast.success(pet.is_lost ? "Marcado como encontrado" : "Mascota marcada como perdida");
      router.refresh();
    }
  }

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Dueño";

  return (
    <div className="min-h-screen pb-20">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-700/15 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center text-sm">🐾</div>
            <span className="text-lg font-bold gradient-text">Qollar</span>
            {admin && (
              <Link href="/admin">
                <span className="ml-1 text-xs bg-[#FF6B35]/20 text-[#FF6B35] px-2 py-0.5 rounded-full font-semibold hover:bg-[#FF6B35]/30 flex items-center gap-1">
                  <ShieldCheck size={10} />ADMIN
                </span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Points */}
            <Link href="/points" className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 hover:bg-white/8">
              <Star size={14} className="text-yellow-400" />
              <span className="text-sm font-semibold text-white">{profile?.points || 0}</span>
            </Link>

            {/* Notifications */}
            <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF6B35] rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar + Profile link */}
            <Link href="/dashboard/profile" className="hidden sm:flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt={displayName} width={28} height={28} className="rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[color:var(--secondary)] to-[color:var(--primary)] flex items-center justify-center text-white text-xs font-bold">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm text-[#9B8FC0]">{displayName.split(" ")[0]}</span>
            </Link>

            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-8">
        {/* Welcome + points mobile */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Mis mascotas</h1>
            <p className="text-[#9B8FC0] text-sm mt-1">
              {pets.length === 0 ? "Aún no tienes mascotas registradas" : `${pets.length} mascota${pets.length > 1 ? "s" : ""} registrada${pets.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/points" className="sm:hidden flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <Star size={14} className="text-yellow-400" />
              <span className="text-sm font-semibold text-white">{profile?.points || 0} pts</span>
            </Link>
            <Link href="/dashboard/pets/new">
              <Button><Plus size={18} />Agregar mascota</Button>
            </Link>
          </div>
        </motion.div>

        {/* Quick nav cards */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.05 }} className="grid grid-cols-3 gap-3 mb-8">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="glass rounded-2xl p-4 text-center hover:bg-white/8 group cursor-pointer">
                <div className="text-[#9B8FC0] group-hover:text-[#FF6B35] flex justify-center mb-1 transition-colors">
                  {item.icon}
                </div>
                <p className="text-xs text-[#9B8FC0] group-hover:text-white font-medium transition-colors">{item.label}</p>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Empty state */}
        {pets.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-3xl p-12 text-center">
            <div className="text-6xl mb-4">🐾</div>
            <h2 className="text-xl font-semibold text-white mb-2">Registra a tu primera mascota</h2>
            <p className="text-[#9B8FC0] text-sm mb-6 max-w-sm mx-auto">Agrega los datos y genera el QR único para su plaquita</p>
            <Link href="/dashboard/pets/new">
              <Button><Plus size={18} />Registrar mascota</Button>
            </Link>
          </motion.div>
        )}

        {/* Pets grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet, i) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="glass rounded-3xl overflow-hidden group hover:bg-white/8"
            >
              <div className="relative h-48 bg-gradient-to-br from-[#241840] to-[#1A1230]">
                {pet.photos && pet.photos.length > 0 ? (
                  <Image src={pet.photos[0]} alt={pet.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-6xl">
                    {pet.species === "dog" ? "🐶" : pet.species === "cat" ? "🐱" : "🐾"}
                  </div>
                )}
                {pet.is_lost && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">PERDIDO</div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{pet.name}</h3>
                    <p className="text-[#9B8FC0] text-xs">
                      {pet.breed || (pet.species === "dog" ? "Perro" : pet.species === "cat" ? "Gato" : "Mascota")}
                      {pet.age ? ` · ${pet.age} año${pet.age !== 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/pets/${pet.id}`} className="flex-1">
                    <Button variant="ghost" size="sm" fullWidth>
                      <QrCode size={14} />Ver QR
                    </Button>
                  </Link>
                  <button
                    onClick={() => toggleLost(pet)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-colors ${pet.is_lost ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"}`}
                  >
                    {pet.is_lost ? <><CheckCircle size={14} />Encontrado</> : <><AlertCircle size={14} />Perdido</>}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="bottom-nav glass border-t border-white/5 px-6 py-3 safe-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#FF6B35]">
            <span className="text-lg">🐾</span>
            <span className="text-[9px] font-medium">Inicio</span>
          </Link>
          <Link href="/community" className="flex flex-col items-center gap-1 text-[#9B8FC0] hover:text-white">
            <Users size={20} />
            <span className="text-[9px] font-medium">Comunidad</span>
          </Link>
          <Link href="/vet" className="flex flex-col items-center gap-1 text-[#9B8FC0] hover:text-white">
            <Stethoscope size={20} />
            <span className="text-[9px] font-medium">Dr. Qoll</span>
          </Link>
          <Link href="/notifications" className="relative flex flex-col items-center gap-1 text-[#9B8FC0] hover:text-white">
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FF6B35] rounded-full text-white text-[8px] flex items-center justify-center font-bold">{unreadCount}</span>}
            <span className="text-[9px] font-medium">Alertas</span>
          </Link>
          <Link href="/dashboard/profile" className="flex flex-col items-center gap-1 text-[#9B8FC0] hover:text-white">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt={displayName} width={20} height={20} className="rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[color:var(--secondary)] to-[color:var(--primary)] flex items-center justify-center text-white text-[9px] font-bold">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-[9px] font-medium">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
