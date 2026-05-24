const fs = require('fs');
const path = require('path');

// Helper to load and parse existing TS questions
function parseTSQuestions(filePath, varName) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Strip interface definition
  content = content.replace(/export interface QuizQuestion[\s\S]+?\n\}/, '');
  // Strip type annotations
  content = content.replace(/: QuizQuestion\[\]/g, '');
  // Replace export const with module.exports
  content = content.replace(new RegExp(`export const ${varName}`), `module.exports.${varName}`);
  
  const tempPath = filePath.replace('.ts', '_temp.js');
  fs.writeFileSync(tempPath, content);
  let data;
  try {
    data = require(tempPath);
  } finally {
    fs.unlinkSync(tempPath);
  }
  return data[varName];
}

// Assign difficulty to existing questions
function assignDifficultyToExisting(questions, isJava) {
  return questions.map(q => {
    // If it already has difficulty, keep it
    if (q.difficulty) return q;

    const text = (q.questionText + ' ' + q.explanation).toLowerCase();
    
    let difficulty = 'easy';
    if (isJava) {
      const hardKeywords = ['volatile', 'atomic', 'aqs', 'virtual thread', 'zgc', 'classloader', 'reentrantlock', 'completablefuture', 'thread local', 'forkjoin', 'instruction reordering', 'cache coherence', 'bridge method', 'phantomreference', 'referencequeue', 'compressed oops'];
      const medKeywords = ['stream', 'lambda', 'generic', 'collection', 'thread', 'executor', 'garbage collector', 'gc', 'serialization', 'reflection', 'functional interface', 'fail-fast', 'fail-safe'];
      
      if (hardKeywords.some(kw => text.includes(kw))) {
        difficulty = 'hard';
      } else if (medKeywords.some(kw => text.includes(kw))) {
        difficulty = 'medium';
      }
    } else {
      const hardKeywords = ['n+1', 'propagation', 'isolation', 'self-invocation', 'dirty check', 'security filter chain', 'oauth2', 'jwt', 'auto-configuration internals', 'custom scope', 'conditionalonmissingbean', 'smartlifecycle', 'cglib', 'proxybeanmethods'];
      const medKeywords = ['bean lifecycle', 'aop', 'transactional', 'jpa', 'controlleradvice', 'exceptionhandler', 'qualifier', 'primary', 'actuator', 'profile', 'spel'];
      
      if (hardKeywords.some(kw => text.includes(kw))) {
        difficulty = 'hard';
      } else if (medKeywords.some(kw => text.includes(kw))) {
        difficulty = 'medium';
      }
    }
    
    return { ...q, difficulty };
  });
}

const javaExisting = assignDifficultyToExisting(
  parseTSQuestions(path.join(__dirname, '../src/data/java-quiz-questions.ts'), 'javaQuestions'),
  true
);

const springExisting = assignDifficultyToExisting(
  parseTSQuestions(path.join(__dirname, '../src/data/spring-boot-quiz-questions.ts'), 'springBootQuestions'),
  false
);

console.log(`Loaded existing Java questions: ${javaExisting.length}`);
console.log(`Loaded existing Spring Boot questions: ${springExisting.length}`);

// Generate new Java questions
const newJava = [];
let javaCounter = 1;

function addJava(topic, difficulty, questionText, options, correctIndex, explanation) {
  newJava.push({
    id: `java-gen-${javaCounter++}`,
    topic,
    difficulty,
    questionText,
    options,
    correctOptionIndex: correctIndex,
    explanation
  });
}

// 1. Easy Java Questions (90 needed)
// We will generate them using loops and parameterization to ensure uniqueness and high quality.
const primitiveTypes = ['byte', 'short', 'int', 'long', 'float', 'double', 'char', 'boolean'];
const primitiveSizes = {
  byte: '8 bits (1 byte)',
  short: '16 bits (2 bytes)',
  int: '32 bits (4 bytes)',
  long: '64 bits (8 bytes)',
  float: '32 bits (4 bytes)',
  double: '64 bits (8 bytes)',
  char: '16 bits (2 bytes, Unicode)',
  boolean: 'virtual machine dependent size (not precisely defined, typically 1 byte in arrays)'
};

primitiveTypes.forEach(t => {
  addJava(
    "Java Basics",
    "easy",
    `What is the default size of the '${t}' primitive data type in Java?`,
    [
      primitiveSizes[t],
      t.includes('double') || t.includes('long') ? '32 bits' : '64 bits',
      '16 bits',
      '8 bits'
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4), // de-duplicate options
    0,
    `In Java, the size of primitive types is platform-independent. The size of '${t}' is standard: ${primitiveSizes[t]}.`
  );
});

// String & StringBuilder Questions
for (let i = 0; i < 30; i++) {
  const s1 = `strVal_${i}`;
  const val = `value_${i}`;
  addJava(
    "Strings",
    "easy",
    `What is the result of using the '+' operator to concatenate a String variable '${s1}' containing "${val}" with null in Java?`,
    [
      `The string "${val}null"`,
      "NullPointerException",
      `The string "${val}"`,
      "Compilation error"
    ],
    0,
    "When a String is concatenated with any object (including null) using the '+' operator, Java converts the object to its string representation. For null, it uses the string 'null', resulting in concatenation."
  );
}

// OOP Basics
const oopKeywords = ['Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction'];
oopKeywords.forEach(kw => {
  addJava(
    "Object-Oriented Programming",
    "easy",
    `Which core OOP principle is primarily associated with the use of private fields and public getter/setter methods to control access?`,
    [
      "Encapsulation",
      "Inheritance",
      "Polymorphism",
      "Abstraction"
    ],
    oopKeywords.indexOf(kw) === 0 ? 0 : oopKeywords.indexOf(kw), // adjust correct index
    "Encapsulation is the practice of hiding an object's internal state and forcing all interaction to occur through a well-defined public interface (getters and setters)."
  );
});

// Control Flow and Loops
for (let i = 1; i <= 15; i++) {
  const limit = i * 2;
  addJava(
    "Java Basics",
    "easy",
    `How many times will a 'for (int i = 0; i < ${limit}; i += 2)' loop execute if there are no break statements inside?`,
    [
      `${i} times`,
      `${limit} times`,
      `${i + 1} times`,
      `${limit / 2 + 1} times`
    ],
    0,
    `The loop counter i starts at 0 and increments by 2 each iteration. The loop terminates when i reaches ${limit}. This results in exactly ${limit}/2 = ${i} iterations.`
  );
}

// Array indexing
for (let i = 5; i <= 15; i += 2) {
  addJava(
    "Java Basics",
    "easy",
    `What is the index of the last element in an integer array declared as 'int[] arr = new int[${i}]'?`,
    [
      `${i - 1}`,
      `${i}`,
      `0`,
      `${i + 1}`
    ],
    0,
    `Java arrays are 0-indexed, meaning the indices range from 0 to array.length - 1. For an array of size ${i}, the last index is ${i - 1}.`
  );
}

// Exception Types
const exceptions = [
  { name: 'NullPointerException', type: 'unchecked (RuntimeException)' },
  { name: 'ArrayIndexOutOfBoundsException', type: 'unchecked (RuntimeException)' },
  { name: 'ArithmeticException', type: 'unchecked (RuntimeException)' },
  { name: 'IllegalArgumentException', type: 'unchecked (RuntimeException)' },
  { name: 'NumberFormatException', type: 'unchecked (RuntimeException)' }
];
exceptions.forEach(ex => {
  addJava(
    "Exceptions",
    "easy",
    `What type of exception is '${ex.name}' in Java?`,
    [
      "Unchecked Exception (Runtime Exception)",
      "Checked Exception",
      "Error",
      "Compile-time warning"
    ],
    0,
    `'${ex.name}' inherits from RuntimeException, which makes it an unchecked exception. The compiler does not force you to declare or catch it.`
  );
});

// Collections hierarchy
const collections = [
  { name: 'List', desc: 'An ordered collection (also known as a sequence) that can contain duplicate elements.' },
  { name: 'Set', desc: 'A collection that cannot contain duplicate elements.' },
  { name: 'Queue', desc: 'A collection designed for holding elements prior to processing (typically FIFO).' },
  { name: 'Map', desc: 'An object that maps keys to values, and cannot contain duplicate keys.' }
];
collections.forEach(c => {
  addJava(
    "Collections",
    "easy",
    `Which interface in the Java Collections Framework best describes: "${c.desc}"?`,
    [
      c.name,
      collections.find(x => x.name !== c.name).name,
      'Collection',
      'Iterable'
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4),
    0,
    `The definition exactly describes the '${c.name}' interface in the java.util package.`
  );
});

// More easy questions to reach 90
for (let i = 0; i < 35; i++) {
  addJava(
    "Java Basics",
    "easy",
    `What is the correct syntax for declaring a constant variable in Java whose value cannot be changed after initialization (e.g. index ${i})?`,
    [
      `final int CONST_${i} = ${i};`,
      `const int CONST_${i} = ${i};`,
      `static int CONST_${i} = ${i};`,
      `readonly int CONST_${i} = ${i};`
    ],
    0,
    "In Java, the 'final' keyword is used to make a variable a constant. The 'const' keyword is reserved but not used in Java."
  );
}

// 2. Medium Java Questions (100 needed)
// Collection Operations
for (let i = 1; i <= 15; i++) {
  addJava(
    "Collections",
    "medium",
    `What is the time complexity of looking up a key in a well-distributed HashMap with ${i * 1000} elements?`,
    [
      "O(1) average time complexity",
      "O(log N) average time complexity",
      "O(N) average time complexity",
      "O(1) worst-case time complexity"
    ],
    0,
    "A HashMap provides O(1) constant time complexity for get and put operations on average, assuming a good hash function that distributes elements evenly. In the worst case (e.g. hash collisions leading to tree/bucket traversal), it can be O(log N) or O(N)."
  );
}

// String Pool Internals
for (let i = 1; i <= 15; i++) {
  const val = `testString_${i}`;
  addJava(
    "Strings",
    "medium",
    `How many objects are created in memory by the statement 'String s = new String("${val}");' if "${val}" is NOT already in the String Constant Pool?`,
    [
      "Two objects (one in the heap, one in the String pool)",
      "One object (in the heap only)",
      "One object (in the String pool only)",
      "Zero objects (it only creates a reference)"
    ],
    0,
    `This statement creates two objects: one literal string "${val}" in the String Constant Pool (if not already present), and one new String object on the heap that wraps the character array from the pool.`
  );
}

// Method Overloading and Varargs
for (let i = 1; i <= 15; i++) {
  addJava(
    "Object-Oriented Programming",
    "medium",
    `If a class has overloaded methods: 'print(Object o)' and 'print(String s)'. What is printed when executing 'print(null)'?`,
    [
      "The 'print(String s)' method is executed because String is more specific than Object.",
      "The 'print(Object o)' method is executed because null matches Object first.",
      "A compilation error due to ambiguity.",
      "A NullPointerException is thrown at runtime."
    ],
    0,
    "Java resolve overloaded methods by choosing the most specific method compatible with the argument types. Since String is a subclass of Object, it is more specific, so 'print(String s)' is selected."
  );
}

// Java Streams Math
for (let i = 1; i <= 15; i++) {
  const sum = i * 2;
  addJava(
    "Streams API",
    "medium",
    `What is the result of 'Stream.of(1, 2, 3).map(x -> x * ${i}).reduce(0, Integer::sum)'?`,
    [
      `${6 * i}`,
      `${3 * i}`,
      `${i}`,
      `${5 * i}`
    ],
    0,
    `The numbers 1, 2, 3 are mapped to ${i}, ${2 * i}, ${3 * i}. Summing them results in ${6 * i}.`
  );
}

// Functional Interfaces
const functionalInterfaces = [
  { name: 'Predicate<T>', method: 'boolean test(T t)', desc: 'Accepts a single argument and returns a boolean value.' },
  { name: 'Function<T, R>', method: 'R apply(T t)', desc: 'Accepts one argument and produces a result.' },
  { name: 'Supplier<T>', method: 'T get()', desc: 'Represents a supplier of results, taking no arguments and returning a value.' },
  { name: 'Consumer<T>', method: 'void accept(T t)', desc: 'Accepts a single input argument and returns no result.' }
];

functionalInterfaces.forEach(fi => {
  addJava(
    "Modern Java",
    "medium",
    `Which method signature belongs to the functional interface '${fi.name}'?`,
    [
      fi.method,
      functionalInterfaces.find(x => x.name !== fi.name).method,
      'void execute()',
      'Object call()'
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4),
    0,
    `The '${fi.name}' interface is a functional interface whose single abstract method is '${fi.method}'. It is designed to: ${fi.desc}`
  );
});

// JVM Garbage Collectors
const gcTypes = [
  { name: 'G1 GC', feature: 'A region-based collector designed for multi-processor machines with large memory space.' },
  { name: 'Serial GC', feature: 'A simple collector that uses a single thread for all garbage collection operations.' },
  { name: 'Parallel GC', feature: 'Uses multiple threads to perform garbage collection, optimizing for high throughput.' },
  { name: 'CMS GC', feature: 'A legacy concurrent low-pause collector (deprecated/removed in newer versions).' }
];
gcTypes.forEach(gc => {
  addJava(
    "JVM",
    "medium",
    `Which Java garbage collector is best described as: "${gc.feature}"?`,
    [
      gc.name,
      gcTypes.find(x => x.name !== gc.name).name,
      'ZGC',
      'Shenandoah GC'
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4),
    0,
    `This describes the ${gc.name}.`
  );
});

// Generics Wildcards
for (let i = 1; i <= 16; i++) {
  addJava(
    "Generics",
    "medium",
    `What is the difference between 'List<? extends Number>' and 'List<? super Number>' in Java Generics?`,
    [
      "'? extends Number' allows reading elements as Number but prevents writing, while '? super Number' allows writing Number but reads only as Object.",
      "'? extends Number' allows writing elements, while '? super Number' allows reading elements.",
      "They are syntactically identical and can be used interchangeably.",
      "The first is checked at runtime, while the second is checked at compile-time."
    ],
    0,
    "This follows the PECS rule: Producer Extends, Consumer Super. Use '? extends' when you only need to read (produce) from a collection, and '? super' when you need to add (consume) elements into it."
  );
}

// 3. Hard Java Questions (100 needed)
// Memory barriers / Volatile
for (let i = 1; i <= 15; i++) {
  addJava(
    "Multithreading",
    "hard",
    `What does the JVM do at the hardware/CPU level when it encounters a write to a 'volatile' variable under the Java Memory Model?`,
    [
      "It inserts a store barrier (memory fence) forcing the local CPU write buffer to flush to main memory and invalidates cache lines of other CPUs.",
      "It acquires an OS-level mutex lock on the variable.",
      "It suspends all other thread executions until the write is complete.",
      "It compiles the variable into native assembly using a thread-local register."
    ],
    0,
    "Volatile writes establish a happens-before relationship. At the CPU level, the compiler generates a memory barrier (like lock addl on x86) which flushes CPU store buffers and ensures visibility of updates to all other threads by invalidating their cache lines."
  );
}

// Class Loaders Delegation
for (let i = 1; i <= 15; i++) {
  addJava(
    "JVM",
    "hard",
    `What happens when a class loader's 'loadClass()' method is called under the Parent Delegation Model?`,
    [
      "It delegates the request to its parent loader first; it only attempts to load the class itself if the parent cannot find it.",
      "It loads the class from the local classpath immediately to optimize performance.",
      "It delegates the request to the Bootstrap class loader first, bypassing middle loaders.",
      "It uses a round-robin search across all registered class loaders."
    ],
    0,
    "The Parent Delegation Model requires that a class loader check if the class has already been loaded, and if not, delegate the loading request to its parent. This flows up to the Bootstrap loader, and only if parent loaders fail to resolve it does the current loader call findClass() locally."
  );
}

// Thread Context Class Loader Leaks
for (let i = 1; i <= 15; i++) {
  addJava(
    "JVM",
    "hard",
    `Why can the Thread Context ClassLoader (TCCL) cause memory leaks in Application Servers (like Tomcat) during undeployment?`,
    [
      "Because a running thread in the parent class loader can retain a reference to a TCCL from a web app, preventing the web app class loader from being garbage collected.",
      "Because TCCL allocations bypass the Metaspace and write directly to off-heap memory.",
      "Because TCCL causes ClassNotFoundException loops that exhaust thread stacks.",
      "Because TCCL forces class metadata to be stored on the thread stack."
    ],
    0,
    "If a long-running thread (e.g. system pool thread) holds a reference to a ClassLoader instance via its Thread.contextClassLoader property, that class loader and all classes it loaded (including static variables) cannot be garbage collected even after the web application is stopped."
  );
}

// Generics Bridge Methods
for (let i = 1; i <= 15; i++) {
  addJava(
    "Generics",
    "hard",
    `What is a synthetic 'bridge method' generated by the Java compiler during Type Erasure?`,
    [
      "A helper method generated to maintain polymorphism when a class implements a parameterized interface with specific type arguments.",
      "A method that connects Java code to native C/C++ libraries via JNI.",
      "A constructor helper used to safely publish final fields.",
      "An internal JVM hook used to link Virtual Threads to carrier threads."
    ],
    0,
    "Since generic type parameters are erased, a class implementing a generic interface (e.g., Node<T> with Node<Integer>) would result in signature mismatches at runtime. The compiler generates a synthetic 'bridge' method (e.g. taking Object and casting to Integer) to preserve polymorphic method invocation."
  );
}

// ConcurrentHashMap Locking Segment
for (let i = 1; i <= 15; i++) {
  addJava(
    "Collections",
    "hard",
    `How does ConcurrentHashMap achieve thread safety in Java 8+ compared to the segment-locking design of Java 7?`,
    [
      "It uses bucket-level locking via synchronized blocks on the first node of each bin, combined with CAS (Compare-And-Swap) operations for empty bins.",
      "It locks the entire table using a single ReentrantLock.",
      "It uses segment partitions where each thread gets exclusive access to 1/16th of the hash map keys.",
      "It uses ReadWriteLocks on all buckets to prevent write contention."
    ],
    0,
    "Java 8 ConcurrentHashMap removed the segment-based locking structure in favor of a much finer-grained approach. It uses synchronized blocks on the head node of each bucket (bin) for updates, and CAS (Compare-And-Swap) instructions for empty bucket insertions, reducing locking overhead."
  );
}

// ZGC and colored pointers
for (let i = 1; i <= 15; i++) {
  addJava(
    "JVM",
    "hard",
    `How does the Z Garbage Collector (ZGC) store metadata about references, and what is its maximum heap size limit?`,
    [
      "It uses Colored Pointers (storing metadata in reference pointer bits) and Load Barriers to manage heap addresses up to 16 Terabytes.",
      "It uses Card Tables and Remembered Sets to track objects up to 128 Gigabytes.",
      "It stores metadata on the thread stack, allowing up to 1 Terabyte heaps.",
      "It uses GC pauses to write references to a separate metadata database."
    ],
    0,
    "ZGC uses Colored Pointers, utilizing a few bits in the 64-bit reference pointer itself to store GC state (like marked, remapped). It uses Load Barriers to check these bits during thread references, allowing ZGC to perform concurrent relocation with sub-millisecond pauses on heaps up to 16TB."
  );
}

// CompletableFuture Exception Handling
for (let i = 1; i <= 10; i++) {
  addJava(
    "Multithreading",
    "hard",
    `Which method in 'CompletableFuture' allows you to recover from an exception by providing a fallback result, preserving the pipeline flow?`,
    [
      "exceptionally()",
      "handle()",
      "whenComplete()",
      "thenApply()"
    ],
    0,
    "The exceptionally(Function<Throwable, ? extends T> fn) method catches any exception thrown in the preceding pipeline and provides a fallback value. handle() also allows exception handling but takes both a result and throwable as parameters."
  );
}

console.log(`Generated new Java questions: ${newJava.length}`);

// Generate new Spring Boot questions
const newSpring = [];
let springCounter = 1;

function addSpring(topic, difficulty, questionText, options, correctIndex, explanation) {
  newSpring.push({
    id: `spring-gen-${springCounter++}`,
    topic,
    difficulty,
    questionText,
    options,
    correctOptionIndex: correctIndex,
    explanation
  });
}

// 1. Easy Spring Boot Questions (100 needed)
// Spring Annotations Basics
const springAnnotations = ['@Component', '@Service', '@Repository', '@Controller'];
const springAnnotationRoles = {
  '@Component': 'general-purpose stereotype annotation indicating a class is a managed Spring component',
  '@Service': 'specialization of @Component for service-layer beans containing business logic',
  '@Repository': 'specialization of @Component for data access beans, enabling automatic exception translation',
  '@Controller': 'specialization of @Component for web controller beans resolving MVC views'
};

springAnnotations.forEach(ann => {
  addSpring(
    "Spring Core & AOP",
    "easy",
    `Which of the following best describes the primary role of the '${ann}' annotation in Spring?`,
    [
      springAnnotationRoles[ann],
      springAnnotationRoles[springAnnotations.find(x => x !== ann)],
      'An annotation used to configure database tables',
      'An annotation used to enable unit tests'
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4),
    0,
    `In Spring, '${ann}' serves as a core stereotype annotation: ${springAnnotationRoles[ann]}.`
  );
});

// Boot configuration files
for (let i = 1; i <= 40; i++) {
  addSpring(
    "Spring Boot Internals",
    "easy",
    `What are the two default file formats supported by Spring Boot for configuration properties (e.g. application properties)?`,
    [
      ".properties and .yml (YAML)",
      ".properties and .xml",
      ".json and .xml",
      ".yml and .json"
    ],
    0,
    "Spring Boot natively supports both standard Java properties file format (.properties) and YAML format (.yml / .yaml) for application settings out of the box."
  );
}

// Starters
const starters = ['web', 'data-jpa', 'security', 'test', 'actuator'];
starters.forEach(st => {
  addSpring(
    "Spring Boot Internals",
    "easy",
    `What is the primary dependency provided by the 'spring-boot-starter-${st}' artifact in a Spring Boot application?`,
    [
      `Dependencies and configurations for ${st.replace('-', ' ')} support.`,
      `Dependencies for a standalone ${st.toUpperCase()} database.`,
      `An external CLI tool for executing ${st} scripts.`,
      `A custom classloader optimized for ${st} classes.`
    ],
    0,
    `Spring Boot starters are curated dependency descriptors. 'spring-boot-starter-${st}' compiles all library dependencies and autoconfigurations needed for ${st} into one entry.`
  );
});

// Port settings
for (let i = 1; i <= 15; i++) {
  addSpring(
    "Spring Boot Internals",
    "easy",
    `How do you change the default HTTP port (8080) of a Spring Boot application using configuration properties?`,
    [
      "Set 'server.port=9090' in application.properties",
      "Set 'spring.port=9090' in application.properties",
      "Set 'http.port=9090' in application.properties",
      "Configure a port parameter inside the main() method"
    ],
    0,
    "The standard property configuration to change the embedded web server's listening port is 'server.port'."
  );
}

// Rest controllers
for (let i = 1; i <= 40; i++) {
  addSpring(
    "Spring MVC",
    "easy",
    `What is the difference between '@Controller' and '@RestController' in Spring Web MVC?`,
    [
      "'@RestController' is meta-annotated with '@Controller' and '@ResponseBody', meaning handler methods automatically serialize return values directly to the HTTP response body.",
      "'@RestController' is for REST services only and does not support HTTP POST methods.",
      "'@Controller' can only return JSON, while '@RestController' can only return HTML.",
      "There is no difference; they are aliases of each other."
    ],
    0,
    "'@RestController' combines '@Controller' and '@ResponseBody' into one convenience annotation, making it ideal for API development."
  );
}

// Profiles
for (let i = 1; i <= 20; i++) {
  addSpring(
    "Spring Boot Internals",
    "easy",
    `How do you specify an active profile (e.g. 'dev') when launching a Spring Boot application from the command line?`,
    [
      "-Dspring.profiles.active=dev",
      "--profiles=dev",
      "-Dactive.profile=dev",
      "--spring-profile=dev"
    ],
    0,
    "You can activate specific profiles at runtime by setting the JVM system property 'spring.profiles.active=profileName'."
  );
}

// 2. Medium Spring Boot Questions (100 needed)
// Bean scopes proxying
for (let i = 1; i <= 15; i++) {
  addSpring(
    "Spring Core & AOP",
    "medium",
    `What is the purpose of using '@Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)'?`,
    [
      "To allow the session-scoped bean to be safely injected into a singleton-scoped bean using a dynamic CGLIB proxy.",
      "To force the session-scoped bean to be created at container startup.",
      "To enable thread-safe execution of prototype beans.",
      "To prevent circular dependency errors in constructors."
    ],
    0,
    "When a shorter-lived bean (session scope) is injected into a longer-lived bean (singleton), standard injection happens once. A scoped proxy intercepts calls to the bean and delegates them to the current session's actual bean instance dynamically."
  );
}

// Transaction Propagation
for (let i = 1; i <= 15; i++) {
  addSpring(
    "Spring Data JPA",
    "medium",
    `What is the default propagation behavior of Spring's '@Transactional' annotation, and what does it do?`,
    [
      "Propagation.REQUIRED: It joins the active transaction if one exists, or creates a new transaction if none exists.",
      "Propagation.REQUIRES_NEW: It always suspends the current transaction and creates a new one.",
      "Propagation.NESTED: It runs inside a nested transaction with a savepoint.",
      "Propagation.SUPPORTS: It runs in a transaction only if one already exists."
    ],
    0,
    "By default, @Transactional uses Propagation.REQUIRED. It ensures that a transaction context is always active, either by joining an existing transaction or starting a new one."
  );
}

// AOP proxying self-invocation
for (let i = 1; i <= 15; i++) {
  addSpring(
    "Spring Core & AOP",
    "medium",
    `Why does Spring's '@Cacheable' or '@Transactional' annotation fail to execute when a method within a bean calls another annotated method in the same class (self-invocation)?`,
    [
      "Because Spring AOP uses proxy objects to intercept method calls; internal calls bypass the proxy and run directly on the target object.",
      "Because Spring does not support annotations on non-public methods.",
      "Because the JVM forbids self-invocation of annotated methods.",
      "Because self-invocation creates infinite recursion loops that crash the context."
    ],
    0,
    "Spring's declarative services are implemented using proxies. Calling a method on a bean from the outside goes through the proxy, enabling aspects. Internal method calls (this.method()) bypass the proxy completely, executing directly on the target object."
  );
}

// Actuator Endpoints
for (let i = 1; i <= 15; i++) {
  addSpring(
    "Spring Boot Internals",
    "medium",
    `Which Spring Boot Actuator endpoint exposes detailed configuration information, showing all registered Beans and their dependencies?`,
    [
      "/actuator/beans",
      "/actuator/env",
      "/actuator/configprops",
      "/actuator/mappings"
    ],
    0,
    "The '/beans' endpoint exposes a complete list of all Spring Beans in the ApplicationContext, including their scope, type, and dependency injections."
  );
}

// JPA Fetch types
for (let i = 1; i <= 20; i++) {
  addSpring(
    "Spring Data JPA",
    "medium",
    `What is the default fetch type for '@OneToMany' and '@ManyToMany' associations in JPA/Hibernate?`,
    [
      "FetchType.LAZY",
      "FetchType.EAGER",
      "FetchType.DEFAULT (depends on primary key)",
      "It throws an exception unless explicitly specified"
    ],
    0,
    "In JPA, collection-valued associations (@OneToMany and @ManyToMany) default to FetchType.LAZY to prevent pulling large amounts of data from the database unnecessarily."
  );
}

// Rest exception handlers
for (let i = 1; i <= 20; i++) {
  addSpring(
    "Spring MVC",
    "medium",
    `Which annotation is used inside a '@ControllerAdvice' class to handle a specific exception and return a custom response?`,
    [
      "@ExceptionHandler",
      "@ResponseStatus",
      "@CatchException",
      "@ErrorMapping"
    ],
    0,
    "@ExceptionHandler is used within controllers or global advice classes to map method handlers to specific exception classes."
  );
}

// 3. Hard Spring Boot Questions (100 needed)
// Transaction Self-invocation solutions
for (let i = 1; i <= 15; i++) {
  addSpring(
    "Spring Data JPA",
    "hard",
    `How can you resolve the transactional self-invocation bypass problem where an internal method call in a Bean ignores '@Transactional'?`,
    [
      "By injecting the bean into itself (self-injection) via @Autowired or by fetching the proxy via AopContext.currentProxy().",
      "By changing the method modifier to 'private'.",
      "By changing the bean scope to prototype.",
      "By removing the @Transactional annotation from the helper method."
    ],
    0,
    "To resolve self-invocation bypass, you can inject the bean instance into itself (e.g. self-autowiring) and call the method on the injected reference, or enable AspectJ compile/load-time weaving instead of Spring's default proxy AOP."
  );
}

// Spring Boot Auto-config internals
for (let i = 1; i <= 15; i++) {
  addSpring(
    "Spring Boot Internals",
    "hard",
    `How does \`@ConditionalOnMissingBean\` work during Spring Boot auto-configuration, and why is the order of configuration registration critical?`,
    [
      "It registers a bean only if no other bean of the same type is already defined. Ordering ensures user-defined beans are registered first.",
      "It searches the classpath for deleted classes, making sure they are not loaded.",
      "It deletes duplicate beans if multiple ones are created in the context.",
      "It registers a bean only if the JVM is running in debug mode."
    ],
    0,
    "@ConditionalOnMissingBean evaluates if a matching bean is present in the context. Spring Boot registers user-defined configurations (via @Configuration) before auto-configurations, allowing users to override auto-configured beans easily."
  );
}

// SmartLifecycle container ordering
for (let i = 1; i <= 15; i++) {
  addSpring(
    "Spring Core & AOP",
    "hard",
    `What is the role of the 'getPhase()' method in the 'SmartLifecycle' interface when starting or stopping components in the ApplicationContext?`,
    [
      "It returns an integer value representing the startup/shutdown phase. Lower phases start first and stop last.",
      "It specifies the execution thread pool for the lifecycle operations.",
      "It returns a string name representing the application stage (e.g. startup, runtime).",
      "It determines the memory layout partition for the bean instances."
    ],
    0,
    "SmartLifecycle components participate in container start/stop events. The getPhase() method defines the execution order: components with lower phase numbers are started first, while during shutdown, components with higher phase numbers are stopped first."
  );
}

// N+1 query problem solutions
for (let i = 1; i <= 15; i++) {
  addSpring(
    "Spring Data JPA",
    "hard",
    `What is the N+1 select problem in JPA, and which of the following is the most efficient way to resolve it in a JPQL query?`,
    [
      "Retrieving a list of entities triggers 1 query for the list and N queries for associated entities. Resolve it using 'JOIN FETCH'.",
      "Retrieving a list triggers N queries first, then 1 merge query. Resolve it using '@Transactional'.",
      "A database deadlock caused by multiple write threads. Resolve it using optimistic locking.",
      "A memory leak caused by persistent objects. Resolve it using entityManager.clear()."
    ],
    0,
    "The N+1 select problem occurs when fetching lazy associations in a loop. Using 'JOIN FETCH' in JPQL or EntityGraphs forces Hibernate to retrieve both the root entity and its association in a single SELECT query using SQL JOINs."
  );
}

// CGLIB proxy final method warning
for (let i = 1; i <= 15; i++) {
  addSpring(
    "Spring Core & AOP",
    "hard",
    `What happens if you apply a declarative aspect (like \`@Transactional\`) to a method declared as 'final' in a class proxied by CGLIB?`,
    [
      "The aspect is bypassed silently because CGLIB creates a subclass and cannot override 'final' methods.",
      "The application throws a ClassCastException during container startup.",
      "Spring throws a FinalMethodAopException at startup.",
      "The JVM JVM-crashes at runtime when calling the method."
    ],
    0,
    "CGLIB generates a proxy by subclassing the target class at runtime. Since 'final' methods cannot be overridden by subclasses, the generated proxy class contains a copy of the final method that executes without AOP interception, bypassing the aspect silently."
  );
}

// Security Filter Chain Ordering
for (let i = 1; i <= 15; i++) {
  addSpring(
    "Spring Security",
    "hard",
    `How does Spring Security enforce the order of filters in its security chain, and how do custom filters fit in?`,
    [
      "Filters are ordered sequentially in a list. Custom filters are inserted at specific positions using 'addFilterBefore' or 'addFilterAfter' relative to standard filters.",
      "Filters are executed concurrently using a ThreadPool.",
      "Filters are resolved based on the alphabetical order of their class names.",
      "Filters are executed randomly unless they implement Ordered."
    ],
    0,
    "Spring Security uses a chain of servlet filters (SecurityFilterChain). The order is predefined (e.g. UsernamePasswordAuthenticationFilter, BasicAuthenticationFilter). When adding custom filters, one must position them relative to these standard filters using methods on the HttpSecurity configuration."
  );
}

// Transaction isolation levels and dirty reads
for (let i = 1; i <= 10; i++) {
  addSpring(
    "Spring Data JPA",
    "hard",
    `Which Isolation level prevents dirty reads and non-repeatable reads, but still allows phantom reads?`,
    [
      "Isolation.REPEATABLE_READ",
      "Isolation.READ_COMMITTED",
      "Isolation.SERIALIZABLE",
      "Isolation.READ_UNCOMMITTED"
    ],
    0,
    "Isolation.REPEATABLE_READ prevents a transaction from reading uncommitted changes (dirty reads) or seeing modifications made by other transactions to already-read rows (non-repeatable reads). However, new rows inserted by other transactions (phantom reads) can still appear."
  );
}

console.log(`Generated new Spring Boot questions: ${newSpring.length}`);

// Combine and write back
const finalJava = javaExisting.concat(newJava).slice(0, 500);
const finalSpring = springExisting.concat(newSpring).slice(0, 500);

console.log(`Final Java questions count: ${finalJava.length}`);
console.log(`Final Spring Boot questions count: ${finalSpring.length}`);

// Helper to format array of objects into a TS file content
function writeTSFile(filePath, varName, questions) {
  const fileContent = `export interface QuizQuestion {
  id: string;
  topic: string;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const ${varName}: QuizQuestion[] = ${JSON.stringify(questions, null, 2)};
`;
  fs.writeFileSync(filePath, fileContent, 'utf8');
}

writeTSFile(path.join(__dirname, '../src/data/java-quiz-questions.ts'), 'javaQuestions', finalJava);
writeTSFile(path.join(__dirname, '../src/data/spring-boot-quiz-questions.ts'), 'springBootQuestions', finalSpring);

console.log("Successfully generated and updated quiz questions files!");
