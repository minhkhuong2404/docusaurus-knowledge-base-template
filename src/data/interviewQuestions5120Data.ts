/**
 * 128 Senior Interview Questions Bank (Curated High-Impact Edition)
 * Distributed across 8 Core Engineering Domains (16 Qs each)
 * Exactly 64 Thực Hành & Áp Dụng + 64 Phân Tích & Điều Tra Sự Cố
 * Handcrafted for Senior, Staff & Principal Engineer Interviews with Zero Duplication
 */

export interface InterviewQuestionItem {
  id: string;
  domain: string;
  domainCode: string;
  category: 'Thực Hành & Áp Dụng' | 'Phân Tích & Điều Tra Sự Cố';
  theme: string;
  question: string;
  scenarioContext: string;
  juniorTrap: string;
  seniorSolution: string;
  practicalProof: string;
  tags: string[];
}

export interface DomainMeta {
  domain: string;
  shortCode: string;
  icon: string;
  accentColor: string;
  description: string;
  applyingCount: number;
  analyzingCount: number;
  totalCount: number;
}

export const DOMAINS_META: DomainMeta[] = [
  {
    domain: 'Core Java & Concurrency',
    shortCode: 'JAVA',
    icon: '☕',
    accentColor: '#38bdf8',
    description: 'JVM Internals, Bộ nhớ (Heap/Metaspace), ThreadPool, Virtual Threads, AQS & Race Conditions',
    applyingCount: 8,
    analyzingCount: 8,
    totalCount: 16
  },
  {
    domain: 'Spring Boot Ecosystem',
    shortCode: 'SPRING',
    icon: '🍃',
    accentColor: '#34d399',
    description: 'IoC Container, @Transactional Proxy, Spring Security 6 JWT, JPA N+1, Resilience4j & Outbox',
    applyingCount: 8,
    analyzingCount: 8,
    totalCount: 16
  },
  {
    domain: 'Git & Repository Engineering',
    shortCode: 'GIT',
    icon: '🌿',
    accentColor: '#f97316',
    description: 'Interactive Rebase, Merge Conflicts, Cherry-Pick, Bisect Debugging, Git LFS & Reflog Recovery',
    applyingCount: 8,
    analyzingCount: 8,
    totalCount: 16
  },
  {
    domain: 'Docker & Containerization',
    shortCode: 'DOCKER',
    icon: '🐳',
    accentColor: '#0ea5e9',
    description: 'Multi-stage Dockerfiles, cgroups v2 Memory Limits, Non-root Hardening, Zombie PID 1 & Layer Caching',
    applyingCount: 8,
    analyzingCount: 8,
    totalCount: 16
  },
  {
    domain: 'SQL & Database Performance',
    shortCode: 'SQL',
    icon: '🗄️',
    accentColor: '#fbbf24',
    description: 'B-Tree Leftmost Prefix, EXPLAIN ANALYZE, ACID Isolation Levels, Deadlocks & HikariCP Pool Sizing',
    applyingCount: 8,
    analyzingCount: 8,
    totalCount: 16
  },
  {
    domain: 'Redis & Caching Architecture',
    shortCode: 'REDIS',
    icon: '⚡',
    accentColor: '#ec4899',
    description: 'Distributed Redlock, Cache Stampede (XFetch), Eviction Policies, Lua Scripting & Sliding Window Rate Limiting',
    applyingCount: 8,
    analyzingCount: 8,
    totalCount: 16
  },
  {
    domain: 'Apache Kafka & Event Streaming',
    shortCode: 'KAFKA',
    icon: '📬',
    accentColor: '#a78bfa',
    description: 'Partition Rebalance Storms, Idempotent Producers, Zero-Copy Sendfile, Dead Letter Queues & EOS',
    applyingCount: 8,
    analyzingCount: 8,
    totalCount: 16
  },
  {
    domain: 'System Design & Troubleshooting',
    shortCode: 'SYS',
    icon: '🛠️',
    accentColor: '#f43f5e',
    description: 'High CPU 100% Thread Tracing, OOM Heap Dump Analysis, TCP TIME_WAIT Exhaustion, Distributed Sagas',
    applyingCount: 8,
    analyzingCount: 8,
    totalCount: 16
  }
];

export const RAW_QUESTIONS_128: InterviewQuestionItem[] = [
  {
    "id": "Q-JAVA-APP-01",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Java Memory Model & Volatile/Memory Barriers",
    "question": "Triển khai cờ dừng (cancellation flag) hoặc Double-Checked Locking đảm bảo tính khả kiến và an toàn đa luồng tuyệt đối.",
    "scenarioContext": "Hệ thống trading đa luồng xử lý 200,000 tick/giây: Cần đồng bộ cờ dừng trạng thái giữa các CPU Core mà không dùng synchronized gây block luồng.",
    "juniorTrap": "Chỉ nghĩ volatile ngăn compiler tối ưu hóa, không hiểu volatile phát sinh lệnh CPU LoadLoad/StoreStore fence để ngăn CPU reordering.",
    "seniorSolution": "Volatile đảm bảo quan hệ Happens-Before theo JSR-133. Khi ghi biến volatile, CPU phát sinh StoreStore + StoreLoad fence; khi đọc, phát sinh LoadLoad + LoadStore fence để flush store buffer và invalid cache line.",
    "practicalProof": "private volatile boolean running = true;\npublic void stop() { running = false; } // Happens-Before guaranteed",
    "tags": [
      "JVM",
      "JMM",
      "Volatile",
      "Memory-Barrier",
      "Happens-Before"
    ]
  },
  {
    "id": "Q-JAVA-APP-02",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "JVM Heap, Metaspace & DirectByteBuffer",
    "question": "Cấu hình và sử dụng Netty / Java NIO DirectByteBuffer để streaming file lớn mà không làm bùng nổ Java Heap Space.",
    "scenarioContext": "Dịch vụ truyền phát tệp (File Streaming Gateway): Cần xử lý payload 2GB/request với bộ đệm ngoài Heap để tránh trigger Full GC.",
    "juniorTrap": "Nghĩ rằng DirectByteBuffer hoàn toàn do GC quản lý tự động như byte[] thông thường trên heap.",
    "seniorSolution": "DirectByteBuffer cấp phát bộ nhớ ngoài heap thông qua Unsafe.allocateMemory(). JVM chỉ thu hồi native memory khi PhantomReference cleaner được trigger bởi GC cycle.",
    "practicalProof": "ByteBuffer buffer = ByteBuffer.allocateDirect(1024 * 1024); // Native off-heap memory\n// Explicitly clean via Cleaner or rely on bounded direct pool",
    "tags": [
      "JVM-Memory",
      "Metaspace",
      "Off-Heap",
      "DirectByteBuffer",
      "Leak"
    ]
  },
  {
    "id": "Q-JAVA-APP-03",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Garbage Collection Algorithms (G1, ZGC)",
    "question": "Cấu hình tham số G1 GC cho microservice yêu cầu p99 latency dưới 50ms khi xử lý khối lượng request biến động mạnh.",
    "scenarioContext": "Microservice thanh toán thẻ trực tuyến: Yêu cầu SLA P99.9 latency dưới 10ms, không được phép có GC pause quá 5ms trên Heap 32GB.",
    "juniorTrap": "Chỉ set -Xmx và -Xms bằng nhau, không cấu hình -XX:MaxGCPauseMillis và -XX:InitiatingHeapOccupancyPercent (IHOP).",
    "seniorSolution": "G1 chia heap thành các regions (1MB-32MB). Cần đặt -XX:MaxGCPauseMillis=40 và -XX:G1ReservePercent=15 để GC có đủ không gian dự phòng trước khi phải fallback sang Full GC Serial.",
    "practicalProof": "java -XX:+UseG1GC -XX:MaxGCPauseMillis=40 -XX:InitiatingHeapOccupancyPercent=45 -XX:G1ReservePercent=15 -jar app.jar",
    "tags": [
      "GC",
      "G1GC",
      "ZGC",
      "Stop-The-World",
      "Humongous-Allocation"
    ]
  },
  {
    "id": "Q-JAVA-APP-04",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "AbstractQueuedSynchronizer (AQS) & Locks",
    "question": "Triển khai giải thuật ReentrantLock tryLock với timeout an toàn để phòng tránh Deadlock khi acquiring nhiều tài nguyên.",
    "scenarioContext": "Thư viện hạ tầng nội bộ: Thiết kế ReadWriteLock tùy biến và cơ chế chờ hàng đợi FIFO cho 5,000 concurrent workers.",
    "juniorTrap": "Dùng synchronized lồng nhau và không bao giờ release lock trong block finally.",
    "seniorSolution": "tryLock(timeout, unit) dựa trên AQS Node parking và CAS state. Luôn acquire locks theo thứ tự toàn cục (global ordering) hoặc dùng backoff retry khi một lock thất bại.",
    "practicalProof": "if (lockA.tryLock(500, TimeUnit.MILLISECONDS)) {\n  try {\n    if (lockB.tryLock(500, TimeUnit.MILLISECONDS)) {\n      try { /* work */ } finally { lockB.unlock(); }\n    }\n  } finally { lockA.unlock(); }\n}",
    "tags": [
      "AQS",
      "ReentrantLock",
      "CAS",
      "SpinLock",
      "Fair-vs-Unfair"
    ]
  },
  {
    "id": "Q-JAVA-APP-05",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "ConcurrentHashMap & Treeification Under the Hood",
    "question": "Áp dụng hàm computeIfAbsent của ConcurrentHashMap để tính toán và cache giá trị chỉ đúng 1 lần duy nhất trong môi trường concurrent.",
    "scenarioContext": "Dịch vụ tra cứu phiên đăng nhập (Session Cache): Lưu trữ 10 triệu active sessions trong RAM với tần suất đọc/ghi đồng thời cực cao.",
    "juniorTrap": "Viết kiểu map.get(k) == null then map.put(k, v) - đây là lỗi Check-Then-Act kinh điển gây race condition tạo duplicate objects.",
    "seniorSolution": "computeIfAbsent thực hiện khóa trên từng head node (bin lock) bằng synchronized node và CAS. Đảm bảo hàm lambda chỉ được execute chính xác 1 lần mà không khóa toàn bộ Map.",
    "practicalProof": "ConcurrentMap<String, HeavyResource> cache = new ConcurrentHashMap<>();\nHeavyResource res = cache.computeIfAbsent(key, k -> loadHeavyFromDb(k));",
    "tags": [
      "ConcurrentHashMap",
      "Treeification",
      "RedBlackTree",
      "CAS",
      "Synchronized"
    ]
  },
  {
    "id": "Q-JAVA-APP-06",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "ThreadLocal Memory Leaks in ThreadPools",
    "question": "Triển khai gán và giải phóng SecurityContext hoặc TenantContext trong ThreadLocal khi chạy trên Tomcat worker pool.",
    "scenarioContext": "Filter xác thực bảo mật: Lưu trữ UserContext và TenantId trong phạm vi từng request để các tầng service truy xuất an toàn.",
    "juniorTrap": "Gán context vào ThreadLocal trong Filter nhưng quên remove() trong block finally.",
    "seniorSolution": "Thread trong thread pool (Tomcat, ForkJoinPool) không bao giờ chết. Thread.threadLocals giữ Entry (WeakReference key, StrongReference value). Nếu không remove(), value sẽ tồn tại vĩnh viễn trên heap!",
    "practicalProof": "try {\n  TenantContext.set(tenantId);\n  chain.doFilter(req, resp);\n} finally {\n  TenantContext.remove(); // MANDATORY TO PREVENT POOL CONTAMINATION\n}",
    "tags": [
      "ThreadLocal",
      "ThreadPool",
      "Memory-Leak",
      "Tomcat-Worker",
      "ClassLoader"
    ]
  },
  {
    "id": "Q-JAVA-APP-07",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "ThreadPoolExecutor Sizing & Saturation Policies",
    "question": "Cấu hình ThreadPoolExecutor cho tác vụ I/O bound (gọi 4 microservices downstream) với hàng đợi có giới hạn (bounded queue).",
    "scenarioContext": "Hệ thống xử lý đơn hàng: Cần định cỡ ThreadPool (Core/Max/Queue) theo định luật Little's Law để đáp ứng 5,000 RPS mà không sập RAM.",
    "juniorTrap": "Dùng Executors.newFixedThreadPool() với hàng đợi LinkedBlockingQueue vô hạn (Integer.MAX_VALUE), gây OutOfMemoryError khi downstream bị chậm.",
    "seniorSolution": "Áp dụng công thức Little's Law: Threads = Target_RPS * Latency_seconds. Dùng ArrayBlockingQueue có capacity cố định (e.g., 500) và RejectedExecutionHandler = CallerRunsPolicy để tạo backpressure tự nhiên.",
    "practicalProof": "new ThreadPoolExecutor(32, 64, 60L, TimeUnit.SECONDS,\n  new ArrayBlockingQueue<>(500),\n  new ThreadFactoryBuilder().setNameFormat(\"order-io-%d\").build(),\n  new ThreadPoolExecutor.CallerRunsPolicy());",
    "tags": [
      "ThreadPool",
      "Executor",
      "CallerRunsPolicy",
      "BoundedQueue",
      "CPU-Bound"
    ]
  },
  {
    "id": "Q-JAVA-APP-08",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "CompletableFuture Pipeline & Exception Propagation",
    "question": "Xây dựng pipeline gọi đồng thời 3 API độc lập, gom kết quả với CompletableFuture.allOf() và fallback an toàn khi 1 API lỗi.",
    "scenarioContext": "BFF (Backend-For-Frontend) Service: Gọi song song 5 downstream APIs (User, Inventory, Pricing, Payment, Promo) và gộp kết quả.",
    "juniorTrap": "Gọi .join() hoặc .get() ngay sau từng future đơn lẻ, làm mất hoàn toàn tính năng song song bất đồng bộ.",
    "seniorSolution": "Dùng allOf() kết hợp exceptionally() trên từng sub-future để cô lập lỗi. Dùng custom executor thay vì mặc định ForkJoinPool.commonPool() để tránh làm nghẽn các tác vụ Java runtime khác.",
    "practicalProof": "CompletableFuture<ResultA> fA = CompletableFuture.supplyAsync(() -> callA(), ioPool).exceptionally(ex -> fallbackA());\nCompletableFuture.allOf(fA, fB).thenRun(() -> merge(fA.join(), fB.join()));",
    "tags": [
      "CompletableFuture",
      "Async",
      "Exceptionally",
      "ForkJoinPool",
      "Pipeline"
    ]
  },
  {
    "id": "Q-JAVA-ANA-09",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Virtual Threads (Project Loom) & Carrier Pinning",
    "question": "Phân tích nguyên nhân throughput của Virtual Threads sụt giảm nghiêm trọng khi ứng dụng gọi qua thư viện JDBC legacy cũ.",
    "scenarioContext": "Production Anomaly: Throughput sụt giảm 80% khi dùng Virtual Threads vì mã nguồn cũ chứa synchronized blocks gọi ra database (Carrier Pinning).",
    "juniorTrap": "Nghĩ Virtual Threads có bug và không scalable bằng Reactive WebFlux.",
    "seniorSolution": "Hiện tượng Carrier Thread Pinning: Khi Virtual Thread thực hiện blocking I/O bên trong một khối synchronized hoặc native frame, nó ghim chặt vào Carrier OS thread, khiến Carrier thread không thể phục vụ Virtual threads khác.",
    "practicalProof": "java -Djdk.tracePinnedThreads=full -jar app.jar\n// Pinning trace shows: Parking to wait for monitor lock inside java.lang.Object.wait",
    "tags": [
      "VirtualThreads",
      "Loom",
      "Carrier-Pinning",
      "Synchronized",
      "ReentrantLock"
    ]
  },
  {
    "id": "Q-JAVA-ANA-10",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Atomic Variables, CAS & False Sharing (@Contended)",
    "question": "Phân tích hiện tượng False Sharing làm giảm hiệu năng đa luồng dù các worker threads cập nhật các biến hoàn toàn độc lập.",
    "scenarioContext": "Performance Bottleneck: CPU đạt 95% do Cache Line Bouncing liên tục giữa các Cores khi cập nhật 2 biến biến độc lập nằm chung 64-byte line.",
    "juniorTrap": "Nghĩ rằng mỗi biến primitive int/long nằm trên các ô nhớ riêng biệt nên không ảnh hưởng nhau.",
    "seniorSolution": "CPU nạp dữ liệu từ RAM theo từng Cache Line (chuẩn 64 bytes). Nếu hai biến độc lập nằm chung 1 cache line 64-byte, khi Core 1 ghi biến A, nó lập tức invalidate toàn bộ cache line của Core 2 đang đọc biến B (MESI cache protocol)!",
    "practicalProof": "// Solution: JDK @jdk.internal.vm.annotation.Contended or manual 64-byte padding bytes",
    "tags": [
      "AtomicLong",
      "LongAdder",
      "False-Sharing",
      "CPU-CacheLine",
      "Contended"
    ]
  },
  {
    "id": "Q-JAVA-ANA-11",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Java Collections Fail-Fast vs Weakly Consistent",
    "question": "Mổ xẻ nguyên nhân ConcurrentModificationException phát sinh trong vòng lặp single-thread khi xóa phần tử khỏi ArrayList.",
    "scenarioContext": "Production Bug: Ném ConcurrentModificationException ngẫu nhiên trên luồng nền khi một thread thêm phần tử vào ArrayList đang được duyệt.",
    "juniorTrap": "Đổ lỗi cho đa luồng ngầm nào đó của JVM can thiệp vào ArrayList.",
    "seniorSolution": "ArrayList sử dụng biến modCount. Vòng lặp foreach dịch thành Iterator. Khi gọi list.remove(item), modCount tăng lên nhưng expectedModCount của Iterator không đổi. Bước lặp kế tiếp kiểm tra modCount != expectedModCount lập tức ném exception!",
    "practicalProof": "// Fix: iterator.remove() or list.removeIf(predicate) which synchronizes internal indexes",
    "tags": [
      "Collections",
      "ConcurrentModificationException",
      "Fail-Fast",
      "CopyOnWrite"
    ]
  },
  {
    "id": "Q-JAVA-ANA-12",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "ClassLoader Delegation Hierarchy & ClassNotFound vs NoClassDefFound",
    "question": "Phân tích tại sao hai instance cùng load từ một file .class lại không thể cast cho nhau (ClassCastException) trong runtime.",
    "scenarioContext": "Deployment Failure: Sau khi cập nhật thư viện qua CI/CD, ứng dụng khởi động thất bại với lỗi NoClassDefFoundError dù tệp JAR đã nằm trong classpath.",
    "juniorTrap": "Nghĩ rằng bytecode bị hỏng hoặc JVM bị bug.",
    "seniorSolution": "Trong JVM, danh tính của một Type được xác định bởi tuple: [Fully Qualified Class Name + Defining ClassLoader Instance]. Nếu hai ClassLoader khác nhau nạp cùng 1 class file, JVM xem chúng là hai kiểu dữ liệu hoàn toàn khác biệt!",
    "practicalProof": "// (MyInterface) obj throws ClassCastException because obj.getClass().getClassLoader() != currentClassLoader",
    "tags": [
      "ClassLoader",
      "NoClassDefFoundError",
      "ClassNotFoundException",
      "Bytecode"
    ]
  },
  {
    "id": "Q-JAVA-ANA-13",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Java 17/21 Records, Pattern Matching & Sealed Classes",
    "question": "Phân tích tác động của Record Components đối với Reflection và Serialization Security so với POJO JavaBeans truyền thống.",
    "scenarioContext": "Refactoring Challenge: Xử lý cây kế thừa nhiều nhánh lộn xộn với if-instanceof dẫn đến việc bỏ sót trường hợp khi thêm trạng thái nghiệp vụ mới.",
    "juniorTrap": "Nghĩ Record chỉ là cú pháp viết tắt của Lombok @Data.",
    "seniorSolution": "Record không thể bị can thiệp qua Reflection để sửa trường (final fields không thể gán lại ngay cả khi setAccessible(true)). Khi serialize, JVM ép buộc invoke Canonical Constructor, ngăn chặn việc tạo ra các đối tượng có trạng thái bất hợp lệ qua deserialization attack.",
    "practicalProof": "// Decompiled Record: JVM enforces canonical constructor invocation during readObject()",
    "tags": [
      "Java21",
      "Records",
      "Pattern-Matching",
      "Sealed-Classes",
      "Immutability"
    ]
  },
  {
    "id": "Q-JAVA-ANA-14",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Serialization Vulnerabilities & Externalizable",
    "question": "Phân tích rủi ro Deserialization Bombs khi ứng dụng đọc các nested hash objects bị băm trùng lặp.",
    "scenarioContext": "Security Audit: Quét lỗ hổng phát hiện ứng dụng sử dụng Java Native Deserialization nhận payload không tin cậy từ client (Gadget Chain RCE).",
    "juniorTrap": "Cho rằng dữ liệu JSON hoặc binary object nếu không có gadget class thì không thể làm sập CPU.",
    "seniorSolution": "Kẻ tấn công dựng payload cấu trúc cây đối tượng lồng nhau (e.g. Set of Sets có hash trùng lặp). Khi readObject() tính toán hashCode(), CPU phải duyệt O(2^N) thao tác băm đệ quy, làm CPU 100% vĩnh viễn gây Denial of Service (DoS)!",
    "practicalProof": "// Fix: Use SerialFilter (JEP 290) to enforce strict object depth and max graph size limits",
    "tags": [
      "Serialization",
      "Gadget-Chain",
      "RCE",
      "Externalizable",
      "Security"
    ]
  },
  {
    "id": "Q-JAVA-ANA-15",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "JIT Compilation, Tiered Inlining & Deoptimization",
    "question": "Phân tích hiện tượng Deoptimization Spike làm sập độ trễ ứng dụng khi một implementation mới bất ngờ được nạp vào runtime.",
    "scenarioContext": "Performance Mystery: Một hàm tính toán đang chạy với tốc độ 200,000 ops/s đột nhiên chậm lại 20 lần sau khi code có thêm một nhánh rẽ hiếm gặp.",
    "juniorTrap": "Nghĩ rằng JIT một khi đã compile sang machine code thì không bao giờ bị hủy bỏ.",
    "seniorSolution": "JIT biên dịch dựa trên suy đoán lạc quan (Optimistic Speculative Optimization). Khi có 1 class mới được load vi phạm giả định monomorphic, JIT buộc phải deoptimize (uncommon trap), chuyển ngược machine code về interpreter, gây khựng (stutter) hệ thống!",
    "practicalProof": "java -XX:+PrintCompilation -XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining -jar app.jar",
    "tags": [
      "JIT",
      "C1-C2",
      "Inlining",
      "Deoptimization",
      "Monomorphic"
    ]
  },
  {
    "id": "Q-JAVA-ANA-16",
    "domain": "Core Java & Concurrency",
    "domainCode": "JAVA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Stream Parallel Hazards & Spliterator Mechanics",
    "question": "Mổ xẻ nguyên nhân suy giảm hiệu năng nghiêm trọng khi gọi .parallelStream().filter().sorted() trên một LinkedList.",
    "scenarioContext": "Production Gridlock: Việc gọi .parallelStream() trong một API làm nghẽn toàn bộ ForkJoinPool.commonPool(), kéo sập các tác vụ nền khác của hệ thống.",
    "juniorTrap": "Kỳ vọng parallelStream() luôn tự động tăng tốc độ xử lý gấp số lần số core CPU.",
    "seniorSolution": "LinkedList có đặc tính Spliterator là SIZED nhưng KHÔNG SUBSIZED và không có index ngẫu nhiên. Khi trySplit(), LinkedList phải duyệt tuyến tính O(N) chỉ để tìm điểm giữa! Chi phí chia việc đắt hơn cả việc chạy tuần tự trên 1 thread!",
    "practicalProof": "// Spliterator benchmark: ArrayList splits O(1); LinkedList splits O(N) with high cache misses",
    "tags": [
      "Stream",
      "ParallelStream",
      "Spliterator",
      "ForkJoin",
      "CommonPool"
    ]
  },
  {
    "id": "Q-SPRING-APP-01",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Spring IoC Lifecycle & BeanPostProcessor Mechanics",
    "question": "Triển khai Custom BeanPostProcessor để tự động inject API credentials hoặc giải mã secret cho các annotated services.",
    "scenarioContext": "Framework nội bộ: Xây dựng Custom Annotation `@Auditable` tự động ghi nhận nhật ký trước và sau khi mọi service method thực thi.",
    "juniorTrap": "Thực hiện gọi RPC hoặc khởi tạo kết nối nặng nề bên trong postProcessBeforeInitialization làm chậm startup.",
    "seniorSolution": "postProcessBeforeInitialization chạy trước @PostConstruct và InitializingBean.afterPropertiesSet(). Cần giữ logic lightweight, không tạo bean dependency vòng tròn (circular dependency) khiến BeanCurrentlyInCreationException phát sinh.",
    "practicalProof": "@Component\npublic class SecretDecryptorBPP implements BeanPostProcessor {\n  @Override\n  public Object postProcessAfterInitialization(Object bean, String name) {\n    // Decrypt fields after complete dependency injection\n    return bean;\n  }\n}",
    "tags": [
      "Spring",
      "IoC",
      "BeanPostProcessor",
      "InitializingBean",
      "Lifecycle"
    ]
  },
  {
    "id": "Q-SPRING-APP-02",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Thực Hành & Áp Dụng",
    "theme": "@Transactional Rollback Rules & Self-Invocation Proxy Trap",
    "question": "Khắc phục lỗi transaction không rollback khi gọi phương thức @Transactional nội bộ (self-invocation) trong cùng một class.",
    "scenarioContext": "Dịch vụ Chuyển tiền Ngân hàng: Thực hiện trừ tiền tài khoản A và cộng tiền tài khoản B trong cùng một giao dịch đảm bảo tính nguyên tử ACID.",
    "juniorTrap": "Gọi this.updateBalance() và kỳ vọng Spring AOP proxy chặn được method invocation.",
    "seniorSolution": "Spring AOP dựa trên Dynamic Proxy (CGLIB/JDK). Lời gọi nội bộ qua 'this' không đi qua Proxy, hoàn toàn bỏ qua TransactionInterceptor. Cần inject self-reference, dùng TransactionTemplate hoặc tách hẳn sang Service class khác.",
    "practicalProof": "@Service\npublic class OrderService {\n  @Autowired private OrderService self; // or TransactionTemplate\n  public void processOrder() { self.executeInTx(); }\n  @Transactional(rollbackFor = Exception.class)\n  public void executeInTx() { /* transactional work */ }\n}",
    "tags": [
      "Spring",
      "Transactional",
      "AOP-Proxy",
      "Rollback",
      "Checked-Exception"
    ]
  },
  {
    "id": "Q-SPRING-APP-03",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Spring Security 6 SecurityFilterChain & JWT Auth Architecture",
    "question": "Thiết kế SecurityFilterChain trong Spring Security 6 với JWT authentication filter và stateless session management.",
    "scenarioContext": "Kiến trúc API Gateway Stateless: Cấu hình Spring Security 6 với JWT RSA-256 xác thực người dùng không lưu session trên server.",
    "juniorTrap": "Kế thừa WebSecurityConfigurerAdapter (đã bị xóa bỏ từ Spring Security 5.7/6.0).",
    "seniorSolution": "Spring Security 6 sử dụng SecurityFilterChain bean component-based. Phải tắt CSRF, đặt SessionCreationPolicy.STATELESS và add JWT filter trước UsernamePasswordAuthenticationFilter.",
    "practicalProof": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n  return http.csrf(AbstractHttpConfigurer::disable)\n    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))\n    .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)\n    .build();\n}",
    "tags": [
      "SpringSecurity",
      "SecurityFilterChain",
      "JWT",
      "OncePerRequestFilter",
      "FilterOrder"
    ]
  },
  {
    "id": "Q-SPRING-APP-04",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Thực Hành & Áp Dụng",
    "theme": "JPA/Hibernate N+1 Query & Dynamic EntityGraph Optimization",
    "question": "Loại bỏ hoàn toàn vấn đề N+1 Query khi query 10,000 Order entities kèm theo danh sách OrderItems và Customer thông tin.",
    "scenarioContext": "Trang hiển thị danh sách đơn hàng: Tải 50 đơn hàng cùng toàn bộ sản phẩm con (Items) và thông tin khách hàng (Customer) trong 1 request.",
    "juniorTrap": "Đổi Lazy Fetching thành Eager Fetching trong entity mapping (FetchType.EAGER) - đây là thảm họa làm nổ tung số câu query trong các use-case khác!",
    "seniorSolution": "Dùng JOIN FETCH trong JPQL hoặc @EntityGraph(attributePaths = {\"items\", \"customer\"}). Hibernate sẽ phát sinh đúng 1 câu SQL LEFT OUTER JOIN duy nhất để nạp đầy đủ dữ liệu.",
    "practicalProof": "@EntityGraph(attributePaths = {\"orderItems\", \"customer\"})\n@Query(\"SELECT o FROM Order o WHERE o.status = :status\")\nList<Order> findWithDetails(@Param(\"status\") OrderStatus status);",
    "tags": [
      "JPA",
      "Hibernate",
      "NPlus1",
      "EntityGraph",
      "JoinFetch"
    ]
  },
  {
    "id": "Q-SPRING-APP-05",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Thực Hành & Áp Dụng",
    "theme": "JPA First-Level & Second-Level Caching with Redis",
    "question": "Cấu hình Hibernate Second-Level Cache (L2) kết hợp Redisson để giảm 90% tải read queries vào PostgreSQL database.",
    "scenarioContext": "Hệ thống tra cứu sản phẩm E-Commerce: Tối ưu hóa lưu trữ đệm 2 tầng (Hibernate Session Cache + Redis L2 Cache) cho danh mục hàng triệu sản phẩm.",
    "juniorTrap": "Bật L2 cache cho các thực thể thường xuyên bị ghi (write-heavy entities) gây cache invalidation storm.",
    "seniorSolution": "L2 Cache phù hợp cho Reference Data (ít sửa, đọc nhiều). Cần đánh dấu @Cacheable và @Cache(usage = CacheConcurrencyStrategy.READ_WRITE). Cấu hình TTL và eviction chính xác để tránh đọc stale data.",
    "practicalProof": "@Entity\n@Cacheable\n@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE, region = \"catalogCache\")\npublic class ProductCatalog { ... }",
    "tags": [
      "JPA",
      "Hibernate",
      "SecondLevelCache",
      "L2-Cache",
      "Redis"
    ]
  },
  {
    "id": "Q-SPRING-APP-06",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Spring Boot Auto-Configuration & @Conditional Customization",
    "question": "Tạo một Custom Spring Boot Starter tái sử dụng nội bộ với điều kiện @ConditionalOnMissingBean và auto-configuration order.",
    "scenarioContext": "Starter Library dùng chung: Tạo thư viện auto-configuration tự động kết nối dịch vụ SMS Gateway khi có cấu hình và cho phép override Bean.",
    "juniorTrap": "Quên khai báo configuration class trong META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports.",
    "seniorSolution": "Spring Boot 3 không còn dùng spring.factories để nạp auto-configuration mà dùng AutoConfiguration.imports. Dùng @AutoConfiguration(after = DataSourceAutoConfiguration.class) để đảm bảo dependency graph chính xác.",
    "practicalProof": "@AutoConfiguration\n@ConditionalOnClass(DataSource.class)\npublic class TenantRoutingAutoConfiguration {\n  @Bean\n  @ConditionalOnMissingBean\n  public TenantResolver tenantResolver() { return new DefaultTenantResolver(); }\n}",
    "tags": [
      "SpringBoot",
      "AutoConfiguration",
      "ConditionalOnClass",
      "Starter"
    ]
  },
  {
    "id": "Q-SPRING-APP-07",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Spring Application Events & @TransactionalEventListener Phase",
    "question": "Gửi email xác nhận thanh toán hoặc publish Kafka event sau khi transaction lưu Database đã commit thành công 100%.",
    "scenarioContext": "Quy trình Đăng ký Tài khoản: Sau khi commit lưu User vào DB thành công, tự động bắn sự kiện gửi Email chào mừng và kích hoạt ví điểm thưởng.",
    "juniorTrap": "Dùng @EventListener thông thường bên trong transaction - nếu sau đó DB commit thất bại, email đã lỡ gửi đi (phantom action)!",
    "seniorSolution": "Sử dụng @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT). Lưu ý: Ở phase AFTER_COMMIT, connection DB đã đóng, nếu cố ghi thêm vào DB phải mở transaction mới với Propagation.REQUIRES_NEW.",
    "practicalProof": "@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)\npublic void handleOrderCreated(OrderCreatedEvent event) {\n  notificationClient.sendEmail(event.getCustomerEmail());\n}",
    "tags": [
      "SpringEvents",
      "TransactionalEventListener",
      "EventBus",
      "AFTER_COMMIT"
    ]
  },
  {
    "id": "Q-SPRING-APP-08",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Circuit Breaker (Resilience4j) & Bulkhead Isolation",
    "question": "Bảo vệ microservice gọi payment gateway bên thứ ba với Resilience4j Circuit Breaker sliding window và fallback.",
    "scenarioContext": "Tích hợp Cổng Thanh toán Đối tác: Cấu hình Circuit Breaker cắt mạch khi cổng thanh toán đối ngoại bị chậm, bảo vệ thread pool của ứng dụng.",
    "juniorTrap": "Cấu hình sliding window type dựa trên thời gian mà không tính đến volume request thấp, khiến breaker trip lung tung.",
    "seniorSolution": "Dùng COUNT_BASED sliding window (e.g. 100 calls), failureRateThreshold = 50%, waitDurationInOpenState = 10s. Kết hợp Semaphore Bulkhead để giới hạn tối đa 20 concurrent calls đến gateway, tránh làm cạn thread pool chính.",
    "practicalProof": "@CircuitBreaker(name = \"paymentService\", fallbackMethod = \"fallbackPayment\")\n@Bulkhead(name = \"paymentBulkhead\", type = Bulkhead.Type.SEMAPHORE)\npublic PaymentResponse pay(PaymentRequest req) { return restTemplate.postForObject(...); }",
    "tags": [
      "Resilience4j",
      "CircuitBreaker",
      "Bulkhead",
      "Fallback",
      "SlidingWindow"
    ]
  },
  {
    "id": "Q-SPRING-ANA-09",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Distributed Transactions with Transactional Outbox Pattern",
    "question": "Điều tra nguyên nhân bản ghi Outbox bị publish lặp lại hàng chục lần sang Kafka khiến consumer xử lý trùng lặp.",
    "scenarioContext": "Dual-Write Bug: Đơn hàng đã lưu vào MySQL nhưng tiến trình gửi Kafka bị đứt mạng giữa chừng, khiến hệ thống kho và giao vận không nhận được đơn.",
    "juniorTrap": "Khẳng định Kafka broker bị lỗi hoặc mạng bị chập chờn.",
    "seniorSolution": "Do Outbox publisher gửi Kafka thành công nhưng quá trình cập nhật trạng thái 'PROCESSED' vào database bị timeout hoặc crash. Consumer BẮT BUỘC phải là idempotent dựa trên Event UUID hoặc Message Deduplication key!",
    "practicalProof": "// Consumer Idempotency check: if (processedRepo.existsById(event.getId())) return; else process();",
    "tags": [
      "OutboxPattern",
      "DistributedTx",
      "Idempotency",
      "Debezium",
      "CDC"
    ]
  },
  {
    "id": "Q-SPRING-ANA-10",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Spring WebFlux Non-Blocking Reactive Streams vs MVC Thread-Pool",
    "question": "Chẩn đoán nguyên nhân ứng dụng WebFlux bị treo cứng hoàn toàn (Server Hang) sau khi chịu tải vài ngàn concurrent requests.",
    "scenarioContext": "Reactive Antipattern: Toàn bộ Netty event loop threads bị khóa cứng vì lập trình viên vô tình gọi phương thức blocking JDBC bên trong chuỗi phản ứng.",
    "juniorTrap": "Tăng kích thước Netty EventLoop thread pool lên 500 threads.",
    "seniorSolution": "Thread dump cho thấy tất cả Netty worker threads (reactor-http-nio-X) đều ở trạng thái BLOCKED hoặc WAITING trên socket read của một thư viện client blocking bên thứ ba. Nguyên tắc vàng: Tuyệt đối không block EventLoop!",
    "practicalProof": "BlockHound.install(); // JVM runtime agent automatically detects and flags blocking calls in Reactor",
    "tags": [
      "WebFlux",
      "Reactive",
      "ProjectReactor",
      "Backpressure",
      "NonBlocking"
    ]
  },
  {
    "id": "Q-SPRING-ANA-11",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "HikariCP Connection Pool Tuning & Leak Detection Schedulers",
    "question": "Mổ xẻ thông báo lỗi 'Connection leak detection triggered for ... on thread ...' trong production logs.",
    "scenarioContext": "Connection Pool Exhaustion: Sau 2 giờ chạy tải cao, API bắt đầu trả về lỗi `Connection is not available, request timed out after 30000ms`.",
    "juniorTrap": "Tăng leakDetectionThreshold lên 60 giây để che giấu log lỗi.",
    "seniorSolution": "Do code mở Connection / EntityManager thủ công mà quên close() trong finally block, hoặc do transaction thực hiện một HTTP REST call chậm chạp trong khi vẫn đang giữ chặt kết nối JDBC, làm cạn kiệt pool!",
    "practicalProof": "// Stack trace reveals: RestTemplate.exchange() invoked while active JDBC transaction holding connection",
    "tags": [
      "HikariCP",
      "ConnectionPool",
      "LeakDetection",
      "PostgreSQL",
      "Database"
    ]
  },
  {
    "id": "Q-SPRING-ANA-12",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Distributed Tracing with Micrometer & OpenTelemetry Tracers",
    "question": "Chẩn đoán nguyên nhân TraceId bị mất (trở thành mới hoàn toàn) khi request đi qua một @Async thread trong service.",
    "scenarioContext": "Tracing Blindspot: Nhật ký log trên Grafana Loki bị đứt đoạn, mất TraceId khi request chuyển qua luồng bất đồng bộ (@Async) hoặc Kafka consumer.",
    "juniorTrap": "Đổ lỗi cho OpenTelemetry collector không nhận được logs.",
    "seniorSolution": "ThreadLocal của Tracing Context không tự động truyền sang các worker threads mới. Cần cấu hình ContextSnapshot / TaskDecorator cho ThreadPoolTaskExecutor để snapshot và restore tracing context sang worker thread.",
    "practicalProof": "executor.setTaskDecorator(new ContextPropagatingTaskDecorator()); // Bridges Micrometer Observation",
    "tags": [
      "Micrometer",
      "OpenTelemetry",
      "TraceId",
      "SpanId",
      "W3C-TraceContext"
    ]
  },
  {
    "id": "Q-SPRING-ANA-13",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Dynamic Data Projections vs DTO Query Projections",
    "question": "Phân tích tại sao Spring Data Open Projection (dùng @Value SpEL) lại làm mất tác dụng tối ưu hóa câu SQL SELECT.",
    "scenarioContext": "Memory Inefficiency: Lập trình viên gọi `findAll()` nạp toàn bộ Entity kèm các trường LOB/CLOB nặng nề rồi mới map sang DTO trên tầng ứng dụng.",
    "juniorTrap": "Khen ngợi @Value SpEL projection vì có thể tính toán chuỗi linh hoạt mà không biết nó fetch toàn bộ entity.",
    "seniorSolution": "Closed Projection (chỉ có getters tương ứng với DB columns) cho phép JPA sinh selective SQL SELECT. Nhưng Open Projection với @Value(\"#{target.firstName + ' ' + target.lastName}\") ép Hibernate phải SELECT TOÀN BỘ CỘT của Entity để evaluate SpEL!",
    "practicalProof": "// Open projection forces full row loading: target.* evaluated via Spring Expression Language",
    "tags": [
      "SpringData",
      "Projections",
      "Performance",
      "DTO",
      "Selective-Loading"
    ]
  },
  {
    "id": "Q-SPRING-ANA-14",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Spring Cloud Gateway Reactive Filters & RateLimiter Integration",
    "question": "Điều tra nguyên nhân request bị trả về HTTP 429 Too Many Requests liên tục dù client chưa hề vượt ngưỡng quota.",
    "scenarioContext": "Security Bypass: Kẻ tấn công tạo hàng triệu request với IP giả mạo, làm tràn bộ nhớ Redis do Gateway lưu trữ key đếm không có TTL hết hạn.",
    "juniorTrap": "Đổi redis connection string sang server khác mà không kiểm tra Redis Key TTL.",
    "seniorSolution": "RedisRateLimiter dựa trên Token Bucket Lua script. Nếu KeyResolver trả về Mono.empty() hoặc null cho nhiều client, toàn bộ các client đó sẽ dùng chung một key mặc định '____anonymous____', làm cạn kiệt bucket chung ngay lập tức!",
    "practicalProof": "// KeyResolver must always return a stable distinct key: fallback to exchange.getRequest().getRemoteAddress()",
    "tags": [
      "SpringCloudGateway",
      "RateLimiter",
      "RedisRateLimiter",
      "Filters",
      "RouteLocator"
    ]
  },
  {
    "id": "Q-SPRING-ANA-15",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Spring Batch Chunk Architecture & Skip/Retry Policies",
    "question": "Phân tích hiện tượng ItemProcessor bị gọi lặp lại 2 lần cho cùng một item khi ItemWriter ném ra lỗi Database Transient Exception.",
    "scenarioContext": "Batch Crash: Toàn bộ quá trình chạy batch 4 tiếng đồng hồ bị hủy ngang và rollback sạch từ đầu chỉ vì 1 dòng dữ liệu bị sai định dạng ngày tháng.",
    "juniorTrap": "Nghĩ Spring Batch có bug tự duplicate công việc.",
    "seniorSolution": "Khi ItemWriter trong chunk 1,000 items bị ném Exception, Spring Batch không biết chính xác item nào gây lỗi. Nó rollback transaction và chia nhỏ chunk xuống từng item đơn lẻ (chunk-scan) để cô lập item lỗi, khiến ItemProcessor được gọi lại!",
    "practicalProof": "// ItemProcessor must be strictly idempotent and free of side effects (no external API calls)",
    "tags": [
      "SpringBatch",
      "ChunkProcessing",
      "SkipPolicy",
      "RetryPolicy",
      "JobExecution"
    ]
  },
  {
    "id": "Q-SPRING-ANA-16",
    "domain": "Spring Boot Ecosystem",
    "domainCode": "SPRING",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "GraalVM Native Image Ahead-of-Time (AOT) Reflection Pitfalls",
    "question": "Chẩn đoán lỗi NoSuchMethodException hoặc NullPointerException chỉ xuất hiện khi chạy binary Native Image nhưng chạy bình thường trên JVM.",
    "scenarioContext": "Runtime Failure: Ứng dụng biên dịch native thành công nhưng khi chạy ném NullPointerException vì thiếu cấu hình Reflection metadata cho Jackson.",
    "juniorTrap": "Đổi lại image sang OpenJDK truyền thống và bỏ cuộc với Native Image.",
    "seniorSolution": "Do GraalVM AOT compiler đã loại bỏ (dead-code elimination) các constructor hoặc methods không được gọi trực tiếp trong mã nguồn. Cần dùng GraalVM Tracing Agent (java -agentlib:native-image-agent=config-output-dir=...) để auto-generate metadata.",
    "practicalProof": "java -agentlib:native-image-agent=config-output-dir=src/main/resources/META-INF/native-image -jar app.jar",
    "tags": [
      "GraalVM",
      "NativeImage",
      "AOT",
      "ReflectionConfig",
      "StartupTime"
    ]
  },
  {
    "id": "Q-GIT-APP-01",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Git Object Model (Blobs, Trees, Commits, Annotated Tags)",
    "question": "Kiểm tra và truy vết nội dung cấu trúc bên trong của một Git Commit bằng các câu lệnh cấp thấp (Plumbing Commands).",
    "scenarioContext": "Kiểm toán kho mã nguồn nội bộ: Kiểm tra cấu trúc phân cấp băm SHA-1/SHA-256 của các đối tượng Git trong thư mục `.git/objects`.",
    "juniorTrap": "Chỉ biết các câu lệnh Porcelain như git log, git status mà không hiểu mô hình directed acyclic graph (DAG) của Git.",
    "seniorSolution": "Git lưu trữ mọi thứ trong .git/objects/ dưới dạng zlib-compressed objects: blob (nội dung file), tree (thư mục chứa pointers đến blobs/trees), commit (pointer đến root tree + parents + metadata).",
    "practicalProof": "git cat-file -p HEAD # Show commit object\ngit cat-file -t <hash> # Show object type (commit/tree/blob)",
    "tags": [
      "GitInternals",
      "Blob",
      "Tree",
      "Commit",
      "SHA-1"
    ]
  },
  {
    "id": "Q-GIT-APP-02",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Interactive Rebase, Fixup & Autosquash Workflow",
    "question": "Áp dụng git rebase -i --autosquash để gộp các commit 'fix typo' hoặc 'fix test' vào commit gốc trước khi mở Pull Request.",
    "scenarioContext": "Quy trình chuẩn bị Pull Request: Gộp 12 commits nháp ('fix typo', 'debug', 'wip') thành 2 commits sạch sẽ, có ý nghĩa trước khi merge vào main.",
    "juniorTrap": "Push hàng chục commit rác như 'wip', 'fix test again', 'done' lên branch chính làm bẩn lịch sử git.",
    "seniorSolution": "Tạo commit sửa đổi với cú pháp `git commit --fixup <commit-hash>`. Sau đó chạy `git rebase -i --autosquash <base-branch>`. Git sẽ tự động sắp xếp lại các commit fixup ngay sau commit gốc và thực hiện gộp (squash) mà không cần chỉnh tay.",
    "practicalProof": "git commit --fixup c4a1b2c\ngit rebase -i --autosquash origin/main",
    "tags": [
      "GitRebase",
      "Autosquash",
      "Fixup",
      "CleanHistory",
      "CommitHygiene"
    ]
  },
  {
    "id": "Q-GIT-APP-03",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Three-Way Merge Conflicts & Diff3 Resolution",
    "question": "Cấu hình Git conflictstyle = diff3 để hiển thị thêm base version gốc giúp giải quyết triệt để các merge conflict phức tạp.",
    "scenarioContext": "Phát triển tính năng song song: Giải quyết xung đột mã nguồn phức tạp tại tệp cấu hình cốt lõi khi 2 nhánh cùng sửa chung một đoạn code.",
    "juniorTrap": "Chỉ nhìn <<<<<<< HEAD và >>>>>>> branch mà không biết trạng thái dòng code gốc trước khi cả 2 bên cùng sửa.",
    "seniorSolution": "Mặc định Git chỉ hiển thị 2 phiên bản (ours vs theirs). Bật diff3 bổ sung khối ||||||| merged common ancestors, giúp lập trình viên biết chính xác cả hai lập trình viên đã thay đổi những gì từ dòng code ban đầu.",
    "practicalProof": "git config --global merge.conflictstyle diff3\n// Now conflict view shows: <<<<<<< HEAD / ||||||| base / ======= / >>>>>>> incoming",
    "tags": [
      "GitMerge",
      "ConflictResolution",
      "Diff3",
      "MergeConflicts",
      "ThreeWayMerge"
    ]
  },
  {
    "id": "Q-GIT-APP-04",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Cherry-Pick Hazards & Duplicate Commit Identification",
    "question": "Cherry-pick một hotfix commit quan trọng từ release branch sang master branch và ghi lại provenance hash gốc.",
    "scenarioContext": "Quy trình vá lỗi khẩn cấp (Hotfix): Đưa đúng 1 commit sửa lỗi bảo mật từ nhánh `main` sang nhánh phát hành cũ `release/v2.1` mà không kéo theo code khác.",
    "juniorTrap": "Chạy git cherry-pick <hash> mà không thêm cờ -x, khiến sau này không ai biết commit này được lấy từ đâu.",
    "seniorSolution": "Dùng `git cherry-pick -x <hash>` để Git tự động append chuỗi `(cherry picked from commit <hash>)` vào commit message. Giúp việc truy vết kiểm toán và đối soát patch giữa các release branches minh bạch.",
    "practicalProof": "git cherry-pick -x a1b2c3d\n// Generates: (cherry picked from commit a1b2c3d4e5f6...)",
    "tags": [
      "CherryPick",
      "DuplicateCommits",
      "PatchApplication",
      "GitCherry"
    ]
  },
  {
    "id": "Q-GIT-APP-05",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Git Bisect Automated Bug Isolation with Test Scripts",
    "question": "Tự động hóa git bisect kết hợp với test script để cô lập chính xác commit gây ra bug hồi quy (regression) giữa 1,000 commits.",
    "scenarioContext": "Truy tìm lỗi hồi quy (Regression Bug): Tìm chính xác commit gây ra lỗi trong kho mã nguồn có hơn 1,500 commits giữa phiên bản v3.0 và v3.4.",
    "juniorTrap": "Duyệt thủ công bằng mắt từng commit một trong hàng trăm commits.",
    "seniorSolution": "Git Bisect thực hiện tìm kiếm nhị phân O(log N). Chỉ cần cung cấp 1 commit tốt (good) và 1 commit xấu (bad), sau đó chạy `git bisect run ./test.sh`. Git sẽ tự checkout và chạy test, tìm ra commit thủ phạm chỉ trong 10 bước lặp!",
    "practicalProof": "git bisect start HEAD v2.1.0\ngit bisect run ./mvnw test -Dtest=OrderPaymentRegressionTest\ngit bisect reset",
    "tags": [
      "GitBisect",
      "BinarySearch",
      "AutomatedTesting",
      "Debugging",
      "Regression"
    ]
  },
  {
    "id": "Q-GIT-APP-06",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Reflog Recovery for Lost Commits & Detached HEAD",
    "question": "Cứu lại toàn bộ công việc sau khi vô tình gõ nhầm lệnh `git reset --hard HEAD~5` xóa mất 5 commit chưa kịp push.",
    "scenarioContext": "Cứu hộ khẩn cấp: Lập trình viên chạy nhầm lệnh `git reset --hard` xóa mất 3 ngày code chưa kịp tạo branch dự phòng.",
    "juniorTrap": "Hoảng loạn xóa repo clone lại từ đầu và chấp nhận mất trắng toàn bộ code.",
    "seniorSolution": "Git không bao giờ xóa ngay lập tức các commit objects. Mọi di chuyển của HEAD đều được ghi lại trong Reference Log (reflog). Chỉ cần tra cứu commit hash trước cú reset trong reflog và reset/branch lại.",
    "practicalProof": "git reflog # Find hash before reset, e.g. HEAD@{1}\ngit reset --hard HEAD@{1} # OR git branch recovery-branch HEAD@{1}",
    "tags": [
      "GitReflog",
      "DataRecovery",
      "DetachedHead",
      "HardReset",
      "SafetyNet"
    ]
  },
  {
    "id": "Q-GIT-APP-07",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Git Submodules vs Monorepo Sparse Checkout",
    "question": "Cấu hình Git Sparse Checkout để chỉ clone và làm việc với duy nhất 1 thư mục /services/billing trong Monorepo 50GB.",
    "scenarioContext": "Quản lý thư viện chia sẻ: Tích hợp thư viện bảo mật dùng chung từ repository khác vào 5 microservices riêng biệt mà vẫn kiểm soát được phiên bản.",
    "juniorTrap": "Dùng Git Submodules và gặp ác mộng pointer detached HEAD mismatch giữa các repositories.",
    "seniorSolution": "Sử dụng Git Sparse-Checkout (cone mode). Giúp developer clone repo mà chỉ tải xuống cây thư mục cần thiết, giảm 95% thời gian checkout và tài nguyên đĩa so với clone đầy đủ.",
    "practicalProof": "git clone --no-checkout <repo-url> monorepo\ncd monorepo\ngit sparse-checkout init --cone\ngit sparse-checkout set services/billing\ngit checkout main",
    "tags": [
      "GitSubmodules",
      "SparseCheckout",
      "Monorepo",
      "PointerMismatch"
    ]
  },
  {
    "id": "Q-GIT-APP-08",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Git LFS (Large File Storage) Pointers & History Migration",
    "question": "Cấu hình Git LFS để quản lý các file models máy học (.bin, .onnx > 100MB) mà không làm phình to Git repository history.",
    "scenarioContext": "Dự án AI/Backend: Quản lý các file model 500MB và dataset lớn trong kho mã Git mà không làm phình kích thước clone repository.",
    "juniorTrap": "Thêm trực tiếp file 2GB vào repo rồi push - bị GitHub/GitLab reject do vượt quá file limit 100MB.",
    "seniorSolution": "Git LFS thay thế file binary trong Git repo bằng một con trỏ văn bản nhỏ (pointer file chứa SHA-256 hash và size). File binary thực tế được upload lên LFS storage server chuyên dụng qua HTTP/S3.",
    "practicalProof": "git lfs install\ngit lfs track \"*.onnx\"\ngit add .gitattributes\ngit add models/net.onnx && git commit -m \"Add model pointer\"",
    "tags": [
      "GitLFS",
      "LargeFiles",
      "PointerFiles",
      "GitAttributes",
      "Migration"
    ]
  },
  {
    "id": "Q-GIT-ANA-09",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Git Pre-Commit Hooks & Server-Side Push Verification",
    "question": "Điều tra sự cố bảo mật khi một private API token bị lọt lên public repository dù commit chứa secret đã bị xóa ngay sau đó 5 phút.",
    "scenarioContext": "Security Breach: API token của môi trường Production bị push công khai lên GitHub do lập trình viên bỏ qua pre-commit hook bằng `--no-verify`.",
    "juniorTrap": "Nghĩ rằng commit mới ghi đè là token đã biến mất khỏi Internet.",
    "seniorSolution": "Các bot quét tự động (crawlers) giám sát GitHub public event stream theo thời gian thực (real-time). Khi commit vừa push lên, secret đã bị thu thập chỉ trong vài giây. Biện pháp duy nhất: Thu hồi (Revoke) và đổi secret ngay lập tức!",
    "practicalProof": "// Action: Revoke compromised key immediately in Cloud IAM before attempting git history purge",
    "tags": [
      "GitHooks",
      "Husky",
      "PreCommit",
      "SecurityScanner",
      "SecretLeak"
    ]
  },
  {
    "id": "Q-GIT-ANA-10",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Fast-Forward vs Non-Fast-Forward Merge Commit Topology",
    "question": "Phân tích tình huống `git revert <merge-commit-hash>` ném lỗi 'fatal: commit ... is a merge but no -m option was given'.",
    "scenarioContext": "Spaghetti History: Nhánh `main` có đồ thị commit rối như tơ vò (Diamond graph) khiến việc audit hoặc rollback một phiên bản trở nên bất khả thi.",
    "juniorTrap": "Gõ bừa -m 1 mà không hiểu parent number 1 và parent number 2 trỏ về nhánh nào.",
    "seniorSolution": "Merge commit có từ 2 parent trở lên. Khi revert, Git cần biết nhánh nào được giữ lại làm mainline baseline. `-m 1` giữ lại nhánh đích (thường là main), loại bỏ các thay đổi của nhánh feature đã merge vào.",
    "practicalProof": "git revert -m 1 <merge-commit-sha> # Reverts changes introduced by feature branch relative to mainline",
    "tags": [
      "FastForward",
      "MergeCommit",
      "TrunkBased",
      "LinearHistory",
      "GitBranching"
    ]
  },
  {
    "id": "Q-GIT-ANA-11",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Detached HEAD State Troubleshooting & Branch Pointers Rescue",
    "question": "Chẩn đoán tại sao các commits được tạo trong trạng thái Detached HEAD bỗng nhiên biến mất sau 30 ngày.",
    "scenarioContext": "Lost Work: Lập trình viên commit 5 tính năng ở trạng thái Detached HEAD, sau đó checkout sang `main` và không thể tìm thấy code vừa viết ở đâu.",
    "juniorTrap": "Đổ lỗi cho Git bị mất dữ liệu ngẫu nhiên.",
    "seniorSolution": "Các commits không có bất kỳ branch hay tag nào trỏ tới được gọi là 'dangling commits' (hoặc unreachable objects). Sau chu kỳ reflog expire mặc định (30 ngày cho unreferenced objects), lệnh `git gc` tự động dọn dẹp và xóa sổ chúng!",
    "practicalProof": "git fsck --lost-found # Locate unreachable commits stored under .git/lost-found/commit",
    "tags": [
      "DetachedHEAD",
      "GitCheckout",
      "BranchPointer",
      "HEAD",
      "StateRecovery"
    ]
  },
  {
    "id": "Q-GIT-ANA-12",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Git Stash Branching, Popping & Untracked Files Recovery",
    "question": "Giải quyết tình huống `git stash pop` báo xung đột (conflict) và xóa mất stash index hay stash vẫn còn nguyên?",
    "scenarioContext": "Stash Collision: Chạy `git stash pop` bị xung đột dữ liệu nghiêm trọng, và stash cũ bị xóa mất khiến lập trình viên bối rối không thể hoàn tác.",
    "juniorTrap": "Nghĩ rằng stash đã bị xóa mất khỏi stash list khi có conflict.",
    "seniorSolution": "Khi `git stash pop` gặp merge conflict, Git cố ý GIỮ LẠI stash trong stash list (không xóa tự động) để bảo vệ dữ liệu developer. Sau khi giải quyết conflict xong, developer phải tự tay chạy `git stash drop` để dọn dẹp.",
    "practicalProof": "git status # Resolve conflicts\ngit stash drop stash@{0} # Manually drop after successful resolution",
    "tags": [
      "GitStash",
      "StashPop",
      "UntrackedFiles",
      "WIP",
      "ContextSwitching"
    ]
  },
  {
    "id": "Q-GIT-ANA-13",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Git Reset (Soft vs Mixed vs Hard) Index & Working Tree Impact",
    "question": "Phân tích tác động của lệnh `git checkout <commit> -- <file>` so với `git reset HEAD <file>`.",
    "scenarioContext": "Accidental Deletion: Chạy nhầm `git reset --hard HEAD~1` làm mất sạch toàn bộ file chưa được commit trong ngày làm việc mà không có backup.",
    "juniorTrap": "Nhầm lẫn giữa việc unstage file và việc ghi đè nội dung file trên đĩa.",
    "seniorSolution": "`git reset HEAD <file>` chỉ xóa file khỏi Staging Area (Index), giữ nguyên nội dung trong Working Tree. Trong khi `git checkout <commit> -- <file>` (hoặc `git restore`) GHI ĐÈ trực tiếp nội dung file trên đĩa bằng nội dung trong commit!",
    "practicalProof": "git restore --staged <file> # Modern safe equivalent to unstage without touching disk content",
    "tags": [
      "GitReset",
      "SoftReset",
      "MixedReset",
      "HardReset",
      "StagingArea"
    ]
  },
  {
    "id": "Q-GIT-ANA-14",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Rebase vs Merge Strategies in Trunk-Based Development",
    "question": "Điều tra tại sao một nhóm dự án bị tê liệt vì liên tục phải giải quyết xung đột khi merge các long-lived branches lớn vào nhau.",
    "scenarioContext": "Push Rejection: Lập trình viên rebase nhánh tính năng đã push lên remote, sau đó không thể push bình thường và lúng túng khi xử lý `git push --force`.",
    "juniorTrap": "Đổ lỗi cho git merge tool yếu kém.",
    "seniorSolution": "Vấn đề cốt lõi là Branching Anti-Pattern (nhánh sống quá lâu). Khi branch sống càng lâu, divergence giữa các branch tăng theo hàm mũ, dẫn đến 'Merge Hell'. Giải pháp: Feature Flags + Small PRs (< 200 lines) + Daily Integrations.",
    "practicalProof": "// Architectural fix: Adopt Feature Toggles and daily trunk-based merges instead of feature branches",
    "tags": [
      "TrunkBased",
      "GitRebase",
      "ContinuousIntegration",
      "FeatureBranch",
      "LinearGit"
    ]
  },
  {
    "id": "Q-GIT-ANA-15",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Git Garbage Collection (git gc) & Expired Reflog Pruning",
    "question": "Mổ xẻ nguyên nhân lệnh `git gc` thất bại với thông báo 'fatal: bad object ...' hoặc 'corrupt loose object'.",
    "scenarioContext": "Disk Exhaustion: Server Git nội bộ hết dung lượng ổ đĩa do lưu trữ hàng ngàn commit rác và nhánh đã bị xóa trong suốt 5 năm không dọn dẹp.",
    "juniorTrap": "Xóa toàn bộ thư mục .git và clone lại mà không điều tra nguyên nhân ổ cứng hoặc filesystem lỗi.",
    "seniorSolution": "Do đĩa cứng bị bad sector hoặc máy bị tắt đột ngột trong khi Git đang ghi file vào .git/objects. Dùng `git fsck --full` để xác định object bị hỏng. Có thể khôi phục object bị hỏng từ remote repo hoặc máy đồng nghiệp.",
    "practicalProof": "git fsck --full # Verifies the SHA-1 and the general structure of objects",
    "tags": [
      "GitGC",
      "Prune",
      "LooseObjects",
      "Packfiles",
      "Repack"
    ]
  },
  {
    "id": "Q-GIT-ANA-16",
    "domain": "Git & Repository Engineering",
    "domainCode": "GIT",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Cryptographic Commit Signing with GPG / SSH Keys",
    "question": "Phân tích rủi ro trong chuỗi cung ứng phần mềm khi một open-source repository chấp nhận commit không có chữ ký số.",
    "scenarioContext": "Impersonation Attack: Kẻ xấu cấu hình `git config user.name 'CTO'` và push mã độc vào repository mà không bị hệ thống CI/CD phát hiện.",
    "juniorTrap": "Cho rằng chỉ cần tài khoản GitHub có 2FA là commit đã an toàn tuyệt đối.",
    "seniorSolution": "Kẻ tấn công có thể tạo Pull Request giả mạo author của một maintainer nổi tiếng. Nếu CI/CD hoặc reviewer chỉ nhìn vào avatar/tên mà không kiểm tra chữ ký PGP/SSH, mã độc có thể được merge vào mainline âm thầm!",
    "practicalProof": "git verify-commit <commit-hash> # Cryptographically checks signature validity against trusted keyring",
    "tags": [
      "GitSecurity",
      "GPG",
      "SSH-Signing",
      "VerifiedBadge",
      "SupplyChainSecurity"
    ]
  },
  {
    "id": "Q-DOCKER-APP-01",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Multi-Stage Builds & Distroless Base Image Hardening",
    "question": "Thiết kế Dockerfile Multi-Stage cho Spring Boot 3 app để giảm image size từ 800MB xuống 150MB và loại bỏ toàn bộ shell/package manager.",
    "scenarioContext": "Tối ưu hóa hình ảnh container: Thu nhỏ Docker image Spring Boot từ 1.2GB (chứa JDK, Maven) xuống 120MB sử dụng Google Distroless JRE 21.",
    "juniorTrap": "Dùng image openjdk:17 nặng nề chứa cả Maven, curl, bash, compiler trong môi trường production.",
    "seniorSolution": "Stage 1 dùng eclipse-temurin:21-jdk để build maven fat jar hoặc trích xuất jdeps. Stage 2 dùng gcr.io/distroless/java21-debian12 chỉ chứa JRE tối thiểu, không có bash hay package manager, triệt tiêu 95% bề mặt tấn công CVE.",
    "practicalProof": "FROM eclipse-temurin:21-jdk AS builder\nWORKDIR /app\nCOPY . .\nRUN ./mvnw clean package -DskipTests\n\nFROM gcr.io/distroless/java21-debian12\nCOPY --from=builder /app/target/*.jar /app/app.jar\nUSER nonroot:nonroot\nENTRYPOINT [\"java\", \"-jar\", \"/app/app.jar\"]",
    "tags": [
      "Docker",
      "MultiStage",
      "Distroless",
      "ImageOptimization",
      "Security"
    ]
  },
  {
    "id": "Q-DOCKER-APP-02",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Linux Namespaces & cgroups v2 Resource Isolation",
    "question": "Giới hạn container tiêu thụ tối đa 2 CPU cores và 2GB RAM bằng Docker CLI và Docker Compose.",
    "scenarioContext": "Triển khai nền tảng đám mây: Phân bổ và cô lập tài nguyên CPU/RAM cho container trên Linux host sử dụng cơ chế cgroups v2 chuẩn xác.",
    "juniorTrap": "Không set memory limit, để container tự do chiếm dụng RAM làm kích hoạt Linux Kernel OOM Killer trên host node.",
    "seniorSolution": "Linux cgroups v2 (control groups) kiểm soát giới hạn tài nguyên (memory.max, cpu.max). Linux Namespaces (PID, Mount, Net, IPC, UTS, User) cô lập tầm nhìn hệ thống. Khi vượt memory limit, cgroup bắn tín hiệu OOM kill container mà không ảnh hưởng host.",
    "practicalProof": "docker run -d --name payment-service \\\n  --cpus=\"2.0\" \\\n  --memory=\"2g\" \\\n  --memory-swap=\"2g\" \\\n  my-payment-app:latest",
    "tags": [
      "Docker",
      "LinuxNamespaces",
      "cgroups-v2",
      "OOMKilled",
      "Isolation"
    ]
  },
  {
    "id": "Q-DOCKER-APP-03",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Thực Hành & Áp Dụng",
    "theme": "PID 1 Zombie Reaping & Tini Init Process Integration",
    "question": "Tích hợp Tini hoặc dumb-init làm PID 1 để thu gom (reap) các zombie processes và forward tín hiệu SIGTERM chuẩn xác.",
    "scenarioContext": "Container hóa tiến trình nền: Đảm bảo container chạy các script phụ trợ không làm rò rỉ tiến trình mồ côi (defunct processes) trong bảng PID của Linux.",
    "juniorTrap": "Chạy script bash hoặc command trực tiếp làm PID 1 khiến các child process con mồ côi (orphaned) trở thành zombies.",
    "seniorSolution": "Trong Linux, tiến trình PID 1 có 2 trách nhiệm đặc biệt: thu dọn zombie process khi parent chết và chuyển tiếp tín hiệu (signal routing). Một tiến trình ứng dụng thông thường không có cơ chế thu dọn zombie, dẫn đến cạn kiệt bảng Process Table của OS.",
    "practicalProof": "ENTRYPOINT [\"/usr/bin/tini\", \"--\", \"/entrypoint.sh\"]\n// Or via docker run flag:\ndocker run --init -d my-app:latest",
    "tags": [
      "Docker",
      "PID1",
      "ZombieProcesses",
      "Tini",
      "SignalHandling"
    ]
  },
  {
    "id": "Q-DOCKER-APP-04",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Docker Layer Caching Strategy & Cache Invalidation Traps",
    "question": "Tối ưu thứ tự các lệnh COPY trong Dockerfile để tái sử dụng tối đa Docker build cache, giảm thời gian build từ 5 phút xuống 10 giây.",
    "scenarioContext": "Tăng tốc CI/CD Pipeline: Sắp xếp thứ tự các chỉ thị Dockerfile để tái sử dụng tối đa bộ nhớ đệm layer dependencies, giảm thời gian build từ 10 phút xuống 30 giây.",
    "juniorTrap": "Đặt `COPY . .` ngay trên đầu Dockerfile trước khi cài đặt dependencies.",
    "seniorSolution": "Docker kiểm tra cache theo từng layer từ trên xuống dưới. Bất kỳ sự thay đổi file nào trong layer sẽ làm vô hiệu hóa (invalidate) cache của TẤT CẢ các layer phía sau. Phải COPY file khai báo dependency (pom.xml, package.json) và download offline trước, COPY source code sau cùng.",
    "practicalProof": "COPY pom.xml .\nRUN ./mvnw dependency:go-offline\n# Source code changes often, placed after dependency caching layer:\nCOPY src ./src\nRUN ./mvnw package -DskipTests",
    "tags": [
      "Docker",
      "LayerCaching",
      "BuildPerformance",
      "DockerfileOptimization"
    ]
  },
  {
    "id": "Q-DOCKER-APP-05",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Rootless Docker & Non-Root USER Security Constraints",
    "question": "Cấu hình Dockerfile chạy dưới quyền non-root user (UID 10001) với read-only root filesystem để ngăn chặn leo thang đặc quyền.",
    "scenarioContext": "Tuân thủ Kubernetes PodSecurityStandards (Restricted): Cấu hình Docker container chạy dưới danh tính người dùng không có đặc quyền (UID 10001).",
    "juniorTrap": "Chạy container với user root mặc định (UID 0), tạo nguy cơ bị Container Breakout chiếm quyền điều khiển host OS.",
    "seniorSolution": "Tạo dedicated system user và group không có home directory và login shell. Đổi quyền sở hữu thư mục app sang user này và khai báo chỉ thị USER. Bật cờ `--read-only` khi run container để hacker không thể ghi script mã độc vào filesystem.",
    "practicalProof": "RUN groupadd -g 10001 appgroup && \\\n    useradd -u 10001 -g appgroup -s /sbin/nologin appuser\nUSER 10001:10001\n# Run with: docker run --read-only --tmpfs /tmp my-secure-app",
    "tags": [
      "Docker",
      "Rootless",
      "SecurityHardening",
      "NonRootUser",
      "PrivilegeEscalation"
    ]
  },
  {
    "id": "Q-DOCKER-APP-06",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Thực Hành & Áp Dụng",
    "theme": "JVM Container Memory Awareness (-XX:MaxRAMPercentage)",
    "question": "Cấu hình JVM flags tối ưu cho Java 17/21 chạy trong Docker container có giới hạn 1GB RAM.",
    "scenarioContext": "Cấu hình bộ nhớ Java trong Kubernetes: Thiết lập cờ JVM để tự động nhận diện memory limit của Pod mà không cần hardcode cờ `-Xmx`.",
    "juniorTrap": "Hardcode `-Xmx750m` trong Dockerfile khiến không thể scale linh hoạt khi thay đổi container resource limits.",
    "seniorSolution": "Java 10+ có tính năng UseContainerSupport tự động nhận diện cgroups limit. Sử dụng `-XX:MaxRAMPercentage=75.0` để JVM tự động tính toán Heap = 75% container memory, dành 25% còn lại cho Metaspace, Thread Stacks và Native memory (Netty off-heap).",
    "practicalProof": "ENTRYPOINT [\"java\", \\\n  \"-XX:+UseContainerSupport\", \\\n  \"-XX:MaxRAMPercentage=75.0\", \\\n  \"-XX:+ExitOnOutOfMemoryError\", \\\n  \"-jar\", \"/app.jar\"]",
    "tags": [
      "Docker",
      "JVM",
      "MaxRAMPercentage",
      "Cgroups",
      "OOM"
    ]
  },
  {
    "id": "Q-DOCKER-APP-07",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Container HEALTHCHECK Directives & Graceful SIGTERM Handling",
    "question": "Khai báo chỉ thị HEALTHCHECK trong Dockerfile sử dụng Spring Boot Actuator /actuator/health endpoint.",
    "scenarioContext": "Định tuyến lưu lượng truy cập: Xây dựng lệnh HEALTHCHECK chuẩn xác kiểm tra tính sẵn sàng thực tế của ứng dụng Spring Boot trước khi nhận traffic.",
    "juniorTrap": "Dùng `curl` trong HEALTHCHECK khi container base image là distroless hoặc alpine stripped không có curl.",
    "seniorSolution": "HEALTHCHECK cho phép Docker daemon và orchestrator phát hiện container bị treo (deadlock/unresponsive) dù process vẫn đang sống. Đặt interval=15s, timeout=3s, retries=3, start-period=40s (cho JVM khởi động xong).",
    "practicalProof": "HEALTHCHECK --interval=15s --timeout=3s --start-period=40s --retries=3 \\\n  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1",
    "tags": [
      "Docker",
      "HEALTHCHECK",
      "GracefulShutdown",
      "SIGTERM",
      "KubernetesProbe"
    ]
  },
  {
    "id": "Q-DOCKER-APP-08",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Docker Network Drivers (Bridge, Host, Overlay) & DNS Resolution",
    "question": "Tạo user-defined bridge network để 2 containers kết nối với nhau bằng service name thay vì IP tĩnh.",
    "scenarioContext": "Thiết kế mạng dịch vụ: Kết nối các container database, redis và backend trong mạng user-defined bridge network với cơ chế phân giải tên miền tự động.",
    "juniorTrap": "Dùng default bridge network (`docker0`) và cố gắng ping nhau bằng tên container.",
    "seniorSolution": "Default bridge network KHÔNG hỗ trợ automatic DNS resolution giữa các containers (chỉ hỗ trợ legacy `--link`). User-defined bridge network kích hoạt Embedded DNS Server (127.0.0.11) của Docker, cho phép resolve tên container tự động.",
    "practicalProof": "docker network create app-net\ndocker run -d --net app-net --name db postgres:15\ndocker run -d --net app-net --name web -e DB_HOST=db my-web-app",
    "tags": [
      "DockerNetworking",
      "BridgeNetwork",
      "OverlayNetwork",
      "EmbeddedDNS",
      "DockerDNS"
    ]
  },
  {
    "id": "Q-DOCKER-ANA-09",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Volume Persistence, Bind Mounts & UID/GID File Permissions",
    "question": "Chẩn đoán lỗi 'Permission Denied' khi container ghi file vào thư mục mount từ host (Bind Mount).",
    "scenarioContext": "Permission Denied: Ứng dụng ném lỗi `java.io.IOException: Access is denied` khi ghi file vào mounted volume do lệch quyền UID giữa container và host OS.",
    "juniorTrap": "Chạy lệnh nguy hiểm `chmod -R 777` trên toàn bộ thư mục của host.",
    "seniorSolution": "Xảy ra do sự bất đối xứng giữa UID của user chạy bên trong container (e.g. UID 1001) và UID sở hữu thư mục trên host (e.g. root UID 0). Cần truyền flag `--user $(id -u):$(id -g)` khi chạy container để đồng bộ UID/GID.",
    "practicalProof": "docker run --user $(id -u):$(id -g) -v $(pwd)/logs:/app/logs my-app",
    "tags": [
      "DockerVolumes",
      "BindMounts",
      "FilePermissions",
      "UID-GID",
      "DataPersistence"
    ]
  },
  {
    "id": "Q-DOCKER-ANA-10",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Docker Compose Service Health Dependency Conditions",
    "question": "Điều tra nguyên nhân web service liên tục crash khi chạy `docker compose up` dù đã khai báo `depends_on: - db`.",
    "scenarioContext": "Crash on Startup: Backend API liên tục khởi động thất bại vì cố gắng kết nối cơ sở dữ liệu khi container database mới chỉ đang chạy script init.",
    "juniorTrap": "Đổ lỗi cho container web service bị bug kết nối.",
    "seniorSolution": "Khi container database vừa khởi động, process Postgres phải khởi tạo cluster và chạy init scripts mất vài giây. Trong lúc này cổng 5432 chưa mở hoặc từ chối kết nối. Web service khởi động ngay lập tức sẽ ném ConnectionRefusedException và crash!",
    "practicalProof": "// Fix: condition: service_healthy guarantees database is fully initialized",
    "tags": [
      "DockerCompose",
      "DependsOn",
      "ServiceHealth",
      "StartupOrder"
    ]
  },
  {
    "id": "Q-DOCKER-ANA-11",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Container Image Vulnerability Scanning (Trivy / Clair)",
    "question": "Phân tích tình huống Trivy quét ra 40 lỗ hổng CRITICAL trong base image ubuntu:latest và hướng xử lý của Senior Engineer.",
    "scenarioContext": "Deployment Block: Pipeline CI/CD bị chặn hoàn toàn vì Trivy phát hiện lỗ hổng nghiêm trọng trong gói thư viện hệ điều hành cơ sở mà đội ngũ không rõ cách khắc phục.",
    "juniorTrap": "Ngồi sửa tay từng package trong container bằng apt-get upgrade.",
    "seniorSolution": "Ubuntu image là general-purpose OS chứa hàng trăm packages không cần thiết cho runtime. Giải pháp kiến trúc: Chuyển sang Distroless hoặc Chainguard Images tối giản (zero-CVE images), loại bỏ hoàn toàn các package thừa thãi.",
    "practicalProof": "// Architectural Upgrade: Switch FROM ubuntu:latest TO cgr.dev/chainguard/jre:latest",
    "tags": [
      "Trivy",
      "VulnerabilityScanning",
      "CVE",
      "DevSecOps",
      "SecurityGate"
    ]
  },
  {
    "id": "Q-DOCKER-ANA-12",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Daemonless Containers with Podman vs Docker Engine",
    "question": "Chẩn đoán nguyên nhân Podman rootless không thể bind vào các cổng mạng thấp dưới 1024 (e.g. port 80, 443).",
    "scenarioContext": "Socket Incompatibility: Các công cụ kiểm thử tự động (như Testcontainers) không hoạt động được trên máy dev vì thiếu `/var/run/docker.sock` tiêu chuẩn.",
    "juniorTrap": "Chạy podman bằng `sudo` (phá vỡ hoàn toàn nguyên lý rootless).",
    "seniorSolution": "Nhân Linux quy định các cổng dưới 1024 là Privileged Ports, chỉ root mới được bind. Trong rootless mode, cần cấu hình sysctl `net.ipv4.ip_unprivileged_port_start = 80` hoặc map port cao (e.g. 8080:80) và dùng reverse proxy phía trước.",
    "practicalProof": "sudo sysctl -w net.ipv4.ip_unprivileged_port_start=80",
    "tags": [
      "Podman",
      "Daemonless",
      "Rootless",
      "SecurityArchitecture",
      "ForkExec"
    ]
  },
  {
    "id": "Q-DOCKER-ANA-13",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Container Logging Drivers, Log Rotation & Buffer Limits",
    "question": "Điều tra nguyên nhân ứng dụng bị sụt giảm 40% Throughput khi in hàng triệu dòng log console `System.out.println` trong container.",
    "scenarioContext": "Disk Full Emergency: Toàn bộ máy chủ sập nguồn vì file `/var/lib/docker/containers/...-json.log` phình to lên 180GB sau một đêm log bão lỗi.",
    "juniorTrap": "Đổ lỗi cho CPU hoặc mạng chậm.",
    "seniorSolution": "Standard output (stdout/stderr) trong container đi qua pipe vào Docker daemon. Mặc định kênh log này là blocking I/O: khi buffer log của daemon đầy, ứng dụng phải chờ (blocked on write) để daemon ghi log xuống đĩa. Cần bật chế độ non-blocking logging!",
    "practicalProof": "\"log-opts\": {\n  \"mode\": \"non-blocking\",\n  \"max-buffer-size\": \"4m\"\n}",
    "tags": [
      "DockerLogging",
      "LogRotation",
      "json-file",
      "DiskFull",
      "Syslog"
    ]
  },
  {
    "id": "Q-DOCKER-ANA-14",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "ENTRYPOINT vs CMD Differences (Exec vs Shell Form)",
    "question": "Phân tích tại sao biến môi trường `$PORT` không được evaluate khi viết `ENTRYPOINT [\"java\", \"-Dserver.port=$PORT\", \"-jar\", \"app.jar\"]`.",
    "scenarioContext": "Hung Process on Stop: Lệnh `docker stop` mất đúng 10 giây mới tắt được container vì Java chạy dưới `/bin/sh -c` không nhận được tín hiệu `SIGTERM`.",
    "juniorTrap": "Nghĩ biến môi trường không được truyền vào container.",
    "seniorSolution": "Exec form (JSON array `[\"...\"]`) gọi trực tiếp syscall `execve()`, hoàn toàn KHÔNG khởi chạy qua shell (/bin/sh). Do đó các cú pháp shell như variable expansion (`$VAR`), wildcards (`*`), pipes (`|`) sẽ không được thông dịch. Cần bọc qua shell nếu muốn expand biến.",
    "practicalProof": "ENTRYPOINT [\"sh\", \"-c\", \"java -Dserver.port=${PORT:-8080} -jar /app.jar\"]",
    "tags": [
      "ENTRYPOINT",
      "CMD",
      "ExecForm",
      "ShellForm",
      "ParameterPassing"
    ]
  },
  {
    "id": "Q-DOCKER-ANA-15",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Docker BuildKit Secret Mounts (--mount=type=secret)",
    "question": "Chẩn đoán lỗ hổng bảo mật khi hacker trích xuất được AWS Secret Key từ một public image đã build bằng chỉ thị `ENV AWS_SECRET_KEY=...`.",
    "scenarioContext": "Secret Leaked: Mã token GitHub cá nhân bị phát hiện công khai trong lịch sử layer (`docker history`) của image tải lên public registry.",
    "juniorTrap": "Nghĩ rằng chạy lệnh `RUN unset AWS_SECRET_KEY` ở layer sau là an toàn.",
    "seniorSolution": "Mọi biến khai báo bằng ENV đều được gắn cố định vào Image Config Manifest JSON. Lệnh unset trong RUN chỉ ảnh hưởng tới child process tạm thời, không thể xóa ENV khỏi manifest metadata của image. Kiểm tra bằng `docker inspect` sẽ thấy ngay lập tức!",
    "practicalProof": "docker inspect <image-id> | grep AWS_SECRET_KEY # Secret exposed in container config environment",
    "tags": [
      "BuildKit",
      "DockerSecrets",
      "BuildSecurity",
      "SecretLeakPrevention"
    ]
  },
  {
    "id": "Q-DOCKER-ANA-16",
    "domain": "Docker & Containerization",
    "domainCode": "DOCKER",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Container Port Binding, Ephemeral Ports & Port Exhaustion",
    "question": "Mổ xẻ nguyên nhân lệnh `docker run -p 80:80` thất bại với thông báo 'driver failed programming external connectivity on endpoint: iptables failed'.",
    "scenarioContext": "Socket Exhaustion: Container ném lỗi `java.net.NoRouteToHostException: Cannot assign requested address` do cạn kiệt dải cổng tạm thời (ephemeral ports).",
    "juniorTrap": "Khởi động lại toàn bộ server vật lý trong hoảng loạn.",
    "seniorSolution": "Xảy ra khi dịch vụ tường lửa (UFW hoặc firewalld) vừa được khởi động lại sau khi Docker daemon đã chạy. Khi firewall restart, nó xóa sạch các rules trong iptables DOCKER chain mà Docker daemon đã thiết lập. Cần restart lại Docker service để tái tạo chuỗi iptables.",
    "practicalProof": "sudo systemctl restart docker # Recreates Docker custom iptables chains and NAT rules",
    "tags": [
      "DockerPorts",
      "PortBinding",
      "EphemeralPorts",
      "TIME_WAIT",
      "iptables"
    ]
  },
  {
    "id": "Q-SQL-APP-01",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Thực Hành & Áp Dụng",
    "theme": "B+Tree Index Leaf Nodes, Depth & Leftmost Prefix Rule",
    "question": "Thiết kế Composite Index tối ưu (user_id, status, created_at) tuân thủ quy tắc Leftmost Prefix Rule cho bảng 50 triệu giao dịch.",
    "scenarioContext": "Tối ưu hóa câu truy vấn phức tạp: Thiết kế chỉ mục tổng hợp (Composite Index) trên các cột `(tenant_id, status, created_at)` tuân thủ quy tắc Leftmost Prefix.",
    "juniorTrap": "Tạo index đơn lẻ trên từng cột một (user_id riêng, status riêng) và kỳ vọng DB tự gộp index hiệu quả (Index Merge Bitmap scan chậm).",
    "seniorSolution": "B+Tree composite index sắp xếp theo thứ tự cột từ trái sang phải. Cột đẳng thức (=) phải đặt trước, cột điều kiện khoảng (range >, <, BETWEEN) phải đặt sau cùng. Một khi gặp điều kiện range, các cột phía sau trong index không thể dùng để tìm kiếm nhị phân được nữa.",
    "practicalProof": "CREATE INDEX idx_orders_user_status_created ON orders (user_id, status, created_at);\n-- Optimal query utilizes full index:\nSELECT * FROM orders WHERE user_id = 1001 AND status = 'COMPLETED' AND created_at >= '2026-01-01';",
    "tags": [
      "SQL",
      "BTreeIndex",
      "LeftmostPrefix",
      "CompositeIndex",
      "IndexingStrategy"
    ]
  },
  {
    "id": "Q-SQL-APP-02",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Thực Hành & Áp Dụng",
    "theme": "EXPLAIN ANALYZE Execution Plans: Index Scan vs Seq Scan",
    "question": "Phân tích và tối ưu hóa câu truy vấn chậm bằng EXPLAIN (ANALYZE, BUFFERS) trong PostgreSQL để giảm I/O Shared Hit Buffers.",
    "scenarioContext": "Đọc hiểu kế hoạch thực thi: Sử dụng `EXPLAIN (ANALYZE, BUFFERS)` để đo lường chi phí I/O thực tế và phát hiện nút thắt cổ chai của câu SQL chậm.",
    "juniorTrap": "Chỉ nhìn vào 'Total Cost' ước lượng trong EXPLAIN mà không chạy ANALYZE để đo thời gian thực thi thực tế (Actual Time).",
    "seniorSolution": "EXPLAIN ANALYZE thực thi câu query thực sự và trả về số row thực tế so với estimate của Planner. Cờ BUFFERS cho biết số block đọc từ Shared Buffer Cache hoặc disk read. Nếu actual rows chênh lệch quá lớn so với planner estimate, cần chạy ANALYZE cập nhật thống kê thống kê.",
    "practicalProof": "EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)\nSELECT * FROM transactions WHERE account_id = 'ACC-9988' ORDER BY id DESC LIMIT 20;",
    "tags": [
      "ExplainAnalyze",
      "QueryPlan",
      "SeqScan",
      "IndexScan",
      "CostEstimation"
    ]
  },
  {
    "id": "Q-SQL-APP-03",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Thực Hành & Áp Dụng",
    "theme": "ACID Isolation Levels & Phantom/Non-Repeatable Reads",
    "question": "Chọn cấp độ cô lập giao dịch (Transaction Isolation Level) chính xác để ngăn chặn hoàn toàn hiện tượng Lost Updates trong giao dịch rút tiền.",
    "scenarioContext": "Quy trình tài chính: Lựa chọn mức độ cô lập giao dịch phù hợp (Read Committed vs Repeatable Read vs Serializable) để ngăn ngừa hiện tượng đọc bóng ma (Phantom Reads).",
    "juniorTrap": "Để mặc định READ COMMITTED và thực hiện check balance sau đó update balance bằng 2 câu SQL riêng biệt mà không lock.",
    "seniorSolution": "Ở READ COMMITTED, hai transaction đọc đồng thời cùng số dư 100$, cả hai cùng rút 50$, transaction commit sau sẽ ghi đè kết quả của transaction trước (Lost Update). Cần dùng SERIALIZABLE, REPEATABLE READ hoặc SELECT ... FOR UPDATE (Pessimistic Locking).",
    "practicalProof": "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;\n-- Or atomic in-place update:\nUPDATE accounts SET balance = balance - 50 WHERE id = 101 AND balance >= 50;",
    "tags": [
      "ACID",
      "IsolationLevels",
      "DirtyRead",
      "PhantomRead",
      "RepeatableRead"
    ]
  },
  {
    "id": "Q-SQL-APP-04",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Row-Level Locks (X-Locks, S-Locks) & Deadlock Resolution",
    "question": "Thiết kế thứ tự acquire lock tài nguyên theo trật tự toàn cục (Global ID Ordering) để triệt tiêu hoàn toàn nguy cơ Deadlock khi chuyển tiền qua lại.",
    "scenarioContext": "Hệ thống kho hàng E-Commerce: Thiết kế thứ tự khóa tài nguyên chuẩn xác khi trừ tồn kho nhiều sản phẩm trong cùng một giỏ hàng để triệt tiêu Deadlock.",
    "juniorTrap": "Lock tài khoản nguồn trước, tài khoản đích sau (User A chuyển B đồng thời User B chuyển A sẽ gây Deadlock tức thì).",
    "seniorSolution": "Deadlock xảy ra khi có chu trình chờ vòng tròn (Circular Wait). Khắc phục bằng cách luôn luôn sắp xếp các ID tài nguyên cần khóa theo thứ tự tăng dần trước khi thực hiện SELECT FOR UPDATE.",
    "practicalProof": "Long firstLock = Math.min(fromAccId, toAccId);\nLong secondLock = Math.max(fromAccId, toAccId);\n// Query order: SELECT ... WHERE id = firstLock FOR UPDATE; then secondLock",
    "tags": [
      "Deadlock",
      "RowLocks",
      "ExclusiveLock",
      "SharedLock",
      "WaitLockGraph"
    ]
  },
  {
    "id": "Q-SQL-APP-05",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Optimistic (Version Column) vs Pessimistic (FOR UPDATE) Locking",
    "question": "Chọn giải pháp khóa phù hợp giữa Optimistic Locking (@Version) và Pessimistic Locking (SELECT FOR UPDATE) cho hệ thống bán vé xem phim.",
    "scenarioContext": "Hệ thống đặt vé xem phim: Lựa chọn giữa Khóa Lạc Quan (`@Version`) và Khóa Bi Quan (`SELECT ... FOR UPDATE`) khi xử lý hàng ngàn người cùng tranh mua 1 ghế VIP.",
    "juniorTrap": "Dùng Optimistic Locking cho trường hợp vé hot hàng ngàn người tranh mua 1 ghế duy nhất (gây 99% optimistic lock exception và tốn CPU retry).",
    "seniorSolution": "Optimistic Locking tốt cho Low Contention (ít xung đột, đọc nhiều hơn sửa). Khi Contention cực cao (Flash Sale, Hot Seat), Pessimistic Locking hoặc Atomic UPDATE `SET booked=true WHERE id=? AND booked=false` vượt trội vì không phải retry vòng lặp vô nghĩa.",
    "practicalProof": "-- Atomic decrement avoids lock contention overhead:\nUPDATE flash_sale_items SET stock = stock - 1 WHERE item_id = 99 AND stock > 0;",
    "tags": [
      "OptimisticLocking",
      "PessimisticLocking",
      "VersionColumn",
      "HighContention"
    ]
  },
  {
    "id": "Q-SQL-APP-06",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Table Partitioning (Range, List, Hash) & Partition Pruning",
    "question": "Triển khai Range Partitioning theo tháng (created_at) cho bảng Audit Logs 500 triệu records và xác minh tính năng Partition Pruning.",
    "scenarioContext": "Cơ sở dữ liệu lịch sử giao dịch: Phân vùng bảng 100 triệu dòng theo tháng (Range Partitioning) để tối ưu hóa truy vấn và xóa dữ liệu cũ tức thì bằng `DROP PARTITION`.",
    "juniorTrap": "Không kèm cột partitioning key vào Primary Key / Unique Constraints của bảng cha.",
    "seniorSolution": "PostgreSQL/MySQL yêu cầu mọi Unique Key và Primary Key phải chứa cột Partitioning Key. Partition Pruning cho phép query engine chỉ quét đúng phân vùng tháng cần tìm, bỏ qua hoàn toàn 95% dữ liệu của các phân vùng khác.",
    "practicalProof": "CREATE TABLE audit_logs (\n  id BIGSERIAL,\n  created_at TIMESTAMPTZ NOT NULL,\n  payload TEXT,\n  PRIMARY KEY (id, created_at)\n) PARTITION BY RANGE (created_at);\nCREATE TABLE logs_2026_01 PARTITION OF audit_logs FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');",
    "tags": [
      "Partitioning",
      "RangePartition",
      "PartitionPruning",
      "TimeWindow",
      "BigData"
    ]
  },
  {
    "id": "Q-SQL-APP-07",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Normalization (3NF) vs Denormalization Write Amplification",
    "question": "Đánh giá và phi chuẩn hóa (denormalize) có kiểm soát trường `customer_name` vào bảng Orders để tránh phép JOIN 3 bảng trong truy vấn danh sách đơn hàng.",
    "scenarioContext": "Thiết kế lược đồ cơ sở dữ liệu: Cân bằng giữa chuẩn hóa dữ liệu bậc 3 (3NF) để tránh dị thường cập nhật và phi chuẩn hóa (Denormalization) để tăng tốc độ đọc báo cáo.",
    "juniorTrap": "Phi chuẩn hóa vô tội vạ mà không có cơ chế đồng bộ hoặc bất biến dữ liệu, gây ra hiện tượng dữ liệu không nhất quán (Data Inconsistency).",
    "seniorSolution": "Phi chuẩn hóa là sự đánh đổi: tăng tốc độ đọc (loại bỏ JOIN), nhưng làm tăng chi phí ghi (Write Amplification) và dung lượng đĩa. Phù hợp nhất khi dữ liệu là bất biến theo thời gian (e.g. Tên khách hàng tại thời điểm đặt đơn hàng là lịch sử không đổi).",
    "practicalProof": "-- Snapshot pattern preserves historical truth:\nALTER TABLE orders ADD COLUMN buyer_snapshot_name VARCHAR(100);",
    "tags": [
      "Normalization",
      "3NF",
      "Denormalization",
      "WriteAmplification",
      "DataIntegrity"
    ]
  },
  {
    "id": "Q-SQL-APP-08",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Slow Query Logging, pg_stat_statements & Index Bloat",
    "question": "Kích hoạt và phân tích hiệu năng toàn diện cụm PostgreSQL production bằng extension pg_stat_statements để tìm top 5 câu SQL tốn CPU nhất.",
    "scenarioContext": "Giám sát hiệu năng Database: Kích hoạt `pg_stat_statements` để phát hiện top 5 câu truy vấn tiêu tốn nhiều thời gian CPU nhất trên toàn bộ máy chủ sản xuất.",
    "juniorTrap": "Chỉ dựa vào slow_query_log với ngưỡng cố định 1 giây (bỏ sót các câu query 50ms nhưng được gọi 10,000 lần/giây làm cạn CPU).",
    "seniorSolution": "pg_stat_statements gom nhóm các câu query theo chữ ký mẫu (query fingerprint) và ghi nhận: tổng số lần gọi, tổng thời gian CPU, số buffer đọc. Tập trung tối ưu câu query có `total_exec_time` lớn nhất, kể cả khi thời gian chạy mỗi lần của nó chỉ 5ms.",
    "practicalProof": "SELECT query, calls, total_exec_time, mean_exec_time, rows\nFROM pg_stat_statements\nORDER BY total_exec_time DESC\nLIMIT 5;",
    "tags": [
      "SlowQueryLog",
      "pg_stat_statements",
      "IndexBloat",
      "DatabaseProfiling"
    ]
  },
  {
    "id": "Q-SQL-ANA-09",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "HikariCP Connection Pool Formula (2 * CPU Cores + Disk Count)",
    "question": "Chẩn đoán hiện tượng Database CPU 100% nhưng số lượng giao dịch xử lý thành công (TPS) lại giảm tới 80% khi tăng connection pool từ 30 lên 300.",
    "scenarioContext": "Database Throttling: Lập trình viên cấu hình 500 connections cho mỗi instance backend, khiến 10 instances đập 5,000 kết nối vào database làm sập CPU vì tranh chấp Context Switching.",
    "juniorTrap": "Nghĩ phần cứng Database bị quá tải và cần nâng cấp server to hơn.",
    "seniorSolution": "Hiện tượng Resource Thrashing: 300 processes của Database tranh chấp nhau cache L1/L2 của CPU và bus bộ nhớ. Thời gian CPU chuyển ngữ cảnh (OS context switch) và tranh chấp spinlock trên shared buffers chiếm hơn 70% thời gian hoạt động của CPU!",
    "practicalProof": "sar -w 1 # Context switches per second spike from 5,000 to 250,000 when pool over-provisioned",
    "tags": [
      "HikariCP",
      "ConnectionPoolFormula",
      "DatabaseSizing",
      "HardwareLimits"
    ]
  },
  {
    "id": "Q-SQL-ANA-10",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Read Replicas, Replication Lag & Read-After-Write Consistency",
    "question": "Điều tra khiếu nại của khách hàng: 'Tôi vừa đổi mật khẩu thành công nhưng đăng nhập ngay lập tức lại báo sai mật khẩu!'.",
    "scenarioContext": "User Confusion: Khách hàng vừa tạo đơn hàng thành công, bấm F5 lại thấy màn hình báo 'Chưa có đơn hàng nào' do bản sao Replica bị trễ 2 giây so với Master.",
    "juniorTrap": "Nghi ngờ API cập nhật mật khẩu bị lỗi logic mã hóa hash.",
    "seniorSolution": "Request đổi mật khẩu ghi vào Master Database. Nhưng request đăng nhập ngay sau đó được load balancer điều hướng đọc từ Read Replica đang bị lag 1.5 giây. Replica chưa kịp nạp WAL change record, vẫn kiểm tra theo hash mật khẩu cũ!",
    "practicalProof": "// Fix: Authentication queries must ALWAYS read strictly from Master node",
    "tags": [
      "ReadReplicas",
      "ReplicationLag",
      "ReadAfterWrite",
      "EventualConsistency"
    ]
  },
  {
    "id": "Q-SQL-ANA-11",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Foreign Key Cascading Performance in Bulk Insert Pipelines",
    "question": "Chẩn đoán hiện tượng câu lệnh `DELETE FROM customer WHERE id = 1` làm treo cứng toàn bộ database trong 2 phút.",
    "scenarioContext": "Pipeline Lockup: Tiến trình import dữ liệu bị treo cứng vì khóa ngoại `ON DELETE CASCADE` phát sinh hàng loạt Exclusive Locks trên bảng cha.",
    "juniorTrap": "Nghĩ bảng customer bị khóa bảng.",
    "seniorSolution": "Do bảng con `orders` có Foreign Key tham chiếu tới `customer(id)` với chỉ thị ON DELETE CASCADE, nhưng CỘT FOREIGN KEY Ở BẢNG CON KHÔNG ĐƯỢC ĐÁNH INDEX! Cơ sở dữ liệu buộc phải quét toàn bộ bảng con (Full Table Scan) để tìm các dòng cần xóa!",
    "practicalProof": "-- Missing Index on Child Table causes full scan on cascade:\nCREATE INDEX idx_orders_customer_id ON orders(customer_id);",
    "tags": [
      "ForeignKey",
      "CascadingDelete",
      "BulkInsert",
      "DataPipeline",
      "IntegrityVsSpeed"
    ]
  },
  {
    "id": "Q-SQL-ANA-12",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Deep Pagination Pitfalls (Offset vs Keyset/Cursor Pagination)",
    "question": "Phân tích tại sao Keyset Pagination không phù hợp cho trường hợp người dùng muốn nhảy trực tiếp tới một trang bất kỳ (e.g. 'Đi tới trang 45').",
    "scenarioContext": "Query Timeout: Trang web sập khi khách hàng hoặc bot cào dữ liệu lật tới trang 100,000, bắt cơ sở dữ liệu phải quét và bỏ qua 2 triệu bản ghi trong bộ nhớ.",
    "juniorTrap": "Khẳng định Keyset Pagination thay thế hoàn toàn Offset Pagination trong mọi bài toán UI.",
    "seniorSolution": "Keyset pagination là con trỏ trạng thái liên tục (stateful cursor), nó chỉ biết phần tử tiếp theo dựa trên phần tử hiện tại. Nó không thể tính toán trước vị trí tuyệt đối của trang 45 mà không duyệt qua các trang trước. Với UI cần jump page, cần giới hạn max page (e.g. tối đa 100 trang).",
    "practicalProof": "// Design trade-off: Infinite scroll uses Keyset; Jump-to-page uses bounded Offset (max page <= 100)",
    "tags": [
      "Pagination",
      "OffsetPagination",
      "KeysetPagination",
      "CursorBased",
      "Performance"
    ]
  },
  {
    "id": "Q-SQL-ANA-13",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "PostgreSQL MVCC (VACUUM, Wraparound) vs MySQL InnoDB Undo Logs",
    "question": "Chẩn đoán nguyên nhân MySQL InnoDB bị phình to tablespace (ibdata1) lên hàng trăm GB dù dữ liệu bảng không nhiều.",
    "scenarioContext": "Database Freeze: PostgreSQL đột ngột dừng nhận lệnh ghi và chuyển sang chế độ Read-Only để bảo vệ tính toàn vẹn dữ liệu vì chạm ngưỡng Transaction Wraparound 2 tỷ transactions.",
    "juniorTrap": "Nghĩ bảng dữ liệu bị nhiễm mã độc sinh rác.",
    "seniorSolution": "Do có một Transaction mở lâu (Long-Running Transaction) đang ở trạng thái ngủ (Sleep/Idle in Transaction). InnoDB không thể purge các Undo Logs của các giao dịch khác chừng nào transaction cũ nhất này còn sống, khiến Undo Tablespace phình to vô tận!",
    "practicalProof": "SELECT * FROM information_schema.innodb_trx ORDER BY trx_started ASC LIMIT 1;",
    "tags": [
      "MVCC",
      "PostgreSQL-Vacuum",
      "InnoDB-UndoLog",
      "Wraparound",
      "StorageEngine"
    ]
  },
  {
    "id": "Q-SQL-ANA-14",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Concurrent Upsert (INSERT ON CONFLICT / ON DUPLICATE KEY)",
    "question": "Mổ xẻ nguyên nhân Deadlock phát sinh liên tục trong MySQL khi nhiều threads cùng chạy câu lệnh `INSERT ... ON DUPLICATE KEY UPDATE`.",
    "scenarioContext": "Unique Constraint Race: Ném lỗi trùng khóa chính khi 2 luồng đồng thời kiểm tra `SELECT` không thấy và cùng thực hiện `INSERT` mà không có mệnh đề `ON CONFLICT DO UPDATE`.",
    "juniorTrap": "Đổi lại code thành câu lệnh UPDATE thông thường.",
    "seniorSolution": "MySQL InnoDB sử dụng Gap Locks và Next-Key Locks khi thực thi ON DUPLICATE KEY UPDATE. Khi nhiều transaction cùng insert các key không liên tục trong cùng một gap, các transaction sẽ xin Shared Lock trên gap và sau đó cùng chờ nâng lên Exclusive Lock, gây Deadlock tức thì!",
    "practicalProof": "// Solution: Ensure inserts are ordered by primary key or pre-partition keys across worker queues",
    "tags": [
      "Upsert",
      "OnConflict",
      "GapLock",
      "ConcurrentWrite",
      "IdempotentInsert"
    ]
  },
  {
    "id": "Q-SQL-ANA-15",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Window Functions (ROW_NUMBER, RANK, DENSE_RANK) Optimization",
    "question": "Phân tích sự khác biệt về kết quả và business impact giữa ROW_NUMBER(), RANK() và DENSE_RANK() khi có các giá trị bằng điểm nhau.",
    "scenarioContext": "Spill to Disk: Câu truy vấn bảng xếp hạng bị chậm 100 lần vì kích thước bộ nhớ đệm `work_mem` quá nhỏ, khiến thuật toán sắp xếp Window Function phải ghi dữ liệu tạm ra ổ đĩa.",
    "juniorTrap": "Nghĩ 3 hàm này tương đương nhau và dùng lẫn lộn trong tính điểm xếp hạng leaderboard.",
    "seniorSolution": "Nếu 2 người cùng hạng 1: ROW_NUMBER() gán tùy ý 1 và 2 (không bao giờ trùng). RANK() gán cả 2 là hạng 1, nhưng người kế tiếp sẽ nhảy cóc lên hạng 3 (1, 1, 3). DENSE_RANK() gán cả 2 là hạng 1 và người kế tiếp là hạng 2 (1, 1, 2, không có khoảng hở).",
    "practicalProof": "-- Leaderboard requirement with tie-breaker: DENSE_RANK() preserves continuous tiers without gap",
    "tags": [
      "WindowFunctions",
      "RowNumber",
      "DenseRank",
      "AnalyticalQuery",
      "TopNPerGroup"
    ]
  },
  {
    "id": "Q-SQL-ANA-16",
    "domain": "SQL & Database Performance",
    "domainCode": "SQL",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Full-Text Search Inverted Indexes (GIN/GiST) vs External Search",
    "question": "Khi nào một Senior Architect quyết định offload tính năng tìm kiếm từ PostgreSQL GIN Index sang cụm Elasticsearch chuyên dụng?",
    "scenarioContext": "Search Degradation: Tìm kiếm văn bản bằng câu lệnh `WHERE content LIKE '%keyword%'` bắt database quét toàn bộ bảng và bỏ qua mọi chỉ mục B-Tree.",
    "juniorTrap": "Luôn dựng Elasticsearch ngay từ ngày đầu tiên dù dữ liệu mới chỉ có vài chục ngàn dòng.",
    "seniorSolution": "Offload sang Elasticsearch khi: 1) Cần tính năng NLP nâng cao, fuzzy matching, typo tolerance, autocomplete n-gram phức tạp; 2) Dung lượng index quá lớn chiếm Shared Buffers làm ảnh hưởng OLTP writes; 3) Tần suất search > 10,000 QPS vượt quá năng lực mở rộng scale của single DB.",
    "practicalProof": "// Decision Matrix: GIN fits OLTP co-located search < 5M docs; Elasticsearch fits distributed faceted search > 10M docs",
    "tags": [
      "FullTextSearch",
      "GIN-Index",
      "Elasticsearch",
      "TSVector",
      "SearchArchitecture"
    ]
  },
  {
    "id": "Q-REDIS-APP-01",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Redis Single-Threaded Reactor & I/O Multiplexing (epoll)",
    "question": "Tối ưu hóa các thao tác gọi Redis từ backend để tận dụng tối đa mô hình Single-Threaded Reactor và tránh block event loop.",
    "scenarioContext": "Kiến trúc bộ đệm hiệu năng cao: Tận dụng cơ chế Non-blocking I/O Multiplexing (epoll) của Redis để xử lý 100,000 thao tác/giây trên một luồng CPU duy nhất.",
    "juniorTrap": "Chạy lệnh `KEYS *` hoặc `FLUSHALL` trên production Redis instance.",
    "seniorSolution": "Redis xử lý các command nghiệp vụ trên một Single Thread duy nhất thông qua cơ chế non-blocking I/O multiplexing (epoll/kqueue). Lệnh `KEYS *` có độ phức tạp O(N): nó sẽ block thread chính, khiến hàng chục ngàn kết nối client khác bị treo chờ!",
    "practicalProof": "// Prohibited in Prod: redis.keys(\"user:*\");\n// Production Safe: redis.scan(ScanParams.scanParams().match(\"user:*\").count(100));",
    "tags": [
      "Redis",
      "EventLoop",
      "ReactorPattern",
      "epoll",
      "SingleThreaded"
    ]
  },
  {
    "id": "Q-REDIS-APP-02",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Distributed Lock with Redlock & Clock Drift Hazards",
    "question": "Triển khai Distributed Lock an toàn bằng Redisson với cơ chế Watchdog tự động gia hạn (lock renewal lease).",
    "scenarioContext": "Xử lý mua hàng flash-sale: Triển khai Khóa Phân Tán an toàn với Redlock trên nhiều Redis node độc lập kèm cơ chế gia hạn TTL tự động (Lock Watchdog).",
    "juniorTrap": "Tự viết Distributed Lock bằng `SETNX key value` kèm expire 5s nhưng không có cơ chế tự động renew khi business chạy quá 5s.",
    "seniorSolution": "Nếu business logic chạy quá thời gian expire của lock, lock tự nhả và thread khác vào tranh chấp. Redisson Watchdog tự động spawn background thread gia hạn lock mỗi 10s (mặc định lock lease 30s) và giải phóng lock bằng Lua script an toàn khi hoàn tất.",
    "practicalProof": "RLock lock = redissonClient.getLock(\"lock:order:101\");\nlock.lock(); // Watchdog starts automatically to renew lock until unlock() is called\ntry {\n  processOrder();\n} finally {\n  lock.unlock();\n}",
    "tags": [
      "DistributedLock",
      "Redlock",
      "ClockDrift",
      "FencingToken",
      "MartinKleppmann"
    ]
  },
  {
    "id": "Q-REDIS-APP-03",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Cache Penetration (Bloom Filter), Breakdown & Avalanche",
    "question": "Áp dụng Redis Bloom Filter để giải quyết triệt để vấn nạn Cache Penetration khi kẻ xấu tấn công truy vấn các ID không tồn tại.",
    "scenarioContext": "Bảo vệ hạ tầng cơ sở dữ liệu: Kết hợp Bloom Filter và Cache Null để ngăn chặn kẻ tấn công dò tìm hàng triệu ID không tồn tại nhằm đánh sập Database.",
    "juniorTrap": "Chỉ cache giá trị null (Null Object Pattern) với số lượng ID ngẫu nhiên vô hạn làm tràn bộ nhớ Redis.",
    "seniorSolution": "Bloom Filter là cấu trúc dữ liệu xác suất (probabilistic). Nếu Bloom Filter báo 'Không tồn tại', chắc chắn 100% ID đó không có trong DB, reject ngay tại gateway. Nếu báo 'Có thể tồn tại', cho phép truy vấn tiếp với tỷ lệ false-positive cực thấp (1%).",
    "practicalProof": "RBloomFilter<String> bloom = redisson.getBloomFilter(\"productIds\");\nbloom.tryInit(10000000, 0.01); // 10M keys with 1% false positive rate\nif (!bloom.contains(productId)) return ResponseEntity.notFound().build();",
    "tags": [
      "CachePenetration",
      "CacheBreakdown",
      "CacheAvalanche",
      "BloomFilter",
      "MutexLock"
    ]
  },
  {
    "id": "Q-REDIS-APP-04",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Probabilistic Cache Expiration (XFetch Algorithm)",
    "question": "Triển khai thuật toán Probabilistic Early Expiration (XFetch) để làm mới cache ngầm trước khi key thực sự hết hạn.",
    "scenarioContext": "Dịch vụ dữ liệu nóng (Hot-Key Cache): Áp dụng thuật toán tính toán xác suất hết hạn trước (XFetch) để làm mới dữ liệu nền trước khi key thực sự hết hạn.",
    "juniorTrap": "Dùng Distributed Mutex Lock để chặn cache stampede (Mutex làm chậm toàn bộ các user đang chờ nạp cache).",
    "seniorSolution": "XFetch tính toán công thức xác suất: `- beta * delta * ln(random()) > (expiry - now)`. Càng gần thời điểm expire, xác suất một request bất kỳ đứng ra đóng vai trò 'worker tái tạo cache' càng cao. Cache luôn luôn được làm mới nền, user không bao giờ phải chịu độ trễ!",
    "practicalProof": "boolean shouldRefresh = -(beta * computeTimeMs * Math.log(random.nextDouble())) > (expiryTimeMs - System.currentTimeMillis());\nif (shouldRefresh) {\n  asyncExecutor.submit(() -> reloadCache(key));\n}",
    "tags": [
      "XFetch",
      "CacheStampede",
      "ProbabilisticEarlyExpiration",
      "Algorithm"
    ]
  },
  {
    "id": "Q-REDIS-APP-05",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Redis Data Structures (HyperLogLog, Bitmaps, Geo, Sorted Sets)",
    "question": "Sử dụng Redis HyperLogLog để đếm số lượng người dùng truy cập duy nhất (Unique Visitors - UV) 100 triệu lượt/ngày chỉ với 12KB RAM.",
    "scenarioContext": "Thống kê lượt người dùng duy nhất (Unique Visitors): Đếm 100 triệu người dùng hoạt động mỗi ngày bằng Redis HyperLogLog với mức tiêu thụ RAM cố định chỉ 12KB.",
    "juniorTrap": "Dùng Redis Set (`SADD uv:2026-01-01 userId`) lưu 100 triệu UUIDs tiêu tốn hơn 4GB RAM vô ích.",
    "seniorSolution": "HyperLogLog là thuật toán xác suất ước lượng cardinality lớn với sai số chuẩn chỉ 0.81%. Bất kể tập dữ liệu lớn đến hàng tỷ phần tử, 1 key HyperLogLog luôn chiếm cố định tối đa 12KB bộ nhớ trong Redis.",
    "practicalProof": "redis.pfadd(\"uv:2026-01-01\", userId);\nlong estimatedUV = redis.pfcount(\"uv:2026-01-01\"); // O(1) estimate with 0.81% error rate",
    "tags": [
      "RedisDataStructures",
      "HyperLogLog",
      "Bitmaps",
      "SortedSets",
      "MemoryEfficiency"
    ]
  },
  {
    "id": "Q-REDIS-APP-06",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Memory Eviction Policies (volatile-lru, allkeys-lru, allkeys-lfu)",
    "question": "Cấu hình chính sách thu hồi bộ nhớ `allkeys-lfu` khi Redis đạt giới hạn maxmemory 8GB để giữ lại các sản phẩm hot nhất.",
    "scenarioContext": "Cấu hình giới hạn bộ nhớ Redis: Thiết lập chính sách giải phóng bộ nhớ `allkeys-lru` khi Redis chạm ngưỡng `maxmemory` để bảo vệ server không bị Linux OOM Killer.",
    "juniorTrap": "Để mặc định `noeviction` khiến Redis ném lỗi OOM Command not allowed khi đầy RAM.",
    "seniorSolution": "LRU (Least Recently Used) chỉ quan tâm đến thời gian truy cập gần nhất, dễ bị ô nhiễm khi có một đợt scan dữ liệu lạ (scan pollution). LFU (Least Frequently Used) theo dõi tần suất truy cập qua bộ đếm logarithmic, bảo vệ dữ liệu hot lâu dài tốt hơn.",
    "practicalProof": "maxmemory 8gb\nmaxmemory-policy allkeys-lfu\nmaxmemory-samples 10 # Increases precision of approximated LFU algorithm",
    "tags": [
      "EvictionPolicy",
      "MaxMemory",
      "allkeys-lru",
      "allkeys-lfu",
      "MemoryManagement"
    ]
  },
  {
    "id": "Q-REDIS-APP-07",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Redis Lua Scripting for Atomic Multi-Key Transactions",
    "question": "Viết Lua Script thực hiện trừ kho hàng tồn kho chỉ khi số lượng tồn kho còn lớn hơn hoặc bằng số lượng đặt mua.",
    "scenarioContext": "Hệ thống trừ điểm tích lũy: Viết kịch bản Redis Lua thực thi nguyên tử (Atomic) việc kiểm tra số dư và trừ điểm mà không bị tranh chấp giữa các server.",
    "juniorTrap": "Thực hiện `GET stock` ở application, kiểm tra if stock >= qty rồi gọi `DECRBY stock qty` (gây race condition overselling bán khống!).",
    "seniorSolution": "Redis thực thi toàn bộ đoạn mã Lua script như một khối nguyên tử (Atomic). Không có bất kỳ command nào khác có thể chen ngang giữa lúc script đang chạy. Đăng ký script bằng `SCRIPT LOAD` và thực thi bằng `EVALSHA` để tiết kiệm băng thông mạng.",
    "practicalProof": "local stock = tonumber(redis.call('get', KEYS[1]) or 0)\nlocal qty = tonumber(ARGV[1])\nif stock >= qty then\n  redis.call('decrby', KEYS[1], qty)\n  return 1\nelse\n  return 0\nend",
    "tags": [
      "LuaScripting",
      "RedisAtomicity",
      "EVALSHA",
      "RaceConditionPrevention"
    ]
  },
  {
    "id": "Q-REDIS-APP-08",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Sliding Window Rate Limiting using Redis ZSETs",
    "question": "Triển khai bộ đếm giới hạn tốc độ trượt (Sliding Window Rate Limiter) 100 requests/phút bằng Redis Sorted Set (ZSET).",
    "scenarioContext": "Bảo vệ API chống tấn công DDoS: Xây dựng bộ giới hạn tốc độ trượt thời gian thực (100 req/60s) bằng Redis Sorted Set (ZSET) với timestamp làm score.",
    "juniorTrap": "Dùng Fixed Window counter (e.g. `INCR key`) dẫn đến lỗ hổng gấp đôi lưu lượng (Traffic Burst 2x) tại thời điểm giao thoa giữa 2 phút.",
    "seniorSolution": "ZSET lưu score là epoch timestamp hiện tại. Thuật toán: 1) Xóa các elements cũ hơn (now - 60s) bằng `ZREMRANGEBYSCORE`; 2) Đếm số elements còn lại bằng `ZCARD`; 3) Nếu count < limit, add timestamp mới bằng `ZADD`; 4) Set expire cho key.",
    "practicalProof": "long now = System.currentTimeMillis();\nString key = \"rate:user:\" + userId;\nTransaction t = jedis.multi();\nt.zremrangeByScore(key, 0, now - 60000);\nt.zcard(key);\nt.zadd(key, now, String.valueOf(now));\nt.expire(key, 61);\nList<Object> results = t.exec();",
    "tags": [
      "RateLimiting",
      "SlidingWindow",
      "SortedSet",
      "ZREMRANGEBYSCORE",
      "APIThrottling"
    ]
  },
  {
    "id": "Q-REDIS-ANA-09",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Redis Persistence Trade-Offs (RDB Point-in-Time vs AOF fsync)",
    "question": "Chẩn đoán hiện tượng Disk I/O 100% và latency của Redis bị giật lag mỗi khi tiến trình BGSAVE hoặc AOF Rewrite được kích hoạt.",
    "scenarioContext": "Data Loss Disaster: Redis bị mất điện đột ngột và mất sạch dữ liệu của 15 phút vừa qua vì chỉ cấu hình RDB snapshot mỗi 15 phút mà không bật AOF.",
    "juniorTrap": "Nghĩ BGSAVE chạy ở process con nên hoàn toàn không ảnh hưởng tới process cha.",
    "seniorSolution": "BGSAVE gọi syscall `fork()`. Khi copy page table của memory lớn (e.g. 30GB), nếu ứng dụng có write traffic cao, cơ chế Copy-on-Write (CoW) của Linux Kernel buộc phải nhân bản các memory pages liên tục, gây I/O spike và làm tăng vọt dung lượng RAM tiêu thụ!",
    "practicalProof": "sysctl -w vm.overcommit_memory=1 # Prevents fork memory allocation failure in Linux",
    "tags": [
      "RedisPersistence",
      "RDB",
      "AOF",
      "fsync",
      "DataLossTradeoff"
    ]
  },
  {
    "id": "Q-REDIS-ANA-10",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Redis Sentinel Quorum, Failover & Split-Brain Mitigation",
    "question": "Phân tích hiện tượng Split-Brain trong Redis Sentinel: Master cũ bị cách ly mạng vẫn tiếp nhận lệnh ghi và làm mất mát dữ liệu sau khi failover.",
    "scenarioContext": "Split-Brain Catastrophe: Phân vùng mạng khiến 2 node Redis cùng tự nhận mình là Master và cùng nhận dữ liệu ghi, dẫn đến việc mất mát dữ liệu khi kết nối mạng phục hồi.",
    "juniorTrap": "Nghĩ Sentinel tự động ngắt kết nối các client đang nối vào Master cũ.",
    "seniorSolution": "Nếu Master cũ bị network partition cách ly với Sentinels nhưng client vẫn kết nối được, Master cũ vẫn nhận lệnh ghi. Khi mạng phục hồi, Master cũ bị giáng cấp thành Replica và nhận snapshot từ Master mới, TOÀN BỘ DỮ LIỆU GHI TRONG PHÂN ĐOÀN BỊ XÓA SẠCH!",
    "practicalProof": "# Protect against split-brain writes in redis.conf:\nmin-replicas-to-write 1\nmin-replicas-max-lag 10",
    "tags": [
      "RedisSentinel",
      "Quorum",
      "Failover",
      "SplitBrain",
      "HighAvailability"
    ]
  },
  {
    "id": "Q-REDIS-ANA-11",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Redis Cluster Hash Slots (16,384 Slots) & Cross-Slot Operations",
    "question": "Điều tra nguyên nhân một Redis node trong Cluster bị phình to 20GB RAM trong khi 5 nodes còn lại chỉ dùng 2GB RAM.",
    "scenarioContext": "CrossSlot Error: Lệnh MGET hoặc transaction thất bại với lỗi `CROSSSLOT Keys in request don't hash to the same slot` khi thao tác trên các key nằm ở các node khác nhau.",
    "juniorTrap": "Nghĩ thuật toán băm CRC16 của Redis bị lỗi phân bổ không đều.",
    "seniorSolution": "Hiện tượng Hot Key / Slot Imbalance: Do lạm dụng Hash Tag `{common_tag}` trên hàng triệu keys, khiến toàn bộ dữ liệu này bị ép rơi vào duy nhất 1 Hash Slot trên một node duy nhất, làm tê liệt khả năng cân bằng tải của Cluster!",
    "practicalProof": "redis-cli -c cluster slots # Inspect distribution of slots across master nodes",
    "tags": [
      "RedisCluster",
      "HashSlots",
      "CRC16",
      "CrossSlotError",
      "HashTags"
    ]
  },
  {
    "id": "Q-REDIS-ANA-12",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Redis Streams with Consumer Groups & PEL (Pending Entry List)",
    "question": "Chẩn đoán nguyên nhân bộ nhớ Redis tăng dần đều không ngừng dù số lượng bản ghi thực tế trong Stream đã được xử lý xong hết.",
    "scenarioContext": "Message Loss: Consumer gặp sự cố sập giữa chừng sau khi đọc tin nhắn nhưng chưa kịp xử lý, khiến tin nhắn bị kẹt vô tận trong danh sách PEL.",
    "juniorTrap": "Nghĩ rằng gọi `XACK` là Redis sẽ tự động xóa tin nhắn ra khỏi Stream log.",
    "seniorSolution": "`XACK` chỉ đánh dấu tin nhắn đã hoàn thành trong PEL (Pending Entries List), nó KHÔNG XÓA tin nhắn khỏi Stream log! Để khống chế kích thước Stream, bắt buộc phải dùng chỉ thị giới hạn độ dài `MAXLEN ~ 100000` khi gọi `XADD` hoặc định kỳ gọi `XTRIM`!",
    "practicalProof": "redis.xadd(\"stream:orders\", StreamAddArgs.entries(...).maxlen(50000).approximateTrimming(true));",
    "tags": [
      "RedisStreams",
      "ConsumerGroups",
      "PEL",
      "XREADGROUP",
      "XACK"
    ]
  },
  {
    "id": "Q-REDIS-ANA-13",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Memory Optimization with Ziplist & Intset Thresholds",
    "question": "Phân tích hiện tượng CPU tăng vọt bất thường khi tăng `hash-max-ziplist-entries` lên con số quá lớn như 10,000.",
    "scenarioContext": "RAM Explosion: Bộ nhớ Redis tăng gấp 5 lần khi các Hash vượt qua ngưỡng 512 phần tử, khiến Redis chuyển đổi từ cơ chế nén Ziplist sang HashTable thông thường.",
    "juniorTrap": "Càng nén ziplist càng nhiều càng tốt để tiết kiệm RAM tối đa.",
    "seniorSolution": "Ziplist là một mảng byte liên tục không có băm (hash). Mọi thao tác tìm kiếm hay cập nhật bên trong ziplist đều là duyệt tuyến tính O(N)! Khi entries lên tới 10,000, mỗi lệnh HGET/HSET phải quét hàng ngàn byte trong RAM, làm tiêu tốn CPU khủng khiếp!",
    "practicalProof": "// Rule: Keep ziplist entries <= 512-1024 to balance memory savings and O(N) linear search CPU cost",
    "tags": [
      "MemoryOptimization",
      "Ziplist",
      "Intset",
      "MemoryLayout",
      "InternalEncoding"
    ]
  },
  {
    "id": "Q-REDIS-ANA-14",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "BigKey and HotKey Detection with redis-cli --bigkeys",
    "question": "Điều tra sự cố sập mạng nội bộ (NIC Bandwidth Saturation) do một HotKey duy nhất nhận 80,000 requests/giây.",
    "scenarioContext": "Network Saturation: Một key chứa danh sách 1 triệu phần tử (BigKey) được đọc liên tục làm nghẽn hoàn toàn băng thông card mạng 10Gbps của máy chủ Redis.",
    "juniorTrap": "Thêm Redis replicas phía sau mà không thay đổi kiến trúc đọc của client.",
    "seniorSolution": "HotKey tập trung toàn bộ traffic vào duy nhất một node chứa key đó, làm bão hòa card mạng 1Gbps/10Gbps của máy chủ. Giải pháp kiến trúc: 1) Local In-Memory Cache (Caffeine) ngay tại application layer; 2) Nhân bản HotKey thành N sub-keys (`hotkey_0`, `hotkey_1` ... `hotkey_N-1`) và băm ngẫu nhiên client reads.",
    "practicalProof": "// HotKey distribution: String targetKey = \"hot_item:\" + ThreadLocalRandom.current().nextInt(10);",
    "tags": [
      "BigKey",
      "HotKey",
      "redis-cli",
      "NetworkBandwidth",
      "ClusterDegradation"
    ]
  },
  {
    "id": "Q-REDIS-ANA-15",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Two-Level Caching (Caffeine L1 + Redis L2) & Pub/Sub Invalidation",
    "question": "Chẩn đoán rủi ro mất mát message của Redis Pub/Sub dẫn đến dữ liệu ở Local Cache L1 bị sai lệch vĩnh viễn.",
    "scenarioContext": "Desynchronization Bug: Một instance backend không nhận được thông điệp Pub/Sub do rớt mạng tạm thời, tiếp tục phục vụ dữ liệu cũ trong RAM cục bộ suốt nhiều giờ.",
    "juniorTrap": "Nghĩ Redis Pub/Sub có cơ chế lưu trữ và gửi lại tin nhắn cho subscriber bị mất kết nối tạm thời.",
    "seniorSolution": "Redis Pub/Sub hoàn toàn KHÔNG có bộ nhớ đệm (At-Most-Once delivery). Nếu một app instance bị mạng lag hoặc dính GC pause đúng lúc publish message vô hiệu hóa, instance đó sẽ bỏ lỡ event và tiếp tục phục vụ stale data trong L1! Khắc phục: Đặt TTL ngắn cho L1 (e.g. 30-60s) làm chốt chặn an toàn.",
    "practicalProof": "// Safety net: Caffeine.newBuilder().expireAfterWrite(60, TimeUnit.SECONDS).build();",
    "tags": [
      "TwoLevelCache",
      "Caffeine",
      "L1-L2-Cache",
      "PubSubInvalidation",
      "UltraLowLatency"
    ]
  },
  {
    "id": "Q-REDIS-ANA-16",
    "domain": "Redis & Caching Architecture",
    "domainCode": "REDIS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Client-Side Caching (RESP3 Tracking Protocol & Invalidation)",
    "question": "Phân tích sự bùng nổ bộ nhớ trên Redis Server khi bật Tracking Protocol cho hàng triệu client connections độc lập.",
    "scenarioContext": "Stale Cache Accumulation: Bộ nhớ RAM ứng dụng bị cạn kiệt do lưu trữ quá nhiều bản ghi client-side tracking mà không có chính sách dọn dẹp LRU nội bộ.",
    "juniorTrap": "Bật CLIENT TRACKING ở chế độ mặc định cho toàn bộ tất cả mọi key trên production.",
    "seniorSolution": "Ở chế độ mặc định, Redis Server phải lưu một Tracking Table khổng lồ ánh xạ từng Key tới danh sách các Client IDs đã đọc key đó. Với hàng triệu keys, bảng tracking này sẽ làm cạn kiệt RAM của Redis! Phải dùng chế độ `BCAST` (Broadcast mode) với tiền tố prefix để server chỉ cần lưu prefix rules thay vì từng key riêng lẻ.",
    "practicalProof": "CLIENT TRACKING on BCAST PREFIX user: # Tracks prefixes instead of individual keys to save server RAM",
    "tags": [
      "ClientSideCaching",
      "RESP3",
      "TrackingProtocol",
      "Lettuce",
      "ZeroLatency"
    ]
  },
  {
    "id": "Q-KAFKA-APP-01",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Topic Partitions, Segment Files & High Watermark (HW)",
    "question": "Thiết kế số lượng Partitions cho Topic xử lý 100,000 messages/giây và giải thích vai trò của High Watermark (HW) đối với Consumer.",
    "scenarioContext": "Thiết kế cấu trúc lưu trữ sự kiện: Định cỡ số lượng Partitions và cấu hình High Watermark đảm bảo consumer chỉ đọc dữ liệu đã được nhân bản an toàn.",
    "juniorTrap": "Tạo topic chỉ với 1 partition duy nhất và kỳ vọng có thể scale ngang (scale out) lên 10 consumer instances.",
    "seniorSolution": "Partition là đơn vị song song (parallelism) tối thượng của Kafka. 1 Partition chỉ được đọc bởi tối đa 1 Consumer trong cùng 1 Consumer Group tại một thời điểm. Consumer chỉ được phép đọc các messages nằm dưới High Watermark (đã được nhân bản đủ sang In-Sync Replicas).",
    "practicalProof": "kafka-topics.sh --create --bootstrap-server localhost:9092 \\\n  --replication-factor 3 --partitions 12 --topic payment-events",
    "tags": [
      "KafkaInternals",
      "TopicPartition",
      "HighWatermark",
      "LogEndOffset",
      "ReplicaLag"
    ]
  },
  {
    "id": "Q-KAFKA-APP-02",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Producer Acknowledgments (acks=all) & min.insync.replicas",
    "question": "Cấu hình Producer và Broker để đảm bảo tính bền vững dữ liệu tuyệt đối (Zero-Data-Loss) cho các giao dịch ngân hàng.",
    "scenarioContext": "Đảm bảo không mất mát dữ liệu (Zero Data Loss): Thiết lập bộ đôi `acks=all` và `min.insync.replicas=2` trên cụm Kafka có replication factor bằng 3.",
    "juniorTrap": "Đặt `acks=all` trên Producer nhưng để mặc định `min.insync.replicas=1` trên Broker.",
    "seniorSolution": "Nếu `min.insync.replicas=1`, khi tất cả các replicas khác chết hết chỉ còn 1 Leader duy nhất, `acks=all` sẽ thỏa mãn ngay khi Leader ghi xong. Nếu Leader chết ngay sau đó, dữ liệu MẤT HOÀN TOÀN! Chuẩn vàng ngân hàng: `replication.factor=3`, `acks=all`, `min.insync.replicas=2`.",
    "practicalProof": "# Broker / Topic config:\nmin.insync.replicas=2\n# Producer config:\nprops.put(ProducerConfig.ACKS_CONFIG, \"all\");\nprops.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);",
    "tags": [
      "KafkaProducer",
      "AcksAll",
      "minInsyncReplicas",
      "DataLossPrevention",
      "Durability"
    ]
  },
  {
    "id": "Q-KAFKA-APP-03",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Idempotent Producer (PID + Sequence Numbers) Mechanics",
    "question": "Kích hoạt tính năng Idempotent Producer để loại bỏ hoàn toàn các tin nhắn bị trùng lặp do network retry.",
    "scenarioContext": "Ngăn ngừa trùng lặp dữ liệu: Kích hoạt `enable.idempotence=true` để broker tự động loại bỏ các thông điệp gửi lại do lỗi trễ mạng giữa Producer và Broker.",
    "juniorTrap": "Tự viết logic deduplication phức tạp bằng Redis/Database cho tầng Producer.",
    "seniorSolution": "Bật `enable.idempotence=true` (mặc định từ Kafka 3.0+). Broker cấp cho Producer một Producer ID (PID). Mỗi batch message gửi đi kèm một Sequence Number tăng dần theo từng Partition. Nếu Producer retry do timeout mạng, Broker tự động nhận diện Sequence Number đã ghi và drop duplicate trong O(1).",
    "practicalProof": "props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, \"true\");\nprops.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5); // Safe ordering preserved",
    "tags": [
      "IdempotentProducer",
      "PID",
      "SequenceNumber",
      "Deduplication",
      "ExactlyOnce"
    ]
  },
  {
    "id": "Q-KAFKA-APP-04",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Consumer Group Rebalance Storms & Cooperative Sticky Assignor",
    "question": "Chuyển đổi Partition Assignment Strategy sang `CooperativeStickyAssignor` để xóa bỏ hiện tượng 'Stop-The-World Rebalance'.",
    "scenarioContext": "Vận hành cụm Consumer tải cao: Chuyển đổi chiến lược phân bổ partition sang `CooperativeStickyAssignor` để triệt tiêu hiện tượng ngưng trệ toàn cụm (Stop-The-World).",
    "juniorTrap": "Để mặc định `RangeAssignor` cũ: mỗi khi 1 consumer tham gia/rời nhóm, toàn bộ cụm consumer phải nhả hết partition và dừng xử lý hoàn toàn.",
    "seniorSolution": "Eager Rebalance thu hồi toàn bộ partitions của mọi consumers trong nhóm trước khi phân bổ lại. Cooperative Sticky Assignor chỉ thu hồi và di chuyển đúng partition bị ảnh hưởng; các partitions khác tiếp tục tiêu thụ tin nhắn bình thường mà không bị gián đoạn!",
    "practicalProof": "props.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG,\n  \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");",
    "tags": [
      "ConsumerRebalance",
      "RebalanceStorm",
      "CooperativeSticky",
      "EagerRebalance",
      "StopTheWorld"
    ]
  },
  {
    "id": "Q-KAFKA-APP-05",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Exactly-Once Semantics (EOS) & Transaction Coordinator 2PC",
    "question": "Triển khai luồng Consume-Process-Produce nguyên tử với Kafka Transactions và Exactly-Once Semantics (EOS).",
    "scenarioContext": "Quy trình xử lý sự kiện tài chính: Thiết lập luồng Read-Process-Write an toàn tuyệt đối với Kafka Transactional Producer và `isolation.level=read_committed`.",
    "juniorTrap": "Commit DB transaction riêng và commit Kafka offset riêng biệt mà không phối hợp hai pha (2PC).",
    "seniorSolution": "Sử dụng Producer có `transactional.id`. Producer phối hợp với Transaction Coordinator trên Broker qua giao thức Two-Phase Commit: gửi message mới và gửi committed offset vào transaction marker cùng lúc. Nếu lỗi, toàn bộ message và offset marker đều bị rollback.",
    "practicalProof": "producer.initTransactions();\ntry {\n  producer.beginTransaction();\n  producer.send(new ProducerRecord<>(\"output-topic\", result));\n  producer.sendOffsetsToTransaction(offsets, groupMetadata);\n  producer.commitTransaction();\n} catch (Exception e) {\n  producer.abortTransaction();\n}",
    "tags": [
      "EOS",
      "KafkaTransactions",
      "TransactionCoordinator",
      "TwoPhaseCommit",
      "AtomicStream"
    ]
  },
  {
    "id": "Q-KAFKA-APP-06",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Broker Storage Architecture, Page Cache & Zero-Copy sendfile",
    "question": "Tối ưu hóa tài nguyên phần cứng máy chủ Kafka Broker để tận dụng tối đa OS Page Cache và Zero-Copy transfer.",
    "scenarioContext": "Hiểu sâu về cơ chế I/O hệ điều hành: Tận dụng Linux OS Page Cache và syscall `sendfile` (Zero-Copy) để truyền dữ liệu từ đĩa trực tiếp ra mạng mà không qua JVM.",
    "juniorTrap": "Cấp phát 90% RAM máy chủ cho JVM Heap của Broker (`-Xmx60g` trên máy 64GB RAM).",
    "seniorSolution": "Kafka Broker hoạt động hiệu quả nhất khi JVM Heap nhỏ (chỉ 6-8GB Heap) và để 85% RAM còn lại cho Linux OS Page Cache! Kafka dùng Linux syscall `sendfile()` chuyển dữ liệu trực tiếp từ Page Cache ra Network Socket Card mà không cần copy vào JVM heap (Zero-Copy).",
    "practicalProof": "# Broker JVM Options:\nexport KAFKA_HEAP_OPTS=\"-Xmx8G -Xms8G\"\n# Zero-copy sendfile transfers disk pages directly to NIC buffer without context switch",
    "tags": [
      "KafkaStorage",
      "PageCache",
      "ZeroCopy",
      "sendfile",
      "OSKernel"
    ]
  },
  {
    "id": "Q-KAFKA-APP-07",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Consumer Lag Monitoring & Max Poll Interval Timeouts",
    "question": "Thiết lập giám sát Consumer Lag theo thời gian thực bằng Burrow hoặc Prometheus JMX Exporter để kích hoạt autoscaling pods.",
    "scenarioContext": "Giám sát độ trễ luồng xử lý: Thiết lập cảnh báo Prometheus khi Consumer Lag vượt ngưỡng 10,000 bản ghi và điều chỉnh `max.poll.records` phù hợp.",
    "juniorTrap": "Chỉ nhìn vào CPU usage của consumer pod để scale (khi consumer bị nghẽn I/O DB, CPU rất thấp dù Lag đang tăng vọt hàng triệu records!).",
    "seniorSolution": "Consumer Lag = LogEndOffset - CurrentOffset. Đây là chỉ số sức khỏe quan trọng nhất của hệ thống event streaming. Cảnh báo khi Lag vượt ngưỡng an toàn (e.g. > 5,000 records) hoặc xu hướng Lag tăng liên tục trong 5 phút.",
    "practicalProof": "kafka-consumer-groups.sh --bootstrap-server localhost:9092 \\\n  --describe --group order-processing-group\n# Outputs: TOPIC, PARTITION, CURRENT-OFFSET, LOG-END-OFFSET, LAG",
    "tags": [
      "ConsumerLag",
      "KafkaMonitoring",
      "Burrow",
      "MaxPollInterval",
      "Throughput"
    ]
  },
  {
    "id": "Q-KAFKA-APP-08",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Poison Pill Handling & Dead Letter Queue (DLQ) Retry Patterns",
    "question": "Thiết kế cơ chế Non-Blocking Retry Topics kết hợp Dead Letter Queue (DLQ) trong Spring Kafka để cô lập tin nhắn lỗi.",
    "scenarioContext": "Khả năng tự phục hồi lỗi: Xây dựng cơ chế bắt tin nhắn lỗi định dạng (Poison Pill), tự động retry có khoảng cách dãn (Exponential Backoff) và đẩy vào DLQ.",
    "juniorTrap": "Ném exception và retry vòng lặp vô tận tại Consumer chính, làm tắc nghẽn toàn bộ hàng triệu tin nhắn hợp lệ phía sau (Head-of-Line Blocking).",
    "seniorSolution": "Sử dụng `@RetryableTopic` với backoff theo cấp số nhân (e.g. 1s, 5s, 30s) và chuyển tin nhắn hỏng (Poison Pill: JSON parse error, data invalid) vào DLQ Topic (`topic-dlt`). Consumer chính tiếp tục tiến tới record tiếp theo mà không bị nghẽn.",
    "practicalProof": "@RetryableTopic(\n  attempts = \"3\",\n  backoff = @Backoff(delay = 1000, multiplier = 2.0),\n  dltStrategy = DltStrategy.FAIL_ON_ERROR)\n@KafkaListener(topics = \"orders\")\npublic void handleOrder(OrderEvent event) { ... }",
    "tags": [
      "PoisonPill",
      "DLQ",
      "DeadLetterQueue",
      "ErrorHandling",
      "NonBlockingRetry"
    ]
  },
  {
    "id": "Q-KAFKA-ANA-09",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Tombstone Records & Log Compaction Cleaner Threads",
    "question": "Chẩn đoán tại sao dung lượng đĩa của Compacted Topic vẫn tiếp tục tăng gấp 10 lần và các giá trị cũ của Key không hề bị xóa.",
    "scenarioContext": "Disk Leak: Các bản ghi cũ không bao giờ bị dọn dẹp làm đầy ổ đĩa do cấu hình tỷ lệ dơ `min.compaction.lag.ms` và `cleaner.threads` không chính xác.",
    "juniorTrap": "Đổ lỗi cho Kafka không hỗ trợ compaction.",
    "seniorSolution": "Do: 1) `log.cleaner.enable` bị tắt trên Broker; hoặc 2) Dữ liệu nằm trong Active Segment file (.log đang được ghi hiện tại). Kafka CHỈ compact các closed segments, KHÔNG BAO GIỜ can thiệp vào Active Segment đang mở! Cần điều chỉnh `segment.ms` hoặc `segment.bytes`.",
    "practicalProof": "segment.bytes=104857600 # 100MB per segment ensures inactive segments close and get compacted",
    "tags": [
      "LogCompaction",
      "Tombstone",
      "LogCleaner",
      "StateSnapshot",
      "KeyRetention"
    ]
  },
  {
    "id": "Q-KAFKA-ANA-10",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Partition Key Hashing, Skewed Distribution & Custom Partitioner",
    "question": "Phân tích điều gì xảy ra với thứ tự của các messages khi thêm muối ngẫu nhiên (salting) vào Partition Key.",
    "scenarioContext": "Partition Bottleneck: Toàn bộ 50,000 requests/giây bị dồn vào đúng 1 Partition duy nhất do lập trình viên truyền key null hoặc thuật toán băm bị va chạm.",
    "juniorTrap": "Nghĩ rằng các messages của khách hàng VIP vẫn giữ nguyên thứ tự tuyệt đối.",
    "seniorSolution": "Kafka CHỈ đảm bảo thứ tự nghiêm ngặt (Strict Ordering) BÊN TRONG CÙNG MỘT PARTITION. Khi rải key sang nhiều partitions khác nhau, thứ tự toàn cục giữa các messages đó bị phá vỡ! Ứng dụng phải chấp nhận mất thứ tự hoặc tự sắp xếp lại bằng event timestamp ở tầng application.",
    "practicalProof": "// Trade-off: High Throughput Distribution vs Strict Per-Key Total Ordering",
    "tags": [
      "PartitionKey",
      "Murmur2",
      "SkewedPartition",
      "CustomPartitioner",
      "HotPartition"
    ]
  },
  {
    "id": "Q-KAFKA-ANA-11",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Kafka Streams Stateful RocksDB Stores & Changelog Topics",
    "question": "Chẩn đoán nguyên nhân thời gian khởi động lại (Startup Time) của Kafka Streams pod mất tới 45 phút khi chuyển sang host mới.",
    "scenarioContext": "Recovery Delay: Khi một instance Kafka Streams bị khởi động lại, node mất 45 phút để tải lại dữ liệu từ đầu vì thiếu cấu hình Standby Replicas.",
    "juniorTrap": "Nghĩ RocksDB bị lỗi hỏng cơ sở dữ liệu.",
    "seniorSolution": "Do Changelog Topic chứa hàng chục triệu records lịch sử chưa được compact. Khi dọn sang node mới không có local RocksDB directory, Streams app buộc phải download và replay toàn bộ Changelog Topic từ đầu! Khắc phục: Dùng Persistent Volumes (k8s PVC) hoặc Standby Replicas (`num.standby.replicas=1`).",
    "practicalProof": "props.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1); // Keeps warm backup replica ready",
    "tags": [
      "KafkaStreams",
      "StatefulProcessing",
      "RocksDB",
      "ChangelogTopic",
      "Windowing"
    ]
  },
  {
    "id": "Q-KAFKA-ANA-12",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Schema Registry & Avro/Protobuf Backward/Forward Compatibility",
    "question": "Điều tra nguyên nhân Producer ném lỗi `IncompatibleSchemaException` khi cố gắng đăng ký schema phiên bản v3 lên Schema Registry.",
    "scenarioContext": "Deserialization Disaster: Đội ngũ thêm một trường bắt buộc mới vào payload mà không có giá trị mặc định, làm sập đồng loạt 10 consumers đang chạy trên production.",
    "juniorTrap": "Xóa schema cũ trên Registry để ép đăng ký schema mới.",
    "seniorSolution": "Xảy ra khi schema mới vi phạm chính sách tương thích đã cấu hình (e.g. xóa một trường bắt buộc trong BACKWARD mode, hoặc đổi kiểu dữ liệu từ string sang int). Schema Registry đóng vai trò người gác cổng (gatekeeper) từ chối để bảo vệ toàn bộ consumers trong hệ thống!",
    "practicalProof": "// Check compatibility via CLI:\nschema-registry-api-client test-compatibility --subject orders-value --schema v3.json",
    "tags": [
      "SchemaRegistry",
      "Avro",
      "CompatibilityRules",
      "BackwardCompatibility",
      "Evolution"
    ]
  },
  {
    "id": "Q-KAFKA-ANA-13",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "KRaft Metadata Quorum Architecture vs Legacy ZooKeeper Architecture",
    "question": "So sánh sự khác biệt về thời gian Failover Controller giữa ZooKeeper cũ và KRaft mới khi Active Controller bị chết.",
    "scenarioContext": "Metadata Bottleneck: Cụm Kafka cũ có 100,000 partitions bị treo cứng khi Leader thay đổi do ZooKeeper không chịu nổi tải cập nhật metadata đồng thời.",
    "juniorTrap": "Nghĩ ZooKeeper và KRaft có tốc độ bầu chọn và nạp metadata tương đương nhau.",
    "seniorSolution": "ZooKeeper: Controller mới phải nạp lại toàn bộ metadata từ ZooKeeper zNodes về memory qua RPC, mất từ vài chục giây đến vài phút với cụm lớn. KRaft: Các Controller Quorum luôn luôn replicate metadata log theo thời gian thực (warm standby); khi Active Controller chết, Controller mới lên ngôi ngay lập tức (< 100ms)!",
    "practicalProof": "// Failover benchmark: Legacy ZooKeeper = 45s-120s; KRaft Raft Quorum = ~200ms",
    "tags": [
      "KRaft",
      "ZooKeeperRemoval",
      "RaftQuorum",
      "KIP-500",
      "MetadataArchitecture"
    ]
  },
  {
    "id": "Q-KAFKA-ANA-14",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Zombie Producer Fencing via Transactional ID Epochs",
    "question": "Mổ xẻ nguyên nhân Producer ném ngoại lệ `ProducerFencedException` và không thể tiếp tục gửi bất kỳ message nào.",
    "scenarioContext": "Split-Brain Ghost Writes: Producer cũ bị đứt mạng tạm thời hồi phục lại và tiếp tục ghi đè dữ liệu cũ vào topic, phá hỏng trạng thái của Producer mới.",
    "juniorTrap": "Bắt ngoại lệ và gọi `initTransactions()` trong vòng lặp retry vô tận.",
    "seniorSolution": "Ngoại lệ này chứng minh một instance khác của ứng dụng đã khởi chạy và chiếm quyền điều khiển Transactional ID này (hoặc phiên hiện tại bị coi là zombie do GC pause quá lâu). Instance hiện tại BẮT BUỘC phải dừng hoạt động (fail-fast termination) để không ghi đè dữ liệu đối kháng!",
    "practicalProof": "// org.apache.kafka.common.errors.ProducerFencedException: Must terminate immediately",
    "tags": [
      "ZombieFencing",
      "TransactionalID",
      "ProducerEpoch",
      "SplitBrainProducer"
    ]
  },
  {
    "id": "Q-KAFKA-ANA-15",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Consumer Fetch Max Bytes, Buffer Memory & Backpressure",
    "question": "Chẩn đoán hiện tượng Consumer bị OutOfMemoryError: Java heap space ngay trong lần gọi poll() đầu tiên sau khi kết nối vào topic.",
    "scenarioContext": "Consumer OutOfMemoryError: Consumer kéo về một batch dữ liệu chứa hàng loạt thông điệp 20MB, làm bùng nổ Heap memory và khiến container bị OOMKilled.",
    "juniorTrap": "Đổ lỗi cho framework Spring Kafka bị rò rỉ bộ nhớ.",
    "seniorSolution": "Topic có các messages siêu lớn (e.g. 20MB/message do ai đó gửi nhầm video/file nén). Khi consumer nạp batch, các byte buffers khổng lồ lập tức làm vỡ Java Heap. Phải khống chế kích thước message tối đa trên Broker bằng `message.max.bytes = 1048576` (1MB).",
    "practicalProof": "# Broker Topic Configuration:\nmax.message.bytes=1048576 # Rejects oversized records at producer gateway",
    "tags": [
      "ConsumerTuning",
      "FetchMaxBytes",
      "BufferMemory",
      "Backpressure",
      "OOMPrevention"
    ]
  },
  {
    "id": "Q-KAFKA-ANA-16",
    "domain": "Apache Kafka & Event Streaming",
    "domainCode": "KAFKA",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "MirrorMaker 2 Active-Passive Datacenter Replication",
    "question": "Điều tra thách thức lớn nhất khi thực hiện Failover Consumer từ Data Center chính sang Data Center dự phòng sau sự cố thảm họa.",
    "scenarioContext": "Replication Cycle: Cấu hình sai quy tắc regex chủ đề khiến MirrorMaker tạo vòng lặp vô tận sao chép dữ liệu qua lại giữa 2 cụm, làm nghẽn toàn bộ băng thông.",
    "juniorTrap": "Nghĩ Consumer có thể dùng nguyên giá trị offset số nguyên cũ trên cụm mới.",
    "seniorSolution": "Mỗi cụm Kafka có log segment và thứ tự offset số nguyên hoàn toàn độc lập (Offset 1000 trên cụm A không tương ứng với Offset 1000 trên cụm B). Consumer phải dùng utility `RemoteClusterUtils.translateOffsets()` của MM2 để dịch offset dựa trên checkpoint timestamp!",
    "practicalProof": "Map<TopicPartition, OffsetAndMetadata> translatedOffsets =\n  RemoteClusterUtils.translateOffsets(backupConfig, \"primary\", \"order-group\", Duration.ofSeconds(10));",
    "tags": [
      "MirrorMaker2",
      "DisasterRecovery",
      "CrossClusterReplication",
      "ActivePassive",
      "OffsetSync"
    ]
  },
  {
    "id": "Q-SYS-APP-01",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "High CPU 100% Diagnosis with top -H, pidstat & jstack Tracing",
    "question": "Thực hiện quy trình 4 bước chuẩn để định vị chính xác dòng code Java gây ra hiện tượng CPU 100% trên production Linux server.",
    "scenarioContext": "Phản ứng sự cố khẩn cấp: Quy trình 3 bước xác định chính xác dòng code Java gây 100% CPU trên môi trường sản xuất trong vòng 60 giây.",
    "juniorTrap": "Khởi động lại server ngay lập tức mà không thu thập thread dump hoặc bằng chứng hiện trường.",
    "seniorSolution": "Quy trình chuẩn: 1) `top -H -p <PID>` tìm Thread ID (TID) tốn CPU cao nhất; 2) Chuyển TID sang hệ thập lục phân: `printf '%x\n' <TID>`; 3) Chụp thread dump bằng `jstack <PID> > dump.txt`; 4) Tìm `nid=0x<hex>` trong file dump để chỉ điểm chính xác file Java và dòng lệnh đang chạy loop!",
    "practicalProof": "top -H -p 4521 # Find thread 4535 with 99% CPU\nprintf '%x\\n' 4535 # Output: 0x11b7\njstack 4521 | grep -A 25 0x11b7 # Identifies exact class and line number causing tight loop",
    "tags": [
      "HighCPU",
      "LinuxTroubleshooting",
      "top-H",
      "jstack",
      "ThreadDump"
    ]
  },
  {
    "id": "Q-SYS-APP-02",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "OutOfMemoryError Heap Dump Analysis with MAT / JProfiler",
    "question": "Cấu hình JVM tự động chụp Heap Dump khi gặp OutOfMemoryError và phân tích bằng Eclipse Memory Analyzer (MAT).",
    "scenarioContext": "Điều tra pháp y bộ nhớ: Phân tích tệp `.hprof` bằng Eclipse Memory Analyzer (MAT) để chỉ mặt đặt tên class và câu truy vấn đang gây rò rỉ RAM.",
    "juniorTrap": "Để JVM sập mà không có cờ `-XX:+HeapDumpOnOutOfMemoryError` khiến không còn bất kỳ bằng chứng bộ nhớ nào để điều tra.",
    "seniorSolution": "Cấu hình `-XX:+HeapDumpOnOutOfMemoryError` và `-XX:HeapDumpPath=/dumps/heap.hprof`. Sử dụng MAT mở file .hprof: xem Dominator Tree để tìm đối tượng chiếm Retained Heap lớn nhất, và xem 'Path to GC Roots (exclude all phantom/weak/soft references)' để tìm biến đang leak.",
    "practicalProof": "java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/app/oom.hprof -jar app.jar\n# MAT Dominator Tree identifies retained size and GC Root reference chain",
    "tags": [
      "OutOfMemoryError",
      "HeapDump",
      "MAT",
      "MemoryLeak",
      "DominatorTree"
    ]
  },
  {
    "id": "Q-SYS-APP-03",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "TCP Socket Saturation (TIME_WAIT, CLOSE_WAIT) & Sysctl Tuning",
    "question": "Điều chỉnh thông số Linux Kernel Sysctl để xử lý 100,000 kết nối TCP đồng thời mà không bị treo socket.",
    "scenarioContext": "Tối ưu hóa hạt nhân Linux (Kernel Tuning): Cấu hình `tcp_tw_reuse = 1` và điều chỉnh connection pool để ngăn ngừa cạn kiệt socket ở tải 50,000 RPS.",
    "juniorTrap": "Không phân biệt được socket TIME_WAIT (bên chủ động đóng) và CLOSE_WAIT (bên bị động quên đóng socket).",
    "seniorSolution": "Bật `net.ipv4.tcp_tw_reuse = 1` để kernel tái sử dụng socket TIME_WAIT an toàn cho kết nối outbound. Tăng `net.core.somaxconn = 65535` và `net.ipv4.tcp_max_syn_backlog = 65535` để hàng đợi bắt tay ba bước (SYN queue / Accept queue) không bị tràn.",
    "practicalProof": "# /etc/sysctl.conf:\nnet.ipv4.tcp_tw_reuse = 1\nnet.core.somaxconn = 65535\nnet.ipv4.tcp_max_syn_backlog = 65535\n# Apply: sysctl -p",
    "tags": [
      "TCPSockets",
      "TIME_WAIT",
      "CLOSE_WAIT",
      "SocketLeak",
      "KernelTuning"
    ]
  },
  {
    "id": "Q-SYS-APP-04",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Distributed Rate Limiter: Token Bucket vs Leaky Bucket vs Sliding Window",
    "question": "Thiết kế hệ thống Distributed Rate Limiter chịu tải 200,000 QPS tại tầng API Gateway với thuật toán Token Bucket.",
    "scenarioContext": "Bảo vệ hệ thống trước lưu lượng đột biến: Thiết kế bộ điều tiết lưu lượng phân tán kết hợp Token Bucket cho phép burst tải ngắn hạn mà vẫn giữ an toàn backend.",
    "juniorTrap": "Dùng Leaky Bucket khi hệ thống cần hỗ trợ khả năng tiếp nhận các đợt lưu lượng tăng đột biến ngắn hạn (Traffic Bursts).",
    "seniorSolution": "Token Bucket cho phép burst traffic tích lũy trong phạm vi dung lượng bucket tối đa. Tính toán nạp token dựa trên delta timestamp: `new_tokens = (now - last_time) * refill_rate`. Nếu tokens >= requested, trừ token và cho phép request đi qua; ngược lại trả về HTTP 429.",
    "practicalProof": "// Token Bucket refill formula in Redis Lua:\nlocal current_tokens = math.min(max_capacity, last_tokens + (now - last_time) * refill_rate);\nif current_tokens >= 1 then ...",
    "tags": [
      "RateLimiting",
      "TokenBucket",
      "LeakyBucket",
      "SlidingWindow",
      "SystemDesign"
    ]
  },
  {
    "id": "Q-SYS-APP-05",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Circuit Breaker Fallback Cascades & Thread Pool Isolation",
    "question": "Thiết kế kiến trúc phòng chống sụp đổ dây chuyền (Cascading Failure) cho hệ sinh thái 30 microservices bằng Circuit Breaker và Bulkhead.",
    "scenarioContext": "Khả năng chống chịu lỗi dây chuyền: Cô lập các nhóm dịch vụ bằng Bulkhead Thread Pool riêng biệt để sự cố của một bên thứ ba không kéo sập ứng dụng chính.",
    "juniorTrap": "Để tất cả các lời gọi service dùng chung một thread pool duy nhất của web container.",
    "seniorSolution": "Bulkhead Pattern cô lập tài nguyên: Mỗi remote service downstream có một Thread Pool hoặc Semaphore riêng biệt có bounded queue. Khi service A chết, chỉ có thread pool của A bị cạn kiệt; các service B, C vẫn hoạt động 100% bình thường trên các pools độc lập.",
    "practicalProof": "// Resilience4j Configuration:\nresilience4j.thread-pool-bulkhead.instances.paymentService.maxThreadPoolSize=10\nresilience4j.thread-pool-bulkhead.instances.recommendationService.maxThreadPoolSize=5",
    "tags": [
      "CircuitBreaker",
      "CascadingFailure",
      "Bulkhead",
      "ThreadIsolation",
      "Resilience"
    ]
  },
  {
    "id": "Q-SYS-APP-06",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Distributed Saga Pattern: Choreography vs Orchestrator with Compensation",
    "question": "Triển khai Orchestrator Saga Pattern điều phối quy trình đặt hàng: Tạo Order -> Trừ Tiền -> Giữ Kho -> Giao Hàng kèm các bước bù (Compensation).",
    "scenarioContext": "Giao dịch phân tán đa dịch vụ: Triển khai Saga Orchestrator với quy trình hoàn tác (Compensation) tự động khi bước thanh toán hoặc trừ kho bị thất bại.",
    "juniorTrap": "Dùng Choreography (Event-Driven không có orchestrator) cho quy trình nghiệp vụ có hơn 6 bước phức tạp, dẫn đến 'Spaghetti Events' không thể debug.",
    "seniorSolution": "Orchestrator tập trung hóa State Machine và luồng điều phối: gửi command tới từng service và lắng nghe reply. Nếu bước 3 (Giữ kho) thất bại, Orchestrator chủ động phát command bù (Compensating Transaction) tới Payment Service để hoàn tiền cho khách hàng.",
    "practicalProof": "public class OrderSagaOrchestrator {\n  public void executeSaga(OrderContext ctx) {\n    if (!paymentClient.debit(ctx)) return;\n    if (!inventoryClient.reserve(ctx)) {\n      paymentClient.compensateRefund(ctx); // Rollback step 1\n      return;\n    }\n  }\n}",
    "tags": [
      "SagaPattern",
      "Choreography",
      "Orchestration",
      "CompensatingTransactions",
      "Consistency"
    ]
  },
  {
    "id": "Q-SYS-APP-07",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Distributed Tracing Propagation (W3C TraceContext, TraceId/SpanId)",
    "question": "Cấu hình chuẩn hóa W3C TraceContext header `traceparent` cho các lời gọi RPC và Kafka events giữa 10 microservices khác nhau.",
    "scenarioContext": "Chuẩn hóa khả năng quan sát (Observability): Truyền bá W3C `traceparent` headers qua các giao thức HTTP, Kafka và gRPC trong toàn bộ hạ tầng đám mây.",
    "juniorTrap": "Tự phát minh ra custom header như `X-My-Trace-Id` không tương thích với các công cụ APM chuẩn (Datadog, Dynatrace, Jaeger).",
    "seniorSolution": "Chuẩn W3C TraceContext quy định định dạng header: `traceparent: 00-{trace-id}-{parent-id}-{trace-flags}` (version 2 hex, trace-id 16 bytes 32 hex, span-id 8 bytes 16 hex). Mọi HTTP client và Kafka producer phải tự động inject header này vào metadata.",
    "practicalProof": "// Injected HTTP Header:\ntraceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01\n// trace-id stays unchanged across all 10 services; parent-id updates per hop",
    "tags": [
      "DistributedTracing",
      "W3C-TraceContext",
      "OpenTelemetry",
      "TraceParent",
      "Observability"
    ]
  },
  {
    "id": "Q-SYS-APP-08",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Thực Hành & Áp Dụng",
    "theme": "Database Sharding: Consistent Hashing Ring & Virtual Nodes",
    "question": "Thiết kế thuật toán Consistent Hashing với 256 Virtual Nodes trên mỗi Physical Shard để phân tán đều 100 triệu tài khoản người dùng.",
    "scenarioContext": "Mở rộng cơ sở dữ liệu quy mô lớn: Phân tán 1 tỷ bản ghi người dùng trên 64 database nodes sử dụng vòng băm nhất quán (Consistent Hashing Ring) với Virtual Nodes.",
    "juniorTrap": "Dùng phép chia lấy dư đơn giản `shard_id = user_id % N` - khi thêm 1 node mới (N -> N+1), 90% dữ liệu bị rehash và di chuyển!",
    "seniorSolution": "Consistent Hashing bố trí các node trên một vòng tròn băm 2^32. Khi thêm node mới, chỉ có K/N keys (tỷ lệ tối thiểu) cần phải di dời. Virtual Nodes (vnodes) giải quyết bài toán phân bố không đều (Data Skew / Hot Spots), đảm bảo tải trải đều trên mọi servers.",
    "practicalProof": "public class ConsistentHashRouter {\n  private final SortedMap<Integer, ShardNode> ring = new TreeMap<>();\n  public void addShard(ShardNode node) {\n    for (int i = 0; i < 256; i++) {\n      ring.put(hash(node.getName() + \"-vnode-\" + i), node);\n    }\n  }\n}",
    "tags": [
      "DatabaseSharding",
      "ConsistentHashing",
      "VirtualNodes",
      "HorizontalScale",
      "HotSpot"
    ]
  },
  {
    "id": "Q-SYS-ANA-09",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Idempotency Key Design with Distributed Storage & Unique Constraints",
    "question": "Điều tra lỗi nghiêm trọng: Khách hàng thanh toán đơn hàng A nhận được biên lai kết quả của đơn hàng B của một khách hàng khác.",
    "scenarioContext": "Key Collision Disaster: Khách hàng A nhận được biên lai giao dịch của khách hàng B do Client sinh Idempotency-Key quá sơ sài bằng timestamp đơn thuần.",
    "juniorTrap": "Đổ lỗi cho framework web bị trộn lẫn session.",
    "seniorSolution": "Do Client sinh Idempotency-Key quá sơ sài (e.g. dùng timestamp hoặc sequence tăng dần từ 1). Hai user khác nhau vô tình sinh trùng một Idempotency-Key, và backend trả về ngay kết quả đã lưu của request trước đó! Bắt buộc phải kết hợp: `Composite Key = UserID + Scope + UUID`.",
    "practicalProof": "// Secure Idempotency Key format: String key = \"idemp:\" + currentUserId + \":\" + clientSuppliedUuid;",
    "tags": [
      "IdempotencyKey",
      "PaymentGateway",
      "UniqueConstraint",
      "Deduplication",
      "DistributedLocks"
    ]
  },
  {
    "id": "Q-SYS-ANA-10",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Graceful Shutdown & In-Flight Request Draining on SIGTERM",
    "question": "Phân tích nguyên nhân Kubernetes gửi SIGKILL (cưỡng chế dừng sau 30 giây) khiến dữ liệu batch job đang ghi bị dở dang.",
    "scenarioContext": "Bad Gateway Spikes: Mỗi lần cập nhật phiên bản mới, khách hàng gặp hàng loạt lỗi `502 Bad Gateway` vì Tomcat bị tắt trước khi Ingress kịp cập nhật danh sách Pods.",
    "juniorTrap": "Tăng timeout của Spring Boot mà không tăng `terminationGracePeriodSeconds` trong Kubernetes Pod Spec.",
    "seniorSolution": "Mặc định Kubernetes có `terminationGracePeriodSeconds = 30s`. Nếu preStop sleep 10s + Spring graceful shutdown cần 25s = 35s > 30s, Kubernetes sẽ không chờ nữa mà lập tức gửi lệnh SIGKILL (Exit code 137), ngắt nguồn thô bạo! Cần tăng `terminationGracePeriodSeconds: 60`.",
    "practicalProof": "spec:\n  terminationGracePeriodSeconds: 60 # Provides ample time for graceful drain before kernel SIGKILL",
    "tags": [
      "GracefulShutdown",
      "SIGTERM",
      "KubernetesLifecycle",
      "PreStopHook",
      "InFlightRequests"
    ]
  },
  {
    "id": "Q-SYS-ANA-11",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Reverse Proxy Optimization (Nginx Worker Connections, Keepalive Pools)",
    "question": "Mổ xẻ lỗi `768 worker_connections are not enough` trong Nginx error.log và cách tính toán sizing chuẩn xác.",
    "scenarioContext": "Proxy Latency Overhead: Mỗi HTTP request gửi vào backend đều bắt Nginx phải thực hiện 3-way TCP handshake từ đầu do thiếu cấu hình upstream keepalive pool.",
    "juniorTrap": "Chỉ tăng `worker_connections` mà quên tăng giới hạn file descriptors `worker_rlimit_nofile` của hệ điều hành.",
    "seniorSolution": "Mỗi kết nối proxy tốn 2 connections (1 client-to-nginx, 1 nginx-to-upstream). Tổng connections = `worker_processes * worker_connections`. Hơn nữa, mỗi connection là 1 socket (File Descriptor). Nếu không tăng `worker_rlimit_nofile` và `ulimit -n`, Nginx sẽ bị chặn bởi kernel limits!",
    "practicalProof": "worker_processes auto;\nworker_rlimit_nofile 100000;\nevents {\n  worker_connections 20480;\n  use epoll;\n}",
    "tags": [
      "Nginx",
      "ReverseProxy",
      "KeepalivePool",
      "WorkerConnections",
      "HighThroughput"
    ]
  },
  {
    "id": "Q-SYS-ANA-12",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "DNS Resolution Caching, TTL Expiration & Round-Robin Failover",
    "question": "Chẩn đoán hiện tượng ứng dụng ném hàng loạt lỗi `UnknownHostException` hoặc `Connection Timed Out` kéo dài nhiều giờ sau khi DevOps chuyển đổi cụm Database sang cụm mới.",
    "scenarioContext": "Stale IP Blackhole: Dịch vụ đối tác chuyển đổi IP dự phòng nhưng backend Java vẫn gửi request vào IP chết do JVM mặc định lưu cache DNS vĩnh viễn (TTL = -1).",
    "juniorTrap": "Đổ lỗi cho nhà cung cấp dịch vụ Internet (ISP).",
    "seniorSolution": "Do JVM của ứng dụng đang cache bản ghi DNS cũ vĩnh viễn (TTL = infinity). Trong khi DNS server đã trỏ CNAME sang IP mới, tiến trình Java đang chạy vẫn ôm chặt IP cũ đã ngừng hoạt động. Khởi động lại service mới hết lỗi chính là triệu chứng kinh điển của bệnh này!",
    "practicalProof": "// Verify JVM startup flags: -Dsun.net.inetaddr.ttl=15 ensures dynamic DNS refreshes every 15s",
    "tags": [
      "DNSResolution",
      "DNSTTL",
      "JVM-DNS-Cache",
      "ServiceDiscovery",
      "Failover"
    ]
  },
  {
    "id": "Q-SYS-ANA-13",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Edge Caching & Stale-While-Revalidate HTTP Directives",
    "question": "Phân tích rủi ro dữ liệu cá nhân (PII) của người dùng bị rò rỉ công khai cho hàng triệu người khác do cấu hình sai Edge Cache.",
    "scenarioContext": "Private Data Leak: Header `Cache-Control: public` bị gắn nhầm vào API thông tin cá nhân `/api/me`, khiến CDN lưu cache và phục vụ dữ liệu User A cho User B.",
    "juniorTrap": "Nghĩ CDN tự động phân biệt được dữ liệu nào là riêng tư.",
    "seniorSolution": "Khi một API trả về dữ liệu cá nhân (e.g. `/api/profile`) nhưng backend vô tình thêm header `Cache-Control: public`. CDN sẽ lưu bản ghi của User A vào Edge Cache và phục vụ bản ghi này cho tất cả User B, C, D tiếp theo gọi vào endpoint đó! API có thông tin cá nhân BẮT BUỘC phải là `private, no-store`.",
    "practicalProof": "// Rule: Authenticated endpoints must ALWAYS emit: Cache-Control: no-store, private",
    "tags": [
      "EdgeCaching",
      "CDN",
      "StaleWhileRevalidate",
      "CacheControl",
      "HTTP-Directives"
    ]
  },
  {
    "id": "Q-SYS-ANA-14",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Disaster Recovery Strategies (RPO vs RTO) & Active-Active Multi-Region",
    "question": "Mổ xẻ định lý CAP và giới hạn vật lý tốc độ ánh sáng: Tại sao không thể có một hệ thống Active-Active Multi-Region (cách nhau 5,000 km) vừa có RPO = 0 vừa có độ trễ ghi dưới 5ms?",
    "scenarioContext": "Physics Law Violation: Đội ngũ hứa hẹn với khách hàng hệ thống Active-Active cách nhau 5,000 km có thể đạt RPO = 0 với độ trễ ghi dưới 5ms (vi phạm tốc độ ánh sáng).",
    "juniorTrap": "Hứa hẹn với khách hàng rằng công nghệ mới có thể vượt qua định lý PACELC.",
    "seniorSolution": "Khoảng cách 5,000 km (e.g. US to EU) có thời gian khứ hồi (RTT) của ánh sáng trong cáp quang tối thiểu là ~50-70ms. Để đạt RPO = 0, lệnh ghi BẮT BUỘC phải đợi ACK từ region bên kia trước khi trả lời client, do đó độ trễ ghi không thể nào thấp hơn 70ms! Đây là quy luật vật lý không thể phá vỡ.",
    "practicalProof": "// Physical invariant: 5,000 km optical round-trip time ~ 50ms min RTT",
    "tags": [
      "DisasterRecovery",
      "RPO",
      "RTO",
      "ActiveActive",
      "MultiRegion"
    ]
  },
  {
    "id": "Q-SYS-ANA-15",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Little's Law & Thread Sizing (Concurrency = Throughput × Latency)",
    "question": "Chẩn đoán hiện tượng thảm họa khi latency của downstream service tăng từ 50ms lên 500ms nhưng throughput yêu cầu không đổi (2,000 RPS).",
    "scenarioContext": "Cascading Saturation: Khi dịch vụ phía sau bị chậm từ 50ms lên 500ms, nhu cầu số luồng tăng vọt 10 lần làm cạn sạch thread pool và ném lỗi HTTP 503.",
    "juniorTrap": "Kỳ vọng server vẫn duy trì được hiệu năng cũ vì phần cứng không thay đổi.",
    "seniorSolution": "Theo Little's Law: Khi latency tăng 10 lần (0.5s), số concurrent requests đang xử lý trong hệ thống sẽ tăng vọt lên: `2000 * 0.5 = 1,000 threads`! Pool 100 threads lập tức bị cạn kiệt, 900 requests phía sau bị đẩy vào queue, gây tràn hàng đợi và ném HTTP 503 Service Unavailable!",
    "practicalProof": "// Little's Law proof: Latency spike forces 10x thread demand -> immediate pool saturation",
    "tags": [
      "LittlesLaw",
      "CapacityPlanning",
      "ThreadSizing",
      "QueueingTheory",
      "Backpressure"
    ]
  },
  {
    "id": "Q-SYS-ANA-16",
    "domain": "System Design & Troubleshooting",
    "domainCode": "SYS",
    "category": "Phân Tích & Điều Tra Sự Cố",
    "theme": "Chaos Engineering: Fault Injection, Network Latency & Chaos Monkey",
    "question": "Phân tích phát hiện kinh điển trong diễn tập Chaos: Ứng dụng không bao giờ sập khi một service chết hẳn, nhưng lại sập toàn diện khi service đó bị CHẬM (Slow Degradation).",
    "scenarioContext": "Slowness Destruction: Ứng dụng không bao giờ sập khi một service chết hẳn (fail-fast), nhưng lại sập toàn diện khi service đó bị phản hồi chậm (slow degradation).",
    "juniorTrap": "Nghĩ service bị chậm thì vẫn tốt hơn là service bị chết hoàn toàn.",
    "seniorSolution": "Khi service chết hẳn (Connection Refused), caller nhận lỗi ngay lập tức trong 1ms (Fail-Fast) và nhả tài nguyên. Nhưng khi service bị CHẬM (mất 30s mới timeout), hàng ngàn threads bị giam giữ chờ đợi, làm cạn kiệt toàn bộ connection pools, thread pools và memory của toàn bộ hệ sinh thái!",
    "practicalProof": "// Core architectural insight: Slowness is 100x more destructive than instant crash",
    "tags": [
      "ChaosEngineering",
      "FaultInjection",
      "ChaosMonkey",
      "Reliability",
      "GameDay"
    ]
  }
];

export function getInterview5120Questions(): InterviewQuestionItem[] {
  return RAW_QUESTIONS_128;
}

export function getRandomInterview5120Questions(
  count: number = 5,
  domainCode?: string,
  category?: 'Thực Hành & Áp Dụng' | 'Phân Tích & Điều Tra Sự Cố'
): InterviewQuestionItem[] {
  const all = RAW_QUESTIONS_128;
  let filtered = all;
  if (domainCode && domainCode !== 'ALL') {
    filtered = filtered.filter((q) => q.domainCode === domainCode);
  }
  if (category) {
    filtered = filtered.filter((q) => q.category === category);
  }
  if (filtered.length <= count) return [...filtered];

  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const ALL_INTERVIEW_QUESTIONS_5120 = RAW_QUESTIONS_128;
export const ALL_INTERVIEW_QUESTIONS_128 = RAW_QUESTIONS_128;
