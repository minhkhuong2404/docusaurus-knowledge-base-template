import React, { useState } from 'react';

type TabMode = 'precedence' | 'relaxed_binding' | 'profile_cascade' | 'type_safe_props';

interface PrecedenceTier {
  rank: number;
  name: string;
  category: 'Override' | 'Environment' | 'File' | 'Default';
  color: string;
  source: string;
  example: string;
  description: string;
  engineGotcha: string;
}

const PRECEDENCE_TIERS: PrecedenceTier[] = [
  {
    rank: 1,
    name: 'Command-Line Arguments',
    category: 'Override',
    color: '#f87171',
    source: 'CommandLinePropertySource',
    example: 'java -jar app.jar --server.port=9090 --app.env=prod',
    description: 'Passed directly on the CLI invocation after the JAR name. Highest precedence for operational operators.',
    engineGotcha: 'Can be disabled at startup via SpringApplication.setAddCommandLineProperties(false) for locked security environments.',
  },
  {
    rank: 2,
    name: 'SPRING_APPLICATION_JSON',
    category: 'Override',
    color: '#fbbf24',
    source: 'SpringApplicationJsonEnvironmentPostProcessor',
    example: "SPRING_APPLICATION_JSON='{\"server\":{\"port\":9090}}'",
    description: 'Single environment variable or system property carrying a serialized JSON tree. Parses into hierarchical keys.',
    engineGotcha: 'Extremely popular in Cloud Foundry and Kubernetes pods where passing dozens of individual env vars is unmanageable.',
  },
  {
    rank: 3,
    name: 'Java System Properties',
    category: 'Environment',
    color: '#38bdf8',
    source: 'System.getProperties()',
    example: 'java -Dserver.port=8080 -Dapp.timeout=30s -jar app.jar',
    description: 'Properties passed to the JVM before the -jar flag. Stored in Java runtime memory table.',
    engineGotcha: 'CRITICAL TRAP: System properties (-D) override OS environment variables! If a Docker entrypoint sets -Dspring.datasource.url, K8s env vars will be silently ignored.',
  },
  {
    rank: 4,
    name: 'OS Environment Variables',
    category: 'Environment',
    color: '#34d399',
    source: 'System.getenv() (Relaxed Binding)',
    example: 'export SERVER_PORT=8080 && export SPRING_DATASOURCE_URL=jdbc:...',
    description: 'Injected by Linux shell, Docker container runtime, or Kubernetes ConfigMap/Secret pods.',
    engineGotcha: 'Subject to OS naming constraints: dots and dashes converted to underscores; lowercase converted to uppercase.',
  },
  {
    rank: 5,
    name: 'Profile-Specific File (Outside JAR)',
    category: 'File',
    color: '#a78bfa',
    source: 'file:./config/application-{profile}.yml',
    example: './config/application-prod.yml or /etc/app/config/application-prod.yml',
    description: 'Profile-activated configuration files residing in current directory or /config subdirectory on disk.',
    engineGotcha: 'Overrides files packaged inside the compiled JAR, allowing ops teams to configure live systems without rebuilding code.',
  },
  {
    rank: 6,
    name: 'Profile-Specific File (Inside JAR)',
    category: 'File',
    color: '#818cf8',
    source: 'classpath:/application-{profile}.yml',
    example: 'src/main/resources/application-prod.yml (bundled in JAR)',
    description: 'Built-in profile configurations compiled into the JAR artifact. Activated via spring.profiles.active.',
    engineGotcha: 'Evaluated only when the corresponding profile is explicitly active (e.g. spring.profiles.active=prod).',
  },
  {
    rank: 7,
    name: 'Default Application File (Inside JAR)',
    category: 'File',
    color: '#2dd4bf',
    source: 'classpath:/application.yml (or .properties)',
    example: 'src/main/resources/application.yml',
    description: 'The standard baseline configuration file packaged with every Spring Boot microservice.',
    engineGotcha: 'Provides sensible defaults. Every property here can be overridden by any profile, env var, or CLI flag.',
  },
  {
    rank: 8,
    name: 'SpringApplication Default Properties',
    category: 'Default',
    color: '#94a3b8',
    source: 'SpringApplication.setDefaultProperties(map)',
    example: 'app.setDefaultProperties(Map.of("server.port", "8080"))',
    description: 'Programmatic fallback dictionary configured in Java code before context refresh.',
    engineGotcha: 'Lowest priority fallback. Any external property source will take precedence.',
  },
];

export default function SpringBootConfigPropertiesDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabMode>('precedence');
  const [selectedTier, setSelectedTier] = useState<number>(3); // Default to Java System Properties vs Env

  return (
    <div
      className="interactive-diagram-container"
      style={{
        fontFamily: 'var(--ifm-font-family-base)',
        background: '#090b14',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '20px',
        color: '#f8fafc',
        margin: '24px 0',
      }}
    >
      {/* Header bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <line x1="7" y1="8" x2="7.01" y2="8" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
            <line x1="17" y1="8" x2="17.01" y2="8" />
          </svg>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
            Spring Boot Configuration & Property Resolution Engine
          </span>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'precedence', label: '17-Level Precedence Ladder', color: '#f87171' },
            { id: 'relaxed_binding', label: 'Relaxed Binding Engine', color: '#34d399' },
            { id: 'profile_cascade', label: 'Profile Override Flow', color: '#38bdf8' },
            { id: 'type_safe_props', label: '@Value vs @ConfigProps', color: '#a78bfa' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabMode)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                border: activeTab === tab.id ? `1px solid ${tab.color}` : '1px solid #334155',
                background: activeTab === tab.id ? `${tab.color}22` : '#0f172a',
                color: activeTab === tab.id ? tab.color : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Precedence Hierarchy */}
      {activeTab === 'precedence' && (
        <div>
          <div style={{ marginBottom: '14px', fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.5 }}>
            Spring Boot resolves properties from 17+ layered sources. The engine evaluates top-down: the{' '}
            <strong style={{ color: '#f87171' }}>first non-null source wins</strong>. Click any tier below to inspect its
            under-the-hood class and production pitfalls.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            {/* Ladder Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PRECEDENCE_TIERS.map((tier) => {
                const isSelected = selectedTier === tier.rank;
                return (
                  <div
                    key={tier.rank}
                    onClick={() => setSelectedTier(tier.rank)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: isSelected ? '#131b2e' : '#0d1322',
                      border: isSelected ? `1.5px solid ${tier.color}` : '1px solid #1e293b',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: `${tier.color}22`,
                          color: tier.color,
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {tier.rank}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? tier.color : '#f1f5f9' }}>
                          {tier.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                          {tier.source}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#1e293b',
                        color: tier.color,
                        fontWeight: 600,
                      }}
                    >
                      {tier.category}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Inspector Detail Card */}
            {(() => {
              const activeInfo = PRECEDENCE_TIERS.find((t) => t.rank === selectedTier) || PRECEDENCE_TIERS[0];
              return (
                <div
                  style={{
                    background: '#0c0e17',
                    border: `1px solid ${activeInfo.color}66`,
                    borderRadius: '10px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: activeInfo.color }}>
                      Tier #{activeInfo.rank}: {activeInfo.name}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        background: `${activeInfo.color}22`,
                        color: activeInfo.color,
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {activeInfo.category} Tier
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                    {activeInfo.description}
                  </p>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      SYNTAX EXAMPLE:
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        padding: '8px 12px',
                        background: '#05070d',
                        borderRadius: '6px',
                        border: '1px solid #1e293b',
                        color: '#34d399',
                        fontSize: '12px',
                        overflowX: 'auto',
                      }}
                    >
                      <code>{activeInfo.example}</code>
                    </pre>
                  </div>

                  <div
                    style={{
                      background: '#1f1315',
                      border: '1px solid #7f1d1d',
                      borderRadius: '6px',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#fca5a5', marginBottom: '4px' }}>
                      PRODUCTION ENGINE TRAP:
                    </div>
                    <div style={{ fontSize: '12px', color: '#fecaca', lineHeight: 1.45 }}>
                      {activeInfo.engineGotcha}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab 2: Relaxed Binding Engine */}
      {activeTab === 'relaxed_binding' && (
        <div>
          <div style={{ marginBottom: '14px', fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.5 }}>
            Unix shells only allow alphanumeric characters and underscores in environment variables. Spring Boot's{' '}
            <code style={{ color: '#34d399', background: '#0f172a' }}>RelaxedNames</code> algorithm maps canonical YAML keys
            to OS environment variables automatically.
          </div>

          <div
            style={{
              background: '#0c0e17',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '16px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', color: '#38bdf8' }}>Canonical Property (YAML / Code)</th>
                  <th style={{ padding: '10px 14px', color: '#34d399' }}>OS Environment Variable (Linux / K8s)</th>
                  <th style={{ padding: '10px 14px', color: '#fbbf24' }}>Relaxed Conversion Rule</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    yaml: 'spring.datasource.url',
                    env: 'SPRING_DATASOURCE_URL',
                    rule: 'Dots (.) convert to underscores (_); uppercase applied',
                  },
                  {
                    yaml: 'spring.main.banner-mode',
                    env: 'SPRING_MAIN_BANNERMODE or SPRING_MAIN_BANNER_MODE',
                    rule: 'Dashes (-) can be stripped or converted to underscores',
                  },
                  {
                    yaml: 'app.service-timeout-ms',
                    env: 'APP_SERVICETIMEOUTMS or APP_SERVICE_TIMEOUT_MS',
                    rule: 'Kebab-case words mapped to snake_case or collapsed uppercase',
                  },
                  {
                    yaml: 'app.servers[0].host',
                    env: 'APP_SERVERS_0_HOST',
                    rule: 'Bracket index [N] converted to _N_ underscore boundary',
                  },
                  {
                    yaml: 'app.security.oauth2.client-secret',
                    env: 'APP_SECURITY_OAUTH2_CLIENTSECRET',
                    rule: 'Deeply nested dot and dash chains collapsed to standard Unix env',
                  },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#93c5fd' }}>{row.yaml}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#86efac' }}>{row.env}</td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{row.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: '12px 16px',
              background: '#131b2e',
              border: '1px solid #1d4ed8',
              borderRadius: '8px',
              fontSize: '12.5px',
              lineHeight: 1.5,
              color: '#bfdbfe',
            }}
          >
            <strong>Under-the-Hood Truth:</strong> When loading an environment variable like{' '}
            <code style={{ color: '#86efac' }}>SPRING_DATASOURCE_URL</code>, Spring Boot's{' '}
            <code style={{ color: '#93c5fd' }}>SystemEnvironmentPropertySource</code> normalizes both keys before matching.
            It performs exact matches first, followed by underscore-separated token decomposition to bind seamlessly to{' '}
            <code style={{ color: '#fcd34d' }}>@ConfigurationProperties</code> classes.
          </div>
        </div>
      )}

      {/* Tab 3: Profile Overrides & Cascading */}
      {activeTab === 'profile_cascade' && (
        <div>
          <div style={{ marginBottom: '14px', fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.5 }}>
            Visualizing how a single property (<code style={{ color: '#38bdf8' }}>server.port</code> and{' '}
            <code style={{ color: '#34d399' }}>app.timeout</code>) cascades across configuration tiers during runtime
            initialization.
          </div>

          {/* Flow Pipeline SVG */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ marginBottom: '16px' }}>
            <svg
              viewBox="0 0 920 180"
              className="interactive-diagram-svg"
              style={{ minHeight: '180px', background: '#0d0f1e', borderRadius: '8px' }}
              role="img"
              aria-label="Profile property resolution cascade flow"
            >
              <defs>
                <marker
                  id="arrow-cascade"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
                </marker>
              </defs>

              {/* Connecting Conduits */}
              <line x1="200" y1="90" x2="250" y2="90" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="430" y1="90" x2="480" y2="90" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="660" y1="90" x2="710" y2="90" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-cascade)" />

              {/* Box 1: Base application.yml */}
              <g>
                <rect x="20" y="40" width="180" height="100" rx="8" fill="#131b2e" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="110" y="65" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="700">
                  1. Base File
                </text>
                <text x="110" y="85" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                  application.yml
                </text>
                <text x="110" y="110" textAnchor="middle" fill="#f8fafc" fontSize="11" fontFamily="monospace">
                  timeout: 5000ms
                </text>
                <text x="110" y="125" textAnchor="middle" fill="#f8fafc" fontSize="11" fontFamily="monospace">
                  port: 8080
                </text>
              </g>

              {/* Box 2: Profile application-prod.yml */}
              <g>
                <rect x="250" y="40" width="180" height="100" rx="8" fill="#131b2e" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="340" y="65" textAnchor="middle" fill="#a78bfa" fontSize="13" fontWeight="700">
                  2. Active Profile
                </text>
                <text x="340" y="85" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                  application-prod.yml
                </text>
                <text x="340" y="110" textAnchor="middle" fill="#34d399" fontSize="11" fontFamily="monospace">
                  timeout: 10000ms ⬆
                </text>
                <text x="340" y="125" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">
                  (port inherited: 8080)
                </text>
              </g>

              {/* Box 3: OS Environment Variables */}
              <g>
                <rect x="480" y="40" width="180" height="100" rx="8" fill="#131b2e" stroke="#34d399" strokeWidth="1.5" />
                <text x="570" y="65" textAnchor="middle" fill="#34d399" fontSize="13" fontWeight="700">
                  3. OS Environment
                </text>
                <text x="570" y="85" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                  export SERVER_PORT
                </text>
                <text x="570" y="110" textAnchor="middle" fill="#f87171" fontSize="11" fontFamily="monospace">
                  SERVER_PORT=9000 ⬆
                </text>
                <text x="570" y="125" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">
                  (timeout stays: 10000)
                </text>
              </g>

              {/* Box 4: Final Resolved Runtime State */}
              <g>
                <rect x="710" y="30" width="190" height="120" rx="8" fill="#0f291e" stroke="#34d399" strokeWidth="2" />
                <text x="805" y="55" textAnchor="middle" fill="#34d399" fontSize="14" fontWeight="800">
                  Final Resolved Beans
                </text>
                <text x="805" y="75" textAnchor="middle" fill="#86efac" fontSize="11" fontFamily="monospace">
                  Environment PropertyBag
                </text>
                <text x="805" y="105" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="monospace">
                  port = 9000 (Env)
                </text>
                <text x="805" y="125" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="monospace">
                  timeout = 10000 (Prod)
                </text>
              </g>
            </svg>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '12.5px',
            }}
          >
            <div
              style={{
                background: '#0c0e17',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '6px' }}>
                Profile Groups (Spring Boot 2.4+)
              </div>
              <div style={{ color: '#cbd5e1', lineHeight: 1.45 }}>
                Instead of managing individual profiles across dozens of pods, define logical profile groups in{' '}
                <code style={{ color: '#34d399' }}>application.yml</code>:
                <pre
                  style={{
                    background: '#05070d',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    marginTop: '6px',
                    color: '#93c5fd',
                  }}
                >
                  <code>
                    {'spring:\n  profiles:\n    group:\n      prod: [proddb, prodmetrics, prodvault]'}
                  </code>
                </pre>
              </div>
            </div>

            <div
              style={{
                background: '#0c0e17',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ color: '#f87171', fontWeight: 700, marginBottom: '6px' }}>
                The Silent Localhost Default Disaster
              </div>
              <div style={{ color: '#cbd5e1', lineHeight: 1.45 }}>
                Writing <code style={{ color: '#fca5a5' }}>db.host: {'${DB_HOST:localhost}'}</code> in production YAML
                silently masks missing Kubernetes secret bindings. When <code style={{ color: '#fca5a5' }}>DB_HOST</code> fails
                to mount, the pod connects to its own local container loopback and crashes after minutes of hidden timeouts!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: @Value vs @ConfigurationProperties */}
      {activeTab === 'type_safe_props' && (
        <div>
          <div style={{ marginBottom: '14px', fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.5 }}>
            Why Senior Software Engineers and Principal Architects replace{' '}
            <code style={{ color: '#f87171' }}>@Value</code> with validated{' '}
            <code style={{ color: '#34d399' }}>@ConfigurationProperties</code> records in production systems.
          </div>

          <div
            style={{
              background: '#0c0e17',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '16px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', color: '#cbd5e1' }}>Architectural Dimension</th>
                  <th style={{ padding: '10px 14px', color: '#f87171' }}>Field-Level @Value</th>
                  <th style={{ padding: '10px 14px', color: '#34d399' }}>@ConfigurationProperties (Records)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    dim: 'Fail-Fast Validation',
                    value: '❌ None (Runtime NullPointerException on access)',
                    configProps: '✅ JSR-380 (@NotNull, @Min, @Valid) fails fast on boot',
                  },
                  {
                    dim: 'Relaxed Binding',
                    value: '❌ Rigid (Exact string match required)',
                    configProps: '✅ Full (kebab-case, camelCase, snake_case, env vars)',
                  },
                  {
                    dim: 'Complex Data Structures',
                    value: '❌ Painful (Manual parsing for maps, lists, nested objects)',
                    configProps: '✅ Hierarchical (Nested records, typed lists, maps)',
                  },
                  {
                    dim: 'Type Coercion',
                    value: '⚠️ Basic strings and primitives only',
                    configProps: '✅ Rich types (java.time.Duration, DataSize, Enums)',
                  },
                  {
                    dim: 'IDE Autocomplete',
                    value: '❌ None (Untyped magic string placeholders)',
                    configProps: '✅ Full via spring-boot-configuration-processor',
                  },
                  {
                    dim: 'Immutability & Safety',
                    value: '⚠️ Mutable fields or verbose constructor injection',
                    configProps: '✅ Pure immutable Java 17+ records',
                  },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f1f5f9' }}>{row.dim}</td>
                    <td style={{ padding: '10px 14px', color: '#fca5a5' }}>{row.value}</td>
                    <td style={{ padding: '10px 14px', color: '#86efac' }}>{row.configProps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              background: '#0d1322',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '14px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
              PRODUCTION ARCHITECTURAL PATTERN (Spring Boot 3 + Java Record):
            </div>
            <pre
              style={{
                margin: 0,
                padding: '10px 12px',
                background: '#05070d',
                borderRadius: '6px',
                border: '1px solid #1e293b',
                color: '#e2e8f0',
                fontSize: '11.5px',
                overflowX: 'auto',
                lineHeight: 1.45,
              }}
            >
              <code>
                {'@Validated\n@ConfigurationProperties(prefix = "app.payment")\npublic record PaymentProperties(\n    @NotBlank String gatewayUrl,\n    @Min(100) @Max(30000) int timeoutMs,\n    @NotNull Duration connectionTimeout,\n    RetryPolicy retry\n) {\n    public record RetryPolicy(@Positive int maxAttempts, Duration backoff) {}\n}'}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
