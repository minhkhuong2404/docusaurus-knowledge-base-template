import React, { useEffect, useRef, useState } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

/* ─────────────────────────────────────────────────────────────────────────────
   Inline styles — follows the site's neon/dark design tokens perfectly
───────────────────────────────────────────────────────────────────────────── */

const S = {
  /* Page shell */
  page: {
    minHeight: "100vh",
    background: "var(--ifm-background-color)",
    overflowX: "hidden" as const,
  },

  /* ── Hero ─────────────────────────────────────────────────────────────── */
  hero: {
    position: "relative" as const,
    padding: "7rem 1.5rem 5rem",
    textAlign: "center" as const,
    overflow: "hidden" as const,
  },
  heroBg: {
    position: "absolute" as const,
    inset: 0,
    background:
      "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(74,222,128,0.12) 0%, transparent 70%)," +
      "radial-gradient(ellipse 60% 40% at 80% 100%, rgba(134,239,172,0.07) 0%, transparent 60%)",
    pointerEvents: "none" as const,
  },
  heroEyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "var(--brand-blue)",
    background: "rgba(74,222,128,0.1)",
    border: "1px solid rgba(74,222,128,0.28)",
    borderRadius: "999px",
    padding: "0.3rem 1rem",
    marginBottom: "1.5rem",
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--brand-blue)",
    boxShadow: "0 0 8px var(--brand-blue)",
    animation: "pulse 2s ease-in-out infinite",
  },
  heroTitle: {
    fontSize: "clamp(2.4rem, 6vw, 4rem)",
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: "-0.04em",
    background: "var(--gradient-brand)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "1.25rem",
  },
  heroSub: {
    fontSize: "1.1rem",
    lineHeight: 1.6,
    color: "var(--ifm-color-emphasis-700)",
    maxWidth: 620,
    margin: "0 auto 2.5rem",
  },
  heroCtas: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    flexWrap: "wrap" as const,
  },
  ctaPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.8rem 1.8rem",
    borderRadius: "9px",
    fontWeight: 700,
    fontSize: "0.95rem",
    background: "var(--gradient-brand)",
    color: "#0a1020",
    textDecoration: "none",
    transition: "opacity 0.2s, transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 0 22px -6px rgba(74,222,128,0.5)",
  },
  ctaSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.8rem 1.8rem",
    borderRadius: "9px",
    fontWeight: 700,
    fontSize: "0.95rem",
    border: "1px solid rgba(74,222,128,0.35)",
    color: "var(--brand-blue)",
    background: "rgba(74,222,128,0.06)",
    textDecoration: "none",
    transition: "background 0.2s, transform 0.2s, border-color 0.2s",
  },

  /* ── Stat strip ───────────────────────────────────────────────────────── */
  statsStrip: {
    display: "flex",
    justifyContent: "center",
    gap: "2.5rem",
    flexWrap: "wrap" as const,
    padding: "2.5rem 1.5rem",
    borderTop: "1px solid rgba(74,222,128,0.1)",
    borderBottom: "1px solid rgba(74,222,128,0.1)",
    background: "rgba(74,222,128,0.03)",
  },
  stat: { textAlign: "center" as const },
  statNum: {
    fontSize: "2.2rem",
    fontWeight: 900,
    lineHeight: 1,
    background: "var(--gradient-brand)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  statLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--ifm-color-emphasis-600)",
    marginTop: "0.25rem",
  },

  /* ── Section layout ───────────────────────────────────────────────────── */
  section: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "5rem 1.5rem",
  },
  sectionAlt: {
    background: "rgba(74,222,128,0.02)",
    borderTop: "1px solid rgba(74,222,128,0.08)",
    borderBottom: "1px solid rgba(74,222,128,0.08)",
  },
  sectionLabel: {
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    color: "var(--brand-blue)",
    marginBottom: "0.5rem",
  },
  sectionTitle: {
    fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
    marginBottom: "0.75rem",
    background: "var(--gradient-brand)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  sectionDesc: {
    color: "var(--ifm-color-emphasis-700)",
    fontSize: "1rem",
    lineHeight: 1.65,
    maxWidth: 580,
    marginBottom: "2.5rem",
  },

  /* ── Path cards grid ──────────────────────────────────────────────────── */
  pathGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1rem",
  },
  pathCard: {
    position: "relative" as const,
    padding: "1.4rem 1.2rem",
    borderRadius: "12px",
    border: "1px solid rgba(74,222,128,0.14)",
    background: "var(--ifm-background-surface-color)",
    textDecoration: "none",
    transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    cursor: "pointer",
  },
  pathIcon: { fontSize: "1.6rem", lineHeight: 1 },
  pathName: {
    fontWeight: 700,
    fontSize: "0.95rem",
    color: "var(--ifm-font-color-base)",
  },
  pathDesc: {
    fontSize: "0.78rem",
    color: "var(--ifm-color-emphasis-600)",
    lineHeight: 1.5,
  },
  pathTag: {
    display: "inline-block",
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    padding: "0.18rem 0.55rem",
    borderRadius: "999px",
    background: "rgba(74,222,128,0.12)",
    color: "var(--brand-blue)",
    border: "1px solid rgba(74,222,128,0.22)",
    alignSelf: "flex-start",
  },

  /* ── Roadmap phases ───────────────────────────────────────────────────── */
  phaseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.25rem",
    marginBottom: "2rem",
  },
  phaseCard: {
    borderRadius: "14px",
    border: "1px solid rgba(74,222,128,0.14)",
    background: "var(--ifm-background-surface-color)",
    overflow: "hidden" as const,
  },
  phaseHeader: {
    padding: "1rem 1.2rem 0.75rem",
    borderBottom: "1px solid rgba(74,222,128,0.1)",
    background: "rgba(74,222,128,0.06)",
  },
  phaseHeaderTitle: {
    fontWeight: 800,
    fontSize: "0.85rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    color: "var(--brand-blue)",
    margin: 0,
  },
  phaseBody: { padding: "1rem 1.2rem" },
  phaseItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.6rem",
    padding: "0.45rem 0",
    borderBottom: "1px solid rgba(74,222,128,0.06)",
    textDecoration: "none",
  },
  phaseNum: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "rgba(74,222,128,0.12)",
    border: "1px solid rgba(74,222,128,0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.62rem",
    fontWeight: 800,
    color: "var(--brand-blue)",
    flexShrink: 0,
    marginTop: 1,
  },
  phaseItemText: {
    lineHeight: 1.4,
  },
  phaseItemTitle: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "var(--ifm-font-color-base)",
    display: "block",
  },
  phaseItemSub: {
    fontSize: "0.7rem",
    color: "var(--ifm-color-emphasis-600)",
  },

  /* ── DSA week table ───────────────────────────────────────────────────── */
  weekGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "0.75rem",
  },
  weekCard: {
    padding: "0.9rem 1rem",
    borderRadius: "10px",
    border: "1px solid rgba(74,222,128,0.12)",
    background: "var(--ifm-background-surface-color)",
    textDecoration: "none",
    transition: "border-color 0.2s, transform 0.18s, box-shadow 0.2s",
    display: "block",
  },
  weekBadge: {
    fontSize: "0.62rem",
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--brand-blue)",
    opacity: 0.8,
    display: "block",
    marginBottom: "0.3rem",
  },
  weekTitle: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "var(--ifm-font-color-base)",
    lineHeight: 1.35,
    display: "block",
  },
  weekSub: {
    fontSize: "0.68rem",
    color: "var(--ifm-color-emphasis-600)",
    marginTop: "0.25rem",
    display: "block",
  },

  /* ── Books ────────────────────────────────────────────────────────────── */
  bookGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "1.1rem",
  },
  bookCard: {
    display: "flex",
    gap: "1rem",
    padding: "1.1rem 1.2rem",
    borderRadius: "12px",
    border: "1px solid rgba(74,222,128,0.12)",
    background: "var(--ifm-background-surface-color)",
    textDecoration: "none",
    transition: "border-color 0.2s, transform 0.18s, box-shadow 0.2s",
    alignItems: "flex-start",
  },
  bookCover: {
    fontSize: "2rem",
    lineHeight: 1,
    flexShrink: 0,
    width: 44,
    height: 56,
    borderRadius: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(74,222,128,0.08)",
    border: "1px solid rgba(74,222,128,0.18)",
  },
  bookInfo: { flex: 1, minWidth: 0 },
  bookTrack: {
    fontSize: "0.6rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--brand-blue)",
    marginBottom: "0.3rem",
    display: "block",
  },
  bookTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "var(--ifm-font-color-base)",
    lineHeight: 1.35,
    marginBottom: "0.25rem",
    display: "block",
  },
  bookAuthor: {
    fontSize: "0.7rem",
    color: "var(--ifm-color-emphasis-600)",
    display: "block",
    marginBottom: "0.25rem",
  },
  bookFocus: {
    fontSize: "0.7rem",
    color: "var(--ifm-color-emphasis-600)",
    lineHeight: 1.4,
    display: "block",
  },

  /* ── AWS study path table ─────────────────────────────────────────────── */
  awsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "0.85rem",
  },
  awsCard: {
    padding: "1rem 1.1rem",
    borderRadius: "10px",
    border: "1px solid rgba(74,222,128,0.12)",
    background: "var(--ifm-background-surface-color)",
    textDecoration: "none",
    transition: "border-color 0.2s, transform 0.18s, box-shadow 0.2s",
    display: "block",
  },
  awsNum: {
    fontSize: "0.6rem",
    fontWeight: 800,
    letterSpacing: "0.1em",
    color: "var(--brand-blue)",
    opacity: 0.7,
    display: "block",
    marginBottom: "0.25rem",
  },
  awsTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "var(--ifm-font-color-base)",
    marginBottom: "0.2rem",
    display: "block",
  },
  awsDesc: {
    fontSize: "0.7rem",
    color: "var(--ifm-color-emphasis-600)",
    lineHeight: 1.45,
  },

  /* ── Domain weight pills ──────────────────────────────────────────────── */
  domainRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.75rem",
    marginBottom: "2rem",
  },
  domainPill: {
    padding: "0.6rem 1.1rem",
    borderRadius: "10px",
    border: "1px solid rgba(74,222,128,0.2)",
    background: "rgba(74,222,128,0.06)",
    fontSize: "0.8rem",
  },
  domainName: {
    fontWeight: 700,
    color: "var(--ifm-font-color-base)",
    display: "block",
    marginBottom: "0.15rem",
  },
  domainWeight: {
    fontSize: "1.15rem",
    fontWeight: 900,
    color: "var(--brand-blue)",
  },

  /* ── View all link ────────────────────────────────────────────────────── */
  viewAll: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    marginTop: "1.5rem",
    padding: "0.6rem 1.3rem",
    borderRadius: "8px",
    border: "1px solid rgba(74,222,128,0.28)",
    color: "var(--brand-blue)",
    background: "rgba(74,222,128,0.05)",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "0.85rem",
    transition: "background 0.2s, transform 0.15s",
  },

  /* ── CTA banner ───────────────────────────────────────────────────────── */
  ctaBanner: {
    textAlign: "center" as const,
    padding: "5rem 1.5rem",
    background:
      "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(74,222,128,0.08) 0%, transparent 70%)",
    borderTop: "1px solid rgba(74,222,128,0.1)",
  },
  ctaBannerTitle: {
    fontSize: "clamp(1.8rem, 4vw, 3rem)",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 1.15,
    marginBottom: "1rem",
    background: "var(--gradient-brand)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  ctaBannerSub: {
    color: "var(--ifm-color-emphasis-700)",
    maxWidth: 500,
    margin: "0 auto 2rem",
    lineHeight: 1.6,
  },
} as const;

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
        sub: "URL shortener, Twitter clone, payment system",
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
    sub: "Reversal, cycle, merge",
    href: "/technical-knowledge/dsa/week-3-linked-lists-pointers",
  },
  {
    wk: 4,
    title: "Hash Tables & Sets",
    sub: "Frequency, anagram, grouping",
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
    sub: "Fibonacci, house robber, DP on strings",
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
    icon: "🧠",
    track: "Interview Prep",
    title: "Cracking the Coding Interview",
    author: "Gayle McDowell",
    focus: "DS, algorithms, system design, OOP, concurrency",
    href: "/books/clean-code/intro",
  },
  {
    icon: "🏗️",
    track: "Interview Prep",
    title: "System Design Interview Vol.1",
    author: "Alex Xu",
    focus: "4-step framework + 10 real system designs",
    href: "/books/ddia/intro",
  },
  {
    icon: "🏗️",
    track: "Interview Prep",
    title: "System Design Interview Vol.2",
    author: "Alex Xu & Sahn Lam",
    focus: "Payments, maps, stock exchange — advanced designs",
    href: "/books/ddia/intro",
  },
  {
    icon: "☕",
    track: "Software Craft",
    title: "Effective Java",
    author: "Joshua Bloch",
    focus: "90 best practices: generics, lambdas, APIs, concurrency",
    href: "/books/effective-java/introduction",
  },
  {
    icon: "🧹",
    track: "Software Craft",
    title: "Clean Code",
    author: "Robert C. Martin",
    focus: "Naming, functions, error handling, formatting",
    href: "/books/clean-code/intro",
  },
  {
    icon: "🔧",
    track: "Software Craft",
    title: "Building Microservices",
    author: "Sam Newman",
    focus: "Decomposition, resilience, integration, deployment",
    href: "/books/building-microservice/",
  },
  {
    icon: "📊",
    track: "Deep Foundations",
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    focus: "Replication, partitioning, transactions, distributed systems",
    href: "/books/ddia/intro",
  },
  {
    icon: "🏛️",
    track: "Deep Foundations",
    title: "Clean Architecture",
    author: "Robert C. Martin",
    focus: "Dependency rules, component isolation, architecture principles",
    href: "/books/clean-architecture/intro",
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
    desc: "Invocation, cold start, layers, destinations, DLQ",
    href: "/technical-knowledge/aws/lambda/",
  },
  {
    n: 3,
    title: "DynamoDB",
    desc: "Keys, GSI/LSI, streams, DAX, single-table design",
    href: "/technical-knowledge/aws/dynamodb/",
  },
  {
    n: 4,
    title: "API Gateway",
    desc: "REST vs HTTP API, authorizers, throttling, caching",
    href: "/technical-knowledge/aws/api-gateway/",
  },
  {
    n: 5,
    title: "S3",
    desc: "Storage classes, lifecycle, encryption, presigned URLs",
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
    title: "CI/CD (CodePipeline, CodeBuild)",
    desc: "Pipelines, buildspec, deploy actions",
    href: "/technical-knowledge/aws/cicd/",
  },
  {
    n: 12,
    title: "Monitoring (CloudWatch, X-Ray)",
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
    desc: "Standard vs Express, wait for callback, Map state",
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
   Hover helpers
───────────────────────────────────────────────────────────────────────────── */
function useHover() {
  const [hovered, setHovered] = useState(false);
  return {
    hovered,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };
}

function HoverCard({
  children,
  style,
  href,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
  href: string;
}) {
  const { hovered, onMouseEnter, onMouseLeave } = useHover();
  return (
    // @ts-ignore
    <Link
      to={href}
      style={{
        ...style,
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 8px 28px -8px rgba(74,222,128,0.22)" : "none",
        borderColor: hovered ? "rgba(74,222,128,0.38)" : undefined,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page component
───────────────────────────────────────────────────────────────────────────── */
// @ts-ignore
export default function Home(): React.ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    // @ts-ignore
    <Layout
      title="Engineering Knowledge Base"
      description="Practical learning paths for Java engineers — interview prep, DSA training, engineering books, and AWS cloud certification."
    >
      {/* Global keyframe injection */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-fadein { animation: fadeInUp 0.6s ease both; }
        .lp-fadein-1 { animation-delay: 0.05s; }
        .lp-fadein-2 { animation-delay: 0.15s; }
        .lp-fadein-3 { animation-delay: 0.25s; }
        .lp-fadein-4 { animation-delay: 0.35s; }
      `}</style>

      <div style={S.page}>
        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section style={S.hero}>
          <div style={S.heroBg} />
          <div className="lp-fadein lp-fadein-1" style={S.heroEyebrow}>
            <span style={S.heroDot} /> Engineering Knowledge Base
          </div>
          <h1 className="lp-fadein lp-fadein-2" style={S.heroTitle}>
            Master Software Engineering,
            <br />
            One Concept at a Time
          </h1>
          <p className="lp-fadein lp-fadein-3" style={S.heroSub}>
            A practical, structured reference for Java backend engineers.
            Covering interview preparation, DSA training, engineering books, and
            cloud certification — all in one place.
          </p>
          <div className="lp-fadein lp-fadein-4" style={S.heroCtas}>
            <Link to="/docs" style={S.ctaPrimary}>
              Start Learning →
            </Link>
            <Link
              to="/technical-knowledge/system-design/interview-framework"
              style={S.ctaSecondary}
            >
              Interview Prep
            </Link>
            <Link
              to="/technical-knowledge/dsa/20-week-dsa-roadmap-intro"
              style={S.ctaSecondary}
            >
              DSA Roadmap
            </Link>
          </div>
        </section>

        {/* ── Stats strip ─────────────────────────────────────────────────── */}
        <div style={S.statsStrip}>
          {[
            { num: "13+", label: "Learning Paths" },
            { num: "20", label: "DSA Weeks" },
            { num: "8", label: "Engineering Books" },
            { num: "15+", label: "AWS DVA-C02 Topics" },
            { num: "500+", label: "Pages of Content" },
          ].map(({ num, label }) => (
            <div key={label} style={S.stat}>
              <div style={S.statNum}>{num}</div>
              <div style={S.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1 — Learning Paths
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={S.section}>
          <div style={S.sectionLabel}>🗺️ Overview</div>
          <h2 style={S.sectionTitle}>Learning Paths</h2>
          <p style={S.sectionDesc}>
            Choose your domain. Each path takes you from fundamentals through to
            senior-level topics with practical examples, interview questions,
            and real-world context.
          </p>
          <div style={S.pathGrid}>
            {LEARNING_PATHS.map((p) => (
              <HoverCard key={p.name} href={p.href} style={S.pathCard}>
                <span style={S.pathIcon}>{p.icon}</span>
                <span style={S.pathName}>{p.name}</span>
                <span style={S.pathDesc}>{p.desc}</span>
                <span style={S.pathTag}>{p.tag}</span>
              </HoverCard>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2 — Interview Preparation Roadmap
        ═══════════════════════════════════════════════════════════════════ */}
        <div style={S.sectionAlt}>
          <section style={S.section}>
            <div style={S.sectionLabel}>💼 Interview Prep</div>
            <h2 style={S.sectionTitle}>Interview Preparation Roadmap</h2>
            <p style={S.sectionDesc}>
              A three-phase curriculum for engineers targeting backend, system
              design, and Java/Spring interviews. Follow the phases in order to
              build deep, connected understanding.
            </p>

            <div style={S.phaseGrid}>
              {INTERVIEW_PHASES.map(({ phase, items }) => (
                <div key={phase} style={S.phaseCard}>
                  <div style={S.phaseHeader}>
                    <p style={S.phaseHeaderTitle}>{phase}</p>
                  </div>
                  <div style={S.phaseBody}>
                    {items.map((item) => (
                      <HoverCard
                        key={item.title}
                        href={item.href}
                        style={{
                          ...S.phaseItem,
                          borderBottom: "1px solid rgba(74,222,128,0.06)",
                        }}
                      >
                        <span style={S.phaseNum}>{item.n}</span>
                        <span style={S.phaseItemText}>
                          <span style={S.phaseItemTitle}>{item.title}</span>
                          <span style={S.phaseItemSub}>{item.sub}</span>
                        </span>
                      </HoverCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Interview tips row */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap" as const,
                marginTop: "1rem",
              }}
            >
              {[
                {
                  icon: "✅",
                  text: "Explain design choices with at least one alternative",
                },
                {
                  icon: "📈",
                  text: "Describe what breaks first at 10× traffic",
                },
                {
                  icon: "🔧",
                  text: "Connect concept → trade-off → operations",
                },
                {
                  icon: "🚨",
                  text: "Avoid definition-only answers — show real reasoning",
                },
              ].map(({ icon, text }) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.6rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(74,222,128,0.12)",
                    background: "rgba(74,222,128,0.04)",
                    fontSize: "0.78rem",
                    color: "var(--ifm-color-emphasis-700)",
                    flex: "1 1 220px",
                  }}
                >
                  <span>{icon}</span> {text}
                </div>
              ))}
            </div>

            <Link to="/docs" style={S.viewAll}>
              View Full Interview Roadmap →
            </Link>
          </section>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3 — DSA 20-Week Roadmap
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={S.section}>
          <div style={S.sectionLabel}>📊 DSA Training</div>
          <h2 style={S.sectionTitle}>20-Week DSA Coding Roadmap</h2>
          <p style={S.sectionDesc}>
            A structured algorithm curriculum from arrays through graph theory
            and dynamic programming. Each week focuses on one core pattern with
            progressive difficulty and real interview examples.
          </p>
          <div style={S.weekGrid}>
            {DSA_WEEKS.map(({ wk, title, sub, href }) => (
              <HoverCard key={wk} href={href} style={S.weekCard}>
                <span style={S.weekBadge}>Week {wk}</span>
                <span style={S.weekTitle}>{title}</span>
                <span style={S.weekSub}>{sub}</span>
              </HoverCard>
            ))}
          </div>
          <Link
            to="/technical-knowledge/dsa/20-week-dsa-roadmap-intro"
            style={S.viewAll}
          >
            View Full DSA Curriculum →
          </Link>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4 — Engineering Books
        ═══════════════════════════════════════════════════════════════════ */}
        <div style={S.sectionAlt}>
          <section style={S.section}>
            <div style={S.sectionLabel}>📚 Books</div>
            <h2 style={S.sectionTitle}>Engineering Books</h2>
            <p style={S.sectionDesc}>
              Distilled notes and key takeaways from the most impactful
              engineering books — organized by track so you read the right book
              at the right stage of your career.
            </p>

            {/* Reading order tip */}
            <div
              style={{
                padding: "0.9rem 1.2rem",
                borderRadius: "10px",
                border: "1px solid rgba(74,222,128,0.2)",
                background: "rgba(74,222,128,0.05)",
                marginBottom: "1.75rem",
                fontSize: "0.82rem",
                color: "var(--ifm-color-emphasis-700)",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "var(--brand-blue)" }}>
                💡 Recommended reading order —
              </strong>{" "}
              <strong>Interview track:</strong> Cracking the Coding Interview →
              System Design Vol.1 → Vol.2 &nbsp;|&nbsp;
              <strong>Engineering depth:</strong> Effective Java → Clean Code →
              Building Microservices → DDIA
            </div>

            <div style={S.bookGrid}>
              {BOOKS.map(({ icon, track, title, author, focus, href }) => (
                <HoverCard key={title} href={href} style={S.bookCard}>
                  <div style={S.bookCover}>{icon}</div>
                  <div style={S.bookInfo}>
                    <span style={S.bookTrack}>{track}</span>
                    <span style={S.bookTitle}>{title}</span>
                    <span style={S.bookAuthor}>{author}</span>
                    <span style={S.bookFocus}>{focus}</span>
                  </div>
                </HoverCard>
              ))}
            </div>
          </section>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 5 — Cloud Certifications
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={S.section}>
          <div style={S.sectionLabel}>☁️ Cloud Certs</div>
          <h2 style={S.sectionTitle}>Cloud Certifications — AWS DVA-C02</h2>
          <p style={S.sectionDesc}>
            Targeted preparation for the{" "}
            <strong>AWS Certified Developer – Associate (DVA-C02)</strong> exam.
            Each topic page includes exam tips, common traps, and scenario-based
            practice questions.
          </p>

          {/* Domain weight pills */}
          <div style={S.domainRow}>
            {AWS_DOMAINS.map(({ label, weight }) => (
              <div key={label} style={S.domainPill}>
                <span style={S.domainName}>{label}</span>
                <span style={S.domainWeight}>{weight}</span>
              </div>
            ))}
          </div>

          <div style={S.awsGrid}>
            {AWS_TOPICS.map(({ n, title, desc, href }) => (
              <HoverCard key={title} href={href} style={S.awsCard}>
                <span style={S.awsNum}>Topic {String(n).padStart(2, "0")}</span>
                <span style={S.awsTitle}>{title}</span>
                <span style={S.awsDesc}>{desc}</span>
              </HoverCard>
            ))}
          </div>

          {/* High-priority callout */}
          <div
            style={{
              marginTop: "1.75rem",
              padding: "1rem 1.25rem",
              borderRadius: "10px",
              border: "1px solid rgba(74,222,128,0.22)",
              background: "rgba(74,222,128,0.05)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
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

          <Link to="/aws" style={S.viewAll}>
            View Full AWS Study Path →
          </Link>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CTA Banner
        ═══════════════════════════════════════════════════════════════════ */}
        <div style={S.ctaBanner}>
          <h2 style={S.ctaBannerTitle}>Ready to level up?</h2>
          <p style={S.ctaBannerSub}>
            Pick a learning path and start building depth. Every page connects
            concepts to real engineering decisions, interview scenarios, and
            production systems.
          </p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap" as const,
            }}
          >
            <Link to="/docs" style={S.ctaPrimary}>
              Get Started →
            </Link>
            <Link
              to="/technical-knowledge/system-design/interview-framework"
              style={S.ctaSecondary}
            >
              Interview Framework
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
