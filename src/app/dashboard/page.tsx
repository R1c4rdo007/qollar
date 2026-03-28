import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: pets },
    { data: profile },
    { count: unreadCount },
  ] = await Promise.all([
    supabase.from("pets").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("*, points").eq("id", user.id).single(),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
  ]);

  // Check for upcoming vaccine reminders (silently, don't block render)
  supabase.rpc("check_vaccine_reminders", { p_user_id: user.id }).then(() => {});

  return (
    <DashboardClient
      pets={pets || []}
      profile={profile}
      user={user}
      unreadCount={unreadCount || 0}
    />
  );
}
