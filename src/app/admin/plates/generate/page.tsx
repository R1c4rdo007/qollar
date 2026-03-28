import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/config";
import GeneratePlatesClient from "./GeneratePlatesClient";

export default async function GeneratePlatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("email").eq("id", user.id).single();
  if (!isAdmin(profile?.email)) redirect("/dashboard");

  return <GeneratePlatesClient userId={user.id} />;
}
