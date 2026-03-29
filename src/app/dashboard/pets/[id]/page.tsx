import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PetDetailClient from "./PetDetailClient";

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pet } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!pet) notFound();

  const [{ data: scanEvents }, { data: vaccines }, { data: linkedPlates }] = await Promise.all([
    supabase.from("scan_events").select("*").eq("pet_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("vaccines").select("*").eq("pet_id", id).order("next_due_date", { ascending: true }),
    // Fetch ALL plates linked to this pet (any status) — no extra filter so RLS doesn't block
    supabase.from("qr_plates").select("id, plate_code, status").eq("pet_id", id).order("activated_at", { ascending: false }),
  ]);

  return <PetDetailClient pet={pet} scanEvents={scanEvents || []} vaccines={vaccines || []} linkedPlates={linkedPlates || []} />;
}
