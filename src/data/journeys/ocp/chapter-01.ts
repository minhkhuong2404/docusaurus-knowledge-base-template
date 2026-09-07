import type { QuizQuestion } from '../../../components/DailyQuiz';
import type { ChapterFlashcard } from '../types';

/** One flashcard per learning ### in chapter-01.md (excludes Rules Summary & Exam Vignettes). */
export const chapter01Flashcards: ChapterFlashcard[] = [
  {
    id: 'c1-env',
    section: 'The Java Environment & Single-File Source Code',
    front: 'What do javac, java, jar, and javadoc each produce?',
    back: 'javac turns .java into .class bytecode. java launches the JVM on a class name or, since Java 11, a single .java file (extension required). jar packs classes into an archive. javadoc emits HTML API docs.',
    notes: 'Single-file launch: `java Zoo.java Bronx Zoo` — args still go to main; no separate javac step.',
  },
  {
    id: 'c1-anatomy',
    section: 'Anatomy of a Java Class & Comments',
    front: 'What is PIC order, and can you nest /* */ comments?',
    back: 'Package (optional, first non-comment), then Imports, then Class. At most one public top-level type, matching the filename. Comments: //, /* */, and /** */. Nested multi-line comments fail because the first */ ends the comment.',
    notes: 'Exam trap: `/* /* nested */ */` does not compile.',
  },
  {
    id: 'c1-packages',
    section: 'Package Declarations, Imports, and Conflicts',
    front: 'Do wildcards import child packages? How do Date conflicts resolve?',
    back: '`import pkg.*` imports only types in that package, not subpackages. java.lang and same-package types need no import. Two wildcard Date imports make bare Date ambiguous; an explicit import beats a wildcard; otherwise use fully qualified names.',
    notes: '`import java.util.*` does not pull in java.util.concurrent.* types.',
  },
  {
    id: 'c1-compile-run',
    section: 'Compiling and Running with Packages',
    front: 'How must directories relate to packages when you compile and run?',
    back: 'Directory layout must mirror package names. Compile with paths like `javac packagea/ClassA.java`. `-d classes` writes .class files under a target tree. Run with `-cp`/`-classpath`/`--class-path` and the fully qualified class name.',
    notes: 'Running uses the package-qualified name, not the .java path.',
  },
  {
    id: 'c1-ctors',
    section: 'Creating Objects & Constructors',
    front: 'What makes a constructor different from a same-named method?',
    back: 'Create instances with `new` plus a constructor call. A constructor’s name matches the class and has no return type (not even void). A method named like the class but returning void is a normal method and is not invoked by `new`.',
    notes: '`public void Chick() {}` compiles but is never the constructor.',
  },
  {
    id: 'c1-init-order',
    section: 'Initializers & Order of Initialization',
    front: 'In what order do static, instance, and constructor code run?',
    back: 'On first class load: static fields and static initializers in source order (once). On each `new`: instance fields and instance initializer blocks in order, then the constructor. You cannot forward-reference an instance field from an earlier initializer block.',
    notes: '`{ System.out.println(name); }` before `private String name` does not compile.',
  },
  {
    id: 'c1-primitives',
    section: 'Primitive Types',
    front: 'Name the eight primitives and the underscore literal rules.',
    back: 'boolean, byte, short, int, long, float, double, char. Defaults apply to instance/class fields only (0/false/null-char), not locals. Bases: 0 octal, 0x hex, 0b binary. Underscores cannot start/end a literal, sit next to `.`, or sit before L/f/F suffixes.',
    notes: '`100._0`, `_100`, and `100.0_` are illegal. Float literals need `f`/`F`.',
  },
  {
    id: 'c1-wrappers',
    section: 'Wrapper Classes & String Conversion',
    front: 'parseXxx vs valueOf, and Boolean.valueOf traps?',
    back: 'Each primitive has a wrapper. parseXxx returns a primitive; valueOf returns a wrapper (and integer wrappers accept a radix). Boolean.valueOf is case-insensitive and true only for the text "true"; any other string or null yields false.',
    notes: '`Boolean.valueOf("kangaroo")` and `Boolean.valueOf(null)` are both false.',
  },
  {
    id: 'c1-var',
    section: 'Local Variable Type Inference (`var`)',
    front: 'Where is var legal, and what initializers fail?',
    back: 'Locals only — not fields, parameters, or return types. Must initialize on the same line; cannot infer from bare null; cannot multi-declare `var a = 1, b = 2`; type is fixed after inference. var is a reserved type name: you can name a variable/method var, not a type.',
    notes: '`var z = (String) null` is fine; `var y = null` is not.',
  },
  {
    id: 'c1-text-blocks',
    section: 'Text Blocks',
    front: 'What whitespace and escape rules do text blocks use?',
    back: 'Opening `"""` must be followed by a newline. Incidental indent (left of the leftmost content or closing `"""`) is stripped; essential indent to the right is kept. `\\` continues a line without a newline; `\\s` keeps trailing spaces.',
    notes: '`"""hello"""` on one line does not compile. Closing `"""` on its own line keeps a trailing newline.',
  },
  {
    id: 'c1-scope',
    section: 'Variable Scope',
    front: 'Contrast local, parameter, instance, and class variable lifetimes.',
    back: 'Locals live from declaration to the end of their block. Parameters last for the method call. Instance fields live with the object until GC. static class fields live for the class lifetime. Block variables declared inside an if/for are invisible outside that block.',
    notes: 'Locals get no defaults — definite assignment before use is required.',
  },
  {
    id: 'c1-gc',
    section: 'Garbage Collection',
    front: 'When is an object eligible for GC? What does System.gc() do?',
    back: 'An object is eligible when unreachable: no live references, or references only among an unreachable island. System.gc() only suggests collection; the JVM may ignore it.',
    notes: 'Null one end of a cycle first, then the other — eligibility appears when the island is cut off.',
  },
  {
    id: 'c1-jvm-memory',
    section: 'JVM Memory Model Internals',
    front: 'What lives on the stack vs heap vs Metaspace vs string pool?',
    back: 'Stack holds per-thread frames, locals, and references (no GC there). Heap holds objects and arrays and is GC’d. Metaspace holds class metadata and bytecode. The string pool is a heap region that caches string literals.',
    notes: 'Two string literals can share one pooled object; `new String(...)` is a distinct heap object.',
  },
  {
    id: 'c1-integer-cache',
    section: 'Integer Cache Trap',
    front: 'When does Integer == compare equal for autoboxed values?',
    back: 'Autoboxed Integer values from -128 to 127 reuse cached instances, so == can be true. Outside that range, == usually compares distinct objects and is false even when equals is true. Prefer equals for value equality.',
    notes: '`Integer a = 127; Integer b = 127; a == b` is true; `128` often false.',
  },
  {
    id: 'c1-numeric-promo',
    section: 'Numeric Promotion Rules',
    front: 'What are the three numeric promotion rules for arithmetic?',
    back: 'Different types → promote smaller to larger. Mixed integral and floating → promote to floating. Unary/binary arithmetic on byte/short/char promotes those operands to int, so byte + short is int and needs a cast to assign back to short.',
    notes: '`short result = b + s;` fails; `(short)(b + s)` works.',
  },
  {
    id: 'c1-final-effective',
    section: '`final` vs. Effective Finality',
    front: 'What is effectively final, and why do lambdas care?',
    back: 'final means assigned exactly once. Effectively final means never reassigned after init even without the keyword. Lambdas and local classes may capture only final or effectively final locals.',
    notes: 'Reassign `y` after init and a lambda using `y` fails to compile.',
  },
  {
    id: 'c1-ref-strengths',
    section: 'Reference Strengths',
    front: 'Strong vs Soft vs Weak vs Phantom — GC behavior?',
    back: 'Strong: kept while reachable. Soft: collected under memory pressure (caches). Weak: collected on the next GC cycle (WeakHashMap-style metadata). Phantom: after finalization, for post-mortem cleanup via a reference queue.',
    notes: 'Strong references in static fields are a classic leak path.',
  },
];

export const chapter01Easy: QuizQuestion[] = [
  {
    id: 'ocp-ch01-e1',
    topic: 'Building Blocks',
    difficulty: 'easy',
    questionText: 'Which tool compiles .java source into .class bytecode?',
    options: ['java', 'javac', 'jar', 'javadoc'],
    correctOptionIndex: 1,
    explanation:
      'javac is the compiler: it reads .java and writes .class bytecode. java launches the JVM (or a single-file source program); jar builds archives; javadoc generates HTML docs. Picking java confuses “run” with “compile.”',
  },
  {
    id: 'ocp-ch01-e2',
    topic: 'Building Blocks',
    difficulty: 'easy',
    questionText: 'What is the required top-level order in a .java file (PIC)?',
    options: [
      'import → package → class',
      'class → package → import',
      'package → import → class',
      'package → class → import',
    ],
    correctOptionIndex: 2,
    explanation:
      'PIC is package, then imports, then the type declaration. Imports before package do not compile. Putting the class before imports breaks the same rule: package and imports must come first.',
  },
  {
    id: 'ocp-ch01-e3',
    topic: 'Building Blocks',
    difficulty: 'easy',
    questionText: 'Which primitive is 64-bit floating point?',
    options: ['float', 'double', 'long', 'BigDecimal'],
    correctOptionIndex: 1,
    explanation:
      'double is the 64-bit IEEE floating type; float is 32-bit. long is a 64-bit integer, not floating point. BigDecimal is a class, not a primitive.',
  },
  {
    id: 'ocp-ch01-e4',
    topic: 'Building Blocks',
    difficulty: 'easy',
    questionText: 'Since Java 11, which command runs a single-file program without a separate javac step?',
    options: ['java Zoo', 'java Zoo.java', 'javac Zoo.java && java Zoo', 'jar Zoo.java'],
    correctOptionIndex: 1,
    explanation:
      'The single-file launcher requires the .java extension: `java Zoo.java`. `java Zoo` expects a compiled class named Zoo. The javac pipeline is the classic two-step path, not the one-step launcher.',
  },
  {
    id: 'ocp-ch01-e5',
    topic: 'Building Blocks',
    difficulty: 'easy',
    questionText: 'Which comment form generates API documentation?',
    options: ['// comment', '/* comment */', '/** comment */', '# comment'],
    correctOptionIndex: 2,
    explanation:
      'Javadoc comments use /** */. // and /* */ are ordinary comments and are ignored by javadoc. # is not a Java comment syntax.',
  },
  {
    id: 'ocp-ch01-e6',
    topic: 'Building Blocks',
    difficulty: 'easy',
    questionText: 'What is the default value of an uninitialized instance int field?',
    options: ['undefined', 'null', '0', 'It does not compile'],
    correctOptionIndex: 2,
    explanation:
      'Instance/class fields get defaults: int defaults to 0. null is for reference fields. Locals do not get defaults and fail to compile if used uninitialized — that rule does not apply to instance ints.',
  },
  {
    id: 'ocp-ch01-e7',
    topic: 'Building Blocks',
    difficulty: 'easy',
    questionText: 'Which import is redundant because the package is always available?',
    options: [
      'import java.util.List;',
      'import java.lang.String;',
      'import java.io.File;',
      'import java.sql.Date;',
    ],
    correctOptionIndex: 1,
    explanation:
      'java.lang is imported automatically, so importing String is redundant (legal but unnecessary). util, io, and sql types do need imports or fully qualified names.',
  },
  {
    id: 'ocp-ch01-e8',
    topic: 'Building Blocks',
    difficulty: 'easy',
    questionText: 'What does System.gc() guarantee?',
    options: [
      'GC runs immediately',
      'All unreachable objects are freed before the next line',
      'Nothing — it is only a hint',
      'finalize() runs for every object',
    ],
    correctOptionIndex: 2,
    explanation:
      'System.gc() suggests collection; the JVM may ignore it. It does not promise immediate or complete reclamation, nor that finalize runs for every object.',
  },
];

export const chapter01Medium: QuizQuestion[] = [
  {
    id: 'ocp-ch01-m1',
    topic: 'Building Blocks',
    difficulty: 'medium',
    questionText: 'Why does this fail to compile?',
    codeSnippet: `import java.util.*;
import java.sql.*;
public class Conflicts {
  Date date;
}`,
    options: [
      'Date is not public',
      'Reference to Date is ambiguous',
      'Wildcards are illegal',
      'sql.Date cannot be imported',
    ],
    correctOptionIndex: 1,
    explanation:
      'Both packages export a Date type, so a bare Date is ambiguous. Wildcards themselves are legal. Fix with an explicit import of one Date or fully qualified names — not by claiming Date is non-public.',
  },
  {
    id: 'ocp-ch01-m2',
    topic: 'Building Blocks',
    difficulty: 'medium',
    questionText: 'What is true about this member?',
    codeSnippet: `public class Bear {
  public void Bear() { }
}`,
    options: [
      'It is the no-arg constructor',
      'It is a method, not a constructor',
      'It does not compile',
      'It runs automatically on new Bear()',
    ],
    correctOptionIndex: 1,
    explanation:
      'A constructor cannot declare a return type. `void Bear()` is an ordinary method, so `new Bear()` does not call it. The code compiles; it just misleads readers who expect a constructor.',
  },
  {
    id: 'ocp-ch01-m3',
    topic: 'Building Blocks',
    difficulty: 'medium',
    questionText: 'Which literal is illegal?',
    options: ['1_000.00', '0xFF', '100._0', '0b1010'],
    correctOptionIndex: 2,
    explanation:
      'Underscores cannot sit next to a decimal point, so `100._0` fails. `1_000.00`, hex `0xFF`, and binary `0b1010` are valid forms.',
  },
  {
    id: 'ocp-ch01-m4',
    topic: 'Building Blocks',
    difficulty: 'medium',
    questionText: 'What does Boolean.valueOf("TrUe") return?',
    options: ['true', 'false', 'null', 'Compilation error'],
    correctOptionIndex: 0,
    explanation:
      'Boolean.valueOf treats the string case-insensitively and returns true only when it equals "true". "TrUe" matches. "kangaroo" would be false; null input is also false, not a compile error.',
  },
  {
    id: 'ocp-ch01-m5',
    topic: 'Building Blocks',
    difficulty: 'medium',
    questionText: 'Which var declaration fails to compile?',
    options: [
      'var list = new ArrayList<String>();',
      'var n = 10;',
      'var x = 1, y = 2;',
      'var s = (String) null;',
    ],
    correctOptionIndex: 2,
    explanation:
      'var cannot declare multiple variables in one statement. Inferring ArrayList or int is fine, and casting null to String gives an inferable type. Bare `var y = null` would also fail, but that is not an option here.',
  },
  {
    id: 'ocp-ch01-m6',
    topic: 'Building Blocks',
    difficulty: 'medium',
    questionText: 'Which text block opener is illegal?',
    options: [
      '"""\\n  hello\\n  """',
      '"""hello""" on one line',
      '"""\\n  doe \\\\\\n  deer"""',
      '"""\\n  line\\s\\n  """',
    ],
    correctOptionIndex: 1,
    explanation:
      'The opening """ must be followed immediately by a newline, so `"""hello"""` on one line does not compile. Multi-line forms with incidental indent, line-continuation `\\`, and `\\s` are the supported patterns.',
  },
  {
    id: 'ocp-ch01-m7',
    topic: 'Building Blocks',
    difficulty: 'medium',
    questionText: 'After class load and `new X()`, what runs last?',
    options: [
      'Static initializers',
      'Instance initializers',
      'The constructor body',
      'Static fields only, never again',
    ],
    correctOptionIndex: 2,
    explanation:
      'Statics run once on class load. Each construction then runs instance fields/initializers in order, and the constructor runs last. Statics do not rerun on every new.',
  },
  {
    id: 'ocp-ch01-m8',
    topic: 'Building Blocks',
    difficulty: 'medium',
    questionText: 'What is the type of `byte b + short s`?',
    options: ['byte', 'short', 'int', 'long'],
    correctOptionIndex: 2,
    explanation:
      'Smaller integral types promote to int in binary arithmetic, so byte + short is int. Assigning that result to short/byte needs an explicit cast; it is not automatically long.',
  },
];

export const chapter01Hard: QuizQuestion[] = [
  {
    id: 'ocp-ch01-h1',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'What prints?',
    codeSnippet: `Integer a = 127;
Integer b = 127;
Integer c = 128;
Integer d = 128;
System.out.println((a == b) + " " + (c == d) + " " + c.equals(d));`,
    options: [
      'true true true',
      'true false true',
      'false false true',
      'true false false',
    ],
    correctOptionIndex: 1,
    explanation:
      '127 is inside the Integer cache, so a and b can be the same reference (== true). 128 is outside the cache, so c == d is typically false while equals remains true. Choosing all-true ignores the cache boundary.',
  },
  {
    id: 'ocp-ch01-h2',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'Does this compile? Why?',
    codeSnippet: `{ System.out.println(name); }
private String name = "Fluffy";`,
    options: [
      'Yes — fields are visible everywhere in the class',
      'No — illegal forward reference in the initializer',
      'Yes — name defaults to null',
      'No — instance initializers are illegal',
    ],
    correctOptionIndex: 1,
    explanation:
      'An instance initializer cannot read a field declared later in the class; that is an illegal forward reference. Instance initializers themselves are legal, and field defaults do not save a forward read.',
  },
  {
    id: 'ocp-ch01-h3',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'Which statement about reference strengths is correct?',
    options: [
      'Weak references prevent GC while the WeakReference object exists',
      'Soft references are collected only under memory pressure',
      'Phantom references keep the referent strongly reachable',
      'Strong and soft references behave identically',
    ],
    correctOptionIndex: 1,
    explanation:
      'SoftReference targets are kept until the heap is under pressure — useful for caches. Weak referents can be collected on the next GC even without pressure. Phantom references do not keep the object strongly reachable for normal use.',
  },
  {
    id: 'ocp-ch01-h4',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'Why does the lambda fail?',
    codeSnippet: `int y = 20;
y = 30;
Runnable r = () -> System.out.println(y);`,
    options: [
      'Lambdas cannot print ints',
      'y is not effectively final',
      'y must be static',
      'Runnable cannot capture locals',
    ],
    correctOptionIndex: 1,
    explanation:
      'Locals captured by lambdas must be final or effectively final. Reassigning y breaks that rule. Runnable can capture effectively final locals; the problem is the reassignment, not printing ints.',
  },
  {
    id: 'ocp-ch01-h5',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'Where are local variable slots stored?',
    options: [
      'Heap only',
      'Per-thread stack frames',
      'Metaspace',
      'String pool',
    ],
    correctOptionIndex: 1,
    explanation:
      'Locals and references live in the current thread’s stack frame. Objects those references point to live on the heap. Metaspace holds class metadata; the string pool caches string literals on the heap.',
  },
  {
    id: 'ocp-ch01-h6',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'What happens at runtime?',
    codeSnippet: `Integer value = null;
int primitive = value;`,
    options: [
      'Compiles and assigns 0',
      'Does not compile',
      'Compiles, then throws NullPointerException',
      'Assigns Integer.MIN_VALUE',
    ],
    correctOptionIndex: 2,
    explanation:
      'Unboxing null is legal at compile time but throws NullPointerException at runtime. It does not become 0 or MIN_VALUE, and the assignment is not a compile error.',
  },
  {
    id: 'ocp-ch01-h7',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'After both assignments, which objects are eligible for GC?',
    codeSnippet: `GCTest a = new GCTest();
GCTest b = new GCTest();
a.partner = b;
b.partner = a;
a = null;
b = null;`,
    options: [
      'Only a’s object',
      'Only b’s object',
      'Neither — they reference each other',
      'Both — island of isolation',
    ],
    correctOptionIndex: 3,
    explanation:
      'Once a and b are null, the two objects only reference each other and are unreachable from GC roots — an island of isolation. Mutual references alone do not keep them alive.',
  },
  {
    id: 'ocp-ch01-h8',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'Why does `import java.util.*` fail to resolve AtomicInteger?',
    options: [
      'AtomicInteger is not public',
      'Wildcards skip child packages',
      'AtomicInteger requires a static import',
      'util.* is deprecated',
    ],
    correctOptionIndex: 1,
    explanation:
      'Wildcard imports cover only the named package. AtomicInteger lives under java.util.concurrent.atomic, so you need that package’s import (or a FQCN). It is public; static import is unrelated.',
  },
];

export const chapter01Final: QuizQuestion[] = [
  {
    id: 'ocp-ch01-f1',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'Which identifier is illegal in modern Java?',
    options: ['$amount', '_value', 'int _ = 10;', 'Café'],
    correctOptionIndex: 2,
    explanation:
      'A lone underscore is a reserved keyword and cannot be an identifier. Names may start with letters, $, or _; digits cannot lead. Accented letters can appear in identifiers.',
  },
  {
    id: 'ocp-ch01-f2',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'Which source-file ordering is correct?',
    options: [
      'imports, then package, then class',
      'package, then imports, then class',
      'class, then package',
      'package anywhere after the class',
    ],
    correctOptionIndex: 1,
    explanation:
      'Review focus: PIC — package → import → class. Imports before package fail. The package cannot appear after the class.',
  },
  {
    id: 'ocp-ch01-f3',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'parseInt("1") vs valueOf("1") — return types?',
    options: [
      'Both return Integer',
      'Both return int',
      'parseInt → int; valueOf → Integer',
      'parseInt → Integer; valueOf → int',
    ],
    correctOptionIndex: 2,
    explanation:
      'parseInt returns the primitive int; valueOf returns the Integer wrapper. Swapping those return types is a common exam mix-up.',
  },
  {
    id: 'ocp-ch01-f4',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'What is the difference between these blocks?',
    codeSnippet: `String block1 = """
        hello""";
String block2 = """
        hello
        """;`,
    options: [
      'They are identical strings',
      'block2 includes a trailing newline; block1 does not',
      'block1 does not compile',
      'block2 strips the word hello',
    ],
    correctOptionIndex: 1,
    explanation:
      'Closing """ on the same line as content omits a final newline; placing """ on its own line keeps one. Both forms compile; neither removes hello.',
  },
  {
    id: 'ocp-ch01-f5',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'When does object X first become eligible for GC?',
    codeSnippet: `Object x = new Object(); // line 1
Object y = x;            // line 2
x = null;                // line 3
y = null;                // line 4`,
    options: ['After line 1', 'After line 2', 'After line 3', 'After line 4'],
    correctOptionIndex: 3,
    explanation:
      'After line 3, y still reaches the object. Only after line 4 are there zero live references, so eligibility starts there — not when x alone is nulled.',
  },
  {
    id: 'ocp-ch01-f6',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'Why is this not a constructor?',
    codeSnippet: `public class Bear {
  public void Bear() {}
}`,
    options: [
      'Constructors must be private',
      'It declares a return type',
      'The name must differ from the class',
      'Methods cannot be public',
    ],
    correctOptionIndex: 1,
    explanation:
      'Constructors have no return type. Declaring void makes it a method that `new` never calls. Constructors can be public and must match the class name.',
  },
  {
    id: 'ocp-ch01-f7',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'Why does this fail?',
    codeSnippet: `byte b = 10;
short s = 20;
short result = b + s;`,
    options: [
      'byte and short cannot be added',
      'b + s promotes to int',
      'short cannot hold 30',
      'Need long cast',
    ],
    correctOptionIndex: 1,
    explanation:
      'Binary arithmetic promotes byte/short to int, so the sum is int and cannot assign to short without a cast. The values are in range; the issue is the result type, not needing long.',
  },
  {
    id: 'ocp-ch01-f8',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'For which range is Integer caching commonly guaranteed?',
    options: ['0 to 255', '-128 to 127', '-256 to 256', 'All Integers'],
    correctOptionIndex: 1,
    explanation:
      'Autoboxed Integer values from -128 to 127 use the shared cache, which is why == can succeed there. Outside that range, == is unreliable for value equality; equals is the safe check.',
  },
  {
    id: 'ocp-ch01-f9',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'Why does this fail to compile?',
    codeSnippet: `void test() {
  int x;
  if (Math.random() > 0.5) {
    x = 1;
  }
  System.out.println(x);
}`,
    options: [
      'Math.random cannot appear in if',
      'x might be uninitialized',
      'Locals cannot be printed',
      'if requires braces',
    ],
    correctOptionIndex: 1,
    explanation:
      'Locals must be definitely assigned. The compiler sees a path where the if is false and x is never set. Braces are optional for a single statement; the print itself is fine if x were assigned on all paths.',
  },
  {
    id: 'ocp-ch01-f10',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'Which underscore usage is illegal?',
    options: ['1_000', '0b1010_1111', '100._0', '1_000_000L'],
    correctOptionIndex: 2,
    explanation:
      'An underscore adjacent to the decimal point is illegal. Digits grouped with underscores and binary literals with underscores are valid when not next to `.` or at illegal edges.',
  },
  {
    id: 'ocp-ch01-f11',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'What is wrong with `var x = 1, y = 2;`?',
    options: [
      'var cannot infer int',
      'Multiple vars cannot share one var declaration',
      'Commas are illegal in Java',
      'y must be final',
    ],
    correctOptionIndex: 1,
    explanation:
      'var forbids multi-variable declarations in one statement. Each needs its own `var` line. Inferring int is fine; commas are legal in ordinary `int x = 1, y = 2;`.',
  },
  {
    id: 'ocp-ch01-f12',
    topic: 'Building Blocks',
    difficulty: 'hard',
    questionText: 'When do static initializer blocks run relative to instance creation?',
    options: [
      'Every time before each constructor',
      'Once when the class is first loaded',
      'Only if System.gc() is called',
      'After the constructor',
    ],
    correctOptionIndex: 1,
    explanation:
      'Static blocks run once on class load. Instance initializers and the constructor run per `new`. Mixing those timelines is a top Chapter 1 trap.',
  },
];
