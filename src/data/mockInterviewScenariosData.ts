export interface LiveBugScenario {
  id: string;
  title: string;
  topic: 'Java Backend' | 'Spring Boot' | 'Database' | 'Network';
  level: 'Intern' | 'Fresher' | 'Junior';
  symptom: string;
  codeSnippet: string;
  question: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  seniorTakeaway: string;
}

export interface JDAnalysisKeyword {
  term: string;
  aliases: string[];
  category: 'Java Backend' | 'Spring Boot' | 'Database' | 'Network';
  importance: 'CORE' | 'BONUS';
  recommendedFocus: string;
}

export interface AnswerFrameworkTemplate {
  id: string;
  name: string;
  badge: string;
  description: string;
  templateText: string;
}

export const ANSWER_FRAMEWORK_TEMPLATES: AnswerFrameworkTemplate[] = [
  {
    id: 'framework-deep-dive',
    name: '🎯 Khung 3 Tầng: Định Nghĩa ➔ Under-the-Hood ➔ Thực Tế',
    badge: 'Lý thuyết & Cơ chế',
    description: 'Cấu trúc chuẩn 10 điểm cho các câu hỏi về cơ chế JVM, HashMap, Spring Bean, Indexing...',
    templateText: `1. Định nghĩa cốt lõi:
- Bản chất của khái niệm này là...

2. Cơ chế hoạt động bên dưới (Under-the-hood):
- Khi thực thi, hệ thống xử lý qua các bước: ...

3. Lưu ý thực chiến & Đánh đổi (Trade-offs):
- Trong dự án thực tế, cần chú ý lỗi/edge-case: ...`
  },
  {
    id: 'framework-comparison',
    name: '⚖️ Khung So Sánh: Điểm Chung ➔ Khác Biệt ➔ Khi Nào Dùng Gì',
    badge: 'Câu hỏi Phân biệt A vs B',
    description: 'Dùng cho câu hỏi phân biệt (vd: ArrayList vs LinkedList, String vs StringBuilder, PUT vs PATCH)...',
    templateText: `1. Điểm cốt lõi khác biệt nhất:
- Giữa A và B, sự khác biệt lớn nhất nằm ở cơ chế...

2. So sánh chi tiết:
- Về cấu trúc lưu trữ / hiệu năng: ...
- Về độ an toàn đa luồng (Thread-safety) / hành vi: ...

3. Khi nào chọn A, khi nào chọn B trong thực tế:
- Chọn A khi bài toán ưu tiên... Ngược lại chọn B khi...`
  },
  {
    id: 'framework-troubleshooting',
    name: '🛠️ Khung Xử Lý Sự Cố: Nguyên Nhân ➔ Chẩn Đoán ➔ Giải Pháp',
    badge: 'Tối ưu & Debug',
    description: 'Dùng cho câu hỏi xử lý N+1 Query, Deadlock, Memory Leak, Slow API...',
    templateText: `1. Nguyên nhân gốc rễ (Root Cause):
- Vấn đề xảy ra do...

2. Cách phát hiện và khoanh vùng:
- Kiểm tra thông qua...

3. Giải pháp khắc phục triệt để:
- Cách xử lý chuẩn trong dự án là sử dụng... nhằm đảm bảo...`
  }
];

export const JD_ANALYSIS_KEYWORDS: JDAnalysisKeyword[] = [
  {
    term: 'Java Core / OOP / Collections',
    aliases: ['java', 'oop', 'object-oriented', 'collections', 'hashmap', 'multithread', 'concurrency', 'jvm', 'stream', 'java 8', 'java 17', 'java 21'],
    category: 'Java Backend',
    importance: 'CORE',
    recommendedFocus: 'Ôn kỹ Pass-by-Value, HashMap internals (Red-Black Tree), equals/hashCode contract, String Pool và Garbage Collection.'
  },
  {
    term: 'Spring Boot / Spring Framework',
    aliases: ['spring boot', 'spring', 'ioc', 'dependency injection', 'di', 'bean', 'autoconfigure', 'aop', 'spring mvc', 'spring security', 'jwt'],
    category: 'Spring Boot',
    importance: 'CORE',
    recommendedFocus: 'Nắm vững vòng đời Bean, @Transactional (Self-invocation trap), cơ chế IoC/DI, Filter vs Interceptor và xác thực JWT.'
  },
  {
    term: 'SQL / RDBMS / JPA / Hibernate',
    aliases: ['sql', 'mysql', 'postgresql', 'oracle', 'database', 'jpa', 'hibernate', 'orm', 'index', 'transaction', 'acid', 'redis', 'nosql'],
    category: 'Database',
    importance: 'CORE',
    recommendedFocus: 'Chuẩn bị kỹ bài toán N+1 Query (JOIN FETCH / @EntityGraph), B-Tree Index (Leftmost Prefix), ACID và Transaction Isolation Levels.'
  },
  {
    term: 'RESTful API / HTTP / Microservices / Network',
    aliases: ['rest', 'restful', 'api', 'http', 'https', 'tcp', 'cors', 'microservices', 'docker', 'kafka', 'rabbitmq', 'websocket', 'load balancer'],
    category: 'Network',
    importance: 'CORE',
    recommendedFocus: 'Hiểu rõ Idempotency (PUT vs POST), HTTP Status Codes (401 vs 403), TCP 3-way handshake, CORS Preflight và Stateless Authentication.'
  }
];

export const LIVE_BUG_SCENARIOS: LiveBugScenario[] = [
  {
    id: 'bug-java-string-compare',
    title: 'Production Bug #1: So sánh chuỗi & Lỗi NullPointerException ngầm',
    topic: 'Java Backend',
    level: 'Intern',
    symptom: 'API xác thực quyền truy cập thỉnh thoảng bị văng lỗi NullPointerException (HTTP 500) khi user chưa thiết lập role, hoặc trả về false dù role gửi lên là "ADMIN".',
    codeSnippet: `public boolean isAdmin(User user) {
    // Bug tiềm ẩn ở dòng kiểm tra dưới đây:
    if (user.getRole() == "ADMIN") {
        return true;
    }
    return user.getRole().equals("SUPER_ADMIN");
}`,
    question: 'Đoạn code trên mắc những lỗi nghiêm trọng nào khi chạy trên môi trường thực tế?',
    options: [
      {
        id: 'opt-1',
        label: 'Dùng toán tử == để so sánh nội dung String và gọi user.getRole().equals(...) dễ gây NullPointerException nếu getRole() == null.',
        isCorrect: true,
        explanation: 'Chính xác 100%! Toán tử == chỉ so sánh địa chỉ ô nhớ (reference), phải dùng .equals(). Hơn nữa, đặt hằng số đằng trước: "SUPER_ADMIN".equals(user.getRole()) sẽ tránh hoàn toàn lỗi NullPointerException (Yoda condition).'
      },
      {
        id: 'opt-2',
        label: 'Kiểu trả về boolean nguyên thủy không thể lưu giá trị true/false trong hàm.',
        isCorrect: false,
        explanation: 'Chưa đúng. Kiểu boolean nguyên thủy hoàn toàn hợp lệ, lỗi nằm ở toán tử == với String và nguy cơ NPE.'
      },
      {
        id: 'opt-3',
        label: 'Chuỗi "ADMIN" viết hoa nên Java không thể so sánh được.',
        isCorrect: false,
        explanation: 'Chưa đúng. Java phân biệt hoa thường nhưng lỗi cốt lõi là dùng == thay vì equals() và gọi method trên biến có thể null.'
      }
    ],
    seniorTakeaway: 'Quy tắc vàng khi đi làm: Luôn dùng Objects.equals(a, b) hoặc đặt String hằng số đứng trước: "ADMIN".equals(user.getRole()) để không bao giờ bị NullPointerException!'
  },
  {
    id: 'bug-spring-transactional-self-invocation',
    title: 'Production Bug #2: @Transactional không chịu Rollback khi lỗi!',
    topic: 'Spring Boot',
    level: 'Fresher',
    symptom: 'Khi hàm createOrder() ném ra RuntimeException ở bước cuối, dữ liệu đơn hàng vẫn bị lưu vào Database mà KHÔNG hề được rollback như kỳ vọng.',
    codeSnippet: `@Service
public class OrderService {

    public void processCheckout(OrderRequest req) {
        validateRequest(req);
        // Gọi hàm nội bộ trong cùng 1 class:
        this.createOrderInDb(req);
    }

    @Transactional
    public void createOrderInDb(OrderRequest req) {
        orderRepository.save(new Order(req));
        throw new RuntimeException("Lỗi kết nối cổng thanh toán!");
    }
}`,
    question: 'Tại sao annotation @Transactional trên hàm createOrderInDb() lại bị vô hiệu hóa hoàn toàn?',
    options: [
      {
        id: 'opt-1',
        label: 'Do @Transactional mặc định không rollback với RuntimeException.',
        isCorrect: false,
        explanation: 'Sai. Mặc định @Transactional CÓ tự động rollback với mọi RuntimeException (Unchecked Exception).'
      },
      {
        id: 'opt-2',
        label: 'Do lỗi Self-Invocation: Gọi this.createOrderInDb() trực tiếp trong cùng class sẽ đi thẳng vào object gốc, bỏ qua lớp Spring AOP Proxy nên Transaction Interceptor không được kích hoạt.',
        isCorrect: true,
        explanation: 'Xuất sắc! Spring @Transactional hoạt động dựa trên cơ chế AOP Proxy bọc bên ngoài Bean. Khi gọi nội bộ qua từ khóa this, cuộc gọi không đi qua Proxy nên không có Transaction nào được mở.'
      },
      {
        id: 'opt-3',
        label: 'Do thiếu từ khóa synchronized trên hàm processCheckout().',
        isCorrect: false,
        explanation: 'Sai. synchronized dùng cho đồng bộ luồng, không liên quan đến cơ chế Spring AOP Proxy của @Transactional.'
      }
    ],
    seniorTakeaway: 'Để @Transactional hoạt động: Phải đặt @Transactional ngay ở hàm entry-point (processCheckout) hoặc tách hàm sang một @Service Bean riêng biệt.'
  },
  {
    id: 'bug-jpa-n-plus-1',
    title: 'Production Bug #3: API danh sách chậm 5 giây vì bẫy N+1 Query',
    topic: 'Database',
    level: 'Fresher',
    symptom: 'Khi lấy danh sách 100 phòng ban (Department) kèm số lượng nhân viên của mỗi phòng, log SQL bắn ra tới 101 câu lệnh SELECT liên tiếp làm treo DB connection pool.',
    codeSnippet: `@Entity
public class Department {
    @Id private Long id;
    private String name;

    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    private List<Employee> employees;
}

// Trong Service:
List<Department> depts = departmentRepo.findAll(); // 1 câu query
for (Department d : depts) {
    // Mỗi vòng lặp bắn thêm 1 câu query lấy employees!
    System.out.println(d.getName() + ": " + d.getEmployees().size());
}`,
    question: 'Giải pháp nào dưới đây giúp xử lý triệt để lỗi N+1 Query trên mà chỉ tốn đúng 1 câu truy vấn SQL?',
    options: [
      {
        id: 'opt-1',
        label: 'Đổi fetch = FetchType.LAZY thành fetch = FetchType.EAGER trong class Department.',
        isCorrect: false,
        explanation: 'Cạm bẫy kinh điển! Đổi sang EAGER khi dùng findAll() vẫn sinh ra N+1 query, thậm chí còn làm mọi truy vấn khác luôn phải tải toàn bộ bảng con gây tràn bộ nhớ.'
      },
      {
        id: 'opt-2',
        label: 'Sử dụng câu truy vấn JPQL với LEFT JOIN FETCH (vd: SELECT d FROM Department d LEFT JOIN FETCH d.employees) hoặc dùng @EntityGraph.',
        isCorrect: true,
        explanation: 'Chuẩn xác! JOIN FETCH hoặc @EntityGraph ép Hibernate gộp dữ liệu thông qua 1 câu lệnh SQL JOIN duy nhất, giảm 101 queries xuống còn đúng 1 query.'
      },
      {
        id: 'opt-3',
        label: 'Tăng kích thước HikariCP connection pool lên 500 connections.',
        isCorrect: false,
        explanation: 'Sai. Tăng connection pool không giải quyết gốc rễ số lượng query thừa mà còn làm CPU của Database bị quá tải nặng hơn.'
      }
    ],
    seniorTakeaway: 'Không bao giờ dùng FetchType.EAGER để chữa N+1! Hãy giữ LAZY mặc định và chủ động dùng JOIN FETCH, @EntityGraph hoặc DTO Projection cho từng API cụ thể.'
  },
  {
    id: 'bug-network-put-vs-post-idempotency',
    title: 'Production Bug #4: Khách hàng bị trừ tiền 2 lần khi mạng chập chờn (Double Charge)',
    topic: 'Network',
    level: 'Junior',
    symptom: 'Khi khách hàng bấm nút "Thanh Toán" trên App, mạng 4G bị chập chờn nên App tự động retry gửi lại request thêm 1 lần nữa. Kết quả khách bị trừ tiền 2 lần cho cùng 1 đơn hàng!',
    codeSnippet: `@PostMapping("/api/v1/payments/charge")
public ResponseEntity<PaymentReceipt> chargeOrder(@RequestBody ChargeRequest req) {
    // Mỗi lần request tới đều trừ tiền và tạo giao dịch mới:
    walletService.deductBalance(req.getUserId(), req.getAmount());
    PaymentReceipt receipt = paymentRepo.save(new PaymentReceipt(req));
    return ResponseEntity.ok(receipt);
}`,
    question: 'Cơ chế thiết kế API nào giúp chống lại việc trừ tiền trùng lặp (Duplicate Mutation) khi Client tự động retry?',
    options: [
      {
        id: 'opt-1',
        label: 'Áp dụng Idempotency Key (khóa bất biến): Client sinh UUID duy nhất gửi kèm header Idempotency-Key; Server kiểm tra trong Redis/DB với Unique Constraint trước khi trừ tiền.',
        isCorrect: true,
        explanation: 'Hoàn hảo! Idempotency-Key kết hợp Unique Constraint hoặc Atomic lock trong Redis đảm bảo dù Client có retry 10 lần cùng 1 mã giao dịch thì Server cũng chỉ thực thi trừ tiền đúng 1 lần duy nhất.'
      },
      {
        id: 'opt-2',
        label: 'Chuyển method từ @PostMapping sang @GetMapping để trình duyệt tự cache.',
        isCorrect: false,
        explanation: 'Rất nguy hiểm! GET chỉ dùng để đọc dữ liệu, tuyệt đối không bao giờ dùng GET cho tác vụ làm thay đổi trạng thái (trừ tiền).'
      },
      {
        id: 'opt-3',
        label: 'Chỉ cần ẩn nút bấm trên giao diện Frontend là đủ 100%.',
        isCorrect: false,
        explanation: 'Chưa đủ! Disable nút ở Frontend chỉ ngăn người dùng bấm đúp tay, không ngăn được việc cổng mạng/gateway tự retry gói tin hoặc hacker gọi API trực tiếp.'
      }
    ],
    seniorTakeaway: 'Mọi API thanh toán hoặc tạo đơn hàng quan trọng đều bắt buộc phải thiết kế Idempotent thông qua Idempotency-Key ở tầng Backend!'
  },
  {
    id: 'bug-java-concurrent-modification',
    title: 'Production Bug #5: Lỗi sập luồng xử lý giỏ hàng vì xóa phần tử khi đang lặp',
    topic: 'Java Backend',
    level: 'Fresher',
    symptom: 'Hàm dọn dẹp các sản phẩm hết hạn trong giỏ hàng bị văng ngoại lệ ConcurrentModificationException ngay khi gặp sản phẩm hết hạn đầu tiên.',
    codeSnippet: `public void removeExpiredItems(List<CartItem> items) {
    for (CartItem item : items) {
        if (item.isExpired()) {
            // Lỗi văng ra ngay tại dòng này:
            items.remove(item);
        }
    }
}`,
    question: 'Tại sao dùng vòng lặp for-each kết hợp items.remove(item) lại ném ra ConcurrentModificationException và cách sửa chuẩn nhất là gì?',
    options: [
      {
        id: 'opt-1',
        label: 'Do ArrayList sử dụng cơ chế Fail-Fast kiểm tra biến modCount != expectedModCount trong Iterator. Cách sửa chuẩn từ Java 8+ là dùng items.removeIf(CartItem::isExpired) hoặc dùng Iterator.remove().',
        isCorrect: true,
        explanation: 'Chính xác tuyệt đối! Vòng lặp for-each ngầm dùng Iterator. Khi gọi trực tiếp list.remove(), modCount thay đổi nhưng expectedModCount của Iterator không được cập nhật dẫn tới Fail-Fast exception. Dùng items.removeIf(...) vừa ngắn gọn vừa an toàn 100%.'
      },
      {
        id: 'opt-2',
        label: 'Do List trong Java là bất biến (Immutable) nên không bao giờ cho phép xóa phần tử.',
        isCorrect: false,
        explanation: 'Sai. ArrayList hoàn toàn cho phép thêm/xóa phần tử, lỗi xảy ra là do xóa trực tiếp trên cấu trúc List trong khi đang duyệt bằng for-each Iterator.'
      },
      {
        id: 'opt-3',
        label: 'Chỉ cần bọc khối try-catch(Exception e) bỏ qua lỗi là danh sách sẽ tự xóa hết.',
        isCorrect: false,
        explanation: 'Rất nguy hiểm! Khi exception văng ra, vòng lặp bị ngắt ngay lập tức khiến các sản phẩm hết hạn phía sau không được kiểm tra và xóa.'
      }
    ],
    seniorTakeaway: 'Tuyệt đối không gọi collection.remove() bên trong vòng lặp for-each! Hãy luôn sử dụng collection.removeIf(predicate) trong Java 8+.'
  },
  {
    id: 'bug-database-missing-composite-index',
    title: 'Production Bug #6: Đánh Index rồi nhưng Database vẫn quét toàn bộ bảng (Full Table Scan)',
    topic: 'Database',
    level: 'Junior',
    symptom: 'Bảng orders có 10 triệu dòng, đã đánh Composite Index trên 3 cột (status, created_at, customer_id). Nhưng truy vấn tìm đơn hàng theo customer_id vẫn chạy mất 4.5 giây!',
    codeSnippet: `-- Index đã tạo trong Database:
CREATE INDEX idx_orders_status_date_cust 
ON orders (status, created_at, customer_id);

-- Câu truy vấn thực tế bị chậm:
SELECT * FROM orders 
WHERE customer_id = 987654;`,
    question: 'Tại sao Database Optimizer lại bỏ qua idx_orders_status_date_cust và phải quét toàn bộ bảng (Full Table Scan)?',
    options: [
      {
        id: 'opt-1',
        label: 'Vi phạm quy tắc Leftmost Prefix (Tiền tố trái cùng) của B-Tree Index: Cột customer_id nằm ở vị trí thứ 3, nhưng mệnh đề WHERE không hề lọc theo cột đầu tiên là status.',
        isCorrect: true,
        explanation: 'Chuẩn xác! B-Tree Composite Index sắp xếp dữ liệu ưu tiên theo cột đầu tiên (status), rồi mới đến created_at và customer_id. Nếu bỏ qua cột đầu tiên (status) trong WHERE, cây B-Tree không thể định hướng tìm kiếm được.'
      },
      {
        id: 'opt-2',
        label: 'Do câu lệnh dùng SELECT * thay vì SELECT id.',
        isCorrect: false,
        explanation: 'Chưa đúng nguyên nhân gốc. Dù SELECT id mà WHERE chỉ có customer_id thì vẫn không tận dụng được B-Tree Seek trên index (status, created_at, customer_id).'
      },
      {
        id: 'opt-3',
        label: 'Do kiểu dữ liệu của customer_id là số nguyên nên không dùng được Index.',
        isCorrect: false,
        explanation: 'Sai. Số nguyên (BIGINT/INT) là kiểu dữ liệu tối ưu nhất cho B-Tree Index; lỗi ở đây là thứ tự cột trong Composite Index.'
      }
    ],
    seniorTakeaway: 'Khi thiết kế Composite Index (A, B, C), nó chỉ tăng tốc cho các truy vấn lọc theo (A), (A, B), hoặc (A, B, C). Nếu thường xuyên tìm riêng theo customer_id, phải đánh Index riêng hoặc đưa customer_id lên đầu!'
  }
];

export interface SampleJDPreset {
  id: string;
  title: string;
  companyHint: string;
  level: 'Intern' | 'Fresher' | 'Junior';
  jdContent: string;
}

export const SAMPLE_JD_PRESETS: SampleJDPreset[] = [
  {
    id: 'jd-intern-java',
    title: '🌱 JD Backend Java Intern (Big Tech)',
    companyHint: 'S*** / G***',
    level: 'Intern',
    jdContent: `Vị trí: Software Engineer Intern (Java Backend)
Yêu cầu ứng viên:
- Sinh viên năm 3, năm cuối chuyên ngành CNTT hoặc Khoa học máy tính.
- Nắm vững kiến thức nền tảng về Lập trình hướng đối tượng (OOP), Java Core, Collections Framework (ArrayList, HashMap).
- Hiểu cơ bản về cơ sở dữ liệu quan hệ (SQL, MySQL/PostgreSQL), các câu lệnh JOIN và khóa ngoại.
- Hiểu giao thức HTTP, RESTful API cơ bản. Có tư duy giải quyết vấn đề tốt.`
  },
  {
    id: 'jd-fresher-springboot',
    title: '🚀 JD Java Spring Boot Fresher (Fintech / E-Commerce)',
    companyHint: 'M*** / V***',
    level: 'Fresher',
    jdContent: `Vị trí: Java Backend Engineer (Fresher)
Mô tả công việc & Yêu cầu:
- Phát triển các dịch vụ RESTful API thanh toán bằng ngôn ngữ Java 17 và Spring Boot.
- Nắm vững cơ chế IoC, Dependency Injection, vòng đời Spring Bean và quản lý giao dịch với @Transactional.
- Làm việc với Spring Data JPA / Hibernate, tối ưu hóa câu lệnh SQL, hiểu về Index và ACID Transaction.
- Tích hợp xác thực bảo mật với Spring Security, JWT và nắm rõ các HTTP Status Codes.`
  },
  {
    id: 'jd-junior-highscale',
    title: '⚡ JD Junior Backend Engineer (High-Concurrency & Microservices)',
    companyHint: 'A*** / N***',
    level: 'Junior',
    jdContent: `Vị trí: Junior Backend Software Engineer (1+ năm kinh nghiệm)
Yêu cầu kỹ thuật:
- Có từ 1-2 năm kinh nghiệm phát triển hệ thống phân tán với Java, Spring Boot, Microservices.
- Hiểu sâu về Java Multithreading, Concurrency, JVM Memory Model, Garbage Collection và ConcurrentHashMap.
- Kinh nghiệm xử lý bài toán N+1 Query trong Hibernate/JPA, thiết kế B-Tree Composite Index, Redis Caching.
- Hiểu về thiết kế API chịu lỗi (Idempotency, Rate Limiting), CORS, TCP/HTTPS và Message Queue (Kafka).`
  }
];


/**
 * Generates contextual follow-up probes based on candidate's evaluation result.
 */
export function generateInterviewerProbes(
  topic: string,
  missingPointTexts: string[],
  trapWarning: string,
  score: number
): string[] {
  const probes: string[] = [];

  if (missingPointTexts.length > 0) {
    probes.push(
      `🤔 Câu hỏi đào sâu 1: Trong câu trả lời vừa rồi, bạn chưa đề cập rõ tới ý "${missingPointTexts[0]}". Nếu hệ thống gặp tình huống này trong thực tế, cơ chế bên dưới sẽ xử lý như thế nào?`
    );
  } else {
    probes.push(
      `🌟 Câu hỏi nâng cao 1: Bạn đã nắm rất chắc lý thuyết cơ bản! Vậy nếu lưu lượng truy cập tăng gấp 10 lần (High Concurrency), cơ chế này sẽ bộc lộ điểm nghẽn (bottleneck) ở đâu?`
    );
  }

  if (trapWarning) {
    probes.push(
      `⚡ Thử thách tình huống thực tế (Edge-Case): ${trapWarning}`
    );
  }

  if (score >= 80) {
    probes.push(
      `🚀 Góc nhìn Kiến trúc sư: Giữa việc tối ưu hiệu năng (Performance) và giữ cho code dễ bảo trì (Maintainability) trong chủ đề ${topic}, bạn sẽ đặt ranh giới đánh đổi (trade-off) như thế nào cho dự án?`
    );
  }

  return probes;
}

/**
 * Analyzes a Job Description text and extracts matched technical focus areas.
 */
export function analyzeJobDescription(jdText: string): {
  matchedKeywords: JDAnalysisKeyword[];
  detectedTopics: Array<'Java Backend' | 'Spring Boot' | 'Database' | 'Network'>;
  recommendedLevel: 'Intern' | 'Fresher' | 'Junior';
  readinessChecklist: string[];
} {
  const normalized = (jdText || '').toLowerCase();
  const matchedKeywords: JDAnalysisKeyword[] = [];
  const topicSet = new Set<'Java Backend' | 'Spring Boot' | 'Database' | 'Network'>();

  JD_ANALYSIS_KEYWORDS.forEach((item) => {
    const isHit = item.aliases.some((alias) => normalized.includes(alias));
    if (isHit) {
      matchedKeywords.push(item);
      topicSet.add(item.category);
    }
  });

  // Fallback if user typed a short or generic JD
  if (matchedKeywords.length === 0) {
    JD_ANALYSIS_KEYWORDS.forEach((item) => {
      matchedKeywords.push(item);
      topicSet.add(item.category);
    });
  }

  let recommendedLevel: 'Intern' | 'Fresher' | 'Junior' = 'Fresher';
  if (normalized.includes('intern') || normalized.includes('thực tập') || normalized.includes('sinh viên')) {
    recommendedLevel = 'Intern';
  } else if (
    normalized.includes('junior') ||
    normalized.includes('1 năm') ||
    normalized.includes('2 năm') ||
    normalized.includes('1+ year') ||
    normalized.includes('2+ year')
  ) {
    recommendedLevel = 'Junior';
  }

  const readinessChecklist = matchedKeywords.map((k) => k.recommendedFocus);

  return {
    matchedKeywords,
    detectedTopics: Array.from(topicSet),
    recommendedLevel,
    readinessChecklist
  };
}
