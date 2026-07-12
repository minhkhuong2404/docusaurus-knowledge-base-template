import React, { useState } from 'react';

type QuestionNode = 
  | 'START' 
  | 'MUTUAL_EXC' 
  | 'ADV_LOCK' 
  | 'READ_HEAVY' 
  | 'COORD' 
  | 'BARRIER' 
  | 'SWAP'
  // Results
  | 'SYNCHRONIZED'
  | 'REENTRANT_LOCK'
  | 'READ_WRITE_LOCK'
  | 'STAMPED_LOCK'
  | 'LATCH'
  | 'BARRIER_RESULT'
  | 'EXCHANGER'
  | 'PHASER'
  | 'SEMAPHORE';

interface NodeDetails {
  text: string;
  recommendation?: string;
  buttons: { text: string; next: QuestionNode; style?: 'purple' | 'cyan' | 'green' }[];
}

const FLOW_TREE: Record<QuestionNode, NodeDetails> = {
  START: {
    text: 'Is the goal to protect shared mutable state (mutual exclusion)?',
    buttons: [
      { text: 'YES (Protect State)', next: 'MUTUAL_EXC', style: 'purple' },
      { text: 'NO (Coordinate Threads)', next: 'COORD', style: 'cyan' }
    ]
  },
  MUTUAL_EXC: {
    text: 'Do you need simple mutual exclusion without timeouts, fairness tuning, or interruption support?',
    buttons: [
      { text: 'YES (Keep it Simple)', next: 'SYNCHRONIZED', style: 'purple' },
      { text: 'NO (Need Advanced APIs)', next: 'ADV_LOCK', style: 'cyan' }
    ]
  },
  ADV_LOCK: {
    text: 'Do you need to poll for locks with timeouts, handle interrupts, or configure multiple condition wait-sets?',
    buttons: [
      { text: 'YES (Exclusive Control)', next: 'REENTRANT_LOCK', style: 'purple' },
      { text: 'NO (Read-Heavy Tuning)', next: 'READ_HEAVY', style: 'cyan' }
    ]
  },
  READ_HEAVY: {
    text: 'Is your workload ultra-read-heavy with near-zero writes, allowing optimistic reading?',
    buttons: [
      { text: 'YES (Optimistic)', next: 'STAMPED_LOCK', style: 'purple' },
      { text: 'NO (Traditional RW)', next: 'READ_WRITE_LOCK', style: 'cyan' },
      { text: 'Need Pool Perm Limitation (N > 1)', next: 'SEMAPHORE', style: 'green' }
    ]
  },
  COORD: {
    text: 'Are you waiting for N independent tasks to complete (one-shot count-down)?',
    buttons: [
      { text: 'YES (One-Shot Countdown)', next: 'LATCH', style: 'purple' },
      { text: 'NO (Iterative rendezvous)', next: 'BARRIER', style: 'cyan' }
    ]
  },
  BARRIER: {
    text: 'Do N threads need to meet repeatedly at a barrier point before resetting?',
    buttons: [
      { text: 'YES (Cyclic Rendezvous)', next: 'BARRIER_RESULT', style: 'purple' },
      { text: 'NO (Swapping buffers)', next: 'SWAP', style: 'cyan' }
    ]
  },
  SWAP: {
    text: 'Do exactly two threads need to exchange buffers at a rendezvous point?',
    buttons: [
      { text: 'YES (Double-Buffered Swap)', next: 'EXCHANGER', style: 'purple' },
      { text: 'NO (Dynamic Phases/Parties)', next: 'PHASER', style: 'cyan' }
    ]
  },

  // Final Results
  SYNCHRONIZED: {
    text: 'Decision: synchronized',
    recommendation: 'Use Java\'s built-in synchronized block. It is simple, clear, optimized by the JVM, and safe from resource leaks since locks are auto-released.',
    buttons: [{ text: 'Restart Decision Tree', next: 'START' }]
  },
  REENTRANT_LOCK: {
    text: 'Decision: ReentrantLock',
    recommendation: 'Use java.util.concurrent.locks.ReentrantLock. Wrap acquisitions in try-finally to ensure unlock() runs, and leverage tryLock() with timeouts to mitigate deadlocks.',
    buttons: [{ text: 'Restart Decision Tree', next: 'START' }]
  },
  READ_WRITE_LOCK: {
    text: 'Decision: ReentrantReadWriteLock',
    recommendation: 'Use ReentrantReadWriteLock when you have high read frequency and low write frequency. Be careful with lock upgrades (read -> write), which are not supported.',
    buttons: [{ text: 'Restart Decision Tree', next: 'START' }]
  },
  STAMPED_LOCK: {
    text: 'Decision: StampedLock',
    recommendation: 'Use StampedLock for ultra-read-heavy scenarios. Leverage tryOptimisticRead() and validate(stamp) to avoid CAS atomic overhead on cache lines. Note: StampedLock is not reentrant!',
    buttons: [{ text: 'Restart Decision Tree', next: 'START' }]
  },
  SEMAPHORE: {
    text: 'Decision: Semaphore',
    recommendation: 'Use java.util.concurrent.Semaphore. Ideal for controlling access to resources with finite permits (e.g. database connection pool limits).',
    buttons: [{ text: 'Restart Decision Tree', next: 'START' }]
  },
  LATCH: {
    text: 'Decision: CountDownLatch',
    recommendation: 'Use CountDownLatch for one-shot coordination. Call countDown() inside worker threads and await() inside the waiting thread. It cannot be reset.',
    buttons: [{ text: 'Restart Decision Tree', next: 'START' }]
  },
  BARRIER_RESULT: {
    text: 'Decision: CyclicBarrier',
    recommendation: 'Use CyclicBarrier to manage multi-threaded iterations. The count resets automatically after releasing, and you can specify a barrier action to run on each cycle.',
    buttons: [{ text: 'Restart Decision Tree', next: 'START' }]
  },
  EXCHANGER: {
    text: 'Decision: Exchanger',
    recommendation: 'Use java.util.concurrent.Exchanger to coordinate exactly two threads exchanging datasets or buffers dynamically.',
    buttons: [{ text: 'Restart Decision Tree', next: 'START' }]
  },
  PHASER: {
    text: 'Decision: Phaser',
    recommendation: 'Use Phaser for advanced multi-phase stream pipelines with dynamic registration. It acts as a flexible, reusable barrier.',
    buttons: [{ text: 'Restart Decision Tree', next: 'START' }]
  }
};

export default function LockDecisionTreeDiagram(): React.JSX.Element {
  const [currentNode, setCurrentNode] = useState<QuestionNode>('START');
  const [history, setHistory] = useState<QuestionNode[]>([]);

  const nodeDetails = FLOW_TREE[currentNode];

  const handleNext = (next: QuestionNode) => {
    setHistory(prev => [...prev, currentNode]);
    setCurrentNode(next);
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentNode(prev);
    }
  };

  const handleReset = () => {
    setHistory([]);
    setCurrentNode('START');
  };

  const isResult = !!nodeDetails.recommendation;

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Header */}
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
            <span>🗺️</span>
            <span style={{ color: isResult ? '#4ade80' : '#a855f7' }}>
              Concurrency Decision Guide
            </span>
          </h3>
        </div>

        {history.length > 0 && (
          <button 
            onClick={handleBack}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            ← Back
          </button>
        )}
      </div>

      {/* Main Flow Card */}
      <div 
        className={`interactive-diagram-details-card ${
          isResult ? 'details-green' : 'details-purple'
        }`}
        style={{ padding: '1.5rem', textAlign: 'center' }}
      >
        <h4 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', fontWeight: 700, color: '#ffffff' }}>
          {nodeDetails.text}
        </h4>

        {nodeDetails.recommendation && (
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>
            {nodeDetails.recommendation}
          </p>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {nodeDetails.buttons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => handleNext(btn.next)}
              style={{
                background: btn.style === 'purple' ? '#a855f7' : btn.style === 'cyan' ? '#2dd4bf' : btn.style === 'green' ? '#4ade80' : 'rgba(255,255,255,0.05)',
                color: btn.style === 'cyan' || btn.style === 'green' ? '#000000' : '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            >
              {btn.text}
            </button>
          ))}
        </div>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Answer the questions inside the flowchart cards to navigate Java concurrency and lock choices.
      </p>
    </div>
  );
}
