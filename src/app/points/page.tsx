import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PointsClient from "./PointsClient";

export default async function PointsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("points, full_name").eq("id", user.id).single();

  const { data: transactions } = await supabase
    .from("point_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return <PointsClient points={profile?.points || 0} transactions={transactions || []} />;
}
