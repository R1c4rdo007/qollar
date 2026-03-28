"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  pet_found: "🐾",
  post_like: "❤️",
  post_comment: "💬",
  points_earned: "⭐",
  welcome: "🎉",
};

export default function NotificationsClient({ notifications }: { notifications: Notification[] }) {
  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-purple-700/10 blur-[100px]" />
      </div>

      <header className="relative z-10 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard">
            <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 className="font-bold text-white">Notificaciones</h1>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-6 py-8">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={48} className="text-[#9B8FC0]/30 mx-auto mb-4" />
            <p className="text-[#9B8FC0]">Sin notificaciones aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass rounded-2xl p-4 flex gap-4 ${!n.read ? "border-[#FF6B35]/20 border" : ""}`}
              >
                <span className="text-2xl flex-shrink-0">{TYPE_ICONS[n.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-[#9B8FC0] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[#9B8FC0]/60 mt-1">
                    {new Date(n.created_at).toLocaleString("es-PE")}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 mt-1" />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
