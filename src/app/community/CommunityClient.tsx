"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Plus, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { POINTS } from "@/lib/config";
import { Story } from "@/types";
import Button from "@/components/ui/Button";
import StoriesBar from "./StoriesBar";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author: { id: string; full_name: string | null; avatar_url: string | null } | null;
  pet: { id: string; name: string; species: string } | null;
}

interface Props {
  posts: Post[];
  stories: Story[];
  currentUserId: string | null;
  currentUserAvatar: string | null;
  currentUserName: string | null;
  likedPostIds: string[];
  userPets: { id: string; name: string }[];
}

export default function CommunityClient({ posts: initialPosts, stories, currentUserId, currentUserAvatar, currentUserName, likedPostIds: initialLiked, userPets }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [liked, setLiked] = useState<Set<string>>(new Set(initialLiked));
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<string, { id: string; content: string; author: string; created_at: string }[]>>({});
  const [loadingComment, setLoadingComment] = useState(false);

  async function toggleLike(postId: string) {
    if (!currentUserId) { toast.error("Inicia sesión para dar like"); return; }
    const supabase = createClient();
    const isLiked = liked.has(postId);
    const newLiked = new Set(liked);
    if (isLiked) { newLiked.delete(postId); } else { newLiked.add(postId); }
    setLiked(newLiked);
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) } : p));
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", currentUserId);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: currentUserId });
    }
  }

  async function loadComments(postId: string) {
    if (commentingOn === postId) { setCommentingOn(null); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from("post_comments")
      .select("id, content, created_at, author:profiles(full_name)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(20);
    setComments((prev) => ({
      ...prev,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [postId]: (data || []).map((c: any) => ({
        id: c.id as string,
        content: c.content as string,
        author: (Array.isArray(c.author) ? c.author[0]?.full_name : c.author?.full_name) || "Usuario",
        created_at: c.created_at as string,
      })),
    }));
    setCommentingOn(postId);
    setCommentText("");
  }

  async function submitComment(postId: string) {
    if (!currentUserId) { toast.error("Inicia sesión para comentar"); return; }
    if (!commentText.trim()) return;
    setLoadingComment(true);
    const supabase = createClient();
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: currentUserId, content: commentText.trim() });
    if (!error) {
      await supabase.rpc("award_points", { p_user_id: currentUserId, p_amount: POINTS.COMMENT, p_reason: "Comentario en la comunidad", p_reference_id: null });
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), { id: Date.now().toString(), content: commentText.trim(), author: "Tú", created_at: new Date().toISOString() }],
      }));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
      setCommentText("");
    }
    setLoadingComment(false);
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-700/10 blur-[120px]" />
      </div>

      <header className="relative z-10 glass border-b border-white/5 px-6 py-4 sticky top-0">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="font-bold text-white">Comunidad</h1>
              <p className="text-xs text-[#9B8FC0]">Historias de mascotas 🐾</p>
            </div>
          </div>
          {currentUserId && (
            <Link href="/community/new">
              <Button size="sm"><Plus size={16} />Publicar</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Stories bar — scrolls with content like Instagram */}
      <div className="glass border-b border-white/5">
        <StoriesBar
          stories={stories}
          currentUserId={currentUserId}
          currentUserAvatar={currentUserAvatar}
          currentUserName={currentUserName}
          userPets={userPets}
        />
      </div>

      <main className="relative max-w-xl mx-auto px-4 py-6 space-y-6">
        {posts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🐾</div>
            <p className="text-white font-semibold mb-2">¡Sé el primero en publicar!</p>
            <p className="text-[#9B8FC0] text-sm mb-6">Comparte una foto de tu mascota con la comunidad</p>
            {currentUserId ? (
              <Link href="/community/new"><Button>Crear primera publicación</Button></Link>
            ) : (
              <Link href="/login"><Button>Iniciar sesión para publicar</Button></Link>
            )}
          </div>
        )}

        {posts.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-3xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 pt-4 pb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#7C3AED] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {post.author?.avatar_url ? (
                  <Image src={post.author.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                ) : (
                  (post.author?.full_name?.[0] || "U").toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{post.author?.full_name || "Usuario"}</p>
                {post.pet && <p className="text-xs text-[#FF6B35]">con {post.pet.name} {post.pet.species === "dog" ? "🐶" : "🐱"}</p>}
              </div>
              <span className="ml-auto text-xs text-[#9B8FC0]">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
              </span>
            </div>
            {post.image_url && (
              <div className="relative w-full aspect-square">
                <Image src={post.image_url} alt={post.caption || "Post"} fill className="object-cover" sizes="(max-width: 580px) 100vw, 580px" />
              </div>
            )}
            <div className="px-5 py-3">
              <div className="flex items-center gap-4 mb-3">
                <button onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked.has(post.id) ? "text-red-400" : "text-[#9B8FC0] hover:text-red-400"}`}>
                  <Heart size={20} fill={liked.has(post.id) ? "currentColor" : "none"} />{post.likes_count}
                </button>
                <button onClick={() => loadComments(post.id)} className="flex items-center gap-1.5 text-sm text-[#9B8FC0] hover:text-white">
                  <MessageCircle size={20} />{post.comments_count}
                </button>
              </div>
              {post.caption && (
                <p className="text-sm text-[#F8F4FF] leading-relaxed mb-3">
                  <span className="font-semibold text-white">{post.author?.full_name?.split(" ")[0] || "Usuario"} </span>
                  {post.caption}
                </p>
              )}
            </div>
            <AnimatePresence>
              {commentingOn === post.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-white/5">
                  <div className="px-5 py-3 space-y-3 max-h-48 overflow-y-auto">
                    {(comments[post.id] || []).map((c) => (
                      <div key={c.id} className="text-sm">
                        <span className="font-semibold text-white">{c.author} </span>
                        <span className="text-[#9B8FC0]">{c.content}</span>
                      </div>
                    ))}
                    {(comments[post.id] || []).length === 0 && <p className="text-xs text-[#9B8FC0] text-center py-2">Sin comentarios aún</p>}
                  </div>
                  {currentUserId && (
                    <div className="flex gap-2 px-5 pb-4">
                      <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                        placeholder="Agrega un comentario..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-[#9B8FC0]/60 focus:border-[#FF6B35]/60 focus:outline-none" />
                      <button onClick={() => submitComment(post.id)} disabled={loadingComment || !commentText.trim()}
                        className="p-2 rounded-xl bg-[#FF6B35]/15 text-[#FF6B35] hover:bg-[#FF6B35]/25 disabled:opacity-40">
                        <Send size={16} />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </main>
    </div>
  );
}
