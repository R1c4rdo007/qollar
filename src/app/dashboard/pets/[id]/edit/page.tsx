import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PetEditClient from "./PetEditClient";

export default async function EditPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: pet }, { data: profile }] = await Promise.all([
    supabase.from("pets").select("*").eq("id", id).eq("owner_id", user.id).single(),
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).single(),
  ]);

  if (!pet) notFound();

  return (
    <PetEditClient
      pet={pet}
      userId={user.id}
      ownerPhone={profile?.phone || ""}
      ownerName={profile?.full_name || ""}
    />
  );
}
