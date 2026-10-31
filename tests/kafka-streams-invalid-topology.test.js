const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const babel = require('@babel/core');

const DOC = 'docs/technical-knowledge/kafka/streams/invalid-topology-updates.md';
const DIAGRAM = 'src/components/KafkaStreamsInvalidTopologyDiagram.tsx';

describe('Kafka Streams Invalid Topology & Update Order Documentation & Invariants', () => {
  const content = fs.readFileSync(DOC, 'utf-8');

  it('must have valid frontmatter and be registered in sidebars.ts', () => {
    assert.ok(/\nid: invalid-topology-updates\n/.test(content), 'Missing id frontmatter');
    assert.ok(/\ntitle: "?Kafka Streams — Invalid Topology/.test(content), 'Missing title frontmatter');
    const sidebar = fs.readFileSync('sidebars.ts', 'utf-8');
    assert.ok(
      sidebar.includes("'technical-knowledge/kafka/streams/invalid-topology-updates'"),
      'Must be registered in sidebars.ts'
    );
  });

  it('must cover physical engine mechanics, error types, and core invariants', () => {
    const requiredKeywords = [
      'TopologyException',
      'AtomicInteger',
      'KSTREAM-',
      'Named.as',
      'Materialized.as',
      'TaskId',
      'StreamsPartitionAssignor',
      'application.id',
      'Blue-Green',
      'kafka-streams-application-reset',
      'RocksDB',
      'CooperativeStickyAssignor'
    ];
    for (const kw of requiredKeywords) {
      assert.ok(content.includes(kw), `Document is missing essential keyword: ${kw}`);
    }
  });

  it('must include the Senior/Staff Interview Playbook with at least 4 classic traps and cheat sheet', () => {
    assert.ok(
      content.includes('## 🧠 Senior/Staff Interview Playbook: How to Ace Kafka Streams Topology Evolution & Invalid Topology Interviews'),
      'Missing Senior/Staff Interview Playbook header'
    );
    const trapMatches = content.match(/#### Trap \d/g) || [];
    assert.ok(trapMatches.length >= 4, `Expected at least 4 traps, found ${trapMatches.length}`);
    assert.ok(
      content.includes('| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |'),
      'Missing candidate comparison table'
    );
  });

  it('must import KafkaStreamsInvalidTopologyDiagram and have balanced code fences', () => {
    assert.ok(
      content.includes("import KafkaStreamsInvalidTopologyDiagram from '@site/src/components/KafkaStreamsInvalidTopologyDiagram';"),
      'Missing component import'
    );
    assert.ok(fs.existsSync(DIAGRAM), `Diagram component does not exist at ${DIAGRAM}`);
    const fences = content.match(/^```/gm) || [];
    assert.strictEqual(fences.length % 2, 0, `Unbalanced code fences found (${fences.length})`);
  });

  it('must transpile KafkaStreamsInvalidTopologyDiagram.tsx cleanly with Babel', () => {
    const diagramCode = fs.readFileSync(DIAGRAM, 'utf-8');
    assert.doesNotThrow(() => {
      babel.transformSync(diagramCode, {
        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
        filename: 'KafkaStreamsInvalidTopologyDiagram.tsx'
      });
    }, 'Failed to transpile KafkaStreamsInvalidTopologyDiagram.tsx');
  });
});

