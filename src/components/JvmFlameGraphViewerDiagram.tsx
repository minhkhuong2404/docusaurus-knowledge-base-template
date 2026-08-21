import React, { useState } from 'react';

interface FrameNode {
  id: string;
  name: string;
  className: string;
  totalPercent: number;
  selfPercent: number;
  isHotSpot?: boolean;
  notes: string;
}

const FRAMES: Record<string, FrameNode> = {
  main: { id: 'main', name: 'main()', className: 'java.lang.Thread.run', totalPercent: 100, selfPercent: 0, notes: 'Root entry point of application execution.' },
  processOrder: { id: 'processOrder', name: 'OrderService.processOrder()', className: 'com.example.service.OrderService', totalPercent: 68, selfPercent: 8, notes: 'Main order processing pipeline.' },
  computePrice: { id: 'computePrice', name: 'OrderService.computePrice()', className: 'com.example.service.OrderService', totalPercent: 60, selfPercent: 12, notes: 'Calculates dynamic discounts and taxes.' },
  regexMatch: { id: 'regexMatch', name: 'Pattern.matcher().matches() [HOT SPOT]', className: 'java.util.regex.Pattern', totalPercent: 48, selfPercent: 48, isHotSpot: true, notes: '🚨 WIDE FLAT PLATEAU: 48% of all CPU time is burned here due to catastrophic regex backtracking on uncompiled patterns!' },
  mathSqrt: { id: 'mathSqrt', name: 'Math.sqrt()', className: 'java.lang.Math', totalPercent: 12, selfPercent: 12, notes: 'Distance calculation for shipping estimate.' },
  handleRequest: { id: 'handleRequest', name: 'ApiController.handleRequest()', className: 'com.example.controller.ApiController', totalPercent: 32, selfPercent: 2, notes: 'HTTP API inbound controller.' },
  serialize: { id: 'serialize', name: 'ObjectMapper.writeValueAsString()', className: 'com.fasterxml.jackson.databind.ObjectMapper', totalPercent: 20, selfPercent: 20, notes: 'Jackson JSON serialization of response DTOs.' },
  sendResponse: { id: 'sendResponse', name: 'SocketOutputStream.socketWrite()', className: 'java.net.SocketOutputStream', totalPercent: 10, selfPercent: 10, notes: 'Writing bytes to network socket.' }
};

export default function JvmFlameGraphViewerDiagram(): React.JSX.Element {
  const [selectedFrameId, setSelectedFrameId] = useState<string>('regexMatch');

  const selected = FRAMES[selectedFrameId] || FRAMES.regexMatch;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .flame-box {
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid rgba(255, 255, 255, 0.15);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .flame-box:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }
        .flame-layout {
          display: grid;
          grid-template-columns: 60% 40%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .flame-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Interactive async-profiler Flame Graph Viewer
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', fontWeight: 600 }}>
          CPU Sample Visualizer
        </span>
      </div>

      {/* Main Container */}
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px' }}>
          Click any stack frame in the flame graph below to inspect its call hierarchy, sample percentage, and diagnose CPU hot spots:
        </div>

        <div className="flame-layout">
          {/* Flame Graph Visualizer */}
          <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '4px' }}>
              {/* Level 0: Root */}
              <div
                className="flame-box"
                onClick={() => setSelectedFrameId('main')}
                style={{
                  width: '100%',
                  background: selectedFrameId === 'main' ? '#f97316' : '#e65100',
                  color: '#ffffff'
                }}
              >
                <span>main() [100%]</span>
              </div>

              {/* Level 1 */}
              <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                <div
                  className="flame-box"
                  onClick={() => setSelectedFrameId('processOrder')}
                  style={{
                    width: '68%',
                    background: selectedFrameId === 'processOrder' ? '#f97316' : '#ef6c00',
                    color: '#ffffff'
                  }}
                >
                  <span>OrderService.processOrder() (68%)</span>
                </div>
                <div
                  className="flame-box"
                  onClick={() => setSelectedFrameId('handleRequest')}
                  style={{
                    width: '32%',
                    background: selectedFrameId === 'handleRequest' ? '#38bdf8' : '#0284c7',
                    color: '#ffffff'
                  }}
                >
                  <span>ApiController.handleRequest() (32%)</span>
                </div>
              </div>

              {/* Level 2 */}
              <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                <div
                  className="flame-box"
                  onClick={() => setSelectedFrameId('computePrice')}
                  style={{
                    width: '60%',
                    background: selectedFrameId === 'computePrice' ? '#f97316' : '#f57c00',
                    color: '#ffffff'
                  }}
                >
                  <span>computePrice() (60%)</span>
                </div>
                <div style={{ width: '8%' }} />
                <div
                  className="flame-box"
                  onClick={() => setSelectedFrameId('serialize')}
                  style={{
                    width: '20%',
                    background: selectedFrameId === 'serialize' ? '#38bdf8' : '#0369a1',
                    color: '#ffffff'
                  }}
                >
                  <span>Jackson.serialize() (20%)</span>
                </div>
                <div
                  className="flame-box"
                  onClick={() => setSelectedFrameId('sendResponse')}
                  style={{
                    width: '10%',
                    background: selectedFrameId === 'sendResponse' ? '#34d399' : '#059669',
                    color: '#ffffff'
                  }}
                >
                  <span>socketWrite() (10%)</span>
                </div>
              </div>

              {/* Level 3: Leaf Hotspots */}
              <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                <div
                  className="flame-box"
                  onClick={() => setSelectedFrameId('regexMatch')}
                  style={{
                    width: '48%',
                    background: selectedFrameId === 'regexMatch' ? '#f87171' : '#dc2626',
                    color: '#ffffff',
                    border: '2px solid #ffffff'
                  }}
                >
                  <span>🔥 Pattern.matches() (48% CPU)</span>
                </div>
                <div
                  className="flame-box"
                  onClick={() => setSelectedFrameId('mathSqrt')}
                  style={{
                    width: '12%',
                    background: selectedFrameId === 'mathSqrt' ? '#f97316' : '#fb8c00',
                    color: '#ffffff'
                  }}
                >
                  <span>Math.sqrt() (12%)</span>
                </div>
                <div style={{ width: '40%' }} />
              </div>
            </div>

            {/* Flame Graph Legend / Rules */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px', fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
              <span>↔️ <strong>Width</strong> = % of CPU Time</span>
              <span>⬆️ <strong>Height</strong> = Call Stack Depth</span>
              <span style={{ color: '#f87171' }}>🔥 <strong>Flat Top Plateau</strong> = Hot Self Time</span>
            </div>
          </div>

          {/* Frame Inspector Panel */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: selected.isHotSpot ? '#f8717120' : '#38bdf820', color: selected.isHotSpot ? '#f87171' : '#38bdf8' }}>
                {selected.isHotSpot ? '🔥 CRITICAL BOTTLENECK' : 'STACK FRAME'}
              </span>
              <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                {selected.name}
              </h4>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px', fontFamily: 'monospace' }}>
              {selected.className}
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '8px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-300)', fontSize: '11px' }}>
                <strong style={{ color: '#f97316' }}>Total Time (with children):</strong>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{selected.totalPercent}%</div>
              </div>
              <div style={{ padding: '8px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-300)', fontSize: '11px' }}>
                <strong style={{ color: '#f87171' }}>Self Time (in this frame):</strong>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{selected.selfPercent}%</div>
              </div>
            </div>

            {/* Notes & Interpretation */}
            <div style={{ padding: '10px', borderRadius: '6px', background: selected.isHotSpot ? 'rgba(248, 113, 113, 0.12)' : 'var(--ifm-color-emphasis-100)', borderLeft: `4px solid ${selected.isHotSpot ? '#f87171' : '#38bdf8'}`, fontSize: '11px', lineHeight: 1.45 }}>
              <div style={{ fontWeight: 700, color: selected.isHotSpot ? '#f87171' : '#38bdf8', marginBottom: '2px' }}>
                Flame Graph Reading:
              </div>
              <div style={{ color: 'var(--ifm-color-content)' }}>
                {selected.notes}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
