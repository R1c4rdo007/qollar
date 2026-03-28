import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewPostClient from "./NewPostClient";

export default async function NewPostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/community/new");

  const { data: pets } = await supabase
    .from("pets").select("id, name, species").eq("owner_id", user.id);

  return <NewPostClient userId={user.id} pets={pets || []} />;
}
