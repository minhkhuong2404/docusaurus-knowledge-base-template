import React, { useState } from 'react';

interface NodeState {
  id: string;
  name: string;
  badge: string;
  color: string;
  nodeDescription: string;
  nextEdges: string;
  checkpointState: string;
}

const GRAPH_NODES: NodeState[] = [
  {
    id: 'planner',
    name: '1. Planner Node',
    badge: 'PLANNER',
    color: '#38bdf8', // Sky Blue
    nodeDescription: 'Reads initial user goal from state. Decomposes problem into step checklist and writes tasks to graph state.',
    nextEdges: 'Edges to Coder Node',
    checkpointState: 'State: { goal: "Build REST API", tasks: ["DB Entity", "Service", "Controller"], current_step: 0 }'
  },
  {
    id: 'coder',
    name: '2. Coder Node',
    badge: 'EXECUTE',
    color: '#a78bfa', // Purple
    nodeDescription: 'Reads current task from state. Writes Java code diff and updates state payload with new source files.',
    nextEdges: 'Edges to Tester Node',
    checkpointState: 'State: { code_files: {"PaymentService.java": "public class..."}, status: "pending_verification" }'
  },
  {
    id: 'tester',
    name: '3. Tester Node (Conditional Edge)',
    badge: 'CHECKPOINT',
    color: '#fbbf24', // Amber
    nodeDescription: 'Executes unit test runner in sandbox. If tests fail, returns conditional edge to Coder; if pass, returns edge to End.',
    nextEdges: 'Conditional Edge: if fail -> Coder Node (Loop) | if pass -> END',
    checkpointState: 'State: { test_result: "FAIL - NPE at line 42", retry_count: 1 } -> Branch back to Coder'
  },
  {
    id: 'end',
    name: '4. END Node (Final Result)',
    badge: 'TERMINAL',
    color: '#34d399', // Emerald
    nodeDescription: 'Terminal node representing goal completion. Checkpoints final state to PostgreSQL database.',
    nextEdges: 'Graph Execution Complete',
    checkpointState: 'State: { final_output: "All 12 tests passed", execution_status: "SUCCESS" }'
  }
];

export default function GraphBasedStateDiagram() {
  const [activeNodeId, setActiveNodeId] = useState<string>('tester');
  const currentNode = GRAPH_NODES.find(n => n.id === activeNodeId) || GRAPH_NODES[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>LangGraph Stateful Directed Graph & Checkpointing</span>
      </div>

      {/* Graph Visual Pipeline */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Graph Nodes & Cyclic Transitions
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px'
        }}>
          {GRAPH_NODES.map((node) => {
            const isActive = activeNodeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setActiveNodeId(node.id)}
                style={{
                  background: isActive ? `${node.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? node.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 12px ${node.color}25` : 'none'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: node.color, background: `${node.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {node.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {node.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Node State Inspector */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: currentNode.color, marginBottom: '6px' }}>
          {currentNode.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {currentNode.nodeDescription}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: currentNode.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Graph Routing Edges
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {currentNode.nextEdges}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Checkpointed State Snapshot
            </div>
            <pre style={{
              background: '#090b14',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--ifm-color-content)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}>
              {currentNode.checkpointState}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
