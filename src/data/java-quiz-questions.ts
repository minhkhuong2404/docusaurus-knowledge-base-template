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
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(7)\n);\nfor (int i = 0; i < 12; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "5 active threads running tasks, with 7 tasks in the queue.",
      "3 active threads running tasks, with 9 tasks in the queue.",
      "6 active threads running tasks, with 6 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "The lifecycle rules are: 1) First 3 tasks create 3 core threads. 2) Next 7 tasks fill the queue. 3) Remaining tasks (total 12 - 3 - 7 = 2) exceed queue capacity, so 2 new threads are spawned (up to max 6). This results in 5 active threads and 7 queued tasks."
  },
  {
    "id": "java-quiz-t2-1",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKeyVal_1 into a standard HashMap. Class CustomKeyVal_1 overrides hashCode() to return constant 205, but does not override equals(). What happens when you retrieve the key with id = 2?",
    "codeSnippet": "public class CustomKeyVal_1 {\n    private int id;\n    public CustomKeyVal_1(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 205; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_1, String> map = new HashMap<>();\nCustomKeyVal_1 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKeyVal_1 key = new CustomKeyVal_1(k);\n    if (k == 2) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_2\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_2\"."
  },
  {
    "id": "java-quiz-t3-1",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Integer?",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Integer' into 'src' and read from 'dest' as type 'Integer'.",
      "You can read from 'src' as type 'Integer' and add elements of type 'Integer' (or its subclasses) to 'dest'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so you can safely read from it as type 'Integer'. List<? super Integer> is a Consumer, so you can safely write/add elements of type 'Integer' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-1",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1100ms. Thread T2 sleeps for 850ms. If the main thread calls T1.join(520) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1100); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(850); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(520);\nt2.join();",
    "options": [
      "Approximately 1950ms, as both join calls are executed sequentially.",
      "Approximately 1100ms, since T1 completes last.",
      "Approximately 1370ms, because the main thread waits for the 520ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 520ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "Main thread waits on t1.join(520) which times out after 520ms. Meanwhile, T2 has been running in the background for 520ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (850 - 520 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 520 + (850 > 520 ? 850 - 520 : 0) which equals 1370ms."
  },
  {
    "id": "java-quiz-t5-1",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 10. If you add 11 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(10);\nfor (int j = 0; j < 11; j++) {\n    list.add(j);\n}",
    "options": [
      "20 (capacity doubles when full)",
      "15 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "20 (capacity grows by a fixed step of 10)",
      "11 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 10, the new capacity is 10 + 5 = 15."
  },
  {
    "id": "java-quiz-t6-1",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_1\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_1\");",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap."
    ],
    "correctOptionIndex": 3,
    "explanation": "This statement creates two objects: the literal string \"literalVal_1\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-1",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_1' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_1\")\n                   .orElse(fetchFromDb_1());\n}\npublic String fetchFromDb_1() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_1()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-1",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 9 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(9);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "Up to 9 concurrent threads inside the custom ForkJoinPool.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 9), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-1",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_1' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_1 = new Object();\nmap.put(keyData_1, \"ActiveSession\");\n\nkeyData_1 = null;\nSystem.gc();",
    "options": [
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 0,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_1' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-1",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_1\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_1\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"fallback_val_1\"",
      "\"err_id_1\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 1,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_1\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_1\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-1",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_1' and the resource's close() method throws an exception 'CloseErr_1', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_1 = new CustomResource()) { // close() throws CloseErr_1\n    throw new RuntimeException(\"TryErr_1\");\n}",
    "options": [
      "The exception containing 'CloseErr_1' is thrown; the 'TryErr_1' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_1' is thrown; the exception containing 'CloseErr_1' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_1' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-1",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "A synchronized block or synchronized method.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-1",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 2",
      "Key 5",
      "Key 4",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 2, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-1",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Integer s) method executes because Integer is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s)."
  },
  {
    "id": "java-quiz-t15-1",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[1] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-1",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 11 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 11 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-1",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 10. Thread 1 calls compareAndSet(15, 20). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(10);\nboolean updated = atomic.compareAndSet(15, 20);",
    "options": [
      "Returns true, resulting in value 20 regardless of expectation.",
      "Returns false, resulting in value 20 due to lock-free CAS loops.",
      "Returns false, resulting in value 10.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (15). If it does (value is 10), it atomically updates it to 20 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-1",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-1",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000001, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000001)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An overflow value of -2146483648 (due to standard 32-bit signed integer overflow).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000001 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-1",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_1().display()'?",
    "codeSnippet": "class ParentService_1 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_1 extends ParentService_1 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_1', the call to log() is resolved to 'ChildService_1.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-2",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 9. If you submit 16 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(9)\n);\nfor (int i = 0; i < 16; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "4 active threads running tasks, with 12 tasks in the queue.",
      "7 active threads running tasks, with 9 tasks in the queue.",
      "6 active threads running tasks, with 10 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "The lifecycle rules are: 1) First 4 tasks create 4 core threads. 2) Next 9 tasks fill the queue. 3) Remaining tasks (total 16 - 4 - 9 = 3) exceed queue capacity, so 3 new threads are spawned (up to max 6). This results in 7 active threads and 9 queued tasks."
  },
  {
    "id": "java-quiz-t2-2",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 8 distinct instances of class CustomKeyVal_2 into a standard HashMap. Class CustomKeyVal_2 overrides hashCode() to return constant 210, but does not override equals(). What happens when you retrieve the key with id = 3?",
    "codeSnippet": "public class CustomKeyVal_2 {\n    private int id;\n    public CustomKeyVal_2(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 210; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_2, String> map = new HashMap<>();\nCustomKeyVal_2 searchKey = null;\nfor (int k = 1; k <= 8; k++) {\n    CustomKeyVal_2 key = new CustomKeyVal_2(k);\n    if (k == 3) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval succeeds and returns \"Val_3\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_3\"."
  },
  {
    "id": "java-quiz-t3-2",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Double?",
    "codeSnippet": "public static void process(List<? extends Double> src, List<? super Double> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Double' into 'src' and read from 'dest' as type 'Double'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You can read from 'src' as type 'Double' and add elements of type 'Double' (or its subclasses) to 'dest'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Double> is a Producer, so you can safely read from it as type 'Double'. List<? super Double> is a Consumer, so you can safely write/add elements of type 'Double' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-2",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1200ms. Thread T2 sleeps for 900ms. If the main thread calls T1.join(540) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1200); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(900); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(540);\nt2.join();",
    "options": [
      "Approximately 2100ms, as both join calls are executed sequentially.",
      "Approximately 1200ms, since T1 completes last.",
      "Approximately 540ms, as both threads are forced to interrupt.",
      "Approximately 1440ms, because the main thread waits for the 540ms timeout on T1, then blocks until T2 completes its remaining sleep."
    ],
    "correctOptionIndex": 3,
    "explanation": "Main thread waits on t1.join(540) which times out after 540ms. Meanwhile, T2 has been running in the background for 540ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (900 - 540 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 540 + (900 > 540 ? 900 - 540 : 0) which equals 1440ms."
  },
  {
    "id": "java-quiz-t5-2",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 12. If you add 13 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(12);\nfor (int j = 0; j < 13; j++) {\n    list.add(j);\n}",
    "options": [
      "24 (capacity doubles when full)",
      "22 (capacity grows by a fixed step of 10)",
      "13 (capacity grows to fit exactly the inserted elements)",
      "18 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 12, the new capacity is 12 + 6 = 18."
  },
  {
    "id": "java-quiz-t6-2",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_2\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_2\");",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"literalVal_2\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-2",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_2' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_2\")\n                   .orElse(fetchFromDb_2());\n}\npublic String fetchFromDb_2() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_2()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-2",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 12 on a machine with 4 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(12);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 4 threads, matching the physical CPU cores.",
      "Up to 3 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations.",
      "Up to 12 concurrent threads inside the custom ForkJoinPool."
    ],
    "correctOptionIndex": 3,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 12), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-2",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_2' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_2 = new Object();\nmap.put(keyData_2, \"ActiveSession\");\n\nkeyData_2 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 1,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_2' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-2",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_2\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_2\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"fallback_val_2\"",
      "\"Secondary_Fallback\"",
      "\"err_id_2\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 0,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_2\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_2\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-2",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_2' and the resource's close() method throws an exception 'CloseErr_2', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_2 = new CustomResource()) { // close() throws CloseErr_2\n    throw new RuntimeException(\"TryErr_2\");\n}",
    "options": [
      "The RuntimeException containing 'TryErr_2' is thrown; the exception containing 'CloseErr_2' is added to it as a suppressed exception.",
      "The exception containing 'CloseErr_2' is thrown; the 'TryErr_2' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_2' without suppressing the other."
    ],
    "correctOptionIndex": 0,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-2",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-2",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(3), and then put key 4, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(3);\nmap.put(4, \"Val_\" + 4);",
    "options": [
      "Key 3",
      "Key 1",
      "Key 4",
      "Key 3"
    ],
    "correctOptionIndex": 1,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 3 moves it to the end. The eldest key is the least recently accessed. If cap=3 and we accessed 3, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-2",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Double s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Double s) { System.out.print(\"Double\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch.",
      "The print(Double s) method executes because Double is a more specific type than Object."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Double' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Double s)."
  },
  {
    "id": "java-quiz-t15-2",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[2] = 10.5; // Double value",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-2",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 12 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 12 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-2",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 20. Thread 1 calls compareAndSet(20, 30). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(20);\nboolean updated = atomic.compareAndSet(20, 30);",
    "options": [
      "Returns true, resulting in value 30 regardless of expectation.",
      "Returns false, resulting in value 30 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match.",
      "Returns true, resulting in value 30."
    ],
    "correctOptionIndex": 3,
    "explanation": "compareAndSet checks if the current value equals the expected value (20). If it does (value is 20), it atomically updates it to 30 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-2",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-2",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000002, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000002)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "An overflow value of -2146483647 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000002 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-2",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_2().display()'?",
    "codeSnippet": "class ParentService_2 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_2 extends ParentService_2 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures.",
      "Child"
    ],
    "correctOptionIndex": 3,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_2', the call to log() is resolved to 'ChildService_2.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-3",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 11. If you submit 14 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(11)\n);\nfor (int i = 0; i < 14; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "2 active threads running tasks, with 12 tasks in the queue.",
      "5 active threads running tasks, with 9 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately.",
      "3 active threads running tasks, with 11 tasks in the queue."
    ],
    "correctOptionIndex": 3,
    "explanation": "The lifecycle rules are: 1) First 2 tasks create 2 core threads. 2) Next 11 tasks fill the queue. 3) Remaining tasks (total 14 - 2 - 11 = 1) exceed queue capacity, so 1 new threads are spawned (up to max 5). This results in 3 active threads and 11 queued tasks."
  },
  {
    "id": "java-quiz-t2-3",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 9 distinct instances of class CustomKeyVal_3 into a standard HashMap. Class CustomKeyVal_3 overrides hashCode() to return constant 215, but does not override equals(). What happens when you retrieve the key with id = 4?",
    "codeSnippet": "public class CustomKeyVal_3 {\n    private int id;\n    public CustomKeyVal_3(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 215; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_3, String> map = new HashMap<>();\nCustomKeyVal_3 searchKey = null;\nfor (int k = 1; k <= 9; k++) {\n    CustomKeyVal_3 key = new CustomKeyVal_3(k);\n    if (k == 4) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket.",
      "The retrieval succeeds and returns \"Val_4\" because object reference identity (==) is checked and succeeds on the exact same key reference."
    ],
    "correctOptionIndex": 3,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_4\"."
  },
  {
    "id": "java-quiz-t3-3",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Float?",
    "codeSnippet": "public static void process(List<? extends Float> src, List<? super Float> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Float' into 'src' and read from 'dest' as type 'Float'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You can read from 'src' as type 'Float' and add elements of type 'Float' (or its subclasses) to 'dest'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Float> is a Producer, so you can safely read from it as type 'Float'. List<? super Float> is a Consumer, so you can safely write/add elements of type 'Float' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-3",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1300ms. Thread T2 sleeps for 950ms. If the main thread calls T1.join(560) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1300); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(950); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(560);\nt2.join();",
    "options": [
      "Approximately 1510ms, because the main thread waits for the 560ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 2250ms, as both join calls are executed sequentially.",
      "Approximately 1300ms, since T1 completes last.",
      "Approximately 560ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 0,
    "explanation": "Main thread waits on t1.join(560) which times out after 560ms. Meanwhile, T2 has been running in the background for 560ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (950 - 560 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 560 + (950 > 560 ? 950 - 560 : 0) which equals 1510ms."
  },
  {
    "id": "java-quiz-t5-3",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 14. If you add 15 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(14);\nfor (int j = 0; j < 15; j++) {\n    list.add(j);\n}",
    "options": [
      "28 (capacity doubles when full)",
      "24 (capacity grows by a fixed step of 10)",
      "15 (capacity grows to fit exactly the inserted elements)",
      "21 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 14, the new capacity is 14 + 7 = 21."
  },
  {
    "id": "java-quiz-t6-3",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_3\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_3\");",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap."
    ],
    "correctOptionIndex": 3,
    "explanation": "This statement creates two objects: the literal string \"literalVal_3\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-3",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_3' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_3\")\n                   .orElse(fetchFromDb_3());\n}\npublic String fetchFromDb_3() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_3()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-3",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 15 on a machine with 5 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(15);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 5 threads, matching the physical CPU cores.",
      "Up to 15 concurrent threads inside the custom ForkJoinPool.",
      "Up to 4 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 15), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-3",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_3' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_3 = new Object();\nmap.put(keyData_3, \"ActiveSession\");\n\nkeyData_3 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_3' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-3",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_3\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_3\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_3\"",
      "\"fallback_val_3\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_3\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_3\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-3",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_3' and the resource's close() method throws an exception 'CloseErr_3', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_3 = new CustomResource()) { // close() throws CloseErr_3\n    throw new RuntimeException(\"TryErr_3\");\n}",
    "options": [
      "The exception containing 'CloseErr_3' is thrown; the 'TryErr_3' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_3' without suppressing the other.",
      "The RuntimeException containing 'TryErr_3' is thrown; the exception containing 'CloseErr_3' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-3",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-3",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(4), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(4);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 4",
      "Key 5",
      "Key 4",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 4 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 4, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-3",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Runnable s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Runnable s) { System.out.print(\"Runnable\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "The print(Runnable s) method executes because Runnable is a more specific type than Object.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Runnable' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Runnable s)."
  },
  {
    "id": "java-quiz-t15-3",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[3] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-3",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 13 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 13 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 2,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-3",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 30. Thread 1 calls compareAndSet(35, 40). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(30);\nboolean updated = atomic.compareAndSet(35, 40);",
    "options": [
      "Returns false, resulting in value 30.",
      "Returns true, resulting in value 40 regardless of expectation.",
      "Returns false, resulting in value 40 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (35). If it does (value is 30), it atomically updates it to 40 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-3",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-3",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000003, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000003)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator.",
      "An overflow value of -2146483646 (due to standard 32-bit signed integer overflow)."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000003 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-3",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_3().display()'?",
    "codeSnippet": "class ParentService_3 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_3 extends ParentService_3 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_3', the call to log() is resolved to 'ChildService_3.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-4",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 13. If you submit 18 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(13)\n);\nfor (int i = 0; i < 18; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "3 active threads running tasks, with 15 tasks in the queue.",
      "5 active threads running tasks, with 13 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately.",
      "5 active threads running tasks, with 13 tasks in the queue."
    ],
    "correctOptionIndex": 3,
    "explanation": "The lifecycle rules are: 1) First 3 tasks create 3 core threads. 2) Next 13 tasks fill the queue. 3) Remaining tasks (total 18 - 3 - 13 = 2) exceed queue capacity, so 2 new threads are spawned (up to max 5). This results in 5 active threads and 13 queued tasks."
  },
  {
    "id": "java-quiz-t2-4",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 6 distinct instances of class CustomKeyVal_4 into a standard HashMap. Class CustomKeyVal_4 overrides hashCode() to return constant 220, but does not override equals(). What happens when you retrieve the key with id = 5?",
    "codeSnippet": "public class CustomKeyVal_4 {\n    private int id;\n    public CustomKeyVal_4(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 220; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_4, String> map = new HashMap<>();\nCustomKeyVal_4 searchKey = null;\nfor (int k = 1; k <= 6; k++) {\n    CustomKeyVal_4 key = new CustomKeyVal_4(k);\n    if (k == 5) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval succeeds and returns \"Val_5\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_5\"."
  },
  {
    "id": "java-quiz-t3-4",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Number?",
    "codeSnippet": "public static void process(List<? extends Number> src, List<? super Number> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can read from 'src' as type 'Number' and add elements of type 'Number' (or its subclasses) to 'dest'.",
      "You can write elements of type 'Number' into 'src' and read from 'dest' as type 'Number'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under PECS: List<? extends Number> is a Producer, so you can safely read from it as type 'Number'. List<? super Number> is a Consumer, so you can safely write/add elements of type 'Number' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-4",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1400ms. Thread T2 sleeps for 1000ms. If the main thread calls T1.join(580) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1400); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1000); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(580);\nt2.join();",
    "options": [
      "Approximately 2400ms, as both join calls are executed sequentially.",
      "Approximately 1580ms, because the main thread waits for the 580ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 1400ms, since T1 completes last.",
      "Approximately 580ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "Main thread waits on t1.join(580) which times out after 580ms. Meanwhile, T2 has been running in the background for 580ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1000 - 580 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 580 + (1000 > 580 ? 1000 - 580 : 0) which equals 1580ms."
  },
  {
    "id": "java-quiz-t5-4",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 16. If you add 17 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(16);\nfor (int j = 0; j < 17; j++) {\n    list.add(j);\n}",
    "options": [
      "32 (capacity doubles when full)",
      "26 (capacity grows by a fixed step of 10)",
      "17 (capacity grows to fit exactly the inserted elements)",
      "24 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 16, the new capacity is 16 + 8 = 24."
  },
  {
    "id": "java-quiz-t6-4",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_4\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_4\");",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"literalVal_4\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-4",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_4' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_4\")\n                   .orElse(fetchFromDb_4());\n}\npublic String fetchFromDb_4() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_4()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-4",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 6 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(6);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 6 concurrent threads inside the custom ForkJoinPool.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 6), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-4",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_4' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_4 = new Object();\nmap.put(keyData_4, \"ActiveSession\");\n\nkeyData_4 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_4' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-4",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_4\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_4\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_4\"",
      "\"fallback_val_4\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_4\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_4\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-4",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_4' and the resource's close() method throws an exception 'CloseErr_4', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_4 = new CustomResource()) { // close() throws CloseErr_4\n    throw new RuntimeException(\"TryErr_4\");\n}",
    "options": [
      "The exception containing 'CloseErr_4' is thrown; the 'TryErr_4' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_4' is thrown; the exception containing 'CloseErr_4' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_4' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-4",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-4",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(2), and then put key 4, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(4, \"Val_\" + 4);",
    "options": [
      "Key 2",
      "Key 4",
      "Key 1",
      "Key 3"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If cap=3 and we accessed 2, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-4",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(String s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(String s) { System.out.print(\"String\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "The print(String s) method executes because String is a more specific type than Object.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'String' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(String s)."
  },
  {
    "id": "java-quiz-t15-4",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[4] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-4",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 14 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 14 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-4",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 40. Thread 1 calls compareAndSet(40, 50). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(40);\nboolean updated = atomic.compareAndSet(40, 50);",
    "options": [
      "Returns true, resulting in value 50.",
      "Returns true, resulting in value 50 regardless of expectation.",
      "Returns false, resulting in value 50 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (40). If it does (value is 40), it atomically updates it to 50 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-4",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-4",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000004, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000004)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2146483645 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000004 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-4",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_4().display()'?",
    "codeSnippet": "class ParentService_4 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_4 extends ParentService_4 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_4', the call to log() is resolved to 'ChildService_4.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-5",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 7, keepAliveTime = 60s, and a workQueue capacity of 15. If you submit 22 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 7, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(15)\n);\nfor (int i = 0; i < 22; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "4 active threads running tasks, with 18 tasks in the queue.",
      "7 active threads running tasks, with 15 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately.",
      "7 active threads running tasks, with 15 tasks in the queue."
    ],
    "correctOptionIndex": 3,
    "explanation": "The lifecycle rules are: 1) First 4 tasks create 4 core threads. 2) Next 15 tasks fill the queue. 3) Remaining tasks (total 22 - 4 - 15 = 3) exceed queue capacity, so 3 new threads are spawned (up to max 7). This results in 7 active threads and 15 queued tasks."
  },
  {
    "id": "java-quiz-t2-5",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKeyVal_5 into a standard HashMap. Class CustomKeyVal_5 overrides hashCode() to return constant 225, but does not override equals(). What happens when you retrieve the key with id = 6?",
    "codeSnippet": "public class CustomKeyVal_5 {\n    private int id;\n    public CustomKeyVal_5(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 225; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_5, String> map = new HashMap<>();\nCustomKeyVal_5 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKeyVal_5 key = new CustomKeyVal_5(k);\n    if (k == 6) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval succeeds and returns \"Val_6\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_6\"."
  },
  {
    "id": "java-quiz-t3-5",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Integer?",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Integer' into 'src' and read from 'dest' as type 'Integer'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You can read from 'src' as type 'Integer' and add elements of type 'Integer' (or its subclasses) to 'dest'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so you can safely read from it as type 'Integer'. List<? super Integer> is a Consumer, so you can safely write/add elements of type 'Integer' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-5",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1500ms. Thread T2 sleeps for 1050ms. If the main thread calls T1.join(600) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1500); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1050); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(600);\nt2.join();",
    "options": [
      "Approximately 1650ms, because the main thread waits for the 600ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 2550ms, as both join calls are executed sequentially.",
      "Approximately 1500ms, since T1 completes last.",
      "Approximately 600ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 0,
    "explanation": "Main thread waits on t1.join(600) which times out after 600ms. Meanwhile, T2 has been running in the background for 600ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1050 - 600 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 600 + (1050 > 600 ? 1050 - 600 : 0) which equals 1650ms."
  },
  {
    "id": "java-quiz-t5-5",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 18. If you add 19 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(18);\nfor (int j = 0; j < 19; j++) {\n    list.add(j);\n}",
    "options": [
      "36 (capacity doubles when full)",
      "27 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "28 (capacity grows by a fixed step of 10)",
      "19 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 18, the new capacity is 18 + 9 = 27."
  },
  {
    "id": "java-quiz-t6-5",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_5\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_5\");",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"literalVal_5\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-5",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_5' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_5\")\n                   .orElse(fetchFromDb_5());\n}\npublic String fetchFromDb_5() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_5()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-5",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 9 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(9);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 9 concurrent threads inside the custom ForkJoinPool.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 9), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-5",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_5' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_5 = new Object();\nmap.put(keyData_5, \"ActiveSession\");\n\nkeyData_5 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_5' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-5",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_5\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_5\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"fallback_val_5\"",
      "\"Secondary_Fallback\"",
      "\"err_id_5\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 0,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_5\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_5\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-5",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_5' and the resource's close() method throws an exception 'CloseErr_5', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_5 = new CustomResource()) { // close() throws CloseErr_5\n    throw new RuntimeException(\"TryErr_5\");\n}",
    "options": [
      "The exception containing 'CloseErr_5' is thrown; the 'TryErr_5' exception is discarded.",
      "The RuntimeException containing 'TryErr_5' is thrown; the exception containing 'CloseErr_5' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_5' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-5",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-5",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 2",
      "Key 5",
      "Key 1",
      "Key 4"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 2, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-5",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Integer s) method executes because Integer is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s)."
  },
  {
    "id": "java-quiz-t15-5",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[0] = 10.5; // Double value",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-5",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 15 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 15 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-5",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 50. Thread 1 calls compareAndSet(55, 60). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(50);\nboolean updated = atomic.compareAndSet(55, 60);",
    "options": [
      "Returns true, resulting in value 60 regardless of expectation.",
      "Returns false, resulting in value 50.",
      "Returns false, resulting in value 60 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 1,
    "explanation": "compareAndSet checks if the current value equals the expected value (55). If it does (value is 50), it atomically updates it to 60 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-5",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 1,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-5",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000005, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000005)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An overflow value of -2146483644 (due to standard 32-bit signed integer overflow).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000005 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-5",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_5().display()'?",
    "codeSnippet": "class ParentService_5 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_5 extends ParentService_5 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Child",
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 0,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_5', the call to log() is resolved to 'ChildService_5.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-6",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 4, keepAliveTime = 60s, and a workQueue capacity of 17. If you submit 20 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 4, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(17)\n);\nfor (int i = 0; i < 20; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "3 active threads running tasks, with 17 tasks in the queue.",
      "2 active threads running tasks, with 18 tasks in the queue.",
      "4 active threads running tasks, with 16 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "The lifecycle rules are: 1) First 2 tasks create 2 core threads. 2) Next 17 tasks fill the queue. 3) Remaining tasks (total 20 - 2 - 17 = 1) exceed queue capacity, so 1 new threads are spawned (up to max 4). This results in 3 active threads and 17 queued tasks."
  },
  {
    "id": "java-quiz-t2-6",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 8 distinct instances of class CustomKeyVal_6 into a standard HashMap. Class CustomKeyVal_6 overrides hashCode() to return constant 230, but does not override equals(). What happens when you retrieve the key with id = 7?",
    "codeSnippet": "public class CustomKeyVal_6 {\n    private int id;\n    public CustomKeyVal_6(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 230; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_6, String> map = new HashMap<>();\nCustomKeyVal_6 searchKey = null;\nfor (int k = 1; k <= 8; k++) {\n    CustomKeyVal_6 key = new CustomKeyVal_6(k);\n    if (k == 7) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_7\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_7\"."
  },
  {
    "id": "java-quiz-t3-6",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Double?",
    "codeSnippet": "public static void process(List<? extends Double> src, List<? super Double> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Double' into 'src' and read from 'dest' as type 'Double'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You can read from 'src' as type 'Double' and add elements of type 'Double' (or its subclasses) to 'dest'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Double> is a Producer, so you can safely read from it as type 'Double'. List<? super Double> is a Consumer, so you can safely write/add elements of type 'Double' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-6",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1600ms. Thread T2 sleeps for 1100ms. If the main thread calls T1.join(620) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1600); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1100); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(620);\nt2.join();",
    "options": [
      "Approximately 1720ms, because the main thread waits for the 620ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 2700ms, as both join calls are executed sequentially.",
      "Approximately 1600ms, since T1 completes last.",
      "Approximately 620ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 0,
    "explanation": "Main thread waits on t1.join(620) which times out after 620ms. Meanwhile, T2 has been running in the background for 620ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1100 - 620 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 620 + (1100 > 620 ? 1100 - 620 : 0) which equals 1720ms."
  },
  {
    "id": "java-quiz-t5-6",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 20. If you add 21 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(20);\nfor (int j = 0; j < 21; j++) {\n    list.add(j);\n}",
    "options": [
      "40 (capacity doubles when full)",
      "30 (capacity grows by a fixed step of 10)",
      "30 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "21 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 2,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 20, the new capacity is 20 + 10 = 30."
  },
  {
    "id": "java-quiz-t6-6",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_6\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_6\");",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"literalVal_6\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-6",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_6' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_6\")\n                   .orElse(fetchFromDb_6());\n}\npublic String fetchFromDb_6() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_6()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-6",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 12 on a machine with 4 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(12);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 4 threads, matching the physical CPU cores.",
      "Up to 12 concurrent threads inside the custom ForkJoinPool.",
      "Up to 3 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 12), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-6",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_6' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_6 = new Object();\nmap.put(keyData_6, \"ActiveSession\");\n\nkeyData_6 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_6' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-6",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_6\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_6\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_6\"",
      "\"fallback_val_6\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_6\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_6\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-6",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_6' and the resource's close() method throws an exception 'CloseErr_6', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_6 = new CustomResource()) { // close() throws CloseErr_6\n    throw new RuntimeException(\"TryErr_6\");\n}",
    "options": [
      "The exception containing 'CloseErr_6' is thrown; the 'TryErr_6' exception is discarded.",
      "The RuntimeException containing 'TryErr_6' is thrown; the exception containing 'CloseErr_6' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_6' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-6",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A synchronized block or synchronized method.",
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-6",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(1), and then put key 4, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(1);\nmap.put(4, \"Val_\" + 4);",
    "options": [
      "Key 2",
      "Key 1",
      "Key 4",
      "Key 3"
    ],
    "correctOptionIndex": 0,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 1 moves it to the end. The eldest key is the least recently accessed. If cap=3 and we accessed 1, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-6",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Double s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Double s) { System.out.print(\"Double\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "The print(Double s) method executes because Double is a more specific type than Object.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Double' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Double s)."
  },
  {
    "id": "java-quiz-t15-6",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[1] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-6",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 16 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 16 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-6",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 60. Thread 1 calls compareAndSet(60, 70). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(60);\nboolean updated = atomic.compareAndSet(60, 70);",
    "options": [
      "Returns true, resulting in value 70 regardless of expectation.",
      "Returns false, resulting in value 70 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match.",
      "Returns true, resulting in value 70."
    ],
    "correctOptionIndex": 3,
    "explanation": "compareAndSet checks if the current value equals the expected value (60). If it does (value is 60), it atomically updates it to 70 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-6",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-6",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000006, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000006)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2146483643 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000006 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-6",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_6().display()'?",
    "codeSnippet": "class ParentService_6 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_6 extends ParentService_6 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_6', the call to log() is resolved to 'ChildService_6.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-7",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 19. If you submit 24 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(19)\n);\nfor (int i = 0; i < 24; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "3 active threads running tasks, with 21 tasks in the queue.",
      "6 active threads running tasks, with 18 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately.",
      "5 active threads running tasks, with 19 tasks in the queue."
    ],
    "correctOptionIndex": 3,
    "explanation": "The lifecycle rules are: 1) First 3 tasks create 3 core threads. 2) Next 19 tasks fill the queue. 3) Remaining tasks (total 24 - 3 - 19 = 2) exceed queue capacity, so 2 new threads are spawned (up to max 6). This results in 5 active threads and 19 queued tasks."
  },
  {
    "id": "java-quiz-t2-7",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 9 distinct instances of class CustomKeyVal_7 into a standard HashMap. Class CustomKeyVal_7 overrides hashCode() to return constant 235, but does not override equals(). What happens when you retrieve the key with id = 8?",
    "codeSnippet": "public class CustomKeyVal_7 {\n    private int id;\n    public CustomKeyVal_7(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 235; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_7, String> map = new HashMap<>();\nCustomKeyVal_7 searchKey = null;\nfor (int k = 1; k <= 9; k++) {\n    CustomKeyVal_7 key = new CustomKeyVal_7(k);\n    if (k == 8) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The retrieval succeeds and returns \"Val_8\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 1,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_8\"."
  },
  {
    "id": "java-quiz-t3-7",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Float?",
    "codeSnippet": "public static void process(List<? extends Float> src, List<? super Float> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can read from 'src' as type 'Float' and add elements of type 'Float' (or its subclasses) to 'dest'.",
      "You can write elements of type 'Float' into 'src' and read from 'dest' as type 'Float'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under PECS: List<? extends Float> is a Producer, so you can safely read from it as type 'Float'. List<? super Float> is a Consumer, so you can safely write/add elements of type 'Float' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-7",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1700ms. Thread T2 sleeps for 1150ms. If the main thread calls T1.join(640) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1700); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1150); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(640);\nt2.join();",
    "options": [
      "Approximately 2850ms, as both join calls are executed sequentially.",
      "Approximately 1790ms, because the main thread waits for the 640ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 1700ms, since T1 completes last.",
      "Approximately 640ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "Main thread waits on t1.join(640) which times out after 640ms. Meanwhile, T2 has been running in the background for 640ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1150 - 640 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 640 + (1150 > 640 ? 1150 - 640 : 0) which equals 1790ms."
  },
  {
    "id": "java-quiz-t5-7",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 22. If you add 23 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(22);\nfor (int j = 0; j < 23; j++) {\n    list.add(j);\n}",
    "options": [
      "44 (capacity doubles when full)",
      "32 (capacity grows by a fixed step of 10)",
      "33 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "23 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 2,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 22, the new capacity is 22 + 11 = 33."
  },
  {
    "id": "java-quiz-t6-7",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_7\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_7\");",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"literalVal_7\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-7",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_7' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_7\")\n                   .orElse(fetchFromDb_7());\n}\npublic String fetchFromDb_7() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_7()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-7",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 15 on a machine with 5 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(15);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 5 threads, matching the physical CPU cores.",
      "Up to 4 threads, as the common pool always reserves one core.",
      "Up to 15 concurrent threads inside the custom ForkJoinPool.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 15), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-7",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_7' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_7 = new Object();\nmap.put(keyData_7, \"ActiveSession\");\n\nkeyData_7 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_7' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-7",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_7\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_7\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_7\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_val_7\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_7\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_7\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-7",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_7' and the resource's close() method throws an exception 'CloseErr_7', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_7 = new CustomResource()) { // close() throws CloseErr_7\n    throw new RuntimeException(\"TryErr_7\");\n}",
    "options": [
      "The exception containing 'CloseErr_7' is thrown; the 'TryErr_7' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_7' is thrown; the exception containing 'CloseErr_7' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_7' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-7",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-7",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(4), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(4);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 4",
      "Key 5",
      "Key 1",
      "Key 4"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 4 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 4, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-7",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Runnable s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Runnable s) { System.out.print(\"Runnable\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "The print(Runnable s) method executes because Runnable is a more specific type than Object.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Runnable' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Runnable s)."
  },
  {
    "id": "java-quiz-t15-7",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[2] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-7",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 17 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 17 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-7",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 70. Thread 1 calls compareAndSet(75, 80). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(70);\nboolean updated = atomic.compareAndSet(75, 80);",
    "options": [
      "Returns false, resulting in value 70.",
      "Returns true, resulting in value 80 regardless of expectation.",
      "Returns false, resulting in value 80 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (75). If it does (value is 70), it atomically updates it to 80 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-7",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 1,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-7",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000007, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000007)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2146483642 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000007 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-7",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_7().display()'?",
    "codeSnippet": "class ParentService_7 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_7 extends ParentService_7 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures.",
      "Child"
    ],
    "correctOptionIndex": 3,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_7', the call to log() is resolved to 'ChildService_7.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-8",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 21. If you submit 28 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(21)\n);\nfor (int i = 0; i < 28; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "4 active threads running tasks, with 24 tasks in the queue.",
      "6 active threads running tasks, with 22 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately.",
      "7 active threads running tasks, with 21 tasks in the queue."
    ],
    "correctOptionIndex": 3,
    "explanation": "The lifecycle rules are: 1) First 4 tasks create 4 core threads. 2) Next 21 tasks fill the queue. 3) Remaining tasks (total 28 - 4 - 21 = 3) exceed queue capacity, so 3 new threads are spawned (up to max 6). This results in 7 active threads and 21 queued tasks."
  },
  {
    "id": "java-quiz-t2-8",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 6 distinct instances of class CustomKeyVal_8 into a standard HashMap. Class CustomKeyVal_8 overrides hashCode() to return constant 240, but does not override equals(). What happens when you retrieve the key with id = 3?",
    "codeSnippet": "public class CustomKeyVal_8 {\n    private int id;\n    public CustomKeyVal_8(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 240; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_8, String> map = new HashMap<>();\nCustomKeyVal_8 searchKey = null;\nfor (int k = 1; k <= 6; k++) {\n    CustomKeyVal_8 key = new CustomKeyVal_8(k);\n    if (k == 3) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval succeeds and returns \"Val_3\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_3\"."
  },
  {
    "id": "java-quiz-t3-8",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Number?",
    "codeSnippet": "public static void process(List<? extends Number> src, List<? super Number> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Number' into 'src' and read from 'dest' as type 'Number'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting.",
      "You can read from 'src' as type 'Number' and add elements of type 'Number' (or its subclasses) to 'dest'."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under PECS: List<? extends Number> is a Producer, so you can safely read from it as type 'Number'. List<? super Number> is a Consumer, so you can safely write/add elements of type 'Number' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-8",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1800ms. Thread T2 sleeps for 1200ms. If the main thread calls T1.join(660) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1800); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1200); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(660);\nt2.join();",
    "options": [
      "Approximately 1860ms, because the main thread waits for the 660ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 3000ms, as both join calls are executed sequentially.",
      "Approximately 1800ms, since T1 completes last.",
      "Approximately 660ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 0,
    "explanation": "Main thread waits on t1.join(660) which times out after 660ms. Meanwhile, T2 has been running in the background for 660ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1200 - 660 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 660 + (1200 > 660 ? 1200 - 660 : 0) which equals 1860ms."
  },
  {
    "id": "java-quiz-t5-8",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 24. If you add 25 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(24);\nfor (int j = 0; j < 25; j++) {\n    list.add(j);\n}",
    "options": [
      "48 (capacity doubles when full)",
      "34 (capacity grows by a fixed step of 10)",
      "36 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "25 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 2,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 24, the new capacity is 24 + 12 = 36."
  },
  {
    "id": "java-quiz-t6-8",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_8\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_8\");",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 2,
    "explanation": "This statement creates two objects: the literal string \"literalVal_8\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-8",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_8' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_8\")\n                   .orElse(fetchFromDb_8());\n}\npublic String fetchFromDb_8() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_8()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-8",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 6 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(6);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "Up to 6 concurrent threads inside the custom ForkJoinPool.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 6), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-8",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_8' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_8 = new Object();\nmap.put(keyData_8, \"ActiveSession\");\n\nkeyData_8 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_8' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-8",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_8\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_8\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_8\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_val_8\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_8\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_8\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-8",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_8' and the resource's close() method throws an exception 'CloseErr_8', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_8 = new CustomResource()) { // close() throws CloseErr_8\n    throw new RuntimeException(\"TryErr_8\");\n}",
    "options": [
      "The exception containing 'CloseErr_8' is thrown; the 'TryErr_8' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_8' is thrown; the exception containing 'CloseErr_8' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_8' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-8",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A synchronized block or synchronized method.",
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-8",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(3), and then put key 4, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(3);\nmap.put(4, \"Val_\" + 4);",
    "options": [
      "Key 1",
      "Key 3",
      "Key 4",
      "Key 3"
    ],
    "correctOptionIndex": 0,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 3 moves it to the end. The eldest key is the least recently accessed. If cap=3 and we accessed 3, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-8",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(String s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(String s) { System.out.print(\"String\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(String s) method executes because String is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'String' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(String s)."
  },
  {
    "id": "java-quiz-t15-8",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[3] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-8",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 18 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 18 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-8",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 80. Thread 1 calls compareAndSet(80, 90). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(80);\nboolean updated = atomic.compareAndSet(80, 90);",
    "options": [
      "Returns true, resulting in value 90.",
      "Returns true, resulting in value 90 regardless of expectation.",
      "Returns false, resulting in value 90 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (80). If it does (value is 80), it atomically updates it to 90 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-8",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-8",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000008, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000008)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "An overflow value of -2146483641 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000008 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-8",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_8().display()'?",
    "codeSnippet": "class ParentService_8 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_8 extends ParentService_8 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Child",
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 0,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_8', the call to log() is resolved to 'ChildService_8.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-9",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 23. If you submit 26 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(23)\n);\nfor (int i = 0; i < 26; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "2 active threads running tasks, with 24 tasks in the queue.",
      "5 active threads running tasks, with 21 tasks in the queue.",
      "3 active threads running tasks, with 23 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "The lifecycle rules are: 1) First 2 tasks create 2 core threads. 2) Next 23 tasks fill the queue. 3) Remaining tasks (total 26 - 2 - 23 = 1) exceed queue capacity, so 1 new threads are spawned (up to max 5). This results in 3 active threads and 23 queued tasks."
  },
  {
    "id": "java-quiz-t2-9",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKeyVal_9 into a standard HashMap. Class CustomKeyVal_9 overrides hashCode() to return constant 245, but does not override equals(). What happens when you retrieve the key with id = 3?",
    "codeSnippet": "public class CustomKeyVal_9 {\n    private int id;\n    public CustomKeyVal_9(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 245; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_9, String> map = new HashMap<>();\nCustomKeyVal_9 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKeyVal_9 key = new CustomKeyVal_9(k);\n    if (k == 3) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The retrieval succeeds and returns \"Val_3\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 1,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_3\"."
  },
  {
    "id": "java-quiz-t3-9",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Integer?",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Integer' into 'src' and read from 'dest' as type 'Integer'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You can read from 'src' as type 'Integer' and add elements of type 'Integer' (or its subclasses) to 'dest'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so you can safely read from it as type 'Integer'. List<? super Integer> is a Consumer, so you can safely write/add elements of type 'Integer' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-9",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 1900ms. Thread T2 sleeps for 1250ms. If the main thread calls T1.join(680) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(1900); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1250); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(680);\nt2.join();",
    "options": [
      "Approximately 3150ms, as both join calls are executed sequentially.",
      "Approximately 1930ms, because the main thread waits for the 680ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 1900ms, since T1 completes last.",
      "Approximately 680ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "Main thread waits on t1.join(680) which times out after 680ms. Meanwhile, T2 has been running in the background for 680ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1250 - 680 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 680 + (1250 > 680 ? 1250 - 680 : 0) which equals 1930ms."
  },
  {
    "id": "java-quiz-t5-9",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 26. If you add 27 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(26);\nfor (int j = 0; j < 27; j++) {\n    list.add(j);\n}",
    "options": [
      "52 (capacity doubles when full)",
      "39 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "36 (capacity grows by a fixed step of 10)",
      "27 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 26, the new capacity is 26 + 13 = 39."
  },
  {
    "id": "java-quiz-t6-9",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_9\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_9\");",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap."
    ],
    "correctOptionIndex": 3,
    "explanation": "This statement creates two objects: the literal string \"literalVal_9\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-9",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_9' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_9\")\n                   .orElse(fetchFromDb_9());\n}\npublic String fetchFromDb_9() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_9()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-9",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 9 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(9);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 9 concurrent threads inside the custom ForkJoinPool.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 9), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-9",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_9' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_9 = new Object();\nmap.put(keyData_9, \"ActiveSession\");\n\nkeyData_9 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_9' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-9",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_9\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_9\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_9\"",
      "\"fallback_val_9\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_9\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_9\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-9",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_9' and the resource's close() method throws an exception 'CloseErr_9', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_9 = new CustomResource()) { // close() throws CloseErr_9\n    throw new RuntimeException(\"TryErr_9\");\n}",
    "options": [
      "The exception containing 'CloseErr_9' is thrown; the 'TryErr_9' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_9' without suppressing the other.",
      "The RuntimeException containing 'TryErr_9' is thrown; the exception containing 'CloseErr_9' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-9",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-9",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 2",
      "Key 1",
      "Key 5",
      "Key 4"
    ],
    "correctOptionIndex": 1,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 2, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-9",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch.",
      "The print(Integer s) method executes because Integer is a more specific type than Object."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s)."
  },
  {
    "id": "java-quiz-t15-9",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[4] = 10.5; // Double value",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-9",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 19 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 19 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-9",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 90. Thread 1 calls compareAndSet(95, 100). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(90);\nboolean updated = atomic.compareAndSet(95, 100);",
    "options": [
      "Returns true, resulting in value 100 regardless of expectation.",
      "Returns false, resulting in value 100 due to lock-free CAS loops.",
      "Returns false, resulting in value 90.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (95). If it does (value is 90), it atomically updates it to 100 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-9",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-9",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000009, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000009)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An overflow value of -2146483640 (due to standard 32-bit signed integer overflow).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000009 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-9",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_9().display()'?",
    "codeSnippet": "class ParentService_9 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_9 extends ParentService_9 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_9', the call to log() is resolved to 'ChildService_9.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-10",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 25. If you submit 30 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(25)\n);\nfor (int i = 0; i < 30; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "3 active threads running tasks, with 27 tasks in the queue.",
      "5 active threads running tasks, with 25 tasks in the queue.",
      "5 active threads running tasks, with 25 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "The lifecycle rules are: 1) First 3 tasks create 3 core threads. 2) Next 25 tasks fill the queue. 3) Remaining tasks (total 30 - 3 - 25 = 2) exceed queue capacity, so 2 new threads are spawned (up to max 5). This results in 5 active threads and 25 queued tasks."
  },
  {
    "id": "java-quiz-t2-10",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 8 distinct instances of class CustomKeyVal_10 into a standard HashMap. Class CustomKeyVal_10 overrides hashCode() to return constant 250, but does not override equals(). What happens when you retrieve the key with id = 3?",
    "codeSnippet": "public class CustomKeyVal_10 {\n    private int id;\n    public CustomKeyVal_10(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 250; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_10, String> map = new HashMap<>();\nCustomKeyVal_10 searchKey = null;\nfor (int k = 1; k <= 8; k++) {\n    CustomKeyVal_10 key = new CustomKeyVal_10(k);\n    if (k == 3) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket.",
      "The retrieval succeeds and returns \"Val_3\" because object reference identity (==) is checked and succeeds on the exact same key reference."
    ],
    "correctOptionIndex": 3,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_3\"."
  },
  {
    "id": "java-quiz-t3-10",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Double?",
    "codeSnippet": "public static void process(List<? extends Double> src, List<? super Double> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can read from 'src' as type 'Double' and add elements of type 'Double' (or its subclasses) to 'dest'.",
      "You can write elements of type 'Double' into 'src' and read from 'dest' as type 'Double'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 0,
    "explanation": "Under PECS: List<? extends Double> is a Producer, so you can safely read from it as type 'Double'. List<? super Double> is a Consumer, so you can safely write/add elements of type 'Double' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-10",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 2000ms. Thread T2 sleeps for 1300ms. If the main thread calls T1.join(700) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(2000); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1300); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(700);\nt2.join();",
    "options": [
      "Approximately 3300ms, as both join calls are executed sequentially.",
      "Approximately 2000ms, because the main thread waits for the 700ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 2000ms, since T1 completes last.",
      "Approximately 700ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "Main thread waits on t1.join(700) which times out after 700ms. Meanwhile, T2 has been running in the background for 700ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1300 - 700 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 700 + (1300 > 700 ? 1300 - 700 : 0) which equals 2000ms."
  },
  {
    "id": "java-quiz-t5-10",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 28. If you add 29 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(28);\nfor (int j = 0; j < 29; j++) {\n    list.add(j);\n}",
    "options": [
      "42 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "56 (capacity doubles when full)",
      "38 (capacity grows by a fixed step of 10)",
      "29 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 28, the new capacity is 28 + 14 = 42."
  },
  {
    "id": "java-quiz-t6-10",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_10\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_10\");",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"literalVal_10\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-10",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_10' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_10\")\n                   .orElse(fetchFromDb_10());\n}\npublic String fetchFromDb_10() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_10()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-10",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 12 on a machine with 4 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(12);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 4 threads, matching the physical CPU cores.",
      "Up to 12 concurrent threads inside the custom ForkJoinPool.",
      "Up to 3 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 12), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-10",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_10' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_10 = new Object();\nmap.put(keyData_10, \"ActiveSession\");\n\nkeyData_10 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_10' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-10",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_10\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_10\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"fallback_val_10\"",
      "\"Secondary_Fallback\"",
      "\"err_id_10\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 0,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_10\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_10\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-10",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_10' and the resource's close() method throws an exception 'CloseErr_10', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_10 = new CustomResource()) { // close() throws CloseErr_10\n    throw new RuntimeException(\"TryErr_10\");\n}",
    "options": [
      "The exception containing 'CloseErr_10' is thrown; the 'TryErr_10' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_10' is thrown; the exception containing 'CloseErr_10' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_10' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-10",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "A synchronized block or synchronized method.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-10",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(2), and then put key 4, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(4, \"Val_\" + 4);",
    "options": [
      "Key 2",
      "Key 1",
      "Key 4",
      "Key 3"
    ],
    "correctOptionIndex": 1,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If cap=3 and we accessed 2, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-10",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Double s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Double s) { System.out.print(\"Double\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "The print(Double s) method executes because Double is a more specific type than Object.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Double' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Double s)."
  },
  {
    "id": "java-quiz-t15-10",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[0] = 10.5; // Double value",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-10",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 20 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 20 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-10",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 100. Thread 1 calls compareAndSet(100, 110). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(100);\nboolean updated = atomic.compareAndSet(100, 110);",
    "options": [
      "Returns true, resulting in value 110.",
      "Returns true, resulting in value 110 regardless of expectation.",
      "Returns false, resulting in value 110 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (100). If it does (value is 100), it atomically updates it to 110 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-10",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-10",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000010, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000010)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator.",
      "An overflow value of -2146483639 (due to standard 32-bit signed integer overflow)."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000010 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-10",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_10().display()'?",
    "codeSnippet": "class ParentService_10 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_10 extends ParentService_10 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_10', the call to log() is resolved to 'ChildService_10.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-11",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 7, keepAliveTime = 60s, and a workQueue capacity of 27. If you submit 34 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 7, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(27)\n);\nfor (int i = 0; i < 34; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "7 active threads running tasks, with 27 tasks in the queue.",
      "4 active threads running tasks, with 30 tasks in the queue.",
      "7 active threads running tasks, with 27 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "The lifecycle rules are: 1) First 4 tasks create 4 core threads. 2) Next 27 tasks fill the queue. 3) Remaining tasks (total 34 - 4 - 27 = 3) exceed queue capacity, so 3 new threads are spawned (up to max 7). This results in 7 active threads and 27 queued tasks."
  },
  {
    "id": "java-quiz-t2-11",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 9 distinct instances of class CustomKeyVal_11 into a standard HashMap. Class CustomKeyVal_11 overrides hashCode() to return constant 255, but does not override equals(). What happens when you retrieve the key with id = 3?",
    "codeSnippet": "public class CustomKeyVal_11 {\n    private int id;\n    public CustomKeyVal_11(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 255; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_11, String> map = new HashMap<>();\nCustomKeyVal_11 searchKey = null;\nfor (int k = 1; k <= 9; k++) {\n    CustomKeyVal_11 key = new CustomKeyVal_11(k);\n    if (k == 3) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval succeeds and returns \"Val_3\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 0,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_3\"."
  },
  {
    "id": "java-quiz-t3-11",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Float?",
    "codeSnippet": "public static void process(List<? extends Float> src, List<? super Float> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Float' into 'src' and read from 'dest' as type 'Float'.",
      "You can read from 'src' as type 'Float' and add elements of type 'Float' (or its subclasses) to 'dest'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Float> is a Producer, so you can safely read from it as type 'Float'. List<? super Float> is a Consumer, so you can safely write/add elements of type 'Float' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-11",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 2100ms. Thread T2 sleeps for 1350ms. If the main thread calls T1.join(720) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(2100); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1350); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(720);\nt2.join();",
    "options": [
      "Approximately 3450ms, as both join calls are executed sequentially.",
      "Approximately 2100ms, since T1 completes last.",
      "Approximately 2070ms, because the main thread waits for the 720ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 720ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "Main thread waits on t1.join(720) which times out after 720ms. Meanwhile, T2 has been running in the background for 720ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1350 - 720 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 720 + (1350 > 720 ? 1350 - 720 : 0) which equals 2070ms."
  },
  {
    "id": "java-quiz-t5-11",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 30. If you add 31 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(30);\nfor (int j = 0; j < 31; j++) {\n    list.add(j);\n}",
    "options": [
      "60 (capacity doubles when full)",
      "40 (capacity grows by a fixed step of 10)",
      "31 (capacity grows to fit exactly the inserted elements)",
      "45 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 30, the new capacity is 30 + 15 = 45."
  },
  {
    "id": "java-quiz-t6-11",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_11\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_11\");",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"literalVal_11\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-11",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_11' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_11\")\n                   .orElse(fetchFromDb_11());\n}\npublic String fetchFromDb_11() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_11()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-11",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 15 on a machine with 5 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(15);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 5 threads, matching the physical CPU cores.",
      "Up to 4 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations.",
      "Up to 15 concurrent threads inside the custom ForkJoinPool."
    ],
    "correctOptionIndex": 3,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 15), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-11",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_11' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_11 = new Object();\nmap.put(keyData_11, \"ActiveSession\");\n\nkeyData_11 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_11' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-11",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_11\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_11\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_11\"",
      "\"fallback_val_11\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_11\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_11\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-11",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_11' and the resource's close() method throws an exception 'CloseErr_11', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_11 = new CustomResource()) { // close() throws CloseErr_11\n    throw new RuntimeException(\"TryErr_11\");\n}",
    "options": [
      "The exception containing 'CloseErr_11' is thrown; the 'TryErr_11' exception is discarded.",
      "The RuntimeException containing 'TryErr_11' is thrown; the exception containing 'CloseErr_11' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_11' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-11",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "A synchronized block or synchronized method.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-11",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(4), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(4);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 4",
      "Key 5",
      "Key 1",
      "Key 4"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 4 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 4, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-11",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Runnable s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Runnable s) { System.out.print(\"Runnable\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Runnable s) method executes because Runnable is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Runnable' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Runnable s)."
  },
  {
    "id": "java-quiz-t15-11",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[1] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-11",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 21 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 21 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-11",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 110. Thread 1 calls compareAndSet(115, 120). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(110);\nboolean updated = atomic.compareAndSet(115, 120);",
    "options": [
      "Returns true, resulting in value 120 regardless of expectation.",
      "Returns false, resulting in value 110.",
      "Returns false, resulting in value 120 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 1,
    "explanation": "compareAndSet checks if the current value equals the expected value (115). If it does (value is 110), it atomically updates it to 120 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-11",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-11",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000011, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000011)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2146483638 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000011 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-11",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_11().display()'?",
    "codeSnippet": "class ParentService_11 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_11 extends ParentService_11 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures.",
      "Child"
    ],
    "correctOptionIndex": 3,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_11', the call to log() is resolved to 'ChildService_11.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-12",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 4, keepAliveTime = 60s, and a workQueue capacity of 29. If you submit 32 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 4, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(29)\n);\nfor (int i = 0; i < 32; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "2 active threads running tasks, with 30 tasks in the queue.",
      "4 active threads running tasks, with 28 tasks in the queue.",
      "3 active threads running tasks, with 29 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "The lifecycle rules are: 1) First 2 tasks create 2 core threads. 2) Next 29 tasks fill the queue. 3) Remaining tasks (total 32 - 2 - 29 = 1) exceed queue capacity, so 1 new threads are spawned (up to max 4). This results in 3 active threads and 29 queued tasks."
  },
  {
    "id": "java-quiz-t2-12",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 6 distinct instances of class CustomKeyVal_12 into a standard HashMap. Class CustomKeyVal_12 overrides hashCode() to return constant 260, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "codeSnippet": "public class CustomKeyVal_12 {\n    private int id;\n    public CustomKeyVal_12(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 260; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_12, String> map = new HashMap<>();\nCustomKeyVal_12 searchKey = null;\nfor (int k = 1; k <= 6; k++) {\n    CustomKeyVal_12 key = new CustomKeyVal_12(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_1\"."
  },
  {
    "id": "java-quiz-t3-12",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Number?",
    "codeSnippet": "public static void process(List<? extends Number> src, List<? super Number> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Number' into 'src' and read from 'dest' as type 'Number'.",
      "You can read from 'src' as type 'Number' and add elements of type 'Number' (or its subclasses) to 'dest'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Number> is a Producer, so you can safely read from it as type 'Number'. List<? super Number> is a Consumer, so you can safely write/add elements of type 'Number' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-12",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 2200ms. Thread T2 sleeps for 1400ms. If the main thread calls T1.join(740) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(2200); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1400); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(740);\nt2.join();",
    "options": [
      "Approximately 3600ms, as both join calls are executed sequentially.",
      "Approximately 2200ms, since T1 completes last.",
      "Approximately 740ms, as both threads are forced to interrupt.",
      "Approximately 2140ms, because the main thread waits for the 740ms timeout on T1, then blocks until T2 completes its remaining sleep."
    ],
    "correctOptionIndex": 3,
    "explanation": "Main thread waits on t1.join(740) which times out after 740ms. Meanwhile, T2 has been running in the background for 740ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1400 - 740 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 740 + (1400 > 740 ? 1400 - 740 : 0) which equals 2140ms."
  },
  {
    "id": "java-quiz-t5-12",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 32. If you add 33 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(32);\nfor (int j = 0; j < 33; j++) {\n    list.add(j);\n}",
    "options": [
      "64 (capacity doubles when full)",
      "48 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "42 (capacity grows by a fixed step of 10)",
      "33 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 32, the new capacity is 32 + 16 = 48."
  },
  {
    "id": "java-quiz-t6-12",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_12\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_12\");",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"literalVal_12\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-12",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_12' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_12\")\n                   .orElse(fetchFromDb_12());\n}\npublic String fetchFromDb_12() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_12()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-12",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 6 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(6);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Up to 6 concurrent threads inside the custom ForkJoinPool.",
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 6), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-12",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_12' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_12 = new Object();\nmap.put(keyData_12, \"ActiveSession\");\n\nkeyData_12 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_12' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-12",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_12\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_12\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_12\"",
      "\"fallback_val_12\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_12\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_12\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-12",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_12' and the resource's close() method throws an exception 'CloseErr_12', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_12 = new CustomResource()) { // close() throws CloseErr_12\n    throw new RuntimeException(\"TryErr_12\");\n}",
    "options": [
      "The exception containing 'CloseErr_12' is thrown; the 'TryErr_12' exception is discarded.",
      "The RuntimeException containing 'TryErr_12' is thrown; the exception containing 'CloseErr_12' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_12' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-12",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-12",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(1), and then put key 4, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(1);\nmap.put(4, \"Val_\" + 4);",
    "options": [
      "Key 1",
      "Key 2",
      "Key 4",
      "Key 3"
    ],
    "correctOptionIndex": 1,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 1 moves it to the end. The eldest key is the least recently accessed. If cap=3 and we accessed 1, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-12",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(String s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(String s) { System.out.print(\"String\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch.",
      "The print(String s) method executes because String is a more specific type than Object."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'String' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(String s)."
  },
  {
    "id": "java-quiz-t15-12",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[2] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-12",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 22 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 22 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 2,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-12",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 120. Thread 1 calls compareAndSet(120, 130). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(120);\nboolean updated = atomic.compareAndSet(120, 130);",
    "options": [
      "Returns true, resulting in value 130 regardless of expectation.",
      "Returns false, resulting in value 130 due to lock-free CAS loops.",
      "Returns true, resulting in value 130.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (120). If it does (value is 120), it atomically updates it to 130 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-12",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-12",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000012, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000012)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An overflow value of -2146483637 (due to standard 32-bit signed integer overflow).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000012 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-12",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_12().display()'?",
    "codeSnippet": "class ParentService_12 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_12 extends ParentService_12 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Child",
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 0,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_12', the call to log() is resolved to 'ChildService_12.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-13",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 31. If you submit 36 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(31)\n);\nfor (int i = 0; i < 36; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "3 active threads running tasks, with 33 tasks in the queue.",
      "6 active threads running tasks, with 30 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately.",
      "5 active threads running tasks, with 31 tasks in the queue."
    ],
    "correctOptionIndex": 3,
    "explanation": "The lifecycle rules are: 1) First 3 tasks create 3 core threads. 2) Next 31 tasks fill the queue. 3) Remaining tasks (total 36 - 3 - 31 = 2) exceed queue capacity, so 2 new threads are spawned (up to max 6). This results in 5 active threads and 31 queued tasks."
  },
  {
    "id": "java-quiz-t2-13",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKeyVal_13 into a standard HashMap. Class CustomKeyVal_13 overrides hashCode() to return constant 265, but does not override equals(). What happens when you retrieve the key with id = 7?",
    "codeSnippet": "public class CustomKeyVal_13 {\n    private int id;\n    public CustomKeyVal_13(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 265; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_13, String> map = new HashMap<>();\nCustomKeyVal_13 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKeyVal_13 key = new CustomKeyVal_13(k);\n    if (k == 7) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The retrieval succeeds and returns \"Val_7\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 1,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_7\"."
  },
  {
    "id": "java-quiz-t3-13",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Integer?",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Integer' into 'src' and read from 'dest' as type 'Integer'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You can read from 'src' as type 'Integer' and add elements of type 'Integer' (or its subclasses) to 'dest'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so you can safely read from it as type 'Integer'. List<? super Integer> is a Consumer, so you can safely write/add elements of type 'Integer' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-13",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 2300ms. Thread T2 sleeps for 1450ms. If the main thread calls T1.join(760) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(2300); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1450); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(760);\nt2.join();",
    "options": [
      "Approximately 2210ms, because the main thread waits for the 760ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 3750ms, as both join calls are executed sequentially.",
      "Approximately 2300ms, since T1 completes last.",
      "Approximately 760ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 0,
    "explanation": "Main thread waits on t1.join(760) which times out after 760ms. Meanwhile, T2 has been running in the background for 760ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1450 - 760 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 760 + (1450 > 760 ? 1450 - 760 : 0) which equals 2210ms."
  },
  {
    "id": "java-quiz-t5-13",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 34. If you add 35 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(34);\nfor (int j = 0; j < 35; j++) {\n    list.add(j);\n}",
    "options": [
      "68 (capacity doubles when full)",
      "44 (capacity grows by a fixed step of 10)",
      "35 (capacity grows to fit exactly the inserted elements)",
      "51 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 34, the new capacity is 34 + 17 = 51."
  },
  {
    "id": "java-quiz-t6-13",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_13\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_13\");",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"literalVal_13\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-13",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_13' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_13\")\n                   .orElse(fetchFromDb_13());\n}\npublic String fetchFromDb_13() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_13()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-13",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 9 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(9);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Up to 9 concurrent threads inside the custom ForkJoinPool.",
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 9), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-13",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_13' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_13 = new Object();\nmap.put(keyData_13, \"ActiveSession\");\n\nkeyData_13 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_13' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-13",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_13\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_13\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_13\"",
      "\"fallback_val_13\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_13\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_13\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-13",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_13' and the resource's close() method throws an exception 'CloseErr_13', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_13 = new CustomResource()) { // close() throws CloseErr_13\n    throw new RuntimeException(\"TryErr_13\");\n}",
    "options": [
      "The exception containing 'CloseErr_13' is thrown; the 'TryErr_13' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_13' is thrown; the exception containing 'CloseErr_13' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_13' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-13",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-13",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 2",
      "Key 1",
      "Key 5",
      "Key 4"
    ],
    "correctOptionIndex": 1,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 2, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-13",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Integer s) method executes because Integer is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s)."
  },
  {
    "id": "java-quiz-t15-13",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[3] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-13",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 23 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 23 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-13",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 130. Thread 1 calls compareAndSet(135, 140). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(130);\nboolean updated = atomic.compareAndSet(135, 140);",
    "options": [
      "Returns true, resulting in value 140 regardless of expectation.",
      "Returns false, resulting in value 140 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match.",
      "Returns false, resulting in value 130."
    ],
    "correctOptionIndex": 3,
    "explanation": "compareAndSet checks if the current value equals the expected value (135). If it does (value is 130), it atomically updates it to 140 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-13",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-13",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000013, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000013)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator.",
      "An overflow value of -2146483636 (due to standard 32-bit signed integer overflow)."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000013 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-13",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_13().display()'?",
    "codeSnippet": "class ParentService_13 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_13 extends ParentService_13 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Child",
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 0,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_13', the call to log() is resolved to 'ChildService_13.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-14",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 33. If you submit 40 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(33)\n);\nfor (int i = 0; i < 40; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "4 active threads running tasks, with 36 tasks in the queue.",
      "7 active threads running tasks, with 33 tasks in the queue.",
      "6 active threads running tasks, with 34 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "The lifecycle rules are: 1) First 4 tasks create 4 core threads. 2) Next 33 tasks fill the queue. 3) Remaining tasks (total 40 - 4 - 33 = 3) exceed queue capacity, so 3 new threads are spawned (up to max 6). This results in 7 active threads and 33 queued tasks."
  },
  {
    "id": "java-quiz-t2-14",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 8 distinct instances of class CustomKeyVal_14 into a standard HashMap. Class CustomKeyVal_14 overrides hashCode() to return constant 270, but does not override equals(). What happens when you retrieve the key with id = 7?",
    "codeSnippet": "public class CustomKeyVal_14 {\n    private int id;\n    public CustomKeyVal_14(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 270; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_14, String> map = new HashMap<>();\nCustomKeyVal_14 searchKey = null;\nfor (int k = 1; k <= 8; k++) {\n    CustomKeyVal_14 key = new CustomKeyVal_14(k);\n    if (k == 7) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_7\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_7\"."
  },
  {
    "id": "java-quiz-t3-14",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Double?",
    "codeSnippet": "public static void process(List<? extends Double> src, List<? super Double> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Double' into 'src' and read from 'dest' as type 'Double'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You can read from 'src' as type 'Double' and add elements of type 'Double' (or its subclasses) to 'dest'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Double> is a Producer, so you can safely read from it as type 'Double'. List<? super Double> is a Consumer, so you can safely write/add elements of type 'Double' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-14",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 2400ms. Thread T2 sleeps for 1500ms. If the main thread calls T1.join(780) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(2400); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1500); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(780);\nt2.join();",
    "options": [
      "Approximately 3900ms, as both join calls are executed sequentially.",
      "Approximately 2400ms, since T1 completes last.",
      "Approximately 780ms, as both threads are forced to interrupt.",
      "Approximately 2280ms, because the main thread waits for the 780ms timeout on T1, then blocks until T2 completes its remaining sleep."
    ],
    "correctOptionIndex": 3,
    "explanation": "Main thread waits on t1.join(780) which times out after 780ms. Meanwhile, T2 has been running in the background for 780ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1500 - 780 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 780 + (1500 > 780 ? 1500 - 780 : 0) which equals 2280ms."
  },
  {
    "id": "java-quiz-t5-14",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 36. If you add 37 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(36);\nfor (int j = 0; j < 37; j++) {\n    list.add(j);\n}",
    "options": [
      "72 (capacity doubles when full)",
      "46 (capacity grows by a fixed step of 10)",
      "54 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "37 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 2,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 36, the new capacity is 36 + 18 = 54."
  },
  {
    "id": "java-quiz-t6-14",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_14\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_14\");",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"literalVal_14\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-14",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_14' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_14\")\n                   .orElse(fetchFromDb_14());\n}\npublic String fetchFromDb_14() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_14()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-14",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 12 on a machine with 4 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(12);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 4 threads, matching the physical CPU cores.",
      "Up to 12 concurrent threads inside the custom ForkJoinPool.",
      "Up to 3 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 12), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-14",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_14' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_14 = new Object();\nmap.put(keyData_14, \"ActiveSession\");\n\nkeyData_14 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_14' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-14",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_14\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_14\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"fallback_val_14\"",
      "\"err_id_14\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 1,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_14\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_14\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-14",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_14' and the resource's close() method throws an exception 'CloseErr_14', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_14 = new CustomResource()) { // close() throws CloseErr_14\n    throw new RuntimeException(\"TryErr_14\");\n}",
    "options": [
      "The exception containing 'CloseErr_14' is thrown; the 'TryErr_14' exception is discarded.",
      "The RuntimeException containing 'TryErr_14' is thrown; the exception containing 'CloseErr_14' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_14' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-14",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-14",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(3), and then put key 4, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(3);\nmap.put(4, \"Val_\" + 4);",
    "options": [
      "Key 3",
      "Key 4",
      "Key 1",
      "Key 3"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 3 moves it to the end. The eldest key is the least recently accessed. If cap=3 and we accessed 3, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-14",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Double s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Double s) { System.out.print(\"Double\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "The print(Double s) method executes because Double is a more specific type than Object.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Double' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Double s)."
  },
  {
    "id": "java-quiz-t15-14",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[4] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-14",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 24 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 24 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 2,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-14",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 140. Thread 1 calls compareAndSet(140, 150). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(140);\nboolean updated = atomic.compareAndSet(140, 150);",
    "options": [
      "Returns true, resulting in value 150 regardless of expectation.",
      "Returns false, resulting in value 150 due to lock-free CAS loops.",
      "Returns true, resulting in value 150.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (140). If it does (value is 140), it atomically updates it to 150 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-14",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-14",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000014, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000014)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2146483635 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000014 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-14",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_14().display()'?",
    "codeSnippet": "class ParentService_14 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_14 extends ParentService_14 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Child",
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 0,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_14', the call to log() is resolved to 'ChildService_14.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-15",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 35. If you submit 38 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(35)\n);\nfor (int i = 0; i < 38; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "2 active threads running tasks, with 36 tasks in the queue.",
      "5 active threads running tasks, with 33 tasks in the queue.",
      "3 active threads running tasks, with 35 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "The lifecycle rules are: 1) First 2 tasks create 2 core threads. 2) Next 35 tasks fill the queue. 3) Remaining tasks (total 38 - 2 - 35 = 1) exceed queue capacity, so 1 new threads are spawned (up to max 5). This results in 3 active threads and 35 queued tasks."
  },
  {
    "id": "java-quiz-t2-15",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 9 distinct instances of class CustomKeyVal_15 into a standard HashMap. Class CustomKeyVal_15 overrides hashCode() to return constant 275, but does not override equals(). What happens when you retrieve the key with id = 7?",
    "codeSnippet": "public class CustomKeyVal_15 {\n    private int id;\n    public CustomKeyVal_15(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 275; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_15, String> map = new HashMap<>();\nCustomKeyVal_15 searchKey = null;\nfor (int k = 1; k <= 9; k++) {\n    CustomKeyVal_15 key = new CustomKeyVal_15(k);\n    if (k == 7) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket.",
      "The retrieval succeeds and returns \"Val_7\" because object reference identity (==) is checked and succeeds on the exact same key reference."
    ],
    "correctOptionIndex": 3,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_7\"."
  },
  {
    "id": "java-quiz-t3-15",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Float?",
    "codeSnippet": "public static void process(List<? extends Float> src, List<? super Float> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Float' into 'src' and read from 'dest' as type 'Float'.",
      "You can read from 'src' as type 'Float' and add elements of type 'Float' (or its subclasses) to 'dest'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Float> is a Producer, so you can safely read from it as type 'Float'. List<? super Float> is a Consumer, so you can safely write/add elements of type 'Float' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-15",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 2500ms. Thread T2 sleeps for 1550ms. If the main thread calls T1.join(800) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(2500); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1550); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(800);\nt2.join();",
    "options": [
      "Approximately 4050ms, as both join calls are executed sequentially.",
      "Approximately 2500ms, since T1 completes last.",
      "Approximately 2350ms, because the main thread waits for the 800ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 800ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "Main thread waits on t1.join(800) which times out after 800ms. Meanwhile, T2 has been running in the background for 800ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1550 - 800 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 800 + (1550 > 800 ? 1550 - 800 : 0) which equals 2350ms."
  },
  {
    "id": "java-quiz-t5-15",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 38. If you add 39 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(38);\nfor (int j = 0; j < 39; j++) {\n    list.add(j);\n}",
    "options": [
      "57 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "76 (capacity doubles when full)",
      "48 (capacity grows by a fixed step of 10)",
      "39 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 38, the new capacity is 38 + 19 = 57."
  },
  {
    "id": "java-quiz-t6-15",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_15\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_15\");",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"literalVal_15\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-15",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_15' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_15\")\n                   .orElse(fetchFromDb_15());\n}\npublic String fetchFromDb_15() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_15()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-15",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 15 on a machine with 5 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(15);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Up to 15 concurrent threads inside the custom ForkJoinPool.",
      "Only 5 threads, matching the physical CPU cores.",
      "Up to 4 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 15), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-15",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_15' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_15 = new Object();\nmap.put(keyData_15, \"ActiveSession\");\n\nkeyData_15 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_15' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-15",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_15\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_15\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_15\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_val_15\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_15\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_15\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-15",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_15' and the resource's close() method throws an exception 'CloseErr_15', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_15 = new CustomResource()) { // close() throws CloseErr_15\n    throw new RuntimeException(\"TryErr_15\");\n}",
    "options": [
      "The exception containing 'CloseErr_15' is thrown; the 'TryErr_15' exception is discarded.",
      "The RuntimeException containing 'TryErr_15' is thrown; the exception containing 'CloseErr_15' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_15' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-15",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-15",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(4), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(4);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 4",
      "Key 5",
      "Key 4",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 4 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 4, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-15",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Runnable s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Runnable s) { System.out.print(\"Runnable\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "The print(Runnable s) method executes because Runnable is a more specific type than Object.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Runnable' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Runnable s)."
  },
  {
    "id": "java-quiz-t15-15",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[0] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-15",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 25 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 25 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-15",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 150. Thread 1 calls compareAndSet(155, 160). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(150);\nboolean updated = atomic.compareAndSet(155, 160);",
    "options": [
      "Returns true, resulting in value 160 regardless of expectation.",
      "Returns false, resulting in value 160 due to lock-free CAS loops.",
      "Returns false, resulting in value 150.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (155). If it does (value is 150), it atomically updates it to 160 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-15",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-15",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000015, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000015)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An overflow value of -2146483634 (due to standard 32-bit signed integer overflow).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000015 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-15",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_15().display()'?",
    "codeSnippet": "class ParentService_15 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_15 extends ParentService_15 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Child",
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 0,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_15', the call to log() is resolved to 'ChildService_15.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-16",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 37. If you submit 42 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(37)\n);\nfor (int i = 0; i < 42; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "3 active threads running tasks, with 39 tasks in the queue.",
      "5 active threads running tasks, with 37 tasks in the queue.",
      "5 active threads running tasks, with 37 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "The lifecycle rules are: 1) First 3 tasks create 3 core threads. 2) Next 37 tasks fill the queue. 3) Remaining tasks (total 42 - 3 - 37 = 2) exceed queue capacity, so 2 new threads are spawned (up to max 5). This results in 5 active threads and 37 queued tasks."
  },
  {
    "id": "java-quiz-t2-16",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 6 distinct instances of class CustomKeyVal_16 into a standard HashMap. Class CustomKeyVal_16 overrides hashCode() to return constant 280, but does not override equals(). What happens when you retrieve the key with id = 5?",
    "codeSnippet": "public class CustomKeyVal_16 {\n    private int id;\n    public CustomKeyVal_16(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 280; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_16, String> map = new HashMap<>();\nCustomKeyVal_16 searchKey = null;\nfor (int k = 1; k <= 6; k++) {\n    CustomKeyVal_16 key = new CustomKeyVal_16(k);\n    if (k == 5) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The retrieval succeeds and returns \"Val_5\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 1,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_5\"."
  },
  {
    "id": "java-quiz-t3-16",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Number?",
    "codeSnippet": "public static void process(List<? extends Number> src, List<? super Number> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Number' into 'src' and read from 'dest' as type 'Number'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You can read from 'src' as type 'Number' and add elements of type 'Number' (or its subclasses) to 'dest'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Number> is a Producer, so you can safely read from it as type 'Number'. List<? super Number> is a Consumer, so you can safely write/add elements of type 'Number' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-16",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 2600ms. Thread T2 sleeps for 1600ms. If the main thread calls T1.join(820) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(2600); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1600); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(820);\nt2.join();",
    "options": [
      "Approximately 4200ms, as both join calls are executed sequentially.",
      "Approximately 2420ms, because the main thread waits for the 820ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 2600ms, since T1 completes last.",
      "Approximately 820ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "Main thread waits on t1.join(820) which times out after 820ms. Meanwhile, T2 has been running in the background for 820ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1600 - 820 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 820 + (1600 > 820 ? 1600 - 820 : 0) which equals 2420ms."
  },
  {
    "id": "java-quiz-t5-16",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 40. If you add 41 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(40);\nfor (int j = 0; j < 41; j++) {\n    list.add(j);\n}",
    "options": [
      "80 (capacity doubles when full)",
      "50 (capacity grows by a fixed step of 10)",
      "41 (capacity grows to fit exactly the inserted elements)",
      "60 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 40, the new capacity is 40 + 20 = 60."
  },
  {
    "id": "java-quiz-t6-16",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_16\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_16\");",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 2,
    "explanation": "This statement creates two objects: the literal string \"literalVal_16\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-16",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_16' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_16\")\n                   .orElse(fetchFromDb_16());\n}\npublic String fetchFromDb_16() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_16()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-16",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 6 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(6);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 6 concurrent threads inside the custom ForkJoinPool.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 6), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-16",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_16' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_16 = new Object();\nmap.put(keyData_16, \"ActiveSession\");\n\nkeyData_16 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_16' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-16",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_16\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_16\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_16\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_val_16\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_16\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_16\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-16",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_16' and the resource's close() method throws an exception 'CloseErr_16', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_16 = new CustomResource()) { // close() throws CloseErr_16\n    throw new RuntimeException(\"TryErr_16\");\n}",
    "options": [
      "The exception containing 'CloseErr_16' is thrown; the 'TryErr_16' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_16' without suppressing the other.",
      "The RuntimeException containing 'TryErr_16' is thrown; the exception containing 'CloseErr_16' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-16",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A synchronized block or synchronized method.",
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-16",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(2), and then put key 4, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(4, \"Val_\" + 4);",
    "options": [
      "Key 2",
      "Key 4",
      "Key 1",
      "Key 3"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If cap=3 and we accessed 2, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-16",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(String s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(String s) { System.out.print(\"String\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "The print(String s) method executes because String is a more specific type than Object.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'String' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(String s)."
  },
  {
    "id": "java-quiz-t15-16",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[1] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-16",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 26 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 26 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-16",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 160. Thread 1 calls compareAndSet(160, 170). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(160);\nboolean updated = atomic.compareAndSet(160, 170);",
    "options": [
      "Returns true, resulting in value 170 regardless of expectation.",
      "Returns true, resulting in value 170.",
      "Returns false, resulting in value 170 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 1,
    "explanation": "compareAndSet checks if the current value equals the expected value (160). If it does (value is 160), it atomically updates it to 170 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-16",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-16",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000016, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000016)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "An overflow value of -2146483633 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000016 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-16",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_16().display()'?",
    "codeSnippet": "class ParentService_16 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_16 extends ParentService_16 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_16', the call to log() is resolved to 'ChildService_16.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-17",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 7, keepAliveTime = 60s, and a workQueue capacity of 39. If you submit 46 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 7, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(39)\n);\nfor (int i = 0; i < 46; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "4 active threads running tasks, with 42 tasks in the queue.",
      "7 active threads running tasks, with 39 tasks in the queue.",
      "7 active threads running tasks, with 39 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "The lifecycle rules are: 1) First 4 tasks create 4 core threads. 2) Next 39 tasks fill the queue. 3) Remaining tasks (total 46 - 4 - 39 = 3) exceed queue capacity, so 3 new threads are spawned (up to max 7). This results in 7 active threads and 39 queued tasks."
  },
  {
    "id": "java-quiz-t2-17",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKeyVal_17 into a standard HashMap. Class CustomKeyVal_17 overrides hashCode() to return constant 285, but does not override equals(). What happens when you retrieve the key with id = 4?",
    "codeSnippet": "public class CustomKeyVal_17 {\n    private int id;\n    public CustomKeyVal_17(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 285; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_17, String> map = new HashMap<>();\nCustomKeyVal_17 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKeyVal_17 key = new CustomKeyVal_17(k);\n    if (k == 4) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_4\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_4\"."
  },
  {
    "id": "java-quiz-t3-17",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Integer?",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Integer' into 'src' and read from 'dest' as type 'Integer'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting.",
      "You can read from 'src' as type 'Integer' and add elements of type 'Integer' (or its subclasses) to 'dest'."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so you can safely read from it as type 'Integer'. List<? super Integer> is a Consumer, so you can safely write/add elements of type 'Integer' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-17",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 2700ms. Thread T2 sleeps for 1650ms. If the main thread calls T1.join(840) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(2700); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1650); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(840);\nt2.join();",
    "options": [
      "Approximately 4350ms, as both join calls are executed sequentially.",
      "Approximately 2490ms, because the main thread waits for the 840ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 2700ms, since T1 completes last.",
      "Approximately 840ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "Main thread waits on t1.join(840) which times out after 840ms. Meanwhile, T2 has been running in the background for 840ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1650 - 840 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 840 + (1650 > 840 ? 1650 - 840 : 0) which equals 2490ms."
  },
  {
    "id": "java-quiz-t5-17",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 42. If you add 43 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(42);\nfor (int j = 0; j < 43; j++) {\n    list.add(j);\n}",
    "options": [
      "63 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "84 (capacity doubles when full)",
      "52 (capacity grows by a fixed step of 10)",
      "43 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 42, the new capacity is 42 + 21 = 63."
  },
  {
    "id": "java-quiz-t6-17",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_17\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_17\");",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 2,
    "explanation": "This statement creates two objects: the literal string \"literalVal_17\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-17",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_17' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_17\")\n                   .orElse(fetchFromDb_17());\n}\npublic String fetchFromDb_17() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_17()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-17",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 9 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(9);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 9 concurrent threads inside the custom ForkJoinPool.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 9), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-17",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_17' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_17 = new Object();\nmap.put(keyData_17, \"ActiveSession\");\n\nkeyData_17 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 1,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_17' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-17",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_17\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_17\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"fallback_val_17\"",
      "\"err_id_17\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 1,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_17\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_17\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-17",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_17' and the resource's close() method throws an exception 'CloseErr_17', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_17 = new CustomResource()) { // close() throws CloseErr_17\n    throw new RuntimeException(\"TryErr_17\");\n}",
    "options": [
      "The exception containing 'CloseErr_17' is thrown; the 'TryErr_17' exception is discarded.",
      "The RuntimeException containing 'TryErr_17' is thrown; the exception containing 'CloseErr_17' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_17' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-17",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "A synchronized block or synchronized method.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-17",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 2",
      "Key 5",
      "Key 1",
      "Key 4"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 2, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-17",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "The print(Integer s) method executes because Integer is a more specific type than Object.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s)."
  },
  {
    "id": "java-quiz-t15-17",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[2] = 10.5; // Double value",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-17",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 27 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 27 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-17",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 170. Thread 1 calls compareAndSet(175, 180). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(170);\nboolean updated = atomic.compareAndSet(175, 180);",
    "options": [
      "Returns true, resulting in value 180 regardless of expectation.",
      "Returns false, resulting in value 180 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match.",
      "Returns false, resulting in value 170."
    ],
    "correctOptionIndex": 3,
    "explanation": "compareAndSet checks if the current value equals the expected value (175). If it does (value is 170), it atomically updates it to 180 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-17",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-17",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000017, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000017)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2146483632 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000017 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-17",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_17().display()'?",
    "codeSnippet": "class ParentService_17 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_17 extends ParentService_17 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_17', the call to log() is resolved to 'ChildService_17.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-18",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 4, keepAliveTime = 60s, and a workQueue capacity of 41. If you submit 44 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 4, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(41)\n);\nfor (int i = 0; i < 44; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "2 active threads running tasks, with 42 tasks in the queue.",
      "3 active threads running tasks, with 41 tasks in the queue.",
      "4 active threads running tasks, with 40 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "The lifecycle rules are: 1) First 2 tasks create 2 core threads. 2) Next 41 tasks fill the queue. 3) Remaining tasks (total 44 - 2 - 41 = 1) exceed queue capacity, so 1 new threads are spawned (up to max 4). This results in 3 active threads and 41 queued tasks."
  },
  {
    "id": "java-quiz-t2-18",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 8 distinct instances of class CustomKeyVal_18 into a standard HashMap. Class CustomKeyVal_18 overrides hashCode() to return constant 290, but does not override equals(). What happens when you retrieve the key with id = 3?",
    "codeSnippet": "public class CustomKeyVal_18 {\n    private int id;\n    public CustomKeyVal_18(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 290; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_18, String> map = new HashMap<>();\nCustomKeyVal_18 searchKey = null;\nfor (int k = 1; k <= 8; k++) {\n    CustomKeyVal_18 key = new CustomKeyVal_18(k);\n    if (k == 3) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket.",
      "The retrieval succeeds and returns \"Val_3\" because object reference identity (==) is checked and succeeds on the exact same key reference."
    ],
    "correctOptionIndex": 3,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_3\"."
  },
  {
    "id": "java-quiz-t3-18",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Double?",
    "codeSnippet": "public static void process(List<? extends Double> src, List<? super Double> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Double' into 'src' and read from 'dest' as type 'Double'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting.",
      "You can read from 'src' as type 'Double' and add elements of type 'Double' (or its subclasses) to 'dest'."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under PECS: List<? extends Double> is a Producer, so you can safely read from it as type 'Double'. List<? super Double> is a Consumer, so you can safely write/add elements of type 'Double' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-18",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 2800ms. Thread T2 sleeps for 1700ms. If the main thread calls T1.join(860) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(2800); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1700); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(860);\nt2.join();",
    "options": [
      "Approximately 4500ms, as both join calls are executed sequentially.",
      "Approximately 2800ms, since T1 completes last.",
      "Approximately 2560ms, because the main thread waits for the 860ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 860ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 2,
    "explanation": "Main thread waits on t1.join(860) which times out after 860ms. Meanwhile, T2 has been running in the background for 860ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1700 - 860 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 860 + (1700 > 860 ? 1700 - 860 : 0) which equals 2560ms."
  },
  {
    "id": "java-quiz-t5-18",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 44. If you add 45 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(44);\nfor (int j = 0; j < 45; j++) {\n    list.add(j);\n}",
    "options": [
      "88 (capacity doubles when full)",
      "54 (capacity grows by a fixed step of 10)",
      "45 (capacity grows to fit exactly the inserted elements)",
      "66 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 44, the new capacity is 44 + 22 = 66."
  },
  {
    "id": "java-quiz-t6-18",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_18\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_18\");",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"literalVal_18\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-18",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_18' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_18\")\n                   .orElse(fetchFromDb_18());\n}\npublic String fetchFromDb_18() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_18()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-18",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 12 on a machine with 4 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(12);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 4 threads, matching the physical CPU cores.",
      "Up to 3 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations.",
      "Up to 12 concurrent threads inside the custom ForkJoinPool."
    ],
    "correctOptionIndex": 3,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 12), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-18",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_18' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_18 = new Object();\nmap.put(keyData_18, \"ActiveSession\");\n\nkeyData_18 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 1,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_18' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-18",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_18\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_18\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_18\"",
      "\"fallback_val_18\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_18\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_18\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-18",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_18' and the resource's close() method throws an exception 'CloseErr_18', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_18 = new CustomResource()) { // close() throws CloseErr_18\n    throw new RuntimeException(\"TryErr_18\");\n}",
    "options": [
      "The RuntimeException containing 'TryErr_18' is thrown; the exception containing 'CloseErr_18' is added to it as a suppressed exception.",
      "The exception containing 'CloseErr_18' is thrown; the 'TryErr_18' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_18' without suppressing the other."
    ],
    "correctOptionIndex": 0,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-18",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "A synchronized block or synchronized method.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-18",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(1), and then put key 4, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(1);\nmap.put(4, \"Val_\" + 4);",
    "options": [
      "Key 1",
      "Key 2",
      "Key 4",
      "Key 3"
    ],
    "correctOptionIndex": 1,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 1 moves it to the end. The eldest key is the least recently accessed. If cap=3 and we accessed 1, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-18",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Double s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Double s) { System.out.print(\"Double\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch.",
      "The print(Double s) method executes because Double is a more specific type than Object."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Double' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Double s)."
  },
  {
    "id": "java-quiz-t15-18",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[3] = 10.5; // Double value",
    "options": [
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-18",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 28 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 28 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-18",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 180. Thread 1 calls compareAndSet(180, 190). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(180);\nboolean updated = atomic.compareAndSet(180, 190);",
    "options": [
      "Returns true, resulting in value 190 regardless of expectation.",
      "Returns false, resulting in value 190 due to lock-free CAS loops.",
      "Returns true, resulting in value 190.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (180). If it does (value is 180), it atomically updates it to 190 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-18",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-18",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000018, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000018)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "An overflow value of -2146483631 (due to standard 32-bit signed integer overflow).",
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000018 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-18",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_18().display()'?",
    "codeSnippet": "class ParentService_18 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_18 extends ParentService_18 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_18', the call to log() is resolved to 'ChildService_18.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-19",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 43. If you submit 48 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(43)\n);\nfor (int i = 0; i < 48; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "5 active threads running tasks, with 43 tasks in the queue.",
      "3 active threads running tasks, with 45 tasks in the queue.",
      "6 active threads running tasks, with 42 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "The lifecycle rules are: 1) First 3 tasks create 3 core threads. 2) Next 43 tasks fill the queue. 3) Remaining tasks (total 48 - 3 - 43 = 2) exceed queue capacity, so 2 new threads are spawned (up to max 6). This results in 5 active threads and 43 queued tasks."
  },
  {
    "id": "java-quiz-t2-19",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 9 distinct instances of class CustomKeyVal_19 into a standard HashMap. Class CustomKeyVal_19 overrides hashCode() to return constant 295, but does not override equals(). What happens when you retrieve the key with id = 2?",
    "codeSnippet": "public class CustomKeyVal_19 {\n    private int id;\n    public CustomKeyVal_19(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 295; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_19, String> map = new HashMap<>();\nCustomKeyVal_19 searchKey = null;\nfor (int k = 1; k <= 9; k++) {\n    CustomKeyVal_19 key = new CustomKeyVal_19(k);\n    if (k == 2) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_2\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_2\"."
  },
  {
    "id": "java-quiz-t3-19",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Float?",
    "codeSnippet": "public static void process(List<? extends Float> src, List<? super Float> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Float' into 'src' and read from 'dest' as type 'Float'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting.",
      "You can read from 'src' as type 'Float' and add elements of type 'Float' (or its subclasses) to 'dest'."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under PECS: List<? extends Float> is a Producer, so you can safely read from it as type 'Float'. List<? super Float> is a Consumer, so you can safely write/add elements of type 'Float' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-19",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 2900ms. Thread T2 sleeps for 1750ms. If the main thread calls T1.join(880) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(2900); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1750); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(880);\nt2.join();",
    "options": [
      "Approximately 2630ms, because the main thread waits for the 880ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 4650ms, as both join calls are executed sequentially.",
      "Approximately 2900ms, since T1 completes last.",
      "Approximately 880ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 0,
    "explanation": "Main thread waits on t1.join(880) which times out after 880ms. Meanwhile, T2 has been running in the background for 880ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1750 - 880 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 880 + (1750 > 880 ? 1750 - 880 : 0) which equals 2630ms."
  },
  {
    "id": "java-quiz-t5-19",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 46. If you add 47 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(46);\nfor (int j = 0; j < 47; j++) {\n    list.add(j);\n}",
    "options": [
      "92 (capacity doubles when full)",
      "69 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "56 (capacity grows by a fixed step of 10)",
      "47 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 46, the new capacity is 46 + 23 = 69."
  },
  {
    "id": "java-quiz-t6-19",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_19\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_19\");",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"literalVal_19\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-19",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_19' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_19\")\n                   .orElse(fetchFromDb_19());\n}\npublic String fetchFromDb_19() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_19()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-19",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 15 on a machine with 5 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(15);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 5 threads, matching the physical CPU cores.",
      "Up to 4 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations.",
      "Up to 15 concurrent threads inside the custom ForkJoinPool."
    ],
    "correctOptionIndex": 3,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 15), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-19",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_19' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_19 = new Object();\nmap.put(keyData_19, \"ActiveSession\");\n\nkeyData_19 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 1,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_19' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-19",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_19\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_19\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"fallback_val_19\"",
      "\"Secondary_Fallback\"",
      "\"err_id_19\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 0,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_19\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_19\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-19",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_19' and the resource's close() method throws an exception 'CloseErr_19', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_19 = new CustomResource()) { // close() throws CloseErr_19\n    throw new RuntimeException(\"TryErr_19\");\n}",
    "options": [
      "The exception containing 'CloseErr_19' is thrown; the 'TryErr_19' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The RuntimeException containing 'TryErr_19' is thrown; the exception containing 'CloseErr_19' is added to it as a suppressed exception.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_19' without suppressing the other."
    ],
    "correctOptionIndex": 2,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-19",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A synchronized block or synchronized method.",
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-19",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(4), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(4);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 4",
      "Key 1",
      "Key 5",
      "Key 4"
    ],
    "correctOptionIndex": 1,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 4 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 4, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-19",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Runnable s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Runnable s) { System.out.print(\"Runnable\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Runnable s) method executes because Runnable is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Runnable' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Runnable s)."
  },
  {
    "id": "java-quiz-t15-19",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[4] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-19",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 29 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 29 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe."
    ],
    "correctOptionIndex": 3,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-19",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 190. Thread 1 calls compareAndSet(195, 200). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(190);\nboolean updated = atomic.compareAndSet(195, 200);",
    "options": [
      "Returns true, resulting in value 200 regardless of expectation.",
      "Returns false, resulting in value 200 due to lock-free CAS loops.",
      "Returns false, resulting in value 190.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (195). If it does (value is 190), it atomically updates it to 200 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-19",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-19",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000019, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000019)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2146483630 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000019 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-19",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_19().display()'?",
    "codeSnippet": "class ParentService_19 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_19 extends ParentService_19 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures.",
      "Child"
    ],
    "correctOptionIndex": 3,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_19', the call to log() is resolved to 'ChildService_19.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-20",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 45. If you submit 52 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(45)\n);\nfor (int i = 0; i < 52; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "4 active threads running tasks, with 48 tasks in the queue.",
      "6 active threads running tasks, with 46 tasks in the queue.",
      "7 active threads running tasks, with 45 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "The lifecycle rules are: 1) First 4 tasks create 4 core threads. 2) Next 45 tasks fill the queue. 3) Remaining tasks (total 52 - 4 - 45 = 3) exceed queue capacity, so 3 new threads are spawned (up to max 6). This results in 7 active threads and 45 queued tasks."
  },
  {
    "id": "java-quiz-t2-20",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 6 distinct instances of class CustomKeyVal_20 into a standard HashMap. Class CustomKeyVal_20 overrides hashCode() to return constant 300, but does not override equals(). What happens when you retrieve the key with id = 3?",
    "codeSnippet": "public class CustomKeyVal_20 {\n    private int id;\n    public CustomKeyVal_20(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 300; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_20, String> map = new HashMap<>();\nCustomKeyVal_20 searchKey = null;\nfor (int k = 1; k <= 6; k++) {\n    CustomKeyVal_20 key = new CustomKeyVal_20(k);\n    if (k == 3) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The retrieval succeeds and returns \"Val_3\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 1,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_3\"."
  },
  {
    "id": "java-quiz-t3-20",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Number?",
    "codeSnippet": "public static void process(List<? extends Number> src, List<? super Number> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Number' into 'src' and read from 'dest' as type 'Number'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You can read from 'src' as type 'Number' and add elements of type 'Number' (or its subclasses) to 'dest'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Number> is a Producer, so you can safely read from it as type 'Number'. List<? super Number> is a Consumer, so you can safely write/add elements of type 'Number' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-20",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 3000ms. Thread T2 sleeps for 1800ms. If the main thread calls T1.join(900) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(3000); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1800); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(900);\nt2.join();",
    "options": [
      "Approximately 2700ms, because the main thread waits for the 900ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 4800ms, as both join calls are executed sequentially.",
      "Approximately 3000ms, since T1 completes last.",
      "Approximately 900ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 0,
    "explanation": "Main thread waits on t1.join(900) which times out after 900ms. Meanwhile, T2 has been running in the background for 900ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1800 - 900 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 900 + (1800 > 900 ? 1800 - 900 : 0) which equals 2700ms."
  },
  {
    "id": "java-quiz-t5-20",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 48. If you add 49 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(48);\nfor (int j = 0; j < 49; j++) {\n    list.add(j);\n}",
    "options": [
      "96 (capacity doubles when full)",
      "72 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "58 (capacity grows by a fixed step of 10)",
      "49 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 48, the new capacity is 48 + 24 = 72."
  },
  {
    "id": "java-quiz-t6-20",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_20\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_20\");",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 2,
    "explanation": "This statement creates two objects: the literal string \"literalVal_20\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-20",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_20' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_20\")\n                   .orElse(fetchFromDb_20());\n}\npublic String fetchFromDb_20() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_20()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-20",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 6 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(6);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Up to 6 concurrent threads inside the custom ForkJoinPool.",
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 6), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-20",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_20' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_20 = new Object();\nmap.put(keyData_20, \"ActiveSession\");\n\nkeyData_20 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_20' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-20",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_20\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_20\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_20\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_val_20\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_20\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_20\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-20",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_20' and the resource's close() method throws an exception 'CloseErr_20', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_20 = new CustomResource()) { // close() throws CloseErr_20\n    throw new RuntimeException(\"TryErr_20\");\n}",
    "options": [
      "The exception containing 'CloseErr_20' is thrown; the 'TryErr_20' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_20' without suppressing the other.",
      "The RuntimeException containing 'TryErr_20' is thrown; the exception containing 'CloseErr_20' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-20",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A synchronized block or synchronized method.",
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-20",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(3), and then put key 4, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(3);\nmap.put(4, \"Val_\" + 4);",
    "options": [
      "Key 3",
      "Key 4",
      "Key 3",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 3 moves it to the end. The eldest key is the least recently accessed. If cap=3 and we accessed 3, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-20",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(String s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(String s) { System.out.print(\"String\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch.",
      "The print(String s) method executes because String is a more specific type than Object."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'String' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(String s)."
  },
  {
    "id": "java-quiz-t15-20",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[0] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-20",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 30 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 30 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 2,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-20",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 200. Thread 1 calls compareAndSet(200, 210). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(200);\nboolean updated = atomic.compareAndSet(200, 210);",
    "options": [
      "Returns true, resulting in value 210 regardless of expectation.",
      "Returns true, resulting in value 210.",
      "Returns false, resulting in value 210 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 1,
    "explanation": "compareAndSet checks if the current value equals the expected value (200). If it does (value is 200), it atomically updates it to 210 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-20",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-20",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000020, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000020)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator.",
      "An overflow value of -2146483629 (due to standard 32-bit signed integer overflow)."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000020 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-20",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_20().display()'?",
    "codeSnippet": "class ParentService_20 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_20 extends ParentService_20 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_20', the call to log() is resolved to 'ChildService_20.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-21",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 47. If you submit 50 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(47)\n);\nfor (int i = 0; i < 50; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "2 active threads running tasks, with 48 tasks in the queue.",
      "5 active threads running tasks, with 45 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately.",
      "3 active threads running tasks, with 47 tasks in the queue."
    ],
    "correctOptionIndex": 3,
    "explanation": "The lifecycle rules are: 1) First 2 tasks create 2 core threads. 2) Next 47 tasks fill the queue. 3) Remaining tasks (total 50 - 2 - 47 = 1) exceed queue capacity, so 1 new threads are spawned (up to max 5). This results in 3 active threads and 47 queued tasks."
  },
  {
    "id": "java-quiz-t2-21",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKeyVal_21 into a standard HashMap. Class CustomKeyVal_21 overrides hashCode() to return constant 305, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "codeSnippet": "public class CustomKeyVal_21 {\n    private int id;\n    public CustomKeyVal_21(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 305; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_21, String> map = new HashMap<>();\nCustomKeyVal_21 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKeyVal_21 key = new CustomKeyVal_21(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket.",
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference."
    ],
    "correctOptionIndex": 3,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_1\"."
  },
  {
    "id": "java-quiz-t3-21",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Integer?",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Integer' into 'src' and read from 'dest' as type 'Integer'.",
      "You can read from 'src' as type 'Integer' and add elements of type 'Integer' (or its subclasses) to 'dest'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so you can safely read from it as type 'Integer'. List<? super Integer> is a Consumer, so you can safely write/add elements of type 'Integer' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-21",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 3100ms. Thread T2 sleeps for 1850ms. If the main thread calls T1.join(920) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(3100); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1850); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(920);\nt2.join();",
    "options": [
      "Approximately 4950ms, as both join calls are executed sequentially.",
      "Approximately 2770ms, because the main thread waits for the 920ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 3100ms, since T1 completes last.",
      "Approximately 920ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "Main thread waits on t1.join(920) which times out after 920ms. Meanwhile, T2 has been running in the background for 920ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1850 - 920 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 920 + (1850 > 920 ? 1850 - 920 : 0) which equals 2770ms."
  },
  {
    "id": "java-quiz-t5-21",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 50. If you add 51 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(50);\nfor (int j = 0; j < 51; j++) {\n    list.add(j);\n}",
    "options": [
      "100 (capacity doubles when full)",
      "60 (capacity grows by a fixed step of 10)",
      "51 (capacity grows to fit exactly the inserted elements)",
      "75 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))"
    ],
    "correctOptionIndex": 3,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 50, the new capacity is 50 + 25 = 75."
  },
  {
    "id": "java-quiz-t6-21",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_21\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_21\");",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 2,
    "explanation": "This statement creates two objects: the literal string \"literalVal_21\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-21",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_21' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_21\")\n                   .orElse(fetchFromDb_21());\n}\npublic String fetchFromDb_21() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_21()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-21",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 9 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(9);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations.",
      "Up to 9 concurrent threads inside the custom ForkJoinPool."
    ],
    "correctOptionIndex": 3,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 9), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-21",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_21' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_21 = new Object();\nmap.put(keyData_21, \"ActiveSession\");\n\nkeyData_21 = null;\nSystem.gc();",
    "options": [
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 0,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_21' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-21",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_21\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_21\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"fallback_val_21\"",
      "\"Secondary_Fallback\"",
      "\"err_id_21\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 0,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_21\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_21\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-21",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_21' and the resource's close() method throws an exception 'CloseErr_21', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_21 = new CustomResource()) { // close() throws CloseErr_21\n    throw new RuntimeException(\"TryErr_21\");\n}",
    "options": [
      "The exception containing 'CloseErr_21' is thrown; the 'TryErr_21' exception is discarded.",
      "The RuntimeException containing 'TryErr_21' is thrown; the exception containing 'CloseErr_21' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_21' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-21",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation.",
      "A synchronized block or synchronized method."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-21",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 2",
      "Key 5",
      "Key 4",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 2, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-21",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "The print(Integer s) method executes because Integer is a more specific type than Object.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s)."
  },
  {
    "id": "java-quiz-t15-21",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[1] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-21",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 31 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 31 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-21",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 210. Thread 1 calls compareAndSet(215, 220). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(210);\nboolean updated = atomic.compareAndSet(215, 220);",
    "options": [
      "Returns true, resulting in value 220 regardless of expectation.",
      "Returns false, resulting in value 220 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match.",
      "Returns false, resulting in value 210."
    ],
    "correctOptionIndex": 3,
    "explanation": "compareAndSet checks if the current value equals the expected value (215). If it does (value is 210), it atomically updates it to 220 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-21",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-21",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000021, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000021)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An overflow value of -2146483628 (due to standard 32-bit signed integer overflow).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000021 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-21",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_21().display()'?",
    "codeSnippet": "class ParentService_21 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_21 extends ParentService_21 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_21', the call to log() is resolved to 'ChildService_21.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-22",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 5, keepAliveTime = 60s, and a workQueue capacity of 49. If you submit 54 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 5, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(49)\n);\nfor (int i = 0; i < 54; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "3 active threads running tasks, with 51 tasks in the queue.",
      "5 active threads running tasks, with 49 tasks in the queue.",
      "5 active threads running tasks, with 49 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "The lifecycle rules are: 1) First 3 tasks create 3 core threads. 2) Next 49 tasks fill the queue. 3) Remaining tasks (total 54 - 3 - 49 = 2) exceed queue capacity, so 2 new threads are spawned (up to max 5). This results in 5 active threads and 49 queued tasks."
  },
  {
    "id": "java-quiz-t2-22",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 8 distinct instances of class CustomKeyVal_22 into a standard HashMap. Class CustomKeyVal_22 overrides hashCode() to return constant 310, but does not override equals(). What happens when you retrieve the key with id = 7?",
    "codeSnippet": "public class CustomKeyVal_22 {\n    private int id;\n    public CustomKeyVal_22(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 310; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_22, String> map = new HashMap<>();\nCustomKeyVal_22 searchKey = null;\nfor (int k = 1; k <= 8; k++) {\n    CustomKeyVal_22 key = new CustomKeyVal_22(k);\n    if (k == 7) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket.",
      "The retrieval succeeds and returns \"Val_7\" because object reference identity (==) is checked and succeeds on the exact same key reference."
    ],
    "correctOptionIndex": 3,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_7\"."
  },
  {
    "id": "java-quiz-t3-22",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Double?",
    "codeSnippet": "public static void process(List<? extends Double> src, List<? super Double> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Double' into 'src' and read from 'dest' as type 'Double'.",
      "You can read from 'src' as type 'Double' and add elements of type 'Double' (or its subclasses) to 'dest'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under PECS: List<? extends Double> is a Producer, so you can safely read from it as type 'Double'. List<? super Double> is a Consumer, so you can safely write/add elements of type 'Double' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-22",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 3200ms. Thread T2 sleeps for 1900ms. If the main thread calls T1.join(940) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(3200); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1900); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(940);\nt2.join();",
    "options": [
      "Approximately 5100ms, as both join calls are executed sequentially.",
      "Approximately 2840ms, because the main thread waits for the 940ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 3200ms, since T1 completes last.",
      "Approximately 940ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "Main thread waits on t1.join(940) which times out after 940ms. Meanwhile, T2 has been running in the background for 940ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1900 - 940 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 940 + (1900 > 940 ? 1900 - 940 : 0) which equals 2840ms."
  },
  {
    "id": "java-quiz-t5-22",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 52. If you add 53 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(52);\nfor (int j = 0; j < 53; j++) {\n    list.add(j);\n}",
    "options": [
      "78 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "104 (capacity doubles when full)",
      "62 (capacity grows by a fixed step of 10)",
      "53 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 52, the new capacity is 52 + 26 = 78."
  },
  {
    "id": "java-quiz-t6-22",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_22\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_22\");",
    "options": [
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap."
    ],
    "correctOptionIndex": 3,
    "explanation": "This statement creates two objects: the literal string \"literalVal_22\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-22",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_22' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_22\")\n                   .orElse(fetchFromDb_22());\n}\npublic String fetchFromDb_22() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_22()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-22",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 12 on a machine with 4 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(12);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Up to 12 concurrent threads inside the custom ForkJoinPool.",
      "Only 4 threads, matching the physical CPU cores.",
      "Up to 3 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 12), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-22",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_22' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_22 = new Object();\nmap.put(keyData_22, \"ActiveSession\");\n\nkeyData_22 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_22' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-22",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_22\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_22\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"fallback_val_22\"",
      "\"Secondary_Fallback\"",
      "\"err_id_22\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 0,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_22\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_22\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-22",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_22' and the resource's close() method throws an exception 'CloseErr_22', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_22 = new CustomResource()) { // close() throws CloseErr_22\n    throw new RuntimeException(\"TryErr_22\");\n}",
    "options": [
      "The exception containing 'CloseErr_22' is thrown; the 'TryErr_22' exception is discarded.",
      "The RuntimeException containing 'TryErr_22' is thrown; the exception containing 'CloseErr_22' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_22' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-22",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-22",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(2), and then put key 4, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(4, \"Val_\" + 4);",
    "options": [
      "Key 2",
      "Key 4",
      "Key 1",
      "Key 3"
    ],
    "correctOptionIndex": 2,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If cap=3 and we accessed 2, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-22",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Double s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Double s) { System.out.print(\"Double\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Double s) method executes because Double is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Double' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Double s)."
  },
  {
    "id": "java-quiz-t15-22",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[2] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-22",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 32 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 32 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 2,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-22",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 220. Thread 1 calls compareAndSet(220, 230). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(220);\nboolean updated = atomic.compareAndSet(220, 230);",
    "options": [
      "Returns true, resulting in value 230 regardless of expectation.",
      "Returns true, resulting in value 230.",
      "Returns false, resulting in value 230 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 1,
    "explanation": "compareAndSet checks if the current value equals the expected value (220). If it does (value is 220), it atomically updates it to 230 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-22",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 2,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-22",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000022, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000022)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator.",
      "An overflow value of -2146483627 (due to standard 32-bit signed integer overflow)."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000022 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-22",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_22().display()'?",
    "codeSnippet": "class ParentService_22 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_22 extends ParentService_22 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Compilation fails because static methods cannot be inherited.",
      "Child",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 2,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_22', the call to log() is resolved to 'ChildService_22.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-23",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 4, maximumPoolSize = 7, keepAliveTime = 60s, and a workQueue capacity of 51. If you submit 58 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    4, 7, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(51)\n);\nfor (int i = 0; i < 58; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "4 active threads running tasks, with 54 tasks in the queue.",
      "7 active threads running tasks, with 51 tasks in the queue.",
      "7 active threads running tasks, with 51 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "The lifecycle rules are: 1) First 4 tasks create 4 core threads. 2) Next 51 tasks fill the queue. 3) Remaining tasks (total 58 - 4 - 51 = 3) exceed queue capacity, so 3 new threads are spawned (up to max 7). This results in 7 active threads and 51 queued tasks."
  },
  {
    "id": "java-quiz-t2-23",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 9 distinct instances of class CustomKeyVal_23 into a standard HashMap. Class CustomKeyVal_23 overrides hashCode() to return constant 315, but does not override equals(). What happens when you retrieve the key with id = 6?",
    "codeSnippet": "public class CustomKeyVal_23 {\n    private int id;\n    public CustomKeyVal_23(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 315; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_23, String> map = new HashMap<>();\nCustomKeyVal_23 searchKey = null;\nfor (int k = 1; k <= 9; k++) {\n    CustomKeyVal_23 key = new CustomKeyVal_23(k);\n    if (k == 6) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The retrieval succeeds and returns \"Val_6\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 1,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_6\"."
  },
  {
    "id": "java-quiz-t3-23",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Float?",
    "codeSnippet": "public static void process(List<? extends Float> src, List<? super Float> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Float' into 'src' and read from 'dest' as type 'Float'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You can read from 'src' as type 'Float' and add elements of type 'Float' (or its subclasses) to 'dest'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting."
    ],
    "correctOptionIndex": 2,
    "explanation": "Under PECS: List<? extends Float> is a Producer, so you can safely read from it as type 'Float'. List<? super Float> is a Consumer, so you can safely write/add elements of type 'Float' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-23",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 3300ms. Thread T2 sleeps for 1950ms. If the main thread calls T1.join(960) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(3300); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(1950); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(960);\nt2.join();",
    "options": [
      "Approximately 5250ms, as both join calls are executed sequentially.",
      "Approximately 2910ms, because the main thread waits for the 960ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 3300ms, since T1 completes last.",
      "Approximately 960ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "Main thread waits on t1.join(960) which times out after 960ms. Meanwhile, T2 has been running in the background for 960ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (1950 - 960 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 960 + (1950 > 960 ? 1950 - 960 : 0) which equals 2910ms."
  },
  {
    "id": "java-quiz-t5-23",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 54. If you add 55 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(54);\nfor (int j = 0; j < 55; j++) {\n    list.add(j);\n}",
    "options": [
      "81 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "108 (capacity doubles when full)",
      "64 (capacity grows by a fixed step of 10)",
      "55 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 54, the new capacity is 54 + 27 = 81."
  },
  {
    "id": "java-quiz-t6-23",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_23\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_23\");",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"literalVal_23\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-23",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_23' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_23\")\n                   .orElse(fetchFromDb_23());\n}\npublic String fetchFromDb_23() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_23()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-23",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 15 on a machine with 5 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(15);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 5 threads, matching the physical CPU cores.",
      "Up to 4 threads, as the common pool always reserves one core.",
      "Up to 15 concurrent threads inside the custom ForkJoinPool.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 15), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-23",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_23' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_23 = new Object();\nmap.put(keyData_23, \"ActiveSession\");\n\nkeyData_23 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry."
    ],
    "correctOptionIndex": 3,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_23' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-23",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_23\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_23\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_23\"",
      "\"fallback_val_23\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_23\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_23\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-23",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_23' and the resource's close() method throws an exception 'CloseErr_23', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_23 = new CustomResource()) { // close() throws CloseErr_23\n    throw new RuntimeException(\"TryErr_23\");\n}",
    "options": [
      "The exception containing 'CloseErr_23' is thrown; the 'TryErr_23' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_23' without suppressing the other.",
      "The RuntimeException containing 'TryErr_23' is thrown; the exception containing 'CloseErr_23' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-23",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "A synchronized block or synchronized method.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-23",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(4), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(4);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 4",
      "Key 5",
      "Key 4",
      "Key 1"
    ],
    "correctOptionIndex": 3,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 4 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 4, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-23",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Runnable s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Runnable s) { System.out.print(\"Runnable\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Runnable s) method executes because Runnable is a more specific type than Object.",
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 0,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Runnable' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Runnable s)."
  },
  {
    "id": "java-quiz-t15-23",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[3] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-23",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 33 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 33 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-23",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 230. Thread 1 calls compareAndSet(235, 240). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(230);\nboolean updated = atomic.compareAndSet(235, 240);",
    "options": [
      "Returns true, resulting in value 240 regardless of expectation.",
      "Returns false, resulting in value 240 due to lock-free CAS loops.",
      "Returns false, resulting in value 230.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 2,
    "explanation": "compareAndSet checks if the current value equals the expected value (235). If it does (value is 230), it atomically updates it to 240 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-23",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-23",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000023, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000023)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An overflow value of -2146483626 (due to standard 32-bit signed integer overflow).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000023 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-23",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_23().display()'?",
    "codeSnippet": "class ParentService_23 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_23 extends ParentService_23 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_23', the call to log() is resolved to 'ChildService_23.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-24",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 2, maximumPoolSize = 4, keepAliveTime = 60s, and a workQueue capacity of 53. If you submit 56 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    2, 4, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(53)\n);\nfor (int i = 0; i < 56; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "3 active threads running tasks, with 53 tasks in the queue.",
      "2 active threads running tasks, with 54 tasks in the queue.",
      "4 active threads running tasks, with 52 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "The lifecycle rules are: 1) First 2 tasks create 2 core threads. 2) Next 53 tasks fill the queue. 3) Remaining tasks (total 56 - 2 - 53 = 1) exceed queue capacity, so 1 new threads are spawned (up to max 4). This results in 3 active threads and 53 queued tasks."
  },
  {
    "id": "java-quiz-t2-24",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 6 distinct instances of class CustomKeyVal_24 into a standard HashMap. Class CustomKeyVal_24 overrides hashCode() to return constant 320, but does not override equals(). What happens when you retrieve the key with id = 1?",
    "codeSnippet": "public class CustomKeyVal_24 {\n    private int id;\n    public CustomKeyVal_24(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 320; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_24, String> map = new HashMap<>();\nCustomKeyVal_24 searchKey = null;\nfor (int k = 1; k <= 6; k++) {\n    CustomKeyVal_24 key = new CustomKeyVal_24(k);\n    if (k == 1) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_1\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_1\"."
  },
  {
    "id": "java-quiz-t3-24",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Number?",
    "codeSnippet": "public static void process(List<? extends Number> src, List<? super Number> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Number' into 'src' and read from 'dest' as type 'Number'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting.",
      "You can read from 'src' as type 'Number' and add elements of type 'Number' (or its subclasses) to 'dest'."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under PECS: List<? extends Number> is a Producer, so you can safely read from it as type 'Number'. List<? super Number> is a Consumer, so you can safely write/add elements of type 'Number' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-24",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 3400ms. Thread T2 sleeps for 2000ms. If the main thread calls T1.join(980) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(3400); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(2000); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(980);\nt2.join();",
    "options": [
      "Approximately 5400ms, as both join calls are executed sequentially.",
      "Approximately 2980ms, because the main thread waits for the 980ms timeout on T1, then blocks until T2 completes its remaining sleep.",
      "Approximately 3400ms, since T1 completes last.",
      "Approximately 980ms, as both threads are forced to interrupt."
    ],
    "correctOptionIndex": 1,
    "explanation": "Main thread waits on t1.join(980) which times out after 980ms. Meanwhile, T2 has been running in the background for 980ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (2000 - 980 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 980 + (2000 > 980 ? 2000 - 980 : 0) which equals 2980ms."
  },
  {
    "id": "java-quiz-t5-24",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 56. If you add 57 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(56);\nfor (int j = 0; j < 57; j++) {\n    list.add(j);\n}",
    "options": [
      "84 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "112 (capacity doubles when full)",
      "66 (capacity grows by a fixed step of 10)",
      "57 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 0,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 56, the new capacity is 56 + 28 = 84."
  },
  {
    "id": "java-quiz-t6-24",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_24\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_24\");",
    "options": [
      "One object: on the heap only.",
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 1,
    "explanation": "This statement creates two objects: the literal string \"literalVal_24\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-24",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_24' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_24\")\n                   .orElse(fetchFromDb_24());\n}\npublic String fetchFromDb_24() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value.",
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_24()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-24",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 6 on a machine with 2 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(6);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Only 2 threads, matching the physical CPU cores.",
      "Up to 1 threads, as the common pool always reserves one core.",
      "Up to 6 concurrent threads inside the custom ForkJoinPool.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 2,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 6), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-24",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_24' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_24 = new Object();\nmap.put(keyData_24, \"ActiveSession\");\n\nkeyData_24 = null;\nSystem.gc();",
    "options": [
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 2,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_24' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-24",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_24\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_24\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_24\"",
      "\"fallback_val_24\"",
      "\"NormalSecondary_Fallback\""
    ],
    "correctOptionIndex": 2,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_24\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_24\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-24",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_24' and the resource's close() method throws an exception 'CloseErr_24', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_24 = new CustomResource()) { // close() throws CloseErr_24\n    throw new RuntimeException(\"TryErr_24\");\n}",
    "options": [
      "The exception containing 'CloseErr_24' is thrown; the 'TryErr_24' exception is discarded.",
      "The RuntimeException containing 'TryErr_24' is thrown; the exception containing 'CloseErr_24' is added to it as a suppressed exception.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_24' without suppressing the other."
    ],
    "correctOptionIndex": 1,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-24",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A ReentrantLock block.",
      "A synchronized block or synchronized method.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-24",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 3. If you insert keys 1 to 3, call map.get(1), and then put key 4, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(3, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 3;\n    }\n};\nfor (int k = 1; k <= 3; k++) map.put(k, \"Val_\" + k);\nmap.get(1);\nmap.put(4, \"Val_\" + 4);",
    "options": [
      "Key 2",
      "Key 1",
      "Key 4",
      "Key 3"
    ],
    "correctOptionIndex": 0,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 1 moves it to the end. The eldest key is the least recently accessed. If cap=3 and we accessed 1, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-24",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(String s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(String s) { System.out.print(\"String\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "The print(String s) method executes because String is a more specific type than Object.",
      "A NullPointerException is thrown at runtime during method dispatch."
    ],
    "correctOptionIndex": 2,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'String' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(String s)."
  },
  {
    "id": "java-quiz-t15-24",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[4] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-24",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 34 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 34 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 1,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-24",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 240. Thread 1 calls compareAndSet(240, 250). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(240);\nboolean updated = atomic.compareAndSet(240, 250);",
    "options": [
      "Returns true, resulting in value 250 regardless of expectation.",
      "Returns true, resulting in value 250.",
      "Returns false, resulting in value 250 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 1,
    "explanation": "compareAndSet checks if the current value equals the expected value (240). If it does (value is 240), it atomically updates it to 250 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-24",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time.",
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-24",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000024, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000024)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2146483625 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000024 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-24",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_24().display()'?",
    "codeSnippet": "class ParentService_24 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_24 extends ParentService_24 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_24', the call to log() is resolved to 'ChildService_24.log()', printing 'Child'."
  },
  {
    "id": "java-quiz-t1-25",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "A ThreadPoolExecutor is initialized with corePoolSize = 3, maximumPoolSize = 6, keepAliveTime = 60s, and a workQueue capacity of 55. If you submit 60 tasks concurrently with no delay, what is the state of the pool?",
    "codeSnippet": "ThreadPoolExecutor executor = new ThreadPoolExecutor(\n    3, 6, 60, TimeUnit.SECONDS,\n    new ArrayBlockingQueue<>(55)\n);\nfor (int i = 0; i < 60; i++) {\n    executor.submit(() -> {\n        try { Thread.sleep(10000); } catch (InterruptedException e) {}\n    });\n}",
    "options": [
      "3 active threads running tasks, with 57 tasks in the queue.",
      "6 active threads running tasks, with 54 tasks in the queue.",
      "5 active threads running tasks, with 55 tasks in the queue.",
      "The task execution throws a RejectedExecutionException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "The lifecycle rules are: 1) First 3 tasks create 3 core threads. 2) Next 55 tasks fill the queue. 3) Remaining tasks (total 60 - 3 - 55 = 2) exceed queue capacity, so 2 new threads are spawned (up to max 6). This results in 5 active threads and 55 queued tasks."
  },
  {
    "id": "java-quiz-t2-25",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "You insert 7 distinct instances of class CustomKeyVal_25 into a standard HashMap. Class CustomKeyVal_25 overrides hashCode() to return constant 325, but does not override equals(). What happens when you retrieve the key with id = 5?",
    "codeSnippet": "public class CustomKeyVal_25 {\n    private int id;\n    public CustomKeyVal_25(int id) { this.id = id; }\n    @Override\n    public int hashCode() { return 325; }\n    // No equals() implementation\n}\n// Insertion:\nMap<CustomKeyVal_25, String> map = new HashMap<>();\nCustomKeyVal_25 searchKey = null;\nfor (int k = 1; k <= 7; k++) {\n    CustomKeyVal_25 key = new CustomKeyVal_25(k);\n    if (k == 5) searchKey = key;\n    map.put(key, \"Val_\" + k);\n}\n// Retrieval:\nString result = map.get(searchKey);",
    "options": [
      "The retrieval returns null because equals() is not implemented.",
      "The HashMap throws a NullPointerException because the hash value is constant.",
      "The retrieval succeeds and returns \"Val_5\" because object reference identity (==) is checked and succeeds on the exact same key reference.",
      "The retrieval returns the value of the last inserted element in the bucket."
    ],
    "correctOptionIndex": 2,
    "explanation": "Since the searchKey reference is the exact same reference stored in the map, HashMap's lookup will locate the entry because it checks object identity (k == entry.key) first before calling equals(). Thus, it succeeds and returns \"Val_5\"."
  },
  {
    "id": "java-quiz-t3-25",
    "topic": "Generics",
    "difficulty": "medium",
    "questionText": "According to the Producer-Extends, Consumer-Super (PECS) rule, which operations are compile-time valid inside the utility method below parameterized with type Integer?",
    "codeSnippet": "public static void process(List<? extends Integer> src, List<? super Integer> dest) {\n    // Inside method body:\n    ???\n}",
    "options": [
      "You can write elements of type 'Integer' into 'src' and read from 'dest' as type 'Integer'.",
      "You can add new objects of type Object to 'dest' and write elements of type Double into 'src'.",
      "You cannot read from 'src' or write to 'dest' without explicit type casting.",
      "You can read from 'src' as type 'Integer' and add elements of type 'Integer' (or its subclasses) to 'dest'."
    ],
    "correctOptionIndex": 3,
    "explanation": "Under PECS: List<? extends Integer> is a Producer, so you can safely read from it as type 'Integer'. List<? super Integer> is a Consumer, so you can safely write/add elements of type 'Integer' (or its subtypes) into it."
  },
  {
    "id": "java-quiz-t4-25",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "Two threads T1 and T2 run concurrently. Thread T1 sleeps for 3500ms. Thread T2 sleeps for 2050ms. If the main thread calls T1.join(1000) followed immediately by T2.join(), what is the approximate wait duration?",
    "codeSnippet": "Thread t1 = new Thread(() -> {\n    try { Thread.sleep(3500); } catch (InterruptedException e) {}\n});\nThread t2 = new Thread(() -> {\n    try { Thread.sleep(2050); } catch (InterruptedException e) {}\n});\nt1.start(); t2.start();\n// Main Thread calls:\nt1.join(1000);\nt2.join();",
    "options": [
      "Approximately 5550ms, as both join calls are executed sequentially.",
      "Approximately 3500ms, since T1 completes last.",
      "Approximately 1000ms, as both threads are forced to interrupt.",
      "Approximately 3050ms, because the main thread waits for the 1000ms timeout on T1, then blocks until T2 completes its remaining sleep."
    ],
    "correctOptionIndex": 3,
    "explanation": "Main thread waits on t1.join(1000) which times out after 1000ms. Meanwhile, T2 has been running in the background for 1000ms. When main thread calls t2.join(), it blocks for the remainder of T2's sleep (2050 - 1000 if delay2 > timeout, or 0 if completed). Thus the total elapsed wait is approximately 1000 + (2050 > 1000 ? 2050 - 1000 : 0) which equals 3050ms."
  },
  {
    "id": "java-quiz-t5-25",
    "topic": "Collections & Lists",
    "difficulty": "easy",
    "questionText": "An ArrayList is initialized with an initial capacity of 58. If you add 59 elements sequentially to the list, what is the internal array capacity immediately after the expansion?",
    "codeSnippet": "List<Integer> list = new ArrayList<>(58);\nfor (int j = 0; j < 59; j++) {\n    list.add(j);\n}",
    "options": [
      "116 (capacity doubles when full)",
      "87 (capacity grows by 50% using the formula: oldCapacity + (oldCapacity >> 1))",
      "68 (capacity grows by a fixed step of 10)",
      "59 (capacity grows to fit exactly the inserted elements)"
    ],
    "correctOptionIndex": 1,
    "explanation": "In JDK ArrayList, capacity expansion is calculated using the formula: newCapacity = oldCapacity + (oldCapacity >> 1), which grows the array size by approximately 50%. Starting with 58, the new capacity is 58 + 29 = 87."
  },
  {
    "id": "java-quiz-t6-25",
    "topic": "Strings & String Pool",
    "difficulty": "medium",
    "questionText": "How many objects are created in memory when the statement below executes, assuming \"literalVal_25\" is NOT already present in the String Constant Pool?",
    "codeSnippet": "String s = new String(\"literalVal_25\");",
    "options": [
      "Two objects: one literal in the String Constant Pool and one new String object on the heap.",
      "One object: on the heap only.",
      "One object: in the String Constant Pool only.",
      "Zero objects: it only creates a stack reference."
    ],
    "correctOptionIndex": 0,
    "explanation": "This statement creates two objects: the literal string \"literalVal_25\" is stored in the String Constant Pool (if not already present), and a new String object is created on the heap, wrapping the character array reference from the pool."
  },
  {
    "id": "java-quiz-t7-25",
    "topic": "Optional API",
    "difficulty": "medium",
    "questionText": "In the code snippet below under normal execution, how many times is the method 'fetchFromDb_25' evaluated?",
    "codeSnippet": "public String getData() {\n    return Optional.of(\"val_key_25\")\n                   .orElse(fetchFromDb_25());\n}\npublic String fetchFromDb_25() {\n    System.out.println(\"DB accessed\");\n    return \"default\";\n}",
    "options": [
      "0 times, because the Optional contains a non-null value and orElse() is evaluated lazily.",
      "2 times, once for checking and once for returning.",
      "It throws a NullPointerException at runtime.",
      "Exactly 1 time, because the argument to orElse() is evaluated eagerly even if the Optional contains a value."
    ],
    "correctOptionIndex": 3,
    "explanation": "In Java, orElse(T other) evaluates its argument eagerly. Since 'fetchFromDb_25()' is passed directly as a parameter, the method is invoked and evaluated before orElse() resolves, even if the Optional is not empty. Use orElseGet(Supplier) for lazy evaluation."
  },
  {
    "id": "java-quiz-t8-25",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "You submit a parallel stream task inside a custom ForkJoinPool configured with parallelism 9 on a machine with 3 CPU cores. What is the maximum number of threads that can process the stream concurrently?",
    "codeSnippet": "ForkJoinPool customPool = new ForkJoinPool(9);\ncustomPool.submit(() -> {\n    IntStream.range(0, 1000).parallel().forEach(x -> {\n        // Compute intensive task\n    });\n}).get();",
    "options": [
      "Up to 9 concurrent threads inside the custom ForkJoinPool.",
      "Only 3 threads, matching the physical CPU cores.",
      "Up to 2 threads, as the common pool always reserves one core.",
      "1 thread, because parallel streams ignore custom ForkJoinPool configurations."
    ],
    "correctOptionIndex": 0,
    "explanation": "Parallel streams execute inside the ForkJoinPool of the thread that initiated them. If submitted inside a custom ForkJoinPool, the stream will use that pool's worker threads (up to its parallelism level of 9), overriding the default CommonPool behavior."
  },
  {
    "id": "java-quiz-t9-25",
    "topic": "Memory Management & GC",
    "difficulty": "medium",
    "questionText": "A WeakHashMap is populated as shown below. If you set 'keyData_25' to null and trigger GC, what happens to the map size?",
    "codeSnippet": "Map<Object, String> map = new WeakHashMap<>();\nObject keyData_25 = new Object();\nmap.put(keyData_25, \"ActiveSession\");\n\nkeyData_25 = null;\nSystem.gc();",
    "options": [
      "The map size becomes 0 because WeakHashMap references keys weakly, allowing GC to collect the key and automatically clean up the entry.",
      "The map size remains 1 because the value 'ActiveSession' retains a strong reference to the map entry.",
      "The map throws a NullPointerException during garbage collection.",
      "The key is collected but map.size() still returns 1 until a get() call is made."
    ],
    "correctOptionIndex": 0,
    "explanation": "WeakHashMap uses WeakReference wrapper classes for its keys. Once the strong reference 'keyData_25' is set to null, the key becomes eligible for GC. After GC sweeps the key, WeakHashMap cleans up the corresponding entry from its table."
  },
  {
    "id": "java-quiz-t10-25",
    "topic": "Multithreading & Concurrency",
    "difficulty": "hard",
    "questionText": "Predict the output printed to the console when the CompletableFuture pipeline executes.",
    "codeSnippet": "CompletableFuture.supplyAsync(() -> {\n    if (true) throw new RuntimeException(\"err_id_25\");\n    return \"Normal\";\n})\n.handle((res, ex) -> {\n    return ex != null ? \"fallback_val_25\" : res;\n})\n.exceptionally(ex -> {\n    return \"Secondary_Fallback\";\n})\n.thenAccept(System.out::print);",
    "options": [
      "\"Secondary_Fallback\"",
      "\"err_id_25\"",
      "\"NormalSecondary_Fallback\"",
      "\"fallback_val_25\""
    ],
    "correctOptionIndex": 3,
    "explanation": "The supplyAsync stage throws a RuntimeException containing \"err_id_25\". The handle() block captures this exception (ex is non-null) and returns \"fallback_val_25\", completing the stage normally. The downstream exceptionally() stage is skipped because no exception remains in the pipeline."
  },
  {
    "id": "java-quiz-t11-25",
    "topic": "Exception Handling",
    "difficulty": "medium",
    "questionText": "Inside a try-with-resources statement, if the try block throws an exception 'TryErr_25' and the resource's close() method throws an exception 'CloseErr_25', which exception propagates and how is the other retrieved?",
    "codeSnippet": "try (CustomResource Res_25 = new CustomResource()) { // close() throws CloseErr_25\n    throw new RuntimeException(\"TryErr_25\");\n}",
    "options": [
      "The exception containing 'CloseErr_25' is thrown; the 'TryErr_25' exception is discarded.",
      "Both exceptions are propagated concurrently in a MultiException.",
      "The exception from close() overrides the try exception, throwing 'CloseErr_25' without suppressing the other.",
      "The RuntimeException containing 'TryErr_25' is thrown; the exception containing 'CloseErr_25' is added to it as a suppressed exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "In try-with-resources, if both the try block and close() throw exceptions, the exception from the try block propagates. The exception from close() is suppressed and attached to the main exception, retrieveable using getSuppressed()."
  },
  {
    "id": "java-quiz-t12-25",
    "topic": "Virtual Threads",
    "difficulty": "hard",
    "questionText": "You are using Virtual Threads in Java 21. Which locking mechanism can cause the virtual thread to PIN its carrier platform thread during a blocking database/IO operation?",
    "codeSnippet": "Runnable task = () -> {\n    // Under which lock construct will carrier thread pinning occur?\n    ??? {\n        databaseService.fetchData(); // Blocks on network\n    }\n};\nThread.ofVirtual().start(task);",
    "options": [
      "A synchronized block or synchronized method.",
      "A ReentrantLock block.",
      "A Semaphore permit acquisition.",
      "An AtomicInteger loop operation."
    ],
    "correctOptionIndex": 0,
    "explanation": "In Java 21, virtual threads are pinned to their carrier platform thread when running inside a synchronized block or synchronized method. When pinned, blocking on IO also blocks the carrier thread. Replacing it with ReentrantLock avoids this."
  },
  {
    "id": "java-quiz-t13-25",
    "topic": "Collections & Internals",
    "difficulty": "hard",
    "questionText": "A LinkedHashMap is configured with accessOrder = true and max capacity = 4. If you insert keys 1 to 4, call map.get(2), and then put key 5, which key is evicted by removeEldestEntry?",
    "codeSnippet": "LinkedHashMap<Integer, String> map = new LinkedHashMap<>(4, 0.75f, true) {\n    @Override\n    protected boolean removeEldestEntry(Map.Entry eldest) {\n        return size() > 4;\n    }\n};\nfor (int k = 1; k <= 4; k++) map.put(k, \"Val_\" + k);\nmap.get(2);\nmap.put(5, \"Val_\" + 5);",
    "options": [
      "Key 2",
      "Key 1",
      "Key 5",
      "Key 4"
    ],
    "correctOptionIndex": 1,
    "explanation": "With accessOrder=true, LinkedHashMap orders entries by access (least recently accessed first). Accessing key 2 moves it to the end. The eldest key is the least recently accessed. If cap=4 and we accessed 2, the remaining oldest key (either 1 or 2) is evicted."
  },
  {
    "id": "java-quiz-t14-25",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "If a class defines overloaded methods print(Object o) and print(Integer s), which method executes when print(null) is called?",
    "codeSnippet": "public class OverloadDemo {\n    public void print(Object o) { System.out.print(\"Object\"); }\n    public void print(Integer s) { System.out.print(\"Integer\"); }\n    \n    public static void main(String[] args) {\n        new OverloadDemo().print(null);\n    }\n}",
    "options": [
      "The print(Object o) method executes because null is treated as general Object first.",
      "A compile-time error occurs due to method signature ambiguity.",
      "A NullPointerException is thrown at runtime during method dispatch.",
      "The print(Integer s) method executes because Integer is a more specific type than Object."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java resolves overloaded methods at compile-time by choosing the most specific method compatible with the arguments. Since 'Integer' is a subclass of 'Object', it is more specific, so the compiler binds the call to print(Integer s)."
  },
  {
    "id": "java-quiz-t15-25",
    "topic": "Java Basics",
    "difficulty": "medium",
    "questionText": "What is the runtime result of executing the code below containing array assignments?",
    "codeSnippet": "Number[] numbers = new Integer[5];\nnumbers[0] = 10.5; // Double value",
    "options": [
      "The double value 10.5 is stored in the array without issue.",
      "The compiler flags this as a compile-time error.",
      "The double value is truncated to the integer 10 and stored.",
      "An ArrayStoreException is thrown because the runtime type of the array is Integer[], which cannot store Double values."
    ],
    "correctOptionIndex": 3,
    "explanation": "Java arrays are covariant (`Integer[]` is a subtype of `Number[]`), which is checked at compile-time. However, the array retains its runtime type (Integer[]). Writing a Double (10.5) to it triggers an ArrayStoreException at runtime."
  },
  {
    "id": "java-quiz-t16-25",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "If a single shared instance of SimpleDateFormat is accessed concurrently by 35 threads, what runtime issue can occur?",
    "codeSnippet": "// Shared instance accessed by 35 threads\nprivate static final SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");",
    "options": [
      "It will output corrupted/incorrect date strings or throw NumberFormatException because SimpleDateFormat is not thread-safe.",
      "It will cause a thread deadlock inside the JVM date formatting library.",
      "It works perfectly because formatting dates is a thread-safe read-only operation.",
      "It will trigger an OutOfMemoryError in the heap space."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleDateFormat maintains internal state in an inherited Calendar field. Concurrent modification of this state by multiple threads leads to race conditions, producing corrupted formatted dates or throwing formatting exceptions."
  },
  {
    "id": "java-quiz-t17-25",
    "topic": "Multithreading & Concurrency",
    "difficulty": "medium",
    "questionText": "An AtomicInteger is initialized to 250. Thread 1 calls compareAndSet(255, 260). What is the return value of compareAndSet and the resulting value of the AtomicInteger?",
    "codeSnippet": "AtomicInteger atomic = new AtomicInteger(250);\nboolean updated = atomic.compareAndSet(255, 260);",
    "options": [
      "Returns false, resulting in value 250.",
      "Returns true, resulting in value 260 regardless of expectation.",
      "Returns false, resulting in value 260 due to lock-free CAS loops.",
      "Throws an ArithmeticException because expected value doesn't match."
    ],
    "correctOptionIndex": 0,
    "explanation": "compareAndSet checks if the current value equals the expected value (255). If it does (value is 250), it atomically updates it to 260 and returns true. Otherwise, it leaves the value unchanged and returns false."
  },
  {
    "id": "java-quiz-t18-25",
    "topic": "JVM & Classloading",
    "difficulty": "hard",
    "questionText": "Under what condition is NoClassDefFoundError thrown instead of ClassNotFoundException?",
    "codeSnippet": "// Scenario: Class A references Class B\nClassA obj = new ClassA(); // Throws NoClassDefFoundError for ClassB",
    "options": [
      "When Class B was present during compilation, but its class file cannot be located or loaded by the JVM at runtime during Class A's initialization.",
      "When Class.forName() is called with an invalid class package string name.",
      "When ClassLoader.loadClass() fails to resolve a class on the classpath dynamically.",
      "When there is an import statement referencing a non-existent class at compile time."
    ],
    "correctOptionIndex": 0,
    "explanation": "ClassNotFoundException is a checked exception thrown when class lookup by name string fails. NoClassDefFoundError is an Error thrown when the JVM is executing compiled bytecode that references another class, but that class cannot be found in the runtime classpath."
  },
  {
    "id": "java-quiz-t19-25",
    "topic": "Streams API",
    "difficulty": "medium",
    "questionText": "If you run the stream operation below using Integer.MAX_VALUE and 1000025, what is printed to the console?",
    "codeSnippet": "int result = Stream.of(Integer.MAX_VALUE, 1000025)\n                   .reduce(0, Integer::sum);\nSystem.out.println(result);",
    "options": [
      "The mathematically correct sum (promoted automatically to a 64-bit long).",
      "An ArithmeticException is thrown indicating integer overflow.",
      "An overflow value of -2146483624 (due to standard 32-bit signed integer overflow).",
      "A compile-time error occurs because reduce requires an accumulator."
    ],
    "correctOptionIndex": 2,
    "explanation": "In Java, arithmetic operations on 32-bit integers wrap around silently when they overflow. Stream reduce does not perform automatic type promotion, so adding 1000025 to Integer.MAX_VALUE overflows and wraps into negative values."
  },
  {
    "id": "java-quiz-t20-25",
    "topic": "Object-Oriented Programming",
    "difficulty": "medium",
    "questionText": "Consider the static methods in the classes below. What is printed when executing 'new ChildService_25().display()'?",
    "codeSnippet": "class ParentService_25 {\n    public static void log() { System.out.print(\"Parent\"); }\n}\nclass ChildService_25 extends ParentService_25 {\n    public static void log() { System.out.print(\"Child\"); }\n    public void display() { log(); }\n}",
    "options": [
      "Parent",
      "Child",
      "Compilation fails because static methods cannot be inherited.",
      "Throws a RuntimeException due to conflicting signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "Static methods undergo 'method hiding' rather than method overriding. Static method calls are bound at compile time based on the class context. Inside the instance method display() of 'ChildService_25', the call to log() is resolved to 'ChildService_25.log()', printing 'Child'."
  }
];
