import React, { useState, useEffect } from 'react';

type Step = {
  id: number;
  title: string;
  shortLabel: string;
  color: string;
  lead: string;
  underTheHood: string[];
  failureModes: string[];
  leadGotchas: string[];
  flags?: string[];
};

const STEPS: Step[] = [
  {
    id: 0,
    title: '1. Source (.java)',
    shortLabel: 'Source',
    color: '#38bdf8',
    lead: 'Source is a language artifact, not an executable. The JVM never reads .java — only bytecode. A lead separates compile-time contracts (types, checked exceptions, overload resolution) from runtime dispatch (overrides, reflection, class loading).',
    underTheHood: [
      'javac enforces the JLS language rules; it does not emit native machine code for the target OS.',
      'Generics erase to raw types / bridges; the .class file already reflects erasure.',
      'Annotations with RUNTIME retention survive into attributes the JVM can reflect later.',
    ],
    failureModes: [
      'Compile errors never reach production — wrong problem space if you debug them as runtime.',
      'Source/binary mismatch (recompile half a module) surfaces later as VerifyError or NoSuchMethodError.',
    ],
    leadGotchas: [
      'Overload selection is compile-time; override selection is runtime — mixing them in interviews is a red flag.',
      'Checked exceptions are a language/compiler concern; the JVM only sees Throwable types on the method descriptor.',
    ],
  },
  {
    id: 1,
    title: '2. javac Compile',
    shortLabel: 'javac',
    color: '#fbbf24',
    lead: 'javac produces a class file (major/minor version + constant pool + method bytecode). Portability means the same .class runs on any compatible HotSpot/OpenJDK — not that every JDK can load every newer class-file version.',
    underTheHood: [
      'Constant pool stores literals, class/method/field symbolic refs used later during linking.',
      'Method bodies are JVM opcodes (iload, invokevirtual, new, …) plus StackMapTable for the verifier.',
      'Target release (-source/-target/--release) sets the class-file version the runtime must accept.',
    ],
    failureModes: [
      'UnsupportedClassVersionError: runtime JDK older than the class-file major version.',
      'Missing dependency at compile time ≠ missing at runtime — compile classpath and runtime classpath diverge in fat jars / shaded builds.',
    ],
    leadGotchas: [
      'CI compiling on JDK 21 then running on 17 is a classic pipeline bug — pin --release and the runtime image together.',
      'Annotation processors and Lombok change what bytecode you think you wrote; always inspect javap -c -p when behavior surprises.',
    ],
    flags: ['javac --release N', 'javap -c -p -v ClassName'],
  },
  {
    id: 2,
    title: '3. Bytecode (.class)',
    shortLabel: 'Bytecode',
    color: '#34d399',
    lead: 'Bytecode is the JVM ISA. It is type-checked by the verifier under stack-map constraints — not by the CPU. Interpreters and JITs both consume this representation; only JIT emits native code into the Code Cache.',
    underTheHood: [
      'Magic 0xCAFEBABE; sections: constant pool, fields, methods, attributes.',
      'invokevirtual / invokeinterface vs invokestatic / invokespecial encode dispatch strategy in the opcode.',
      'invokedynamic + bootstrap methods underpin lambdas and string concat — metafactory, not anonymous inner classes.',
    ],
    failureModes: [
      'VerifyError if bytecode violates type/control-flow constraints (corrupt class, bad agent, wrong tooling).',
      'Illegal bytecode from hand-rolled ASM/Javassist without stack maps fails at link time, not “later somehow”.',
    ],
    leadGotchas: [
      'Reading bytecode in an incident (javap / Arthas / async-profiler) beats guessing from source when AOP or agents rewrote the class.',
      'Same source can yield different bytecode across javac versions — pin the toolchain for reproducible builds.',
    ],
  },
  {
    id: 3,
    title: '4. Class Loading — Load',
    shortLabel: 'Load',
    color: '#a78bfa',
    lead: 'Loading finds the binary for a binary name, parses it into Metaspace metadata, and allocates a java.lang.Class mirror on the Heap. Identity is (name, defining ClassLoader) — same bytes under two loaders are two types.',
    underTheHood: [
      'Bootstrap / Platform / Application loaders (delegation model); custom loaders for plugins, Tomcat webapps, hot reload.',
      'defineClass parses the byte stream into InstanceKlass-style metadata in Metaspace; method bytecode lives there.',
      'A Class object on the Heap is the reflective mirror; the loader that defined the class is the defining loader.',
    ],
    failureModes: [
      'ClassNotFoundException: loadClass / Class.forName could not find the binary (checked-style API path).',
      'NoClassDefFoundError: class was present at compile time but missing or failed earlier init at runtime — often a linkage/init failure wrapped for the caller.',
    ],
    leadGotchas: [
      'ClassCastException across two loaders with “identical” FQCN — different runtime types; classic in app servers / OSGi.',
      'Leaking a webapp ClassLoader (ThreadLocal, static cache, undeployed pool) holds all its classes → Metaspace OOM after redeploys.',
    ],
    flags: ['-verbose:class', '-Xlog:class+load=info'],
  },
  {
    id: 4,
    title: '5. Class Loading — Link',
    shortLabel: 'Link',
    color: '#2dd4bf',
    lead: 'Linking makes a loaded class safe and usable: Verify → Prepare → Resolve. Prepare allocates static storage with defaults; it does not run your static initializers. Resolve turns symbolic constant-pool refs into direct references (often lazily on first use).',
    underTheHood: [
      'Verify: structural + type-safe bytecode; StackMapTable; rejects jumps out of bounds / bad operand stacks → VerifyError.',
      'Prepare: allocate static fields; set defaults (0 / null / false). static final compile-time constants may already be folded.',
      'Resolve: replace CONSTANT_* symbolic refs with concrete Method/Field/Class pointers; may trigger loading of referenced types.',
    ],
    failureModes: [
      'VerifyError — bad/unsupported bytecode or agent corruption.',
      'NoSuchMethodError / NoSuchFieldError / IllegalAccessError — resolve-time binary incompatibility after a dependency drift.',
      'AbstractMethodError / IncompatibleClassChangeError — hierarchy changed since compile.',
    ],
    leadGotchas: [
      'Prepare ≠ Init: static int x = 42 still shows 0 after prepare until <clinit> runs — interview trap.',
      'Lazy resolution means a missing dependency can blow up on first call path, not at class load — hard to catch in shallow smoke tests.',
      'When explaining Link, always name all three: verify, prepare, resolve — “link = verify” is incomplete.',
    ],
  },
  {
    id: 5,
    title: '6. Class Loading — Init',
    shortLabel: 'Init',
    color: '#34d399',
    lead: 'Initialization runs <clinit>: static field initializers and static {} blocks, under a class-init lock. The JMM gives a happens-before from end of <clinit> to any thread that uses the class — statics are safe to publish if init finished.',
    underTheHood: [
      'Triggered by: new, static get/put, static invoke, or certain reflective assert — not merely by loading.',
      'JVM runs <clinit> at most once per class; concurrent waiters block on the init lock.',
      'Superclass <clinit> runs before subclass <clinit>.',
    ],
    failureModes: [
      'ExceptionInInitializerError wrapping the root cause from <clinit>; subsequent use often becomes NoClassDefFoundError.',
      'Deadlock: class A’s <clinit> waits on B while B’s <clinit> waits on A.',
    ],
    leadGotchas: [
      'Heavy work / I/O / network in static {} = hidden latency on first request; prefer lazy holders or explicit startup hooks.',
      'Circular static init between classes yields default values mid-cycle — subtle production bugs.',
      'Enum constant construction runs during init; throwing there takes down the enum type for the process.',
    ],
  },
  {
    id: 6,
    title: '7. Heap & Stack Memory',
    shortLabel: 'Memory',
    color: '#8b5cf6',
    lead: 'Objects and arrays live on the shared GC-managed Heap. Each platform thread has a private JVM stack of frames (locals, operand stack, frame data), plus a PC register pointing at the current bytecode. Class metadata lives in the Method Area (Metaspace); JNI uses the native method stack. Leads size -Xmx for data and -Xss × thread count for stacks — containers die on RSS, not just heap.',
    underTheHood: [
      'Heap (shared): Eden / Survivor / Old (collector-dependent); object headers + references; GC roots include thread stacks.',
      'JVM Stack (per-thread): frames with local variable array, operand stack, and constant-pool linkage for the method.',
      'PC Register (per-thread): holds the bytecode instruction address currently executing (undefined / unused while in native code).',
      'Method Area / Metaspace (shared): class metadata, run-time constant pool, method bytecode — not the Java Heap.',
      'Native Method Stack (per-thread): frames for JNI / C/C++ code; separate from the Java VM stack.',
      'Escape analysis / scalar replacement can keep non-escaping allocations in registers/stack after JIT — allocation rate ≠ object count.',
    ],
    failureModes: [
      'OutOfMemoryError: Java heap space — live set or leak exceeded -Xmx.',
      'StackOverflowError — deep recursion / huge frames; OutOfMemoryError: unable to create native thread — too many stacks.',
      'OutOfMemoryError: Metaspace — classloader / metadata leak, not fixed by raising -Xmx alone.',
    ],
    leadGotchas: [
      'Virtual threads park continuations on the Heap — stack pressure model differs from 1MB platform stacks.',
      'Metaspace OOM is class metadata / loader leaks, not “need more -Xmx”.',
      'Always budget non-heap (metaspace, stacks, code cache, direct memory, PC is tiny) when setting k8s limits.',
      'Full clickable map of Heap / Stack / PC / Method Area / Native Stack: JVM Internals § Architecture.',
    ],
    flags: ['-Xms / -Xmx', '-Xss', '-XX:MaxMetaspaceSize', '-XX:MaxDirectMemorySize'],
  },
  {
    id: 7,
    title: '8. Interpreter (Tier 0)',
    shortLabel: 'Interpreter',
    color: '#38bdf8',
    lead: 'HotSpot starts in the interpreter: execute bytecode immediately with no compile delay. While running, it profiles invocation/backedge counts and type profiles (MDO) that feed tiered compilation.',
    underTheHood: [
      'Tier 0 = template/bytecode interpreter; correct and cold-start friendly.',
      'Invocation and loop backedge counters decide when to enqueue C1/C2 compiles.',
      'Profiling records receiver types for virtual calls — enables monomorphic inlining later.',
    ],
    failureModes: [
      'Staying interpreted under load (Code Cache full, compilation disabled) → CPU burns, latency climbs.',
      'Forced -Xint for debugging makes prod-like perf impossible — use only for isolation.',
    ],
    leadGotchas: [
      'Benchmarks without warmup measure interpreter + C1 noise, not steady-state C2.',
      'First requests after deploy are slower by design — readiness probes that only check “port open” lie about warmup.',
    ],
    flags: ['-Xint (interpret only)', '-XX:+PrintCompilation'],
  },
  {
    id: 8,
    title: '9. JIT — C1 / C2 Tiered',
    shortLabel: 'JIT',
    color: '#f97316',
    lead: 'Tiered compilation promotes hot methods: quick C1 compiles (tiers 1–3) then aggressive C2 (tier 4: inlining, unrolling, escape analysis). Native code lands in the Code Cache. Optimistic assumptions can deoptimize back to the interpreter when profiles break.',
    underTheHood: [
      'Tier 0: Interpreter → tiers 1–3: C1 (fast compile, light opts / profiling) → tier 4: C2 (heavy opts).',
      'Compiled nmethods stored in Code Cache; if full, further JIT stops and perf collapses.',
      'Deoptimization: uncommon trap / type profile change invalidates nmethod; execution resumes interpreted, may recompile.',
      'Compilation storm: many methods hit threshold together at startup → C2 queue backlog, CPU spike (classic k8s first-traffic problem).',
    ],
    failureModes: [
      'CodeCache OOM / full → JIT disabled; unexplained regression after deploy or under metaspace/code pressure.',
      'Deopt storms from megamorphic call sites or rare types → latency spikes after “warmup”.',
    ],
    leadGotchas: [
      'Autoscaling cold pods: traffic before C2 warmup = p99 cliff — use pre-warm, slower rollouts, or AOT/native for latency-critical paths.',
      'Polymorphic → megamorphic call sites kill inlining; design for stable concrete types on hot paths.',
      'Never tune CompileThreshold blindly in prod without PrintCompilation / compiler logs as evidence.',
    ],
    flags: [
      '-XX:+TieredCompilation (default)',
      '-XX:+PrintCompilation',
      '-XX:ReservedCodeCacheSize=…',
      '-XX:CompileThreshold=…',
    ],
  },
  {
    id: 9,
    title: '10. Running Application',
    shortLabel: 'App',
    color: '#2dd4bf',
    lead: 'Steady state is mixed mode: hot paths run as native nmethods; cold paths stay interpreted. Application threads drive business logic while GC, JIT compiler, and runtime helper threads share the process.',
    underTheHood: [
      'main / request threads execute linked, initialized classes; new types still load/link/init on demand.',
      'Serviceability: JFR, async-profiler, Arthas attach to the same HotSpot process.',
      'Container cgroup limits apply to the whole JVM RSS — heap is only one term in the equation.',
    ],
    failureModes: [
      'Warmup-sensitive SLOs fail on rolling deploy even when functional tests pass.',
      'Thread / FD / direct-memory exhaustion looks like “app hung” but is runtime resource, not business logic.',
    ],
    leadGotchas: [
      'Separate functional readiness from performance readiness when designing k8s probes.',
      'When latency regresses after a dependency bump, check binary compatibility (link errors) and JIT profiles — not only GC.',
    ],
  },
];

function nodeOpacity(activeStep: number | null, stepIndex: number): number {
  if (activeStep === null) return 0.88;
  if (stepIndex <= activeStep) return 1;
  return 0.28;
}

function edgeActive(activeStep: number | null, edgeStep: number): boolean {
  return activeStep !== null && activeStep >= edgeStep;
}

function Section({
  label,
  color,
  items,
}: {
  label: string;
  color: string;
  items: string[];
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color,
          marginBottom: '5px',
        }}
      >
        {label}
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: '16px',
          fontSize: '12px',
          color: 'var(--ifm-color-content-secondary)',
          lineHeight: 1.55,
        }}
      >
        {items.map((item) => (
          <li key={item} style={{ marginBottom: '4px' }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function JavaExecutionPipelineDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    if (!playing || animStep >= STEPS.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      setActiveStep(animStep);
      setAnimStep((s) => s + 1);
    }, 900);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  const handlePlay = () => {
    setActiveStep(null);
    setAnimStep(0);
    setPlaying(true);
  };

  const selectStep = (id: number) => {
    setPlaying(false);
    setActiveStep(activeStep === id ? null : id);
  };

  const selected = activeStep !== null ? STEPS[activeStep] : null;

  const edgeLit = (edgeStep: number, color: string) =>
    edgeActive(activeStep, edgeStep) ? color : 'rgba(255,255,255,0.12)';

  const jvmActive = activeStep !== null && activeStep >= 3 && activeStep <= 8;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .java-exec-pipeline-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Java Source → Bytecode → ClassLoader → JIT → Running App
        </span>
        <button
          onClick={handlePlay}
          disabled={playing}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            cursor: playing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '12px',
            background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)',
            color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8',
            boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '18px' }}>
        <div
          className="java-exec-pipeline-grid"
          style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '18px', alignItems: 'start' }}
        >
          <div>
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
              <svg viewBox="0 0 800 520" className="interactive-diagram-svg" style={{ width: '100%', height: 'auto' }}>
                <defs>
                  <marker id="jep-arr-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
                  </marker>
                  <marker id="jep-arr-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
                  </marker>
                  <marker id="jep-arr-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
                  </marker>
                  <marker id="jep-arr-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
                  </marker>
                  <marker id="jep-arr-teal" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" />
                  </marker>
                  <marker id="jep-arr-violet" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8b5cf6" />
                  </marker>
                  <marker id="jep-arr-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f97316" />
                  </marker>
                </defs>

                {/* Compile pipeline */}
                <g onClick={() => selectStep(0)} style={{ cursor: 'pointer', opacity: nodeOpacity(activeStep, 0), transition: 'opacity 0.35s' }}>
                  <rect x="24" y="28" width="120" height="58" rx="8" fill="rgba(56,189,248,0.10)" stroke="#38bdf8" strokeWidth={activeStep === 0 ? 2.4 : 1.5} />
                  <text x="84" y="52" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800">Source</text>
                  <text x="84" y="70" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10" fontFamily="monospace">Hello.java</text>
                </g>

                <path id="jep-e1" d="M 150 57 L 178 57" fill="none" stroke={edgeLit(1, '#fbbf24')} strokeWidth={edgeActive(activeStep, 1) ? 2.6 : 1.3} markerEnd="url(#jep-arr-amber)" className={activeStep === 1 ? 'interactive-diagram-flowing-path' : ''} />
                {activeStep === 1 && (
                  <circle r="3.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                    <animateMotion dur="0.7s" repeatCount="indefinite"><mpath href="#jep-e1" /></animateMotion>
                  </circle>
                )}

                <g onClick={() => selectStep(1)} style={{ cursor: 'pointer', opacity: nodeOpacity(activeStep, 1), transition: 'opacity 0.35s' }}>
                  <rect x="186" y="28" width="120" height="58" rx="8" fill="rgba(251,191,36,0.10)" stroke="#fbbf24" strokeWidth={activeStep === 1 ? 2.4 : 1.5} />
                  <text x="246" y="52" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800">javac</text>
                  <text x="246" y="70" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Compile</text>
                </g>

                <path id="jep-e2" d="M 312 57 L 340 57" fill="none" stroke={edgeLit(2, '#34d399')} strokeWidth={edgeActive(activeStep, 2) ? 2.6 : 1.3} markerEnd="url(#jep-arr-green)" className={activeStep === 2 ? 'interactive-diagram-flowing-path' : ''} />
                {activeStep === 2 && (
                  <circle r="3.5" fill="#34d399" className="interactive-diagram-flowing-dot">
                    <animateMotion dur="0.7s" repeatCount="indefinite"><mpath href="#jep-e2" /></animateMotion>
                  </circle>
                )}

                <g onClick={() => selectStep(2)} style={{ cursor: 'pointer', opacity: nodeOpacity(activeStep, 2), transition: 'opacity 0.35s' }}>
                  <rect x="348" y="28" width="120" height="58" rx="8" fill="rgba(52,211,153,0.10)" stroke="#34d399" strokeWidth={activeStep === 2 ? 2.4 : 1.5} />
                  <text x="408" y="52" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">Bytecode</text>
                  <text x="408" y="70" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10" fontFamily="monospace">.class</text>
                </g>

                <path id="jep-e3" d="M 474 57 L 508 57" fill="none" stroke={edgeLit(3, '#a78bfa')} strokeWidth={edgeActive(activeStep, 3) ? 2.6 : 1.3} markerEnd="url(#jep-arr-purple)" className={activeStep === 3 ? 'interactive-diagram-flowing-path' : ''} />
                {activeStep === 3 && (
                  <circle r="3.5" fill="#a78bfa" className="interactive-diagram-flowing-dot">
                    <animateMotion dur="0.7s" repeatCount="indefinite"><mpath href="#jep-e3" /></animateMotion>
                  </circle>
                )}

                {/* JVM RUNTIME */}
                <g style={{ opacity: activeStep === null || activeStep >= 3 ? 1 : 0.35, transition: 'opacity 0.35s' }}>
                  <rect
                    x="516"
                    y="16"
                    width="268"
                    height="430"
                    rx="14"
                    fill="rgba(167,139,250,0.05)"
                    stroke="#a78bfa"
                    strokeWidth={jvmActive ? 2 : 1.4}
                  />
                  <text x="650" y="38" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="800" letterSpacing="0.7">
                    JVM RUNTIME
                  </text>

                  {/* Load */}
                  <g onClick={() => selectStep(3)} style={{ cursor: 'pointer', opacity: nodeOpacity(activeStep, 3) }}>
                    <rect x="532" y="52" width="72" height="52" rx="7" fill={activeStep === 3 ? 'rgba(167,139,250,0.22)' : 'rgba(167,139,250,0.08)'} stroke="#a78bfa" strokeWidth={activeStep === 3 ? 2.2 : 1.3} />
                    <text x="568" y="74" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="800">Load</text>
                    <text x="568" y="90" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">bytes→meta</text>
                  </g>

                  <path id="jep-e4" d="M 610 78 L 628 78" fill="none" stroke={edgeLit(4, '#2dd4bf')} strokeWidth={edgeActive(activeStep, 4) ? 2.4 : 1.2} markerEnd="url(#jep-arr-teal)" className={activeStep === 4 ? 'interactive-diagram-flowing-path' : ''} />
                  {activeStep === 4 && (
                    <circle r="3.2" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                      <animateMotion dur="0.6s" repeatCount="indefinite"><mpath href="#jep-e4" /></animateMotion>
                    </circle>
                  )}

                  {/* Link */}
                  <g onClick={() => selectStep(4)} style={{ cursor: 'pointer', opacity: nodeOpacity(activeStep, 4) }}>
                    <rect x="636" y="52" width="72" height="52" rx="7" fill={activeStep === 4 ? 'rgba(45,212,191,0.22)' : 'rgba(45,212,191,0.08)'} stroke="#2dd4bf" strokeWidth={activeStep === 4 ? 2.2 : 1.3} />
                    <text x="672" y="74" textAnchor="middle" fill="#2dd4bf" fontSize="11" fontWeight="800">Link</text>
                    <text x="672" y="90" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">V·P·R</text>
                  </g>

                  <path id="jep-e5" d="M 672 110 L 672 128" fill="none" stroke={edgeLit(5, '#34d399')} strokeWidth={edgeActive(activeStep, 5) ? 2.4 : 1.2} markerEnd="url(#jep-arr-green)" className={activeStep === 5 ? 'interactive-diagram-flowing-path' : ''} />
                  {activeStep === 5 && (
                    <circle r="3.2" fill="#34d399" className="interactive-diagram-flowing-dot">
                      <animateMotion dur="0.6s" repeatCount="indefinite"><mpath href="#jep-e5" /></animateMotion>
                    </circle>
                  )}

                  {/* Init — centered under Link/Load */}
                  <g onClick={() => selectStep(5)} style={{ cursor: 'pointer', opacity: nodeOpacity(activeStep, 5) }}>
                    <rect x="568" y="136" width="164" height="44" rx="7" fill={activeStep === 5 ? 'rgba(52,211,153,0.22)' : 'rgba(52,211,153,0.08)'} stroke="#34d399" strokeWidth={activeStep === 5 ? 2.2 : 1.3} />
                    <text x="650" y="156" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">{'Init (<clinit>)'}</text>
                    <text x="650" y="170" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">static blocks · real values</text>
                  </g>

                  <path id="jep-e6" d="M 650 186 L 650 204" fill="none" stroke={edgeLit(6, '#8b5cf6')} strokeWidth={edgeActive(activeStep, 6) ? 2.4 : 1.2} markerEnd="url(#jep-arr-violet)" className={activeStep === 6 ? 'interactive-diagram-flowing-path' : ''} />
                  {activeStep === 6 && (
                    <circle r="3.2" fill="#8b5cf6" className="interactive-diagram-flowing-dot">
                      <animateMotion dur="0.6s" repeatCount="indefinite"><mpath href="#jep-e6" /></animateMotion>
                    </circle>
                  )}

                  {/* Heap */}
                  <g onClick={() => selectStep(6)} style={{ cursor: 'pointer', opacity: nodeOpacity(activeStep, 6) }}>
                    <rect x="532" y="212" width="110" height="58" rx="7" fill={activeStep === 6 ? 'rgba(139,92,246,0.22)' : 'rgba(139,92,246,0.08)'} stroke="#8b5cf6" strokeWidth={activeStep === 6 ? 2.2 : 1.3} />
                    <text x="587" y="236" textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="800">Heap</text>
                    <text x="587" y="252" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Objects · GC</text>
                    <text x="587" y="264" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Shared</text>
                  </g>

                  {/* Stack */}
                  <g onClick={() => selectStep(6)} style={{ cursor: 'pointer', opacity: nodeOpacity(activeStep, 6) }}>
                    <rect x="658" y="212" width="110" height="58" rx="7" fill={activeStep === 6 ? 'rgba(139,92,246,0.22)' : 'rgba(139,92,246,0.08)'} stroke="#8b5cf6" strokeWidth={activeStep === 6 ? 2.2 : 1.3} />
                    <text x="713" y="236" textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="800">Stack</text>
                    <text x="713" y="252" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Frames · Locals</text>
                    <text x="713" y="264" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Per-thread</text>
                  </g>

                  <path id="jep-e7" d="M 650 276 L 650 294" fill="none" stroke={edgeLit(7, '#38bdf8')} strokeWidth={edgeActive(activeStep, 7) ? 2.4 : 1.2} markerEnd="url(#jep-arr-blue)" className={activeStep === 7 ? 'interactive-diagram-flowing-path' : ''} />
                  {activeStep === 7 && (
                    <circle r="3.2" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                      <animateMotion dur="0.6s" repeatCount="indefinite"><mpath href="#jep-e7" /></animateMotion>
                    </circle>
                  )}

                  {/* Interpreter */}
                  <g onClick={() => selectStep(7)} style={{ cursor: 'pointer', opacity: nodeOpacity(activeStep, 7) }}>
                    <rect x="532" y="302" width="236" height="44" rx="7" fill={activeStep === 7 ? 'rgba(56,189,248,0.20)' : 'rgba(56,189,248,0.07)'} stroke="#38bdf8" strokeWidth={activeStep === 7 ? 2.2 : 1.3} />
                    <text x="650" y="322" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800">Interpreter · Tier 0</text>
                    <text x="650" y="336" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Profile · counters · cold start</text>
                  </g>

                  <path id="jep-e8" d="M 650 352 L 650 370" fill="none" stroke={edgeLit(8, '#f97316')} strokeWidth={edgeActive(activeStep, 8) ? 2.4 : 1.2} markerEnd="url(#jep-arr-orange)" className={activeStep === 8 ? 'interactive-diagram-flowing-path' : ''} />
                  {activeStep === 8 && (
                    <circle r="3.2" fill="#f97316" className="interactive-diagram-flowing-dot">
                      <animateMotion dur="0.6s" repeatCount="indefinite"><mpath href="#jep-e8" /></animateMotion>
                    </circle>
                  )}

                  {/* JIT */}
                  <g onClick={() => selectStep(8)} style={{ cursor: 'pointer', opacity: nodeOpacity(activeStep, 8) }}>
                    <rect x="532" y="378" width="236" height="52" rx="7" fill={activeStep === 8 ? 'rgba(249,115,22,0.20)' : 'rgba(249,115,22,0.07)'} stroke="#f97316" strokeWidth={activeStep === 8 ? 2.2 : 1.3} />
                    <text x="650" y="400" textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="800">JIT · C1 → C2</text>
                    <text x="650" y="416" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Code Cache · deopt · hot methods</text>
                  </g>
                </g>

                {/* Edge to Running App */}
                <path id="jep-e9" d="M 650 436 L 650 458" fill="none" stroke={edgeLit(9, '#2dd4bf')} strokeWidth={edgeActive(activeStep, 9) ? 2.6 : 1.3} markerEnd="url(#jep-arr-teal)" className={activeStep === 9 ? 'interactive-diagram-flowing-path' : ''} />
                {activeStep === 9 && (
                  <circle r="3.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                    <animateMotion dur="0.7s" repeatCount="indefinite"><mpath href="#jep-e9" /></animateMotion>
                  </circle>
                )}

                <g onClick={() => selectStep(9)} style={{ cursor: 'pointer', opacity: nodeOpacity(activeStep, 9), transition: 'opacity 0.35s' }}>
                  <rect x="532" y="466" width="236" height="42" rx="8" fill={activeStep === 9 ? 'rgba(45,212,191,0.20)' : 'rgba(45,212,191,0.08)'} stroke="#2dd4bf" strokeWidth={activeStep === 9 ? 2.4 : 1.5} />
                  <text x="650" y="492" textAnchor="middle" fill="#2dd4bf" fontSize="13" fontWeight="800">Running Application</text>
                </g>

                {/* Left-side notes */}
                <text x="246" y="110" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">JDK compile path</text>
                <text x="246" y="126" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">portable .class bytes</text>

                <rect x="24" y="150" width="460" height="120" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <text x="40" y="174" fill="#a78bfa" fontSize="11" fontWeight="800">ClassLoader phases</text>
                <text x="40" y="194" fill="var(--ifm-color-content-secondary)" fontSize="10">Load → parse bytes into Metaspace + Class on Heap</text>
                <text x="40" y="212" fill="var(--ifm-color-content-secondary)" fontSize="10">Link → Verify · Prepare (defaults) · Resolve (symbols)</text>
                <text x="40" y="230" fill="var(--ifm-color-content-secondary)" fontSize="10">{'Init → <clinit> / static {} — real static values'}</text>
                <text x="40" y="252" fill="#f97316" fontSize="10" fontWeight="700">JIT: Tier0 interpret → C1 → C2 native in Code Cache</text>

                <rect x="24" y="290" width="460" height="88" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <text x="40" y="314" fill="#8b5cf6" fontSize="11" fontWeight="800">Select any node for senior-lead detail</text>
                <text x="40" y="334" fill="var(--ifm-color-content-secondary)" fontSize="10">Panel shows under-the-hood mechanics, failure modes,</text>
                <text x="40" y="352" fill="var(--ifm-color-content-secondary)" fontSize="10">interview/production notes, and relevant JVM flags.</text>
              </svg>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
              {STEPS.map((step) => {
                const isActive = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => selectStep(step.id)}
                    style={{
                      flex: '1 1 18%',
                      minWidth: '72px',
                      padding: '7px 6px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '10px',
                      background: isActive ? `${step.color}18` : 'rgba(255,255,255,0.03)',
                      color: isActive ? step.color : 'var(--ifm-color-content-secondary)',
                      boxShadow: isActive ? `0 0 0 1.5px ${step.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {step.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SNR detail panel */}
          <div>
            {selected ? (
              <div
                className="interactive-diagram-details-card"
                style={{ borderColor: selected.color, minHeight: '320px', maxHeight: '560px', overflowY: 'auto' }}
              >
                <div
                  className="interactive-diagram-card-header"
                  style={{ marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}
                >
                  <span className="interactive-diagram-indicator-dot" style={{ background: selected.color }} />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: selected.color }}>{selected.title}</span>
                </div>

                <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                  {selected.lead}
                </p>

                <Section label="Under the hood" color={selected.color} items={selected.underTheHood} />
                <Section label="Failure modes" color="#f87171" items={selected.failureModes} />
                <Section label="Notes" color="#fbbf24" items={selected.leadGotchas} />

                {selected.flags && selected.flags.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#38bdf8',
                        marginBottom: '5px',
                      }}
                    >
                      Flags / tools
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selected.flags.map((f) => (
                        <code
                          key={f}
                          style={{
                            fontSize: '11px',
                            color: '#38bdf8',
                            background: 'rgba(56,189,248,0.08)',
                            border: '1px solid rgba(56,189,248,0.25)',
                            borderRadius: '5px',
                            padding: '4px 8px',
                          }}
                        >
                          {f}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 18px',
                  border: '1px dashed rgba(255,255,255,0.10)',
                  borderRadius: '12px',
                  color: 'var(--ifm-color-content-secondary)',
                  fontSize: '13px',
                  minHeight: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1.55,
                }}
              >
                Press ▶ Animate or select Load / Link / Init / JIT for senior-lead detail (mechanics, failures, notes, flags).
              </div>
            )}
            <p className="interactive-diagram-helper-text" style={{ marginTop: '10px' }}>
              Link = Verify + Prepare + Resolve. JIT = tiered C1/C2 into Code Cache; deopt returns to the interpreter when profiles break.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
