import React, { useState } from 'react';

interface DependencyInfo {
  name: string;
  type: 'core' | 'aop' | 'data' | 'orm' | 'spec';
  desc: string;
  reason: string;
}

const DEPENDENCIES: DependencyInfo[] = [
  {
    name: 'spring-boot-starter',
    type: 'core',
    desc: 'Core Spring Boot support: configuration binding, YAML loading, and default logging (Logback/SLF4J).',
    reason: 'Provides the fundamental infrastructure required for any Spring Boot application.',
  },
  {
    name: 'spring-boot-starter-aop',
    type: 'aop',
    desc: 'Aspect-Oriented Programming support: CGLIB/JDK dynamic proxy runtime, aspects handling.',
    reason: 'Enables support for declarative database transactions via @Transactional annotation.',
  },
  {
    name: 'spring-data-jpa',
    type: 'data',
    desc: 'Spring Data repository abstractions and dynamic query method parsing mechanics.',
    reason: 'Generates runtime proxy implementations of custom interfaces (e.g. JpaRepository).',
  },
  {
    name: 'hibernate-core',
    type: 'orm',
    desc: 'The actual object-relational mapping (ORM) library engine implementing the JPA standard.',
    reason: 'Bridges Java object entities to relational database query operations and SQL queries.',
  },
  {
    name: 'jakarta.persistence-api',
    type: 'spec',
    desc: 'Jakarta Persistence API specification interfaces and standard annotations (@Entity, @Id).',
    reason: 'Ensures the domain class markings conform to standard JPA specifications.',
  },
  {
    name: 'spring-orm',
    type: 'orm',
    desc: 'Spring Framework ORM support, offering LocalContainerEntityManagerFactoryBean and TransactionManager bridges.',
    reason: 'Hooks up Hibernate EntityManagerFactory into Springs transactional context engine.',
  },
];

const COLORS = {
  core: '#38bdf8',
  aop: '#a78bfa',
  data: '#34d399',
  orm: '#fbbf24',
  spec: '#f472b6',
};

export default function SpringBootStarterAnatomyDiagram(): React.JSX.Element {
  const [selectedDep, setSelectedDep] = useState<string | null>('spring-data-jpa');

  const selectedDetails = DEPENDENCIES.find(d => d.name === selectedDep);
  const themeColor = selectedDetails ? COLORS[selectedDetails.type] : '#34d399';

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span>Anatomy of a Starter (spring-boot-starter-data-jpa)</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Visual Composition Block */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '10px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px',
        }}>
          {/* Main Starter Block */}
          <div style={{
            background: 'rgba(52,211,153,0.15)', border: '2px solid #34d399',
            borderRadius: '8px', padding: '10px', textAlign: 'center',
            fontWeight: 800, fontSize: '13px', color: '#34d399',
          }}>
            spring-boot-starter-data-jpa (Dependency Descriptor)
          </div>

          {/* Connection Label */}
          <div style={{ textAlign: 'center', fontSize: '9.5px', color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>
            Transitive Dependencies Loaded Automatically:
          </div>

          {/* Sub-Dependencies Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {DEPENDENCIES.map(d => {
              const isSelected = selectedDep === d.name;
              const depColor = COLORS[d.type];
              return (
                <button
                  key={d.name}
                  onClick={() => setSelectedDep(isSelected ? null : d.name)}
                  style={{
                    padding: '10px 8px', borderRadius: '6px', border: 'none',
                    cursor: 'pointer', fontWeight: 700, fontSize: '11px',
                    textAlign: 'center', transition: 'all 0.2s ease',
                    background: isSelected ? `${depColor}15` : 'rgba(255,255,255,0.03)',
                    color: isSelected ? depColor : 'var(--ifm-color-content-secondary)',
                    boxShadow: isSelected ? `0 0 0 1.5px ${depColor}50` : '0 0 0 1px rgba(255,255,255,0.07)',
                  }}
                >
                  {d.name}
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
              <span style={{ fontSize: '15px', fontWeight: 800, color: themeColor, display: 'block', marginBottom: '4px' }}>
                {selectedDetails.name}
              </span>
              <span style={{
                fontSize: '9.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                background: `${themeColor}15`, color: themeColor, display: 'inline-block', marginBottom: '12px',
              }}>
                Role: {selectedDetails.type.toUpperCase()}
              </span>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: themeColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  What it does
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                  {selectedDetails.desc}
                </div>
              </div>

              <div style={{ background: `${themeColor}0e`, border: `1px solid ${themeColor}30`, borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: themeColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Why it is included
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                  {selectedDetails.reason}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              💡 Click on any transitive library on the left to see its role and why it is included in the JPA starter POM.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
