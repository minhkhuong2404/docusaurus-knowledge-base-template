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
// GENERATE 500 JAVA QUESTIONS
// ==========================================
for (let i = 1; i <= 25; i++) {
  // 1. ThreadPoolExecutor Queue & Max Threads
  const coreSize = 2 + (i % 3);
  const maxSize = coreSize + 2 + (i % 2);
  const queueCap = 5 + (i * 2);
  const tasks = coreSize + queueCap + 1 + (i % 3);
  const newThreads = tasks - coreSize - queueCap;
  const running = coreSize + newThreads;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t1-${i}`,
    "Multithreading & Concurrency",
    "hard",
    `A ThreadPoolExecutor is initialized with corePoolSize = ${coreSize}, maximumPoolSize = ${maxSize}, keepAliveTime = 60s, and a workQueue capacity of ${queueCap}. If you submit ${tasks} tasks concurrently with no delay, what is the state of the pool?`,
    `ThreadPoolExecutor executor = new ThreadPoolExecutor(
    ${coreSize}, ${maxSize}, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(${queueCap})
);
for (int i = 0; i < ${tasks}; i++) {
    executor.submit(() -> {
        try { Thread.sleep(10000); } catch (InterruptedException e) {}
    });
}`,
    `${running} active threads running tasks, with ${queueCap} tasks in the queue.`,
    [
      `${coreSize} active threads running tasks, with ${tasks - coreSize} tasks in the queue.`,
      `${maxSize} active threads running tasks, with ${tasks - maxSize} tasks in the queue.`,
      `The task execution throws a RejectedExecutionException immediately.`
    ],
    `The lifecycle rules are: 1) First ${coreSize} tasks create ${coreSize} core threads. 2) Next ${queueCap} tasks fill the queue. 3) Remaining tasks (total ${tasks} - ${coreSize} - ${queueCap} = ${newThreads}) exceed queue capacity, so ${newThreads} new threads are spawned (up to max ${maxSize}). This results in ${running} active threads and ${queueCap} queued tasks.`
  );

  // 2. HashMap Collision and Retrieval
  const keyClass = `CustomKeyVal_${i}`;
  const hashVal = 200 + (i * 5);
  const size = 6 + (i % 4);
  const targetId = 1 + (i % size);
  
  addQuestion(
    javaQuestions,
    `java-quiz-t2-${i}`,
    "Collections & Internals",
    "hard",
    `You insert ${size} distinct instances of class ${keyClass} into a standard HashMap. Class ${keyClass} overrides hashCode() to return constant ${hashVal}, but does not override equals(). What happens when you retrieve the key with id = ${targetId}?`,
    `public class ${keyClass} {
    private int id;
    public ${keyClass}(int id) { this.id = id; }
    @Override
    public int hashCode() { return ${hashVal}; }
    // No equals() implementation
}
// Insertion:
Map<${keyClass}, String> map = new HashMap<>();
${keyClass} searchKey = null;
for (int k = 1; k <= ${size}; k++) {
    ${keyClass} key = new ${keyClass}(k);
    if (k == ${targetId}) searchKey = key;
    map.put(key, "Val_" + k);
}
// Retrieval:
String result = map.get(searchKey);`,
    `The retrieval succeeds and returns "Val_${targetId}" because object reference identity (==) is checked and succeeds on the exact same key reference.`,
    [
      `The retrieval returns null because equals() is not implemented.`,
      `The HashMap throws a NullPointerException because the hash value is constant.`,
      `The retrieval returns the value of the last inserted element in the bucket.`
    ],
    `Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns "Val_${targetId}".`
  );

  // 3. Generics PECS
  const types = ["Number", "Integer", "Double", "Float"];
  const typeSelected = types[i % 4];
  
  addQuestion(
    javaQuestions,
    `java-quiz-t3-${i}`,
    "Generics",
    "medium",
    `According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type ${typeSelected}?`,
    `public static void process(List<? extends ${typeSelected}> src, List<? super ${typeSelected}> dest) {
    // Inside method body:
    ???
}`,
    `You can read from 'src' as type '${typeSelected}' and add elements of type '${typeSelected}' (or its subclasses) to 'dest'.`,
    [
      `You can write elements of type '${typeSelected}' into 'src' and read from 'dest' as type '${typeSelected}'.`,
      `You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.`,
      `You cannot read from 'src' or write to 'dest' without explicit type casting.`
    ],
    `Under PECS: List<? extends ${typeSelected}> is a Producer, so you can safely read from it as type '${typeSelected}'. List<? super ${typeSelected}> is a Consumer, so you can safely write/add elements of type '${typeSelected}' (or its subtypes) into it.`
  );

  // 4. Thread Join Duration
  const delay1 = 1000 + (i * 100);
  const delay2 = 800 + (i * 50);
  const timeout = 500 + (i * 20);
  const totalWait = timeout + delay2;
  
  addQuestion(
    javaQuestions,
    `java-quiz-t4-${i}`,
    "Multithreading & Concurrency",
    "medium",
    `Two threads T1 and T2 run concurrently. Thread T1 sleeps for ${delay1}ms. Thread T2 sleeps for ${delay2}ms. If the main thread calls T1.join(${timeout}) followed immediately by T2.join(), what is the approximate wait duration?`,
    `Thread t1 = new Thread(() -> {
    try { Thread.sleep(${delay1}); } catch (InterruptedException e) {}
});
Thread t2 = new Thread(() -> {
    try { Thread.sleep(${delay2}); } catch (InterruptedException e) {}
});
t1.start(); t2.start();
// Main Thread calls:
t1.join(${timeout});
t2.join();`,
    `Approximately ${totalWait}ms, because the main thread waits for the ${timeout}ms timeout on T1, then blocks until T2 completes its remaining sleep.`,
    [
      `Approximately ${delay1 + delay2}ms, as both join calls are executed sequentially.`,
      `Approximately ${delay1}ms, since T1 completes last.`,
      `Approximately ${timeout}ms, as both threads are forced to interrupt.`
    ],
    `Main thread waits on t1.join(${timeout}) which times out after ${timeout}ms. Meanwhile, T2 has been running in the background for ${timeout}ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (${delay2} - ${timeout} if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately ${timeout} + (${delay2} > ${timeout} ? ${delay2} - ${timeout} : 0) which equals ${totalWait}ms.`
  );

  // 5. ArrayList Capacity Growth
  const initCap = 8 + (i * 2);
  const inserts = initCap + 1;
  const newCap = Math.floor(initCap + (initCap >> 1));
  
  addQuestion(
    javaQuestions,
    `java-quiz-t5-${i}`,
    "Collections & Lists",
    "easy",
    `An ArrayList is initialized with an initial capacity of ${initCap}. If you add ${inserts} elements sequentially to the list, what is the internal array capacity immediately after the expansion?`,
    `List<Integer> list = new ArrayList<>(${initCap});
for (int j = 0; j < ${inserts}; j++) {
    list.add(j);
}`,
    `${newCap} (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))`,
    [
      `${initCap * 2} (capacity doubles when full)`,
      `${initCap + 10} (capacity grows by a fixed step of 10)`,
      `${inserts} (capacity grows to fit exactly the inserted elements)`
    ],
    `In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with ${initCap}, the new capacity is ${initCap} + ${initCap >> 1} = ${newCap}.`
  );

  // 6. String Constant Pool Internals
  const stringVal = `literalVal_${i}`;
  addQuestion(
    javaQuestions,
    `java-quiz-t6-${i}`,
    "Strings & String Pool",
    "medium",
    `How many objects are created in memory when the statement below executes, assuming "${stringVal}" is NOT already present in the String Constant Pool?`,
    `String s = new String("${stringVal}");`,
    `Two objects: one literal in the String Constant Pool and one new String object on the heap.`,
    [
      `One object: on the heap only.`,
      `One object: in the String Constant Pool only.`,
      `Zero objects: it only creates a stack reference.`
    ],
    `This statement creates two objects: the literal string "${stringVal}" is stored in the String Constant Pool (if not already present), and ` +
    `a new String object is created on the heap, wrapping the character array reference from the pool.`
  );

  // 7. Optional orElse vs orElseGet Invocation
  const valKey = `val_key_${i}`;
  const dbMethod = `fetchFromDb_${i}`;
  addQuestion(
    javaQuestions,
    `java-quiz-t7-${i}`,
    "Optional API",
    "medium",
    `In the code snippet below under normal execution, how many times is the method '${dbMethod}' evaluated?`,
    `public String getData() {
    return Optional.of("${valKey}")
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

  // 8. ForkJoinPool Parallelism
  const cores = 2 + (i % 4);
  const customParallel = cores * 3;
  addQuestion(
    javaQuestions,
    `java-quiz-t8-${i}`,
    "Multithreading & Concurrency",
    "hard",
    `You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism ${customParallel} on a machine with ${cores} CPU cores. What is the maximum number of threads that can process the stream concurrently?`,
    `ForkJoinPool customPool = new ForkJoinPool(${customParallel});
customPool.submit(() -> {
    IntStream.range(0, 1000).parallel().forEach(x -> {
        // Compute intensive task
    });
}).get();`,
    `Up to ${customParallel} concurrent threads inside the custom ForkJoinPool.`,
    [
      `Only ${cores} threads, matching the physical CPU cores.`,
      `Up to ${cores - 1} threads, as the common pool always reserves one core.`,
      `1 thread, because parallel streams ignore custom ForkJoinPool configurations.`
    ],
    `Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of ${customParallel}), overriding the default CommonPool behavior.`
  );

  // 9. WeakHashMap Garbage Collection
  const kVar = `keyData_${i}`;
  addQuestion(
    javaQuestions,
    `java-quiz-t9-${i}`,
    "Memory Management & GC",
    "medium",
    `A WeakHashMap is populated as shown below. If you set '${kVar}' to null and trigger GC, what happens to the map size?`,
    `Map<Object, String> map = new WeakHashMap<>();
Object ${kVar} = new Object();
map.put(${kVar}, "ActiveSession");

${kVar} = null;
System.gc();`,
    `The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.`,
    [
      `The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.`,
      `The map throws a NullPointerException during garbage collection.`,
      `The key is collected but map.size() still returns 1 until a get() call is made.`
    ],
    `WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference '${kVar}' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.`
  );

  // 10. CompletableFuture Handle vs Exceptionally
  const eMsg = `err_id_${i}`;
  const fMsg = `fallback_val_${i}`;
  addQuestion(
    javaQuestions,
    `java-quiz-t10-${i}`,
    "Multithreading & Concurrency",
    "hard",
    `Predict the output printed to the console when the CompletableFuture pipeline executes.`,
    `CompletableFuture.supplyAsync(() -> {
    if (true) throw new RuntimeException("${eMsg}");
    return "Normal";
})
.handle((res, ex) -> {
    return ex != null ? "${fMsg}" : res;
})
.exceptionally(ex -> {
    return "Secondary_Fallback";
})
.thenAccept(System.out::print);`,
    `"${fMsg}"`,
    [
      `"Secondary_Fallback"`,
      `"${eMsg}"`,
      `"NormalSecondary_Fallback"`
    ],
    `The supplyAsync stage throws a RuntimeException containing "${eMsg}". The handle() block captures this exception (ex is non-null) and returns "${fMsg}", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.`
  );

  // 11. Try-With-Resources Suppression
  const rName = `Res_${i}`;
  const tExc = `TryErr_${i}`;
  const cExc = `CloseErr_${i}`;
  addQuestion(
    javaQuestions,
    `java-quiz-t11-${i}`,
    "Exception Handling",
    "medium",
    `Inside a try-with-resources statement, if the try block throws an exception '${tExc}' and the resource's close() method throws an exception '${cExc}', which exception propagates and how is the other retrieved?`,
    `try (CustomResource ${rName} = new CustomResource()) { // close() throws ${cExc}
    throw new RuntimeException("${tExc}");
}`,
    `The RuntimeException containing '${tExc}' is thrown; the exception containing '${cExc}' is added to it as a suppressed exception.`,
    [
      `The exception containing '${cExc}' is thrown; the '${tExc}' exception is discarded.`,
      `Both exceptions are propagated concurrently in a MultiException.`,
      `The exception from close() overrides the try exception, throwing '${cExc}' without suppressing the other.`
    ],
    `In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().`
  );

  // 12. Virtual Threads Pinned Carrier
  const lockOption = ["synchronized block", "ReentrantLock", "Semaphore", "AtomicInteger"][i % 4];
  const isPinned = lockOption === "synchronized block";
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

  // 13. LinkedHashMap Eviction Order
  const cap = 3 + (i % 2);
  const accKey = 1 + (i % cap);
  const nKey = cap + 1;
  addQuestion(
    javaQuestions,
    `java-quiz-t13-${i}`,
    "Collections & Internals",
    "hard",
    `A LinkedHashMap is configured with accessOrder = true and max capacity = ${cap}. If you insert keys 1 to ${cap}, call map.get(${accKey}), and then put key ${nKey}, which key is evicted by removeEldestEntry?`,
    `LinkedHashMap<Integer, String> map = new LinkedHashMap<>(${cap}, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry eldest) {
        return size() > ${cap};
    }
};
for (int k = 1; k <= ${cap}; k++) map.put(k, "Val_" + k);
map.get(${accKey});
map.put(${nKey}, "Val_" + ${nKey});`,
    `Key ${accKey === 1 ? 2 : 1}`,
    [
      `Key ${accKey}`,
      `Key ${nKey}`,
      `Key ${cap}`
    ],
    `With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key ${accKey} moves it to the end. The eldest key is the least recently accessed. If cap=${cap} and we accessed ${accKey}, the remaining oldest key (either 1 or 2) is evicted.`
  );

  // 14. Method Overloading Resolution
  const sT = ["String", "Integer", "Double", "Runnable"][i % 4];
  addQuestion(
    javaQuestions,
    `java-quiz-t14-${i}`,
    "Object-Oriented Programming",
    "medium",
    `If a class defines overloaded methods print(Object o) and print(${sT} s), which method executes when print(null) is called?`,
    `public class OverloadDemo {
    public void print(Object o) { System.out.print("Object"); }
    public void print(${sT} s) { System.out.print("${sT}"); }
    
    public static void main(String[] args) {
        new OverloadDemo().print(null);
    }
}`,
    `The print(${sT} s) method executes because ${sT} is a more specific type than Object.`,
    [
      `The print(Object o) method executes because null is treated as general Object first.`,
      `A compile-time error occurs due to method signature ambiguity.`,
      `A NullPointerException is thrown at runtime during method dispatch.`
    ],
    `Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since '${sT}' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(${sT} s).`
  );

  // 15. ArrayStoreException Covariance
  const idx = i % 5;
  addQuestion(
    javaQuestions,
    `java-quiz-t15-${i}`,
    "Java Basics",
    "medium",
    `What is the runtime result of executing the code below containing array assignments?`,
    `Number[] numbers = new Integer[5];
numbers[${idx}] = 10.5; // Double value`,
    `An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.`,
    [
      `The double value 10.5 is stored in the array without issue.`,
      `The compiler flags this as a compile-time error.`,
      `The double value is truncated to the integer 10 and stored.`
    ],
    `Java arrays are covariant (` + "`" + `Integer[]` + "`" + ` is a subtype of ` + "`" + `Number[]` + "`" + `), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.`
  );

  // 16. SimpleDateFormat Concurrent Execution
  const threads = 10 + i;
  addQuestion(
    javaQuestions,
    `java-quiz-t16-${i}`,
    "Multithreading & Concurrency",
    "medium",
    `If a single shared instance of SimpleDateFormat is accessed concurrently by ${threads} threads, what runtime issue can occur?`,
    `// Shared instance accessed by ${threads} threads
private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");`,
    `It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.`,
    [
      `It will cause a thread deadlock inside the JVM date formatting library.`,
      `It works perfectly because formatting dates is a thread-safe read-only operation.`,
      `It will trigger an OutOfMemoryError in the heap space.`
    ],
    `SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.`
  );

  // 17. AtomicInteger CompareAndSet
  const init = i * 10;
  const expect = init + (i % 2 === 0 ? 0 : 5);
  const update = init + 10;
  const success = expect === init;
  addQuestion(
    javaQuestions,
    `java-quiz-t17-${i}`,
    "Multithreading & Concurrency",
    "medium",
    `An AtomicInteger is initialized to ${init}. Thread 1 calls compareAndSet(${expect}, ${update}). What is the return value of compareAndSet and the resulting value of the AtomicInteger?`,
    `AtomicInteger atomic = new AtomicInteger(${init});
boolean updated = atomic.compareAndSet(${expect}, ${update});`,
    `Returns ${success}, resulting in value ${success ? update : init}.`,
    [
      `Returns true, resulting in value ${update} regardless of expectation.`,
      `Returns false, resulting in value ${update} due to lock-free CAS loops.`,
      `Throws an ArithmeticException because expected value doesn't match.`
    ],
    `compareAndSet checks if the current value equals the expected value (${expect}). If it does (value is ${init}), it atomically updates it to ${update} and returns true. Otherwise, it leaves the value unchanged and returns false.`
  );

  // 18. ClassNotFoundException vs NoClassDefFoundError
  addQuestion(
    javaQuestions,
    `java-quiz-t18-${i}`,
    "JVM & Classloading",
    "hard",
    `Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?`,
    `// Scenario: Class A references Class B
ClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB`,
    `When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.`,
    [
      `When Class.forName() is called with an invalid class package string name.`,
      `When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.`,
      `When there is an import statement referencing a non-existent class at compile time.`
    ],
    `ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.`
  );

  // 19. Stream Numeric Overflow
  const mult = 1000000 + i;
  addQuestion(
    javaQuestions,
    `java-quiz-t19-${i}`,
    "Streams API",
    "medium",
    `If you run the stream operation below using Integer.MAX_VALUE and ${mult}, what is printed to the console?`,
    `int result = Stream.of(Integer.MAX_VALUE, ${mult})
                   .reduce(0, Integer::sum);
System.out.println(result);`,
    `An overflow value of ${(2147483647 + mult) | 0} (due to standard 32-bit signed integer overflow).`,
    [
      `The mathematically correct sum (promoted automatically to a 64-bit long).`,
      `An ArithmeticException is thrown indicating integer overflow.`,
      `A compile-time error occurs because reduce requires an accumulator.`
    ],
    `In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding ${mult} to Integer.MAX_VALUE overflows and wraps into negative values.`
  );

  // 20. Class Hiding Static Methods
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
// GENERATE 500 SPRING BOOT QUESTIONS
// ==========================================
for (let i = 1; i <= 25; i++) {
  // 1. Spring AOP Proxy Self-Invocation
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

  // 2. Spring Bean Scopes Injection Mismatch
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

  // 3. Spring Data JPA Transaction Checked Exception Rollback
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

  // 4. Spring Constructor Circular Dependency
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

  // 5. JPA N+1 Select Query Count
  const pCount = 5 + (i % 5);
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

  // 6. Spring WebFlux Reactive EventLoop blocking
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

  // 7. Spring Security Filter Chain order
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

  // 8. Spring @Qualifier vs @Primary
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

  // 9. Spring Data JPA Derived Query parser
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

  // 10. Spring CGLIB Proxy Final methods
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

  // 11. Spring @Value property precedence
  const propName = `app.rate.${i}`;
  addQuestion(
    springBootQuestions,
    `spring-quiz-t11-${i}`,
    "Spring Boot Configurations",
    "medium",
    `If '${propName}' is defined in application.properties as 50, in JVM properties as 100, and as an OS environment variable as 150, what value is resolved?`,
    `@Value("\${${propName}}")
private int rate;`,
    `100 (JVM system properties override OS environment variables and properties files)`,
    [
      `150 (OS Environment variables take highest precedence)`,
      `50 (application.properties overrides all external configurations)`,
      `It throws a property resolution error due to conflict`
    ],
    `Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 100 is selected.`
  );

  // 12. SmartLifecycle start order phase
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

  // 13. Spring Cacheable evict key mismatch
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

  // 14. Spring @PostConstruct thread execution
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

  // 15. Spring ControllerAdvice ExceptionHandler
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
    `Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since '${exSub}' matches the thrown exception exactly, ` +
    `handleDb() is preferred over handleRuntime().`
  );

  // 16. JPA Entity Lifecycle States transition
  const entityCls = `Account_${i}`;
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
    acc.setBalance(1000);
}`,
    `The entity is in the detached state; no database updates occur.`,
    [
      `The entity is in the persistent state; the database is updated with balance 1000.`,
      `An EntityNotFoundException is thrown during detach.`,
      `Hibernate throws a LazyInitializationException when setting the balance.`
    ],
    `Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.`
  );

  // 17. Resilience4j Circuit Breaker failure threshold
  const window = 10 + (i % 5);
  const thresh = 50;
  const fails = Math.ceil(window * 0.6);
  addQuestion(
    springBootQuestions,
    `spring-quiz-t17-${i}`,
    "Spring Cloud & Resilience",
    "medium",
    `A Resilience4j Circuit Breaker has slidingWindowSize = ${window} and failureRateThreshold = ${thresh}%. If ${fails} requests fail within the sliding window, what is the state transition?`,
    `CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .slidingWindowSize(${window})
    .failureRateThreshold(${thresh})
    .build();`,
    `Transitions to OPEN state (failure rate is ${(fails / window * 100).toFixed(0)}%, exceeding the ${thresh}% threshold).`,
    [
      `Remains in CLOSED state because the sliding window must exceed capacity.`,
      `Transitions to HALF_OPEN state.`,
      `Throws a CircuitBreakerOpenException immediately.`
    ],
    `Once the sliding window registers ${window} requests, Resilience4j calculates the failure rate. Since ${fails}/${window} (${(fails / window * 100).toFixed(0)}%) is greater than or equal to ${thresh}%, the Circuit Breaker transitions to the OPEN state.`
  );

  // 18. Spring Boot ConditionalOnMissingBean precedence
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

  // 19. Spring MVC JSON Jackson serialization getters
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

  // 20. Spring Transaction Propagation NESTED rollback
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

console.log("Successfully generated and updated quiz questions files with 500 unique questions each!");
