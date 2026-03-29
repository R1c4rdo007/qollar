"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Download, Share2, MapPin, Clock, Trash2, Pencil,
  Syringe, Heart, CheckCircle2, Circle, Phone, MapPinned, QrCode, Unlink, Tag
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Pet, ScanEvent, Vaccine } from "@/types";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import Image from "next/image";

interface Props {
  pet: Pet;
  scanEvents: ScanEvent[];
  vaccines: Vaccine[];
  linkedPlate: { id: string; plate_code: string } | null;
}

export default function PetDetailClient({ pet, scanEvents, vaccines: initialVaccines, linkedPlate }: Props) {
  const router = useRouter();
  const plateUrl = linkedPlate
    ? `${typeof window !== "undefined" ? window.location.origin : "https://qollar-six.vercel.app"}/activate/${linkedPlate.plate_code}`
    : null;
  const [vaccines, setVaccines] = useState<Vaccine[]>(initialVaccines);
  const [unlinkLoading, setUnlinkLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Estás seguro de eliminar a ${pet.name}? Esta acción no se puede deshacer.`)) return;

    const supabase = createClient();
    const { error } = await supabase.from("pets").delete().eq("id", pet.id);
    if (error) {
      toast.error("No se pudo eliminar la mascota");
    } else {
      toast.success(`${pet.name} fue eliminado`);
      router.push("/dashboard");
      router.refresh();
    }
  }

  function handleShare() {
    const url = plateUrl || window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Perfil de ${pet.name} - Qollar`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Enlace copiado al portapapeles");
    }
  }

  function handleDownloadQR() {
    const svg = document.getElementById("pet-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement("a");
      a.download = `qollar-${pet.name}-${linkedPlate?.plate_code || "qr"}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
    toast.success("QR descargado");
  }

  async function handleUnlinkPlate() {
    if (!linkedPlate) return;
    if (!confirm(`¿Desvincular la plaquita ${linkedPlate.plate_code} de ${pet.name}? La plaquita física quedará disponible nuevamente.`)) return;
    setUnlinkLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("qr_plates").update({
      pet_id: null,
      status: "inactive",
      activated_at: null,
    }).eq("id", linkedPlate.id);
    if (error) {
      toast.error("No se pudo desvincular la plaquita");
    } else {
      toast.success("Plaquita desvinculada. Puedes vincular otra cuando quieras.");
      router.refresh();
    }
    setUnlinkLoading(false);
  }

  async function toggleVaccineGiven(vaccine: Vaccine) {
    const supabase = createClient();
    const newValue = !vaccine.is_given;
    const { error } = await supabase
      .from("vaccines")
      .update({ is_given: newValue })
      .eq("id", vaccine.id);

    if (error) {
      toast.error("No se pudo actualizar la vacuna");
    } else {
      setVaccines((prev) =>
        prev.map((v) => v.id === vaccine.id ? { ...v, is_given: newValue } : v)
      );
      toast.success(newValue ? "Vacuna marcada como aplicada" : "Vacuna marcada como pendiente");
    }
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-700/15 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/dashboard">
            <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-white">{pet.name}</h1>
            {linkedPlate && <p className="text-xs text-[#9B8FC0] font-mono">{linkedPlate.plate_code}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl hover:bg-red-500/10 text-[#9B8FC0] hover:text-red-400"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass rounded-3xl p-6 text-center ${linkedPlate ? "glow-orange" : ""}`}
          >
            {linkedPlate && plateUrl ? (
              <>
                <h2 className="text-sm font-medium text-[#9B8FC0] mb-1">QR de {pet.name}</h2>
                <p className="text-xs font-mono text-[#FF6B35] mb-4">{linkedPlate.plate_code}</p>
                <div className="bg-white rounded-2xl p-4 inline-block mb-4">
                  <QRCodeSVG
                    id="pet-qr-svg"
                    value={plateUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-xs text-[#9B8FC0] mb-4 break-all font-mono">{plateUrl}</p>
                <div className="flex gap-3">
                  <Button onClick={handleDownloadQR} variant="ghost" size="sm" fullWidth>
                    <Download size={14} />
                    Descargar QR
                  </Button>
                  <Button onClick={handleShare} variant="secondary" size="sm" fullWidth>
                    <Share2 size={14} />
                    Compartir
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Tag size={28} className="text-[#9B8FC0]" />
                </div>
                <h2 className="font-semibold text-white mb-2">Sin plaquita vinculada</h2>
                <p className="text-xs text-[#9B8FC0] mb-5">
                  Vincula una plaquita QR física para que cualquier persona pueda contactarte si encuentra a {pet.name}.
                </p>
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm" fullWidth>
                    <QrCode size={14} />
                    Ir a Mis mascotas para vincular
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Pet info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* Photo */}
            <div className="glass rounded-3xl overflow-hidden h-48 relative">
              {pet.photos && pet.photos.length > 0 ? (
                <Image src={pet.photos[0]} alt={pet.name} fill className="object-cover" sizes="(max-width: 896px) 100vw, 448px" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-6xl">
                  {pet.species === "dog" ? "🐶" : pet.species === "cat" ? "🐱" : "🐾"}
                </div>
              )}
              {pet.is_lost && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  PERDIDO
                </div>
              )}
            </div>

            {/* Details */}
            <div className="glass rounded-3xl p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-[#9B8FC0] text-sm">Nombre</span>
                <span className="text-white text-sm font-medium">{pet.name}</span>
              </div>
              {pet.breed && (
                <div className="flex justify-between">
                  <span className="text-[#9B8FC0] text-sm">Raza</span>
                  <span className="text-white text-sm">{pet.breed}</span>
                </div>
              )}
              {pet.color && (
                <div className="flex justify-between">
                  <span className="text-[#9B8FC0] text-sm">Color</span>
                  <span className="text-white text-sm">{pet.color}</span>
                </div>
              )}
              {pet.age != null && (
                <div className="flex justify-between">
                  <span className="text-[#9B8FC0] text-sm">Edad</span>
                  <span className="text-white text-sm">{pet.age} año{pet.age !== 1 ? "s" : ""}</span>
                </div>
              )}
              {pet.contact_phone && (
                <div className="flex justify-between">
                  <span className="text-[#9B8FC0] text-sm">Contacto</span>
                  <span className="text-white text-sm">{pet.contact_phone}</span>
                </div>
              )}
              {pet.usual_location && (
                <div className="flex justify-between gap-4">
                  <span className="text-[#9B8FC0] text-sm">Zona habitual</span>
                  <span className="text-white text-sm text-right">{pet.usual_location}</span>
                </div>
              )}
            </div>

            <Link href={`/dashboard/pets/${pet.id}/edit`}>
              <Button variant="ghost" fullWidth>
                <Pencil size={14} />
                Editar información
              </Button>
            </Link>

            {linkedPlate && (
              <button
                onClick={handleUnlinkPlate}
                disabled={unlinkLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-amber-500/8 border border-amber-500/15 text-amber-400 text-sm hover:bg-amber-500/15 disabled:opacity-50 transition-colors"
              >
                <Unlink size={14} />
                Desvincular plaquita {linkedPlate.plate_code}
              </button>
            )}
          </motion.div>
        </div>

        {/* Health info */}
        {(pet.is_sterilized || pet.is_dewormed || pet.allergies || pet.conditions || pet.special_diet || pet.vet_name || pet.personality_notes) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 glass rounded-3xl p-6"
          >
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Heart size={16} className="text-[#FF6B35]" />
              Información de Salud
            </h2>
            <div className="space-y-3">
              <div className="flex gap-3 flex-wrap">
                <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl ${pet.is_sterilized ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-[#9B8FC0]"}`}>
                  {pet.is_sterilized ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                  Esterilizado/a
                </span>
                <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl ${pet.is_dewormed ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-[#9B8FC0]"}`}>
                  {pet.is_dewormed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                  Desparasitado/a
                </span>
              </div>
              {pet.allergies && (
                <div className="bg-white/3 rounded-2xl p-3">
                  <p className="text-xs text-[#9B8FC0] mb-1">Alergias</p>
                  <p className="text-sm text-[#F8F4FF]">{pet.allergies}</p>
                </div>
              )}
              {pet.conditions && (
                <div className="bg-white/3 rounded-2xl p-3">
                  <p className="text-xs text-[#9B8FC0] mb-1">Condiciones de salud</p>
                  <p className="text-sm text-[#F8F4FF]">{pet.conditions}</p>
                </div>
              )}
              {pet.special_diet && (
                <div className="bg-white/3 rounded-2xl p-3">
                  <p className="text-xs text-[#9B8FC0] mb-1">Alimentación especial</p>
                  <p className="text-sm text-[#F8F4FF]">{pet.special_diet}</p>
                </div>
              )}
              {pet.personality_notes && (
                <div className="bg-white/3 rounded-2xl p-3">
                  <p className="text-xs text-[#9B8FC0] mb-1">Personalidad</p>
                  <p className="text-sm text-[#F8F4FF]">{pet.personality_notes}</p>
                </div>
              )}
              {(pet.vet_name || pet.vet_phone) && (
                <div className="bg-white/3 rounded-2xl p-3 flex items-center gap-3">
                  <Phone size={14} className="text-[#FF6B35] flex-shrink-0" />
                  <div>
                    {pet.vet_name && <p className="text-sm text-white font-medium">{pet.vet_name}</p>}
                    {pet.vet_phone && <p className="text-xs text-[#9B8FC0]">{pet.vet_phone}</p>}
                  </div>
                  <span className="ml-auto text-xs text-[#9B8FC0]">Veterinario</span>
                </div>
              )}
              {pet.usual_location && (
                <div className="bg-white/3 rounded-2xl p-3 flex items-center gap-3">
                  <MapPinned size={14} className="text-[#FF6B35] flex-shrink-0" />
                  <p className="text-sm text-[#F8F4FF]">{pet.usual_location}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Vaccines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 glass rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Syringe size={16} className="text-[#FF6B35]" />
              Vacunas ({vaccines.length})
            </h2>
            <Link href={`/dashboard/pets/${pet.id}/edit`}>
              <button className="text-xs text-[#FF6B35] hover:underline">+ Agregar</button>
            </Link>
          </div>
          {vaccines.length === 0 ? (
            <p className="text-[#9B8FC0] text-sm text-center py-6">
              Sin vacunas registradas. <Link href={`/dashboard/pets/${pet.id}/edit`} className="text-[#FF6B35] hover:underline">Agrega una →</Link>
            </p>
          ) : (
            <div className="space-y-3">
              {vaccines.map((vaccine) => {
                const isDue = vaccine.next_due_date && !vaccine.is_given &&
                  new Date(vaccine.next_due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                return (
                  <div
                    key={vaccine.id}
                    className={`flex items-center gap-3 rounded-2xl p-4 ${isDue ? "bg-amber-500/8 border border-amber-500/20" : "bg-white/3"}`}
                  >
                    <button
                      onClick={() => toggleVaccineGiven(vaccine)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${vaccine.is_given ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" : "bg-white/5 text-[#9B8FC0] hover:bg-white/10"}`}
                    >
                      {vaccine.is_given ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{vaccine.name}</p>
                      <div className="flex items-center gap-2 text-xs text-[#9B8FC0] mt-0.5 flex-wrap">
                        {vaccine.date_given && (
                          <span>Aplicada: {new Date(vaccine.date_given).toLocaleDateString("es-PE")}</span>
                        )}
                        {vaccine.next_due_date && (
                          <span className={isDue ? "text-amber-400 font-medium" : ""}>
                            Próxima: {new Date(vaccine.next_due_date).toLocaleDateString("es-PE")}
                            {isDue && " ⚠️"}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${vaccine.is_given ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-[#9B8FC0]"}`}>
                      {vaccine.is_given ? "Aplicada" : "Pendiente"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Scan history */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 glass rounded-3xl p-6"
        >
          <h2 className="font-semibold text-white mb-4">
            Historial de escaneos ({scanEvents.length})
          </h2>
          {scanEvents.length === 0 ? (
            <p className="text-[#9B8FC0] text-sm text-center py-6">
              Aún nadie ha escaneado el QR de {pet.name}
            </p>
          ) : (
            <div className="space-y-3">
              {scanEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 bg-white/3 rounded-2xl p-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35] flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">
                      {event.latitude && event.longitude
                        ? `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`
                        : "Ubicación no disponible"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-[#9B8FC0]">
                      <Clock size={12} />
                      {new Date(event.created_at).toLocaleString("es-PE")}
                    </div>
                  </div>
                  {event.latitude && event.longitude && (
                    <a
                      href={`https://maps.google.com/?q=${event.latitude},${event.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#FF6B35] hover:underline"
                    >
                      Ver mapa
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
