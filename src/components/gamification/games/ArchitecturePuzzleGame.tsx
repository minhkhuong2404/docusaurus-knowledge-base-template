import React, { useState, useMemo, useRef } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { arcadeAudio } from '../../../utils/arcadeAudio';
import { SYSTEM_DESIGN_PUZZLES } from '../../../data/systemDesignPuzzlesData';
import type { PuzzleScenario } from '../../../data/systemDesignPuzzlesData';
import { pickRandomUnseenItem, readSeenIds, shuffleArray, writeSeenIds } from '../../../utils/arcadeRandomizer';

export type { PuzzleScenario };
export { SYSTEM_DESIGN_PUZZLES };

const SEEN_ARCH_PUZZLE_STORAGE_KEY = 'arcade_seen_arch_puzzle_ids_v1';

export interface DistractorNode {
  id: string;
  name: string;
  icon: string;
  role: string;
  isDistractor: true;
  whyUnnecessary: string;
}

// Curated pool of realistic System Design Distractor / Anti-Pattern Infrastructure Components
export const DISTRACTOR_COMPONENT_POOL: DistractorNode[] = [
  {
    id: 'distractor_2pc_xa',
    name: 'Global 2PC XA Coordinator',
    icon: '⛓️',
    role: 'Synchronous blocking Two-Phase Commit lock across all nodes',
    isDistractor: true,
    whyUnnecessary:
      'Global Two-Phase Commit (2PC/XA) holds blocking distributed locks across network boundaries, collapsing throughput under high QPS and creating a Single Point of Failure.',
  },
  {
    id: 'distractor_soap_xml_bus',
    name: 'Legacy SOAP / XML ESB',
    icon: '📠',
    role: 'Heavy XML schema marshalling & synchronous enterprise bus routing',
    isDistractor: true,
    whyUnnecessary:
      'XML/SOAP adds 5x–10x CPU serialization overhead and payload bloat compared to lightweight REST/gRPC/Protobuf, violating low-latency SLAs.',
  },
  {
    id: 'distractor_pow_blockchain',
    name: 'Public PoW Blockchain Ledger',
    icon: '🪙',
    role: 'On-chain Proof-of-Work mining (~10m block time, 7 TPS)',
    isDistractor: true,
    whyUnnecessary:
      'Public Proof-of-Work consensus (~7 TPS and multi-minute block finality) cannot sustain high-throughput production QPS and wastes massive compute budget.',
  },
  {
    id: 'distractor_nightly_cron_batch',
    name: '24h Nightly Cron Batch Poller',
    icon: '⏰',
    role: 'Polls entire database table every 24 hours via SELECT *',
    isDistractor: true,
    whyUnnecessary:
      'A 24-hour cron batch poller introduces severe data staleness and full-table scan IOPS spikes instead of real-time event streaming.',
  },
  {
    id: 'distractor_sqlite_nfs',
    name: 'Single-File SQLite on Shared NFS',
    icon: '📁',
    role: 'Coarse file-level mutex lock over network-attached storage',
    isDistractor: true,
    whyUnnecessary:
      'SQLite over NFS relies on brittle network file locks, causing immediate SQLITE_BUSY write contention and single-node storage failure under concurrent load.',
  },
  {
    id: 'distractor_inline_smtp',
    name: 'Synchronous Inline SMTP Relay',
    icon: '✉️',
    role: 'Blocks HTTP worker thread waiting for external SMTP handshake',
    isDistractor: true,
    whyUnnecessary:
      'Executing external SMTP handshakes synchronously on the critical request path blocks worker threads for 500–2,000ms and triggers cascading timeouts.',
  },
  {
    id: 'distractor_full_table_regex',
    name: 'Unindexed Full-Table Regex Scanner',
    icon: '🔎',
    role: 'Runs O(N) unindexed LIKE %pattern% scan across disk rows',
    isDistractor: true,
    whyUnnecessary:
      'O(N) unindexed full-table scans saturate disk IOPS and CPU at scale instead of using O(1) hash, B+Tree, or inverted index lookups.',
  },
  {
    id: 'distractor_sticky_ram_session',
    name: 'In-Process Sticky Session Store',
    icon: '📌',
    role: 'Stores user state only in local node heap without replication',
    isDistractor: true,
    whyUnnecessary:
      'Pinning state to local process memory breaks stateless horizontal auto-scaling and causes immediate data loss whenever an instance restarts.',
  },
  {
    id: 'distractor_direct_client_sql',
    name: 'Direct Client-to-DB SQL Driver',
    icon: '🔓',
    role: 'Connects client apps directly to internal database port 5432',
    isDistractor: true,
    whyUnnecessary:
      'Exposing raw database ports directly to untrusted clients bypasses API authentication/rate-limiting and exhausts database connection pools.',
  },
  {
    id: 'distractor_sync_70b_llm',
    name: 'Inline 70B LLM GPU Inference',
    icon: '🧠',
    role: 'Runs 3,000ms autoregressive GPU token generation per request',
    isDistractor: true,
    whyUnnecessary:
      'Running heavy synchronous 70B LLM GPU inference in the critical path adds >2,500ms latency and blows the monthly FinOps cloud budget.',
  },
];

// Deterministically select 3 unnecessary distractor components for a given scenario to increase difficulty
export function getScenarioDistractors(scenario: PuzzleScenario, count = 3): DistractorNode[] {
  let hash = 0;
  for (let i = 0; i < scenario.id.length; i++) {
    hash = (hash * 31 + scenario.id.charCodeAt(i)) >>> 0;
  }
  const existingIds = new Set(scenario.availableNodes.map((n) => n.id));
  const picked: DistractorNode[] = [];
  for (let i = 0; i < DISTRACTOR_COMPONENT_POOL.length && picked.length < count; i++) {
    const candidate = DISTRACTOR_COMPONENT_POOL[(hash + i * 3) % DISTRACTOR_COMPONENT_POOL.length];
    if (!existingIds.has(candidate.id) && !picked.some((p) => p.id === candidate.id)) {
      picked.push(candidate);
    }
  }
  return picked;
}

// Randomly shuffle available infrastructure components so they are NEVER presented in the sorted answer sequence
export function shuffleScenarioNodes(
  nodes: { id: string; name: string; icon: string; role: string }[],
  correctSequence: string[]
): { id: string; name: string; icon: string; role: string }[] {
  if (nodes.length <= 1) return [...nodes];
  let shuffled = shuffleArray(nodes);
  for (let attempt = 0; attempt < 12; attempt++) {
    const isSameOrder = shuffled.every((n, idx) => n.id === correctSequence[idx]);
    const startsWithFirstTwo =
      shuffled.length >= 3 &&
      shuffled[0].id === correctSequence[0] &&
      shuffled[1].id === correctSequence[1];
    if (!isSameOrder && !startsWithFirstTwo) {
      return shuffled;
    }
    shuffled = shuffleArray(nodes);
  }
  if (shuffled.every((n, idx) => n.id === correctSequence[idx]) && shuffled.length >= 2) {
    const rotated = [...shuffled.slice(1), shuffled[0]];
    return rotated;
  }
  return shuffled;
}

// Node card geometry constants on the 2D blueprint canvas
const NODE_WIDTH = 190;
const NODE_HEIGHT = 96;
const CANVAS_COLS = 4;
const COL_GAP_X = 218;
const ROW_GAP_Y = 126;
const CANVAS_PAD_X = 24;
const CANVAS_PAD_Y = 28;

export interface PlacedNode {
  id: string;
  x: number;
  y: number;
  replicas: number;
}

export interface WireConnection {
  id: string;
  from: string;
  to: string;
}

interface ArchitectureMetrics {
  p99LatencyMs: number;
  throughputQps: string;
  answeredPercent: number;
  availabilityPercent: number;
  monthlyCost: number;
  targetBudget: number;
  starsEarned: number;
  bottleneckNode?: string;
  bottleneckNodeId?: string;
  bottleneckReason?: string;
}

// Determine realistic monthly unit cost and component tier (GonnaCrash FinOps style)
export function getNodeUnitCost(nodeId: string, name: string): { unitCost: number; isClient: boolean; tierLabel: string } {
  const key = `${nodeId} ${name}`.toLowerCase();
  if (
    nodeId === 'client' ||
    key.includes('browser') ||
    key.includes('creator') ||
    key.includes('mobile app') ||
    key.includes('user ') ||
    key.includes('sender') ||
    key.includes('driver app') ||
    key.includes('rider') ||
    key.includes('iot ') ||
    key.includes('pos terminal') ||
    key.includes('player')
  ) {
    return { unitCost: 0, isClient: true, tierLabel: 'Traffic Source' };
  }
  if (key.includes('cdn') || key.includes('cloudflare') || key.includes('anycast') || key.includes('dns')) {
    return { unitCost: 90, isClient: false, tierLabel: 'Edge Network' };
  }
  if (key.includes('gateway') || key.includes('balancer') || key.includes('envoy') || key.includes('nginx') || key.includes('ingress')) {
    return { unitCost: 140, isClient: false, tierLabel: 'Ingress / LB' };
  }
  if (key.includes('redis') || key.includes('memcached') || key.includes('cache') || key.includes('aerospike')) {
    return { unitCost: 200, isClient: false, tierLabel: 'In-Memory Cache' };
  }
  if (key.includes('kafka') || key.includes('pulsar') || key.includes('sqs') || key.includes('rabbit') || key.includes('kinesis') || key.includes('flink') || key.includes('spark')) {
    return { unitCost: 240, isClient: false, tierLabel: 'Stream / Queue' };
  }
  if (
    key.includes('db') ||
    key.includes('sql') ||
    key.includes('postgres') ||
    key.includes('dynamo') ||
    key.includes('cassandra') ||
    key.includes('clickhouse') ||
    key.includes('elastic') ||
    key.includes('s3') ||
    key.includes('spanner') ||
    key.includes('cockroach') ||
    key.includes('warehouse') ||
    key.includes('ledger')
  ) {
    return { unitCost: 320, isClient: false, tierLabel: 'Storage / DB' };
  }
  return { unitCost: 160, isClient: false, tierLabel: 'Compute Service' };
}

// Compute grid slot coordinates for auto-placement
function getGridPosition(index: number): { x: number; y: number } {
  const row = Math.floor(index / CANVAS_COLS);
  const col = index % CANVAS_COLS;
  return {
    x: CANVAS_PAD_X + col * COL_GAP_X,
    y: CANVAS_PAD_Y + row * ROW_GAP_Y,
  };
}

// Resolve ordered pipeline sequence from directed wires and placed nodes
export function resolveWiredSequence(
  placedNodes: PlacedNode[],
  wires: WireConnection[],
  expectedFirstId?: string
): { sequence: string[]; disconnectedIds: string[] } {
  if (placedNodes.length === 0) {
    return { sequence: [], disconnectedIds: [] };
  }
  if (placedNodes.length === 1 && wires.length === 0) {
    return { sequence: [placedNodes[0].id], disconnectedIds: [] };
  }

  const placedSet = new Set(placedNodes.map((n) => n.id));
  const validWires = wires.filter((w) => placedSet.has(w.from) && placedSet.has(w.to));

  const outMap = new Map<string, string>();
  const inDegree = new Map<string, number>();
  placedNodes.forEach((n) => inDegree.set(n.id, 0));

  validWires.forEach((w) => {
    if (!outMap.has(w.from)) {
      outMap.set(w.from, w.to);
    }
    inDegree.set(w.to, (inDegree.get(w.to) || 0) + 1);
  });

  // Pick start node: prefer expectedFirstId if its inDegree is 0, else first node with inDegree 0, else first placed node
  const zeroInNodes = placedNodes.filter((n) => (inDegree.get(n.id) || 0) === 0);
  let startId = placedNodes[0].id;
  if (expectedFirstId && zeroInNodes.some((n) => n.id === expectedFirstId)) {
    startId = expectedFirstId;
  } else if (zeroInNodes.length > 0) {
    startId = zeroInNodes[0].id;
  }

  const sequence: string[] = [];
  const visited = new Set<string>();
  let curr: string | undefined = startId;

  while (curr && placedSet.has(curr) && !visited.has(curr)) {
    visited.add(curr);
    sequence.push(curr);
    curr = outMap.get(curr);
  }

  const disconnectedIds = placedNodes.filter((n) => !visited.has(n.id)).map((n) => n.id);
  return { sequence, disconnectedIds };
}

export interface StageFlowExplanation {
  stageNumber: number;
  id: string;
  name: string;
  icon: string;
  role: string;
  tierLabel: string;
  unitCost: number;
  whyThisPosition: string;
  failureIfMisplaced: string;
}

// Build detailed stage-by-stage rationale explaining why each component must follow this exact infrastructure order
export function buildStageFlowExplanations(scenario: PuzzleScenario): StageFlowExplanation[] {
  const map = new Map(scenario.availableNodes.map((n) => [n.id, n]));
  const seq = scenario.correctSequence;

  return seq.map((nodeId, idx) => {
    const node = map.get(nodeId) || { id: nodeId, name: nodeId, icon: '⚙️', role: 'Core processing component' };
    const prevNode = idx > 0 ? map.get(seq[idx - 1]) : undefined;
    const nextNode = idx < seq.length - 1 ? map.get(seq[idx + 1]) : undefined;
    const { unitCost, tierLabel } = getNodeUnitCost(node.id, node.name);

    let whyThisPosition = '';
    let failureIfMisplaced = '';

    if (idx === 0) {
      whyThisPosition = `Entrypoint (Stage #1): Traffic originates at ${node.name} (${node.role}). It must sit at the head of the pipeline to initiate requests and forward them directly into ${nextNode?.name || 'the ingress layer'}.`;
      failureIfMisplaced = `Placing ${node.name} downstream breaks request origination — backend services cannot receive client traffic before the client emits it.`;
    } else if (tierLabel === 'Edge Network') {
      whyThisPosition = `Positioned immediately after ${prevNode?.name} and before ${nextNode?.name} so edge PoPs terminate TLS and absorb cached responses (${node.role}) before traffic traverses the WAN to origin servers.`;
      failureIfMisplaced = `Putting ${node.name} behind ${nextNode?.name || 'origin services'} defeats edge caching and forces 100% of ${scenario.qps} traffic through your core compute/database tiers.`;
    } else if (tierLabel === 'Ingress / LB') {
      whyThisPosition = `Placed after ${prevNode?.name} and in front of ${nextNode?.name} to enforce perimeter security, rate limiting, and load distribution (${node.role}) before internal services allocate threads or connections.`;
      failureIfMisplaced = `Bypassing or delaying ${node.name} exposes ${nextNode?.name || 'internal microservices'} to unthrottled traffic spikes, DDoS floods, and uneven load distribution.`;
    } else if (tierLabel === 'In-Memory Cache') {
      whyThisPosition = `Sits upstream of ${nextNode?.name || 'persistent storage'} and receives requests from ${prevNode?.name} to serve hot sub-millisecond lookups in RAM (${node.role}), shielding disk databases from repetitive read/state queries.`;
      failureIfMisplaced = `Wiring ${node.name} after the database (Cache-Behind anti-pattern) hits disk storage with 100% of raw ${scenario.qps} load, exhausting DB connection pools and spiking p99 latency.`;
    } else if (tierLabel === 'Stream / Queue') {
      whyThisPosition = `Decouples synchronous upstream producer ${prevNode?.name} from heavy downstream consumer ${nextNode?.name} (${node.role}), absorbing burst spikes asynchronously without blocking user-facing latency.`;
      failureIfMisplaced = `Without ${node.name} buffering between ${prevNode?.name || 'producers'} and ${nextNode?.name || 'consumers'}, traffic surges cause synchronous backpressure, thread starvation, and dropped events.`;
    } else if (tierLabel === 'Storage / DB') {
      whyThisPosition = `Placed after ${prevNode?.name} (${node.role})${nextNode ? ` and before ${nextNode.name}` : ''} so only validated, rate-limited, cache-missed, or queue-buffered operations reach durable storage.`;
      failureIfMisplaced = `Exposing ${node.name} too early in the pipeline without ${prevNode?.name} protection causes lock contention, IOPS saturation, and cascading outage under ${scenario.qps}.`;
    } else if (idx === seq.length - 1) {
      whyThisPosition = `Terminal Stage (#${idx + 1}): Receives processed output from ${prevNode?.name} to complete the workflow (${node.role}), ensuring all upstream validation, caching, and persistence steps have succeeded first.`;
      failureIfMisplaced = `Triggering ${node.name} before ${prevNode?.name} completes leads to stale reads, premature notifications, or unpersisted state.`;
    } else {
      whyThisPosition = `Bridges ${prevNode?.name} ➔ ${nextNode?.name}: Executes ${node.role} after ${prevNode?.name} completes upstream pre-processing and before handing off to ${nextNode?.name}.`;
      failureIfMisplaced = `Reordering ${node.name} out of Stage #${idx + 1} breaks the data dependency contract between ${prevNode?.name} and ${nextNode?.name}.`;
    }

    return {
      stageNumber: idx + 1,
      id: node.id,
      name: node.name,
      icon: node.icon,
      role: node.role,
      tierLabel,
      unitCost,
      whyThisPosition,
      failureIfMisplaced,
    };
  });
}

export {
  buildScenarioRequirements,
  type ScenarioRequirementsSpec,
  type HelloInterviewSpec,
} from '../../../data/helloInterviewSpecEngine';
import {
  buildScenarioRequirements,
  type ScenarioRequirementsSpec,
  type HelloInterviewSpec,
} from '../../../data/helloInterviewSpecEngine';

export default function ArchitecturePuzzleGame() {
  const { addExp, saveMiniGameScore, unlockAchievement } = useUserProgress();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'big_tech' | 'real_time' | 'fintech' | 'distributed'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'Medium' | 'Hard' | 'Staff+'>('all');
  const [seenPuzzleIds, setSeenPuzzleIds] = useState<string[]>(() => readSeenIds(SEEN_ARCH_PUZZLE_STORAGE_KEY));
  const [activeScenarioId, setActiveScenarioId] = useState<string>(() => {
    const initialSeen = readSeenIds(SEEN_ARCH_PUZZLE_STORAGE_KEY);
    const { item, nextSeenIds } = pickRandomUnseenItem(SYSTEM_DESIGN_PUZZLES, initialSeen);
    writeSeenIds(SEEN_ARCH_PUZZLE_STORAGE_KEY, nextSeenIds);
    return item.id;
  });

  // GonnaCrash 2D Whiteboard State: Placed Nodes + Directed Wires
  const [placedNodes, setPlacedNodes] = useState<PlacedNode[]>([]);
  const [wires, setWires] = useState<WireConnection[]>([]);
  const [autoWire, setAutoWire] = useState<boolean>(true);
  const [wiringSourceId, setWiringSourceId] = useState<string | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number } | null>(null);
  const [draggingCanvasNodeId, setDraggingCanvasNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [isDragOverCanvas, setIsDragOverCanvas] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [simulationState, setSimulationState] = useState<'idle' | 'simulating' | 'success' | 'failed'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [activeSimulationMetrics, setActiveSimulationMetrics] = useState<ArchitectureMetrics | null>(null);
  const [showTakeaways, setShowTakeaways] = useState<boolean>(true);
  const [showSolutionGuide, setShowSolutionGuide] = useState<boolean>(false);
  const [showRequirements, setShowRequirements] = useState<boolean>(true);
  const [activeSpecTab, setActiveSpecTab] = useState<'requirements' | 'api' | 'datapaths' | 'traps' | 'playbook'>('requirements');
  const [gameState, setGameState] = useState<'intro' | 'playing'>('intro');
  const [paletteShuffleSeed, setPaletteShuffleSeed] = useState<number>(0);

  // Hover states
  const [hoveredBankNodeId, setHoveredBankNodeId] = useState<string | null>(null);
  const [hoveredSeqNodeId, setHoveredSeqNodeId] = useState<string | null>(null);
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null);

  const [solvedScenarios, setSolvedScenarios] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('system_design_solved_puzzles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const filteredScenarios = useMemo(() => {
    return SYSTEM_DESIGN_PUZZLES.filter((s) => {
      const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'all' || s.difficulty === selectedDifficulty;
      return matchCat && matchDiff;
    });
  }, [selectedCategory, selectedDifficulty]);

  const activeScenario =
    SYSTEM_DESIGN_PUZZLES.find((s) => s.id === activeScenarioId) ||
    filteredScenarios[0] ||
    SYSTEM_DESIGN_PUZZLES[0];

  const activeDistractors = useMemo(() => {
    return getScenarioDistractors(activeScenario, 3);
  }, [activeScenario]);

  const distractorMap = useMemo(() => {
    return new Map(activeDistractors.map((d) => [d.id, d]));
  }, [activeDistractors]);

  const nodeMap = useMemo(() => {
    return new Map([...activeScenario.availableNodes, ...activeDistractors].map((n) => [n.id, n]));
  }, [activeScenario, activeDistractors]);

  // Randomly shuffled component palette combining required nodes + 3 unnecessary distractor traps
  const shuffledPaletteNodes = useMemo(() => {
    const combinedNodes = [...activeScenario.availableNodes, ...activeDistractors];
    return shuffleScenarioNodes(combinedNodes, activeScenario.correctSequence);
  }, [activeScenario, activeDistractors, paletteShuffleSeed]);

  // Detailed stage-by-stage flow explanations for the active scenario
  const stageFlowSteps = useMemo(() => {
    return buildStageFlowExplanations(activeScenario);
  }, [activeScenario]);

  // Calculate scenario monthly budget and current monthly spend
  const targetBudget = useMemo(() => {
    const baseTotal = activeScenario.availableNodes.reduce((sum, n) => {
      const { unitCost } = getNodeUnitCost(n.id, n.name);
      return sum + unitCost;
    }, 0);
    // Allow ~40% headroom so players can scale 1-2 critical bottleneck nodes without blowing the budget
    return Math.round((baseTotal * 1.4) / 50) * 50 || 1800;
  }, [activeScenario]);

  // Dedicated Functional Requirements (FR), Non-Functional Requirements (NFR) & What To Do First spec
  const scenarioRequirements = useMemo(() => {
    return buildScenarioRequirements(activeScenario, targetBudget);
  }, [activeScenario, targetBudget]);

  const currentMonthlyCost = useMemo(() => {
    return placedNodes.reduce((sum, pn) => {
      const meta = nodeMap.get(pn.id);
      const { unitCost } = getNodeUnitCost(pn.id, meta?.name || pn.id);
      return sum + unitCost * pn.replicas;
    }, 0);
  }, [placedNodes, nodeMap]);

  // Derive active wired sequence
  const { sequence: selectedSequence, disconnectedIds } = useMemo(() => {
    return resolveWiredSequence(placedNodes, wires, activeScenario.correctSequence[0]);
  }, [placedNodes, wires, activeScenario]);

  const resetSimulationStatus = () => {
    setSimulationState('idle');
    setFeedbackMessage('');
    setActiveSimulationMetrics(null);
  };

  const handleSelectScenario = (id: string) => {
    arcadeAudio.playFlip();
    setActiveScenarioId(id);
    setPlacedNodes([]);
    setWires([]);
    setWiringSourceId(null);
    setShowSolutionGuide(false);
    setPaletteShuffleSeed((s) => s + 1);
    resetSimulationStatus();
  };

  // Auto-build the optimal solution flow on the whiteboard canvas and open the stage-by-stage explanation
  const handleApplyOptimalSolution = () => {
    arcadeAudio.playCorrect();
    const correct = activeScenario.correctSequence;
    const optimalPlaced: PlacedNode[] = correct.map((nodeId, idx) => ({
      id: nodeId,
      ...getGridPosition(idx),
      replicas: 1,
    }));
    const optimalWires: WireConnection[] = [];
    for (let i = 0; i < optimalPlaced.length - 1; i++) {
      optimalWires.push({
        id: `${optimalPlaced[i].id}->${optimalPlaced[i + 1].id}`,
        from: optimalPlaced[i].id,
        to: optimalPlaced[i + 1].id,
      });
    }
    setPlacedNodes(optimalPlaced);
    setWires(optimalWires);
    setWiringSourceId(null);
    setShowSolutionGuide(true);
    setShowTakeaways(true);
    setFeedbackMessage('📖 Optimal architecture topology loaded onto whiteboard! Review the Stage-by-Stage Flow Explanation below or click "🚀 Simulate Traffic & Load Test".');
  };

  const handleNextScenario = () => {
    arcadeAudio.playFlip();
    const pool = filteredScenarios.length > 0 ? filteredScenarios : SYSTEM_DESIGN_PUZZLES;
    const { item, nextSeenIds } = pickRandomUnseenItem(pool, seenPuzzleIds, activeScenario.id);
    setSeenPuzzleIds(nextSeenIds);
    writeSeenIds(SEEN_ARCH_PUZZLE_STORAGE_KEY, nextSeenIds);
    handleSelectScenario(item.id);
  };

  const markScenarioSolved = (scenarioId: string) => {
    setSolvedScenarios((prev) => {
      if (prev.includes(scenarioId)) return prev;
      const updated = [...prev, scenarioId];
      try {
        localStorage.setItem('system_design_solved_puzzles', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Place a node onto the 2D canvas (via click or drag-and-drop)
  const handleAddNode = (nodeId: string, customPos?: { x: number; y: number }) => {
    if (placedNodes.some((n) => n.id === nodeId)) return;
    arcadeAudio.playBlip();

    const pos = customPos || getGridPosition(placedNodes.length);
    const nextNode: PlacedNode = {
      id: nodeId,
      x: Math.max(12, Math.min(pos.x, 700)),
      y: Math.max(16, pos.y),
      replicas: 1,
    };

    const nextPlaced = [...placedNodes, nextNode];
    setPlacedNodes(nextPlaced);

    // If autoWire is enabled, wire from the tail of the current chain (or last placed node) to this new node
    if (autoWire && placedNodes.length > 0) {
      const tailId =
        selectedSequence.length > 0
          ? selectedSequence[selectedSequence.length - 1]
          : placedNodes[placedNodes.length - 1].id;
      if (tailId && tailId !== nodeId) {
        const wireId = `${tailId}->${nodeId}`;
        setWires((prev) => (prev.some((w) => w.from === tailId) ? prev : [...prev, { id: wireId, from: tailId, to: nodeId }]));
      }
    }

    resetSimulationStatus();
  };

  const handleRemoveNode = (nodeId: string) => {
    arcadeAudio.playBlip();
    // If node is in the middle of a wire A -> nodeId -> B, bridge A -> B if autoWire is ON
    const incoming = wires.find((w) => w.to === nodeId);
    const outgoing = wires.find((w) => w.from === nodeId);

    let nextWires = wires.filter((w) => w.from !== nodeId && w.to !== nodeId);
    if (autoWire && incoming && outgoing && incoming.from !== outgoing.to) {
      const bridgeId = `${incoming.from}->${outgoing.to}`;
      if (!nextWires.some((w) => w.id === bridgeId)) {
        nextWires = [...nextWires, { id: bridgeId, from: incoming.from, to: outgoing.to }];
      }
    }

    setPlacedNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setWires(nextWires);
    if (wiringSourceId === nodeId) setWiringSourceId(null);
    resetSimulationStatus();
  };

  // Scale node replicas (- / +) like GonnaCrash
  const handleScaleNode = (nodeId: string, delta: number) => {
    arcadeAudio.playBlip();
    setPlacedNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        const nextRep = Math.max(1, Math.min(8, n.replicas + delta));
        return { ...n, replicas: nextRep };
      })
    );
    resetSimulationStatus();
  };

  // Move node order in pipeline and re-align grid coordinates
  const handleMoveNode = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= placedNodes.length) return;
    arcadeAudio.playBlip();
    const reordered = [...placedNodes];
    const temp = reordered[targetIdx];
    reordered[targetIdx] = reordered[index];
    reordered[index] = temp;

    const repositioned = reordered.map((node, i) => ({
      ...node,
      ...getGridPosition(i),
    }));
    setPlacedNodes(repositioned);

    // Re-wire sequentially
    const nextWires: WireConnection[] = [];
    for (let i = 0; i < repositioned.length - 1; i++) {
      nextWires.push({
        id: `${repositioned[i].id}->${repositioned[i + 1].id}`,
        from: repositioned[i].id,
        to: repositioned[i + 1].id,
      });
    }
    setWires(nextWires);
    resetSimulationStatus();
  };

  // Auto-align all placed nodes onto neat blueprint grid and connect wires in sequence
  const handleAutoAlignAndWire = () => {
    if (placedNodes.length === 0) return;
    arcadeAudio.playBlip();
    const aligned = placedNodes.map((n, idx) => ({
      ...n,
      ...getGridPosition(idx),
    }));
    const nextWires: WireConnection[] = [];
    for (let i = 0; i < aligned.length - 1; i++) {
      nextWires.push({
        id: `${aligned[i].id}->${aligned[i + 1].id}`,
        from: aligned[i].id,
        to: aligned[i + 1].id,
      });
    }
    setPlacedNodes(aligned);
    setWires(nextWires);
    setWiringSourceId(null);
    resetSimulationStatus();
  };

  // Connect two nodes via port click or wire drag
  const handleConnectWire = (fromId: string, toId: string) => {
    if (fromId === toId) {
      setWiringSourceId(null);
      return;
    }
    arcadeAudio.playBlip();
    // Replace any existing outgoing wire from `fromId` or incoming wire to `toId` so pipeline remains a clean chain
    const filtered = wires.filter((w) => w.from !== fromId && w.to !== toId && !(w.from === toId && w.to === fromId));
    setWires([...filtered, { id: `${fromId}->${toId}`, from: fromId, to: toId }]);
    setWiringSourceId(null);
    resetSimulationStatus();
  };

  const handleRemoveWire = (wireId: string) => {
    arcadeAudio.playBlip();
    setWires((prev) => prev.filter((w) => w.id !== wireId));
    resetSimulationStatus();
  };

  const handleClear = () => {
    arcadeAudio.playError();
    setPlacedNodes([]);
    setWires([]);
    setWiringSourceId(null);
    setPaletteShuffleSeed((s) => s + 1);
    resetSimulationStatus();
  };

  const handleGiveHint = () => {
    // First check if the player placed any unnecessary distractor component on the board
    const placedDistractor = placedNodes.map((n) => distractorMap.get(n.id)).find(Boolean);
    if (placedDistractor) {
      arcadeAudio.playError();
      setFeedbackMessage(
        `💡 Architect Hint: "${placedDistractor.name}" is an UNNECESSARY distractor component! ${placedDistractor.whyUnnecessary} Click ✕ on its card to remove it first.`
      );
      return;
    }

    const correct = activeScenario.correctSequence;
    let nextNeededId = '';
    for (let i = 0; i < correct.length; i++) {
      if (i >= selectedSequence.length || selectedSequence[i] !== correct[i]) {
        nextNeededId = correct[i];
        break;
      }
    }
    if (!nextNeededId && disconnectedIds.length === 0) {
      arcadeAudio.playCorrect();
      setFeedbackMessage('✨ Pipeline topology is 100% wired! Click "🚀 Simulate Traffic & Load Test".');
      return;
    }

    const targetId = nextNeededId || correct[0];
    if (!placedNodes.some((n) => n.id === targetId)) {
      handleAddNode(targetId);
    } else {
      // Node is already on canvas, align and wire up to that point
      handleAutoAlignAndWire();
    }
    arcadeAudio.playBlip();
    const node = activeScenario.availableNodes.find((n) => n.id === targetId);
    setFeedbackMessage(`💡 Architect Hint: Drop & wire "${node?.name || targetId}" at stage #${correct.indexOf(targetId) + 1} of your topology.`);
  };

  // HTML5 Drag & Drop handlers from Palette Bank onto Canvas
  const handlePaletteDragStart = (e: React.DragEvent<HTMLButtonElement>, nodeId: string) => {
    e.dataTransfer.setData('text/plain', nodeId);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOverCanvas) setIsDragOverCanvas(true);
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    const nodeId = e.dataTransfer.getData('text/plain');
    if (!nodeId || !nodeMap.has(nodeId)) return;

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const dropX = e.clientX - rect.left + canvasRef.current.scrollLeft - NODE_WIDTH / 2;
      const dropY = e.clientY - rect.top + canvasRef.current.scrollTop - NODE_HEIGHT / 2;

      if (placedNodes.some((n) => n.id === nodeId)) {
        // Reposition existing node
        setPlacedNodes((prev) =>
          prev.map((n) => (n.id === nodeId ? { ...n, x: Math.max(12, dropX), y: Math.max(16, dropY) } : n))
        );
      } else {
        handleAddNode(nodeId, { x: dropX, y: dropY });
      }
    } else {
      handleAddNode(nodeId);
    }
  };

  // Pointer drag for moving nodes smoothly on the 2D canvas
  const handleNodeMouseDown = (e: React.MouseEvent<HTMLDivElement>, node: PlacedNode) => {
    // Ignore clicks on buttons or ports inside the node card
    if ((e.target as HTMLElement).closest('button')) return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + canvasRef.current.scrollLeft;
    const mouseY = e.clientY - rect.top + canvasRef.current.scrollTop;
    setDraggingCanvasNodeId(node.id);
    setDragOffset({ dx: mouseX - node.x, dy: mouseY - node.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + canvasRef.current.scrollLeft;
    const mouseY = e.clientY - rect.top + canvasRef.current.scrollTop;

    if (wiringSourceId) {
      setMouseCanvasPos({ x: mouseX, y: mouseY });
    }

    if (draggingCanvasNodeId) {
      setPlacedNodes((prev) =>
        prev.map((n) =>
          n.id === draggingCanvasNodeId
            ? {
                ...n,
                x: Math.max(10, Math.min(720, mouseX - dragOffset.dx)),
                y: Math.max(12, Math.min(520, mouseY - dragOffset.dy)),
              }
            : n
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    if (draggingCanvasNodeId) {
      setDraggingCanvasNodeId(null);
    }
  };

  // Analyze wired topology and calculate GonnaCrash telemetry & star rating
  const evaluateArchitecture = (seq: string[], correct: string[]): ArchitectureMetrics => {
    const placedDistractor = placedNodes.map((n) => distractorMap.get(n.id)).find(Boolean);
    const isExact =
      !placedDistractor &&
      disconnectedIds.length === 0 &&
      seq.length === correct.length &&
      seq.every((id, idx) => id === correct[idx]);

    let bottleneckNode: string | undefined;
    let bottleneckNodeId: string | undefined;
    let bottleneckReason: string | undefined;

    const hasClient = seq.includes('client') || (seq.length > 0 && seq[0] === correct[0]);
    const hasCache = seq.some((id) => id.includes('redis') || id.includes('memcached') || id.includes('cache'));
    const hasDb = seq.some((id) => id.includes('db') || id.includes('sql') || id.includes('postgres') || id.includes('mongo') || id.includes('dynamo'));

    const cacheIdx = seq.findIndex((id) => id.includes('redis') || id.includes('cache'));
    const dbIdx = seq.findIndex((id) => id.includes('db') || id.includes('sql') || id.includes('postgres') || id.includes('mongo') || id.includes('dynamo'));

    if (placedDistractor) {
      bottleneckNodeId = placedDistractor.id;
      bottleneckNode = placedDistractor.name;
      bottleneckReason = `🚫 Unnecessary Component Trap ("${placedDistractor.name}"): ${placedDistractor.whyUnnecessary} Remove this component from the whiteboard!`;
    } else if (disconnectedIds.length > 0) {
      const unwiredId = disconnectedIds[0];
      const unwiredMeta = nodeMap.get(unwiredId);
      bottleneckNodeId = unwiredId;
      bottleneckNode = unwiredMeta?.name || unwiredId;
      bottleneckReason = `Unwired Component Hazard: "${bottleneckNode}" is placed on the whiteboard but not connected via wire! Connect its ports or click "📐 Auto-Align & Wire".`;
    } else if (!hasClient && seq.length > 0) {
      const firstMeta = nodeMap.get(seq[0]);
      const expectedFirstMeta = nodeMap.get(correct[0]);
      bottleneckNodeId = seq[0];
      bottleneckNode = firstMeta?.name || seq[0];
      bottleneckReason = `Missing Traffic Entrypoint: Pipeline must originate from "${expectedFirstMeta?.name || correct[0]}", not "${bottleneckNode}".`;
    } else if (hasCache && hasDb && cacheIdx > dbIdx && dbIdx !== -1) {
      const dbMeta = nodeMap.get(seq[dbIdx]);
      bottleneckNodeId = seq[dbIdx];
      bottleneckNode = dbMeta?.name || seq[dbIdx];
      bottleneckReason = `Cache-Behind Bottleneck! "${bottleneckNode}" is hit with 100% raw uncached reads before checking Redis/Cache, exhausting DB connection pools!`;
    } else if (!isExact) {
      for (let i = 0; i < Math.max(seq.length, correct.length); i++) {
        if (seq[i] !== correct[i]) {
          const expectedNode = nodeMap.get(correct[i]);
          const actualId = seq[i] || seq[seq.length - 1];
          const actualNode = nodeMap.get(actualId);
          bottleneckNodeId = actualId;
          bottleneckNode = actualNode?.name || actualId || 'Missing Layer';
          bottleneckReason = seq[i]
            ? `Node CRASHED at Stage #${i + 1}: "${actualNode?.name || seq[i]}" overloaded because upstream "${expectedNode?.name || correct[i]}" was bypassed or miswired!`
            : `Pipeline Truncated after Stage #${seq.length}: Missing "${expectedNode?.name || correct[i]}" downstream!`;
          break;
        }
      }
    }

    const totalReplicas = placedNodes.reduce((sum, n) => sum + n.replicas, 0);
    const replicaSpeedup = Math.max(0, (totalReplicas - placedNodes.length) * 0.4);

    if (isExact) {
      const simulatedLatency = Number(Math.max(1.8, 4.8 - replicaSpeedup).toFixed(1));
      const withinBudget = currentMonthlyCost <= targetBudget;
      const starsEarned = withinBudget ? 3 : 2;
      return {
        p99LatencyMs: simulatedLatency,
        throughputQps: activeScenario.qps || '50,000 QPS',
        answeredPercent: 100,
        availabilityPercent: 99.99,
        monthlyCost: currentMonthlyCost,
        targetBudget,
        starsEarned,
      };
    } else {
      const penalty = Math.abs(correct.length - seq.length) + disconnectedIds.length;
      const answered = Math.max(12.4, Number((88.5 - penalty * 14.2).toFixed(1)));
      return {
        p99LatencyMs: Math.min(8400, 420 + penalty * 850 + (hasCache ? 0 : 1800)),
        throughputQps: '1,420 QPS (Crashed)',
        answeredPercent: answered,
        availabilityPercent: Math.max(72.5, 99.5 - penalty * 6.5),
        monthlyCost: currentMonthlyCost,
        targetBudget,
        starsEarned: 0,
        bottleneckNode,
        bottleneckNodeId,
        bottleneckReason,
      };
    }
  };

  const handleTestArchitecture = () => {
    if (placedNodes.length === 0) {
      arcadeAudio.playError();
      setFeedbackMessage('⚠️ Drag or click at least 1 component onto the whiteboard canvas to run simulation.');
      return;
    }

    arcadeAudio.playLaser();
    setSimulationState('simulating');
    setFeedbackMessage(`⚡ Injecting live traffic (${activeScenario.qps}) across ${wires.length} wire connections...`);

    setTimeout(() => {
      const correct = activeScenario.correctSequence;
      const metrics = evaluateArchitecture(selectedSequence, correct);
      setActiveSimulationMetrics(metrics);

      if (metrics.starsEarned > 0) {
        setSimulationState('success');
        markScenarioSolved(activeScenario.id);
        addExp(50, `Solved System Architecture: ${activeScenario.title}`);
        saveMiniGameScore('architecture_puzzle', (solvedScenarios.length + 1) * 100);
        unlockAchievement('system_architect');
        arcadeAudio.playVictory();
        triggerFireworks(2500);
        const starStr = '⭐'.repeat(metrics.starsEarned) + '☆'.repeat(3 - metrics.starsEarned);
        const budgetNote =
          metrics.monthlyCost <= metrics.targetBudget
            ? `Within FinOps Budget ($${metrics.monthlyCost}/mo <= $${metrics.targetBudget}/mo)!`
            : `Over FinOps Budget ($${metrics.monthlyCost}/mo > $${metrics.targetBudget}/mo — scale down replicas for 3rd ⭐)!`;
        setFeedbackMessage(
          `✅ 200 OK [${starStr}]! 100% Answered Requests at ${metrics.p99LatencyMs}ms p99 latency. ${budgetNote}`
        );
      } else {
        setSimulationState('failed');
        arcadeAudio.playError();
        setFeedbackMessage(
          `💥 SYSTEM CRASHED (${metrics.answeredPercent}% Answered): ${metrics.bottleneckReason || 'Component wiring mismatch.'}`
        );
      }
    }, 1200);
  };

  // Compute dynamic canvas height based on placed nodes
  const canvasHeight = useMemo(() => {
    const maxNodeY = placedNodes.reduce((max, n) => Math.max(max, n.y + NODE_HEIGHT + 36), 310);
    return Math.max(310, maxNodeY);
  }, [placedNodes]);

  // Helper to get Output Port (right edge) and Input Port (left edge) coordinates
  const getOutputPortCoords = (node: PlacedNode) => ({
    x: node.x + NODE_WIDTH,
    y: node.y + NODE_HEIGHT / 2,
  });
  const getInputPortCoords = (node: PlacedNode) => ({
    x: node.x,
    y: node.y + NODE_HEIGHT / 2,
  });

  // Build cubic Bezier SVG path between two points
  const buildWireBezierPath = (x1: number, y1: number, x2: number, y2: number): string => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx >= 20) {
      // Forward horizontal connection
      const ctrlOffset = Math.max(45, dx * 0.45);
      return `M ${x1} ${y1} C ${x1 + ctrlOffset} ${y1}, ${x2 - ctrlOffset} ${y2}, ${x2} ${y2}`;
    } else {
      // Wrapping to next row (snake curve)
      const midY = (y1 + y2) / 2 + (Math.abs(dy) < 40 ? 60 : 0);
      return `M ${x1} ${y1} C ${x1 + 70} ${y1}, ${x1 + 70} ${midY}, ${(x1 + x2) / 2} ${midY} S ${x2 - 70} ${y2}, ${x2} ${y2}`;
    }
  };

  return (
    <div
      className="arcade-game-arena architecture-puzzle-game"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '22px',
        color: '#f8fafc',
      }}
    >
      {/* ── CSS Keyframes for GonnaCrash live packet flow & CRASHED stamp ── */}
      <style>{`
        @keyframes flowPacketGlow {
          0% { stroke-dashoffset: 48; opacity: 0.4; }
          50% { opacity: 1; filter: drop-shadow(0 0 6px #38bdf8); }
          100% { stroke-dashoffset: 0; opacity: 0.4; }
        }
        @keyframes wireDashFlow {
          to { stroke-dashoffset: -28; }
        }
        @keyframes pulseSuccess {
          0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4); }
          70% { box-shadow: 0 0 0 12px rgba(52, 211, 153, 0); }
          100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
        }
        @keyframes pulseError {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55); }
          70% { box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes crashStampSlam {
          0% { transform: translate(-50%, -50%) rotate(-14deg) scale(2.2); opacity: 0; }
          70% { transform: translate(-50%, -50%) rotate(-14deg) scale(0.92); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(-14deg) scale(1); opacity: 1; }
        }
        .gonnacrash-blueprint-canvas {
          background-color: #070b14 !important;
          background-image: radial-gradient(rgba(56, 189, 248, 0.16) 1px, transparent 1px) !important;
          background-size: 20px 20px !important;
        }
        .gonnacrash-node-card {
          background: rgba(15, 23, 42, 0.94) !important;
          color: #f8fafc !important;
          user-select: none;
        }
        .gonnacrash-node-card * {
          color: inherit;
        }
        [data-theme="light"] .arcade-game-arena .gonnacrash-blueprint-canvas button.gonnacrash-port-btn,
        [data-theme="light"] .arcade-game-arena .gonnacrash-blueprint-canvas button.gonnacrash-replica-btn {
          color: #f8fafc !important;
          background: rgba(30, 41, 59, 0.9) !important;
        }
      `}</style>

      {/* ── 1. INTRO / START SCREEN ── */}
      {gameState === 'intro' && (
        <div style={{ textAlign: 'center', padding: '16px 10px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⚙️</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
            Architecture Pipe Puzzle
          </div>
          <div style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '640px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
            Drag and drop infrastructure components onto the whiteboard canvas, wire ports together, scale replicas within your FinOps monthly budget, and survive live 50,000 QPS traffic spikes without crashing!
          </div>

          {/* Quick Selectors Row */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { id: 'all', label: 'All Arenas', icon: '🌐' },
                { id: 'big_tech', label: 'Big Tech', icon: '🚀' },
                { id: 'real_time', label: 'Real-Time', icon: '⚡' },
                { id: 'fintech', label: 'FinTech', icon: '💳' },
                { id: 'distributed', label: 'Distributed', icon: '🗄️' },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      arcadeAudio.playBlip();
                      const nextCat = cat.id as any;
                      setSelectedCategory(nextCat);
                      const pool = SYSTEM_DESIGN_PUZZLES.filter((s) => {
                        const mCat = nextCat === 'all' || s.category === nextCat;
                        const mDiff = selectedDifficulty === 'all' || s.difficulty === selectedDifficulty;
                        return mCat && mDiff;
                      });
                      const validPool = pool.length > 0 ? pool : SYSTEM_DESIGN_PUZZLES;
                      const { item, nextSeenIds } = pickRandomUnseenItem(validPool, seenPuzzleIds, activeScenario.id);
                      setSeenPuzzleIds(nextSeenIds);
                      writeSeenIds(SEEN_ARCH_PUZZLE_STORAGE_KEY, nextSeenIds);
                      handleSelectScenario(item.id);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.78rem',
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{cat.icon}</span> <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Difficulty Pills */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {['all', 'Medium', 'Hard', 'Staff+'].map((diff) => {
                const isSelected = selectedDifficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => {
                      arcadeAudio.playBlip();
                      const nextDiff = diff as any;
                      setSelectedDifficulty(nextDiff);
                      const pool = SYSTEM_DESIGN_PUZZLES.filter((s) => {
                        const mCat = selectedCategory === 'all' || s.category === selectedCategory;
                        const mDiff = nextDiff === 'all' || s.difficulty === nextDiff;
                        return mCat && mDiff;
                      });
                      const validPool = pool.length > 0 ? pool : SYSTEM_DESIGN_PUZZLES;
                      const { item, nextSeenIds } = pickRandomUnseenItem(validPool, seenPuzzleIds, activeScenario.id);
                      setSeenPuzzleIds(nextSeenIds);
                      writeSeenIds(SEEN_ARCH_PUZZLE_STORAGE_KEY, nextSeenIds);
                      handleSelectScenario(item.id);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isSelected ? '#a855f7' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: isSelected ? '#c084fc' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.78rem',
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    {diff === 'all' ? '⭐ All' : diff === 'Medium' ? '🟡 Medium' : diff === 'Hard' ? '🔴 Hard' : '👑 Staff+'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Random Mission Reroll Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={handleNextScenario}
              style={{
                padding: '8px 20px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.14)',
                border: '1.5px solid rgba(56, 189, 248, 0.5)',
                color: '#38bdf8',
                fontSize: '0.86rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🎲 Reroll Random Architecture Mission ({filteredScenarios.length} in Pool)</span>
            </button>
          </div>

          {/* Selected Scenario Preview Box */}
          <div
            style={{
              maxWidth: '680px',
              margin: '0 auto 22px auto',
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                {activeScenario.badge} {activeScenario.title}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '5px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 800 }}>
                  {activeScenario.category.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '5px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', fontWeight: 800 }}>
                  {activeScenario.difficulty}
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.45, marginBottom: '12px' }}>
              {activeScenario.goal}
            </div>

            {/* Target Specs Badges */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.76rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.25)', fontWeight: 750 }}>
                ⚡ Target Traffic: {activeScenario.qps}
              </div>
              <div style={{ fontSize: '0.76rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.25)', fontWeight: 750 }}>
                📊 Scale: {activeScenario.scaleMetric}
              </div>
              <div style={{ fontSize: '0.76rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.25)', fontWeight: 750 }}>
                💰 Budget Cap: ${targetBudget.toLocaleString()}/mo
              </div>
            </div>

            {/* HelloInterview Framework: Functional & Non-Functional Capacity Specs on Intro */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '10px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.06)',
                  border: '1px solid rgba(56, 189, 248, 0.22)',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎯 In-Scope Functional Requirements</span>
                  <span style={{ fontSize: '0.66rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>Core Scope</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                  {scenarioRequirements.helloInterview.inScope.map((fr) => (
                    <div key={fr.id} style={{ fontSize: '0.73rem', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 800, color: '#34d399', marginRight: '4px' }}>{fr.id}:</span>
                      <strong style={{ color: '#f8fafc' }}>{fr.title}</strong>
                      <span style={{ color: 'rgba(255, 255, 255, 0.72)' }}> — {fr.detail}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '6px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', color: '#f87171', marginBottom: '2px' }}>
                    🚫 Below the Line (Scoped Out Upfront by Staff Engineers):
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.68)', lineHeight: 1.35 }}>
                    {scenarioRequirements.helloInterview.outOfScope.join(' • ')}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(168, 85, 247, 0.06)',
                  border: '1px solid rgba(168, 85, 247, 0.22)',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#c084fc', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡ Scale, Capacity &amp; NFR Invariants</span>
                  <span style={{ fontSize: '0.66rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc' }}>Estimations</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {scenarioRequirements.helloInterview.capacityEstimations.map((est, idx) => (
                    <div key={idx} style={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
                      <strong style={{ color: '#e2e8f0' }}>{est.category}: </strong>
                      <span style={{ color: '#34d399', fontWeight: 750 }}>{est.metric}</span>
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '1px' }}>{est.derivation}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Core API Contracts & First Step Callout on Intro */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.06)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontSize: '0.72rem',
                }}
              >
                <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                  🔌 Core API Endpoints (Define Contracts Before Drawing Boxes):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {scenarioRequirements.helloInterview.apiContracts.slice(0, 2).map((api, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>{api.method}</span>
                      <code style={{ fontSize: '0.71rem', color: '#f8fafc', background: 'transparent' }}>{api.endpoint}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.28)',
                  fontSize: '0.74rem',
                  color: 'rgba(255, 255, 255, 0.88)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div>
                  <strong style={{ color: '#34d399' }}>🧭 What Should We Do First?</strong>{' '}
                  <span style={{ color: '#fbbf24', fontWeight: 750 }}>{scenarioRequirements.whatToDoFirst[0]?.title}</span>
                </div>
                <div style={{ fontSize: '0.71rem', color: 'rgba(255, 255, 255, 0.75)', marginTop: '2px' }}>
                  {scenarioRequirements.whatToDoFirst[0]?.instruction}
                </div>
              </div>
            </div>

            {/* Building Blocks Preview (Randomized) */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>
                🔀 Shuffled Infrastructure Components ({shuffledPaletteNodes.length}):
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {shuffledPaletteNodes.map((n) => {
                  const { unitCost } = getNodeUnitCost(n.id, n.name);
                  return (
                    <span
                      key={n.id}
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.75)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>{n.icon}</span> <span>{n.name}</span>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>{unitCost === 0 ? 'Free' : `$${unitCost}`}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Solved Progress Banner */}
          <div style={{ marginBottom: '22px' }}>
            <span style={{ fontSize: '0.82rem', padding: '4px 14px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', fontWeight: 800 }}>
              🏆 {solvedScenarios.length} / {SYSTEM_DESIGN_PUZZLES.length} Architecture Puzzles Solved
            </span>
          </div>

          {/* 🚀 START BUTTON */}
          <button
            type="button"
            className="arcade-start-btn"
            onClick={() => {
              arcadeAudio.playLaser();
              setGameState('playing');
            }}
            style={{
              padding: '14px 44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1.08rem',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            🚀 Start Architecture Challenge
          </button>
        </div>
      )}

      {/* ── 2. IN-GAME GONNACRASH WHITEBOARD BUILDER ── */}
      {gameState === 'playing' && (
        <>
          {/* Top Header Bar with Active Random Mission & Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              paddingBottom: '14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#0f172a',
                  border: '1.5px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                }}
              >
                {solvedScenarios.includes(activeScenario.id) ? '✓ ' : ''}{activeScenario.badge} {activeScenario.title} ({activeScenario.difficulty})
              </span>

              {/* Difficulty Pills */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {['all', 'Medium', 'Hard', 'Staff+'].map((diff) => {
                  const isSelected = selectedDifficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => {
                        arcadeAudio.playBlip();
                        const nextDiff = diff as any;
                        setSelectedDifficulty(nextDiff);
                        const pool = SYSTEM_DESIGN_PUZZLES.filter((s) => {
                          const mCat = selectedCategory === 'all' || s.category === selectedCategory;
                          const mDiff = nextDiff === 'all' || s.difficulty === nextDiff;
                          return mCat && mDiff;
                        });
                        const validPool = pool.length > 0 ? pool : SYSTEM_DESIGN_PUZZLES;
                        const { item, nextSeenIds } = pickRandomUnseenItem(validPool, seenPuzzleIds, activeScenario.id);
                        setSeenPuzzleIds(nextSeenIds);
                        writeSeenIds(SEEN_ARCH_PUZZLE_STORAGE_KEY, nextSeenIds);
                        handleSelectScenario(item.id);
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.74rem',
                        fontWeight: 750,
                        cursor: 'pointer',
                      }}
                    >
                      {diff === 'all' ? 'All' : diff}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Controls */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  arcadeAudio.playBlip();
                  setAutoWire(!autoWire);
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: autoWire ? 'rgba(52, 211, 153, 0.14)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${autoWire ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`,
                  color: autoWire ? '#34d399' : 'rgba(255, 255, 255, 0.65)',
                  fontSize: '0.74rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
                title="Automatically connect wires when placing components"
              >
                🔌 Auto-Wire: {autoWire ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={handleAutoAlignAndWire}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  fontSize: '0.74rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
                title="Neatly align placed nodes on the grid and connect wires sequentially"
              >
                📐 Auto-Align & Wire
              </button>
              <button
                type="button"
                onClick={handleGiveHint}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  color: '#fbbf24',
                  fontSize: '0.75rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                💡 Hint
              </button>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.75rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                🗑️ Clear
              </button>
              <button
                type="button"
                onClick={handleNextScenario}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
                title="Pick Random Unseen Scenario"
              >
                🎲 Random
              </button>
              <button
                type="button"
                onClick={() => {
                  arcadeAudio.playBlip();
                  setGameState('intro');
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.75rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                ⚙️ Setup
              </button>
              <div style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontSize: '0.75rem', fontWeight: 800 }}>
                🏆 {solvedScenarios.length} / {SYSTEM_DESIGN_PUZZLES.length} Solved
              </div>
            </div>
          </div>

          {/* ── System Objective & FinOps Budget HUD Bar ── */}
          <div
            style={{
              marginBottom: '14px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ flex: '1 1 360px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.2rem' }}>{activeScenario.badge}</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{activeScenario.title}</span>
                <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 700 }}>
                  Scale: {activeScenario.scaleMetric}
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', fontWeight: 700 }}>
                  Target: {activeScenario.qps}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.78)', lineHeight: 1.4 }}>
                {activeScenario.goal}
              </div>
            </div>

            {/* GonnaCrash FinOps Monthly Budget Meter */}
            <div
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: `1px solid ${currentMonthlyCost > targetBudget ? '#ef4444' : 'rgba(52, 211, 153, 0.35)'}`,
                minWidth: '215px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, marginBottom: '4px' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>💰 MONTHLY BUDGET</span>
                <span style={{ color: currentMonthlyCost > targetBudget ? '#f87171' : '#34d399' }}>
                  ${currentMonthlyCost.toLocaleString()} / ${targetBudget.toLocaleString()}/mo
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.round((currentMonthlyCost / targetBudget) * 100))}%`,
                    height: '100%',
                    background: currentMonthlyCost > targetBudget ? '#ef4444' : currentMonthlyCost > targetBudget * 0.85 ? '#fbbf24' : '#34d399',
                    transition: 'all 0.25s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── 2B. DEDICATED FUNCTIONAL & NON-FUNCTIONAL REQUIREMENTS + WHAT SHOULD WE DO FIRST ── */}
          <div
            style={{
              marginBottom: '14px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.78)',
              border: '1px solid rgba(56, 189, 248, 0.28)',
            }}
          >
            <div
              onClick={() => setShowRequirements(!showRequirements)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8' }}>
                <span>🧠 HelloInterview System Design Spec &amp; Architecture Workbench</span>
                <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.16)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  FAANG / Staff Framework
                </span>
              </div>
              <span style={{ fontSize: '0.73rem', fontWeight: 750, color: '#94a3b8' }}>
                {showRequirements ? '▲ Collapse Spec' : '▼ Expand HelloInterview Breakdown'}
              </span>
            </div>

            {showRequirements && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 5-Tab Navigation Bar */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
                  {[
                    { id: 'requirements', label: '1. Requirements & Scope', icon: '🎯' },
                    { id: 'api', label: '2. API & Data Model', icon: '🔌' },
                    { id: 'datapaths', label: '3. Write vs Read Paths', icon: '🔄' },
                    { id: 'traps', label: '4. Staff Traps & Rebuttals', icon: '⚠️' },
                    { id: 'playbook', label: '5. What To Do First', icon: '🧭' },
                  ].map((tab) => {
                    const isActive = activeSpecTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          arcadeAudio.playBlip();
                          setActiveSpecTab(tab.id as typeof activeSpecTab);
                        }}
                        style={{
                          padding: '5px 11px',
                          borderRadius: '6px',
                          border: `1px solid ${isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}`,
                          background: isActive ? 'rgba(56, 189, 248, 0.18)' : 'rgba(0, 0, 0, 0.25)',
                          color: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.75)',
                          fontWeight: isActive ? 800 : 650,
                          fontSize: '0.73rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: REQUIREMENTS & SCOPE + CAPACITY ESTIMATIONS */}
                {activeSpecTab === 'requirements' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(56, 189, 248, 0.06)',
                        border: '1px solid rgba(56, 189, 248, 0.22)',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>🎯 Functional Requirements (FR)</span>
                        <span style={{ color: '#34d399' }}>In-Scope vs Out-of-Scope</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                        {scenarioRequirements.helloInterview.inScope.map((fr) => (
                          <div key={fr.id} style={{ fontSize: '0.74rem', lineHeight: 1.4 }}>
                            <span style={{ fontWeight: 800, color: '#34d399', marginRight: '4px' }}>{fr.id}:</span>
                            <strong style={{ color: '#f8fafc' }}>{fr.title}</strong>
                            <div style={{ fontSize: '0.71rem', color: 'rgba(255, 255, 255, 0.72)', paddingLeft: '14px', marginTop: '1px' }}>
                              {fr.detail}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ padding: '6px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                        <div style={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', color: '#f87171', marginBottom: '2px' }}>
                          🚫 Below the Line (Scoped Out Upfront by Staff Engineers):
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.35 }}>
                          {scenarioRequirements.helloInterview.outOfScope.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(168, 85, 247, 0.06)',
                        border: '1px solid rgba(168, 85, 247, 0.22)',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#c084fc', marginBottom: '6px' }}>
                        ⚡ Quantitative Scale &amp; Capacity Estimations (NFR)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {scenarioRequirements.helloInterview.capacityEstimations.map((est, idx) => (
                          <div key={idx} style={{ padding: '6px 8px', borderRadius: '6px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.69rem', fontWeight: 800, color: '#c084fc' }}>{est.category}</span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34d399' }}>{est.metric}</span>
                            </div>
                            <div style={{ fontSize: '0.69rem', color: 'rgba(255, 255, 255, 0.68)', lineHeight: 1.35 }}>
                              {est.derivation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: API CONTRACTS & CORE DATA ENTITIES */}
                {activeSpecTab === 'api' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(56, 189, 248, 0.06)',
                        border: '1px solid rgba(56, 189, 248, 0.22)',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', marginBottom: '6px' }}>
                        🔌 Core REST / gRPC API Contracts (Define First)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {scenarioRequirements.helloInterview.apiContracts.map((api, idx) => (
                          <div key={idx} style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontSize: '0.66rem',
                                  fontWeight: 900,
                                  background: api.method === 'POST' ? 'rgba(52, 211, 153, 0.2)' : api.method === 'GET' ? 'rgba(56, 189, 248, 0.2)' : api.method === 'PUT' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                  color: api.method === 'POST' ? '#34d399' : api.method === 'GET' ? '#38bdf8' : api.method === 'PUT' ? '#fbbf24' : '#c084fc',
                                }}
                              >
                                {api.method}
                              </span>
                              <code style={{ fontSize: '0.72rem', color: '#f8fafc', background: 'transparent' }}>{api.endpoint}</code>
                            </div>
                            <div style={{ fontSize: '0.71rem', color: 'rgba(255,255,255,0.78)', marginBottom: '4px' }}>{api.purpose}</div>
                            {api.responseSample && (
                              <div style={{ fontSize: '0.67rem', fontFamily: 'monospace', color: '#94a3b8', background: 'rgba(0,0,0,0.45)', padding: '4px 6px', borderRadius: '4px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                                {api.responseSample}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(168, 85, 247, 0.06)',
                        border: '1px solid rgba(168, 85, 247, 0.22)',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#c084fc', marginBottom: '6px' }}>
                        📦 Core Data Model Entities
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {scenarioRequirements.helloInterview.coreEntities.map((ent, idx) => (
                          <div key={idx} style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '2px' }}>
                              {ent.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#38bdf8', marginBottom: '4px' }}>
                              {ent.attributes}
                            </div>
                            <div style={{ fontSize: '0.71rem', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.35 }}>
                              {ent.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: WRITE PATH VS READ PATH (ARCHITECTURAL BIFURCATION) */}
                {activeSpecTab === 'datapaths' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(249, 115, 22, 0.07)',
                        border: '1px solid rgba(249, 115, 22, 0.28)',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#fb923c', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>✍️</span>
                        <span>{scenarioRequirements.helloInterview.dataFlowPaths.writePath.title}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {scenarioRequirements.helloInterview.dataFlowPaths.writePath.steps.map((step, idx) => (
                          <div key={idx} style={{ fontSize: '0.73rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4 }}>
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(56, 189, 248, 0.07)',
                        border: '1px solid rgba(56, 189, 248, 0.28)',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>📖</span>
                        <span>{scenarioRequirements.helloInterview.dataFlowPaths.readPath.title}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {scenarioRequirements.helloInterview.dataFlowPaths.readPath.steps.map((step, idx) => (
                          <div key={idx} style={{ fontSize: '0.73rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4 }}>
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: CLASSIC INTERVIEWER TRAPS & STAFF REBUTTALS */}
                {activeSpecTab === 'traps' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {scenarioRequirements.helloInterview.interviewerTraps.map((trap, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(251, 191, 36, 0.35)',
                        }}
                      >
                        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fbbf24', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>⚡</span>
                          <span>{trap.trapTitle}</span>
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.09)',
                              border: '1px solid rgba(239, 68, 68, 0.28)',
                            }}
                          >
                            <div style={{ fontSize: '0.67rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: '3px' }}>
                              ❌ Junior / Mid Answer (Fails Under Production Scale):
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.78)', lineHeight: 1.38 }}>
                              {trap.juniorAnswer}
                            </div>
                          </div>

                          <div
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              background: 'rgba(52, 211, 153, 0.09)',
                              border: '1px solid rgba(52, 211, 153, 0.28)',
                            }}
                          >
                            <div style={{ fontSize: '0.67rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '3px' }}>
                              ✅ Staff / Principal Rebuttal (Physical Engine Truth):
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#f8fafc', lineHeight: 1.38 }}>
                              {trap.staffRebuttal}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 5: WHAT SHOULD WE DO FIRST (PLAYBOOK STRATEGY & ACTIONS) */}
                {activeSpecTab === 'playbook' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* HelloInterview 4-Step Playbook Guidance */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '8px',
                      }}
                    >
                      {scenarioRequirements.helloInterview.playbookSteps.map((pb, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: 'rgba(56, 189, 248, 0.06)',
                            border: '1px solid rgba(56, 189, 248, 0.22)',
                          }}
                        >
                          <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                            {pb.step} • {pb.phase}
                          </div>
                          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ffffff', margin: '2px 0 3px' }}>
                            {pb.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.35 }}>
                            {pb.guidance}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actionable First Steps Strip with + Place Buttons */}
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(52, 211, 153, 0.07)',
                        border: '1px solid rgba(52, 211, 153, 0.28)',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#34d399', marginBottom: '6px' }}>
                        🧭 Recommended Placement Order on Whiteboard:
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: '8px',
                        }}
                      >
                        {scenarioRequirements.whatToDoFirst.map((item, idx) => {
                          const isTargetPlaced = placedNodes.some((n) => n.id === item.targetNodeId);
                          return (
                            <div
                              key={idx}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: `1px solid ${isTargetPlaced ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '6px',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                                    {item.step}
                                  </span>
                                  {isTargetPlaced && (
                                    <span style={{ fontSize: '0.66rem', color: '#34d399', fontWeight: 800 }}>✓ Placed</span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
                                  {item.title}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.4 }}>
                                  {item.instruction}
                                </div>
                              </div>

                              {!isTargetPlaced && idx < 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleAddNode(item.targetNodeId)}
                                  style={{
                                    alignSelf: 'flex-start',
                                    padding: '3px 8px',
                                    borderRadius: '5px',
                                    background: 'rgba(52, 211, 153, 0.16)',
                                    border: '1px solid rgba(52, 211, 153, 0.4)',
                                    color: '#34d399',
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                  }}
                                >
                                  + Place {item.targetNodeLabel}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 3. INFRASTRUCTURE COMPONENT PALETTE (RANDOMIZED ORDER — DRAG OR CLICK TO PLACE) ── */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.73rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.65)' }}>
                  🧰 Shuffled Infrastructure Component Palette (Drag onto Whiteboard or Click to Place):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    arcadeAudio.playBlip();
                    setPaletteShuffleSeed((s) => s + 1);
                  }}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '5px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    color: '#c084fc',
                    fontSize: '0.68rem',
                    fontWeight: 750,
                    cursor: 'pointer',
                  }}
                  title="Re-shuffle component order in palette"
                >
                  🔀 Shuffle
                </button>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.55)' }}>
                {placedNodes.length} deployed (Need {activeScenario.correctSequence.length} of {shuffledPaletteNodes.length} • ⚠️ {activeDistractors.length} unnecessary traps hidden in palette)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {shuffledPaletteNodes.map((node) => {
                const isAdded = placedNodes.some((n) => n.id === node.id);
                const isHovered = hoveredBankNodeId === node.id && !isAdded;
                const { unitCost } = getNodeUnitCost(node.id, node.name);

                return (
                  <button
                    key={node.id}
                    type="button"
                    draggable={!isAdded}
                    onDragStart={(e) => handlePaletteDragStart(e, node.id)}
                    className={`arcade-node-chip ${isHovered ? 'hovered' : ''} ${isAdded ? 'added' : ''}`}
                    disabled={isAdded}
                    onMouseEnter={() => setHoveredBankNodeId(node.id)}
                    onMouseLeave={() => setHoveredBankNodeId(null)}
                    onClick={() => {
                      setHoveredBankNodeId(null);
                      handleAddNode(node.id);
                    }}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: isAdded ? 'rgba(255, 255, 255, 0.02)' : isHovered ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                      border: isAdded ? '1px dashed rgba(255, 255, 255, 0.08)' : isHovered ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: isAdded ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
                      boxShadow: isHovered ? '0 4px 14px rgba(56, 189, 248, 0.3)' : 'none',
                      transform: isHovered ? 'translateY(-2px)' : 'none',
                      fontSize: '0.79rem',
                      fontWeight: 700,
                      cursor: isAdded ? 'default' : 'grab',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{node.icon}</span>
                    <span>{node.name}</span>
                    <span
                      style={{
                        fontSize: '0.67rem',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: isAdded ? 'transparent' : 'rgba(56, 189, 248, 0.14)',
                        color: isAdded ? 'rgba(52, 211, 153, 0.5)' : '#38bdf8',
                        fontWeight: 800,
                      }}
                    >
                      {isAdded ? '✓ On Board' : unitCost === 0 ? 'Free' : `$${unitCost}/mo`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 4. GONNACRASH 2D INTERACTIVE WHITEBOARD CANVAS (DRAG NODES & CONNECT WIRES) ── */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.55)' }}>
                Connected Architecture Pipeline ({selectedSequence.length}/{activeScenario.correctSequence.length} Components Wired):
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.72rem' }}>
                {wiringSourceId && (
                  <span style={{ color: '#fbbf24', fontWeight: 800 }}>
                    🔌 Wiring from &ldquo;{nodeMap.get(wiringSourceId)?.name}&rdquo; — Click target node&apos;s Left Input Port (or press Esc)
                  </span>
                )}
                {simulationState === 'simulating' && (
                  <span style={{ color: '#38bdf8', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block', animation: 'flowPacketGlow 0.8s infinite' }} />
                    Streaming Live Requests Across Wires...
                  </span>
                )}
                <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                  💡 Drag nodes to move • Click Output Port (right ●) → Input Port (left ●) to wire • Scale replicas (-/+)
                </span>
              </div>
            </div>

            <div
              ref={canvasRef}
              className="gonnacrash-blueprint-canvas"
              onDragOver={handleCanvasDragOver}
              onDragLeave={() => setIsDragOverCanvas(false)}
              onDrop={handleCanvasDrop}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onClick={(e) => {
                if (e.target === canvasRef.current && wiringSourceId) {
                  setWiringSourceId(null);
                  setMouseCanvasPos(null);
                }
              }}
              style={{
                minHeight: `${canvasHeight}px`,
                borderRadius: '14px',
                border:
                  simulationState === 'success'
                    ? '2px solid #34d399'
                    : simulationState === 'failed'
                    ? '2px solid #ef4444'
                    : isDragOverCanvas
                    ? '2px dashed #38bdf8'
                    : simulationState === 'simulating'
                    ? '2px dashed #38bdf8'
                    : '1.5px solid rgba(56, 189, 248, 0.25)',
                animation: simulationState === 'success' ? 'pulseSuccess 2s infinite' : simulationState === 'failed' ? 'pulseError 2s infinite' : 'none',
                position: 'relative',
                overflowX: 'auto',
                overflowY: 'hidden',
                transition: 'border-color 0.2s ease',
              }}
            >
              {/* Empty Whiteboard Prompt */}
              {placedNodes.length === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255, 255, 255, 0.45)',
                    padding: '24px',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📐</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
                    Interactive System Design Whiteboard
                  </div>
                  <div style={{ fontSize: '0.78rem', maxWidth: '520px', lineHeight: 1.5 }}>
                    Drag & drop infrastructure blocks from the palette above onto this canvas (or click them to auto-place). Wire Output ports to Input ports, scale replicas within budget, and hit <strong>Simulate Traffic</strong>!
                  </div>
                </div>
              )}

              {/* SVG Wire & Animated Traffic Layer */}
              <svg
                width="920"
                height={canvasHeight}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                <defs>
                  <marker id="wire-arrow-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="wire-arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                  </marker>
                  <marker id="wire-arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                  </marker>
                </defs>

                {wires.map((wire) => {
                  const fromNode = placedNodes.find((n) => n.id === wire.from);
                  const toNode = placedNodes.find((n) => n.id === wire.to);
                  if (!fromNode || !toNode) return null;

                  const start = getOutputPortCoords(fromNode);
                  const end = getInputPortCoords(toNode);
                  const d = buildWireBezierPath(start.x, start.y, end.x, end.y);
                  const midX = (start.x + end.x) / 2;
                  const midY = (start.y + end.y) / 2;

                  const isWireToCrashed =
                    simulationState === 'failed' && activeSimulationMetrics?.bottleneckNodeId === wire.to;
                  const isHoveredWire = hoveredWireId === wire.id;

                  const wireColor = isWireToCrashed
                    ? '#ef4444'
                    : simulationState === 'success'
                    ? '#34d399'
                    : '#38bdf8';
                  const markerId = isWireToCrashed
                    ? 'url(#wire-arrow-red)'
                    : simulationState === 'success'
                    ? 'url(#wire-arrow-green)'
                    : 'url(#wire-arrow-cyan)';

                  return (
                    <g key={wire.id}>
                      {/* Base Wire Conduit */}
                      <path
                        d={d}
                        fill="none"
                        stroke={wireColor}
                        strokeWidth={isHoveredWire ? 3.5 : 2.2}
                        strokeOpacity={0.35}
                        markerEnd={markerId}
                      />
                      {/* Animated Flowing Dashed Overlay */}
                      <path
                        d={d}
                        fill="none"
                        stroke={wireColor}
                        strokeWidth={2.2}
                        strokeDasharray="6 8"
                        style={{
                          animation:
                            simulationState === 'simulating'
                              ? 'wireDashFlow 0.45s linear infinite'
                              : 'wireDashFlow 1.2s linear infinite',
                        }}
                        markerEnd={markerId}
                      />

                      {/* Animated Request Dots during simulation / success */}
                      {(simulationState === 'simulating' || simulationState === 'success') && (
                        <>
                          <circle r="4.5" fill={simulationState === 'success' ? '#34d399' : '#38bdf8'}>
                            <animateMotion dur={simulationState === 'simulating' ? '0.65s' : '1.3s'} repeatCount="indefinite" path={d} />
                          </circle>
                          <circle r="3.5" fill="#ffffff">
                            <animateMotion dur={simulationState === 'simulating' ? '0.65s' : '1.3s'} begin="0.32s" repeatCount="indefinite" path={d} />
                          </circle>
                        </>
                      )}

                      {/* Clickable Wire Delete Pill at Midpoint */}
                      <g
                        style={{ pointerEvents: 'all', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredWireId(wire.id)}
                        onMouseLeave={() => setHoveredWireId(null)}
                        onClick={() => handleRemoveWire(wire.id)}
                      >
                        <circle
                          cx={midX}
                          cy={midY}
                          r={isHoveredWire ? 10 : 7}
                          fill={isHoveredWire ? '#ef4444' : '#0f172a'}
                          stroke={wireColor}
                          strokeWidth="1.5"
                        />
                        <text
                          x={midX}
                          y={midY + 3.5}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="900"
                        >
                          ✕
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Active Interactive Wire Preview when connecting from Output Port */}
                {wiringSourceId && mouseCanvasPos && (() => {
                  const srcNode = placedNodes.find((n) => n.id === wiringSourceId);
                  if (!srcNode) return null;
                  const start = getOutputPortCoords(srcNode);
                  const d = buildWireBezierPath(start.x, start.y, mouseCanvasPos.x, mouseCanvasPos.y);
                  return (
                    <path
                      d={d}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.5"
                      strokeDasharray="5 5"
                    />
                  );
                })()}
              </svg>

              {/* Placed Infrastructure Node Cards on 2D Canvas */}
              <div style={{ position: 'relative', width: '920px', height: `${canvasHeight}px`, zIndex: 2 }}>
                {placedNodes.map((placed, idx) => {
                  const node = nodeMap.get(placed.id);
                  const { unitCost, isClient, tierLabel } = getNodeUnitCost(placed.id, node?.name || placed.id);
                  const seqIdx = selectedSequence.indexOf(placed.id);
                  const isDisconnected = disconnectedIds.includes(placed.id);
                  const isHovered = hoveredSeqNodeId === placed.id;
                  const isCrashed =
                    simulationState === 'failed' &&
                    (activeSimulationMetrics?.bottleneckNodeId === placed.id ||
                      activeSimulationMetrics?.bottleneckNode === (node?.name || placed.id));
                  const isWiringSource = wiringSourceId === placed.id;

                  return (
                    <div
                      key={placed.id}
                      className="gonnacrash-node-card"
                      onMouseDown={(e) => handleNodeMouseDown(e, placed)}
                      onMouseEnter={() => setHoveredSeqNodeId(placed.id)}
                      onMouseLeave={() => setHoveredSeqNodeId(null)}
                      style={{
                        position: 'absolute',
                        left: `${placed.x}px`,
                        top: `${placed.y}px`,
                        width: `${NODE_WIDTH}px`,
                        height: `${NODE_HEIGHT}px`,
                        borderRadius: '12px',
                        padding: '8px 10px',
                        border: isCrashed
                          ? '2.5px solid #ef4444'
                          : isWiringSource
                          ? '2px dashed #fbbf24'
                          : isDisconnected
                          ? '1.5px dashed #fbbf24'
                          : simulationState === 'success'
                          ? '2px solid #34d399'
                          : isHovered
                          ? '1.5px solid #38bdf8'
                          : '1.5px solid rgba(56, 189, 248, 0.38)',
                        boxShadow: isCrashed
                          ? '0 0 24px rgba(239, 68, 68, 0.5)'
                          : isHovered
                          ? '0 8px 20px rgba(56, 189, 248, 0.28)'
                          : '0 4px 12px rgba(0, 0, 0, 0.45)',
                        cursor: draggingCanvasNodeId === placed.id ? 'grabbing' : 'grab',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: draggingCanvasNodeId === placed.id ? 'none' : 'border-color 0.15s, box-shadow 0.15s',
                      }}
                    >
                      {/* ── LEFT INPUT PORT (Click to complete wire connection) ── */}
                      <button
                        type="button"
                        className="gonnacrash-port-btn"
                        title="Input Port: Click to connect incoming wire here"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (wiringSourceId && wiringSourceId !== placed.id) {
                            handleConnectWire(wiringSourceId, placed.id);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          left: '-9px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: wiringSourceId && wiringSourceId !== placed.id ? '#fbbf24' : '#0f172a',
                          border: `2.5px solid ${wires.some((w) => w.to === placed.id) ? '#34d399' : '#38bdf8'}`,
                          cursor: 'crosshair',
                          padding: 0,
                          zIndex: 4,
                        }}
                      />

                      {/* ── RIGHT OUTPUT PORT (Click to start drawing wire) ── */}
                      <button
                        type="button"
                        className="gonnacrash-port-btn"
                        title="Output Port: Click to draw wire to next component"
                        onClick={(e) => {
                          e.stopPropagation();
                          arcadeAudio.playBlip();
                          if (wiringSourceId === placed.id) {
                            setWiringSourceId(null);
                            setMouseCanvasPos(null);
                          } else {
                            setWiringSourceId(placed.id);
                            setMouseCanvasPos(getOutputPortCoords(placed));
                          }
                        }}
                        style={{
                          position: 'absolute',
                          right: '-9px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: isWiringSource ? '#fbbf24' : '#0f172a',
                          border: `2.5px solid ${wires.some((w) => w.from === placed.id) ? '#34d399' : '#38bdf8'}`,
                          cursor: 'crosshair',
                          padding: 0,
                          zIndex: 4,
                        }}
                      />

                      {/* Top Row: Step Order Badge + Reorder & Delete Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isDisconnected ? 'rgba(251, 191, 36, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            color: isDisconnected ? '#fbbf24' : '#38bdf8',
                          }}
                        >
                          {seqIdx !== -1 ? `Stage #${seqIdx + 1}` : '⚠️ Unwired'}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {idx > 0 && (
                            <button
                              type="button"
                              className="gonnacrash-replica-btn"
                              onClick={() => handleMoveNode(idx, 'left')}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.65rem', padding: '0 2px' }}
                              title="Move earlier in pipeline"
                            >
                              ◀
                            </button>
                          )}
                          {idx < placedNodes.length - 1 && (
                            <button
                              type="button"
                              className="gonnacrash-replica-btn"
                              onClick={() => handleMoveNode(idx, 'right')}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.65rem', padding: '0 2px' }}
                              title="Move later in pipeline"
                            >
                              ▶
                            </button>
                          )}
                          <button
                            type="button"
                            className="gonnacrash-replica-btn"
                            onClick={() => handleRemoveNode(placed.id)}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 900, padding: '0 2px' }}
                            title="Remove component"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: Component Icon & Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0' }}>
                        <span style={{ fontSize: '1.15rem' }}>{node?.icon || '⚙️'}</span>
                        <div style={{ overflow: 'hidden' }}>
                          <div
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={node?.name || placed.id}
                          >
                            {node?.name || placed.id}
                          </div>
                          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                            {tierLabel}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: GonnaCrash Replica Scaling (- 1x +) & Monthly Cost */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '4px' }}>
                        {isClient ? (
                          <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 700 }}>Ingress Source</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="gonnacrash-replica-btn"
                              onClick={() => handleScaleNode(placed.id, -1)}
                              disabled={placed.replicas <= 1}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#ffffff',
                                fontSize: '0.7rem',
                                fontWeight: 900,
                                cursor: placed.replicas <= 1 ? 'not-allowed' : 'pointer',
                                lineHeight: 1,
                                padding: 0,
                              }}
                              title="Scale down replicas"
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: placed.replicas > 1 ? '#38bdf8' : '#e2e8f0', minWidth: '20px', textAlign: 'center' }}>
                              {placed.replicas}x
                            </span>
                            <button
                              type="button"
                              className="gonnacrash-replica-btn"
                              onClick={() => handleScaleNode(placed.id, 1)}
                              disabled={placed.replicas >= 8}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '4px',
                                background: 'rgba(56, 189, 248, 0.18)',
                                border: '1px solid rgba(56, 189, 248, 0.4)',
                                color: '#38bdf8',
                                fontSize: '0.7rem',
                                fontWeight: 900,
                                cursor: placed.replicas >= 8 ? 'not-allowed' : 'pointer',
                                lineHeight: 1,
                                padding: 0,
                              }}
                              title="Scale up replicas (+Capacity, +Cost)"
                            >
                              +
                            </button>
                          </div>
                        )}

                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#c084fc' }}>
                          {unitCost === 0 ? '$0/mo' : `$${unitCost * placed.replicas}/mo`}
                        </span>
                      </div>

                      {/* 💥 GONNACRASH "CRASHED" RUBBER STAMP OVERLAY */}
                      {isCrashed && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) rotate(-14deg)',
                            background: 'rgba(220, 38, 38, 0.95)',
                            border: '2.5px solid #fecaca',
                            color: '#ffffff',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 900,
                            letterSpacing: '0.08em',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.8)',
                            animation: 'crashStampSlam 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            zIndex: 10,
                            pointerEvents: 'none',
                          }}
                        >
                          💥 CRASHED
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 5. Simulation Execution, Solution Guide & Next Scenario ── */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={simulationState === 'simulating' || placedNodes.length === 0}
              onClick={handleTestArchitecture}
              style={{
                flex: '1 1 260px',
                padding: '12px',
                borderRadius: '10px',
                background:
                  simulationState === 'simulating'
                    ? 'rgba(56, 189, 248, 0.4)'
                    : placedNodes.length === 0
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
                border: 'none',
                color: placedNodes.length === 0 ? 'rgba(255, 255, 255, 0.4)' : '#ffffff',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: simulationState === 'simulating' ? 'wait' : placedNodes.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: placedNodes.length > 0 ? '0 4px 16px rgba(56, 189, 248, 0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {simulationState === 'simulating'
                ? '⏳ Running Traffic Simulation...'
                : placedNodes.length === 0
                ? 'Drop & Wire Components Above to Simulate'
                : '🚀 Simulate Traffic & Load Test'}
            </button>

            <button
              type="button"
              onClick={() => {
                arcadeAudio.playBlip();
                setShowSolutionGuide((prev) => !prev);
                setShowTakeaways(true);
              }}
              style={{
                padding: '12px 18px',
                borderRadius: '10px',
                background: showSolutionGuide ? 'rgba(251, 191, 36, 0.22)' : 'rgba(251, 191, 36, 0.1)',
                border: '1.5px solid rgba(251, 191, 36, 0.45)',
                color: '#fbbf24',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {showSolutionGuide ? '📖 Hide Solution & Flow Rationale' : '📖 Why This Flow? (Solution Guide)'}
            </button>

            {simulationState === 'success' && (
              <button
                type="button"
                onClick={handleNextScenario}
                style={{
                  padding: '12px 22px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                Next Puzzle ➔
              </button>
            )}
          </div>

          {/* ── 6. Feedback & Incident Post-Mortem Diagnostics ── */}
          {feedbackMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background:
                  simulationState === 'success'
                    ? 'rgba(52, 211, 153, 0.15)'
                    : simulationState === 'simulating'
                    ? 'rgba(56, 189, 248, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${
                  simulationState === 'success'
                    ? '#34d399'
                    : simulationState === 'simulating'
                    ? '#38bdf8'
                    : '#ef4444'
                }`,
                color:
                  simulationState === 'success'
                    ? '#34d399'
                    : simulationState === 'simulating'
                    ? '#38bdf8'
                    : '#fca5a5',
                fontSize: '0.84rem',
                lineHeight: 1.45,
                marginBottom: '16px',
              }}
            >
              {feedbackMessage}
            </div>
          )}

          {/* ── 7. Live System SLA Telemetry & GonnaCrash Star Scorecard ── */}
          {activeSimulationMetrics && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                gap: '10px',
              }}
            >
              {/* Gauge 1: Answered Requests % */}
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Answered Requests</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: activeSimulationMetrics.answeredPercent >= 99.9 ? '#34d399' : '#f87171' }}>
                  {activeSimulationMetrics.answeredPercent}%
                </div>
                <div style={{ fontSize: '0.68rem', color: activeSimulationMetrics.answeredPercent >= 99.9 ? '#34d399' : '#f87171' }}>
                  {activeSimulationMetrics.answeredPercent >= 99.9 ? '⭐ Goal >= 99.9% Met' : '💥 Requests Dropped'}
                </div>
              </div>

              {/* Gauge 2: p99 Latency */}
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', fontWeight: 800 }}>p99 Latency</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: activeSimulationMetrics.p99LatencyMs < 20 ? '#34d399' : '#f87171' }}>
                  {activeSimulationMetrics.p99LatencyMs} ms
                </div>
                <div style={{ fontSize: '0.68rem', color: activeSimulationMetrics.p99LatencyMs < 20 ? '#34d399' : '#f87171' }}>
                  {activeSimulationMetrics.p99LatencyMs < 20 ? '⭐ Ultra Low SLA' : '🚨 Severe Latency Spill'}
                </div>
              </div>

              {/* Gauge 3: Throughput */}
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Capacity Throughput</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#38bdf8' }}>
                  {activeSimulationMetrics.throughputQps}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Sustained ingress load
                </div>
              </div>

              {/* Gauge 4: Cloud Cost vs Budget */}
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Monthly Spend</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: activeSimulationMetrics.monthlyCost <= activeSimulationMetrics.targetBudget ? '#c084fc' : '#fbbf24' }}>
                  ${activeSimulationMetrics.monthlyCost.toLocaleString()}/mo
                </div>
                <div style={{ fontSize: '0.68rem', color: activeSimulationMetrics.monthlyCost <= activeSimulationMetrics.targetBudget ? '#34d399' : '#fbbf24' }}>
                  {activeSimulationMetrics.monthlyCost <= activeSimulationMetrics.targetBudget
                    ? `⭐ Under $${activeSimulationMetrics.targetBudget} Cap`
                    : `⚠️ Over $${activeSimulationMetrics.targetBudget} Cap`}
                </div>
              </div>

              {/* Gauge 5: Star Rating */}
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Architect Rating</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24' }}>
                  {'⭐'.repeat(activeSimulationMetrics.starsEarned)}{'☆'.repeat(3 - activeSimulationMetrics.starsEarned)}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {activeSimulationMetrics.starsEarned === 3 ? 'Perfect FinOps Design' : activeSimulationMetrics.starsEarned === 2 ? 'Online (Over Budget)' : 'Crashed'}
                </div>
              </div>
            </div>
          )}

          {/* ── 8. Comprehensive Solution & Why We Follow This Flow / Infrastructure ── */}
          {(simulationState === 'success' || simulationState === 'failed' || showSolutionGuide) && (
            <div
              style={{
                marginBottom: '16px',
                padding: '16px 20px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(9, 13, 22, 0.98) 100%)',
                border: `1.5px solid ${
                  simulationState === 'success' ? 'rgba(52, 211, 153, 0.45)' : 'rgba(251, 191, 36, 0.45)'
                }`,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              }}
            >
              {/* Header Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div
                  onClick={() => setShowTakeaways(!showTakeaways)}
                  style={{
                    cursor: 'pointer',
                    color: '#fbbf24',
                    fontWeight: 800,
                    fontSize: '0.94rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>🎓 Architectural Solution & Why We Follow This Infrastructure Flow ({activeScenario.title})</span>
                  <span style={{ fontSize: '0.76rem', color: '#38bdf8' }}>{showTakeaways ? '▲ Collapse' : '▼ Expand'}</span>
                </div>

                <button
                  type="button"
                  onClick={handleApplyOptimalSolution}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(52, 211, 153, 0.16)',
                    border: '1px solid rgba(52, 211, 153, 0.45)',
                    color: '#34d399',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Auto-Build Optimal Flow on Whiteboard
                </button>
              </div>

              {showTakeaways && (
                <div style={{ marginTop: '14px', fontSize: '0.82rem', color: '#f8fafc', lineHeight: 1.55 }}>
                  {/* 8A. Optimal Flow Sequence Ribbon */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', marginBottom: '8px' }}>
                      🔗 Optimal End-to-End Infrastructure Pipeline ({stageFlowSteps.length} Stages):
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {stageFlowSteps.map((step, idx) => {
                        const isMatchedAtStage = selectedSequence[idx] === step.id;
                        return (
                          <React.Fragment key={step.id}>
                            <div
                              style={{
                                padding: '5px 10px',
                                borderRadius: '8px',
                                background: isMatchedAtStage ? 'rgba(52, 211, 153, 0.14)' : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${isMatchedAtStage ? '#34d399' : 'rgba(255, 255, 255, 0.15)'}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 750,
                              }}
                            >
                              <span style={{ color: isMatchedAtStage ? '#34d399' : '#fbbf24', fontWeight: 900 }}>
                                #{step.stageNumber}
                              </span>
                              <span>{step.icon}</span>
                              <span style={{ color: '#ffffff' }}>{step.name}</span>
                              {isMatchedAtStage && <span style={{ color: '#34d399', fontSize: '0.7rem' }}>✓</span>}
                            </div>
                            {idx < stageFlowSteps.length - 1 && (
                              <span style={{ color: '#38bdf8', fontWeight: 900, fontSize: '0.85rem' }}>➔</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* 8B. Executive End-to-End Architecture Summary */}
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', marginBottom: '4px' }}>
                      🧭 Why This Overall Architecture Flow Works
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{activeScenario.explanation}</div>
                  </div>

                  {/* 8C. Stage-by-Stage Infrastructure Rationale Cards */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#c084fc', marginBottom: '8px' }}>
                      🏗️ Stage-by-Stage Infrastructure Rationale (Why Each Layer Sits Here & Failure Modes):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                      {stageFlowSteps.map((step, idx) => {
                        const isMatchedAtStage = selectedSequence[idx] === step.id;
                        return (
                          <div
                            key={step.id}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: `1px solid ${isMatchedAtStage ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#ffffff', fontSize: '0.8rem' }}>
                                <span
                                  style={{
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: isMatchedAtStage ? 'rgba(52, 211, 153, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                                    color: isMatchedAtStage ? '#34d399' : '#38bdf8',
                                    fontSize: '0.68rem',
                                  }}
                                >
                                  Stage #{step.stageNumber}
                                </span>
                                <span>{step.icon}</span>
                                <span>{step.name}</span>
                              </div>
                              <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.16)', color: '#c084fc', fontWeight: 700 }}>
                                {step.tierLabel}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
                              🎯 Role: {step.role}
                            </div>

                            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.45 }}>
                              <strong style={{ color: '#34d399' }}>Why Here in Flow:</strong> {step.whyThisPosition}
                            </div>

                            <div style={{ fontSize: '0.73rem', color: 'rgba(252, 165, 165, 0.9)', lineHeight: 1.4 }}>
                              <strong style={{ color: '#f87171' }}>If Misplaced/Skipped:</strong> {step.failureIfMisplaced}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 8D. Unnecessary Distractor Components Breakdown */}
                  {activeDistractors.length > 0 && (
                    <div
                      style={{
                        marginBottom: '16px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#f87171', marginBottom: '8px' }}>
                        🚫 Why These {activeDistractors.length} Palette Components Are Unnecessary (Anti-Pattern Traps to Avoid)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                        {activeDistractors.map((trap) => {
                          const isWronglyPlaced = placedNodes.some((n) => n.id === trap.id);
                          return (
                            <div
                              key={trap.id}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '8px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: `1px solid ${isWronglyPlaced ? '#ef4444' : 'rgba(239, 68, 68, 0.25)'}`,
                                fontSize: '0.74rem',
                                lineHeight: 1.4,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                <span style={{ fontWeight: 800, color: '#fca5a5' }}>
                                  {trap.icon} {trap.name}
                                </span>
                                {isWronglyPlaced && (
                                  <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800 }}>⚠️ On Board!</span>
                                )}
                              </div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.78)', fontSize: '0.72rem' }}>
                                {trap.whyUnnecessary}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 8E. Principal Architect Key Design Takeaways */}
                  {activeScenario.keyDesignTakeaways && activeScenario.keyDesignTakeaways.length > 0 && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(251, 191, 36, 0.08)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#fbbf24', marginBottom: '6px' }}>
                        ⚡ Principal Engineer Design Trade-Offs & Production Invariants
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: 'rgba(255, 255, 255, 0.85)' }}>
                        {activeScenario.keyDesignTakeaways.map((takeaway, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{takeaway}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
