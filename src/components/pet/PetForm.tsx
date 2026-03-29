"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Upload, X, ChevronLeft, ChevronRight,
  Plus, Trash2, CheckCircle2, Circle, Syringe, Heart,
  Camera, FileText, PawPrint, QrCode, CheckCircle, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import QRScanner from "@/components/QRScanner";
import toast from "react-hot-toast";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";

interface PetFormProps {
  userId: string;
  ownerPhone?: string;
  ownerName?: string;
}

type Species = "dog" | "cat" | "other";
type TabId = "basico" | "salud" | "vacunas" | "galeria" | "resena";

interface VaccineEntry {
  id: string;
  name: string;
  date_given: string;
  next_due_date: string;
  is_given: boolean;
  notes: string;
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "basico", label: "Básico", icon: <PawPrint size={14} /> },
  { id: "salud", label: "Salud", icon: <Heart size={14} /> },
  { id: "vacunas", label: "Vacunas", icon: <Syringe size={14} /> },
  { id: "galeria", label: "Galería", icon: <Camera size={14} /> },
  { id: "resena", label: "Reseña", icon: <FileText size={14} /> },
];

const speciesOptions: { value: Species; emoji: string; label: string }[] = [
  { value: "dog", emoji: "🐶", label: "Perro" },
  { value: "cat", emoji: "🐱", label: "Gato" },
  { value: "other", emoji: "🐾", label: "Otro" },
];

export default function PetForm({ userId, ownerPhone = "", ownerName = "" }: PetFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("basico");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [vaccines, setVaccines] = useState<VaccineEntry[]>([]);
  const [createdPet, setCreatedPet] = useState<{ id: string; name: string } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [linkingPlate, setLinkingPlate] = useState(false);

  const [form, setForm] = useState({
    // Básico
    name: "",
    species: "dog" as Species,
    breed: "",
    color: "",
    age: "",
    usual_location: "",
    // Salud
    allergies: "",
    conditions: "",
    is_sterilized: false,
    is_dewormed: false,
    special_diet: "",
    vet_name: "",
    vet_phone: "",
    // Reseña / contacto — pre-filled from owner profile
    description: "",
    personality_notes: "",
    contact_phone: ownerPhone,
    whatsapp: ownerPhone,
    reward_description: "",
  });

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (photoPreviews.length + files.length > 5) {
      toast.error("Máximo 5 fotos");
      return;
    }
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    setPhotoFiles((prev) => [...prev, ...files]);
  }

  function removePhoto(index: number) {
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    if (photoIndex >= photoPreviews.length - 1) setPhotoIndex(0);
  }

  function addVaccine() {
    setVaccines((prev) => [...prev, {
      id: uuidv4(),
      name: "",
      date_given: "",
      next_due_date: "",
      is_given: false,
      notes: "",
    }]);
  }

  function updateVaccine(id: string, field: string, value: string | boolean) {
    setVaccines((prev) => prev.map((v) => v.id === id ? { ...v, [field]: value } : v));
  }

  function removeVaccine(id: string) {
    setVaccines((prev) => prev.filter((v) => v.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("El nombre de la mascota es requerido");
      setActiveTab("basico");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // Upload photos
      const uploadedUrls: string[] = [];
      for (const file of photoFiles) {
        const ext = file.name.split(".").pop();
        const path = `${userId}/${uuidv4()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("pet-photos")
          .upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("pet-photos").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      // Create pet
      const { data: newPet, error } = await supabase.from("pets").insert({
        owner_id: userId,
        name: form.name.trim(),
        species: form.species,
        breed: form.breed || null,
        color: form.color || null,
        age: form.age ? parseInt(form.age) : null,
        description: form.description || null,
        photos: uploadedUrls,
        contact_phone: form.contact_phone || null,
        whatsapp: form.whatsapp || form.contact_phone || null,
        reward_description: form.reward_description || null,
        allergies: form.allergies || null,
        conditions: form.conditions || null,
        is_sterilized: form.is_sterilized,
        is_dewormed: form.is_dewormed,
        special_diet: form.special_diet || null,
        vet_name: form.vet_name || null,
        vet_phone: form.vet_phone || null,
        personality_notes: form.personality_notes || null,
        usual_location: form.usual_location || null,
      }).select().single();

      if (error) throw error;

      // Insert vaccines
      const validVaccines = vaccines.filter((v) => v.name.trim());
      if (validVaccines.length > 0 && newPet) {
        await supabase.from("vaccines").insert(
          validVaccines.map((v) => ({
            pet_id: newPet.id,
            name: v.name.trim(),
            date_given: v.date_given || null,
            next_due_date: v.next_due_date || null,
            is_given: v.is_given,
            notes: v.notes || null,
          }))
        );
      }

      // Award points
      await supabase.rpc("award_points", {
        p_user_id: userId,
        p_amount: 20,
        p_reason: `Registraste a ${form.name} 🐾`,
        p_reference_id: null,
      });

      // Show success + plate linking screen
      setCreatedPet({ id: newPet.id, name: form.name.trim() });
    } catch {
      toast.error("Hubo un error al guardar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePlateScanned(qrValue: string) {
    setShowScanner(false);
    if (!createdPet) return;

    // Extract plate code from Qollar QR URL or raw code
    let plateCode = qrValue.trim();
    if (qrValue.includes("/pet/")) {
      plateCode = qrValue.split("/pet/")[1].split("?")[0].trim();
    }

    if (!plateCode) {
      toast.error("QR inválido, intenta de nuevo");
      return;
    }

    setLinkingPlate(true);
    const supabase = createClient();

    const { data: plate, error: findError } = await supabase
      .from("qr_plates")
      .select("id, status")
      .eq("plate_code", plateCode)
      .single();

    if (findError || !plate) {
      toast.error("Plaquita no encontrada. Verifica el código.");
      setLinkingPlate(false);
      return;
    }

    if (plate.status === "active") {
      toast.error("Esta plaquita ya está vinculada a otra mascota.");
      setLinkingPlate(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("qr_plates")
      .update({
        pet_id: createdPet.id,
        status: "active",
        activated_at: new Date().toISOString(),
      })
      .eq("id", plate.id);

    if (updateError) {
      toast.error("Error al vincular la plaquita. Intenta de nuevo.");
      setLinkingPlate(false);
      return;
    }

    toast.success(`¡Plaquita vinculada a ${createdPet.name}! 🎉`);
    router.push("/dashboard");
    router.refresh();
  }

  const ToggleSwitch = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#F8F4FF]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors ${value ? "bg-[#FF6B35]" : "bg-white/15"}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${value ? "translate-x-7" : "translate-x-1"}`} />
      </button>
    </div>
  );

  // QR Scanner overlay
  if (showScanner) {
    return (
      <QRScanner
        onScan={handlePlateScanned}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  // Post-creation success screen
  if (createdPet) {
    return (
      <div className="min-h-screen relative z-10 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 15 }}
            className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle size={40} className="text-emerald-400" />
          </motion.div>

          <h1 className="text-2xl font-black text-white mb-2">
            ¡{createdPet.name} fue registrado!
          </h1>
          <p className="text-[#9B8FC0] mb-2">+20 puntos ganados 🎉</p>
          <p className="text-[#9B8FC0] text-sm mb-8">
            Ya tienes el perfil de tu mascota listo. Ahora puedes vincularle una plaquita QR física.
          </p>

          <div className="glass rounded-3xl p-5 mb-4 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/15 flex items-center justify-center">
                <QrCode size={20} className="text-[#FF6B35]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Vincular plaquita QR</p>
                <p className="text-[#9B8FC0] text-xs">Escanea el QR de la plaquita física</p>
              </div>
            </div>
            <p className="text-[#9B8FC0] text-xs mb-4">
              Si tienes una plaquita Qollar, escanea el código QR ahora para vincularla a {createdPet.name}. Cualquier persona que la encuentre podrá contactarte al instante.
            </p>
            <Button
              fullWidth
              onClick={() => setShowScanner(true)}
              loading={linkingPlate}
            >
              <QrCode size={16} />
              Escanear y vincular plaquita
            </Button>
          </div>

          <button
            onClick={() => { router.push("/dashboard"); router.refresh(); }}
            className="w-full flex items-center justify-center gap-2 py-3 text-[#9B8FC0] hover:text-white text-sm transition-colors"
          >
            Saltar por ahora
            <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      <header className="glass border-b border-white/5 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard">
            <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="font-bold text-white">Registrar mascota</h1>
            <p className="text-xs text-[#9B8FC0]">Genera su QR único</p>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="sticky top-[57px] z-10 glass border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex overflow-x-auto no-scrollbar py-3 gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-[#FF6B35] text-white"
                    : "bg-white/5 text-[#9B8FC0] hover:bg-white/10"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 py-6">
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {/* TAB: BÁSICO */}
            {activeTab === "basico" && (
              <motion.div key="basico" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="glass rounded-3xl p-6 space-y-5">
                  <h2 className="font-semibold text-white flex items-center gap-2"><PawPrint size={16} className="text-[#FF6B35]" />Datos básicos</h2>
                  <div>
                    <label className="text-sm font-medium text-[#9B8FC0] block mb-2">Tipo de mascota</label>
                    <div className="flex gap-3">
                      {speciesOptions.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => set("species", opt.value)}
                          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl border transition-colors ${form.species === opt.value ? "bg-[#FF6B35]/15 border-[#FF6B35]/40 text-white" : "bg-white/3 border-white/10 text-[#9B8FC0] hover:bg-white/5"}`}>
                          <span className="text-2xl">{opt.emoji}</span>
                          <span className="text-xs font-medium">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input label="Nombre *" placeholder="Ej. Rocky" value={form.name} onChange={(e) => set("name", e.target.value)} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Raza" placeholder="Ej. Labrador" value={form.breed} onChange={(e) => set("breed", e.target.value)} />
                    <Input label="Color" placeholder="Ej. Marrón" value={form.color} onChange={(e) => set("color", e.target.value)} />
                  </div>
                  <Input label="Edad (años)" type="number" min="0" max="30" placeholder="Ej. 3" value={form.age} onChange={(e) => set("age", e.target.value)} />
                  <Input label="Zona donde suele estar" placeholder="Ej. Miraflores, Lima" value={form.usual_location} onChange={(e) => set("usual_location", e.target.value)} />
                  <Input label="Teléfono de contacto" type="tel" placeholder="Ej. 987654321" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} hint="Código de Perú (+51) se agrega automáticamente" />
                  <Input label="WhatsApp (opcional)" type="tel" placeholder="Si es diferente al teléfono" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
                </div>
                <button type="button" onClick={() => setActiveTab("salud")} className="w-full py-4 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 text-[#FF6B35] font-medium hover:bg-[#FF6B35]/20 transition-colors">
                  Siguiente: Información de Salud →
                </button>
              </motion.div>
            )}

            {/* TAB: SALUD */}
            {activeTab === "salud" && (
              <motion.div key="salud" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="glass rounded-3xl p-6 space-y-5">
                  <h2 className="font-semibold text-white flex items-center gap-2"><Heart size={16} className="text-[#FF6B35]" />Información de Salud</h2>
                  <div className="space-y-3 border-b border-white/5 pb-4">
                    <ToggleSwitch label="¿Está esterilizado/a?" value={form.is_sterilized} onChange={(v) => set("is_sterilized", v)} />
                    <ToggleSwitch label="¿Está desparasitado/a?" value={form.is_dewormed} onChange={(v) => set("is_dewormed", v)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#9B8FC0]">Alergias conocidas</label>
                    <textarea placeholder="Ej. Alérgico al pollo, problemas con algunos fertilizantes..." value={form.allergies} onChange={(e) => set("allergies", e.target.value)} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 focus:ring-2 focus:ring-[#FF6B35]/20 resize-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#9B8FC0]">Condiciones de salud</label>
                    <textarea placeholder="Ej. Displasia de cadera, diabetes, epilepsia..." value={form.conditions} onChange={(e) => set("conditions", e.target.value)} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 focus:ring-2 focus:ring-[#FF6B35]/20 resize-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#9B8FC0]">Alimentación especial</label>
                    <textarea placeholder="Ej. Dieta sin granos, alimento renal, porciones pequeñas..." value={form.special_diet} onChange={(e) => set("special_diet", e.target.value)} rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 focus:ring-2 focus:ring-[#FF6B35]/20 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Veterinario de confianza" placeholder="Ej. Dr. García" value={form.vet_name} onChange={(e) => set("vet_name", e.target.value)} />
                    <Input label="Teléfono del vet" type="tel" placeholder="Ej. 015551234" value={form.vet_phone} onChange={(e) => set("vet_phone", e.target.value)} />
                  </div>
                </div>
                <button type="button" onClick={() => setActiveTab("vacunas")} className="w-full py-4 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 text-[#FF6B35] font-medium hover:bg-[#FF6B35]/20 transition-colors">
                  Siguiente: Registro de Vacunas →
                </button>
              </motion.div>
            )}

            {/* TAB: VACUNAS */}
            {activeTab === "vacunas" && (
              <motion.div key="vacunas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="glass rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-white flex items-center gap-2"><Syringe size={16} className="text-[#FF6B35]" />Registro de Vacunas</h2>
                    <button type="button" onClick={addVaccine}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6B35]/15 text-[#FF6B35] text-sm font-medium hover:bg-[#FF6B35]/25">
                      <Plus size={14} />Agregar
                    </button>
                  </div>
                  <p className="text-[#9B8FC0] text-xs">Registra las vacunas. Te avisaremos cuando se acerque la próxima dosis 🔔</p>

                  {vaccines.length === 0 && (
                    <div className="text-center py-8">
                      <Syringe size={32} className="text-[#9B8FC0]/40 mx-auto mb-2" />
                      <p className="text-[#9B8FC0] text-sm">Sin vacunas registradas aún</p>
                      <button type="button" onClick={addVaccine} className="mt-3 text-[#FF6B35] text-sm hover:underline">+ Agregar primera vacuna</button>
                    </div>
                  )}

                  {vaccines.map((v, i) => (
                    <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/3 rounded-2xl p-4 space-y-3 border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#9B8FC0]">Vacuna {i + 1}</span>
                        <button type="button" onClick={() => removeVaccine(v.id)} className="text-[#9B8FC0] hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <Input label="Nombre de la vacuna *" placeholder="Ej. Parvovirus, Rabia, Bordetella..." value={v.name} onChange={(e) => updateVaccine(v.id, "name", e.target.value)} />
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-[#9B8FC0]">Fecha aplicada</label>
                          <input type="date" value={v.date_given} onChange={(e) => updateVaccine(v.id, "date_given", e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[#F8F4FF] text-sm focus:border-[color:var(--primary)]/60 focus:outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-[#9B8FC0]">Próxima dosis</label>
                          <input type="date" value={v.next_due_date} onChange={(e) => updateVaccine(v.id, "next_due_date", e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[#F8F4FF] text-sm focus:border-[color:var(--primary)]/60 focus:outline-none" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => updateVaccine(v.id, "is_given", !v.is_given)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${v.is_given ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-[#9B8FC0]"}`}>
                          {v.is_given ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                          {v.is_given ? "Aplicada" : "Pendiente"}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <button type="button" onClick={() => setActiveTab("galeria")} className="w-full py-4 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 text-[#FF6B35] font-medium hover:bg-[#FF6B35]/20 transition-colors">
                  Siguiente: Galería de Fotos →
                </button>
              </motion.div>
            )}

            {/* TAB: GALERÍA */}
            {activeTab === "galeria" && (
              <motion.div key="galeria" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="glass rounded-3xl p-6">
                  <h2 className="font-semibold text-white flex items-center gap-2 mb-2"><Camera size={16} className="text-[#FF6B35]" />Galería de fotos</h2>
                  <p className="text-[#9B8FC0] text-xs mb-4">Agrega hasta 5 fotos. La primera será la foto de perfil.</p>

                  {photoPreviews.length > 0 && (
                    <div className="relative mb-4">
                      <AnimatePresence mode="wait">
                        <motion.div key={photoIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative h-56 rounded-2xl overflow-hidden">
                          <Image src={photoPreviews[photoIndex]} alt="foto mascota" fill className="object-cover" sizes="(max-width: 672px) 100vw, 672px" />
                          <button type="button" onClick={() => removePhoto(photoIndex)}
                            className="absolute top-3 right-3 bg-black/60 rounded-full p-1.5 text-white hover:bg-black/80">
                            <X size={14} />
                          </button>
                          {photoIndex === 0 && (
                            <div className="absolute bottom-3 left-3 bg-[#FF6B35] text-white text-xs px-2 py-0.5 rounded-full font-medium">Foto principal</div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                      {photoPreviews.length > 1 && (
                        <div className="flex items-center justify-between mt-3">
                          <button type="button" onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))} disabled={photoIndex === 0}
                            className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] disabled:opacity-30"><ChevronLeft size={18} /></button>
                          <div className="flex gap-1.5">
                            {photoPreviews.map((_, i) => (
                              <button key={i} type="button" onClick={() => setPhotoIndex(i)}
                                className={`w-2 h-2 rounded-full transition-colors ${i === photoIndex ? "bg-[#FF6B35]" : "bg-white/20"}`} />
                            ))}
                          </div>
                          <button type="button" onClick={() => setPhotoIndex((i) => Math.min(photoPreviews.length - 1, i + 1))} disabled={photoIndex === photoPreviews.length - 1}
                            className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] disabled:opacity-30"><ChevronRight size={18} /></button>
                        </div>
                      )}
                    </div>
                  )}

                  {photoPreviews.length < 5 && (
                    <>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-white/15 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-[#FF6B35]/40 hover:bg-white/3 text-[#9B8FC0] hover:text-white">
                        <Upload size={24} />
                        <span className="text-sm">{photoPreviews.length === 0 ? "Subir fotos" : "Agregar más fotos"}</span>
                        <span className="text-xs opacity-60">{photoPreviews.length}/5 fotos</span>
                      </button>
                    </>
                  )}
                </div>
                <button type="button" onClick={() => setActiveTab("resena")} className="w-full py-4 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 text-[#FF6B35] font-medium hover:bg-[#FF6B35]/20 transition-colors">
                  Siguiente: Reseña General →
                </button>
              </motion.div>
            )}

            {/* TAB: RESEÑA */}
            {activeTab === "resena" && (
              <motion.div key="resena" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="glass rounded-3xl p-6 space-y-5">
                  <h2 className="font-semibold text-white flex items-center gap-2"><FileText size={16} className="text-[#FF6B35]" />Reseña general</h2>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#9B8FC0]">Personalidad y actitudes únicas</label>
                    <textarea placeholder="Ej. Le encanta la pelota, muy amigable con niños, miedoso con truenos, muy territorial con extraños..." value={form.personality_notes} onChange={(e) => set("personality_notes", e.target.value)} rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 focus:ring-2 focus:ring-[#FF6B35]/20 resize-none" />
                    <span className="text-xs text-[#9B8FC0]/60 text-right">{form.personality_notes.length}/500</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#9B8FC0]">Señas particulares / descripción física</label>
                    <textarea placeholder="Ej. Mancha blanca en el pecho, cola corta, oreja caída..." value={form.description} onChange={(e) => set("description", e.target.value)} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 focus:ring-2 focus:ring-[#FF6B35]/20 resize-none" />
                  </div>
                  <Input label="Recompensa (opcional)" placeholder="Ej. Se ofrece recompensa a quien lo devuelva" value={form.reward_description} onChange={(e) => set("reward_description", e.target.value)} />
                </div>

                <Button type="submit" loading={loading} fullWidth size="lg">
                  🐾 Registrar mascota y generar QR
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </main>
    </div>
  );
}
