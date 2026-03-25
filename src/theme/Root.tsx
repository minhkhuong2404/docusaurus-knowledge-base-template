import React, { useCallback, useEffect, useRef } from "react";
import { useLocation } from "@docusaurus/router";

const PREMIUM_STATE_KEY = "premium_session_state";

type PremiumState = "logged_in" | "logged_out";

function applyPremiumNavState(state: PremiumState) {
  const isLoggedIn = state === "logged_in";
  const root = document.documentElement;

  root.style.setProperty(
    "--premium-nav-label",
    isLoggedIn ? '"💎 Premium unlocked"' : '"💎 Premium login"',
  );
  root.style.setProperty(
    "--premium-nav-color",
    isLoggedIn ? "var(--ifm-color-success)" : "var(--ifm-navbar-link-color)",
  );
  root.style.setProperty(
    "--premium-nav-hover-color",
    isLoggedIn
      ? "var(--ifm-color-success)"
      : "var(--ifm-navbar-link-hover-color)",
  );
  root.style.setProperty("--premium-nav-weight", isLoggedIn ? "600" : "500");
}

function readCachedPremiumState(): PremiumState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const cached = window.sessionStorage.getItem(PREMIUM_STATE_KEY);
  if (cached === "logged_in" || cached === "logged_out") {
    return cached;
  }

  return null;
}

export default function Root({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isCheckingRef = useRef(false);

  const enforcePremiumRouteAuth = useCallback(
    (state: PremiumState) => {
      const isPremiumRoute = location.pathname.startsWith("/premium/");
      const isLoginRoute = location.pathname === "/login";

      if (!isPremiumRoute || isLoginRoute || state === "logged_in") {
        return;
      }

      const returnTo = `${location.pathname}${location.search}`;
      const loginUrl = `/login?returnTo=${encodeURIComponent(returnTo)}`;
      if (window.location.pathname !== "/login") {
        window.location.href = loginUrl;
      }
    },
    [location.pathname, location.search],
  );

  useEffect(() => {
    const cachedState = readCachedPremiumState();
    if (cachedState) {
      applyPremiumNavState(cachedState);
    }
  }, []);

  useEffect(() => {
    // On each navigation, enforce quickly with cached state before async check completes.
    const cachedState = readCachedPremiumState();
    if (cachedState) {
      enforcePremiumRouteAuth(cachedState);
    }
  }, [location.pathname, location.search, enforcePremiumRouteAuth]);

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
      const nextState: PremiumState = data.loggedIn
        ? "logged_in"
        : "logged_out";
      window.sessionStorage.setItem(PREMIUM_STATE_KEY, nextState);
      applyPremiumNavState(nextState);
      enforcePremiumRouteAuth(nextState);
    } catch {
      window.sessionStorage.setItem(PREMIUM_STATE_KEY, "logged_out");
      applyPremiumNavState("logged_out");
      enforcePremiumRouteAuth("logged_out");
    } finally {
      isCheckingRef.current = false;
    }
  }, [enforcePremiumRouteAuth]);

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
