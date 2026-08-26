import React, { useEffect, useRef } from "react";
import { useLocation } from "@docusaurus/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { UserProgressProvider } from "../context/UserProgressContext";
import PremiumGate from "../components/PremiumGate";
import ScrollProgressButton from "../components/ScrollProgressButton";
import LevelUpToast from "../components/gamification/LevelUpToast";

const PREMIUM_STATE_KEY = "premium_session_state";

type PremiumState = "logged_in" | "logged_out";

// Must mirror the PREMIUM_PATHS array in cloudflare-worker.js.
// The Worker enforces this at the edge in production; this client-side check
// acts as defense-in-depth (local dev, direct GitHub Pages access, etc.).
const CLIENT_PREMIUM_PREFIXES = [
  '/company/',
  '/technical-knowledge/dsa/leetcode-companywise/',
];

function isPremiumPath(pathname: string): boolean {
  return CLIENT_PREMIUM_PREFIXES.some(
    (prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix)
  );
}


function applyPremiumNavState(_state: PremiumState) {
  // Managed by CustomUserNavbarItem React component
}

function readCachedPremiumState(): PremiumState | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (auth?.currentUser) {
    return "logged_in";
  }

  const googleUser = window.localStorage.getItem("google_user") || window.sessionStorage.getItem("google_user");
  if (googleUser) {
    return "logged_in";
  }

  const cached = window.localStorage.getItem(PREMIUM_STATE_KEY) || window.sessionStorage.getItem(PREMIUM_STATE_KEY);
  if (cached === "logged_in" || cached === "logged_out") {
    return cached as PremiumState;
  }

  return null;
}

export default function Root({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isCheckingRef = useRef(false);

  // Track Firebase auth state → update localStorage & sessionStorage so the navbar item
  // can read it synchronously on mount (avoids flash of wrong state).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        applyPremiumNavState("logged_in");
        window.localStorage.setItem(PREMIUM_STATE_KEY, "logged_in");
        window.sessionStorage.setItem(PREMIUM_STATE_KEY, "logged_in");
      } else {
        applyPremiumNavState("logged_out");
        window.localStorage.removeItem(PREMIUM_STATE_KEY);
        window.sessionStorage.removeItem(PREMIUM_STATE_KEY);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const cachedState = readCachedPremiumState();
    if (cachedState) {
      applyPremiumNavState(cachedState);
    }
  }, [location.pathname]);

  const isPremiumRoute = isPremiumPath(location.pathname);


  return (
    <>
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
      <UserProgressProvider>
        <LevelUpToast />
        <ScrollProgressButton />
        {isPremiumRoute ? <PremiumGate>{children}</PremiumGate> : children}
      </UserProgressProvider>
    </>
  );
}
