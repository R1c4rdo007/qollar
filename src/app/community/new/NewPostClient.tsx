"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { POINTS } from "@/lib/config";
import { v4 as uuidv4 } from "uuid";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

interface Pet { id: string; name: string; species: string; }

export default function NewPostClient({ userId, pets }: { userId: string; pets: Pet[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error("La imagen no puede superar 10MB"); return; }
    if (!f.type.startsWith("image/")) { toast.error("Solo se permiten imágenes"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !caption.trim()) { toast.error("Agrega una foto o un texto"); return; }
    setLoading(true);
    const supabase = createClient();

    try {
      let imageUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `posts/${userId}/${uuidv4()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("pet-photos").upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("pet-photos").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("posts").insert({
        user_id: userId,
        pet_id: selectedPetId || null,
        caption: caption.trim() || null,
        image_url: imageUrl,
      });
      if (error) throw error;

      await supabase.rpc("award_points", {
        p_user_id: userId,
        p_amount: POINTS.POST,
        p_reason: "Publicación en la comunidad",
        p_reference_id: null,
      });

      toast.success("¡Publicación creada! +5 QollPoints 🎉");
      router.push("/community");
      router.refresh();
    } catch {
      toast.error("Error al publicar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-purple-700/15 blur-[100px]" />
      </div>

      <header className="relative z-10 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/community">
              <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <h1 className="font-bold text-white">Nueva publicación</h1>
          </div>
          <Button size="sm" onClick={handleSubmit} loading={loading}>Publicar</Button>
        </div>
      </header>

      <main className="relative max-w-xl mx-auto px-6 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Image upload */}
          <div className="glass rounded-3xl overflow-hidden">
            {preview ? (
              <div className="relative aspect-square">
                <Image src={preview} alt="Preview" fill className="object-cover" />
                <button
                  onClick={() => { setPreview(null); setFile(null); }}
                  className="absolute top-3 right-3 bg-black/60 rounded-full p-2 text-white"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full aspect-square flex flex-col items-center justify-center gap-3 text-[#9B8FC0] hover:text-white hover:bg-white/3"
                >
                  <ImageIcon size={40} className="opacity-40" />
                  <div className="text-center">
                    <p className="font-medium">Agregar foto</p>
                    <p className="text-xs opacity-60">JPG, PNG — máx 10MB</p>
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Caption */}
          <div className="glass rounded-3xl p-5">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escribe algo sobre tu mascota... ¿Qué hizo hoy? 🐾"
              rows={4}
              maxLength={500}
              className="w-full bg-transparent text-[#F8F4FF] placeholder-[#9B8FC0]/60 text-sm leading-relaxed resize-none focus:outline-none"
            />
            <p className="text-right text-xs text-[#9B8FC0] mt-2">{caption.length}/500</p>
          </div>

          {/* Tag pet */}
          {pets.length > 0 && (
            <div className="glass rounded-3xl p-5">
              <p className="text-sm font-medium text-[#9B8FC0] mb-3">Etiquetar mascota (opcional)</p>
              <div className="flex flex-wrap gap-2">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => setSelectedPetId(selectedPetId === pet.id ? "" : pet.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                      selectedPetId === pet.id
                        ? "bg-[#FF6B35]/15 border-[#FF6B35]/40 text-white"
                        : "bg-white/3 border-white/10 text-[#9B8FC0] hover:bg-white/5"
                    }`}
                  >
                    {pet.species === "dog" ? "🐶" : "🐱"} {pet.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-[#9B8FC0] text-center">
            Las publicaciones que incumplan las normas de la comunidad serán eliminadas.
          </div>
        </motion.div>
      </main>
    </div>
  );
}
