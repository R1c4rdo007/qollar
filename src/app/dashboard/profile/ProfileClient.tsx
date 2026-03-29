"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Camera, User, Phone, Calendar, FileText,
  Settings, Save, Bell, Star, Users, Stethoscope
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";

interface Props {
  profile: Profile | null;
  userId: string;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
  { value: "other", label: "Otro" },
];

export default function ProfileClient({ profile, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    age: profile?.age?.toString() || "",
    gender: profile?.gender || "",
    bio: profile?.bio || "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `avatars/${userId}/${uuidv4()}.${ext}`;
    const { error } = await supabase.storage.from("pet-photos").upload(path, file, { upsert: true });
    if (error) {
      toast.error("No se pudo subir la foto");
    } else {
      const { data } = supabase.storage.from("pet-photos").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      // Save immediately
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
      toast.success("Foto actualizada");
    }
    setAvatarUploading(false);
    e.target.value = "";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error("El nombre es requerido"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      phone: form.phone || null,
      age: form.age ? parseInt(form.age) : null,
      gender: (form.gender as Profile["gender"]) || null,
      bio: form.bio || null,
    }).eq("id", userId);

    if (error) {
      toast.error("Error al guardar");
    } else {
      toast.success("Perfil actualizado");
    }
    setLoading(false);
  }

  const displayName = form.full_name || profile?.email?.split("@")[0] || "Usuario";
  const initials = displayName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen pb-24">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-700/15 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="glass border-b border-white/5 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="font-bold text-white">Mi perfil</h1>
              <p className="text-xs text-[#9B8FC0]">Datos de tu cuenta</p>
            </div>
          </div>
          <Link href="/dashboard/settings/theme">
            <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-[color:var(--primary)] transition-colors" title="Paleta de colores">
              <Settings size={20} />
            </button>
          </Link>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-6 py-6">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="glass rounded-3xl p-6"
          >
            <h2 className="font-semibold text-white flex items-center gap-2 mb-5">
              <User size={16} className="text-[color:var(--primary)]" />
              Foto de perfil
            </h2>
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[color:var(--secondary)] to-[color:var(--primary)] flex items-center justify-center text-white font-bold text-2xl">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-[color:var(--primary)] rounded-full flex items-center justify-center text-white shadow-lg"
                >
                  {avatarUploading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera size={13} />
                  )}
                </button>
              </div>
              <div>
                <p className="font-semibold text-white">{displayName}</p>
                <p className="text-xs text-[#9B8FC0] mt-0.5">{profile?.email}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs text-[color:var(--primary)] hover:underline"
                >
                  Cambiar foto
                </button>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </motion.div>

          {/* Personal info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: 0.04 }}
            className="glass rounded-3xl p-6 space-y-5"
          >
            <h2 className="font-semibold text-white flex items-center gap-2">
              <FileText size={16} className="text-[color:var(--primary)]" />
              Información personal
            </h2>
            <Input
              label="Nombre completo *"
              placeholder="Ej. Carlos Mendoza"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              icon={<User size={16} />}
              required
            />
            <Input
              label="Teléfono"
              type="tel"
              placeholder="Ej. 987654321"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              icon={<Phone size={16} />}
              hint="Se usará como contacto por defecto en tus mascotas"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Edad"
                type="number"
                min="1"
                max="120"
                placeholder="Ej. 28"
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                icon={<Calendar size={16} />}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#9B8FC0]">Género</label>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] focus:border-[color:var(--primary)]/60 focus:outline-none"
                >
                  <option value="">No especificar</option>
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#9B8FC0]">Sobre mí</label>
              <textarea
                placeholder="Cuéntanos algo sobre ti y tus mascotas..."
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                rows={3}
                maxLength={300}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] placeholder-[#9B8FC0]/60 focus:border-[color:var(--primary)]/60 resize-none focus:outline-none"
              />
              <span className="text-xs text-[#9B8FC0]/60 text-right">{form.bio.length}/300</span>
            </div>
          </motion.div>

          {/* Theme shortcut */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: 0.08 }}
          >
            <Link href="/dashboard/settings/theme">
              <div className="glass rounded-3xl p-5 flex items-center justify-between group hover:bg-white/8 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[color:var(--primary)]/15 flex items-center justify-center">
                    <Settings size={18} className="text-[color:var(--primary)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">Paleta de colores</p>
                    <p className="text-xs text-[#9B8FC0]">Personaliza el tema de la app</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {["#FF6B35","#10B981","#EC4899","#00D4FF","#60A5FA"].map((c) => (
                    <div key={c} className="w-4 h-4 rounded-full border border-white/10" style={{ background: c }} />
                  ))}
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: 0.1 }}
          >
            <Button type="submit" loading={loading} fullWidth size="lg">
              <Save size={18} />
              Guardar cambios
            </Button>
          </motion.div>
        </form>
      </main>

      {/* Bottom nav */}
      <nav className="bottom-nav glass border-t border-white/5 px-6 py-3 safe-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#9B8FC0] hover:text-white">
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
          <Link href="/notifications" className="flex flex-col items-center gap-1 text-[#9B8FC0] hover:text-white">
            <Bell size={20} />
            <span className="text-[9px] font-medium">Alertas</span>
          </Link>
          <Link href="/points" className="flex flex-col items-center gap-1 text-[#9B8FC0] hover:text-white">
            <Star size={20} />
            <span className="text-[9px] font-medium">Puntos</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
