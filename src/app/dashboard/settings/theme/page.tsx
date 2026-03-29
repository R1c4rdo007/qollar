"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Settings } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const THEMES = [
  {
    id: "dark",
    name: "Oscuro",
    description: "Morado profundo + naranja vibrante",
    bg: "#0F0A1E",
    surface: "#241840",
    primary: "#FF6B35",
    secondary: "#9F67FF",
    text: "#F8F4FF",
  },
  {
    id: "light",
    name: "Claro",
    description: "Azul slate + azul brillante",
    bg: "#1C1C2E",
    surface: "#2E2E5A",
    primary: "#60A5FA",
    secondary: "#A5B4FC",
    text: "#EEF0FF",
  },
  {
    id: "forest",
    name: "Bosque",
    description: "Verde oscuro + esmeralda",
    bg: "#061410",
    surface: "#112B22",
    primary: "#10B981",
    secondary: "#2DD4BF",
    text: "#ECFDF5",
  },
  {
    id: "rose",
    name: "Rosado",
    description: "Ciruela oscuro + rosa magenta",
    bg: "#120810",
    surface: "#280E22",
    primary: "#EC4899",
    secondary: "#A78BFA",
    text: "#FDF4FF",
  },
  {
    id: "contrast",
    name: "Contraste",
    description: "Negro puro + azul eléctrico",
    bg: "#000000",
    surface: "#141414",
    primary: "#00D4FF",
    secondary: "#C084FC",
    text: "#FFFFFF",
  },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

export default function ThemePage() {
  const [selected, setSelected] = useState<ThemeId>("dark");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("qollar-theme") as ThemeId | null;
    if (saved) setSelected(saved);
  }, []);

  async function applyTheme(themeId: ThemeId) {
    setSelected(themeId);
    // Apply immediately
    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem("qollar-theme", themeId);

    // Persist to Supabase
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ theme_preference: themeId }).eq("id", user.id);
      }
      toast.success("Tema aplicado");
    } catch {
      // Non-critical
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-700/15 blur-[100px]" />
      </div>

      <header className="glass border-b border-white/5 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard/profile">
            <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="font-bold text-white flex items-center gap-2">
              <Settings size={16} className="text-[color:var(--primary)]" />
              Paleta de colores
            </h1>
            <p className="text-xs text-[#9B8FC0]">Personaliza el aspecto de la app</p>
          </div>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-6 py-8">
        <p className="text-[#9B8FC0] text-sm mb-6">
          Elige la paleta que más te guste. El cambio se aplica al instante y se guarda para todos tus dispositivos.
        </p>

        <div className="space-y-4">
          {THEMES.map((theme, i) => (
            <motion.button
              key={theme.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: i * 0.04 }}
              onClick={() => applyTheme(theme.id)}
              disabled={saving}
              className={`w-full text-left glass rounded-3xl p-5 border-2 transition-all ${
                selected === theme.id
                  ? "border-[color:var(--primary)] bg-white/8"
                  : "border-transparent hover:border-white/15"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Color preview */}
                <div
                  className="w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden relative"
                  style={{ background: theme.bg }}
                >
                  {/* Surface card mock */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-8 flex items-center px-2 gap-1"
                    style={{ background: theme.surface + "CC" }}
                  >
                    <div className="w-3 h-2 rounded-sm" style={{ background: theme.primary }} />
                    <div className="w-3 h-2 rounded-sm" style={{ background: theme.secondary }} />
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: theme.text + "40" }} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{theme.name}</p>
                    {selected === theme.id && (
                      <span className="flex items-center gap-1 text-xs text-[color:var(--primary)] font-medium">
                        <Check size={12} />Activo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9B8FC0] mt-0.5">{theme.description}</p>
                  {/* Color dots */}
                  <div className="flex gap-1.5 mt-2">
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ background: theme.bg }} />
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ background: theme.surface }} />
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ background: theme.primary }} />
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ background: theme.secondary }} />
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ background: theme.text + "99" }} />
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected === theme.id
                    ? "border-[color:var(--primary)] bg-[color:var(--primary)]"
                    : "border-white/20"
                }`}>
                  {selected === theme.id && <Check size={12} className="text-white" />}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
