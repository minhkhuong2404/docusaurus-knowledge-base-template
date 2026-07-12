import React, { useState } from 'react';

interface LayerInfo {
  id: string;
  name: string;
  annotation: string;
  color: string;
  desc: string;
  responsibilities: string[];
  snippet: string;
}

const LAYERS: LayerInfo[] = [
  {
    id: 'controller',
    name: 'Controller Layer (API Gateway)',
    annotation: '@RestController',
    color: '#38bdf8',
    desc: 'Handles incoming HTTP network requests, maps JSON endpoints, conducts basic constraint validation, and builds HTTP responses.',
    responsibilities: [
      'Serialize/Deserialize JSON payloads via Jackson DTOs',
      'Validate field constraints (@Valid, @NotNull)',
      'Convert request commands to Domain parameters',
      'Handle API exceptions gracefully using @RestControllerAdvice',
    ],
    snippet: `@RestController\n@RequestMapping("/api/orders")\npublic class OrderController {\n    private final OrderService orderService;\n\n    @PostMapping\n    public ResponseEntity<OrderDto> create(@Valid @RequestBody OrderRequest req) {\n        Order order = orderService.createOrder(req.toCommand());\n        return ResponseEntity.status(HttpStatus.CREATED).body(OrderDto.from(order));\n    }\n}`,
  },
  {
    id: 'service',
    name: 'Service Layer (Business Logic)',
    annotation: '@Service',
    color: '#a78bfa',
    desc: 'The heart of application logic. Orchestrates operations, conducts domain business logic validations, and executes transactions.',
    responsibilities: [
      'Coordinate multiple repositories or domain aggregates',
      'Manage unit-of-work transaction boundaries (@Transactional)',
      'Invoke external integrations or event-publishing loops',
      'Enforce core functional business constraints',
    ],
    snippet: `@Service\n@Transactional\npublic class OrderService {\n    private final OrderRepository orderRepository;\n    private final PaymentPort paymentPort;\n\n    public Order createOrder(CreateOrderCommand cmd) {\n        Order order = Order.create(cmd);\n        order = orderRepository.save(order);\n        paymentPort.charge(order.getPaymentDetails());\n        return order;\n    }\n}`,
  },
  {
    id: 'repository',
    name: 'Repository Layer (Data Access)',
    annotation: '@Repository',
    color: '#34d399',
    desc: 'Bridges object domain definitions to relational database tables. Manages SQL query definitions and database operations.',
    responsibilities: [
      'Encapsulate database query implementations (JPA, Hibernate, MyBatis)',
      'Expose type-safe CRUD query patterns',
      'Map physical database resultsets back into Java Entities',
      'Define projection queries and native SQL queries',
    ],
    snippet: `@Repository\npublic interface OrderRepository extends JpaRepository<Order, Long> {\n    List<Order> findByCustomerIdAndStatus(\n        Long customerId, \n        OrderStatus status\n    );\n}`,
  },
];

export default function SpringBootLayeredArchitectureDiagram(): React.JSX.Element {
  const [activeLayer, setActiveLayer] = useState<string | null>('controller');

  const current = LAYERS.find(l => l.id === activeLayer);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
        </svg>
        <span>Layered Architecture Explorer</span>
      </div>

      {/* Grid container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
        
        {/* Layer Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          {LAYERS.map(l => {
            const isActive = activeLayer === l.id;
            return (
              <div
                key={l.id}
                onClick={() => setActiveLayer(isActive ? null : l.id)}
                style={{
                  padding: '16px', borderRadius: '10px', cursor: 'pointer',
                  background: isActive ? `${l.color}15` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isActive ? l.color : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: isActive ? `0 0 10px ${l.color}20` : 'none',
                  textAlign: 'center', transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 800, color: isActive ? l.color : 'var(--ifm-color-content)' }}>
                  {l.name}
                </div>
                <code style={{
                  display: 'inline-block', marginTop: '6px', fontSize: '10px',
                  background: 'rgba(0,0,0,0.3)', color: l.color, padding: '2px 6px', borderRadius: '4px',
                }}>
                  {l.annotation}
                </code>
              </div>
            );
          })}
          
          <div style={{
            padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.15)',
            border: '1.5px solid rgba(255,255,255,0.05)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Database / External API</div>
          </div>
        </div>

        {/* Layer Details Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: current ? 'flex-start' : 'center',
        }}>
          {current ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: current.color }}>
                  {current.name}
                </span>
                <code style={{ fontSize: '11px', color: current.color }}>{current.annotation}</code>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                {current.desc}
              </p>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Key Responsibilities
                </div>
                <ul style={{ paddingLeft: '16px', margin: 0 }}>
                  {current.responsibilities.map((r, i) => (
                    <li key={i} style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', marginBottom: '3px' }}>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Standard Code Pattern
                </div>
                <pre style={{
                  fontFamily: 'monospace', fontSize: '10.5px', margin: 0,
                  background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px',
                  color: '#e2e8f0', overflowX: 'auto',
                }}>
                  {current.snippet}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              💡 Click on any stack layer on the left to view detailed responsibilities and source code patterns.
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
