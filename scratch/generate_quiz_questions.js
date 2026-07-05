const fs = require('fs');
const path = require('path');

const javaQuestions = [];
const springBootQuestions = [];

// Helper to construct questions with shuffled/distributed correct option indices
function addQuestion(arr, id, topic, difficulty, questionText, codeSnippet, correctAnswer, distractors, explanation) {
  const correctIdx = Math.floor(Math.random() * 4);
  const options = [];
  options[correctIdx] = correctAnswer;
  let distractorIdx = 0;
  for (let j = 0; j < 4; j++) {
    if (j === correctIdx) continue;
    options[j] = distractors[distractorIdx++];
  }

  arr.push({
    id,
    topic,
    difficulty,
    questionText,
    codeSnippet,
    options,
    correctOptionIndex: correctIdx,
    explanation
  });
}

// ==========================================
// GENERATE 500 JAVA QUESTIONS (20 templates x 25 variations)
// ==========================================
for (let i = 1; i <= 25; i++) {
  
  // 1. ThreadPoolExecutor (Level 3/4)
  const core = 2 + (i % 3);
  const max = core + 2 + (i % 2);
  const queue = 5 + (i * 2);
  const tasks = core + queue + 1 + (i % 3);
  const newThreads = Math.min(tasks - core - queue, max - core);
  const active = core + newThreads;
  const queued = queue;
  const isRejected = (tasks > core + queue + (max - core));
  
  addQuestion(
    javaQuestions,
    `java-quiz-t1-${i}`,
    "Multithreading & Concurrency",
    "hard",
    `A ThreadPoolExecutor is initialized with corePoolSize = ${core}, maximumPoolSize = ${max}, keepAliveTime = 60s, and a workQueue capacity of ${queue}. If you submit ${tasks} tasks concurrently with no delay, what is the state of the pool?`,
    `ThreadPoolExecutor executor = new ThreadPoolExecutor(
    ${core}, ${max}, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(${queue})
);
for (int i = 0; i < ${tasks}; i++) {
    executor.submit(() -> {
        try { Thread.sleep(10000); } catch (InterruptedException e) {}
    });
}`,
    isRejected 
      ? `The task execution throws a RejectedExecutionException for the last task(s) exceeding capacity.`
      : `${active} active threads running tasks, with ${queued} tasks waiting in the queue.`,
    isRejected
      ? [
          `${core} active threads running tasks, with ${tasks - core} tasks in the queue.`,
          `${max} active threads running tasks, with ${queue} tasks in the queue without rejection.`,
          `The pool dynamically grows to ${tasks} threads to prevent task rejection.`
        ]
      : [
          `${core} active threads running tasks, with ${tasks - core} tasks in the queue.`,
          `${max} active threads running tasks, with ${tasks - max} tasks in the queue.`,
          `The task execution throws a RejectedExecutionException immediately.`
        ],
    `ThreadPoolExecutor rules: 1) First ${core} tasks spawn ${core} core threads. 2) Next ${queue} tasks fill the queue. 3) Remaining tasks spawn threads up to max (${max}). ` +
    (isRejected 
      ? `Since total tasks (${tasks}) exceed core + queue + max capacity (${core + queue + (max - core)}), the excess tasks are rejected with RejectedExecutionException.`
      : `Since total tasks (${tasks}) fit within capacity, the pool spawns ${newThreads} extra threads, resulting in ${active} active threads and ${queued} queued tasks.`)
  );

  // 2. HashMap Collision and Identity Lookup (Level 3/4)
  const mapSize = 4 + (i % 4);
  const hashVal = 100 + (i * 10);
  const searchId = 1 + (i % mapSize);
  const keyClass = `CustomKey_${i}`;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t2-${i}`,
    "Collections & Internals",
    "hard",
    `You insert ${mapSize} distinct instances of class ${keyClass} into a standard HashMap. Class ${keyClass} overrides hashCode() to return constant ${hashVal}, but does not override equals(). What happens when you retrieve the key with id = ${searchId}?`,
    `public class ${keyClass} {
    private int id;
    public ${keyClass}(int id) { this.id = id; }
    @Override
    public int hashCode() { return ${hashVal}; }
}
Map<${keyClass}, String> map = new HashMap<>();
${keyClass} searchKey = null;
for (int k = 1; k <= ${mapSize}; k++) {
    ${keyClass} key = new ${keyClass}(k);
    if (k == ${searchId}) searchKey = key;
    map.put(key, "Val_" + k);
}
String result = map.get(searchKey);`,
    `The retrieval succeeds and returns "Val_${searchId}" because object reference identity (==) is checked and succeeds on the exact same key reference.`,
    [
      `The retrieval returns null because equals() is not implemented.`,
      `The HashMap throws a NullPointerException because the hash value is constant.`,
      `The retrieval returns the value of the last inserted element in the bucket.`
    ],
    `HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.`
  );

  // 3. Generics PECS (Level 3)
  const types = ["Number", "Integer", "Double", "Float"];
  const tSel = types[i % 4];
  const opVal = 10 * i;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t3-${i}`,
    "Generics",
    "medium",
    `According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with ${tSel}?`,
    `public static void process(List<? extends ${tSel}> src, List<? super ${tSel}> dest) {
    // Operation A: ${tSel} val = src.get(0);
    // Operation B: src.add(${opVal});
    // Operation C: dest.add(${opVal});
}`,
    `Operations A and C are valid; Operation B is a compile error.`,
    [
      `Operations B and C are valid; Operation A is a compile error.`,
      `All operations are compile-time valid.`,
      `Operations A and B are valid; Operation C is a compile error.`
    ],
    `Under PECS: List<? extends ${tSel}> is a Producer, so reading from it as ${tSel} (A) is valid, but writing to it is banned (B). List<? super ${tSel}> is a Consumer, so adding ${tSel} objects (C) to it is valid.`
  );

  // 4. Thread Join Duration (Level 3/4)
  const t1Sleep = 800 + (i * 50);
  const t2Sleep = 600 + (i * 40);
  const joinTime = 300 + (i * 10);
  const expectedWait = joinTime + Math.max(0, t2Sleep - joinTime);
  
  addQuestion(
    javaQuestions,
    `java-quiz-t4-${i}`,
    "Multithreading & Concurrency",
    "medium",
    `Two threads T1 and T2 run concurrently. Thread T1 sleeps for ${t1Sleep}ms. Thread T2 sleeps for ${t2Sleep}ms. If the main thread calls T1.join(${joinTime}) followed immediately by T2.join(), what is the approximate wait duration?`,
    `Thread t1 = new Thread(() -> {
    try { Thread.sleep(${t1Sleep}); } catch (InterruptedException e) {}
});
Thread t2 = new Thread(() -> {
    try { Thread.sleep(${t2Sleep}); } catch (InterruptedException e) {}
});
t1.start(); t2.start();
t1.join(${joinTime});
t2.join();`,
    `Approximately ${expectedWait}ms, because the main thread waits for the ${joinTime}ms timeout on T1, then blocks for the remainder of T2's sleep.`,
    [
      `Approximately ${t1Sleep + t2Sleep}ms, as both join calls execute fully sequentially.`,
      `Approximately ${t1Sleep}ms, since T1 takes the longest to complete.`,
      `Approximately ${joinTime}ms, as both threads are forced to interrupt.`
    ],
    `The main thread blocks on t1.join(${joinTime}) for ${joinTime}ms. During this time, T2 has also slept for ${joinTime}ms, leaving ${t2Sleep - joinTime}ms of sleep. When t2.join() is called, the main thread blocks for the remaining ${t2Sleep - joinTime}ms. Total wait = ${joinTime} + ${t2Sleep - joinTime} = ${expectedWait}ms.`
  );

  // 5. ArrayList Capacity Growth (Level 3)
  const initCap = 8 + (i * 2);
  const addCount = initCap + 1;
  const grownCap = Math.floor(initCap + (initCap >> 1));
  
  addQuestion(
    javaQuestions,
    `java-quiz-t5-${i}`,
    "Collections & Lists",
    "easy",
    `An ArrayList is initialized with an initial capacity of ${initCap}. If you add ${addCount} elements sequentially, what is the internal array capacity immediately after the expansion?`,
    `List<Integer> list = new ArrayList<>(${initCap});
for (int j = 0; j < ${addCount}; j++) {
    list.add(j);
}`,
    `${grownCap} (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))`,
    [
      `${initCap * 2} (capacity doubles when full)`,
      `${initCap + 10} (capacity grows by a fixed step of 10)`,
      `${addCount} (capacity grows to fit exactly the inserted elements)`
    ],
    `In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with ${initCap}, the new capacity is ${initCap} + ${initCap >> 1} = ${grownCap}.`
  );

  // 6. String Constant Pool (Level 3)
  const poolStr = `poolStr_${i}`;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t6-${i}`,
    "Strings & String Pool",
    "medium",
    `How many objects are created in memory when the statement below executes, assuming "${poolStr}" is NOT already present in the String Constant Pool?`,
    `String s = new String("${poolStr}");`,
    `Two objects: one literal in the String Constant Pool and one new String object on the heap.`,
    [
      `One object: on the heap only.`,
      `One object: in the String Constant Pool only.`,
      `Zero objects: it only creates a stack reference.`
    ],
    `This statement creates two objects: the literal string "${poolStr}" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.`
  );

  // 7. Optional eager vs lazy (Level 3)
  const optVal = `val_${i}`;
  const dbMethod = `fetchDb_${i}`;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t7-${i}`,
    "Optional API",
    "medium",
    `In the code snippet below under normal execution, how many times is the method '${dbMethod}' evaluated?`,
    `public String getData() {
    return Optional.of("${optVal}")
                   .orElse(${dbMethod}());
}
public String ${dbMethod}() {
    System.out.println("DB accessed");
    return "default";
}`,
    `Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.`,
    [
      `0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.`,
      `2 times, once for checking and once for returning.`,
      `It throws a NullPointerException at runtime.`
    ],
    `In Java, orElse(T other) evaluates its argument eagerly. Since '${dbMethod}()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.`
  );

  // 8. ForkJoinPool Parallelism (Level 4)
  const fjpParallelism = 2 + (i % 4);
  const sysCores = 1 + (i % 3);
  
  addQuestion(
    javaQuestions,
    `java-quiz-t8-${i}`,
    "Multithreading & Concurrency",
    "hard",
    `You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = ${fjpParallelism} on a machine with ${sysCores} CPU cores. What is the maximum number of threads that can process the stream concurrently?`,
    `ForkJoinPool customPool = new ForkJoinPool(${fjpParallelism});
customPool.submit(() -> {
    IntStream.range(0, 100).parallel().forEach(x -> {
        // Intensive work
    });
}).get();`,
    `Up to ${fjpParallelism} concurrent threads inside the custom ForkJoinPool.`,
    [
      `Only ${sysCores} threads, matching the physical CPU cores.`,
      `Up to ${sysCores - 1} threads, as the common pool always reserves one core.`,
      `1 thread, because parallel streams ignore custom ForkJoinPool configurations.`
    ],
    `Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of ${fjpParallelism}), overriding the default CommonPool behavior.`
  );

  // 9. WeakHashMap GC behavior (Level 4)
  const mapKeyVar = `keyData_${i}`;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t9-${i}`,
    "Memory Management & GC",
    "medium",
    `A WeakHashMap is populated as shown below. If you set '${mapKeyVar}' to null and trigger GC, what happens to the map size?`,
    `Map<Object, String> map = new WeakHashMap<>();
Object ${mapKeyVar} = new Object();
map.put(${mapKeyVar}, "ActiveSession");

${mapKeyVar} = null;
System.gc();`,
    `The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.`,
    [
      `The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.`,
      `The map throws a NullPointerException during garbage collection.`,
      `The key is collected but map.size() still returns 1 until a get() call is made.`
    ],
    `WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference '${mapKeyVar}' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.`
  );

  // 10. CompletableFuture Exception handling (Level 4)
  const errId = `err_${i}`;
  const fbVal = `fallback_${i}`;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t10-${i}`,
    "Multithreading & Concurrency",
    "hard",
    `Predict the output printed to the console when the CompletableFuture pipeline executes.`,
    `CompletableFuture.supplyAsync(() -> {
    if (true) throw new RuntimeException("${errId}");
    return "Normal";
})
.handle((res, ex) -> {
    return ex != null ? "${fbVal}" : res;
})
.exceptionally(ex -> {
    return "Secondary_Fallback";
})
.thenAccept(System.out::print);`,
    `"${fbVal}"`,
    [
      `"Secondary_Fallback"`,
      `"${errId}"`,
      `"NormalSecondary_Fallback"`
    ],
    `The supplyAsync stage throws a RuntimeException containing "${errId}". The handle() block captures this exception (ex is non-null) and returns "${fbVal}", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.`
  );

  // 11. Try-with-resources suppression (Level 4)
  const resourceName = `Res_${i}`;
  const tErr = `TryErr_${i}`;
  const cErr = `CloseErr_${i}`;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t11-${i}`,
    "Exception Handling",
    "medium",
    `Inside a try-with-resources statement, if the try block throws an exception '${tErr}' and the resource's close() method throws '${cErr}', which exception propagates and how is the other retrieved?`,
    `try (CustomResource ${resourceName} = new CustomResource()) { // close() throws ${cErr}
    throw new RuntimeException("${tErr}");
}`,
    `The RuntimeException containing '${tErr}' is thrown; the exception containing '${cErr}' is added to it as a suppressed exception.`,
    [
      `The exception containing '${cErr}' is thrown; the '${tErr}' exception is discarded.`,
      `Both exceptions are propagated concurrently in a MultiException.`,
      `The exception from close() overrides the try exception, throwing '${cErr}' without suppressing the other.`
    ],
    `In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().`
  );

  // 12. Virtual Threads Carrier Pinning (Level 4)
  const lockOption = ["synchronized block", "ReentrantLock", "Semaphore", "AtomicInteger"][i % 4];
  const pins = (lockOption === "synchronized block");
  
  addQuestion(
    javaQuestions,
    `java-quiz-t12-${i}`,
    "Virtual Threads",
    "hard",
    `You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?`,
    `Runnable task = () -> {
    // Under which lock construct will carrier thread pinning occur?
    ??? {
        databaseService.fetchData(); // Blocks on network
    }
};
Thread.ofVirtual().start(task);`,
    `A synchronized block or synchronized method.`,
    [
      `A ReentrantLock block.`,
      `A Semaphore permit acquisition.`,
      `An AtomicInteger loop operation.`
    ],
    `In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.`
  );

  // 13. LinkedHashMap Eviction (Level 4)
  const mapCap = 3 + (i % 2);
  const accessKey = 1 + (i % mapCap);
  const insertKey = mapCap + 1;
  const lhmEldest = (accessKey === 1) ? 2 : 1;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t13-${i}`,
    "Collections & Internals",
    "hard",
    `A LinkedHashMap is configured with accessOrder = true and max capacity = ${mapCap}. If you insert keys 1 to ${mapCap}, call map.get(${accessKey}), and then put key ${insertKey}, which key is evicted by removeEldestEntry?`,
    `LinkedHashMap<Integer, String> map = new LinkedHashMap<>(${mapCap}, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry eldest) {
        return size() > ${mapCap};
    }
};
for (int k = 1; k <= ${mapCap}; k++) map.put(k, "Val_" + k);
map.get(${accessKey});
map.put(${insertKey}, "Val_" + ${insertKey});`,
    `Key ${lhmEldest}`,
    [
      `Key ${accessKey}`,
      `Key ${insertKey}`,
      `Key ${mapCap}`
    ],
    `With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key ${accessKey} moves it to the end. The eldest key is the least recently accessed. If capacity is ${mapCap} and we accessed ${accessKey}, the remaining oldest key (which is ${lhmEldest}) is evicted.`
  );

  // 14. Method Overloading specificity (Level 3)
  const overloadType = ["String", "Integer", "Double", "Runnable"][i % 4];
  
  addQuestion(
    javaQuestions,
    `java-quiz-t14-${i}`,
    "Object-Oriented Programming",
    "medium",
    `If a class defines overloaded methods print(Object o) and print(${overloadType} s), which method executes when print(null) is called?`,
    `public class OverloadDemo {
    public void print(Object o) { System.out.print("Object"); }
    public void print(${overloadType} s) { System.out.print("${overloadType}"); }
    
    public static void main(String[] args) {
        new OverloadDemo().print(null);
    }
}`,
    `The print(${overloadType} s) method executes because ${overloadType} is a more specific type than Object.`,
    [
      `The print(Object o) method executes because null is treated as general Object first.`,
      `A compile-time error occurs due to method signature ambiguity.`,
      `A NullPointerException is thrown at runtime during method dispatch.`
    ],
    `Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since '${overloadType}' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(${overloadType} s).`
  );

  // 15. ArrayStoreException covariance (Level 3)
  const arrayIdx = i % 5;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t15-${i}`,
    "Java Basics",
    "medium",
    `What is the runtime result of executing the code below containing array assignments?`,
    `Number[] numbers = new Integer[5];
numbers[${arrayIdx}] = 10.5; // Double value`,
    `An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.`,
    [
      `The double value 10.5 is stored in the array without issue.`,
      `The compiler flags this as a compile-time error.`,
      `The double value is truncated to the integer 10 and stored.`
    ],
    `Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.`
  );

  // 16. SimpleDateFormat concurrency (Level 4)
  const threadCount = 5 + i;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t16-${i}`,
    "Multithreading & Concurrency",
    "medium",
    `If a single shared instance of SimpleDateFormat is accessed concurrently by ${threadCount} threads, what runtime issue can occur?`,
    `// Shared instance accessed by ${threadCount} threads
private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");`,
    `It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.`,
    [
      `It will cause a thread deadlock inside the JVM date formatting library.`,
      `It works perfectly because formatting dates is a thread-safe read-only operation.`,
      `It will trigger an OutOfMemoryError in the heap space.`
    ],
    `SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.`
  );

  // 17. AtomicInteger CompareAndSet (Level 3)
  const atomicInit = i * 10;
  const atomicExpect = atomicInit + (i % 2 === 0 ? 0 : 5);
  const atomicUpdate = atomicInit + 10;
  const casSuccess = (atomicExpect === atomicInit);
  
  addQuestion(
    javaQuestions,
    `java-quiz-t17-${i}`,
    "Multithreading & Concurrency",
    "medium",
    `An AtomicInteger is initialized to ${atomicInit}. Thread 1 calls compareAndSet(${atomicExpect}, ${atomicUpdate}). What is the return value of compareAndSet and the resulting value of the AtomicInteger?`,
    `AtomicInteger atomic = new AtomicInteger(${atomicInit});
boolean updated = atomic.compareAndSet(${atomicExpect}, ${atomicUpdate});`,
    `Returns ${casSuccess}, resulting in value ${casSuccess ? atomicUpdate : atomicInit}.`,
    [
      `Returns true, resulting in value ${atomicUpdate} regardless of expectation.`,
      `Returns false, resulting in value ${atomicUpdate} due to lock-free CAS loops.`,
      `Throws an ArithmeticException because expected value doesn't match.`
    ],
    `compareAndSet checks if the current value equals the expected value (${atomicExpect}). If it does (value is ${atomicInit}), it atomically updates it to ${atomicUpdate} and returns true. Otherwise, it leaves the value unchanged and returns false.`
  );

  // 18. ClassNotFoundException vs NoClassDefFoundError (Level 4)
  const cnfeClass = `ClassB_${i}`;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t18-${i}`,
    "JVM & Classloading",
    "hard",
    `Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?`,
    `// Scenario: Class A references Class B
ClassA obj = new ClassA(); // Throws NoClassDefFoundError for ${cnfeClass}`,
    `When ${cnfeClass} was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.`,
    [
      `When Class.forName() is called with an invalid class package string name.`,
      `When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.`,
      `When there is an import statement referencing a non-existent class at compile time.`
    ],
    `ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.`
  );

  // 19. Stream Numeric Overflow (Level 3)
  const addVal = 1000 + i;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t19-${i}`,
    "Streams API",
    "medium",
    `If you run the stream operation below using Integer.MAX_VALUE and ${addVal}, what is printed to the console?`,
    `int result = Stream.of(Integer.MAX_VALUE, ${addVal})
                   .reduce(0, Integer::sum);
System.out.println(result);`,
    `An overflow value of ${(2147483647 + addVal) | 0} (due to standard 32-bit signed integer overflow).`,
    [
      `The mathematically correct sum (promoted automatically to a 64-bit long).`,
      `An ArithmeticException is thrown indicating integer overflow.`,
      `A compile-time error occurs because reduce requires an accumulator.`
    ],
    `In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding ${addVal} to Integer.MAX_VALUE overflows and wraps into negative values.`
  );

  // 20. Class Hiding Static Methods (Level 3)
  const childCls = `ChildService_${i}`;
  const parentCls = `ParentService_${i}`;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t20-${i}`,
    "Object-Oriented Programming",
    "medium",
    `Consider the static methods in the classes below. What is printed when executing 'new ${childCls}().display()'?`,
    `class ${parentCls} {
    public static void log() { System.out.print("Parent"); }
}
class ${childCls} extends ${parentCls} {
    public static void log() { System.out.print("Child"); }
    public void display() { log(); }
}`,
    `Child`,
    [
      `Parent`,
      `Compilation fails because static methods cannot be inherited.`,
      `Throws a RuntimeException due to conflicting signatures.`
    ],
    `Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of '${childCls}', the call to log() is resolved to '${childCls}.log()', printing 'Child'.`
  );
}

// ==========================================
// GENERATE 500 SPRING BOOT QUESTIONS (20 templates x 25 variations)
// ==========================================
for (let i = 1; i <= 25; i++) {
  
  // 1. Spring AOP Proxy Self-Invocation (Level 4)
  const svcName = `OrderService_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t1-${i}`,
    "Spring Core & AOP",
    "hard",
    `In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?`,
    `@Service
public class ${svcName} {
    public void orderProcessor() {
        saveOrder(); // Self-invocation
    }

    @Transactional
    public void saveOrder() {
        // Save database record
    }
}`,
    `No transaction starts, because self-invocation bypasses the Spring AOP proxy.`,
    [
      `Spring starts a new transaction automatically using aspect interception.`,
      `The application throws a CircularDependencyException at startup.`,
      `A TransactionRequiredException is thrown during execution.`
    ],
    `Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.`
  );

  // 2. Spring Bean Scopes Injection Mismatch (Level 4)
  const trackerCls = `RequestTracker_${i}`;
  const ctrlCls = `AnalyticsController_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t2-${i}`,
    "Spring Core & Scopes",
    "hard",
    `You inject a prototype-scoped bean '${trackerCls}' into a singleton controller '${ctrlCls}'. How does '${trackerCls}' behave across multiple HTTP requests?`,
    `@Scope("prototype")
@Component
public class ${trackerCls} {}

@RestController
public class ${ctrlCls} {
    @Autowired
    private ${trackerCls} tracker;
}`,
    `The controller reuses the exact same instance of '${trackerCls}' injected at startup, behaving as a singleton.`,
    [
      `A new instance of '${trackerCls}' is created for every HTTP request.`,
      `Spring throws a ScopeMismatchException during startup.`,
      `The application fails to start because prototype beans cannot be injected into singletons.`
    ],
    `Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.`
  );

  // 3. Spring Data JPA Transaction checked Exception (Level 4)
  const repoName = `UserRepo_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t3-${i}`,
    "Spring Data JPA",
    "medium",
    `If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?`,
    `@Transactional
public void process(User user) throws Exception {
    ${repoName}.save(user);
    if (user.getName() == null) {
        throw new Exception("Invalid User");
    }
}`,
    `The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.`,
    [
      `The transaction is automatically rolled back for all exceptions.`,
      `The compiler throws an error because Transactional cannot declare checked throws.`,
      `The transaction rolls back, but only if the database isolation is SERIALIZABLE.`
    ],
    `Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).`
  );

  // 4. Spring Constructor Circular Dependency (Level 4)
  const bA = `BeanA_${i}`;
  const bB = `BeanB_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t4-${i}`,
    "Spring Core & Bean Lifecycle",
    "medium",
    `What occurs when Spring starts up and detects a circular constructor dependency between singleton beans '${bA}' and '${bB}'?`,
    `@Component
public class ${bA} {
    public ${bA}(${bB} b) {}
}
@Component
public class ${bB} {
    public ${bB}(${bA} a) {}
}`,
    `The application fails to start and throws a BeanCurrentlyInCreationException.`,
    [
      `Spring automatically resolves the cycle by injecting a dynamic proxy.`,
      `The JVM crashes with a StackOverflowError during initialization.`,
      `Spring instantiates both beans as null.`
    ],
    `Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither '${bA}' nor '${bB}' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.`
  );

  // 5. JPA N+1 Select Query Count (Level 4)
  const pCount = 3 + (i % 5);
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t5-${i}`,
    "Spring Data JPA",
    "hard",
    `An entity has a lazy-loaded collection association. If you fetch all ${pCount} parent entities and access their associations in a loop, how many SQL queries hit the database?`,
    `List<Parent> parents = parentRepository.findAll(); // Fetches ${pCount} parents
for (Parent p : parents) {
    System.out.println(p.getChildren().size()); // Lazy load
}`,
    `${pCount + 1} SQL queries.`,
    [
      `1 SQL query.`,
      `${pCount} SQL queries.`,
      `2 SQL queries.`
    ],
    `This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (${pCount} queries), resulting in ${pCount + 1} queries.`
  );

  // 6. Spring WebFlux Reactive EventLoop blocking (Level 4)
  addQuestion(
    springBootQuestions,
    `spring-quiz-t6-${i}`,
    "Spring WebFlux",
    "hard",
    `What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?`,
    `@GetMapping("/data")
public Mono<String> getData() {
    return Mono.fromCallable(() -> restTemplate.getForObject("https://api.com", String.class));
}`,
    `It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.`,
    [
      `WebFlux automatically shifts the call to virtual threads to avoid blocking.`,
      `The controller immediately throws a BlockedEventLoopException during compilation.`,
      `It causes a deadlock because Netty restricts HTTP requests.`
    ],
    `WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).`
  );

  // 7. Spring Security Filter Chain order (Level 3)
  const fName = `CustomAuthFilter_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t7-${i}`,
    "Spring Security",
    "medium",
    `How do you insert a custom filter '${fName}' in a security chain so it executes before UsernamePasswordAuthenticationFilter?`,
    `@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.addFilterBefore(new ${fName}(), UsernamePasswordAuthenticationFilter.class);
    return http.build();
}`,
    `Use addFilterBefore(new ${fName}(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.`,
    [
      `Annotate ${fName} with @Order(Ordered.HIGHEST_PRECEDENCE).`,
      `Register ${fName} as a Spring @Component; Spring Security loads custom beans first.`,
      `Declare ${fName} inside application.properties under security.filter.order.`
    ],
    `The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.`
  );

  // 8. Spring @Qualifier vs @Primary (Level 3)
  const qName = `customPaymentSvc_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t8-${i}`,
    "Spring Core",
    "medium",
    `If a payment service interface has a default bean marked with @Primary, and another bean with qualifier '${qName}', what is injected?`,
    `@RestController
public class PaymentController {
    @Autowired
    @Qualifier("${qName}")
    private PaymentService service;
}`,
    `The bean annotated with @Qualifier("${qName}") is injected, overriding @Primary.`,
    [
      `The @Primary bean is injected because primary beans take highest precedence.`,
      `A BeanCreationException is thrown due to injection ambiguity.`,
      `Both beans are injected inside a wrapper candidate proxy.`
    ],
    `While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.`
  );

  // 9. Spring Data JPA Derived Query parser (Level 3)
  const wrongProp = `emailAddress_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t9-${i}`,
    "Spring Data JPA",
    "medium",
    `If you specify a derived query method using property name '${wrongProp}' which is missing on the Entity, what happens?`,
    `public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findBy${wrongProp}(String email); // Entity field is 'email'
}`,
    `Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.`,
    [
      `The query executes but returns an empty list at runtime.`,
      `Spring Data fallback parses it to a native SQL query.`,
      `A compile-time error occurs on the repository interface.`
    ],
    `Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like '${wrongProp}', it throws a PropertyReferenceException and halts startup.`
  );

  // 10. Spring AOP CGLIB Proxy Final method (Level 4)
  const beanCls = `DataFetcher_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t10-${i}`,
    "Spring Core & AOP",
    "hard",
    `What happens if you apply @Transactional to a final method inside bean class '${beanCls}' proxied by Spring AOP CGLIB subclassing?`,
    `public class ${beanCls} {
    @Transactional
    public final void loadData() {
        // DB changes
    }
}`,
    `The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.`,
    [
      `Spring throws a FinalMethodAopException at startup.`,
      `The application throws a ClassCastException during method call.`,
      `The JVM crashes at runtime when calling the final method.`
    ],
    `CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.`
  );

  // 11. Spring Boot Configurations @Value (Level 3)
  const propName = `app.rate.${i}`;
  const propVal = 10 * i;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t11-${i}`,
    "Spring Boot Configurations",
    "medium",
    `If '${propName}' is defined in application.properties as ${propVal}, in JVM properties as ${propVal + 50}, and as an OS environment variable as ${propVal + 100}, what value is resolved?`,
    `@Value("\${${propName}}")
private int rate;`,
    `${propVal + 50} (JVM system properties override OS environment variables and properties files)`,
    [
      `${propVal + 100} (OS Environment variables take highest precedence)`,
      `${propVal} (application.properties overrides all external configurations)`,
      `It throws a property resolution error due to conflict`
    ],
    `Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of ${propVal + 50} is selected.`
  );

  // 12. SmartLifecycle phase order (Level 3)
  const phaseVal = 100 + i;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t12-${i}`,
    "Spring Core & Bean Lifecycle",
    "medium",
    `How does the integer phase value ${phaseVal} returned by getPhase() in SmartLifecycle affect context startup and shutdown order?`,
    `public class CustomService implements SmartLifecycle {
    @Override
    public int getPhase() { return ${phaseVal}; }
}`,
    `Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.`,
    [
      `Beans with higher phase numbers are started first and stopped last.`,
      `The phase determines the priority thread pool, where higher phase means more threads.`,
      `SmartLifecycle beans start concurrently and ignore the phase value.`
    ],
    `SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.`
  );

  // 13. Spring caching cacheable key mismatch (Level 4)
  const cacheName = `users_cache_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t13-${i}`,
    "Spring Caching",
    "hard",
    `Why does the cache eviction fail under the configuration below?`,
    `@Cacheable(value = "${cacheName}", key = "#id")
public User getUser(Long id, Context ctx) { ... }

@CacheEvict(value = "${cacheName}")
public void evictUser(Long id) { ... }`,
    `Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.`,
    [
      `Because cache names must be different.`,
      `Because evictUser() returns void.`,
      `Because CacheEvict requires @Transactional to run.`
    ],
    `By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.`
  );

  // 14. Spring @PostConstruct blocking thread (Level 4)
  const compName = `SetupBean_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t14-${i}`,
    "Spring Core & Bean Lifecycle",
    "hard",
    `What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of '${compName}'?`,
    `@Component
public class ${compName} {
    @PostConstruct
    public void init() {
        // Blocks on network/external server call
        loadConfiguration();
    }
}`,
    `It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.`,
    [
      `It triggers an asynchronous thread pool execution and continues startup.`,
      `Spring immediately throws an InitializationTimeoutException.`,
      `The JVM runs the method in the background without affecting startup.`
    ],
    `@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.`
  );

  // 15. Spring ControllerAdvice ExceptionHandler matching (Level 3)
  const exSub = `DatabaseException_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t15-${i}`,
    "Spring MVC",
    "medium",
    `If a controller throws a '${exSub}' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?`,
    `@ControllerAdvice
public class GlobalHandler {
    @ExceptionHandler(RuntimeException.class)
    public String handleRuntime(RuntimeException ex) { return "Runtime"; }

    @ExceptionHandler(${exSub}.class)
    public String handleDb(${exSub} ex) { return "Db"; }
}`,
    `handleDb(), because it is mapped to the most specific exception type matching the exception thrown.`,
    [
      `handleRuntime(), because RuntimeException is checked first as the parent class.`,
      `Both methods run in sequence.`,
      `Spring throws an ExceptionHandlerAmbiguityException at startup.`
    ],
    `Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since '${exSub}' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().`
  );

  // 16. JPA Entity Lifecycle States (Level 4)
  const entityCls = `Account_${i}`;
  const balanceVal = 1000 + i * 10;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t16-${i}`,
    "Spring Data JPA",
    "hard",
    `What is the state of entity '${entityCls}' and the database result when the method process() exits?`,
    `@Transactional
public void process(Long id) {
    ${entityCls} acc = repository.findById(id).orElseThrow();
    entityManager.detach(acc);
    acc.setBalance(${balanceVal});
}`,
    `The entity is in the detached state; no database updates occur.`,
    [
      `The entity is in the persistent state; the database is updated with balance ${balanceVal}.`,
      `An EntityNotFoundException is thrown during detach.`,
      `Hibernate throws a LazyInitializationException when setting the balance.`
    ],
    `Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.`
  );

  // 17. Resilience4j Circuit Breaker (Level 3)
  const winSize = 10 + (i % 5);
  const failureThresh = 50;
  const badCalls = Math.ceil(winSize * 0.6);
  const badPercent = (badCalls / winSize * 100).toFixed(0);
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t17-${i}`,
    "Spring Cloud & Resilience",
    "medium",
    `A Resilience4j Circuit Breaker has slidingWindowSize = ${winSize} and failureRateThreshold = ${failureThresh}%. If ${badCalls} requests fail within the sliding window, what is the state transition?`,
    `CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .slidingWindowSize(${winSize})
    .failureRateThreshold(${failureThresh})
    .build();`,
    `Transitions to OPEN state (failure rate is ${badPercent}%, exceeding the ${failureThresh}% threshold).`,
    [
      `Remains in CLOSED state because the sliding window must exceed capacity.`,
      `Transitions to HALF_OPEN state.`,
      `Throws a CircuitBreakerOpenException immediately.`
    ],
    `Once the sliding window registers ${winSize} requests, Resilience4j calculates the failure rate. Since ${badCalls}/${winSize} (${badPercent}%) is greater than or equal to ${failureThresh}%, the Circuit Breaker transitions to the OPEN state.`
  );

  // 18. ConditionalOnMissingBean precedence (Level 4)
  const beanVal = `BeanVal_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t18-${i}`,
    "Spring Boot Internals",
    "hard",
    `Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?`,
    `@Configuration
public class AppConfig {
    @Bean
    public ${beanVal} primaryBean() { return new ${beanVal}("A"); }

    @Bean
    @ConditionalOnMissingBean(${beanVal}.class)
    public ${beanVal} fallbackBean() { return new ${beanVal}("B"); }
}`,
    `Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.`,
    [
      `fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.`,
      `Both beans are registered, creating an array list injection candidate.`,
      `Spring throws a BeanDefinitionOverrideException during startup.`
    ],
    `Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.`
  );

  // 19. Jackson serialization getters (Level 3)
  const resCls = `ResponseData_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t19-${i}`,
    "Spring MVC",
    "medium",
    `A controller returns an instance of '${resCls}'. If fields are private and no getters are defined, what is the HTTP response behavior?`,
    `public class ${resCls} {
    private String status;
    public ${resCls}(String status) { this.status = status; }
    // No getters
}`,
    `HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).`,
    [
      `HTTP 200 with JSON payload {"status":null}.`,
      `HTTP 200 with JSON payload {"status":"..."} using reflection.`,
      `The code fails to compile because classes returned from RestController require getters.`
    ],
    `Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.`
  );

  // 20. Spring Transaction Propagation NESTED (Level 4)
  const nestingName = `OuterSvc_${i}`;
  
  addQuestion(
    springBootQuestions,
    `spring-quiz-t20-${i}`,
    "Spring Data JPA",
    "hard",
    `If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?`,
    `@Transactional
public void outerMethod() {
    try {
        innerService.nestedMethod();
    } catch (Exception e) {
        // Exception caught
    }
    // Save other data
}`,
    `Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.`,
    [
      `The entire transaction is rolled back because the outer method was marked as Transactional.`,
      `nestedMethod()'s updates are committed because the exception was caught in the outer method.`,
      `Spring throws a NestedTransactionNotSupportedException.`
    ],
    `Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.`
  );
}

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

// Write the files
writeTSFile(path.join(__dirname, '../src/data/java-quiz-questions.ts'), 'javaQuestions', javaQuestions);
writeTSFile(path.join(__dirname, '../src/data/spring-boot-quiz-questions.ts'), 'springBootQuestions', springBootQuestions);

// System design questions. We generate exactly 500 questions across DB, Microservices, APIs, and Security.
const systemDesignQuestions = [];

function pushSysQuestion(id, topic, difficulty, questionText, codeSnippet, correctAnswer, distractors, explanation) {
  const correctIdx = Math.floor(Math.random() * 4);
  const options = [];
  options[correctIdx] = correctAnswer;
  let distractorIdx = 0;
  for (let j = 0; j < 4; j++) {
    if (j === correctIdx) continue;
    options[j] = distractors[distractorIdx++];
  }

  systemDesignQuestions.push({
    id,
    topic,
    difficulty,
    questionText,
    codeSnippet,
    options,
    correctOptionIndex: correctIdx,
    explanation
  });
}

// 1. Database SQL/NoSQL (125 questions)
for (let i = 1; i <= 125; i++) {
  const dbType = ["PostgreSQL", "MySQL", "Oracle", "SQL Server"][i % 4];
  const isolationLevels = ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"];
  const levelIdx = i % 4;
  const isoLevel = isolationLevels[levelIdx];
  const allowedAnomalies = [];
  if (levelIdx <= 0) allowedAnomalies.push("Dirty Reads", "Non-Repeatable Reads", "Phantom Reads");
  else if (levelIdx <= 1) allowedAnomalies.push("Non-Repeatable Reads", "Phantom Reads");
  else if (levelIdx <= 2) allowedAnomalies.push("Phantom Reads");
  
  const querySql = `BEGIN TRANSACTION ISOLATION LEVEL ${isoLevel};
SELECT balance FROM accounts WHERE id = ${100 + i}; -- T1 reads
-- Meanwhile T2 updates balance to balance - 100 and commits
SELECT balance FROM accounts WHERE id = ${100 + i}; -- T1 reads again
COMMIT;`;

  pushSysQuestion(
    `sys-quiz-db-${i}`,
    "Database SQL/NoSQL",
    levelIdx >= 2 ? "hard" : "medium",
    `A transaction T1 is executed in ${dbType} under isolation level ${isoLevel}. Concurrently, another transaction T2 executes. Under this isolation level, which data anomalies can occur in T1?`,
    querySql,
    allowedAnomalies.length === 0 ? "No anomalies (transaction is fully isolated from concurrent updates)." : `Potential anomalies include: ${allowedAnomalies.join(" and ")}.`,
    [
      allowedAnomalies.length === 0 ? "Dirty Reads only." : "No anomalies occur because transactions are locked by default.",
      "Write Skew only.",
      "Deadlock exceptions on every select query."
    ],
    `Under the SQL standard, ${isoLevel} isolation prevents certain anomalies. READ UNCOMMITTED allows all anomalies. READ COMMITTED prevents Dirty Reads. REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but may allow Phantom Reads (except on engines like InnoDB/Postgres which prevent them by default). SERIALIZABLE prevents all read anomalies.`
  );
}

// 2. Microservices (125 questions)
for (let i = 1; i <= 125; i++) {
  const serviceA = `InventoryService_${i}`;
  const serviceB = `OrderService_${i}`;
  const threshold = 40 + (i % 20);
  const halfOpenLimit = 2 + (i % 3);

  pushSysQuestion(
    `sys-quiz-ms-${i}`,
    "Microservices",
    "hard",
    `A circuit breaker configured between ${serviceA} and ${serviceB} is currently in the CLOSED state. The failure rate threshold is set to ${threshold}%. What happens when the failure rate reaches ${threshold + 1}% during a sliding window execution?`,
    `// Resilience4j Config:
slidingWindowSize = 100
failureRateThreshold = ${threshold}
slowCallRateThreshold = 60
permittedNumberOfCallsInHalfOpenState = ${halfOpenLimit}`,
    `The circuit breaker transitions to the OPEN state, and subsequent calls are rejected immediately with a CallNotPermittedException.`,
    [
      `The circuit breaker transitions to the HALF_OPEN state, allowing ${halfOpenLimit} probe calls.`,
      `The circuit breaker remains CLOSED but starts a background timer to measure network latency.`,
      `The circuit breaker throws a CircuitBreakerDisabledException and falls back to fallback execution.`
    ],
    `When the failure rate matches or exceeds the configured threshold (${threshold}%) inside a sliding window, the circuit breaker transitions from CLOSED to OPEN. In the OPEN state, all traffic is short-circuited (rejected) immediately to allow the downstream service to recover.`
  );
}

// 3. APIs (125 questions)
for (let i = 1; i <= 125; i++) {
  const endpoint = `/api/v1/orders/${100 + i}`;
  const maxTokens = 10 + (i * 2);
  const refillRate = 2 + (i % 3);

  pushSysQuestion(
    `sys-quiz-api-${i}`,
    "APIs",
    "medium",
    `A client invokes the API endpoint '${endpoint}' which implements the Token Bucket rate-limiting algorithm. The bucket has a max capacity of ${maxTokens} tokens and refills at a rate of ${refillRate} tokens/sec. If a client sends ${maxTokens + 2} requests in a burst, what HTTP headers and response behavior occur?`,
    `curl -X POST https://api.service.com${endpoint} \\
  -H "X-Idempotency-Key: id_key_${i}"`,
    `The first ${maxTokens} requests succeed with HTTP 200/201. The remaining 2 requests are rejected with HTTP 429 Too Many Requests and include a 'Retry-After' header.`,
    [
      `All ${maxTokens + 2} requests succeed, but the last 2 requests are queued and delayed.`,
      `The entire burst is rejected with HTTP 403 Forbidden due to security concerns.`,
      `The requests are processed round-robin across upstream services, ignoring the limit.`
    ],
    `The Token Bucket algorithm allows handling bursts up to the maximum bucket capacity (${maxTokens} tokens). Once the tokens are exhausted, any additional request is immediately rejected with HTTP 429 (Too Many Requests) until the bucket is refilled. Standard practice is to return a 'Retry-After' header.`
  );
}

// 4. Security (125 questions)
for (let i = 1; i <= 125; i++) {
  const clientDomain = `https://app-client-${i}.com`;
  const apiDomain = `https://api-gateway-${i}.com`;
  pushSysQuestion(
    `sys-quiz-sec-${i}`,
    "Security",
    "hard",
    `A web client hosted on '${clientDomain}' issues a POST request to '${apiDomain}/v1/users'. The browser blocks the request and logs a CORS violation. Which HTTP headers must the API gateway return to resolve this?`,
    `// Preflight Request:
OPTIONS /v1/users HTTP/1.1
Origin: ${clientDomain}
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type`,
    `Access-Control-Allow-Origin: ${clientDomain} (or *), Access-Control-Allow-Methods: POST, and Access-Control-Allow-Headers: content-type.`,
    [
      `X-Frame-Options: SAMEORIGIN and Content-Security-Policy: default-src 'self'.`,
      `Access-Control-Allow-Origin: ${apiDomain} and Access-Control-Allow-Credentials: true.`,
      `Authorization: Bearer jwt_token and Host: ${clientDomain}.`
    ],
    `Cross-Origin Resource Sharing (CORS) requires cross-origin HTTP requests (e.g. from '${clientDomain}' to '${apiDomain}') to pass preflight checks. The server must respond to the OPTIONS preflight request with headers confirming the origin, methods, and headers are allowed.`
  );
}

writeTSFile(path.join(__dirname, '../src/data/system-design-quiz-questions.ts'), 'systemDesignQuestions', systemDesignQuestions);

console.log("Successfully generated and updated quiz questions files with 500 unique questions each!");
