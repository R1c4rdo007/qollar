import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PetForm from "@/components/pet/PetForm";

export default async function NewPetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-700/15 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-orange-600/10 blur-[100px]" />
      </div>
      <PetForm userId={user.id} />
    </div>
  );
}
