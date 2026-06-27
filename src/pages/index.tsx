import React, { useEffect, useRef, useState } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import DailyJavaQuiz from '../components/DailyJavaQuiz';
import DailySpringBootQuiz from '../components/DailySpringBootQuiz';
import LeetCodeDaily from '../components/LeetCodeDaily';

/* ─────────────────────────────────────────────────────────────────────────────
   Global CSS injected into <head> via <style> — only active on this page
───────────────────────────────────────────────────────────────────────────── */
const GLOBAL_STYLES = `
  /* ── Hide navbar search & premium button on landing page ── */
  .lp-active .premium-nav-button,
  .lp-active .DocSearch-Button,
  .lp-active [class*="searchBox"],
  .lp-active [class*="navbarSearchContainer"] {
    display: none !important;
  }

  /* ── Keyframes ── */
  @keyframes lp-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
  @keyframes lp-fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-slideIn {
    from { opacity: 0; transform: translateX(-16px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes lp-shimmer {
    0%   { background-position: -400% center; }
    100% { background-position: 400% center; }
  }
  @keyframes lp-bgOrb {
    0%, 100% { transform: scale(1) translate(0, 0); }
    33%      { transform: scale(1.12) translate(20px, -15px); }
    66%      { transform: scale(0.92) translate(-15px, 20px); }
  }
  @keyframes lp-cardReveal {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes lp-borderGlow {
    0%, 100% { box-shadow: 0 0 12px -4px rgba(74,222,128,0.0); }
    50%      { box-shadow: 0 0 22px -4px rgba(74,222,128,0.25); }
  }
  @keyframes lp-h1Enter {
    from { opacity: 0; transform: translateY(20px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }
  @keyframes lp-barGrow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }

  /* ── Shimmer title ── */
  .lp-hero-h1 {
    display: block;
    width: 100%;
    text-align: center;
    font-size: clamp(2.94rem, 8vw, 5.56rem);
    font-weight: 900;
    line-height: 1.2;
    letter-spacing: -0.03em;
    margin: 0 auto 1rem;
    padding-bottom: 1.25rem; /* space for the accent bar */
    background: linear-gradient(
      90deg,
      #4ade80 0%,
      #86efac 22%,
      #4ade80 44%,
      #86efac 66%,
      #4ade80 88%,
      #86efac 100%
    );
    background-size: 250% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: lp-h1Enter 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s both,
               lp-shimmer 5s linear 0.85s infinite;
  }
  /* accent bar — use a separate centered div, not ::after,
     to avoid transform conflicts with the entrance animation */
  .lp-hero-bar {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  .lp-hero-bar span {
    display: block;
    width: 80px;
    height: 3px;
    border-radius: 999px;
    background: linear-gradient(90deg, #4ade80, #86efac);
    transform: scaleX(0);
    transform-origin: center;
    animation: lp-barGrow 0.6s cubic-bezier(0.22,1,0.36,1) 0.85s both;
  }

  /* ── Word-by-word hero banner ── */
  .lp-wbw-wrap {
    min-height: clamp(6.25rem, 13.75vw, 11.25rem);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 0.75rem;
  }
  .lp-wbw-h1 {
    display: block;
    text-align: center;
    font-size: clamp(3.00rem, 6.75vw, 7.00rem) !important;
    font-weight: 900;
    line-height: 1.15;
    letter-spacing: -0.04em;
    margin: 0;
    padding: 0 1rem;
  }
  .lp-wbw {
    display: inline-block;
    margin: 0 0.18em;
    background: linear-gradient(
      90deg,
      #4ade80 0%, #86efac 25%, #22d3ee 55%, #86efac 80%, #4ade80 100%
    );
    background-size: 250% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: lp-shimmer 14s linear infinite;
    transition: opacity 0.32s cubic-bezier(0.22,1,0.36,1),
                transform 0.32s cubic-bezier(0.22,1,0.36,1),
                filter 0.32s ease;
  }
  .lp-wbw-off {
    opacity: 0;
    transform: translateY(16px);
    filter: blur(5px);
  }
  .lp-wbw-on {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }

  /* ── Eyebrow fade-up ── */
  .lp-eyebrow   { animation: lp-fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.0s both; }
  .lp-eyebrow-2 { animation: lp-fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.08s both; }
  .lp-sub       { animation: lp-fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.5s both; }
  .lp-ctas      { animation: lp-fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.68s both; }

  /* ── Scroll-reveal cards ── */
  .lp-card-hidden {
    opacity: 0;
    transform: translateY(20px) scale(0.97);
  }
  .lp-card-visible {
    opacity: 1;
    transform: translateY(0) scale(1);
    transition: opacity 0.5s cubic-bezier(0.22,1,0.36,1),
                transform 0.5s cubic-bezier(0.22,1,0.36,1);
  }

  /* ── Card hover ── */
  .lp-hcard {
    transition: transform 0.22s cubic-bezier(0.22,1,0.36,1),
                box-shadow 0.22s ease,
                border-color 0.22s ease !important;
  }
  .lp-hcard:hover {
    transform: translateY(-4px) scale(1.015) !important;
    box-shadow: 0 10px 32px -8px rgba(74,222,128,0.28),
                0 0 0 1px rgba(74,222,128,0.3) !important;
    border-color: rgba(74,222,128,0.4) !important;
    text-decoration: none;
  }

  /* ── CTA button hover ── */
  .lp-cta-primary {
    transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  }
  .lp-cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 32px -6px rgba(74,222,128,0.65) !important;
  }
  .lp-cta-secondary {
    transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
  }
  .lp-cta-secondary:hover {
    transform: translateY(-2px);
    background: rgba(74,222,128,0.12) !important;
    border-color: rgba(74,222,128,0.5) !important;
  }

  /* ── Stats counter ── */
  .lp-stat-num {
    font-size: 3.25rem;
    font-weight: 900;
    line-height: 1;
    background: var(--gradient-brand);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: lp-fadeUp 0.5s ease both;
  }

  /* ── Animated background orbs ── */
  .lp-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    animation: lp-bgOrb 12s ease-in-out infinite;
  }

  /* ── Section heading ── */
  .lp-section-label {
    font-size: 0.98rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--brand-blue);
    margin-bottom: 0.5rem;
  }
  .lp-section-title {
    font-size: clamp(2.25rem, 4.38vw, 3.25rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
    margin-bottom: 0.75rem;
    background: var(--gradient-brand);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  /* ── Global body-text scale-up for the landing page ── */
  .lp-root {
    font-size: 1.35rem; /* bumps all relative rem sizes ~8% */
    position: relative;
    min-height: 100vh;
    overflow-x: hidden;
    background: transparent;
  }

  /* ── Cosmic backdrop (fixed, behind content) ── */
  .lp-cosmos {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .lp-cosmos-base {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 120% 85% at 50% -15%, rgba(45, 212, 191, 0.14) 0%, transparent 52%),
      radial-gradient(ellipse 95% 70% at 100% 38%, rgba(139, 92, 246, 0.11) 0%, transparent 48%),
      radial-gradient(ellipse 85% 65% at 0% 78%, rgba(74, 222, 128, 0.07) 0%, transparent 42%),
      linear-gradient(180deg, #04060f 0%, #0a1020 38%, #0c1526 100%);
  }
  [data-theme="light"] .lp-cosmos-base {
    background:
      radial-gradient(ellipse 120% 85% at 50% -12%, rgba(45, 160, 120, 0.09) 0%, transparent 52%),
      radial-gradient(ellipse 95% 70% at 100% 35%, rgba(110, 90, 190, 0.07) 0%, transparent 48%),
      linear-gradient(180deg, #e4eaf4 0%, #f2f6fb 45%, #e8eef6 100%);
  }
  .lp-cosmos-nebula {
    position: absolute;
    border-radius: 50%;
    filter: blur(76px);
    opacity: 0.5;
    animation: lp-nebulaDrift 26s ease-in-out infinite;
  }
  [data-theme="light"] .lp-cosmos-nebula {
    opacity: 0.32;
    filter: blur(64px);
  }
  .lp-cosmos-nebula--a {
    width: min(58vw, 540px);
    height: min(58vw, 540px);
    top: 5%;
    right: -10%;
    background: rgba(34, 197, 211, 0.14);
  }
  .lp-cosmos-nebula--b {
    width: min(52vw, 500px);
    height: min(52vw, 500px);
    bottom: 8%;
    left: -14%;
    background: rgba(139, 92, 246, 0.12);
    animation-delay: -11s;
  }
  [data-theme="light"] .lp-cosmos-nebula--a {
    background: rgba(34, 150, 130, 0.09);
  }
  [data-theme="light"] .lp-cosmos-nebula--b {
    background: rgba(115, 95, 185, 0.08);
  }
  @keyframes lp-nebulaDrift {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-22px, 16px) scale(1.04); }
  }
  .lp-cosmos-stars {
    position: absolute;
    inset: 0;
    opacity: 0.55;
    animation: lp-twinkle 8s ease-in-out infinite;
  }
  [data-theme="light"] .lp-cosmos-stars {
    opacity: 0.22;
  }
  /* Layer 1 — tiny dense field (small tile, lots of repetition) */
  .lp-cosmos-stars--1 {
    background-image:
      radial-gradient(1.2px 1.2px at 24px 36px, rgba(255,255,255,0.9), transparent),
      radial-gradient(1px 1px at 148px 92px, rgba(255,255,255,0.65), transparent),
      radial-gradient(1.5px 1.5px at 88px 172px, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 204px 48px, rgba(255,255,255,0.55), transparent),
      radial-gradient(1px 1px at 12px 200px, rgba(255,255,255,0.5), transparent),
      radial-gradient(1.2px 1.2px at 188px 210px, rgba(255,255,255,0.7), transparent),
      radial-gradient(0.9px 0.9px at 66px 130px, rgba(255,255,255,0.55), transparent),
      radial-gradient(1.1px 1.1px at 174px 154px, rgba(200,230,255,0.6), transparent),
      radial-gradient(0.8px 0.8px at 108px 52px, rgba(255,255,255,0.48), transparent),
      radial-gradient(1.3px 1.3px at 50px 88px, rgba(255,255,255,0.72), transparent),
      radial-gradient(0.9px 0.9px at 220px 122px, rgba(220,240,255,0.52), transparent),
      radial-gradient(1px 1px at 130px 230px, rgba(255,255,255,0.6), transparent);
    background-size: 236px 252px;
  }
  /* Layer 2 — medium field, slightly larger tile, offset animation */
  .lp-cosmos-stars--2 {
    background-image:
      radial-gradient(1px 1px at 60px 24px, rgba(200,230,255,0.6), transparent),
      radial-gradient(1.2px 1.2px at 120px 140px, rgba(255,255,255,0.65), transparent),
      radial-gradient(1px 1px at 200px 88px, rgba(255,255,255,0.5), transparent),
      radial-gradient(1.5px 1.5px at 40px 160px, rgba(255,255,255,0.75), transparent),
      radial-gradient(1px 1px at 176px 188px, rgba(220,240,255,0.55), transparent),
      radial-gradient(1.3px 1.3px at 250px 56px, rgba(255,255,255,0.62), transparent),
      radial-gradient(0.9px 0.9px at 90px 210px, rgba(255,255,255,0.52), transparent),
      radial-gradient(1.1px 1.1px at 310px 145px, rgba(200,220,255,0.58), transparent),
      radial-gradient(1px 1px at 14px 80px, rgba(255,255,255,0.48), transparent),
      radial-gradient(1.4px 1.4px at 280px 220px, rgba(255,255,255,0.68), transparent);
    background-size: 344px 276px;
    animation-duration: 11s;
    animation-direction: alternate-reverse;
    opacity: 0.42;
  }
  /* Layer 3 — sparse bright accent stars, slow independent pulse */
  .lp-cosmos-stars--3 {
    background-image:
      radial-gradient(2px 2px at 72px 46px, rgba(255,255,255,0.9), transparent),
      radial-gradient(2.2px 2.2px at 246px 178px, rgba(200,240,255,0.85), transparent),
      radial-gradient(1.8px 1.8px at 402px 94px, rgba(255,255,255,0.8), transparent),
      radial-gradient(2px 2px at 168px 298px, rgba(255,220,200,0.75), transparent),
      radial-gradient(2.5px 2.5px at 524px 52px, rgba(255,255,255,0.88), transparent),
      radial-gradient(1.8px 1.8px at 360px 240px, rgba(220,200,255,0.78), transparent),
      radial-gradient(2px 2px at 106px 360px, rgba(255,255,255,0.72), transparent),
      radial-gradient(2.2px 2.2px at 468px 318px, rgba(200,230,255,0.8), transparent),
      radial-gradient(1.6px 1.6px at 30px 290px, rgba(255,255,200,0.7), transparent),
      radial-gradient(2px 2px at 598px 160px, rgba(255,255,255,0.85), transparent),
      radial-gradient(1.8px 1.8px at 490px 408px, rgba(255,220,180,0.7), transparent),
      radial-gradient(2.2px 2.2px at 320px 440px, rgba(255,255,255,0.78), transparent);
    background-size: 640px 480px;
    animation-duration: 14s;
    animation-delay: -3s;
    opacity: 0.6;
  }
  [data-theme="light"] .lp-cosmos-stars--1,
  [data-theme="light"] .lp-cosmos-stars--2,
  [data-theme="light"] .lp-cosmos-stars--3 {
    background-image:
      radial-gradient(1.2px 1.2px at 24px 36px, rgba(30,60,100,0.5), transparent),
      radial-gradient(1px 1px at 148px 92px, rgba(40,70,110,0.4), transparent),
      radial-gradient(1.5px 1.5px at 88px 172px, rgba(35,65,105,0.45), transparent),
      radial-gradient(1px 1px at 204px 48px, rgba(45,75,115,0.38), transparent),
      radial-gradient(1px 1px at 12px 200px, rgba(35,60,95,0.35), transparent),
      radial-gradient(1.2px 1.2px at 188px 210px, rgba(40,70,108,0.42), transparent),
      radial-gradient(0.9px 0.9px at 66px 130px, rgba(30,55,90,0.38), transparent),
      radial-gradient(1.1px 1.1px at 174px 154px, rgba(50,80,120,0.4), transparent);
  }
  @keyframes lp-twinkle {
    0%, 100% { opacity: 0.35; }
    50%       { opacity: 0.65; }
  }

  /* ── Shooting stars ── */
  .lp-meteor {
    position: absolute;
    height: 1.5px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.92) 55%, rgba(220,240,255,0.55) 100%);
    opacity: 0;
    transform-origin: right center;
    animation: lp-meteorFly 6s ease-in infinite;
    pointer-events: none;
  }
  [data-theme="light"] .lp-meteor {
    background: linear-gradient(90deg, rgba(60,100,180,0), rgba(80,130,200,0.55) 60%, rgba(100,150,220,0.3) 100%);
  }
  @keyframes lp-meteorFly {
    0%   { opacity: 0; transform: rotate(inherit) translateX(0); }
    3%   { opacity: 1; }
    18%  { opacity: 0; transform: rotate(inherit) translateX(-360px); }
    100% { opacity: 0; transform: rotate(inherit) translateX(-360px); }
  }
  /* 25 individual meteors — varied position, angle, width, delay, duration */
  .lp-meteor--1  { width:140px; top:  8%; right: 18%; transform:rotate(-22deg); animation-delay:  0.5s; animation-duration: 5.8s; }
  .lp-meteor--2  { width: 90px; top: 14%; right: 55%; transform:rotate(-17deg); animation-delay:  2.1s; animation-duration: 7.2s; }
  .lp-meteor--3  { width:120px; top:  4%; right: 70%; transform:rotate(-26deg); animation-delay:  3.8s; animation-duration: 6.4s; }
  .lp-meteor--4  { width: 80px; top: 32%; right: 10%; transform:rotate(-14deg); animation-delay:  5.5s; animation-duration: 5.2s; }
  .lp-meteor--5  { width:110px; top: 52%; right: 80%; transform:rotate(-20deg); animation-delay:  7.0s; animation-duration: 6.8s; }
  .lp-meteor--6  { width:160px; top:  2%; right: 38%; transform:rotate(-30deg); animation-delay:  1.4s; animation-duration: 4.9s; }
  .lp-meteor--7  { width: 70px; top: 22%; right: 62%; transform:rotate(-12deg); animation-delay:  9.2s; animation-duration: 8.1s; }
  .lp-meteor--8  { width:130px; top: 42%; right: 28%; transform:rotate(-24deg); animation-delay: 11.0s; animation-duration: 5.6s; }
  .lp-meteor--9  { width: 95px; top: 65%; right: 48%; transform:rotate(-19deg); animation-delay:  4.3s; animation-duration: 7.8s; }
  .lp-meteor--10 { width:175px; top: 10%; right: 84%; transform:rotate(-33deg); animation-delay: 13.5s; animation-duration: 4.6s; }
  .lp-meteor--11 { width: 85px; top: 75%; right:  5%; transform:rotate(-11deg); animation-delay:  6.7s; animation-duration: 9.0s; }
  .lp-meteor--12 { width:105px; top: 18%; right: 42%; transform:rotate(-28deg); animation-delay: 15.0s; animation-duration: 6.1s; }
  .lp-meteor--13 { width: 60px; top: 88%; right: 65%; transform:rotate(-16deg); animation-delay:  2.8s; animation-duration: 8.5s; }
  .lp-meteor--14 { width:145px; top: 35%; right: 90%; transform:rotate(-22deg); animation-delay: 17.5s; animation-duration: 5.3s; }
  .lp-meteor--15 { width:100px; top: 58%; right: 30%; transform:rotate(-18deg); animation-delay:  8.4s; animation-duration: 7.0s; }
  .lp-meteor--16 { width:115px; top:  6%; right:  5%; transform:rotate(-35deg); animation-delay: 10.8s; animation-duration: 5.9s; }
  .lp-meteor--17 { width: 75px; top: 48%; right: 72%; transform:rotate(-13deg); animation-delay: 19.0s; animation-duration: 8.8s; }
  .lp-meteor--18 { width:155px; top: 25%; right: 15%; transform:rotate(-27deg); animation-delay:  0.9s; animation-duration: 4.4s; }
  .lp-meteor--19 { width: 88px; top: 82%; right: 45%; transform:rotate(-21deg); animation-delay: 14.2s; animation-duration: 7.5s; }
  .lp-meteor--20 { width:125px; top: 12%; right: 95%; transform:rotate(-31deg); animation-delay: 21.0s; animation-duration: 5.0s; }
  .lp-meteor--21 { width: 65px; top: 70%; right: 20%; transform:rotate(-15deg); animation-delay: 16.4s; animation-duration: 9.2s; }
  .lp-meteor--22 { width:135px; top: 45%; right: 58%; transform:rotate(-23deg); animation-delay:  3.2s; animation-duration: 6.6s; }
  .lp-meteor--23 { width: 92px; top: 92%; right: 75%; transform:rotate(-10deg); animation-delay: 18.7s; animation-duration: 8.0s; }
  .lp-meteor--24 { width:170px; top: 30%; right: 35%; transform:rotate(-29deg); animation-delay: 11.6s; animation-duration: 4.8s; }
  .lp-meteor--25 { width: 80px; top: 60%; right: 88%; transform:rotate(-17deg); animation-delay: 22.5s; animation-duration: 7.4s; }

  /* ── Rockets ── */
  .lp-rocket {
    position: absolute;
    pointer-events: none;
    opacity: 0.72;
    filter: drop-shadow(0 0 6px rgba(74,222,128,0.4));
    animation: lp-rocketFloat 9s ease-in-out infinite;
  }
  [data-theme="light"] .lp-rocket {
    opacity: 0.45;
    filter: drop-shadow(0 0 5px rgba(47,143,78,0.3));
  }
  .lp-rocket--a { width: 36px; bottom: 28%; left: 5%;  transform: rotate(-38deg); animation-delay: 0s;   animation-duration: 10s;  }
  .lp-rocket--b { width: 28px; top: 18%;    right: 7%;  transform: rotate(22deg);  animation-delay: -4s;  animation-duration: 12s;  }
  .lp-rocket--c { width: 22px; top: 52%;    left: 12%;  transform: rotate(-55deg); animation-delay: -7s;  animation-duration: 8s;   }
  .lp-rocket--d { width: 32px; bottom: 8%;  right: 18%; transform: rotate(14deg);  animation-delay: -2s;  animation-duration: 11s;  }
  @keyframes lp-rocketFloat {
    0%, 100% { transform: rotate(inherit) translateY(0)   translateX(0); }
    25%      { transform: rotate(inherit) translateY(-8px) translateX(4px); }
    75%      { transform: rotate(inherit) translateY(6px)  translateX(-3px); }
  }
  .lp-cosmos-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 85% 75% at 50% 45%, transparent 0%, rgba(0,0,0,0.35) 100%);
    pointer-events: none;
  }
  [data-theme="light"] .lp-cosmos-vignette {
    background: radial-gradient(ellipse 90% 80% at 50% 50%, transparent 35%, rgba(255,255,255,0.5) 100%);
  }

  .lp-content-layer {
    position: relative;
    z-index: 1;
  }

  /* ── Decorative planets (roadmap sections) ── */
  .lp-planet {
    display: block;
    border-radius: 50%;
    flex-shrink: 0;
    animation: lp-planetFloat 6s ease-in-out infinite;
    box-shadow:
      inset -10px -12px 22px rgba(0, 0, 0, 0.48),
      inset 6px 8px 18px rgba(255, 255, 255, 0.12),
      0 0 18px rgba(0, 0, 0, 0.25);
  }
  .lp-planet--sm {
    width: 44px;
    height: 44px;
  }
  .lp-planet--md {
    width: 56px;
    height: 56px;
  }
  .lp-planet--rocky {
    background: radial-gradient(circle at 32% 26%, #f0d4b8 0%, #c49a6c 18%, #7a5230 52%, #2c1810 100%);
    box-shadow:
      inset -10px -12px 22px rgba(0, 0, 0, 0.5),
      inset 6px 8px 16px rgba(255, 220, 180, 0.18),
      0 0 14px rgba(196, 154, 108, 0.35);
  }
  .lp-planet--ice {
    background: radial-gradient(circle at 30% 24%, #e8ffff 0%, #a5e8f0 22%, #4fb8c9 55%, #1a5c6e 100%);
    box-shadow:
      inset -10px -12px 22px rgba(0, 0, 0, 0.42),
      inset 5px 10px 20px rgba(255, 255, 255, 0.35),
      0 0 20px rgba(79, 184, 201, 0.4);
  }
  .lp-planet--gas {
    background: radial-gradient(circle at 28% 22%, #c4b5fd 0%, #8b5cf6 28%, #5b21b6 58%, #1e1039 100%);
    box-shadow:
      inset -10px -14px 24px rgba(0, 0, 0, 0.55),
      inset 8px 6px 18px rgba(200, 181, 254, 0.22),
      0 0 22px rgba(139, 92, 246, 0.45);
  }
  .lp-planet--dsa {
    background: radial-gradient(circle at 30% 26%, #fef3c7 0%, #fbbf24 25%, #d97706 55%, #78350f 100%);
    box-shadow:
      inset -10px -12px 22px rgba(0, 0, 0, 0.48),
      inset 6px 8px 18px rgba(254, 243, 199, 0.35),
      0 0 20px rgba(251, 191, 36, 0.4);
  }
  .lp-planet--aws {
    background: radial-gradient(circle at 32% 24%, #dbeafe 0%, #60a5fa 30%, #1d4ed8 58%, #0f172a 100%);
    box-shadow:
      inset -10px -12px 22px rgba(0, 0, 0, 0.5),
      inset 6px 8px 18px rgba(219, 234, 254, 0.28),
      0 0 18px rgba(96, 165, 250, 0.45);
  }
  [data-theme="light"] .lp-planet--rocky {
    box-shadow:
      inset -8px -10px 18px rgba(0, 0, 0, 0.28),
      inset 5px 6px 14px rgba(255, 220, 180, 0.25),
      0 0 12px rgba(122, 82, 48, 0.2);
  }
  [data-theme="light"] .lp-planet--ice {
    box-shadow:
      inset -8px -10px 18px rgba(0, 0, 0, 0.22),
      inset 5px 8px 16px rgba(255, 255, 255, 0.5),
      0 0 14px rgba(79, 184, 201, 0.25);
  }
  [data-theme="light"] .lp-planet--gas {
    box-shadow:
      inset -8px -10px 18px rgba(0, 0, 0, 0.25),
      inset 5px 6px 14px rgba(196, 181, 253, 0.35),
      0 0 14px rgba(139, 92, 246, 0.22);
  }
  [data-theme="light"] .lp-planet--dsa {
    box-shadow:
      inset -8px -10px 18px rgba(0, 0, 0, 0.22),
      inset 5px 6px 14px rgba(254, 243, 199, 0.45),
      0 0 14px rgba(217, 119, 6, 0.22);
  }
  [data-theme="light"] .lp-planet--aws {
    box-shadow:
      inset -8px -10px 18px rgba(0, 0, 0, 0.22),
      inset 5px 6px 14px rgba(219, 234, 254, 0.4),
      0 0 14px rgba(29, 78, 216, 0.2);
  }
  @keyframes lp-planetFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  .lp-phase-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .lp-dsa-orbit {
    position: relative;
    width: 72px;
    height: 72px;
    flex-shrink: 0;
  }
  .lp-dsa-orbit-ring {
    position: absolute;
    inset: 2px;
    border-radius: 50%;
    border: 1px dashed rgba(74, 222, 128, 0.28);
    animation: lp-orbitSpin 22s linear infinite;
  }
  [data-theme="light"] .lp-dsa-orbit-ring {
    border-color: rgba(47, 143, 78, 0.22);
  }
  .lp-dsa-orbit .lp-planet {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 52px;
    height: 52px;
    margin-left: -26px;
    margin-top: -26px;
    animation: lp-planetFloat 5.5s ease-in-out infinite;
  }
  @keyframes lp-orbitSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .lp-ringed-wrap {
    position: relative;
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .lp-planet-ring {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 135%;
    height: 38%;
    margin-left: -67.5%;
    margin-top: -19%;
    border: 2px solid rgba(186, 200, 230, 0.42);
    border-radius: 50%;
    transform: rotate(-16deg);
    pointer-events: none;
    box-shadow: 0 0 12px rgba(96, 165, 250, 0.15);
  }
  [data-theme="light"] .lp-planet-ring {
    border-color: rgba(100, 130, 180, 0.35);
  }
  .lp-ringed-wrap .lp-planet {
    position: relative;
    z-index: 1;
  }

  .lp-section-heading-row {
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }
  .lp-section-heading-row .lp-section-heading-text {
    flex: 1 1 260px;
    min-width: 0;
  }

  /* ── Respect reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .lp-wbw, .lp-eyebrow, .lp-eyebrow-2,
    .lp-sub, .lp-ctas, .lp-stat-num, .lp-orb { animation: none !important; }
    .lp-wbw { opacity: 1 !important; transform: none !important; filter: none !important;
               -webkit-text-fill-color: unset; color: #4ade80; }
    .lp-card-hidden { opacity: 1; transform: none; }
    .lp-hcard:hover { transform: none !important; }
    .lp-cosmos-nebula,
    .lp-cosmos-stars,
    .lp-planet,
    .lp-dsa-orbit-ring,
    .lp-meteor,
    .lp-rocket { animation: none !important; }
    .lp-meteor { display: none !important; }
    .lp-cosmos-stars { opacity: 0.45 !important; }
    .lp-cosmos-stars--2 { opacity: 0.35 !important; }
    .lp-cosmos-stars--3 { opacity: 0.5 !important; }
    [data-theme="light"] .lp-cosmos-stars,
    [data-theme="light"] .lp-cosmos-stars--2,
    [data-theme="light"] .lp-cosmos-stars--3 { opacity: 0.22 !important; }
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Hook: watch an element with IntersectionObserver and reveal cards in a grid
───────────────────────────────────────────────────────────────────────────── */
function useRevealGrid(count: number, delay = 60) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [visible, setVisible] = useState<boolean[]>(Array(count).fill(false));

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            // stagger by index position within the GRID, not absolute index
            const gridIdx = idx % count;
            setTimeout(() => {
              setVisible((prev) => {
                const next = [...prev];
                next[idx] = true;
                return next;
              });
            }, gridIdx * delay);
            obs.unobserve(entry.target);
          }
        });
      },
      // Large rootMargin so cards already in the viewport fire on mount
      { threshold: 0.01, rootMargin: "200px 0px 0px 0px" },
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [count, delay]);

  const setRef = (i: number) => (el: HTMLElement | null) => {
    refs.current[i] = el;
    if (el) el.dataset.idx = String(i);
  };

  return { visible, setRef };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Word-by-Word Banner
   Each phrase describes what this knowledge base covers.
   Words reveal left→right, hold, then hide right→left, then next phrase.
───────────────────────────────────────────────────────────────────────────── */
const WBW_PHRASES = [
  ["Prepare", "for", "Tech", "Interviews"],
  ["Master", "DSA", "in", "20", "Weeks"],
  ["Pass", "AWS", "Cloud", "Certs"],
  ["Ace", "System", "Design", "Patterns"],
  ["Read", "Top", "Engineering", "Books"],
  ["Ship", "Better", "Java", "Code", "Faster"],
];

type WBWPhase = "reveal" | "hold" | "hide";
const WORD_DELAY = 160; // ms per word entering / leaving
const HOLD_MS = 1200; // ms all words stay visible

function WordByWordBanner() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [phase, setPhase] = useState<WBWPhase>("reveal");

  const words = WBW_PHRASES[phraseIdx];

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "reveal") {
      if (visibleCount < words.length) {
        t = setTimeout(() => setVisibleCount((c) => c + 1), WORD_DELAY);
      } else {
        t = setTimeout(() => setPhase("hold"), 80);
      }
    } else if (phase === "hold") {
      t = setTimeout(() => setPhase("hide"), HOLD_MS);
    } else {
      if (visibleCount > 0) {
        t = setTimeout(() => setVisibleCount((c) => c - 1), WORD_DELAY);
      } else {
        t = setTimeout(() => {
          setPhraseIdx((i) => (i + 1) % WBW_PHRASES.length);
          setPhase("reveal");
        }, 220);
      }
    }
    return () => clearTimeout(t);
  }, [phase, visibleCount, words.length]);

  return (
    <div className="lp-wbw-wrap">
      <h1 className="lp-wbw-h1">
        {words.map((word, i) => (
          <span
            key={`${phraseIdx}-${i}`}
            className={`lp-wbw ${i < visibleCount ? "lp-wbw-on" : "lp-wbw-off"}`}
          >
            {word}
          </span>
        ))}
      </h1>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────────────────────────── */
const LEARNING_PATHS = [
  {
    icon: "☕",
    name: "Java",
    desc: "Fundamentals, OOP, collections, JVM, concurrency",
    tag: "Core",
    href: "/technical-knowledge/java/java-overview",
  },
  {
    icon: "🌱",
    name: "Spring",
    desc: "Boot, Data JPA, Security, Cloud, Batch",
    tag: "Core",
    href: "/technical-knowledge/spring/spring-overview",
  },
  {
    icon: "🏗️",
    name: "System Design",
    desc: "Distributed systems, CAP, caching, API design",
    tag: "Architecture",
    href: "/system-design",
  },
  {
    icon: "🗄️",
    name: "Database",
    desc: "ACID, indexes, transactions, replication, NoSQL",
    tag: "Core",
    href: "/technical-knowledge/database/",
  },
  {
    icon: "📨",
    name: "Kafka",
    desc: "Topics, partitions, consumers, Kafka Streams",
    tag: "Messaging",
    href: "/technical-knowledge/kafka/intro",
  },
  {
    icon: "⚡",
    name: "Redis",
    desc: "Data structures, pub/sub, caching, Lua scripting",
    tag: "Cache",
    href: "/technical-knowledge/redis/redis-overview",
  },
  {
    icon: "🧱",
    name: "Design Patterns",
    desc: "Creational, structural, behavioral patterns",
    tag: "Core",
    href: "/technical-knowledge/design-patterns/design-patterns-overview",
  },
  {
    icon: "🔒",
    name: "Security",
    desc: "Auth, OAuth2, JWT, JWE, OWASP, encryption",
    tag: "Security",
    href: "/security",
  },
  {
    icon: "🌐",
    name: "Networking",
    desc: "TCP/IP, DNS, TLS, HTTP/2, gRPC, QUIC",
    tag: "Infra",
    href: "/technical-knowledge/networking/",
  },
  {
    icon: "🐧",
    name: "DevOps",
    desc: "Docker, Kubernetes, CI/CD pipelines",
    tag: "Infra",
    href: "/devops",
  },
  {
    icon: "☁️",
    name: "AWS",
    desc: "Lambda, DynamoDB, S3, IAM, ECS, DVA-C02 prep",
    tag: "Cloud",
    href: "/aws",
  },
  {
    icon: "🏦",
    name: "Banking",
    desc: "Payments, SWIFT, NPP, FX, AML/KYC, core banking",
    tag: "Domain",
    href: "/banking",
  },
  {
    icon: "🗃️",
    name: "Git",
    desc: "Branching, rebase, hooks, worktrees, workflows",
    tag: "Tooling",
    href: "/technical-knowledge/git",
  },
];

const INTERVIEW_PHASE_PLANETS = [
  "lp-planet--rocky",
  "lp-planet--ice",
  "lp-planet--gas",
] as const;

const INTERVIEW_PHASES = [
  {
    phase: "Phase 1 — Foundations",
    items: [
      {
        n: 1,
        title: "Java Fundamentals",
        sub: "Types, generics, memory model",
        href: "/technical-knowledge/java/java-fundamentals",
      },
      {
        n: 2,
        title: "OOP Principles",
        sub: "Encapsulation, polymorphism, interfaces",
        href: "/technical-knowledge/java/java-oop",
      },
      {
        n: 3,
        title: "Collections & Concurrency",
        sub: "Map, List, Queue, locks, executors",
        href: "/technical-knowledge/java/java-collections",
      },
      {
        n: 4,
        title: "JVM Internals",
        sub: "GC, class loading, JIT, heap/stack",
        href: "/technical-knowledge/java/java-jvm",
      },
      {
        n: 5,
        title: "SOLID Principles",
        sub: "Single responsibility → dependency inversion",
        href: "/technical-knowledge/solid/",
      },
      {
        n: 6,
        title: "Design Patterns",
        sub: "Creational, structural, behavioral",
        href: "/technical-knowledge/design-patterns/design-patterns-overview",
      },
    ],
  },
  {
    phase: "Phase 2 — System Design",
    items: [
      {
        n: 1,
        title: "Interview Framework",
        sub: "How to approach any design question",
        href: "/technical-knowledge/system-design/interview-framework",
      },
      {
        n: 2,
        title: "Architecture Fundamentals",
        sub: "Monolith vs microservices trade-offs",
        href: "/technical-knowledge/system-design/architecture-fundamentals",
      },
      {
        n: 3,
        title: "Distributed Systems",
        sub: "CAP, consistency, partitioning",
        href: "/technical-knowledge/system-design/distributed-systems",
      },
      {
        n: 4,
        title: "Caching Strategies",
        sub: "Cache-aside, write-through, eviction",
        href: "/technical-knowledge/system-design/caching-strategies",
      },
      {
        n: 5,
        title: "API Design",
        sub: "REST, versioning, rate limiting, idempotency",
        href: "/technical-knowledge/system-design/api-design",
      },
      {
        n: 6,
        title: "Microservices Patterns",
        sub: "Saga, circuit breaker, service mesh",
        href: "/technical-knowledge/system-design/microservices-patterns",
      },
    ],
  },
  {
    phase: "Phase 3 — Domain Depth",
    items: [
      {
        n: 1,
        title: "Database Deep Dive",
        sub: "ACID, indexes, transactions, sharding",
        href: "/technical-knowledge/database/",
      },
      {
        n: 2,
        title: "Kafka Architecture",
        sub: "Topics, offsets, idempotency, streams",
        href: "/technical-knowledge/kafka/intro",
      },
      {
        n: 3,
        title: "Security Patterns",
        sub: "Auth flows, zero trust, secrets",
        href: "/technical-knowledge/system-design/security-patterns",
      },
      {
        n: 4,
        title: "Observability",
        sub: "Metrics, tracing, logging, alerting",
        href: "/technical-knowledge/system-design/observability",
      },
      {
        n: 5,
        title: "Scaling Reads & Writes",
        sub: "CQRS, event sourcing, sharding",
        href: "/technical-knowledge/system-design/scaling-reads",
      },
      {
        n: 6,
        title: "Common Interview Questions",
        sub: "URL shortener, Twitter clone, payment",
        href: "/technical-knowledge/system-design/common-interview-questions",
      },
    ],
  },
];

const DSA_WEEKS = [
  {
    wk: 1,
    title: "Arrays & Prefix Sums",
    sub: "Running totals, subarray sums",
    href: "/technical-knowledge/dsa/week-1-arrays-strings-prefix-sums",
  },
  {
    wk: 2,
    title: "Two Pointers & Sliding Window",
    sub: "Container with water, substrings",
    href: "/technical-knowledge/dsa/week-2-two-pointers-sliding-window",
  },
  {
    wk: 3,
    title: "Linked Lists & Pointers",
    sub: "Reversal, cycle detection, merge",
    href: "/technical-knowledge/dsa/week-3-linked-lists-pointers",
  },
  {
    wk: 4,
    title: "Hash Tables & Sets",
    sub: "Frequency counting, anagram, grouping",
    href: "/technical-knowledge/dsa/week-4-hash-tables-sets",
  },
  {
    wk: 5,
    title: "Stacks, Queues & Monotonic",
    sub: "Parentheses, next greater element",
    href: "/technical-knowledge/dsa/week-5-stacks-queues-monotonic",
  },
  {
    wk: 6,
    title: "Binary Trees & BST",
    sub: "DFS/BFS, LCA, BST operations",
    href: "/technical-knowledge/dsa/week-6-binary-trees-bst",
  },
  {
    wk: 7,
    title: "Graph Foundations",
    sub: "BFS, DFS, adjacency list",
    href: "/technical-knowledge/dsa/week-7-graph-foundations",
  },
  {
    wk: 8,
    title: "Advanced Graphs",
    sub: "Topological sort, Dijkstra",
    href: "/technical-knowledge/dsa/week-8-advanced-graph-concepts",
  },
  {
    wk: 9,
    title: "Binary Search",
    sub: "Search space reduction, rotated arrays",
    href: "/technical-knowledge/dsa/week-9-binary-search",
  },
  {
    wk: 10,
    title: "Recursion & Backtracking",
    sub: "Permutations, N-Queens, subsets",
    href: "/technical-knowledge/dsa/week-10-recursion-backtracking",
  },
  {
    wk: 11,
    title: "Intervals & Sweep Line",
    sub: "Merge intervals, meeting rooms",
    href: "/technical-knowledge/dsa/week-11-intervals-sweep-line",
  },
  {
    wk: 12,
    title: "Heaps & Greedy",
    sub: "K-largest, task scheduling",
    href: "/technical-knowledge/dsa/week-12-heaps-greedy",
  },
  {
    wk: 13,
    title: "Dynamic Programming 1D",
    sub: "Fibonacci, house robber, DP strings",
    href: "/technical-knowledge/dsa/week-13-dynamic-programming-1d",
  },
  {
    wk: 14,
    title: "Dynamic Programming 2D",
    sub: "Grid DP, edit distance, LCS",
    href: "/technical-knowledge/dsa/week-14-dynamic-programming-2d",
  },
  {
    wk: 15,
    title: "Advanced Sliding Window",
    sub: "Variable windows, multi-condition",
    href: "/technical-knowledge/dsa/week-15-advanced-sliding-windows",
  },
  {
    wk: 16,
    title: "Tries & Prefix Trees",
    sub: "Autocomplete, word search",
    href: "/technical-knowledge/dsa/week-16-tries-prefix-trees",
  },
  {
    wk: 17,
    title: "Shortest Paths & MST",
    sub: "Dijkstra, Bellman-Ford, Prim, Kruskal",
    href: "/technical-knowledge/dsa/week-17-shortest-paths-mst",
  },
  {
    wk: 18,
    title: "Disjoint Set Union",
    sub: "Union-find, Kruskal, connectivity",
    href: "/technical-knowledge/dsa/week-18-disjoint-set-union",
  },
  {
    wk: 19,
    title: "Bit Manipulation & Math",
    sub: "XOR tricks, prime sieve",
    href: "/technical-knowledge/dsa/week-19-bit-manipulation-math",
  },
  {
    wk: 20,
    title: "Comprehensive Review",
    sub: "Mock interviews, system + coding",
    href: "/technical-knowledge/dsa/week-20-comprehensive-review-systems",
  },
];

const BOOKS = [
  {
    icon: "🧹",
    track: "Software Craft",
    title: "Clean Code",
    author: "Robert C. Martin",
    focus:
      "Naming, functions, comments, error handling, formatting — 17 chapters",
    href: "/books/clean-code/intro",
  },
  {
    icon: "🏛️",
    track: "Software Craft",
    title: "Clean Architecture",
    author: "Robert C. Martin",
    focus:
      "Dependency rules, component isolation, SOLID, architecture principles",
    href: "/books/clean-architecture/intro",
  },
  {
    icon: "☕",
    track: "Java Mastery",
    title: "Effective Java",
    author: "Joshua Bloch",
    focus:
      "90 best practices: generics, lambdas, APIs, concurrency, serialization",
    href: "/books/effective-java/introduction",
  },
  {
    icon: "📊",
    track: "Deep Foundations",
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    focus:
      "Replication, partitioning, transactions, streams, distributed systems",
    href: "/books/ddia/intro",
  },
  {
    icon: "🔧",
    track: "Architecture",
    title: "Building Microservices",
    author: "Sam Newman",
    focus:
      "Decomposition, resilience, integration, testing, deployment — 16 chapters",
    href: "#",
  },
  {
    icon: "☕",
    track: "Java Certification",
    title: "OCP Java SE 21 Study Guide",
    author: "Boyarsky & Selikoff",
    focus:
      "14 chapters covering exam 1Z0-830: streams, modules, concurrency, I/O",
    href: "/books/ocp",
  },
];

const AWS_DOMAINS = [
  { label: "Development with AWS Services", weight: "32%" },
  { label: "Security", weight: "26%" },
  { label: "Deployment", weight: "24%" },
  { label: "Troubleshooting & Optimization", weight: "18%" },
];

const AWS_TOPICS = [
  {
    n: 1,
    title: "DVA-C02 Roadmap",
    desc: "Full exam roadmap and study strategy",
    href: "/technical-knowledge/aws/dva-c02-roadmap",
  },
  {
    n: 2,
    title: "Lambda",
    desc: "Invocation, cold start, layers, destinations",
    href: "/technical-knowledge/aws/lambda/",
  },
  {
    n: 3,
    title: "DynamoDB",
    desc: "Keys, GSI/LSI, streams, DAX, single-table",
    href: "/technical-knowledge/aws/dynamodb/",
  },
  {
    n: 4,
    title: "API Gateway",
    desc: "REST vs HTTP API, authorizers, throttling",
    href: "/technical-knowledge/aws/api-gateway/",
  },
  {
    n: 5,
    title: "S3",
    desc: "Storage classes, lifecycle, encryption",
    href: "/technical-knowledge/aws/s3/",
  },
  {
    n: 6,
    title: "IAM & Cognito",
    desc: "Roles, policies, STS, user/identity pools",
    href: "/technical-knowledge/aws/iam/",
  },
  {
    n: 7,
    title: "SQS, SNS & EventBridge",
    desc: "Messaging patterns, fan-out, FIFO, Kinesis",
    href: "/technical-knowledge/aws/messaging/sqs",
  },
  {
    n: 8,
    title: "CloudFormation & SAM",
    desc: "IaC, stack management, SAM for serverless",
    href: "/technical-knowledge/aws/cloudformation/",
  },
  {
    n: 9,
    title: "RDS & ElastiCache",
    desc: "Multi-AZ, read replicas, Redis vs Memcached",
    href: "/technical-knowledge/aws/rds-aurora",
  },
  {
    n: 10,
    title: "ECS, ECR & Fargate",
    desc: "Container orchestration, task roles, IAM",
    href: "/technical-knowledge/aws/containers/ecs-ecr",
  },
  {
    n: 11,
    title: "CI/CD (CodePipeline)",
    desc: "Pipelines, buildspec, deploy actions",
    href: "/technical-knowledge/aws/cicd/",
  },
  {
    n: 12,
    title: "CloudWatch & X-Ray",
    desc: "Metrics, alarms, distributed tracing, logs",
    href: "/technical-knowledge/aws/monitoring/cloudwatch",
  },
  {
    n: 13,
    title: "KMS & Secrets Manager",
    desc: "Envelope encryption, rotation, SSM",
    href: "/technical-knowledge/aws/security/kms",
  },
  {
    n: 14,
    title: "Step Functions",
    desc: "Standard vs Express, Map state, callbacks",
    href: "/technical-knowledge/aws/step-functions/",
  },
  {
    n: 15,
    title: "Exam Tips & Mock Exam",
    desc: "Last-minute facts, 50 practice questions",
    href: "/technical-knowledge/aws/exam-tips",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Shared style tokens
───────────────────────────────────────────────────────────────────────────── */
const card: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(74,222,128,0.14)",
  background: "var(--ifm-background-surface-color)",
  textDecoration: "none",
};

const viewAllStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  marginTop: "1.5rem",
  padding: "0.6rem 1.3rem",
  borderRadius: 8,
  border: "1px solid rgba(74,222,128,0.28)",
  color: "var(--brand-blue)",
  background: "rgba(74,222,128,0.05)",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "1.06rem",
  transition: "background 0.2s, transform 0.15s",
};

/* ─────────────────────────────────────────────────────────────────────────────
   Page component
───────────────────────────────────────────────────────────────────────────── */
// @ts-ignore
export default function Home(): React.ReactNode {
  useDocusaurusContext();
  const [activeQuiz, setActiveQuiz] = useState<'java' | 'springboot'>('java');

  /* Add / remove body class so global CSS can target search & premium btn */
  useEffect(() => {
    document.body.classList.add("lp-active");
    return () => document.body.classList.remove("lp-active");
  }, []);

  /* Reveal grids */
  const paths = useRevealGrid(LEARNING_PATHS.length, 45);
  const dsaWks = useRevealGrid(DSA_WEEKS.length, 35);
  const books = useRevealGrid(BOOKS.length, 55);
  const awsTop = useRevealGrid(AWS_TOPICS.length, 40);
  const phases = useRevealGrid(INTERVIEW_PHASES.length, 80);

  return (
    // @ts-ignore
    <Layout
      title="Engineering Knowledge Base"
      description="Practical learning paths for Java engineers — interview prep, DSA training, engineering books, and AWS cloud certification."
    >
      <style>{GLOBAL_STYLES}</style>

      <div className="lp-root">
        <div className="lp-cosmos" aria-hidden>
          <div className="lp-cosmos-base" />
          <div className="lp-cosmos-nebula lp-cosmos-nebula--a" />
          <div className="lp-cosmos-nebula lp-cosmos-nebula--b" />
          <div className="lp-cosmos-stars lp-cosmos-stars--1" />
          <div className="lp-cosmos-stars lp-cosmos-stars--2" />
          <div className="lp-cosmos-stars lp-cosmos-stars--3" />
          {/* Shooting stars */}
          {Array.from({ length: 25 }, (_, i) => (
            <div key={i} className={`lp-meteor lp-meteor--${i + 1}`} />
          ))}
          {/* Rockets */}
          <svg
            className="lp-rocket lp-rocket--a"
            viewBox="0 0 48 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24 4C24 4 12 22 12 42h24C36 22 24 4 24 4z"
              fill="#4ade80"
              opacity="0.9"
            />
            <rect x="16" y="42" width="16" height="18" rx="3" fill="#86efac" />
            <path d="M16 56 L8 70 L16 65z" fill="#4ade80" opacity="0.7" />
            <path d="M32 56 L40 70 L32 65z" fill="#4ade80" opacity="0.7" />
            <ellipse
              cx="24"
              cy="26"
              rx="5"
              ry="6"
              fill="#0a1020"
              opacity="0.55"
            />
            <ellipse
              cx="24"
              cy="26"
              rx="3"
              ry="3.5"
              fill="#22d3ee"
              opacity="0.6"
            />
            <path
              d="M20 68 Q24 80 28 68"
              stroke="#fbbf24"
              strokeWidth="2.5"
              fill="none"
              opacity="0.7"
              strokeLinecap="round"
            />
            <path
              d="M18 71 Q24 86 30 71"
              stroke="#f97316"
              strokeWidth="1.8"
              fill="none"
              opacity="0.5"
              strokeLinecap="round"
            />
          </svg>
          <svg
            className="lp-rocket lp-rocket--b"
            viewBox="0 0 48 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24 4C24 4 12 22 12 42h24C36 22 24 4 24 4z"
              fill="#86efac"
              opacity="0.85"
            />
            <rect x="16" y="42" width="16" height="18" rx="3" fill="#4ade80" />
            <path d="M16 56 L8 70 L16 65z" fill="#86efac" opacity="0.65" />
            <path d="M32 56 L40 70 L32 65z" fill="#86efac" opacity="0.65" />
            <ellipse
              cx="24"
              cy="26"
              rx="5"
              ry="6"
              fill="#0a1020"
              opacity="0.5"
            />
            <ellipse
              cx="24"
              cy="26"
              rx="3"
              ry="3.5"
              fill="#a78bfa"
              opacity="0.65"
            />
            <path
              d="M20 68 Q24 80 28 68"
              stroke="#fbbf24"
              strokeWidth="2.5"
              fill="none"
              opacity="0.65"
              strokeLinecap="round"
            />
            <path
              d="M18 71 Q24 86 30 71"
              stroke="#f97316"
              strokeWidth="1.8"
              fill="none"
              opacity="0.45"
              strokeLinecap="round"
            />
          </svg>
          <svg
            className="lp-rocket lp-rocket--c"
            viewBox="0 0 48 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24 4C24 4 12 22 12 42h24C36 22 24 4 24 4z"
              fill="#22d3ee"
              opacity="0.75"
            />
            <rect x="16" y="42" width="16" height="18" rx="3" fill="#67e8f9" />
            <path d="M16 56 L8 70 L16 65z" fill="#22d3ee" opacity="0.6" />
            <path d="M32 56 L40 70 L32 65z" fill="#22d3ee" opacity="0.6" />
            <ellipse
              cx="24"
              cy="26"
              rx="5"
              ry="6"
              fill="#0a1020"
              opacity="0.5"
            />
            <ellipse
              cx="24"
              cy="26"
              rx="3"
              ry="3.5"
              fill="#4ade80"
              opacity="0.55"
            />
            <path
              d="M20 68 Q24 80 28 68"
              stroke="#fde68a"
              strokeWidth="2.5"
              fill="none"
              opacity="0.65"
              strokeLinecap="round"
            />
            <path
              d="M18 71 Q24 86 30 71"
              stroke="#fb923c"
              strokeWidth="1.8"
              fill="none"
              opacity="0.45"
              strokeLinecap="round"
            />
          </svg>
          <svg
            className="lp-rocket lp-rocket--d"
            viewBox="0 0 48 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24 4C24 4 12 22 12 42h24C36 22 24 4 24 4z"
              fill="#a78bfa"
              opacity="0.8"
            />
            <rect x="16" y="42" width="16" height="18" rx="3" fill="#c4b5fd" />
            <path d="M16 56 L8 70 L16 65z" fill="#a78bfa" opacity="0.65" />
            <path d="M32 56 L40 70 L32 65z" fill="#a78bfa" opacity="0.65" />
            <ellipse
              cx="24"
              cy="26"
              rx="5"
              ry="6"
              fill="#0a1020"
              opacity="0.5"
            />
            <ellipse
              cx="24"
              cy="26"
              rx="3"
              ry="3.5"
              fill="#86efac"
              opacity="0.6"
            />
            <path
              d="M20 68 Q24 80 28 68"
              stroke="#fbbf24"
              strokeWidth="2.5"
              fill="none"
              opacity="0.65"
              strokeLinecap="round"
            />
            <path
              d="M18 71 Q24 86 30 71"
              stroke="#f97316"
              strokeWidth="1.8"
              fill="none"
              opacity="0.45"
              strokeLinecap="round"
            />
          </svg>
          <div className="lp-cosmos-vignette" />
        </div>

        <div className="lp-content-layer">
          {/* ══════════════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════════════ */}
          <section
            style={{
              position: "relative",
              padding: "7rem 1.5rem 5rem",
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            {/* Animated background orbs */}
            <div
              className="lp-orb"
              style={{
                width: 480,
                height: 480,
                top: "-120px",
                left: "10%",
                background: "rgba(74,222,128,0.07)",
                animationDuration: "14s",
              }}
            />
            <div
              className="lp-orb"
              style={{
                width: 360,
                height: 360,
                top: "60px",
                right: "8%",
                background: "rgba(134,239,172,0.05)",
                animationDuration: "18s",
                animationDelay: "-5s",
              }}
            />
            <div
              className="lp-orb"
              style={{
                width: 280,
                height: 280,
                bottom: "-60px",
                left: "30%",
                background: "rgba(74,222,128,0.04)",
                animationDuration: "22s",
                animationDelay: "-9s",
              }}
            />

            {/* Eyebrow */}
            <div
              className="lp-eyebrow"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                fontSize: "0.9rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--brand-blue)",
                background: "rgba(74,222,128,0.1)",
                border: "1px solid rgba(74,222,128,0.28)",
                borderRadius: 999,
                padding: "0.3rem 1rem",
                marginBottom: "1.5rem",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--brand-blue)",
                  boxShadow: "0 0 8px var(--brand-blue)",
                  animation: "lp-pulse 2s ease-in-out infinite",
                  display: "inline-block",
                }}
              />
              Engineering Knowledge Base
            </div>

            {/* Word-by-word banner — cycles site purpose phrases */}
            <WordByWordBanner />

            {/* Sub */}
            <p
              className="lp-sub"
              style={{
                fontSize: "1.38rem",
                lineHeight: 1.65,
                color: "var(--ifm-color-emphasis-700)",
                maxWidth: 620,
                margin: "0 auto 2.5rem",
              }}
            >
              A practical, structured reference for Java backend engineers.
              Covering interview preparation, DSA training, engineering books,
              and cloud certification — all in one place.
            </p>

            {/* CTAs */}
            <div
              className="lp-ctas"
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/docs"
                className="lp-cta-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.85rem 2rem",
                  borderRadius: 9,
                  fontWeight: 700,
                  fontSize: "1.19rem",
                  background: "var(--gradient-brand)",
                  color: "#0a1020",
                  textDecoration: "none",
                  boxShadow: "0 0 22px -6px rgba(74,222,128,0.5)",
                }}
              >
                Start Learning →
              </Link>
              <Link
                to="/technical-knowledge/system-design/interview-framework"
                className="lp-cta-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.85rem 2rem",
                  borderRadius: 9,
                  fontWeight: 700,
                  fontSize: "1.19rem",
                  border: "1px solid rgba(74,222,128,0.35)",
                  color: "var(--brand-blue)",
                  background: "rgba(74,222,128,0.06)",
                  textDecoration: "none",
                }}
              >
                Interview Prep
              </Link>
              <Link
                to="/technical-knowledge/dsa/20-week-dsa-roadmap-intro"
                className="lp-cta-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.85rem 2rem",
                  borderRadius: 9,
                  fontWeight: 700,
                  fontSize: "1.19rem",
                  border: "1px solid rgba(74,222,128,0.35)",
                  color: "var(--brand-blue)",
                  background: "rgba(74,222,128,0.06)",
                  textDecoration: "none",
                }}
              >
                DSA Roadmap
              </Link>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
            STATS STRIP
        ══════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "2.5rem",
              flexWrap: "wrap",
              padding: "2.5rem 1.5rem",
              borderTop: "1px solid rgba(74,222,128,0.1)",
              borderBottom: "1px solid rgba(74,222,128,0.1)",
              background: "rgba(74,222,128,0.04)",
              backdropFilter: "blur(6px)",
            }}
          >
            {[
              { num: "13+", label: "Learning Paths" },
              { num: "20", label: "DSA Weeks" },
              { num: "8", label: "Engineering Books" },
              { num: "15+", label: "AWS Topics" },
              { num: "500+", label: "Pages of Content" },
            ].map(({ num, label }, i) => (
              <div
                key={label}
                style={{
                  textAlign: "center",
                  animation: `lp-fadeUp 0.5s ease ${0.8 + i * 0.08}s both`,
                }}
              >
                <div className="lp-stat-num">{num}</div>
                <div
                  style={{
                    fontSize: "0.94rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--ifm-color-emphasis-600)",
                    marginTop: "0.25rem",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — Learning Paths
        ══════════════════════════════════════════════════════════════════ */}
          <section
            style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem" }}
          >
            <div className="lp-section-label">🗺️ Overview</div>
            <h2 className="lp-section-title">Learning Paths</h2>
            <p
              style={{
                color: "var(--ifm-color-emphasis-700)",
                fontSize: "1.25rem",
                lineHeight: 1.65,
                maxWidth: 580,
                marginBottom: "2.5rem",
              }}
            >
              Choose your domain. Each path builds from fundamentals to
              senior-level topics with practical examples, interview questions,
              and real-world context.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: "1rem",
              }}
            >
              {LEARNING_PATHS.map((p, i) => (
                <Link
                  key={p.name}
                  to={p.href}
                  ref={paths.setRef(i) as any}
                  className={`lp-hcard ${paths.visible[i] ? "lp-card-visible" : "lp-card-hidden"}`}
                  style={{
                    ...card,
                    padding: "1.4rem 1.2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "2rem", lineHeight: 1 }}>
                    {p.icon}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "1.19rem",
                      color: "var(--ifm-font-color-base)",
                    }}
                  >
                    {p.name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.98rem",
                      color: "var(--ifm-color-emphasis-600)",
                      lineHeight: 1.5,
                    }}
                  >
                    {p.desc}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.81rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      padding: "0.18rem 0.55rem",
                      borderRadius: 999,
                      background: "rgba(74,222,128,0.12)",
                      color: "var(--brand-blue)",
                      border: "1px solid rgba(74,222,128,0.22)",
                      alignSelf: "flex-start",
                    }}
                  >
                    {p.tag}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — Interview Prep Roadmap
        ══════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              background: "rgba(74,222,128,0.03)",
              borderTop: "1px solid rgba(74,222,128,0.08)",
              borderBottom: "1px solid rgba(74,222,128,0.08)",
              backdropFilter: "blur(4px)",
            }}
          >
            <section
              style={{
                maxWidth: 1100,
                margin: "0 auto",
                padding: "5rem 1.5rem",
              }}
            >
              <div className="lp-section-label">💼 Interview Prep</div>
              <h2 className="lp-section-title">
                Interview Preparation Roadmap
              </h2>
              <p
                style={{
                  color: "var(--ifm-color-emphasis-700)",
                  fontSize: "1.25rem",
                  lineHeight: 1.65,
                  maxWidth: 580,
                  marginBottom: "2.5rem",
                }}
              >
                A three-phase curriculum for engineers targeting backend, system
                design, and Java/Spring interviews.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "1.25rem",
                  marginBottom: "2rem",
                }}
              >
                {INTERVIEW_PHASES.map(({ phase, items }, pi) => (
                  <div
                    key={phase}
                    ref={phases.setRef(pi) as any}
                    className={`lp-hcard ${phases.visible[pi] ? "lp-card-visible" : "lp-card-hidden"}`}
                    style={{ ...card, overflow: "hidden" }}
                  >
                    <div
                      style={{
                        padding: "1rem 1.2rem 0.75rem",
                        borderBottom: "1px solid rgba(74,222,128,0.1)",
                        background: "rgba(74,222,128,0.06)",
                      }}
                    >
                      <div className="lp-phase-header">
                        <p
                          style={{
                            fontWeight: 800,
                            fontSize: "1.06rem",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: "var(--brand-blue)",
                            margin: 0,
                            flex: "1 1 auto",
                            minWidth: 0,
                          }}
                        >
                          {phase}
                        </p>
                        <span
                          className={`lp-planet lp-planet--sm ${INTERVIEW_PHASE_PLANETS[pi]}`}
                          aria-hidden
                        />
                      </div>
                    </div>
                    <div style={{ padding: "1rem 1.2rem" }}>
                      {items.map((item) => (
                        <Link
                          key={item.title}
                          to={item.href}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.6rem",
                            padding: "0.45rem 0",
                            borderBottom: "1px solid rgba(74,222,128,0.06)",
                            textDecoration: "none",
                            transition: "opacity 0.15s",
                          }}
                        >
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: "rgba(74,222,128,0.12)",
                              border: "1px solid rgba(74,222,128,0.22)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.78rem",
                              fontWeight: 800,
                              color: "var(--brand-blue)",
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          >
                            {item.n}
                          </span>
                          <span>
                            <span
                              style={{
                                fontSize: "1.02rem",
                                fontWeight: 600,
                                color: "var(--ifm-font-color-base)",
                                display: "block",
                              }}
                            >
                              {item.title}
                            </span>
                            <span
                              style={{
                                fontSize: "0.88rem",
                                color: "var(--ifm-color-emphasis-600)",
                              }}
                            >
                              {item.sub}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips row */}
              <div
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
                {[
                  {
                    icon: "✅",
                    text: "Explain choices with at least one alternative",
                  },
                  {
                    icon: "📈",
                    text: "Describe what breaks first at 10× traffic",
                  },
                  {
                    icon: "🔧",
                    text: "Connect concept → trade-off → operations",
                  },
                  { icon: "🚨", text: "Avoid definition-only answers" },
                ].map(({ icon, text }) => (
                  <div
                    key={text}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.55rem 0.9rem",
                      borderRadius: 8,
                      border: "1px solid rgba(74,222,128,0.12)",
                      background: "rgba(74,222,128,0.04)",
                      fontSize: "0.98rem",
                      color: "var(--ifm-color-emphasis-700)",
                      flex: "1 1 200px",
                    }}
                  >
                    <span>{icon}</span> {text}
                  </div>
                ))}
              </div>
              <Link to="/docs" style={viewAllStyle}>
                View Full Interview Roadmap →
              </Link>
            </section>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
            SECTION — Interactive Daily Challenge
          ══════════════════════════════════════════════════════════════════ */}
          <section
            style={{
              maxWidth: 800,
              margin: "0 auto",
              padding: "5rem 1.5rem",
              position: "relative",
            }}
          >
            <div className="lp-section-label" style={{ textAlign: "center", marginBottom: "0.5rem" }}>🎮 Interactive Challenge</div>
            <h2 className="lp-section-title" style={{ textAlign: "center", marginBottom: "1rem" }}>
              Daily Practice Challenge
            </h2>
            <p
              style={{
                color: "var(--ifm-color-emphasis-700)",
                fontSize: "1.15rem",
                textAlign: "center",
                marginBottom: "2rem",
                maxWidth: 600,
                margin: "0 auto 2rem auto",
                lineHeight: 1.5,
              }}
            >
              Sharpen your engineering skills with our interactive daily challenges. Test your understanding of Java fundamentals or Spring Boot core patterns.
            </p>

            {/* Quiz Toggle Tabs */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <button
                onClick={() => setActiveQuiz('java')}
                style={{
                  padding: "0.6rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: activeQuiz === 'java' ? "2px solid var(--ifm-color-primary)" : "2px solid var(--ifm-color-emphasis-350)",
                  background: activeQuiz === 'java' ? "rgba(74,222,128,0.12)" : "transparent",
                  color: activeQuiz === 'java' ? "var(--ifm-color-primary)" : "var(--ifm-font-color-base)",
                  transition: "all 0.2s ease",
                }}
              >
                ☕ Java Challenge
              </button>
              <button
                onClick={() => setActiveQuiz('springboot')}
                style={{
                  padding: "0.6rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: activeQuiz === 'springboot' ? "2px solid var(--ifm-color-primary)" : "2px solid var(--ifm-color-emphasis-350)",
                  background: activeQuiz === 'springboot' ? "rgba(74,222,128,0.12)" : "transparent",
                  color: activeQuiz === 'springboot' ? "var(--ifm-color-primary)" : "var(--ifm-font-color-base)",
                  transition: "all 0.2s ease",
                }}
              >
                🍃 Spring Boot Challenge
              </button>
            </div>

            {/* Render selected Quiz */}
            <div style={{ minHeight: "350px" }}>
              {activeQuiz === 'java' ? (
                <DailyJavaQuiz />
              ) : (
                <DailySpringBootQuiz />
              )}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
            SECTION — LeetCode Daily Challenge
          ══════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              background: "rgba(74,222,128,0.03)",
              borderTop: "1px solid rgba(74,222,128,0.08)",
              borderBottom: "1px solid rgba(74,222,128,0.08)",
              backdropFilter: "blur(4px)",
            }}
          >
            <section
              style={{
                maxWidth: 1100,
                margin: "0 auto",
                padding: "5rem 1.5rem",
              }}
            >
              <div className="lp-section-label" style={{ textAlign: "center", marginBottom: "0.5rem" }}>📅 LeetCode Challenge</div>
              <h2 className="lp-section-title" style={{ textAlign: "center", marginBottom: "1rem" }}>
                LeetCode Coding Challenge
              </h2>
              <p
                style={{
                  color: "var(--ifm-color-emphasis-700)",
                  fontSize: "1.15rem",
                  textAlign: "center",
                  marginBottom: "2rem",
                  maxWidth: 600,
                  margin: "0 auto 2rem auto",
                  lineHeight: 1.5,
                }}
              >
                Consistency is key to mastering technical interviews. Solve our daily curated LeetCode problem, pick a random task to test yourself, or explore different data structures and algorithms.
              </p>

              <LeetCodeDaily />
            </section>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — DSA 20-Week Roadmap
        ══════════════════════════════════════════════════════════════════ */}
          <section
            style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem" }}
          >
            <div className="lp-section-heading-row">
              <div className="lp-dsa-orbit" aria-hidden>
                <div className="lp-dsa-orbit-ring" />
                <span className="lp-planet lp-planet--dsa lp-planet--md" />
              </div>
              <div className="lp-section-heading-text">
                <div className="lp-section-label">📊 DSA Training</div>
                <h2 className="lp-section-title">20-Week DSA Coding Roadmap</h2>
              </div>
            </div>
            <p
              style={{
                color: "var(--ifm-color-emphasis-700)",
                fontSize: "1.25rem",
                lineHeight: 1.65,
                maxWidth: 580,
                marginBottom: "2.5rem",
              }}
            >
              A structured algorithm curriculum from arrays to graph theory and
              dynamic programming. Each week targets one core pattern with
              progressive difficulty.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {DSA_WEEKS.map(({ wk, title, sub, href }, i) => (
                <Link
                  key={wk}
                  to={href}
                  ref={dsaWks.setRef(i) as any}
                  className={`lp-hcard ${dsaWks.visible[i] ? "lp-card-visible" : "lp-card-hidden"}`}
                  style={{
                    ...card,
                    borderRadius: 10,
                    padding: "0.9rem 1rem",
                    display: "block",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--brand-blue)",
                      opacity: 0.85,
                      display: "block",
                      marginBottom: "0.3rem",
                    }}
                  >
                    Week {wk}
                  </span>
                  <span
                    style={{
                      fontSize: "1.02rem",
                      fontWeight: 700,
                      color: "var(--ifm-font-color-base)",
                      lineHeight: 1.35,
                      display: "block",
                    }}
                  >
                    {title}
                  </span>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--ifm-color-emphasis-600)",
                      marginTop: "0.25rem",
                      display: "block",
                    }}
                  >
                    {sub}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              to="/technical-knowledge/dsa/20-week-dsa-roadmap-intro"
              style={viewAllStyle}
            >
              View Full DSA Curriculum →
            </Link>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
            SECTION 4 — Engineering Books
        ══════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              background: "rgba(74,222,128,0.03)",
              borderTop: "1px solid rgba(74,222,128,0.08)",
              borderBottom: "1px solid rgba(74,222,128,0.08)",
              backdropFilter: "blur(4px)",
            }}
          >
            <section
              style={{
                maxWidth: 1100,
                margin: "0 auto",
                padding: "5rem 1.5rem",
              }}
            >
              <div className="lp-section-label">📚 Books</div>
              <h2 className="lp-section-title">Engineering Books</h2>
              <p
                style={{
                  color: "var(--ifm-color-emphasis-700)",
                  fontSize: "1.25rem",
                  lineHeight: 1.65,
                  maxWidth: 580,
                  marginBottom: "1.75rem",
                }}
              >
                Distilled notes and key takeaways from the most impactful
                engineering books — organized by track.
              </p>
              <div
                style={{
                  padding: "0.9rem 1.2rem",
                  borderRadius: 10,
                  border: "1px solid rgba(74,222,128,0.2)",
                  background: "rgba(74,222,128,0.05)",
                  marginBottom: "1.75rem",
                  fontSize: "1.02rem",
                  color: "var(--ifm-color-emphasis-700)",
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: "var(--brand-blue)" }}>
                  💡 Recommended reading order —
                </strong>{" "}
                <strong>Software Craft:</strong> Clean Code → Clean Architecture
                → Effective Java &nbsp;|&nbsp;
                <strong>Deep Dive:</strong> DDIA → Building Microservices → OCP
                Java SE 21
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "1.1rem",
                }}
              >
                {BOOKS.map(({ icon, track, title, author, focus, href }, i) => {
                  const isLink = href && href !== "#";
                  const cardEl = (
                    <>
                      <div
                        style={{
                          fontSize: "2.5rem",
                          lineHeight: 1,
                          flexShrink: 0,
                          width: 44,
                          height: 56,
                          borderRadius: 5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(74,222,128,0.08)",
                          border: "1px solid rgba(74,222,128,0.18)",
                        }}
                      >
                        {icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--brand-blue)",
                            marginBottom: "0.3rem",
                            display: "block",
                          }}
                        >
                          {track}
                        </span>
                        <span
                          style={{
                            fontSize: "1.06rem",
                            fontWeight: 700,
                            color: "var(--ifm-font-color-base)",
                            lineHeight: 1.35,
                            marginBottom: "0.25rem",
                            display: "block",
                          }}
                        >
                          {title}
                        </span>
                        <span
                          style={{
                            fontSize: "0.88rem",
                            color: "var(--ifm-color-emphasis-600)",
                            display: "block",
                            marginBottom: "0.25rem",
                          }}
                        >
                          {author}
                        </span>
                        <span
                          style={{
                            fontSize: "0.88rem",
                            color: "var(--ifm-color-emphasis-600)",
                            lineHeight: 1.4,
                            display: "block",
                          }}
                        >
                          {focus}
                        </span>
                      </div>
                    </>
                  );

                  if (isLink) {
                    return (
                      <Link
                        key={title}
                        to={href}
                        ref={books.setRef(i) as any}
                        className={`lp-hcard ${books.visible[i] ? "lp-card-visible" : "lp-card-hidden"}`}
                        style={{
                          ...card,
                          display: "flex",
                          gap: "1rem",
                          padding: "1.1rem 1.2rem",
                          alignItems: "flex-start",
                        }}
                      >
                        {cardEl}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={title}
                      ref={books.setRef(i) as any}
                      className={`lp-hcard ${books.visible[i] ? "lp-card-visible" : "lp-card-hidden"}`}
                      style={{
                        ...card,
                        display: "flex",
                        gap: "1rem",
                        padding: "1.1rem 1.2rem",
                        alignItems: "flex-start",
                        cursor: "default",
                      }}
                    >
                      {cardEl}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
            SECTION 5 — Cloud Certifications
        ══════════════════════════════════════════════════════════════════ */}
          <section
            style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem" }}
          >
            <div className="lp-section-heading-row">
              <div className="lp-ringed-wrap" aria-hidden>
                <div className="lp-planet-ring" />
                <span className="lp-planet lp-planet--aws lp-planet--md" />
              </div>
              <div className="lp-section-heading-text">
                <div className="lp-section-label">☁️ Cloud Certs</div>
                <h2 className="lp-section-title">
                  Cloud Certifications — AWS DVA-C02
                </h2>
              </div>
            </div>
            <p
              style={{
                color: "var(--ifm-color-emphasis-700)",
                fontSize: "1.25rem",
                lineHeight: 1.65,
                maxWidth: 580,
                marginBottom: "2rem",
              }}
            >
              Targeted preparation for the{" "}
              <strong>AWS Certified Developer – Associate (DVA-C02)</strong>{" "}
              exam with exam tips, traps, and scenario-based practice questions
              on every topic page.
            </p>

            {/* Domain weight pills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                marginBottom: "2rem",
              }}
            >
              {AWS_DOMAINS.map(({ label, weight }) => (
                <div
                  key={label}
                  style={{
                    padding: "0.65rem 1.1rem",
                    borderRadius: 10,
                    border: "1px solid rgba(74,222,128,0.2)",
                    background: "rgba(74,222,128,0.06)",
                    fontSize: "1rem",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: "var(--ifm-font-color-base)",
                      display: "block",
                      marginBottom: "0.15rem",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: "1.44rem",
                      fontWeight: 900,
                      color: "var(--brand-blue)",
                    }}
                  >
                    {weight}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(245px, 1fr))",
                gap: "0.85rem",
              }}
            >
              {AWS_TOPICS.map(({ n, title, desc, href }, i) => (
                <Link
                  key={title}
                  to={href}
                  ref={awsTop.setRef(i) as any}
                  className={`lp-hcard ${awsTop.visible[i] ? "lp-card-visible" : "lp-card-hidden"}`}
                  style={{
                    ...card,
                    borderRadius: 10,
                    padding: "1rem 1.1rem",
                    display: "block",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      color: "var(--brand-blue)",
                      opacity: 0.75,
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Topic {String(n).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontSize: "1.06rem",
                      fontWeight: 700,
                      color: "var(--ifm-font-color-base)",
                      marginBottom: "0.2rem",
                      display: "block",
                    }}
                  >
                    {title}
                  </span>
                  <span
                    style={{
                      fontSize: "0.88rem",
                      color: "var(--ifm-color-emphasis-600)",
                      lineHeight: 1.45,
                    }}
                  >
                    {desc}
                  </span>
                </Link>
              ))}
            </div>

            <div
              style={{
                marginTop: "1.75rem",
                padding: "1rem 1.25rem",
                borderRadius: 10,
                border: "1px solid rgba(74,222,128,0.22)",
                background: "rgba(74,222,128,0.05)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  lineHeight: 1.65,
                  color: "var(--ifm-color-emphasis-700)",
                }}
              >
                <strong style={{ color: "var(--brand-blue)" }}>
                  ⚠️ High-priority exam topics —
                </strong>{" "}
                Lambda (invocation types, cold start, versioning) · DynamoDB
                (single-table design, GSI/LSI, DAX) · SQS (visibility timeout,
                DLQ, FIFO) · IAM (policy evaluation, role assumption) ·
                CloudFormation (change sets, rollback triggers, cross-stack
                refs)
              </p>
            </div>
            <Link to="/aws" style={viewAllStyle}>
              View Full AWS Study Path →
            </Link>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
            CTA BANNER
        ══════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              textAlign: "center",
              padding: "5rem 1.5rem",
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(74,222,128,0.08) 0%, transparent 70%)",
              borderTop: "1px solid rgba(74,222,128,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.15,
                marginBottom: "1rem",
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Ready to level up?
            </h2>
            <p
              style={{
                color: "var(--ifm-color-emphasis-700)",
                maxWidth: 500,
                margin: "0 auto 2rem",
                lineHeight: 1.65,
              }}
            >
              Pick a path and start building depth. Every page connects concepts
              to real engineering decisions, interview scenarios, and production
              systems.
            </p>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/docs"
                className="lp-cta-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.85rem 2rem",
                  borderRadius: 9,
                  fontWeight: 700,
                  fontSize: "1.19rem",
                  background: "var(--gradient-brand)",
                  color: "#0a1020",
                  textDecoration: "none",
                  boxShadow: "0 0 22px -6px rgba(74,222,128,0.5)",
                }}
              >
                Get Started →
              </Link>
              <Link
                to="/technical-knowledge/system-design/interview-framework"
                className="lp-cta-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.85rem 2rem",
                  borderRadius: 9,
                  fontWeight: 700,
                  fontSize: "1.19rem",
                  border: "1px solid rgba(74,222,128,0.35)",
                  color: "var(--brand-blue)",
                  background: "rgba(74,222,128,0.06)",
                  textDecoration: "none",
                }}
              >
                Interview Framework
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
