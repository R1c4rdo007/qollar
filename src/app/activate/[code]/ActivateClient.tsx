"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, QrCode, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { POINTS } from "@/lib/config";
import Button from "@/components/ui/Button";
import PwaOpenBanner from "@/components/PwaOpenBanner";
import toast from "react-hot-toast";

interface Pet {
  id: string;
  name: string;
  species: string;
  photos: string[];
}

interface Plate {
  id: string;
  plate_code: string;
  status: string;
  pet_id: string | null;
}

interface Props {
  plateCode: string;
  plate: Plate | null;
  pets: Pet[];
  userId: string;
}

export default function ActivateClient({ plateCode, plate, pets, userId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  // Plate doesn't exist in DB
  if (!plate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-red-700/15 blur-[100px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 text-center max-w-sm w-full relative z-10"
        >
          <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Código no válido</h1>
          <p className="text-[#9B8FC0] text-sm mb-6">
            El código <span className="font-mono text-white">{plateCode}</span> no
            corresponde a ninguna plaquita Qollar registrada.
          </p>
          <Link href="/dashboard">
            <Button fullWidth variant="ghost">Ir al inicio</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Active plates are handled server-side (redirect to /pet/[qr_id])
  // This state should not be reached normally

  async function handleActivate() {
    if (!selectedPetId) {
      toast.error("Selecciona una mascota primero");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    try {
      // Update plate status
      const { error: plateError } = await supabase
        .from("qr_plates")
        .update({
          status: "active",
          pet_id: selectedPetId,
          activated_at: new Date().toISOString(),
        })
        .eq("plate_code", plateCode);

      if (plateError) throw plateError;

      // Award points for activation
      await supabase.rpc("award_points", {
        p_user_id: userId,
        p_amount: POINTS.ADD_PET,
        p_reason: "Activación de plaquita QR",
        p_reference_id: null,
      });

      // Create welcome notification
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "pet_found",
        title: "🏷️ ¡Plaquita activada!",
        message: `La plaquita ${plateCode} fue vinculada correctamente a tu mascota.`,
        data: { plate_code: plateCode },
      });

      toast.success("¡Plaquita activada correctamente!");
      router.push(`/pet/${plateCode}`);
      router.refresh();
    } catch {
      toast.error("Error al activar la plaquita. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <main className="min-h-screen relative overflow-hidden">
      <PwaOpenBanner targetUrl={currentUrl} />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-orange-600/15 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-purple-700/15 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg glow-orange">
            🏷️
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Activar plaquita</h1>
          <p className="text-[#9B8FC0] text-sm">
            Código: <span className="font-mono text-white font-bold">{plateCode}</span>
          </p>
        </div>

        <div className="glass rounded-3xl p-6 mb-6">
          <h2 className="font-semibold text-white mb-1">¿A qué mascota vinculas esta plaquita?</h2>
          <p className="text-[#9B8FC0] text-xs mb-5">
            Selecciona una mascota de tu cuenta. El QR de la plaquita quedará vinculado a ella.
          </p>

          {pets.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[#9B8FC0] text-sm mb-4">
                Aún no tienes mascotas registradas.
                <br />Primero crea el perfil de tu mascota.
              </p>
              <Link href={`/dashboard/pets/new?next=/activate/${plateCode}`}>
                <Button variant="secondary" fullWidth>
                  <Plus size={16} />
                  Registrar mascota primero
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => setSelectedPetId(pet.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    selectedPetId === pet.id
                      ? "bg-[#FF6B35]/15 border-[#FF6B35]/50 glow-orange"
                      : "bg-white/3 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center text-2xl">
                    {pet.photos?.[0] ? (
                      <Image
                        src={pet.photos[0]}
                        alt={pet.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      pet.species === "dog" ? "🐶" : pet.species === "cat" ? "🐱" : "🐾"
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-white">{pet.name}</p>
                    <p className="text-xs text-[#9B8FC0]">
                      {pet.species === "dog" ? "Perro" : pet.species === "cat" ? "Gato" : "Mascota"}
                    </p>
                  </div>
                  {selectedPetId === pet.id && (
                    <CheckCircle2 size={20} className="text-[#FF6B35]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {pets.length > 0 && (
          <Button
            onClick={handleActivate}
            loading={loading}
            disabled={!selectedPetId}
            fullWidth
            size="lg"
          >
            <QrCode size={18} />
            Activar plaquita
          </Button>
        )}

        <p className="text-center text-[#9B8FC0] text-xs mt-4">
          Al activar, esta plaquita queda vinculada permanentemente a la mascota seleccionada.
        </p>
      </div>
    </main>
  );
}
