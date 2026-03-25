import React, { useEffect } from "react";

export default function Root({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isChecking = false;

    const syncPremiumSession = async () => {
      // Avoid overlapping requests when users click rapidly.
      if (isChecking) {
        return;
      }

      isChecking = true;
      try {
        const response = await fetch("/api/me");
        const data = await response.json();
        if (data.loggedIn) {
          document.documentElement.classList.add("user-logged-in");
        } else {
          document.documentElement.classList.remove("user-logged-in");
        }
      } catch {
        document.documentElement.classList.remove("user-logged-in");
      } finally {
        isChecking = false;
      }
    };

    // Initial sync when the app mounts.
    syncPremiumSession();

    // Re-check premium status every time the user clicks on the page.
    document.addEventListener("click", syncPremiumSession, true);

    return () => {
      document.removeEventListener("click", syncPremiumSession, true);
    };
  }, []);

  return <>{children}</>;
}
