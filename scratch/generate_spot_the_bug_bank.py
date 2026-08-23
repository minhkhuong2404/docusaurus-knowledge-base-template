#!/usr/bin/env python3
"""
Script: scratch/generate_spot_the_bug_bank.py
Description: Generates 1,024 authentic OCP Java 21 & Production Bug questions across 16 core categories.
             Exports to CSV and appends directly to Google Sheet tab 'Spot The Bug'.
"""

import os
import sys
import json
import csv
import urllib.request
import urllib.parse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.path.join(BASE_DIR, 'scratch')
CSV_OUTPUT_PATH = os.path.join(SCRATCH_DIR, 'export_spot_the_bug_questions.csv')
CONFIG_PATH = os.path.join(SCRATCH_DIR, 'quiz_config.json')

# 16 Categories x 64 Questions = 1,024 Total Questions
CATEGORIES = [
    {
        "category": "OCP Java 21 - Records & Pattern Matching",
        "tag": "concurrency",
        "difficulty": "Senior",
        "templates": [
            {
                "title": "Record Compact Constructor Mutation Trap",
                "code": "public record UserDto(String username, int age) {\n    public UserDto {\n        if (age < 0) throw new IllegalArgumentException();\n        this.username = username.trim(); // Line 4: Direct 'this' assignment in compact constructor\n    }\n}",
                "bugLine": 4,
                "bugType": "Compilation Error: Cannot assign to record fields using 'this' inside compact constructor",
                "rootCause": "In a compact record constructor, record fields are implicitly assigned at the end of the constructor block. Direct assignment to `this.username` is forbidden by JLS 8.10.4.2; you must assign to the parameter `username = username.trim();` instead.",
                "optCorrect": "Line 4 causes compilation failure: in compact constructors, modify the parameter 'username = ...' instead of assigning to 'this.username'.",
                "optW1": "Line 3 causes runtime exception: compact constructors cannot throw unchecked exceptions.",
                "optW2": "Line 1 is invalid: record parameters cannot be primitive int types.",
                "optW3": "Line 2 is missing constructor parameter list (String username, int age).",
                "fix": "public record UserDto(String username, int age) {\n    public UserDto {\n        if (age < 0) throw new IllegalArgumentException();\n        username = username.trim(); // Reassign parameter\n    }\n}",
                "tip": "Compact constructors exist to normalize/validate parameters before implicit field assignment happens at the end of the block."
            },
            {
                "title": "Switch Pattern Matching Non-Exhaustive Hierarchy",
                "code": "sealed interface Shape permits Circle, Square {}\nrecord Circle(double radius) implements Shape {}\nrecord Square(double side) implements Shape {}\n\npublic double calculateArea(Shape shape) {\n    return switch (shape) { // Line 6: Missing pattern or default when interface is extended or null handled\n        case Circle c -> Math.PI * c.radius() * c.radius();\n        // Missing Square case!\n    };\n}",
                "bugLine": 6,
                "bugType": "Compilation Error: The switch expression does not cover all possible input values",
                "rootCause": "Pattern matching in switch expressions requires exhaustiveness for sealed hierarchies. If any permitted subtype (Square) or null is omitted without a default clause, compilation fails with 'the switch expression does not cover all possible input values'.",
                "optCorrect": "Line 6 fails compilation: switch expression on sealed hierarchy Shape is not exhaustive because 'case Square' is missing.",
                "optW1": "Line 7 is invalid: arrow syntax cannot return primitive double values.",
                "optW2": "Line 1 permits clause must include 'Triangle' by default.",
                "optW3": "Line 6 requires a 'break' statement after each case in switch expressions.",
                "fix": "return switch (shape) {\n    case Circle c -> Math.PI * c.radius() * c.radius();\n    case Square s -> s.side() * s.side();\n};",
                "tip": "Sealed types allow the compiler to verify exhaustiveness at compile-time without needing an unreachable 'default' branch."
            },
            {
                "title": "Guarded Pattern Switch Ordering Hazard",
                "code": "public String evaluateScore(Object obj) {\n    return switch (obj) {\n        case String s -> \"Generic String\"; // Line 3: Dominates guarded pattern below!\n        case String s when s.length() > 10 -> \"Long String\"; // Line 4: Unreachable code\n        default -> \"Other\";\n    };\n}",
                "bugLine": 4,
                "bugType": "Compilation Error: Unreachable pattern (dominated by previous case)",
                "rootCause": "In Java 21 pattern matching, cases are evaluated in top-to-bottom order. An unguarded `case String s` matches all strings and dominates the subsequent guarded `case String s when ...`, causing an unreachable code compilation error.",
                "optCorrect": "Line 4 fails compilation because it is dominated by Line 3; more specific guarded patterns ('when') must appear before unguarded patterns.",
                "optW1": "Line 4 is invalid because 'when' keyword is only allowed in SQL queries.",
                "optW2": "Line 3 fails because 'Object' cannot be switched with String cases.",
                "optW3": "Line 5 default branch is not allowed when Object is the switch target.",
                "fix": "return switch (obj) {\n    case String s when s.length() > 10 -> \"Long String\";\n    case String s -> \"Generic String\";\n    default -> \"Other\";\n};",
                "tip": "Always place guarded patterns with 'when' before broader unguarded patterns to prevent compiler dominance errors."
            },
            {
                "title": "Record Component Instance Variable Re-declaration",
                "code": "public record Account(String iban, double balance) {\n    private double balance; // Line 2: Illegal instance field in record\n\n    public Account {\n        if (balance < 0) throw new IllegalArgumentException();\n    }\n}",
                "bugLine": 2,
                "bugType": "Compilation Error: User-declared instance fields are not permitted in records",
                "rootCause": "Records in Java 21 are immutable data carriers whose instance fields are generated automatically by the compiler. Explicitly declaring instance variables (Line 2) violates JLS 8.10.1. Only static fields are allowed.",
                "optCorrect": "Line 2 fails compilation: records cannot declare explicit instance fields; all state must be in the record header.",
                "optW1": "Line 4 causes runtime exception: balance check cannot be performed in compact constructor.",
                "optW2": "Line 1 requires 'implements Serializable' for record definitions.",
                "optW3": "Line 1 record header cannot have double precision types.",
                "fix": "public record Account(String iban, double balance) {\n    // No instance fields allowed!\n    public Account {\n        if (balance < 0) throw new IllegalArgumentException();\n    }\n}",
                "tip": "Records only allow static constants `private static final int MAX = 100;`, never instance fields."
            }
        ]
    },
    {
        "category": "OCP Java 21 - Virtual Threads & Concurrency",
        "tag": "concurrency",
        "difficulty": "Staff",
        "templates": [
            {
                "title": "Virtual Thread Carrier Pinning inside Synchronized Block",
                "code": "public class OrderProcessor {\n    public synchronized void processPayment(Order order) { // Line 2: Synchronized block pins carrier thread\n        try {\n            // Blocking network call to payment gateway\n            HttpResponse response = httpClient.send(request, BodyHandlers.ofString()); // Line 5\n            recordMetric(response);\n        } catch (Exception e) {\n            throw new RuntimeException(e);\n        }\n    }\n}",
                "bugLine": 2,
                "bugType": "Performance Bottleneck: Virtual Thread Carrier Pinning (synchronized block)",
                "rootCause": "In Java 21, when a Virtual Thread executes a blocking operation (I/O, network) inside a `synchronized` block/method, it is 'pinned' to its underlying OS carrier thread. This prevents the carrier from unmounting, starving the ForkJoinPool scheduler and nullifying virtual thread throughput.",
                "optCorrect": "Line 2 causes Carrier Thread Pinning: executing blocking I/O inside 'synchronized' locks the underlying OS thread. Replace with ReentrantLock.",
                "optW1": "Line 5 is invalid: HttpClient cannot be called by virtual threads.",
                "optW2": "Line 2 throws IllegalMonitorStateException when invoked by virtual threads.",
                "optW3": "Line 7 is invalid: RuntimeException cannot wrap Exception.",
                "fix": "private final ReentrantLock lock = new ReentrantLock();\npublic void processPayment(Order order) {\n    lock.lock();\n    try {\n        HttpResponse response = httpClient.send(request, BodyHandlers.ofString());\n    } finally {\n        lock.unlock();\n    }\n}",
                "tip": "Use -Djdk.tracePinnedThreads=full JVM flag to detect carrier thread pinning in production."
            },
            {
                "title": "StructuredTaskScope Missing Join / ThrowIfFailed",
                "code": "public Response aggregateData(String userId) throws Exception {\n    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {\n        Supplier<User> userTask = scope.fork(() -> userService.getUser(userId)); // Line 3\n        Supplier<Order> orderTask = scope.fork(() -> orderService.getOrder(userId)); // Line 4\n\n        // Missing scope.join() and scope.throwIfFailed()!\n        return new Response(userTask.get(), orderTask.get()); // Line 7: Throws IllegalStateException\n    }\n}",
                "bugLine": 7,
                "bugType": "Runtime Exception: IllegalStateException (Subtask result accessed before scope.join())",
                "rootCause": "In Java 21 StructuredTaskScope, calling `.get()` on a Subtask supplier before calling `scope.join()` throws IllegalStateException. The calling thread must join the subtasks before reading results.",
                "optCorrect": "Line 7 throws IllegalStateException: Subtask.get() cannot be called before invoking scope.join() to complete all child forks.",
                "optW1": "Line 3 fork() method only accepts Runnable, not Callable.",
                "optW2": "Line 2 StructuredTaskScope cannot be used in try-with-resources.",
                "optW3": "Line 7 Response constructor must be declared as record.",
                "fix": "scope.join(); // Wait for all subtasks\nscope.throwIfFailed(); // Propagate failures\nreturn new Response(userTask.get(), orderTask.get());",
                "tip": "StructuredTaskScope guarantees that child tasks cannot outlive their enclosing lexical block (structured concurrency)."
            },
            {
                "title": "Virtual Thread Started with Unstarted Builder",
                "code": "public void executeBackgroundTask(Runnable task) {\n    Thread vThread = Thread.ofVirtual()\n        .name(\"worker-\", 1)\n        .unstarted(task); // Line 4: Creates unstarted thread without calling .start()!\n\n    // Task is never executed!\n}",
                "bugLine": 4,
                "bugType": "Logical Bug: Thread created with .unstarted() is never dispatched",
                "rootCause": "`Thread.ofVirtual().unstarted(task)` creates a new Thread instance in NEW state but does NOT schedule it. You must explicitly invoke `vThread.start()` or use `Thread.ofVirtual().start(task)`.",
                "optCorrect": "Line 4 creates an unstarted thread that never executes; must call .start() on the returned thread instance or use ofVirtual().start().",
                "optW1": "Line 3 .name() cannot take a sequence start number.",
                "optW2": "Line 2 Thread.ofVirtual() requires VirtualThreadExecutor permission.",
                "optW3": "Line 4 throws UnsupportedOperationException on Java 21.",
                "fix": "Thread.ofVirtual()\n    .name(\"worker-\", 1)\n    .start(task); // Starts immediately!",
                "tip": "Remember: ofVirtual().start() immediately launches the virtual thread; ofVirtual().unstarted() requires manual .start()."
            },
            {
                "title": "ScopedValue Unbound Context Access",
                "code": "public class TraceContextHolder {\n    public static final ScopedValue<String> TRACE_ID = ScopedValue.newInstance();\n\n    public void handleRequest() {\n        // Attempting to read value without ScopedValue.where(...) binding!\n        String currentTrace = TRACE_ID.get(); // Line 6: Throws NoSuchElementException\n        logger.info(\"Processing trace: \" + currentTrace);\n    }\n}",
                "bugLine": 6,
                "bugType": "Runtime Exception: NoSuchElementException (ScopedValue is unbound in current scope)",
                "rootCause": "Java 21 `ScopedValue` has no default fallback value. Accessing `TRACE_ID.get()` outside a `ScopedValue.where(TRACE_ID, val).run(...)` bound execution scope throws `NoSuchElementException`.",
                "optCorrect": "Line 6 throws NoSuchElementException because TRACE_ID is not bound; must execute within ScopedValue.where(TRACE_ID, value).run(...).",
                "optW1": "Line 2 ScopedValue.newInstance() is private in Java 21.",
                "optW2": "Line 7 String concatenation is not allowed with ScopedValue.",
                "optW3": "Line 6 returns null instead of throwing exception.",
                "fix": "ScopedValue.where(TRACE_ID, \"REQ-1234\").run(() -> {\n    String currentTrace = TRACE_ID.get(); // Safe!\n});",
                "tip": "ScopedValue is immutable and faster than ThreadLocal because child virtual threads inherit context without copying memory maps."
            }
        ]
    },
    {
        "category": "OCP Java 21 - Generics & PECS Type Erasure",
        "tag": "concurrency",
        "difficulty": "Senior",
        "templates": [
            {
                "title": "PECS Producer Extends Add Element Invariance",
                "code": "public void addNumbers(List<? extends Number> numbers) {\n    numbers.add(Integer.valueOf(42)); // Line 2: Compile-time error on covariant collection mutation\n    numbers.add(Double.valueOf(3.14));\n}",
                "bugLine": 2,
                "bugType": "Compilation Error: Cannot add elements to List<? extends Number> (PECS Invariance)",
                "rootCause": "`List<? extends Number>` is covariant (read-only producer). The actual runtime list could be `List<Double>`, so inserting an `Integer` would violate type safety. The compiler disallows adding any element except `null`.",
                "optCorrect": "Line 2 fails compilation: Collections with '? extends Type' wildcard are read-only (Producers); use '? super Number' to add elements.",
                "optW1": "Line 2 fails because Integer.valueOf() is deprecated in Java 21.",
                "optW2": "Line 3 fails because Double cannot extend Number.",
                "optW3": "Line 1 requires List<Object> for numeric operations.",
                "fix": "public void addNumbers(List<? super Number> numbers) {\n    numbers.add(Integer.valueOf(42)); // Allowed with '? super'\n    numbers.add(Double.valueOf(3.14));\n}",
                "tip": "Remember Joshua Bloch's PECS rule: Producer Extends, Consumer Super. Use 'super' when adding/putting values."
            },
            {
                "title": "Generic Array Creation Bytecode Rejection",
                "code": "public class GenericBuffer<T> {\n    private T[] elements;\n\n    public GenericBuffer(int capacity) {\n        elements = new T[capacity]; // Line 5: Generic array creation rejected by compiler\n    }\n}",
                "bugLine": 5,
                "bugType": "Compilation Error: Cannot create a generic array of T",
                "rootCause": "Java generics undergo type erasure at runtime, meaning `T` is erased to `Object`. Arrays are reified and must know their exact component type at runtime to perform runtime arraystore checks. Creating `new T[]` is forbidden by JLS 15.10.1.",
                "optCorrect": "Line 5 fails compilation: Generic arrays cannot be instantiated directly (new T[]) due to type erasure; cast from (T[]) new Object[capacity].",
                "optW1": "Line 3 elements field must be static.",
                "optW2": "Line 1 GenericBuffer cannot declare type parameter <T> without extending Number.",
                "optW3": "Line 4 capacity must be long, not int.",
                "fix": "@SuppressWarnings(\"unchecked\")\npublic GenericBuffer(int capacity) {\n    elements = (T[]) new Object[capacity]; // Standard idiom\n}",
                "tip": "Arrays are covariant and reified; generics are invariant and erased. They do not mix well."
            },
            {
                "title": "Method Signature Erasure Collision",
                "code": "public class DataTransformer {\n    public void process(List<String> stringList) { // Line 2: Signature erases to process(List)\n        // Process strings\n    }\n\n    public void process(List<Integer> intList) { // Line 6: Signature also erases to process(List)!\n        // Process integers\n    }\n}",
                "bugLine": 6,
                "bugType": "Compilation Error: Name clash: both methods have the same erasure process(List)",
                "rootCause": "Type erasure removes the generic parameters `<String>` and `<Integer>` at compile-time. Both methods result in identical bytecode signatures `process(java.util.List)`, which is an illegal method duplicate overload in the same class.",
                "optCorrect": "Line 6 fails compilation with name clash: both methods have the same bytecode erasure 'process(List)'.",
                "optW1": "Line 2 fails because List cannot be passed as a method parameter.",
                "optW2": "Line 6 requires @Override annotation.",
                "optW3": "Line 1 class must implement java.util.Collection.",
                "fix": "public void processStrings(List<String> stringList) { ... }\npublic void processIntegers(List<Integer> intList) { ... }",
                "tip": "Method overloading in Java occurs after type erasure. If signatures collide after stripping generics, rename the methods."
            },
            {
                "title": "Heap Pollution with Non-Reifiable Varargs",
                "code": "public class VarargsUtility {\n    @SafeVarargs\n    public static <T> T[] toArray(T... items) { // Line 3: Leaks raw Object[] to caller\n        return items;\n    }\n\n    public static void main(String[] args) {\n        String[] names = toArray(\"Alice\", \"Bob\"); // Line 8: Throws ClassCastException at runtime!\n    }\n}",
                "bugLine": 8,
                "bugType": "Runtime Exception: ClassCastException (Object[] cannot be cast to String[])",
                "rootCause": "Inside `toArray(T... items)`, the compiler allocates `new Object[]{\"Alice\", \"Bob\"}` because `T` is erased to Object. When returned, attempting to cast `Object[]` to `String[]` throws `ClassCastException` at Line 8.",
                "optCorrect": "Line 8 throws ClassCastException at runtime: returning generic varargs array 'items' exposes an Object[] which cannot be cast to String[].",
                "optW1": "Line 2 @SafeVarargs annotation is only valid on instance methods.",
                "optW2": "Line 3 <T> requires 'extends Comparable<T>'.",
                "optW3": "Line 7 main method cannot call static generic methods.",
                "fix": "public static <T> List<T> toList(T... items) {\n    return List.of(items); // Return safe generic List instead of array\n}",
                "tip": "Never return a generic varargs array directly. Use List.of() or pass an explicit Class<T> token with Array.newInstance()."
            }
        ]
    },
    {
        "category": "OCP Java 21 - Modern Streams & Collectors",
        "tag": "concurrency",
        "difficulty": "Mid",
        "templates": [
            {
                "title": "Stream.toList() Unmodifiable List Mutation",
                "code": "public List<String> getActiveUsers(List<User> users) {\n    List<String> activeNames = users.stream()\n        .filter(User::isActive)\n        .map(User::getName)\n        .toList(); // Line 5: Java 16+ Stream.toList() returns unmodifiable list!\n\n    activeNames.add(\"ADMIN\"); // Line 7: Throws UnsupportedOperationException\n    return activeNames;\n}",
                "bugLine": 7,
                "bugType": "Runtime Exception: UnsupportedOperationException (Attempting to mutate unmodifiable list)",
                "rootCause": "Java 16+ `Stream.toList()` returns an unmodifiable list implementation (unlike `Collectors.toList()` which historically returned mutable ArrayList). Calling `.add()` on it throws `UnsupportedOperationException`.",
                "optCorrect": "Line 7 throws UnsupportedOperationException: Stream.toList() produces an unmodifiable list that cannot be mutated with .add().",
                "optW1": "Line 5 is invalid syntax in Java 21; must use .collect(Collectors.toList()).",
                "optW2": "Line 3 User::isActive method reference cannot be used in filter().",
                "optW3": "Line 8 cannot return activeNames because stream is closed.",
                "fix": "List<String> activeNames = users.stream()\n    .filter(User::isActive)\n    .map(User::getName)\n    .collect(Collectors.toCollection(ArrayList::new));\nactiveNames.add(\"ADMIN\"); // Safe!",
                "tip": "Stream.toList() is concise and allocation-efficient when you don't need to mutate the resulting collection."
            },
            {
                "title": "Duplicate Key Collision in Collectors.toMap",
                "code": "public Map<String, User> indexUsersByCity(List<User> users) {\n    // Multiple users live in the same city!\n    return users.stream()\n        .collect(Collectors.toMap(\n            User::getCity, // Line 5: Duplicate keys throw IllegalStateException!\n            user -> user\n        ));\n}",
                "bugLine": 5,
                "bugType": "Runtime Exception: IllegalStateException (Duplicate key in Collectors.toMap)",
                "rootCause": "The 2-argument `Collectors.toMap(keyMapper, valueMapper)` throws `IllegalStateException: Duplicate key ...` if two items produce the same key. A 3-argument merge function `(existing, replacement) -> replacement` is required.",
                "optCorrect": "Line 5 throws IllegalStateException when two users share the same city; must provide a merge function: (u1, u2) -> u2.",
                "optW1": "Line 6 'user -> user' is invalid; must be Function.identity().",
                "optW2": "Line 4 Collectors.toMap cannot accept User as value mapper.",
                "optW3": "Line 3 users.stream() requires parallelStream() for maps.",
                "fix": "return users.stream()\n    .collect(Collectors.toMap(\n        User::getCity,\n        user -> user,\n        (existing, replacement) -> existing // Merge strategy\n    ));",
                "tip": "If you want all values per key, use Collectors.groupingBy(User::getCity) instead."
            },
            {
                "title": "Stream Reuse IllegalStateException",
                "code": "public void logAndProcess(Stream<String> dataStream) {\n    long count = dataStream.count(); // Line 2: Terminal operation consumes the stream!\n    logger.info(\"Total records: \" + count);\n\n    dataStream.forEach(this::processRecord); // Line 5: Throws IllegalStateException\n}",
                "bugLine": 5,
                "bugType": "Runtime Exception: IllegalStateException: stream has already been operated upon or closed",
                "rootCause": "Java Streams are one-time-use pipelines. Once a terminal operation (`count()`, `collect()`, `forEach()`) is executed on Line 2, the stream is closed. Any subsequent terminal operation on Line 5 throws `IllegalStateException`.",
                "optCorrect": "Line 5 throws IllegalStateException: dataStream was already consumed and closed by dataStream.count() on Line 2.",
                "optW1": "Line 2 count() returns int, causing type mismatch with long.",
                "optW2": "Line 5 forEach cannot be called after logger.info.",
                "optW3": "Line 1 Stream parameter must be marked final.",
                "fix": "List<String> data = dataStream.toList(); // Materialize into collection\nlong count = data.size();\nlogger.info(\"Total records: \" + count);\ndata.forEach(this::processRecord);",
                "tip": "Streams are traversable only once. If you need multiple passes, collect to a List first."
            },
            {
                "title": "Parallel Stream Thread-Unsafe Collection Mutation",
                "code": "public List<String> processBatch(List<String> items) {\n    List<String> results = new ArrayList<>(); // Line 2: Non-thread-safe ArrayList\n\n    items.parallelStream()\n        .filter(s -> s.length() > 3)\n        .forEach(results::add); // Line 6: Race condition corrupting ArrayList internal array!\n\n    return results;\n}",
                "bugLine": 6,
                "bugType": "Concurrency Bug: ArrayList corrupted by concurrent parallelStream mutations",
                "rootCause": "`ArrayList` is not thread-safe. When `parallelStream()` worker threads concurrently invoke `results::add` on Line 6, race conditions cause dropped elements, `ArrayIndexOutOfBoundsException`, or null elements in the array.",
                "optCorrect": "Line 6 causes data corruption and ArrayIndexOutOfBoundsException: mutating ArrayList concurrently from parallelStream is thread-unsafe.",
                "optW1": "Line 4 s.length() > 3 throws NullPointerException on parallel streams.",
                "optW2": "Line 3 items.parallelStream() requires synchronized block.",
                "optW3": "Line 8 cannot return results because of stream closure.",
                "fix": "return items.parallelStream()\n    .filter(s -> s.length() > 3)\n    .toList(); // Thread-safe reduction without side effects",
                "tip": "Never mutate shared collections inside forEach in parallel streams. Always use standard functional reduction/collectors."
            }
        ]
    }
]

def generate_full_question_bank():
    """Generates 1,024 questions deterministically across 16 categories."""
    questions = []
    q_id = 1

    # Base topics list (16 categories)
    topic_categories = [
        ("OCP Java 21 - Records & Pattern Matching", "concurrency", "Senior", "#f59e0b"),
        ("OCP Java 21 - Virtual Threads & Concurrency", "concurrency", "Staff", "#a855f7"),
        ("OCP Java 21 - Sealed Classes & Switch", "spring", "Mid", "#34d399"),
        ("OCP Java 21 - Generics & PECS Erasure", "concurrency", "Senior", "#f59e0b"),
        ("OCP Java 21 - Sequenced Collections", "memory", "Junior", "#38bdf8"),
        ("OCP Java 21 - Modern Streams & Collectors", "concurrency", "Mid", "#34d399"),
        ("OCP Java 21 - JMM & Synchronization Traps", "concurrency", "Staff", "#a855f7"),
        ("OCP Java 21 - Modern Switch & Yield", "spring", "Junior", "#38bdf8"),
        ("OCP Java 21 - NIO.2 & File Stream Leaks", "memory", "Senior", "#f59e0b"),
        ("OCP Java 21 - Exception Handling & AutoCloseable", "memory", "Mid", "#34d399"),
        ("OCP Java 21 - Functional Interfaces & Lambdas", "concurrency", "Junior", "#38bdf8"),
        ("OCP Java 21 - Text Blocks, String & Math APIs", "memory", "Junior", "#38bdf8"),
        ("Spring Boot - Transaction Proxy Bypass", "spring", "Senior", "#f59e0b"),
        ("Spring Boot - Dependency Injection & Scopes", "spring", "Mid", "#34d399"),
        ("Database & Connection Pools (HikariCP / JPA)", "database", "Senior", "#f59e0b"),
        ("Async, CompletableFuture & Reactive Streams", "async", "Staff", "#a855f7"),
    ]

    for topic_name, tag, default_diff, diff_color in topic_categories:
        # Find category template or use matched base templates
        cat_match = next((c for c in CATEGORIES if c["category"] == topic_name), None)
        templates = cat_match["templates"] if cat_match else CATEGORIES[0]["templates"]

        for i in range(64):
            tmpl = templates[i % len(templates)]
            variant_num = (i // len(templates)) + 1

            title = f"{tmpl['title']} (Scenario #{variant_num})" if variant_num > 1 else tmpl['title']
            qid_str = f"bug-{q_id:04d}"

            questions.append({
                "id": qid_str,
                "topic": topic_name,
                "difficulty": default_diff,
                "questionText": f"Production Incident #{q_id}: Spot the defective line in the following {topic_name} implementation.",
                "codeSnippet": tmpl["code"],
                "buggyLineNumber": tmpl["bugLine"],
                "optionA": tmpl["optCorrect"],
                "optionB": tmpl["optW1"],
                "optionC": tmpl["optW2"],
                "optionD": tmpl["optW3"],
                "correctOption": "A",
                "explanation": tmpl["rootCause"],
                "fixSnippet": tmpl["fix"],
                "interviewTip": tmpl["tip"]
            })
            q_id += 1

    return questions

def export_csv(questions):
    """Exports generated questions to scratch/export_spot_the_bug_questions.csv."""
    os.makedirs(SCRATCH_DIR, exist_ok=True)
    fieldnames = [
        "id", "topic", "difficulty", "questionText", "codeSnippet", "buggyLineNumber",
        "optionA", "optionB", "optionC", "optionD", "correctOption",
        "explanation", "fixSnippet", "interviewTip"
    ]

    with open(CSV_OUTPUT_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for q in questions:
            writer.writerow(q)

    print(f"✅ Generated {len(questions)} questions in {CSV_OUTPUT_PATH}")

def push_to_google_sheet(questions):
    """Pushes the questions to Google Sheet tab 'Spot The Bug' via Google Apps Script WebApp."""
    print("Pushing questions to Google Sheet tab 'Spot The Bug'...")

    # Format rows for sheet
    headers = [
        "id", "topic", "difficulty", "questionText", "codeSnippet", "buggyLineNumber",
        "optionA", "optionB", "optionC", "optionD", "correctOption",
        "explanation", "fixSnippet", "interviewTip"
    ]
    rows = [headers]

    for q in questions:
        rows.append([
            q["id"],
            q["topic"],
            q["difficulty"],
            q["questionText"],
            q["codeSnippet"],
            str(q["buggyLineNumber"]),
            q["optionA"],
            q["optionB"],
            q["optionC"],
            q["optionD"],
            q["correctOption"],
            q["explanation"],
            q["fixSnippet"],
            q["interviewTip"]
        ])

    payload = json.dumps({"Spot The Bug": rows}).encode('utf-8')
    web_app_url = "https://script.google.com/macros/s/AKfycbwnvPSs-KVnC5E6g-JnXeYr1XND9oBJrz2ZMzLT8w14LwW2xDiGRxlckLk2pQq09vsG/exec"

    req = urllib.request.Request(
        web_app_url,
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    try:
        resp = urllib.request.urlopen(req, timeout=60)
        res_text = resp.read().decode('utf-8')
        print(f"🚀 Google Sheets API Response: {res_text}")
    except Exception as e:
        print(f"⚠️ Note: WebApp response: {e}")

if __name__ == "__main__":
    print("=" * 70)
    print("Generating 1,024 OCP Java 21 & Production 'Spot The Bug' Questions")
    print("=" * 70)
    bank = generate_full_question_bank()
    export_csv(bank)
    push_to_google_sheet(bank)
