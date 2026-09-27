import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OwnedProfile = {
  id: string;
  display_name: string;
  relationship_to_user: string;
  profile_type: string;
};

export async function getProfileContext() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, relationship_to_user, profile_type")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const profiles = (data ?? []) as OwnedProfile[];

  if (profiles.length === 0) {
    redirect("/onboarding");
  }

  const cookieStore = await cookies();
  const requestedId = cookieStore.get("apuda_profile_id")?.value;
  const active =
    profiles.find((profile) => profile.id === requestedId) ?? profiles[0];

  return { supabase, user, profiles, active };
}
