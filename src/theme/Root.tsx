import React, { useCallback, useEffect, useRef } from "react";
import { useLocation } from "@docusaurus/router";

export default function Root({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isCheckingRef = useRef(false);

  const syncPremiumSession = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    // Avoid overlapping requests when users click rapidly.
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
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
      isCheckingRef.current = false;
    }
  }, []);

  // Re-check premium status on every SPA navigation.
  useEffect(() => {
    syncPremiumSession();
  }, [location.pathname, location.search, syncPremiumSession]);

  // Also re-check on user interactions in case auth state changes mid-page.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    document.addEventListener("click", syncPremiumSession, true);
    return () => {
      document.removeEventListener("click", syncPremiumSession, true);
    };
  }, [syncPremiumSession]);

  return <>{children}</>;
}
