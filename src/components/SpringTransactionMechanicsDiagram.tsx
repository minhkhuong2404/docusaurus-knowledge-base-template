import React, { useState } from 'react';

interface Scenario {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  summary: string;
  steps: {
    step: number;
    title: string;
    description: string;
    status: 'success' | 'warning' | 'danger' | 'info';
  }[];
  codeSnippet: string;
  keyTakeaway: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'external-proxy',
    name: '1. Normal External Proxy Call',
    badge: 'Standard Flow',
    badgeColor: '#34d399',
    summary: 'An external bean (e.g. Controller) invokes a @Transactional service method via the Spring AOP Proxy.',
    steps: [
      { step: 1, title: 'Client Call', description: 'Controller calls userService.createUser() on the injected Spring bean.', status: 'info' },
      { step: 2, title: 'AOP Proxy Interception', description: 'CGLIB/JDK proxy intercepts call before real bean is touched.', status: 'info' },
      { step: 3, title: 'Open Connection', description: 'TransactionInterceptor gets Connection from HikariCP, sets autoCommit=false.', status: 'success' },
      { step: 4, title: 'ThreadLocal Binding', description: 'Connection stored in TransactionSynchronizationManager ThreadLocal locker.', status: 'success' },
      { step: 5, title: 'Bean & Repos Execute', description: 'Target method runs; UserRepository reuses ThreadLocal Connection automatically.', status: 'success' },
      { step: 6, title: 'Commit & Clean Up', description: 'Proxy calls connection.commit() and clears ThreadLocal on successful exit.', status: 'success' },
    ],
    codeSnippet: `@RestController
public class UserController {
    @Autowired private UserService userService; // Injected proxy instance

    @PostMapping("/users")
    public void create() {
        userService.createUser(); // ✅ Intercepted by proxy -> Transaction started
    }
}`,
    keyTakeaway: 'The Spring AOP Proxy stands between external callers and your real bean, managing the JDBC Connection lifecycle via ThreadLocal.',
  },
  {
    id: 'self-invocation',
    name: '2. Self-Invocation Trap (this.method())',
    badge: 'Proxy Bypassed',
    badgeColor: '#f87171',
    summary: 'Calling a @Transactional method from within the same class uses "this", bypassing the proxy completely.',
    steps: [
      { step: 1, title: 'Client Call', description: 'Controller calls orderService.placeOrder() (non-transactional method).', status: 'info' },
      { step: 2, title: 'Proxy Delegates', description: 'Proxy forwards call directly to real OrderService target instance.', status: 'info' },
      { step: 3, title: 'Internal Self-Call', description: 'placeOrder() calls this.updateInventory() inside the same class instance.', status: 'danger' },
      { step: 4, title: 'Proxy Bypassed!', description: 'this points to the target object, NOT the proxy. Interceptor NEVER fires!', status: 'danger' },
      { step: 5, title: 'No Transaction', description: 'Method runs with default JDBC autoCommit=true. Statements commit individually.', status: 'danger' },
      { step: 6, title: 'Partial Persistence', description: 'If an error occurs after statement 1, statement 1 stays in DB! Data corrupted.', status: 'danger' },
    ],
    codeSnippet: `@Service
public class OrderService {
    public void placeOrder() {
        // ❌ Self-invocation! 'this' bypasses proxy!
        this.updateInventory(); // NO TRANSACTION IS CREATED!
    }

    @Transactional
    public void updateInventory() { ... }
}`,
    keyTakeaway: 'Fix by moving the transactional method to a separate @Service bean, using self-injection (@Autowired @Lazy OrderService self), or TransactionTemplate.',
  },
  {
    id: 'async-thread-jump',
    name: '3. @Async Thread-Jump Pitfall',
    badge: 'ThreadLocal Lost',
    badgeColor: '#fbbf24',
    summary: '@Async moves execution to a worker thread, severing the ThreadLocal transaction context.',
    steps: [
      { step: 1, title: 'Caller Transaction', description: 'Caller starts @Transactional method on Thread-1 with active Connection.', status: 'info' },
      { step: 2, title: '@Async Interceptor', description: 'Async interceptor submits task to ThreadPool TaskExecutor.', status: 'warning' },
      { step: 3, title: 'Thread Context Jump', description: 'Execution moves to worker Thread-2. Thread-1 continues independently.', status: 'warning' },
      { step: 4, title: 'Empty ThreadLocal', description: 'Thread-2 inspects its ThreadLocal locker -> EMPTY! Connection from Thread-1 is unreachable.', status: 'danger' },
      { step: 5, title: 'Independent Transaction', description: 'Thread-2 opens a new, completely unrelated transaction from HikariCP.', status: 'warning' },
      { step: 6, title: 'Unsynchronized Outcome', description: 'If Thread-1 rolls back, Thread-2 transaction has ALREADY committed!', status: 'danger' },
    ],
    codeSnippet: `@Transactional // Thread-1
public void placeOrder(Order order) {
    orderRepo.save(order);
    notificationService.sendAsync(order.getId()); // Thread-2 (@Async)
    // If placeOrder throws exception & rolls back,
    // sendAsync on Thread-2 STILL completes and commits!
}`,
    keyTakeaway: 'Use @TransactionalEventListener(phase = AFTER_COMMIT) to trigger async side-effects only after the primary transaction commits successfully.',
  },
  {
    id: 'unexpected-rollback',
    name: '4. UnexpectedRollbackException',
    badge: 'rollbackOnly Tagged',
    badgeColor: '#c084fc',
    summary: 'Inner @Transactional method throws exception and tags the shared transaction rollbackOnly = true.',
    steps: [
      { step: 1, title: 'Outer Txn Started', description: 'Outer method (@Transactional REQUIRED) starts physical transaction T1.', status: 'info' },
      { step: 2, title: 'Inner Txn Joins', description: 'Inner method (@Transactional REQUIRED) joins physical transaction T1.', status: 'info' },
      { step: 3, title: 'Inner Method Fails', description: 'Inner method throws RuntimeException -> sets rollbackOnly=true on T1.', status: 'warning' },
      { step: 4, title: 'Outer Catches Exception', description: 'Outer method catches exception with try-catch and attempts to commit T1.', status: 'warning' },
      { step: 5, title: 'Commit Intercepted', description: 'TransactionManager inspects T1 -> sees rollbackOnly=true flag set!', status: 'danger' },
      { step: 6, title: 'Exception Thrown', description: 'Spring forces rollback and throws UnexpectedRollbackException to caller.', status: 'danger' },
    ],
    codeSnippet: `@Transactional // Outer owner
public void processOrder(Order order) {
    try {
        inventoryService.deduct(order); // Inner REQUIRED -> throws Exception & sets rollbackOnly
    } catch (Exception e) {
        log.warn("Swallowed exception..."); // Outer tries to proceed & commit
    }
    // Spring throws UnexpectedRollbackException on exit!
}`,
    keyTakeaway: 'When catching inner transactional errors, use @Transactional(propagation = REQUIRES_NEW) on the inner method so it gets its own physical transaction.',
  },
];

export default function SpringTransactionMechanicsDiagram(): React.JSX.Element {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success': return '#34d399';
      case 'warning': return '#fbbf24';
      case 'danger': return '#f87171';
      case 'info': return '#38bdf8';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Spring @Transactional Proxy & Execution Pathways
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Scenario Selection Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {SCENARIOS.map((sc) => {
            const isSelected = sc.id === selectedScenario.id;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenario(sc);
                  setActiveStepIndex(0);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${sc.badgeColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                  color: isSelected ? '#ffffff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{sc.name}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: `${sc.badgeColor}22`,
                    color: sc.badgeColor,
                    fontWeight: 600,
                  }}
                >
                  {sc.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary Banner */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '8px',
            borderLeft: `4px solid ${selectedScenario.badgeColor}`,
            marginBottom: '20px',
            fontSize: '14px',
            color: 'var(--ifm-color-content)',
          }}
        >
          {selectedScenario.summary}
        </div>

        {/* Grid Layout: Timeline Steps & Code/Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {/* Left Pane: Execution Step Timeline */}
          <div
            style={{
              backgroundColor: '#0c0e17',
              borderRadius: '10px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Execution Flow Breakdown
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedScenario.steps.map((st, idx) => {
                const isActive = idx === activeStepIndex;
                const statusColor = getStatusColor(st.status);
                return (
                  <div
                    key={st.step}
                    onClick={() => setActiveStepIndex(idx)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isActive ? `1px solid ${statusColor}` : '1px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: isActive ? `${statusColor}12` : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: statusColor,
                        color: '#000',
                        fontWeight: 700,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {st.step}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: isActive ? '#fff' : 'var(--ifm-color-content)', marginBottom: '4px' }}>
                        {st.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                        {st.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Code Snippet & Senior Takeaway */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Code Snippet Card */}
            <div
              style={{
                backgroundColor: '#0c0e17',
                borderRadius: '10px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Code Pattern
              </h4>
              <pre
                style={{
                  margin: 0,
                  padding: '12px',
                  backgroundColor: '#05070e',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                  overflowX: 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  lineHeight: 1.5,
                }}
              >
                <code>{selectedScenario.codeSnippet}</code>
              </pre>
            </div>

            {/* Key Takeaway Card */}
            <div
              style={{
                backgroundColor: '#0c0e17',
                borderRadius: '10px',
                padding: '16px',
                border: `1px solid ${selectedScenario.badgeColor}44`,
                background: `linear-gradient(135deg, #0c0e17 0%, ${selectedScenario.badgeColor}10 100%)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={selectedScenario.badgeColor} strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span style={{ fontWeight: 700, fontSize: '13px', color: selectedScenario.badgeColor }}>
                  Senior Production Insight
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                {selectedScenario.keyTakeaway}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .interactive-diagram-container div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
