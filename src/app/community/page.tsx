import { createClient } from "@/lib/supabase/server";
import CommunityClient from "./CommunityClient";

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: posts },
    { data: stories },
    { data: userLikes },
    { data: userPets },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("*, author:profiles(id, full_name, avatar_url), pet:pets(id, name, species)")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("stories")
      .select("*, author:profiles(id, full_name, avatar_url), pet:pets(id, name, species)")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
    user
      ? supabase.from("post_likes").select("post_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
    user
      ? supabase.from("pets").select("id, name").eq("owner_id", user.id)
      : Promise.resolve({ data: [] }),
    user
      ? supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <CommunityClient
      posts={posts || []}
      stories={stories || []}
      currentUserId={user?.id || null}
      currentUserAvatar={profile?.avatar_url || null}
      currentUserName={profile?.full_name || null}
      likedPostIds={(userLikes || []).map((l: { post_id: string }) => l.post_id)}
      userPets={(userPets || []) as { id: string; name: string }[]}
    />
  );
}
