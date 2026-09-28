import React, { useState } from 'react';

type ActiveTab = 'mcp_flow' | 'execution_layer' | 'three_layers' | 'decision_guide';
type LayerType = 'genai' | 'agentic' | 'agent';

export default function McpAndAgenticAiDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mcp_flow');
  const [selectedLayer, setSelectedLayer] = useState<LayerType>('agent');
  const [activeMcpStep, setActiveMcpStep] = useState<number>(1);
  const [execMode, setExecMode] = useState<'direct_api' | 'mcp_standard'>('mcp_standard');

  const mcpSteps = [
    {
      step: 1,
      title: '1. Discovery (`tools/list`)',
      desc: 'AI client connects to MCP Server over JSON-RPC. MCP Server advertises its available tools, schemas, and descriptions.',
      payload: '{\n  "jsonrpc": "2.0",\n  "method": "tools/list"\n}',
      color: '#38bdf8'
    },
    {
      step: 2,
      title: '2. LLM Reasoning & Selection',
      desc: 'User gives a prompt. The LLM inspects tool definitions and decides which tool and arguments to execute.',
      payload: 'User: "Refund order #812"\nLLM outputs: call stripe_refund(order_id="812")',
      color: '#34d399'
    },
    {
      step: 3,
      title: '3. Execution (`tools/call`)',
      desc: 'Client sends execution request to MCP Server. MCP Server translates this into actual underlying REST API / SQL queries.',
      payload: '{\n  "jsonrpc": "2.0",\n  "method": "tools/call",\n  "params": {\n    "name": "stripe_refund",\n    "arguments": { "order_id": "812" }\n  }\n}',
      color: '#fbbf24'
    },
    {
      step: 4,
      title: '4. Underlying API Call',
      desc: 'MCP Server calls `POST https://api.stripe.com/v1/refunds` with API keys and returns structured JSON back to LLM.',
      payload: 'HTTP 200 OK\n{\n  "status": "succeeded",\n  "refund_id": "re_3N9..."\n}',
      color: '#a78bfa'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Model Context Protocol (MCP) & Agentic AI Visualizer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'mcp_flow', label: '🔌 MCP vs API Workflow', color: '#38bdf8' },
            { id: 'execution_layer', label: '⚡ Execution Layer', color: '#a78bfa' },
            { id: 'three_layers', label: '🧠 3 AI Layers', color: '#34d399' },
            { id: 'decision_guide', label: '🎯 Do You Need MCP?', color: '#fbbf24' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as ActiveTab)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: MCP VS API WORKFLOW */}
        {activeTab === 'mcp_flow' && (
          <div>
            <div style={{
              padding: '12px 16px',
              background: 'rgba(56, 189, 248, 0.06)',
              borderLeft: '4px solid #38bdf8',
              borderRadius: '0 8px 8px 0',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                "Do We Still Need APIs After MCP?" ➔ YES! MCP Wraps APIs.
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                APIs are the machine-to-machine business interfaces (REST, SQL, gRPC). <strong>MCP is the standardized translation layer</strong> that allows an AI Agent to dynamically discover and invoke those APIs without developers writing custom point-to-point glue code.
              </div>
            </div>

            {/* SVG Visual Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="arrow-mcp-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                  </marker>
                  <marker id="arrow-mcp-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                </defs>

                {/* 1. AI Host / Client */}
                <g transform="translate(15, 25)">
                  <rect x="0" y="0" width="160" height="110" rx="8" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="15" y="28" fill="#38bdf8" fontSize="11" fontWeight="700">🤖 AI Host / Client</text>
                  <text x="15" y="48" fill="#e0f2fe" fontSize="10">Claude Desktop / IDE</text>
                  <text x="15" y="68" fill="#93c5fd" fontSize="9">• LLM Reasoning Core</text>
                  <text x="15" y="85" fill="#93c5fd" fontSize="9">• JSON-RPC Client</text>
                </g>

                {/* Flow 1: Client to MCP */}
                <path d="M 180 80 L 250 80" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-mcp-blue)" className="interactive-diagram-flowing-path" />
                <text x="185" y="70" fill="#38bdf8" fontSize="9" fontWeight="700">JSON-RPC</text>

                {/* 2. MCP Server */}
                <g transform="translate(255, 15)">
                  <rect x="0" y="0" width="260" height="130" rx="8" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="15" y="26" fill="#34d399" fontSize="12" fontWeight="700">🔌 MCP Server (Adapter Layer)</text>
                  <text x="15" y="46" fill="#e2e8f0" fontSize="10">• Exposes `tools/list` schema</text>
                  <text x="15" y="64" fill="#e2e8f0" fontSize="10">• Translates `tools/call` arguments</text>
                  <text x="15" y="82" fill="#e2e8f0" fontSize="10">• Exposes Resources & Prompts</text>
                  <text x="15" y="105" fill="#86efac" fontSize="9" fontWeight="700">Runs locally (stdio) or remote (SSE)</text>
                </g>

                {/* Flow 2: MCP to APIs */}
                <path d="M 520 80 L 590 80" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-mcp-green)" className="interactive-diagram-flowing-path" />
                <text x="525" y="70" fill="#34d399" fontSize="9" fontWeight="700">Native APIs</text>

                {/* 3. Underlying Services & APIs */}
                <g transform="translate(595, 20)">
                  <rect x="0" y="0" width="205" height="120" rx="8" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="12" y="25" fill="#fbbf24" fontSize="11" fontWeight="700">⚙️ Real-World Endpoints</text>
                  <text x="12" y="46" fill="#fef08a" fontSize="9">🌐 REST APIs (Stripe, GitHub)</text>
                  <text x="12" y="66" fill="#fef08a" fontSize="9">🗄️ Databases (Postgres, Redis)</text>
                  <text x="12" y="86" fill="#fef08a" fontSize="9">💻 Local Tools (Bash, Git, FS)</text>
                  <text x="12" y="106" fill="#e2e8f0" fontSize="9">Business Logic & Auth</text>
                </g>
              </svg>
            </div>

            {/* 4-Step Walkthrough */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {mcpSteps.map(s => (
                <button
                  key={s.step}
                  onClick={() => setActiveMcpStep(s.step)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${activeMcpStep === s.step ? s.color : 'rgba(255,255,255,0.08)'}`,
                    background: activeMcpStep === s.step ? `${s.color}15` : 'rgba(255,255,255,0.02)',
                    color: activeMcpStep === s.step ? s.color : 'var(--ifm-color-content-secondary)',
                    fontWeight: activeMcpStep === s.step ? 700 : 500,
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  {s.title.split(' ')[0]} {s.title.split(' ')[1]}
                </button>
              ))}
            </div>

            <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: mcpSteps[activeMcpStep - 1].color, marginBottom: '4px' }}>
                {mcpSteps[activeMcpStep - 1].title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginBottom: '8px', lineHeight: 1.5 }}>
                {mcpSteps[activeMcpStep - 1].desc}
              </div>
              <pre style={{ margin: 0, background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '4px', color: '#e2e8f0', fontSize: '11.5px', fontFamily: 'monospace' }}>
                <code>{mcpSteps[activeMcpStep - 1].payload}</code>
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: THE EXECUTION LAYER CONCEPT */}
        {activeTab === 'execution_layer' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setExecMode('mcp_standard')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${execMode === 'mcp_standard' ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
                  background: execMode === 'mcp_standard' ? '#a78bfa15' : 'rgba(255,255,255,0.02)',
                  color: execMode === 'mcp_standard' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
                  fontWeight: execMode === 'mcp_standard' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🔌 Standardized MCP Execution Layer
              </button>
              <button
                onClick={() => setExecMode('direct_api')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${execMode === 'direct_api' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                  background: execMode === 'direct_api' ? '#38bdf815' : 'rgba(255,255,255,0.02)',
                  color: execMode === 'direct_api' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                  fontWeight: execMode === 'direct_api' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🛠️ Custom Direct API Orchestration
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: execMode === 'mcp_standard' ? '#a78bfa' : '#38bdf8', marginBottom: '8px' }}>
                  {execMode === 'mcp_standard' ? 'How MCP Handles the Execution Layer' : 'How Direct API Integration Works'}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                  {execMode === 'mcp_standard' ? (
                    <>
                      1. <strong>LLM Outputs JSON:</strong> Returns tool call intent (e.g. <code>search_database</code>).<br/>
                      2. <strong>Client Dispatches via JSON-RPC:</strong> Standard MCP client sends payload to local/remote server.<br/>
                      3. <strong>MCP Server Executes:</strong> Handles auth, executes SQL/REST calls locally, and returns result.<br/>
                      4. <strong>Zero Token Leakage:</strong> Secrets & API keys stay inside the local MCP process.
                    </>
                  ) : (
                    <>
                      1. <strong>Developer Defines Schemas:</strong> Hardcodes OpenAI/Anthropic tool schemas in code.<br/>
                      2. <strong>Custom Loop Catches Tool Calls:</strong> Backend code inspects JSON output.<br/>
                      3. <strong>Bespoke `fetch()` Code:</strong> You write custom SDK/API handlers for every single endpoint.<br/>
                      4. <strong>Tightly Coupled:</strong> Changing an endpoint requires updating backend code and re-deploying.
                    </>
                  )}
                </div>
              </div>

              <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                  🛡️ Security & Boundary Advantage
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                  <strong>Local Stdio Process:</strong> When an MCP server runs on your machine (via stdio), your sensitive API tokens and database passwords are stored in local environment variables. The cloud LLM provider <em>never sees the credentials</em>—it only receives the structured output of the tool execution.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: THE 3 LAYERS */}
        {activeTab === 'three_layers' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {[
                { id: 'genai', label: '1. Generative AI (The Brain)', color: '#38bdf8', icon: '🧠' },
                { id: 'agentic', label: '2. Agentic AI (The Thinking Process)', color: '#34d399', icon: '🔄' },
                { id: 'agent', label: '3. AI Agent (The Autonomous Worker)', color: '#fbbf24', icon: '🤖' }
              ].map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id as LayerType)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: '8px',
                    border: `1px solid ${selectedLayer === layer.id ? layer.color : 'rgba(255,255,255,0.08)'}`,
                    background: selectedLayer === layer.id ? `${layer.color}15` : 'rgba(255,255,255,0.02)',
                    color: selectedLayer === layer.id ? layer.color : 'var(--ifm-color-content-secondary)',
                    fontWeight: selectedLayer === layer.id ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {layer.icon} {layer.label}
                </button>
              ))}
            </div>

            {selectedLayer === 'genai' && (
              <div style={{ padding: '16px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  🧠 Generative AI: Content Synthesis & Raw Reasoning
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.6, marginBottom: '10px' }}>
                  <strong>Mental Model:</strong> The raw underlying Large Language Model (e.g. GPT-4o, Claude 3.5 Sonnet, Gemini 2.0). It takes a text input and generates next tokens probabilistically in a single pass.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12px' }}>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                    <strong>Paradigm:</strong> One-Shot Prompt ➔ Output
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                    <strong>Limitation:</strong> Cannot self-correct or run external tools alone
                  </div>
                </div>
              </div>
            )}

            {selectedLayer === 'agentic' && (
              <div style={{ padding: '16px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                  🔄 Agentic AI: Cognitive Architecture & Reasoning Loops
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.6, marginBottom: '10px' }}>
                  <strong>Mental Model:</strong> The methodology of giving an AI a goal, allowing it to formulate plans, decompose tasks, evaluate intermediate results, and iterate until the goal is satisfied.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12px' }}>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                    <strong>Key Patterns:</strong> ReAct (Reason + Act), Reflection, Tree-of-Thought
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                    <strong>Advantage:</strong> Can recover from errors and verify results
                  </div>
                </div>
              </div>
            )}

            {selectedLayer === 'agent' && (
              <div style={{ padding: '16px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
                  🤖 AI Agent: The Complete Autonomous Software System
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.6, marginBottom: '10px' }}>
                  <strong>Mental Model:</strong> The fully assembled product that pairs the <em>Brain</em> (GenAI) with the <em>Thinking Loop</em> (Agentic AI) + <em>Memory</em> (Vector DB / context) + <em>Tools</em> (MCP / APIs / Shell).
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '12px' }}>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                    <strong>1. Brain:</strong> Foundation LLM
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                    <strong>2. Planning:</strong> Agentic Workflow
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                    <strong>3. Memory:</strong> Short & Long-term DB
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                    <strong>4. Tools:</strong> MCP Protocol / REST APIs
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DECISION GUIDE */}
        {activeTab === 'decision_guide' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '16px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                🛠️ When to Stick with Direct API Integration
              </div>
              <ul style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>You are building a closed, standalone application with 1–2 fixed endpoints.</li>
                <li>You have a dedicated backend orchestrator and full control over caller and API.</li>
                <li>You don't need third-party AI clients (Claude Desktop, Cursor, Antigravity) to plug in.</li>
                <li>Latency-critical execution where an extra JSON-RPC hop is unacceptable.</li>
              </ul>
            </div>

            <div style={{ padding: '16px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                🔌 When MCP is Essential
              </div>
              <ul style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>Your tools need to be shared across multiple AI IDEs, clients, and agent platforms.</li>
                <li>You want dynamic tool discovery (`tools/list`) without hardcoding prompt schemas.</li>
                <li>You require local stdio credential isolation (keeping API keys away from LLM providers).</li>
                <li>Modular enterprise architectures where separate teams publish domain MCP servers.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
