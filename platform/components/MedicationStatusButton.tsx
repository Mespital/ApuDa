"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MedicationStatusButton({
  id,
  active
}: {
  id: string;
  active: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("medications")
      .update({ active: !active })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    window.location.reload();
  }

  return (
    <span className="recordDeleteWrap">
      <button
        className="textButton"
        type="button"
        disabled={saving}
        onClick={() => void toggle()}
      >
        {saving ? "변경 중..." : active ? "복용 종료로 변경" : "복용 중으로 변경"}
      </button>
      {message && <small className="formMessage">{message}</small>}
    </span>
  );
}
