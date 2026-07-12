import React, { useState } from 'react';

interface FileNode {
  name: string;
  isFolder: boolean;
  color: string;
  desc: string;
  code?: string;
  children?: FileNode[];
}

const STARTER_TREE: FileNode = {
  name: 'my-service-spring-boot-starter',
  isFolder: true,
  color: '#34d399',
  desc: 'The custom starter root folder. Starter package modules contain autoconfiguration code and configurations.',
  children: [
    {
      name: 'src/main/java',
      isFolder: true,
      color: '#38bdf8',
      desc: 'Contains compiled Java autoconfiguration files and custom logic properties.',
      children: [
        {
          name: 'MyServiceAutoConfiguration.java',
          isFolder: false,
          color: '#38bdf8',
          desc: 'Declares automatic bean definitions conditional on target class presences or missing beans.',
          code: `@AutoConfiguration\n@ConditionalOnClass(MyService.class)\n@EnableConfigurationProperties(MyServiceProperties.class)\npublic class MyServiceAutoConfiguration {\n\n    @Bean\n    @ConditionalOnMissingBean\n    public MyService myService(MyServiceProperties props) {\n        return new MyService(props.getApiKey());\n    }\n}`,
        },
        {
          name: 'MyServiceProperties.java',
          isFolder: false,
          color: '#a78bfa',
          desc: 'Binds yaml properties with prefix key to configuration fields.',
          code: `@ConfigurationProperties(prefix = "my.service")\npublic class MyServiceProperties {\n    private String apiKey;\n    private int timeout = 5000;\n\n    // Getters and Setters\n    public String getApiKey() { return apiKey; }\n    public void setApiKey(String key) { this.apiKey = key; }\n    public int getTimeout() { return timeout; }\n    public void setTimeout(int t) { this.timeout = t; }\n}`,
        },
      ],
    },
    {
      name: 'src/main/resources',
      isFolder: true,
      color: '#fbbf24',
      desc: 'Contains starter resources and boot bootstrap configuration registry imports.',
      children: [
        {
          name: 'META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports',
          isFolder: false,
          color: '#f472b6',
          desc: 'Modern Spring Boot 2.7+ / 3.x registry list declaring the target autoconfiguration classes.',
          code: `# Auto-Configuration class to load on context refresh\ncom.example.autoconfigure.MyServiceAutoConfiguration`,
        },
      ],
    },
  ],
};

export default function SpringBootCustomStarterDiagram(): React.JSX.Element {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>({
    name: 'MyServiceAutoConfiguration.java',
    isFolder: false,
    color: '#38bdf8',
    desc: 'Declares automatic bean definitions conditional on target class presences or missing beans.',
    code: `@AutoConfiguration\n@ConditionalOnClass(MyService.class)\n@EnableConfigurationProperties(MyServiceProperties.class)\npublic class MyServiceAutoConfiguration {\n\n    @Bean\n    @ConditionalOnMissingBean\n    public MyService myService(MyServiceProperties props) {\n        return new MyService(props.getApiKey());\n    }\n}`,
  });

  function renderTree(node: FileNode, depth = 0) {
    const isSelected = selectedNode?.name === node.name;
    return (
      <div key={node.name} style={{ marginLeft: `${depth * 14}px` }}>
        <div
          onClick={() => setSelectedNode(node)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
            background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
            margin: '2px 0',
          }}
        >
          <span style={{ fontSize: '11.5px' }}>{node.isFolder ? '📁' : '📄'}</span>
          <span style={{
            fontSize: '11px', fontFamily: 'monospace', fontWeight: 600,
            color: node.isFolder ? 'var(--ifm-color-content-secondary)' : node.color,
          }}>
            {node.name.split('/').pop()}
          </span>
        </div>
        {node.children && node.children.map(child => renderTree(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
        <span>Custom Starter Directory Structure Explorer</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
        
        {/* Tree List */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          {renderTree(STARTER_TREE)}
        </div>

        {/* Detail Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: selectedNode ? 'flex-start' : 'center',
        }}>
          {selectedNode ? (
            <div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: selectedNode.color, fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
                {selectedNode.name.split('/').pop()}
              </span>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, marginBottom: '12px' }}>
                {selectedNode.desc}
              </p>

              {selectedNode.code && (
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: selectedNode.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Code / Config Content
                  </div>
                  <pre style={{
                    fontFamily: 'monospace', fontSize: '10px', margin: 0,
                    background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px',
                    color: '#e2e8f0', overflowX: 'auto', maxHeight: '180px',
                  }}>
                    {selectedNode.code}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '12.5px' }}>
              💡 Click on files inside the folder structure to view code implementation patterns.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
