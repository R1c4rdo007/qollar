"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, Circle,
  Syringe, Heart, Camera, FileText, PawPrint, Upload, X
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pet, Vaccine } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";

type Species = "dog" | "cat" | "other";
type TabId = "basico" | "salud" | "vacunas" | "galeria" | "resena";

interface VaccineEntry {
  id: string;
  isNew?: boolean;
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

const speciesOptions = [
  { value: "dog" as Species, emoji: "🐶", label: "Perro" },
  { value: "cat" as Species, emoji: "🐱", label: "Gato" },
  { value: "other" as Species, emoji: "🐾", label: "Otro" },
];

export default function PetEditClient({ pet, userId, ownerPhone = "", ownerName: _ownerName = "" }: { pet: Pet; userId: string; ownerPhone?: string; ownerName?: string }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("basico");
  const [vaccines, setVaccines] = useState<VaccineEntry[]>([]);
  const [deletedVaccineIds, setDeletedVaccineIds] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>(pet.photos || []);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: pet.name,
    species: pet.species as Species,
    breed: pet.breed || "",
    color: pet.color || "",
    age: pet.age?.toString() || "",
    usual_location: pet.usual_location || "",
    allergies: pet.allergies || "",
    conditions: pet.conditions || "",
    is_sterilized: pet.is_sterilized ?? false,
    is_dewormed: pet.is_dewormed ?? false,
    special_diet: pet.special_diet || "",
    vet_name: pet.vet_name || "",
    vet_phone: pet.vet_phone || "",
    description: pet.description || "",
    personality_notes: pet.personality_notes || "",
    contact_phone: pet.contact_phone || ownerPhone,
    whatsapp: pet.whatsapp || ownerPhone,
    reward_description: pet.reward_description || "",
  });

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.from("vaccines").select("*").eq("pet_id", pet.id).then(({ data }) => {
      if (data) {
        setVaccines(data.map((v: Vaccine) => ({
          id: v.id,
          isNew: false,
          name: v.name,
          date_given: v.date_given || "",
          next_due_date: v.next_due_date || "",
          is_given: v.is_given,
          notes: v.notes || "",
        })));
      }
    });
  }, [pet.id]);

  function addVaccine() {
    setVaccines((prev) => [...prev, { id: uuidv4(), isNew: true, name: "", date_given: "", next_due_date: "", is_given: false, notes: "" }]);
  }

  function updateVaccine(id: string, field: string, value: string | boolean) {
    setVaccines((prev) => prev.map((v) => v.id === id ? { ...v, [field]: value } : v));
  }

  function removeVaccine(id: string, isNew?: boolean) {
    setVaccines((prev) => prev.filter((v) => v.id !== id));
    if (!isNew) setDeletedVaccineIds((prev) => [...prev, id]);
  }

  function handlePhotoFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - photos.length - newPhotoFiles.length;
    if (remaining <= 0) { toast.error("Máximo 5 fotos"); return; }
    const toAdd = files.slice(0, remaining);
    setNewPhotoFiles((prev) => [...prev, ...toAdd]);
    e.target.value = "";
  }

  function removeExistingPhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  function removeNewPhoto(idx: number) {
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es requerido"); setActiveTab("basico"); return; }
    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from("pets").update({
        name: form.name.trim(),
        species: form.species,
        breed: form.breed || null,
        color: form.color || null,
        age: form.age ? parseInt(form.age) : null,
        description: form.description || null,
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
      }).eq("id", pet.id).eq("owner_id", userId);
      if (error) throw error;

      // Delete removed vaccines
      if (deletedVaccineIds.length > 0) {
        await supabase.from("vaccines").delete().in("id", deletedVaccineIds);
      }

      // Insert new vaccines
      const newVaccines = vaccines.filter((v) => v.isNew && v.name.trim());
      if (newVaccines.length > 0) {
        await supabase.from("vaccines").insert(newVaccines.map((v) => ({
          pet_id: pet.id,
          name: v.name.trim(),
          date_given: v.date_given || null,
          next_due_date: v.next_due_date || null,
          is_given: v.is_given,
          notes: v.notes || null,
        })));
      }

      // Update existing vaccines
      const existingVaccines = vaccines.filter((v) => !v.isNew && v.name.trim());
      for (const v of existingVaccines) {
        await supabase.from("vaccines").update({
          name: v.name.trim(),
          date_given: v.date_given || null,
          next_due_date: v.next_due_date || null,
          is_given: v.is_given,
          notes: v.notes || null,
        }).eq("id", v.id);
      }

      // Upload new photos
      let finalPhotos = [...photos];
      if (newPhotoFiles.length > 0) {
        setPhotoUploading(true);
        const uploaded: string[] = [];
        for (const file of newPhotoFiles) {
          const ext = file.name.split(".").pop();
          const path = `${userId}/${pet.id}/${uuidv4()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("pet-photos").upload(path, file);
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("pet-photos").getPublicUrl(path);
            uploaded.push(urlData.publicUrl);
          }
        }
        finalPhotos = [...photos, ...uploaded];
        setPhotoUploading(false);
      }
      if (finalPhotos.length !== (pet.photos || []).length || newPhotoFiles.length > 0) {
        await supabase.from("pets").update({ photos: finalPhotos }).eq("id", pet.id).eq("owner_id", userId);
        setPhotos(finalPhotos);
        setNewPhotoFiles([]);
      }

      toast.success("Cambios guardados ✓");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  const ToggleSwitch = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#F8F4FF]">{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors ${value ? "bg-[#FF6B35]" : "bg-white/15"}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${value ? "translate-x-7" : "translate-x-1"}`} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-700/15 blur-[100px]" />
      </div>
      <header className="relative z-10 glass border-b border-white/5 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href={`/dashboard/pets/${pet.id}`}>
            <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white"><ArrowLeft size={20} /></button>
          </Link>
          <div>
            <h1 className="font-bold text-white">Editar {pet.name}</h1>
            <p className="text-xs text-[#9B8FC0]">Actualiza la información</p>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="sticky top-[57px] z-10 glass border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex overflow-x-auto no-scrollbar py-3 gap-2">
            {TABS.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab.id ? "bg-[#FF6B35] text-white" : "bg-white/5 text-[#9B8FC0] hover:bg-white/10"}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="relative max-w-2xl mx-auto px-6 py-6">
        <form onSubmit={handleSave}>
          <AnimatePresence mode="wait">
            {activeTab === "basico" && (
              <motion.div key="basico" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="glass rounded-3xl p-6 space-y-5">
                  <h2 className="font-semibold text-white flex items-center gap-2"><PawPrint size={16} className="text-[#FF6B35]" />Datos básicos</h2>
                  <div>
                    <label className="text-sm font-medium text-[#9B8FC0] block mb-2">Tipo</label>
                    <div className="flex gap-3">
                      {speciesOptions.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => set("species", opt.value)}
                          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl border transition-colors ${form.species === opt.value ? "bg-[#FF6B35]/15 border-[#FF6B35]/40 text-white" : "bg-white/3 border-white/10 text-[#9B8FC0]"}`}>
                          <span className="text-2xl">{opt.emoji}</span>
                          <span className="text-xs font-medium">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input label="Nombre *" value={form.name} onChange={(e) => set("name", e.target.value)} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Raza" value={form.breed} onChange={(e) => set("breed", e.target.value)} />
                    <Input label="Color" value={form.color} onChange={(e) => set("color", e.target.value)} />
                  </div>
                  <Input label="Edad (años)" type="number" min="0" max="30" value={form.age} onChange={(e) => set("age", e.target.value)} />
                  <Input label="Zona donde suele estar" value={form.usual_location} onChange={(e) => set("usual_location", e.target.value)} />
                  <Input label="Teléfono" type="tel" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
                  <Input label="WhatsApp" type="tel" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
                </div>
                <Button type="submit" loading={loading} fullWidth size="lg">Guardar cambios</Button>
              </motion.div>
            )}

            {activeTab === "salud" && (
              <motion.div key="salud" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="glass rounded-3xl p-6 space-y-5">
                  <h2 className="font-semibold text-white flex items-center gap-2"><Heart size={16} className="text-[#FF6B35]" />Información de Salud</h2>
                  <div className="space-y-3 border-b border-white/5 pb-4">
                    <ToggleSwitch label="¿Está esterilizado/a?" value={form.is_sterilized} onChange={(v) => set("is_sterilized", v)} />
                    <ToggleSwitch label="¿Está desparasitado/a?" value={form.is_dewormed} onChange={(v) => set("is_dewormed", v)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#9B8FC0]">Alergias</label>
                    <textarea value={form.allergies} onChange={(e) => set("allergies", e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 resize-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#9B8FC0]">Condiciones de salud</label>
                    <textarea value={form.conditions} onChange={(e) => set("conditions", e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 resize-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#9B8FC0]">Alimentación especial</label>
                    <textarea value={form.special_diet} onChange={(e) => set("special_diet", e.target.value)} rows={2} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Veterinario" value={form.vet_name} onChange={(e) => set("vet_name", e.target.value)} />
                    <Input label="Tel. del vet" type="tel" value={form.vet_phone} onChange={(e) => set("vet_phone", e.target.value)} />
                  </div>
                </div>
                <Button type="submit" loading={loading} fullWidth size="lg">Guardar cambios</Button>
              </motion.div>
            )}

            {activeTab === "vacunas" && (
              <motion.div key="vacunas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="glass rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-white flex items-center gap-2"><Syringe size={16} className="text-[#FF6B35]" />Registro de Vacunas</h2>
                    <button type="button" onClick={addVaccine} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6B35]/15 text-[#FF6B35] text-sm font-medium">
                      <Plus size={14} />Agregar
                    </button>
                  </div>
                  {vaccines.length === 0 && (
                    <div className="text-center py-6">
                      <Syringe size={28} className="text-[#9B8FC0]/40 mx-auto mb-2" />
                      <p className="text-[#9B8FC0] text-sm">Sin vacunas registradas</p>
                    </div>
                  )}
                  {vaccines.map((v, i) => (
                    <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/3 rounded-2xl p-4 space-y-3 border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#9B8FC0]">Vacuna {i + 1}</span>
                        <button type="button" onClick={() => removeVaccine(v.id, v.isNew)} className="text-[#9B8FC0] hover:text-red-400"><Trash2 size={14} /></button>
                      </div>
                      <Input label="Nombre *" placeholder="Ej. Parvovirus, Rabia..." value={v.name} onChange={(e) => updateVaccine(v.id, "name", e.target.value)} />
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-[#9B8FC0]">Fecha aplicada</label>
                          <input type="date" value={v.date_given} onChange={(e) => updateVaccine(v.id, "date_given", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[#F8F4FF] text-sm focus:border-[color:var(--primary)]/60 focus:outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-[#9B8FC0]">Próxima dosis</label>
                          <input type="date" value={v.next_due_date} onChange={(e) => updateVaccine(v.id, "next_due_date", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[#F8F4FF] text-sm focus:border-[color:var(--primary)]/60 focus:outline-none" />
                        </div>
                      </div>
                      <button type="button" onClick={() => updateVaccine(v.id, "is_given", !v.is_given)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${v.is_given ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-[#9B8FC0]"}`}>
                        {v.is_given ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                        {v.is_given ? "Aplicada ✓" : "Pendiente"}
                      </button>
                    </motion.div>
                  ))}
                </div>
                <Button type="submit" loading={loading} fullWidth size="lg">Guardar cambios</Button>
              </motion.div>
            )}

            {activeTab === "galeria" && (
              <motion.div key="galeria" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="glass rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-white flex items-center gap-2"><Camera size={16} className="text-[#FF6B35]" />Galería de fotos</h2>
                    <span className="text-xs text-[#9B8FC0]">{photos.length + newPhotoFiles.length}/5</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Existing photos */}
                    {photos.map((url, i) => (
                      <div key={url} className="relative aspect-square rounded-xl overflow-hidden group">
                        <Image src={url} alt={`foto ${i + 1}`} fill className="object-cover" />
                        {i === 0 && <div className="absolute bottom-1 left-1 bg-[#FF6B35] text-white text-[8px] px-1 py-0.5 rounded font-medium">Principal</div>}
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(url)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    ))}

                    {/* New photos (preview) */}
                    {newPhotoFiles.map((file, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(file)} alt="nueva foto" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-[#FF6B35]/20 flex items-center justify-center">
                          <span className="text-[8px] text-white bg-[#FF6B35] px-1 py-0.5 rounded font-medium">Nueva</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center"
                        >
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    ))}

                    {/* Upload button */}
                    {photos.length + newPhotoFiles.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-1 hover:border-[#FF6B35]/50 hover:bg-white/3 transition-colors"
                      >
                        <Upload size={18} className="text-[#9B8FC0]" />
                        <span className="text-[9px] text-[#9B8FC0]">Agregar</span>
                      </button>
                    )}
                  </div>

                  {photos.length + newPhotoFiles.length === 0 && (
                    <p className="text-[#9B8FC0] text-sm text-center py-4">Sin fotos aún</p>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoFileSelect}
                  />

                  {newPhotoFiles.length > 0 && (
                    <p className="text-xs text-[#9B8FC0] mt-3">
                      {newPhotoFiles.length} foto{newPhotoFiles.length > 1 ? "s" : ""} nueva{newPhotoFiles.length > 1 ? "s" : ""} — se subirán al guardar
                    </p>
                  )}
                </div>
                <Button type="submit" loading={loading || photoUploading} fullWidth size="lg">
                  {photoUploading ? "Subiendo fotos..." : "Guardar cambios"}
                </Button>
              </motion.div>
            )}

            {activeTab === "resena" && (
              <motion.div key="resena" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="glass rounded-3xl p-6 space-y-5">
                  <h2 className="font-semibold text-white flex items-center gap-2"><FileText size={16} className="text-[#FF6B35]" />Reseña general</h2>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#9B8FC0]">Personalidad y actitudes únicas</label>
                    <textarea value={form.personality_notes} onChange={(e) => set("personality_notes", e.target.value)} rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 resize-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#9B8FC0]">Señas particulares</label>
                    <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 resize-none" />
                  </div>
                  <Input label="Recompensa" value={form.reward_description} onChange={(e) => set("reward_description", e.target.value)} />
                </div>
                <Button type="submit" loading={loading} fullWidth size="lg">Guardar cambios</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </main>
    </div>
  );
}
