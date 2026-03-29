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

  // First try: look up via physical plate (plate_code = qrId)
  const { data: plate } = await supabase
    .from("qr_plates")
    .select("pet_id")
    .eq("plate_code", qrId)
    .eq("status", "active")
    .maybeSingle();

  let pet = null;

  if (plate?.pet_id) {
    const { data } = await supabase
      .from("pets")
      .select("*, owner:profiles(full_name, email, phone)")
      .eq("id", plate.pet_id)
      .single();
    pet = data;
  } else {
    // Fallback: old auto-generated qr_id (backward compat for existing pets)
    const { data } = await supabase
      .from("pets")
      .select("*, owner:profiles(full_name, email, phone)")
      .eq("qr_id", qrId)
      .maybeSingle();
    pet = data;
  }

  if (!pet) notFound();

  return <PetPublicClient pet={pet} />;
}
