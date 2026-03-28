import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PetPublicClient from "./PetPublicClient";

export default async function PetPublicPage({
  params,
}: {
  params: Promise<{ qrId: string }>;
}) {
  const { qrId } = await params;
  const supabase = await createClient();

  const { data: pet } = await supabase
    .from("pets")
    .select("*, owner:profiles(full_name, email, phone)")
    .eq("qr_id", qrId)
    .single();

  if (!pet) notFound();

  return <PetPublicClient pet={pet} />;
}
