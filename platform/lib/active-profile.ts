import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ActiveProfile = {
  id: string;
  display_name: string;
  relationship_to_user: string;
  profile_type: string;
};

export async function getActiveProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, profiles: [] as ActiveProfile[] };
  }

  const { data } = await supabase
    .from("profiles")
    .select("id,display_name,relationship_to_user,profile_type")
    .order("created_at", { ascending: true });

  const profiles = (data ?? []) as ActiveProfile[];
  if (!profiles.length) {
    return { user, profile: null, profiles };
  }

  const cookieStore = await cookies();
  const activeId = cookieStore.get("apuda_active_profile")?.value;
  const profile = profiles.find((item) => item.id === activeId) ?? profiles[0];

  return { user, profile, profiles };
}
