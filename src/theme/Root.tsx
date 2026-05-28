import React, { useCallback, useEffect, useRef } from "react";
import { useLocation } from "@docusaurus/router";

const PREMIUM_STATE_KEY = "premium_session_state";

type PremiumState = "logged_in" | "logged_out";

function isPremiumPath(pathname: string): boolean {
  return pathname === "/premium" || pathname.startsWith("/premium/");
}

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
  const [isClient, setIsClient] = React.useState(false);
  const [authState, setAuthState] = React.useState<PremiumState | null>(null);

  useEffect(() => {
    setIsClient(true);
    setAuthState(readCachedPremiumState());
  }, []);

  const redirectToLogin = useCallback(() => {
    const returnTo = `${location.pathname}${location.search}`;
    const loginUrl = `/login?returnTo=${encodeURIComponent(returnTo)}`;
    if (window.location.pathname !== "/login") {
      // Use replace() so browser Back won't bring users to a protected page snapshot.
      window.location.replace(loginUrl);
    }
  }, [location.pathname, location.search]);

  const enforcePremiumRouteAuth = useCallback(
    (state: PremiumState) => {
      const isPremiumRoute = isPremiumPath(location.pathname);
      const isLoginRoute = location.pathname === "/login";

      if (!isPremiumRoute || isLoginRoute || state === "logged_in") {
        return;
      }

      redirectToLogin();
    },
    [location.pathname, redirectToLogin],
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
    const isPremiumRoute = isPremiumPath(location.pathname);

    if (cachedState) {
      setAuthState(cachedState);
    }

    if (isPremiumRoute && cachedState !== "logged_in") {
      enforcePremiumRouteAuth("logged_out");
      return;
    }

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
      setAuthState(nextState);
      applyPremiumNavState(nextState);
      enforcePremiumRouteAuth(nextState);
    } catch {
      window.sessionStorage.setItem(PREMIUM_STATE_KEY, "logged_out");
      setAuthState("logged_out");
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

    // Re-check auth when page is restored from browser cache or when tab regains focus.
    const handlePageShow = () => syncPremiumSession();
    const handleFocus = () => syncPremiumSession();
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("click", syncPremiumSession, true);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
    };
  }, [syncPremiumSession]);

  const isPremiumRoute = isPremiumPath(location.pathname);
  if (isPremiumRoute) {
    const showBlur = authState !== "logged_in";
    if (showBlur) {
      return (
        <div style={{
          filter: "blur(16px)",
          pointerEvents: "none",
          userSelect: "none",
          transition: "filter 0.5s ease-in-out",
        }}>
          {children}
        </div>
      );
    }
  }

  return <>{children}</>;
}
