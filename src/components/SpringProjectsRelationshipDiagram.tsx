import React, { useState } from 'react';

interface ProjectNode {
  id: string;
  name: string;
  starter: string;
  color: string;
  desc: string;
  autoConfig: string;
}

const PROJECTS: ProjectNode[] = [
  {
    id: 'framework',
    name: 'Spring Framework',
    starter: 'spring-boot-starter (Core)',
    color: '#38bdf8',
    desc: 'The fundamental backing context engine providing dependency injection (DI), inversion of control (IoC), and aspect-oriented programming (AOP).',
    autoConfig: 'Boot initializes default logging (Logback), configures YAML/properties binding engines, and prepares the ApplicationContext lifecycle containers.',
  },
  {
    id: 'data',
    name: 'Spring Data',
    starter: 'spring-boot-starter-data-jpa',
    color: '#34d399',
    desc: 'Simplifies database persistence via dynamic JPA/Hibernate repository interfaces, query generation engines, and transaction hooks.',
    autoConfig: 'Detects in-memory H2/HSQL databases or physical drivers, initializes a DataSource pool (HikariCP), binds a JPA EntityManager, and sets up @EnableTransactionManagement.',
  },
  {
    id: 'security',
    name: 'Spring Security',
    starter: 'spring-boot-starter-security',
    color: '#a78bfa',
    desc: 'Enterprise security, filter chains, OAuth2 workflows, JWT validations, and method-level authorization.',
    autoConfig: 'Generates a default security filter chain, configures a default password-protected user account ("user" + random UUID logged in console), and secures all HTTP endpoints.',
  },
  {
    id: 'cloud',
    name: 'Spring Cloud',
    starter: 'spring-cloud-starter-config',
    color: '#fbbf24',
    desc: 'Microservices architecture toolset providing centralized configuration, service discovery (Eureka), routing (Gateway), and resilience.',
    autoConfig: 'Triggers bootstrap context loading loops, monitors config changes, and configures ribbon load-balancer handlers on RestTemplate client templates.',
  },
  {
    id: 'batch',
    name: 'Spring Batch',
    starter: 'spring-boot-starter-batch',
    color: '#f472b6',
    desc: 'Chunk-based batch engine for processing high-volume records (ETL), managing job states, steps, execution logs, and transaction checkpoints.',
    autoConfig: 'Initializes a Batch Database Repository, hooks up a JobLauncher, and runs any declared CommandLineRunner jobs automatically on startup.',
  },
  {
    id: 'webflux',
    name: 'Spring WebFlux',
    starter: 'spring-boot-starter-webflux',
    color: '#2dd4bf',
    desc: 'Non-blocking reactive web framework built on Netty event-loop engines and Project Reactor streams, handling extreme request volumes.',
    autoConfig: 'Launches an embedded Netty server engine instead of Tomcat, configures reactive web codec decoders, and wires reactive security filter chains.',
  },
];

export default function SpringProjectsRelationshipDiagram(): React.JSX.Element {
  const [selectedNode, setSelectedNode] = useState<string | null>('data');

  const selectedDetails = PROJECTS.find(p => p.id === selectedNode);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>🔗 Relationship to Other Spring Projects</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Node Selection Graph */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '8px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px', justifyContent: 'center',
        }}>
          {/* Spring Boot Center */}
          <div style={{
            background: 'rgba(52,211,153,0.15)', border: '2px solid #34d399',
            borderRadius: '12px', padding: '12px', textAlign: 'center',
            color: '#34d399', fontWeight: 800, fontSize: '14px', marginBottom: '10px',
            boxShadow: '0 0 15px rgba(52,211,153,0.25)',
          }}>
            SPRING BOOT (Orchestrator)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {PROJECTS.map(p => {
              const isSelected = selectedNode === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedNode(isSelected ? null : p.id)}
                  style={{
                    padding: '12px 8px', borderRadius: '8px', border: 'none',
                    cursor: 'pointer', fontWeight: 700, fontSize: '11.5px',
                    textAlign: 'center',
                    background: isSelected ? `${p.color}15` : 'rgba(255,255,255,0.03)',
                    color: isSelected ? p.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: isSelected ? `0 0 0 1.5px ${p.color}50` : '0 0 0 1px rgba(255,255,255,0.07)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Details Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: selectedDetails ? 'flex-start' : 'center',
        }}>
          {selectedDetails ? (
            <div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: selectedDetails.color, display: 'block', marginBottom: '4px' }}>
                {selectedDetails.name}
              </span>
              <code style={{ fontSize: '10.5px', background: 'rgba(0,0,0,0.3)', color: selectedDetails.color, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '10px' }}>
                Starter: {selectedDetails.starter}
              </code>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: selectedDetails.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Project Role
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                  {selectedDetails.desc}
                </div>
              </div>

              <div style={{ background: `${selectedDetails.color}0e`, border: `1px solid ${selectedDetails.color}30`, borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: selectedDetails.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  ⚡ Boot Auto-Configuration Magic
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                  {selectedDetails.autoConfig}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              💡 Click on any surrounding Spring project on the left to see how Spring Boot manages, configures, and hooks into it automatically.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
