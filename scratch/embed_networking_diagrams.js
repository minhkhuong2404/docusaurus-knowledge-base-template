const fs = require('fs');

const mapping = [
  { file: 'docs/technical-knowledge/networking/index.md', components: ['NetworkIndexOverviewDiagram', 'NetworkPacketEncapsulationDiagram'] },
  { file: 'docs/technical-knowledge/networking/socket-programming-io-models.md', components: ['SocketIoModelsDiagram', 'SocketLifecycleDiagram'] },
  { file: 'docs/technical-knowledge/networking/dns-resolution.md', components: ['DnsResolutionFlowDiagram', 'DnsRecordTypesDiagram'] },
  { file: 'docs/technical-knowledge/networking/application-protocols-reference.md', components: ['ApplicationProtocolsDiagram', 'GrpcVsRestDiagram'] },
  { file: 'docs/technical-knowledge/networking/proxies-nat-firewalls.md', components: ['ProxiesNatFirewallsDiagram', 'NatTraversalDiagram'] },
  { file: 'docs/technical-knowledge/networking/network-security.md', components: ['NetworkSecurityProtocolsDiagram', 'DdosMitigationDiagram'] },
  { file: 'docs/technical-knowledge/networking/api-authentication-security.md', components: ['ApiAuthSecurityDiagram', 'CorsProtocolDiagram'] },
  { file: 'docs/technical-knowledge/networking/network-performance-optimization.md', components: ['NetworkPerformanceOptimizationDiagram', 'CdnEdgeArchitectureDiagram'] },
  { file: 'docs/technical-knowledge/networking/network-troubleshooting-tools.md', components: ['NetworkTroubleshootingToolsDiagram', 'TcpdumpPacketAnalysisDiagram'] },
  { file: 'docs/technical-knowledge/networking/networking-interview-questions.md', components: ['NetworkingInterviewScenariosDiagram', 'TcpStateTransitionDiagram'] },
];

mapping.forEach(({ file, components }) => {
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(file, 'utf8');

  // Build imports and tags
  const newImports = components.map(c => `import ${c} from '@site/src/components/${c}';`).join('\n');
  const newTags = components.map(c => `<${c} />`).join('\n\n');

  const parts = content.split('---');
  if (parts.length >= 3) {
    const frontmatter = `---${parts[1]}---\n\n` + newImports + '\n\n';
    let rest = parts.slice(2).join('---');

    const h1Match = rest.match(/#\s+[^\n]+\n/);
    if (h1Match) {
      const titleIndex = rest.indexOf(h1Match[0]) + h1Match[0].length;
      rest = rest.slice(0, titleIndex) + '\n' + newTags + '\n\n---\n\n' + rest.slice(titleIndex);
    } else {
      rest = newTags + '\n\n' + rest;
    }

    fs.writeFileSync(file, frontmatter + rest, 'utf8');
    console.log(`Successfully embedded ${components.join(', ')} into ${file}`);
  }
});
