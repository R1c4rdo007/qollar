"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Pet } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getWhatsAppUrl, formatPhone } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Image from "next/image";
import toast from "react-hot-toast";

interface Props {
  pet: Pet;
}

type State = "idle" | "locating" | "sending" | "sent" | "error";

export default function PetPublicClient({ pet }: Props) {
  const [state, setState] = useState<State>("idle");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const hasSentRef = useRef(false);

  const photos = pet.photos && pet.photos.length > 0 ? pet.photos : [];

  // Auto-trigger location capture on page load
  useEffect(() => {
    if (hasSentRef.current) return;
    hasSentRef.current = true;
    captureAndSend();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function captureAndSend(manualLat?: number, manualLng?: number) {
    setState("locating");

    let lat: number | null = manualLat ?? null;
    let lng: number | null = manualLng ?? null;

    if (!manualLat) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("no-geolocation"));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            maximumAge: 0,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        setLocation({ lat, lng });
      } catch {
        // GPS failed — show manual mode
        setState("idle");
        setManualMode(true);
        return;
      }
    }

    setState("sending");

    try {
      const supabase = createClient();

      // Register scan event
      await supabase.from("scan_events").insert({
        pet_id: pet.id,
        qr_id: pet.qr_id,
        latitude: lat,
        longitude: lng,
        device_info: navigator.userAgent,
      });

      // Notify owner
      await supabase.from("notifications").insert({
        user_id: pet.owner_id,
        type: "pet_found",
        title: `🐾 ¡Alguien encontró a ${pet.name}!`,
        message: lat
          ? `Tu mascota fue encontrada. Ubicación: ${lat?.toFixed(4)}, ${lng?.toFixed(4)}`
          : "Tu mascota fue encontrada. El finder no compartió su ubicación GPS.",
        data: { pet_id: pet.id, lat, lng },
      });

      // Award points to finder if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id !== pet.owner_id) {
        await supabase.rpc("award_points", {
          p_user_id: user.id,
          p_amount: 100,
          p_reason: `Encontraste a ${pet.name} 🏆`,
          p_reference_id: null,
        });
        toast.success("¡Ganaste 100 QollPoints por ayudar! 🎉");
      }

      setState("sent");
    } catch {
      setState("error");
    }
  }

  const whatsappContact = pet.whatsapp || pet.contact_phone;
  const whatsappUrl = whatsappContact
    ? getWhatsAppUrl(
        whatsappContact,
        `Hola! Encontré a ${pet.name} 🐾 Estoy en ${
          location
            ? `https://maps.google.com/?q=${location.lat},${location.lng}`
            : "una ubicación que te enviaré"
        }. ¿Cómo lo puedo devolver?`
      )
    : null;

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-700/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-orange-600/15 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-8">
        {/* Qollar branding */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-lg">🐾</span>
          <span className="text-base font-bold gradient-text">Qollar</span>
        </div>

        {/* Lost badge */}
        {pet.is_lost && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500 text-white text-center font-bold py-3 rounded-2xl mb-4 text-sm flex items-center justify-center gap-2"
          >
            <AlertTriangle size={16} />
            ¡ESTA MASCOTA ESTÁ PERDIDA!
          </motion.div>
        )}

        {/* Pet card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl overflow-hidden mb-4"
        >
          {/* Photos carousel */}
          <div className="relative h-64 bg-gradient-to-br from-[#241840] to-[#1A1230]">
            {photos.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={photoIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={photos[photoIndex]}
                    alt={pet.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-7xl">
                {pet.species === "dog" ? "🐶" : pet.species === "cat" ? "🐱" : "🐾"}
              </div>
            )}

            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))}
                  disabled={photoIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPhotoIndex((i) => Math.min(photos.length - 1, i + 1))}
                  disabled={photoIndex === photos.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIndex(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === photoIndex ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pet info */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-1">{pet.name}</h1>
            <p className="text-[#9B8FC0] text-sm mb-4">
              {pet.breed || (pet.species === "dog" ? "Perro" : pet.species === "cat" ? "Gato" : "Mascota")}
              {pet.color ? ` · ${pet.color}` : ""}
              {pet.age ? ` · ${pet.age} año${pet.age !== 1 ? "s" : ""}` : ""}
            </p>

            {pet.description && (
              <p className="text-[#9B8FC0] text-sm leading-relaxed bg-white/3 rounded-2xl p-4 mb-4">
                {pet.description}
              </p>
            )}

            {pet.reward_description && (
              <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-2xl p-4 mb-4">
                <p className="text-[#FF6B35] text-sm font-semibold">🎁 {pet.reward_description}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Alert status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-5 mb-4"
        >
          <AnimatePresence mode="wait">
            {state === "idle" && !manualMode && (
              <motion.div key="idle" className="flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-[#9B8FC0]" />
                <p className="text-[#9B8FC0] text-sm">Obteniendo tu ubicación...</p>
              </motion.div>
            )}

            {state === "locating" && (
              <motion.div key="locating" className="flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-[#FF6B35]" />
                <p className="text-white text-sm font-medium">
                  Capturando tu ubicación GPS...
                </p>
              </motion.div>
            )}

            {state === "sending" && (
              <motion.div key="sending" className="flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-[#7C3AED]" />
                <p className="text-white text-sm font-medium">
                  Enviando alerta al dueño...
                </p>
              </motion.div>
            )}

            {state === "sent" && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <CheckCircle2 size={40} className="text-[#10B981] mx-auto mb-2" />
                <p className="text-[#10B981] font-bold text-lg">¡Alerta enviada!</p>
                <p className="text-[#9B8FC0] text-sm mt-1">
                  El dueño de {pet.name} fue notificado con tu ubicación.{" "}
                  {location && (
                    <a
                      href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF6B35] underline"
                    >
                      Ver tu ubicación en el mapa
                    </a>
                  )}
                </p>
              </motion.div>
            )}

            {state === "error" && (
              <motion.div key="error" className="text-center">
                <p className="text-red-400 font-medium text-sm mb-2">
                  No pudimos enviar la alerta automáticamente.
                </p>
                <Button
                  size="sm"
                  onClick={() => captureAndSend()}
                  variant="ghost"
                >
                  Reintentar
                </Button>
              </motion.div>
            )}

            {manualMode && state === "idle" && (
              <motion.div
                key="manual"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <MapPin size={24} className="text-[#9B8FC0] mx-auto mb-2" />
                <p className="text-[#9B8FC0] text-sm mb-3">
                  No pudimos obtener tu GPS automáticamente.
                  Usa WhatsApp para compartir tu ubicación manualmente.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Contact buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button fullWidth size="lg" variant="secondary">
                <MessageCircle size={20} />
                Avisar por WhatsApp
              </Button>
            </a>
          )}

          {pet.contact_phone && (
            <a href={`tel:${formatPhone(pet.contact_phone)}`}>
              <Button fullWidth size="lg" variant="ghost">
                <Phone size={20} />
                Llamar al dueño
              </Button>
            </a>
          )}
        </motion.div>

        {/* Powered by Qollar */}
        <p className="text-center text-[#9B8FC0] text-xs mt-8">
          Protegido por{" "}
          <a href="/" className="text-[#FF6B35] hover:underline">
            Qollar
          </a>{" "}
          · Perú 🇵🇪
        </p>
      </div>
    </main>
  );
}
