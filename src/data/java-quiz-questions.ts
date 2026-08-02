export interface QuizQuestion {
  id: string;
  topic: string;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const javaQuestions: QuizQuestion[] = [
  {
    "id": "java-quiz-t1-1",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 7. If you submit 12 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "3 active threads running tasks, with 9 tasks in the queue.",
      "6 active threads running tasks, with 6 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately.",
      "5 active threads running tasks, with 7 tasks waiting in the queue."
    ],
    "correctOptionIndex": 3,
    "explanation": "ThreadPoolExecutor rules: 1) First 3 tasks spawn 3 core threads. 2) Next 7 tasks fill the queue. 3) Remaining tasks spawn threads up to max (6). Since total tasks (12) fit within capacity, the pool spawns 2 extra threads, resulting in 5 active threads and 7 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(7)\n);\nfor (int i = 0; i < 12; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-1",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 5 distinct instances of class CustomKey_1 into a standard HashMap. Class CustomKey_1 overrides hashCode() to return constant 110, but does not override equals(). What happens when you retrieve the key with id = 2?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket.",
      "The retrieval succeeds and returns \"Val_2\" because object reference identity (==) is checked and succeeds on the exact same key reference."
    ],
    "correctOptionIndex": 3,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_1 {\n    private int id;\n    public CustomKey_1(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 110; }\n}\nMap<CustomKey_1, String> map = new HashMap<>();\nCustomKey_1 searchKey = null;\nfor (int k = 1; k <= 5; k++) {\n    CustomKey_1 key = new CustomKey_1(k);\n    if (k == 2) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-1",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Integer?",
    "options": [
      "Operations A and C are valid; Operation B is a compile error.",
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so reading from it as Integer (A) is valid, but writing to it is banned (B). List<? super Integer> is a Consumer, so adding Integer objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Operation A: Integer val = src.get(0);\n    // Operation B: src.add(10);\n    // Operation C: dest.add(10);\n}"
  },
  {
    "id": "java-quiz-t4-1",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 850ms. Thread T2 sleeps for 640ms. If the main thread calls T1.join(310) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 1490ms, as both join calls execute fully sequentially.",
      "Approximately 850ms, since T1 takes the longest to complete.",
      "Approximately 640ms, because the main thread waits for the 310ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 310ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "The main thread blocks on t1.join(310) for 310ms. During this time, T2 has also slept for 310ms, leaving 330ms of sleep. When t2.join() is called, the main thread blocks for the remaining 330ms. Total wait = 310 + 330 = 640ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(850); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(640); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(310);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-1",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 10. If you add 11 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "15 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "20 (capacity doubles when full)",
      "20 (capacity grows by a fixed step of 10)",
      "11 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 10, the new capacity is 10 + 5 = 15.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(10);\nfor (int j = 0; j < 11; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-1",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_1\" is NOT already present in the String Constant Pool?",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"poolStr_1\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_1\");"
  },
  {
    "id": "java-quiz-t7-1",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_1' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_1()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_1\")\n                   .orElse(fetchDb_1());\n}\npublic String fetchDb_1() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-1",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 3 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 3 concurrent threads inside the custom ForkJoinPool.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 3), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(3);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-1",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_1' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_1' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_1 = new Object();\nmap.put(keyData_1, \"ActiveSession\");\n\nkeyData_1 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-1",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_1\"",
      "\"fallback_1\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_1\". The handle() block captures this exception (ex is non-null) and returns \"fallback_1\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_1\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_1\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-1",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_1' and the resource's close() method throws 'CloseErr_1', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_1' is thrown; the 'TryErr_1' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_1' without suppressing the other.",
      "The RuntimeException containing 'TryErr_1' is thrown; the exception containing 'CloseErr_1' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_1 = new CustomResource()) { // close() throws CloseErr_1\n    throw new RuntimeException(\"TryErr_1\");\n}"
  },
  {
    "id": "java-quiz-t12-1",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-1",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 2",
      "Key 5",
      "Key 1",
      "Key 4"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 2, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-1",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "The print(Integer s) method executes because Integer is a more specific type than Object.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-1",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[1] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-1",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 6 threads, what runtime issue can occur?",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 6 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-1",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 10. Thread 1 calls compareAndSet(15, 20). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns false, resulting in value 10.",
      "Returns true, resulting in value 20 regardless of expectation.",
      "Returns false, resulting in value 20 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (15). If it does (value is 10), it atomically updates it to 20 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(10);\nboolean updated = atomic.compareAndSet(15, 20);"
  },
  {
    "id": "java-quiz-t18-1",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When ClassB_1 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_1"
  },
  {
    "id": "java-quiz-t19-1",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1001, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2147482648 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1001 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1001)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-1",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_1().display()'?",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_1', the call to log() is resolved to 'ChildService_1.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_1 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_1 extends ParentService_1 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-2",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 9. If you submit 16 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "4 active threads running tasks, with 12 tasks in the queue.",
      "6 active threads running tasks, with 9 tasks in the queue without rejection.",
      "The pool dynamically grows to 16 threads to prevent task rejection.",
      "The task execution throws a RejectedExecutionException for the last task(s) exceeding capacity."
    ],
    "correctOptionIndex": 3,
    "explanation": "ThreadPoolExecutor rules: 1) First 4 tasks spawn 4 core threads. 2) Next 9 tasks fill the queue. 3) Remaining tasks spawn threads up to max (6). Since total tasks (16) exceed core + queue + max capacity (15), the excess tasks are rejected with RejectedExecutionException.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(9)\n);\nfor (int i = 0; i < 16; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-2",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 6 distinct instances of class CustomKey_2 into a standard HashMap. Class CustomKey_2 overrides hashCode() to return constant 120, but does not override equals(). What happens when you retrieve the key with id = 3?",
    "options": [
      "The retrieval succeeds and returns \"Val_3\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_2 {\n    private int id;\n    public CustomKey_2(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 120; }\n}\nMap<CustomKey_2, String> map = new HashMap<>();\nCustomKey_2 searchKey = null;\nfor (int k = 1; k <= 6; k++) {\n    CustomKey_2 key = new CustomKey_2(k);\n    if (k == 3) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-2",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Double?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error.",
      "Operations A and C are valid; Operation B is a compile error."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under PECS: List<? extends Double> is a Producer, so reading from it as Double (A) is valid, but writing to it is banned (B). List<? super Double> is a Consumer, so adding Double objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Double> src, List<? super Double> dest) {\n    // Operation A: Double val = src.get(0);\n    // Operation B: src.add(20);\n    // Operation C: dest.add(20);\n}"
  },
  {
    "id": "java-quiz-t4-2",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 900ms. Thread T2 sleeps for 680ms. If the main thread calls T1.join(320) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 1580ms, as both join calls execute fully sequentially.",
      "Approximately 900ms, since T1 takes the longest to complete.",
      "Approximately 680ms, because the main thread waits for the 320ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 320ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "The main thread blocks on t1.join(320) for 320ms. During this time, T2 has also slept for 320ms, leaving 360ms of sleep. When t2.join() is called, the main thread blocks for the remaining 360ms. Total wait = 320 + 360 = 680ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(900); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(680); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(320);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-2",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 12. If you add 13 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "18 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "24 (capacity doubles when full)",
      "22 (capacity grows by a fixed step of 10)",
      "13 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 12, the new capacity is 12 + 6 = 18.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(12);\nfor (int j = 0; j < 13; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-2",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_2\" is NOT already present in the String Constant Pool?",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"poolStr_2\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_2\");"
  },
  {
    "id": "java-quiz-t7-2",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_2' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_2()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_2\")\n                   .orElse(fetchDb_2());\n}\npublic String fetchDb_2() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-2",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 4 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "Up to 4 concurrent threads inside the custom ForkJoinPool.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 4), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(4);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-2",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_2' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_2' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_2 = new Object();\nmap.put(keyData_2, \"ActiveSession\");\n\nkeyData_2 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-2",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"fallback_2\"",
      "\"err_2\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 1,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_2\". The handle() block captures this exception (ex is non-null) and returns \"fallback_2\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_2\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_2\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-2",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_2' and the resource's close() method throws 'CloseErr_2', which exception propagates and how is the other retrieved?",
    "options": [
      "The RuntimeException containing 'TryErr_2' is thrown; the exception containing 'CloseErr_2' is added to it as a suppressed exception.",
      "The exception containing 'CloseErr_2' is thrown; the 'TryErr_2' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_2' without suppressing the other."
    ],
    "correctOptionIndex": 0,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_2 = new CustomResource()) { // close() throws CloseErr_2\n    throw new RuntimeException(\"TryErr_2\");\n}"
  },
  {
    "id": "java-quiz-t12-2",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-2",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(3), and then put key 4, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 3",
      "Key 4",
      "Key 3",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 3 moves it to the end. The eldest key is the least recently accessed. If capacity is 3 and we accessed 3, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(3);\nmap.put(4, \"Val_\" + 4);"
  },
  {
    "id": "java-quiz-t14-2",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Double s), which method executes when print(null) is called?",
    "options": [
      "The print(Double s) method executes because Double is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Double' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Double s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Double s) { System.out.print(\"Double\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-2",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[2] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-2",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 7 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 2,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 7 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-2",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 20. Thread 1 calls compareAndSet(20, 30). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 30 regardless of expectation.",
      "Returns false, resulting in value 30 due to lock-free CAS loops.",
      "Returns true, resulting in value 30.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (20). If it does (value is 20), it atomically updates it to 30 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(20);\nboolean updated = atomic.compareAndSet(20, 30);"
  },
  {
    "id": "java-quiz-t18-2",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When ClassB_2 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_2"
  },
  {
    "id": "java-quiz-t19-2",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1002, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2147482647 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1002 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1002)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-2",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_2().display()'?",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_2', the call to log() is resolved to 'ChildService_2.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_2 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_2 extends ParentService_2 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-3",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 11. If you submit 14 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "3 active threads running tasks, with 11 tasks waiting in the queue.",
      "2 active threads running tasks, with 12 tasks in the queue.",
      "5 active threads running tasks, with 9 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "ThreadPoolExecutor rules: 1) First 2 tasks spawn 2 core threads. 2) Next 11 tasks fill the queue. 3) Remaining tasks spawn threads up to max (5). Since total tasks (14) fit within capacity, the pool spawns 1 extra threads, resulting in 3 active threads and 11 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(11)\n);\nfor (int i = 0; i < 14; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-3",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKey_3 into a standard HashMap. Class CustomKey_3 overrides hashCode() to return constant 130, but does not override equals(). What happens when you retrieve the key with id = 4?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The retrieval succeeds and returns \"Val_4\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 1,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_3 {\n    private int id;\n    public CustomKey_3(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 130; }\n}\nMap<CustomKey_3, String> map = new HashMap<>();\nCustomKey_3 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKey_3 key = new CustomKey_3(k);\n    if (k == 4) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-3",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Float?",
    "options": [
      "Operations A and C are valid; Operation B is a compile error.",
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under PECS: List<? extends Float> is a Producer, so reading from it as Float (A) is valid, but writing to it is banned (B). List<? super Float> is a Consumer, so adding Float objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Float> src, List<? super Float> dest) {\n    // Operation A: Float val = src.get(0);\n    // Operation B: src.add(30);\n    // Operation C: dest.add(30);\n}"
  },
  {
    "id": "java-quiz-t4-3",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 950ms. Thread T2 sleeps for 720ms. If the main thread calls T1.join(330) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 1670ms, as both join calls execute fully sequentially.",
      "Approximately 950ms, since T1 takes the longest to complete.",
      "Approximately 720ms, because the main thread waits for the 330ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 330ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "The main thread blocks on t1.join(330) for 330ms. During this time, T2 has also slept for 330ms, leaving 390ms of sleep. When t2.join() is called, the main thread blocks for the remaining 390ms. Total wait = 330 + 390 = 720ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(950); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(720); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(330);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-3",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 14. If you add 15 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "21 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "28 (capacity doubles when full)",
      "24 (capacity grows by a fixed step of 10)",
      "15 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 14, the new capacity is 14 + 7 = 21.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(14);\nfor (int j = 0; j < 15; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-3",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_3\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"poolStr_3\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_3\");"
  },
  {
    "id": "java-quiz-t7-3",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_3' evaluated?",
    "options": [
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_3()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_3\")\n                   .orElse(fetchDb_3());\n}\npublic String fetchDb_3() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-3",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 5 on a machine with 1 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Up to 5 concurrent threads inside the custom ForkJoinPool.",
      "Only 1 threads, matching the physical CPU cores.",
      "Up to 0 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 5), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(5);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-3",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_3' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 0,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_3' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_3 = new Object();\nmap.put(keyData_3, \"ActiveSession\");\n\nkeyData_3 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-3",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_3\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_3\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_3\". The handle() block captures this exception (ex is non-null) and returns \"fallback_3\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_3\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_3\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-3",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_3' and the resource's close() method throws 'CloseErr_3', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_3' is thrown; the 'TryErr_3' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_3' is thrown; the exception containing 'CloseErr_3' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_3' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_3 = new CustomResource()) { // close() throws CloseErr_3\n    throw new RuntimeException(\"TryErr_3\");\n}"
  },
  {
    "id": "java-quiz-t12-3",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A synchronized block or synchronized method.",
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-3",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(4), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 4",
      "Key 5",
      "Key 4",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 4 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 4, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(4);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-3",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Runnable s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "The print(Runnable s) method executes because Runnable is a more specific type than Object.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Runnable' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Runnable s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Runnable s) { System.out.print(\"Runnable\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-3",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[3] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-3",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 8 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 8 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-3",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 30. Thread 1 calls compareAndSet(35, 40). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns false, resulting in value 30.",
      "Returns true, resulting in value 40 regardless of expectation.",
      "Returns false, resulting in value 40 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (35). If it does (value is 30), it atomically updates it to 40 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(30);\nboolean updated = atomic.compareAndSet(35, 40);"
  },
  {
    "id": "java-quiz-t18-3",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassB_3 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 1,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_3"
  },
  {
    "id": "java-quiz-t19-3",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1003, what is printed to the console?",
    "options": [
      "An overflow value of -2147482646 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1003 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1003)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-3",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_3().display()'?",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_3', the call to log() is resolved to 'ChildService_3.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_3 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_3 extends ParentService_3 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-4",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 13. If you submit 18 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "3 active threads running tasks, with 15 tasks in the queue.",
      "5 active threads running tasks, with 13 tasks in the queue.",
      "5 active threads running tasks, with 13 tasks waiting in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "ThreadPoolExecutor rules: 1) First 3 tasks spawn 3 core threads. 2) Next 13 tasks fill the queue. 3) Remaining tasks spawn threads up to max (5). Since total tasks (18) fit within capacity, the pool spawns 2 extra threads, resulting in 5 active threads and 13 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(13)\n);\nfor (int i = 0; i < 18; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-4",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 4 distinct instances of class CustomKey_4 into a standard HashMap. Class CustomKey_4 overrides hashCode() to return constant 140, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket.",
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference."
    ],
    "correctOptionIndex": 3,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_4 {\n    private int id;\n    public CustomKey_4(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 140; }\n}\nMap<CustomKey_4, String> map = new HashMap<>();\nCustomKey_4 searchKey = null;\nfor (int k = 1; k <= 4; k++) {\n    CustomKey_4 key = new CustomKey_4(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-4",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Number?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "Operations A and C are valid; Operation B is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Number> is a Producer, so reading from it as Number (A) is valid, but writing to it is banned (B). List<? super Number> is a Consumer, so adding Number objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Number> src, List<? super Number> dest) {\n    // Operation A: Number val = src.get(0);\n    // Operation B: src.add(40);\n    // Operation C: dest.add(40);\n}"
  },
  {
    "id": "java-quiz-t4-4",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1000ms. Thread T2 sleeps for 760ms. If the main thread calls T1.join(340) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 760ms, because the main thread waits for the 340ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 1760ms, as both join calls execute fully sequentially.",
      "Approximately 1000ms, since T1 takes the longest to complete.",
      "Approximately 340ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 0,
    "explanation": "The main thread blocks on t1.join(340) for 340ms. During this time, T2 has also slept for 340ms, leaving 420ms of sleep. When t2.join() is called, the main thread blocks for the remaining 420ms. Total wait = 340 + 420 = 760ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1000); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(760); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(340);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-4",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 16. If you add 17 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "32 (capacity doubles when full)",
      "26 (capacity grows by a fixed step of 10)",
      "17 (capacity grows to fit exactly the inserted elements)",
      "24 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 16, the new capacity is 16 + 8 = 24.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(16);\nfor (int j = 0; j < 17; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-4",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_4\" is NOT already present in the String Constant Pool?",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"poolStr_4\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_4\");"
  },
  {
    "id": "java-quiz-t7-4",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_4' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_4()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_4\")\n                   .orElse(fetchDb_4());\n}\npublic String fetchDb_4() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-4",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 2 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations.",
      "Up to 2 concurrent threads inside the custom ForkJoinPool."
    ],
    "correctOptionIndex": 3,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 2), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(2);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-4",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_4' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 1,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_4' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_4 = new Object();\nmap.put(keyData_4, \"ActiveSession\");\n\nkeyData_4 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-4",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_4\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_4\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_4\". The handle() block captures this exception (ex is non-null) and returns \"fallback_4\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_4\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_4\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-4",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_4' and the resource's close() method throws 'CloseErr_4', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_4' is thrown; the 'TryErr_4' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_4' without suppressing the other.",
      "The RuntimeException containing 'TryErr_4' is thrown; the exception containing 'CloseErr_4' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_4 = new CustomResource()) { // close() throws CloseErr_4\n    throw new RuntimeException(\"TryErr_4\");\n}"
  },
  {
    "id": "java-quiz-t12-4",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "A synchronized block or synchronized method.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-4",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(2), and then put key 4, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 2",
      "Key 4",
      "Key 1",
      "Key 3"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If capacity is 3 and we accessed 2, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(4, \"Val_\" + 4);"
  },
  {
    "id": "java-quiz-t14-4",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(String s), which method executes when print(null) is called?",
    "options": [
      "The print(String s) method executes because String is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'String' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(String s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(String s) { System.out.print(\"String\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-4",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[4] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-4",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 9 threads, what runtime issue can occur?",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 9 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-4",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 40. Thread 1 calls compareAndSet(40, 50). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 50 regardless of expectation.",
      "Returns false, resulting in value 50 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match.",
      "Returns true, resulting in value 50."
    ],
    "correctOptionIndex": 3,
    "explanation": "compareAndSet checks if the current value equals the expected value (40). If it does (value is 40), it atomically updates it to 50 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(40);\nboolean updated = atomic.compareAndSet(40, 50);"
  },
  {
    "id": "java-quiz-t18-4",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassB_4 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 1,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_4"
  },
  {
    "id": "java-quiz-t19-4",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1004, what is printed to the console?",
    "options": [
      "An overflow value of -2147482645 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1004 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1004)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-4",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_4().display()'?",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures.",
      "Child"
    ],
    "correctOptionIndex": 3,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_4', the call to log() is resolved to 'ChildService_4.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_4 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_4 extends ParentService_4 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-5",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 7, keepAliveTime = 60s, and a workQueue capacity of 15. If you submit 22 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "4 active threads running tasks, with 18 tasks in the queue.",
      "7 active threads running tasks, with 15 tasks waiting in the queue.",
      "7 active threads running tasks, with 15 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "ThreadPoolExecutor rules: 1) First 4 tasks spawn 4 core threads. 2) Next 15 tasks fill the queue. 3) Remaining tasks spawn threads up to max (7). Since total tasks (22) fit within capacity, the pool spawns 3 extra threads, resulting in 7 active threads and 15 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 7, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(15)\n);\nfor (int i = 0; i < 22; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-5",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 5 distinct instances of class CustomKey_5 into a standard HashMap. Class CustomKey_5 overrides hashCode() to return constant 150, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket.",
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference."
    ],
    "correctOptionIndex": 3,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_5 {\n    private int id;\n    public CustomKey_5(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 150; }\n}\nMap<CustomKey_5, String> map = new HashMap<>();\nCustomKey_5 searchKey = null;\nfor (int k = 1; k <= 5; k++) {\n    CustomKey_5 key = new CustomKey_5(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-5",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Integer?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error.",
      "Operations A and C are valid; Operation B is a compile error."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so reading from it as Integer (A) is valid, but writing to it is banned (B). List<? super Integer> is a Consumer, so adding Integer objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Operation A: Integer val = src.get(0);\n    // Operation B: src.add(50);\n    // Operation C: dest.add(50);\n}"
  },
  {
    "id": "java-quiz-t4-5",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1050ms. Thread T2 sleeps for 800ms. If the main thread calls T1.join(350) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 800ms, because the main thread waits for the 350ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 1850ms, as both join calls execute fully sequentially.",
      "Approximately 1050ms, since T1 takes the longest to complete.",
      "Approximately 350ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 0,
    "explanation": "The main thread blocks on t1.join(350) for 350ms. During this time, T2 has also slept for 350ms, leaving 450ms of sleep. When t2.join() is called, the main thread blocks for the remaining 450ms. Total wait = 350 + 450 = 800ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1050); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(800); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(350);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-5",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 18. If you add 19 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "36 (capacity doubles when full)",
      "28 (capacity grows by a fixed step of 10)",
      "19 (capacity grows to fit exactly the inserted elements)",
      "27 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 18, the new capacity is 18 + 9 = 27.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(18);\nfor (int j = 0; j < 19; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-5",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_5\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap."
    ],
    "correctOptionIndex": 3,
    "explanation": "This statement creates two objects: the literal string \"poolStr_5\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_5\");"
  },
  {
    "id": "java-quiz-t7-5",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_5' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_5()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_5\")\n                   .orElse(fetchDb_5());\n}\npublic String fetchDb_5() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-5",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 3 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 3 concurrent threads inside the custom ForkJoinPool.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 3), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(3);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-5",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_5' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_5' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_5 = new Object();\nmap.put(keyData_5, \"ActiveSession\");\n\nkeyData_5 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-5",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_5\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_5\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_5\". The handle() block captures this exception (ex is non-null) and returns \"fallback_5\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_5\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_5\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-5",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_5' and the resource's close() method throws 'CloseErr_5', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_5' is thrown; the 'TryErr_5' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_5' is thrown; the exception containing 'CloseErr_5' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_5' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_5 = new CustomResource()) { // close() throws CloseErr_5\n    throw new RuntimeException(\"TryErr_5\");\n}"
  },
  {
    "id": "java-quiz-t12-5",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A synchronized block or synchronized method.",
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-5",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 2",
      "Key 5",
      "Key 4",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 2, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-5",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "The print(Integer s) method executes because Integer is a more specific type than Object.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-5",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[0] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-5",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 10 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 10 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-5",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 50. Thread 1 calls compareAndSet(55, 60). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 60 regardless of expectation.",
      "Returns false, resulting in value 60 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match.",
      "Returns false, resulting in value 50."
    ],
    "correctOptionIndex": 3,
    "explanation": "compareAndSet checks if the current value equals the expected value (55). If it does (value is 50), it atomically updates it to 60 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(50);\nboolean updated = atomic.compareAndSet(55, 60);"
  },
  {
    "id": "java-quiz-t18-5",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When ClassB_5 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_5"
  },
  {
    "id": "java-quiz-t19-5",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1005, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2147482644 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1005 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1005)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-5",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_5().display()'?",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_5', the call to log() is resolved to 'ChildService_5.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_5 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_5 extends ParentService_5 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-6",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 4, keepAliveTime = 60s, and a workQueue capacity of 17. If you submit 20 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "2 active threads running tasks, with 18 tasks in the queue.",
      "4 active threads running tasks, with 16 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately.",
      "3 active threads running tasks, with 17 tasks waiting in the queue."
    ],
    "correctOptionIndex": 3,
    "explanation": "ThreadPoolExecutor rules: 1) First 2 tasks spawn 2 core threads. 2) Next 17 tasks fill the queue. 3) Remaining tasks spawn threads up to max (4). Since total tasks (20) fit within capacity, the pool spawns 1 extra threads, resulting in 3 active threads and 17 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 4, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(17)\n);\nfor (int i = 0; i < 20; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-6",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 6 distinct instances of class CustomKey_6 into a standard HashMap. Class CustomKey_6 overrides hashCode() to return constant 160, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 1,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_6 {\n    private int id;\n    public CustomKey_6(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 160; }\n}\nMap<CustomKey_6, String> map = new HashMap<>();\nCustomKey_6 searchKey = null;\nfor (int k = 1; k <= 6; k++) {\n    CustomKey_6 key = new CustomKey_6(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-6",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Double?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and C are valid; Operation B is a compile error.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Double> is a Producer, so reading from it as Double (A) is valid, but writing to it is banned (B). List<? super Double> is a Consumer, so adding Double objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Double> src, List<? super Double> dest) {\n    // Operation A: Double val = src.get(0);\n    // Operation B: src.add(60);\n    // Operation C: dest.add(60);\n}"
  },
  {
    "id": "java-quiz-t4-6",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1100ms. Thread T2 sleeps for 840ms. If the main thread calls T1.join(360) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 1940ms, as both join calls execute fully sequentially.",
      "Approximately 840ms, because the main thread waits for the 360ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 1100ms, since T1 takes the longest to complete.",
      "Approximately 360ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "The main thread blocks on t1.join(360) for 360ms. During this time, T2 has also slept for 360ms, leaving 480ms of sleep. When t2.join() is called, the main thread blocks for the remaining 480ms. Total wait = 360 + 480 = 840ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1100); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(840); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(360);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-6",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 20. If you add 21 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "30 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "40 (capacity doubles when full)",
      "30 (capacity grows by a fixed step of 10)",
      "21 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 20, the new capacity is 20 + 10 = 30.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(20);\nfor (int j = 0; j < 21; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-6",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_6\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"poolStr_6\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_6\");"
  },
  {
    "id": "java-quiz-t7-6",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_6' evaluated?",
    "options": [
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_6()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_6\")\n                   .orElse(fetchDb_6());\n}\npublic String fetchDb_6() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-6",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 4 on a machine with 1 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 1 threads, matching the physical CPU cores.",
      "Up to 0 threads, as the common pool always reserves one core.",
      "Up to 4 concurrent threads inside the custom ForkJoinPool.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 4), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(4);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-6",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_6' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_6' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_6 = new Object();\nmap.put(keyData_6, \"ActiveSession\");\n\nkeyData_6 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-6",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"fallback_6\"",
      "\"err_6\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 1,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_6\". The handle() block captures this exception (ex is non-null) and returns \"fallback_6\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_6\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_6\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-6",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_6' and the resource's close() method throws 'CloseErr_6', which exception propagates and how is the other retrieved?",
    "options": [
      "The RuntimeException containing 'TryErr_6' is thrown; the exception containing 'CloseErr_6' is added to it as a suppressed exception.",
      "The exception containing 'CloseErr_6' is thrown; the 'TryErr_6' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_6' without suppressing the other."
    ],
    "correctOptionIndex": 0,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_6 = new CustomResource()) { // close() throws CloseErr_6\n    throw new RuntimeException(\"TryErr_6\");\n}"
  },
  {
    "id": "java-quiz-t12-6",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-6",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(1), and then put key 4, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 1",
      "Key 4",
      "Key 3",
      "Key 2"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 1 moves it to the end. The eldest key is the least recently accessed. If capacity is 3 and we accessed 1, the remaining oldest key (which is 2) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(1);\nmap.put(4, \"Val_\" + 4);"
  },
  {
    "id": "java-quiz-t14-6",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Double s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch.",
      "The print(Double s) method executes because Double is a more specific type than Object."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Double' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Double s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Double s) { System.out.print(\"Double\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-6",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[1] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-6",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 11 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 11 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-6",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 60. Thread 1 calls compareAndSet(60, 70). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 70 regardless of expectation.",
      "Returns false, resulting in value 70 due to lock-free CAS loops.",
      "Returns true, resulting in value 70.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (60). If it does (value is 60), it atomically updates it to 70 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(60);\nboolean updated = atomic.compareAndSet(60, 70);"
  },
  {
    "id": "java-quiz-t18-6",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When ClassB_6 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_6"
  },
  {
    "id": "java-quiz-t19-6",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1006, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An overflow value of -2147482643 (due to standard 32-bit signed integer overflow).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1006 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1006)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-6",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_6().display()'?",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_6', the call to log() is resolved to 'ChildService_6.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_6 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_6 extends ParentService_6 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-7",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 19. If you submit 24 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "3 active threads running tasks, with 21 tasks in the queue.",
      "6 active threads running tasks, with 18 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately.",
      "5 active threads running tasks, with 19 tasks waiting in the queue."
    ],
    "correctOptionIndex": 3,
    "explanation": "ThreadPoolExecutor rules: 1) First 3 tasks spawn 3 core threads. 2) Next 19 tasks fill the queue. 3) Remaining tasks spawn threads up to max (6). Since total tasks (24) fit within capacity, the pool spawns 2 extra threads, resulting in 5 active threads and 19 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(19)\n);\nfor (int i = 0; i < 24; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-7",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKey_7 into a standard HashMap. Class CustomKey_7 overrides hashCode() to return constant 170, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket.",
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference."
    ],
    "correctOptionIndex": 3,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_7 {\n    private int id;\n    public CustomKey_7(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 170; }\n}\nMap<CustomKey_7, String> map = new HashMap<>();\nCustomKey_7 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKey_7 key = new CustomKey_7(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-7",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Float?",
    "options": [
      "Operations A and C are valid; Operation B is a compile error.",
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under PECS: List<? extends Float> is a Producer, so reading from it as Float (A) is valid, but writing to it is banned (B). List<? super Float> is a Consumer, so adding Float objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Float> src, List<? super Float> dest) {\n    // Operation A: Float val = src.get(0);\n    // Operation B: src.add(70);\n    // Operation C: dest.add(70);\n}"
  },
  {
    "id": "java-quiz-t4-7",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1150ms. Thread T2 sleeps for 880ms. If the main thread calls T1.join(370) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 2030ms, as both join calls execute fully sequentially.",
      "Approximately 1150ms, since T1 takes the longest to complete.",
      "Approximately 880ms, because the main thread waits for the 370ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 370ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "The main thread blocks on t1.join(370) for 370ms. During this time, T2 has also slept for 370ms, leaving 510ms of sleep. When t2.join() is called, the main thread blocks for the remaining 510ms. Total wait = 370 + 510 = 880ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1150); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(880); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(370);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-7",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 22. If you add 23 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "44 (capacity doubles when full)",
      "32 (capacity grows by a fixed step of 10)",
      "33 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "23 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 2,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 22, the new capacity is 22 + 11 = 33.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(22);\nfor (int j = 0; j < 23; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-7",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_7\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 2,
    "explanation": "This statement creates two objects: the literal string \"poolStr_7\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_7\");"
  },
  {
    "id": "java-quiz-t7-7",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_7' evaluated?",
    "options": [
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_7()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_7\")\n                   .orElse(fetchDb_7());\n}\npublic String fetchDb_7() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-7",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 5 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations.",
      "Up to 5 concurrent threads inside the custom ForkJoinPool."
    ],
    "correctOptionIndex": 3,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 5), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(5);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-7",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_7' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_7' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_7 = new Object();\nmap.put(keyData_7, \"ActiveSession\");\n\nkeyData_7 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-7",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"fallback_7\"",
      "\"Secondary_Fallback\"",
      "\"err_7\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 0,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_7\". The handle() block captures this exception (ex is non-null) and returns \"fallback_7\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_7\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_7\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-7",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_7' and the resource's close() method throws 'CloseErr_7', which exception propagates and how is the other retrieved?",
    "options": [
      "The RuntimeException containing 'TryErr_7' is thrown; the exception containing 'CloseErr_7' is added to it as a suppressed exception.",
      "The exception containing 'CloseErr_7' is thrown; the 'TryErr_7' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_7' without suppressing the other."
    ],
    "correctOptionIndex": 0,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_7 = new CustomResource()) { // close() throws CloseErr_7\n    throw new RuntimeException(\"TryErr_7\");\n}"
  },
  {
    "id": "java-quiz-t12-7",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "A synchronized block or synchronized method.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-7",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(4), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 1",
      "Key 4",
      "Key 5",
      "Key 4"
    ],
    "correctOptionIndex": 0,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 4 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 4, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(4);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-7",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Runnable s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "The print(Runnable s) method executes because Runnable is a more specific type than Object.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Runnable' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Runnable s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Runnable s) { System.out.print(\"Runnable\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-7",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[2] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-7",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 12 threads, what runtime issue can occur?",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 12 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-7",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 70. Thread 1 calls compareAndSet(75, 80). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns false, resulting in value 70.",
      "Returns true, resulting in value 80 regardless of expectation.",
      "Returns false, resulting in value 80 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (75). If it does (value is 70), it atomically updates it to 80 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(70);\nboolean updated = atomic.compareAndSet(75, 80);"
  },
  {
    "id": "java-quiz-t18-7",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When ClassB_7 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_7"
  },
  {
    "id": "java-quiz-t19-7",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1007, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An overflow value of -2147482642 (due to standard 32-bit signed integer overflow).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1007 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1007)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-7",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_7().display()'?",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures.",
      "Child"
    ],
    "correctOptionIndex": 3,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_7', the call to log() is resolved to 'ChildService_7.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_7 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_7 extends ParentService_7 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-8",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 21. If you submit 28 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "4 active threads running tasks, with 24 tasks in the queue.",
      "6 active threads running tasks, with 21 tasks in the queue without rejection.",
      "The task execution throws a RejectedExecutionException for the last task(s) exceeding capacity.",
      "The pool dynamically grows to 28 threads to prevent task rejection."
    ],
    "correctOptionIndex": 2,
    "explanation": "ThreadPoolExecutor rules: 1) First 4 tasks spawn 4 core threads. 2) Next 21 tasks fill the queue. 3) Remaining tasks spawn threads up to max (6). Since total tasks (28) exceed core + queue + max capacity (27), the excess tasks are rejected with RejectedExecutionException.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(21)\n);\nfor (int i = 0; i < 28; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-8",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 4 distinct instances of class CustomKey_8 into a standard HashMap. Class CustomKey_8 overrides hashCode() to return constant 180, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_8 {\n    private int id;\n    public CustomKey_8(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 180; }\n}\nMap<CustomKey_8, String> map = new HashMap<>();\nCustomKey_8 searchKey = null;\nfor (int k = 1; k <= 4; k++) {\n    CustomKey_8 key = new CustomKey_8(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-8",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Number?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and C are valid; Operation B is a compile error.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Number> is a Producer, so reading from it as Number (A) is valid, but writing to it is banned (B). List<? super Number> is a Consumer, so adding Number objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Number> src, List<? super Number> dest) {\n    // Operation A: Number val = src.get(0);\n    // Operation B: src.add(80);\n    // Operation C: dest.add(80);\n}"
  },
  {
    "id": "java-quiz-t4-8",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1200ms. Thread T2 sleeps for 920ms. If the main thread calls T1.join(380) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 2120ms, as both join calls execute fully sequentially.",
      "Approximately 1200ms, since T1 takes the longest to complete.",
      "Approximately 920ms, because the main thread waits for the 380ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 380ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "The main thread blocks on t1.join(380) for 380ms. During this time, T2 has also slept for 380ms, leaving 540ms of sleep. When t2.join() is called, the main thread blocks for the remaining 540ms. Total wait = 380 + 540 = 920ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1200); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(920); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(380);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-8",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 24. If you add 25 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "48 (capacity doubles when full)",
      "34 (capacity grows by a fixed step of 10)",
      "36 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "25 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 2,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 24, the new capacity is 24 + 12 = 36.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(24);\nfor (int j = 0; j < 25; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-8",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_8\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap."
    ],
    "correctOptionIndex": 3,
    "explanation": "This statement creates two objects: the literal string \"poolStr_8\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_8\");"
  },
  {
    "id": "java-quiz-t7-8",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_8' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_8()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_8\")\n                   .orElse(fetchDb_8());\n}\npublic String fetchDb_8() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-8",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 2 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations.",
      "Up to 2 concurrent threads inside the custom ForkJoinPool."
    ],
    "correctOptionIndex": 3,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 2), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(2);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-8",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_8' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_8' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_8 = new Object();\nmap.put(keyData_8, \"ActiveSession\");\n\nkeyData_8 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-8",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"fallback_8\"",
      "\"Secondary_Fallback\"",
      "\"err_8\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 0,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_8\". The handle() block captures this exception (ex is non-null) and returns \"fallback_8\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_8\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_8\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-8",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_8' and the resource's close() method throws 'CloseErr_8', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_8' is thrown; the 'TryErr_8' exception is discarded.",
      "The RuntimeException containing 'TryErr_8' is thrown; the exception containing 'CloseErr_8' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_8' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_8 = new CustomResource()) { // close() throws CloseErr_8\n    throw new RuntimeException(\"TryErr_8\");\n}"
  },
  {
    "id": "java-quiz-t12-8",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-8",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(3), and then put key 4, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 3",
      "Key 4",
      "Key 3",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 3 moves it to the end. The eldest key is the least recently accessed. If capacity is 3 and we accessed 3, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(3);\nmap.put(4, \"Val_\" + 4);"
  },
  {
    "id": "java-quiz-t14-8",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(String s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "The print(String s) method executes because String is a more specific type than Object.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'String' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(String s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(String s) { System.out.print(\"String\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-8",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[3] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-8",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 13 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 13 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-8",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 80. Thread 1 calls compareAndSet(80, 90). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 90.",
      "Returns true, resulting in value 90 regardless of expectation.",
      "Returns false, resulting in value 90 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (80). If it does (value is 80), it atomically updates it to 90 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(80);\nboolean updated = atomic.compareAndSet(80, 90);"
  },
  {
    "id": "java-quiz-t18-8",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When ClassB_8 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_8"
  },
  {
    "id": "java-quiz-t19-8",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1008, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An overflow value of -2147482641 (due to standard 32-bit signed integer overflow).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1008 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1008)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-8",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_8().display()'?",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures.",
      "Child"
    ],
    "correctOptionIndex": 3,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_8', the call to log() is resolved to 'ChildService_8.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_8 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_8 extends ParentService_8 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-9",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 23. If you submit 26 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "2 active threads running tasks, with 24 tasks in the queue.",
      "5 active threads running tasks, with 21 tasks in the queue.",
      "3 active threads running tasks, with 23 tasks waiting in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "ThreadPoolExecutor rules: 1) First 2 tasks spawn 2 core threads. 2) Next 23 tasks fill the queue. 3) Remaining tasks spawn threads up to max (5). Since total tasks (26) fit within capacity, the pool spawns 1 extra threads, resulting in 3 active threads and 23 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(23)\n);\nfor (int i = 0; i < 26; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-9",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 5 distinct instances of class CustomKey_9 into a standard HashMap. Class CustomKey_9 overrides hashCode() to return constant 190, but does not override equals(). What happens when you retrieve the key with id = 5?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_5\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_9 {\n    private int id;\n    public CustomKey_9(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 190; }\n}\nMap<CustomKey_9, String> map = new HashMap<>();\nCustomKey_9 searchKey = null;\nfor (int k = 1; k <= 5; k++) {\n    CustomKey_9 key = new CustomKey_9(k);\n    if (k == 5) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-9",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Integer?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and C are valid; Operation B is a compile error.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so reading from it as Integer (A) is valid, but writing to it is banned (B). List<? super Integer> is a Consumer, so adding Integer objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Operation A: Integer val = src.get(0);\n    // Operation B: src.add(90);\n    // Operation C: dest.add(90);\n}"
  },
  {
    "id": "java-quiz-t4-9",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1250ms. Thread T2 sleeps for 960ms. If the main thread calls T1.join(390) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 2210ms, as both join calls execute fully sequentially.",
      "Approximately 1250ms, since T1 takes the longest to complete.",
      "Approximately 390ms, as both threads are forced to interrupt.",
      "Approximately 960ms, because the main thread waits for the 390ms timeout on T1, then blocks for the remainder of T2's sleep."
    ],
    "correctOptionIndex": 3,
    "explanation": "The main thread blocks on t1.join(390) for 390ms. During this time, T2 has also slept for 390ms, leaving 570ms of sleep. When t2.join() is called, the main thread blocks for the remaining 570ms. Total wait = 390 + 570 = 960ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1250); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(960); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(390);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-9",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 26. If you add 27 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "52 (capacity doubles when full)",
      "36 (capacity grows by a fixed step of 10)",
      "39 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "27 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 2,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 26, the new capacity is 26 + 13 = 39.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(26);\nfor (int j = 0; j < 27; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-9",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_9\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 2,
    "explanation": "This statement creates two objects: the literal string \"poolStr_9\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_9\");"
  },
  {
    "id": "java-quiz-t7-9",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_9' evaluated?",
    "options": [
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_9()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_9\")\n                   .orElse(fetchDb_9());\n}\npublic String fetchDb_9() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-9",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 3 on a machine with 1 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Up to 3 concurrent threads inside the custom ForkJoinPool.",
      "Only 1 threads, matching the physical CPU cores.",
      "Up to 0 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 3), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(3);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-9",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_9' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_9' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_9 = new Object();\nmap.put(keyData_9, \"ActiveSession\");\n\nkeyData_9 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-9",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_9\"",
      "\"fallback_9\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_9\". The handle() block captures this exception (ex is non-null) and returns \"fallback_9\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_9\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_9\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-9",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_9' and the resource's close() method throws 'CloseErr_9', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_9' is thrown; the 'TryErr_9' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_9' is thrown; the exception containing 'CloseErr_9' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_9' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_9 = new CustomResource()) { // close() throws CloseErr_9\n    throw new RuntimeException(\"TryErr_9\");\n}"
  },
  {
    "id": "java-quiz-t12-9",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-9",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 2",
      "Key 5",
      "Key 4",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 2, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-9",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "The print(Integer s) method executes because Integer is a more specific type than Object.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-9",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[4] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-9",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 14 threads, what runtime issue can occur?",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 14 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-9",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 90. Thread 1 calls compareAndSet(95, 100). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 100 regardless of expectation.",
      "Returns false, resulting in value 90.",
      "Returns false, resulting in value 100 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 1,
    "explanation": "compareAndSet checks if the current value equals the expected value (95). If it does (value is 90), it atomically updates it to 100 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(90);\nboolean updated = atomic.compareAndSet(95, 100);"
  },
  {
    "id": "java-quiz-t18-9",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When ClassB_9 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_9"
  },
  {
    "id": "java-quiz-t19-9",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1009, what is printed to the console?",
    "options": [
      "An overflow value of -2147482640 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1009 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1009)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-9",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_9().display()'?",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures.",
      "Child"
    ],
    "correctOptionIndex": 3,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_9', the call to log() is resolved to 'ChildService_9.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_9 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_9 extends ParentService_9 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-10",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 25. If you submit 30 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "5 active threads running tasks, with 25 tasks waiting in the queue.",
      "3 active threads running tasks, with 27 tasks in the queue.",
      "5 active threads running tasks, with 25 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "ThreadPoolExecutor rules: 1) First 3 tasks spawn 3 core threads. 2) Next 25 tasks fill the queue. 3) Remaining tasks spawn threads up to max (5). Since total tasks (30) fit within capacity, the pool spawns 2 extra threads, resulting in 5 active threads and 25 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(25)\n);\nfor (int i = 0; i < 30; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-10",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 6 distinct instances of class CustomKey_10 into a standard HashMap. Class CustomKey_10 overrides hashCode() to return constant 200, but does not override equals(). What happens when you retrieve the key with id = 5?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The retrieval succeeds and returns \"Val_5\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 1,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_10 {\n    private int id;\n    public CustomKey_10(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 200; }\n}\nMap<CustomKey_10, String> map = new HashMap<>();\nCustomKey_10 searchKey = null;\nfor (int k = 1; k <= 6; k++) {\n    CustomKey_10 key = new CustomKey_10(k);\n    if (k == 5) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-10",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Double?",
    "options": [
      "Operations A and C are valid; Operation B is a compile error.",
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under PECS: List<? extends Double> is a Producer, so reading from it as Double (A) is valid, but writing to it is banned (B). List<? super Double> is a Consumer, so adding Double objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Double> src, List<? super Double> dest) {\n    // Operation A: Double val = src.get(0);\n    // Operation B: src.add(100);\n    // Operation C: dest.add(100);\n}"
  },
  {
    "id": "java-quiz-t4-10",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1300ms. Thread T2 sleeps for 1000ms. If the main thread calls T1.join(400) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 2300ms, as both join calls execute fully sequentially.",
      "Approximately 1300ms, since T1 takes the longest to complete.",
      "Approximately 1000ms, because the main thread waits for the 400ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 400ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "The main thread blocks on t1.join(400) for 400ms. During this time, T2 has also slept for 400ms, leaving 600ms of sleep. When t2.join() is called, the main thread blocks for the remaining 600ms. Total wait = 400 + 600 = 1000ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1300); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1000); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(400);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-10",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 28. If you add 29 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "56 (capacity doubles when full)",
      "42 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "38 (capacity grows by a fixed step of 10)",
      "29 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 28, the new capacity is 28 + 14 = 42.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(28);\nfor (int j = 0; j < 29; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-10",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_10\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"poolStr_10\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_10\");"
  },
  {
    "id": "java-quiz-t7-10",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_10' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_10()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_10\")\n                   .orElse(fetchDb_10());\n}\npublic String fetchDb_10() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-10",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 4 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "Up to 4 concurrent threads inside the custom ForkJoinPool.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 4), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(4);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-10",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_10' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_10' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_10 = new Object();\nmap.put(keyData_10, \"ActiveSession\");\n\nkeyData_10 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-10",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_10\"",
      "\"fallback_10\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_10\". The handle() block captures this exception (ex is non-null) and returns \"fallback_10\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_10\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_10\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-10",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_10' and the resource's close() method throws 'CloseErr_10', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_10' is thrown; the 'TryErr_10' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_10' without suppressing the other.",
      "The RuntimeException containing 'TryErr_10' is thrown; the exception containing 'CloseErr_10' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_10 = new CustomResource()) { // close() throws CloseErr_10\n    throw new RuntimeException(\"TryErr_10\");\n}"
  },
  {
    "id": "java-quiz-t12-10",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-10",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(2), and then put key 4, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 2",
      "Key 4",
      "Key 3",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If capacity is 3 and we accessed 2, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(4, \"Val_\" + 4);"
  },
  {
    "id": "java-quiz-t14-10",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Double s), which method executes when print(null) is called?",
    "options": [
      "The print(Double s) method executes because Double is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Double' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Double s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Double s) { System.out.print(\"Double\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-10",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[0] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-10",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 15 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 2,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 15 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-10",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 100. Thread 1 calls compareAndSet(100, 110). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 110 regardless of expectation.",
      "Returns true, resulting in value 110.",
      "Returns false, resulting in value 110 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 1,
    "explanation": "compareAndSet checks if the current value equals the expected value (100). If it does (value is 100), it atomically updates it to 110 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(100);\nboolean updated = atomic.compareAndSet(100, 110);"
  },
  {
    "id": "java-quiz-t18-10",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When ClassB_10 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_10"
  },
  {
    "id": "java-quiz-t19-10",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1010, what is printed to the console?",
    "options": [
      "An overflow value of -2147482639 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1010 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1010)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-10",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_10().display()'?",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_10', the call to log() is resolved to 'ChildService_10.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_10 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_10 extends ParentService_10 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-11",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 7, keepAliveTime = 60s, and a workQueue capacity of 27. If you submit 34 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "7 active threads running tasks, with 27 tasks waiting in the queue.",
      "4 active threads running tasks, with 30 tasks in the queue.",
      "7 active threads running tasks, with 27 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "ThreadPoolExecutor rules: 1) First 4 tasks spawn 4 core threads. 2) Next 27 tasks fill the queue. 3) Remaining tasks spawn threads up to max (7). Since total tasks (34) fit within capacity, the pool spawns 3 extra threads, resulting in 7 active threads and 27 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 7, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(27)\n);\nfor (int i = 0; i < 34; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-11",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKey_11 into a standard HashMap. Class CustomKey_11 overrides hashCode() to return constant 210, but does not override equals(). What happens when you retrieve the key with id = 5?",
    "options": [
      "The retrieval succeeds and returns \"Val_5\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_11 {\n    private int id;\n    public CustomKey_11(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 210; }\n}\nMap<CustomKey_11, String> map = new HashMap<>();\nCustomKey_11 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKey_11 key = new CustomKey_11(k);\n    if (k == 5) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-11",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Float?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "Operations A and C are valid; Operation B is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Float> is a Producer, so reading from it as Float (A) is valid, but writing to it is banned (B). List<? super Float> is a Consumer, so adding Float objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Float> src, List<? super Float> dest) {\n    // Operation A: Float val = src.get(0);\n    // Operation B: src.add(110);\n    // Operation C: dest.add(110);\n}"
  },
  {
    "id": "java-quiz-t4-11",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1350ms. Thread T2 sleeps for 1040ms. If the main thread calls T1.join(410) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 2390ms, as both join calls execute fully sequentially.",
      "Approximately 1350ms, since T1 takes the longest to complete.",
      "Approximately 1040ms, because the main thread waits for the 410ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 410ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "The main thread blocks on t1.join(410) for 410ms. During this time, T2 has also slept for 410ms, leaving 630ms of sleep. When t2.join() is called, the main thread blocks for the remaining 630ms. Total wait = 410 + 630 = 1040ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1350); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1040); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(410);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-11",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 30. If you add 31 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "60 (capacity doubles when full)",
      "45 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "40 (capacity grows by a fixed step of 10)",
      "31 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 30, the new capacity is 30 + 15 = 45.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(30);\nfor (int j = 0; j < 31; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-11",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_11\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap."
    ],
    "correctOptionIndex": 3,
    "explanation": "This statement creates two objects: the literal string \"poolStr_11\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_11\");"
  },
  {
    "id": "java-quiz-t7-11",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_11' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_11()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_11\")\n                   .orElse(fetchDb_11());\n}\npublic String fetchDb_11() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-11",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 5 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "Up to 5 concurrent threads inside the custom ForkJoinPool.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 5), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(5);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-11",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_11' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 1,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_11' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_11 = new Object();\nmap.put(keyData_11, \"ActiveSession\");\n\nkeyData_11 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-11",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"fallback_11\"",
      "\"err_11\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 1,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_11\". The handle() block captures this exception (ex is non-null) and returns \"fallback_11\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_11\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_11\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-11",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_11' and the resource's close() method throws 'CloseErr_11', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_11' is thrown; the 'TryErr_11' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_11' is thrown; the exception containing 'CloseErr_11' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_11' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_11 = new CustomResource()) { // close() throws CloseErr_11\n    throw new RuntimeException(\"TryErr_11\");\n}"
  },
  {
    "id": "java-quiz-t12-11",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-11",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(4), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 1",
      "Key 4",
      "Key 5",
      "Key 4"
    ],
    "correctOptionIndex": 0,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 4 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 4, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(4);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-11",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Runnable s), which method executes when print(null) is called?",
    "options": [
      "The print(Runnable s) method executes because Runnable is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Runnable' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Runnable s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Runnable s) { System.out.print(\"Runnable\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-11",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[1] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-11",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 16 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 2,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 16 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-11",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 110. Thread 1 calls compareAndSet(115, 120). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 120 regardless of expectation.",
      "Returns false, resulting in value 110.",
      "Returns false, resulting in value 120 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 1,
    "explanation": "compareAndSet checks if the current value equals the expected value (115). If it does (value is 110), it atomically updates it to 120 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(110);\nboolean updated = atomic.compareAndSet(115, 120);"
  },
  {
    "id": "java-quiz-t18-11",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When ClassB_11 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_11"
  },
  {
    "id": "java-quiz-t19-11",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1011, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An overflow value of -2147482638 (due to standard 32-bit signed integer overflow).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1011 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1011)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-11",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_11().display()'?",
    "options": [
      "Child",
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 0,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_11', the call to log() is resolved to 'ChildService_11.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_11 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_11 extends ParentService_11 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-12",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 4, keepAliveTime = 60s, and a workQueue capacity of 29. If you submit 32 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "3 active threads running tasks, with 29 tasks waiting in the queue.",
      "2 active threads running tasks, with 30 tasks in the queue.",
      "4 active threads running tasks, with 28 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "ThreadPoolExecutor rules: 1) First 2 tasks spawn 2 core threads. 2) Next 29 tasks fill the queue. 3) Remaining tasks spawn threads up to max (4). Since total tasks (32) fit within capacity, the pool spawns 1 extra threads, resulting in 3 active threads and 29 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 4, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(29)\n);\nfor (int i = 0; i < 32; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-12",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 4 distinct instances of class CustomKey_12 into a standard HashMap. Class CustomKey_12 overrides hashCode() to return constant 220, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket.",
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference."
    ],
    "correctOptionIndex": 3,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_12 {\n    private int id;\n    public CustomKey_12(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 220; }\n}\nMap<CustomKey_12, String> map = new HashMap<>();\nCustomKey_12 searchKey = null;\nfor (int k = 1; k <= 4; k++) {\n    CustomKey_12 key = new CustomKey_12(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-12",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Number?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error.",
      "Operations A and C are valid; Operation B is a compile error."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under PECS: List<? extends Number> is a Producer, so reading from it as Number (A) is valid, but writing to it is banned (B). List<? super Number> is a Consumer, so adding Number objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Number> src, List<? super Number> dest) {\n    // Operation A: Number val = src.get(0);\n    // Operation B: src.add(120);\n    // Operation C: dest.add(120);\n}"
  },
  {
    "id": "java-quiz-t4-12",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1400ms. Thread T2 sleeps for 1080ms. If the main thread calls T1.join(420) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 2480ms, as both join calls execute fully sequentially.",
      "Approximately 1080ms, because the main thread waits for the 420ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 1400ms, since T1 takes the longest to complete.",
      "Approximately 420ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "The main thread blocks on t1.join(420) for 420ms. During this time, T2 has also slept for 420ms, leaving 660ms of sleep. When t2.join() is called, the main thread blocks for the remaining 660ms. Total wait = 420 + 660 = 1080ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1400); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1080); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(420);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-12",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 32. If you add 33 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "64 (capacity doubles when full)",
      "42 (capacity grows by a fixed step of 10)",
      "33 (capacity grows to fit exactly the inserted elements)",
      "48 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 32, the new capacity is 32 + 16 = 48.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(32);\nfor (int j = 0; j < 33; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-12",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_12\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 2,
    "explanation": "This statement creates two objects: the literal string \"poolStr_12\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_12\");"
  },
  {
    "id": "java-quiz-t7-12",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_12' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_12()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_12\")\n                   .orElse(fetchDb_12());\n}\npublic String fetchDb_12() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-12",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 2 on a machine with 1 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 1 threads, matching the physical CPU cores.",
      "Up to 2 concurrent threads inside the custom ForkJoinPool.",
      "Up to 0 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 2), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(2);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-12",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_12' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_12' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_12 = new Object();\nmap.put(keyData_12, \"ActiveSession\");\n\nkeyData_12 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-12",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"fallback_12\"",
      "\"Secondary_Fallback\"",
      "\"err_12\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 0,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_12\". The handle() block captures this exception (ex is non-null) and returns \"fallback_12\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_12\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_12\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-12",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_12' and the resource's close() method throws 'CloseErr_12', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_12' is thrown; the 'TryErr_12' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_12' without suppressing the other.",
      "The RuntimeException containing 'TryErr_12' is thrown; the exception containing 'CloseErr_12' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_12 = new CustomResource()) { // close() throws CloseErr_12\n    throw new RuntimeException(\"TryErr_12\");\n}"
  },
  {
    "id": "java-quiz-t12-12",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-12",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(1), and then put key 4, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 1",
      "Key 2",
      "Key 4",
      "Key 3"
    ],
    "correctOptionIndex": 1,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 1 moves it to the end. The eldest key is the least recently accessed. If capacity is 3 and we accessed 1, the remaining oldest key (which is 2) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(1);\nmap.put(4, \"Val_\" + 4);"
  },
  {
    "id": "java-quiz-t14-12",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(String s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "The print(String s) method executes because String is a more specific type than Object.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'String' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(String s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(String s) { System.out.print(\"String\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-12",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[2] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-12",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 17 threads, what runtime issue can occur?",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 17 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-12",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 120. Thread 1 calls compareAndSet(120, 130). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 130 regardless of expectation.",
      "Returns false, resulting in value 130 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match.",
      "Returns true, resulting in value 130."
    ],
    "correctOptionIndex": 3,
    "explanation": "compareAndSet checks if the current value equals the expected value (120). If it does (value is 120), it atomically updates it to 130 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(120);\nboolean updated = atomic.compareAndSet(120, 130);"
  },
  {
    "id": "java-quiz-t18-12",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When ClassB_12 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_12"
  },
  {
    "id": "java-quiz-t19-12",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1012, what is printed to the console?",
    "options": [
      "An overflow value of -2147482637 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1012 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1012)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-12",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_12().display()'?",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_12', the call to log() is resolved to 'ChildService_12.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_12 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_12 extends ParentService_12 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-13",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 31. If you submit 36 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "3 active threads running tasks, with 33 tasks in the queue.",
      "6 active threads running tasks, with 30 tasks in the queue.",
      "5 active threads running tasks, with 31 tasks waiting in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "ThreadPoolExecutor rules: 1) First 3 tasks spawn 3 core threads. 2) Next 31 tasks fill the queue. 3) Remaining tasks spawn threads up to max (6). Since total tasks (36) fit within capacity, the pool spawns 2 extra threads, resulting in 5 active threads and 31 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(31)\n);\nfor (int i = 0; i < 36; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-13",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 5 distinct instances of class CustomKey_13 into a standard HashMap. Class CustomKey_13 overrides hashCode() to return constant 230, but does not override equals(). What happens when you retrieve the key with id = 4?",
    "options": [
      "The retrieval succeeds and returns \"Val_4\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_13 {\n    private int id;\n    public CustomKey_13(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 230; }\n}\nMap<CustomKey_13, String> map = new HashMap<>();\nCustomKey_13 searchKey = null;\nfor (int k = 1; k <= 5; k++) {\n    CustomKey_13 key = new CustomKey_13(k);\n    if (k == 4) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-13",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Integer?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "Operations A and C are valid; Operation B is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so reading from it as Integer (A) is valid, but writing to it is banned (B). List<? super Integer> is a Consumer, so adding Integer objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Operation A: Integer val = src.get(0);\n    // Operation B: src.add(130);\n    // Operation C: dest.add(130);\n}"
  },
  {
    "id": "java-quiz-t4-13",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1450ms. Thread T2 sleeps for 1120ms. If the main thread calls T1.join(430) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 2570ms, as both join calls execute fully sequentially.",
      "Approximately 1450ms, since T1 takes the longest to complete.",
      "Approximately 430ms, as both threads are forced to interrupt.",
      "Approximately 1120ms, because the main thread waits for the 430ms timeout on T1, then blocks for the remainder of T2's sleep."
    ],
    "correctOptionIndex": 3,
    "explanation": "The main thread blocks on t1.join(430) for 430ms. During this time, T2 has also slept for 430ms, leaving 690ms of sleep. When t2.join() is called, the main thread blocks for the remaining 690ms. Total wait = 430 + 690 = 1120ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1450); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1120); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(430);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-13",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 34. If you add 35 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "51 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "68 (capacity doubles when full)",
      "44 (capacity grows by a fixed step of 10)",
      "35 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 34, the new capacity is 34 + 17 = 51.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(34);\nfor (int j = 0; j < 35; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-13",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_13\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"poolStr_13\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_13\");"
  },
  {
    "id": "java-quiz-t7-13",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_13' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_13()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_13\")\n                   .orElse(fetchDb_13());\n}\npublic String fetchDb_13() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-13",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 3 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "Up to 3 concurrent threads inside the custom ForkJoinPool.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 3), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(3);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-13",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_13' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_13' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_13 = new Object();\nmap.put(keyData_13, \"ActiveSession\");\n\nkeyData_13 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-13",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_13\"",
      "\"fallback_13\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_13\". The handle() block captures this exception (ex is non-null) and returns \"fallback_13\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_13\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_13\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-13",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_13' and the resource's close() method throws 'CloseErr_13', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_13' is thrown; the 'TryErr_13' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_13' is thrown; the exception containing 'CloseErr_13' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_13' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_13 = new CustomResource()) { // close() throws CloseErr_13\n    throw new RuntimeException(\"TryErr_13\");\n}"
  },
  {
    "id": "java-quiz-t12-13",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-13",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 1",
      "Key 2",
      "Key 5",
      "Key 4"
    ],
    "correctOptionIndex": 0,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 2, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-13",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch.",
      "The print(Integer s) method executes because Integer is a more specific type than Object."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-13",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[3] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-13",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 18 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 18 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-13",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 130. Thread 1 calls compareAndSet(135, 140). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns false, resulting in value 130.",
      "Returns true, resulting in value 140 regardless of expectation.",
      "Returns false, resulting in value 140 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (135). If it does (value is 130), it atomically updates it to 140 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(130);\nboolean updated = atomic.compareAndSet(135, 140);"
  },
  {
    "id": "java-quiz-t18-13",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassB_13 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 1,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_13"
  },
  {
    "id": "java-quiz-t19-13",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1013, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2147482636 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1013 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1013)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-13",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_13().display()'?",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_13', the call to log() is resolved to 'ChildService_13.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_13 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_13 extends ParentService_13 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-14",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 33. If you submit 40 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "The task execution throws a RejectedExecutionException for the last task(s) exceeding capacity.",
      "4 active threads running tasks, with 36 tasks in the queue.",
      "6 active threads running tasks, with 33 tasks in the queue without rejection.",
      "The pool dynamically grows to 40 threads to prevent task rejection."
    ],
    "correctOptionIndex": 0,
    "explanation": "ThreadPoolExecutor rules: 1) First 4 tasks spawn 4 core threads. 2) Next 33 tasks fill the queue. 3) Remaining tasks spawn threads up to max (6). Since total tasks (40) exceed core + queue + max capacity (39), the excess tasks are rejected with RejectedExecutionException.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(33)\n);\nfor (int i = 0; i < 40; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-14",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 6 distinct instances of class CustomKey_14 into a standard HashMap. Class CustomKey_14 overrides hashCode() to return constant 240, but does not override equals(). What happens when you retrieve the key with id = 3?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_3\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_14 {\n    private int id;\n    public CustomKey_14(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 240; }\n}\nMap<CustomKey_14, String> map = new HashMap<>();\nCustomKey_14 searchKey = null;\nfor (int k = 1; k <= 6; k++) {\n    CustomKey_14 key = new CustomKey_14(k);\n    if (k == 3) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-14",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Double?",
    "options": [
      "Operations A and C are valid; Operation B is a compile error.",
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under PECS: List<? extends Double> is a Producer, so reading from it as Double (A) is valid, but writing to it is banned (B). List<? super Double> is a Consumer, so adding Double objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Double> src, List<? super Double> dest) {\n    // Operation A: Double val = src.get(0);\n    // Operation B: src.add(140);\n    // Operation C: dest.add(140);\n}"
  },
  {
    "id": "java-quiz-t4-14",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1500ms. Thread T2 sleeps for 1160ms. If the main thread calls T1.join(440) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 2660ms, as both join calls execute fully sequentially.",
      "Approximately 1160ms, because the main thread waits for the 440ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 1500ms, since T1 takes the longest to complete.",
      "Approximately 440ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "The main thread blocks on t1.join(440) for 440ms. During this time, T2 has also slept for 440ms, leaving 720ms of sleep. When t2.join() is called, the main thread blocks for the remaining 720ms. Total wait = 440 + 720 = 1160ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1500); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1160); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(440);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-14",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 36. If you add 37 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "54 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "72 (capacity doubles when full)",
      "46 (capacity grows by a fixed step of 10)",
      "37 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 36, the new capacity is 36 + 18 = 54.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(36);\nfor (int j = 0; j < 37; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-14",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_14\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"poolStr_14\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_14\");"
  },
  {
    "id": "java-quiz-t7-14",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_14' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_14()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_14\")\n                   .orElse(fetchDb_14());\n}\npublic String fetchDb_14() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-14",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 4 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Up to 4 concurrent threads inside the custom ForkJoinPool.",
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 4), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(4);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-14",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_14' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 0,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_14' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_14 = new Object();\nmap.put(keyData_14, \"ActiveSession\");\n\nkeyData_14 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-14",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_14\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_14\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_14\". The handle() block captures this exception (ex is non-null) and returns \"fallback_14\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_14\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_14\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-14",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_14' and the resource's close() method throws 'CloseErr_14', which exception propagates and how is the other retrieved?",
    "options": [
      "The RuntimeException containing 'TryErr_14' is thrown; the exception containing 'CloseErr_14' is added to it as a suppressed exception.",
      "The exception containing 'CloseErr_14' is thrown; the 'TryErr_14' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_14' without suppressing the other."
    ],
    "correctOptionIndex": 0,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_14 = new CustomResource()) { // close() throws CloseErr_14\n    throw new RuntimeException(\"TryErr_14\");\n}"
  },
  {
    "id": "java-quiz-t12-14",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-14",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(3), and then put key 4, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 1",
      "Key 3",
      "Key 4",
      "Key 3"
    ],
    "correctOptionIndex": 0,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 3 moves it to the end. The eldest key is the least recently accessed. If capacity is 3 and we accessed 3, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(3);\nmap.put(4, \"Val_\" + 4);"
  },
  {
    "id": "java-quiz-t14-14",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Double s), which method executes when print(null) is called?",
    "options": [
      "The print(Double s) method executes because Double is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Double' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Double s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Double s) { System.out.print(\"Double\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-14",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[4] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-14",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 19 threads, what runtime issue can occur?",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 19 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-14",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 140. Thread 1 calls compareAndSet(140, 150). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 150.",
      "Returns true, resulting in value 150 regardless of expectation.",
      "Returns false, resulting in value 150 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (140). If it does (value is 140), it atomically updates it to 150 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(140);\nboolean updated = atomic.compareAndSet(140, 150);"
  },
  {
    "id": "java-quiz-t18-14",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When ClassB_14 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_14"
  },
  {
    "id": "java-quiz-t19-14",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1014, what is printed to the console?",
    "options": [
      "An overflow value of -2147482635 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1014 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1014)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-14",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_14().display()'?",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_14', the call to log() is resolved to 'ChildService_14.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_14 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_14 extends ParentService_14 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-15",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 35. If you submit 38 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "2 active threads running tasks, with 36 tasks in the queue.",
      "3 active threads running tasks, with 35 tasks waiting in the queue.",
      "5 active threads running tasks, with 33 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "ThreadPoolExecutor rules: 1) First 2 tasks spawn 2 core threads. 2) Next 35 tasks fill the queue. 3) Remaining tasks spawn threads up to max (5). Since total tasks (38) fit within capacity, the pool spawns 1 extra threads, resulting in 3 active threads and 35 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(35)\n);\nfor (int i = 0; i < 38; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-15",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKey_15 into a standard HashMap. Class CustomKey_15 overrides hashCode() to return constant 250, but does not override equals(). What happens when you retrieve the key with id = 2?",
    "options": [
      "The retrieval succeeds and returns \"Val_2\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_15 {\n    private int id;\n    public CustomKey_15(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 250; }\n}\nMap<CustomKey_15, String> map = new HashMap<>();\nCustomKey_15 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKey_15 key = new CustomKey_15(k);\n    if (k == 2) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-15",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Float?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and C are valid; Operation B is a compile error.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Float> is a Producer, so reading from it as Float (A) is valid, but writing to it is banned (B). List<? super Float> is a Consumer, so adding Float objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Float> src, List<? super Float> dest) {\n    // Operation A: Float val = src.get(0);\n    // Operation B: src.add(150);\n    // Operation C: dest.add(150);\n}"
  },
  {
    "id": "java-quiz-t4-15",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1550ms. Thread T2 sleeps for 1200ms. If the main thread calls T1.join(450) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 2750ms, as both join calls execute fully sequentially.",
      "Approximately 1200ms, because the main thread waits for the 450ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 1550ms, since T1 takes the longest to complete.",
      "Approximately 450ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "The main thread blocks on t1.join(450) for 450ms. During this time, T2 has also slept for 450ms, leaving 750ms of sleep. When t2.join() is called, the main thread blocks for the remaining 750ms. Total wait = 450 + 750 = 1200ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1550); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1200); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(450);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-15",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 38. If you add 39 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "76 (capacity doubles when full)",
      "57 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "48 (capacity grows by a fixed step of 10)",
      "39 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 38, the new capacity is 38 + 19 = 57.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(38);\nfor (int j = 0; j < 39; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-15",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_15\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"poolStr_15\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_15\");"
  },
  {
    "id": "java-quiz-t7-15",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_15' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_15()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_15\")\n                   .orElse(fetchDb_15());\n}\npublic String fetchDb_15() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-15",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 5 on a machine with 1 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Up to 5 concurrent threads inside the custom ForkJoinPool.",
      "Only 1 threads, matching the physical CPU cores.",
      "Up to 0 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 5), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(5);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-15",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_15' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 0,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_15' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_15 = new Object();\nmap.put(keyData_15, \"ActiveSession\");\n\nkeyData_15 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-15",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_15\"",
      "\"fallback_15\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_15\". The handle() block captures this exception (ex is non-null) and returns \"fallback_15\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_15\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_15\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-15",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_15' and the resource's close() method throws 'CloseErr_15', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_15' is thrown; the 'TryErr_15' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_15' without suppressing the other.",
      "The RuntimeException containing 'TryErr_15' is thrown; the exception containing 'CloseErr_15' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_15 = new CustomResource()) { // close() throws CloseErr_15\n    throw new RuntimeException(\"TryErr_15\");\n}"
  },
  {
    "id": "java-quiz-t12-15",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-15",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(4), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 4",
      "Key 5",
      "Key 1",
      "Key 4"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 4 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 4, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(4);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-15",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Runnable s), which method executes when print(null) is called?",
    "options": [
      "The print(Runnable s) method executes because Runnable is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Runnable' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Runnable s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Runnable s) { System.out.print(\"Runnable\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-15",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[0] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-15",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 20 threads, what runtime issue can occur?",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 20 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-15",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 150. Thread 1 calls compareAndSet(155, 160). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns false, resulting in value 150.",
      "Returns true, resulting in value 160 regardless of expectation.",
      "Returns false, resulting in value 160 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (155). If it does (value is 150), it atomically updates it to 160 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(150);\nboolean updated = atomic.compareAndSet(155, 160);"
  },
  {
    "id": "java-quiz-t18-15",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassB_15 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 1,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_15"
  },
  {
    "id": "java-quiz-t19-15",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1015, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An overflow value of -2147482634 (due to standard 32-bit signed integer overflow).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1015 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1015)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-15",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_15().display()'?",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_15', the call to log() is resolved to 'ChildService_15.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_15 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_15 extends ParentService_15 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-16",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 37. If you submit 42 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "3 active threads running tasks, with 39 tasks in the queue.",
      "5 active threads running tasks, with 37 tasks waiting in the queue.",
      "5 active threads running tasks, with 37 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "ThreadPoolExecutor rules: 1) First 3 tasks spawn 3 core threads. 2) Next 37 tasks fill the queue. 3) Remaining tasks spawn threads up to max (5). Since total tasks (42) fit within capacity, the pool spawns 2 extra threads, resulting in 5 active threads and 37 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(37)\n);\nfor (int i = 0; i < 42; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-16",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 4 distinct instances of class CustomKey_16 into a standard HashMap. Class CustomKey_16 overrides hashCode() to return constant 260, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 1,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_16 {\n    private int id;\n    public CustomKey_16(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 260; }\n}\nMap<CustomKey_16, String> map = new HashMap<>();\nCustomKey_16 searchKey = null;\nfor (int k = 1; k <= 4; k++) {\n    CustomKey_16 key = new CustomKey_16(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-16",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Number?",
    "options": [
      "Operations A and C are valid; Operation B is a compile error.",
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under PECS: List<? extends Number> is a Producer, so reading from it as Number (A) is valid, but writing to it is banned (B). List<? super Number> is a Consumer, so adding Number objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Number> src, List<? super Number> dest) {\n    // Operation A: Number val = src.get(0);\n    // Operation B: src.add(160);\n    // Operation C: dest.add(160);\n}"
  },
  {
    "id": "java-quiz-t4-16",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1600ms. Thread T2 sleeps for 1240ms. If the main thread calls T1.join(460) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 1240ms, because the main thread waits for the 460ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 2840ms, as both join calls execute fully sequentially.",
      "Approximately 1600ms, since T1 takes the longest to complete.",
      "Approximately 460ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 0,
    "explanation": "The main thread blocks on t1.join(460) for 460ms. During this time, T2 has also slept for 460ms, leaving 780ms of sleep. When t2.join() is called, the main thread blocks for the remaining 780ms. Total wait = 460 + 780 = 1240ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1600); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1240); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(460);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-16",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 40. If you add 41 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "80 (capacity doubles when full)",
      "60 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "50 (capacity grows by a fixed step of 10)",
      "41 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 40, the new capacity is 40 + 20 = 60.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(40);\nfor (int j = 0; j < 41; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-16",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_16\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"poolStr_16\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_16\");"
  },
  {
    "id": "java-quiz-t7-16",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_16' evaluated?",
    "options": [
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_16()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_16\")\n                   .orElse(fetchDb_16());\n}\npublic String fetchDb_16() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-16",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 2 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 2 concurrent threads inside the custom ForkJoinPool.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 2), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(2);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-16",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_16' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 1,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_16' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_16 = new Object();\nmap.put(keyData_16, \"ActiveSession\");\n\nkeyData_16 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-16",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_16\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_16\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_16\". The handle() block captures this exception (ex is non-null) and returns \"fallback_16\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_16\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_16\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-16",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_16' and the resource's close() method throws 'CloseErr_16', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_16' is thrown; the 'TryErr_16' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_16' without suppressing the other.",
      "The RuntimeException containing 'TryErr_16' is thrown; the exception containing 'CloseErr_16' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_16 = new CustomResource()) { // close() throws CloseErr_16\n    throw new RuntimeException(\"TryErr_16\");\n}"
  },
  {
    "id": "java-quiz-t12-16",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-16",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(2), and then put key 4, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 2",
      "Key 4",
      "Key 1",
      "Key 3"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If capacity is 3 and we accessed 2, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(4, \"Val_\" + 4);"
  },
  {
    "id": "java-quiz-t14-16",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(String s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch.",
      "The print(String s) method executes because String is a more specific type than Object."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'String' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(String s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(String s) { System.out.print(\"String\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-16",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[1] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-16",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 21 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 21 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-16",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 160. Thread 1 calls compareAndSet(160, 170). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 170 regardless of expectation.",
      "Returns true, resulting in value 170.",
      "Returns false, resulting in value 170 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 1,
    "explanation": "compareAndSet checks if the current value equals the expected value (160). If it does (value is 160), it atomically updates it to 170 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(160);\nboolean updated = atomic.compareAndSet(160, 170);"
  },
  {
    "id": "java-quiz-t18-16",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When ClassB_16 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_16"
  },
  {
    "id": "java-quiz-t19-16",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1016, what is printed to the console?",
    "options": [
      "An overflow value of -2147482633 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1016 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1016)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-16",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_16().display()'?",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_16', the call to log() is resolved to 'ChildService_16.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_16 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_16 extends ParentService_16 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-17",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 7, keepAliveTime = 60s, and a workQueue capacity of 39. If you submit 46 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "7 active threads running tasks, with 39 tasks waiting in the queue.",
      "4 active threads running tasks, with 42 tasks in the queue.",
      "7 active threads running tasks, with 39 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "ThreadPoolExecutor rules: 1) First 4 tasks spawn 4 core threads. 2) Next 39 tasks fill the queue. 3) Remaining tasks spawn threads up to max (7). Since total tasks (46) fit within capacity, the pool spawns 3 extra threads, resulting in 7 active threads and 39 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 7, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(39)\n);\nfor (int i = 0; i < 46; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-17",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 5 distinct instances of class CustomKey_17 into a standard HashMap. Class CustomKey_17 overrides hashCode() to return constant 270, but does not override equals(). What happens when you retrieve the key with id = 3?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket.",
      "The retrieval succeeds and returns \"Val_3\" because object reference identity (==) is checked and succeeds on the exact same key reference."
    ],
    "correctOptionIndex": 3,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_17 {\n    private int id;\n    public CustomKey_17(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 270; }\n}\nMap<CustomKey_17, String> map = new HashMap<>();\nCustomKey_17 searchKey = null;\nfor (int k = 1; k <= 5; k++) {\n    CustomKey_17 key = new CustomKey_17(k);\n    if (k == 3) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-17",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Integer?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "Operations A and C are valid; Operation B is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so reading from it as Integer (A) is valid, but writing to it is banned (B). List<? super Integer> is a Consumer, so adding Integer objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Operation A: Integer val = src.get(0);\n    // Operation B: src.add(170);\n    // Operation C: dest.add(170);\n}"
  },
  {
    "id": "java-quiz-t4-17",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1650ms. Thread T2 sleeps for 1280ms. If the main thread calls T1.join(470) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 2930ms, as both join calls execute fully sequentially.",
      "Approximately 1280ms, because the main thread waits for the 470ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 1650ms, since T1 takes the longest to complete.",
      "Approximately 470ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "The main thread blocks on t1.join(470) for 470ms. During this time, T2 has also slept for 470ms, leaving 810ms of sleep. When t2.join() is called, the main thread blocks for the remaining 810ms. Total wait = 470 + 810 = 1280ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1650); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1280); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(470);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-17",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 42. If you add 43 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "84 (capacity doubles when full)",
      "52 (capacity grows by a fixed step of 10)",
      "43 (capacity grows to fit exactly the inserted elements)",
      "63 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 42, the new capacity is 42 + 21 = 63.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(42);\nfor (int j = 0; j < 43; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-17",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_17\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap."
    ],
    "correctOptionIndex": 3,
    "explanation": "This statement creates two objects: the literal string \"poolStr_17\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_17\");"
  },
  {
    "id": "java-quiz-t7-17",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_17' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_17()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_17\")\n                   .orElse(fetchDb_17());\n}\npublic String fetchDb_17() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-17",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 3 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 3 concurrent threads inside the custom ForkJoinPool.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 3), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(3);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-17",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_17' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 1,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_17' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_17 = new Object();\nmap.put(keyData_17, \"ActiveSession\");\n\nkeyData_17 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-17",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_17\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_17\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_17\". The handle() block captures this exception (ex is non-null) and returns \"fallback_17\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_17\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_17\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-17",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_17' and the resource's close() method throws 'CloseErr_17', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_17' is thrown; the 'TryErr_17' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_17' without suppressing the other.",
      "The RuntimeException containing 'TryErr_17' is thrown; the exception containing 'CloseErr_17' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_17 = new CustomResource()) { // close() throws CloseErr_17\n    throw new RuntimeException(\"TryErr_17\");\n}"
  },
  {
    "id": "java-quiz-t12-17",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "A synchronized block or synchronized method.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-17",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 1",
      "Key 2",
      "Key 5",
      "Key 4"
    ],
    "correctOptionIndex": 0,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 2, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-17",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "The print(Integer s) method executes because Integer is a more specific type than Object.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-17",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[2] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-17",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 22 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 22 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-17",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 170. Thread 1 calls compareAndSet(175, 180). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 180 regardless of expectation.",
      "Returns false, resulting in value 180 due to lock-free CAS loops.",
      "Returns false, resulting in value 170.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (175). If it does (value is 170), it atomically updates it to 180 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(170);\nboolean updated = atomic.compareAndSet(175, 180);"
  },
  {
    "id": "java-quiz-t18-17",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When ClassB_17 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_17"
  },
  {
    "id": "java-quiz-t19-17",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1017, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator.",
      "An overflow value of -2147482632 (due to standard 32-bit signed integer overflow)."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1017 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1017)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-17",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_17().display()'?",
    "options": [
      "Child",
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 0,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_17', the call to log() is resolved to 'ChildService_17.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_17 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_17 extends ParentService_17 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-18",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 4, keepAliveTime = 60s, and a workQueue capacity of 41. If you submit 44 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "2 active threads running tasks, with 42 tasks in the queue.",
      "4 active threads running tasks, with 40 tasks in the queue.",
      "3 active threads running tasks, with 41 tasks waiting in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "ThreadPoolExecutor rules: 1) First 2 tasks spawn 2 core threads. 2) Next 41 tasks fill the queue. 3) Remaining tasks spawn threads up to max (4). Since total tasks (44) fit within capacity, the pool spawns 1 extra threads, resulting in 3 active threads and 41 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 4, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(41)\n);\nfor (int i = 0; i < 44; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-18",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 6 distinct instances of class CustomKey_18 into a standard HashMap. Class CustomKey_18 overrides hashCode() to return constant 280, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "options": [
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_18 {\n    private int id;\n    public CustomKey_18(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 280; }\n}\nMap<CustomKey_18, String> map = new HashMap<>();\nCustomKey_18 searchKey = null;\nfor (int k = 1; k <= 6; k++) {\n    CustomKey_18 key = new CustomKey_18(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-18",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Double?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "Operations A and C are valid; Operation B is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Double> is a Producer, so reading from it as Double (A) is valid, but writing to it is banned (B). List<? super Double> is a Consumer, so adding Double objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Double> src, List<? super Double> dest) {\n    // Operation A: Double val = src.get(0);\n    // Operation B: src.add(180);\n    // Operation C: dest.add(180);\n}"
  },
  {
    "id": "java-quiz-t4-18",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1700ms. Thread T2 sleeps for 1320ms. If the main thread calls T1.join(480) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 3020ms, as both join calls execute fully sequentially.",
      "Approximately 1320ms, because the main thread waits for the 480ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 1700ms, since T1 takes the longest to complete.",
      "Approximately 480ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "The main thread blocks on t1.join(480) for 480ms. During this time, T2 has also slept for 480ms, leaving 840ms of sleep. When t2.join() is called, the main thread blocks for the remaining 840ms. Total wait = 480 + 840 = 1320ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1700); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1320); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(480);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-18",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 44. If you add 45 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "88 (capacity doubles when full)",
      "66 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "54 (capacity grows by a fixed step of 10)",
      "45 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 44, the new capacity is 44 + 22 = 66.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(44);\nfor (int j = 0; j < 45; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-18",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_18\" is NOT already present in the String Constant Pool?",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"poolStr_18\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_18\");"
  },
  {
    "id": "java-quiz-t7-18",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_18' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_18()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_18\")\n                   .orElse(fetchDb_18());\n}\npublic String fetchDb_18() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-18",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 4 on a machine with 1 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 1 threads, matching the physical CPU cores.",
      "Up to 4 concurrent threads inside the custom ForkJoinPool.",
      "Up to 0 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 4), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(4);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-18",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_18' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_18' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_18 = new Object();\nmap.put(keyData_18, \"ActiveSession\");\n\nkeyData_18 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-18",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_18\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_18\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_18\". The handle() block captures this exception (ex is non-null) and returns \"fallback_18\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_18\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_18\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-18",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_18' and the resource's close() method throws 'CloseErr_18', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_18' is thrown; the 'TryErr_18' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_18' is thrown; the exception containing 'CloseErr_18' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_18' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_18 = new CustomResource()) { // close() throws CloseErr_18\n    throw new RuntimeException(\"TryErr_18\");\n}"
  },
  {
    "id": "java-quiz-t12-18",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-18",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(1), and then put key 4, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 1",
      "Key 4",
      "Key 2",
      "Key 3"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 1 moves it to the end. The eldest key is the least recently accessed. If capacity is 3 and we accessed 1, the remaining oldest key (which is 2) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(1);\nmap.put(4, \"Val_\" + 4);"
  },
  {
    "id": "java-quiz-t14-18",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Double s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "The print(Double s) method executes because Double is a more specific type than Object.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Double' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Double s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Double s) { System.out.print(\"Double\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-18",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[3] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-18",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 23 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 2,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 23 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-18",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 180. Thread 1 calls compareAndSet(180, 190). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 190 regardless of expectation.",
      "Returns false, resulting in value 190 due to lock-free CAS loops.",
      "Returns true, resulting in value 190.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (180). If it does (value is 180), it atomically updates it to 190 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(180);\nboolean updated = atomic.compareAndSet(180, 190);"
  },
  {
    "id": "java-quiz-t18-18",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When ClassB_18 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_18"
  },
  {
    "id": "java-quiz-t19-18",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1018, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2147482631 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1018 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1018)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-18",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_18().display()'?",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_18', the call to log() is resolved to 'ChildService_18.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_18 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_18 extends ParentService_18 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-19",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 43. If you submit 48 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "3 active threads running tasks, with 45 tasks in the queue.",
      "6 active threads running tasks, with 42 tasks in the queue.",
      "5 active threads running tasks, with 43 tasks waiting in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "ThreadPoolExecutor rules: 1) First 3 tasks spawn 3 core threads. 2) Next 43 tasks fill the queue. 3) Remaining tasks spawn threads up to max (6). Since total tasks (48) fit within capacity, the pool spawns 2 extra threads, resulting in 5 active threads and 43 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(43)\n);\nfor (int i = 0; i < 48; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-19",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKey_19 into a standard HashMap. Class CustomKey_19 overrides hashCode() to return constant 290, but does not override equals(). What happens when you retrieve the key with id = 6?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The retrieval succeeds and returns \"Val_6\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 1,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_19 {\n    private int id;\n    public CustomKey_19(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 290; }\n}\nMap<CustomKey_19, String> map = new HashMap<>();\nCustomKey_19 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKey_19 key = new CustomKey_19(k);\n    if (k == 6) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-19",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Float?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "Operations A and C are valid; Operation B is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Float> is a Producer, so reading from it as Float (A) is valid, but writing to it is banned (B). List<? super Float> is a Consumer, so adding Float objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Float> src, List<? super Float> dest) {\n    // Operation A: Float val = src.get(0);\n    // Operation B: src.add(190);\n    // Operation C: dest.add(190);\n}"
  },
  {
    "id": "java-quiz-t4-19",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1750ms. Thread T2 sleeps for 1360ms. If the main thread calls T1.join(490) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 3110ms, as both join calls execute fully sequentially.",
      "Approximately 1750ms, since T1 takes the longest to complete.",
      "Approximately 1360ms, because the main thread waits for the 490ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 490ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "The main thread blocks on t1.join(490) for 490ms. During this time, T2 has also slept for 490ms, leaving 870ms of sleep. When t2.join() is called, the main thread blocks for the remaining 870ms. Total wait = 490 + 870 = 1360ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1750); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1360); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(490);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-19",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 46. If you add 47 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "69 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "92 (capacity doubles when full)",
      "56 (capacity grows by a fixed step of 10)",
      "47 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 46, the new capacity is 46 + 23 = 69.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(46);\nfor (int j = 0; j < 47; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-19",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_19\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 2,
    "explanation": "This statement creates two objects: the literal string \"poolStr_19\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_19\");"
  },
  {
    "id": "java-quiz-t7-19",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_19' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_19()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_19\")\n                   .orElse(fetchDb_19());\n}\npublic String fetchDb_19() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-19",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 5 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations.",
      "Up to 5 concurrent threads inside the custom ForkJoinPool."
    ],
    "correctOptionIndex": 3,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 5), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(5);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-19",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_19' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_19' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_19 = new Object();\nmap.put(keyData_19, \"ActiveSession\");\n\nkeyData_19 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-19",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_19\"",
      "\"fallback_19\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_19\". The handle() block captures this exception (ex is non-null) and returns \"fallback_19\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_19\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_19\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-19",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_19' and the resource's close() method throws 'CloseErr_19', which exception propagates and how is the other retrieved?",
    "options": [
      "The RuntimeException containing 'TryErr_19' is thrown; the exception containing 'CloseErr_19' is added to it as a suppressed exception.",
      "The exception containing 'CloseErr_19' is thrown; the 'TryErr_19' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_19' without suppressing the other."
    ],
    "correctOptionIndex": 0,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_19 = new CustomResource()) { // close() throws CloseErr_19\n    throw new RuntimeException(\"TryErr_19\");\n}"
  },
  {
    "id": "java-quiz-t12-19",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "A synchronized block or synchronized method.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-19",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(4), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 4",
      "Key 5",
      "Key 4",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 4 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 4, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(4);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-19",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Runnable s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch.",
      "The print(Runnable s) method executes because Runnable is a more specific type than Object."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Runnable' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Runnable s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Runnable s) { System.out.print(\"Runnable\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-19",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[4] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-19",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 24 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 24 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-19",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 190. Thread 1 calls compareAndSet(195, 200). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 200 regardless of expectation.",
      "Returns false, resulting in value 200 due to lock-free CAS loops.",
      "Returns false, resulting in value 190.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (195). If it does (value is 190), it atomically updates it to 200 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(190);\nboolean updated = atomic.compareAndSet(195, 200);"
  },
  {
    "id": "java-quiz-t18-19",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassB_19 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 1,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_19"
  },
  {
    "id": "java-quiz-t19-19",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1019, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2147482630 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1019 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1019)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-19",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_19().display()'?",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_19', the call to log() is resolved to 'ChildService_19.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_19 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_19 extends ParentService_19 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-20",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 45. If you submit 52 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "The task execution throws a RejectedExecutionException for the last task(s) exceeding capacity.",
      "4 active threads running tasks, with 48 tasks in the queue.",
      "6 active threads running tasks, with 45 tasks in the queue without rejection.",
      "The pool dynamically grows to 52 threads to prevent task rejection."
    ],
    "correctOptionIndex": 0,
    "explanation": "ThreadPoolExecutor rules: 1) First 4 tasks spawn 4 core threads. 2) Next 45 tasks fill the queue. 3) Remaining tasks spawn threads up to max (6). Since total tasks (52) exceed core + queue + max capacity (51), the excess tasks are rejected with RejectedExecutionException.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(45)\n);\nfor (int i = 0; i < 52; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-20",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 4 distinct instances of class CustomKey_20 into a standard HashMap. Class CustomKey_20 overrides hashCode() to return constant 300, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "options": [
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_20 {\n    private int id;\n    public CustomKey_20(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 300; }\n}\nMap<CustomKey_20, String> map = new HashMap<>();\nCustomKey_20 searchKey = null;\nfor (int k = 1; k <= 4; k++) {\n    CustomKey_20 key = new CustomKey_20(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-20",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Number?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "Operations A and C are valid; Operation B is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Number> is a Producer, so reading from it as Number (A) is valid, but writing to it is banned (B). List<? super Number> is a Consumer, so adding Number objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Number> src, List<? super Number> dest) {\n    // Operation A: Number val = src.get(0);\n    // Operation B: src.add(200);\n    // Operation C: dest.add(200);\n}"
  },
  {
    "id": "java-quiz-t4-20",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1800ms. Thread T2 sleeps for 1400ms. If the main thread calls T1.join(500) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 3200ms, as both join calls execute fully sequentially.",
      "Approximately 1800ms, since T1 takes the longest to complete.",
      "Approximately 1400ms, because the main thread waits for the 500ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 500ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "The main thread blocks on t1.join(500) for 500ms. During this time, T2 has also slept for 500ms, leaving 900ms of sleep. When t2.join() is called, the main thread blocks for the remaining 900ms. Total wait = 500 + 900 = 1400ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1800); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1400); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(500);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-20",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 48. If you add 49 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "72 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "96 (capacity doubles when full)",
      "58 (capacity grows by a fixed step of 10)",
      "49 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 48, the new capacity is 48 + 24 = 72.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(48);\nfor (int j = 0; j < 49; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-20",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_20\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"poolStr_20\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_20\");"
  },
  {
    "id": "java-quiz-t7-20",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_20' evaluated?",
    "options": [
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_20()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_20\")\n                   .orElse(fetchDb_20());\n}\npublic String fetchDb_20() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-20",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 2 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Up to 2 concurrent threads inside the custom ForkJoinPool.",
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 2), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(2);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-20",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_20' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_20' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_20 = new Object();\nmap.put(keyData_20, \"ActiveSession\");\n\nkeyData_20 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-20",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"fallback_20\"",
      "\"err_20\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 1,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_20\". The handle() block captures this exception (ex is non-null) and returns \"fallback_20\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_20\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_20\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-20",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_20' and the resource's close() method throws 'CloseErr_20', which exception propagates and how is the other retrieved?",
    "options": [
      "The RuntimeException containing 'TryErr_20' is thrown; the exception containing 'CloseErr_20' is added to it as a suppressed exception.",
      "The exception containing 'CloseErr_20' is thrown; the 'TryErr_20' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_20' without suppressing the other."
    ],
    "correctOptionIndex": 0,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_20 = new CustomResource()) { // close() throws CloseErr_20\n    throw new RuntimeException(\"TryErr_20\");\n}"
  },
  {
    "id": "java-quiz-t12-20",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "A synchronized block or synchronized method.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-20",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(3), and then put key 4, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 3",
      "Key 4",
      "Key 1",
      "Key 3"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 3 moves it to the end. The eldest key is the least recently accessed. If capacity is 3 and we accessed 3, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(3);\nmap.put(4, \"Val_\" + 4);"
  },
  {
    "id": "java-quiz-t14-20",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(String s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "The print(String s) method executes because String is a more specific type than Object.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'String' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(String s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(String s) { System.out.print(\"String\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-20",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[0] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-20",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 25 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 25 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-20",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 200. Thread 1 calls compareAndSet(200, 210). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 210 regardless of expectation.",
      "Returns false, resulting in value 210 due to lock-free CAS loops.",
      "Returns true, resulting in value 210.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (200). If it does (value is 200), it atomically updates it to 210 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(200);\nboolean updated = atomic.compareAndSet(200, 210);"
  },
  {
    "id": "java-quiz-t18-20",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassB_20 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 1,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_20"
  },
  {
    "id": "java-quiz-t19-20",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1020, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2147482629 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1020 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1020)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-20",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_20().display()'?",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures.",
      "Child"
    ],
    "correctOptionIndex": 3,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_20', the call to log() is resolved to 'ChildService_20.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_20 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_20 extends ParentService_20 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-21",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 47. If you submit 50 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "2 active threads running tasks, with 48 tasks in the queue.",
      "3 active threads running tasks, with 47 tasks waiting in the queue.",
      "5 active threads running tasks, with 45 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "ThreadPoolExecutor rules: 1) First 2 tasks spawn 2 core threads. 2) Next 47 tasks fill the queue. 3) Remaining tasks spawn threads up to max (5). Since total tasks (50) fit within capacity, the pool spawns 1 extra threads, resulting in 3 active threads and 47 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(47)\n);\nfor (int i = 0; i < 50; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-21",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 5 distinct instances of class CustomKey_21 into a standard HashMap. Class CustomKey_21 overrides hashCode() to return constant 310, but does not override equals(). What happens when you retrieve the key with id = 2?",
    "options": [
      "The retrieval succeeds and returns \"Val_2\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_21 {\n    private int id;\n    public CustomKey_21(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 310; }\n}\nMap<CustomKey_21, String> map = new HashMap<>();\nCustomKey_21 searchKey = null;\nfor (int k = 1; k <= 5; k++) {\n    CustomKey_21 key = new CustomKey_21(k);\n    if (k == 2) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-21",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Integer?",
    "options": [
      "Operations A and C are valid; Operation B is a compile error.",
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so reading from it as Integer (A) is valid, but writing to it is banned (B). List<? super Integer> is a Consumer, so adding Integer objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Operation A: Integer val = src.get(0);\n    // Operation B: src.add(210);\n    // Operation C: dest.add(210);\n}"
  },
  {
    "id": "java-quiz-t4-21",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1850ms. Thread T2 sleeps for 1440ms. If the main thread calls T1.join(510) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 3290ms, as both join calls execute fully sequentially.",
      "Approximately 1440ms, because the main thread waits for the 510ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 1850ms, since T1 takes the longest to complete.",
      "Approximately 510ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "The main thread blocks on t1.join(510) for 510ms. During this time, T2 has also slept for 510ms, leaving 930ms of sleep. When t2.join() is called, the main thread blocks for the remaining 930ms. Total wait = 510 + 930 = 1440ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1850); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1440); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(510);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-21",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 50. If you add 51 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "100 (capacity doubles when full)",
      "60 (capacity grows by a fixed step of 10)",
      "75 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "51 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 2,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 50, the new capacity is 50 + 25 = 75.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(50);\nfor (int j = 0; j < 51; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-21",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_21\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 2,
    "explanation": "This statement creates two objects: the literal string \"poolStr_21\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_21\");"
  },
  {
    "id": "java-quiz-t7-21",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_21' evaluated?",
    "options": [
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_21()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_21\")\n                   .orElse(fetchDb_21());\n}\npublic String fetchDb_21() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-21",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 3 on a machine with 1 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Up to 3 concurrent threads inside the custom ForkJoinPool.",
      "Only 1 threads, matching the physical CPU cores.",
      "Up to 0 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 3), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(3);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-21",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_21' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 0,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_21' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_21 = new Object();\nmap.put(keyData_21, \"ActiveSession\");\n\nkeyData_21 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-21",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_21\"",
      "\"fallback_21\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_21\". The handle() block captures this exception (ex is non-null) and returns \"fallback_21\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_21\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_21\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-21",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_21' and the resource's close() method throws 'CloseErr_21', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_21' is thrown; the 'TryErr_21' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_21' is thrown; the exception containing 'CloseErr_21' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_21' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_21 = new CustomResource()) { // close() throws CloseErr_21\n    throw new RuntimeException(\"TryErr_21\");\n}"
  },
  {
    "id": "java-quiz-t12-21",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-21",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 2",
      "Key 5",
      "Key 1",
      "Key 4"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 2, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-21",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "The print(Integer s) method executes because Integer is a more specific type than Object.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-21",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[1] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-21",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 26 threads, what runtime issue can occur?",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 26 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-21",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 210. Thread 1 calls compareAndSet(215, 220). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 220 regardless of expectation.",
      "Returns false, resulting in value 220 due to lock-free CAS loops.",
      "Returns false, resulting in value 210.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (215). If it does (value is 210), it atomically updates it to 220 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(210);\nboolean updated = atomic.compareAndSet(215, 220);"
  },
  {
    "id": "java-quiz-t18-21",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When ClassB_21 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_21"
  },
  {
    "id": "java-quiz-t19-21",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1021, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2147482628 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1021 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1021)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-21",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_21().display()'?",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_21', the call to log() is resolved to 'ChildService_21.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_21 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_21 extends ParentService_21 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-22",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 49. If you submit 54 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "3 active threads running tasks, with 51 tasks in the queue.",
      "5 active threads running tasks, with 49 tasks waiting in the queue.",
      "5 active threads running tasks, with 49 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "ThreadPoolExecutor rules: 1) First 3 tasks spawn 3 core threads. 2) Next 49 tasks fill the queue. 3) Remaining tasks spawn threads up to max (5). Since total tasks (54) fit within capacity, the pool spawns 2 extra threads, resulting in 5 active threads and 49 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(49)\n);\nfor (int i = 0; i < 54; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-22",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 6 distinct instances of class CustomKey_22 into a standard HashMap. Class CustomKey_22 overrides hashCode() to return constant 320, but does not override equals(). What happens when you retrieve the key with id = 5?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_5\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_22 {\n    private int id;\n    public CustomKey_22(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 320; }\n}\nMap<CustomKey_22, String> map = new HashMap<>();\nCustomKey_22 searchKey = null;\nfor (int k = 1; k <= 6; k++) {\n    CustomKey_22 key = new CustomKey_22(k);\n    if (k == 5) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-22",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Double?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "Operations A and C are valid; Operation B is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Double> is a Producer, so reading from it as Double (A) is valid, but writing to it is banned (B). List<? super Double> is a Consumer, so adding Double objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Double> src, List<? super Double> dest) {\n    // Operation A: Double val = src.get(0);\n    // Operation B: src.add(220);\n    // Operation C: dest.add(220);\n}"
  },
  {
    "id": "java-quiz-t4-22",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1900ms. Thread T2 sleeps for 1480ms. If the main thread calls T1.join(520) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 3380ms, as both join calls execute fully sequentially.",
      "Approximately 1480ms, because the main thread waits for the 520ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 1900ms, since T1 takes the longest to complete.",
      "Approximately 520ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "The main thread blocks on t1.join(520) for 520ms. During this time, T2 has also slept for 520ms, leaving 960ms of sleep. When t2.join() is called, the main thread blocks for the remaining 960ms. Total wait = 520 + 960 = 1480ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1900); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1480); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(520);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-22",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 52. If you add 53 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "104 (capacity doubles when full)",
      "78 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "62 (capacity grows by a fixed step of 10)",
      "53 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 52, the new capacity is 52 + 26 = 78.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(52);\nfor (int j = 0; j < 53; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-22",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_22\" is NOT already present in the String Constant Pool?",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"poolStr_22\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_22\");"
  },
  {
    "id": "java-quiz-t7-22",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_22' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_22()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_22\")\n                   .orElse(fetchDb_22());\n}\npublic String fetchDb_22() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-22",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 4 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Up to 4 concurrent threads inside the custom ForkJoinPool.",
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 4), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(4);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-22",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_22' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 1,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_22' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_22 = new Object();\nmap.put(keyData_22, \"ActiveSession\");\n\nkeyData_22 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-22",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_22\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_22\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_22\". The handle() block captures this exception (ex is non-null) and returns \"fallback_22\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_22\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_22\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-22",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_22' and the resource's close() method throws 'CloseErr_22', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_22' is thrown; the 'TryErr_22' exception is discarded.",
      "The RuntimeException containing 'TryErr_22' is thrown; the exception containing 'CloseErr_22' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_22' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_22 = new CustomResource()) { // close() throws CloseErr_22\n    throw new RuntimeException(\"TryErr_22\");\n}"
  },
  {
    "id": "java-quiz-t12-22",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-22",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(2), and then put key 4, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 2",
      "Key 1",
      "Key 4",
      "Key 3"
    ],
    "correctOptionIndex": 1,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If capacity is 3 and we accessed 2, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(4, \"Val_\" + 4);"
  },
  {
    "id": "java-quiz-t14-22",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Double s), which method executes when print(null) is called?",
    "options": [
      "The print(Double s) method executes because Double is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Double' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Double s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Double s) { System.out.print(\"Double\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-22",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[2] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-22",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 27 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 27 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-22",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 220. Thread 1 calls compareAndSet(220, 230). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 230 regardless of expectation.",
      "Returns false, resulting in value 230 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match.",
      "Returns true, resulting in value 230."
    ],
    "correctOptionIndex": 3,
    "explanation": "compareAndSet checks if the current value equals the expected value (220). If it does (value is 220), it atomically updates it to 230 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(220);\nboolean updated = atomic.compareAndSet(220, 230);"
  },
  {
    "id": "java-quiz-t18-22",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When ClassB_22 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_22"
  },
  {
    "id": "java-quiz-t19-22",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1022, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator.",
      "An overflow value of -2147482627 (due to standard 32-bit signed integer overflow)."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1022 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1022)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-22",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_22().display()'?",
    "options": [
      "Child",
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 0,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_22', the call to log() is resolved to 'ChildService_22.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_22 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_22 extends ParentService_22 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-23",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 7, keepAliveTime = 60s, and a workQueue capacity of 51. If you submit 58 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "4 active threads running tasks, with 54 tasks in the queue.",
      "7 active threads running tasks, with 51 tasks waiting in the queue.",
      "7 active threads running tasks, with 51 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "ThreadPoolExecutor rules: 1) First 4 tasks spawn 4 core threads. 2) Next 51 tasks fill the queue. 3) Remaining tasks spawn threads up to max (7). Since total tasks (58) fit within capacity, the pool spawns 3 extra threads, resulting in 7 active threads and 51 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 7, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(51)\n);\nfor (int i = 0; i < 58; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-23",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKey_23 into a standard HashMap. Class CustomKey_23 overrides hashCode() to return constant 330, but does not override equals(). What happens when you retrieve the key with id = 3?",
    "options": [
      "The retrieval succeeds and returns \"Val_3\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_23 {\n    private int id;\n    public CustomKey_23(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 330; }\n}\nMap<CustomKey_23, String> map = new HashMap<>();\nCustomKey_23 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKey_23 key = new CustomKey_23(k);\n    if (k == 3) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-23",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Float?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "Operations A and C are valid; Operation B is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Float> is a Producer, so reading from it as Float (A) is valid, but writing to it is banned (B). List<? super Float> is a Consumer, so adding Float objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Float> src, List<? super Float> dest) {\n    // Operation A: Float val = src.get(0);\n    // Operation B: src.add(230);\n    // Operation C: dest.add(230);\n}"
  },
  {
    "id": "java-quiz-t4-23",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1950ms. Thread T2 sleeps for 1520ms. If the main thread calls T1.join(530) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 3470ms, as both join calls execute fully sequentially.",
      "Approximately 1950ms, since T1 takes the longest to complete.",
      "Approximately 530ms, as both threads are forced to interrupt.",
      "Approximately 1520ms, because the main thread waits for the 530ms timeout on T1, then blocks for the remainder of T2's sleep."
    ],
    "correctOptionIndex": 3,
    "explanation": "The main thread blocks on t1.join(530) for 530ms. During this time, T2 has also slept for 530ms, leaving 990ms of sleep. When t2.join() is called, the main thread blocks for the remaining 990ms. Total wait = 530 + 990 = 1520ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1950); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1520); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(530);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-23",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 54. If you add 55 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "81 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "108 (capacity doubles when full)",
      "64 (capacity grows by a fixed step of 10)",
      "55 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 54, the new capacity is 54 + 27 = 81.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(54);\nfor (int j = 0; j < 55; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-23",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_23\" is NOT already present in the String Constant Pool?",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"poolStr_23\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_23\");"
  },
  {
    "id": "java-quiz-t7-23",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_23' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_23()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_23\")\n                   .orElse(fetchDb_23());\n}\npublic String fetchDb_23() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-23",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 5 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations.",
      "Up to 5 concurrent threads inside the custom ForkJoinPool."
    ],
    "correctOptionIndex": 3,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 5), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(5);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-23",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_23' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 0,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_23' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_23 = new Object();\nmap.put(keyData_23, \"ActiveSession\");\n\nkeyData_23 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-23",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"fallback_23\"",
      "\"Secondary_Fallback\"",
      "\"err_23\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 0,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_23\". The handle() block captures this exception (ex is non-null) and returns \"fallback_23\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_23\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_23\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-23",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_23' and the resource's close() method throws 'CloseErr_23', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_23' is thrown; the 'TryErr_23' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_23' is thrown; the exception containing 'CloseErr_23' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_23' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_23 = new CustomResource()) { // close() throws CloseErr_23\n    throw new RuntimeException(\"TryErr_23\");\n}"
  },
  {
    "id": "java-quiz-t12-23",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A synchronized block or synchronized method.",
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-23",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(4), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 4",
      "Key 5",
      "Key 4",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 4 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 4, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(4);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-23",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Runnable s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch.",
      "The print(Runnable s) method executes because Runnable is a more specific type than Object."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Runnable' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Runnable s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Runnable s) { System.out.print(\"Runnable\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-23",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[3] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-23",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 28 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 28 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-23",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 230. Thread 1 calls compareAndSet(235, 240). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 240 regardless of expectation.",
      "Returns false, resulting in value 240 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match.",
      "Returns false, resulting in value 230."
    ],
    "correctOptionIndex": 3,
    "explanation": "compareAndSet checks if the current value equals the expected value (235). If it does (value is 230), it atomically updates it to 240 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(230);\nboolean updated = atomic.compareAndSet(235, 240);"
  },
  {
    "id": "java-quiz-t18-23",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When ClassB_23 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_23"
  },
  {
    "id": "java-quiz-t19-23",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1023, what is printed to the console?",
    "options": [
      "An overflow value of -2147482626 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1023 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1023)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-23",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_23().display()'?",
    "options": [
      "Child",
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 0,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_23', the call to log() is resolved to 'ChildService_23.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_23 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_23 extends ParentService_23 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-24",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 4, keepAliveTime = 60s, and a workQueue capacity of 53. If you submit 56 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "2 active threads running tasks, with 54 tasks in the queue.",
      "3 active threads running tasks, with 53 tasks waiting in the queue.",
      "4 active threads running tasks, with 52 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "ThreadPoolExecutor rules: 1) First 2 tasks spawn 2 core threads. 2) Next 53 tasks fill the queue. 3) Remaining tasks spawn threads up to max (4). Since total tasks (56) fit within capacity, the pool spawns 1 extra threads, resulting in 3 active threads and 53 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 4, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(53)\n);\nfor (int i = 0; i < 56; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-24",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 4 distinct instances of class CustomKey_24 into a standard HashMap. Class CustomKey_24 overrides hashCode() to return constant 340, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "options": [
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_24 {\n    private int id;\n    public CustomKey_24(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 340; }\n}\nMap<CustomKey_24, String> map = new HashMap<>();\nCustomKey_24 searchKey = null;\nfor (int k = 1; k <= 4; k++) {\n    CustomKey_24 key = new CustomKey_24(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-24",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Number?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and C are valid; Operation B is a compile error.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Number> is a Producer, so reading from it as Number (A) is valid, but writing to it is banned (B). List<? super Number> is a Consumer, so adding Number objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Number> src, List<? super Number> dest) {\n    // Operation A: Number val = src.get(0);\n    // Operation B: src.add(240);\n    // Operation C: dest.add(240);\n}"
  },
  {
    "id": "java-quiz-t4-24",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 2000ms. Thread T2 sleeps for 1560ms. If the main thread calls T1.join(540) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 3560ms, as both join calls execute fully sequentially.",
      "Approximately 2000ms, since T1 takes the longest to complete.",
      "Approximately 1560ms, because the main thread waits for the 540ms timeout on T1, then blocks for the remainder of T2's sleep.",
      "Approximately 540ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "The main thread blocks on t1.join(540) for 540ms. During this time, T2 has also slept for 540ms, leaving 1020ms of sleep. When t2.join() is called, the main thread blocks for the remaining 1020ms. Total wait = 540 + 1020 = 1560ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(2000); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1560); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(540);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-24",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 56. If you add 57 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "112 (capacity doubles when full)",
      "66 (capacity grows by a fixed step of 10)",
      "84 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "57 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 2,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 56, the new capacity is 56 + 28 = 84.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(56);\nfor (int j = 0; j < 57; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-24",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_24\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 2,
    "explanation": "This statement creates two objects: the literal string \"poolStr_24\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_24\");"
  },
  {
    "id": "java-quiz-t7-24",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_24' evaluated?",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_24()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_24\")\n                   .orElse(fetchDb_24());\n}\npublic String fetchDb_24() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-24",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 2 on a machine with 1 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 1 threads, matching the physical CPU cores.",
      "Up to 0 threads, as the common pool always reserves one core.",
      "Up to 2 concurrent threads inside the custom ForkJoinPool.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 2), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(2);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-24",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_24' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 0,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_24' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_24 = new Object();\nmap.put(keyData_24, \"ActiveSession\");\n\nkeyData_24 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-24",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_24\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_24\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_24\". The handle() block captures this exception (ex is non-null) and returns \"fallback_24\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_24\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_24\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-24",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_24' and the resource's close() method throws 'CloseErr_24', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_24' is thrown; the 'TryErr_24' exception is discarded.",
      "The RuntimeException containing 'TryErr_24' is thrown; the exception containing 'CloseErr_24' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_24' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_24 = new CustomResource()) { // close() throws CloseErr_24\n    throw new RuntimeException(\"TryErr_24\");\n}"
  },
  {
    "id": "java-quiz-t12-24",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A synchronized block or synchronized method.",
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-24",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(1), and then put key 4, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 1",
      "Key 4",
      "Key 3",
      "Key 2"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 1 moves it to the end. The eldest key is the least recently accessed. If capacity is 3 and we accessed 1, the remaining oldest key (which is 2) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(1);\nmap.put(4, \"Val_\" + 4);"
  },
  {
    "id": "java-quiz-t14-24",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(String s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "The print(String s) method executes because String is a more specific type than Object.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'String' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(String s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(String s) { System.out.print(\"String\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-24",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[4] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-24",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 29 threads, what runtime issue can occur?",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 29 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-24",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 240. Thread 1 calls compareAndSet(240, 250). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns true, resulting in value 250 regardless of expectation.",
      "Returns false, resulting in value 250 due to lock-free CAS loops.",
      "Returns true, resulting in value 250.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (240). If it does (value is 240), it atomically updates it to 250 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(240);\nboolean updated = atomic.compareAndSet(240, 250);"
  },
  {
    "id": "java-quiz-t18-24",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When ClassB_24 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_24"
  },
  {
    "id": "java-quiz-t19-24",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1024, what is printed to the console?",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2147482625 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1024 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1024)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-24",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_24().display()'?",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_24', the call to log() is resolved to 'ChildService_24.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_24 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_24 extends ParentService_24 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-t1-25",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 55. If you submit 60 tasks concurrently with no delay, what is the state of the pool?",
    "options": [
      "5 active threads running tasks, with 55 tasks waiting in the queue.",
      "3 active threads running tasks, with 57 tasks in the queue.",
      "6 active threads running tasks, with 54 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "ThreadPoolExecutor rules: 1) First 3 tasks spawn 3 core threads. 2) Next 55 tasks fill the queue. 3) Remaining tasks spawn threads up to max (6). Since total tasks (60) fit within capacity, the pool spawns 2 extra threads, resulting in 5 active threads and 55 queued tasks.",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(55)\n);\nfor (int i = 0; i < 60; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}"
  },
  {
    "id": "java-quiz-t2-25",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 5 distinct instances of class CustomKey_25 into a standard HashMap. Class CustomKey_25 overrides hashCode() to return constant 350, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "HashMap's get() method checks: if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))). Since the exact same reference searchKey is passed, the (k == key) identity comparison succeeds immediately, bypassing equals() checks.",
    "codeSnippet": "public class CustomKey_25 {\n    private int id;\n    public CustomKey_25(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 350; }\n}\nMap<CustomKey_25, String> map = new HashMap<>();\nCustomKey_25 searchKey = null;\nfor (int k = 1; k <= 5; k++) {\n    CustomKey_25 key = new CustomKey_25(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\nString result = map.get(searchKey);"
  },
  {
    "id": "java-quiz-t3-25",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the process method below parameterized with Integer?",
    "options": [
      "Operations B and C are valid; Operation A is a compile error.",
      "Operations A and C are valid; Operation B is a compile error.",
      "All operations are compile-time valid.",
      "Operations A and B are valid; Operation C is a compile error."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so reading from it as Integer (A) is valid, but writing to it is banned (B). List<? super Integer> is a Consumer, so adding Integer objects (C) to it is valid.",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Operation A: Integer val = src.get(0);\n    // Operation B: src.add(250);\n    // Operation C: dest.add(250);\n}"
  },
  {
    "id": "java-quiz-t4-25",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 2050ms. Thread T2 sleeps for 1600ms. If the main thread calls T1.join(550) followed immediately by T2.join(), what is the approximate wait duration?",
    "options": [
      "Approximately 3650ms, as both join calls execute fully sequentially.",
      "Approximately 2050ms, since T1 takes the longest to complete.",
      "Approximately 550ms, as both threads are forced to interrupt.",
      "Approximately 1600ms, because the main thread waits for the 550ms timeout on T1, then blocks for the remainder of T2's sleep."
    ],
    "correctOptionIndex": 3,
    "explanation": "The main thread blocks on t1.join(550) for 550ms. During this time, T2 has also slept for 550ms, leaving 1050ms of sleep. When t2.join() is called, the main thread blocks for the remaining 1050ms. Total wait = 550 + 1050 = 1600ms.",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(2050); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1600); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\nt1.join(550);\nt2.join();"
  },
  {
    "id": "java-quiz-t5-25",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 58. If you add 59 elements sequentially, what is the internal array capacity immediately after the expansion?",
    "options": [
      "116 (capacity doubles when full)",
      "68 (capacity grows by a fixed step of 10)",
      "59 (capacity grows to fit exactly the inserted elements)",
      "87 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 58, the new capacity is 58 + 29 = 87.",
    "codeSnippet": "List<Integer> list = new ArrayList<>(58);\nfor (int j = 0; j < 59; j++) {\n    list.add(j);\n}"
  },
  {
    "id": "java-quiz-t6-25",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"poolStr_25\" is NOT already present in the String Constant Pool?",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap."
    ],
    "correctOptionIndex": 3,
    "explanation": "This statement creates two objects: the literal string \"poolStr_25\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool.",
    "codeSnippet": "String s = new String(\"poolStr_25\");"
  },
  {
    "id": "java-quiz-t7-25",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchDb_25' evaluated?",
    "options": [
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchDb_25()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation.",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_25\")\n                   .orElse(fetchDb_25());\n}\npublic String fetchDb_25() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}"
  },
  {
    "id": "java-quiz-t8-25",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism = 3 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "options": [
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "Up to 3 concurrent threads inside the custom ForkJoinPool.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 3), overriding the default CommonPool behavior.",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(3);\ncustomPool.submit(() -> {\n    IntStream.range(0, 100).parallel().forEach(x -> {\n        // Intensive work\n    });\n}).get();"
  },
  {
    "id": "java-quiz-t9-25",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_25' to null and trigger GC, what happens to the map size?",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_25' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table.",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_25 = new Object();\nmap.put(keyData_25, \"ActiveSession\");\n\nkeyData_25 = null;\nSystem.gc();"
  },
  {
    "id": "java-quiz-t10-25",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_25\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_25\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_25\". The handle() block captures this exception (ex is non-null) and returns \"fallback_25\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_25\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_25\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);"
  },
  {
    "id": "java-quiz-t11-25",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_25' and the resource's close() method throws 'CloseErr_25', which exception propagates and how is the other retrieved?",
    "options": [
      "The exception containing 'CloseErr_25' is thrown; the 'TryErr_25' exception is discarded.",
      "The RuntimeException containing 'TryErr_25' is thrown; the exception containing 'CloseErr_25' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_25' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed().",
    "codeSnippet": "try (CustomResource Res_25 = new CustomResource()) { // close() throws CloseErr_25\n    throw new RuntimeException(\"TryErr_25\");\n}"
  },
  {
    "id": "java-quiz-t12-25",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this.",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);"
  },
  {
    "id": "java-quiz-t13-25",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "options": [
      "Key 2",
      "Key 5",
      "Key 4",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If capacity is 4 and we accessed 2, the remaining oldest key (which is 1) is evicted.",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);"
  },
  {
    "id": "java-quiz-t14-25",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "The print(Integer s) method executes because Integer is a more specific type than Object.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s).",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}"
  },
  {
    "id": "java-quiz-t15-25",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (Integer[] is a subtype of Number[]), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime.",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[0] = 10.5; // Double value"
  },
  {
    "id": "java-quiz-t16-25",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 30 threads, what runtime issue can occur?",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions.",
    "codeSnippet": "// Shared instance accessed by 30 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");"
  },
  {
    "id": "java-quiz-t17-25",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 250. Thread 1 calls compareAndSet(255, 260). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "options": [
      "Returns false, resulting in value 250.",
      "Returns true, resulting in value 260 regardless of expectation.",
      "Returns false, resulting in value 260 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (255). If it does (value is 250), it atomically updates it to 260 and returns true. Otherwise, it leaves the value unchanged and returns false.",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(250);\nboolean updated = atomic.compareAndSet(255, 260);"
  },
  {
    "id": "java-quiz-t18-25",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "options": [
      "When ClassB_25 was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath.",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB_25"
  },
  {
    "id": "java-quiz-t19-25",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1025, what is printed to the console?",
    "options": [
      "An overflow value of -2147482624 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1025 to Integer.MAX_VALUE overflows and wraps into negative values.",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1025)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);"
  },
  {
    "id": "java-quiz-t20-25",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_25().display()'?",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_25', the call to log() is resolved to 'ChildService_25.log()', printing 'Child'.",
    "codeSnippet": "class ParentService_25 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_25 extends ParentService_25 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}"
  },
  {
    "id": "java-quiz-adv-1",
    "topic": "Virtual Threads & Project Loom",
    "difficulty": "hard",
    "questionText": "In Java 21, what causes a Virtual Thread to become 'pinned' to its underlying OS carrier thread, preventing the carrier thread from executing other virtual threads during blocking I/O?",
    "options": [
      "Executing any blocking network I/O inside a synchronized block or calling native methods (JNI).",
      "Submitting more than 1000 virtual threads to the ThreadPerTaskExecutor concurrently.",
      "Using Thread.sleep() inside a virtual thread's run method.",
      "Accessing any ConcurrentHashMap instance from a virtual thread."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java 21 Virtual Threads, executing blocking I/O inside a 'synchronized' block/method or inside a native frame (JNI) pins the virtual thread to its OS carrier thread. To avoid pinning, replace 'synchronized' with ReentrantLock.",
    "codeSnippet": "VirtualThreadFactory factory = Thread.ofVirtual().factory();\nExecutorService executor = Executors.newThreadPerTaskExecutor(factory);\nexecutor.submit(() -> {\n    synchronized(lock) {\n        // Blocking network I/O inside synchronized block\n        socket.read();\n    }\n});"
  },
  {
    "id": "java-quiz-adv-2",
    "topic": "Structured Concurrency & Scoped Values",
    "difficulty": "hard",
    "questionText": "What advantage do ScopedValues (JEP 446) have over traditional ThreadLocal variables when used with millions of Java 21 Virtual Threads?",
    "options": [
      "ScopedValues are immutable within their scope and automatically garbage collected when the scope exits, preventing memory leaks.",
      "ScopedValues allow child threads to mutate the parent thread's variable asynchronously without synchronization.",
      "ScopedValues store their payload in off-heap DirectByteBuffer memory, bypassing GC scans.",
      "ScopedValues replace Java reflection by allowing direct bytecode modification at runtime."
    ],
    "correctOptionIndex": 0,
    "explanation": "ThreadLocals suffer from severe memory leak risks and high per-thread memory overhead when millions of virtual threads are spawned. ScopedValues are immutable, stack-bound, scoped, and child virtual threads share parent scoped value bindings with zero copy overhead.",
    "codeSnippet": "private static final ScopedValue<UserSession> SESSION = ScopedValue.newInstance();\n\nScopedValue.where(SESSION, currentSession).run(() -> {\n    processRequest();\n});"
  },
  {
    "id": "java-quiz-adv-3",
    "topic": "JVM Memory & Garbage Collection",
    "difficulty": "hard",
    "questionText": "How does ZGC (Z Garbage Collector) achieve ultra-low pause times (< 1ms) regardless of heap size (from 8MB to 16TB)?",
    "options": [
      "ZGC uses Colored Pointers (metadata stored in pointer bits) and Load Barriers to perform concurrent marking and relocation while application threads run.",
      "ZGC freezes all application threads and uses multi-threaded parallel compaction during STW pause.",
      "ZGC moves all live objects into Metaspace and bypasses Java heap allocation entirely.",
      "ZGC automatically offloads garbage collection processing to GPU compute shaders."
    ],
    "correctOptionIndex": 0,
    "explanation": "ZGC uses Colored Pointers (reference metadata embedded directly in high pointer bits) and Read/Load Barriers. When application threads dereference an object pointer, the load barrier checks the color bits and self-heals stale references concurrently without stopping the application.",
    "codeSnippet": "// JVM Flags:\n// -XX:+UseZGC -XX:+ZGenerational"
  },
  {
    "id": "java-quiz-adv-4",
    "topic": "Sealed Classes & Pattern Matching",
    "difficulty": "medium",
    "questionText": "Given the sealed interface declaration below in Java 21, what is the compilation outcome of the switch expression?",
    "options": [
      "Compiles successfully without a 'default' case because sealed types permit exhaustive pattern matching checks by the compiler.",
      "Compilation fails because a 'default' clause is mandatory for all switch expressions in Java.",
      "Compilation fails because Record components cannot be accessed directly in pattern matching.",
      "Compiles but throws a MatchException at runtime if s is non-null."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java 21, pattern matching on sealed interfaces/classes allows the compiler to verify exhaustiveness. Since Circle and Rectangle are the ONLY permitted subtypes of Shape, no 'default' case is required.",
    "codeSnippet": "public sealed interface Shape permits Circle, Rectangle {}\npublic record Circle(double radius) implements Shape {}\npublic record Rectangle(double w, double h) implements Shape {}\n\ndouble area(Shape s) {\n    return switch(s) {\n        case Circle c -> Math.PI * c.radius() * c.radius();\n        case Rectangle r -> r.w() * r.h();\n    };\n}"
  },
  {
    "id": "java-quiz-adv-5",
    "topic": "VarHandle & Memory Barriers",
    "difficulty": "hard",
    "questionText": "What memory visibility guarantee is provided by VarHandle.setRelease(value) and VarHandle.getAcquire() in the Java Memory Model (JMM)?",
    "options": [
      "Acquire/Release semantics establish a happens-before relationship: writes prior to setRelease are visible to threads after getAcquire, without full fence overhead.",
      "They enforce sequential consistency across all CPU cores with a full hardware memory fence (lock cmpxchg).",
      "They guarantee that memory is written directly to NVRAM, bypassing CPU L1/L2/L3 caches.",
      "They behave identically to relaxed plain field reads and writes with zero memory order guarantees."
    ],
    "correctOptionIndex": 0,
    "explanation": "Acquire/Release ordering provides lighter memory barriers than full volatile fences. setRelease prevents previous memory writes from being reordered after the release, while getAcquire prevents subsequent memory reads from being reordered before the acquire.",
    "codeSnippet": "private static final VarHandle STATE;\n// Thread 1: STATE.setRelease(this, 1);\n// Thread 2: int s = (int) STATE.getAcquire(this);"
  },
  {
    "id": "java-quiz-auto-506",
    "topic": "Concurrency",
    "difficulty": "hard",
    "questionText": "What is the primary difference between VarHandle.compareAndExchange() and VarHandle.compareAndSet() in Java 9+? (Variant #506)",
    "options": [
      "compareAndExchange returns the witness value (actual value before CAS), whereas compareAndSet returns a boolean success status.",
      "Both methods are identical in performance and return types.",
      "compareAndSet returns the witness value while compareAndExchange returns boolean.",
      "compareAndExchange throws a TypeNotPresentException if CAS fails."
    ],
    "correctOptionIndex": 0,
    "explanation": "VarHandle.compareAndExchange returns the witness value found in the variable (useful for CAS loops to avoid re-reading), whereas compareAndSet returns true/false.",
    "codeSnippet": "VarHandle handle = MethodHandles.lookup().findVarHandle(State.class, \"val\", int.class);"
  },
  {
    "id": "java-quiz-auto-507",
    "topic": "JVM Mechanics",
    "difficulty": "hard",
    "questionText": "How does the Compact Object Headers (JEP 450) feature in JDK 21+ reduce 64-bit JVM heap memory footprint? (Variant #507)",
    "options": [
      "Compresses 64-bit primitive double fields to 32-bit floats.",
      "Compresses the object mark word from 64 bits to 32 bits, saving 4-8 bytes per object header across the heap.",
      "Replaces Klass Word pointers with 16-bit direct array offsets.",
      "Eliminates object identity hash codes completely from Metaspace."
    ],
    "correctOptionIndex": 1,
    "explanation": "Compact Object Headers compress 64-bit Mark Words to 32 bits, reducing header size from 12/16 bytes down to 8 bytes per object, improving L1/L2 cache efficiency.",
    "codeSnippet": "// -XX:+UseCompactObjectHeaders"
  },
  {
    "id": "java-quiz-auto-508",
    "topic": "Collections & Internals",
    "difficulty": "medium",
    "questionText": "What happens when you call Collections.unmodifiableList(list) vs List.copyOf(list) in Java 10+? (Variant #508)",
    "options": [
      "List.copyOf permits null elements whereas unmodifiableList throws NPE.",
      "unmodifiableList creates an unmodifiable VIEW (changes to mutable reflect in view); List.copyOf creates an unmodifiable SNAPSHOT COPY.",
      "Both create unmodifiable snapshot copies independent of original list.",
      "unmodifiableList allows mutating elements via iterator.remove()."
    ],
    "correctOptionIndex": 1,
    "explanation": "Collections.unmodifiableList is a view wrapper that reflects underlying list mutations. List.copyOf creates an unmodifiable shallow copy and disallows null elements.",
    "codeSnippet": "List<String> mutable = new ArrayList<>(List.of(\"A\", \"B\"));\nList<String> view = Collections.unmodifiableList(mutable);\nList<String> copy = List.copyOf(mutable);"
  }
];
