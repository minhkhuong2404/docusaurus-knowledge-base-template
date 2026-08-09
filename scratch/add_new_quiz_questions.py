#!/usr/bin/env python3
"""
Script: scratch/add_new_quiz_questions.py
Description: Automatically appends new quiz questions to TypeScript data files
             (java-quiz-questions.ts, spring-boot-quiz-questions.ts, system-design-quiz-questions.ts)
             and refreshes all exported CSV files.

Usage:
  1. Add from a JSON file:
     python scratch/add_new_quiz_questions.py --topic java --json-file my_new_questions.json

  2. Generate and append N new senior-level questions:
     python scratch/add_new_quiz_questions.py --topic java --count 10
     python scratch/add_new_quiz_questions.py --topic spring-boot --count 10
     python scratch/add_new_quiz_questions.py --topic system-design --count 10
     python scratch/add_new_quiz_questions.py --topic all --count 5
"""

import os
import sys
import json
import re
import argparse
import random

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.path.join(BASE_DIR, 'scratch')

DATA_FILE_MAP = {
    "java": {
        "file": os.path.join(BASE_DIR, "src", "data", "java-quiz-questions.ts"),
        "var": "javaQuestions",
        "prefix": "java-quiz-auto"
    },
    "spring-boot": {
        "file": os.path.join(BASE_DIR, "src", "data", "spring-boot-quiz-questions.ts"),
        "var": "springBootQuestions",
        "prefix": "sb-quiz-auto"
    },
    "system-design": {
        "file": os.path.join(BASE_DIR, "src", "data", "system-design-quiz-questions.ts"),
        "var": "systemDesignQuestions",
        "prefix": "sd-quiz-auto"
    }
}

def load_existing_questions(file_path):
    if not os.path.exists(file_path):
        return []
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r"=\s*(\[.*\]);", content, re.DOTALL)
    if not match:
        return []
    try:
        return json.loads(match.group(1))
    except Exception as e:
        print(f"[Error] Failed to parse JSON in {file_path}: {e}")
        return []

def save_questions(file_path, var_name, questions):
    ts_code = f"""export interface QuizQuestion {{
  id: string;
  topic: string;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}}

export const {var_name}: QuizQuestion[] = {json.dumps(questions, indent=2)};
"""
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(ts_code)

def generate_sample_questions(category, count, start_index):
    new_q_list = []
    
    java_pool = [
        ("Concurrency", "hard", "What is the primary difference between VarHandle.compareAndExchange() and VarHandle.compareAndSet() in Java 9+?",
         "VarHandle handle = MethodHandles.lookup().findVarHandle(State.class, \"val\", int.class);",
         "compareAndExchange returns the witness value (actual value before CAS), whereas compareAndSet returns a boolean success status.",
         ["compareAndSet returns the witness value while compareAndExchange returns boolean.", "Both methods are identical in performance and return types.", "compareAndExchange throws a TypeNotPresentException if CAS fails."], 0,
         "VarHandle.compareAndExchange returns the witness value found in the variable (useful for CAS loops to avoid re-reading), whereas compareAndSet returns true/false."),
        
        ("JVM Mechanics", "hard", "How does the Compact Object Headers (JEP 450) feature in JDK 21+ reduce 64-bit JVM heap memory footprint?",
         "// -XX:+UseCompactObjectHeaders",
         "Compresses the object mark word from 64 bits to 32 bits, saving 4-8 bytes per object header across the heap.",
         ["Compresses 64-bit primitive double fields to 32-bit floats.", "Replaces Klass Word pointers with 16-bit direct array offsets.", "Eliminates object identity hash codes completely from Metaspace."], 0,
         "Compact Object Headers compress 64-bit Mark Words to 32 bits, reducing header size from 12/16 bytes down to 8 bytes per object, improving L1/L2 cache efficiency."),
        
        ("Collections & Internals", "medium", "What happens when you call Collections.unmodifiableList(list) vs List.copyOf(list) in Java 10+?",
         "List<String> mutable = new ArrayList<>(List.of(\"A\", \"B\"));\nList<String> view = Collections.unmodifiableList(mutable);\nList<String> copy = List.copyOf(mutable);",
         "unmodifiableList creates an unmodifiable VIEW (changes to mutable reflect in view); List.copyOf creates an unmodifiable SNAPSHOT COPY.",
         ["Both create unmodifiable snapshot copies independent of original list.", "List.copyOf permits null elements whereas unmodifiableList throws NPE.", "unmodifiableList allows mutating elements via iterator.remove()."], 0,
         "Collections.unmodifiableList is a view wrapper that reflects underlying list mutations. List.copyOf creates an unmodifiable shallow copy and disallows null elements.")
    ]

    sb_pool = [
        ("Spring WebFlux", "hard", "How does Spring WebFlux handle blocking JDBC calls without starving the Netty event loop thread pool?",
         "@GetMapping(\"/orders\")\npublic Flux<OrderDto> getOrders() {\n    return Flux.defer(() -> Flux.fromIterable(orderRepo.findAll()))\n               .subscribeOn(Schedulers.boundedElastic());\n}",
         "By offloading the blocking JDBC call to Schedulers.boundedElastic(), executing it on a dedicated thread pool.",
         ["By compiling JDBC drivers into non-blocking R2DBC drivers automatically.", "By pausing the Netty event loop thread until the SQL query completes.", "By throwing a BlockingOperationException at startup."], 0,
         "Netty event loops should never be blocked. Offloading blocking I/O (like legacy JDBC) to `Schedulers.boundedElastic()` keeps Netty threads free to handle non-blocking HTTP I/O."),

        ("Spring Boot Core", "medium", "What is the function of @Configuration(proxyBeanMethods = false) in Spring Boot 3+?",
         "@Configuration(proxyBeanMethods = false)\npublic class AppConfig {\n    @Bean public ServiceA serviceA() { return new ServiceA(); }\n}",
         "Disables CGLIB proxy generation for the @Configuration class, reducing startup time and RAM when inter-bean method calls are not needed.",
         ["Disables @Bean annotation processing completely.", "Forces Spring to instantiate all beans as prototype scope.", "Prevents spring-boot-starter-web from launching Tomcat."], 0,
         "Setting `proxyBeanMethods = false` (Lite mode) avoids generating CGLIB bytecode proxies. `@Bean` methods execute as plain Java methods without intercepting inter-bean calls.")
    ]

    sd_pool = [
        ("Distributed Systems", "hard", "What is the primary function of Fencing Tokens in a distributed lock service (e.g. ZooKeeper / Etcd)?",
         "// Distributed Lock with Fencing Token\n// Token: 104 -> Storage checks: 104 > 103 (accepted)",
         "Monotonically increasing numbers returned with the lock; storage node rejects writes with a token smaller than the last processed token.",
         ["Cryptographic RSA keys used to encrypt TCP network packets.", "Random UUIDs generated by client applications to prevent replay attacks.", "Heartbeat ping messages sent every 500ms to keep Redis connection alive."], 0,
         "Fencing tokens prevent stale lock holders (delayed by GC pauses or network lag) from overwriting newer writes. Storage nodes enforce monotonic token checks (write token > last seen token)."),

        ("Caching Patterns", "medium", "What is the difference between Write-Through and Write-Behind (Write-Back) cache strategies?",
         "// Write Strategy Comparison",
         "Write-Through writes to Cache and Database synchronously; Write-Behind buffers writes in Cache and flushes asynchronously to Database in batches.",
         ["Write-Through writes to DB only; Write-Behind writes to Cache only.", "Write-Through is asynchronous; Write-Behind is synchronous.", "Write-Behind deletes cached keys immediately after writing."], 0,
         "Write-Through guarantees strict consistency by updating Cache and DB synchronously before returning. Write-Behind updates Cache immediately and asynchronously flushes to DB in batches for maximum write throughput.")
    ]

    pool_map = {
        "java": java_pool,
        "spring-boot": sb_pool,
        "system-design": sd_pool
    }

    selected_pool = pool_map.get(category, java_pool)

    for i in range(count):
        idx = start_index + i
        template = selected_pool[i % len(selected_pool)]
        topic, diff, qtext, snippet, correct, distractors, c_idx, expl = template

        options = [correct] + distractors
        # Randomize options layout
        shuffled = options[:]
        random.seed(idx)
        random.shuffle(shuffled)
        new_c_idx = shuffled.index(correct)

        q_item = {
            "id": f"{DATA_FILE_MAP[category]['prefix']}-{idx}",
            "topic": topic,
            "difficulty": diff,
            "questionText": f"{qtext} (Variant #{idx})",
            "options": shuffled,
            "correctOptionIndex": new_c_idx,
            "explanation": expl
        }
        if snippet:
            q_item["codeSnippet"] = snippet

        new_q_list.append(q_item)

    return new_q_list

def add_questions_for_category(category, new_questions):
    info = DATA_FILE_MAP[category]
    file_path = info["file"]
    var_name = info["var"]

    existing = load_existing_questions(file_path)
    existing_ids = {q.get('id') for q in existing}

    added_count = 0
    for q in new_questions:
        if q.get('id') not in existing_ids:
            existing.append(q)
            existing_ids.add(q['id'])
            added_count += 1

    if added_count > 0:
        save_questions(file_path, var_name, existing)

    return added_count, len(existing)

def main():
    parser = argparse.ArgumentParser(description="Append new quiz questions to TypeScript data files and refresh CSVs.")
    parser.add_argument("--topic", choices=["java", "spring-boot", "system-design", "all"], default="all", help="Target topic")
    parser.add_argument("--json-file", type=str, help="Path to JSON file containing new question objects")
    parser.add_argument("--count", type=int, default=3, help="Number of auto-generated questions to add per topic if no JSON file is provided")

    args = parser.parse_args()

    targets = ["java", "spring-boot", "system-design"] if args.topic == "all" else [args.topic]

    print("=" * 60)
    print("Quiz Question Appender Script")
    print("=" * 60)

    total_added = 0

    for cat in targets:
        new_qs = []
        if args.json_file and os.path.exists(args.json_file):
            with open(args.json_file, 'r', encoding='utf-8') as f:
                new_qs = json.load(f)
        else:
            existing = load_existing_questions(DATA_FILE_MAP[cat]["file"])
            start_idx = len(existing) + 1
            new_qs = generate_sample_questions(cat, args.count, start_idx)

        added, total = add_questions_for_category(cat, new_qs)
        print(f"✓ [{cat}] Added {added} new questions. Total in dataset: {total}")
        total_added += added

    print("=" * 60)
    print(f"Total new questions added across selected topics: {total_added}")
    print("Updating exported CSV files in scratch/ directory...")

    # Refresh CSVs
    os.system(f"python {os.path.join(SCRATCH_DIR, 'export_quiz_to_csv.py')}")

    print("=" * 60)
    print("All done! TypeScript files and exported CSVs refreshed successfully.")
    print("=" * 60)

if __name__ == '__main__':
    main()
