import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/config";
import AdminPlatesClient from "./AdminPlatesClient";

export default async function AdminPlatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("email, is_admin").eq("id", user.id).single();
  if (!isAdmin(profile?.email)) redirect("/dashboard");

  const { data: plates } = await supabase
    .from("qr_plates")
    .select("*, pet:pets(id, name, species)")
    .order("created_at", { ascending: false });

  return <AdminPlatesClient plates={plates || []} />;
}
