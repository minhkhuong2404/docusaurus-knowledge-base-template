const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers, validateJsxEntities } = require('./helpers/transpileHelper');

describe('Java Advanced Architecture & Deep-Dive Suite', () => {
  const diagramPath = 'src/components/JavaObjectLayoutDiagram.tsx';

  const separatedJavaPages = [
    {
      path: 'docs/technical-knowledge/java/java-object-layout-memory.md',
      sidebarId: 'technical-knowledge/java/java-object-layout-memory',
      expectedKeywords: ['Mark Word', 'Compressed OOPs', 'Alignment Padding', 'Contended', 'False Sharing', 'JavaObjectLayoutDiagram']
    },
    {
      path: 'docs/technical-knowledge/java/java-classloaders-metaspace.md',
      sidebarId: 'technical-knowledge/java/java-classloaders-metaspace',
      expectedKeywords: ['Bootstrap ClassLoader', 'Parent-First', 'Child-First', 'Metaspace', 'ThreadLocal']
    },
    {
      path: 'docs/technical-knowledge/java/java-dynamic-bytecode-agents.md',
      sidebarId: 'technical-knowledge/java/java-dynamic-bytecode-agents',
      expectedKeywords: ['invokevirtual', 'invokedynamic', 'Bootstrap Method', 'Byte Buddy', 'Instrumentation']
    },
    {
      path: 'docs/technical-knowledge/java/java-lock-free-varhandle.md',
      sidebarId: 'technical-knowledge/java/java-lock-free-varhandle',
      expectedKeywords: ['Lock-Free', 'CMPXCHG', 'ABA Problem', 'AtomicStampedReference', 'VarHandle']
    },
    {
      path: 'docs/technical-knowledge/java/java-lmax-disruptor.md',
      sidebarId: 'technical-knowledge/java/java-lmax-disruptor',
      expectedKeywords: ['Disruptor', 'RingBuffer', 'Single-Writer', 'Wait Strategies', 'ArrayBlockingQueue']
    },
    {
      path: 'docs/technical-knowledge/java/java-jit-compiler.md',
      sidebarId: 'technical-knowledge/java/java-jit-compiler',
      expectedKeywords: ['Tiered Compilation', 'C1', 'C2', 'Escape Analysis', 'Scalar Replacement', 'Inlining', 'Deoptimization']
    },
    {
      path: 'docs/technical-knowledge/java/java-graalvm-aot.md',
      sidebarId: 'technical-knowledge/java/java-graalvm-aot',
      expectedKeywords: ['GraalVM', 'Native Image', 'Closed World Assumption', 'Substrate VM', 'reflect-config']
    },
    {
      path: 'docs/technical-knowledge/java/java-serialization-security.md',
      sidebarId: 'technical-knowledge/java/java-serialization-security',
      expectedKeywords: ['serialVersionUID', 'Gadget Chains', 'ObjectInputFilter', 'InvokerTransformer']
    },
    {
      path: 'docs/technical-knowledge/java/java-zero-copy-serialization.md',
      sidebarId: 'technical-knowledge/java/java-zero-copy-serialization',
      expectedKeywords: ['Protobuf', 'FlatBuffers', 'Zero-Copy', 'Direct ByteBuffers', 'SBE']
    },
    {
      path: 'docs/technical-knowledge/java/java-gc-g1-deep-dive.md',
      sidebarId: 'technical-knowledge/java/java-gc-g1-deep-dive',
      expectedKeywords: ['Garbage-First', 'G1HeapDiagram', 'Humongous', 'SATB', 'Card Table']
    },
    {
      path: 'docs/technical-knowledge/java/java-gc-zgc-generational.md',
      sidebarId: 'technical-knowledge/java/java-gc-zgc-generational',
      expectedKeywords: ['ZGC', 'Generational ZGC', 'Colored Pointers', 'Load Barriers', 'mmap']
    }
  ];

  it('JavaObjectLayoutDiagram.tsx should exist and transpile cleanly', () => {
    assert.ok(fs.existsSync(diagramPath), `${diagramPath} must exist`);
    const code = transpileCode(diagramPath);
    assert.ok(code && code.length > 100, 'Transpiled diagram code must not be empty');
  });

  it('JavaObjectLayoutDiagram.tsx should have 0 undeclared runtime identifiers', () => {
    const undeclared = getUndeclaredIdentifiers(diagramPath);
    assert.deepStrictEqual(
      undeclared,
      [],
      `Diagram has undeclared identifiers: ${undeclared.join(', ')}`
    );
  });

  it('JavaObjectLayoutDiagram.tsx should have valid JSX character escaping', () => {
    const unescaped = validateJsxEntities(diagramPath);
    assert.deepStrictEqual(
      unescaped,
      [],
      `Diagram contains unescaped JSX text: ${JSON.stringify(unescaped)}`
    );
  });

  it('all 11 separated Java markdown pages must exist on disk with substantial content', () => {
    for (const page of separatedJavaPages) {
      assert.ok(fs.existsSync(page.path), `Java page must exist: ${page.path}`);
      const content = fs.readFileSync(page.path, 'utf8');
      assert.ok(content.length > 500, `Java page ${page.path} must contain substantive technical content`);
    }
  });

  it('each separated Java page must contain required technical concepts and keywords', () => {
    for (const page of separatedJavaPages) {
      const content = fs.readFileSync(page.path, 'utf8');
      for (const kw of page.expectedKeywords) {
        assert.ok(
          content.includes(kw),
          `Page ${page.path} is missing expected keyword: "${kw}"`
        );
      }
    }
  });

  it('java-gc.md must contain Tri-Color Marking and Generational ZGC concepts', () => {
    const gcDocPath = 'docs/technical-knowledge/java/java-gc.md';
    assert.ok(fs.existsSync(gcDocPath), 'java-gc.md must exist');
    const content = fs.readFileSync(gcDocPath, 'utf8');

    assert.ok(content.includes('Tri-Color Marking'), 'java-gc.md must cover Tri-Color Marking');
    assert.ok(content.includes('SATB'), 'java-gc.md must cover SATB write barrier');
    assert.ok(content.includes('ZGC Colored Pointers'), 'java-gc.md must cover ZGC Colored Pointers');
    assert.ok(content.includes('Generational ZGC'), 'java-gc.md must cover Generational ZGC');
  });

  it('sidebars.ts must register all 11 separated Java documents in their respective categories', () => {
    const sidebarContent = fs.readFileSync('sidebars.ts', 'utf8');
    for (const page of separatedJavaPages) {
      assert.ok(
        sidebarContent.includes(page.sidebarId),
        `sidebars.ts must register document id: ${page.sidebarId}`
      );
    }
  });

  it('all separated Java markdown documents must compile with 0 undeclared identifiers in MDX (prevents k is not defined)', async () => {
    const mdx = require('@mdx-js/mdx');
    const remarkMath = (await import('remark-math')).default;
    const rehypeKatex = (await import('rehype-katex')).default;
    const babel = require('@babel/core');
    const traverse = require('@babel/traverse').default;

    for (const page of separatedJavaPages) {
      const raw = fs.readFileSync(page.path, 'utf8');
      const withoutFm = raw.replace(/^---[\s\S]*?---/, '');
      const res = await mdx.compile(withoutFm, {
        remarkPlugins: [remarkMath],
        rehypePlugins: [[rehypeKatex, { strict: false }]]
      });

      const ast = babel.parseSync(String(res.value), {
        filename: 'doc.jsx',
        presets: ['@babel/preset-react']
      });

      const undeclared = [];
      traverse(ast, {
        Identifier(p) {
          if (
            p.isReferencedIdentifier() &&
            !p.scope.hasBinding(p.node.name) &&
            ![
              'React',
              '_jsx',
              '_jsxs',
              '_Fragment',
              '_components',
              'JavaObjectLayoutDiagram',
              'G1HeapDiagram'
            ].includes(p.node.name) &&
            !globalThis[p.node.name]
          ) {
            undeclared.push(p.node.name);
          }
        }
      });

      assert.deepStrictEqual(
        undeclared,
        [],
        `Document ${page.path} has undeclared runtime identifiers: ${undeclared.join(', ')}`
      );
    }
  });
});
