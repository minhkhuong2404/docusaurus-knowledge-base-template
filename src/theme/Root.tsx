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

  return (
    <>
      {/* Hidden SVG filter — squiggly distortion for search bar border */}
      <svg
        aria-hidden="true"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      >
        <defs>
          <filter id="search-squiggle" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018 0.025"
              numOctaves="3"
              seed="4"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.018 0.025;0.025 0.018;0.018 0.025"
                dur="8s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="4"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="space-decorations">
        {/* Planets */}
        <div className="planet mercury" />
        <div className="planet venus" />
        <div className="planet earth" />
        <div className="planet mars" />
        <div className="planet jupiter" />
        <div className="planet saturn" />
        <div className="planet uranus" />
        <div className="planet neptune" />

        {/* Satellites & Space Stations */}
        <div className="satellite iss" />
        <div className="satellite sputnik" />

        {/* Comets & Meteors */}
        <div className="comet comet-1" />
        <div className="comet comet-2" />
        <div className="comet comet-3" />
        <div className="comet comet-4" />

        {/* Rockets */}
        <div className="rocket-bg rocket-1" />
        <div className="rocket-bg rocket-2" />
        <div className="rocket-bg rocket-3" />

        {/* Dark Mode Moon */}
        <div className="moon" />

        {/* Light Mode Tropical Nature */}
        <div className="sun" />
        <div className="nature-item leaf-1" />
        <div className="nature-item leaf-2" />
        <div className="nature-item leaf-3" />
        <div className="nature-item flower-1" />
        <div className="nature-item flower-2" />
        <div className="nature-item flower-3" />
        <div className="nature-item palm-1" />
        <div className="nature-item palm-2" />
        <div className="nature-item hibiscus-1" />
        <div className="nature-item hibiscus-2" />
        <div className="nature-item coconut-1" />
        <div className="nature-item wave-1" />
        <div className="nature-item wave-2" />
        <div className="nature-item parrot-1" />
        <div className="nature-item butterfly-1" />
        <div className="nature-item butterfly-2" />

        {/* Dark Mode Universal Elements */}
        <div className="universal-item galaxy-1" />
        <div className="universal-item galaxy-2" />
        <div className="universal-item nebula-1" />
        <div className="universal-item nebula-2" />
        <div className="universal-item shooting-star-1" />
        <div className="universal-item shooting-star-2" />
        <div className="universal-item constellation-1" />
        <div className="universal-item constellation-2" />
      </div>
      <div className="navbar-space-decorations">
        {/* Header Planets */}
        <div className="header-planet earth-h" />
        <div className="header-planet mars-h" />
        <div className="header-planet venus-h" />

        {/* Header Moon */}
        <div className="header-moon-h" />

        {/* Header Comets */}
        <div className="comet header-comet-1" />
        <div className="comet header-comet-2" />

        {/* Header Rockets & Satellites */}
        <div className="header-rocket h-rocket-1" />
        <div className="header-rocket h-rocket-2" />
        <div className="header-satellite h-sat" />

        {/* Light Mode Header Tropical */}
        <div className="header-sun" />
        <div className="header-leaf h-leaf-1" />
        <div className="header-leaf h-leaf-2" />
        <div className="header-flower h-flower-1" />
        <div className="header-flower h-flower-2" />
        <div className="header-tropical h-palm" />
        <div className="header-tropical h-hibiscus" />
        <div className="header-tropical h-wave" />
        <div className="header-tropical h-butterfly" />

        {/* Dark Mode Header Universal */}
        <div className="header-universal h-galaxy" />
        <div className="header-universal h-nebula" />
        <div className="header-universal h-shooting" />
      </div>
      {children}
    </>
  );
}
