const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('Kubernetes Networking Deep Dive & Reddit Outage Postmortem Suite', () => {
  const k8sNetDocPath = path.resolve(__dirname, '../docs/technical-knowledge/system-design/kubernetes-networking.md');
  const k8sFundDocPath = path.resolve(__dirname, '../docs/technical-knowledge/devops/07-kubernetes-fundamentals.md');
  const calicoDiagramPath = path.resolve(__dirname, '../src/components/KubernetesCalicoBgpDiagram.tsx');

  it('Kubernetes Networking documentation must contain Calico BGP internals and Reddit Pi Day postmortem', () => {
    assert.ok(fs.existsSync(k8sNetDocPath), 'kubernetes-networking.md must exist');
    const content = fs.readFileSync(k8sNetDocPath, 'utf8');

    // Calico internals
    assert.match(content, /Felix/i, 'Must cover Felix Linux kernel programmer');
    assert.match(content, /BIRD/i, 'Must cover BIRD BGP daemon');
    assert.match(content, /calico-ipam/i, 'Must cover Calico IPAM');
    assert.match(content, /TCP 179/i, 'Must mention BGP port TCP 179');

    // Route Reflectors vs Full Mesh
    assert.match(content, /Full-Mesh/i, 'Must discuss full-mesh BGP');
    assert.match(content, /Route Reflector/i, 'Must cover BGP Route Reflectors');
    assert.match(content, /(?:frac\{N\(N\s*-\s*1\)\}\{2\}|N\s*\(\s*N\s*-\s*1\s*\)\s*\/\s*2)/, 'Must include mathematical formula for full-mesh sessions');

    // Reddit Pi Day 314-minute Outage
    assert.match(content, /Reddit/i, 'Must cover Reddit Pi Day outage');
    assert.match(content, /314/i, 'Must mention the 314 minutes outage duration');
    assert.match(content, /node-role\.kubernetes\.io\/master/i, 'Must document the deprecated master label');
    assert.match(content, /node-role\.kubernetes\.io\/control-plane/i, 'Must document the replacement control-plane label');
    assert.match(content, /peerSelector/i, 'Must document the Calico peerSelector zero-match failure');

    // Rollback Fallacy & Staged Ramp-up
    assert.match(content, /Rollback Fallacy/i, 'Must explain why K8s clusters cannot be downgraded');
    assert.match(content, /etcd.*storage version/i, 'Must explain etcd schema storage version lock-in');
    assert.match(content, /thundering herd/i, 'Must explain thundering herd and cache stampede risk');
    assert.match(content, /1\\?%.*5\\?%.*10\\?%.*100\\?%/i, 'Must document staged traffic ramp-up');

    // Senior Playbook requirements
    assert.match(content, /## 🧠 Senior\/Staff Interview Playbook: How to Ace Kubernetes Networking & Production Outage Interviews/, 'Must include dedicated playbook header');
    assert.match(content, /The Senior Framing Strategy/i, 'Must include senior framing strategy');
    assert.match(content, /Trap 1:/i, 'Must include Trap 1');
    assert.match(content, /Trap 2:/i, 'Must include Trap 2');
    assert.match(content, /Trap 3:/i, 'Must include Trap 3');
    assert.match(content, /Trap 4:/i, 'Must include Trap 4');
    assert.match(content, /Principal Candidate Demonstrates/i, 'Must include candidate cheat sheet table');

    // Diagram integration
    assert.match(content, /<KubernetesCalicoBgpDiagram/i, 'Must integrate KubernetesCalicoBgpDiagram component');
  });

  it('Kubernetes Fundamentals must contain Senior Playbook and decoupled control plane insights', () => {
    assert.ok(fs.existsSync(k8sFundDocPath), '07-kubernetes-fundamentals.md must exist');
    const content = fs.readFileSync(k8sFundDocPath, 'utf8');

    assert.match(content, /## 🧠 Senior\/Staff Interview Playbook: How to Ace Kubernetes Architecture & Control Plane Interviews/, 'Must include fundamentals playbook header');
    assert.match(content, /Level-Triggered/i, 'Must emphasize level-triggered reconciliation');
    assert.match(content, /Principal Candidate Demonstrates/i, 'Must include cheat sheet table');
  });

  it('KubernetesCalicoBgpDiagram component must exist and contain essential interactive tabs', () => {
    assert.ok(fs.existsSync(calicoDiagramPath), 'KubernetesCalicoBgpDiagram.tsx must exist');
    const content = fs.readFileSync(calicoDiagramPath, 'utf8');

    assert.match(content, /calico_node/, 'Must contain calico_node tab');
    assert.match(content, /bgp_topology/, 'Must contain bgp_topology tab');
    assert.match(content, /reddit_outage/, 'Must contain reddit_outage tab');
    assert.match(content, /interactive-diagram-container/, 'Must use mandatory interactive-diagram-container wrapper');
  });
});
