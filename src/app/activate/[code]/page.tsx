import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActivateClient from "./ActivateClient";

export default async function ActivatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/activate/${code}`);

  const { data: plate } = await supabase
    .from("qr_plates")
    .select("*")
    .eq("plate_code", code)
    .single();

  // Already active → redirect to the pet's public page via plate_code
  if (plate?.status === "active" && plate?.pet_id) {
    redirect(`/pet/${code}`);
  }

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, species, photos")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <ActivateClient
      plateCode={code}
      plate={plate}
      pets={pets || []}
      userId={user.id}
    />
  );
}
