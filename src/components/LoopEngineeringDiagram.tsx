import React, { useState } from 'react';

type LoopLevel = {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  color: string;
  scope: string;
  termination: string;
  devRole: string;
  failureMode: string;
  frameworkExample: string;
  description: string;
};

const LOOPS: LoopLevel[] = [
  {
    id: 'execution',
    number: '1',
    name: 'Execution Loop',
    subtitle: 'Action-Observation Cycle (Inner Loop)',
    color: '#38bdf8',
    scope: 'Steps within a single discrete subtask (tool calls, file edits, command execution).',
    termination: 'Environment feedback (unit test pass, HTTP 200, linter clear) or agent self-declares completion.',
    devRole: 'Supplying low-level tool definitions, execution sandboxes, and JSON schemas.',
    failureMode: 'Premature victory hallucination: Agent asserts "I am done!" while code syntax is broken or tests fail.',
    frameworkExample: 'Spring AI ToolCallingChatClient, LangChain4j Agentic Executor, Claude Code command runner.',
    description: 'The fundamental heartbeat of an agent. The model issues a tool call, the execution harness captures stdout/stderr, and returns the observation back to the model until it halts.'
  },
  {
    id: 'task',
    number: '2',
    name: 'Task Loop (Ralph Loop)',
    subtitle: 'Fresh Context Window Iteration',
    color: '#34d399',
    scope: 'A single complete artifact (e.g., a Spring Boot service class, refactored module, migration script).',
    termination: 'All unit/integration tests pass green (100% test-driven assertion against the spec).',
    devRole: 'Writing rigorous test specifications, constraints, and golden evaluation criteria.',
    failureMode: 'Context Rot: In monolithic chats, context degrades over turns. Ralph Loop wipes memory and retries fresh.',
    frameworkExample: 'Ralph Loop scripts (Geoffrey Huntley), test-driven harness re-instantiation, clean git worktrees.',
    description: 'Named after Ralph Wiggum by Geoffrey Huntley. Rather than letting an agent wander into context rot across 30 turns, the Ralph Loop kills the agent and re-spawns a pristine context window against the unchanged spec until tests pass.'
  },
  {
    id: 'product',
    number: '3',
    name: 'Product Loop',
    subtitle: 'Autonomous Software Factory (SDLC)',
    color: '#fbbf24',
    scope: 'The entire project codebase, backlog, GitHub issues, and PR pipeline.',
    termination: 'Sprint completion, release criteria, roadmap milestone, or external business metrics.',
    devRole: 'Defining architecture guardrails, reviewing PR diffs, and orchestrating deployment policies.',
    failureMode: 'Architectural drift: Agent ships micro-features that violate system cohesion or create circular dependencies.',
    frameworkExample: 'Autonomous triage bots, GitHub issue-to-PR agents, automated dependency migrators.',
    description: 'The Software Factory loop. It triages GitHub issues, writes design plans, implements code, triggers CI/CD, inspects build logs, and submits pull requests autonomously.'
  },
  {
    id: 'system',
    number: '4',
    name: 'System Loop',
    subtitle: 'AutoResearch / Meta-Loop',
    color: '#a78bfa',
    scope: 'The AI system itself: System Prompts, Agent Harnesses, Model Routing, and Evals.',
    termination: 'Benchmarked accuracy plateau, eval metric target reached, or cost budget ceiling.',
    devRole: 'Curating evals datasets, designing meta-prompts, and approving harness mutations.',
    failureMode: 'Goodhart\'s Law: Agent overfits to pass the eval suite while failing real-world software engineering edge cases.',
    frameworkExample: 'Andrej Karpathy\'s AutoResearch, Promptfoo automated prompt optimization, GEval self-tuning.',
    description: 'A meta-loop that iterates not on application code, but on the AI harness itself. It tunes prompt wording, adjusts model selection thresholds, and benchmarks against evaluation suites to self-improve.'
  },
  {
    id: 'oversight',
    number: '+1',
    name: 'Oversight Loop',
    subtitle: 'Human Governance & Strategic Steering',
    color: '#f87171',
    scope: 'Enterprise business objectives, infrastructure & token budget, regulatory compliance.',
    termination: 'NEVER TERMINATES (Standing human governance cycle).',
    devRole: 'Strategic decision maker, token budget allocator, and ultimate task culler.',
    failureMode: 'Rubber-stamping: Humans blindly approving agent plans without auditing security and architecture.',
    frameworkExample: 'Human-in-the-loop audit gates, OpenTelemetry spending alarms, kill-switch orchestrators.',
    description: 'The top-level un-terminated loop identified by Laurie Voss. Here humans sit not to write code, but to steer intent, allocate token budgets, approve high-risk changes, and cull runaway loops.'
  }
];

export default function LoopEngineeringDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'architecture' | 'ralph' | 'ladder'>('architecture');
  const [selectedLoopId, setSelectedLoopId] = useState<string>('execution');
  const [activeRalphTurn, setActiveRalphTurn] = useState<'traditional' | 'ralph'>('ralph');

  const currentLoop = LOOPS.find((l) => l.id === selectedLoopId) || LOOPS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Loop Engineering: The 4+1 Architectural Layers
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('architecture')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeTab === 'architecture' ? '#34d399' : 'rgba(255,255,255,0.1)',
              background: activeTab === 'architecture' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
              color: activeTab === 'architecture' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              cursor: 'pointer'
            }}
          >
            4+1 Loop Stack
          </button>
          <button
            onClick={() => setActiveTab('ralph')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeTab === 'ralph' ? '#38bdf8' : 'rgba(255,255,255,0.1)',
              background: activeTab === 'ralph' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'ralph' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              cursor: 'pointer'
            }}
          >
            Ralph Loop vs Rot
          </button>
          <button
            onClick={() => setActiveTab('ladder')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeTab === 'ladder' ? '#a78bfa' : 'rgba(255,255,255,0.1)',
              background: activeTab === 'ladder' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
              color: activeTab === 'ladder' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
              cursor: 'pointer'
            }}
          >
            Abstraction Ladder
          </button>
        </div>
      </div>

      <style>{`
        @keyframes loopSpinClockwise {
          0% { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        .flowing-loop-path {
          stroke-dasharray: 8 8;
          animation: loopSpinClockwise 2s linear infinite;
        }
        @media (max-width: 768px) {
          .loop-split-view {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Tab 1: 4+1 Loop Architecture Stack */}
      {activeTab === 'architecture' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick quote banner */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span style={{ color: 'var(--ifm-color-content)' }}>
              <em>&ldquo;That inner loop is capability. The outer loop is agency.&rdquo;</em> — <strong>Laurie Voss</strong>
            </span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>
              Based on Arize / Boris Cherny / swyx Loopcraft
            </span>
          </div>

          <div
            className="loop-split-view"
            style={{
              display: 'grid',
              gridTemplateColumns: '52% 48%',
              gap: '16px',
              alignItems: 'start'
            }}
          >
            {/* Left: Concentric Loop SVG Visualization */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '12px' }}>
              <svg viewBox="0 0 460 420" className="interactive-diagram-svg">
                <defs>
                  <marker id="loop-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="context-stroke" />
                  </marker>
                </defs>

                {/* Concentric Nested Rings */}
                {/* Ring 5: Oversight Loop (Human) */}
                <rect
                  x="15" y="15" width="430" height="390" rx="18"
                  fill={selectedLoopId === 'oversight' ? 'rgba(248, 113, 113, 0.12)' : '#0e1122'}
                  stroke="#f87171"
                  strokeWidth={selectedLoopId === 'oversight' ? 2.5 : 1}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedLoopId('oversight')}
                />
                <text x="30" y="40" fill="#f87171" fontSize="11" fontWeight="800">5. OVERSIGHT LOOP (Human Direction & Culling)</text>

                {/* Ring 4: System Loop (AutoResearch) */}
                <rect
                  x="45" y="55" width="370" height="330" rx="14"
                  fill={selectedLoopId === 'system' ? 'rgba(167, 139, 250, 0.14)' : '#11152c'}
                  stroke="#a78bfa"
                  strokeWidth={selectedLoopId === 'system' ? 2.5 : 1}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedLoopId('system')}
                />
                <text x="60" y="80" fill="#a78bfa" fontSize="11" fontWeight="800">4. SYSTEM LOOP (Evals, Harness & Prompts)</text>

                {/* Ring 3: Product Loop (Software Factory) */}
                <rect
                  x="75" y="95" width="310" height="270" rx="12"
                  fill={selectedLoopId === 'product' ? 'rgba(251, 191, 36, 0.14)' : '#141a36'}
                  stroke="#fbbf24"
                  strokeWidth={selectedLoopId === 'product' ? 2.5 : 1}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedLoopId('product')}
                />
                <text x="90" y="120" fill="#fbbf24" fontSize="11" fontWeight="800">3. PRODUCT LOOP (Backlog & SDLC)</text>

                {/* Ring 2: Task Loop (Ralph Loop) */}
                <rect
                  x="105" y="135" width="250" height="210" rx="10"
                  fill={selectedLoopId === 'task' ? 'rgba(52, 211, 153, 0.16)' : '#162042'}
                  stroke="#34d399"
                  strokeWidth={selectedLoopId === 'task' ? 2.5 : 1}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedLoopId('task')}
                />
                <text x="120" y="160" fill="#34d399" fontSize="11" fontWeight="800">2. TASK LOOP (Ralph / Fresh Spec)</text>

                {/* Ring 1: Execution Loop (Action-Observation) */}
                <rect
                  x="135" y="175" width="190" height="150" rx="8"
                  fill={selectedLoopId === 'execution' ? 'rgba(56, 189, 248, 0.22)' : '#1a2750'}
                  stroke="#38bdf8"
                  strokeWidth={selectedLoopId === 'execution' ? 2.5 : 1.5}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedLoopId('execution')}
                />
                <text x="145" y="200" fill="#38bdf8" fontSize="11" fontWeight="800">1. EXECUTION LOOP</text>
                <text x="145" y="218" fill="var(--ifm-color-content-secondary)" fontSize="10">Action ➔ Observation</text>

                {/* Flowing animated conduits inside Execution Loop */}
                <path
                  d="M 155 240 L 295 240 L 295 295 L 155 295 Z"
                  fill="none"
                  stroke={currentLoop.color}
                  strokeWidth="2"
                  className="flowing-loop-path"
                />
                <circle cx="225" cy="240" r="3" fill={currentLoop.color} />
                <circle cx="295" cy="267" r="3" fill={currentLoop.color} />
                <circle cx="225" cy="295" r="3" fill={currentLoop.color} />
                <circle cx="155" cy="267" r="3" fill={currentLoop.color} />

                <text x="175" y="272" fill={currentLoop.color} fontSize="11" fontWeight="700">
                  {selectedLoopId.toUpperCase()}
                </text>
              </svg>
              <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                Click any concentric layer to inspect its architectural contract
              </div>
            </div>

            {/* Right: Inspector Details Panel */}
            <div style={{ background: '#0d0f1e', border: `1.5px solid ${currentLoop.color}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  background: `${currentLoop.color}25`,
                  color: currentLoop.color,
                  fontWeight: 800,
                  fontSize: '12px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${currentLoop.color}`
                }}>
                  Tier {currentLoop.number}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
                  {currentLoop.name}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: currentLoop.color, fontWeight: 600, marginBottom: '14px' }}>
                {currentLoop.subtitle}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div style={{ background: '#13162b', padding: '10px', borderRadius: '6px', border: '1px solid #1e2342' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>Scope: </span>
                  <span style={{ color: 'var(--ifm-color-content)' }}>{currentLoop.scope}</span>
                </div>

                <div style={{ background: '#13162b', padding: '10px', borderRadius: '6px', border: '1px solid #1e2342' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>Termination Condition: </span>
                  <span style={{ color: 'var(--ifm-color-content)' }}>{currentLoop.termination}</span>
                </div>

                <div style={{ background: '#13162b', padding: '10px', borderRadius: '6px', border: '1px solid #1e2342' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>Engineer&apos;s New Role: </span>
                  <span style={{ color: 'var(--ifm-color-content)' }}>{currentLoop.devRole}</span>
                </div>

                <div style={{ background: '#13162b', padding: '10px', borderRadius: '6px', border: '1px solid #1e2342' }}>
                  <span style={{ color: '#f87171', fontWeight: 700 }}>Failure Mode & Trap: </span>
                  <span style={{ color: 'var(--ifm-color-content)' }}>{currentLoop.failureMode}</span>
                </div>

                <div style={{ background: '#13162b', padding: '10px', borderRadius: '6px', border: '1px solid #1e2342' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 700 }}>Framework / Real Example: </span>
                  <code style={{ fontSize: '11px', color: '#a78bfa' }}>{currentLoop.frameworkExample}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Ralph Loop vs Context Rot */}
      {activeTab === 'ralph' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setActiveRalphTurn('ralph')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: `1.5px solid ${activeRalphTurn === 'ralph' ? '#34d399' : '#1e2342'}`,
                background: activeRalphTurn === 'ralph' ? 'rgba(52, 211, 153, 0.12)' : '#0d0f1e',
                color: activeRalphTurn === 'ralph' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              🔄 The Ralph Loop: Clean Context + Unyielding Spec (Geoffrey Huntley)
            </button>
            <button
              onClick={() => setActiveRalphTurn('traditional')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: `1.5px solid ${activeRalphTurn === 'traditional' ? '#f87171' : '#1e2342'}`,
                background: activeRalphTurn === 'traditional' ? 'rgba(248, 113, 113, 0.12)' : '#0d0f1e',
                color: activeRalphTurn === 'traditional' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              ⚠️ Traditional Chat: Monolithic Session ➔ Context Rot & Hallucination
            </button>
          </div>

          <div
            className="loop-split-view"
            style={{
              display: 'grid',
              gridTemplateColumns: '50% 50%',
              gap: '16px',
              alignItems: 'start'
            }}
          >
            {/* Flow Diagram */}
            <div style={{ background: '#0d0f1e', border: '1px solid #1e2342', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '12px' }}>
                {activeRalphTurn === 'ralph' ? 'The Ralph Loop Workflow' : 'Monolithic Session Decay'}
              </div>

              {activeRalphTurn === 'ralph' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: '#13162b', border: '1px solid #34d399', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>STEP 1: Immutable Test Spec</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>
                      Engineer writes <code>PaymentServiceTest.java</code> with 10 unit & boundary tests.
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', color: '#34d399', fontSize: '14px' }}>↓ Spawns Fresh Agent Window</div>
                  <div style={{ background: '#13162b', border: '1px solid #38bdf8', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>STEP 2: Execution Attempt (Attempt N)</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>
                      Agent generates code and runs <code>mvn test</code>. If 2 tests fail:
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', color: '#fbbf24', fontSize: '14px' }}>↓ Tests Failed: WIPE MEMORY & RETRY</div>
                  <div style={{ background: '#13162b', border: '1px solid #a78bfa', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#a78bfa' }}>STEP 3: Fresh Context Re-instantiation</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>
                      Do NOT carry 40 failed conversation turns forward. Start pristine agent with test diff feedback.
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', color: '#34d399', fontSize: '14px' }}>↓ 10/10 Tests Green</div>
                  <div style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1.5px solid #34d399', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>TERMINATION: Artifact Delivered ✅</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: '#13162b', border: '1px solid #38bdf8', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>Turn 1–5: High Attention Accuracy</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>Agent understands the prompt and produces clean boilerplate.</div>
                  </div>
                  <div style={{ textAlign: 'center', color: '#fbbf24', fontSize: '14px' }}>↓ Context expands to 120k tokens</div>
                  <div style={{ background: '#13162b', border: '1px solid #fbbf24', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>Turn 15–20: Context Rot Begins</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>Agent forgets constraints defined in Turn 1; fixes bug A but re-breaks bug B.</div>
                  </div>
                  <div style={{ textAlign: 'center', color: '#f87171', fontSize: '14px' }}>↓ Context Compaction loss</div>
                  <div style={{ background: 'rgba(248, 113, 113, 0.15)', border: '1.5px solid #f87171', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>Turn 30+: Hallucinated "All Done!" ❌</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>Agent falsely claims all tests pass. When you run maven, build crashes.</div>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Box */}
            <div style={{ background: '#0d0f1e', border: '1px solid #1e2342', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '12px' }}>
                Why the Ralph Loop is Transforming Engineering
              </div>

              <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--ifm-color-content)', margin: 0, marginBottom: '12px' }}>
                In traditional chat sessions, developers try to guide an increasingly confused model. As conversation history swells, the model suffers from <strong>attention dispersion</strong> and <strong>lost-in-the-middle phenomena</strong>.
              </p>

              <div style={{ background: '#13162b', padding: '12px', borderRadius: '8px', border: '1px solid #1e2342', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                  The 3 Pillars of a Production Ralph Loop:
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  <li><strong>Deterministic Test Oracle:</strong> Never let the agent judge if it is done. The test suite is the only judge.</li>
                  <li><strong>Stateless Context Reboots:</strong> If an attempt stalls or wanders, wipe the context. Do not accumulate failure tokens.</li>
                  <li><strong>Git Worktree Isolation:</strong> Each loop attempt runs on a dedicated git branch/worktree. Successful runs are squashed and merged.</li>
                </ul>
              </div>

              <div style={{ fontSize: '11px', color: '#fbbf24', lineHeight: '1.5' }}>
                💡 <em>&ldquo;You don&apos;t debug the conversation; you debug the specification and the loop harness.&rdquo;</em>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: The Abstraction Ladder */}
      {activeTab === 'ladder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#0d0f1e', border: '1px solid #1e2342', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#a78bfa', marginBottom: '6px' }}>
              The Historical Ladder of Software Abstractions
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '16px' }}>
              Laurie Voss notes: <em>&ldquo;Software engineering has always been about moving up the stack of abstraction so we can build larger systems.&rdquo;</em>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#13162b', border: '1px solid #1e2342', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>1960s – 1980s</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)', margin: '4px 0' }}>Memory & Pointers</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Developers manually managed bytes, malloc/free, and registers.</div>
              </div>

              <div style={{ background: '#13162b', border: '1px solid #1e2342', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8' }}>1990s – 2000s</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)', margin: '4px 0' }}>GC, OOP & Virtual Machines</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>JVM, garbage collection, and classes abstracted raw memory.</div>
              </div>

              <div style={{ background: '#13162b', border: '1px solid #1e2342', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399' }}>2010s – 2022</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)', margin: '4px 0' }}>Frameworks & Cloud APIs</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Spring Boot, Kubernetes, and REST APIs standardized business plumbing.</div>
              </div>

              <div style={{ background: '#13162b', border: '1px solid #fbbf24', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24' }}>2023 – 2024</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)', margin: '4px 0' }}>Prompts & Tool Calling</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Engineers learned prompt engineering, few-shot examples, and function calling.</div>
              </div>

              <div style={{ background: 'rgba(167, 139, 250, 0.15)', border: '1.5px solid #a78bfa', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa' }}>2025 – 2026+</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', margin: '4px 0' }}>Loop Engineering</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>Engineers design Specs, Evals, Harnesses, and autonomous concentric Loops.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
