"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { Story } from "@/types";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";

interface StoriesBarProps {
  stories: Story[];
  currentUserId: string | null;
  currentUserAvatar: string | null;
  currentUserName: string | null;
  userPets: { id: string; name: string }[];
}

export default function StoriesBar({
  stories,
  currentUserId,
  currentUserAvatar,
  userPets,
}: StoriesBarProps) {
  const [mounted, setMounted] = useState(false);
  const [viewingStory, setViewingStory] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [selectedPetId, setSelectedPetId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const STORY_DURATION = 5000;

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startTimer(idx: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 50;
      setProgress((elapsed / STORY_DURATION) * 100);
      if (elapsed >= STORY_DURATION) {
        clearInterval(timerRef.current!);
        if (idx < stories.length - 1) {
          setProgress(0);
          setViewingStory(idx + 1);
          startTimer(idx + 1);
        } else {
          setViewingStory(null);
          setProgress(0);
        }
      }
    }, 50);
  }

  function openStory(index: number) {
    setViewingStory(index);
    setProgress(0);
    startTimer(index);
  }

  function closeStory() {
    if (timerRef.current) clearInterval(timerRef.current);
    setViewingStory(null);
    setProgress(0);
  }

  function nextStory() {
    if (viewingStory === null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (viewingStory < stories.length - 1) {
      const next = viewingStory + 1;
      setProgress(0);
      setViewingStory(next);
      startTimer(next);
    } else {
      closeStory();
    }
  }

  function prevStory() {
    if (viewingStory === null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (viewingStory > 0) {
      const prev = viewingStory - 1;
      setProgress(0);
      setViewingStory(prev);
      startTimer(prev);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setShowUpload(true);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  async function handleUploadStory() {
    if (!uploadFile || !currentUserId) return;
    setUploading(true);
    const supabase = createClient();
    try {
      const ext = uploadFile.name.split(".").pop();
      const path = `stories/${currentUserId}/${uuidv4()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("pet-photos")
        .upload(path, uploadFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("pet-photos")
        .getPublicUrl(path);
      const { error } = await supabase.from("stories").insert({
        user_id: currentUserId,
        pet_id: selectedPetId || null,
        media_url: urlData.publicUrl,
        caption: caption || null,
      });
      if (error) throw error;
      toast.success("¡Historia publicada! 🌟");
      setShowUpload(false);
      setUploadFile(null);
      setUploadPreview(null);
      setCaption("");
      setSelectedPetId("");
    } catch {
      toast.error("Error al publicar la historia");
    } finally {
      setUploading(false);
    }
  }

  function cancelUpload() {
    setShowUpload(false);
    setUploadFile(null);
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadPreview(null);
    setCaption("");
    setSelectedPetId("");
  }

  const currentStory = viewingStory !== null ? stories[viewingStory] : null;

  // Show one circle per user (first story per user)
  const storyUsers = stories.reduce((acc, story) => {
    if (!acc.find((s) => s.user_id === story.user_id)) acc.push(story);
    return acc;
  }, [] as Story[]);

  const overlays = (
    <>
      {/* ── Story Viewer ─────────────────────────────── */}
      <AnimatePresence>
        {currentStory && viewingStory !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black flex flex-col"
            style={{ zIndex: 9999 }}
          >
            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 flex gap-1 px-3 pt-3" style={{ zIndex: 10001 }}>
              {stories.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white rounded-full"
                    style={{
                      width:
                        i < viewingStory
                          ? "100%"
                          : i === viewingStory
                          ? `${progress}%`
                          : "0%",
                      transition: i === viewingStory ? "none" : undefined,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Top bar */}
            <div
              className="absolute top-8 left-0 right-0 flex items-center justify-between px-4"
              style={{ zIndex: 10001 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                  {currentStory.author?.avatar_url ? (
                    <Image
                      src={currentStory.author.avatar_url}
                      alt=""
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#7C3AED] flex items-center justify-center text-xs text-white font-bold">
                      {(currentStory.author?.full_name?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    {currentStory.author?.full_name || "Usuario"}
                  </p>
                  {currentStory.pet && (
                    <p className="text-white/70 text-xs">
                      con {currentStory.pet.name}{" "}
                      {currentStory.pet.species === "dog" ? "🐶" : "🐱"}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={closeStory}
                className="p-2 text-white rounded-full bg-black/30"
              >
                <X size={20} />
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 relative">
              <Image
                src={currentStory.media_url}
                alt={currentStory.caption || "Historia"}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* Caption */}
            {currentStory.caption && (
              <div
                className="absolute bottom-10 left-0 right-0 px-6 text-center"
                style={{ zIndex: 10001 }}
              >
                <p className="text-white text-sm bg-black/50 rounded-2xl px-4 py-2 backdrop-blur-sm">
                  {currentStory.caption}
                </p>
              </div>
            )}

            {/* Tap zones (prev / next) — below the header */}
            <div
              className="absolute inset-0 flex"
              style={{ zIndex: 10000, top: "64px" }}
            >
              <button className="flex-1" onClick={prevStory} aria-label="Anterior" />
              <button className="flex-1" onClick={nextStory} aria-label="Siguiente" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upload Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showUpload && uploadPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex flex-col"
            style={{ zIndex: 9999 }}
            onClick={(e) => e.target === e.currentTarget && cancelUpload()}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="mt-auto w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
              style={{
                background: "rgba(26,18,48,0.98)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* Preview */}
              <div className="relative w-full" style={{ paddingBottom: "75%" }}>
                <Image
                  src={uploadPreview}
                  alt="Vista previa"
                  fill
                  className="object-cover"
                  sizes="(max-width: 512px) 100vw, 512px"
                />
              </div>

              {/* Controls */}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-white text-center text-lg">
                  Nueva historia
                </h3>

                {userPets.length > 0 && (
                  <select
                    value={selectedPetId}
                    onChange={(e) => setSelectedPetId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[#F8F4FF] text-sm focus:border-[#FF6B35]/60 focus:outline-none"
                  >
                    <option value="">Sin mascota</option>
                    {userPets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escribe algo (opcional)..."
                  maxLength={150}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[#F8F4FF] text-sm placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 focus:outline-none"
                />

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={cancelUpload}
                    className="flex-1 py-3.5 rounded-2xl bg-white/5 text-[#9B8FC0] text-sm font-medium active:opacity-70"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUploadStory}
                    disabled={uploading}
                    className="flex-1 py-3.5 rounded-2xl bg-[#FF6B35] text-white text-sm font-semibold disabled:opacity-50 active:opacity-80"
                  >
                    {uploading ? "Publicando..." : "Publicar historia ✨"}
                  </button>
                </div>

                {/* iOS safe area bottom padding */}
                <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <>
      {/* ── Inline stories bar ───────────────────────── */}
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {/* Add story */}
          {currentUserId && (
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <button
                onClick={() => fileRef.current?.click()}
                className="relative w-14 h-14 rounded-full bg-white/5 border-2 border-dashed border-[#FF6B35]/50 flex items-center justify-center hover:border-[#FF6B35] active:scale-95 overflow-hidden group"
              >
                {currentUserAvatar && (
                  <Image
                    src={currentUserAvatar}
                    alt=""
                    width={56}
                    height={56}
                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50"
                  />
                )}
                <Plus size={22} className="text-[#FF6B35] relative z-10" />
              </button>
              <span className="text-[10px] text-[#9B8FC0] max-w-[56px] truncate text-center">
                Tu historia
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* Story circles */}
          {storyUsers.map((story) => (
            <div
              key={story.id}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <button
                onClick={() => openStory(stories.indexOf(story))}
                className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#FF6B35] to-[#7C3AED] active:scale-95"
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-[#1A1230]">
                  {story.author?.avatar_url ? (
                    <Image
                      src={story.author.avatar_url}
                      alt=""
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      {story.pet?.species === "dog"
                        ? "🐶"
                        : story.pet?.species === "cat"
                        ? "🐱"
                        : "🐾"}
                    </div>
                  )}
                </div>
              </button>
              <span className="text-[10px] text-[#9B8FC0] max-w-[56px] truncate text-center">
                {story.pet?.name ||
                  story.author?.full_name?.split(" ")[0] ||
                  "Usuario"}
              </span>
            </div>
          ))}

          {/* Empty state */}
          {storyUsers.length === 0 && !currentUserId && (
            <p className="text-[#9B8FC0] text-xs self-center py-2 px-2">
              No hay historias aún
            </p>
          )}
        </div>
      </div>

      {/* Portaled overlays — rendered at document.body to escape stacking context */}
      {mounted && createPortal(overlays, document.body)}
    </>
  );
}
