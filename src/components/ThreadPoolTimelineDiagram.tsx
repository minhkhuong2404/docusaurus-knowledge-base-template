import React, { useState } from 'react';

export default function ThreadPoolTimelineDiagram(): React.JSX.Element {
  const [taskCount, setTaskCount] = useState<number>(1);

  const getCoreStatus = (index: number) => {
    if (taskCount >= index) return { text: `T${index}`, active: true, color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.15)' };
    return { text: 'Empty', active: false, color: '#475569', bg: 'rgba(255, 255, 255, 0.02)' };
  };

  const getQueueStatus = (index: number, taskNum: number) => {
    if (taskCount >= taskNum) return { text: `T${taskNum}`, active: true, color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' };
    return { text: `Q${index}`, active: false, color: '#475569', bg: 'rgba(255, 255, 255, 0.02)' };
  };

  const getNonCoreStatus = (index: number, taskNum: number) => {
    if (taskCount >= taskNum) return { text: `T${taskNum}`, active: true, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' };
    return { text: 'Empty', active: false, color: '#475569', bg: 'rgba(255, 255, 255, 0.02)' };
  };

  const getRejectStatus = () => {
    if (taskCount >= 8) return { text: 'T8 (REJECTED)', active: true, color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' };
    return { text: 'None', active: false, color: '#475569', bg: 'rgba(255, 255, 255, 0.02)' };
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Header controls */}
      <div 
        className="interactive-diagram-card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⏳</span>
            <span style={{ color: '#4ade80' }}>Interactive ThreadPool Timeline (T1–T8)</span>
          </h3>
        </div>

        {/* Playback Buttons */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button 
            disabled={taskCount === 0}
            onClick={() => setTaskCount(prev => Math.max(prev - 1, 0))}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              color: taskCount === 0 ? '#475569' : '#ffffff',
              cursor: taskCount === 0 ? 'not-allowed' : 'pointer',
              padding: '2px 8px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            ◀ Back
          </button>
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1', width: '90px', textAlign: 'center' }}>
            {taskCount} Tasks Sent
          </span>
          <button 
            disabled={taskCount === 8}
            onClick={() => setTaskCount(prev => Math.min(prev + 1, 8))}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              color: taskCount === 8 ? '#475569' : '#ffffff',
              cursor: taskCount === 8 ? 'not-allowed' : 'pointer',
              padding: '2px 8px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            Next ▶
          </button>
          <button 
            onClick={() => setTaskCount(8)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px 8px',
              fontSize: '0.8rem'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          {/* Legend */}
          <text x="30" y="30" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#64748b', letterSpacing: '0.5px' }}>Pool Settings: corePoolSize=2, maxPoolSize=4, queueCapacity=3</text>

          {/* Core Threads Layer */}
          <g>
            <text x="30" y="70" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff' }}>Core Slots (2):</text>
            
            <rect x="140" y="52" width="60" height="30" rx="4" ry="4" fill={getCoreStatus(1).bg} stroke={getCoreStatus(1).color} strokeWidth={getCoreStatus(1).active ? '2' : '1'} />
            <text x="170" y="71" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: getCoreStatus(1).color, textAnchor: 'middle' }}>{getCoreStatus(1).text}</text>

            <rect x="210" y="52" width="60" height="30" rx="4" ry="4" fill={getCoreStatus(2).bg} stroke={getCoreStatus(2).color} strokeWidth={getCoreStatus(2).active ? '2' : '1'} />
            <text x="240" y="71" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: getCoreStatus(2).color, textAnchor: 'middle' }}>{getCoreStatus(2).text}</text>
          </g>

          {/* Queue Layer */}
          <g>
            <text x="30" y="115" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff' }}>Queue Slots (3):</text>
            
            <rect x="140" y="97" width="60" height="30" rx="4" ry="4" fill={getQueueStatus(1, 3).bg} stroke={getQueueStatus(1, 3).color} strokeWidth={getQueueStatus(1, 3).active ? '2' : '1'} />
            <text x="170" y="116" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: getQueueStatus(1, 3).color, textAnchor: 'middle' }}>{getQueueStatus(1, 3).text}</text>

            <rect x="210" y="97" width="60" height="30" rx="4" ry="4" fill={getQueueStatus(2, 4).bg} stroke={getQueueStatus(2, 4).color} strokeWidth={getQueueStatus(2, 4).active ? '2' : '1'} />
            <text x="240" y="116" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: getQueueStatus(2, 4).color, textAnchor: 'middle' }}>{getQueueStatus(2, 4).text}</text>

            <rect x="280" y="97" width="60" height="30" rx="4" ry="4" fill={getQueueStatus(3, 5).bg} stroke={getQueueStatus(3, 5).color} strokeWidth={getQueueStatus(3, 5).active ? '2' : '1'} />
            <text x="310" y="116" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: getQueueStatus(3, 5).color, textAnchor: 'middle' }}>{getQueueStatus(3, 5).text}</text>
          </g>

          {/* Non-Core Threads Layer */}
          <g>
            <text x="370" y="70" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff' }}>Non-Core (2):</text>
            
            <rect x="480" y="52" width="60" height="30" rx="4" ry="4" fill={getNonCoreStatus(1, 6).bg} stroke={getNonCoreStatus(1, 6).color} strokeWidth={getNonCoreStatus(1, 6).active ? '2' : '1'} />
            <text x="510" y="71" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: getNonCoreStatus(1, 6).color, textAnchor: 'middle' }}>{getNonCoreStatus(1, 6).text}</text>

            <rect x="550" y="52" width="60" height="30" rx="4" ry="4" fill={getNonCoreStatus(2, 7).bg} stroke={getNonCoreStatus(2, 7).color} strokeWidth={getNonCoreStatus(2, 7).active ? '2' : '1'} />
            <text x="580" y="71" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: getNonCoreStatus(2, 7).color, textAnchor: 'middle' }}>{getNonCoreStatus(2, 7).text}</text>
          </g>

          {/* Rejection Layer */}
          <g>
            <text x="370" y="115" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff' }}>Rejection:</text>

            <rect x="480" y="97" width="130" height="30" rx="4" ry="4" fill={getRejectStatus().bg} stroke={getRejectStatus().color} strokeWidth={getRejectStatus().active ? '2' : '1'} />
            <text x="545" y="116" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: getRejectStatus().color, textAnchor: 'middle' }}>{getRejectStatus().text}</text>
          </g>
        </svg>
      </div>

      {/* Narrative Card */}
      <div 
        className="interactive-diagram-details-card"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '12px 16px'
        }}
      >
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
          {taskCount === 0 && '👉 No tasks submitted yet. Click "Next" to begin submitting tasks to the ThreadPoolExecutor.'}
          {taskCount === 1 && '👉 Task T1 arrives: Sinks directly into core thread slot 1 (spawns thread).'}
          {taskCount === 2 && '👉 Task T2 arrives: Sinks directly into core thread slot 2 (spawns thread). Core pool size limit reached!'}
          {taskCount === 3 && '👉 Task T3 arrives: Core threads are busy! Enqueues into work queue slot 1.'}
          {taskCount === 4 && '👉 Task T4 arrives: Enqueues into work queue slot 2.'}
          {taskCount === 5 && '👉 Task T5 arrives: Enqueues into work queue slot 3. Work queue is now completely FULL!'}
          {taskCount === 6 && '👉 Task T6 arrives: Core pool is full, queue is full. Allocates first temporary Non-Core thread to execute T6.'}
          {taskCount === 7 && '👉 Task T7 arrives: Allocates second temporary Non-Core thread. Pool has reached maximumPoolSize (4 total active threads)!'}
          {taskCount === 8 && '👉 Task T8 arrives: Saturated! Pool cannot grow and queue is full. Triggers the configured RejectedExecutionHandler.'}
        </p>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Step through the timeline using the controls above to see the precise scheduling sequence of Java\'s ThreadPoolExecutor.
      </p>
    </div>
  );
}
