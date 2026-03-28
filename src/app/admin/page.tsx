import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/config";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  if (!isAdmin(profile?.email)) redirect("/dashboard");

  const [
    { count: totalUsers },
    { count: totalPets },
    { count: totalPlates },
    { count: activePlates },
    { count: totalPosts },
    { count: totalScans },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("pets").select("*", { count: "exact", head: true }),
    supabase.from("qr_plates").select("*", { count: "exact", head: true }),
    supabase.from("qr_plates").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("scan_events").select("*", { count: "exact", head: true }),
  ]);

  const stats = {
    totalUsers: totalUsers || 0,
    totalPets: totalPets || 0,
    totalPlates: totalPlates || 0,
    activePlates: activePlates || 0,
    totalPosts: totalPosts || 0,
    totalScans: totalScans || 0,
  };

  return <AdminDashboardClient stats={stats} />;
}
