import { redirect } from "next/navigation";
import OnboardingForm from "@/components/OnboardingForm";
import { getActiveProfile } from "@/lib/active-profile";

export default async function OnboardingPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const isAdditional = mode === "add";
  const { user, profile } = await getActiveProfile();

  if (!user) {
    redirect("/login");
  }

  if (profile && !isAdditional) {
    redirect("/my");
  }

  return <OnboardingForm isAdditional={isAdditional} />;
}
