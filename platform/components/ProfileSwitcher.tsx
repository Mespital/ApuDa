"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Profile = {
  id: string;
  display_name: string;
  relationship_to_user: string;
};

export default function ProfileSwitcher({
  profiles,
  activeId
}: {
  profiles: Profile[];
  activeId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function selectProfile(profileId: string) {
    setLoading(true);
    await fetch("/api/profile/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId })
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <select
      className="profileSelect"
      value={activeId}
      disabled={loading}
      onChange={(event) => selectProfile(event.target.value)}
      aria-label="관리할 프로필 선택"
    >
      {profiles.map((profile) => (
        <option value={profile.id} key={profile.id}>
          {profile.display_name}
        </option>
      ))}
    </select>
  );
}
