import React, { useState } from 'react';

interface HexSection {
  id: string;
  name: string;
  color: string;
  desc: string;
  snippet: string;
  rules: string[];
}

const HEX_SECTIONS: Record<string, HexSection> = {
  DRIVING_ADAPTERS: {
    id: 'DRIVING_ADAPTERS',
    name: 'Driving (Input) Adapters',
    color: '#38bdf8',
    desc: 'Translates external events (HTTP requests, CLI args, Kafka events) into commands recognized by the application core. Knows nothing about database internals.',
    snippet: `// Driving Adapter: Controller calls Port interface\n@RestController\n@RequestMapping("/orders")\npublic class OrderController {\n    private final CreateOrderUseCase useCase; // Port\n\n    @PostMapping\n    public void create(@RequestBody OrderReq req) {\n        useCase.create(new CreateOrderCommand(req.items()));\n    }\n}`,
    rules: [
      'Spring MVC controllers, CLI runners, and Kafka listeners live here.',
      'Depends on Domain Ports, never directly on Domain Services or Repositories.',
    ],
  },
  DRIVING_PORTS: {
    id: 'DRIVING_PORTS',
    name: 'Driving Ports (Use Cases)',
    color: '#a78bfa',
    desc: 'Inward-facing interfaces defined by the Domain Core. They declare the API/actions the domain offers to the outside world.',
    snippet: `// Port inside Domain Core\npublic interface CreateOrderUseCase {\n    OrderResponse create(CreateOrderCommand command);\n}`,
    rules: [
      'Always interfaces located inside the domain package.',
      'Defines the entry points / capabilities of the business domain.',
    ],
  },
  DOMAIN: {
    id: 'DOMAIN',
    name: 'Domain Core (Entities & Services)',
    color: '#34d399',
    desc: 'Pure business logic. Houses entities, aggregate roots, and services. Zero dependencies on database libraries, framework config, or web controllers.',
    snippet: `// Pure Java implementation inside Domain Core\npublic class OrderDomainService implements CreateOrderUseCase {\n    private final PaymentPort paymentPort; // Driven Port\n\n    @Override\n    public OrderResponse create(CreateOrderCommand cmd) {\n        // Domain validation and state mutations\n        paymentPort.charge(cmd.amount());\n        return new OrderResponse("success");\n    }\n}`,
    rules: [
      'Must contain only pure Java code (or domain abstractions).',
      'Forbidden to import classes from Spring Boot, Hibernate, JPA, or Jackson.',
    ],
  },
  DRIVEN_PORTS: {
    id: 'DRIVEN_PORTS',
    name: 'Driven Ports (SPI / Outward)',
    color: '#fbbf24',
    desc: 'Outward-facing interfaces defined by the Domain Core. They declare what dependencies (database, external mail, SMS, stripe) the domain needs to function.',
    snippet: `// Driven Port inside Domain Core\npublic interface PaymentPort {\n    void charge(BigDecimal amount);\n}`,
    rules: [
      'Always interfaces located inside the domain package.',
      'Defines database requirements, third-party interfaces, or notification requirements.',
    ],
  },
  DRIVEN_ADAPTERS: {
    id: 'DRIVEN_ADAPTERS',
    name: 'Driven (Output) Adapters',
    color: '#f472b6',
    desc: 'Translates domain requests into database queries (JPA, SQL), external HTTP queries (REST API calls), or broker operations (Kafka, RabbitMQ).',
    snippet: `// Infrastructure Adapter: Implements Port\n@Component\npublic class StripePaymentAdapter implements PaymentPort {\n    private final StripeClient stripeClient;\n\n    @Override\n    public void charge(BigDecimal amount) {\n        // Calls external Stripe API here\n        stripeClient.chargeCard(amount);\n    }\n}`,
    rules: [
      'Spring Data JPA repositories, SMTP mail senders, and REST adapters live here.',
      'Implements the Driven Port interfaces defined in the domain.',
    ],
  },
};

export default function SpringBootHexagonalArchitectureDiagram(): React.JSX.Element {
  const [activeSec, setActiveSec] = useState<string | null>('DOMAIN');

  const current = activeSec ? HEX_SECTIONS[activeSec] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
        </svg>
        <span>Hexagonal / Ports &amp; Adapters Architecture</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Architecture Blocks Layout */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '8px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px', justifyContent: 'center',
        }}>
          {/* Driving Adapters */}
          <div
            onClick={() => setActiveSec('DRIVING_ADAPTERS')}
            style={{
              padding: '10px', borderRadius: '6px', cursor: 'pointer', textAlign: 'center',
              background: activeSec === 'DRIVING_ADAPTERS' ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${activeSec === 'DRIVING_ADAPTERS' ? '#38bdf8' : 'rgba(255,255,255,0.05)'}`,
              color: '#38bdf8', fontSize: '12px', fontWeight: 700, transition: 'all 0.2s',
            }}
          >
            Driving (Input) Adapters (REST Controller, Kafka Consumer)
          </div>

          {/* Flow Direction Indicator */}
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#475569' }}>▼ calls use case</div>

          {/* Domain Core Wrapper */}
          <div style={{
            background: 'rgba(52,211,153,0.03)', border: '1.5px dashed rgba(52,211,153,0.25)',
            borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
              Domain Core (App/Enterprise Boundary)
            </div>

            {/* Driving Ports */}
            <div
              onClick={() => setActiveSec('DRIVING_PORTS')}
              style={{
                padding: '8px', borderRadius: '4px', cursor: 'pointer', textAlign: 'center',
                background: activeSec === 'DRIVING_PORTS' ? 'rgba(167,135,250,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1.2px solid ${activeSec === 'DRIVING_PORTS' ? '#a78bfa' : 'rgba(255,255,255,0.05)'}`,
                color: '#a78bfa', fontSize: '11px', fontWeight: 700, transition: 'all 0.2s',
              }}
            >
              Driving Ports (Use Case Interfaces)
            </div>

            {/* Core Domain */}
            <div
              onClick={() => setActiveSec('DOMAIN')}
              style={{
                padding: '12px', borderRadius: '4px', cursor: 'pointer', textAlign: 'center',
                background: activeSec === 'DOMAIN' ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.05)',
                border: `1.5px solid ${activeSec === 'DOMAIN' ? '#34d399' : '#34d39950'}`,
                color: '#34d399', fontSize: '12px', fontWeight: 800, transition: 'all 0.2s',
              }}
            >
              Domain Logic (Entities &amp; Services)
            </div>

            {/* Driven Ports */}
            <div
              onClick={() => setActiveSec('DRIVEN_PORTS')}
              style={{
                padding: '8px', borderRadius: '4px', cursor: 'pointer', textAlign: 'center',
                background: activeSec === 'DRIVEN_PORTS' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1.2px solid ${activeSec === 'DRIVEN_PORTS' ? '#fbbf24' : 'rgba(255,255,255,0.05)'}`,
                color: '#fbbf24', fontSize: '11px', fontWeight: 700, transition: 'all 0.2s',
              }}
            >
              Driven Ports (SPI / Output Interfaces)
            </div>
          </div>

          {/* Flow Direction Indicator */}
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#475569' }}>▼ implements interfaces</div>

          {/* Driven Adapters */}
          <div
            onClick={() => setActiveSec('DRIVEN_ADAPTERS')}
            style={{
              padding: '10px', borderRadius: '6px', cursor: 'pointer', textAlign: 'center',
              background: activeSec === 'DRIVEN_ADAPTERS' ? 'rgba(244,114,182,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${activeSec === 'DRIVEN_ADAPTERS' ? '#f472b6' : 'rgba(255,255,255,0.05)'}`,
              color: '#f472b6', fontSize: '12px', fontWeight: 700, transition: 'all 0.2s',
            }}
          >
            Driven (Output) Adapters (Spring Data, Stripe, MailSender)
          </div>
        </div>

        {/* Section Details Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: current ? 'flex-start' : 'center',
        }}>
          {current ? (
            <div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: current.color, display: 'block', marginBottom: '8px' }}>
                {current.name}
              </span>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                {current.desc}
              </p>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Architecture Rules
                </div>
                <ul style={{ paddingLeft: '16px', margin: 0 }}>
                  {current.rules.map((r, i) => (
                    <li key={i} style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', marginBottom: '3px' }}>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Code Structure
                </div>
                <pre style={{
                  fontFamily: 'monospace', fontSize: '10px', margin: 0,
                  background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px',
                  color: '#e2e8f0', overflowX: 'auto',
                }}>
                  {current.snippet}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              💡 Click on any component blocks in the ports &amp; adapters diagram to inspect rules and code examples.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
