"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";

type AuthButtonProps = {
  locale: Locale;
  dictionary: Dictionary;
  isAuthenticated: boolean;
};

export function AuthButton({ locale, dictionary, isAuthenticated }: AuthButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || dictionary.auth.messages.genericError);
        return;
      }

      router.refresh();
    } catch (error) {
      toast.error(dictionary.auth.messages.serverError);
    }
  };

  if (isAuthenticated) {
    return (
      <Button variant="outline" onClick={handleLogout}>
        {dictionary.auth.header.logout}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => router.push(`/${locale}/auth`)}
    >
      {dictionary.auth.header.login}
    </Button>
  );
}

