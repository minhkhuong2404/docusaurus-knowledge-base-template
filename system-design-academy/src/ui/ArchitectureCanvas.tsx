import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMemo } from 'react'
import type { Architecture } from '../types/game'

const COLORS: Record<string, string> = {
  client: '#6b7c74',
  api: '#2f6f5e',
  postgres: '#3d5a80',
  redis: '#b35c2e',
  load_balancer: '#4a7c59',
  message_queue: '#7a5c3a',
  kafka: '#5c4a7a',
  cdn: '#2f5e6f',
}

function layout(architecture: Architecture): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = architecture.nodes.map((n, i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    return {
      id: n.id,
      position: { x: 40 + col * 200, y: 40 + row * 110 },
      data: { label: n.label },
      style: {
        border: `2px solid ${COLORS[n.componentId] ?? '#2f6f5e'}`,
        borderRadius: 12,
        padding: 10,
        background: '#fffaf2',
        fontWeight: 600,
        minWidth: 120,
        textAlign: 'center' as const,
      },
    }
  })
  const edges: Edge[] = architecture.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#5c6b62' },
    style: { stroke: '#5c6b62' },
  }))
  return { nodes, edges }
}

export function ArchitectureCanvas({ architecture }: { architecture: Architecture }) {
  const { nodes, edges } = useMemo(() => layout(architecture), [architecture])

  return (
    <div className="h-[340px] overflow-hidden rounded-2xl border border-[var(--line)] bg-[#f7f3ea]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background gap={18} color="#d5cdb8" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
