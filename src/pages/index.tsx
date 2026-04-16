import React, { useEffect, useRef, useState } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

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
    font-size: clamp(3.50rem, 8.75vw, 7.50rem) !important;
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
  }

  /* ── Respect reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .lp-wbw, .lp-eyebrow, .lp-eyebrow-2,
    .lp-sub, .lp-ctas, .lp-stat-num, .lp-orb { animation: none !important; }
    .lp-wbw { opacity: 1 !important; transform: none !important; filter: none !important;
               -webkit-text-fill-color: unset; color: #4ade80; }
    .lp-card-hidden { opacity: 1; transform: none; }
    .lp-hcard:hover { transform: none !important; }
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
    href: "/books/building-microservice",
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

      <div
        style={{
          minHeight: "100vh",
          background: "var(--ifm-background-color)",
          overflowX: "hidden",
        }}
      >
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
            Covering interview preparation, DSA training, engineering books, and
            cloud certification — all in one place.
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
            background: "rgba(74,222,128,0.03)",
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
            background: "rgba(74,222,128,0.02)",
            borderTop: "1px solid rgba(74,222,128,0.08)",
            borderBottom: "1px solid rgba(74,222,128,0.08)",
          }}
        >
          <section
            style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem" }}
          >
            <div className="lp-section-label">💼 Interview Prep</div>
            <h2 className="lp-section-title">Interview Preparation Roadmap</h2>
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
                    <p
                      style={{
                        fontWeight: 800,
                        fontSize: "1.06rem",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "var(--brand-blue)",
                        margin: 0,
                      }}
                    >
                      {phase}
                    </p>
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
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
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
            SECTION 3 — DSA 20-Week Roadmap
        ══════════════════════════════════════════════════════════════════ */}
        <section
          style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem" }}
        >
          <div className="lp-section-label">📊 DSA Training</div>
          <h2 className="lp-section-title">20-Week DSA Coding Roadmap</h2>
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
            background: "rgba(74,222,128,0.02)",
            borderTop: "1px solid rgba(74,222,128,0.08)",
            borderBottom: "1px solid rgba(74,222,128,0.08)",
          }}
        >
          <section
            style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem" }}
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
              <strong>Software Craft:</strong> Clean Code → Clean Architecture → Effective Java
              &nbsp;|&nbsp;
              <strong>Deep Dive:</strong> DDIA → Building Microservices → OCP Java SE 21
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "1.1rem",
              }}
            >
              {BOOKS.map(({ icon, track, title, author, focus, href }, i) => (
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
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 5 — Cloud Certifications
        ══════════════════════════════════════════════════════════════════ */}
        <section
          style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem" }}
        >
          <div className="lp-section-label">☁️ Cloud Certs</div>
          <h2 className="lp-section-title">
            Cloud Certifications — AWS DVA-C02
          </h2>
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
            <strong>AWS Certified Developer – Associate (DVA-C02)</strong> exam
            with exam tips, traps, and scenario-based practice questions on
            every topic page.
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
              CloudFormation (change sets, rollback triggers, cross-stack refs)
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
    </Layout>
  );
}
