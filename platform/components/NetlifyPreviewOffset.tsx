"use client";

import { useEffect } from "react";

export default function NetlifyPreviewOffset() {
  useEffect(() => {
    const isNetlifyPreview =
      window.location.hostname.endsWith(".netlify.app") ||
      window.location.hostname.includes("--my-apuda-beta.netlify.app");

    document.documentElement.classList.toggle("netlifyPreviewHost", isNetlifyPreview);

    return () => {
      document.documentElement.classList.remove("netlifyPreviewHost");
    };
  }, []);

  return null;
}
